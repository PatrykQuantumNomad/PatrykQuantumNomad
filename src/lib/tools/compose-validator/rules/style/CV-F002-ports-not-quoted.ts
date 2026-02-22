import type { ComposeLintRule, ComposeRuleContext, ComposeRuleViolation } from '../../types';
import { isMap, isPair, isScalar, isSeq, Scalar } from 'yaml';
import { getNodeLine } from '../../parser';

export const CVF002: ComposeLintRule = {
  id: 'CV-F002',
  title: 'Ports not quoted (YAML base-60 risk)',
  severity: 'info',
  category: 'style',
  explanation:
    'Port values that contain a colon are not quoted in the YAML source. In YAML 1.1, unquoted ' +
    'values like 3000:80 can be interpreted as sexagesimal (base-60) numbers, leading to ' +
    'unexpected integer conversion. While Docker Compose typically handles this correctly, ' +
    'quoting port strings (e.g., "3000:80") is a defensive best practice that avoids ambiguity ' +
    'across different YAML parsers and tools.',
  fix: {
    description: 'Quote all port values, e.g., "8080:80" instead of 8080:80.',
    beforeCode: 'services:\n  web:\n    ports:\n      - 8080:80',
    afterCode: 'services:\n  web:\n    ports:\n      - "8080:80"',
  },

  check(ctx: ComposeRuleContext): ComposeRuleViolation[] {
    const violations: ComposeRuleViolation[] = [];

    for (const [serviceName, serviceNode] of ctx.services) {
      if (!isMap(serviceNode)) continue;

      for (const item of serviceNode.items) {
        if (!isPair(item) || !isScalar(item.key)) continue;
        if (String(item.key.value) !== 'ports') continue;
        if (!isSeq(item.value)) continue;

        for (const portItem of item.value.items) {
          // Skip long-syntax map entries
          if (!isScalar(portItem)) continue;

          const portStr = String(portItem.value);
          // Only flag ports with colons (host:container mappings are at risk)
          if (!portStr.includes(':')) continue;

          // Check if the scalar is unquoted (PLAIN type)
          const scalarType = (portItem as any).type;
          if (scalarType === Scalar.PLAIN || scalarType === 'PLAIN') {
            const pos = getNodeLine(portItem, ctx.lineCounter);
            violations.push({
              ruleId: 'CV-F002',
              line: pos.line,
              column: pos.col,
              message: `Port '${portStr}' in service '${serviceName}' is not quoted. Unquoted port values risk YAML sexagesimal (base-60) interpretation.`,
            });
          }
        }
      }
    }

    return violations;
  },
};
