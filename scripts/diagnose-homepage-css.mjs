#!/usr/bin/env node
/**
 * Phase 126 — Homepage CSS diagnosis supplement.
 *
 * Zero-dep ESM supplement to rollup-plugin-visualizer. Covers the
 * visualizer's known CSS coverage gap (btd/rollup-plugin-visualizer#203)
 * by measuring CSS chunks directly from the emitted dist/ output using
 * only node:fs + node:zlib + node:crypto.
 *
 * Runs on-demand (NOT wired into `npm run build` — Plan 02 will add a
 * separate build-time verifier). Reads dist/ after `astro build` has run.
 *
 * What it measures (per homepage-loaded CSS chunk):
 *   - raw byte length
 *   - gzip byte length (zlib.gzipSync default options)
 *   - brotli byte length (zlib.brotliCompressSync default options)
 *   - sha256 (sanity / identity handle)
 *   - leading 200 bytes UTF-8 (chunk boundary identification)
 *   - trailing 200 bytes UTF-8
 *   - count of unique Astro-scoped selectors (astro-[a-z0-9]{8})
 *   - count of @font-face blocks
 *   - count of routes the chunk appears on (from a full dist/** walk)
 *   - isShared flag: true if appears on ≥5 routes
 *
 * Walks every `index.html` under dist/** (depth-limited to 4) to build a
 * route → CSS chunks map, then filters to the chunks loaded by `/`
 * (homepage) and annotates each with its cross-route frequency.
 *
 * Emits .planning/reports/homepage-css-{YYYYMMDDTHHMM}.json — never
 * writes to dist/ (would break Phase 123 sitemap determinism).
 *
 * Exit contract:
 *   - Exit 0 always on success (this is a diagnostic, not a verifier —
 *     Plan 02 owns the exit-1 budget ceiling enforcement).
 *   - Exit 1 ONLY if dist/index.html is missing (astro build wasn't run).
 *
 * Zero external dependencies.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { resolve, join, relative } from 'node:path';

const ROOT = process.cwd();
const DIST = resolve(ROOT, 'dist');
const REPORTS_DIR = resolve(ROOT, '.planning/reports');
const HOMEPAGE_INDEX = resolve(DIST, 'index.html');

// Depth guard for the dist walk. Blog archives nest deepest
// (/blog/tags/<slug>/, /ai-landscape/<slug>/, /eda/<section>/<topic>/)
// but 4 levels is enough to cover all routes.
const WALK_MAX_DEPTH = 4;

// Directories we never need to descend into — they contain asset files
// (not route index.html files) and would slow the walk with no value.
const WALK_SKIP_DIRS = new Set(['_astro', 'fonts', 'open-graph', 'wasm']);

// "Shared" classification threshold. A chunk that appears on ≥5 routes is
// clearly a shared chunk (not per-route). 126-RESEARCH found both
// homepage chunks load on every route (~1137) so the threshold is
// conservative — we mostly want to distinguish "one or two routes" from
// "everywhere".
const SHARED_ROUTE_THRESHOLD = 5;

function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

// Robust two-pass extraction of <link rel="stylesheet" href="...">. A
// single monolithic regex is fragile against attribute reordering; Astro
// sometimes emits href before rel, sometimes after. Pass 1 finds every
// <link...> tag that carries rel="stylesheet"; pass 2 extracts the href.
// Mirrors the pattern used by scripts/verify-on-page-seo.mjs for <meta>.
function extractStylesheetHrefs(html) {
  const linkTagRe = /<link\b[^>]*>/g;
  const hrefRe = /\bhref="([^"]+)"/;
  const relRe = /\brel="stylesheet"/;
  const hrefs = [];
  let match;
  while ((match = linkTagRe.exec(html)) !== null) {
    const tag = match[0];
    if (!relRe.test(tag)) continue;
    const hrefMatch = tag.match(hrefRe);
    if (!hrefMatch) continue;
    hrefs.push(hrefMatch[1]);
  }
  return hrefs;
}

// Walk dist/** and yield every index.html path. Depth-limited and
// skip-list filtered — we only care about route roots, not asset dirs.
function* walkRouteIndexes(dir, depth = 0) {
  if (depth > WALK_MAX_DEPTH) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (WALK_SKIP_DIRS.has(entry.name)) continue;
      yield* walkRouteIndexes(fullPath, depth + 1);
    } else if (entry.isFile() && entry.name === 'index.html') {
      yield fullPath;
    }
  }
}

// Convert dist/<path>/index.html into a URL-style route string.
// e.g. /Users/.../dist/blog/dark-code/index.html → "/blog/dark-code/"
// Root index.html → "/".
function indexHtmlToRoute(fullPath) {
  const rel = relative(DIST, fullPath);
  const dir = rel.replace(/\/?index\.html$/, '');
  if (dir === '' || dir === 'index.html') return '/';
  return `/${dir}/`;
}

// Measure one CSS chunk by absolute dist-root-relative href.
// Returns null if the chunk file doesn't exist (log, skip).
function measureCssChunk(href) {
  // Strip leading slash — dist paths are filesystem-relative.
  const relPath = href.replace(/^\//, '');
  const absPath = resolve(DIST, relPath);
  if (!existsSync(absPath)) return null;
  const raw = readFileSync(absPath);
  const rawText = raw.toString('utf-8');
  const gzip = gzipSync(raw);
  const brotli = brotliCompressSync(raw);

  // Scoped selector count: unique hashes of the form astro-<8 hex/base36>.
  // Astro 5 uses astro-ABCDEFGH identifiers in scoped component CSS.
  const scopedMatches = rawText.match(/astro-[a-z0-9]{8}/g) || [];
  const uniqueScoped = new Set(scopedMatches);

  // @font-face block count: matches the start of each block.
  const fontFaceMatches = rawText.match(/@font-face\s*\{/g) || [];

  return {
    href,
    rawBytes: raw.length,
    gzipBytes: gzip.length,
    brotliBytes: brotli.length,
    sha256: sha256Hex(raw),
    scopedSelectorCount: uniqueScoped.size,
    fontFaceCount: fontFaceMatches.length,
    leading200: rawText.slice(0, 200),
    trailing200: rawText.slice(-200),
  };
}

function tryGitSha() {
  try {
    // Read .git/HEAD + resolve the ref. Avoid spawning git to keep
    // this script zero-dep and fast. If anything is unusual, return null.
    const headPath = resolve(ROOT, '.git/HEAD');
    if (!existsSync(headPath)) return null;
    const head = readFileSync(headPath, 'utf-8').trim();
    if (head.startsWith('ref: ')) {
      const refPath = resolve(ROOT, '.git', head.slice(5));
      if (!existsSync(refPath)) return null;
      return readFileSync(refPath, 'utf-8').trim().slice(0, 12);
    }
    // Detached HEAD — content IS the sha.
    return head.slice(0, 12);
  } catch {
    return null;
  }
}

function main() {
  if (!existsSync(HOMEPAGE_INDEX)) {
    console.error('[diagnose-homepage-css] FAIL — dist/index.html not found. Run `astro build` first.');
    process.exit(1);
  }

  // Phase 1 — walk every route and record its CSS hrefs.
  const routeChunkMap = {};
  for (const indexPath of walkRouteIndexes(DIST)) {
    const route = indexHtmlToRoute(indexPath);
    const html = readFileSync(indexPath, 'utf-8');
    const allHrefs = extractStylesheetHrefs(html);
    // We only care about CSS chunks emitted into /_astro/. Ignore other
    // stylesheet hrefs (external CDN stylesheets would be suspicious but
    // are out of scope — Phase 125's verify-no-google-fonts covers those).
    const cssHrefs = allHrefs.filter((h) => /^\/_astro\/.*\.css$/.test(h));
    routeChunkMap[route] = cssHrefs;
  }

  const totalRoutesScanned = Object.keys(routeChunkMap).length;

  // Phase 2 — count per-chunk route frequency across the whole site.
  const chunkFrequency = new Map(); // href -> route count
  for (const hrefs of Object.values(routeChunkMap)) {
    for (const href of hrefs) {
      chunkFrequency.set(href, (chunkFrequency.get(href) || 0) + 1);
    }
  }

  // Phase 3 — measure every unique chunk once. This is cheap even for
  // hundreds of chunks because each measurement is a single file read +
  // three cheap byte transforms.
  const measurements = new Map(); // href -> measurement
  for (const href of chunkFrequency.keys()) {
    const m = measureCssChunk(href);
    if (m !== null) measurements.set(href, m);
  }

  // Phase 4 — identify homepage chunks. The homepage route is "/".
  const homepageHrefs = routeChunkMap['/'] || [];
  const homepageChunks = homepageHrefs
    .map((href) => {
      const base = measurements.get(href);
      if (!base) return null;
      const appearsOnRouteCount = chunkFrequency.get(href) || 0;
      return {
        ...base,
        appearsOnRouteCount,
        isShared: appearsOnRouteCount >= SHARED_ROUTE_THRESHOLD,
      };
    })
    .filter((x) => x !== null);

  const homepageRawBytes = homepageChunks.reduce((s, c) => s + c.rawBytes, 0);
  const homepageGzipBytes = homepageChunks.reduce((s, c) => s + c.gzipBytes, 0);
  const homepageBrotliBytes = homepageChunks.reduce((s, c) => s + c.brotliBytes, 0);

  // Phase 5 — full ordered list of chunks by frequency (descending), then
  // by raw size (descending), for the "all chunks" view.
  const allChunksByFrequency = Array.from(measurements.values())
    .map((m) => {
      const appearsOnRouteCount = chunkFrequency.get(m.href) || 0;
      return {
        href: m.href,
        rawBytes: m.rawBytes,
        gzipBytes: m.gzipBytes,
        brotliBytes: m.brotliBytes,
        scopedSelectorCount: m.scopedSelectorCount,
        fontFaceCount: m.fontFaceCount,
        appearsOnRouteCount,
        isShared: appearsOnRouteCount >= SHARED_ROUTE_THRESHOLD,
      };
    })
    .sort((a, b) => {
      if (b.appearsOnRouteCount !== a.appearsOnRouteCount) {
        return b.appearsOnRouteCount - a.appearsOnRouteCount;
      }
      return b.rawBytes - a.rawBytes;
    });

  // Phase 6 — emit report.
  mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13); // YYYYMMDDTHHMM
  const reportPath = resolve(REPORTS_DIR, `homepage-css-${stamp}.json`);

  const gitSha = tryGitSha();

  const report = {
    generatedAt: new Date().toISOString(),
    ...(gitSha ? { gitSha } : {}),
    summary: {
      totalUniqueChunks: measurements.size,
      totalRoutesScanned,
      homepageChunkCount: homepageChunks.length,
      homepageRawBytes,
      homepageGzipBytes,
      homepageBrotliBytes,
    },
    homepageChunks,
    allChunksByFrequency,
    routeChunkMap,
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(
    `[diagnose-homepage-css] homepage loads ${homepageChunks.length} chunks / ${homepageRawBytes} bytes raw / ${homepageGzipBytes} bytes gzip — report: ${reportPath}`
  );

  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error('[diagnose-homepage-css] UNEXPECTED ERROR', err);
  process.exit(1);
}
