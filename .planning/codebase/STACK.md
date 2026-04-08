# Tech Stack

## Languages

| Language | Usage |
|----------|-------|
| TypeScript 5.9 | Primary — all source in `src/`, scripts in `scripts/` |
| JavaScript (ESM) | Build scripts (`scripts/*.mjs`), AJV compiled validators |
| Bash | `scripts/optimize-model.sh`, `scripts/test-validator-hooks.sh` |
| MDX / Markdown | Blog posts, guide content in `src/data/blog/`, `src/data/guides/` |

## Runtime & Build

- **Node.js 24.x** — runtime for build and dev server
- **npm** — package manager (lockfile v3)
- **Astro 5.3** — static site generator (`output: 'static'`)
- **GitHub Actions** — CI/CD via `.github/workflows/deploy.yml`
- **GitHub Pages** — hosting target

## Core Frameworks

| Framework | Version | Role |
|-----------|---------|------|
| Astro | 5.3 | SSG framework, routing, content collections |
| React | 19.2 | Interactive components (`.tsx`) |
| Tailwind CSS | 3.4 | Utility-first styling |
| @tailwindcss/typography | 0.5 | Prose styling for blog/guide content |

## Key Dependencies

### 3D & Visualization
- **Three.js 0.182** + `@react-three/fiber` + `@react-three/drei` — 3D hero scene (`HeadScene.tsx`)
- **D3** (d3-array, d3-scale, d3-selection, d3-shape, d3-force, d3-zoom, d3-contour, d3-axis, d3-path) — EDA charts, force graphs
- **@xyflow/react** + `@dagrejs/dagre` — flow graphs (AI landscape, tool dependency views)

### Animation
- **GSAP 3.14** + `@gsap/react` — scroll/timeline animations
- **Lenis 1.3** — smooth scrolling
- **vanilla-tilt** — card tilt effects

### Editor & Validation
- **CodeMirror 6** + `@codemirror/lang-yaml` — in-browser YAML editors (tool validators)
- **AJV 8.18** + `ajv-formats` — JSON Schema validation for compose/GHA/K8s tools
- **dockerfile-ast** — Dockerfile parsing for analyzer tool

### Content & SEO
- **astro-expressive-code** — syntax highlighted code blocks
- **remark-math** + **rehype-katex** — LaTeX math rendering
- **@astrojs/mdx** — MDX content support
- **@astrojs/sitemap** — sitemap generation with custom lastmod dates
- **@astrojs/rss** — RSS feed generation
- **satori 0.19** + **sharp 0.34** — OG image generation (`src/lib/og-image.ts`)
- **reading-time** — estimated read time for posts

### Utilities
- **nanostores** + `@nanostores/react` — lightweight state management
- **archiver** — ZIP generation (notebook packager)
- **lz-string** — URL-safe compression for editor state sharing
- **yaml** — YAML parsing
- **asciinema-player** — terminal recording playback

## Dev Dependencies

- **Vitest 4.0** — test framework
- **tsx** — TypeScript execution for scripts
- **rollup-plugin-visualizer** — bundle analysis

## Configuration Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro config — site URL, integrations, markdown plugins |
| `tsconfig.json` | Extends `astro/tsconfigs/strict`, React JSX |
| `tailwind.config.mjs` | Tailwind customization |
| `vitest.config.ts` | Test config — includes `src/**/*.test.ts` |
| `ec.config.mjs` | Expressive Code configuration |
| `remark-reading-time.mjs` | Custom remark plugin for reading time |

## Build Pipeline

1. **Prebuild:** `download-actionlint-wasm.mjs` fetches actionlint WASM, `generate-layout.mjs` computes AI landscape graph layout
2. **Build:** `astro build` — static site generation
3. **Deploy:** GitHub Actions → GitHub Pages
