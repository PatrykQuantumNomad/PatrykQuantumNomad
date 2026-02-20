// Rule severity levels matching CodeMirror Diagnostic severity
export type RuleSeverity = 'error' | 'warning' | 'info';

// Rule categories for grouping and scoring
export type RuleCategory =
  | 'security'
  | 'efficiency'
  | 'maintainability'
  | 'reliability'
  | 'best-practice';

// Fix suggestion with before/after code
export interface RuleFix {
  description: string;
  beforeCode: string;
  afterCode: string;
}

// The rule interface -- one per rule file
export interface LintRule {
  id: string;
  title: string;
  severity: RuleSeverity;
  category: RuleCategory;
  explanation: string;
  fix: RuleFix;
  check(
    dockerfile: import('dockerfile-ast').Dockerfile,
    rawText: string,
  ): RuleViolation[];
}

// A single violation found by a rule
export interface RuleViolation {
  ruleId: string;
  line: number; // 1-based
  endLine?: number;
  column: number; // 1-based
  endColumn?: number;
  message: string;
}

// Score deduction traceable to a specific finding
export interface ScoreDeduction {
  ruleId: string;
  category: RuleCategory;
  severity: RuleSeverity;
  points: number;
  line: number;
}

// Per-category score breakdown
export interface CategoryScore {
  category: RuleCategory;
  score: number; // 0-100
  weight: number; // percentage weight
  deductions: ScoreDeduction[];
}

// Overall score result
export interface ScoreResult {
  overall: number; // 0-100
  grade: string; // "A+" through "F"
  categories: CategoryScore[];
  deductions: ScoreDeduction[];
}

// Expanded LintViolation for nanostore (enriched with rule metadata)
export interface LintViolation extends RuleViolation {
  severity: RuleSeverity;
  category: RuleCategory;
  title: string;
  explanation: string;
  fix: RuleFix;
}

// Expanded analysis result for nanostore
export interface AnalysisResult {
  violations: LintViolation[];
  score: ScoreResult;
  astNodeCount: number;
  parseSuccess: boolean;
  timestamp: number;
}
