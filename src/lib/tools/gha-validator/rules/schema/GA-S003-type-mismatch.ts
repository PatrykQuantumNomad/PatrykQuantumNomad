/**
 * GA-S003: Type mismatch
 *
 * Metadata-only rule for documentation pages. The actual detection
 * is handled by ajv's type keyword in schema-validator.ts.
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

export const GAS003 = schemaMeta(
  'GA-S003',
  'Type mismatch',
  'error',
  'A value in the workflow file has the wrong type. For example, `runs-on` expects a string or array but received a number, or `timeout-minutes` expects a number but received a string. Type mismatches cause GitHub Actions to reject the workflow at parse time.',
  {
    description: 'Change the value to the correct type expected by the schema.',
    beforeCode: 'jobs:\n  build:\n    runs-on: 42\n    steps:\n      - run: echo hello',
    afterCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hello',
  },
);
