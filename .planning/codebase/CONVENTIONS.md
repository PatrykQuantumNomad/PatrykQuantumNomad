# Coding Conventions

**Analysis Date:** 2026-02-12

## Naming Patterns

**Files:**
- Astro components: PascalCase (e.g., `Header.astro`, `BlogCard.astro`, `ParticleCanvas.astro`)
- TypeScript utilities: kebab-case (e.g., `smooth-scroll.ts`, `animation-lifecycle.ts`, `og-image.ts`)
- Pages: kebab-case with file-based routing (e.g., `index.astro`, `[slug].astro`, `[tag].astro`)
- Data modules: kebab-case (e.g., `projects.ts`, `site.ts`)
- Configuration files: kebab-case with extensions (e.g., `content.config.ts`, `astro.config.mjs`, `tailwind.config.mjs`)

**Functions:**
- camelCase for function names (e.g., `initSmoothScroll()`, `generateOgImage()`, `cleanupAnimations()`)
- camelCase for async functions (e.g., `loadFonts()`, `setText()`)
- Prefix `init` for initialization functions (e.g., `initScrollAnimations()`, `initHeader()`, `initTextScramble()`)

**Variables:**
- camelCase for local variables (e.g., `currentPath`, `latestPosts`, `displayTitle`)
- SCREAMING_SNAKE_CASE for constants (e.g., `REDUCED_MOTION`, `CHARS`)
- camelCase for const objects (e.g., `siteConfig`, `navLinks`)

**Types:**
- PascalCase for interfaces and types (e.g., `Project`, `Category`, `SiteConfig`, `QueueItem`, `Props`)
- PascalCase for enums and type unions derived from arrays (e.g., `Category`)

## Code Style

**Formatting:**
- No explicit formatter config detected (no .prettierrc or .eslintrc in project root)
- Uses 2-space indentation (observed in all source files)
- Single quotes for strings in TypeScript/JavaScript
- Template literals for string interpolation
- Trailing commas in multi-line arrays and objects

**Linting:**
- TypeScript: Extends `astro/tsconfigs/strict` via `tsconfig.json`
- No ESLint or Prettier configuration in project root
- Type-safe patterns enforced via TypeScript strict mode

## Import Organization

**Order:**
1. Astro framework imports (e.g., `from 'astro:content'`, `from 'astro:assets'`)
2. External package imports (e.g., `from 'gsap'`, `from 'lenis'`, `from 'satori'`)
3. Internal component imports (e.g., `from '../components/...'`)
4. Internal layout imports (e.g., `from '../layouts/Layout.astro'`)
5. Data/config imports (e.g., `from '../data/site'`)
6. Asset imports (images, fonts) (e.g., `from '../assets/images/...'`)

**Path Aliases:**
- Not used — all imports use explicit relative paths (`../`, `../../`)
- Example: `import Layout from '../layouts/Layout.astro'`
- Example: `import { siteConfig } from '../data/site'`

## Error Handling

**Patterns:**
- Minimal explicit error handling observed in current codebase
- Null checks for DOM elements: `if (!header) return;` pattern in `src/components/Header.astro`
- Defensive programming: check element existence before operations (e.g., `if (!el) return;`)
- Promise handling: async/await without try/catch in `src/lib/og-image.ts` (relies on caller handling)
- Optional chaining: used in TypeScript (e.g., `this.el.textContent || ''`)
- Non-null assertions: used sparingly with TypeScript (e.g., `interFont!` in `src/lib/og-image.ts` after null check)

## Logging

**Framework:** Console (native browser/Node.js APIs)

**Patterns:**
- No logging infrastructure detected in source code
- No console.log statements found in production code
- Relies on framework (Astro) and browser DevTools for debugging

## Comments

**When to Comment:**
- Astro component purpose: First line of component files (e.g., `// Header.astro`)
- Component description: Second line describes purpose (e.g., `// Scroll-aware sticky header with backdrop blur, animated underlines, and smooth mobile menu.`)
- Inline explanations for complex logic (e.g., animation parameters in `src/components/animations/TextScramble.astro`)
- Data structure clarification (e.g., interface property comments in `src/data/site.ts`)

**JSDoc/TSDoc:**
- Not actively used in current codebase
- Type safety provided via TypeScript interfaces instead of JSDoc annotations

## Function Design

**Size:**
- Small, focused functions (typically 10-30 lines)
- Longer functions for complex UI logic (e.g., `setText()` in `src/components/animations/TextScramble.astro` at ~50 lines)
- Init functions tend to be longer (40-60 lines) due to setup logic

**Parameters:**
- Use interface props for Astro components (e.g., `interface Props { title: string; description?: string; }`)
- Optional parameters via TypeScript optional operator `?` (e.g., `tags?: string[]`)
- Default values in function signatures (e.g., `tags: string[] = []`)
- Destructuring for object parameters (e.g., `const { title, description } = Astro.props`)

**Return Values:**
- Explicit return types for TypeScript functions (e.g., `function truncate(text: string, maxLength: number): string`)
- Promise return types for async functions (e.g., `async function generateOgImage(...): Promise<Buffer>`)
- Void return for side-effect functions (e.g., `export function cleanupAnimations()`)
- Early returns for guard clauses (e.g., `if (!el) return;`)

## Module Design

**Exports:**
- Named exports preferred over default exports
- Example: `export const siteConfig = { ... } as const`
- Example: `export interface Project { ... }`
- Example: `export function initSmoothScroll() { ... }`
- Type-only exports when appropriate (e.g., `export type Category = ...`)

**Barrel Files:**
- Not used — components and utilities imported directly from their file paths
- Example: `import Layout from '../layouts/Layout.astro'` instead of `from '../layouts'`

---

*Convention analysis: 2026-02-12*
