/**
 * GA-B008: Missing continue-on-error on network step
 *
 * Flags `run:` steps that invoke network tools (curl, wget, gh api) without
 * setting `continue-on-error: true`. Transient network failures can break
 * an entire workflow when these commands fail.
 */

import { isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachJobNode, forEachStepNode, resolveKey } from '../security/ast-helpers';

/**
 * Conservative keyword patterns for network commands.
 * Each entry is [keyword, display name].
 * We check that the keyword appears at word boundaries (start of string,
 * after newline, or preceded by whitespace).
 */
const NETWORK_PATTERNS: Array<[RegExp, string]> = [
  [/(?:^|\s|;|\||\n)curl(?:\s|\n|$)/m, 'curl'],
  [/(?:^|\s|;|\||\n)wget(?:\s|\n|$)/m, 'wget'],
  [/(?:^|\s|;|\||\n)gh\s+api/m, 'gh api'],
];

export const GAB008: GhaLintRule = {
  id: 'GA-B008',
  title: 'Missing continue-on-error on network step',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Steps that fetch external data (curl, wget) can fail due to transient network ' +
    'issues. Adding `continue-on-error: true` prevents the entire workflow from ' +
    'failing due to a non-critical external request.',
  fix: {
    description: 'Add continue-on-error: true to network steps',
    beforeCode: [
      '- run: curl https://api.example.com',
    ].join('\n'),
    afterCode: [
      '- run: curl https://api.example.com',
      '  continue-on-error: true',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachJobNode(ctx, (_jobName, jobNode) => {
      forEachStepNode(jobNode, (stepNode) => {
        const runNode = resolveKey(stepNode, 'run');
        if (runNode === null || !isScalar(runNode)) return;

        const runValue = String(runNode.value);

        // Check if any network keyword matches
        let matched: string | null = null;
        for (const [pattern, name] of NETWORK_PATTERNS) {
          if (pattern.test(runValue)) {
            matched = name;
            break;
          }
        }
        if (!matched) return;

        // Check if continue-on-error is set
        const continueNode = resolveKey(stepNode, 'continue-on-error');
        if (continueNode !== null) return; // Has continue-on-error, skip

        const pos = getNodeLine(runNode, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-B008',
          line: pos.line,
          column: pos.col,
          message: `Step uses '${matched}' without continue-on-error. Network failures may break the workflow.`,
        });
      });
    });

    return violations;
  },
};
