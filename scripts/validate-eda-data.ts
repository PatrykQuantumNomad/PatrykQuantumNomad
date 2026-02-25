/**
 * Cross-link validation script for all EDA data files.
 *
 * Performs 17 checks across techniques.json, distributions.json, and MDX stubs
 * to ensure the data model is self-consistent with route-aware validation.
 *
 * Run: npx tsx scripts/validate-eda-data.ts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  techniqueUrl,
  distributionUrl,
  foundationUrl,
  caseStudyUrl,
  referenceUrl,
  EDA_ROUTES,
} from '../src/lib/eda/routes.js';

const ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data', 'eda');
const PAGES_DIR = join(DATA_DIR, 'pages');

let errors = 0;
let passCount = 0;

function pass(check: number, msg: string): void {
  console.log(`  PASS [${check}] ${msg}`);
  passCount++;
}

function fail(check: number, msg: string): void {
  console.error(`  FAIL [${check}] ${msg}`);
  errors++;
}

// ---------------------------------------------------------------
// Load data files
// ---------------------------------------------------------------
let techniques: Array<{
  id: string;
  slug: string;
  category: 'graphical' | 'quantitative';
  tier: string;
  relatedTechniques: string[];
}> = [];
let distributions: Array<{
  id: string;
  slug: string;
  relatedDistributions: string[];
}> = [];

// Check 1: techniques.json parses as valid JSON
try {
  const raw = readFileSync(join(DATA_DIR, 'techniques.json'), 'utf-8');
  techniques = JSON.parse(raw);
  pass(1, 'techniques.json parses as valid JSON');
} catch (e) {
  fail(1, `techniques.json parse error: ${(e as Error).message}`);
}

// Check 2: distributions.json parses as valid JSON
try {
  const raw = readFileSync(join(DATA_DIR, 'distributions.json'), 'utf-8');
  distributions = JSON.parse(raw);
  pass(2, 'distributions.json parses as valid JSON');
} catch (e) {
  fail(2, `distributions.json parse error: ${(e as Error).message}`);
}

// ---------------------------------------------------------------
// Count checks
// ---------------------------------------------------------------

// Check 3: Technique count 29 graphical + 18 quantitative = 47
const graphical = techniques.filter((t) => t.category === 'graphical');
const quantitative = techniques.filter((t) => t.category === 'quantitative');
if (graphical.length === 29 && quantitative.length === 18 && techniques.length === 47) {
  pass(3, `Technique count: ${graphical.length} graphical + ${quantitative.length} quantitative = ${techniques.length}`);
} else {
  fail(3, `Technique count: ${graphical.length} graphical + ${quantitative.length} quantitative = ${techniques.length} (expected 29+18=47)`);
}

// Check 4: Distribution count 19
if (distributions.length === 19) {
  pass(4, `Distribution count: ${distributions.length}`);
} else {
  fail(4, `Distribution count: ${distributions.length} (expected 19)`);
}

// ---------------------------------------------------------------
// Uniqueness checks
// ---------------------------------------------------------------

// Check 5: No duplicate IDs in techniques.json
const techIds = new Set<string>();
let techDupes = 0;
for (const t of techniques) {
  if (techIds.has(t.id)) {
    techDupes++;
    console.error(`    Duplicate technique ID: ${t.id}`);
  }
  techIds.add(t.id);
}
if (techDupes === 0) {
  pass(5, `No duplicate IDs in techniques.json (${techIds.size} unique)`);
} else {
  fail(5, `${techDupes} duplicate ID(s) in techniques.json`);
}

// Check 6: No duplicate IDs in distributions.json
const distIds = new Set<string>();
let distDupes = 0;
for (const d of distributions) {
  if (distIds.has(d.id)) {
    distDupes++;
    console.error(`    Duplicate distribution ID: ${d.id}`);
  }
  distIds.add(d.id);
}
if (distDupes === 0) {
  pass(6, `No duplicate IDs in distributions.json (${distIds.size} unique)`);
} else {
  fail(6, `${distDupes} duplicate ID(s) in distributions.json`);
}

// ---------------------------------------------------------------
// Cross-link validation (within-category)
// ---------------------------------------------------------------

// Check 7: All relatedTechniques slugs resolve to existing technique IDs
const techSlugSet = new Set(techniques.map((t) => t.slug));
let brokenTechLinks = 0;
for (const t of techniques) {
  for (const ref of t.relatedTechniques) {
    if (!techSlugSet.has(ref)) {
      brokenTechLinks++;
      console.error(`    Technique "${t.id}" references unknown technique: "${ref}"`);
    }
  }
}
if (brokenTechLinks === 0) {
  pass(7, 'All relatedTechniques slugs resolve to existing technique IDs');
} else {
  fail(7, `${brokenTechLinks} broken relatedTechniques reference(s)`);
}

// Check 8: No technique self-references
let techSelfRefs = 0;
for (const t of techniques) {
  if (t.relatedTechniques.includes(t.slug)) {
    techSelfRefs++;
    console.error(`    Technique "${t.id}" self-references in relatedTechniques`);
  }
}
if (techSelfRefs === 0) {
  pass(8, 'No technique self-references in relatedTechniques');
} else {
  fail(8, `${techSelfRefs} technique self-reference(s)`);
}

// Check 9: All relatedDistributions slugs resolve to existing distribution IDs
const distSlugSet = new Set(distributions.map((d) => d.slug));
let brokenDistLinks = 0;
for (const d of distributions) {
  for (const ref of d.relatedDistributions) {
    if (!distSlugSet.has(ref)) {
      brokenDistLinks++;
      console.error(`    Distribution "${d.id}" references unknown distribution: "${ref}"`);
    }
  }
}
if (brokenDistLinks === 0) {
  pass(9, 'All relatedDistributions slugs resolve to existing distribution IDs');
} else {
  fail(9, `${brokenDistLinks} broken relatedDistributions reference(s)`);
}

// Check 10: No distribution self-references
let distSelfRefs = 0;
for (const d of distributions) {
  if (d.relatedDistributions.includes(d.slug)) {
    distSelfRefs++;
    console.error(`    Distribution "${d.id}" self-references in relatedDistributions`);
  }
}
if (distSelfRefs === 0) {
  pass(10, 'No distribution self-references in relatedDistributions');
} else {
  fail(10, `${distSelfRefs} distribution self-reference(s)`);
}

// ---------------------------------------------------------------
// Route-aware cross-link validation (cross-category)
// ---------------------------------------------------------------

// Build a lookup map: slug -> category for technique entries
const techCategoryMap = new Map(techniques.map((t) => [t.slug, t.category]));

// Check 11: Graphical techniques map to /eda/techniques/{slug}/,
//           quantitative techniques map to /eda/quantitative/{slug}/
//           AND relatedTechniques references resolve to correct routes
let routeErrors11 = 0;
for (const t of techniques) {
  const url = techniqueUrl(t.slug, t.category);
  const expectedPrefix = t.category === 'graphical'
    ? EDA_ROUTES.techniques
    : EDA_ROUTES.quantitative;
  if (!url.startsWith(expectedPrefix)) {
    routeErrors11++;
    console.error(`    Technique "${t.slug}" (${t.category}) maps to ${url}, expected prefix ${expectedPrefix}`);
  }
  // Verify cross-category route resolution for relatedTechniques
  for (const ref of t.relatedTechniques) {
    const refCategory = techCategoryMap.get(ref);
    if (refCategory) {
      const refUrl = techniqueUrl(ref, refCategory);
      const refExpected = refCategory === 'graphical'
        ? EDA_ROUTES.techniques
        : EDA_ROUTES.quantitative;
      if (!refUrl.startsWith(refExpected)) {
        routeErrors11++;
        console.error(`    Related technique "${ref}" (${refCategory}) maps to ${refUrl}, expected prefix ${refExpected}`);
      }
    }
  }
}
if (routeErrors11 === 0) {
  pass(11, 'All technique slugs resolve to correct category-based route prefixes');
} else {
  fail(11, `${routeErrors11} route resolution error(s) for techniques`);
}

// Check 12: Distribution routes resolve to /eda/distributions/{slug}/
let routeErrors12 = 0;
for (const d of distributions) {
  const url = distributionUrl(d.slug);
  if (!url.startsWith(EDA_ROUTES.distributions)) {
    routeErrors12++;
    console.error(`    Distribution "${d.slug}" maps to ${url}, expected prefix ${EDA_ROUTES.distributions}`);
  }
}
if (routeErrors12 === 0) {
  pass(12, 'All distribution slugs resolve to /eda/distributions/{slug}/');
} else {
  fail(12, `${routeErrors12} route resolution error(s) for distributions`);
}

// ---------------------------------------------------------------
// MDX stub validation
// ---------------------------------------------------------------

const MDX_CATEGORIES = ['foundations', 'case-studies', 'reference'] as const;
const categoryExpectedCounts = { foundations: 6, 'case-studies': 9, reference: 4 };
const mdxFiles: Array<{ filename: string; category: typeof MDX_CATEGORIES[number]; frontmatter: Record<string, string> }> = [];

for (const cat of MDX_CATEGORIES) {
  const dir = join(PAGES_DIR, cat);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  for (const f of files) {
    const content = readFileSync(join(dir, f), 'utf-8');
    // Extract YAML frontmatter between --- markers
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter: Record<string, string> = {};
    if (match) {
      for (const line of match[1].split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
          frontmatter[key] = value;
        }
      }
    }
    mdxFiles.push({ filename: f, category: cat, frontmatter });
  }
}

// Check 13: MDX stub file count = 6 + 9 + 4 = 19
const foundationsCount = mdxFiles.filter((f) => f.category === 'foundations').length;
const caseStudiesCount = mdxFiles.filter((f) => f.category === 'case-studies').length;
const referenceCount = mdxFiles.filter((f) => f.category === 'reference').length;
const totalMdx = mdxFiles.length;

if (foundationsCount === 6 && caseStudiesCount === 9 && referenceCount === 4 && totalMdx === 19) {
  pass(13, `MDX stub count: ${foundationsCount} foundations + ${caseStudiesCount} case-studies + ${referenceCount} reference = ${totalMdx}`);
} else {
  fail(13, `MDX stub count: ${foundationsCount} foundations + ${caseStudiesCount} case-studies + ${referenceCount} reference = ${totalMdx} (expected 6+9+4=19)`);
}

// Check 14: Each MDX file has valid YAML frontmatter (title and category present)
let missingFrontmatter = 0;
for (const f of mdxFiles) {
  if (!f.frontmatter.title || !f.frontmatter.category) {
    missingFrontmatter++;
    console.error(`    MDX "${f.filename}" missing title or category in frontmatter`);
  }
}
if (missingFrontmatter === 0) {
  pass(14, `All ${totalMdx} MDX files have valid YAML frontmatter (title and category present)`);
} else {
  fail(14, `${missingFrontmatter} MDX file(s) missing required frontmatter fields`);
}

// Check 15: MDX filenames resolve via route builders
const routeBuilders: Record<typeof MDX_CATEGORIES[number], (slug: string) => string> = {
  foundations: foundationUrl,
  'case-studies': caseStudyUrl,
  reference: referenceUrl,
};
let routeErrors15 = 0;
for (const f of mdxFiles) {
  const slug = f.filename.replace('.mdx', '');
  const builder = routeBuilders[f.category];
  const url = builder(slug);
  // Verify the URL starts with the expected category prefix
  const expectedPrefixes: Record<string, string> = {
    foundations: EDA_ROUTES.foundations,
    'case-studies': EDA_ROUTES.caseStudies,
    reference: EDA_ROUTES.reference,
  };
  if (!url.startsWith(expectedPrefixes[f.category])) {
    routeErrors15++;
    console.error(`    MDX "${f.filename}" resolves to ${url}, expected prefix ${expectedPrefixes[f.category]}`);
  }
}
if (routeErrors15 === 0) {
  pass(15, `All ${totalMdx} MDX filenames resolve via category route builders`);
} else {
  fail(15, `${routeErrors15} MDX file(s) fail route resolution`);
}

// ---------------------------------------------------------------
// Tier validation
// ---------------------------------------------------------------

// Check 16: Tier B count = exactly 6 graphical techniques
const tierBGraphical = techniques.filter((t) => t.category === 'graphical' && t.tier === 'B');
if (tierBGraphical.length === 6) {
  pass(16, `Tier B graphical count: ${tierBGraphical.length}`);
} else {
  fail(16, `Tier B graphical count: ${tierBGraphical.length} (expected 6)`);
}

// Check 17: All quantitative techniques are Tier A
const nonTierAQuant = quantitative.filter((t) => t.tier !== 'A');
if (nonTierAQuant.length === 0) {
  pass(17, `All ${quantitative.length} quantitative techniques are Tier A`);
} else {
  fail(17, `${nonTierAQuant.length} quantitative technique(s) not Tier A: ${nonTierAQuant.map((t) => t.id).join(', ')}`);
}

// ---------------------------------------------------------------
// Summary
// ---------------------------------------------------------------
console.log('');
console.log(`Validation complete: ${passCount} passed, ${errors} failed out of 17 checks`);
if (errors > 0) {
  process.exit(1);
} else {
  console.log('All checks passed.');
}
