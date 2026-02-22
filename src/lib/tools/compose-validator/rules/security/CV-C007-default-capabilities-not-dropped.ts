import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC007: ComposeLintRule = {
  id: 'CV-C007',
  title: 'Default capabilities not dropped',
  severity: 'warning',
  category: 'security',
  explanation:
    'Docker containers start with a default set of Linux capabilities that are often more ' +
    'than needed. Best practice is to drop all capabilities with cap_drop: [ALL] and then ' +
    'selectively add back only the capabilities the container actually needs. This follows ' +
    'the principle of least privilege.',
  fix: {
    description:
      "Add cap_drop: [ALL] and explicitly add back only needed capabilities",
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode:
      'services:\n  web:\n    image: nginx\n    cap_drop:\n      - ALL\n    cap_add:\n      - NET_BIND_SERVICE',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasCapDropAll = false;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'cap_drop') continue;
        if (!isSeq(item.value)) continue;

        for (const capItem of item.value.items) {
          if (
            isScalar(capItem) &&
            String(capItem.value).toUpperCase() === 'ALL'
          ) {
            hasCapDropAll = true;
            break;
          }
        }
      }

      if (!hasCapDropAll) {
        // Report on the service name node -- find it in the parent services map
        const serviceNameNode = findServiceNameNode(ctx, serviceName);
        const pos = getNodeLine(serviceNameNode, ctx.lineCounter);
        violations.push({
          ruleId: 'CV-C007',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' does not drop default capabilities. Add 'cap_drop: [ALL]' and explicitly add back only needed capabilities.`,
        });
      }
    }

    return violations;
  },
};

/** Find the AST key node for a service name in ctx.doc */
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
