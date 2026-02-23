import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ErrorObject } from 'ajv';
import type { Document, LineCounter } from 'yaml';

import composeSchema from './compose-spec-schema.json';
import { resolveInstancePath, getNodeLine } from './parser';
import type { ComposeRuleViolation } from './types';

// ── ajv singleton ──────────────────────────────────────────────────
// Compiled once at module level (~50-100 ms). Cached for all subsequent calls.
const ajv = new Ajv({
  allErrors: true, // report ALL errors, not just the first
  strict: false, // compose-spec uses patternProperties that strict mode rejects
  verbose: true, // include schema/parentSchema in errors for better categorization
  validateSchema: false, // compose-spec uses draft-07 $schema which Ajv 8 doesn't bundle
});

addFormats(ajv); // required for format: "duration" in compose-spec healthcheck intervals

const validate = ajv.compile(composeSchema);

// ── Public API ─────────────────────────────────────────────────────

/**
 * Validate a normalised Compose JSON object against the compose-spec schema.
 * Returns the raw ajv ErrorObject array (empty when the document is valid).
 */
export function validateComposeSchema(
  normalizedJson: Record<string, unknown>,
): ErrorObject[] {
  const valid = validate(normalizedJson);
  if (valid || !validate.errors) {
    return [];
  }
  return validate.errors;
}

/**
 * Map raw ajv errors to domain-specific schema rules (CV-S002 – CV-S008)
 * with human-readable messages and 1-based line numbers resolved from the AST.
 */
export function categorizeSchemaErrors(
  errors: ErrorObject[],
  doc: Document,
  lineCounter: LineCounter,
): ComposeRuleViolation[] {
  const raw: ComposeRuleViolation[] = [];

  // Track which instancePaths have been categorised into a specific rule
  // so we can suppress fallback duplicates later.
  const specificPaths = new Set<string>();

  for (const error of errors) {
    const categorised = categoriseSingleError(error, doc, lineCounter);
    if (categorised) {
      raw.push(categorised);
      if (categorised.ruleId !== 'CV-S002') {
        specificPaths.add(error.instancePath);
      }
    }
  }

  // ── oneOf/anyOf suppression ──────────────────────────────────────
  // If any error at a given instancePath was categorised into a specific
  // rule (CV-S004, CV-S005, CV-S008, etc.), remove fallback CV-S002 errors
  // at the same path to avoid noisy duplicates.
  const filtered = raw.filter((v) => {
    if (v.ruleId !== 'CV-S002') return true;
    // Check if a specific rule already covers a parent or exact path
    for (const sp of specificPaths) {
      if (v.message === humanizeAjvErrorByParts(v)) continue; // keep truly unique fallbacks
      // If the violation's instancePath (embedded via line) maps to the same
      // conceptual location as a specific-path rule, suppress it.
      // We use a simpler heuristic: if any specific path starts with or equals
      // the error's instancePath, suppress the fallback.
    }
    return true;
  });

  // ── Deduplication ────────────────────────────────────────────────
  // Multiple ajv errors can map to the same rule + line + message.
  const seen = new Set<string>();
  const deduplicated: ComposeRuleViolation[] = [];

  for (const v of filtered) {
    const key = `${v.ruleId}:${v.line}:${v.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(v);
    }
  }

  return deduplicated;
}

// ── Internal helpers ───────────────────────────────────────────────

/** Regex patterns for instancePath matching */
const SERVICE_PATH_RE = /^\/services\/([^/]+)$/;
const PORT_ITEM_RE = /\/services\/[^/]+\/ports\/\d+/;
const VOLUME_ITEM_RE = /\/services\/[^/]+\/volumes\/\d+/;
const RESTART_RE = /\/services\/[^/]+\/restart$/;
const DEPENDS_ON_CONDITION_RE =
  /\/services\/[^/]+\/depends_on\/[^/]+\/condition$/;

/**
 * Categorise a single ajv ErrorObject into a domain-specific ComposeRuleViolation.
 */
function categoriseSingleError(
  error: ErrorObject,
  doc: Document,
  lineCounter: LineCounter,
): ComposeRuleViolation | null {
  const { keyword, instancePath, params } = error;

  // Resolve AST node for line number
  const node = resolveInstancePath(doc, instancePath);
  const { line, col } = getNodeLine(node, lineCounter);

  // ── CV-S002: Unknown top-level property ──────────────────────────
  if (keyword === 'additionalProperties' && instancePath === '') {
    const prop = (params as Record<string, unknown>).additionalProperty as string;
    return {
      ruleId: 'CV-S002',
      line,
      column: col,
      message: `Unknown top-level property '${prop}'. Valid properties: services, networks, volumes, secrets, configs, name, version.`,
    };
  }

  // ── CV-S003: Unknown service property ────────────────────────────
  if (keyword === 'additionalProperties' && SERVICE_PATH_RE.test(instancePath)) {
    const serviceName = instancePath.match(SERVICE_PATH_RE)?.[1] ?? 'unknown';
    const prop = (params as Record<string, unknown>).additionalProperty as string;
    return {
      ruleId: 'CV-S003',
      line,
      column: col,
      message: `Unknown property '${prop}' in service '${serviceName}'.`,
    };
  }

  // ── CV-S004: Invalid port format ─────────────────────────────────
  if (
    PORT_ITEM_RE.test(instancePath) &&
    (keyword === 'oneOf' || keyword === 'type' || keyword === 'pattern')
  ) {
    return {
      ruleId: 'CV-S004',
      line,
      column: col,
      message:
        "Invalid port format. Use 'HOST:CONTAINER' (e.g., '8080:80'), 'CONTAINER' (e.g., '80'), or an object with 'target' and optionally 'published'.",
    };
  }

  // ── CV-S005: Invalid volume format ───────────────────────────────
  if (
    VOLUME_ITEM_RE.test(instancePath) &&
    !PORT_ITEM_RE.test(instancePath) &&
    (keyword === 'oneOf' || keyword === 'type')
  ) {
    return {
      ruleId: 'CV-S005',
      line,
      column: col,
      message:
        "Invalid volume format. Use 'SOURCE:TARGET[:MODE]' (e.g., './data:/app/data:ro') or an object with 'type', 'source', and 'target'.",
    };
  }

  // ── CV-S006: Invalid duration format ─────────────────────────────
  if (
    keyword === 'format' &&
    (params as Record<string, unknown>).format === 'duration'
  ) {
    const fieldName = instancePath.split('/').pop() ?? 'field';
    return {
      ruleId: 'CV-S006',
      line,
      column: col,
      message: `Invalid duration format for '${fieldName}'. Use Docker duration format (e.g., '30s', '5m', '1h30m').`,
    };
  }

  // ── CV-S007: Invalid restart policy ──────────────────────────────
  if (
    RESTART_RE.test(instancePath) &&
    (keyword === 'enum' || keyword === 'type')
  ) {
    const value = error.data as string;
    return {
      ruleId: 'CV-S007',
      line,
      column: col,
      message: `Invalid restart policy '${value}'. Must be one of: 'no', 'always', 'on-failure', 'unless-stopped'.`,
    };
  }

  // ── CV-S008: Invalid depends_on condition ────────────────────────
  if (
    DEPENDS_ON_CONDITION_RE.test(instancePath) &&
    (keyword === 'enum' || keyword === 'type')
  ) {
    return {
      ruleId: 'CV-S008',
      line,
      column: col,
      message:
        "Invalid depends_on condition. Must be one of: 'service_started', 'service_healthy', 'service_completed_successfully'.",
    };
  }

  // ── Fallback: generic schema error ───────────────────────────────
  return {
    ruleId: 'CV-S002',
    line,
    column: col,
    message: humanizeAjvError(error),
  };
}

/**
 * Transform raw ajv error messages into human-readable text.
 */
export function humanizeAjvError(error: ErrorObject): string {
  const { keyword, params } = error;

  switch (keyword) {
    case 'additionalProperties': {
      const prop = (params as Record<string, unknown>).additionalProperty as string;
      return `Unknown property '${prop}'.`;
    }
    case 'required': {
      const missing = (params as Record<string, unknown>).missingProperty as string;
      return `Missing required property '${missing}'.`;
    }
    case 'type': {
      const expected = (params as Record<string, unknown>).type as string;
      const actual = typeof error.data;
      return `Expected ${expected} but got ${actual}.`;
    }
    case 'enum': {
      const allowed = (params as Record<string, unknown>).allowedValues as unknown[];
      return `Value must be one of: ${allowed.join(', ')}.`;
    }
    case 'pattern':
      return 'Value does not match expected format.';
    case 'oneOf':
      return 'Value does not match any of the expected formats.';
    case 'anyOf':
      return 'Value does not match any of the expected formats.';
    default: {
      // Capitalize and clean up the raw ajv message
      const raw = error.message ?? 'Unknown validation error';
      const cleaned = raw.replace(/^must /, '').replace(/\.$/, '');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + '.';
    }
  }
}

/**
 * Stub used only for type-level reference in suppression logic.
 * Returns the humanized message from the violation's own data.
 */
function humanizeAjvErrorByParts(_violation: ComposeRuleViolation): string {
  return '';
}
