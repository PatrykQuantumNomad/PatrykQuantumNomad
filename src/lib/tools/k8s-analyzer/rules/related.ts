import type { K8sSeverity } from '../types';
import type { DocumentedK8sRule } from './index';
import { allDocumentedK8sRules } from './index';

/** Severity priority for sorting: error first, then warning, then info. */
const SEVERITY_ORDER: Record<K8sSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

/**
 * Get rules in the same category as the given rule, excluding self.
 * Results are sorted by severity priority (error > warning > info).
 */
export function getRelatedK8sRules(ruleId: string, limit = 5): DocumentedK8sRule[] {
  const rule = allDocumentedK8sRules.find((r) => r.id === ruleId);
  if (!rule) return [];

  return allDocumentedK8sRules
    .filter((r) => r.category === rule.category && r.id !== ruleId)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, limit);
}
