# Phase 6: Visual Effects + Quantum Explorer - Research

**Researched:** 2026-02-11
**Domain:** Canvas particle animation, CSS/JS animation, Astro View Transitions, accessibility motion preferences
**Confidence:** HIGH

## Summary

This phase adds the signature "Quantum Explorer" visual experience to the site: an animated particle canvas on the home hero, smooth inter-page transitions via Astro's ClientRouter, and scroll-triggered reveal animations on page sections. All effects must degrade gracefully for users with `prefers-reduced-motion` enabled and perform well on mobile devices.

The technical approach is straightforward: a vanilla JavaScript canvas particle system (no external library needed), Astro's built-in `<ClientRouter />` component for view transitions, and the native Intersection Observer API for scroll reveals. The site already uses inline scripts and Tailwind CSS, so all three features integrate cleanly without new dependencies. The primary risk areas are (1) canvas performance on low-end mobile devices, (2) script lifecycle management when ClientRouter intercepts navigation, and (3) ensuring the particle canvas survives page transitions via `transition:persist`.

**Primary recommendation:** Build the particle system as a self-contained vanilla JS class using HTML5 Canvas, integrate Astro ClientRouter in Layout.astro for view transitions, and use Intersection Observer with CSS classes for scroll reveals. Zero new npm dependencies required.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro ClientRouter | 5.17.1 (built-in) | Client-side page transitions | Built into Astro, replaces full-page reloads with smooth animations |
| HTML5 Canvas API | Native | Particle rendering | No library overhead, full control over rendering pipeline |
| Intersection Observer API | Native | Scroll-triggered reveals | Browser-native, performant, fires only on visibility changes |
| Page Visibility API | Native | Pause canvas when tab hidden | Browser-native, widely available since 2015 |
| CSS `prefers-reduced-motion` | Native | Accessibility motion detection | Universal browser support since 2020, W3C standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `window.matchMedia` | Native | JS-side reduced motion detection | To prevent canvas animation from starting at all |
| `requestAnimationFrame` | Native | Animation loop timing | Always -- never use setInterval for rendering |
| `devicePixelRatio` | Native | HiDPI canvas scaling | Always -- prevents blurry canvas on retina screens |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla Canvas | tsParticles / particles.js | 40-150KB+ bundle, overkill for a hero-only effect |
| Vanilla Canvas | Three.js / WebGL | Massive bundle (600KB+), GPU shader complexity for simple dots |
| Intersection Observer | ScrollReveal.js / AOS | Extra dependency for what 20 lines of JS handles natively |
| Astro ClientRouter | Manual SPA router | Would break Astro's static generation model |

**Installation:**
```bash
# No new packages needed -- all features use browser-native APIs and Astro built-ins
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    ParticleCanvas.astro     # Canvas element + inline particle script
    ScrollReveal.astro       # Wrapper component applying reveal CSS class
  layouts/
    Layout.astro             # Add <ClientRouter /> here (single location)
  styles/
    global.css               # Add scroll-reveal keyframes + reduced-motion overrides
  pages/
    index.astro              # Import ParticleCanvas into hero section
```

### Pattern 1: Self-Contained Particle Canvas Component
**What:** An Astro component containing a `<canvas>` element and an `is:inline` script that initializes the particle system. The script class manages its own lifecycle (create, animate, pause, resume, destroy).
**When to use:** For the home page hero section only.
**Example:**
```astro
<!-- ParticleCanvas.astro -->
<div class="particle-container absolute inset-0 -z-10" id="particle-container">
  <canvas id="particle-canvas" class="w-full h-full"></canvas>
</div>

<style>
  /* Static gradient fallback -- always visible, canvas overlays it */
  .particle-container {
    background: radial-gradient(ellipse at 50% 0%, var(--color-surface-alt) 0%, var(--color-surface) 70%);
  }
  @media (prefers-reduced-motion: reduce) {
    #particle-canvas {
      display: none;
    }
  }
</style>

<script is:inline>
(function() {
  // Bail out entirely if user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const container = document.getElementById('particle-container');
  const dpr = window.devicePixelRatio || 1;
  let particles = [];
  let animationId = null;
  let isRunning = false;

  // Mobile: fewer particles for performance
  function getParticleCount() {
    const width = container.offsetWidth;
    if (width < 640) return 30;   // Mobile
    if (width < 1024) return 50;  // Tablet
    return 80;                     // Desktop
  }

  function resize() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
  }

  function createParticle(w, h) {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.6 + 0.1,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
    };
  }

  function init() {
    resize();
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const count = getParticleCount();
    particles = Array.from({ length: count }, () => createParticle(w, h));
  }

  function draw() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.dx;
      p.y += p.dy;
      // Wrap around edges
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124, 115, 255, ' + p.alpha + ')';
      ctx.fill();
    }
    animationId = requestAnimationFrame(draw);
  }

  function start() {
    if (!isRunning) {
      isRunning = true;
      draw();
    }
  }

  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    isRunning = false;
  }

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) { stop(); }
    else { start(); }
  });

  window.addEventListener('resize', function() {
    resize();
    // Recalculate particle count on resize
    const count = getParticleCount();
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    if (count < particles.length) {
      particles = particles.slice(0, count);
    } else {
      while (particles.length < count) {
        particles.push(createParticle(w, h));
      }
    }
  });

  init();
  start();
})();
</script>
```
**Source:** Pattern synthesized from [MDN Canvas Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), [Cruip Particle Tutorial](https://cruip.com/how-to-create-a-beautiful-particle-animation-with-html-canvas/), [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)

### Pattern 2: ClientRouter in Layout with Lifecycle Management
**What:** Add `<ClientRouter />` once in Layout.astro. Use `astro:page-load` for re-initializing page-specific scripts and `transition:persist` for the particle canvas.
**When to use:** Always -- this is the single integration point for view transitions.
**Example:**
```astro
---
// Layout.astro
import { ClientRouter } from 'astro:transitions';
---
<head>
  <ClientRouter />
  <!-- ... existing head content ... -->
</head>
```

For the particle canvas on the home page hero, use `transition:persist` so it is NOT destroyed and rebuilt when navigating away and back:
```astro
<!-- In index.astro hero section -->
<div transition:persist="particle-hero" class="...">
  <ParticleCanvas />
</div>
```

**Source:** [Astro View Transitions Guide](https://docs.astro.build/en/guides/view-transitions/), [Bag of Tricks Script Guide](https://events-3bg.pages.dev/jotter/astro/scripts/)

### Pattern 3: Scroll Reveal via Intersection Observer + CSS
**What:** A CSS class `.reveal` that starts elements as transparent/translated-down, and a global JS observer that adds `.revealed` when elements enter the viewport.
**When to use:** For all page sections that should animate on scroll.
**Example:**
```css
/* global.css */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```
```javascript
// In Layout.astro or a global script
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal:not(.revealed)');
  if (!elements.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );
  elements.forEach((el) => observer.observe(el));
}

// Works with ClientRouter transitions
document.addEventListener('astro:page-load', initScrollReveal);
```
**Source:** [MDN Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), [CSS-Tricks Scroll Triggered Animation](https://css-tricks.com/scroll-triggered-animation-vanilla-javascript/)

### Anti-Patterns to Avoid
- **Using setInterval for canvas animation:** Always use requestAnimationFrame -- it syncs with display refresh, pauses in background tabs, and is more efficient.
- **Querying DOM in every animation frame:** Cache canvas context, container dimensions, and particle arrays. Only re-query on resize events.
- **Adding scroll event listeners for reveal animations:** The scroll event fires up to 100+ times per second. Intersection Observer fires only on threshold crossings.
- **Using a heavy particle library (tsParticles, particles.js) for a hero-only effect:** These libraries add 40-150KB+ and are designed for complex, configurable particle systems. A 60-line vanilla class does the job.
- **Re-initializing the particle canvas on every page transition:** Use `transition:persist` to keep the canvas alive. Only initialize it once.
- **Stacking event listeners on every transition:** Module scripts run once. If using inline scripts, wrap in IIFE and use `astro:page-load` to re-init. Always guard against double-initialization.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page transitions / client-side routing | Custom SPA router or fetch-and-swap | Astro `<ClientRouter />` | Handles fallbacks, prefetching, scroll position, route announcements, script lifecycle |
| HiDPI canvas rendering | Manual pixel ratio calculations everywhere | Standard `devicePixelRatio` resize pattern | One-time setup pattern, well-documented (see code example above) |
| Scroll-triggered animations | Custom scroll event throttling with requestAnimationFrame | `IntersectionObserver` | Browser-optimized, fires only on threshold crossings, no jank |
| Motion preference detection | Polling or manual OS detection | `prefers-reduced-motion` media query + `matchMedia` | OS-integrated, real-time change detection, W3C standard |
| Tab visibility detection | Polling `document.hasFocus()` | Page Visibility API (`document.visibilitychange`) | Event-driven, reliable across all browsers, battery-friendly |

**Key insight:** Every visual feature in this phase can be implemented with browser-native APIs. Adding npm dependencies would increase bundle size with zero benefit. The Astro ecosystem provides the only non-native piece needed (ClientRouter), and it is already included in the installed Astro version.

## Common Pitfalls

### Pitfall 1: Canvas Blurry on Retina/HiDPI Displays
**What goes wrong:** Canvas renders at CSS pixel resolution, appears blurry on 2x/3x screens.
**Why it happens:** Canvas `width`/`height` attributes set logical pixels, not device pixels.
**How to avoid:** Always multiply canvas dimensions by `window.devicePixelRatio`, then use `ctx.scale(dpr, dpr)` and set CSS dimensions separately.
**Warning signs:** Particles look soft/fuzzy on phones or MacBook screens.

### Pitfall 2: Scripts Stop Working After View Transition Navigation
**What goes wrong:** Event listeners, Intersection Observers, and canvas animations stop responding after navigating to a new page via ClientRouter.
**Why it happens:** Astro's bundled module scripts run once and are NOT re-executed on soft navigations. The DOM is swapped but scripts are not re-run.
**How to avoid:** Use `document.addEventListener('astro:page-load', initFunction)` for any script that needs to reinitialize after navigation. For the particle canvas, use `transition:persist` so it survives transitions entirely.
**Warning signs:** Animations work on first load but not after clicking a nav link and returning.

### Pitfall 3: Particle Animation Drains Battery on Mobile
**What goes wrong:** Running 80+ particles at 60fps on a mobile device causes battery drain and heat.
**Why it happens:** Canvas rendering is CPU-bound. Mobile GPUs throttle under sustained load.
**How to avoid:** Detect viewport width and reduce particle count (30 on mobile, 50 on tablet, 80 on desktop). The Page Visibility API pause is also critical -- `requestAnimationFrame` already pauses in background tabs, but explicit pause via `visibilitychange` is more reliable and immediately stops computation.
**Warning signs:** Mobile Lighthouse performance score drops, device gets warm, fans spin on desktop.

### Pitfall 4: Scroll Reveal Fires Multiple Times or Not At All
**What goes wrong:** Elements flash in/out or never animate because the observer is re-initialized on every page load without cleanup.
**Why it happens:** With ClientRouter, `astro:page-load` fires on every navigation. If the observer is not properly scoped to un-revealed elements, it may re-observe already-revealed elements.
**How to avoid:** Query only `.reveal:not(.revealed)` to skip already-revealed elements. Use `observer.unobserve(entry.target)` after triggering the reveal. This is idempotent -- safe to call on every navigation.
**Warning signs:** Sections re-animate when navigating back to a page.

### Pitfall 5: Typing Animation on Home Page Breaks with ClientRouter
**What goes wrong:** The existing `setInterval`-based typing animation on the hero creates multiple intervals after navigating away and back.
**Why it happens:** The inline script (`is:inline`) re-executes when the page is revisited, creating a new `setInterval` without clearing the old one.
**How to avoid:** Either (a) clear any existing interval before setting a new one using a global reference, (b) use `transition:persist` on the typing element, or (c) convert to a module script that uses `astro:page-load` with a guard.
**Warning signs:** Text cycling accelerates (two intervals running), or the role text flickers between two different roles on each cycle.

### Pitfall 6: View Transition Animation Conflicts with prefers-reduced-motion
**What goes wrong:** Developer adds custom CSS transitions but forgets to honor reduced motion.
**Why it happens:** Astro's ClientRouter automatically disables view transition animations when `prefers-reduced-motion: reduce` is active, but any custom CSS animations (scroll reveals, page entrance effects) must be manually overridden.
**How to avoid:** Astro handles its own view transitions automatically. For custom CSS animations (scroll reveals), always add a `@media (prefers-reduced-motion: reduce)` block that sets `transition: none`, `animation: none`, `opacity: 1`, `transform: none`.
**Warning signs:** View transitions are smooth but scroll reveals still animate for users with reduced motion enabled.

## Code Examples

Verified patterns from official sources:

### Adding ClientRouter to Layout.astro
```astro
---
// Source: https://docs.astro.build/en/guides/view-transitions/
import { ClientRouter } from 'astro:transitions';
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import SEOHead from '../components/SEOHead.astro';

// ... existing Props interface ...
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <ClientRouter />
    <SEOHead {/* ...existing props... */} />
    <!-- ... rest of head ... -->
  </head>
  <body class="min-h-screen flex flex-col bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors">
    <Header />
    <main id="main-content" class="flex-1">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

### Theme Script Must Survive Transitions
```astro
<!-- Source: https://events-3bg.pages.dev/jotter/astro/scripts/ -->
<!-- The existing theme detection script uses is:inline, which is correct -->
<!-- It needs to run on astro:after-swap to prevent FOUC during transitions -->
<script is:inline>
  (function() {
    function applyTheme() {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    applyTheme();
    document.addEventListener('astro:after-swap', applyTheme);
  })();
</script>
```

### Reduced Motion Detection in JavaScript
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Check at init time
if (prefersReducedMotion.matches) {
  // Don't start any animations
  return;
}

// Listen for changes (user toggles setting while page is open)
prefersReducedMotion.addEventListener('change', (e) => {
  if (e.matches) {
    stopAllAnimations();
  } else {
    startAnimations();
  }
});
```

### Page Visibility API for Pausing Canvas
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
    isRunning = false;
  } else {
    if (!isRunning) {
      isRunning = true;
      animationId = requestAnimationFrame(draw);
    }
  }
});
```

### Canvas HiDPI Setup Pattern
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
function resizeCanvas(canvas, ctx, container) {
  const dpr = window.devicePixelRatio || 1;
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
}
```

### Intersection Observer Scroll Reveal
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal:not(.revealed)');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

// Compatible with Astro ClientRouter
document.addEventListener('astro:page-load', initScrollReveal);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<ViewTransitions />` | `<ClientRouter />` | Astro 5.0 (Dec 2024) | Renamed component, same functionality |
| `particles.js` (abandoned) | tsParticles or vanilla canvas | 2020+ | particles.js unmaintained, vanilla preferred for simple cases |
| Scroll event + throttle | IntersectionObserver | 2016+ (wide support 2018) | Dramatically better performance, no jank |
| `setInterval` for animation | `requestAnimationFrame` | 2012+ | Syncs with display refresh, auto-pauses in background tabs |
| Manual FOUC prevention | `astro:after-swap` event | Astro 3.0+ (2023) | Provides hook specifically for pre-render DOM adjustments |
| JS-only reduced motion check | CSS `@media (prefers-reduced-motion)` | 2020 (baseline) | CSS-level control prevents any animation frame from rendering |

**Deprecated/outdated:**
- `<ViewTransitions />`: Renamed to `<ClientRouter />` in Astro 5.0. The old name may still work as an alias but use the new name.
- `particles.js`: Unmaintained since 2018. tsParticles is the maintained fork, but unnecessary for this project.
- `document.webkitHidden`: Obsolete vendor prefix for Page Visibility API. Use `document.hidden` and `document.visibilityState`.

## Open Questions

1. **Canvas particle color theming (light vs dark mode)**
   - What we know: The site uses CSS custom properties (`--color-accent: #6c63ff` light / `#7c73ff` dark). Canvas cannot read CSS variables directly from the rendering context.
   - What's unclear: Whether to use `getComputedStyle` to read the accent color at init time, or hardcode particle colors for dark mode only (since the hero background is dark in both themes via gradient).
   - Recommendation: Since the particle canvas sits behind hero text on a dark gradient background, use a fixed semi-transparent accent color (`rgba(124, 115, 255, alpha)`). If the hero gradient differs between themes, read the computed CSS variable at init and on theme change.

2. **transition:persist behavior when navigating to a page without the persisted element**
   - What we know: Astro docs say persisted elements are "moved over to the new DOM if they exist on the new page." If the element does not exist on the destination page, it is dropped.
   - What's unclear: Whether the canvas and its `requestAnimationFrame` loop are properly garbage collected when navigating away from the home page.
   - Recommendation: Add explicit cleanup in the `astro:before-swap` event or simply let `transition:persist` handle it naturally. Test by navigating away and checking that `requestAnimationFrame` stops. As a safety net, the `visibilitychange` listener already stops the loop.

3. **Scroll reveal stagger timing**
   - What we know: Basic reveal triggers all visible elements at once.
   - What's unclear: Whether sections should stagger (first section fades in, then second 200ms later, etc.) or all trigger independently based on scroll position.
   - Recommendation: Use independent triggering per-section based on scroll position (simpler, more natural). If stagger is desired, add `transition-delay` via CSS utility classes (`delay-100`, `delay-200`, etc.) on individual elements.

## Sources

### Primary (HIGH confidence)
- [Astro View Transitions Guide](https://docs.astro.build/en/guides/view-transitions/) - ClientRouter usage, transition:persist, transition:animate, lifecycle events, script behavior, reduced-motion handling
- [Astro View Transitions API Reference](https://docs.astro.build/en/reference/modules/astro-transitions/) - ClientRouter props, fade/slide exports, lifecycle event types, navigate function
- [MDN Canvas Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) - HiDPI rendering, requestAnimationFrame, alpha:false optimization, layered canvas
- [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) - document.hidden, visibilitychange event, browser compatibility
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) - CSS syntax, JavaScript matchMedia, browser support
- [MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - threshold, rootMargin, observe/unobserve pattern

### Secondary (MEDIUM confidence)
- [Bag of Tricks: Astro Scripts with View Transitions](https://events-3bg.pages.dev/jotter/astro/scripts/) - Script re-execution patterns, module vs inline behavior, astro:after-swap best practices
- [Cruip: Particle Animation with Canvas](https://cruip.com/how-to-create-a-beautiful-particle-animation-with-html-canvas/) - ParticleAnimation class structure, mouse interaction, resize handling
- [mroy.club: Scroll Animations 2025](https://mroy.club/articles/scroll-animations-techniques-and-considerations-for-2025) - Intersection Observer vs CSS animation-timeline comparison
- [Pope Tech: Accessible Animation](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) - Reduced motion best practices, alternative animations

### Tertiary (LOW confidence)
- [GitHub: ab-particles](https://github.com/asifbacchus/ab-particles) - Reference for vanilla particle implementation patterns (not verified in detail)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All browser-native APIs with excellent documentation and universal support. Astro ClientRouter verified against installed v5.17.1.
- Architecture: HIGH - Patterns directly derived from Astro official docs and MDN. Verified against existing codebase structure (Layout.astro, global.css, inline scripts).
- Pitfalls: HIGH - Each pitfall verified against official documentation. Script lifecycle behavior confirmed by both Astro docs and Bag of Tricks deep-dive. Canvas performance patterns from MDN.
- Particle implementation: MEDIUM - Specific code patterns synthesized from multiple sources. Core API usage is HIGH confidence, but exact particle count thresholds (30/50/80) are estimates that need testing on real devices.

**Research date:** 2026-02-11
**Valid until:** 2026-04-11 (90 days -- all APIs are stable browser standards; Astro ClientRouter API is stable since v5.0)
