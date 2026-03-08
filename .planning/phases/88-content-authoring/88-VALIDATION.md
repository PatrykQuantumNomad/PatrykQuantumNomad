# Phase 88: Content Authoring - Validation

**Generated:** 2026-03-08
**Source:** 88-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

## Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 through PAGE-11 | Each page renders with complete prose, code snippets, and correct frontmatter | smoke | `npx astro build 2>&1 \| tail -10` | N/A (build validation) |
| AGENT-01 | Each page opens with agent narrative section | manual-only | Visual review of rendered pages | N/A |
| AGENT-02 | Each page closes with agent summary section | manual-only | Visual review of rendered pages | N/A |
| All PAGE-* | Frontmatter slugs match guide.json chapters | unit | `npx vitest run src/lib/guides/__tests__/schema.test.ts` | Exists |

## Sampling Rate

- **Per task commit:** `npx astro build` (full build validates all MDX frontmatter and component imports)
- **Per wave merge:** `npx vitest run && npx astro build`
- **Phase gate:** Full suite green + successful build + visual review of all 11 rendered pages

## Wave 0 Gaps

None -- existing test infrastructure (schema validation tests + build smoke test) covers all automated validation needs. Content quality is verified by visual review and self-check against success criteria.
