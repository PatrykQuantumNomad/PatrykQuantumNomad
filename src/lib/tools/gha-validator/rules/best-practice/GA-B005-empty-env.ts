/**
 * GA-B005: Empty env block
 *
 * Flags empty `env:` blocks at workflow, job, or step level.
 * Empty env blocks add noise without setting any variables.
 */

import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { forEachJobNode, forEachStepNode, resolveKey } from '../security/ast-helpers';

/**
 * Check if an env node is "empty": a Map with no items, or null/undefined value.
 */
function isEmptyEnv(envNode: any): boolean {
  if (envNode === null || envNode === undefined) return false; // no env key at all
  if (isMap(envNode) && envNode.items.length === 0) return true;
  return false;
}

/**
 * Resolve the key node (Pair.key) for a given key name from a Map node.
 * Used to get line position of the `env` key itself.
 */
function resolveKeyNode(node: any, key: string): any {
  if (!isMap(node)) return null;
  for (const pair of node.items) {
    if (isPair(pair) && isScalar(pair.key) && String(pair.key.value) === key) {
      return pair.key;
    }
  }
  return null;
}

export const GAB005: GhaLintRule = {
  id: 'GA-B005',
  title: 'Empty env block',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'Empty `env:` blocks add noise to workflow files without setting any variables. ' +
    'Remove them or add the intended environment variables.',
  fix: {
    description: 'Remove the empty env block or add variables',
    beforeCode: 'env: {}',
    afterCode: [
      'env:',
      '  NODE_ENV: production',
    ].join('\n'),
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    // Check workflow-level env
    const topEnv = resolveKey(ctx.doc.contents, 'env');
    if (isEmptyEnv(topEnv)) {
      const keyNode = resolveKeyNode(ctx.doc.contents, 'env');
      const pos = keyNode ? getNodeLine(keyNode, ctx.lineCounter) : { line: 1, col: 1 };
      violations.push({
        ruleId: 'GA-B005',
        line: pos.line,
        column: pos.col,
        message: 'Empty env block at workflow level.',
      });
    }

    // Check job-level env
    forEachJobNode(ctx, (jobName, jobNode) => {
      const jobEnv = resolveKey(jobNode, 'env');
      if (isEmptyEnv(jobEnv)) {
        const keyNode = resolveKeyNode(jobNode, 'env');
        const pos = keyNode ? getNodeLine(keyNode, ctx.lineCounter) : { line: 1, col: 1 };
        violations.push({
          ruleId: 'GA-B005',
          line: pos.line,
          column: pos.col,
          message: `Empty env block in job '${jobName}'.`,
        });
      }

      // Check step-level env
      forEachStepNode(jobNode, (stepNode) => {
        const stepEnv = resolveKey(stepNode, 'env');
        if (isEmptyEnv(stepEnv)) {
          const keyNode = resolveKeyNode(stepNode, 'env');
          const pos = keyNode ? getNodeLine(keyNode, ctx.lineCounter) : { line: 1, col: 1 };
          violations.push({
            ruleId: 'GA-B005',
            line: pos.line,
            column: pos.col,
            message: `Empty env block at step level in job '${jobName}'.`,
          });
        }
      });
    });

    return violations;
  },
};
