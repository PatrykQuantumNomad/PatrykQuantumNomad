# Project Research Summary

**Project:** The Beauty Index - Programming Language Aesthetic Ranking
**Domain:** Interactive data visualization content pillar for static portfolio site
**Researched:** 2026-02-17
**Confidence:** HIGH

## Executive Summary

The Beauty Index is a content pillar featuring 25 programming languages ranked across 6 aesthetic dimensions (readability, expressiveness, consistency, elegance, ecosystem, joy). Research shows this type of content combines elements of interactive data visualization sites (like IEEE Spectrum's language rankings), tier list makers (like TierMaker), and code comparison sites (like Hyperpolyglot). The recommended approach is to extend the existing Astro 5 static site architecture using build-time SVG generation for charts rather than client-side JavaScript charting libraries.

The critical architectural decision is **avoiding JavaScript charting libraries entirely**. The site currently ships minimal client-side JavaScript and maintains 90+ Lighthouse performance scores. Research across all four areas (STACK, ARCHITECTURE, and PITFALLS) converges on the same conclusion: hand-crafted SVG generated at build time in Astro components is the correct approach. A 6-point radar chart is a single polygon element with trigonometric coordinate calculations (approximately 40 lines of code), while client-side charting libraries add 50-80KB of JavaScript for completely static data. The existing Satori + Sharp OG image pipeline already demonstrates this pattern works for SVG-based visualizations.

The primary risk is DOM explosion from 250 code blocks on the comparison page (25 languages × 10 features). Expressive Code processes each block through Shiki at build time, generating 20-50 DOM elements per block. Loading all 250 blocks into the DOM simultaneously would create 5,000-12,500 elements, exceeding Lighthouse's "Excessive DOM Size" threshold. The mitigation strategy is tab-based lazy rendering where only 10-25 code blocks are in the DOM at once, with inactive tab content stored in template elements or loaded on-demand.

## Key Findings

### Recommended Stack

**No new runtime dependencies required.** The existing Astro 5 stack already contains everything needed: React 19 for optional interactive components, Tailwind CSS for styling, Expressive Code for syntax highlighting, Satori + Sharp for OG image generation, and GSAP for scroll animations.

**Optional additions (minimal impact):**
- **html-to-image** (1.11.11 pinned): 12KB gzipped for chart-to-image export if runtime sharing is needed (build-time Satori approach is preferred)
- **file-saver** (^2.0.5): 3KB gzipped for cross-browser download triggers
- **@expressive-code/plugin-collapsible-sections** (^0.41.0): Build-time only plugin for collapsing boilerplate in code blocks

**Core technologies already present:**
- **Astro 5.3.0**: Static pages, getStaticPaths() for 25 language detail pages, content collections with file() loader
- **React 19**: Interactive tab component via client:visible (only on comparison page)
- **Tailwind CSS 3.4.19**: Component styling, responsive layouts
- **TypeScript 5.9.3**: Type-safe language data schemas
- **GSAP 3.14.2**: Scroll-triggered chart entrance animations
- **Satori 0.19.2 + Sharp 0.34.5**: Build-time OG image generation with radar chart shapes
- **astro-expressive-code 0.41.6**: Syntax highlighting for 25-language code comparison

**Chart rendering decision:** The research revealed a divergence between STACK.md (recommending Recharts 3.7, a 50KB React charting library) and ARCHITECTURE.md + PITFALLS.md (recommending build-time SVG with zero JavaScript). The **correct recommendation is build-time SVG**. Rationale: (1) data is completely static (scores don't change at runtime), (2) radar charts with 6 data points are simple SVG polygons (polar-to-cartesian coordinate conversion is ~40 lines of code), (3) the site's performance philosophy is zero-JS-by-default, and (4) client-side charting libraries would degrade Lighthouse performance scores from 90+ to potentially 70s due to JavaScript payload increase. The existing Satori pipeline already proves this pattern works.

### Expected Features

**Must have (table stakes):**
- Overall ranking table with sort by dimension
- 4-tier visual grouping (Beautiful/Handsome/Practical/Workhorses) with color coding
- Per-language detail pages (25 total) with radar charts and character sketches
- Radar/spider charts showing 6-dimensional scores
- Code comparison page (10 features × 25 languages)
- Methodology blog post explaining scoring rubric
- Responsive design for mobile
- OG images for social sharing with chart visuals
- Accessible data tables behind charts for screen readers
- Navigation between overview, detail, and comparison pages

**Should have (differentiators):**
- "Download as Image" button on charts for social sharing
- Tier badge system (visual badges: gold/silver/bronze/steel)
- Character sketch narrative for each language (2-3 sentence personality descriptions)
- Anchor links to specific language rows in ranking table
- Animated chart entrance on scroll (using existing GSAP)
- Web Share API integration on mobile

**Defer (v2+):**
- Overlay comparison (pick 2-3 languages, overlay radar charts)
- User voting/crowd-sourced scores (destroys editorial thesis)
- Real-time data from GitHub/Stack Overflow APIs (conflates beauty with popularity)
- Comments section (let debate happen on social media where it generates backlinks)
- Historical tracking of score changes over time

### Architecture Approach

**Content pillar integration pattern:** The Beauty Index extends the existing portfolio site structure as a new section alongside `/blog/` and `/projects/`. It uses the same architectural patterns: Astro 5 file() content loader for structured data (languages.json), getStaticPaths() for dynamic routes (25 language pages), Satori + Sharp for OG images, and React islands for the one interactive component (code comparison tabs).

**Major components:**
1. **Data layer**: languages.json (25 languages with scores, metadata, character descriptions) loaded via Astro 5 content collection with Zod schema validation; code-samples.ts (TypeScript module with 250 code snippets keyed by feature)
2. **Build-time SVG charts**: RadarChart.astro generates inline SVG radar charts using polar-to-cartesian trigonometry in component frontmatter (zero JavaScript shipped to client); RankingChart.astro generates SVG horizontal bar chart for overview rankings
3. **Static pages**: /beauty-index/ (overview with rankings chart + language grid), /beauty-index/[slug]/ (per-language detail with radar chart and character), /beauty-index/code/ (feature-tabbed code comparison)
4. **OG image generation**: Extends existing Satori pipeline with new templates for radar chart layouts; radar shapes drawn as SVG polygons calculated from score data
5. **Interactive island**: CodeComparison.tsx React component with client:visible for tab switching on comparison page; pre-renders all code blocks at build time via Expressive Code, React only toggles visibility

**Chart rendering architecture:** Hand-crafted SVG generated at build time in Astro component frontmatter. A shared utility (src/lib/radar-svg.ts) contains polar-to-cartesian coordinate conversion used by both Astro components (RadarChart.astro) and OG image generation (beauty-index-og.ts). Charts use CSS custom properties (var(--color-accent), var(--color-border)) for theming, automatically adapting to the site's existing light mode styles.

### Critical Pitfalls

1. **Chart libraries destroy Lighthouse performance** — Adding Chart.js (63KB), Recharts (42KB), or D3 (80KB+) to every page would tank the site's 90+ performance scores. The data is static (known at build time) and the shapes are simple (polygons/rectangles). Solution: Hand-crafted SVG generated in Astro component frontmatter, zero JavaScript payload, instant render.

2. **250 code blocks explode build time and DOM size** — The comparison page with 25 languages × 10 features = 250 Shiki-highlighted code blocks would generate 5,000-12,500 DOM elements and take 12-50 seconds to build. Solution: Tab-based lazy rendering where only 10-25 blocks are in the DOM at once; store inactive tab content in template elements or load on-demand.

3. **Chart-to-image sharing hits CSP violations** — The site has a strict Content Security Policy. DOM-to-image libraries (html2canvas, dom-to-image) inject inline styles and create blob URLs that can be blocked by CSP, plus they're fragile on mobile (2-5 second freeze during capture). Solution: Generate shareable chart images at build time using the existing Satori + Sharp pipeline, avoiding all runtime DOM-to-image issues.

4. **Dark mode theme mismatch** — The site has a theme toggle but NO dark mode CSS custom properties are defined (only light mode variables exist in global.css). Charts using CSS custom properties will render identically in both modes. Solution: Decide on dark mode strategy BEFORE building chart components (recommended: defer dark mode for Beauty Index v1, document decision).

5. **OG image generation increases build time** — Adding 27+ new OG images (overview + 25 languages + comparison page) with radar chart visuals could add 4-11 seconds to build time, potentially 15-20 seconds if complex layouts. Solution: Implement hash-based caching for OG images (skip regeneration if input data unchanged), throttle parallel generation to 4 concurrent, create dedicated generateBeautyIndexOgImage() function.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Data Foundation & Core SVG Components
**Rationale:** Data model and shared chart math must be established first because every other component reads from languages.json and multiple components (RadarChart.astro, OG images) use the same polar coordinate calculations. Building pages without the data schema means dummy markup that gets replaced.

**Delivers:**
- languages.json with 3-5 seed languages (complete all 25 later)
- beautyIndex content collection in content.config.ts with Zod schema
- src/lib/radar-svg.ts (shared radar geometry math)
- RadarChart.astro (build-time SVG radar chart component)
- RankingChart.astro (build-time SVG bar chart component)
- ScoreBadge.astro (reusable score display pill)

**Addresses:** Table stakes features T3 (radar charts), foundation for all visual components

**Avoids:** Pitfall #1 (no chart library dependency decision made here - SVG-only from start), Pitfall #4 (dark mode strategy documented before building visual components)

**Research flag:** Standard patterns (SVG geometry, Astro components) - skip research-phase

### Phase 2: Overview & Detail Pages
**Rationale:** Core user-facing pages depend on Phase 1 components but can be built before the complex code comparison page. The overview page (rankings table + language grid) and per-language detail pages (radar chart + character sketch) deliver the essential "ranking index" experience. These pages validate the data model and component patterns before tackling the more complex comparison page.

**Delivers:**
- /beauty-index/ overview page (RankingChart + LanguageCard grid)
- /beauty-index/[slug]/ per-language detail pages (RadarChart + character content)
- LanguageCard.astro (composes RadarChart + ScoreBadge for overview grid)
- CharacterSketch.astro (character illustration wrapper)
- Navigation integration (add "Beauty Index" to Header.astro navLinks)

**Uses:** All Phase 1 components, existing Layout.astro and SEOHead.astro

**Implements:** Pages and routing architecture from ARCHITECTURE.md

**Avoids:** Pitfall #6 (SEO infrastructure built INTO page templates from start: unique meta descriptions per language, canonical URLs, JSON-LD structured data)

**Research flag:** Standard patterns (Astro dynamic routes, existing SEO component patterns) - skip research-phase

### Phase 3: OG Image Generation
**Rationale:** OG images can be built in parallel with or after core pages. They depend only on the shared radar math utility (Phase 1) and the data model, not on the page components themselves. Building them as a separate phase allows focus on the Satori template design and build-time optimization without blocking page development.

**Delivers:**
- src/lib/beauty-index-og.ts (OG image generation function with radar chart SVG embedding)
- /open-graph/beauty-index/overview.png endpoint
- /open-graph/beauty-index/[slug].png endpoint (27 total images: overview + 25 languages + code page)
- Hash-based OG image caching to prevent regeneration on every build
- Throttled parallel generation (p-limit(4)) to avoid CI/CD memory issues

**Uses:** Phase 1 radar-svg.ts utility, existing Satori + Sharp pipeline from src/lib/og-image.ts

**Addresses:** Table stakes feature T8 (OG images), differentiator D3 (shareable social cards)

**Avoids:** Pitfall #5 (OG image build time) via caching and throttling; Pitfall #3 (chart sharing fragility) by using build-time Satori instead of runtime DOM capture

**Research flag:** Standard patterns (extending existing OG pipeline) - skip research-phase

### Phase 4: Code Comparison Page (High Complexity)
**Rationale:** This is the most architecturally complex feature due to 250 code blocks and tab-based lazy rendering requirements. Deferring it until core pages are stable allows validation of the data model and component patterns first. The comparison page is valuable but not blocking for the core "ranking index" experience.

**Delivers:**
- src/data/beauty-index/code-samples.ts (TypeScript module with 250 code snippets)
- /beauty-index/code/ page with tab-based code comparison
- CodeTabs.tsx React component (client:visible for tab switching)
- Pre-rendered code blocks via Expressive Code, React only toggles visibility
- Accessible tab component following WAI-ARIA tab pattern

**Uses:** Existing astro-expressive-code integration, React 19 islands, GSAP for optional animations

**Implements:** Tab-based lazy rendering architecture from ARCHITECTURE.md to avoid DOM explosion

**Avoids:** Pitfall #2 (250 code blocks DOM explosion) via tab-based lazy rendering where only 10-25 blocks in DOM at once; Pitfall #9 (tab accessibility) by implementing WAI-ARIA tab pattern with keyboard navigation

**Research flag:** NEEDS RESEARCH-PHASE - complex interaction between Expressive Code build-time rendering, React hydration, and tab state management; DOM manipulation patterns for 250 code blocks need validation

### Phase 5: Content Completion & Polish
**Rationale:** With all infrastructure in place, this phase completes the remaining 20-22 language entries (started with 3-5 seeds in Phase 1), writes the methodology blog post, and adds optional shareability features. Content authoring can happen incrementally without blocking technical work.

**Delivers:**
- Complete all 25 languages in languages.json
- Complete all 250 code snippets in code-samples.ts
- Methodology blog post (MDX in existing blog collection)
- Character illustrations (25 PNG files in public/images/)
- Optional: "Download as Image" button (html-to-image + file-saver if needed)
- Optional: Web Share API integration on mobile
- Optional: Animated chart entrance via GSAP ScrollTrigger

**Uses:** All existing infrastructure from Phases 1-4

**Addresses:** Remaining differentiator features (D1 download, D5 animations, D10 Web Share)

**Avoids:** Pitfall #7 (GSAP ScrollTrigger conflicts) by registering animations through existing lifecycle, testing page navigation flow

**Research flag:** Standard patterns (content authoring, GSAP patterns already established) - skip research-phase

### Phase 6: SEO & Launch Readiness
**Rationale:** Final SEO polish and cross-page linking happens after all content exists. This ensures internal linking strategy can reference all 25 language pages, the comparison page, and the methodology blog post. Launch checklist verification ensures nothing is missing.

**Delivers:**
- BeautyIndexJsonLd.astro (Schema.org structured data for ranking pages)
- BreadcrumbJsonLd on all Beauty Index pages
- Internal links FROM existing pages (blog, homepage) TO Beauty Index
- Sitemap verification (all 27+ pages included)
- Lighthouse audit on all page types (overview, detail, comparison)
- Accessibility audit (VoiceOver testing, keyboard navigation)
- Mobile responsiveness verification

**Uses:** Existing SEOHead.astro, sitemap integration, BreadcrumbJsonLd patterns

**Addresses:** Pitfall #6 completion (full SEO infrastructure), table stakes feature T9 (navigation/cross-linking)

**Research flag:** Standard patterns (existing SEO components, known audit tools) - skip research-phase

### Phase Ordering Rationale

- **Data-first approach:** Phase 1 establishes the data model and shared utilities because every downstream component depends on languages.json schema and radar math calculations. Changing the data schema later would ripple through all components.

- **Core pages before complex features:** Phases 2-3 deliver the essential ranking index experience (overview + detail pages + OG images) before tackling the high-complexity comparison page (Phase 4). This validates architectural patterns with simpler use cases first.

- **OG images isolated:** Phase 3 can run in parallel with Phase 2 because OG generation only depends on Phase 1 utilities, not on page components. This allows optimization work (caching, throttling) to happen independently.

- **Comparison page deferred:** Phase 4 is the only feature requiring deep research due to the 250 code block challenge and React hydration complexity. Deferring it prevents blocking core pages while the lazy-rendering pattern is validated.

- **Content completion flexible:** Phase 5 content authoring (remaining 20 languages, code snippets, character sketches) can happen incrementally and doesn't block technical infrastructure work.

- **SEO polish last:** Phase 6 internal linking and cross-references require all content to exist first. Launch readiness checklist ensures comprehensive verification across all page types.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 4 (Code Comparison):** Complex interaction between Expressive Code build-time rendering, React client:visible hydration, tab state management, and DOM manipulation for 250 code blocks. The hybrid approach (pre-render via Expressive Code, toggle visibility via React) needs validation. Alternative vanilla JS approach may be simpler.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** SVG geometry and Astro component patterns are well-documented; polar-to-cartesian conversion is standard trigonometry
- **Phase 2:** Astro dynamic routes via getStaticPaths() follows existing blog pattern; SEO components already established
- **Phase 3:** Satori + Sharp pipeline already proven for blog OG images; extending with new templates is straightforward
- **Phase 5:** Content authoring, GSAP scroll animations, and Web Share API are established patterns
- **Phase 6:** SEO audit, Lighthouse testing, and accessibility verification use standard tools and existing component patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new runtime dependencies needed; existing Astro 5 stack sufficient; SVG-first approach proven by existing Satori OG pipeline |
| Features | HIGH | Clear table stakes from competitive analysis (TIOBE, IEEE Spectrum, TierMaker); differentiators based on social shareability patterns; anti-features well-reasoned |
| Architecture | HIGH | Extends established Astro patterns (content collections, dynamic routes, React islands); build-time SVG approach matches site performance philosophy; OG pipeline proven |
| Pitfalls | HIGH | Verified against codebase analysis, Astro docs, known CSP issues, web performance research, and accessibility standards; all pitfalls have concrete mitigation strategies |

**Overall confidence:** HIGH

### Gaps to Address

**Dark mode strategy needs decision:** The site has a theme toggle but incomplete dark mode implementation (no dark CSS custom properties defined, only Expressive Code themes respond to .dark class). Decision required: (A) defer dark mode for Beauty Index v1 and ensure charts work in light mode only, or (B) complete dark mode color palette in global.css before building chart components. Recommendation: Option A for v1 MVP, document decision in Phase 1.

**Code comparison lazy-rendering pattern needs validation:** The hybrid approach (Expressive Code pre-renders at build time, React island toggles visibility) is architecturally sound but the exact mechanics need validation during Phase 4 planning. Alternative: pure vanilla JavaScript tab controller without React hydration overhead. This is flagged for research-phase in Phase 4.

**Character illustration art style:** The 25 character sketches need a consistent visual style. This is content creation work (illustration/design) outside of technical implementation. Consider placeholder illustrations for Phase 1-4, commission final art for Phase 5.

**Greek symbols/mathematical notation:** If dimension names or formulas use Greek characters, test rendering in all three site fonts (Bricolage Grotesque, DM Sans, Fira Code) early in Phase 1. Add fallback font with Greek support to font stack if needed.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: package.json, astro.config.mjs, tsconfig.json, src/content.config.ts, src/lib/og-image.ts, src/pages/open-graph/[...slug].png.ts, src/components/Header.astro, src/components/SEOHead.astro, src/layouts/Layout.astro, src/styles/global.css
- [Astro 5 Content Collections documentation](https://docs.astro.build/en/guides/content-collections/) — file() loader, Zod schema, getCollection API
- [Astro Content Loader API reference](https://docs.astro.build/en/reference/content-loader-reference/) — file() loader specification
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) — client:visible directive, partial hydration
- [Recharts GitHub releases v3.7.0](https://github.com/recharts/recharts/releases) — evaluated and REJECTED in favor of build-time SVG
- [Satori GitHub repository](https://github.com/vercel/satori) — CSS/HTML subset, SVG generation capabilities
- [Satori SVG support issue #86](https://github.com/vercel/satori/issues/86) — SVG data URI embedding approach confirmed

### Secondary (MEDIUM confidence)
- [TIOBE Index](https://www.tiobe.com/tiobe-index/), [IEEE Spectrum Top Programming Languages 2025](https://spectrum.ieee.org/top-programming-languages-2025), [TierMaker](https://tiermaker.com/categories/technology/programming-languages--32215) — competitive feature analysis
- [Hyperpolyglot](https://hyperpolyglot.org/), [Rosetta Code](https://rosettacode.org/) — code comparison patterns
- [Chart.js CSP requirement GitHub Issue #8108](https://github.com/chartjs/Chart.js/issues/8108) — why Chart.js conflicts with strict CSP
- [Monday.com DOM-to-Image performance challenges](https://engineering.monday.com/capturing-dom-as-image-is-harder-than-you-think-how-we-solved-it-at-monday-com/) — why to avoid runtime DOM-to-image
- [html-to-image npm comparison](https://npm-compare.com/dom-to-image,html-to-image,html2canvas) — library evaluation (rejected for build-time Satori approach)
- [SVG Radar Charts without D3](https://data-witches.com/2023/12/radar-chart-fun-with-svgs-aka-no-small-multiples-no-problem/) — pure SVG polar coordinate approach
- [Accessible SVG Charts for Khan Academy — Sara Soueidan](https://www.sarasoueidan.com/blog/accessible-data-charts-for-khan-academy-2018-annual-report/) — accessibility patterns for charts
- [WAI-ARIA Authoring Practices 1.1 Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) — accessible tab implementation

### Tertiary (LOW confidence)
- [Expressive Code plugin documentation](https://expressive-code.com/plugins/collapsible-sections/) — optional build-time plugin for code block enhancement
- [Web Share API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) — optional mobile share feature
- [Clipboard API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) — optional copy-to-clipboard feature

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*
