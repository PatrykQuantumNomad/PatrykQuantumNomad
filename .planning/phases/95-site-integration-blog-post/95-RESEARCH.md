# Phase 95: Site Integration & Blog Post - Research

**Researched:** 2026-03-10
**Domain:** Astro site integration, SEO structured data, companion blog post content
**Confidence:** HIGH

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | Header navigation link for Claude Code guide | Header.astro navLinks array documented; requires adding one entry |
| SITE-02 | Homepage callout card linking to the Claude Code guide | FastAPI callout card pattern on homepage documented; Claude Code card follows identical structure with amber accent |
| SITE-03 | /guides/ hub page updated to show both FastAPI and Claude Code guides | ALREADY COMPLETE -- Phase 90 built the hub page with both guides |
| SITE-04 | All Claude Code guide pages included in sitemap | ALREADY COMPLETE -- dynamic sitemap builder from Phase 90 iterates all guide directories; verified 12 URLs in dist/sitemap-0.xml |
| SITE-05 | LLMs.txt and LLMs-full.txt updated with Claude Code guide entries | ALREADY COMPLETE -- Phase 90 added Claude Code sections to both endpoints; verified 13 entries in each |
| SITE-06 | JSON-LD structured data (TechArticle + BreadcrumbList) on all guide pages | ALREADY COMPLETE -- GuideLayout includes GuideJsonLd (TechArticle) + BreadcrumbJsonLd; landing page includes both explicitly |
| SITE-07 | Build-time OG images for landing page and all 11 chapter pages (12 total) | ALREADY COMPLETE -- claude-code.png.ts and claude-code/[slug].png.ts exist from Phase 90 |
| SITE-08 | Companion blog post with bidirectional cross-links to guide chapters | Blog post pattern documented from FastAPI reference; companionLink prop mechanism in GuideLayout documented |

</phase_requirements>

## Summary

Phase 95 is primarily a verification and completion phase. Codebase analysis reveals that 5 of 8 SITE-* requirements are already satisfied by the Phase 90 infrastructure refactoring: the /guides/ hub page (SITE-03), sitemap inclusion (SITE-04), LLMs.txt entries (SITE-05), JSON-LD structured data (SITE-06), and OG image generators (SITE-07) are all already in place and verified in the build output. The remaining work is: adding a Claude Code link to the header navigation (SITE-01), adding a homepage callout card (SITE-02), and writing the companion blog post with bidirectional cross-links (SITE-08).

The header navigation change is a one-line addition to the `navLinks` array in `Header.astro`. The homepage callout card follows the identical pattern used by the FastAPI Production Guide card already on the homepage -- a bordered card with accent-colored gradient, description, chapter count, and call-to-action link. The companion blog post is the most substantial piece of new work: an MDX file with cross-links to all 11 chapters, targeting long-tail Claude Code workflow keywords, plus updating the Claude Code chapter template to include a `companionLink` prop pointing back to the blog post.

The blog post should follow the FastAPI companion post pattern (`fastapi-production-guide.mdx`): a high-level overview that introduces each chapter with a brief summary and a direct link, positioning the guide as a comprehensive resource for readers who found the post through search. The FastAPI post is 2,500+ words with cross-links to every chapter, a "How to Use This Guide" section, and an original thesis ("chassis" concept). The Claude Code companion post should similarly provide original perspective beyond a simple chapter summary.

**Primary recommendation:** Split this phase into two plans: (1) site integration verification and the three remaining UI changes (header, homepage, companionLink wiring), and (2) the companion blog post content. The blog post is the only piece requiring substantial content creation.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.3+ | Static site framework, content collections, MDX | Already in use; all integration points are Astro components and pages |
| TypeScript | 5.9+ | Type safety | Already in use |
| Tailwind CSS | 3.4+ | Utility-first styling for homepage card and header link | Already in use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Satori + Sharp | 0.19+ / 0.34+ | Build-time OG image generation for blog post | Already in use; blog OG images generated via `generateOgImage()` in `[...slug].png.ts` |
| reading-time | 1.5+ | Reading time for blog post | Already configured as remark plugin; auto-injected into MDX frontmatter |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate header nav link for Claude Code | Keep only the /guides/ link | User requirement SITE-01 explicitly says "header navigation link for Claude Code guide" |
| Inline blog post content | External blog post linking to a separate platform | Native MDX blog post enables full SEO control, JSON-LD, and bidirectional cross-links |

**Installation:**
```bash
# No new dependencies needed -- all libraries already installed
```

## Architecture Patterns

### Files to Create

```
src/
+-- data/
|   +-- blog/
|       +-- claude-code-guide.mdx            # NEW: companion blog post
+-- pages/
    +-- (no new page files -- blog post uses existing [slug].astro template)
```

### Files to Modify

```
src/
+-- components/
|   +-- Header.astro                          # MODIFY: add Claude Code nav link
+-- pages/
    +-- index.astro                           # MODIFY: add Claude Code callout card
    +-- guides/
        +-- claude-code/
            +-- [slug].astro                  # MODIFY: add companionLink prop
```

### Pattern 1: Header Navigation Link Addition

**What:** Add a "Claude Code" entry to the `navLinks` array in `Header.astro`.
**When to use:** SITE-01 requirement.
**Example:**
```typescript
// Source: direct codebase analysis of src/components/Header.astro
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/beauty-index/', label: 'Beauty Index' },
  { href: '/db-compass/', label: 'DB Compass' },
  { href: '/eda/', label: 'EDA' },
  { href: '/guides/', label: 'Guides' },
  { href: '/guides/claude-code/', label: 'Claude Code' },  // NEW
  { href: '/tools/', label: 'Tools' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
```

**Note on nav link placement:** The Claude Code link is placed immediately after "Guides" to create a logical grouping. The header already handles `isActive` matching via `currentPath.startsWith(link.href)`, so visiting any Claude Code guide page will highlight the "Claude Code" nav link. However, this also means the "Guides" link will simultaneously show as active (since `/guides/claude-code/` starts with `/guides/`). The existing FastAPI guide pages already have this behavior and it works fine -- the more specific link gets `aria-current="page"`.

**Alternative approach:** Instead of a separate nav link, the "Guides" link could become a dropdown. However, this would require significant UI changes (dropdown component, mobile menu adjustments) and is out of scope for this phase. The simpler approach of a direct link is consistent with how other sections (Beauty Index, DB Compass, EDA) each have their own nav entry.

### Pattern 2: Homepage Callout Card

**What:** Add a Claude Code guide callout card to the "Reference Guides" section on the homepage, matching the existing FastAPI card pattern.
**When to use:** SITE-02 requirement.
**Example:**
```astro
<!-- Source: derived from existing FastAPI card in src/pages/index.astro lines 227-248 -->
<a href="/guides/claude-code/" class="block card-hover rounded-lg border border-[var(--color-border)] no-underline overflow-hidden" data-reveal data-tilt>
  <article>
    <div class="bg-gradient-to-br from-[#D97706]/8 to-[#D97706]/3 px-6 pt-6 pb-4 flex flex-col items-center justify-center min-h-[148px] gap-2 relative overflow-hidden">
      <div class="absolute inset-4 border border-dashed border-[#D97706]/20 rounded-lg" aria-hidden="true">
        <div class="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-[#D97706]/40"></div>
        <div class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D97706]/40"></div>
        <div class="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#D97706]/40"></div>
        <div class="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-[#D97706]/40"></div>
      </div>
      <h3 class="relative z-10 text-2xl font-heading font-bold text-[#D97706]">
        Claude Code Guide
      </h3>
      <span class="relative z-10 font-mono text-[10px] tracking-[0.35em] text-[#D97706]/60 uppercase select-none">Zero to Hero</span>
    </div>
    <div class="p-6 pt-4">
      <p class="meta-mono text-[var(--color-accent)]">Mastery Guide</p>
      <h3 class="text-lg font-heading font-bold text-[var(--color-text-primary)] mt-2">Claude Code Guide</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mt-2">
        11 chapters from first agentic interaction through multi-agent orchestration. Skills, hooks, MCP, worktrees, and enterprise security.
      </p>
      <span class="inline-block mt-4 text-sm font-medium text-[var(--color-accent)]">Read the guide &rarr;</span>
    </div>
  </article>
</a>
```

**Note:** The design uses the guide title text as the hero visual (matching the hub page pattern from Phase 90), not a logo image, because Claude Code does not have a logo asset. The amber accent (#D97706) is stored in guide.json and used throughout. The "Reference Guides" grid is currently `lg:grid-cols-3` but contains only 4 items (Beauty Index, DB Compass, EDA, FastAPI). Adding a 5th item means the grid should be adjusted -- either keep 3 columns (items wrap naturally: 3+2 rows) or switch to 2 columns for a cleaner 2+3 or 3+2 layout.

### Pattern 3: CompanionLink Integration

**What:** Add the `companionLink` prop to the Claude Code `[slug].astro` chapter template, pointing to the companion blog post.
**When to use:** After the blog post exists (SITE-08).
**Example:**
```astro
<!-- Source: existing FastAPI [slug].astro lines 35-39 -->
<GuideLayout
  ...
  companionLink={{
    href: "/blog/claude-code-guide/",
    text: "Claude Code Guide: From First Prompt to Multi-Agent Orchestration",
    label: "For a high-level overview of all 11 chapters, read the companion blog post: "
  }}
>
```

### Pattern 4: Blog Post MDX Frontmatter

**What:** The companion blog post follows the existing blog schema defined in `content.config.ts`.
**When to use:** SITE-08.
**Example:**
```yaml
---
title: "Claude Code: From First Prompt to Multi-Agent Orchestration"
description: "A practitioner's guide to Claude Code covering 11 chapters on setup, context management, models, MCP, custom skills, hooks, worktrees, agent teams, and enterprise security. Why treating your AI assistant as a junior developer unlocks a 10x workflow."
publishedDate: 2026-03-15
tags: ["claude-code", "ai-agent", "developer-tools", "productivity", "llm"]
coverImage: "/images/claude-code-guide-cover.svg"
draft: false
---
```

**Blog post content structure (derived from FastAPI companion post pattern):**
1. Opening thesis/hook (problem statement about AI coding assistants)
2. Per-chapter summaries with direct links (11 sections, each with `[Read the full chapter](/guides/claude-code/{slug}/)`  cross-link)
3. "How to Use This Guide" section with recommended reading paths
4. Original perspective/thesis (equivalent to FastAPI's "chassis" concept)
5. Closing with links back to the guide landing page

**SEO keyword targets** (long-tail workflow keywords per success criteria):
- "claude code tutorial"
- "claude code setup guide"
- "claude code skills hooks"
- "claude code mcp configuration"
- "claude code agent teams"
- "claude code worktrees"
- "claude code enterprise security"
- "ai coding assistant workflow"
- "claude code vs cursor" (out of scope per REQUIREMENTS.md, but "claude code workflow" captures intent)

### Pattern 5: Blog Post Cover Image

**What:** An SVG cover image for the blog post at `/public/images/claude-code-guide-cover.svg`.
**When to use:** Blog post frontmatter references it via `coverImage`.

The FastAPI blog post uses `/images/fastapi-production-guide-cover.svg`. The Claude Code post needs an equivalent. This should be a simple, clean SVG -- not a complex diagram. It serves as the blog post header image and appears in the article view.

**Recommendation:** Create a minimal SVG that shows the guide title with the amber accent color. Keep it simple -- the OG image generator already creates a more detailed image for social sharing.

### Anti-Patterns to Avoid

- **Adding Claude Code to the "Latest Writing" section on the homepage:** The blog post will appear automatically via the `getCollection('blog')` query if its `publishedDate` is recent enough. Do not hardcode it.
- **Duplicating guide metadata in the blog post:** Reference the guide.json metadata via collection queries where possible. The blog post title and description should be unique (not copy-pasted from guide.json).
- **Creating a separate blog OG image generator:** Blog OG images already use the generic `generateOgImage()` function via `[...slug].png.ts`. No new OG image route is needed for the blog post.
- **Modifying LLMs.txt, sitemap, or JSON-LD generators:** These are already handled by Phase 90 infrastructure. The blog post will automatically appear in LLMs.txt and sitemap because it uses the `blog` collection. The blog post page template already includes `BlogPostingJsonLd` and `BreadcrumbJsonLd`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blog post OG image | Custom OG image route | Existing `[...slug].png.ts` with `generateOgImage()` | Blog posts auto-generate OG images from the existing route |
| Blog post JSON-LD | Custom JSON-LD component | Existing `BlogPostingJsonLd.astro` in `[slug].astro` template | Already renders BlogPosting schema for every native blog post |
| Blog post breadcrumbs | Custom breadcrumb component | Existing `BreadcrumbJsonLd.astro` in `[slug].astro` template | Already renders breadcrumb schema for every blog post |
| Related posts section | Manual related post list | Existing tag-overlap algorithm in `[slug].astro` | Related posts computed automatically from tag intersection |
| Sitemap entry for blog post | Manual sitemap entry | `@astrojs/sitemap` integration | Blog posts auto-appear in sitemap via Astro page generation |
| Reading time display | Manual word count | `reading-time` remark plugin | Auto-injected into blog post frontmatter |

**Key insight:** The blog infrastructure is mature and fully automated. Creating a new MDX file in `src/data/blog/` is the only action needed -- all OG images, JSON-LD, sitemap entries, reading time, related posts, and tag pages are generated automatically by existing infrastructure.

## Common Pitfalls

### Pitfall 1: Header Navigation Overflow on Mobile

**What goes wrong:** Adding a "Claude Code" link brings the navLinks array to 11 items. On tablet-width viewports (md breakpoint), the desktop nav may overflow or wrap awkwardly.
**Why it happens:** The header uses `hidden md:flex` with `gap-6` for desktop nav links. 11 links at `gap-6` may exceed available width on narrower md screens.
**How to avoid:** Test at exactly 768px (md breakpoint). If links wrap, reduce `gap-6` to `gap-4` or abbreviate the label to "Claude Code" (already short). The mobile menu handles all links gracefully via vertical stacking.
**Warning signs:** Nav links wrapping to two lines on 768-1024px viewports. Links overlapping the logo.

### Pitfall 2: Homepage Grid Layout with 5 Cards

**What goes wrong:** The "Reference Guides" section uses `lg:grid-cols-3`. Adding a 5th card (Claude Code) creates an unbalanced layout: 3 cards on the first row, 2 cards on the second row with an empty gap.
**Why it happens:** 5 items in a 3-column grid creates a 3+2 layout. The last row has whitespace on the right.
**How to avoid:** Accept the 3+2 layout (it looks fine) or switch to `lg:grid-cols-2` for a 2+2+1 layout. The 3+2 layout is actually preferable because the top row shows the three original reference content items (Beauty Index, DB Compass, EDA) and the bottom row shows the two guides (FastAPI, Claude Code), creating a natural content grouping.
**Warning signs:** Cards on the second row stretch to fill the remaining space. Uneven visual weight.

### Pitfall 3: Blog Post Date Mismatch with Guide Published Date

**What goes wrong:** The blog post `publishedDate` and the guide.json `publishedDate` are different values, causing inconsistent dates across the sitemap, JSON-LD, and OG images.
**Why it happens:** The guide.json uses `2026-03-15` as its published date. The blog post may use a different date if published on a different day.
**How to avoid:** Use the same date (2026-03-15) for both the blog post and the guide. Or use today's actual date for the blog post and accept they differ (this is fine -- they are different pieces of content).
**Warning signs:** Google Search Console showing different dates for the guide pages and the blog post.

### Pitfall 4: CompanionLink Blog Post Slug Mismatch

**What goes wrong:** The `companionLink.href` in `[slug].astro` points to `/blog/claude-code-guide/` but the actual blog post file is named `claude-code-guide.mdx` (which generates the slug `claude-code-guide`). If the file is named differently, the link breaks.
**Why it happens:** Astro blog slugs are derived from the filename (without `.mdx` extension). The companion link uses a hardcoded path.
**How to avoid:** Ensure the blog post filename matches the expected slug. The file `src/data/blog/claude-code-guide.mdx` produces the URL `/blog/claude-code-guide/`. Verify after creation.
**Warning signs:** 404 when clicking the companion link on chapter pages.

### Pitfall 5: Missing Cover Image SVG

**What goes wrong:** The blog post frontmatter references `coverImage: "/images/claude-code-guide-cover.svg"` but the file does not exist in `public/images/`.
**Why it happens:** The cover image must be manually created and placed in `public/images/`. It is not auto-generated.
**How to avoid:** Create the SVG before or alongside the blog post. Verify by loading the image URL directly in the browser.
**Warning signs:** Blog post renders with a broken image. Build does not fail (coverImage is optional in the template).

### Pitfall 6: Forgetting to Verify Already-Complete Requirements

**What goes wrong:** Spending time re-implementing SITE-03 through SITE-07 when they are already complete. Or worse, modifying already-working code and introducing regressions.
**Why it happens:** The requirements list shows all 8 as pending. Without codebase analysis, all appear to need implementation.
**How to avoid:** This research has verified that SITE-03, SITE-04, SITE-05, SITE-06, and SITE-07 are already complete. The planner should include verification tasks (build + check output) but NOT implementation tasks for these requirements.
**Warning signs:** Modifying llms.txt.ts, sitemap config, GuideJsonLd, or OG image generators when they already work correctly.

## Code Examples

Verified patterns from the existing codebase:

### FastAPI Companion Blog Post Cross-Link Pattern

```markdown
<!-- Source: src/data/blog/fastapi-production-guide.mdx -->
## Builder Pattern

The guide starts with the architectural foundation. The Builder Pattern chapter explains...

[Read the full Builder Pattern chapter](/guides/fastapi-production/builder-pattern/)
```

Each chapter gets a 3-5 sentence summary followed by a direct link. The blog post covers all chapters in order with individual sections.

### CompanionLink in FastAPI Chapter Template

```astro
<!-- Source: src/pages/guides/fastapi-production/[slug].astro lines 35-39 -->
<GuideLayout
  ...
  companionLink={{
    href: "/blog/fastapi-production-guide/",
    text: "FastAPI Production Guide: What Your AI Agent Inherits",
    label: "For a high-level overview of all 13 production concerns, read the companion blog post: "
  }}
>
```

The `companionLink` prop is optional. When provided, GuideLayout renders it as a border-top aside below the article content.

### Blog Post BlogPostingJsonLd

```astro
<!-- Source: src/pages/blog/[slug].astro lines 212-223 -->
<BlogPostingJsonLd
  title={title}
  description={description}
  publishedDate={publishedDate}
  updatedDate={post.data.updatedDate}
  url={postURL}
  tags={tags}
  image={ogImageURL}
  articleSection={articleSection}
  wordCount={wordCount}
  about={aboutDataset}
/>
```

The blog post page template auto-includes BlogPosting JSON-LD. The `articleSection` and `about` props are optional and used for tool-specific blog posts. The Claude Code post could use `articleSection: "AI Developer Tools"` and `about: { type: "SoftwareApplication", name: "Claude Code Guide", url: "https://patrykgolabek.dev/guides/claude-code/" }`.

### Existing Blog Post Tag Structure

```yaml
# Source: src/data/blog/fastapi-production-guide.mdx frontmatter
tags: ["fastapi", "python", "production", "kubernetes", "docker", "ai-agent", "devops"]
```

The Claude Code blog post should use tags that enable cross-referencing with existing posts. The "ai-agent" tag is shared with several existing posts and will enable related-post linking. Additional unique tags like "claude-code" and "developer-tools" target new audiences.

## Already-Complete Requirements Verification

These requirements were verified against the build output and source code:

| Req | Status | Evidence |
|-----|--------|----------|
| SITE-03 | DONE | `src/pages/guides/index.astro` renders both FastAPI and Claude Code guide cards with per-guide accent colors |
| SITE-04 | DONE | `dist/sitemap-0.xml` contains 12 claude-code URLs (landing + 11 chapters); dynamic sitemap builder in `astro.config.mjs` iterates all `src/data/guides/*/guide.json` |
| SITE-05 | DONE | `dist/llms.txt` and `dist/llms-full.txt` each contain 13 claude-code references; both endpoints query `claudeCodeGuide` and `claudeCodePages` collections |
| SITE-06 | DONE | `GuideLayout.astro` includes `GuideJsonLd` (TechArticle with isPartOf) + `BreadcrumbJsonLd` for all chapter pages; landing page includes both explicitly with parentTitle="Claude Code Guide" |
| SITE-07 | DONE | `src/pages/open-graph/guides/claude-code.png.ts` (landing) and `src/pages/open-graph/guides/claude-code/[slug].png.ts` (chapters) both exist and use `generateGuideOgImage()` with og-cache |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single guide in site (FastAPI only) | Multi-guide with per-guide collections | Phase 90 (v1.16) | All integration points already generalized |
| Hardcoded companion link in GuideLayout | Prop-driven optional companionLink | Phase 90 (v1.16) | Claude Code chapters can add link after blog post exists |
| Manual guide entries in LLMs.txt | Dynamic iteration over guide collections | Phase 90 (v1.16) | New guides auto-appear in LLMs.txt |
| Manual sitemap dates for guide pages | Dynamic guide.json iteration in astro.config.mjs | Phase 90 (v1.16) | New guides auto-appear in sitemap with correct dates |

## Open Questions

1. **Header nav link: "Claude Code" vs dropdown under "Guides"**
   - What we know: The requirement says "Header navigation link for Claude Code guide." Currently 10 nav links exist.
   - What's unclear: Whether adding an 11th link causes layout issues on medium viewports.
   - Recommendation: Add a direct "Claude Code" link after "Guides" in the navLinks array. This is the simplest approach and matches the pattern where each major section has its own nav entry. Test at 768px viewport width. If it wraps, reduce gap from `gap-6` to `gap-4`.

2. **Blog post original thesis / unique angle**
   - What we know: The FastAPI companion post includes an original "chassis" concept that goes beyond chapter summaries. The Claude Code post should similarly include original perspective.
   - What's unclear: What unique angle to take. Options include: (a) "10 lessons from teaching myself Claude Code" practitioner reflection, (b) "Why context management is the hidden skill of AI-assisted development" focused thesis, (c) "The agentic loop changes how you think about code" philosophical angle.
   - Recommendation: The planner should define the blog post's unique thesis during planning. The post should NOT be a dry chapter summary -- it needs a narrative hook that stands alone as a valuable blog post even for readers who never open the guide.

3. **Homepage grid layout with 5 cards**
   - What we know: The "Reference Guides" section has 4 cards in `lg:grid-cols-3`. Adding Claude Code makes 5.
   - What's unclear: Whether 3+2 layout is acceptable or needs adjustment.
   - Recommendation: Keep `lg:grid-cols-3`. The 3+2 layout naturally groups: top row = reference content (Beauty Index, DB Compass, EDA), bottom row = guides (FastAPI, Claude Code). This creates a visual hierarchy.

4. **Blog post cover image design**
   - What we know: FastAPI post uses `/images/fastapi-production-guide-cover.svg`. A cover image is optional but improves visual appeal.
   - What's unclear: What the SVG should look like.
   - Recommendation: Create a minimal SVG with the guide title "Claude Code Guide" in the amber accent color (#D97706), similar typography to the OG image but formatted for the blog post width (1200x630). Keep it simple -- a text-based design with subtle decorative elements.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0+ |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx astro build` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | Header has Claude Code nav link | smoke | `npx astro build && grep 'claude-code' dist/index.html` | No - manual |
| SITE-02 | Homepage has Claude Code callout card | smoke | `npx astro build && grep 'Claude Code' dist/index.html` | No - manual |
| SITE-03 | Hub page lists both guides | smoke | `npx astro build && grep -c 'card-hover' dist/guides/index.html` | No - already done, verify only |
| SITE-04 | 12 Claude Code URLs in sitemap | smoke | `grep -c 'claude-code' dist/sitemap-0.xml` (expect 12) | No - already done, verify only |
| SITE-05 | Claude Code in LLMs.txt | smoke | `grep -c 'claude-code' dist/llms.txt` (expect 13+) | No - already done, verify only |
| SITE-06 | TechArticle JSON-LD on chapter pages | smoke | `grep 'TechArticle' dist/guides/claude-code/introduction/index.html` | No - already done, verify only |
| SITE-07 | OG images generated | smoke | `test -f dist/open-graph/guides/claude-code.png` | No - already done, verify only |
| SITE-08 | Blog post exists with chapter links | smoke | `npx astro build && test -f dist/blog/claude-code-guide/index.html && grep -c '/guides/claude-code/' dist/blog/claude-code-guide/index.html` (expect 11+) | No - Wave 0 |

### Sampling Rate

- **Per task commit:** `npx astro build` (verifies all pages generate without errors)
- **Per wave merge:** Full build + grep verification of all 8 SITE-* requirements
- **Phase gate:** All 8 SITE-* requirements verified in build output

### Wave 0 Gaps

None -- existing test infrastructure covers all phase requirements via build verification. No new test files needed. All verification is done through build output inspection.

## Sources

### Primary (HIGH confidence -- direct codebase analysis)

- `src/components/Header.astro` -- navLinks array, 10 current entries, isActive matching logic
- `src/pages/index.astro` -- Homepage layout, "Reference Guides" grid with 4 cards, FastAPI card pattern
- `src/pages/guides/index.astro` -- Hub page already showing both guides (SITE-03 verified done)
- `src/pages/guides/claude-code/[slug].astro` -- Chapter template, no companionLink yet
- `src/pages/guides/claude-code/index.astro` -- Landing page with GuideJsonLd + BreadcrumbJsonLd
- `src/layouts/GuideLayout.astro` -- companionLink prop interface, TechArticle + Breadcrumb JSON-LD
- `src/pages/guides/fastapi-production/[slug].astro` -- Reference implementation of companionLink
- `src/data/blog/fastapi-production-guide.mdx` -- Reference companion blog post (structure, tone, cross-links)
- `src/pages/blog/[slug].astro` -- Blog post template with BlogPostingJsonLd, BreadcrumbJsonLd, related posts
- `src/pages/llms.txt.ts` -- Claude Code section already present (SITE-05 verified done)
- `src/pages/llms-full.txt.ts` -- Claude Code section already present (SITE-05 verified done)
- `src/pages/open-graph/guides/claude-code.png.ts` -- Landing OG image (SITE-07 verified done)
- `src/pages/open-graph/guides/claude-code/[slug].png.ts` -- Chapter OG images (SITE-07 verified done)
- `src/pages/open-graph/[...slug].png.ts` -- Blog OG image generator (auto-handles new blog posts)
- `src/data/guides/claude-code/guide.json` -- Guide metadata, 11 chapters, amber accent #D97706
- `src/content.config.ts` -- Blog collection schema (title, description, publishedDate, tags, coverImage, draft)
- `astro.config.mjs` -- Sitemap builder already iterates all guide directories (SITE-04 verified done)
- `dist/sitemap-0.xml` -- Verified 12 claude-code URLs in build output
- `dist/llms.txt` -- Verified 13 claude-code entries in build output

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries; all existing tools verified in codebase
- Architecture: HIGH -- all patterns directly derived from existing FastAPI reference implementation
- Pitfalls: HIGH -- verified against actual codebase layout and build output
- Already-complete requirements: HIGH -- verified against dist/ build output with grep counts

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable infrastructure; no dependency changes expected)
