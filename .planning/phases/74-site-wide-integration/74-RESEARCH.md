# Phase 74: Site-Wide Integration - Research

**Researched:** 2026-03-02
**Domain:** Hardcoded Dockerfile Analyzer rule count updates (40 -> 46), SKILL.md rule additions, and Astro build verification
**Confidence:** HIGH

## Summary

Phase 74 is a site-wide find-and-replace plus documentation update phase. The Dockerfile Analyzer grew from 40 to 46 rules across Phases 72 (PG011) and 73 (PG012), but the six new rules added since the last SKILL.md sync (PG007, PG008, PG009, PG010, PG011, PG012) were never reflected in hardcoded count strings throughout the site. Every "40 rules" reference in source files must become "46 rules," the SKILL.md must gain entries for the six missing PG rules and update its per-category counts, and PROJECT.md must update its summary line from "44 rules (34 DL + 10 PG)" to "46 rules (34 DL + 12 PG)."

INTG-01 (both rules registered in allRules) is already satisfied -- PG011 and PG012 are imported and listed in `src/lib/tools/dockerfile-analyzer/rules/index.ts` at lines 18, 29, 76, and 86. The `allRules` array contains exactly 46 entries (verified via count). The engine, scorer, related rules, and `[code].astro` page generator all consume `allRules` dynamically and require zero code changes. The phase is therefore entirely about hardcoded text strings and documentation.

The changes fall into five categories: (1) user-facing page text (tools index badge, blog post cross-links), (2) machine-readable structured data (JSON-LD description and featureList in DockerfileAnalyzerJsonLd.astro), (3) LLM-readable files (llms.txt, llms-full.txt), (4) the downloadable SKILL.md (6 missing rule entries + category count headers + description), and (5) PROJECT.md planning documentation. A total of 7 source files and 1 public asset need modification, with 9 distinct string replacements in source files plus the SKILL.md content additions.

**Primary recommendation:** Perform all "40 -> 46" text replacements using the exact file/line inventory below, add the 6 missing PG rule entries to SKILL.md with updated category counts, update PROJECT.md, then run `astro build` to verify zero errors and grep `dist/` for any surviving "40 rules" references.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTG-01 | Both rules registered in allRules array in rules/index.ts | ALREADY SATISFIED -- PG011 at line 76, PG012 at line 86 of index.ts. Verified 46 entries in array. |
| INTG-02 | All hardcoded rule counts updated site-wide to reflect 46 total rules | Complete file/line inventory of 9 replacements across 7 source files + SKILL.md documented below |
| INTG-03 | Full production build passes with 46 rules and both new documentation pages | Build verification commands documented; [code].astro auto-generates pg011/ and pg012/ pages from allRules |
</phase_requirements>

## Standard Stack

### Core (no additions needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site generator | All rule pages auto-generated from allRules via getStaticPaths |

### Supporting

No additional libraries needed. This phase modifies only existing text strings and documentation.

### Alternatives Considered

None -- this is a text replacement, documentation update, and build verification phase.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Complete Inventory of "40 -> 46" Replacements

This is the core deliverable: an exhaustive, verified list of every file and line that needs updating.

#### Category 1: Source File String Replacements (9 replacements in 7 files)

| File | Line | Current Text | New Text |
|------|------|-------------|----------|
| `src/pages/tools/index.astro` | 40 | `40-rule engine` | `46-rule engine` |
| `src/pages/llms.txt.ts` | 77 | `40-rule engine analyzing Dockerfiles` | `46-rule engine analyzing Dockerfiles` |
| `src/pages/llms-full.txt.ts` | 130 | `40 validation rules across 5 categories` | `46 validation rules across 5 categories` |
| `src/components/DockerfileAnalyzerJsonLd.astro` | 11 | `40 rules across security, efficiency` | `46 rules across security, efficiency` |
| `src/components/DockerfileAnalyzerJsonLd.astro` | 35 | `40 lint rules based on Hadolint` | `46 lint rules based on Hadolint` |
| `src/data/blog/kubernetes-manifest-best-practices.mdx` | 681 | `covers 40 rules for security` | `covers 46 rules for security` |
| `src/data/blog/docker-compose-best-practices.mdx` | 324 | `checks 40 rules for security` | `checks 46 rules for security` |

**Also update the DL/PG breakdown in the featureList (line 35):**
- Current: `"40 lint rules based on Hadolint DL codes and production Kubernetes experience"`
- New: `"46 lint rules based on Hadolint DL codes and production Kubernetes experience"`

#### Category 2: SKILL.md Updates (public/skills/dockerfile-analyzer/SKILL.md)

The SKILL.md is a downloadable Claude Skill that has not been updated since 40 rules. It needs:

**A. Description update (line 5):**
- Current: `using 40 rules across 5 categories`
- New: `using 46 rules across 5 categories`

**B. Category count headers:**
| Line | Current | New |
|------|---------|-----|
| 85 | `### Security Rules (11 rules)` | `### Security Rules (15 rules)` |
| 175 | `### Efficiency Rules (8 rules)` | `### Efficiency Rules (9 rules)` |
| 299 | `### Reliability Rules (5 rules)` | `### Reliability Rules (6 rules)` |

(Maintainability stays at 7, Best Practice stays at 9 -- these are correct.)

**C. Missing rule entries to add (6 rules):**

Add after PG006 in Security section (after line ~173):

```markdown
#### PG007 -- Use explicit UID/GID in USER instruction
- **Severity:** info
- **Check:** USER instructions with named users but no explicit UID/GID (e.g., `USER node` instead of `USER 10001:10001`)
- **Why:** Named users resolve differently across base images. A `USER node` in one image may map to UID 1000, but in another to UID 999. Explicit numeric UIDs/GIDs ensure deterministic behavior across all environments, prevent permission mismatches in volume mounts, and align with Kubernetes Pod Security Standards that require `runAsUser` numeric values.
- **Fix:** Use explicit numeric UID and GID
- **Before:** `USER node`
- **After:** `USER 10001:10001`

#### PG009 -- Remove unnecessary tools from production images
- **Severity:** info
- **Check:** RUN instructions that install debugging or development tools (curl, wget, vim, nano, net-tools, iputils-ping, telnet, strace, gdb, tcpdump) without removing them in the same layer
- **Why:** Development and debugging tools expand the attack surface and increase image size. An attacker with shell access can use pre-installed curl to exfiltrate data or wget to download malware. Remove tools after use or use multi-stage builds.
- **Fix:** Remove tools after use or use multi-stage builds
- **Before:** `RUN apt-get install -y curl && curl -o app.tar.gz https://example.com/app.tar.gz`
- **After:** `RUN apt-get install -y --no-install-recommends curl && curl -o app.tar.gz https://example.com/app.tar.gz && apt-get purge -y curl && apt-get autoremove -y`

#### PG010 -- Detect common tool usage patterns
- **Severity:** info
- **Check:** RUN instructions using tools commonly installed in separate layers (e.g., git clone without a multi-stage build, manual compilation without cleanup)
- **Why:** Tool usage patterns reveal optimization opportunities. Git cloning in a production image means the .git directory is included. Compilation without multi-stage means build toolchains ship to production.
- **Fix:** Use multi-stage builds to separate build tools from production runtime
- **Before:** `RUN git clone https://github.com/example/app.git && cd app && make`
- **After:** Use multi-stage: build in one stage, copy only artifacts to the final stage

#### PG011 -- Add a USER directive to avoid running as root
- **Severity:** warning
- **Check:** Final build stage has no USER instruction at all (not even `USER root`). Does NOT fire when any USER instruction exists in the final stage (defers to DL3002 for explicit `USER root` cases). Skips FROM scratch (no user system).
- **Why:** Containers run as root by default. CIS Docker Benchmark 4.1 requires non-root execution. If no USER instruction exists, the container silently defaults to root -- more dangerous than explicit `USER root` because it is invisible in code review. A container escape from a root process gives the attacker root on the host.
- **Fix:** Add a non-root USER with explicit UID/GID
- **Before:** `FROM node:22-bookworm-slim\nWORKDIR /app\nCOPY . .\nCMD ["node", "server.js"]`
- **After:** `FROM node:22-bookworm-slim\nRUN groupadd -g 10001 app && useradd -u 10001 -g app appuser\nWORKDIR /app\nCOPY . .\nUSER appuser\nCMD ["node", "server.js"]`
```

Add after DL3019 in Efficiency section (after line ~239):

```markdown
#### PG012 -- Consider pointer compression for Node.js images
- **Severity:** info
- **Check:** Final build stage uses an official Docker Hub Node.js base image (node:* or library/node:*). Does NOT fire on custom registry images, non-node images, FROM scratch, or build stage alias references.
- **Why:** V8 pointer compression shrinks pointers from 64-bit to 32-bit, yielding ~50% memory reduction for pointer-heavy workloads. The platformatic/node-caged image ships Node.js built with --experimental-enable-pointer-compression. Requires Node.js 25+ with IsolateGroups. 4GB per-isolate heap limit (Buffers don't count). N-API addons compatible but older V8 native addons may not work.
- **Fix:** Replace official Node.js base image with platformatic/node-caged
- **Before:** `FROM node:22-bookworm-slim\nWORKDIR /app\nCOPY . .\nCMD ["node", "server.js"]`
- **After:** `FROM platformatic/node-caged:25-slim\nWORKDIR /app\nCOPY . .\nCMD ["node", "server.js"]`
```

Add after DL3024 in Reliability section (after line ~337):

```markdown
#### PG008 -- Use an init process for proper signal handling
- **Severity:** info
- **Check:** Final build stage has an ENTRYPOINT or CMD that runs a Node.js, Python, or shell process without an init system (tini, dumb-init, or docker --init)
- **Why:** PID 1 in a container has special signal handling responsibilities. Without an init process, orphaned zombie processes accumulate and SIGTERM is not forwarded to child processes, causing ungraceful shutdowns and potential data loss during rolling updates.
- **Fix:** Add tini or dumb-init as the entrypoint
- **Before:** `ENTRYPOINT ["node", "server.js"]`
- **After:** `RUN apt-get install -y --no-install-recommends tini\nENTRYPOINT ["tini", "--"]\nCMD ["node", "server.js"]`
```

**D. Update Hadolint/PG breakdown in description:**
- The description on line 5 says `using 40 rules across 5 categories`
- Update to `using 46 rules across 5 categories`

#### Category 3: PROJECT.md Documentation Updates

| File | Line | Current Text | New Text |
|------|------|-------------|----------|
| `.planning/PROJECT.md` | 269 | `44 rules (34 Hadolint DL codes + 10 custom PG rules), category-weighted scoring, inline annotations, 44 rule documentation pages` | `46 rules (34 Hadolint DL codes + 12 custom PG rules), category-weighted scoring, inline annotations, 46 rule documentation pages` |

#### Category 4: Files That Need NO Changes (Auto-Adapting)

These files dynamically derive content from `allRules` and require zero modifications:

- `src/lib/tools/dockerfile-analyzer/engine.ts` -- iterates `allRules` dynamically (`allRules.length` = 46)
- `src/lib/tools/dockerfile-analyzer/scorer.ts` -- builds rule lookup from `allRules`
- `src/lib/tools/dockerfile-analyzer/rules/related.ts` -- filters `allRules` by category
- `src/pages/tools/dockerfile-analyzer/rules/[code].astro` -- `getStaticPaths()` auto-generates pages for all rules
- `src/lib/tools/dockerfile-analyzer/rules/index.ts` -- already has PG011 and PG012 registered
- `src/lib/og-image.ts` -- Dockerfile Analyzer OG image has "Grade A+" badge but NO rule count badge (unlike Compose/K8s)
- `src/pages/tools/dockerfile-analyzer/index.astro` -- uses "Dozens of rules" (intentionally vague), no count to update

#### Category 5: Planning Docs (Non-Source, Optional)

These planning docs have stale "40" references but are not shipped to production:

- `.planning/audit-llm-seo.md` lines 310, 581 -- "40 rules" in analysis document
- Various old phase plans/research docs from phases 23, 25, 26 -- historical references

**Recommendation:** Update `.planning/PROJECT.md` (Category 3 above) since it's the canonical project description. The audit doc and old phase docs are historical and can be left as-is.

### Anti-Patterns to Avoid

- **Changing rule counts in the Compose Validator or K8s Analyzer:** These tools have their own correct counts (52 and 67 respectively). Only update Dockerfile Analyzer counts.
- **Changing "20-40 MB" in DL3009 rule or blog post:** This is a file size range, not a rule count. Line 196 of dockerfile-best-practices.mdx and line 11 of DL3009 rule file.
- **Changing "44" in Compose Validator source:** The `src/lib/tools/compose-validator/` files correctly reference "44 custom rules" for that tool. Do not touch.
- **Modifying engine.ts or scorer.ts:** These auto-adapt from `allRules.length`. No changes needed.
- **Hardcoding 46 in getStaticPaths or rule page generation:** The `[code].astro` page already iterates `allRules` dynamically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding all "40 rules" references | Manual memory or incomplete grep | Exact file/line inventory above | Missing even one creates SEO inconsistency |
| Verifying zero remaining "40 rules" | Manual page-by-page review | `grep -r "40 rules\|40-rule\|40 lint\|40 validation" dist/` on built output | Automated verification catches anything missed |
| Adding missing SKILL.md rules | Writing from scratch | Copy format from existing SKILL.md entries + verify against rule source files | Ensures consistency with existing style |

**Key insight:** The Phase 71 research established the pattern for this type of site-wide count update. Follow the same methodology: exhaustive inventory, systematic replacement, build verification, grep-based confirmation.

## Common Pitfalls

### Pitfall 1: Missing a "40" Instance in Source

**What goes wrong:** Build passes, but Google caches a JSON-LD description saying "40 rules" while the tool badge shows 46. LLM crawlers see "40-rule engine" in llms.txt.
**Why it happens:** The "40" appears in 7 different source files across different types (Astro pages, TypeScript, MDX, JSON-LD). Easy to miss one.
**How to avoid:** Use the exact file/line inventory above. After all edits, grep the built `dist/` output for any surviving "40 rules", "40-rule", "40 lint", or "40 validation" strings.
**Warning signs:** `grep -r "40 rules\|40-rule\|40 lint\|40 validation" dist/` returns any Dockerfile-related results.

### Pitfall 2: Accidentally Changing Non-Dockerfile "40" References

**What goes wrong:** Breaking CSS values, SVG coordinates, padding values, or Compose Validator counts.
**Why it happens:** The number "40" appears 150+ times across the codebase in contexts unrelated to Dockerfile rule counts (CSS padding, SVG coordinates, array indices, badge-generator constants, Compose Validator references).
**How to avoid:** Only modify lines explicitly listed in the inventory. Never do a blind find-and-replace of all "40" occurrences.
**Warning signs:** Build errors, visual regressions, Compose Validator showing wrong count.

### Pitfall 3: SKILL.md Rule Entries Not Matching Source

**What goes wrong:** The SKILL.md describes a rule incorrectly, causing Claude to give wrong advice when using the skill.
**Why it happens:** Rule entries are written from memory rather than by consulting the actual rule source files.
**How to avoid:** Read each PG rule source file before writing its SKILL.md entry. The rule's `explanation`, `fix`, `severity`, and `category` fields are the authoritative source.
**Warning signs:** SKILL.md severity or category doesn't match the TypeScript source.

### Pitfall 4: Not Running Build Before Declaring Done

**What goes wrong:** All text changes look correct but build fails due to unrelated TypeScript error or stale cache.
**Why it happens:** Developer assumes text-only changes cannot break the build.
**How to avoid:** Run `npx astro build` as the final verification step. Check that build completes with zero errors, and that both `/tools/dockerfile-analyzer/rules/pg011/` and `/tools/dockerfile-analyzer/rules/pg012/` pages exist in `dist/`.
**Warning signs:** Build errors, missing pages in dist/.

### Pitfall 5: Forgetting the SKILL.md Category Count Headers

**What goes wrong:** SKILL.md description says "46 rules" but the section headers still say "Security Rules (11 rules)" etc., totaling 40. Claude users see inconsistent information.
**Why it happens:** Developer updates the top-level count but not the per-category headers.
**How to avoid:** Update all three stale headers: Security 11->15, Efficiency 8->9, Reliability 5->6.

## Code Examples

### Verified Pattern: Tools Index Badge Update

```astro
// Source: src/pages/tools/index.astro (verified at line 40)

// BEFORE:
<li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">40-rule engine</li>

// AFTER:
<li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">46-rule engine</li>
```

### Verified Pattern: JSON-LD Structured Data Update

```astro
// Source: src/components/DockerfileAnalyzerJsonLd.astro (verified at lines 11, 35)

// BEFORE (line 11):
"description": "Free browser-based Dockerfile linter and best-practice analyzer. 40 rules across security, efficiency, maintainability, reliability, and best practices. Scored by a Kubernetes architect with 17+ years of experience.",

// AFTER:
"description": "Free browser-based Dockerfile linter and best-practice analyzer. 46 rules across security, efficiency, maintainability, reliability, and best practices. Scored by a Kubernetes architect with 17+ years of experience.",

// BEFORE (line 35):
"40 lint rules based on Hadolint DL codes and production Kubernetes experience",

// AFTER:
"46 lint rules based on Hadolint DL codes and production Kubernetes experience",
```

### Verified Pattern: LLMs.txt Update

```typescript
// Source: src/pages/llms.txt.ts (verified at line 77)

// BEFORE:
'- Dockerfile Analyzer: 40-rule engine analyzing Dockerfiles...'

// AFTER:
'- Dockerfile Analyzer: 46-rule engine analyzing Dockerfiles...'
```

### Build Verification Commands

```bash
# 1. Run the full build
npx astro build

# 2. Verify both new rule pages exist
ls dist/tools/dockerfile-analyzer/rules/pg011/index.html
ls dist/tools/dockerfile-analyzer/rules/pg012/index.html

# 3. Verify zero "40 rules" in built output (Dockerfile-specific)
grep -r "40 rules\|40-rule\|40 lint\|40 validation" dist/ | grep -iv compose | grep -iv "20-40" || echo "PASS: No stale '40 rules' found"

# 4. Verify "46" appears in key pages
grep "46" dist/tools/index.html && echo "PASS: Tools index updated"
grep "46 rules" dist/llms.txt && echo "PASS: LLMs.txt updated"
grep "46 rules" dist/llms-full.txt && echo "PASS: LLMs full updated"

# 5. Count total rule pages generated (should be 46)
ls dist/tools/dockerfile-analyzer/rules/*/index.html | wc -l
```

## State of the Art

| Old Count | Current Count | Category | Where to Update |
|-----------|---------------|----------|-----------------|
| 40 total rules | 46 total rules | All references | 7 source files + SKILL.md + PROJECT.md |
| 11 security rules | 15 security rules | SKILL.md header only | Line 85 |
| 8 efficiency rules | 9 efficiency rules | SKILL.md header only | Line 175 |
| 5 reliability rules | 6 reliability rules | SKILL.md header only | Line 299 |
| 34 DL + 10 PG | 34 DL + 12 PG | PROJECT.md only | Line 269 |
| 44 rules, 44 doc pages | 46 rules, 46 doc pages | PROJECT.md only | Line 269 |

**Rules added since SKILL.md was last updated (PG007-PG012):**
- PG007 (security, info): Explicit UID/GID in USER -- added in an earlier milestone
- PG008 (reliability, info): Use init process -- added in an earlier milestone
- PG009 (security, info): Remove unnecessary tools -- added in an earlier milestone
- PG010 (security, info): Detect tool usage patterns -- added in an earlier milestone
- PG011 (security, warning): Missing USER directive -- Phase 72
- PG012 (efficiency, info): Node.js pointer compression -- Phase 73

## Open Questions

1. **SKILL.md rule entries for PG007, PG008, PG009, PG010**
   - What we know: These 4 rules were added in earlier milestones but never added to SKILL.md. Their source files exist and contain all metadata needed.
   - What's unclear: Whether the SKILL.md entries should be comprehensive (matching the detail level of existing entries) or abbreviated.
   - Recommendation: Add full entries matching the existing SKILL.md format. Read each rule's TypeScript source file for the authoritative explanation, severity, and fix text. This keeps the SKILL.md consistent and useful for Claude users.

2. **Planning docs with stale "40" counts**
   - What we know: `.planning/audit-llm-seo.md` and older phase plans reference "40 rules".
   - What's unclear: Whether these historical planning docs should be updated.
   - Recommendation: Only update `.planning/PROJECT.md` (canonical project description). Leave historical phase plans and audit docs as-is -- they describe the project at the time they were written.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** -- all 7 source files read directly via Read tool, every line number verified against current file content (2026-03-02)
- **rules/index.ts** -- verified 46 entries in allRules array via line count and grep
- **SKILL.md** -- read in full, verified missing PG007-PG012 entries and stale category counts
- **Phase 71 RESEARCH.md** -- prior art for the same type of site-wide count update phase
- **Phase 73 73-01-PLAN.md** -- confirmed PG012 registration and 46-rule total

### Secondary (MEDIUM confidence)
- **Phase 72 72-01-PLAN.md** -- confirmed PG011 registration pattern

### Tertiary (LOW confidence)
- None -- all claims verified against primary sources in the codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, pure text editing
- Architecture: HIGH -- complete file/line inventory verified against current codebase with line-level reads
- Pitfalls: HIGH -- all pitfalls are well-understood patterns from Phase 71 precedent; false-positive "40" instances identified and documented
- Build verification: HIGH -- Astro's getStaticPaths auto-generation pattern verified by reading engine.ts, [code].astro, and related.ts

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable -- line numbers may shift if other phases modify these files first, but anchoring on text content is reliable)
