import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec, getContainerSpecs } from '../../container-helpers';
import { WELL_KNOWN_CONFIGMAPS } from './well-known-resources';

/**
 * KA-X003: ConfigMap reference not found in manifest.
 *
 * Scans three reference locations: volumes, envFrom, and env.valueFrom.
 * Deduplicates by name per resource to avoid noisy repeated violations.
 */
export const KAX003: K8sLintRule = {
  id: 'KA-X003',
  title: 'ConfigMap reference not found',
  severity: 'info',
  category: 'cross-resource',
  explanation:
    'A workload references a ConfigMap that is not defined in the manifest. ' +
    'If the ConfigMap does not exist at deploy time, the Pod will fail to start ' +
    'with a CreateContainerConfigError. This may be expected if the ConfigMap is ' +
    'created out-of-band or by an operator.',
  fix: {
    description: 'Add the referenced ConfigMap to the manifest',
    beforeCode:
      'volumes:\n  - name: config\n    configMap:\n      name: app-config',
    afterCode:
      'volumes:\n  - name: config\n    configMap:\n      name: app-config\n---\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\ndata:\n  key: value',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const { podSpec, podSpecPath } = pod;
      // Track seen names per resource for deduplication
      const seen = new Map<string, { line: number; col: number; jsonPath: string }>();

      // 1. volumes[*].configMap.name
      const volumes = podSpec.volumes as Record<string, unknown>[] | undefined;
      if (Array.isArray(volumes)) {
        for (let i = 0; i < volumes.length; i++) {
          const cm = volumes[i].configMap as Record<string, unknown> | undefined;
          const name = cm?.name as string | undefined;
          if (!name || WELL_KNOWN_CONFIGMAPS.has(name) || seen.has(name)) continue;

          if (!ctx.registry.getByName('ConfigMap', resource.namespace, name)) {
            const jsonPath = `${podSpecPath}/volumes/${i}/configMap/name`;
            const node = resolveInstancePath(resource.doc, jsonPath);
            const { line, col } = getNodeLine(node, ctx.lineCounter);
            seen.set(name, { line, col, jsonPath });
          }
        }
      }

      // 2. container.envFrom[*].configMapRef.name
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath: containerPath } of containerSpecs) {
        const envFrom = container.envFrom as Record<string, unknown>[] | undefined;
        if (Array.isArray(envFrom)) {
          for (let i = 0; i < envFrom.length; i++) {
            const ref = envFrom[i].configMapRef as Record<string, unknown> | undefined;
            const name = ref?.name as string | undefined;
            if (!name || WELL_KNOWN_CONFIGMAPS.has(name) || seen.has(name)) continue;

            if (!ctx.registry.getByName('ConfigMap', resource.namespace, name)) {
              const jsonPath = `${containerPath}/envFrom/${i}/configMapRef/name`;
              const node = resolveInstancePath(resource.doc, jsonPath);
              const { line, col } = getNodeLine(node, ctx.lineCounter);
              seen.set(name, { line, col, jsonPath });
            }
          }
        }

        // 3. container.env[*].valueFrom.configMapKeyRef.name
        const env = container.env as Record<string, unknown>[] | undefined;
        if (Array.isArray(env)) {
          for (let i = 0; i < env.length; i++) {
            const valueFrom = env[i].valueFrom as Record<string, unknown> | undefined;
            const ref = valueFrom?.configMapKeyRef as Record<string, unknown> | undefined;
            const name = ref?.name as string | undefined;
            if (!name || WELL_KNOWN_CONFIGMAPS.has(name) || seen.has(name)) continue;

            if (!ctx.registry.getByName('ConfigMap', resource.namespace, name)) {
              const jsonPath = `${containerPath}/env/${i}/valueFrom/configMapKeyRef/name`;
              const node = resolveInstancePath(resource.doc, jsonPath);
              const { line, col } = getNodeLine(node, ctx.lineCounter);
              seen.set(name, { line, col, jsonPath });
            }
          }
        }
      }

      // Emit one violation per unique ConfigMap name
      for (const [name, { line, col }] of seen) {
        violations.push({
          ruleId: 'KA-X003',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' references ConfigMap '${name}' which is not defined in the manifest (namespace '${resource.namespace}').`,
        });
      }
    }

    return violations;
  },
};
