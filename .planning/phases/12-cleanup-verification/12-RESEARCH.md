# Phase 12: Cleanup & Verification - Research

**Researched:** 2026-02-12
**Domain:** Astro static site build verification, generated output validation, stale content removal
**Confidence:** HIGH

## Summary

Phase 12 is the final verification and cleanup phase for v1.1. The primary tasks are: (1) delete the draft placeholder blog post, (2) fix a bug in `llms.txt.ts` where external blog posts link to non-existent internal paths, (3) fix the homepage "Latest Writing" section which links external posts to internal 404 paths, and (4) verify all generated outputs (sitemap, RSS, OG images) reflect the v1.1 content changes accurately.

Research was conducted by running `astro build`, `astro check`, and inspecting all generated outputs (sitemap, RSS, LLMs.txt, OG images) against the actual content. Two previously undetected bugs were found in the LLMs.txt and homepage "Latest Writing" sections -- both link external blog posts to internal `/blog/ext-*/` paths that do not exist in the build output.

**Primary recommendation:** Delete `draft-placeholder.md`, fix `llms.txt.ts` to use `externalUrl` for external posts, fix `index.astro` to use `externalUrl` for external posts in "Latest Writing", then run a full build and verify all outputs.

## Identified Issues

### Issue 1: Draft Placeholder File Still Exists (CLEAN-01)

**File:** `src/data/blog/draft-placeholder.md`
**Status:** Exists with `draft: true` -- excluded from production builds but still present in source
**Impact:** Does not appear in production build output (RSS, sitemap, blog listing all filter `draft !== true`). However, it DOES appear in dev mode and its mere existence is a cleanup target.
**Action:** Delete the file entirely.
**Confidence:** HIGH -- verified by reading the file and checking all build filters.

### Issue 2: LLMs.txt Links External Posts to Non-Existent Internal Paths (BUG)

**File:** `src/pages/llms.txt.ts`
**Status:** Line 19 hardcodes `https://patrykgolabek.dev/blog/${p.id}/` for ALL posts
**Impact:** External blog posts (10 of them) link to `/blog/ext-*/` paths that are 404 pages. These internal paths are never generated because `[slug].astro` and `[...slug].png.ts` both exclude external posts via `!data.externalUrl` guard.
**Current output example (WRONG):**
```
- [Ollama Kubernetes Deployment](https://patrykgolabek.dev/blog/ext-ollama-kubernetes-deployment/): ...
```
**Expected output:**
```
- [Ollama Kubernetes Deployment](https://mykubert.com/blog/ollama-kubernetes-deployment-cost-effective-and-secure/): ...
```
**Fix:** Use same nullish coalescing pattern as RSS feed: `p.data.externalUrl ?? \`https://patrykgolabek.dev/blog/${p.id}/\``
**Confidence:** HIGH -- verified by reading generated `dist/llms.txt` and confirming the 10 broken links match the 10 `ext-*.md` files.

### Issue 3: Homepage "Latest Writing" Links External Posts to Internal 404 Paths (BUG)

**File:** `src/pages/index.astro`
**Status:** Line 122 hardcodes `href={/blog/${post.id}/}` for ALL posts in the "Latest Writing" section
**Impact:** The 3 most recent posts are:
  1. `building-kubernetes-observability-stack` (2026-02-11) -- LOCAL, OK
  2. `ext-apache-airflow-data-pipeline` (2025-03-22) -- EXTERNAL, links to 404
  3. `ext-kubernetes-cloud-costs` (2025-03-20) -- EXTERNAL, links to 404

Two of the three "Latest Writing" cards on the homepage link to pages that do not exist.
**Fix:** Use same conditional pattern as BlogCard.astro: `post.data.externalUrl ?? /blog/${post.id}/` and add `target="_blank" rel="noopener noreferrer"` for external posts. Alternatively, consider filtering to only show non-external posts, or using BlogCard component.
**Confidence:** HIGH -- verified by inspecting the build output and confirming no `/blog/ext-*/` pages exist in `dist/`.

### Issue 4: Build Verification (CLEAN-02)

**Current state:** `astro build` completes with zero errors. 19 pages generated in 1.33s.
**After cleanup:** Must re-verify after deleting `draft-placeholder.md` and fixing the two bugs.
**Pages generated (current):**
- 1 static page: index, about, blog/index, contact, projects/index (5)
- 1 blog detail: building-kubernetes-observability-stack (1)
- 13 tag pages: ai, cloud-native, data-engineering, devops, kubernetes, llm, observability, ollama, open-source, platform-engineering, python, security, terraform
- 3 API routes: llms.txt, rss.xml, open-graph/blog/building-kubernetes-observability-stack.png
- **Total: 19 pages + sitemap**
**Confidence:** HIGH -- ran actual build and inspected output.

### Issue 5: Sitemap Accuracy (CLEAN-03, partial)

**File:** `dist/sitemap-0.xml`
**Status:** Contains 19 URLs. All are valid generated pages.
**URLs listed:**
- `/` (homepage)
- `/about/`
- `/blog/`
- `/blog/building-kubernetes-observability-stack/`
- 13 tag pages (`/blog/tags/{tag}/`)
- `/contact/`
- `/projects/`

**No removed pages present.** No `/blog/ext-*/` pages in sitemap (correct -- they are not generated).
**No draft pages present.** Draft placeholder has `draft: true` and is excluded from build.
**After deleting draft-placeholder.md:** Tag pages may change if the draft had unique tags. Current draft tags are `["ai", "langgraph", "llm-agents"]`. In PROD build, drafts are excluded, so the tag pages are not affected by draft content. But `langgraph` and `llm-agents` tags from the draft never appear in production. After deletion, the dev-mode tag list changes but production is unaffected.
**Confidence:** HIGH -- verified by reading generated sitemap XML.

### Issue 6: RSS Feed Accuracy (CLEAN-03, partial)

**File:** `dist/rss.xml`
**Status:** Contains 11 items. All links are correct.
- Local post: links to `https://patrykgolabek.dev/blog/building-kubernetes-observability-stack/`
- External posts: link to their canonical external URLs (mykubert.com, translucentcomputing.com)
- Draft placeholder: excluded (correct -- `data.draft !== true` filter)
- Chronological order: most recent first (2026-02-11 down to 2019-05-11)
**No issues found.** RSS feed is already correct.
**Confidence:** HIGH -- verified by reading generated RSS XML.

### Issue 7: OG Images Accuracy (CLEAN-03, partial)

**File:** `dist/open-graph/blog/building-kubernetes-observability-stack.png`
**Status:** Only 1 OG image generated -- for the only local, non-draft blog post. Correct.
**No external post OG images generated** (correct -- `!data.externalUrl` guard in `[...slug].png.ts`).
**Confidence:** HIGH -- verified by listing dist/open-graph directory.

### Issue 8: Type Check Pre-existing Error (NOT v1.1 related)

**File:** `src/pages/open-graph/[...slug].png.ts` line 30
**Error:** `ts(2345)` -- Buffer type not assignable to BodyInit. This is a TypeScript strictness issue with sharp's Buffer output and the Response constructor. The code works correctly at runtime.
**Impact:** `astro check` exits with error code 1.
**Recommendation:** This is a pre-existing issue from v1.0, not introduced by v1.1. Phase 12 should document it but NOT fix it (out of scope for CLEAN-01/02/03). If the planner wants to address it, a simple `as unknown as BodyInit` cast or `Uint8Array.from(png)` conversion would resolve it.
**Confidence:** HIGH -- verified by running `astro check`.

## Architecture Patterns

### Pattern 1: External URL Handling Across the Codebase

The codebase has an established pattern for handling external vs internal blog posts. Here is the consistency audit:

| File | Handles externalUrl? | Pattern | Status |
|------|---------------------|---------|--------|
| `src/components/BlogCard.astro` | YES | `isExternal ? externalUrl : /blog/${post.id}/` | CORRECT |
| `src/pages/rss.xml.ts` | YES | `post.data.externalUrl ?? /blog/${post.id}/` | CORRECT |
| `src/pages/blog/[slug].astro` | YES | `!data.externalUrl` guard in getStaticPaths | CORRECT |
| `src/pages/open-graph/[...slug].png.ts` | YES | `!data.externalUrl` guard in getStaticPaths | CORRECT |
| `src/pages/llms.txt.ts` | **NO** | Hardcodes internal path for all posts | **BUG** |
| `src/pages/index.astro` (Latest Writing) | **NO** | Hardcodes `/blog/${post.id}/` for all posts | **BUG** |

**Pattern to use:** The nullish coalescing pattern from `rss.xml.ts` is the cleanest: `post.data.externalUrl ?? /blog/${post.id}/`

### Pattern 2: Draft Filtering Across the Codebase

| File | Filters drafts? | Pattern | Status |
|------|-----------------|---------|--------|
| `src/pages/blog/index.astro` | YES | `import.meta.env.PROD ? data.draft !== true : true` | CORRECT |
| `src/pages/blog/[slug].astro` | YES | Same pattern + `!data.externalUrl` | CORRECT |
| `src/pages/blog/tags/[tag].astro` | YES | Same pattern | CORRECT |
| `src/pages/rss.xml.ts` | YES | Same pattern | CORRECT |
| `src/pages/index.astro` | YES | Same pattern | CORRECT |
| `src/pages/llms.txt.ts` | YES | `!data.draft` (simpler, always excludes drafts) | CORRECT |
| `src/pages/open-graph/[...slug].png.ts` | YES | Same env-conditional pattern + `!data.externalUrl` | CORRECT |

All draft filtering is correct. After deleting the draft file, these filters become redundant for the deleted file, but they remain correct for future draft posts.

### Pattern 3: Build Verification Approach

Based on prior phase verification patterns (Phase 9, 11), the established verification approach is:

1. **Source inspection:** Read the source files and confirm logic
2. **Build execution:** Run `astro build` and check for zero errors
3. **Output inspection:** Read generated files in `dist/` to confirm correctness
4. **Count verification:** Count pages, items, URLs to ensure completeness
5. **Negative verification:** Confirm that removed/excluded content does NOT appear

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Broken link detection | Custom link checker script | `astro build` zero-error completion + manual dist/ inspection | Astro already validates internal references during static generation; if a page references a non-existent route, the build fails or generates a broken link that's visible in output |
| Sitemap generation | Custom sitemap builder | `@astrojs/sitemap` integration (already configured) | Automatically generates sitemap from all generated static pages |
| RSS generation | Custom RSS builder | `@astrojs/rss` (already configured) | Already handles all RSS complexity |

## Common Pitfalls

### Pitfall 1: Forgetting to update ALL consumers of blog collection

**What goes wrong:** A new field (like `externalUrl`) gets added to the schema and some consumers get updated but others don't. This is exactly what happened -- `BlogCard.astro` and `rss.xml.ts` handle `externalUrl` correctly, but `llms.txt.ts` and `index.astro` "Latest Writing" were missed.
**Why it happens:** No centralized "blog link resolver" function exists. Each consumer independently computes the href.
**How to avoid:** After fixing, consider extracting a shared helper: `getBlogPostUrl(post)` that returns the correct URL for any blog post. This is optional but prevents future regressions.
**Warning signs:** Any file that uses `post.id` to construct a blog URL without checking `externalUrl` first.

### Pitfall 2: Assuming draft filtering means file can stay

**What goes wrong:** The draft file is excluded from production builds, so it seems harmless. But it adds noise in dev mode, shows up in git, and confuses future maintainers.
**How to avoid:** Clean up source files when content decisions are final.

### Pitfall 3: Type errors that work at runtime

**What goes wrong:** `astro check` reports errors (like the Buffer/BodyInit mismatch in og-image) but the build succeeds and the code works. This can mask real type errors introduced by future changes.
**How to avoid:** Acknowledge the pre-existing error and decide on a threshold. Phase 12 should verify that no NEW type errors were introduced by v1.1 changes.

## Code Examples

### Fix for llms.txt.ts (Issue 2)

```typescript
// Source: Current rss.xml.ts pattern (line 23)
// Before (BROKEN):
...sortedPosts.map(
  (p) =>
    `- [${p.data.title}](https://patrykgolabek.dev/blog/${p.id}/): ${p.data.description}`
),

// After (FIXED):
...sortedPosts.map(
  (p) =>
    `- [${p.data.title}](${p.data.externalUrl ?? `https://patrykgolabek.dev/blog/${p.id}/`}): ${p.data.description}`
),
```

### Fix for index.astro Latest Writing (Issue 3)

Two approaches:

**Approach A: Add external URL handling (consistent with BlogCard pattern)**
```astro
{latestPosts.map((post) => {
  const isExternal = !!post.data.externalUrl;
  const href = isExternal ? post.data.externalUrl : `/blog/${post.id}/`;
  return (
    <article class="p-6 rounded-lg border ...">
      <a
        href={href}
        class="text-lg font-heading font-bold ..."
        {...isExternal && { target: "_blank", rel: "noopener noreferrer" }}
      >
        {post.data.title}
      </a>
      ...
    </article>
  );
})}
```

**Approach B: Filter to only non-external posts for homepage**
```typescript
const latestPosts = posts
  .filter((p) => !p.data.externalUrl)
  .sort((a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf())
  .slice(0, 3);
```

**Recommendation:** Approach A. The homepage should show the most recent writing regardless of source -- that is the whole point of the external blog integration. Filtering them out would undermine Phase 9's work.

### Delete draft-placeholder.md

```bash
rm src/data/blog/draft-placeholder.md
```

## Verification Checklist

After all fixes are applied, the following must be verified:

### CLEAN-01: Draft placeholder deleted
- [ ] `src/data/blog/draft-placeholder.md` does not exist
- [ ] No references to "draft-placeholder" in any source file (already confirmed: none exist)
- [ ] Build output does not contain any draft content

### CLEAN-02: Build succeeds with no broken internal links
- [ ] `astro build` completes with zero errors
- [ ] Page count matches expected (19 pages, same as current since draft was already excluded from prod)
- [ ] No new type errors introduced (pre-existing OG image Buffer error is acceptable)

### CLEAN-03: Generated outputs reflect v1.1 changes
- [ ] **Sitemap:** 19 URLs, all valid pages, no removed pages, includes tag pages
- [ ] **RSS feed:** 11 items, correct links (external = external URL, local = internal URL), chronological order
- [ ] **LLMs.txt:** All blog post links resolve to real pages (external posts use external URLs)
- [ ] **OG images:** Only generated for local non-draft posts (currently 1)
- [ ] **Homepage "Latest Writing":** Links point to correct destinations (external posts use external URLs)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `draft-placeholder.md` with `draft: true` | Delete stale content files entirely | Phase 12 (now) | Cleaner repo, no confusion |
| Hardcoded internal paths in llms.txt | Nullish coalescing with externalUrl | Phase 12 (now) | LLMs.txt links actually work |
| Hardcoded internal paths in Latest Writing | Conditional external URL handling | Phase 12 (now) | Homepage links don't 404 |

## Open Questions

1. **Should a shared `getBlogPostUrl(post)` helper be extracted?**
   - What we know: 4 files compute blog post URLs independently. Two had bugs.
   - What's unclear: Is the overhead of a shared helper worth it for 4 call sites?
   - Recommendation: Optional. The planner may include it as a sub-task. A simple one-liner in `src/lib/` would prevent future regressions: `export const getBlogPostUrl = (post) => post.data.externalUrl ?? \`/blog/${post.id}/\`;`

2. **Should the pre-existing `astro check` Buffer type error be fixed?**
   - What we know: It is a TypeScript strictness issue, not a runtime bug. Pre-dates v1.1.
   - Recommendation: Out of scope for Phase 12. Note it in verification as "pre-existing, not a blocker."

3. **Homepage "Latest Writing" -- should external posts show a source badge?**
   - What we know: BlogCard.astro shows source badges and external link icons. The homepage "Latest Writing" section uses inline rendering, not BlogCard.
   - Recommendation: At minimum, fix the href. Adding source badge/icon to match BlogCard is a nice-to-have but not required by CLEAN-01/02/03.

## Sources

### Primary (HIGH confidence)
- Direct file reads of all source files in `src/pages/`, `src/components/`, `src/data/`
- Actual `astro build` output (zero errors, 19 pages, 1.33s)
- Actual `astro check` output (1 pre-existing error, 4 hints)
- Generated `dist/sitemap-0.xml` (19 URLs)
- Generated `dist/rss.xml` (11 items)
- Generated `dist/llms.txt` (22 lines, 10 broken external links identified)
- Build log showing exact pages generated

### Secondary (MEDIUM confidence)
- [@astrojs/sitemap documentation](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- confirms sitemap auto-generates from built pages

## Metadata

**Confidence breakdown:**
- Identified issues: HIGH -- all verified by reading source code AND inspecting actual build output
- Fix patterns: HIGH -- using patterns already established in the codebase (BlogCard, RSS)
- Verification checklist: HIGH -- based on prior phase verification patterns (Phase 9, 11)

**Research date:** 2026-02-12
**Valid until:** No expiration -- this is project-specific analysis, not library version research
