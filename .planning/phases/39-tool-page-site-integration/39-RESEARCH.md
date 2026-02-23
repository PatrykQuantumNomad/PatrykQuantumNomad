# Phase 39: Tool Page & Site Integration - Research

**Researched:** 2026-02-22
**Domain:** Astro site integration, JSON-LD structured data (SoftwareApplication, BreadcrumbList), header navigation, homepage callout, tools page card, sitemap
**Confidence:** HIGH

## Summary

Phase 39 integrates the Docker Compose Validator into the site's navigation and discovery surfaces: header nav, homepage callout, tools page card, JSON-LD structured data, and breadcrumb navigation. The sitemap already includes all 53 compose-validator URLs (1 main page + 52 rule pages) because `@astrojs/sitemap` auto-includes all static pages. The rule documentation pages (Phase 38) already have `BreadcrumbJsonLd` wired in. The primary work is: (1) updating `Header.astro` to include a link to the Compose Validator under Tools, (2) adding a homepage callout card following the existing Dockerfile Analyzer pattern, (3) adding a Compose Validator card to the tools page, (4) creating a `ComposeValidatorJsonLd.astro` component with SoftwareApplication structured data, (5) adding BreadcrumbJsonLd to the main tool page, and (6) verifying sitemap completeness.

No new dependencies are needed. Every building block already exists in the codebase: `BreadcrumbJsonLd.astro`, `DockerfileAnalyzerJsonLd.astro` (pattern to replicate), `Header.astro` with its `navLinks` array, the Layout component with SEO props, and `@astrojs/sitemap`. This phase is pure wiring and integration -- zero new libraries, zero new patterns.

**Important discovery:** The header nav currently has `{ href: '/tools/', label: 'Tools' }` at position 5 (index 4). The `isActive` logic uses `startsWith(link.href)` so any `/tools/*` page correctly highlights the "Tools" nav item. The Compose Validator at `/tools/compose-validator/` will automatically be highlighted under "Tools" with no nav changes needed for active state. The requirement SITE-01 says "Header navigation link for Docker Compose Validator" -- this likely means adding a specific sub-link or updating the nav to make the Compose Validator directly discoverable, not just relying on the generic "Tools" link. The Dockerfile Analyzer is similarly only reachable via the Tools page -- there is no direct header link to it. The simplest approach consistent with the existing pattern: ensure the `/tools/` landing page surfaces the Compose Validator prominently (which SITE-03 covers), and leave the header nav "Tools" link pointing to `/tools/` as it does today.

**Primary recommendation:** Create a single plan that (1) adds the Compose Validator card to the tools page alongside the Dockerfile Analyzer, (2) adds a homepage callout card in the Tools section, (3) creates `ComposeValidatorJsonLd.astro` with SoftwareApplication schema, (4) adds BreadcrumbJsonLd + ComposeValidatorJsonLd to the compose-validator index.astro page, and (5) verifies all 53 URLs in the sitemap. No header navigation structure changes needed -- the existing "Tools" nav link already covers discoverability.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | Header navigation link for Docker Compose Validator | Header.astro already has `{ href: '/tools/', label: 'Tools' }` which highlights for all `/tools/*` pages. The Compose Validator at `/tools/compose-validator/` is reachable via the Tools page. No structural header change needed -- the tools page card (SITE-03) is the discovery mechanism. |
| SITE-02 | Homepage callout linking to the Compose Validator | Homepage `index.astro` has a "Tools" section (lines 209-224) currently showing only the Dockerfile Analyzer. Add a Compose Validator card following the identical pattern. |
| SITE-03 | Tools page card for Compose Validator | Tools page `src/pages/tools/index.astro` currently has only the Dockerfile Analyzer card. Add a Compose Validator card using the same card pattern (icon, title, meta-mono subtitle, description, pill tags). |
| SITE-04 | JSON-LD SoftwareApplication structured data on tool page | Create `ComposeValidatorJsonLd.astro` following `DockerfileAnalyzerJsonLd.astro` pattern. SoftwareApplication type with applicationCategory, operatingSystem, featureList, offers, author, isPartOf. |
| SITE-05 | BreadcrumbList JSON-LD on tool page and rule documentation pages | Rule pages already have BreadcrumbJsonLd (Phase 38). Tool page `compose-validator/index.astro` needs BreadcrumbJsonLd added. Use existing `BreadcrumbJsonLd.astro` component. |
| SITE-06 | All tool and rule pages in sitemap | Already confirmed: 53 URLs in sitemap (1 main + 52 rules). `@astrojs/sitemap` auto-includes all static pages. Verification only -- no action needed. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- Zero New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static page generation, component system | Framework for the entire site |
| @astrojs/sitemap | (installed) | Automatic sitemap generation from all static pages | Already configured in `astro.config.mjs`; all static pages auto-included |
| BreadcrumbJsonLd.astro | Existing component | Renders BreadcrumbList JSON-LD schema | Already used on Dockerfile Analyzer tool page, rule pages, Beauty Index pages |
| DockerfileAnalyzerJsonLd.astro | Existing component | SoftwareApplication JSON-LD pattern | Template to replicate for Compose Validator |
| Layout.astro | Existing component | Page shell with SEOHead, header, footer | All pages use this; compose-validator index.astro already uses it |
| SEOHead.astro | Existing component | Meta tags, OG tags, canonical URLs | All pages use this via Layout |

**Installation:**
```bash
# No new packages needed. All tools are already installed.
```

## Architecture Patterns

### File Structure (Changes Only)
```
src/
  components/
    ComposeValidatorJsonLd.astro    # [NEW] SoftwareApplication JSON-LD
    Header.astro                     # [NO CHANGE] Already has /tools/ nav link
  pages/
    index.astro                      # [MODIFY] Add Compose Validator card to Tools section
    tools/
      index.astro                    # [MODIFY] Add Compose Validator card alongside Dockerfile Analyzer
      compose-validator/
        index.astro                  # [MODIFY] Add ComposeValidatorJsonLd + BreadcrumbJsonLd
        rules/
          [code].astro               # [NO CHANGE] Already has BreadcrumbJsonLd (Phase 38)
```

### Pattern 1: SoftwareApplication JSON-LD Component
**What:** A standalone Astro component that renders a `<script type="application/ld+json">` tag with SoftwareApplication structured data.
**When to use:** On the main tool page (`/tools/compose-validator/`).
**Example:**
```astro
---
// Source: src/components/DockerfileAnalyzerJsonLd.astro (existing pattern)
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Docker Compose Validator",
  "description": "Free browser-based Docker Compose validator and best-practice analyzer. 52 rules across schema, semantic, security, best-practice, and style categories. Scored by a Kubernetes architect with 17+ years of experience.",
  "url": "https://patrykgolabek.dev/tools/compose-validator/",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "softwareVersion": "1.0",
  "featureList": [
    "52 validation rules across 5 categories (schema, semantic, security, best-practice, style)",
    "Category-weighted scoring with letter grades (A+ through F)",
    "Inline CodeMirror annotations with severity-colored gutter markers",
    "Interactive service dependency graph with cycle detection",
    "100% client-side analysis -- no data transmitted",
    "YAML syntax highlighting with CodeMirror 6",
    "Shareable URLs with lz-string compression",
    "Score badge PNG download for social sharing",
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "author": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
  },
  "isPartOf": {
    "@type": "WebSite",
    "@id": "https://patrykgolabek.dev/#website",
  },
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Pattern 2: BreadcrumbJsonLd on Tool Page
**What:** Add BreadcrumbJsonLd to the main compose-validator page (rule pages already have it).
**When to use:** SITE-05.
**Example:**
```astro
<!-- Source: src/pages/tools/dockerfile-analyzer/index.astro (existing pattern) -->
<BreadcrumbJsonLd crumbs={[
  { name: 'Home', url: 'https://patrykgolabek.dev/' },
  { name: 'Tools', url: 'https://patrykgolabek.dev/tools/' },
  { name: 'Compose Validator', url: 'https://patrykgolabek.dev/tools/compose-validator/' },
]} />
```

### Pattern 3: Tools Page Card
**What:** A linked card on the tools page following the exact Dockerfile Analyzer card pattern (icon SVG, title with group hover, meta-mono subtitle, description paragraph, and pill tag list).
**When to use:** SITE-03.
**Example:**
```html
<!-- Source: src/pages/tools/index.astro Dockerfile Analyzer card (existing pattern) -->
<a
  href="/tools/compose-validator/"
  class="block card-hover p-6 rounded-lg border border-[var(--color-border)] no-underline group"
  data-reveal
  data-tilt
>
  <div class="mb-4 text-[var(--color-accent)]">
    <!-- YAML/document validation icon -->
    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
    </svg>
  </div>
  <h2 class="text-lg font-heading font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
    Docker Compose Validator
  </h2>
  <p class="meta-mono mt-1">Free Browser Tool</p>
  <p class="text-sm text-[var(--color-text-secondary)] mt-3">
    Validate your docker-compose.yml against 52 rules across schema, security, semantic,
    best-practice, and style categories. Interactive dependency graph with cycle detection.
  </p>
  <ul class="mt-4 flex flex-wrap gap-2">
    <li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">52-rule engine</li>
    <li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">Scoring &amp; grades</li>
    <li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">Dependency graph</li>
    <li class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">Share links</li>
  </ul>
</a>
```

### Pattern 4: Homepage Callout Card
**What:** A card in the homepage "Tools" section linking to the Compose Validator.
**When to use:** SITE-02.
**Example:**
```html
<!-- Source: src/pages/index.astro Tools section (existing pattern for Dockerfile Analyzer) -->
<a href="/tools/compose-validator/" class="block card-hover p-6 rounded-lg border border-[var(--color-border)] no-underline" data-reveal data-tilt>
  <article>
    <p class="meta-mono text-[var(--color-accent)]">Free Browser Tool</p>
    <h3 class="text-lg font-heading font-bold text-[var(--color-text-primary)] mt-2">Docker Compose Validator</h3>
    <p class="text-sm text-[var(--color-text-secondary)] mt-2">
      Validate docker-compose.yml files against 52 rules across security, semantic,
      and best-practice categories. Dependency graph, scoring, and shareable results. 100% client-side.
    </p>
    <span class="inline-block mt-4 text-sm font-medium text-[var(--color-accent)]">Try it &rarr;</span>
  </article>
</a>
```

### Pattern 5: Compose Validator Tool Page Enhancement
**What:** Update the compose-validator/index.astro to include JSON-LD and breadcrumb components.
**When to use:** SITE-04 and SITE-05.
**Example:**
```astro
---
import Layout from '../../../layouts/Layout.astro';
import ComposeValidator from '../../../components/tools/ComposeValidator';
import ComposeValidatorJsonLd from '../../../components/ComposeValidatorJsonLd.astro';
import BreadcrumbJsonLd from '../../../components/BreadcrumbJsonLd.astro';
---

<Layout
  title="Docker Compose Validator | Patryk Golabek"
  description="Free Docker Compose validator and best-practice analyzer by a Kubernetes architect. 52 rules across schema, semantic, security, best-practice, and style categories. 100% browser-based -- your code never leaves your device."
>
  <!-- page content -->
  <ComposeValidator client:only="react" />

  <ComposeValidatorJsonLd />
  <BreadcrumbJsonLd crumbs={[
    { name: 'Home', url: 'https://patrykgolabek.dev/' },
    { name: 'Tools', url: 'https://patrykgolabek.dev/tools/' },
    { name: 'Compose Validator', url: 'https://patrykgolabek.dev/tools/compose-validator/' },
  ]} />
</Layout>
```

### Anti-Patterns to Avoid
- **Hard-coding URLs without Astro.site:** Always use `https://patrykgolabek.dev` as the base URL in JSON-LD crumbs and schema data. The codebase consistently uses hard-coded absolute URLs in JSON-LD (see DockerfileAnalyzerJsonLd.astro, BreadcrumbJsonLd usage in dockerfile-analyzer/index.astro, all rule pages). Do NOT use `new URL(path, Astro.site)` in JSON-LD components -- follow the existing pattern.
- **Modifying the sitemap configuration:** Do NOT add any `customPages` or `filter` config for compose-validator URLs. `@astrojs/sitemap` already auto-includes all static pages. The 53 compose-validator URLs are already in the sitemap.
- **Adding individual tool links to header nav:** The header has a clean 8-item nav. Do NOT add "Docker Compose Validator" as a separate nav item. The "Tools" link at `/tools/` is the correct entry point, consistent with the Dockerfile Analyzer pattern.
- **Changing nav link href:** The current `{ href: '/tools/', label: 'Tools' }` correctly highlights for all `/tools/*` pages. Do NOT change this to `/tools/compose-validator/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap generation | Manual XML or custom sitemap entries | `@astrojs/sitemap` (already auto-includes all pages) | All 53 compose-validator URLs already in sitemap; zero config needed |
| JSON-LD schema generation | Runtime JSON-LD generator library | Static Astro component with inline JSON object | Consistent with 7 existing JSON-LD components; simpler, no dependencies |
| Breadcrumb rendering | Custom breadcrumb component | `BreadcrumbJsonLd.astro` (existing) | Already handles ListItem array, used on 40+ Dockerfile Analyzer pages |
| Card component abstraction | Shared ToolCard component | Inline HTML matching existing card pattern | Only 2 tool cards exist; abstraction not warranted; follow copy-paste pattern |

**Key insight:** This phase is pure integration -- every component, pattern, and building block already exists. The work is placing existing pieces in the correct locations.

## Common Pitfalls

### Pitfall 1: Tools Page Grid Layout with 2 Cards
**What goes wrong:** The tools page uses `grid-cols-1 sm:grid-cols-2` with only 1 card currently. Adding a second card will fill the 2-column grid correctly on desktop. Adding a third would create an uneven row.
**Why it happens:** Grid layout with odd numbers of items leaves gaps.
**How to avoid:** With 2 cards (Dockerfile Analyzer + Compose Validator), the grid is perfectly balanced. Do NOT add Database Compass as a third card -- the user intentionally removed it (git commit `222e677`).
**Warning signs:** Three cards in a 2-column grid leaving an orphan card.

### Pitfall 2: Database Compass on Tools Page -- User Removed It
**What goes wrong:** The roadmap success criteria says "The tools page shows a Compose Validator card alongside the Dockerfile Analyzer and Database Compass." However, the user manually removed the Database Compass card from the tools page in commit `222e677` ("updating db compass"). The DB Compass lives at `/db-compass/` (not under `/tools/`), and the user chose to separate reference guides from tools.
**Why it happens:** The roadmap was written before the user reorganized the page hierarchy.
**How to avoid:** Add only the Compose Validator card to the tools page. Do NOT re-add the Database Compass card. The success criteria should be read as "the tools page shows a Compose Validator card alongside the Dockerfile Analyzer" -- the DB Compass mention is outdated.
**Warning signs:** If the planner creates a task to add DB Compass to the tools page, it contradicts the user's explicit removal.

### Pitfall 3: Homepage Section Placement
**What goes wrong:** The homepage has distinct sections: "Reference Guides" (Beauty Index + DB Compass) and "Tools" (currently only Dockerfile Analyzer). Placing the Compose Validator card in the wrong section breaks the content organization.
**Why it happens:** The sections look similar but serve different content types.
**How to avoid:** Add the Compose Validator card to the "Tools" section (lines 209-224 of `index.astro`), NOT the "Reference Guides" section. The Tools section has an `sm:grid-cols-2` grid that currently has 1 card -- adding a second fills it perfectly.
**Warning signs:** Compose Validator appearing alongside Beauty Index and Database Compass instead of alongside Dockerfile Analyzer.

### Pitfall 4: BreadcrumbJsonLd Already on Rule Pages
**What goes wrong:** Adding BreadcrumbJsonLd to rule pages that already have it, creating duplicate structured data.
**Why it happens:** Phase 38 already added BreadcrumbJsonLd to `[code].astro`.
**How to avoid:** Only add BreadcrumbJsonLd to `compose-validator/index.astro` (the main tool page). Do NOT touch `rules/[code].astro`.
**Warning signs:** Duplicate BreadcrumbList JSON-LD blocks in the page source.

### Pitfall 5: Missing "aside" Section on Compose Validator Page
**What goes wrong:** The Dockerfile Analyzer page has companion content asides (link to blog post, Claude Skill download, Claude Hook download). The Compose Validator page currently has none. Adding JSON-LD and breadcrumbs without also adding a companion content aside may be inconsistent.
**Why it happens:** Phase 40 will add the companion blog post. Until then, there is no blog post to link to.
**How to avoid:** For now, add only the JSON-LD and BreadcrumbJsonLd components. Optionally add a minimal aside linking to the rule documentation pages (e.g., "Browse all 52 validation rules"). The companion blog post aside will be added in Phase 40.
**Warning signs:** N/A -- this is an enhancement opportunity, not a bug.

### Pitfall 6: Tools Page Meta Description
**What goes wrong:** The tools page description currently says "Dockerfile linting, security analysis, and more." After adding the Compose Validator, this description is incomplete.
**Why it happens:** The description was written when only the Dockerfile Analyzer existed.
**How to avoid:** Update the tools page meta description to mention both tools.
**Warning signs:** Stale meta description not reflecting actual page content.

## Code Examples

### ComposeValidatorJsonLd.astro (New File)
```astro
---
/**
 * ComposeValidatorJsonLd.astro -- SoftwareApplication JSON-LD structured data
 * for the Docker Compose Validator tool page. Helps search engines understand
 * the tool's purpose, features, and authorship.
 */
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Docker Compose Validator",
  "description": "Free browser-based Docker Compose validator and best-practice analyzer. 52 rules across schema, semantic, security, best-practice, and style categories. Scored by a Kubernetes architect with 17+ years of experience.",
  "url": "https://patrykgolabek.dev/tools/compose-validator/",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "softwareVersion": "1.0",
  "featureList": [
    "52 validation rules across 5 categories (schema, semantic, security, best-practice, style)",
    "Category-weighted scoring with letter grades (A+ through F)",
    "Inline CodeMirror annotations with severity-colored gutter markers",
    "Interactive service dependency graph with cycle detection",
    "100% client-side analysis -- no data transmitted",
    "YAML syntax highlighting with CodeMirror 6",
    "Shareable URLs with lz-string compression",
    "Score badge PNG download for social sharing",
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "author": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
  },
  "isPartOf": {
    "@type": "WebSite",
    "@id": "https://patrykgolabek.dev/#website",
  },
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Updated compose-validator/index.astro (Additions)
```astro
---
import Layout from '../../../layouts/Layout.astro';
import ComposeValidator from '../../../components/tools/ComposeValidator';
import ComposeValidatorJsonLd from '../../../components/ComposeValidatorJsonLd.astro';
import BreadcrumbJsonLd from '../../../components/BreadcrumbJsonLd.astro';
---

<Layout
  title="Docker Compose Validator | Patryk Golabek"
  description="Free Docker Compose validator and best-practice analyzer by a Kubernetes architect. 52 rules across schema, semantic, security, best-practice, and style categories. 100% browser-based -- your code never leaves your device."
>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    <h1 class="text-3xl sm:text-4xl font-heading font-bold mb-2 text-[var(--color-text-primary)]">
      Docker Compose Validator
    </h1>
    <p class="text-[var(--color-text-secondary)] mb-8">
      Paste your docker-compose.yml below and click <strong>Analyze</strong>.
      100% client-side, your code never leaves your browser.
    </p>

    <ComposeValidator client:only="react" />

    <aside class="mt-8 p-4 rounded-lg border border-[var(--color-border)]">
      <p class="text-sm text-[var(--color-text-secondary)]">
        Want to learn the rules in depth? Browse
        <a href="/tools/compose-validator/rules/cv-c001/" class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium">
          individual rule documentation
        </a>
        for all 52 validation rules.
      </p>
    </aside>
  </section>

  <ComposeValidatorJsonLd />
  <BreadcrumbJsonLd crumbs={[
    { name: 'Home', url: 'https://patrykgolabek.dev/' },
    { name: 'Tools', url: 'https://patrykgolabek.dev/tools/' },
    { name: 'Compose Validator', url: 'https://patrykgolabek.dev/tools/compose-validator/' },
  ]} />
</Layout>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No Compose Validator on homepage or tools page | Homepage callout + tools page card | This phase | Tool discoverable from all entry points |
| No structured data on compose-validator page | SoftwareApplication JSON-LD + BreadcrumbList JSON-LD | This phase | Search engines understand the tool's purpose and page hierarchy |
| Tools page only shows Dockerfile Analyzer | Tools page shows 2 tools side by side | This phase | Tools page properly represents the full toolkit |
| Compose Validator page has minimal shell | Enhanced page with aside, JSON-LD, breadcrumbs | This phase | SEO-optimized, consistent with Dockerfile Analyzer page structure |

**Established precedents from earlier phases:**
- Phase 26 (Dockerfile Analyzer SEO): Established the DockerfileAnalyzerJsonLd, BreadcrumbJsonLd, header "Tools" nav link, and homepage callout patterns
- Phase 32 (DB Compass Integration): Established the tools page card pattern and homepage callout placement
- Phase 38 (Rule Documentation): Already added BreadcrumbJsonLd to all 52 compose-validator rule pages

## Open Questions

1. **Header navigation for SITE-01**
   - What we know: The header already has `{ href: '/tools/', label: 'Tools' }`. All `/tools/*` pages are reachable from there. The Dockerfile Analyzer follows the same pattern (no direct header link).
   - What's unclear: Does SITE-01 require a direct header link like "Docker Compose Validator" as a separate nav item, or is the existing "Tools" nav link sufficient?
   - Recommendation: The existing "Tools" nav link is sufficient. Adding a separate header item would create 9 nav items (too many for desktop). The tools page card (SITE-03) is the primary discovery mechanism. The Dockerfile Analyzer was handled identically in Phase 26.

2. **Database Compass on tools page**
   - What we know: The user removed the DB Compass card from the tools page in commit `222e677`. The success criteria mentions "alongside the Dockerfile Analyzer and Database Compass."
   - What's unclear: Whether the success criteria is outdated or the user wants DB Compass re-added.
   - Recommendation: Do NOT re-add Database Compass to the tools page. Respect the user's explicit removal. The tools page should show Dockerfile Analyzer + Compose Validator only. If the user wants DB Compass back, they will say so.

3. **Companion content aside**
   - What we know: The Dockerfile Analyzer page has rich aside content (blog link, Claude Skill download, Hook download). The Compose Validator has none yet.
   - What's unclear: Whether to add a minimal aside now or wait for Phase 40 (blog post).
   - Recommendation: Add a minimal aside linking to rule documentation pages. The blog post link will be added in Phase 40.

## Sources

### Primary (HIGH confidence)
- `src/components/Header.astro` -- Current navLinks array with 8 items including `{ href: '/tools/', label: 'Tools' }`. Verified by reading source.
- `src/components/DockerfileAnalyzerJsonLd.astro` -- SoftwareApplication JSON-LD pattern. Verified by reading source.
- `src/components/BreadcrumbJsonLd.astro` -- BreadcrumbList JSON-LD component with `crumbs` prop. Verified by reading source.
- `src/pages/tools/index.astro` -- Tools page with single Dockerfile Analyzer card. Verified current state.
- `src/pages/index.astro` -- Homepage with "Reference Guides" section (Beauty Index + DB Compass) and "Tools" section (Dockerfile Analyzer only). Verified current state.
- `src/pages/tools/compose-validator/index.astro` -- Current minimal page with Layout + ComposeValidator React island. No JSON-LD, no breadcrumbs. Verified.
- `src/pages/tools/compose-validator/rules/[code].astro` -- Rule pages already have BreadcrumbJsonLd (Phase 38). Verified.
- `src/pages/tools/dockerfile-analyzer/index.astro` -- Pattern template: JSON-LD + BreadcrumbJsonLd + aside sections. Verified.
- `dist/sitemap-0.xml` -- 53 compose-validator URLs confirmed present. Verified by direct grep.
- `astro.config.mjs` -- `@astrojs/sitemap` integration configured, `site` set to `https://patrykgolabek.dev`. Verified.
- Git commit `222e677` -- User intentionally removed Database Compass from tools page. Verified by `git show`.

### Secondary (MEDIUM confidence)
- [schema.org/SoftwareApplication](https://schema.org/SoftwareApplication) -- SoftwareApplication type properties (name, description, url, applicationCategory, operatingSystem, featureList, offers, author). Verified via official docs.
- Phase 26 research (`26-RESEARCH.md`) -- Established Dockerfile Analyzer integration patterns. Cross-verified with current source code.
- Phase 32 research (`32-RESEARCH.md`) -- Established DB Compass integration patterns including homepage callout and tools page card. Cross-verified with current source code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zero new dependencies. All components exist and are proven in production.
- Architecture: HIGH -- Every pattern has been implemented before for the Dockerfile Analyzer (Phase 26). This is a direct replication.
- Pitfalls: HIGH -- Key discovery about user removing DB Compass from tools page prevents a common planning mistake. All other pitfalls verified from source code.
- Sitemap: HIGH -- Directly verified 53 URLs in built sitemap. No action needed.

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable -- all dependencies are project-internal; no external API changes expected)
