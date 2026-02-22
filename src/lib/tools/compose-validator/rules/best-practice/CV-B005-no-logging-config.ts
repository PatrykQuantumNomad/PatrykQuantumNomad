import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB005: ComposeLintRule = {
  id: 'CV-B005',
  title: 'No logging configuration',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Without explicit logging configuration, containers use the Docker daemon default logging ' +
    'driver (typically json-file with no rotation). This can lead to unbounded log file growth ' +
    'consuming disk space. Configuring a logging driver with max-size and max-file options ' +
    'ensures logs are rotated and manageable.',
  fix: {
    description:
      'Add a logging configuration with driver and rotation options',
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode:
      'services:\n  web:\n    image: nginx\n    logging:\n      driver: json-file\n      options:\n        max-size: "10m"\n        max-file: "3"',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasLogging = false;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) === 'logging') {
          hasLogging = true;
          break;
        }
      }

      if (!hasLogging) {
        const serviceNameNode = findServiceNameNode(ctx, serviceName);
        const pos = getNodeLine(serviceNameNode, ctx.lineCounter);
        violations.push({
          ruleId: 'CV-B005',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' has no logging configuration.`,
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
