# Phase 85: Foundation and Content Schema - Research

**Researched:** 2026-03-08
**Domain:** Astro 5 Content Collections (MDX + JSON), Zod schema validation, static page generation
**Confidence:** HIGH

## Summary

Phase 85 establishes the content foundation for the FastAPI Production Guide. The project already uses Astro 5.17.1 with the Content Layer API (`content.config.ts`, `glob()`, `file()` loaders, Zod schemas). The existing EDA Visual Encyclopedia (`edaPages` collection) is a nearly identical pattern to what the guide needs: MDX content with Zod-validated frontmatter, rendered via `getStaticPaths`. The `dbModels` collection demonstrates the exact JSON `file()` loader pattern needed for guide metadata.

This phase requires two collections (MDX for guide pages, JSON for guide metadata), one dynamic route (`/guides/fastapi-production/[slug]/`), and a stub MDX file that proves the pipeline works end-to-end. The technical risk is low because every pattern needed already exists in the codebase. The main design decisions are schema field choices and file organization.

**Primary recommendation:** Follow the established `edaPages` + `dbModels` patterns exactly -- glob loader for MDX pages, file loader for JSON metadata, Zod schemas in a dedicated `src/lib/guides/schema.ts`, and a `[slug].astro` page at `src/pages/guides/fastapi-production/[slug].astro`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-07 | Zod-validated content collection for guide pages (MDX) and guide metadata (JSON) | Astro 5 Content Layer API with `glob()` for MDX and `file()` for JSON; Zod schemas validated at build time; existing `edaPages` and `dbModels` patterns in codebase provide exact templates |
| INFRA-08 | Page generation via getStaticPaths for `/guides/fastapi-production/[slug]/` | `getStaticPaths` + `getCollection` + `render()` pattern used in 6+ existing page files; `[slug].astro` with trailing slash enforced by `astro.config.mjs` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 | Static site framework with Content Layer API | Already installed; provides `defineCollection`, `glob`, `file`, `getCollection`, `render` |
| @astrojs/mdx | 4.3.13 | MDX support for content collections | Already installed; enables MDX in glob loader |
| zod (via astro/zod) | bundled | Schema validation for frontmatter and metadata | Already used in all existing collections; imported as `z` from `astro/zod` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro-expressive-code | 0.41.6 | Code block syntax highlighting | Already configured; MDX code fences auto-highlight via `github-dark` theme |
| typescript | 5.9.3 | Type safety and schema inference | Already configured; `z.infer<>` for TypeScript types from Zod schemas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `file()` loader for guide.json | `glob()` for YAML metadata | `file()` is simpler for single-file JSON; matches existing `dbModels` pattern |
| Flat MDX in data dir | Nested MDX in subdirectories | Flat is simpler for this guide; nested only needed if multiple guides share a collection |
| `[...slug].astro` (rest param) | `[slug].astro` (single param) | Single param is correct here -- guide page slugs are flat (no nested paths) |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── content.config.ts                          # ADD: guidePages + guides collections
├── data/
│   └── guides/
│       └── fastapi-production/
│           ├── guide.json                     # Guide-level metadata (JSON collection)
│           └── pages/
│               └── 00-builder-pattern.mdx     # Stub MDX chapter (and future chapters)
├── lib/
│   └── guides/
│       └── schema.ts                          # Zod schemas + TS types
└── pages/
    └── guides/
        └── fastapi-production/
            └── [slug].astro                   # Dynamic page (getStaticPaths)
```

### Pattern 1: MDX Content Collection with Glob Loader
**What:** Define an MDX content collection using `glob()` that loads guide chapter pages with Zod-validated frontmatter.
**When to use:** For the `guidePages` collection -- each MDX file is a chapter of the guide.
**Example:**
```typescript
// src/content.config.ts
// Source: verified against existing edaPages collection in this codebase
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { guidePageSchema, guideMetaSchema } from './lib/guides/schema';

const guidePages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/guides/fastapi-production/pages' }),
  schema: guidePageSchema,
});

const guides = defineCollection({
  loader: file('src/data/guides/fastapi-production/guide.json'),
  schema: guideMetaSchema,
});

// Add to existing exports
export const collections = { blog, languages, dbModels, edaTechniques, edaDistributions, edaPages, guidePages, guides };
```

### Pattern 2: Zod Schema with Inferred Types
**What:** Define Zod schemas in a separate file and export both schemas and inferred TypeScript types.
**When to use:** For all collection schemas -- keeps `content.config.ts` clean and enables reuse.
**Example:**
```typescript
// src/lib/guides/schema.ts
// Source: follows existing pattern from src/lib/eda/schema.ts and src/lib/db-compass/schema.ts
import { z } from 'astro/zod';

/** Zod schema for guide chapter MDX frontmatter */
export const guidePageSchema = z.object({
  title: z.string(),
  description: z.string(),
  order: z.number().int().min(0),
  slug: z.string(),
});

/** Zod schema for guide-level metadata (loaded from guide.json) */
export const guideMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  templateRepo: z.string().url(),
  versionTag: z.string(),
  chapters: z.array(z.object({
    slug: z.string(),
    title: z.string(),
  })),
});

/** TypeScript type inferred from the guide page schema */
export type GuidePage = z.infer<typeof guidePageSchema>;

/** TypeScript type inferred from the guide metadata schema */
export type GuideMeta = z.infer<typeof guideMetaSchema>;
```

### Pattern 3: getStaticPaths with Content Collection
**What:** Use `getStaticPaths` to generate a static page for each MDX entry in the collection.
**When to use:** For the `[slug].astro` page that renders each guide chapter.
**Example:**
```typescript
// src/pages/guides/fastapi-production/[slug].astro
// Source: follows existing pattern from src/pages/eda/foundations/[...slug].astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';

export async function getStaticPaths() {
  const pages = await getCollection('guidePages');
  return pages.map((page) => ({
    params: { slug: page.data.slug },
    props: { page },
  }));
}

const { page } = Astro.props;
const { Content, headings } = await render(page);
---

<Layout
  title={`${page.data.title} | FastAPI Production Guide`}
  description={page.data.description}
>
  <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <h1 class="text-3xl sm:text-4xl font-heading font-bold mb-4">{page.data.title}</h1>
    <div class="prose max-w-none">
      <Content />
    </div>
  </article>
</Layout>
```

### Pattern 4: JSON Collection with file() Loader
**What:** Load guide-level metadata from a single JSON file using the `file()` loader.
**When to use:** For the `guides` collection -- stores chapter ordering, template repo URL, version tag.
**Example:**
```json
// src/data/guides/fastapi-production/guide.json
// Source: follows existing pattern from src/data/db-compass/models.json
[
  {
    "id": "fastapi-production",
    "title": "FastAPI Production Guide",
    "description": "A deep-dive into production concerns handled by the FastAPI template",
    "slug": "fastapi-production",
    "templateRepo": "https://github.com/Translucent-Computing/fastapi-template",
    "versionTag": "v1.0.0",
    "chapters": [
      { "slug": "builder-pattern", "title": "Builder Pattern" },
      { "slug": "authentication", "title": "Authentication" },
      { "slug": "middleware", "title": "Middleware" }
    ]
  }
]
```

**Critical note:** The `file()` loader expects a JSON array of objects where each object has a unique `id` field. This matches the existing `models.json` and `languages.json` patterns.

### Anti-Patterns to Avoid
- **Hardcoding chapter order in the page file:** Use the `order` field in MDX frontmatter or the `chapters` array in `guide.json` -- never hardcode ordering logic in `[slug].astro`.
- **Putting schema definitions in content.config.ts:** Keep schemas in `src/lib/guides/schema.ts` to match the established pattern (`src/lib/eda/schema.ts`, `src/lib/db-compass/schema.ts`).
- **Using `[...slug].astro` for flat slugs:** Guide chapter slugs are single-segment (e.g., `builder-pattern`, not `guides/fastapi/builder-pattern`). Use `[slug].astro`, not `[...slug].astro`.
- **Importing from `zod` directly:** Always import from `astro/zod` to use Astro's bundled Zod version. Every existing schema in this project uses `import { z } from 'astro/zod'`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter validation | Custom validation logic | Zod schemas via `defineCollection` | Astro validates at build time with clear error messages; catches schema drift early |
| Static route generation | Manual file reading + path mapping | `getStaticPaths` + `getCollection` | Built-in, type-safe, handles incremental rebuilds |
| MDX rendering to HTML | Custom MDX compiler pipeline | `render()` from `astro:content` | Returns `Content` component, `headings`, and `remarkPluginFrontmatter` automatically |
| Chapter ordering | Filesystem sort or custom sorting | `order` field in Zod schema + `Array.sort()` | Explicit ordering is more maintainable than filename-based conventions |
| Code syntax highlighting | Custom Prism/Shiki setup | `astro-expressive-code` (already configured) | Already integrated with `github-dark` theme; MDX code fences just work |

**Key insight:** Astro's Content Layer API handles the entire pipeline from file loading to Zod validation to HTML rendering. The only custom code needed is the schema definition and the page template.

## Common Pitfalls

### Pitfall 1: Missing `id` field in JSON collection
**What goes wrong:** The `file()` loader for JSON expects each object in the array to have a unique `id` property. Without it, Astro throws a build error.
**Why it happens:** The `file()` loader uses `id` as the entry identifier (unlike `glob()` which generates IDs from filenames).
**How to avoid:** Always include an `id` field in the Zod schema for JSON collections and in the JSON data itself. The existing `dbModelSchema` and `languageSchema` both include `id: z.string()`.
**Warning signs:** Build error mentioning "missing id" or "duplicate id" in collection entries.

### Pitfall 2: Slug mismatch between frontmatter and filename
**What goes wrong:** The `glob()` loader generates entry IDs from filenames. If your frontmatter `slug` field differs from the filename, `getStaticPaths` may generate URLs that don't match expectations.
**Why it happens:** Two sources of truth for the slug: filename and frontmatter.
**How to avoid:** Use the frontmatter `slug` field as the canonical source in `getStaticPaths` (map `params: { slug: page.data.slug }`). The filename can use an order prefix (e.g., `00-builder-pattern.mdx`) for filesystem sorting while the frontmatter slug stays clean (e.g., `slug: builder-pattern`).
**Warning signs:** 404 errors on guide pages, or URLs containing the order prefix.

### Pitfall 3: Forgetting to export new collections
**What goes wrong:** Adding `defineCollection` calls without adding them to `export const collections = { ... }` means Astro won't load the collection.
**Why it happens:** Easy to define the collection variable but forget to add it to the exports object.
**How to avoid:** Always add new collection names to the `export const collections` object in `content.config.ts`. Astro won't warn about unused defineCollection calls.
**Warning signs:** `getCollection('guidePages')` returns an empty array at build time.

### Pitfall 4: Trailing slash configuration
**What goes wrong:** The site uses `trailingSlash: 'always'` in `astro.config.mjs`. If links are built without trailing slashes, Astro generates redirect pages instead of direct routes.
**Why it happens:** Forgetting the project's trailing slash configuration when constructing URLs.
**How to avoid:** Always construct URLs with trailing slashes: `/guides/fastapi-production/builder-pattern/` not `/guides/fastapi-production/builder-pattern`.
**Warning signs:** Unexpected HTML redirect files in the build output, or 301 redirects during preview.

### Pitfall 5: Using wrong Zod import
**What goes wrong:** Importing `z` from `'zod'` instead of `'astro/zod'` causes version mismatches since Astro bundles its own Zod.
**Why it happens:** IDE autocomplete may suggest the wrong import.
**How to avoid:** Always use `import { z } from 'astro/zod'`. Grep the existing schemas to confirm -- all 3 schema files in this project use `astro/zod`.
**Warning signs:** TypeScript errors about incompatible Zod types, or runtime schema validation failures.

## Code Examples

Verified patterns from the existing codebase:

### Defining an MDX Collection (from existing edaPages)
```typescript
// Source: src/content.config.ts (lines 42-51)
const edaPages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/eda/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.string(),
    category: z.enum(['foundations', 'case-studies', 'reference']),
    nistSection: z.string(),
  }),
});
```

### Defining a JSON Collection (from existing dbModels)
```typescript
// Source: src/content.config.ts (lines 27-30)
const dbModels = defineCollection({
  loader: file('src/data/db-compass/models.json'),
  schema: dbModelSchema,
});
```

### getStaticPaths with Collection (from existing EDA foundations)
```typescript
// Source: src/pages/eda/foundations/[...slug].astro (lines 8-16)
export async function getStaticPaths() {
  const pages = await getCollection('edaPages');
  const foundations = pages.filter((p) => p.data.category === 'foundations');

  return foundations.map((page) => ({
    params: { slug: page.id.replace('foundations/', '') },
    props: { page },
  }));
}
```

### Rendering MDX Content (from existing blog)
```typescript
// Source: src/pages/blog/[slug].astro (lines 22-23)
const { Content, headings, remarkPluginFrontmatter } = await render(post);
```

### MDX Frontmatter Example (from existing EDA)
```yaml
# Source: src/data/eda/pages/case-studies/ceramic-strength.mdx (lines 1-7)
---
title: "Ceramic Strength Case Study"
description: "EDA case study analyzing NIST JAHANMI2.DAT ceramic strength data..."
section: "1.4.2"
category: "case-studies"
nistSection: "1.4.2.10 Ceramic Strength"
---
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` with type-based collections | `src/content.config.ts` with loader-based collections | Astro 5.0 (Dec 2024) | This project already uses the new API |
| `getCollection` returned `body` string | `render()` is a separate function | Astro 5.0 (Dec 2024) | Already adopted in codebase |
| `type: 'content'` / `type: 'data'` | `loader: glob()` / `loader: file()` | Astro 5.0 (Dec 2024) | Already adopted in codebase |

**Deprecated/outdated:**
- `src/content/config.ts` (old path): Astro 5 moved to `src/content.config.ts` -- this project already uses the new path
- `type: 'content'` / `type: 'data'`: Replaced by `loader: glob()` / `loader: file()` in Astro 5 -- this project already uses loaders

## Open Questions

1. **Header navigation for "Guides" link**
   - What we know: The header currently has 9 nav items (Home, Blog, Beauty Index, DB Compass, EDA, Tools, Projects, About, Contact). Adding "Guides" would make 10 items.
   - What's unclear: Whether 10 items is too many for the desktop nav (currently using `gap-6` between items). The prior decision note says "decide during Phase 85 planning whether to add 'Guides' link or group under existing category."
   - Recommendation: This is a Phase 89 concern (SITE-01). For Phase 85, no header changes needed. The planner should note this as out-of-scope for this phase.

2. **Guide metadata: single JSON entry vs. multiple**
   - What we know: The `file()` loader expects a JSON array. For now there is only one guide (fastapi-production). The schema should accommodate future guides.
   - What's unclear: Whether a single-entry array in guide.json is the right approach, or whether each guide should have its own JSON file.
   - Recommendation: Use a single JSON file per guide (`guide.json` inside each guide's directory). The `file()` loader works with single-entry arrays. The `chapters` array inside the JSON object provides chapter ordering. This is extensible -- future guides get their own `guide.json` loaded by a separate `file()` call or a glob-based approach.

3. **Chapter slug source: frontmatter vs. filename**
   - What we know: The `glob()` loader generates entry IDs from filenames (e.g., `00-builder-pattern` from `00-builder-pattern.mdx`). The roadmap specifies a `slug` field in frontmatter.
   - What's unclear: Whether to use the file-generated ID or the frontmatter slug for URL generation.
   - Recommendation: Use the frontmatter `slug` field (e.g., `builder-pattern`) for URL generation in `getStaticPaths`. Prefix filenames with order numbers (e.g., `00-`, `01-`) for filesystem sorting, but never expose these prefixes in URLs. This matches the roadmap's success criteria which specifies `slug` as a frontmatter field.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (includes `src/**/*.test.ts`) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-07 | Zod schema validates correct frontmatter and rejects invalid | unit | `npx vitest run src/lib/guides/__tests__/schema.test.ts` | -- Wave 0 |
| INFRA-07 | Zod schema for guide metadata validates correct JSON and rejects invalid | unit | `npx vitest run src/lib/guides/__tests__/schema.test.ts` | -- Wave 0 |
| INFRA-08 | Build succeeds with stub MDX through full pipeline (collection -> page -> HTML) | smoke | `npx astro build 2>&1 \| tail -5` | -- Wave 0 (build smoke test) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/guides/__tests__/schema.test.ts`
- **Per wave merge:** `npx vitest run --reporter=verbose && npx astro build`
- **Phase gate:** Full vitest suite green + `astro build` success before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/guides/__tests__/schema.test.ts` -- covers INFRA-07 (schema validation for both guidePageSchema and guideMetaSchema)
- [ ] Build smoke test via `npx astro build` -- covers INFRA-08 (full pipeline validation)

## Sources

### Primary (HIGH confidence)
- Existing codebase `src/content.config.ts` -- verified current Astro 5 Content Layer API usage with `glob()`, `file()`, Zod schemas
- Existing codebase `src/pages/eda/foundations/[...slug].astro` -- verified `getStaticPaths` + `getCollection` + `render()` pattern
- Existing codebase `src/lib/eda/schema.ts` and `src/lib/db-compass/schema.ts` -- verified Zod schema patterns with `astro/zod`
- Existing codebase `src/data/db-compass/models.json` -- verified JSON `file()` loader data structure with `id` field
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- verified `glob()`, `file()`, schema, `getStaticPaths` patterns
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- verified `getCollection`, `render`, `defineCollection` signatures

### Secondary (MEDIUM confidence)
- [Astro Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/) -- loader configuration details

### Tertiary (LOW confidence)
- None -- all findings verified against codebase and official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use; Astro 5.17.1 verified
- Architecture: HIGH - patterns directly copied from 3 existing collections in same codebase
- Pitfalls: HIGH - derived from observed codebase patterns and Astro 5 official docs

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (30 days -- Astro stable, patterns well-established in codebase)
