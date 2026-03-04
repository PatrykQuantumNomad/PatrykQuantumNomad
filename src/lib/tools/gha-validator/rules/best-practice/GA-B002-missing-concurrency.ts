/**
 * GA-B002: Missing concurrency group
 *
 * Flags workflows that do not define a top-level `concurrency:` block.
 * Without a concurrency group, multiple workflow runs for the same branch
 * or PR execute simultaneously, wasting runner resources.
 */

import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from '../security/ast-helpers';

export const GAB002: GhaLintRule = {
  id: 'GA-B002',
  title: 'Missing concurrency group',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Without a `concurrency:` group, multiple workflow runs for the same branch or PR ' +
    'execute simultaneously, wasting resources. A concurrency group with ' +
    '`cancel-in-progress: true` automatically cancels outdated runs.',
  fix: {
    description: 'Add a concurrency group to the workflow',
    beforeCode: [
      'name: CI',
      'on: push',
    ].join('\n'),
    afterCode: [
      'name: CI',
      'on: push',
      'concurrency:',
      '  group: ${{ github.workflow }}-${{ github.ref }}',
      '  cancel-in-progress: true',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const concurrency = resolveKey(ctx.doc.contents, 'concurrency');
    if (concurrency === null) {
      return [
        {
          ruleId: 'GA-B002',
          line: 1,
          column: 1,
          message: 'Workflow has no concurrency group. Parallel runs may waste resources.',
        },
      ];
    }
    return [];
  },
};
