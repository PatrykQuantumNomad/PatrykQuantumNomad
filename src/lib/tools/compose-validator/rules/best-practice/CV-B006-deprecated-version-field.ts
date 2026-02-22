import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type {
  ComposeLintRule,
  ComposeRuleContext,
  ComposeRuleViolation,
} from '../../types';

export const CVB006: ComposeLintRule = {
  id: 'CV-B006',
  title: 'Deprecated version field',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'The top-level "version" field was used in Docker Compose V1 to specify the Compose file ' +
    'format version. Docker Compose V2 no longer requires or uses this field -- it is silently ' +
    'ignored. Keeping it adds confusion and suggests the file targets an older format.',
  fix: {
    description: 'Remove the top-level version field entirely',
    beforeCode: 'version: "3.8"\nservices:\n  web:\n    image: nginx',
    afterCode: 'services:\n  web:\n    image: nginx',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];
    const { doc, lineCounter } = ctx;

    if (!isMap(doc.contents)) return violations;

    for (const item of doc.contents.items) {
      if (!isPair(item) || !isScalar(item.key)) continue;
      if (String(item.key.value) === 'version') {
        const pos = getNodeLine(item.key, lineCounter);
        violations.push({
          ruleId: 'CV-B006',
          line: pos.line,
          column: pos.col,
          message:
            "The top-level 'version' field is deprecated. Docker Compose V2 ignores it.",
        });
      }
    }

    return violations;
  },
};
