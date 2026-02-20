import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3015: LintRule = {
  id: 'DL3015',
  title: 'Avoid additional packages by specifying --no-install-recommends',
  severity: 'info',
  category: 'efficiency',
  explanation:
    'By default, apt-get install pulls in "recommended" packages that are not ' +
    'strictly required. In production containers, these extra packages increase ' +
    'image size (often by 30-50%) and expand the attack surface with unnecessary ' +
    'binaries. Use --no-install-recommends to install only essential dependencies.',
  fix: {
    description: 'Add --no-install-recommends to apt-get install',
    beforeCode: 'RUN apt-get install -y curl wget',
    afterCode: 'RUN apt-get install -y --no-install-recommends curl wget',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;
      if (!args.includes('apt-get') || !args.includes('install')) continue;

      if (!args.includes('--no-install-recommends')) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'apt-get install without --no-install-recommends. This installs unnecessary packages.',
        });
      }
    }

    return violations;
  },
};
