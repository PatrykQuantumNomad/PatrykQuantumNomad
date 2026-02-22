import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC013: ComposeLintRule = {
  id: 'CV-C013',
  title: 'SELinux labeling disabled',
  severity: 'warning',
  category: 'security',
  explanation:
    'SELinux provides mandatory access controls that confine container processes to specific ' +
    'resources. Disabling SELinux labeling with label:disable removes this additional layer ' +
    'of isolation. On SELinux-enabled hosts, this weakens the security boundary between the ' +
    'container and the host.',
  fix: {
    description:
      'Remove label:disable or use a custom SELinux label appropriate for the workload',
    beforeCode:
      'services:\n  web:\n    security_opt:\n      - label:disable',
    afterCode:
      'services:\n  web:\n    security_opt:\n      - label:type:container_t',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'security_opt') continue;
        if (!isSeq(item.value)) continue;

        for (const optItem of item.value.items) {
          if (!isScalar(optItem)) continue;
          const opt = String(optItem.value);
          if (opt === 'label:disable' || opt === 'label=disable') {
            const pos = getNodeLine(optItem, ctx.lineCounter);
            violations.push({
              ruleId: 'CV-C013',
              line: pos.line,
              column: pos.col,
              message: `Service '${serviceName}' disables SELinux labeling.`,
            });
          }
        }
      }
    }

    return violations;
  },
};
