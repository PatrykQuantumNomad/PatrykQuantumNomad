import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3014: LintRule = {
  id: 'DL3014',
  title: 'Use the -y switch for apt-get install',
  severity: 'warning',
  category: 'efficiency',
  explanation:
    'apt-get install without -y (or --yes) prompts for confirmation interactively. ' +
    'In a Dockerfile build there is no terminal to respond, so the build will hang ' +
    'or fail. In production CI/CD pipelines, this causes silent build failures that ' +
    'are difficult to diagnose. Always use -y to auto-confirm installations.',
  fix: {
    description: 'Add -y flag to apt-get install',
    beforeCode: 'RUN apt-get install curl',
    afterCode: 'RUN apt-get install -y curl',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;
      if (!args.includes('apt-get') || !args.includes('install')) continue;

      // Check for -y, --yes, or -qq (which implies yes)
      const hasYes =
        /\s-y\b/.test(args) ||
        /\s--yes\b/.test(args) ||
        /\s-qq\b/.test(args) ||
        // Handle combined flags like -yq, -qy
        /\s-[a-z]*y[a-z]*\b/.test(args);

      if (!hasYes) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'apt-get install without -y flag. Add -y to auto-confirm package installation.',
        });
      }
    }

    return violations;
  },
};
