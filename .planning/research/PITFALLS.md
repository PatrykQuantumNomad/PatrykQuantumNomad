# Pitfalls Research: v1.1 Content Refresh

**Domain:** Content updates, project curation, external blog integration, hero copy refresh on existing Astro 5 portfolio site (patrykgolabek.dev)
**Researched:** 2026-02-11
**Confidence:** HIGH (verified against codebase, Astro docs, SEO best practices, and multiple community sources)

**Context:** This is a SUBSEQUENT milestone pitfalls document. The v1.0 site is live with sitemap, RSS, OG images, JSON-LD, Lighthouse 90+ scores. These pitfalls are specific to the risk of breaking existing functionality while adding/modifying content.

---

## Critical Pitfalls

### Pitfall 1: Removing Blog Posts or Projects Breaks Existing External Links and Indexed URLs

**What goes wrong:**
Search engines have already indexed URLs like `/blog/building-kubernetes-observability-stack/`. If the test blog post is removed or its slug changes, anyone who bookmarked it, linked to it from another site, or found it via Google gets a 404. Google Search Console starts reporting "Page not found" errors. Any link equity the URL accumulated is permanently lost.

The same applies if projects are removed from `src/data/projects.ts` -- while the projects page itself uses external GitHub links (not internal routes), removing or re-categorizing projects changes the page content that Google has already indexed. If any project categories are removed entirely, the page hash-links that may have been shared break.

**Why it happens:**
Static sites on GitHub Pages cannot return HTTP 301 redirects. When a file is removed from `dist/`, that URL simply returns 404. There is no server-side redirect layer. Astro's built-in `redirects` config generates `<meta http-equiv="refresh">` HTML pages, which Google treats as a soft redirect -- better than a 404 but not as strong as a true 301 for preserving SEO value.

**How to avoid:**
1. **Never delete a published blog post without a redirect.** Add meta-refresh redirects in `astro.config.mjs`:
   ```js
   redirects: {
     '/blog/old-slug/': '/blog/new-slug/',
   }
   ```
2. **For the test post specifically:** If removing `building-kubernetes-observability-stack.md`, either leave it as a real post (rewrite it into genuine content) or add a redirect to `/blog/`. Do NOT simply delete the file.
3. **For project removals:** Since project cards link to external GitHub URLs (not internal pages), removing a project card does not create a broken internal link. However, verify no internal pages link to removed projects.
4. **Audit internal links before removal:** Search the entire `src/` directory for any hardcoded references to content being removed.
5. **Update the sitemap filter** to exclude any redirected URLs if needed.

**Warning signs:**
- Google Search Console reports "Page with redirect" or "Not found (404)" errors after deploy
- Referral traffic from external sites drops to zero
- The RSS feed still references a removed post's URL (see Pitfall 3)

**Phase to address:**
Any phase that removes or renames content. Must be the FIRST step before content deletion.

---

### Pitfall 2: External Blog Links Mixed Into Blog Page Break Content Collection Assumptions

**What goes wrong:**
The v1.1 milestone includes integrating external blog links (Translucent Computing, Kubert AI). If external blog posts are added to the Astro content collection, the `[slug].astro` dynamic route tries to generate static pages for them, which either fails at build time or creates empty pages. If external posts are added to the blog index without proper handling, clicking them navigates to a nonexistent internal URL instead of the external site.

Additionally, the RSS feed (`rss.xml.ts`), OG image generator (`open-graph/[...slug].png.ts`), and `llms.txt.ts` all iterate over the blog content collection. Adding entries that are meant to be external links causes these integrations to generate broken output -- RSS items linking to internal URLs that do not exist, OG images generated for pages that will never be visited, and LLM.txt listing content that is not on this site.

**Why it happens:**
The current content collection schema (`src/content.config.ts`) has no concept of "external" posts. Every entry in the `blog` collection is expected to have a rendered page at `/blog/{id}/`. The `getStaticPaths()` function in `[slug].astro` generates a route for every non-draft entry. The RSS feed maps every entry to an internal `/blog/{id}/` URL. There is no `externalUrl` field in the Zod schema.

**How to avoid:**
There are two valid approaches -- choose ONE:

**Approach A: Separate data source for external posts (RECOMMENDED)**
Keep external blog posts OUT of the content collection entirely. Create a separate data file (e.g., `src/data/external-posts.ts`) with title, URL, date, source, and description. Render these in the blog index alongside local posts, sorted by date, but with distinct visual treatment (external link icon, "on Translucent Computing" badge). This avoids touching the content collection pipeline, RSS, OG images, or LLMs.txt.

**Approach B: Schema extension with conditional routing**
Add an `externalUrl` field to the blog schema. Then update EVERY consumer:
- `[slug].astro`: Filter out external entries in `getStaticPaths()`
- `rss.xml.ts`: Use external URL for `link` field when present
- `open-graph/[...slug].png.ts`: Skip external entries
- `llms.txt.ts`: Link to external URL instead of internal path
- `blog/index.astro` and `index.astro`: Link to external URL
- `blog/tags/[tag].astro`: Handle external entries in tag pages
- Sitemap: External entries must not generate internal URLs

Approach B touches 7+ files and creates ongoing maintenance burden. Approach A is cleaner.

**Warning signs:**
- Build errors: "getStaticPaths() returned a path for a page that does not have a corresponding content entry"
- Blog index links to `/blog/some-external-post/` which returns 404
- RSS feed contains items with internal URLs that have no matching page
- OG images are generated for nonexistent pages

**Phase to address:**
The external blog integration phase. Design the data model BEFORE implementing any UI.

---

### Pitfall 3: RSS Feed, Sitemap, and LLMs.txt Drift When Content Changes

**What goes wrong:**
After content changes (adding external posts, removing the test post, adding new real posts), the RSS feed, sitemap, and LLMs.txt contain stale or broken data. Specifically:
- RSS feed items link to removed blog posts
- Sitemap includes URLs for pages that no longer exist
- LLMs.txt references deleted posts
- New external blog links are not reflected in RSS (they should NOT be in RSS -- they are someone else's content hosted elsewhere)

**Why it happens:**
The RSS feed (`rss.xml.ts`), sitemap (`@astrojs/sitemap`), and LLMs.txt all independently query the content collection. They are not coordinated. The sitemap is especially tricky because `@astrojs/sitemap` operates at the route level, not the content level -- it includes every page that Astro generates, including redirect pages. If a redirect HTML page is generated for a removed post, the sitemap includes the redirect URL, which confuses search engines.

The current RSS implementation hardcodes the link pattern:
```typescript
link: `/blog/${post.id}/`,
```
This means every blog collection entry gets an internal link. If content is removed without updating the RSS, the next build will simply exclude it -- but anyone who already fetched the RSS will have stale links in their reader.

**How to avoid:**
1. **After any content change, verify all three outputs:**
   - Build the site and check `dist/sitemap-index.xml` (or `dist/sitemap-0.xml`) for removed URLs
   - Check `dist/rss.xml` for correct entries and valid links
   - Check `/llms.txt` output for correct post listings
2. **Add a sitemap filter** if redirects are generating unwanted entries:
   ```js
   sitemap({
     filter: (page) => !page.includes('/old-removed-slug/'),
   }),
   ```
3. **Do NOT add external blog posts to RSS.** The RSS feed should only contain content hosted on patrykgolabek.dev. External posts belong to their respective sites' RSS feeds. Including them violates RSS best practices and confuses feed readers about content ownership.
4. **Consider adding `<lastmod>` to sitemap entries** via the `serialize` option to signal to search engines when content was last updated.

**Warning signs:**
- Feed readers show broken entries
- Google Search Console reports sitemap URLs that return 404
- LLMs.txt lists posts that no longer exist on the site

**Phase to address:**
Every phase that modifies content must include a verification step for these three outputs.

---

### Pitfall 4: Hero Tagline Changes Harm SEO Keyword Alignment

**What goes wrong:**
The hero section's H1 ("Patryk Golabek"), subtitle, and meta description contain carefully chosen keywords: "Cloud-Native Architect", "Kubernetes", "AI/ML Engineer", "Platform Builder". Changing the hero copy without considering SEO keyword alignment can degrade search rankings for target queries. The typing animation rotates through four role strings -- changing these changes what Google indexes (Google does index JavaScript-rendered content, but the initial HTML content carries more weight).

Additionally, the `<title>` tag ("Patryk Golabek -- Cloud-Native Architect & AI/ML Engineer"), the `<meta name="description">`, the OG tags, and the Person JSON-LD `jobTitle` field all need to stay synchronized with the hero copy. If the hero says "Platform Engineering Lead" but the title tag still says "Cloud-Native Architect", Google sees inconsistent signals.

**Why it happens:**
The title, meta description, hero H1, typing roles, JSON-LD `jobTitle`, and OG metadata are all defined in different places:
- Title/description: `src/pages/index.astro` lines 17-18 (Layout props)
- Hero H1: `src/pages/index.astro` line 25
- Typing roles: `src/pages/index.astro` line 192 (JavaScript array)
- Hero subtitle: `src/pages/index.astro` lines 31-33
- Person JSON-LD `jobTitle`: `src/components/PersonJsonLd.astro` line 7
- Person JSON-LD `description`: `src/components/PersonJsonLd.astro` line 8
- About page title/description: `src/pages/about.astro` lines 56-57

There is no single source of truth for these values. Updating one without the others creates inconsistency.

**How to avoid:**
1. **Create a centralized site config** (e.g., `src/data/site-config.ts`) that defines the canonical title, job title, description, and role keywords. Import this in all pages and components that use these values.
2. **When changing hero copy, update ALL of these locations:**
   - `index.astro` title and description props
   - `index.astro` H1 text
   - `index.astro` typing roles array
   - `index.astro` hero subtitle paragraph
   - `PersonJsonLd.astro` jobTitle and description
   - `about.astro` title and description props
   - `about.astro` intro paragraph
   - `contact.astro` title and description props
3. **Keep target keywords present.** Research confirms that H1 and title tag keyword alignment strengthens ranking signals. The keywords "Cloud-Native Architect", "Kubernetes", and "AI/ML" should remain present somewhere in the H1 or subtitle even if the specific phrasing changes.
4. **Do not remove the static H1 text.** The typing animation is progressive enhancement. The initial `<span>` text ("Cloud-Native Architect") is what search engines primarily index. If you change the initial text to something generic, you lose keyword value.

**Warning signs:**
- Google Search Console shows impressions dropping for target keywords after deploy
- Structured Data Testing Tool shows `jobTitle` mismatch with page content
- Social sharing preview shows old/mismatched title and description

**Phase to address:**
The hero refresh phase. Create the centralized config FIRST, then update the hero copy.

---

### Pitfall 5: Social Link Updates Break Accessibility and JSON-LD Structured Data

**What goes wrong:**
When adding or updating social links (new platforms like dev.to, X/Twitter, Bluesky, or updating existing URLs), multiple things can silently break:
1. **Missing aria-labels:** New social icon links without `aria-label` attributes are invisible to screen readers. WebAIM estimates 50% of top websites have empty link accessibility errors.
2. **JSON-LD `sameAs` array not updated:** The `PersonJsonLd.astro` component has a `sameAs` array listing social profiles. If new links are added to the Footer or Contact page but not to JSON-LD, Google sees inconsistent identity signals.
3. **Broken SVG icons:** Adding a new social platform requires a new SVG icon. If the SVG has no `aria-hidden="true"` attribute, screen readers try to announce the raw SVG markup. If the SVG has incorrect `viewBox`, it renders at wrong dimensions.
4. **Links scattered across 4 files:** Social links currently appear in Footer.astro, contact.astro, about.astro, and PersonJsonLd.astro -- all with hardcoded URLs. Updating one and missing another creates inconsistency.

**Why it happens:**
Social links are currently hardcoded in each component independently. There is no centralized social links data source. The Footer has 3 social links (GitHub, LinkedIn, Translucent Computing blog), the Contact page has 5 (adds Kubert AI and Email), the About page has 5, and JSON-LD has 4 URLs in `sameAs`. They are already not perfectly aligned.

**How to avoid:**
1. **Create a centralized social links data file** (e.g., `src/data/social-links.ts`) with label, URL, SVG icon component or path, and aria-label for each platform.
2. **Every social link MUST have:**
   - `aria-label="[Platform name] profile"` or visible text
   - `target="_blank"` with `rel="noopener noreferrer"`
   - `aria-hidden="true"` on the SVG icon element
   - The SVG should have proper `viewBox`, `fill="currentColor"` or `stroke="currentColor"`
3. **Update JSON-LD `sameAs` from the same data source.** The `sameAs` array should be generated from the centralized config, not maintained separately.
4. **Validate after changes:**
   - Run Lighthouse accessibility audit
   - Test with a screen reader (VoiceOver on macOS: Cmd+F5)
   - Validate JSON-LD with Google Rich Results Test
   - Check all links actually resolve (no typos in URLs)

**Warning signs:**
- Lighthouse accessibility score drops below 90
- Screen reader announces "link" with no label when navigating social icons
- Google Rich Results Test shows warnings about `sameAs` URLs
- Social links in footer differ from those on contact page

**Phase to address:**
The contact/social updates phase. Centralize the data source BEFORE updating individual links.

---

### Pitfall 6: OG Image Generation Breaks When Blog Content Collection Changes

**What goes wrong:**
The dynamic OG image generator (`src/pages/open-graph/[...slug].png.ts`) uses `getStaticPaths()` to generate images for all blog posts. If a blog post is removed but something still references its OG image URL (cached social media shares, Google's cache), the OG image returns 404. More critically, if the content collection schema changes (adding new fields, changing the structure), the OG image generator may fail to build because it depends on `post.data.title`, `post.data.description`, and `post.data.tags`.

If external blog posts are incorrectly added to the content collection (see Pitfall 2), the OG image generator will try to create images for external content that has no corresponding page.

**Why it happens:**
The OG image route creates paths from the content collection:
```typescript
return posts.map((post) => ({
  params: { slug: 'blog/' + post.id },
  props: { title: post.data.title, description: post.data.description, tags: post.data.tags },
}));
```
Any change to the content collection's entries or schema directly affects OG image generation. The Satori-based generator also has known issues with font weights and long titles -- changing post titles to longer strings can cause layout overflow in the OG image.

**How to avoid:**
1. **Test OG image generation after any content change:** Run `npm run build` and verify `/open-graph/blog/{slug}.png` files exist for all expected posts.
2. **Keep title length under 80 characters** (the `truncate` function already handles this, but verify new content respects it).
3. **If removing a post, the OG image is automatically removed** since it is generated from getStaticPaths. This is expected behavior, but be aware that cached social shares will show broken images.
4. **If adding external posts to a separate data file** (Approach A from Pitfall 2), no OG images need to be generated for them -- the external sites handle their own OG images.

**Warning signs:**
- Build fails with Satori rendering errors after content changes
- Social media shares show broken/missing preview images
- The `dist/open-graph/` directory contains unexpected or missing files

**Phase to address:**
Any phase that modifies blog content. Include OG image verification in the build check.

---

## Moderate Pitfalls

### Pitfall 7: Tag Pages Generate/Disappear Based on Content Changes

**What goes wrong:**
The `[tag].astro` route generates pages for every unique tag across all blog posts. If the only post with tag "observability" is removed, the `/blog/tags/observability/` page disappears. If someone had linked to or bookmarked that tag page, they get a 404.

**How to avoid:**
- Accept that tag pages are ephemeral by nature -- they exist only while tagged content exists
- Do NOT create redirects for removed tag pages (they are low-value pages)
- When removing the last post with a given tag, verify no internal links reference that tag page
- The sitemap will automatically exclude the removed tag page on next build

### Pitfall 8: Typing Animation Roles Array Not Aligned With SEO Content

**What goes wrong:**
The hero typing animation cycles through `['Cloud-Native Architect', 'Kubernetes Pioneer', 'AI/ML Engineer', 'Platform Builder']`. These are rendered via JavaScript, meaning the initial HTML only shows "Cloud-Native Architect". If the roles array is updated but the initial `<span>` text is not, or if roles are changed to less SEO-valuable terms, the page loses keyword density for target search terms.

**How to avoid:**
- The FIRST role in the array should always match the initial `<span>` text
- All roles should contain target keywords (these ARE the primary professional identity keywords)
- Test that the animation still works after changes -- the `setInterval` cycles through the array by index

### Pitfall 9: Content Removal Changes the Projects Page SEO Profile

**What goes wrong:**
The projects page meta description says "Explore 19 open-source projects." If projects are added or removed, this number becomes inaccurate. Google's cached snippet shows the old count, creating a mismatch. Additionally, removing a project category entirely changes the page structure that Google has already indexed.

**How to avoid:**
- Update the meta description project count when adding/removing projects
- Consider making the count dynamic: `{projects.length} open-source projects`
- Do not remove entire categories unless they are truly empty -- restructure rather than delete

### Pitfall 10: GitHub Pages Cache Serves Stale Content After Deploy

**What goes wrong:**
After deploying content updates, visitors still see old content because GitHub Pages has aggressive CDN caching. The old version of blog posts, project lists, or hero text persists for minutes to hours after deploy.

**How to avoid:**
- GitHub Pages cache TTL is typically 10 minutes but can be longer
- HTML files get `Cache-Control: max-age=600` by default
- After critical content updates, verify the live site reflects changes (hard refresh with Ctrl+Shift+R)
- The OG images already have `Cache-Control: public, max-age=31536000, immutable` -- this is fine for static assets but means old OG images are cached aggressively by social platforms. After updating OG content, use Facebook Sharing Debugger to force a re-scrape.

---

## Technical Debt Patterns

Shortcuts that seem reasonable during a content refresh but create problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding social URLs in each component | Quick to add a new link | URLs diverge across Footer, Contact, About, JSON-LD; one gets stale | Never -- centralize from day one of v1.1 |
| Adding external blog posts to the content collection | Reuses existing blog card rendering | Breaks RSS, OG images, LLMs.txt, requires conditional logic in 7+ files | Never -- use a separate data source |
| Deleting the test blog post without a redirect | Clean slate for real content | 404 for anyone who bookmarked it; Google reports crawl error | Only if the post has zero external backlinks and is not indexed |
| Updating hero text in index.astro only | Quick copy change | Title tag, JSON-LD, About page, meta description all become inconsistent | Never -- update all locations or centralize first |
| Hardcoding project count in meta description | Accurate at time of writing | Becomes inaccurate whenever projects change | Avoid -- compute dynamically from data |
| Skipping build verification after content changes | Faster iteration | Broken RSS, missing OG images, sitemap errors deployed to production | Never for production deploys |

## "Looks Done But Isn't" Checklist

Things that appear complete after a content refresh but have hidden issues.

- [ ] **External blog links added to blog page:** Visually correct -- but verify clicking them opens the external site (not an internal 404), they have `target="_blank"` and `rel="noopener noreferrer"`, and they are NOT in the RSS feed
- [ ] **Test blog post removed:** No 404 at the old URL -- verify a redirect exists, the sitemap no longer includes the old URL, RSS feed no longer references it, LLMs.txt no longer lists it, and OG image route no longer generates for it
- [ ] **Hero copy updated:** Reads well -- but verify the `<title>` tag matches, the `<meta name="description">` is updated, the PersonJsonLd `jobTitle` and `description` match, the typing roles array is aligned, and the About page bio reflects the same narrative
- [ ] **New social link added:** Icon renders and links work -- but verify `aria-label` is present, SVG has `aria-hidden="true"`, the URL is in JSON-LD `sameAs` array, the link appears consistently in Footer AND Contact AND About pages
- [ ] **Project added or removed:** Card appears/disappears -- but verify the projects page meta description count is accurate, no internal links reference removed projects, the page still renders correctly with changed category groupings
- [ ] **Content changes deployed:** Site looks right -- but verify `dist/sitemap-0.xml` has correct URLs, `dist/rss.xml` has correct entries, Lighthouse scores are still 90+ (content changes can affect CLS if layout shifts), and JSON-LD still validates
- [ ] **Social link URL changed:** New URL loads -- but verify the old URL is updated in ALL four locations (Footer, Contact, About, PersonJsonLd), not just the one you were looking at
- [ ] **RSS feed after changes:** Feed endpoint responds -- but verify it validates with W3C Feed Validation Service, contains only local posts (no external blog links), and all `<link>` elements use absolute `https://patrykgolabek.dev/` URLs

## Pitfall-to-Phase Mapping

How v1.1 roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Content removal breaks indexed URLs (P1) | First phase of any content change | No new 404s in build output; redirect pages generated for removed content |
| External blog links break content pipeline (P2) | External blog integration phase | Build succeeds; RSS/OG/LLMs.txt contain only local content; external links open correctly |
| RSS/Sitemap/LLMs.txt drift (P3) | Every phase that modifies content | Post-build check of `dist/rss.xml`, `dist/sitemap-0.xml`, and `/llms.txt` |
| Hero copy breaks keyword alignment (P4) | Hero refresh phase | Title tag, meta description, JSON-LD, and hero text all contain target keywords and are consistent |
| Social links break accessibility/JSON-LD (P5) | Contact/social updates phase | Lighthouse accessibility 90+; JSON-LD `sameAs` matches visible social links; all links have aria-labels |
| OG image generation breaks (P6) | Any blog content change phase | `dist/open-graph/` contains PNG for every non-draft post; no Satori build errors |
| Tag pages appear/disappear (P7) | Blog content change phase | Expected tag pages exist; no orphaned tag references |
| Typing animation misalignment (P8) | Hero refresh phase | First role in array matches initial `<span>` text; all roles are SEO-valuable |
| Project count meta description stale (P9) | Project curation phase | Meta description project count matches actual data |
| Stale CDN cache after deploy (P10) | All phases (deployment step) | Live site reflects changes within 15 minutes; force social media re-scrape for OG |

## Recommended Phase Ordering Based on Pitfalls

Based on the dependency analysis above, the v1.1 phases should be ordered to establish centralized data sources BEFORE making content changes:

1. **Data centralization phase** -- Create `site-config.ts` and `social-links.ts`, refactor existing components to use them. This prevents Pitfalls 4 and 5 from occurring in subsequent phases.
2. **External blog integration** -- Design and implement the separate data source for external posts. This prevents Pitfall 2.
3. **Content changes** (hero refresh, project curation, post updates) -- With centralized data in place, changes propagate correctly. Addresses Pitfalls 1, 4, 8, 9.
4. **Social/contact updates** -- Using centralized social links, update all platforms. Addresses Pitfall 5.
5. **Verification phase** -- Full build audit of sitemap, RSS, OG images, LLMs.txt, Lighthouse, and JSON-LD. Catches Pitfalls 3, 6, 7, 10.

## Sources

- [Astro Content Collections -- Official Docs](https://docs.astro.build/en/guides/content-collections/) (HIGH confidence)
- [Content Layer Deep Dive -- Astro Blog](https://astro.build/blog/content-layer-deep-dive/) (HIGH confidence)
- [Astro RSS Recipes -- Official Docs](https://docs.astro.build/en/recipes/rss/) (HIGH confidence)
- [Astro Sitemap Integration -- Official Docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/) (HIGH confidence)
- [Sitemap Includes Drafts -- GitHub Issue #7087](https://github.com/withastro/astro/issues/7087) (HIGH confidence)
- [Excluding Drafts in Astro Sitemap](https://www.jakubtomek.com/blog/excluding-drafts-in-astro-sitemap-integration) (MEDIUM confidence)
- [Astro SSG Redirects on GitHub Pages](https://puf.io/posts/astro-ssg-redirects/) (MEDIUM confidence)
- [Astro Routing -- Redirects](https://docs.astro.build/en/guides/routing/) (HIGH confidence)
- [GitHub Pages 301 Redirect Limitation](https://github.com/orgs/community/discussions/22407) (HIGH confidence)
- [301 Redirect SEO Best Practices](https://www.browserstack.com/guide/301-permanent-redirect) (MEDIUM confidence)
- [Deleting Website Content SEO Best Practices](https://wpslimseo.com/deleting-website-content-seo-best-practices/) (MEDIUM confidence)
- [H1 Tags Ranking Factor 2026 Case Study](https://www.rankability.com/ranking-factors/google/h1-tags/) (MEDIUM confidence)
- [SearchPilot: Adding Keywords to H1](https://www.searchpilot.com/resources/case-studies/seo-split-test-lessons-adding-custom-to-the-h1) (MEDIUM confidence)
- [JSON-LD sameAs Property -- Schema.org](https://schema.org/sameAs) (HIGH confidence)
- [Social Media Icons Accessibility Error -- BOIA](https://www.boia.org/blog/check-your-websites-social-media-icons-for-this-common-accessibility-error) (MEDIUM confidence)
- [Icon Accessibility Best Practices -- A11Y Collective](https://www.a11y-collective.com/blog/icon-usability-and-accessibility/) (MEDIUM confidence)
- [ARIA Labels Implementation Guide](https://www.allaccessible.org/blog/implementing-aria-labels-for-web-accessibility) (MEDIUM confidence)
- [Dynamic OG Images with Satori and Astro](https://knaap.dev/posts/dynamic-og-images-with-any-static-site-generator/) (MEDIUM confidence)
- [Community Loaders for Astro Content Layer](https://astro.build/blog/community-loaders/) (HIGH confidence)
- [Astro SEO Complete Guide](https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/) (MEDIUM confidence)

---
*Pitfalls research for: v1.1 content refresh on existing Astro 5 portfolio at patrykgolabek.dev*
*Researched: 2026-02-11*
