---
phase: quick-005
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/SEOHead.astro
  - src/components/PersonJsonLd.astro
  - src/components/BlogPostingJsonLd.astro
  - src/components/BreadcrumbJsonLd.astro
  - src/layouts/Layout.astro
  - src/pages/404.astro
  - src/pages/about.astro
  - src/pages/projects/index.astro
  - src/pages/blog/tags/[tag].astro
  - src/pages/llms.txt.ts
  - src/pages/llms-full.txt.ts
  - src/pages/open-graph/default.png.ts
autonomous: true

must_haves:
  truths:
    - "All pages have an OG image (default or dynamic) for social sharing previews"
    - "Custom 404 page renders with site branding and navigation links"
    - "Job title is consistent ('Cloud-Native Software Architect') across all pages and schema"
    - "Twitter cards associate with @QuantumMentat account"
    - "BlogPosting schema includes inLanguage field"
    - "Google Fonts load without blocking first paint"
    - "Homepage includes WebSite schema with SearchAction"
    - "Subpages include BreadcrumbList structured data"
    - "llms-full.txt serves complete site content for LLM deep indexing"
    - "llms.txt includes expertise sections and external profile links"
    - "Person schema has image and @id fields; BlogPosting references author @id"
    - "Meta descriptions for About, Projects, and tag pages are 150-160 characters"
  artifacts:
    - path: "src/pages/404.astro"
      provides: "Custom 404 page"
    - path: "src/pages/open-graph/default.png.ts"
      provides: "Default OG image endpoint"
    - path: "src/components/BreadcrumbJsonLd.astro"
      provides: "Breadcrumb structured data component"
    - path: "src/pages/llms-full.txt.ts"
      provides: "Full content LLM indexing file"
  key_links:
    - from: "src/layouts/Layout.astro"
      to: "src/components/SEOHead.astro"
      via: "default ogImage prop"
      pattern: "ogImage.*og-default"
    - from: "src/components/BlogPostingJsonLd.astro"
      to: "src/components/PersonJsonLd.astro"
      via: "author @id reference"
      pattern: "@id.*#person"
---

<objective>
Implement all Priority 1 (Critical) and Priority 2 (Important) SEO audit recommendations from quick-004.

Purpose: Fix 12 SEO issues across meta tags, structured data, font loading, LLM indexing, and missing pages to dramatically improve search engine visibility, social sharing, and AI discoverability.

Output: Updated SEO components, new 404 page, new default OG image, new BreadcrumbList schema, enriched llms.txt, new llms-full.txt, non-blocking font loading.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/quick/004-review-seo-llm-seo-and-geo-for-the-websi/SEO-AUDIT.md
@src/components/SEOHead.astro
@src/components/PersonJsonLd.astro
@src/components/BlogPostingJsonLd.astro
@src/layouts/Layout.astro
@src/pages/about.astro
@src/pages/llms.txt.ts
@src/data/site.ts
@src/pages/open-graph/[...slug].png.ts
@src/lib/og-image.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Meta tags, OG defaults, 404 page, font loading, and meta descriptions</name>
  <files>
    src/components/SEOHead.astro
    src/layouts/Layout.astro
    src/pages/404.astro
    src/pages/about.astro
    src/pages/projects/index.astro
    src/pages/blog/tags/[tag].astro
    src/pages/open-graph/default.png.ts
  </files>
  <action>
    **1a. Create default OG image endpoint (Priority 1.1):**
    Create `src/pages/open-graph/default.png.ts` that generates a branded 1200x630 default OG image using the existing `generateOgImage()` function from `src/lib/og-image.ts`. Call it with:
    - title: "Patryk Golabek"
    - description: "Cloud-Native Software Architect | Kubernetes, AI/ML, Platform Engineering"
    - tags: ["Cloud-Native", "Kubernetes", "AI/ML", "Platform Engineering"]
    - No coverImage
    This endpoint produces a static PNG at build time at `/open-graph/default.png`.

    **1b. Add default OG image to Layout (Priority 1.1):**
    In `src/layouts/Layout.astro`, update the `ogImage` destructuring to default to the generated OG image when no prop is passed:
    ```
    ogImage = `${new URL('/open-graph/default.png', Astro.site)}`,
    ```
    This ensures all pages that do not pass an explicit ogImage (homepage, about, projects, contact, blog listing, tag pages) get the default.

    **1c. Add twitter:site and twitter:creator (Priority 1.4):**
    In `src/components/SEOHead.astro`, add after line 46 (after the existing Twitter Card tags):
    ```
    <meta name="twitter:site" content="@QuantumMentat" />
    <meta name="twitter:creator" content="@QuantumMentat" />
    ```

    **1d. Add og:image:alt (associated improvement):**
    In `src/components/SEOHead.astro`, add a new optional prop `ogImageAlt` (default: `"Patryk Golabek — Cloud-Native Software Architect"`). After the og:image:type meta tag, add:
    ```
    {ogImage && <meta property="og:image:alt" content={ogImageAlt} />}
    ```
    Also add `{ogImage && <meta name="twitter:image:alt" content={ogImageAlt} />}` after the twitter:image tag.

    **1e. Create 404 page (Priority 1.2):**
    Create `src/pages/404.astro` using the Layout component. Content:
    - Title: "Page Not Found -- Patryk Golabek"
    - H1: "404 -- Page Not Found"
    - Friendly message: "The page you're looking for doesn't exist or has been moved."
    - Links section with 4 cards linking to: Home (/), Blog (/blog/), Projects (/projects/), Contact (/contact/)
    - Style consistently with the rest of the site (use existing Tailwind classes, max-w-4xl, card-hover pattern)
    - Set meta robots noindex: add `<meta name="robots" content="noindex">` directly in the page's head slot or pass through Layout

    **1f. Fix job title on About page (Priority 1.3):**
    In `src/pages/about.astro`, line 85, change:
    `"I'm Patryk Golabek -- a Software Engineer based in Ontario, Canada."`
    to:
    `"I'm Patryk Golabek -- a Cloud-Native Software Architect based in Ontario, Canada."`

    **1g. Non-blocking font loading (Priority 2.1):**
    In `src/layouts/Layout.astro`, replace the Google Fonts `<link rel="stylesheet">` (line 72-75) with non-blocking loading. Replace with:
    ```html
    <link
      rel="preload"
      href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;700&family=Fira+Code:wght@400&display=swap"
      as="style"
      onload="this.onload=null;this.rel='stylesheet'"
    />
    <noscript>
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;700&family=Fira+Code:wght@400&display=swap"
        rel="stylesheet"
      />
    </noscript>
    ```
    Keep the existing preconnect links as-is.

    **1h. Lengthen thin meta descriptions (Priority 2.7):**
    - `src/pages/about.astro`: Change description to:
      `"About Patryk Golabek -- Cloud-Native Software Architect with 17+ years building Kubernetes platforms, AI/ML systems, and developer tools. Based in Ontario, Canada."` (155 chars)
    - `src/pages/projects/index.astro`: Change description to:
      `"Explore 16 open-source projects by Patryk Golabek -- Kubernetes platforms, AI/ML agents, infrastructure as code, DevOps tooling, and security utilities."` (155 chars)
    - `src/pages/blog/tags/[tag].astro`: Change description to use a template that includes the count:
      ```
      description={`Browse ${posts.length} article${posts.length !== 1 ? 's' : ''} about ${tag} by Patryk Golabek -- Cloud-Native Architect writing on Kubernetes, AI/ML, and platform engineering.`}
      ```
  </action>
  <verify>
    - `npm run build` succeeds
    - `ls dist/open-graph/default.png` confirms default OG image exists
    - `ls dist/404.html` confirms 404 page exists
    - `grep "twitter:site" dist/index.html` shows @QuantumMentat
    - `grep "twitter:creator" dist/index.html` shows @QuantumMentat
    - `grep "og:image" dist/index.html` shows `/open-graph/default.png`
    - `grep "og:image" dist/about/index.html` shows `/open-graph/default.png`
    - `grep "Cloud-Native Software Architect" dist/about/index.html` confirms job title fix
    - `grep "preload" dist/index.html` shows font preload strategy (no blocking stylesheet)
    - `grep "noindex" dist/404.html` confirms robots directive
  </verify>
  <done>
    All pages have OG images for social sharing. 404 page exists with branded layout. Job title reads "Cloud-Native Software Architect" on About page. Twitter meta tags include @QuantumMentat. Fonts load non-blocking. Meta descriptions are 150-160 chars on About, Projects, and tag pages.
  </done>
</task>

<task type="auto">
  <name>Task 2: Structured data -- WebSite schema, BreadcrumbList, Person @id/image, BlogPosting inLanguage</name>
  <files>
    src/components/PersonJsonLd.astro
    src/components/BlogPostingJsonLd.astro
    src/components/BreadcrumbJsonLd.astro
    src/layouts/Layout.astro
    src/pages/index.astro
  </files>
  <action>
    **2a. Add @id and image to Person schema (Priority 2.6):**
    In `src/components/PersonJsonLd.astro`, add to the schema object:
    - `"@id": "https://patrykgolabek.dev/#person"` -- stable entity reference
    - `"image": "https://patrykgolabek.dev/open-graph/default.png"` -- references the new default OG image as profile representation

    **2b. Update BlogPosting author to reference Person @id (Priority 2.6):**
    In `src/components/BlogPostingJsonLd.astro`, update the `author` field from:
    ```json
    "author": { "@type": "Person", "name": "Patryk Golabek", "url": "https://patrykgolabek.dev" }
    ```
    to:
    ```json
    "author": { "@type": "Person", "@id": "https://patrykgolabek.dev/#person", "name": "Patryk Golabek", "url": "https://patrykgolabek.dev" }
    ```
    Do the same for the `publisher` field.

    **2c. Add inLanguage to BlogPosting (Priority 1.5):**
    In `src/components/BlogPostingJsonLd.astro`, add `"inLanguage": "en"` to the schema object (after the `url` field).

    **2d. Add WebSite schema with SearchAction (Priority 2.2):**
    In `src/layouts/Layout.astro`, add a `<script type="application/ld+json">` block in the `<head>` (after the SEOHead component) containing:
    ```json
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://patrykgolabek.dev/#website",
      "name": "Patryk Golabek",
      "url": "https://patrykgolabek.dev",
      "description": "Portfolio of Patryk Golabek, Cloud-Native Software Architect with 17+ years of experience in Kubernetes, AI/ML systems, platform engineering, and DevSecOps.",
      "inLanguage": "en",
      "publisher": {
        "@type": "Person",
        "@id": "https://patrykgolabek.dev/#person"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.google.com/search?q=site:patrykgolabek.dev+{search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
    ```
    Use `set:html={JSON.stringify(websiteSchema)}` pattern like PersonJsonLd does, building the object in the frontmatter.

    **2e. Create BreadcrumbList component (Priority 2.3):**
    Create `src/components/BreadcrumbJsonLd.astro` that:
    - Accepts a `crumbs` prop: `Array<{ name: string; url: string }>`
    - Generates `BreadcrumbList` JSON-LD with proper `ListItem` entries and `position` numbering
    - Always starts with "Home" at position 1 (passed via crumbs, not hardcoded)

    **2f. Add BreadcrumbList to subpages:**
    Include `BreadcrumbJsonLd` in the following pages by adding it inside the page content (like BlogPostingJsonLd is used):

    - `src/pages/about.astro`: crumbs = [{name: "Home", url: "https://patrykgolabek.dev/"}, {name: "About", url: "https://patrykgolabek.dev/about/"}]
    - `src/pages/projects/index.astro`: crumbs = [{name: "Home", url: "..."}, {name: "Projects", url: ".../projects/"}]
    - `src/pages/blog/[...page].astro`: crumbs = [{name: "Home", url: "..."}, {name: "Blog", url: ".../blog/"}]
    - `src/pages/blog/[slug].astro`: crumbs = [{name: "Home", url: "..."}, {name: "Blog", url: ".../blog/"}, {name: title, url: postURL}]
    - `src/pages/blog/tags/[tag].astro`: crumbs = [{name: "Home", url: "..."}, {name: "Blog", url: ".../blog/"}, {name: `Tag: ${tag}`, url: `.../blog/tags/${tag}/`}]
    - `src/pages/contact.astro`: crumbs = [{name: "Home", url: "..."}, {name: "Contact", url: ".../contact/"}]

    Import the component and place it alongside the existing Layout/content. Use `Astro.site` to build full URLs.
  </action>
  <verify>
    - `npm run build` succeeds
    - `grep "@id.*#person" dist/index.html` confirms Person @id
    - `grep "image.*open-graph" dist/index.html` confirms Person image
    - `grep "inLanguage" dist/blog/building-kubernetes-observability-stack/index.html` confirms BlogPosting inLanguage
    - `grep "WebSite" dist/index.html` confirms WebSite schema
    - `grep "SearchAction" dist/index.html` confirms search action
    - `grep "BreadcrumbList" dist/about/index.html` confirms breadcrumbs on About
    - `grep "BreadcrumbList" dist/projects/index.html` confirms breadcrumbs on Projects
    - `grep "BreadcrumbList" dist/blog/index.html` confirms breadcrumbs on Blog
    - `grep "#person" dist/blog/building-kubernetes-observability-stack/index.html` confirms author @id reference
  </verify>
  <done>
    Person schema has @id and image. BlogPosting references author by @id and includes inLanguage. WebSite schema with SearchAction is on all pages. BreadcrumbList structured data is on all subpages.
  </done>
</task>

<task type="auto">
  <name>Task 3: LLM SEO -- enrich llms.txt and create llms-full.txt</name>
  <files>
    src/pages/llms.txt.ts
    src/pages/llms-full.txt.ts
  </files>
  <action>
    **3a. Enrich llms.txt (Priority 2.5):**
    Update `src/pages/llms.txt.ts` to include:
    1. Keep existing header (`# Patryk Golabek` + blockquote bio)
    2. Add a `## Expertise Areas` section with bullet points:
       - Kubernetes & Cloud-Native Architecture (pre-1.0 adopter, production platforms)
       - AI/ML Systems & LLM Agents (RAG pipelines, LangGraph, Langflow)
       - Platform Engineering & DevSecOps (Terraform, CI/CD, GitOps)
       - Full-Stack Development (Python, Java, TypeScript, React, Angular)
       - Infrastructure as Code (Terraform, Terragrunt, Helm)
    3. Rename "## Optional" to "## Pages" and move it above blog posts
    4. Add a `## External Profiles` section with:
       - GitHub: https://github.com/PatrykQuantumNomad
       - X (Twitter): https://x.com/QuantumMentat
       - YouTube: https://youtube.com/@QuantumMentat
       - Translucent Computing Blog: https://translucentcomputing.com/blog/
       - Kubert AI Blog: https://mykubert.com/blog/
    5. Keep `## Blog Posts` section as-is
    6. Add a footer line: `> For full content, see: https://patrykgolabek.dev/llms-full.txt`

    **3b. Create llms-full.txt (Priority 2.4):**
    Create `src/pages/llms-full.txt.ts` that:
    1. Imports `getCollection` from `astro:content`, `siteConfig` from `../data/site`, `projects` and `categories` from `../data/projects`
    2. Builds a comprehensive text file with these sections:
       - `# Patryk Golabek -- Full Site Content` with the same blockquote bio
       - `## About` -- Reproduce the About page content as plain text paragraphs:
         "Patryk Golabek is a Cloud-Native Software Architect based in Ontario, Canada with over 17 years of experience..."
         Include the career highlights (Early Kubernetes adopter, leadership, AI/ML Systems, Open-Source, Writing)
       - `## Tech Stack` -- List all tech stack categories and items from the about page data
       - `## Expertise Areas` -- Same as llms.txt
       - `## Projects` -- For each category, list all projects with name, description, language, and URL
       - `## Blog Posts` -- For each blog post (sorted by date), include title, date, description, URL, and tags. For local posts (no externalUrl), also include a note: "(Full article hosted on this site)"
       - `## External Profiles` -- Same as llms.txt
       - `## Contact` -- Email: pgolabek@gmail.com, Website: https://patrykgolabek.dev
    3. Return with `Content-Type: text/plain; charset=utf-8`

    Import the tech stack data: Since it is defined inline in about.astro, duplicate the tech stack array in llms-full.txt.ts (or extract to a shared data file `src/data/tech-stack.ts` if preferred -- use your judgment). The simplest approach is to inline the tech stack data directly in llms-full.txt.ts to avoid refactoring about.astro.
  </action>
  <verify>
    - `npm run build` succeeds
    - `cat dist/llms.txt` shows "## Expertise Areas", "## External Profiles", "## Pages" sections, and footer linking to llms-full.txt
    - `cat dist/llms-full.txt` shows full content including About, Tech Stack, Projects, Blog Posts, External Profiles, and Contact
    - `grep "Expertise Areas" dist/llms.txt` confirms new section
    - `grep "External Profiles" dist/llms-full.txt` confirms section exists
    - `grep "llms-full.txt" dist/llms.txt` confirms cross-reference
  </verify>
  <done>
    llms.txt includes expertise areas, external profiles, renamed "Pages" section, and footer link to llms-full.txt. llms-full.txt serves comprehensive site content including About bio, tech stack, all projects, all blog posts, and contact information for deep LLM indexing.
  </done>
</task>

</tasks>

<verification>
After all 3 tasks complete:
1. `npm run build` succeeds with zero errors
2. All 12 Priority 1+2 audit items are addressed:
   - [P1.1] Default OG image on all non-blog pages
   - [P1.2] Custom 404 page exists at dist/404.html
   - [P1.3] About page says "Cloud-Native Software Architect"
   - [P1.4] twitter:site and twitter:creator on all pages
   - [P1.5] inLanguage in BlogPosting schema
   - [P2.1] Fonts load non-blocking (preload strategy)
   - [P2.2] WebSite schema with SearchAction on all pages
   - [P2.3] BreadcrumbList on all subpages
   - [P2.4] llms-full.txt exists with complete content
   - [P2.5] llms.txt enriched with expertise + profiles
   - [P2.6] Person schema has @id and image
   - [P2.7] Meta descriptions lengthened on About, Projects, tag pages
3. Lighthouse audit on built site shows no regressions
</verification>

<success_criteria>
- Build passes with zero errors
- All 5 Priority 1 items implemented
- All 7 Priority 2 items implemented
- No existing functionality broken (OG images on blog posts still work, existing schemas still valid)
- JSON-LD validates (no syntax errors in structured data)
</success_criteria>

<output>
After completion, create `.planning/quick/005-implement-seo-audit-findings/005-SUMMARY.md`
</output>
