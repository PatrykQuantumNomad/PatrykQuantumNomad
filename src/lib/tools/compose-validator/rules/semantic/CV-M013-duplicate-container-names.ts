import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';

export const CVM013: ComposeLintRule = {
  id: 'CV-M013',
  title: 'Duplicate container names',
  severity: 'error',
  category: 'semantic',
  explanation:
    'Two or more services use the same container_name. Docker container names must be unique ' +
    'on a host. When multiple services specify the same container_name, Docker Compose will ' +
    'fail to start with a naming conflict. Either remove explicit container_name values ' +
    '(letting Compose generate unique names) or assign unique names to each service.',
  fix: {
    description: 'Use unique container names or remove explicit naming.',
    beforeCode:
      'services:\n  web:\n    container_name: app\n  api:\n    container_name: app',
    afterCode:
      'services:\n  web:\n    container_name: app-web\n  api:\n    container_name: app-api',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const seen = new Map<string, string>(); // container_name -> first service

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'container_name') continue;
        if (!isScalar(item.value)) continue;

        const containerName = String(item.value.value);
        const existingService = seen.get(containerName);

        if (existingService) {
          const pos = getNodeLine(item.value, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-M013',
            line: pos.line,
            column: pos.col,
            message: `Container name '${containerName}' is used by both service '${existingService}' and '${serviceName}'.`,
          });
        } else {
          seen.set(containerName, serviceName);
        }
      }
    }

    return violations;
  },
};
