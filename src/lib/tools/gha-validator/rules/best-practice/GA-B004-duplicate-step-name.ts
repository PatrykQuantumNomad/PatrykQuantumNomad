/**
 * GA-B004: Duplicate step name
 *
 * Flags multiple steps within the same job that share the same `name:`.
 * Duplicate names make GitHub Actions logs confusing and difficult to debug.
 */

import { isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachJobNode, forEachStepNode, resolveKey } from '../security/ast-helpers';

export const GAB004: GhaLintRule = {
  id: 'GA-B004',
  title: 'Duplicate step name',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Multiple steps with the same name in a job make logs confusing. Each step ' +
    'name should be unique within its job to aid debugging and identification.',
  fix: {
    description: 'Give each step a unique name',
    beforeCode: [
      'steps:',
      '  - name: Run tests',
      '    run: npm test',
      '  - name: Run tests',
      '    run: npm run e2e',
    ].join('\n'),
    afterCode: [
      'steps:',
      '  - name: Run unit tests',
      '    run: npm test',
      '  - name: Run integration tests',
      '    run: npm run e2e',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachJobNode(ctx, (jobName, jobNode) => {
      const seen = new Map<string, number>(); // name -> first step index

      forEachStepNode(jobNode, (stepNode, stepIndex) => {
        const nameNode = resolveKey(stepNode, 'name');
        if (nameNode === null || !isScalar(nameNode)) return;

        const name = String(nameNode.value);
        if (seen.has(name)) {
          const pos = getNodeLine(nameNode, ctx.lineCounter);
          violations.push({
            ruleId: 'GA-B004',
            line: pos.line,
            column: pos.col,
            message: `Step name '${name}' is duplicated in job '${jobName}'.`,
          });
        } else {
          seen.set(name, stepIndex);
        }
      });
    });

    return violations;
  },
};
