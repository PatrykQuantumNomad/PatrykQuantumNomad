/**
 * Diagnostic rule metadata and pre-schema validation helpers for the K8s analyzer.
 *
 * Defines SchemaRuleMetadata for KA-S001 through KA-S010 — these are the
 * pre-schema and schema-level diagnostic rules. The metadata provides rule IDs,
 * titles, severity levels, explanations, and fix suggestions.
 *
 * Also provides metadata validation functions (name, label key, label value)
 * that follow Kubernetes validation.go patterns exactly.
 */

import type { LineCounter } from 'yaml';
import type { ParsedDocument, K8sRuleViolation, SchemaRuleMetadata } from './types';
import { resolveInstancePath, getNodeLine } from './parser';
import { getDeprecation } from './gvk-registry';

// ── Schema Rule Metadata (KA-S001 through KA-S010) ─────────────────

/**
 * Metadata for all 10 schema-level diagnostic rules.
 * These define the rule shape but not the check logic — the engine
 * orchestrates when each rule fires based on parsing/validation stages.
 */
export const SCHEMA_RULE_METADATA: Record<string, SchemaRuleMetadata> = {
  'KA-S001': {
    id: 'KA-S001',
    title: 'Invalid YAML Syntax',
    severity: 'error',
    category: 'schema',
    explanation:
      'The YAML document contains syntax errors that prevent parsing. Fix the YAML syntax before other validation can proceed.',
    fix: {
      description: 'Fix the YAML syntax error indicated by the parser.',
      beforeCode: 'apiVersion: v1\nkind: ConfigMap\n  metadata:  # wrong indentation',
      afterCode: 'apiVersion: v1\nkind: ConfigMap\nmetadata:  # correct indentation',
    },
  },
  'KA-S002': {
    id: 'KA-S002',
    title: 'Missing apiVersion Field',
    severity: 'error',
    category: 'schema',
    explanation:
      'Every Kubernetes resource must specify an apiVersion field that identifies the API group and version.',
    fix: {
      description: 'Add the apiVersion field for the resource type.',
      beforeCode: 'kind: Deployment\nmetadata:\n  name: my-app',
      afterCode: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app',
    },
  },
  'KA-S003': {
    id: 'KA-S003',
    title: 'Missing kind Field',
    severity: 'error',
    category: 'schema',
    explanation:
      'Every Kubernetes resource must specify a kind field that identifies the resource type.',
    fix: {
      description: 'Add the kind field for the resource type.',
      beforeCode: 'apiVersion: apps/v1\nmetadata:\n  name: my-app',
      afterCode: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app',
    },
  },
  'KA-S004': {
    id: 'KA-S004',
    title: 'Unknown apiVersion/kind Combination',
    severity: 'error',
    category: 'schema',
    explanation:
      'The apiVersion/kind combination is not recognized as a supported Kubernetes resource type. Check for typos or use a supported API version.',
    fix: {
      description: 'Use a valid apiVersion/kind combination.',
      beforeCode: 'apiVersion: v1\nkind: Deploymnet  # typo',
      afterCode: 'apiVersion: apps/v1\nkind: Deployment',
    },
  },
  'KA-S005': {
    id: 'KA-S005',
    title: 'Schema Validation Error',
    severity: 'error',
    category: 'schema',
    explanation:
      'The resource does not conform to the Kubernetes JSON Schema for its resource type. Check the field name, type, and value against the Kubernetes API documentation.',
    fix: {
      description: 'Fix the schema validation error for the specific field.',
      beforeCode: 'spec:\n  replicas: "three"  # should be number',
      afterCode: 'spec:\n  replicas: 3',
    },
  },
  'KA-S006': {
    id: 'KA-S006',
    title: 'Deprecated API Version',
    severity: 'warning',
    category: 'schema',
    explanation:
      'This apiVersion has been removed from Kubernetes and will not work on modern clusters. Migrate to the replacement API version.',
    fix: {
      description: 'Update the apiVersion to the current stable version.',
      beforeCode: 'apiVersion: extensions/v1beta1\nkind: Deployment',
      afterCode: 'apiVersion: apps/v1\nkind: Deployment',
    },
  },
  'KA-S007': {
    id: 'KA-S007',
    title: 'Missing metadata.name',
    severity: 'error',
    category: 'schema',
    explanation:
      'Every Kubernetes resource must have a metadata.name field. This is the unique identifier for the resource within its namespace.',
    fix: {
      description: 'Add a metadata.name field to the resource.',
      beforeCode: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  labels:\n    app: test',
      afterCode: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: my-config\n  labels:\n    app: test',
    },
  },
  'KA-S008': {
    id: 'KA-S008',
    title: 'Invalid metadata.name Format',
    severity: 'warning',
    category: 'schema',
    explanation:
      'The metadata.name must be a valid DNS subdomain: lowercase alphanumeric characters, hyphens, or dots, and must start and end with an alphanumeric character. Maximum 253 characters.',
    fix: {
      description: 'Fix the metadata.name to be a valid DNS subdomain.',
      beforeCode: 'metadata:\n  name: My_App  # uppercase and underscore',
      afterCode: 'metadata:\n  name: my-app  # lowercase with hyphens',
    },
  },
  'KA-S009': {
    id: 'KA-S009',
    title: 'Invalid Label Key or Value',
    severity: 'warning',
    category: 'schema',
    explanation:
      'Kubernetes label keys must follow the qualified name format (optional prefix/name) and label values must be 63 characters or fewer, starting and ending with alphanumeric characters.',
    fix: {
      description: 'Fix the label key or value to follow Kubernetes naming conventions.',
      beforeCode: 'metadata:\n  labels:\n    my label: invalid value!',
      afterCode: 'metadata:\n  labels:\n    my-label: valid-value',
    },
  },
  'KA-S010': {
    id: 'KA-S010',
    title: 'Empty Document',
    severity: 'info',
    category: 'schema',
    explanation:
      'An empty YAML document was found. This commonly occurs with a trailing --- separator. Empty documents are ignored during validation.',
    fix: {
      description: 'Remove the trailing --- separator or add content to the document.',
      beforeCode: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test\n---\n',
      afterCode: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test',
    },
  },
};

// ── Metadata Validation (KA-S007/S008/S009) ─────────────────────────

// RFC 1123 DNS subdomain validation (source: kubernetes/apimachinery validation.go)
const DNS_1123_SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
const DNS_1123_SUBDOMAIN_MAX = 253;

// Label key/value validation (source: kubernetes/apimachinery validation.go)
const LABEL_NAME_RE = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;
const LABEL_VALUE_RE = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;
const DNS_1123_SUBDOMAIN_RE_FOR_PREFIX = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
const LABEL_VALUE_MAX = 63;
const LABEL_NAME_MAX = 63;
const LABEL_PREFIX_MAX = 253;

/**
 * Validate metadata.name as a DNS-1123 subdomain.
 * Returns an error message if invalid, or null if valid.
 *
 * Empty names are not checked here — KA-S007 handles missing names.
 */
export function validateMetadataName(name: string): string | null {
  if (name.length === 0) return null; // handled by KA-S007
  if (name.length > DNS_1123_SUBDOMAIN_MAX)
    return `metadata.name '${name}' exceeds maximum length of ${DNS_1123_SUBDOMAIN_MAX} characters.`;
  if (!DNS_1123_SUBDOMAIN_RE.test(name))
    return `metadata.name '${name}' is not a valid DNS subdomain. Must consist of lowercase alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`;
  return null;
}

/**
 * Validate a Kubernetes label key (optional prefix/name format).
 * Returns an error message if invalid, or null if valid.
 */
export function validateLabelKey(key: string): string | null {
  const parts = key.split('/');
  if (parts.length > 2) return `Label key '${key}' contains multiple '/' characters.`;

  if (parts.length === 2) {
    const [prefix, name] = parts;
    if (prefix.length > LABEL_PREFIX_MAX)
      return `Label key prefix '${prefix}' exceeds ${LABEL_PREFIX_MAX} characters.`;
    if (!DNS_1123_SUBDOMAIN_RE_FOR_PREFIX.test(prefix))
      return `Label key prefix '${prefix}' is not a valid DNS subdomain.`;
    if (name.length === 0 || name.length > LABEL_NAME_MAX)
      return `Label key name portion must be 1-${LABEL_NAME_MAX} characters.`;
    if (!LABEL_NAME_RE.test(name))
      return `Label key name '${name}' must start/end with alphanumeric and contain only [-_.A-Za-z0-9].`;
  } else {
    if (key.length === 0 || key.length > LABEL_NAME_MAX)
      return `Label key must be 1-${LABEL_NAME_MAX} characters.`;
    if (!LABEL_NAME_RE.test(key))
      return `Label key '${key}' must start/end with alphanumeric and contain only [-_.A-Za-z0-9].`;
  }
  return null;
}

/**
 * Validate a Kubernetes label value.
 * Returns an error message if invalid, or null if valid.
 * Empty label values are valid per K8s spec.
 */
export function validateLabelValue(value: string): string | null {
  if (value === '') return null; // empty label values are valid
  if (value.length > LABEL_VALUE_MAX)
    return `Label value exceeds ${LABEL_VALUE_MAX} characters.`;
  if (!LABEL_VALUE_RE.test(value))
    return `Label value '${value}' must start/end with alphanumeric and contain only [-_.A-Za-z0-9].`;
  return null;
}

/**
 * Check metadata fields for a parsed document.
 *
 * Produces violations for:
 * - KA-S007: Missing metadata.name
 * - KA-S008: Invalid metadata.name format
 * - KA-S009: Invalid label key/value format
 *
 * Skips empty documents and documents without apiVersion/kind
 * (those are handled by other rules).
 */
export function checkMetadata(
  doc: ParsedDocument,
  lineCounter: LineCounter,
): K8sRuleViolation[] {
  const violations: K8sRuleViolation[] = [];

  // Skip empty documents or documents missing apiVersion/kind
  if (doc.isEmpty || !doc.apiVersion || !doc.kind) {
    return violations;
  }

  // KA-S007: Missing metadata.name
  if (!doc.name) {
    const metadataNode = resolveInstancePath(doc.doc, '/metadata');
    const { line, col } = metadataNode
      ? getNodeLine(metadataNode, lineCounter)
      : { line: doc.startLine, col: 1 };
    violations.push({
      ruleId: 'KA-S007',
      line,
      column: col,
      message: 'Missing required field metadata.name.',
    });
    // No point checking name format if name is missing
  } else {
    // KA-S008: Invalid metadata.name format
    const nameError = validateMetadataName(doc.name);
    if (nameError) {
      const nameNode = resolveInstancePath(doc.doc, '/metadata/name');
      const { line, col } = getNodeLine(nameNode, lineCounter);
      violations.push({
        ruleId: 'KA-S008',
        line,
        column: col,
        message: nameError,
      });
    }
  }

  // KA-S009: Invalid label key/value format
  if (doc.labels && Object.keys(doc.labels).length > 0) {
    const labelsNode = resolveInstancePath(doc.doc, '/metadata/labels');

    for (const [key, value] of Object.entries(doc.labels)) {
      const keyError = validateLabelKey(key);
      if (keyError) {
        const { line, col } = getNodeLine(labelsNode, lineCounter);
        violations.push({
          ruleId: 'KA-S009',
          line,
          column: col,
          message: keyError,
        });
      }

      const valError = validateLabelValue(String(value));
      if (valError) {
        const { line, col } = getNodeLine(labelsNode, lineCounter);
        violations.push({
          ruleId: 'KA-S009',
          line,
          column: col,
          message: `Label '${key}': ${valError}`,
        });
      }
    }
  }

  return violations;
}
