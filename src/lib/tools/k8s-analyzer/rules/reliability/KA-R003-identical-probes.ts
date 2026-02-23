import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * Recursively stringify an object with sorted keys for stable comparison.
 * Ensures two logically identical objects produce the same string
 * regardless of key insertion order.
 */
function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return String(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  return (
    '{' +
    sorted
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          stableStringify((obj as Record<string, unknown>)[k]),
      )
      .join(',') +
    '}'
  );
}

/**
 * KA-R003: Identical liveness and readiness probes.
 *
 * When both probes are identical, a failing liveness probe will also fail
 * the readiness check, causing the pod to be both killed and removed from
 * service simultaneously. The probes should test different conditions.
 */
export const KAR003: K8sLintRule = {
  id: 'KA-R003',
  title: 'Identical liveness and readiness probes',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The container defines identical liveness and readiness probes. When both ' +
    'probes check the same endpoint with the same parameters, a transient ' +
    'failure causes the pod to be both killed (liveness) and removed from ' +
    'service (readiness) at the same time, reducing self-healing effectiveness.',
  fix: {
    description:
      'Use different endpoints or parameters for liveness and readiness probes',
    beforeCode:
      'livenessProbe:\n  httpGet:\n    path: /healthz\n    port: 8080\nreadinessProbe:\n  httpGet:\n    path: /healthz\n    port: 8080',
    afterCode:
      'livenessProbe:\n  httpGet:\n    path: /healthz\n    port: 8080\n  failureThreshold: 3\nreadinessProbe:\n  httpGet:\n    path: /ready\n    port: 8080\n  failureThreshold: 1',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath, containerType } of containerSpecs) {
        if (containerType !== 'container') continue;

        const liveness = container.livenessProbe as
          | Record<string, unknown>
          | undefined;
        const readiness = container.readinessProbe as
          | Record<string, unknown>
          | undefined;

        if (!liveness || !readiness) continue;

        if (stableStringify(liveness) === stableStringify(readiness)) {
          const node = resolveInstancePath(
            resource.doc,
            `${jsonPath}/livenessProbe`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-R003',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has identical liveness and readiness probes.`,
          });
        }
      }
    }

    return violations;
  },
};
