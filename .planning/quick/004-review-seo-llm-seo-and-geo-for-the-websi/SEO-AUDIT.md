# SEO / LLM-SEO / GEO Audit -- patrykgolabek.dev

**Date:** 2026-02-13
**Site:** https://patrykgolabek.dev
**Stack:** Astro 5.17.1 (static), Tailwind CSS, GitHub Pages
**Pages analyzed:** 28 built pages (index, about, blog listing x5, blog post x1, projects, contact, 18 tag pages, OG image x1, llms.txt, rss.xml, sitemap)

---

## 1. Executive Summary

### Overall SEO Health

| Category | Score | Notes |
|----------|-------|-------|
| Traditional SEO | **Good** | Strong meta tags, structured data, sitemap, RSS. Missing OG images on static pages, no 404 page, no breadcrumbs, render-blocking font stylesheet. |
| LLM SEO | **Needs Work** | llms.txt exists but is minimal. No llms-full.txt. Entity consistency is good but content depth is shallow (only 1 local blog post). |
| GEO | **Needs Work** | Strong E-E-A-T signals in identity/bio but blog content volume is low. No FAQ-style content, no definition paragraphs optimized for AI snippets. |

### Top 5 Highest-Impact Issues

1. **No OG image on homepage, about, projects, contact, blog listing, or tag pages** -- social shares from these pages show no preview image. Only blog posts have dynamic OG images. (`src/components/SEOHead.astro` line 37: `ogImage` is conditionally rendered, and most pages pass no `ogImage` prop.)
2. **Google Fonts loaded as render-blocking `<link rel="stylesheet">`** -- `src/layouts/Layout.astro` line 72-75 loads 3 font families via a blocking stylesheet. Previous async `media="print"` strategy was replaced.
3. **No 404 page** -- `dist/404.html` does not exist. GitHub Pages will show its default 404 instead of a branded page. Lost SEO opportunity and poor UX.
4. **No `WebSite` schema with `SearchAction`** -- missing sitelinks search box opportunity in Google SERPs. Only `Person` (homepage) and `BlogPosting` (blog posts) schemas exist.
5. **Pagination pages (/blog/2/ through /blog/5/) included in sitemap with no `lastmod`** -- all 5 pagination pages are in `sitemap-0.xml` without modification dates, diluting crawl budget.

### Top 5 Highest-Impact Opportunities

1. **Add a default OG image for all non-blog pages** -- a single branded OG image (1200x630) would dramatically improve social sharing for homepage, about, projects, contact, and blog listing pages.
2. **Add `WebSite` + `SearchAction` JSON-LD** -- enables Google sitelinks search box. Simple addition to `Layout.astro` or homepage.
3. **Create `llms-full.txt`** -- provide complete page content for LLM deep indexing. Current `llms.txt` is a brief index; a full version would enable AI systems to cite the site authoritatively.
4. **Add `BreadcrumbList` structured data** -- helps Google display breadcrumbs in search results for all subpages. Currently no breadcrumbs exist anywhere.
5. **Switch to `display=swap` font preload strategy** -- replace the blocking Google Fonts stylesheet with `<link rel="preload">` + font-display swap to eliminate render-blocking CSS.

---

## 2. Traditional SEO Audit

### 2.1 Meta Tags & Title Tags

**Per-page analysis:**

| Page | Title | Length | Description | Length | Issues |
|------|-------|--------|-------------|--------|--------|
| `/` (index) | "Patryk Golabek -- Cloud-Native Architect & AI/ML Engineer" | 59 chars | "Portfolio of Patryk Golabek, Cloud-Native Software Architect with 17+ years..." | 129 chars | Title length GOOD. Description could be closer to 150-160 chars. |
| `/about/` | "About -- Patryk Golabek \| Cloud-Native Software Architect" | 58 chars | "About Patryk Golabek -- 17+ years building cloud-native systems..." | 115 chars | Description is SHORT (115 chars vs 150-160 ideal). |
| `/contact/` | "Contact -- Patryk Golabek \| Cloud-Native Architect" | 51 chars | "Get in touch with Patryk Golabek for cloud-native architecture..." | 137 chars | Good range. |
| `/projects/` | "Projects -- Patryk Golabek \| Open-Source Portfolio" | 51 chars | "Explore 16 open-source projects by Patryk Golabek..." | 113 chars | Description is SHORT. |
| `/blog/` | "Blog -- Patryk Golabek \| Cloud-Native & AI/ML Articles" | 55 chars | "Technical articles on Kubernetes, cloud-native architecture..." | 139 chars | Good. |
| `/blog/[slug]/` | "{Title} -- Patryk Golabek" | ~50 chars | Post description | Varies | Good pattern. |
| `/blog/tags/[tag]/` | "Posts tagged '{tag}' -- Patryk Golabek" | ~38 chars | "Blog posts about {tag} by Patryk Golabek" | ~41 chars | Descriptions are VERY SHORT and generic. |

**Canonical URLs:** Present on all pages via `SEOHead.astro` line 28. Generated correctly from `Astro.url.pathname` + `Astro.site`. Trailing slash consistency is maintained (all URLs end with `/`).

**Viewport, charset, lang:** All present correctly. `<html lang="en">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">` in `Layout.astro` lines 40-43.

### 2.2 Open Graph & Twitter Cards

**Present on all pages via `SEOHead.astro`:**
- `og:type` -- defaults to "website", overridden to "article" on blog posts (line 31)
- `og:title`, `og:description`, `og:url` -- present on all pages
- `og:site_name` -- "Patryk Golabek" (line 35)
- `og:locale` -- "en_CA" (line 36)
- `twitter:card` -- "summary_large_image" when OG image exists, "summary" otherwise (line 43)
- `twitter:title`, `twitter:description` -- present on all pages

**OG Image Issues:**

| Page | OG Image? | Issue |
|------|-----------|-------|
| `/` (index) | NO | No ogImage prop passed in `src/pages/index.astro` |
| `/about/` | NO | No ogImage prop passed in `src/pages/about.astro` |
| `/contact/` | NO | No ogImage prop passed |
| `/projects/` | NO | No ogImage prop passed |
| `/blog/` | NO | No ogImage prop passed in `src/pages/blog/[...page].astro` |
| `/blog/tags/[tag]/` | NO | No ogImage prop passed |
| `/blog/[slug]/` | YES | Dynamic OG image via `src/pages/open-graph/[...slug].png.ts` (1200x630) |

**Missing `og:image:alt`:** The SEOHead component does not emit `og:image:alt`. This is recommended for accessibility.

**Missing `twitter:site` and `twitter:creator`:** Neither is set. Should be `@QuantumMentat` to associate tweets with the correct account.

### 2.3 Structured Data (JSON-LD)

**Person schema (homepage only, `src/components/PersonJsonLd.astro`):**
- Present fields: `name`, `url`, `jobTitle`, `description`, `knowsAbout` (12 items), `sameAs` (6 URLs), `worksFor`, `address`
- **Missing fields that would strengthen the schema:**
  - `image` -- no profile photo URL
  - `alumniOf` -- educational background
  - `hasCredential` -- certifications
  - `email` -- contact email (already public on the site)
  - `nationality` -- Canadian
  - `@id` -- no unique ID for the entity (important for knowledge graph)

**BlogPosting schema (blog post pages, `src/components/BlogPostingJsonLd.astro`):**
- Present fields: `headline`, `description`, `datePublished`, `dateModified`, `url`, `author`, `publisher`, `mainEntityOfPage`, `keywords`, `image`
- **Missing fields:**
  - `inLanguage` -- "en" not specified
  - `wordCount` -- could be derived from remarkPluginFrontmatter
  - `articleSection` -- could map to primary tag
  - `articleBody` -- full text (optional but valuable for LLMs)
  - `isPartOf` -- reference to the blog as a whole

**Missing schema types entirely:**
- `WebSite` with `potentialAction: SearchAction` -- enables Google sitelinks search box
- `BreadcrumbList` -- no breadcrumbs on any page
- `ItemList` -- no structured list for blog listing page
- `CollectionPage` -- blog listing could use this
- `ProfilePage` -- about page could use this
- `Organization` -- Translucent Computing could be a proper entity

### 2.4 Heading Hierarchy

| Page | H1 | H2s | Issues |
|------|-----|-----|--------|
| `/` | "Patryk Golabek" | "What I Build", "Latest Writing", "Interested in working together?" | GOOD structure. |
| `/about/` | "About Me" | "Life Outside Code", "Tech Stack", "Career Highlights", "Let's Connect" | GOOD structure. |
| `/contact/` | "Get in Touch" | "Email", "X (Twitter)", "YouTube", "Other places to find me" | GOOD structure. |
| `/projects/` | "Projects" | Category headings (AI/ML, Kubernetes, Platform, Security) | GOOD structure. |
| `/blog/` | "Blog" | "Browse by Topic", year headings (2026, 2025, 2024) | Year headings use H2 -- could be H3 since "Browse by Topic" is at same level. Also: blog card titles render as H2, creating many H2s competing with section H2s. |
| `/blog/[slug]/` | Post title | Content headings | GOOD. Unique H1 per post. |
| `/blog/tags/[tag]/` | "Posts tagged '{tag}'" | Blog card titles render as H2 | BlogCard.astro line 36 uses `<h2>` for card titles even when inside tag pages -- creates competing H2s. |

**Issue in `BlogCard.astro`:** The component always renders `<h2>` for the post title (line 36). When used inside blog listing and tag pages that already have H2s for sections/years, this creates a flat heading hierarchy where post titles are at the same level as section headings.

### 2.5 Image Optimization

**Astro Image component usage:** All images use `<Image>` from `astro:assets`, which automatically:
- Converts to WebP format (confirmed in `dist/_astro/*.webp` files)
- Sets `width` and `height` attributes (prevents CLS)
- Applies `decoding="async"`

**Loading strategy:**
- Hero image (`meandbatman.jpg`): `loading="eager"` + `fetchpriority="high"` -- CORRECT for LCP image
- About page avatar: `loading="lazy"` -- should be `loading="eager"` since it is above the fold
- Gallery images: `loading="lazy"` -- CORRECT
- **Header logo (`hulk.png`):** Rendered with `loading="lazy"` by Astro default. This is the site logo visible on every page load and should be `loading="eager"`.

**Alt text quality:**
- Hero: "Patryk Golabek posing with Batman" -- descriptive and personal
- Avatar: "Anime-style portrait of Patryk Golabek at his desk" -- good
- Gallery images: descriptive ("Family hike in autumn", "Cycling outdoors", etc.)
- Header logo: alt="PG" -- MINIMAL. Should be "Patryk Golabek" or "Patryk Golabek homepage"

### 2.6 Internal Linking

**Navigation (Header.astro):** Links to Home, Blog, Projects, About, Contact. All 5 main pages are accessible from every page. Active page gets `aria-current="page"`.

**Cross-page linking analysis:**
- Homepage -> Projects (CTA button), Blog (CTA button + latest posts section), Contact (email CTA)
- Blog posts -> back to Blog listing (bottom link), tag pages (tag links)
- About -> GitHub, X, YouTube, Translucent Computing, Kubert AI, Email
- Contact -> Email, X, YouTube, GitHub, blogs
- Projects -> GitHub repos (external only), GitHub profile
- **Missing:** Blog does NOT link to Projects. Projects does NOT link to Blog. About does NOT link to Blog or Projects directly (only external links).

**No breadcrumb navigation:** No breadcrumbs on any page. This is a significant internal linking gap and a structured data opportunity.

**Footer links:** Only social icons (GitHub, X, YouTube, Translucent Computing Blog). No footer navigation to site pages.

### 2.7 Sitemap

**`sitemap-index.xml`** references `sitemap-0.xml` -- CORRECT.

**`sitemap-0.xml` contents (28 URLs):**
- `/` -- included
- `/about/` -- included
- `/blog/` -- included
- `/blog/2/` through `/blog/5/` -- included (pagination pages)
- `/blog/building-kubernetes-observability-stack/` -- included (only local post)
- 18 tag pages -- all included
- `/contact/` -- included
- `/projects/` -- included

**Issues:**
- **No `<lastmod>` on any URL** -- Astro's sitemap integration does not add modification dates by default. Search engines use lastmod to prioritize crawling.
- **Pagination pages in sitemap** -- `/blog/2/` through `/blog/5/` are included. While not harmful, these are low-value pages with duplicate content patterns. Consider using `rel="canonical"` to point paginated pages back to `/blog/` or excluding them from sitemap.
- **Tag pages in sitemap** -- all 18 tag pages are included. Some have very few posts (1 post for observability, prometheus, grafana, ollama, terraform). Consider excluding low-count tags or adding `noindex` to thin tag pages.

### 2.8 Robots.txt

**`public/robots.txt`:**
```
User-agent: *
Allow: /
Sitemap: https://patrykgolabek.dev/sitemap-index.xml
```

- Sitemap reference: CORRECT
- No pages blocked: CORRECT for this site
- **Missing:** No `Disallow` for pagination pages if desired. No specific LLM bot directives (though allowing all is the right default for discoverability).

### 2.9 RSS Feed

**`src/pages/rss.xml.ts`:**
- Includes all published posts (both local and external)
- External posts use `externalUrl` via the nullish coalescing pattern
- Title: "Patryk Golabek | Blog"
- Description: "Articles on cloud-native architecture, Kubernetes, AI/ML, and platform engineering"

**Issues:**
- **No `<atom:link>` self-reference** -- RSS best practice includes a self-referencing link
- **External posts link to external URLs** -- this is correct behavior but means RSS readers follow links off-site

### 2.10 Performance SEO

**Font loading (Layout.astro lines 69-75):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet" />
```
- `rel="preconnect"` is good for reducing DNS/TLS time
- **The final `<link rel="stylesheet">` is RENDER-BLOCKING.** The previous `media="print" onload` async loading strategy (noted in PROJECT.md decisions) has been replaced with a standard blocking stylesheet. This directly impacts LCP and Lighthouse performance score.

**Critical CSS:** Astro inlines critical CSS via its build process. The main stylesheet `about.BKd2xicp.css` is linked in the `<head>`. Astro does not split CSS per-route by default, so all pages load the same CSS bundle.

**Core Web Vitals implications:**
- **LCP:** Hero image has `loading="eager"` + `fetchpriority="high"` -- GOOD. But the render-blocking Google Fonts stylesheet delays first paint.
- **CLS:** All images have explicit `width`/`height` -- GOOD. Font swap may cause minor CLS if fonts load late.
- **FID/INP:** Heavy JS from GSAP, Lenis, vanilla-tilt, and custom cursor loaded on every page. These scripts are in `<script type="module">` so they are deferred, which is good.

### 2.11 URL Structure

- **Trailing slash consistency:** All URLs end with `/` (enforced by Astro's `trailingSlash` default + static output). Canonical URLs match.
- **Clean URLs:** `/blog/building-kubernetes-observability-stack/`, `/blog/tags/kubernetes/`, `/projects/`, `/about/`, `/contact/` -- all clean and keyword-rich.
- **Pagination:** `/blog/2/`, `/blog/3/` -- clean pattern. First page is `/blog/` (not `/blog/1/`), which is correct.

### 2.12 Missing Elements

| Element | Status | Impact |
|---------|--------|--------|
| **404 page** | MISSING | GitHub Pages shows default 404. Lost opportunity for branding, navigation, and keeping users on-site. |
| **Breadcrumbs** | MISSING | No breadcrumb navigation anywhere. Missing both visual breadcrumbs and `BreadcrumbList` schema. |
| **Author byline on blog posts** | PARTIAL | No visible "By Patryk Golabek" on posts. Author is only in JSON-LD. |
| **Last modified dates** | MISSING | `updatedDate` is in the schema but never shown visually on posts. |
| **Social sharing buttons** | MISSING | No share buttons on blog posts. |
| **Related posts section** | MISSING | No "Related posts" or "You might also like" on blog post pages. |
| **Previous/next post navigation** | MISSING | Only "Back to Blog" link. No prev/next post navigation. |
| **Reading time on blog listing** | MISSING | Reading time is shown on individual posts but not on blog cards in the listing. |

---

## 3. LLM SEO Audit

### 3.1 llms.txt

**Current file (`src/pages/llms.txt.ts`):**
- Follows the llms.txt specification: starts with `# Name`, has a blockquote bio, lists blog posts with URLs and descriptions
- Links to Projects, About, Contact pages in an "Optional" section
- All blog posts (including external) are listed with their correct URLs

**Issues:**
- **No `llms-full.txt`** -- the specification recommends a companion file with expanded content for deep indexing. This is the most impactful LLM SEO improvement available.
- **"Optional" section label is misleading** -- Projects, About, and Contact are not "optional" resources; they should be in the main section or a "Pages" section.
- **No technology or expertise section** -- the llms.txt lists blog posts but does not summarize the person's expertise areas, making it harder for LLMs to build a comprehensive entity model.
- **No links to external profiles** -- GitHub, X, YouTube, blogs are not listed, reducing cross-reference opportunities for LLMs.

### 3.2 Content Structure for LLM Parsing

**Homepage (`src/pages/index.astro`):**
- Clear identity statement: "Patryk Golabek" as H1, "Cloud-Native Architect" as subtitle
- Typing animation roles provide multiple identity labels
- "What I Build" section has 4 clear topic areas with descriptions
- **Issue:** Much of the homepage content is short taglines, not parseable paragraphs. LLMs need self-contained paragraphs to extract meaningful answers.

**About page (`src/pages/about.astro`):**
- First-person narrative with specific claims ("over 17 years", "Kubernetes before its 1.0 release")
- Tech stack organized by category -- EXCELLENT for LLM entity extraction
- Career highlights with specific accomplishments
- **Issue:** The intro paragraphs are conversational but lack definition-style statements. Compare: "I'm Patryk Golabek -- a Software Engineer" vs "Patryk Golabek is a Cloud-Native Software Architect with 17+ years of experience specializing in..."

**Blog posts:**
- Only 1 local post with full content. 10 external posts link off-site.
- Local post has heading hierarchy, code blocks, and structured content
- **Critical issue:** With only 1 local blog post, there is very little indexable content for LLMs to cite from this domain.

### 3.3 Entity Recognition

**Person entity consistency:**

| Property | Homepage | About | Contact | JSON-LD | llms.txt |
|----------|----------|-------|---------|---------|----------|
| Full name | "Patryk Golabek" | "Patryk Golabek" | "Patryk Golabek" | "Patryk Golabek" | "Patryk Golabek" |
| Title | "Cloud-Native Architect" | "Software Engineer" | "Cloud-Native Architect" | "Cloud-Native Software Architect" | "Cloud-Native Software Architect" |
| Experience | "17+ years" (tagline) | "over 17 years" | not stated | "17+ years" | "17+ years" |
| Location | "Ontario, Canada" | "Ontario, Canada" | not stated | "Ontario, CA" | "Ontario, Canada" |

**Inconsistency found:** The About page calls Patryk a "Software Engineer" while the homepage and JSON-LD use "Cloud-Native Software Architect". This inconsistency could confuse LLMs about the canonical job title.

**Technology associations:** Strong and consistent across pages. Kubernetes, AI/ML, Platform Engineering, DevSecOps mentioned repeatedly across homepage, about, JSON-LD, and llms.txt.

### 3.4 Citation-Worthy Content

**Current state:**
- **Unique insights:** The one local blog post ("Building a Complete Observability Stack for Kubernetes") provides a practical, experience-based guide. This is citation-worthy.
- **Statistics/frameworks:** The "17+ years" claim is a strong differentiator. "Pre-1.0 Kubernetes adopter" is a unique authority signal.
- **External blog posts** from Kubert AI and Translucent Computing add topic breadth but the actual content lives on other domains, so LLMs would cite those domains, not patrykgolabek.dev.

**Gaps:**
- No "how I do X" framework content
- No comparison tables or decision frameworks
- No FAQ sections
- Very limited locally-hosted content depth

### 3.5 Structured Data for LLMs

**JSON-LD completeness for entity extraction:**
- Person -> `knowsAbout` (12 technologies) -- GOOD for "what does Patryk know about?"
- Person -> `worksFor` -> Organization ("Translucent Computing") -- GOOD for "where does Patryk work?"
- Person -> `sameAs` (6 URLs) -- GOOD for cross-referencing
- **Missing:** Person -> `image`, Person -> `@id`, Person -> `email`
- **Missing relationships:** No explicit connection between Person and BlogPosting entities. Adding `author.@id` matching `Person.@id` would strengthen the entity graph.

---

## 4. GEO (Generative Engine Optimization) Audit

### 4.1 Content Authoritativeness (E-E-A-T)

**Experience signals:**
- "17+ years" mentioned in tagline, about page, JSON-LD -- STRONG
- "Kubernetes before its 1.0 release" -- STRONG unique experience marker
- "CTO and co-founder" mentioned in career highlights -- STRONG
- First-person voice throughout ("I built", "I was", "I'm deep into") -- GOOD

**Expertise signals:**
- 16 open-source repositories on GitHub -- STRONG evidence of real work
- Blog posts on specific technical topics (observability stacks, AI agents, Kubernetes management) -- GOOD
- Comprehensive tech stack listing on About page -- GOOD

**Authoritativeness signals:**
- Two blogs (Translucent Computing, Kubert AI) with cross-links -- MODERATE (external content)
- GitHub profile with active repositories -- GOOD
- **Missing:** No speaking engagements, conference talks, or community involvement mentioned
- **Missing:** No certifications listed (AWS, GCP, CKAD, CKA, etc.)
- **Missing:** No media mentions, guest posts on other platforms, or podcast appearances

**Trustworthiness signals:**
- Real name, real photo, real location -- GOOD
- Active GitHub profile with public repositories -- GOOD
- Email contact available -- GOOD
- **Missing:** No testimonials or endorsements

### 4.2 Answer-Engine Friendly Content

**Current state:** The site is NOT well-optimized for AI answer engines.

**What's missing:**
- **No "question and answer" patterns** -- no headings phrased as questions. Pages like "What is cloud-native architecture?" or "How to deploy Kubernetes observability stack" would be directly extractable by AI.
- **No definition-style paragraphs** -- the About page uses conversational language rather than extractable definitions. Compare current: "I'm Patryk Golabek -- a Software Engineer" vs needed: "Patryk Golabek is a Cloud-Native Software Architect who specializes in building production Kubernetes platforms, AI/ML systems, and developer tooling."
- **No TL;DR or summary sections** at top of blog posts
- **No FAQ sections** on any page
- **No bullet-point summaries** of key information (the About page career highlights are close but not formatted as extractable key facts)

### 4.3 Topical Authority

**Core topic clusters based on blog tags:**

| Topic Cluster | Posts | Depth |
|---------------|-------|-------|
| AI/ML & LLM Agents | 16 posts (mostly external) | BROAD coverage but hosted elsewhere |
| Kubernetes & Cloud-Native | 10 posts (mostly external) | BROAD coverage but hosted elsewhere |
| DevOps & Platform Engineering | 9 posts (mostly external) | GOOD breadth |
| Mobile (Android/iOS) | 7 posts (external, historical) | Legacy content, not current focus |
| Data Science | 11 posts (external, historical) | Legacy content |

**Issue:** The topical authority for patrykgolabek.dev specifically is very thin. Only 1 local blog post means AI systems see this domain as having minimal original content. The external posts build authority for mykubert.com and translucentcomputing.com, not for patrykgolabek.dev.

### 4.4 Source Credibility Signals

**Claims backed by evidence:**
- "16+ public repositories" -- verifiable on GitHub, linked from multiple pages
- "17+ years experience" -- consistently stated but not verified with specific dates/companies
- "Pre-1.0 Kubernetes adopter" -- specific claim, not independently verifiable from the site

**External references:** The site links to authoritative external blogs (Kubert AI, Translucent Computing) but the blog posts themselves are hosted there, not here. The site does not reference other authoritative external sources (official Kubernetes docs, CNCF, academic papers).

**Publication dates:** Visible on all blog cards and blog post pages as `<time>` elements with proper `datetime` attributes -- GOOD for freshness signals.

### 4.5 AI Snippet Optimization

**Current snippet-friendly content:**
- Blog listing tag cloud -- shows topic breadth
- "What I Build" section on homepage -- 4 concise descriptions
- Tech stack listing on About page -- categorized pills

**Missing snippet-friendly formats:**
- No numbered "how-to" lists
- No comparison tables
- No "X vs Y" content
- No FAQ schema or FAQ-formatted content
- No concise definition paragraphs (the kind Perplexity or Google AI Overview would extract)
- No "key takeaways" boxes on blog posts

---

## 5. Prioritized Recommendations

### Priority 1 -- Critical (High Impact, Low Effort)

**1.1 Add default OG image for all pages**
- **What:** Create a branded fallback OG image (1200x630) and pass it as ogImage to all pages that do not have a dynamic one.
- **Why:** Social sharing from homepage, about, projects, contact, blog listing currently shows no preview image. This dramatically reduces click-through rates from social media.
- **Where:** `src/layouts/Layout.astro` (add default ogImage), create `public/og-default.png`
- **How:** Add a static `og-default.png` to `public/`, update Layout to default `ogImage` to `${Astro.site}og-default.png` when no ogImage prop is passed.

**1.2 Create a 404 page**
- **What:** Add `src/pages/404.astro` with branded layout, navigation, and helpful links.
- **Why:** GitHub Pages serves its default 404 for missing URLs. A custom 404 keeps users on-site, maintains branding, and can include internal links (blog, projects, contact).
- **Where:** `src/pages/404.astro` (new file)
- **How:** Create a page using the Layout component with a friendly message and links to key pages.

**1.3 Fix job title inconsistency on About page**
- **What:** Change "Software Engineer" to "Cloud-Native Software Architect" on the About page to match JSON-LD and homepage.
- **Why:** LLMs look for entity consistency. Conflicting titles reduce confidence in the canonical identity.
- **Where:** `src/pages/about.astro` line 86
- **How:** Change "a Software Engineer" to "a Cloud-Native Software Architect"

**1.4 Add `twitter:site` and `twitter:creator` meta tags**
- **What:** Add `<meta name="twitter:site" content="@QuantumMentat">` and `<meta name="twitter:creator" content="@QuantumMentat">` to SEOHead.
- **Why:** Associates Twitter Card previews with the correct account. Improves discoverability when content is shared on X.
- **Where:** `src/components/SEOHead.astro`
- **How:** Add two `<meta>` tags after the existing Twitter Card tags.

**1.5 Add `inLanguage` to BlogPosting schema**
- **What:** Add `"inLanguage": "en"` to the BlogPosting JSON-LD.
- **Why:** Helps search engines and LLMs correctly identify content language.
- **Where:** `src/components/BlogPostingJsonLd.astro` line 14
- **How:** Add `"inLanguage": "en"` to the schema object.

### Priority 2 -- Important (High Impact, Medium Effort)

**2.1 Switch Google Fonts to non-blocking loading**
- **What:** Replace the render-blocking `<link rel="stylesheet">` for Google Fonts with a preload + swap strategy or use `media="print" onload="this.media='all'"` pattern.
- **Why:** The font stylesheet is render-blocking and delays First Contentful Paint and LCP. This was previously implemented (noted in PROJECT.md decisions) but reverted.
- **Where:** `src/layouts/Layout.astro` lines 72-75
- **How:** Use `<link rel="preload" href="..." as="style" onload="this.rel='stylesheet'">` with a `<noscript>` fallback.

**2.2 Add `WebSite` schema with `SearchAction`**
- **What:** Add a `WebSite` JSON-LD schema to the homepage (or all pages) with a `potentialAction` SearchAction pointing to a blog search or Google site search.
- **Why:** Enables Google's sitelinks search box in search results. This is a free SERP real estate gain.
- **Where:** `src/layouts/Layout.astro` or `src/pages/index.astro`
- **How:** Add a `<script type="application/ld+json">` with `@type: "WebSite"`, `name`, `url`, and `potentialAction` with `SearchAction`.

**2.3 Add `BreadcrumbList` structured data**
- **What:** Add breadcrumb JSON-LD to all subpages (About, Blog, Projects, Contact, Blog Post, Tag pages).
- **Why:** Google shows breadcrumbs in search results, improving click-through rate and page understanding.
- **Where:** Create `src/components/BreadcrumbJsonLd.astro`, include in Layout or individual pages.
- **How:** Generate breadcrumb data from `Astro.url.pathname`, split into segments, and create the appropriate JSON-LD structure.

**2.4 Create `llms-full.txt`**
- **What:** Create a companion to `llms.txt` that includes full page content for the About, Projects, and local blog posts.
- **Why:** The llms.txt specification recommends a full version for deep LLM indexing. This gives AI systems complete content to parse and cite.
- **Where:** `src/pages/llms-full.txt.ts` (new file)
- **How:** Build a text file that includes full bio, tech stack, project descriptions, and blog post content.

**2.5 Enrich `llms.txt` with expertise sections and external profile links**
- **What:** Add sections for "Expertise Areas", "External Profiles", and expand the page listings.
- **Why:** Current llms.txt is a basic index. Adding structured expertise information helps LLMs build a richer entity model.
- **Where:** `src/pages/llms.txt.ts`
- **How:** Add expertise bullet points (Kubernetes, AI/ML, Platform Engineering, etc.), external profile URLs (GitHub, X, YouTube, blogs), and better page descriptions.

**2.6 Add `image` and `@id` to Person schema**
- **What:** Add `"image"` (URL to the hero photo or a dedicated profile photo) and `"@id": "https://patrykgolabek.dev/#person"` to the Person JSON-LD.
- **Why:** `image` enables Google's knowledge panel to show a photo. `@id` creates a stable entity reference that other schemas can reference (like BlogPosting's `author.@id`).
- **Where:** `src/components/PersonJsonLd.astro`
- **How:** Add the image URL and @id to the schema object. Update BlogPostingJsonLd to reference `"@id": "https://patrykgolabek.dev/#person"` in the author field.

**2.7 Lengthen thin meta descriptions**
- **What:** Expand meta descriptions for About, Projects, and tag pages to 150-160 characters with keyword-rich, action-oriented copy.
- **Why:** Short meta descriptions get truncated or overridden by Google. Well-crafted descriptions improve CTR from search results.
- **Where:** `src/pages/about.astro`, `src/pages/projects/index.astro`, `src/pages/blog/tags/[tag].astro`
- **How:** Rewrite descriptions to hit 150-160 chars. Tag pages should mention the person name and count of posts.

### Priority 3 -- Beneficial (Medium Impact, Variable Effort)

**3.1 Add visible breadcrumb navigation to all subpages**
- **What:** Add a visual breadcrumb trail (Home > Blog > Post Title) to blog posts, tag pages, and other subpages.
- **Why:** Improves user navigation, internal linking, and complements the BreadcrumbList schema.
- **Where:** Create `src/components/Breadcrumbs.astro`, include in page templates.
- **How:** Build a component that reads the URL path and renders linked breadcrumb segments.

**3.2 Add author byline to blog posts**
- **What:** Add a visible "By Patryk Golabek" byline with a link to the About page on blog post pages.
- **Why:** Strengthens E-E-A-T signals for both search engines and AI answer engines. Associates content with a real person.
- **Where:** `src/pages/blog/[slug].astro` (in the header section)
- **How:** Add a line after the date/reading time: "By Patryk Golabek" linking to `/about/`.

**3.3 Add previous/next post navigation**
- **What:** Add "Previous Post" and "Next Post" links at the bottom of blog post pages.
- **Why:** Keeps users on-site, improves internal linking, reduces bounce rate.
- **Where:** `src/pages/blog/[slug].astro`
- **How:** In `getStaticPaths`, sort all posts and pass prev/next post data as props.

**3.4 Add related posts section**
- **What:** Show 2-3 related posts at the bottom of each blog post, based on shared tags.
- **Why:** Increases page views, improves internal linking, signals topic depth to search engines.
- **Where:** `src/pages/blog/[slug].astro`
- **How:** Filter posts by shared tags, exclude current post, take top 3 by tag overlap.

**3.5 Add `lastmod` to sitemap entries**
- **What:** Configure `@astrojs/sitemap` to include `lastmod` dates.
- **Why:** Search engines use lastmod to prioritize crawling. Without it, crawlers treat all pages as equally fresh.
- **Where:** `astro.config.mjs` (sitemap configuration)
- **How:** Use the sitemap integration's `serialize` option to add lastmod from post frontmatter dates or file modification times.

**3.6 Fix header logo loading strategy**
- **What:** Set `loading="eager"` on the header logo image.
- **Why:** The logo is visible on every page above the fold. Lazy-loading it delays brand impression.
- **Where:** `src/components/Header.astro` line 31
- **How:** Add `loading="eager"` to the Image component.

**3.7 Add `og:image:alt` to SEOHead**
- **What:** Add `<meta property="og:image:alt" content="...">` when an OG image is present.
- **Why:** Accessibility improvement for social media card previews.
- **Where:** `src/components/SEOHead.astro`
- **How:** Accept an `ogImageAlt` prop and render the meta tag when ogImage is present.

### Priority 4 -- Future Consideration

**4.1 Add FAQ schema and FAQ-formatted content**
- **What:** Create FAQ sections on key pages (About, specific blog posts) with `FAQPage` JSON-LD.
- **Why:** FAQ schema can trigger rich results in Google and provides directly extractable Q&A pairs for AI answer engines.
- **Where:** Individual pages or a dedicated FAQ page
- **How:** Add a Markdown component or Astro component for FAQ with auto-generated schema.

**4.2 Exclude thin tag pages from sitemap**
- **What:** Use the sitemap integration's `filter` option to exclude tag pages with fewer than 3 posts.
- **Why:** Tag pages with 1 post are thin content that dilutes crawl budget.
- **Where:** `astro.config.mjs`
- **How:** Configure `sitemap({ filter: (page) => ... })` to exclude specific patterns.

**4.3 Add footer navigation links**
- **What:** Add text links to key pages (Home, Blog, Projects, About, Contact) in the footer.
- **Why:** Footer links are crawled by search engines and improve internal link equity distribution.
- **Where:** `src/components/Footer.astro`
- **How:** Add a simple list of page links alongside the existing social icons.

**4.4 Consider adding `ProfilePage` schema to About page**
- **What:** Add a `ProfilePage` JSON-LD schema to the About page with `mainEntity` referencing the Person schema.
- **Why:** Helps search engines understand the page's purpose and strengthens the entity relationship.
- **Where:** `src/pages/about.astro`
- **How:** Add inline JSON-LD with `@type: "ProfilePage"` and `mainEntity` referencing the Person @id.

**4.5 Add `CollectionPage` + `ItemList` schema to blog listing**
- **What:** Add structured data to the blog listing page identifying it as a collection of blog posts.
- **Why:** Helps search engines understand the page structure and may trigger rich results for lists.
- **Where:** `src/pages/blog/[...page].astro`
- **How:** Add JSON-LD with `@type: "CollectionPage"` and a `mainEntity` of type `ItemList` listing the posts.

**4.6 Write more local blog content**
- **What:** Publish more original blog posts directly on patrykgolabek.dev rather than external platforms.
- **Why:** The single most impactful thing for both LLM SEO and GEO is having substantial, original, authoritative content on this domain. Currently the site has only 1 local blog post while 40 are external links.
- **Where:** `src/data/blog/`
- **How:** Write original articles on core topics (Kubernetes, AI/ML, platform engineering) hosted locally.

**4.7 Add definition-style opening paragraphs for GEO**
- **What:** Add self-contained, extractable definition paragraphs at the top of key pages that AI answer engines can directly quote.
- **Why:** AI systems prefer paragraphs that answer "who is X" or "what is X" in a single, self-contained statement.
- **Where:** `src/pages/about.astro`, `src/pages/index.astro`
- **How:** Add a paragraph like: "Patryk Golabek is a Cloud-Native Software Architect based in Ontario, Canada, with over 17 years of experience building production Kubernetes platforms, AI/ML systems, and developer tooling. He is an early Kubernetes adopter (pre-1.0) and the co-founder of Translucent Computing."
