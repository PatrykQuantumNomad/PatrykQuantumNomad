# Phase 81: Site Integration and Blog Post - Research

**Researched:** 2026-03-04
**Domain:** Astro site integration, JSON-LD structured data, Satori OG image generation, MDX blog content, SEO metadata, LLMs.txt
**Confidence:** HIGH

## Summary

Phase 81 integrates the GitHub Actions Workflow Validator into the portfolio site's navigation, discovery surfaces, and SEO infrastructure, then creates a companion blog post driving organic traffic. This is the fourth tool integration following the identical pattern established by the Dockerfile Analyzer (Phase 26), Docker Compose Validator (Phase 39/40), and Kubernetes Manifest Analyzer. Every building block already exists in the codebase: `BreadcrumbJsonLd.astro`, `K8sAnalyzerJsonLd.astro` (SoftwareApplication pattern to replicate), the `og-image.ts` Satori + Sharp pipeline with `renderOgPng()`, `accentBar()`, and `brandingRow()` helpers, the blog content collection at `src/data/blog/`, and the `llms.txt.ts` endpoint generator. No new dependencies are needed.

The GHA Validator tool page already exists at `/tools/gha-validator/` with the React component (`GhaValidator client:only="react"`) and rule documentation pages at `/tools/gha-validator/rules/[code].astro` with BreadcrumbJsonLd and FAQPageJsonLd already wired in. What is missing: (1) JSON-LD SoftwareApplication structured data, (2) BreadcrumbJsonLd on the main tool page, (3) OG image, (4) SEO-optimized meta description (current description incorrectly says "40 rules" -- actual count is 48), (5) homepage callout card in the Tools section, (6) tools page card entry, (7) LLMs.txt entry, and (8) the companion blog post with bidirectional cross-links. The header navigation already has `{ href: '/tools/', label: 'Tools' }` which correctly highlights for all `/tools/*` pages via `startsWith()` logic -- the same pattern used for all three existing tools.

**Important discovery:** The current tool page description says "40 rules" but `allDocumentedGhaRules` has 48 entries (22 custom + 18 actionlint metadata + 8 schema). All descriptions, JSON-LD, OG image, and blog post content must reference 48, not 40.

**Primary recommendation:** Follow the exact patterns from prior tool integrations (all verified in source code). Create GhaValidatorJsonLd.astro, generate OG image via `generateGhaValidatorOgImage()`, update the tool page with full SEO props, add homepage and tools page cards, add LLMs.txt entry, create the companion blog post as MDX with bidirectional cross-links, and update `[slug].astro` with GHA-specific FAQPageJsonLd and `aboutDataset` mapping.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | Tool page at `/tools/gha-validator/` with full editor and results | Page already exists at `src/pages/tools/gha-validator/index.astro` with `GhaValidator client:only="react"`. Needs enhancement: add `ogImage` prop, `ogImageAlt`, update `description` (fix rule count to 48), add JSON-LD and BreadcrumbJsonLd components, add companion content aside linking to blog post and rule docs. |
| SITE-02 | Header navigation link for GitHub Actions Validator | Header already has `{ href: '/tools/', label: 'Tools' }` with `startsWith()` active-state logic. No structural header change needed -- consistent with Dockerfile Analyzer, Compose Validator, and K8s Analyzer patterns. The Tools page card (SITE-04) is the discovery mechanism. |
| SITE-03 | Homepage callout linking to the validator | Homepage `index.astro` has a "Tools" section (lines 230-265) showing Dockerfile Analyzer, Compose Validator, and K8s Analyzer cards in `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Add a 4th card for GHA Validator -- grid becomes 4 cards, which works with `lg:grid-cols-3` (3+1 on desktop, wraps naturally). |
| SITE-04 | Tools page card entry | Tools page `src/pages/tools/index.astro` currently has 3 tool cards in `grid-cols-1 sm:grid-cols-2`. Add a 4th GHA Validator card. With 4 cards, the 2-column grid shows 2 rows of 2 -- perfectly balanced. |
| SITE-05 | JSON-LD structured data (SoftwareApplication schema) on tool page | Create `GhaValidatorJsonLd.astro` following `K8sAnalyzerJsonLd.astro` pattern exactly. SoftwareApplication type with 48-rule featureList, actionlint WASM mention, all 6 categories, and `softwareHelp` linking to blog post. |
| SITE-06 | Build-time OG image via Satori + Sharp | Add `generateGhaValidatorOgImage()` to `src/lib/og-image.ts` following the K8s Analyzer pattern (two-column layout: title + description + category pills on left, stylized code panel on right). Create API route at `src/pages/open-graph/tools/gha-validator.png.ts`. |
| SITE-07 | Breadcrumb navigation on tool page and rule documentation pages | Rule pages already have BreadcrumbJsonLd (from Phase 80). Only the main tool page `gha-validator/index.astro` needs BreadcrumbJsonLd added with 3-level crumbs: Home > Tools > GHA Validator. |
| SITE-08 | All tool and rule pages in sitemap | `@astrojs/sitemap` auto-includes all static pages (verified from `astro.config.mjs` -- filter only excludes `/404`). All 49 URLs (1 main + 48 rule pages) will be auto-included. Verification only -- no action needed. |
| SITE-09 | SEO-optimized meta descriptions for tool page and all rule pages | Tool page needs updated description fixing "40 rules" to "48 rules". Rule pages already have SEO descriptions generated from `rule.explanation` (truncated to 155 chars) in `[code].astro` -- no changes needed there. |
| SITE-10 | LLMs.txt updated with GitHub Actions Validator entry | Add GHA Validator entry to `src/pages/llms.txt.ts` in the "Interactive Tools" section, following the Kubernetes Manifest Analyzer entry pattern. Include URL, rules URL, and blog post URL. |
| BLOG-01 | Companion blog post covering GitHub Actions best practices and tool architecture | Create `src/data/blog/github-actions-best-practices.mdx` following `kubernetes-manifest-best-practices.mdx` pattern. Uses blog content collection glob loader. 48 rules organized by category with links to individual rule docs. MDX components: OpeningStatement, TldrSummary, KeyTakeaway, Callout. |
| BLOG-02 | Cross-links between blog post and tool page (bidirectional) | Tool page aside links to blog post (companion guide) and rule docs. Blog post CTA links back to tool page. `[slug].astro` needs `isGhaPost` check with `aboutDataset` mapping and `articleSection` set to 'GitHub Actions Security'. |
| BLOG-03 | Blog post links to individual rule documentation pages | Blog post references rules by ID with links to `/tools/gha-validator/rules/{id}/` -- same pattern as k8s and compose blog posts. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- Zero New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static page generation, API routes, MDX support | Framework for the entire site |
| Satori | ^0.19.2 | HTML/CSS object trees to SVG for OG images | Already proven in `og-image.ts` for 12+ generators |
| Sharp | ^0.34.5 | SVG to PNG rasterization for OG images | Already proven, pipeline established |
| @astrojs/mdx | (installed) | MDX blog posts with Astro component imports | Already used for all original blog posts |
| @astrojs/sitemap | (installed) | Automatic sitemap generation | Already configured; new pages auto-included |
| @astrojs/react | (installed) | React island hydration for GhaValidator component | Already configured |

### Project Components (Zero External Imports)
| Component | Purpose | Where Used |
|-----------|---------|------------|
| `BreadcrumbJsonLd.astro` | BreadcrumbList JSON-LD schema | All tool pages, blog posts, rule pages |
| `K8sAnalyzerJsonLd.astro` | SoftwareApplication JSON-LD pattern to replicate | K8s Analyzer tool page |
| `BlogPostingJsonLd.astro` | Article structured data for blog posts | All blog post pages via `[slug].astro` |
| `FAQPageJsonLd.astro` | FAQ structured data | Tool pages, blog posts |
| `SEOHead.astro` | Meta tags, OG tags, canonical URLs | All pages via Layout |
| `src/lib/og-image.ts` | `renderOgPng()`, `accentBar()`, `brandingRow()`, font loading | All OG image generation |
| `src/pages/llms.txt.ts` | LLMs.txt endpoint generator | Builds llms.txt at build time |

### MDX Blog Components Available
| Component | Import Path | Purpose |
|-----------|------------|---------|
| `OpeningStatement` | `../../components/blog/OpeningStatement.astro` | Bold opening line below frontmatter |
| `TldrSummary` | `../../components/blog/TldrSummary.astro` | TL;DR bullet summary box |
| `KeyTakeaway` | `../../components/blog/KeyTakeaway.astro` | Highlighted takeaway callout |
| `Callout` | `../../components/blog/Callout.astro` | General callout box |

**Installation:**
```bash
# No new packages needed. All tools are already installed.
```

## Architecture Patterns

### Recommended Project Structure (Changes Only)
```
src/
  components/
    GhaValidatorJsonLd.astro          # [NEW] SoftwareApplication JSON-LD
  lib/
    og-image.ts                        # [MODIFY] Add generateGhaValidatorOgImage()
  pages/
    index.astro                        # [MODIFY] Add GHA Validator card to Tools section
    llms.txt.ts                        # [MODIFY] Add GHA Validator entry
    llms-full.txt.ts                   # [MODIFY] Add GHA Validator entry (if it mirrors llms.txt)
    blog/
      [slug].astro                     # [MODIFY] Add isGhaPost check, FAQs, aboutDataset
    open-graph/
      tools/
        gha-validator.png.ts           # [NEW] OG image API route
    tools/
      index.astro                      # [MODIFY] Add GHA Validator card, update meta description
      gha-validator/
        index.astro                    # [MODIFY] Add JSON-LD, BreadcrumbJsonLd, ogImage, aside, fix rule count
        rules/
          [code].astro                 # [NO CHANGE] Already has BreadcrumbJsonLd + FAQPageJsonLd
  data/
    blog/
      github-actions-best-practices.mdx  # [NEW] Companion blog post
```

### Pattern 1: SoftwareApplication JSON-LD Component
**What:** A standalone Astro component that renders a `<script type="application/ld+json">` tag with SoftwareApplication structured data.
**When to use:** On the main tool page (`/tools/gha-validator/`).
**Example:**
```astro
---
// Source: src/components/K8sAnalyzerJsonLd.astro (verified pattern to replicate)
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "GitHub Actions Workflow Validator",
  "description": "Free browser-based GitHub Actions workflow validator and best-practice analyzer. 48 rules across schema, security, semantic, best-practice, style, and actionlint categories. Two-pass analysis with actionlint WASM. 100% client-side.",
  "url": "https://patrykgolabek.dev/tools/gha-validator/",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "softwareVersion": "1.0",
  "datePublished": "2026-03-04",
  "screenshot": "https://patrykgolabek.dev/open-graph/tools/gha-validator.png",
  "softwareHelp": {
    "@type": "CreativeWork",
    "name": "GitHub Actions Best Practices",
    "url": "https://patrykgolabek.dev/blog/github-actions-best-practices/",
  },
  "keywords": [
    "github actions validator",
    "github actions linter",
    "github actions best practices",
    "github workflow validator",
    "github actions security",
    "actionlint online",
    "github actions checker",
    "workflow yaml validator",
  ],
  "featureList": [
    "48 validation rules across 6 categories (schema, security, semantic, best-practice, style, actionlint)",
    "Two-pass analysis: instant schema + custom rules, plus deep actionlint WASM",
    "Category-weighted scoring with letter grades (A+ through F)",
    "Inline CodeMirror annotations with severity-colored gutter markers",
    "actionlint WASM integration for deep semantic analysis",
    "100% client-side analysis -- no data transmitted",
    "YAML syntax highlighting with CodeMirror 6",
    "Shareable URLs with lz-string compression",
    "Score badge PNG download for social sharing",
    "48 individual rule documentation pages with fix examples",
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "author": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
    "name": "Patryk Golabek",
    "url": "https://patrykgolabek.dev/",
  },
  "isPartOf": {
    "@type": "WebSite",
    "@id": "https://patrykgolabek.dev/#website",
  },
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Pattern 2: Tool Page Enhancement (Matching K8s Analyzer and Dockerfile Analyzer)
**What:** Update gha-validator/index.astro with full SEO props, JSON-LD, Breadcrumbs, and companion content aside.
**When to use:** SITE-01, SITE-05, SITE-07, SITE-09.
**Example:**
```astro
---
import Layout from '../../../layouts/Layout.astro';
import GhaValidator from '../../../components/tools/GhaValidator';
import GhaValidatorJsonLd from '../../../components/GhaValidatorJsonLd.astro';
import BreadcrumbJsonLd from '../../../components/BreadcrumbJsonLd.astro';
---

<Layout
  title="GitHub Actions Workflow Validator | Patryk Golabek"
  description="Free online GitHub Actions workflow linter and validator. 48 rules for security, semantic correctness, best practices, and style. Two-pass analysis with actionlint WASM. 100% browser-based."
  ogImage={new URL('/open-graph/tools/gha-validator.png', Astro.site).toString()}
  ogImageAlt="GitHub Actions Workflow Validator - 48 rules across schema, security, semantic, best-practice, style, and actionlint categories"
>
  <section class="py-8 sm:py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl sm:text-4xl font-heading font-bold text-[var(--color-text-primary)] mb-2">
        GitHub Actions Workflow Validator
      </h1>
      <div class="mb-8">
        <!-- Subtitle and description -->
      </div>
    </div>

    <div class="px-4 sm:px-6 lg:px-8">
      <GhaValidator client:only="react" />
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="mt-8 text-sm text-[var(--color-text-secondary)]">
        Paste your workflow YAML and click <strong>Analyze</strong>. 100% client-side, your code never leaves your browser.
        Want to learn the rules in depth? Read the
        <a href="/blog/github-actions-best-practices/" class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium">companion guide</a>
        or browse
        <a href="/tools/gha-validator/rules/ga-c001/" class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium">individual rule docs</a>.
      </p>
    </div>
  </section>

  <GhaValidatorJsonLd />
  <BreadcrumbJsonLd crumbs={[
    { name: 'Home', url: 'https://patrykgolabek.dev/' },
    { name: 'Tools', url: 'https://patrykgolabek.dev/tools/' },
    { name: 'GHA Validator', url: 'https://patrykgolabek.dev/tools/gha-validator/' },
  ]} />
</Layout>
```

### Pattern 3: OG Image Generator
**What:** A function in `og-image.ts` that generates a branded 1200x630 OG image with two-column layout.
**When to use:** SITE-06.
**Example:**
```typescript
// Source: existing generateK8sAnalyzerOgImage() / generateComposeValidatorOgImage() pattern
export async function generateGhaValidatorOgImage(): Promise<Uint8Array<ArrayBuffer>> {
  const categories = ['Schema', 'Security', 'Semantic', 'Best Practice', 'Style'];
  // Category pills using accent color
  // Code panel with GHA workflow YAML lines:
  //   name: "CI Pipeline"
  //   on: push
  //   permissions: write-all    (marker: error)
  //   uses: actions/checkout@v3 (marker: warning)
  //   run: echo ${{ github.event.pull_request.head.ref }}  (marker: error)
  // Rule count badge showing "48"
  // Uses accentBar(), brandingRow(), renderOgPng() helpers
}
```

### Pattern 4: OG Image API Route
**What:** A static API route that calls the generator and returns PNG.
**When to use:** SITE-06.
**Example:**
```typescript
// Source: src/pages/open-graph/tools/k8s-analyzer.png.ts (exact pattern)
import type { APIRoute } from 'astro';
import { generateGhaValidatorOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateGhaValidatorOgImage();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Pattern 5: Tools Page Card
**What:** A linked card on the tools page following the existing card pattern.
**When to use:** SITE-04.
**Example:**
```html
<!-- Source: tools/index.astro existing card pattern -->
<a
  href="/tools/gha-validator/"
  class="block card-hover p-6 rounded-lg border border-[var(--color-border)] no-underline group"
  data-reveal
  data-tilt
>
  <div class="mb-4 text-[var(--color-accent)]">
    <!-- GitHub Actions / workflow icon SVG -->
  </div>
  <h2 class="text-lg font-heading font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
    GitHub Actions Validator
  </h2>
  <p class="meta-mono mt-1">Free Browser Tool</p>
  <p class="text-sm text-[var(--color-text-secondary)] mt-3">
    Validate GitHub Actions workflows against 48 rules across security, semantic,
    best-practice, and style categories. Two-pass analysis with actionlint WASM. 100% client-side.
  </p>
  <ul class="mt-4 flex flex-wrap gap-2">
    <li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">48-rule engine</li>
    <li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">Scoring &amp; grades</li>
    <li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">actionlint WASM</li>
    <li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">Share links</li>
  </ul>
</a>
```

### Pattern 6: Homepage Callout Card
**What:** A card in the homepage "Tools" section linking to the GHA Validator.
**When to use:** SITE-03.
**Example:**
```html
<!-- Source: index.astro Tools section card pattern -->
<a href="/tools/gha-validator/" class="block card-hover p-6 rounded-lg border border-[var(--color-border)] no-underline" data-reveal data-tilt>
  <article>
    <p class="meta-mono text-[var(--color-accent)]">Free Browser Tool</p>
    <h3 class="text-lg font-heading font-bold text-[var(--color-text-primary)] mt-2">GitHub Actions Validator</h3>
    <p class="text-sm text-[var(--color-text-secondary)] mt-2">
      Validate GitHub Actions workflows against 48 rules covering security, semantic
      correctness, best practices, and style. Two-pass analysis with actionlint WASM. 100% client-side.
    </p>
    <span class="inline-block mt-4 text-sm font-medium text-[var(--color-accent)]">Try it &rarr;</span>
  </article>
</a>
```

### Pattern 7: LLMs.txt Entry
**What:** Add GHA Validator entry to the Interactive Tools section in `llms.txt.ts`.
**When to use:** SITE-10.
**Example:**
```typescript
// Add after the Kubernetes Manifest Analyzer entry in llms.txt.ts
'- GitHub Actions Workflow Validator: 48-rule engine analyzing GitHub Actions workflows for schema, security, semantic, best-practice, style, and actionlint issues. Two-pass analysis: instant schema + custom rules, plus deep actionlint WASM. Category-weighted scoring with letter grades. 100% client-side.',
'  URL: https://patrykgolabek.dev/tools/gha-validator/',
'  Rules: https://patrykgolabek.dev/tools/gha-validator/rules/ga-c001/ (48 individual rule documentation pages)',
'  Blog: https://patrykgolabek.dev/blog/github-actions-best-practices/',
```

### Pattern 8: Blog Post [slug].astro Integration
**What:** Update `[slug].astro` to recognize the GHA blog post for FAQPageJsonLd and aboutDataset.
**When to use:** BLOG-02.
**Example:**
```typescript
// In [slug].astro, add after existing tool post checks:
const isGhaPost = post.id === 'github-actions-best-practices';

// Update articleSection:
: isGhaPost ? 'GitHub Actions Security'

// Update aboutDataset:
: isGhaPost
  ? { type: 'SoftwareApplication', name: 'GitHub Actions Workflow Validator', url: 'https://patrykgolabek.dev/tools/gha-validator/' }

// Add GHA FAQ items:
const ghaFAQ = isGhaPost ? [
  {
    question: 'What is a GitHub Actions workflow validator?',
    answer: 'A GitHub Actions workflow validator checks your .github/workflows/*.yml files for schema compliance, security vulnerabilities, semantic errors, and best-practice violations. The GitHub Actions Validator at patrykgolabek.dev/tools/gha-validator/ runs 48 rules with two-pass analysis including actionlint WASM. It runs 100% in the browser.',
  },
  {
    question: 'How do I secure my GitHub Actions workflows?',
    answer: 'Pin all third-party actions to full SHA commits instead of mutable tags. Set explicit permissions with least-privilege scopes instead of write-all. Never use untrusted input in run: scripts to prevent script injection. Avoid pull_request_target with checkout of PR code. Use environment secrets instead of hardcoded credentials.',
  },
  {
    question: 'What is a free online GitHub Actions linter?',
    answer: 'The GitHub Actions Workflow Validator at patrykgolabek.dev/tools/gha-validator/ is a free online tool that checks 48 rules across schema, security, semantic, best-practice, style, and actionlint categories. It uses two-pass analysis with actionlint WASM for deep semantic checking. 100% browser-based.',
  },
] : [];
```

### Pattern 9: Blog Post MDX Structure
**What:** The companion blog post as MDX following existing tool blog posts.
**When to use:** BLOG-01, BLOG-02, BLOG-03.
**Example frontmatter:**
```yaml
---
title: "GitHub Actions Best Practices"
description: "Production-tested guide to writing secure GitHub Actions workflows. 48 rules across security, semantic correctness, best practices, and style with fix examples."
publishedDate: 2026-03-04
tags: ["github-actions", "ci-cd", "devops", "security", "yaml", "automation"]
draft: false
---
```

### Anti-Patterns to Avoid
- **Using "40 rules" anywhere:** The actual count is 48 documented rules (22 custom + 18 actionlint metadata + 8 schema). Always use 48.
- **Hard-coding URLs without consistency:** Always use `https://patrykgolabek.dev` as the base URL in JSON-LD (matches existing components). Do NOT use `Astro.site` in JSON-LD components -- follow the established codebase pattern.
- **Adding a direct "GHA Validator" link to header nav:** The header has 8 clean nav items. Do NOT add individual tool links. The "Tools" link covers all tools, consistent with how the other three tools are handled.
- **Modifying the sitemap configuration:** `@astrojs/sitemap` auto-includes all static pages. Do NOT add custom entries or filters.
- **Touching rule page files:** `[code].astro` already has BreadcrumbJsonLd and FAQPageJsonLd from Phase 80. Do NOT duplicate.
- **Using incorrect rule ID prefix:** GHA validator rule IDs use the format `GA-C001` (security), `GA-S001` (schema), `GA-B001` (best-practice), `GA-F001` (style), `GA-L001` (actionlint). The first rule link in rule docs should be `ga-c001` (lowercase in URLs).
- **Creating a Claude Skill for GHA Validator:** No Claude Skill exists for GHA Validator yet (unlike Dockerfile Analyzer, Compose Validator, and K8s Analyzer which all have `/skills/` directories). Do NOT create skill download buttons unless skills are also created. The tool page should omit the "Claude Code:" skill download bar that other tools have.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap generation | Manual XML or custom sitemap entries | `@astrojs/sitemap` (already auto-includes all pages) | All 49 GHA Validator URLs will be auto-included; zero config needed |
| JSON-LD schema | Runtime generator library | Static Astro component with inline JSON object | Consistent with 4 existing JSON-LD components |
| OG image rendering | Custom canvas/SVG generation | `satori` + `sharp` via `renderOgPng()` helper | Existing pipeline handles fonts, layout, and PNG conversion |
| Breadcrumb rendering | Custom breadcrumb component | `BreadcrumbJsonLd.astro` (existing) | Already handles ListItem arrays, used on 100+ pages |
| Blog post infrastructure | Custom blog rendering | Astro content collection with glob loader | Blog collection already handles MDX, OG images, related posts, structured data |
| Blog OG images | Manual blog OG image generation | Existing `[...slug].png.ts` catch-all route | Automatically generates OG images for all blog posts using `generateOgImage()` |

**Key insight:** This phase is pure integration and content creation. Every component, pattern, and building block already exists and has been proven across three prior tool integrations.

## Common Pitfalls

### Pitfall 1: Rule Count Mismatch (40 vs 48)
**What goes wrong:** The existing tool page says "40 rules" but the actual count is 48.
**Why it happens:** The description was written during an earlier phase before all rules were added.
**How to avoid:** Grep for "40 rules" in all GHA validator references and replace with "48". Key files: `gha-validator/index.astro` (description and body text).
**Warning signs:** Any mention of "40 rules" in new content.

### Pitfall 2: Homepage Grid Layout with 4 Tool Cards
**What goes wrong:** The homepage Tools section currently has 3 cards in `lg:grid-cols-3`. Adding a 4th creates 1 orphan card on desktop (3+1 layout).
**Why it happens:** Grid layout with 4 items in a 3-column grid leaves one card alone on the second row.
**How to avoid:** Either change the grid to `lg:grid-cols-4` (narrower cards), change to `lg:grid-cols-2` (wider cards, 2x2), or keep `lg:grid-cols-3` and accept the 3+1 layout (which still looks fine as the last card fills the first column of the second row). The cleanest approach: change to `sm:grid-cols-2 lg:grid-cols-4` for even distribution, or keep `lg:grid-cols-3` (3+1 is an acceptable layout pattern).
**Warning signs:** Visual testing needed to confirm grid appearance with 4 cards.

### Pitfall 3: Tools Page Grid with 4 Cards
**What goes wrong:** The tools page uses `grid-cols-1 sm:grid-cols-2`. With 4 cards, this creates 2 rows of 2 on desktop -- perfectly balanced. No issue here.
**Why it happens:** N/A -- this is actually fine.
**How to avoid:** The 2-column grid handles 4 cards well. Also update the tools page meta description to mention all 4 tools.
**Warning signs:** None.

### Pitfall 4: Missing Blog Post Integration in [slug].astro
**What goes wrong:** Creating the blog post MDX file but forgetting to add the `isGhaPost` check in `[slug].astro`, resulting in no FAQPageJsonLd or aboutDataset for the GHA blog post.
**Why it happens:** `[slug].astro` has hardcoded checks for specific post slugs (isBeautyIndexPost, isK8sPost, isComposePost, isDockerfilePost).
**How to avoid:** Add `isGhaPost = post.id === 'github-actions-best-practices'` and wire it into `articleSection`, `aboutDataset`, and FAQ arrays.
**Warning signs:** Blog post renders but lacks FAQ structured data in page source.

### Pitfall 5: LLMs.txt Missing from llms-full.txt
**What goes wrong:** Updating `llms.txt.ts` but forgetting `llms-full.txt.ts`.
**Why it happens:** Both files exist and may have the same section.
**How to avoid:** Check both files. Add the GHA Validator entry to the Interactive Tools section in both.
**Warning signs:** `llms-full.txt` missing the GHA Validator entry.

### Pitfall 6: No Claude Skill Downloads
**What goes wrong:** Copying the Dockerfile Analyzer or K8s Analyzer tool page pattern verbatim and including skill/hook download buttons that link to non-existent files.
**Why it happens:** The other three tools have Claude Skill files in `public/skills/`. GHA Validator does not.
**How to avoid:** Omit the "Claude Code:" skill download bar from the GHA Validator tool page. Only the companion content aside (blog link + rule docs link) should be added.
**Warning signs:** 404 errors on skill download links.

### Pitfall 7: Blog Post Length and Quality
**What goes wrong:** Writing a shallow blog post that does not drive organic traffic.
**Why it happens:** Rushing the content.
**How to avoid:** Follow the `kubernetes-manifest-best-practices.mdx` pattern: start with a bold OpeningStatement, TldrSummary, then systematically walk through rules by category with code examples and rule doc links. Target 2000+ words. Cover: what GitHub Actions is, common security mistakes, the two-pass architecture, scoring methodology, and a comprehensive walkthrough of rules by category.
**Warning signs:** Blog post under 1500 words.

### Pitfall 8: OG Image Code Panel Content
**What goes wrong:** Using generic YAML in the OG image code panel instead of recognizable GitHub Actions workflow syntax.
**Why it happens:** Copying the Compose Validator OG image pattern verbatim.
**How to avoid:** Use GHA-specific YAML lines: `name:`, `on: push`, `permissions: write-all` (error marker), `uses: actions/checkout@v3` (warning marker), `run: echo ${{ github.event... }}` (error marker). These immediately signal "GitHub Actions" to viewers.
**Warning signs:** OG image code panel looks identical to Docker/K8s tools.

## Code Examples

### GhaValidatorJsonLd.astro (New File)
```astro
---
/**
 * GhaValidatorJsonLd.astro -- SoftwareApplication JSON-LD structured data
 * for the GitHub Actions Workflow Validator tool page.
 */
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "GitHub Actions Workflow Validator",
  "description": "Free browser-based GitHub Actions workflow validator and best-practice analyzer. 48 rules across schema, security, semantic, best-practice, style, and actionlint categories. Two-pass analysis with actionlint WASM. Scored by a Kubernetes architect with 17+ years of experience.",
  "url": "https://patrykgolabek.dev/tools/gha-validator/",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "softwareVersion": "1.0",
  "datePublished": "2026-03-04",
  "screenshot": "https://patrykgolabek.dev/open-graph/tools/gha-validator.png",
  "softwareHelp": {
    "@type": "CreativeWork",
    "name": "GitHub Actions Best Practices",
    "url": "https://patrykgolabek.dev/blog/github-actions-best-practices/",
  },
  "keywords": [
    "github actions validator",
    "github actions linter",
    "github actions best practices",
    "github workflow validator",
    "github actions security",
    "actionlint online",
    "github actions checker",
    "workflow yaml validator",
    "github actions workflow lint",
  ],
  "featureList": [
    "48 validation rules across 6 categories (schema, security, semantic, best-practice, style, actionlint)",
    "Two-pass analysis: instant schema + custom rules, plus deep actionlint WASM",
    "Category-weighted scoring with letter grades (A+ through F)",
    "Inline CodeMirror annotations with severity-colored gutter markers",
    "actionlint WASM integration for deep semantic analysis",
    "100% client-side analysis -- no data transmitted",
    "YAML syntax highlighting with CodeMirror 6",
    "Shareable URLs with lz-string compression",
    "Score badge PNG download for social sharing",
    "48 individual rule documentation pages with fix examples",
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "author": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
    "name": "Patryk Golabek",
    "url": "https://patrykgolabek.dev/",
  },
  "isPartOf": {
    "@type": "WebSite",
    "@id": "https://patrykgolabek.dev/#website",
  },
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### OG Image API Route (New File)
```typescript
// src/pages/open-graph/tools/gha-validator.png.ts
import type { APIRoute } from 'astro';
import { generateGhaValidatorOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateGhaValidatorOgImage();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Blog Post Frontmatter and Opening
```mdx
---
title: "GitHub Actions Best Practices"
description: "Production-tested guide to writing secure GitHub Actions workflows. 48 rules across security, semantic correctness, best practices, and style with fix examples."
publishedDate: 2026-03-04
tags: ["github-actions", "ci-cd", "devops", "security", "yaml", "automation"]
draft: false
---

import OpeningStatement from '../../components/blog/OpeningStatement.astro';
import TldrSummary from '../../components/blog/TldrSummary.astro';
import KeyTakeaway from '../../components/blog/KeyTakeaway.astro';
import Callout from '../../components/blog/Callout.astro';

<OpeningStatement>Most GitHub Actions workflows in production right now have at least five preventable security issues. I built a tool to find all of them.</OpeningStatement>

After 17 years building cloud-native systems, I have reviewed hundreds of CI/CD pipelines. The patterns keep repeating...

<TldrSummary>

- **48 rules** across **6 categories**: Schema, Security, Semantic, Best Practice, Style, Actionlint
- **Two-pass analysis**: instant schema + custom rules, then deep actionlint WASM
- Scoring: **0-100** with letter grades, category-weighted by security impact
- **100% client-side**: your workflow files never leave your browser
- Try it now: [GitHub Actions Workflow Validator](/tools/gha-validator/)

</TldrSummary>
```

### LLMs.txt Entry
```typescript
// Add to the 'Interactive Tools' section in llms.txt.ts, after K8s Manifest Analyzer entry:
'',
'- GitHub Actions Workflow Validator: 48-rule engine analyzing GitHub Actions workflows for schema, security, semantic, best-practice, style, and actionlint issues. Two-pass analysis: instant schema + custom rules, plus deep actionlint WASM. Category-weighted scoring with letter grades. 100% client-side.',
'  URL: https://patrykgolabek.dev/tools/gha-validator/',
'  Rules: https://patrykgolabek.dev/tools/gha-validator/rules/ga-c001/ (48 individual rule documentation pages)',
'  Blog: https://patrykgolabek.dev/blog/github-actions-best-practices/',
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GHA Validator not on homepage or tools page | Homepage callout + tools page card | This phase | Tool discoverable from all entry points |
| No structured data on GHA Validator page | SoftwareApplication + BreadcrumbList JSON-LD | This phase | Search engines understand tool purpose |
| Tools page shows 3 tools | Tools page shows 4 tools | This phase | Complete toolkit representation |
| No OG image for GHA Validator | Branded 1200x630 OG image via Satori | This phase | Social sharing generates click-through |
| No companion blog post | Comprehensive best-practices guide with rule links | This phase | Organic traffic driver, keyword targeting |
| LLMs.txt missing GHA Validator | Complete Interactive Tools section | This phase | AI agents discover the tool |
| Tool page says "40 rules" | Corrected to "48 rules" | This phase | Accurate feature claims |

**Established precedents from earlier phases:**
- Phase 26 (Dockerfile Analyzer SEO): Established DockerfileAnalyzerJsonLd, BreadcrumbJsonLd, homepage callout, and tools page card patterns
- Phase 39 (Compose Validator Site Integration): Replicated Phase 26 patterns for second tool
- Phase 40 (Compose Validator OG + Blog): Established OG image and companion blog post patterns
- K8s Analyzer Integration: Added K8sAnalyzerJsonLd, OG image, blog post, Claude Skill downloads

## Open Questions

1. **Homepage grid layout with 4 tool cards**
   - What we know: The homepage Tools section currently uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with 3 cards (perfectly fills grid). Adding a 4th card creates a 3+1 layout on desktop.
   - What's unclear: Whether to change the grid to `lg:grid-cols-4` (4 even columns), `lg:grid-cols-2` (2x2), or keep `lg:grid-cols-3` (3+1 is acceptable).
   - Recommendation: Keep `lg:grid-cols-3` -- 3+1 is a common and acceptable card layout. The orphan card fills the first column of the second row. If visually undesirable, switch to `sm:grid-cols-2 lg:grid-cols-4` or `sm:grid-cols-2` (2x2 on all breakpoints).

2. **Claude Skill for GHA Validator**
   - What we know: The other three tools (Dockerfile Analyzer, Compose Validator, K8s Analyzer) all have Claude Skill files at `/public/skills/` with download buttons on their tool pages. GHA Validator has no skills.
   - What's unclear: Whether to create a Claude Skill for the GHA Validator as part of this phase.
   - Recommendation: Do NOT create a Claude Skill in this phase -- it is not in the requirements (SITE-01 through BLOG-03). Omit the skill download bar from the tool page. A skill could be added in a future phase.

3. **Blog post depth and length**
   - What we know: The k8s blog post is very long (hundreds of lines) and covers all 67 rules in detail. The compose post is similarly comprehensive.
   - What's unclear: How detailed the GHA blog post should be.
   - Recommendation: Follow the established pattern -- cover all rule categories with representative rules, link to individual rule docs for depth. Target 2000-3000 words covering: what GitHub Actions is, top 10 best practices, then category-by-category walkthrough with code examples. The two-pass architecture with actionlint WASM is a unique differentiator worth highlighting.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (installed) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | Tool page renders with full editor | smoke / manual-only | Manual: visit `/tools/gha-validator/` | N/A - manual verification |
| SITE-02 | Header nav has Tools link | manual-only | Manual: inspect Header.astro navLinks array | N/A - already verified in research |
| SITE-03 | Homepage has GHA callout card | manual-only | Manual: visit `/` and check Tools section | N/A - manual verification |
| SITE-04 | Tools page has GHA card | manual-only | Manual: visit `/tools/` | N/A - manual verification |
| SITE-05 | JSON-LD SoftwareApplication present | manual-only | Manual: view page source for `application/ld+json` | N/A - manual verification |
| SITE-06 | OG image renders | smoke | `curl -s http://localhost:4321/open-graph/tools/gha-validator.png -o /dev/null -w "%{http_code}"` | N/A - build verification |
| SITE-07 | Breadcrumbs on tool page | manual-only | Manual: view page source for BreadcrumbList JSON-LD | N/A - manual verification |
| SITE-08 | All pages in sitemap | smoke | `npx astro build && grep -c 'gha-validator' dist/sitemap-*.xml` | N/A - build verification |
| SITE-09 | Correct meta descriptions | manual-only | Manual: view page source, confirm "48 rules" not "40 rules" | N/A - manual verification |
| SITE-10 | LLMs.txt has GHA entry | smoke | `npx astro build && grep -c 'gha-validator' dist/llms.txt` | N/A - build verification |
| BLOG-01 | Blog post renders | smoke / manual-only | Manual: visit `/blog/github-actions-best-practices/` | N/A - manual verification |
| BLOG-02 | Bidirectional cross-links | manual-only | Manual: check tool page aside + blog post CTAs | N/A - manual verification |
| BLOG-03 | Blog links to rule docs | manual-only | Manual: check blog post for rule page links | N/A - manual verification |

### Sampling Rate
- **Per task commit:** `npx astro build` (verifies all pages generate without errors)
- **Per wave merge:** `npx vitest run && npx astro build`
- **Phase gate:** Full build green, manual spot-check of all 13 requirements

### Wave 0 Gaps
None -- existing test infrastructure and build process covers all phase requirements. The primary verification mechanism is `npx astro build` (which fails if any page template has errors) plus manual visual/source inspection.

## Sources

### Primary (HIGH confidence)
- `src/pages/tools/gha-validator/index.astro` -- Current minimal tool page. Verified current state: no JSON-LD, no BreadcrumbJsonLd, no ogImage, "40 rules" in description.
- `src/pages/tools/gha-validator/rules/[code].astro` -- Rule pages already have BreadcrumbJsonLd + FAQPageJsonLd. Verified.
- `src/lib/tools/gha-validator/rules/index.ts` -- 48 documented rules (22 custom + 18 actionlint + 8 schema). Verified.
- `src/lib/tools/gha-validator/types.ts` -- Category weights: Security 35%, Semantic 20%, Best Practice 20%, Schema 15%, Style 10%.
- `src/components/K8sAnalyzerJsonLd.astro` -- SoftwareApplication JSON-LD pattern to replicate. Verified structure.
- `src/components/ComposeValidatorJsonLd.astro` -- Second SoftwareApplication example. Verified consistent structure.
- `src/components/BreadcrumbJsonLd.astro` -- BreadcrumbList component with `crumbs` prop. Verified.
- `src/components/Header.astro` -- navLinks array has 8 items including `{ href: '/tools/', label: 'Tools' }`. Verified.
- `src/pages/index.astro` -- Homepage with "Reference Guides" (3 cards) and "Tools" (3 cards) sections. Verified current state.
- `src/pages/tools/index.astro` -- Tools page with 3 tool cards in `grid-cols-1 sm:grid-cols-2`. Verified.
- `src/lib/og-image.ts` -- OG image generators for all tools. `generateK8sAnalyzerOgImage()` at line 1412, `generateComposeValidatorOgImage()` at line 846. Verified two-column layout pattern with `renderOgPng()`, `accentBar()`, `brandingRow()`.
- `src/pages/open-graph/tools/k8s-analyzer.png.ts` -- OG image API route pattern. Verified.
- `src/pages/llms.txt.ts` -- LLMs.txt generator with Interactive Tools section. Verified structure and entry pattern.
- `src/pages/blog/[slug].astro` -- Blog post template with hardcoded `isK8sPost`, `isComposePost`, `isDockerfilePost` checks, `articleSection`, `aboutDataset`, and per-post FAQPageJsonLd. Verified.
- `src/data/blog/kubernetes-manifest-best-practices.mdx` -- Companion blog post pattern. Verified frontmatter, component imports, and rule linking structure.
- `src/content.config.ts` -- Blog collection uses glob loader for `src/data/blog/*.{md,mdx}`. Verified.
- `astro.config.mjs` -- Sitemap filters only `/404`. All static pages auto-included. Verified.
- `public/skills/` -- Contains compose-validator, dockerfile-analyzer, k8s-analyzer. No gha-validator. Verified.
- `src/pages/tools/dockerfile-analyzer/index.astro` -- Most mature tool page with ogImage, skill downloads, companion guide link. Verified pattern.

### Secondary (MEDIUM confidence)
- [schema.org/SoftwareApplication](https://schema.org/SoftwareApplication) -- SoftwareApplication type properties. Well-established schema used consistently across the project.
- Phase 39 research (`.planning/phases/39-tool-page-site-integration/39-RESEARCH.md`) -- Established integration patterns. Cross-verified with current source.
- Phase 40 research (`.planning/phases/40-og-images-blog-post-polish/40-RESEARCH.md`) -- Established OG image + blog post patterns. Cross-verified with current source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zero new dependencies. All components proven in production across 3 prior tool integrations.
- Architecture: HIGH -- Every pattern has been implemented before for Dockerfile Analyzer, Compose Validator, and K8s Analyzer. This is a direct replication.
- Pitfalls: HIGH -- Key discovery about "40 rules" vs "48 rules" mismatch prevents an accuracy error. All other pitfalls verified from source code and prior phase research.
- Blog post: HIGH -- Established pattern from 3 prior companion blog posts. MDX collection, components, and rendering pipeline all verified.

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- all dependencies are project-internal; no external API changes expected)
