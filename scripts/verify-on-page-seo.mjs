#!/usr/bin/env node
/**
 * Phase 125 — On-page SEO + feed-alias build-time gate.
 *
 * Runs LAST in npm run build, after:
 *   prebuild -> astro build -> verify-vs-wordcount -> verify-vs-overlap
 *            -> verify-sitemap-determinism -> verify-no-google-fonts -> [this]
 *
 * Asserts SIX independent invariants against dist/:
 *
 *   (1) BLOG PAGINATION SELF-CANONICALS (TSEO-02):
 *       dist/blog/{2..6}/index.html each contains a self-referential
 *       <link rel="canonical" href="https://patrykgolabek.dev/blog/N/">
 *       where N matches the directory number. Prevents duplicate-content
 *       issues from pagination pointing at /blog/ instead of themselves.
 *
 *   (2) DARK-CODE <title> LENGTH IN [55, 60] (OPSEO-01):
 *       dist/blog/dark-code/index.html <title>...</title> content length
 *       must be between 55 and 60 chars inclusive. SERP title truncates
 *       around 60 — under 55 wastes SERP real estate; over 60 gets cut.
 *       A regression to < 55 indicates the blog[slug] fallback truncator
 *       split at the colon again (prior bug — rendered 'Dark Code — Patryk
 *       Golabek' = 26 chars).
 *
 *   (3) DARK-CODE <meta description> LENGTH ≤ 160 (OPSEO-02):
 *       Same file. First <meta name="description"> content ≤ 160 chars.
 *       SERP description truncation threshold. Front-loading of the
 *       critical phrase is a content concern verified manually, not here.
 *
 *   (4) BEAUTY INDEX LANGUAGE DESCRIPTIONS IN [140, 160], NO MID-WORD
 *       TRUNCATION (OPSEO-03):
 *       Enumerate dist/beauty-index/<slug>/index.html for the 26 known
 *       language pages (excluding vs, code, justifications aggregates).
 *       Each description must:
 *         - length ∈ [140, 160]
 *         - end on a word/sentence boundary OR on a clean ellipsis whose
 *           preceding char is alphanumeric (word-complete). Reject
 *           mid-word truncations like "Python's…" or "C#…" where the char
 *           immediately before the ellipsis is a non-alphanumeric
 *           mid-word punctuation mark (apostrophe, #, etc.) that indicates
 *           the word was cut in the middle.
 *       If content does NOT end with '…', accept any content whose length
 *       falls in [140, 160] — truncateDescription returns the full input
 *       verbatim when it already fits, without appending an ellipsis.
 *
 *   (5) DOCKERFILE ANALYZER DESCRIPTION ≤ 160 (OPSEO-04):
 *       dist/tools/dockerfile-analyzer/index.html <meta description>
 *       content ≤ 160 chars.
 *
 *   (6) /feed.xml BYTE-IDENTICAL TO /rss.xml (TSEO-04):
 *       dist/feed.xml and dist/rss.xml both exist, non-empty, and have
 *       identical sha256. /feed.xml is a re-export alias of /rss.xml;
 *       any divergence indicates the alias broke.
 *
 * Writes a JSON report to .planning/reports/on-page-seo-{YYYYMMDDTHHMM}.json.
 * Never writes to dist/ (would break Phase 123 sitemap determinism).
 *
 * Exit contract:
 *   - Exit 0 + single-line stdout "[on-page-seo] OK — ..." on success
 *   - Exit 1 + per-invariant failure lines (each with a hint pointing at
 *     the source file to edit) on any failure
 *
 * Zero external dependencies — uses only node:fs, node:path, node:crypto.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const ROOT = process.cwd();
const DIST = resolve(ROOT, 'dist');
const REPORTS_DIR = resolve(ROOT, '.planning/reports');

// Beauty Index aggregate/landing pages that must be skipped — they are NOT
// the 26 per-language detail pages that Plan 02 sized to [140, 160].
const BEAUTY_INDEX_NON_LANGUAGE = new Set(['vs', 'code', 'justifications']);

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

// Two-pass meta-description extraction. Astro attribute order is template-
// declaration-dependent; a single combined regex would be fragile. Pass 1
// finds the <meta ...name="description"...> tag; Pass 2 pulls the content.
function extractMetaDescription(html) {
  const metaDescRe = /<meta\b[^>]*\bname="description"[^>]*>/;
  const tagMatch = html.match(metaDescRe);
  if (!tagMatch) return null;
  const contentRe = /\bcontent="([^"]*)"/;
  const contentMatch = tagMatch[0].match(contentRe);
  return contentMatch ? contentMatch[1] : null;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/);
  return m ? m[1] : null;
}

// A description that ends with '…' is word-complete iff the char immediately
// preceding the ellipsis is alphanumeric. Truncations like "Python's…" or
// "C#…" are rejected because the char before '…' is ' (apostrophe) or #,
// which are mid-word punctuation marks that signal the word itself was cut.
// Whitespace before '…' means the ellipsis came after a word break, which is
// acceptable (e.g., "…tier. …" or "…beautiful …").
function isWordCompleteEllipsis(content) {
  if (!content.endsWith('…')) return true; // N/A
  const beforeEllipsis = content.slice(0, -1);
  // Allow " …" (space + ellipsis) — the word ended cleanly before the gap.
  if (beforeEllipsis.endsWith(' ')) return true;
  const lastChar = beforeEllipsis.slice(-1);
  // Terminal punctuation before ellipsis is word-complete.
  if (['.', ',', ';', '!', '?'].includes(lastChar)) return true;
  // Alphanumeric (unicode-aware \p{L}\p{N}) before ellipsis = word-complete.
  return /[\p{L}\p{N}]/u.test(lastChar);
}

function listBeautyIndexLanguageSlugs() {
  const base = resolve(DIST, 'beauty-index');
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !BEAUTY_INDEX_NON_LANGUAGE.has(name))
    .filter((name) => existsSync(join(base, name, 'index.html')))
    .sort();
}

function invariant1_paginationCanonicals() {
  const pages = [2, 3, 4, 5, 6];
  const details = [];
  let allOk = true;
  for (const n of pages) {
    const p = resolve(DIST, 'blog', String(n), 'index.html');
    if (!existsSync(p)) {
      details.push({ page: n, ok: false, reason: 'file missing' });
      allOk = false;
      continue;
    }
    const html = readFileSync(p, 'utf8');
    const re = /<link rel="canonical" href="https:\/\/patrykgolabek\.dev\/blog\/(\d+)\/">/;
    const m = html.match(re);
    if (!m) {
      details.push({ page: n, ok: false, reason: 'canonical tag missing or malformed' });
      allOk = false;
      continue;
    }
    if (Number(m[1]) !== n) {
      details.push({ page: n, ok: false, reason: `canonical points to /blog/${m[1]}/ instead of /blog/${n}/` });
      allOk = false;
      continue;
    }
    details.push({ page: n, ok: true });
  }
  return { pass: allOk, details };
}

function invariant2_darkCodeTitle() {
  const p = resolve(DIST, 'blog/dark-code/index.html');
  if (!existsSync(p)) return { pass: false, reason: 'dist/blog/dark-code/index.html missing' };
  const html = readFileSync(p, 'utf8');
  const title = extractTitle(html);
  if (!title) return { pass: false, reason: '<title> tag missing' };
  const length = title.length;
  const pass = length >= 55 && length <= 60;
  return { pass, length, title };
}

function invariant3_darkCodeDescription() {
  const p = resolve(DIST, 'blog/dark-code/index.html');
  if (!existsSync(p)) return { pass: false, reason: 'dist/blog/dark-code/index.html missing' };
  const html = readFileSync(p, 'utf8');
  const description = extractMetaDescription(html);
  if (description === null) return { pass: false, reason: '<meta name="description"> missing' };
  const length = description.length;
  return { pass: length <= 160, length, description };
}

function invariant4_beautyIndexDescriptions() {
  const slugs = listBeautyIndexLanguageSlugs();
  const failed = [];
  for (const slug of slugs) {
    const p = resolve(DIST, 'beauty-index', slug, 'index.html');
    const html = readFileSync(p, 'utf8');
    const content = extractMetaDescription(html);
    if (content === null) {
      failed.push({ slug, length: 0, content: null, reason: 'meta description missing' });
      continue;
    }
    const len = content.length;
    if (len < 140 || len > 160) {
      failed.push({ slug, length: len, content, reason: `length ${len} out of [140, 160]` });
      continue;
    }
    if (!isWordCompleteEllipsis(content)) {
      const before = content.slice(-2, -1);
      failed.push({ slug, length: len, content, reason: `mid-word truncation: char before ellipsis is "${before}"` });
      continue;
    }
  }
  return {
    pass: failed.length === 0,
    failed,
    total: slugs.length,
  };
}

function invariant5_dockerfileDescription() {
  const p = resolve(DIST, 'tools/dockerfile-analyzer/index.html');
  if (!existsSync(p)) return { pass: false, reason: 'dist/tools/dockerfile-analyzer/index.html missing' };
  const html = readFileSync(p, 'utf8');
  const description = extractMetaDescription(html);
  if (description === null) return { pass: false, reason: '<meta name="description"> missing' };
  const length = description.length;
  return { pass: length <= 160, length, description };
}

function invariant6_feedEqualsRss() {
  const feed = resolve(DIST, 'feed.xml');
  const rss = resolve(DIST, 'rss.xml');
  if (!existsSync(feed)) return { pass: false, reason: 'dist/feed.xml missing' };
  if (!existsSync(rss)) return { pass: false, reason: 'dist/rss.xml missing' };
  const feedBuf = readFileSync(feed);
  const rssBuf = readFileSync(rss);
  if (feedBuf.length === 0) return { pass: false, reason: 'dist/feed.xml is empty' };
  if (rssBuf.length === 0) return { pass: false, reason: 'dist/rss.xml is empty' };
  const feedSha = sha256(feedBuf);
  const rssSha = sha256(rssBuf);
  return { pass: feedSha === rssSha, feedSha, rssSha, feedBytes: feedBuf.length, rssBytes: rssBuf.length };
}

function main() {
  if (!existsSync(DIST)) {
    console.error('[on-page-seo] FAIL — dist/ not found. Run `astro build` first.');
    process.exit(1);
  }

  const paginationCanonicals = invariant1_paginationCanonicals();
  const darkCodeTitle = invariant2_darkCodeTitle();
  const darkCodeDescription = invariant3_darkCodeDescription();
  const beautyIndexDescriptions = invariant4_beautyIndexDescriptions();
  const dockerfileDescription = invariant5_dockerfileDescription();
  const feedRssIdentical = invariant6_feedEqualsRss();

  const overallPass =
    paginationCanonicals.pass &&
    darkCodeTitle.pass &&
    darkCodeDescription.pass &&
    beautyIndexDescriptions.pass &&
    dockerfileDescription.pass &&
    feedRssIdentical.pass;

  // Write JSON report
  mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13); // YYYYMMDDTHHMM
  const reportPath = resolve(REPORTS_DIR, `on-page-seo-${stamp}.json`);
  const report = {
    generatedAt: new Date().toISOString(),
    invariants: {
      paginationCanonicals,
      darkCodeTitle,
      darkCodeDescription,
      beautyIndexDescriptions,
      dockerfileDescription,
      feedRssIdentical,
    },
    overallPass,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[on-page-seo] report: ${reportPath}`);

  if (overallPass) {
    const canonicalCount = paginationCanonicals.details.filter((d) => d.ok).length;
    const beautyInRange = beautyIndexDescriptions.total - beautyIndexDescriptions.failed.length;
    console.log(
      `[on-page-seo] OK — ${canonicalCount} canonicals, dark-code title=${darkCodeTitle.length}, ${beautyInRange}/${beautyIndexDescriptions.total} beauty-index in range, dockerfile=${dockerfileDescription.length}, feed===rss.`
    );
    process.exit(0);
  }

  // Failure branching — each failed invariant gets its own actionable hint.
  console.error('[on-page-seo] FAIL');

  if (!paginationCanonicals.pass) {
    for (const d of paginationCanonicals.details) {
      if (!d.ok) {
        console.error(`  [1/6] blog/${d.page}/ — ${d.reason}`);
      }
    }
    console.error('    Hint: check src/pages/blog/[...page].astro canonical logic for pagination pages.');
  }

  if (!darkCodeTitle.pass) {
    if (darkCodeTitle.reason) {
      console.error(`  [2/6] dark-code <title> — ${darkCodeTitle.reason}`);
    } else {
      console.error(
        `  [2/6] dark-code <title> length=${darkCodeTitle.length} out of [55, 60] — "${darkCodeTitle.title}"`
      );
    }
    console.error('    Hint: edit src/data/blog/dark-code.mdx frontmatter title (target: title.length + " — Patryk Golabek".length <= 65 to bypass the [slug].astro truncation branch).');
  }

  if (!darkCodeDescription.pass) {
    if (darkCodeDescription.reason) {
      console.error(`  [3/6] dark-code <meta description> — ${darkCodeDescription.reason}`);
    } else {
      console.error(
        `  [3/6] dark-code <meta description> length=${darkCodeDescription.length} > 160`
      );
    }
    console.error('    Hint: edit src/data/blog/dark-code.mdx frontmatter description to <= 160 chars.');
  }

  if (!beautyIndexDescriptions.pass) {
    console.error(
      `  [4/6] beauty-index: ${beautyIndexDescriptions.failed.length} of ${beautyIndexDescriptions.total} language pages failed`
    );
    for (const f of beautyIndexDescriptions.failed) {
      console.error(`    - ${f.slug}: ${f.reason}${f.length ? ` (length=${f.length})` : ''}`);
    }
    console.error('    Hint: check truncateDescription() in src/pages/beauty-index/[slug].astro — ensure clause-boundary logic preserves word integrity.');
  }

  if (!dockerfileDescription.pass) {
    if (dockerfileDescription.reason) {
      console.error(`  [5/6] dockerfile-analyzer <meta description> — ${dockerfileDescription.reason}`);
    } else {
      console.error(
        `  [5/6] dockerfile-analyzer <meta description> length=${dockerfileDescription.length} > 160`
      );
    }
    console.error('    Hint: edit src/pages/tools/dockerfile-analyzer/index.astro line ~10 (description prop on Layout).');
  }

  if (!feedRssIdentical.pass) {
    if (feedRssIdentical.reason) {
      console.error(`  [6/6] feed.xml/rss.xml — ${feedRssIdentical.reason}`);
    } else {
      console.error(
        `  [6/6] feed.xml SHA differs from rss.xml SHA — feed=${feedRssIdentical.feedSha.slice(0, 12)}, rss=${feedRssIdentical.rssSha.slice(0, 12)}`
      );
    }
    console.error('    Hint: src/pages/feed.xml.ts must re-export GET from ./rss.xml so both endpoints ship identical bytes.');
  }

  console.error(`  See report: ${reportPath}`);
  process.exit(1);
}

try {
  main();
} catch (err) {
  console.error('[on-page-seo] UNEXPECTED ERROR', err);
  process.exit(1);
}
