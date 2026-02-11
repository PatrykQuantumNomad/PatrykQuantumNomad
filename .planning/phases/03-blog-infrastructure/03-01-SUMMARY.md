---
phase: 03-blog-infrastructure
plan: 01
subsystem: blog
tags: [astro-content-collections, expressive-code, mdx, tailwind-typography, reading-time, zod]

# Dependency graph
requires:
  - phase: 02-layout-theme
    provides: "Tailwind CSS with class-based dark mode, CSS custom properties, Layout.astro shell"
provides:
  - "Blog content collection with Zod schema and glob loader"
  - "Remark reading-time plugin injecting minutesRead into frontmatter"
  - "Expressive-code syntax highlighting synced with class-based dark mode"
  - "MDX integration for rich blog content"
  - "Tailwind typography plugin with CSS custom property prose overrides"
  - "Sample published blog post with YAML and TypeScript code blocks"
  - "Sample draft blog post for testing draft filtering"
affects: [03-02-PLAN, 05-seo-foundation, 07-enhanced-blog]

# Tech tracking
tech-stack:
  added: ["@astrojs/mdx", "astro-expressive-code", "@tailwindcss/typography", "reading-time", "mdast-util-to-string"]
  patterns: ["Astro 5 content collections with glob loader", "Zod schema validation for frontmatter", "CSS custom property prose theming", "Class-based dark mode for syntax highlighting"]

key-files:
  created:
    - "remark-reading-time.mjs"
    - "src/content.config.ts"
    - "src/data/blog/building-kubernetes-observability-stack.md"
    - "src/data/blog/draft-placeholder.md"
  modified:
    - "package.json"
    - "astro.config.mjs"
    - "tailwind.config.mjs"

key-decisions:
  - "expressiveCode placed before mdx in integrations array (required by astro-expressive-code)"
  - "themeCssSelector maps github-dark to .dark and github-light to :root:not(.dark) for class-based dark mode"
  - "useDarkModeMediaQuery set to false since site uses class-based toggle, not prefers-color-scheme"
  - "Prose uses CSS custom properties (not dark:prose-invert) since custom properties already switch between themes"
  - "Content collection uses Astro 5 glob loader with src/content.config.ts (not root content/config.ts)"

patterns-established:
  - "Blog frontmatter schema: title, description, publishedDate, updatedDate?, tags[], draft"
  - "Blog posts live in src/data/blog/ as .md or .mdx files"
  - "Reading time injected as minutesRead via remark plugin at build time"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 3 Plan 01: Blog Dependencies and Content Collection Summary

**Content collection with Zod schema, expressive-code syntax highlighting synced to class-based dark mode, reading-time remark plugin, and Tailwind typography with CSS custom property prose overrides**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T17:32:21Z
- **Completed:** 2026-02-11T17:35:59Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed 5 blog infrastructure packages (@astrojs/mdx, astro-expressive-code, @tailwindcss/typography, reading-time, mdast-util-to-string)
- Configured expressive-code with github-dark/github-light themes mapped to class-based dark mode toggle
- Created Astro 5 content collection with Zod schema validation for blog frontmatter
- Built remark plugin that auto-calculates reading time and injects it into frontmatter
- Added Tailwind typography plugin with CSS custom property overrides so prose text respects the site theme in both light and dark modes
- Created a real published blog post on Kubernetes observability with YAML and TypeScript code blocks
- Created a draft blog post that is correctly excluded from production builds

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and configure integrations** - `8dbe5e6` (feat)
2. **Task 2: Create content collection schema and sample blog posts** - `cf14c83` (feat)

## Files Created/Modified
- `package.json` - Added 5 blog infrastructure dependencies
- `package-lock.json` - Lockfile updated with 64 new packages
- `astro.config.mjs` - Integrations: expressiveCode (before mdx), mdx, tailwind; markdown.remarkPlugins: [remarkReadingTime]
- `tailwind.config.mjs` - Added @tailwindcss/typography plugin with CSS custom property prose overrides
- `remark-reading-time.mjs` - Remark plugin extracting text from AST and computing reading time via reading-time package
- `src/content.config.ts` - Blog collection definition with Zod schema and glob loader targeting src/data/blog/
- `src/data/blog/building-kubernetes-observability-stack.md` - Published post (~550 words) with Prometheus YAML config and OpenTelemetry TypeScript examples
- `src/data/blog/draft-placeholder.md` - Draft post (draft: true) about AI Agent Architectures with LangGraph

## Decisions Made
- **expressiveCode before mdx:** Required by astro-expressive-code -- it must process code blocks before MDX transforms them
- **themeCssSelector for class-based dark mode:** Maps github-dark theme to `.dark` selector and github-light to `:root:not(.dark)`, matching the existing class-based toggle from Phase 2
- **useDarkModeMediaQuery: false:** Site uses manual class-based dark mode toggle, not OS prefers-color-scheme media queries
- **CSS custom properties for prose (no dark:prose-invert):** Since the site's CSS custom properties already change values between `:root` and `:root.dark`, the typography plugin just references those variables and both modes work automatically
- **Astro 5 content config location:** Used `src/content.config.ts` (not root `content/config.ts`) per Astro 5 requirements with glob loader

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Content collection is fully operational and ready for Plan 02 to query via `getCollection('blog')`
- Both published and draft posts validate against the Zod schema
- Syntax highlighting and typography are configured; Plan 02 just needs to add `prose` classes to the post layout
- Reading time is available in frontmatter as `minutesRead` for Plan 02's post template to display

## Self-Check: PASSED

All files verified present on disk. All commit hashes verified in git log.

---
*Phase: 03-blog-infrastructure*
*Completed: 2026-02-11*
