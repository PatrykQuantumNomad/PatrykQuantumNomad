/**
 * GA-S007: Pattern mismatch
 *
 * Metadata-only rule for documentation pages. The actual detection
 * is handled by ajv's pattern keyword in schema-validator.ts.
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

export const GAS007 = schemaMeta(
  'GA-S007',
  'Pattern mismatch',
  'warning',
  'A string value does not match the regular expression pattern defined in the schema. This typically applies to identifiers like job IDs, step IDs, and environment names that must follow specific naming conventions (e.g., alphanumeric characters, hyphens, and underscores only). Rename the value to comply with the expected pattern.',
  {
    description: 'Rename the value to match the expected naming pattern.',
    beforeCode: 'jobs:\n  "my job!!":\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hello',
    afterCode: 'jobs:\n  my-job:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hello',
  },
);
