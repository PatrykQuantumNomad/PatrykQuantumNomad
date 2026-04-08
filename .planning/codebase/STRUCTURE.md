# Directory Structure

## Top Level

```
PatrykQuantumNomad/
├── .github/workflows/      # CI/CD (deploy.yml)
├── .planning/               # GSD planning artifacts
├── handbook/                # NIST/SEMATECH reference data (local copy)
│   ├── eda/                 # Chapter 1 — EDA techniques (primary source)
│   └── datasets/            # Original NIST .DAT files
├── notebooks/               # Generated Jupyter notebooks
├── public/                  # Static assets (favicons, fonts, WASM)
├── recordings-workspace/    # Asciinema terminal recordings
├── scripts/                 # Build-time scripts
├── skills/                  # Claude Code skills
├── src/                     # Application source
├── astro.config.mjs         # Astro configuration
├── tailwind.config.mjs      # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Test configuration
├── package.json             # Dependencies and scripts
└── README.md                # GitHub profile README
```

## Source Directory (`src/`)

```
src/
├── assets/
│   ├── fonts/               # Inter, Space Grotesk (WOFF)
│   └── images/              # Personal photos, logos
├── components/
│   ├── ai-landscape/        # Interactive graph explorer (React)
│   ├── animations/          # GSAP animation components (Astro)
│   ├── beauty-index/        # Language beauty scoring UI
│   ├── blog/                # Blog-specific components (Callout, Lede, etc.)
│   ├── db-compass/          # Database comparison tool UI
│   ├── eda/                 # EDA chart components + distribution explorer
│   ├── guide/               # Guide chapter components
│   ├── tools/               # Validator/analyzer tool UIs (React)
│   └── *.astro / *.tsx      # Shared components (Header, Footer, SEO, JsonLd)
├── content.config.ts        # Astro content collection definitions
├── data/
│   ├── ai-landscape/        # graph.json, nodes.json, layout.json
│   ├── beauty-index/        # Language scoring data + code features
│   ├── blog/                # MDX blog posts (20+ articles)
│   ├── db-compass/          # models.json (database comparisons)
│   ├── eda/                 # EDA technique definitions, datasets
│   ├── guides/              # Multi-chapter guides (claude-code, fastapi)
│   ├── projects.ts          # Project card data
│   └── site.ts              # Site-wide config (name, URL, tagline)
├── integrations/
│   ├── indexnow.ts          # IndexNow SEO submission
│   └── notebook-packager.ts # Jupyter notebook ZIP packaging
├── layouts/
│   ├── Layout.astro         # Base layout (head, nav, footer)
│   ├── EDALayout.astro      # EDA-specific layout
│   └── GuideLayout.astro    # Guide chapter layout
├── lib/
│   ├── ai-landscape/        # Graph data, ancestry, tours, comparisons
│   ├── animation-lifecycle.ts # GSAP animation management
│   ├── beauty-index/        # Scoring algorithms
│   ├── db-compass/          # Database comparison logic
│   ├── eda/
│   │   ├── math/            # statistics.ts, distribution-math.ts
│   │   ├── notebooks/       # Jupyter notebook generation
│   │   ├── svg-generators/  # 22 D3-based chart generators
│   │   └── technique-content/ # Technique narrative content
│   ├── guides/
│   │   ├── svg-diagrams/    # SVG diagram generators for guides
│   │   ├── interactive-data/ # Interactive data for guide components
│   │   └── code-helpers.ts  # Code snippet helpers
│   ├── og-image.ts          # OG image generation (3,879 lines)
│   ├── scroll-animations.ts # Scroll-triggered animation setup
│   ├── smooth-scroll.ts     # Lenis smooth scroll init
│   └── tools/
│       ├── compose-validator/ # Docker Compose validation engine
│       ├── dockerfile-analyzer/ # Dockerfile analysis engine
│       ├── gha-validator/     # GitHub Actions validation engine
│       └── k8s-analyzer/      # Kubernetes manifest analyzer
├── pages/
│   ├── index.astro          # Homepage
│   ├── about.astro          # About page
│   ├── contact.astro        # Contact page
│   ├── 404.astro            # Not found page
│   ├── ai-landscape/        # AI landscape explorer pages
│   ├── beauty-index/        # Language beauty index pages
│   ├── blog/                # Blog listing + individual posts
│   ├── db-compass/          # Database compass pages
│   ├── eda/                 # EDA visual encyclopedia pages
│   ├── guides/              # Multi-chapter guide pages
│   ├── open-graph/          # OG image generation endpoints
│   ├── projects/            # Project listing
│   ├── tools/               # Tool pages (validators/analyzers)
│   ├── rss.xml.ts           # RSS feed
│   ├── llms.txt.ts          # LLMs.txt endpoint
│   └── llms-full.txt.ts     # Full LLMs.txt endpoint
├── stores/                  # Nanostores for client state
│   ├── categoryFilterStore.ts
│   ├── compassFilterStore.ts
│   ├── composeValidatorStore.ts
│   ├── dockerfileAnalyzerStore.ts
│   ├── ghaValidatorStore.ts
│   ├── k8sAnalyzerStore.ts
│   ├── languageFilterStore.ts
│   └── tabStore.ts
└── styles/                  # Global CSS
```

## Scripts Directory

```
scripts/
├── compile-compose-schema.mjs   # AJV schema compilation for compose
├── compile-gha-schema.mjs       # AJV schema compilation for GHA
├── compile-k8s-schemas.mjs      # AJV schema compilation for K8s
├── copy-katex-assets.mjs        # KaTeX font/CSS copying
├── download-actionlint-wasm.mjs # Actionlint WASM binary download
├── generate-layout.mjs          # AI landscape graph layout computation
├── generate-notebooks.ts        # Jupyter notebook generation
├── optimize-model.sh            # 3D model optimization
├── schemas/                     # Source JSON schemas
├── test-validator-hooks.sh      # Validator hook testing
└── validate-eda-data.ts         # EDA data validation
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Astro components | PascalCase.astro | `BlogCard.astro`, `SEOHead.astro` |
| React components | PascalCase.tsx | `InteractiveGraph.tsx`, `SearchBar.tsx` |
| Libraries | kebab-case.ts | `og-image.ts`, `animation-lifecycle.ts` |
| Data files | kebab-case.ts/json | `code-features.ts`, `models.json` |
| Stores | camelCaseStore.ts | `ghaValidatorStore.ts` |
| Tests | `__tests__/` dirs with `.test.ts` | `src/lib/eda/notebooks/__tests__/cells.test.ts` |
| Scripts | kebab-case.mjs/ts/sh | `generate-layout.mjs` |
| Pages | kebab-case.astro or dynamic `[slug].astro` | `index.astro`, `[...slug].astro` |

## Component Counts

| Type | Count |
|------|-------|
| Astro components (`.astro`) | ~100 |
| React components (`.tsx`) | ~77 |
| Test files (`.test.ts`) | 47 |
| Nanostores | 8 |
| Layouts | 3 |
