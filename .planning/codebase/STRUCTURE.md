# Codebase Structure

**Analysis Date:** 2026-02-12

## Directory Layout

```
PatrykQuantumNomad/
├── .astro/                     # Generated Astro types and content store (gitignored internals)
├── .claude/                    # Claude Code agent configs, GSD framework
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment pipeline
├── .planning/                  # GSD planning docs, milestones, phases
│   ├── codebase/               # Codebase analysis documents (this file)
│   ├── milestones/             # Milestone tracking
│   ├── phases/                 # Phase plans (01 through 12)
│   └── research/               # Research notes
├── dist/                       # Built static output (committed for GitHub Pages)
├── public/
│   ├── CNAME                   # Custom domain: patrykgolabek.dev
│   └── robots.txt              # Search engine directives
├── src/
│   ├── assets/
│   │   ├── fonts/              # Local font files (Inter, Space Grotesk) for OG images
│   │   └── images/             # Source images (JPG, PNG) optimized by Astro
│   ├── components/
│   │   ├── animations/         # Client-side animation controllers (script-only components)
│   │   ├── BlogCard.astro      # Blog post card (list view)
│   │   ├── BlogPostingJsonLd.astro  # BlogPosting structured data
│   │   ├── Footer.astro        # Site footer with social links and marquee
│   │   ├── Header.astro        # Sticky header with mobile menu
│   │   ├── ParticleCanvas.astro     # Interactive particle hero background
│   │   ├── PersonJsonLd.astro  # Person structured data (homepage)
│   │   ├── SEOHead.astro       # Meta tags (OG, Twitter, canonical)
│   │   ├── TableOfContents.astro    # Blog post TOC from headings
│   │   └── ThemeToggle.astro   # Dark/light toggle (component exists, not wired into Layout)
│   ├── content.config.ts       # Blog content collection schema (Zod)
│   ├── data/
│   │   ├── blog/               # Blog posts (Markdown files)
│   │   ├── projects.ts         # Project catalog (typed array)
│   │   └── site.ts             # Site-wide config (name, roles, tagline, URL)
│   ├── layouts/
│   │   └── Layout.astro        # Root layout (HTML shell, head, nav, footer, animations)
│   ├── lib/
│   │   ├── animation-lifecycle.ts   # GSAP/Lenis cleanup for view transitions
│   │   ├── og-image.ts         # Satori + Sharp OG image generator
│   │   ├── scroll-animations.ts     # GSAP ScrollTrigger reveal animations
│   │   └── smooth-scroll.ts    # Lenis smooth scroll initialization
│   ├── pages/
│   │   ├── blog/
│   │   │   ├── [slug].astro    # Individual blog post page
│   │   │   ├── index.astro     # Blog listing page
│   │   │   └── tags/
│   │   │       └── [tag].astro # Tag-filtered blog listing
│   │   ├── open-graph/
│   │   │   └── [...slug].png.ts    # Dynamic OG image API endpoint
│   │   ├── projects/
│   │   │   └── index.astro     # Projects portfolio page
│   │   ├── about.astro         # About page (bio, tech stack, photo grid)
│   │   ├── contact.astro       # Contact page (email, social cards)
│   │   ├── index.astro         # Homepage (hero, skills, latest posts, CTA)
│   │   ├── llms.txt.ts         # LLM-friendly plain-text site index
│   │   └── rss.xml.ts          # RSS feed endpoint
│   └── styles/
│       └── global.css          # Design tokens, Tailwind directives, all component CSS
├── astro.config.mjs            # Astro configuration (integrations, site URL, markdown plugins)
├── CLAUDE.md                   # Project instructions for Claude Code
├── package.json                # Dependencies and scripts
├── remark-reading-time.mjs     # Custom remark plugin for reading time
├── tailwind.config.mjs         # Tailwind configuration (fonts, colors, typography)
└── tsconfig.json               # TypeScript config (extends astro/tsconfigs/strict)
```

## Directory Purposes

**`src/components/`:**
- Purpose: Reusable Astro components for UI elements and structured data
- Contains: `.astro` files -- server-rendered markup with optional `<script>` blocks for client interactivity
- Key files: `Header.astro`, `Footer.astro`, `SEOHead.astro`, `ParticleCanvas.astro`, `BlogCard.astro`

**`src/components/animations/`:**
- Purpose: Client-side animation controllers that initialize via data attributes
- Contains: Script-only `.astro` components (no visible markup, just `<script>` blocks)
- Key files: `CustomCursor.astro`, `TiltCard.astro`, `MagneticButton.astro`, `FloatingOrbs.astro`, `SplitText.astro`, `TextScramble.astro`, `WordReveal.astro`, `TimelineDrawLine.astro`
- Pattern: Each component listens for `astro:page-load` and queries DOM for its data attribute

**`src/data/`:**
- Purpose: Static data sources consumed by pages and components
- Contains: TypeScript modules with typed exports, Markdown blog content
- Key files: `site.ts` (site config), `projects.ts` (project catalog), `blog/*.md` (blog posts)

**`src/data/blog/`:**
- Purpose: Blog content collection source files
- Contains: Markdown files with validated frontmatter (title, description, publishedDate, tags, optional externalUrl/source)
- Naming: `ext-*.md` for external blog posts (contain only frontmatter, no body), regular names for local posts
- Key files: `building-kubernetes-observability-stack.md` (local post), `ext-ollama-kubernetes-deployment.md` (external)

**`src/lib/`:**
- Purpose: Shared TypeScript modules (not Astro components)
- Contains: Animation lifecycle management, OG image generation, scroll utilities
- Key files: `animation-lifecycle.ts`, `scroll-animations.ts`, `smooth-scroll.ts`, `og-image.ts`

**`src/layouts/`:**
- Purpose: Page layout wrappers
- Contains: Single layout file used by all pages
- Key files: `Layout.astro`

**`src/pages/`:**
- Purpose: File-based routing -- each file becomes a route
- Contains: `.astro` page files and `.ts` API endpoints
- Routing: Astro file-based routing with dynamic segments (`[slug]`, `[tag]`, `[...slug]`)

**`src/styles/`:**
- Purpose: Global styles and design tokens
- Contains: Single CSS file with Tailwind directives, CSS custom properties, and component styles
- Key files: `global.css`

**`src/assets/`:**
- Purpose: Static assets processed by Astro's build pipeline (image optimization, font bundling)
- Contains: Source images (JPG, PNG), local font files (WOFF)
- Key files: `images/meandbatman.jpg` (hero), `fonts/Inter-Regular.woff`, `fonts/SpaceGrotesk-Bold.woff`

**`public/`:**
- Purpose: Files copied as-is to output (no processing)
- Contains: `CNAME` for custom domain, `robots.txt`

**`dist/`:**
- Purpose: Built static output deployed to GitHub Pages
- Contains: Pre-rendered HTML, optimized assets, generated OG images
- Generated: Yes (by `astro build`)
- Committed: Yes (required for GitHub Pages deployment)

## Key File Locations

**Entry Points:**
- `astro.config.mjs`: Astro build configuration
- `src/pages/index.astro`: Homepage route `/`
- `src/layouts/Layout.astro`: Root HTML shell wrapping all pages

**Configuration:**
- `astro.config.mjs`: Site URL, integrations (MDX, Tailwind, Sitemap, Expressive Code), remark plugins
- `tailwind.config.mjs`: Custom fonts (DM Sans, Bricolage Grotesque, Fira Code), CSS variable-based colors, typography plugin
- `tsconfig.json`: Extends `astro/tsconfigs/strict`
- `src/content.config.ts`: Blog content collection Zod schema
- `src/data/site.ts`: Site metadata (name, URL, description, roles)

**Core Logic:**
- `src/lib/animation-lifecycle.ts`: GSAP/Lenis cleanup for view transitions
- `src/lib/scroll-animations.ts`: All scroll-triggered animations (reveal, parallax, dividers, pills, card groups)
- `src/lib/smooth-scroll.ts`: Lenis smooth scroll initialization
- `src/lib/og-image.ts`: Satori-based OG image generation with custom fonts
- `remark-reading-time.mjs`: Custom remark plugin injecting reading time into blog frontmatter

**SEO:**
- `src/components/SEOHead.astro`: Open Graph, Twitter Card, canonical URL meta
- `src/components/PersonJsonLd.astro`: Person schema.org structured data
- `src/components/BlogPostingJsonLd.astro`: BlogPosting schema.org structured data
- `src/pages/rss.xml.ts`: RSS feed
- `src/pages/llms.txt.ts`: LLM-friendly site index

**Data Sources:**
- `src/data/site.ts`: Site-wide configuration
- `src/data/projects.ts`: Project catalog (16 projects, 4 categories)
- `src/data/blog/*.md`: Blog post content (1 local + 10 external)

## Page Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/pages/index.astro` | Homepage -- hero, skills, latest posts, CTA |
| `/about/` | `src/pages/about.astro` | Bio, photo grid, tech stack, career highlights |
| `/contact/` | `src/pages/contact.astro` | Contact cards (email, X, YouTube), social links |
| `/projects/` | `src/pages/projects/index.astro` | Categorized project cards from `src/data/projects.ts` |
| `/blog/` | `src/pages/blog/index.astro` | Blog post listing (sorted by date) |
| `/blog/{slug}/` | `src/pages/blog/[slug].astro` | Individual blog post (local posts only) |
| `/blog/tags/{tag}/` | `src/pages/blog/tags/[tag].astro` | Tag-filtered blog listing |
| `/rss.xml` | `src/pages/rss.xml.ts` | RSS feed (API endpoint) |
| `/llms.txt` | `src/pages/llms.txt.ts` | LLM-friendly plain-text site index (API endpoint) |
| `/open-graph/blog/{slug}.png` | `src/pages/open-graph/[...slug].png.ts` | Dynamic OG image generation (API endpoint) |

## Component Map

| Component | Used By | Purpose |
|-----------|---------|---------|
| `Layout.astro` | All pages | Root HTML shell, head, nav, footer, animation bootstrap |
| `Header.astro` | `Layout.astro` | Sticky header with scroll-aware hide/show, mobile menu |
| `Footer.astro` | `Layout.astro` | Footer with social icons, tech keyword marquee |
| `SEOHead.astro` | `Layout.astro` | Meta tags (OG, Twitter, canonical, article metadata) |
| `ParticleCanvas.astro` | `index.astro` | Interactive particle background in hero section |
| `PersonJsonLd.astro` | `index.astro` | Person schema.org structured data |
| `BlogCard.astro` | `blog/index.astro`, `blog/tags/[tag].astro` | Blog post card with title, date, tags, external indicator |
| `BlogPostingJsonLd.astro` | `blog/[slug].astro` | BlogPosting schema.org structured data |
| `TableOfContents.astro` | `blog/[slug].astro` | Heading-based table of contents for blog posts |
| `ThemeToggle.astro` | Not currently used | Dark/light mode toggle (exists but not wired into Layout) |
| `CustomCursor.astro` | `Layout.astro` | Custom dot + ring cursor (desktop only) |
| `TiltCard.astro` | `Layout.astro` | vanilla-tilt 3D effect for `[data-tilt]` elements |
| `MagneticButton.astro` | `Layout.astro` | Magnetic hover effect for `[data-magnetic]` elements |
| `SplitText.astro` | `Layout.astro` | Typing role rotation effect on hero |
| `TextScramble.astro` | `Layout.astro` | Terminal decryption reveal for `[data-animate="headline"]` |
| `WordReveal.astro` | `Layout.astro` | Word-by-word scroll reveal for `[data-word-reveal]` headings |
| `FloatingOrbs.astro` | `Layout.astro` | Parallax gradient orbs behind `[data-section-bg]` sections |
| `TimelineDrawLine.astro` | `Layout.astro` | SVG draw-line animation for `[data-timeline]` containers |

## Naming Conventions

**Files:**
- Pages: `kebab-case.astro` (e.g., `about.astro`, `contact.astro`)
- Components: `PascalCase.astro` (e.g., `BlogCard.astro`, `SEOHead.astro`)
- Animation components: `PascalCase.astro` in `animations/` subdirectory
- Data files: `kebab-case.ts` (e.g., `site.ts`, `projects.ts`)
- Lib modules: `kebab-case.ts` (e.g., `animation-lifecycle.ts`, `og-image.ts`)
- Blog posts: `kebab-case.md`; external posts prefixed with `ext-` (e.g., `ext-ollama-kubernetes-deployment.md`)
- Dynamic routes: `[param].astro` or `[...param].ext.ts` for catch-all

**Directories:**
- Lowercase, singular or short descriptive names: `components`, `pages`, `layouts`, `lib`, `data`, `styles`, `assets`
- Nested by feature: `pages/blog/`, `pages/blog/tags/`, `pages/projects/`, `pages/open-graph/`
- Animation components grouped in `components/animations/`

## Where to Add New Code

**New Page:**
- Create `src/pages/{route}.astro` for static pages
- Create `src/pages/{route}/index.astro` for section index pages
- Wrap with `<Layout title="..." description="...">` and use Tailwind for styling
- Follow existing pattern: `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16` for content sections

**New Blog Post (Local):**
- Create `src/data/blog/{slug}.md` with required frontmatter: `title`, `description`, `publishedDate`, `tags`
- Optional: `updatedDate`, `draft: true`
- Page auto-generated at `/blog/{slug}/` via `[slug].astro`

**New Blog Post (External):**
- Create `src/data/blog/ext-{slug}.md` with frontmatter including `externalUrl` and `source`
- No Markdown body needed -- the post card links to the external URL
- Appears in blog listing and RSS feed

**New UI Component:**
- Create `src/components/PascalCase.astro`
- Define `interface Props` in frontmatter for type safety
- Use CSS custom properties from `src/styles/global.css` for colors
- Import in the consuming page or Layout

**New Animation Component:**
- Create `src/components/animations/PascalCase.astro`
- Use script-only pattern (no visible markup, just `<script>` block)
- Listen for `astro:page-load` to initialize, `astro:before-swap` to cleanup
- Check `prefers-reduced-motion` and `pointer: coarse` before initializing
- Define a `data-*` attribute for element targeting
- Import in `src/layouts/Layout.astro` and add to the component list after `<Footer />`

**New Data Source:**
- Create `src/data/{name}.ts` with typed exports
- Follow pattern from `src/data/projects.ts`: define interface, export typed array

**New Utility/Lib Module:**
- Create `src/lib/{name}.ts`
- Export named functions; import where needed

**New API Endpoint:**
- Create `src/pages/{route}.ts` with `GET` export
- Follow pattern from `src/pages/rss.xml.ts` or `src/pages/llms.txt.ts`
- For dynamic endpoints, use `getStaticPaths` (required for static output mode)

**New Styles:**
- Add to `src/styles/global.css` in the appropriate section (labeled with comment headers)
- Use CSS custom properties for colors -- never hardcode hex values in component styles
- Use Tailwind utility classes in templates; custom CSS only for complex animations or pseudo-elements

## Special Directories

**`dist/`:**
- Purpose: Built static output for GitHub Pages
- Generated: Yes (by `astro build`)
- Committed: Yes (required for deployment via `withastro/action@v3`)

**`.astro/`:**
- Purpose: Generated Astro types, content store, collection schemas
- Generated: Yes (by Astro)
- Committed: Partially (types checked in for IDE support)

**`.planning/`:**
- Purpose: GSD framework planning documents
- Generated: No (manually created by Claude agents)
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code agent definitions, commands, GSD framework
- Generated: No
- Committed: Yes

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No (gitignored)

---

*Structure analysis: 2026-02-12*
