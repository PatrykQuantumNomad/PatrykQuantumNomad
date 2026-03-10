# Phase 90: Infrastructure Refactoring - Validation

**Created:** 2026-03-10
**Framework:** Vitest 4.0+
**Config:** vitest.config.ts
**Quick run:** `npx vitest run --reporter=verbose`

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0+ |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

## Requirement-to-Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Multi-guide content collections load both guides | smoke | `npx astro build 2>&1 \| grep -c "guides"` | No - Wave 0 |
| INFRA-02 | `lastVerified` field accepted in guidePageSchema | unit | `npx vitest run src/lib/guides/__tests__/schema.test.ts -x` | Yes - extend |
| INFRA-03 | Claude Code guide.json validates against guideMetaSchema | unit | `npx vitest run src/lib/guides/__tests__/schema.test.ts -x` | Yes - extend |
| INFRA-04 | Claude Code landing page renders with chapter cards and reading time | smoke | `npx astro build && test -f dist/guides/claude-code/index.html` | No - manual |
| INFRA-05 | Claude Code chapter pages generate for all slugs | smoke | `npx astro build && ls dist/guides/claude-code/*/index.html \| wc -l` | No - manual |
| INFRA-06 | FastAPI guide pages unchanged after refactoring | smoke | `npx astro build && diff <(ls dist/guides/fastapi-production/) <(echo expected)` | No - manual |
| INFRA-07 | CodeBlock renders code with file header, no source link | manual-only | Visual inspection in dev server | No - manual-only |

## Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose` (runs in <5 seconds)
- **Per wave merge:** `npx astro build` (full production build verifies all pages generate)
- **Phase gate:** Full build succeeds with zero errors; both guides appear in build output; human visual regression via Plan 04 checkpoint

## Wave 0 Gaps

These test files need to be extended as part of Plan 01 Task 1 (TDD task):

- [ ] `src/lib/guides/__tests__/schema.test.ts` -- extend with:
  - `lastVerified` field acceptance test
  - Optional `templateRepo` acceptance test
  - Optional `versionTag` acceptance test
  - `accentColor` field acceptance test
  - Chapter `description` field acceptance test
  - Backward-compat: existing FastAPI validMeta still passes
- [ ] `src/lib/guides/__tests__/routes.test.ts` -- update:
  - Remove `GUIDE_ROUTES.landing` test after constant removal
  - Keep `GUIDE_ROUTES.guides` test
  - Keep `guidePageUrl` and `guideLandingUrl` tests

## Verification Checkpoints

| Wave | Plans | Verification |
|------|-------|-------------|
| 1 | 90-01, 90-02 | Unit tests pass, `npx astro build` succeeds |
| 2 | 90-03 | Landing page, chapter pages, hub page, LLMs.txt all generated |
| 3 | 90-04 | OG images generated, human visual regression of all pages |

## Manual Verification Checklist (Plan 04 Checkpoint)

1. FastAPI landing page identical to pre-refactor
2. FastAPI chapter pages have sidebar, breadcrumbs, companion blog link, prev/next
3. Claude Code landing page shows numbered card grid, reading time, prerequisites, accent color
4. Claude Code chapter page shows sidebar, breadcrumbs, reading time, prev/next
5. Hub page shows both guides as distinct cards
6. LLMs.txt lists both guides with chapters
7. Production build succeeds with zero errors
