# Architecture

**Analysis Date:** 2026-02-12

## Pattern Overview

**Overall:** Static Site Generation (SSG) with Island Architecture

**Key Characteristics:**
- Server-rendered static pages with selective client-side hydration
- File-based routing where each `.astro` file in `src/pages/` becomes a route
- Content collections for structured data (blog posts)
- Component-based UI with progressive enhancement
- Animation lifecycle management via GSAP + Lenis

## Layers

**Presentation Layer:**
- Purpose: UI components and page templates
- Location: `src/components/`, `src/pages/`, `src/layouts/`
- Contains: Astro components, page routes, layout wrappers
- Depends on: Data layer, styling layer, animation utilities
- Used by: Build process (Astro compiler)

**Data Layer:**
- Purpose: Static data, content collections, and configuration
- Location: `src/data/`, `src/content.config.ts`, `src/data/blog/`
- Contains: TypeScript data files, Markdown/MDX content, site config
- Depends on: Nothing (pure data)
- Used by: Presentation layer

**Animation & Interaction Layer:**
- Purpose: Client-side interactivity and scroll-based animations
- Location: `src/lib/`, `src/components/animations/`
- Contains: GSAP animations, scroll triggers, smooth scroll, custom cursor, tilt effects
- Depends on: GSAP library, Lenis smooth scroll
- Used by: Layout wrapper, individual pages

**Styling Layer:**
- Purpose: CSS design system with theme support
- Location: `src/styles/global.css`, `tailwind.config.mjs`
- Contains: CSS custom properties, Tailwind utilities, dark/light theme
- Depends on: Tailwind CSS framework
- Used by: All components

**Build Layer:**
- Purpose: Static site generation and optimization
- Location: `astro.config.mjs`, `remark-reading-time.mjs`
- Contains: Astro config, integrations, remark plugins
- Depends on: Astro core, MDX, Tailwind, Expressive Code, Sitemap
- Used by: Build process

## Data Flow

**Static Page Rendering:**

1. Astro build process reads page files from `src/pages/`
2. Pages import data from `src/data/` (projects, site config) or query content collections
3. Components are server-rendered to HTML with minimal client JS
4. Static assets processed and optimized
5. Output written to `dist/` for static hosting

**Content Collection Flow:**

1. Markdown/MDX files in `src/data/blog/` define content
2. `src/content.config.ts` defines schema validation with Zod
3. Pages use `getCollection('blog')` to query posts
4. Content is filtered (draft status, external URLs)
5. Posts are rendered via `[slug].astro` dynamic route

**Client-Side Animation Flow:**

1. `Layout.astro` includes animation component scripts
2. On `astro:page-load` event, `initSmoothScroll()` and `initScrollAnimations()` execute
3. GSAP ScrollTrigger registers elements with `data-*` attributes
4. Scroll events trigger animations (reveal, parallax, stagger)
5. On `astro:before-swap`, `cleanupAnimations()` removes ScrollTrigger instances

**State Management:**
- No global state management (pure static generation)
- Theme state stored in `localStorage` via ThemeToggle component
- Scroll position and animation states managed by GSAP ScrollTrigger
- Mobile menu state managed via vanilla JS in Header component

## Key Abstractions

**Layout Wrapper:**
- Purpose: Common page structure (header, footer, SEO, animations)
- Examples: `src/layouts/Layout.astro`
- Pattern: Slot-based composition with props for SEO metadata

**Content Collections:**
- Purpose: Type-safe content management for blog posts
- Examples: `src/content.config.ts`, `src/data/blog/*.md`
- Pattern: Astro Content Collections API with Zod schema validation

**Animation Components:**
- Purpose: Declarative animation effects via data attributes
- Examples: `src/components/animations/CustomCursor.astro`, `src/components/animations/TiltCard.astro`, `src/components/animations/MagneticButton.astro`
- Pattern: Self-initializing scripts that observe `data-*` attributes and register GSAP animations

**Data Modules:**
- Purpose: Centralized configuration and structured data
- Examples: `src/data/site.ts`, `src/data/projects.ts`
- Pattern: Exported TypeScript constants with type definitions

**JSON-LD Structured Data:**
- Purpose: SEO-rich snippets for search engines
- Examples: `src/components/PersonJsonLd.astro`, `src/components/BlogPostingJsonLd.astro`
- Pattern: Schema.org markup rendered in component scripts

## Entry Points

**Main Page:**
- Location: `src/pages/index.astro`
- Triggers: Astro build process, user visiting `/`
- Responsibilities: Hero section, skills showcase, latest blog posts, CTA

**Blog Index:**
- Location: `src/pages/blog/index.astro`
- Triggers: User visiting `/blog/`
- Responsibilities: List all published blog posts with filtering

**Blog Post:**
- Location: `src/pages/blog/[slug].astro`
- Triggers: Dynamic route for each blog post
- Responsibilities: Render markdown content, table of contents, structured data

**Projects Page:**
- Location: `src/pages/projects/index.astro`
- Triggers: User visiting `/projects/`
- Responsibilities: Display categorized project portfolio

**Build Entry:**
- Location: `astro.config.mjs`
- Triggers: `npm run build`
- Responsibilities: Configure integrations, plugins, site metadata

## Error Handling

**Strategy:** Build-time validation with runtime graceful degradation

**Patterns:**
- Zod schema validation in content collections prevents invalid blog posts from building
- GSAP animations check for `prefers-reduced-motion` and skip animations if enabled
- Animation lifecycle cleanup on page navigation prevents memory leaks
- Fallback checks for DOM elements before attaching event listeners (`if (!element) return`)
- External blog posts filtered from static generation via `!data.externalUrl` check

## Cross-Cutting Concerns

**Logging:** Browser console only (no server-side logging in static build)

**Validation:** Zod schemas for content collections (`src/content.config.ts`)

**Authentication:** Not applicable (static public site)

**SEO Optimization:**
- `SEOHead.astro` component handles meta tags, Open Graph, Twitter Cards
- Structured data via PersonJsonLd and BlogPostingJsonLd
- Sitemap generated via `@astrojs/sitemap` integration
- RSS feed at `/rss.xml.ts`
- Reading time calculation via remark plugin

**Accessibility:**
- Skip to main content link in Layout
- ARIA labels on interactive elements
- Semantic HTML structure
- Focus management in mobile menu
- Reduced motion support in animations

**Performance:**
- Static generation eliminates server response time
- Image optimization via Astro's Image component
- Font preconnect to Google Fonts
- CSS scoped to components
- Minimal JavaScript (only for animations and interactivity)

**Theme System:**
- CSS custom properties in `src/styles/global.css`
- Dark/light mode toggle via ThemeToggle component
- Persistent theme preference in localStorage

---

*Architecture analysis: 2026-02-12*
