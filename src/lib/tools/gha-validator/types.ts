// GHA severity levels matching CodeMirror Diagnostic severity
export type GhaSeverity = 'error' | 'warning' | 'info';

// GHA rule categories for grouping and scoring
// Weights: Security 35%, Semantic 20%, Best Practice 20%, Schema 15%, Style 10%
// Note: 'actionlint' category excluded from scoring (0% weight)
export type GhaCategory =
  | 'schema'
  | 'security'
  | 'semantic'
  | 'best-practice'
  | 'style'
  | 'actionlint';

// Fix suggestion with before/after code
export interface GhaRuleFix {
  description: string;
  beforeCode: string;
  afterCode: string;
}

// A single violation found by a rule
export interface GhaRuleViolation {
  ruleId: string;
  line: number; // 1-based
  endLine?: number;
  column: number; // 1-based
  endColumn?: number;
  message: string;
}

// Actionlint WASM binary output format
export interface ActionlintError {
  kind: string; // e.g., 'syntax-check', 'expression', 'action'
  message: string;
  line: number; // 1-based
  column: number; // 1-based
}

// WASM download progress
export interface WasmProgress {
  received: number; // bytes downloaded
  total: number; // total bytes (from Content-Length)
}

// Worker -> Main thread message types
export type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'result'; payload: ActionlintError[] }
  | { type: 'error'; payload: string }
  | { type: 'progress'; payload: WasmProgress };

// Main thread -> Worker message types
export type WorkerInMessage = { type: 'analyze'; payload: string };

// ── Phase 76: Rule engine types ──────────────────────────────────

/** Unified violation format for all passes (ENGINE-04) */
export interface GhaUnifiedViolation {
  ruleId: string;
  message: string;
  line: number; // 1-based
  column: number; // 1-based
  severity: GhaSeverity;
  category: GhaCategory;
  endLine?: number;
  endColumn?: number;
}

/** Custom lint rule interface (follows compose-validator ComposeLintRule pattern) */
export interface GhaLintRule {
  id: string;
  title: string;
  severity: GhaSeverity;
  category: GhaCategory;
  explanation: string;
  fix: GhaRuleFix;
  check(ctx: GhaRuleContext): GhaRuleViolation[];
}

/** Context passed to each custom rule's check() method */
export interface GhaRuleContext {
  doc: import('yaml').Document;
  rawText: string;
  lineCounter: import('yaml').LineCounter;
  json: Record<string, unknown>;
}

// ── Phase 78: Scoring types ─────────────────────────────────────

/** A single point deduction within a category */
export interface GhaScoreDeduction {
  ruleId: string;
  category: GhaCategory;
  severity: GhaSeverity;
  points: number;
  line: number;
}

/** Per-category score with weight and deduction breakdown */
export interface GhaCategoryScore {
  category: string;
  score: number; // 0-100
  weight: number; // percentage weight
  deductions: GhaScoreDeduction[];
}

/** Overall score result with grade and per-category breakdown */
export interface GhaScoreResult {
  overall: number; // 0-100
  grade: string; // "A+" through "F"
  categories: GhaCategoryScore[];
  deductions: GhaScoreDeduction[];
}
