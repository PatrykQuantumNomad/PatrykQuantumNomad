/**
 * GA-F003: Step name exceeds 80 characters
 *
 * Flags steps whose `name:` value is longer than 80 characters. Long
 * step names truncate in the GitHub Actions UI and make logs harder to
 * scan. Keep names concise and move details to comments or the step body.
 */

import { isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachJobNode, forEachStepNode, resolveKey } from '../security/ast-helpers';

const MAX_STEP_NAME_LENGTH = 80;

export const GAF003: GhaLintRule = {
  id: 'GA-F003',
  title: 'Step name exceeds 80 characters',
  severity: 'info',
  category: 'style',
  explanation:
    'Step names longer than 80 characters truncate in the GitHub Actions UI ' +
    'and reduce log readability. Keep names short and descriptive; move details ' +
    'to comments or the step body.',
  fix: {
    description: 'Shorten the step name to 80 characters or fewer',
    beforeCode: [
      'steps:',
      '  - name: Run the comprehensive integration test suite against the staging database with full logging enabled',
      '    run: npm run test:integration',
    ].join('\n'),
    afterCode: [
      'steps:',
      '  - name: Run integration tests (staging)',
      '    run: npm run test:integration',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachJobNode(ctx, (jobName, jobNode) => {
      forEachStepNode(jobNode, (stepNode) => {
        const nameNode = resolveKey(stepNode, 'name');
        if (nameNode === null || !isScalar(nameNode)) return;

        const nameValue = String(nameNode.value);
        if (nameValue.length > MAX_STEP_NAME_LENGTH) {
          const pos = getNodeLine(nameNode, ctx.lineCounter);
          violations.push({
            ruleId: 'GA-F003',
            line: pos.line,
            column: pos.col,
            message: `Step name is ${nameValue.length} characters (max ${MAX_STEP_NAME_LENGTH}). Shorten for better UI readability.`,
          });
        }
      });
    });

    return violations;
  },
};
