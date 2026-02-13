---
phase: quick-008
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/SEOHead.astro
  - src/components/Header.astro
  - src/components/Footer.astro
  - src/pages/index.astro
  - src/pages/about.astro
autonomous: true

must_haves:
  truths:
    - "All indexable pages include robots meta tag with index,follow"
    - "Homepage H1 contains keyword-rich subtitle (Cloud-Native Architect & AI/ML Engineer)"
    - "Homepage has expanded word count with bio paragraph and richer card descriptions"
    - "Footer contains navigation links to Blog, Projects, About, Contact"
    - "Homepage and About page have contextual cross-links to each other and related pages"
    - "Header logo alt text says Patryk Golabek instead of PG"
  artifacts:
    - path: "src/components/SEOHead.astro"
      provides: "Global robots meta tag"
      contains: "robots"
    - path: "src/components/Header.astro"
      provides: "Improved logo alt text"
      contains: "Patryk Golabek"
    - path: "src/components/Footer.astro"
      provides: "Footer navigation links"
      contains: "<nav"
    - path: "src/pages/index.astro"
      provides: "Keyword-rich H1, bio paragraph, expanded cards, cross-link to About"
      contains: "Cloud-Native Architect"
    - path: "src/pages/about.astro"
      provides: "Cross-links to Blog and Projects"
      contains: "/blog/"
  key_links:
    - from: "src/components/Footer.astro"
      to: "/blog/, /projects/, /about/, /contact/"
      via: "anchor tags in nav element"
      pattern: "href=\"/(blog|projects|about|contact)/\""
    - from: "src/pages/index.astro"
      to: "/about/"
      via: "contextual cross-link"
      pattern: "href=\"/about/\""
    - from: "src/pages/about.astro"
      to: "/blog/ and /projects/"
      via: "contextual cross-links in Let's Connect section"
      pattern: "href=\"/(blog|projects)/\""
---

<objective>
Implement 6 SEO audit findings from an external review to close remaining on-page SEO gaps.

Purpose: Improve crawlability (robots meta), keyword density (H1 subtitle, expanded content), internal linking (footer nav, cross-links), and accessibility (logo alt text).
Output: Updated SEOHead, Header, Footer, index, and about pages with all 6 audit fixes applied.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/SEOHead.astro
@src/components/Header.astro
@src/components/Footer.astro
@src/pages/index.astro
@src/pages/about.astro
@src/data/site.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add robots meta, fix logo alt, and add footer navigation</name>
  <files>src/components/SEOHead.astro, src/components/Header.astro, src/components/Footer.astro</files>
  <action>
    **SEOHead.astro** (change 1):
    - Add `<meta name="robots" content="index, follow">` on line 31, immediately after the canonical URL `<link>` tag.
    - The 404 page already has its own `noindex` meta which takes precedence, so this global addition is safe.

    **Header.astro** (change 6):
    - On line 32, change the Image `alt` attribute from `"PG"` to `"Patryk Golabek"`.

    **Footer.astro** (change 4):
    - Add a `<nav>` element with internal site links between the copyright `<p>` and the social links `<div>` (inside the existing `flex` container on line 30).
    - The nav should contain links to: Blog (`/blog/`), Projects (`/projects/`), About (`/about/`), Contact (`/contact/`).
    - Style as subtle text links using `meta-mono` class and `text-[var(--color-text-secondary)]` with `hover:text-[var(--color-accent)]` transition, separated by a `gap-4` flex container.
    - Add `aria-label="Footer navigation"` to the nav element.
    - Keep the layout: copyright on left, nav links in center, social icons on right. On mobile (`sm:flex-row` already handles column stacking), the nav should appear between copyright and social icons.
  </action>
  <verify>Run `npm run build` and confirm no errors. Grep for `robots` in SEOHead.astro, `Patryk Golabek` alt in Header.astro, and `<nav` in Footer.astro.</verify>
  <done>All three component files updated: robots meta present globally, logo alt text is "Patryk Golabek", footer has nav with 4 internal links.</done>
</task>

<task type="auto">
  <name>Task 2: Enrich homepage content and add cross-links on homepage and about page</name>
  <files>src/pages/index.astro, src/pages/about.astro</files>
  <action>
    **index.astro -- H1 keyword subtitle (change 2):**
    - Inside the existing `<h1>` tag (lines 34-40), after `{siteConfig.name}` on line 39, add a subtitle span:
      ```html
      <span class="block text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-[var(--color-accent)] mt-2">
        Cloud-Native Architect &amp; AI/ML Engineer
      </span>
      ```
    - Keep the `</h1>` closing tag. The typing animation line (line 41-43) stays as-is.

    **index.astro -- Bio paragraph (change 3a):**
    - Between the tagline `<p>` (lines 44-46) and the CTA button `<div>` (line 47), add a new paragraph:
      ```html
      <p class="text-base text-[var(--color-text-secondary)] max-w-xl mb-6" data-reveal>
        With 17+ years building cloud-native systems, I specialize in Kubernetes platform engineering,
        AI/ML agent development, and DevSecOps automation. From pre-1.0 Kubernetes clusters to modern
        LLM-powered applications, I architect resilient systems that scale.
      </p>
      ```

    **index.astro -- Expand card descriptions (change 3b):**
    - Cloud-Native & Kubernetes card (line 100-102): Expand the `<p>` to:
      "Designing and operating production Kubernetes clusters since pre-1.0. Service meshes, GitOps, observability stacks, and multi-cloud deployments across GCP and AWS."
    - AI/ML Systems card (line 113-115): Expand to:
      "Building LLM agents, RAG pipelines, and intelligent automation with LangGraph, Langflow, and custom orchestration. From prototype to production-grade AI systems."
    - Platform Engineering card (line 126-128): Expand to:
      "Infrastructure as Code with Terraform and Terragrunt. CI/CD pipelines, DevSecOps practices, and developer experience tooling that keeps teams moving fast."
    - Full-Stack Development card (line 139-141): Expand to:
      "Python, Java, TypeScript. React, Angular, Next.js. APIs, microservices, and data pipelines — end-to-end delivery from frontend to backend."

    **index.astro -- Cross-link to About (change 5a):**
    - In the CTA buttons `<div>` (lines 47-62), add a third link after "Read Blog":
      ```html
      <a
        href="/about/"
        class="inline-flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] font-medium transition-colors"
        data-magnetic
      >
        Learn more about my background &rarr;
      </a>
      ```
    - This should be a text-style link (no button border/bg), visually lighter than the two CTA buttons.

    **about.astro -- Cross-links to Blog and Projects (change 5b):**
    - In the "Let's Connect" section (line 226-306), add two internal site links at the BEGINNING of the `flex` container (before the GitHub link on line 230):
      ```html
      <a
        href="/blog/"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        Blog
      </a>
      <a
        href="/projects/"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        Projects
      </a>
      ```
    - These use the same styling pattern as the existing external link buttons in that section.
  </action>
  <verify>Run `npm run build` and confirm no errors. Verify the homepage H1 contains "Cloud-Native Architect", the bio paragraph exists, card descriptions are longer, the About cross-link appears. Verify about.astro has Blog and Projects links in the Let's Connect section.</verify>
  <done>Homepage has keyword-rich H1 subtitle, expanded bio paragraph, richer card descriptions, and a cross-link to About. About page has internal cross-links to Blog and Projects in the Let's Connect section.</done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- View source of built index.html: contains `<meta name="robots" content="index, follow">`, H1 has "Cloud-Native Architect & AI/ML Engineer", bio paragraph present, expanded card text present, link to /about/ in hero CTA area
- View source of built about/index.html: has links to /blog/ and /projects/ in Let's Connect
- View source of any built page: footer contains nav with 4 internal links
- Header logo image alt text is "Patryk Golabek"
</verification>

<success_criteria>
All 6 external SEO audit findings implemented:
1. Global robots meta tag present on all pages
2. Homepage H1 includes keyword-rich subtitle
3. Homepage word count expanded with bio paragraph and richer card descriptions
4. Footer contains navigation links to main site sections
5. Cross-links added between homepage and about page (bidirectional)
6. Header logo alt text improved from "PG" to "Patryk Golabek"
Site builds without errors.
</success_criteria>

<output>
After completion, create `.planning/quick/008-implement-external-seo-audit-findings/008-SUMMARY.md`
</output>
