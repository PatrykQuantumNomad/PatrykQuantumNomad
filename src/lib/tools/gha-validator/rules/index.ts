/**
 * Master rule registry for the GitHub Actions Workflow Validator.
 *
 * Aggregates all custom lint rules from category subdirectories:
 * - Phase 76: 10 security rules (GA-C001 through GA-C010)
 * - Phase 77: 18 actionlint metadata rules (GA-L001 through GA-L018)
 * - Phase 77: 8 best practice rules (GA-B001 through GA-B008)
 * - Phase 77: 4 style rules (GA-F001 through GA-F004)
 * - Phase 80: 8 schema metadata rules (GA-S001 through GA-S008)
 *
 * Total: 22 custom rules + 18 actionlint metadata + 8 schema metadata = 48 documented rules
 */

import type { GhaLintRule } from '../types';
import { securityRules } from './security';
import { bestPracticeRules } from './best-practice';
import { styleRules } from './style';
import { actionlintMetaRules } from './semantic';
import { schemaRules } from './schema';

/** All 22 custom lint rules with check() methods. */
export const allGhaRules: GhaLintRule[] = [
  ...securityRules,
  ...bestPracticeRules,
  ...styleRules,
];

/** All 48 documented rules (22 custom + 18 actionlint + 8 schema) for static page generation. */
export const allDocumentedGhaRules: GhaLintRule[] = [
  ...allGhaRules,
  ...actionlintMetaRules,
  ...schemaRules,
];

/** Look up a rule by ID across all documented rules. Returns undefined if not found. */
export function getGhaRuleById(id: string): GhaLintRule | undefined {
  return allDocumentedGhaRules.find((r) => r.id === id);
}
