/**
 * Two-pass validation engine for GitHub Actions workflows.
 *
 * Pass 1 (synchronous): Schema validation + custom lint rules.
 * Pass 2 (async merge): Combines Pass 1 results with actionlint WASM output.
 *
 * Deduplication keys on `${line}:${column}` -- Pass 1 findings take precedence
 * when both passes flag the same position.
 *
 * Follows the compose-validator engine.ts pattern but with two-pass architecture.
 */

import { parseGhaWorkflow } from './parser';
import { validateGhaSchema, categorizeSchemaErrors } from './schema-validator';
import type {
  GhaUnifiedViolation,
  GhaLintRule,
  GhaRuleContext,
  GhaRuleViolation,
  ActionlintError,
  GhaSeverity,
  GhaCategory,
} from './types';

// ── Actionlint error kind -> GA-L* rule ID mapping ──────────────────

/**
 * Maps all 16 actionlint error kinds to stable GA-L* rule IDs with
 * appropriate severity and category.
 *
 * Source: actionlint docs/checks.md
 */
const ACTIONLINT_KIND_MAP: Record<
  string,
  { ruleId: string; severity: GhaSeverity; category: GhaCategory }
> = {
  'syntax-check': { ruleId: 'GA-L001', severity: 'error', category: 'semantic' },
  expression: { ruleId: 'GA-L002', severity: 'error', category: 'semantic' },
  'job-needs': { ruleId: 'GA-L003', severity: 'error', category: 'semantic' },
  matrix: { ruleId: 'GA-L004', severity: 'error', category: 'semantic' },
  events: { ruleId: 'GA-L005', severity: 'error', category: 'semantic' },
  glob: { ruleId: 'GA-L006', severity: 'warning', category: 'semantic' },
  action: { ruleId: 'GA-L007', severity: 'error', category: 'semantic' },
  'runner-label': { ruleId: 'GA-L008', severity: 'error', category: 'semantic' },
  'shell-name': { ruleId: 'GA-L009', severity: 'error', category: 'semantic' },
  id: { ruleId: 'GA-L010', severity: 'error', category: 'semantic' },
  credentials: { ruleId: 'GA-L011', severity: 'error', category: 'security' },
  'env-var': { ruleId: 'GA-L012', severity: 'warning', category: 'semantic' },
  permissions: { ruleId: 'GA-L013', severity: 'error', category: 'security' },
  'workflow-call': { ruleId: 'GA-L014', severity: 'error', category: 'semantic' },
  shellcheck: { ruleId: 'GA-L017', severity: 'warning', category: 'actionlint' },
  pyflakes: { ruleId: 'GA-L018', severity: 'warning', category: 'actionlint' },
};

/** Fallback for unknown actionlint error kinds */
const ACTIONLINT_FALLBACK = {
  ruleId: 'GA-L000',
  severity: 'warning' as GhaSeverity,
  category: 'actionlint' as GhaCategory,
};

// ── Result type ─────────────────────────────────────────────────────

/** Result from the GHA engine (returned by both runPass1 and mergePass2). */
export interface GhaEngineResult {
  violations: GhaUnifiedViolation[];
  rulesRun: number;
  rulesPassed: number;
  pass: 1 | 2;
}

// ── Conversion utilities ────────────────────────────────────────────

/**
 * Convert a base GhaRuleViolation to a GhaUnifiedViolation by adding
 * severity and category.
 */
export function toUnified(
  v: GhaRuleViolation,
  severity: GhaSeverity,
  category: GhaCategory,
): GhaUnifiedViolation {
  return {
    ruleId: v.ruleId,
    message: v.message,
    line: v.line,
    column: v.column,
    severity,
    category,
    ...(v.endLine !== undefined && { endLine: v.endLine }),
    ...(v.endColumn !== undefined && { endColumn: v.endColumn }),
  };
}

/**
 * Map an actionlint error to a GhaUnifiedViolation using the kind-to-rule mapping.
 * Falls back to GA-L000 for unknown kinds.
 */
export function mapActionlintError(err: ActionlintError): GhaUnifiedViolation {
  const mapping = ACTIONLINT_KIND_MAP[err.kind] ?? ACTIONLINT_FALLBACK;
  return {
    ruleId: mapping.ruleId,
    message: err.message,
    line: err.line,
    column: err.column,
    severity: mapping.severity,
    category: mapping.category,
  };
}

// ── Pass 1: Synchronous schema + custom rules ──────────────────────

/**
 * Pass 1: Synchronous validation pipeline.
 *
 * Steps:
 * 1. Parse YAML via parseGhaWorkflow
 * 2. Convert parse errors to unified format
 * 3. Run schema validation (if JSON available)
 * 4. Run custom rules (if JSON available and rules provided)
 * 5. Sort violations by line then column
 *
 * The `customRules` parameter defaults to empty array. This keeps engine.ts
 * independent of which rules exist -- rules are injected by the caller.
 */
export function runPass1(
  rawText: string,
  customRules: GhaLintRule[] = [],
): GhaEngineResult {
  const parseResult = parseGhaWorkflow(rawText);
  const violations: GhaUnifiedViolation[] = [];

  // ── YAML parse errors -> unified format ──
  for (const err of parseResult.parseErrors) {
    violations.push(toUnified(err, 'error', 'schema'));
  }

  // ── Schema validation ──
  if (parseResult.json) {
    const schemaErrors = validateGhaSchema(parseResult.json);
    const schemaViolations = categorizeSchemaErrors(
      schemaErrors,
      parseResult.doc,
      parseResult.lineCounter,
    );
    for (const v of schemaViolations) {
      violations.push(toUnified(v, 'error', 'schema'));
    }
  }

  // ── Custom rules (security, etc.) ──
  let rulesPassed = 0;
  if (parseResult.json) {
    const ctx: GhaRuleContext = {
      doc: parseResult.doc,
      rawText,
      lineCounter: parseResult.lineCounter,
      json: parseResult.json,
    };

    for (const rule of customRules) {
      const ruleViolations = rule.check(ctx);
      if (ruleViolations.length === 0) {
        rulesPassed++;
      }
      for (const v of ruleViolations) {
        violations.push(toUnified(v, rule.severity, rule.category));
      }
    }
  }

  // Sort by line, then column for consistent output
  violations.sort((a, b) => a.line - b.line || a.column - b.column);

  // Schema rules count: 8 (GA-S001 through GA-S008)
  const schemaRuleCount = 8;

  return {
    violations,
    rulesRun: customRules.length + schemaRuleCount,
    rulesPassed,
    pass: 1,
  };
}

// ── Pass 2: Merge actionlint WASM results ──────────────────────────

/**
 * Merge Pass 2 (actionlint WASM) results into existing Pass 1 results.
 *
 * Deduplicates on `${line}:${column}` -- Pass 1 findings take precedence.
 * This handles the overlap between custom rules (e.g. GA-C005 script injection)
 * and actionlint's built-in checks (e.g. `expression` kind).
 */
export function mergePass2(
  pass1Violations: GhaUnifiedViolation[],
  actionlintErrors: ActionlintError[],
): GhaEngineResult {
  // Build occupied set from Pass 1 positions
  const occupied = new Set(
    pass1Violations.map((v) => `${v.line}:${v.column}`),
  );

  // Map actionlint errors, skipping duplicates
  const pass2Violations: GhaUnifiedViolation[] = [];
  for (const err of actionlintErrors) {
    const key = `${err.line}:${err.column}`;
    if (!occupied.has(key)) {
      pass2Violations.push(mapActionlintError(err));
      occupied.add(key);
    }
  }

  // Merge and sort
  const merged = [...pass1Violations, ...pass2Violations];
  merged.sort((a, b) => a.line - b.line || a.column - b.column);

  return {
    violations: merged,
    rulesRun: pass1Violations.length + pass2Violations.length,
    rulesPassed: 0,
    pass: 2,
  };
}
