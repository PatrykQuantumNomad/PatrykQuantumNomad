# Phase 121: Build Verification and Publish - Validation Architecture

**Extracted from:** 121-RESEARCH.md `## Validation Architecture` section
**Phase type:** Pure verification/QA -- no new code, only inspection of existing build artifacts

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 (for unit tests) + CLI verification (for this phase) |
| Config file | vitest.config.ts |
| Quick run command | `npx astro build && npx astro preview` |
| Full suite command | Build + artifact checks + Lighthouse audit |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VERF-01 | All 17 footnote URLs resolve | smoke (curl) | `grep -oP 'https?://[^)]+' src/data/blog/dark-code.mdx \| xargs -I{} curl -sI -o /dev/null -w "%{http_code} {}\n" {}` | N/A -- CLI verification |
| VERF-02 | Production build zero errors | smoke (build) | `npm run build` (exit code 0) | N/A -- build command |
| VERF-03 | OG image + social card correct | smoke (build) | `test -f dist/open-graph/blog/dark-code.png && grep -q 'og:image' dist/blog/dark-code/index.html` | N/A -- build output check |
| VERF-04 | Related posts sidebar has 3+ articles | smoke (build) | `grep -c 'href="/blog/' dist/blog/dark-code/index.html` (expect 6+: 5 related + 1 back-to-blog) | N/A -- build output check |
| VERF-05 | Lighthouse 90+ all categories | performance (Lighthouse) | `lighthouse http://localhost:4321/blog/dark-code/ --preset=desktop --output=json` | N/A -- Lighthouse CLI |

## Sampling Rate

- **Per task commit:** `npm run build` (ensures clean build)
- **Per wave merge:** Full build + artifact checks + Lighthouse audit
- **Phase gate:** All 5 VERF requirements verified before phase completion

## Wave 0 Gaps

None -- all verification uses existing CLI tools (curl, astro, lighthouse, grep). No new test files or infrastructure needed.

## Notes

- VERF-01 expects 13 URLs returning HTTP 200 and 4 returning HTTP 403 (bot-blocking from ResearchGate x2, MDPI x1, defense.gov x1). HTTP 403 from known academic/government sites is NOT a failure -- these sites block automated crawlers. All 17 URLs are confirmed real publications.
- VERF-05 uses `--preset=desktop` only. Mobile scores are informational and not required (see RESEARCH.md Open Questions RESOLVED).
- Deployment (push to main) is out of scope for this verification phase.
