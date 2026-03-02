# Architecture Research

**Domain:** Dockerfile Analyzer -- Rule Expansion (PG011, PG012)
**Researched:** 2026-03-02
**Confidence:** HIGH

## System Overview

The existing Dockerfile Analyzer follows a clean plugin-style architecture where each lint rule is a self-contained TypeScript module. Adding new rules requires exactly three touchpoints: create the rule file, register it in the index, and verify the dynamic documentation route picks it up.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Rule Layer (one file per rule)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ DL3002   │  │ PG007    │  │ PG011    │  │ PG012    │  ...       │
│  │ no-root  │  │ uid/gid  │  │ NEW      │  │ NEW      │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │              │                │
├───────┴──────────────┴──────────────┴──────────────┴────────────────┤
│                   Registry (rules/index.ts)                         │
│  allRules[], getRuleById(), getRuleSeverity(), getRuleCategory()    │
├─────────────────────────────────────────────────────────────────────┤
│            Engine (engine.ts) + Scorer (scorer.ts)                  │
│  runRuleEngine() iterates allRules → collects violations → scores  │
├─────────────────────────────────────────────────────────────────────┤
│                    Documentation Layer                               │
│  [code].astro dynamic route → getStaticPaths() reads allRules      │
│  related.ts → getRelatedRules() groups by category                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Integration Impact for PG011/PG012 |
|-----------|----------------|-------------------------------------|
| Rule file (e.g. `PG011-*.ts`) | Implements `LintRule` interface: metadata + `check()` function | **NEW FILE** -- primary work |
| `rules/index.ts` | Flat registry of all rules, lookup helpers | **MODIFY** -- add 2 imports + 2 array entries |
| `rules/related.ts` | Groups same-category rules for cross-linking | **NO CHANGE** -- uses `allRules` dynamically |
| `engine.ts` | Iterates `allRules`, calls `check()`, sorts violations | **NO CHANGE** -- reads `allRules` from index |
| `scorer.ts` | Weighted scoring with diminishing returns per category | **NO CHANGE** -- reads `allRules` from index |
| `parser.ts` | Wraps `dockerfile-ast` into `ParseResult` | **NO CHANGE** -- rules use AST directly |
| `types.ts` | `LintRule`, `RuleViolation`, `RuleCategory`, etc. | **NO CHANGE** -- existing types sufficient |
| `[code].astro` | Dynamic route generating docs per rule | **NO CHANGE** -- `getStaticPaths()` reads `allRules` |
| `sample-dockerfile.ts` | Default sample shown in the analyzer UI | **NO CHANGE** -- see rationale below |

## Files: New vs Modified

### Files to CREATE (2)

```
src/lib/tools/dockerfile-analyzer/rules/
├── security/
│   └── PG011-missing-user-directive.ts    # NEW -- missing USER directive
└── efficiency/
    └── PG012-node-pointer-compression.ts  # NEW -- Node.js pointer compression
```

### Files to MODIFY (1)

```
src/lib/tools/dockerfile-analyzer/rules/index.ts   # Add imports + array entries
```

### Files that AUTO-ADAPT (no changes needed) (4)

```
src/lib/tools/dockerfile-analyzer/engine.ts         # Reads allRules dynamically
src/lib/tools/dockerfile-analyzer/scorer.ts         # Reads allRules dynamically
src/lib/tools/dockerfile-analyzer/rules/related.ts  # Reads allRules dynamically
src/pages/tools/dockerfile-analyzer/rules/[code].astro  # getStaticPaths() reads allRules
```

### Files NOT modified (1)

```
src/lib/tools/dockerfile-analyzer/sample-dockerfile.ts  # See rationale below
```

**Sample Dockerfile rationale:** The current sample uses `FROM ubuntu:latest` and ends with `USER root`. PG011 only fires when there is NO `USER` directive at all (DL3002 handles `USER root`). PG012 only fires for `node:` images. Since the sample already triggers many existing rules and cannot trigger both new rules without a confusing rewrite, leave it unchanged. Users will see PG011/PG012 when they analyze their own Dockerfiles.

## Architectural Patterns

### Pattern 1: Self-Contained Rule Module

**What:** Each rule is a single exported `const` implementing `LintRule`. It owns its metadata (id, title, severity, category, explanation, fix examples) and its detection logic (`check()` function).

**When to use:** Every new rule follows this pattern. No exceptions.

**Trade-offs:** Maximizes isolation (one rule cannot break another) at the cost of some duilerplate structure.

**Example -- PG011 skeleton:**
```typescript
import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG011: LintRule = {
  id: 'PG011',
  title: 'Add a USER directive to avoid running as root',
  severity: 'warning',
  category: 'security',
  explanation: '...',
  fix: {
    description: '...',
    beforeCode: '...',
    afterCode: '...',
  },
  check(dockerfile: Dockerfile, rawText: string): RuleViolation[] {
    const violations: RuleViolation[] = [];
    // Detection logic here
    return violations;
  },
};
```

### Pattern 2: Final-Stage Scoping

**What:** Many rules scope detection to the final build stage by finding the last `FROM` instruction and only inspecting instructions after it. This avoids false positives in builder stages.

**When to use:** Both PG011 and PG012 need this. A missing `USER` in a builder stage is irrelevant. Pointer compression advice only matters for the runtime stage.

**Trade-offs:** Slightly more complex `check()` logic, but critical for multi-stage Dockerfile accuracy.

**Example -- final stage detection (used by DL3002, PG007, PG008, PG010):**
```typescript
const froms = dockerfile.getFROMs();
if (froms.length === 0) return violations;

const lastFrom = froms.at(-1);
if (!lastFrom) return violations;
const lastFromLine = lastFrom.getRange().start.line;

// Filter instructions to only those in the final stage
const finalStageInstructions = dockerfile.getInstructions().filter(
  (inst) => inst.getRange().start.line > lastFromLine,
);
```

### Pattern 3: Registry-Driven Auto-Discovery

**What:** The `allRules` array in `rules/index.ts` is the single source of truth. Every downstream consumer (engine, scorer, related rules, documentation pages) reads from this array. Adding a rule to the array instantly makes it available everywhere.

**When to use:** Always -- this is the integration mechanism.

**Trade-offs:** Manual import/registration required (no filesystem auto-discovery), but this is intentional: it keeps the dependency graph explicit and tree-shakeable.

## Data Flow

### Rule Execution Flow

```
User pastes Dockerfile
    |
    v
DockerfileParser.parse(rawText) --> Dockerfile AST
    |
    v
runRuleEngine(ast, rawText)
    |
    v
for each rule in allRules:          <-- PG011, PG012 join here
    rule.check(ast, rawText)
    |
    v
    RuleViolation[]
    |
    v
Sort violations by line/column
    |
    v
computeScore(violations)
    |
    +-> Category-weighted scoring (security=30%, efficiency=25%, ...)
    +-> Diminishing returns per category
    |
    v
AnalysisResult { violations, score }
    |
    v
UI renders violations + score
```

### Documentation Route Flow

```
Astro build (getStaticPaths)
    |
    v
allRules.map(rule => ({ params: { code: rule.id.toLowerCase() } }))
    |                                           |
    v                                           v
/tools/dockerfile-analyzer/rules/pg011/    /tools/dockerfile-analyzer/rules/pg012/
    |
    v
getRelatedRules(rule.id) --> same-category rules for cross-linking
```

## Detailed Integration Plan

### PG011: Missing USER Directive

**Category:** `security` (same as DL3002, PG007)
**Severity:** `warning`
**File:** `src/lib/tools/dockerfile-analyzer/rules/security/PG011-missing-user-directive.ts`

**Relationship to existing rules:**
- **DL3002** flags `USER root` as the last USER instruction. It explicitly does NOT flag missing USER (see DL3002 line 40-42: "No USER instruction in final stage -- do NOT flag (DL3002 only flags explicit USER root)").
- **PG007** flags `useradd`/`groupadd` without explicit UID/GID.
- **PG011** fills the gap: it flags Dockerfiles that have NO `USER` directive at all in the final stage.

**Detection logic outline:**
1. Find the final build stage (last `FROM`).
2. Scan for any `USER` instruction after the last `FROM`.
3. If no `USER` instruction exists, flag on the last `FROM` instruction (or the last `CMD`/`ENTRYPOINT`).
4. Edge cases to handle:
   - Multi-stage builds: only check the final stage.
   - `FROM scratch` should not trigger this rule (no shell, no user table).
   - Base images that include built-in non-root users (e.g., some `node` image variants) cannot be detected via static analysis. Flag anyway with an appropriately worded message.

**Scoring impact:** Security category (weight 30%). A `warning` severity deducts 8 base points from the security category score. This is appropriate -- missing USER is a significant security concern per CIS Docker Benchmark 4.1.

### PG012: Node.js Pointer Compression

**Category:** `efficiency`
**Severity:** `info`
**File:** `src/lib/tools/dockerfile-analyzer/rules/efficiency/PG012-node-pointer-compression.ts`

**Detection logic outline:**
1. Find the final build stage (last `FROM`).
2. Check if the base image is Node.js-based by inspecting the FROM instruction's image name for `node:` references.
3. If Node.js detected, check whether pointer compression or memory tuning is addressed:
   - Look for `FROM platformatic/node-caged` (pre-compiled with pointer compression).
   - Look for `ENV NODE_OPTIONS` containing `--max-old-space-size`.
4. If none found, emit an informational suggestion about pointer compression and memory tuning.

**Key technical context:**
- Pointer compression is a V8 compile-time flag (`--experimental-enable-pointer-compression`), not a runtime flag. Official Node.js builds do not include it yet.
- The practical advice is: consider `platformatic/node-caged` images for ~50% memory reduction, OR explicitly set `ENV NODE_OPTIONS="--max-old-space-size=..."` to control heap sizing within container memory limits.
- This is `info` severity because it is a performance recommendation, not a correctness issue.

**Scoring impact:** Efficiency category (weight 25%). An `info` severity deducts only 3 base points. Minimal impact on overall score.

### index.ts Modifications

**Exact changes needed:**

```typescript
// Add to security imports section (after PG010 import):
import { PG011 } from './security/PG011-missing-user-directive';

// Add to efficiency imports section (after DL3019 import):
import { PG012 } from './efficiency/PG012-node-pointer-compression';

// Add to allRules array -- security section (after PG010):
  PG010,
  PG011,      // <-- NEW

// Add to allRules array -- efficiency section (after DL3019):
  DL3019,
  PG012,      // <-- NEW

// Update comment counts:
// Security rules (14) --> Security rules (15)
// Efficiency rules (8) --> Efficiency rules (9)
```

## Anti-Patterns

### Anti-Pattern 1: Overlapping Detection with DL3002

**What people do:** Have PG011 also flag `USER root` as "missing proper user."
**Why it's wrong:** DL3002 already covers `USER root`. Double-flagging the same issue inflates the violation count and confuses users.
**Do this instead:** PG011 must ONLY fire when there is NO `USER` directive in the final stage. If any `USER` directive exists (even `USER root`), PG011 stays silent and lets DL3002 handle it. The DL3002 source code explicitly documents this boundary at line 40-42.

### Anti-Pattern 2: Over-Broad Node.js Detection for PG012

**What people do:** Try to detect Node.js usage by scanning `RUN npm install` or `CMD ["node", ...]` in any stage.
**Why it's wrong:** Builder stages commonly use Node.js for building but ship a different runtime (e.g., nginx for SPAs). Flagging builder stages creates noise.
**Do this instead:** Only check the FROM instruction of the final stage for `node:` image references. This is the authoritative signal that Node.js is the runtime.

### Anti-Pattern 3: Hardcoding Rule IDs in Related Rules

**What people do:** Manually wire PG011 as related to DL3002 in `related.ts`.
**Why it's wrong:** The `getRelatedRules()` function already groups by category automatically. Since PG011 is in the `security` category, it will automatically appear as a related rule on DL3002, DL3007, PG001, etc.
**Do this instead:** Trust the existing category-based grouping. No changes to `related.ts` needed.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Rule file --> types.ts | Implements `LintRule` interface | Types are stable; no changes needed |
| Rule file --> index.ts | Import + array registration | Only manual step for integration |
| index.ts --> engine.ts | `allRules` array consumed | Automatic via import |
| index.ts --> scorer.ts | `allRules` array consumed (for rule lookup) | Automatic via import |
| index.ts --> related.ts | `allRules` array consumed (for category grouping) | Automatic via import |
| index.ts --> [code].astro | `allRules` array consumed (for static path generation) | Automatic via import |

### dockerfile-ast API Used by Rules

| API Method | Used By Existing Rules | PG011 Needs | PG012 Needs |
|------------|------------------------|-------------|-------------|
| `dockerfile.getFROMs()` | DL3002, PG008, PG010 | YES (final stage detection) | YES (image name detection) |
| `dockerfile.getInstructions()` | DL3002, PG007, PG008 | YES (scan for USER) | YES (scan for ENV) |
| `inst.getKeyword()` | All rules | YES (filter USER instructions) | YES (filter FROM, ENV) |
| `inst.getArgumentsContent()` | All rules | YES (read user name) | YES (read image name, env values) |
| `inst.getRange()` | All rules | YES (line reporting) | YES (line reporting) |

## Build Order

Both rules can be built in parallel since they are independent. The recommended sequence accounts for review efficiency and dependency validation:

### Phase 1: PG011 -- Missing USER Directive (build first)

**Rationale:** PG011 is a straightforward security rule with well-established prior art (CIS Docker Benchmark 4.1). The detection logic is simple (absence check), but the relationship to DL3002 must be carefully validated. Building this first establishes that the DL3002 boundary is respected.

**Files touched:**
1. CREATE `src/lib/tools/dockerfile-analyzer/rules/security/PG011-missing-user-directive.ts`
2. MODIFY `src/lib/tools/dockerfile-analyzer/rules/index.ts` (add PG011 import + entry)

**Verification:**
- Dockerfile with NO `USER` directive: PG011 should fire.
- Dockerfile with `USER root`: only DL3002 should fire, NOT PG011.
- Dockerfile with `USER node`: neither PG011 nor DL3002 should fire.
- Dockerfile with `FROM scratch` and no USER: PG011 should NOT fire.

### Phase 2: PG012 -- Node.js Pointer Compression (build second)

**Rationale:** PG012 is more nuanced -- it requires Node.js image detection and knowledge of a cutting-edge optimization. Building it second allows full focus on the detection heuristics.

**Files touched:**
1. CREATE `src/lib/tools/dockerfile-analyzer/rules/efficiency/PG012-node-pointer-compression.ts`
2. MODIFY `src/lib/tools/dockerfile-analyzer/rules/index.ts` (add PG012 import + entry)

**Verification:**
- `FROM node:22` Dockerfile without `ENV NODE_OPTIONS`: PG012 should fire.
- `FROM python:3.12` Dockerfile: PG012 should NOT fire.
- `FROM platformatic/node-caged:25`: PG012 should NOT fire.
- `FROM node:22` with `ENV NODE_OPTIONS="--max-old-space-size=1536"`: PG012 should NOT fire.

### Phase 3: Verify Downstream (both rules together)

1. Confirm `getRelatedRules('PG011')` returns other security rules (DL3002, PG007, etc.).
2. Confirm `getRelatedRules('PG012')` returns other efficiency rules (DL3059, DL3009, etc.).
3. Confirm documentation pages generate at `/tools/dockerfile-analyzer/rules/pg011/` and `/tools/dockerfile-analyzer/rules/pg012/`.
4. Confirm scoring: PG011 deducts from security (30% weight), PG012 from efficiency (25% weight).
5. Confirm total rule count updates: security 14->15, efficiency 8->9, overall 44->46.

## Sources

- CIS Docker Benchmark V1.6.0, Section 4.1: [Powerpipe Hub](https://hub.powerpipe.io/mods/turbot/steampipe-mod-docker-compliance/benchmarks/control.cis_v160_4_1)
- Node.js TSC Discussion on Pointer Compression: [nodejs/TSC#790](https://github.com/nodejs/TSC/issues/790)
- Platformatic node-caged (pointer compression Docker images): [GitHub](https://github.com/platformatic/node-caged)
- "Halving Node.js Memory Usage" (Platformatic blog): [blog.platformatic.dev](https://blog.platformatic.dev/we-cut-nodejs-memory-in-half)
- Node.js 20 Memory Management in Containers: [Red Hat Developer](https://developers.redhat.com/articles/2025/10/10/nodejs-20-memory-management-containers)
- DL3002 source (explicit boundary comment at line 40-42): `src/lib/tools/dockerfile-analyzer/rules/security/DL3002-no-root-user.ts`
- Existing codebase: all files in `src/lib/tools/dockerfile-analyzer/` reviewed directly

---
*Architecture research for: Dockerfile Analyzer rule expansion (PG011, PG012)*
*Researched: 2026-03-02*
