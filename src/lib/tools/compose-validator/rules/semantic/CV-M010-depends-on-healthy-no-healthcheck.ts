import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import { extractDependsOn } from '../../graph-builder';

export const CVM010: ComposeLintRule = {
  id: 'CV-M010',
  title: 'depends_on service_healthy without healthcheck',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A service uses depends_on with condition: service_healthy, but the target service ' +
    'does not define a healthcheck. Docker Compose will wait indefinitely for the target ' +
    'to become healthy, effectively hanging the startup. Either add a healthcheck to the ' +
    'target service or change the condition to service_started.',
  fix: {
    description: 'Add a healthcheck to the target service or use service_started condition.',
    beforeCode:
      'services:\n  web:\n    depends_on:\n      db:\n        condition: service_healthy\n  db:\n    image: postgres',
    afterCode:
      'services:\n  web:\n    depends_on:\n      db:\n        condition: service_healthy\n  db:\n    image: postgres\n    healthcheck:\n      test: ["CMD-SHELL", "pg_isready"]\n      interval: 10s\n      timeout: 5s\n      retries: 5',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      const deps = extractDependsOn(serviceNode);

      for (const dep of deps) {
        if (dep.condition !== 'service_healthy') continue;

        const targetNode = ctx.services.get(dep.service);
        if (!targetNode) continue; // Undefined service caught by CV-M012

        // Check if target has a healthcheck key
        const hasHealthcheck = serviceHasKey(targetNode, 'healthcheck');
        if (hasHealthcheck) continue;

        // Find the depends_on key for line reporting
        const depKeyNode = findDependsOnKeyNode(serviceNode);
        const pos = depKeyNode
          ? getNodeLine(depKeyNode, ctx.lineCounter)
          : { line: 1, col: 1 };

        violations.push({
          ruleId: 'CV-M010',
          line: pos.line,
          column: pos.col,
          message: `Service '${serviceName}' depends on '${dep.service}' with condition service_healthy, but '${dep.service}' has no healthcheck.`,
        });
      }
    }

    return violations;
  },
};

function serviceHasKey(serviceNode: any, keyName: string): boolean {
  if (!isMap(serviceNode)) return false;
  for (const item of serviceNode.items) {
    if (isPair(item) && isScalar(item.key) && String(item.key.value) === keyName) {
      return true;
    }
  }
  return false;
}

function findDependsOnKeyNode(serviceNode: any): any {
  if (!isMap(serviceNode)) return null;
  for (const item of serviceNode.items) {
    if (isPair(item) && isScalar(item.key) && String(item.key.value) === 'depends_on') {
      return item.key;
    }
  }
  return null;
}
