import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';
import { WELL_KNOWN_PVCS } from './well-known-resources';

/**
 * KA-X005: PersistentVolumeClaim reference not found in manifest.
 *
 * Scans volumes[*].persistentVolumeClaim.claimName for references
 * to PVCs that are not defined in the manifest.
 */
export const KAX005: K8sLintRule = {
  id: 'KA-X005',
  title: 'PVC reference not found',
  severity: 'info',
  category: 'cross-resource',
  explanation:
    'A workload references a PersistentVolumeClaim that is not defined in the manifest. ' +
    'If the PVC does not exist at deploy time, the Pod will be stuck in Pending state ' +
    'waiting for the volume to become available. This may be expected if the PVC is ' +
    'created separately or by a storage operator.',
  fix: {
    description: 'Add the referenced PVC to the manifest',
    beforeCode:
      'volumes:\n  - name: data\n    persistentVolumeClaim:\n      claimName: app-data',
    afterCode:
      'volumes:\n  - name: data\n    persistentVolumeClaim:\n      claimName: app-data\n---\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: app-data\nspec:\n  accessModes: [ReadWriteOnce]\n  resources:\n    requests:\n      storage: 1Gi',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const { podSpec, podSpecPath } = pod;

      const volumes = podSpec.volumes as Record<string, unknown>[] | undefined;
      if (!Array.isArray(volumes)) continue;

      for (let i = 0; i < volumes.length; i++) {
        const pvc = volumes[i].persistentVolumeClaim as Record<string, unknown> | undefined;
        const claimName = pvc?.claimName as string | undefined;
        if (!claimName || WELL_KNOWN_PVCS.has(claimName)) continue;

        if (!ctx.registry.getByName('PersistentVolumeClaim', resource.namespace, claimName)) {
          const jsonPath = `${podSpecPath}/volumes/${i}/persistentVolumeClaim/claimName`;
          const node = resolveInstancePath(resource.doc, jsonPath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-X005',
            line,
            column: col,
            message: `${resource.kind} '${resource.name}' references PVC '${claimName}' which is not defined in the manifest (namespace '${resource.namespace}').`,
          });
        }
      }
    }

    return violations;
  },
};
