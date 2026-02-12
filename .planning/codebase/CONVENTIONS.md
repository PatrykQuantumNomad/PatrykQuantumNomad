# Coding Conventions

**Analysis Date:** 2026-02-12

## File Naming

**Components:**
- Use PascalCase for all `.astro` component files: `BlogCard.astro`, `SEOHead.astro`, `PersonJsonLd.astro`
- Animation components live in `src/components/animations/` with PascalCase: `SplitText.astro`, `TiltCard.astro`
- Multi-word names use PascalCase without separators: `BlogPostingJsonLd.astro`, `TableOfContents.astro`

**Pages:**
- Use kebab-case for page files: `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/contact.astro`
- Nested routes use directory-based routing: `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`
- Dynamic routes use bracket syntax: `[slug].astro`, `[tag].astro`, `[...slug].png.ts`

**TypeScript library files:**
- Use kebab-case: `src/lib/animation-lifecycle.ts`, `src/lib/scroll-animations.ts`, `src/lib/og-image.ts`

**Data files:**
- Use kebab-case: `src/data/site.ts`, `src/data/projects.ts`

**Blog content:**
- Use kebab-case markdown files: `building-kubernetes-observability-stack.md`
- External blog stubs prefixed with `ext-`: `ext-apache-airflow-data-pipeline.md`

**Style files:**
- Single global CSS file: `src/styles/global.css`

**Assets:**
- Images: lowercase, kebab-case: `src/assets/images/meandbatman.jpg`
- Fonts: PascalCase with hyphen: `src/assets/fonts/Inter-Regular.woff`

## Code Style

**Formatting:**
- No Prettier or ESLint configured. Formatting is manual/editor-based.
- Use 2-space indentation in all files (`.astro`, `.ts`, `.css`, `.mjs`).
- Single quotes for JavaScript/TypeScript string literals.
- Semicolons at end of statements.
- Trailing commas in multi-line objects and arrays.

**Linting:**
- No linter configured. Use `astro check` for TypeScript validation (via `@astrojs/check`).

**TypeScript:**
- Strict mode enabled via `"extends": "astro/tsconfigs/strict"` in `tsconfig.json`.
- Define component prop interfaces with `interface Props` in frontmatter:

```astro
---
interface Props {
  title: string;
  description?: string;
  tags?: string[];
}

const { title, description = 'Default', tags } = Astro.props;
---
```

- Use `as const` for readonly data arrays and objects (see `src/data/site.ts`, `src/data/projects.ts`).
- Export TypeScript types alongside data: `export type Category = (typeof categories)[number];`

## Import Organization

**Order in Astro frontmatter:**
1. Astro built-in imports (`astro:content`, `astro:assets`, `astro:transitions`)
2. Layout imports (`../layouts/Layout.astro`)
3. Component imports (`../components/Header.astro`)
4. Data imports (`../data/site`, `../data/projects`)
5. Asset imports (`../assets/images/meandbatman.jpg`)

**Example from `src/pages/index.astro`:**
```astro
---
import { getCollection } from 'astro:content';
import { Image } from 'astro:assets';
import Layout from '../layouts/Layout.astro';
import ParticleCanvas from '../components/ParticleCanvas.astro';
import PersonJsonLd from '../components/PersonJsonLd.astro';
import { siteConfig } from '../data/site';
import heroImg from '../assets/images/meandbatman.jpg';
---
```

**Path Aliases:**
- No path aliases configured. Use relative paths (`../`, `../../`).

## Component Patterns

**Astro component structure (standard pattern):**

1. **Frontmatter block** (`---`): imports, Props interface, data fetching, computed values
2. **Template**: HTML markup with Astro expressions
3. **`<style>` block** (optional): scoped CSS, placed after template
4. **`<script>` block** (optional): client-side JavaScript, placed after template

```astro
---
// Component comment describing purpose
import { Image } from 'astro:assets';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<section>
  <h1>{title}</h1>
</section>

<style>
  /* scoped styles */
</style>

<script>
  // client-side behavior
</script>
```

**Animation component pattern (script-only components):**
- Animation components in `src/components/animations/` are script-only -- no template markup, no frontmatter.
- They are included in `src/layouts/Layout.astro` and initialize via `astro:page-load` events.
- Pattern: query DOM elements by `data-*` attributes, attach behavior.

```astro
<!-- ComponentName.astro — Description of what it does -->
<script>
  function initFeature() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Query elements, attach behavior
  }

  document.addEventListener('astro:page-load', initFeature);
</script>
```

**Client-side script lifecycle (critical pattern):**
- Use `astro:page-load` for initialization (fires on every navigation, including view transitions).
- Use `astro:before-swap` for cleanup (fires before page content is replaced).
- Use `astro:before-preparation` for pre-navigation hooks (e.g., loading indicators).

```typescript
// Initialize on every page load (including view transitions)
document.addEventListener('astro:page-load', initFeature);

// Clean up before page swap
document.addEventListener('astro:before-swap', cleanupFeature);
```

**Persistent elements across view transitions:**
- Use `transition:persist="identifier"` on elements that should survive page swaps.
- Examples: `transition:persist="particle-hero"`, `transition:persist="cursor-dot"`

**Component comment convention:**
- Use a single-line comment at the top of frontmatter or before the script tag describing purpose:
```astro
---
// Header.astro
// Scroll-aware sticky header with backdrop blur, animated underlines, and smooth mobile menu.
---
```

## Animation Conventions

**Data attribute system for animations:**
- `data-reveal` / `data-reveal="left"` / `data-reveal="right"` — Clip-path scroll reveal (default: up). Handled by `src/lib/scroll-animations.ts`.
- `data-tilt` — 3D tilt effect on hover. Handled by `src/components/animations/TiltCard.astro`.
- `data-magnetic` — Magnetic cursor attraction on hover. Handled by `src/components/animations/MagneticButton.astro`.
- `data-word-reveal` — Word-by-word heading reveal. Handled by `src/components/animations/WordReveal.astro`.
- `data-animate="headline"` — Text scramble decryption effect. Handled by `src/components/animations/TextScramble.astro`.
- `data-section-bg="skills|writing|cta"` — Floating gradient orbs. Handled by `src/components/animations/FloatingOrbs.astro`.
- `data-timeline` — Timeline draw-line SVG animation. Handled by `src/components/animations/TimelineDrawLine.astro`.
- `data-parallax="hero"` — Parallax scrolling. Handled by `src/lib/scroll-animations.ts`.
- `data-divider-reveal` — Animated gradient divider line. Handled by `src/lib/scroll-animations.ts`.
- `data-card-group` / `data-card-item` — Cascading card group reveal. Handled by `src/lib/scroll-animations.ts`.
- `data-cursor="expand"` — Custom cursor expansion. Handled by `src/components/animations/CustomCursor.astro`.

**Animation lifecycle management:**
- Central lifecycle module: `src/lib/animation-lifecycle.ts`
- All GSAP ScrollTrigger instances and Lenis smooth scroll are initialized on `astro:page-load` and cleaned up on `astro:before-swap`.
- Pattern: `cleanupAnimations()` kills all ScrollTrigger instances, destroys Lenis, and kills GSAP tweens.

**Reduced motion handling (mandatory):**
- Every animation component and script MUST check `prefers-reduced-motion: reduce` and bail out early.
- Pattern used consistently across all animation files:

```typescript
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initFeature() {
  if (REDUCED_MOTION) return; // or show elements instantly
  // animation code
}
```

- CSS fallbacks in `src/styles/global.css` disable transforms, animations, and decorative elements for reduced motion.
- Touch device check is also standard: `if (window.matchMedia('(pointer: coarse)').matches) return;`

**GSAP usage pattern:**
```typescript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
```

## CSS Architecture

**Global styles:** `src/styles/global.css`
- Contains all Tailwind directives (`@tailwind base/components/utilities`)
- CSS custom properties (design tokens) defined on `:root`
- Reusable utility classes (`.meta-mono`, `.btn-primary`, `.card-hover`, etc.)
- Animation keyframes and states
- Reduced motion overrides
- No dark mode CSS variables defined (light theme only with dark mode toggle stub)

**CSS custom properties (design tokens):**
```css
:root {
  --color-surface: #fffaf7;
  --color-surface-alt: #f5ede6;
  --color-text-primary: #2c2c2c;
  --color-text-secondary: #5a5a5a;
  --color-accent: #c44b20;
  --color-accent-hover: #a33f1a;
  --color-accent-secondary: #006d6d;
  --color-accent-glow: rgba(196, 75, 32, 0.3);
  --color-gradient-start: #c44b20;
  --color-gradient-end: #006d6d;
  --color-border: #e5ddd5;
}
```

**Tailwind usage pattern:**
- Use Tailwind utility classes inline for layout, spacing, typography, and responsive design.
- Reference CSS custom properties via bracket notation: `text-[var(--color-text-secondary)]`, `bg-[var(--color-surface)]`
- Tailwind color tokens mapped from CSS variables in `tailwind.config.mjs` for semantic names: `text-accent`, `bg-surface`, `border-border`
- Use the mapped semantic tokens OR bracket notation -- both are used in the codebase. Prefer semantic tokens for new code.

**Responsive breakpoints:**
- Follow Tailwind defaults: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Mobile-first approach: base styles are mobile, add breakpoint prefixes for larger screens.
- Max content width: `max-w-6xl` for full-width sections, `max-w-4xl` for text-heavy pages.

**Typography:**
- Three font families configured in `tailwind.config.mjs`:
  - `font-heading` — Bricolage Grotesque (headings, bold text)
  - `font-sans` — DM Sans (body text)
  - `font-mono` — Fira Code (code, metadata `.meta-mono`)
- Font fallback metrics defined in `src/styles/global.css` to reduce CLS.
- Loaded via Google Fonts in `src/layouts/Layout.astro`.

**CSS class naming for interactive states:**
- Use BEM-like descriptive classes for reusable hover/animation effects: `.btn-primary`, `.btn-outline`, `.card-hover`, `.contact-card`, `.tech-pill`, `.social-icon`, `.icon-hover`
- Use CSS section comments with box-draw characters: `/* --- Section Name --- */`

**Component-scoped styles:**
- Use `<style>` blocks in `.astro` files for component-specific styles (e.g., typing cursor in `src/pages/index.astro`).
- These are automatically scoped by Astro.

## Accessibility Conventions

- All SVG icons include `aria-hidden="true"`.
- External links include `target="_blank" rel="noopener noreferrer"`.
- Interactive elements have `aria-label` attributes.
- Skip-to-content link present in `src/layouts/Layout.astro`.
- Focus indicators defined globally: `a:focus-visible` with accent outline.
- Decorative elements have `aria-hidden="true"` (orbs, cursors, progress bars).
- `role="banner"` on header, `role="contentinfo"` on footer.
- ARIA attributes updated dynamically (mobile menu `aria-expanded`, theme toggle `aria-label`).

## SEO Conventions

- Every page passes `title` and `description` to `Layout.astro` which delegates to `SEOHead.astro`.
- `PersonJsonLd.astro` on homepage, `BlogPostingJsonLd.astro` on blog posts.
- Canonical URLs generated automatically.
- Open Graph and Twitter Card meta tags on every page.
- Sitemap generated via `@astrojs/sitemap`.
- RSS feed at `src/pages/rss.xml.ts`.
- `llms.txt` at `src/pages/llms.txt.ts`.

## Git Conventions

**Commit message format (Conventional Commits):**
- Pattern: `type(scope): description`
- Types used: `feat`, `fix`, `docs`, `chore`
- Scopes: phase numbers (`phase-12`, `12-01`), feature areas
- Examples from recent history:
  - `feat(11-01): update hero tagline and roles, curate projects list`
  - `fix(12-01): delete draft placeholder and fix external URL bugs`
  - `docs(phase-12): complete phase execution`
  - `chore: complete v1.1 Content Refresh milestone`
- Older commits are less structured: `UI updates`, `updated about me section`

**Branch naming:**
- `main` is the primary branch (deploys to GitHub Pages on push).

---

*Convention analysis: 2026-02-12*
