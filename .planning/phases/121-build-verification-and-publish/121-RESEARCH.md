# Phase 121: Build Verification and Publish - Research

**Researched:** 2026-04-14
**Domain:** Build verification, link validation, OG image preview, Lighthouse performance auditing for Astro static site
**Confidence:** HIGH

## Summary

This phase is a pure verification/QA phase with no new code to write. All 5 requirements (VERF-01 through VERF-05) are validation checks against existing artifacts produced by Phases 117-120. The blog post at `src/data/blog/dark-code.mdx` is already set to `draft: false`, all JSON-LD enrichment is in place, and the OG image pipeline is fully automatic. The work is: (1) validate all 17 footnote URLs resolve, (2) run a clean production build, (3) verify OG meta tags and image generation from the build output, (4) confirm related posts appear via tag overlap, and (5) run Lighthouse against a local preview server to achieve 90+ scores.

A critical finding from URL verification is that **4 of 17 footnote URLs return HTTP 403 to automated HEAD requests** (ResearchGate x2, MDPI x1, defense.gov x1) while all 4 are confirmed real, accessible publications via web search. The plan must distinguish between genuinely dead links and sites that block automated crawlers. All 17 URLs point to real, existing publications -- none are hallucinated.

The site deploys to GitHub Pages via the `withastro/action@v3` workflow. The dark-code post is NOT yet live (returns 404 on patrykgolabek.dev) because the latest commits have not been pushed/deployed. All verification must happen against local `astro build` + `astro preview` before pushing to production.

**Primary recommendation:** Run `astro build` to verify zero errors, then `astro preview` to serve locally for Lighthouse auditing and OG image verification. Use `curl -sI` for link validation with fallback to WebFetch/browser for 403 responses. No new dependencies or infrastructure needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VERF-01 | All footnote URLs resolve (no dead links or hallucinated citations) | 17 footnote URLs identified and pre-checked. 13 return HTTP 200, 4 return 403 (bot-blocking, not dead). All 17 confirmed as real publications via web search. Validation script pattern documented below. |
| VERF-02 | Production build passes cleanly with no errors | `npm run build` (which calls `astro build` with prebuild steps). Build output goes to `dist/`. Verify zero error exit code and check for `dist/blog/dark-code/index.html`. |
| VERF-03 | OG image and social card render correctly in preview | OG image auto-generated at `dist/open-graph/blog/dark-code.png` by satori+sharp pipeline. SEOHead.astro sets all required og: and twitter: meta tags. Verify meta tags in built HTML + image file exists + image dimensions 1200x630. |
| VERF-04 | Related posts sidebar shows relevant articles via tag overlap | Dark-code tags overlap with 15+ other posts. Tag overlap analysis shows: `devops` (10+ posts), `security` (4 posts), `code-quality` (2 posts), `ai-coding-assistant` (2 posts), `architecture` (1 post). The related posts algorithm sorts by overlap count then date, showing top 5. Expect 5 related posts easily. |
| VERF-05 | Lighthouse 90+ on the new blog post page | Lighthouse CLI v13.0.3 installed locally. Chrome available at standard path. Run against `astro preview` server (localhost:4321). Use `--preset=desktop` for desktop scores. |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Static site build + preview server | Project framework [VERIFIED: package.json] |
| lighthouse | 13.0.3 | Performance/accessibility/SEO auditing | Globally installed CLI [VERIFIED: `lighthouse --version`] |
| curl | system | HTTP HEAD requests for link validation | Pre-installed on macOS [VERIFIED: system tool] |
| sharp | ^0.34.5 | OG image generation (via og-image.ts) | Already in dependency tree [VERIFIED: package.json] |

### Supporting
No additional libraries needed. All verification uses existing tools and CLI utilities.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual curl link checks | linkinator, broken-link-checker npm packages | Overkill for 17 URLs; curl is simpler and already available |
| Lighthouse CLI | PageSpeed Insights API | Requires deployed URL; CLI works against localhost |
| Manual OG preview | opengraph.xyz or og-preview npm | Requires public URL or tunnel; local HTML inspection is sufficient |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Verification Workflow Pattern

The verification follows a specific order that respects dependencies:

```
1. Link validation (VERF-01)     -- independent, can run immediately
2. Production build (VERF-02)    -- must succeed before steps 3-5
3. OG image verification (VERF-03) -- requires build output in dist/
4. Related posts check (VERF-04)   -- requires build output in dist/
5. Lighthouse audit (VERF-05)     -- requires preview server from build
```

### Build Output Structure (what to verify exists)
```
dist/
  blog/
    dark-code/
      index.html          # VERF-02: page exists
  open-graph/
    blog/
      dark-code.png       # VERF-03: OG image generated
  sitemap-0.xml           # INTG-08: post included
  rss.xml                 # INTG-08: post included
  llms.txt                # INTG-06: post listed
```

### Link Validation Pattern

For VERF-01, the 17 footnote URLs must be validated. The key distinction is between **dead links** and **bot-blocked links**:

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 200 | Accessible | Pass |
| 301/302 | Redirect | Follow and verify final destination |
| 403 | Bot-blocked (common for academic sites) | Verify via web search that publication exists |
| 404 | Dead link | FAIL -- investigate and replace |
| 5xx | Server error | Retry once, then flag for manual check |

**Pre-verified URL status (all 17):**

| Footnote | URL Domain | Status | Verdict |
|----------|-----------|--------|---------|
| [^1] | gitclear.com | 200 | OK [VERIFIED: curl] |
| [^2] | gitclear.com | 200 | OK [VERIFIED: curl] |
| [^3] | researchgate.net | 403 | Bot-blocked; publication confirmed via WebSearch [VERIFIED] |
| [^4] | appsecsanta.com | 200 | OK [VERIFIED: curl] |
| [^5] | mondoo.com | 200 | OK [VERIFIED: curl] |
| [^6] | anthropic.com | 200 | OK [VERIFIED: curl] |
| [^7] | spinroot.com | 200 | OK [VERIFIED: curl] |
| [^8] | americanimpactreview.com | 200 | OK [VERIFIED: curl] |
| [^9] | researchgate.net | 403 | Bot-blocked; publication confirmed via WebSearch [VERIFIED] |
| [^10] | cs.mcgill.ca | 200 | OK [VERIFIED: curl] |
| [^11] | mdpi.com | 403 | Bot-blocked; article confirmed via WebSearch [VERIFIED] |
| [^12] | autonomyai.io | 200 | OK [VERIFIED: curl] |
| [^13] | arxiv.org | 200 | OK [VERIFIED: curl] |
| [^14] | mysmu.edu | 200 | OK [VERIFIED: curl] |
| [^15] | deepstrike.io | 200 | OK [VERIFIED: curl] |
| [^16] | media.defense.gov | 403 | Bot-blocked; SWAP report confirmed via WebSearch [VERIFIED] |
| [^17] | cse.hkust.edu.hk | 200 | OK [VERIFIED: curl] |

### OG Image Verification Pattern

The OG image pipeline in this project uses satori (SVG generation) + sharp (PNG conversion). Verification requires checking:

1. **File exists:** `dist/open-graph/blog/dark-code.png` must be present after build
2. **Meta tags correct:** The built HTML at `dist/blog/dark-code/index.html` must contain:
   - `<meta property="og:image" content="https://patrykgolabek.dev/open-graph/blog/dark-code.png?cb=20260216" />`
   - `<meta property="og:image:width" content="1200" />`
   - `<meta property="og:image:height" content="630" />`
   - `<meta name="twitter:card" content="summary_large_image" />`
   - `<meta name="twitter:image" content="https://patrykgolabek.dev/open-graph/blog/dark-code.png?cb=20260216" />`
3. **Image dimensions:** The PNG should be 1200x630 pixels (standard OG image size)

[VERIFIED: SEOHead.astro component analysis, [slug].astro ogImageURL construction]

### Related Posts Algorithm

The related posts algorithm in `[slug].astro` (lines 26-35):
1. Filters out the current post
2. Counts tag overlap between the current post and all other posts
3. Filters to only posts with overlap > 0
4. Sorts by overlap count (desc), then by publishedDate (desc)
5. Takes top 5

Dark code tags: `code-quality`, `ai-coding-assistant`, `technical-debt`, `security`, `devops`, `architecture`

**Expected high-overlap posts:**
- docker-compose-best-practices: 2 tags (security, devops)
- dockerfile-best-practices: 2 tags (security, devops)
- github-actions-best-practices: 2 tags (security, devops)
- kubernetes-manifest-best-practices: 2 tags (security, devops)
- claude-code-guide-refresh: 1 tag (ai-coding-assistant)
- claude-code-guide: 1 tag (ai-coding-assistant)
- death-by-a-thousand-arrows: 1 tag (code-quality)
- the-beauty-index: 1 tag (code-quality)
- building-kubernetes-observability-stack: 1 tag (devops)
- database-compass: 1 tag (architecture)
- fastapi-production-guide: 1 tag (devops)
- Multiple ext-* posts sharing devops/security/architecture tags

With 4+ posts having 2-tag overlap, the sidebar will show at minimum 5 related posts, comfortably exceeding the "3+ related posts visible" success criterion.

[VERIFIED: [slug].astro codebase analysis + blog post tag inventory]

### Anti-Patterns to Avoid
- **Running Lighthouse against the production URL before deployment:** The post is not live yet (404). Always use local `astro preview`.
- **Treating 403 as dead links:** ResearchGate, MDPI, and defense.gov block automated requests. This is expected behavior, not a link failure.
- **Running Lighthouse without `--preset=desktop`:** The site targets desktop users (portfolio site). Mobile scores may differ due to layout choices.
- **Skipping the build step and only checking source files:** OG images, sitemap, and RSS are only generated during `astro build`. Source inspection alone is insufficient.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Link checking | Custom HTTP client with retry logic | Simple `curl -sI` with status code parsing | 17 URLs is a tiny batch; no need for parallelism or retry infrastructure |
| Lighthouse auditing | Custom performance metrics | `lighthouse` CLI with `--output=json` | Industry standard, produces scores matching VERF-05 criteria |
| OG image validation | Custom image dimension checker | `file` command or `sharp` metadata read on dist output | The image is already generated by the pipeline; just verify it exists and check dimensions |
| Social card preview | Deploy to staging + use social debugger tools | Inspect built HTML meta tags locally | Meta tag correctness can be verified by grepping the HTML output |

**Key insight:** This is a verification phase, not a build phase. Every artifact already exists. The work is purely inspection and measurement.

## Common Pitfalls

### Pitfall 1: False Positive Dead Links from Bot-Blocking Sites
**What goes wrong:** Automated link checkers report ResearchGate, MDPI, defense.gov as broken (403/429).
**Why it happens:** Academic publishers and government sites block non-browser HTTP requests.
**How to avoid:** Use a two-tier validation approach: (1) curl first, (2) for any non-200, verify via web search or browser that the content exists. Only flag as dead if the content genuinely cannot be found.
**Warning signs:** Multiple 403s from known academic publishers.

### Pitfall 2: Lighthouse Scores Varying Between Runs
**What goes wrong:** First Lighthouse run shows 85, second shows 93, creating uncertainty about whether VERF-05 passes.
**Why it happens:** Lighthouse performance scores have natural variance (especially on mobile). Local machine load, Chrome state, and network conditions affect results.
**How to avoid:** Run Lighthouse 3 times and take the median score. Use `--preset=desktop` for more stable scores. Close other Chrome instances. Use `--chrome-flags="--headless=new"` to eliminate rendering overhead.
**Warning signs:** Performance score fluctuating more than 5 points between runs.

### Pitfall 3: Astro Preview Server Not Serving OG Images
**What goes wrong:** Lighthouse or manual inspection during preview shows missing OG image (404 for the PNG).
**Why it happens:** `astro preview` serves from `dist/` which must be built first. If `astro build` failed silently on the OG image generation, the PNG won't exist.
**How to avoid:** Always verify `dist/open-graph/blog/dark-code.png` exists after build, before starting preview.
**Warning signs:** `test -f dist/open-graph/blog/dark-code.png` returns false.

### Pitfall 4: Related Posts Not Showing for External Posts
**What goes wrong:** Related posts sidebar is empty or has fewer than expected posts.
**Why it happens:** External posts (`ext-*.md`) have `externalUrl` set. The `getStaticPaths` function filters them out of `nativePosts` but includes them in `allPosts` (line 17). Related posts are computed from `allPosts`, so external posts DO appear in the related sidebar.
**How to avoid:** This is actually correct behavior -- external posts with tag overlap will appear. Count them in the expected list.
**Warning signs:** If related posts count is unexpectedly low, check whether external posts are being filtered out improperly.

### Pitfall 5: Build Failure from Prebuild Script
**What goes wrong:** `npm run build` fails before Astro even starts because the prebuild script (`node scripts/download-actionlint-wasm.mjs && node scripts/generate-layout.mjs`) errors.
**Why it happens:** The prebuild downloads actionlint WASM and generates layout data. Network issues or stale data can cause failures.
**How to avoid:** If prebuild fails, run `npx astro build` directly (skipping prebuild) to isolate whether the issue is in prebuild or in Astro itself.
**Warning signs:** Error output mentioning `download-actionlint-wasm` or `generate-layout`.

## Code Examples

### Link Validation Script Pattern
```bash
# Source: Research-verified approach for this project's 17 footnotes
# Extract footnote URLs from the MDX file and check each

grep -oP '\[.*?\]\((https?://[^)]+)\)' src/data/blog/dark-code.mdx | \
  grep -oP 'https?://[^)]+' | while read url; do
  status=$(curl -sI -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  echo "$status $url"
done
```
[VERIFIED: tested against all 17 URLs in this research session]

### Production Build and Verification
```bash
# Source: package.json scripts + Astro CLI
# Step 1: Clean build
npm run build

# Step 2: Verify key artifacts exist
test -f dist/blog/dark-code/index.html && echo "Blog page: OK" || echo "Blog page: MISSING"
test -f dist/open-graph/blog/dark-code.png && echo "OG image: OK" || echo "OG image: MISSING"
grep -q 'dark-code' dist/sitemap-0.xml && echo "Sitemap: OK" || echo "Sitemap: MISSING"
grep -q 'dark-code' dist/rss.xml && echo "RSS feed: OK" || echo "RSS feed: MISSING"
grep -q 'dark-code' dist/llms.txt && echo "LLMs.txt: OK" || echo "LLMs.txt: MISSING"
```
[VERIFIED: build output paths from Phase 120 research and astro.config.mjs analysis]

### OG Meta Tag Verification
```bash
# Source: SEOHead.astro component analysis
# Check that the built HTML has correct OG tags
grep -o 'og:image.*content="[^"]*"' dist/blog/dark-code/index.html
grep -o 'twitter:card.*content="[^"]*"' dist/blog/dark-code/index.html
grep -o 'twitter:image.*content="[^"]*"' dist/blog/dark-code/index.html
```
[VERIFIED: SEOHead.astro props interface and meta tag rendering]

### Lighthouse Audit
```bash
# Source: Lighthouse CLI v13.0.3 help output
# Start preview server in background, run Lighthouse, then kill server
npx astro preview &
PREVIEW_PID=$!
sleep 3

lighthouse http://localhost:4321/blog/dark-code/ \
  --preset=desktop \
  --output=json \
  --output-path=./lighthouse-report.json \
  --chrome-flags="--headless=new" \
  --quiet

# Extract scores
node -e "
const r = require('./lighthouse-report.json');
const cats = r.categories;
console.log('Performance:', Math.round(cats.performance.score * 100));
console.log('Accessibility:', Math.round(cats.accessibility.score * 100));
console.log('Best Practices:', Math.round(cats['best-practices'].score * 100));
console.log('SEO:', Math.round(cats.seo.score * 100));
"

kill $PREVIEW_PID
```
[VERIFIED: lighthouse --help output + astro preview command from package.json]

### Related Posts Verification
```bash
# Source: [slug].astro related posts rendering
# Check the built HTML for the "Related Articles" section
grep -c 'Related Articles' dist/blog/dark-code/index.html
# Count related post links in the aside
grep -oP 'href="/blog/[^"]+/"' dist/blog/dark-code/index.html | grep -v 'dark-code' | head -10
```
[VERIFIED: [slug].astro template structure lines 311-346]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 (for unit tests) + CLI verification (for this phase) |
| Config file | vitest.config.ts |
| Quick run command | `npx astro build && npx astro preview` |
| Full suite command | Build + artifact checks + Lighthouse audit |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VERF-01 | All 17 footnote URLs resolve | smoke (curl) | `grep -oP 'https?://[^)]+' src/data/blog/dark-code.mdx \| xargs -I{} curl -sI -o /dev/null -w "%{http_code} {}\n" {}` | N/A -- CLI verification |
| VERF-02 | Production build zero errors | smoke (build) | `npm run build` (exit code 0) | N/A -- build command |
| VERF-03 | OG image + social card correct | smoke (build) | `test -f dist/open-graph/blog/dark-code.png && grep -q 'og:image' dist/blog/dark-code/index.html` | N/A -- build output check |
| VERF-04 | Related posts sidebar has 3+ articles | smoke (build) | `grep -c 'href="/blog/' dist/blog/dark-code/index.html` (expect 6+: 5 related + 1 back-to-blog) | N/A -- build output check |
| VERF-05 | Lighthouse 90+ all categories | performance (Lighthouse) | `lighthouse http://localhost:4321/blog/dark-code/ --preset=desktop --output=json` | N/A -- Lighthouse CLI |

### Sampling Rate
- **Per task commit:** `npm run build` (ensures clean build)
- **Per wave merge:** Full build + artifact checks + Lighthouse audit
- **Phase gate:** All 5 VERF requirements verified before phase completion

### Wave 0 Gaps
None -- all verification uses existing CLI tools (curl, astro, lighthouse, grep). No new test files or infrastructure needed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Twitter Card Validator (cards-dev.twitter.com) | X Card Validator discontinued; use local meta tag inspection | 2023 | Cannot use Twitter's tool; verify OG tags in HTML directly |
| LinkedIn Post Inspector requires public URL | Local HTML inspection for meta tags | Always | Must verify meta tag correctness offline, then confirm after deployment |
| Lighthouse in Chrome DevTools | Lighthouse CLI 13.x with `--preset=desktop` | Current | CLI gives more reproducible results than DevTools panel |

**Deprecated/outdated:**
- Twitter Card Validator: Discontinued in 2023. Cannot be used for VERF-03 verification. [ASSUMED]
- Facebook Sharing Debugger requires public URL: Cannot be used pre-deployment. [VERIFIED: tool requires accessible URL]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Twitter Card Validator is discontinued (2023) | State of the Art | Low -- local meta tag verification is the fallback regardless |
| A2 | Lighthouse desktop preset gives more stable scores than mobile | Common Pitfalls | Low -- both presets work; desktop is recommended for portfolio sites |
| A3 | `astro preview` serves on port 4321 by default | Code Examples | Low -- port can be overridden but 4321 is Astro's default |

## Open Questions

1. **Should Lighthouse scores be verified for mobile as well as desktop?**
   - What we know: VERF-05 says "Lighthouse 90+" without specifying mobile vs desktop. The site is a portfolio/blog site.
   - What's unclear: Whether the success criterion requires mobile 90+ or desktop 90+.
   - Recommendation: Run desktop (`--preset=desktop`) as the primary target. Run mobile as informational. Desktop scores are more stable and more relevant for this portfolio site's audience.

2. **Should the post be deployed (pushed to main) as part of this phase?**
   - What we know: The post is `draft: false` but the commits are not yet pushed. The deploy workflow triggers on push to main.
   - What's unclear: Whether deployment is in scope for this verification phase or a separate step.
   - Recommendation: Deployment is the natural conclusion of verification. After all 5 VERF requirements pass locally, pushing to main completes the publish cycle.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + preview | Yes | v24.11.1 | -- |
| npm / npx | Package scripts | Yes | 11.8.0 | -- |
| Lighthouse CLI | VERF-05 | Yes | 13.0.3 | Chrome DevTools Lighthouse panel |
| Google Chrome | Lighthouse runner | Yes | Standard path | -- |
| curl | VERF-01 link checking | Yes | System | -- |
| astro | Build + preview | Yes | ^5.3.0 (in project) | -- |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Security Domain

Not applicable to this phase. The work is purely verification/QA of existing artifacts. No authentication, input handling, cryptography, or access control involved.

## Sources

### Primary (HIGH confidence)
- `src/data/blog/dark-code.mdx` -- All 17 footnote URLs extracted and individually verified [VERIFIED: curl + WebSearch]
- `src/pages/blog/[slug].astro` -- Related posts algorithm, OG image URL construction, JSON-LD rendering [VERIFIED: codebase analysis]
- `src/components/SEOHead.astro` -- OG and Twitter meta tag rendering logic [VERIFIED: codebase analysis]
- `src/pages/open-graph/[...slug].png.ts` -- OG image generation pipeline [VERIFIED: codebase analysis]
- `package.json` -- Build scripts and dependency versions [VERIFIED: direct read]
- `astro.config.mjs` -- Sitemap integration, site URL, build configuration [VERIFIED: direct read]
- `lighthouse --version` -- CLI version 13.0.3 [VERIFIED: command output]
- Phase 120 RESEARCH.md -- Prior phase integration patterns and build verification approach [VERIFIED: direct read]

### Secondary (MEDIUM confidence)
- WebSearch results confirming ResearchGate/MDPI/defense.gov publications exist [VERIFIED: multiple search results with matching titles]
- Lighthouse CLI `--preset=desktop` flag behavior [VERIFIED: `lighthouse --help` output]

### Tertiary (LOW confidence)
- Twitter Card Validator discontinued claim [ASSUMED from training data]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools verified as installed and functional
- Architecture: HIGH -- all verification patterns derived from direct codebase analysis
- Pitfalls: HIGH -- pitfalls identified from actual URL testing (403 responses) and build system analysis
- Link validation: HIGH -- all 17 URLs individually tested with documented results

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable -- verification tools and codebase patterns are static)
