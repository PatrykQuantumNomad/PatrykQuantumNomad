/**
 * GA-B003: Unnamed step
 *
 * Flags `run:` steps that do not have a `name:` field. Steps without
 * names are hard to identify in the GitHub Actions UI. Steps using
 * `uses:` are self-documenting and excluded from this check.
 */

import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachJobNode, forEachStepNode, resolveKey } from '../security/ast-helpers';

export const GAB003: GhaLintRule = {
  id: 'GA-B003',
  title: 'Unnamed step',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Steps with `run:` commands but no `name:` field are hard to identify in the ' +
    'GitHub Actions UI. Named steps improve log readability and debugging. Steps ' +
    'using `uses:` are self-documenting and excluded from this check.',
  fix: {
    description: 'Add a descriptive name to each run step',
    beforeCode: [
      'steps:',
      '  - run: npm test',
    ].join('\n'),
    afterCode: [
      'steps:',
      '  - name: Run tests',
      '    run: npm test',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachJobNode(ctx, (jobName, jobNode) => {
      forEachStepNode(jobNode, (stepNode) => {
        const runNode = resolveKey(stepNode, 'run');
        if (runNode === null) return; // Not a run: step (skip uses: steps)

        const nameNode = resolveKey(stepNode, 'name');
        if (nameNode === null) {
          const pos = getNodeLine(runNode, ctx.lineCounter);
          violations.push({
            ruleId: 'GA-B003',
            line: pos.line,
            column: pos.col,
            message: `Unnamed 'run:' step in job '${jobName}'. Add a 'name:' for better log readability.`,
          });
        }
      });
    });

    return violations;
  },
};
