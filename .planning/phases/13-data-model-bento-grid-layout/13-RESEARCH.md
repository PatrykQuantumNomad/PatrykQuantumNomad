# Phase 13: Data Model & Bento Grid Layout - Research

**Researched:** 2026-02-13
**Domain:** TypeScript data modeling, CSS Grid bento layout, Astro component architecture
**Confidence:** HIGH

## Summary

Phase 13 transforms the existing projects page from a uniform 3-column grid into an asymmetric bento grid layout with a featured hero section, extended data model, and responsive breakpoints. The work divides cleanly into two concerns: (1) extending the `projects.ts` data model with `technologies`, `featured`, `status`, and `gridSize` fields, and (2) rebuilding the page layout using CSS Grid with column/row spanning controlled by the `gridSize` hint.

The existing codebase already uses Tailwind CSS v3 with CSS Grid utilities (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), GSAP for scroll animations (`data-card-group`, `data-card-item`, `data-reveal`), and CSS custom properties for theming. All 16 projects are defined in `src/data/projects.ts` with a simple `Project` interface. The page at `src/pages/projects/index.astro` groups projects by category and renders them with existing card-hover glassmorphism effects.

**Primary recommendation:** Extend the `Project` interface in-place (non-breaking, additive fields), use Tailwind's native `col-span-*` and `row-span-*` utilities mapped from the `gridSize` data hint, and structure the page as Hero Section (featured projects) followed by Category Sections separated by gradient dividers. No new libraries needed.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site framework | Already in use; renders page at build time |
| Tailwind CSS | ^3.4.19 | Utility-first CSS with grid classes | Already in use; `col-span-*`, `row-span-*`, responsive prefixes |
| TypeScript | ^5.9.3 | Type-safe data model | Already in use; `Project` interface in `projects.ts` |
| GSAP | ^3.14.2 | Scroll animations | Already in use; `data-card-group` stagger infrastructure |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/typography | ^0.5.19 | Prose styling | Not needed for this phase (no prose content) |
| vanilla-tilt | ^1.8.1 | Card tilt effect | Already wired via `data-tilt` attribute |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind grid classes | CSS Grid raw properties | Tailwind already in project, no benefit to raw CSS |
| Static gridSize hints | Auto-layout algorithm | Manual hints give design control; auto-layout unpredictable |
| TypeScript union types | Zod schema | Zod is overkill for a simple data file; TS unions suffice |

**Installation:**
```bash
# No new packages needed - everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── data/
│   └── projects.ts           # Extended Project interface + data (MODIFY)
├── pages/
│   └── projects/
│       └── index.astro        # Rebuilt with bento grid layout (REWRITE)
├── components/
│   ├── ProjectHero.astro      # NEW: Featured project hero section
│   ├── ProjectCard.astro      # NEW: Reusable bento card component
│   └── CategoryDivider.astro  # NEW: Animated gradient divider between categories
├── styles/
│   └── global.css             # Add bento-specific styles if needed (MINOR)
└── lib/
    └── scroll-animations.ts   # Existing - already handles data-card-group (NO CHANGE)
```

### Pattern 1: Extended Data Model with Discriminated Types
**What:** Add new fields to the existing `Project` interface using TypeScript union types for `status` and `gridSize`, and arrays for `technologies`.
**When to use:** When extending an existing type-safe data file without breaking changes.
**Example:**
```typescript
// src/data/projects.ts
export interface Project {
  name: string;
  description: string;
  url: string;
  liveUrl?: string;
  language: string;           // Keep for backward compat (primary language)
  category: Category;
  fork?: boolean;
  // NEW fields for v1.2
  technologies: string[];     // DATA-01: Multi-tech badge display
  featured?: boolean;         // DATA-02: Hero section spotlight
  status: 'active' | 'archived' | 'experimental';  // DATA-03
  gridSize: 'large' | 'medium' | 'small';           // DATA-04
}
```

### Pattern 2: Bento Grid with gridSize-to-Tailwind Mapping
**What:** Map the `gridSize` data hint to Tailwind CSS Grid span classes. Large cards span 2 columns, medium cards span 1 column, small cards are compact (1 column, reduced height).
**When to use:** When you want data-driven layout without complex CSS.
**Example:**
```typescript
// In the Astro page template
const gridClasses: Record<string, string> = {
  large:  'md:col-span-2 md:row-span-2',
  medium: 'md:col-span-1 md:row-span-1',
  small:  'md:col-span-1 md:row-span-1',
};
```
The grid container uses:
```html
<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-auto">
```

### Pattern 3: Hero Section Separation
**What:** Filter featured projects out of the category groups and render them in a distinct hero section at the top of the page, above all category grids.
**When to use:** When featured content needs visual prominence beyond just grid sizing.
**Example:**
```typescript
// In Astro frontmatter
const featured = projects.filter(p => p.featured);
const grouped = categories.map((category) => ({
  category,
  items: projects.filter((p) => p.category === category && !p.featured),
}));
```

### Pattern 4: Category Sections with Gradient Dividers
**What:** Reuse the existing `.gradient-divider` CSS class (already in `global.css`) and `data-divider-reveal` GSAP animation between category groups.
**When to use:** Between each category section to create visual separation.
**Example:**
```html
{grouped.map(({ category, items }, idx) => (
  <>
    {idx > 0 && (
      <div class="gradient-divider max-w-6xl mx-auto my-8" data-divider-reveal aria-hidden="true"></div>
    )}
    <section>
      <h2>{category}</h2>
      <div class="grid ...">{/* cards */}</div>
    </section>
  </>
))}
```

### Pattern 5: Responsive Breakpoint Strategy
**What:** Use Tailwind responsive prefixes for three-tier layout: single-column mobile, 2-column tablet, bento grid desktop.
**When to use:** Always for the projects page.
**Example:**
```html
<!-- Grid container -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- Large card: spans 2 cols on lg, full width on sm -->
  <div class="sm:col-span-2 lg:col-span-2">...</div>
  <!-- Medium card: 1 col everywhere -->
  <div class="sm:col-span-1 lg:col-span-1">...</div>
</div>
```
Breakpoint mapping:
- **Mobile** (< 640px): `grid-cols-1` -- single column stack
- **Tablet** (640px-1023px): `sm:grid-cols-2` -- 2-column grid, all cards 1 col
- **Desktop** (1024px+): `lg:grid-cols-4` -- bento grid with `col-span-2` for large cards

### Anti-Patterns to Avoid
- **Absolute positioning for grid items:** Use CSS Grid span, never `position: absolute` for layout within the grid. Absolute positioning breaks responsive reflow.
- **JavaScript-driven layout:** Do not use JavaScript to calculate card positions. CSS Grid handles all layout; JS is only for animations.
- **Overly complex grid templates:** Avoid `grid-template-areas` with named areas -- it becomes hard to maintain with 16 cards. Use `col-span-*` / `row-span-*` instead.
- **Hardcoded breakpoints in inline styles:** Always use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`), never inline media queries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid layout engine | Custom JS layout algorithm | CSS Grid + Tailwind `col-span-*` | CSS Grid handles asymmetric layouts natively |
| Responsive breakpoints | Custom resize observers | Tailwind responsive prefixes | `sm:`, `md:`, `lg:` are battle-tested |
| Scroll reveal animations | Custom IntersectionObserver | Existing GSAP ScrollTrigger (`data-card-group`) | Already implemented and tested in codebase |
| Animated dividers | Custom SVG animation | Existing `gradient-divider` + `data-divider-reveal` | Already in global.css and scroll-animations.ts |
| Card hover effects | Custom mouse tracking (for this phase) | Existing `card-hover` class + `data-tilt` | Phase 14 adds mouse tracking; Phase 13 uses existing |
| Type validation | Runtime validation library | TypeScript interface + `as const` union types | Build-time type checking is sufficient |

**Key insight:** The existing codebase already has most of the animation and styling infrastructure needed. Phase 13 is about restructuring data and layout, not building new visual effects (those come in Phase 14 and 15).

## Common Pitfalls

### Pitfall 1: Grid Item Overflow on Small Screens
**What goes wrong:** Large cards with `col-span-2` on a 1-column mobile layout cause horizontal overflow.
**Why it happens:** The `col-span-2` applies at all breakpoints if not scoped with responsive prefix.
**How to avoid:** Always scope span classes: `lg:col-span-2` (not `col-span-2`). On mobile/tablet, all cards should be `col-span-1`.
**Warning signs:** Horizontal scrollbar on mobile; cards wider than viewport.

### Pitfall 2: Empty Grid Cells in Asymmetric Layout
**What goes wrong:** When large cards span 2 columns, the remaining cards may leave visual gaps in the grid.
**Why it happens:** CSS Grid places items sequentially; a 2-col card at the end of a row leaves the next row partially empty.
**How to avoid:** Order projects within each category so large cards come first, then medium, then small. Alternatively, consider `grid-auto-flow: dense` (Tailwind class: `grid-flow-dense`) to let CSS fill gaps automatically.
**Warning signs:** Unexplained white space between cards; uneven bottom edge of grid.

### Pitfall 3: Category with Only Small Cards Looks Sparse
**What goes wrong:** A category like "Security & Networking" (only 1 project) will look oddly empty in a 4-column grid.
**Why it happens:** The grid container is 4 columns wide but only has 1 item.
**How to avoid:** For categories with very few projects, consider using `sm:grid-cols-2` max instead of 4 columns, or letting the single card span wider. The `gridSize` hint helps -- mark the sole project in a small category as `medium` or `large`.
**Warning signs:** A category section that is mostly empty space.

### Pitfall 4: Breaking Existing Animations
**What goes wrong:** Changing the HTML structure (from current flat grid to hero + category sections) breaks the `data-card-group` and `data-card-item` GSAP animation selectors.
**Why it happens:** The `initCardGroupStagger()` function in `scroll-animations.ts` looks for `[data-card-group]` containers and `[data-card-item]` children.
**How to avoid:** Keep using `data-card-group` on each category grid container and `data-card-item` on each card. The hero section should also use these attributes. The existing animation code will work without modification.
**Warning signs:** Cards appearing without stagger animation; or all cards invisible until scroll.

### Pitfall 5: Featured Projects Appearing Twice
**What goes wrong:** If featured projects are not filtered out of category groups, they appear in both the hero section and their category section.
**Why it happens:** The hero section renders featured projects, but the category grouping still includes them.
**How to avoid:** Filter featured projects out of category groups: `projects.filter(p => p.category === category && !p.featured)`.
**Warning signs:** Duplicate project cards on the page.

### Pitfall 6: Type Errors from Partial Data Migration
**What goes wrong:** Adding required fields (`technologies`, `status`, `gridSize`) to the interface but not updating all 16 project entries causes TypeScript build errors.
**Why it happens:** TypeScript strict mode requires all non-optional fields.
**How to avoid:** Update all 16 project entries in a single commit. Use sensible defaults: `status: 'active'` for most, `gridSize: 'medium'` as default, `technologies` array derived from current `language` field plus additional techs.
**Warning signs:** `astro build` fails with type errors on `projects.ts`.

## Code Examples

### Extended Project Data Model
```typescript
// src/data/projects.ts - Complete extended interface
export interface Project {
  name: string;
  description: string;
  url: string;
  liveUrl?: string;
  language: string;
  category: Category;
  fork?: boolean;
  technologies: string[];
  featured?: boolean;
  status: 'active' | 'archived' | 'experimental';
  gridSize: 'large' | 'medium' | 'small';
}

// Example project entry with new fields:
{
  name: 'kps-graph-agent',
  description: 'LLM-powered graph agent for intelligent query processing and knowledge retrieval',
  url: 'https://github.com/PatrykQuantumNomad/kps-graph-agent',
  language: 'Python',
  category: 'AI/ML & LLM Agents',
  technologies: ['Python', 'LangGraph', 'Neo4j'],
  featured: true,
  status: 'active',
  gridSize: 'large',
}
```

### Bento Grid Container with Responsive Breakpoints
```html
<!-- Desktop: 4-column bento grid, Tablet: 2-column, Mobile: 1-column stack -->
<div
  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  data-card-group
>
  {items.map((project) => {
    const spanClass = project.gridSize === 'large'
      ? 'sm:col-span-2 lg:col-span-2'
      : 'col-span-1';
    return (
      <div class:list={['card-hover p-5 rounded-lg border border-[var(--color-border)]', spanClass]} data-card-item data-tilt>
        {/* card content */}
      </div>
    );
  })}
</div>
```

### Featured Hero Section
```html
<!-- Hero section for featured projects - above category grids -->
<section class="mb-12">
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" data-card-group>
    {featured.map((project) => (
      <div
        class="card-hover p-8 rounded-xl border-2 border-[var(--color-accent)]/30 bg-[var(--color-surface-alt)]"
        data-card-item
        data-tilt
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="meta-mono px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            Featured
          </span>
        </div>
        <h3 class="text-2xl font-heading font-bold mb-2">{project.name}</h3>
        <p class="text-[var(--color-text-secondary)]">{project.description}</p>
        <div class="flex flex-wrap gap-2 mt-4">
          {project.technologies.map((tech) => (
            <span class="tech-pill text-xs px-2 py-0.5 rounded-full border border-[var(--color-border)]">
              {tech}
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
</section>
```

### Gradient Divider Between Categories
```html
<!-- Reuses existing gradient-divider class from global.css -->
<!-- Reuses existing data-divider-reveal GSAP animation from scroll-animations.ts -->
<div
  class="gradient-divider my-10"
  data-divider-reveal
  aria-hidden="true"
></div>
```

### gridSize-to-Class Mapping Helper
```typescript
// Utility for mapping gridSize to Tailwind classes
function getGridClasses(gridSize: Project['gridSize']): string {
  switch (gridSize) {
    case 'large':  return 'sm:col-span-2 lg:col-span-2';
    case 'medium': return 'col-span-1';
    case 'small':  return 'col-span-1';
    default:       return 'col-span-1';
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flexbox-based card grids | CSS Grid with `col-span-*` | CSS Grid widely supported since 2019 | Enables true 2D asymmetric layouts |
| JavaScript masonry libraries (Masonry.js) | Pure CSS Grid + `grid-auto-flow: dense` | CSS Grid Level 2 | No JS dependency for layout |
| Fixed grid-template-areas | Data-driven span classes | Tailwind v3 arbitrary values | More maintainable for dynamic content |
| Equal-size card grids | Bento/asymmetric layouts | Design trend since Apple's 2023 product pages | Visual hierarchy through card sizing |

**Deprecated/outdated:**
- **Masonry.js / Isotope.js**: Unnecessary for bento grids; CSS Grid handles asymmetric layouts natively.
- **CSS Columns (`column-count`)**: Not appropriate for card grids; causes unexpected reflow and ordering issues.
- **Float-based grids**: Replaced by CSS Grid and Flexbox years ago.

## Data Assignment Recommendations

Based on the 16 projects and 4 categories, here is a recommended `gridSize` and `featured` assignment:

### AI/ML & LLM Agents (7 projects)
| Project | gridSize | featured | status | Rationale |
|---------|----------|----------|--------|-----------|
| kps-graph-agent | large | true | active | Flagship AI project, hero material |
| kps-assistant | medium | false | active | Important but not hero |
| kps-assistant-support | small | false | active | Infrastructure support layer |
| kubert-langflow | medium | false | active | Custom Langflow components |
| kps-langflow | small | false | active | Deployment tooling |
| tekstack-assistant-library | medium | false | active | Reusable library |
| financial-data-extractor | medium | false | active | Production-grade system |

### Kubernetes & Infrastructure (6 projects)
| Project | gridSize | featured | status | Rationale |
|---------|----------|----------|--------|-----------|
| kps-cluster-deployment | large | true | active | Core K8s project, hero material |
| kps-infra-management | medium | false | active | Multi-env management |
| kps-basic-package | small | false | active | Bootstrap package |
| kps-observability-package | medium | false | active | Full observability stack |
| kps-charts | medium | false | active | Helm charts |
| kps-images | small | false | active | Container build pipelines |

### Platform & DevOps Tooling (2 projects)
| Project | gridSize | featured | status | Rationale |
|---------|----------|----------|--------|-----------|
| kps-lobe-chat | medium | false | active | Self-hosted LobeChat |
| jobs | small | false | experimental | Job scraper tool |

### Security & Networking (1 project)
| Project | gridSize | featured | status | Rationale |
|---------|----------|----------|--------|-----------|
| networking-tools | large | false | active | Has liveUrl, rich content; make it large since it's the only one |

**Total featured:** 2 (kps-graph-agent, kps-cluster-deployment)
**Grid distribution:** 3 large, 8 medium, 5 small

## Open Questions

1. **Should featured projects also appear in their category section?**
   - What we know: The requirement says featured projects appear in a "hero section above the category grid". The most natural pattern is to show them ONLY in the hero section, not duplicate them.
   - What's unclear: Whether the user expects them in both places.
   - Recommendation: Show featured projects ONLY in the hero section. This avoids duplication and makes the hero section meaningful. The planner should implement this with a filter.

2. **How many featured projects should there be?**
   - What we know: The requirement says "Featured project(s)" (plural optional). Too many featured projects dilute the hero section.
   - What's unclear: Exact number.
   - Recommendation: 2 featured projects (one AI/ML, one Kubernetes) creates a balanced 2-column hero section on desktop and stacked on mobile. This is a data decision, not code -- the planner just needs to ensure the hero section handles 1-3 featured items gracefully.

3. **Should `gridSize` use row spanning in addition to column spanning?**
   - What we know: The requirements say "large cards span 2 columns, medium span 1, small are compact". No explicit mention of row spanning.
   - What's unclear: Whether "compact" small cards should be shorter (fewer rows).
   - Recommendation: Start with column-only spanning (simpler, more predictable). Large = 2 columns, medium/small = 1 column. Differentiate small from medium via reduced padding and font size rather than row spans. Add row spans only if the visual result needs it.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Direct reading of `src/data/projects.ts`, `src/pages/projects/index.astro`, `src/lib/scroll-animations.ts`, `src/styles/global.css`, `tailwind.config.mjs`, `package.json`
- [Tailwind CSS Grid Template Columns](https://tailwindcss.com/docs/grid-template-columns) -- Official utility documentation
- [Tailwind CSS Grid Column](https://tailwindcss.com/docs/grid-column) -- `col-span-*` utilities and CSS output
- [Tailwind CSS Grid Row](https://tailwindcss.com/docs/grid-row) -- `row-span-*` utilities and CSS output
- [Tailwind CSS Grid Auto Rows](https://tailwindcss.com/docs/grid-auto-rows) -- `auto-rows-*` utilities

### Secondary (MEDIUM confidence)
- [Tailwind CSS Official Bento Grid Examples](https://tailwindcss.com/plus/ui-blocks/marketing/sections/bento-grids) -- Official Tailwind UI bento grid patterns
- [Create a Bento Grid with Tailwind CSS](https://lexingtonthemes.com/tutorials/how-to-create-a-bento-grid-with-tailwind-css/) -- Responsive bento grid tutorial with Tailwind
- [Building a Bento Grid Layout with Modern CSS Grid](https://www.wearedevelopers.com/en/magazine/682/building-a-bento-grid-layout-with-modern-css-grid-682) -- CSS Grid bento layout patterns
- [Build a Bento Layout with CSS Grid](https://iamsteve.me/blog/bento-layout-css-grid) -- Auto-rows and dense flow patterns

### Tertiary (LOW confidence)
- [Bento Grid Design Guide 2026](https://landdding.com/blog/blog-bento-grid-design-guide) -- Design trend analysis (not code-verified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries needed; all existing dependencies verified in `package.json`
- Architecture: HIGH -- Patterns verified against codebase; CSS Grid utilities confirmed in Tailwind v3 docs
- Data model: HIGH -- Interface extension is additive; all 16 projects inventoried
- Pitfalls: HIGH -- Each pitfall identified from direct codebase analysis and CSS Grid documentation
- Grid layout: MEDIUM -- Specific `gridSize` assignments are recommendations pending visual testing

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (stable domain -- CSS Grid and Tailwind v3 are mature)
