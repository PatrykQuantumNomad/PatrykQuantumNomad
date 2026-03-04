/**
 * GA-B007: Outdated action version
 *
 * Flags well-known GitHub Actions that are 2+ major versions behind
 * the current release. Using outdated major versions may miss important
 * security fixes, performance improvements, and Node.js runtime updates.
 */

import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachUsesNode } from '../security/ast-helpers';

// Last verified: 2026-03-04
const KNOWN_CURRENT_VERSIONS: Record<string, number> = {
  'actions/checkout': 4,
  'actions/setup-node': 4,
  'actions/setup-python': 5,
  'actions/setup-java': 4,
  'actions/setup-go': 5,
  'actions/upload-artifact': 4,
  'actions/download-artifact': 4,
  'actions/cache': 4,
  'actions/github-script': 7,
  'github/codeql-action': 3,
};

const MAJOR_RE = /^v(\d+)/;

/**
 * Parse a `uses:` value into the action name and major version.
 * Returns null if the format is unrecognised.
 *
 * Example: "actions/checkout@v4" -> { action: "actions/checkout", major: 4 }
 */
function parseUsesVersion(usesValue: string): { action: string; major: number } | null {
  const atIndex = usesValue.lastIndexOf('@');
  if (atIndex === -1) return null;

  const action = usesValue.slice(0, atIndex);
  const ref = usesValue.slice(atIndex + 1);
  const match = MAJOR_RE.exec(ref);
  if (!match) return null;

  return { action, major: Number(match[1]) };
}

export const GAB007: GhaLintRule = {
  id: 'GA-B007',
  title: 'Outdated action version',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Using outdated major versions of well-known GitHub Actions may miss important ' +
    'security fixes, performance improvements, and Node.js runtime updates. GitHub ' +
    'deprecated Node 16 action runners in 2024 and Node 20 follows in late 2026.',
  fix: {
    description: 'Update the action to the current major version',
    beforeCode: 'uses: actions/checkout@v2',
    afterCode: 'uses: actions/checkout@v4',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachUsesNode(ctx, (usesValue, node) => {
      const parsed = parseUsesVersion(usesValue);
      if (!parsed) return;

      const current = KNOWN_CURRENT_VERSIONS[parsed.action];
      if (current === undefined) return; // Not a known action

      if (current - parsed.major >= 2) {
        const pos = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-B007',
          line: pos.line,
          column: pos.col,
          message: `Action '${usesValue}' is outdated. Current major version is v${current}.`,
        });
      }
    });

    return violations;
  },
};
