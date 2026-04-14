# Phase 120: Site Integration and SEO Enrichment - Validation

**Created:** 2026-04-14
**Source:** 120-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | OG image generates for dark-code slug | smoke (build) | `npx astro build && test -f dist/open-graph/blog/dark-code.png` | N/A -- build verification |
| INTG-02 | JSON-LD BlogPosting has articleSection and about for dark-code | manual-only | Inspect rendered HTML for JSON-LD script tag | N/A -- template logic |
| INTG-03 | FAQ JSON-LD present on dark-code page | manual-only | Inspect rendered HTML for FAQPage JSON-LD | N/A -- template logic |
| INTG-06 | LLMs.txt includes dark-code entry | smoke (build) | `npx astro build && grep -q 'dark-code' dist/llms.txt` | N/A -- build verification |
| INTG-08 | Sitemap, RSS, blog listing include dark-code | smoke (build) | `npx astro build && grep -q 'dark-code' dist/sitemap-0.xml && grep -q 'dark-code' dist/rss.xml` | N/A -- build verification |

## Sampling Rate

- **Per task commit:** `npx astro build` (ensures clean build)
- **Per wave merge:** Full build + grep verification of dist artifacts
- **Phase gate:** All build verification checks pass

## Wave 0 Gaps

None -- existing test infrastructure covers all phase requirements via build verification. No new test files needed since the changes are purely additive data (boolean flag, FAQ array, frontmatter toggle) following established patterns.
