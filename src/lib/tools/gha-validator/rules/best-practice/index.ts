/**
 * Best practice rules barrel export.
 *
 * Exports all best practice rules (GA-B001 through GA-B004) as a single
 * array for registration in the master rule registry.
 */

import { GAB001 } from './GA-B001-missing-timeout';
import { GAB002 } from './GA-B002-missing-concurrency';
import { GAB003 } from './GA-B003-unnamed-step';
import { GAB004 } from './GA-B004-duplicate-step-name';
import type { GhaLintRule } from '../../types';

/** All best practice rules for GitHub Actions workflows. */
export const bestPracticeRules: GhaLintRule[] = [
  GAB001,
  GAB002,
  GAB003,
  GAB004,
];
