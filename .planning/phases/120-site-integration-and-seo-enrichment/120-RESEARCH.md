# Phase 120: Site Integration and SEO Enrichment - Research

**Researched:** 2026-04-14
**Domain:** Astro blog integration -- JSON-LD structured data, OG image pipeline, LLMs.txt, publish activation
**Confidence:** HIGH

## Summary

This phase wires the completed "Dark Code" blog post into all existing site pipelines: JSON-LD structured data enrichment, FAQ schema injection, OG image verification, LLMs.txt entry, and publish activation (draft flag removal). The critical insight from codebase analysis is that **every integration point already has a working pattern established by prior blog posts** -- this phase is purely additive, following the exact same patterns used for the Beauty Index, Kubernetes, Docker Compose, Dockerfile, GitHub Actions, and Claude Code Guide posts.

The `[slug].astro` file uses a boolean-flag pattern (`isBeautyIndexPost`, `isK8sPost`, etc.) to conditionally inject `articleSection`, `about`, and FAQ data. The Dark Code post needs an identical `isDarkCodePost` boolean with its own `articleSection`, `about` dataset, and FAQ items. The OG image generation is fully automatic via the `[...slug].png.ts` catch-all route that reads from the blog content collection -- no new code is needed there. LLMs.txt requires a manually added blog entry in `src/pages/llms.txt.ts` (blog posts are auto-included from the collection, so nothing to do -- they are already listed dynamically). The only real work is: (1) add the Dark Code boolean + conditional data to `[slug].astro`, (2) set `draft: false` in the MDX frontmatter.

**Primary recommendation:** Follow the established boolean-flag pattern in `[slug].astro` exactly as done for the 7 prior specialized blog posts. No new infrastructure, libraries, or architectural patterns needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTG-01 | OG image auto-generated and verified for social sharing | OG image pipeline is fully automatic via `src/pages/open-graph/[...slug].png.ts`. The catch-all route reads all non-draft, non-external blog posts and generates PNGs using satori + sharp. The dark-code post will be included automatically once `draft: false`. Verification: check `/open-graph/blog/dark-code.png` after build. |
| INTG-02 | JSON-LD BlogPosting schema with articleSection and about fields added to [slug].astro | `BlogPostingJsonLd.astro` already accepts `articleSection` and `about` props. The `[slug].astro` file needs an `isDarkCodePost` boolean and corresponding conditional values. Pattern is identical to the 7 existing specialized posts. |
| INTG-03 | FAQ JSON-LD schema for framework question-answer pairs | `FAQPageJsonLd.astro` accepts `items: { question: string; answer: string }[]`. The Dark Code Spectrum's 5 dimensions naturally map to FAQ question-answer pairs. Pattern is identical to `beautyIndexFAQ`, `k8sFAQ`, etc. |
| INTG-06 | LLMs.txt entry with quality description for AI discoverability | The `llms.txt.ts` endpoint dynamically lists all non-draft blog posts from the collection. Once `draft: false`, the post auto-appears. No manual entry needed for `llms.txt`. For `llms-full.txt`, the same dynamic listing applies. Both endpoints use `getCollection('blog', ({ data }) => !data.draft)`. |
| INTG-08 | Sitemap, RSS feed, and blog listing automatically include the new post | All three pipelines filter on `data.draft !== true` in production. Setting `draft: false` is the single toggle that activates all of them simultaneously. Sitemap uses `@astrojs/sitemap` with `contentDates` map. RSS uses `@astrojs/rss` with the same draft filter. Blog listing page uses `getCollection('blog')` with draft filter. |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Static site generator | Project framework [VERIFIED: package.json] |
| @astrojs/sitemap | ^3.7.0 | Sitemap generation | Already integrated in astro.config.mjs [VERIFIED: package.json] |
| @astrojs/rss | ^4.0.15 | RSS feed generation | Already integrated via src/pages/rss.xml.ts [VERIFIED: package.json] |
| satori | ^0.19.2 | OG image SVG generation | Used by src/lib/og-image.ts [VERIFIED: package.json] |
| sharp | ^0.34.5 | OG image PNG conversion | Used by src/lib/og-image.ts [VERIFIED: package.json] |

### Supporting
No additional libraries needed. All integration work uses existing project infrastructure.

### Alternatives Considered
None. The established patterns are the correct approach.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Existing Blog Post Integration Pattern (the only pattern needed)

The `[slug].astro` file at `src/pages/blog/[slug].astro` uses a consistent pattern for each specialized blog post:

1. **Boolean flag** declared at top of component script:
   ```typescript
   const isDarkCodePost = post.id === 'dark-code';
   ```

2. **articleSection** conditional chain (lines 47-54):
   ```typescript
   const articleSection = isBeautyIndexPost ? 'Programming Languages'
     : isK8sPost ? 'Kubernetes Security'
     // ... existing entries ...
     : isDarkCodePost ? 'Code Quality'
     : undefined;
   ```

3. **about dataset** conditional chain (lines 55-69):
   ```typescript
   const aboutDataset = isBeautyIndexPost
     ? { type: 'Dataset', name: 'The Beauty Index', url: '...' }
     // ... existing entries ...
     : isDarkCodePost
       ? { type: 'Article', name: 'The Dark Code Spectrum', url: 'https://patrykgolabek.dev/blog/dark-code/' }
     : undefined;
   ```

4. **FAQ array** with conditional guard (lines 71-183 pattern):
   ```typescript
   const darkCodeFAQ = isDarkCodePost ? [
     { question: '...', answer: '...' },
     // ...
   ] : [];
   ```

5. **FAQ rendering** in template (lines 270-276 pattern):
   ```typescript
   {darkCodeFAQ.length > 0 && <FAQPageJsonLd items={darkCodeFAQ} />}
   ```

[VERIFIED: src/pages/blog/[slug].astro codebase analysis]

### Draft Activation Pattern

The single toggle for publishing is in the MDX frontmatter:
```yaml
draft: false  # was: draft: true
```

This activates ALL pipelines simultaneously because they all use the same filter:
```typescript
getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? data.draft !== true : true;
});
```

Used in:
- `src/pages/blog/[slug].astro` (getStaticPaths) [VERIFIED: line 10-12]
- `src/pages/blog/[...page].astro` (blog listing) [VERIFIED: line 8-10]
- `src/pages/open-graph/[...slug].png.ts` (OG images) [VERIFIED: line 6-9]
- `src/pages/rss.xml.ts` (RSS feed) [VERIFIED: line 6-8]
- `src/pages/llms.txt.ts` (LLMs.txt) [VERIFIED: line 13]
- `src/pages/llms-full.txt.ts` (LLMs full) [VERIFIED: line 42]

### Anti-Patterns to Avoid
- **Creating a new component or route for the Dark Code post:** All infrastructure exists. Do not create new files beyond editing existing ones.
- **Manually adding the post to RSS/sitemap/LLMs.txt:** These are dynamically generated from the collection. The draft flag toggle is the only action needed.
- **Adding OG image generation specific to dark-code:** The `[...slug].png.ts` catch-all already handles all blog posts automatically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-LD BlogPosting | Custom script tag | `BlogPostingJsonLd.astro` component | Already handles all fields including articleSection and about |
| FAQ structured data | Manual JSON-LD | `FAQPageJsonLd.astro` component | Already validated and used by 7 other posts |
| OG image generation | Custom sharp pipeline | `src/lib/og-image.ts` + `[...slug].png.ts` | Handles font loading, tag rendering, cover image embedding |
| RSS feed entries | Manual XML | `@astrojs/rss` via `rss.xml.ts` | Automatically picks up non-draft posts |
| Sitemap entries | Manual XML | `@astrojs/sitemap` integration | Automatic with lastmod from contentDates map |

**Key insight:** This phase requires ZERO new infrastructure. Every integration point is already built and tested through prior blog posts. The work is purely: add conditional data for the dark-code slug and flip the draft flag.

## Common Pitfalls

### Pitfall 1: Forgetting to add the boolean before the `undefined` fallback
**What goes wrong:** The ternary chain in `[slug].astro` ends with `: undefined`. If you add the `isDarkCodePost` check AFTER the undefined fallback, it will never execute.
**Why it happens:** The ternary chain is long (7+ conditions) and the fallback is easy to miss.
**How to avoid:** Add `isDarkCodePost` checks immediately before the final `: undefined` in each ternary chain.
**Warning signs:** `articleSection` and `about` are undefined in the rendered JSON-LD despite the boolean being true.

### Pitfall 2: OG image cache busting
**What goes wrong:** The OG image URL in `[slug].astro` includes a cache-buster query param `?cb=20260216`. If testing reveals a stale image, the cache buster may need updating.
**Why it happens:** CDN and social media platforms aggressively cache OG images.
**How to avoid:** The existing URL pattern `'/open-graph/blog/' + post.id + '.png?cb=20260216'` is global for all posts. No per-post change needed unless the global cache buster is updated.
**Warning signs:** Social card previews show an outdated or wrong image.

### Pitfall 3: FAQ answers that are too long for Google rich results
**What goes wrong:** Google truncates FAQ rich results at approximately 320 characters per answer. Longer answers still work structurally but won't display fully in SERPs.
**Why it happens:** Over-explaining in FAQ answers.
**How to avoid:** Keep each FAQ answer under 300 characters for optimal SERP display. Existing posts (e.g., Beauty Index) have longer answers, so this is a soft guideline, not a hard rule.
**Warning signs:** FAQ rich results in Google Search Console show truncated text.

### Pitfall 4: Sitemap lastmod not reflecting Dark Code post date
**What goes wrong:** The `contentDates` map in `astro.config.mjs` parses dates from frontmatter at config load time. It reads the publishedDate from the raw file using regex.
**Why it happens:** The regex `DATE_RE` in `astro.config.mjs` extracts dates from frontmatter. It looks for `publishedDate: 2026-04-14` format.
**How to avoid:** Ensure the frontmatter date format matches the expected pattern. The current `publishedDate: 2026-04-14` in dark-code.mdx matches perfectly. [VERIFIED: astro.config.mjs lines 21-44]
**Warning signs:** Sitemap entry for `/blog/dark-code/` has no `<lastmod>` tag.

### Pitfall 5: Schema.org type mismatch for 'about' field
**What goes wrong:** Using the wrong `@type` in the `about` object leads to invalid structured data.
**Why it happens:** The Dark Code post is an opinion/framework article, not a tool or dataset. Prior posts use `Dataset`, `SoftwareApplication`, or `WebPage`.
**How to avoid:** Use `@type: "Article"` or `@type: "Thing"` with `name: "The Dark Code Spectrum"`. The Dark Code Spectrum is a conceptual framework, not a web page or tool. `CreativeWork` is the most semantically accurate Schema.org type for an original framework/methodology.
**Warning signs:** Google Rich Results Test shows validation warnings for the `about` field.

## Code Examples

### Example 1: Adding isDarkCodePost to [slug].astro

```typescript
// Source: Codebase pattern from src/pages/blog/[slug].astro
// Add after line 46 (isClaudeCodeRefreshPost declaration):
const isDarkCodePost = post.id === 'dark-code';

// Extend articleSection chain (before the final : undefined):
: isDarkCodePost ? 'Code Quality'

// Extend aboutDataset chain (before the final : undefined):
: isDarkCodePost
  ? { type: 'CreativeWork', name: 'The Dark Code Spectrum', url: 'https://patrykgolabek.dev/blog/dark-code/' }
```

### Example 2: Dark Code FAQ array

```typescript
// Source: Pattern from existing FAQ arrays in [slug].astro
const darkCodeFAQ = isDarkCodePost ? [
  {
    question: 'What is dark code?',
    answer: 'Dark code is code executing in production that no one on the current team understands, no one owns, and no one can safely change. It passes CI, ships to users, and silently accumulates risk until it fails.',
  },
  {
    question: 'What is the Dark Code Spectrum?',
    answer: 'The Dark Code Spectrum is a 5-dimension diagnostic framework for measuring invisible codebase decay: Clone Density, Ownership Vacuum, Comprehension Decay, Refactoring Deficit, and Vulnerability Surface.',
  },
  {
    question: 'How do AI coding assistants accelerate dark code?',
    answer: 'AI assistants increase code output without proportional increases in comprehension or ownership. Studies show a 4x increase in code clones, refactoring collapsing from 25% to under 10%, and AI-assisted developers scoring 17% lower on code comprehension.',
  },
  {
    question: 'How do you measure dark code in a codebase?',
    answer: 'Measure each Dark Code Spectrum dimension: clone-to-unique ratio for Clone Density, files with no active committer for Ownership Vacuum, comprehension assessments for Comprehension Decay, refactoring-to-new-code ratio for Refactoring Deficit, and vulnerability density per KLOC for Vulnerability Surface.',
  },
  {
    question: 'Can dark code be prevented?',
    answer: 'Dark code cannot be eliminated but can be managed through deliberate illumination: mandatory comprehension reviews, ownership registries with accountable maintainers, enforced refactoring budgets, and continuous vulnerability scanning with ownership-aware triage.',
  },
] : [];
```

### Example 3: FAQ rendering in template

```astro
{/* Add after the existing FAQ conditionals (line 276): */}
{darkCodeFAQ.length > 0 && <FAQPageJsonLd items={darkCodeFAQ} />}
```

### Example 4: Draft flag toggle

```yaml
# src/data/blog/dark-code.mdx frontmatter
# Change from:
draft: true
# To:
draft: false
```

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | OG image generates for dark-code slug | smoke (build) | `npx astro build && test -f dist/open-graph/blog/dark-code.png` | N/A -- build verification |
| INTG-02 | JSON-LD BlogPosting has articleSection and about for dark-code | manual-only | Inspect rendered HTML for JSON-LD script tag | N/A -- template logic |
| INTG-03 | FAQ JSON-LD present on dark-code page | manual-only | Inspect rendered HTML for FAQPage JSON-LD | N/A -- template logic |
| INTG-06 | LLMs.txt includes dark-code entry | smoke (build) | `npx astro build && grep -q 'dark-code' dist/llms.txt` | N/A -- build verification |
| INTG-08 | Sitemap, RSS, blog listing include dark-code | smoke (build) | `npx astro build && grep -q 'dark-code' dist/sitemap-0.xml && grep -q 'dark-code' dist/rss.xml` | N/A -- build verification |

### Sampling Rate
- **Per task commit:** `npx astro build` (ensures clean build)
- **Per wave merge:** Full build + grep verification of dist artifacts
- **Phase gate:** All build verification checks pass

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements via build verification. No new test files needed since the changes are purely additive data (boolean flag, FAQ array, frontmatter toggle) following established patterns.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual OG images | Auto-generated via satori + sharp | Already in place | No manual image creation needed |
| Hand-crafted JSON-LD | Reusable Astro components | Already in place | Type-safe, consistent structured data |
| Manual sitemap/RSS | Astro integrations with draft filtering | Already in place | Single draft flag controls all pipelines |

**Deprecated/outdated:**
- Nothing deprecated relevant to this phase. All patterns are current and actively used.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `CreativeWork` is the best Schema.org type for the Dark Code Spectrum `about` field | Code Examples | Low -- any valid Schema.org type works; `Thing` is the safe fallback |
| A2 | FAQ answers under 300 chars display optimally in Google rich results | Common Pitfalls | Low -- longer answers still valid, just may be truncated in SERPs |
| A3 | `articleSection: 'Code Quality'` is the best category for SEO | Code Examples | Low -- alternatives like 'Software Engineering' or 'Technical Debt' are equally valid |

## Open Questions (RESOLVED)

1. **Should the Dark Code post have a `dark-code` CSS class like `isBeautyIndexPost` has?**
   - What we know: The Beauty Index post uses a `dark-code` class (confusingly named -- it's for dark-themed code blocks, not the Dark Code concept) on the prose container.
   - What's unclear: Whether the Dark Code blog post needs dark-themed Expressive Code blocks.
   - RESOLVED: Skip — the Dark Code post has no code samples requiring dark-themed Expressive Code blocks. The cover image is already dark-themed SVG.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). All changes are code/config edits to existing files using already-installed dependencies.

## Security Domain

Not applicable to this phase. The changes involve adding structured data (JSON-LD) and toggling a draft flag -- no authentication, input handling, cryptography, or access control involved.

## Sources

### Primary (HIGH confidence)
- `src/pages/blog/[slug].astro` -- Full codebase analysis of existing boolean-flag pattern for 7 blog posts
- `src/components/BlogPostingJsonLd.astro` -- Props interface showing articleSection and about support
- `src/components/FAQPageJsonLd.astro` -- Props interface showing items array structure
- `src/pages/open-graph/[...slug].png.ts` -- OG image catch-all route with draft filtering
- `src/pages/rss.xml.ts` -- RSS feed with draft filtering
- `src/pages/llms.txt.ts` -- LLMs.txt with dynamic blog post listing
- `src/pages/llms-full.txt.ts` -- LLMs full with dynamic blog post listing
- `astro.config.mjs` -- Sitemap integration with contentDates map
- `src/content.config.ts` -- Blog collection schema with draft field
- `src/data/blog/dark-code.mdx` -- Current frontmatter with `draft: true`
- `package.json` -- Verified dependency versions (astro ^5.3.0, sharp ^0.34.5, satori ^0.19.2, @astrojs/sitemap ^3.7.0, @astrojs/rss ^4.0.15)

### Secondary (MEDIUM confidence)
- Schema.org BlogPosting specification for articleSection and about field types [ASSUMED based on training knowledge]

### Tertiary (LOW confidence)
- Google FAQ rich results 320-character truncation guideline [ASSUMED -- approximate figure from training data]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies verified in package.json, all patterns verified in codebase
- Architecture: HIGH -- 7 prior implementations of the exact same pattern exist in the codebase
- Pitfalls: HIGH -- pitfalls are derived from direct codebase analysis, not external sources

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable -- no moving parts, all patterns are internal to this codebase)
