/**
 * Style rules barrel export.
 *
 * Exports all 4 style rules (GA-F001 through GA-F004) as a single
 * array for registration in the master rule registry.
 */

import { GAF001 } from './GA-F001-jobs-not-alphabetical';
import { GAF002 } from './GA-F002-inconsistent-quoting';
import { GAF003 } from './GA-F003-long-step-name';
import { GAF004 } from './GA-F004-missing-workflow-name';
import type { GhaLintRule } from '../../types';

/** All 4 style rules for GitHub Actions workflows. */
export const styleRules: GhaLintRule[] = [
  GAF001,
  GAF002,
  GAF003,
  GAF004,
];
