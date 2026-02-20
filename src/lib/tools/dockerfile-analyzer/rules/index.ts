import type { LintRule, RuleSeverity, RuleCategory } from '../types';

// Security rules (7)
import { DL3006 } from './security/DL3006-tag-version';
import { DL3007 } from './security/DL3007-no-latest';
import { DL3008 } from './security/DL3008-pin-apt-versions';
import { DL3020 } from './security/DL3020-use-copy-not-add';
import { DL3004 } from './security/DL3004-no-sudo';
import { DL3002 } from './security/DL3002-no-root-user';
import { DL3061 } from './security/DL3061-from-first';

// Efficiency rules (3)
import { DL3059 } from './efficiency/DL3059-consolidate-runs';
import { DL3014 } from './efficiency/DL3014-use-apt-y';
import { DL3015 } from './efficiency/DL3015-no-install-recommends';

// Maintainability rules (3)
import { DL4000 } from './maintainability/DL4000-no-maintainer';
import { DL3025 } from './maintainability/DL3025-use-json-cmd';
import { DL3000 } from './maintainability/DL3000-absolute-workdir';

// Reliability rules (2)
import { DL4003 } from './reliability/DL4003-multiple-cmd';
import { DL4004 } from './reliability/DL4004-multiple-entrypoint';

// Rule registry -- all rules exported as a flat array
export const allRules: LintRule[] = [
  // Security
  DL3006,
  DL3007,
  DL3008,
  DL3020,
  DL3004,
  DL3002,
  DL3061,
  // Efficiency
  DL3059,
  DL3014,
  DL3015,
  // Maintainability
  DL4000,
  DL3025,
  DL3000,
  // Reliability
  DL4003,
  DL4004,
];

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
