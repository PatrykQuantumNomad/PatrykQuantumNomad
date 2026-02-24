---
phase: 48-infrastructure-foundation
plan: 01
subsystem: eda-infrastructure
tags: [katex, remark-math, rehype-katex, astro-layout, breadcrumb, mdx, math-rendering]

requires:
  - phase: 47
    provides: v1.7 complete site
provides:
  - KaTeX build-time formula rendering pipeline (remark-math + rehype-katex)
  - Self-hosted KaTeX CSS and woff2 fonts with conditional loading
  - EDALayout.astro with animation isolation
  - TechniquePage.astro template with 5 named slots
  - EdaBreadcrumb.astro accessible navigation component
  - KaTeX validation test page at /eda/test-formulas/
affects: [phase-49, phase-50, phase-51, phase-52, phase-53, phase-54, phase-55]

tech-stack:
  added: [remark-math@6.0.0, rehype-katex@7.0.1, katex@0.16.x]
  patterns: [conditional-css-via-head-slot, layout-slot-composition, mdx-math-pipeline, self-hosted-font-assets]

key-files:
  created:
    - scripts/copy-katex-assets.mjs
    - public/styles/katex.min.css
    - public/fonts/katex/*.woff2
    - src/layouts/EDALayout.astro
    - src/components/eda/EdaBreadcrumb.astro
    - src/components/eda/TechniquePage.astro
    - src/pages/eda/test-formulas.mdx
  modified:
    - astro.config.mjs
    - package.json
    - package-lock.json

key-decisions:
  - "remark-math v6 works with Astro 5 -- no fallback to v5.1.1 needed (mathFlowInside error did not occur)"
  - "KaTeX CSS conditional loading via Layout head slot pattern confirmed working"
  - "Dark-mode formula visibility handled with .katex color override using CSS custom property"

patterns-established:
  - "Conditional CSS injection: EDALayout passes <link slot='head'> to Layout.astro when useKatex=true"
  - "Layout composition: EDALayout wraps Layout.astro, passing through props and adding EDA-specific concerns"
  - "MDX math pipeline: $...$ inline and $$...$$ display math processed by remark-math -> rehype-katex at build time"
  - "Self-hosted assets: copy script patches relative font paths to absolute /fonts/katex/ paths"

duration: 4min
completed: 2026-02-24
---

# Phase 48 Plan 01: KaTeX Pipeline and EDA Layout Summary

**Build-time KaTeX formula rendering via remark-math@6.0.0 + rehype-katex@7.0.1, EDA layout with conditional CSS loading, technique page template with 5 named slots, and test page validating 11 formula categories**

## Performance
- **Duration:** 4 minutes
- **Started:** 2026-02-24T22:50:09Z
- **Completed:** 2026-02-24T22:54:48Z
- **Tasks:** 2/2
- **Files modified:** 25 (20 woff2 fonts, 3 new source files, 1 script, 1 CSS, 3 config)

## Accomplishments
- Installed remark-math@6.0.0 + rehype-katex@7.0.1 -- v6 works with Astro 5 without the feared mathFlowInside error
- Configured astro.config.mjs with remarkMath and rehypeKatex plugins in the markdown pipeline
- Created copy-katex-assets.mjs script that copies and patches KaTeX CSS + 20 woff2 fonts for self-hosting
- Self-hosted KaTeX CSS with all font paths rewritten from relative to absolute (/fonts/katex/)
- Created EDALayout.astro extending Layout.astro with conditional KaTeX CSS loading via head slot
- Created EdaBreadcrumb.astro with accessible navigation (aria-label="Breadcrumb") and proper styling
- Created TechniquePage.astro template with 5 named slots (plot, description, formula, code, interpretation), BreadcrumbJsonLd, and related techniques section
- Created test-formulas.mdx exercising the real remark-math + rehype-katex pipeline with all 11 formula categories
- Verified KaTeX CSS loads only on useKatex=true pages (1 reference on test page, 0 on homepage)
- Build succeeds: 858 pages in 27.24s with no errors

## Task Commits
1. **Task 1: Install KaTeX pipeline, self-host assets, configure Astro** - `49000bc` (feat)
2. **Task 2: Create EDALayout, EdaBreadcrumb, TechniquePage, and KaTeX test page** - `96b1755` (feat)

## Files Created/Modified
- `astro.config.mjs` - Added remark-math + rehype-katex imports and plugin configuration
- `package.json` / `package-lock.json` - Added remark-math, rehype-katex, katex dependencies
- `scripts/copy-katex-assets.mjs` - One-time script to copy and patch KaTeX CSS + woff2 fonts
- `public/styles/katex.min.css` - Self-hosted KaTeX CSS with absolute font paths
- `public/fonts/katex/*.woff2` - 20 self-hosted KaTeX woff2 font files
- `src/layouts/EDALayout.astro` - EDA layout with conditional KaTeX CSS and dark-mode override
- `src/components/eda/EdaBreadcrumb.astro` - Accessible breadcrumb navigation for EDA pages
- `src/components/eda/TechniquePage.astro` - Technique page template with named slots and related links
- `src/pages/eda/test-formulas.mdx` - KaTeX validation page with 11 formula categories

## Decisions Made
1. **remark-math v6 confirmed working** -- The project decision was to try v6 first and fall back to v5.1.1 if mathFlowInside errors occurred. v6.0.0 works without issues on Astro 5, so no fallback was needed.
2. **KaTeX dark-mode override** -- Added `.katex { color: var(--color-text-primary); }` conditional style to ensure formula visibility on dark backgrounds.
3. **Test page uses MDX format** -- Using .mdx (not .astro) to exercise the real remark-math + rehype-katex pipeline that all future content pages will use.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Plan 48-02 (Zod schemas, content collections, sample data, OG caching) can proceed immediately. The EDALayout and KaTeX pipeline are ready for use by all subsequent plans. All 90+ future EDA pages will use EDALayout.astro as their layout wrapper and TechniquePage.astro as their template.

## Self-Check: PASSED
- All 7 created files exist on disk
- 20 woff2 font files confirmed in public/fonts/katex/
- Both task commits (49000bc, 96b1755) found in git log

---
*Phase: 48-infrastructure-foundation*
*Completed: 2026-02-24*
