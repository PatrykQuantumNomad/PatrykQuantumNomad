/**
 * GA-C003: Overly permissive permissions
 *
 * Flags workflows that use `permissions: write-all` which grants the
 * GITHUB_TOKEN write access to all scopes. This violates the principle
 * of least privilege and increases the blast radius of any compromise.
 *
 * Checks both top-level and per-job permissions blocks.
 */

import { isMap, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from './ast-helpers';

export const GAC003: GhaLintRule = {
  id: 'GA-C003',
  title: 'Overly permissive permissions',
  severity: 'warning',
  category: 'security',
  explanation:
    'Using `permissions: write-all` grants the GITHUB_TOKEN write access to every ' +
    'scope (contents, packages, actions, etc.). If the workflow is compromised via ' +
    'script injection or a malicious action, the attacker gains write access to the ' +
    'entire repository. Always specify the minimum required permissions per scope.',
  fix: {
    description: 'Replace write-all with specific scope permissions',
    beforeCode: 'permissions: write-all',
    afterCode: 'permissions:\n  contents: read\n  pull-requests: write',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    // Check top-level permissions
    const topPerms = resolveKey(ctx.doc.contents, 'permissions');
    if (topPerms && isScalar(topPerms) && String(topPerms.value) === 'write-all') {
      const pos = getNodeLine(topPerms, ctx.lineCounter);
      violations.push({
        ruleId: 'GA-C003',
        line: pos.line,
        column: pos.col,
        message: 'Workflow uses `permissions: write-all`. Specify minimum required scopes instead.',
      });
    }

    // Check each job's permissions
    const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
    if (isMap(jobsNode)) {
      for (const jobPair of jobsNode.items) {
        const jobPerms = resolveKey(jobPair.value, 'permissions');
        if (jobPerms && isScalar(jobPerms) && String(jobPerms.value) === 'write-all') {
          const pos = getNodeLine(jobPerms, ctx.lineCounter);
          violations.push({
            ruleId: 'GA-C003',
            line: pos.line,
            column: pos.col,
            message: 'Job uses `permissions: write-all`. Specify minimum required scopes instead.',
          });
        }
      }
    }

    return violations;
  },
};
