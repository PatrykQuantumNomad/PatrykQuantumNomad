import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC005: ComposeLintRule = {
  id: 'CV-C005',
  title: 'Host IPC mode',
  severity: 'error',
  category: 'security',
  explanation:
    'Setting ipc: host shares the host IPC namespace with the container. This allows the ' +
    'container to access host shared memory segments, semaphores, and message queues. An ' +
    'attacker could use this to read sensitive data from other processes or interfere with ' +
    'host services that use shared memory.',
  fix: {
    description:
      'Remove ipc: host or use ipc: shareable between specific services that need shared memory',
    beforeCode: 'services:\n  web:\n    ipc: host',
    afterCode: 'services:\n  web:\n    ipc: shareable',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'ipc') continue;

        if (isScalar(item.value) && String(item.value.value) === 'host') {
          const pos = getNodeLine(item.key, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-C005',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' uses host IPC namespace. Container can access host shared memory and interfere with host processes.`,
          });
        }
      }
    }

    return violations;
  },
};
