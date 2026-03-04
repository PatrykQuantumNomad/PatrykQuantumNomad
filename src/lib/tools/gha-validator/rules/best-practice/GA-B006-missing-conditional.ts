/**
 * GA-B006: Missing conditional on PR workflow
 *
 * In workflows triggered only by `pull_request` or `pull_request_target`,
 * per-job conditionals can prevent unnecessary work (e.g., skip deployment
 * on draft PRs). Only flagged when the workflow has 2+ jobs.
 */

import { isMap, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachJobNode, resolveKey } from '../security/ast-helpers';

const PR_TRIGGERS = new Set(['pull_request', 'pull_request_target']);

/**
 * Determine if the workflow is PR-only (all triggers are PR-related).
 */
function isPrOnlyWorkflow(ctx: GhaRuleContext): boolean {
  const onNode = resolveKey(ctx.doc.contents, 'on');
  if (onNode === null) return false;

  // Scalar: on: pull_request
  if (isScalar(onNode)) {
    return PR_TRIGGERS.has(String(onNode.value));
  }

  // Map: on: { pull_request: ..., pull_request_target: ... }
  if (isMap(onNode)) {
    if (onNode.items.length === 0) return false;
    return onNode.items.every(
      (pair: any) => isScalar(pair.key) && PR_TRIGGERS.has(String(pair.key.value)),
    );
  }

  return false;
}

export const GAB006: GhaLintRule = {
  id: 'GA-B006',
  title: 'Missing conditional on PR workflow',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'In workflows triggered only by `pull_request` or `pull_request_target`, ' +
    'per-job conditionals can prevent unnecessary work (e.g., skip deployment on ' +
    'draft PRs). Only flagged when the workflow has 2+ jobs.',
  fix: {
    description: 'Add an if: conditional to each job',
    beforeCode: [
      'jobs:',
      '  deploy:',
      '    runs-on: ubuntu-latest',
    ].join('\n'),
    afterCode: [
      'jobs:',
      '  deploy:',
      '    if: github.event.pull_request.draft == false',
      '    runs-on: ubuntu-latest',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    if (!isPrOnlyWorkflow(ctx)) return [];

    // Count jobs
    const jobs: Array<{ name: string; node: any; keyNode: any }> = [];
    forEachJobNode(ctx, (jobName, jobNode, jobKeyNode) => {
      jobs.push({ name: jobName, node: jobNode, keyNode: jobKeyNode });
    });

    if (jobs.length < 2) return [];

    const violations: GhaRuleViolation[] = [];
    for (const job of jobs) {
      const ifNode = resolveKey(job.node, 'if');
      if (ifNode === null) {
        const pos = getNodeLine(job.keyNode, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-B006',
          line: pos.line,
          column: pos.col,
          message: `Job '${job.name}' has no 'if:' conditional in a PR-only workflow.`,
        });
      }
    }

    return violations;
  },
};
