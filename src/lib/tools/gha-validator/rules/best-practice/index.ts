/**
 * Best practice rules barrel export.
 *
 * Exports all 8 best practice rules (GA-B001 through GA-B008) as a single
 * array for registration in the master rule registry.
 */

import { GAB001 } from './GA-B001-missing-timeout';
import { GAB002 } from './GA-B002-missing-concurrency';
import { GAB003 } from './GA-B003-unnamed-step';
import { GAB004 } from './GA-B004-duplicate-step-name';
import { GAB005 } from './GA-B005-empty-env';
import { GAB006 } from './GA-B006-missing-conditional';
import { GAB007 } from './GA-B007-outdated-action';
import { GAB008 } from './GA-B008-missing-continue-on-error';
import type { GhaLintRule } from '../../types';

/** All 8 best practice rules for GitHub Actions workflows. */
export const bestPracticeRules: GhaLintRule[] = [
  GAB001,
  GAB002,
  GAB003,
  GAB004,
  GAB005,
  GAB006,
  GAB007,
  GAB008,
];
