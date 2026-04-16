#!/usr/bin/env node
/**
 * verify-vs-overlap.mjs — Build-time enforcement of VS-06 (Phase 122).
 *
 * Samples 20 pages (deterministic seed) from `dist/beauty-index/vs/*`, computes
 * 5-gram Jaccard similarity across all C(20,2) = 190 pairs, and fails the build
 * if ANY pair exceeds 0.40 Jaccard.
 *
 * Chrome-stripping: before hashing we drop `<nav>`, `<header>`, `<footer>`,
 * `<svg>`, `<script>`, `<style>`, and a short list of known-shared chrome
 * strings (TOC labels, "Back to Beauty Index", section headings). Phase 122
 * Plan 02's SUMMARY explicitly flags that these strings are identical across
 * all 650 pages and would artificially inflate Jaccard if left in.
 *
 * Zero runtime dependencies — only Node built-ins.
 * Writes a timestamped JSON report under `.planning/reports/`.
 *
 * Exit codes:
 *   0 — max pairwise Jaccard < 0.40
 *   1 — at least one pair >= 0.40 (top colliding pairs printed)
 *   2 — structural error
 */

import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DIST_DIR = resolve(process.cwd(), 'dist/beauty-index/vs');
const REPORTS_DIR = resolve(process.cwd(), '.planning/reports');
const SAMPLE_SIZE = 20;
const SHINGLE_K = 5;
const THRESHOLD = 0.40;
const SEED = 20260416; // fixed — do not tune per run

// Chrome strings present on every VS page (TOC labels, section headings,
// back-link copy). Stripping prevents false-positive Jaccard inflation.
const CHROME_STRINGS = [
  'Back to Beauty Index',
  'Download comparison image',
  'Page sections',
  'Dimension-by-dimension analysis',
  'Side-by-side code',
  'Frequently asked questions',
  'Related comparisons',
  'See also:',
  'Read more about the methodology',
  'Back to methodology',
  'on this methodology',
];

async function listVsPageFiles() {
  if (!existsSync(DIST_DIR)) {
    console.error(`[VS-06] ERROR: ${DIST_DIR} does not exist. Run \`astro build\` first.`);
    process.exit(2);
  }
  const entries = await readdir(DIST_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => join(DIST_DIR, e.name, 'index.html'))
    .sort();
}

/** Greedy extract of outer <article> / <main> + chrome stripping. */
async function extractArticleText(htmlPath) {
  const html = await readFile(htmlPath, 'utf-8');
  let match = html.match(/<article[^>]*>([\s\S]*)<\/article>/i);
  if (!match) match = html.match(/<main[^>]*>([\s\S]*)<\/main>/i);
  if (!match) throw new Error(`No <article> or <main> region in ${htmlPath}`);
  let body = match[1]
    // Drop chrome blocks first
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  for (const s of CHROME_STRINGS) {
    body = body.split(s).join(' ');
  }
  return body.replace(/\s+/g, ' ').trim();
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(tokens, k = SHINGLE_K) {
  const set = new Set();
  for (let i = 0; i + k <= tokens.length; i++) set.add(tokens.slice(i, i + k).join(' '));
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** mulberry32 — deterministic PRNG for reproducible sampling. */
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sortedDesc, p) {
  if (sortedDesc.length === 0) return 0;
  const idx = Math.max(0, Math.min(sortedDesc.length - 1, Math.floor(sortedDesc.length * (1 - p))));
  return sortedDesc[idx];
}

function timestampSlug(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

async function main() {
  const all = await listVsPageFiles();
  if (all.length < SAMPLE_SIZE) {
    console.error(`[VS-06] ERROR: only ${all.length} VS pages found, need >= ${SAMPLE_SIZE}.`);
    process.exit(2);
  }

  // Deterministic Fisher-Yates shuffle with mulberry32(SEED)
  const rnd = mulberry32(SEED);
  const pool = [...all];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const sample = pool.slice(0, SAMPLE_SIZE);

  const data = [];
  for (const path of sample) {
    try {
      const text = await extractArticleText(path);
      const tokens = tokenize(text);
      data.push({ path, shingles: shingles(tokens, SHINGLE_K), tokenCount: tokens.length });
    } catch (err) {
      console.error(`[VS-06] ERROR processing ${path}: ${err.message}`);
      process.exit(2);
    }
  }

  const pairs = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const value = jaccard(data[i].shingles, data[j].shingles);
      pairs.push({ pathA: data[i].path, pathB: data[j].path, jaccard: value });
    }
  }

  pairs.sort((a, b) => b.jaccard - a.jaccard);
  const values = pairs.map((p) => p.jaccard);
  const max = values[0] ?? 0;
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const p95 = percentile(values, 0.95);

  await mkdir(REPORTS_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const reportPath = join(REPORTS_DIR, `vs-overlap-${timestampSlug()}.json`);
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        generatedAt,
        seed: SEED,
        sampleSize: SAMPLE_SIZE,
        shingleK: SHINGLE_K,
        threshold: THRESHOLD,
        sampledFiles: sample,
        tokenCounts: data.map((d) => ({ path: d.path, tokenCount: d.tokenCount })),
        max: Math.round(max * 10000) / 10000,
        mean: Math.round(mean * 10000) / 10000,
        p95: Math.round(p95 * 10000) / 10000,
        topCollisions: pairs.slice(0, 10).map((p) => ({
          pathA: p.pathA,
          pathB: p.pathB,
          jaccard: Math.round(p.jaccard * 10000) / 10000,
        })),
      },
      null,
      2,
    ),
  );

  console.log(
    `[VS-06] sampled ${SAMPLE_SIZE} of ${all.length} pages (seed=${SEED}): max Jaccard=${max.toFixed(3)}, mean=${mean.toFixed(3)}, p95=${p95.toFixed(3)}.`,
  );
  console.log(`[VS-06] Report: ${reportPath}`);

  if (max >= THRESHOLD) {
    console.error(`[VS-06] FAIL: max Jaccard ${max.toFixed(4)} >= threshold ${THRESHOLD}. Top 5 colliding pairs:`);
    for (const p of pairs.slice(0, 5)) {
      console.error(
        `  ${p.jaccard.toFixed(4)}  ${p.pathA.split('/').slice(-2, -1)[0]} vs ${p.pathB.split('/').slice(-2, -1)[0]}`,
      );
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[VS-06] fatal:', err);
  process.exit(2);
});
