# Pitfalls Research

**Domain:** Updating an existing 11-chapter Claude Code guide (4,032 lines MDX, 5 SVG diagrams, 2 React Flow visualizers) on an Astro 5 portfolio site with 1160+ pages. Adding cheatsheet page, updating chapters with new features, writing a new blog post.
**Researched:** 2026-04-12
**Confidence:** HIGH (grounded in direct analysis of the existing guide codebase, cross-reference graph, content collection configuration, SVG rendering patterns, and OG image pipeline)

## Critical Pitfalls

### Pitfall 1: Cross-Reference Rot When Updating Chapters Selectively

**What goes wrong:**
The 11 existing chapters contain 30+ bidirectional cross-references (verified by grep). For example, `introduction.mdx` links to `models-and-costs` three times and `context-management` twice. `security.mdx` references five other chapters. `hooks.mdx` references `custom-skills` twice. When a chapter is updated and its section structure changes (headings renamed, sections moved, content reorganized), every inbound link from other chapters becomes a potential broken anchor. Worse, the companion blog post `claude-code-guide.mdx` links to every chapter URL and summarizes each chapter's content in its own prose. If a chapter's title or scope changes but the blog post is not updated, the blog post becomes inaccurate even though its links still resolve.

The existing cross-reference graph has three layers:
1. **Chapter-to-chapter links** (30+ links across 11 MDX files) -- these use relative paths like `/guides/claude-code/models-and-costs/`
2. **Blog post-to-chapter links** (11 links in `claude-code-guide.mdx`) -- each chapter gets a summary paragraph and a "Read the full X chapter" link
3. **Chapter-to-blog-post link** (rendered via `companionLink` prop in `[slug].astro`) -- "For a high-level overview of all 11 chapters, read the companion blog post"

Adding a new chapter or renaming a chapter slug would break all three layers simultaneously.

**Why it happens:**
When updating individual chapters, the natural workflow is: open the chapter, update its content, move on. There is no automated mechanism to detect that chapter A references content in chapter B that has been restructured. Astro does not validate internal markdown links at build time by default. The build succeeds silently even with broken anchor links.

**How to avoid:**
1. Before updating any chapter, grep all MDX files for references to that chapter's slug: `grep -r "/guides/claude-code/SLUG" src/data/`. This reveals every file that links to the chapter being modified.
2. If adding a new chapter, also search for "next chapter" or "up next" references in adjacent chapters that will need updating.
3. If a chapter's heading structure changes (e.g., "Permission Evaluation" renamed to "How Permissions Work"), grep for any anchor links pointing to the old heading slug.
4. After all chapter updates are complete, update the companion blog post's chapter summaries to match the new content.
5. Consider installing `astro-broken-links-checker` integration for build-time link validation -- it catches dead internal links before deploy.
6. Create a cross-reference audit step as part of the final phase: run a full-site link check against the build output.

**Warning signs:**
- Updating a chapter without checking what links TO it
- Chapter's scope or title changes but adjacent "up next" links still point to old title text
- Blog post summaries describe features that have been moved to a different chapter
- Anchor links (`#section-name`) survive a heading rename but now 404 within the page

**Phase to address:**
Every content update phase must include a cross-reference check step. The FINAL phase must include a complete link audit across all 11 chapters + blog post + landing page.

---

### Pitfall 2: Stale `lastVerified` Dates Creating False Freshness Signals

**What goes wrong:**
All 11 chapters currently have `lastVerified: 2026-03-10` in their frontmatter. When some chapters are updated in v1.19 but others are not, the untouched chapters still display "Last verified: March 10, 2026" -- which will be over a month old by the time v1.19 ships. If a reader checks the verified date on a chapter that was NOT updated, they correctly conclude the content might be stale. But if the chapter that WAS updated also keeps the old `lastVerified` date because the author forgot to bump it, the entire verification system is undermined.

Worse: the `lastVerified` field was specifically added to address content staleness (identified as the #1 pitfall in the original research). If verification dates are not accurately maintained during updates, the field exists but provides no value.

**Why it happens:**
The `lastVerified` field is an optional date in the `guidePageSchema`. Nothing in the build pipeline validates that `lastVerified` is recent or has been bumped when `updatedDate` changes. A chapter can have `updatedDate: 2026-04-15` and `lastVerified: 2026-03-10` with no build error. The inconsistency is invisible unless someone manually checks frontmatter.

**How to avoid:**
1. When updating a chapter's content, always bump both `updatedDate` and `lastVerified` to the current date.
2. For chapters NOT being updated in v1.19, explicitly re-verify their content against current Claude Code docs and bump `lastVerified` if the content is still accurate. If it is not accurate, update the content.
3. As a phase-end check: grep all MDX files for `lastVerified` and ensure no date is older than the milestone's content authoring window.
4. Consider adding a build-time warning (via a remark plugin or Astro integration) that flags chapters where `lastVerified` is more than 90 days old. This is a future improvement, not a v1.19 requirement.

**Warning signs:**
- Some chapters have April 2026 `lastVerified`, others still show March 2026
- `updatedDate` is more recent than `lastVerified` on the same chapter
- Claude Code features mentioned in a chapter have been renamed or deprecated since the `lastVerified` date

**Phase to address:**
Every content update phase. The verification date is the simplest thing to forget and the most important signal for reader trust.

---

### Pitfall 3: Cheatsheet SVG Rendering -- External Font Loading and Theme Blindness

**What goes wrong:**
The existing cheatsheet SVGs (`public/images/cheatsheet/claude-code-cheatsheet.svg` and its print variant) are 56KB/495-line files that use `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono...')` for font loading. This creates three distinct rendering problems:

1. **Font loading failure in `<img>` tags:** If the cheatsheet is rendered via an HTML `<img>` tag or Astro's `<Image>` component, browsers will NOT load the external CSS import inside the SVG. The SVG renders with fallback system fonts, producing a visually broken layout where text overflows boxes, columns misalign, and the cheatsheet looks unprofessional. This is a well-documented browser security restriction -- SVGs loaded as images are sandboxed from network requests.

2. **No dark mode support:** The existing cheatsheet SVGs use hardcoded colors (verified by the `<style>` block in the SVG header). Unlike the guide's build-time diagram generators (which use `DIAGRAM_PALETTE` CSS variables), the cheatsheet SVGs cannot respond to the site's dark/light theme toggle. On a dark-themed site, a light-background cheatsheet creates a jarring visual discontinuity.

3. **Print variant divergence:** Having two separate SVG files (`claude-code-cheatsheet.svg` and `claude-code-cheatsheet-print.svg`) means content updates must be applied to BOTH files. If a Claude Code feature is added to one but not the other, the print version diverges.

**Why it happens:**
The cheatsheet SVGs appear to be designed as standalone visual assets (possibly exported from a design tool like Boxy SVG based on the `xmlns:bx` namespace), not integrated into the build-time SVG generation pipeline used by the 5 existing guide diagrams. The guide diagrams use `diagram-base.ts` which generates SVGs with CSS variable colors that respond to the theme -- the cheatsheet SVGs bypass this infrastructure entirely.

**How to avoid:**
1. Render the cheatsheet as **inline SVG** on the page, not via `<img>` tag. Inline SVG loads external fonts correctly and can use CSS variables for theming. At 56KB, the cheatsheet is within the inline threshold (under 100KB is acceptable per SVG best practices).
2. Replace hardcoded colors in the SVG with CSS variables from the site's theme system (e.g., `var(--color-text-primary)`, `var(--color-surface)`, `var(--color-border)`). This gives automatic dark/light mode support.
3. For the downloadable/printable version, generate a static PNG or PDF at build time using the same SVG content but with baked-in colors. This eliminates the dual-SVG maintenance problem -- one source SVG, multiple output formats.
4. Alternatively, preload the Google Fonts in the page's `<head>` so the fonts are cached before the inline SVG renders. This is simpler than converting font references.
5. If the SVG must remain as an `<img>` source (e.g., for download), self-host the fonts and embed them as base64 `@font-face` declarations inside the SVG. This eliminates the external dependency.

**Warning signs:**
- Cheatsheet renders with monospace fallback font instead of JetBrains Mono on the page
- Light-colored cheatsheet on dark-themed page (no theme adaptation)
- Print cheatsheet content does not match web cheatsheet content
- Page load triggers a CORS or network request for Google Fonts from within an SVG

**Phase to address:**
Cheatsheet page phase. This must be resolved during the cheatsheet page implementation, not deferred. The rendering approach (inline vs img) determines the entire component architecture.

---

### Pitfall 4: Guide Metadata Drift Between guide.json, Landing Page, Blog Post, and LLMs.txt

**What goes wrong:**
The guide's metadata is duplicated across four locations:
1. `guide.json` -- chapter count (11), descriptions, title
2. `index.astro` landing page -- hero text, "zero-to-hero guide"
3. `claude-code-guide.mdx` blog post -- "11 chapters", per-chapter summaries
4. `llms.txt` and `llms-full.txt` -- guide description, chapter listing

If v1.19 adds a new chapter (e.g., a dedicated cheatsheet chapter or a "What's New" chapter), the chapter count and descriptions must be updated in ALL four locations. If the blog post says "11 chapters" but guide.json now lists 12, or if llms-full.txt still describes the old chapter set, the inconsistency undermines trust and confuses both human readers and AI crawlers.

Additionally, `guide.json` descriptions are used in the landing page chapter cards (`ch.description`), in the sitemap via `buildContentDateMap()`, and in llms.txt. A description change in one place but not others creates subtle inconsistencies.

**Why it happens:**
The landing page dynamically reads from `guide.json` (good), but the blog post contains hardcoded chapter count and prose summaries (unavoidable -- blog posts are static content). The llms.txt dynamically reads chapter data (good), but the blog post does not. Any change to the chapter structure requires a manual update to the blog post.

**How to avoid:**
1. After adding or modifying chapters in `guide.json`, immediately grep for the old chapter count ("11 chapters") across all MDX and Astro files.
2. Update the blog post's chapter summaries and chapter count whenever the guide structure changes.
3. Verify llms.txt and llms-full.txt output after the build includes the new/updated chapters.
4. If adding a cheatsheet as a STANDALONE page (not a numbered chapter), decide explicitly whether it counts as a "chapter" or a supplementary page. The FastAPI guide has a FAQ page that is NOT counted as a chapter -- follow the same pattern.
5. Update guide.json `description` field if the guide's scope changes materially.

**Warning signs:**
- Blog post says "11 chapters" but guide.json lists 12
- Landing page hero text mentions a chapter count that does not match the card grid
- llms-full.txt chapter listing has different chapters than the landing page
- Guide description in one location mentions features not yet covered in the actual chapters

**Phase to address:**
Final integration phase. After all content changes are complete, do a metadata consistency audit across all four surfaces.

---

### Pitfall 5: Adding Non-Chapter Pages Without Updating Collection Queries

**What goes wrong:**
The cheatsheet page at `/guides/claude-code/cheatsheet/` is a standalone page, not a chapter in the `claudeCodePages` collection. The FastAPI guide has exactly this pattern -- `faq.astro` is a standalone page at `/guides/fastapi-production/faq/` that exists outside the content collection.

The danger is that standalone pages can be forgotten by queries that iterate over "all Claude Code guide content." Specifically:
1. **llms.txt/llms-full.txt** -- currently lists chapters by iterating `claudeCodePagesList`. The cheatsheet page will NOT appear unless explicitly added, just as the FastAPI FAQ is manually added with a hardcoded line.
2. **Sitemap** -- `buildContentDateMap()` only iterates `guide.json` chapters for lastmod dates. The cheatsheet page will be in the sitemap (any `.astro` file in `src/pages/` generates a route) but without a proper lastmod.
3. **OG images** -- the existing `[slug].png.ts` route generates OG images for chapter slugs only. The cheatsheet page needs its own OG image route or a manual addition.
4. **GuideLayout sidebar** -- if the cheatsheet page uses `GuideLayout`, it will appear in the sidebar's chapter list only if added to guide.json chapters. If it should NOT appear as a numbered chapter (like the FAQ), it needs different sidebar treatment.

**Why it happens:**
Content collection queries return collection entries, not arbitrary pages. Standalone pages live outside the collection and must be manually wired into every surface that renders guide content. This is by design -- the FAQ page for FastAPI works this way successfully -- but it means every integration point must be checked.

**How to avoid:**
1. Decide upfront: is the cheatsheet a **numbered chapter** in guide.json or a **standalone supplementary page** like the FAQ? Recommendation: standalone page, matching the FastAPI FAQ pattern.
2. If standalone, create `src/pages/guides/claude-code/cheatsheet.astro` as a dedicated page file.
3. Add the cheatsheet to llms.txt and llms-full.txt with a hardcoded line (following the `'- [FAQ](...)...'` pattern already used for the FastAPI FAQ).
4. Add `buildContentDateMap()` handling or accept that the cheatsheet will use the build date as lastmod (acceptable for a supplementary page).
5. Create an OG image for the cheatsheet page -- either via the existing `[slug].png.ts` dynamic route (if slug-based) or a dedicated `cheatsheet.png.ts` endpoint.
6. If using GuideLayout, pass a `showInSidebar: false` type flag or add the cheatsheet as a non-numbered sidebar entry below the chapter list (matching how FAQ pages are typically handled).

**Warning signs:**
- Cheatsheet page exists and renders but does not appear in llms.txt
- Cheatsheet page has no OG image when shared on social media
- GuideLayout sidebar does not include the cheatsheet or incorrectly numbers it as "Chapter 12"
- Sitemap includes the cheatsheet URL but with no lastmod date

**Phase to address:**
Cheatsheet page phase for the page creation, then final integration phase for wiring into llms.txt, OG images, and sitemap.

---

### Pitfall 6: Blog Post Content Becoming Factually Inconsistent with Updated Guide

**What goes wrong:**
The companion blog post "The Context Window Is the Product" (`src/data/blog/claude-code-guide.mdx`) contains 110 lines of prose that summarize every chapter. Each chapter gets a dedicated section with a detailed description of what the chapter covers. For example, the blog post says the hooks chapter covers "18 lifecycle events" -- if v1.19 updates this to 20 events because Claude Code added new hook types, the blog post becomes factually wrong even though the guide itself is correct.

The blog post also frames specific features in its prose. It says "Agent teams are currently a research preview feature, require an environment flag to enable." If agent teams graduate to GA in Claude Code's March/April 2026 updates, the blog post's characterization is stale even though the guide chapter has been updated.

Unlike chapters that have `lastVerified` dates, the blog post has no freshness signal. Its `publishedDate: 2026-03-15` suggests it was written with the original guide and may not have been updated since.

**Why it happens:**
Blog posts are written as narratives, not as dynamically-rendered templates. They cannot import chapter metadata or feature counts from guide.json. The blog post's prose is a snapshot of the guide's content at publication time. Every factual claim in the blog post is a potential staleness vector.

**How to avoid:**
1. After updating guide chapters, review the blog post section by section. Check every factual claim against the updated chapter content.
2. Specifically check: feature counts (e.g., "18 lifecycle events"), feature status (e.g., "research preview"), chapter scope descriptions (e.g., "covers X, Y, and Z").
3. If v1.19 writes a NEW blog post, the old blog post still needs to be checked for accuracy. Two blog posts referencing the guide doubles the maintenance surface.
4. Add `updatedDate` to the blog post frontmatter when its content is revised. The blog post currently has no `updatedDate` field.
5. Consider whether the new blog post should REPLACE the old one (updated content, same URL for SEO continuity) or be a separate post. Recommendation: separate post, since the old post has been indexed and may have backlinks.

**Warning signs:**
- Blog post mentions a specific number that no longer matches the guide (e.g., chapter count, event count, feature count)
- Blog post describes a feature as "research preview" that is now GA
- Blog post links to a chapter URL that has been renamed or reorganized
- Blog post does not have an `updatedDate` even though guide chapters have been modified

**Phase to address:**
Blog post phase must include a full review against updated chapter content. Not just writing new content -- also verifying that all existing claims still hold.

---

### Pitfall 7: OG Image Cache Invalidation When Updating Chapter Titles or Descriptions

**What goes wrong:**
The OG image pipeline (`og-cache.ts`) generates images using content hashes derived from the page's title and description. When a chapter's title or description changes in its MDX frontmatter, the content hash changes, correctly triggering regeneration of that chapter's OG image. However:

1. **Social media caching:** Facebook, Twitter/X, LinkedIn, and Slack all cache OG images aggressively (Facebook: up to 7 days, Twitter: indefinitely until re-scraped). Even after deploying updated OG images, social platforms will continue showing the OLD image until their caches expire or are manually purged.
2. **Guide.json description vs MDX description:** OG images may use the title from the MDX frontmatter, but the description might come from guide.json (where it is duplicated for the landing page). If the MDX description changes but guide.json does not, or vice versa, the OG image renders with mismatched content.
3. **Landing page OG image:** The `/guides/claude-code/` landing page has its own OG image (`claude-code.png`). If the guide's overall description or chapter count changes, this OG image should be regenerated. But the landing page OG image is a separate endpoint (`src/pages/open-graph/guides/claude-code.png.ts`) that may use guide.json metadata, not individual chapter metadata.

**Why it happens:**
OG image caching is an external platform concern that cannot be controlled from the build pipeline. The content-hash cache in `og-cache.ts` works correctly for build-time invalidation, but social platform caches operate independently.

**How to avoid:**
1. After updating chapter titles or descriptions, force social media cache refresh by using the platform debugger tools: Facebook Sharing Debugger, Twitter Card Validator, LinkedIn Post Inspector.
2. Ensure guide.json descriptions and MDX frontmatter descriptions stay in sync when either is updated.
3. When adding the cheatsheet page, create its OG image endpoint BEFORE deploying the page. A page without an OG image is worse than no page at all for social sharing.
4. For the new blog post, verify its OG image renders correctly and includes the correct title/description.

**Warning signs:**
- Social media preview shows old chapter title after title was updated
- OG image shows "Introduction & Getting Started" but the page title has been changed
- Cheatsheet page shared on social media shows a generic site OG image instead of a cheatsheet-specific one
- Guide.json description says "11 chapters" but OG image says "12 chapters"

**Phase to address:**
OG image and SEO phase. Include social media cache purge as a deploy checklist item.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Updating only the chapters that mention new features, ignoring others | Faster content delivery, fewer files changed | Cross-references in untouched chapters may become misleading. `lastVerified` dates on untouched chapters become stale. | Never for this milestone. All 11 chapters must be at minimum re-verified, even if not all need content changes. |
| Keeping cheatsheet SVGs as standalone files in `public/images/` instead of integrating into the build-time SVG pipeline | Zero build system changes, SVGs render immediately | Two maintenance paths for visual content (build-time diagrams vs static SVGs). No theme support. Font loading fragility. | Acceptable for v1.19 MVP IF rendered inline. Convert to build-time pipeline in a future milestone if the cheatsheet needs frequent updates. |
| Writing the new blog post without reviewing the old blog post for accuracy | Faster blog writing, one less file to review | Two blog posts with potentially contradictory information about the same guide. Readers may find the old post via search. | Never. Old blog post must be reviewed for accuracy whenever guide content changes. |
| Hardcoding cheatsheet into llms.txt with a manual line instead of adding it to a collection query | Matches existing pattern (FastAPI FAQ is hardcoded too), zero schema changes | Every new standalone guide page requires another hardcoded line. Not scalable beyond 2-3 supplementary pages per guide. | Acceptable for v1.19. Two hardcoded lines (FAQ for FastAPI, cheatsheet for Claude Code) is manageable. |
| Skipping the OG image for the cheatsheet page | Faster delivery, one less endpoint to create | Social shares of the cheatsheet page show the generic site OG image. Looks unprofessional. | Never. OG images take 15 minutes to set up using the existing pattern. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `guide.json` chapter array | Adding a chapter entry for the cheatsheet, making it appear as "Chapter 12" in the sidebar and navigation | Keep cheatsheet OUT of the chapters array. Create as standalone `.astro` page, matching the FAQ pattern. |
| `[slug].astro` dynamic route | Expecting the cheatsheet to be served by the dynamic `[slug].astro` route | The `[slug].astro` route only serves `claudeCodePages` collection entries. Standalone pages need their own `.astro` file (`cheatsheet.astro`). |
| Blog post `publishedDate` | Not adding `updatedDate` to the blog post when revising its content | Add `updatedDate: 2026-04-XX` to blog post frontmatter whenever its content is revised. This updates the sitemap lastmod and signals freshness to search engines. |
| Cross-chapter prev/next links | `GuideChapterNav.astro` computes prev/next from the `chapters` array in guide.json | If chapter order changes or chapters are added, prev/next navigation across ALL chapters shifts. Verify the complete navigation chain. |
| `llms-full.txt` Claude Code section | Forgetting to add cheatsheet URL after the chapter listing | Add a hardcoded line: `- [Cheatsheet](https://patrykgolabek.dev/guides/claude-code/cheatsheet/): Quick reference...` following the FastAPI FAQ pattern at line 345-346. |
| Inline SVG rendering | Using `<img src="cheatsheet.svg">` which sandboxes external font requests | Use Astro component that reads the SVG file content and renders it inline with `set:html`, or use `Fragment` with raw SVG content. |
| `buildContentDateMap()` in `astro.config.mjs` | Assumes all guide pages are in guide.json chapters array | Standalone pages like cheatsheet get sitemap entries automatically (any .astro file does) but without explicit lastmod dates. Accept this or add manual lastmod handling. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Inlining a 56KB cheatsheet SVG on every page load | Page HTML bloats by 56KB (pre-gzip), increasing time-to-first-byte and parse time | Inline only on the dedicated cheatsheet page, never in chapter pages. Use `loading="lazy"` if the SVG is below the fold. For chapter pages that reference the cheatsheet, link to the page -- do not inline. | Immediately noticeable on mobile if inlined on pages that do not need it |
| Adding code blocks to updated chapters without budget discipline | Build time increases as expressive-code processes each block. Chapters already average 400 lines. | Maintain the existing guideline: max 8 code blocks per chapter, 10-30 lines each. If new features require more examples, use prose descriptions or link to official docs. | When a single chapter exceeds 15 code blocks |
| Updating guide.json timestamps without rebuilding OG image cache | OG images show stale dates or descriptions even though metadata has changed | After any guide.json change, run a local build to verify OG image regeneration. Check `node_modules/.cache/og-guide/` for updated files. | When guide.json publishedDate or chapter descriptions change but cached images are not invalidated |
| Font preloading for cheatsheet SVG | If cheatsheet fonts (JetBrains Mono, DM Sans) are preloaded in `<head>` for the cheatsheet page, they load on EVERY page if done globally | Scope font preloading to the cheatsheet page only, not in the global Layout. Use page-level `<link rel="preload">` injection via Astro slots or head content. | Immediately if fonts are added to the global `<head>` |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Updating code examples with real API keys or tokens from testing | Keys leak into the public repo and indexed content | Continue using obviously fake values: `sk-ant-EXAMPLE-not-a-real-key`. Review all code block changes for real credentials before committing. |
| Updating permission examples to recommend bypassing sandbox | Readers disable security features based on guide recommendations | Never recommend `dangerouslySkipPermissions` or `dangerouslyDisableSandbox` in examples. If discussing these flags, always include a visible warning callout. |
| Cheatsheet SVG referencing external resources via `@import` | SVG `@import` opens a network request path. If the Google Fonts CDN is compromised, the cheatsheet could load malicious CSS. | Self-host the fonts or embed as base64 within the SVG. Eliminates the external dependency entirely. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Cheatsheet page renders differently from the rest of the guide | Users clicking from a chapter to the cheatsheet experience a jarring visual shift -- different fonts, different colors, no sidebar | Use `GuideLayout` or a consistent layout wrapper for the cheatsheet page. Even if the cheatsheet is not a chapter, it should feel like part of the guide experience. Add sidebar with the cheatsheet highlighted as "Quick Reference" below the chapter list. |
| Updated chapters do not indicate what changed | Returning readers cannot tell which content is new vs unchanged | Add a brief "Updated in April 2026" note or callout at the top of significantly revised chapters. Use the `updatedDate` frontmatter field to display "Last updated: April 2026" in the chapter header. |
| New blog post does not reference the existing blog post | Readers find the old blog post via search, do not know a newer one exists | Add a visible "Update" callout at the top of the old blog post linking to the new one. Use the blog post's `updatedDate` field. |
| Cheatsheet is image-only with no accessible text alternative | Screen reader users cannot access cheatsheet content. Search engines cannot index cheatsheet text. | Provide the cheatsheet content as both inline SVG (visual) and structured HTML/markdown (accessible). At minimum, add comprehensive `alt` text and ARIA labels. Best approach: render cheatsheet content as styled HTML with a "Download as SVG/PDF" option. |

## "Looks Done But Isn't" Checklist

- [ ] **All 11 chapters:** Every chapter has `lastVerified` date within 30 days of deploy date -- grep `lastVerified` across all MDX files
- [ ] **Cross-references:** All 30+ inter-chapter links resolve correctly -- run full-site link check on build output
- [ ] **Blog post accuracy:** "The Context Window Is the Product" reflects updated chapter content -- compare each section against the corresponding chapter
- [ ] **Blog post `updatedDate`:** Blog post frontmatter includes `updatedDate` if its content was revised
- [ ] **Cheatsheet in llms.txt:** `/llms.txt` and `/llms-full.txt` include the cheatsheet URL -- fetch from build output and verify
- [ ] **Cheatsheet OG image:** `/open-graph/guides/claude-code/cheatsheet.png` exists and renders correctly
- [ ] **Cheatsheet dark mode:** Cheatsheet renders correctly in both light and dark themes on the cheatsheet page
- [ ] **Cheatsheet fonts:** JetBrains Mono renders on the cheatsheet page (not falling back to system monospace) -- test in incognito browser with no font cache
- [ ] **Guide.json consistency:** Chapter count, descriptions, and titles match across guide.json, landing page, blog post, and llms.txt
- [ ] **Sidebar navigation:** If cheatsheet is in sidebar, it appears correctly without disrupting chapter numbering
- [ ] **New blog post:** OG image renders, appears in RSS feed, appears on blog listing page
- [ ] **Old blog post:** Still accurate or has an "Update available" callout linking to new post
- [ ] **Sitemap:** All new and updated pages appear in `sitemap-0.xml` with correct `lastmod` dates
- [ ] **Feature verification:** Every Claude Code feature mentioned in updated chapters exists in current official docs
- [ ] **Lighthouse scores:** All updated guide pages and cheatsheet page score 90+ on Performance, Accessibility, Best Practices, SEO
- [ ] **Print cheatsheet:** If a downloadable version exists, its content matches the web version
- [ ] **FastAPI guide regression:** FastAPI guide still builds and renders correctly -- click through 3-4 pages to verify no side effects

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cross-reference rot (broken inter-chapter links) | LOW | Grep for the broken URL pattern, update all references. Takes 30-60 minutes if caught before deploy. Takes longer if readers report it post-deploy. |
| Stale `lastVerified` dates | LOW | Batch update: `grep -l lastVerified src/data/guides/claude-code/pages/*.mdx` and update dates. 15 minutes. |
| Cheatsheet font rendering failure | MEDIUM | If deployed with broken fonts: either switch to inline rendering (code change + redeploy) or embed fonts as base64 in the SVG (larger file but guaranteed rendering). 1-2 hours. |
| Guide metadata drift (chapter count mismatch) | LOW | Update the blog post and guide.json. 30 minutes per location. |
| Non-chapter page missing from llms.txt | LOW | Add a hardcoded line to llms.txt and llms-full.txt. 10 minutes. |
| Blog post factual inconsistency | MEDIUM | Review and rewrite affected sections. 1-3 hours depending on how much changed. Post-deploy, readers may have already seen the inconsistency. |
| OG image showing stale content on social media | LOW (for fix) / MEDIUM (for damage) | Regenerate OG images via build, purge social media caches using platform tools. 30 minutes. But stale previews may have already been shared. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1: Cross-reference rot | Every chapter update phase + final integration | `grep -r "/guides/claude-code/" src/data/` returns no dead links; full link check passes |
| P2: Stale `lastVerified` dates | Every chapter update phase | All `lastVerified` dates within 30 days of deploy; no `updatedDate` newer than `lastVerified` |
| P3: Cheatsheet SVG rendering | Cheatsheet page phase | Fonts render in incognito; dark/light theme works; no external network requests from SVG |
| P4: Metadata drift | Final integration phase | `grep "11 chapters"` returns only correctly-counted instances; guide.json matches landing page |
| P5: Non-chapter page wiring | Cheatsheet page phase + final integration | Cheatsheet appears in llms.txt, has OG image, has proper sitemap entry |
| P6: Blog post inconsistency | Blog post phase | Every factual claim in blog post verified against corresponding chapter; `updatedDate` set |
| P7: OG image cache invalidation | OG/SEO integration phase | Social media debugger tools show correct images after deploy |

## Sources

### Primary (HIGH confidence -- direct codebase analysis)
- `src/data/guides/claude-code/pages/*.mdx` -- 30+ cross-references verified by grep across 11 chapters (4,032 lines total)
- `src/data/blog/claude-code-guide.mdx` -- 110-line companion blog post with per-chapter summaries and 11 chapter links
- `src/pages/guides/claude-code/[slug].astro` -- dynamic route serving `claudeCodePages` collection with `companionLink` prop
- `src/data/guides/claude-code/guide.json` -- 11 chapters, `accentColor: #D97706`, `publishedDate: 2026-03-15`
- `public/images/cheatsheet/claude-code-cheatsheet.svg` -- 56KB/495-line SVG with external Google Fonts `@import` and Boxy SVG namespace
- `src/content.config.ts` lines 65-73 -- `claudeCodePages` and `claudeCodeGuide` as separate collections
- `src/lib/guides/schema.ts` -- `guidePageSchema` with optional `lastVerified`, `updatedDate`, and `keywords` fields
- `src/pages/llms.txt.ts` lines 234-243 -- Claude Code guide chapter listing via collection iteration, FastAPI FAQ hardcoded at line 232
- `src/pages/llms-full.txt.ts` lines 389-402 -- Claude Code guide chapter listing, FastAPI FAQ hardcoded at line 344-346
- `astro.config.mjs` lines 46-65 -- `buildContentDateMap()` dynamically iterates all `src/data/guides/*/guide.json` files
- `src/pages/guides/index.astro` -- hub page rendering both guides with separate collection queries
- `src/pages/open-graph/guides/claude-code/[slug].png.ts` -- OG image generation for chapter pages

### Secondary (MEDIUM confidence -- verified web research)
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/) -- Content Layer API, collection queries, glob/file loaders
- [Inline SVG vs IMG Tag Performance](https://www.svgai.org/blog/inline-svg-vs-img-tag) -- SVG rendering approaches, external resource sandboxing in img context
- [Astro SVG Components Discussion](https://github.com/withastro/roadmap/discussions/667) -- SVG rendering as Astro components, inline SVG for CSS variable support
- [SVG for Web Developers 2026](https://www.svggenie.com/blog/svg-for-web-developers-guide) -- Font loading in SVGs, responsive sizing, accessibility
- [Structured Data SEO 2026](https://www.digitalapplied.com/blog/structured-data-seo-2026-rich-results-guide) -- JSON-LD maintenance, stale metadata detection
- [Astro Build Speed Optimization](https://www.bitdoze.com/astro-ssg-build-optimization/) -- Large site build optimization, 35-127 pages/second benchmarks
- [OG Images Build-Time vs Runtime](https://jilles.me/og-images-astro-build-vs-runtime/) -- Satori+Sharp OG generation benchmarks, caching strategies

---
*Pitfalls research for: Updating the Claude Code guide (v1.19 milestone) on patrykgolabek.dev (1160-page Astro 5 site)*
*Researched: 2026-04-12*
