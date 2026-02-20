import type { LintRule, RuleSeverity, RuleCategory } from '../types';

// Rule registry -- all rules are imported here and exported as a flat array.
// Rules are populated as they are implemented in category subdirectories.
export const allRules: LintRule[] = [];

/** Look up a rule by its ID (e.g., "DL3006"). Returns undefined if not found. */
export function getRuleById(id: string): LintRule | undefined {
  return allRules.find((r) => r.id === id);
}

/** Get a rule's severity by ID. Falls back to 'info' if rule not found. */
export function getRuleSeverity(id: string): RuleSeverity {
  return getRuleById(id)?.severity ?? 'info';
}

/** Get a rule's category by ID. Falls back to 'best-practice' if rule not found. */
export function getRuleCategory(id: string): RuleCategory {
  return getRuleById(id)?.category ?? 'best-practice';
}
