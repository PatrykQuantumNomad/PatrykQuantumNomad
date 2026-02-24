# Project Research Summary

**Project:** patrykgolabek.dev — v1.8 EDA Visual Encyclopedia
**Domain:** Interactive statistics education pillar — modernizing NIST/SEMATECH e-Handbook of Statistical Methods, Chapter 1
**Researched:** 2026-02-24
**Confidence:** HIGH

## Executive Summary

The EDA Visual Encyclopedia is a 90+ page statistics reference pillar added to an existing Astro 5 site (857 pages, Lighthouse 90+). The project modernizes the NIST/SEMATECH e-Handbook Chapter 1 — covering 6 foundation pages, 30 graphical techniques, 18 quantitative techniques, 19 probability distributions, 9 case studies, and 4 reference pages — from 1990s static HTML with obsolete Dataplot examples into a visual-first, Python-code-equipped reference encyclopedia. The core architectural decision is a 3-tier interactivity model: build-time TypeScript SVG generation for ~70% of pages (zero client JS), pre-rendered SVG swapping for ~20% of pages (minimal vanilla JS), and D3 micro-bundle React islands for the 19 distribution pages (~10%). No Python build dependency, no heavy charting libraries — all static plot generation happens in TypeScript at build time using DOM-independent D3 modules, following the proven pattern of `RadarChart.astro` and `CompassRadarChart.astro` already in the codebase.

The recommended approach reuses maximum existing infrastructure: Astro 5 Content Layer with JSON `file()` loader (proven from Beauty Index and Database Compass), `@astrojs/react` islands with `client:visible` (same as existing tool pages), `astro-expressive-code` for Python code blocks (zero new config), `satori`/`sharp` for OG images, and `nanostores` for filter state. New dependencies are minimal: `remark-math` + `rehype-katex` for build-time formula rendering (zero client JS, CSS+fonts only), and 6 D3 micro-modules totaling ~17KB gzipped for the distribution explorer. This keeps the total new production dependency count to 8 packages with a measured bundle impact of 17KB gzipped on only the 19 distribution pages.

The two highest-risk areas are content accuracy and SEO publication strategy. The NIST source material is peer-reviewed statistical reference; any paraphrasing or LLM-assisted generation introduces credibility-destroying errors that are expensive to remediate. Publishing 90+ template-similar pages simultaneously risks Google SpamBrain classification, which can suppress the entire `/eda/` subdirectory and drag down existing page rankings. Both risks are preventable with upfront policy (accuracy checklist per page) and publication pacing (10-15 pages per week). Infrastructure pitfalls — KaTeX parser conflicts, D3 bundle leakage, DOM bloat, build time regression — are all well-understood and solvable in Phase 1 before any content is authored.

## Key Findings

### Recommended Stack

The existing Astro 5 stack requires no framework changes. Eight new production dependencies cover all new functionality: `remark-math@^6.0.0` and `rehype-katex@^7.0.1` for build-time LaTeX rendering, and six D3 micro-modules (`d3-scale`, `d3-shape`, `d3-axis`, `d3-selection`, `d3-array`, `d3-path`) for both build-time SVG math (DOM-independent) and client-side distribution explorers. The critical insight is that `d3-scale` and `d3-shape` are DOM-independent and can run in Astro component frontmatter (Node.js) at build time — exactly how `RadarChart.astro` already works. The full `d3` package (280KB) is explicitly rejected in favor of micro-modules (~48KB minified / 17KB gzipped for the needed exports).

See `.planning/research/STACK.md` for full details.

**Core technologies:**
- `remark-math` + `rehype-katex`: Build-time LaTeX rendering — zero client JS, only CSS+fonts ship (24KB CSS, on-demand woff2 fonts)
- `d3-scale` + `d3-shape` + `d3-array` + `d3-path`: DOM-independent SVG math at build time — same pattern as existing RadarChart.astro
- `d3-axis` + `d3-selection`: Client-side D3 for Tier C distribution explorers only — loaded via `client:visible` on 19 pages
- JSON `file()` loader: Content collection for 90+ technique metadata entries — proven pattern from Beauty Index (25 entries) and Database Compass (12 entries)
- `astro-expressive-code` (existing): Python syntax highlighting — zero new configuration, already works with Python out of the box
- `satori` + `sharp` (existing): OG image generation — extend with `generateEdaOgImage()` function, add OG caching to control build time

**Critical version requirements:**
- `remark-math@^6.0.0` requires unified v11 (matches Astro 5's internal dependency)
- `rehype-katex@^7.0.1` requires rehype v4+ (matches Astro 5's internal dependency)
- KaTeX CSS must be self-hosted (not CDN) for production — eliminates external dependency and CSP complications
- PITFALLS.md notes version conflict risk: if Astro GitHub issue #8650 resurfaces, fall back to `remark-math@5.1.1` + `rehype-katex@6.0.3`

### Expected Features

See `.planning/research/FEATURES.md` for the full feature matrix and competitor analysis.

**Must have (table stakes — v1 launch):**
- Filterable card grid landing page at `/eda/` — reuse `UseCaseFilter.tsx` / `LanguageFilter.tsx` pattern; filter by section (Foundations, Graphical, Quantitative, Distributions, Case Studies)
- Build-time SVG plot for every technique page — 30+ chart types including histogram, box plot, scatter, run-sequence, lag, autocorrelation, probability, Q-Q; the visual foundation of the encyclopedia
- KaTeX formula rendering — every quantitative technique and distribution page requires properly typeset formulas; no competing reference provides this alongside visual plots
- Python code examples (static, copy-button) — replaces obsolete NIST Dataplot examples; actionable reference for modern practitioners
- Category taxonomy + technique data model — foundation for all routing, filtering, cross-linking, and OG image generation
- Breadcrumbs + cross-linking between related techniques — orientation and discovery in 90+ page hierarchy
- Consistent `TechniquePage.astro` layout — single source of truth for technique page structure
- SEO metadata per page — unique title, description, OG image, JSON-LD `TechArticle` for 86+ individually indexed pages

**Should have (v1.x, add incrementally after validation):**
- SVG swap interactivity (Tier B) — preset data-scenario buttons on histogram, scatter, normal probability plots (~11 pages); no D3 needed
- Annotated plot variants — arrows, callouts, highlighted regions that explain "this peak means X"; moderate design effort, low code effort
- Interactive parameter explorers for all 19 distributions (Tier C) — the headline differentiator; lets users adjust mu/sigma/lambda and see PDF+CDF update live; requires static SVG fallbacks first
- Expandable formula tooltips — hover/click on Greek symbols to see plain-English definition; reduces notation barrier
- Technique comparison tables — filterable matrix of techniques x problem categories (location, scale, normality, randomness); one page, high SEO value

**Defer (v2+, after content is complete and traffic validated):**
- 4-Plot interactive diagnostic tool — requires histogram, lag, normal probability, run-sequence generators all production-ready; add CSV paste + URL state; the "bring your own data" differentiator
- 9 Case study walkthrough pages — highest per-page effort; step-based progression with scroll reveals; build after all technique pages prove the format
- Distribution relationship diagram — all 19 distribution pages must exist before this capstone visualization makes sense

**Anti-features (explicitly rejected):**
- In-browser Python/R execution — Pyodide is 14MB+ WASM; destroys performance; code examples are illustrative, not computational
- User data upload for all 30+ techniques — scope explosion; 4-Plot tool covers the valuable use case
- Multi-language i18n — 90 pages x N languages; defer indefinitely unless validated demand emerges
- Animated plot transitions on all 80+ SVGs — enormous scope; reserve D3 animation budget for 19 distribution explorers only

### Architecture Approach

The EDA pillar follows the additive extension pattern established by every prior v1.x feature: new directories under `src/data/eda/`, `src/lib/eda/`, `src/components/eda/`, and `src/pages/eda/` with zero coupling to existing pillars. Eight existing files are modified (additive only): `content.config.ts`, `Header.astro`, `og-image.ts`, `astro.config.mjs`, `pages/index.astro`, `llms.txt.ts`, `llms-full.txt.ts`, and `package.json`. The dual content collection strategy (JSON `file()` loader for structured technique metadata, MDX `glob()` loader for prose-heavy foundations/case-studies/reference pages) matches the existing codebase split between Beauty Index/DB Compass (JSON) and blog (MDX).

See `.planning/research/ARCHITECTURE.md` for full file tree, component API, data flow diagrams, and integration point details.

**Major components:**
1. `src/lib/eda/schema.ts` — Zod schemas for `EdaTechnique` and `EdaDistribution` types; drives type safety across all generators and templates
2. `src/lib/eda/svg-generators/` — 7 TypeScript files generating SVG strings from data: `plot-base.ts` (shared axes/grid), `line-plot.ts`, `scatter-plot.ts`, `bar-plot.ts`, `box-plot.ts`, `contour-plot.ts`, `distribution-curve.ts`, `composite-plot.ts` (4-plot, 6-plot)
3. `src/lib/eda/math/` — 3 pure math files (`statistics.ts`, `distributions.ts`, `datasets.ts`); no DOM dependencies; used by both SVG generators (build time) and D3 explorer (client side)
4. `src/components/eda/TechniquePage.astro` — shared layout for all 48 technique/quantitative pages; renders plot, formulas, Python code, interpretation, related links from structured data props
5. `src/components/eda/PlotVariantSwap.astro` — Tier B pre-rendered SVG variants with vanilla JS tab switcher (~3KB); no framework JS
6. `src/components/eda/DistributionExplorer.tsx` — Tier C React island loaded with `client:visible`; imports D3 micro-modules; covers all 19 distribution pages
7. `src/components/eda/CategoryFilter.tsx` — React island for landing page filtering; mirrors `LanguageFilter.tsx` pattern exactly
8. `src/pages/eda/` — 6 sub-directories with dynamic `[slug].astro` routes; each uses `getStaticPaths()` from content collections

**Key patterns to follow:**
- Build-time SVG generation: same as `radar-math.ts` and `spectrum-math.ts` — pure TypeScript functions returning SVG strings, called in Astro component frontmatter
- Three-tier JS budget: Tier A = ~0KB, Tier B = ~3KB vanilla, Tier C = ~17KB D3 gzipped (only on 19 pages)
- `client:visible` for all D3 islands — blocks nothing, loads only when chart is in viewport
- Separate `EDALayout.astro` extending base `Layout.astro` — isolates GSAP animation lifecycle from D3 components

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full pitfall analysis with warning signs, recovery strategies, and phase mappings.

1. **KaTeX + MDX formula parsing version conflicts** (Phase 48) — Astro GitHub issue #8650: `remark-math` and `rehype-katex` version mismatches cause `mathFlowInside` build failures; MDX's JSX parser conflicts with LaTeX `{}` braces in complex formulas. Prevention: test 10+ representative NIST formulas on a dedicated `/eda/test-formulas/` page before any content authoring; fall back to `remark-math@5.1.1` / `rehype-katex@6.0.3` if needed; create a `<Math>` component as escape hatch for problematic formulas.

2. **D3 bundle leaking to all 90+ pages** (Phase 48) — If D3 is imported in a shared layout or any non-island component, the ~48KB minified bundle ships to every EDA page, collapsing Lighthouse scores from 90+ to the 70s on mobile. Prevention: D3 lives exclusively in `DistributionExplorer.tsx` (a React island) loaded with `client:visible`; verify with Vite bundle analysis that D3 modules appear only in the Tier C page chunk; set a hard per-page JS budget (Tier A/B: +0-5KB; Tier C: +17KB gzipped max).

3. **Build time explosion from OG image generation at scale** (Phase 48) — 90+ new Satori+Sharp OG image renders add 9-27 seconds to build time; combined with SVG generation this risks hitting GitHub Pages' 10-minute deploy timeout. Prevention: implement content-hash-based OG image caching (skip regeneration if cached PNG exists); track build time after every 10 pages added; budget: no more than 20% regression from pre-EDA baseline.

4. **Content accuracy drift from NIST source material** (Phase 50+) — The NIST Handbook is peer-reviewed reference material; paraphrasing definitions, renaming formula variables, or using LLM-assisted content generation introduces subtle errors that destroy credibility with the target audience. Prevention is 10x cheaper than remediation. Policy: every formula verified character-by-character against NIST source; every page cites specific NIST section (e.g., "1.3.3.14"); review checklist completed before any content batch merges; never ship LLM-generated statistical content without manual verification.

5. **SEO penalty from bulk publishing 90+ template-similar pages** (Phase 53) — Google SpamBrain 2025 detects mass-produced template content; publishing all 90 pages simultaneously can suppress the entire `/eda/` subdirectory and drag down existing page rankings. Recovery takes 3-6 months. Prevention: publish 10-15 pages per week over 6-8 weeks; ensure 200+ words of unique plain-English explanation per page; hand-write unique meta descriptions (never auto-generate from template); structure URL hierarchy with content silo internal linking from day one.

6. **GSAP/D3 animation lifecycle conflicts** (Phase 48) — The existing site's GSAP ScrollTrigger uses `window.__*` globals documented as fragile in `CONCERNS.md`; EDA pages with D3 islands introduce competing scroll/resize listeners that can leak across view transitions. Prevention: `EDALayout.astro` overrides or omits content-area GSAP animations; D3 components manage their own lifecycle with `data-initialized` guard against view-transition re-mount duplication; test `Home->EDA->Blog->EDA->Home` navigation sequence (5+ times) for memory stability.

## Implications for Roadmap

Research identifies a clear phase structure driven by hard dependencies: infrastructure must validate the 3-tier architecture before content is authored, content must be batched and quality-gated, and publication must be paced for SEO safety. Phase numbering starts at 48 (continuing from v1.7 which ended at phase 47).

### Phase 48: Infrastructure Foundation
**Rationale:** All 6 critical pitfalls require Phase 1 interventions. No content can be safely authored until the KaTeX pipeline, D3 bundle isolation, 3-tier component architecture, OG caching, and GSAP animation isolation are validated. Build infrastructure failure discovered at page 50 is far more expensive than at page 0.
**Delivers:** Complete EDA infrastructure with zero content pages — a working proof of each of the 3 tiers; `content.config.ts` with 3 validated Zod schemas; all SVG generator function stubs; `EDALayout.astro` with isolated animation lifecycle; OG caching implemented; build time baseline measured; KaTeX test page with 10+ NIST formula categories passing; Vite bundle analysis confirming D3 isolated to Tier C chunks; navigation integration (single "EDA Encyclopedia" link in Header)
**Addresses features:** Category taxonomy + technique data model, technique page template, breadcrumbs, site navigation integration, SEO metadata pipeline
**Avoids pitfalls:** All 6 critical pitfalls must be addressed here before content creation begins
**Research flag:** Standard patterns — skip `research-phase`

### Phase 49: Data Model + Content Schema Population
**Rationale:** The JSON data files (`techniques.json`, `distributions.json`) must be complete before any page generation can be validated. This is a content architecture phase — no page rendering, no interactivity — just defining the full 90+ entry data model with all required fields. Doing this before content authoring catches schema design errors when fixing them is cheap (one JSON file change vs 90 MDX files).
**Delivers:** Complete `techniques.json` (30 graphical + 18 quantitative entries), complete `distributions.json` (19 entries), MDX stubs for 6 foundations + 9 case studies + 4 reference pages, all with NIST section references; validated against Zod schema; all cross-linking slugs pre-populated; sample data generators in `datasets.ts`; each technique tagged with its interactivity tier (A/B/C)
**Uses:** JSON `file()` loader, Zod schemas from Phase 48, `categories.ts`
**Implements:** Dual content collection strategy
**Research flag:** Standard patterns — skip `research-phase`

### Phase 50: SVG Generator Library
**Rationale:** The SVG generator functions are the core technical challenge with no existing analog at the required variety (histogram, box plot, scatter, probability plot, run-sequence, lag, autocorrelation, Q-Q, contour, composite 4-plot/6-plot, distribution curves). All 30 graphical technique pages depend on these generators. Building the full library first with unit-testable pure functions enables confident content authoring; building generators one-at-a-time with content would create confusing partial states.
**Delivers:** All SVG generator functions in `src/lib/eda/svg-generators/` and `src/lib/eda/math/` (statistics.ts, distributions.ts, datasets.ts); each generator tested with sample NIST data; palette matching site's Quantum Explorer theme; all plots responsive via viewBox with no fixed width/height; dark mode contrast verified
**Uses:** `d3-scale`, `d3-shape`, `d3-array`, `d3-path` (build-time DOM-independent)
**Implements:** Build-time SVG generation pattern (Tier A + Tier B base)
**Research flag:** TypeScript SVG generation of varied statistical chart types — consider `research-phase` for complex plot types (probability plots, star plots, contour plots, Q-Q plots)

### Phase 51: Graphical Technique Pages (Tier A + Tier B)
**Rationale:** Graphical techniques are the visual centerpiece and highest-value table-stakes feature. 10 priority techniques (histogram, box plot, scatter, normal probability, run-sequence, lag, autocorrelation, 4-plot, 6-plot, probability plot) enable the MVP to be evaluated as a working encyclopedia before committing to all 30. Tier B SVG swap interactivity is included here because it shares the same SVG generators and adding it later would require revisiting every page.
**Delivers:** 10 MVP graphical technique pages (Tier A) + 20 remaining graphical pages; ~11 Tier B pages with SVG swap (histogram interpretations, scatter patterns, normal probability shapes); `PlotVariantSwap.astro` component; annotated plot variants for the highest-value techniques; filterable card grid landing page (first real content to test the filter)
**Uses:** SVG generators from Phase 50, `TechniquePage.astro` from Phase 48
**Implements:** Tier A and Tier B interactivity patterns at full scale
**Research flag:** Standard patterns — skip `research-phase`

### Phase 52: Quantitative Technique Pages + Foundations
**Rationale:** Quantitative technique pages depend heavily on KaTeX (validated in Phase 48) and Python code blocks. 18 quantitative techniques plus 6 foundation pages complete the non-distribution content. Foundations (EDA philosophy, assumptions, problem categories) provide the conceptual framing that makes technique pages meaningful. This phase validates the pillar at ~60% complete before tackling the technically distinct distribution pages.
**Delivers:** 18 quantitative technique pages (measures of location, scale, t-test, ANOVA, chi-square, Anderson-Darling, etc.) with KaTeX formulas, Python code, and build-time plots; 6 foundation pages (MDX from `edaPages` collection); technique comparison tables; cross-linking complete across all published pages
**Uses:** `rehype-katex`, MDX `glob()` loader, `FormulaBlock.astro`, `PythonCode.astro`
**Implements:** Dual content collection strategy (both JSON and MDX paths exercised in production)
**Research flag:** Standard patterns — skip `research-phase`

### Phase 53: Distribution Pages (Tier C — D3 Interactive Explorers)
**Rationale:** All 19 distribution pages require both a static SVG fallback (via `distribution-curve.ts` from Phase 50) and a D3 interactive parameter explorer. This is architecturally distinct from all other pages: React island with D3 micro-bundle, parameter sliders, live PDF+CDF redraw, resize handling, view-transition cleanup. Grouping all 19 into one phase ensures the `DistributionExplorer.tsx` component is built once with full polish rather than incrementally, and the D3 bundle footprint is validated across all 19 pages before publication.
**Delivers:** 19 distribution pages (Normal, Uniform, Exponential, t, Chi-squared, F, Beta, Gamma, Weibull, Poisson, Binomial, Geometric, Hypergeometric, Negative Binomial, Lognormal, Cauchy, Laplace, Logistic, Pareto); `DistributionExplorer.tsx` with parameter sliders (mu, sigma, n, p, lambda, etc.), dual PDF+CDF display, touch-friendly sliders; static build-time SVG fallback for no-JS users; `client:visible` loading verified to not ship D3 to non-distribution pages
**Uses:** `d3-selection`, `d3-axis` (client-side); `distribution-curve.ts`, `distributions.ts` (shared math)
**Implements:** Tier C interactivity pattern at full scale
**Research flag:** D3 component lifecycle with Astro view transitions is a known pitfall area — run `research-phase` to document D3 mount/unmount patterns and resize handling before implementation

### Phase 54: SEO, Polish, and Staged Publication
**Rationale:** The PITFALLS research is unambiguous: bulk-publishing 90 template-similar pages simultaneously triggers SpamBrain. Staged publication (10-15 pages/week) must be planned and executed as a distinct phase with Google Search Console monitoring between batches. This phase also addresses all remaining "looks done but isn't" checklist items: accessibility audit, mobile SVG validation, RSS feed isolation, llms.txt update, 4 reference pages, and sitemap configuration.
**Delivers:** Staged publication over 6-8 weeks with Search Console monitoring; 4 reference pages (analysis questions, techniques by category, distribution tables, related distributions); JSON-LD `TechArticle` / `LearningResource` structured data on all pages; `role="img"` + `aria-label` on all SVG plots; mobile 320px viewport validation; RSS feed confirmed to exclude EDA pages; `llms.txt` updated; Lighthouse 90+ verified on one page from each tier
**Addresses pitfalls:** SEO publication strategy (Pitfall 6), accessibility, final integration checks
**Research flag:** Standard patterns — skip `research-phase`

### Phase 55: v2 Features (Post-Validation)
**Rationale:** The 4-Plot interactive diagnostic tool and 9 case study walkthrough pages are the highest per-page effort features and depend on all preceding content being production-ready. Explicitly scoped to a post-launch phase triggered by traffic validation. The distribution relationship diagram capstone also belongs here.
**Delivers:** 4-Plot interactive diagnostic (histogram + lag + normal probability + run-sequence generators composited with CSV input, URL state via `lz-string`); 9 case study pages with step-based walkthrough progression; distribution relationship diagram (all 19 distribution nodes + mathematical relationship edges)
**Research flag:** 4-Plot tool architecture and case study interaction design are both novel patterns for this codebase — run `research-phase` before this milestone

### Phase Ordering Rationale

- **Infrastructure first (Phase 48):** All 6 critical pitfalls are infrastructure problems. Content authored on broken infrastructure creates cleanup debt that scales with page count.
- **Data model before content (Phase 49):** Schema design errors cost 1 hour at Phase 49, 100 hours at Phase 54. The JSON data files drive everything downstream.
- **SVG generators before pages (Phase 50):** All 30 graphical technique pages are blocked on the chart generator library. Building generators with isolated unit tests enables parallel content authoring in Phases 51-52.
- **Graphical before quantitative (Phase 51 before 52):** Graphical techniques are the headline visual feature; early validation of the visual pillar concept is higher value than quantitative completeness.
- **Distributions last in content (Phase 53):** Tier C architecture is distinct and requires all static SVG infrastructure to be proven first (static fallback = Tier A pattern, which must be stable before adding the D3 layer on top).
- **Staged publication separate (Phase 54):** Publication pacing is a non-negotiable SEO risk mitigation; it requires dedicated phase ownership and monitoring cadence, not an afterthought.

### Research Flags

Phases needing deeper research during planning:
- **Phase 50 (SVG Generator Library):** Complex statistical plot types (probability plots, star plots, contour plots, Q-Q plots) have non-trivial SVG generation logic. Run `/gsd:research-phase` to document the D3 scale/shape function combinations and data transformations for each chart type.
- **Phase 53 (Distribution Pages — Tier C):** D3 component lifecycle with Astro view transitions is the documented fragile area (GSAP conflicts, duplicate chart instances on re-navigation). Run `/gsd:research-phase` to document `useEffect` cleanup patterns, resize observer teardown, and the `data-initialized` guard approach before implementation.
- **Phase 55 (v2 Features):** 4-Plot interactive tool architecture (CSV parsing, URL state, multi-panel D3 layout) and case study step-based interaction design are both novel patterns for this codebase. Run `/gsd:research-phase` before starting either.

Phases with well-documented standard patterns (skip research-phase):
- **Phase 48 (Infrastructure):** All components follow documented Astro patterns (KaTeX integration, content collections, layout slots, island directives). Recovery strategies well-documented in PITFALLS.md.
- **Phase 49 (Data Model):** JSON `file()` loader with Zod schemas is a proven codebase pattern with two working examples.
- **Phase 51 (Graphical Technique Pages):** Reuses `TechniquePage.astro` template and SVG generators from Phase 50; same routing pattern as Beauty Index and Database Compass.
- **Phase 52 (Quantitative + Foundations):** Follows established dual content collection patterns; KaTeX already validated in Phase 48.
- **Phase 54 (SEO + Publication):** Standard Astro sitemap/JSON-LD/accessibility patterns, plus documented staged publication strategy from PITFALLS.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs, local measurements (D3 bundle size measured with esbuild: 48KB minified / 17KB gzipped), first-party codebase patterns (RadarChart.astro, beauty-index JSON loader, CompassRadarChart.astro). Version compatibility matrix fully verified. |
| Features | HIGH | NIST Handbook is public domain and fully enumerable (33 graphical, 18 quantitative, 19 distributions, 9 case studies). Competitor analysis (Seeing Theory, R Psychologist, Stat Trek, Khan Academy) is direct observation. Feature dependencies are logically derived from FEATURES.md dependency graph. |
| Architecture | HIGH | Based on direct codebase analysis of 3 existing parallel pillars (Beauty Index, Database Compass, Dockerfile/Compose/K8s tool pages). All architectural patterns proven in first-party code. Astro 5 Content Layer, D3 modular imports, and `client:visible` island loading are officially documented. |
| Pitfalls | HIGH | Sourced from Astro GitHub issues (verified), KaTeX GitHub issues (verified), Lighthouse issue tracker (verified), GSAP forum posts (verified against `CONCERNS.md`), Google spam update reports (multiple sources), first-party codebase `CONCERNS.md`. Recovery strategies are researched, not speculative. |

**Overall confidence:** HIGH

### Gaps to Address

- **KaTeX version compatibility at execution time:** PITFALLS.md and STACK.md give slightly different version recommendations (STACK recommends `remark-math@^6.0.0`, PITFALLS recommends pinning to `5.1.1` if issues arise). Resolve by attempting `^6.0.0` first in Phase 48 with the test-formulas page; fall back to `5.1.1` only if `mathFlowInside` errors appear. Document the actual working version in Phase 48 milestone notes.

- **OG image caching implementation specifics:** Both STACK.md and PITFALLS.md recommend OG caching but neither specifies the exact implementation (hash function, cache location, CI invalidation). Concrete decision needed in Phase 48: use content hash of `(title + description)`, store cached PNGs in `public/open-graph/eda/` committed to git, skip Satori render if file already exists with matching hash.

- **KaTeX CDN vs self-hosting final decision:** ARCHITECTURE.md initially suggests CDN for simplicity, but STACK.md and PITFALLS.md both recommend self-hosting for CSP safety and reliability. Self-hosting is the correct production choice. The `scripts/copy-katex-assets.mjs` script should be implemented in Phase 48 and assets committed before any content phases begin.

- **Dark mode SVG color palette validation:** PITFALLS.md flags dark mode SVG readability as a "looks done but isn't" item. The `QUANTUM_PALETTE` color values from ARCHITECTURE.md need to be tested against the site's dark theme before any content SVGs are generated. Validate in Phase 50 as the first SVG generator functions are built.

- **Tier B page count discrepancy:** FEATURES.md and ARCHITECTURE.md differ slightly on the number of pages needing SVG swap interactivity (FEATURES says ~15, ARCHITECTURE says ~12). Resolve definitively during Phase 49 data model population by tagging each technique with its interactivity tier; the count will be authoritative from the data.

## Sources

### Primary (HIGH confidence)
- [NIST/SEMATECH e-Handbook Chapter 1](https://www.itl.nist.gov/div898/handbook/eda/eda.htm) — Complete EDA section structure, technique list, all formulas and methodology
- [Astro 5 Content Layer Docs](https://docs.astro.build/en/guides/content-collections/) — `file()` and `glob()` loaders, caching behavior, `getStaticPaths()` patterns
- [Astro MDX Integration Docs](https://docs.astro.build/en/guides/integrations-guide/mdx/) — `extendMarkdownConfig: true`, remark/rehype plugin inheritance
- [D3 Official Docs](https://d3js.org/getting-started) — Sub-module imports, DOM independence of `d3-scale` / `d3-shape`, tree-shaking approach
- [KaTeX Font Documentation](https://katex.org/docs/font) — 20 woff2 font files, on-demand loading, self-hosting instructions
- [Astro GitHub Issue #8650](https://github.com/withastro/astro/issues/8650) — remark-math + Astro MDX version conflict, `mathFlowInside` error
- [KaTeX GitHub Issue #4096](https://github.com/KaTeX/KaTeX/issues/4096) — CSP `unsafe-inline` requirement for style-src
- [Lighthouse Issue #6807](https://github.com/GoogleChrome/lighthouse/issues/6807) — SVG child nodes counted in DOM size audit
- Existing codebase: `RadarChart.astro`, `CompassRadarChart.astro`, `radar-math.ts`, `spectrum-math.ts` — proven build-time SVG generation pattern
- Existing codebase: `src/content.config.ts` — Beauty Index (25 entries) and Database Compass (12 entries) JSON `file()` loader pattern
- Existing codebase: `.planning/codebase/CONCERNS.md` — animation lifecycle fragility, documented `window.__*` global state pattern
- D3 micro-bundle size: measured locally with esbuild — 48KB minified / 17KB gzipped for the needed imports
- [Seeing Theory (Brown University)](https://seeing-theory.brown.edu/) — Distribution parameter explorer design; dual PDF/CDF display pattern

### Secondary (MEDIUM confidence)
- [R Psychologist](https://rpsychologist.com/viz/) — Depth-over-breadth principle for interactive statistics visualizations
- [Distill.pub: Communicating with Interactive Articles](https://distill.pub/2020/communicating-with-interactive-articles/) — Five affordances framework; surgical interactivity principle
- [Astro OGP Build Cache](https://ainoya.dev/posts/astro-ogp-build-cache/) — Content-hash OG caching pattern
- [Google 2025 Spam Update](https://news.designrush.com/google-2025-spam-update-complete-seo-penalties) — SpamBrain cross-page pattern stitching
- [GSAP + Astro View Transitions](https://www.launchfa.st/blog/gsap-astro-view-transitions) — Lifecycle cleanup patterns for GSAP + Astro
- [Programmatic SEO at Scale](https://guptadeepak.com/the-programmatic-seo-paradox-why-your-fear-of-creating-thousands-of-pages-is-both-valid-and-obsolete/) — Gradual publication strategy rationale
- [Byteli: Math Typesetting in Astro MDX](https://www.byteli.com/blog/2024/math_in_astro/) — remark-math + rehype-katex practical configuration in Astro
- [MDX Discussion #1329](https://github.com/orgs/mdx-js/discussions/1329) — Custom Math component workaround for JSX/LaTeX brace conflicts

### Tertiary (LOW confidence, needs validation)
- D3 micro-bundle size estimate from ARCHITECTURE.md (~20KB minified / ~8KB gzipped) differs from STACK.md measurement (~48KB minified / ~17KB gzipped) — the STACK.md figure was explicitly measured with esbuild and should be treated as authoritative; use 17KB gzipped as the planning budget for Tier C pages

---
*Research completed: 2026-02-24*
*Ready for roadmap: yes*
*Phases: 48-55 (continuing from v1.7 milestone ending at phase 47)*
