#!/usr/bin/env node
/**
 * Phase 124 — Font Self-Hosting build-time gate.
 *
 * Runs LAST in npm run build, after:
 *   prebuild -> astro build -> verify-vs-wordcount -> verify-vs-overlap
 *            -> verify-sitemap-determinism -> [this]
 *
 * Enforces four independent assertions; any failure triggers exit 1.
 *
 *   (1) NO GOOGLE FONTS LEAK:
 *       Walk dist/ recursively. For every .html/.css/.js, grep for
 *       'fonts.googleapis.com' and 'fonts.gstatic.com'. Collect violations.
 *       Paths under ALLOWLIST_PATTERNS are treated as code-example false
 *       positives (the FastAPI guide security-headers page teaches CSP using
 *       those exact strings as literal examples — logged as INFO, not a
 *       violation). Keep the allowlist as narrow as possible.
 *
 *   (2) CSP GA REGRESSION GUARD:
 *       Read dist/index.html. Assert it still contains:
 *         - 'googletagmanager.com'
 *         - 'google-analytics.com'
 *         - 'Content-Security-Policy'
 *       This catches over-aggressive CSP edits that accidentally remove GA
 *       whitelist entries while stripping Google Fonts.
 *
 *   (3) PRELOAD HINTS PRESENT AND CORRECTLY FORMED:
 *       Read dist/index.html. Find all <link rel="preload" as="font" ...>.
 *       Assert:
 *         - exactly 2 such tags
 *         - each has type="font/woff2"
 *         - each has a `crossorigin` attribute (bare or crossorigin="anonymous")
 *         - each href matches /fonts/<name>-<weight>.woff2
 *       Capture href values for Assertion 4.
 *
 *   (4) PRELOAD HREFS MATCH @font-face src URLs (Pitfall 1 guard):
 *       Concatenate all dist/_astro/*.css. For each preload href from
 *       Assertion 3, assert a matching url(...) exists in the bundled CSS
 *       (accept single-quoted, double-quoted, or bare url() — esbuild/Vite
 *       typically strips quotes). A mismatch causes double-downloads because
 *       the browser won't recognise the preloaded font as the one requested
 *       by @font-face — see .planning/phases/124-font-self-hosting/124-RESEARCH.md.
 *
 * Exit contract (same shape as Phase 122/123 verifiers):
 *   - Exit 0 + stdout "[verify-no-google-fonts] PASS ..." on success
 *   - Exit 1 + stderr listing violations on any failure
 *
 * Zero external dependencies — uses only node:fs + node:path.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const FORBIDDEN = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Paths (relative to dist/) where the forbidden strings are allowed as
// literal code examples teaching CSP. Keep this list as narrow as possible.
//
// Known source: src/data/guides/fastapi-production/pages/security-headers.mdx
// renders to dist/guides/fastapi-production/security-headers/index.html
// (confirmed at Phase 124 P02 implementation time via `find dist -name '*.html'
// | xargs grep -l 'fonts.googleapis.com'`).
const ALLOWLIST_PATTERNS = [
  /^guides\/fastapi-production\/.*security-headers/,
];

function isAllowlisted(relPath) {
  return ALLOWLIST_PATTERNS.some((re) => re.test(relPath));
}

function ensureDist() {
  if (!existsSync(DIST)) {
    console.error('[verify-no-google-fonts] FAIL — dist/ not found. Run `astro build` first.');
    process.exit(1);
  }
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('[verify-no-google-fonts] FAIL — dist/index.html not found.');
    process.exit(1);
  }
}

// ---- Assertion 1 ----
const violations = [];
const allowlistHits = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(html|css|js)$/.test(entry)) continue;
    const body = readFileSync(full, 'utf8');
    const relPath = relative(DIST, full);
    for (const needle of FORBIDDEN) {
      if (body.includes(needle)) {
        if (isAllowlisted(relPath)) {
          allowlistHits.push({ file: relPath, needle });
        } else {
          violations.push({ file: relPath, needle });
        }
      }
    }
  }
}

ensureDist();
walk(DIST);

// ---- Assertion 2 ----
const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf8');
const GA_MARKERS = ['googletagmanager.com', 'google-analytics.com', 'Content-Security-Policy'];
const missingMarkers = GA_MARKERS.filter((m) => !indexHtml.includes(m));

// ---- Assertion 3 ----
// Accept attributes in any order between rel="preload" and as="font" and the
// closing >. The /g flag lets us count occurrences. We require BOTH rel and as
// in either order.
const PRELOAD_RE_A = /<link[^>]*\brel="preload"[^>]*\bas="font"[^>]*>/g;
const PRELOAD_RE_B = /<link[^>]*\bas="font"[^>]*\brel="preload"[^>]*>/g;
const preloadMatchesA = indexHtml.match(PRELOAD_RE_A) || [];
const preloadMatchesB = indexHtml.match(PRELOAD_RE_B) || [];
// De-duplicate (a given tag should only match one of the two orders; belt+braces)
const preloadMatches = Array.from(new Set([...preloadMatchesA, ...preloadMatchesB]));

const preloadIssues = [];
const preloadHrefs = [];
if (preloadMatches.length !== 2) {
  preloadIssues.push(
    `expected exactly 2 preload <link as=font>, found ${preloadMatches.length}`
  );
}
for (const tag of preloadMatches) {
  if (!/\btype="font\/woff2"/.test(tag)) {
    preloadIssues.push(`missing type=font/woff2: ${tag}`);
  }
  // Accept bare `crossorigin` or crossorigin="..." — both are valid HTML.
  if (!/\bcrossorigin\b/.test(tag)) {
    preloadIssues.push(`missing crossorigin: ${tag}`);
  }
  const hrefMatch = tag.match(/\bhref="([^"]+)"/);
  const href = hrefMatch ? hrefMatch[1] : null;
  if (!href || !/^\/fonts\/[a-z0-9-]+\.woff2$/.test(href)) {
    preloadIssues.push(`invalid or missing /fonts/<name>.woff2 href: ${tag}`);
  } else {
    preloadHrefs.push(href);
  }
}

// ---- Assertion 4 ----
const cssDir = join(DIST, '_astro');
let allCss = '';
let cssDirMissing = false;
try {
  for (const entry of readdirSync(cssDir)) {
    if (entry.endsWith('.css')) {
      allCss += readFileSync(join(cssDir, entry), 'utf8') + '\n';
    }
  }
} catch {
  // _astro may not exist if build shape changes — surface as a failure below.
  cssDirMissing = true;
}
const hrefMismatches = [];
if (cssDirMissing) {
  hrefMismatches.push(
    `dist/_astro/ not found — cannot verify @font-face src URLs (build shape changed?)`
  );
} else {
  for (const href of preloadHrefs) {
    const patterns = [`url('${href}')`, `url("${href}")`, `url(${href})`];
    if (!patterns.some((p) => allCss.includes(p))) {
      hrefMismatches.push(
        `preload href ${href} has no matching @font-face src in dist/_astro/*.css — Pitfall 1 (double-download risk)`
      );
    }
  }
}

// ---- Report ----
const hasFailure =
  violations.length > 0 ||
  missingMarkers.length > 0 ||
  preloadIssues.length > 0 ||
  hrefMismatches.length > 0;

for (const hit of allowlistHits) {
  console.log(
    `[verify-no-google-fonts] INFO — allowlisted match in ${hit.file} ("${hit.needle}") — code example, not a live resource`
  );
}

if (hasFailure) {
  console.error('[verify-no-google-fonts] FAIL');
  for (const v of violations) {
    console.error(`  Google Fonts URL leak: ${v.file} contains "${v.needle}"`);
  }
  for (const m of missingMarkers) {
    console.error(
      `  GA regression: dist/index.html missing required marker "${m}" — CSP edit likely over-aggressive`
    );
  }
  for (const issue of preloadIssues) {
    console.error(`  Preload issue: ${issue}`);
  }
  for (const mm of hrefMismatches) {
    console.error(`  URL mismatch: ${mm}`);
  }
  process.exit(1);
}

console.log(
  `[verify-no-google-fonts] PASS — 0 violations, ${preloadHrefs.length} preload hints (${preloadHrefs.join(', ')}), all @font-face src URLs matched, ${allowlistHits.length} allowlisted code-example match(es)`
);
process.exit(0);
