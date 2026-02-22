import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC004: ComposeLintRule = {
  id: 'CV-C004',
  title: 'Host PID mode',
  severity: 'error',
  category: 'security',
  explanation:
    'Setting pid: host shares the host PID namespace with the container. Container processes ' +
    'can see and potentially signal all host processes, including those running as root. This ' +
    'breaks process isolation and can be exploited for container escape.',
  fix: {
    description: 'Remove pid: host unless actively debugging host processes',
    beforeCode: 'services:\n  web:\n    pid: host',
    afterCode: 'services:\n  web:\n    # pid: host removed',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'pid') continue;

        if (isScalar(item.value) && String(item.value.value) === 'host') {
          const pos = getNodeLine(item.key, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-C004',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' uses host PID namespace. Container processes can see and signal all host processes.`,
          });
        }
      }
    }

    return violations;
  },
};
