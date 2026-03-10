# Phase 90: Infrastructure Refactoring - Research

**Researched:** 2026-03-10
**Domain:** Astro 5 multi-guide content collection system, guide routing, schema extension, CodeBlock component
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Guide landing page:**
- Numbered card grid layout (2-3 columns) showing all 11 chapters
- Flat grid with no tier grouping -- chapter numbers imply progression
- Above the grid: guide title, subtitle, 2-3 sentence description, and a prerequisites/audience box (e.g., "For developers familiar with CLI tools")
- Shared base layout across all guides, but each guide gets a unique accent color for visual identity

**Chapter page layout:**
- Sidebar shows full chapter list (all 11 chapters) with current chapter highlighted, always visible on desktop
- No separate on-page table of contents -- two-column layout only (sidebar + content)
- Prev + Next navigation cards at the bottom of each chapter showing neighboring chapter titles
- Three-level breadcrumbs: Guides / Claude Code / [Chapter Title]

**CodeBlock component:**
- Filename tab-style header showing the file path (mimics editor tab, subtle background)
- Copy-to-clipboard button always visible (top-right corner)
- Optional caption field below the code block for brief explanations
- No GitHub source link (confirmed in requirements)

**Guide metadata & identity:**
- Guide slug: `/guides/claude-code/` (short, clean, matches product name)
- Chapter slugs: topic-based without numbers (e.g., `/guides/claude-code/context-management/`)
- Per-guide accent color stored in metadata -- Claude Code guide uses a distinct color from FastAPI
- Estimated reading time per chapter displayed on landing page cards and chapter pages

### Claude's Discretion

- Line highlighting support -- Claude decides whether to include based on content chapter needs
- Syntax highlighting theme choice -- match existing site theme
- Exact card component sizing, spacing, and responsive breakpoints
- Sidebar collapse behavior on mobile
- Loading/skeleton states for guide pages

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Multi-guide content collection system supporting multiple guides without hardcoded single-guide assumptions | 7 hardcoded locations identified in codebase audit; per-guide collection pattern validated; detailed refactoring plan for each location |
| INFRA-02 | Guide page schema extended with `lastVerified` date field for content freshness tracking | Schema extension pattern documented; existing `guidePageSchema` in schema.ts is the target file |
| INFRA-03 | Claude Code guide.json metadata with 11 chapters, requirements, and guide-level configuration | `guideMetaSchema` already supports all needed fields; new fields for accent color and reading time needed |
| INFRA-04 | Guide landing page at /guides/claude-code/ with chapter card grid and AI agent narrative hero | FastAPI landing page pattern documented; card grid, prerequisites box, and accent color approach researched |
| INFRA-05 | Dynamic chapter routing at /guides/claude-code/[slug] for all 11 chapters | Per-guide page directory pattern established; separate `[slug].astro` template per guide is the correct Astro pattern |
| INFRA-06 | Existing FastAPI guide renders identically after all infrastructure changes (regression gate) | All 7 modification points documented with backward-compatible approaches; regression verification checklist provided |
| INFRA-07 | CodeBlock component for inline code snippets without GitHub source attribution | Component design documented; wraps astro-expressive-code with file-path header, copy button, and optional caption |

</phase_requirements>

## Summary

Phase 90 transforms the existing single-guide codebase into a multi-guide content collection system. The current FastAPI Production Guide infrastructure (shipped in v1.15) has 7 hardcoded `fastapi-production` references in content collections, sitemap builder, LLMs.txt endpoints, the hub page, and OG image generators. These must be refactored to support the Claude Code guide without breaking existing functionality.

The refactoring is surgical: the shared guide components (GuideSidebar, GuideBreadcrumb, GuideChapterNav, GuideLayout) are already parameterized via props and need minimal changes. The per-guide content collections approach (separate `claudeCodePages` and `claudeCodeGuide` collections) follows the established codebase convention where each content domain has its own collection (EDA has `edaPages`/`edaTechniques`/`edaDistributions`, Beauty Index has `languages`, DB Compass has `dbModels`). The GuideJsonLd component needs its hardcoded `isPartOf` URL parameterized. The GuideLayout companion blog link needs to become prop-driven. A new CodeBlock component provides inline code blocks without GitHub source attribution.

Additionally, the guide schema needs extension: `lastVerified` date field for content freshness tracking, and the `guideMetaSchema` needs an `accentColor` field so each guide can have visual identity stored in metadata rather than hardcoded in templates.

**Primary recommendation:** Use per-guide content collections (not a shared multi-directory glob) with separate page template directories per guide. Modify 6 existing files surgically, create the CodeBlock component, scaffold the Claude Code guide data and pages with stub content, and verify FastAPI regression after every change.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.3+ | Static site framework, content collections, file/glob loaders | Already in use; content collections with Zod validation are the foundation |
| astro-expressive-code | 0.41+ | Syntax highlighting with copy button, line highlighting | Already in use via `Code` component; CodeBlock wraps this |
| Zod (via astro/zod) | Built-in | Schema validation for guide frontmatter and metadata | Already in use for all content collections |
| TypeScript | 5.9+ | Type safety throughout | Already in use |
| Tailwind CSS | 3.4+ | Utility-first styling | Already in use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Satori + Sharp | 0.19+ / 0.34+ | Build-time OG image generation | For landing page and chapter OG images |
| reading-time | 1.5+ | Word count and reading time estimation | Already configured as remark plugin; injects `minutesRead` into all MDX frontmatter |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-guide collections in content.config.ts | Single multi-directory glob collection | Multi-directory glob would require filtering by guide slug at query time; per-collection is simpler, type-safe, and matches existing EDA/Beauty Index patterns |
| Per-guide page directories (src/pages/guides/claude-code/) | Nested dynamic route [guide]/[slug].astro | Astro's typed `getCollection()` does not support runtime collection switching; per-directory is explicit and matches existing pattern |
| New CodeBlock component | Reusing CodeFromRepo without source link | CodeFromRepo renders a "View source" link that would lead nowhere; dedicated component is cleaner |

**Installation:**
```bash
# No new dependencies needed -- all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure (New/Modified Files)

```
src/
+-- content.config.ts                          # MODIFY: add 2 collections, extend schemas
+-- data/
|   +-- guides/
|       +-- claude-code/                       # NEW directory
|           +-- guide.json                     # Guide metadata (11 chapters, accent color)
|           +-- pages/                         # NEW directory
|               +-- introduction.mdx           # Stub chapter for pipeline validation
+-- pages/
|   +-- guides/
|   |   +-- index.astro                        # MODIFY: multi-guide listing
|   |   +-- claude-code/                       # NEW directory
|   |       +-- index.astro                    # Landing page with card grid
|   |       +-- [slug].astro                   # Chapter pages via GuideLayout
|   +-- open-graph/
|       +-- guides/
|           +-- claude-code.png.ts             # NEW: landing OG image
|           +-- claude-code/
|               +-- [slug].png.ts             # NEW: chapter OG images
+-- components/
|   +-- guide/
|       +-- CodeBlock.astro                    # NEW: inline code without source link
|       +-- GuideJsonLd.astro                  # MODIFY: parameterize isPartOf
+-- layouts/
|   +-- GuideLayout.astro                      # MODIFY: configurable companion link
+-- lib/
    +-- guides/
        +-- schema.ts                          # MODIFY: add lastVerified, accentColor
        +-- routes.ts                          # MODIFY: remove GUIDE_ROUTES.landing
+-- astro.config.mjs                           # MODIFY: iterate all guide.json for sitemap
+-- pages/llms.txt.ts                          # MODIFY: iterate all guides
+-- pages/llms-full.txt.ts                     # MODIFY: iterate all guides
```

### Pattern 1: Per-Guide Content Collections

**What:** Each guide gets its own pair of Astro content collections -- one `file()` collection for guide.json metadata, one `glob()` collection for MDX chapter pages. Both use the same Zod schemas.

**When to use:** Every new guide added to the site.

**Example:**
```typescript
// Source: direct codebase analysis of src/content.config.ts
const claudeCodePages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/guides/claude-code/pages' }),
  schema: guidePageSchema,
});

const claudeCodeGuide = defineCollection({
  loader: file('src/data/guides/claude-code/guide.json'),
  schema: guideMetaSchema,
});

export const collections = {
  // ... existing ...
  guidePages, guides,               // FastAPI (keep existing names)
  claudeCodePages, claudeCodeGuide, // Claude Code (new)
};
```

### Pattern 2: CodeBlock Component (No Source Link)

**What:** Astro component wrapping `astro-expressive-code`'s `Code` component with a file-path tab header, copy-to-clipboard button, and optional caption. No GitHub source link.

**When to use:** All inline code examples in the Claude Code guide.

**Example:**
```astro
---
// Source: derived from existing CodeFromRepo.astro pattern
import { Code } from 'astro-expressive-code/components';

interface Props {
  code: string;
  lang: string;
  title?: string;
  caption?: string;
}

const { code, lang, title, caption } = Astro.props;
---
<div class="my-6 not-prose">
  {title && (
    <div class="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-alt)] border border-b-0 border-[var(--color-border)] rounded-t-lg text-sm">
      <span class="font-mono text-[var(--color-text-secondary)] truncate">{title}</span>
    </div>
  )}
  <div class:list={[title && '[&_.expressive-code]:!rounded-t-none [&_.expressive-code]:!mt-0 [&_.expressive-code]:!border-t-0']}>
    <Code code={code} lang={lang} title={title} />
  </div>
  {caption && (
    <p class="text-xs text-[var(--color-text-secondary)] mt-2 italic">{caption}</p>
  )}
</div>
```

### Pattern 3: GuideLayout Companion Link via Props

**What:** The hardcoded FastAPI companion blog link in GuideLayout becomes prop-driven so each guide can optionally pass its own companion link or omit it entirely.

**When to use:** When modifying GuideLayout for multi-guide support.

**Example:**
```astro
---
// Source: existing src/layouts/GuideLayout.astro modification
interface Props {
  // ... existing props ...
  companionLink?: { href: string; text: string; label: string };
}
---
{Astro.props.companionLink && (
  <aside class="mt-10 pt-6 border-t border-[var(--color-border)]">
    <p class="text-sm text-[var(--color-text-secondary)]">
      {Astro.props.companionLink.label}
      <a href={Astro.props.companionLink.href} class="text-[var(--color-accent)] hover:underline font-medium">
        {Astro.props.companionLink.text}
      </a>
    </p>
  </aside>
)}
```

FastAPI's `[slug].astro` passes the companion link; Claude Code's omits it initially (blog post comes in Phase 95).

### Pattern 4: Multi-Guide Hub Page

**What:** The `/guides/` hub page fetches all guide metadata collections and renders a card per guide with per-guide branding (accent color, description, chapter count).

**When to use:** For the `/guides/index.astro` refactor.

**Example:**
```astro
---
// Source: existing src/pages/guides/index.astro refactored
import { getCollection } from 'astro:content';

const [fastapiMeta] = await getCollection('guides');
const [claudeCodeMeta] = await getCollection('claudeCodeGuide');

const allGuides = [
  { meta: fastapiMeta, logo: fastapiLogo, gradient: 'from-[#009485]/8 to-[#009485]/3' },
  { meta: claudeCodeMeta, logo: null, gradient: 'from-[#D97706]/8 to-[#D97706]/3' },
];
---
<div class="mt-12 grid grid-cols-1 gap-6">
  {allGuides.map(({ meta, gradient }) => (
    <a href={guideLandingUrl(meta.data.slug)} class="block card-hover ...">
      <!-- card content with dynamic gradient and metadata -->
    </a>
  ))}
</div>
```

### Pattern 5: Sitemap Builder Multi-Guide Iteration

**What:** The `buildContentDateMap()` in `astro.config.mjs` dynamically finds and reads all `src/data/guides/*/guide.json` files instead of hardcoding the FastAPI path.

**When to use:** When modifying `astro.config.mjs` for multi-guide sitemap support.

**Example:**
```javascript
// Source: existing astro.config.mjs refactored
import { readdirSync, readFileSync } from 'node:fs';

function buildContentDateMap() {
  const map = new Map();
  // ... blog dates (unchanged) ...

  // Guide pages: iterate all guide directories
  try {
    const guidesDir = './src/data/guides';
    for (const guideDir of readdirSync(guidesDir, { withFileTypes: true })) {
      if (!guideDir.isDirectory()) continue;
      const jsonPath = `${guidesDir}/${guideDir.name}/guide.json`;
      try {
        const meta = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        const guideDate = meta[0]?.publishedDate;
        const guideSlug = meta[0]?.slug;
        if (guideDate && guideSlug) {
          const iso = new Date(guideDate).toISOString();
          map.set(`${SITE}/guides/${guideSlug}/`, iso);
          for (const ch of meta[0].chapters ?? []) {
            map.set(`${SITE}/guides/${guideSlug}/${ch.slug}/`, iso);
          }
        }
      } catch { /* non-fatal -- guide.json may not exist yet */ }
    }
  } catch { /* non-fatal */ }

  return map;
}
```

### Anti-Patterns to Avoid

- **Nested dynamic `[guide]/[slug].astro` routes:** Astro content collections are defined per-collection; runtime collection switching is not type-safe. Use per-guide page directories.
- **Extending guideMetaSchema with guide-specific fields:** Keep the schema generic. Guide-specific narrative content belongs in the landing page component, not the schema.
- **Using CodeFromRepo without a source repository:** The component renders a "View source" link that would lead nowhere. Use CodeBlock instead.
- **Hardcoding per-guide colors in page templates:** Store accent colors in guide.json metadata so new guides can define their identity without template changes.
- **Merging all guide MDX into one glob collection:** Creates ambiguous slugs (two guides could have `introduction.mdx`). Per-guide collections keep content isolated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting with copy button | Custom code block with Prism/Shiki | `astro-expressive-code` `Code` component | Already configured, handles copy button, line highlighting, themes; 0.41+ is stable |
| Reading time calculation | Manual word count | `reading-time` remark plugin (already installed) | Injects `minutesRead` into all MDX frontmatter automatically |
| OG image generation | Custom image rendering | `satori` + `sharp` with existing `og-cache.ts` | Content-hash caching prevents build regression; pattern proven across 810+ images |
| URL building for guides | Template literals in components | `guidePageUrl()` and `guideLandingUrl()` from `routes.ts` | Single source of truth; already used across sidebar, breadcrumbs, nav, landing pages |
| Schema validation | Manual frontmatter checks | Zod schemas via Astro content collections | Build fails on invalid frontmatter; type inference flows to components |

**Key insight:** The entire guide infrastructure (layouts, components, OG images, routes, schemas) was built in v1.15 for the FastAPI guide. Phase 90 is refactoring, not building from scratch. The work is making 6-7 existing files generic and adding parallel structures for Claude Code.

## Common Pitfalls

### Pitfall 1: Silent Collection Registration Failure

**What goes wrong:** Adding new content collections to `content.config.ts` but misspelling the collection name or forgetting to add it to the `collections` export causes the collection to be silently ignored. `getCollection('claudeCodePages')` returns an empty array instead of throwing.

**Why it happens:** Astro content collections are registered by name in the export object. If the name does not match, Astro treats it as an unknown collection and returns empty results.

**How to avoid:** After adding collections, immediately run `astro build` and verify the collection is populated. Add a type check: `const pages = await getCollection('claudeCodePages'); if (pages.length === 0) throw new Error('claudeCodePages collection is empty');` in development.

**Warning signs:** Landing page shows zero chapters. `[slug].astro` generates no static paths.

### Pitfall 2: FastAPI Guide Breaking During Refactoring

**What goes wrong:** Modifying shared files (GuideLayout, GuideJsonLd, routes.ts, content.config.ts) introduces regressions in the FastAPI guide. A missing prop default or changed interface breaks FastAPI pages.

**Why it happens:** Six shared files need modification. Each modification must be backward-compatible with the existing FastAPI `[slug].astro` template that passes specific props.

**How to avoid:** Make every modification additive with defaults. New props are optional with default values matching current FastAPI behavior. Run `astro build` after each shared file change and verify FastAPI pages still generate. Click through `/guides/fastapi-production/nfr-introduction/` to verify rendering.

**Warning signs:** Build warnings about missing props. FastAPI pages render with missing companion link. Breadcrumbs show wrong guide title.

### Pitfall 3: Accent Color Not Flowing to Components

**What goes wrong:** Storing accent color in `guide.json` metadata but not propagating it through to the landing page gradient, chapter card borders, hub page card styling, and OG images. Some components use the color, others fall back to the default accent.

**Why it happens:** The accent color needs to flow from guide.json through content collection query through page template through component props. Any break in this chain causes inconsistency.

**How to avoid:** Define a clear prop chain: `guide.json.accentColor` -> page template reads via collection -> passes as prop to components that need per-guide color. For the landing page and hub page, use the accent color for gradients and borders. For chapter pages, the existing `--color-accent` CSS variable may be sufficient if it does not need per-guide override.

**Warning signs:** Claude Code guide card on hub page has FastAPI teal gradient. Landing page uses wrong colors.

### Pitfall 4: LLMs.txt Endpoint Only Rendering One Guide

**What goes wrong:** Refactoring `llms.txt.ts` and `llms-full.txt.ts` to iterate over guides but forgetting to query the new `claudeCodePages` collection for chapter listings. The Claude Code section appears in LLMs.txt but with zero chapters listed.

**Why it happens:** The guide metadata collection tells you the guide exists, but the chapter pages are in a separate collection. Both must be queried.

**How to avoid:** In llms.txt, query both `guidePages` (FastAPI) and `claudeCodePages` (Claude Code) and render sections for each. Map each guide's metadata to its corresponding pages collection.

**Warning signs:** `/llms.txt` output has "Claude Code Guide" header but no chapter list below it.

### Pitfall 5: astro.config.mjs readFileSync Breaking on Missing guide.json

**What goes wrong:** Refactoring the sitemap builder to iterate `src/data/guides/*/guide.json` but the Claude Code `guide.json` is created with stub data that fails JSON parsing, or the file does not exist yet when the build runs.

**Why it happens:** `buildContentDateMap()` runs at config load time (before collections are resolved). It uses raw `readFileSync`, not Astro collections. A malformed or missing file crashes the entire build.

**How to avoid:** Wrap each guide.json read in its own try/catch (the existing FastAPI read already has one). The refactored loop should silently skip guides whose JSON fails to parse.

**Warning signs:** Build fails with "SyntaxError: Unexpected end of JSON input" or "ENOENT: no such file".

### Pitfall 6: OG Image Route Missing getStaticPaths

**What goes wrong:** Creating `src/pages/open-graph/guides/claude-code/[slug].png.ts` but forgetting to implement `getStaticPaths()` that queries the `claudeCodePages` collection. The build either fails or generates zero images.

**Why it happens:** Copy-pasting the FastAPI OG route but not updating the collection name from `guidePages` to `claudeCodePages`.

**How to avoid:** Every `[slug]` route in the Claude Code directory must query `claudeCodePages`, not `guidePages`. Search for `getCollection('guidePages')` in new Claude Code files -- it should never appear.

**Warning signs:** Build output shows 0 OG images for Claude Code. Chapter pages have broken OG image URLs.

## Code Examples

Verified patterns from the existing codebase:

### Schema Extension for lastVerified and accentColor

```typescript
// Source: existing src/lib/guides/schema.ts -- proposed modifications
import { z } from 'astro/zod';

export const guidePageSchema = z.object({
  title: z.string(),
  description: z.string(),
  order: z.number().int().min(0),
  slug: z.string(),
  lastVerified: z.coerce.date().optional(), // NEW: content freshness
});

export const guideMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  accentColor: z.string().optional(),       // NEW: per-guide visual identity
  templateRepo: z.string().url().optional(), // CHANGED: optional (Claude Code has no template repo)
  versionTag: z.string().optional(),         // CHANGED: optional
  publishedDate: z.coerce.date().optional(),
  requirements: z.record(z.string(), z.string()).optional(),
  chapters: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string().optional(),  // NEW: for landing page card descriptions
    }),
  ),
});
```

**Note:** `templateRepo` changes from required `.url()` to optional `.url().optional()` because the Claude Code guide has no template repository. The existing FastAPI guide.json already provides a value, so this is backward-compatible.

### Claude Code guide.json Structure

```json
[
  {
    "id": "claude-code",
    "title": "Claude Code Guide",
    "description": "The definitive zero-to-hero guide for Claude Code -- from first agentic interaction through multi-agent orchestration, by a cloud-native architect with 17+ years of experience.",
    "slug": "claude-code",
    "accentColor": "#D97706",
    "publishedDate": "2026-03-15",
    "requirements": {
      "claude-code": "latest",
      "node": "18+"
    },
    "chapters": [
      { "slug": "introduction", "title": "Introduction & Getting Started", "description": "The agentic loop, installation across all interfaces, core tools, and your first checkpoint" },
      { "slug": "context-management", "title": "Project Context & Memory", "description": "CLAUDE.md hierarchy, auto-memory, context rot prevention, and .claudeignore" },
      { "slug": "models-and-costs", "title": "Models, Cost Economics & Permissions", "description": "Model selection, effort levels, pricing tiers, and the permission system" },
      { "slug": "environment", "title": "Environment Sandboxing & Customization", "description": "Configuration scopes, sandboxed execution, and status line customization" },
      { "slug": "remote-and-headless", "title": "Remote Control & Headless Automation", "description": "Remote control, headless mode, cron scheduling, and HTTP proxy configuration" },
      { "slug": "mcp", "title": "Model Context Protocol", "description": "Connecting external tools, transport modes, tool search, and troubleshooting" },
      { "slug": "custom-skills", "title": "Custom Skills", "description": "SKILL.md anatomy, slash commands vs auto-invocation, and the skill creator" },
      { "slug": "hooks", "title": "Hooks & Lifecycle Automation", "description": "Lifecycle events, exit codes, and prompt/agent hooks" },
      { "slug": "worktrees", "title": "Git Worktrees & Subagent Delegation", "description": "Parallel development branches and custom agent personas" },
      { "slug": "agent-teams", "title": "Agent Teams & Advanced Orchestration", "description": "Team architecture, shared tasks, and dependency tracking (research preview)" },
      { "slug": "security", "title": "Security & Enterprise Administration", "description": "Vulnerability scanning, managed settings, and plugin governance" }
    ]
  }
]
```

### Reading Time Display on Chapter Pages

```astro
---
// Source: existing remark-reading-time.mjs injects minutesRead into frontmatter
// Access in [slug].astro via the rendered page's remarkPluginFrontmatter
const { page, guideMeta } = Astro.props;
const { Content, remarkPluginFrontmatter } = await render(page);
const readingTime = remarkPluginFrontmatter?.minutesRead;
---

<GuideLayout ...>
  <article>
    <h1>{page.data.title}</h1>
    {readingTime && (
      <p class="text-sm text-[var(--color-text-secondary)] mt-2 font-mono">
        {readingTime}
      </p>
    )}
    <Content />
  </article>
</GuideLayout>
```

### Copy-to-Clipboard in CodeBlock

```astro
---
// Source: pattern derived from astro-expressive-code built-in copy behavior
// astro-expressive-code already provides a copy button on code blocks
// The CodeBlock component wraps this; the copy button comes from expressive-code config
// No additional JS is needed -- expressive-code handles clipboard interaction
---
```

**Note:** The `astro-expressive-code` library already renders a copy-to-clipboard button on every `<Code>` block. The CodeBlock component does NOT need to implement its own copy button. The locked decision "Copy-to-clipboard button always visible (top-right corner)" is satisfied by the existing expressive-code behavior.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `file()` loader per guide | Per-guide `file()` loaders with shared schema | v1.16 Phase 90 | Enables multiple guides without schema changes |
| `[guideMeta]` array destructure | Iterate all guide collections | v1.16 Phase 90 | Hub page, LLMs.txt show all guides |
| `templateRepo` required in schema | `templateRepo` optional | v1.16 Phase 90 | Guides without template repos (like Claude Code) are valid |
| Companion link hardcoded in GuideLayout | Prop-driven optional companion link | v1.16 Phase 90 | Each guide controls its own companion link |
| `GUIDE_ROUTES.landing` constant | Removed; use `guideLandingUrl(slug)` | v1.16 Phase 90 | No hardcoded guide paths in routes module |

**Deprecated/outdated:**
- `GUIDE_ROUTES.landing` constant: Remove in this phase. The `guideLandingUrl()` function already handles all guides dynamically and is used everywhere except the test file.

## The 7 Hardcoded Single-Guide Locations

These are the specific locations that must be refactored for INFRA-01. Each one is documented with the exact file, line, current state, and required change.

| # | File | What's Hardcoded | Required Change |
|---|------|-----------------|-----------------|
| 1 | `src/content.config.ts` L55 | `guidePages` glob base: `'./src/data/guides/fastapi-production/pages'` | Add new `claudeCodePages` collection with Claude Code path |
| 2 | `src/content.config.ts` L60 | `guides` file loader: `'src/data/guides/fastapi-production/guide.json'` | Add new `claudeCodeGuide` collection with Claude Code path |
| 3 | `astro.config.mjs` L48 | `readFileSync('./src/data/guides/fastapi-production/guide.json')` in sitemap builder | Iterate `src/data/guides/*/guide.json` dynamically |
| 4 | `src/pages/guides/index.astro` L13 | `const [guideMeta] = await getCollection('guides')` takes only first guide | Fetch both guide collections, render a card per guide |
| 5 | `src/pages/llms.txt.ts` L15 | `const [guideMeta] = await getCollection('guides')` takes only first guide | Iterate all guides with their respective page collections |
| 6 | `src/pages/llms-full.txt.ts` L42 | `const [guideMeta] = await getCollection('guides')` takes only first guide | Iterate all guides with their respective page collections |
| 7 | `src/components/guide/GuideJsonLd.astro` L57 | `isPartOf.name` hardcodes "FastAPI Production Guide" and URL | Accept `parentTitle` and `parentUrl` props with FastAPI defaults |

**Additional modifications (not hardcoded but need updating):**
- `src/layouts/GuideLayout.astro` L47-53: Hardcoded companion blog link to FastAPI post -> make prop-driven
- `src/lib/guides/routes.ts` L11: `GUIDE_ROUTES.landing` hardcodes `/guides/fastapi-production/` -> remove constant
- `src/lib/guides/schema.ts`: Add `lastVerified`, `accentColor`, make `templateRepo` optional
- `astro.config.mjs` L54: Hardcoded `/guides/fastapi-production/faq/` in sitemap dates -> dynamically handle FAQ pages per guide

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0+ |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Multi-guide content collections load both guides | smoke | `npx astro build 2>&1 \| grep -c "guides"` | No - Wave 0 |
| INFRA-02 | `lastVerified` field accepted in guidePageSchema | unit | `npx vitest run src/lib/guides/__tests__/schema.test.ts -x` | Yes - extend |
| INFRA-03 | Claude Code guide.json validates against guideMetaSchema | unit | `npx vitest run src/lib/guides/__tests__/schema.test.ts -x` | Yes - extend |
| INFRA-04 | Claude Code landing page renders with chapter cards | smoke | `npx astro build && test -f dist/guides/claude-code/index.html` | No - manual |
| INFRA-05 | Claude Code chapter pages generate for all slugs | smoke | `npx astro build && ls dist/guides/claude-code/*/index.html \| wc -l` | No - manual |
| INFRA-06 | FastAPI guide pages unchanged after refactoring | smoke | `npx astro build && diff <(ls dist/guides/fastapi-production/) <(echo expected)` | No - manual |
| INFRA-07 | CodeBlock renders code with file header, no source link | manual-only | Visual inspection in dev server | No - manual-only |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose` (runs in <5 seconds)
- **Per wave merge:** `npx astro build` (full production build verifies all pages generate)
- **Phase gate:** Full build succeeds with zero errors; both guides appear in build output

### Wave 0 Gaps

- [ ] `src/lib/guides/__tests__/schema.test.ts` -- extend with `lastVerified` field tests, optional `templateRepo` tests, `accentColor` tests
- [ ] `src/lib/guides/__tests__/routes.test.ts` -- remove `GUIDE_ROUTES.landing` test after constant removal

## Open Questions

1. **Accent color for Claude Code guide**
   - What we know: FastAPI uses teal (#009485). User locked decision says "distinct color from FastAPI."
   - What's unclear: Exact hex value for Claude Code guide. Amber (#D97706) is a reasonable choice that complements teal and evokes the Anthropic brand warmth.
   - Recommendation: Use `#D97706` (amber/warm) for Claude Code. Store in guide.json `accentColor` field. Easy to change later without code modifications.

2. **FAQ page for Claude Code guide**
   - What we know: FastAPI has a dedicated FAQ page at `/guides/fastapi-production/faq.astro`. The Claude Code guide phase description does not mention FAQ.
   - What's unclear: Whether a Claude Code FAQ is needed in Phase 90.
   - Recommendation: Do NOT create a Claude Code FAQ in Phase 90 (it is infrastructure-only, no content). FAQ can be added in content phases if needed.

3. **How to handle `templateRepo` for Claude Code guide**
   - What we know: The Claude Code guide has no template repository. The `guideMetaSchema` currently requires `templateRepo` as `.url()`.
   - What's unclear: Whether to make it optional or provide the official Anthropic docs URL.
   - Recommendation: Make `templateRepo` and `versionTag` both optional in the schema. Claude Code's guide.json omits them. The landing page conditionally renders the template repo section only if present.

4. **Chapter descriptions in guide.json vs hardcoded in landing page**
   - What we know: FastAPI guide hardcodes `chapterDescriptions` as a const in the landing page template. The guidePageSchema already has a `description` field in each MDX frontmatter.
   - What's unclear: Whether to put short descriptions in guide.json chapters or continue the hardcoded pattern.
   - Recommendation: Add optional `description` to the chapter entries in guide.json (already shown in schema extension above). This makes descriptions available to the landing page without hardcoding and to LLMs.txt for discoverability. Fix the FastAPI pattern in a future pass.

## Sources

### Primary (HIGH confidence -- direct codebase analysis)

- `src/content.config.ts` -- Content collection definitions, Zod schema imports, loader patterns
- `src/lib/guides/schema.ts` -- `guidePageSchema` and `guideMetaSchema` Zod definitions
- `src/lib/guides/routes.ts` -- URL builder functions and `GUIDE_ROUTES` constant
- `src/layouts/GuideLayout.astro` -- Two-column layout with hardcoded companion link
- `src/components/guide/GuideJsonLd.astro` -- JSON-LD with hardcoded `isPartOf`
- `src/components/guide/CodeFromRepo.astro` -- Code block pattern with source attribution
- `src/components/guide/GuideSidebar.astro` -- Already parameterized sidebar
- `src/components/guide/GuideBreadcrumb.astro` -- Already parameterized breadcrumbs
- `src/components/guide/GuideChapterNav.astro` -- Already parameterized prev/next nav
- `src/data/guides/fastapi-production/guide.json` -- Guide metadata structure
- `src/pages/guides/fastapi-production/index.astro` -- Landing page with card grid
- `src/pages/guides/fastapi-production/[slug].astro` -- Chapter page template
- `src/pages/guides/index.astro` -- Hub page with single-guide assumption
- `src/pages/llms.txt.ts` -- LLMs.txt with single-guide destructure
- `src/pages/llms-full.txt.ts` -- LLMs-full.txt with single-guide destructure
- `src/pages/open-graph/guides/fastapi-production.png.ts` -- OG image endpoint pattern
- `astro.config.mjs` -- Sitemap builder with hardcoded guide path
- `vitest.config.ts` -- Test configuration
- `package.json` -- Dependencies and scripts
- `.planning/research/PITFALLS.md` -- 7 hardcoded locations analysis (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` -- Full architecture analysis with data flow diagrams

### Secondary (MEDIUM confidence -- existing project research)

- `.planning/research/PITFALLS.md` -- Detailed analysis of 7 pitfalls with recovery strategies
- `.planning/research/ARCHITECTURE.md` -- Component responsibilities, data flow, build order
- `.planning/PROJECT.md` -- Full project context with 773 delivered requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries; all existing tools verified in codebase
- Architecture: HIGH -- directly inspected every file that needs modification
- Pitfalls: HIGH -- 7 hardcoded locations verified by grep and manual code reading
- Schema extension: HIGH -- Zod schema modifications are straightforward additive changes
- CodeBlock component: HIGH -- pattern directly derived from existing CodeFromRepo.astro

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable infrastructure; Astro 5 content collections API is mature)
