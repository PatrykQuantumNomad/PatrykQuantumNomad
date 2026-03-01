# Traditional SEO Audit Report

**Site:** https://patrykgolabek.dev/
**Date:** 2026-03-01
**Auditor:** Quality Assurance Agent
**Scope:** Full site including EDA Visual Encyclopedia pre-deployment review

---

## Executive Summary

The site demonstrates strong SEO fundamentals across meta tags, structured data, and
internal linking. The infrastructure is well-architected with centralized SEO
components, comprehensive JSON-LD coverage, and proper canonical URLs. The primary
issues are concentrated in three areas: (1) missing OG images for pages that do not
have dedicated generators, (2) empty alt text on blog cover images, and (3) the
absence of a `trailingSlash` configuration in Astro which could cause indexing
ambiguity. The EDA Visual Encyclopedia section is the strongest part of the site from
an SEO perspective, with thorough breadcrumbs, structured data, and OG image
generation for every page type.

**Issue counts by severity:**

| Severity | Count |
|----------|-------|
| Critical | 0     |
| Major    | 5     |
| Minor    | 12    |
| Info     | 8     |

---

## 1. Meta Tags and Head Elements

### 1.1 Title Tags

**Status: GOOD with minor issues**

All page types set explicit title tags via the centralized `SEOHead.astro` component.
Titles follow a consistent `Page Name | Section` or `Page Name -- Patryk Golabek`
pattern.

- [Info] Homepage title is dynamically generated from `siteConfig.roles`:
  `Patryk Golabek -- Cloud-Native Architect & AI/ML Engineer`
  (approximately 58 chars -- within the 50-60 char guideline).
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/index.astro:22`

- [Info] Blog post titles use intelligent truncation at line 93-97 of
  `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/[slug].astro`
  to stay under 65 chars. Good practice.

- [Minor] **SEO-01: EDA sub-section index pages have generic titles.** Pages like
  `Foundations | EDA Visual Encyclopedia` (34 chars) and
  `Reference | EDA Visual Encyclopedia` (35 chars) are short and miss keyword
  opportunities. Consider expanding to include "Exploratory Data Analysis" in at least
  some of these.
  **Files:**
  - `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/eda/foundations/index.astro:31`
  - `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/eda/reference/index.astro:30`
  - `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/eda/case-studies/index.astro:30`

- [Minor] **SEO-02: Tools index title is short.** `Tools | Patryk Golabek` (22 chars)
  wastes significant title real estate. Consider:
  `Free Developer Tools -- Dockerfile, Compose & K8s Analyzers | Patryk Golabek`.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/tools/index.astro:6`

### 1.2 Meta Descriptions

**Status: GOOD**

All page types provide explicit meta descriptions via `SEOHead.astro`. Descriptions
are keyword-rich and within recommended lengths.

- [Info] The `description` prop in `Layout.astro` defaults to
  `Patryk Golabek -- Cloud-Native Software Architect` (line 31) which is only 49
  chars -- below the 150-160 char guideline. However, every page in the codebase
  explicitly passes a longer description, so this default is only a safety net.

### 1.3 Canonical URLs

**Status: GOOD**

- Canonical URLs are automatically generated from `Astro.url.pathname` combined with
  `Astro.site` at
  `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/SEOHead.astro:18`.
- `astro.config.mjs` sets `site: 'https://patrykgolabek.dev'` (line 14), ensuring
  consistent canonical URLs.

- [Major] **SEO-03: No `trailingSlash` configuration in `astro.config.mjs`.** Astro
  defaults to `"ignore"` which means the same page could be indexed at both
  `/eda/techniques/histogram/` and `/eda/techniques/histogram`. This can cause
  duplicate content issues. All internal links consistently use trailing slashes, but
  without the explicit setting, Astro will not enforce it and external links or direct
  URL entry could reach non-slash variants.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/astro.config.mjs`
  **Recommendation:** Add `trailingSlash: 'always'` to the Astro config.

### 1.4 Open Graph Tags

**Status: GOOD with one gap**

The `SEOHead.astro` component outputs all required OG tags: `og:type`, `og:title`,
`og:description`, `og:url`, `og:site_name`, `og:locale`, plus conditional image tags
with width/height/type/alt when `ogImage` is provided.

- [Major] **SEO-04: OG image hardcoded as `image/png` for all images.** At line 47 of
  `SEOHead.astro`, `og:image:type` is always `image/png`. If an SVG cover image is
  ever used this would be incorrect. Currently all OG images are PNG, so this is not
  broken, but it is fragile.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/SEOHead.astro:47`

- [Minor] **SEO-05: Homepage and several pages share the same default OG image.**
  The `Layout.astro` defaults `ogImage` to `/open-graph/default.png` (line 37).
  Pages that do not override this (about, contact, tools/index, projects, blog tags)
  will all share the same OG preview on social media, reducing click-through
  differentiation.
  **Files:**
  - `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/about.astro` (no ogImage)
  - `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/contact.astro` (no ogImage)
  - `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/tags/[tag].astro` (no ogImage)

### 1.5 Twitter Card Tags

**Status: GOOD**

All required Twitter Card tags are present: `twitter:card` (adapts between `summary`
and `summary_large_image` based on ogImage presence), `twitter:title`,
`twitter:description`, `twitter:site`, and `twitter:creator`.

### 1.6 Viewport Meta Tag

**Status: GOOD**

Present at `/Users/patrykattc/work/git/PatrykQuantumNomad/src/layouts/Layout.astro:69`:
`<meta name="viewport" content="width=device-width, initial-scale=1" />`

### 1.7 Robots Meta Tag

**Status: GOOD**

- Default is `index, follow` set at `SEOHead.astro:25`.
- 404 page correctly sets `robots="noindex"` at
  `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/404.astro:8`.
- No other pages override to noindex. All content pages are indexable.

### 1.8 Hreflang Tags

**Status: GOOD**

Both `en-CA` and `x-default` hreflang tags are present at `SEOHead.astro:34-35`,
pointing to the canonical URL. Appropriate for a single-language site targeting
Canadian English.

---

## 2. Structured Data (JSON-LD)

### 2.1 WebSite Schema

**Status: GOOD**

Present on every page via `Layout.astro:42-62`. Includes `SearchAction` with
`sitelinks` searchbox targeting Google. Uses `@id` anchoring for cross-referencing.

### 2.2 Person Schema

**Status: GOOD**

Comprehensive Person schema at
`/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/PersonJsonLd.astro`.
Includes `knowsAbout` (30+ skills), `sameAs` (7 external profiles), `hasOccupation`,
`alumniOf`, `contactPoint`, and `seeks` (job search intent). Rendered on the homepage.

- [Minor] **SEO-06: `estimatedSalary` in `hasOccupation` is incomplete.** The
  `MonetaryAmountDistribution` at line 106-110 is missing `minValue`, `maxValue`, and
  `median`. An incomplete salary range could confuse rich result parsers. Either
  populate it fully or remove it.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/PersonJsonLd.astro:106-110`

### 2.3 BreadcrumbList Schema

**Status: EXCELLENT**

Every page type in the site includes `BreadcrumbJsonLd` with proper hierarchy. All EDA
pages have 3-4 level breadcrumbs. Blog posts have 3-level breadcrumbs. The Beauty
Index, Database Compass, and Tools pages all include breadcrumbs.

Schema is valid with `position` (1-indexed) and `item` URL for each level.

### 2.4 BlogPosting Schema

**Status: GOOD**

Present at
`/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/BlogPostingJsonLd.astro`.
Includes `headline`, `description`, `datePublished`, `dateModified`, `author`,
`publisher`, `mainEntityOfPage`, `keywords`, `articleSection`, `wordCount`, `image`,
`about`, and `speakable`. Comprehensive coverage.

### 2.5 FAQPage Schema

**Status: GOOD**

Used strategically on high-value pages: homepage (3 questions), about page (3
questions), projects page (3 questions), and specific blog posts (Beauty Index: 3,
K8s Manifest: 6). This is good practice for featured snippet targeting.

### 2.6 EDA-specific Schema

**Status: GOOD**

`EDAJsonLd.astro` uses dual-type `["TechArticle", "LearningResource"]` for individual
EDA pages and `"Dataset"` for the landing page. Includes `proficiencyLevel`,
`learningResourceType`, `educationalLevel`, and `isBasedOn` referencing the NIST
Handbook. Well-structured for educational content.

- [Minor] **SEO-07: Static `dateModified` in EDA schema.** Both `datePublished` and
  `dateModified` are hardcoded to `"2026-02-25"` at `EDAJsonLd.astro:79`. After the
  site ships updates, `dateModified` should reflect actual modification dates.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/eda/EDAJsonLd.astro:79`

### 2.7 CollectionPage Schema

**Status: GOOD**

Blog listing page (`[...page].astro:59-79`) outputs `CollectionPage` with `ItemList`
containing individual `ListItem` entries for each post. Includes proper pagination
position calculation.

### 2.8 Missing Schema Opportunities

- [Minor] **SEO-08: No `SoftwareApplication` schema for tools.** The Dockerfile
  Analyzer, Compose Validator, and K8s Analyzer are standalone software tools. Adding
  `SoftwareApplication` schema with `applicationCategory: "DeveloperApplication"`,
  `operatingSystem: "Web"`, and `offers: { price: "0" }` could trigger rich results.
  **Note:** `DockerfileAnalyzerJsonLd.astro` and related components exist but were not
  reviewed for schema type; verify they use `SoftwareApplication`.

---

## 3. Sitemap

### 3.1 Configuration

**Status: GOOD with one issue**

The `@astrojs/sitemap` integration is configured in `astro.config.mjs:16` with
`customPages` for 5 subdomain applications.

- [Major] **SEO-09: External subdomain URLs in sitemap `customPages`.** The
  `customPages` array includes URLs on different subdomains
  (`networking-tools.patrykgolabek.dev`, `financial-data-extractor.patrykgolabek.dev`,
  etc.). Sitemap files should only contain URLs under the declared `site` origin.
  Google Search Console will reject cross-origin URLs in the sitemap. These subdomain
  apps should have their own sitemaps.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/astro.config.mjs:17-23`

### 3.2 Coverage

**Status: GOOD**

Since Astro's sitemap integration auto-discovers all static routes, the following page
types will all be included:
- Homepage, About, Contact, 404 (though 404 should ideally be excluded)
- Blog listing and individual posts
- Beauty Index and individual language pages
- Database Compass and model pages
- Tools index and individual tool pages
- All EDA pages (landing, 6 section indexes, ~90 content pages)
- Blog tag pages

- [Minor] **SEO-10: 404 page will be included in sitemap.** Astro sitemap includes
  all generated pages. The 404 page at `/404/` has `robots="noindex"` but including it
  in the sitemap sends conflicting signals. Add a `filter` function to the sitemap
  config to exclude it.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/astro.config.mjs:16`

---

## 4. Internal Linking Structure

### 4.1 Main Navigation

**Status: GOOD**

Header navigation at
`/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/Header.astro:7-17`
includes 9 top-level links: Home, Blog, Beauty Index, DB Compass, EDA, Tools,
Projects, About, Contact. Proper `aria-current="page"` for active state.

### 4.2 Footer Navigation

**Status: GOOD but incomplete**

Footer at `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/Footer.astro:37-43`
includes 6 links: Blog, Beauty Index, Tools, Projects, About, Contact.

- [Minor] **SEO-11: Footer navigation omits EDA and DB Compass.** Since the EDA Visual
  Encyclopedia is a major content section (90+ pages), it should appear in the footer
  navigation to signal its importance to crawlers and provide an additional internal
  link pathway.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/components/Footer.astro:37-43`

### 4.3 EDA Cross-Referencing

**Status: EXCELLENT**

The EDA section has thorough internal linking:
- Landing page links to all 6 section index pages and all 90+ content pages
- Section index pages link back to EDA landing and to all pages within their section
- Individual technique pages include `relatedTechniques` cross-links (pill buttons)
- Individual distribution pages include `relatedDistributions` cross-links
- Technique pages cross-link to relevant case studies via `caseStudyLinks`
- Quantitative index page links to technique detail pages from within prose
- Visual breadcrumbs on every page provide upward navigation

### 4.4 Orphan Pages

**Status: GOOD**

No orphan pages detected. All page routes are reachable from navigation or parent
index pages. The EDA section indexes ensure every technique, distribution, foundation,
case study, and reference page has at least one inbound link from an index page plus
the EDA landing page.

### 4.5 Anchor Text Quality

**Status: GOOD**

- Navigation uses clear section names ("Blog", "Projects", "EDA")
- Internal links use descriptive text ("View Projects", "Read Blog", "Explore rankings")
- EDA cross-links display technique/distribution names rather than generic text
- Blog related posts use post titles as anchor text
- No instances of "click here" or similar low-quality anchor text found

---

## 5. Heading Hierarchy

### 5.1 Homepage (`src/pages/index.astro`)

**Status: GOOD**

- H1: `{siteConfig.name}` (Patryk Golabek) -- single H1
- H2: Expertise, Reference Guides, Tools, Latest Writing, Interested in working together?
- H3: Cloud-Native & Kubernetes, AI/ML Systems, Platform Engineering, Full-Stack
  Development, The Beauty Index, Database Compass, EDA Visual Encyclopedia, tool names,
  blog post titles

### 5.2 EDA Hub (`src/pages/eda/index.astro`)

**Status: GOOD**

- H1: EDA Visual Encyclopedia -- single H1
- H2: Section headings (Foundations, Graphical Techniques, etc.) + About This Encyclopedia
- H3: Individual card titles

### 5.3 Technique Page (`src/components/eda/TechniquePage.astro`)

**Status: GOOD**

- H1: Technique title
- H2: What It Is, Questions This Plot Answers, Why It Matters, When to Use It, How to
  Interpret, Examples, Assumptions and Limitations, See It In Action, Formulas, Python
  Example, Related Techniques
- H3: Individual formula labels, example labels

### 5.4 Blog Post (`src/pages/blog/[slug].astro`)

**Status: GOOD**

- H1: Post title
- H2: Generated from MDX content headings + Related Articles
- H3: Related post titles

### 5.5 About Page

**Status: GOOD**

- H1: About Me
- H2: Life Outside Code, Tech Stack, Career Highlights, Let's Connect
- H3: Tech stack category labels, career highlight titles

### 5.6 Contact Page

**Status: MINOR ISSUE**

- H1: Get in Touch
- H2: Email, X (Twitter), YouTube, Other places to find me

- [Minor] **SEO-12: Contact page `h2` for "Other places to find me" has weak
  semantic weight.** The `h2` tag is used for a secondary navigation section that
  could be an `h3` or styled `p` element. Not a significant SEO issue but
  suboptimal hierarchy.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/contact.astro:89`

---

## 6. Image Optimization

### 6.1 Alt Text

**Status: GOOD with one issue**

Most images have descriptive alt text:
- Hero image: "Patryk Golabek posing with Batman"
- Header logo: "Patryk Golabek"
- About page photos: "Family hike in autumn", "Relaxing with my dog", etc.
- EDA thumbnails: role="img" with `aria-label` like `"Preview for Histogram"`
- SVG chart previews: role="img" with descriptive aria-labels

- [Major] **SEO-13: Blog post cover images have empty `alt=""`.** At line 136 of
  `[slug].astro`, the cover image `<img>` tag uses `alt=""`. While this is technically
  valid (it tells screen readers to skip decorative images), cover images are content
  images that search engines can index. The alt text should describe the cover image
  content, ideally derived from the blog post's frontmatter.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/[slug].astro:136`

- [Minor] **SEO-14: Lightbox `<img>` has empty `alt=""` at rest.** The lightbox
  placeholder at line 238 starts with `alt=""` and gets populated dynamically by
  JavaScript. This is acceptable since the element is hidden by default.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/pages/blog/[slug].astro:238`

### 6.2 Image Formats

**Status: GOOD**

- Astro's `<Image>` component is used for raster images (hero photo, about page
  photos, header logo), which auto-generates optimized formats (WebP/AVIF).
- SVG illustrations are used for Beauty Index, Database Compass, and all EDA charts --
  optimal for vector content.
- OG images are dynamically generated as PNG (1200x630), which is the correct format
  for social sharing.

### 6.3 Width/Height Attributes

**Status: GOOD**

- All `<Image>` component usages include explicit `width` and `height` props, which
  Astro uses to generate proper HTML attributes and prevent CLS.
- Static `<img>` tags on the homepage (Beauty Index hero, DB Compass hero) include
  explicit `width` and `height`.

### 6.4 OG Images

**Status: GOOD**

Comprehensive OG image generation covers:
- Default image: `/open-graph/default.png` (via `default.png.ts`)
- Blog posts: `/open-graph/blog/{slug}.png` (via `[...slug].png.ts`)
- Beauty Index: `/open-graph/beauty-index.png` and `/open-graph/beauty-index/{slug}.png`
- Database Compass: `/open-graph/db-compass.png` and `/open-graph/db-compass/{slug}.png`
- Tools: Individual generators for each tool
- EDA: Overview, section-level, and individual page generators for all ~90 pages

---

## 7. URL Structure

### 7.1 URL Patterns

**Status: EXCELLENT**

All URLs are clean, keyword-rich, and human-readable:
- `/blog/{slug}/` -- blog posts
- `/beauty-index/` and `/beauty-index/{language}/` -- language rankings
- `/db-compass/` and `/db-compass/{model}/` -- database models
- `/eda/` -- EDA landing
- `/eda/techniques/{slug}/` -- graphical techniques
- `/eda/quantitative/{slug}/` -- quantitative methods
- `/eda/distributions/{slug}/` -- probability distributions
- `/eda/foundations/{slug}/` -- foundation articles
- `/eda/case-studies/{slug}/` -- case studies
- `/eda/reference/{slug}/` -- reference material
- `/tools/{tool-name}/` -- individual tools
- `/tools/{tool-name}/rules/{code}/` -- individual rule pages (long-tail SEO)
- `/projects/` -- project portfolio

### 7.2 Trailing Slash Consistency

**Status: NEEDS ATTENTION**

- All internal link `href` values consistently use trailing slashes.
- Route helper functions in
  `/Users/patrykattc/work/git/PatrykQuantumNomad/src/lib/eda/routes.ts` always append
  trailing slashes (e.g., line 29: `return \`\${prefix}\${slug}/\`;`).
- However, as noted in SEO-03, the `trailingSlash` config is not explicitly set.

### 7.3 Duplicate Content

**Status: GOOD**

- Canonical URLs are set on every page.
- No duplicate content patterns detected (no www/non-www split, no http/https split
  since the site is HTTPS-only on GitHub Pages / Cloudflare).

---

## 8. Performance SEO Signals

### 8.1 Render-Blocking Resources

**Status: GOOD**

- Google Fonts loaded via `preload` with `onload` swap pattern at
  `/Users/patrykattc/work/git/PatrykQuantumNomad/src/layouts/Layout.astro:118-129`.
  This prevents render-blocking font requests.
- `<noscript>` fallback ensures fonts load even without JavaScript.
- Preconnect hints for `fonts.googleapis.com` and `fonts.gstatic.com` (lines 116-117).

### 8.2 Font Loading Strategy

**Status: GOOD**

- Font fallback metrics are defined in
  `/Users/patrykattc/work/git/PatrykQuantumNomad/src/styles/global.css:40-51` for
  `Bricolage Grotesque` and `DM Sans`, reducing CLS from font swap.
- `display=swap` parameter in the Google Fonts URL.
- Only 4 font families loaded: Bricolage Grotesque (700, 800), DM Sans (400, 500, 700),
  Fira Code (400), Noto Sans (400, 700).

### 8.3 CSS/JS Bundling

**Status: GOOD**

- Astro static output mode (`output: 'static'` in config) generates pre-rendered HTML
  with minimal client-side JS.
- Tailwind CSS (via `@astrojs/tailwind`) produces purged, minified CSS.
- Heavy libraries (GSAP, D3) are tree-shaken and only loaded on pages that need them.
- KaTeX CSS is conditionally loaded only on pages with `useKatex={true}` via
  `/Users/patrykattc/work/git/PatrykQuantumNomad/src/layouts/EDALayout.astro:22`.
- React hydration (`client:visible`) defers interactive components until viewport
  intersection.

### 8.4 Image Lazy Loading

**Status: GOOD**

- Hero image uses `loading="eager"` and `fetchpriority="high"` (appropriate for LCP).
- All below-fold images use `loading="lazy"`.
- EDA distribution explorers use `client:visible` to defer D3 hydration.

### 8.5 Google Analytics

**Status: MINOR CONCERN**

- [Minor] **SEO-15: Google Analytics script uses `async` but is not deferred.**
  The gtag.js script at `Layout.astro:132` loads with `async`, which is standard but
  adds a parser-blocking inline script immediately after. Consider using
  `requestIdleCallback` or `setTimeout` to defer the GA initialization for better
  FCP/LCP scores. This is a marginal improvement.
  **File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/layouts/Layout.astro:132-138`

---

## 9. Robots.txt

### 9.1 Content

**Status: GOOD**

```
User-agent: *
Allow: /

Sitemap: https://patrykgolabek.dev/sitemap-index.xml
```

**File:** `/Users/patrykattc/work/git/PatrykQuantumNomad/public/robots.txt`

The robots.txt:
- Allows all crawlers access to all pages
- References the correct sitemap URL (`sitemap-index.xml` matches Astro's default
  sitemap output)
- Includes an informational comment about `llms.txt`

- [Minor] **SEO-16: No `Disallow` for utility routes.** Consider adding
  `Disallow: /open-graph/` to prevent crawlers from indexing the OG image generation
  endpoints as standalone pages. These are API routes that return PNG data, not HTML
  pages, so search engines should not attempt to index them. This is low priority since
  most crawlers will ignore non-HTML responses.

---

## 10. Page Count and Coverage

### 10.1 Route Inventory

| Section | Route Pattern | Estimated Count |
|---------|---------------|----------------|
| Homepage | `/` | 1 |
| About | `/about/` | 1 |
| Contact | `/contact/` | 1 |
| 404 | `/404/` | 1 |
| Blog listing | `/blog/`, `/blog/2/`, etc. | ~2 |
| Blog posts | `/blog/{slug}/` | ~10 |
| Blog tags | `/blog/tags/{tag}/` | ~15 |
| Beauty Index | `/beauty-index/` | 1 |
| Beauty Index languages | `/beauty-index/{slug}/` | 25 |
| Beauty Index comparisons | `/beauty-index/vs/{slug}/` | ~300 |
| Beauty Index code | `/beauty-index/code/` | 1 |
| Beauty Index justifications | `/beauty-index/justifications/` | 1 |
| Database Compass | `/db-compass/` | 1 |
| Database Compass models | `/db-compass/{slug}/` | 12 |
| Tools index | `/tools/` | 1 |
| Dockerfile Analyzer | `/tools/dockerfile-analyzer/` | 1 |
| Compose Validator | `/tools/compose-validator/` | 1 |
| K8s Analyzer | `/tools/k8s-analyzer/` | 1 |
| Tool rule pages | `/tools/{tool}/rules/{code}/` | ~160 |
| Projects | `/projects/` | 1 |
| EDA landing | `/eda/` | 1 |
| EDA Foundations index | `/eda/foundations/` | 1 |
| EDA Foundations pages | `/eda/foundations/{slug}/` | ~6 |
| EDA Techniques index | `/eda/techniques/` | 1 |
| EDA Techniques pages | `/eda/techniques/{slug}/` | 29 |
| EDA Quantitative index | `/eda/quantitative/` | 1 |
| EDA Quantitative pages | `/eda/quantitative/{slug}/` | 18 |
| EDA Distributions index | `/eda/distributions/` | 1 |
| EDA Distribution pages | `/eda/distributions/{slug}/` | 19 |
| EDA Case Studies index | `/eda/case-studies/` | 1 |
| EDA Case Study pages | `/eda/case-studies/{slug}/` | ~10 |
| EDA Reference index | `/eda/reference/` | 1 |
| EDA Reference pages | `/eda/reference/{slug}/` | ~3 |
| OG image routes | `/open-graph/**/*.png` | ~200 |
| RSS | `/rss.xml` | 1 |
| LLM text | `/llms.txt`, `/llms-full.txt` | 2 |
| **TOTAL** | | **~830+** |

### 10.2 404-Prone Patterns

**Status: GOOD**

- [Minor] **SEO-17: Beauty Index `/beauty-index/vs/` comparison pages may generate
  404s.** These pages are generated from pair combinations. If a user manually
  constructs a URL with a non-existent language pair, they will get a 404. The 404
  page itself is well-designed with navigation back to key sections.

- [Info] All dynamic routes use `getStaticPaths()`, which means only valid slugs
  produce pages. Invalid slugs will correctly 404.

---

## 11. Additional SEO Elements

### 11.1 RSS Feed

**Status: GOOD**

RSS autodiscovery link present in `Layout.astro:109`:
`<link rel="alternate" type="application/rss+xml" title="Patryk Golabek | Blog" href="/rss.xml" />`

### 11.2 LLM-Friendly Content

**Status: GOOD**

The site implements `llms.txt` (llmstxt.org spec) with both summary and full variants:
- `/llms.txt` -- brief site summary
- `/llms-full.txt` -- comprehensive content for LLM indexing
- Both linked via `<link rel="alternate">` in `Layout.astro:112-113`

### 11.3 Favicon and Web Manifest

**Status: GOOD**

Complete favicon set:
- SVG favicon (scalable)
- PNG favicons (32x32 and 16x16)
- Apple touch icon
- Web manifest (`site.webmanifest`)
- Theme color: `#c44b20` (accent color)

### 11.4 Language Declaration

**Status: GOOD**

`<html lang="en-CA">` at `Layout.astro:66`.

### 11.5 Security Headers

**Status: GOOD for SEO**

CSP, referrer policy, and permissions policy are set via meta tags. The
`referrer: strict-origin-when-cross-origin` policy is the recommended default and
does not interfere with SEO.

### 11.6 IndexNow Integration

**Status: GOOD**

The site includes an IndexNow integration (`./src/integrations/indexnow` imported in
`astro.config.mjs:9`) for instant search engine notification of new content. This is a
proactive SEO signal that accelerates indexing of new pages.

---

## Issue Summary and Prioritized Recommendations

### Major (Should Fix Before Launch)

| ID | Issue | File | Effort |
|----|-------|------|--------|
| SEO-03 | Missing `trailingSlash: 'always'` config | `astro.config.mjs` | 1 min |
| SEO-09 | External subdomain URLs in sitemap `customPages` | `astro.config.mjs:17-23` | 5 min |
| SEO-13 | Empty `alt=""` on blog cover images | `src/pages/blog/[slug].astro:136` | 10 min |
| SEO-04 | OG image type hardcoded to PNG | `src/components/SEOHead.astro:47` | 5 min |
| SEO-05 | Several pages share default OG image | about, contact, tools, tags pages | 30 min |

### Minor (Should Fix, Not Blocking)

| ID | Issue | File | Effort |
|----|-------|------|--------|
| SEO-01 | Short EDA sub-section index titles | eda/*/index.astro | 10 min |
| SEO-02 | Short tools index title | tools/index.astro:6 | 2 min |
| SEO-06 | Incomplete `estimatedSalary` in Person schema | PersonJsonLd.astro:106-110 | 5 min |
| SEO-07 | Static `dateModified` in EDA schema | EDAJsonLd.astro:79 | 15 min |
| SEO-08 | Missing `SoftwareApplication` schema for tools | tools/*/index.astro | 20 min |
| SEO-10 | 404 page included in sitemap | astro.config.mjs:16 | 5 min |
| SEO-11 | Footer omits EDA and DB Compass links | Footer.astro:37-43 | 5 min |
| SEO-12 | Weak heading hierarchy on contact page | contact.astro:89 | 2 min |
| SEO-14 | Lightbox img placeholder has empty alt | blog/[slug].astro:238 | Acceptable |
| SEO-15 | GA script not deferred | Layout.astro:132-138 | 10 min |
| SEO-16 | No Disallow for /open-graph/ in robots.txt | public/robots.txt | 2 min |
| SEO-17 | VS comparison pages 404 risk | beauty-index/vs/ | Low priority |

---

## Strengths Summary

1. **Centralized SEO architecture.** The `SEOHead.astro` component ensures consistent
   meta tags across every page. No page can accidentally omit title, description, or
   canonical tags.

2. **Comprehensive JSON-LD coverage.** 9 different schema components covering
   WebSite, Person, FAQPage, BreadcrumbList, BlogPosting, CollectionPage, Dataset,
   TechArticle/LearningResource, and tool-specific schemas.

3. **EDA section is SEO-exemplary.** Every one of the 90+ EDA pages has unique title,
   description, canonical URL, OG image, BreadcrumbList schema, and
   TechArticle/LearningResource schema. The internal linking is thorough with
   bidirectional cross-references.

4. **OG image generation at scale.** Dynamic OG image generation for blog posts,
   Beauty Index pages, DB Compass pages, and all EDA pages ensures unique social
   previews for every page.

5. **Performance-conscious font loading.** Preload with swap pattern, font metric
   overrides for CLS reduction, and noscript fallbacks.

6. **Forward-looking SEO.** IndexNow integration, llms.txt support, RSS
   autodiscovery, and speakable annotations in BlogPosting schema.
