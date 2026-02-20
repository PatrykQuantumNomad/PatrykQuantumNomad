// Rule severity levels matching CodeMirror Diagnostic severity
export type RuleSeverity = 'error' | 'warning' | 'info';

// Rule categories for grouping and scoring (Phase 23)
export type RuleCategory =
  | 'security'
  | 'efficiency'
  | 'maintainability'
  | 'reliability'
  | 'best-practice';

// Stub for lint violation -- will be expanded in Phase 23 with rule engine
export interface LintViolation {
  line: number; // 1-based line number
  message: string;
  severity: RuleSeverity;
  category: RuleCategory;
  ruleId: string; // e.g., "DL3006", "PG001"
}

// Analysis result stored in nanostore
export interface AnalysisResult {
  violations: LintViolation[];
  astNodeCount: number;
  parseSuccess: boolean;
  timestamp: number;
}
