/**
 * Master rule registry for the GitHub Actions Workflow Validator.
 *
 * Aggregates all custom lint rules from category subdirectories.
 * Phase 76: 10 security rules
 * Phase 77 will add: semantic, best-practice, and style rules
 */

import type { GhaLintRule } from '../types';
import { securityRules } from './security';

/** All custom lint rules with check() methods. */
export const allGhaRules: GhaLintRule[] = [...securityRules];

/** All documented rules (custom + schema metadata) for static page generation. */
export const allDocumentedGhaRules: GhaLintRule[] = [...allGhaRules];

/** Look up a rule by ID. Returns undefined if not found. */
export function getGhaRuleById(id: string): GhaLintRule | undefined {
  return allGhaRules.find((r) => r.id === id);
}
