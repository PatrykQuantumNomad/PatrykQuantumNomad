import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * PSS Baseline allowed capabilities.
 * Any capability NOT in this set is a Baseline violation when added.
 * Source: https://kubernetes.io/docs/concepts/security/pod-security-standards/
 */
const PSS_BASELINE_ALLOWED_CAPS = new Set([
  'AUDIT_WRITE',
  'CHOWN',
  'DAC_OVERRIDE',
  'FOWNER',
  'FSETID',
  'KILL',
  'MKNOD',
  'NET_BIND_SERVICE',
  'SETFCAP',
  'SETGID',
  'SETPCAP',
  'SETUID',
  'SYS_CHROOT',
]);

/**
 * KA-C010: Dangerous capabilities added.
 *
 * PSS Baseline/Restricted profiles restrict which Linux capabilities can be added.
 * Capabilities like SYS_ADMIN, NET_RAW, and ALL grant excessive host-level access.
 */
export const KAC010: K8sLintRule = {
  id: 'KA-C010',
  title: 'Dangerous capabilities added',
  severity: 'error',
  category: 'security',
  explanation:
    'The container adds Linux capabilities that are not in the PSS Baseline allowed set. ' +
    'Capabilities like SYS_ADMIN, NET_RAW, and ALL grant excessive privileges that can ' +
    'lead to container breakout. PSS Baseline profile restricts capabilities.add to a safe subset.',
  fix: {
    description: 'Remove dangerous capabilities from securityContext.capabilities.add',
    beforeCode:
      'securityContext:\n  capabilities:\n    add:\n      - SYS_ADMIN\n      - NET_RAW',
    afterCode:
      'securityContext:\n  capabilities:\n    drop:\n      - ALL',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;
        const caps = sc?.capabilities as Record<string, unknown> | undefined;
        const addList = caps?.add as string[] | undefined;
        if (!Array.isArray(addList)) continue;

        for (let i = 0; i < addList.length; i++) {
          const cap = String(addList[i]).toUpperCase();
          if (!PSS_BASELINE_ALLOWED_CAPS.has(cap)) {
            const node = resolveInstancePath(
              resource.doc,
              `${jsonPath}/securityContext/capabilities/add/${i}`,
            );
            const { line, col } = getNodeLine(node, ctx.lineCounter);
            violations.push({
              ruleId: 'KA-C010',
              line,
              column: col,
              message: `Container '${container.name}' in ${resource.kind} '${resource.name}' adds dangerous capability '${cap}' (PSS Baseline violation).`,
            });
          }
        }
      }
    }

    return violations;
  },
};
