# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** Phase 7 in progress - Enhanced Blog + Advanced SEO.

## Current Position

Phase: 7 of 7 (Enhanced Blog + Advanced SEO)
Plan: 1 of 3 in current phase (done)
Status: Plan 07-01 complete, ready for 07-02
Last activity: 2026-02-11 -- Completed 07-01 (Tag pages, ToC, LLMs.txt)

Progress: [██████████] ~90%

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: ~10 min
- Total execution time: 2.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 - Scaffold + Deploy | 2/2 | 83 min | 42 min |
| 2 - Layout + Theme | 2/2 | 12 min | 6 min |
| 3 - Blog Infrastructure | 2/2 | 7 min | 4 min |
| 4 - Core Static Pages | 2/2 | 6 min | 3 min |
| 5 - SEO Foundation | 2/2 | 6 min | 3 min |
| 6 - Visual Effects | 2/2 | 5 min | 3 min |
| 7 - Enhanced Blog + SEO | 1/3 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 05-02 (3 min), 06-01 (3 min), 06-02 (2 min), 07-01 (4 min)
- Trend: Consistent fast execution on component/page creation tasks

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 7 phases derived from 36 requirements; research flags Phase 6 (particles) and Phase 7 (OG images) as needing deeper investigation
- [01-01]: Astro ^5.3.0 chosen as latest stable; manual scaffold for full control
- [01-01]: tsconfig extends astro/tsconfigs/strict for maximum type safety
- [01-01]: robots.txt pre-references sitemap-index.xml before @astrojs/sitemap is installed
- [01-02]: Used withastro/action@v3 (official Astro build action) instead of custom Node.js build steps
- [01-02]: Concurrency set to cancel-in-progress: false to prevent partial deploys
- [01-02]: Manual DNS and GitHub Pages configuration via web UI required (outside automation scope)
- [02-01]: darkMode: 'class' chosen over 'media' to support manual theme toggle in 02-02
- [02-01]: CSS custom properties for theme-aware colors enable runtime switching without recompilation
- [02-01]: Inline theme-detection script in head prevents FOUC by setting .dark class before first paint
- [02-02]: PG initials as logo placeholder -- will be replaced with proper branding later
- [02-02]: ThemeToggle script deferred (not is:inline) since Layout.astro inline script handles initial state
- [02-02]: Mobile menu uses classList.toggle('hidden') -- no animation library needed
- [02-02]: Skip-to-content link uses sr-only with focus:not-sr-only pattern
- [03-01]: expressiveCode placed before mdx in integrations array (required by astro-expressive-code)
- [03-01]: themeCssSelector maps github-dark to .dark and github-light to :root:not(.dark) for class-based dark mode
- [03-01]: useDarkModeMediaQuery: false since site uses class-based toggle, not prefers-color-scheme
- [03-01]: Prose uses CSS custom properties (not dark:prose-invert) since custom properties already switch between themes
- [03-01]: Content collection uses Astro 5 glob loader with src/content.config.ts (not root content/config.ts)
- [03-02]: Used post.id (not post.slug) for URLs per Astro 5 API where slug was removed
- [03-02]: Draft filter applied in both listing query AND getStaticPaths to prevent draft page generation
- [03-02]: render() imported as standalone function from astro:content (Astro 5 API change)
- [03-02]: Prose class without dark:prose-invert since CSS custom properties handle theme switching automatically
- [04-01]: Typing animation uses inline JS text rotation + CSS blinking cursor (no external library)
- [04-01]: Skills card icons are inline SVG from Heroicons for zero HTTP overhead
- [04-01]: Contact CTA placed directly on home page for immediate recruiter accessibility
- [04-02]: Project data exported as typed array with Category union type from const assertion
- [04-02]: Projects page uses anchor tags wrapping entire card for better click targets
- [04-02]: About page tech stack organized as 6 badge groups; career highlights use left-border accent style
- [04-02]: Contact page uses two prominent cards (email + LinkedIn) with secondary links below
- [05-01]: SEOHead renders title, description, canonical, OG, and Twitter tags without wrapping head element
- [05-01]: canonicalURL derived from Astro.url.pathname + Astro.site when not explicitly provided
- [05-01]: og:image deferred to Phase 7 for dynamic OG image generation
- [05-01]: RSS autodiscovery link added to Layout head for all pages
- [05-02]: PersonJsonLd uses static data (no props) since only one person on the site
- [05-02]: BlogPostingJsonLd accepts typed props for dynamic post data with optional keywords/updatedDate
- [05-02]: JSON-LD rendered via Astro set:html directive on script tag for proper JSON injection
- [05-02]: No keyword changes needed -- Phase 4 content already covers all 20+ target SEO keywords naturally
- [06-01]: Used is:inline script for particle canvas (IIFE prevents global leakage, re-executes on navigation if not persisted)
- [06-01]: Fixed particle color to rgba(124, 115, 255, alpha) -- hero gradient is dark in both themes so no theme-aware canvas color needed
- [06-01]: Used window.__typingInterval global guard to prevent typing animation double-fire after ClientRouter navigation
- [06-02]: CSS opacity+transform transition for scroll reveals (no animation library)
- [06-02]: Intersection Observer threshold 0.1 with -50px bottom rootMargin for natural reveal timing
- [06-02]: Module script (not is:inline) for observer to persist across ClientRouter navigations
- [06-02]: Hero section excluded from reveals to ensure immediate above-the-fold visibility
- [06-02]: Blog cards wrapped in reveal divs rather than modifying BlogCard component
- [07-01]: BlogCard restructured with CSS absolute overlay to avoid invalid nested <a> tags; tag links use relative z-10
- [07-01]: ToC only renders when 2+ qualifying h2/h3 headings exist to avoid visual clutter on short posts
- [07-01]: LLMs.txt dynamically generated from blog collection at build time per llmstxt.org spec
- [07-01]: Tag pages use same draft filter pattern as blog index for consistency

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Phase 7 (OG images) flagged for `/gsd:research-phase` before implementation
- [Infra]: DNS configuration for patrykgolabek.dev is a manual step outside automation scope

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed 07-01-PLAN.md (Tag pages, ToC, LLMs.txt)
Resume file: None
Next: Execute 07-02-PLAN.md (OG image generation with Satori + Sharp)
