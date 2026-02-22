import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC003: ComposeLintRule = {
  id: 'CV-C003',
  title: 'Host network mode',
  severity: 'error',
  category: 'security',
  explanation:
    'Using network_mode: host bypasses Docker network isolation entirely. The container ' +
    'shares the host network namespace, meaning all host ports are accessible to the container ' +
    'and vice versa. This eliminates network-level container isolation and can expose services ' +
    'that should only be available on the host.',
  fix: {
    description:
      'Use user-defined bridge networks for service-to-service communication',
    beforeCode: 'services:\n  web:\n    network_mode: host',
    afterCode:
      'services:\n  web:\n    networks:\n      - frontend\nnetworks:\n  frontend:',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'network_mode') continue;

        if (isScalar(item.value) && String(item.value.value) === 'host') {
          const pos = getNodeLine(item.key, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-C003',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' uses host network mode. This bypasses Docker network isolation, exposing all host ports to the container.`,
          });
        }
      }
    }

    return violations;
  },
};
