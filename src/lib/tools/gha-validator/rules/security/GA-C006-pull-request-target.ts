/**
 * GA-C006: pull_request_target without restrictions
 *
 * Flags workflows that use `on: pull_request_target` without path or branch
 * restrictions. Unlike `pull_request`, `pull_request_target` runs in the
 * context of the *base* repository with write permissions, making it
 * dangerous when triggered by untrusted PRs.
 *
 * The Shai Hulud v2 worm (November 2025) exploited unrestricted
 * pull_request_target to create self-replicating workflows across repos.
 */

import { isMap, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from './ast-helpers';

/** Restriction keys that limit which PRs trigger the workflow */
const RESTRICTION_KEYS = ['paths', 'paths-ignore', 'branches', 'branches-ignore'];

export const GAC006: GhaLintRule = {
  id: 'GA-C006',
  title: 'Unrestricted pull_request_target',
  severity: 'warning',
  category: 'security',
  explanation:
    '`pull_request_target` runs in the context of the base repository with write ' +
    'permissions and access to secrets, even for PRs from forks. Without branch or ' +
    'path restrictions, any fork can trigger this workflow. The Shai Hulud v2 worm ' +
    '(November 2025) exploited this to create self-replicating workflows across ' +
    'repositories. Always add `branches:` or `paths:` filters.',
  fix: {
    description: 'Add branch or path restrictions to pull_request_target',
    beforeCode: 'on:\n  pull_request_target:',
    afterCode: 'on:\n  pull_request_target:\n    branches: [main]',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    const onNode = resolveKey(ctx.doc.contents, 'on');
    if (!onNode) return violations;

    // Case 1: on: { pull_request_target: ... } (Map form)
    if (isMap(onNode)) {
      // resolveKey returns the value node (which may be a Scalar with null value),
      // or null if the key doesn't exist at all
      const prtNode = resolveKey(onNode, 'pull_request_target');
      if (prtNode === null) {
        // pull_request_target is not a key in the on: map -- nothing to flag
        return violations;
      }

      // Key exists. Check if the value is a Map with restriction filters.
      if (isMap(prtNode)) {
        const hasRestriction = RESTRICTION_KEYS.some(
          (key) => resolveKey(prtNode, key) !== null,
        );
        if (!hasRestriction) {
          const pos = getNodeLine(prtNode, ctx.lineCounter);
          violations.push({
            ruleId: 'GA-C006',
            line: pos.line,
            column: pos.col,
            message:
              '`pull_request_target` has no branch or path restrictions. ' +
              'This allows any fork to trigger the workflow with write permissions.',
          });
        }
      } else {
        // Value is a Scalar (null/empty) or other non-Map -- no filters possible
        const pos = getNodeLine(prtNode, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-C006',
          line: pos.line,
          column: pos.col,
          message:
            '`pull_request_target` has no branch or path restrictions. ' +
            'This allows any fork to trigger the workflow with write permissions.',
        });
      }

      return violations;
    }

    // Case 2: on: [pull_request_target, push, ...] (Seq/list form)
    if (isSeq(onNode)) {
      for (const item of onNode.items) {
        if (isScalar(item) && String(item.value) === 'pull_request_target') {
          // In list form, no filters possible
          const pos = getNodeLine(item, ctx.lineCounter);
          violations.push({
            ruleId: 'GA-C006',
            line: pos.line,
            column: pos.col,
            message:
              '`pull_request_target` in shorthand list form cannot have restrictions. ' +
              'Use the map form with `branches:` or `paths:` filters.',
          });
        }
      }
      return violations;
    }

    return violations;
  },
};
