/**
 * GA-C004: Missing permissions block
 *
 * Flags workflows that have no top-level `permissions` key. Without an
 * explicit permissions block, the GITHUB_TOKEN defaults to the repository's
 * default token permissions, which may be overly broad (especially on
 * repositories created before GitHub's February 2023 default change).
 *
 * Severity is `info` because this is an informational reminder, not a
 * definite vulnerability.
 */

import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from './ast-helpers';

export const GAC004: GhaLintRule = {
  id: 'GA-C004',
  title: 'Missing permissions block',
  severity: 'info',
  category: 'security',
  explanation:
    'Without a top-level `permissions` block, the GITHUB_TOKEN inherits the ' +
    "repository's default permissions. Repositories created before February 2023 " +
    'default to `write-all`. Adding explicit permissions ensures the principle of ' +
    'least privilege regardless of repository settings.',
  fix: {
    description: 'Add a top-level permissions block with minimum required scopes',
    beforeCode: 'name: CI\non: push',
    afterCode: 'name: CI\non: push\npermissions:\n  contents: read',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const permsNode = resolveKey(ctx.doc.contents, 'permissions');

    // If permissions key exists (even as empty object), no violation
    if (permsNode !== null) {
      return [];
    }

    return [
      {
        ruleId: 'GA-C004',
        line: 1,
        column: 1,
        message:
          'Workflow has no top-level `permissions` block. The GITHUB_TOKEN may default to broad permissions depending on repository settings.',
      },
    ];
  },
};
