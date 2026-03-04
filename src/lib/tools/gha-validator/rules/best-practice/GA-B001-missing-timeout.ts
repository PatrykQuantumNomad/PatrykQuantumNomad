/**
 * GA-B001: Missing timeout-minutes
 *
 * Flags jobs that do not set an explicit `timeout-minutes` value.
 * Without it, GitHub Actions defaults to 360 minutes (6 hours).
 * A hung job consumes runner resources for hours before failing.
 */

import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachJobNode, resolveKey } from '../security/ast-helpers';

export const GAB001: GhaLintRule = {
  id: 'GA-B001',
  title: 'Missing timeout-minutes',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Jobs without timeout-minutes default to 360 minutes (6 hours). A hung job ' +
    'consumes runner resources for hours. Always set an explicit timeout ' +
    '(typically 5-30 minutes for CI builds).',
  fix: {
    description: 'Add timeout-minutes to each job',
    beforeCode: [
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
    ].join('\n'),
    afterCode: [
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    timeout-minutes: 30',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    forEachJobNode(ctx, (jobName, jobNode, jobKeyNode) => {
      const timeout = resolveKey(jobNode, 'timeout-minutes');
      if (timeout === null) {
        const pos = getNodeLine(jobKeyNode, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-B001',
          line: pos.line,
          column: pos.col,
          message: `Job '${jobName}' has no timeout-minutes. Default is 360 minutes (6 hours).`,
        });
      }
    });

    return violations;
  },
};
