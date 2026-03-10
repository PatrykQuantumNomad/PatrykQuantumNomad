# Phase 93: Foundation Content Chapters - Research

**Researched:** 2026-03-10
**Domain:** MDX content authoring for Astro-based Claude Code guide (Chapters 1-6)
**Confidence:** HIGH

## Summary

Phase 93 produces six MDX content chapters covering Claude Code fundamentals (Introduction, Context Management, Models/Costs, Environment/Sandboxing, Remote/Headless/Cron, and MCP). The infrastructure is fully in place: content collections are registered, chapter routing works via `[slug].astro`, five SVG diagram components and two interactive React Flow components are built and ready for embedding. The content authoring pattern is well-established from the FastAPI guide -- MDX files in `src/data/guides/claude-code/pages/` with frontmatter (title, description, order, slug) and component imports.

The primary challenge is **factual accuracy**. The NotebookLM corpus has a ~13% hallucination rate (PITFALL-4 from project blockers), so every factual claim must be verified against official documentation at code.claude.com/docs. This research fetched and verified all six chapter domains against the current official docs. Key findings include: npm installation is now deprecated in favor of native install scripts, `.claudeignore` is not a standalone feature but rather handled through `respectGitignore` settings and `claudeMdExcludes`, SSE transport is explicitly deprecated in favor of HTTP for MCP, and the headless mode documentation now frames itself as "Agent SDK" CLI usage.

Unlike the FastAPI guide which uses `CodeFromRepo` with GitHub-linked source, the Claude Code guide uses `CodeBlock` for inline snippets (no repo link needed since content is CLI commands, config snippets, and CLAUDE.md examples rather than repository source code). The five SVG diagram Astro components and two React Flow interactive components built in Phases 91-92 are ready for embedding via standard MDX imports.

**Primary recommendation:** Write each chapter as a standalone MDX file following the established FastAPI guide pattern (200-500 lines), using `CodeBlock` for all code snippets, embedding SVG diagram components and React Flow interactive components where they map to chapter content, and verifying every factual claim against official docs at code.claude.com/docs.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAP-01 | Chapter 1 -- Introduction & Getting Started (agentic loop, installation, interfaces, core tools, checkpointing) | Official docs verified: 3-phase agentic loop (gather context, take action, verify results), 5 installation methods (native curl, Homebrew, WinGet, npm deprecated), 6 interfaces (Terminal, VS Code, JetBrains, Desktop, Web, Slack), 5 tool categories, checkpoint system with Esc-Esc rewind. AgenticLoopDiagram.astro ready for embedding. |
| CHAP-02 | Chapter 2 -- Project Context & Memory Management (CLAUDE.md hierarchy, auto-memory, context rot, .claudeignore) | Official docs verified: 3 CLAUDE.md scopes (managed policy, project, user) plus .claude/rules/ for path-specific rules, auto-memory in ~/.claude/projects/ with 200-line MEMORY.md limit, /compact with focus instructions for context management, claudeMdExcludes for file exclusion (not a separate .claudeignore file), @import syntax for file references. |
| CHAP-03 | Chapter 3 -- Models, Cost Economics & Permissions (model selection, effort levels, pricing tiers, permission system) | Official docs verified: 6 model aliases (default, sonnet, opus, haiku, sonnet[1m], opusplan), 3 effort levels (low/medium/high), average $6/dev/day cost, deny->ask->allow permission evaluation order, 5 permission modes (default, acceptEdits, plan, dontAsk, bypassPermissions). PermissionModelDiagram.astro and PermissionFlowExplorer.tsx ready. |
| CHAP-04 | Chapter 4 -- Environment Sandboxing & Workspace Customization (config scopes, sandboxed execution, status lines) | Official docs verified: 4-tier config scope (managed, user, project, local), macOS Seatbelt + Linux bubblewrap sandboxing, filesystem + network isolation, 2 sandbox modes (auto-allow, regular), custom status line via shell scripts, statusLine + fileSuggestion settings. |
| CHAP-05 | Chapter 5 -- Remote Control, Headless Automation & Crons (remote control, headless mode, cron scheduling, HTTP proxies) | Official docs verified: remote control via outbound HTTPS (no inbound ports), -p flag for headless with text/json/stream-json output, /loop skill for recurring prompts, CronCreate/CronList/CronDelete tools, 5-field cron expressions, 3-day task expiry, Desktop scheduled tasks for durable scheduling. |
| CHAP-06 | Chapter 6 -- Model Context Protocol (connecting external tools, transports, tool search, troubleshooting) | Official docs verified: 3 transport modes (HTTP recommended, SSE deprecated, stdio for local), 3 scopes (local default, project via .mcp.json, user), OAuth 2.0 authentication, tool search auto-activates at 10% context threshold, managed-mcp.json for enterprise lockdown. McpArchitectureDiagram.astro ready for embedding. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site framework, MDX rendering | Already in use; content collections handle chapter routing |
| MDX | via @astrojs/mdx | Chapter content format with component imports | Established pattern from 14 FastAPI chapters |
| astro-expressive-code | (bundled) | Syntax highlighting in CodeBlock | Already configured, provides copy-to-clipboard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CodeBlock.astro | N/A (internal) | Inline code snippets without repo link | Every code example in chapters 1-6 |
| AgenticLoopDiagram.astro | N/A (internal) | SVG agentic loop cycle diagram | Chapter 1 introduction section |
| HookLifecycleDiagram.astro | N/A (internal) | SVG hook lifecycle events diagram | Referenced in Ch1 preview, used in Ch8 (Phase 94) |
| PermissionModelDiagram.astro | N/A (internal) | SVG permission evaluation flowchart | Chapter 3 permission system section |
| McpArchitectureDiagram.astro | N/A (internal) | SVG MCP server topology diagram | Chapter 6 MCP architecture section |
| PermissionFlowExplorer.tsx | N/A (internal) | Interactive React Flow permission tree | Chapter 3 after static diagram |
| HookEventVisualizer.tsx | N/A (internal) | Interactive React Flow hook events | Referenced in Ch1 preview, used in Ch8 (Phase 94) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CodeBlock (inline) | CodeFromRepo (with GitHub link) | Claude Code guide has no companion repo -- CodeBlock is the correct component for CLI examples and config snippets |
| Native Markdown code fences | CodeBlock component | Fences work but lack the file-path tab header and visual consistency with the established guide pattern |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/data/guides/claude-code/
  guide.json                      # Already exists - 11 chapters defined
  pages/
    introduction.mdx              # CHAP-01 (exists as stub, needs content)
    context-management.mdx        # CHAP-02 (create new)
    models-and-costs.mdx          # CHAP-03 (create new)
    environment.mdx               # CHAP-04 (create new)
    remote-and-headless.mdx       # CHAP-05 (create new)
    mcp.mdx                       # CHAP-06 (create new)
```

### Pattern 1: MDX Chapter File Structure
**What:** Each chapter follows a consistent structure: frontmatter, imports, intro section, main content sections with h2 headings, code examples via CodeBlock, diagram/interactive component embeds, best practices section, and further reading links.
**When to use:** Every chapter file.
**Example:**
```mdx
---
title: "Introduction & Getting Started"
description: "The agentic loop, installation across all interfaces, core tools, and your first checkpoint"
order: 0
slug: "introduction"
lastVerified: 2026-03-10
---
import CodeBlock from '../../../../components/guide/CodeBlock.astro';
import AgenticLoopDiagram from '../../../../components/guide/AgenticLoopDiagram.astro';

## What You Will Learn

[Brief 2-3 sentence overview of chapter scope]

---

## The Agentic Loop

[Content with verified facts from official docs]

<AgenticLoopDiagram />

[Explanation of the diagram]

## Installation

<CodeBlock
  code={`curl -fsSL https://claude.ai/install.sh | bash`}
  lang="bash"
  title="macOS / Linux / WSL"
/>

## Best Practices

- [Actionable bullets]

## Further Reading

- <a href="https://code.claude.com/docs/en/overview" target="_blank" rel="noopener noreferrer">Claude Code Overview</a>
```

### Pattern 2: Interactive Component Embedding (React Flow)
**What:** React Flow components are lazy-loaded with `client:visible` to avoid impacting page load. They are embedded after the corresponding static SVG diagram to provide progressive enhancement.
**When to use:** Chapter 3 (PermissionFlowExplorer after PermissionModelDiagram) and Chapter 6 (if MCP interactive added later in v2).
**Example:**
```mdx
import PermissionFlowExplorer from '../../../../components/guide/PermissionFlowExplorer';

<PermissionModelDiagram />

Explore the permission evaluation tree interactively below. Click any node to see its evaluation context and example configurations.

<PermissionFlowExplorer client:visible />
```

### Pattern 3: CodeBlock for CLI Commands and Configuration
**What:** Use CodeBlock with appropriate `lang` and `title` props for all code examples. Use `bash` for CLI commands, `json` for settings files, `markdown` for CLAUDE.md examples, `text` for Claude Code prompts.
**When to use:** Every code example across all 6 chapters.
**Example:**
```mdx
<CodeBlock
  code={`{
  "permissions": {
    "allow": ["Bash(npm run *)"],
    "deny": ["Bash(curl *)"]
  }
}`}
  lang="json"
  title=".claude/settings.json"
/>
```

### Pattern 4: Cross-Chapter Linking
**What:** Use relative markdown links to reference other chapters within the same guide. Follow the FastAPI guide pattern of linking to `/guides/claude-code/[slug]/`.
**When to use:** When referencing concepts covered in other chapters.
**Example:**
```mdx
See [Models & Cost Economics](/guides/claude-code/models-and-costs/) for pricing details.
```

### Anti-Patterns to Avoid
- **Unverified claims from training data:** Every factual statement about Claude Code features, commands, or behavior MUST be verified against official docs. The NotebookLM corpus has ~13% hallucination rate.
- **Using CodeFromRepo instead of CodeBlock:** Claude Code guide has no companion repository. Always use CodeBlock for inline snippets.
- **Overly long chapters:** Target 200-500 lines per chapter (FastAPI average is ~290 lines). Split content if a chapter exceeds 600 lines.
- **Duplicating content between chapters:** Reference other chapters via links rather than repeating explanations.
- **Stale version numbers or pricing:** Use general descriptions ("the latest Sonnet model") rather than pinned version numbers that will go stale. Exception: when showing specific commands that require version strings.
- **Importing React components without client:visible:** Interactive React Flow components MUST use `client:visible` directive to avoid blocking page load.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code syntax highlighting | Custom highlighter | CodeBlock.astro (wraps astro-expressive-code) | Handles themes, copy-to-clipboard, file-path headers |
| Architecture diagrams | Inline SVG in MDX | Phase 91 SVG diagram Astro components | Already built, themed, accessible, tested |
| Interactive decision trees | Custom React from scratch | Phase 92 React Flow components | Already built with dagre layout, detail panels, proper theming |
| Table of contents | Manual heading list | Astro's built-in ToC via remark | Automatic, stays in sync with content |
| Cross-chapter navigation | Manual prev/next links | GuideLayout component | Already provides sidebar, breadcrumbs, prev/next cards |
| Reading time calculation | Manual word count | remark-reading-time plugin | Already configured in Astro pipeline |

**Key insight:** The infrastructure for content rendering is completely built. Phase 93 is pure content authoring -- no component development needed.

## Common Pitfalls

### Pitfall 1: Hallucinated Claude Code Features (CRITICAL)
**What goes wrong:** Content states features, commands, or behaviors that don't exist in Claude Code or have changed since the NotebookLM corpus was assembled.
**Why it happens:** ~13% hallucination rate in source corpus. Claude's training data may also contain outdated information about Claude Code features.
**How to avoid:** Every factual claim must have a verifiable source from code.claude.com/docs. When writing content, check the specific official docs page for each feature before including it.
**Warning signs:** Features described without a corresponding official docs URL, version numbers that seem outdated, commands that produce unexpected results.

### Pitfall 2: npm Installation as Primary Method
**What goes wrong:** Presenting `npm install -g @anthropic-ai/claude-code` as the primary installation method.
**Why it happens:** Many older tutorials and the npm package still exist, but the official docs now label npm as deprecated.
**How to avoid:** Lead with the native install script (`curl -fsSL https://claude.ai/install.sh | bash`), mention Homebrew and WinGet as alternatives, and note npm as a legacy option.
**Warning signs:** npm listed first or without a deprecation note.

### Pitfall 3: .claudeignore as a Standalone Feature
**What goes wrong:** Describing `.claudeignore` as a file you create in your project root (similar to `.gitignore`) when the actual mechanism is different.
**Why it happens:** The requirement mentions `.claudeignore` but official docs show this is handled through `respectGitignore` setting (default: true) and `claudeMdExcludes` for CLAUDE.md file exclusion.
**How to avoid:** Verify the exact mechanism against official docs. Describe the `respectGitignore` setting and `claudeMdExcludes` as the actual file exclusion mechanisms. If `.claudeignore` has been added as a feature after this research, verify its exact behavior.
**Warning signs:** Describing a file that doesn't appear in official documentation.

### Pitfall 4: SSE Transport Without Deprecation Warning
**What goes wrong:** Presenting SSE as a viable transport option for MCP alongside HTTP and stdio.
**Why it happens:** SSE was the original remote transport and many examples still use it.
**How to avoid:** Explicitly mark SSE as deprecated in Chapter 6. Use HTTP as the recommended remote transport. The Phase 91 SVG diagram already handles this visually (SSE labeled deprecated, HTTP with accent color).
**Warning signs:** SSE commands shown without deprecation context.

### Pitfall 5: Misrepresenting Headless Mode as Separate Feature
**What goes wrong:** Describing "headless mode" as a named feature when official docs now frame it as "Agent SDK" CLI usage with the `-p` flag.
**Why it happens:** The feature was historically called "headless mode" but documentation has been reorganized.
**How to avoid:** Title the section around the `-p` flag and programmatic usage. Note the "headless mode" terminology for discoverability but use official framing.
**Warning signs:** References to a `/headless` command or "headless mode" as a toggle.

### Pitfall 6: Wrong Import Path Depth
**What goes wrong:** Using incorrect relative import paths for components in MDX files.
**Why it happens:** Claude Code chapter files are at `src/data/guides/claude-code/pages/` which is 4 levels deep from `src/`.
**How to avoid:** Use exactly `../../../../components/guide/ComponentName.astro` for all Astro component imports and `../../../../components/guide/ComponentName` (no extension) for React components.
**Warning signs:** Build errors about unresolved imports, 404 component references.

### Pitfall 7: Context Window Numbers Without Currency
**What goes wrong:** Stating specific context window sizes (e.g., "200K tokens") that may have changed.
**Why it happens:** Context window sizes have expanded (1M now available in beta).
**How to avoid:** Reference the current official docs and note when features are in beta. Use the `/model` picker documentation as the source of truth for context sizes.
**Warning signs:** Hard-coded token numbers without "as of" dates or beta disclaimers.

### Pitfall 8: Missing lastVerified Frontmatter
**What goes wrong:** Creating chapter files without the `lastVerified` date field, making it impossible to track content freshness.
**Why it happens:** The field is optional in the schema (`z.coerce.date().optional()`) so builds won't fail.
**How to avoid:** Always include `lastVerified: 2026-03-10` in frontmatter for every new chapter.
**Warning signs:** Missing `lastVerified` in frontmatter despite being a key content freshness mechanism.

## Code Examples

### Chapter File Frontmatter (all chapters)
```yaml
# Source: verified from existing introduction.mdx stub + schema.ts
---
title: "Introduction & Getting Started"
description: "The agentic loop, installation across all interfaces, core tools, and your first checkpoint"
order: 0
slug: "introduction"
lastVerified: 2026-03-10
---
```

### Component Import Pattern (Claude Code chapters)
```mdx
# Source: FastAPI guide pattern adapted for CodeBlock
import CodeBlock from '../../../../components/guide/CodeBlock.astro';
import AgenticLoopDiagram from '../../../../components/guide/AgenticLoopDiagram.astro';
```

### CodeBlock Usage for CLI Commands
```mdx
# Source: CodeBlock.astro Props interface
<CodeBlock
  code={`curl -fsSL https://claude.ai/install.sh | bash`}
  lang="bash"
  title="Native Install (macOS / Linux / WSL)"
/>
```

### CodeBlock Usage for Configuration Files
```mdx
<CodeBlock
  code={`{
  "permissions": {
    "allow": ["Bash(npm run *)", "Bash(git commit *)"],
    "deny": ["Bash(curl *)", "Read(./.env)"]
  },
  "model": "sonnet",
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true
  }
}`}
  lang="json"
  title=".claude/settings.json"
/>
```

### Interactive Component Embedding
```mdx
# Source: Phase 92 component patterns
import PermissionFlowExplorer from '../../../../components/guide/PermissionFlowExplorer';

<PermissionFlowExplorer client:visible />
```

### SVG Diagram Embedding
```mdx
# Source: Phase 91 Astro wrapper pattern
import McpArchitectureDiagram from '../../../../components/guide/McpArchitectureDiagram.astro';

<McpArchitectureDiagram />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm install -g @anthropic-ai/claude-code | curl -fsSL https://claude.ai/install.sh \| bash | 2025-2026 | npm deprecated; native install is recommended |
| SSE transport for remote MCP | HTTP (Streamable HTTP) transport | 2025-2026 | SSE deprecated; HTTP is the recommended remote transport |
| "Headless mode" naming | "Agent SDK" / "Run programmatically" with -p flag | 2025-2026 | Documentation reorganized; -p flag behavior unchanged |
| Fixed thinking budget | Adaptive reasoning with effort levels (low/medium/high) | 2025-2026 | Opus/Sonnet 4.6 dynamically allocate thinking based on effort |
| Single .claudeignore file | respectGitignore setting + claudeMdExcludes | Current | File exclusion via settings, not a standalone dotfile |
| 200K context window only | 1M context window beta with [1m] model suffix | 2025-2026 | Extended context available but in beta with different pricing |

**Deprecated/outdated:**
- npm installation: Still works but official docs label it deprecated in favor of native install
- SSE transport: Explicitly deprecated in MCP docs; HTTP recommended
- `ANTHROPIC_SMALL_FAST_MODEL` env var: Deprecated in favor of `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `@app.on_event("startup")` pattern (FastAPI, not Claude Code): Mentioned only if cross-referencing

## Verified Content Outline Per Chapter

### Chapter 1: Introduction & Getting Started (CHAP-01)
**Verified topics and their official doc sources:**
1. What Claude Code is (overview page) -- agentic coding tool across terminal, IDE, desktop, web, browser
2. The Agentic Loop (how-claude-code-works page) -- gather context, take action, verify results cycle
3. Installation methods (overview + quickstart pages) -- native install (recommended), Homebrew, WinGet, npm (deprecated)
4. Available interfaces (overview page) -- Terminal CLI, VS Code, JetBrains, Desktop app, Web, Slack, Chrome, CI/CD
5. Core tools (how-claude-code-works page) -- 5 categories: file operations, search, execution, web, code intelligence
6. Checkpoints and undo (how-claude-code-works page) -- Esc-Esc rewind, file snapshots before edits
7. First session walkthrough (quickstart page) -- cd to project, run claude, ask questions, make changes
**Diagram:** AgenticLoopDiagram.astro (DIAG-01)
**Target length:** 300-400 lines

### Chapter 2: Project Context & Memory Management (CHAP-02)
**Verified topics and their official doc sources:**
1. CLAUDE.md file hierarchy (memory page) -- managed policy, project (./CLAUDE.md or ./.claude/CLAUDE.md), user (~/.claude/CLAUDE.md)
2. Writing effective instructions (memory page) -- target <200 lines, use markdown structure, be specific
3. .claude/rules/ directory (memory page) -- path-specific rules with YAML frontmatter, glob patterns
4. @import syntax (memory page) -- @path/to/file references, max 5 hops recursive depth
5. Auto-memory system (memory page) -- ~/.claude/projects/ storage, MEMORY.md 200-line limit, topic files loaded on-demand
6. Context window management (how-claude-code-works page) -- /context command, auto-compaction, /compact with focus
7. File exclusion mechanisms -- respectGitignore setting (default: true), claudeMdExcludes for CLAUDE.md filtering
8. /memory command (memory page) -- browse loaded files, toggle auto-memory, open editor
**Target length:** 350-450 lines

### Chapter 3: Models, Cost Economics & Permissions (CHAP-03)
**Verified topics and their official doc sources:**
1. Available models (model-config page) -- sonnet (4.6), opus (4.6), haiku, + aliases, opusplan hybrid
2. Model selection (model-config page) -- /model command, --model flag, ANTHROPIC_MODEL env, settings file
3. Effort levels (model-config page) -- low/medium/high adaptive reasoning, environment variable + settings
4. Extended context (model-config page) -- 1M beta, [1m] suffix, pricing implications beyond 200K
5. Cost tracking (costs page) -- /cost command, /stats for subscribers, ~$6/dev/day average
6. Cost reduction strategies (costs page) -- model selection, /clear between tasks, /compact, subagent delegation
7. Permission system overview (permissions page) -- tool tiers (read-only, bash, file modification)
8. Permission modes (permissions page) -- default, acceptEdits, plan, dontAsk, bypassPermissions
9. Permission rule syntax (permissions page) -- deny->ask->allow evaluation, glob patterns, specifiers
10. Settings precedence (permissions + settings pages) -- managed > CLI args > local > project > user
**Diagrams:** PermissionModelDiagram.astro (DIAG-03)
**Interactive:** PermissionFlowExplorer.tsx (INTV-01)
**Target length:** 400-500 lines

### Chapter 4: Environment Sandboxing & Workspace Customization (CHAP-04)
**Verified topics and their official doc sources:**
1. Configuration scopes (settings page) -- 4-tier: managed, user, project, local with precedence
2. Settings file locations (settings page) -- ~/.claude/settings.json, .claude/settings.json, .claude/settings.local.json, managed-settings.json
3. Sandboxing overview (sandboxing page) -- why sandboxing matters, auto-allow vs regular modes
4. Filesystem isolation (sandboxing page) -- OS-level enforcement, Seatbelt (macOS), bubblewrap (Linux)
5. Network isolation (sandboxing page) -- proxy-based, domain restrictions, allowedDomains
6. Sandbox configuration (sandboxing page) -- sandbox.filesystem.allowWrite paths, prefix notation (// ~ / ./)
7. Security benefits (sandboxing page) -- prompt injection protection, reduced attack surface
8. Status line customization (statusline page) -- shell script command, session JSON on stdin
9. Environment variables (settings page) -- key env vars for model, telemetry, effort, output
**Target length:** 350-450 lines

### Chapter 5: Remote Control, Headless Automation & Crons (CHAP-05)
**Verified topics and their official doc sources:**
1. Remote Control (remote-control page) -- outbound HTTPS only, QR code, mobile/browser access, session URL
2. Starting remote sessions (remote-control page) -- `claude remote-control` command, /remote-control from existing session
3. Remote vs Web sessions (remote-control page) -- local execution vs cloud infrastructure
4. Programmatic usage (headless page) -- -p flag, --output-format (text/json/stream-json), --json-schema
5. System prompt customization (headless page) -- --append-system-prompt, --system-prompt
6. Auto-approve tools (headless page) -- --allowedTools flag with permission rule syntax
7. Session continuation (headless page) -- --continue, --resume with session ID
8. Scheduled tasks (scheduled-tasks page) -- /loop skill, CronCreate/CronList/CronDelete tools
9. Cron expressions (scheduled-tasks page) -- 5-field standard, local timezone, 3-day expiry
10. Durable scheduling (scheduled-tasks page) -- Desktop scheduled tasks, GitHub Actions schedule trigger
**Target length:** 350-450 lines

### Chapter 6: Model Context Protocol (CHAP-06)
**Verified topics and their official doc sources:**
1. What MCP enables (mcp page) -- connecting to external tools, databases, APIs
2. Transport modes (mcp page) -- HTTP (recommended), SSE (deprecated), stdio (local processes)
3. Adding servers (mcp page) -- claude mcp add with --transport flag, --env, --scope, --header
4. Server scopes (mcp page) -- local (default, in ~/.claude.json), project (.mcp.json), user
5. .mcp.json format (mcp page) -- JSON structure, environment variable expansion, team sharing
6. OAuth authentication (mcp page) -- /mcp command, browser flow, token refresh
7. Tool search (mcp page) -- auto-activates at 10% context threshold, ENABLE_TOOL_SEARCH env var
8. MCP resources (mcp page) -- @ mentions, resource references
9. Managed MCP (mcp page) -- managed-mcp.json, allowedMcpServers, deniedMcpServers
10. Troubleshooting (mcp page) -- /mcp status, token limits, MAX_MCP_OUTPUT_TOKENS
**Diagram:** McpArchitectureDiagram.astro (DIAG-04)
**Target length:** 400-500 lines

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=json` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAP-01 | introduction.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-02 | context-management.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-03 | models-and-costs.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-04 | environment.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-05 | remote-and-headless.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-06 | mcp.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| ALL | All 6 chapters accessible at correct URLs | smoke | `npx astro build && ls dist/guides/claude-code/*/index.html` | N/A (build test) |
| ALL | Existing 379 tests still pass | regression | `npx vitest run` | All existing test files |

### Sampling Rate
- **Per task commit:** `npx vitest run` (379 existing tests, ~15s)
- **Per wave merge:** `npx astro build` (full production build verifying all chapters render)
- **Phase gate:** Full build green + all 6 chapter URLs accessible before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Content chapters are MDX files that produce build errors if imports are wrong or frontmatter is invalid. No new unit tests are needed since there is no new TypeScript logic to test. Validation is through successful builds and URL accessibility.

## Open Questions

1. **Does `.claudeignore` exist as a standalone feature?**
   - What we know: Official docs describe `respectGitignore` setting and `claudeMdExcludes` for file exclusion. No mention of a `.claudeignore` file in current docs.
   - What's unclear: The CHAP-02 requirement mentions `.claudeignore` specifically. It may have been added recently or may be a planned feature.
   - Recommendation: In Chapter 2, describe the verified file exclusion mechanisms (respectGitignore + claudeMdExcludes). If `.claudeignore` exists as a separate feature, verify its behavior before including it. If not, note that file exclusion is handled through these settings.

2. **HTTP proxy configuration for Chapter 5**
   - What we know: The sandbox docs mention httpProxyPort and socksProxyPort settings for custom proxy configuration. The requirement mentions "HTTP proxies" for Chapter 5.
   - What's unclear: Whether "HTTP proxies" refers to the sandbox proxy or a separate corporate proxy pass-through feature.
   - Recommendation: Cover the sandbox proxy configuration in Chapter 4 (where sandboxing is explained) and reference it from Chapter 5. If there is a separate HTTP proxy feature for corporate environments, verify against official docs.

3. **Exact pricing numbers stability**
   - What we know: Official docs state ~$6/dev/day average, ~$100-200/dev/month with Sonnet 4.6.
   - What's unclear: How frequently these numbers change and whether they should be included as exact figures.
   - Recommendation: Include the official averages with "as of March 2026" caveat and link to the official pricing page for current numbers.

## Sources

### Primary (HIGH confidence)
- [code.claude.com/docs/en/overview](https://code.claude.com/docs/en/overview) -- Installation methods, interfaces, capabilities
- [code.claude.com/docs/en/quickstart](https://code.claude.com/docs/en/quickstart) -- First session walkthrough, essential commands
- [code.claude.com/docs/en/how-claude-code-works](https://code.claude.com/docs/en/how-claude-code-works) -- Agentic loop, tools, checkpoints, context window
- [code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory) -- CLAUDE.md hierarchy, auto-memory, .claude/rules/, @imports
- [code.claude.com/docs/en/model-config](https://code.claude.com/docs/en/model-config) -- Model aliases, effort levels, extended context, env vars
- [code.claude.com/docs/en/costs](https://code.claude.com/docs/en/costs) -- Pricing averages, cost tracking, reduction strategies
- [code.claude.com/docs/en/permissions](https://code.claude.com/docs/en/permissions) -- Permission modes, rule syntax, evaluation order, managed settings
- [code.claude.com/docs/en/settings](https://code.claude.com/docs/en/settings) -- Configuration scopes, settings files, environment variables
- [code.claude.com/docs/en/sandboxing](https://code.claude.com/docs/en/sandboxing) -- Sandbox modes, filesystem/network isolation, OS enforcement
- [code.claude.com/docs/en/statusline](https://code.claude.com/docs/en/statusline) -- Status line customization via shell scripts
- [code.claude.com/docs/en/remote-control](https://code.claude.com/docs/en/remote-control) -- Remote control setup, connection, security
- [code.claude.com/docs/en/headless](https://code.claude.com/docs/en/headless) -- -p flag, output formats, system prompt flags, session management
- [code.claude.com/docs/en/scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks) -- /loop skill, cron tools, expressions, limitations
- [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp) -- Transports, scopes, OAuth, tool search, managed MCP

### Secondary (MEDIUM confidence)
- [github.com/anthropics/claude-code](https://github.com/anthropics/claude-code) -- Repository README with installation methods verified
- Existing FastAPI guide chapters -- Content structure, length, import patterns verified from codebase

### Tertiary (LOW confidence)
- None. All findings verified against official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All components already built and tested in Phases 90-92
- Architecture: HIGH -- MDX chapter pattern established by 14 FastAPI chapters
- Content accuracy: HIGH -- All 6 chapter domains verified against official docs (14 pages fetched)
- Pitfalls: HIGH -- Based on verified discrepancies between common assumptions and official docs

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (30 days -- Claude Code features evolve rapidly but chapter structure is stable)
