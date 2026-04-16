#!/usr/bin/env node
/**
 * verify-vs-wordcount.mjs — Build-time enforcement of VS-07 (Phase 122).
 *
 * Walks every `dist/beauty-index/vs/{slug}/index.html`, extracts the main
 * content region, tokenises to words, and fails the build if ANY page falls
 * below the 500-word floor.
 *
 * Zero runtime dependencies — only Node built-ins.
 * Writes a timestamped JSON report under `.planning/reports/` (NOT under
 * `dist/` — that would pollute the sitemap lastmod per Phase 123).
 *
 * Exit codes:
 *   0 — all 650 pages meet the >= 500-word floor
 *   1 — at least one page below 500 words (failure paths printed)
 *   2 — structural error (missing dist dir, unparseable HTML, etc.)
 */

import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DIST_DIR = resolve(process.cwd(), 'dist/beauty-index/vs');
const REPORTS_DIR = resolve(process.cwd(), '.planning/reports');
const WORD_FLOOR = 500;
const WORD_CEILING_WARN = 1500; // soft warning — see RESEARCH Pattern 7

/** List every `dist/beauty-index/vs/{slug}/index.html`, sorted for deterministic output. */
async function listVsPageFiles() {
  if (!existsSync(DIST_DIR)) {
    console.error(`[VS-07] ERROR: ${DIST_DIR} does not exist. Run \`astro build\` first.`);
    process.exit(2);
  }
  const entries = await readdir(DIST_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => join(DIST_DIR, e.name, 'index.html'))
    .sort();
}

/** Extract the outer `<article>` (or `<main>` fallback) as plain text, no HTML tags. */
async function extractArticleText(htmlPath) {
  const html = await readFile(htmlPath, 'utf-8');
  // Greedy match captures the OUTERMOST <article>/<main> region — required
  // because the VS template wraps the whole page in one outer <article> and
  // contains 6 nested <article class="mb-10"> dimension blocks inside it.
  let match = html.match(/<article[^>]*>([\s\S]*)<\/article>/i);
  if (!match) match = html.match(/<main[^>]*>([\s\S]*)<\/main>/i);
  if (!match) throw new Error(`No <article> or <main> region in ${htmlPath}`);
  return match[1]
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function median(sorted) {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function buildHistogram(wordCounts) {
  // Buckets: <500, 500-599, 600-699, ..., 1400-1499, 1500+
  const buckets = {
    '<500': 0,
    '500-599': 0,
    '600-699': 0,
    '700-799': 0,
    '800-899': 0,
    '900-999': 0,
    '1000-1099': 0,
    '1100-1199': 0,
    '1200-1299': 0,
    '1300-1399': 0,
    '1400-1499': 0,
    '1500+': 0,
  };
  for (const n of wordCounts) {
    if (n < 500) buckets['<500']++;
    else if (n < 600) buckets['500-599']++;
    else if (n < 700) buckets['600-699']++;
    else if (n < 800) buckets['700-799']++;
    else if (n < 900) buckets['800-899']++;
    else if (n < 1000) buckets['900-999']++;
    else if (n < 1100) buckets['1000-1099']++;
    else if (n < 1200) buckets['1100-1199']++;
    else if (n < 1300) buckets['1200-1299']++;
    else if (n < 1400) buckets['1300-1399']++;
    else if (n < 1500) buckets['1400-1499']++;
    else buckets['1500+']++;
  }
  return buckets;
}

function timestampSlug(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

async function main() {
  const files = await listVsPageFiles();
  const results = [];
  for (const file of files) {
    try {
      const text = await extractArticleText(file);
      const tokens = tokenize(text);
      results.push({ path: file, wordCount: tokens.length });
    } catch (err) {
      console.error(`[VS-07] ERROR processing ${file}: ${err.message}`);
      process.exit(2);
    }
  }

  const counts = results.map((r) => r.wordCount).sort((a, b) => a - b);
  const min = counts[0] ?? 0;
  const max = counts[counts.length - 1] ?? 0;
  const mean = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const med = median(counts);
  const histogram = buildHistogram(counts);

  const failures = results
    .filter((r) => r.wordCount < WORD_FLOOR)
    .map((r) => ({ path: r.path, wordCount: r.wordCount }));

  const warnings = results
    .filter((r) => r.wordCount > WORD_CEILING_WARN)
    .map((r) => ({ path: r.path, wordCount: r.wordCount }));

  // Write report
  await mkdir(REPORTS_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const reportPath = join(REPORTS_DIR, `vs-wordcount-${timestampSlug()}.json`);
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        generatedAt,
        floor: WORD_FLOOR,
        total: results.length,
        min,
        max,
        mean: Math.round(mean * 100) / 100,
        median: med,
        histogram,
        failures,
        warnings,
      },
      null,
      2,
    ),
  );

  console.log(
    `[VS-07] ${results.length} pages: min=${min} max=${max} mean=${mean.toFixed(1)} median=${med}. Failures: ${failures.length}.`,
  );
  console.log(`[VS-07] Report: ${reportPath}`);

  if (warnings.length > 0) {
    console.error(
      `[VS-07] WARN: ${warnings.length} page(s) exceed ${WORD_CEILING_WARN} words — possible dimension-paragraph assembler bug (RESEARCH Pattern 7).`,
    );
    for (const w of warnings.slice(0, 5)) console.error(`  ${w.wordCount}  ${w.path}`);
  }

  if (failures.length > 0) {
    console.error(`[VS-07] FAIL: ${failures.length} page(s) below ${WORD_FLOOR}-word floor:`);
    for (const f of failures.slice(0, 10)) console.error(`  ${f.wordCount}  ${f.path}`);
    if (failures.length > 10) console.error(`  ... and ${failures.length - 10} more (see report).`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[VS-07] fatal:', err);
  process.exit(2);
});
