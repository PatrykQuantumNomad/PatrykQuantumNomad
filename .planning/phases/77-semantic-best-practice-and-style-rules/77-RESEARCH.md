# Phase 77: Semantic, Best Practice, and Style Rules - Research

**Researched:** 2026-03-04
**Domain:** GitHub Actions custom lint rules (best practice, style), actionlint semantic rule enrichment, YAML AST traversal
**Confidence:** HIGH

## Summary

Phase 77 completes the full 48-rule registry for the GitHub Actions Workflow Validator by implementing 30 remaining rules across three categories: (1) 18 actionlint semantic rule mappings (enriching raw actionlint output with stable GA-L* IDs, explanations, and fix suggestions), (2) 8 best practice rules (custom Pass 1 rules detecting missing timeout-minutes, concurrency groups, unnamed steps, duplicate step names, empty env blocks, missing conditionals, outdated actions, and missing continue-on-error), and (3) 4 style rules (custom Pass 1 rules detecting non-alphabetical jobs, inconsistent quoting, long step names, and missing workflow name).

The actionlint semantic work (SEM-01 through SEM-04) is primarily a data/metadata task. The existing engine.ts already maps 16 of 18 actionlint error kinds to GA-L* rule IDs. Two kinds are missing from the map: `deprecated-commands` (GA-L015) and `if-cond` (GA-L016). The enrichment work (SEM-04) involves creating GhaLintRule metadata objects for all 18 GA-L* rules so they appear in the rule registry with explanations and fix suggestions, even though they don't have a `check()` method (they are Pass 2 rules detected by actionlint WASM, not custom Pass 1 rules). GA-L017 (shellcheck) and GA-L018 (pyflakes) need documentation noting they are unavailable in the browser WASM build because their native binaries cannot run in WebAssembly.

The best practice and style rules follow the exact same `GhaLintRule` interface and AST traversal patterns established in Phase 76 for security rules. They run in Pass 1, use the `yaml` library's `isMap`/`isPair`/`isScalar`/`isSeq` functions for AST traversal, and reuse the shared `resolveKey`, `forEachUsesNode`, and `forEachRunNode` helpers from `ast-helpers.ts`. New helpers may be needed for job-level and step-level iteration. The compose-validator provides a proven reference for the identical category structure (best-practice, style).

**Primary recommendation:** Organize into 3 plans: (1) semantic rule enrichment + engine.ts mapping completion, (2) 8 best practice rules, (3) 4 style rules + registry integration + comprehensive sample workflow. Follow the Phase 76 security rule implementation pattern exactly.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEM-01 | 18 actionlint rule kinds mapped to GA-L001 through GA-L018 with stable rule IDs | Engine.ts already maps 16 kinds. Add `deprecated-commands` (GA-L015) and `if-cond` (GA-L016) to ACTIONLINT_KIND_MAP. Verified: actionlint has exactly 18 rule kinds from linter.go source. |
| SEM-02 | Each actionlint kind assigned to appropriate scoring category | Current mappings use `semantic`, `security`, and `actionlint` categories. New kinds: `deprecated-commands` -> `best-practice`, `if-cond` -> `semantic`. |
| SEM-03 | GA-L017 (shellcheck) and GA-L018 (pyflakes) documented as unavailable in browser WASM build | These are conditional rules in actionlint that require native shellcheck/pyflakes binaries. WASM build does not include them. Create metadata-only rule entries with explanation noting CLI-only availability. |
| SEM-04 | Actionlint error messages enriched with rule-specific explanations and fix suggestions | Create GhaLintRule metadata objects for all 18 GA-L* rules. These are "documentation-only" rules (no check() method) used for rule pages and enriched messages. The engine.ts mapActionlintError function can be extended to look up enrichment from these objects. |
| BP-01 | GA-B001 flags jobs missing `timeout-minutes` (default is 6 hours) | AST check: iterate jobs, check for `timeout-minutes` key. GitHub default is 360 minutes (6 hours). Severity: `warning`, category: `best-practice`. |
| BP-02 | GA-B002 flags workflows missing `concurrency:` group | AST check: top-level `concurrency` key absent. Severity: `info`, category: `best-practice`. Concurrency is recommended but not always applicable. |
| BP-03 | GA-B003 flags steps without `name:` field | AST check: iterate steps, check for `name` key. Only flag `run:` steps (not `uses:` steps which are self-descriptive). Severity: `info`, category: `best-practice`. |
| BP-04 | GA-B004 flags duplicate step names within same job | AST check: collect step names per job, detect duplicates. Severity: `warning`, category: `best-practice`. |
| BP-05 | GA-B005 flags empty `env:` blocks | AST check: detect `env:` nodes that are empty maps or null/empty scalars at workflow, job, or step level. Severity: `info`, category: `best-practice`. |
| BP-06 | GA-B006 flags jobs without conditional on PR-only workflows | AST check: if workflow triggers include only `pull_request`/`pull_request_target`, check that jobs have an `if:` conditional. Severity: `info`, category: `best-practice`. |
| BP-07 | GA-B007 flags outdated major versions of well-known actions | AST check on `uses:` values. Compare against known-current major versions for actions/ and github/ namespaces. Current as of 2026: actions/checkout@v4, actions/setup-node@v4, actions/setup-python@v5, actions/upload-artifact@v4, actions/download-artifact@v4, actions/cache@v4, actions/setup-java@v4, actions/setup-go@v5, github/codeql-action@v3. Severity: `info`, category: `best-practice`. |
| BP-08 | GA-B008 flags steps fetching external data without `continue-on-error` | AST check: steps with `uses:` or `run:` patterns that suggest network calls (curl, wget, fetch, api) without `continue-on-error: true`. Severity: `info`, category: `best-practice`. |
| STYLE-01 | GA-F001 flags jobs not alphabetically ordered | AST check on job key names in document order vs sorted. Follow CV-F001 pattern from compose-validator. Severity: `info`, category: `style`. |
| STYLE-02 | GA-F002 flags inconsistent `uses:` quoting | AST check: collect quoting styles (single, double, none) across all `uses:` values. If mixed, flag the minority. Severity: `info`, category: `style`. |
| STYLE-03 | GA-F003 flags step names exceeding 80 characters | AST check: iterate step `name:` values, check string length > 80. Severity: `info`, category: `style`. |
| STYLE-04 | GA-F004 flags workflows missing `name:` at top level | AST check: top-level `name` key absent. Severity: `info`, category: `style`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yaml | ^2.8.2 | YAML parsing with AST for line-number resolution in all custom rules | Already in project; provides `isMap`, `isPair`, `isScalar`, `isSeq` for AST traversal |
| vitest | ^4.0.18 | Unit testing for all rule implementations | Already in project; used for Phase 76 security rule tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| actionlint WASM | v1.7.11 | Pass 2 semantic analysis (18 error kinds) | Already downloaded; used via Web Worker |
| nanostores | ^1.1.0 | State management for violation results | Already in project; bridges engine to UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom version detection for BP-07 | External API call to check latest versions | Would require network access, break offline use, add latency; hardcoded map is sufficient for well-known actions |
| Regex-based quoting detection for STYLE-02 | YAML AST node.type property | AST nodes have a `type` property but it reflects YAML spec types, not quoting style; checking rawText around node range is more reliable |

**Installation:**
No new npm packages needed. All dependencies already in project from Phase 75-76.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/gha-validator/
  engine.ts                        # Updated: add 2 missing kinds to ACTIONLINT_KIND_MAP
  types.ts                         # No changes needed
  rules/
    index.ts                       # Updated: import and aggregate all rule categories
    ast-helpers.ts                 # Updated: add forEachJobNode, forEachStepNode helpers
    security/                      # Existing (Phase 76, no changes)
      index.ts
      GA-C001...GA-C010
    semantic/                      # NEW: actionlint enrichment metadata
      index.ts                     # Barrel export for 18 GA-L* metadata rules
      actionlint-rules.ts          # All 18 GA-L* rule metadata objects in one file
    best-practice/                 # NEW: 8 best practice rules
      index.ts                     # Barrel export
      GA-B001-missing-timeout.ts
      GA-B002-missing-concurrency.ts
      GA-B003-unnamed-step.ts
      GA-B004-duplicate-step-name.ts
      GA-B005-empty-env.ts
      GA-B006-missing-conditional.ts
      GA-B007-outdated-action.ts
      GA-B008-missing-continue-on-error.ts
    style/                         # NEW: 4 style rules
      index.ts                     # Barrel export
      GA-F001-jobs-not-alphabetical.ts
      GA-F002-inconsistent-quoting.ts
      GA-F003-long-step-name.ts
      GA-F004-missing-workflow-name.ts
  sample-workflow.ts               # Updated: add comprehensive sample with all rule categories
```

### Pattern 1: Custom Best Practice Rule (same as Security Rule pattern)
**What:** A self-contained rule object implementing `GhaLintRule` with metadata and `check()` method.
**When to use:** For all 8 best practice and 4 style rules.
**Example:**
```typescript
// rules/best-practice/GA-B001-missing-timeout.ts
import { isMap, isPair, isScalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import { resolveKey } from '../ast-helpers';

export const GAB001: GhaLintRule = {
  id: 'GA-B001',
  title: 'Missing timeout-minutes',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'Jobs without `timeout-minutes` default to 360 minutes (6 hours). A hung job will ' +
    'consume runner resources for hours before GitHub cancels it. Always set an explicit ' +
    'timeout appropriate for the job (typically 5-30 minutes for CI builds).',
  fix: {
    description: 'Add timeout-minutes to the job',
    beforeCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest',
    afterCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 30',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];
    const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
    if (!isMap(jobsNode)) return violations;

    for (const jobPair of jobsNode.items) {
      if (!isPair(jobPair) || !isScalar(jobPair.key)) continue;
      const jobName = String(jobPair.key.value);
      const timeoutNode = resolveKey(jobPair.value, 'timeout-minutes');
      if (timeoutNode === null) {
        const pos = getNodeLine(jobPair.key, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-B001',
          line: pos.line,
          column: pos.col,
          message: `Job '${jobName}' has no timeout-minutes. Default is 360 minutes (6 hours).`,
        });
      }
    }
    return violations;
  },
};
```

### Pattern 2: Actionlint Rule Metadata (Documentation-Only Rules)
**What:** GhaLintRule objects for Pass 2 actionlint rules that have metadata (explanation, fix) but no `check()` method. These are used by the rule documentation pages and for enriched violation messages.
**When to use:** For all 18 GA-L* rules.
**Example:**
```typescript
// rules/semantic/actionlint-rules.ts
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';

/** Actionlint rule metadata. check() returns [] because detection is via WASM Pass 2. */
function actionlintMeta(
  id: string,
  title: string,
  severity: 'error' | 'warning',
  category: 'semantic' | 'security' | 'best-practice' | 'actionlint',
  explanation: string,
  fix: { description: string; beforeCode: string; afterCode: string },
): GhaLintRule {
  return {
    id, title, severity, category, explanation, fix,
    check(_ctx: GhaRuleContext): GhaRuleViolation[] { return []; },
  };
}

export const GAL001 = actionlintMeta(
  'GA-L001', 'Syntax error (actionlint)', 'error', 'semantic',
  'The workflow file has a YAML syntax error or uses an unsupported YAML feature. ' +
  'actionlint detects issues like unexpected keys, duplicate map keys, and invalid values.',
  {
    description: 'Fix the YAML syntax error',
    beforeCode: 'on: [push\n  branches: main',
    afterCode: 'on:\n  push:\n    branches: [main]',
  },
);
// ... 17 more GA-L* rules
```

### Pattern 3: New AST Helpers for Job/Step Iteration
**What:** Shared traversal helpers for iterating jobs and steps, extending the existing `forEachUsesNode` and `forEachRunNode` pattern.
**When to use:** For best practice and style rules that need to iterate jobs or steps.
**Example:**
```typescript
// ast-helpers.ts additions
/**
 * Iterate over all jobs in the workflow.
 * Callback receives the job name, the job Map node, and the job key node (for line resolution).
 */
export function forEachJobNode(
  ctx: GhaRuleContext,
  callback: (jobName: string, jobNode: any, jobKeyNode: any) => void,
): void {
  const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
  if (!isMap(jobsNode)) return;

  for (const jobPair of jobsNode.items) {
    if (!isPair(jobPair) || !isScalar(jobPair.key)) continue;
    callback(String(jobPair.key.value), jobPair.value, jobPair.key);
  }
}

/**
 * Iterate over all steps in a job.
 * Callback receives the step Map node and its index.
 */
export function forEachStepNode(
  jobNode: any,
  callback: (stepNode: any, stepIndex: number) => void,
): void {
  const stepsNode = resolveKey(jobNode, 'steps');
  if (!isSeq(stepsNode)) return;

  for (let i = 0; i < stepsNode.items.length; i++) {
    if (isMap(stepsNode.items[i])) {
      callback(stepsNode.items[i], i);
    }
  }
}
```

### Pattern 4: Rule Registry Aggregation
**What:** The master `rules/index.ts` imports all category barrels and aggregates into `allGhaRules`.
**When to use:** For the rule registry update.
**Example:**
```typescript
// rules/index.ts (updated)
import type { GhaLintRule } from '../types';
import { securityRules } from './security';
import { bestPracticeRules } from './best-practice';
import { styleRules } from './style';
import { actionlintMetaRules } from './semantic';

/** All custom lint rules with check() methods (run in Pass 1). */
export const allGhaRules: GhaLintRule[] = [
  ...securityRules,
  ...bestPracticeRules,
  ...styleRules,
];

/** All documented rules (custom + actionlint metadata) for static page generation. */
export const allDocumentedGhaRules: GhaLintRule[] = [
  ...allGhaRules,
  ...actionlintMetaRules,
];

/** Look up a rule by ID. Returns undefined if not found. */
export function getGhaRuleById(id: string): GhaLintRule | undefined {
  return allDocumentedGhaRules.find((r) => r.id === id);
}
```

### Anti-Patterns to Avoid
- **Adding actionlint metadata rules to `allGhaRules`:** The `allGhaRules` array is injected into `runPass1()` as custom rules. GA-L* metadata rules have no-op `check()` methods and would waste cycles. Keep them in `allDocumentedGhaRules` only.
- **Hardcoding absolute version numbers for BP-07 without a maintenance path:** The outdated action version map will go stale. Use a clearly labeled constant map with a "last verified" date comment so future maintainers know when to update.
- **Flagging ALL steps without names (BP-03):** Steps using `uses:` are self-documenting (e.g., `uses: actions/checkout@v4` is clear). Only flag `run:` steps without names, as shell commands are opaque without names.
- **Making style rules `warning` severity:** Style rules should be `info` severity to avoid inflating the violation count. They are suggestions, not problems.
- **Detecting quoting via regex on rawText:** YAML quoting detection should use the `yaml` library's AST node properties. Scalar nodes have a `type` property indicating flow/block and `singleQuote` indicating quote style.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job iteration | Inline `jobsNode.items` loop in every rule | `forEachJobNode()` helper (new) | DRY; 8+ rules need job iteration |
| Step iteration | Nested job+step loops in every rule | `forEachStepNode()` helper (new) | DRY; 5+ rules need step iteration |
| YAML key lookup | Inline `isMap`/`isPair` scanning | `resolveKey()` from existing ast-helpers.ts | Already proven across 10 security rules |
| Line number resolution | Custom offset math | `getNodeLine()` from parser.ts | Handles undefined ranges safely |
| Quoting style detection | Regex on raw YAML text | `yaml` library Scalar node properties (`type`, `flow`) | AST node properties are authoritative |

**Key insight:** The existing ast-helpers.ts is the foundation. Adding `forEachJobNode()` and `forEachStepNode()` creates a complete helper set that covers all traversal patterns needed by best practice and style rules.

## Common Pitfalls

### Pitfall 1: Actionlint Metadata Rules Inflating rulesRun Count
**What goes wrong:** Including GA-L* metadata rules in the `allGhaRules` array causes `runPass1()` to report inflated `rulesRun` counts and run 18 no-op check functions.
**Why it happens:** The registry has two use cases: (1) rules to execute in Pass 1, and (2) rules to document on rule pages. Conflating them breaks the engine's rule count.
**How to avoid:** Maintain two separate exports: `allGhaRules` (executable, injected into engine) and `allDocumentedGhaRules` (superset, used for documentation/lookup). Only `allGhaRules` goes to `runPass1()`.
**Warning signs:** `rulesRun` count jumps to 48 when only 22 custom rules have check logic.

### Pitfall 2: BP-03 (Unnamed Steps) False Positives on `uses:` Steps
**What goes wrong:** BP-03 flags `uses: actions/checkout@v4` steps as "unnamed" even though the action reference is self-documenting.
**Why it happens:** The rule blindly checks all steps for a `name:` key without considering that `uses:` steps have an inherent description.
**How to avoid:** Only flag steps that have a `run:` key but no `name:` key. Steps with `uses:` should not be flagged.
**Warning signs:** Every `uses:` step without an explicit `name:` generates a violation.

### Pitfall 3: BP-07 (Outdated Actions) Version Map Staleness
**What goes wrong:** BP-07's hardcoded version map becomes outdated as GitHub releases new major versions of well-known actions, causing false positives on current versions.
**Why it happens:** Action versions change over time (e.g., actions/checkout went from v3 to v4). The map cannot auto-update.
**How to avoid:** (1) Clearly document the "last verified" date in a comment. (2) Only flag versions that are 2+ major versions behind current (e.g., flag v2 when v4 is current, but not v3). (3) Keep the known-current version map conservative -- only include the most commonly used actions/ and github/ namespace actions.
**Warning signs:** Users with current action versions getting "outdated" warnings.

### Pitfall 4: STYLE-02 (Inconsistent Quoting) Detecting Quoting Style
**What goes wrong:** The rule cannot distinguish between `uses: actions/checkout@v4` (unquoted), `uses: "actions/checkout@v4"` (double-quoted), and `uses: 'actions/checkout@v4'` (single-quoted) because the YAML parser normalizes all three to the same string value.
**Why it happens:** YAML parsers typically strip quotes during parsing. The string value is identical regardless of quoting.
**How to avoid:** Use the `yaml` library's Scalar node properties. The `type` property distinguishes `PLAIN`, `QUOTE_SINGLE`, `QUOTE_DOUBLE`, `BLOCK_LITERAL`, and `BLOCK_FOLDED`. Check `isScalar(node) && node.type` to determine the quoting style without regex.
**Warning signs:** Rule reports zero inconsistencies because all values look the same after parsing.

### Pitfall 5: BP-06 (Missing Conditional) Overly Strict Detection
**What goes wrong:** BP-06 flags jobs in PR-only workflows that legitimately don't need conditionals (e.g., a single build job that should always run on PRs).
**Why it happens:** Not all PR-triggered workflows need per-job conditionals. The rule becomes noisy.
**How to avoid:** Only flag when the workflow triggers on `pull_request` AND the job has no `if:` key AND the workflow has 2+ jobs. Single-job PR workflows are legitimate. Alternatively, set severity to `info` so it's advisory rather than prescriptive.
**Warning signs:** Every PR-triggered workflow generating violations.

### Pitfall 6: STYLE-01 (Jobs Not Alphabetical) Breaking on Single Job
**What goes wrong:** Rule fires on a single-job workflow because "one element is trivially sorted."
**Why it happens:** No minimum threshold for meaningful sorting.
**How to avoid:** Only check alphabetical ordering when there are 2+ jobs. A single job is always "in order."
**Warning signs:** Single-job workflows getting style violations.

### Pitfall 7: BP-08 (Missing continue-on-error) False Positive Rate
**What goes wrong:** Rule flags benign `run: curl` steps that are not fetching external data, or misses network calls that use non-obvious tools.
**Why it happens:** Heuristic detection of "external data fetching" from `run:` script content is inherently imprecise.
**How to avoid:** Use a conservative keyword list: `curl`, `wget`, `gh api`, `http`, `fetch`. Only flag `run:` steps (not `uses:` steps, which have their own error handling). Set severity to `info`. Accept that this is an advisory rule with known false positive risk.
**Warning signs:** Every `curl` step flagged even when used for health checks or localhost.

## Code Examples

### Complete Actionlint Kind-to-Rule Mapping (18 kinds)
```typescript
// engine.ts - UPDATED ACTIONLINT_KIND_MAP with all 18 kinds
const ACTIONLINT_KIND_MAP: Record<
  string,
  { ruleId: string; severity: GhaSeverity; category: GhaCategory }
> = {
  'syntax-check':        { ruleId: 'GA-L001', severity: 'error',   category: 'semantic' },
  expression:            { ruleId: 'GA-L002', severity: 'error',   category: 'semantic' },
  'job-needs':           { ruleId: 'GA-L003', severity: 'error',   category: 'semantic' },
  matrix:                { ruleId: 'GA-L004', severity: 'error',   category: 'semantic' },
  events:                { ruleId: 'GA-L005', severity: 'error',   category: 'semantic' },
  glob:                  { ruleId: 'GA-L006', severity: 'warning', category: 'semantic' },
  action:                { ruleId: 'GA-L007', severity: 'error',   category: 'semantic' },
  'runner-label':        { ruleId: 'GA-L008', severity: 'error',   category: 'semantic' },
  'shell-name':          { ruleId: 'GA-L009', severity: 'error',   category: 'semantic' },
  id:                    { ruleId: 'GA-L010', severity: 'error',   category: 'semantic' },
  credentials:           { ruleId: 'GA-L011', severity: 'error',   category: 'security' },
  'env-var':             { ruleId: 'GA-L012', severity: 'warning', category: 'semantic' },
  permissions:           { ruleId: 'GA-L013', severity: 'error',   category: 'security' },
  'workflow-call':       { ruleId: 'GA-L014', severity: 'error',   category: 'semantic' },
  'deprecated-commands': { ruleId: 'GA-L015', severity: 'warning', category: 'best-practice' },
  'if-cond':             { ruleId: 'GA-L016', severity: 'warning', category: 'semantic' },
  shellcheck:            { ruleId: 'GA-L017', severity: 'warning', category: 'actionlint' },
  pyflakes:              { ruleId: 'GA-L018', severity: 'warning', category: 'actionlint' },
};
```

### Job-Level AST Iteration Helper
```typescript
// ast-helpers.ts - new forEachJobNode helper
export function forEachJobNode(
  ctx: GhaRuleContext,
  callback: (jobName: string, jobNode: any, jobKeyNode: any) => void,
): void {
  const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
  if (!isMap(jobsNode)) return;

  for (const jobPair of jobsNode.items) {
    if (!isPair(jobPair) || !isScalar(jobPair.key)) continue;
    callback(String(jobPair.key.value), jobPair.value, jobPair.key);
  }
}
```

### Style Rule: Jobs Not Alphabetically Ordered
```typescript
// rules/style/GA-F001-jobs-not-alphabetical.ts
// Follows CV-F001 pattern from compose-validator
export const GAF001: GhaLintRule = {
  id: 'GA-F001',
  title: 'Jobs not alphabetically ordered',
  severity: 'info',
  category: 'style',
  explanation:
    'Job definitions are not listed in alphabetical order. While GitHub Actions does not ' +
    'require any particular ordering, alphabetical ordering makes it easier to locate jobs ' +
    'in large workflow files and produces more predictable diffs in version control.',
  fix: {
    description: 'Reorder jobs alphabetically',
    beforeCode: 'jobs:\n  deploy:\n    ...\n  build:\n    ...',
    afterCode: 'jobs:\n  build:\n    ...\n  deploy:\n    ...',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];
    const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
    if (!isMap(jobsNode)) return violations;

    const jobNames: string[] = [];
    const jobNodes: any[] = [];

    for (const item of jobsNode.items) {
      if (isPair(item) && isScalar(item.key)) {
        jobNames.push(String(item.key.value));
        jobNodes.push(item.key);
      }
    }

    if (jobNames.length < 2) return violations;

    const sorted = [...jobNames].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );

    for (let i = 0; i < jobNames.length; i++) {
      if (jobNames[i] !== sorted[i]) {
        const pos = getNodeLine(jobNodes[i], ctx.lineCounter);
        violations.push({
          ruleId: 'GA-F001',
          line: pos.line,
          column: pos.col,
          message: `Jobs are not in alphabetical order. Found '${jobNames[i]}' where '${sorted[i]}' was expected.`,
        });
        break; // Report only first out-of-order job
      }
    }

    return violations;
  },
};
```

### Best Practice Rule: Outdated Action Version
```typescript
// rules/best-practice/GA-B007-outdated-action.ts
// Known-current major versions of well-known GitHub Actions
// Last verified: 2026-03-04
const KNOWN_CURRENT_VERSIONS: Record<string, number> = {
  'actions/checkout': 4,
  'actions/setup-node': 4,
  'actions/setup-python': 5,
  'actions/setup-java': 4,
  'actions/setup-go': 5,
  'actions/upload-artifact': 4,
  'actions/download-artifact': 4,
  'actions/cache': 4,
  'actions/github-script': 7,
  'github/codeql-action': 3,
};

// Extract version from uses: value, e.g., "actions/checkout@v4" -> { action: "actions/checkout", major: 4 }
function parseUsesVersion(usesValue: string): { action: string; major: number } | null {
  const atIndex = usesValue.lastIndexOf('@');
  if (atIndex === -1) return null;
  const action = usesValue.slice(0, atIndex);
  const ref = usesValue.slice(atIndex + 1);
  const match = /^v(\d+)/.exec(ref);
  if (!match) return null;
  return { action, major: parseInt(match[1], 10) };
}
```

### Detecting Quoting Style from YAML AST
```typescript
// rules/style/GA-F002-inconsistent-quoting.ts
// yaml library Scalar types: PLAIN, QUOTE_SINGLE, QUOTE_DOUBLE, BLOCK_LITERAL, BLOCK_FOLDED
import { Scalar } from 'yaml';

function getQuoteStyle(node: any): 'plain' | 'single' | 'double' | 'other' {
  if (!isScalar(node)) return 'other';
  const s = node as Scalar;
  switch (s.type) {
    case Scalar.PLAIN: return 'plain';
    case Scalar.QUOTE_SINGLE: return 'single';
    case Scalar.QUOTE_DOUBLE: return 'double';
    default: return 'other';
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No timeout defaults | Explicit timeout-minutes recommended | GitHub blog 2023 | Prevents 6-hour hung jobs |
| No concurrency controls | `concurrency:` key with cancel-in-progress | GitHub Actions 2021+ | Prevents resource waste on PR update spam |
| actions/checkout@v3 | actions/checkout@v4 (Node 20) | 2023 | v3 is EOL due to Node 16 deprecation |
| Node 16 runners | Node 20 runners (Node 24 incoming fall 2026) | Sep 2025 announcement | Actions using Node 16 runners no longer work |

**Deprecated/outdated:**
- `set-output` command: Deprecated in favor of `$GITHUB_OUTPUT` environment file. actionlint `deprecated-commands` kind detects this.
- `save-state` command: Deprecated in favor of `$GITHUB_STATE` environment file.
- Node 16 action runners: EOL; all well-known actions have migrated to Node 20+.

## Open Questions

1. **BP-07 version map maintenance**
   - What we know: Well-known action versions change over time. The hardcoded map will go stale.
   - What's unclear: How often to update the map. Whether to include a "grace period" (e.g., only flag versions 2+ major behind).
   - Recommendation: Flag versions that are 2+ major versions behind. Include the current major version in a constant map with a "last verified" date comment. Accept staleness as a documentation issue, not a correctness issue -- the rule is advisory (`info` severity).

2. **BP-08 network call heuristic accuracy**
   - What we know: Detecting "steps that fetch external data" from `run:` script content is heuristic. Keywords like `curl`, `wget` are reliable indicators, but many network calls use other tools.
   - What's unclear: False positive rate in real-world workflows.
   - Recommendation: Use a conservative keyword list and `info` severity. Better to miss some network calls than to over-flag.

3. **Actionlint enrichment integration approach**
   - What we know: GA-L* rules need enriched messages beyond raw actionlint output. The `mapActionlintError()` function currently passes through the raw message.
   - What's unclear: Whether to enrich at mapping time (in engine.ts) or at display time (in UI layer, Phase 78).
   - Recommendation: Enrich at mapping time. Update `mapActionlintError()` to look up the GA-L* metadata object and prepend the rule title to the message. This keeps the enrichment logic in the engine layer, not the UI.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEM-01 | 18 actionlint kinds mapped to GA-L001-L018 | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Exists (update) |
| SEM-02 | Each kind assigned correct category | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Exists (update) |
| SEM-03 | GA-L017/GA-L018 documented as unavailable | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/semantic-rules.test.ts -x` | Wave 0 |
| SEM-04 | Enriched explanations and fix suggestions | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/semantic-rules.test.ts -x` | Wave 0 |
| BP-01 | GA-B001 flags missing timeout-minutes | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 0 |
| BP-02 | GA-B002 flags missing concurrency | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 0 |
| BP-03 | GA-B003 flags unnamed run: steps | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 0 |
| BP-04 | GA-B004 flags duplicate step names | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 0 |
| BP-05 | GA-B005 flags empty env blocks | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 0 |
| BP-06 | GA-B006 flags jobs without conditional on PR workflows | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 0 |
| BP-07 | GA-B007 flags outdated action versions | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 0 |
| BP-08 | GA-B008 flags missing continue-on-error | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 0 |
| STYLE-01 | GA-F001 flags non-alphabetical jobs | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Wave 0 |
| STYLE-02 | GA-F002 flags inconsistent uses: quoting | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Wave 0 |
| STYLE-03 | GA-F003 flags step names > 80 chars | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Wave 0 |
| STYLE-04 | GA-F004 flags missing workflow name | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/tools/gha-validator/rules/__tests__/semantic-rules.test.ts` -- covers SEM-03, SEM-04 (metadata presence, explanation/fix fields)
- [ ] `src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts` -- covers BP-01 through BP-08
- [ ] `src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts` -- covers STYLE-01 through STYLE-04
- [ ] Update `src/lib/tools/gha-validator/__tests__/engine.test.ts` -- covers SEM-01 (18 kinds mapped), SEM-02 (categories correct)

## Sources

### Primary (HIGH confidence)
- actionlint source code `linter.go`: https://github.com/rhysd/actionlint/blob/main/linter.go -- confirmed 17 rules (15 unconditional + 2 conditional = 18 unique error kinds including shellcheck and pyflakes)
- actionlint checks documentation: https://github.com/rhysd/actionlint/blob/main/docs/checks.md -- 16 base error kinds documented (deprecated-commands and if-cond discovered via source code)
- GitHub Actions workflow syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions -- `timeout-minutes`, `concurrency`, `name`, `if`, `continue-on-error` field specs
- Existing codebase: Phase 76 security rules, engine.ts, ast-helpers.ts, parser.ts, types.ts -- verified patterns and interfaces
- Compose-validator rules: `src/lib/tools/compose-validator/rules/style/CV-F001-services-not-alphabetical.ts` -- proven style rule pattern

### Secondary (MEDIUM confidence)
- GitHub Actions timeout best practices: https://dev.to/suzukishunsuke/set-github-actions-timeout-minutes-1jkk -- default 360 minutes, best practice to set explicit timeouts
- GitHub concurrency documentation: https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs -- concurrency group patterns
- GitHub Actions Node 20 deprecation: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/ -- Node 20 EOL timeline, Node 24 migration

### Tertiary (LOW confidence)
- BP-08 network call heuristic: No authoritative source for what constitutes "fetching external data." Heuristic based on common CLI tools (curl, wget). Marked as advisory rule with `info` severity.
- BP-06 conditional requirement: No GitHub official recommendation that PR-only workflows must have per-job conditionals. This is an opinionated best practice.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; all libraries from Phase 75-76
- Architecture: HIGH -- follows identical pattern to Phase 76 security rules; compose-validator provides proven reference for best-practice and style categories
- Actionlint mapping: HIGH -- verified 18 kinds against actionlint source code (linter.go); 2 missing kinds (deprecated-commands, if-cond) identified
- Best practice rules: MEDIUM -- detection logic is straightforward AST traversal, but some rules (BP-06, BP-08) involve heuristics with known false positive risk
- Style rules: HIGH -- simple AST checks with minimal ambiguity; quoting detection via yaml library Scalar.type property verified
- Pitfalls: HIGH -- identified 7 specific pitfalls with prevention strategies

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days -- stable domain; action version map may need updates sooner)
