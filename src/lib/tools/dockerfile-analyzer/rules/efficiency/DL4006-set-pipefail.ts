import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL4006: LintRule = {
  id: 'DL4006',
  title: 'Set the SHELL option -o pipefail before RUN with a pipe in',
  severity: 'warning',
  category: 'efficiency',
  explanation:
    'In /bin/sh (the default shell), a piped command like `curl url | tar xz` only ' +
    'reports the exit code of the last command (tar). If curl fails, the build ' +
    'continues silently with corrupt or missing data. You end up with images that ' +
    'appear to build successfully but contain broken software. Set pipefail so the ' +
    'whole pipe fails if any command in it fails.',
  fix: {
    description:
      'Add a SHELL instruction with pipefail before piped RUN commands',
    beforeCode: 'RUN curl -sSL https://example.com/file | tar xz',
    afterCode:
      'SHELL ["/bin/bash", "-o", "pipefail", "-c"]\n' +
      'RUN curl -sSL https://example.com/file | tar xz',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    // Track SHELL instructions with pipefail
    let hasPipefail = false;

    for (const inst of instructions) {
      const keyword = inst.getKeyword();

      if (keyword === 'SHELL') {
        const args = inst.getArgumentsContent();
        if (args && /pipefail/.test(args)) {
          hasPipefail = true;
        }
        continue;
      }

      if (keyword !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // Check for pipe operator (not || which is logical OR)
      // Must contain | but not be preceded by another |
      if (/(?<!\|)\|(?!\|)/.test(args) && !hasPipefail) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'RUN with pipe has no pipefail. Add SHELL ["/bin/bash", "-o", "pipefail", "-c"] before.',
        });
      }
    }

    return violations;
  },
};
