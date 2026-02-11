# Phase 8: Schema & Hero Config Foundation - Research

**Researched:** 2026-02-11
**Domain:** Astro content collection schema extension, centralized site configuration, JSON-LD structured data
**Confidence:** HIGH

## Summary

Phase 8 establishes two foundational data contracts for v1.1: (1) extending the blog content collection schema with optional `externalUrl` and `source` fields, and (2) creating a centralized hero configuration in `src/data/site.ts` that feeds into the home page title, meta description, and JSON-LD Person entity.

The existing codebase is well-structured for both changes. The blog schema in `src/content.config.ts` already uses Zod with `defineCollection` and the `glob` loader (Astro 5 Content Layer API). Adding optional fields via `z.string().url().optional()` and `z.string().optional()` is fully backward-compatible -- existing markdown files without those fields will continue to validate without modification. This is confirmed by Astro's official documentation.

The hero config is a new file (`src/data/site.ts`) that centralizes the owner's name, tagline, and roles array. Currently, these values are hardcoded in at least 6 files: `index.astro` (title, description, hero heading, tagline, roles array), `PersonJsonLd.astro` (name, jobTitle, description), `Layout.astro` (default description), `SEOHead.astro` (og:site_name), `llms.txt.ts` (heading and bio), and `BlogPostingJsonLd.astro` (author name). Phase 8 scopes centralization narrowly to the home page title tag, meta description, and JSON-LD Person entity only -- not every occurrence of the name across the site.

**Primary recommendation:** Create `src/data/site.ts` first (it has no dependencies), then extend the blog schema (simple Zod change), then wire the home page + PersonJsonLd to consume from site.ts, and finish with a build verification.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Content collections with Zod schemas | Already installed, provides defineCollection + glob loader |
| zod (via astro:content) | bundled | Schema validation with `.optional()` | Built into Astro, no separate install needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | - | All work uses existing Astro/TypeScript | No new dependencies for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `src/data/site.ts` (plain TS) | Environment variables or astro.config.mjs | Plain TS is simpler, type-safe, and importable in both .astro and .ts files. Env vars require runtime access; astro.config.mjs is for framework config, not content |
| `z.string().url().optional()` for externalUrl | `z.string().optional()` (no URL validation) | URL validation catches malformed URLs at build time. Use `.url()` for safety |
| `z.enum([...]).optional()` for source | `z.string().optional()` | Enum restricts to known sources ("Kubert AI", "Translucent Computing"), preventing typos. Better type safety for downstream consumers |

**Installation:**
```bash
# No new packages needed -- all work uses existing Astro + Zod
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  content.config.ts      # MODIFY: add externalUrl + source to blog schema
  data/
    site.ts              # NEW: centralized hero config (name, tagline, roles)
    blog/                # UNCHANGED: existing blog markdown files
    projects.ts          # UNCHANGED: existing project data
  components/
    PersonJsonLd.astro   # MODIFY: import from site.ts instead of hardcoded
  pages/
    index.astro          # MODIFY: import from site.ts for title, description, hero, roles
  layouts/
    Layout.astro         # UNCHANGED in this phase (default description stays)
```

### Pattern 1: Centralized Site Config
**What:** A TypeScript file exporting typed constants for site-wide identity data.
**When to use:** When the same data (name, title, description) appears in multiple places and must stay synchronized.
**Example:**
```typescript
// src/data/site.ts
// Source: common Astro community pattern, verified via official docs project structure guidance

export const siteConfig = {
  name: 'Patryk Golabek',
  title: 'Cloud-Native Architect & AI/ML Engineer',
  tagline: 'Building resilient cloud-native systems and AI-powered solutions for 17+ years. Pre-1.0 Kubernetes adopter. Ontario, Canada.',
  roles: [
    'Cloud-Native Architect',
    'Kubernetes Pioneer',
    'AI/ML Engineer',
    'Platform Builder',
  ],
  url: 'https://patrykgolabek.dev',
  jobTitle: 'Cloud-Native Software Architect',
  description: 'Cloud-Native Software Architect with 17+ years of experience in Kubernetes, AI/ML systems, platform engineering, and DevSecOps',
} as const;

export type SiteConfig = typeof siteConfig;
```

### Pattern 2: Schema Extension with Optional Fields
**What:** Adding optional Zod fields to an existing content collection schema.
**When to use:** When extending a data model that has existing entries which must not break.
**Example:**
```typescript
// src/content.config.ts
// Source: https://docs.astro.build/en/guides/content-collections/

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // NEW: external blog support
    externalUrl: z.string().url().optional(),
    source: z.enum(['Kubert AI', 'Translucent Computing']).optional(),
  }),
});

export const collections = { blog };
```

### Pattern 3: Consuming Site Config in Astro Components
**What:** Importing the centralized config into .astro frontmatter and using it in templates.
**When to use:** For any component that renders identity/hero data.
**Example:**
```astro
---
// In index.astro frontmatter
import { siteConfig } from '../data/site';

// Use in Layout props
const pageTitle = `${siteConfig.name} — ${siteConfig.title}`;
const pageDescription = `Portfolio of ${siteConfig.name}, ${siteConfig.description}.`;
---

<Layout title={pageTitle} description={pageDescription}>
  <h1>{siteConfig.name}</h1>
  <span id="typing-role">{siteConfig.roles[0]}</span>
</Layout>

<script is:inline define:vars={{ roles: siteConfig.roles }}>
  // roles is now available as a JS variable
</script>
```

### Pattern 4: JSON-LD Person Entity from Config
**What:** PersonJsonLd component imports from site.ts instead of hardcoding.
**When to use:** Always -- keeps structured data synchronized with visible page content.
**Example:**
```astro
---
// In PersonJsonLd.astro
import { siteConfig } from '../data/site';

const schema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": siteConfig.name,
  "url": siteConfig.url,
  "jobTitle": siteConfig.jobTitle,
  "description": siteConfig.description,
  // ... rest of schema
};
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Anti-Patterns to Avoid
- **Over-centralizing in Phase 8:** The scope is specifically home page title, meta description, and JSON-LD Person. Do NOT refactor Footer, Contact, About, blog pages, etc. in this phase. Those will evolve in later phases (10, 11) or v1.2 (CONFIG-01).
- **Making externalUrl/source required:** This would break the existing blog post. They MUST be optional.
- **Using z.union for source:** `z.enum()` is simpler and provides better autocomplete. `z.union([z.literal('Kubert AI'), z.literal('Translucent Computing')])` is verbose for the same result.
- **Putting hero content in astro.config.mjs:** This file is for framework configuration (integrations, output mode), not content data. Use a separate data file.
- **Hardcoding the roles array in the inline script AND the config:** The script block on index.astro currently hardcodes `['Cloud-Native Architect', 'Kubernetes Pioneer', 'AI/ML Engineer', 'Platform Builder']`. This must read from site.ts via `define:vars` or a data attribute to stay in sync.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom frontmatter parser | Zod via `astro:content` | Astro already validates at build time; Zod gives type inference |
| URL validation | Regex pattern matching | `z.string().url()` | Handles edge cases (protocol, encoding) correctly |
| Enum validation for source | String comparison in templates | `z.enum()` | Build-time error if typo in frontmatter; TypeScript narrowing in templates |
| JSON-LD generation | Manual JSON string templates | Object literals + `JSON.stringify` | Existing pattern works well; structured data should be typed objects |

**Key insight:** This phase is about data contracts, not features. Every line of code should either define a schema or wire existing components to a centralized data source. No new UI, no new pages, no visual changes.

## Common Pitfalls

### Pitfall 1: Forgetting to Restart Dev Server After Schema Change
**What goes wrong:** Content collections cache the schema. After modifying `content.config.ts`, the dev server may use the old schema.
**Why it happens:** Astro's content layer caches validated data for performance.
**How to avoid:** Always restart the dev server (`astro dev`) or run `astro sync` after changing the schema.
**Warning signs:** New optional fields are `undefined` even when present in frontmatter, or type errors in IDE don't match actual build behavior.

### Pitfall 2: Breaking Existing Blog Posts with Required Fields
**What goes wrong:** If `externalUrl` or `source` is accidentally made required (missing `.optional()`), the existing `building-kubernetes-observability-stack.md` will fail validation at build time.
**Why it happens:** Zod defaults to required. Easy to forget `.optional()`.
**How to avoid:** Always add `.optional()` to new fields. Verify by running `astro build` immediately after the schema change, before adding any new content.
**Warning signs:** Build error like `Required at "externalUrl"` in content validation.

### Pitfall 3: Type Narrowing for Optional Fields
**What goes wrong:** TypeScript treats optional fields as `T | undefined`. If downstream code (in Phase 9) does `post.data.externalUrl.startsWith(...)` without checking for undefined, it will be a type error.
**Why it happens:** Optional Zod fields produce optional TypeScript types.
**How to avoid:** This is actually correct behavior -- it forces Phase 9 to handle the undefined case. Document this in the schema with comments.
**Warning signs:** TypeScript errors in templates accessing optional fields without null checks.

### Pitfall 4: Inline Script Cannot Import TypeScript Modules
**What goes wrong:** The `<script is:inline>` block on index.astro cannot use `import { siteConfig } from '../data/site'` because inline scripts are not processed by the bundler.
**Why it happens:** `is:inline` scripts are injected verbatim into HTML, no bundling.
**How to avoid:** Use Astro's `define:vars` directive to pass data from frontmatter to inline scripts: `<script is:inline define:vars={{ roles: siteConfig.roles }}>`. This serializes the value as a JSON literal in the script tag.
**Warning signs:** `import` statement appears in the rendered HTML, causing a browser error.

### Pitfall 5: Scope Creep Into Later Phases
**What goes wrong:** Temptation to update the tagline text, roles array content, or email address during this phase.
**Why it happens:** While wiring site.ts, it's natural to want to update the actual content values.
**How to avoid:** Phase 8 preserves CURRENT values. Use the exact same strings that are hardcoded today. Phase 11 (HERO-01, HERO-02) will update the tagline and roles. Phase 10 (SOCIAL-01) will update email.
**Warning signs:** Any visible change in the rendered site after Phase 8 completes.

## Code Examples

### Complete site.ts (preserving current values)
```typescript
// src/data/site.ts
// Centralized hero configuration. Phase 8 preserves v1.0 values exactly.
// Phase 11 will update tagline and roles for HERO-01, HERO-02.

export const siteConfig = {
  /** Owner's full name */
  name: 'Patryk Golabek',
  /** Professional title for structured data */
  jobTitle: 'Cloud-Native Software Architect',
  /** One-line description for meta tags and JSON-LD */
  description:
    'Cloud-Native Software Architect with 17+ years of experience in Kubernetes, AI/ML systems, platform engineering, and DevSecOps',
  /** Hero tagline shown below the name */
  tagline:
    'Building resilient cloud-native systems and AI-powered solutions for 17+ years. Pre-1.0 Kubernetes adopter. Ontario, Canada.',
  /** Roles for the typing animation */
  roles: [
    'Cloud-Native Architect',
    'Kubernetes Pioneer',
    'AI/ML Engineer',
    'Platform Builder',
  ] as const,
  /** Canonical site URL */
  url: 'https://patrykgolabek.dev',
} as const;
```

### Complete updated content.config.ts
```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    source: z.enum(['Kubert AI', 'Translucent Computing']).optional(),
  }),
});

export const collections = { blog };
```

### Home page title and description from config
```astro
---
// src/pages/index.astro (partial -- frontmatter section)
import { siteConfig } from '../data/site';

const pageTitle = `${siteConfig.name} \u2014 ${siteConfig.roles[0]} & ${siteConfig.roles[2]}`;
// Produces: "Patryk Golabek -- Cloud-Native Architect & AI/ML Engineer"

const pageDescription = `Portfolio of ${siteConfig.name}, ${siteConfig.description}.`;
// Produces: "Portfolio of Patryk Golabek, Cloud-Native Software Architect with 17+ years..."
---

<Layout title={pageTitle} description={pageDescription}>
```

### Passing roles to inline typing script via define:vars
```astro
<script is:inline define:vars={{ roles: siteConfig.roles }}>
  (function() {
    if (window.__typingInterval) {
      clearInterval(window.__typingInterval);
    }
    let i = 0;
    const el = document.getElementById('typing-role');
    if (el) {
      window.__typingInterval = setInterval(function() {
        i = (i + 1) % roles.length;
        el.textContent = roles[i];
      }, 3000);
    }
  })();
</script>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `type: 'content'` in content config | `loader: glob()` Content Layer API | Astro 5.0 (Dec 2024) | Already using current approach |
| `src/content/config.ts` path | `src/content.config.ts` path | Astro 5.0 (Dec 2024) | Already using current approach |
| Manual frontmatter parsing | Zod schema via `defineCollection` | Astro 2.0 (Jan 2023) | Already using current approach |

**Deprecated/outdated:**
- `type: 'content'` / `type: 'data'` in defineCollection: Replaced by loaders in Astro 5. The existing codebase already uses the current `loader: glob()` pattern.
- `src/content/config.ts` (with content subdirectory): The codebase correctly uses `src/content.config.ts` (Astro 5 convention).

## Hardcoded String Audit

The following files contain hardcoded hero-related strings. Phase 8 scope is marked.

| File | Hardcoded Value | Phase 8 Scope? | Notes |
|------|----------------|----------------|-------|
| `src/pages/index.astro` L17 | Title: `"Patryk Golabek -- Cloud-Native Architect & AI/ML Engineer"` | YES | Wire to siteConfig |
| `src/pages/index.astro` L18 | Description: `"Portfolio of Patryk Golabek, Cloud-Native..."` | YES | Wire to siteConfig |
| `src/pages/index.astro` L25 | `Patryk Golabek` (h1) | YES | Wire to siteConfig.name |
| `src/pages/index.astro` L28 | `Cloud-Native Architect` (typing default) | YES | Wire to siteConfig.roles[0] |
| `src/pages/index.astro` L31 | Tagline paragraph | YES | Wire to siteConfig.tagline |
| `src/pages/index.astro` L192 | roles array in script | YES | Wire via define:vars |
| `src/components/PersonJsonLd.astro` L5 | `"name": "Patryk Golabek"` | YES | Wire to siteConfig |
| `src/components/PersonJsonLd.astro` L7 | `"jobTitle": "Cloud-Native..."` | YES | Wire to siteConfig |
| `src/components/PersonJsonLd.astro` L8 | `"description": "Cloud-Native..."` | YES | Wire to siteConfig |
| `src/layouts/Layout.astro` L21 | Default description | NO | Not in Phase 8 scope |
| `src/components/SEOHead.astro` L35 | `og:site_name` | NO | Not in Phase 8 scope |
| `src/components/BlogPostingJsonLd.astro` L24,29 | Author name | NO | Not in Phase 8 scope |
| `src/pages/llms.txt.ts` L11,13 | Name and bio | NO | Not in Phase 8 scope |
| `src/components/Footer.astro` L13 | Copyright name | NO | Not in Phase 8 scope |
| `src/pages/about.astro` various | Name, title, description | NO | Not in Phase 8 scope |
| Other pages | Various title/description | NO | Not in Phase 8 scope |

## Open Questions

1. **Should `source` use `z.enum()` or `z.string()`?**
   - What we know: Phase 9 will create external blog entries with sources "Kubert AI" and "Translucent Computing". These are the only two known sources.
   - What's unclear: Whether future milestones might add more sources (dev.to, Medium, etc.).
   - Recommendation: Use `z.enum(['Kubert AI', 'Translucent Computing'])` for type safety now. Easy to extend the enum later by adding values. This prevents typos in frontmatter during Phase 9.

2. **How should the home page title be constructed from siteConfig?**
   - What we know: Current title is `"Patryk Golabek -- Cloud-Native Architect & AI/ML Engineer"`. This is `name + roles[0] + roles[2]`.
   - What's unclear: Whether Phase 11 will change the title format when roles are updated.
   - Recommendation: Construct from config values using a computed string: `` `${siteConfig.name} \u2014 ${siteConfig.roles[0]} & ${siteConfig.roles[2]}` ``. This keeps the current title exactly the same while making it data-driven. Phase 11 can adjust the construction logic when it updates roles.

3. **Should `define:vars` or a data attribute pass roles to the typing script?**
   - What we know: `define:vars` serializes variables as JSON literals into the script tag. Data attributes would put the array on a DOM element and parse it.
   - What's unclear: Whether `define:vars` works correctly with `as const` readonly arrays.
   - Recommendation: Use `define:vars`. It handles array serialization natively and is the Astro-recommended pattern. The `as const` assertion exists only at the TypeScript level and does not affect the serialized runtime value.

## Sources

### Primary (HIGH confidence)
- [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) - Optional fields, Zod schema patterns, glob loader
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) - defineCollection, schema validation
- [Astro Zod API Reference](https://docs.astro.build/en/reference/modules/astro-zod/) - z.string().url().optional(), z.enum()
- [Schema.org Person Type](https://schema.org/Person) - JSON-LD properties: name, jobTitle, description, url, sameAs

### Secondary (MEDIUM confidence)
- [JSON-LD Person Example](https://jsonld.com/person/) - Practical Person schema example
- [Google Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) - Must match visible page content

### Codebase (HIGH confidence - direct inspection)
- `src/content.config.ts` - Current blog schema (6 fields, Zod + glob loader)
- `src/pages/index.astro` - Current hardcoded hero values (title L17, description L18, name L25, roles L192)
- `src/components/PersonJsonLd.astro` - Current hardcoded Person JSON-LD
- `src/data/` - Existing data directory with `projects.ts` and `blog/` (establishes pattern for `site.ts`)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, only Astro built-in Zod features
- Architecture: HIGH - Pattern follows existing `src/data/projects.ts` convention and Astro community norms
- Pitfalls: HIGH - Verified through direct codebase inspection and official docs
- Schema extension: HIGH - Confirmed backward compatibility of `.optional()` fields via Astro docs

**Research date:** 2026-02-11
**Valid until:** 2026-04-11 (stable domain -- Astro 5 APIs are stable, schema.org rarely changes)
