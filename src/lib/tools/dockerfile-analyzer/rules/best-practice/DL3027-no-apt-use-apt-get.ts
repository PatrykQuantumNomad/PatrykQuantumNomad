import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3027: LintRule = {
  id: 'DL3027',
  title: 'Do not use apt as it is meant to be an end-user tool',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'The `apt` command is designed for interactive terminal use -- it shows progress ' +
    'bars, colors, and prompts that break in non-interactive Docker builds. apt-get ' +
    'is the stable, scriptable interface with a guaranteed CLI API. In production, ' +
    'using `apt` in Dockerfiles can cause build failures when the output format changes ' +
    'or when running in non-TTY environments. Always use apt-get or apt-cache.',
  fix: {
    description: 'Replace apt with apt-get',
    beforeCode: 'RUN apt install -y curl',
    afterCode: 'RUN apt-get install -y curl',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    // Match `apt` followed by a subcommand, but NOT apt-get, apt-cache, apt-key, apt-mark
    const aptPattern =
      /\bapt\s+(install|update|upgrade|remove|purge|list|search|show|full-upgrade|dist-upgrade|autoremove|clean|autoclean)\b/;

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (aptPattern.test(args)) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Use apt-get instead of apt. apt is for interactive use only.',
        });
      }
    }

    return violations;
  },
};
