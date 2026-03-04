/**
 * GA-C009: Dangerous token scope combinations
 *
 * Flags dangerous combinations of GITHUB_TOKEN write permissions that
 * together enable privilege escalation or supply chain attacks.
 *
 * Dangerous combos:
 * - contents:write + actions:write -- can modify workflow files AND trigger them
 * - packages:write + contents:write -- supply chain risk (publish packages + modify code)
 * - id-token:write + any other write -- OIDC token can impersonate in conjunction with any write
 *
 * Does NOT flag individual write permissions (those may be legitimately needed).
 */

import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from './ast-helpers';

/** Pairs of scopes that are dangerous together when both are `write`. */
const DANGEROUS_COMBOS: Array<[string, string]> = [
  ['contents', 'actions'],
  ['packages', 'contents'],
];

/**
 * Extract all scopes with `write` value from a permissions Map node.
 * Returns a Set of scope names that have write permission.
 */
function getWriteScopes(permsNode: any): Set<string> {
  const writeScopes = new Set<string>();
  if (!isMap(permsNode)) return writeScopes;

  for (const pair of permsNode.items) {
    if (
      isPair(pair) &&
      isScalar(pair.key) &&
      isScalar(pair.value) &&
      String(pair.value.value) === 'write'
    ) {
      writeScopes.add(String(pair.key.value));
    }
  }

  return writeScopes;
}

/**
 * Check a permissions node for dangerous scope combinations.
 */
function checkPermsNode(
  permsNode: any,
  violations: GhaRuleViolation[],
  lineCounter: any,
): void {
  if (!isMap(permsNode)) return;

  const writeScopes = getWriteScopes(permsNode);

  // Check explicit dangerous combos
  for (const [scope1, scope2] of DANGEROUS_COMBOS) {
    if (writeScopes.has(scope1) && writeScopes.has(scope2)) {
      const pos = getNodeLine(permsNode, lineCounter);
      violations.push({
        ruleId: 'GA-C009',
        line: pos.line,
        column: pos.col,
        message: `Dangerous permission combination: \`${scope1}: write\` + \`${scope2}: write\`. This enables privilege escalation. Split into separate jobs with minimal permissions.`,
      });
    }
  }

  // Check id-token:write + any other write scope
  if (writeScopes.has('id-token') && writeScopes.size > 1) {
    // There's at least one other write scope besides id-token
    const otherScopes = [...writeScopes].filter((s) => s !== 'id-token');
    if (otherScopes.length > 0) {
      const pos = getNodeLine(permsNode, lineCounter);
      violations.push({
        ruleId: 'GA-C009',
        line: pos.line,
        column: pos.col,
        message: `Dangerous permission combination: \`id-token: write\` + \`${otherScopes[0]}: write\`. OIDC tokens combined with write scopes enable impersonation attacks.`,
      });
    }
  }
}

export const GAC009: GhaLintRule = {
  id: 'GA-C009',
  title: 'Dangerous token scope combination',
  severity: 'warning',
  category: 'security',
  explanation:
    'Certain combinations of GITHUB_TOKEN write permissions create escalation paths. ' +
    'For example, `contents: write` + `actions: write` allows modifying workflow files ' +
    'AND triggering them, enabling self-modifying CI attacks. `id-token: write` combined ' +
    'with any write scope allows OIDC impersonation. Split dangerous combinations into ' +
    'separate jobs with minimal required permissions.',
  fix: {
    description: 'Use minimal required permission scopes. Split into separate jobs if different scopes needed.',
    beforeCode:
      'permissions:\n  contents: write\n  actions: write',
    afterCode:
      'jobs:\n  build:\n    permissions:\n      contents: write\n  deploy:\n    permissions:\n      actions: write',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    // Check top-level permissions
    const topPerms = resolveKey(ctx.doc.contents, 'permissions');
    checkPermsNode(topPerms, violations, ctx.lineCounter);

    // Check job-level permissions
    const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
    if (isMap(jobsNode)) {
      for (const jobPair of jobsNode.items) {
        const jobPerms = resolveKey(jobPair.value, 'permissions');
        checkPermsNode(jobPerms, violations, ctx.lineCounter);
      }
    }

    return violations;
  },
};
