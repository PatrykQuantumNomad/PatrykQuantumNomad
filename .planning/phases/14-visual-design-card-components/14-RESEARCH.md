# Phase 14: Visual Design & Card Components - Research

**Researched:** 2026-02-13
**Domain:** CSS glassmorphism, Tailwind badge/pill patterns, category-tinted hover effects, monospace metadata headers
**Confidence:** HIGH

## Summary

Phase 14 enhances the existing ProjectCard and ProjectHero components (built in Phase 13) with four visual polish features: tech stack badges as styled pills, project status indicators with distinct styling per status, glassmorphism with category-tinted glow on hover, and category headers with monospace project count metadata. All work builds on top of the existing Astro + Tailwind CSS v3 stack with GSAP animations already in place.

The codebase already has strong foundations for every requirement. Tech pills (`tech-pill` class) already exist with hover effects in `global.css`. Status badges are already rendered with per-status color tinting (`emerald` for active, `amber` for experimental, `gray` for archived). The `card-hover` class already implements glassmorphism (`backdrop-filter: blur(12px)`) with a generic accent glow on hover. Category headers exist but lack the project count metadata. The phase work is therefore an **enhancement pass** -- upgrading existing basic implementations to the visually rich specifications in VIS-01 through VIS-05.

**Primary recommendation:** Enhance existing CSS classes and component templates in-place. Use Tailwind arbitrary values and CSS custom properties for category-specific glow colors. No new libraries needed.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site framework with `.astro` components | Already renders all project components |
| Tailwind CSS | ^3.4.19 | Utility-first CSS with box-shadow-color, backdrop-filter | All existing styling uses Tailwind |
| GSAP | ^3.14.2 | Scroll-triggered reveal animations | Already animates cards via `data-card-item` |
| vanilla-tilt | ^1.8.1 | 3D card tilt on hover | Already wired via `data-tilt` attribute |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/typography | ^0.5.19 | Prose styling | Not needed for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS custom properties for category colors | Tailwind plugin for dynamic colors | Custom properties are simpler, already used throughout the design system |
| Inline Tailwind arbitrary values | New Tailwind theme colors | Arbitrary values avoid polluting the theme config for 4 one-off category colors |
| CSS-only glassmorphism glow | JavaScript-driven glow effect | CSS hover transitions are simpler and more performant than JS-driven alternatives |

**Installation:**
```bash
# No new packages needed - everything is already installed
```

## Architecture Patterns

### Files to Modify
```
src/
├── components/
│   ├── ProjectCard.astro      # MODIFY: Enhanced tech pills, status badges, category glow
│   └── ProjectHero.astro      # MODIFY: Enhanced tech pills, status badges, Featured badge
├── pages/
│   └── projects/
│       └── index.astro        # MODIFY: Category headers with project count metadata
├── styles/
│   └── global.css             # MODIFY: Category glow custom properties, enhanced glassmorphism
└── data/
    └── projects.ts            # READ-ONLY: Category type already exists, no changes needed
```

### Pattern 1: Category Color System via CSS Custom Properties
**What:** Define a color for each category and pass it to card components via a CSS custom property or data attribute. Cards use this color for their hover glow.
**When to use:** When you need per-category visual differentiation without duplicating CSS rules.
**Why this approach:** The codebase already uses CSS custom properties extensively (see `global.css` lines 6-19). Adding category-specific glow colors follows the established pattern.

```css
/* Category glow colors - added to global.css */
[data-category="ai-ml"]       { --category-glow: rgba(139, 92, 246, 0.3); }  /* violet */
[data-category="kubernetes"]   { --category-glow: rgba(59, 130, 246, 0.3); }  /* blue */
[data-category="platform"]     { --category-glow: rgba(16, 185, 129, 0.3); }  /* emerald */
[data-category="security"]     { --category-glow: rgba(245, 158, 11, 0.3); }  /* amber */
```

```astro
<!-- In ProjectCard.astro - add data-category attribute -->
<div
  class:list={['card-hover rounded-lg border ...', spanClass]}
  data-category={categorySlug}
  data-card-item
  data-tilt
>
```

```css
/* Enhanced card-hover with category-tinted glow */
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 40px var(--category-glow, var(--color-accent-glow)),
    0 0 60px var(--category-glow, var(--color-glow-neon));
  border-color: var(--color-accent);
}
```

### Pattern 2: Tech Badge Pills with Visual Hierarchy
**What:** Enhance the existing `tech-pill` class to show tech badges as visually distinct styled pills with subtle background color, border, and compact sizing.
**When to use:** For VIS-01 requirement.
**Current state:** Tech pills already exist with `.tech-pill` class, `text-xs px-2 py-0.5 rounded-full border border-[var(--color-border)]`. They already have hover effects (translateY, glow, accent color change).
**Enhancement needed:** The current pills are minimally styled (just border + text). VIS-01 calls for "styled pills" which implies a background tint for better visual weight even at rest (not just on hover).

```astro
<!-- Enhanced tech pill in ProjectCard.astro -->
<span class="tech-pill text-xs px-2.5 py-0.5 rounded-full
  bg-[var(--color-surface-alt)] border border-[var(--color-border)]
  font-mono tracking-wide">
  {tech}
</span>
```

### Pattern 3: Status Badges with Distinct Visual Treatment
**What:** Render status badges (Featured/Active/Live) with unique styling per status. Featured gets the accent color, Active gets emerald, Experimental gets amber, Archived gets gray. "Live" status badge appears when `liveUrl` is present.
**When to use:** For VIS-02 requirement.
**Current state:** Status badges already exist with per-status colors:
```typescript
const statusStyles: Record<Project['status'], string> = {
  active: 'bg-emerald-500/10 text-emerald-700',
  experimental: 'bg-amber-500/10 text-amber-700',
  archived: 'bg-gray-500/10 text-gray-500',
};
```
**Enhancement needed:** Add "Featured" badge (already in ProjectHero but not in regular cards), add "Live" badge when liveUrl exists, and make badges more visually distinct with a small dot indicator or icon.

```astro
<!-- Enhanced status area in ProjectCard.astro -->
<div class="flex items-center gap-2 flex-wrap">
  {project.featured && (
    <span class="meta-mono px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
      Featured
    </span>
  )}
  <span class:list={['meta-mono px-2 py-0.5 rounded-full flex items-center gap-1', statusStyles[project.status]]}>
    <span class:list={['w-1.5 h-1.5 rounded-full', statusDotStyles[project.status]]}></span>
    {project.status}
  </span>
  {project.liveUrl && (
    <span class="meta-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
      Live
    </span>
  )}
</div>
```

### Pattern 4: Category Headers with Monospace Project Count
**What:** Category headers show the count of projects in monospace metadata style: "AI/ML & LLM Agents // 7 projects"
**When to use:** For VIS-05 requirement.
**Current state:** Category headers are plain `<h2>` elements showing only the category name.
**Enhancement needed:** Add project count in `meta-mono` style adjacent to the heading. Use the `//` separator for a code/terminal aesthetic that matches the site's developer-oriented brand.

```astro
<!-- Enhanced category header in projects/index.astro -->
<div class="flex items-baseline gap-4 mb-6">
  <h2 class="text-xl sm:text-2xl font-heading font-bold" data-word-reveal>
    {category}
  </h2>
  <span class="meta-mono text-[var(--color-text-secondary)]">
    // {items.length} {items.length === 1 ? 'project' : 'projects'}
  </span>
</div>
```

Note: The total count per category includes featured projects that are displayed in the hero section. The requirement says "project count" so the header should show the TOTAL count for the category (including featured), not just the items in the grid. This requires passing the full project count to the header.

### Anti-Patterns to Avoid

- **Overriding card-hover class globally for category colors:** Instead of changing the base `.card-hover:hover` rule, use the cascade -- category-specific glow via CSS custom properties that the existing rule already reads via `var()` fallback. This preserves the existing hover behavior for all other card-hover uses (blog cards, contact cards, etc.).

- **Hard-coding category colors in component templates:** Use a mapping object (categoryMeta) in the Astro frontmatter that maps category names to slugs and colors, not scattered conditionals.

- **Adding JavaScript for hover glow effects:** CSS transitions + custom properties are sufficient. The existing `card-hover` class already transitions `box-shadow` with `0.3s ease`. No JS needed.

- **Using Tailwind's `shadow-*` color utilities for category glow:** While Tailwind v3 supports `shadow-violet-500/30`, the existing `card-hover` class uses custom CSS with `var()` references. Mixing approaches creates maintenance confusion. Stick with CSS custom properties.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badge/pill components | Custom badge component library | Tailwind utility classes directly | Site already uses inline Tailwind for all badges -- BlogCard tags, tech-pill, status badges |
| Glassmorphism effect | Custom glass rendering | Existing `card-hover` CSS class with `backdrop-filter` | Already built and tested, just needs glow color enhancement |
| Category color mapping | Dynamic JavaScript color engine | Static TypeScript object mapping 4 categories to colors | Only 4 categories, unlikely to change frequently |
| Pulse animation for "Live" badge | Custom keyframe animation | Tailwind's `animate-pulse` utility | Built-in Tailwind animation, already used in ecosystem |
| Project count computation | Client-side JS counter | Astro build-time `.filter().length` | Static site -- count known at build time |

**Key insight:** This phase is entirely about CSS enhancement and template updates. No new runtime JavaScript is needed. Everything is computed at build time (Astro SSG) and styled with CSS transitions.

## Common Pitfalls

### Pitfall 1: Category Glow Bleeding to Non-Project Cards
**What goes wrong:** The `.card-hover:hover` rule is used by blog cards, contact cards, and "What I Build" cards too. Changing the global rule to use `--category-glow` would break those other cards.
**Why it happens:** Global CSS class mutation without considering all consumers.
**How to avoid:** Use the `var(--category-glow, var(--color-accent-glow))` fallback pattern. Only project cards with `data-category` set will have `--category-glow` defined. All other `.card-hover` elements fall through to the existing `--color-accent-glow` default.
**Warning signs:** Hover glow appears on blog cards or contact cards during testing.

### Pitfall 2: Glassmorphism Performance on Many Cards
**What goes wrong:** `backdrop-filter: blur(12px)` on 16+ cards simultaneously can cause jank on lower-end devices.
**Why it happens:** Blur is GPU-intensive when applied to many elements.
**How to avoid:** The current implementation already applies blur to all cards (established pattern). If performance issues arise, consider applying blur only on hover: `backdrop-filter: blur(0px)` at rest, `backdrop-filter: blur(12px)` on hover. However, DO NOT change the existing approach unless there's a measured performance problem -- it already works in production.
**Warning signs:** Scroll jank on the projects page, particularly on mobile.

### Pitfall 3: Status Badge Color Clash with Category Glow
**What goes wrong:** Status badge colors (emerald, amber) can visually clash with category glow colors (violet, blue) creating a noisy card.
**Why it happens:** Too many competing colors in a small space.
**How to avoid:** Keep status badges and the "Featured" badge in the card footer area (already separated by the border-t divider). The category glow is a subtle hover-only effect on the card border/shadow, not a persistent color.
**Warning signs:** Cards look "carnival-colored" with too many badge colors + glow colors visible at once.

### Pitfall 4: Featured Projects Missing from Category Count
**What goes wrong:** The category header says "AI/ML & LLM Agents // 5 projects" but the actual total is 7 (2 are in the hero section). Users might think projects are missing.
**Why it happens:** The current filter `projects.filter((p) => p.category === category && !p.featured)` excludes featured projects from category items.
**How to avoid:** Compute the count from ALL projects in the category (including featured), not just the items displayed in that section's grid. Display the total count in the header.
**Warning signs:** Count doesn't match what a user would expect when counting all visible projects.

### Pitfall 5: Tech Pill Font Stacking
**What goes wrong:** Adding `font-mono` to tech pills makes short labels like "Go" or "HCL" look oddly spaced due to monospace character widths.
**Why it happens:** Monospace fonts have uniform character width which feels odd for very short strings.
**How to avoid:** Use the existing `sans` font for tech pills (already the case). The `meta-mono` class is for metadata labels (status, headers), not for tech names. Keep them visually distinct: tech pills = sans, status badges = mono.
**Warning signs:** Tech pills look misaligned or have uneven spacing compared to current design.

### Pitfall 6: Reduced Motion Bypass
**What goes wrong:** The category glow hover effect, animate-pulse on "Live" badge, and any new transitions fail to respect `prefers-reduced-motion`.
**Why it happens:** New CSS rules added without reduced motion overrides.
**How to avoid:** The existing `global.css` already has a comprehensive `@media (prefers-reduced-motion: reduce)` block (lines 508-550). Any new animation or hover transform MUST be added to this block. The `animate-pulse` utility should be disabled under reduced motion.
**Warning signs:** `prefers-reduced-motion` media query toggle in DevTools doesn't stop new animations.

## Code Examples

### Example 1: Category Metadata Mapping Object
```typescript
// In ProjectCard.astro frontmatter or a shared utility
const categoryMeta: Record<Category, { slug: string; glowColor: string }> = {
  'AI/ML & LLM Agents':          { slug: 'ai-ml',      glowColor: 'rgba(139, 92, 246, 0.3)' },
  'Kubernetes & Infrastructure':  { slug: 'kubernetes',  glowColor: 'rgba(59, 130, 246, 0.3)' },
  'Platform & DevOps Tooling':    { slug: 'platform',    glowColor: 'rgba(16, 185, 129, 0.3)' },
  'Security & Networking':        { slug: 'security',    glowColor: 'rgba(245, 158, 11, 0.3)' },
};
```

### Example 2: Inline Style for Category Glow (Alternative to data-attribute CSS)
```astro
<!-- Using inline --category-glow custom property directly -->
<div
  class:list={['card-hover rounded-lg border ...', spanClass]}
  style={`--category-glow: ${categoryMeta[project.category].glowColor}`}
  data-card-item
  data-tilt
>
```
This approach avoids needing CSS rules per category -- the custom property is set inline, and the `.card-hover:hover` rule reads it via `var(--category-glow)`.

### Example 3: Enhanced card-hover CSS with Category Glow Fallback
```css
/* Modified card-hover in global.css */
.card-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(248, 248, 252, 0.7);
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 40px var(--category-glow, var(--color-accent-glow)),
    0 0 60px var(--category-glow, var(--color-glow-neon));
  border-color: var(--color-accent);
}
```
Note: This is backward compatible. Elements without `--category-glow` set (blog cards, contact cards) fall through to the existing accent glow.

### Example 4: Status Badge Dot Indicator Styling
```typescript
// Status dot color mapping (solid, not translucent like the badge bg)
const statusDotStyles: Record<Project['status'], string> = {
  active: 'bg-emerald-500',
  experimental: 'bg-amber-500',
  archived: 'bg-gray-400',
};
```

### Example 5: Category Header with Count
```astro
<!-- Full category header with total count (including featured) -->
{grouped.map(({ category, items, totalCount }, idx) => (
  <div>
    {idx > 0 && (
      <div class="gradient-divider max-w-6xl mx-auto my-10" data-divider-reveal aria-hidden="true"></div>
    )}
    <div class="flex items-baseline gap-3 mb-6">
      <h2 class="text-xl sm:text-2xl font-heading font-bold" data-word-reveal>
        {category}
      </h2>
      <span class="meta-mono">
        // {totalCount} {totalCount === 1 ? 'project' : 'projects'}
      </span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 grid-flow-dense" data-card-group>
      {items.map((item) => (
        <ProjectCard project={item} />
      ))}
    </div>
  </div>
))}
```

Where the data is prepared as:
```typescript
// In projects/index.astro frontmatter
const grouped = categories.map((category) => ({
  category,
  items: projects.filter((p) => p.category === category && !p.featured),
  totalCount: projects.filter((p) => p.category === category).length,
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No tech badges | Basic bordered pills on cards | Phase 13 (Feb 2026) | Foundation exists, needs visual enrichment |
| No status indicators | Per-status colored background tint | Phase 13 (Feb 2026) | Already color-coded, needs dot indicator + Featured/Live badges |
| Generic accent glow on hover | Category-tinted glow via CSS variables | Phase 14 (this phase) | Per-category visual identity |
| Plain category headings | Monospace metadata count headers | Phase 14 (this phase) | Developer-aesthetic data display |

**Existing design patterns to preserve:**
- `meta-mono` class: Fira Code, 0.75rem, uppercase, letter-spacing 0.15em, secondary text color
- `tech-pill` class: Transition on transform, box-shadow, bg-color, color, border-color (0.2s ease)
- `card-hover` class: translateY(-4px) on hover, backdrop-filter blur(12px), rgba background
- CSS custom properties for all theme colors (surface, accent, border, glow)
- `data-card-item`, `data-card-group` attributes for GSAP stagger animations
- `data-tilt` attribute for vanilla-tilt 3D effect
- `data-reveal`, `data-word-reveal` for scroll-triggered entrance animations

## Open Questions

1. **Featured badge placement in regular cards**
   - What we know: Featured projects currently appear ONLY in the hero section (ProjectHero), not in category grids. The VIS-02 requirement says "Featured/Active/Live" badges should appear on cards.
   - What's unclear: Should featured projects also show a "Featured" badge if they were visible in regular cards? Currently they are excluded from category grids by design (Phase 13).
   - Recommendation: Add "Featured" badge support to ProjectCard component for completeness, even though currently no featured project renders in the category grid. This future-proofs the component. In ProjectHero, the "Featured" badge already exists.

2. **Category glow color palette**
   - What we know: The site uses a warm tropical sunset palette (oranges, teals). Category glow colors should complement this.
   - What's unclear: The exact color values for each category glow.
   - Recommendation: Use violet (#8b5cf6) for AI/ML (suggests intelligence/innovation), blue (#3b82f6) for Kubernetes (cloud association), emerald (#10b981) for Platform (growth/stability), amber (#f59e0b) for Security (warning/attention). All at 30% opacity for subtlety. These are standard Tailwind palette colors that complement the warm base.

3. **"Live" status badge scope**
   - What we know: Only `networking-tools` has a `liveUrl`. The VIS-02 requirement mentions "Featured/Active/Live" badges.
   - What's unclear: Is "Live" a status badge (like active/experimental/archived) or a separate indicator based on `liveUrl` presence?
   - Recommendation: Treat "Live" as a supplementary badge shown when `liveUrl` exists, independent of the `status` field. This makes it data-driven without modifying the data model.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/styles/global.css` (lines 200-211 for existing `card-hover` glassmorphism, lines 237-247 for existing `tech-pill` hover effects)
- Codebase inspection: `src/components/ProjectCard.astro` (lines 24-28 for existing status badge styles)
- Codebase inspection: `src/data/projects.ts` (complete data model with technologies, status, featured, gridSize, liveUrl)
- Codebase inspection: `src/lib/scroll-animations.ts` (GSAP animation infrastructure for cards and pills)
- Tailwind CSS v3 Box Shadow Color docs: https://v3.tailwindcss.com/docs/box-shadow-color
- Phase 13 verification report: All 7 truths verified, all 8 requirements satisfied

### Secondary (MEDIUM confidence)
- [Glassmorphism implementation guide (2025)](https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide) - backdrop-filter best practices
- [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) - browser support (95%+)
- [Josh W. Comeau on backdrop-filter](https://www.joshwcomeau.com/css/backdrop-filter/) - frosted glass patterns
- [Tailwind CSS Badges - Flowbite](https://flowbite.com/docs/components/badge/) - badge pill patterns
- [Glassmorphism in 2026](https://invernessdesignstudio.com/glassmorphism-what-it-is-and-how-to-use-it-in-2026) - current trends and performance considerations

### Tertiary (LOW confidence)
- None needed -- all recommendations are based on verified codebase patterns and official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed; all existing tooling verified via codebase inspection
- Architecture: HIGH - Enhancement of existing components with well-understood CSS patterns
- Pitfalls: HIGH - All based on direct analysis of existing codebase patterns and their interaction points
- Category glow colors: MEDIUM - Color choices are subjective; recommended palette is reasonable but may need visual tuning

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (stable -- no fast-moving dependencies)
