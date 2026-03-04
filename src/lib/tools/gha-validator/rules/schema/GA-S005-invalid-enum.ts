/**
 * GA-S005: Invalid enum value
 *
 * Metadata-only rule for documentation pages. The actual detection
 * is handled by ajv's enum keyword in schema-validator.ts.
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

export const GAS005 = schemaMeta(
  'GA-S005',
  'Invalid enum value',
  'warning',
  'A value does not match any of the allowed options defined in the schema. Common examples include misspelled event types in `on:` (e.g., `pushs` instead of `push`) or invalid permission levels (e.g., `execute` instead of `read` or `write`). The workflow may be accepted by GitHub but will not behave as expected.',
  {
    description: 'Replace the value with one of the allowed options.',
    beforeCode: 'permissions:\n  contents: execute',
    afterCode: 'permissions:\n  contents: read',
  },
);
