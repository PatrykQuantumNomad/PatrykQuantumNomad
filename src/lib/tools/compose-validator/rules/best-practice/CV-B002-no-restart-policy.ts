import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB002: ComposeLintRule = {
  id: 'CV-B002',
  title: 'No restart policy',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Without a restart policy, a crashed container stays stopped until manually restarted. ' +
    'In production, services should automatically recover from crashes. The restart policy ' +
    'can be set via the top-level restart key or through deploy.restart_policy for Swarm-mode ' +
    'compatibility.',
  fix: {
    description:
      'Add restart: unless-stopped or restart: on-failure for automatic crash recovery',
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode: 'services:\n  web:\n    image: nginx\n    restart: unless-stopped',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasRestart = false;
      let hasDeployRestartPolicy = false;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;

        const keyName = String(item.key.value);

        if (keyName === 'restart') {
          hasRestart = true;
        }

        if (keyName === 'deploy' && isMap(item.value)) {
          for (const deployItem of item.value.items) {
            if (!isPair(deployItem) || !isScalar(deployItem.key)) continue;
            if (String(deployItem.key.value) === 'restart_policy') {
              hasDeployRestartPolicy = true;
            }
          }
        }
      }

      if (!hasRestart && !hasDeployRestartPolicy) {
        const serviceNameNode = findServiceNameNode(ctx, serviceName);
        const pos = getNodeLine(serviceNameNode, ctx.lineCounter);
        violations.push({
          ruleId: 'CV-B002',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' has no restart policy.`,
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
