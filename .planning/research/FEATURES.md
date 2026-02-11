# Feature Research: v1.1 Content Refresh

**Domain:** Developer portfolio content refresh (existing Astro 5 site at patrykgolabek.dev)
**Researched:** 2026-02-11
**Confidence:** HIGH
**Scope:** External blog integration, social links update, hero tagline refresh, project curation, test post cleanup

---

## Feature Landscape

### Table Stakes (Must Ship in v1.1)

These are the core deliverables. Without all of them, v1.1 is incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **External blog entries in blog listing** | The portfolio currently shows 1 real blog post. Patryk has 62 posts on Translucent Computing and 17 on Kubert AI. Without surfacing this writing, the site misrepresents his output. Visitors and recruiters need to see the full body of work. | MEDIUM | Two implementation approaches exist (see Detailed Analysis below). Recommend a second Astro content collection with an inline loader that hardcodes curated external entries -- no build-time API fetching needed for a small, manually curated set. |
| **Social links update (add X, YouTube, email; remove LinkedIn)** | Social links appear in 3 places: Footer, Contact page, PersonJsonLd. All 3 must be updated atomically. Inconsistent social presence across pages is a credibility problem. | LOW | Replace LinkedIn SVG with X (@QuantumMentat), YouTube (@QuantumMentat), and update email to pgolabek@gmail.com. GitHub stays. Keep aria-labels and SVG accessibility. Update `sameAs` array in PersonJsonLd. |
| **Hero tagline refresh** | Current tagline reads: "Building resilient cloud-native systems and AI-powered solutions for 17+ years. Pre-1.0 Kubernetes adopter. Ontario, Canada." The request is to remove location, remove "Pre-1.0 Kubernetes adopter", and shift to a "craft & precision" tone. The typing roles array also needs review. | LOW | Text-only change in `src/pages/index.astro`. The typing effect roles array and the static subtitle paragraph both need updating. No structural changes. |
| **Remove Full-Stack Applications category and gemini-beauty-math project** | The Full-Stack Applications category contains only the portfolio repo itself and a fork (arjancode_examples) -- neither demonstrates meaningful engineering work. The gemini-beauty-math project is in AI/ML but is a lightweight demo that dilutes the portfolio's senior architect signal. | LOW | Remove the category from `categories` array and remove 3 projects from `projects` array in `src/data/projects.ts`. Update the projects page meta description to reflect the new count. |
| **Remove initial test blog post** | The `draft-placeholder.md` file is a draft test post with a future publish date (2026-03-01). While it is filtered out in production builds via the `draft: true` flag, it should be removed entirely to keep the content directory clean. | LOW | Delete `src/data/blog/draft-placeholder.md`. No impact on production output since it was already `draft: true`. |

### Differentiators (Opportunities Within Scope)

Features that go beyond the minimum ask and add meaningful value to the v1.1 refresh.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Visual distinction for external vs local posts** | Blog listing shows external posts with a subtle "external link" indicator (icon + source label like "on Kubert AI" or "on Translucent Computing"). Visitors instantly understand which posts open on the portfolio vs which navigate to an external blog. This is honest UX -- no bait-and-switch. | LOW | Add a small external-link icon and source badge to `BlogCard.astro` when the entry has an `externalUrl`. Conditionally render `target="_blank" rel="noopener noreferrer"` for external entries. |
| **Source filtering on blog listing** | Allow visitors to filter by "All", "On this site", "Kubert AI", "Translucent Computing" via simple tab-style buttons at the top of the blog page. With potentially 80+ posts across 3 sources, filtering prevents overwhelm. | MEDIUM | Client-side filtering with vanilla JS on data attributes. No framework needed. Progressive enhancement -- without JS, all posts show. |
| **Curated external post selection (not full feed dump)** | Instead of importing all 79 external posts, hand-pick 8-12 that best represent Patryk's expertise (Kubernetes, AI/ML, platform engineering, DevOps). Quality over quantity. A curated selection signals editorial judgment. | LOW | Manually define entries in the content collection. Each entry has title, description, publishedDate, tags, externalUrl, and source. No API fetching needed. |
| **Hero typing roles refresh** | Current roles: `['Cloud-Native Architect', 'Kubernetes Pioneer', 'AI/ML Engineer', 'Platform Builder']`. Refresh to match the craft/precision tone. Removing "Pioneer" (which implies early-adopter bragging) and aligning with the new subtitle. | LOW | Update the `roles` array in the inline script on `index.astro`. |
| **Update PersonJsonLd structured data** | Remove `address` (location is being removed from hero), update `sameAs` to include X and YouTube URLs, remove LinkedIn. Keeps structured data consistent with visible content. | LOW | Edit `src/components/PersonJsonLd.astro`. |
| **Update contact page CTA on home page** | Home page hero CTA currently links to LinkedIn ("Connect on LinkedIn"). This needs to change since LinkedIn is being removed. Replace with an email CTA or X profile link. | LOW | Edit `src/pages/index.astro` contact CTA section. |

### Anti-Features (Explicitly NOT Building for v1.1)

| Anti-Feature | Why Tempting | Why Avoid | What to Do Instead |
|--------------|-------------|-----------|-------------------|
| **Build-time RSS feed fetching from external blogs** | "Automate it! Fetch from WordPress RSS feeds at build time and always stay current." | Both WordPress feeds return only 3-4 recent items (WordPress default is 10, but Translucent Computing shows 4 and Kubert AI shows 3). The feeds are unreliable for historical content. RSS parsing adds a build dependency (rss-parser or similar). Build failures from external API downtime are unacceptable for a static portfolio on GitHub Pages. The external blogs update infrequently (last Kubert post was June 2025, last TC post was April 2025). | Manually curate external entries as static data in a content collection. Update when new posts are published -- which is quarterly at most. Zero build dependencies. |
| **Full external post content rendered locally** | "Import the full HTML from WordPress and render it on patrykgolabek.dev for better SEO." | Duplicate content harms SEO (Google penalizes it). WordPress content includes shortcodes, custom CSS, and plugin-specific markup that would render incorrectly. Maintaining parity between two rendering engines is a maintenance nightmare. The external blogs have their own design systems. | Link to external posts with `target="_blank"`. The portfolio gets the "content hub" benefit (showing breadth of writing) while the original blogs retain their SEO authority. Use canonical URLs if ever rendering local copies in the future. |
| **Automated external blog sync via GitHub Actions** | "Schedule a weekly GitHub Action to fetch new posts and commit them." | Over-engineering for quarterly publishing cadence. Adds CI complexity. The curated selection requires editorial judgment (which posts to include) that cannot be automated. | Manual curation. When Patryk publishes a new external post worth showcasing, add a 5-line entry to the external posts data file. 2-minute task. |
| **LinkedIn removal from PersonJsonLd sameAs** | "User said remove LinkedIn, so remove it everywhere." | LinkedIn may still be a valid `sameAs` for structured data even if not shown in the UI. Google uses `sameAs` for entity recognition, and LinkedIn profiles are strong identity signals. Removing it from visible links is different from removing it from machine-readable metadata. | Consider keeping LinkedIn in the `sameAs` array of PersonJsonLd even though it is removed from visible footer/contact links. Flag this as a decision for Patryk to make. LOW confidence on the SEO impact either way. |
| **Contact form to replace LinkedIn** | "With LinkedIn gone, add a contact form as the secondary contact method." | Contact forms on static GitHub Pages sites require a third-party service (Formspree, etc.). Adds a dependency for marginal benefit -- recruiters know how to send email. | Email link + X profile link + YouTube link. Three contact methods is sufficient. |

---

## Detailed Analysis: External Blog Integration

### The Core Problem

The blog listing at `/blog/` currently queries a single content collection (`blog`) backed by the glob loader reading from `src/data/blog/`. External posts from mykubert.com and translucentcomputing.com need to appear in this listing, sorted chronologically alongside local posts, but linking out to their original URLs instead of rendering locally.

### Approach A: Single Collection with Mixed Entries (RECOMMENDED)

Extend the existing `blog` content collection schema to support an optional `externalUrl` field. Add external posts as minimal Markdown files with frontmatter only (no body content needed).

**Schema change in `src/content.config.ts`:**
```typescript
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    externalUrl: z.string().url().optional(),
    source: z.enum(['local', 'kubert-ai', 'translucent-computing']).default('local'),
  }),
});
```

**External post file example** (`src/data/blog/ext-kubert-ai-agent-sql-server.md`):
```markdown
---
title: "Building a Custom AI Agent for SQL Server: Deep Dive into DevOps"
description: "A hands-on guide to building an AI agent that automates SQL Server operations using LLM orchestration and DevOps patterns."
publishedDate: 2024-08-29
tags: ["ai", "devops", "sql-server", "llm-agents"]
externalUrl: "https://mykubert.com/blog/building-a-custom-ai-agent-for-sql-server-deep-dive-into-devops/"
source: "kubert-ai"
---
```

**Advantages:**
- Uses the existing content collection -- no new collection to define or query
- All posts (local + external) sort naturally by `publishedDate` in the existing blog listing query
- BlogCard component gets a simple conditional: if `externalUrl` exists, link externally; otherwise link to `/blog/{slug}/`
- RSS feed, tag pages, and home page "Latest Writing" section all automatically include external posts with zero additional queries
- The blog post detail page (`/blog/[slug].astro`) can guard against rendering external-only entries (they have no body)

**Disadvantages:**
- External post files clutter `src/data/blog/` directory (mitigated by `ext-` prefix convention)
- Must remember to not generate detail pages for external entries

### Approach B: Separate Collection + Merge at Query Time

Create a second content collection (`externalPosts`) and merge results in every page that lists blog posts.

**Disadvantages that make this inferior:**
- Every page querying blog content (blog listing, home page, tag pages, RSS) must now query two collections and merge
- Two separate Zod schemas to maintain
- Tag pages need dual-collection awareness
- More code changes, more surface area for bugs

### Recommendation: Approach A

Use the single-collection approach. It requires the smallest code surface change (schema update + BlogCard conditional + slug page guard) and leverages the existing query infrastructure everywhere.

### External Posts to Curate (Recommended Initial Selection)

From the 79 total external posts, select 8-12 that best represent Patryk's core domains. Prioritize posts where Patryk is the author (some Translucent Computing posts are by other authors like Robert Golabek or Mike Lagowski).

**From Kubert AI (mykubert.com) -- Patryk-authored:**

| Post | Date | Why Include |
|------|------|-------------|
| "Building a Custom AI Agent for SQL Server: Deep Dive into DevOps" | 2024-08-29 | Hands-on technical depth, AI + DevOps intersection |
| "Introducing Open Source Kubernetes AI Assistant" | 2024-08-23 | Flagship Kubert product, demonstrates K8s + AI expertise |
| "Ollama Kubernetes Deployment: Cost-Effective and Secure" | 2024-09-06 | Practical K8s deployment, LLM infrastructure |
| "Red Teaming LLMs: AI Agent Threats" | 2024-10-01 | Security depth, demonstrates breadth beyond just building |
| "From Golden Paths to Agentic AI: A New Era of Kubernetes Management" | 2025-01-16 | Platform engineering + AI convergence thesis |
| "AgentOps and Agentic AI: The Future of DevOps and Cloud Automation" | 2025-06-01 | Most recent Kubert post, forward-looking |

**From Translucent Computing (translucentcomputing.com) -- Patryk-authored:**

| Post | Date | Why Include |
|------|------|-------------|
| "Apache Airflow -- Data Pipeline" | 2025-03-22 | Data engineering depth, practical infrastructure |
| "Strategies for Managing Kubernetes Cloud Cost Part 1" | 2025-03-22 | K8s production expertise, cost optimization |
| "Workflow Engine Data Pipeline" | 2025-03-22 | Complements Airflow post, data platform breadth |
| "Why is Zero Trust Security Important for Your Business?" | 2025-03-22 | Security perspective, breadth of architecture thinking |

**Selection criteria applied:**
1. Patryk must be the author (excluded Robert Golabek and Mike Lagowski posts)
2. Technical depth over marketing/news content
3. Covers diverse domains (AI/ML, K8s, security, data engineering, platform engineering)
4. Recency weighted but not exclusively

---

## Detailed Analysis: Hero Tagline Refresh

### Current State

```
Name:     Patryk Golabek
Typing:   Cloud-Native Architect | Kubernetes Pioneer | AI/ML Engineer | Platform Builder
Subtitle: Building resilient cloud-native systems and AI-powered solutions for 17+ years.
          Pre-1.0 Kubernetes adopter. Ontario, Canada.
```

### Requirements

- Remove "Pre-1.0 Kubernetes adopter" (bragging tone, not craft/precision)
- Remove "Ontario, Canada" (location not needed)
- Shift to "craft & precision" vibe
- Keep it concise and professional

### Hero Tagline Best Practices (Research Findings)

Based on analysis of effective developer portfolio hero sections:

1. **6-10 words maximum** for the primary tagline (HIGH confidence -- multiple sources agree)
2. **Lead with what you do, not how long you have done it** -- years of experience can be on the About page
3. **"Craft" language signals intentionality** -- "I architect" / "I design" / "I craft" vs "I build" (which is generic)
4. **Precision language signals rigor** -- "engineered for scale" / "measured outcomes" / "deliberate systems"
5. **Avoid buzzword soup** -- "cloud-native AI-powered DevSecOps platform engineering" says nothing. Pick one clear identity.
6. **The subtitle supports the headline** -- headline is the identity, subtitle is the value proposition

### Recommended Options

**Option A (Recommended): Architect's Identity**
```
Typing:   Software Architect | Systems Engineer | AI/ML Builder
Subtitle: Designing cloud-native systems with craft and precision.
          Kubernetes, AI agents, platform engineering.
```
Why: "Designing" implies thoughtfulness over speed. "Craft and precision" is explicit. Second line maps competencies without being a buzzword list. Clean, confident, no fluff.

**Option B: Craft-Forward**
```
Typing:   Cloud-Native Architect | Systems Designer | AI Engineer
Subtitle: Engineering resilient systems with deliberate precision.
          From Kubernetes platforms to AI-powered automation.
```
Why: "Deliberate precision" is stronger than "craft and precision" for a technical audience. "Resilient systems" signals production-grade thinking.

**Option C: Minimalist**
```
Typing:   Architect | Engineer | Builder
Subtitle: Cloud-native systems and AI agents, crafted with precision.
```
Why: Extremely concise. The typing roles are abstract enough to intrigue. The subtitle does the specificity work.

**Recommendation:** Option A. It balances specificity (recruiters need to understand what you do quickly) with the craft/precision tone. The typing roles cover the three main domains without being overly cute.

### Typing Roles Analysis

Current: `['Cloud-Native Architect', 'Kubernetes Pioneer', 'AI/ML Engineer', 'Platform Builder']`

Issues with current roles:
- "Kubernetes Pioneer" -- bragging, being removed per requirements
- "Platform Builder" -- "Builder" is too generic for a 17-year senior architect
- "Cloud-Native Architect" -- good, keep or refine
- "AI/ML Engineer" -- good, keep or refine

Recommended roles for Option A: `['Software Architect', 'Systems Engineer', 'AI/ML Builder']`

Alternative set: `['Cloud-Native Architect', 'Systems Designer', 'AI Engineer']`

---

## Detailed Analysis: Social Links Update

### Current State

| Location | Links Present |
|----------|--------------|
| Footer (`Footer.astro`) | GitHub, LinkedIn, Translucent Computing Blog |
| Contact page (`contact.astro`) | Email (patryk@translucentcomputing.com), LinkedIn, GitHub, Translucent Computing Blog, Kubert AI Blog |
| Home page CTA (`index.astro`) | Email (patryk@translucentcomputing.com), LinkedIn |
| PersonJsonLd (`PersonJsonLd.astro`) | GitHub, LinkedIn, TC Blog, Kubert Blog in `sameAs` |

### Required Changes

| Action | Details |
|--------|---------|
| **Add X (Twitter)** | @QuantumMentat -- https://x.com/QuantumMentat |
| **Add YouTube** | @QuantumMentat -- https://youtube.com/@QuantumMentat |
| **Update email** | Change from patryk@translucentcomputing.com to pgolabek@gmail.com |
| **Remove LinkedIn** | Remove from footer, contact page cards, home page CTA |
| **Keep GitHub** | No change |
| **Keep external blog links** | Translucent Computing and Kubert AI blog links stay in contact page "Other places" section |

### Files Requiring Changes

1. `src/components/Footer.astro` -- Remove LinkedIn SVG/link, add X and YouTube SVGs/links
2. `src/pages/contact.astro` -- Replace LinkedIn card with X card, add YouTube card, update email address
3. `src/pages/index.astro` -- Replace "Connect on LinkedIn" CTA with X or email alternative
4. `src/components/PersonJsonLd.astro` -- Update `sameAs` array, update email, consider keeping LinkedIn in sameAs (see Anti-Features note)

### SVG Icons Needed

- **X (Twitter):** Standard X logo SVG (24x24 viewBox, single path)
- **YouTube:** Standard YouTube play button SVG (24x24 viewBox)
- Both are widely available and license-free for social link usage

---

## Detailed Analysis: Project Curation

### Current Categories and Counts

| Category | Count | Projects |
|----------|-------|----------|
| AI/ML & LLM Agents | 8 | kps-graph-agent, kps-assistant, kps-assistant-support, kubert-langflow, kps-langflow, tekstack-assistant-library, financial-data-extractor, **gemini-beauty-math** |
| Kubernetes & Infrastructure | 6 | kps-cluster-deployment, kps-infra-management, kps-basic-package, kps-observability-package, kps-charts, kps-images |
| Platform & DevOps Tooling | 2 | kps-lobe-chat, jobs |
| **Full-Stack Applications** | **2** | **PatrykQuantumNomad, arjancode_examples (fork)** |
| Security & Networking | 1 | networking-tools |

### Required Removals

| Item | Action | Rationale |
|------|--------|-----------|
| "Full-Stack Applications" category | Remove from `categories` array | Category only contains the portfolio repo itself and a fork -- neither demonstrates meaningful engineering |
| `PatrykQuantumNomad` project | Remove from `projects` array | Self-referential (the portfolio site listing itself as a project is circular) |
| `arjancode_examples` project | Remove from `projects` array | Fork of someone else's code examples -- does not represent original work |
| `gemini-beauty-math` project | Remove from `projects` array | Lightweight demo from AI/ML category -- dilutes the senior architect signal among the stronger AI agent projects |

### Post-Removal State

| Category | Count | Projects |
|----------|-------|----------|
| AI/ML & LLM Agents | 7 | kps-graph-agent, kps-assistant, kps-assistant-support, kubert-langflow, kps-langflow, tekstack-assistant-library, financial-data-extractor |
| Kubernetes & Infrastructure | 6 | (unchanged) |
| Platform & DevOps Tooling | 2 | (unchanged) |
| Security & Networking | 1 | (unchanged) |
| **Total** | **16** | Down from 19 |

### Implementation Notes

- Update `categories` array: remove `'Full-Stack Applications'`
- Remove 3 entries from `projects` array
- Update projects page meta description: "Explore 16 open-source projects..." (was 19)
- No structural changes to the projects page template

---

## Feature Dependencies

```
[v1.1 Content Refresh]
    |
    |-- [External Blog Integration]
    |       |-- requires --> Schema update in content.config.ts (add externalUrl, source fields)
    |       |-- requires --> External post markdown files in src/data/blog/
    |       |-- requires --> BlogCard.astro conditional rendering
    |       |-- requires --> Blog slug page guard (skip rendering for external entries)
    |       |-- impacts --> RSS feed (external posts should appear with external links)
    |       |-- impacts --> Home page "Latest Writing" (external posts may appear)
    |       |-- impacts --> Tag pages (external posts have tags)
    |       |-- impacts --> OG image generation (skip for external entries -- they have no local page)
    |
    |-- [Social Links Update]
    |       |-- requires --> X and YouTube SVG icons
    |       |-- requires --> Footer.astro update
    |       |-- requires --> Contact page update
    |       |-- requires --> Home page CTA update
    |       |-- requires --> PersonJsonLd.astro update
    |       |-- independent of --> External Blog Integration (no dependency)
    |
    |-- [Hero Tagline Refresh]
    |       |-- requires --> index.astro subtitle text update
    |       |-- requires --> index.astro typing roles array update
    |       |-- independent of --> Social Links Update (no dependency)
    |       |-- independent of --> External Blog Integration (no dependency)
    |
    |-- [Project Curation]
    |       |-- requires --> projects.ts data update
    |       |-- requires --> Projects page meta description update
    |       |-- independent of --> all other v1.1 features
    |
    |-- [Test Post Cleanup]
    |       |-- requires --> Delete draft-placeholder.md
    |       |-- independent of --> all other v1.1 features
```

### Dependency Notes

- **External Blog Integration is the only complex feature.** It touches 4-5 files and has downstream impacts on RSS, tags, home page, and OG generation. Everything else is a straightforward text/data edit.
- **Social Links, Hero Tagline, Project Curation, and Test Post Cleanup are all independent** of each other and can be done in any order or in parallel.
- **External Blog Integration should be done first** because it is the highest-risk change (schema modification, conditional rendering logic, multiple downstream impacts).
- **Schema change in content.config.ts is backward-compatible** -- adding optional fields does not break existing entries.

---

## MVP Definition for v1.1

### Must Ship

1. External blog entries appearing in blog listing (8-12 curated posts)
2. Social links updated across all 4 files (Footer, Contact, Home CTA, PersonJsonLd)
3. Hero tagline refreshed (subtitle + typing roles)
4. Full-Stack Applications category and gemini-beauty-math removed
5. Draft placeholder post deleted

### Should Ship (Differentiators)

6. Visual distinction badge on external posts ("on Kubert AI", "on Translucent Computing")
7. Blog slug page guard preventing 404s for external-only entries
8. RSS feed updated to include external posts with correct external links

### Defer to v1.2+

9. Source filtering on blog listing (only valuable after blog has 20+ total entries)
10. External blog link cards on About page (cross-promotion)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Risk | Priority |
|---------|------------|---------------------|------|----------|
| External blog entries in listing | HIGH | MEDIUM | MEDIUM | P1 |
| Social links update (all 4 files) | HIGH | LOW | LOW | P1 |
| Hero tagline refresh | HIGH | LOW | LOW | P1 |
| Project curation (remove category + projects) | MEDIUM | LOW | LOW | P1 |
| Test post cleanup | LOW | LOW | LOW | P1 |
| External post visual distinction badge | MEDIUM | LOW | LOW | P1 |
| Blog slug page guard for external entries | HIGH | LOW | MEDIUM | P1 |
| RSS feed external post inclusion | MEDIUM | LOW | LOW | P1 |
| PersonJsonLd structured data update | MEDIUM | LOW | LOW | P1 |
| Home page CTA update (LinkedIn removal) | HIGH | LOW | LOW | P1 |
| Source filtering on blog listing | LOW | MEDIUM | LOW | P2 |
| About page cross-promotion links | LOW | LOW | LOW | P2 |

**Priority key:**
- P1: Must complete for v1.1 -- the milestone is incomplete without these
- P2: Nice to have, defer if needed without blocking the milestone

---

## Implementation Complexity Summary

| Feature | Files Changed | Lines of Code (est.) | Risk Level |
|---------|--------------|---------------------|------------|
| External blog integration | 5 files (content.config.ts, 8-12 new .md files, BlogCard.astro, blog/[slug].astro, rss.xml.ts) | ~120 LOC changes + ~80 LOC new frontmatter files | MEDIUM -- schema change is the key risk |
| Social links update | 4 files (Footer.astro, contact.astro, index.astro, PersonJsonLd.astro) | ~80 LOC changes | LOW -- straightforward replacements |
| Hero tagline refresh | 1 file (index.astro) | ~10 LOC changes | LOW -- text only |
| Project curation | 1 file (projects.ts) + 1 file (projects/index.astro meta) | ~30 LOC removed | LOW -- data deletion |
| Test post cleanup | 1 file deletion | 0 LOC (file removal) | LOW |
| **Total** | **~12 files touched** | **~320 LOC** | **Overall: LOW-MEDIUM** |

---

## Sources

### HIGH Confidence (Official Documentation)
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- Collection definition, loaders, querying, merging multiple collections
- [Astro Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/) -- Custom loader interface, inline loaders, object loaders, LoaderContext
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- getCollection(), getEntry(), schema validation

### MEDIUM Confidence (Verified Patterns)
- [Syncing dev.to Posts with Astro Blog](https://logarithmicspirals.com/blog/updating-astro-blog-to-pull-devto-posts/) -- Real-world pattern for mixing local + external posts, canonical URL handling
- [Adding Local Markdown Posts to Hashnode-Powered Astro Blog](https://akoskm.com/hashnode-local-astro-hybrid-setup/) -- Hybrid local/external content approach
- [Building an RSS Aggregator with Astro (Raymond Camden)](https://www.raymondcamden.com/2026/02/02/building-an-rss-aggregator-with-astro) -- RSS parsing patterns, rss-parser library
- [Hero Section Copywriting Tips](https://zoconnected.com/blog/how-to-write-hero-section-website-copy/) -- 6-10 word headline, clarity over cleverness
- [Hero Section Examples Analysis (Thrive Themes)](https://thrivethemes.com/hero-section-examples/) -- Headline + subtitle structure, CTA placement
- [Developer Portfolio Best Practices 2025 (CodeTap)](https://codetap.org/blog/developer-portfolio-2025) -- Social link placement, contact info visibility

### Verified External Blog Data
- Translucent Computing blog (`translucentcomputing.com/blog/`) -- WordPress site, RSS at `/feed/`, 62 posts in sitemap, 4 in RSS feed, Patryk + other authors
- Kubert AI blog (`mykubert.com/blog/`) -- WordPress site, RSS at `/feed/`, 17 posts in sitemap, 3 in RSS feed, Patryk primary author
- Both blogs confirmed accessible via standard WordPress RSS feeds and XML sitemaps (Yoast SEO + W3 Total Cache)

---
*Feature research for: patrykgolabek.dev v1.1 Content Refresh*
*Researched: 2026-02-11*
