# Phase 95: Site Integration & Blog Post - Validation

**Created:** 2026-03-10
**Source:** 95-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0+ |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx astro build` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | Header has Claude Code nav link | smoke | `npx astro build && grep 'claude-code' dist/index.html` | No - manual |
| SITE-02 | Homepage has Claude Code callout card | smoke | `npx astro build && grep 'Claude Code' dist/index.html` | No - manual |
| SITE-03 | Hub page lists both guides | smoke | `grep -c 'card-hover' dist/guides/index.html` (expect 2+) | No - already done, verify only |
| SITE-04 | 12 Claude Code URLs in sitemap | smoke | `grep -c 'claude-code' dist/sitemap-0.xml` (expect 12) | No - already done, verify only |
| SITE-05 | Claude Code in LLMs.txt | smoke | `grep -c 'claude-code' dist/llms.txt` (expect 13+) | No - already done, verify only |
| SITE-06 | TechArticle JSON-LD on chapter pages | smoke | `grep 'TechArticle' dist/guides/claude-code/introduction/index.html` | No - already done, verify only |
| SITE-07 | OG images generated | smoke | `test -f dist/open-graph/guides/claude-code.png` | No - already done, verify only |
| SITE-08 | Blog post exists with chapter links | smoke | `npx astro build && test -f dist/blog/claude-code-guide/index.html && grep -c '/guides/claude-code/' dist/blog/claude-code-guide/index.html` (expect 11+) | No - build test |

## Sampling Rate

- **Per task commit:** `npx astro build` (verifies all pages generate without errors)
- **Per wave merge:** Full build + grep verification of all 8 SITE-* requirements
- **Phase gate:** All 8 SITE-* requirements verified in build output

## Wave 0 Gaps

None -- existing test infrastructure covers all phase requirements via build verification. No new test files needed. All verification is done through build output inspection.
