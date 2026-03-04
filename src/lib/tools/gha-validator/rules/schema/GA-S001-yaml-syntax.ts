/**
 * GA-S001: YAML syntax error
 *
 * Metadata-only rule for documentation pages. The actual detection
 * is handled by the YAML parser in parser.ts, not by ajv schema validation.
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

export const GAS001 = schemaMeta(
  'GA-S001',
  'YAML syntax error',
  'error',
  'The workflow file contains invalid YAML syntax that prevents parsing. Common causes include incorrect indentation, missing colons after keys, unmatched quotes, and invalid use of tabs. GitHub Actions cannot read the workflow until the syntax error is fixed.',
  {
    description: 'Fix the YAML syntax error so the file can be parsed.',
    beforeCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n    steps\n      - run: echo hello',
    afterCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hello',
  },
);
