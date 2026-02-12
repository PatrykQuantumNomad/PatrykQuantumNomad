# Testing Infrastructure

**Analysis Date:** 2026-02-12

## Test Framework

**No test framework is configured.** The project has zero automated tests. There are no test configuration files (`jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*`) and no test files (`*.test.*`, `*.spec.*`) anywhere in the codebase.

**No test dependencies** in `package.json` -- no testing libraries of any kind are installed.

## Test Coverage

**What is tested:** Nothing. Zero test coverage.

**What is not tested (full list of untested functionality):**
- Component rendering (`src/components/*.astro` -- 12 components)
- Animation initialization and cleanup (`src/components/animations/*.astro` -- 8 animation components)
- Animation lifecycle management (`src/lib/animation-lifecycle.ts`)
- Scroll animation logic (`src/lib/scroll-animations.ts`)
- Smooth scroll initialization (`src/lib/smooth-scroll.ts`)
- OG image generation (`src/lib/og-image.ts`)
- Content collection schema validation (`src/content.config.ts`)
- Blog post data and frontmatter (`src/data/blog/*.md` -- 11 posts)
- Project data integrity (`src/data/projects.ts` -- 16 projects)
- Site config (`src/data/site.ts`)
- RSS feed generation (`src/pages/rss.xml.ts`)
- SEO meta tag generation (`src/components/SEOHead.astro`)
- JSON-LD structured data (`src/components/PersonJsonLd.astro`, `src/components/BlogPostingJsonLd.astro`)
- Remark reading time plugin (`remark-reading-time.mjs`)
- View transition lifecycle (page swap, persist behavior)
- Reduced motion and touch device fallbacks
- External link behavior (BlogCard external vs internal routing)

**Coverage metrics:** Not applicable -- no test runner, no coverage tool.

## Build Validation

**Build commands:**
```bash
npm run build          # Full production build (astro build)
npm run dev            # Development server (astro dev)
npm run preview        # Preview production build locally (astro preview)
```

**Type checking:**
- TypeScript strict mode via `astro/tsconfigs/strict` in `tsconfig.json`.
- Run with: `npx astro check` (uses `@astrojs/check` package).
- Content collection schemas validated at build time via Zod (`src/content.config.ts`).
- Note: `astro check` is NOT in `package.json` scripts -- must be run manually.

**Linting:**
- No ESLint or Prettier configured. No lint command available.
- No pre-commit hooks (no `.husky/`, no `lint-staged` in `package.json`).

**Build-time validation that exists:**
- Astro validates content collection schemas at build time (Zod schemas in `src/content.config.ts`).
- TypeScript compilation errors caught during `astro build`.
- Invalid imports caught at build time.
- Sitemap generated at build time via `@astrojs/sitemap`.

## Manual Testing

**How to verify changes:**
```bash
npm run dev            # Start dev server at localhost:4321
npm run build          # Verify production build succeeds
npm run preview        # Preview production build locally
```

**What to check manually:**
1. **Page navigation:** All pages load (`/`, `/blog/`, `/projects/`, `/about/`, `/contact/`)
2. **View transitions:** Smooth page transitions without broken animations
3. **Animations:** Scroll reveals, tilt cards, magnetic buttons, text scramble, word reveal, floating orbs, timeline draw
4. **Reduced motion:** Toggle `prefers-reduced-motion` in browser devtools -- all animations should be disabled gracefully
5. **Mobile responsiveness:** Test at `sm`, `md`, `lg` breakpoints; mobile menu toggle
6. **External links:** Blog cards with `externalUrl` open in new tab with correct icon
7. **Blog content:** Blog listing, individual posts, tag filtering, RSS feed
8. **SEO:** Check meta tags, OG images, JSON-LD in page source
9. **Custom cursor:** Visible on desktop, hidden on touch/coarse pointer devices
10. **Particle canvas:** Hero background animates, cleans up on navigation

**Browser testing approach:**
- No browser testing framework configured.
- Manual testing in modern browsers (Chrome, Firefox, Safari).
- Touch device behavior (custom cursor hide, smooth scroll skip, tilt skip) requires manual device testing or Chrome DevTools device emulation.

## CI/CD

**Pipeline configuration:** `.github/workflows/deploy.yml`

**Automated checks:**
- The CI pipeline runs `astro build` only (via `withastro/action@v3`). This validates:
  - TypeScript compilation
  - Content collection schema validation
  - Static page generation
  - Asset optimization
- No test step in CI pipeline.
- No lint step in CI pipeline.
- No type-check step (`astro check`) in CI pipeline.

**Deployment:**
- Triggers on push to `main` branch or manual workflow dispatch.
- Builds with Astro action, deploys to GitHub Pages via `actions/deploy-pages@v4`.
- Custom domain: `patrykgolabek.dev` (configured via `public/CNAME`).
- Concurrency group: `"pages"` with `cancel-in-progress: false`.

**Pipeline definition:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

## Recommended Test Setup (for future implementation)

**If adding tests, use:**
- **Unit tests for utilities:** Vitest (Astro-native) for `src/lib/*.ts` and `src/data/*.ts`
- **Component tests:** `@astrojs/test-utils` or JSDOM-based rendering for `.astro` components
- **E2E tests:** Playwright for full page rendering, view transitions, and animation behavior
- **Visual regression:** Percy or Chromatic for design consistency

**Highest-value tests to add first:**
1. `src/data/projects.ts` -- Validate all project URLs are reachable, no duplicate entries
2. `src/data/site.ts` -- Validate config structure
3. `src/lib/og-image.ts` -- Validate OG image generation produces valid PNG
4. `src/content.config.ts` -- Validate blog frontmatter schemas beyond build-time
5. Build smoke test -- Verify `astro build` succeeds in CI before deploy

---

*Testing analysis: 2026-02-12*
