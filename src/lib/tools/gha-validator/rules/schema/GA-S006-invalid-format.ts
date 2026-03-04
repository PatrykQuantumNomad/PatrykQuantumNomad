/**
 * GA-S006: Invalid format (oneOf / anyOf)
 *
 * Metadata-only rule for documentation pages. The actual detection
 * is handled by ajv's oneOf/anyOf keywords in schema-validator.ts.
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

export const GAS006 = schemaMeta(
  'GA-S006',
  'Invalid format',
  'warning',
  'A value does not match any of the expected formats defined by the schema. The GitHub Actions schema uses oneOf/anyOf to allow multiple valid shapes for certain properties (e.g., `on` can be a string, array, or object). When a value matches none of the alternatives, this error is raised. Check the property documentation for accepted formats.',
  {
    description: 'Rewrite the value to match one of the accepted formats.',
    beforeCode: 'on:\n  push:\n    branches: main',
    afterCode: 'on:\n  push:\n    branches: [main]',
  },
);
