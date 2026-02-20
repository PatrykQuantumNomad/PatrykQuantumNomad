import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG004: LintRule = {
  id: 'PG004',
  title: 'Use ENV key=value format instead of legacy ENV key value',
  severity: 'info',
  category: 'maintainability',
  explanation:
    'The legacy `ENV KEY value` syntax (space-separated) only supports one variable ' +
    'per instruction and can be ambiguous when the value contains spaces. Docker ' +
    'recommends the `ENV KEY=value` syntax which is explicit, supports multiple ' +
    'variables per line, and avoids parsing surprises. In production, the legacy ' +
    'format can cause subtle bugs when values have leading/trailing spaces.',
  fix: {
    description: 'Use the key=value syntax for ENV instructions',
    beforeCode: 'ENV MY_VAR some value',
    afterCode: 'ENV MY_VAR="some value"',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];

    const envs = dockerfile.getENVs();
    for (const env of envs) {
      const properties = env.getProperties();
      if (properties.length === 0) continue;

      // Check the first property for assignment operator
      const firstProp = properties[0];
      const operator = firstProp.getAssignmentOperator();

      // If no = operator, this is legacy space-separated format
      if (operator === null) {
        const range = env.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `ENV uses legacy space-separated format. Use ENV ${firstProp.getName()}=... instead.`,
        });
      }
    }

    return violations;
  },
};
