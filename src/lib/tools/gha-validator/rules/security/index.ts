/**
 * Security rules barrel export.
 *
 * Exports all 10 security rules (GA-C001 through GA-C010) as a single
 * array for registration in the master rule registry.
 */

import { GAC001 } from './GA-C001-unpinned-action';
import { GAC002 } from './GA-C002-mutable-action-tag';
import { GAC003 } from './GA-C003-overly-permissive-permissions';
import { GAC004 } from './GA-C004-missing-permissions';
import { GAC005 } from './GA-C005-script-injection';
import { GAC006 } from './GA-C006-pull-request-target';
import { GAC007 } from './GA-C007-hardcoded-secrets';
import { GAC008 } from './GA-C008-third-party-no-sha';
import { GAC009 } from './GA-C009-dangerous-token-scopes';
import { GAC010 } from './GA-C010-self-hosted-runner';
import type { GhaLintRule } from '../../types';

/** All 10 security rules for GitHub Actions workflows. */
export const securityRules: GhaLintRule[] = [
  GAC001,
  GAC002,
  GAC003,
  GAC004,
  GAC005,
  GAC006,
  GAC007,
  GAC008,
  GAC009,
  GAC010,
];
