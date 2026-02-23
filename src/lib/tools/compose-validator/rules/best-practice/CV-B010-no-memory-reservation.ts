import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB010: ComposeLintRule = {
  id: 'CV-B010',
  title: 'No memory reservation alongside limits',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'When a container has memory limits but no memory reservation, the scheduler cannot ' +
    'differentiate between the minimum memory needed to function and the maximum allowed. ' +
    'Memory reservations enable graceful scheduling: the orchestrator guarantees the ' +
    'reserved amount and allows bursting up to the limit when resources are available.',
  fix: {
    description:
      'Add deploy.resources.reservations.memory alongside the existing memory limit',
    beforeCode:
      'services:\n  web:\n    deploy:\n      resources:\n        limits:\n          memory: 512M',
    afterCode:
      'services:\n  web:\n    deploy:\n      resources:\n        limits:\n          memory: 512M\n        reservations:\n          memory: 256M',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasMemoryLimit = false;
      let hasMemoryReservation = false;
      let limitsNode: any = null;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'deploy') continue;
        if (!isMap(item.value)) continue;

        for (const deployItem of item.value.items) {
          if (!isPair(deployItem) || !isScalar(deployItem.key)) continue;
          if (String(deployItem.key.value) !== 'resources') continue;
          if (!isMap(deployItem.value)) continue;

          for (const resItem of deployItem.value.items) {
            if (!isPair(resItem) || !isScalar(resItem.key)) continue;

            if (String(resItem.key.value) === 'limits' && isMap(resItem.value)) {
              limitsNode = resItem.key;
              for (const limitItem of resItem.value.items) {
                if (!isPair(limitItem) || !isScalar(limitItem.key)) continue;
                if (String(limitItem.key.value) === 'memory') {
                  hasMemoryLimit = true;
                }
              }
            }

            if (String(resItem.key.value) === 'reservations' && isMap(resItem.value)) {
              for (const reserveItem of resItem.value.items) {
                if (!isPair(reserveItem) || !isScalar(reserveItem.key)) continue;
                if (String(reserveItem.key.value) === 'memory') {
                  hasMemoryReservation = true;
                }
              }
            }
          }
        }
      }

      if (hasMemoryLimit && !hasMemoryReservation && limitsNode) {
        const pos = getNodeLine(limitsNode, ctx.lineCounter);
        violations.push({
          ruleId: 'CV-B010',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' sets memory limits without memory reservations.`,
        });
      }
    }

    return violations;
  },
};
