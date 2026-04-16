#!/usr/bin/env node
/**
 * Phase 123 — Sitemap coverage + determinism verifier.
 *
 * Runs LAST in npm run build, after:
 *   prebuild -> astro build -> verify-vs-wordcount -> verify-vs-overlap -> [this]
 *
 * Asserts two invariants:
 *   1. COVERAGE: dist/sitemap-0.xml has exactly as many <lastmod> tags as <loc> tags,
 *      and the expected count matches the phase target (1184 URLs at phase ship time).
 *   2. DETERMINISM: a second astro build produces byte-identical dist/sitemap-0.xml
 *      and dist/sitemap-index.xml. If the sitemap contains non-deterministic fields
 *      (timestamps, build IDs, un-sorted aggregations) this check fails with a
 *      diff location and hex surround so the operator can identify the culprit.
 *
 * Writes a JSON report to .planning/reports/sitemap-determinism-{YYYYMMDD-HHMM}.json.
 * Never writes to dist/ (would break sitemap determinism itself).
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const REPORTS_DIR = resolve(process.cwd(), '.planning/reports');
const SITEMAP_0 = resolve(DIST, 'sitemap-0.xml');
const SITEMAP_INDEX = resolve(DIST, 'sitemap-index.xml');

// Phase ship-time coverage targets.
//
// LOC_FLOOR: hard floor on total URL count. Every URL currently shipped (1184)
// MUST stay shipped at Phase 123 completion. A regression that silently drops
// URLs (e.g., a getStaticPaths filter change that removes a category) must
// fail the build here, NOT silently pass because lastmod coverage happens to
// equal the (degraded) loc count.
//
// When Phase 125 ships (TSEO-03 pagination removal + TSEO-05 sparse tag
// removal), update this constant DOWNWARD to the new expected total — and
// cite the Phase 125 PR URL in the comment so the drop is auditable.
const LOC_FLOOR = 1184;
//
// LASTMOD_COVERAGE_FLOOR: defensive lower bound on the number of URLs that
// have a lastmod. Phase 125 will legitimately remove ~64 URLs (pagination +
// sparse tags), so setting this at 1120 gives headroom for Phase 125 without
// demanding its PR update this constant. The invariant that EVERY remaining
// URL has a lastmod is enforced separately by the lastmodCount === locCount
// check below — this floor is just a sanity lower bound that catches broad
// coverage collapses.
const LASTMOD_COVERAGE_FLOOR = 1184 - 64; // = 1120

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function parseCount(xml, tagPattern) {
  const re = new RegExp(tagPattern, 'g');
  return (xml.match(re) || []).length;
}

function firstDiffOffset(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : len;
}

function surround(str, offset, radius = 100) {
  const start = Math.max(0, offset - radius);
  const end = Math.min(str.length, offset + radius);
  return str.slice(start, end);
}

async function main() {
  if (!existsSync(SITEMAP_0)) {
    console.error('[sitemap-determinism] FAIL — dist/sitemap-0.xml not found. Run `astro build` first.');
    process.exit(1);
  }

  // Phase 1: capture first build's output.
  const first_0 = readFileSync(SITEMAP_0);
  const first_idx = existsSync(SITEMAP_INDEX) ? readFileSync(SITEMAP_INDEX) : null;
  const first0Hash = sha256(first_0);
  const firstIdxHash = first_idx ? sha256(first_idx) : null;

  // Phase 2: coverage checks on first build.
  //   Three independent invariants, each with its own failure mode:
  //     (a) locCount >= LOC_FLOOR            — no URL regressions
  //     (b) lastmodCount === locCount        — every URL has a lastmod
  //     (c) lastmodCount >= LASTMOD_COVERAGE_FLOOR — defensive lower bound
  //   The old combined check allowed (a) to silently pass when URLs vanished
  //   as long as the survivors all had lastmods. Splitting is required by
  //   Phase 123 success criterion #1 (1184/1184 coverage NOW).
  const xml = first_0.toString('utf-8');
  const locCount = parseCount(xml, '<loc>');
  const lastmodCount = parseCount(xml, '<lastmod>');
  const locFloorOk = locCount >= LOC_FLOOR;
  const lastmodPerUrlOk = lastmodCount === locCount;
  const lastmodFloorOk = lastmodCount >= LASTMOD_COVERAGE_FLOOR;
  const coverageOk = locFloorOk && lastmodPerUrlOk && lastmodFloorOk;

  // Phase 3: run a second astro build and compare.
  // NOTE: we SKIP prebuild (already ran before first build) and invoke the
  // astro binary directly via npx. This avoids recursion into npm run build.
  console.log('[sitemap-determinism] running second astro build for determinism comparison...');
  try {
    execSync('npx astro build', {
      stdio: ['ignore', 'ignore', 'inherit'], // swallow stdout; rebuild noise not useful
      env: { ...process.env },
    });
  } catch (e) {
    console.error('[sitemap-determinism] FAIL — second astro build errored:', e?.message);
    process.exit(1);
  }

  const second_0 = readFileSync(SITEMAP_0);
  const second_idx = existsSync(SITEMAP_INDEX) ? readFileSync(SITEMAP_INDEX) : null;
  const second0Hash = sha256(second_0);
  const secondIdxHash = second_idx ? sha256(second_idx) : null;

  const sitemap0Deterministic = first0Hash === second0Hash;
  const sitemapIdxDeterministic = firstIdxHash && secondIdxHash
    ? firstIdxHash === secondIdxHash
    : (firstIdxHash === secondIdxHash); // both null is fine

  // Report
  mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13); // YYYYMMDDTHHMM
  const reportPath = resolve(REPORTS_DIR, `sitemap-determinism-${stamp}.json`);
  const report = {
    generatedAt: new Date().toISOString(),
    sitemap0: {
      firstHash: first0Hash,
      secondHash: second0Hash,
      deterministic: sitemap0Deterministic,
      sizeBytes: first_0.length,
      locCount,
      lastmodCount,
      locFloor: LOC_FLOOR,
      lastmodCoverageFloor: LASTMOD_COVERAGE_FLOOR,
      locFloorOk,
      lastmodPerUrlOk,
      lastmodFloorOk,
      coverageOk,
    },
    sitemapIndex: {
      firstHash: firstIdxHash,
      secondHash: secondIdxHash,
      deterministic: sitemapIdxDeterministic,
    },
  };

  if (!sitemap0Deterministic) {
    const firstStr = first_0.toString('utf-8');
    const secondStr = second_0.toString('utf-8');
    const diffAt = firstDiffOffset(firstStr, secondStr);
    report.firstDiffOffset = diffAt;
    report.firstDiffSurround = {
      first: surround(firstStr, diffAt),
      second: surround(secondStr, diffAt),
    };
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[sitemap-determinism] report: ${reportPath}`);

  // Stdout summary (always)
  console.log(`[coverage] <loc>=${locCount} <lastmod>=${lastmodCount}`);
  console.log(`[determinism] sitemap-0.xml: ${sitemap0Deterministic ? 'OK' : 'DIFFERS'}`);
  if (firstIdxHash || secondIdxHash) {
    console.log(`[determinism] sitemap-index.xml: ${sitemapIdxDeterministic ? 'OK' : 'DIFFERS'}`);
  }

  // Failure branching — each coverage invariant gets its own diagnostic.
  if (!locFloorOk) {
    console.error(
      `[sitemap-determinism] FAIL — URL count regressed: <loc>=${locCount} < LOC_FLOOR=${LOC_FLOOR}.`
    );
    console.error('  Hint: a getStaticPaths filter change or collection schema change silently dropped URLs.');
    console.error(`  See report: ${reportPath}`);
    process.exit(1);
  }
  if (!lastmodPerUrlOk) {
    console.error(
      `[sitemap-determinism] FAIL — lastmod/loc mismatch: <loc>=${locCount}, <lastmod>=${lastmodCount}.`
    );
    console.error('  Hint: a new URL category was added without a corresponding date source in src/lib/sitemap/.');
    console.error(`  See report: ${reportPath}`);
    process.exit(1);
  }
  if (!lastmodFloorOk) {
    console.error(
      `[sitemap-determinism] FAIL — lastmod coverage below defensive floor: <lastmod>=${lastmodCount} < LASTMOD_COVERAGE_FLOOR=${LASTMOD_COVERAGE_FLOOR}.`
    );
    console.error('  Hint: broad coverage collapse — check buildContentDateMap() for a silent early return.');
    console.error(`  See report: ${reportPath}`);
    process.exit(1);
  }
  if (!sitemap0Deterministic) {
    console.error('[sitemap-determinism] FAIL — sitemap-0.xml differs between consecutive builds.');
    console.error(`  First diff at byte offset ${report.firstDiffOffset}.`);
    console.error(`  See .firstDiffSurround in ${reportPath}.`);
    console.error('  Hint: grep src/lib/sitemap/ for `new Date()`, `Date.now()`, or `statSync().mtime`.');
    process.exit(1);
  }
  if (!sitemapIdxDeterministic) {
    console.error('[sitemap-determinism] FAIL — sitemap-index.xml differs between consecutive builds.');
    process.exit(1);
  }

  console.log(`[sitemap-determinism] OK — ${locCount} URLs, all with lastmod, deterministic across rebuilds.`);
  process.exit(0);
}

main().catch(err => {
  console.error('[sitemap-determinism] UNEXPECTED ERROR', err);
  process.exit(1);
});
