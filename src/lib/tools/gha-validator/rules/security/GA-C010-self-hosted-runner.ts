/**
 * GA-C010: Self-hosted runner usage
 *
 * Flags jobs that use `runs-on: self-hosted` or include `self-hosted`
 * in a runner label array. Self-hosted runners persist state between
 * jobs, lack network isolation, and may expose credentials to
 * untrusted code (especially from fork PRs).
 *
 * Severity is `info` -- this is an informational security reminder,
 * not an error, since self-hosted runners are a valid and common pattern.
 */

import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from './ast-helpers';

export const GAC010: GhaLintRule = {
  id: 'GA-C010',
  title: 'Self-hosted runner',
  severity: 'info',
  category: 'security',
  explanation:
    'Self-hosted runners persist state between jobs, lack network isolation, ' +
    'and may expose credentials or sensitive data to untrusted code. When used ' +
    'with `pull_request_target` or fork PRs, an attacker can execute arbitrary ' +
    'code on your infrastructure. Ensure self-hosted runners follow security ' +
    'hardening guidelines: ephemeral runners, network segmentation, and minimal ' +
    'installed tooling.',
  fix: {
    description:
      'Consider using GitHub-hosted runners or ensure self-hosted runners follow security hardening guidelines',
    beforeCode: 'runs-on: self-hosted',
    afterCode: 'runs-on: ubuntu-latest',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
    if (!isMap(jobsNode)) return violations;

    for (const jobPair of jobsNode.items) {
      if (!isPair(jobPair)) continue;

      const runsOnNode = resolveKey(jobPair.value, 'runs-on');
      if (!runsOnNode) continue;

      // Case 1: runs-on: self-hosted (scalar)
      if (isScalar(runsOnNode)) {
        if (String(runsOnNode.value).toLowerCase() === 'self-hosted') {
          const pos = getNodeLine(runsOnNode, ctx.lineCounter);
          violations.push({
            ruleId: 'GA-C010',
            line: pos.line,
            column: pos.col,
            message:
              'Job uses a self-hosted runner. Self-hosted runners persist state, lack network isolation, and may expose credentials. Follow runner hardening guidelines.',
          });
        }
        continue;
      }

      // Case 2: runs-on: [self-hosted, linux] (array)
      if (isSeq(runsOnNode)) {
        for (const item of runsOnNode.items) {
          if (
            isScalar(item) &&
            String(item.value).toLowerCase() === 'self-hosted'
          ) {
            const pos = getNodeLine(runsOnNode, ctx.lineCounter);
            violations.push({
              ruleId: 'GA-C010',
              line: pos.line,
              column: pos.col,
              message:
                'Job uses a self-hosted runner. Self-hosted runners persist state, lack network isolation, and may expose credentials. Follow runner hardening guidelines.',
            });
            break; // Only flag once per job
          }
        }
      }
    }

    return violations;
  },
};
