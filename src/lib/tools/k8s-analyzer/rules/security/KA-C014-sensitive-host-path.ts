import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * Sensitive host paths that should not be mounted into containers.
 * Source: Elastic SIEM detection rules, CIS Kubernetes Benchmark 5.x
 */
const SENSITIVE_HOST_PATHS = [
  '/',
  '/etc',
  '/proc',
  '/sys',
  '/dev',
  '/boot',
  '/root',
  '/home',
  '/var/run',
  '/var/lib/kubelet',
  '/var/lib/docker',
  '/var/lib/containerd',
  '/var/log',
];

/** Check if a path matches a sensitive host path (exact or prefix). */
function isSensitiveHostPath(path: string): string | null {
  const normalized = path.replace(/\/+$/, ''); // strip trailing slashes
  for (const sensitive of SENSITIVE_HOST_PATHS) {
    if (normalized === sensitive || normalized.startsWith(sensitive + '/')) {
      return sensitive;
    }
  }
  return null;
}

/**
 * KA-C014: Sensitive host path mounted.
 *
 * PSS Baseline profile restricts hostPath volumes. Mounting sensitive host
 * directories gives containers direct access to system files, potentially
 * enabling container escape or host compromise.
 */
export const KAC014: K8sLintRule = {
  id: 'KA-C014',
  title: 'Sensitive host path mounted',
  severity: 'error',
  category: 'security',
  explanation:
    'A hostPath volume mounts a sensitive host directory into the container. ' +
    'This provides direct access to system files, configuration, or runtime data, ' +
    'potentially enabling container escape or host compromise. ' +
    'PSS Baseline profile restricts hostPath volumes.',
  fix: {
    description: 'Use emptyDir, configMap, secret, or PVC instead of hostPath',
    beforeCode:
      'volumes:\n  - name: host-etc\n    hostPath:\n      path: /etc',
    afterCode:
      'volumes:\n  - name: config\n    configMap:\n      name: app-config',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const volumes = pod.podSpec.volumes as Record<string, unknown>[] | undefined;
      if (!Array.isArray(volumes)) continue;

      for (let i = 0; i < volumes.length; i++) {
        const volume = volumes[i];
        const hostPath = volume.hostPath as Record<string, unknown> | undefined;
        if (!hostPath) continue;

        const mountPath = hostPath.path as string | undefined;
        if (typeof mountPath !== 'string') continue;

        const matchedSensitive = isSensitiveHostPath(mountPath);
        if (matchedSensitive) {
          const node = resolveInstancePath(
            resource.doc,
            `${pod.podSpecPath}/volumes/${i}/hostPath/path`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C014',
            line,
            column: col,
            message: `${resource.kind} '${resource.name}' mounts sensitive host path '${mountPath}' (matches '${matchedSensitive}') (PSS Baseline violation).`,
          });
        }
      }
    }

    return violations;
  },
};
