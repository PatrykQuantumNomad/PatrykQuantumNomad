import type { Document, LineCounter } from 'yaml';

// Rule severity levels matching CodeMirror Diagnostic severity
export type K8sSeverity = 'error' | 'warning' | 'info';

// Rule categories for grouping and scoring
// Weights: Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%
export type K8sCategory =
  | 'schema'
  | 'security'
  | 'reliability'
  | 'best-practice'
  | 'cross-resource';

// Fix suggestion with before/after code
export interface K8sRuleFix {
  description: string;
  beforeCode: string;
  afterCode: string;
}

// A single violation found by a rule
export interface K8sRuleViolation {
  ruleId: string;
  line: number; // 1-based
  endLine?: number;
  column: number; // 1-based
  endColumn?: number;
  message: string;
}

// Context passed to each rule's check function (multi-resource, not single-doc)
// Forward reference: ResourceRegistry is defined in resource-registry.ts, imported at use site
export interface K8sRuleContext {
  resources: ParsedResource[];
  registry: ResourceRegistry;
  lineCounter: LineCounter;
  rawText: string;
}

// The rule interface, one per rule file
export interface K8sLintRule {
  id: string;
  title: string;
  severity: K8sSeverity;
  category: K8sCategory;
  explanation: string;
  fix: K8sRuleFix;
  check(ctx: K8sRuleContext): K8sRuleViolation[];
}

// Expanded LintViolation for nanostore (enriched with rule metadata + resource identification)
export interface K8sLintViolation extends K8sRuleViolation {
  severity: K8sSeverity;
  category: K8sCategory;
  title: string;
  explanation: string;
  fix: K8sRuleFix;
  resourceName?: string;
  resourceKind?: string;
}

// Score deduction traceable to a specific finding
export interface K8sScoreDeduction {
  ruleId: string;
  category: K8sCategory;
  severity: K8sSeverity;
  points: number;
  line: number;
}

// Per-category score breakdown
export interface K8sCategoryScore {
  category: K8sCategory;
  score: number; // 0-100
  weight: number; // percentage weight
  deductions: K8sScoreDeduction[];
}

// Overall score result
export interface K8sScoreResult {
  overall: number; // 0-100
  grade: string; // "A+" through "F"
  categories: K8sCategoryScore[];
  deductions: K8sScoreDeduction[];
}

// Expanded analysis result for nanostore
export interface K8sAnalysisResult {
  violations: K8sLintViolation[];
  score: K8sScoreResult;
  resources: ParsedResource[];
  resourceSummary: Map<string, number>;
  parseSuccess: boolean;
  timestamp: number;
}

// Parsed YAML document with extracted metadata
export interface ParsedDocument {
  doc: Document;
  json: Record<string, unknown> | null;
  apiVersion: string | null;
  kind: string | null;
  name: string | null;
  namespace: string | null;
  labels: Record<string, string>;
  startLine: number; // 1-based line in full input
  isEmpty: boolean;
}

// Multi-document YAML parse result
export interface K8sParseResult {
  documents: ParsedDocument[];
  lineCounter: LineCounter;
  parseErrors: K8sRuleViolation[];
}

// Validated resource extracted from a parsed document (namespace defaults to 'default')
export interface ParsedResource {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string; // 'default' when unspecified
  labels: Record<string, string>;
  annotations: Record<string, string>;
  doc: Document;
  json: Record<string, unknown>;
  startLine: number;
}

// PSS (Pod Security Standards) compliance summary
export interface PssComplianceSummary {
  baselineViolations: number;
  restrictedViolations: number;
  totalPssViolations: number;
  baselineCompliant: boolean;
  restrictedCompliant: boolean;
}

// Engine result from running all rules
export interface K8sEngineResult {
  violations: K8sRuleViolation[];
  resources: ParsedResource[];
  resourceSummary: Map<string, number>;
  rulesRun: number;
  rulesPassed: number;
  pssCompliance: PssComplianceSummary;
}

// Schema rule metadata (no check method; ajv drives validation, not per-rule check() calls)
export interface SchemaRuleMetadata {
  id: string;
  title: string;
  severity: K8sSeverity;
  category: 'schema';
  explanation: string;
  fix: K8sRuleFix;
}

// Forward reference interface for ResourceRegistry (defined in resource-registry.ts)
// Imported at use site; declared here for K8sRuleContext typing
export interface ResourceRegistry {
  add(resource: ParsedResource): void;
  getByKind(kind: string): ParsedResource[];
  getByName(kind: string, namespace: string, name: string): ParsedResource | undefined;
  getByLabels(selector: Record<string, string>): ParsedResource[];
  getSummary(): Map<string, number>;
  getAll(): ParsedResource[];
}
