# Feature Research: The Beauty Index

**Domain:** Interactive programming language ranking/comparison content pillar on a portfolio site
**Researched:** 2026-02-17
**Confidence:** HIGH
**Scope:** Beauty Index overview page, per-language detail pages, code comparison page, methodology blog post, social shareability infrastructure

---

## Existing Infrastructure (Already Built)

These capabilities exist on patrykgolabek.dev and directly inform what the Beauty Index can leverage without new work:

| Capability | Where | Reuse Potential |
|------------|-------|-----------------|
| **OG image generation** | `src/lib/og-image.ts` using Satori + Sharp | HIGH -- extend with new Beauty Index templates (radar chart layouts, tier badges) |
| **SEO component** | `src/components/SEOHead.astro` | DIRECT -- accepts ogImage, ogType, tags, description |
| **JSON-LD structured data** | BlogPostingJsonLd, BreadcrumbJsonLd, PersonJsonLd, ProjectsJsonLd | EXTEND -- add Dataset or Article schema for ranking pages |
| **Content collections** | `src/content.config.ts` with glob loader | EXTEND -- add `beauty-index` collection for per-language data |
| **Syntax highlighting** | astro-expressive-code (Shiki-based, VS Code engine) | DIRECT -- use for code comparison blocks |
| **GSAP animations** | ScrollTrigger, Flip, scroll-animations | DIRECT -- animate chart entries, tier transitions |
| **React integration** | @astrojs/react already configured | DIRECT -- use React islands for interactive charts |
| **Tailwind CSS** | Already configured with typography plugin | DIRECT -- style all new pages |
| **Blog infrastructure** | MDX support, reading time, TOC, tags | DIRECT -- methodology blog post slots in naturally |
| **Sitemap + RSS** | @astrojs/sitemap, @astrojs/rss | DIRECT -- new pages auto-included |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that visitors to a language ranking site assume exist. Missing any of these makes the content feel half-baked or unfinished. Reference points: TIOBE Index, IEEE Spectrum Top Programming Languages, RedMonk Rankings, TierMaker tier lists.

| # | Feature | Why Expected | Complexity | Dependencies |
|---|---------|--------------|------------|--------------|
| T1 | **Overall ranking table with sort** | Every ranking site (TIOBE, IEEE Spectrum, RedMonk) has a primary sortable table. Users need to scan all 25 languages at a glance and sort by total score or individual dimension. Without this, there is no "index." | MEDIUM | Language data JSON |
| T2 | **Tier grouping with visual distinction** | The 4-tier system (Beautiful/Handsome/Practical/Workhorses) is the core editorial voice. Tiers must be visually distinct with color coding -- this is the TierMaker pattern users recognize immediately. Color-coded rows or sections grouped by tier. | LOW | T1 (ranking table) |
| T3 | **Per-language detail pages** | Users who see a language ranked will want to understand why. Each of the 25 languages needs its own page with: the 6 dimension scores, a radar chart, the "character sketch" narrative, and signature code sample. This is the depth that makes the index credible. | MEDIUM | Language data JSON, chart library, syntax highlighting |
| T4 | **Radar/spider charts per language** | Radar charts are the standard visualization for multi-dimensional scoring (6 axes map perfectly). Users expect to see the "shape" of each language at a glance. This is the most screenshot-friendly visual element. | MEDIUM | React charting library (island component) |
| T5 | **Code comparison page** | The 10 features x 25 languages matrix is core content. Users expect to compare how the same concept looks across languages -- this is the Rosetta Code / Hyperpolyglot pattern. Tabbed by feature (not by language) is the correct UX since users want to see "how does pattern matching look in every language?" | HIGH | Language data JSON, syntax highlighting, tab component |
| T6 | **Methodology blog post** | A ranking without transparent methodology is dismissed as arbitrary. The long-form essay explaining the 6 dimensions, scoring rubric, and editorial philosophy turns "some guy's opinion" into "a framework for thinking about language aesthetics." Already has blog infrastructure. | LOW | Existing blog/MDX pipeline |
| T7 | **Responsive design** | Tables, charts, and code blocks must work on mobile. Radar charts need to be readable at 320px width. The ranking table needs horizontal scroll or card-based mobile layout. | MEDIUM | All visual components |
| T8 | **OG images for social sharing** | Each page (overview, per-language, code comparison) needs a unique OG image. The overview page OG should show the top-tier ranking. Per-language OG images should show that language's radar chart and tier badge. Already have Satori infrastructure. | MEDIUM | Existing OG pipeline, new Satori templates |
| T9 | **Navigation between pages** | Users must be able to flow naturally: overview -> language detail, language detail -> code comparison, code comparison -> language detail. Breadcrumbs, back links, and cross-references between all Beauty Index pages. | LOW | Astro routing |
| T10 | **Accessible data tables behind charts** | Screen readers cannot interpret radar chart SVGs. Every chart must have a visually hidden `<table>` with the raw score data. This is both an accessibility requirement and an SEO benefit (Google indexes the table text). WCAG pattern: chart + equivalent data table. | LOW | Language data JSON |

### Differentiators (Competitive Advantage)

Features that set the Beauty Index apart from generic ranking sites (TIOBE, IEEE Spectrum) and tier list makers (TierMaker). These are what make visitors share, bookmark, and return.

| # | Feature | Value Proposition | Complexity | Dependencies |
|---|---------|-------------------|------------|--------------|
| D1 | **"Download as Image" button on charts** | The primary shareability driver. Users screenshot charts to share on X/Reddit/HN. A dedicated download button generates a clean, branded PNG (no browser chrome, no cropping needed). Uses `html-to-image` to capture a styled card div containing the radar chart + language name + tier badge + site branding. | MEDIUM | Chart component, html-to-image library |
| D2 | **"Copy Chart to Clipboard" button** | Even faster than download -- click to copy the chart image to clipboard, then paste directly into Slack, Discord, or social media. Uses the Clipboard API (`navigator.clipboard.write` with `image/png` blob). Falls back gracefully when API is unavailable. | LOW | D1 (same capture mechanism), Clipboard API |
| D3 | **Shareable social cards per language** | Each language detail page has a pre-designed "card" view optimized for screenshots: radar chart + total score + tier badge + one-line character sketch + site URL watermark. This card is also the OG image template. Dual purpose: OG meta image AND in-page shareable element. | MEDIUM | T4, T8 |
| D4 | **Overlay comparison (pick 2-3 languages)** | Let users select 2-3 languages and overlay their radar charts on a single spider chart. This is the "Rust vs Go vs Python" viral comparison pattern. IEEE Spectrum allows custom filtering; this goes further with direct visual overlay. | HIGH | T4, selection state management |
| D5 | **Animated chart entrance** | Radar chart axes animate in on scroll (GSAP ScrollTrigger). Scores "fill in" with a drawing animation. Makes the page feel premium and encourages users to scroll through all languages. The site already uses GSAP extensively. | LOW | GSAP (already installed), T4 |
| D6 | **Tier badge system** | Each language gets a visual badge: "Beautiful" (gold), "Handsome" (silver), "Practical" (bronze), "Workhorse" (steel). These badges appear on detail pages, in the ranking table, and in OG images. The badge becomes the visual shorthand people share. | LOW | Language data JSON, CSS/SVG |
| D7 | **Character sketch narrative** | Each language gets a 2-3 sentence "character sketch" -- a literary/personality-style description (e.g., "Haskell is the philosopher who speaks in mathematical proofs"). This is the editorial voice that makes the index uniquely Patryk's and not just another number chart. | LOW | Content authoring (no tech dependency) |
| D8 | **Code comparison feature tabs with language sub-tabs** | On the code comparison page, organize by feature (Pattern Matching, Error Handling, etc.) as primary tabs. Under each feature, show code for all 25 languages in a scrollable gallery or secondary tab set. Uses existing expressive-code for syntax highlighting. | HIGH | T5, expressive-code |
| D9 | **Anchor links to specific language rows** | Deep linking: `beauty-index/#python` scrolls to Python's row in the ranking table and highlights it. Enables sharing specific language positions in discussions ("look where PHP landed: [link]"). | LOW | T1 |
| D10 | **Web Share API integration** | On mobile, trigger the native share sheet (X, Messages, WhatsApp, etc.) instead of showing download/copy buttons. Progressive enhancement: detect `navigator.share` support and show the appropriate UI. | LOW | D1 or D3 |

### Anti-Features (Explicitly NOT Building)

| # | Anti-Feature | Why Tempting | Why Avoid | What to Do Instead |
|---|--------------|-------------|-----------|-------------------|
| A1 | **User voting / crowd-sourced scores** | "Let people vote on their own language scores for engagement!" | Destroys the editorial thesis. The entire point is that this is ONE person's informed, opinionated ranking. Crowd-sourced data converges on popularity (which TIOBE already does). Also adds backend complexity (auth, rate limiting, database) to a static site. | The scores are Patryk's editorial opinion. Period. Engagement comes from people disagreeing publicly. |
| A2 | **Real-time data from GitHub/Stack Overflow APIs** | "Pull real metrics to make it data-driven!" | The Beauty Index explicitly measures AESTHETIC qualities, not popularity or usage. Mixing in API data conflates beauty with prevalence. Also adds build-time API dependencies to a static site deployed on GitHub Pages. | State clearly in methodology that this is subjective. Link to TIOBE/IEEE Spectrum for objective metrics. |
| A3 | **Comments section on ranking pages** | "People will want to debate the rankings!" | Comments require moderation, a backend service (Giscus, Utterances, Disqus), and attract low-quality "my language should be #1" noise. The discussion should happen on social media where it drives traffic back. | Include share buttons. Let the debate happen on X/Reddit/HN where it generates backlinks and impressions. |
| A4 | **Drag-and-drop tier list maker** | "Let visitors create their own Beauty Index!" | Massive engineering scope (drag-and-drop, state persistence, share link generation). Dilutes the editorial product into a generic tool. TierMaker already does this perfectly. | Link to TierMaker for users who want to make their own. Keep the Beauty Index as authored content. |
| A5 | **Language logo/icon images** | "Show each language's logo for visual recognition." | Logo licensing is a legal minefield. Many language logos have restrictive trademark policies (Oracle/Java, Apple/Swift, Google/Go). Using them requires individual license review. | Use a consistent visual identity system instead: colored tier badges, radar chart silhouettes, and the language name in a monospace font. The radar chart shape IS each language's visual identity. |
| A6 | **Historical tracking / score changes over time** | "Show how scores evolve as languages add features!" | Implies ongoing maintenance and regular re-evaluation. This is a content pillar, not a live dashboard. Creating time-series expectations means the page looks stale 6 months after launch. | Frame the Beauty Index as a "snapshot" with a clear date. If scores change, publish a new blog post about the update. |
| A7 | **Server-side rendering for charts** | "SSR the charts for better SEO and initial load!" | The site is statically generated on GitHub Pages (output: 'static'). Chart libraries (Chart.js, Recharts) require a DOM/Canvas and cannot render in Node.js SSG without headless browser puppetry. The complexity is massive for minimal SEO benefit since the data table fallback already provides text content for crawlers. | Use React islands (client:visible) for charts. Provide `<noscript>` data tables for crawlers and screen readers. The scores are in the HTML regardless. |

---

## Feature Dependencies

```
[Language Data JSON] (foundation -- all features depend on this)
    |
    +---> [T1: Ranking Table]
    |         +---> [T2: Tier Grouping]
    |         +---> [D9: Anchor Links]
    |
    +---> [T3: Detail Pages]
    |         +---> [T4: Radar Charts] (React island)
    |         |         +---> [D1: Download as Image]
    |         |         |         +---> [D2: Copy to Clipboard]
    |         |         |         +---> [D10: Web Share API]
    |         |         +---> [D4: Overlay Comparison]
    |         |         +---> [D5: Animated Entrance]
    |         +---> [D6: Tier Badges]
    |         +---> [D7: Character Sketch]
    |         +---> [D3: Shareable Social Cards]
    |
    +---> [T5: Code Comparison Page]
    |         +---> [D8: Feature Tabs + Language Sub-tabs]
    |
    +---> [T6: Methodology Blog Post] (independent of tech features)
    |
    +---> [T8: OG Images] (extends existing Satori pipeline)
    |         +---> [D3: Shareable Social Cards] (OG image = in-page card)
    |
    +---> [T10: Accessible Data Tables] (embedded in T1, T3, T4)
    |
    +---> [T9: Navigation] (connects T1, T3, T5)

[T7: Responsive Design] -- cross-cutting concern across all visual features
```

### Dependency Notes

- **Language Data JSON is the foundation:** Every feature reads from this single data source. It must be designed first and contain: language name, slug, 6 dimension scores, total score, tier, character sketch text, signature code samples, and per-feature code comparison snippets. Estimated ~50-80 lines of JSON per language, ~2000 lines total.
- **T4 (Radar Charts) enables the entire shareability chain:** D1 -> D2 -> D10 all depend on having a capturable chart DOM element. Build T4 first with a "shareable card" wrapper div from day one.
- **D3 (Shareable Social Cards) has dual purpose:** The same visual layout serves as both the in-page shareable element AND the Satori OG image template. Design once, render twice (client-side via React island, build-time via Satori).
- **T5 (Code Comparison) is the most complex feature** with 10 features x 25 languages = 250 code snippets. The data entry alone is significant. Can be phased.
- **D4 (Overlay Comparison) is the highest-complexity differentiator.** It requires selection state (which languages to compare), re-rendering the radar chart with multiple datasets, and a good UX for picking languages. Build after single-language charts are solid.

---

## Competitor Feature Analysis

| Feature | TIOBE Index | IEEE Spectrum | TierMaker | RedMonk | Hyperpolyglot | **Beauty Index** |
|---------|-------------|---------------|-----------|---------|----------------|------------------|
| Ranking table | Yes (sortable) | Yes (interactive, weighted) | No (drag-drop tiers) | Yes (scatter plot) | No | Yes (sortable + tier-grouped) |
| Multi-dimensional scores | No (single metric) | Yes (8 metrics, user-weighted) | No | Yes (2 axes) | No | Yes (6 named dimensions) |
| Radar/spider chart | No | No | No | No | No | **Yes (unique)** |
| Per-language detail pages | Partial (history only) | No | No | No | No | **Yes (full page per language)** |
| Code samples | No | No | No | No | Yes (table format) | **Yes (syntax-highlighted, tabbed)** |
| Editorial narrative | No (pure data) | Yes (article) | No | Yes (blog post) | No | **Yes (character sketches)** |
| Download chart as image | No | No | Yes (download tier list) | No | No | **Yes** |
| OG images with chart data | No | No | Yes (basic) | No | No | **Yes (radar chart in OG)** |
| Overlay comparison | No | No | No | No | No | **Yes (2-3 language overlay)** |
| Social share buttons | No | Basic | Yes | No | No | **Yes (native share, copy, download)** |

**Key insight:** No existing language ranking site combines quantitative multi-dimensional scoring with editorial narrative AND social-first shareability. The Beauty Index occupies a unique niche: opinionated, visual, shareable.

---

## MVP Definition

### Launch With (v1 -- Core Beauty Index)

The minimum set to launch a complete, shareable Beauty Index:

- [x] **Language Data JSON** -- all 25 languages with 6 scores, tier, character sketch, signature code
- [x] **T1: Ranking table** -- sortable by total score and each dimension, tier-colored rows
- [x] **T2: Tier grouping** -- visual tier sections with color coding
- [x] **T3: Per-language detail pages** -- generated from data JSON via `[slug].astro`
- [x] **T4: Radar charts** -- React island using Chart.js (via react-chartjs-2) or Recharts
- [x] **T6: Methodology blog post** -- long-form MDX in existing blog collection
- [x] **T7: Responsive design** -- mobile-first for all pages
- [x] **T8: OG images** -- at minimum: overview page OG image, per-language OG images via extended Satori pipeline
- [x] **T9: Navigation** -- breadcrumbs, cross-links between overview/detail/blog
- [x] **T10: Accessible data tables** -- hidden tables behind every chart
- [x] **D6: Tier badges** -- visual badge system (CSS, appears everywhere)
- [x] **D7: Character sketches** -- authored content in data JSON
- [x] **D9: Anchor links** -- deep linking to language rows

### Add After Launch (v1.1 -- Shareability Polish)

Features that maximize viral potential, added once the core is stable:

- [ ] **D1: Download as Image** -- html-to-image integration for chart card export
- [ ] **D2: Copy to Clipboard** -- Clipboard API integration
- [ ] **D3: Shareable social cards** -- styled card component for in-page sharing
- [ ] **D5: Animated chart entrance** -- GSAP ScrollTrigger on radar charts
- [ ] **D10: Web Share API** -- mobile native share sheet

### Add in v1.2 (Code Comparison)

The code comparison page is high-effort and can launch separately:

- [ ] **T5: Code comparison page** -- 10 features x 25 languages
- [ ] **D8: Feature tabs** -- tabbed interface with syntax-highlighted code blocks

### Future Consideration (v2+)

- [ ] **D4: Overlay comparison** -- pick 2-3 languages, overlay radar charts
- [ ] Update blog post when scores change
- [ ] Consider expanding beyond 25 languages based on reader feedback

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase |
|---------|------------|---------------------|----------|-------|
| Language Data JSON | CRITICAL | MEDIUM (content authoring + structure) | P0 | v1 |
| T1: Ranking table | HIGH | MEDIUM | P1 | v1 |
| T2: Tier grouping | HIGH | LOW | P1 | v1 |
| T3: Detail pages | HIGH | MEDIUM | P1 | v1 |
| T4: Radar charts | HIGH | MEDIUM | P1 | v1 |
| T6: Blog post | HIGH | LOW (authoring) | P1 | v1 |
| T8: OG images | HIGH | MEDIUM | P1 | v1 |
| T10: Accessible tables | MEDIUM | LOW | P1 | v1 |
| T9: Navigation | MEDIUM | LOW | P1 | v1 |
| T7: Responsive | HIGH | MEDIUM (cross-cutting) | P1 | v1 |
| D6: Tier badges | MEDIUM | LOW | P1 | v1 |
| D7: Character sketches | HIGH | LOW (content) | P1 | v1 |
| D9: Anchor links | MEDIUM | LOW | P1 | v1 |
| D1: Download as Image | HIGH | MEDIUM | P2 | v1.1 |
| D2: Copy to Clipboard | MEDIUM | LOW | P2 | v1.1 |
| D3: Social cards | HIGH | MEDIUM | P2 | v1.1 |
| D5: Animated entrance | LOW | LOW | P2 | v1.1 |
| D10: Web Share API | MEDIUM | LOW | P2 | v1.1 |
| T5: Code comparison | HIGH | HIGH (250 code snippets) | P2 | v1.2 |
| D8: Feature tabs | MEDIUM | MEDIUM | P2 | v1.2 |
| D4: Overlay comparison | HIGH | HIGH | P3 | v2 |

---

## Shareability Patterns Research

### How Language Rankings Go Viral

Based on analysis of TIOBE, IEEE Spectrum, TierMaker, and Stack Overflow Survey sharing patterns:

1. **The screenshot-and-argue pattern:** Users screenshot a surprising ranking position and post it to X/Reddit/HN with commentary like "No way [Language] is rated higher than [Language]." The Beauty Index should be designed so that every chart and table row looks good as a screenshot with clear branding visible.

2. **The comparison provocation pattern:** "Rust vs Go" or "Python vs C++" comparisons drive the most engagement. The overlay comparison feature (D4) directly enables this, but even without it, side-by-side detail page links serve the same purpose.

3. **The tier badge identity pattern:** TierMaker tier lists go viral because people identify with their tier placement. "My main language is Beautiful tier" becomes a badge of honor. The tier badge system (D6) feeds this identity-driven sharing.

4. **The methodology debate pattern:** Publishing a transparent methodology invites productive disagreement about the criteria themselves, not just the results. The blog post (T6) serves this purpose.

### OG Image Strategy (Extends Existing Infrastructure)

The site already generates OG images via Satori + Sharp at build time. The Beauty Index needs 3 new OG templates:

| Page Type | OG Image Content | Template Approach |
|-----------|-----------------|-------------------|
| **Overview page** | Top 5 languages with scores + "The Beauty Index" title + tier color strip | New Satori layout in `og-image.ts` or separate function |
| **Per-language detail** | Language name + radar chart shape (rendered as simple SVG polygons in Satori) + total score + tier badge | Satori can render SVG directly -- draw the radar polygon from score data |
| **Code comparison** | "Code Comparison: 25 Languages x 10 Features" text treatment | Simple text-based Satori layout (like existing no-cover blog OG) |
| **Blog post** | Already handled by existing OG pipeline | No new work |

**Key constraint:** Satori renders a subset of CSS/HTML (no Canvas, no actual chart library). Radar charts in OG images must be drawn as SVG `<polygon>` elements calculated from the 6 dimension scores. This is straightforward geometry (6 points on a hexagon scaled by score values).

### Download-as-Image Technical Pattern

**Recommended library:** `html-to-image` (1.6M+ weekly downloads, actively maintained, TypeScript support, better performance than html2canvas for DOM-heavy content).

**Implementation pattern:**
1. Wrap each shareable element in a `<div data-shareable>` with a styled "card" layout including site branding
2. On "Download" click: call `toPng()` from html-to-image on the wrapper div
3. Create a temporary `<a>` element with `download` attribute and trigger click
4. On "Copy" click: call `toBlob()`, then `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])`
5. On "Share" click (mobile): call `navigator.share({ files: [new File([blob], 'chart.png', { type: 'image/png' })] })`

**Clipboard API browser support (as of 2025):** Baseline Newly Available (March 2025). Chrome, Edge, Firefox, Safari all support `navigator.clipboard.write` with `image/png`. Secure context (HTTPS) required. User gesture required.

### Social Media Image Dimensions

| Platform | Recommended Size | Aspect Ratio |
|----------|-----------------|--------------|
| X / Twitter | 1200 x 675 | 16:9 |
| Facebook | 1200 x 630 | ~1.91:1 |
| LinkedIn | 1200 x 627 | ~1.91:1 |
| Reddit | 1200 x 628 | ~1.91:1 |
| OG standard | 1200 x 630 | 1.91:1 |
| Discord embed | 1200 x 630 | 1.91:1 |

**Use 1200 x 630 for all OG images** (already the standard in the existing pipeline). For download-as-image cards, use the same dimensions so shared images match OG previews.

---

## Sources

### Ranking Site Analysis
- [TIOBE Index](https://www.tiobe.com/tiobe-index/) -- single-metric ranking table, historical charts, no per-language pages
- [IEEE Spectrum Top Programming Languages 2025](https://spectrum.ieee.org/top-programming-languages-2025) -- interactive, user-weighted multi-metric, editorial article format
- [RedMonk Programming Language Rankings](https://redmonk.com/sogrady/2025/06/18/language-rankings-1-25/) -- two-axis scatter plot, blog post format
- [TierMaker Programming Languages](https://tiermaker.com/categories/technology/programming-languages--32215) -- drag-and-drop tier lists, download/share, community voting

### Code Comparison Sites
- [Hyperpolyglot](https://hyperpolyglot.org/) -- side-by-side table format, minimal interactivity, grouped by language family
- [Rosetta Code](https://rosettacode.org/wiki/Language_Comparison_Table) -- wiki-based, per-task code samples, 379 languages
- [Side Rosetta](https://rosetta.fiatjaf.com/) -- two-column side-by-side comparison fetched from Rosetta Code

### Shareability & Image Export
- [html-to-image npm comparison](https://npm-compare.com/dom-to-image,html-to-image,html2canvas) -- html-to-image recommended over html2canvas for modern projects
- [Clipboard API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) -- Baseline Newly Available as of March 2025
- [Web Share API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) -- native mobile share sheet
- [OG Image Tips 2025](https://myogimage.com/blog/og-image-tips-2025-social-sharing-guide) -- 40-50% CTR increase with optimized OG images

### OG Image Generation (Astro + Satori)
- [Dynamic OG Images with Satori and Astro](https://knaap.dev/posts/dynamic-og-images-with-any-static-site-generator/) -- pattern for SSG OG generation
- [satori-og utility library](https://github.com/LucJosin/satori-og) -- utility wrapper for Satori in SSGs
- [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation) -- reference implementation

### Chart Libraries
- [Chart.js Radar Chart docs](https://www.chartjs.org/docs/latest/charts/radar.html) -- native radar chart support
- [react-chartjs-2 Radar](https://react-chartjs-2.js.org/examples/radar-chart/) -- React wrapper for Chart.js
- [Recharts vs Chart.js comparison (LogRocket)](https://blog.logrocket.com/best-react-chart-libraries-2025/) -- Recharts better for large datasets, Chart.js lighter for small ones
- [React Graph Gallery - Radar Chart](https://www.react-graph-gallery.com/radar-chart) -- D3-based radar chart patterns

### Accessibility
- [Chart.js Accessibility docs](https://www.chartjs.org/docs/latest/general/accessibility.html) -- ARIA patterns for canvas charts
- [Accessible Data Charts (Sara Soueidan)](https://www.sarasoueidan.com/blog/accessible-data-charts-for-khan-academy-2018-annual-report/) -- data table fallback pattern
- [Deque: How to make interactive charts accessible](https://www.deque.com/blog/how-to-make-interactive-charts-accessible/) -- screen reader best practices
- [W3C ARIA roles for charts](https://www.w3.org/wiki/SVG_Accessibility/ARIA_roles_for_charts) -- ARIA role specifications

### Syntax Highlighting
- [Expressive Code](https://expressive-code.com/key-features/syntax-highlighting/) -- already in use, supports 100+ languages
- [Astro Syntax Highlighting docs](https://docs.astro.build/en/guides/syntax-highlighting/) -- built-in Shiki integration

---
*Feature research for: The Beauty Index content pillar*
*Researched: 2026-02-17*
