# External Integrations

**Analysis Date:** 2026-02-12

## APIs & External Services

**Social & Platform Links:**
- GitHub - External project links to `https://github.com/PatrykQuantumNomad/*` repositories
  - Used in: `src/data/projects.ts`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/projects/index.astro`
  - Purpose: Display featured projects from GitHub account
  - Auth: Not applicable (public links only)

- External Blogs - Link aggregation to external content
  - Translucent Computing: `https://translucentcomputing.com/blog/`
  - Kubert AI: `https://mykubert.com/blog/`
  - Used in: `src/pages/contact.astro`, `src/pages/about.astro`
  - Purpose: Cross-promote external content, support external blog posts via `externalUrl` field in blog schema

- Social Media Platforms
  - X/Twitter: `https://x.com/QuantumMentat`
  - YouTube: `https://youtube.com/@QuantumMentat`
  - Used in: `src/pages/contact.astro`, `src/pages/about.astro`, `src/pages/index.astro`
  - Purpose: Social profile links

**No API Keys or SDKs Detected** - All external integrations are static hyperlinks, no programmatic API calls.

## Data Storage

**Databases:**
- None - Site is statically generated

**File Storage:**
- Local filesystem only
  - Blog content: `src/data/blog/` (MDX files)
  - Static assets: `public/` directory
  - Font files: `src/assets/fonts/`
  - Images: `src/assets/images/`, `public/images/`

**Caching:**
- None - Static build output only

## Authentication & Identity

**Auth Provider:**
- None - Public static website with no authentication

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Client-side browser console only (no centralized logging)

**Analytics:**
- None detected in codebase

## CI/CD & Deployment

**Hosting:**
- Static hosting (likely GitHub Pages or similar, based on `public/CNAME` file)
- Custom domain: `patrykgolabek.dev` (configured in `public/CNAME`)

**CI Pipeline:**
- None detected in repository

**Build Process:**
- Local: `npm run build` (runs `astro build`)
- Preview: `npm run preview` (runs `astro preview`)
- Development: `npm run dev` (runs `astro dev`)

## Environment Configuration

**Required env vars:**
- None - All configuration is compile-time static

**Build-time configuration:**
- `import.meta.env.PROD` - Used in `src/pages/rss.xml.ts` to filter draft posts in production
- Site URL: Configured in `astro.config.mjs` as `https://patrykgolabek.dev`

**Secrets location:**
- Not applicable - No secrets required

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## SEO & Discovery

**RSS Feed:**
- Generated at build time via `src/pages/rss.xml.ts`
- Uses `@astrojs/rss` package
- Includes published blog posts with metadata

**Sitemap:**
- Auto-generated via `@astrojs/sitemap` integration
- Configured in `astro.config.mjs`

**Robots.txt:**
- Static file in `public/robots.txt`

**Open Graph Images:**
- Dynamically generated via `src/pages/open-graph/[...slug].png.ts`
- Uses `satori` for SVG generation and `sharp` for PNG conversion
- Fonts loaded from `src/assets/fonts/`

**LLM Discovery:**
- Custom `/llms.txt` endpoint at `src/pages/llms.txt.ts`
- Provides machine-readable site structure for LLMs

**Structured Data:**
- JSON-LD schemas implemented in:
  - `src/components/PersonJsonLd.astro` - Person/Author schema
  - `src/components/BlogPostingJsonLd.astro` - BlogPosting schema
  - `src/components/SEOHead.astro` - Meta tags and Open Graph

---

*Integration audit: 2026-02-12*
