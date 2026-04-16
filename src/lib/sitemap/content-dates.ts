/**
 * Build the authoritative URL → `<lastmod>` ISO-8601 map consumed by the
 * `@astrojs/sitemap` serialize hook in `astro.config.mjs`.
 *
 * Precedence (evaluated per URL, first hit wins):
 *   1. Direct entries in `STATIC_PAGE_DATES` (hardcoded registry).
 *   2. Per-page MDX/MD frontmatter (blog posts, guide chapters).
 *   3. Collection ship dates (`COLLECTION_SHIP_DATES`) for dynamically-
 *      generated URLs (ai-landscape concepts/VS, beauty-index langs/VS,
 *      db-compass models).
 *   4. Prefix fallback via `resolvePrefixLastmod()` — handles tool rules
 *      and the ai-landscape VS route without enumerating all URLs here.
 *
 * Determinism: no `new Date()` with a runtime value, no `Date.now()`, no
 * `fs.statSync().mtime`. Every ISO string flows through `isoFromYmd()`
 * on a date-only "YYYY-MM-DD" literal read from frontmatter or JSON.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { STATIC_PAGE_DATES, TOOL_RULES_DATES, COLLECTION_SHIP_DATES } from './static-dates';
import { gitLogDate } from './git-dates';

const SITE = 'https://patrykgolabek.dev';
const DATE_RE = /(?:updatedDate|publishedDate|lastVerified):\s*["']?(\d{4}-\d{2}-\d{2})["']?/g;

function isoFromYmd(ymd: string): string {
  return new Date(ymd + 'T00:00:00Z').toISOString();
}

/**
 * Extract the best available date from MDX/MD frontmatter.
 * Precedence: updatedDate > lastVerified > publishedDate.
 */
function extractFrontmatterDate(raw: string): string | undefined {
  let published = '';
  let updated = '';
  let verified = '';
  for (const m of raw.matchAll(DATE_RE)) {
    if (m[0].startsWith('updated')) updated = m[1];
    else if (m[0].startsWith('lastVerified')) verified = m[1];
    else published = m[1];
  }
  return updated || verified || published || undefined;
}

/**
 * Blog posts with `externalUrl:` frontmatter do NOT generate a
 * `/blog/{slug}/` route; they redirect away. Skip them when building the
 * map so we don't emit lastmods for URLs Astro won't crawl.
 */
function isExternalBlog(raw: string): boolean {
  return /^externalUrl:/m.test(raw);
}

interface GuideMeta {
  slug?: string;
  publishedDate?: string;
  chapters?: Array<{ slug?: string }>;
}

export function buildContentDateMap(): Map<string, string> {
  const map = new Map<string, string>();

  // 1. Static page registry — direct per-URL entries.
  for (const [url, date] of Object.entries(STATIC_PAGE_DATES)) map.set(url, date);

  // 2. Blog posts — per-post frontmatter (updatedDate || publishedDate).
  //    External-URL posts do NOT generate /blog/{slug}/ routes, so skip them.
  //    (Plan 02 handles blog index / pagination / tag aggregation.)
  const blogDir = './src/data/blog';
  try {
    for (const file of readdirSync(blogDir)) {
      if (!/\.(md|mdx)$/.test(file)) continue;
      const raw = readFileSync(join(blogDir, file), 'utf-8');
      if (isExternalBlog(raw)) continue;
      const slug = basename(file, extname(file));
      const date = extractFrontmatterDate(raw);
      if (date) map.set(`${SITE}/blog/${slug}/`, isoFromYmd(date));
    }
  } catch { /* non-fatal — blog dir may be empty in some states */ }

  // 3. Guides — per-chapter MDX frontmatter with guide-JSON fallback.
  //
  //    BUG FIX (Phase 123 Plan 01): the previous inline logic applied
  //    `guide.json.publishedDate` to EVERY chapter, ignoring per-page
  //    frontmatter. All 14 Claude Code chapters have `updatedDate:
  //    2026-04-12` but the sitemap showed `2026-03-15` (guide-level date).
  //    Now each chapter URL uses its own frontmatter date first, falling
  //    back to guide.json only when the chapter MDX has no date fields.
  const guidesDir = './src/data/guides';
  try {
    for (const entry of readdirSync(guidesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const guideDir = `${guidesDir}/${entry.name}`;
      let guideMeta: GuideMeta | undefined;
      try {
        const parsed = JSON.parse(readFileSync(`${guideDir}/guide.json`, 'utf-8'));
        guideMeta = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch { continue; }
      if (!guideMeta?.slug) continue;
      const guideSlug = guideMeta.slug;
      const guideFallback = guideMeta.publishedDate ? isoFromYmd(guideMeta.publishedDate) : undefined;

      const chapterDates: string[] = [];
      for (const ch of guideMeta.chapters ?? []) {
        if (!ch?.slug) continue;
        const mdxPath = `${guideDir}/pages/${ch.slug}.mdx`;
        let chDate: string | undefined = guideFallback;
        try {
          const raw = readFileSync(mdxPath, 'utf-8');
          const fm = extractFrontmatterDate(raw);
          if (fm) chDate = isoFromYmd(fm);
        } catch {
          // Chapter MDX not present (e.g., synthetic cheatsheet routes).
          // Keep the guide-level fallback — better than no lastmod at all.
        }
        if (chDate) {
          map.set(`${SITE}/guides/${guideSlug}/${ch.slug}/`, chDate);
          chapterDates.push(chDate);
        }
      }

      // Guide root = max(chapter dates) or guide publishedDate.
      if (chapterDates.length) {
        const sorted = [...chapterDates].sort();
        map.set(`${SITE}/guides/${guideSlug}/`, sorted[sorted.length - 1]);
      } else if (guideFallback) {
        map.set(`${SITE}/guides/${guideSlug}/`, guideFallback);
      }
    }
  } catch { /* non-fatal — guides dir may not exist in some contexts */ }

  // /guides/ landing = max of guide roots.
  const guideRoots: string[] = [];
  for (const [url, d] of map) {
    const rel = url.startsWith(SITE) ? url.slice(SITE.length) : url;
    if (/^\/guides\/[^/]+\/$/.test(rel)) guideRoots.push(d);
  }
  if (guideRoots.length) {
    guideRoots.sort();
    map.set(`${SITE}/guides/`, guideRoots[guideRoots.length - 1]);
  }

  // ─── EDA subpages (Plan 02) ──────────────────────────────────────────
  //
  // Six URL categories per RESEARCH.md § URL Category Enumeration rows 26–31:
  //   MDX-backed:  /eda/foundations/{slug}/, /eda/case-studies/{slug}/, /eda/reference/{slug}/
  //   JSON-backed: /eda/techniques/{slug}/, /eda/distributions/{slug}/, /eda/quantitative/{slug}/
  //
  // Per-file precedence (MDX path):
  //   1. frontmatter updatedDate/lastVerified/publishedDate (via extractFrontmatterDate)
  //   2. git log committer date (gitLogDate) — FALLBACK, emits console.warn
  //      so shallow-clone breakage is visible in build logs
  //   3. COLLECTION_SHIP_DATES.eda — final safety net, also warns
  //
  // JSON path: batch date = gitLogDate(jsonFile) ?? COLLECTION_SHIP_DATES.eda.
  // Per-entry JSON dates were deferred per RESEARCH.md open-question #5
  // recommendation — Phase 123 Plan 02 scope is coverage, not per-entry
  // granularity for JSON-sourced EDA content.
  //
  // Category index pages (/eda/{category}/) get aggregate-max of their
  // subpages at the end of this block.
  const edaCategoryDates: Record<string, string[]> = {
    foundations: [],
    'case-studies': [],
    reference: [],
    techniques: [],
    distributions: [],
    quantitative: [],
  };

  for (const cat of ['foundations', 'case-studies', 'reference'] as const) {
    const catDir = `./src/data/eda/pages/${cat}`;
    let files: string[];
    try {
      files = readdirSync(catDir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;
      const slug = basename(file, '.mdx');
      const rel = `src/data/eda/pages/${cat}/${file}`;
      let iso: string | undefined;
      try {
        const raw = readFileSync(join(catDir, file), 'utf-8');
        const fm = extractFrontmatterDate(raw);
        if (fm) iso = isoFromYmd(fm);
      } catch {
        /* read failed — fall through to git log / collection date */
      }
      if (!iso) {
        const git = gitLogDate(rel);
        if (git) {
          iso = git;
          console.warn(
            `[sitemap] ${cat}/${slug}: frontmatter date absent, using git log (${git})`
          );
        }
      }
      if (!iso) {
        iso = COLLECTION_SHIP_DATES.eda;
        console.warn(
          `[sitemap] ${cat}/${slug}: no frontmatter, no git log — using EDA collection date`
        );
      }
      map.set(`${SITE}/eda/${cat}/${slug}/`, iso);
      edaCategoryDates[cat].push(iso);
    }
  }

  // JSON-backed EDA collections: techniques & distributions. The JSONs have
  // no per-entry date field, so every entry inherits the same batch date =
  // gitLogDate(jsonFile) || COLLECTION_SHIP_DATES.eda.
  for (const jsonFile of [
    { path: 'src/data/eda/techniques.json', urlCategory: 'techniques' as const },
    { path: 'src/data/eda/distributions.json', urlCategory: 'distributions' as const },
  ] as const) {
    let entries: Array<{ slug?: string; id?: string; category?: string }> = [];
    try {
      entries = JSON.parse(readFileSync(`./${jsonFile.path}`, 'utf-8'));
    } catch {
      continue;
    }
    const gitDate = gitLogDate(jsonFile.path);
    const batchDate = gitDate ?? COLLECTION_SHIP_DATES.eda;
    if (!gitDate) {
      console.warn(
        `[sitemap] ${jsonFile.path}: git log unavailable, using EDA collection date`
      );
    }
    for (const e of entries) {
      const slug = e?.slug ?? e?.id;
      if (!slug) continue;
      map.set(`${SITE}/eda/${jsonFile.urlCategory}/${slug}/`, batchDate);
      edaCategoryDates[jsonFile.urlCategory].push(batchDate);
    }
  }

  // Quantitative — mirror the route's filter exactly.
  //   src/pages/eda/quantitative/[slug].astro → getCollection('edaTechniques')
  //   then filters category === 'quantitative'. The edaTechniques collection
  //   is loaded from src/data/eda/techniques.json, so iterating the same
  //   JSON with the same filter produces byte-identical slug coverage (18
  //   URLs at plan time). If techniques.json grows/shrinks, this loop tracks
  //   the route output automatically.
  {
    const quantGitDate = gitLogDate('src/data/eda/techniques.json');
    const quantitativeBatchDate = quantGitDate ?? COLLECTION_SHIP_DATES.eda;
    let techniques: Array<{ slug?: string; id?: string; category?: string }> = [];
    try {
      techniques = JSON.parse(readFileSync('./src/data/eda/techniques.json', 'utf-8'));
    } catch {
      /* non-fatal — no quantitative URLs added, and /eda/quantitative/
         index will be omitted from edaCategoryDates */
    }
    const quantitative = techniques.filter((t) => t?.category === 'quantitative');
    for (const t of quantitative) {
      const slug = t?.slug ?? t?.id;
      if (!slug) continue;
      map.set(`${SITE}/eda/quantitative/${slug}/`, quantitativeBatchDate);
      edaCategoryDates.quantitative.push(quantitativeBatchDate);
    }
  }

  // Category index pages: /eda/{cat}/ = max(subpage dates). Do NOT override
  // /eda/ itself — that's the registry ship date from Plan 01.
  for (const [cat, dates] of Object.entries(edaCategoryDates)) {
    if (!dates.length) continue;
    const sorted = [...dates].sort();
    map.set(`${SITE}/eda/${cat}/`, sorted[sorted.length - 1]);
  }

  // 4. Beauty Index language pages (26 at time of writing) —
  //    `COLLECTION_SHIP_DATES.beautyIndexLanguage` populated per-URL so
  //    Phase 125 OPSEO-03 edits can later bump individual entries without
  //    affecting VS or concept dates.
  try {
    const langs = JSON.parse(readFileSync('./src/data/beauty-index/languages.json', 'utf-8'));
    for (const l of langs) {
      if (l?.id) map.set(`${SITE}/beauty-index/${l.id}/`, COLLECTION_SHIP_DATES.beautyIndexLanguage);
    }

    // 5. Beauty Index VS pages — every ordered pair (i !== j) as emitted by
    //    the VS route's getStaticPaths. 26 × 25 = 650 URLs, all stamped
    //    with the Phase 122 enrichment ship date. Iterating the ids array
    //    in its original JSON order guarantees deterministic map
    //    population (though Map iteration is insertion-order, the VS
    //    lookup is keyed by URL so order doesn't affect the serialize
    //    hook's output).
    const ids = (langs as Array<{ id?: string }>).map((l) => l.id).filter((x): x is string => Boolean(x));
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i === j) continue;
        const slug = `${ids[i]}-vs-${ids[j]}`;
        map.set(`${SITE}/beauty-index/vs/${slug}/`, COLLECTION_SHIP_DATES.beautyIndexVs);
      }
    }
  } catch { /* non-fatal */ }

  // 6. AI Landscape concepts (51) — collection ship date. VS pairs (12)
  //    are handled via `resolvePrefixLastmod()` because the route uses a
  //    static POPULAR_COMPARISONS list that isn't easily enumerable here.
  try {
    const nodes = JSON.parse(readFileSync('./src/data/ai-landscape/nodes.json', 'utf-8'));
    for (const n of nodes) {
      if (n?.slug) map.set(`${SITE}/ai-landscape/${n.slug}/`, COLLECTION_SHIP_DATES.aiLandscape);
    }
  } catch { /* non-fatal */ }

  // 7. DB Compass models — collection ship date.
  try {
    const models = JSON.parse(readFileSync('./src/data/db-compass/models.json', 'utf-8'));
    for (const m of models) {
      if (m?.id) map.set(`${SITE}/db-compass/${m.id}/`, COLLECTION_SHIP_DATES.dbCompassModel);
    }
  } catch { /* non-fatal */ }

  // 8. Tool rule pages — per-tool batch date. 213 URLs across 4 tools.
  //    Rules live in src/lib/tools/{tool}/rules/*.ts; enumerating them
  //    here would couple sitemap logic to route internals, so we use a
  //    URL-prefix fallback in `resolvePrefixLastmod()` instead.

  return map;
}

/**
 * Prefix-based lastmod lookup for URL families whose members aren't
 * enumerated in `buildContentDateMap()`. Consulted by the serialize hook
 * AFTER the direct map lookup misses.
 *
 * Covers:
 * - `/ai-landscape/vs/{pair}/`  → `COLLECTION_SHIP_DATES.aiLandscape`
 * - `/tools/{tool}/rules/{code}/` → `TOOL_RULES_DATES[tool]`
 */
export function resolvePrefixLastmod(url: string): string | undefined {
  // /ai-landscape/vs/{pair}/ — collection ship date
  if (url.startsWith(`${SITE}/ai-landscape/vs/`)) return COLLECTION_SHIP_DATES.aiLandscape;
  // /tools/{tool}/rules/{code}/ — per-tool batch date
  const sitePrefix = `${SITE}/tools/`;
  if (url.startsWith(sitePrefix)) {
    const rest = url.slice(sitePrefix.length);
    const slashIdx = rest.indexOf('/');
    if (slashIdx > 0 && rest.slice(slashIdx + 1).startsWith('rules/')) {
      const tool = rest.slice(0, slashIdx);
      return TOOL_RULES_DATES[tool];
    }
  }
  return undefined;
}
