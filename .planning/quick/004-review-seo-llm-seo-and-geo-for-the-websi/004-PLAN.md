---
phase: quick-004
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/SEO-AUDIT.md
autonomous: true
must_haves:
  truths:
    - "Comprehensive audit document exists covering traditional SEO, LLM SEO, and GEO"
    - "Every page on the site has been reviewed for meta tags, structured data, and content quality"
    - "Actionable recommendations are prioritized by impact"
  artifacts:
    - path: ".planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/SEO-AUDIT.md"
      provides: "Complete SEO/LLM-SEO/GEO audit with findings and recommendations"
      min_lines: 200
  key_links: []
---

<objective>
Conduct a comprehensive SEO, LLM SEO, and GEO audit of patrykgolabek.dev and produce a structured audit document with findings, issues, and prioritized recommendations.

Purpose: Identify gaps and opportunities across traditional search engine optimization, LLM content discoverability, and generative engine optimization before implementing any changes.
Output: `.planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/SEO-AUDIT.md` -- a detailed audit report.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@src/components/SEOHead.astro
@src/components/PersonJsonLd.astro
@src/components/BlogPostingJsonLd.astro
@src/layouts/Layout.astro
@src/pages/index.astro
@src/pages/about.astro
@src/pages/contact.astro
@src/pages/projects/index.astro
@src/pages/blog/[slug].astro
@src/pages/blog/[...page].astro
@src/pages/blog/tags/[tag].astro
@src/pages/llms.txt.ts
@src/pages/rss.xml.ts
@src/pages/open-graph/[...slug].png.ts
@src/data/site.ts
@src/content.config.ts
@src/components/Header.astro
@src/components/Footer.astro
@src/components/BlogCard.astro
@public/robots.txt
@public/site.webmanifest
@astro.config.mjs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit all pages and produce comprehensive SEO/LLM-SEO/GEO report</name>
  <files>.planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/SEO-AUDIT.md</files>
  <action>
Read every source file listed in the context section above. Also build the site (`npm run build`) and inspect the built HTML output in `dist/` for at least the homepage, about, blog listing, a blog post page, projects, and contact to verify actual rendered output matches source expectations.

Produce a comprehensive audit document at `.planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/SEO-AUDIT.md` structured as follows:

## Document Structure

### 1. Executive Summary
- Overall SEO health score (Good/Needs Work/Poor for each category: Traditional SEO, LLM SEO, GEO)
- Top 5 highest-impact issues across all categories
- Top 5 highest-impact opportunities across all categories

### 2. Traditional SEO Audit

Evaluate each of the following for EVERY page (index, about, blog listing, blog post, projects, contact, tag pages):

**Meta Tags & Title Tags:**
- Title tag: length (50-60 chars ideal), keyword placement, uniqueness per page
- Meta description: length (150-160 chars ideal), keyword inclusion, call-to-action language, uniqueness per page
- Canonical URLs: correct, no duplicates, trailing slash consistency
- Viewport, charset, lang attribute

**Open Graph & Twitter Cards:**
- OG title, description, image, type, url, site_name, locale present on all pages
- Twitter card type, title, description, image present on all pages
- OG image dimensions (1200x630 standard), alt text considerations
- Are static pages (about, projects, contact) missing OG images?

**Structured Data (JSON-LD):**
- Person schema on homepage: completeness, additional fields possible (image, alumni, hasCredential, etc.)
- BlogPosting schema on blog posts: completeness (is `inLanguage`, `wordCount`, `articleBody`, `articleSection` present?)
- Missing schema types: WebSite schema (for sitelinks search box), BreadcrumbList, ItemList for blog listing, CollectionPage, ProfilePage, Organization
- Validate against Google Rich Results test expectations

**Heading Hierarchy:**
- H1 present and unique on every page
- Logical H1 > H2 > H3 structure (no skipped levels)
- Keywords in headings

**Image Optimization:**
- Alt text quality and keyword inclusion on all images
- Image dimensions specified (width/height for CLS prevention)
- Loading strategy (eager for above-fold, lazy for below)
- Format optimization (WebP/AVIF consideration)

**Internal Linking:**
- Navigation structure coverage
- Cross-page linking (does blog link to projects? projects to blog? about to blog?)
- Breadcrumb navigation (present or missing?)
- Footer links comprehensiveness

**Sitemap:**
- All pages included? Check against actual pages
- Are pagination pages (/blog/2/, /blog/3/) correctly included or excluded?
- lastmod dates present?
- sitemap-index.xml properly referenced in robots.txt

**Robots.txt:**
- Correct directives
- Sitemap reference
- Any pages that should be blocked (pagination, tag pages?)

**RSS Feed:**
- Valid format
- All posts included
- Proper links (external vs internal)

**Performance SEO:**
- Font loading strategy (render-blocking?)
- Critical CSS/JS considerations
- Core Web Vitals implications (CLS from fonts, LCP from hero image)

**URL Structure:**
- Trailing slash consistency
- Clean, keyword-rich URLs
- Pagination URL pattern

**Missing Elements:**
- 404 page (exists or not?)
- Breadcrumbs
- Author byline on blog posts
- Last modified dates visible on content
- Social sharing buttons
- Related posts section
- Previous/next post navigation

### 3. LLM SEO Audit

Evaluate how well the site content can be discovered, parsed, and cited by large language models:

**llms.txt:**
- Current content review -- is it following the llms.txt specification correctly?
- Is there a `llms-full.txt` with complete content for deeper indexing?
- Are all relevant pages and sections represented?
- Is the information structured for easy LLM parsing?

**Content Structure for LLM Parsing:**
- Are pages structured with clear, descriptive headings that LLMs can parse as topics?
- Is there enough context in each section for an LLM to extract a meaningful answer?
- Are key facts (name, title, experience years, location, specialties) consistently stated across pages?
- Is content written in a way that could be directly quoted as an authoritative source?

**Entity Recognition:**
- Is the person entity (Patryk Golabek) clearly and consistently defined across the site?
- Are technology entities (Kubernetes, Terraform, etc.) associated with the person clearly?
- Could an LLM confidently say "Patryk Golabek is a [X] who specializes in [Y]"?

**Citation-Worthy Content:**
- Are there unique insights, statistics, or frameworks that LLMs would want to cite?
- Is the content authoritative enough to be selected over generic results?
- Are blog posts structured with clear takeaways that could appear in AI-generated summaries?

**Structured Data for LLMs:**
- JSON-LD completeness for LLM entity extraction
- Are relationships between entities clear (person -> works at -> organization, person -> knows about -> technologies)?

### 4. GEO (Generative Engine Optimization) Audit

Evaluate readiness for AI answer engines (ChatGPT Search, Perplexity, Google AI Overviews, Bing Copilot):

**Content Authoritativeness:**
- E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
- First-person experience markers ("I built", "In my experience", "After 17 years")
- Specific credentials, numbers, and proof points
- Cross-platform presence (blogs, GitHub, social) supporting authority

**Answer-Engine Friendly Content:**
- Does content have clear "question and answer" patterns that AI can extract?
- Are there definition-style paragraphs ("X is...", "This approach involves...")?
- TL;DR or summary sections at top of blog posts?
- Bullet-point lists of key information?

**Topical Authority:**
- Depth of coverage on core topics (Kubernetes, AI/ML, platform engineering)
- Internal topic clusters (do blog tags form coherent topic clusters?)
- Consistent terminology usage

**Source Credibility Signals:**
- Are claims backed by specific examples or data?
- Are external references and links to authoritative sources present?
- Is the publication date visible and recent?

**AI Snippet Optimization:**
- Are there concise, self-contained paragraphs that could be extracted as AI-generated snippets?
- Featured snippet-friendly formats (numbered lists, definition paragraphs, comparison tables)?
- FAQ-style content?

### 5. Prioritized Recommendations

Organize all findings into a prioritized action list:

**Priority 1 -- Critical (High Impact, Low Effort):**
Items that are missing and significantly hurt SEO/GEO, but are easy to add.

**Priority 2 -- Important (High Impact, Medium Effort):**
Items that would meaningfully improve discoverability but require moderate work.

**Priority 3 -- Beneficial (Medium Impact, Variable Effort):**
Nice-to-have improvements for incremental gains.

**Priority 4 -- Future Consideration:**
Items that are best practices but not urgent for this site's current stage.

Each recommendation should include:
- What: Specific change needed
- Why: SEO/LLM/GEO impact
- Where: Which file(s) to modify
- How: Brief implementation hint

DO NOT implement any changes. This task produces ONLY the audit document.
  </action>
  <verify>
The file `.planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/SEO-AUDIT.md` exists, contains all 5 sections (Executive Summary, Traditional SEO, LLM SEO, GEO, Prioritized Recommendations), is at least 200 lines long, and references specific files and code from the codebase (not generic advice).
  </verify>
  <done>
A comprehensive, site-specific SEO/LLM-SEO/GEO audit document exists with concrete findings referencing actual source files, rendered HTML, and specific line-level observations. Recommendations are prioritized by impact and include file paths and implementation hints. No changes have been made to the site itself.
  </done>
</task>

</tasks>

<verification>
- [ ] SEO-AUDIT.md exists at the correct path
- [ ] Document covers all 5 major sections
- [ ] Every page type (index, about, blog, blog post, projects, contact, tags) is analyzed
- [ ] Findings reference specific files and code, not generic SEO advice
- [ ] Recommendations are actionable with file paths and implementation hints
- [ ] No source code files were modified (audit only, no implementation)
</verification>

<success_criteria>
The audit document is comprehensive enough that a subsequent implementation task could execute all recommendations without needing to re-analyze the codebase. Every finding references specific files, line numbers, or code patterns. The prioritized recommendation list provides a clear roadmap for SEO improvements.
</success_criteria>

<output>
After completion, create `.planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/004-SUMMARY.md`
</output>
