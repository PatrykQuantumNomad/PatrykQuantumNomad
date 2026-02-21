import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3000: LintRule = {
  id: 'DL3000',
  title: 'Use absolute WORKDIR',
  severity: 'error',
  category: 'maintainability',
  explanation:
    'Relative WORKDIR paths depend on the previous WORKDIR value, making the ' +
    'Dockerfile harder to understand and maintain. If the base image changes its ' +
    'default working directory, a relative WORKDIR can suddenly resolve to a ' +
    'completely different location. Use absolute paths to make the build ' +
    'deterministic and self-documenting.',
  fix: {
    description: 'Use an absolute path for WORKDIR',
    beforeCode: 'WORKDIR app',
    afterCode: 'WORKDIR /app',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'WORKDIR') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      const path = args.trim();
      // Absolute paths start with / or $ (variable reference like $HOME)
      if (!path.startsWith('/') && !path.startsWith('$')) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `WORKDIR '${path}' is a relative path. Use an absolute path (e.g., /app).`,
        });
      }
    }

    return violations;
  },
};
