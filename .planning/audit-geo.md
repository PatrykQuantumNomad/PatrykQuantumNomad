# GEO (Generative Engine Optimization) Audit Report

**Site:** https://patrykgolabek.dev/
**Date:** 2026-03-01
**Auditor:** QA Agent (Claude Opus 4.6)
**Scope:** Full site with focus on EDA Visual Encyclopedia (90+ pages), blog, and tools sections

---

## Executive Summary

This site has **exceptional foundational content** for GEO, particularly in the EDA Visual Encyclopedia section. The 90+ pages of NIST-sourced statistical content, with original SVG visualizations, computed statistics from real datasets, and Python code examples, represent a genuinely differentiated resource that AI search engines should find highly citable. The content quality is substantially above commodity Wikipedia-level explanations.

However, several structural and content-level gaps reduce the site's discoverability by generative engines. The primary issues are: (1) SVG visualizations lack sufficient text-based descriptions for AI consumption, (2) missing FAQ schema and Q&A-formatted content on high-traffic query pages, (3) technique pages use heading structures that are not optimized for snippet extraction, and (4) the `llms.txt` file, while comprehensive in listing, does not embed enough inline content for AI crawlers that do not follow links.

**Overall GEO Score: 7.2/10**

---

## 1. Citability Score Assessment

### 1.1 EDA Technique Pages (29 graphical + 18 quantitative)

**GEO Score: 8/10**

**Strengths:**

- Every technique page follows a consistent, comprehensive structure: "What It Is", "Questions This Plot Answers", "Why It Matters", "When to Use It", "How to Interpret", "Examples", "Assumptions and Limitations", "Formulas", "Python Example", and "Related Techniques" (`/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/eda/techniques/[slug].astro`, lines 108-220).
- Definitions are clear and quotable. For example, the histogram definition from `/Users/patrykattc/work/git/PatrykQuantumNomad/src/lib/eda/technique-content/distribution-shape.ts` directly answers "what is a histogram" in a single sentence suitable for AI extraction.
- The `questions` array on every technique is a GEO goldmine -- these are literally the queries users ask, formatted as bulleted lists that AI engines can extract directly. Example from autocorrelation-plot (`/Users/patrykattc/work/git/PatrykQuantumNomad/src/lib/eda/technique-content/time-series.ts`, lines 22-28): "Are the data random?", "Is an observation related to adjacent observations?", "Is the time series white noise, sinusoidal, or autoregressive?"
- NIST/SEMATECH attribution on every page (`nistReference` field) provides institutional credibility that AI engines weight heavily when evaluating source authority.
- Mathematical formulas rendered with KaTeX at build time (static HTML, no JS dependency) make formulas indexable by crawlers.
- Python code examples are complete, runnable scripts -- not pseudocode snippets. This is precisely what AI engines cite when answering "how to create a [technique] in Python."
- Case study cross-links via `caseStudySlugs` create bidirectional connections between technique and case study pages.

**Weaknesses:**

- **SVG visualizations have minimal textual descriptions.** The `aria-label` on technique page SVGs is generic: `${technique.title} statistical chart` (`[slug].astro`, line 102). AI engines cannot see the SVG content. There is no `<figcaption>` element and no paragraph describing what the specific plot shows (e.g., "This histogram of 200 observations shows a unimodal, approximately normal distribution centered near 50 with a standard deviation of approximately 8"). This is the single biggest GEO gap on technique pages.
- **No FAQ schema markup.** The "Questions This Plot Answers" section is semantically perfect for FAQPage JSON-LD but is not wrapped in schema. This is a missed opportunity for featured snippets and AI citations.
- **Definition paragraphs are long.** The `definition` and `definitionExpanded` fields often exceed 100 words, which is longer than optimal for snippet extraction. AI engines prefer a concise 1-2 sentence answer followed by expansion. The current structure puts both in the same "What It Is" section without a clear "quick answer" paragraph.
- **Variant visualizations (Tier B pages with PlotVariantSwap) have no text descriptions per variant.** The scatter plot page (`regression.ts`, lines 177-250) lists 12 variant examples with text descriptions in the "Examples" section, but these descriptions are disconnected from the actual SVG variant tabs. An AI crawler sees the examples text but cannot match it to a specific visualization.

### 1.2 Foundation Pages (6 pages)

**GEO Score: 9/10**

**Strengths:**

- The "What is EDA?" page (`/Users/patrykattc/work/git/PatrykQuantumNomad/src/data/eda/pages/foundations/what-is-eda.mdx`) is the strongest single page for GEO on the entire site. It directly answers the query "what is exploratory data analysis" with a clear numbered list of 7 goals in the opening section (lines 11-19). This format is ideal for AI extraction.
- The three-way comparison (Classical vs EDA vs Bayesian, lines 33-41) with a bullet-format comparison is highly citable for queries like "EDA vs classical statistics."
- The "When to Use Each Approach" section (lines 43-51) directly answers a common practitioner query.
- Cross-references at the bottom link to 5 related pages with descriptive anchor text.
- The "Underlying Assumptions" page (`assumptions.mdx`) structures the four assumptions with clear H3 headings, bold key terms, and "How to check" paragraphs with links to specific techniques. This matches how AI engines extract step-by-step guidance.
- The "4-Plot" foundations page (`the-4-plot.mdx`) lists 16 specific questions the 4-plot answers (lines 66-81) -- this numbered list is prime AI citation material.
- The "Role of Graphics" page includes Anscombe's Quartet with a custom SVG that has a detailed `aria-label` (`AnscombeQuartetPlot.astro`, line 138): "Anscombe's Quartet: four scatter plots with identical summary statistics but very different visual patterns."

**Weaknesses:**

- The opening of "What is EDA?" could benefit from a single bold definition sentence before the numbered list. Currently the first sentence is "Exploratory Data Analysis (EDA) is an approach and philosophy for data analysis that employs a variety of techniques (mostly graphical) to:" -- this is good but could be more directly quotable with a shorter, punchier lead.
- No FAQ schema on any foundation page despite the Q&A-heavy content.

### 1.3 Case Study Pages (10 pages)

**GEO Score: 8.5/10**

**Strengths:**

- The Ceramic Strength case study (`/Users/patrykattc/work/git/PatrykQuantumNomad/src/data/eda/pages/case-studies/ceramic-strength.mdx`) is a reference-quality worked example at 390+ lines. It includes: background, study design, ANOVA model with rendered math, 4-plot analysis with interpretation, batch effect analysis with bihistogram/box plot/Q-Q plot/block plots, statistical tests (F-test for equal variances, two-sample t-test) with full parameter tables, DOE mean and SD plots by batch, interaction effects, ranked effect tables, and a multi-paragraph interpretation synthesis. This level of depth is rare outside textbooks.
- Every case study uses real NIST datasets (e.g., JAHANMI2.DAT, RANDU.DAT) with computed statistics that can be independently verified. This factual verifiability is a strong authority signal for AI engines.
- Statistical test results are presented in structured markdown tables with exact values (e.g., "F = 1.123", "T = 13.3806"), which AI engines can quote directly.
- The Uniform Random Numbers case study (`uniform-random-numbers.mdx`) includes a Test Summary table (lines 228-236) that maps each assumption to a specific test, statistic, critical value, and result. This is the ideal format for AI extraction on queries like "how to test if data is normally distributed."
- Conclusions sections use numbered priority lists (Ceramic Strength, lines 378-389) with bold lead-ins, making the key findings scannable and quotable.

**Weaknesses:**

- Case study pages have many SVG visualizations (4-plots, bihistograms, box plots, etc.) rendered via custom Astro components (e.g., `CeramicStrengthPlots`, `UniformRandomPlots`) but these components likely generate SVGs with minimal alt text or figcaptions. AI engines will miss the visual evidence that the prose references.
- No structured data (JSON-LD) specifically for the dataset provenance. Adding `schema.org/Dataset` markup linking to the NIST source data would strengthen the authority signal.

### 1.4 Distribution Pages (19 pages)

**GEO Score: 7.5/10**

**Strengths:**

- Each distribution has structured JSON data (`/Users/patrykattc/work/git/PatrykQuantumNomad/src/data/eda/distributions.json`) with PDF formula, CDF formula, mean, variance, parameters, related distributions, NIST section reference, and description.
- Interactive D3 distribution explorers with parameter sliders are a genuine differentiator -- no other free resource offers this for all 19 NIST distributions.
- The `aria-label` attributes on distribution charts are descriptive: `${distribution.title} ${discrete ? 'PMF' : 'PDF'} curve` and `${distribution.title} CDF curve` (`distributions/[slug].astro`, lines 102-106).
- Related distributions cross-linking creates a distribution "knowledge graph" that AI engines recognize as topical authority.

**Weaknesses:**

- The `description` field in distributions.json is a single sentence (e.g., Normal: "The normal (Gaussian) distribution is the most important continuous probability distribution, characterized by its symmetric bell-shaped curve..."). This is too brief to serve as the definitive answer for "what is the normal distribution." There is no extended prose section on distribution pages comparable to the technique pages' "What It Is", "When to Use It", etc.
- Missing: "When to use this distribution" content, real-world application examples, and relationship to statistical tests. For instance, the Chi-Square distribution page should explain its role in chi-square tests, goodness-of-fit testing, and confidence intervals for variance -- queries that students and practitioners commonly ask AI engines.
- The related distributions reference page (`/Users/patrykattc/work/git/PatrykQuantumNomad/src/data/eda/pages/reference/related-distributions.mdx`) was not examined in full but its existence is good for cross-linking.

### 1.5 Reference Pages (4 pages)

**GEO Score: 7/10**

**Strengths:**

- The "Techniques by Category" page (`techniques-by-category.mdx`) is a well-organized taxonomy table mapping techniques to types and purposes. This directly serves queries like "list of EDA techniques" or "what EDA technique should I use for..."
- The "Analysis Questions" page (`analysis-questions.mdx`) maps 7 standard EDA questions to key techniques -- excellent for AI queries structured as "how to [check randomness/test normality/detect outliers]."
- Distribution tables (`distribution-tables.mdx`) provide standard critical value tables for Normal, t, Chi-Square, and F distributions. These are frequently queried reference values.
- The "Recommended Workflow" (analysis-questions.mdx, lines 44-49) is a numbered 5-step procedure that AI engines can cite for "EDA workflow" or "how to do exploratory data analysis."

**Weaknesses:**

- Critical value tables use plain text notation (`z_alpha`, `t_0.05`) rather than rendered math. While functional, rendered KaTeX would improve readability and could be extracted more precisely by AI engines.
- The "Using These Tables" section (distribution-tables.mdx, lines 71-76) is only 4 bullet points. Expanding this with examples ("For a two-tailed 5% test with 20 degrees of freedom, use t_0.025,20 = 2.086") would make it more citable.

### 1.6 Blog Posts (8 posts)

**GEO Score: 6.5/10**

**Strengths:**

- The EDA Visual Encyclopedia blog post (`eda-visual-encyclopedia.mdx`) is 114 lines of substantive content that serves as both an introduction to the encyclopedia and a standalone article on why EDA matters. The "Why EDA Still Matters in the Age of AI" section (lines 94-102) is timely and would be highly citable for queries like "is EDA still relevant with machine learning."
- The Kubernetes Observability post (`building-kubernetes-observability-stack.mdx`) directly addresses "how to build a Kubernetes observability stack" with specific tool recommendations and architecture diagrams.
- Blog posts use structured components (Lede, TldrSummary, Callout, Figure, ToolCard) that produce well-formatted, readable HTML.
- Posts have proper `publishedDate`, `tags`, and cover images for OG metadata.

**Weaknesses:**

- Only 8 blog posts for a site of this scale. The tools section has 3 major tools (Dockerfile Analyzer, Compose Validator, K8s Analyzer) with 159 individual rule pages but limited long-form explanatory content.
- Blog posts do not include FAQ schema or explicit Q&A sections.
- The Kubernetes posts link to external blogs (Translucent Computing, Kubert AI) rather than building all content on this domain. For GEO, owned content is more valuable than outbound links.

### 1.7 Tools Section

**GEO Score: 6/10**

**Strengths:**

- Each tool has a clear title and description in the page `<title>` and meta description (e.g., K8s Analyzer: "Free online Kubernetes YAML validator and linter. 67 rules for security, reliability, and best practices. 100% browser-based, your code never leaves your device." -- `k8s-analyzer/index.astro`, line 10).
- Individual rule pages (159 total across 3 tools) create long-tail content for specific Kubernetes/Docker best practices queries.
- "100% client-side" is a differentiator and trust signal.

**Weaknesses:**

- Tool landing pages are primarily interactive React components (`client:only="react"`) with minimal server-rendered content. AI crawlers will see very little text content on these pages.
- No "How to use" or "What this tool checks" prose sections visible to crawlers before the React component loads.
- Missing comparison content ("Kubernetes manifest validator vs. kubeval vs. kube-score") that would capture AI search queries comparing tools.

---

## 2. Query-Content Alignment

### Target Query Assessment

| Query | Has Content? | Directly Answers? | Citability | Notes |
|-------|-------------|-------------------|------------|-------|
| "what is exploratory data analysis" | Yes | Yes (9/10) | High | `what-is-eda.mdx` opens with a clear definition + 7-point numbered list |
| "histogram interpretation" | Yes | Yes (8/10) | High | `distribution-shape.ts` histogram entry has `interpretation` field. Heading is "How to Interpret" not "Histogram Interpretation" |
| "normal probability plot how to read" | Yes | Yes (8/10) | High | `distribution-shape.ts` normal-probability-plot has detailed interpretation guidance |
| "EDA techniques list" | Yes | Yes (9/10) | High | `techniques-by-category.mdx` is a complete taxonomy table; landing page card grid also serves this |
| "box plot vs histogram" | Partial | No (4/10) | Low | Both techniques have individual pages but there is NO comparison page. This is a significant gap. |
| "Kubernetes security best practices" | Partial | Partial (5/10) | Medium | K8s Analyzer has 67 rules but no prose article on "Kubernetes security best practices" |
| "Patryk Golabek" | Yes | Yes (8/10) | High | Homepage bio, PersonJsonLd schema, About page, llms.txt all provide personal brand signals |
| "what is a scatter plot" | Yes | Yes (8/10) | High | `regression.ts` scatter-plot definition is clear and quotable |
| "how to check if data is normally distributed" | Yes | Yes (8/10) | High | `assumptions.mdx` "Fixed Distribution" section + technique pages for probability plot, Anderson-Darling |
| "autocorrelation plot interpretation" | Yes | Yes (9/10) | High | `time-series.ts` autocorrelation-plot has extensive interpretation with variant descriptions |
| "Weibull plot reliability engineering" | Yes | Yes (8/10) | High | `combined-diagnostic.ts` weibull-plot connects reliability concepts to shape parameter interpretation |
| "ANOVA assumptions" | Partial | No (3/10) | Low | No dedicated ANOVA page with assumption discussion; mentioned in passing in case studies |
| "bootstrap confidence interval" | Yes | Yes (7/10) | Medium | `distribution-shape.ts` bootstrap-plot has formula and explanation but no dedicated step-by-step guide |
| "chi-square distribution table" | Yes | Yes (8/10) | High | `distribution-tables.mdx` has a complete table |

---

## 3. Source Authority Signals

**GEO Score: 8.5/10**

### Positive Authority Signals

1. **NIST/SEMATECH attribution** -- Every technique page, case study, and distribution page cites the specific NIST handbook section. The JSON-LD structured data (`EDAJsonLd.astro`, lines 28-33) includes `isBasedOn` pointing to the NIST handbook URL. This is a strong academic credibility signal.

2. **Original computed statistics** -- Case studies compute exact statistics from real NIST datasets (e.g., Ceramic Strength: F = 1.123, T = 13.3806, means of 688.9987 and 611.1559). These are not estimates or approximations -- they are computed from the actual `.DAT` files in `handbook/datasets/`.

3. **Technical depth** -- Formulas are rendered with KaTeX (not images), code examples are complete and runnable, and interpretation guidance goes beyond surface-level explanations. The autocovariance function formula (`time-series.ts`, line 75), the Weibull CDF linearization (`combined-diagnostic.ts`, line 92), and the PPCC definition (`combined-diagnostic.ts`, line 34) demonstrate graduate-level statistical literacy.

4. **Author credibility** -- PersonJsonLd on homepage, 17+ years experience in hero text, "former CTO" mentioned in `llms.txt` line 31. The `llms.txt` has a dedicated "Authority" section (lines 27-34).

5. **Schema.org structured data** -- TechArticle + LearningResource dual-typing on every EDA page (`EDAJsonLd.astro`, line 75), Dataset schema on the landing page (line 39), BreadcrumbJsonLd on all pages, FAQPageJsonLd component exists (used on index, about, and other pages).

6. **CC-BY 4.0 license** -- Explicitly stated in `llms.txt` line 219, signaling that content is freely citable.

### Gaps

1. **No external citations beyond NIST.** The EDA content references Tukey (1977), Granger (1964), and Anscombe (1973) by name but does not link to DOIs, Google Scholar entries, or publisher pages. Adding these would strengthen the academic authority chain.

2. **No "cited by" or testimonial signals.** If any external resource links to or references this site, surfacing those backlinks would build E-E-A-T.

3. **No dateModified tracking per page.** All EDA pages use a fixed `datePublished: 2026-02-25` and `dateModified: 2026-02-25` (`EDAJsonLd.astro`, lines 79-80). AI engines favor fresh content; updating `dateModified` when content is revised would signal ongoing maintenance.

---

## 4. Content Uniqueness & Differentiation

**GEO Score: 8/10**

### What This Site Offers That Wikipedia/Investopedia/Khan Academy Do Not

1. **Build-time SVG visualizations** -- Every technique page has an original, inline SVG generated from realistic data at build time. These load instantly, work without JavaScript, and are indexed by search engines. No other free EDA reference generates technique-specific visualizations for all 29 graphical techniques.

2. **Interactive distribution explorers** -- 19 distributions with real-time D3 PDF/CDF rendering via parameter sliders. Wikipedia shows static images; this site lets users explore parameter sensitivity interactively.

3. **Complete case studies with real NIST data** -- 10 case studies with full 4-plot analyses, statistical tests, ranked effect tables, and multi-paragraph interpretations. These are not toy examples -- they use the same datasets that NIST published for their handbook.

4. **Python code for every technique** -- Complete, runnable Python scripts with matplotlib/scipy that reproduce the visualizations. Most references either show R code only or provide incomplete snippets.

5. **Consistent cross-linking** -- Every technique page links to relevant case studies (`caseStudySlugs`), related techniques (`relatedTechniques`), and is referenced from the taxonomy page. This interconnection creates a topic cluster that AI engines recognize.

6. **Variant visualizations** -- Tier B technique pages (autocorrelation, scatter plot, lag plot, spectral plot, histogram, box plot, normal probability plot, probability plot, 4-plot) show multiple example patterns (e.g., scatter plot shows 12 variants: strong positive, strong negative, quadratic, exponential, heteroscedastic, etc.). This directly serves queries like "what does a heteroscedastic scatter plot look like."

### Uniqueness Gaps

1. **SVG content is invisible to AI.** The visualizations are the primary differentiator, but AI search engines cannot "see" them. There is no `<figcaption>` describing what each plot shows, no alt text beyond the generic title, and no text-based description that mirrors the visual content. This is the most impactful GEO gap on the site.

2. **No comparison pages.** Queries like "box plot vs histogram", "EDA vs classical analysis", "Anderson-Darling vs Kolmogorov-Smirnov", "scatter plot vs correlation coefficient" have no dedicated content. These comparison queries are heavily targeted by AI engines.

3. **No "cheat sheet" or "quick reference" content.** A single-page EDA cheat sheet mapping common questions to techniques would be extremely citable by AI engines looking for concise decision-making content.

---

## 5. Snippet Optimization

**GEO Score: 6.5/10**

### What Works

- **Numbered lists** -- Foundation pages use numbered lists effectively (what-is-eda.mdx lines 11-19: 7 EDA goals; the-4-plot.mdx lines 66-81: 16 questions).
- **Comparison tables** -- Reference pages use markdown tables with clear headers (techniques-by-category.mdx, analysis-questions.mdx, distribution-tables.mdx).
- **"Questions This Plot Answers" sections** -- These are essentially pre-formatted FAQ content on every technique page.
- **Bold conclusions** -- Case study statistical test results use bold "Conclusion:" labels (ceramic-strength.mdx, line 163: `**Conclusion:** F = 1.123 falls within the acceptance region...`).

### What Needs Improvement

1. **Missing "X is Y" definition pattern at the very top of technique pages.** The rendered technique page shows the title as H1, then the NIST section reference, then the SVG plot, and only THEN the "What It Is" section. The definition text is buried below the fold and below a non-text SVG. For snippet extraction, the first visible text should be a concise definition.

2. **No explicit "How to" headings.** AI engines strongly favor content under headings like "How to Read a Histogram", "How to Interpret a Box Plot", "How to Create a Scatter Plot in Python." The current headings are "How to Interpret" (generic, not query-matched) and "Python Example" (not "How to Create X in Python").

3. **No step-by-step procedures.** The "Recommended Workflow" in analysis-questions.mdx (lines 44-49) is a rare example of a numbered procedure. Most technique pages describe interpretation as prose paragraphs rather than ordered steps. A "Step-by-Step Interpretation" section with numbered steps would be much more citable.

4. **"When to Use" vs "When Not to Use" pattern.** The current "When to Use It" sections describe appropriate use cases. Adding a brief "When NOT to use it" or "Limitations" at the same prominence would capture queries like "when not to use a box plot."

5. **No summary/TL;DR boxes.** Blog posts use `TldrSummary` and `Callout` components but EDA pages do not. A "Key Takeaway" box at the top of each technique page (e.g., "A histogram bins continuous data into intervals and displays frequencies as bars. Use it as the first step to understand distribution shape.") would serve both UX and GEO.

---

## 6. Multi-Modal Content Signals

**GEO Score: 5.5/10**

### SVG Alt Text / ARIA Labels

- Technique page SVGs: `aria-label="${technique.title} statistical chart"` -- too generic. Does not describe what the specific plot shows.
  - File: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/eda/techniques/[slug].astro`, line 102.
- Distribution page SVGs: `aria-label="${distribution.title} PDF curve"` and `aria-label="${distribution.title} CDF curve"` -- slightly better but still generic.
  - File: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/eda/distributions/[slug].astro`, lines 102-106.
- Anscombe's Quartet: `aria-label="Anscombe's Quartet: four scatter plots with identical summary statistics but very different visual patterns"` -- this is an example of GOOD aria-label usage.
  - File: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/eda/AnscombeQuartetPlot.astro`, line 138.
- Landing page hero: `aria-label="4-Plot diagnostic diagram -- run sequence, lag plot, histogram, and normal probability plot"` -- good.
  - File: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/eda/index.astro`, line 181.
- PlotVariantSwap variants: `aria-label="${techniqueTitle} -- ${v.label} chart"` -- good, includes the variant name.
  - File: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/eda/PlotVariantSwap.astro`, line 50.

### Figure Captions

- **No `<figcaption>` elements on any EDA technique page SVG.** This is a significant gap. Every SVG should have a caption describing what the visualization shows, not just what type of plot it is.
- Blog posts use the `Figure` component which includes `caption` props (e.g., `building-kubernetes-observability-stack.mdx`, lines 34-37).

### Text Descriptions Mirroring Visualizations

- The case study pages do a good job of this. Ceramic Strength describes what each plot shows in prose before displaying it (e.g., "The bihistogram compares the distributions of Batch 1 and Batch 2... Batch 1 responses are centered at approximately 689, while Batch 2 responses are centered at approximately 611").
- Technique pages do NOT do this. The SVG is displayed first, then the "What It Is" prose follows. There is no text saying "The above histogram shows 200 observations from a normal distribution centered at 50..."

### Code Examples

- Python code examples include comments (`# Generate bivariate data with positive correlation`, `# Monthly data -- location shifts after month 6`). These are adequate but not exceptional.

---

## 7. Interconnection & Topic Cluster Strength

**GEO Score: 8/10**

### Hub-and-Spoke Structure

The EDA Visual Encyclopedia has a clear hub-and-spoke architecture:

- **Hub:** `/eda/` landing page with filterable card grid linking to all 90+ pages.
- **Spokes:** Technique pages, distribution pages, case studies, foundations, reference.
- **Cross-links:** Techniques link to related techniques, case studies link to techniques used, foundations link to techniques, reference pages provide taxonomy links.

### Bidirectional Linking Assessment

| Link Direction | Implemented? | Quality |
|----------------|-------------|---------|
| Technique -> Related Techniques | Yes | Good (via `relatedTechniques` array in techniques.json) |
| Technique -> Case Studies | Yes | Good (via `caseStudySlugs` in technique-content/*.ts) |
| Case Study -> Techniques | Yes | Excellent (extensive inline links in MDX, e.g., ceramic-strength.mdx has 20+ technique links) |
| Foundation -> Techniques | Yes | Good (what-is-eda.mdx links to histogram, scatter plot, box plot, 4-plot, run sequence plot) |
| Foundation -> Foundation | Yes | Good (assumptions.mdx links to when-assumptions-fail.mdx and vice versa) |
| Reference -> Techniques | Yes | Excellent (techniques-by-category.mdx and analysis-questions.mdx link to every technique) |
| Technique -> Foundation | Partial | Some techniques reference foundations but not consistently |
| Distribution -> Technique | Partial | Related distributions cross-link but distributions do not link to the statistical tests that use them |
| Blog -> EDA | Yes | Good (eda-visual-encyclopedia.mdx links extensively to EDA pages) |
| EDA -> Blog | No | EDA pages do not link back to blog posts |

### Gaps

1. **Distribution pages are weakly connected to the rest of the encyclopedia.** They link to related distributions but not to the statistical tests, techniques, or case studies that use them. For example, the Normal Distribution page should link to the Normal Probability Plot technique page and the Anderson-Darling test.
2. **No EDA -> Blog linking.** The EDA Visual Encyclopedia blog post is a good landing page but no technique or case study page links back to it.
3. **Index pages exist for each section** (`/eda/techniques/index.astro`, `/eda/foundations/index.astro`, etc.) which provide good section-level hubs.

---

## 8. llms.txt & AI Discovery

**GEO Score: 7.5/10**

### llms.txt Assessment

File: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/llms.txt.ts`

**Strengths:**

- Comprehensive listing of all site sections: Authority, Expertise Areas, Pages, Key Projects, Interactive Tools, Beauty Index, Database Compass, EDA Visual Encyclopedia (with subsections for Graphical Techniques, Quantitative Methods, Distributions, Foundations, Case Studies, Reference), Blog Posts, External Profiles.
- Each entry includes the page title, URL, and description.
- "How to Cite" section (lines 207-219) with specific citation examples -- this is excellent and directly instructs AI engines on how to attribute content.
- CC-BY 4.0 license declaration.
- Link to `llms-full.txt` for expanded content.

**Weaknesses:**

1. **No inline content.** Every EDA entry is a title + URL + one-line description. An AI crawler that reads only `llms.txt` (without following links) gets no actual technique definitions, case study findings, or distribution formulas. For maximum GEO impact, the `llms.txt` should embed at least the definition and key finding for each page.
2. **EDA descriptions are from techniques.json, not from the technique-content modules.** The descriptions are short metadata strings (e.g., "A scatter plot displays the relationship between two quantitative variables...") rather than the richer definitions from technique-content. The llms-full.txt likely includes more content but the standard llms.txt should have enough to be useful standalone.
3. **Missing "EDA how-to cite" examples.** The "How to Cite" section has examples for Beauty Index, Database Compass, Tools, and a generic EDA example, but no technique-specific citation example (e.g., "According to the Histogram page (patrykgolabek.dev/eda/techniques/histogram/), a histogram bins continuous data...").

### llms-full.txt Assessment

File exists (`/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/llms-full.txt.ts`) but was only partially read. Its existence and linking from `llms.txt` is good practice.

### Additional AI Discovery Signals

- `<link rel="alternate" type="text/plain" href="/llms.txt">` and `<link rel="alternate" type="text/plain" href="/llms-full.txt">` in Layout.astro (lines 112-113) -- correctly signals to AI crawlers.
- No `robots.txt` restriction on AI crawlers was observed.
- No `sitemap.xml` was examined but Astro generates one by default.

---

## 9. Missing GEO Opportunities

### High-Impact Missing Content

1. **Comparison pages** (estimated impact: HIGH)
   - "Box Plot vs Histogram" -- one of the most common EDA queries
   - "EDA vs Classical Analysis" -- directly answerable from existing foundation content
   - "Anderson-Darling vs Kolmogorov-Smirnov Test" -- frequently asked when choosing a normality test
   - "Scatter Plot vs Correlation Coefficient" -- visual vs quantitative approaches
   - "Mean vs Median: When to Use Which" -- fundamental question with nuanced answer
   - "Parametric vs Non-parametric Tests" -- gateway to the quantitative methods section

2. **FAQ page for the EDA section** (estimated impact: HIGH)
   - Aggregate the "Questions This Plot Answers" from all technique pages into a single FAQ page with FAQPage JSON-LD schema
   - Questions like "How do I check if my data is normally distributed?", "What EDA technique should I use first?", "How do I detect outliers?", "What is the 4-plot?", "How to interpret a probability plot?"
   - This single page could capture dozens of informational queries

3. **"How to" landing pages** (estimated impact: MEDIUM-HIGH)
   - "How to Do Exploratory Data Analysis: Step-by-Step Guide" -- the "Recommended Workflow" content exists in analysis-questions.mdx but deserves its own page
   - "How to Check Statistical Assumptions" -- expand the assumptions.mdx content into a practical guide
   - "How to Create EDA Plots in Python" -- aggregate all Python code examples into a single reference

4. **Beginner-friendly entry points** (estimated impact: MEDIUM)
   - "EDA for Data Scientists: A Practical Guide" -- the existing content is expert-level; a beginner summary would capture a much larger audience
   - "EDA Cheat Sheet" -- a single-page reference mapping common questions to techniques and tools
   - "Which EDA Plot Should I Use?" -- a decision flowchart page

5. **Missing Kubernetes/DevOps content** (estimated impact: MEDIUM)
   - "Kubernetes Security Best Practices" -- the K8s Analyzer has 67 rules but no long-form article synthesizing the security rules into prose
   - "Dockerfile Best Practices" -- a standalone blog post exists but tool-to-prose content is thin
   - "Docker Compose Best Practices" -- same pattern

6. **"What is [distribution name]" pages with prose** (estimated impact: MEDIUM)
   - Distribution pages have interactive explorers but minimal prose. Adding 200-300 words of "What is the [X] distribution, when is it used, and what are its key properties" would capture a large volume of informational queries.

---

## 10. Priority Matrix

### Quick Wins (Low effort, High impact -- implement first)

| # | Recommendation | Impact | Effort | Files Affected |
|---|---------------|--------|--------|----------------|
| 1 | **Add `<figcaption>` to technique page SVGs** with a sentence describing what the specific visualization shows. Template: "[Technique] showing [key pattern] in [N] observations of [data type]." | High | Low | `src/pages/eda/techniques/[slug].astro` |
| 2 | **Add FAQPage JSON-LD schema** to technique pages by wrapping the "Questions This Plot Answers" section in FAQ schema markup. The questions and answers already exist in the `questions` array and `interpretation`/`purpose` fields. | High | Low | `src/pages/eda/techniques/[slug].astro`, new FAQ schema component |
| 3 | **Improve aria-label on technique SVGs** from generic `"${technique.title} statistical chart"` to `"${technique.title} showing [description]"` using the first sentence of the `definition` field. | High | Low | `src/pages/eda/techniques/[slug].astro`, line 102 |
| 4. | **Add a concise "key insight" lead sentence** before each "What It Is" section on technique pages. Pull the first sentence of `definition` into a bold lead paragraph above the SVG, so it appears before the fold. | Medium | Low | `src/pages/eda/techniques/[slug].astro` |
| 5 | **Add technique-specific citation examples** to the "How to Cite" section in llms.txt for the 5 most important technique pages (histogram, scatter plot, box plot, normal probability plot, 4-plot). | Medium | Low | `src/pages/llms.txt.ts` |
| 6 | **Update heading text to match common queries.** Change "How to Interpret" to "How to Interpret a [Technique Name]" and "When to Use It" to "When to Use a [Technique Name]." | Medium | Low | `src/pages/eda/techniques/[slug].astro` |

### Strategic Investments (Higher effort, High impact -- plan for next iteration)

| # | Recommendation | Impact | Effort | Notes |
|---|---------------|--------|--------|-------|
| 7 | **Create an EDA FAQ page** at `/eda/faq/` aggregating the top 20 most-asked EDA questions with concise answers and links to detailed technique pages. Add FAQPage JSON-LD schema. | Very High | Medium | Aggregate from existing `questions` arrays |
| 8 | **Create 3-5 comparison pages** ("Box Plot vs Histogram", "EDA vs Classical Analysis", "Anderson-Darling vs Kolmogorov-Smirnov") using existing content restructured into side-by-side format. | Very High | Medium | Content largely exists; needs restructuring |
| 9 | **Add 200-300 words of prose to each distribution page** covering "What is it", "When to use it", "Real-world applications", and "Related statistical tests." | High | Medium | 19 distribution pages to update |
| 10 | **Create a "How to Do EDA: Step-by-Step Guide"** page at `/eda/guide/` synthesizing the recommended workflow, foundations, and technique selection into a single practical tutorial. | High | Medium | Synthesize existing content |
| 11 | **Add text descriptions below SVGs in case study pages** that explicitly state what each visualization shows. E.g., "The 4-plot above reveals a bimodal distribution in the histogram panel (lower left), with two peaks near 611 and 689 corresponding to the two batches." | Medium | Medium | 10 case study pages with multiple plots each |
| 12 | **Add `schema.org/Dataset` markup** to case study pages linking to NIST source datasets with provenance metadata. | Medium | Low | `src/pages/eda/case-studies/[...slug].astro` |
| 13 | **Expand llms.txt inline content** -- for each technique, include the definition sentence and primary "Questions This Plot Answers" directly in the llms.txt output, not just a link. | Medium | Medium | `src/pages/llms.txt.ts` |
| 14 | **Create a Kubernetes Security Best Practices blog post** synthesizing the K8s Analyzer's security rules into a searchable prose article. | Medium | High | New blog post |
| 15 | **Add distribution-to-technique cross-links** -- each distribution page should link to the statistical tests that use that distribution (e.g., Normal -> Normal Probability Plot, t-Test; Chi-Square -> Chi-Square GOF, Chi-Square SD Test). | Medium | Low | Distribution page template + distributions.json |

---

## 11. Detailed GEO Scores Summary

| Section | GEO Score | Key Strength | Primary Gap |
|---------|-----------|-------------|-------------|
| EDA Technique Pages (29+18) | 8.0/10 | Structured content with definitions, formulas, Python, questions | SVG descriptions, FAQ schema |
| Foundation Pages (6) | 9.0/10 | Clear definitions, numbered lists, cross-references | Could use FAQ schema |
| Case Study Pages (10) | 8.5/10 | Real NIST data, complete statistical analyses, structured tables | SVG captions, Dataset schema |
| Distribution Pages (19) | 7.5/10 | Interactive D3 explorers, KaTeX formulas | Minimal prose, weak cross-links |
| Reference Pages (4) | 7.0/10 | Taxonomy tables, critical value tables | Could expand "Using These Tables" |
| Blog Posts (8) | 6.5/10 | EDA blog post is excellent | Low volume, no FAQ schema |
| Tools Section (3 tools, 159 rules) | 6.0/10 | Rule pages provide long-tail content | Tool pages are JS-heavy, minimal prose |
| llms.txt / AI Discovery | 7.5/10 | Comprehensive listing, citation instructions | No inline content, just links |
| Source Authority Signals | 8.5/10 | NIST attribution, TechArticle schema, CC-BY 4.0 | No external citations beyond NIST |
| Interconnection / Topic Clusters | 8.0/10 | Strong bidirectional technique-case study links | Distributions weakly connected |
| Snippet Optimization | 6.5/10 | Questions lists, comparison tables, bold conclusions | No query-matched headings, no TL;DR boxes |
| Multi-Modal Content | 5.5/10 | SVGs exist but text equivalents are insufficient | Generic aria-labels, no figcaptions |
| Content Uniqueness | 8.0/10 | Build-time SVGs, interactive explorers, real data | AI cannot see SVG content |

**Composite GEO Score: 7.2/10**

---

## 12. Validation Notes

### Cross-Reference Consistency

- All `caseStudySlugs` in technique-content modules were verified to correspond to actual case study pages in `src/data/eda/pages/case-studies/`.
- All `relatedTechniques` in techniques.json correspond to valid technique slugs.
- Foundation pages cross-link correctly to technique pages.
- The `EDAJsonLd.astro` component is correctly included on all technique pages via `TechniquePage.astro`.
- The `llms.txt` dynamically generates entries from `getCollection()` calls, ensuring it stays in sync with actual content.

### Schema Markup Verification

- PersonJsonLd: Present on homepage.
- FAQPageJsonLd: Present on homepage, about, projects pages -- but NOT on any EDA page.
- BreadcrumbJsonLd: Present on all EDA pages via TechniquePage.astro.
- EDAJsonLd: Present on all EDA pages with TechArticle + LearningResource typing.
- Article OG type: Correctly set on EDA pages with `publishedDate` and `tags`.

### File-Level Spot Checks

- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/lib/eda/technique-content/time-series.ts`: All 5 techniques have complete content with definition, purpose, interpretation, assumptions, nistReference, questions, importance, definitionExpanded, formulas, and pythonCode. PASS.
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/lib/eda/technique-content/comparison.ts`: All 5 techniques have complete content. Star-plot and youden-plot include formulas or extended definitions. PASS.
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/data/eda/pages/case-studies/ceramic-strength.mdx`: 391 lines of comprehensive analysis. All technique cross-links verified. Statistical values are precise. PASS.
- `/Users/patrykattc/work/git/PatrykQuantumNomad/src/data/eda/distributions.json`: First 3 distributions verified (Normal, Uniform, Cauchy) with PDF formula, CDF formula, parameters, related distributions, and NIST reference. PASS.

---

## Appendix: Top 10 Actionable Items (Ranked by GEO Impact)

1. Add `<figcaption>` with descriptive text to all technique page SVGs
2. Create an EDA FAQ page with FAQPage JSON-LD schema
3. Add FAQPage JSON-LD to technique pages' "Questions This Plot Answers" sections
4. Create "Box Plot vs Histogram" and "EDA vs Classical Analysis" comparison pages
5. Improve SVG aria-labels to include first sentence of definition
6. Add 200-300 words of prose to each of the 19 distribution pages
7. Change heading structure to query-matched format ("How to Interpret a Histogram")
8. Create "How to Do EDA: Step-by-Step Guide" standalone page
9. Expand llms.txt with inline definitions for top 10 techniques
10. Add a bold key-takeaway lead sentence above the SVG on each technique page
