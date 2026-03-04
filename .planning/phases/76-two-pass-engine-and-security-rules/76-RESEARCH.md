# Phase 76: Two-Pass Engine and Security Rules - Research

**Researched:** 2026-03-04
**Domain:** Validation engine orchestration, diagnostic deduplication, GitHub Actions security rule detection
**Confidence:** HIGH

## Summary

Phase 76 builds the validation orchestrator that ties together the two engines from Phase 75 (schema + WASM actionlint) into a unified two-pass pipeline, plus 10 custom security rules detecting dangerous GitHub Actions workflow patterns. The phase has two distinct halves: (1) the engine layer that runs Pass 1 synchronously and Pass 2 asynchronously, deduplicates diagnostics, and normalizes all violations to a unified format; and (2) 10 security rules that operate as custom rules in Pass 1, analyzing the parsed YAML AST for supply-chain, injection, and permission vulnerabilities.

The engine architecture follows the proven `engine.ts` pattern from compose-validator and k8s-analyzer, but with a critical difference: this engine is **two-pass and asynchronous**. Pass 1 runs synchronously on the main thread (schema validation via pre-compiled ajv + custom security rules against the YAML AST) and returns results immediately. Pass 2 dispatches YAML to the actionlint Web Worker and merges results when they arrive. Deduplication suppresses diagnostics from both passes that share the same `(line, column)` coordinate, keeping the more specific finding (custom rules with stable `GA-*` IDs take precedence over raw actionlint output).

The security rules are custom Pass 1 rules that use regex and AST traversal against the parsed workflow YAML -- they do NOT depend on actionlint WASM. Most security concerns (SHA pinning, missing permissions, pull_request_target, self-hosted runners) are NOT covered by actionlint, so these rules fill a critical gap. Two areas have partial overlap with actionlint: script injection (actionlint `expression` kind detects `${{ }}` injection) and hardcoded credentials (actionlint `credentials` kind detects passwords in container configs). The deduplication engine handles this overlap.

**Primary recommendation:** Build a `GhaEngine` class with `runPass1Sync()` and `mergePass2Results()` methods, 10 security rules following the compose-validator `ComposeLintRule` interface pattern, and a deduplication function that keys on `(line, column)` with custom rule priority over actionlint findings.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENGINE-01 | Two-pass architecture: Pass 1 (schema + custom rules, synchronous) and Pass 2 (actionlint WASM, async via Worker) | Engine follows compose/k8s `engine.ts` pattern but split into sync pass1 and async pass2. Pass 1 uses existing `parseGhaWorkflow` + `validateGhaSchema` + `categorizeSchemaErrors` + custom security rules. Pass 2 calls `createActionlintWorker().analyze()`. |
| ENGINE-02 | Diagnostic deduplication merges findings from both passes, suppressing duplicates on `(line, column)` pairs | Dedup function keys on `${line}:${column}`, keeps Pass 1 findings when both passes report same location. Overlap exists for: script injection (actionlint `expression` kind vs GA-C005), permissions (actionlint `permissions` kind vs GA-C003/C004), credentials (actionlint `credentials` kind vs GA-C007). |
| ENGINE-03 | Results from Pass 1 displayed immediately while WASM loads and runs Pass 2 | Engine returns Pass 1 results synchronously. UI consumer (Phase 78) renders them immediately. Pass 2 results arrive via callback and trigger re-render with merged set. Nanostore pattern: `ghaViolations` atom updated twice. |
| ENGINE-04 | All violations mapped to unified format with {ruleId, message, line, column, severity, category} | Extend existing `GhaRuleViolation` type with `severity` and `category` fields. actionlint errors mapped to `GA-L*` rule IDs with severity/category assignment. Schema errors already have ruleId/message/line/column from Phase 75. |
| SEC-01 | GA-C001 flags unpinned action versions (actions/checkout@v4 instead of SHA) | Regex on `uses:` values: `/^[^@]+@v\d+$/` detects semver tags without full SHA. Actionlint does NOT check SHA pinning (confirmed: "Fixing version of action like actions/checkout@v4.0.1 is not supported for now"). |
| SEC-02 | GA-C002 flags mutable action tags (branch refs like @main) | Regex: `/^[^@]+@(main|master|develop|dev|HEAD)$/i` on `uses:` values. Actionlint does not flag branch refs. |
| SEC-03 | GA-C003 flags overly permissive permissions (permissions: write-all) | AST check: `permissions` value is `write-all` string. Actionlint validates permission syntax but does NOT flag `write-all` as overly permissive. |
| SEC-04 | GA-C004 flags missing permissions block at workflow level | AST check: top-level `permissions` key absent. Actionlint does NOT check for missing permissions block. |
| SEC-05 | GA-C005 flags script injection risk (${{ github.event.*.title }} in run: blocks) | Regex: `/\$\{\{\s*github\.(event\.\w+\.(title|body|head_ref|label|message|name|page_name|email|default_branch|ref)|head_ref)\s*\}\}/` in `run:` values. Actionlint also detects this (kind: `expression`), so dedup applies. |
| SEC-06 | GA-C006 flags pull_request_target without path/branch restrictions | AST check: `on.pull_request_target` exists without `paths`, `paths-ignore`, `branches`, or `branches-ignore` filters. Actionlint does NOT check this. |
| SEC-07 | GA-C007 flags hardcoded secrets in workflow file | Regex patterns for API keys, tokens, passwords in string values. Partial overlap with actionlint `credentials` kind (container passwords only). |
| SEC-08 | GA-C008 flags third-party actions without SHA pinning | Regex: `uses:` value not starting with `actions/` or `github/` and not pinned to 40-char hex SHA. No actionlint coverage. |
| SEC-09 | GA-C009 flags dangerous combined GITHUB_TOKEN permission scopes | AST check: `permissions` block has `contents: write` + `actions: write` or `packages: write` + `contents: write` simultaneously. No actionlint coverage. |
| SEC-10 | GA-C010 flags self-hosted runner usage (informational security reminder) | AST check: `runs-on` value is `self-hosted` or contains `self-hosted` in array. No actionlint coverage. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yaml | ^2.8.2 | YAML parsing with AST for line-number resolution in security rules | Already in project; provides `isMap`, `isPair`, `isScalar`, `isSeq` for AST traversal |
| nanostores | ^1.1.0 | State management for two-pass results (violations, loading state) | Already in project; bridges engine results to React UI |
| @nanostores/react | ^1.0.0 | React bindings for nanostores | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| actionlint WASM | v1.7.11 (Phase 75) | Pass 2 deep semantic analysis | Already downloaded; used via `createActionlintWorker` |
| ajv standalone | (Phase 75) | Pass 1 schema validation | Already compiled; used via `validateGhaSchema` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom dedup on (line,col) | No dedup (show all) | Users would see duplicate findings for the same issue from both passes; poor UX |
| Custom security rules | actionlint-only | actionlint does NOT check SHA pinning, missing permissions, pull_request_target, or self-hosted runners -- custom rules fill critical gaps |
| Line+column keying | ruleId-based dedup | Different rule IDs from different passes can flag the same code location; line+column is the correct granularity |

**Installation:**
No new npm packages needed. All dependencies already in project from Phase 75.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/gha-validator/
  engine.ts                    # Two-pass validation orchestrator (new)
  rules/                       # Custom lint rules directory (new)
    index.ts                   # Rule registry + allGhaRules export
    security/                  # Security rules (new)
      index.ts                 # Security rules barrel export
      GA-C001-unpinned-action.ts
      GA-C002-mutable-action-tag.ts
      GA-C003-overly-permissive-permissions.ts
      GA-C004-missing-permissions.ts
      GA-C005-script-injection.ts
      GA-C006-pull-request-target.ts
      GA-C007-hardcoded-secrets.ts
      GA-C008-third-party-no-sha.ts
      GA-C009-dangerous-token-scopes.ts
      GA-C010-self-hosted-runner.ts
  types.ts                     # Extended with GhaLintRule, GhaRuleContext, unified violation (modified)
  schema-validator.ts          # Existing (no changes needed)
  parser.ts                    # Existing (no changes needed)
  worker/                      # Existing from Phase 75
    actionlint-worker.ts
    worker-client.ts
  sample-workflow.ts           # Extended with security-error samples (modified)
src/stores/
  ghaValidatorStore.ts         # Extended with violation state atoms (modified)
```

### Pattern 1: Two-Pass Engine with Sync+Async Orchestration
**What:** An engine that runs Pass 1 synchronously (schema + custom rules) and orchestrates Pass 2 asynchronously (WASM Worker), merging results with deduplication.
**When to use:** When you have a fast synchronous validation path and a slower async one, and want to show immediate results.
**Example:**
```typescript
// engine.ts
// Source: Adapted from compose-validator/engine.ts + k8s-analyzer/engine.ts
import type { GhaRuleViolation, GhaUnifiedViolation, GhaRuleContext } from './types';
import type { ActionlintError } from './types';
import { parseGhaWorkflow } from './parser';
import { validateGhaSchema, categorizeSchemaErrors } from './schema-validator';
import { allGhaRules } from './rules';

export interface GhaEngineResult {
  violations: GhaUnifiedViolation[];
  rulesRun: number;
  rulesPassed: number;
  pass: 1 | 2;  // Which pass produced this result set
}

/**
 * Pass 1: Synchronous schema + custom rules.
 * Returns results immediately for display while WASM loads.
 */
export function runPass1(rawText: string): GhaEngineResult {
  const parseResult = parseGhaWorkflow(rawText);
  const violations: GhaUnifiedViolation[] = [];

  // YAML parse errors -> unified format
  for (const err of parseResult.parseErrors) {
    violations.push(toUnified(err, 'error', 'schema'));
  }

  // Schema validation
  if (parseResult.json) {
    const schemaErrors = validateGhaSchema(parseResult.json);
    const schemaViolations = categorizeSchemaErrors(
      schemaErrors, parseResult.doc, parseResult.lineCounter
    );
    for (const v of schemaViolations) {
      violations.push(toUnified(v, 'error', 'schema'));
    }
  }

  // Custom rules (security, etc.)
  if (parseResult.json) {
    const ctx: GhaRuleContext = {
      doc: parseResult.doc,
      rawText,
      lineCounter: parseResult.lineCounter,
      json: parseResult.json,
    };

    let rulesPassed = 0;
    for (const rule of allGhaRules) {
      const ruleViolations = rule.check(ctx);
      if (ruleViolations.length === 0) rulesPassed++;
      for (const v of ruleViolations) {
        violations.push(toUnified(v, rule.severity, rule.category));
      }
    }
  }

  violations.sort((a, b) => a.line - b.line || a.column - b.column);
  return { violations, rulesRun: allGhaRules.length + 8, rulesPassed: 0, pass: 1 };
}

/**
 * Merge Pass 2 (actionlint WASM) results into existing Pass 1 results.
 * Deduplicates on (line, column) -- Pass 1 findings take precedence.
 */
export function mergePass2(
  pass1Violations: GhaUnifiedViolation[],
  actionlintErrors: ActionlintError[],
): GhaEngineResult {
  const occupied = new Set(
    pass1Violations.map(v => `${v.line}:${v.column}`)
  );

  const pass2Violations: GhaUnifiedViolation[] = [];
  for (const err of actionlintErrors) {
    const key = `${err.line}:${err.column}`;
    if (!occupied.has(key)) {
      pass2Violations.push(mapActionlintError(err));
      occupied.add(key);
    }
  }

  const merged = [...pass1Violations, ...pass2Violations];
  merged.sort((a, b) => a.line - b.line || a.column - b.column);
  return { violations: merged, rulesRun: 0, rulesPassed: 0, pass: 2 };
}
```

### Pattern 2: Custom Rule Interface (follows compose-validator pattern)
**What:** Each rule is a self-contained object with metadata and a `check()` method.
**When to use:** For all custom rules that run in Pass 1.
**Example:**
```typescript
// types.ts additions
// Source: Adapted from compose-validator/types.ts ComposeLintRule interface
export interface GhaLintRule {
  id: string;           // e.g., 'GA-C001'
  title: string;        // Human-readable rule name
  severity: GhaSeverity;
  category: GhaCategory;
  explanation: string;  // Expert-level explanation for rule doc pages
  fix: GhaRuleFix;      // Before/after code for fix suggestion
  check(ctx: GhaRuleContext): GhaRuleViolation[];
}

export interface GhaRuleContext {
  doc: Document;
  rawText: string;
  lineCounter: LineCounter;
  json: Record<string, unknown>;
}

// Unified violation format (ENGINE-04)
export interface GhaUnifiedViolation {
  ruleId: string;
  message: string;
  line: number;      // 1-based
  column: number;    // 1-based
  severity: GhaSeverity;
  category: GhaCategory;
  endLine?: number;
  endColumn?: number;
}
```

### Pattern 3: Security Rule Implementation
**What:** A security rule that traverses the YAML AST to detect dangerous patterns.
**When to use:** For all SEC-01 through SEC-10 rules.
**Example:**
```typescript
// rules/security/GA-C001-unpinned-action.ts
// Source: Adapted from compose-validator/rules/security/CV-C001-privileged-mode.ts pattern
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';

// SHA-1 hex pattern (40 chars)
const SHA_RE = /^[0-9a-f]{40}$/i;
// Semver tag pattern (v1, v2.3, v4.0.1, etc.)
const SEMVER_TAG_RE = /^v\d+(\.\d+)*$/;

export const GAC001: GhaLintRule = {
  id: 'GA-C001',
  title: 'Unpinned action version',
  severity: 'warning',
  category: 'security',
  explanation:
    'Using a mutable version tag like @v4 allows the action maintainer to push ' +
    'breaking changes or malicious code to that tag without your knowledge. Pin to ' +
    'a full commit SHA to ensure immutable, reproducible builds. The tj-actions/changed-files ' +
    'supply chain attack (March 2025) compromised 23,000+ repos via tag mutation.',
  fix: {
    description: 'Pin the action to a specific commit SHA',
    beforeCode: 'uses: actions/checkout@v4',
    afterCode: 'uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];
    // Traverse jobs -> steps -> uses
    forEachUsesNode(ctx, (usesValue, node) => {
      const atIndex = usesValue.lastIndexOf('@');
      if (atIndex === -1) return; // local action
      const ref = usesValue.slice(atIndex + 1);
      if (SEMVER_TAG_RE.test(ref) && !SHA_RE.test(ref)) {
        const pos = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'GA-C001',
          line: pos.line,
          column: pos.col,
          message: `Action '${usesValue}' uses a mutable semver tag. Pin to a commit SHA for supply-chain safety.`,
        });
      }
    });
    return violations;
  },
};
```

### Pattern 4: Actionlint Error to Unified Format Mapping
**What:** Map raw actionlint `{kind, message, line, column}` to `GhaUnifiedViolation` with ruleId, severity, and category.
**When to use:** For all Pass 2 results.
**Example:**
```typescript
// engine.ts - actionlint kind -> GA-L* rule ID mapping
// Source: actionlint docs/checks.md, 16 error kinds
const ACTIONLINT_KIND_MAP: Record<string, {
  ruleId: string;
  severity: GhaSeverity;
  category: GhaCategory;
}> = {
  'syntax-check':   { ruleId: 'GA-L001', severity: 'error',   category: 'semantic' },
  'expression':     { ruleId: 'GA-L002', severity: 'error',   category: 'semantic' },
  'job-needs':      { ruleId: 'GA-L003', severity: 'error',   category: 'semantic' },
  'matrix':         { ruleId: 'GA-L004', severity: 'error',   category: 'semantic' },
  'events':         { ruleId: 'GA-L005', severity: 'error',   category: 'semantic' },
  'glob':           { ruleId: 'GA-L006', severity: 'warning', category: 'semantic' },
  'action':         { ruleId: 'GA-L007', severity: 'error',   category: 'semantic' },
  'runner-label':   { ruleId: 'GA-L008', severity: 'error',   category: 'semantic' },
  'shell-name':     { ruleId: 'GA-L009', severity: 'error',   category: 'semantic' },
  'id':             { ruleId: 'GA-L010', severity: 'error',   category: 'semantic' },
  'credentials':    { ruleId: 'GA-L011', severity: 'error',   category: 'security' },
  'env-var':        { ruleId: 'GA-L012', severity: 'warning', category: 'semantic' },
  'permissions':    { ruleId: 'GA-L013', severity: 'error',   category: 'security' },
  'workflow-call':  { ruleId: 'GA-L014', severity: 'error',   category: 'semantic' },
  'shellcheck':     { ruleId: 'GA-L017', severity: 'warning', category: 'actionlint' },
  'pyflakes':       { ruleId: 'GA-L018', severity: 'warning', category: 'actionlint' },
};

function mapActionlintError(err: ActionlintError): GhaUnifiedViolation {
  const mapping = ACTIONLINT_KIND_MAP[err.kind] ?? {
    ruleId: 'GA-L000',
    severity: 'warning' as GhaSeverity,
    category: 'actionlint' as GhaCategory,
  };
  return {
    ruleId: mapping.ruleId,
    message: err.message,
    line: err.line,
    column: err.column,
    severity: mapping.severity,
    category: mapping.category,
  };
}
```

### Anti-Patterns to Avoid
- **Awaiting Pass 2 before showing results:** The entire point of two-pass is instant Pass 1 feedback. Never block the UI on WASM readiness.
- **Deduplicating by ruleId:** Different passes use different rule IDs for the same issue. Deduplicate by `(line, column)` position, not by rule ID.
- **Coupling security rules to WASM state:** Security rules run in Pass 1 (synchronous, no WASM dependency). They must never check `ghaWasmReady`.
- **Running security rules inside the Worker:** Custom rules need the YAML AST (`Document` from `yaml` library) which is available on the main thread. The Worker only has raw YAML text.
- **Using `run:` string matching without YAML parsing:** The YAML parser handles multi-line `run: |` blocks correctly. Regex on raw text would miss these.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML AST traversal for jobs/steps | Custom YAML walker | `isMap`/`isPair`/`isScalar`/`isSeq` from `yaml` library | Library handles anchors, merge keys, multiline strings; custom walker misses edge cases |
| Script injection context list | Manually curated list | The exhaustive list from GitHub docs + actionlint source | 15+ dangerous contexts; easy to miss edge cases like `github.event.commits.*.author.email` |
| Action version parsing | Custom `uses:` parser | Regex with known patterns (org/repo@ref, docker://image, ./local) | `uses:` format has 3 variants with subtle differences |
| Line number resolution | Custom line counter | Existing `getNodeLine` + `resolveInstancePath` from `parser.ts` | Already proven in Phase 75; handles edge cases with missing ranges |
| Deduplication algorithm | Complex dedup with scoring | Simple `Set<string>` on `${line}:${column}` key | Over-engineering dedup creates maintenance burden; position-based is sufficient |

**Key insight:** 8 of 10 security rules have NO overlap with actionlint (SHA pinning, branch refs, missing permissions, pull_request_target, third-party SHA, dangerous scopes, self-hosted runners). Only script injection (SEC-05) and hardcoded credentials (SEC-07) have partial overlap. The dedup strategy is straightforward: Pass 1 wins at the same position.

## Common Pitfalls

### Pitfall 1: Actionlint Script Injection Overlap with GA-C005
**What goes wrong:** Both Pass 1 (GA-C005) and Pass 2 (actionlint `expression` kind) detect `${{ github.event.*.title }}` in `run:` blocks, producing duplicate warnings.
**Why it happens:** Script injection detection is one of the few areas where our custom rules overlap with actionlint's built-in checks.
**How to avoid:** The `(line, column)` dedup handles this automatically. Pass 1 findings (GA-C005) take precedence because they run first and are added to the `occupied` set. When Pass 2 returns the same position, it gets suppressed.
**Warning signs:** Users seeing the same injection warning twice with different rule IDs.

### Pitfall 2: YAML Multiline `run:` Block Parsing
**What goes wrong:** Security rules fail to detect script injection in multiline `run: |` blocks because they only check single-line `run:` values.
**Why it happens:** YAML block scalars (`|`, `>`) are parsed differently than flow scalars. The YAML library returns the full multiline content as a single string value.
**How to avoid:** When checking `run:` values, always get the full scalar value from the AST node (`isScalar(node) && String(node.value)`). This returns the complete multiline content regardless of YAML block style.
**Warning signs:** `run: |` blocks with injection patterns not being flagged.

### Pitfall 3: Action `uses:` Format Variants
**What goes wrong:** Security rules for SHA pinning (GA-C001, GA-C002, GA-C008) fail on edge cases like Docker actions (`docker://image:tag`) or local actions (`./path/to/action`).
**Why it happens:** `uses:` has three formats: `owner/repo@ref`, `docker://image`, and `./local-path`. SHA pinning only applies to the first format.
**How to avoid:** Skip `uses:` values that start with `docker://` or `./`. Only apply pinning rules to repository references containing `@`.
**Warning signs:** False positives on `docker://` or `./` actions.

### Pitfall 4: Missing Top-Level `permissions` vs Job-Level `permissions`
**What goes wrong:** GA-C004 flags "missing permissions" even when job-level permissions are set, or doesn't flag when only workflow-level permissions exist without job-level.
**Why it happens:** GitHub Actions supports `permissions` at both workflow level and job level, with job-level overriding workflow-level.
**How to avoid:** GA-C004 should only flag when there is NO `permissions` key at the workflow (top) level. Job-level permissions are a valid pattern and should not trigger this rule.
**Warning signs:** False positives on workflows with only job-level permissions.

### Pitfall 5: `permissions: write-all` vs Individual Write Permissions
**What goes wrong:** GA-C003 flags `permissions: write-all` but misses `permissions: {contents: write, actions: write, ...}` which is equally permissive.
**Why it happens:** `write-all` is a single shorthand string, but individual scope writes can achieve the same effect.
**How to avoid:** GA-C003 should specifically flag the `write-all` string value as required by the spec. Individual scope permissions are flagged by GA-C009 (dangerous combinations) instead. Keep the rules focused: C003 = `write-all` literal, C009 = dangerous combos.
**Warning signs:** Confusion about which rule flags which permission pattern.

### Pitfall 6: Two-Pass State Management Race Conditions
**What goes wrong:** Pass 2 results arrive and overwrite Pass 1 results instead of merging, or Pass 1 results flash briefly then disappear.
**Why it happens:** The nanostore atom is updated twice (once for Pass 1, once for merged). If the consumer reacts to the first update and then the second update replaces rather than merges, data loss occurs.
**How to avoid:** The engine's `mergePass2()` function takes Pass 1 violations as input and returns a new merged array. The store update pattern should be: `ghaViolations.set(pass1.violations)` immediately, then `ghaViolations.set(mergePass2(pass1.violations, pass2Errors).violations)` when Pass 2 completes. Never replace -- always merge.
**Warning signs:** Violations disappearing when WASM finishes loading.

### Pitfall 7: Hardcoded Secret Detection False Positives
**What goes wrong:** GA-C007 flags normal environment variable values, API endpoint URLs, or example strings as "hardcoded secrets."
**Why it happens:** Regex patterns for secrets (API keys, tokens) can match non-secret strings that happen to look like keys.
**How to avoid:** Use tight patterns: (1) known API key prefixes (e.g., `ghp_`, `AKIA`, `sk-`), (2) `password:` or `token:` keys with non-expression values, (3) skip values that are `${{ secrets.* }}` references. Keep severity as `warning`, not `error`, to acknowledge uncertainty.
**Warning signs:** Valid configuration values flagged as secrets.

## Code Examples

### AST Traversal Helper: forEachUsesNode
```typescript
// Shared helper for security rules that inspect `uses:` values
// Source: Adapted from compose-validator AST traversal patterns
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import type { GhaRuleContext } from '../../types';

/**
 * Iterate over all `uses:` values in the workflow.
 * Traverses: jobs -> [jobName] -> steps -> [n] -> uses
 *
 * Callback receives the string value and the AST node for line resolution.
 */
export function forEachUsesNode(
  ctx: GhaRuleContext,
  callback: (usesValue: string, node: any, jobName: string) => void,
): void {
  const jobsNode = resolveKey(ctx.doc.contents, 'jobs');
  if (!isMap(jobsNode)) return;

  for (const jobPair of jobsNode.items) {
    if (!isPair(jobPair) || !isScalar(jobPair.key)) continue;
    const jobName = String(jobPair.key.value);
    const stepsNode = resolveKey(jobPair.value, 'steps');
    if (!isSeq(stepsNode)) continue;

    for (const step of stepsNode.items) {
      if (!isMap(step)) continue;
      for (const stepPair of step.items) {
        if (!isPair(stepPair) || !isScalar(stepPair.key)) continue;
        if (String(stepPair.key.value) === 'uses' && isScalar(stepPair.value)) {
          callback(String(stepPair.value.value), stepPair.value, jobName);
        }
      }
    }
  }
}

/** Resolve a key from a Map node */
function resolveKey(node: any, key: string): any {
  if (!isMap(node)) return null;
  for (const pair of node.items) {
    if (isPair(pair) && isScalar(pair.key) && String(pair.key.value) === key) {
      return pair.value;
    }
  }
  return null;
}
```

### Script Injection Detection (GA-C005)
```typescript
// Source: GitHub docs script-injections + actionlint untrusted input list
const DANGEROUS_CONTEXTS = [
  'github.event.issue.title',
  'github.event.issue.body',
  'github.event.pull_request.title',
  'github.event.pull_request.body',
  'github.event.pull_request.head.ref',
  'github.event.pull_request.head.label',
  'github.event.pull_request.head.repo.default_branch',
  'github.event.comment.body',
  'github.event.review.body',
  'github.event.review_comment.body',
  'github.event.pages.*.page_name',
  'github.event.commits.*.message',
  'github.event.commits.*.author.email',
  'github.event.commits.*.author.name',
  'github.event.head_commit.message',
  'github.event.head_commit.author.email',
  'github.event.head_commit.author.name',
  'github.head_ref',
];

// Build regex from contexts (escape dots, handle wildcards)
const INJECTION_RE = new RegExp(
  '\\$\\{\\{\\s*(' +
  DANGEROUS_CONTEXTS
    .map(c => c.replace(/\./g, '\\.').replace(/\*/g, '\\w+'))
    .join('|') +
  ')\\s*\\}\\}',
  'g'
);

// Use in check(): scan all `run:` scalar values for matches
```

### Deduplication Function
```typescript
// Source: Project pattern (schema-validator.ts already deduplicates within Pass 1)
export function deduplicateViolations(
  pass1: GhaUnifiedViolation[],
  pass2: GhaUnifiedViolation[],
): GhaUnifiedViolation[] {
  const occupied = new Set<string>();
  const result: GhaUnifiedViolation[] = [];

  // Pass 1 takes precedence (added first)
  for (const v of pass1) {
    const key = `${v.line}:${v.column}`;
    if (!occupied.has(key)) {
      occupied.add(key);
      result.push(v);
    }
  }

  // Pass 2 fills gaps (only adds if position not occupied)
  for (const v of pass2) {
    const key = `${v.line}:${v.column}`;
    if (!occupied.has(key)) {
      occupied.add(key);
      result.push(v);
    }
  }

  return result.sort((a, b) => a.line - b.line || a.column - b.column);
}
```

### Hardcoded Secret Patterns (GA-C007)
```typescript
// Source: Common API key patterns from security linters
const SECRET_PATTERNS = [
  { re: /ghp_[A-Za-z0-9]{36}/, name: 'GitHub Personal Access Token' },
  { re: /github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}/, name: 'GitHub Fine-Grained PAT' },
  { re: /gho_[A-Za-z0-9]{36}/, name: 'GitHub OAuth Token' },
  { re: /ghs_[A-Za-z0-9]{36}/, name: 'GitHub App Token' },
  { re: /ghr_[A-Za-z0-9]{36}/, name: 'GitHub Refresh Token' },
  { re: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key ID' },
  { re: /sk-[A-Za-z0-9]{48}/, name: 'OpenAI API Key' },
  { re: /xoxb-[0-9]+-[0-9]+-[A-Za-z0-9]+/, name: 'Slack Bot Token' },
  { re: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/, name: 'SendGrid API Key' },
];

// Skip values that are secret references: ${{ secrets.* }}
const SECRETS_REF_RE = /^\$\{\{\s*secrets\./;
```

## Actionlint vs Custom Rule Overlap Matrix

This is the critical reference for understanding which rules deduplicate.

| Security Rule | Actionlint Kind | Overlap | Dedup Strategy |
|---------------|-----------------|---------|----------------|
| GA-C001 (unpinned semver tag) | None | No overlap | No dedup needed |
| GA-C002 (mutable branch ref) | None | No overlap | No dedup needed |
| GA-C003 (write-all permissions) | `permissions` (validates syntax, not policy) | Minimal | Different positions -- actionlint checks scope names, we check values |
| GA-C004 (missing permissions) | None | No overlap | No dedup needed |
| GA-C005 (script injection) | `expression` (same detection) | **Full overlap** | `(line, column)` dedup; Pass 1 GA-C005 wins |
| GA-C006 (pull_request_target) | None | No overlap | No dedup needed |
| GA-C007 (hardcoded secrets) | `credentials` (container passwords only) | Partial | Different scope -- actionlint only checks container config, we check all strings |
| GA-C008 (third-party no SHA) | None | No overlap | No dedup needed |
| GA-C009 (dangerous scopes) | None | No overlap | No dedup needed |
| GA-C010 (self-hosted runner) | None | No overlap | No dedup needed |

**Conclusion:** Only GA-C005 has significant overlap with actionlint. The `(line, column)` dedup strategy handles it cleanly. GA-C007 has partial overlap but at different positions (container `credentials` vs arbitrary string values).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-pass validation | Two-pass (sync+async) with progressive rendering | 2024+ | Immediate feedback while WASM loads; 95%+ of UX delivered by Pass 1 |
| Tag-based action pinning (@v4) | SHA-based pinning (full 40-char commit hash) | Post tj-actions attack (March 2025) | Industry consensus: SHA pinning is the only secure approach |
| Optional permissions block | Explicit permissions required | GitHub default change (Feb 2023) | New repos default to read-only; legacy repos still have write-all defaults |
| `pull_request` trigger | `pull_request_target` scrutinized | Shai Hulud v2 worm (Nov 2025) | Self-replicating worm exploited `pull_request_target`; restrictions now critical |

**Deprecated/outdated:**
- Tag-based action pinning (`@v4`): Considered insecure after supply chain attacks; SHA pinning is the standard
- `permissions: write-all`: Legacy default from pre-Feb 2023 repos; should always be explicit and minimal

## Open Questions

1. **Actionlint WASM `expression` kind line/column alignment with custom rule detection**
   - What we know: Both GA-C005 and actionlint's `expression` kind flag script injection, but they may report slightly different column numbers (actionlint reports the start of the `${{ }}` expression, our regex may report a different position within the `run:` value).
   - What's unclear: Whether `(line, column)` dedup is granular enough or if we need `(line)` only dedup for script injection overlap.
   - Recommendation: Start with `(line, column)` dedup. If testing reveals both findings at the same line but different columns, expand to `(line)` dedup for the `expression`/GA-C005 pair specifically. Build a test corpus (per Phase 76 concern) to empirically map overlap.

2. **Sample workflow with security errors for testing**
   - What we know: Phase 75 created `SAMPLE_GHA_WORKFLOW_BAD` with schema errors only. Phase 76 needs a sample with all 10 security violation categories.
   - What's unclear: Whether to extend the existing bad sample or create a separate security-focused sample.
   - Recommendation: Create a new `SAMPLE_GHA_WORKFLOW_SECURITY` constant with deliberate violations for all 10 security rules. Keep the existing schema-focused sample. The comprehensive sample with ALL error categories should be built in Phase 77 when all rules exist.

3. **GA-C009 dangerous scope combinations**
   - What we know: Certain permission combinations are dangerous (e.g., `contents: write` + `actions: write` allows modifying workflows that then run with write permissions).
   - What's unclear: The complete list of dangerous combinations. GitHub docs don't enumerate specific dangerous pairs.
   - Recommendation: Start with the most critical combinations: (1) `contents: write` + `actions: write` (can modify and trigger workflows), (2) `packages: write` + `contents: write` (supply chain risk), (3) `id-token: write` + any other write (OIDC token theft). Document as "opinionated" in the rule explanation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENGINE-01 | runPass1 returns sync results, mergePass2 accepts async results | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Wave 0 |
| ENGINE-02 | Dedup suppresses duplicate (line,col) findings from both passes | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Wave 0 |
| ENGINE-03 | Pass 1 results returned immediately (sync function returns) | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Wave 0 |
| ENGINE-04 | All violations have ruleId, message, line, column, severity, category | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Wave 0 |
| SEC-01 | GA-C001 flags unpinned semver tags on uses: | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-02 | GA-C002 flags mutable branch refs on uses: | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-03 | GA-C003 flags write-all permissions | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-04 | GA-C004 flags missing permissions block | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-05 | GA-C005 flags script injection in run: blocks | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-06 | GA-C006 flags pull_request_target without restrictions | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |
| SEC-07 | GA-C007 flags hardcoded secrets | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |
| SEC-08 | GA-C008 flags third-party actions without SHA pinning | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |
| SEC-09 | GA-C009 flags dangerous combined token scopes | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |
| SEC-10 | GA-C010 flags self-hosted runner usage | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/tools/gha-validator/__tests__/engine.test.ts` -- covers ENGINE-01 through ENGINE-04
- [ ] `src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts` -- covers SEC-01 through SEC-05
- [ ] `src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts` -- covers SEC-06 through SEC-10
- [ ] Test fixtures: workflow YAML strings with deliberate security violations for all 10 rules

## Sources

### Primary (HIGH confidence)
- actionlint checks documentation: https://github.com/rhysd/actionlint/blob/main/docs/checks.md -- 16 error kinds, script injection detection, credentials detection, permissions validation
- actionlint playground source: https://github.com/rhysd/actionlint/tree/main/playground -- WASM binary output format, error kind values
- GitHub official script injection docs: https://docs.github.com/en/actions/concepts/security/script-injections -- dangerous context expressions list
- GitHub secure use reference: https://docs.github.com/en/actions/reference/security/secure-use -- GITHUB_TOKEN permission hardening
- Phase 75 existing code: `types.ts`, `parser.ts`, `schema-validator.ts`, `worker-client.ts`, `ghaValidatorStore.ts` -- verified interfaces and types
- Compose-validator `engine.ts` pattern: `src/lib/tools/compose-validator/engine.ts` -- proven orchestration pattern
- K8s-analyzer `engine.ts` pattern: `src/lib/tools/k8s-analyzer/engine.ts` -- async engine pattern

### Secondary (MEDIUM confidence)
- GitHub blog on 4 tips for secure workflows: https://github.blog/security/supply-chain-security/four-tips-to-keep-your-github-actions-workflows-secure/ -- permission hardening, injection prevention
- GitGuardian GitHub Actions Security Cheat Sheet: https://blog.gitguardian.com/github-actions-security-cheat-sheet/ -- comprehensive security checklist
- Arctiq Top 10 GitHub Actions Security Pitfalls: https://arctiq.com/blog/top-10-github-actions-security-pitfalls-the-ultimate-guide-to-bulletproof-workflows -- real-world attack examples (tj-actions March 2025, Shai Hulud v2 November 2025)
- StepSecurity action pinning guide: https://www.stepsecurity.io/blog/pinning-github-actions-for-enhanced-security-a-complete-guide -- SHA pinning rationale

### Tertiary (LOW confidence)
- Dangerous GITHUB_TOKEN scope combinations (GA-C009): No authoritative list exists; based on security analysis of what combinations enable escalation. Marked as "opinionated" in rule explanation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; all libraries from Phase 75
- Architecture: HIGH -- engine.ts pattern proven across compose-validator and k8s-analyzer; two-pass is a natural extension
- Security rules: HIGH -- 8 of 10 rules are straightforward AST/regex checks with no actionlint overlap; detection patterns well-documented
- Deduplication: MEDIUM -- (line,column) strategy is sound but empirical testing needed for script injection column alignment
- Pitfalls: HIGH -- verified against official docs and real-world attack case studies

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days -- stable domain, security rules based on GitHub's event model which changes slowly)
