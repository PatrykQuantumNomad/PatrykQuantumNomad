import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3003: LintRule = {
  id: 'DL3003',
  title: 'Use WORKDIR to switch directories',
  severity: 'warning',
  category: 'efficiency',
  explanation:
    'Using `cd` inside RUN instructions does not persist across layers because each RUN ' +
    'starts in the WORKDIR. Chaining `cd dir && command` works but makes the Dockerfile ' +
    'harder to read and maintain. Developers often forget that `cd` in one RUN does not ' +
    'affect the next, which leads to path-related bugs. WORKDIR is the idiomatic way to ' +
    'set the working directory and it persists across all subsequent instructions.',
  fix: {
    description: 'Replace cd with a WORKDIR instruction',
    beforeCode: 'RUN cd /app && npm install',
    afterCode: 'WORKDIR /app\nRUN npm install',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    // Match cd followed by && or ; (chained command)
    const cdPattern = /\bcd\s+\S+\s*(?:&&|;)/;

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      if (cdPattern.test(args)) {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Use WORKDIR to switch directories instead of cd in RUN.',
        });
      }
    }

    return violations;
  },
};
