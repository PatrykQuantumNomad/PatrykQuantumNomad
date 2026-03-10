# Stack Research: Claude Code Guide Content Features

**Domain:** Multi-chapter technical guide (10-12 chapters) on Claude Code for an existing Astro 5 portfolio site, requiring build-time SVG architecture diagrams, interactive React components, and code snippets
**Researched:** 2026-03-10
**Confidence:** HIGH

## Verdict: One Infrastructure Change, Zero New npm Dependencies

The Claude Code Guide requires **no new npm packages**. Every content feature maps to an existing pattern in the codebase. The only structural change is generalizing the content collection system from single-guide to multi-guide support.

### What's Reusable As-Is

| Existing Asset | Location | Reuse for Claude Code Guide |
|---------------|----------|----------------------------|
| GuideLayout.astro | `src/layouts/GuideLayout.astro` | Direct reuse. Sticky sidebar, breadcrumbs, prev/next nav all work for any guide. Remove the hardcoded FastAPI companion blog link (make it a prop or slot). |
| CodeFromRepo.astro | `src/components/guide/CodeFromRepo.astro` | Direct reuse. The `templateRepo` and `versionTag` props already support arbitrary repos. Point to a Claude Code config repo or use inline code only. |
| diagram-base.ts | `src/lib/guides/svg-diagrams/diagram-base.ts` | Direct reuse. `diagramSvgOpen`, `roundedRect`, `arrowLine`, `arrowMarkerDef`, `textLabel` are generic SVG primitives. |
| PlotFigure.astro | `src/components/eda/PlotFigure.astro` | Direct reuse. SVG + caption wrapper, theme-aware background. |
| og-cache.ts | `src/lib/guides/og-cache.ts` | Direct reuse. Hash-based OG image caching is guide-agnostic. |
| guide schema | `src/lib/guides/schema.ts` | Direct reuse. `guidePageSchema` and `guideMetaSchema` are not FastAPI-specific. |
| @xyflow/react + dagre | Already installed (v12.10.1 + v2.0.4) | Reuse for interactive diagrams (permission flow explorer, hook event visualizer). Pattern proven in DeploymentTopology.tsx. |
| astro-expressive-code | Already installed (v0.41.6) | Direct reuse. Handles TOML, JSON, YAML, Bash, TypeScript, JavaScript syntax highlighting. All languages needed for Claude Code config examples. |
| ec.config.mjs | `ec.config.mjs` | No changes needed. `github-dark` theme works for Claude Code config snippets. |

### What's Genuinely New (But Uses Existing Patterns)

| New Component | Pattern Source | What's New |
|--------------|---------------|------------|
| 3 build-time SVG diagram generators | `middleware-stack.ts`, `jwt-auth-flow.ts`, `builder-pattern.ts` | New diagram logic for agentic loop, hook lifecycle, MCP architecture. Same `diagram-base.ts` primitives. |
| 3 Astro wrapper components for diagrams | `MiddlewareStackDiagram.astro`, etc. | Thin wrappers calling generators and rendering via PlotFigure. Identical pattern. |
| Permission Flow Explorer (React) | `DeploymentTopology.tsx` | New interactive React Flow component. Nodes = tools/permissions, edges = allow/deny/escalate paths. Uses same dagre layout pattern. |
| Hook Event Visualizer (React) | `DeploymentTopology.tsx` | New interactive React Flow component. Nodes = lifecycle events, edges = execution flow. Same pattern but more nodes. |
| Multi-guide content collection | `content.config.ts` | Widen glob from `fastapi-production/pages` to `*/pages`. Add `guideId` to page schema. |
| Guide route pages | `src/pages/guides/fastapi-production/[slug].astro` | New route directory at `src/pages/guides/claude-code/`. Follows same structure. |
| OG image route | `src/pages/open-graph/guides/fastapi-production/[slug].png.ts` | New route at `src/pages/open-graph/guides/claude-code/[slug].png.ts`. Same pattern. |
| guide.json | `src/data/guides/fastapi-production/guide.json` | New guide metadata at `src/data/guides/claude-code/guide.json`. Same schema. |

## Recommended Stack

### Core Technologies (Already Installed -- No Changes)

| Technology | Installed Version | Purpose | Status |
|------------|------------------|---------|--------|
| Astro | 5.17.1 | Static site generator, MDX rendering, content collections | Current. No update needed. |
| @astrojs/mdx | 4.3.13 | MDX support for guide chapter pages | Current. No update needed. |
| @astrojs/react | 4.4.2 | React island hydration for interactive components | Current. No update needed. |
| React | 19.2.4 | Interactive diagram components (permission explorer, hook visualizer) | Current. No update needed. |
| TypeScript | 5.9.3 | Type safety for diagram generators, schemas, components | Current. No update needed. |
| Tailwind CSS | 3.4.19 | Styling for guide layout and components | Current. No update needed. |
| @tailwindcss/typography | 0.5.19 | Prose styling for chapter content | Current. No update needed. |
| astro-expressive-code | 0.41.6 | Syntax highlighting for code blocks | Current. Supports all needed languages (JSON, TOML, YAML, Bash, TypeScript, JavaScript). |
| @xyflow/react | 12.10.1 | Interactive node-graph diagrams | Current. Latest in v12 line. |
| @dagrejs/dagre | 2.0.4 | Automatic graph layout for React Flow diagrams | Current. No update needed. |
| satori + sharp | 0.19.2 + 0.34.5 | OG image generation | Current. No update needed. |
| Zod (via astro:content) | Built into Astro 5 | Content collection schema validation | Built-in. No separate install. |

### Supporting Libraries (Already Installed -- No Changes)

| Library | Version | Purpose | Used For |
|---------|---------|---------|----------|
| nanostores + @nanostores/react | 1.1.0 + 1.0.0 | Client state management | NOT needed for guide components. Interactive diagrams use local React state (same as DeploymentTopology). Only use if adding cross-component state (unlikely). |
| gsap | 3.14.2 | Animations | NOT needed for guide diagrams. SVG diagrams use CSS animations (`:hover`, `stroke-dashoffset`). GSAP is for hero/landing page animations only. |

### Build-Time SVG Diagram Generators (New Files, Existing Pattern)

These are TypeScript functions that return SVG strings at build time. Zero client-side JavaScript.

| Diagram | File | Complexity | Description |
|---------|------|-----------|-------------|
| Agentic Loop | `src/lib/guides/svg-diagrams/claude-code/agentic-loop.ts` | Medium | Cyclic flow: Prompt -> Gather Context -> Take Action -> Verify Results -> (loop or complete). Similar complexity to `jwt-auth-flow.ts` (branching paths). |
| Hook Lifecycle | `src/lib/guides/svg-diagrams/claude-code/hook-lifecycle.ts` | Medium-High | Vertical flow: SessionStart -> UserPromptSubmit -> PreToolUse -> PostToolUse -> Stop -> SessionEnd, with branch-off events (SubagentStart/Stop, Notification, etc). Most complex SVG of the three. |
| MCP Architecture | `src/lib/guides/svg-diagrams/claude-code/mcp-architecture.ts` | Medium | Three-column layout: Claude Code (client) <-> MCP Protocol <-> MCP Servers (filesystem, GitHub, databases). Similar to builder-pattern.ts (multi-box with connections). |

All three import from the existing `diagram-base.ts` and use `DIAGRAM_PALETTE` CSS variables for dark/light theme support.

### Interactive React Components (New Files, Existing Pattern)

These are React components using @xyflow/react, loaded with `client:visible` for lazy hydration.

| Component | File | Node Count | Description |
|-----------|------|-----------|-------------|
| Permission Flow Explorer | `src/components/guide/claude-code/PermissionFlowExplorer.tsx` | ~8-10 | Interactive flowchart showing tool request -> PreToolUse hook -> permission check -> allow/deny/escalate decision tree. Users click nodes to see JSON payloads. |
| Hook Event Visualizer | `src/components/guide/claude-code/HookEventVisualizer.tsx` | ~12-15 | Interactive timeline/graph of all 17 hook events. Click an event to see its matcher patterns, input schema, and example hook config. |

Both follow the `DeploymentTopology.tsx` pattern exactly:
- Define nodes and edges as static data
- Use dagre for automatic layout
- Export a default function component
- Use `client:visible` in MDX for lazy loading

### Content Infrastructure Changes

#### 1. Multi-Guide Content Collection (Required)

The current `content.config.ts` hardcodes `fastapi-production`:

```typescript
// CURRENT (single guide)
const guidePages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/guides/fastapi-production/pages' }),
  schema: guidePageSchema,
});
const guides = defineCollection({
  loader: file('src/data/guides/fastapi-production/guide.json'),
  schema: guideMetaSchema,
});
```

Change to support any guide:

```typescript
// NEW (multi-guide)
const guidePages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/guides' }),
  schema: guidePageSchema,
});
const guides = defineCollection({
  loader: glob({ pattern: '**/guide.json', base: './src/data/guides' }),
  schema: guideMetaSchema,
});
```

**Schema change needed:** Add `guideId` to `guidePageSchema` so pages can be filtered per guide:

```typescript
export const guidePageSchema = z.object({
  title: z.string(),
  description: z.string(),
  order: z.number().int().min(0),
  slug: z.string(),
  guideId: z.string(),  // NEW: "fastapi-production" or "claude-code"
});
```

This requires adding `guideId` to every existing FastAPI page's frontmatter and all new Claude Code page frontmatter. The `[slug].astro` route filters by `guideId` when calling `getCollection('guidePages')`.

#### 2. GuideLayout Companion Link (Minor Refactor)

The current GuideLayout has a hardcoded FastAPI companion blog link:

```html
<aside class="mt-10 pt-6 border-t border-[var(--color-border)]">
  <p class="text-sm text-[var(--color-text-secondary)]">
    For a high-level overview of all 13 production concerns, read the companion blog post:
    <a href="/blog/fastapi-production-guide/">...</a>
  </p>
</aside>
```

Refactor to accept via props or slot:

```typescript
interface Props {
  // ... existing props
  companionLink?: { href: string; text: string };
}
```

#### 3. astro.config.mjs Sitemap (Minor Update)

The `buildContentDateMap()` function hardcodes `fastapi-production`. Generalize to scan all `src/data/guides/*/guide.json` files.

### Code Snippet Languages

astro-expressive-code (via Shiki) already supports all languages needed for the Claude Code Guide:

| Language | File Extension | Used For |
|----------|---------------|----------|
| `json` | `.json` | Claude Code settings, hooks config, MCP config |
| `jsonc` | `.jsonc` | Settings files with comments |
| `toml` | `.toml` | CLAUDE.md frontmatter blocks (if any) |
| `yaml` | `.yaml` | GitHub Actions CI config examples |
| `bash` / `shell` | `.sh` | Hook scripts, CLI commands |
| `typescript` | `.ts` | Hook handlers in TypeScript |
| `javascript` | `.js` | Hook handlers in JavaScript |
| `markdown` | `.md` | CLAUDE.md content examples |
| `python` | `.py` | Example hook scripts |

No new Shiki grammars or expressive-code plugins are needed.

## Installation

```bash
# No new packages to install.
# The Claude Code Guide uses only existing dependencies.
```

## Alternatives Considered

| Category | Decision | Alternative | Why Not |
|----------|----------|-------------|---------|
| SVG diagrams | Build-time TypeScript generators | Mermaid.js | Already rejected for FastAPI guide. Adds ~2.8MB bundle or Playwright headless browser for build-time rendering. Site has zero Mermaid usage. See STACK-fastapi-guide.md for full analysis. |
| SVG diagrams | Build-time TypeScript generators | D3.js force layout | Overkill for static architecture diagrams. D3 force layout is for data-driven visualizations (already used in EDA section), not hand-crafted labeled box-and-arrow diagrams. |
| Interactive diagrams | @xyflow/react + dagre | Mermaid interactive mode | Mermaid click callbacks require `securityLevel: 'loose'` (XSS risk) and can't do hover-to-reveal detail panels. |
| Interactive diagrams | @xyflow/react + dagre | vis.js / cytoscape.js | Would introduce a new graph library when React Flow is already installed, proven, and has the exact node/edge customization we need. |
| Interactive diagrams | @xyflow/react + dagre | Pure SVG with JavaScript event handlers | Possible but recreates what React Flow already provides (pan, zoom, drag, custom nodes). Not worth the effort. |
| Content collections | Widen glob pattern | Separate collection per guide | Separate collections (`claudeCodeGuidePages`, `fastApiGuidePages`) would bloat `content.config.ts` and not scale. A single `guidePages` collection with `guideId` filter is cleaner. |
| State management | Local React state (useState) | Nanostores | Interactive guide diagrams are self-contained islands. No cross-component state needed. Using nanostores would add unnecessary coupling. |
| Syntax highlighting | astro-expressive-code (existing) | Prism.js or highlight.js | Expressive code is already configured, integrated with Astro MDX, and handles all needed languages. Switching would break all existing code blocks site-wide. |

## What NOT to Add

| Avoid | Why | What to Do Instead |
|-------|-----|-------------------|
| **Mermaid.js** (`mermaid`, `@mermaid-js/tiny`, `rehype-mermaid`) | 2.8MB client bundle or Playwright build dependency. Already rejected for FastAPI guide. | Build-time SVG generators using `diagram-base.ts` |
| **New syntax highlighting library** (Prism, highlight.js, shiki standalone) | astro-expressive-code already handles everything. Adding another creates conflicting styles. | Use existing `astro-expressive-code` and `CodeFromRepo` |
| **Framer Motion** | Interactive diagrams use React Flow (which handles its own animations). Page animations use GSAP. Adding a third animation library fragments the approach. | CSS transitions on SVG elements, React Flow built-in transitions |
| **MDX plugins for diagrams** (remark-mermaid, rehype-diagrams) | These are Mermaid wrappers with the same problems. | Import diagram Astro components directly in MDX |
| **Headless CMS** (Contentful, Sanity, Strapi) | Content is MDX files in the repo. Astro content collections with Zod validation already provide type-safe content management. Adding a CMS adds deployment complexity and network dependencies for zero benefit. | Astro content collections with MDX |
| **@codemirror packages for guide content** | CodeMirror is used in the validator tools for live editing. Guide code snippets are read-only and should use expressive-code's static rendering. | astro-expressive-code `<Code>` component |
| **New React Flow node packages** (@xyflow/react already includes everything) | Custom nodes are simple React components. No need for pre-built node libraries. | Custom `TopologyNode`-style components |
| **GSAP for diagram animations** | GSAP is ~30KB and designed for complex timeline animations. SVG hover effects and `stroke-dashoffset` flow animations are pure CSS. | CSS animations and transitions on SVG elements |

## Stack Patterns by Variant

**If the diagram is static (no user interaction beyond hover):**
- Use build-time SVG generator (TypeScript function returning SVG string)
- Wrap in Astro component that calls generator at build time
- Render via `PlotFigure.astro`
- Add CSS hover effects if needed (zero client JS)
- Examples: Agentic loop, hook lifecycle overview, MCP architecture

**If the diagram needs pan/zoom/click interaction:**
- Use @xyflow/react with dagre layout
- Create a React component with static node/edge data
- Load with `client:visible` in MDX for lazy hydration
- Examples: Permission flow explorer, hook event visualizer

**If showing a code snippet from a repo:**
- Use `CodeFromRepo.astro` with custom `templateRepo` and `versionTag`
- Example: Hook script from a Claude Code configuration repo

**If showing inline code examples:**
- Use astro-expressive-code fenced code blocks in MDX (triple backtick with language)
- No component import needed -- MDX handles this natively via the expressive-code integration

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| astro@5.17.1 | @astrojs/mdx@4.3.13, @astrojs/react@4.4.2 | All Astro packages are on compatible v5 versions. |
| react@19.2.4 | @xyflow/react@12.10.1, @nanostores/react@1.0.0 | React 19 is supported by React Flow v12. |
| astro-expressive-code@0.41.6 | astro@5.17.1 | Expressive Code 0.41.x supports Astro 5. |
| @xyflow/react@12.10.1 | @dagrejs/dagre@2.0.4 | Used together in DeploymentTopology.tsx, proven compatible. |

## File Structure for New Guide

```
src/
  data/
    guides/
      claude-code/
        guide.json                    # Guide metadata (chapters, slug, dates)
        pages/
          introduction.mdx            # Chapter 1
          agentic-loop.mdx            # Chapter 2
          tools-and-capabilities.mdx  # Chapter 3
          permissions.mdx             # Chapter 4
          claude-md.mdx               # Chapter 5
          hooks.mdx                   # Chapter 6
          mcp.mdx                     # Chapter 7
          skills.mdx                  # Chapter 8
          subagents.mdx               # Chapter 9
          workflows.mdx               # Chapter 10
          ci-cd.mdx                   # Chapter 11
          conclusion.mdx              # Chapter 12
  lib/
    guides/
      svg-diagrams/
        claude-code/                  # NEW subdirectory
          agentic-loop.ts             # Agentic loop SVG generator
          hook-lifecycle.ts           # Hook lifecycle SVG generator
          mcp-architecture.ts         # MCP architecture SVG generator
          index.ts                    # Barrel export
  components/
    guide/
      claude-code/                    # NEW subdirectory
        AgenticLoopDiagram.astro      # Build-time SVG wrapper
        HookLifecycleDiagram.astro    # Build-time SVG wrapper
        McpArchitectureDiagram.astro  # Build-time SVG wrapper
        PermissionFlowExplorer.tsx    # Interactive React Flow component
        HookEventVisualizer.tsx       # Interactive React Flow component
  pages/
    guides/
      claude-code/
        index.astro                   # Guide landing page
        [slug].astro                  # Chapter page route
        faq.astro                     # FAQ page (optional)
    open-graph/
      guides/
        claude-code/
          [slug].png.ts               # OG image generation
```

## Migration Checklist

These changes touch existing files (not just new files):

1. **`src/content.config.ts`** -- Widen `guidePages` glob to `./src/data/guides/*/pages` or `./src/data/guides` recursive. Switch `guides` loader from `file()` to `glob()` for `**/guide.json`.
2. **`src/lib/guides/schema.ts`** -- Add `guideId: z.string()` to `guidePageSchema`.
3. **`src/data/guides/fastapi-production/pages/*.mdx`** -- Add `guideId: "fastapi-production"` to all 14 existing page frontmatters.
4. **`src/data/guides/fastapi-production/guide.json`** -- Potentially restructure if switching from `file()` loader to `glob()` loader (the file currently wraps data in an array `[{...}]`; a glob loader may expect a single object).
5. **`src/layouts/GuideLayout.astro`** -- Extract hardcoded FastAPI companion blog link into a prop or optional slot.
6. **`src/pages/guides/fastapi-production/[slug].astro`** -- Filter `getCollection('guidePages')` by `guideId === 'fastapi-production'`.
7. **`astro.config.mjs`** -- Generalize `buildContentDateMap()` to scan all `src/data/guides/*/guide.json` files instead of hardcoded path.
8. **`src/lib/guides/svg-diagrams/index.ts`** -- Add exports for new Claude Code diagram generators.

## Sources

- Astro 5 content collections: Verified against installed astro@5.17.1 and existing `content.config.ts` patterns
- @xyflow/react v12.10.1: Verified installed version matches latest on [npm](https://www.npmjs.com/package/@xyflow/react)
- astro-expressive-code v0.41.6: Verified installed version, language support confirmed via [expressive-code.com](https://expressive-code.com/)
- Claude Code hooks reference: [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) -- 17 lifecycle events documented
- Claude Code architecture: [code.claude.com/docs/en/how-claude-code-works](https://code.claude.com/docs/en/how-claude-code-works) -- Agentic loop, tools, permissions documented
- Existing codebase patterns: `diagram-base.ts`, `DeploymentTopology.tsx`, `GuideLayout.astro`, `CodeFromRepo.astro`, `content.config.ts`, `og-cache.ts` -- all read and verified
- Previous research: `.planning/research/STACK-fastapi-guide.md` -- Mermaid rejection rationale still applies

---
*Stack research for: Claude Code Guide content features*
*Researched: 2026-03-10*
