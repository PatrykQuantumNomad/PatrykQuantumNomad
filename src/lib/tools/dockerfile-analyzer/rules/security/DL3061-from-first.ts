import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3061: LintRule = {
  id: 'DL3061',
  title: 'Dockerfile should start with FROM or ARG',
  severity: 'error',
  category: 'security',
  explanation:
    'A valid Dockerfile must begin with a FROM instruction (or ARG instructions ' +
    'before FROM for build-time variables). Any other instruction before FROM is ' +
    'invalid and will cause the build to fail. This rule catches structural errors ' +
    'early before they reach the build system.',
  fix: {
    description: 'Ensure FROM is the first non-ARG instruction',
    beforeCode: 'RUN echo hello\nFROM ubuntu:22.04',
    afterCode: 'FROM ubuntu:22.04\nRUN echo hello',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();
    const comments = dockerfile.getComments();

    // Collect comment line numbers to skip them
    const commentLines = new Set(
      comments.map((c) => c.getRange().start.line),
    );

    // Find the first instruction that is not a comment and not ARG
    for (const inst of instructions) {
      const line = inst.getRange().start.line;

      // Skip comments (should not be in instructions array, but be safe)
      if (commentLines.has(line)) continue;

      const keyword = inst.getKeyword();

      // ARG before FROM is valid
      if (keyword === 'ARG') continue;

      // First non-ARG instruction must be FROM
      if (keyword !== 'FROM') {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `Expected FROM instruction, found ${keyword}. Dockerfile must begin with FROM (or ARG before FROM).`,
        });
      }

      // Only check the first non-ARG instruction
      break;
    }

    return violations;
  },
};
