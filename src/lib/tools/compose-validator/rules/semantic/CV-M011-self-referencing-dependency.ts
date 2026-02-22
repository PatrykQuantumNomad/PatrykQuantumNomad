import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import { extractDependsOn } from '../../graph-builder';

export const CVM011: ComposeLintRule = {
  id: 'CV-M011',
  title: 'Self-referencing dependency',
  severity: 'error',
  category: 'semantic',
  explanation:
    'A service lists itself in its own depends_on declaration. A service cannot depend on ' +
    'itself -- this creates an impossible startup condition. Docker Compose will reject ' +
    'the file with a dependency resolution error. Remove the self-reference from depends_on.',
  fix: {
    description: 'Remove the self-referencing entry from depends_on.',
    beforeCode:
      'services:\n  web:\n    depends_on:\n      - web\n      - redis',
    afterCode:
      'services:\n  web:\n    depends_on:\n      - redis',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      const deps = extractDependsOn(serviceNode);

      for (const dep of deps) {
        if (dep.service === serviceName) {
          const depKeyNode = findDependsOnKeyNode(serviceNode);
          const pos = depKeyNode
            ? getNodeLine(depKeyNode, ctx.lineCounter)
            : { line: 1, col: 1 };

          violations.push({
            ruleId: 'CV-M011',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' depends on itself.`,
          });
          break; // Only report once per service
        }
      }
    }

    return violations;
  },
};

function findDependsOnKeyNode(serviceNode: any): any {
  if (!isMap(serviceNode)) return null;
  for (const item of serviceNode.items) {
    if (isPair(item) && isScalar(item.key) && String(item.key.value) === 'depends_on') {
      return item.key;
    }
  }
  return null;
}
