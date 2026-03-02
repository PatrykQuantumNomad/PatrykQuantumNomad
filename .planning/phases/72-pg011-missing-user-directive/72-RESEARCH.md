# Phase 72: PG011 Missing USER Directive - Research

**Researched:** 2026-03-02
**Domain:** Dockerfile lint rule authoring -- security rule detecting missing USER directive in final build stage
**Confidence:** HIGH

## Summary

Phase 72 adds a single new security rule (PG011) to the existing Dockerfile Analyzer that flags Dockerfiles where the final build stage has no USER directive at all. This fills a genuine gap left by the existing DL3002 rule, which only flags explicit `USER root` but silently passes when no USER instruction exists -- meaning the container defaults to root without any warning. The detection logic is a straightforward absence check using the same `dockerfile-ast` API methods proven by 8+ existing rules. A documentation page is automatically generated via the existing `[code].astro` dynamic route.

The critical technical boundary is the non-overlap constraint with DL3002: PG011 must fire ONLY when zero USER instructions exist in the final stage. If any USER instruction is present (even `USER root` or `USER 0`), PG011 stays silent and defers to DL3002. Two additional edge cases require handling: `FROM scratch` images have no user system and must be skipped, and multi-stage builds must only inspect the final stage (builder stages routinely run as root). All three edge cases have well-established patterns in the existing codebase.

The implementation requires exactly 2 files touched: 1 new rule file and 1 modification to the rule registry. Four additional files (engine.ts, scorer.ts, related.ts, [code].astro) auto-adapt with no changes. Zero new dependencies are needed.

**Primary recommendation:** Create `PG011-missing-user-directive.ts` in the security rules directory following the exact same self-contained module pattern as DL3002 and PG010, register it in `rules/index.ts`, and verify the documentation page renders. The DL3002 boundary is the single most important verification point.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RULES-01 | PG011 security rule flags Dockerfiles with no USER directive in final build stage | Detection logic uses `dockerfile.getFROMs()` for final stage, `dockerfile.getInstructions()` filtered by keyword `USER` after last FROM line. Absence triggers violation. Pattern proven by DL3002, PG008, PG010. |
| RULES-02 | PG011 only checks final stage (skips builder stages and FROM scratch) | Final-stage scoping via `froms.at(-1).getRange().start.line` is an established pattern (DL3002, PG008, PG010). `FROM scratch` detection via `lastFrom.getImageName() === 'scratch'` is proven by DL3006, DL3007, PG006. |
| RULES-03 | PG011 has no overlap with DL3002 (fires only when no USER instruction exists at all) | DL3002 source code explicitly returns empty violations when no USER exists (lines 40-42: "No USER instruction in final stage -- do NOT flag"). PG011 inverts this: fire only when DL3002 would return early. The boundary is clean and documented. |
| DOCS-01 | PG011 rule page includes expert explanation, fix with before/after code, and related rules | The `[code].astro` dynamic route auto-generates documentation from rule metadata (`explanation`, `fix.description`, `fix.beforeCode`, `fix.afterCode`). `getRelatedRules()` auto-groups same-category rules. No template changes needed. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- NO new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `dockerfile-ast` | ^0.7.1 | Parse Dockerfile into typed AST with `getFROMs()`, `getInstructions()`, `getKeyword()`, `getArgumentsContent()`, `getImageName()`, `getRange()` | Already installed, browser-safe, used by all 44 existing rules |
| TypeScript (via Astro) | 5.x | Type-safe rule implementation via existing `LintRule` interface | Project standard |
| Astro | 5.17.1 | `[code].astro` auto-generates rule documentation pages via `getStaticPaths()` | Project framework -- no changes needed |

### No New Dependencies Required
This phase is a single TypeScript file plus a registry modification. No new npm packages are needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Absence detection (no USER) | AST visitor pattern | Overkill for a single-instruction check; all existing rules use direct iteration |
| Warning severity | Error severity | Warning matches DL3002 convention for USER-related issues; error would over-penalize given that many official images default to root safely |

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/dockerfile-analyzer/rules/
  security/
    DL3002-no-root-user.ts           # Existing -- flags USER root
    PG011-missing-user-directive.ts   # NEW -- flags missing USER entirely
  index.ts                            # MODIFY -- add import + array entry
```

### Pattern 1: Self-Contained Rule Module
**What:** Each rule is a single exported `const` implementing `LintRule`. Metadata (id, title, severity, category, explanation, fix) and detection logic (`check()`) live in one file.
**When to use:** Every new rule. No exceptions in this codebase.
**Example:**
```typescript
// Source: existing pattern from DL3002, PG007, PG008, PG010
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
  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    // Detection logic here
    return violations;
  },
};
```

### Pattern 2: Final-Stage Scoping
**What:** Find the last `FROM` instruction and only inspect instructions after it. This prevents false positives in builder stages.
**When to use:** PG011 needs this. Builder stages routinely run as root for `apt-get install` and compilation.
**Example:**
```typescript
// Source: DL3002 (lines 23-31), PG008 (lines 62-69), PG010 (lines 73-80)
const froms = dockerfile.getFROMs();
if (froms.length === 0) return violations;

const lastFrom = froms.at(-1);
if (!lastFrom) return violations;
const lastFromLine = lastFrom.getRange().start.line;

// Filter to instructions in the final stage
const userInstructions = dockerfile.getInstructions().filter(
  (inst) =>
    inst.getKeyword() === 'USER' &&
    inst.getRange().start.line > lastFromLine,
);
```

### Pattern 3: FROM scratch Detection
**What:** Check `getImageName() === 'scratch'` on the last FROM instruction to skip images that have no user system.
**When to use:** PG011 must skip `FROM scratch` because scratch images have no `/etc/passwd`, no shell, and no concept of users.
**Example:**
```typescript
// Source: DL3006 (line 39), DL3007 (line 39), PG006 (line 41)
const imageName = lastFrom.getImageName();
if (imageName === 'scratch') return violations;
```

### Pattern 4: Registry-Driven Auto-Discovery
**What:** Add import + array entry to `rules/index.ts`. Engine, scorer, related rules, and documentation pages all consume `allRules` dynamically.
**When to use:** Required for every new rule. This is the single integration point.
**Example:**
```typescript
// Source: rules/index.ts -- exact changes needed
// Add to security imports (after PG010 import, line 17):
import { PG011 } from './security/PG011-missing-user-directive';

// Add to allRules array -- security section (after PG010, line 67):
  PG010,
  PG011,

// Update comment: "Security rules (14)" --> "Security rules (15)"
```

### Anti-Patterns to Avoid
- **Overlapping with DL3002:** PG011 must NEVER fire when any USER directive exists in the final stage. Even `USER root` is DL3002's domain. The boundary is: PG011 = zero USER instructions, DL3002 = USER instruction exists but is root.
- **Flagging builder stages:** Only the final stage matters. Builder stages commonly run as root by design.
- **Flagging FROM scratch:** Scratch images have no user system. Flagging them is a false positive.
- **Manually wiring related rules:** `getRelatedRules()` in `related.ts` auto-groups by category. No manual wiring needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dockerfile parsing | Custom regex parser | `dockerfile-ast` (already installed) | Multi-stage builds, line continuations, heredocs, ARG substitution -- all handled |
| Related rules grouping | Manual cross-references in rule file | `getRelatedRules()` from `related.ts` | Auto-groups same-category rules by severity; already works for 44 rules |
| Documentation page | Custom Astro page for PG011 | Existing `[code].astro` dynamic route | `getStaticPaths()` reads `allRules` and auto-generates the page |
| Scoring integration | Custom score adjustment | Existing `scorer.ts` | Auto-reads `allRules` for rule lookup; warning severity = 8 point deduction from security category |

**Key insight:** The plugin architecture means 4 out of 6 downstream consumers auto-adapt with zero code changes. The only manual work is the rule file itself and the registry entry.

## Common Pitfalls

### Pitfall 1: PG011 / DL3002 Rule Overlap
**What goes wrong:** PG011 fires when `USER root` is present, causing users to see two violations for the same conceptual issue (running as root).
**Why it happens:** Developer checks "is the last user root?" instead of "are there zero USER instructions?"
**How to avoid:** PG011's check function must count USER instructions in the final stage. If `userInstructions.length > 0`, return empty violations immediately. Let DL3002 handle all cases where USER exists.
**Warning signs:** A Dockerfile with `USER root` triggers both DL3002 and PG011 simultaneously.

### Pitfall 2: Multi-Stage Build False Positives
**What goes wrong:** PG011 fires on a builder stage that intentionally runs as root for compilation.
**Why it happens:** Developer scans all instructions globally instead of scoping to the final stage.
**How to avoid:** Use the final-stage scoping pattern: find `froms.at(-1)`, get its line, filter instructions to those after that line.
**Warning signs:** Multi-stage Dockerfile with USER only in builder triggers PG011.

### Pitfall 3: FROM scratch False Positive
**What goes wrong:** PG011 fires on `FROM scratch` images, which have no user system at all.
**Why it happens:** Developer forgets that scratch is a special case -- it is an empty filesystem with no `/etc/passwd`.
**How to avoid:** Check `lastFrom.getImageName() === 'scratch'` and return early if true.
**Warning signs:** `FROM scratch` with no USER triggers PG011.

### Pitfall 4: Wrong Line Number for Violation
**What goes wrong:** Violation points to line 0 or an incorrect line.
**Why it happens:** `dockerfile-ast` uses 0-based line numbers but `RuleViolation.line` is 1-based.
**How to avoid:** Always add 1 to `range.start.line`. Flag on the last FROM instruction line (where the final stage begins) since there is no specific USER instruction to point to.
**Warning signs:** Violations appear at wrong lines in the results panel.

### Pitfall 5: Explanation Quality
**What goes wrong:** Explanation is generic ("add a USER directive") without production context.
**Why it happens:** Treating the explanation as a simple description rather than expert guidance.
**How to avoid:** Reference CIS Docker Benchmark 4.1, container escape risk, Kubernetes Pod Security Standards. Explain WHY running as root is dangerous, not just WHAT to do. Follow the pattern set by DL3002 and PG010's explanations.
**Warning signs:** Explanation reads like a lint message rather than an expert security briefing.

## Code Examples

Verified patterns from the existing codebase:

### PG011 Detection Logic (Complete Implementation Pattern)
```typescript
// Source: Pattern synthesized from DL3002 (lines 21-63), PG008 (lines 60-69), DL3006 (line 39)
check(dockerfile: Dockerfile): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const froms = dockerfile.getFROMs();

  if (froms.length === 0) return violations;

  // Find the last FROM (start of final stage)
  const lastFrom = froms.at(-1);
  if (!lastFrom) return violations;

  // Skip FROM scratch -- no user system exists
  const imageName = lastFrom.getImageName();
  if (imageName === 'scratch') return violations;

  const lastFromLine = lastFrom.getRange().start.line;

  // Find USER instructions in the final stage
  const userInstructions = dockerfile.getInstructions().filter(
    (inst) =>
      inst.getKeyword() === 'USER' &&
      inst.getRange().start.line > lastFromLine,
  );

  // If ANY USER instruction exists, defer to DL3002
  if (userInstructions.length > 0) return violations;

  // No USER directive in final stage -- flag on the FROM line
  const range = lastFrom.getRange();
  violations.push({
    ruleId: this.id,
    line: range.start.line + 1,
    column: 1,
    message:
      'No USER directive in the final stage. The container will run as root. ' +
      'Add a USER instruction to switch to a non-root user.',
  });

  return violations;
}
```

### DL3002 Boundary (Existing Code Showing the Gap PG011 Fills)
```typescript
// Source: DL3002-no-root-user.ts, lines 40-43
if (userInstructions.length === 0) {
  // No USER instruction in final stage -- do NOT flag
  // (DL3002 only flags explicit USER root)
  return violations;
}
```

### Rule Registration in index.ts
```typescript
// Source: rules/index.ts -- exact modification pattern
// Security rules (15) <-- update count from 14
import { PG010 } from './security/PG010-detect-tool-usage';
import { PG011 } from './security/PG011-missing-user-directive';  // NEW

export const allRules: LintRule[] = [
  // Security (15) <-- update count from 14
  DL3006, DL3007, DL3008, DL3020, DL3004, DL3002, DL3061,
  PG001, PG002, PG003, PG006, PG007, PG009, PG010,
  PG011,  // NEW
  // ... rest unchanged
];
```

### Expert Explanation Template (from DL3002 and PG010)
```typescript
// Source: Pattern from DL3002 explanation and CIS Docker Benchmark 4.1
explanation:
  'When a Dockerfile has no USER instruction, the container runs as root (UID 0) by default. ' +
  'This means every process inside the container has full administrative privileges. If an ' +
  'attacker exploits a vulnerability in your application, they gain root access -- and in the ' +
  'event of a container escape, they become root on the host. The CIS Docker Benchmark (Section ' +
  '4.1) and Kubernetes Pod Security Standards both require non-root containers. Most container ' +
  'orchestrators can enforce this at admission time, causing rootless-unaware images to fail ' +
  'deployment entirely. Unlike USER root (caught by DL3002), a missing USER directive is ' +
  'invisible -- there is no line to flag, making it easy to overlook during code review.',
```

### Before/After Fix Code
```typescript
// Source: Pattern from DL3002 fix
fix: {
  description:
    'Add a non-root USER instruction after completing root-only setup tasks. ' +
    'Create a dedicated application user with explicit UID/GID for deterministic builds.',
  beforeCode:
    'FROM node:22-bookworm-slim\n' +
    'WORKDIR /app\n' +
    'COPY . .\n' +
    'CMD ["node", "server.js"]',
  afterCode:
    'FROM node:22-bookworm-slim\n' +
    'RUN groupadd -g 10001 appgroup && \\\n' +
    '    useradd -u 10001 -g appgroup -s /bin/false appuser\n' +
    'WORKDIR /app\n' +
    'COPY --chown=appuser:appgroup . .\n' +
    'USER appuser\n' +
    'CMD ["node", "server.js"]',
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hadolint DL3002 only flags `USER root` | PG011 fills the gap: flags MISSING USER entirely | PG011 is novel (Hadolint issues #1025, #1089 remain open) | Catches the most dangerous variant: implicit root with no visible USER instruction |
| DL3063 (Hadolint) added but default-disabled | PG011 as warning severity (always active) | Hadolint PR #1032 shows the community struggles with severity | Warning is appropriate: significant security concern per CIS 4.1, but some official images default to root safely |

**Deprecated/outdated:**
- Hadolint's DL3063 was proposed as a similar rule but is default-disabled due to severity calibration debates. PG011 avoids this by using `warning` severity (same as DL3002) rather than `error`.

## Open Questions

1. **Where to point the violation line?**
   - What we know: PG011 detects absence (no specific instruction to highlight). DL3057 (missing HEALTHCHECK) flags on the last FROM instruction line when no HEALTHCHECK exists.
   - What's unclear: Whether to flag on the last FROM line or the last instruction in the final stage (CMD/ENTRYPOINT).
   - Recommendation: Flag on the last FROM instruction, consistent with DL3057. This is where the stage begins and where the user needs to add a USER directive after.

2. **Should PG011 skip stages that reference another build stage as base?**
   - What we know: `FROM builder` references a prior stage alias. The builder stage's USER may or may not propagate.
   - What's unclear: Docker does NOT propagate USER across stages. Each stage starts fresh from its base image's USER.
   - Recommendation: Do NOT skip. `FROM builder` starts a new stage and USER does not carry over. Only skip `FROM scratch`.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `DL3002-no-root-user.ts` -- confirmed explicit boundary at lines 40-42 where missing USER returns empty violations
- Direct codebase inspection of `PG008-use-init-process.ts`, `PG010-detect-tool-usage.ts` -- final-stage scoping pattern verified
- Direct codebase inspection of `DL3006-tag-version.ts`, `DL3007-no-latest.ts`, `PG006-prefer-digest.ts` -- `FROM scratch` detection via `getImageName() === 'scratch'` verified
- Direct codebase inspection of `types.ts` -- `LintRule` interface, `RuleViolation` type confirmed unchanged
- Direct codebase inspection of `rules/index.ts` -- registration pattern: import + allRules array entry
- Direct codebase inspection of `[code].astro` -- dynamic route generates docs from `allRules` via `getStaticPaths()`
- Direct codebase inspection of `related.ts` -- auto-groups same-category rules, no manual wiring needed
- Direct codebase inspection of `engine.ts` -- iterates `allRules`, no changes needed
- Direct codebase inspection of `scorer.ts` -- reads `allRules` for lookup, warning severity = 8 base points deduction from security category (30% weight)
- `dockerfile-ast` ^0.7.1 type definitions -- `From.getImageName()`, `From.getBuildStage()`, `From.getRange()` confirmed
- Project-level research: `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md` -- comprehensive analysis confirmed all patterns

### Secondary (MEDIUM confidence)
- [CIS Docker Benchmark V1.6.0 Section 4.1](https://hub.powerpipe.io/mods/turbot/steampipe-mod-docker-compliance/benchmarks/control.cis_v160_4_1) -- USER directive requirement
- [Hadolint issue #1089](https://github.com/hadolint/hadolint/issues/1089) -- Missing USER feature request (open)
- [Hadolint issue #1025](https://github.com/hadolint/hadolint/issues/1025) -- Missing USER feature request (open)
- [Hadolint DL3002 wiki](https://github.com/hadolint/hadolint/wiki/DL3002) -- Confirms DL3002 only flags explicit `USER root`
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) -- Non-root containers as security requirement
- [Snyk Docker Security Best Practices](https://snyk.io/blog/10-docker-image-security-best-practices/) -- Missing USER as top security concern

### Tertiary (LOW confidence)
- [Hadolint PR #1032](https://github.com/hadolint/hadolint/pull/1032) -- DL3063 implementation (default: ignore) -- informs severity calibration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero new dependencies; all API methods verified by direct source inspection of 8+ existing rules and dockerfile-ast type definitions
- Architecture: HIGH - direct codebase analysis of all 7 affected files; plugin architecture is clean with 4 auto-adapting files and 2 manual touchpoints
- Pitfalls: HIGH - all 5 pitfalls identified from direct codebase inspection with concrete prevention strategies; DL3002 boundary documented at source-line level

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable domain -- Dockerfile syntax and dockerfile-ast API are mature)
