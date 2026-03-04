/**
 * GA-S008: Invalid structure (fallback)
 *
 * Metadata-only rule for documentation pages. The actual detection
 * is the fallback case in categoriseSingleError() in schema-validator.ts.
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

export const GAS008 = schemaMeta(
  'GA-S008',
  'Invalid structure',
  'info',
  'The workflow file contains a structural issue that does not fall into a more specific schema validation category. This is a catch-all for schema violations such as incorrect nesting, unexpected value combinations, or constraint violations (e.g., minItems, maxLength). Review the specific error message for details on what to fix.',
  {
    description: 'Review the error message and restructure the affected section.',
    beforeCode: 'on: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps: []',
    afterCode: 'on: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hello',
  },
);
