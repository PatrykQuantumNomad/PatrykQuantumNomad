import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq, Scalar } from 'yaml';
import { getNodeLine } from '../../parser';

export const CVF003: ComposeLintRule = {
  id: 'CV-F003',
  title: 'Inconsistent port quoting',
  severity: 'info',
  category: 'style',
  explanation:
    'A service has a mix of quoted and unquoted port values in its ports list. Inconsistent ' +
    'quoting reduces readability and can lead to confusion about which values are strings and ' +
    'which are interpreted as numbers. Pick one style (preferably quoted) and apply it ' +
    'consistently across all port entries within each service.',
  fix: {
    description: 'Quote all port values consistently.',
    beforeCode:
      'services:\n  web:\n    ports:\n      - "8080:80"\n      - 3000:3000',
    afterCode:
      'services:\n  web:\n    ports:\n      - "8080:80"\n      - "3000:3000"',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'ports') continue;
        if (!isSeq(item.value)) continue;

        // Collect quoting style for each scalar port entry
        let hasQuoted = false;
        let hasUnquoted = false;
        let firstUnquotedNode: any = null;

        for (const portItem of item.value.items) {
          // Skip long-syntax map entries
          if (!isScalar(portItem)) continue;

          const scalarType = (portItem as any).type;
          const isPlain =
            scalarType === Scalar.PLAIN || scalarType === 'PLAIN';

          if (isPlain) {
            hasUnquoted = true;
            if (!firstUnquotedNode) {
              firstUnquotedNode = portItem;
            }
          } else {
            hasQuoted = true;
          }
        }

        // Report if there is a mix of quoted and unquoted
        if (hasQuoted && hasUnquoted && firstUnquotedNode) {
          const pos = getNodeLine(firstUnquotedNode, ctx.lineCounter);
          violations.push({
            ruleId: 'CV-F003',
            line: pos.line,
            column: pos.col,
            message: `Service '${serviceName}' has inconsistent port quoting. Mix of quoted and unquoted port values.`,
          });
        }
      }
    }

    return violations;
  },
};
