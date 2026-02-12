# Technology Stack

**Analysis Date:** 2026-02-12

## Languages

**Primary:**
- TypeScript 5.9.3 - Component logic, content schemas, utility libraries
- JavaScript (ES Module) - Build config, remark plugins, inline scripts

**Secondary:**
- CSS - Global styles, component-scoped styles in Astro components
- MDX - Blog post content with embedded components

## Runtime

**Environment:**
- Node.js (version unspecified in package.json)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Astro 5.3.0 - Static site generator, primary framework
- Tailwind CSS 3.4.19 - Utility-first CSS framework

**Testing:**
- Not detected

**Build/Dev:**
- Vite (bundled with Astro) - Build tool and dev server
- TypeScript 5.9.3 - Type checking
- `@astrojs/check` 0.9.6 - Astro-specific type checking

## Key Dependencies

**Critical:**
- `@astrojs/mdx` 4.3.13 - MDX support for blog content
- `@astrojs/tailwind` 6.0.2 - Tailwind CSS integration
- `@astrojs/sitemap` 3.7.0 - Automatic sitemap generation
- `@astrojs/rss` 4.0.15 - RSS feed generation

**Animation & Interaction:**
- `gsap` 3.14.2 - Animation library with ScrollTrigger for scroll-based animations
- `lenis` 1.3.17 - Smooth scroll library
- `vanilla-tilt` 1.8.1 - 3D tilt hover effects

**Content Processing:**
- `reading-time` 1.5.0 - Reading time estimation for blog posts
- `mdast-util-to-string` 4.0.0 - Markdown AST to string conversion
- `astro-expressive-code` 0.41.6 - Enhanced code syntax highlighting

**Image Generation:**
- `satori` 0.19.2 - React to SVG/PNG converter for Open Graph images
- `sharp` 0.34.5 - High-performance image processing

**UI Enhancement:**
- `@tailwindcss/typography` 0.5.19 - Prose styling for blog content

## Configuration

**Environment:**
- No `.env` files detected - all configuration is static
- Site URL configured in `astro.config.mjs`: `https://patrykgolabek.dev`
- Output mode: static site generation

**Build:**
- `astro.config.mjs` - Astro framework config (MDX, Tailwind, sitemap, expressive-code)
- `tailwind.config.mjs` - Custom colors, fonts, typography plugin
- `tsconfig.json` - Extends `astro/tsconfigs/strict`
- `remark-reading-time.mjs` - Custom remark plugin for reading time

**TypeScript:**
- Strict mode enabled via Astro's strict preset
- ES modules (`"type": "module"` in package.json)

## Platform Requirements

**Development:**
- Node.js (modern version supporting ES modules)
- npm for dependency installation

**Production:**
- Static hosting (outputs pre-rendered HTML/CSS/JS)
- No server-side runtime required
- Deployment target: `https://patrykgolabek.dev` (configured in `astro.config.mjs`)

---

*Stack analysis: 2026-02-12*
