/**
 * GA-F004: Missing workflow name
 *
 * Flags workflows that do not have a top-level `name:` field. Without
 * a name, GitHub uses the workflow filename, which is often less
 * descriptive (e.g., "ci.yml" instead of "CI Pipeline").
 */

import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from '../security/ast-helpers';

export const GAF004: GhaLintRule = {
  id: 'GA-F004',
  title: 'Missing workflow name',
  severity: 'info',
  category: 'style',
  explanation:
    'Without a top-level `name:` field, GitHub displays the workflow filename ' +
    '(e.g., "ci.yml") in the Actions tab. A descriptive name like "CI Pipeline" ' +
    'makes it easier to identify workflows at a glance.',
  fix: {
    description: 'Add a descriptive name at the top of the workflow',
    beforeCode: [
      'on: push',
      'jobs:',
      '  build: ...',
    ].join('\n'),
    afterCode: [
      'name: CI Pipeline',
      'on: push',
      'jobs:',
      '  build: ...',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const nameNode = resolveKey(ctx.doc.contents, 'name');
    if (nameNode === null) {
      return [
        {
          ruleId: 'GA-F004',
          line: 1,
          column: 1,
          message: "Workflow is missing a top-level 'name:' field. Add one for better identification in the GitHub Actions UI.",
        },
      ];
    }
    return [];
  },
};
