import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC012: ComposeLintRule = {
  id: 'CV-C012',
  title: 'Seccomp profile disabled',
  severity: 'warning',
  category: 'security',
  explanation:
    'Seccomp (secure computing mode) restricts which system calls a container can make. ' +
    'Docker applies a default seccomp profile that blocks ~44 dangerous syscalls. Disabling ' +
    'it with seccomp:unconfined removes this protection, allowing the container to make any ' +
    'system call, increasing the attack surface for kernel exploits.',
  fix: {
    description:
      'Remove seccomp:unconfined or use a custom seccomp profile instead',
    beforeCode:
      'services:\n  web:\n    security_opt:\n      - seccomp:unconfined',
    afterCode:
      'services:\n  web:\n    security_opt:\n      - seccomp:./seccomp-profile.json',
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
          if (opt === 'seccomp:unconfined' || opt === 'seccomp=unconfined') {
            const pos = getNodeLine(optItem, ctx.lineCounter);
            violations.push({
              ruleId: 'CV-C012',
              line: pos.line,
              column: pos.col,
              message: `Service '${serviceName}' disables seccomp profile. This removes syscall filtering protections.`,
            });
          }
        }
      }
    }

    return violations;
  },
};
