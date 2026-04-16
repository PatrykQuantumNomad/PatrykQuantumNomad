/**
 * Authored, hardcoded URL → ISO date registry for section/static pages whose
 * `<lastmod>` is a ship event rather than per-edit frontmatter.
 *
 * Every value is produced from a date-only string ("YYYY-MM-DD") via the
 * `iso()` helper below, so the result is always `YYYY-MM-DDT00:00:00.000Z`
 * — deterministic regardless of the build runner's timezone.
 *
 * WHY HARDCODED:
 * - Survives shallow clones (CI default fetch-depth: 1 breaks git log lookups).
 * - Immune to routine commits that touch the layout without content changing.
 * - Auditable in code review — one PR diff shows what "shipped" vs. "was
 *   touched by a formatter."
 *
 * WHY PER-CATEGORY INSTEAD OF ONE GLOBAL DATE:
 * - Google's crawl priority for a Beauty Index VS page is legitimately tied
 *   to that VS collection's ship event, not the site's launch.
 * - Future phases (e.g. Phase 125 OPSEO-03) will modify a single collection
 *   (beauty-index language descriptions). Bumping the matching entry in
 *   `COLLECTION_SHIP_DATES` is the only change needed to reflect that.
 *
 * DO NOT introduce `new Date()` with no args, `Date.now()`, or any runtime
 * clock call in this module. Determinism is load-bearing for TSEO-01.
 */

const SITE = 'https://patrykgolabek.dev';

/**
 * Coerce a date-only "YYYY-MM-DD" string into a UTC ISO-8601 timestamp.
 * Date-only strings are interpreted as UTC by the JavaScript `Date`
 * constructor; appending `T00:00:00Z` is belt-and-suspenders to guarantee
 * the same output regardless of runner timezone or engine quirks.
 */
function iso(ymd: string): string {
  return new Date(ymd + 'T00:00:00Z').toISOString();
}

/**
 * Direct per-URL overrides. Trailing slash MUST match Astro's
 * `trailingSlash: 'always'` config — every key ends with `/`.
 */
export const STATIC_PAGE_DATES: Record<string, string> = {
  // Static pages — site launch baseline
  [`${SITE}/`]: iso('2026-02-11'),
  [`${SITE}/about/`]: iso('2026-02-11'),
  [`${SITE}/contact/`]: iso('2026-02-11'),
  [`${SITE}/projects/`]: iso('2026-02-11'),

  // AI Landscape — v1.18 ship (2026-03-27)
  [`${SITE}/ai-landscape/`]: iso('2026-03-27'),
  // ai-landscape concept pages and VS pairs — populated dynamically in
  // content-dates.ts from nodes.json + the VS getStaticPaths route.

  // Beauty Index — v1.05 landing ship (2026-02-17)
  [`${SITE}/beauty-index/`]: iso('2026-02-17'),
  [`${SITE}/beauty-index/code/`]: iso('2026-02-17'),
  [`${SITE}/beauty-index/justifications/`]: iso('2026-02-17'),
  // Beauty Index language pages (28) — populated dynamically in content-dates.ts
  //   so Phase 125 OPSEO-03 edits can promote individual entries here later.
  // Beauty Index VS pages (650) — populated dynamically in content-dates.ts
  //   at Phase 122 enrichment ship date (2026-04-16).

  // DB Compass — v1.08 ship (2026-02-22)
  [`${SITE}/db-compass/`]: iso('2026-02-22'),
  // Per-model URLs populated dynamically from models.json in content-dates.ts.

  // EDA — v1.13 landing ship (2026-03-01); notebooks v1.17 (2026-03-15)
  [`${SITE}/eda/`]: iso('2026-03-01'),
  [`${SITE}/eda/notebooks/`]: iso('2026-03-15'),
  // EDA subpages (foundations, case-studies, reference, techniques,
  // distributions, quantitative) are handled by Plan 02 via frontmatter +
  // git log, not enumerated here.

  // Tools hub + per-tool landings — dates from the shipping blog posts.
  [`${SITE}/tools/`]: iso('2026-02-21'),
  [`${SITE}/tools/dockerfile-analyzer/`]: iso('2026-02-21'),
  [`${SITE}/tools/k8s-analyzer/`]: iso('2026-02-24'),
  [`${SITE}/tools/compose-validator/`]: iso('2026-02-23'),
  [`${SITE}/tools/gha-validator/`]: iso('2026-03-04'),

  // Guides hub, individual guide roots, and chapter URLs are populated
  // dynamically from guide.json + per-chapter MDX frontmatter in
  // content-dates.ts (so the Claude Code per-chapter bug fix stays in the
  // single module responsible for guide dates).
};

/**
 * Per-tool batch dates for rule pages. Each tool's rule pages (e.g.
 * `/tools/dockerfile-analyzer/rules/DF-001/`) inherit ONE date. When a rule
 * set ships or is modified, bump the value here and every rule URL updates.
 * Consumed via prefix match in `resolvePrefixLastmod()`.
 */
export const TOOL_RULES_DATES: Record<string, string> = {
  'dockerfile-analyzer': iso('2026-02-21'),
  'k8s-analyzer': iso('2026-02-24'),
  'compose-validator': iso('2026-02-23'),
  'gha-validator': iso('2026-03-04'),
};

/**
 * Collection-wide ship dates used by content-dates.ts to stamp every
 * dynamically generated URL in a collection at one authored value.
 */
export const COLLECTION_SHIP_DATES = {
  /** applies to /ai-landscape/{slug}/ and /ai-landscape/vs/{slug}/ */
  aiLandscape: iso('2026-03-27'),
  /** applies to /beauty-index/{slug}/ — Phase 125 OPSEO-03 may bump */
  beautyIndexLanguage: iso('2026-02-17'),
  /** applies to /beauty-index/vs/{slug}/ — Phase 122 enrichment ship */
  beautyIndexVs: iso('2026-04-16'),
  /** applies to /db-compass/{slug}/ */
  dbCompassModel: iso('2026-02-22'),
  /** fallback for /eda/{category}/{slug}/ when both frontmatter and git log
   *  miss — Plan 02 may override. */
  eda: iso('2026-03-01'),
} as const;
