# Pitfalls Research: The Beauty Index

**Domain:** Adding interactive data visualization, shareable chart images, and large-scale code comparison pages to an existing Astro 5 static portfolio site
**Researched:** 2026-02-17
**Confidence:** HIGH (verified against codebase analysis, Astro docs, Chart.js CSP issues, web performance research, and accessibility standards)

**Context:** This is a SUBSEQUENT milestone pitfalls document. The site (patrykgolabek.dev) is a live Astro 5 static site with Lighthouse 90+ scores, GSAP animations, React Three Fiber for the 3D hero, Expressive Code for syntax highlighting, Satori-based OG image generation, dark/light theme toggle, and a strict Content Security Policy meta tag. These pitfalls are specific to the risk of degrading existing performance, accessibility, and SEO while adding interactive charts, 250 code blocks, 25 language detail pages, and chart-to-image sharing.

---

## Critical Pitfalls

### Pitfall 1: Chart Libraries Destroy Lighthouse Performance Score by Shipping Too Much JavaScript

**What goes wrong:**
The current site ships minimal client-side JavaScript. The only hydrated React component is the Three.js 3D head scene (`HeadScene.tsx` via `client:visible`). Adding a charting library like Chart.js (63KB min+gzip), Recharts (42KB + React), or D3.js (80KB+) to every language page and the comparison page will balloon the JavaScript payload. If charts are loaded eagerly on page load, Total Blocking Time (TBT) spikes, First Contentful Paint (FCP) degrades, and the Lighthouse performance score drops from 90+ to 70 or below. This is especially devastating because the site's current near-perfect scores are a competitive differentiator.

The site already loads GSAP (26KB gzip), Lenis (4KB), Three.js (~150KB gzip via the 3D head scene), and React (~45KB gzip). Adding another charting library on top of these pushes the total JavaScript well past the 300KB "performance budget" threshold where Lighthouse starts penalizing.

**Why it happens:**
Developers reach for full-featured charting libraries because they handle axes, tooltips, animations, and responsive behavior. But for radar/spider charts with only 6 data points per language and bar charts comparing 25 languages on a single dimension, these libraries are massive overkill. The data is static (known at build time) and the shapes are simple (polygons and rectangles).

**How to avoid:**
1. **Use hand-crafted SVG for radar charts.** A radar/spider chart with 6 axes and 6 data points is a single `<polygon>` element inside an `<svg>` with 6 labeled axis lines. This is roughly 30 lines of Astro template code, zero JavaScript, zero bundle size, and renders instantly as static HTML. The data is known at build time -- there is no reason to use a JavaScript charting library for static data.
2. **Use CSS-only bar charts for comparison views.** Bar charts comparing scores across 25 languages can be pure CSS with `width` percentages on colored `<div>` elements. Zero JavaScript. Lighthouse will not penalize this at all.
3. **If interactivity is needed (tooltips, hover effects), use vanilla JS or GSAP** (already loaded). A tooltip on hover is 20 lines of vanilla JS, not a 60KB library.
4. **Reserve `client:visible` for genuinely interactive features only.** If a chart component needs JavaScript (e.g., for animated drawing), use `client:visible` so it only loads when scrolled into view.
5. **Set a performance budget:** Total page JavaScript must stay under 200KB gzip for any new page. Run `npx astro build && npx lighthouse --budget-path=budget.json` as part of CI.

**Warning signs:**
- Any `npm install chart.js` or `npm install d3` in the project
- `client:load` directive on any chart component (should be `client:visible` at minimum)
- Lighthouse Performance score drops below 90 after adding chart pages
- TBT exceeds 200ms on any Beauty Index page

**Phase to address:**
The very first phase: chart component design. Decide on SVG-first, no-library approach BEFORE writing any chart code.

---

### Pitfall 2: 250 Code Blocks on the Comparison Page Explode Build Time and DOM Size

**What goes wrong:**
The code comparison page has 25 languages times 10 features = 250 code blocks. Expressive Code (astro-expressive-code) processes each code block through Shiki for syntax highlighting at build time, generating unique CSS class mappings and HTML for each block. With 250 blocks on a single page:

1. **Build time:** Each Shiki-highlighted block takes 50-200ms to process. 250 blocks = 12-50 seconds just for this one page, potentially doubling the total site build time. Known Astro issue: multiple Code components on a single page slow dev server significantly (GitHub issue #3123).
2. **DOM size:** Each syntax-highlighted code block generates 20-50 DOM elements (spans for tokens, line numbers, wrapper divs). 250 blocks = 5,000-12,500 extra DOM elements. Lighthouse flags pages with >1,500 DOM elements as "Excessive DOM Size" and penalizes the performance score.
3. **Page weight:** Each highlighted code block includes inline styles for token colors. 250 blocks could add 200-500KB of HTML markup to a single page.

**Why it happens:**
The natural approach is to render all 250 code blocks into a single page with tabs for filtering. This works fine for 5-10 code blocks but breaks at 250 because every block is in the DOM even if hidden by CSS (`display: none`). The browser still parses and styles all of them.

**How to avoid:**
1. **Tab-based lazy rendering is essential.** Do NOT render all 250 code blocks in the initial HTML. Instead:
   - Render only the active tab's code blocks (10 blocks for the selected language OR 25 blocks for the selected feature).
   - Use Astro's `client:visible` on a lightweight tab controller that swaps content.
   - Store code block HTML in `<template>` elements or `data-*` attributes and inject them into the DOM only when the tab is selected.
2. **Consider splitting into separate pages** instead of a single mega-page. Instead of one comparison page with 250 code blocks, have a comparison page with 10 feature tabs where each tab loads 25 short snippets. Or 25 language tabs where each tab loads 10 snippets. Either way, only 10-25 blocks are in the DOM at once.
3. **Pre-render code blocks as static HTML fragments** using Astro's build pipeline, then dynamically load them via fetch when a tab is clicked. This keeps the initial page payload small while avoiding runtime syntax highlighting.
4. **Use Astro's built-in `<Code />` component** rather than Expressive Code for the comparison page if Expressive Code's features (copy button, frames, etc.) are not needed for short snippets. The built-in component is lighter.

**Warning signs:**
- Build time exceeds 30 seconds for the comparison page alone
- Lighthouse reports "Excessive DOM Size" (>1,500 elements)
- Browser DevTools shows >500ms of "Parse HTML" in the Performance tab
- Users on mobile experience janky scrolling or unresponsive tab switching

**Phase to address:**
The code comparison architecture phase. The tab/lazy-loading strategy must be decided BEFORE building the comparison page.

---

### Pitfall 3: Chart-to-Image Sharing Hits CSP Violations and Cross-Browser Failures

**What goes wrong:**
The "share your chart as an image" feature requires converting DOM elements (SVG charts, surrounding text) into a raster image (PNG) that users can download or share to social media. The standard approaches all have serious issues on this specific site:

1. **`html2canvas` / `dom-to-image`:** These libraries screenshot DOM elements by cloning them into a `<canvas>`. But the site has a strict Content Security Policy meta tag that restricts `script-src` and `style-src`. `html2canvas` injects inline styles and creates blob URLs, which can be blocked by the CSP.
2. **Canvas `toDataURL()`:** Requires the canvas to not be "tainted" by cross-origin resources. If the chart SVG references Google Fonts via CSS (the site uses Google Fonts for DM Sans, Bricolage Grotesque, Fira Code), the canvas is tainted and `toDataURL()` throws a SecurityError.
3. **`html2canvas` performance:** Monday.com's engineering team reported that capturing 10 DOM widgets took 21 seconds. Capturing a full radar chart with labels and styling could take 2-5 seconds on mobile, during which the UI freezes.

Additionally, the site's CSP meta tag explicitly sets `img-src 'self' data: blob:` and `connect-src 'self' ...` which helps, but `style-src 'self' 'unsafe-inline'` is already required. Chart.js specifically requires `style-src 'unsafe-inline'` for canvas element dimension setting (GitHub issue #8108), and removing it breaks chart rendering entirely.

**Why it happens:**
DOM-to-image conversion is fundamentally fragile. It works by serializing the DOM into an intermediate format (SVG foreignObject or canvas), which requires all resources (fonts, images, styles) to be available inline. External resources, CSP restrictions, and browser security models all create failure modes that are invisible during development but break in production.

**How to avoid:**
1. **Generate shareable images at build time using Satori, not at runtime.** The site already has a Satori + Sharp pipeline for OG images (`src/lib/og-image.ts`). Extend this same pipeline to generate "shareable chart cards" for each language at build time. This avoids ALL runtime DOM-to-image issues, CSP problems, and cross-browser inconsistencies.
2. **The Satori approach:** For each of the 25 languages, generate a pre-rendered PNG at build time showing the radar chart, language name, and scores. Store these as static assets in `/beauty-index/share/{language}.png`. The "Share" button simply links to this pre-built image.
3. **If runtime image generation is truly needed** (e.g., user customizes the chart), use a server endpoint (Astro SSR endpoint or serverless function) that runs Satori on the server side with the same approach as OG image generation. This sidesteps all client-side CSP and canvas security issues.
4. **Do NOT use `html2canvas` or `dom-to-image`.** These libraries are fragile, slow on mobile, break under strict CSP, and produce inconsistent results across browsers.

**Warning signs:**
- Console errors mentioning "Refused to apply inline style" or "SecurityError: tainted canvas"
- Share button works in Chrome dev mode but fails on production deployment
- Share images render with missing fonts, wrong colors, or broken layout
- UI freezes for 2+ seconds when user clicks "Share"

**Phase to address:**
The chart sharing/social image phase. Choose the Satori build-time approach in the design phase, not after implementing runtime DOM capture.

---

### Pitfall 4: Dark Mode Theme Mismatch Causes Invisible Charts and Broken Visuals

**What goes wrong:**
The site has a dark/light theme toggle that adds/removes a `.dark` class on `<html>` and stores the preference in `localStorage`. However, upon inspection of the codebase, there are NO dark mode CSS custom properties defined anywhere. The global CSS defines light-mode variables only:

```css
:root {
  --color-surface: #fffaf7;
  --color-text-primary: #2c2c2c;
  --color-accent: #c44b20;
  /* ... */
}
```

There is no `.dark { --color-surface: #1a1a2e; ... }` block. The only component that responds to `.dark` is Expressive Code's theme switching (between `github-dark` and `github-light` code block themes). The theme toggle appears to be partially implemented -- it toggles the class but the site does not visually change because no dark mode styles exist.

If charts use CSS custom properties for colors (e.g., `fill: var(--color-accent)` for chart elements, `var(--color-surface)` for backgrounds), they will render identically in both modes. But if charts use hardcoded colors that look good on the light background (`#fffaf7`) but are invisible on a dark background (e.g., light-colored text on dark surface), users who have `.dark` class active (from a previous session's localStorage) will see broken charts.

**Why it happens:**
The dark mode toggle exists as infrastructure but was never completed. Code blocks work because Expressive Code handles its own theming. But new visual elements (charts, comparison tables, score indicators) will need to handle BOTH modes, or the inconsistency becomes glaringly visible on pages with heavy visual content.

**How to avoid:**
1. **Decide on dark mode strategy BEFORE building chart components.** Either:
   - **Option A (recommended for this milestone):** Do NOT support dark mode for Beauty Index pages. The charts and visualizations are complex enough without dual-theming. Remove or disable the dark mode toggle on Beauty Index pages, or ensure it only affects code blocks (which already work).
   - **Option B:** Define the full dark mode color palette in `global.css` before building any chart components. This is a bigger effort but makes all future components consistent.
2. **If using SVG charts with CSS custom properties,** always test both states. Add to the development workflow: after any visual change, click the theme toggle and verify the chart is still visible and readable.
3. **For build-time shareable images (Satori),** hardcode the light theme colors. OG images and share cards should always use the light palette since social media platforms display them on white/light backgrounds.
4. **Expressive Code blocks on the comparison page will work fine** in both modes because this is already handled by the Astro config's `themeCssSelector` setting.

**Warning signs:**
- Chart text is invisible (same color as background)
- Chart lines or fills disappear when theme is toggled
- Radar chart axis labels become unreadable in one mode
- Share images look different from the live chart because they use different color values

**Phase to address:**
The first phase of UI component design. Make the dark mode decision and document it before any visual component work begins.

---

### Pitfall 5: OG Image Generation for 25+ New Pages Significantly Increases Build Time

**What goes wrong:**
The existing OG image pipeline uses Satori + Sharp to generate PNG images for each blog post at build time. The current `[...slug].png.ts` endpoint already iterates over all blog posts. Adding 25 language detail pages plus a main Beauty Index page plus a comparison page = 27+ new OG images to generate at build time.

Each Satori render takes 100-300ms, and Sharp PNG conversion takes another 50-100ms. That's 150-400ms per image. For 27 new pages: 4-11 seconds of additional build time. Combined with the existing blog post OG images, this starts to add up. More critically, if the Beauty Index OG images use more complex layouts (radar charts rendered as SVG inside Satori), the rendering time per image could be 500ms+, pushing total OG generation to 15-20 seconds.

The existing `generateOgImage()` function in `src/lib/og-image.ts` is designed for blog post layouts (title, description, tags). It would need significant modification or a new function to render radar chart visuals in OG images.

**Why it happens:**
Satori renders every OG image from scratch on every build. There is no caching layer. The `sharp` PNG conversion is CPU-bound. Building 50+ images in parallel without throttling can saturate the CPU and cause memory spikes during CI/CD.

**How to avoid:**
1. **Implement OG image caching.** Before generating each image, hash the input data (title, scores, language name). If the hash matches a previously generated image, skip regeneration. Store hashes in a `.cache/og-hashes.json` file. This reduces subsequent builds to near-zero for unchanged content.
2. **Throttle parallel generation** using `p-limit` or similar: `const limit = pLimit(4)` to prevent CPU saturation. Generate at most 4 OG images concurrently.
3. **Create a dedicated `generateBeautyIndexOgImage()` function** rather than overloading the blog OG function. The Beauty Index OG images will have a different layout (radar chart, language name, score summary) than blog OG images (title, description, tags).
4. **Use a separate `[...slug].png.ts` route** for Beauty Index pages (e.g., `src/pages/beauty-index/og/[lang].png.ts`) to keep the OG generation pipeline modular and independently testable.
5. **Consider simpler OG layouts** for language pages. A clean card with the language name, 6 dimension scores as text, and the site branding is faster to render than trying to embed a full radar chart in the OG image.

**Warning signs:**
- Build time exceeds 60 seconds (current build is likely under 30s)
- CI/CD pipeline times out or runs out of memory
- `sharp` throws "Input buffer contains unsupported image format" errors during parallel generation
- OG images for Beauty Index pages are visually broken or cut off

**Phase to address:**
The OG image generation phase. Implement caching and a dedicated generator function before creating all 25+ language OG images.

---

### Pitfall 6: New Pages Lack Proper SEO Infrastructure (JSON-LD, Canonical URLs, Internal Linking)

**What goes wrong:**
The existing site has carefully structured SEO: `PersonJsonLd`, `BlogPostingJsonLd`, `BreadcrumbJsonLd`, `SEOHead` with Open Graph tags, canonical URLs, and sitemap integration. Adding 25+ new pages without matching this SEO infrastructure creates orphan pages that search engines rank poorly. Specifically:

1. **Missing JSON-LD structured data:** Language detail pages should use `SoftwareSourceCode` or `TechArticle` schema. The comparison page should use `Dataset` or `Table` schema. Without this, Google cannot generate rich snippets.
2. **No internal linking strategy:** If the Beauty Index pages only link to each other but not to/from the blog, projects, or home page, they become isolated clusters with low PageRank flow.
3. **Dynamic routes without canonical URLs:** The `[lang].astro` pages must define canonical URLs properly or Google may treat them as duplicate content (25 pages with similar structure).
4. **Sitemap bloat without priority signals:** Adding 27+ pages to the sitemap without `<priority>` and `<lastmod>` dilutes the sitemap's effectiveness.
5. **Missing meta descriptions:** Each of 25 language pages needs a unique, keyword-rich meta description. Using the same description for all 25 pages triggers Google's duplicate content detection.

**Why it happens:**
SEO infrastructure is invisible to users and is often the last thing built. Developers focus on visual design and interactivity, then add SEO tags as an afterthought. But for a portfolio site targeting recruiter and developer discovery, SEO is the primary distribution channel.

**How to avoid:**
1. **Define the SEO template BEFORE building pages.** Create a `BeautyIndexSEO.astro` component that handles title, description, OG image, canonical URL, and JSON-LD for language pages. Use it from day one.
2. **Generate unique meta descriptions from data.** Each language has unique scores and characteristics. Template: "Python scores {score}/10 on The Beauty Index. Explore its {dimension} strengths with radar charts and code examples across {N} features." This is unique per language AND keyword-rich.
3. **Add internal links FROM existing pages TO Beauty Index.** The blog post about The Beauty Index should link to the comparison page. The home page "latest projects" section should feature it. The About page should reference it.
4. **Use `BreadcrumbJsonLd` for navigation hierarchy:** Home > Beauty Index > Python. This helps Google understand the site structure.
5. **Set canonical URLs explicitly** in the `Layout` component for each language page: `https://patrykgolabek.dev/beauty-index/{language}/`.

**Warning signs:**
- Google Search Console shows Beauty Index pages with "Discovered, not indexed" status
- No rich snippets appear in search results for Beauty Index pages
- Beauty Index pages have 0 internal links pointing to them (check with Screaming Frog or similar)
- All 25 language pages share identical meta descriptions in the sitemap

**Phase to address:**
The page scaffolding/routing phase. Build SEO infrastructure INTO the page template from the start, not as a separate SEO phase later.

---

## Moderate Pitfalls

### Pitfall 7: GSAP ScrollTrigger Conflicts with New Interactive Components

**What goes wrong:**
The site's animation lifecycle is tightly managed: `initScrollAnimations()` registers ScrollTriggers on page load, and `cleanupAnimations()` kills them all on page navigation. If Beauty Index pages add their own ScrollTrigger instances (e.g., for animating chart drawing on scroll, or parallax effects on the comparison table), these instances may be orphaned during cleanup or may conflict with the global animation system.

The `cleanupAnimations()` function calls `gsap.killTweensOf('*')` which kills ALL active tweens globally. If a chart is mid-animation when the user navigates away, the cleanup is fine. But if a chart component registers its own cleanup handler that runs AFTER the global cleanup, it will try to kill already-dead tweens, causing console errors.

**How to avoid:**
- Register Beauty Index ScrollTriggers through the existing animation lifecycle, not independently.
- Ensure chart animation components check for element existence before animating: `if (!chartEl) return;`
- If using `client:visible` for chart hydration, the component may hydrate AFTER `initScrollAnimations()` runs. Register new ScrollTriggers inside the component's own lifecycle and call `ScrollTrigger.refresh()` after adding them.
- Do NOT use `ScrollTrigger.refresh()` multiple times in rapid succession (use a debounced wrapper).

**Warning signs:**
- Console errors: "Cannot read properties of null" in animation code after page navigation
- Charts animate but then freeze or jump when scrolling
- Global scroll animations (text reveal, card stagger) stop working on Beauty Index pages

**Phase to address:**
The interactive chart animation phase. Test page navigation TO and FROM Beauty Index pages to verify cleanup works.

---

### Pitfall 8: Greek Symbols and Mathematical Notation Render Inconsistently Across Browsers

**What goes wrong:**
The Beauty Index uses Greek symbols (phi, sigma, etc.) in dimension names, formulas, and explanatory text. The site loads three Google Fonts: Bricolage Grotesque, DM Sans, and Fira Code. None of these fonts include comprehensive Greek character support. When the browser encounters a Greek character in a font that does not include it, it falls back to the system font stack, causing:

1. **Visual inconsistency:** Greek letters render in a different typeface than surrounding text, looking like a font loading error.
2. **Size/baseline misalignment:** System fallback fonts have different metrics, causing layout shifts (CLS) around Greek characters.
3. **Fira Code (monospace) Greek gaps:** If code blocks contain Greek variable names, Fira Code may not render them with the expected monospace width, breaking code alignment.

**How to avoid:**
1. **Use HTML entities or Unicode characters** (`&phi;`, `&Sigma;`, `&#x03C6;`) rather than raw UTF-8 Greek characters in HTML. These are more reliably rendered.
2. **Test Greek rendering in all three site fonts** before using them. DM Sans (body) has good Unicode coverage. Bricolage Grotesque (headings) may not.
3. **For mathematical formulas,** use KaTeX or MathJax ONLY if complex expressions are needed. For simple symbols (phi, sigma), plain Unicode with proper font fallbacks is sufficient and avoids another JS dependency.
4. **Add explicit fallback fonts for Greek:** `font-family: 'DM Sans', 'Noto Sans', system-ui, sans-serif;` -- Noto Sans has complete Greek coverage.
5. **In code blocks,** Fira Code handles basic Greek letters. Test with actual code snippets containing the specific Greek characters used.

**Warning signs:**
- Greek letters appear in a visually different font than surrounding text
- Layout shifts when Greek characters load (measure CLS in Lighthouse)
- Code blocks with Greek variable names have broken alignment

**Phase to address:**
The content creation phase. Test Greek rendering early with actual content samples in all three fonts.

---

### Pitfall 9: Comparison Page Tab Navigation Breaks Keyboard Accessibility and ARIA

**What goes wrong:**
The comparison page will have a tabbed interface (25 language tabs OR 10 feature tabs) that shows/hides code blocks. If this is implemented as a set of `<button>` elements that toggle `display: none` on content panels, several accessibility requirements are commonly missed:

1. **Missing ARIA roles:** Tabs need `role="tablist"` on the container, `role="tab"` on each tab button, and `role="tabpanel"` on each content panel.
2. **Missing `aria-selected`:** The active tab must have `aria-selected="true"`, others `aria-selected="false"`.
3. **No keyboard navigation:** WAI-ARIA tab pattern requires Arrow Left/Right to move between tabs, Home/End to jump to first/last tab, and Enter/Space to activate.
4. **Hidden panels not properly hidden:** Using `display: none` is correct but `aria-hidden="true"` must also be set on inactive panels, and `tabindex="-1"` on their content to prevent keyboard focus from landing on hidden elements.
5. **Focus management:** When activating a tab via keyboard, focus should remain on the tab bar, not jump to the panel content.

The existing site already has good accessibility patterns (skip links, ARIA labels on interactive elements, `prefers-reduced-motion` support). Breaking this standard on the most interactive new pages would be a regression.

**How to avoid:**
1. **Follow the WAI-ARIA Authoring Practices 1.1 Tabs Pattern exactly.** Do not invent a custom tab interaction. The spec is clear and well-tested.
2. **Use a minimal, accessible tab component** that handles all ARIA attributes and keyboard interactions. Build it once, use it for both the language comparison tabs and the feature tabs.
3. **Test with VoiceOver (macOS: Cmd+F5)** after building the tab component. Navigate through tabs using only the keyboard. Verify:
   - Arrow keys move between tab buttons
   - Tab content is announced when activated
   - Hidden panels are not reachable via Tab key
4. **Do not use `<a>` elements for tabs.** Tabs are buttons, not links. Using links causes screen readers to announce them as navigation links, confusing users.

**Warning signs:**
- Lighthouse accessibility score drops below 90
- Tab content is reachable via Tab key when the panel is visually hidden
- Arrow keys do not move between tabs
- VoiceOver announces tabs as "link" instead of "tab"

**Phase to address:**
The comparison page UI phase. Build the accessible tab component FIRST, then add code content.

---

### Pitfall 10: ClientRouter (View Transitions) Cause Stale State on Beauty Index Pages

**What goes wrong:**
The site uses Astro's `<ClientRouter />` (View Transitions API) for smooth page-to-page navigation. When navigating between Beauty Index pages (e.g., from Python's page to JavaScript's page), the client-side router swaps the page content via the View Transitions API. However:

1. **React islands may not re-initialize.** If chart components are React islands with `client:visible`, the View Transition swap replaces the DOM but the React root may not remount properly, leaving a stale or blank chart.
2. **Tab state persists incorrectly.** If the user was viewing "Feature 5" tab on Python's page, then navigates to JavaScript's page, the tab controller may still show "Feature 5" content from Python.
3. **ScrollTrigger positions become invalid.** After a View Transition swap, all GSAP ScrollTrigger positions are calculated against the OLD page's layout. `ScrollTrigger.refresh()` must be called after the swap completes.

The existing site handles this for animations via the `astro:page-load` and `astro:before-swap` events in `Layout.astro`. But Beauty Index components that have their own state (active tab, animation progress, scroll position) need to listen to these events independently.

**How to avoid:**
1. **Listen to `astro:page-load`** in every Beauty Index component that has client-side state. Reset all state on this event:
   ```javascript
   document.addEventListener('astro:page-load', () => {
     resetTabs();
     refreshChartData();
     ScrollTrigger.refresh();
   });
   ```
2. **Listen to `astro:before-swap`** to clean up component-specific resources (event listeners, animation instances).
3. **For React chart islands,** use `client:visible` with a `key` prop tied to the language slug. This forces React to remount the component on navigation instead of reusing the stale instance.
4. **Test the full navigation flow:** Home -> Beauty Index -> Python -> JavaScript -> Back -> Forward. Verify charts render correctly at each step.
5. **Consider using `transition:animate="none"` on chart containers** to prevent the View Transition API from trying to morph between charts on different language pages (which would look glitchy).

**Warning signs:**
- Charts show data from the PREVIOUS language page after navigation
- Tab state persists across page navigations
- Blank spaces where charts should be after using the browser back button
- Console errors about null references to DOM elements after navigation

**Phase to address:**
The page routing/navigation phase. Build navigation testing into the development workflow from the start.

---

## Technical Debt Patterns

Shortcuts that seem reasonable during The Beauty Index build but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using Chart.js/D3 for static data charts | Quick chart rendering with tooltips | 60-80KB JS per page, Lighthouse score tanks, ongoing dependency updates | Never for static data -- use SVG |
| Rendering all 250 code blocks in DOM with `display:none` | Simple implementation, no lazy loading code | >1,500 DOM elements, Lighthouse penalizes, mobile browsers struggle | Never -- lazy render via tabs |
| Using `html2canvas` for chart sharing | Works quickly in development | Fails under strict CSP, slow on mobile, inconsistent across browsers | Never -- use Satori build-time approach |
| Hardcoding chart colors instead of CSS custom properties | Faster development, no theme consideration | Charts break if dark mode is ever completed; inflexible for future theming | MVP only -- migrate to variables before v1.0 of Beauty Index |
| Generating OG images without caching | Simpler build pipeline | Build time grows linearly with content; 27+ images regenerated every build | Only during initial development; add caching before going live |
| Skipping JSON-LD on language pages | Faster page scaffolding | Pages lack rich snippets; search engines cannot understand content structure | Never -- add schema from day one |
| Using generic meta descriptions for all 25 language pages | Less content to write | Google treats as duplicate content; pages may not be indexed | Never -- generate unique descriptions from data |

## Integration Gotchas

Common mistakes when connecting Beauty Index features to existing site infrastructure.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Expressive Code + 250 blocks | Assuming unlimited code blocks per page perform well | Lazy-render via tabs; limit to 10-25 visible blocks at a time |
| Satori OG images + new routes | Extending the blog OG endpoint for completely different layouts | Create a separate OG endpoint for Beauty Index with its own layout function |
| GSAP animations + chart animations | Adding independent ScrollTrigger instances that conflict with global lifecycle | Register through the existing animation lifecycle; listen to `astro:page-load` |
| React islands + View Transitions | Expecting React components to re-render automatically on navigation | Use `key` prop tied to page data; listen to `astro:page-load` for state reset |
| CSP meta tag + Chart.js canvas | Assuming Canvas rendering works under strict CSP | SVG charts avoid CSP entirely; if Canvas is needed, verify `style-src 'unsafe-inline'` is present (it is) |
| Sitemap + 27 new pages | Letting sitemap auto-discover all pages without priority | Configure sitemap serialization to set appropriate `<priority>` and `<changefreq>` for Beauty Index pages |
| Google Fonts + Greek symbols | Assuming body font covers all Unicode characters needed | Test Greek rendering in DM Sans, Bricolage Grotesque, and Fira Code; add fallback font with Greek support |

## Performance Traps

Patterns that work in development but fail at production scale or on real devices.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| All 250 code blocks in DOM | Smooth in Chrome desktop | Tab-based lazy rendering; `<template>` elements for hidden content | Mobile browsers with <4GB RAM; Lighthouse audit |
| Chart animations on scroll with GSAP | Fluid on M-series Mac | Gate animations behind `prefers-reduced-motion`; use `will-change` sparingly | Low-end Android devices; when >5 charts animate simultaneously |
| Satori rendering 27+ images per build | Fast locally with high-end CPU | Implement caching + p-limit(4) throttling | CI/CD with limited CPU; GitHub Actions free tier |
| Google Fonts loaded for chart labels | Fast on cached pages | Ensure fonts are preloaded; use font-display: swap; test with throttled 3G | First visit on slow connection; fonts block chart label rendering |
| Inline SVG radar charts with complex gradients | Renders fine on modern browsers | Test in Safari (gradient rendering differences); avoid `<filter>` elements for performance | Safari mobile; older WebKit versions |

## UX Pitfalls

Common user experience mistakes when building data visualization and code comparison features.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Radar chart with no axis labels | Users cannot tell which axis represents which dimension | Always label each axis; use abbreviations if space is tight, with a legend |
| Color-only encoding on bar charts | Color-blind users (8% of men) cannot distinguish bars | Add patterns, labels, or position encoding alongside color |
| Code comparison tabs with no "active" indicator | Users lose track of which language/feature they are viewing | Bold tab text, underline or background highlight, `aria-selected` for screen readers |
| Share button that downloads a file silently | Users do not realize the download happened; no feedback | Show a toast notification, open a preview modal, or copy to clipboard with confirmation |
| Radar chart that is too small on mobile | 6 dimension labels overlap; chart becomes unreadable | Minimum chart size 280px diameter on mobile; consider a simplified list view as fallback |
| Long-form blog content with no table of contents | Users on the main Beauty Index essay cannot jump to sections | Reuse the existing `TableOfContents.astro` component from the blog infrastructure |
| Tab interface that resets to first tab on every visit | Users exploring multiple tabs lose their place when scrolling away and back | Persist active tab in URL hash (`#python`) so bookmarking and browser back work |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Radar chart renders:** Visually correct -- but verify it has `role="img"`, a `<title>` element, a `<desc>` element for screen readers, `aria-labelledby` linking to both, and alt text that describes the data ("Python scores: Expressiveness 9/10, Readability 9/10, ...")
- [ ] **Code comparison page loads:** All tabs work -- but verify DOM size is under 1,500 elements, hidden tab content is not in the DOM, keyboard navigation works (Arrow keys between tabs), and `aria-selected` updates on tab change
- [ ] **Share button works:** Image downloads -- but verify it works under the production CSP policy, fonts render correctly in the shared image, the image includes the site branding/URL, and the filename is descriptive (`python-beauty-index.png`, not `download.png`)
- [ ] **25 language pages exist:** Routes work -- but verify each has a unique meta description, canonical URL, JSON-LD structured data, OG image, and at least one internal link from another page
- [ ] **Charts look good in light mode:** Visual check passes -- but verify charts are also readable when `.dark` class is present on `<html>` (even if dark mode is not fully implemented, users may have it set in localStorage from previous sessions)
- [ ] **Blog post about Beauty Index published:** Content renders -- but verify it links to the Beauty Index pages (internal linking for SEO), the OG image is generated, it appears in RSS, and it appears in the sitemap
- [ ] **Lighthouse score maintained:** Performance 90+ -- but run Lighthouse on ALL new pages (main page, comparison page, AND a language detail page), not just one. The comparison page is most likely to fail.
- [ ] **Mobile responsive:** Charts resize -- but verify radar chart labels do not overlap at 320px width, tab bar is horizontally scrollable if 25 tabs overflow, and code blocks have horizontal scroll without breaking the page layout

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Chart library bloats JS (P1) | MEDIUM | Replace library charts with hand-crafted SVG; may require rewriting chart components but data layer stays the same |
| 250 code blocks crash DOM (P2) | HIGH | Requires architectural change to lazy-render tabs; existing code blocks need to be refactored into template/fetch pattern |
| Chart sharing fails under CSP (P3) | MEDIUM | Switch from runtime DOM capture to build-time Satori generation; requires new build endpoint but produces more reliable results |
| Dark mode breaks charts (P4) | LOW | Add CSS custom property fallbacks to all chart components; 1-2 hours of work per component |
| OG images slow build (P5) | LOW | Add caching layer to build pipeline; hash-based cache check is ~50 lines of code |
| Missing SEO infrastructure (P6) | MEDIUM | Retrofit JSON-LD, meta descriptions, and internal links; tedious but not architecturally difficult |
| GSAP conflicts (P7) | LOW | Add lifecycle event listeners to chart components; straightforward debugging |
| Greek symbol rendering (P8) | LOW | Add fallback font to font stack; test and fix individual instances |
| Tab accessibility broken (P9) | MEDIUM | Rewrite tab component following WAI-ARIA spec; needs thorough testing with screen reader |
| View Transitions stale state (P10) | MEDIUM | Add `astro:page-load` listeners to all stateful components; requires testing full navigation matrix |

## Pitfall-to-Phase Mapping

How Beauty Index roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Chart library JS bloat (P1) | Chart component design | No charting library in `package.json`; SVG-only charts; Lighthouse Performance 90+ on chart pages |
| 250 code blocks DOM explosion (P2) | Comparison page architecture | DOM element count < 1,500 on comparison page; build time < 30s for comparison page |
| Chart sharing CSP failures (P3) | Social sharing design | Share images generated via Satori at build time; no runtime DOM-to-image code; test under production CSP |
| Dark mode theme mismatch (P4) | UI component design (first phase) | Document dark mode decision; test all charts with `.dark` class present; no invisible elements |
| OG image build time (P5) | OG image generation | Caching implemented; build time increase < 10s for 27 new OG images; dedicated Beauty Index OG endpoint |
| Missing SEO infrastructure (P6) | Page scaffolding/routing | Every language page has unique meta description, canonical URL, JSON-LD, and OG image |
| GSAP ScrollTrigger conflicts (P7) | Chart animation | No console errors during page navigation; global animations still work on Beauty Index pages |
| Greek symbol rendering (P8) | Content creation | Greek characters render in correct font; no layout shifts from font fallback; tested in all three site fonts |
| Tab accessibility (P9) | Comparison page UI | WAI-ARIA tab pattern fully implemented; keyboard navigation works; VoiceOver reads tabs correctly |
| View Transitions stale state (P10) | Page routing/navigation | Navigate Python -> JavaScript -> Back -> Forward with correct chart data at each step |

## Sources

- [Astro Islands Architecture -- Official Docs](https://docs.astro.build/en/concepts/islands/) (HIGH confidence)
- [Astro Syntax Highlighting -- Official Docs](https://docs.astro.build/en/guides/syntax-highlighting/) (HIGH confidence)
- [Astro `<Code />` component slow with many instances -- GitHub Issue #3123](https://github.com/withastro/astro/issues/3123) (HIGH confidence)
- [Astro build performance discussion -- GitHub Roadmap #1112](https://github.com/withastro/roadmap/discussions/1112) (HIGH confidence)
- [Chart.js CSP `style-src 'unsafe-inline'` requirement -- GitHub Issue #8108](https://github.com/chartjs/Chart.js/issues/8108) (HIGH confidence)
- [Chart.js CSP workaround limitations -- GitHub Issue #5208](https://github.com/chartjs/Chart.js/issues/5208) (HIGH confidence)
- [Monday.com DOM-to-Image performance challenges](https://engineering.monday.com/capturing-dom-as-image-is-harder-than-you-think-how-we-solved-it-at-monday-com/) (HIGH confidence)
- [Satori OG image build-time caching for Astro](https://ainoya.dev/posts/astro-ogp-build-cache/) (MEDIUM confidence)
- [SVG Accessibility: Creating Inclusive Vector Graphics](https://www.svgai.org/blog/svg-accessibility-inclusive-design) (MEDIUM confidence)
- [Creating Accessible SVG Charts and Infographics](https://accessibility-test.org/blog/compliance/creating-accessible-svg-charts-and-infographics/) (MEDIUM confidence)
- [Accessible SVG Charts for Khan Academy -- Sara Soueidan](https://www.sarasoueidan.com/blog/accessible-data-charts-for-khan-academy-2018-annual-report/) (HIGH confidence)
- [Accessibility in D3 Bar Charts -- a11y with Lindsey](https://www.a11ywithlindsey.com/blog/accessibility-d3-bar-charts/) (MEDIUM confidence)
- [CLS Optimization -- web.dev](https://web.dev/articles/optimize-cls) (HIGH confidence)
- [Astro Performance Optimization Guide](https://eastondev.com/blog/en/posts/dev/20251202-astro-performance-optimization/) (MEDIUM confidence)
- [Charting Libraries Performance Comparison](https://chart.pdfmunk.com/blog/charting-libraries-performance-comparison) (MEDIUM confidence)
- [SVG Theming Systems: Dark Mode Compatible Vector Graphics](https://www.svgai.org/blog/svg-theming-systems) (MEDIUM confidence)
- Codebase analysis: `astro.config.mjs`, `Layout.astro`, `global.css`, `ThemeToggle.astro`, `og-image.ts`, `animation-lifecycle.ts`, `HeadSceneWrapper.astro`, CSP meta tag (HIGH confidence -- direct code inspection)

---
*Pitfalls research for: The Beauty Index -- adding interactive data visualization, chart sharing, and large-scale code comparison to existing Astro 5 portfolio site*
*Researched: 2026-02-17*
