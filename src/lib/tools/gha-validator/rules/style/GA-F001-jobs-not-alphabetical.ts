/**
 * GA-F001: Jobs not alphabetically ordered
 *
 * Flags workflows where the `jobs:` keys are not in alphabetical order.
 * Only fires when there are 2 or more jobs -- single-job workflows are
 * trivially ordered. Reports the first out-of-order key only to avoid
 * noisy output on large workflows.
 *
 * Alphabetical ordering makes large workflow files easier to navigate
 * and produces more predictable diffs in version control.
 */

import { isMap, isScalar, isPair } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from '../security/ast-helpers';

export const GAF001: GhaLintRule = {
  id: 'GA-F001',
  title: 'Jobs not alphabetically ordered',
  severity: 'info',
  category: 'style',
  explanation:
    'Alphabetical job ordering makes large workflow files easier to navigate ' +
    'and produces more predictable diffs in version control. When jobs are ' +
    'sorted consistently, reviewers can find specific jobs quickly without ' +
    'scanning the entire file.',
  fix: {
    description: 'Reorder jobs alphabetically',
    beforeCode: [
      'jobs:',
      '  deploy:',
      '    ...',
      '  build:',
      '    ...',
    ].join('\n'),
    afterCode: [
      'jobs:',
      '  build:',
      '    ...',
      '  deploy:',
      '    ...',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
    if (!isMap(jobsNode)) return [];

    // Collect job key names and their AST nodes
    const jobKeys: { name: string; node: any }[] = [];
    for (const pair of jobsNode.items) {
      if (isPair(pair) && isScalar(pair.key)) {
        jobKeys.push({ name: String(pair.key.value), node: pair.key });
      }
    }

    // Only check when 2+ jobs exist
    if (jobKeys.length < 2) return [];

    // Create sorted copy and find first mismatch
    const sorted = [...jobKeys.map((k) => k.name)].sort((a, b) =>
      a.localeCompare(b),
    );

    for (let i = 0; i < jobKeys.length; i++) {
      if (jobKeys[i].name !== sorted[i]) {
        const pos = getNodeLine(jobKeys[i].node, ctx.lineCounter);
        return [
          {
            ruleId: 'GA-F001',
            line: pos.line,
            column: pos.col,
            message: `Jobs are not in alphabetical order. Found '${jobKeys[i].name}' where '${sorted[i]}' was expected.`,
          },
        ];
      }
    }

    return [];
  },
};
