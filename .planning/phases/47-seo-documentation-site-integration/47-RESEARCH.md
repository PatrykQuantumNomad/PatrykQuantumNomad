# Phase 47: SEO, Documentation & Site Integration - Research

**Researched:** 2026-02-23
**Domain:** Astro static site generation, per-rule documentation pages, JSON-LD structured data, OG image generation, blog content authoring, site-wide navigation/sitemap/LLMs.txt integration
**Confidence:** HIGH

## Summary

Phase 47 integrates the K8s Manifest Analyzer fully into the existing Astro site. The project already has two completed tool integrations (Dockerfile Analyzer and Docker Compose Validator) that serve as exact blueprints for every deliverable in this phase. The K8s Analyzer tool page already exists at `/tools/k8s-analyzer/index.astro` with a BreadcrumbJsonLd component but lacks JSON-LD SoftwareApplication schema, OG image, rule documentation pages, companion blog post, and full site integration.

The K8s analyzer has 67 rules total: 10 schema rules (KA-S001 through KA-S010 defined in `diagnostic-rules.ts`) + 57 lint rules (20 security + 12 reliability + 12 best-practice + 8 cross-resource + 5 RBAC, defined across `rules/` subdirectories). The `allDocumentedK8sRules` export in `rules/index.ts` currently only includes the 57 lint rules -- it must be expanded to include all 10 schema rules for full rule documentation page generation.

The codebase follows an extremely consistent pattern across tools. Every established pattern (rule documentation pages, JSON-LD, OG images, related rules, companion blog posts, LLMs.txt, sitemap, homepage/tools page cards, header navigation) has been implemented identically for both existing tools, providing high-confidence templates for all work in this phase.

**Primary recommendation:** Follow the Dockerfile Analyzer and Docker Compose Validator patterns exactly. There are no architectural decisions to make -- only replication of proven patterns for the K8s analyzer.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site generator (SSG) with `getStaticPaths()` for 67 rule pages | Already in use; all tool pages use this pattern |
| Satori | ^0.19.2 | SVG-to-image for OG image generation at build time | Already used for all tool OG images via `src/lib/og-image.ts` |
| Sharp | ^0.34.5 | SVG-to-PNG conversion for OG images | Already used in `og-image.ts` |
| @astrojs/sitemap | (integrated) | Automatic sitemap generation | Already configured in `astro.config.mjs` |
| @astrojs/mdx | (integrated) | MDX blog post authoring | Already used for all companion blog posts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro-expressive-code | (integrated) | Syntax-highlighted code blocks in blog posts | Before/after YAML code examples in blog post |
| tailwindcss | (integrated) | All styling | Every page uses Tailwind via CSS variables |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Satori OG images | Static pre-made PNGs | Satori is already the standard; dynamic generation means less manual work |
| MDX blog post | Markdown only | MDX is the established pattern; enables `<Callout>`, `<TldrSummary>`, etc. components |

**Installation:**
No new packages needed. Everything required is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/tools/k8s-analyzer/
│   ├── index.astro              # EXISTS - needs JSON-LD, OG image, link updates
│   └── rules/
│       └── [code].astro         # NEW - 67 dynamic rule pages via getStaticPaths()
├── components/
│   └── K8sAnalyzerJsonLd.astro  # NEW - SoftwareApplication JSON-LD
├── lib/tools/k8s-analyzer/
│   ├── rules/
│   │   ├── index.ts             # EXISTS - needs allDocumentedK8sRules to include schema rules
│   │   └── related.ts           # NEW - getRelatedK8sRules() function
│   └── ...                      # existing rule engine files
├── pages/open-graph/tools/
│   └── k8s-analyzer.png.ts      # NEW - OG image API route
├── data/blog/
│   └── kubernetes-manifest-best-practices.mdx  # NEW - companion blog post
└── pages/llms.txt.ts            # EXISTS - needs K8s analyzer section
```

### Pattern 1: Dynamic Rule Documentation Pages (getStaticPaths)
**What:** Generate 67 static pages at build time from the rule data
**When to use:** This is the standard pattern for all tool rule pages
**Example:**
```typescript
// Source: src/pages/tools/dockerfile-analyzer/rules/[code].astro (existing pattern)
// Source: src/pages/tools/compose-validator/rules/[code].astro (existing pattern)
export function getStaticPaths() {
  return allDocumentedK8sRules.map((rule) => ({
    params: { code: rule.id.toLowerCase() },
    props: { rule },
  }));
}
```

### Pattern 2: Rule Documentation Page Content
**What:** Each rule page follows a fixed section structure
**Sections (in order):**
1. Header: Rule ID + Title (h1), severity badge, category badge
2. PSS Profile tag (if applicable) + CIS Benchmark reference (if applicable)
3. "Why This Matters" section with explanation text
4. "How to Fix" section with description + before/after code blocks (lang="yaml")
5. "Rule Details" definition list: Rule Code, Severity, Category
6. "Related Rules" section (same category, sorted by severity, limit 5)
7. Footer with back-links to tool page and blog post

**Source:** `src/pages/tools/dockerfile-analyzer/rules/[code].astro` and `src/pages/tools/compose-validator/rules/[code].astro` -- identical layout patterns.

### Pattern 3: PSS Profile and CIS Benchmark Tags
**What:** Security rules that map to PSS Baseline/Restricted profiles get visual tags; rules mapping to CIS Benchmark sections get reference links
**Data source:** `pss-compliance.ts` already defines `PSS_BASELINE_RULES` (8 rule IDs) and `PSS_RESTRICTED_RULES` (5 rule IDs)
**Implementation:** Import PSS sets in the [code].astro page and conditionally render PSS profile badges. CIS benchmark references need to be added as metadata to applicable rules.
```typescript
// Existing data in pss-compliance.ts:
export const PSS_BASELINE_RULES = new Set([
  'KA-C001', 'KA-C006', 'KA-C007', 'KA-C008',
  'KA-C009', 'KA-C010', 'KA-C013', 'KA-C014',
]);
export const PSS_RESTRICTED_RULES = new Set([
  'KA-C002', 'KA-C003', 'KA-C004', 'KA-C005', 'KA-C011',
]);
```

### Pattern 4: SoftwareApplication JSON-LD
**What:** Structured data for search engines to understand the tool
**Template:** `src/components/DockerfileAnalyzerJsonLd.astro` and `src/components/ComposeValidatorJsonLd.astro`
```typescript
// Source: DockerfileAnalyzerJsonLd.astro (existing pattern)
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Kubernetes Manifest Analyzer",
  "description": "...",
  "url": "https://patrykgolabek.dev/tools/k8s-analyzer/",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "softwareVersion": "1.0",
  "datePublished": "2026-02-23",
  "screenshot": "https://patrykgolabek.dev/open-graph/tools/k8s-analyzer.png",
  "softwareHelp": { ... },
  "keywords": [...],
  "featureList": [...],
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "@id": "https://patrykgolabek.dev/#person", ... },
  "isPartOf": { "@type": "WebSite", "@id": "https://patrykgolabek.dev/#website" },
};
```

### Pattern 5: OG Image Generation
**What:** Build-time Satori+Sharp OG image with two-column layout (text left, YAML code panel right)
**Template:** `generateComposeValidatorOgImage()` and `generateDockerfileAnalyzerOgImage()` in `src/lib/og-image.ts`
**Structure:** Left column (title, description, category pills) + Right column (dark code panel with YAML lines, severity markers, rule count badge)
**Route:** `src/pages/open-graph/tools/k8s-analyzer.png.ts` exporting GET API route

### Pattern 6: LLMs.txt Integration
**What:** Add K8s Manifest Analyzer section to `src/pages/llms.txt.ts`
**Template:** Existing Dockerfile Analyzer and Docker Compose Validator sections
```text
- Kubernetes Manifest Analyzer: 67-rule engine analyzing Kubernetes manifests for schema, security, reliability, best-practice, and cross-resource issues. ...
  URL: https://patrykgolabek.dev/tools/k8s-analyzer/
  Rules: https://patrykgolabek.dev/tools/k8s-analyzer/rules/ka-c001/ (67 individual rule documentation pages)
  Blog: https://patrykgolabek.dev/blog/kubernetes-manifest-best-practices/
```

### Pattern 7: Homepage and Tools Page Integration
**What:** Add K8s Manifest Analyzer card to homepage Tools section
**Template:** The tools page at `src/pages/tools/index.astro` already has the K8s Analyzer card. The homepage at `src/pages/index.astro` currently shows only Dockerfile Analyzer and Compose Validator.
**Action:** Add a third card to the homepage Tools section grid matching the existing card structure.

### Pattern 8: Companion Blog Post
**What:** ~3000-5000 word MDX blog post covering K8s manifest best practices with ~20 cross-links to individual rule pages
**Template:** `src/data/blog/dockerfile-best-practices.mdx` and `src/data/blog/docker-compose-best-practices.mdx`
**Structure:**
- Frontmatter: title, description, publishedDate, tags, draft: false
- Imports: OpeningStatement, TldrSummary, KeyTakeaway, Callout components
- Opening statement + intro linking to `/tools/k8s-analyzer/`
- TldrSummary with bullet points
- Sections by category: Security, Reliability, Best Practice, Cross-Resource
- Each section covers 3-5 rules with links to rule documentation pages
- Bidirectional linking: blog links to rules, rule pages link back to blog

### Anti-Patterns to Avoid
- **Don't use client-side rendering for rule pages:** Use `getStaticPaths()` for build-time static generation. All 67 pages must be pre-rendered.
- **Don't create new data formats:** The rule data shape (`DocumentedK8sRule` interface) already has everything needed: id, title, severity, category, explanation, fix.description, fix.beforeCode, fix.afterCode.
- **Don't modify the rule engine:** Only add documentation metadata (PSS tags, CIS refs, related rules logic). Never change `check()` functions.
- **Don't forget trailing slashes:** All internal links use trailing slashes (e.g., `/tools/k8s-analyzer/rules/ka-c001/`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Related rules | Custom graph/ML | `getRelatedK8sRules()` matching category + severity sort | Identical to `getRelatedRules()` and `getRelatedComposeRules()` patterns |
| OG image | Manual PNG design | `generateK8sAnalyzerOgImage()` in og-image.ts | Satori+Sharp pipeline already exists with all helpers |
| Sitemap inclusion | Manual XML editing | Astro `@astrojs/sitemap` plugin | Auto-indexes all static pages including `getStaticPaths()` output |
| SEO meta tags | Custom head tags | `Layout.astro` with `SEOHead.astro` | Full OpenGraph, Twitter Card, canonical URL already handled |
| Breadcrumb schema | Custom JSON-LD | `BreadcrumbJsonLd.astro` component | Already used on all tool and rule pages |
| FAQ schema | Custom JSON-LD | `FAQPageJsonLd.astro` component | Already used on rule documentation pages |

**Key insight:** Every single deliverable in this phase has an exact template in the existing codebase. There is nothing new to build -- only to replicate with K8s-specific content.

## Common Pitfalls

### Pitfall 1: allDocumentedK8sRules Missing Schema Rules
**What goes wrong:** Only 57 rule pages get generated instead of 67 because `allDocumentedK8sRules` currently omits the 10 schema rules from `diagnostic-rules.ts`.
**Why it happens:** Schema rules use `SchemaRuleMetadata` (no `check()` method) and are separate from `allK8sRules` which only contains lint rules.
**How to avoid:** Expand `allDocumentedK8sRules` in `rules/index.ts` to merge lint rules + schema rules:
```typescript
import { SCHEMA_RULE_METADATA } from '../diagnostic-rules';
export const allDocumentedK8sRules: DocumentedK8sRule[] = [
  ...(allK8sRules as DocumentedK8sRule[]),
  ...Object.values(SCHEMA_RULE_METADATA),
];
```
**Warning signs:** `getStaticPaths()` returns fewer than 67 items; build generates only 57 rule pages.

### Pitfall 2: Category Labels Not Covering All K8s Categories
**What goes wrong:** Rule pages for RBAC and cross-resource categories show missing labels because the categoryLabel map doesn't include 'cross-resource' or 'rbac'.
**Why it happens:** The K8s analyzer has 5 categories (schema, security, reliability, best-practice, cross-resource) plus RBAC rules that are categorized differently from the Dockerfile/Compose tools.
**How to avoid:** Ensure the `categoryLabel` and `K8sCategory` type mapping in the [code].astro page covers all actual category values. The K8sCategory type is: `'schema' | 'security' | 'reliability' | 'best-practice' | 'cross-resource'`. Note: RBAC rules don't have a separate category -- check if they map to 'security' or need a new label.
**Warning signs:** Pages render with blank/undefined category text.

### Pitfall 3: Code Language Mismatch in Before/After Examples
**What goes wrong:** Before/after code examples render with wrong syntax highlighting.
**Why it happens:** Dockerfile Analyzer uses `lang="dockerfile"`, Compose Validator uses `lang="yaml"`. K8s Analyzer examples are YAML.
**How to avoid:** Use `lang="yaml"` for all K8s rule before/after code blocks.
**Warning signs:** Code blocks appear unstyled or with incorrect keyword highlighting.

### Pitfall 4: PSS Profile Tags on Non-Security Rules
**What goes wrong:** PSS profile badges appear on non-security rules, or don't appear at all.
**Why it happens:** PSS mapping is maintained separately in `pss-compliance.ts`. Need to look up rule ID against both `PSS_BASELINE_RULES` and `PSS_RESTRICTED_RULES` sets.
**How to avoid:** Import PSS sets and conditionally render in the Astro template:
```astro
{PSS_BASELINE_RULES.has(rule.id) && <span>PSS Baseline</span>}
{PSS_RESTRICTED_RULES.has(rule.id) && <span>PSS Restricted</span>}
```
**Warning signs:** Security rules missing PSS tags; non-security rules showing PSS tags.

### Pitfall 5: Lowercase Rule IDs in URLs
**What goes wrong:** URLs and internal links are case-sensitive; mismatch between `KA-C001` and `ka-c001` causes 404s.
**Why it happens:** `getStaticPaths()` maps `rule.id.toLowerCase()` to params. All internal links must also use lowercase.
**How to avoid:** Always use `rule.id.toLowerCase()` when constructing URLs. This matches the pattern in both existing tool [code].astro pages.
**Warning signs:** 404 errors when navigating from rule links.

### Pitfall 6: Missing Bidirectional Links
**What goes wrong:** Blog post links to rule pages but rule pages don't link back to blog post, or vice versa.
**Why it happens:** Easy to forget one direction when implementing cross-linking.
**How to avoid:** Checklist:
- Tool page aside links to blog post and rule documentation
- Each rule page footer links to tool page AND blog post
- Blog post links to ~20 individual rule pages
- Blog post links to tool page
**Warning signs:** One-way linking detected during QA review.

### Pitfall 7: Homepage Tools Grid Layout Breaking
**What goes wrong:** Adding a third tool card to the homepage 2-column grid causes asymmetric layout.
**Why it happens:** Current grid is `grid-cols-1 sm:grid-cols-2` with exactly 2 items. Adding a third creates an orphan.
**How to avoid:** Either use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` or accept asymmetry (3rd card spans full width on sm, sits in first column on lg). The tools page already handles 3 cards with `grid-cols-1 sm:grid-cols-2`.
**Warning signs:** Visual regression on homepage Tools section.

## Code Examples

### Rule Documentation Page (getStaticPaths + Astro template)
```typescript
// Source: src/pages/tools/compose-validator/rules/[code].astro (established pattern)
// K8s version follows identical structure:
import { allDocumentedK8sRules } from '../../../../lib/tools/k8s-analyzer/rules/index';
import { getRelatedK8sRules } from '../../../../lib/tools/k8s-analyzer/rules/related';
import { PSS_BASELINE_RULES, PSS_RESTRICTED_RULES } from '../../../../lib/tools/k8s-analyzer/pss-compliance';

export function getStaticPaths() {
  return allDocumentedK8sRules.map((rule) => ({
    params: { code: rule.id.toLowerCase() },
    props: { rule },
  }));
}
```

### Related Rules Function
```typescript
// Source: src/lib/tools/compose-validator/rules/related.ts (established pattern)
// K8s version:
import type { K8sSeverity } from '../types';
import type { DocumentedK8sRule } from './index';
import { allDocumentedK8sRules } from './index';

const SEVERITY_ORDER: Record<K8sSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function getRelatedK8sRules(ruleId: string, limit = 5): DocumentedK8sRule[] {
  const rule = allDocumentedK8sRules.find((r) => r.id === ruleId);
  if (!rule) return [];
  return allDocumentedK8sRules
    .filter((r) => r.category === rule.category && r.id !== ruleId)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, limit);
}
```

### OG Image API Route
```typescript
// Source: src/pages/open-graph/tools/compose-validator.png.ts (established pattern)
import type { APIRoute } from 'astro';
import { generateK8sAnalyzerOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateK8sAnalyzerOgImage();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Blog Post Frontmatter
```yaml
# Source: dockerfile-best-practices.mdx and docker-compose-best-practices.mdx (established pattern)
---
title: "Kubernetes Manifest Best Practices"
description: "A production-tested guide to writing secure, reliable Kubernetes manifests. 67 rules explained with real-world consequences and fix examples. Try the free browser-based analyzer."
publishedDate: 2026-02-23
tags: ["kubernetes", "k8s", "devops", "cloud-native", "security", "containers", "yaml"]
draft: false
---
```

### K8s Analyzer JSON-LD Schema
```typescript
// Source: ComposeValidatorJsonLd.astro (established pattern)
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Kubernetes Manifest Analyzer",
  "description": "Free browser-based Kubernetes manifest analyzer and best-practice linter. 67 rules across schema, security, reliability, best-practice, and cross-resource categories. Built by a Kubernetes architect with 17+ years of experience.",
  "url": "https://patrykgolabek.dev/tools/k8s-analyzer/",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "softwareVersion": "1.0",
  "datePublished": "2026-02-23",
  "screenshot": "https://patrykgolabek.dev/open-graph/tools/k8s-analyzer.png",
  "softwareHelp": {
    "@type": "CreativeWork",
    "name": "Kubernetes Manifest Best Practices",
    "url": "https://patrykgolabek.dev/blog/kubernetes-manifest-best-practices/",
  },
  "keywords": [
    "kubernetes manifest analyzer",
    "kubernetes linter",
    "k8s manifest validator",
    "kubernetes best practices",
    "kubernetes security",
    "pod security standards",
    "kubernetes yaml linter",
    "kubernetes manifest checker",
    "k8s rules",
    "PSS compliance",
  ],
  "featureList": [
    "67 validation rules across 5 categories (schema, security, reliability, best-practice, cross-resource)",
    "Category-weighted scoring with letter grades (A+ through F)",
    "Pod Security Standards (PSS) Baseline and Restricted compliance checking",
    "Multi-document YAML support with resource dependency analysis",
    "RBAC analysis: wildcard permissions, cluster-admin bindings, pod exec/attach access",
    "Cross-resource validation: Service selector, Ingress backend, ConfigMap/Secret references",
    "100% client-side analysis -- no data transmitted",
    "YAML syntax highlighting with CodeMirror 6",
    "Shareable URLs with lz-string compression",
    "Interactive resource relationship graph",
    "67 individual rule documentation pages with fix examples",
  ],
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
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
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual rule docs | `getStaticPaths()` dynamic page generation | Established in Phase 25/38 | 67 pages generated from rule data at build time |
| Hardcoded OG images | Satori+Sharp build-time generation | Established in Phase 18/27/32/40 | Consistent branding, no manual design needed |
| Missing tool in LLMs.txt | Dynamic generation from collections | Established in Phase 21/26 | All tools automatically indexed for LLM consumption |

**Deprecated/outdated:**
- None. All patterns in this codebase are current and actively maintained.

## Open Questions

1. **CIS Benchmark References**
   - What we know: DOCS-03 requires CIS Benchmark references on applicable rule pages. PSS profile tags are straightforward (data exists in `pss-compliance.ts`).
   - What's unclear: No CIS Benchmark mapping currently exists in the codebase. CIS Kubernetes Benchmark sections need to be mapped to specific rules.
   - Recommendation: Create a `CIS_BENCHMARK_REFS` map in a new utility file (or extend `pss-compliance.ts`) mapping rule IDs to CIS benchmark section numbers and names. Focus on the most directly mappable security rules (KA-C001 through KA-C020). If time-constrained, PSS tags alone provide meaningful compliance context, and CIS refs can be added as a lightweight extension.

2. **RBAC Rule Category in UI**
   - What we know: RBAC rules (KA-A001 through KA-A005) exist in `rules/rbac/`. The `K8sCategory` type doesn't include 'rbac' as a separate category -- these may need to be rendered differently.
   - What's unclear: Whether RBAC rules should show category as "Security" (since they are security-adjacent) or need a new category label.
   - Recommendation: Check the actual `category` field on RBAC rules. If they use an existing K8sCategory value, no change needed. If they use a value not in the type, add it to the category label map.

3. **Blog Post Cross-Link Count**
   - What we know: CONTENT-02 requires ~20 rule cross-links. There are 67 rules across 6 subcategories.
   - What's unclear: Exact distribution of cross-links across rule categories.
   - Recommendation: Target 3-4 links per major category (security: 5, reliability: 4, best-practice: 4, cross-resource: 3, RBAC: 2, schema: 2) = ~20 total.

4. **Header Navigation: Direct Link vs Dropdown**
   - What we know: SITE-02 says "Header navigation link for K8s Manifest Analyzer (under Tools)." Currently the header has a flat "Tools" link pointing to `/tools/`.
   - What's unclear: Whether "under Tools" means a dropdown submenu or simply that clicking "Tools" in the header leads to a page listing the K8s analyzer.
   - Recommendation: The tools page already lists the K8s Analyzer. No header change needed -- the existing "Tools" link already serves this purpose. If a dropdown is desired, that would be a larger navigation redesign beyond this phase's scope.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/pages/tools/dockerfile-analyzer/rules/[code].astro` -- full rule page template
- Codebase inspection: `src/pages/tools/compose-validator/rules/[code].astro` -- full rule page template
- Codebase inspection: `src/components/DockerfileAnalyzerJsonLd.astro` -- SoftwareApplication JSON-LD template
- Codebase inspection: `src/components/ComposeValidatorJsonLd.astro` -- SoftwareApplication JSON-LD template
- Codebase inspection: `src/lib/og-image.ts` -- Satori+Sharp OG image generation (all helper functions)
- Codebase inspection: `src/pages/open-graph/tools/compose-validator.png.ts` -- OG image API route
- Codebase inspection: `src/pages/llms.txt.ts` -- LLMs.txt generation with existing tool sections
- Codebase inspection: `src/components/Header.astro` -- navigation with flat navLinks array
- Codebase inspection: `src/pages/index.astro` -- homepage with Tools section grid
- Codebase inspection: `src/pages/tools/index.astro` -- tools listing page (already has K8s card)
- Codebase inspection: `src/lib/tools/k8s-analyzer/rules/index.ts` -- allDocumentedK8sRules (57 lint rules)
- Codebase inspection: `src/lib/tools/k8s-analyzer/diagnostic-rules.ts` -- 10 schema rules (SCHEMA_RULE_METADATA)
- Codebase inspection: `src/lib/tools/k8s-analyzer/pss-compliance.ts` -- PSS Baseline/Restricted rule sets
- Codebase inspection: `src/lib/tools/k8s-analyzer/types.ts` -- K8sLintRule, K8sCategory, DocumentedK8sRule types
- Codebase inspection: `src/lib/tools/dockerfile-analyzer/rules/related.ts` -- related rules pattern
- Codebase inspection: `src/lib/tools/compose-validator/rules/related.ts` -- related rules pattern
- Codebase inspection: `src/data/blog/dockerfile-best-practices.mdx` -- companion blog post template
- Codebase inspection: `src/data/blog/docker-compose-best-practices.mdx` -- companion blog post template
- Codebase inspection: `src/content.config.ts` -- blog collection schema
- Codebase inspection: `src/components/BreadcrumbJsonLd.astro` -- breadcrumb JSON-LD component
- Codebase inspection: `src/components/FAQPageJsonLd.astro` -- FAQ JSON-LD component
- Codebase inspection: `src/layouts/Layout.astro` -- SEOHead integration, LLMs.txt link, default OG image
- Codebase inspection: `src/components/SEOHead.astro` -- ogImage, ogImageAlt props

### Secondary (MEDIUM confidence)
- None needed -- all patterns are verified from codebase inspection.

### Tertiary (LOW confidence)
- CIS Kubernetes Benchmark mapping to specific rules -- requires manual research of CIS Benchmark v1.8+ sections to map to KA-C001 through KA-C020 security rules.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Everything already installed and proven across two tool implementations
- Architecture: HIGH - Exact templates exist for every deliverable; no new patterns needed
- Pitfalls: HIGH - Identified from direct codebase analysis of existing implementations
- CIS Benchmark mapping: LOW - External reference data not yet in codebase; needs manual research

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable codebase, no fast-moving dependencies)
