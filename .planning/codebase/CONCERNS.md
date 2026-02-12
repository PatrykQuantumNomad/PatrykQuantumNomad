# Codebase Concerns

**Analysis Date:** 2026-02-12

## Tech Debt

**Dark Mode Incomplete — ThemeToggle component exists but has no effect:**
- Issue: `src/components/ThemeToggle.astro` toggles a `.dark` class on `<html>`, but the component is never imported or rendered anywhere. No dark mode CSS variables are defined — `src/styles/global.css` only defines light-mode `:root` variables with no `.dark` or `[data-theme="dark"]` overrides. The `tailwind.config.mjs` has no `darkMode` setting. The Expressive Code integration in `astro.config.mjs` references a `.dark` CSS selector for code themes, but this class is never applied.
- Files: `src/components/ThemeToggle.astro`, `src/styles/global.css`, `tailwind.config.mjs`, `astro.config.mjs`
- Impact: Dead code. If a user somehow triggers it, text and backgrounds become unreadable since no dark palette exists.
- Fix approach: Either implement full dark mode (add `:root.dark` CSS variables, `darkMode: 'class'` in Tailwind config, render `<ThemeToggle />` in `<Header>`) or delete `ThemeToggle.astro` entirely.

**Inline SVG Icons Duplicated Across Multiple Files:**
- Issue: The same SVG icon paths are copy-pasted across 4+ files. The X/Twitter icon path `M18.244 2.25h3.308...` appears in `src/pages/index.astro`, `src/pages/contact.astro`, `src/pages/about.astro`, and `src/components/Footer.astro`. The GitHub icon, YouTube icon, and blog/book icon are similarly duplicated.
- Files: `src/pages/index.astro`, `src/pages/contact.astro`, `src/pages/about.astro`, `src/components/Footer.astro`
- Impact: Any icon change requires editing 4+ files. Risk of inconsistency.
- Fix approach: Create an `src/components/icons/` directory with individual icon components (e.g., `XIcon.astro`, `GitHubIcon.astro`, `YouTubeIcon.astro`) and import them everywhere.

**Social Links Hardcoded in Multiple Places:**
- Issue: Social URLs (GitHub, X, YouTube, Translucent Computing, Kubert AI, email) and the email address `pgolabek@gmail.com` are hardcoded directly in page templates across `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/components/Footer.astro`, and `src/components/PersonJsonLd.astro`. The site config at `src/data/site.ts` only stores name, title, description, tagline, roles, and URL — no social links.
- Files: `src/data/site.ts`, `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/components/Footer.astro`, `src/components/PersonJsonLd.astro`
- Impact: Changing a social URL or email requires editing 5+ files. Error-prone.
- Fix approach: Add a `socials` object to `src/data/site.ts` with all social URLs and the email address. Import and reference it everywhere.

**Tech Stack Data Hardcoded in About Page:**
- Issue: The `techStack` and `highlights` arrays are defined inline in `src/pages/about.astro` (lines 12-60) rather than in a data file.
- Files: `src/pages/about.astro`
- Impact: Minor — the data is only used on one page. But if tech stack data is needed elsewhere (e.g., structured data, resume generation), it would need to be extracted.
- Fix approach: Move `techStack` and `highlights` to `src/data/about.ts` or `src/data/site.ts`.

**Hardcoded Author Name in Non-Config Files:**
- Issue: "Patryk Golabek" is hardcoded as a raw string in `src/components/BlogPostingJsonLd.astro` (lines 24, 29), `src/components/SEOHead.astro` (line 35), `src/components/Footer.astro` (line 33), `src/pages/rss.xml.ts` (line 15), and multiple page title strings. These should reference `siteConfig.name` from `src/data/site.ts`.
- Files: `src/components/BlogPostingJsonLd.astro`, `src/components/SEOHead.astro`, `src/components/Footer.astro`, `src/pages/rss.xml.ts`, `src/pages/llms.txt.ts`
- Impact: If the site owner's name display changes, many files need manual editing.
- Fix approach: Import `siteConfig` in all components that reference the author name.

## Performance Concerns

**Particle Canvas O(n^2) Connection Algorithm:**
- Issue: The particle connection drawing in `src/components/ParticleCanvas.astro` uses a nested loop comparing every particle pair (lines 167-183). With 160 particles on desktop, this performs ~12,800 distance calculations per frame at 60fps.
- Files: `src/components/ParticleCanvas.astro`
- Impact: On lower-end devices, this can cause frame drops. The `getAccentColor()` function also calls `getComputedStyle()` on every frame (line 128), which triggers a style recalculation.
- Fix approach: Cache the accent color RGB value (only recalculate on theme change). For the connection algorithm, use spatial partitioning (grid-based bucketing) to reduce pair checks, or reduce `CONNECTION_DIST` / particle count.

**Google Fonts Loaded as Render-Blocking CSS:**
- Issue: Three Google Font families are loaded via a standard `<link rel="stylesheet">` in `src/layouts/Layout.astro` (lines 61-66). This is render-blocking.
- Files: `src/layouts/Layout.astro`
- Impact: Delays First Contentful Paint. Font fallback metrics are defined in `src/styles/global.css` (lines 24-39) which helps reduce CLS, but the download still blocks rendering.
- Fix approach: Add `media="print" onload="this.media='all'"` pattern, or use `<link rel="preload">` with `as="style"`, or self-host the fonts (some are already available locally in `src/assets/fonts/` for OG image generation).

**Multiple `will-change` Declarations Active Simultaneously:**
- Issue: `src/styles/global.css` applies `will-change` to `[data-reveal]` elements (line 75), custom cursor elements (lines 336, 355), and floating orbs (line 380). On pages with many reveal elements, cards, and cursor active, this creates many compositor layers.
- Files: `src/styles/global.css`
- Impact: Increased GPU memory usage, potential jank on memory-constrained devices.
- Fix approach: Only apply `will-change` just before animation starts and remove it after. For `[data-reveal]`, the GSAP scroll-triggered animation already handles GPU promotion.

**Large Image: kaiju.png at 884KB:**
- Issue: `src/assets/images/kaiju.png` is 884KB. While Astro's `<Image>` component optimizes at build time, the source PNG is larger than necessary.
- Files: `src/assets/images/kaiju.png`
- Impact: Slower build times. The optimized output is still larger than comparable JPEGs.
- Fix approach: Convert to WebP or JPEG source if transparency is not needed (it is used as a photo, not as an overlay).

## Accessibility Concerns

**Missing Favicon and Apple Touch Icon:**
- Issue: No `<link rel="icon">` or `<link rel="apple-touch-icon">` is defined anywhere. The `public/` directory contains only `CNAME` and `robots.txt` — no `favicon.ico`, `favicon.svg`, or other icon files.
- Files: `src/layouts/Layout.astro`, `public/`
- Impact: Browsers show a generic icon. Safari tabs and iOS home screen bookmarks have no branding. Some crawlers report this as an error.
- Fix approach: Create a favicon (SVG preferred for scalability) and add it to `public/`. Add `<link rel="icon">` to `src/layouts/Layout.astro`.

**LinkedIn Link Missing from UI (Present Only in Structured Data):**
- Issue: LinkedIn (`https://www.linkedin.com/in/patrykgolabek/`) appears in the `sameAs` array of `src/components/PersonJsonLd.astro` but is not linked anywhere visible in the About, Contact, or Footer pages.
- Files: `src/components/PersonJsonLd.astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/components/Footer.astro`
- Impact: Key professional networking platform is not discoverable by human visitors. Recruiters cannot easily find the LinkedIn profile from the site.
- Fix approach: Add a LinkedIn link with icon to the About page social links section, Contact page, and Footer.

**Hero Headline Starts With `opacity: 0` — No JS Fallback:**
- Issue: In `src/pages/index.astro` (line 37), the `<h1>` has `style="opacity: 0;"` and relies on `TextScramble.astro` JavaScript to reveal it. If JS fails to load or execute, the page title is invisible.
- Files: `src/pages/index.astro`, `src/components/animations/TextScramble.astro`
- Impact: Without JS, the most important content on the homepage is hidden.
- Fix approach: Use a `<noscript>` style block or CSS-only fallback that sets opacity to 1 when JS has not initialized, e.g., add `[data-animate="headline"] { opacity: 1; }` as a default and let JS override.

**Custom Cursor Runs an Infinite `requestAnimationFrame` Loop:**
- Issue: In `src/components/animations/CustomCursor.astro` (lines 58-72), the cursor animation loop runs continuously via `requestAnimationFrame` and never stops — even when the browser tab is visible but the user is not moving the mouse.
- Files: `src/components/animations/CustomCursor.astro`
- Impact: Continuous CPU/GPU usage on desktop, wasting battery. Unlike the particle canvas which pauses on `visibilitychange`, the cursor loop has no pause mechanism.
- Fix approach: Add a `visibilitychange` listener to pause the loop, or switch to a passive event-driven approach (only update on `mousemove`).

**Typing Role Animation Uses Recursive `cycle()` Without Cleanup:**
- Issue: In `src/components/animations/SplitText.astro` (lines 26-33), the `cycle()` function recursively calls itself via `setTimeout` without any cancellation mechanism. When navigating away via view transitions and returning, a new cycle starts without stopping the previous one.
- Files: `src/components/animations/SplitText.astro`
- Impact: Multiple overlapping typing animations can run simultaneously after several page navigations, causing visual glitches.
- Fix approach: Store the timeout ID and clear it on `astro:before-swap`. Use a flag or AbortController pattern to stop the previous cycle.

## SEO Concerns

**Missing `twitter:site` and `twitter:creator` Meta Tags:**
- Issue: `src/components/SEOHead.astro` includes `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image`, but omits `twitter:site` and `twitter:creator` which attribute the content to the author's X account.
- Files: `src/components/SEOHead.astro`
- Impact: Shared links on X do not link back to the @QuantumMentat account.
- Fix approach: Add `<meta name="twitter:site" content="@QuantumMentat" />` and `<meta name="twitter:creator" content="@QuantumMentat" />` to `src/components/SEOHead.astro`.

**No OG Image for Non-Blog Pages:**
- Issue: OG images are generated dynamically for blog posts via `src/pages/open-graph/[...slug].png.ts`, but the homepage, about, contact, projects, and blog index pages have no `ogImage` prop passed to `<Layout>`. The `<SEOHead>` component conditionally renders `og:image` only when `ogImage` is provided.
- Files: `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/projects/index.astro`, `src/pages/blog/index.astro`, `src/components/SEOHead.astro`
- Impact: When these pages are shared on social media, they show no preview image — significantly reducing click-through rates.
- Fix approach: Create a static default OG image (e.g., `public/og-default.png`) and set it as the fallback in `<SEOHead>` when no `ogImage` prop is provided.

**OG Image Color Scheme Mismatch:**
- Issue: The OG image generator in `src/lib/og-image.ts` uses a dark blue/purple color scheme (`#0a0a1a` background, `#7c73ff` accent) that does not match the site's tropical sunset palette (`#fffaf7` background, `#c44b20` accent).
- Files: `src/lib/og-image.ts`, `src/styles/global.css`
- Impact: Brand inconsistency between the live site and social media previews.
- Fix approach: Update `src/lib/og-image.ts` to use the site's actual color palette from CSS variables.

**Blog Post Count Hardcoded in Projects Page Description:**
- Issue: `src/pages/projects/index.astro` (line 13) hardcodes "16 open-source projects" in the meta description. The actual count may change as projects are added or removed from `src/data/projects.ts`.
- Files: `src/pages/projects/index.astro`, `src/data/projects.ts`
- Impact: Stale meta description when project count changes.
- Fix approach: Use `projects.length` dynamically in the description string.

## Security Concerns

**Email Address Exposed in Plaintext:**
- Issue: `pgolabek@gmail.com` appears as plaintext in `src/pages/index.astro`, `src/pages/about.astro`, and `src/pages/contact.astro` (both as `mailto:` links and visible text). This is easily harvestable by spam bots.
- Files: `src/pages/index.astro` (line 212), `src/pages/about.astro` (line 296), `src/pages/contact.astro` (lines 20, 36)
- Impact: Increased spam to personal email.
- Fix approach: Use JavaScript-based email obfuscation, a contact form service, or encode the email address. At minimum, consider using a professional domain email instead.

**No Content Security Policy (CSP) Headers:**
- Issue: No CSP headers are configured anywhere — no meta tag CSP in `src/layouts/Layout.astro`, no header configuration in `astro.config.mjs`, and no `_headers` file in `public/`. The site loads external resources from `fonts.googleapis.com` and `fonts.gstatic.com`.
- Files: `src/layouts/Layout.astro`, `astro.config.mjs`, `public/`
- Impact: No protection against XSS via injected scripts. GitHub Pages does serve basic security headers, but CSP is not one of them.
- Fix approach: Add a `<meta http-equiv="Content-Security-Policy">` tag to `src/layouts/Layout.astro` or create `public/_headers` if the hosting supports it.

## Maintenance Risks

**No Test Suite:**
- Issue: The project has zero test files — no unit tests, integration tests, or end-to-end tests. No test framework is configured in `package.json`. No testing dependencies.
- Files: `package.json`
- Impact: Changes to data schemas, RSS generation, OG image generation, or blog collection logic cannot be verified automatically. Regressions are only caught manually.
- Fix approach: Add Vitest for unit testing key modules (`src/lib/og-image.ts`, `src/data/projects.ts`, `remark-reading-time.mjs`). Consider Playwright for basic E2E smoke tests.

**No Linting or Formatting Configuration:**
- Issue: No `.eslintrc`, `.prettierrc`, `eslint.config.js`, `biome.json`, or any other linting/formatting configuration exists. No linting dependencies in `package.json`.
- Files: Project root
- Impact: No enforced code style. Inconsistencies can creep in over time, especially with multiple contributors or AI-assisted coding.
- Fix approach: Add Biome (fast, zero-config alternative to ESLint+Prettier) or at minimum Prettier for consistent formatting.

**No `package.json` Type-Check Script:**
- Issue: `package.json` has `@astrojs/check` as a dependency but no `check` or `typecheck` script defined. Only `dev`, `build`, and `preview` scripts exist.
- Files: `package.json`
- Impact: TypeScript type checking is not easily runnable and is not part of CI. Type errors may not be caught before deployment.
- Fix approach: Add `"check": "astro check"` to `package.json` scripts and add it to the CI workflow.

**CI Pipeline Has No Build Verification Beyond Default:**
- Issue: `.github/workflows/deploy.yml` uses `withastro/action@v3` which runs `astro build`, but there is no type checking, no linting, and no test step.
- Files: `.github/workflows/deploy.yml`
- Impact: Broken TypeScript types, malformed data, or runtime errors deploy to production unchecked.
- Fix approach: Add steps for `astro check`, linting, and tests before the build step.

**OG Image Fonts Differ from Site Fonts:**
- Issue: `src/lib/og-image.ts` uses Inter and Space Grotesk fonts (loaded from `src/assets/fonts/`), but the actual site uses Bricolage Grotesque (headings), DM Sans (body), and Fira Code (mono) loaded from Google Fonts. The bundled `.woff` files are only for OG image generation.
- Files: `src/lib/og-image.ts`, `src/assets/fonts/`, `src/layouts/Layout.astro`, `tailwind.config.mjs`
- Impact: Visual inconsistency between OG images and the live site.
- Fix approach: Download Bricolage Grotesque and DM Sans as `.woff` files for OG image generation, or accept the current divergence as intentional.

## Improvement Opportunities

**Quick Wins:**
- Add favicon and apple-touch-icon to `public/` and reference in `src/layouts/Layout.astro`
- Add `twitter:site` and `twitter:creator` meta tags to `src/components/SEOHead.astro`
- Add LinkedIn link to About, Contact, and Footer
- Add `"check": "astro check"` script to `package.json`
- Fix hero `opacity: 0` with a CSS `<noscript>` fallback
- Add a default OG image fallback in `src/components/SEOHead.astro`
- Fix hardcoded project count "16" in `src/pages/projects/index.astro`

**Medium-Effort Improvements:**
- Extract inline SVG icons to `src/components/icons/` directory
- Centralize social links in `src/data/site.ts`
- Replace hardcoded "Patryk Golabek" strings with `siteConfig.name` references
- Cache accent color in particle canvas to avoid per-frame `getComputedStyle()`
- Add `visibilitychange` pause to custom cursor animation loop
- Fix typing role animation cleanup for view transitions
- Self-host Google Fonts to eliminate render-blocking external requests

**Larger Refactoring Opportunities:**
- Implement dark mode fully or remove `ThemeToggle.astro`
- Add Vitest + basic test coverage for data modules and utilities
- Add Biome or Prettier for code formatting
- Enhance CI pipeline with type checking, linting, and tests
- Update OG image colors to match site palette
- Consider spatial partitioning for particle canvas connections on mobile

---

*Concerns audit: 2026-02-12*
