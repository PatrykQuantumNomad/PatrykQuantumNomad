# Technology Stack

**Analysis Date:** 2026-02-12

## Languages

**Primary:**
- TypeScript (strict) — All page logic, components, data schemas, and library code
- Astro Component Language — `.astro` files for pages, layouts, and components (HTML + frontmatter TS)

**Secondary:**
- CSS — Global styles with Tailwind directives and custom CSS (`src/styles/global.css`)
- Vanilla JavaScript — Inline `<script is:inline>` blocks for particle canvas (`src/components/ParticleCanvas.astro`)

## Runtime

**Environment:**
- Node.js (version not pinned — no `.nvmrc` or `.node-version` file present)
- ES Modules (`"type": "module"` in `package.json`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present, ~298KB)

## Frameworks

**Core:**
- Astro `^5.3.0` — Static site generator, SSG output mode (`output: 'static'`)
- Tailwind CSS `^3.4.19` — Utility-first CSS framework
- TypeScript `^5.9.3` — Strict mode via `astro/tsconfigs/strict` preset

**Animation:**
- GSAP `^3.14.2` — ScrollTrigger, batch animations, parallax, clip-path reveals
- Lenis `^1.3.17` — Smooth scroll (desktop only, disabled on touch/reduced-motion)
- vanilla-tilt `^1.8.1` — 3D tilt effect on cards (desktop only)

**Content:**
- Astro MDX `^4.3.13` — MDX content processing
- astro-expressive-code `^0.41.6` — Syntax highlighting with `github-dark` / `github-light` themes

**Build/Dev:**
- Astro CLI — `astro dev`, `astro build`, `astro preview`
- Vite (bundled with Astro) — Underlying build tool and dev server

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `astro` | `^5.3.0` | Core SSG framework, static output |
| `tailwindcss` | `^3.4.19` | Utility CSS framework |
| `@astrojs/tailwind` | `^6.0.2` | Astro + Tailwind integration |
| `@tailwindcss/typography` | `^0.5.19` | Prose styling for blog content |
| `gsap` | `^3.14.2` | Animation library (ScrollTrigger, batch reveals, parallax) |
| `lenis` | `^1.3.17` | Smooth scroll on desktop (integrated with GSAP ticker) |
| `vanilla-tilt` | `^1.8.1` | 3D tilt hover effect on cards |
| `@astrojs/mdx` | `^4.3.13` | MDX content support |
| `astro-expressive-code` | `^0.41.6` | Code block syntax highlighting |
| `@astrojs/sitemap` | `^3.7.0` | Auto-generated `sitemap-index.xml` |
| `@astrojs/rss` | `^4.0.15` | RSS feed generation (`/rss.xml`) |
| `@astrojs/check` | `^0.9.6` | Astro type-checking CLI |
| `satori` | `^0.19.2` | SVG generation for dynamic OG images |
| `sharp` | `^0.34.5` | Image processing (OG image PNG conversion, Astro image optimization) |
| `reading-time` | `^1.5.0` | Estimated reading time for blog posts |
| `mdast-util-to-string` | `^4.0.0` | MDX AST to plain text (used by reading-time remark plugin) |
| `typescript` | `^5.9.3` | TypeScript compiler (strict config) |

## Dev Dependencies

No dev dependencies declared. All packages are in `dependencies`. There are no linters, formatters, or test frameworks configured.

## Configuration Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro configuration: static output, site URL, integrations (expressive-code, MDX, Tailwind, sitemap), remark plugins |
| `tailwind.config.mjs` | Tailwind config: custom fonts (DM Sans, Bricolage Grotesque, Fira Code), CSS variable-based color tokens, typography plugin |
| `tsconfig.json` | TypeScript config: extends `astro/tsconfigs/strict` |
| `package.json` | Project manifest, scripts (`dev`, `build`, `preview`), all dependencies |
| `src/content.config.ts` | Astro content collections: `blog` collection with Zod schema (title, description, publishedDate, tags, draft, externalUrl, source) |
| `remark-reading-time.mjs` | Custom remark plugin: injects `minutesRead` into frontmatter |
| `public/robots.txt` | Search engine directives, sitemap reference |
| `public/CNAME` | Custom domain: `patrykgolabek.dev` |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD for GitHub Pages deployment |

## Scripts

```bash
npm run dev          # Start Astro dev server (Vite-powered)
npm run build        # Production static build
npm run preview      # Preview production build locally
```

## Platform Requirements

**Development:**
- Node.js (ES modules support required)
- npm for dependency management
- No Docker or containerization for local dev

**Production:**
- GitHub Pages (static hosting)
- Custom domain: `patrykgolabek.dev` (via `public/CNAME`)
- Built with `withastro/action@v3` in CI

---

*Stack analysis: 2026-02-12*
