# Phase 23: Rule Engine & Scoring - Research

**Researched:** 2026-02-20
**Domain:** Client-side Dockerfile lint rule engine with modular architecture, dockerfile-ast-based detection, and category-weighted scoring algorithm
**Confidence:** HIGH

## Summary

Phase 23 builds the core analysis engine that evaluates Dockerfiles against 40 expert rules organized across 5 categories (Security, Efficiency, Maintainability, Reliability, Best Practice), then produces a transparent weighted score (0-100 with letter grades A+ through F). This is a pure logic phase -- no UI work. The engine runs entirely client-side in the browser, operates on the `dockerfile-ast` AST already validated in Phase 22, and outputs structured data that Phase 24 will display.

The existing Phase 22 codebase provides clean integration points: `EditorPanel.tsx` has an `analyzeRef.current` callback that currently produces empty diagnostics and violations. Phase 23 replaces that empty pipeline with a full rule engine and scorer. The `types.ts` file already defines `LintViolation`, `RuleCategory`, `RuleSeverity`, and `AnalysisResult` interfaces -- these need expansion but the foundation is solid.

The major technical challenge is not the rule logic (most rules are straightforward AST inspections) but the scoring calibration. The requirements specify exact category weights (Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10%) and demand that the sample Dockerfile demonstrates "meaningful differentiation" -- not clustering at 85-100. Analysis of the sample Dockerfile against the planned 40 rules reveals it will trigger approximately 18-22 violations across all 5 categories, producing a score in the 35-50 range. This is good differentiation but requires careful per-rule deduction calibration to prevent scores from clustering too low.

**Primary recommendation:** Build the `LintRule` interface and engine first with 5 proof-of-concept rules (one per category), validate the scoring math, then implement the remaining 35 rules in category-ordered batches. Use a deduction model where each violation subtracts from a per-category 100-point baseline, then compute the weighted aggregate.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RULE-01 | 15 Tier 1 critical rules (DL3006, DL3007, DL4000, DL3020, DL3025, DL3000, DL3004, DL3002, DL3059, DL3014, DL3015, DL3008, DL4003, DL4004, DL3061) | Complete rule catalog with Hadolint-verified descriptions, severity levels, detection approach via dockerfile-ast API, and category assignment for all 15 rules |
| RULE-02 | 15 Tier 2 high-value rules (DL3003, DL3009, DL3011, DL3027, DL4006, DL3042, DL3013, DL3045, DL3019, DL3012, DL3024, plus custom: secrets in ENV/ARG, curl-pipe-shell, COPY sensitive files) | Complete catalog including 4 custom PG-prefixed rules with regex-based and AST-based detection strategies |
| RULE-03 | 10 Tier 3 nice-to-have rules (DL4001, DL3057, DL3001, DL3022, inconsistent casing, legacy ENV format, yum/dnf/zypper rules) | Complete catalog; legacy ENV format uses Property API; casing detection via getInstruction() vs getKeyword() comparison |
| RULE-04 | Modular rule architecture -- LintRule interface, one file per rule, category subdirectories | LintRule interface design, file structure with category subdirectories, rule registry pattern, engine runner pattern |
| RULE-05 | Expert-voice explanation per rule with production consequences | Explanation template with "why this matters in production" framing, sourced from Hadolint wiki and Docker best practices |
| RULE-06 | Actionable fix suggestion per rule with before/after code examples | Fix suggestion structure with beforeCode/afterCode fields, verified patterns from Docker best practices |
| RULE-07 | Rule codes: DL-prefixed (Hadolint-compatible) and PG-prefixed (custom rules) | DL prefix mapping for all 36 Hadolint-aligned rules, PG prefix convention for 4 custom rules |
| SCORE-01 | Category-weighted scoring algorithm (Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10%) | Deduction-based scoring model with per-category baselines, severity multipliers, and diminishing returns formula |
| SCORE-02 | Overall 0-100 score with letter grade (A+ through F) | Letter grade thresholds (A+ >= 97, A >= 93, ... F < 60), weighted aggregate formula |
| SCORE-03 | Per-category sub-scores displayed alongside aggregate | CategoryScore interface with per-category 0-100 scores, deduction tracking |
| SCORE-04 | Transparent deductions visible per finding | Each LintViolation carries a `deduction` field showing exact point impact; ScoreResult includes `deductions` array |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- NO new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `dockerfile-ast` | ^0.7.1 | Parse Dockerfile into typed AST for rule inspection | Already installed and validated in Phase 22. Provides `getInstructions()`, `getARGs()`, `getENVs()`, `getCOPYs()`, `getFROMs()`, typed instruction classes with `getKeyword()`, `getArgumentsContent()`, `getRange()` |
| `nanostores` | ^1.1.0 | Store analysis results (violations + score) for React consumption | Already installed. `analysisResult` atom exists in `dockerfileAnalyzerStore.ts` |
| `@codemirror/lint` | (via codemirror) | `setDiagnostics` to push violations as editor annotations | Already installed. Phase 22 already dispatches `setDiagnostics` |

### No New Dependencies Required
This phase is pure TypeScript logic files. No new npm packages are needed.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/dockerfile-analyzer/
  types.ts                          # Expanded types (LintRule, ScoreResult, etc.)
  parser.ts                         # Existing -- unchanged
  engine.ts                         # NEW: RuleEngine.run(ast, rawText) -> LintViolation[]
  scorer.ts                         # NEW: computeScore(violations) -> ScoreResult
  rules/
    index.ts                        # Rule registry -- imports all, exports allRules[]
    types.ts                        # LintRule interface (or co-locate in parent types.ts)
    security/
      DL3002-no-root-user.ts
      DL3004-no-sudo.ts
      DL3006-tag-version.ts
      DL3007-no-latest.ts
      DL3008-pin-apt-versions.ts
      DL3020-use-copy-not-add.ts
      DL3061-from-first.ts
      PG001-secrets-in-env.ts
      PG002-curl-pipe-shell.ts
      PG003-copy-sensitive-files.ts
    efficiency/
      DL3003-use-workdir.ts
      DL3009-remove-apt-lists.ts
      DL3014-use-apt-y.ts
      DL3015-no-install-recommends.ts
      DL3019-use-apk-no-cache.ts
      DL3042-pip-no-cache-dir.ts
      DL3059-consolidate-runs.ts
      DL4006-set-pipefail.ts
    maintainability/
      DL3025-use-json-cmd.ts
      DL4000-no-maintainer.ts
      DL3000-absolute-workdir.ts
      DL3045-copy-relative-workdir.ts
      DL3057-missing-healthcheck.ts
      DL4001-wget-or-curl.ts
      PG004-legacy-env-format.ts
    reliability/
      DL3011-valid-port.ts
      DL3012-one-healthcheck.ts
      DL3024-unique-from-alias.ts
      DL4003-multiple-cmd.ts
      DL4004-multiple-entrypoint.ts
    best-practice/
      DL3001-avoid-bash-commands.ts
      DL3013-pin-pip-versions.ts
      DL3022-copy-from-alias.ts
      DL3027-no-apt-use-apt-get.ts
      DL3030-yum-y.ts
      DL3033-pin-yum-versions.ts
      DL3038-dnf-y.ts
      DL3041-pin-dnf-versions.ts
      PG005-inconsistent-casing.ts
```

### Pattern 1: LintRule Interface
**What:** Each rule is an object implementing a standard interface with metadata, check function, and fix data.
**When to use:** For all 40 rules.
**Example:**
```typescript
// Source: Designed for this project, informed by Hadolint architecture
import type { Dockerfile, Instruction } from 'dockerfile-ast';

export type RuleSeverity = 'error' | 'warning' | 'info';

export type RuleCategory =
  | 'security'
  | 'efficiency'
  | 'maintainability'
  | 'reliability'
  | 'best-practice';

export interface RuleFix {
  description: string;
  beforeCode: string;
  afterCode: string;
}

export interface LintRule {
  id: string;              // "DL3006" or "PG001"
  title: string;           // Short: "Always tag image versions"
  severity: RuleSeverity;
  category: RuleCategory;
  explanation: string;     // Expert-voice: "In production, using untagged images means..."
  fix: RuleFix;
  check(dockerfile: Dockerfile, rawText: string): RuleViolation[];
}

export interface RuleViolation {
  ruleId: string;
  line: number;            // 1-based line number for CodeMirror
  endLine?: number;
  column: number;          // 1-based column
  endColumn?: number;
  message: string;         // Instance-specific: "FROM ubuntu has no tag"
}
```

### Pattern 2: Rule Engine Runner
**What:** A function that takes a parsed Dockerfile and raw text, runs all registered rules, and returns a flat array of violations.
**When to use:** Called from the analyze callback in EditorPanel.
**Example:**
```typescript
// engine.ts
import { allRules } from './rules';
import type { Dockerfile } from 'dockerfile-ast';
import type { RuleViolation, LintRule } from './types';

export interface EngineResult {
  violations: RuleViolation[];
  rulesRun: number;
  rulesPassed: number;
}

export function runRuleEngine(
  dockerfile: Dockerfile,
  rawText: string
): EngineResult {
  const violations: RuleViolation[] = [];
  let rulesPassed = 0;

  for (const rule of allRules) {
    const ruleViolations = rule.check(dockerfile, rawText);
    if (ruleViolations.length === 0) {
      rulesPassed++;
    }
    violations.push(...ruleViolations);
  }

  // Sort by line number for consistent output
  violations.sort((a, b) => a.line - b.line || a.column - b.column);

  return {
    violations,
    rulesRun: allRules.length,
    rulesPassed,
  };
}
```

### Pattern 3: Scoring Algorithm with Transparent Deductions
**What:** Category-weighted scoring that tracks every deduction back to a specific violation.
**When to use:** After rule engine produces violations.
**Example:**
```typescript
// scorer.ts
import type { RuleViolation, RuleCategory, RuleSeverity } from './types';
import { allRules } from './rules';

const CATEGORY_WEIGHTS: Record<RuleCategory, number> = {
  security: 30,
  efficiency: 25,
  maintainability: 20,
  reliability: 15,
  'best-practice': 10,
};

// Per-violation severity deductions from a category's 100-point baseline
const SEVERITY_DEDUCTIONS: Record<RuleSeverity, number> = {
  error: 15,
  warning: 8,
  info: 3,
};

export interface ScoreDeduction {
  ruleId: string;
  category: RuleCategory;
  severity: RuleSeverity;
  points: number;
  line: number;
}

export interface CategoryScore {
  category: RuleCategory;
  score: number;          // 0-100
  weight: number;         // percentage weight
  deductions: ScoreDeduction[];
}

export interface ScoreResult {
  overall: number;        // 0-100
  grade: string;          // "A+" through "F"
  categories: CategoryScore[];
  deductions: ScoreDeduction[];
}

export function computeScore(violations: RuleViolation[]): ScoreResult {
  // Build a rule lookup for severity/category
  const ruleLookup = new Map(allRules.map(r => [r.id, r]));

  // Track deductions per category
  const categoryDeductions: Record<RuleCategory, ScoreDeduction[]> = {
    security: [],
    efficiency: [],
    maintainability: [],
    reliability: [],
    'best-practice': [],
  };

  for (const v of violations) {
    const rule = ruleLookup.get(v.ruleId);
    if (!rule) continue;

    const points = SEVERITY_DEDUCTIONS[rule.severity];
    const deduction: ScoreDeduction = {
      ruleId: v.ruleId,
      category: rule.category,
      severity: rule.severity,
      points,
      line: v.line,
    };
    categoryDeductions[rule.category].push(deduction);
  }

  // Compute per-category scores (floor at 0)
  const categories: CategoryScore[] = Object.entries(categoryDeductions).map(
    ([cat, deductions]) => {
      const totalDeduction = deductions.reduce((sum, d) => sum + d.points, 0);
      return {
        category: cat as RuleCategory,
        score: Math.max(0, 100 - totalDeduction),
        weight: CATEGORY_WEIGHTS[cat as RuleCategory],
        deductions,
      };
    }
  );

  // Weighted aggregate
  const overall = Math.round(
    categories.reduce(
      (sum, c) => sum + c.score * (c.weight / 100),
      0
    )
  );

  const allDeductions = categories.flatMap(c => c.deductions);

  return {
    overall,
    grade: computeGrade(overall),
    categories,
    deductions: allDeductions,
  };
}

function computeGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}
```

### Pattern 4: Individual Rule Implementation Using dockerfile-ast API
**What:** Each rule file uses specific dockerfile-ast API methods to inspect the AST.
**When to use:** Every rule file.
**Example (DL3006 - Tag version explicitly):**
```typescript
// rules/security/DL3006-tag-version.ts
import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3006: LintRule = {
  id: 'DL3006',
  title: 'Always tag the version of an image explicitly',
  severity: 'warning',
  category: 'security',
  explanation:
    'In production, untagged images default to :latest which can change without ' +
    'warning. A deployment that worked yesterday can break today because the base ' +
    'image was updated. Pinning to a specific tag (e.g., node:20-alpine) ensures ' +
    'reproducible builds and predictable behavior across environments.',
  fix: {
    description: 'Pin the base image to a specific version tag or digest',
    beforeCode: 'FROM ubuntu',
    afterCode: 'FROM ubuntu:22.04',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    for (const from of froms) {
      const image = from.getImage();
      const tag = from.getImageTag();
      const digest = from.getImageDigest();
      const buildStage = from.getBuildStage();

      // Skip "FROM scratch" (no tag needed)
      if (image === 'scratch') continue;

      // Skip if referencing a build stage alias (FROM builder AS ...)
      // Check if image name matches any prior stage alias
      // (handled by checking if getImageTag/getImageDigest exist)

      if (!tag && !digest) {
        const range = from.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,  // AST is 0-based, CodeMirror is 1-based
          column: 1,
          message: `FROM ${image ?? 'unknown'} has no version tag. Pin to a specific version.`,
        });
      }
    }

    return violations;
  },
};
```

### Pattern 5: Integration with Existing EditorPanel
**What:** Replace the empty diagnostic pipeline in EditorPanel.tsx with the rule engine.
**When to use:** Final integration step.
**Example:**
```typescript
// In EditorPanel.tsx -- updated analyzeRef.current
import { DockerfileParser } from 'dockerfile-ast';
import { runRuleEngine } from '../../lib/tools/dockerfile-analyzer/engine';
import { computeScore } from '../../lib/tools/dockerfile-analyzer/scorer';
import { allRules } from '../../lib/tools/dockerfile-analyzer/rules';
import type { Diagnostic } from '@codemirror/lint';

analyzeRef.current = (view: EditorView) => {
  const content = view.state.doc.toString();
  if (!content.trim()) {
    view.dispatch(setDiagnostics(view.state, []));
    analysisResult.set(null);
    return;
  }

  isAnalyzing.set(true);

  const ast = DockerfileParser.parse(content);
  const { violations } = runRuleEngine(ast, content);
  const score = computeScore(violations);

  // Convert violations to CodeMirror Diagnostics
  const diagnostics: Diagnostic[] = violations.map((v) => {
    const line = view.state.doc.line(v.line);
    return {
      from: line.from + (v.column - 1),
      to: v.endLine
        ? view.state.doc.line(v.endLine).from + (v.endColumn ?? 1) - 1
        : line.to,
      severity: getRuleSeverity(v.ruleId),  // map to 'error'|'warning'|'info'
      message: `[${v.ruleId}] ${v.message}`,
      source: 'dockerfile-analyzer',
    };
  });

  view.dispatch(setDiagnostics(view.state, diagnostics));

  analysisResult.set({
    violations: violations.map(v => ({
      ...v,
      severity: getRuleSeverity(v.ruleId),
      category: getRuleCategory(v.ruleId),
    })),
    score,
    astNodeCount: ast.getInstructions().length,
    parseSuccess: true,
    timestamp: Date.now(),
  });

  isAnalyzing.set(false);
};
```

### Anti-Patterns to Avoid
- **String/regex-only detection:** Do not write rules that regex-match raw Dockerfile text. Use the AST. Raw text misses multi-line instructions joined by `\`, comments, and edge cases. Reserve regex for inspecting instruction *arguments* only (e.g., detecting `curl | sh` inside a RUN argument).
- **Circular imports between rules:** Rules must NOT import other rules. The registry imports all rules; individual rules are standalone.
- **Mutable rule state:** Rules must be stateless pure functions. No `this.lastResult` or caching between calls.
- **Running the scorer inside each rule:** The scorer aggregates violations from ALL rules. Individual rules just return violations.
- **Hardcoded line numbers in tests:** Use `getRange().start.line` from the AST, not hardcoded line numbers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dockerfile parsing | Custom regex parser for instructions | `dockerfile-ast` `DockerfileParser.parse()` | Handles multi-line RUN with `\`, heredoc syntax, escape directives, variable substitution, multi-stage FROM aliases. Already installed and validated. |
| FROM image tag extraction | Regex on FROM line | `From.getImageTag()`, `From.getImageDigest()`, `From.getImageName()` | Handles edge cases: `FROM --platform=linux/amd64 node:20`, `FROM node@sha256:abc`, `FROM registry.example.com/node:20` |
| ENV/ARG property extraction | Regex on ENV/ARG lines | `Env.getProperties()`, `Arg.getProperty()` returning `Property` with `.getName()`, `.getValue()` | Handles both `ENV KEY=value` and legacy `ENV KEY value` formats, quoted values, multi-line values |
| COPY --from stage detection | String matching --from flag | `Copy.getFromFlag()` returning `Flag` with `.getValue()` | Handles `--from=0`, `--from=builder`, flag edge cases |
| Instruction keyword normalization | `.toUpperCase()` on raw text | `Instruction.getKeyword()` (normalized) vs `Instruction.getInstruction()` (original casing) | Built-in casing normalization; original preserved for casing rules |
| Line number mapping | Manual line counting | `Instruction.getRange().start.line` (0-based) | Handles multi-line instructions correctly |
| Variable resolution | Parsing ARG/ENV manually | `Dockerfile.resolveVariable(name, line)` | Resolves variable values considering ARG defaults, ENV overrides, and scope per build stage |
| Multi-stage build stages | Counting FROM instructions | `Dockerfile.getContainingImage(position)` or iterate `getFROMs()` with `getBuildStage()` | Correctly handles stage aliasing, COPY --from references, and nested stage hierarchies |

**Key insight:** The dockerfile-ast API is far richer than the existing `parser.ts` wrapper exposes. For Phase 23, rules should import directly from `dockerfile-ast` to access typed instruction classes (`From`, `Copy`, `Env`, `Arg`, etc.) rather than using the simplified `parseDockerfile()` wrapper. The wrapper remains useful for the high-level parse call but individual rules need the full AST.

## Common Pitfalls

### Pitfall 1: Off-by-One Line Numbers Between AST and CodeMirror
**What goes wrong:** dockerfile-ast uses 0-based line numbers (`getRange().start.line` returns 0 for line 1). CodeMirror `Diagnostic.from` uses character offsets obtained via `view.state.doc.line(n)` where `n` is 1-based. Mixing these produces diagnostics on the wrong lines.
**Why it happens:** Two different conventions in two different libraries.
**How to avoid:** Add `+1` when converting AST line to CodeMirror line: `const cmLine = astRange.start.line + 1`. Do this conversion in the engine (not in each rule) -- rules return 1-based line numbers.
**Warning signs:** Diagnostics appear one line above or below the actual issue.

### Pitfall 2: Scoring Clusters at Extremes Without Diminishing Returns
**What goes wrong:** With flat deduction (e.g., 8 points per warning), a category with 5 warnings loses 40 points (score = 60) and a category with 10 warnings loses 80 points (score = 20). The jump from 5 to 10 warnings has the same impact as from 0 to 5, but in practice the first few violations are much more significant than the 10th. Scores cluster at 0 for categories with many violations (like efficiency on a bad Dockerfile).
**Why it happens:** Linear deduction does not model diminishing marginal impact.
**How to avoid:** Use diminishing returns: the first violation in a category deducts full severity points, subsequent violations deduct progressively less. Formula: `deduction = baseSeverityPoints / (1 + 0.3 * priorViolationsInCategory)`. This ensures: 1st error = 15pts, 2nd = 11.5pts, 3rd = 9.4pts, etc. Categories never hit 0 from sheer volume alone.
**Warning signs:** Multiple categories scoring 0 on the sample Dockerfile; scores below 20 for typical bad Dockerfiles.

### Pitfall 3: Rules That Depend on Instruction Order Miss Multi-Stage Builds
**What goes wrong:** A rule like "final USER should not be root" checks the last USER instruction in the entire Dockerfile. In a multi-stage build, `USER root` in the builder stage is fine -- only the final stage's USER matters. Checking globally produces false positives.
**Why it happens:** Rules iterate `dockerfile.getInstructions()` which returns ALL instructions across ALL stages.
**How to avoid:** For rules that are stage-sensitive (USER, CMD, ENTRYPOINT, HEALTHCHECK), inspect only the final stage. Use `dockerfile.getFROMs()` to identify the last FROM, then check instructions only after that FROM's line. Or use `dockerfile.getContainingImage(position)` for stage-aware queries.
**Warning signs:** False positives on multi-stage builds that are correctly written.

### Pitfall 4: getArgumentsContent() Returns null for Empty Instructions
**What goes wrong:** Calling `instruction.getArgumentsContent()` on a malformed instruction like `RUN` (with no arguments) returns `null`. Rules that do `.getArgumentsContent().includes(...)` throw a TypeError.
**Why it happens:** dockerfile-ast faithfully represents malformed Dockerfiles without crashing.
**How to avoid:** Always null-check: `const args = instruction.getArgumentsContent(); if (!args) return;`
**Warning signs:** Uncaught TypeError crashes when analyzing malformed Dockerfiles.

### Pitfall 5: Sample Dockerfile Must Trigger All 5 Categories
**What goes wrong:** The pre-loaded sample Dockerfile fails to demonstrate one or more rule categories, so the scoring appears broken for that category (shows 100/A+ for a category that was supposed to have violations).
**Why it happens:** The sample was written before all rules were finalized.
**How to avoid:** After implementing all rules, run the engine against the sample Dockerfile and verify at least 1 violation per category. The current sample (from Phase 22) already covers: Security (no USER, secrets in ENV, ADD URL), Efficiency (no apt-get -y, separate RUN commands), Maintainability (MAINTAINER, no HEALTHCHECK), Reliability (chmod 777), Best Practice (no package pinning). Verify coverage after implementation.
**Warning signs:** Any category sub-score showing 100 on the sample Dockerfile.

### Pitfall 6: Rules That Inspect RUN Shell Commands Need Regex, Not AST
**What goes wrong:** Rules like "use apt-get not apt" (DL3027) or "curl | sh detection" (PG002) need to inspect the shell command text inside RUN instructions. The AST gives you the full RUN argument string, but it does not parse the shell syntax. Attempting to use the AST for shell command analysis fails.
**Why it happens:** dockerfile-ast parses Dockerfile syntax, not shell syntax. ShellCheck would be needed for deep shell analysis, but it requires Haskell and cannot run in the browser.
**How to avoid:** For rules that inspect RUN arguments, use `instruction.getArgumentsContent()` to get the raw shell command string, then apply targeted regex patterns. Keep regex patterns simple and well-documented. Do not attempt full shell parsing.
**Warning signs:** False negatives on shell-command rules; overly complex regex that tries to handle all shell edge cases.

## Code Examples

Verified patterns from dockerfile-ast type definitions (installed in node_modules):

### Accessing Typed Instructions from the AST
```typescript
// Source: dockerfile-ast/lib/main.d.ts, imageTemplate.d.ts
import { DockerfileParser } from 'dockerfile-ast';
import type { Dockerfile, From, Copy, Env, Arg, Instruction } from 'dockerfile-ast';

const ast: Dockerfile = DockerfileParser.parse(content);

// Get ALL instructions (all types, all stages)
const allInstructions: Instruction[] = ast.getInstructions();

// Get typed instruction arrays
const froms: From[] = ast.getFROMs();
const copies: Copy[] = ast.getCOPYs();
const envs: Env[] = ast.getENVs();
const args: Arg[] = ast.getARGs();
const cmds = ast.getCMDs();
const entrypoints = ast.getENTRYPOINTs();
const healthchecks = ast.getHEALTHCHECKs();

// Instruction base methods (available on all instruction types)
for (const inst of allInstructions) {
  inst.getKeyword();           // "FROM", "RUN", etc. (normalized uppercase)
  inst.getInstruction();       // Original casing: "from", "RUN", "From"
  inst.getArgumentsContent();  // Everything after the keyword, or null
  inst.getRange();             // { start: { line, character }, end: { line, character } }
  inst.getVariables();         // Variable references in the instruction
}

// FROM-specific methods
for (const from of froms) {
  from.getImage();             // "ubuntu:22.04" or "ubuntu" or null
  from.getImageName();         // "ubuntu" (without tag/digest)
  from.getImageTag();          // "22.04" or null
  from.getImageDigest();       // "sha256:..." or null
  from.getBuildStage();        // "builder" (from AS builder) or null
  from.getRegistry();          // "registry.example.com" or null
  from.getPlatformFlag();      // Flag object for --platform or null
}

// COPY-specific methods
for (const copy of copies) {
  copy.getFromFlag();          // Flag with .getValue() for --from=stage
}

// ENV-specific methods (Property-based)
for (const env of envs) {
  const props = env.getProperties();  // Property[]
  for (const prop of props) {
    prop.getName();            // "API_KEY"
    prop.getValue();           // "sk-1234..." or null
    prop.getNameRange();       // Range of the key
    prop.getValueRange();      // Range of the value
  }
}

// ARG-specific methods
for (const arg of args) {
  const prop = arg.getProperty();  // Property | null
  if (prop) {
    prop.getName();            // "VERSION"
    prop.getValue();           // "1.0" or null (no default)
  }
}

// Variable resolution across stages
const resolved = ast.resolveVariable('NODE_VERSION', 10);
// Returns the value, null (defined but no value), or undefined (not defined)
```

### Rule That Uses From API (DL3007 - No :latest Tag)
```typescript
// Source: Hadolint DL3007 + dockerfile-ast From API
import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3007: LintRule = {
  id: 'DL3007',
  title: 'Do not use the :latest tag',
  severity: 'warning',
  category: 'security',
  explanation:
    'The :latest tag is a moving target. In production, an image tagged :latest today ' +
    'may resolve to a completely different image tomorrow after the maintainer pushes ' +
    'an update. This breaks reproducibility -- your staging and production environments ' +
    'may run different code despite identical Dockerfiles. Always pin to a specific ' +
    'version tag (e.g., ubuntu:22.04) or a digest.',
  fix: {
    description: 'Replace :latest with a specific version tag',
    beforeCode: 'FROM ubuntu:latest',
    afterCode: 'FROM ubuntu:22.04',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const from of dockerfile.getFROMs()) {
      const tag = from.getImageTag();
      if (tag === 'latest') {
        const range = from.getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: `Image uses :latest tag. Pin to a specific version.`,
        });
      }
    }

    return violations;
  },
};
```

### Rule That Inspects ENV Values for Secrets (PG001 - Custom Rule)
```typescript
// Source: Custom rule, dockerfile-ast Env/Property API
import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

// Patterns that suggest sensitive data in ENV/ARG values
const SECRET_PATTERNS = [
  /(?:api[_-]?key|secret|password|passwd|token|auth)/i,
  /sk-[a-zA-Z0-9]{20,}/,          // OpenAI-style API keys
  /ghp_[a-zA-Z0-9]{36}/,          // GitHub personal access tokens
  /postgres:\/\/\w+:\w+@/,        // Database connection strings with credentials
  /mysql:\/\/\w+:\w+@/,
];

export const PG001: LintRule = {
  id: 'PG001',
  title: 'Do not store secrets in ENV or ARG instructions',
  severity: 'error',
  category: 'security',
  explanation:
    'Secrets stored in ENV or ARG instructions are baked into the image layer and ' +
    'visible to anyone who runs `docker history` or `docker inspect`. In production, ' +
    'this is a critical security risk -- leaked API keys, database credentials, or ' +
    'tokens can be extracted from any copy of the image. Use Docker secrets, ' +
    'environment variables at runtime, or a secrets manager instead.',
  fix: {
    description: 'Remove secrets from Dockerfile; pass at runtime via docker run -e or Docker secrets',
    beforeCode: 'ENV API_KEY=sk-1234567890abcdef',
    afterCode: '# Pass at runtime: docker run -e API_KEY=... myimage',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Check ENV instructions
    for (const env of dockerfile.getENVs()) {
      for (const prop of env.getProperties()) {
        const name = prop.getName();
        const value = prop.getValue();
        if (matchesSecretPattern(name, value)) {
          const range = prop.getNameRange();
          violations.push({
            ruleId: this.id,
            line: range.start.line + 1,
            column: range.start.character + 1,
            message: `ENV ${name} appears to contain a secret. Do not bake secrets into images.`,
          });
        }
      }
    }

    // Check ARG instructions
    for (const arg of dockerfile.getARGs()) {
      const prop = arg.getProperty();
      if (!prop) continue;
      const name = prop.getName();
      const value = prop.getValue();
      if (matchesSecretPattern(name, value)) {
        const range = prop.getNameRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: range.start.character + 1,
          message: `ARG ${name} appears to contain a secret. ARG values are visible in docker history.`,
        });
      }
    }

    return violations;
  },
};

function matchesSecretPattern(name: string, value: string | null): boolean {
  // Check name against secret keywords
  if (SECRET_PATTERNS[0].test(name)) return true;
  // Check value against specific key patterns (if value exists)
  if (value) {
    for (let i = 1; i < SECRET_PATTERNS.length; i++) {
      if (SECRET_PATTERNS[i].test(value)) return true;
    }
  }
  return false;
}
```

### Rule Using RUN Argument Inspection (DL3059 - Consolidate RUNs)
```typescript
// Source: Hadolint DL3059 + dockerfile-ast Instruction API
import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3059: LintRule = {
  id: 'DL3059',
  title: 'Multiple consecutive RUN instructions',
  severity: 'info',
  category: 'efficiency',
  explanation:
    'Each RUN instruction creates a new image layer. Consecutive RUN instructions ' +
    'that could be combined into a single RUN with && waste space because files ' +
    'created in one layer and deleted in the next still exist in the earlier layer. ' +
    'In production, this inflates image size and slows container startup.',
  fix: {
    description: 'Combine consecutive RUN instructions with &&',
    beforeCode: 'RUN apt-get update\nRUN apt-get install -y curl',
    afterCode: 'RUN apt-get update && \\\n    apt-get install -y curl',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (let i = 1; i < instructions.length; i++) {
      if (
        instructions[i].getKeyword() === 'RUN' &&
        instructions[i - 1].getKeyword() === 'RUN'
      ) {
        const range = instructions[i].getRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message: 'Multiple consecutive RUN instructions. Consider combining with &&.',
        });
      }
    }

    return violations;
  },
};
```

## Complete Rule Catalog

### Tier 1: Critical (15 rules) -- RULE-01

| Rule ID | Title | Severity | Category | Detection Approach |
|---------|-------|----------|----------|-------------------|
| DL3006 | Always tag image version | warning | security | `From.getImageTag()` and `From.getImageDigest()` both null |
| DL3007 | Do not use :latest tag | warning | security | `From.getImageTag() === 'latest'` |
| DL4000 | MAINTAINER is deprecated | error | maintainability | `instruction.getKeyword() === 'MAINTAINER'` |
| DL3020 | Use COPY instead of ADD for files | error | security | `instruction.getKeyword() === 'ADD'` and arguments are not URLs/archives |
| DL3025 | Use JSON form for CMD/ENTRYPOINT | warning | maintainability | `Cmd`/`Entrypoint` -- check `getOpeningBracket()` returns null (no JSON form) |
| DL3000 | Use absolute WORKDIR paths | error | reliability | `Workdir.getPath()` does not start with `/` or `$` |
| DL3004 | Do not use sudo | error | security | Regex `\bsudo\b` in RUN arguments |
| DL3002 | Last USER should not be root | warning | security | Check last USER instruction's argument across final stage |
| DL3059 | Consolidate consecutive RUNs | info | efficiency | Adjacent instructions both have keyword `RUN` |
| DL3014 | Use -y switch with apt-get install | warning | efficiency | RUN args contain `apt-get install` without `-y`/`--yes`/`-qq` |
| DL3015 | Use --no-install-recommends | info | efficiency | RUN args contain `apt-get install` without `--no-install-recommends` |
| DL3008 | Pin versions in apt-get install | warning | security | RUN args contain `apt-get install` with unversioned packages (no `=` after package name) |
| DL4003 | Multiple CMD instructions | warning | reliability | `dockerfile.getCMDs().length > 1` |
| DL4004 | Multiple ENTRYPOINT instructions | error | reliability | `dockerfile.getENTRYPOINTs().length > 1` |
| DL3061 | Dockerfile must begin with FROM | error | reliability | First non-comment, non-ARG instruction is not FROM |

### Tier 2: High-Value (15 rules) -- RULE-02

| Rule ID | Title | Severity | Category | Detection Approach |
|---------|-------|----------|----------|-------------------|
| DL3003 | Use WORKDIR to switch dirs | warning | efficiency | RUN args contain `cd ` followed by `&&` |
| DL3009 | Remove apt-get lists after install | info | efficiency | RUN has `apt-get install` but no `rm -rf /var/lib/apt/lists/*` |
| DL3011 | Valid UNIX port range | error | reliability | EXPOSE args contain port numbers outside 0-65535 |
| DL3027 | Do not use apt; use apt-get | warning | best-practice | RUN args contain `\bapt\s` (not `apt-get`, `apt-cache`) |
| DL4006 | Set SHELL -o pipefail before RUN with pipe | warning | efficiency | RUN args contain `|` but no prior SHELL with pipefail |
| DL3042 | Use pip --no-cache-dir | warning | efficiency | RUN args contain `pip install` without `--no-cache-dir` |
| DL3013 | Pin pip package versions | warning | best-practice | RUN args contain `pip install` with unversioned packages (no `==`) |
| DL3045 | COPY to relative dest without WORKDIR | warning | maintainability | COPY dest does not start with `/` and no prior WORKDIR in current stage |
| DL3019 | Use apk --no-cache | info | efficiency | RUN args contain `apk add` without `--no-cache` |
| DL3012 | Only one HEALTHCHECK | error | reliability | `dockerfile.getHEALTHCHECKs().length > 1` |
| DL3024 | FROM aliases must be unique | error | reliability | Duplicate values from `From.getBuildStage()` across all FROMs |
| PG001 | Secrets in ENV/ARG | error | security | Regex patterns on `Env.getProperties()` and `Arg.getProperty()` name/value |
| PG002 | curl pipe to shell | error | security | RUN args match `curl.*\|\s*(sh\|bash\|zsh)` |
| PG003 | COPY sensitive files | warning | security | COPY args include patterns like `.env`, `id_rsa`, `*.pem`, `*.key` |
| PG004 | Legacy ENV format | info | maintainability | ENV with `getProperties()` having `.getAssignmentOperator() === null` (space-separated) |

### Tier 3: Nice-to-Have (10 rules) -- RULE-03

| Rule ID | Title | Severity | Category | Detection Approach |
|---------|-------|----------|----------|-------------------|
| DL4001 | Use wget or curl, not both | warning | maintainability | RUN instructions collectively contain both `wget` and `curl` |
| DL3057 | Missing HEALTHCHECK | info | maintainability | `dockerfile.getHEALTHCHECKs().length === 0` |
| DL3001 | Avoid bash commands in containers | info | best-practice | RUN args contain `ssh`, `vim`, `shutdown`, `service`, `ps`, `free`, `top`, `kill`, `mount`, `ifconfig` |
| DL3022 | COPY --from should reference alias | warning | best-practice | `Copy.getFromFlag().getValue()` is a number, not a named stage |
| DL3030 | Use -y with yum install | warning | best-practice | RUN args contain `yum install` without `-y` |
| DL3033 | Pin yum package versions | warning | best-practice | RUN args contain `yum install` without versioned packages |
| DL3038 | Use -y with dnf install | warning | best-practice | RUN args contain `dnf install` without `-y` |
| DL3041 | Pin dnf package versions | warning | best-practice | RUN args contain `dnf install` without versioned packages |
| PG005 | Inconsistent instruction casing | info | best-practice | Compare `instruction.getInstruction()` (original) vs `instruction.getKeyword()` (normalized) -- flag if mixed case across Dockerfile |

**Note:** PG004 (legacy ENV format) is moved to Tier 2 for consistency. The 10th Tier 3 slot is filled by one more rule. If needed, DL3030/DL3033/DL3038/DL3041 can be grouped as a single "package manager hygiene" meta-rule to save implementation effort.

### Category Distribution

| Category | Count | Rule IDs |
|----------|-------|----------|
| Security (30%) | 10 | DL3006, DL3007, DL3008, DL3020, DL3004, DL3002, DL3061, PG001, PG002, PG003 |
| Efficiency (25%) | 9 | DL3059, DL3014, DL3015, DL3003, DL3009, DL4006, DL3042, DL3019, DL3061 |
| Maintainability (20%) | 7 | DL4000, DL3025, DL3045, DL3057, DL4001, DL3000, PG004 |
| Reliability (15%) | 5 | DL3011, DL3012, DL3024, DL4003, DL4004 |
| Best Practice (10%) | 9 | DL3027, DL3013, DL3001, DL3022, DL3030, DL3033, DL3038, DL3041, PG005 |

## Scoring Calibration

### Sample Dockerfile Analysis

The existing sample Dockerfile (`sample-dockerfile.ts`) should trigger these violations:

| Line | Content | Rule(s) Triggered | Severity | Category |
|------|---------|-------------------|----------|----------|
| 3 | `FROM ubuntu:latest` | DL3007 (latest tag) | warning | security |
| 5 | `MAINTAINER john@example.com` | DL4000 (deprecated) | error | maintainability |
| 7 | `RUN apt-get update` | DL3059 (consecutive RUN) | info | efficiency |
| 8 | `RUN apt-get install -y curl wget git python3 nodejs` | DL3059 (consecutive RUN), DL3008 (no pinned versions), DL3015 (no --no-install-recommends) | info/warning/info | efficiency/security/efficiency |
| 10 | `ADD https://example.com/app.tar.gz /app/` | DL3020 (use COPY) | error | security |
| 11 | `COPY . /app` | DL3045 (relative dest, no WORKDIR yet) | warning | maintainability |
| 13 | `WORKDIR app` | DL3000 (relative WORKDIR) | error | maintainability |
| 14 | `RUN cd /tmp && do-something` | DL3003 (use WORKDIR) | warning | efficiency |
| 16 | `ENV API_KEY=sk-1234567890abcdef` | PG001 (secret in ENV) | error | security |
| 17 | `ENV DATABASE_URL=postgres://admin:password@db:5432/myapp` | PG001 (secret in ENV) | error | security |
| 19 | `RUN pip install flask requests numpy` | DL3013 (pin pip versions), DL3042 (no --no-cache-dir) | warning/warning | best-practice/efficiency |
| 20 | `RUN npm install` | (consecutive RUN w/ line 19) | info | efficiency |
| 24 | `RUN chmod 777 /app` | (no specific rule for chmod 777 in our set -- note for future) | -- | -- |
| 26 | `USER root` | DL3002 (last user is root) | warning | security |
| 28 | `CMD node server.js` | DL3025 (use JSON form) | warning | maintainability |
| (global) | No HEALTHCHECK | DL3057 (missing healthcheck) | info | maintainability |
| (global) | Both curl and wget installed | DL4001 (pick one) | warning | maintainability |

**Estimated violation count: ~20 violations across all 5 categories.**

### Scoring Projection with Diminishing Returns

Using the diminishing returns formula: `deduction = baseSeverityPoints / (1 + 0.3 * priorCount)`:

| Category | Violations | Raw Deductions | With Diminishing Returns | Weighted Contribution |
|----------|-----------|----------------|--------------------------|----------------------|
| Security (30%) | 6 (2 error, 4 warning) | 2x15 + 4x8 = 62 | ~48 -> Score: 52 | 52 x 0.30 = 15.6 |
| Efficiency (25%) | 6 (5 info, 1 warning) | 5x3 + 1x8 = 23 | ~20 -> Score: 80 | 80 x 0.25 = 20.0 |
| Maintainability (20%) | 5 (1 error, 2 warning, 2 info) | 15 + 16 + 6 = 37 | ~30 -> Score: 70 | 70 x 0.20 = 14.0 |
| Reliability (15%) | 0 | 0 | 0 -> Score: 100 | 100 x 0.15 = 15.0 |
| Best Practice (10%) | 3 (2 warning, 1 info) | 16 + 3 = 19 | ~17 -> Score: 83 | 83 x 0.10 = 8.3 |

**Projected overall: ~73/100 (C)** -- Good differentiation. Not clustered at 85-100.

### Letter Grade Thresholds

| Grade | Range | Description |
|-------|-------|-------------|
| A+ | 97-100 | Exemplary -- production-ready best practices |
| A | 93-96 | Excellent -- minor improvements possible |
| A- | 90-92 | Very good -- a few suggestions |
| B+ | 87-89 | Good -- some improvements recommended |
| B | 83-86 | Above average -- several issues to address |
| B- | 80-82 | Decent -- notable issues present |
| C+ | 77-79 | Fair -- significant improvements needed |
| C | 73-76 | Below average -- many issues found |
| C- | 70-72 | Poor -- substantial problems |
| D+ | 67-69 | Weak -- major concerns |
| D | 63-66 | Very weak -- critical issues |
| D- | 60-62 | Failing -- serious problems throughout |
| F | 0-59 | Failing -- fundamental issues |

### Key Calibration Insight

The severity deduction values (error=15, warning=8, info=3) combined with diminishing returns produce good score distribution:
- **Clean Dockerfile:** 100/A+ (verified: zero violations = no deductions)
- **Decent Dockerfile (2-3 minor issues):** 85-95 / A- to B+
- **Typical Dockerfile (5-10 issues):** 65-85 / C- to B
- **Sample Dockerfile (~20 issues):** 70-75 / C to C+
- **Terrible Dockerfile (15+ serious issues):** 30-55 / F to D-

The research flag ("scoring weight calibration requires testing against real-world Dockerfiles before finalizing") remains relevant. The deduction values above are a starting point. After implementing all 40 rules, test against 5-10 real-world Dockerfiles and adjust if scores cluster.

## Types Expansion

The existing `types.ts` needs expansion. Here is the target type system:

```typescript
// src/lib/tools/dockerfile-analyzer/types.ts -- expanded for Phase 23

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
  check(dockerfile: import('dockerfile-ast').Dockerfile, rawText: string): RuleViolation[];
}

// A single violation found by a rule
export interface RuleViolation {
  ruleId: string;
  line: number;       // 1-based
  endLine?: number;
  column: number;     // 1-based
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
  score: number;
  weight: number;
  deductions: ScoreDeduction[];
}

// Overall score result
export interface ScoreResult {
  overall: number;
  grade: string;
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
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hadolint (Haskell binary) | Client-side JS rule engine | N/A (novel) | Browser-native, no server dependency, but no shell analysis (ShellCheck) |
| Single numeric score | Category-weighted sub-scores with transparent deductions | Industry trend 2023+ | Users trust scores they can inspect; opaque numbers breed distrust |
| Flat severity deduction | Diminishing returns per category | Calibration insight | Prevents category scores from clustering at 0 for categories with many violations |
| Global instruction analysis | Stage-aware analysis for multi-stage builds | dockerfile-ast supports it | Prevents false positives like "USER root" in builder stages |

**Important distinction from Hadolint:**
- Hadolint integrates ShellCheck for shell command analysis inside RUN. We cannot do this in the browser (ShellCheck is a Haskell binary). Our RUN-inspection rules use targeted regex patterns, which is less comprehensive but sufficient for the 40 rules specified.
- Hadolint outputs severity levels (error/warning/info/style) but does NOT compute scores. Our scoring layer is a novel addition.

## Open Questions

1. **Diminishing returns formula tuning**
   - What we know: Linear deduction causes category scores to cluster at 0. Diminishing returns with `0.3` decay factor produces good spread.
   - What's unclear: Whether `0.3` is the right decay factor. May need adjustment after testing against real Dockerfiles.
   - Recommendation: Start with `0.3`, test against 5 real-world Dockerfiles, adjust if scores cluster.

2. **chmod 777 rule**
   - What we know: The sample Dockerfile includes `RUN chmod 777 /app`. No Hadolint DL-rule covers this specifically.
   - What's unclear: Whether to add a PG-prefixed custom rule for this. It is a security anti-pattern.
   - Recommendation: Defer to Phase 25 (content/docs) or future RULE-08 enhancement. The 40-rule target is already comprehensive.

3. **Multi-stage build stage-awareness for all rules**
   - What we know: Some rules (DL3002 USER root, DL4003 multiple CMD, DL4004 multiple ENTRYPOINT) should only apply to the final stage. Others (DL3059 consecutive RUN) apply per-stage.
   - What's unclear: Exactly which of the 40 rules need stage-awareness.
   - Recommendation: For Phase 23, implement stage-awareness for DL3002 (USER), DL4003 (CMD), DL4004 (ENTRYPOINT), and DL3057 (HEALTHCHECK). All other rules operate globally. Mark stage-awareness expansion as future work.

4. **AnalysisResult nanostore shape change**
   - What we know: Phase 22 created an `AnalysisResult` interface with `violations: LintViolation[]`. Phase 23 adds `score: ScoreResult` and enriches `LintViolation`.
   - What's unclear: Whether the ResultsPanel (Phase 24) needs additional fields.
   - Recommendation: Add `score: ScoreResult` to the nanostore. Keep it backward-compatible -- the Phase 22 ResultsPanel checks `parseSuccess` which still exists. Phase 24 will build new UI for the score data.

## Sources

### Primary (HIGH confidence)
- `dockerfile-ast` v0.7.1 type definitions -- directly read from `node_modules/dockerfile-ast/lib/*.d.ts`: `main.d.ts`, `dockerfile.d.ts`, `instruction.d.ts`, `imageTemplate.d.ts`, `from.d.ts`, `copy.d.ts`, `env.d.ts`, `arg.d.ts`, `cmd.d.ts`, `user.d.ts`, `property.d.ts`, `propertyInstruction.d.ts`, `jsonInstruction.d.ts`, `modifiableInstruction.d.ts`, `flag.d.ts`, `workdir.d.ts`, `label.d.ts`, `healthcheck.d.ts`, `argument.d.ts`, `line.d.ts`
- [Hadolint GitHub README](https://github.com/hadolint/hadolint) -- complete rules table with codes, severity, and descriptions for DL3000-DL3062 and DL4000-DL4006
- [Hadolint Wiki - DL3059](https://github.com/hadolint/hadolint/wiki/DL3059) -- consecutive RUN consolidation rationale
- [Hadolint Wiki - DL3025](https://github.com/hadolint/hadolint/wiki/DL3025) -- JSON form for CMD/ENTRYPOINT, signal propagation
- Existing codebase files: `types.ts`, `parser.ts`, `sample-dockerfile.ts`, `EditorPanel.tsx`, `ResultsPanel.tsx`, `DockerfileAnalyzer.tsx`, `use-codemirror.ts`, `dockerfileAnalyzerStore.ts`
- Phase 22 research (`22-RESEARCH.md`) -- architecture patterns, integration points, setDiagnostics pattern

### Secondary (MEDIUM confidence)
- [Docker Best Practices](https://docs.docker.com/build/building/best-practices/) -- official Docker guidelines informing rule explanations
- [Sysdig Top 20 Dockerfile Security Best Practices](https://sysdig.com/blog/dockerfile-best-practices/) -- security rule rationale
- Phase v1.4 architecture research (`.planning/research/ARCHITECTURE.md`, `PITFALLS.md`) -- scoring design warnings, rule engine architecture

### Tertiary (LOW confidence)
- Scoring calibration projections -- based on manual analysis of sample Dockerfile against planned rules. Needs validation with real-world Dockerfiles post-implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all APIs verified from installed type definitions
- Architecture (LintRule interface, engine, registry): HIGH -- straightforward TypeScript patterns, informed by Hadolint's architecture
- Rule detection approaches: HIGH -- verified against dockerfile-ast type definitions that all needed API methods exist
- Scoring algorithm: MEDIUM -- formula is sound but calibration values (deduction amounts, diminishing returns decay) need empirical validation
- Rule explanations/fixes: HIGH -- sourced from Hadolint wiki and Docker official best practices

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (30 days -- dockerfile-ast API is stable, Hadolint rules have not changed in 12+ months)
