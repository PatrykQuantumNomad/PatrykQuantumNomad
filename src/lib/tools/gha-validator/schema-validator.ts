import type { ErrorObject, ValidateFunction } from 'ajv';
import type { Document, LineCounter } from 'yaml';

// Pre-compiled standalone Ajv validator (no `new Function()` at runtime).
// Regenerate with: node scripts/compile-gha-schema.mjs
import { validate as _validate } from './validate-gha.js';

const validate = _validate as ValidateFunction;
import { resolveInstancePath, getNodeLine } from './parser';
import type { GhaRuleViolation } from './types';

// ── Public API ─────────────────────────────────────────────────────

/**
 * Validate a GitHub Actions workflow JSON object against the schema.
 * Returns the raw ajv ErrorObject array (empty when the document is valid).
 */
export function validateGhaSchema(
  json: Record<string, unknown>,
): ErrorObject[] {
  const valid = validate(json);
  if (valid || !validate.errors) {
    return [];
  }
  return validate.errors;
}

/**
 * Map raw ajv errors to domain-specific schema rules (GA-S002 -- GA-S008)
 * with human-readable messages and 1-based line numbers resolved from the AST.
 *
 * GA-S001 (YAML syntax errors) is handled by parser.ts, not here.
 */
export function categorizeSchemaErrors(
  errors: ErrorObject[],
  doc: Document,
  lineCounter: LineCounter,
): GhaRuleViolation[] {
  const raw: { violation: GhaRuleViolation; instancePath: string }[] = [];

  // Track which instancePaths have been categorised into a specific rule
  // so we can suppress fallback oneOf/anyOf duplicates later.
  const specificPaths = new Set<string>();

  for (const error of errors) {
    const categorised = categoriseSingleError(error, doc, lineCounter);
    if (categorised) {
      raw.push({ violation: categorised, instancePath: error.instancePath });
      if (categorised.ruleId !== 'GA-S006') {
        specificPaths.add(error.instancePath);
      }
    }
  }

  // ── oneOf/anyOf suppression ──────────────────────────────────────
  // If any error at a given instancePath was categorised into a specific
  // rule, remove fallback GA-S006 errors at the same path.
  const filtered = raw
    .filter(({ violation, instancePath }) => {
      if (violation.ruleId !== 'GA-S006') return true;
      return !specificPaths.has(instancePath);
    })
    .map(({ violation }) => violation);

  // ── Deduplication ────────────────────────────────────────────────
  // Multiple ajv errors can map to the same rule + line + message.
  const seen = new Set<string>();
  const deduplicated: GhaRuleViolation[] = [];

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

/** Regex patterns for instancePath context extraction */
const JOB_PATH_RE = /^\/jobs\/([^/]+)$/;
const JOB_CHILD_RE = /^\/jobs\/([^/]+)\//;
const STEP_RE = /\/jobs\/([^/]+)\/steps\/(\d+)/;

/**
 * Extract human-readable context from an ajv instancePath.
 * E.g., "/jobs/build/steps/0" -> "in job 'build', step 1"
 */
function pathContext(instancePath: string): string {
  const stepMatch = STEP_RE.exec(instancePath);
  if (stepMatch) {
    const jobName = stepMatch[1];
    const stepIndex = Number.parseInt(stepMatch[2], 10) + 1;
    return `in job '${jobName}', step ${stepIndex}`;
  }

  const jobMatch = JOB_PATH_RE.exec(instancePath) ?? JOB_CHILD_RE.exec(instancePath);
  if (jobMatch) {
    return `in job '${jobMatch[1]}'`;
  }

  if (instancePath === '' || instancePath === '/') {
    return 'at workflow root';
  }

  return `at '${instancePath}'`;
}

/**
 * Categorise a single ajv ErrorObject into a domain-specific GhaRuleViolation.
 */
function categoriseSingleError(
  error: ErrorObject,
  doc: Document,
  lineCounter: LineCounter,
): GhaRuleViolation | null {
  const { keyword, instancePath, params } = error;

  // Resolve AST node for line number
  const node = resolveInstancePath(doc, instancePath);
  const { line, col } = getNodeLine(node, lineCounter);

  // ── GA-S002: Unknown Property (additionalProperties) ─────────────
  if (keyword === 'additionalProperties') {
    const prop = (params as Record<string, unknown>).additionalProperty as string;
    const ctx = pathContext(instancePath);
    return {
      ruleId: 'GA-S002',
      line,
      column: col,
      message: `Unknown property '${prop}' ${ctx}.`,
    };
  }

  // ── GA-S003: Type Mismatch ───────────────────────────────────────
  if (keyword === 'type') {
    const expected = (params as Record<string, unknown>).type as string;
    const actual = typeof error.data;
    const ctx = pathContext(instancePath);
    return {
      ruleId: 'GA-S003',
      line,
      column: col,
      message: `Expected ${expected} but got ${actual} ${ctx}.`,
    };
  }

  // ── GA-S004: Missing Required Field ──────────────────────────────
  if (keyword === 'required') {
    const missing = (params as Record<string, unknown>).missingProperty as string;
    const ctx = pathContext(instancePath);
    return {
      ruleId: 'GA-S004',
      line,
      column: col,
      message: `Missing required property '${missing}' ${ctx}.`,
    };
  }

  // ── GA-S005: Invalid Enum Value ──────────────────────────────────
  if (keyword === 'enum') {
    const allowed = (params as Record<string, unknown>).allowedValues as unknown[];
    const ctx = pathContext(instancePath);
    const values = allowed ? allowed.join(', ') : 'unknown';
    return {
      ruleId: 'GA-S005',
      line,
      column: col,
      message: `Invalid value ${ctx}. Must be one of: ${values}.`,
    };
  }

  // ── GA-S006: Invalid Format (oneOf / anyOf) ──────────────────────
  if (keyword === 'oneOf' || keyword === 'anyOf') {
    const ctx = pathContext(instancePath);
    return {
      ruleId: 'GA-S006',
      line,
      column: col,
      message: `Value does not match any expected format ${ctx}.`,
    };
  }

  // ── GA-S007: Pattern Mismatch ────────────────────────────────────
  if (keyword === 'pattern') {
    const ctx = pathContext(instancePath);
    return {
      ruleId: 'GA-S007',
      line,
      column: col,
      message: `Value does not match expected pattern ${ctx}.`,
    };
  }

  // ── GA-S008: Invalid Structure (fallback) ────────────────────────
  return {
    ruleId: 'GA-S008',
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
