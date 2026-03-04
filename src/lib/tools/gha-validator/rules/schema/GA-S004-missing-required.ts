/**
 * GA-S004: Missing required field
 *
 * Metadata-only rule for documentation pages. The actual detection
 * is handled by ajv's required keyword in schema-validator.ts.
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

export const GAS004 = schemaMeta(
  'GA-S004',
  'Missing required field',
  'error',
  'A required property is missing from the workflow file. Every workflow must have `on` (trigger events) and `jobs` at the top level. Each job requires `runs-on` (or `uses` for reusable workflows) and `steps`. Missing required fields prevent the workflow from running.',
  {
    description: 'Add the missing required property.',
    beforeCode: 'on: push\njobs:\n  build:\n    steps:\n      - run: echo hello',
    afterCode: 'on: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hello',
  },
);
