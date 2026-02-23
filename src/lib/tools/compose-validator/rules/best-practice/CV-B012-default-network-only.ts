import { isMap, isPair, isScalar } from 'yaml';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB012: ComposeLintRule = {
  id: 'CV-B012',
  title: 'Default network only',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'When no custom networks are defined, all services share the default bridge network. ' +
    'With multiple services, this means every container can reach every other container, ' +
    'which violates the principle of least privilege for network access. Custom networks ' +
    'enable micro-segmentation so that only services that need to communicate share a network.',
  fix: {
    description:
      'Define custom networks for logical grouping and isolate services that should not communicate directly',
    beforeCode:
      'services:\n  web:\n    image: nginx\n  db:\n    image: postgres',
    afterCode:
      'services:\n  web:\n    image: nginx\n    networks:\n      - frontend\n  db:\n    image: postgres\n    networks:\n      - backend\nnetworks:\n  frontend:\n  backend:',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    // Only fire when there are 2+ services
    if (ctx.services.size < 2) return violations;

    // Don't fire when there are custom networks defined
    if (ctx.networks.size > 0) return violations;

    // Don't fire when any service uses network_mode: host
    for (const [, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;
      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'network_mode') continue;
        if (isScalar(item.value) && String(item.value.value) === 'host') {
          return violations; // Service uses host networking, skip this rule
        }
      }
    }

    // Report on line 1 (file-level issue)
    violations.push({
      ruleId: 'CV-B012',
      line: 1,
      column: 1,
      message:
        'No custom networks defined. All services share the default network.',
    });

    return violations;
  },
};
