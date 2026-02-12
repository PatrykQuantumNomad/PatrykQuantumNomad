# Testing Patterns

**Analysis Date:** 2026-02-12

## Test Framework

**Runner:**
- Not detected — no test framework currently configured

**Assertion Library:**
- Not detected

**Run Commands:**
- Not applicable — no test scripts in `package.json`

**Current package.json scripts:**
```bash
npm run dev              # Start Astro dev server
npm run build            # Build static site
npm run preview          # Preview production build
```

## Test File Organization

**Location:**
- No test files found in project (searches for `*.test.*` and `*.spec.*` returned zero results in `src/`)

**Naming:**
- Not applicable — no existing tests

**Structure:**
- Not applicable — no existing tests

## Test Structure

**Suite Organization:**
- Not detected — no test files exist

**Patterns:**
- Not applicable

## Mocking

**Framework:**
- Not detected

**Patterns:**
- Not applicable — no tests exist

**What to Mock:**
- Not applicable

**What NOT to Mock:**
- Not applicable

## Fixtures and Factories

**Test Data:**
- No test data fixtures detected
- Production data located in `src/data/`:
  - `src/data/site.ts` — Site configuration and metadata
  - `src/data/projects.ts` — Project listing with categories

**Location:**
- Not applicable — no test fixtures

## Coverage

**Requirements:**
- Not enforced — no coverage tooling detected

**View Coverage:**
- Not applicable

## Test Types

**Unit Tests:**
- Not present

**Integration Tests:**
- Not present

**E2E Tests:**
- Not present

## Common Patterns

**Async Testing:**
- Not applicable — no tests exist

**Error Testing:**
- Not applicable — no tests exist

## Testing Recommendations

Given this is an Astro static site project, consider:

1. **Component testing:** Use `@astrojs/test` or Vitest for Astro component unit tests
2. **E2E testing:** Playwright or Cypress for critical user flows (navigation, form submission on `/contact`)
3. **Visual regression:** Percy or Chromatic for design consistency
4. **Accessibility testing:** axe-core integration for a11y compliance
5. **Build validation:** Ensure `npm run build` succeeds in CI pipeline

**Testing gaps to address:**
- Animation logic in `src/lib/smooth-scroll.ts`, `src/lib/scroll-animations.ts`, and `src/lib/animation-lifecycle.ts`
- OG image generation in `src/lib/og-image.ts`
- Content schema validation in `src/content.config.ts`
- Blog post rendering and metadata extraction

---

*Testing analysis: 2026-02-12*
