#!/usr/bin/env node
/**
 * Phase 126 — Homepage CSS byte-budget build-time gate.
 *
 * Runs LAST in npm run build, after:
 *   prebuild -> astro build -> verify-vs-wordcount -> verify-vs-overlap
 *            -> verify-sitemap-determinism -> verify-no-google-fonts
 *            -> verify-on-page-seo -> [this]
 *
 * Asserts FOUR independent invariants against dist/:
 *
 *   (1) HOMEPAGE CHUNK COUNT STABLE:
 *       The number of <link rel="stylesheet" href="/_astro/*.css"> tags
 *       in dist/index.html must match the baseline chunk count exactly.
 *       A new chunk appearing (or one vanishing) indicates a structural
 *       CSS split change that must be investigated.
 *
 *   (2) PER-CHUNK RAW BYTE CEILING (2% headroom):
 *       Each homepage CSS chunk's raw byte length must not exceed the
 *       baseline's corresponding chunk by more than 2%. Chunks are matched
 *       by stable name (strip the content-hash suffix). Catches single-
 *       chunk bloat from a new Tailwind utility or @fontsource import.
 *
 *   (3) HOMEPAGE TOTAL RAW BYTE CEILING (5% headroom):
 *       Sum of all homepage chunk raw bytes must not exceed 105% of the
 *       baseline total. Absorbs normal content-driven growth.
 *
 *   (4) HOMEPAGE TOTAL GZIP BYTE CEILING (5% headroom):
 *       Same as (3) but on gzipped bytes (via zlib.gzipSync). Catches
 *       growth that compresses poorly (e.g., inline data URIs).
 *
 * Reads the committed baseline JSON as the source of truth for all
 * ceilings. The baseline is produced by scripts/diagnose-homepage-css.mjs
 * and force-added to git.
 *
 * Writes a JSON report to .planning/reports/homepage-css-budget-{stamp}.json.
 * Never writes to dist/ (Phase 123 sitemap-determinism invariant).
 *
 * Exit contract:
 *   - Exit 0 + single-line stdout "[homepage-css-budget] OK — ..." on success
 *   - Exit 1 + per-invariant failure lines on any failure
 *
 * Zero external dependencies — uses only node:fs, node:path, node:zlib.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const DIST = resolve(ROOT, 'dist');
const REPORTS_DIR = resolve(ROOT, '.planning/reports');

// Hard-coded baseline path for deterministic resolution. If the baseline
// is renamed or replaced, this constant must be updated. Avoids silently
// picking up a newer timestamped report from a local diagnose-homepage-css
// re-run that would raise the ceiling without a commit.
const BASELINE_FILENAME = 'homepage-css-2026041700200.json';
const BASELINE_PATH = resolve(REPORTS_DIR, BASELINE_FILENAME);

// Headroom constants — kept tight enough to catch 5KB+ bloat but lenient
// enough for de-minimis Tailwind churn and content-driven growth.
const PER_CHUNK_HEADROOM = 1.02; // 2% per chunk
const TOTAL_HEADROOM = 1.05;     // 5% total (raw and gzip)

/**
 * Extract stable chunk name by stripping the content-hash suffix.
 * /_astro/about.C49NBCVn.css -> about.css
 * /_astro/_slug_.CIgCJX9d.css -> _slug_.css
 */
function stableName(href) {
  const base = href.split('/').pop();
  return base.replace(/\.[A-Za-z0-9_-]{8}\.css$/, '.css');
}

/**
 * Parse dist/index.html and extract all CSS stylesheet hrefs.
 */
function extractHomepageCssHrefs(html) {
  const re = /<link\s+rel="stylesheet"\s+href="(\/_astro\/[^"]+\.css)"/g;
  const hrefs = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    hrefs.push(m[1]);
  }
  return hrefs;
}

function main() {
  // --- Pre-flight checks ---
  if (!existsSync(DIST)) {
    console.error('[homepage-css-budget] FAIL — dist/ not found. Run `astro build` first.');
    process.exit(1);
  }

  if (!existsSync(BASELINE_PATH)) {
    console.error(
      `[homepage-css-budget] FAIL — no baseline found at ${BASELINE_PATH}. ` +
      'Run `node scripts/diagnose-homepage-css.mjs` and `git add -f` the report.'
    );
    process.exit(1);
  }

  const indexPath = resolve(DIST, 'index.html');
  if (!existsSync(indexPath)) {
    console.error('[homepage-css-budget] FAIL — dist/index.html not found.');
    process.exit(1);
  }

  // --- Load baseline ---
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  const baselineChunkCount = baseline.summary.homepageChunkCount;
  const baselineTotalRaw = baseline.summary.homepageRawBytes;
  const baselineTotalGzip = baseline.summary.homepageGzipBytes;
  const baselineChunks = baseline.homepageChunks;

  // Build a lookup of baseline chunks by stable name.
  const baselineByStable = new Map();
  for (const chunk of baselineChunks) {
    baselineByStable.set(stableName(chunk.href), chunk);
  }

  // --- Measure current build ---
  const indexHtml = readFileSync(indexPath, 'utf8');
  const currentHrefs = extractHomepageCssHrefs(indexHtml);

  const currentChunks = currentHrefs.map((href) => {
    const filePath = resolve(DIST, href.slice(1)); // strip leading /
    const raw = readFileSync(filePath);
    const gzipped = gzipSync(raw);
    return {
      href,
      stableName: stableName(href),
      rawBytes: raw.length,
      gzipBytes: gzipped.length,
    };
  });

  const currentTotalRaw = currentChunks.reduce((s, c) => s + c.rawBytes, 0);
  const currentTotalGzip = currentChunks.reduce((s, c) => s + c.gzipBytes, 0);

  // --- Assert invariants ---
  const failures = [];

  // Invariant 1: Chunk count stable
  const chunkCountPass = currentChunks.length === baselineChunkCount;
  if (!chunkCountPass) {
    failures.push(
      `[1/4] CHUNK COUNT: homepage now loads ${currentChunks.length} chunks (was ${baselineChunkCount}). ` +
      'A CSS chunk was added or removed. If intentional, update the baseline via ' +
      '`node scripts/diagnose-homepage-css.mjs` and `git add -f` the new report, then update ' +
      'BASELINE_FILENAME in scripts/verify-homepage-css-budget.mjs.'
    );
  }

  // Invariant 2: Per-chunk raw byte ceiling (only if chunk count matches)
  const perChunkFailures = [];
  if (chunkCountPass) {
    for (const current of currentChunks) {
      const baselineChunk = baselineByStable.get(current.stableName);
      if (!baselineChunk) {
        perChunkFailures.push({
          stableName: current.stableName,
          baseline: null,
          actual: current.rawBytes,
          ratio: null,
          reason: `no baseline chunk named "${current.stableName}" — chunk was renamed or replaced`,
        });
        continue;
      }
      const ceiling = Math.ceil(baselineChunk.rawBytes * PER_CHUNK_HEADROOM);
      if (current.rawBytes > ceiling) {
        const delta = current.rawBytes - baselineChunk.rawBytes;
        const ratio = current.rawBytes / baselineChunk.rawBytes;
        perChunkFailures.push({
          stableName: current.stableName,
          baseline: baselineChunk.rawBytes,
          actual: current.rawBytes,
          ceiling,
          delta,
          ratio: +ratio.toFixed(4),
          reason: `chunk "${current.stableName}" grew from ${baselineChunk.rawBytes} to ${current.rawBytes} bytes (+${delta}, ${((ratio - 1) * 100).toFixed(1)}% > ${((PER_CHUNK_HEADROOM - 1) * 100).toFixed(0)}% ceiling)`,
        });
      }
    }
  }
  const perChunkPass = perChunkFailures.length === 0;
  if (!perChunkPass) {
    for (const f of perChunkFailures) {
      failures.push(`[2/4] PER-CHUNK RAW: ${f.reason}`);
    }
  }

  // Invariant 3: Total raw byte ceiling
  const totalRawCeiling = Math.ceil(baselineTotalRaw * TOTAL_HEADROOM);
  const totalRawPass = currentTotalRaw <= totalRawCeiling;
  if (!totalRawPass) {
    const breakdown = currentChunks
      .map((c) => {
        const bl = baselineByStable.get(c.stableName);
        return `  ${c.stableName}: ${bl ? bl.rawBytes : '???'} -> ${c.rawBytes}`;
      })
      .join('\n');
    failures.push(
      `[3/4] TOTAL RAW: ${currentTotalRaw} bytes exceeds ceiling ${totalRawCeiling} ` +
      `(baseline ${baselineTotalRaw} * ${TOTAL_HEADROOM}).\n${breakdown}`
    );
  }

  // Invariant 4: Total gzip byte ceiling
  const totalGzipCeiling = Math.ceil(baselineTotalGzip * TOTAL_HEADROOM);
  const totalGzipPass = currentTotalGzip <= totalGzipCeiling;
  if (!totalGzipPass) {
    const breakdown = currentChunks
      .map((c) => {
        const bl = baselineByStable.get(c.stableName);
        return `  ${c.stableName}: ${bl ? bl.gzipBytes : '???'} gzip -> ${c.gzipBytes} gzip`;
      })
      .join('\n');
    failures.push(
      `[4/4] TOTAL GZIP: ${currentTotalGzip} bytes exceeds ceiling ${totalGzipCeiling} ` +
      `(baseline ${baselineTotalGzip} * ${TOTAL_HEADROOM}).\n${breakdown}`
    );
  }

  const overallPass = chunkCountPass && perChunkPass && totalRawPass && totalGzipPass;

  // --- Write report ---
  mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13);
  const reportPath = resolve(REPORTS_DIR, `homepage-css-budget-${stamp}.json`);
  const report = {
    generatedAt: new Date().toISOString(),
    baselineSource: BASELINE_PATH,
    baselineGeneratedAt: baseline.generatedAt,
    headrooms: { perChunk: PER_CHUNK_HEADROOM, total: TOTAL_HEADROOM },
    invariants: {
      chunkCountStable: {
        pass: chunkCountPass,
        expected: baselineChunkCount,
        actual: currentChunks.length,
      },
      perChunkRawBytes: {
        pass: perChunkPass,
        failed: perChunkFailures,
      },
      totalRawBytes: {
        pass: totalRawPass,
        baseline: baselineTotalRaw,
        actual: currentTotalRaw,
        ceiling: totalRawCeiling,
      },
      totalGzipBytes: {
        pass: totalGzipPass,
        baseline: baselineTotalGzip,
        actual: currentTotalGzip,
        ceiling: totalGzipCeiling,
      },
    },
    overallPass,
    currentHomepageChunks: currentChunks.map((c) => ({
      href: c.href,
      rawBytes: c.rawBytes,
      gzipBytes: c.gzipBytes,
    })),
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[homepage-css-budget] report: ${reportPath}`);

  // --- Output ---
  if (overallPass) {
    const rawPct = ((currentTotalRaw / totalRawCeiling) * 100).toFixed(1);
    const gzipPct = ((currentTotalGzip / totalGzipCeiling) * 100).toFixed(1);
    console.log(
      `[homepage-css-budget] OK — ${currentChunks.length} chunks, ` +
      `totalRaw=${currentTotalRaw}/${totalRawCeiling} bytes (${rawPct}%), ` +
      `totalGzip=${currentTotalGzip}/${totalGzipCeiling} bytes (${gzipPct}%).`
    );
    process.exit(0);
  }

  console.error('[homepage-css-budget] FAIL');
  for (const f of failures) {
    console.error(`  ${f}`);
  }
  console.error(
    '  Hint: if this growth is intentional, run `node scripts/diagnose-homepage-css.mjs` ' +
    'to produce a new baseline, then `git add -f .planning/reports/homepage-css-<new-stamp>.json` ' +
    'and update BASELINE_FILENAME in scripts/verify-homepage-css-budget.mjs.'
  );
  console.error(`  See report: ${reportPath}`);
  process.exit(1);
}

try {
  main();
} catch (err) {
  console.error('[homepage-css-budget] UNEXPECTED ERROR', err);
  process.exit(1);
}
