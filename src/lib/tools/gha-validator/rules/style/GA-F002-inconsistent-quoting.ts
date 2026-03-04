/**
 * GA-F002: Inconsistent uses: quoting
 *
 * Flags workflows where `uses:` values have inconsistent quoting style.
 * Uses the yaml library's Scalar.type to detect PLAIN, QUOTE_SINGLE,
 * and QUOTE_DOUBLE styles. Reports ONE violation on a non-majority node
 * to suggest consistency.
 *
 * Consistent quoting improves readability and reduces noise in diffs.
 */

import { isMap, isScalar, isPair, isSeq, Scalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from '../security/ast-helpers';

/** Human-readable label for each Scalar type */
function quoteLabel(type: Scalar.Type | null | undefined): string {
  switch (type) {
    case Scalar.QUOTE_SINGLE:
      return 'single quotes';
    case Scalar.QUOTE_DOUBLE:
      return 'double quotes';
    case Scalar.PLAIN:
      return 'no quotes';
    default:
      return 'unknown';
  }
}

export const GAF002: GhaLintRule = {
  id: 'GA-F002',
  title: 'Inconsistent uses: quoting',
  severity: 'info',
  category: 'style',
  explanation:
    'Mixing quoting styles (plain, single-quoted, double-quoted) across ' +
    '`uses:` values creates visual inconsistency. Pick one style and use it ' +
    'consistently for cleaner diffs and easier scanning.',
  fix: {
    description: 'Use a consistent quoting style across all uses: values',
    beforeCode: [
      'steps:',
      "  - uses: actions/checkout@v4",
      "  - uses: 'actions/setup-node@v4'",
    ].join('\n'),
    afterCode: [
      'steps:',
      '  - uses: actions/checkout@v4',
      '  - uses: actions/setup-node@v4',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
    if (!isMap(jobsNode)) return [];

    // Collect all uses: Scalar nodes with their quoting style
    const entries: { type: Scalar.Type; node: any }[] = [];

    for (const jobPair of jobsNode.items) {
      if (!isPair(jobPair) || !isScalar(jobPair.key)) continue;
      const stepsNode = resolveKey(jobPair.value, 'steps');
      if (!isSeq(stepsNode)) continue;

      for (const step of stepsNode.items) {
        if (!isMap(step)) continue;
        for (const stepPair of step.items) {
          if (!isPair(stepPair) || !isScalar(stepPair.key)) continue;
          if (String(stepPair.key.value) === 'uses' && isScalar(stepPair.value)) {
            const val = String(stepPair.value.value);
            // Skip local and docker actions
            if (val.startsWith('docker://') || val.startsWith('./')) continue;
            const scalarType = stepPair.value.type as Scalar.Type;
            if (scalarType) {
              entries.push({ type: scalarType, node: stepPair.value });
            }
          }
        }
      }
    }

    // Need at least 2 uses: values to compare
    if (entries.length < 2) return [];

    // Count occurrences of each style
    const counts = new Map<Scalar.Type, number>();
    for (const entry of entries) {
      counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
    }

    // If all same style, no violation
    if (counts.size <= 1) return [];

    // Find majority style
    let majorityType = entries[0].type;
    let majorityCount = 0;
    for (const [type, count] of counts) {
      if (count > majorityCount) {
        majorityCount = count;
        majorityType = type;
      }
    }

    // Find first non-majority entry
    for (const entry of entries) {
      if (entry.type !== majorityType) {
        const pos = getNodeLine(entry.node, ctx.lineCounter);
        return [
          {
            ruleId: 'GA-F002',
            line: pos.line,
            column: pos.col,
            message: `Inconsistent uses: quoting. This value uses ${quoteLabel(entry.type)} but ${quoteLabel(majorityType)} is used elsewhere.`,
          },
        ];
      }
    }

    return [];
  },
};
