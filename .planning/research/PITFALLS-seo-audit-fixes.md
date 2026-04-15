# Pitfalls Research: SEO Audit Fixes for Astro 5 Portfolio Site

**Domain:** SEO remediation on existing Astro 5 static site (1,184 pages)
**Researched:** 2026-04-15
**Confidence:** HIGH (verified against Google documentation, Astro docs, and post-March-2026 core update recovery reports)

## Critical Pitfalls

### Pitfall 1: Enriched Comparison Pages Triggering Scaled Content Abuse Detection

**What goes wrong:**
Adding 500+ auto-generated words to 650 VS comparison pages at build time creates exactly the pattern Google's March 2026 core update targets: template-with-variable substitution at scale. Sites following this pattern saw 60-90% ranking drops. Google's quality raters are specifically instructed to give "lowest quality" ratings to pages where the majority of main content is auto-generated without original or unique value added. The December 2025 update further refined detection of "competent but generic content" -- content that is technically correct but demonstrates no genuine expertise.

Three violation signals Google identifies: (1) mass AI/template page generation without editorial review, (2) pure template-with-variable substitution at scale, and (3) pages that add no additional context beyond source data. The 650 VS pages enriched from a single template with programmatic variable swaps match all three patterns unless deliberately designed to avoid them.

**Why it happens:**
The temptation is to build a content generation pipeline that takes Language A data and Language B data, runs a comparison function, and outputs prose. This produces text that reads differently per page but is structurally identical -- every page says "Language X scores Y on dimension Z while Language W scores V." Google's classifiers detect this structural repetition even when surface text varies.

**How to avoid:**
1. **Unique editorial insights per page.** Each comparison must contain at least one observation that could NOT be generated from the scoring data alone. Examples: "Python's readability advantage over Java becomes especially apparent in ML codebases where scientists -- not developers -- write the code," or references to specific community discussions, real-world migration stories, or architectural tradeoffs.
2. **Vary the structure.** Not every comparison should follow the same section order. Group some by use-case ("For web development..."), others by dimension ("Looking at expressiveness..."), others by audience ("If you're a data scientist choosing between...").
3. **Add genuinely unique data.** Include information not derivable from the beauty index scores: ecosystem size comparisons (npm vs PyPI package counts), job market data, framework availability, or community sentiment from real sources.
4. **Implement editorial review sampling.** Manually review at least 10% of generated pages (65 pages) before publishing. Spot-check for structural repetition.
5. **Test with Google's own questions.** For each enriched page, answer: "Does this page provide substantial value beyond what combining the two individual language pages would give?" If no, the page will fail.
6. **Consider consolidation.** 650 pages may be too many. If 200 comparisons have near-identical scores (e.g., both languages score 7.2 vs 7.4 on all dimensions), those pages add no unique value. Consider 301-redirecting the weakest to a "similar languages" hub page.

**Warning signs:**
- Google Search Console shows bulk "Crawled -- currently not indexed" for VS pages after enrichment goes live
- All 650 pages have the same average word count (within 5%) -- signals template uniformity
- CopyScape or similar tools show >60% content overlap between arbitrary page pairs
- GSC "Page indexing" report shows declining indexed VS pages over 30 days
- No VS page ranks for any query in GSC Performance report

**Phase to address:**
Content enrichment phase (the single highest-risk task in the milestone). This must be the FIRST phase so that if the approach fails quality checks, the strategy can pivot before other phases are built on top of it.

---

### Pitfall 2: Lastmod Dates That Destroy Google's Trust in Your Entire Sitemap

**What goes wrong:**
Google maintains a per-sitemap trust rating for lastmod accuracy. If lastmod dates are inaccurate, Google stops trusting ALL lastmod dates from that sitemap -- not just the incorrect ones. The trust system is binary: full trust or none. Common mistakes that trigger distrust: (1) setting all 1,184 pages to the same build date on every deploy, (2) updating lastmod on pages where content hasn't actually changed, (3) using file modification timestamps (git checkout changes all mtimes).

If you regenerate the sitemap on every build and all pages get `new Date()` as lastmod, Google sees 1,184 pages "updated" on every deploy. After 2-3 deploys with no actual content changes, Google learns to ignore your lastmod entirely.

**Why it happens:**
Astro's `@astrojs/sitemap` has no built-in per-page lastmod support. The `serialize` function requires custom implementation. The easiest implementation -- `lastmod: new Date()` -- is the worst one. Developers also confuse "build date" with "content modification date."

**How to avoid:**
1. **Track actual content modification dates.** For content collection pages (blog posts, EDA pages), use frontmatter `updatedDate` or `publishDate` fields. For programmatic pages (VS comparisons, tool pages), track the date the underlying data last changed, not the build date.
2. **Never update lastmod without a content change.** If a page's content hasn't changed, its lastmod should remain the same across builds. This means persisting lastmod values between builds, not regenerating them.
3. **Use git log for static pages.** For pages like `/about/` or `/contact/`, use `git log -1 --format=%cI -- src/pages/about.astro` at build time to get the actual last-modified date from version control. Cache these values.
4. **Different strategies per page type:** Blog posts use frontmatter dates. EDA pages use the data module's last-modified date. VS pages use the date the comparison data was last recalculated. Static pages use git history.
5. **Validate before deploy.** Build a test that checks: no two consecutive builds produce different lastmod values for pages whose content files haven't changed.

**Warning signs:**
- All sitemap entries have identical `<lastmod>` dates
- Lastmod dates change on every build even when no content changed
- Google Search Console "Sitemaps" report shows "processed" but crawl rate doesn't increase after content updates
- Lastmod dates are in the future or predate the site's creation

**Phase to address:**
Sitemap phase. Implement AFTER content enrichment (so VS page lastmod dates reflect actual enrichment dates) but BEFORE final deploy verification.

---

### Pitfall 3: Font Swap Causing CLS Regression When Migrating from Google Fonts CDN to @fontsource

**What goes wrong:**
Google Fonts CDN serves optimized CSS with `font-display: swap` and uses a two-stage loading strategy (CSS first via preconnect, then font files). When switching to self-hosted @fontsource, the font files are now served from the same origin but the browser's loading priority changes. Without proper preload hints, the browser discovers the font declaration only when it parses the CSS file, which is too late -- text renders with the fallback font first, then shifts when the custom font loads (FOUT). This creates measurable CLS regression.

Astro does not inline CSS by default (it uses external stylesheets for caching efficiency). This means the @font-face declaration lives in an external CSS file that the browser must download and parse before it even knows a custom font exists. The font file download starts AFTER CSS parsing, creating a guaranteed two-step waterfall.

**Why it happens:**
Google Fonts CDN uses `preconnect` hints that prime the connection before the CSS is even parsed. With self-hosting, developers remove the preconnect but forget to add `preload` for the font files themselves. The result is slower font loading despite eliminating the third-party round-trip.

Additionally, Fontsource packages include multiple font weights and formats. If you import the full package (`import '@fontsource/inter'`), you may load more font variants than Google Fonts was serving, increasing total download size.

**How to avoid:**
1. **Add explicit `<link rel="preload">` tags for each font file** in `<head>`, with `as="font"`, `type="font/woff2"`, and `crossorigin` (the crossorigin attribute is REQUIRED even for same-origin fonts).
2. **Import only the weights you use.** Instead of `import '@fontsource/inter'`, use `import '@fontsource/inter/400.css'` and `import '@fontsource/inter/700.css'`.
3. **Use only WOFF2 format.** All browsers that support preload also support WOFF2. Don't include WOFF or TTF fallbacks -- they add weight for no benefit.
4. **Consider Astro's experimental Fonts API** (stable in Astro 6, experimental in Astro 5). It handles preloading, fallback generation, and provider configuration automatically. If upgrading to Astro 6 is in scope, the Fonts API eliminates most manual font optimization.
5. **Use Fontaine or Capsize for fallback font metrics.** Generate a CSS `@font-face` override that adjusts ascent, descent, and line-gap of the fallback font to match the custom font's metrics. This reduces CLS from ~0.45 to ~0.06 (documented measurement). Note: Fontaine requires a `resolvePath` configuration pointing to the font files in node_modules when used with Vite/Astro.
6. **Measure before and after.** Run Lighthouse CLS measurement on 5 representative pages before removing Google Fonts CDN. Run again after migration. CLS must not increase.

**Warning signs:**
- Lighthouse CLS score increases after font migration
- "Flash of unstyled text" visible on page load (test with browser DevTools network throttling set to "Slow 3G")
- Font files not appearing in the browser's preload list (DevTools Network tab, filter by "font")
- Multiple font weights loading that weren't used before (compare network waterfall before/after)

**Phase to address:**
Font migration phase. Should be a standalone phase with its own before/after performance measurement. Not bundled with content changes -- font performance regressions are hard to diagnose when mixed with other changes.

---

### Pitfall 4: Noindex on Pagination Pages Severing Google's Crawl Path to Older Content

**What goes wrong:**
Adding `<meta name="robots" content="noindex, follow">` to blog pagination pages (page 2, 3, etc.) and tag pages seems like good crawl budget management. But if those pagination pages are the ONLY crawl path to older blog posts, noindexing them can cause Google to deprioritize crawling those URLs entirely. Google confirmed that noindexed pages still get crawled (the crawl budget is already spent by the time Google sees the noindex tag), so the crawl budget savings are illusory. Worse, Google may eventually reduce crawl frequency of consistently noindexed URLs, breaking the link chain to older content.

The specific risk: if blog pagination page 3 links to post X and post Y, and no other page on the site links to those posts, noindexing page 3 makes X and Y effectively orphaned in Google's crawl graph.

**Why it happens:**
SEO advice often conflates "noindex" with "don't waste crawl budget." But noindex only prevents indexing, not crawling. The page still consumes crawl budget. For a 1,184-page site with 6 pagination pages and a handful of tag pages, the crawl budget impact is negligible -- Google crawls millions of pages per day. The real risk is creating orphan pages.

**How to avoid:**
1. **Verify no content is ONLY reachable through pagination.** Before adding noindex, confirm every blog post is linked from at least one indexable page (the blog landing page, a related posts section, an archive page, or the sitemap).
2. **Use `noindex, follow` -- never `noindex, nofollow`.** The `follow` directive tells Google to still follow links on the page, preserving the crawl path even though the page itself won't be indexed.
3. **Do NOT combine noindex with robots.txt disallow.** If robots.txt blocks the page, Google never sees the noindex tag and may still index the page based on external signals. These directives conflict.
4. **Do NOT add noindex to page 1 of pagination.** Only pages 2+ should be noindexed. Page 1 IS the blog listing and must remain indexed.
5. **For tag pages: noindex only tags with fewer than 3 posts.** Tags with substantial post counts have genuine value as topic hubs. Only thin tag pages (1-2 posts) should be noindexed.
6. **Add a comprehensive `/blog/archive/` page** that links to ALL posts (or at minimum, all post URLs appear in the sitemap) to ensure no orphans.

**Warning signs:**
- After adding noindex, GSC shows blog posts that were previously indexed becoming "Discovered -- currently not indexed"
- Blog posts from 6+ months ago show zero impressions in GSC Performance
- GSC "Links" report shows internal links dropping for older posts
- Sitemap shows posts as submitted but GSC shows them as not indexed

**Phase to address:**
Noindex implementation phase. Must be paired with an orphan-page audit: before adding any noindex tags, verify internal link coverage for all blog posts.

---

### Pitfall 5: CSS Code Splitting Investigation Leading to Breaking Changes

**What goes wrong:**
Astro's CSS code splitting is deeply integrated with Vite's build pipeline. Setting `vite.build.cssCodeSplit = false` in Astro config completely breaks all CSS in production builds (documented Astro issue #4413). Attempting to debug the 132KB homepage CSS bundle by modifying Vite's code splitting configuration can cause site-wide CSS failures that are only visible in production builds, not in dev mode.

Additionally, Astro's 4KB `assetsInlineLimit` threshold means small CSS chunks get inlined while larger ones become external files. This creates inconsistent loading behavior where some pages inline their styles and others link to external stylesheets. Changing this threshold affects all pages, not just the homepage.

**Why it happens:**
The 132KB homepage CSS bundle likely includes styles from components used across the site (shared layout, header, footer, theme system) plus route-specific styles. Astro bundles shared CSS into chunks that get linked from multiple pages. The "bloat" may actually be intentional CSS sharing -- reducing it for the homepage could increase CSS requests on other pages.

**How to avoid:**
1. **Diagnose before fixing.** Run `npx astro build` and examine the `dist/_astro/` directory. Map which CSS chunks are shared across pages vs route-specific. The 132KB may be reasonable if it's cached and shared.
2. **Never set `cssCodeSplit: false`.** This is a known broken configuration in Astro.
3. **Use `assetsInlineLimit` carefully.** Changing it from the default 4096 affects ALL pages. Test the full build output, not just the homepage.
4. **Target component-level optimization.** Instead of changing build config, audit which components import unnecessarily large CSS. Look for: Tailwind classes that could be purged, component CSS that's imported globally, third-party library CSS that's bundled but unused.
5. **Accept some CSS sharing.** A 132KB shared CSS file that's cached across all 1,184 pages may be better for overall performance than 1,184 smaller per-page CSS files.
6. **Test in production mode only.** `astro dev` does not apply CSS code splitting. Always verify CSS changes with `astro build && astro preview`.

**Warning signs:**
- CSS disappears entirely in production build after config changes
- Lighthouse performance score drops on pages OTHER than the homepage after optimization
- Build output shows significantly more CSS files than before
- Dev mode works perfectly but production build has missing styles

**Phase to address:**
CSS investigation phase. Should be an INVESTIGATION task first (measure, diagnose, analyze) before any code changes. If the 132KB is mostly shared cached CSS, the correct fix may be "document and accept" rather than "restructure."

---

### Pitfall 6: Meta Description Fixes Creating New Truncation Problems

**What goes wrong:**
When fixing meta descriptions that are too long (being truncated in SERPs), developers often over-correct to exactly 155 characters. But Google does not have a hard character limit -- it uses pixel width, which varies by character. A description of 155 characters using wide characters (W, M, m) takes more space than 155 characters of narrow characters (i, l, t). The result: descriptions that look correct by character count still get truncated in SERPs.

Additionally, Google frequently ignores meta descriptions entirely and generates its own from page content. Over-optimizing description length is wasted effort if the page content doesn't match what Google thinks the user wants to see.

**Why it happens:**
SEO tools report character counts, not pixel widths. Developers target a character count and call it done. They also don't test on mobile, where descriptions truncate at approximately 120 characters -- shorter than desktop's ~155 characters.

**How to avoid:**
1. **Front-load the critical message in the first 120 characters.** This ensures mobile display captures the key information even if the rest is truncated.
2. **Target 150-155 characters total** but don't obsess over exact counts. The goal is to communicate the page's value proposition clearly, not to hit an exact number.
3. **For programmatic pages (VS comparisons), generate descriptions that vary in structure** -- not just variable substitution. "Python vs Java: which language..." is better than "Compare Python and Java across 6 aesthetic dimensions" on all 650 pages.
4. **Test with Google's SERP preview tool** or browser extension that shows actual pixel widths.
5. **Accept that Google will rewrite some descriptions.** Focus on making descriptions accurate and compelling rather than length-perfect. Google overrides descriptions 60-70% of the time regardless.

**Warning signs:**
- After fixing, GSC shows "meta description issues" in a different set of pages (over-correction)
- All 650 VS pages have identically structured descriptions (template pattern detection)
- Mobile SERP snippets show truncated descriptions that end mid-sentence

**Phase to address:**
Can be addressed in any phase since it's a relatively low-risk text change. Best done during content enrichment when VS page templates are already being modified.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Setting all lastmod to build date | Quick implementation, passes linting | Google stops trusting ALL sitemap dates; crawl priority lost | Never -- defeats the purpose of lastmod |
| Template-only VS page enrichment (no editorial variation) | Can generate all 650 pages in one build | Potential scaled content abuse penalty affecting entire site, not just VS pages | Never -- Google penalties are site-wide |
| Importing full @fontsource package instead of per-weight | Simpler import, fewer lines | Downloads unused weights, increases page weight by 100-400KB | Never -- always import specific weights |
| Using `cssCodeSplit: false` in Astro config | Appears to simplify CSS management | Breaks ALL CSS in production builds | Never -- known Astro bug |
| Adding noindex without orphan page audit | Quick crawl budget optimization | Older blog posts become unreachable to Google | Only after verifying all posts have alternative crawl paths |
| Skipping CLS measurement during font migration | Faster migration, fewer test steps | Invisible performance regression that affects Core Web Vitals ranking signal | Never -- CLS measurement takes 5 minutes per page |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| @fontsource + Astro CSS pipeline | Importing font CSS globally causes it to be bundled into every page's CSS chunk | Import font CSS in the Layout component so it's in the shared CSS chunk, and add preload hints in `<head>` |
| @astrojs/sitemap serialize function | Reading HTML files from dist/ during serialize to extract dates -- N+1 performance at scale | Pre-compute lastmod dates during content collection loading and pass through page props or a build-time cache file |
| Noindex meta + @astrojs/sitemap filter | Adding noindex to pages but still including them in sitemap sends contradictory signals | Exclude noindexed pages from sitemap using the `filter` option. Noindex pages should not appear in sitemaps |
| Fontaine + Vite in Astro | Missing `resolvePath` configuration causes Fontaine to fail silently at build time | Must configure `resolvePath` to point to font files in node_modules; verify override font-face appears in built CSS |
| Google Search Console + bulk page changes | Deploying 650 enriched pages + font changes + noindex all at once | Deploy changes in waves: content first, wait 1-2 weeks for indexing, then technical changes. Allows attribution of any ranking changes |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Parsing 1,184 HTML files in sitemap serialize function | Build time increases 30-60 seconds; memory spikes during build | Pre-compute dates in a JSON cache file during content loading, read cache in serialize | At 500+ pages -- O(n) file reads during a synchronous build step |
| 650 VS page enrichment at build time with API calls or LLM generation | Build time balloons from minutes to hours; CI timeout failures | Pre-generate enrichment content as static data files (JSON/TypeScript), import at build time. Never call external APIs during build | At 100+ pages with per-page API calls |
| Font preload hints for multiple weights | Each preload link adds a high-priority network request; 4+ preloads can delay other critical resources | Preload only the primary body font weight (400) and let other weights load naturally | At 3+ preloaded font files |
| Full CSS bundle analysis on every build | Running source-map analysis or bundle size checks adds minutes to CI | Run CSS analysis as a separate CI step, not part of every build. Cache results between builds if content hasn't changed | At 1,000+ pages with complex CSS |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Self-hosted font files served without proper cache headers | Fonts re-downloaded on every page visit; performance regression | Configure GitHub Pages or CDN to serve font files with `Cache-Control: public, max-age=31536000, immutable` |
| Noindex meta tag left on production pages after staging/testing | Entire sections of site deindexed by Google | Never add noindex during development/testing. Add it in a dedicated production-only deployment step with verification |
| Meta descriptions containing user-provided or data-derived content without sanitization | XSS via meta tag injection if description data contains HTML entities | Ensure all meta description values are HTML-escaped; Astro handles this in JSX expressions but verify for raw string interpolation |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| FOUT (Flash of Unstyled Text) after font migration | Users see text in system font, then a jarring shift to custom font on every page load | Preload primary font weight and use Fontaine/Capsize for fallback metrics matching |
| Enriched VS pages that read like AI-generated content | Users (and Google) perceive content as low-quality filler, reducing trust in the entire site | Write enrichment content that demonstrates genuine expertise: mention specific frameworks, real-world use cases, community consensus, and architectural implications |
| Meta descriptions that are keyword-stuffed during SEO fix | Google ignores them and generates its own; users in SERPs see generic snippets | Write descriptions for humans: answer "why should I click this?" in one sentence |
| Noindexed tag pages that were useful navigation for returning visitors | Users who bookmarked `/blog/tags/kubernetes/` find it no longer appears in search results | Only noindex genuinely thin tag pages (1-2 posts); keep substantive tag pages indexed |

## "Looks Done But Isn't" Checklist

- [ ] **Font migration:** Looks complete when fonts render correctly in dev mode -- verify CLS score in production build with Lighthouse on 3G throttling
- [ ] **Lastmod implementation:** Looks complete when sitemap shows dates -- verify dates don't all change on a content-free rebuild by building twice and diffing sitemaps
- [ ] **VS page enrichment:** Looks complete when word count exceeds 500 per page -- verify no two pages share more than 40% content overlap (sample 20 random pairs)
- [ ] **Noindex tags:** Looks complete when meta tags appear in HTML -- verify GSC still shows all blog posts as indexed 2-4 weeks after deployment
- [ ] **CSS investigation:** Looks complete when bundle size is documented -- verify the analysis covers production build output, not dev mode
- [ ] **Meta descriptions:** Looks complete when character counts are in range -- verify mobile truncation doesn't cut off mid-sentence (test at 120 chars)
- [ ] **Sitemap filter:** Looks complete when noindexed pages are excluded -- verify no page has BOTH a sitemap entry AND a noindex tag (contradictory signals)
- [ ] **Font preload:** Looks complete when `<link rel="preload">` appears in HTML -- verify the `crossorigin` attribute is present (REQUIRED even for same-origin fonts)
- [ ] **Enrichment uniqueness:** Looks complete when content varies between pages -- verify structural variation (section ordering, heading patterns) not just variable substitution

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Scaled content abuse penalty on VS pages | HIGH (4-12 weeks) | 1. Identify affected pages in GSC. 2. Either dramatically improve content quality with genuine editorial value or 301-redirect thin pages to hub pages. 3. Request reconsideration. 4. Wait 2-3 core update cycles (typically 4-12 weeks). Recovery rate is approximately 70% with genuine content improvements. |
| Lastmod trust destroyed | MEDIUM (2-4 weeks) | 1. Fix all lastmod dates to be accurate. 2. Submit updated sitemap. 3. Wait for Google to rebuild trust -- typically 2-4 weeks of accurate dates. 4. Verify via GSC crawl stats that crawl rate increases after content updates. |
| CLS regression from font migration | LOW (1-2 hours) | 1. Revert font changes. 2. Add preload hints. 3. Redeploy. CLS recovers immediately on next Lighthouse run. Core Web Vitals impact in GSC takes 28 days to update. |
| Orphaned blog posts from noindex | MEDIUM (2-4 weeks) | 1. Remove noindex from affected pages. 2. Add internal links from indexed pages to orphaned posts. 3. Submit affected URLs for reindexing in GSC. 4. Wait for recrawl cycle. |
| CSS breakage from build config changes | LOW (immediate) | 1. Revert config changes. 2. Rebuild. CSS recovers immediately in next deploy. No SEO impact if caught before deployment. |
| Meta descriptions all rewritten by Google | LOW (none needed) | This is normal behavior. Google overrides 60-70% of meta descriptions. Focus on ensuring page content accurately reflects what users search for. No recovery needed -- Google's rewrites are usually better. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Scaled content abuse on VS pages | Phase 1: Content Enrichment | Sample 20 random page pairs for content overlap (<40%); verify structural variation; manual editorial review of 65+ pages; check GSC indexing status 2 weeks post-deploy |
| Lastmod trust destruction | Phase 2: Sitemap Enhancement | Build twice without content changes; diff sitemaps; verify dates are stable; confirm per-page-type date strategies are correct |
| CLS regression from font swap | Phase 3: Font Migration | Lighthouse CLS measurement on 5 pages before AND after; test on 3G throttling; verify preload hints with `crossorigin`; confirm no extra font weights loaded |
| Noindex orphaning blog posts | Phase 4: Noindex Implementation | Audit internal links before adding noindex; verify every blog post has 2+ internal links from indexed pages; monitor GSC indexing for 2 weeks post-deploy |
| CSS build breakage | Phase 5: CSS Investigation | Never modify Vite build config without full production build test; run Lighthouse on 5 representative pages; compare build output file counts before/after |
| Meta description truncation | Phase 1 or Phase 4 (low risk, can bundle) | Mobile SERP preview test on 10 representative pages; verify first 120 chars contain key message; check no duplicate descriptions across pages |
| Deploying all changes at once | Deployment sequencing | Deploy phases 1-2 weeks apart; monitor GSC between each deploy; attribute ranking changes to specific phases |

## Sources

- [Google Scaled Content Abuse Policy Guide](https://www.breaklineagency.com/guide-to-googles-scaled-content-abuse/) -- Comprehensive analysis of violation patterns
- [Programmatic SEO After March 2026](https://www.digitalapplied.com/blog/programmatic-seo-after-march-2026-surviving-scaled-content-ban) -- 60-90% ranking drops documented; recovery strategies
- [Google December 2025 Helpful Content Update](https://dev.to/synergistdigitalmedia/googles-december-2025-helpful-content-update-hit-your-site-heres-what-actually-changed-2bal) -- "Experience dilution" targeting
- [Google March 2026 Core Update](https://orangemonke.com/blogs/google-march-core-update-complete/) -- Latest update impact on thin/programmatic content
- [Google Block Search Indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) -- Official noindex documentation
- [Google Robots Meta Tag Specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) -- Canonical reference for meta robots
- [Noindexed Pages Do Not Impact Crawl Budget](https://www.searchenginejournal.com/google-noindexed-pages-do-not-impact-crawl-budget/472870/) -- Google confirmation that noindex doesn't save crawl budget
- [Google Lastmod Date Not an SEO Hack](https://www.seroundtable.com/google-lastmod-date-seo-hack-39318.html) -- John Mueller on lastmod accuracy
- [Google and Bing Stress Lastmod Importance](https://yoast.com/lastmod-xml-sitemaps-google-bing/) -- Trust rating per sitemap
- [Adding Accurate lastmod to Astro Sitemap](https://www.printezisn.com/blog/post/adding-accurate-lastmod-tags-to-your-astro-sitemap/) -- Implementation guide with serialize gotchas
- [Astro Sitemap Integration Docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- Official configuration reference
- [Fontsource, Fontaine, Tailwind and Vite Gotchas](https://aaronjbecker.com/posts/fontsource-fontaine-tailwind-vite/) -- Vite bundling issues with font packages
- [Reduce Font CLS in Astro with Fontaine](https://eatmon.co/blog/using-fontaine-with-astro) -- CLS reduced from 0.454 to 0.064
- [Astro Custom Fonts Guide](https://docs.astro.build/en/guides/fonts/) -- Official font setup documentation
- [Astro Experimental Fonts API](https://docs.astro.build/en/reference/experimental-flags/fonts/) -- Experimental in Astro 5, stable in Astro 6
- [Vite assetsInlineLimit Invalid Issue](https://github.com/withastro/astro/issues/11540) -- String vs number bug
- [cssCodeSplit=false Breaks All CSS](https://github.com/withastro/astro/issues/4413) -- Known Astro issue
- [Astro Styles and CSS Documentation](https://docs.astro.build/en/guides/styling/) -- 4KB inline threshold behavior
- [Web Font Preload Best Practices](https://web.dev/articles/font-best-practices) -- crossorigin attribute requirement
- [Optimize Web Fonts](https://web.dev/learn/performance/optimize-web-fonts) -- Google's performance guidance
- [Ideal Meta Description Length 2026](https://www.safaridigital.com.au/blog/meta-description-length/) -- 150-160 chars, 120 for mobile
- [Astro Build Optimization for 10,000+ Pages](https://astro.build/blog/experimental-static-build/) -- Build performance at scale

---
*Pitfalls research for: SEO audit fixes on Astro 5 portfolio site (v1.21 milestone)*
*Researched: 2026-04-15*
