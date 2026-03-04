/**
 * GA-C002: Mutable action tag
 *
 * Flags GitHub Actions that use mutable branch references (@main, @master,
 * @develop, @dev, @HEAD) which point to the latest commit on a branch and
 * can change at any time.
 *
 * Branch refs are even more dangerous than semver tags because they change
 * with every push to the branch, making builds completely non-reproducible.
 */

import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachUsesNode } from './ast-helpers';

/** Matches mutable branch references (case-insensitive) */
const MUTABLE_BRANCH_RE = /^(main|master|develop|dev|HEAD)$/i;

export const GAC002: GhaLintRule = {
  id: 'GA-C002',
  title: 'Mutable action tag',
  severity: 'warning',
  category: 'security',
  explanation:
    'Using a branch ref like @main or @master means the action version changes ' +
    'with every commit to that branch. This makes builds non-reproducible and ' +
    'exposes the workflow to untested or malicious changes. Pin to a commit SHA ' +
    'or at minimum a specific version tag.',
  fix: {
    description: 'Pin the action to a specific commit SHA or version tag',
    beforeCode: 'uses: actions/checkout@main',
    afterCode: 'uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachUsesNode(ctx, (usesValue, node) => {
      const atIndex = usesValue.lastIndexOf('@');
      if (atIndex === -1) return;

      const ref = usesValue.slice(atIndex + 1);
      if (MUTABLE_BRANCH_RE.test(ref)) {
        const pos = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-C002',
          line: pos.line,
          column: pos.col,
          message: `Action '${usesValue}' uses a mutable branch ref '${ref}'. Pin to a commit SHA for reproducible builds.`,
        });
      }
    });

    return violations;
  },
};
