import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3030: LintRule = {
  id: 'DL3030',
  title: 'Use the -y switch for yum install',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'yum install without -y prompts for confirmation interactively. Since there is no ' +
    'terminal to respond during a Docker build, the build will hang or fail. In CI/CD ' +
    'pipelines, this results in silent build failures that waste time debugging. Always ' +
    'use -y to auto-confirm package installations.',
  fix: {
    description: 'Add -y flag to yum install',
    beforeCode: 'RUN yum install httpd',
    afterCode: 'RUN yum install -y httpd',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (!/\byum\s+install\b/.test(args)) continue;

      const hasYes = /\s-y\b/.test(args) || /\s--assumeyes\b/.test(args);

      if (!hasYes) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'yum install without -y flag. Add -y to auto-confirm package installation.',
        });
      }
    }

    return violations;
  },
};
