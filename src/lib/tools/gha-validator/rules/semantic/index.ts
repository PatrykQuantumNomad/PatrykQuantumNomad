/**
 * Barrel export for semantic rules.
 *
 * Exports all actionlint metadata rules (GA-L001 through GA-L018) as a
 * single array, plus the getActionlintRuleTitle helper for engine enrichment.
 */

import type { GhaLintRule } from '../../types';
import {
  GAL001, GAL002, GAL003, GAL004, GAL005, GAL006,
  GAL007, GAL008, GAL009, GAL010, GAL011, GAL012,
  GAL013, GAL014, GAL015, GAL016, GAL017, GAL018,
  ALL_ACTIONLINT_META_RULES,
} from './actionlint-rules';

export { getActionlintRuleTitle } from './actionlint-rules';

export {
  GAL001, GAL002, GAL003, GAL004, GAL005, GAL006,
  GAL007, GAL008, GAL009, GAL010, GAL011, GAL012,
  GAL013, GAL014, GAL015, GAL016, GAL017, GAL018,
};

/** Actionlint metadata rules (no-op check, for documentation/enrichment only). */
export const actionlintMetaRules: GhaLintRule[] = ALL_ACTIONLINT_META_RULES;
