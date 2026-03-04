/**
 * GA-S002: Unknown property (additionalProperties)
 *
 * Metadata-only rule for documentation pages. The actual detection
 * is handled by ajv's additionalProperties keyword in schema-validator.ts.
 */

import type {
  GhaLintRule,
  GhaRuleContext,
  GhaRuleViolation,
  GhaCategory,
  GhaSeverity,
  GhaRuleFix,
} from '../../types';

function schemaMeta(
  id: string,
  title: string,
  severity: GhaSeverity,
  explanation: string,
  fix: GhaRuleFix,
): GhaLintRule {
  return {
    id,
    title,
    severity,
    category: 'schema' as GhaCategory,
    explanation,
    fix,
    check(_ctx: GhaRuleContext): GhaRuleViolation[] {
      return [];
    },
  };
}

export const GAS002 = schemaMeta(
  'GA-S002',
  'Unknown property',
  'error',
  'The workflow file contains a property that is not recognized by the GitHub Actions schema. This usually indicates a typo in a key name (e.g., `run-on` instead of `runs-on`) or using a property at the wrong level of nesting. GitHub will ignore the unknown property, which may cause the workflow to behave unexpectedly.',
  {
    description: 'Remove or rename the unknown property to a valid GitHub Actions key.',
    beforeCode: 'jobs:\n  build:\n    run-on: ubuntu-latest\n    steps:\n      - run: echo hello',
    afterCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hello',
  },
);
