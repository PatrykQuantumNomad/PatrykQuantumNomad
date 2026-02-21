import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL4000: LintRule = {
  id: 'DL4000',
  title: 'MAINTAINER is deprecated',
  severity: 'error',
  category: 'maintainability',
  explanation:
    'The MAINTAINER instruction was deprecated in Docker 1.13 back in January 2017. ' +
    'Deprecated instructions create compatibility risks with future Docker versions ' +
    'and signal to reviewers that the Dockerfile may be unmaintained. Use a LABEL ' +
    'instruction instead, which provides the same metadata in a standard format.',
  fix: {
    description: 'Replace MAINTAINER with a LABEL instruction',
    beforeCode: 'MAINTAINER john@example.com',
    afterCode: 'LABEL maintainer="john@example.com"',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() === 'MAINTAINER') {
        const range = inst.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'MAINTAINER is deprecated. Use LABEL maintainer="..." instead.',
        });
      }
    }

    return violations;
  },
};
