# Architecture Research: v1.1 Content Refresh

**Domain:** Integration of external blog entries, social links configuration, hero updates, and project curation into existing Astro 5 portfolio site
**Researched:** 2026-02-11
**Confidence:** HIGH
**Scope:** Modifications to existing architecture -- NOT a from-scratch build

## Integration with Existing System

### Current Architecture Snapshot

The v1.0 site at patrykgolabek.dev is a fully operational Astro 5 static site with:

- **Content config:** `src/content.config.ts` defines a single `blog` collection using `glob()` loader pointed at `./src/data/blog`
- **Blog schema:** Zod object with `title`, `description`, `publishedDate`, `updatedDate?`, `tags[]`, `draft`
- **Blog listing:** `src/pages/blog/index.astro` queries `getCollection('blog')`, sorts by date, renders `BlogCard` components
- **Blog detail:** `src/pages/blog/[slug].astro` uses `getStaticPaths()` + `render()` to generate individual post pages
- **Home page:** `src/pages/index.astro` shows 3 latest posts with hardcoded hero text and typing animation roles array
- **Projects:** `src/data/projects.ts` TypeScript module (NOT a content collection) with typed `Project[]` array and `categories` const
- **Social links:** Hardcoded as inline HTML in `Footer.astro` (GitHub, LinkedIn, Translucent Computing Blog) and `contact.astro` (same + Kubert AI Blog)
- **Contact info:** Hardcoded email (`patryk@translucentcomputing.com`) in `index.astro` CTA and `contact.astro`
- **SEO data:** `PersonJsonLd.astro` has hardcoded `sameAs` array; `SEOHead.astro` has no centralized site data import

### What Changes, What Stays

| Component | Status | Change Summary |
|-----------|--------|----------------|
| `src/content.config.ts` | **MODIFY** | Add `externalUrl` optional field to blog schema |
| `src/data/blog/*.md` | **ADD/REMOVE** | Add external blog entry stubs; remove unwanted posts |
| `src/data/projects.ts` | **MODIFY** | Remove specific project entries from the array |
| `src/data/site.ts` (NEW) | **CREATE** | Centralized site config: social links, contact info, hero text |
| `src/components/BlogCard.astro` | **MODIFY** | Conditional link: external URL vs internal `/blog/{id}/` |
| `src/pages/blog/index.astro` | **MINOR MODIFY** | No structural change; BlogCard handles link logic |
| `src/pages/blog/[slug].astro` | **MODIFY** | Filter out external posts from `getStaticPaths()` |
| `src/pages/index.astro` | **MODIFY** | Import hero text from `site.ts`; import social links; update typing roles |
| `src/components/Footer.astro` | **MODIFY** | Import social links from `site.ts` instead of hardcoding |
| `src/pages/contact.astro` | **MODIFY** | Import contact info and social links from `site.ts` |
| `src/components/PersonJsonLd.astro` | **MODIFY** | Import `sameAs` URLs from `site.ts` |
| `src/pages/rss.xml.ts` | **MODIFY** | Handle external posts: use `externalUrl` as link for external entries |
| `src/pages/llms.txt.ts` | **MODIFY** | Same external URL handling |
| `src/pages/open-graph/[...slug].png.ts` | **MODIFY** | Skip OG image generation for external posts |
| `astro.config.mjs` | **NO CHANGE** | No configuration changes needed |
| `src/layouts/Layout.astro` | **NO CHANGE** | Layout is unchanged |
| `src/components/Header.astro` | **NO CHANGE** | Navigation unchanged |
| `src/pages/blog/tags/[tag].astro` | **MODIFY** | BlogCard handles link logic; tags page needs no structural change |

---

## Component Modifications

### 1. Blog Schema Extension (`src/content.config.ts`)

**Current state:**
```typescript
schema: z.object({
  title: z.string(),
  description: z.string(),
  publishedDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
}),
```

**Target state -- add two optional fields:**
```typescript
schema: z.object({
  title: z.string(),
  description: z.string(),
  publishedDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  externalUrl: z.string().url().optional(),  // NEW: link to external blog
  source: z.string().optional(),              // NEW: "Translucent Computing", "Kubert AI", etc.
}),
```

**Rationale:** This is the simplest approach that keeps ALL blog entries in one collection. External posts are just markdown stubs with minimal body content and an `externalUrl` in frontmatter. This avoids creating a second collection, a custom loader, or any merge logic. The `glob()` loader still works -- external entries are just `.md` files with a special frontmatter field. The `source` field provides a display label for where the post lives (shown on the card as a badge).

**Why NOT a separate collection or custom inline loader:**
- A second collection (e.g., `externalBlogs`) would require merging two arrays in every page that lists posts, manually sorting the combined result, and maintaining two schemas. This adds complexity for minimal benefit.
- A custom inline loader that programmatically defines entries would work but loses the ergonomics of writing markdown files. Adding an external post should be "create a .md file with frontmatter" -- the same workflow as internal posts.
- The single-collection approach means `getCollection('blog')` returns everything, already sorted by date, with no merge step. Pages just need to check `post.data.externalUrl` to decide behavior.

**Confidence:** HIGH -- this is a standard Zod `.optional()` field on an existing schema. Astro's content layer treats it as any other frontmatter field. Verified via [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/).

### 2. External Blog Entry Files (`src/data/blog/`)

**Structure of an external blog stub file:**
```markdown
---
title: "Building RAG Pipelines with LangChain and Kubernetes"
description: "A deep dive into production RAG architecture using LangChain, vector databases, and Kubernetes orchestration."
publishedDate: 2025-11-15
tags: ["ai", "rag", "kubernetes", "langchain"]
externalUrl: "https://translucentcomputing.com/blog/rag-pipelines-langchain-kubernetes/"
source: "Translucent Computing"
---

Originally published on Translucent Computing Blog.
```

The body content is minimal -- it exists only because the `glob()` loader requires a markdown file. The body is never rendered for external posts. The filename (e.g., `rag-pipelines-langchain-kubernetes.md`) determines the `post.id` but no static page is generated for it.

### 3. BlogCard Component (`src/components/BlogCard.astro`)

**Current behavior:** Always links to `/blog/${post.id}/`

**Modified behavior:** Check `post.data.externalUrl`. If present, link there with `target="_blank"` and an external link indicator. If absent, link internally as before.

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
const { title, description, publishedDate, tags, externalUrl, source } = post.data;
const isExternal = !!externalUrl;
const href = isExternal ? externalUrl : `/blog/${post.id}/`;
---

<article class="group relative p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-[var(--color-accent)] transition-colors">
  <a
    href={href}
    class="absolute inset-0 z-0"
    aria-label={title}
    {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
  ></a>
  <div class="flex items-center gap-2">
    <time datetime={publishedDate.toISOString()} class="text-sm text-[var(--color-text-secondary)]">
      {publishedDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
    </time>
    {isExternal && source && (
      <span class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)]">
        {source}
      </span>
    )}
  </div>
  <h2 class="text-xl font-heading font-bold mt-2 group-hover:text-[var(--color-accent)] transition-colors">
    {title}
    {isExternal && (
      <svg class="inline-block w-4 h-4 ml-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 17L17 7" />
        <path d="M7 7h10v10" />
      </svg>
    )}
  </h2>
  <p class="mt-2 text-[var(--color-text-secondary)]">{description}</p>
  {tags.length > 0 && (
    <div class="flex flex-wrap gap-2 mt-4">
      {tags.map((tag) => (
        <a
          href={`/blog/tags/${tag}/`}
          class="relative z-10 text-xs px-2 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
        >
          {tag}
        </a>
      ))}
    </div>
  )}
</article>
```

**Key design decisions:**
- External posts get a small arrow icon next to the title (same icon used on projects page -- visual consistency)
- External posts show a `source` badge next to the date
- External links open in a new tab (`target="_blank"`)
- Tag links still work and point to internal tag pages -- this is intentional so external posts contribute to the site's tag ecosystem
- The card structure and styling remain identical -- external posts look like first-class content, not second-class citizens

### 4. Dynamic Blog Route (`src/pages/blog/[slug].astro`)

**Critical change:** Filter out external posts from `getStaticPaths()`. External posts must NOT generate local pages -- they have no renderable body content.

```astro
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => {
    return (import.meta.env.PROD ? data.draft !== true : true) && !data.externalUrl;
  });

  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
```

The only change is adding `&& !data.externalUrl` to the filter. Everything else in the file stays the same.

### 5. Centralized Site Configuration (`src/data/site.ts` -- NEW FILE)

**Current problem:** Social links, contact email, and hero text are scattered as hardcoded strings across `Footer.astro`, `contact.astro`, `index.astro`, and `PersonJsonLd.astro`. Updating the email requires changes in 3 files. Adding a social link requires editing 2-3 components.

**Solution:** A single TypeScript data file that exports typed configuration objects.

```typescript
// src/data/site.ts

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
  icon: string; // SVG path data or icon identifier
}

export const socialLinks: SocialLink[] = [
  {
    platform: 'github',
    url: 'https://github.com/PatrykQuantumNomad',
    label: 'GitHub profile',
    icon: 'github',
  },
  {
    platform: 'linkedin',
    url: 'https://www.linkedin.com/in/patrykgolabek/',
    label: 'LinkedIn profile',
    icon: 'linkedin',
  },
  {
    platform: 'blog-tc',
    url: 'https://translucentcomputing.com/blog/',
    label: 'Translucent Computing Blog',
    icon: 'book',
  },
  {
    platform: 'blog-kubert',
    url: 'https://mykubert.com/blog/',
    label: 'Kubert AI Blog',
    icon: 'sparkle',
  },
];

export const contact = {
  email: 'patryk@translucentcomputing.com',
};

export const hero = {
  name: 'Patryk Golabek',
  tagline: 'Building resilient cloud-native systems and AI-powered solutions for 17+ years. Pre-1.0 Kubernetes adopter. Ontario, Canada.',
  roles: ['Cloud-Native Architect', 'Kubernetes Pioneer', 'AI/ML Engineer', 'Platform Builder'],
};

export const sameAs = socialLinks.map((link) => link.url);
```

**Why `src/data/site.ts` and not `src/lib/constants.ts`:**
The existing project uses `src/data/` for content data files (blog posts, projects). Site configuration is data, not library code. Keeping it in `src/data/` follows the established convention. The v1.0 architecture research recommended `src/lib/constants.ts`, but the actual implementation never created that file -- the data ended up hardcoded in components. This is the opportunity to centralize it.

**Why a TypeScript file and not JSON/YAML:**
- Type safety: interfaces are defined alongside the data
- Computed properties: `sameAs` derives from `socialLinks` automatically
- Import ergonomics: `import { socialLinks } from '../data/site'` works cleanly in `.astro` files

### 6. Footer Social Links (`src/components/Footer.astro`)

**Current state:** Three hardcoded `<a>` tags with inline SVG icons for GitHub, LinkedIn, and Translucent Computing Blog.

**Modified state:** Import `socialLinks` from `src/data/site.ts` and render dynamically. SVG icons are mapped via a helper or kept as a simple conditional block since there are only 3-4 links.

The SVG icons are currently inline in the template. For maintainability, the simplest approach is a map of platform-to-SVG-markup within the component, or keep using inline SVGs but drive the `href` and `aria-label` from the imported data. Full icon-component abstraction is over-engineering for 4 social links.

**Recommended approach -- minimal change:**
```astro
---
import { socialLinks } from '../data/site';
const currentYear = new Date().getFullYear();
---
```
Then iterate `socialLinks` to render each `<a>` tag. The SVG icon rendering can use a simple `{link.icon === 'github' && (...)}` conditional or a small `SocialIcon` helper component.

### 7. Home Page Hero (`src/pages/index.astro`)

**Current state:** Hero text is hardcoded directly in the template. The typing roles array is in an inline `<script is:inline>` block.

**What changes:**
1. Import `hero` from `src/data/site.ts` for the name, tagline, and static role text
2. Import `contact` for the CTA email link
3. The typing `roles` array in the inline script should also reference the config -- but since `<script is:inline>` does not have access to Astro variables at runtime, the roles array needs to be injected via a `data-*` attribute or a `<script>` block that reads from a rendered element

**Recommended pattern for typing roles:**
```astro
<span id="typing-role" class="typing-cursor" data-roles={JSON.stringify(hero.roles)}>
  {hero.roles[0]}
</span>

<script is:inline>
  (function() {
    if (window.__typingInterval) clearInterval(window.__typingInterval);
    const el = document.getElementById('typing-role');
    if (!el) return;
    const roles = JSON.parse(el.dataset.roles || '[]');
    let i = 0;
    if (roles.length > 1) {
      window.__typingInterval = setInterval(function() {
        i = (i + 1) % roles.length;
        el.textContent = roles[i];
      }, 3000);
    }
  })();
</script>
```

This keeps the roles defined in one place (`site.ts`) and injects them into the DOM via `data-roles`. The inline script reads them at runtime.

### 8. Contact Page (`src/pages/contact.astro`)

**Current state:** Hardcoded email, LinkedIn URL, GitHub URL, blog URLs as inline HTML.

**Modified state:** Import `socialLinks` and `contact` from `src/data/site.ts`. Map social links to contact cards. The page layout stays the same, but URLs come from the centralized config.

### 9. PersonJsonLd (`src/components/PersonJsonLd.astro`)

**Current state:** Hardcoded `sameAs` array with 4 URLs.

**Modified state:** Import `sameAs` from `src/data/site.ts`. The structured data stays accurate as social links are added or removed.

### 10. RSS Feed (`src/pages/rss.xml.ts`)

**Current state:** All blog posts get `/blog/${post.id}/` as the link.

**Modified state:** External posts should use their `externalUrl` as the RSS link. This way RSS readers link directly to the external article.

```typescript
items: posts.map((post) => ({
  title: post.data.title,
  pubDate: post.data.publishedDate,
  description: post.data.description,
  link: post.data.externalUrl ?? `/blog/${post.id}/`,
})),
```

### 11. LLMs.txt (`src/pages/llms.txt.ts`)

**Same pattern as RSS:** External posts should link to their `externalUrl`.

### 12. OG Image Generation (`src/pages/open-graph/[...slug].png.ts`)

**Filter out external posts:** External posts do not have local pages, so they should not have OG images generated. Add `&& !data.externalUrl` to the filter in `getStaticPaths`.

### 13. Project Data Curation (`src/data/projects.ts`)

**Change type:** Data removal only. Remove specific entries from the `projects` array. No structural changes to the `Project` interface, `categories` array, or the projects page component.

---

## Data Flow for External Blog Entries

### Build-Time Flow

```
src/data/blog/
 |
 +-- building-kubernetes-observability-stack.md  (internal, externalUrl: undefined)
 +-- draft-placeholder.md                        (internal, draft: true)
 +-- rag-pipelines-langchain-kubernetes.md        (EXTERNAL, externalUrl: "https://...")
 +-- kubert-ai-multi-agent-systems.md             (EXTERNAL, externalUrl: "https://...")
 |
 v  glob() loader
 |
 v  Zod schema validation (externalUrl is optional -- both pass)
 |
Content Collection Store
 |
 +---> getCollection('blog')
        |
        +---> blog/index.astro      --> ALL posts (internal + external)
        |     renders BlogCard      --> BlogCard checks externalUrl
        |                               - internal: href="/blog/{id}/"
        |                               - external: href=externalUrl, target="_blank"
        |
        +---> blog/[slug].astro     --> ONLY internal posts (filter: !externalUrl)
        |     getStaticPaths()          No static page generated for external posts
        |     render(post)              render() only called on internal posts
        |
        +---> index.astro           --> 3 latest posts (internal + external mixed)
        |     "Latest Writing"          Same BlogCard conditional logic
        |
        +---> blog/tags/[tag].astro --> Tag pages include external posts
        |     getStaticPaths()          External posts tagged "kubernetes" appear on /blog/tags/kubernetes/
        |                               BlogCard handles link logic
        |
        +---> rss.xml.ts            --> ALL non-draft posts
        |     link = externalUrl ?? `/blog/${post.id}/`
        |
        +---> llms.txt.ts           --> ALL non-draft posts
        |     link = externalUrl ?? local path
        |
        +---> open-graph/[...slug]  --> ONLY internal posts (filter: !externalUrl)
              No OG images for external posts
```

### What Does NOT Change in the Data Flow

- The `glob()` loader, Zod validation pipeline, and `getCollection()` API all work unchanged
- The sort-by-date logic is unchanged -- external posts sort alongside internal posts by `publishedDate`
- The draft filtering logic is unchanged -- external posts can also be drafts
- Tag pages automatically include external posts because tags come from the same collection
- View Transitions, theme toggle, scroll reveals -- all client-side behavior is unaffected

---

## New: Centralized Configuration Data Flow

```
src/data/site.ts
 |
 +-- socialLinks[]   --> Footer.astro (social icon links)
 |                   --> contact.astro (contact cards + "Other places" section)
 |                   --> PersonJsonLd.astro (sameAs array)
 |
 +-- contact.email   --> index.astro (CTA "Get in Touch" mailto:)
 |                   --> contact.astro (email card mailto:)
 |
 +-- hero.name       --> index.astro (h1)
 +-- hero.tagline    --> index.astro (subtitle paragraph)
 +-- hero.roles      --> index.astro (typing animation via data-roles attribute)
```

---

## Modification Dependency Graph and Build Order

The v1.1 changes have clear dependencies that dictate build order:

```
[1] src/data/site.ts (NEW)          <-- No dependencies. Create first.
     |
     +-----> [2] src/content.config.ts (MODIFY schema)    <-- No dependency on site.ts
     |                                                         but logical to do alongside
     |
     +-----> [3] src/data/blog/*.md (ADD external stubs)   <-- Requires [2] for schema
     |                                                         validation to pass
     |
     +-----> [4] src/components/BlogCard.astro (MODIFY)    <-- Requires [2] for types
     |
     +-----> [5a] src/components/Footer.astro (MODIFY)     <-- Requires [1] for imports
     +-----> [5b] src/components/PersonJsonLd.astro (MODIFY) <-- Requires [1]
     +-----> [5c] src/pages/contact.astro (MODIFY)         <-- Requires [1]
     |
     +-----> [6] src/pages/index.astro (MODIFY hero)       <-- Requires [1], [4]
     |
     +-----> [7a] src/pages/blog/[slug].astro (MODIFY)     <-- Requires [2]
     +-----> [7b] src/pages/rss.xml.ts (MODIFY)            <-- Requires [2]
     +-----> [7c] src/pages/llms.txt.ts (MODIFY)           <-- Requires [2]
     +-----> [7d] src/pages/open-graph/[...slug].png.ts    <-- Requires [2]
     |
     +-----> [8] src/data/projects.ts (MODIFY -- remove entries) <-- Independent, any time
```

### Recommended Phase Structure for v1.1

**Phase 1: Configuration Foundation**
1. Create `src/data/site.ts` with social links, contact, hero data
2. Modify `src/content.config.ts` to add `externalUrl` and `source` fields

**Phase 2: External Blog Integration**
3. Add external blog entry stub files in `src/data/blog/`
4. Modify `BlogCard.astro` for conditional internal/external linking
5. Modify `blog/[slug].astro` to filter out external posts
6. Modify `rss.xml.ts`, `llms.txt.ts`, `open-graph/[...slug].png.ts` for external post handling

**Phase 3: Centralized Config Consumption**
7. Modify `Footer.astro` to import social links from `site.ts`
8. Modify `contact.astro` to import social links and email from `site.ts`
9. Modify `PersonJsonLd.astro` to import `sameAs` from `site.ts`
10. Modify `index.astro` to import hero data and contact from `site.ts`

**Phase 4: Content Curation**
11. Remove unwanted blog posts from `src/data/blog/`
12. Remove unwanted project entries from `src/data/projects.ts`

**Why this order:**
- Phase 1 establishes the data contracts (schema, config) that all other changes depend on
- Phase 2 is the most architecturally complex change (external blog integration) and should be done while the codebase is closest to its known-good state
- Phase 3 is a series of safe refactors (replacing hardcoded strings with imports) that can be done independently
- Phase 4 is pure content deletion -- the lowest risk and can be done last or in parallel with Phase 3

---

## Anti-Patterns to Avoid

### Anti-Pattern: Separate Collection for External Posts

**What it looks like:** Creating a second collection `externalBlogs` with a custom inline loader or JSON file, then merging with the `blog` collection in every page.

**Why it's wrong for this use case:** Doubles the query complexity. Every page that lists posts must query two collections, merge the arrays, and re-sort by date. Type unions get messy. Tag pages need to aggregate tags from both collections. The RSS feed needs both. All for what amounts to adding an optional field to existing entries.

**When it WOULD be right:** If external posts had a fundamentally different schema (e.g., fetched live from an API at build time with different fields). Not the case here -- external posts have the same title/description/date/tags structure as internal posts.

### Anti-Pattern: Generating Static Pages for External Posts Then Redirecting

**What it looks like:** Letting `[slug].astro` generate pages for external posts, then using Astro's `redirect` or a meta refresh tag to send visitors to the external URL.

**Why it's wrong:** Wastes build time generating pages that nobody should visit. Creates URLs that exist but immediately bounce visitors. Confuses search engines. Adds pages to the sitemap that are not real content. On GitHub Pages (static hosting), you cannot do proper 301 redirects -- only meta refresh, which is an SEO anti-pattern.

**Do this instead:** Never generate a page for external posts. Filter them out in `getStaticPaths()`. The blog listing links directly to the external URL.

### Anti-Pattern: Storing Social Links in astro.config.mjs

**What it looks like:** Adding custom fields to `astro.config.mjs` and accessing them via `Astro.config`.

**Why it's wrong:** `astro.config.mjs` is for Astro framework configuration (build settings, integrations, site URL). Custom application data does not belong there. Astro does not expose arbitrary config fields to components.

**Do this instead:** Use a TypeScript data file (`src/data/site.ts`) imported directly by components that need it.

---

## Sources

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) -- Content Layer API, `glob()` loader, Zod schemas, optional fields (HIGH confidence)
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- `getCollection()`, `render()`, `CollectionEntry` type, filter functions (HIGH confidence)
- [Astro Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/) -- Inline loaders, entry structure, `rendered` field (HIGH confidence)
- [Content Layer: A Deep Dive](https://astro.build/blog/content-layer-deep-dive/) -- Architecture of Content Layer, loader invocation, store management (HIGH confidence)
- [Syncing dev.to Posts with Astro Blog](https://logarithmicspirals.com/blog/updating-astro-blog-to-pull-devto-posts/) -- Pattern for mixing external API posts with local markdown in content collections (MEDIUM confidence)
- [External Redirects in Astro on Vercel](https://www.jamiekuppens.com/posts/how-to-add-external-redirects-in-astro-on-vercel) -- externalLink frontmatter pattern, postbuild redirect scripts (MEDIUM confidence)
- [Astro Content Collections Complete 2026 Guide](https://inhaq.com/blog/getting-started-with-astro-content-collections.html) -- Schema patterns, optional fields, Zod URL validation (MEDIUM confidence)
- [Astro Build a Blog Tutorial: Social Media Footer](https://docs.astro.build/en/tutorial/3-components/2/) -- Centralized social links pattern (HIGH confidence)

---
*Architecture research for: v1.1 content refresh integration*
*Researched: 2026-02-11*
