import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC001: ComposeLintRule = {
  id: 'CV-C001',
  title: 'Privileged mode enabled',
  severity: 'error',
  category: 'security',
  explanation:
    'Running a container in privileged mode grants it all Linux kernel capabilities and ' +
    'access to host devices. This effectively disables container isolation and allows the ' +
    'container to do almost anything the host can do. An attacker who compromises a privileged ' +
    'container gains full root access to the host system. CWE-250: Execution with Unnecessary ' +
    'Privileges.',
  fix: {
    description:
      'Remove privileged: true and use specific capabilities via cap_add instead',
    beforeCode: 'services:\n  web:\n    privileged: true',
    afterCode: 'services:\n  web:\n    cap_add:\n      - NET_BIND_SERVICE',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'privileged') continue;

        if (isScalar(item.value) && item.value.value === true) {
          const pos = getNodeLine(item.key, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-C001',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' runs in privileged mode. This disables container isolation and grants full host access (CWE-250).`,
          });
        }
      }
    }

    return violations;
  },
};
