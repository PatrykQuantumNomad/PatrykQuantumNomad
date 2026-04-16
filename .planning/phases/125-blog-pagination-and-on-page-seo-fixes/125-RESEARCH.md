# Phase 125: Blog, Pagination, and On-Page SEO Fixes — Research

**Researched:** 2026-04-16
**Domain:** Astro 5 static-site SEO metadata and route configuration
**Confidence:** HIGH
**Prior CONTEXT.md:** none (no `/gsd:discuss-phase` was run — researcher operates on ROADMAP/REQUIREMENTS + direct codebase evidence)

## Summary

Phase 125 is a batch of eight low-complexity fixes: four technical SEO (TSEO-02..05) and four on-page SEO (OPSEO-01..04). Every fix is a surgical edit in a known file — no new architecture, no new libraries, no runtime changes. The Astro stack (Astro 5.3+, `@astrojs/sitemap` 3.7.0, `@astrojs/rss` 4.0.15) already provides all the primitives required; the work is "pass the right option" / "change the right string" / "add one more route file."

The single non-trivial discovery: **TSEO-02 (self-referencing canonicals on pages 2-6) is already implicitly satisfied** by the existing `SEOHead.astro` default (`canonicalURL = new URL(Astro.url.pathname, Astro.site)`). The remaining value is (a) making it explicit so it cannot regress and (b) adding a build-time assertion / verifier. The planner should decide whether to add a regression guard or merely document + test.

The second discovery worth flagging: **OPSEO-01 (dark-code title) is not a frontmatter edit alone.** The current frontmatter title is 64 chars, but `src/pages/blog/[slug].astro` lines 224-227 truncate any title+suffix > 65 chars to `title.split(':')[0] + suffix`, so the rendered `<title>` tag is just `"Dark Code — Patryk Golabek"` (26 chars). Fixing OPSEO-01 means either changing the frontmatter to a shorter title (≤ 48 chars so that title+" — Patryk Golabek" lands in the 55-60 window) or changing the truncation logic. Recommendation below.

**Primary recommendation:** Ship all 8 fixes in a single wave (one PR) with per-requirement atomic commits. Add a single verifier script (or extend `scripts/verify-sitemap-determinism.mjs`) that asserts the four technical-SEO invariants at build time; the on-page SEO changes are static-string edits that don't need runtime verification beyond "build passes."

---

## User Constraints

No CONTEXT.md exists. Constraints derived from REQUIREMENTS.md and ROADMAP.md:

### Locked Requirements (from REQUIREMENTS.md)
- **TSEO-02**: Blog pagination pages 2-6 have self-referencing canonical tags (NOT noindex)
- **TSEO-03**: Blog pagination pages excluded from sitemap generation
- **TSEO-04**: `/feed.xml` serves as alias for `/rss.xml`
- **TSEO-05**: Tag pages with fewer than 3 posts excluded from sitemap
- **OPSEO-01**: `/blog/dark-code/` title tag expanded to keyword-rich 55-60 characters
- **OPSEO-02**: `/blog/dark-code/` meta description trimmed to ≤ 160 characters with keywords front-loaded
- **OPSEO-03**: Beauty Index single-language page descriptions fixed (no mid-word truncation, 140-160 chars)
- **OPSEO-04**: `/tools/dockerfile-analyzer/` meta description trimmed to ≤ 160 characters

### Out of Scope (from REQUIREMENTS.md § Out of Scope)
- **Noindex on blog pagination pages** — Google confirms this is an anti-pattern; correct fix = self-referencing canonical + sitemap exclusion (exactly what TSEO-02 + TSEO-03 prescribe).
- AI-generated descriptions (scaled-content-abuse risk).

### Locked Dependencies (from prior phases)
- **Phase 123 handoff (verified in `.planning/phases/123-sitemap-lastmod/`)**:
  - `scripts/verify-sitemap-determinism.mjs` has `LOC_FLOOR = 1184`. **Phase 125 MUST update this constant DOWNWARD** and cite the PR URL. Expected drop: 5 pagination URLs + N sparse tag URLs (counted below).
  - `LASTMOD_COVERAGE_FLOOR = 1184 - 64 = 1120` is pre-set with headroom for Phase 125; do NOT change it.
  - `src/lib/sitemap/content-dates.ts` builds lastmod entries for pagination + tag pages. These entries become dead weight after Phase 125 (harmless — they're only consumed when the URL appears in the sitemap). Leaving them in place is the least risky option; removing them is cosmetic.
  - `COLLECTION_SHIP_DATES.beautyIndexLanguage` in `src/lib/sitemap/static-dates.ts` MAY be bumped to the Phase 125 ship date since OPSEO-03 edits language-page descriptions. Optional; only meaningful if descriptions actually change (they do).

---

## Current State: File-by-File Evidence

### Blog pagination route
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/[...page].astro`
- **Route shape:** Page 1 = `/blog/` (bare), pages 2-N = `/blog/{N}/` (numbered, trailing slash). Source: `paginate(sortedPosts, { pageSize: 10 })` on line 14.
- **Total pages today:** 55 non-draft posts ÷ 10 = 6 pages → `/blog/`, `/blog/2/` … `/blog/6/`.
- **Canonical today:** No `canonicalURL` prop passed to `<Layout>` (see line 82-85). Falls through to `SEOHead.astro` line 18 default: `new URL(Astro.url.pathname, Astro.site)`. For `/blog/3/` this resolves to `https://patrykgolabek.dev/blog/3/` — **already self-referencing**.
- **Titles/descriptions:** Already page-aware (lines 19-25) — page 1 gets a distinct title, pages 2-N get "Blog — Page N — ... Articles" / "Page N of M — Technical articles ...".
- **`rel="prev"`/`rel="next"`:** Already emitted via slot (lines 86-87).

### Tag pages route
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/tags/[tag].astro`
- **getStaticPaths:** Emits one page per unique tag across all non-draft posts. No count filter. One page per tag regardless of post count.

### Sitemap integration
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/astro.config.mjs`
- **Current `filter`:** `(page) => !page.includes('/404')` — line 29.
- **Current `serialize`:** Populates lastmod + changefreq + priority per-URL via `contentDates` map (built at config load from `src/lib/sitemap/content-dates.ts`).
- `@astrojs/sitemap` 3.7.0 **`filter: (page: string) => boolean`** is the single-step mechanism. Return `false` to omit the URL from the sitemap. (Pages are still built; they just don't appear in `sitemap-0.xml`.)

### RSS endpoint
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/rss.xml.ts` (27 lines)
- **Implementation:** `@astrojs/rss` 4.0.15 `rss({ title, description, site, items })`. Exports `GET(context: APIContext)` and returns `Promise<Response>` (default export of `@astrojs/rss` returns a `Response`).
- **Static output:** `astro.config.mjs` has `output: 'static'` (line 26). Both `rss.xml.ts` and a sibling `feed.xml.ts` will be emitted as static files at build time.

### SEO component (single source of truth for `<title>`, description, canonical)
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/SEOHead.astro` (73 lines)
- **Canonical default:** Line 18 — `canonicalURL = new URL(Astro.url.pathname, Astro.site)`. Trailing slash matches `trailingSlash: 'always'` in `astro.config.mjs`.
- **Title → `<title>` tag:** Line 30 — `<title>{title}</title>`. No further transformation.
- **Description → `<meta name="description">`:** Line 31. No truncation.

### Blog [slug] post route (affects dark-code title)
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/[slug].astro`
- **Title truncation (lines 224-227):**
  ```astro
  const suffix = ' — Patryk Golabek';
  const titleTag = (title.length + suffix.length > 65)
    ? `${title.split(':')[0]}${suffix}`
    : `${title}${suffix}`;
  ```
  This is the hidden gotcha. For dark-code the frontmatter title is 64 chars; `64 + 17 = 81 > 65`, so `title.split(':')[0]` triggers, stripping everything after the colon. Rendered `<title>` = `"Dark Code — Patryk Golabek"` (26 chars).

### dark-code post
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/data/blog/dark-code.mdx`
- **Frontmatter title (64 chars):** `"Dark Code: The Silent Rot AI Accelerated and No One Is Measuring"`
- **Frontmatter description (219 chars):** `"AI coding assistants have accelerated a pre-existing problem: codebases filling with code no one understands, no one owns, and no one can safely change. A framework for measuring how much of your codebase has gone dark."`
- **No `updatedDate`** in frontmatter.

### Beauty Index single-language page
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/beauty-index/[slug].astro`
- **Description generator (lines 80-83):**
  ```astro
  const fullDescription = `${language.name} scores ${total}/60 in the Beauty Index, ranking #${rank} among 26 programming languages (${tierLabel} tier). ${language.characterSketch}`;
  const metaDescription = fullDescription.length <= 155
    ? fullDescription
    : fullDescription.slice(0, 155).replace(/\s+\S*$/, '') + '…';
  ```
- **Audited output:** Simulation over all 26 languages yields lengths **141-155 chars**; every description ends in `…`. **The regex-based truncation at word boundary is correct**, so the literal "mid-word truncation" bug described in OPSEO-03 is NOT currently reproducible with this codebase (see Open Question #1). However the emitted descriptions have two real problems worth fixing while here:
  1. Five descriptions end with an orphan word fragment like `"Python's"`, `"C#"`, `"Rust"`, `"up"`, `"of"` followed by `…` — grammatically awkward.
  2. Two end below the 140 floor once the ellipsis character is counted: C++ = 141 (borderline, OK). None are below 140, but several are right at 141-142 which is uncomfortable headroom.
  The requirement says "140-160 chars, no mid-word truncation"; the cleanest fix is a length-bounded word-safe slice that targets 145-155 and guarantees (a) ends at a word/punctuation boundary and (b) falls within 140-160 with ellipsis. See recommended fix below.

### Dockerfile Analyzer page
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/tools/dockerfile-analyzer/index.astro`
- **Current description (line 10, 196 chars):** `"Free Dockerfile linter and best-practice analyzer by a Kubernetes architect. Dozens of rules for security, efficiency, and maintainability. 100% browser-based — your code never leaves your device."`
- Over budget by 36 chars.

### Build verifier (must be updated)
- **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/scripts/verify-sitemap-determinism.mjs`
- **`LOC_FLOOR = 1184`** at line 40. Phase 123 comment explicitly says: *"When Phase 125 ships (TSEO-03 pagination removal + TSEO-05 sparse tag removal), update this constant DOWNWARD to the new expected total — and cite the Phase 125 PR URL."*

---

## Per-Requirement Plan

### TSEO-02: Self-referencing canonicals on `/blog/2..6/`

**Status:** Implicitly satisfied by `SEOHead.astro` default. Three options for the planner:

| Option | Work | Regression Safety |
|--------|------|-------------------|
| A. Document only — add a comment in `[...page].astro` noting reliance on `SEOHead.astro` default. | Zero | LOW — silent regression possible if default changes |
| B. Pass an explicit `canonicalURL` prop to `<Layout>` per page (self-referencing). | 1 line | HIGH — explicit in the paginated route |
| C. A + B + add a build-time verifier that parses `dist/blog/{2..6}/index.html` and asserts `<link rel="canonical" href="https://patrykgolabek.dev/blog/{N}/">`. | ~30 lines | HIGHEST |

**Recommendation:** **Option C.** The verifier is ~30 lines of script that asserts 6 specific `<link rel="canonical">` values. It closes the regression loop and matches the project's existing verifier pattern (see `scripts/verify-sitemap-determinism.mjs`, `scripts/verify-vs-wordcount.mjs`). Add the verifier invocation to `package.json`'s `build` script.

**Exact edit for Option B (recommended to pair with C):**
- In `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/[...page].astro`, change lines 82-85 from:
  ```astro
  <Layout
    title={pageTitle}
    description={pageDescription}
  >
  ```
  to:
  ```astro
  <Layout
    title={pageTitle}
    description={pageDescription}
    canonicalURL={new URL(page.currentPage === 1 ? '/blog/' : `/blog/${page.currentPage}/`, Astro.site)}
  >
  ```

### TSEO-03: Exclude pagination from sitemap

**Standard pattern (verified from `@astrojs/sitemap` 3.7.0 typed config + Phase 123 references):** add predicate to the existing `filter` callback.

**Exact edit** in `/Users/patrykattc/work/git/PatrykQuantumNomad/astro.config.mjs` line 29 — change:
```js
filter: (page) => !page.includes('/404'),
```
to:
```js
filter: (page) => !page.includes('/404') && !/\/blog\/\d+\/?$/.test(page),
```

Regex matches `/blog/2/`, `/blog/3/`, …, `/blog/6/` (and `/blog/N`) but NOT `/blog/` (page 1 stays), `/blog/{slug}/`, or `/blog/tags/{tag}/`.

**Verification after edit:** `dist/sitemap-0.xml` should contain `<loc>https://patrykgolabek.dev/blog/</loc>` but NOT `<loc>https://patrykgolabek.dev/blog/2/</loc>` (through 6).

### TSEO-04: `/feed.xml` as alias for `/rss.xml`

**Two options:**

| Option | Pro | Con |
|--------|-----|-----|
| A. **Duplicate endpoint** — create `src/pages/feed.xml.ts` that re-uses the RSS logic. | Works identically on GitHub Pages (static output). No redirect latency. Both URLs return 200 with identical bytes. | Two identical XML files in `dist/`. |
| B. HTTP redirect `/feed.xml` → `/rss.xml` via `astro.config.mjs` `redirects` or a `public/feed.xml` that contains an HTTP meta-refresh. | One source of truth. | GitHub Pages doesn't honor HTTP-level redirects set in Astro config (redirects need a hosting platform that processes them or require hand-rolled meta-refresh HTML); astro `redirects` for `output: 'static'` emits a redirect HTML page — inappropriate for a `.xml` MIME type. |

**Recommendation:** **Option A — duplicate endpoint.** Standard Astro pattern for the same feed content under a second path. GitHub Pages serves both with the correct `Content-Type` and RSS readers don't care that bytes are duplicated.

**Exact new file** at `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/feed.xml.ts`:
```ts
// /feed.xml — alias for /rss.xml. Any RSS reader pointed at either URL gets
// the identical feed. Duplicate endpoint rather than redirect because
// GitHub Pages static hosting can't serve redirects with XML Content-Type.
export { GET } from './rss.xml';
```

(Re-exporting `GET` keeps the RSS logic single-sourced in `rss.xml.ts`; any future edit propagates to both URLs automatically.)

**Verification:** `dist/feed.xml` and `dist/rss.xml` should exist and be byte-identical.

### TSEO-05: Exclude tag pages with < 3 posts from sitemap

**Tag audit (computed from `src/data/blog/*.mdx`, 55 non-draft posts, 58 unique tags):**

| Post count | Number of tags | Action |
|-----------|---------------|--------|
| ≥ 3 posts | **16 tags** | Keep in sitemap |
| < 3 posts | **42 tags** | Exclude from sitemap |

**Sparse tags that will disappear from sitemap** (42 total):
2-post: `claude-code`, `anthropic`, `developer-tools`, `agentic-workflow`, `context-engineering`, `ai-agent`, `architecture`, `programming-languages`, `software-aesthetics`, `eda`, `statistics`, `ios`, `iot`, `yaml` (14 tags)
1-post: `artificial-intelligence`, `machine-learning`, `generative-ai`, `visual-guide`, `ai-landscape`, `observability`, `prometheus`, `grafana`, `mcp`, `technical-debt`, `databases`, `database-compass`, `javascript`, `docker-compose`, `jupyter`, `notebooks`, `data-analysis`, `nist`, `data-visualization`, `terraform`, `ollama`, `fastapi`, `production`, `github-actions`, `ci-cd`, `automation`, `k8s`, `beauty-index` (28 tags)

**Kept tags** (16): `ai` (17), `devops` (15), `kubernetes` (14), `python` (13), `data-science` (13), `cloud-native` (12), `android` (7), `mobile` (7), `security` (5), `llm` (4), `data-engineering` (4), `ai-coding-assistant` (3), `code-quality` (3), `docker` (3), `containers` (3), `platform-engineering` (3).

**Implementation choice — sitemap filter only, DO NOT stop generating the pages:**
- The tag pages still need to exist so the blog index's tag cloud (links to `/blog/tags/{tag}/`) doesn't 404. The audit only demands sitemap exclusion, not noindex or deletion.
- The `tag-count` must be computed at config-load time the same way `content-dates.ts` already reads blog files. That module already exports helpers used by `astro.config.mjs`; add a `buildSparseTagSet()` sibling.

**Exact edit in `astro.config.mjs`:**

Add a new import at the top alongside `buildContentDateMap`:
```js
import { buildContentDateMap, resolvePrefixLastmod, buildSparseTagSet } from './src/lib/sitemap/content-dates';
```
Compute once at config load:
```js
const contentDates = buildContentDateMap();
const sparseTags = buildSparseTagSet(3); // tags with < 3 posts → Set<string>
```
Update the filter:
```js
filter: (page) => {
  if (page.includes('/404')) return false;
  if (/\/blog\/\d+\/?$/.test(page)) return false;  // TSEO-03
  const tagMatch = page.match(/\/blog\/tags\/([^/]+)\/?$/); // TSEO-05
  if (tagMatch && sparseTags.has(tagMatch[1])) return false;
  return true;
},
```

**New export in `src/lib/sitemap/content-dates.ts`** (~15 lines, mirrors the existing `readdirSync(blogDir)` pattern at line 107):
```ts
export function buildSparseTagSet(minPosts: number): Set<string> {
  const counts = new Map<string, number>();
  const blogDir = './src/data/blog';
  for (const file of readdirSync(blogDir)) {
    if (!/\.(md|mdx)$/.test(file)) continue;
    const raw = readFileSync(join(blogDir, file), 'utf-8');
    if (/^draft:\s*true/m.test(raw)) continue;
    for (const tag of extractTags(raw)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const sparse = new Set<string>();
  for (const [tag, n] of counts) if (n < minPosts) sparse.add(tag);
  return sparse;
}
```

**Verification:** `dist/sitemap-0.xml` should contain `<loc>https://patrykgolabek.dev/blog/tags/kubernetes/</loc>` but NOT `<loc>https://patrykgolabek.dev/blog/tags/terraform/</loc>`.

**LOC_FLOOR update:** Phase 125 drops 5 pagination URLs + 42 tag URLs = **47 URLs**. New `LOC_FLOOR = 1184 - 47 = 1137`. Update `scripts/verify-sitemap-determinism.mjs` line 40 accordingly and update the citation comment to reference the Phase 125 PR number.

### OPSEO-01: dark-code title 55-60 chars

**Two sub-fixes required** — a frontmatter edit alone is insufficient because `[slug].astro` truncates at `:`. Planner must pick a strategy:

| Strategy | Frontmatter title | Truncation logic |
|----------|------------------|-----------------|
| **A. Shorten the frontmatter title so truncation never fires** | Pick a title ≤ 48 chars so that `title + " — Patryk Golabek"` (17 chars) ≤ 65 chars. | Leave `[slug].astro:224-227` unchanged. |
| B. Keep the 64-char frontmatter title, rewrite truncation logic | Unchanged | Replace `title.split(':')[0]` with a smarter "first phrase under 43 chars" strategy. Risk: affects other posts' titles via the same path. |

**Recommendation:** **Strategy A.** Minimizes blast radius (only dark-code changes). The existing truncation logic is an intentional fallback; changing it affects the Beauty Index post and others.

**Candidate titles ≤ 48 chars (planner to pick one; DO NOT pick for them):**
Required final `<title>` tag = `"<frontmatter.title> — Patryk Golabek"`, target 55-60 chars total. With 17-char suffix, frontmatter title target = **38-43 chars**.

| # | Candidate | Title chars | Final `<title>` chars |
|---|-----------|-------------|----------------------|
| 1 | `Dark Code: Measuring AI's Codebase Rot` | 39 | 56 |
| 2 | `Dark Code: AI's Hidden Maintenance Debt` | 40 | 57 |
| 3 | `Dark Code: The Silent Rot AI Accelerated` | 41 | 58 |
| 4 | `Dark Code: How AI Hides Codebase Decay` | 39 | 56 |
| 5 | `Dark Code: The Metric Your Team Misses` | 39 | 56 |

Candidate #3 keeps the original's editorial voice while landing at 58 chars. Planner picks.

**Verification:** After edit, render `/blog/dark-code/` and assert `<title>` length is between 55 and 60 inclusive. An HTML-parse check in the TSEO-02 verifier can extend to cover this.

### OPSEO-02: dark-code description ≤ 160 chars, keywords front-loaded

**Current (219 chars):** `"AI coding assistants have accelerated a pre-existing problem: codebases filling with code no one understands, no one owns, and no one can safely change. A framework for measuring how much of your codebase has gone dark."`

**Keyword analysis:** The prioritized search keywords per the post's tags + content are: *dark code, AI coding assistants, technical debt, code quality, codebase, maintenance*. The current opening ("AI coding assistants have accelerated") front-loads the right keyword but the length kills the CTA.

**Candidate descriptions (planner picks one):**

| # | Candidate | Chars |
|---|-----------|-------|
| 1 | `AI coding assistants accelerate dark code: codebases filled with code no one understands, owns, or can safely change. A framework for measuring the rot.` | 152 |
| 2 | `Dark code — code no one understands, owns, or can safely change — is accelerating under AI coding assistants. A framework for measuring codebase rot.` | 152 |
| 3 | `AI coding assistants are accelerating dark code: code no one understands or owns. A 5-dimension framework for measuring how much of your codebase has gone dark.` | 159 |

**Verification:** `<meta name="description" content="...">` for `/blog/dark-code/` has length ≤ 160.

### OPSEO-03: Beauty Index descriptions 140-160, no mid-word truncation

**Finding:** The existing regex `\s+\S*$` already prevents mid-word truncation in all 26 cases. However, the rendered output has tail-word awkwardness (e.g., `"... Python's…"`, `"... of…"`). The spec says "mid-word" and the current code doesn't produce mid-word truncations — but the spirit of OPSEO-03 appears to target these awkward tail words.

**Recommended fix pattern — replace lines 80-83 with a word-boundary-aware truncator that targets 145-155 chars and prefers punctuation boundaries:**

```astro
// Bounded truncator: prefers sentence/clause boundary in [130, 155]; falls
// back to word boundary; never truncates mid-word. Guarantees ≤ 160 chars
// including the ellipsis.
function truncateDescription(full: string, targetMin = 140, targetMax = 157): string {
  if (full.length <= targetMax) return full;
  const slice = full.slice(0, targetMax);
  // Prefer the last clause/sentence boundary in the window.
  const boundary = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('; '),
    slice.lastIndexOf(', '),
  );
  if (boundary >= targetMin) return slice.slice(0, boundary + 1) + ' …';
  // Fall back to word boundary.
  const wordEnd = slice.lastIndexOf(' ');
  return (wordEnd >= targetMin ? slice.slice(0, wordEnd) : slice.replace(/\s+\S*$/, '')) + '…';
}
const metaDescription = truncateDescription(fullDescription);
```

**Alternative (more disruptive but highest quality):** author per-language descriptions as a new field in `languages.json` (140-160 chars, hand-written). Out of scope for a low-complexity batch phase.

**Recommendation:** stick with the algorithmic fix above. Add a unit test in `scripts/verify-beauty-index-descriptions.mjs` (new file) that asserts every generated description satisfies `140 ≤ len ≤ 160` and ends on a word+ellipsis or sentence boundary.

**Verification:** for each of 26 languages, `<meta name="description">` length is 140-160 and matches regex `^.*[.\w][\u2026]?$` (last non-ellipsis char is word or period).

### OPSEO-04: dockerfile-analyzer description ≤ 160 chars

**Current (196 chars):** `"Free Dockerfile linter and best-practice analyzer by a Kubernetes architect. Dozens of rules for security, efficiency, and maintainability. 100% browser-based — your code never leaves your device."`

**Candidates (planner picks):**

| # | Candidate | Chars |
|---|-----------|-------|
| 1 | `Free browser-based Dockerfile linter by a Kubernetes architect. 46 rules for security, efficiency, and maintainability — your code never leaves your device.` | 157 |
| 2 | `Free Dockerfile linter and best-practice analyzer. 46 rules for security, efficiency, and maintainability, 100% in-browser — your code never leaves you.` | 152 |
| 3 | `Free Dockerfile linter with 46 security, efficiency, and best-practice rules. Runs 100% in your browser — your Dockerfile never leaves your device.` | 147 |

(The "46 rules" figure is taken from `src/pages/blog/[slug].astro:139` in the dockerfile FAQ — it's the authoritative tool count.)

**Exact edit** in `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/tools/dockerfile-analyzer/index.astro`, line 10 — replace the `description="..."` value.

**Verification:** `<meta name="description">` for `/tools/dockerfile-analyzer/` ≤ 160 chars.

---

## Shared Architecture: SEO Surfaces

| Concern | File | Notes |
|---------|------|-------|
| `<title>`, `<meta name="description">`, `<link rel="canonical">` | `src/components/SEOHead.astro` | Single source of truth. All pages funnel through `Layout.astro` → `SEOHead.astro`. |
| Canonical default | `SEOHead.astro:18` | `new URL(Astro.url.pathname, Astro.site)` — self-references by default. |
| Sitemap filter | `astro.config.mjs:29` | `@astrojs/sitemap` 3.7.0 `filter: (page: string) => boolean`. |
| Sitemap lastmod registry | `src/lib/sitemap/content-dates.ts` + `src/lib/sitemap/static-dates.ts` | Phase 123. Contains dead entries for pagination + sparse tags after Phase 125; benign. |
| Build-time LOC floor | `scripts/verify-sitemap-determinism.mjs:40` | **Must decrement by 47** in Phase 125. |
| RSS feed | `src/pages/rss.xml.ts` | `@astrojs/rss` 4.0.15. |

No existing metadata validation script exists — TSEO/OPSEO verification is the place to add one. Recommended new verifier: `scripts/verify-on-page-seo.mjs` that parses specific built HTML files and asserts:
1. `/blog/{2,3,4,5,6}/index.html` each has `<link rel="canonical">` pointing to itself.
2. `/blog/dark-code/index.html` `<title>` is 55-60 chars.
3. `/blog/dark-code/index.html` `<meta name="description">` ≤ 160.
4. `/beauty-index/{26 slugs}/index.html` each has 140 ≤ description ≤ 160.
5. `/tools/dockerfile-analyzer/index.html` description ≤ 160.
6. `/feed.xml` bytes === `/rss.xml` bytes (or both files exist with matching sha256).

Append the new script to `package.json`'s `build`:
```json
"build": "astro build && node scripts/verify-vs-wordcount.mjs && node scripts/verify-vs-overlap.mjs && node scripts/verify-sitemap-determinism.mjs && node scripts/verify-no-google-fonts.mjs && node scripts/verify-on-page-seo.mjs",
```

---

## Wave Plan

**Recommendation: single wave, one PR, atomic commits per requirement.** Rationale: all 8 fixes touch distinct files (minimal merge-conflict risk), the changes are small (~150 LOC across all 8), they share a single verifier scaffold, and the planner can sequence commits to land verifier BEFORE the fixes so failing → passing is visible in CI.

Commit sequence (plan-level, not literal):

| # | Commit | Requirement | Files |
|---|--------|-------------|-------|
| 1 | Add on-page SEO verifier scaffold | (infra) | `scripts/verify-on-page-seo.mjs` (new), `package.json` |
| 2 | Explicit canonical on paginated blog pages | TSEO-02 | `src/pages/blog/[...page].astro` |
| 3 | Exclude blog pagination from sitemap | TSEO-03 | `astro.config.mjs` |
| 4 | `/feed.xml` alias for `/rss.xml` | TSEO-04 | `src/pages/feed.xml.ts` (new) |
| 5 | Exclude sparse tag pages from sitemap | TSEO-05 | `astro.config.mjs`, `src/lib/sitemap/content-dates.ts` |
| 6 | Lower LOC_FLOOR for sitemap verifier | TSEO-03/05 follow-up | `scripts/verify-sitemap-determinism.mjs` |
| 7 | Trim dark-code title and description | OPSEO-01/02 | `src/data/blog/dark-code.mdx` |
| 8 | Fix Beauty Index description truncation | OPSEO-03 | `src/pages/beauty-index/[slug].astro` |
| 9 | Trim dockerfile-analyzer description | OPSEO-04 | `src/pages/tools/dockerfile-analyzer/index.astro` |

If the planner wants strict 2-wave parallelism: Wave 1 = commits 1-6 (infrastructure + technical SEO), Wave 2 = commits 7-9 (on-page SEO). They are independent (no shared files) and can run concurrently.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Sitemap URL filtering | Custom post-build XML rewriter | `@astrojs/sitemap` `filter` option already wired in `astro.config.mjs` |
| RSS feed generation | Custom XML generator | `@astrojs/rss` already in `rss.xml.ts` |
| Canonical URL computation | Custom URL builder | `new URL(Astro.url.pathname, Astro.site)` pattern already in `SEOHead.astro` |
| Blog post discovery for tag counts | Custom fs walker | Existing `buildContentDateMap()` pattern in `src/lib/sitemap/content-dates.ts` — extend it |

---

## Common Pitfalls

### Pitfall 1: Noindex trap for pagination
**What goes wrong:** An SEO engineer reads "pagination pages dilute crawl budget" and reaches for `noindex`. Google's official pagination docs (https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) explicitly warn against this.
**Prevention:** Requirements explicitly say **"NOT noindex"**. Keep pages indexable; only remove from sitemap. REQUIREMENTS.md § Out of Scope reiterates this.

### Pitfall 2: Filter regex matches page 1
**What goes wrong:** Overly broad `/blog/\d*/?$/` would match `/blog/` and kill page 1 too.
**Prevention:** Use `/\/blog\/\d+\/?$/` (one-or-more digits, not zero-or-more). Bare `/blog/` has no digits and is preserved.

### Pitfall 3: Forgetting to lower LOC_FLOOR
**What goes wrong:** Phase 123's verifier asserts `locCount >= 1184`. Phase 125 will drop 47 URLs → 1137. The build fails with "URL count regressed."
**Prevention:** Commit 6 in the wave plan explicitly handles this. Also update the comment cite to the Phase 125 PR URL once it's known.

### Pitfall 4: Tag filter runs before build, collection changes after
**What goes wrong:** `buildSparseTagSet()` reads blog MDX at config load time. If someone adds a new blog post with only one tag that happens to already be ≥ 3, then later drops a post, the tag may fall below 3 but the filter won't re-evaluate without a rebuild.
**Prevention:** Not a real issue — Astro static builds run a fresh config evaluation every build. Flag for the planner that `buildSparseTagSet(3)` must use the **same filter conditions** (`draft !== true` in prod) as `[...page].astro` and `[tag].astro` to avoid drift.

### Pitfall 5: Trailing-slash mismatch breaks canonical match
**What goes wrong:** Astro's `trailingSlash: 'always'` means URLs are `/blog/3/`. If the explicit canonical override accidentally omits the slash (`/blog/3`), Google treats them as different URLs.
**Prevention:** The recommended Option B pattern uses `` `/blog/${page.currentPage}/` `` (trailing slash present). The verifier in commit 1 should assert trailing-slash presence.

### Pitfall 6: Description counting includes emoji / special chars
**What goes wrong:** JavaScript `.length` counts UTF-16 code units, not characters. A single emoji can be 2 units. Google's 160-char budget is in display characters.
**Prevention:** None of the current or candidate descriptions use emoji or surrogate-pair characters. The em-dash `—` is a single UTF-16 code unit (U+2014). Safe to use `.length`.

### Pitfall 7: `@astrojs/rss` `GET` re-export quirk
**What goes wrong:** Astro's endpoint inference requires the export to be recognized as an API route handler. Re-exporting `GET` from another file works on Astro 5.3+ (verified in `@astrojs/rss` 4.0.15 type signatures) but may fail silently if TypeScript tree-shaking drops it.
**Prevention:** Test both `dist/rss.xml` and `dist/feed.xml` exist and are non-empty after a clean build. The on-page SEO verifier asserts this.

---

## Open Questions (RESOLVED)

1. **Is OPSEO-03's "mid-word truncation" still reproducible, or was it fixed by an earlier phase?**
   - What we know: the current codebase's regex `\s+\S*$` prevents mid-word truncation. A 26-language simulation produced no mid-word cuts.
   - What's unclear: the SEO audit (dated 2026-02-13 in `.planning/quick/004-.../SEO-AUDIT.md`) predates the current code. An earlier implementation may have truncated mid-word and been partially fixed.
   - **Recommendation for planner:** treat OPSEO-03 as "tighten to 140-160 with robust truncation + add a regression test" rather than "fix a reproducible bug." The richer truncator proposed above still delivers the requirement and covers future drift.
   - **RESOLVED:** Planner adopted the recommendation — Plan 02 Task 2 replaces the truncator with a clause-boundary-aware 140-157 char helper, and Plan 03 Invariant 4 adds a regression test across all 26 languages.

2. **Should the on-page SEO verifier also cover blog/tags/{tag}/ descriptions?**
   - The audit flagged `"Blog posts about {tag} by Patryk Golabek"` (~41 chars) as too short, but that's tracked by a different requirement (§ 2.7 in the audit, not in TSEO-02..05 / OPSEO-01..04).
   - **Recommendation:** out of scope for Phase 125. Do not verify tag-page descriptions.
   - **RESOLVED:** Out of scope for Phase 125. Tag-page description length is not asserted by Plan 03.

3. **Does TSEO-02 require explicit canonical passing (Option B), or is Option A (document-only) acceptable?**
   - REQUIREMENTS.md language ("have self-referencing canonical tags") is ambiguous — it could be read as "emit them" (already done) or "emit them explicitly."
   - **Recommendation for planner:** go with Option B + C (explicit + verified) for durability. The cost is ~30 lines.
   - **RESOLVED:** Option B+C adopted — Plan 01 Task 1 passes an explicit `canonicalURL` prop in `[...page].astro`; Plan 03 Invariant 1 asserts each `/blog/{2..6}/index.html` has a self-referencing `<link rel="canonical">`.

4. **`COLLECTION_SHIP_DATES.beautyIndexLanguage` bump — worth it?**
   - Phase 123 documented that Phase 125's OPSEO-03 edits MAY warrant bumping the language-pages lastmod. However, the only change is the meta-description rendering logic, not the underlying content.
   - **Recommendation:** bump the constant to the Phase 125 ship date IF the final truncator produces different output for ≥ 1 language. Otherwise skip — an unchanged lastmod preserves Google's sitemap trust. A 5-minute diff check before the bump tells us.
   - **RESOLVED:** Deferred to executor — the diff check belongs in Plan 02 Task 2's verification block. If output differs for ≥ 1 language, bump the constant at execution time; otherwise leave untouched to preserve sitemap trust.

---

## Standard Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | ^5.3.0 | Framework | Already the project's framework |
| `@astrojs/sitemap` | ^3.7.0 | Sitemap generation with `filter` hook | In use since Phase 5 |
| `@astrojs/rss` | ^4.0.15 | RSS feed generation | In use since Phase 3 |

No new dependencies needed for Phase 125.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/[...page].astro` (blog pagination route, Astro 5 `paginate()` usage)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/tags/[tag].astro` (tag page route)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/[slug].astro` (blog slug truncation logic for OPSEO-01)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/rss.xml.ts` (RSS endpoint)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/SEOHead.astro` (SEO meta tags)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/beauty-index/[slug].astro` (Beauty Index description logic, lines 80-83)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/tools/dockerfile-analyzer/index.astro` (Dockerfile analyzer meta)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/data/blog/dark-code.mdx` (frontmatter)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/astro.config.mjs` (sitemap config)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/lib/sitemap/content-dates.ts` (tag extraction pattern)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/scripts/verify-sitemap-determinism.mjs` (LOC_FLOOR handoff)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/node_modules/@astrojs/rss/dist/index.d.ts` (RSS API surface)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/package.json` (dependency versions)

### Secondary (HIGH confidence — prior phase artifacts)
- `.planning/REQUIREMENTS.md` (exact TSEO/OPSEO wording)
- `.planning/ROADMAP.md` Phase 125 entry
- `.planning/research/FEATURES-seo-audit-fixes.md` (category-level research for Phase 125 fixes)
- `.planning/research/PITFALLS-seo-audit-fixes.md` (noindex anti-pattern discussion)
- `.planning/research/SUMMARY.md` (wave-ordering guidance)
- `.planning/phases/123-sitemap-lastmod/123-RESEARCH.md` + `123-0[1-3]-PLAN.md` (LOC_FLOOR handoff, COLLECTION_SHIP_DATES comment)
- `.planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/SEO-AUDIT.md` (original audit)

### Tertiary (referenced in FEATURES doc, LOW priority for this batch)
- [Google Pagination Best Practices](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) — self-referencing canonical recommendation
- [Search Engine Land — Pagination SEO 2025](https://searchengineland.com/pagination-seo-what-you-need-to-know-453707) — noindex anti-pattern confirmation

---

## Confidence Breakdown

| Area | Level | Reason |
|------|-------|--------|
| Standard stack | HIGH | All libraries already in `package.json` and the config; no new additions needed |
| Architecture | HIGH | Direct file inspection across 13 source files; all implementation points identified by line number |
| Pitfalls | HIGH | Phase 123 artifacts explicitly call out the LOC_FLOOR handoff; prior research on noindex anti-pattern is documented |
| Tag counts | HIGH | Computed deterministically from `src/data/blog/*.mdx` (55 posts, 58 tags) |
| Beauty Index mid-word bug | MEDIUM | Current code does NOT reproduce mid-word truncation; either the audit predates a fix or the term is being used loosely. The fix proposed is robust regardless. |
| dark-code title fix strategy | HIGH | Two strategies analyzed with explicit trade-offs; recommendation (A) keeps blast radius minimal |

**Research date:** 2026-04-16
**Valid until:** 2026-07-16 (descriptions may need refresh if new blog posts change tag counts near the threshold of 3)
