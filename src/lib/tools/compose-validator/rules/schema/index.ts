import type { SchemaRuleMetadata, ComposeSeverity, ComposeCategory } from '../../types';

import { CVS001 } from './CV-S001-invalid-yaml-syntax';
import { CVS002 } from './CV-S002-unknown-top-level-property';
import { CVS003 } from './CV-S003-unknown-service-property';
import { CVS004 } from './CV-S004-invalid-port-format';
import { CVS005 } from './CV-S005-invalid-volume-format';
import { CVS006 } from './CV-S006-invalid-duration-format';
import { CVS007 } from './CV-S007-invalid-restart-policy';
import { CVS008 } from './CV-S008-invalid-depends-on-condition';

// Schema rule registry: all 8 schema rules exported as a flat array
export const schemaRules: SchemaRuleMetadata[] = [
  CVS001,
  CVS002,
  CVS003,
  CVS004,
  CVS005,
  CVS006,
  CVS007,
  CVS008,
];

/** Look up a schema rule by its ID (e.g., "CV-S001"). Returns undefined if not found. */
export function getSchemaRuleById(id: string): SchemaRuleMetadata | undefined {
  return schemaRules.find((r) => r.id === id);
}

/** Get a schema rule's severity by ID. Falls back to 'info' if rule not found. */
export function getSchemaRuleSeverity(id: string): ComposeSeverity {
  return getSchemaRuleById(id)?.severity ?? 'info';
}

/** Get a schema rule's category by ID. Falls back to 'schema' if rule not found. */
export function getSchemaRuleCategory(id: string): ComposeCategory {
  return getSchemaRuleById(id)?.category ?? 'schema';
}
