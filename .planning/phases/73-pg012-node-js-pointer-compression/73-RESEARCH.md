# Phase 73: PG012 Node.js Pointer Compression - Research

**Researched:** 2026-03-02
**Domain:** Dockerfile lint rule authoring -- efficiency rule suggesting platformatic/node-caged for Node.js base images
**Confidence:** HIGH

## Summary

Phase 73 adds a single new efficiency rule (PG012) to the existing Dockerfile Analyzer that suggests replacing official Node.js Docker images with `platformatic/node-caged` for V8 pointer compression, which can reduce memory usage by approximately 50%. This is an `info`-level efficiency suggestion -- not a warning or error -- because pointer compression is an optimization opportunity rather than a correctness or security issue. The rule fires only on official Docker Hub Node.js images in the final build stage, and never on non-Node images, custom registry node images, or build stage aliases.

The critical technical challenge is accurate image name matching. The `dockerfile-ast` library provides `getImageName()` and `getRegistry()` methods that parse FROM instructions differently depending on whether a registry hostname is present. For `FROM node:22`, `getImageName()` returns `'node'` and `getRegistry()` returns `null`. For `FROM myregistry.io/node:22`, `getImageName()` returns `'node'` but `getRegistry()` returns `'myregistry.io'`. The rule must check BOTH methods to avoid false positives on custom registries. Additional edge cases include `library/node` (Docker Hub's explicit namespace), `docker.io/library/node` (canonical registry URL), and build stage alias references (which must be skipped).

The implementation requires exactly 2 files: 1 new rule file and 1 modification to the rule registry. Four additional files (engine.ts, scorer.ts, related.ts, [code].astro) auto-adapt with no changes. Zero new dependencies are needed. The explanation text must reference the Node 25+ version requirement (pointer compression requires IsolateGroups, available from Node 25.x built with `--experimental-enable-pointer-compression`), the approximately 50% memory benefit for pointer-heavy workloads, and the 4GB-per-isolate heap limitation.

**Primary recommendation:** Create `PG012-node-caged-pointer-compression.ts` in the efficiency rules directory following the exact same self-contained module pattern as DL3059 and PG011. Register it in `rules/index.ts`. The image name matching logic is the single most important correctness concern -- use `getImageName()` combined with `getRegistry()` to match only official Docker Hub node images.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RULES-04 | PG012 efficiency rule suggests platformatic/node-caged for Node.js base images | Detection logic uses `dockerfile.getFROMs()` to find the last FROM, checks `getImageName()` against a set of official node image names (`node`), and verifies no custom registry via `getRegistry()`. Fires info-level efficiency suggestion with message referencing `platformatic/node-caged`. Pattern proven by DL3006, PG006, PG011. |
| RULES-05 | PG012 matches official node images correctly (not substrings or custom namespaces) | Uses exact string match against `getImageName()` (not regex substring). Checks `getRegistry()` is `null` or `'docker.io'` to exclude custom registries like `myregistry.io/node`. Also handles `library/node` namespace. Build stage aliases are excluded using the same `getBuildStage()` pattern from DL3006. |
| RULES-06 | PG012 explanation includes Node 25+ version requirement and ~50% memory benefit | Explanation text documents: (1) V8 pointer compression shrinks pointers from 64-bit to 32-bit, (2) ~50% memory reduction for pointer-heavy workloads, (3) requires Node 25+ built with IsolateGroups, (4) 4GB per-isolate heap limit, (5) N-API addons compatible but older V8 native addons may not work. |
| DOCS-02 | PG012 rule page includes expert explanation, fix with before/after code, and related rules | The `[code].astro` dynamic route auto-generates documentation from rule metadata (`explanation`, `fix.description`, `fix.beforeCode`, `fix.afterCode`). `getRelatedRules()` auto-groups same-category (efficiency) rules. No template changes needed. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- NO new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `dockerfile-ast` | ^0.7.1 | Parse Dockerfile into typed AST with `getFROMs()`, `getImageName()`, `getRegistry()`, `getBuildStage()`, `getRange()` | Already installed, browser-safe, used by all 45 existing rules |
| TypeScript (via Astro) | 5.x | Type-safe rule implementation via existing `LintRule` interface | Project standard |
| Astro | 5.17.1 | `[code].astro` auto-generates rule documentation pages via `getStaticPaths()` | Project framework -- no changes needed |

### No New Dependencies Required
This phase is a single TypeScript file plus a registry modification. No new npm packages are needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Exact string match for image names | Regex pattern matching | Exact match is simpler, harder to get wrong; regex introduces risk of substring matches (e.g., `nodeconfig`) |
| info severity | warning severity | Info is correct for optimization suggestions; warning would over-penalize since the existing image works fine |
| Final-stage-only check | All-stage check | Only the final stage matters for runtime; builder stages are ephemeral and pointer compression irrelevant there |

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/dockerfile-analyzer/rules/
  efficiency/
    DL3059-consolidate-runs.ts        # Existing
    PG012-node-caged-pointer-compression.ts  # NEW
  index.ts                             # MODIFY -- add import + array entry
```

### Pattern 1: Self-Contained Rule Module
**What:** Each rule is a single exported `const` implementing `LintRule`. Metadata (id, title, severity, category, explanation, fix) and detection logic (`check()`) live in one file.
**When to use:** Every new rule. No exceptions in this codebase.
**Example:**
```typescript
// Source: existing pattern from DL3059, PG006, PG011
import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const PG012: LintRule = {
  id: 'PG012',
  title: 'Consider pointer compression for Node.js images',
  severity: 'info',
  category: 'efficiency',
  explanation: '...',
  fix: {
    description: '...',
    beforeCode: '...',
    afterCode: '...',
  },
  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    // Detection logic here
    return violations;
  },
};
```

### Pattern 2: Official Node Image Detection
**What:** Identify official Docker Hub Node.js images by combining `getImageName()` and `getRegistry()`. Only match images where the name is exactly `'node'` (or `'library/node'`) AND the registry is either `null` (implicit Docker Hub) or `'docker.io'` (explicit Docker Hub).
**When to use:** PG012 needs this to avoid false positives on custom registries.
**Example:**
```typescript
// Source: dockerfile-ast From class methods, verified from source code
const imageName = from.getImageName();  // 'node' for `FROM node:22`
const registry = from.getRegistry();     // null for Docker Hub, 'myregistry.io' for custom

// Official Docker Hub node images only
const isOfficialNode =
  (imageName === 'node' || imageName === 'library/node') &&
  (registry === null || registry === 'docker.io');
```

**Key behaviors verified from `dockerfile-ast` source:**
| FROM instruction | `getImageName()` | `getRegistry()` | Should match? |
|---|---|---|---|
| `FROM node:22` | `'node'` | `null` | YES |
| `FROM node:22-alpine` | `'node'` | `null` | YES |
| `FROM library/node:22` | `'library/node'` | `null` | YES |
| `FROM docker.io/library/node:22` | `'library/node'` | `'docker.io'` | YES |
| `FROM myregistry.io/node:22` | `'node'` | `'myregistry.io'` | NO |
| `FROM ghcr.io/myorg/node:22` | `'myorg/node'` | `'ghcr.io'` | NO |
| `FROM python:3.12` | `'python'` | `null` | NO |
| `FROM ubuntu:24.04` | `'ubuntu'` | `null` | NO |
| `FROM nodeconfig:latest` | `'nodeconfig'` | `null` | NO |
| `FROM scratch` | `'scratch'` | `null` | NO |

### Pattern 3: Final-Stage Scoping (Only Check Final Stage)
**What:** Find the last `FROM` instruction and only check that one. Builder stages are ephemeral and pointer compression is irrelevant there.
**When to use:** PG012 should only fire on the final stage image.
**Example:**
```typescript
// Source: DL3002, PG008, PG011 -- final-stage scoping pattern
const froms = dockerfile.getFROMs();
if (froms.length === 0) return violations;

const lastFrom = froms.at(-1);
if (!lastFrom) return violations;
```

### Pattern 4: Build Stage Alias Exclusion
**What:** Skip FROM instructions that reference a prior build stage alias rather than an actual image.
**When to use:** When `FROM builder` references a prior `FROM node:22 AS builder`, the final stage's image is not actually `builder` but whatever `builder` was based on. However, PG012 should NOT fire on stage alias references because the user is not directly choosing the base image in that FROM line.
**Example:**
```typescript
// Source: DL3006 (lines 24-31), PG006 (lines 27-33)
const stageAliases = new Set<string>();
for (const from of froms) {
  const stage = from.getBuildStage();
  if (stage) stageAliases.add(stage.toLowerCase());
}

const imageName = lastFrom.getImageName();
if (imageName && stageAliases.has(imageName.toLowerCase())) return violations;
```

### Pattern 5: Registry-Driven Auto-Discovery
**What:** Add import + array entry to `rules/index.ts`. Engine, scorer, related rules, and documentation pages all consume `allRules` dynamically.
**When to use:** Required for every new rule. This is the single integration point.
**Example:**
```typescript
// Source: rules/index.ts -- exact changes needed
// Add to efficiency imports (after DL3019 import, line 28):
import { PG012 } from './efficiency/PG012-node-caged-pointer-compression';

// Add to allRules array -- efficiency section (after DL3019, line 84):
  DL3019,
  PG012,

// Update comment: "Efficiency rules (8)" --> "Efficiency rules (9)"
```

### Anti-Patterns to Avoid
- **Substring matching on image name:** `imageName?.includes('node')` would match `nodeconfig`, `nodejs-custom`, etc. Use exact equality.
- **Ignoring the registry:** Checking only `getImageName() === 'node'` would false-positive on `myregistry.io/node:22` where `getImageName()` also returns `'node'`. Always check `getRegistry()` too.
- **Flagging builder stages:** Only the final stage matters. If `FROM node:22 AS builder` is a non-final stage, PG012 should not fire on it.
- **Using warning/error severity:** This is an optimization suggestion, not a problem. `info` severity is correct. The existing node image works perfectly fine.
- **Mentioning pointer compression is the default:** It is NOT enabled in official Node.js builds. node-caged is a separate custom-built image. The explanation must be clear that this requires a different base image.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dockerfile parsing | Custom regex parser | `dockerfile-ast` (already installed) | Multi-stage builds, ARG substitution, line continuations -- all handled |
| Image name extraction | Custom FROM line parsing | `from.getImageName()` and `from.getRegistry()` | Handles edge cases: digests, tags, registries, ports, escapes |
| Related rules grouping | Manual cross-references | `getRelatedRules()` from `related.ts` | Auto-groups same-category (efficiency) rules by severity |
| Documentation page | Custom Astro page for PG012 | Existing `[code].astro` dynamic route | `getStaticPaths()` reads `allRules` and auto-generates the page |
| Scoring integration | Custom score adjustment | Existing `scorer.ts` | Auto-reads `allRules`; info severity = 3 base points deduction from efficiency category (25% weight) |

**Key insight:** The plugin architecture means 4 out of 6 downstream consumers auto-adapt with zero code changes. The only manual work is the rule file itself and the registry entry.

## Common Pitfalls

### Pitfall 1: False Positive on Custom Registry Node Images
**What goes wrong:** PG012 fires on `FROM myregistry.io/node:22`, which is a custom/private Node image where the user may not want or be able to switch to platformatic/node-caged.
**Why it happens:** Developer only checks `getImageName() === 'node'` without verifying the registry. For `myregistry.io/node:22`, `getImageName()` returns `'node'` because the library strips the registry prefix.
**How to avoid:** Always check `getRegistry()` is either `null` (implicit Docker Hub) or `'docker.io'` (explicit Docker Hub). Any other registry value means it is not an official image.
**Warning signs:** Custom registry node images trigger PG012.

### Pitfall 2: Substring Match False Positives
**What goes wrong:** PG012 fires on `FROM nodeconfig:latest` or `FROM nodejs-slim:22`.
**Why it happens:** Developer uses `imageName?.startsWith('node')` or `imageName?.includes('node')` instead of exact equality.
**How to avoid:** Use strict equality: `imageName === 'node' || imageName === 'library/node'`. No partial matches, no startsWith, no regex.
**Warning signs:** Non-Node images with "node" in their name trigger PG012.

### Pitfall 3: Severity Calibration
**What goes wrong:** PG012 is set to `warning` or `error`, causing excessive score deductions for using an official, perfectly valid Node image.
**Why it happens:** Developer treats an optimization suggestion as a problem.
**How to avoid:** Use `info` severity. The success criteria explicitly says "info-level efficiency suggestion". Info = 3 base point deduction (vs warning = 8, error = 15).
**Warning signs:** Score drops significantly just for using `FROM node:22`.

### Pitfall 4: Wrong Line Number for Violation
**What goes wrong:** Violation points to line 0 or an incorrect line.
**Why it happens:** `dockerfile-ast` uses 0-based line numbers but `RuleViolation.line` is 1-based.
**How to avoid:** Always add 1 to `range.start.line`. Flag on the final-stage FROM instruction line.
**Warning signs:** Violations appear at wrong lines in the results panel.

### Pitfall 5: Inaccurate Technical Claims in Explanation
**What goes wrong:** Explanation says pointer compression is "available in Node.js 22" or "enabled by default" or "no limitations".
**Why it happens:** Confusing node-caged (custom build) with official Node.js releases.
**How to avoid:** Be precise: (1) Pointer compression is NOT in official Node.js builds. (2) It requires Node 25+ built with `--experimental-enable-pointer-compression` (which is what node-caged provides). (3) 4GB per-isolate heap limit. (4) N-API addons work but older V8 native addons may segfault.
**Warning signs:** Users report misleading information in the rule documentation.

### Pitfall 6: Flagging on Builder Stage FROM Lines
**What goes wrong:** A multi-stage Dockerfile like `FROM node:22 AS builder ... FROM python:3.12` triggers PG012 on the builder stage.
**Why it happens:** Developer checks all FROM instructions instead of only the final one.
**How to avoid:** Only check `froms.at(-1)` -- the last FROM instruction. If a user has a multi-stage build with node in a builder stage, it is irrelevant for runtime memory.
**Warning signs:** Multi-stage builds where node is only a builder stage trigger PG012.

## Code Examples

Verified patterns from the existing codebase and official sources:

### PG012 Detection Logic (Complete Implementation Pattern)
```typescript
// Source: Pattern synthesized from DL3006, PG006, PG011, and dockerfile-ast source
check(dockerfile: Dockerfile): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const froms = dockerfile.getFROMs();

  if (froms.length === 0) return violations;

  // Collect all build stage aliases
  const stageAliases = new Set<string>();
  for (const from of froms) {
    const stage = from.getBuildStage();
    if (stage) stageAliases.add(stage.toLowerCase());
  }

  // Only check the final stage
  const lastFrom = froms.at(-1);
  if (!lastFrom) return violations;

  const imageName = lastFrom.getImageName();
  if (!imageName) return violations;

  // Skip build stage alias references
  if (stageAliases.has(imageName.toLowerCase())) return violations;

  // Skip scratch
  if (imageName === 'scratch') return violations;

  // Check if this is an official Docker Hub node image
  const registry = lastFrom.getRegistry();
  const isDockerHub = registry === null || registry === 'docker.io';
  const isNodeImage = imageName === 'node' || imageName === 'library/node';

  if (!isDockerHub || !isNodeImage) return violations;

  // Official node image in final stage -- suggest pointer compression
  const range = lastFrom.getRange();
  violations.push({
    ruleId: this.id,
    line: range.start.line + 1,
    column: 1,
    message:
      'Consider using platformatic/node-caged for V8 pointer compression. ' +
      'Node.js 25+ with pointer compression can reduce memory usage by ~50%.',
  });

  return violations;
}
```

### Expert Explanation Template
```typescript
// Source: Research from platformatic blog, GitHub repo, and V8 docs
explanation:
  'V8 pointer compression shrinks every internal pointer from 64 bits to 32 bits. Since ' +
  'tagged values (mostly pointers) make up roughly 70% of all heap memory, this single ' +
  'change can reduce memory usage by approximately 50% for pointer-heavy Node.js workloads ' +
  '-- with no code changes required. The platformatic/node-caged Docker image ships Node.js ' +
  'built with the --experimental-enable-pointer-compression flag enabled, making pointer ' +
  'compression available as a one-line Dockerfile swap. This optimization requires Node.js ' +
  '25 or later (which includes the V8 IsolateGroups feature that removes the old process-wide ' +
  '4GB heap limit). Each V8 isolate (main thread or worker) is still limited to 4GB of ' +
  'compressed heap, but native allocations and Buffers do not count against this limit. ' +
  'N-API addons are compatible; however, addons using the older V8 native addon API may not ' +
  'work. Production benchmarks on AWS EKS show 50% memory reduction with only 2-4% average ' +
  'latency overhead and a 7% improvement in P99 latency.',
```

### Before/After Fix Code
```typescript
// Source: platformatic/node-caged Docker Hub
fix: {
  description:
    'Replace the official Node.js base image with platformatic/node-caged, which ships ' +
    'Node.js 25+ built with V8 pointer compression enabled. This is a drop-in replacement ' +
    'for most workloads. Verify your application does not require more than 4GB of heap per ' +
    'isolate and does not rely on non-N-API native addons.',
  beforeCode:
    'FROM node:22-bookworm-slim\n' +
    'WORKDIR /app\n' +
    'COPY . .\n' +
    'CMD ["node", "server.js"]',
  afterCode:
    'FROM platformatic/node-caged:25-slim\n' +
    'WORKDIR /app\n' +
    'COPY . .\n' +
    'CMD ["node", "server.js"]',
},
```

### Rule Registration in index.ts
```typescript
// Source: rules/index.ts -- exact modification pattern
// Efficiency rules (9) <-- update count from 8
import { DL3019 } from './efficiency/DL3019-use-apk-no-cache';
import { PG012 } from './efficiency/PG012-node-caged-pointer-compression';  // NEW

export const allRules: LintRule[] = [
  // ...
  // Efficiency (9) <-- update count from 8
  DL3059, DL3014, DL3015, DL3003, DL3009, DL4006, DL3042, DL3019,
  PG012,  // NEW
  // ... rest unchanged
];
```

### Test Cases (5 scenarios)
```typescript
// Source: Pattern from PG011 tests, adapted for PG012

// Test 1: Official node image triggers PG012
'FROM node:22-bookworm-slim\nWORKDIR /app\nCOPY . .\nCMD ["node", "server.js"]'
// Expected: 1 violation, ruleId 'PG012', line 1

// Test 2: Python image does NOT trigger PG012
'FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nCMD ["python", "app.py"]'
// Expected: 0 violations

// Test 3: Custom registry node image does NOT trigger PG012
'FROM myregistry.io/node:22\nWORKDIR /app\nCOPY . .\nCMD ["node", "server.js"]'
// Expected: 0 violations

// Test 4: Multi-stage with node only in builder, python in final
'FROM node:22 AS builder\nRUN npm ci\nFROM python:3.12\nCOPY --from=builder /app .\nCMD ["python", "app.py"]'
// Expected: 0 violations (final stage is python, not node)

// Test 5: Multi-stage with node in both stages
'FROM node:22 AS builder\nRUN npm ci\nFROM node:22-slim\nCOPY --from=builder /app .\nCMD ["node", "server.js"]'
// Expected: 1 violation on the final FROM line

// Test 6: FROM scratch does NOT trigger PG012
'FROM node:22 AS builder\nRUN npm ci\nFROM scratch\nCOPY --from=builder /app /app\nENTRYPOINT ["/app"]'
// Expected: 0 violations

// Test 7: Build stage alias reference does NOT trigger PG012
'FROM node:22 AS node\nRUN npm ci\nFROM node\nCOPY --from=node /app .\nCMD ["node", "server.js"]'
// Expected: 0 violations (final FROM references stage alias "node", not the image)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No pointer compression in Node.js | `platformatic/node-caged` provides custom Node builds with V8 pointer compression | 2025-2026 | ~50% memory reduction for pointer-heavy workloads |
| V8 pointer compression required process-wide 4GB heap limit | IsolateGroups (Cloudflare-sponsored, Igalia-implemented) give each isolate its own 4GB cage | V8 2024, Node 25+ | Workers each get 4GB; removes the process-wide bottleneck |
| Pointer compression available only via custom source builds | Docker Hub images at `platformatic/node-caged` | 2025-2026 | One-line Dockerfile change |

**Not yet available in official Node.js:**
- Pointer compression is NOT enabled in official `node:` Docker images. The `--experimental-enable-pointer-compression` flag exists at Node.js compile time but official builds do not use it. There is no confirmed timeline for when official Node.js builds will include pointer compression (nodejs/TSC#790 and nodejs/node#55735 show ongoing discussion with no committed release target).

## Open Questions

1. **Should PG012 also match `FROM node` without a tag?**
   - What we know: `FROM node` (no tag, no version) has `getImageName()` returning `'node'` and `getImageTag()` returning `null`. It is still an official Node.js image.
   - What's unclear: Whether to suggest pointer compression when the user hasn't even pinned a version (they likely have other issues first -- DL3006 and DL3007 will fire).
   - Recommendation: YES, still fire PG012. It is info-level and non-blocking. The user can benefit from knowing about node-caged regardless of other issues. DL3006/DL3007 are separate, independent rules.

2. **Should PG012 fire when the node-caged image is already in use?**
   - What we know: If `FROM platformatic/node-caged:25-slim` is already used, PG012 should NOT fire (it is already using the optimized image).
   - What's unclear: `getImageName()` for `FROM platformatic/node-caged:25` returns `'node-caged'` (not `'node'`). `getRegistry()` returns `'platformatic'`... wait -- `platformatic` has no dot or port, so `getRegistryRange()` returns null. So `getImageName()` would return `'platformatic/node-caged'`.
   - Recommendation: This is automatically handled. `getImageName()` for `FROM platformatic/node-caged:25` returns `'platformatic/node-caged'`, which does not equal `'node'` or `'library/node'`. PG012 will not fire. No special handling needed.

3. **Should PG012 mention the Node 22 LTS vs Node 25 version gap?**
   - What we know: Most production Node.js deployments use Node 22 LTS. node-caged provides Node 25 images. Suggesting a switch from Node 22 to Node 25 is a major version jump.
   - What's unclear: Whether users on Node 22 LTS would view this as actionable.
   - Recommendation: The explanation text should clearly state "requires Node.js 25+" so users understand this is a forward-looking suggestion. The fix.beforeCode should show `FROM node:22-bookworm-slim` and fix.afterCode should show `FROM platformatic/node-caged:25-slim` to make the version change explicit.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `rules/index.ts` -- 45 rules total (15 security + 8 efficiency + 7 maintainability + 6 reliability + 9 best-practice); registration pattern confirmed
- Direct codebase inspection of `types.ts` -- `LintRule`, `RuleViolation`, `RuleSeverity`, `RuleCategory` interfaces confirmed
- Direct codebase inspection of `DL3006-tag-version.ts`, `PG006-prefer-digest.ts` -- `getImageName()`, `getRegistry()`, `getBuildStage()` usage patterns confirmed
- Direct codebase inspection of `PG011-missing-user-directive.ts` -- latest PG-series rule implementation pattern confirmed
- Direct codebase inspection of `DL3059-consolidate-runs.ts` -- info-severity efficiency rule pattern confirmed
- Direct codebase inspection of `scorer.ts` -- info severity = 3 base point deduction, efficiency weight = 25% confirmed
- Direct codebase inspection of `related.ts` -- auto-groups same-category rules by severity, no manual wiring needed
- Direct codebase inspection of `[code].astro` -- dynamic route generates docs from `allRules` via `getStaticPaths()`
- Direct source code inspection of `dockerfile-ast/lib/instructions/from.js` -- `getImageName()` strips registry prefix, `getRegistry()` returns null for Docker Hub, `getRegistryRange()` returns null when prefix has no dot/port/localhost

### Secondary (MEDIUM confidence)
- [platformatic/node-caged GitHub](https://github.com/platformatic/node-caged) -- Node 25+ images with V8 pointer compression, available tags (25, 25-slim, 25-alpine), 4GB per-isolate limit, N-API addon compatibility
- [platformatic/node-caged Docker Hub](https://hub.docker.com/r/platformatic/node-caged) -- Multi-arch images (amd64/arm64), tag variants
- [Halving Node.js Memory Usage (Platformatic Blog)](https://blog.platformatic.dev/we-cut-nodejs-memory-in-half) -- 50% memory reduction, 2-4% latency overhead, 7% P99 improvement, production AWS EKS benchmarks
- [V8 Pointer Compression blog post](https://v8.dev/blog/pointer-compression) -- Technical details of 64-to-32-bit pointer compression
- [nodejs/node#55735 Pointer Compression and Isolate Groups](https://github.com/nodejs/node/issues/55735) -- IsolateGroups status, no official Node.js build timeline
- [nodejs/TSC#790 Looking for feedback: Pointer compression](https://github.com/nodejs/TSC/issues/790) -- Community discussion, native addon compatibility concerns

### Tertiary (LOW confidence)
- Multiple web articles ([Vinta Software](https://www.vintasoftware.com/lessons-learned/node-caged-can-get-up-to-50-memory-reduction-in-nodejs-with-pointer-compression), [Umesh Malik](https://umesh-malik.com/blog/nodejs-memory-cut-in-half-pointer-compression)) -- Corroborate 50% memory claims and Docker usage pattern, but are secondary summaries

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero new dependencies; all API methods verified by direct source inspection of 8+ existing rules and dockerfile-ast source code
- Architecture: HIGH - direct codebase analysis of all affected files; identical plugin architecture to PG011 (Phase 72) with 4 auto-adapting files and 2 manual touchpoints
- Pitfalls: HIGH - all 6 pitfalls identified from direct codebase inspection with concrete prevention strategies; image name matching verified against dockerfile-ast source code
- Domain knowledge (pointer compression): MEDIUM - platformatic/node-caged features verified from GitHub and Docker Hub; ~50% memory claims corroborated by multiple sources including Platformatic's own AWS EKS benchmarks; Node 25+ requirement confirmed from GitHub repo

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable domain -- rule authoring patterns are mature; pointer compression landscape may evolve but rule logic is independent of upstream changes)
