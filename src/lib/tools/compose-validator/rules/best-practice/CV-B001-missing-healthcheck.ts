import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB001: ComposeLintRule = {
  id: 'CV-B001',
  title: 'Missing healthcheck',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Without a healthcheck, Docker has no way to determine if the application inside the ' +
    'container is actually functioning correctly. A container can be "running" with a crashed ' +
    'application process. Healthchecks enable automatic restart of unhealthy containers and ' +
    'proper depends_on with condition: service_healthy.',
  fix: {
    description:
      'Add a healthcheck with test, interval, timeout, and retries',
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode:
      'services:\n  web:\n    image: nginx\n    healthcheck:\n      test: ["CMD", "curl", "-f", "http://localhost"]\n      interval: 30s\n      timeout: 10s\n      retries: 3',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      let hasHealthcheck = false;
      let isDisabled = false;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'healthcheck') continue;

        hasHealthcheck = true;

        // Check for explicit disable: healthcheck: { disable: true }
        if (isMap(item.value)) {
          for (const hcItem of item.value.items) {
            if (!isPair(hcItem) || !isScalar(hcItem.key)) continue;
            if (
              String(hcItem.key.value) === 'disable' &&
              isScalar(hcItem.value) &&
              hcItem.value.value === true
            ) {
              isDisabled = true;
            }
          }
        }
      }

      // Skip services with explicit healthcheck (even disabled ones, that is an opt-out)
      if (hasHealthcheck) continue;

      const serviceNameNode = findServiceNameNode(ctx, serviceName);
      const pos = getNodeLine(serviceNameNode, ctx.lineCounter);
      violations.push({
        ruleId: 'CV-B001',
        line: pos.line,
        column: pos.col,
        message: `Service '${serviceName}' has no healthcheck defined.`,
      });
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
