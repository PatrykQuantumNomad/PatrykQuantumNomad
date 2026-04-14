# Phase 118: Component Development and Cover Image - Research

**Researched:** 2026-04-14
**Domain:** Astro 5 component authoring, Tailwind CSS typography plugin, SVG cover image creation
**Confidence:** HIGH

## Summary

Phase 118 requires building two Astro components (StatHighlight and TermDefinition) and one cover SVG. The project has a well-established component authoring pattern visible across 8 existing blog components in `src/components/blog/`. Every blog component follows the same formula: TypeScript Props interface in the frontmatter fence, `not-prose` class on the outer wrapper to escape `@tailwindcss/typography` inheritance, CSS custom properties (`var(--color-*)`) for theme compatibility, and Tailwind utility classes for layout. No component uses external dependencies -- all styling is self-contained via Tailwind + CSS custom properties.

The cover SVG follows an equally established pattern. Seven existing cover SVGs in `public/images/` all use a 1200-wide viewBox (either 1200x630 or 1200x690), dark backgrounds with radial gradients, the amber accent color (#D97706), and system-safe font stacks. The blog post template in `[slug].astro` renders `coverImage` as an `<img>` with `width="1200" height="630"`, confirming the expected aspect ratio.

Both tasks are purely additive (new files, no modifications to existing code) and require zero npm dependencies. The primary risk is visual inconsistency with existing components or theme breakage in light/dark mode.

**Primary recommendation:** Follow the exact patterns from OpeningStatement.astro and KeyTakeaway.astro for component structure; follow death-by-a-thousand-arrows-cover.svg for the dark cover SVG pattern.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMP-01 | StatHighlight Astro component for big-number statistics callouts (zero dependencies, Tailwind-styled) | Pattern verified from 8 existing blog components; Props interface, `not-prose`, CSS custom properties pattern documented below |
| COMP-02 | TermDefinition Astro component for dictionary-entry styled definitions (zero dependencies, Tailwind-styled) | Same pattern as COMP-01; dictionary-entry styling achievable with existing font families (font-heading, font-mono, font-sans) |
| INTG-04 | Custom cover image SVG with dark-on-dark motif matching site visual language | 7 existing cover SVGs analyzed; dark palette colors, viewBox dimensions, gradient patterns, and font stacks documented |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- GitHub profile repository for patrykgolabek.dev
- README uses GitHub-flavored Markdown; keep formatting compatible with GitHub's profile README rendering
- Tone: professional but approachable
- SEO priorities: keyword-rich content, backlinks, structured formatting
- The site is an Astro 5 static site deployed at https://patrykgolabek.dev

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 | Component framework (.astro SFCs) | Already installed; all blog components are .astro files [VERIFIED: node_modules/astro/package.json] |
| tailwindcss | 3.4.19 | Utility-first CSS | Already installed; all existing components use Tailwind classes [VERIFIED: node_modules/tailwindcss/package.json] |
| @tailwindcss/typography | 0.5.19 | Prose styling + `not-prose` escape hatch | Already installed; blog post content renders inside `prose` wrapper [VERIFIED: node_modules/@tailwindcss/typography/package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.0.18 | Test runner for build validation | Already installed; used for SVG validation if needed [VERIFIED: node_modules/vitest/package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Astro .astro components | React .tsx components | Unnecessary -- .astro components are simpler, zero-JS by default, and consistent with all existing blog components |
| Tailwind utilities | Scoped `<style>` blocks | Would break consistency with other components; CSS custom properties already handle theming |
| Hand-coded SVG | Image generation library (sharp/satori) | Existing covers are all hand-coded SVGs; sharp/satori are used for OG images, not cover images |

**Installation:** No new packages needed. All dependencies already installed.

## Architecture Patterns

### Component File Placement
```
src/components/blog/
  StatHighlight.astro    # NEW - COMP-01
  TermDefinition.astro   # NEW - COMP-02
  OpeningStatement.astro # EXISTING - reference pattern
  TldrSummary.astro      # EXISTING - reference pattern
  KeyTakeaway.astro      # EXISTING - reference pattern
  Callout.astro          # EXISTING - reference pattern
  Figure.astro           # EXISTING - reference pattern
  Lede.astro             # EXISTING - simplest reference

public/images/
  dark-code-cover.svg    # NEW - INTG-04
```

### Pattern 1: Blog Component Anatomy (Established Pattern)

**What:** Every blog component follows a strict three-part structure: TypeScript Props interface, destructured props with defaults, and a single root element with `not-prose` class.

**When to use:** All custom components rendered inside the `prose` wrapper in blog MDX files.

**Example (from existing KeyTakeaway.astro):**
```astro
// Source: src/components/blog/KeyTakeaway.astro (verified in codebase)
---
interface Props {
  title?: string;
}
const { title = 'Key Takeaway' } = Astro.props;
---

<aside class="not-prose my-8 p-6 rounded-lg border border-[var(--color-accent)]/30 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent" data-key-takeaway>
  <h3 class="font-heading font-bold text-lg text-[var(--color-text-primary)] mb-3">
    <span class="inline-flex ..." aria-hidden="true">!</span>{title}
  </h3>
  <div class="text-[var(--color-text-primary)] [&>p]:mb-2 [&>p:last-child]:mb-0">
    <slot />
  </div>
</aside>
```

**Key conventions observed across all 8 blog components:**
1. Root element uses `not-prose` class [VERIFIED: all 8 components]
2. Colors use `var(--color-*)` CSS custom properties, never hardcoded [VERIFIED: all 8 components]
3. Typography uses `font-heading`, `font-sans`, `font-mono` from tailwind.config.mjs [VERIFIED: tailwind.config.mjs]
4. Spacing uses Tailwind `my-8` or `my-6` for vertical rhythm [VERIFIED: all 8 components]
5. Optional `data-*` attributes for targeting (e.g., `data-tldr`, `data-key-takeaway`) [VERIFIED: TldrSummary, KeyTakeaway]
6. `<slot />` for content passed from MDX [VERIFIED: all 8 components]
7. No `<style>` blocks -- all styling is Tailwind utility classes [VERIFIED: all 8 components]
8. No `<script>` blocks -- components are static HTML [VERIFIED: all 8 blog components]

### Pattern 2: MDX Import and Usage

**What:** Blog MDX files import components with relative paths and use them as JSX tags.

**Example (from existing blog posts):**
```mdx
// Source: src/data/blog/the-beauty-index.mdx (verified in codebase)
import OpeningStatement from '../../components/blog/OpeningStatement.astro';
import TldrSummary from '../../components/blog/TldrSummary.astro';
import KeyTakeaway from '../../components/blog/KeyTakeaway.astro';

<OpeningStatement>Bold opening text here.</OpeningStatement>

<TldrSummary>
- Bullet point one
- Bullet point two
</TldrSummary>

<KeyTakeaway title="Custom Title">
Content here that escapes prose styling.
</KeyTakeaway>
```

### Pattern 3: Cover SVG Structure

**What:** All cover SVGs follow a consistent structure: XML declaration, viewBox at 1200 wide, defs block with gradients/filters, dark background rect, decorative elements, centered text.

**Example structure (from existing covers):**
```xml
<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Gradients, filters, patterns -->
  </defs>
  <!-- Background rect -->
  <rect width="1200" height="630" fill="url(#bg-gradient)"/>
  <!-- Decorative elements -->
  <!-- Title text -->
  <!-- Attribution -->
</svg>
```

**Verified cover SVG conventions:**
- ViewBox: 1200x630 (3 covers) or 1200x690 (4 covers) -- use 1200x630 to match the `<img width="1200" height="630">` in `[slug].astro` [VERIFIED: grep of all cover SVGs + [slug].astro line 239]
- Dark backgrounds use: `#0f0f23`, `#1a1a2e`, `#111018`, `#0a0910`, `#06050a` [VERIFIED: death-by-a-thousand-arrows-cover.svg, claude-code-guide-refresh-cover.svg]
- Accent amber: `#D97706`, `#F59E0B` [VERIFIED: claude-code-guide-refresh-cover.svg]
- System fonts: `Helvetica,Arial,sans-serif` for UI text, `Georgia,'Times New Roman',serif` for subtitles [VERIFIED: claude-code-guide-refresh-cover.svg]
- Monospace: `'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace` [VERIFIED: death-by-a-thousand-arrows-cover.svg]
- Light text: white with `fill-opacity` for hierarchy (0.9, 0.5, 0.4, etc.) [VERIFIED: both cover SVGs read]
- SVG filters: `feGaussianBlur`, `feMerge` for glow effects; `feTurbulence` for noise texture [VERIFIED: death-by-a-thousand-arrows-cover.svg]

### Anti-Patterns to Avoid

- **Hardcoded colors in components:** Never use `#hex` or `rgb()` in .astro blog components. Always use `var(--color-*)`. The site has light and dark themes. [VERIFIED: global.css defines both :root and html.dark palettes]
- **Missing `not-prose` on root element:** Without `not-prose`, the @tailwindcss/typography plugin will override font sizes, margins, and colors inside the component. Every existing blog component uses it. [CITED: https://github.com/tailwindlabs/tailwindcss-typography]
- **Using `<h2>` inside components:** The blog TOC relies on `.prose h2` selectors for IntersectionObserver-based active highlighting. Using `<h2>` in a `not-prose` component will either be invisible to the TOC (correct) or confuse heading hierarchy. Use `<h3>` or lower inside components, or avoid heading elements entirely for callout-style blocks. [VERIFIED: [slug].astro lines 466-482]
- **External dependencies in blog components:** The phase requirements explicitly state "zero dependencies." The project's blog components are all pure Astro + Tailwind. Do not introduce new npm packages.
- **Mismatched cover SVG dimensions:** The `[slug].astro` template hard-codes `width="1200" height="630"` on the cover image element. An SVG with different proportions will render with incorrect aspect ratio. [VERIFIED: [slug].astro line 239]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme-aware colors | Custom theme detection JS | CSS custom properties `var(--color-*)` | Already defined in global.css for both light and dark; zero JS needed [VERIFIED: global.css] |
| Prose escape | Custom CSS overrides | `not-prose` class from @tailwindcss/typography | Built-in feature of the typography plugin; every existing component uses it [VERIFIED: all blog components] |
| Font families | Custom @font-face in component | Tailwind `font-heading`, `font-sans`, `font-mono` | Already configured in tailwind.config.mjs with fallbacks [VERIFIED: tailwind.config.mjs] |
| SVG gradients | CSS gradients on container | Inline SVG `<defs>` with `<radialGradient>` / `<linearGradient>` | Consistent with all existing cover SVGs; renders correctly as static image [VERIFIED: all cover SVGs] |

**Key insight:** Both components and the cover SVG should be 100% static -- no JavaScript, no build-time data fetching, no external dependencies. The patterns are fully established in the codebase.

## Common Pitfalls

### Pitfall 1: Theme Colors Breaking in Light Mode
**What goes wrong:** Component looks great in dark mode but is invisible or clashing in light mode because CSS custom properties were not tested in both themes.
**Why it happens:** Developer tests only in dark mode (common for dark-themed sites). The site has both light and dark palettes.
**How to avoid:** Use only `var(--color-*)` properties. Both palettes are defined in `src/styles/global.css`. The key pairs are: `--color-surface` (bg), `--color-surface-alt` (elevated bg), `--color-text-primary`, `--color-text-secondary`, `--color-accent`, `--color-border`.
**Warning signs:** Any hex color or `rgb()` value in component Tailwind classes.

### Pitfall 2: StatHighlight Number Not Being Visually Dominant
**What goes wrong:** The "big number" in a StatHighlight (e.g., "4x", "17%", "<10%") does not stand out enough from surrounding prose, defeating the purpose of the callout.
**Why it happens:** Using the same font-size as body text, or not enough contrast between number and label.
**How to avoid:** Use `font-heading` with `text-4xl` or `text-5xl` for the stat number. Use `text-[var(--color-accent)]` for the number to create visual hierarchy. Keep label text smaller (`text-sm` or `text-xs`).
**Warning signs:** Component blends into surrounding text instead of creating a visual break.

### Pitfall 3: TermDefinition Not Looking "Dictionary-Like"
**What goes wrong:** The definition block looks like a regular blockquote instead of a dictionary entry.
**Why it happens:** Missing the visual cues that readers associate with dictionary entries: the term in bold, pronunciation in a different style (italic monospace or parenthetical), definition as a separate block.
**How to avoid:** Use distinct typographic treatments: term in `font-heading font-bold text-xl`, pronunciation in `font-mono text-sm italic text-[var(--color-text-secondary)]`, definition in `font-sans text-base`.
**Warning signs:** Readers cannot distinguish the component from a regular blockquote or callout.

### Pitfall 4: Cover SVG Text Rendering Across Browsers
**What goes wrong:** SVG text renders with wrong fonts or poor anti-aliasing on some browsers/OS combinations.
**Why it happens:** SVG `font-family` relies on system fonts. If the first font is not available, fallbacks may not match the design intent.
**How to avoid:** Use safe font stacks: `Helvetica,Arial,sans-serif` for UI text, `Georgia,'Times New Roman',serif` for editorial text. Never rely on web fonts in SVGs rendered as `<img>` (web fonts are not loaded for `<img>` SVGs). The existing cover SVGs already use this pattern.
**Warning signs:** Text looks different on macOS vs Windows vs Linux.

### Pitfall 5: GSAP Animation on not-prose Elements
**What goes wrong:** The blog post template animates `.prose .not-prose` elements with a fade-up GSAP animation (y: 30, opacity: 0). If a component has `not-prose` on the root, GSAP will animate it on scroll.
**Why it happens:** The `[slug].astro` script line 482-493 targets `.prose figure, .prose .not-prose` for scroll-triggered animations.
**How to avoid:** This is actually desirable behavior -- it gives components a nice entrance animation. But be aware that initial opacity will be 0 until the scroll trigger fires. Do not add separate animation logic to these components.
**Warning signs:** Component appears invisible until scrolled into view (this is expected behavior).

## Code Examples

### StatHighlight Component (Recommended Implementation)

```astro
// Source: Derived from KeyTakeaway.astro + TldrSummary.astro patterns [VERIFIED: codebase]
---
interface Props {
  stat: string;
  label: string;
  source?: string;
}
const { stat, label, source } = Astro.props;
---

<aside class="not-prose my-8 py-6 text-center" data-stat-highlight>
  <p class="font-heading font-bold text-4xl sm:text-5xl text-[var(--color-accent)] mb-2">
    {stat}
  </p>
  <p class="text-[var(--color-text-primary)] text-sm font-medium uppercase tracking-wider">
    {label}
  </p>
  {source && (
    <p class="text-[var(--color-text-secondary)] text-xs mt-2 italic">
      {source}
    </p>
  )}
</aside>
```

**Usage in MDX:**
```mdx
import StatHighlight from '../../components/blog/StatHighlight.astro';

<StatHighlight stat="4x" label="increase in code clones" source="GitClear 2025 analysis of 211 million lines" />
```

### TermDefinition Component (Recommended Implementation)

```astro
// Source: Derived from TldrSummary.astro + Lede.astro patterns [VERIFIED: codebase]
---
interface Props {
  term: string;
  pronunciation?: string;
}
const { term, pronunciation } = Astro.props;
---

<aside class="not-prose my-8 p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]" data-term-definition>
  <div class="flex items-baseline gap-3 mb-3">
    <h3 class="font-heading font-bold text-xl text-[var(--color-text-primary)]">{term}</h3>
    {pronunciation && (
      <span class="font-mono text-sm italic text-[var(--color-text-secondary)]">{pronunciation}</span>
    )}
  </div>
  <div class="text-[var(--color-text-primary)] text-base leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
    <slot />
  </div>
</aside>
```

**Usage in MDX:**
```mdx
import TermDefinition from '../../components/blog/TermDefinition.astro';

<TermDefinition term="Dark Code" pronunciation="/dark kohd/">
Code that executes in production but is not understood by any current team member. It works -- until it doesn't. No one can explain its behavior, predict its failure modes, or safely modify it.
</TermDefinition>
```

### Cover SVG Dark-on-Dark Structure

```xml
<!-- Source: Derived from death-by-a-thousand-arrows-cover.svg + claude-code-guide-refresh-cover.svg [VERIFIED: codebase] -->
<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="bg-glow" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#0f0f23"/>
    </radialGradient>
    <!-- Additional gradients, filters, noise -->
  </defs>

  <!-- Dark background -->
  <rect width="1200" height="630" fill="url(#bg-glow)"/>

  <!-- Title text in system-safe fonts -->
  <text x="600" y="..." font-family="Helvetica,Arial,sans-serif"
        font-size="14" fill="white" fill-opacity="0.9"
        text-anchor="middle" letter-spacing="6" font-weight="bold">
    DARK CODE
  </text>

  <!-- Attribution -->
  <text x="600" y="..." font-family="Helvetica,Arial,sans-serif"
        font-size="12" fill="white" fill-opacity="0.85"
        text-anchor="middle" letter-spacing="2">
    patrykgolabek.dev/blog/dark-code
  </text>
</svg>
```

## CSS Custom Properties Reference

All available theme tokens from `src/styles/global.css` [VERIFIED: global.css]:

| Property | Light Value | Dark Value | Use For |
|----------|------------|------------|---------|
| `--color-surface` | `#fffaf7` | `#0f1117` | Component background |
| `--color-surface-alt` | `#f5ede6` | `#1a1d27` | Elevated background (cards, asides) |
| `--color-text-primary` | `#2c2c2c` | `#e8e8f0` | Primary text |
| `--color-text-secondary` | `#5a5a5a` | `#9ca3af` | Secondary/muted text |
| `--color-accent` | `#c44b20` | `#e06040` | Accent color (links, highlights) |
| `--color-accent-hover` | `#a33f1a` | `#f07050` | Hover states |
| `--color-accent-secondary` | `#006d6d` | `#00a3a3` | Secondary accent (teal) |
| `--color-accent-glow` | `rgba(196,75,32,0.3)` | `rgba(224,96,64,0.3)` | Glow effects |
| `--color-gradient-start` | `#c44b20` | `#e06040` | Gradient start |
| `--color-gradient-end` | `#006d6d` | `#00a3a3` | Gradient end |
| `--color-border` | `#e5ddd5` | `#2a2d3a` | Borders |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind `prose-invert` for dark mode | CSS custom properties in typography config | tailwind.config.mjs (current) | Typography plugin reads from CSS vars automatically; no class toggling needed [VERIFIED: tailwind.config.mjs typography section] |
| Content Collections v1 (Astro 2-3) | Content Collections v2 with loaders (Astro 5) | Astro 5.x | Blog schema uses `glob` loader; MDX components work the same way [VERIFIED: src/content.config.ts] |
| `heroImage` frontmatter key | `coverImage` frontmatter key | Current codebase | Blog schema uses `coverImage: z.string().optional()` [VERIFIED: src/content.config.ts line 19] |

**Deprecated/outdated:**
- `heroImage`: The schema uses `coverImage` not `heroImage`. Phase description mentions "heroImage" in other contexts but the actual schema field is `coverImage`. [VERIFIED: content.config.ts]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | StatHighlight renders stat, label, source | build verification | `npx astro build` (type-checks + component compilation) | N/A -- Astro components verified via build |
| COMP-02 | TermDefinition renders term, pronunciation, slot | build verification | `npx astro build` | N/A -- Astro components verified via build |
| INTG-04 | Cover SVG exists at correct path with valid structure | smoke | `test -f public/images/dark-code-cover.svg && grep -q 'viewBox' public/images/dark-code-cover.svg` | N/A -- file existence check |

### Sampling Rate
- **Per task commit:** `npx astro build` (verifies components compile and SVG is accessible)
- **Per wave merge:** `npx vitest run && npx astro build`
- **Phase gate:** Full build green + visual inspection of components in dev server

### Wave 0 Gaps
None -- these are static Astro components and an SVG file. The existing build pipeline validates component compilation. No new test files are needed for this phase. Visual validation requires human inspection in the dev server.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | StatHighlight should center-align the stat number (based on callout block design intent) | Code Examples | Low -- easily adjusted to left-align if author prefers |
| A2 | Cover SVG should use 1200x630 (not 1200x690) to match the `<img>` dimensions in [slug].astro | Architecture Patterns | Medium -- 1200x690 would render with slight letterboxing; both sizes exist in codebase |
| A3 | TermDefinition pronunciation guide should use monospace italic | Code Examples | Low -- stylistic choice; could use sans-serif instead |

## Open Questions (RESOLVED)

1. **Cover SVG thematic content: What visual motif represents "dark code"?**
   - What we know: The theme is "dark code" -- code that nobody understands. The essay covers code clones, comprehension decay, refactoring collapse. Existing covers use visual metaphors (falling arrows for "Death by a Thousand Arrows", chapter cards for "Claude Code Guide Refresh").
   - What's unclear: The specific visual metaphor for "dark code" -- could be fading/corrupted code text, a black hole consuming code, a dimming terminal, binary data dissolving, etc.
   - Recommendation: Use a "corrupted/fading code" motif on a dark background -- monospace text fragments at varying opacities, some legible, some nearly invisible, representing code that is drifting from comprehension. This aligns with the essay's central metaphor and the dark-on-dark requirement.
   - RESOLVED: Plans implement the "corrupted/fading code" motif -- monospace text fragments at opacity 0.03-0.15 scattered across a dark background, with the "DARK CODE" title as the clear focal point. See 118-02-PLAN.md Task 1.

2. **StatHighlight visual weight: Should the component have a background or be borderless?**
   - What we know: The outline specifies it as a "visually distinct callout block." KeyTakeaway uses a background with border; OpeningStatement uses border-y without background. The success criteria say "visually distinct."
   - What's unclear: Whether it should be more like KeyTakeaway (boxed) or OpeningStatement (minimal).
   - Recommendation: Use a minimal style (border-top/bottom with centered text) similar to OpeningStatement but with the large stat number creating the visual distinction through typography rather than boxing. This keeps it lighter than a full card while still breaking the prose flow.
   - RESOLVED: Plans implement the minimal borderless style -- no background, no border. The large accent-colored stat number (text-4xl/text-5xl) creates visual distinction through typography scale alone, appropriate for the 6+ repeated uses in the essay. See 118-01-PLAN.md Task 1.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Read all 8 existing blog components (OpeningStatement, TldrSummary, Callout, KeyTakeaway, Lede, ToolCard, ToolGrid, Figure) to extract component authoring patterns
- **Codebase analysis** -- Read 2 existing cover SVGs (death-by-a-thousand-arrows-cover.svg, claude-code-guide-refresh-cover.svg) and grep'd all 7 cover SVG viewBox dimensions
- **Codebase analysis** -- Read tailwind.config.mjs, astro.config.mjs, src/styles/global.css, src/content.config.ts, src/pages/blog/[slug].astro, vitest.config.ts
- **Codebase analysis** -- Read 3 blog MDX files (the-beauty-index.mdx, death-by-a-thousand-arrows.mdx, claude-code-guide-refresh.mdx) to verify import/usage patterns
- **Codebase analysis** -- Read Phase 117 outline.md to understand component usage context (which stats, which definition)
- **npm installed versions** -- astro 5.17.1, tailwindcss 3.4.19, @tailwindcss/typography 0.5.19, vitest 4.0.18

### Secondary (MEDIUM confidence)
- [Tailwind CSS Typography Plugin - not-prose](https://github.com/tailwindlabs/tailwindcss-typography) -- Confirmed `not-prose` is the official escape hatch for the typography plugin

### Tertiary (LOW confidence)
- None -- all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and patterns verified in codebase
- Architecture: HIGH -- 8 existing blog components provide unambiguous patterns to follow
- Pitfalls: HIGH -- identified from direct codebase analysis (theme system, GSAP animation targeting, SVG font safety)
- Cover SVG: HIGH for structure/dimensions, HIGH for thematic content (resolved -- corrupted/fading code motif)

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable -- Astro component patterns unlikely to change within the milestone)
