import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC010: ComposeLintRule = {
  id: 'CV-C010',
  title: 'Missing no-new-privileges',
  severity: 'warning',
  category: 'security',
  explanation:
    'Without the no-new-privileges security option, processes inside the container can gain ' +
    'additional privileges through setuid/setgid binaries. An attacker could exploit a ' +
    'setuid binary to escalate from an unprivileged user to root within the container.',
  fix: {
    description:
      'Add no-new-privileges to security_opt to prevent privilege escalation',
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode:
      'services:\n  web:\n    image: nginx\n    security_opt:\n      - no-new-privileges:true',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasNoNewPrivileges = false;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'security_opt') continue;
        if (!isSeq(item.value)) continue;

        for (const optItem of item.value.items) {
          if (!isScalar(optItem)) continue;
          const opt = String(optItem.value);
          if (
            opt === 'no-new-privileges:true' ||
            opt === 'no-new-privileges=true'
          ) {
            hasNoNewPrivileges = true;
            break;
          }
        }
      }

      if (!hasNoNewPrivileges) {
        const serviceNameNode = findServiceNameNode(ctx, serviceName);
        const pos = getNodeLine(serviceNameNode, ctx.lineCounter);
        violations.push({
          ruleId: 'CV-C010',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' does not set no-new-privileges. This allows processes to gain additional privileges via setuid/setgid.`,
        });
      }
    }

    return violations;
  },
};

function findServiceNameNode(
  ctx: ComposeRuleContext,
  serviceName: string,
): any {
  const { doc } = ctx;
  if (!isMap(doc.contents)) return null;

  for (const topItem of doc.contents.items) {
    if (!isPair(topItem) || !isScalar(topItem.key)) continue;
    if (String(topItem.key.value) !== 'services') continue;
    if (!isMap(topItem.value)) continue;

    for (const svcItem of topItem.value.items) {
      if (!isPair(svcItem) || !isScalar(svcItem.key)) continue;
      if (String(svcItem.key.value) === serviceName) {
        return svcItem.key;
      }
    }
  }

  return null;
}
