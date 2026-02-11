---
phase: 03-blog-infrastructure
plan: 02
subsystem: blog
tags: [astro-content-collections, blog-listing, blog-post, prose-typography, reading-time, syntax-highlighting, draft-filtering]

# Dependency graph
requires:
  - phase: 03-blog-infrastructure
    provides: "Blog content collection with Zod schema, expressive-code, reading-time remark plugin, Tailwind typography"
provides:
  - "Blog listing page at /blog/ with draft filtering and chronological sort"
  - "Individual blog post pages at /blog/[slug]/ with prose typography"
  - "BlogCard component for post preview cards"
  - "Reading time display from remark plugin frontmatter"
  - "Syntax-highlighted code blocks with copy buttons via expressive-code"
  - "Draft post exclusion from both listing and page generation in production"
affects: [04-core-static-pages, 05-seo-foundation, 07-enhanced-blog]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Astro 5 getCollection with draft filter callback", "getStaticPaths with post.id for dynamic routes", "render() as standalone import for Astro 5 content", "CSS custom property prose styling (no dark:prose-invert)", "BlogCard component with CollectionEntry type"]

key-files:
  created:
    - "src/components/BlogCard.astro"
    - "src/pages/blog/index.astro"
    - "src/pages/blog/[slug].astro"
  modified: []

key-decisions:
  - "Used post.id (not post.slug) for URLs per Astro 5 API where slug was removed"
  - "Draft filter applied in both listing query AND getStaticPaths to prevent draft page generation"
  - "Prose class without dark:prose-invert since CSS custom properties handle theme switching automatically"
  - "render() imported as standalone function from astro:content (Astro 5 API change)"

patterns-established:
  - "Blog listing uses getCollection callback for draft filtering: import.meta.env.PROD ? data.draft !== true : true"
  - "Dynamic routes use post.id for params and render(post) for content"
  - "BlogCard component accepts CollectionEntry<'blog'> typed prop"
  - "Post pages use prose max-w-none with outer max-w-3xl container for width control"

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 3 Plan 02: Blog Pages and Components Summary

**Blog listing page with draft filtering and post pages with prose typography, syntax highlighting, and reading time**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T17:40:06Z
- **Completed:** 2026-02-11T17:42:39Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created BlogCard component rendering post metadata (title, description, date, tags) with hover effects and accent-colored tag pills
- Built blog listing page at /blog/ that queries the content collection, filters drafts in production, and sorts posts newest-first with empty state handling
- Created individual blog post pages at /blog/[slug]/ with readable prose typography, syntax-highlighted code blocks with copy buttons, reading time, formatted date, tags, and back-to-blog navigation
- Draft posts are excluded from both the listing page and page generation in production builds
- All five Phase 3 requirements (BLOG-01 through BLOG-05) are satisfied

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BlogCard component and blog listing page** - `f07a19e` (feat)
2. **Task 2: Create individual blog post page with prose styling and reading time** - `c94d7f6` (feat)

## Files Created/Modified
- `src/components/BlogCard.astro` - Blog post preview card with title, description, date, tags, and link to post
- `src/pages/blog/index.astro` - Blog listing page with draft filtering, chronological sort, and empty state
- `src/pages/blog/[slug].astro` - Individual post page with prose typography, reading time, syntax highlighting, tags, and back link

## Decisions Made
- **post.id for URLs:** Astro 5 removed post.slug; post.id is the correct identifier for both URL construction and getStaticPaths params
- **Draft filter in getStaticPaths:** Applied the same draft filter in both listing and individual page generation to prevent draft posts from generating accessible pages even if hidden from the listing
- **prose without dark:prose-invert:** The Tailwind typography plugin is configured with CSS custom properties that already respond to the class-based dark mode toggle, so dark:prose-invert is unnecessary and would conflict
- **render() as standalone import:** Astro 5 changed render from a method on the entry to a standalone import from astro:content

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete blog infrastructure is operational: listing, post pages, typography, syntax highlighting, reading time, draft filtering
- All five BLOG requirements (BLOG-01 through BLOG-05) are satisfied
- Ready for Phase 4 (Core Static Pages) which will add Home, Projects, About, and Contact pages
- Blog listing and post pages provide the pattern for future Phase 7 enhancements (tag pages, table of contents, dynamic OG images)

## Self-Check: PASSED

All files verified present on disk. All commit hashes verified in git log.

---
*Phase: 03-blog-infrastructure*
*Completed: 2026-02-11*
