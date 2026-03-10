# Architecture Research: Claude Code Guide Integration

**Domain:** Multi-chapter Claude Code guide within existing Astro 5 portfolio guide architecture
**Researched:** 2026-03-10
**Confidence:** HIGH

The existing FastAPI Production Guide established a clean, well-factored guide architecture. The Claude Code guide should follow the same patterns with surgical extensions where new capabilities are needed. This document maps every integration point, identifies what is new vs modified, and provides a dependency-aware build order.

## System Overview

```
PatrykQuantumNomad Portfolio Site (Astro 5, static output)
+--------------------------------------------------------------------------+
|                          Content Layer                                    |
|                                                                          |
|  src/data/guides/                                                        |
|  +-- fastapi-production/              (EXISTING - unchanged)             |
|  |   +-- guide.json                                                      |
|  |   +-- pages/*.mdx                                                     |
|  +-- claude-code/                     (NEW)                              |
|      +-- guide.json                   <- guide metadata + chapters       |
|      +-- pages/*.mdx                  <- 10-12 chapter MDX files         |
|                                                                          |
|  src/content.config.ts                (MODIFIED - add 2 collections)     |
+--------------------------------------------------------------------------+
|                       Page Generation Layer                               |
|                                                                          |
|  src/pages/guides/                                                       |
|  +-- index.astro                      (MODIFIED - multi-guide hub)       |
|  +-- fastapi-production/              (EXISTING - unchanged)             |
|  |   +-- index.astro                                                     |
|  |   +-- [slug].astro                                                    |
|  |   +-- faq.astro                                                       |
|  +-- claude-code/                     (NEW)                              |
|      +-- index.astro                  <- landing page with chapter grid  |
|      +-- [slug].astro                 <- chapter rendering via MDX       |
|      +-- faq.astro                    <- optional FAQ page               |
+--------------------------------------------------------------------------+
|                       Component Layer                                     |
|                                                                          |
|  src/components/guide/                (EXTENDED)                         |
|  +-- GuideSidebar.astro               (EXISTING - reused as-is)         |
|  +-- GuideBreadcrumb.astro            (EXISTING - reused as-is)         |
|  +-- GuideChapterNav.astro            (EXISTING - reused as-is)         |
|  +-- GuideJsonLd.astro                (MODIFIED - parameterize guide)   |
|  +-- CodeFromRepo.astro               (EXISTING - reused as-is)         |
|  +-- CodeBlock.astro                  (NEW - inline code snippets)      |
|  +-- AgenticLoopDiagram.astro         (NEW - SVG wrapper)               |
|  +-- HookLifecycleDiagram.astro       (NEW - SVG wrapper)               |
|  +-- PermissionModelDiagram.astro     (NEW - SVG wrapper)               |
|  +-- McpArchitectureDiagram.astro     (NEW - SVG wrapper)               |
|  +-- AgentTeamsDiagram.astro          (NEW - SVG wrapper)               |
|  +-- PermissionFlowExplorer.tsx       (NEW - React interactive)         |
|  +-- HookEventVisualizer.tsx          (NEW - React interactive)         |
+--------------------------------------------------------------------------+
|                       Library Layer                                       |
|                                                                          |
|  src/lib/guides/                                                         |
|  +-- schema.ts                        (EXISTING - reused as-is)         |
|  +-- routes.ts                        (MODIFIED - remove hardcoded)     |
|  +-- code-helpers.ts                  (EXISTING - reused as-is)         |
|  +-- og-cache.ts                      (EXISTING - reused as-is)         |
|  +-- svg-diagrams/                                                       |
|      +-- diagram-base.ts             (EXISTING - reused as-is)          |
|      +-- index.ts                    (MODIFIED - add new exports)        |
|      +-- agentic-loop.ts            (NEW)                               |
|      +-- hook-lifecycle.ts           (NEW)                               |
|      +-- permission-model.ts         (NEW)                               |
|      +-- mcp-architecture.ts         (NEW)                               |
|      +-- agent-teams.ts             (NEW)                                |
+--------------------------------------------------------------------------+
|                        OG Image Layer                                     |
|                                                                          |
|  src/pages/open-graph/guides/                                            |
|  +-- fastapi-production.png.ts        (EXISTING - unchanged)            |
|  +-- fastapi-production/[slug].png.ts (EXISTING - unchanged)            |
|  +-- claude-code.png.ts              (NEW - landing OG)                  |
|  +-- claude-code/[slug].png.ts       (NEW - chapter OG)                  |
+--------------------------------------------------------------------------+
|                        Layout Layer                                       |
|                                                                          |
|  src/layouts/                                                            |
|  +-- GuideLayout.astro                (MODIFIED - remove companion link) |
+--------------------------------------------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | Status | Notes |
|-----------|---------------|--------|-------|
| `guide.json` (per guide) | Guide metadata, chapter list, requirements | NEW data file | Follows exact same schema as FastAPI guide |
| `content.config.ts` | Registers Astro content collections for MDX pages and guide metadata | MODIFIED | Add `claudeCodeGuidePages` and `claudeCodeGuides` collections |
| `GuideLayout.astro` | Two-column layout: sticky sidebar + content area | MODIFIED | Remove hardcoded FastAPI companion blog link, make it configurable |
| `GuideSidebar.astro` | Sticky chapter navigation sidebar | REUSED | Already guide-agnostic (takes `guideSlug` + `chapters` props) |
| `GuideBreadcrumb.astro` | Breadcrumb navigation | REUSED | Already guide-agnostic |
| `GuideChapterNav.astro` | Previous/Next chapter footer navigation | REUSED | Already guide-agnostic |
| `GuideJsonLd.astro` | Schema.org structured data | MODIFIED | Hardcodes "FastAPI Production Guide" in `isPartOf` URL |
| `CodeFromRepo.astro` | Code with GitHub source link | REUSED | Will NOT be used for Claude Code guide (no template repo) |
| `CodeBlock.astro` | Inline code block without GitHub source link | NEW | For JSON/YAML/bash/TOML snippets that exist only in the guide |
| `routes.ts` | URL builder functions | MODIFIED | `GUIDE_ROUTES.landing` hardcodes fastapi path |
| `og-cache.ts` | Build-time OG image caching | REUSED | Fully generic (hash-based) |
| `diagram-base.ts` | SVG primitive helpers | REUSED | Palette, shapes, arrows, text |
| SVG diagram generators | Build-time diagram creation | NEW (5 files) | Follow existing pattern from nfr-diagram.ts |
| SVG diagram wrappers | Astro components calling generators | NEW (5 files) | Follow existing pattern from NfrDiagram.astro |
| React interactive components | Client-side explorable visualizations | NEW (2 files) | Follow existing pattern from DeploymentTopology.tsx |
| OG image routes | Per-chapter OG PNG generation | NEW (2 files) | Follow existing pattern from fastapi-production OG routes |
| Guide hub page | Lists all available guides | MODIFIED | Currently renders only FastAPI guide card |
| Guide landing page | Hero + chapter card grid | NEW | Follow fastapi-production/index.astro pattern |
| Chapter slug page | Renders MDX content in GuideLayout | NEW | Follow fastapi-production/[slug].astro pattern |

## Recommended Project Structure (New/Modified Files Only)

```
src/
+-- content.config.ts                              # MODIFY: add 2 collections
+-- data/
|   +-- guides/
|       +-- claude-code/                           # NEW directory
|           +-- guide.json                         # Guide metadata
|           +-- pages/                             # NEW directory
|               +-- introduction.mdx               # Ch 1: What is Claude Code
|               +-- agentic-loop.mdx               # Ch 2: The Agentic Loop
|               +-- tools.mdx                      # Ch 3: Tool Use & Permissions
|               +-- hooks.mdx                      # Ch 4: Hook System
|               +-- mcp-servers.mdx                # Ch 5: MCP Servers
|               +-- claude-md.mdx                  # Ch 6: CLAUDE.md & Memory
|               +-- agent-teams.mdx                # Ch 7: Multi-Agent Orchestration
|               +-- workflows.mdx                  # Ch 8: Custom Slash Commands
|               +-- git-integration.mdx            # Ch 9: Git & GitHub Integration
|               +-- configuration.mdx              # Ch 10: Settings & Configuration
|               +-- advanced-patterns.mdx          # Ch 11: Advanced Patterns
|               +-- conclusion.mdx                 # Ch 12: Reference & Resources
+-- pages/
|   +-- guides/
|   |   +-- index.astro                            # MODIFY: multi-guide listing
|   |   +-- claude-code/                           # NEW directory
|   |       +-- index.astro                        # Landing page
|   |       +-- [slug].astro                       # Chapter pages
|   +-- open-graph/
|       +-- guides/
|           +-- claude-code.png.ts                 # NEW: landing OG image
|           +-- claude-code/
|               +-- [slug].png.ts                  # NEW: chapter OG images
+-- components/
|   +-- guide/
|       +-- CodeBlock.astro                        # NEW: inline code snippets
|       +-- AgenticLoopDiagram.astro               # NEW: SVG wrapper
|       +-- HookLifecycleDiagram.astro             # NEW: SVG wrapper
|       +-- PermissionModelDiagram.astro           # NEW: SVG wrapper
|       +-- McpArchitectureDiagram.astro           # NEW: SVG wrapper
|       +-- AgentTeamsDiagram.astro                # NEW: SVG wrapper
|       +-- PermissionFlowExplorer.tsx             # NEW: interactive React
|       +-- HookEventVisualizer.tsx                # NEW: interactive React
+-- layouts/
|   +-- GuideLayout.astro                          # MODIFY: configurable companion link
+-- lib/
    +-- guides/
        +-- routes.ts                              # MODIFY: remove hardcoded path
        +-- svg-diagrams/
            +-- index.ts                           # MODIFY: add new exports
            +-- agentic-loop.ts                    # NEW: DIAG-CC-01
            +-- hook-lifecycle.ts                  # NEW: DIAG-CC-02
            +-- permission-model.ts                # NEW: DIAG-CC-03
            +-- mcp-architecture.ts                # NEW: DIAG-CC-04
            +-- agent-teams.ts                     # NEW: DIAG-CC-05
```

### Structure Rationale

- **Parallel guide directories under `src/data/guides/`:** Each guide gets its own folder with `guide.json` + `pages/` subdirectory. This mirrors how the FastAPI guide is organized and keeps content collections isolated per guide.
- **Parallel page directories under `src/pages/guides/`:** Each guide gets its own route folder. The `[slug].astro` dynamic route pattern is duplicated per guide rather than using a nested `[guide]/[slug]` pattern because Astro content collections are already hardwired per-guide in `content.config.ts`.
- **SVG diagrams co-located in `svg-diagrams/`:** All diagram generators share the same `diagram-base.ts` foundation. Keeping them in one folder with a barrel export makes imports clean.
- **React interactive components in `components/guide/`:** Follows the DeploymentTopology.tsx precedent. These load via `client:visible` to avoid blocking initial page load.

## Architectural Patterns

### Pattern 1: Content Collection Per Guide

**What:** Each guide gets its own pair of Astro content collections: one `file()` collection for the guide.json metadata, one `glob()` collection for the MDX chapter pages. Both use the same Zod schemas (`guideMetaSchema`, `guidePageSchema`) already defined in `src/lib/guides/schema.ts`.

**When to use:** For every new guide added to the site.

**Trade-offs:** Requires adding 2 collection declarations to `content.config.ts` per guide (minor duplication) but avoids needing a multi-guide glob pattern that would complicate the data model. The schemas are shared, so validation stays DRY.

**Example (addition to content.config.ts):**
```typescript
const claudeCodeGuidePages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/guides/claude-code/pages' }),
  schema: guidePageSchema,
});

const claudeCodeGuides = defineCollection({
  loader: file('src/data/guides/claude-code/guide.json'),
  schema: guideMetaSchema,
});

// Add to exports
export const collections = {
  blog, languages, dbModels, edaTechniques, edaDistributions,
  edaPages, guidePages, guides,
  claudeCodeGuidePages, claudeCodeGuides,  // new
};
```

### Pattern 2: Build-Time SVG Diagram Generators

**What:** TypeScript functions that produce SVG markup strings at build time using primitives from `diagram-base.ts` (roundedRect, arrowLine, arrowMarkerDef, textLabel). Each generator is wrapped by a thin Astro component that calls it and renders via `PlotFigure.astro`. Zero client-side JavaScript.

**When to use:** For every architectural concept diagram (agentic loop, hook lifecycle, permission model, MCP architecture, agent teams).

**Trade-offs:** More upfront work than dropping in an image, but produces theme-aware SVGs that respect CSS custom properties for dark/light mode, are fully accessible (aria-label), and scale perfectly at any viewport width.

**Example (new diagram generator):**
```typescript
// src/lib/guides/svg-diagrams/agentic-loop.ts
import {
  DIAGRAM_PALETTE,
  type DiagramConfig,
  diagramSvgOpen,
  roundedRect,
  arrowLine,
  arrowMarkerDef,
  textLabel,
} from './diagram-base';

const MARKER_ID = 'agentic-loop-arrow';

export function generateAgenticLoop(): string {
  const config: DiagramConfig = { width: 720, height: 400 };
  const parts: string[] = [];
  parts.push(diagramSvgOpen(config, 'Claude Code agentic loop: prompt, plan, tool use, observe, iterate'));
  parts.push(arrowMarkerDef(MARKER_ID));
  // ... layout boxes and arrows for the loop ...
  parts.push('</svg>');
  return parts.join('\n');
}
```

**Example (wrapper component):**
```astro
---
// src/components/guide/AgenticLoopDiagram.astro
import PlotFigure from '../eda/PlotFigure.astro';
import { generateAgenticLoop } from '../../lib/guides/svg-diagrams';
const svg = generateAgenticLoop();
---
<PlotFigure svg={svg} caption="The Claude Code agentic loop" maxWidth="720px" />
```

### Pattern 3: Inline Code Blocks (CodeBlock vs CodeFromRepo)

**What:** The FastAPI guide uses `CodeFromRepo.astro` to display code snippets with a "View source" link to the tagged GitHub repository. The Claude Code guide has no template repository -- its code examples (JSON config, YAML hooks, bash commands, TOML settings) are inline content. A new `CodeBlock.astro` component provides syntax-highlighted code blocks with a file-path annotation header but WITHOUT the GitHub source link.

**When to use:** For all code examples in the Claude Code guide. Use `CodeFromRepo` only when referencing code from an external repository.

**Trade-offs:** One more component, but it avoids the awkward situation of `CodeFromRepo` with no meaningful source link. The component is simple -- it wraps `astro-expressive-code`'s `Code` component with the same file-path header bar styling.

**Example:**
```astro
---
// src/components/guide/CodeBlock.astro
import { Code } from 'astro-expressive-code/components';

interface Props {
  code: string;
  lang: string;
  title?: string;
}

const { code, lang, title } = Astro.props;
---
<div class="my-6 not-prose">
  {title && (
    <div class="flex items-center px-3 py-2 bg-[var(--color-surface-alt)] border border-b-0 border-[var(--color-border)] rounded-t-lg text-sm">
      <span class="font-mono text-[var(--color-text-secondary)] truncate">{title}</span>
    </div>
  )}
  <div class:list={[title && '[&_.expressive-code]:!rounded-t-none [&_.expressive-code]:!mt-0 [&_.expressive-code]:!border-t-0']}>
    <Code code={code} lang={lang} title={title} />
  </div>
</div>
```

**Usage in MDX:**
```mdx
import CodeBlock from '../../../../components/guide/CodeBlock.astro';

<CodeBlock
  code={`{
  "permissions": {
    "allow": ["Read", "Glob", "Grep", "WebSearch"],
    "deny": ["Bash(rm *)"]
  }
}`}
  lang="json"
  title=".claude/settings.json"
/>
```

### Pattern 4: Interactive React Components via client:visible

**What:** Client-hydrated React components loaded lazily when they scroll into view. Follows the `DeploymentTopology.tsx` pattern: static data defined in the component, React Flow + dagre for graph rendering, CSS-variable-based theming.

**When to use:** For the Permission Flow Explorer and Hook Event Visualizer where static diagrams are insufficient because the user needs to interact (click nodes, explore paths, see event sequences).

**Trade-offs:** Adds client-side JavaScript, but `client:visible` defers hydration until the element is in viewport, keeping initial page load fast. React Flow is already in the bundle from the FastAPI guide's DeploymentTopology.

**Example (usage in MDX):**
```mdx
import PermissionFlowExplorer from '../../../../components/guide/PermissionFlowExplorer.tsx';

<PermissionFlowExplorer client:visible />
```

## Data Flow

### Content Collection Resolution (Build Time)

```
guide.json (claude-code)
    |
    v
content.config.ts (claudeCodeGuides collection, guideMetaSchema validation)
    |
    v
[slug].astro getStaticPaths() -> getCollection('claudeCodeGuidePages')
    |                             getCollection('claudeCodeGuides')
    |
    v
GuideLayout.astro (receives: guideTitle, guideSlug, chapters, currentSlug)
    |
    +-> GuideSidebar.astro (chapters, currentSlug, guideSlug)
    +-> GuideBreadcrumb.astro (guideTitle, guideSlug, chapterTitle)
    +-> GuideChapterNav.astro (chapters, currentSlug, guideSlug)
    +-> <Content /> (MDX rendered with imported components)
```

### SVG Diagram Generation (Build Time)

```
diagram-base.ts (palette, primitives)
    |
    v
agentic-loop.ts / hook-lifecycle.ts / ... (generator functions)
    |
    v
AgenticLoopDiagram.astro / ... (call generator, get SVG string)
    |
    v
PlotFigure.astro (render SVG in themed figure with caption)
    |
    v
Static HTML output (zero JS, theme-aware via CSS custom properties)
```

### Interactive Component Hydration (Runtime)

```
MDX imports PermissionFlowExplorer.tsx with client:visible
    |
    v
Astro renders placeholder <div> in static HTML
    |
    v
IntersectionObserver fires when user scrolls to element
    |
    v
React hydrates: ReactFlow + dagre compute layout
    |
    v
User can pan, zoom, click nodes to explore permission flow
```

### OG Image Generation (Build Time)

```
[slug].png.ts getStaticPaths() -> getCollection('claudeCodeGuidePages')
    |
    v
For each chapter: computeOgHash(title, description)
    |
    +-> Cache HIT:  return cached PNG
    +-> Cache MISS: generateGuideOgImage(title, desc, label) -> cache -> return
```

## Integration Points: What Changes in Existing Files

### 1. `src/content.config.ts` -- Add 2 Collections

Add `claudeCodeGuidePages` (glob loader for MDX) and `claudeCodeGuides` (file loader for guide.json). Both reuse existing schemas from `src/lib/guides/schema.ts`. No schema changes needed.

**Risk:** LOW. Additive change, does not affect existing collections.

### 2. `src/layouts/GuideLayout.astro` -- Configurable Companion Link

The current layout hardcodes a companion blog post link to the FastAPI guide blog post. This must become a prop-driven optional section.

**Current (hardcoded):**
```astro
<aside class="mt-10 pt-6 border-t border-[var(--color-border)]">
  <p class="text-sm text-[var(--color-text-secondary)]">
    For a high-level overview of all 13 production concerns, read the companion blog post:
    <a href="/blog/fastapi-production-guide/" ...>
      FastAPI Production Guide: What Your AI Agent Inherits
    </a>
  </p>
</aside>
```

**Proposed (prop-driven):**
```astro
---
interface Props {
  // ... existing props ...
  companionLink?: { href: string; text: string; label: string };
}
---
{companionLink && (
  <aside class="mt-10 pt-6 border-t border-[var(--color-border)]">
    <p class="text-sm text-[var(--color-text-secondary)]">
      {companionLink.label}
      <a href={companionLink.href} class="text-[var(--color-accent)] hover:underline font-medium">
        {companionLink.text}
      </a>
    </p>
  </aside>
)}
```

FastAPI's `[slug].astro` passes the companion link; Claude Code's `[slug].astro` omits it (or passes its own). Backward compatible.

**Risk:** LOW. Existing FastAPI pages pass the prop; new Claude Code pages omit it.

### 3. `src/lib/guides/routes.ts` -- Remove Hardcoded Landing

The `GUIDE_ROUTES.landing` constant currently hardcodes `/guides/fastapi-production/`. This should be removed or generalized since `guideLandingUrl(slug)` already handles all guides dynamically. The constant is only used in the guides hub page which should use `guideLandingUrl()` instead.

**Risk:** LOW. The constant is not imported outside of the hub page.

### 4. `src/components/guide/GuideJsonLd.astro` -- Parameterize isPartOf

Currently hardcodes `"FastAPI Production Guide"` and its URL in the `isPartOf` field for chapter pages. Change to accept guide name and URL via props.

**Current:**
```typescript
"isPartOf": {
  "@type": "WebPage",
  "name": "FastAPI Production Guide",
  "url": "https://patrykgolabek.dev/guides/fastapi-production/",
},
```

**Proposed:** Add `parentTitle` and `parentUrl` props, with defaults matching the FastAPI guide for backward compatibility.

**Risk:** LOW. Additive props with defaults.

### 5. `src/pages/guides/index.astro` -- Multi-Guide Hub

Currently fetches only the single FastAPI guide and renders one card. Must fetch all guide metadata collections and render a card per guide.

**Approach:** Since each guide has its own collection name, the hub page will fetch both `guides` and `claudeCodeGuides` collections and render a card for each. The card rendering logic can be extracted into a shared function or component. Each card gets its own branding treatment (FastAPI teal gradient, Claude Code orange/rust gradient).

**Risk:** MEDIUM. Requires restructuring the page, but the existing card HTML is straightforward to parameterize.

### 6. `src/lib/guides/svg-diagrams/index.ts` -- Add New Exports

Add barrel exports for the 5 new diagram generators. Purely additive.

**Risk:** LOW.

## Guide Metadata Schema: Reuse, Not Extend

The existing `guideMetaSchema` already handles everything the Claude Code guide needs:

| Field | FastAPI Guide Value | Claude Code Guide Value |
|-------|--------------------|-----------------------|
| `id` | `"fastapi-production"` | `"claude-code"` |
| `title` | `"FastAPI Production Guide"` | `"Claude Code Guide"` |
| `description` | Production concerns text | Agentic coding text |
| `slug` | `"fastapi-production"` | `"claude-code"` |
| `templateRepo` | GitHub URL | Anthropic docs URL or Claude Code docs URL |
| `versionTag` | `"v1.0.0"` | `"1.0"` or current version |
| `publishedDate` | `"2026-03-08"` | TBD |
| `requirements` | `{ fastapi: "0.135+" ... }` | `{ "claude-code": "1.0+", "node": "18+" }` |
| `chapters` | 14-item array | 10-12 item array |

The `templateRepo` field is `.url()` validated. For Claude Code (no template repo), use the official Anthropic documentation URL. The `requirements` field is `z.record(z.string(), z.string()).optional()`, so it accepts any key-value pairs.

The `guidePageSchema` for MDX frontmatter is also fully reusable: `title`, `description`, `order`, `slug`. No changes needed.

## Code Example Strategy: CodeBlock vs CodeFromRepo

The FastAPI guide's `CodeFromRepo` component is purpose-built for linking code back to a tagged GitHub repository. The Claude Code guide does not have a template repo -- its code examples are illustrative configurations, CLI commands, and hook definitions.

**Decision matrix:**

| Example Type | Component | Rationale |
|--------------|-----------|-----------|
| `.claude/settings.json` config | `CodeBlock` | Inline JSON, no source repo |
| CLAUDE.md file content | `CodeBlock` | Inline markdown/text, no source repo |
| Hook YAML definitions | `CodeBlock` | Inline YAML, no source repo |
| Bash CLI commands | `CodeBlock` | Inline bash, no source repo |
| TOML configuration | `CodeBlock` | Inline TOML, no source repo |
| MCP server config JSON | `CodeBlock` | Inline JSON, no source repo |

`CodeFromRepo` is NOT used in the Claude Code guide. All examples use `CodeBlock`.

## SVG Diagram Specifications

Five build-time SVG diagrams following the established `diagram-base.ts` pattern:

### DIAG-CC-01: Agentic Loop

**Concept:** Circular flow showing Claude Code's core execution cycle: User Prompt -> Plan -> Tool Selection -> Tool Execution -> Observe Result -> (loop back or) Respond.

**Layout:** Central loop with 5-6 labeled nodes connected by directional arrows. Emphasis on the iteration cycle with a "loop back" arrow from Observe to Plan.

**Dimensions:** 720 x 400 (landscape, matches default config).

### DIAG-CC-02: Hook Lifecycle

**Concept:** Timeline/sequence showing when hooks fire: PreToolUse -> (tool executes) -> PostToolUse, and the separate Notification hook. Shows the hook config format and how hooks can block, modify, or log tool calls.

**Layout:** Vertical timeline with hook firing points marked as nodes. Left column: event flow. Right column: hook action (allow/block/modify).

**Dimensions:** 720 x 500.

### DIAG-CC-03: Permission Model

**Concept:** Layered permission hierarchy: Default Deny -> User Settings -> Project Settings (.claude/settings.json) -> Session Overrides -> Per-Tool Decisions. Shows how permissions cascade and which level wins.

**Layout:** Stacked horizontal layers from top (most general) to bottom (most specific), with arrow showing override direction.

**Dimensions:** 720 x 420.

### DIAG-CC-04: MCP Architecture

**Concept:** Client-server protocol: Claude Code (client) -> JSON-RPC -> MCP Server (providing tools/resources/prompts). Show multiple servers providing different capabilities.

**Layout:** Hub-and-spoke: Claude Code in center-left, 3-4 MCP servers on right, with labeled JSON-RPC connections showing tool/resource namespaces.

**Dimensions:** 720 x 400.

### DIAG-CC-05: Agent Teams

**Concept:** Multi-agent orchestration: Orchestrator agent spawning specialized sub-agents (researcher, coder, reviewer) with message passing. Shows the `/gsd` or custom slash command patterns.

**Layout:** Tree/hierarchy: orchestrator at top, sub-agents below with labeled communication arrows showing task delegation and result aggregation.

**Dimensions:** 720 x 450.

## Interactive React Component Specifications

### PermissionFlowExplorer (React Flow + dagre)

**Concept:** Interactive graph where users click through a permission decision flow. Start at "Tool Request" node, branch through "Is tool allowed?", "Is path in scope?", "Auto-approve or prompt?", ending at "Execute" or "Deny" terminal nodes.

**Implementation:** Follow `DeploymentTopology.tsx` pattern exactly:
- Static node/edge data defined in component
- Dagre layout computed once (not in useMemo since data is static)
- Custom node type with colored borders per decision type
- `client:visible` loading in MDX
- CSS custom properties for theme compatibility
- 350-450px height container

**Node types:** Start (blue), Decision (amber), Action (green/red), Terminal (gray).

### HookEventVisualizer (React Flow + dagre)

**Concept:** Interactive timeline showing a sequence of tool calls with hook interceptions. Users can see how PreToolUse and PostToolUse hooks fire for different tool types (Bash, Read, Write). Each hook node shows the event payload.

**Implementation:** Same React Flow + dagre pattern. Vertical flow (rankdir: TB). Tool call nodes with hook interception points branching off to show hook execution. Clicking a node highlights the relevant event payload.

**Node types:** Tool Call (blue), Hook Fire (amber), Hook Result (green = allow, red = block).

## Chapter Organization (Suggested)

| Order | Slug | Title | Key Diagrams/Interactive |
|-------|------|-------|-------------------------|
| 0 | `introduction` | What Is Claude Code | None (text-focused) |
| 1 | `agentic-loop` | The Agentic Loop | DIAG-CC-01 (AgenticLoopDiagram) |
| 2 | `tools` | Tool Use & Permissions | DIAG-CC-03 (PermissionModelDiagram), PermissionFlowExplorer |
| 3 | `hooks` | The Hook System | DIAG-CC-02 (HookLifecycleDiagram), HookEventVisualizer |
| 4 | `mcp-servers` | MCP Servers | DIAG-CC-04 (McpArchitectureDiagram) |
| 5 | `claude-md` | CLAUDE.md & Memory | CodeBlock examples |
| 6 | `agent-teams` | Multi-Agent Orchestration | DIAG-CC-05 (AgentTeamsDiagram) |
| 7 | `workflows` | Custom Slash Commands | CodeBlock examples |
| 8 | `git-integration` | Git & GitHub Integration | CodeBlock examples |
| 9 | `configuration` | Settings & Configuration | CodeBlock examples |
| 10 | `advanced-patterns` | Advanced Patterns | CodeBlock examples |
| 11 | `conclusion` | Reference & Resources | None (links, summary) |

## Anti-Patterns

### Anti-Pattern 1: Nested Dynamic Guide Routes

**What people do:** Create `src/pages/guides/[guide]/[slug].astro` to handle all guides with a single dynamic route.

**Why it's wrong:** Astro content collections are defined per-collection in `content.config.ts`. A nested dynamic route would need to resolve which collection to query based on the `[guide]` param, which creates runtime collection switching that does not work well with Astro's typed `getCollection()` API. The existing codebase already uses per-guide page directories.

**Do this instead:** Create a parallel `src/pages/guides/claude-code/[slug].astro` that queries its own collection. This is 40 lines of largely duplicated code, but it is explicit, type-safe, and consistent with the established pattern.

### Anti-Pattern 2: Extending guideMetaSchema for Claude-Code-Specific Fields

**What people do:** Add Claude-Code-specific fields to the shared schema (e.g., `claudeVersion`, `mcpSupport`).

**Why it's wrong:** The shared schema must remain generic. Guide-specific metadata belongs in the guide.json `requirements` record or in the landing page itself.

**Do this instead:** Use the `requirements` record for version info (`{ "claude-code": "1.0+" }`). Put narrative-specific content in the landing page Astro component.

### Anti-Pattern 3: Using CodeFromRepo Without a Source Repository

**What people do:** Pass an empty or placeholder URL to `CodeFromRepo` for inline examples.

**Why it's wrong:** The component renders a "View source" link that would lead nowhere or to an irrelevant page. The component's entire purpose is source attribution.

**Do this instead:** Create `CodeBlock.astro` for inline examples. It reuses the same styling but omits the source link.

### Anti-Pattern 4: Putting Interactive Components in Every Chapter

**What people do:** Add React Flow components to most/all chapters for visual flair.

**Why it's wrong:** Each `client:visible` React component adds to the overall JS bundle. React Flow + dagre together contribute non-trivial weight. The FastAPI guide uses exactly ONE interactive component (DeploymentTopology) across 14 chapters.

**Do this instead:** Limit interactive React components to 2-3 chapters where interactivity genuinely adds value (permission flow exploration, hook event sequences). Use build-time SVG diagrams for everything else.

## Dependency-Aware Build Order

The build order is structured so each phase produces artifacts the next phase consumes. No phase references components or data that has not been created yet.

### Phase 1: Schema & Infrastructure (No Content Dependencies)

1. **Modify `src/lib/guides/routes.ts`** -- Remove hardcoded `GUIDE_ROUTES.landing`. Make `guideLandingUrl()` the single source of truth.
2. **Modify `src/layouts/GuideLayout.astro`** -- Add optional `companionLink` prop. Default behavior (no prop) renders nothing.
3. **Modify `src/components/guide/GuideJsonLd.astro`** -- Add `parentTitle` and `parentUrl` props with FastAPI defaults.
4. **Update `src/pages/guides/fastapi-production/[slug].astro`** -- Pass `companionLink` prop to `GuideLayout`.

**Test gate:** Existing FastAPI guide renders identically. No visual regression.

### Phase 2: Content Collections & Data

5. **Create `src/data/guides/claude-code/guide.json`** -- Guide metadata with chapter list.
6. **Create `src/data/guides/claude-code/pages/` directory** -- Start with one stub MDX (`introduction.mdx`) for pipeline validation.
7. **Modify `src/content.config.ts`** -- Add `claudeCodeGuidePages` and `claudeCodeGuides` collections.

**Test gate:** `astro build` succeeds. Collection type-checks pass. Schema validation passes.

### Phase 3: Page Routes & OG Images

8. **Create `src/pages/guides/claude-code/index.astro`** -- Landing page (chapter card grid).
9. **Create `src/pages/guides/claude-code/[slug].astro`** -- Chapter rendering page.
10. **Create `src/pages/open-graph/guides/claude-code.png.ts`** -- Landing OG image.
11. **Create `src/pages/open-graph/guides/claude-code/[slug].png.ts`** -- Chapter OG images.
12. **Modify `src/pages/guides/index.astro`** -- Add Claude Code guide card to hub.

**Test gate:** Navigate to `/guides/claude-code/`. Landing page renders with chapter grid. Stub chapter renders in GuideLayout. OG images generate. Hub page shows both guides.

### Phase 4: CodeBlock Component

13. **Create `src/components/guide/CodeBlock.astro`** -- Inline code block component.

**Test gate:** Add a CodeBlock to the stub introduction chapter. Syntax highlighting works. No "View source" link renders.

### Phase 5: SVG Diagram Generators

14. **Create `src/lib/guides/svg-diagrams/agentic-loop.ts`** (DIAG-CC-01)
15. **Create `src/lib/guides/svg-diagrams/hook-lifecycle.ts`** (DIAG-CC-02)
16. **Create `src/lib/guides/svg-diagrams/permission-model.ts`** (DIAG-CC-03)
17. **Create `src/lib/guides/svg-diagrams/mcp-architecture.ts`** (DIAG-CC-04)
18. **Create `src/lib/guides/svg-diagrams/agent-teams.ts`** (DIAG-CC-05)
19. **Modify `src/lib/guides/svg-diagrams/index.ts`** -- Add barrel exports.
20. **Create 5 Astro wrapper components** (AgenticLoopDiagram.astro, etc.)

**Test gate:** Each diagram renders in a test page. Dark/light theme toggle shows correct palette. SVG is accessible (aria-label).

### Phase 6: Interactive React Components

21. **Create `src/components/guide/PermissionFlowExplorer.tsx`**
22. **Create `src/components/guide/HookEventVisualizer.tsx`**
23. **Create supporting CSS if needed** (follow `deployment-topology.css` pattern)

**Test gate:** Components render with `client:visible`. Pan/zoom works. Theme-compatible. No hydration errors.

### Phase 7: MDX Content Chapters

24-35. **Write each of the 10-12 MDX chapter files** with proper frontmatter, component imports, diagrams, CodeBlock examples, and prose.

**Test gate:** All chapters render. Navigation (sidebar, breadcrumbs, prev/next) works correctly. No 404s.

### Phase 8: FAQ & Polish

36. **Optionally create FAQ page** (`src/pages/guides/claude-code/faq.astro`)
37. **Write companion blog post** (if desired, following FastAPI pattern)
38. **Final review:** Check all OG images, JSON-LD structured data, breadcrumbs, cross-guide navigation.

## Sources

- Direct codebase analysis of existing guide architecture (content.config.ts, schema.ts, GuideLayout.astro, CodeFromRepo.astro, diagram-base.ts, DeploymentTopology.tsx, guide.json, OG image routes, PlotFigure.astro)
- Existing ARCHITECTURE.md research for FastAPI Production Guide (2026-03-08)
- Astro 5 content collections documentation (file/glob loaders, Zod schema validation)
- React Flow (@xyflow/react) integration pattern from DeploymentTopology.tsx

---
*Architecture research for: Claude Code Guide integration into existing Astro 5 portfolio guide architecture*
*Researched: 2026-03-10*
