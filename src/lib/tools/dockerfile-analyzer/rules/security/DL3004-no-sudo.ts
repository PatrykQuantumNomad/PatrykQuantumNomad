import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3004: LintRule = {
  id: 'DL3004',
  title: 'Do not use sudo',
  severity: 'error',
  category: 'security',
  explanation:
    'Using sudo in a Dockerfile is almost always unnecessary because the build already ' +
    'runs as root by default. Worse, sudo adds a SUID binary to the image that can be ' +
    'exploited for privilege escalation. If you need to run a command as a different ' +
    'user, use the USER instruction to switch users explicitly.',
  fix: {
    description:
      'Remove sudo and run the command directly (builds run as root by default)',
    beforeCode: 'RUN sudo apt-get install -y curl',
    afterCode: 'RUN apt-get install -y curl',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (/\bsudo\b/.test(args)) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Do not use sudo. Dockerfile RUN instructions run as root by default.',
        });
      }
    }

    return violations;
  },
};
