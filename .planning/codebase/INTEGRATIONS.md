# External Integrations

## APIs & Services

### IndexNow (SEO)
- **File:** `src/integrations/indexnow.ts`
- **Purpose:** Submits all built URLs to search engines on CI build
- **Key:** `970b0a65b110ef7d7f6311827aff7146` (hardcoded in source)
- **Trigger:** Astro `astro:build:done` hook, CI-only (`process.env.CI`)
- **Endpoint:** `https://api.indexnow.org/indexnow`

### Google Colab
- **Usage:** External links to hosted Jupyter notebooks for EDA techniques
- **Pattern:** Notebook URLs generated from `src/lib/eda/notebooks/`

### GitHub Raw/Blob URLs
- **Usage:** Guide code snippets reference raw GitHub content
- **Pattern:** Links to code examples in guide chapters

## SEO & Discovery

### Sitemap
- **Endpoint:** `/sitemap-index.xml`
- **Config:** Custom `serialize()` in `astro.config.mjs` — priority/changefreq per section, real content dates from frontmatter

### RSS Feed
- **Endpoint:** `/rss.xml`
- **File:** `src/pages/rss.xml.ts`

### LLMs.txt
- **Endpoints:** `/llms.txt` and `/llms-full.txt`
- **Files:** `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`
- **Purpose:** LLM crawler discovery protocol

### Schema.org JSON-LD
- **Components:** `PersonJsonLd.astro`, `BlogPostingJsonLd.astro`, `FAQPageJsonLd.astro`, `ProjectsJsonLd.astro`, `EDAJsonLd.astro`, `ComposeValidatorJsonLd.astro`, `GhaValidatorJsonLd.astro`, `K8sAnalyzerJsonLd.astro`, `DockerfileAnalyzerJsonLd.astro`, `BeautyIndexJsonLd.astro`, `CompassJsonLd.astro`, `BreadcrumbJsonLd.astro`, `DefinedTermJsonLd.astro`, `VsJsonLd.astro`
- **Types:** Person, WebSite, Article, FAQPage, SoftwareApplication, DefinedTerm, BreadcrumbList

## Databases & Auth

**None.** This is a fully static site — no database, no authentication, no backend server.

## Build-time Integrations

### Actionlint WASM
- **Script:** `scripts/download-actionlint-wasm.mjs`
- **Purpose:** Downloads actionlint WASM binary from GitHub Pages for in-browser GHA validation
- **Note:** Downloaded without checksum verification

### AJV Schema Compilation
- **Scripts:** `scripts/compile-compose-schema.mjs`, `scripts/compile-gha-schema.mjs`, `scripts/compile-k8s-schemas.mjs`
- **Output:** Pre-compiled validators in `src/lib/tools/*/validate-*.js`

### Notebook Packager
- **File:** `src/integrations/notebook-packager.ts`
- **Purpose:** Packages Jupyter notebooks as downloadable ZIP archives during build
