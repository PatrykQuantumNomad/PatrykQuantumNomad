import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVC011: ComposeLintRule = {
  id: 'CV-C011',
  title: 'Writable root filesystem',
  severity: 'warning',
  category: 'security',
  explanation:
    'By default, a container has a writable root filesystem. If an attacker gains access ' +
    'to the container, they can modify binaries, install tools, or tamper with application ' +
    'files. Setting read_only: true makes the root filesystem read-only, forcing writable ' +
    'paths to be explicitly declared as tmpfs or volume mounts.',
  fix: {
    description:
      'Set read_only: true and use tmpfs mounts for paths that need to be writable',
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode:
      'services:\n  web:\n    image: nginx\n    read_only: true\n    tmpfs:\n      - /tmp\n      - /var/run',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasReadOnly = false;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'read_only') continue;

        if (isScalar(item.value) && item.value.value === true) {
          hasReadOnly = true;
        }
      }

      if (!hasReadOnly) {
        const serviceNameNode = findServiceNameNode(ctx, serviceName);
        const pos = getNodeLine(serviceNameNode, ctx.lineCounter);
        violations.push({
          ruleId: 'CV-C011',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' has a writable root filesystem. Set 'read_only: true' and use tmpfs for writable paths.`,
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
