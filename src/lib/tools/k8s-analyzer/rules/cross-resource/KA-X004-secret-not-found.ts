import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec, getContainerSpecs } from '../../container-helpers';
import { WELL_KNOWN_SECRETS } from './well-known-resources';

/**
 * KA-X004: Secret reference not found in manifest.
 *
 * Scans three reference locations: volumes (secretName), envFrom, and env.valueFrom.
 * CRITICAL: Volume secrets use `secret.secretName` (not `secret.name`).
 * Deduplicates by name per resource to avoid noisy repeated violations.
 */
export const KAX004: K8sLintRule = {
  id: 'KA-X004',
  title: 'Secret reference not found',
  severity: 'info',
  category: 'cross-resource',
  explanation:
    'A workload references a Secret that is not defined in the manifest. ' +
    'If the Secret does not exist at deploy time, the Pod will fail to start ' +
    'with a CreateContainerConfigError. This may be expected if the Secret is ' +
    'created out-of-band (e.g., sealed-secrets, external-secrets).',
  fix: {
    description: 'Add the referenced Secret to the manifest',
    beforeCode:
      'volumes:\n  - name: creds\n    secret:\n      secretName: db-creds',
    afterCode:
      'volumes:\n  - name: creds\n    secret:\n      secretName: db-creds\n---\napiVersion: v1\nkind: Secret\nmetadata:\n  name: db-creds\ndata:\n  password: cGFzc3dvcmQ=',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const { podSpec, podSpecPath } = pod;
      // Track seen names per resource for deduplication
      const seen = new Map<string, { line: number; col: number }>();

      // 1. volumes[*].secret.secretName (NOT secret.name!)
      const volumes = podSpec.volumes as Record<string, unknown>[] | undefined;
      if (Array.isArray(volumes)) {
        for (let i = 0; i < volumes.length; i++) {
          const secret = volumes[i].secret as Record<string, unknown> | undefined;
          const name = secret?.secretName as string | undefined;
          if (!name || WELL_KNOWN_SECRETS.has(name) || seen.has(name)) continue;

          if (!ctx.registry.getByName('Secret', resource.namespace, name)) {
            const jsonPath = `${podSpecPath}/volumes/${i}/secret/secretName`;
            const node = resolveInstancePath(resource.doc, jsonPath);
            const { line, col } = getNodeLine(node, ctx.lineCounter);
            seen.set(name, { line, col });
          }
        }
      }

      // 2. container.envFrom[*].secretRef.name
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath: containerPath } of containerSpecs) {
        const envFrom = container.envFrom as Record<string, unknown>[] | undefined;
        if (Array.isArray(envFrom)) {
          for (let i = 0; i < envFrom.length; i++) {
            const ref = envFrom[i].secretRef as Record<string, unknown> | undefined;
            const name = ref?.name as string | undefined;
            if (!name || WELL_KNOWN_SECRETS.has(name) || seen.has(name)) continue;

            if (!ctx.registry.getByName('Secret', resource.namespace, name)) {
              const jsonPath = `${containerPath}/envFrom/${i}/secretRef/name`;
              const node = resolveInstancePath(resource.doc, jsonPath);
              const { line, col } = getNodeLine(node, ctx.lineCounter);
              seen.set(name, { line, col });
            }
          }
        }

        // 3. container.env[*].valueFrom.secretKeyRef.name
        const env = container.env as Record<string, unknown>[] | undefined;
        if (Array.isArray(env)) {
          for (let i = 0; i < env.length; i++) {
            const valueFrom = env[i].valueFrom as Record<string, unknown> | undefined;
            const ref = valueFrom?.secretKeyRef as Record<string, unknown> | undefined;
            const name = ref?.name as string | undefined;
            if (!name || WELL_KNOWN_SECRETS.has(name) || seen.has(name)) continue;

            if (!ctx.registry.getByName('Secret', resource.namespace, name)) {
              const jsonPath = `${containerPath}/env/${i}/valueFrom/secretKeyRef/name`;
              const node = resolveInstancePath(resource.doc, jsonPath);
              const { line, col } = getNodeLine(node, ctx.lineCounter);
              seen.set(name, { line, col });
            }
          }
        }
      }

      // Emit one violation per unique Secret name
      for (const [name, { line, col }] of seen) {
        violations.push({
          ruleId: 'KA-X004',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' references Secret '${name}' which is not defined in the manifest (namespace '${resource.namespace}').`,
        });
      }
    }

    return violations;
  },
};
