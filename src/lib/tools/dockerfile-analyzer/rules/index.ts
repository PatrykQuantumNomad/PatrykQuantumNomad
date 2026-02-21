import type { LintRule, RuleSeverity, RuleCategory } from '../types';

// Security rules (12)
import { DL3006 } from './security/DL3006-tag-version';
import { DL3007 } from './security/DL3007-no-latest';
import { DL3008 } from './security/DL3008-pin-apt-versions';
import { DL3020 } from './security/DL3020-use-copy-not-add';
import { DL3004 } from './security/DL3004-no-sudo';
import { DL3002 } from './security/DL3002-no-root-user';
import { DL3061 } from './security/DL3061-from-first';
import { PG001 } from './security/PG001-secrets-in-env';
import { PG002 } from './security/PG002-curl-pipe-shell';
import { PG003 } from './security/PG003-copy-sensitive-files';
import { PG006 } from './security/PG006-prefer-digest';
import { PG007 } from './security/PG007-explicit-uid-gid';

// Efficiency rules (8)
import { DL3059 } from './efficiency/DL3059-consolidate-runs';
import { DL3014 } from './efficiency/DL3014-use-apt-y';
import { DL3015 } from './efficiency/DL3015-no-install-recommends';
import { DL3003 } from './efficiency/DL3003-use-workdir';
import { DL3009 } from './efficiency/DL3009-remove-apt-lists';
import { DL4006 } from './efficiency/DL4006-set-pipefail';
import { DL3042 } from './efficiency/DL3042-pip-no-cache-dir';
import { DL3019 } from './efficiency/DL3019-use-apk-no-cache';

// Maintainability rules (7)
import { DL4000 } from './maintainability/DL4000-no-maintainer';
import { DL3025 } from './maintainability/DL3025-use-json-cmd';
import { DL3000 } from './maintainability/DL3000-absolute-workdir';
import { DL3045 } from './maintainability/DL3045-copy-relative-workdir';
import { PG004 } from './maintainability/PG004-legacy-env-format';
import { DL4001 } from './maintainability/DL4001-wget-or-curl';
import { DL3057 } from './maintainability/DL3057-missing-healthcheck';

// Reliability rules (6)
import { DL4003 } from './reliability/DL4003-multiple-cmd';
import { DL4004 } from './reliability/DL4004-multiple-entrypoint';
import { DL3011 } from './reliability/DL3011-valid-port';
import { DL3012 } from './reliability/DL3012-one-healthcheck';
import { DL3024 } from './reliability/DL3024-unique-from-alias';
import { PG008 } from './reliability/PG008-use-init-process';

// Best Practice rules (9)
import { DL3027 } from './best-practice/DL3027-no-apt-use-apt-get';
import { DL3013 } from './best-practice/DL3013-pin-pip-versions';
import { DL3001 } from './best-practice/DL3001-avoid-bash-commands';
import { DL3022 } from './best-practice/DL3022-copy-from-alias';
import { DL3030 } from './best-practice/DL3030-yum-y';
import { DL3033 } from './best-practice/DL3033-pin-yum-versions';
import { DL3038 } from './best-practice/DL3038-dnf-y';
import { DL3041 } from './best-practice/DL3041-pin-dnf-versions';
import { PG005 } from './best-practice/PG005-inconsistent-casing';

// Rule registry -- all rules exported as a flat array
export const allRules: LintRule[] = [
  // Security (12)
  DL3006,
  DL3007,
  DL3008,
  DL3020,
  DL3004,
  DL3002,
  DL3061,
  PG001,
  PG002,
  PG003,
  PG006,
  PG007,
  // Efficiency (8)
  DL3059,
  DL3014,
  DL3015,
  DL3003,
  DL3009,
  DL4006,
  DL3042,
  DL3019,
  // Maintainability (7)
  DL4000,
  DL3025,
  DL3000,
  DL3045,
  PG004,
  DL4001,
  DL3057,
  // Reliability (6)
  DL4003,
  DL4004,
  DL3011,
  DL3012,
  DL3024,
  PG008,
  // Best Practice (9)
  DL3027,
  DL3013,
  DL3001,
  DL3022,
  DL3030,
  DL3033,
  DL3038,
  DL3041,
  PG005,
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
