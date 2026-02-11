---
phase: 07-enhanced-blog-advanced-seo
plan: 01
subsystem: blog, seo
tags: [astro, tags, table-of-contents, llms-txt, content-collection, getStaticPaths]

# Dependency graph
requires:
  - phase: 03-blog-infrastructure
    provides: Content collection with tags schema, blog post pages, BlogCard component
  - phase: 06-visual-effects
    provides: Scroll reveal pattern for blog cards
provides:
  - Dynamic tag listing pages at /blog/tags/[tag]/
  - TableOfContents component for blog posts with heading anchor links
  - LLMs.txt endpoint for AI-friendly content discovery
affects: [07-02-og-images, 07-03-lighthouse-geo]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSS overlay card pattern for independent nested links, conditional component rendering based on content threshold]

key-files:
  created:
    - src/pages/blog/tags/[tag].astro
    - src/components/TableOfContents.astro
    - src/pages/llms.txt.ts
  modified:
    - src/pages/blog/[slug].astro
    - src/components/BlogCard.astro

key-decisions:
  - "BlogCard restructured with CSS absolute overlay to avoid invalid nested <a> tags while keeping full-card clickability"
  - "ToC only renders when 2+ qualifying h2/h3 headings exist to avoid visual clutter on short posts"
  - "LLMs.txt dynamically generated from blog collection at build time per llmstxt.org spec"

patterns-established:
  - "CSS overlay card pattern: article with relative positioning, invisible <a> overlay at z-0, interactive elements at z-10"
  - "Conditional component rendering: component checks data threshold before rendering (filtered.length > 1)"
  - "Static API endpoint pattern: export GET function returning Response with text/plain content type"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 7 Plan 1: Tag Pages, Table of Contents, and LLMs.txt Summary

**Tag listing pages at /blog/tags/[tag]/, auto-generated ToC for posts with 2+ headings, and LLMs.txt endpoint for AI content discovery -- all using built-in Astro APIs with zero new dependencies**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T20:58:10Z
- **Completed:** 2026-02-11T21:02:11Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Tag pages dynamically generated for each unique tag (kubernetes, observability, cloud-native, devops) with filtered, date-sorted post listings
- Tags converted from static spans to clickable links in both blog post pages and blog listing cards, with BlogCard restructured to avoid invalid nested `<a>` HTML
- Table of Contents component renders navigable heading anchor links on posts with 2+ headings, hidden on shorter posts
- LLMs.txt endpoint serves llmstxt.org-compliant plain-text markdown with blog post links and site info

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tag listing pages and convert tag spans to links** - `3413938` (feat)
2. **Task 2: Create TableOfContents component and integrate into blog posts** - `b12aba6` (feat)
3. **Task 3: Create LLMs.txt endpoint** - `1ffd277` (feat)

## Files Created/Modified
- `src/pages/blog/tags/[tag].astro` - Dynamic tag listing page with getStaticPaths, one page per unique tag
- `src/components/TableOfContents.astro` - Reusable ToC component filtering h2/h3 headings with depth-based indentation
- `src/pages/llms.txt.ts` - Static API endpoint serving LLMs.txt-format content from blog collection
- `src/pages/blog/[slug].astro` - Added tag links, ToC integration, headings destructuring from render()
- `src/components/BlogCard.astro` - Restructured to CSS overlay pattern with independent tag links

## Decisions Made
- [07-01]: BlogCard restructured with CSS absolute overlay (`absolute inset-0 z-0`) to avoid invalid nested `<a>` tags; tag links use `relative z-10` for independent clickability
- [07-01]: ToC only renders when `filtered.length > 1` (2+ qualifying headings) to avoid visual clutter on short posts
- [07-01]: LLMs.txt dynamically generated from blog content collection at build time, ensuring new posts are automatically included
- [07-01]: Tag pages use same draft filter pattern as blog index (`import.meta.env.PROD ? data.draft !== true : true`)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Tag pages and ToC complete, ready for Plan 02 (OG image generation with Satori + Sharp)
- Blog post `[slug].astro` already has `headings` destructured, which Plan 02 may reference
- LLMs.txt endpoint established, Plan 03 (Lighthouse + GEO) can add to it if needed

## Self-Check: PASSED

All 5 files verified (3 created, 2 modified). All 3 task commits verified (3413938, b12aba6, 1ffd277).

---
*Phase: 07-enhanced-blog-advanced-seo*
*Completed: 2026-02-11*
