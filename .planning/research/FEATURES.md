# Feature Research: EDA Visual Encyclopedia

**Domain:** Interactive statistics education / modernized reference encyclopedia
**Researched:** 2026-02-24
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist on any modernized statistics reference site. Missing these means the pillar feels incomplete or amateurish compared to NIST's original, Seeing Theory, Khan Academy, or Stat Trek.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Filterable card grid landing page** | Every encyclopedia-style pillar on this site (Beauty Index, Database Compass) has a filterable grid. Users expect to browse and find techniques by category. The NIST handbook's plain hyperlink table of contents is exactly what we're replacing. | MEDIUM | Reuse `UseCaseFilter.tsx` / `LanguageFilter.tsx` pattern from db-compass/beauty-index. Filter by category (Graphical, Quantitative, Distribution, Case Study). Cards need thumbnail SVG preview, technique name, complexity indicator. Data attributes on cards, React island for filter toggle. |
| **Build-time SVG plot for every technique page** | The NIST handbook's static GIF/PNG plots are its most useful asset. Every technique page must show at least one representative plot rendered at build time. This is the visual in "Visual Encyclopedia." Without plots, it's just another text-heavy stats reference. | HIGH | 30 graphical technique pages each need at least one SVG plot computed from sample data at build time. Use Astro component pattern from `RadarChart.astro` -- pure SVG, zero client JS. Must handle diverse chart types: histograms, scatter plots, box plots, probability plots, autocorrelation plots, spectral plots, etc. This is the highest-effort table-stakes feature. |
| **KaTeX formula rendering** | Every quantitative technique and distribution page requires mathematical notation. Users of statistics references expect properly typeset formulas, not plain text or images of equations. Seeing Theory, R Psychologist, and every modern stats site uses LaTeX-rendered math. | LOW | KaTeX already works with `astro-expressive-code` and MDX. Add `remark-math` + `rehype-katex` to the Astro pipeline. Both inline `$...$` and display `$$...$$` math. Site already renders MDX blog posts; same pipeline. One-time config, then authors just write LaTeX in MDX files. |
| **Python code examples** | The NIST handbook uses Dataplot (obsolete). Modern practitioners use Python (pandas, matplotlib, scipy, numpy). Every quantitative technique and distribution page should show how to compute/plot the technique in Python. This is what makes the encyclopedia actionable, not just theoretical. | LOW | `astro-expressive-code` already handles syntax highlighting including Python. Each technique page includes a fenced code block with Python. No runtime execution needed -- static code display with copy button (expressive-code provides this). |
| **Technique categorization taxonomy** | The NIST handbook organizes EDA techniques into graphical techniques, quantitative techniques, and probability distributions. Users expect clear categorical navigation. Without taxonomy, 80+ pages feel like an undifferentiated blob. | LOW | Define categories in a TypeScript data file (like `use-case-categories.ts` in db-compass). Categories: Foundations, Graphical Techniques, Quantitative Techniques, Probability Distributions, Case Studies, Reference. Each technique tagged with one primary category and optional secondary tags (e.g., "location", "scale", "randomness", "normality"). |
| **Breadcrumb navigation** | With 86+ pages in a deep hierarchy (landing > category > technique), users need orientation. The site already has breadcrumbs on tool rule pages. NIST's handbook has breadcrumb-like navigation at the top of every page -- users expect this. | LOW | Reuse existing breadcrumb pattern from tool rule pages. `EDA Encyclopedia > Graphical Techniques > Histogram`. Astro component, no client JS. |
| **Cross-linking between related techniques** | The NIST handbook links related sections extensively (e.g., histogram page links to normal probability plot, box plot, run-sequence plot). Statistics techniques form a web of related concepts. Without cross-links, each page is an island. | LOW | Add `relatedTechniques: string[]` field to each technique's data entry (array of slugs). Render a "Related Techniques" section at the bottom of each page with card links. Similar to the `related.ts` pattern in dockerfile-analyzer rules. |
| **Responsive layout** | Mobile usage for reference sites is significant. NIST's handbook renders poorly on mobile (fixed-width tables, small images). A modern replacement must be mobile-first. | LOW | Tailwind CSS handles this. Build-time SVGs scale with `viewBox`. Existing site is fully responsive. No extra effort beyond using established patterns. |
| **SEO metadata per page** | 86+ individually indexed pages are the SEO powerhouse of this pillar (same strategy as the 67 K8s analyzer rule pages). Each page needs unique title, description, OG image, JSON-LD. | MEDIUM | Reuse `SEOHead.astro` pattern. Generate OG images at build time using `satori` (proven pattern). JSON-LD `Article` or `TechArticle` schema per page. Bulk generation script for OG images across 86 pages -- same approach as blog post OG images. |
| **Consistent page template** | Every technique page should follow a predictable structure: title, category badge, "What it is", "When to use it", visual plot, interpretation guide, formula (if applicable), Python code, related techniques. Users expect consistency across an encyclopedia. | MEDIUM | Create a single `EdaTechniquePage.astro` layout component. Props: technique data object. Sections conditionally render based on data presence. Similar to how `[slug].astro` works for blog posts but with more structured sections. |

### Differentiators (Competitive Advantage)

Features that set this apart from NIST's original handbook, Seeing Theory, Khan Academy, Stat Trek, and other statistics references. These are where the "Visual Encyclopedia" earns its name.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Interactive parameter explorers for probability distributions** | Seeing Theory's strongest feature is letting users drag sliders and watch distributions change in real time. The 19 distribution pages should each have a parameter explorer where users adjust mu, sigma, n, p, lambda, etc. and see the PDF/CDF update live. No existing static site does this with the depth of the NIST gallery (19 distributions vs Seeing Theory's ~12). This is the headline differentiator. | HIGH | D3.js client-side rendering in React islands. Each distribution page has an `InteractiveDistribution.tsx` component with parameter sliders. Render PDF + CDF curves. Use `jstat` or hand-coded distribution functions (most are straightforward math). This is Tier 3 interactivity (D3 dynamic rendering). Lazy-load D3 per-page to avoid bundle bloat. ~19 distribution components but share a common shell. |
| **SVG swap interactivity for graphical techniques** | Beyond static SVGs, users can toggle between different data scenarios on the same chart. E.g., histogram page shows "Normal", "Bimodal", "Skewed Right", "Skewed Left" via dataset selector buttons. The NIST handbook shows these as separate pages; we show them as instant swaps on one page. Distill.pub's "details-on-demand" pattern. | MEDIUM | Tier 2 interactivity. Pre-render multiple SVG variants at build time (one per dataset). Client-side JS swaps `display:none` / `display:block` on button click. Minimal JS, no D3 needed. Each graphical technique with multiple interpretive variants gets this treatment (~15 of the 30 graphical technique pages). Button bar component reusable across pages. |
| **Interpretation guides with annotated plots** | Every graphical technique page shows not just the plot but how to read it. Annotations on the SVG (arrows, callout labels, highlighted regions) that explain "this peak means X", "this tail indicates Y". NIST has text-only interpretation. Seeing Theory has no interpretation guidance. R Psychologist does this well but only for ~8 concepts. | MEDIUM | Build-time SVG annotations rendered as additional SVG elements (text, lines, arrows, colored regions). No client JS needed. Part of the SVG generation logic. Each annotated plot is a dedicated Astro component variant. ~20 pages get annotations. Design effort is moderate; code effort is low per annotation. |
| **"EDA 4-Plot" interactive diagnostic page** | The NIST handbook's 4-Plot (run-sequence, lag plot, histogram, normal probability plot) is its signature diagnostic tool. An interactive version where users paste their own data (CSV or space-separated) and see all 4 plots generated client-side would be a unique differentiator. No existing browser tool does this. | HIGH | React island with text input for data, D3 rendering of 4 plots simultaneously. CSV parsing (simple split). Shares distribution fitting logic with distribution pages. This is the "tool" differentiator that parallels the Dockerfile Analyzer / K8s Analyzer pattern on this site. URL state with `lz-string` for shareable 4-plots. |
| **Case studies with step-by-step EDA walkthrough** | The NIST handbook has 9 case studies (ceramic strength, heat flow meter, etc.) that walk through the full EDA process. Modernizing these with step-by-step narrative -- where each step reveals a new plot and interpretation -- creates a learning experience no static reference offers. | HIGH | 9 case study pages, each with 5-10 steps. Each step: narrative text + plot (build-time SVG) + interpretation. Use scroll-triggered section reveals (GSAP ScrollTrigger already in the site). Data for each case study is static (from NIST public domain datasets). Not true scrollytelling (too complex for static site), but step-based accordion/tab progression with animated reveals. |
| **Expandable formula tooltips** | KaTeX formulas with hover/click tooltips that explain each symbol. E.g., hovering over sigma shows "population standard deviation". Distill.pub pioneered this pattern. Reduces cognitive load for readers who know some but not all notation. | MEDIUM | Custom KaTeX macro that wraps symbols in `<span>` with tooltip data attributes. CSS tooltip on hover. Works with existing KaTeX pipeline. Define a symbol glossary once (sigma, mu, chi-squared, etc.) and reuse across all pages. ~50 symbols to define. No D3 or heavy JS needed. |
| **Technique comparison tables** | The NIST handbook organizes techniques "by problem category" (testing location, testing scale, testing normality, etc.). A comparison table showing which techniques apply to which problem category -- with links to each technique page -- provides a decision-making interface that no competitor offers as a structured, filterable reference. | LOW | Build-time rendered Astro component. Data: a matrix of techniques x problem categories (from NIST Section 1.3.4). Renders as a responsive table with checkmarks and links. Similar to the `FeatureMatrix.astro` in beauty-index. One page, one component. |
| **Distribution relationship diagram** | The NIST handbook Section 1.3.6.2 covers "Related Distributions" (e.g., chi-squared is sum of squared normals, t-distribution is normal/chi-squared ratio). A visual relationship diagram showing how the 19 distributions connect to each other is a unique reference artifact. | MEDIUM | Build-time SVG diagram (like the radar chart pattern). Nodes = distributions, edges = mathematical relationships. Static, not interactive. Could reuse dagre for layout or hand-position nodes in a meaningful arrangement. One component, one page section. Alternative: simple hand-crafted SVG if dagre is overkill for 19 nodes. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for a static-site statistics encyclopedia.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **In-browser Python/R execution** | "Let users run the code examples live." Jupyter-notebook-in-the-browser feeling. | Requires Pyodide (14MB+ WASM bundle) or server backend. Destroys page load performance. CSP complications. Maintenance burden of Python environment in browser. The code examples are illustrative, not computational -- users should run them locally. | Static code blocks with copy button (astro-expressive-code already does this). Link to a downloadable `.py` file or Jupyter notebook for each case study. |
| **User data upload for all techniques** | "Let users upload their own CSV data and see every plot applied to it." | Turns an encyclopedia into a data analysis tool. Scope explosion (parsing, error handling, outlier detection, axis scaling for arbitrary data). The 4-Plot interactive tool covers the most valuable use case; extending to all 30+ graphical techniques is 10x the effort for diminishing returns. | Provide the 4-Plot interactive tool as the "bring your own data" feature. All other technique pages use curated sample datasets that demonstrate the technique clearly. |
| **Real-time formula editing** | "Let users edit the formulas to try different parameter values." | KaTeX renders LaTeX strings; making formulas editable requires a LaTeX editor component, formula parsing, and parameter extraction. Massive scope for minimal educational value -- parameter exploration is better served by the distribution sliders. | Interactive parameter sliders on distribution pages (where parameter exploration matters). Static annotated formulas on technique pages (where the formula is the reference, not the exploration). |
| **Quiz/assessment system** | "Test comprehension with quizzes after each section." | Turns an encyclopedia/reference into a course. Different content architecture, different user intent. Users come to look up techniques, not take tests. CourseKata and Khan Academy already do this well. | Optional "Check your understanding" callout boxes with a question and expandable answer (pure HTML `<details>` element). No grading, no state, no backend. |
| **Multi-language support (i18n)** | "Translate the encyclopedia into Spanish, Chinese, etc." like Seeing Theory does. | 86+ pages x N languages = massive translation and maintenance burden. NIST content is English-only public domain. Translation quality for statistical terminology requires domain expertise. | English only. Formulas are universal. Python code is universal. If demand materializes, i18n can be added to the Astro pipeline later (Astro has i18n routing support). |
| **Animated plot transitions** | "Animate the histogram bars growing, the scatter points appearing, the distribution curves drawing." | GSAP/D3 animation on 80+ SVG plots is enormous scope. Most animations add visual polish but not educational value. The SVG swap feature (Tier 2) covers the valuable transitions (e.g., switching between data scenarios). Full animation is Distill.pub territory and requires per-plot choreography. | SVG swap for meaningful transitions (dataset changes). CSS `transition` on hover states for interactivity hints. Reserve D3 animation budget exclusively for the 19 distribution parameter explorers where animation directly serves comprehension. |
| **Dark mode SVG theming** | "SVG plots should respect dark/light theme toggle." | Every SVG uses hardcoded stroke/fill colors. Dynamic theming requires either CSS custom properties in SVG (limited browser support for external SVG) or rendering two variants of every plot. With 100+ SVGs, this doubles build-time rendering work. | Use a neutral color palette that works on both light and dark backgrounds. The site's `--color-surface` and `--color-text-primary` CSS variables work for page chrome; SVGs use a fixed palette with sufficient contrast on both themes (dark strokes on light fill, with a subtle background rect). Test contrast ratios once, apply consistently. |

## Feature Dependencies

```
[KaTeX Pipeline Config]
    |
    +--requires--> [Technique Page Template]
    |                   |
    |                   +--requires--> [Technique Data Model]
    |                   |                   |
    |                   |                   +--requires--> [Category Taxonomy]
    |                   |
    |                   +--requires--> [Build-time SVG Plots]
    |                                       |
    |                                       +--enhances--> [SVG Swap Interactivity]
    |                                       |
    |                                       +--enhances--> [Annotated Plot Variants]
    |
    +--enhances--> [Expandable Formula Tooltips]

[Category Taxonomy]
    |
    +--requires--> [Filterable Card Grid Landing Page]
    |
    +--requires--> [Technique Comparison Tables]

[Build-time SVG Plots]
    |
    +--enhances--> [Distribution Parameter Explorers] (D3 replaces static SVG)
    |
    +--enhances--> [4-Plot Interactive Diagnostic]
    |
    +--enhances--> [Case Study Walkthroughs]

[Cross-linking] --requires--> [Technique Data Model] (needs slug references)

[SEO Metadata] --requires--> [Technique Page Template] (needs page structure)

[Breadcrumbs] --requires--> [Category Taxonomy] (needs hierarchy)

[Distribution Relationship Diagram] --requires--> [Distribution Data Model]

[4-Plot Interactive] --conflicts--> [Early phases] (depends on histogram, lag plot,
    normal probability plot, and run-sequence plot SVG generators all being built first)
```

### Dependency Notes

- **Technique Page Template requires Technique Data Model:** The page template renders fields from the data model (title, category, formula, interpretation, related techniques). The data model must be defined before the template can be built.
- **Build-time SVG Plots require Technique Data Model:** Each plot is parameterized by sample data defined in the data model. The SVG generator functions consume data arrays and render chart-specific SVGs.
- **SVG Swap Interactivity enhances Build-time SVG Plots:** SVG swap is an overlay on static SVGs -- it pre-renders multiple variants and adds client-side toggle. Cannot exist without the base SVG generation capability.
- **Distribution Parameter Explorers replace Build-time SVG Plots:** On distribution pages, the static build-time SVG serves as the initial view (SSR fallback), and the D3 interactive version hydrates on top. The static SVG must exist first.
- **4-Plot Interactive conflicts with early phases:** The 4-Plot tool requires histogram, lag plot, normal probability plot, and run-sequence plot generators to all be implemented and tested. It cannot be built until all four underlying chart types are production-ready. Schedule it after all graphical technique pages are complete.
- **Filterable Card Grid requires Category Taxonomy:** The filter buttons correspond to taxonomy categories. The taxonomy must be defined before the grid can filter.
- **Expandable Formula Tooltips enhance KaTeX Pipeline:** Tooltips are a KaTeX macro layer on top of the base rendering pipeline. Base KaTeX must work first.

## MVP Definition

### Launch With (v1)

Minimum viable encyclopedia -- enough to demonstrate the concept and start generating SEO value.

- [ ] **Category taxonomy and technique data model** -- Foundation for all pages; defines the structure
- [ ] **Filterable card grid landing page** -- Entry point; first impression; reuses proven pattern
- [ ] **Technique page template** -- Consistent structure across all pages
- [ ] **KaTeX formula rendering** -- Required for quantitative technique and distribution pages
- [ ] **6 Foundations pages** -- EDA philosophy, assumptions; narrative content, minimal SVG
- [ ] **10 highest-value graphical technique pages with build-time SVGs** -- Histogram, box plot, scatter plot, normal probability plot, run-sequence plot, lag plot, autocorrelation plot, 4-plot, 6-plot, probability plot. These are the most-referenced techniques in the NIST handbook.
- [ ] **5 core quantitative technique pages** -- Measures of location, measures of scale, t-test, ANOVA, Anderson-Darling test. Cover the fundamentals.
- [ ] **5 core probability distribution pages** -- Normal, uniform, t, chi-squared, exponential. The five most commonly referenced distributions.
- [ ] **Python code examples on all technique/distribution pages** -- Static code blocks with copy button
- [ ] **Cross-linking between related techniques** -- "Related Techniques" section on each page
- [ ] **Breadcrumbs** -- Orientation within the hierarchy
- [ ] **SEO metadata** -- Title, description, OG images for launched pages

### Add After Validation (v1.x)

Features to add once the core encyclopedia pattern is proven and initial pages are live.

- [ ] **Remaining 20 graphical technique pages** -- Trigger: v1 pages are live and generating traffic
- [ ] **Remaining 13 quantitative technique pages** -- Trigger: v1 quantitative pages validated
- [ ] **Remaining 14 probability distribution pages** -- Trigger: distribution page template proven
- [ ] **SVG swap interactivity for graphical techniques** -- Trigger: static SVGs working; adds Tier 2 interactivity
- [ ] **Annotated plot variants** -- Trigger: base SVG plots stable; adds interpretation layer
- [ ] **Interactive parameter explorers for distributions** -- Trigger: all 19 distribution pages have static SVGs; add D3 layer
- [ ] **Expandable formula tooltips** -- Trigger: KaTeX rendering stable; symbol glossary defined
- [ ] **Technique comparison tables** -- Trigger: enough techniques to make comparison meaningful
- [ ] **4 Reference pages** -- Trigger: technique pages complete enough to reference

### Future Consideration (v2+)

Features to defer until the encyclopedia has meaningful traffic and validated user interest.

- [ ] **4-Plot interactive diagnostic tool** -- Defer because it requires all four chart types to be production-ready, CSV parsing, URL state, and is essentially a mini-tool. Build after the encyclopedia content is complete.
- [ ] **9 Case study walkthrough pages** -- Defer because step-by-step walkthroughs with scrollytelling-style reveals are the highest per-page effort. Build after technique pages prove the format.
- [ ] **Distribution relationship diagram** -- Defer because it requires all 19 distribution pages to exist for the links to work. Build as a capstone after all distribution pages are live.
- [ ] **Downloadable Python notebooks (.ipynb)** -- Defer because packaging executable notebooks requires additional tooling and maintenance. Only if user demand surfaces.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Filterable card grid landing page | HIGH | LOW | P1 |
| Build-time SVG plots (core 10) | HIGH | HIGH | P1 |
| KaTeX formula rendering | HIGH | LOW | P1 |
| Technique page template | HIGH | MEDIUM | P1 |
| Category taxonomy | HIGH | LOW | P1 |
| Python code examples | HIGH | LOW | P1 |
| Breadcrumbs | MEDIUM | LOW | P1 |
| Cross-linking | MEDIUM | LOW | P1 |
| SEO metadata per page | MEDIUM | MEDIUM | P1 |
| Foundations pages (6) | MEDIUM | LOW | P1 |
| SVG swap interactivity | HIGH | MEDIUM | P2 |
| Annotated plot variants | HIGH | MEDIUM | P2 |
| Remaining graphical techniques (20) | MEDIUM | HIGH | P2 |
| Remaining quantitative techniques (13) | MEDIUM | MEDIUM | P2 |
| Remaining distributions (14) | MEDIUM | MEDIUM | P2 |
| Interactive distribution explorers | HIGH | HIGH | P2 |
| Expandable formula tooltips | MEDIUM | MEDIUM | P2 |
| Technique comparison tables | MEDIUM | LOW | P2 |
| Reference pages (4) | LOW | LOW | P2 |
| 4-Plot interactive tool | HIGH | HIGH | P3 |
| Case study walkthroughs (9) | HIGH | HIGH | P3 |
| Distribution relationship diagram | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- defines the encyclopedia pattern and proves the concept
- P2: Should have, add incrementally -- expands content and adds interactivity layers
- P3: Nice to have, future consideration -- high-effort features that build on complete content

## Competitor Feature Analysis

| Feature | NIST Handbook | Seeing Theory | R Psychologist | Stat Trek | Khan Academy | Our Approach |
|---------|--------------|---------------|----------------|-----------|-------------|--------------|
| **Content scope** | Comprehensive: 33 graphical, 18 quantitative, 19 distributions, 9 case studies. The gold standard for EDA coverage. | Narrow: 6 chapters, 18 visualizations. Covers probability/inference, not EDA techniques. | Narrow: ~8 interactive visualizations. Effect size, power, CI, Bayes. | Broad: Dictionary-style entries for 100+ terms. Text-heavy, few visuals. | Broad: Full AP Statistics curriculum. Video-first, exercise-second. | Comprehensive like NIST (86+ pages) but modernized. Covers the full NIST Ch. 1 scope with visual-first presentation. |
| **Visual quality** | Poor: 1990s-era static GIFs. Small, pixelated, fixed-size. No responsive scaling. The content is authoritative but the presentation is 25 years behind. | Excellent: D3.js animations, smooth transitions, beautiful color palette. The benchmark for visual quality in statistics education. | Good: Clean D3 visualizations with academic aesthetic. Purposeful design, not decorative. | Poor: Minimal visuals. Occasional static images. Text-dominant. | Good: Polished video production. In-browser exercises have clean UI. | High: Build-time SVGs with consistent design language. Not animated (Seeing Theory territory) but crisp, responsive, and annotated. Distribution pages get D3 interactivity. |
| **Interactivity** | None. Completely static HTML. Users cannot interact with any visualization. The handbook is a reference document, not an interactive experience. | High: Every visualization has sliders, dropdowns, drag-and-drop. Interactivity is the core value proposition. But no code, no formulas, no "how to compute this." | High: Parameter sliders directly modify visualizations. Clear cause-effect feedback loops. Small scope but deep interaction. | None. Pure text reference with occasional formula images. | Medium: Video + practice exercises. Not interactive visualizations -- quiz-style interaction. | Three-tier: (1) Static SVG for all technique pages (zero JS), (2) SVG swap for dataset variants (minimal JS), (3) D3 interactive parameter explorers for distributions (full JS). Avoids Seeing Theory's "everything interactive" approach which limits content scope. |
| **Mathematical rigor** | High: Full formulas, parameter definitions, estimation methods. Written by NIST statisticians. The definitive reference. | Low: Formulas are minimal. Visual-first, math-second. Great for intuition, weak for reference. | Medium: Key formulas shown, but emphasis is on visual intuition over derivation. | High: Formulas present in entries. Text explanation of computation steps. | Medium: Videos explain concepts. Formulas shown but not the focus. | High: Full KaTeX formulas (matching NIST rigor), plus annotated tooltips that explain notation, plus Python code that makes formulas executable. The "show the math AND make it accessible" approach. |
| **Code examples** | Uses Dataplot (obsolete NIST-internal software). Completely unusable for modern practitioners. The biggest gap in the original handbook. | None. Visual-only. Users cannot see how to reproduce any visualization in code. | None in the visualizations. Blog posts have R code. | None. | None directly; separate computing exercises use JavaScript. | Python (pandas, matplotlib, scipy, numpy) on every technique and distribution page. Copy-button code blocks. This is the "actionable reference" differentiator that no competitor provides alongside visual explanation. |
| **Navigation** | Deep hierarchy with numbered sections (1.3.3.14.5). Hard to browse. No filtering. Must know what you're looking for or read sequentially. Table of contents is a wall of hyperlinks. | Clean 6-chapter structure. Easy to navigate but limited scope (18 pages total). No search or filtering needed because the content is small. | Simple list of ~8 tools. Tiny scope, trivially navigable. | Alphabetical dictionary + topic index. Good for lookup, bad for discovery. | Structured curriculum with progress tracking. Designed for sequential learning, not reference lookup. | Filterable card grid (proven pattern from Beauty Index/Database Compass). Filter by category, browse by card. Plus breadcrumbs, cross-links, and technique comparison tables. Designed for both sequential learning and random-access reference. |
| **Mobile experience** | Terrible. Fixed-width layout from 2003. Tables overflow. Images don't scale. Unusable on phones. | Good. Responsive D3 visualizations. Touch-friendly sliders. | Good. Responsive layout. Touch-friendly. | Adequate. Simple text renders fine on mobile. | Excellent. Native app and responsive web. | Excellent. Tailwind CSS responsive grid. Build-time SVGs scale with viewBox. Distribution sliders touch-friendly. Same pattern as existing mobile-optimized pillars. |
| **SEO value** | High (established .gov domain authority). But individual page titles are generic ("1.3.3.14 Histogram") and content is not structured for modern SEO. | Low. Single-page app. Search engines see one page, not 18 individual technique pages. | Medium. Individual pages exist but small scope. | High. Individual pages for each term. Good organic search traffic. | Very high. Massive domain authority. Videos in search results. | Very high. 86+ individually indexed pages with keyword-rich titles ("Histogram for EDA: Interpretation Guide with Python Examples"), JSON-LD structured data, OG images. Each page targets a specific long-tail search query. |
| **Case studies** | Excellent: 9 real-world case studies with actual NIST measurement data. The strongest pedagogical feature of the original. | None. | None. | None. | Some within curriculum flow. | Modernized versions of the NIST case studies (public domain data) with step-by-step walkthrough, modern Python code, and visual progression. Deferred to v2+ due to high per-page effort. |
| **Accessibility** | Poor. No ARIA labels, no alt text on images, no keyboard navigation for interactive elements. | Mixed. D3 visualizations lack screen reader support. Keyboard navigation limited. | Better. Some ARIA labels. Still D3-dependent. | Good for text content. Simple HTML renders well with screen readers. | Excellent. Major accessibility investment. | Good. Build-time SVGs get `role="img"` and `aria-label` (proven pattern from RadarChart.astro). KaTeX formulas have MathML fallback. Semantic HTML. Keyboard-navigable filters. Interactive distribution sliders need ARIA slider role. |

### Competitor Strengths to Learn From

**From Seeing Theory:** Parameter sliders on distribution pages are the gold standard for building statistical intuition. The dual PDF/CDF display with color differentiation (yellow PDF, orange CDF) is a design pattern worth adopting. Keep distribution explorers simple -- one distribution per page, 2-3 adjustable parameters, instant visual feedback.

**From R Psychologist:** Each visualization focuses on ONE concept and does it deeply. The "overlapping distributions" visualization for Cohen's d is referenced in hundreds of textbooks. Lesson: depth beats breadth for differentiator features. The 4-Plot interactive tool should aim for this level of polish on a single concept.

**From Distill.pub:** The five affordances framework (connecting to data, making systems playful, prompting self-reflection, personalizing reading, reducing cognitive load) provides design principles. Most relevant for this project: "reducing cognitive load" via expandable formula tooltips and "making systems playful" via parameter explorers. Key insight: interactivity should be deployed surgically where it enhances understanding, not everywhere.

**From the NIST handbook:** The content itself is exceptional. The systematic coverage (every technique has: purpose, definition, sample plot, interpretation, related techniques) is the structural template to follow. The weakness is purely presentational.

**From Khan Academy:** Progress tracking and sequential learning paths work for courses, not encyclopedias. Do NOT try to replicate this. The encyclopedia is a reference, not a curriculum.

### Competitor Weaknesses to Exploit

**NIST Handbook:** Obsolete presentation (1990s HTML), Dataplot software examples (nobody uses Dataplot), no mobile support, no interactivity, no modern code examples. This is the primary competitive gap we're filling.

**Seeing Theory:** Beautiful but shallow. Only 18 visualizations. No formulas. No code. No reference depth. Cannot function as a practitioner's reference. We provide depth.

**R Psychologist:** Tiny scope (8 visualizations). Focused on inference concepts, not EDA techniques. We provide breadth.

**Stat Trek:** Text-heavy, visually poor. Good reference structure but feels like reading a textbook from 2005. We provide visual-first presentation.

**Khan Academy:** Video-first format means you cannot quickly scan for a specific formula or technique. Encyclopedia format is faster for reference lookup. We provide scanability.

## Existing Site Dependencies

Features that leverage capabilities already built into the Astro portfolio site.

| Existing Capability | Location | How EDA Pillar Uses It |
|---------------------|----------|------------------------|
| Build-time SVG rendering | `RadarChart.astro`, `CompassRadarChart.astro` | Pattern for all EDA technique SVG plots. Astro frontmatter computes coordinates; template renders `<svg>`. Zero client JS. |
| Filterable card grid with React island | `UseCaseFilter.tsx`, `ModelCardGrid.astro` | Landing page filter. Data attributes on cards, React toggle buttons, DOM visibility sync. |
| Nanostore state management | `compassFilterStore.ts`, `languageFilterStore.ts` | Filter state for landing page. SVG swap state for Tier 2 interactivity. |
| SEO metadata pipeline | `SEOHead.astro`, `PersonJsonLd.astro`, `BlogPostingJsonLd.astro` | Per-page title, description, OG image, JSON-LD. |
| OG image generation | `satori` + `sharp` in `src/pages/open-graph/` | Bulk OG image generation for 86+ encyclopedia pages. |
| Expressive Code syntax highlighting | `astro-expressive-code` config in `astro.config.mjs` | Python code blocks with copy button on every technique page. |
| MDX content pipeline | `@astrojs/mdx`, `src/content.config.ts` | Content authoring for technique pages. KaTeX + code blocks + Astro components. |
| GSAP ScrollTrigger | `src/lib/scroll-animations.ts` | Animated section reveals on case study walkthrough pages. |
| lz-string URL state | `lz-string` in compose-validator/k8s-analyzer | URL state for 4-Plot interactive tool (shareable analysis links). |
| React islands with client:load | `DockerfileAnalyzer.tsx`, `K8sAnalyzer.tsx` | Interactive distribution explorers, 4-Plot tool, filter islands. |
| D3 (not yet installed) | -- | NEW DEPENDENCY: needed for distribution parameter explorers and 4-Plot tool. Not in current `package.json`. |

## Sources

### Primary (HIGH confidence)
- [NIST/SEMATECH e-Handbook of Statistical Methods Chapter 1](https://www.itl.nist.gov/div898/handbook/eda/eda.htm) -- Complete EDA chapter structure with 33 graphical techniques, 18 quantitative techniques, 19 probability distributions, 9 case studies. Public domain content.
- [NIST Detailed Table of Contents](https://www.itl.nist.gov/div898/handbook/dtoc.htm) -- Full hierarchical breakdown of all sections and subsections.
- [Seeing Theory](https://seeing-theory.brown.edu/) -- Brown University interactive probability/statistics platform. 6 chapters, 18 visualizations, D3.js-based.
- [Seeing Theory - Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) -- Parameter sliders for discrete/continuous distributions, PMF/PDF + CDF dual display.
- [Distill.pub: Communicating with Interactive Articles](https://distill.pub/2020/communicating-with-interactive-articles/) -- Five affordances of interactive articles: connecting to data, making playful, prompting reflection, personalizing, reducing cognitive load.
- [R Psychologist Visualizations](https://rpsychologist.com/viz/) -- Interactive D3.js statistics visualizations: Cohen's d, confidence intervals, statistical power, Bayesian inference.
- Existing codebase: `RadarChart.astro`, `ModelCardGrid.astro`, `UseCaseFilter.tsx`, `LanguageFilter.tsx` -- Proven build-time SVG, filterable card grid, and React island filter patterns.

### Secondary (MEDIUM confidence)
- [Awesome Explorable Explanations (GitHub)](https://github.com/blob42/awesome-explorables) -- Curated list of interactive explanations across domains.
- [KaTeX](https://katex.org/) -- Fast math typesetting library for the web. Confirmed SSR support.
- [D3.js Gallery](https://observablehq.com/@d3/gallery) -- Reference for chart type implementations in D3.
- [CourseKata](https://www.coursekata.org/) -- Interactive statistics textbook with simulation-based approach. Reference for quiz/assessment anti-feature decision.
- [OpenIntro: Introduction to Modern Statistics](https://www.openintro.org/book/ims/) -- Modern stats textbook with R tutorials. Reference for code example format.
- [Gabors Data Analysis Case Studies](http://gabors-data-analysis.com/casestudies/) -- 47 real-world case studies. Reference for case study walkthrough format.
- [Online Statistics Education (Rice University)](https://onlinestatbook.com/) -- Multimedia statistics course with simulations and demos.
- [Stat Trek](https://stattrek.com/) -- Free statistics tutorials and tools. Text-heavy reference format.
- [Khan Academy Statistics](https://www.khanacademy.org/math/statistics-probability) -- Video + exercise curriculum approach.
- [Scrollytelling Guide 2025](https://ui-deploy.com/blog/complete-scrollytelling-guide-how-to-create-interactive-web-narratives-2025) -- Design patterns for step-based narrative.

---
*Feature research for: EDA Visual Encyclopedia*
*Researched: 2026-02-24*
