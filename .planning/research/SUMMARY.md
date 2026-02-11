# Research Summary: v1.1 Content Refresh

**Project:** patrykgolabek.dev -- Developer Portfolio + Blog
**Domain:** Content refresh for existing Astro 5 static portfolio site
**Synthesized:** 2026-02-11
**Overall Confidence:** HIGH

---

## Executive Summary

The v1.1 milestone is a content refresh, not a technical overhaul. All four research dimensions converge on the same conclusion: **zero new npm packages are needed**. The work is schema extension, component modification, content file creation, and data centralization. The existing Astro 5.17.1 stack handles every v1.1 requirement out of the box.

The highest-value change is external blog integration -- surfacing Patryk's 79 external posts (across Translucent Computing and Kubert AI) alongside the single local post. This transforms the blog from a ghost town into a credible content hub. The recommended approach is extending the existing blog content collection schema with optional `externalUrl` and `source` fields, adding curated external posts as lightweight Markdown stub files. This keeps one collection, one query, one sort, and one render path with a conditional branch in BlogCard.

The second structural change is creating a centralized site configuration file (`src/data/site.ts`) to eliminate the current pattern of hardcoded social links, email addresses, and hero text scattered across 4+ files. This is not optional -- without it, every content change risks inconsistency between Footer, Contact, Home, and PersonJsonLd, which directly harms SEO and accessibility.

Key risks are low severity but require discipline: (1) the blog detail route and OG image generator must filter out external posts to avoid generating empty pages, (2) hero tagline changes must propagate to title tags, meta descriptions, and JSON-LD to maintain keyword alignment, and (3) removing the existing blog post without a redirect creates a 404 for an already-indexed URL.

---

## Stack Additions

**Finding: Nothing to install.** All v1.1 features are achievable with the existing stack.

| Existing Technology | Role in v1.1 |
|---|---|
| Astro 5.17.1 | Content Layer API with Zod schema extension (`externalUrl` optional field) |
| @astrojs/rss ^4.0.15 | RSS feed -- needs conditional `link` field for external posts |
| Content Collections + glob() | External blog stubs are just .md files with frontmatter -- glob loader handles them |
| Tailwind v3.4.19 | No changes needed |
| Satori + Sharp | OG image generation -- needs filter to skip external posts |

**What NOT to add** (all four researchers agree):
- No RSS feed loader (`astro-loader-rss`) -- adds build-time network dependency for quarterly publishing cadence
- No icon library (`astro-icon`) -- 2 new SVG icons do not justify a dependency when the codebase uses inline SVGs
- No CMS -- adding a CMS for 3-5 new stub files is absurd
- No Tailwind v4 upgrade -- save it for a dedicated infrastructure milestone
- No animation libraries -- the hero tagline refresh is a text edit, not a visual overhaul

---

## Feature Analysis

### Must Ship (Table Stakes for v1.1)

1. **External blog entries in blog listing** -- 8-12 curated posts from Translucent Computing and Kubert AI. Currently the blog shows 1 real post. This is the highest-value change.
2. **Social links update** -- Add X (@QuantumMentat) and YouTube (@QuantumMentat), remove LinkedIn, update email to pgolabek@gmail.com. Must update all 4 locations atomically (Footer, Contact, Home CTA, PersonJsonLd).
3. **Hero tagline refresh** -- Remove location, remove "Pre-1.0 Kubernetes adopter", shift to craft and precision tone. Recommended new typing roles: `['Software Architect', 'Systems Engineer', 'AI/ML Builder']`.
4. **Project curation** -- Remove Full-Stack Applications category (2 projects: self-referential portfolio repo + a fork), remove gemini-beauty-math from AI/ML. Total projects: 19 down to 16.
5. **Test post cleanup** -- Delete `draft-placeholder.md`.

### Should Ship (Differentiators)

6. **Visual distinction badge on external posts** -- Source label ("on Kubert AI") and external link icon on BlogCard. Low effort, high UX value -- no bait-and-switch.
7. **Blog slug page guard** -- Filter external posts from `getStaticPaths()` to prevent generating empty pages. This is technically a bug fix, not a feature.
8. **RSS feed with external post links** -- External posts appear in RSS with their external URL as the link field.
9. **OG image skip for external posts** -- No point generating OG images for pages that do not exist.

### Defer to v1.2+

- Source filtering on blog listing (tabs for "All", "On this site", "Kubert AI", etc.) -- only valuable with 20+ posts
- About page cross-promotion links

### Curated External Post Selection

FEATURES research identified 10 specific posts to include, vetted for Patryk's authorship, technical depth, and domain coverage:

**From Kubert AI (6 posts):** AI Agent for SQL Server, Kubernetes AI Assistant, Ollama K8s Deployment, Red Teaming LLMs, Golden Paths to Agentic AI, AgentOps and Agentic AI

**From Translucent Computing (4 posts):** Apache Airflow Data Pipeline, K8s Cloud Cost Strategies, Workflow Engine Data Pipeline, Zero Trust Security

---

## Architecture Impact

### Core Pattern: Single Collection with Schema Extension

Extend the existing `blog` collection schema in `src/content.config.ts` with two optional fields:

```typescript
externalUrl: z.string().url().optional(),  // link to external blog
source: z.string().optional(),              // "Translucent Computing", "Kubert AI"
```

External posts are Markdown stub files (frontmatter only, no body) in `src/data/blog/`. The glob() loader picks them up. Every page that queries `getCollection('blog')` automatically includes them. BlogCard checks `externalUrl` and branches:
- Present: link externally with `target="_blank"`, show source badge and external icon
- Absent: link to `/blog/{id}/` as before

### New File: Centralized Site Configuration

Create `src/data/site.ts` exporting:
- `socialLinks[]` -- platform, url, label, icon identifier
- `contact.email` -- single source for email address
- `hero` -- name, tagline, roles array
- `sameAs` -- derived from socialLinks for JSON-LD

This replaces hardcoded strings in Footer.astro, contact.astro, index.astro, and PersonJsonLd.astro.

### Files Requiring Modification

| File | Change Type | Why |
|---|---|---|
| `src/content.config.ts` | Schema extension | Add `externalUrl` and `source` optional fields |
| `src/data/site.ts` | **NEW FILE** | Centralized social links, contact, hero config |
| `src/data/blog/*.md` | Add 8-12 stubs | External blog entries |
| `src/components/BlogCard.astro` | Conditional rendering | External vs internal link logic |
| `src/pages/blog/[slug].astro` | Filter | Exclude external posts from `getStaticPaths()` |
| `src/pages/rss.xml.ts` | Conditional link | Use `externalUrl` when present |
| `src/pages/llms.txt.ts` | Conditional link | Same external URL handling |
| `src/pages/open-graph/[...slug].png.ts` | Filter | Skip OG generation for external posts |
| `src/components/Footer.astro` | Import from site.ts | Replace hardcoded social links |
| `src/pages/contact.astro` | Import from site.ts | Replace hardcoded contact info and social links |
| `src/pages/index.astro` | Import from site.ts | Hero text, typing roles, CTA updates |
| `src/components/PersonJsonLd.astro` | Import from site.ts | `sameAs` and `jobTitle` from centralized config |
| `src/data/projects.ts` | Data removal | Remove 3 projects and 1 category |

### Build Order (Dependency-Driven)

```
[1] site.ts (NEW)  +  content.config.ts (schema)   -- data contracts first
[2] External blog stub .md files                     -- requires schema
[3] BlogCard.astro conditional logic                 -- requires schema types
[4] blog/[slug].astro + rss.xml.ts + llms.txt.ts    -- filter/conditional
    + open-graph/[...slug].png.ts
[5] Footer + Contact + PersonJsonLd                  -- require site.ts
[6] index.astro (hero + CTA)                         -- requires site.ts + BlogCard
[7] projects.ts (remove entries)                     -- independent, any time
[8] Delete draft-placeholder.md                      -- independent, any time
```

---

## Risk Mitigation

### Top 5 Pitfalls with Prevention Strategies

**1. External blog entries break the content pipeline (CRITICAL)**
Adding entries to the blog collection that have no renderable body breaks `[slug].astro` page generation, OG image generation, and potentially RSS if links point to nonexistent internal pages.
- **Prevention:** Add `&& !data.externalUrl` filter in `getStaticPaths()` for `[slug].astro` and `open-graph/[...slug].png.ts`. Use `post.data.externalUrl ?? /blog/${post.id}/` in RSS link field.
- **Verification:** Build succeeds. No `/blog/ext-*` pages in `dist/`. OG images generated only for internal posts.

**2. Hero tagline changes create SEO keyword drift (CRITICAL)**
Hero text, title tag, meta description, JSON-LD jobTitle, and About page bio are defined in 7 different places. Changing one without the others creates inconsistent keyword signals.
- **Prevention:** Create `src/data/site.ts` FIRST. Import hero data everywhere. Change once, propagate automatically.
- **Verification:** Title tag, meta description, JSON-LD, and hero H1 all contain the same target keywords.

**3. Social link updates break accessibility and JSON-LD (MODERATE)**
New SVG icons without `aria-label`, `aria-hidden="true"`, or proper `viewBox` break screen reader accessibility. Updating Footer but not PersonJsonLd creates identity signal mismatch.
- **Prevention:** Centralize social links in `site.ts`. Derive `sameAs` from the same data. Enforce `aria-label` on every social link.
- **Verification:** Lighthouse accessibility 90+. JSON-LD validates with Google Rich Results Test.

**4. Removing blog post creates 404 for indexed URL (MODERATE)**
The existing blog post at `/blog/building-kubernetes-observability-stack/` is indexed by Google. Deleting the file creates a 404. GitHub Pages cannot do 301 redirects.
- **Prevention:** Do NOT delete the existing real blog post. Only delete `draft-placeholder.md` (which is `draft: true` and never appeared in production). If a published post must be removed in the future, use Astro's `redirects` config for a meta-refresh redirect.
- **Verification:** No new 404s in build output.

**5. RSS/Sitemap/LLMs.txt drift after content changes (MODERATE)**
Every content change can cause these output files to reference removed pages, include stale links, or miss new entries.
- **Prevention:** After every content phase, verify `dist/rss.xml`, `dist/sitemap-0.xml`, and `dist/llms.txt` contain correct entries with valid links.
- **Verification:** Post-build audit of all three files.

### Verification Checklist ("Looks Done But Isn't")

- [ ] External blog links open the external site, not an internal 404
- [ ] External posts have `target="_blank"` and `rel="noopener noreferrer"`
- [ ] No `/blog/ext-*` pages exist in `dist/`
- [ ] RSS feed entries for external posts link to external URLs
- [ ] Title tag matches hero text matches JSON-LD jobTitle
- [ ] All social links have `aria-label` attributes
- [ ] JSON-LD `sameAs` array matches visible social links
- [ ] Project count in meta description matches actual data (16)
- [ ] Lighthouse Performance and Accessibility scores remain 90+

---

## Key Recommendations

### 1. Use the Single-Collection Approach for External Blog Posts

STACK, FEATURES, and ARCHITECTURE all converge on extending the existing blog collection with optional `externalUrl` and `source` fields. This is the right call. One collection means one query, one sort, one render path. The alternative (separate collection or separate data file) forces dual-query merging in every listing page for zero user benefit.

### 2. Create Centralized Site Configuration Before Touching Any Components

All four researchers independently identified scattered hardcoded values as a problem. Create `src/data/site.ts` in the first phase. Every subsequent change becomes a single-file edit instead of a 4-file hunt.

### 3. Curate 8-12 External Posts, Not All 79

FEATURES research vetted the external blog catalogs. Most Translucent Computing posts are by other authors. Many Kubert AI posts are product announcements. The recommended 10 posts cover AI agents, Kubernetes, security, data engineering, and platform engineering -- the exact domains Patryk wants to be found for.

### 4. Keep LinkedIn in PersonJsonLd sameAs (Decision Flag)

FEATURES and PITFALLS both flag this: LinkedIn is being removed from visible UI, but Google uses `sameAs` for entity recognition. LinkedIn profiles are strong identity signals. **Recommendation: keep LinkedIn in the `sameAs` array even though it is removed from Footer/Contact.** Flag for Patryk to confirm.

### 5. Phase the Work: Config First, External Blog Second, Cleanup Last

The build order is dictated by dependencies. Data contracts (schema + site.ts) must exist before components can import them. External blog integration is the most complex change and should be done while the codebase is closest to its known-good v1.0 state. Content removal is the lowest risk and comes last.

---

## Conflicts and Resolutions

### Conflict 1: External Blog Integration Approach

| Researcher | Recommendation |
|---|---|
| STACK | Single collection with `externalUrl` schema field + stub .md files |
| FEATURES | Single collection with `externalUrl` schema field (Approach A) |
| ARCHITECTURE | Single collection with `externalUrl` schema field |
| PITFALLS | **Separate data source** (`external-posts.ts`) to avoid touching content pipeline |

**Resolution: Use the single-collection approach (3-to-1 consensus).** The PITFALLS concern about touching 7+ files is valid but overstated. The changes are small conditionals (`?? externalUrl`, `&& !data.externalUrl`) not architectural rewrites. The separate data source approach would require merging two arrays in every listing page, dual-sorting by date, and maintaining two type interfaces -- more code, not less. The single-collection approach is the standard Astro pattern for mixed content.

### Conflict 2: External Posts in RSS Feed

| Researcher | Recommendation |
|---|---|
| STACK | Include external posts in RSS with external URL as link |
| FEATURES | Include external posts in RSS (listed as "Should Ship") |
| ARCHITECTURE | Include with `link: post.data.externalUrl ?? /blog/${post.id}/` |
| PITFALLS | **Do NOT add external blog posts to RSS** -- they are someone else's content |

**Resolution: Include external posts in RSS (3-to-1 consensus).** The RSS feed represents "writing by Patryk" not "pages on this domain." These are Patryk's own articles on his own company blogs, not syndicated third-party content. RSS readers should surface the full breadth of his writing. The `link` field points to the canonical external URL, which is the correct RSS behavior for curated external content.

### Conflict 3: Source Field Type

| Researcher | Recommendation |
|---|---|
| STACK | `source: z.string().optional()` with free-form strings like "Kubert AI Blog" |
| FEATURES | `source: z.enum(['local', 'kubert-ai', 'translucent-computing']).default('local')` |
| ARCHITECTURE | `source: z.string().optional()` |

**Resolution: Use `z.string().optional()` (STACK/ARCHITECTURE approach).** An enum is unnecessarily rigid. If Patryk publishes on a third blog or guest posts, the enum needs a schema change and rebuild. A free-form string with a naming convention (set by the stub file author) is more flexible and equally clear. The `source` field is only used for display labels on BlogCard, not for routing or filtering logic.

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | HIGH | Zero new dependencies. All features use existing Astro 5.17.1 capabilities verified in official docs. |
| Features | HIGH | Requirements are well-defined content changes. External blog catalog vetted with author attribution. Curated post list ready. |
| Architecture | HIGH | Single-collection approach is standard Astro pattern. Centralized config is straightforward TypeScript. All file modifications mapped with code examples. |
| Pitfalls | HIGH | All risks are moderate severity with documented prevention strategies. No unknown-unknowns for a content refresh of this scope. |

**Overall: HIGH.** This is well-trodden ground. The v1.0 site is already built and working. The v1.1 changes are incremental.

### Gaps to Address During Planning

1. **Hero tagline final copy** -- Three options proposed in FEATURES research (Architect's Identity, Craft-Forward, Minimalist). Patryk needs to choose. Recommendation: Option A.
2. **LinkedIn sameAs decision** -- Keep or remove from JSON-LD structured data. Low SEO impact either way, but needs a conscious decision.
3. **External post titles and descriptions** -- The 10 recommended posts need final title/description text verified against the actual external blog posts (some titles were inferred from URLs).
4. **Existing blog post fate** -- `building-kubernetes-observability-stack.md` is a real published post. It stays. Only `draft-placeholder.md` is deleted. Confirm this is understood.

---

## Suggested Phase Structure for Roadmap

### Phase 1: Configuration Foundation
**Rationale:** Establishes data contracts that all subsequent phases depend on.
**Delivers:** `src/data/site.ts` (social links, contact, hero) + `src/content.config.ts` schema extension (externalUrl, source)
**Features:** None visible yet -- this is infrastructure.
**Avoids:** Pitfall 2 (hero keyword drift), Pitfall 5 (social link inconsistency)
**Research needed:** No -- standard TypeScript and Zod patterns.

### Phase 2: External Blog Integration
**Rationale:** Highest-value change, most architecturally complex. Do it while codebase is closest to known-good state.
**Delivers:** 8-12 external blog entries appearing in blog listing, external link badges, slug page guard, RSS/LLMs.txt external URL handling, OG skip for external posts.
**Features:** External blog entries (P1), visual distinction badge (P1), slug page guard (P1), RSS inclusion (P1)
**Avoids:** Pitfall 1 (external entries break pipeline), Pitfall 3 (RSS/sitemap drift), Pitfall 6 (OG generation breaks)
**Research needed:** No -- single-collection approach is well-documented.

### Phase 3: Social Links and Contact Update
**Rationale:** Consumes centralized site.ts from Phase 1. Safe refactors replacing hardcoded strings with imports.
**Delivers:** X and YouTube links in Footer/Contact/PersonJsonLd, LinkedIn removed from UI, email updated, Home CTA updated.
**Features:** Social links update (P1), PersonJsonLd update (P1), Home page CTA update (P1)
**Avoids:** Pitfall 5 (accessibility/JSON-LD breakage)
**Research needed:** No -- HTML/SVG editing.

### Phase 4: Hero Tagline and Content Curation
**Rationale:** Content changes that propagate through centralized config. Low risk, independent of Phases 2-3.
**Delivers:** New hero subtitle and typing roles, project removals (3 projects, 1 category), draft placeholder deletion, meta description count update.
**Features:** Hero tagline refresh (P1), project curation (P1), test post cleanup (P1)
**Avoids:** Pitfall 4 (hero keyword drift -- mitigated by site.ts), Pitfall 9 (project count stale)
**Research needed:** No -- text editing.

### Phase 5: Verification and Polish
**Rationale:** Every content change can cause RSS/sitemap/OG drift. A dedicated verification pass catches what individual phases miss.
**Delivers:** Verified sitemap, RSS, LLMs.txt, OG images. Lighthouse audit. JSON-LD validation. Cross-browser social sharing test.
**Features:** None new -- quality assurance.
**Avoids:** Pitfall 3 (RSS/sitemap drift), Pitfall 10 (stale CDN cache)
**Research needed:** No.

---

## Sources

Aggregated from all four research files. Full citation lists in individual research documents.

### HIGH Confidence
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/)
- [Astro Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/)
- [Astro RSS Recipes](https://docs.astro.build/en/recipes/rss/)
- [Astro Routing / Redirects](https://docs.astro.build/en/guides/routing/)
- [Content Layer Deep Dive (Astro Blog)](https://astro.build/blog/content-layer-deep-dive/)
- Direct codebase analysis of all files listed in Architecture modifications table

### MEDIUM Confidence
- [Syncing dev.to Posts with Astro Blog](https://logarithmicspirals.com/blog/updating-astro-blog-to-pull-devto-posts/)
- [Adding Local Markdown Posts to Hashnode-Powered Astro Blog](https://akoskm.com/hashnode-local-astro-hybrid-setup/)
- [Hero Section Copywriting Tips](https://zoconnected.com/blog/how-to-write-hero-section-website-copy/)
- [H1 Tags Ranking Factor 2026](https://www.rankability.com/ranking-factors/google/h1-tags/)
- [Social Media Icons Accessibility](https://www.boia.org/blog/check-your-websites-social-media-icons-for-this-common-accessibility-error)

---
*Research synthesis for: patrykgolabek.dev v1.1 Content Refresh*
*Synthesized: 2026-02-11*
*Ready for roadmap: yes*
