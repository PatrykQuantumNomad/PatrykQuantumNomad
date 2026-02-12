# Architecture

**Analysis Date:** 2026-02-12

## Pattern Overview

**Overall:** Static Site Generation (SSG) with Astro

**Key Characteristics:**
- 100% static output (`output: 'static'` in `astro.config.mjs`) -- all pages pre-rendered at build time
- Client-side View Transitions via Astro `ClientRouter` for SPA-like navigation without a JS framework
- Data-attribute-driven animation system layered on top of static HTML
- CSS custom properties (design tokens) for theming with no dark mode (light-only "Tropical Sunset" palette)
- Content collection for blog posts with both local Markdown and external URL references

## Layers

**Layouts Layer:**
- Purpose: Wraps all pages with shared HTML shell, head metadata, navigation, and animation bootstrapping
- Location: `src/layouts/Layout.astro`
- Contains: Single layout file with `<head>`, `<Header>`, `<main><slot/></main>`, `<Footer>`, and all global animation component scripts
- Depends on: `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/SEOHead.astro`, all animation components in `src/components/animations/`
- Used by: Every page in `src/pages/`

**Pages Layer:**
- Purpose: Route definitions and page-level content/logic
- Location: `src/pages/`
- Contains: `.astro` page files, API routes (`.ts` files for RSS, OG images, llms.txt)
- Depends on: Layout, components, data files, content collections
- Used by: Astro router (file-based routing)

**Components Layer:**
- Purpose: Reusable UI elements and animation controllers
- Location: `src/components/` and `src/components/animations/`
- Contains: Astro components (`.astro`) -- no React/Vue/Svelte; all server-rendered with inline `<script>` for interactivity
- Depends on: CSS custom properties from `src/styles/global.css`, GSAP, vanilla-tilt
- Used by: Pages and Layout

**Data Layer:**
- Purpose: Static data sources and content configuration
- Location: `src/data/` and `src/content.config.ts`
- Contains: Site config (`src/data/site.ts`), project catalog (`src/data/projects.ts`), blog content collection (`src/data/blog/`)
- Depends on: Nothing
- Used by: Pages, components, API routes

**Lib Layer:**
- Purpose: Shared TypeScript modules for animation lifecycle and OG image generation
- Location: `src/lib/`
- Contains: `animation-lifecycle.ts` (GSAP/Lenis cleanup), `scroll-animations.ts` (scroll-triggered reveals), `smooth-scroll.ts` (Lenis init), `og-image.ts` (Satori-based OG image generation)
- Depends on: GSAP, Lenis, Satori, Sharp
- Used by: Layout (animation modules), OG image API route (`og-image.ts`)

**Styles Layer:**
- Purpose: Global CSS, design tokens, animation styles, and utility classes
- Location: `src/styles/global.css`
- Contains: CSS custom properties (color palette), Tailwind directives, component-level CSS (cards, cursors, orbs, etc.)
- Depends on: Tailwind CSS framework
- Used by: Everything via Tailwind + CSS custom properties

## Data Flow

**Page Render Flow (Build Time):**

1. Astro resolves file-based routes from `src/pages/`
2. Pages import Layout and pass props (title, description, SEO metadata)
3. Layout renders `<SEOHead>` with meta tags, canonical URLs, Open Graph tags
4. Page fetches blog posts via `getCollection('blog')` from content collection
5. Content collection uses glob loader to read Markdown from `src/data/blog/`
6. Static HTML output written to `dist/`

**Blog Post Flow:**

1. Content defined in `src/data/blog/` as `.md` files with Zod-validated frontmatter (via `src/content.config.ts`)
2. Posts can be local (full Markdown rendered) or external (redirect URL + metadata only)
3. `remark-reading-time.mjs` plugin injects reading time into frontmatter at build
4. Dynamic route `src/pages/blog/[slug].astro` uses `getStaticPaths()` to generate pages for non-external posts
5. Tag pages generated dynamically via `src/pages/blog/tags/[tag].astro`
6. OG images generated at build time via `src/pages/open-graph/[...slug].png.ts` using Satori + Sharp

**Client-Side Navigation Flow:**

1. `ClientRouter` from `astro:transitions` enables view transitions
2. On navigation: `astro:before-swap` fires -- `cleanupAnimations()` kills all GSAP ScrollTriggers, Lenis instance, and GSAP tweens
3. On page load: `astro:page-load` fires -- re-initializes smooth scroll, scroll animations, and all animation components
4. Particle canvas hero uses `transition:persist="particle-hero"` to survive page transitions without re-rendering

**Animation Initialization Flow:**

1. Layout `<script>` listens for `astro:page-load` and calls `initAll()`
2. `initSmoothScroll()` creates Lenis instance (desktop only, respects reduced motion)
3. `initScrollAnimations()` sets up GSAP ScrollTrigger batches for `[data-reveal]`, parallax, dividers, tech pills, card groups
4. Each animation component (`TiltCard`, `CustomCursor`, `MagneticButton`, etc.) independently listens for `astro:page-load`
5. On `astro:before-swap`, cleanup functions destroy ScrollTriggers, Lenis, and vanilla-tilt instances

**State Management:**
- No client-side state management framework
- Animation state managed via module-level variables in `src/lib/animation-lifecycle.ts` (Lenis instance reference)
- Custom cursor state persisted on `window.__cursorState` to survive view transitions
- Particle canvas state persisted on `window.__heroAnimationId` and `window.__particleListenersReady`
- Theme toggle uses `localStorage` for persistence (via `ThemeToggle.astro`, not currently wired into Layout)

## Key Abstractions

**Data Attributes for Animation Binding:**
- Purpose: Declarative animation triggers -- components scan the DOM for data attributes rather than receiving props
- Examples: `data-reveal`, `data-tilt`, `data-magnetic`, `data-word-reveal`, `data-animate="headline"`, `data-section-bg`, `data-parallax`, `data-timeline`, `data-card-group`, `data-card-item`, `data-divider-reveal`
- Pattern: Add the data attribute to any HTML element; the corresponding animation component (loaded once in Layout) handles initialization on `astro:page-load`

**Content Collection (Blog):**
- Purpose: Type-safe blog content with Zod schema validation
- Examples: `src/content.config.ts`, `src/data/blog/*.md`
- Pattern: Frontmatter schema enforces required fields (title, description, publishedDate) and optional fields (externalUrl, source, draft, tags). External posts have `externalUrl` and `source` fields; local posts have full Markdown body.

**Site Config:**
- Purpose: Single source of truth for site-wide metadata
- Examples: `src/data/site.ts`
- Pattern: Export a const object with `name`, `jobTitle`, `description`, `tagline`, `roles`, `url`. Used by pages, JSON-LD components, and meta tags.

**SEO Components:**
- Purpose: Structured data and social sharing metadata
- Examples: `src/components/SEOHead.astro`, `src/components/PersonJsonLd.astro`, `src/components/BlogPostingJsonLd.astro`
- Pattern: Each component accepts typed props and renders meta tags or JSON-LD `<script>` blocks. SEOHead handles Open Graph, Twitter Cards, and canonical URLs.

## Entry Points

**Astro Build Entry:**
- Location: `astro.config.mjs`
- Triggers: `astro build` / `astro dev`
- Responsibilities: Configures integrations (MDX, Tailwind, Sitemap, Expressive Code), sets site URL, registers remark plugins

**Home Page:**
- Location: `src/pages/index.astro`
- Triggers: Route `/`
- Responsibilities: Hero section with particle canvas, typing animation, skills grid, latest blog posts, contact CTA, Person JSON-LD

**Blog Dynamic Routes:**
- Location: `src/pages/blog/[slug].astro`
- Triggers: Route `/blog/{slug}/`
- Responsibilities: Renders individual blog post with TOC, reading time, tags, BlogPosting JSON-LD, OG image

**API Endpoints:**
- Location: `src/pages/rss.xml.ts`, `src/pages/llms.txt.ts`, `src/pages/open-graph/[...slug].png.ts`
- Triggers: Routes `/rss.xml`, `/llms.txt`, `/open-graph/blog/{slug}.png`
- Responsibilities: RSS feed generation, LLM-friendly text index, dynamic OG image generation (Satori + Sharp)

## Error Handling

**Strategy:** Minimal -- static site with no runtime errors in production. Build-time errors caught by Astro/TypeScript.

**Patterns:**
- Content validation via Zod schema in `src/content.config.ts` -- malformed frontmatter fails the build
- Draft filtering: `import.meta.env.PROD ? data.draft !== true : true` -- drafts visible in dev, hidden in production
- External URL filtering: `getStaticPaths` excludes posts with `externalUrl` from page generation (no empty pages)
- Animation graceful degradation: Every animation checks `prefers-reduced-motion` and `pointer: coarse` before initializing
- Particle canvas has `requestAnimationFrame` retry if container has zero height (layout not ready)

## Cross-Cutting Concerns

**Accessibility:**
- Skip-to-content link in Layout
- `aria-label`, `aria-hidden`, `aria-current`, `aria-expanded`, `aria-controls` used throughout
- Custom cursor, animations, and smooth scroll all disable for `prefers-reduced-motion: reduce`
- Focus-visible outlines defined in `src/styles/global.css`

**SEO:**
- Canonical URLs on every page via `src/components/SEOHead.astro`
- Open Graph + Twitter Card meta on all pages
- JSON-LD structured data: Person (homepage), BlogPosting (blog posts)
- Auto-generated sitemap via `@astrojs/sitemap`
- RSS feed at `/rss.xml`
- LLM-friendly index at `/llms.txt`
- Dynamic OG images per blog post

**Performance:**
- Static output (CDN-friendly)
- Image optimization via Astro `<Image>` component (automatic WebP conversion)
- Font fallback metrics in CSS to reduce CLS
- Particle canvas pauses on `visibilitychange` (tab hidden)
- Lenis smooth scroll disabled on touch devices
- `is:inline` script on ParticleCanvas avoids Astro bundling (runs immediately)

**View Transitions:**
- Clip-path page exit/enter animations defined in `src/styles/global.css`
- Reduced-motion fallback to simple fade
- `transition:persist` on particle hero and custom cursor elements

---

*Architecture analysis: 2026-02-12*
