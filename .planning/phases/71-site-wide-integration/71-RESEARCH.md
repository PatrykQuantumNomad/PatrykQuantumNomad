# Phase 71: Site-Wide Integration - Research

**Researched:** 2026-03-02
**Domain:** Hardcoded language count updates (25 -> 26), PROJECT.md documentation, and Astro build verification
**Confidence:** HIGH

## Summary

Phase 71 is a site-wide find-and-replace operation plus documentation and build verification. Every hardcoded "25 languages" reference in the codebase must be updated to "26 languages," and derived counts (150 justifications -> 156, 250 code blocks -> 260, 600 VS pages -> 650) must also be corrected. This is purely a text-editing phase -- no new components, no data files, no infrastructure. The architecture research from the v1.11 milestone already catalogued every occurrence across 14 source files (28+ individual replacements).

The changes fall into four categories: (1) user-facing prose in Astro pages and components (hero text, meta descriptions, ogImageAlt, citation text, aria-labels), (2) machine-readable structured data (JSON-LD description in BeautyIndexJsonLd.astro, LLMs.txt/llms-full.txt.ts), (3) OG image render text (og-image.ts hardcoded subtitle), and (4) blog post content (the-beauty-index.mdx and building-kubernetes-observability-stack.mdx). Additionally, code comments in several files reference "25" and should be updated for accuracy. The PROJECT.md documentation must be updated with Lisp-related validated requirements under the v1.11 section.

**Primary recommendation:** Perform all text replacements in a single systematic pass using the catalogued file/line inventory from ARCHITECTURE.md research, then run `astro build` to verify zero errors and grep the `dist/` output for any surviving "25 languages" references.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | All hardcoded "25 languages" references updated to "26 languages" across pages, components, and meta descriptions | Complete file/line inventory of 28+ replacements across 14 source files documented below |
| SITE-02 | Blog post referencing "25 languages" updated to "26 languages" | 7 occurrences identified across the-beauty-index.mdx (6) and building-kubernetes-observability-stack.mdx (1) |
| SITE-03 | OG image text references updated from 25 to 26 | Single hardcoded string at src/lib/og-image.ts line 618 |
| SITE-04 | JSON-LD structured data updated with correct language count | src/components/BeautyIndexJsonLd.astro line 23 description string; numberOfItems auto-computed from sorted.length |
| SITE-05 | LLMs.txt updated with correct language count | src/pages/llms.txt.ts lines 89, 94, 95; src/pages/llms-full.txt.ts lines 143, 184 |
| SITE-06 | PROJECT.md updated with Lisp-related validated requirements | v1.11 section exists at line 210; "25 languages" references at lines 5, 84, 95, 96, 101, 104, 256 need updating; add validated requirement lines |
| SITE-07 | Full `astro build` passes with Lisp detail page, OG image, and all VS comparison pages generated | Build verification documented -- `getStaticPaths` auto-generates Lisp pages from collection data |
</phase_requirements>

## Standard Stack

### Core (no additions needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site generator | All pages auto-generated from languages.json via getStaticPaths |
| astro-expressive-code | 0.41.6 | Code syntax highlighting | Already handles common-lisp grammar for Lisp snippets |

### Supporting

No additional libraries needed. This phase modifies only existing text strings and documentation.

### Alternatives Considered

None -- this is a text replacement and build verification phase.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Complete Inventory of "25 -> 26" Replacements

This is the core deliverable of this research: an exhaustive, verified list of every file and line that needs updating.

#### Category 1: Page Components and Meta (14 replacements in 6 files)

| File | Line | Current Text | New Text |
|------|------|-------------|----------|
| `src/pages/beauty-index/index.astro` | 30 | `ranks 25 programming languages` | `ranks 26 programming languages` |
| `src/pages/beauty-index/index.astro` | 32 | `Ranking 25 programming languages` | `Ranking 26 programming languages` |
| `src/pages/beauty-index/index.astro` | 47 | `Ranking 25 programming languages` | `Ranking 26 programming languages` |
| `src/pages/beauty-index/index.astro` | 124 | `Ranking 25 Programming Languages` | `Ranking 26 Programming Languages` |
| `src/pages/beauty-index/[slug].astro` | 80 | `among 25 programming languages` | `among 26 programming languages` |
| `src/pages/beauty-index/code/index.astro` | 29 | `Compare how 25 programming languages` | `Compare how 26 programming languages` |
| `src/pages/beauty-index/code/index.astro` | 31 | `across 25 programming languages` | `across 26 programming languages` |
| `src/pages/beauty-index/code/index.astro` | 39 | `See how 25 languages` | `See how 26 languages` |
| `src/pages/beauty-index/justifications/index.astro` | 31 | `25 languages, 6 dimensions, 150 justifications` | `26 languages, 6 dimensions, 156 justifications` |
| `src/pages/beauty-index/justifications/index.astro` | 33 | `for 25 programming languages` | `for 26 programming languages` |
| `src/pages/index.astro` | 181 | `25 programming languages ranked` | `26 programming languages ranked` |
| `src/components/BeautyIndexJsonLd.astro` | 23 | `Ranking 25 programming languages` | `Ranking 26 programming languages` |
| `src/components/beauty-index/RankingBarChart.astro` | 84 | `all 25 languages sorted` | `all 26 languages sorted` |
| `src/lib/og-image.ts` | 618 | `Ranking 25 programming languages` | `Ranking 26 programming languages` |

#### Category 2: LLMs.txt Machine-Readable Files (5 replacements in 2 files)

| File | Line | Current Text | New Text |
|------|------|-------------|----------|
| `src/pages/llms.txt.ts` | 89 | `ranks 25 programming languages` | `ranks 26 programming languages` |
| `src/pages/llms.txt.ts` | 94 | `25 languages compared` | `26 languages compared` |
| `src/pages/llms.txt.ts` | 95 | `150 editorial justifications` | `156 editorial justifications` |
| `src/pages/llms-full.txt.ts` | 143 | `ranking of 25 programming languages` | `ranking of 26 programming languages` |
| `src/pages/llms-full.txt.ts` | 184 | `600 comparison pages available (25 x 24)` | `650 comparison pages available (26 x 25)` |

#### Category 3: Blog Post Content (7 replacements in 2 files)

| File | Line | Current Text | New Text |
|------|------|-------------|----------|
| `src/data/blog/the-beauty-index.mdx` | 3 | `ranks 25 programming languages` (frontmatter description) | `ranks 26 programming languages` |
| `src/data/blog/the-beauty-index.mdx` | 30 | `ranking of 25 programming languages` | `ranking of 26 programming languages` |
| `src/data/blog/the-beauty-index.mdx` | 36 | `**25 languages** scored` | `**26 languages** scored` |
| `src/data/blog/the-beauty-index.mdx` | 227 | `for all 25 languages` (in long line) | `for all 26 languages` |
| `src/data/blog/the-beauty-index.mdx` | 229 | `all 25 languages side by side` | `all 26 languages side by side` |
| `src/data/blog/building-kubernetes-observability-stack.mdx` | 173 | `25 languages are scored` | `26 languages are scored` |

Note: Line 16 of the-beauty-index.mdx contains "2013/03/25" which is a date in a RedMonk URL -- do NOT change this.

#### Category 4: Code Comments (8 replacements in 7 files)

| File | Line | Current Text | New Text |
|------|------|-------------|----------|
| `src/pages/beauty-index/[slug].astro` | 4 | `Generates 25 static pages` (comment) | `Generates 26 static pages` |
| `src/pages/beauty-index/code/index.astro` | 5 | `for all 25 languages. All 250 code blocks` (comment) | `for all 26 languages. All 260 code blocks` |
| `src/pages/beauty-index/justifications/index.astro` | 5 | `for all 25 languages` (comment) | `for all 26 languages` |
| `src/pages/beauty-index/vs/[slug].astro` | 4 | `600 static pages (25 x 24)` (comment) | `650 static pages (26 x 25)` |
| `src/components/BeautyIndexJsonLd.astro` | 5 | `list all 25 languages` (comment) | `list all 26 languages` |
| `src/components/beauty-index/FeatureMatrix.astro` | 4 | `25-row x 10-column` (comment) | `26-row x 10-column` |
| `src/data/beauty-index/code-features.ts` | 3137 | `up to 25 languages` (comment) | `up to 26 languages` |

**Note:** Three data file comments were already updated by Phase 69:
- `src/data/beauty-index/code-features.ts` line 28: already says "All 26 language IDs"
- `src/data/beauty-index/justifications.ts` line 2: already says "all 26 Beauty Index languages"
- `src/data/beauty-index/snippets.ts` line 12: already says "all 26 Beauty Index languages"

#### Category 5: PROJECT.md Documentation Updates

| File | Line(s) | Current Text | New Text |
|------|---------|-------------|----------|
| `.planning/PROJECT.md` | 5 | `25 programming languages ranked across 6 aesthetic dimensions` | `26 programming languages ranked across 6 aesthetic dimensions` |
| `.planning/PROJECT.md` | 84 | `for 25 languages across 6 dimensions` | `for 26 languages across 6 dimensions` |
| `.planning/PROJECT.md` | 95 | `25 radar charts in overview grid` | `26 radar charts in overview grid` |
| `.planning/PROJECT.md` | 96 | `for all 25 languages` | `for all 26 languages` |
| `.planning/PROJECT.md` | 101 | `All 25 languages per tab with syntax-highlighted code blocks (240 total)` | `All 26 languages per tab with syntax-highlighted code blocks (260 total)` |
| `.planning/PROJECT.md` | 104 | `overview and all 25 language pages` | `overview and all 26 language pages` |
| `.planning/PROJECT.md` | 256 | `25 languages ranked...25 detail pages...240 code blocks` | `26 languages ranked...26 detail pages...260 code blocks` |

Additionally, PROJECT.md needs new validated requirement lines under the v1.11 section for DATA-01 through SITE-07 (the Lisp milestone requirements). The pattern follows existing validated requirements: lines starting with `- checkmark` symbol + description + ` -- v1.11`.

### Pattern: Files That Need NO Changes (Auto-Generated)

These files dynamically derive all content from the languages collection and require zero modifications:

- `src/pages/beauty-index/[slug].astro` -- getStaticPaths() auto-generates `/beauty-index/lisp/`
- `src/pages/beauty-index/vs/[slug].astro` -- double loop auto-generates 50 new VS pages
- `src/pages/open-graph/beauty-index/[slug].png.ts` -- auto-generates `/open-graph/beauty-index/lisp.png`
- `src/pages/open-graph/beauty-index/vs/[slug].png.ts` -- auto-generates 50 new VS OG images
- `src/components/BeautyIndexJsonLd.astro` -- `numberOfItems` computed from `sorted.length` (already correct)
- All components that receive language data via props (ScoringTable, LanguageGrid, RadarChart, etc.)

### Anti-Patterns to Avoid

- **Changing `numberOfItems` in BeautyIndexJsonLd.astro:** This is already computed from `sorted.length`, not hardcoded. Do not add a hardcoded 26.
- **Updating the RedMonk URL date in the-beauty-index.mdx:** Line 16 contains "2013/03/25" which is a date in a URL, not a language count.
- **Updating "25 years" in justifications.ts:** Line 173 says "25 years" referring to C#'s age, not the language count.
- **Updating the "Efficiency 25%" scoring weight in PROJECT.md:** Line 130 contains "Efficiency 25%" which is a Dockerfile Analyzer weight, not a language count.
- **Skipping the build verification:** The build must be run AFTER all text changes to confirm Lisp pages generate correctly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding all "25" references | Manual memory or incomplete grep | Exact file/line inventory above | Missing even one instance creates SEO inconsistency |
| Verifying zero remaining "25 languages" | Manual page-by-page review | `grep -r "25 languages" dist/` on built output | Automated verification catches anything missed in source |
| Updating derived counts | Re-deriving from formulas | Direct lookup (26x6=156, 26x10=260, 26x25=650) | Simple arithmetic, no need to compute at runtime |

**Key insight:** The prior milestone research (ARCHITECTURE.md, PITFALLS.md) already did the hard investigative work. This phase is execution against a known checklist.

## Common Pitfalls

### Pitfall 1: Missing a "25" Instance in Source

**What goes wrong:** Build passes, but Google caches a meta description saying "25 languages" while the page content shows 26. OG images shared on social media show stale counts.
**Why it happens:** Text search for "25" returns false positives (line numbers, CSS values, unrelated numbers). Developer updates the obvious ones and misses edge cases like the OG image render text at og-image.ts:618 or the citation text at index.astro:124.
**How to avoid:** Use the exact file/line inventory in the Architecture Patterns section above. After all edits, grep the built `dist/` output for any surviving "25 languages" or "25 programming" strings.
**Warning signs:** `grep -r "25 language" dist/` returns any results after build.

### Pitfall 2: Changing "25" That Is NOT a Language Count

**What goes wrong:** Breaking a URL (the RedMonk link "2013/03/25"), corrupting a scoring weight ("Efficiency 25%"), or altering C#'s age description ("25 years").
**Why it happens:** Overly aggressive find-and-replace without understanding context.
**How to avoid:** Only modify lines explicitly listed in the inventory. Do not do a blind find-and-replace of all "25" occurrences. The inventory above excludes all false positives.
**Warning signs:** Build errors, broken links, incorrect percentages in unrelated tools.

### Pitfall 3: Forgetting Derived Count Updates

**What goes wrong:** Page says "26 languages" but also says "150 justifications" (should be 156 = 26x6), "250 code blocks" (should be 260 = 26x10), or "600 comparison pages" (should be 650 = 26x25).
**Why it happens:** Developer updates the primary "25" count but forgets the derived arithmetic.
**How to avoid:** The inventory above includes ALL derived counts. The three derived counts are:
- 25x6=150 justifications -> 26x6=156 justifications (justifications/index.astro line 31, llms.txt.ts line 95)
- 25x10=250 code blocks -> 26x10=260 code blocks (code/index.astro line 5 comment only)
- 25x24=600 VS pages -> 26x25=650 VS pages (vs/[slug].astro line 4 comment, llms-full.txt.ts line 184)
**Warning signs:** Inconsistent numbers on the same page (e.g., "26 languages, 150 justifications").

### Pitfall 4: Not Running Build Before Declaring Done

**What goes wrong:** All text changes look correct in source, but the build fails because of an unrelated issue (TypeScript error, missing import, stale cache).
**Why it happens:** Developer assumes text-only changes cannot break the build.
**How to avoid:** Run `astro build` as the final verification step. Check that:
1. Build completes with zero errors
2. `dist/beauty-index/lisp/index.html` exists (Lisp detail page generated)
3. `dist/open-graph/beauty-index/lisp.png` exists (Lisp OG image generated)
4. VS comparison pages count is correct (should be 650 = 26x25)
5. `grep -r "25 languages" dist/` returns zero results from built HTML
**Warning signs:** Build errors, missing pages in dist/, grep returning matches.

### Pitfall 5: Forgetting to Update PROJECT.md v1.11 Validated Requirements

**What goes wrong:** SITE-06 requirement is not satisfied. The v1.11 section in PROJECT.md does not list the completed requirements with checkmarks.
**Why it happens:** The project uses PROJECT.md as the canonical record of validated requirements per milestone, and it is easy to forget this documentation step.
**How to avoid:** Add validated requirement lines under the v1.11 section, following the existing pattern: `- checkmark Description -- v1.11`. This should cover all 21 v1.11 requirements (DATA-01 through DATA-04, CODE-01 through CODE-10, SITE-01 through SITE-07).
**Warning signs:** `grep "v1.11" .planning/PROJECT.md` does not show validated requirement lines.

## Code Examples

### Verified Pattern: Text Replacement in Astro Page

```astro
// Source: src/pages/beauty-index/index.astro (verified in codebase)

// BEFORE (line 30):
description="The Beauty Index ranks 25 programming languages across 6 aesthetic dimensions..."

// AFTER:
description="The Beauty Index ranks 26 programming languages across 6 aesthetic dimensions..."
```

### Verified Pattern: OG Image Satori Render Text

```typescript
// Source: src/lib/og-image.ts (verified at line 618)

// BEFORE:
children: 'Ranking 25 programming languages across 6 aesthetic dimensions',

// AFTER:
children: 'Ranking 26 programming languages across 6 aesthetic dimensions',
```

### Verified Pattern: JSON-LD Structured Data

```astro
// Source: src/components/BeautyIndexJsonLd.astro (verified at line 23)

// BEFORE:
"description": "Ranking 25 programming languages across 6 aesthetic dimensions: ..."

// AFTER:
"description": "Ranking 26 programming languages across 6 aesthetic dimensions: ..."

// NOTE: numberOfItems at line 48 is already dynamic:
"numberOfItems": sorted.length,   // Auto-computes to 26 -- DO NOT hardcode
```

### Verified Pattern: MDX Blog Post Update

```mdx
// Source: src/data/blog/the-beauty-index.mdx

// BEFORE (frontmatter line 3):
description: "...The Beauty Index ranks 25 programming languages across..."

// AFTER:
description: "...The Beauty Index ranks 26 programming languages across..."

// BEFORE (line 36):
- **25 languages** scored across **6 aesthetic dimensions**

// AFTER:
- **26 languages** scored across **6 aesthetic dimensions**
```

### Verified Pattern: LLMs.txt Derived Count Update

```typescript
// Source: src/pages/llms.txt.ts (verified at line 95)

// BEFORE:
'- [Score Justifications](...): 150 editorial justifications across all dimensions',

// AFTER:
'- [Score Justifications](...): 156 editorial justifications across all dimensions',
```

### Build Verification Commands

```bash
# 1. Run the full build
npx astro build

# 2. Verify Lisp detail page exists
ls dist/beauty-index/lisp/index.html

# 3. Verify Lisp OG image exists
ls dist/open-graph/beauty-index/lisp.png

# 4. Count VS pages (should be 650)
ls dist/beauty-index/vs/*/index.html | wc -l

# 5. Verify zero "25 languages" in built output
grep -r "25 languages" dist/ | grep -v node_modules || echo "PASS: No '25 languages' found"
grep -r "25 programming" dist/ | grep -v node_modules || echo "PASS: No '25 programming' found"

# 6. Verify "26 languages" appears in key pages
grep "26 languages" dist/beauty-index/index.html && echo "PASS: Overview updated"
grep "26 programming" dist/beauty-index/code/index.html && echo "PASS: Code page updated"
grep "26 programming" dist/llms.txt && echo "PASS: LLMs.txt updated"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 25 languages hardcoded across 28+ locations | Must update to 26 | This phase | All user-facing, SEO, and machine-readable references must be consistent |
| 150 justifications (25x6) | 156 justifications (26x6) | This phase | Justifications page meta description and llms.txt |
| 250 code blocks (25x10) | 260 code blocks (26x10) | This phase | Code comparison page comment only |
| 600 VS pages (25x24) | 650 VS pages (26x25) | This phase | VS page comment and llms-full.txt.ts |

**Already updated (Phase 69):**
- `code-features.ts` line 28 comment: already "All 26 language IDs"
- `justifications.ts` line 2 comment: already "all 26 Beauty Index languages"
- `snippets.ts` line 12 comment: already "all 26 Beauty Index languages"

## Open Questions

1. **Blog post editorial enrichment**
   - What we know: All "25" references must become "26" per SITE-02. The basic update is clear.
   - What's unclear: Whether the blog post should also mention Lisp by name (e.g., "26 languages including Lisp") or just update the number silently.
   - Recommendation: Simple numeric update only. The blog post is a methodology essay, not a changelog. Adding "including Lisp" would require deciding where to place it and risks making the post feel like a versioned document. Keep edits minimal.

2. **PROJECT.md "What This Is" section wording**
   - What we know: Line 5 contains "25 programming languages" in a long prose paragraph describing the site.
   - What's unclear: Whether the paragraph should also mention Lisp specifically.
   - Recommendation: Just update the number. The "What This Is" section describes capabilities, not individual languages.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** -- all 14 source files read directly via Read tool, every line number verified against current file content (2026-03-02)
- **ARCHITECTURE.md research** -- `.planning/research/ARCHITECTURE.md` lines 168-231, comprehensive "25 -> 26" inventory compiled during v1.11 milestone research (2026-03-01)
- **PITFALLS.md research** -- `.planning/research/PITFALLS.md` lines 1-46, "Incomplete Hardcoded 25 Languages Text Updates" pitfall with full file list
- **Phase 69 summary** -- `.planning/phases/69-lisp-data-foundation/69-01-SUMMARY.md` line 54, confirmed three data file comments already updated to "26"

### Secondary (MEDIUM confidence)
- **Derived count arithmetic** -- 26x6=156, 26x10=260, 26x25=650 are simple math, verified against existing patterns (25x6=150, 25x10=250, 25x24=600)

### Tertiary (LOW confidence)
- None -- all claims verified against primary sources in the codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, no configuration changes, pure text editing
- Architecture: HIGH -- complete file/line inventory verified against current codebase, cross-referenced with ARCHITECTURE.md and PITFALLS.md research
- Pitfalls: HIGH -- all pitfalls are well-understood patterns from prior milestone research; false-positive "25" instances identified and documented
- Build verification: HIGH -- Astro's getStaticPaths auto-generation pattern verified by reading OG image and VS page route files

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable -- line numbers may shift if other phases modify these files first, but anchoring on text content is reliable)
