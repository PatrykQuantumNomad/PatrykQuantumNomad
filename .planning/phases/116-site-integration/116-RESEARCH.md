# Phase 116: Site Integration - Research

**Researched:** 2026-04-12
**Domain:** Astro site integration (LLMs.txt, sitemap, guide metadata, cross-references, Lighthouse)
**Confidence:** HIGH

## Summary

Phase 116 is a site-wide integration sweep for the v1.19 Claude Code Guide Refresh milestone. The phase touches no new libraries or frameworks -- all work operates within the existing Astro 5.17 static site and its established patterns for LLMs.txt generation, sitemap automation, guide.json metadata, MDX frontmatter, and cross-reference links. The site already has 14 chapters registered in guide.json, all with `lastVerified: 2026-04-12` and `updatedDate: 2026-04-12` frontmatter, and 77 cross-reference links across the 14 chapter MDX files.

The primary work is: (1) adding a cheatsheet entry to both `llms.txt.ts` and `llms-full.txt.ts` since the cheatsheet is an Astro page not a content collection item and therefore not auto-included, (2) verifying the guide.json already has 14 chapters with correct descriptions, (3) confirming the guide landing page and guides hub dynamically render the chapter count, (4) verifying the sitemap auto-includes all new pages on build, and (5) running Lighthouse against all updated/new pages to confirm 90+ scores.

**Primary recommendation:** The LLMs.txt cheatsheet entry is the only file edit that definitely requires new code. The guide.json, landing page, and sitemap are already correct from prior phases. The cross-reference audit and Lighthouse runs are verification tasks, not code changes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UPD-12 | All updated chapters have bumped lastVerified and updatedDate frontmatter | All 14 MDX files already have `lastVerified: 2026-04-12` and `updatedDate: 2026-04-12` -- needs verification sweep only |
| UPD-14 | Cross-references verified across all 11 chapters (30+ bidirectional links intact) | 77 cross-references found across 14 files using `/guides/claude-code/` pattern -- verification script needed |
| SITE-01 | LLMs.txt entries updated for cheatsheet page and new chapters | New chapters auto-included via `claudeCodePages` collection; cheatsheet page MISSING from both llms.txt.ts and llms-full.txt.ts -- manual addition required |
| SITE-02 | guide.json metadata updated (chapter count, descriptions) | guide.json already has 14 chapters with full descriptions -- verification only |
| SITE-03 | Guide landing page reflects new chapter count and cheatsheet link | Landing page dynamically reads from guide.json (already 14); cheatsheet already in Resources section -- verification only |
| SITE-04 | Sitemap includes all new pages | Astro @astrojs/sitemap auto-generates from pages -- all new .astro and .mdx pages included at build time -- verification via build |
| SITE-05 | Lighthouse 90+ on all updated and new pages | Lighthouse 13.0.3 available globally; needs `npm run build && npm run preview` then headless Lighthouse runs |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **SEO priority:** Keyword-rich content, backlinks, structured formatting -- all Lighthouse and LLMs.txt work serves this
- **GitHub-flavored Markdown compatibility:** Not directly relevant to this phase (site pages, not README)
- **Professional tone:** Applies to any text additions in LLMs.txt entries

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.17.1 | Static site generator | Already in use, generates sitemap and pages at build time [VERIFIED: npx astro --version] |
| @astrojs/sitemap | (bundled) | Auto sitemap generation | Already configured in astro.config.mjs with custom serialize rules [VERIFIED: astro.config.mjs] |
| Lighthouse | 13.0.3 | Performance/accessibility auditing | Already installed globally [VERIFIED: lighthouse --version] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| IndexNow | (custom integration) | Search engine URL submission | Auto-submits on CI builds, no manual action needed [VERIFIED: src/integrations/indexnow.ts] |

### Alternatives Considered
None -- this phase uses only existing tooling.

**Installation:**
No new packages required. All dependencies already present.

## Architecture Patterns

### Existing Project Structure (relevant files)
```
src/
  pages/
    llms.txt.ts              # Compact LLMs.txt endpoint (auto-generated)
    llms-full.txt.ts         # Full LLMs.txt endpoint (auto-generated)
    guides/
      index.astro            # Guides hub (dynamic chapter count)
      claude-code/
        index.astro          # Guide landing page (dynamic from guide.json)
        [slug].astro         # Chapter page template
        cheatsheet.astro     # Standalone cheatsheet page (NOT in content collection)
  data/
    guides/claude-code/
      guide.json             # Guide metadata with 14 chapters
      pages/*.mdx            # 14 chapter MDX files
  content.config.ts          # Content collection definitions
  lib/guides/
    schema.ts                # guidePageSchema (lastVerified, updatedDate fields)
    routes.ts                # guidePageUrl(), guideLandingUrl()
astro.config.mjs             # Sitemap config with serialize rules
```

### Pattern 1: LLMs.txt Generation
**What:** Both `llms.txt.ts` and `llms-full.txt.ts` are Astro API routes that dynamically build text from content collections at build time. [VERIFIED: src/pages/llms.txt.ts]
**When to use:** Adding new content sections that should be discoverable by LLMs
**Key detail:** The Claude Code section in both files iterates `claudeCodePagesList` (from the `claudeCodePages` content collection). The cheatsheet page is an Astro page (`cheatsheet.astro`), NOT a content collection item, so it is NOT automatically included. It must be added as a hardcoded entry after the collection loop.

**llms.txt.ts pattern (compact):**
```typescript
// Existing pattern for Claude Code chapters (line 240-242)
...claudeCodePagesList
  .sort((a, b) => a.data.order - b.data.order)
  .map(p => `- [${p.data.title}](https://patrykgolabek.dev${guidePageUrl(claudeCodeMeta.data.slug, p.data.slug)}): ${p.data.description}`),
// Cheatsheet needs to be added as a static entry after this spread
```

**llms-full.txt.ts pattern (expanded):**
```typescript
// Existing pattern (line 398-402)
for (const page of claudeCodePagesList.sort((a, b) => a.data.order - b.data.order)) {
  lines.push(`- ${page.data.title}`);
  lines.push(`  URL: https://patrykgolabek.dev${guidePageUrl(claudeCodeMeta.data.slug, page.data.slug)}`);
  lines.push(`  Description: ${page.data.description}`);
}
// Cheatsheet needs to be appended after this loop
```

### Pattern 2: Dynamic Chapter Count
**What:** The guide landing page and guides hub both dynamically derive the chapter count from `guide.json` chapters array length. [VERIFIED: src/pages/guides/index.astro, src/pages/guides/claude-code/index.astro]
**Implication:** Since guide.json already has 14 chapters (verified), no code changes needed for SITE-02 and SITE-03 chapter count.

### Pattern 3: Sitemap Auto-Generation
**What:** `@astrojs/sitemap` generates sitemap entries for all Astro pages at build time. The `serialize` function in `astro.config.mjs` adds `lastmod`, `changefreq`, and `priority`. [VERIFIED: astro.config.mjs]
**Implication:** New pages (cheatsheet, plugins, agent-sdk, computer-use chapters) are automatically included in the sitemap. The `lastmod` for guide pages is sourced from guide.json `publishedDate` (line 57-63 of astro.config.mjs), so all 14 chapters share the same lastmod. No code changes needed for SITE-04.

### Pattern 4: MDX Frontmatter Dates
**What:** Each MDX chapter file has `lastVerified` and `updatedDate` fields validated by `guidePageSchema`. [VERIFIED: src/lib/guides/schema.ts]
**Current state:** All 14 chapters already have `lastVerified: 2026-04-12` and `updatedDate: 2026-04-12`. [VERIFIED: sampled models-and-costs.mdx, plugins.mdx, introduction.mdx, computer-use.mdx]

### Pattern 5: Cross-References
**What:** Chapters link to each other using absolute paths like `/guides/claude-code/[slug]/`. [VERIFIED: grep across all 14 MDX files]
**Current count:** 77 occurrences of `/guides/claude-code/` across 14 files. The requirement says "30+ bidirectional links" -- the actual count is 77 total link occurrences, which includes self-references (links to landing page) and forward/backward chapter links.
**Valid slugs:** introduction, context-management, models-and-costs, environment, remote-and-headless, mcp, custom-skills, hooks, worktrees, agent-teams, security, plugins, agent-sdk, computer-use

### Anti-Patterns to Avoid
- **Hardcoding chapter count in templates:** The homepage has "14 chapters" hardcoded in text (index.astro line 289). This is acceptable for marketing copy but should be noted. The guides hub page uses dynamic count.
- **Forgetting the cheatsheet in LLMs.txt:** Since it is not part of the content collection, it will not appear automatically. This is the primary gap this phase addresses.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap entries | Manual XML editing | @astrojs/sitemap auto-generation | Astro handles this at build time; manual edits would be overwritten |
| Chapter count display | Hardcoded numbers | `guideMeta.data.chapters.length` | Already used in guides/index.astro; stays correct when chapters change |
| Cross-reference validation | Manual link-by-link checking | grep + slug validation script | 77 links across 14 files -- manual checking is error-prone |
| Lighthouse scoring | Manual browser DevTools | CLI `lighthouse` with `--output json` | Automated, repeatable, supports multiple URLs in sequence |

**Key insight:** This phase is primarily a verification and gap-filling phase, not a feature-building phase. Most work was completed in prior phases. The only code change needed is the cheatsheet entry in LLMs.txt files.

## Common Pitfalls

### Pitfall 1: Cheatsheet Not in Content Collection
**What goes wrong:** The cheatsheet page (`cheatsheet.astro`) is not part of the `claudeCodePages` content collection. It does not appear in the auto-generated LLMs.txt output.
**Why it happens:** The cheatsheet is a standalone Astro page, not an MDX file in the content collection. The LLMs.txt generators iterate only over the content collection.
**How to avoid:** Add the cheatsheet as a static line entry in both `llms.txt.ts` and `llms-full.txt.ts` after the collection-derived chapter list.
**Warning signs:** Searching for "cheatsheet" in the built `dist/llms.txt` returns no results (confirmed).

### Pitfall 2: Broken Cross-References to New Chapters
**What goes wrong:** Links like `/guides/claude-code/plugins/` return 404 if the chapter slug doesn't match.
**Why it happens:** A slug typo in the cross-reference link or a mismatch between the link and the MDX file's `slug` frontmatter value.
**How to avoid:** Extract all unique `/guides/claude-code/[slug]/` patterns from cross-references and validate each against the set of actual slugs from the 14 MDX files.
**Warning signs:** `npm run build` may not catch dead internal links (Astro does not validate internal links at build time by default).

### Pitfall 3: Lighthouse Scores Below 90 Due to Large SVGs
**What goes wrong:** The cheatsheet page embeds two full SVG images (`claude-code-cheatsheet.svg` and `claude-code-cheatsheet-print.svg`). These can be large and affect Lighthouse performance scores.
**Why it happens:** SVGs loaded via `<img>` tags with `loading="lazy"` still contribute to DOM size metrics and can affect LCP if above the fold.
**How to avoid:** The cheatsheet page already uses `loading="lazy"` on both images. Ensure no preload hints are added that would defeat lazy loading.
**Warning signs:** Lighthouse performance score below 90 specifically on the cheatsheet page.

### Pitfall 4: Lastmod Not Updating in Sitemap for Guide Pages
**What goes wrong:** The sitemap's `lastmod` for guide chapter pages uses `guide.json`'s `publishedDate`, not individual chapter `updatedDate` values.
**Why it happens:** The `buildContentDateMap()` function in `astro.config.mjs` reads guide.json at config load time and assigns the guide-level `publishedDate` to all chapter URLs (lines 53-65).
**How to avoid:** This is by design. If per-chapter lastmod precision is desired, the `buildContentDateMap` function would need to also read individual MDX frontmatter. However, for this phase, the current behavior is acceptable since all chapters were updated on the same date.
**Warning signs:** Sitemap shows old dates for chapter pages.

## Code Examples

### Adding Cheatsheet to llms.txt.ts
```typescript
// Source: [VERIFIED: existing pattern in src/pages/llms.txt.ts lines 240-242]
// After the claudeCodePagesList spread, add:
'- [Claude Code Cheatsheet](https://patrykgolabek.dev/guides/claude-code/cheatsheet/): Every keyboard shortcut, slash command, and mode toggle for Claude Code interactive sessions. Download printable SVG cheatsheets.',
```

### Adding Cheatsheet to llms-full.txt.ts
```typescript
// Source: [VERIFIED: existing pattern in src/pages/llms-full.txt.ts lines 398-402]
// After the for loop over claudeCodePagesList, add:
lines.push('- Claude Code Cheatsheet');
lines.push('  URL: https://patrykgolabek.dev/guides/claude-code/cheatsheet/');
lines.push('  Description: Every keyboard shortcut, slash command, and mode toggle for Claude Code interactive sessions. Download printable SVG cheatsheets for interactive (dark) and print-friendly (light) versions.');
```

### Cross-Reference Validation (verification script approach)
```bash
# Extract all unique cross-reference slugs from chapter MDX files
grep -ohP '/guides/claude-code/[a-z-]+/' src/data/guides/claude-code/pages/*.mdx | \
  sort -u | \
  sed 's|/guides/claude-code/||;s|/||'

# Compare against actual MDX file slugs
ls src/data/guides/claude-code/pages/*.mdx | \
  xargs grep -h '^slug:' | \
  awk '{print $2}' | tr -d '"' | sort

# Any slug in the first list but not the second is a broken link
```

### Lighthouse CLI Usage
```bash
# Build and preview the site first
npm run build && npm run preview &

# Run Lighthouse on a specific page (headless Chrome)
lighthouse https://localhost:4321/guides/claude-code/cheatsheet/ \
  --output json --output html \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo

# Run against multiple pages in sequence
for page in introduction context-management models-and-costs environment \
  remote-and-headless mcp custom-skills hooks worktrees agent-teams \
  security plugins agent-sdk computer-use cheatsheet; do
  lighthouse "https://localhost:4321/guides/claude-code/$page/" \
    --output json --quiet \
    --chrome-flags="--headless --no-sandbox" \
    | jq '{url: .finalUrl, performance: .categories.performance.score, accessibility: .categories.accessibility.score, bestPractices: .categories["best-practices"].score, seo: .categories.seo.score}'
done
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual sitemap.xml | @astrojs/sitemap auto-generation | Astro 2.0+ | No manual XML editing needed; pages auto-included |
| Hardcoded chapter counts | Dynamic from guide.json | Phase 112 | Landing page and guides hub always accurate |
| No LLMs.txt | Build-time API route generation | v1.15 (approx) | LLMs can discover site content programmatically |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (installed as devDep) |
| Config file | vitest may use default config -- check at execution time |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npm run build` (build-time validation is the primary gate) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPD-12 | All 14 chapters have lastVerified and updatedDate set to 2026-04-12 | smoke | `grep -c 'lastVerified: 2026-04-12' src/data/guides/claude-code/pages/*.mdx` (expect 14) | N/A (grep check) |
| UPD-14 | All cross-reference slugs resolve to existing chapters | smoke | Custom slug extraction + comparison (see Code Examples) | N/A (script) |
| SITE-01 | Cheatsheet entry present in built llms.txt | integration | `npm run build && grep 'cheatsheet' dist/llms.txt` | N/A (build + grep) |
| SITE-02 | guide.json has 14 chapters | smoke | `node -e "const g=require('./src/data/guides/claude-code/guide.json'); console.log(g[0].chapters.length)"` (expect 14) | N/A (node check) |
| SITE-03 | Guide landing page shows dynamic chapter count | integration | Build + check rendered HTML | N/A (build check) |
| SITE-04 | All new pages in sitemap | integration | `npm run build && grep -c 'claude-code' dist/sitemap-0.xml` (expect 16+: landing + 14 chapters + cheatsheet) | N/A (build + grep) |
| SITE-05 | Lighthouse 90+ on all pages | e2e | Lighthouse CLI in headless mode (see Code Examples) | N/A (CLI) |

### Sampling Rate
- **Per task commit:** `npm run build` (catches broken imports, bad templates)
- **Per wave merge:** Full build + Lighthouse on key pages
- **Phase gate:** Full Lighthouse sweep on all 16 guide URLs before /gsd-verify-work

### Wave 0 Gaps
None -- existing build pipeline and Lighthouse CLI cover all phase requirements. No new test infrastructure needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | Yes | v24.11.1 | -- |
| Astro | Site generation | Yes | 5.17.1 | -- |
| Lighthouse | SITE-05 scoring | Yes | 13.0.3 | -- |
| Chrome/Chromium | Lighthouse headless | Yes (bundled with Lighthouse) | -- | -- |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lighthouse 13.0.3 bundles its own Chromium for headless runs | Environment Availability | Would need to install Chrome separately; low risk since Lighthouse auto-downloads |
| A2 | The `buildContentDateMap` function uses guide.json publishedDate for all chapter lastmod values | Pitfall 4 | If it reads individual MDX dates, behavior differs from what's documented; low impact |

## Open Questions

1. **Lighthouse preview server port**
   - What we know: `npm run preview` starts Astro preview server, default port 4321
   - What's unclear: Whether the port is configurable or might conflict
   - Recommendation: Check `astro preview` output for actual port before running Lighthouse

2. **Cross-reference count discrepancy**
   - What we know: Requirements say "30+ bidirectional links" but actual count is 77 occurrences of `/guides/claude-code/` across 14 files
   - What's unclear: Whether all 77 are inter-chapter cross-references (some may be links to the landing page itself)
   - Recommendation: During verification, distinguish links to other chapters from links to the landing page. Both are valid; the "30+" threshold is easily met.

## Sources

### Primary (HIGH confidence)
- `src/pages/llms.txt.ts` -- Verified cheatsheet is missing from LLMs.txt output
- `src/pages/llms-full.txt.ts` -- Verified cheatsheet is missing from full output
- `src/data/guides/claude-code/guide.json` -- Verified 14 chapters with descriptions
- `src/data/guides/claude-code/pages/*.mdx` -- Verified all 14 files have lastVerified/updatedDate
- `src/pages/guides/index.astro` -- Verified dynamic chapter count from `chapters.length`
- `src/pages/guides/claude-code/index.astro` -- Verified dynamic chapter grid from guide.json
- `astro.config.mjs` -- Verified sitemap auto-generation with serialize rules
- `src/lib/guides/schema.ts` -- Verified guidePageSchema includes lastVerified and updatedDate
- `lighthouse --version` -- Verified Lighthouse 13.0.3 available

### Secondary (MEDIUM confidence)
- Phase 110 plans (110-01, 110-03) -- Verified prior site integration patterns for LLMs.txt and sitemap

### Tertiary (LOW confidence)
- None -- all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in use and verified
- Architecture: HIGH -- all patterns verified against actual source code
- Pitfalls: HIGH -- based on direct codebase inspection, not assumptions

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable -- no framework upgrades expected)
