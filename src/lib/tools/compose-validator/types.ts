import type { Document, LineCounter } from 'yaml';

// Rule severity levels matching CodeMirror Diagnostic severity
export type ComposeSeverity = 'error' | 'warning' | 'info';

// Rule categories for grouping and scoring
// Weights: Security 30%, Semantic 25%, Best Practice 20%, Schema 15%, Style 10%
export type ComposeCategory =
  | 'schema'
  | 'security'
  | 'semantic'
  | 'best-practice'
  | 'style';

// Fix suggestion with before/after code
export interface ComposeRuleFix {
  description: string;
  beforeCode: string;
  afterCode: string;
}

// The rule interface -- one per rule file
export interface ComposeLintRule {
  id: string;
  title: string;
  severity: ComposeSeverity;
  category: ComposeCategory;
  explanation: string;
  fix: ComposeRuleFix;
  check(ctx: ComposeRuleContext): ComposeRuleViolation[];
}

// Context passed to each rule's check function
export interface ComposeRuleContext {
  doc: Document;
  rawText: string;
  lineCounter: LineCounter;
  json: Record<string, unknown>;
  services: Map<string, any>;
  networks: Map<string, any>;
  volumes: Map<string, any>;
  secrets: Map<string, any>;
  configs: Map<string, any>;
}

// A single violation found by a rule
export interface ComposeRuleViolation {
  ruleId: string;
  line: number; // 1-based
  endLine?: number;
  column: number; // 1-based
  endColumn?: number;
  message: string;
}

// Score deduction traceable to a specific finding
export interface ComposeScoreDeduction {
  ruleId: string;
  category: ComposeCategory;
  severity: ComposeSeverity;
  points: number;
  line: number;
}

// Per-category score breakdown
export interface ComposeCategoryScore {
  category: ComposeCategory;
  score: number; // 0-100
  weight: number; // percentage weight
  deductions: ComposeScoreDeduction[];
}

// Overall score result
export interface ComposeScoreResult {
  overall: number; // 0-100
  grade: string; // "A+" through "F"
  categories: ComposeCategoryScore[];
  deductions: ComposeScoreDeduction[];
}

// Expanded LintViolation for nanostore (enriched with rule metadata)
export interface ComposeLintViolation extends ComposeRuleViolation {
  severity: ComposeSeverity;
  category: ComposeCategory;
  title: string;
  explanation: string;
  fix: ComposeRuleFix;
}

// Expanded analysis result for nanostore
export interface ComposeAnalysisResult {
  violations: ComposeLintViolation[];
  score: ComposeScoreResult;
  parseSuccess: boolean;
  timestamp: number;
}

// Schema rule metadata (no check method -- ajv drives validation, not per-rule check() calls)
export interface SchemaRuleMetadata {
  id: string;
  title: string;
  severity: ComposeSeverity;
  category: 'schema';
  explanation: string;
  fix: ComposeRuleFix;
}
