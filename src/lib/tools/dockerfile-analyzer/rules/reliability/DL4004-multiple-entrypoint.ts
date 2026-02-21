import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL4004: LintRule = {
  id: 'DL4004',
  title: 'Multiple ENTRYPOINT instructions found',
  severity: 'error',
  category: 'reliability',
  explanation:
    'Only the last ENTRYPOINT instruction takes effect. Multiple ENTRYPOINT ' +
    'instructions in a stage are almost always a mistake because the earlier ones are ' +
    'silently ignored. This is more critical than a duplicate CMD because ENTRYPOINT ' +
    'defines how the container starts. A wrong entrypoint means the container runs ' +
    'unexpected code.',
  fix: {
    description:
      'Remove duplicate ENTRYPOINT instructions, keep only the final one',
    beforeCode:
      'ENTRYPOINT ["python", "app.py"]\nENTRYPOINT ["node", "server.js"]',
    afterCode: 'ENTRYPOINT ["node", "server.js"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    if (froms.length === 0) return violations;

    // Find the last FROM instruction (start of final stage)
    const lastFrom = froms.at(-1);
    if (!lastFrom) return violations;
    const lastFromLine = lastFrom.getRange().start.line;

    // Find ENTRYPOINT instructions in the final stage
    const entrypoints = dockerfile
      .getENTRYPOINTs()
      .filter((ep) => ep.getRange().start.line > lastFromLine);

    // If more than 1 ENTRYPOINT in final stage, flag all but the last
    if (entrypoints.length > 1) {
      for (let i = 0; i < entrypoints.length - 1; i++) {
        const range = entrypoints[i].getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Multiple ENTRYPOINT instructions found. Only the last one takes effect.',
        });
      }
    }

    return violations;
  },
};
