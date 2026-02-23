import type { ComposeSeverity } from '../types';
import type { DocumentedRule } from './index';
import { allDocumentedRules } from './index';

/** Severity priority for sorting: error first, then warning, then info. */
const SEVERITY_ORDER: Record<ComposeSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

/**
 * Get rules in the same category as the given rule, excluding self.
 * Results are sorted by severity priority (error > warning > info).
 */
export function getRelatedComposeRules(ruleId: string, limit = 5): DocumentedRule[] {
  const rule = allDocumentedRules.find((r) => r.id === ruleId);
  if (!rule) return [];

  return allDocumentedRules
    .filter((r) => r.category === rule.category && r.id !== ruleId)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, limit);
}
