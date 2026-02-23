import type { LineCounter, Document } from 'yaml';
import type { ParsedDocument, K8sRuleViolation } from './types';
import { resolveInstancePath, getNodeLine } from './parser';

/**
 * Minimal type for ajv standalone validator functions.
 * Each compiled validator has this shape: call it with data,
 * check return value, and read .errors for diagnostics.
 */
interface ValidateFunction {
  (data: unknown): boolean;
  errors?: ErrorObject[] | null;
}

/**
 * Minimal ajv ErrorObject shape for the fields we use.
 * Avoids requiring the full ajv package at runtime.
 */
interface ErrorObject {
  keyword: string;
  instancePath: string;
  schemaPath: string;
  params: Record<string, unknown>;
  message?: string;
  data?: unknown;
}

// ── Module-level validator cache ────────────────────────────────────

/** Cached validators loaded from the pre-compiled standalone module. */
let validators: Record<string, ValidateFunction> | null = null;

/**
 * Lazily load the pre-compiled ajv standalone validators.
 * The module exports one named validator per K8s resource type
 * (e.g., configmap, deployment, pod). Cached after first call.
 */
export async function loadValidators(): Promise<
  Record<string, ValidateFunction>
> {
  if (validators) return validators;

  // Dynamic import for code splitting -- the 980KB module
  // is only loaded when schema validation is actually needed.
  const mod = (await import('./validate-k8s.js')) as Record<
    string,
    ValidateFunction
  >;
  validators = mod;
  return validators;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Validate a parsed K8s resource against its JSON Schema.
 *
 * @param resourceType - Resource type identifier matching the compiled validator
 *   export name (e.g., 'deployment', 'configmap', 'pod').
 * @param doc - Parsed YAML document with AST for line number resolution.
 * @param lineCounter - Shared LineCounter from the multi-document parser,
 *   used to resolve byte offsets to 1-based line/column positions.
 * @returns Array of KA-S005 violations with field-level line numbers,
 *   or empty array if the resource is schema-valid.
 */
export async function validateResource(
  resourceType: string,
  doc: ParsedDocument,
  lineCounter: LineCounter,
): Promise<K8sRuleViolation[]> {
  if (!doc.json) return [];

  const allValidators = await loadValidators();
  const validate = allValidators[resourceType];

  if (!validate) {
    // No compiled validator for this resource type -- skip schema validation.
    // This should not happen if GVK registry and compile script are in sync.
    return [];
  }

  const valid = validate(doc.json);

  if (valid || !validate.errors || validate.errors.length === 0) {
    return [];
  }

  // Deduplicate by instancePath + keyword + message to suppress
  // redundant errors from oneOf/anyOf branches.
  const seen = new Set<string>();
  const violations: K8sRuleViolation[] = [];

  for (const error of validate.errors) {
    const dedupeKey = `${error.instancePath}|${error.keyword}|${error.message ?? ''}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    violations.push(
      mapAjvErrorToViolation(error, doc.doc, lineCounter),
    );
  }

  return violations;
}

// ── Internal helpers ────────────────────────────────────────────────

/**
 * Map a single ajv ErrorObject to a K8sRuleViolation with line numbers
 * resolved from the YAML AST.
 */
function mapAjvErrorToViolation(
  error: ErrorObject,
  doc: Document,
  lineCounter: LineCounter,
): K8sRuleViolation {
  // Resolve the AST node at the error's JSON Pointer path
  const node = resolveInstancePath(doc, error.instancePath);
  const { line, col } = getNodeLine(node, lineCounter);

  return {
    ruleId: 'KA-S005',
    line,
    column: col,
    message: humanizeAjvError(error),
  };
}

/**
 * Transform raw ajv error messages into human-readable text.
 * Follows the same pattern as compose-validator's humanizeAjvError.
 */
function humanizeAjvError(error: ErrorObject): string {
  const { keyword, params, instancePath } = error;

  // Build a field path for context (e.g., "spec.template.spec.containers[0]")
  const fieldPath = instancePath
    .split('/')
    .filter((s) => s !== '')
    .map((s) => (/^\d+$/.test(s) ? `[${s}]` : s))
    .join('.')
    .replace(/\.\[/g, '[');

  const prefix = fieldPath ? `'${fieldPath}': ` : '';

  switch (keyword) {
    case 'additionalProperties': {
      const prop = params.additionalProperty as string;
      return `${prefix}Unknown property '${prop}'.`;
    }
    case 'required': {
      const missing = params.missingProperty as string;
      return `${prefix}Missing required property '${missing}'.`;
    }
    case 'type': {
      const expected = params.type as string;
      const actual = typeof error.data;
      return `${prefix}Expected ${expected} but got ${actual}.`;
    }
    case 'enum': {
      const allowed = params.allowedValues as unknown[];
      return `${prefix}Value must be one of: ${allowed?.join(', ') ?? 'unknown'}.`;
    }
    case 'pattern':
      return `${prefix}Value does not match expected format.`;
    case 'oneOf':
      return `${prefix}Value does not match any of the expected formats.`;
    case 'anyOf':
      return `${prefix}Value does not match any of the expected formats.`;
    case 'minimum': {
      const limit = params.limit as number;
      return `${prefix}Value must be >= ${limit}.`;
    }
    case 'maximum': {
      const limit = params.limit as number;
      return `${prefix}Value must be <= ${limit}.`;
    }
    case 'minLength': {
      const limit = params.limit as number;
      return `${prefix}String must be at least ${limit} character(s) long.`;
    }
    case 'maxLength': {
      const limit = params.limit as number;
      return `${prefix}String must be at most ${limit} character(s) long.`;
    }
    case 'minItems': {
      const limit = params.limit as number;
      return `${prefix}Array must have at least ${limit} item(s).`;
    }
    case 'maxItems': {
      const limit = params.limit as number;
      return `${prefix}Array must have at most ${limit} item(s).`;
    }
    case 'uniqueItems':
      return `${prefix}Array items must be unique.`;
    default: {
      // Capitalize and clean up the raw ajv message
      const raw = error.message ?? 'Unknown validation error';
      const cleaned = raw.replace(/^must /, '').replace(/\.$/, '');
      return `${prefix}${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)}.`;
    }
  }
}
