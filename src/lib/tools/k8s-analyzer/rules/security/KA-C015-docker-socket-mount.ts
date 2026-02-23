import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-C015: Docker socket mounted.
 *
 * CIS Benchmark control. Mounting the Docker socket gives the container full
 * control over the Docker daemon, enabling container escape, image manipulation,
 * and host compromise. This is a specific high-severity check separate from
 * KA-C014's general sensitive path check.
 */
export const KAC015: K8sLintRule = {
  id: 'KA-C015',
  title: 'Docker socket mounted',
  severity: 'error',
  category: 'security',
  explanation:
    'A hostPath volume mounts the Docker socket (/var/run/docker.sock). This gives ' +
    'the container full control over the Docker daemon, enabling container escape, ' +
    'image manipulation, and host compromise. CIS Benchmark recommends against this.',
  fix: {
    description: 'Remove the Docker socket mount; use the Kubernetes API instead',
    beforeCode:
      'volumes:\n  - name: docker-sock\n    hostPath:\n      path: /var/run/docker.sock',
    afterCode:
      'volumes:\n  - name: app-data\n    emptyDir: {}',
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

        const normalized = mountPath.replace(/\/+$/, '');
        if (normalized === '/var/run/docker.sock') {
          const node = resolveInstancePath(
            resource.doc,
            `${pod.podSpecPath}/volumes/${i}/hostPath/path`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C015',
            line,
            column: col,
            message: `${resource.kind} '${resource.name}' mounts the Docker socket (/var/run/docker.sock). This grants full Docker daemon access.`,
          });
        }
      }
    }

    return violations;
  },
};
