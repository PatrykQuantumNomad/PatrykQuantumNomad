/**
 * GA-C008: Third-party action without SHA pinning
 *
 * Flags third-party actions (not from `actions/` or `github/` orgs) that
 * are not pinned to a 40-character commit SHA.
 *
 * This differs from GA-C001 (unpinned semver tag):
 * - GA-C001 flags FIRST-party semver tags (mutability concern)
 * - GA-C008 flags ANY third-party ref that isn't a SHA (supply chain concern)
 *
 * Third-party actions are inherently higher risk because the maintainers
 * are not GitHub employees and may have less stringent security practices.
 */

import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachUsesNode } from './ast-helpers';

/** Matches a 40-character hexadecimal SHA-1 hash */
const SHA_RE = /^[0-9a-f]{40}$/i;

/** First-party GitHub action organizations */
const FIRST_PARTY_PREFIXES = ['actions/', 'github/'];

export const GAC008: GhaLintRule = {
  id: 'GA-C008',
  title: 'Third-party action without SHA pinning',
  severity: 'warning',
  category: 'security',
  explanation:
    'Third-party actions from organizations outside `actions/` and `github/` have ' +
    'a higher supply chain risk. A compromised tag or branch ref can inject ' +
    'malicious code into your workflow. Pin third-party actions to a full 40-character ' +
    'commit SHA to ensure immutable, auditable builds.',
  fix: {
    description: 'Pin third-party action to full commit SHA',
    beforeCode: 'uses: third-party/action@v2',
    afterCode: 'uses: third-party/action@a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2 # v2',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachUsesNode(ctx, (usesValue, node) => {
      // Skip first-party actions
      if (FIRST_PARTY_PREFIXES.some((prefix) => usesValue.startsWith(prefix))) {
        return;
      }

      const atIndex = usesValue.lastIndexOf('@');
      if (atIndex === -1) return; // No ref at all (shouldn't happen after forEachUsesNode filter)

      const ref = usesValue.slice(atIndex + 1);
      if (!SHA_RE.test(ref)) {
        const pos = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-C008',
          line: pos.line,
          column: pos.col,
          message: `Third-party action '${usesValue}' is not pinned to a commit SHA. Pin to a full SHA for supply-chain safety.`,
        });
      }
    });

    return violations;
  },
};
