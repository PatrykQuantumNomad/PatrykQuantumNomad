import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3059: LintRule = {
  id: 'DL3059',
  title: 'Multiple consecutive RUN instructions',
  severity: 'info',
  category: 'efficiency',
  explanation:
    'Each RUN instruction creates a new image layer. Consecutive RUN instructions ' +
    'that could be combined into a single RUN with && waste space because files ' +
    'created in one layer and deleted in the next still exist in the earlier layer. ' +
    'This inflates image size and slows down container startup across your cluster.',
  fix: {
    description: 'Combine consecutive RUN instructions with &&',
    beforeCode: 'RUN apt-get update\nRUN apt-get install -y curl',
    afterCode: 'RUN apt-get update && \\\n    apt-get install -y curl',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (let i = 1; i < instructions.length; i++) {
      if (
        instructions[i].getKeyword() === 'RUN' &&
        instructions[i - 1].getKeyword() === 'RUN'
      ) {
        const range = instructions[i].getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            'Multiple consecutive RUN instructions. Consider combining with &&.',
        });
      }
    }

    return violations;
  },
};
