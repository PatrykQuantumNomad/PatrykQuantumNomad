/**
 * GA-C001: Unpinned action version
 *
 * Flags GitHub Actions that use mutable semver tags (@v4, @v4.0.1)
 * instead of pinning to a full 40-character commit SHA.
 *
 * The tj-actions/changed-files supply chain attack (March 2025) demonstrated
 * how mutable tags allow maintainers to push malicious code to an existing
 * tag, compromising all workflows that reference it.
 */

import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachUsesNode } from './ast-helpers';

/** Matches a 40-character hexadecimal SHA-1 hash */
const SHA_RE = /^[0-9a-f]{40}$/i;

/** Matches semver tags: v1, v2.3, v4.0.1, etc. */
const SEMVER_TAG_RE = /^v\d+(\.\d+)*$/;

export const GAC001: GhaLintRule = {
  id: 'GA-C001',
  title: 'Unpinned action version',
  severity: 'warning',
  category: 'security',
  explanation:
    'Using a mutable version tag like @v4 allows the action maintainer to push ' +
    'breaking changes or malicious code to that tag without your knowledge. Pin to ' +
    'a full commit SHA to ensure immutable, reproducible builds. The tj-actions/changed-files ' +
    'supply chain attack (March 2025) compromised 23,000+ repos via tag mutation.',
  fix: {
    description: 'Pin the action to a specific commit SHA',
    beforeCode: 'uses: actions/checkout@v4',
    afterCode: 'uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachUsesNode(ctx, (usesValue, node) => {
      const atIndex = usesValue.lastIndexOf('@');
      if (atIndex === -1) return;

      const ref = usesValue.slice(atIndex + 1);
      if (SEMVER_TAG_RE.test(ref) && !SHA_RE.test(ref)) {
        const pos = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-C001',
          line: pos.line,
          column: pos.col,
          message: `Action '${usesValue}' uses a mutable semver tag. Pin to a commit SHA for supply-chain safety.`,
        });
      }
    });

    return violations;
  },
};
