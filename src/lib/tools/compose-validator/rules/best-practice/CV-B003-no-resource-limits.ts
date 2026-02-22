import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB003: ComposeLintRule = {
  id: 'CV-B003',
  title: 'No resource limits',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Without resource limits, a single container can consume all available host CPU and memory, ' +
    'starving other containers and potentially crashing the host. Setting deploy.resources.limits ' +
    'ensures containers have bounded resource consumption and enables fair scheduling across services.',
  fix: {
    description:
      'Add deploy.resources.limits with cpus and memory constraints',
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode:
      'services:\n  web:\n    image: nginx\n    deploy:\n      resources:\n        limits:\n          cpus: "0.50"\n          memory: 512M',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasResourceLimits = false;

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
            if (String(resItem.key.value) === 'limits') {
              hasResourceLimits = true;
            }
          }
        }
      }

      if (!hasResourceLimits) {
        const serviceNameNode = findServiceNameNode(ctx, serviceName);
        const pos = getNodeLine(serviceNameNode, ctx.lineCounter);
        violations.push({
          ruleId: 'CV-B003',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' has no resource limits defined.`,
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
