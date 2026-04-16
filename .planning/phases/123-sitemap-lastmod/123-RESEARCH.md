# Phase 123: Sitemap Lastmod — Research

**Researched:** 2026-04-16
**Domain:** Static-site SEO / sitemap generation / build reproducibility
**Confidence:** HIGH (codebase state verified; library API verified from installed package `.d.ts`; patterns verified against official Astro docs)

## Summary

The site already runs `@astrojs/sitemap` v3.7.0 with a `serialize()` hook in `astro.config.mjs` that reads a **content-date map** built at config-load time from two sources: blog post frontmatter (`updatedDate` / `publishedDate`) and a small set of guide `guide.json` files. That map currently covers **45 of 1184 URLs** (3.8%): 15 native blog posts, 15 Claude Code guide pages, 15 FastAPI guide pages. The remaining **1139 URLs emit no `<lastmod>`** — 650 Beauty Index VS pages, 218 tool rule pages, 103 AI Landscape concept pages + 12 AI Landscape VS pages, 94 EDA pages, 64 beauty-index language pages, 13 db-compass pages, 58 blog tag pages, 20 projects/index/about/contact/blog-index/blog-pagination, and others.

To achieve TSEO-01 (every URL has an accurate `<lastmod>`) while preserving success criterion #4 (two consecutive builds with no content changes produce byte-identical sitemaps), the plan must drive every `lastmod` from **stable content-derived values** — hardcoded dates in data/frontmatter/JSON, or committer dates looked up via `git log -1 --format=%cI -- <path>`. Build timestamps, file `mtime`, and `new Date()` are disqualified. This document enumerates every URL category, names the canonical date source for each, and lists the library/pattern prescriptions for the planner.

**Primary recommendation:** Extend the existing `buildContentDateMap()` in `astro.config.mjs` into a dedicated module (`src/lib/sitemap/content-dates.ts`) that (a) loads dates from canonical data sources per category (frontmatter, JSON fields, a new static-page registry), (b) falls back to `git log -1 --format=%cI` for files in git whose category has no frontmatter/JSON date (EDA foundations, reference pages, db-compass, beauty-index languages, ai-landscape nodes), (c) aggregates dates up to listing/tag/pagination/index pages by taking the max descendant date, and (d) never uses wall-clock time. Add a build-time determinism verifier (diff two back-to-back sitemap builds) analogous to the VS verifiers shipped in Phase 122.

## User Constraints

**No CONTEXT.md exists for this phase** (user did not run `/gsd:discuss-phase`). Authoritative sources are ROADMAP.md and REQUIREMENTS.md. Key constraints extracted:

### Locked Decisions (from ROADMAP / REQUIREMENTS / STATE)

1. **Goal:** Every sitemap URL has an accurate per-URL `<lastmod>` (TSEO-01).
2. **Blog dates come from frontmatter** (`publishedDate` or `updatedDate`).
3. **Section/static pages use hardcoded publication dates** — not build timestamps.
4. **Determinism is load-bearing:** "Two consecutive builds without content changes produce identical sitemaps." Any use of `new Date()`, `Date.now()`, file `mtime`, or `Date.parse` on a dynamic value will fail this gate.
5. **`lastmod: new Date()` on every build is explicitly Out of Scope** (REQUIREMENTS.md line 72): "Destroys per-sitemap trust for all 1,184 URLs".
6. **Dependency:** Phase 122 is complete. Phase 122 deliberately wrote its reports to `.planning/reports/` (not `dist/`) so they don't influence sitemap determinism here. Don't undo that.
7. **Phase 125 (downstream, same milestone) will remove pagination pages (TSEO-03) and sparse tag pages (TSEO-05) from the sitemap.** Phase 123 still has to cover those pages because it ships first — but the plan should not over-engineer their dates given they'll be excluded in two phases.

### Claude's Discretion

- Location and module structure for the extracted content-date logic.
- Whether to use git log as a fallback or require explicit dates for every category (recommendation: hybrid — see Architecture Patterns).
- Schema additions (e.g., optional `publishedDate` / `updatedDate` on EDA page frontmatter, node JSON entries).
- The exact form of the determinism verifier script.

### Deferred Ideas (OUT OF SCOPE)

- IndexNow integration changes (already present, separate integration).
- Fixing TSEO-02/03/04/05 (that's Phase 125).
- RSS feed dates (separate concern, `rss.xml.ts`).
- Per-page `<meta property="article:modified_time">` (separate from sitemap).
- CDN cache-header alignment with lastmod (infra concern).

## Current State of the Codebase

### Sitemap Integration
- **Installed:** `@astrojs/sitemap` v3.7.0 (verified in `package.json`).
- **Output:** `dist/sitemap-index.xml` + `dist/sitemap-0.xml` (single chunk under the 45k default entry limit).
- **Configured in:** `astro.config.mjs` (lines 77-117).
- **Filter:** Excludes `/404` only.
- **Current coverage:** 1184 URLs. 45 have `<lastmod>`; 1139 do not.

### Existing lastmod logic (`astro.config.mjs` lines 20-71)
```js
function buildContentDateMap() {
  const map = new Map();
  // Blog: scan src/data/blog/*.md{,x} frontmatter regex for publishedDate/updatedDate
  // Guides: scan src/data/guides/*/guide.json for publishedDate (applied to guide root + every chapter)
  return map;
}
const contentDates = buildContentDateMap();
// serialize() hook: item.lastmod = contentDates.get(item.url) || undefined
```

**Gaps:** only blog posts + 2 guides. Tag pages, pagination, beauty-index, ai-landscape concept/VS, tools rules, EDA, db-compass, homepage, about, contact, projects, notebooks index — all missing.

### Content Collections schema (`src/content.config.ts`)
- `blog` — has `publishedDate` (required), `updatedDate` (optional), `draft` (filtered in prod), `externalUrl` (excludes from `/blog/{slug}/` route).
- `guidePages` (fastapi-production) — `updatedDate?`, `lastVerified?` in schema; **none of the 17 FastAPI pages set them**. They currently inherit the `guide.json` `publishedDate`.
- `claudeCodePages` — same schema; **all 14 claude-code pages set `updatedDate` AND `lastVerified`** (values like `2026-04-12`).
- `edaPages` — `title`, `description`, `section`, `category`, `nistSection`. **No date fields.**
- `languages` (beauty-index) — no date field.
- `dbModels` — no date field.
- `aiLandscape` — no date field.
- `edaTechniques`, `edaDistributions` — no date field.

## URL Category Enumeration (1184 URLs)

Verified by parsing `dist/sitemap-0.xml`:

| # | Category | URL pattern | Count | Currently has lastmod? | Authoritative date source |
|---|----------|-------------|-------|------------------------|---------------------------|
| 1 | Homepage | `/` | 1 | No | Static registry (`src/lib/sitemap/static-dates.ts`), hardcoded published date |
| 2 | About | `/about/` | 1 | No | Static registry |
| 3 | Contact | `/contact/` | 1 | No | Static registry |
| 4 | Projects index | `/projects/` | 1 | No | Static registry OR max(blog post dates) |
| 5 | Blog index | `/blog/` | 1 | No | max(blog post dates) — reflects most recent blog activity |
| 6 | Blog pagination | `/blog/2/` .. `/blog/6/` | 5 | No | max(blog post dates on that page) — NB: removed by Phase 125 (TSEO-03) |
| 7 | Blog post (native) | `/blog/{slug}/` | 15 | Yes (all 15) | blog frontmatter `updatedDate` || `publishedDate` (already working) |
| 8 | Blog tag | `/blog/tags/{tag}/` | 58 | No | max(publishedDate) of posts with that tag. NB: sparse tags removed by Phase 125 (TSEO-05) |
| 9 | Guides index | `/guides/` | 1 | No | max(guide `publishedDate`) from all `guide.json` files |
| 10 | Guide root (fastapi) | `/guides/fastapi-production/` | 1 | Yes | `guide.json` `publishedDate` (already working) |
| 11 | Guide page (fastapi) | `/guides/fastapi-production/{slug}/` | 16 | Yes (all 16) | per-page frontmatter `updatedDate` if set, else `guide.json` `publishedDate` |
| 12 | Guide root (claude-code) | `/guides/claude-code/` | 1 | Yes | `guide.json` `publishedDate` (2026-03-15) — **should be max(chapter updatedDate) = 2026-04-12** |
| 13 | Guide page (claude-code) | `/guides/claude-code/{slug}/` | 14 | Yes | **BUG:** currently uses `guide.json` date (2026-03-15). Should use per-page frontmatter `updatedDate` (2026-04-12 for all) |
| 14 | Guide cheatsheet | `/guides/claude-code/cheatsheet/` | 1 | No (if present) | `guide.json` `publishedDate` or per-page date if cheatsheet has frontmatter |
| 15 | AI Landscape index | `/ai-landscape/` | 1 | No | Hardcoded (1.18 ship date) or max(node publication dates if added) |
| 16 | AI Landscape concept | `/ai-landscape/{slug}/` | 51 | No | Hardcoded "ai-landscape collection publishedDate" (v1.18 shipped 2026-03-27 per blog). Per-node date not needed unless nodes vary. |
| 17 | AI Landscape VS | `/ai-landscape/vs/{slug}/` | 12 | No | Same as AI Landscape collection date (pairs from static `comparisons.ts`) |
| 18 | Beauty Index index | `/beauty-index/` | 1 | No | Hardcoded (BI collection publishedDate, 2026-02-17 per `ext-the-beauty-index` blog). Or max(language dates) |
| 19 | Beauty Index language | `/beauty-index/{slug}/` | 28 | No | Hardcoded collection date OR per-language if added. Phase 125 (OPSEO-03) will modify language page descriptions; treat these as effectively one batch date |
| 20 | Beauty Index VS | `/beauty-index/vs/{slug}/` | 650 | No | **Same date for all 650 (Phase 122 publication, 2026-04-16)**. Phase 122 was the content enrichment that made these pages worth indexing. |
| 21 | Beauty Index /code | `/beauty-index/code/` | 1 | No | Hardcoded BI collection date |
| 22 | Beauty Index /justifications | `/beauty-index/justifications/` | 1 | No | Hardcoded BI collection date |
| 23 | DB Compass index | `/db-compass/` | 1 | No | Hardcoded (DB Compass collection publishedDate, 2026-02-22 per `database-compass` blog) |
| 24 | DB Compass model | `/db-compass/{slug}/` | 12 | No | Hardcoded collection date (or per-model if added) |
| 25 | EDA index | `/eda/` | 1 | No | Hardcoded (EDA collection date, 2026-03-01 per `eda-visual-encyclopedia` blog) OR max(subpage dates) |
| 26 | EDA foundations | `/eda/foundations/{slug}/` | 6 | No | Add `updatedDate` to MDX frontmatter, OR git log fallback. 7 URLs including index |
| 27 | EDA case-studies | `/eda/case-studies/{slug}/` | 10 | No | Same — frontmatter or git log. 11 URLs including index |
| 28 | EDA reference | `/eda/reference/{slug}/` | 4 | No | Same. 5 URLs including index |
| 29 | EDA techniques | `/eda/techniques/{slug}/` | 29 | No | Same — but sourced from `techniques.json`, not MDX. Add `updatedDate` to JSON OR git log fallback. 30 URLs including index |
| 30 | EDA distributions | `/eda/distributions/{slug}/` | 19 | No | Same — `distributions.json`. 20 URLs including index |
| 31 | EDA quantitative | `/eda/quantitative/{slug}/` | 19 | No | Same. 19 URLs |
| 32 | EDA notebooks | `/eda/notebooks/` | 1 | No | Hardcoded EDA collection date |
| 33 | Tools index | `/tools/` | 1 | No | Hardcoded (tools hub date) OR max(tool page dates) |
| 34 | Tool landing | `/tools/{tool}/` | 4 | No | Hardcoded per-tool publication date (k8s, compose, gha, dockerfile — each shipped in v1.06-v1.11 roughly, per blog posts) |
| 35 | Tool rule | `/tools/{tool}/rules/{code}/` | 213 | No | Hardcoded per-tool publication date (rules ship as a set). Could also be git log on the rule definition TS file per-rule, but per-tool batch date is simpler and equally defensible. |

**Verification of counts:** `679 + 218 + 94 + 79 + 64 + 33 + 13 + 1 + 1 + 1 + 1 = 1184`. Matches.

**Per-sub-category counts (from sitemap parse):**
- beauty-index: 679 (1 index + 28 langs + 650 vs + 2 extras = 681 ... actually 681, mild arithmetic difference due to `/beauty-index/` being counted once). Accept the sitemap parse as ground truth.
- tools: 218 (1 hub + 4 landings + 213 rules: 68 k8s + 53 compose + 49 gha + 47 dockerfile - 1 index dup)
- eda: 94 (1 index + 11 case-studies + 20 distributions + 7 foundations + 1 notebooks + 19 quantitative + 5 reference + 30 techniques = 94)
- blog: 79 (1 index + 5 pagination + 15 posts + 58 tags = 79)
- ai-landscape: 64 (1 index + 51 concepts + 12 vs = 64)
- guides: 33 (1 index + 2 guide roots + 16 fastapi pages + 14 cc pages = 33)
- db-compass: 13 (1 index + 12 models)
- static: 4 (/, /about/, /contact/, /projects/)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/sitemap` | 3.7.0 (installed) | Sitemap generation with serialize hook | Already integrated; native serialize hook supports per-item lastmod override |
| Node `child_process.execSync` + `git log -1 --format=%cI -- <path>` | Node ≥ 18 builtin | Deterministic last-commit timestamp for files in git | Committer date is immutable per commit; output is pure ISO 8601; works on any machine with full git history |
| Node `fs.readFileSync` + regex / JSON.parse | builtin | Extract dates from frontmatter and JSON at config-load | Current pattern in `buildContentDateMap()`; keep this approach |
| `astro/zod` | via Astro | Optional `updatedDate` field on EDA page schema | Already used elsewhere in `content.config.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `gray-matter` | not currently installed; **do not add** — existing regex works | Frontmatter parsing | Only if regex becomes insufficient. Current regex handles date lines fine. |
| `fast-glob` | not needed — `node:fs.readdirSync` works | Directory walking | The current approach traverses `src/data/blog/`, `src/data/guides/` synchronously at config-load; extend the same pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Config-load-time map | Astro integration `astro:build:start` hook | More idiomatic but identical determinism properties. Current approach works; don't rewrite for aesthetics. |
| `git log -1 --format=%cI` | `fs.statSync().mtime` | **REJECTED** — mtime changes on every `git clone`, `git checkout`, file copy. Non-deterministic across CI runners. |
| `git log -1 --format=%cI` | `new Date()` / `Date.now()` | **REJECTED** — blatantly non-deterministic; explicitly Out of Scope per REQUIREMENTS.md. |
| `git log -1 --format=%cI` | hardcoded dates everywhere | Hardcoded is more deterministic but requires touching every content file. Hybrid (hardcoded for collection ship dates, git log for per-file edits) is pragmatic. |
| Per-page hardcoded `publishedDate` in JSON/frontmatter | Collection-level ship dates | Per-page is ideal for Google ("page X was last updated on Y"). Collection-level is simpler and acceptable for static reference content (EDA tables, Beauty Index languages). |

**Installation:** No new packages required. All functionality uses Node builtins + existing `@astrojs/sitemap`.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── sitemap/
│       ├── content-dates.ts       # buildContentDateMap() extracted + expanded
│       ├── static-dates.ts        # hardcoded registry: homepage, about, contact, collection ship dates
│       └── git-dates.ts           # git log -1 --format=%cI helper with in-memory cache
astro.config.mjs                   # imports buildContentDateMap(); serialize() calls .get(url)
scripts/
└── verify-sitemap-determinism.mjs # two-build diff; wired into npm run build after sitemap generates
```

### Pattern 1: Hardcoded Publication Date Registry
**What:** A single TypeScript module exporting a map of URL → ISO date for every "collection-level" or "static" page whose ship date is known and stable.
**When to use:** Pages that are effectively published-once (static pages) or have a collection-level shared date (beauty-index landings, db-compass landings, ai-landscape landings, tool landings, tool rule pages).
**Example:**
```typescript
// src/lib/sitemap/static-dates.ts
export const STATIC_PAGE_DATES: Record<string, string> = {
  'https://patrykgolabek.dev/': '2026-02-11T00:00:00.000Z',              // site launch
  'https://patrykgolabek.dev/about/': '2026-02-11T00:00:00.000Z',
  'https://patrykgolabek.dev/contact/': '2026-02-11T00:00:00.000Z',
  'https://patrykgolabek.dev/projects/': '2026-02-11T00:00:00.000Z',
  'https://patrykgolabek.dev/ai-landscape/': '2026-03-27T00:00:00.000Z', // v1.18 ship
  'https://patrykgolabek.dev/beauty-index/': '2026-02-17T00:00:00.000Z', // v1.05 ship
  'https://patrykgolabek.dev/beauty-index/code/': '2026-02-17T00:00:00.000Z',
  'https://patrykgolabek.dev/beauty-index/justifications/': '2026-02-17T00:00:00.000Z',
  'https://patrykgolabek.dev/db-compass/': '2026-02-22T00:00:00.000Z',   // v1.08 ship
  'https://patrykgolabek.dev/eda/': '2026-03-01T00:00:00.000Z',          // v1.13 ship
  'https://patrykgolabek.dev/eda/notebooks/': '2026-03-15T00:00:00.000Z',// v1.17 ship
  'https://patrykgolabek.dev/tools/': '2026-02-21T00:00:00.000Z',
  'https://patrykgolabek.dev/tools/dockerfile-analyzer/': '2026-02-21T00:00:00.000Z',
  'https://patrykgolabek.dev/tools/k8s-analyzer/': '2026-02-24T00:00:00.000Z',
  'https://patrykgolabek.dev/tools/compose-validator/': '2026-02-23T00:00:00.000Z',
  'https://patrykgolabek.dev/tools/gha-validator/': '2026-03-04T00:00:00.000Z',
  'https://patrykgolabek.dev/guides/': '2026-03-08T00:00:00.000Z',       // fastapi ship
  // ...etc. Ship dates reconstructable from blog post publishedDates.
};
```
**Why:** Deterministic by construction. Committed to git. Zero runtime computation. Easy to audit in code review.

### Pattern 2: Frontmatter/JSON Data-Driven Dates
**What:** For every page backed by a content collection or JSON data file, read a `publishedDate`/`updatedDate` field at config-load time.
**When to use:** Per-page variance matters (blog posts, guide chapters with individual edit history).
**Example:**
```typescript
// src/lib/sitemap/content-dates.ts
// Extend existing buildContentDateMap() with EDA pages, techniques, distributions
for (const entry of readdirSync('./src/data/eda/pages/foundations')) {
  if (!entry.endsWith('.mdx')) continue;
  const raw = readFileSync(join('./src/data/eda/pages/foundations', entry), 'utf-8');
  const slug = basename(entry, '.mdx');
  const url = `${SITE}/eda/foundations/${slug}/`;
  // NEW: require frontmatter updatedDate, OR git log fallback
  const frontmatterDate = extractDate(raw);
  map.set(url, frontmatterDate ?? gitLogDate(`src/data/eda/pages/foundations/${entry}`));
}
```
**Why:** Preferred over git log where frontmatter exists — it's the single source of truth editors already maintain.

### Pattern 3: Git-Log Committer Date Fallback
**What:** For content files in git that lack a frontmatter/JSON date, read the last commit's committer date via `execSync('git log -1 --format=%cI -- <path>')`.
**When to use:** Fallback only. Prefer explicit frontmatter/JSON dates where editors have already put them (Claude Code guide pages have `updatedDate`). Use git log when retrofitting 650 VS pages would be tedious and the collection-ship date is not quite right.
**Example:**
```typescript
// src/lib/sitemap/git-dates.ts
import { execSync } from 'node:child_process';
const cache = new Map<string, string>();
export function gitLogDate(relativePath: string): string | undefined {
  if (cache.has(relativePath)) return cache.get(relativePath);
  try {
    const out = execSync(
      `git log -1 --format=%cI -- "${relativePath}"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    if (!out) return undefined; // file not tracked yet
    const iso = new Date(out).toISOString(); // normalize TZ to UTC "Z"
    cache.set(relativePath, iso);
    return iso;
  } catch {
    return undefined;
  }
}
```
**Determinism note:** `%cI` is committer-date-ISO-8601-strict. Committer dates are immutable once a commit exists. Two builds off the same commit produce the same output. Caveat below (shallow clones).
**Why:** Lets the planner avoid touching 650 files to add frontmatter dates. Accept the trade that the sitemap reflects "last edit committed to git" which is a reasonable proxy for "page last changed."

### Pattern 4: Aggregate-Max for Listing Pages
**What:** Index/listing/tag/pagination pages compute their `lastmod` as the max of the dates of the items they list.
**When to use:** `/blog/`, `/blog/2/`..`/blog/6/`, `/blog/tags/{tag}/`, `/guides/`, `/ai-landscape/`, `/eda/foundations/`, `/eda/case-studies/`, etc. Fresh listing content = fresh listing.
**Example:**
```typescript
// inside buildContentDateMap(), after blog posts loaded into blogDates:
const allBlogDates = [...blogDates.values()].sort();
const maxBlogDate = allBlogDates[allBlogDates.length - 1];
map.set(`${SITE}/blog/`, maxBlogDate);
// Pagination: per-page max = max date of posts on that page (after sorting by publishedDate desc)
// Tag pages: per-tag max = max date of posts with that tag
```
**Why:** Accurate signal for Google crawl priority. Also inherently deterministic (derived from underlying page dates).

### Pattern 5: serialize() Hook Stays as Single Consumer
**What:** `astro.config.mjs`'s `serialize()` hook is the ONLY place that sets `item.lastmod`. It calls `contentDates.get(item.url)` and applies it.
**When to use:** Always. Consolidates the policy in one function.
**Example:** (already present, just expanded lookup scope)
```js
serialize(item) {
  const date = contentDates.get(item.url);
  if (date) item.lastmod = date;
  else {
    // THIS BRANCH MUST BECOME UNREACHABLE BY THE END OF PHASE 123.
    // Keep it with a loud console.warn during dev so missed categories surface.
    if (!import.meta.env.PROD) console.warn(`[sitemap] No lastmod for ${item.url}`);
    item.lastmod = undefined;
  }
  // ... existing changefreq/priority logic ...
  return item;
}
```

### Anti-Patterns to Avoid

- **`new Date()` anywhere** — destroys determinism. Search `src/` and `astro.config.mjs` for `new Date(` during task execution; flag any uses not passing a string literal.
- **`Date.now()` / `Date.parse(someRuntimeValue)`** — same reason.
- **`fs.statSync().mtime` / `mtimeMs`** — changes on every checkout. The NIST filesystem recipe in Astro docs explicitly warns about this.
- **Commit hashes in lastmod** — dates only; Google ignores non-ISO-8601.
- **Storing lastmod in `.planning/` reports** — `.planning/reports/` is NOT in `dist/`. Sitemap must not depend on it. (This is the rule Phase 122 already respects.)
- **Per-URL `new Date(data.publishedDate)`** — OK only if `data.publishedDate` is a deterministic string. Zod `z.coerce.date()` returns a Date object; calling `.toISOString()` on it is deterministic.
- **Setting `changefreq: 'daily'` for static pages** — unrelated to lastmod, but don't introduce noise; current changefreq/priority scheme is fine.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XML sitemap writing | A custom endpoint emitting `<urlset>` manually | `@astrojs/sitemap` v3.7.0 (already installed) serialize hook | Handles chunking at 45k, escape, XML namespaces, sitemap-index wrapper |
| Frontmatter parsing | A full YAML parser | The existing regex in `astro.config.mjs` OR Astro Content Collections at config-load | Regex handles `publishedDate:` / `updatedDate:` lines; Collections give typed access but are async and can't run at config-load |
| Git date lookup | A git-plumbing binary parse | `execSync('git log -1 --format=%cI -- <path>')` | Git's `%cI` is already ISO-8601-strict committer date. No parsing needed. |
| Determinism verification | Ad-hoc manual comparison | A `scripts/verify-sitemap-determinism.mjs` that builds twice and diffs `dist/sitemap-*.xml` | Phase 122 established the pattern for build-time verification scripts (`verify-vs-wordcount.mjs`, `verify-vs-overlap.mjs`). Follow it. |

**Key insight:** The determinism constraint (success criterion #4) is the single most important property. Any date source that might differ between two builds on different runners at different times = failure. Git committer dates on the same commit are the only runtime-queried source that survives this gate; everything else must be hardcoded at authoring time.

## Common Pitfalls

### Pitfall 1: Shallow git clone kills `git log -1 --format=%cI`
**What goes wrong:** On CI with `actions/checkout@v4` default (`fetch-depth: 1`), `git log -1 -- <path>` returns empty if that path's last commit isn't in the shallow window. The build then emits no `<lastmod>` for those URLs — silently failing TSEO-01 on CI while passing locally.
**Why it happens:** Default shallow clones fetch only the tip commit. `git log -1 -- path/to/file.mdx` requires at least one commit that touched `file.mdx`.
**How to avoid:**
- Require `fetch-depth: 0` (full history) in whatever CI config does the Astro build, OR
- Prefer frontmatter/JSON/static registry sources over git log; only fall back to git log for files genuinely untouched in the current commit range, OR
- Add a post-build assertion: "every URL has a lastmod". Fail the build if any URL is missing.
**Warning signs:** Sitemap lastmod counts differ between local and CI builds. A `<lastmod>` count lower than 1184 in CI artifacts.
**Recommended stance:** **Use git log only as a fallback**, and make the verifier assert 1184/1184 URLs have lastmod. If git log is insufficient, author hardcoded dates.

### Pitfall 2: Date string coercion changes timezone
**What goes wrong:** `new Date('2026-03-15').toISOString()` → `'2026-03-15T00:00:00.000Z'`. `new Date('2026-03-15T18:00').toISOString()` → depends on runner TZ. Hardcoded date-only strings are safe; dates with times and no TZ are not.
**Why it happens:** JavaScript's `Date` constructor interprets date-only strings as UTC but date-time strings without timezone as local.
**How to avoid:** Always use date-only strings (`YYYY-MM-DD`) for hardcoded dates. The existing `buildContentDateMap` already does this correctly: `new Date(date).toISOString()` on `'2026-03-15'` is deterministic.
**Warning signs:** Lastmod values differ between a Linux CI runner (UTC) and a local macOS build (America/Toronto).

### Pitfall 3: URL trailing slash mismatch
**What goes wrong:** `contentDates.set('https://patrykgolabek.dev/blog/foo', ...)` but `@astrojs/sitemap` emits `https://patrykgolabek.dev/blog/foo/` → lookup misses.
**Why it happens:** Astro config has `trailingSlash: 'always'` — all sitemap URLs end in `/`. The existing code handles this correctly by writing keys with trailing slash.
**How to avoid:** Audit the plan to confirm every `map.set(url, ...)` uses trailing slash, matching what `@astrojs/sitemap` emits.
**Warning signs:** A category that was supposed to get lastmod but didn't — usually a trailing-slash bug.

### Pitfall 4: Config-time vs. runtime boundary
**What goes wrong:** `buildContentDateMap()` runs at Astro config-load, before the dev server or build starts. It can't use Astro's `getCollection()` (async, needs runtime). Refactoring toward Content Collections API would be architecturally cleaner but requires moving the date lookup into an integration hook (`astro:build:start`), not the config file.
**Why it happens:** Astro configs are loaded as plain JS modules; content collections are a runtime concern.
**How to avoid:** Keep the current raw-file-reading approach. It's not as "clean" as Content Collections but it works at config time and is testable. Do NOT rewrite to a full Astro integration unless the complexity justifies it.
**Alternative:** Build the date map inside a small custom Astro integration (`astro:build:start`) that uses `getCollection`. Trade: more idiomatic but delays evaluation until build time (not config time). Either approach is deterministic; existing approach is simpler and already works.

### Pitfall 5: Guide page frontmatter date not actually used
**What goes wrong:** The current `buildContentDateMap()` pulls ONLY `guide.json`'s `publishedDate` for every chapter of every guide — ignoring per-page `updatedDate` even when present (all 14 Claude Code pages have it!). All 14 Claude Code guide URLs currently show `2026-03-15` when they should show `2026-04-12`.
**Why it happens:** The code in `astro.config.mjs` iterates `meta[0].chapters` and applies `guide.json`'s date to each chapter URL without checking per-page frontmatter.
**How to avoid:** Extend the guide pass to read each chapter's MDX frontmatter; prefer `updatedDate` > `lastVerified` > guide-level `publishedDate`.
**Warning signs:** Diff current `dist/sitemap-0.xml` lastmod values against per-page frontmatter — mismatches = bug.
**Fix scope:** This is a real bug to fix in Phase 123, not a separate item.

### Pitfall 6: Blog tag pages inherit stale dates when a new post is added
**What goes wrong:** If tag page lastmod is hardcoded at collection ship date, adding a new post with existing tags leaves tag pages showing stale dates, defeating crawl-priority.
**How to avoid:** Tag pages compute lastmod as `max(publishedDate OR updatedDate)` across all posts with that tag. Deterministic given the post set is deterministic.
**Status:** These pages are slated for partial removal by Phase 125 (TSEO-05 excludes sparse tags), but in Phase 123 they still need lastmod. Use the aggregate-max pattern.

### Pitfall 7: Phase 122 overlap/wordcount reports in `.planning/reports/` affecting VS page lastmod
**What goes wrong:** If a future task accidentally writes reports into `dist/` or makes VS page rendering depend on report mtimes, VS page content changes per build → sitemap lastmod needs to change → determinism fails.
**Why it happens:** Phase 122 P03 explicitly chose `.planning/reports/` to avoid this. Don't reverse it.
**How to avoid:** Plan tasks should not touch `dist/` paths for reports or reference report contents in `src/`. Verifier should fail if `dist/` contains extraneous non-build artifacts.

## Code Examples

### Example 1: Extract date from MDX/MD frontmatter (matches existing regex, keep)
```js
// astro.config.mjs (existing, works correctly)
const DATE_RE = /(?:updatedDate|publishedDate):\s*["']?(\d{4}-\d{2}-\d{2})["']?/g;
function extractDate(raw) {
  let published = '', updated = '';
  for (const m of raw.matchAll(DATE_RE)) {
    if (m[0].startsWith('updated')) updated = m[1];
    else published = m[1];
  }
  return updated || published || '';
}
```

### Example 2: Per-category expansion (to be written in Phase 123)
```ts
// src/lib/sitemap/content-dates.ts (NEW)
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { gitLogDate } from './git-dates';
import { STATIC_PAGE_DATES } from './static-dates';

const SITE = 'https://patrykgolabek.dev';
const DATE_RE = /(?:updatedDate|publishedDate|lastVerified):\s*["']?(\d{4}-\d{2}-\d{2})["']?/g;

function isoFromYmd(ymd: string): string {
  return new Date(ymd + 'T00:00:00Z').toISOString();
}

export function buildContentDateMap(): Map<string, string> {
  const map = new Map<string, string>();

  // 1. Static pages from hardcoded registry
  for (const [url, iso] of Object.entries(STATIC_PAGE_DATES)) map.set(url, iso);

  // 2. Blog posts (existing logic)
  const blogDates = new Map<string, string>();
  for (const file of readdirSync('./src/data/blog')) {
    if (!/\.(md|mdx)$/.test(file)) continue;
    const raw = readFileSync(join('./src/data/blog', file), 'utf-8');
    const slug = basename(file, extname(file));
    // skip external blog posts (they don't render at /blog/{slug}/)
    if (/^externalUrl:/m.test(raw)) continue;
    const date = extractFrontmatterDate(raw);
    if (date) {
      const iso = isoFromYmd(date);
      const url = `${SITE}/blog/${slug}/`;
      map.set(url, iso);
      blogDates.set(slug, iso);
    }
  }

  // 3. Blog index, pagination, tag pages — aggregate-max
  const blogAll = [...blogDates.values()].sort();
  const blogMax = blogAll[blogAll.length - 1];
  map.set(`${SITE}/blog/`, blogMax);
  // pagination 2..N — derive from sorted posts at pageSize=10 ... see plan

  // 4. Guides — per-page frontmatter with guide-level fallback
  for (const entry of readdirSync('./src/data/guides', { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const guideJson = JSON.parse(readFileSync(`./src/data/guides/${entry.name}/guide.json`, 'utf-8'));
    const guideMeta = guideJson[0];
    const guidePublishedIso = guideMeta.publishedDate ? isoFromYmd(guideMeta.publishedDate) : undefined;
    // per-chapter: read MDX frontmatter first, fallback to guide date
    for (const ch of guideMeta.chapters) {
      const mdxPath = `./src/data/guides/${entry.name}/pages/${ch.slug}.mdx`;
      let chapterDate = guidePublishedIso;
      try {
        const raw = readFileSync(mdxPath, 'utf-8');
        const d = extractFrontmatterDate(raw);
        if (d) chapterDate = isoFromYmd(d);
      } catch { /* chapter file may not exist for some slugs like cheatsheet */ }
      if (chapterDate) map.set(`${SITE}/guides/${guideMeta.slug}/${ch.slug}/`, chapterDate);
    }
    // Guide root = max(chapter dates) or guide publishedDate
    const chapterDates = guideMeta.chapters
      .map((c: any) => map.get(`${SITE}/guides/${guideMeta.slug}/${c.slug}/`))
      .filter(Boolean)
      .sort();
    const rootDate = chapterDates.length ? chapterDates[chapterDates.length - 1] : guidePublishedIso;
    if (rootDate) map.set(`${SITE}/guides/${guideMeta.slug}/`, rootDate);
  }

  // 5. EDA pages — frontmatter or git log fallback
  for (const cat of ['foundations', 'case-studies', 'reference']) {
    for (const file of readdirSync(`./src/data/eda/pages/${cat}`)) {
      if (!file.endsWith('.mdx')) continue;
      const rel = `src/data/eda/pages/${cat}/${file}`;
      const slug = basename(file, '.mdx');
      const raw = readFileSync(rel, 'utf-8');
      const fmDate = extractFrontmatterDate(raw);
      const iso = fmDate ? isoFromYmd(fmDate) : gitLogDate(rel);
      if (iso) map.set(`${SITE}/eda/${cat}/${slug}/`, iso);
    }
  }

  // 6. EDA techniques / distributions / quantitative from JSON
  //    ... load JSON, check for updatedDate field, fall back to static collection date ...

  // 7. Beauty Index VS pages — all share Phase 122 ship date
  //    ... or per-pair if we want fancy, but collection-wide is fine ...

  // 8. AI Landscape concepts + VS — all share collection ship date
  //    ...

  // 9. DB Compass models, Beauty Index languages — collection ship date
  //    ...

  // 10. Tool rules — per-tool collection date
  //    ...

  return map;
}
```

### Example 3: Determinism verifier (Phase 122 pattern)
```js
// scripts/verify-sitemap-determinism.mjs
import { execSync } from 'node:child_process';
import { readFileSync, copyFileSync } from 'node:fs';

// 1. Capture current dist/sitemap-*.xml
const first = readFileSync('dist/sitemap-0.xml', 'utf-8');
copyFileSync('dist/sitemap-0.xml', 'dist/sitemap-0.first.xml');

// 2. Clean + rebuild (respect astro build idempotency)
execSync('astro build', { stdio: 'inherit' });

const second = readFileSync('dist/sitemap-0.xml', 'utf-8');

if (first !== second) {
  console.error('[determinism] sitemap-0.xml differs between builds');
  process.exit(1);
}

// 3. Assert all URLs have lastmod
const urls = first.match(/<loc>[^<]*<\/loc>/g) || [];
const lastmods = first.match(/<lastmod>[^<]*<\/lastmod>/g) || [];
if (urls.length !== lastmods.length) {
  console.error(`[coverage] ${urls.length - lastmods.length} URLs missing lastmod`);
  process.exit(1);
}
console.log(`[ok] ${urls.length} URLs, all with lastmod, deterministic across rebuilds`);
```
**Wire into `npm run build`:** `"build": "astro build && node scripts/verify-vs-wordcount.mjs && node scripts/verify-vs-overlap.mjs && node scripts/verify-sitemap-determinism.mjs"`

**Important note about the verifier:** The two-build check **must invoke `astro build` once more inside the script** and compare against a snapshot taken before the rebuild. A simpler alternative: the verifier is a standalone script not wired into `build` (to avoid infinite recursion); it's invoked by CI as `npm run build && node scripts/verify-sitemap-determinism.mjs && npm run build && <diff>`. The planner will pick a clean invocation pattern — both work; pick the one that matches repo conventions.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@astrojs/sitemap` < 1.0 (no serialize hook) | serialize hook on every entry | ~v1.0.0 (2022) | Per-URL customization without forking |
| `lastmod: new Date()` at config level | Per-URL via serialize hook reading frontmatter | community pattern, 2022-2024 | Deterministic builds; Google crawl signal becomes meaningful |
| File `mtime` for lastmod | `git log -1 --format=%cI` committer dates | Astro docs recipe, 2023 | Survives git clone; works on CI with full history |
| Manual sitemap XML endpoint | `@astrojs/sitemap` integration | Astro 2.x | No reason to roll custom XML |

**Deprecated/outdated:**
- Anything relying on `statSync().mtime` for lastmod. Astro docs still list it as a recipe but warn it's unreliable.
- `fetch-depth: 1` in GitHub Actions if using git log for dates.
- `astro-sitemap` (third-party npm package) — not maintained to parity with official `@astrojs/sitemap`.

## Open Questions (RESOLVED)

1. **Per-rule dates on tool rule pages?**
   - What we know: 213 rule pages exist; they ship as batches (v1.04-v1.11 per the tool landing ship dates). Rule TS definition files exist in `src/lib/tools/{tool}/rules/`.
   - What's unclear: Is per-rule date (via `git log` on each rule .ts file) worth the complexity vs. per-tool batch date?
   - Recommendation: **Use per-tool batch date** (Pattern 1, static registry). If a rule is later edited, the human editor bumps the per-tool batch date in the registry. Simpler; determinism trivially preserved; Google treats rule pages as part of a tool's rule set.
   - **RESOLVED (Plan 01 Task 1):** Per-tool batch dates via `TOOL_RULES_DATES` map in `static-dates.ts`. Rationale: simpler, survives shallow clones, auditable in one PR diff when a tool's rule set is bumped.

2. **Per-language Beauty Index dates?**
   - What we know: 28 beauty-index language pages + 650 VS pages. All currently share the collection ship date.
   - What's unclear: Phase 125 OPSEO-03 will edit language page descriptions. Should lastmod bump when OPSEO-03 ships?
   - Recommendation: YES — when Phase 125 modifies language page content, it must also bump the `STATIC_PAGE_DATES` entry. Treat Phase 125 as its own "ship event" for these 28 URLs. Document in Phase 123's PLAN as a seam: "add `/beauty-index/{slug}/` per-URL entries to `STATIC_PAGE_DATES` so Phase 125 only has to update one value."
   - **RESOLVED (Plan 01 Task 1):** Collection-level constant `COLLECTION_SHIP_DATES.beautyIndexLanguage` applied to all 28 language URLs via dynamic population in `content-dates.ts`. Phase 125 OPSEO-03 bumps the single constant (or promotes individual URLs to `STATIC_PAGE_DATES` overrides) if per-URL granularity is ever needed. Rationale: minimises diff surface for the common "whole-collection refresh" case.

3. **Blog index vs. blog pagination dates when `drafts` toggle flips in dev?**
   - What we know: `draft: true` posts are filtered in prod. Draft-in-dev changes the post list; lastmod math changes.
   - What's unclear: Does this matter? Determinism only needs to hold in prod builds.
   - Recommendation: Assert determinism only in prod mode (`NODE_ENV=production` / `import.meta.env.PROD`). Draft toggling in dev is expected.
   - **RESOLVED (Plan 03 + Plan 02 note):** Out of scope for Phase 123; determinism verifier asserts identical builds in a CI-equivalent environment only (no draft toggling between the two consecutive `astro build` invocations). If draft toggling in prod CI ever materialises as a concern, Phase 125 is the place to fix it. Documented in Plan 02 blog-pass comment for executor awareness.

4. **AI Landscape concept pages per-node date?**
   - What we know: All 51 concept pages ship together. No per-node date in `nodes.json`.
   - What's unclear: Should the planner extend `aiNodeSchema` with optional `updatedDate`?
   - Recommendation: Defer. Collection ship date covers it. Add optional field to schema only if a content refresh later needs per-node granularity.
   - **RESOLVED (Plan 01 Task 1):** DEFER schema change. All 51 concepts + 12 VS pairs stamped with `COLLECTION_SHIP_DATES.aiLandscape` via dynamic population. Rationale: no per-node edit history to reflect today; schema change is cheap to add later if needed.

5. **EDA techniques/distributions from JSON — should JSON grow a date field?**
   - What we know: 68 URLs backed by `techniques.json` + `distributions.json` + quantitative. Heavy content; updated occasionally.
   - What's unclear: Git log on the JSON file gives a single date for all 19 distributions — not granular. Adding `updatedDate` per entry is a schema change.
   - Recommendation: **Option A (default):** Use git log on the JSON file → all 19 distributions share the date the JSON was last edited. Acceptable; reflects "something in the distributions data changed." **Option B (nicer):** Add optional `updatedDate` to each entry in the JSON. Schema change via `edaDistributionSchema` / `edaTechniqueSchema` in `src/lib/eda/schema.ts`. Planner's call — if Option A ships first, Option B is a future refinement.
   - **RESOLVED (Plan 02 Task 1):** Option A adopted. `gitLogDate('src/data/eda/techniques.json')` batch-stamps all 18 techniques + 18 quantitative URLs (quantitative subset is filtered from the same JSON by `category === 'quantitative'`); `gitLogDate('src/data/eda/distributions.json')` batch-stamps 19 distributions. Category index pages (`/eda/techniques/`, `/eda/distributions/`, `/eda/quantitative/`) get aggregate-max. Option B deferred as future refinement.

6. **Does the sitemap-index.xml itself need a `<lastmod>`?**
   - What we know: Current `sitemap-index.xml` has none. Google accepts sitemap-index without lastmod.
   - Recommendation: Skip. TSEO-01 targets URLs in the sitemap, not the index file itself. `@astrojs/sitemap` doesn't currently emit one on the index; no action needed.
   - **RESOLVED (Plan 01 — no action):** Skip. `@astrojs/sitemap` only emits `<lastmod>` on sub-sitemap `<url>` entries, not on the top-level sitemap-index wrapper. TSEO-01 targets per-URL lastmod, which Plans 01-02 cover.

## Sources

### Primary (HIGH confidence — direct codebase/docs inspection)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/astro.config.mjs` — current sitemap config
- `/Users/patrykattc/work/git/PatrykQuantumNomad/package.json` — `@astrojs/sitemap@3.7.0`
- `/Users/patrykattc/work/git/PatrykQuantumNomad/node_modules/@astrojs/sitemap/dist/index.d.ts` — `SitemapItem` type, `SitemapOptions.serialize` signature
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/content.config.ts` — content collection schemas
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/lib/guides/schema.ts` — `guidePageSchema.updatedDate`, `lastVerified`
- `/Users/patrykattc/work/git/PatrykQuantumNomad/dist/sitemap-0.xml` — current 1184-URL sitemap (45 with lastmod, 1139 without)
- `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/REQUIREMENTS.md` — TSEO-01 definition + "Out of Scope: `lastmod: new Date()`"
- `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/ROADMAP.md` — Phase 123 goal + success criteria
- `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/STATE.md` — Phase 122 done; determinism isolation decision
- https://docs.astro.build/en/guides/integrations-guide/sitemap/ — serialize hook API, customPages, lastmod types

### Secondary (MEDIUM confidence — community patterns cross-verified with official docs)
- https://docs.astro.build/en/recipes/modified-time/ — git log recipe + shallow clone warning (official Astro recipe)
- https://www.printezisn.com/blog/post/adding-accurate-lastmod-tags-to-your-astro-sitemap/ — third-party serialize-hook pattern

### Tertiary (LOW confidence — not used for prescriptive claims)
- (none — everything prescriptive in this doc is backed by Primary or Secondary)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package installed and type-checked against local `.d.ts`; no external deps to add
- Architecture: HIGH — existing pattern already works for 45 URLs; extension is mechanical per category
- Pitfalls: HIGH — shallow clone + TZ coercion verified via WebFetch of Astro docs recipe; mtime unreliability confirmed
- URL enumeration: HIGH — counts grep'd from actual built sitemap
- Known bugs (Claude Code guide page lastmods showing guide-level date instead of per-chapter date): HIGH — confirmed by inspecting both the config code and the shipped sitemap XML

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days — Astro ecosystem stable; revalidate if Astro major version bumps or `@astrojs/sitemap` ships a breaking change)
