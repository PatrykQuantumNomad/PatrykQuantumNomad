# Phase 91: SVG Diagram Generators - Research

**Researched:** 2026-03-10
**Domain:** Build-time SVG generation for Astro static site, Claude Code architecture diagrams
**Confidence:** HIGH

## Summary

Phase 91 requires five build-time SVG architecture diagrams for the Claude Code guide. The project already has a well-established SVG diagram generation system built during Phase 85-89 (FastAPI Production Guide). Four existing diagrams -- middleware stack, builder pattern, JWT auth flow, and NFR tree -- demonstrate the exact pattern to follow: TypeScript generator functions that produce SVG strings using CSS custom properties for dark/light theme support, wrapped in Astro components via the `PlotFigure` component, with vitest unit tests.

The existing `diagram-base.ts` module provides all shared utilities needed: `DIAGRAM_PALETTE` (CSS variable palette), `diagramSvgOpen` (accessible SVG root), `roundedRect`, `arrowLine`, `arrowMarkerDef`, and `textLabel`. The five new Claude Code diagrams (Agentic Loop, Hook Lifecycle, Permission Model, MCP Architecture, Agent Teams) each require unique shapes beyond what the base provides -- specifically curved arrows for cycles (DIAG-01), diamond decision nodes for flowcharts (DIAG-03, DIAG-05), and multi-level grouping boxes for topology (DIAG-04). The JWT auth flow diagram already demonstrates diamond rendering with the `<polygon>` element, which can be directly reused.

All five diagram topics have been verified against official Claude Code documentation at code.claude.com/docs. The hook lifecycle has 17 events (not 13 as stated in REQUIREMENTS.md -- the requirements were written before recent additions). The agent teams feature is explicitly labeled as experimental/research preview.

**Primary recommendation:** Follow the existing FastAPI guide diagram pattern exactly -- one TypeScript generator per diagram in `src/lib/guides/svg-diagrams/`, one Astro wrapper in `src/components/guide/`, unit tests per generator, barrel export from `index.ts`. Extend `diagram-base.ts` with 2-3 new shape helpers (curved path, diamond, grouped box) to support the more complex Claude Code diagrams.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIAG-01 | Agentic Loop (gather context, take action, verify results cycle) | Official docs confirm 3-phase cycle with tools enabling agency. Needs curved arrow/cycle layout -- new shape helper required. |
| DIAG-02 | Hook Lifecycle (13+ lifecycle events with branching execution paths) | Official docs enumerate 17 lifecycle events with session-once vs loop-repeated categorization. Needs tall vertical flow with branch points. |
| DIAG-03 | Permission Model (evaluation flowchart: allow/ask/deny rules) | Official docs confirm deny->ask->allow evaluation order with tiered tool types. Diamond decision nodes already exist from JWT diagram. |
| DIAG-04 | MCP Architecture (server topology with stdio/HTTP transports) | Official docs detail three transport modes (stdio, HTTP, SSE-deprecated), three scopes (local, project, user), plus plugin-provided and claude.ai servers. |
| DIAG-05 | Agent Teams (lead agent, subagents, shared task list, mailboxes) | Official docs describe experimental feature: lead + teammates + shared task list + mailbox messaging. Explicit research preview warning required. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site framework (build-time SVG rendering) | Already in use; zero-JS SVG components render at build time |
| TypeScript | ^5.9.3 | SVG generator type safety | All existing generators are TypeScript |
| vitest | ^4.0.18 | Unit testing for SVG generators | Existing test infrastructure with 20 passing tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| diagram-base.ts | N/A (internal) | Shared SVG primitives (palette, shapes, markers) | Every diagram generator imports from this module |
| PlotFigure.astro | N/A (internal) | Figure wrapper with border, caption, responsive container | Every diagram Astro component wraps output with this |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written SVG strings | D3.js or SVG.js | Overkill -- existing string-based approach is proven, zero client JS, and simpler to maintain |
| Build-time generators | Mermaid/PlantUML | External dependencies, harder to theme with CSS custom properties, less control over visual style |
| Inline SVG in Astro | External .svg files | Loses CSS custom property theming -- static SVGs cannot use `var(--color-*)` for dark/light mode |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/guides/svg-diagrams/
    diagram-base.ts              # Shared palette, shapes, helpers (EXTEND with new shapes)
    index.ts                     # Barrel export (ADD 5 new exports)
    agentic-loop.ts              # DIAG-01 generator
    hook-lifecycle.ts            # DIAG-02 generator
    permission-model.ts          # DIAG-03 generator
    mcp-architecture.ts          # DIAG-04 generator
    agent-teams.ts               # DIAG-05 generator
    __tests__/
      agentic-loop.test.ts       # DIAG-01 tests
      hook-lifecycle.test.ts     # DIAG-02 tests
      permission-model.test.ts   # DIAG-03 tests
      mcp-architecture.test.ts   # DIAG-04 tests
      agent-teams.test.ts        # DIAG-05 tests
  components/guide/
    AgenticLoopDiagram.astro     # DIAG-01 Astro wrapper
    HookLifecycleDiagram.astro   # DIAG-02 Astro wrapper
    PermissionModelDiagram.astro # DIAG-03 Astro wrapper
    McpArchitectureDiagram.astro # DIAG-04 Astro wrapper
    AgentTeamsDiagram.astro      # DIAG-05 Astro wrapper
```

### Pattern 1: SVG Generator Function
**What:** Each diagram is a pure TypeScript function that returns an SVG string using shared primitives from `diagram-base.ts`.
**When to use:** Every diagram in Phase 91.
**Example:**
```typescript
// Source: src/lib/guides/svg-diagrams/middleware-stack.ts (existing pattern)
import {
  DIAGRAM_PALETTE,
  type DiagramConfig,
  diagramSvgOpen,
  roundedRect,
  arrowLine,
  arrowMarkerDef,
  textLabel,
} from './diagram-base';

const MARKER_ID = 'agentic-arrow'; // unique per diagram

export function generateAgenticLoop(): string {
  const config: DiagramConfig = { width: 720, height: 400 };
  const parts: string[] = [];
  parts.push(diagramSvgOpen(config, 'Agentic loop: gather context, take action, verify results'));
  parts.push(arrowMarkerDef(MARKER_ID));
  // ... diagram-specific shapes ...
  parts.push('</svg>');
  return parts.join('\n');
}
```

### Pattern 2: Astro Component Wrapper
**What:** A thin Astro component that calls the generator at build time and passes the SVG string to PlotFigure.
**When to use:** Every diagram component.
**Example:**
```astro
---
// Source: src/components/guide/MiddlewareStackDiagram.astro (existing pattern)
import PlotFigure from '../eda/PlotFigure.astro';
import { generateAgenticLoop } from '../../lib/guides/svg-diagrams';

const svg = generateAgenticLoop();
---

<PlotFigure svg={svg} caption="The agentic loop: gather context, take action, verify results" maxWidth="720px" />
```

### Pattern 3: CSS Custom Property Theming
**What:** All colors use `var(--color-*)` CSS custom properties from `DIAGRAM_PALETTE`, never hardcoded hex values.
**When to use:** Every color in every diagram. The PlotFigure wrapper already provides `bg-white dark:bg-[#1a1a2e]` for the container background.
**Example:**
```typescript
// Source: src/lib/guides/svg-diagrams/diagram-base.ts (existing)
export const DIAGRAM_PALETTE = {
  text: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  accent: 'var(--color-accent)',
  accentSecondary: 'var(--color-accent-secondary)',
  border: 'var(--color-border)',
  surface: 'var(--color-surface)',
  surfaceAlt: 'var(--color-surface-alt)',
} as const;
```

### Pattern 4: Unit Test Pattern
**What:** Every generator has a vitest test file checking: valid SVG structure, accessibility attributes, domain-specific labels, unique marker ID prefix, and CSS custom property usage (no hardcoded hex).
**When to use:** Every diagram test.
**Example:**
```typescript
// Source: src/lib/guides/svg-diagrams/__tests__/middleware-stack.test.ts (existing)
import { describe, it, expect } from 'vitest';
import { generateAgenticLoop } from '../agentic-loop';

describe('generateAgenticLoop', () => {
  const svg = generateAgenticLoop();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });
  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });
  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
  // ... domain-specific label tests ...
});
```

### Anti-Patterns to Avoid
- **Hardcoded colors:** Never use hex values like `#333` or `#E6522C` in SVG generators. The existing `public/images/diagram-data-flow.svg` file uses hardcoded colors and does NOT support dark mode -- this is the anti-pattern.
- **Client-side JavaScript:** These are build-time SVG generators. Zero client JS. The `DeploymentTopology.tsx` (React Flow) is an interactive component for Phase 92, not a pattern for static diagrams.
- **Shared marker IDs:** Every diagram MUST use a unique marker ID prefix (e.g., `agentic-arrow`, `hook-arrow`) because multiple diagrams may appear on the same page.
- **Missing `aria-label`:** Every SVG root element must have `role="img"` and a descriptive `aria-label` for accessibility.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG element generation | Custom SVG builder class | `diagram-base.ts` utilities | Already proven across 4 diagrams; `roundedRect`, `arrowLine`, `textLabel` handle common cases |
| Theme switching | Per-diagram color management | `DIAGRAM_PALETTE` CSS variables | One palette, automatic theme support via `html.dark` class toggle |
| Figure container | Custom figure wrapper | `PlotFigure.astro` | Provides border, background, caption, responsive `max-width`, `not-prose` reset |
| Accessibility | Manual ARIA attributes | `diagramSvgOpen()` helper | Generates `role="img"`, `aria-label`, responsive `viewBox` automatically |
| Arrow markers | Per-use marker elements | `arrowMarkerDef()` helper | Single `<defs>` block with reusable marker referenced by ID |

**Key insight:** The diagram system is already mature with 4 working diagrams and a shared base. The Phase 91 work is extending the content, not building new infrastructure. The only infrastructure additions are 2-3 new shape helpers in `diagram-base.ts`.

## Common Pitfalls

### Pitfall 1: Duplicate Marker IDs
**What goes wrong:** Two diagrams on the same page use the same marker ID (e.g., both use `id="arrow"`), causing one diagram to reference the other's marker definition.
**Why it happens:** SVG `<defs>` IDs are global to the HTML document, not scoped to individual SVGs.
**How to avoid:** Every diagram MUST use a unique marker ID prefix: `agentic-arrow`, `hook-arrow`, `perm-arrow`, `mcp-arrow`, `team-arrow`.
**Warning signs:** Arrows pointing wrong direction or missing in one diagram when both are on the same page.

### Pitfall 2: Hardcoded Colors Breaking Dark Mode
**What goes wrong:** Diagram looks fine in one theme but text/shapes become invisible in the other.
**Why it happens:** A color like `fill="#333"` looks fine on white but disappears on dark backgrounds.
**How to avoid:** Use ONLY `DIAGRAM_PALETTE` values. Test assertion: `expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/)`.
**Warning signs:** Unit test for "uses CSS custom properties instead of hardcoded colors" fails.

### Pitfall 3: Hook Lifecycle Count Mismatch
**What goes wrong:** Diagram shows 13 events but official docs list 17.
**Why it happens:** REQUIREMENTS.md says "13+ lifecycle events" but the current hook reference lists 17: SessionStart, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, TeammateIdle, TaskCompleted, InstructionsLoaded, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact, SessionEnd.
**How to avoid:** Use the verified list of 17 events from official docs. The "13+" requirement is a floor, not a ceiling.
**Warning signs:** Diagram content does not match official documentation.

### Pitfall 4: Agent Teams Missing Experimental Warning
**What goes wrong:** Diagram presents agent teams as a stable production feature.
**Why it happens:** STATE.md and official docs both flag agent teams as "research preview" / "experimental and disabled by default."
**How to avoid:** DIAG-05 caption or annotation must include "experimental" or "research preview" designation.
**Warning signs:** No visual or textual indicator of experimental status.

### Pitfall 5: SVG Too Wide for Mobile
**What goes wrong:** Diagram overflows horizontally on small screens.
**Why it happens:** Wide diagrams (>720px) without responsive viewBox.
**How to avoid:** `diagramSvgOpen()` already generates `style="width:100%;height:auto;max-width:Xpx"` with a viewBox -- use it for every diagram. PlotFigure provides `overflow-x-auto` scrolling as a fallback.
**Warning signs:** Horizontal scroll on mobile devices.

### Pitfall 6: Factual Errors from NotebookLM Corpus
**What goes wrong:** Diagram labels contain inaccurate information about Claude Code features.
**Why it happens:** STATE.md warns of ~13% hallucination rate in the NotebookLM 51-source corpus.
**How to avoid:** Every label and term in the diagrams must be verified against official docs at code.claude.com/docs. This research document provides verified data for all 5 diagrams.
**Warning signs:** Terms or relationships in diagrams that cannot be found in official documentation.

## Code Examples

Verified patterns from official sources and existing codebase:

### New Shape Helper: Curved Path (for Agentic Loop cycle)
```typescript
// Proposed addition to diagram-base.ts
/** Generate a curved path (quadratic Bezier) between two points */
export function curvedPath(
  x1: number, y1: number,
  cx: number, cy: number,  // control point
  x2: number, y2: number,
  markerId?: string,
): string {
  const markerAttr = markerId ? ` marker-end="url(#${markerId})"` : '';
  return `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" fill="none" stroke="${DIAGRAM_PALETTE.textSecondary}" stroke-width="1.5"${markerAttr} />`;
}
```

### New Shape Helper: Diamond Decision Node (for Flowcharts)
```typescript
// Already demonstrated in jwt-auth-flow.ts -- extract to diagram-base.ts
/** Generate a diamond-shaped decision node centered at (cx, cy) */
export function diamondNode(
  cx: number, cy: number, size: number,
  opts: { fill?: string; stroke?: string; strokeWidth?: number } = {},
): string {
  const fill = opts.fill ?? DIAGRAM_PALETTE.surfaceAlt;
  const stroke = opts.stroke ?? DIAGRAM_PALETTE.border;
  const strokeWidth = opts.strokeWidth ?? 1.5;
  return `<polygon points="${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}
```

### New Shape Helper: Grouped Box (for Topology containers)
```typescript
// Proposed addition to diagram-base.ts
/** Generate a dashed/solid group container with title */
export function groupBox(
  x: number, y: number, w: number, h: number,
  title: string,
  opts: { dashed?: boolean; titleFontSize?: number } = {},
): string {
  const dashAttr = opts.dashed ? ' stroke-dasharray="6,4"' : '';
  const titleFontSize = opts.titleFontSize ?? 11;
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="${DIAGRAM_PALETTE.border}" stroke-width="1.5"${dashAttr} />`,
    `<text x="${x + 10}" y="${y + titleFontSize + 6}" font-size="${titleFontSize}" font-weight="bold" fill="${DIAGRAM_PALETTE.textSecondary}" font-family="'DM Sans', sans-serif">${title}</text>`,
  ].join('\n');
}
```

### Verified Domain Data for Each Diagram

#### DIAG-01: Agentic Loop
Source: https://code.claude.com/docs/en/how-claude-code-works

Three phases (blend together, not strictly sequential):
1. **Gather Context** -- read files, search code, explore codebase
2. **Take Action** -- edit files, run commands, create files
3. **Verify Results** -- run tests, check output, validate changes

Tool categories: File operations, Search, Execution, Web, Code intelligence.
The loop repeats until task complete. User can interrupt at any point.

#### DIAG-02: Hook Lifecycle
Source: https://code.claude.com/docs/en/hooks

**17 lifecycle events** (verified list):

Session-once events:
- `SessionStart` -- when session begins/resumes
- `SessionEnd` -- when session terminates

Loop events (fire repeatedly inside agentic loop):
- `UserPromptSubmit` -- when user submits prompt
- `PreToolUse` -- before tool call (CAN BLOCK)
- `PermissionRequest` -- when permission dialog appears
- `PostToolUse` -- after tool call succeeds
- `PostToolUseFailure` -- after tool call fails
- `Notification` -- when notification is sent
- `SubagentStart` -- when subagent spawns
- `SubagentStop` -- when subagent finishes
- `Stop` -- when Claude finishes responding
- `TeammateIdle` -- when agent team teammate is about to go idle
- `TaskCompleted` -- when task is marked completed
- `PreCompact` -- before context compaction

Standalone async events:
- `InstructionsLoaded` -- when CLAUDE.md or rules file loaded
- `ConfigChange` -- when config file changes
- `WorktreeCreate` -- when worktree is being created
- `WorktreeRemove` -- when worktree is being removed

Handler types: command, HTTP, prompt, agent.

#### DIAG-03: Permission Model
Source: https://code.claude.com/docs/en/permissions

Evaluation order: **deny -> ask -> allow** (first match wins, deny always takes precedence)

Tool types with tiers:
- Read-only (no approval) -- file reads, grep
- Bash commands (yes, permanent per project) -- shell execution
- File modification (yes, until session end) -- edit/write

Permission modes: default, acceptEdits, plan, dontAsk, bypassPermissions

Rule syntax: `Tool` or `Tool(specifier)` with glob patterns
Settings precedence: Managed > CLI args > Local project > Shared project > User

#### DIAG-04: MCP Architecture
Source: https://code.claude.com/docs/en/mcp

Transport modes:
- **stdio** -- local process, direct system access
- **HTTP (Streamable HTTP)** -- recommended for remote servers
- **SSE** -- deprecated, use HTTP instead

Configuration scopes:
- Local (default) -- private, current project only
- Project -- `.mcp.json` checked into VCS, shared with team
- User -- cross-project, personal

Server sources: user-configured, plugin-provided, claude.ai-synced, managed (admin)
Features: OAuth 2.0 auth, tool search, MCP resources (@mentions), MCP prompts (/commands)
Managed config: `managed-mcp.json` for org-wide control, allowlists/denylists

#### DIAG-05: Agent Teams
Source: https://code.claude.com/docs/en/agent-teams

**WARNING: Experimental, disabled by default**

Architecture components:
- **Team Lead** -- main session, creates team, coordinates work
- **Teammates** -- separate Claude Code instances with own context
- **Shared Task List** -- pending/in-progress/completed with dependencies
- **Mailbox** -- inter-agent messaging (message one, broadcast all)

Communication: teammates message each other directly (unlike subagents which only report back).
Task states: pending, in progress, completed. File-lock-based claiming prevents races.
Display modes: in-process (single terminal) or split panes (tmux/iTerm2).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static SVG files in `/public/images/` with hardcoded colors | Build-time SVG generators using CSS custom properties | v1.15 FastAPI Guide (2026-03-08) | Dark/light theme support automatic |
| Interactive diagrams for all architectures | Static SVG for most + React Flow only for interactive (Phase 92) | v1.15 | Zero client JS for static diagrams; React Flow reserved for truly interactive components |
| SSE transport for MCP remote servers | HTTP (Streamable HTTP) transport recommended | 2025-2026 | SSE is deprecated but still supported; diagram should show HTTP as primary, SSE as legacy |
| 12-13 hook lifecycle events | 17 lifecycle events | Ongoing additions through 2026 | REQUIREMENTS.md "13+" is outdated; use full 17-event list |

**Deprecated/outdated:**
- MCP SSE transport: deprecated in favor of HTTP (Streamable HTTP), but still functional. Diagram should note this.
- Hook events count of 13: superseded by current official count of 17.

## Open Questions

1. **Should diagram-base.ts additions be backward-compatible only?**
   - What we know: Adding new helper functions is non-breaking. The 4 existing diagrams will not be affected.
   - What's unclear: Whether to refactor the diamond from jwt-auth-flow.ts into a shared helper or just add new ones.
   - Recommendation: Extract the diamond to diagram-base.ts since it's needed by DIAG-03 and DIAG-05. This is a safe refactor -- update the JWT import to use the shared version.

2. **How many hook events to show in DIAG-02?**
   - What we know: Official docs list 17. REQUIREMENTS.md says "13+".
   - What's unclear: Whether showing all 17 makes the diagram too tall/complex.
   - Recommendation: Show all 17 events grouped by category (session-once, loop, standalone async). The diagram height can accommodate this with the vertical layout pattern from the middleware stack.

3. **Agent Teams diagram: how to convey "experimental" status visually?**
   - What we know: Feature is "experimental and disabled by default" per official docs.
   - What's unclear: Best visual treatment -- dashed border? Badge? Caption note?
   - Recommendation: Use a dashed outer border for the entire diagram plus include "Research Preview" text in the diagram caption and as a label inside the SVG.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/guides/svg-diagrams/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIAG-01 | Agentic loop SVG with cycle labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/agentic-loop.test.ts -x` | Wave 0 |
| DIAG-02 | Hook lifecycle SVG with 17 event labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/hook-lifecycle.test.ts -x` | Wave 0 |
| DIAG-03 | Permission model SVG with allow/ask/deny labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/permission-model.test.ts -x` | Wave 0 |
| DIAG-04 | MCP architecture SVG with transport labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/mcp-architecture.test.ts -x` | Wave 0 |
| DIAG-05 | Agent teams SVG with lead/teammate/task/mailbox labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/agent-teams.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/guides/svg-diagrams/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/guides/svg-diagrams/__tests__/agentic-loop.test.ts` -- covers DIAG-01
- [ ] `src/lib/guides/svg-diagrams/__tests__/hook-lifecycle.test.ts` -- covers DIAG-02
- [ ] `src/lib/guides/svg-diagrams/__tests__/permission-model.test.ts` -- covers DIAG-03
- [ ] `src/lib/guides/svg-diagrams/__tests__/mcp-architecture.test.ts` -- covers DIAG-04
- [ ] `src/lib/guides/svg-diagrams/__tests__/agent-teams.test.ts` -- covers DIAG-05

No framework install needed -- vitest is already configured and running (20 existing tests pass).

## Sources

### Primary (HIGH confidence)
- https://code.claude.com/docs/en/how-claude-code-works -- Agentic loop phases, tool categories, loop behavior
- https://code.claude.com/docs/en/hooks -- All 17 hook lifecycle events, handler types, configuration schema
- https://code.claude.com/docs/en/permissions -- Permission evaluation order (deny->ask->allow), tool tiers, modes, rule syntax
- https://code.claude.com/docs/en/mcp -- MCP transport modes (stdio/HTTP/SSE), scopes, managed config, server topology
- https://code.claude.com/docs/en/agent-teams -- Team architecture (lead/teammates/task list/mailbox), experimental status, communication patterns
- Existing codebase: `src/lib/guides/svg-diagrams/` -- 4 working diagram generators, diagram-base.ts, PlotFigure.astro, 20 passing tests

### Secondary (MEDIUM confidence)
- None needed -- all information verified against primary sources

### Tertiary (LOW confidence)
- None -- no unverified claims in this research

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using existing proven infrastructure, no new dependencies
- Architecture: HIGH -- following established pattern from 4 existing diagrams
- Pitfalls: HIGH -- identified from codebase analysis and official docs verification
- Domain data: HIGH -- all diagram content verified against code.claude.com/docs official pages

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- diagram infrastructure is mature; Claude Code hook list may expand)
