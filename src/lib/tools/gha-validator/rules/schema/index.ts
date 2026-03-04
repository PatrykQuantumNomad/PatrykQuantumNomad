/**
 * Barrel export for schema rule metadata (GA-S001 through GA-S008).
 *
 * These are no-op rules -- their check() methods return empty arrays.
 * They exist to provide documentation metadata (title, explanation, fix)
 * for each schema validation error category, used by per-rule
 * documentation pages at /tools/gha-validator/rules/[code].
 */

import type { GhaLintRule } from '../../types';
import { GAS001 } from './GA-S001-yaml-syntax';
import { GAS002 } from './GA-S002-unknown-property';
import { GAS003 } from './GA-S003-type-mismatch';
import { GAS004 } from './GA-S004-missing-required';
import { GAS005 } from './GA-S005-invalid-enum';
import { GAS006 } from './GA-S006-invalid-format';
import { GAS007 } from './GA-S007-pattern-mismatch';
import { GAS008 } from './GA-S008-invalid-structure';

export {
  GAS001, GAS002, GAS003, GAS004,
  GAS005, GAS006, GAS007, GAS008,
};

/** All 8 schema metadata rules for documentation generation. */
export const schemaRules: GhaLintRule[] = [
  GAS001, GAS002, GAS003, GAS004,
  GAS005, GAS006, GAS007, GAS008,
];
