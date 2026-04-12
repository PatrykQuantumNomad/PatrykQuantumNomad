# Phase 115: Blog Post - Research

**Researched:** 2026-04-12
**Domain:** Astro MDX blog post authoring, SVG cover image creation, OG image generation, blog content cross-linking
**Confidence:** HIGH

## Summary

Phase 115 requires four deliverables: (1) a new MDX blog post announcing the Claude Code Guide refresh, (2) cross-links from that post to all updated guide chapters and the cheatsheet page, (3) an update callout banner injected at the top of the existing "The Context Window Is the Product" blog post linking to the new post, and (4) a branded cover image SVG that feeds the OG image pipeline.

The project has a mature, well-established blog authoring pattern. Blog posts are MDX files in `src/data/blog/`, registered via a Zod-validated content collection. The OG image pipeline at `src/pages/open-graph/[...slug].png.ts` automatically generates OG images for every blog post using satori + sharp, consuming the post's `title`, `description`, `tags`, and optional `coverImage`. No new infrastructure is needed -- every deliverable fits existing patterns exactly.

**Primary recommendation:** Author the new MDX blog post following the exact frontmatter schema and component import patterns of existing companion posts (ai-landscape-explorer.mdx, eda-jupyter-notebooks.mdx), create a new SVG cover image at `public/images/`, add an update `Callout` banner at the top of the existing claude-code-guide.mdx, and register the new post in the `[slug].astro` page's FAQ/JSON-LD section.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BLOG-01 | New blog post covering Claude Code updates (What's New highlights) | Standard MDX blog post in `src/data/blog/` with frontmatter schema documented below. Guide now has 14 chapters (was 11), 3 new chapters (Plugins, Agent SDK, Computer Use), and major rewrites to 5 existing chapters. |
| BLOG-02 | New blog post cross-links to updated guide chapters and cheatsheet | All chapter URLs follow pattern `/guides/claude-code/{slug}/`. Cheatsheet at `/guides/claude-code/cheatsheet/`. All 14 slugs documented in guide.json. |
| BLOG-03 | Old blog post has update callout banner linking to new post | Existing `Callout` component at `src/components/blog/Callout.astro` supports `type="important"` with title. Old post currently has no imports -- needs import + callout added at top of body. Also needs `updatedDate` in frontmatter. |
| BLOG-04 | New blog post has OG image | Two approaches work: (a) SVG cover image in `public/images/` referenced via `coverImage` frontmatter -- rendered inline AND consumed by OG pipeline, or (b) rely solely on the auto-generated OG image from title/description/tags. Existing claude-code-guide.mdx uses approach (a) with a branded SVG. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Tone: professional but approachable, first person, concise, confident
- Avoid walls of text; use scannable sections with clear hierarchy
- SEO: keyword-rich content with naturally incorporated searchable terms
- Backlinks to blogs, projects, and external profiles
- Structured formatting with headings, bold text, and tables for search engine relevance signals

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard | Confidence |
|---------|---------|---------|--------------|------------|
| Astro content collections | (project version) | Blog post content management | All blog posts use `getCollection('blog')` with glob loader from `src/data/blog/` | HIGH [VERIFIED: src/content.config.ts] |
| MDX | (project version) | Blog post format with component imports | All native blog posts are `.mdx` files with Astro component imports | HIGH [VERIFIED: codebase grep] |
| satori + sharp | (project version) | OG image generation | `src/lib/og-image.ts` uses satori for SVG-to-image, sharp for PNG output | HIGH [VERIFIED: src/pages/open-graph/[...slug].png.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Callout component | N/A | Update banner on old post | `type="important"` variant for the update callout | [VERIFIED: src/components/blog/Callout.astro] |
| TldrSummary component | N/A | Summary box at top of new post | Optional but used by several existing posts | [VERIFIED: src/components/blog/TldrSummary.astro] |
| KeyTakeaway component | N/A | Highlighted insight boxes | Optional callout within post body | [VERIFIED: src/components/blog/KeyTakeaway.astro] |
| OpeningStatement component | N/A | Styled opening sentence | Used by best-practices posts for impact | [VERIFIED: src/components/blog/OpeningStatement.astro] |
| BlogPostingJsonLd | N/A | Structured data for the post | Auto-rendered by `[slug].astro` page -- no manual action needed | [VERIFIED: src/pages/blog/[slug].astro] |
| FAQPageJsonLd | N/A | FAQ structured data for SEO | Requires manual addition in `[slug].astro` for new post | [VERIFIED: src/pages/blog/[slug].astro] |

**Installation:**
```bash
# No new dependencies needed. All tools are already installed.
```

## Architecture Patterns

### Blog Post File Structure
```
src/data/blog/
  claude-code-guide.mdx          # Existing post (modify: add callout + updatedDate)
  claude-code-guide-refresh.mdx  # NEW post (create)

public/images/
  claude-code-guide-cover.svg            # Existing cover
  claude-code-guide-refresh-cover.svg    # NEW cover image (create)

src/pages/blog/[slug].astro      # Modify: add FAQ JSON-LD for new post
src/pages/open-graph/[...slug].png.ts  # No changes needed (auto-generates)
```

### Pattern 1: Blog Post Frontmatter Schema
**What:** Every blog post MDX file must have a YAML frontmatter block matching the Zod schema in `src/content.config.ts`.
**When to use:** Every new blog post.
**Example:**
```yaml
# Source: [VERIFIED: src/content.config.ts lines 9-21]
---
title: "Claude Code Guide Refresh: 14 Chapters, 3 New Topics, Updated Cheatsheet"
description: "The Claude Code Guide is now 14 chapters covering Plugins, Agent SDK, Computer Use, plus major rewrites across every existing chapter. Here is what changed and why it matters."
publishedDate: 2026-04-12
tags: ["claude-code", "anthropic", "ai-coding-assistant", "developer-tools", "agentic-workflow", "context-engineering"]
coverImage: "/images/claude-code-guide-refresh-cover.svg"
draft: false
---
```

### Pattern 2: Component Import Convention
**What:** MDX files import Astro components using relative paths from `src/data/blog/` to `src/components/blog/`.
**When to use:** When using blog-specific UI components.
**Example:**
```mdx
// Source: [VERIFIED: src/data/blog/kubernetes-manifest-best-practices.mdx lines 9-12]
import OpeningStatement from '../../components/blog/OpeningStatement.astro';
import TldrSummary from '../../components/blog/TldrSummary.astro';
import KeyTakeaway from '../../components/blog/KeyTakeaway.astro';
import Callout from '../../components/blog/Callout.astro';
```

### Pattern 3: Update Banner on Existing Post
**What:** Add a Callout at the very top of the old post body (after frontmatter and imports) to direct readers to the updated content.
**When to use:** BLOG-03 requirement.
**Example:**
```mdx
// Source: [VERIFIED: Callout component API from src/components/blog/Callout.astro]
import Callout from '../../components/blog/Callout.astro';

<Callout type="important" title="This guide has been updated">

The Claude Code Guide has grown from 11 to 14 chapters with major rewrites across every existing chapter. Read the full update: [Claude Code Guide Refresh: What Changed](/blog/claude-code-guide-refresh/).

</Callout>
```
Additionally, add `updatedDate: 2026-04-12` to the old post's frontmatter so the SEO meta tags reflect the modification date.

### Pattern 4: Cover Image SVG Convention
**What:** Branded SVGs stored in `public/images/` at 1200x690 dimensions, referenced from frontmatter `coverImage` field.
**When to use:** BLOG-04 requirement.
**Details:** The existing `claude-code-guide-cover.svg` is 1200x690, uses a dark background (#0f0f23 / #1a1a2e), amber accent gradient (#D97706 / #F59E0B), and Space Grotesk / Inter font family. The new cover should follow the same visual language but distinguish itself as a "refresh" or "update" post. [VERIFIED: public/images/claude-code-guide-cover.svg]

### Pattern 5: FAQ JSON-LD Registration in [slug].astro
**What:** The `src/pages/blog/[slug].astro` page has a per-post FAQ section that generates FAQPageJsonLd structured data. Each post that needs FAQ schema must be manually registered.
**When to use:** SEO enhancement for the new post.
**Example:**
```typescript
// Source: [VERIFIED: src/pages/blog/[slug].astro lines 40-179]
const isClaudeCodeRefreshPost = post.id === 'claude-code-guide-refresh';

// Add to articleSection mapping:
: isClaudeCodeRefreshPost ? 'AI Developer Tools'

// Add to aboutDataset mapping:
: isClaudeCodeRefreshPost
  ? { type: 'WebPage', name: 'Claude Code Guide', url: 'https://patrykgolabek.dev/guides/claude-code/' }

// Add FAQ array:
const claudeCodeRefreshFAQ = isClaudeCodeRefreshPost ? [
  { question: '...', answer: '...' },
] : [];

// Add to render:
{claudeCodeRefreshFAQ.length > 0 && <FAQPageJsonLd items={claudeCodeRefreshFAQ} />}
```

### Anti-Patterns to Avoid
- **Duplicating OG image endpoint code:** The catch-all `[...slug].png.ts` already handles all blog posts. Do NOT create a separate OG endpoint for this post.
- **Missing cross-links:** The blog post must link to specific chapter URLs, not just the landing page. Use the exact slugs from guide.json.
- **Forgetting updatedDate on old post:** Without `updatedDate`, search engines will not know the old post was modified, and the `article:modified_time` meta tag will not appear.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image generation | Custom image pipeline | Existing `generateOgImage()` in `src/lib/og-image.ts` + `coverImage` frontmatter field | Pipeline already handles all blog posts automatically via `[...slug].png.ts` |
| Update banner UI | Custom banner component | Existing `Callout` component with `type="important"` | Already styled, accessible, responsive, and used across multiple posts |
| Structured data | Manual JSON-LD script tags | Existing `BlogPostingJsonLd` + `FAQPageJsonLd` components | Auto-rendered by `[slug].astro` with proper schema.org markup |
| Related posts | Manual link list | Existing tag-overlap algorithm in `[slug].astro` | Computed automatically from tag overlap |

**Key insight:** This phase is entirely a content authoring task. All infrastructure already exists. The only code changes needed are: (1) new MDX file, (2) edits to existing MDX file, (3) new SVG file, and (4) FAQ registration in `[slug].astro`.

## Common Pitfalls

### Pitfall 1: Blog Post ID Mismatch
**What goes wrong:** The post's `id` in Astro content collections is derived from the filename (without extension). The `[slug].astro` page uses `post.id` for routing, OG image URL generation (`/open-graph/blog/${post.id}.png`), and the FAQ registration checks.
**Why it happens:** Naming the file differently from what's referenced in `[slug].astro` causes 404s on the post URL and broken OG images.
**How to avoid:** Name the file `claude-code-guide-refresh.mdx` and reference it as `'claude-code-guide-refresh'` everywhere in `[slug].astro`.
**Warning signs:** Build errors about missing routes, 404 on `/blog/claude-code-guide-refresh/`.

### Pitfall 2: Stale Chapter Count or URL in Blog Post
**What goes wrong:** The blog post mentions "11 chapters" when the guide now has 14, or links to chapter slugs that don't exist.
**Why it happens:** Copy-pasting from the old blog post without updating numbers and URLs.
**How to avoid:** Use the canonical source: `guide.json` has all 14 chapters with their exact slugs. Cross-reference every link against this file.
**Warning signs:** Broken links, inaccurate chapter count claims.

### Pitfall 3: Missing Callout Import in Old Post
**What goes wrong:** Adding `<Callout>` JSX to the old post without importing the component causes a build error.
**Why it happens:** The old `claude-code-guide.mdx` currently has NO component imports -- it is pure markdown with links. Adding a component requires also adding the import statement.
**How to avoid:** Add `import Callout from '../../components/blog/Callout.astro';` after the frontmatter `---` delimiter and before the first paragraph.
**Warning signs:** Astro build error referencing undefined component.

### Pitfall 4: Cover Image Dimensions
**What goes wrong:** The OG image pipeline in `og-image.ts` resizes cover images to 1088x400 using sharp. SVGs with wrong aspect ratios get distorted or cropped.
**Why it happens:** Creating the SVG at arbitrary dimensions.
**How to avoid:** Match the existing convention: 1200x690 viewBox for the inline display, which sharp resizes down. The `loadCoverImage` function uses `fit: 'contain'` mode.
**Warning signs:** Distorted or cropped OG image when shared on social media.

### Pitfall 5: Forgetting to Tag for Related Post Algorithm
**What goes wrong:** The new post does not appear as a "related post" on the old post's page, and vice versa.
**Why it happens:** The related posts algorithm uses tag overlap. If the new post uses completely different tags, there is no connection.
**How to avoid:** Reuse several tags from the old post: `"claude-code"`, `"anthropic"`, `"ai-coding-assistant"`, `"agentic-workflow"`, `"developer-tools"`.
**Warning signs:** No "Related Articles" section linking the two posts.

## Code Examples

### New Blog Post Frontmatter (Complete)
```yaml
# Source: [VERIFIED: content.config.ts schema + existing post patterns]
---
title: "Claude Code Guide Refresh: 14 Chapters, 3 New Topics, Updated Cheatsheet"
description: "The Claude Code Guide is now 14 chapters covering Plugins, Agent SDK, Computer Use, plus major rewrites across every existing chapter. Here is what changed and why it matters."
publishedDate: 2026-04-12
tags: ["claude-code", "anthropic", "ai-coding-assistant", "developer-tools", "agentic-workflow", "context-engineering"]
coverImage: "/images/claude-code-guide-refresh-cover.svg"
draft: false
---
```

### Old Post Frontmatter Update
```yaml
# Source: [VERIFIED: existing frontmatter in claude-code-guide.mdx]
---
title: "The Context Window Is the Product"
description: "Most developers treat Claude Code as a chat box with tools. The ones who get 10x results treat the context window as a product they design. A practitioner's guide to 11 chapters on mastering Claude Code, from first agentic interaction through multi-agent orchestration."
publishedDate: 2026-03-15
updatedDate: 2026-04-12    # <-- ADD THIS LINE
tags: ["claude-code", "anthropic", "ai-coding-assistant", "context-engineering", "mcp", "agentic-workflow", "developer-tools", "ai-agent"]
coverImage: "/images/claude-code-guide-cover.svg"
draft: false
---
```

### Callout Banner for Old Post (Insert After Frontmatter)
```mdx
# Source: [VERIFIED: Callout component from src/components/blog/Callout.astro]
import Callout from '../../components/blog/Callout.astro';

<Callout type="important" title="This guide has been updated">

The Claude Code Guide has grown from 11 to 14 chapters with major rewrites across every existing chapter. Three new topics cover Plugins, Agent SDK, and Computer Use. Read the full update: [Claude Code Guide Refresh](/blog/claude-code-guide-refresh/).

</Callout>
```

### Guide Chapter URLs (Complete Inventory)
```markdown
<!-- Source: [VERIFIED: guide.json chapters array] -->
/guides/claude-code/introduction/
/guides/claude-code/context-management/
/guides/claude-code/models-and-costs/
/guides/claude-code/environment/
/guides/claude-code/remote-and-headless/
/guides/claude-code/mcp/
/guides/claude-code/custom-skills/
/guides/claude-code/hooks/
/guides/claude-code/worktrees/
/guides/claude-code/agent-teams/
/guides/claude-code/security/
/guides/claude-code/plugins/          <!-- NEW chapter -->
/guides/claude-code/agent-sdk/        <!-- NEW chapter -->
/guides/claude-code/computer-use/     <!-- NEW chapter -->
/guides/claude-code/cheatsheet/       <!-- NEW page -->
```

### FAQ Registration in [slug].astro
```typescript
// Source: [VERIFIED: existing pattern in src/pages/blog/[slug].astro lines 40-179]
const isClaudeCodeRefreshPost = post.id === 'claude-code-guide-refresh';

// In articleSection chain (around line 46):
: isClaudeCodeRefreshPost ? 'AI Developer Tools'

// In aboutDataset chain (around line 53):
: isClaudeCodeRefreshPost
  ? { type: 'WebPage', name: 'Claude Code Guide', url: 'https://patrykgolabek.dev/guides/claude-code/' }

// New FAQ array (before the return JSX):
const claudeCodeRefreshFAQ = isClaudeCodeRefreshPost ? [
  {
    question: 'What is new in the Claude Code Guide refresh?',
    answer: 'The guide grew from 11 to 14 chapters. Three new chapters cover Plugins (marketplace, manifests, bin executables), Agent SDK (Python and TypeScript APIs for embedding Claude Code), and Computer Use (desktop GUI control with per-app approval). Every existing chapter was rewritten with 6+ months of new features including Auto Mode, 1M Opus context, 24 hook events, and remote control server mode.',
  },
  {
    question: 'Where can I find the Claude Code cheatsheet?',
    answer: 'The dedicated cheatsheet page is at patrykgolabek.dev/guides/claude-code/cheatsheet/. It includes both interactive and print-friendly SVG cheatsheets covering every keyboard shortcut, slash command, and mode toggle in Claude Code.',
  },
] : [];

// In the JSX (after existing FAQ renderings):
{claudeCodeRefreshFAQ.length > 0 && <FAQPageJsonLd items={claudeCodeRefreshFAQ} />}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 11-chapter guide | 14-chapter guide | Phase 111-114 (April 2026) | Blog post must reference 14 chapters, not 11 |
| No cheatsheet page | Dedicated cheatsheet page at /guides/claude-code/cheatsheet/ | Phase 114 (April 2026) | Blog post must cross-link to cheatsheet |
| 18 hook events | 24 hook events | Phase 111 | Blog highlights should mention the expanded hook system |
| No Plugins chapter | Plugins chapter | Phase 112 | Blog post covers Plugins as a new topic |
| Claude Code SDK | Agent SDK (renamed) | Phase 112 | Blog post uses the new name "Agent SDK" |
| No Computer Use chapter | Computer Use chapter | Phase 112 | Blog post covers Computer Use as a new topic |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | New blog post filename should be `claude-code-guide-refresh.mdx` | Architecture Patterns | Slug mismatch causes 404s and broken OG images. Low risk -- naming is a convention choice, not a technical constraint. |
| A2 | The new post's title should be "Claude Code Guide Refresh: 14 Chapters, 3 New Topics, Updated Cheatsheet" | Code Examples | SEO impact if title is suboptimal. Low risk -- can be changed freely. |
| A3 | FAQ questions for the new post focus on "what's new" and "cheatsheet location" | Code Examples | Missing SEO opportunity if better questions exist. Low risk -- additional questions can be added. |

## Open Questions

1. **Blog post writing style: chapter-by-chapter or theme-by-theme?**
   - What we know: The original claude-code-guide.mdx walks through each chapter in order (11 sections). The new post could do the same for all 14 chapters, but that would overlap heavily with the original.
   - What's unclear: Whether the user prefers a "What's New" highlights approach (theme-by-theme: new chapters, major rewrites, cheatsheet) or a comprehensive reintroduction of the full guide.
   - Recommendation: Use a "What's New" approach with 3-4 sections: new chapters, major chapter rewrites, cheatsheet, and a link back to the full guide. This avoids duplicating the original post and is more useful for returning readers.

2. **How many FAQ questions to register?**
   - What we know: The existing claude-code-guide post has 6 FAQ questions. Other posts have 3-6.
   - What's unclear: Which questions will drive the most search traffic for the refresh post.
   - Recommendation: Start with 2-3 focused on "what changed" and "where to find the cheatsheet" -- expand later if needed.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). This phase is purely content authoring within the existing Astro project.

## Sources

### Primary (HIGH confidence)
- `src/content.config.ts` -- Blog collection schema (Zod validation rules, all fields)
- `src/pages/blog/[slug].astro` -- Blog post rendering, OG URL construction, FAQ/JSON-LD registration
- `src/pages/open-graph/[...slug].png.ts` -- OG image auto-generation for all blog posts
- `src/lib/og-image.ts` -- Cover image processing (satori + sharp, 1088x400 resize)
- `src/data/blog/claude-code-guide.mdx` -- Existing post (frontmatter, structure, content)
- `src/data/blog/ai-landscape-explorer.mdx` -- Companion blog post pattern (most recent precedent)
- `src/components/blog/Callout.astro` -- Update banner component (type, title props)
- `src/data/guides/claude-code/guide.json` -- All 14 chapter slugs and descriptions
- `public/images/claude-code-guide-cover.svg` -- Existing cover image (dimensions, style reference)

### Secondary (MEDIUM confidence)
- `src/data/blog/kubernetes-manifest-best-practices.mdx` -- Component import pattern reference
- `src/data/blog/eda-jupyter-notebooks.mdx` -- Companion blog post pattern (second precedent)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All patterns verified directly from codebase files
- Architecture: HIGH - File structure, naming conventions, and component APIs confirmed from source
- Pitfalls: HIGH - Each pitfall identified from verified code behavior (OG pipeline, content collection IDs, component imports)

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (30 days -- stable codebase patterns unlikely to change)
