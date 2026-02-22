import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB007: ComposeLintRule = {
  id: 'CV-B007',
  title: 'Missing project name',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Without a top-level "name" field, Docker Compose derives the project name from the ' +
    'directory containing the Compose file. This can lead to unpredictable names when the ' +
    'file is moved or when multiple Compose projects share similar directory structures. ' +
    'Setting an explicit name ensures consistent, portable project naming.',
  fix: {
    description: 'Add a top-level name field to set the project name explicitly',
    beforeCode: 'services:\n  web:\n    image: nginx',
    afterCode: 'name: my-project\nservices:\n  web:\n    image: nginx',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const { doc, lineCounter } = ctx;

    if (!isMap(doc.contents)) return violations;

    let hasName = false;
    let firstKeyNode: any = null;

    for (const item of doc.contents.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;

      if (firstKeyNode === null) {
        firstKeyNode = item.key;
      }

      if (String(item.key.value) === 'name') {
        hasName = true;
        break;
      }
    }

    if (!hasName) {
      const pos = firstKeyNode
        ? getNodeLine(firstKeyNode, lineCounter)
        : { line: 1, col: 1 };
      violations.push({
        ruleId: 'CV-B007',
        line: pos.line,
        column: pos.col,
        message:
          "No top-level 'name' field. Docker Compose derives the project name from the directory name, which may be unpredictable.",
      });
    }

    return violations;
  },
};
