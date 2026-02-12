---
phase: quick-002
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/blog/index.astro
autonomous: true

must_haves:
  truths:
    - "Blog listing page has a visually engaging hero section with title, subtitle, and total post count"
    - "Posts are grouped by year with visible year headings, most recent year first"
    - "A tag cloud at the top links to existing /blog/tags/[tag]/ pages for quick filtering"
    - "All 41 posts remain visible on the page (no hiding behind JS tabs/filters)"
    - "Existing animation patterns (data-reveal, data-word-reveal) are used for entrance effects"
  artifacts:
    - path: "src/pages/blog/index.astro"
      provides: "Enhanced blog listing with hero, tag cloud, and year-grouped posts"
      contains: "data-word-reveal"
  key_links:
    - from: "src/pages/blog/index.astro tag cloud links"
      to: "/blog/tags/[tag]/"
      via: "anchor href"
      pattern: "href=.*/blog/tags/"
---

<objective>
Enhance the blog listing page (`src/pages/blog/index.astro`) from a plain flat list into a visually rich, well-organized page with a mini hero section, tag cloud for quick access, and posts grouped by year.

Purpose: The current blog page is the weakest visual link in the site — a bare "Blog" heading and flat chronological dump of 41 posts. This enhancement brings it in line with the polished homepage while making content more discoverable.

Output: Updated `src/pages/blog/index.astro` with hero section, tag cloud, and year-grouped post listing.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/pages/blog/index.astro
@src/components/BlogCard.astro
@src/pages/index.astro
@src/pages/blog/tags/[tag].astro
@src/styles/global.css
@src/data/site.ts
@src/content.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add hero section, tag cloud, and year-grouped post listing</name>
  <files>src/pages/blog/index.astro</files>
  <action>
Rewrite `src/pages/blog/index.astro` while keeping the same Layout, BlogCard imports, and collection query. The page should have three visual sections:

**1. Mini Hero Section (top of page)**

- Use `max-w-4xl mx-auto` container consistent with current page.
- Large heading: "Blog" using `text-4xl sm:text-5xl font-heading font-extrabold` with `data-word-reveal` attribute.
- Subtitle line below: "Technical writing on cloud-native architecture, AI/ML engineering, and platform building." in `text-lg text-[var(--color-text-secondary)]` with `data-reveal`.
- Stats line below subtitle showing total post count and year span. Use `meta-mono` class. Example: "41 ARTICLES · 2012 — 2026". Compute these dynamically from the posts collection. Use `data-reveal`.
- Add a `gradient-divider` below the hero section (`<div class="gradient-divider" data-divider-reveal aria-hidden="true"></div>`).

**2. Tag Cloud Section**

- Heading: "Browse by Topic" — use `text-lg font-heading font-bold mb-4` with `data-reveal`.
- Collect all unique tags from posts. Count occurrences of each tag. Sort tags by count descending (most popular first).
- Render as a flex-wrap row of pill links. Each pill links to `/blog/tags/${tag}/` and shows the tag name plus count in parentheses.
- Pill styling: use the existing tag pill pattern from BlogCard — `text-xs px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors`. Add `font-medium` for weight.
- The count number should be slightly dimmer: wrap it in a span with `opacity-60`.
- Apply `data-reveal` to the container div.
- Add a `gradient-divider` below the tag cloud section.

**3. Year-Grouped Post Listing**

- Group `sortedPosts` by year (extract from `publishedDate.getFullYear()`).
- Iterate over years in descending order (most recent first).
- For each year group, render:
  - A year heading: `<h2 class="text-2xl font-heading font-bold text-[var(--color-accent)] mb-6 mt-12 first:mt-0" data-reveal>{year}</h2>` — but use a flex row with the year on the left and post count badge on the right: `<span class="meta-mono text-sm">{count} posts</span>`.
  - A `space-y-6` container with each post rendered as `<div data-reveal><BlogCard post={post} /></div>` (same as before but with `space-y-6` instead of `space-y-8` for tighter grouping within a year).

**Frontmatter data processing (in the `---` block):**

```typescript
// After sortedPosts is computed, add:

// Tag cloud data
const tagCounts = new Map<string, number>();
sortedPosts.forEach((post) => {
  post.data.tags.forEach((tag) => {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });
});
const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

// Year groups
const postsByYear = new Map<number, typeof sortedPosts>();
sortedPosts.forEach((post) => {
  const year = post.data.publishedDate.getFullYear();
  if (!postsByYear.has(year)) postsByYear.set(year, []);
  postsByYear.get(year)!.push(post);
});
const years = [...postsByYear.keys()].sort((a, b) => b - a);

// Stats
const totalPosts = sortedPosts.length;
const oldestYear = Math.min(...years);
const newestYear = Math.max(...years);
```

**Keep the empty state** (`sortedPosts.length === 0`) fallback with the existing "No posts yet" message.

Do NOT add ParticleCanvas — the constraints explicitly say "lighter than homepage hero, no particle canvas needed."

Do NOT add any new npm dependencies.

Do NOT modify BlogCard.astro — it works fine as-is.
  </action>
  <verify>
Run `npm run build` to verify the page compiles without errors. Then run `npm run dev` and visually confirm at `http://localhost:4321/blog/` that:
1. Hero section shows with "Blog" heading, subtitle, and dynamic post count
2. Tag cloud appears with clickable pills linking to `/blog/tags/{tag}/`
3. Posts are grouped under year headings in descending order
4. All posts are visible (no posts hidden)
5. Gradient dividers separate sections
6. `data-reveal` and `data-word-reveal` attributes are present for animations
  </verify>
  <done>
Blog listing page at `/blog/` displays: (1) a mini hero with title, subtitle, and "{N} ARTICLES · {oldest} — {newest}" stats line, (2) a tag cloud with all tags sorted by frequency linking to existing tag pages, (3) posts grouped by year with year headings showing post count, (4) all existing posts remain visible, (5) existing animation attributes applied throughout.
  </done>
</task>

</tasks>

<verification>
- `npm run build` succeeds with no errors
- Page renders at `/blog/` with all three sections (hero, tag cloud, year groups)
- Tag cloud links navigate to correct `/blog/tags/{tag}/` pages
- Post count in hero matches actual number of posts
- Year groups are in descending order (newest first)
- No new dependencies added
- BlogCard.astro unchanged
</verification>

<success_criteria>
The blog listing page is visually upgraded from a plain flat list to an organized, polished page with hero section, tag cloud navigation, and year-grouped posts — all using existing design system patterns and animation attributes.
</success_criteria>

<output>
After completion, create `.planning/quick/002-enhance-blog-listing-page/002-SUMMARY.md`
</output>
