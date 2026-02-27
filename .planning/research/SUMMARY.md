# Project Research Summary

**Project:** EDA Graphical Techniques NIST Parity
**Domain:** Static site content expansion — Astro + TypeScript content enrichment
**Researched:** 2026-02-27
**Confidence:** HIGH

## Executive Summary

This milestone expands 29 existing EDA graphical technique pages to full NIST/SEMATECH handbook section depth. The work is a content enrichment project, not a platform or architecture change. Every technical capability needed — KaTeX formula rendering, Python syntax highlighting, case study cross-linking — already exists and is proven on the site's quantitative technique pages and distribution pages. Zero new npm packages are required. The quantitative `[slug].astro` page is the exact reference implementation for the target state. Three NIST sections are entirely absent from all 29 graphical pages today: "Questions Answered," "Importance," and "Case Study" cross-links. Two more sections are partially absent: formulas (0 of 29 graphical pages have them; ~12 of 29 need them) and Python code examples (0 of 29 graphical pages have them; quantitative pages already do).

The recommended approach is a phased build: establish infrastructure first (interface extension, template update, file split, case study mapping), then populate content in categorical batches. The three missing prose sections — Questions, Importance, Case Studies — are pure content additions with no infrastructure dependencies and should come first because they deliver the highest value-to-effort ratio and validate the template changes with visible output quickly. Formulas and Python code share the same template infrastructure changes and must be authored together. Variant interpretation captions for the 6 Tier B techniques are standalone polish for a final phase.

The primary risks are content quality drift across 29 technique entries authored sequentially, `technique-content.ts` growing to an unmaintainable 250KB+ if not split before content is added, and subtle Python API errors from deprecated matplotlib/seaborn calls. All three have clear preventive strategies rooted in the existing codebase and v1.9 case study milestone experience. Architectural risk is minimal: the entire target state mirrors a pattern already working in the same repo.

## Key Findings

### Recommended Stack

No new dependencies are needed. The existing stack — `astro-expressive-code@0.41.6` for Python syntax highlighting, `katex@0.16.33` (transitive via `rehype-katex`) for formula rendering, and TypeScript for content interfaces — is already installed, configured, and proven. The only code changes required are: (1) split `technique-content.ts` into per-category modules to prevent the file from becoming unmaintainable; (2) expand the `TechniqueContent` interface with 6 optional fields; (3) update `src/pages/eda/techniques/[slug].astro` to add formula and code slot rendering copied from the quantitative page template.

**Core technologies (all existing, zero new packages):**
- `astro-expressive-code@0.41.6`: Python code rendering — proven on quantitative pages, copy pattern directly into graphical `[slug].astro`
- `katex@0.16.33` (transitive via `rehype-katex`): Build-time formula rendering — proven on quantitative and distribution pages; must be imported in graphical `[slug].astro` frontmatter
- TypeScript interface extension: `TechniqueContent` grows from 5 to 11 fields, all new fields optional so existing 29 entries compile unchanged
- Astro named slots (`plot`, `description`, `formula`, `code`): All slots exist in `TechniquePage.astro` today; graphical pages use only `plot` and `description`; activating `code` slot follows quantitative page pattern exactly

**Optional hygiene improvement (low priority):** Add `katex` as a direct dependency (`npm install katex@^0.16.33`) to make the transitive import explicit. Three source files already import it directly. Not a blocker.

### Expected Features

The NIST/SEMATECH handbook defines a canonical page structure verified across 15+ technique pages. Features.md provides complete per-technique data for all 29 techniques: 95 question strings, 29 importance paragraphs, a full technique-to-case-study cross-reference matrix, ~40 formula blocks for 12 techniques, and Python library mappings for all 29 techniques.

**Must have (table stakes — NIST parity):**
- "Questions Answered" section (2-9 questions per technique) — present on all 29 NIST pages, entirely absent from site today
- "Importance" section (1-3 paragraphs) — present on ~25 of 29 NIST pages, entirely absent from site today
- Case Study cross-links — 10 case studies exist on site but are not linked from any of the 29 technique pages
- KaTeX formulas for 12 techniques that have them on NIST (~40 formula blocks total)
- Python code examples for all 29 techniques — quantitative pages already establish this pattern

**Should have (competitive differentiators):**
- Variant interpretation captions for 6 Tier B techniques (35 captions) — PlotVariantSwap shows labels only today
- Technique decision guidance ("When to use X instead of Y") — extends existing `relatedTechniques` with contextual guidance text

**Defer (v2+):**
- Client-side interactive plots (D3/Plotly) — contradicts static-first architecture; adds JS bundle; build-time SVG is the deliberate design
- Full NIST "Software" section (Dataplot/R code) — Dataplot is obsolete; Python examples replace it more valuably
- Exhaustive formula derivations — turns technique pages into textbook chapters; show 1-3 key formulas, link to NIST for full derivations
- Real NIST dataset downloads — licensing ambiguity; Python code using synthetic data demonstrates the same patterns

### Architecture Approach

The architecture change is purely additive. No new files, components, or modules are required. `technique-content.ts` is split into per-category modules (a mechanical refactor with zero behavior change). The `TechniqueContent` interface gains 6 optional fields. The graphical `[slug].astro` template expands from ~87 to ~160 lines by adding conditional section rendering and activating the existing `code` slot. `technique-renderer.ts`, `TechniquePage.astro`, and `techniques.json` remain completely unchanged.

**Major components and their roles:**
1. `TechniqueContent` interface (`technique-content/index.ts` after split) — data contract; 6 new optional fields follow the `QuantitativeContent` interface as the model
2. Per-category content modules (6 files, ~30-40KB each) — replaces the single 64KB `technique-content.ts`; maintains identical `getTechniqueContent()` API via barrel re-export
3. `[slug].astro` (graphical techniques page) — template; conditional rendering for 6 new sections plus `code` slot; built by copying `quantitative/[slug].astro` pattern
4. `TechniquePage.astro` — layout with all 5 named slots; unchanged; all required slots already exist
5. `technique-renderer.ts` — SVG generation; unchanged

**Key patterns to follow (all proven in existing codebase):**
- Optional field extension: new fields marked `?` so all 29 existing entries compile without modification
- Conditional slot rendering: `{content?.field && (...)}` guards as used throughout quantitative pages
- Collection-based cross-link resolution: store slugs in content, resolve to titles/URLs via `getCollection('edaPages')` at build time
- NIST section ordering: What It Is > Questions > Why It Matters > When to Use It > How to Interpret > Examples > Assumptions > Case Studies > Reference > (separate slot) Python Example

**Anti-patterns explicitly rejected:**
- Do not create a separate `TechniqueContentV2` or `TechniqueContentExtended` — extend the existing interface with optional fields
- Do not convert technique content to MDX files — TypeScript Record enforces structure across all 29 entries and enables programmatic access
- Do not use the `formula` slot for graphical technique formulas — that slot is reserved for quantitative pages; use `definitionExpanded` for inline math if needed on graphical pages
- Do not build a generic "section renderer" component — render sections directly in `[slug].astro`; 87 to 160 lines is still readable

### Critical Pitfalls

1. **`technique-content.ts` grows to 250KB+ and becomes unmaintainable** — The file is currently 64KB with 5 fields per technique. Adding 7+ new fields (including multiline Python code strings and formula arrays) pushes it to 200-280KB. At that size it is unnavigable, produces massive git diffs, and causes IDE lag. Split into per-category TypeScript modules BEFORE adding any content. Recommended grouping: time-series (5 techniques), distribution (8), comparison (6), multivariate (5), composite (2), regression (3).

2. **Python code examples use deprecated APIs** — `seaborn.distplot()` (removed in 0.14), `matplotlib vert=True` on boxplot (deprecated in 3.10), and `plt.acorr()` (wrong for NIST-equivalent output with confidence bounds) are the most common failure modes. Use `sns.histplot()`, `orientation='vertical'`, and `statsmodels.graphics.tsaplots.plot_acf` respectively. Create a grep-based validation script that runs against all code examples to catch deprecated patterns before commit.

3. **KaTeX CSS not loaded on formula pages (silent failure)** — `TechniquePage.astro` defaults to `useKatex={false}`. If the graphical `[slug].astro` does not pass `useKatex={true}` for formula-bearing techniques, formulas render as raw HTML spans with no styling. The fix is data-driven: `const useKatex = (content?.formulas?.length ?? 0) > 0;`. Hardcoding `useKatex={true}` for all 29 pages would load 350KB of KaTeX fonts on the 17 techniques that have no formulas — a Lighthouse performance penalty. The conditional pattern already exists in the codebase; use it.

4. **Content quality drifts across 29 techniques written sequentially** — At 30-60 minutes per technique, authoring all 29 is 15-30 hours of work. Without structure, the first 5 techniques get precise, NIST-verified descriptions and the last 5 get copy-paste templates. Process in categorical batches of 4-6 (time-series cluster first, then distribution, etc.), review each batch before starting the next, and use NIST source pages as the primary content driver rather than generating from memory.

5. **Case study cross-links go stale** — 29 technique pages linking to 10 case studies creates up to 290 cross-reference pairs. Store a centralized mapping (not inline strings per technique) and resolve at build time. Validate that every referenced slug corresponds to an actual MDX file in `src/data/eda/pages/case-studies/` as part of the Phase 5 verification pass. The most common failure mode is slug mismatch (e.g., `heat-flow` vs. `heat-flow-meter`).

## Implications for Roadmap

The natural phase structure follows the dependency graph from FEATURES.md: infrastructure before content, low-complexity content before medium-complexity, shared infrastructure before features that share it, and polish last. The content phases are ordered by risk and effort, not by technique count, to maximize early visible output and catch template issues before they propagate.

### Phase 1: Infrastructure Foundation
**Rationale:** Every subsequent phase depends on this. The file split must happen before content is added or the 250KB problem becomes a recovery task instead of a prevention. The template must be updated before any new sections render. The case study mapping infrastructure must exist before cross-links are authored. Measuring the build time baseline now prevents retroactive performance debugging later.
**Delivers:** `technique-content.ts` split into per-category modules (6 files, identical public API); `TechniqueContent` interface expanded with 6 optional fields; graphical `[slug].astro` updated with conditional section rendering and activated `code` slot; `getCollection('edaPages')` resolution added for case study cross-links; Python code template with version pins established; baseline build time recorded.
**Addresses:** All NIST parity features (prerequisite infrastructure)
**Avoids:** Pitfall 1 (file size — split first), Pitfall 3 (KaTeX CSS — data-driven `useKatex`), Pitfall 5 (stale cross-links — mapping infrastructure), Pitfall 6 (build regression — baseline measurement)
**Research flag:** NONE — all patterns proven in existing codebase; quantitative `[slug].astro` is the complete reference

### Phase 2: Content Depth — Questions, Importance, Case Study Links
**Rationale:** These three features are all LOW complexity (pure content authoring after Phase 1 infrastructure), deliver the highest value-to-effort ratio, and have zero dependencies on formulas or Python code. Together they triple the section count from 5 to 8 on every page and bring all 29 pages to NIST content parity on the prose dimensions. Completing them early validates the Phase 1 template changes with reviewable output before committing to the more complex authoring of formulas and Python examples.
**Delivers:** "Questions Answered" section for all 29 techniques (~95 question strings); "Importance" section for all 29 techniques (29 paragraphs); Case Study cross-links for ~22 of 29 techniques.
**Addresses:** FEATURES.md table stakes: Questions Answered (P1), Importance (P1), Case Study cross-links (P1)
**Avoids:** Pitfall 4 (content drift) — process in Tier B batch first (histogram, scatter-plot, normal-probability-plot, autocorrelation-plot, lag-plot, spectral-plot) then by category; Pitfall 5 (stale links) — validate slugs against actual MDX files per batch
**Research flag:** NONE — per-technique question inventory and importance themes are pre-researched and documented in FEATURES.md

### Phase 3: Technical Depth — Formulas and Python Code
**Rationale:** Formulas and Python code share the same two infrastructure additions to the `[slug].astro` template (the `katex` import and the `<Code>` import). Authoring them together avoids two separate template modification passes. These changes bring graphical pages to first-class technical parity with quantitative pages. Formulas are MEDIUM complexity (~40 KaTeX strings requiring `String.raw` and validated tex syntax for 12 techniques); Python code is MEDIUM complexity (29 self-contained examples using current, non-deprecated APIs).
**Delivers:** KaTeX formulas for 12 techniques (~40 formula blocks with labels and explanations); Python code examples for all 29 techniques (each self-contained with synthetic data, 20-35 lines); conditional `useKatex` loading working correctly.
**Uses:** `katex.renderToString()` with `String.raw` for tex strings; `<Code lang="python">` from `astro-expressive-code/components`
**Addresses:** FEATURES.md table stakes: Formulas/KaTeX (P1), Python Code Examples (P1)
**Avoids:** Pitfall 2 (deprecated APIs — grep validation before commit); Pitfall 3 (KaTeX CSS — computed from content.formulas.length); Pitfall 6 (build time — measure after completion against baseline + 5s budget)
**Research flag:** NONE — formula inventory per technique and Python library mappings are pre-researched and documented in FEATURES.md; quantitative pages provide the exact reference implementation

### Phase 4: Polish — Variant Interpretation Captions
**Rationale:** The 6 Tier B techniques (histogram, scatter-plot, normal-probability-plot, lag-plot, autocorrelation-plot, spectral-plot) already have PlotVariantSwap with labeled variants. Adding interpretation captions makes the variant comparisons pedagogically complete by explaining what each pattern means. This is isolated scope — changes to `PlotVariantSwap.astro` and the variant data structures only — with no dependencies on earlier content phases. Placed last because it is polish, not parity.
**Delivers:** 35 interpretation captions for 6 Tier B techniques; updated `PlotVariantSwap.astro` rendering; updated variant data structures in `technique-renderer.ts` to include `interpretation` field.
**Addresses:** FEATURES.md differentiator: Variant Interpretation Captions (P2)
**Avoids:** Pitfall 4 (content drift) — only 35 captions, small enough to review in one pass before committing
**Research flag:** NONE — straightforward component extension; 35 captions is reviewable scope

### Phase 5: Verification and Audit
**Rationale:** A dedicated verification phase prevents the milestone from shipping with systematic issues that per-page review misses. The v1.9 case study milestone found 5 broken cross-reference links only through a sweep. The PITFALLS.md "looks done but isn't" checklist defines 12 specific verification items across KaTeX CSS loading, Python API correctness, case study slug resolution, section ordering consistency, build time, and Lighthouse scores.
**Delivers:** All 29 graphical technique pages confirmed at full NIST section depth; Lighthouse 90+ on mobile verified for three representative pages (with formulas, without formulas, Tier B with variants); build time within baseline + 5 seconds; zero deprecated API patterns in Python examples; all case study cross-links resolve; section ordering consistent across all 29 pages.
**Avoids:** Every pitfall — this phase catches regressions that slipped through content phases
**Research flag:** NONE — verification checklist is fully defined in PITFALLS.md

### Phase Ordering Rationale

- Infrastructure before content: the file split and template update are prerequisites; doing content first in a single 250KB file makes the split a painful retroactive refactor rather than a clean structural decision.
- Questions/Importance/CaseStudyLinks before Formulas/Code: lower complexity validates the Phase 1 template with visible reviewable output at minimal risk; establishes authoring quality baseline before the more demanding KaTeX and Python authoring.
- Formulas and Python Code in the same phase: they share two lines of template infrastructure and the same content authoring session; separating them would require two template PRs where one suffices.
- Variant Captions last: isolated scope (6 techniques, 2 component files), polish not parity, benefits from all prior phases being stable.
- Dedicated verification phase: follows v1.9 experience where a sweep phase caught systematic issues invisible in per-page review.

### Research Flags

Phases requiring `/gsd:research-phase` during planning: NONE.

All five phases use well-documented, already-proven patterns from the existing codebase. The quantitative `[slug].astro` page is a complete reference implementation for Phases 2 and 3. The PITFALLS.md checklist provides a ready-made verification framework for Phase 5.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Interface extension and template update are mechanical changes; quantitative `[slug].astro` is the exact model
- **Phase 2:** Content authoring from NIST source; all question/importance data pre-inventoried in FEATURES.md
- **Phase 3:** Formula and code patterns copied from quantitative pages; full per-technique inventory in FEATURES.md
- **Phase 4:** Component extension following existing slot and data structure pattern
- **Phase 5:** Checklist-driven; 12 specific items defined in PITFALLS.md

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified from installed `node_modules` and working code in the same repo; zero new packages required; all three key capabilities (KaTeX, Code, slots) proven on quantitative pages |
| Features | HIGH | Sourced directly from NIST/SEMATECH handbook (15+ technique pages verified); complete per-technique question inventory, formula inventory, and Python library mappings documented |
| Architecture | HIGH | Based on direct codebase analysis of all relevant files; target state mirrors the existing quantitative page architecture exactly; no speculation required |
| Pitfalls | HIGH | Sourced from codebase file size analysis, matplotlib/seaborn changelogs for deprecated APIs, KaTeX documentation, and direct v1.9 case study milestone experience |

**Overall confidence:** HIGH

### Gaps to Address

- **Python example correctness for 5 unusual plot types:** Star/radar plot (no built-in matplotlib radar — requires polar axes and manual angle computation), complex demodulation (custom amplitude/phase extraction), DOE plots (3-panel custom layout), 4-plot, and 6-plot (specific subplot arrangements). These require careful authoring and should be run in a Python environment to verify before committing. FEATURES.md specifies the correct approach for each; execution correctness must be validated hands-on.

- **Exact case study slug verification:** The technique-to-case-study mapping in FEATURES.md and ARCHITECTURE.md is based on content analysis. Before implementing cross-links, verify every slug against actual MDX filenames in `src/data/eda/pages/case-studies/`. A pre-check during Phase 1 infrastructure setup saves time compared to catching mismatches in Phase 5 verification.

- **`technique-content.ts` split granularity:** PITFALLS.md offers two options — per-technique files (29 files) or per-category files (6 files). The per-category grouping is recommended for readability, but the exact category boundaries (which techniques belong together) should be confirmed by the developer who will own these files long-term before Phase 1 begins. The research suggests: time-series (autocorrelation, lag, run-sequence, spectral, complex-demodulation), distribution (histogram, box-plot, normal-probability, probability, qq, ppcc, weibull, box-cox-normality), comparison (bihistogram, block, bootstrap, youden, mean, std-deviation), multivariate (scatter, scatterplot-matrix, conditioning, contour, star), composite (4-plot, 6-plot), regression (linear-plots, box-cox-linearity, doe-plots).

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/pages/eda/quantitative/[slug].astro` — complete reference implementation for KaTeX + Code pattern on technique pages
- Existing codebase: `src/lib/eda/quantitative-content.ts` — `QuantitativeContent` interface model for `formulas` and `pythonCode` fields
- Existing codebase: `src/lib/eda/technique-content.ts` — current 5-field interface and 29 entries (64KB baseline); direct measurement of file size
- Existing codebase: `src/components/eda/TechniquePage.astro` — all 5 named slots confirmed; `useKatex` prop confirmed wired to conditional CSS loading
- Existing codebase: `src/layouts/EDALayout.astro` — conditional KaTeX CSS loading via `useKatex` prop confirmed
- Installed `node_modules/katex/package.json` — version 0.16.33 confirmed
- Installed `node_modules/astro-expressive-code/package.json` — version 0.41.6 confirmed
- NIST/SEMATECH e-Handbook Section 1.3.3 and 15+ individual technique pages — canonical section structure verified: https://www.itl.nist.gov/div898/handbook/eda/section3/eda33.htm

### Secondary (MEDIUM confidence)
- statsmodels `plot_acf` documentation — correct API for NIST-equivalent autocorrelation output with confidence bounds
- astro-expressive-code CHANGELOG — parallel-safe Shiki initialization confirmed since v0.38+; on-demand language loading verified

### Tertiary (applied from changelog research)
- Matplotlib 3.10 API changes — `vert` parameter deprecation on boxplot/bxp; replacement is `orientation='vertical'`
- Seaborn migration guide — `distplot` deprecated in 0.11, removed in 0.14; replacement is `histplot`

---
*Research completed: 2026-02-27*
*Supersedes: v1.9 SUMMARY.md (2026-02-26)*
*Ready for roadmap: yes*
