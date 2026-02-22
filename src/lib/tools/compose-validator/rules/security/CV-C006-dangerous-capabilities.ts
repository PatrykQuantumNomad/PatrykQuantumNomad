import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

const DANGEROUS_CAPS = new Set([
  'SYS_ADMIN',
  'NET_ADMIN',
  'ALL',
  'SYS_PTRACE',
  'SYS_RAWIO',
  'DAC_OVERRIDE',
  'NET_RAW',
]);

export const CVC006: ComposeLintRule = {
  id: 'CV-C006',
  title: 'Dangerous capabilities added',
  severity: 'error',
  category: 'security',
  explanation:
    'Adding dangerous Linux capabilities such as SYS_ADMIN, NET_ADMIN, or ALL significantly ' +
    'weakens container isolation. SYS_ADMIN alone grants nearly all privileged operations. ' +
    'ALL grants every capability, equivalent to privileged mode. CWE-250: Execution with ' +
    'Unnecessary Privileges.',
  fix: {
    description:
      'Remove dangerous capabilities and add only the minimum required capabilities',
    beforeCode:
      'services:\n  web:\n    cap_add:\n      - SYS_ADMIN\n      - NET_ADMIN',
    afterCode:
      'services:\n  web:\n    cap_add:\n      - NET_BIND_SERVICE',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'cap_add') continue;
        if (!isSeq(item.value)) continue;

        for (const capItem of item.value.items) {
          if (!isScalar(capItem)) continue;
          const cap = String(capItem.value).toUpperCase();

          if (DANGEROUS_CAPS.has(cap)) {
            const pos = getNodeLine(capItem, ctx.lineCounter);
            violations.push({
              ruleId: 'CV-C006',
              line: pos.line,
              column: pos.col,
              message: `Service '${serviceName}' adds dangerous capability '${cap}' (CWE-250).`,
            });
          }
        }
      }
    }

    return violations;
  },
};
