# Phase 15: Filtering, Animations & Polish - Research

**Researched:** 2026-02-13
**Domain:** GSAP Flip plugin (filtering), mouse-tracking gradient glow, floating orbs, magnetic effects, URL hash state, prefers-reduced-motion accessibility
**Confidence:** HIGH

## Summary

Phase 15 adds three major capabilities to the projects page: (1) category filter tabs with smooth animated transitions, (2) rich interactive animations (mouse-tracking glow, floating orbs, magnetic CTA buttons, stagger-reveal), and (3) accessibility fallbacks for all motion. The project already has a robust GSAP 3.14.2 setup with ScrollTrigger, Lenis smooth scroll, and a well-established animation lifecycle (`astro:page-load` init, `astro:before-swap` cleanup). The Flip plugin is bundled in the installed GSAP package and is free to use (all GSAP plugins became free when Webflow acquired GreenSock in late 2024).

The existing `data-card-group` / `data-card-item` infrastructure provides the stagger-reveal foundation. The `data-tilt`, `data-magnetic`, and `data-section-bg` attributes are already wired to their respective animation components in `Layout.astro`. The primary new work is: (a) a client-side filter system that uses GSAP Flip for smooth card layout transitions, (b) a mouse-tracking gradient glow effect on card surfaces, (c) extending `FloatingOrbs.astro` with category section configs, and (d) URL hash synchronization for filter state.

**Primary recommendation:** Use GSAP Flip plugin (`import { Flip } from 'gsap/Flip'`) for all filter transition animations. Implement filtering as a client-side `<script>` in the projects page that toggles `display:none` on filtered-out cards, with Flip animating the layout change. Use CSS custom properties (`--mouse-x`, `--mouse-y`) driven by `mousemove` for the gradient glow. All animations gate on `prefers-reduced-motion` and `pointer: coarse` checks following the project's established patterns.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site framework with `.astro` components | All components use Astro SSG |
| GSAP | ^3.14.2 | Animation engine: ScrollTrigger, Flip, tweens | Already drives all page animations |
| GSAP Flip | (bundled) | Layout transition animations for filter | Bundled in gsap@3.14.2, free license |
| GSAP ScrollTrigger | (bundled) | Scroll-triggered stagger reveal | Already used for card groups |
| Tailwind CSS | ^3.4.19 | Utility-first CSS | All existing styling |
| Lenis | ^1.3.17 | Smooth scroll | Already integrated with GSAP ticker |
| vanilla-tilt | ^1.8.1 | 3D card tilt effect | Already wired via `data-tilt` |

### No New Libraries Needed
No additional npm packages are required. All functionality is achievable with:
- GSAP Flip plugin (already bundled, just needs `import`)
- Vanilla JavaScript (mousemove tracking, hash management)
- CSS custom properties (gradient glow positioning)

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP Flip for filter transitions | CSS-only transitions with opacity/transform | CSS can't animate layout reflow (position shifts when cards hide); Flip handles this automatically |
| Vanilla JS mouse tracking | A library like `@floating-ui/dom` | Overkill for a simple mousemove + CSS var update; vanilla JS is ~15 lines |
| URL hash for filter state | URLSearchParams / query params | Hash is simpler for client-only state, doesn't trigger server requests, standard for SPA-style filtering |
| Extending FloatingOrbs config | New separate orb component | Existing component already has the pattern; just add category section configs to `ORB_CONFIG` |

**Installation:**
```bash
# No new packages needed - GSAP Flip is bundled in gsap@3.14.2
```

## Architecture Patterns

### Files to Create/Modify
```
src/
├── components/
│   ├── ProjectFilterBar.astro     # CREATE: Filter tab bar component (FILTER-01, VIS-03)
│   └── animations/
│       ├── FloatingOrbs.astro     # MODIFY: Add category section orb configs (ANIM-03)
│       ├── CardGlow.astro         # CREATE: Mouse-tracking gradient glow (ANIM-02)
│       └── MagneticButton.astro   # VERIFY: Already exists, ensure CTA buttons use data-magnetic (ANIM-04)
├── pages/
│   └── projects/
│       └── index.astro            # MODIFY: Add filter bar, filter logic, hash sync (FILTER-01..04, ANIM-05)
├── lib/
│   └── scroll-animations.ts      # MODIFY: Update initCardGroupStagger to work with Flip (ANIM-01)
├── styles/
│   └── global.css                 # MODIFY: Filter tab styles, glow overlay, reduced-motion rules
└── data/
    └── projects.ts                # READ-ONLY: categoryMeta slugs already defined in ProjectCard
```

### Pattern 1: GSAP Flip for Filter Transitions (FILTER-02, ANIM-05)
**What:** Capture card positions before filter change, toggle `display:none` on non-matching cards, then use `Flip.from()` to animate from old layout to new.
**When to use:** Every time a filter tab is clicked.
**Why Flip over CSS-only:** CSS cannot animate between two different CSS Grid layouts where items appear/disappear. Flip records the "before" state and computes transform offsets to smoothly transition cards to their new grid positions.

```typescript
// Source: GSAP Flip docs https://gsap.com/docs/v3/Plugins/Flip/
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

function applyFilter(category: string) {
  const cards = document.querySelectorAll<HTMLElement>('[data-card-item]');
  const allGroups = document.querySelectorAll<HTMLElement>('[data-category-section]');

  // Step 1: Capture current state of ALL cards
  const state = Flip.getState(cards);

  // Step 2: Toggle visibility
  if (category === 'all') {
    cards.forEach(card => card.style.display = '');
    allGroups.forEach(group => group.style.display = '');
  } else {
    cards.forEach(card => {
      const match = card.dataset.category === category;
      card.style.display = match ? '' : 'none';
    });
    allGroups.forEach(group => {
      const match = group.dataset.categorySection === category;
      group.style.display = match ? '' : 'none';
    });
  }

  // Step 3: Animate from old positions to new
  Flip.from(state, {
    duration: 0.5,
    ease: 'power2.inOut',
    stagger: 0.03,
    absolute: true,           // Prevents layout collapse during animation
    absoluteOnLeave: true,    // Leaving items stay visible during fade-out
    onEnter: elements => gsap.fromTo(elements,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03 }
    ),
    onLeave: elements => gsap.to(elements,
      { opacity: 0, scale: 0.9, duration: 0.3 }
    ),
  });
}
```

**Critical: Do NOT use `!important` on the display:none class.** GSAP Flip needs to override display during animation. The `absolute: true` parameter is essential -- it makes leaving elements `position: absolute` during the transition so they don't collapse the grid layout.

### Pattern 2: URL Hash Synchronization (FILTER-04)
**What:** Reflect filter state in URL hash (e.g., `#kubernetes`). On page load, read hash to set initial filter. On filter click, update hash.
**When to use:** Always, for shareable filter URLs.
**Important Astro consideration:** The `hashchange` event works fine client-side. Astro's ClientRouter does NOT intercept hash-only navigation (confirmed by codebase analysis -- it intercepts `<a>` clicks for page navigation only).

```typescript
// Map category display names to URL-safe slugs
const CATEGORY_SLUGS: Record<string, string> = {
  'ai-ml': 'ai-ml',
  'kubernetes': 'kubernetes',
  'platform': 'platform',
  'security': 'security',
};

function getFilterFromHash(): string {
  const hash = window.location.hash.slice(1).toLowerCase();
  return CATEGORY_SLUGS[hash] || 'all';
}

function setFilterHash(slug: string) {
  if (slug === 'all') {
    history.replaceState(null, '', window.location.pathname);
  } else {
    history.replaceState(null, '', `#${slug}`);
  }
}

// On page load, apply hash filter
document.addEventListener('astro:page-load', () => {
  const initial = getFilterFromHash();
  if (initial !== 'all') applyFilter(initial);
});

// Listen for browser back/forward with hash changes
window.addEventListener('hashchange', () => {
  applyFilter(getFilterFromHash());
});
```

**Use `history.replaceState` not `pushState`** for filter changes. pushState would create a history entry per filter click, making back-button behavior frustrating.

### Pattern 3: Mouse-Tracking Gradient Glow (ANIM-02)
**What:** A radial gradient overlay that follows the cursor across card surfaces, creating a "flashlight" or "spotlight" effect.
**When to use:** On all `[data-card-item]` elements on the projects page.
**Implementation:** CSS `::after` pseudo-element with `radial-gradient` positioned via `--mouse-x` / `--mouse-y` custom properties, updated by a `mousemove` listener.

```css
/* Card glow overlay */
[data-card-item] {
  position: relative;
  overflow: hidden;
}

[data-card-item]::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  top: calc(var(--mouse-y, -150) * 1px - 150px);
  left: calc(var(--mouse-x, -150) * 1px - 150px);
  background: radial-gradient(
    circle closest-side,
    var(--category-glow, var(--color-accent-glow)),
    transparent
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1;
  border-radius: 50%;
}

[data-card-item]:hover::after {
  opacity: 0.6;
}
```

```typescript
// CardGlow.astro <script>
function initCardGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll<HTMLElement>('[data-card-item]');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', String(e.clientX - rect.left));
      card.style.setProperty('--mouse-y', String(e.clientY - rect.top));
    });
  });
}

document.addEventListener('astro:page-load', initCardGlow);
```

**Note:** The glow uses `var(--category-glow)` which is already set as an inline style on each card (from Phase 14). This means AI cards glow violet, K8s cards glow blue, etc. -- no extra wiring needed.

### Pattern 4: Filter Tab Bar as Pill Buttons (FILTER-01, FILTER-03, VIS-03)
**What:** Horizontal row of pill buttons ("All", "AI/ML", "Kubernetes", "Platform", "Security") with the active tab visually distinct.
**When to use:** Rendered at the top of the projects page, below the page header.

```astro
<!-- ProjectFilterBar.astro -->
---
import { categories } from '../data/projects';

// Reuse categoryMeta from ProjectCard for slug mapping
const categoryMeta = {
  'AI/ML & LLM Agents':         { slug: 'ai-ml',     label: 'AI / ML' },
  'Kubernetes & Infrastructure': { slug: 'kubernetes', label: 'Kubernetes' },
  'Platform & DevOps Tooling':   { slug: 'platform',  label: 'Platform' },
  'Security & Networking':       { slug: 'security',  label: 'Security' },
} as const;

const tabs = [
  { slug: 'all', label: 'All' },
  ...categories.map(c => ({ slug: categoryMeta[c].slug, label: categoryMeta[c].label })),
];
---

<nav class="flex flex-wrap gap-2 mb-10" aria-label="Filter projects by category">
  {tabs.map((tab) => (
    <button
      class="filter-tab meta-mono px-4 py-1.5 rounded-full border border-[var(--color-border)] transition-all duration-200"
      data-filter={tab.slug}
      aria-pressed={tab.slug === 'all' ? 'true' : 'false'}
    >
      {tab.label}
    </button>
  ))}
</nav>
```

```css
/* Filter tab styling */
.filter-tab {
  cursor: pointer;
  background: transparent;
  color: var(--color-text-secondary);
}
.filter-tab:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.filter-tab[aria-pressed="true"] {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
  box-shadow: 0 2px 12px var(--color-accent-glow);
}
```

**Accessibility:** Use `aria-pressed` to indicate active state. Use `role="group"` or `<nav>` with `aria-label` for the tab bar. Keep tabs as `<button>` elements (not links) since they control in-page state.

### Pattern 5: Extending FloatingOrbs for Category Sections (ANIM-03)
**What:** Add orb configurations for each category section on the projects page.
**When to use:** Category section wrappers need `data-section-bg` attribute.

```typescript
// Add to ORB_CONFIG in FloatingOrbs.astro
const ORB_CONFIG: Record<string, OrbConfig[]> = {
  // ... existing configs (skills, writing, cta)
  'ai-ml': [
    { x: '15%', y: '25%', size: 350, color: 'rgba(139, 92, 246, 0.08)', opacity: 0.06, parallaxY: -50 },
    { x: '80%', y: '65%', size: 280, color: 'rgba(139, 92, 246, 0.06)', opacity: 0.04, parallaxY: -35 },
  ],
  'kubernetes': [
    { x: '75%', y: '20%', size: 380, color: 'rgba(59, 130, 246, 0.08)', opacity: 0.06, parallaxY: -55 },
    { x: '10%', y: '70%', size: 260, color: 'rgba(59, 130, 246, 0.06)', opacity: 0.04, parallaxY: -30 },
  ],
  'platform': [
    { x: '20%', y: '30%', size: 320, color: 'rgba(16, 185, 129, 0.08)', opacity: 0.06, parallaxY: -45 },
    { x: '70%', y: '55%', size: 240, color: 'rgba(16, 185, 129, 0.06)', opacity: 0.04, parallaxY: -25 },
  ],
  'security': [
    { x: '80%', y: '15%', size: 400, color: 'rgba(245, 158, 11, 0.08)', opacity: 0.07, parallaxY: -60 },
    { x: '15%', y: '60%', size: 300, color: 'rgba(245, 158, 11, 0.05)', opacity: 0.04, parallaxY: -40 },
  ],
};
```

Category section wrappers in `projects/index.astro` need:
```html
<div data-section-bg="ai-ml" data-category-section="ai-ml" style="position: relative;">
```
The `position: relative` is required because `.section-orb` uses `position: absolute`.

### Pattern 6: Magnetic CTA Buttons (ANIM-04)
**What:** Card CTA buttons ("Source", "Live Site") attract toward cursor on approach.
**When to use:** All CTA link buttons inside project cards.
**Already implemented:** `MagneticButton.astro` exists and targets `[data-magnetic]` elements. The CTA `<a>` tags in ProjectCard just need the `data-magnetic` attribute added.

```html
<!-- Add data-magnetic to CTA buttons in ProjectCard.astro -->
<a href={project.url} ... data-magnetic>Source</a>
<a href={project.liveUrl} ... data-magnetic>Live Site</a>
```

No new JavaScript needed -- the existing `MagneticButton.astro` handles initialization.

### Anti-Patterns to Avoid

- **Using `!important` on hidden card classes:** GSAP Flip cannot override `!important` display values. Use plain `style.display = 'none'` or a class without `!important`.

- **Re-initializing ScrollTrigger stagger after filter:** When Flip runs, ScrollTrigger stagger animations on `[data-card-group]` have already completed (they fire `once: true`). Do NOT re-run `initCardGroupStagger()` after filtering -- the cards are already visible. Flip handles the layout animation.

- **Building a custom FLIP implementation:** The Flip plugin handles dozens of edge cases (border-box, transforms, nested elements, absolute positioning). Do not hand-roll a first/last/invert/play pattern.

- **Using CSS transitions for filter layout changes:** CSS cannot interpolate between "element at grid position A" and "element at grid position B after sibling is hidden." Only JavaScript-based FLIP can track absolute coordinates across layout reflows.

- **Animating the gradient glow with JavaScript on every mousemove:** Setting CSS custom properties is sufficient and GPU-accelerated via the `::after` pseudo-element. Do not use `requestAnimationFrame` or `gsap.to()` for the glow position -- direct property updates are faster for this use case.

- **Using `pushState` for hash updates:** This creates a history entry per filter click. Use `replaceState` to avoid polluting browser history.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Filter layout animation | Custom FLIP with getBoundingClientRect | GSAP `Flip.from()` | Handles absolute positioning, enter/leave, stagger, edge cases |
| Smooth scroll integration | Custom scroll handler | Existing Lenis + GSAP ticker | Already integrated in `smooth-scroll.ts` |
| Card stagger reveal | Custom IntersectionObserver | Existing `initCardGroupStagger()` in `scroll-animations.ts` | Already built with correct timing and `once: true` |
| 3D card tilt | Custom perspective/transform | Existing `vanilla-tilt` via `TiltCard.astro` | Already handles cleanup on `astro:before-swap` |
| Magnetic button effect | Custom proximity detection | Existing `MagneticButton.astro` targeting `[data-magnetic]` | Already respects reduced-motion and pointer:coarse |
| Floating orbs | New parallax component | Existing `FloatingOrbs.astro` with config extension | Just needs new `ORB_CONFIG` entries for category sections |

**Key insight:** The animation infrastructure is already mature. Phase 15 is primarily about *composing* existing animation components + adding the Flip plugin for the new filter feature. Only the filter system and mouse-tracking glow are genuinely new code.

## Common Pitfalls

### Pitfall 1: Flip Animation Collides with ScrollTrigger Stagger
**What goes wrong:** After filtering, cards that were already revealed (opacity: 1, y: 0 from stagger) get their transforms overridden by Flip's absolute positioning, causing a visual glitch.
**Why it happens:** Both Flip and the stagger animation modify `transform` and `opacity` on the same elements.
**How to avoid:** The stagger animations use `once: true` and complete on initial scroll. By the time a user clicks a filter tab, stagger is done and `overwrite: true` is set. Flip's `absolute: true` temporarily replaces the transform -- this is fine because Flip cleans up after itself. Test by scrolling down to trigger all staggers, then clicking a filter.
**Warning signs:** Cards jump or flash when first filter is clicked; opacity resets to 0.

### Pitfall 2: Grid Layout Collapse During Flip Animation
**What goes wrong:** When cards are set to `display: none`, the grid collapses instantly before Flip can animate the transition.
**Why it happens:** DOM changes happen synchronously before Flip computes offsets.
**How to avoid:** Always use `absolute: true` in `Flip.from()`. This makes elements `position: absolute` during the animation, so removed elements float over the new layout while fading out, and remaining elements smoothly slide to their new positions.
**Warning signs:** Cards teleport to new positions instantly; page height jumps.

### Pitfall 3: Floating Orbs Not Visible (Missing position: relative)
**What goes wrong:** Orbs are injected into category sections but don't appear.
**Why it happens:** `.section-orb` uses `position: absolute`. If the parent doesn't have `position: relative`, orbs position relative to a distant ancestor and appear off-screen.
**How to avoid:** Add `position: relative` and `overflow: hidden` (optional, to contain orbs within sections) to category section wrapper elements.
**Warning signs:** Orbs appear at page top or overlap other sections.

### Pitfall 4: Mouse Glow Effect Visible on Touch Devices
**What goes wrong:** The `::after` glow pseudo-element shows at (0,0) on touch tap, creating a flash.
**Why it happens:** Touch events trigger `mousemove` on some mobile browsers.
**How to avoid:** Gate the JavaScript initialization on `pointer: fine` (already standard in the codebase). Additionally, the CSS `opacity: 0` default + `:hover::after { opacity: 0.6 }` means the glow only shows on hover -- mobile devices without hover capability won't trigger it. Still, add `@media (pointer: coarse) { [data-card-item]::after { display: none; } }` as a safety net.
**Warning signs:** Glow flash on mobile tap.

### Pitfall 5: Hash Fragment Triggers Astro Page Transition
**What goes wrong:** Clicking a filter button that updates `#hash` causes Astro's ClientRouter to intercept and run a view transition.
**Why it happens:** If filter tabs are `<a href="#kubernetes">` links, ClientRouter intercepts `<a>` clicks.
**How to avoid:** Use `<button>` elements for filter tabs, not anchor links. Buttons don't navigate. Update hash programmatically with `history.replaceState()`. This completely avoids ClientRouter interference.
**Warning signs:** Page flashes or runs entry animation when clicking filter tabs.

### Pitfall 6: Flip Animation Breaks vanilla-tilt Transforms
**What goes wrong:** After Flip completes, cards that had vanilla-tilt active lose their tilt transform or get stuck in a tilted state.
**Why it happens:** Flip temporarily overrides `transform` on elements. When it cleans up, it restores the "before" transform, but vanilla-tilt may have applied its own transform in the meantime.
**How to avoid:** Destroy vanilla-tilt instances before Flip animation, re-initialize after. Use the existing `TiltCard.astro` pattern:
```typescript
// Before filter
document.querySelectorAll('[data-tilt]').forEach(el => {
  if ((el as any).vanillaTilt) (el as any).vanillaTilt.destroy();
});
// After Flip.from() completes (in onComplete callback)
// Re-init tilt on visible cards
```
**Warning signs:** Cards stuck at an angle after filtering, or tilt not working on filtered-in cards.

### Pitfall 7: Reduced Motion Not Respected on New Animations
**What goes wrong:** Mouse glow, filter transitions, and floating orbs animate for users who prefer reduced motion.
**Why it happens:** New code doesn't check `prefers-reduced-motion`.
**How to avoid:** Follow the established codebase pattern: every animation init function starts with `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;`. For CSS animations, add rules to the existing `@media (prefers-reduced-motion: reduce)` block in `global.css`. For Flip filter transitions specifically, use `gsap.matchMedia()` to switch between animated and instant transitions.
**Warning signs:** Any animation plays when prefers-reduced-motion is enabled in DevTools.

### Pitfall 8: Category Section Headers/Dividers Not Hidden During Filter
**What goes wrong:** When filtering to "Kubernetes", the "AI/ML" heading, "Platform" heading, and gradient dividers remain visible with no cards below them.
**Why it happens:** Only cards are filtered; section wrappers are ignored.
**How to avoid:** Add `data-category-section` to each category section wrapper. The filter logic must hide/show entire sections (heading + grid), not just individual cards. The hero section should hide when a non-matching filter is active.
**Warning signs:** Empty section headers visible when filtering to a single category.

## Code Examples

### Example 1: Complete Filter System Integration
```typescript
// In projects/index.astro <script> tag
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(Flip, ScrollTrigger);

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let isAnimating = false;

function initProjectFilter() {
  const tabs = document.querySelectorAll<HTMLButtonElement>('[data-filter]');
  const cards = document.querySelectorAll<HTMLElement>('[data-card-item]');
  const sections = document.querySelectorAll<HTMLElement>('[data-category-section]');
  const heroSection = document.querySelector<HTMLElement>('[data-hero-section]');

  if (!tabs.length) return;

  // Read initial filter from URL hash
  const initialSlug = getFilterFromHash();
  if (initialSlug !== 'all') {
    applyFilter(initialSlug, false); // No animation on initial load
    setActiveTab(initialSlug);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (isAnimating) return;
      const slug = tab.dataset.filter!;
      applyFilter(slug, !REDUCED_MOTION);
      setActiveTab(slug);
      setFilterHash(slug);
    });
  });

  window.addEventListener('hashchange', () => {
    const slug = getFilterFromHash();
    applyFilter(slug, !REDUCED_MOTION);
    setActiveTab(slug);
  });
}

function applyFilter(slug: string, animate: boolean) {
  const cards = document.querySelectorAll<HTMLElement>('[data-card-item]');
  const sections = document.querySelectorAll<HTMLElement>('[data-category-section]');
  const heroSection = document.querySelector<HTMLElement>('[data-hero-section]');

  if (animate) {
    isAnimating = true;
    const state = Flip.getState(cards);

    toggleVisibility(slug, cards, sections, heroSection);

    Flip.from(state, {
      duration: 0.5,
      ease: 'power2.inOut',
      stagger: 0.03,
      absolute: true,
      absoluteOnLeave: true,
      onEnter: els => gsap.fromTo(els,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03 }
      ),
      onLeave: els => gsap.to(els,
        { opacity: 0, scale: 0.9, duration: 0.3 }
      ),
      onComplete: () => {
        isAnimating = false;
        ScrollTrigger.refresh();
      },
    });
  } else {
    toggleVisibility(slug, cards, sections, heroSection);
  }
}

function toggleVisibility(
  slug: string,
  cards: NodeListOf<HTMLElement>,
  sections: NodeListOf<HTMLElement>,
  heroSection: HTMLElement | null,
) {
  const showAll = slug === 'all';

  cards.forEach(card => {
    card.style.display = (showAll || card.dataset.category === slug) ? '' : 'none';
  });

  sections.forEach(section => {
    section.style.display = (showAll || section.dataset.categorySection === slug) ? '' : 'none';
  });

  if (heroSection) {
    // Hero shows only on "All" or if featured projects match the filter
    heroSection.style.display = showAll ? '' : 'none';
  }
}

function setActiveTab(slug: string) {
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(tab => {
    tab.setAttribute('aria-pressed', tab.dataset.filter === slug ? 'true' : 'false');
  });
}

function getFilterFromHash(): string {
  const hash = window.location.hash.slice(1).toLowerCase();
  const validSlugs = ['ai-ml', 'kubernetes', 'platform', 'security'];
  return validSlugs.includes(hash) ? hash : 'all';
}

function setFilterHash(slug: string) {
  const url = slug === 'all'
    ? window.location.pathname
    : `${window.location.pathname}#${slug}`;
  history.replaceState(null, '', url);
}

document.addEventListener('astro:page-load', initProjectFilter);
```

### Example 2: Mouse-Tracking Glow CSS (Complete)
```css
/* Card glow overlay -- positioned via JS-updated custom properties */
[data-card-item] {
  position: relative;
  overflow: hidden;
}

[data-card-item]::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    300px circle at calc(var(--mouse-x, -300) * 1px) calc(var(--mouse-y, -300) * 1px),
    var(--category-glow, var(--color-accent-glow)),
    transparent 70%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1;
}

[data-card-item]:hover::after {
  opacity: 0.5;
}

/* Ensure card content sits above glow */
[data-card-item] > * {
  position: relative;
  z-index: 2;
}

@media (pointer: coarse) {
  [data-card-item]::after {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-card-item]::after {
    transition: none;
  }
}
```

**Note:** Using `inset: 0` with `radial-gradient at position` is cleaner than fixed-size overlay. The gradient circle size (300px) creates a soft glow area.

### Example 3: Reduced Motion Fallback Pattern (gsap.matchMedia)
```typescript
// Source: https://gsap.com/resources/a11y/
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Full animation: Flip with stagger, enter/leave effects
  Flip.from(state, {
    duration: 0.5,
    stagger: 0.03,
    absolute: true,
    onEnter: els => gsap.fromTo(els, { opacity: 0 }, { opacity: 1 }),
    onLeave: els => gsap.to(els, { opacity: 0 }),
  });
});

mm.add('(prefers-reduced-motion: reduce)', () => {
  // Instant swap: just toggle display, no animation
  toggleVisibility(slug, cards, sections, heroSection);
});
```

### Example 4: Category Section Wrapper Markup
```astro
<!-- In projects/index.astro - each category section needs data attributes -->
{grouped.map(({ category, items, totalCount, slug }, idx) => (
  <div
    data-category-section={slug}
    data-section-bg={slug}
    style="position: relative;"
  >
    {idx > 0 && (
      <div class="gradient-divider max-w-6xl mx-auto my-10" data-divider-reveal aria-hidden="true"></div>
    )}
    <div class="flex items-baseline gap-3 mb-6">
      <h2 class="text-xl sm:text-2xl font-heading font-bold" data-word-reveal>
        {category}
      </h2>
      <span class="meta-mono text-[var(--color-text-secondary)]">
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

### Example 5: Adding data-magnetic to CTA Buttons
```astro
<!-- In ProjectCard.astro -- just add the attribute to existing CTA links -->
<a
  href={project.url}
  target="_blank"
  rel="noopener noreferrer"
  class="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
  data-magnetic
>
  Source
</a>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No filtering, all projects visible | Category filter tabs with Flip layout animation | Phase 15 (new) | Users can find relevant projects by category |
| Instant show/hide with display toggle | GSAP Flip from() with enter/leave animations | GSAP 3.9.0+ (Flip plugin) | Smooth transitions preserve spatial context |
| No mouse interaction on cards | Mouse-tracking radial gradient glow | Modern CSS + JS pattern (2024+) | Premium interactive feel |
| No orbs on projects page | Category-tinted floating parallax orbs | FloatingOrbs extension | Visual depth and category identity |
| All GSAP plugins required paid license | All GSAP plugins free (Webflow acquisition) | Late 2024 | Flip, SplitText, etc. freely usable |

**Existing infrastructure leveraged:**
- `initCardGroupStagger()` -- GSAP stagger reveal on scroll (ANIM-01 already done)
- `MagneticButton.astro` -- magnetic hover targeting `[data-magnetic]` (ANIM-04 just needs attribute)
- `FloatingOrbs.astro` -- parallax orbs with `data-section-bg` config (ANIM-03 needs config extension)
- `TiltCard.astro` -- vanilla-tilt on `[data-tilt]` cards (already wired)
- `prefers-reduced-motion` checks in every animation init function
- `astro:page-load` / `astro:before-swap` lifecycle hooks

## Open Questions

1. **Hero section behavior during filtering**
   - What we know: Featured projects (kps-graph-agent in AI/ML, kps-cluster-deployment in K8s) are shown in a separate hero section. When filtering to "Security", these hero cards are irrelevant.
   - What's unclear: Should the hero section hide entirely when a non-"All" filter is active, or should it show only featured projects matching the filter?
   - Recommendation: Hide hero section entirely for non-"All" filters. Only 2 projects are featured, and they belong to different categories -- showing a single hero card looks awkward. The hero is a "landing" feature for the "All" view.

2. **Flip + grid-flow-dense interaction**
   - What we know: The category grids use `grid-flow-dense` to fill gaps from 2-col spanning large cards. Flip records absolute positions before the layout change.
   - What's unclear: Whether `grid-flow-dense` recalculation after filtering (fewer items) causes unexpected card positioning.
   - Recommendation: Test thoroughly with each filter. If `grid-flow-dense` causes confusing reorder after Flip completes, consider removing it for filtered views (only needed when many items of varying sizes exist).

3. **ScrollTrigger.refresh() after Flip**
   - What we know: After filtering, the page height changes (fewer sections visible). ScrollTrigger caches trigger positions.
   - What's unclear: Whether all existing ScrollTriggers (dividers, word-reveal, etc.) need refresh.
   - Recommendation: Call `ScrollTrigger.refresh()` in Flip's `onComplete` callback. This is safe and ensures all scroll-based triggers recalculate.

## Sources

### Primary (HIGH confidence)
- [GSAP Flip Plugin Documentation](https://gsap.com/docs/v3/Plugins/Flip/) - Complete API: getState, from, to, absolute, onEnter, onLeave, absoluteOnLeave
- [GSAP Accessible Animation Guide](https://gsap.com/resources/a11y/) - gsap.matchMedia() pattern for prefers-reduced-motion
- Codebase inspection: `src/lib/scroll-animations.ts` - existing `initCardGroupStagger()` function (lines 123-149)
- Codebase inspection: `src/components/animations/FloatingOrbs.astro` - ORB_CONFIG pattern and initialization
- Codebase inspection: `src/components/animations/MagneticButton.astro` - `[data-magnetic]` targeting pattern
- Codebase inspection: `src/components/ProjectCard.astro` - existing `data-category`, `data-card-item`, `--category-glow` infrastructure
- Codebase inspection: `src/styles/global.css` - existing `prefers-reduced-motion` block (lines 510-555)
- Codebase inspection: `src/layouts/Layout.astro` - animation component loading and lifecycle hooks
- GSAP package: `node_modules/gsap/dist/Flip.js` confirmed available (v3.14.2)

### Secondary (MEDIUM confidence)
- [Codrops: Animating Responsive Grid Layout Transitions with GSAP Flip (Jan 2026)](https://tympanus.net/codrops/2026/01/20/animating-responsive-grid-layout-transitions-with-gsap-flip/) - Grid + Flip integration patterns, animation guarding
- [GSAP Community: Flip animation from display block to none](https://gsap.com/community/forums/topic/41061-flip-animation-from-display-block-to-none/) - `absoluteOnLeave` and `!important` CSS gotcha
- [GSAP Community: Flip plugin messing with CSS grid](https://gsap.com/community/forums/topic/38595-flip-plugin-messing-with-css-grid-during-flip/) - DOM timing issues with Flip + grid
- [Mouse-following shiny hover effect (bholmes.dev)](https://bholmes.dev/blog/a-shiny-on-hover-effect-that-follows-your-mouse-css/) - CSS custom property + mousemove pattern
- [MDN: Window hashchange event](https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event) - Hash navigation API
- [Webflow: GSAP becomes 100% free](https://webflow.com/blog/gsap-becomes-free) - All GSAP plugins now free

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation or codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries; GSAP Flip confirmed bundled and free
- Architecture: HIGH - All patterns build on verified existing infrastructure (data attributes, animation components, lifecycle hooks)
- Filtering with Flip: HIGH - Official GSAP docs + multiple community examples confirm the pattern
- Mouse-tracking glow: HIGH - Simple CSS custom properties + mousemove; well-documented pattern
- Pitfalls: HIGH - Based on direct codebase analysis (vanilla-tilt cleanup, ScrollTrigger refresh, grid-flow-dense)
- Floating orbs extension: HIGH - Exact same pattern as existing implementation, just new config entries
- Hash state management: HIGH - Standard browser API, no framework complications (buttons not links)

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (stable -- GSAP and Astro APIs are not fast-moving)
