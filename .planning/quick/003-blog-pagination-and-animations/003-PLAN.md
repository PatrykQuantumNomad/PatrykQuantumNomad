---
phase: quick-003
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/blog/[...page].astro
  - src/components/Pagination.astro
  - src/styles/global.css
autonomous: true
must_haves:
  truths:
    - "Blog page 1 renders at /blog/ showing the first 10 posts"
    - "Blog page 2 renders at /blog/2/ showing the next 10 posts"
    - "Pagination controls show page numbers, prev/next, and highlight the current page"
    - "Year headers only appear for years that have posts on the current page"
    - "Tag cloud and hero section appear on every page"
    - "Blog cards animate in with staggered entrance on scroll"
    - "Hero heading has a subtle fade-up animation on page load"
    - "All animations gracefully degrade when prefers-reduced-motion is set"
  artifacts:
    - path: "src/pages/blog/[...page].astro"
      provides: "Paginated blog listing using Astro paginate() API"
      contains: "paginate("
    - path: "src/components/Pagination.astro"
      provides: "Reusable pagination navigation component"
      contains: "aria-current"
    - path: "src/styles/global.css"
      provides: "Blog card stagger animation data attribute CSS"
      contains: "data-blog-card"
  key_links:
    - from: "src/pages/blog/[...page].astro"
      to: "Astro paginate() API"
      via: "getStaticPaths returning paginate()"
      pattern: "paginate\\(sortedPosts"
    - from: "src/pages/blog/[...page].astro"
      to: "src/components/Pagination.astro"
      via: "component import"
      pattern: "import Pagination"
    - from: "src/pages/blog/[...page].astro"
      to: "src/lib/scroll-animations.ts"
      via: "data-blog-card attributes picked up by initCardGroupStagger or ScrollTrigger.batch"
      pattern: "data-blog-card"
---

<objective>
Add pagination to the blog listing page (10 posts per page) and add scroll/header animations for blog cards and the hero section.

Purpose: The blog currently renders all 41 posts in a single flat scroll. Pagination improves page load performance and readability. Animations add polish consistent with the rest of the site.

Output: Paginated blog at /blog/, /blog/2/, etc. with animated hero and staggered blog card reveals.
</objective>

<context>
@src/pages/blog/index.astro (current blog listing — will be renamed to [...page].astro)
@src/components/BlogCard.astro (existing blog card component)
@src/lib/scroll-animations.ts (existing GSAP scroll animation system)
@src/lib/animation-lifecycle.ts (animation cleanup for page transitions)
@src/styles/global.css (existing animation CSS)
@src/layouts/Layout.astro (layout with GSAP + ScrollTrigger initialization)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert blog listing to paginated route with Pagination component</name>
  <files>
    src/pages/blog/[...page].astro
    src/components/Pagination.astro
  </files>
  <action>
**Step 1: Delete `src/pages/blog/index.astro` and create `src/pages/blog/[...page].astro`.**

The new file uses Astro's `paginate()` API in `getStaticPaths`. Key implementation:

```typescript
export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  const sortedPosts = posts.sort(
    (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
  );
  return paginate(sortedPosts, { pageSize: 10 });
}
```

The frontmatter receives `const { page } = Astro.props;` where `page` has `.data` (posts for current page), `.currentPage`, `.lastPage`, `.url.prev`, `.url.next`, `.total`, `.start`, `.end`, `.size`.

**Tag cloud computation:** Use ALL posts (not just current page) — fetch the full collection again or compute before paginate. The tag cloud shows global tag counts, not per-page. Compute `tagCounts` and `sortedTags` from the full `sortedPosts` array before passing to `paginate()`. Pass them as props via the `paginate()` call's second argument is not supported for extra props, so compute them in the template section by re-fetching or by using a shared variable in the frontmatter. The simplest approach: compute tag cloud data from the full collection in frontmatter (before getStaticPaths returns) and use it in the template. Since `getStaticPaths` runs at build time and can pass props, add `tagCounts` and other global stats to the props via a wrapper. Actually, the cleanest Astro pattern is to compute global stats OUTSIDE getStaticPaths in the frontmatter below it:

```typescript
// Below getStaticPaths
const { page } = Astro.props;

// For tag cloud and stats, use the full collection
const allPosts = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? data.draft !== true : true;
});
const allSorted = allPosts.sort(
  (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
);

// Tag cloud from ALL posts
const tagCounts = new Map<string, number>();
allSorted.forEach((post) => {
  post.data.tags.forEach((tag) => {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });
});
const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

// Year groups from CURRENT PAGE posts only
const postsByYear = new Map<number, typeof page.data>();
page.data.forEach((post) => {
  const year = post.data.publishedDate.getFullYear();
  if (!postsByYear.has(year)) postsByYear.set(year, []);
  postsByYear.get(year)!.push(post);
});
const years = [...postsByYear.keys()].sort((a, b) => b - a);

// Global stats
const totalPosts = allSorted.length;
const allYears = [...new Set(allSorted.map(p => p.data.publishedDate.getFullYear()))];
const oldestYear = Math.min(...allYears);
const newestYear = Math.max(...allYears);
```

**Template structure:** Keep the exact same hero section (h1 with `data-word-reveal`, subtitle with `data-reveal`, stats line with `meta-mono`), tag cloud section, and gradient dividers from the original `index.astro`. The year-grouped post listing now iterates over `page.data` grouped by year (only years present on current page). After the post listing, add the `<Pagination>` component.

For the stats line, show pagination context: `{totalPosts} ARTICLES · {oldestYear} — {newestYear} · PAGE {page.currentPage} OF {page.lastPage}` (only show the "PAGE X OF Y" part when lastPage > 1).

**Step 2: Create `src/components/Pagination.astro`.**

Props interface:
```typescript
interface Props {
  currentPage: number;
  lastPage: number;
  prevUrl: string | undefined;
  nextUrl: string | undefined;
  baseUrl?: string; // defaults to '/blog/'
}
```

The component renders a `<nav aria-label="Blog pagination">` containing:
- Previous arrow link (disabled/hidden when on page 1) — use `&larr; Prev`
- Page number links: Show all pages if lastPage <= 7. If > 7 pages, show: 1, ..., current-1, current, current+1, ..., lastPage (with ellipsis spans).
- Next arrow link (disabled/hidden when on last page) — use `Next &rarr;`

Page URL construction: Page 1 = `/blog/`, page N = `/blog/${N}/`.

Styling (match site design):
- Container: `flex items-center justify-center gap-2 mt-16 mb-8`
- Page numbers: `meta-mono` font class, `w-10 h-10 flex items-center justify-center rounded-lg transition-colors`
- Current page: `bg-[var(--color-accent)] text-white` with `aria-current="page"`
- Other pages: `bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]`
- Prev/Next: same styling as page numbers but wider (`px-4`) with text
- Disabled prev/next: `opacity-30 pointer-events-none`
- Ellipsis: `w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] meta-mono`
- Add `data-reveal` to the nav element so it animates in with the rest of the page

Do NOT show the pagination component at all if `lastPage === 1`.
  </action>
  <verify>
Run `npm run build` and verify:
1. No build errors
2. Pages generated at dist/blog/index.html, dist/blog/2/index.html, etc.
3. Check with `ls dist/blog/` that numbered subdirectories exist
4. Verify page count: with 41 posts and pageSize 10, expect 5 pages (10+10+10+10+1)
  </verify>
  <done>
Blog listing is paginated at /blog/ (page 1), /blog/2/ through /blog/5/. Each page shows up to 10 posts grouped by year. Tag cloud shows global tag counts on every page. Pagination nav shows page numbers with current page highlighted, prev/next links, and proper aria attributes. The old index.astro is removed.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add hero and blog card scroll animations</name>
  <files>
    src/pages/blog/[...page].astro
    src/lib/scroll-animations.ts
    src/styles/global.css
  </files>
  <action>
**Step 1: Add blog card stagger animations to the page template.**

In `[...page].astro`, wrap the year-grouped blog cards section in a container with `data-card-group` attribute. Each individual BlogCard wrapper `<div>` gets `data-card-item` instead of `data-reveal`. This hooks into the existing `initCardGroupStagger()` function in `scroll-animations.ts` which already handles staggered card reveals (y: 30 -> 0, opacity: 0 -> 1, stagger: 0.08, duration: 0.7).

Structure each year group like this:
```html
<div data-card-group>
  <h2 data-reveal class="...year header styles...">{year}</h2>
  <div class="space-y-6">
    {posts.map((post) => (
      <div data-card-item>
        <BlogCard post={post} />
      </div>
    ))}
  </div>
</div>
```

Each year group is its own `data-card-group`, so cards within a year stagger together as they scroll into view.

**Step 2: Add hero section parallax.**

Add `data-parallax` to the hero section container (or the h1 specifically) to engage the existing parallax handler in `scroll-animations.ts`. The existing parallax implementation moves elements with `y: 120` on scrub — this may be too aggressive for a heading. Instead, add a dedicated blog hero animation.

In `[...page].astro`, add a `<script>` block (inline, using Astro's script handling) that runs a GSAP timeline on page load for the hero elements:

```html
<script>
  import { gsap } from 'gsap';

  function initBlogHero() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const hero = document.querySelector('[data-blog-hero]');
    if (!hero) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('[data-blog-hero-title]', {
      y: 40,
      opacity: 0,
      duration: 0.8,
    })
    .from('[data-blog-hero-subtitle]', {
      y: 30,
      opacity: 0,
      duration: 0.7,
    }, '-=0.5')
    .from('[data-blog-hero-stats]', {
      y: 20,
      opacity: 0,
      duration: 0.6,
    }, '-=0.4');
  }

  document.addEventListener('astro:page-load', initBlogHero);
</script>
```

In the template, add the data attributes to the hero elements:
- Wrapping section or div: `data-blog-hero`
- The h1: `data-blog-hero-title` (REMOVE the existing `data-word-reveal` since this custom timeline replaces it)
- The subtitle p: `data-blog-hero-subtitle` (REMOVE `data-reveal` to avoid double animation)
- The stats p: `data-blog-hero-stats` (REMOVE `data-reveal` to avoid double animation)

Keep `data-reveal` on the tag cloud section and `data-divider-reveal` on dividers — those use the existing scroll-based reveal system and complement the hero timeline.

**Step 3: Add CSS for `data-card-item` reduced motion and `data-blog-hero` elements.**

In `global.css`, add within the existing `@media (prefers-reduced-motion: reduce)` block at the bottom:

```css
[data-blog-hero-title],
[data-blog-hero-subtitle],
[data-blog-hero-stats] {
  opacity: 1 !important;
  transform: none !important;
}
```

The `[data-card-item]` reduced motion handling already exists in `scroll-animations.ts` (line 18-22 sets opacity: 1, transform: none for `[data-card-item]` elements when reduced motion is on).

**Important:** Do NOT add any new npm dependencies. All animation uses the existing GSAP + ScrollTrigger already loaded in Layout.astro.
  </action>
  <verify>
1. Run `npm run build` — no errors
2. Run `npm run dev` and visit http://localhost:4321/blog/
3. Verify hero elements (title, subtitle, stats) animate in sequentially with fade-up on page load
4. Scroll down to verify blog cards animate in with staggered reveal per year group
5. Verify pagination links work and animations replay on each page
6. Test with browser devtools: toggle prefers-reduced-motion in Rendering panel — confirm no animations fire
  </verify>
  <done>
Blog hero section has a sequential fade-up entrance animation (title, then subtitle, then stats). Blog cards within each year group have staggered scroll-triggered entrance animations using the existing card group stagger system. All animations respect prefers-reduced-motion. No new dependencies added.
  </done>
</task>

</tasks>

<verification>
1. `npm run build` completes without errors
2. Static pages generated: /blog/, /blog/2/, /blog/3/, /blog/4/, /blog/5/
3. Each page shows exactly 10 posts (except last page with remainder)
4. Year headers only appear for years with posts on that page
5. Tag cloud shows full tag counts on every page
6. Pagination nav shows correct current page, working prev/next links
7. Page 1 has no "Prev" link, last page has no "Next" link
8. Hero animates on page load with staggered fade-up
9. Blog cards animate on scroll with staggered reveal per year group
10. Animations disabled gracefully under prefers-reduced-motion
</verification>

<success_criteria>
- Blog is paginated at 10 posts/page with clean URL structure (/blog/, /blog/2/, etc.)
- Pagination component matches site design (accent colors, meta-mono font, proper a11y)
- Hero section has polished entrance animation
- Blog cards have staggered scroll-reveal animations
- All animations respect prefers-reduced-motion
- Zero new npm dependencies
- Build passes clean
</success_criteria>
