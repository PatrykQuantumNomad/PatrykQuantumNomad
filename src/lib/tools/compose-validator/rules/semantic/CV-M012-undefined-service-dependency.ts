import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import { extractDependsOn } from '../../graph-builder';

export const CVM012: ComposeLintRule = {
  id: 'CV-M012',
  title: 'Dependency on undefined service',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A service depends_on references a service that is not defined in the services section. ' +
    'Docker Compose will fail at startup when it cannot find the referenced service. ' +
    'Check for typos in the service name or add the missing service definition.',
  fix: {
    description: 'Fix the service name typo or add the missing service.',
    beforeCode:
      'services:\n  web:\n    depends_on:\n      - databse  # typo',
    afterCode:
      'services:\n  web:\n    depends_on:\n      - database\n  database:\n    image: postgres',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const definedServices = new Set(ctx.services.keys());

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      // Find the depends_on value node for precise line reporting
      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'depends_on') continue;

        const value = item.value;

        // Short form: depends_on: [redis, db]
        if (isSeq(value)) {
          for (const entry of value.items) {
            if (!isScalar(entry)) continue;
            const target = String(entry.value);
            if (!definedServices.has(target)) {
              const pos = getNodeLine(entry, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M012',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' depends on undefined service '${target}'.`,
              });
            }
          }
        }

        // Long form: depends_on: { redis: { condition: ... } }
        if (isMap(value)) {
          for (const depItem of value.items) {
            if (!isPair(depItem) || !isScalar(depItem.key)) continue;
            const target = String(depItem.key.value);
            if (!definedServices.has(target)) {
              const pos = getNodeLine(depItem.key, ctx.lineCounter);
              violations.push({
                ruleId: 'CV-M012',
                line: pos.line,
                column: pos.col,
                message: `Service '${serviceName}' depends on undefined service '${target}'.`,
              });
            }
          }
        }

        break;
      }
    }

    return violations;
  },
};
