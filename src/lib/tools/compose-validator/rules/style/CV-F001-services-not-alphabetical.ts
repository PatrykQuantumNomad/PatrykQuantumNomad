import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';

export const CVF001: ComposeLintRule = {
  id: 'CV-F001',
  title: 'Services not alphabetically ordered',
  severity: 'info',
  category: 'style',
  explanation:
    'Service definitions are not listed in alphabetical order. While Docker Compose does not ' +
    'require any particular ordering, alphabetical ordering makes it easier to locate services ' +
    'in large compose files and produces more predictable diffs in version control. This is a ' +
    'stylistic recommendation and does not affect runtime behavior.',
  fix: {
    description: 'Reorder services alphabetically for readability.',
    beforeCode:
      'services:\n  web:\n    image: nginx\n  api:\n    image: node\n  db:\n    image: postgres',
    afterCode:
      'services:\n  api:\n    image: node\n  db:\n    image: postgres\n  web:\n    image: nginx',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const contents = ctx.doc.contents;

    if (!isMap(contents)) return violations;

    // Find the 'services' top-level key
    for (const topItem of contents.items) {
      if (!isPair(topItem) || !isScalar(topItem.key)) continue;
      if (String(topItem.key.value) !== 'services') continue;

      const servicesMap = topItem.value;
      if (!isMap(servicesMap)) break;

      // Extract service key names in document order
      const serviceNames: string[] = [];
      const serviceNodes: any[] = [];

      for (const item of servicesMap.items) {
        if (isPair(item) && isScalar(item.key)) {
          serviceNames.push(String(item.key.value));
          serviceNodes.push(item.key);
        }
      }

      // Compare against sorted copy
      const sorted = [...serviceNames].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      );

      for (let i = 0; i < serviceNames.length; i++) {
        if (serviceNames[i] !== sorted[i]) {
          const pos = getNodeLine(serviceNodes[i], ctx.lineCounter);
          violations.push({
            ruleId: 'CV-F001',
            line: pos.line,
            column: pos.col,
            message: `Services are not in alphabetical order. Found '${serviceNames[i]}' where '${sorted[i]}' was expected.`,
          });
          break; // Report only the first out-of-order service
        }
      }

      break;
    }

    return violations;
  },
};
