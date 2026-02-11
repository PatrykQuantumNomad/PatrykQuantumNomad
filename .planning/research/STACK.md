# Stack Research

**Domain:** Personal portfolio + blog site (Astro, static, GitHub Pages)
**Researched:** 2026-02-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro | 5.17.x | Static site framework | The dominant content-driven static site framework. Island architecture means zero JS by default, perfect for a portfolio/blog that must load fast. Content Collections with the Content Layer API (Astro 5+) give type-safe Markdown/MDX handling with Zod schema validation. Do NOT use Astro 6 beta -- it is pre-release as of Feb 2026 and not production-ready. **Confidence: HIGH** (npm registry verified) |
| TypeScript | 5.9.x | Type safety | Astro has first-class TypeScript support. Content collection schemas, component props, and config are all typed. No reason to use plain JS in 2026. **Confidence: HIGH** (npm registry verified) |
| Tailwind CSS | 4.1.x | Utility-first CSS | Industry standard for utility CSS. v4 is a ground-up rewrite: config lives in CSS (`@import "tailwindcss"`), no `tailwind.config.mjs` needed. Astro 5.2+ supports it natively via Vite plugin. **Confidence: HIGH** (official docs + npm verified) |
| @tailwindcss/vite | 4.1.x | Tailwind integration for Astro | The official way to use Tailwind v4 with Astro. Replaces the deprecated `@astrojs/tailwind` integration. Install this, NOT `@astrojs/tailwind`. **Confidence: HIGH** (official Tailwind docs) |
| MDX (@astrojs/mdx) | 4.3.x | Rich content authoring | Enables JSX components inside Markdown blog posts -- interactive demos, callouts, custom embeds. Required for a blog that goes beyond plain Markdown. **Confidence: HIGH** (npm verified) |

### Animation & Visual Effects

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| GSAP | 3.14.x | Scroll animations, timeline sequences, entrance effects | The professional-grade animation library. As of April 2025, GSAP is 100% free for all use (including commercial) after Webflow acquisition -- ALL plugins included (ScrollTrigger, SplitText, MorphSVG). ScrollTrigger is unmatched for scroll-driven animations. Works perfectly with vanilla JS (no React dependency). ~23KB gzipped core, modular imports. **Confidence: HIGH** (official announcement + npm verified) |
| tsParticles (vanilla-js bundle) | 3.9.x | Star field / particle background effects | The actively maintained successor to particles.js. Has an official Astro component (`astro-particles@2.10.0`), but that package is stale (1 year no updates). Recommend using `@tsparticles/slim` or the vanilla bundle directly with a client-side script for more control and smaller bundle. **Confidence: MEDIUM** (npm verified, but Astro integration staleness is a concern -- may need custom integration) |

### SEO & Content Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @astrojs/sitemap | 3.7.x | Auto-generated XML sitemap | Official Astro integration. Generates `sitemap-index.xml` and `sitemap-0.xml` at build time. Essential for search engine indexing of all pages and blog posts. **Confidence: HIGH** (npm verified) |
| @astrojs/rss | 4.0.x | RSS feed generation | Official Astro package for RSS feeds. Enables blog post subscriptions. Generates static XML at build. **Confidence: HIGH** (npm verified) |
| astro-seo | 1.1.x | Declarative SEO meta tags | Component-driven `<SEO>` component for title, description, Open Graph, Twitter cards. Avoids manual `<meta>` tag management. Well-maintained, widely used in the Astro ecosystem. **Confidence: MEDIUM** (npm verified, community package) |
| astro-seo-schema | 5.1.x | JSON-LD structured data | Generates JSON-LD schema.org markup (Person, BlogPosting, WebSite, BreadcrumbList). Powered by `schema-dts` for full TypeScript definitions. Essential for rich Google search results. **Confidence: MEDIUM** (npm verified, community package) |

### Typography & Fonts

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @tailwindcss/typography | 0.5.x | Prose styling for blog content | The `prose` class gives beautiful typographic defaults to rendered Markdown/MDX. In Tailwind v4, configure via CSS: `@plugin "@tailwindcss/typography"`. Essential for any blog. **Confidence: HIGH** (npm verified, official Tailwind plugin) |
| @fontsource-variable/space-grotesk | 5.2.x | Display / heading font | Self-hosted variable font. Futuristic geometric sans-serif that fits the "Quantum Explorer" theme. Eliminates Google Fonts CDN dependency -- better performance, privacy, and reliability. Variable format means one file covers all weights. **Confidence: HIGH** (npm verified) |
| @fontsource-variable/jetbrains-mono | 5.2.x | Code / monospace font | Self-hosted variable monospace font. Purpose-built for code readability. Matches the developer/architect brand. **Confidence: HIGH** (npm verified) |
| @fontsource-variable/inter | 5.2.x | Body text font | Self-hosted variable font. The most readable screen font available, designed for UI. Excellent at small sizes for body text. **Confidence: HIGH** (npm verified) |

### Code Highlighting

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| astro-expressive-code | 0.41.x | Syntax highlighting for blog code blocks | Built on Shiki (same engine as VS Code). Provides code editor frames, line highlighting, diff markers, copy buttons, and terminal window frames out of the box. Far richer than raw Shiki. Automatically tree-shakes unused themes, reducing SSR bundle by >1MB. **Confidence: HIGH** (npm verified) |

### Icons

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| astro-icon | 1.1.x | SVG icon components | Inline SVG icons with Iconify ecosystem support. Inlines SVGs directly in markup (no icon font, no JS). Supports both local SVGs and Iconify icon sets. **Confidence: MEDIUM** (npm verified, community package, last publish ~1 year ago) |
| @iconify-json/lucide | 1.2.x | Icon set | Clean, consistent icon set. Covers all typical portfolio/blog needs (social links, navigation, theme toggle). **Confidence: HIGH** (npm verified) |

### Image Optimization

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| sharp | 0.34.x | Image processing | Astro's default image service since v3. Squoosh was removed entirely in Astro 5. Sharp handles WebP/AVIF generation, resizing, and optimization at build time. Install as a peer dependency. **Confidence: HIGH** (Astro official docs) |

### Deployment

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| withastro/action | v5 (v5.2.0) | GitHub Actions deployment | Official Astro GitHub Action for deploying to GitHub Pages. Handles build, artifact upload, and Pages deployment in one step. Supports Node 22, auto-detects package manager. v5 is current stable. **Confidence: HIGH** (official docs + GitHub releases verified) |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| @astrojs/check | 0.9.x | Astro-specific linting & diagnostics | Catches Astro component errors, type issues. Run as `astro check`. **Confidence: HIGH** |
| prettier | 3.8.x | Code formatting | Standard formatter. **Confidence: HIGH** |
| prettier-plugin-astro | 0.14.x | Astro file formatting | Format `.astro` files. Required alongside Prettier. **Confidence: HIGH** |
| prettier-plugin-tailwindcss | 0.7.x | Tailwind class sorting | Auto-sorts Tailwind utility classes in consistent order. Must be loaded LAST in Prettier plugins array. **Confidence: HIGH** |

## Installation

```bash
# Core framework
npm create astro@latest patrykgolabek.dev -- --template minimal --typescript strict
cd patrykgolabek.dev

# Tailwind CSS v4 (via Vite plugin, NOT @astrojs/tailwind)
npm install tailwindcss @tailwindcss/vite

# Astro integrations
npx astro add mdx sitemap

# SEO
npm install astro-seo astro-seo-schema

# RSS
npm install @astrojs/rss

# Animation
npm install gsap

# Particles (vanilla TS engine -- see note below on integration approach)
npm install @tsparticles/slim

# Typography & fonts
npm install @tailwindcss/typography
npm install @fontsource-variable/space-grotesk @fontsource-variable/inter @fontsource-variable/jetbrains-mono

# Code highlighting
npm install astro-expressive-code

# Icons
npm install astro-icon @iconify-json/lucide

# Image optimization (peer dep for Astro's image service)
npm install sharp

# Reading time for blog posts
npm install reading-time

# Dev dependencies
npm install -D @astrojs/check typescript prettier prettier-plugin-astro prettier-plugin-tailwindcss
```

## Key Configuration

### astro.config.mjs

```typescript
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";

export default defineConfig({
  site: "https://patrykgolabek.dev",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    expressiveCode({
      themes: ["github-dark", "github-light"],
    }),
    mdx(),    // MUST come after expressiveCode
    sitemap(),
    icon(),
  ],
});
```

### src/styles/global.css (Tailwind v4 style)

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

### .github/workflows/deploy.yml

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v5

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| CSS Framework | Tailwind CSS v4 | Vanilla CSS / CSS Modules | Tailwind's utility classes are faster to author, produce smaller bundles with purging, and have massive ecosystem support. Vanilla CSS is fine but slower to develop a custom theme with. |
| Animation | GSAP 3.14 | Motion (Framer Motion) | Motion started React-only (now supports vanilla JS too), but GSAP has superior scroll animation support via ScrollTrigger, works natively without React, and is now 100% free. Motion's 85KB vs GSAP's modular ~23KB core is also a factor for a static site. |
| Animation | GSAP 3.14 | CSS-only animations | CSS `@keyframes` and `animation` are great for simple hover/transition effects and should be used for those. But scroll-triggered reveals, staggered sequences, and timeline-based animations need GSAP. Use CSS for simple, GSAP for complex. |
| Particles | @tsparticles/slim | Canvas API (hand-rolled) | Hand-rolling a particle system is feasible but time-consuming. tsParticles provides configurable presets (stars, connections, space) with GPU-friendly rendering. Worth the ~30KB for the time saved. |
| Particles | @tsparticles/slim | astro-particles@2.10.0 | The official Astro wrapper is 1 year stale. Using the vanilla TS engine directly with a `<script>` tag in an Astro component gives more control and avoids dependency on a potentially abandoned wrapper. |
| Fonts | @fontsource-variable/* | Google Fonts CDN | Self-hosted fonts eliminate third-party DNS lookups, improve privacy, guarantee availability, and allow variable font optimization. Zero reason to use Google Fonts CDN for a performance-focused static site. |
| Fonts | @fontsource-variable/* | Astro experimental fonts API | The experimental fonts API (Astro 5.7+) is promising but still experimental. @fontsource packages are stable, well-documented, and widely used. Switch to the Astro fonts API when it graduates to stable. |
| Icons | astro-icon + Lucide | SVG files directly | astro-icon handles SVG inlining, accessibility attributes, and Iconify integration automatically. Direct SVG imports work but require manual optimization and attribute handling. |
| Code Highlighting | astro-expressive-code | Raw Shiki / rehype-pretty-code | Expressive Code wraps Shiki with copy buttons, window frames, line markers, and diff highlighting out of the box. rehype-pretty-code requires manual configuration to achieve the same. Less setup, better defaults. |
| SSG Framework | Astro 5 | Next.js / Nuxt | Astro is purpose-built for content sites. Zero JS by default, native Markdown/MDX content collections, static output. Next.js and Nuxt are app frameworks with SSR focus -- overkill for a static portfolio/blog. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@astrojs/tailwind` integration | **Deprecated for Tailwind v4.** Only works with Tailwind v3. Will not receive updates. | `@tailwindcss/vite` plugin directly in `vite.plugins` config |
| `tailwind.config.mjs` | Tailwind v4 configures via CSS imports (`@theme`, `@plugin`). Config files are v3 legacy. | CSS-based configuration in `global.css` |
| Squoosh image service | **Removed in Astro 5.** The underlying `libsquoosh` is unmaintained with memory/performance issues. | Sharp (default in Astro 5+, install `sharp` as peer dep) |
| particles.js | **Abandoned.** No updates since 2018. No TypeScript support. Known security vulnerabilities. | `@tsparticles/slim` (actively maintained successor) |
| Astro 6 beta | Pre-release software (6.0.0-beta.10 as of Feb 2026). Breaking changes expected. Not for production. | Astro 5.17.x (current stable) |
| React/Vue/Svelte for this project | Adding a UI framework increases bundle size for no benefit. This site is static content + vanilla JS animations. Astro components handle everything. | Astro components + vanilla `<script>` tags + GSAP |
| Framer Motion / Motion | Originally React-only. Even with vanilla JS support, it is heavier than GSAP (~85KB vs ~23KB core) and lacks GSAP's scroll animation depth. | GSAP + ScrollTrigger (free, lighter, more capable for scroll) |
| Google Fonts CDN | Extra DNS lookup, third-party dependency, privacy concerns, no offline support during development. | @fontsource-variable packages (self-hosted, variable fonts) |
| `src/content/config.ts` (old path) | Astro 5+ moved the content config to `src/content.config.ts` (note: root-level, not inside content folder in some setups). Verify with `astro check`. | `src/content.config.ts` with Content Layer API loaders |
| astro-seo-meta (various unmaintained alternatives) | Multiple SEO packages exist with varying quality. `astro-seo` is the most widely adopted. | `astro-seo` + `astro-seo-schema` as the canonical pair |

## Stack Patterns

**For the "Quantum Explorer" dark space theme:**
- Use GSAP ScrollTrigger for scroll-triggered section reveals (fade-in, slide-up, parallax)
- Use GSAP SplitText for futuristic text entrance animations (character-by-character reveals)
- Use tsParticles with a "star field" preset as a fixed background canvas
- Use Tailwind's `dark:` variant with a CSS class strategy for light/dark mode
- Persist theme choice in `localStorage`, sync via `astro:after-swap` event for View Transitions compatibility

**For blog content rendering:**
- Astro Content Collections with `glob()` loader for `.mdx` files
- Zod schema validation for frontmatter (title, date, description, tags, image)
- `reading-time` package to compute and display estimated read time
- `astro-expressive-code` for code blocks with copy buttons and syntax themes
- `@tailwindcss/typography` `prose` class for all rendered Markdown content

**For SEO completeness:**
- `astro-seo` component in a shared `<BaseHead>` layout for per-page meta
- `astro-seo-schema` for JSON-LD on blog posts (`BlogPosting`) and the homepage (`Person`, `WebSite`)
- `@astrojs/sitemap` integration for automatic sitemap generation
- `@astrojs/rss` for `/rss.xml` endpoint
- Canonical URLs via Astro's `Astro.url` + `site` config
- Open Graph images: static OG images per page, or a single branded fallback

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| astro@5.17.x | @astrojs/mdx@4.x, @astrojs/sitemap@3.x, @astrojs/rss@4.x | All official integrations track Astro major versions |
| tailwindcss@4.1.x | @tailwindcss/vite@4.1.x | Must match major.minor versions |
| tailwindcss@4.1.x | @tailwindcss/typography@0.5.x | Typography plugin works with v4 via `@plugin` CSS directive |
| astro-expressive-code@0.41.x | @astrojs/mdx@4.x | Must be listed BEFORE mdx in integrations array |
| gsap@3.14.x | No framework dependency | Works with vanilla JS, no Astro adapter needed |
| astro-icon@1.1.x | @iconify-json/*@1.x | Icon sets are separate packages; install only what you need |
| sharp@0.34.x | astro@5.x | Astro auto-detects sharp; just install it as a dependency |

## Node.js Requirement

Astro 5.x requires **Node.js 18.17.1 or higher**. The `withastro/action@v5` defaults to **Node 22**. Recommend using Node 22 LTS locally for consistency with CI.

## Sources

- [Astro npm registry](https://www.npmjs.com/package/astro) -- version 5.17.1 verified via `npm view` (HIGH confidence)
- [Astro 6 Beta announcement](https://astro.build/blog/astro-6-beta/) -- confirmed beta, not stable (HIGH confidence)
- [Astro Deploy to GitHub Pages docs](https://docs.astro.build/en/guides/deploy/github/) -- withastro/action@v5, config requirements (HIGH confidence)
- [withastro/action releases](https://github.com/withastro/action/releases) -- v5.2.0 is latest (HIGH confidence)
- [Tailwind CSS Astro installation guide](https://tailwindcss.com/docs/installation/framework-guides/astro) -- v4.1, @tailwindcss/vite approach (HIGH confidence)
- [Tailwind v4 typography discussion](https://github.com/tailwindlabs/tailwindcss/discussions/14120) -- `@plugin` directive confirmed (MEDIUM confidence)
- [GSAP free for everyone announcement](https://webflow.com/updates/gsap-becomes-free) -- 100% free, all plugins included (HIGH confidence)
- [GSAP npm](https://www.npmjs.com/package/gsap) -- v3.14.2 verified (HIGH confidence)
- [tsParticles GitHub](https://github.com/tsparticles/tsparticles) -- v3.9.1, Astro component available but stale (MEDIUM confidence)
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- Content Layer API, glob() loader (HIGH confidence)
- [Astro view transitions + dark mode](https://docs.astro.build/en/guides/view-transitions/) -- astro:after-swap event pattern (HIGH confidence)
- [Astro experimental fonts API](https://docs.astro.build/en/reference/experimental-flags/fonts/) -- still experimental, not recommended for production (MEDIUM confidence)
- [Astro sharp image service](https://docs.astro.build/en/guides/images/) -- Squoosh removed in v5, Sharp is default (HIGH confidence)
- Multiple npm version checks via `npm view` on 2026-02-11 (HIGH confidence for all version numbers)

---
*Stack research for: patrykgolabek.dev -- Astro portfolio + blog with Quantum Explorer theme*
*Researched: 2026-02-11*
