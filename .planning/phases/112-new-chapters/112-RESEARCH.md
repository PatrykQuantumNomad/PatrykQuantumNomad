# Phase 112: New Chapters - Research

**Researched:** 2026-04-12
**Domain:** Claude Code guide chapter authoring (Plugins, Agent SDK, Computer Use)
**Confidence:** HIGH

## Summary

This phase authors three new guide chapters -- Plugins (Ch12), Agent SDK (Ch13), and Computer Use (Ch14) -- as MDX files within the existing Astro content collection infrastructure. No new npm packages, no schema changes, no new components needed. The work is pure content authoring using the same `CodeBlock.astro` component and frontmatter schema (`guidePageSchema`) that all 11 existing chapters use.

The feature research already completed in `.planning/research/FEATURES-claude-code-guide-refresh.md` provides deep-dive content for all three topics (Plugins at line 339, Agent SDK at line 283, Computer Use at line 249). This document does not repeat that feature inventory. Instead, it focuses on what the planner needs: per-chapter structure, integration touchpoints, and the patterns the executor must follow.

The guide.json registration and OG image generation are mechanical -- add entries to the existing JSON array and let the existing dynamic route (`src/pages/open-graph/guides/claude-code/[slug].png.ts`) auto-generate images from the new chapter's title and description.

**Primary recommendation:** Plan as four tasks: one per chapter (3 tasks) plus one integration task (guide.json + verification). The chapters have no internal dependencies on each other and can be written in any order, though Plugins before Agent SDK is preferred since Agent SDK references plugin integration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Chapter ordering & numbering:**
- Plugins -> Agent SDK -> Computer Use (Ch12, Ch13, Ch14)
- Sequential after existing Ch11 (Security & Governance)
- Computer Use (Ch14) gets a prominent safety/governance callout box early in the chapter linking back to Ch11

**Narrative style:**
- Match existing chapter style: concept explanation with code examples woven in, section-by-section
- Same narrative pattern across all three chapters -- consistent reading experience
- Similar length to existing chapters (comparable to Ch7 or Ch8)
- Each chapter includes a Quick Start / TL;DR section at the top (new convention for these chapters)

**Code examples:**
- Plugins: full working plugin example -- complete manifest + bin/ executable that readers could copy and run
- Computer Use: CLI-focused examples (commands, flags, terminal output)
- All examples use realistic scenarios ("build a plugin that formats Markdown") not minimal/contrived demos
- Agent SDK language balance: Claude's discretion on Python vs TypeScript weighting

**Content scope:**
- Fully self-contained -- reader can jump to any new chapter without reading Ch1-Ch11; re-explain core concepts briefly as needed
- Plugins chapter: authoring-focused (manifest format, bin/ executables, userConfig, lifecycle, publishing) -- not marketplace/consumption
- Agent SDK: brief one-line mention of the rename from "Claude Code SDK", then move on
- Computer Use: safety-first structure -- lead with per-app approval flow and safety model, then cover practical CLI/GUI control

### Claude's Discretion
- How Plugins chapter bridges from Ch7 Skills (could open with "Skills are local, Plugins are shareable" or standalone intro)
- Agent SDK: Python vs TypeScript example balance per section
- Cross-referencing density between new chapters and existing Ch7/Ch8/Ch11

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|-----------|---------|---------|-------------|
| Astro MDX | 4.3.13 | Chapter page format | All 11 existing chapters use this |
| CodeBlock.astro | Existing | Syntax-highlighted code with file-path tab headers | The only code display component used in guide chapters |
| astro-expressive-code | 0.41.6 | Underlying syntax highlighting engine | JSON, YAML, Bash, TypeScript, Python, Markdown all supported |
| guidePageSchema (Zod) | Existing | MDX frontmatter validation | Defined in `src/lib/guides/schema.ts`, used by `claudeCodePages` collection |
| guide.json | Existing | Chapter registry (title, slug, description) | Parsed by `claudeCodeGuide` collection, drives sidebar + OG |

### Supporting

| Technology | Purpose | When to Use |
|-----------|---------|-------------|
| Callout.astro | Prominent callout box component | Computer Use safety callout (exists at `src/components/blog/Callout.astro`, supports warning/important types) |

### Alternatives Considered

None. This phase is pure content authoring within established infrastructure. No technology decisions needed.

## Architecture Patterns

### Existing Chapter File Structure

All chapters follow an identical pattern:
```
src/data/guides/claude-code/pages/<slug>.mdx
```

Each MDX file has:
1. YAML frontmatter (title, description, order, slug, lastVerified, updatedDate, keywords)
2. Component imports (CodeBlock always, optional diagram/interactive components)
3. "What You'll Learn" or "What You Will Learn" introduction section
4. Main content sections with `##` headings
5. CodeBlock examples throughout (JSON only for config, real language for code)
6. "Best Practices" section near the end
7. "Further Reading" section with external doc links and next-chapter link

### New Chapter Files

Three new MDX files to create:
```
src/data/guides/claude-code/pages/
  plugins.mdx         # order: 11, slug: "plugins"
  agent-sdk.mdx       # order: 12, slug: "agent-sdk"
  computer-use.mdx    # order: 13, slug: "computer-use"
```

Note: `order` is 0-indexed. Current Ch11 (Security) has `order: 10`. New chapters get `order: 11`, `order: 12`, `order: 13`.

### Frontmatter Template

```yaml
---
title: "[Chapter Title]"
description: "[SEO description, match length of existing chapters]"
order: [11|12|13]
slug: "[plugins|agent-sdk|computer-use]"
lastVerified: 2026-04-12
updatedDate: 2026-04-12
keywords: ["claude code ...", ...]
---
```

### guide.json Registration

Add three entries to the `chapters` array in `src/data/guides/claude-code/guide.json`:

```json
{ "slug": "plugins", "title": "Plugins", "description": "..." },
{ "slug": "agent-sdk", "title": "Agent SDK", "description": "..." },
{ "slug": "computer-use", "title": "Computer Use", "description": "..." }
```

Also update the top-level `description` field to reflect the new chapter count (currently says "11 practitioner-driven chapters").

### OG Image Generation

**No new files needed.** The existing dynamic route at `src/pages/open-graph/guides/claude-code/[slug].png.ts` calls `getCollection('claudeCodePages')` and generates OG images for every page in the collection. Once the new MDX files are created with valid frontmatter, OG images generate automatically at build time.

The OG route uses `generateGuideOgImage(title, description, title)` from `src/lib/og-image.ts` with `getOrGenerateOgImage()` caching from `src/lib/guides/og-cache.ts`. No changes to either file.

### Quick Start Convention (New)

Each new chapter adds a "Quick Start" section immediately after the "What You'll Learn" intro. This is a new convention not present in Ch1-Ch11. Keep it brief -- aim for "get running in 2 minutes." Format as a numbered list with CodeBlock examples.

### Computer Use Safety Callout

The CONTEXT.md specifies a "prominent safety/governance callout box" for Computer Use linking back to Ch11. Two options:

**Recommended: Import Callout.astro from blog components.** The existing `src/components/blog/Callout.astro` supports `type="warning"` with title prop. Import path from guide chapter: `import Callout from '../../../../components/blog/Callout.astro';`. This is the only existing callout component in the codebase. No guide chapter has used it before, but it renders as a styled aside with border-left accent -- exactly what's needed.

**Alternative: Inline HTML.** Write the callout as raw HTML with Tailwind classes matching the existing blog Callout styling. More self-contained but less maintainable.

Use the Callout component approach. It exists, works, and produces the right visual.

### Anti-Patterns to Avoid

- **Snippet-only code examples:** Per CONTEXT.md, examples must be complete and copy-pasteable. A plugin manifest should be a valid JSON object, not a fragment. An SDK example should be runnable code.
- **Contrived demos:** Per CONTEXT.md, use realistic scenarios. "Build a plugin that formats Markdown" not "hello world plugin."
- **Assuming prior chapters read:** Per CONTEXT.md, chapters are self-contained. Re-explain core concepts briefly (e.g., what skills are, what hooks are) before building on them.
- **"What's New" callouts for the rename:** Per CONTEXT.md, Agent SDK uses a one-line mention of the rename from "Claude Code SDK", then moves on. No parenthetical former names.
- **Missing Quick Start:** Per CONTEXT.md, each new chapter has a Quick Start at the top. Don't skip it.

## Per-Chapter Scope Analysis

### Ch12: Plugins (plugins.mdx)

**Target length:** 450-500 lines (comparable to Ch7 Custom Skills at 486 lines)

**Content source:** FEATURES-claude-code-guide-refresh.md lines 339-363

**Section outline:**
1. What You'll Learn (brief intro)
2. Quick Start (minimal viable plugin in 2 minutes)
3. What Are Plugins? (relationship to skills, distribution mechanism)
4. Plugin Structure (`.claude-plugin/plugin.json` manifest, directory layout)
5. The Plugin Manifest (`plugin.json` fields: name, description, version, author)
6. Plugin Components (skills/, commands/, agents/, hooks/, .mcp.json, .lsp.json, bin/, settings.json)
7. bin/ Executables (how Claude Code adds bin/ to PATH, usage pattern)
8. userConfig (settings at enable time, keychain-backed secrets)
9. Namespacing (plugin-name:skill-name pattern, precedence rules)
10. Local Development (`--plugin-dir`, `/reload-plugins`)
11. Publishing to Marketplace (submission via claude.ai or Console)
12. Security Restrictions (plugin subagents cannot use hooks/mcpServers/permissionMode)
13. Best Practices
14. Further Reading (link to official docs + next chapter)

**Key example:** Complete working plugin with manifest + bin/ executable + SKILL.md that formats Markdown. Must be copy-paste runnable.

**Cross-references IN:**
- Ch7 (Skills) already mentions Plugins: "The Plugins chapter covers plugin installation, marketplace discovery, and the full plugin manifest format" (line 213)
- Ch11 (Security) already has Plugin Governance section with `strictKnownMarketplaces`, `blockedMarketplaces`, `pluginTrustMessage`

**Cross-references OUT:**
- Link back to Ch7 for skill anatomy/frontmatter details
- Link back to Ch11 for enterprise plugin governance
- Link back to Ch8 for hook configuration format (plugin hooks use same schema)

**Claude's discretion recommendation:** Open with a bridge from Ch7 Skills: "Skills are local instructions -- Plugins are shareable packages." This gives readers coming from Ch7 immediate context and gives readers jumping directly into Ch12 a one-sentence grounding.

### Ch13: Agent SDK (agent-sdk.mdx)

**Target length:** 450-500 lines (comparable to Ch8 Hooks at 687 lines would be too long; aim for Ch7 range)

**Content source:** FEATURES-claude-code-guide-refresh.md lines 283-315

**Section outline:**
1. What You'll Learn (brief intro, one-line "formerly Claude Code SDK" mention)
2. Quick Start (pip install + minimal query() call)
3. What Is the Agent SDK? (library vs CLI, when to use which)
4. Installation (Python and TypeScript side by side)
5. The query() API (core API, streaming messages, options)
6. Built-in Tools (Read, Write, Edit, Bash, Monitor, Glob, Grep, WebSearch, WebFetch, AskUserQuestion)
7. Hooks as Callbacks (native callback functions vs JSON config, HookMatcher)
8. Subagents (AgentDefinition objects, programmatic agent creation)
9. MCP Integration (mcp_servers option)
10. Permission Modes (permission_mode option)
11. Session Management (resume via session_id, fork)
12. Authentication (ANTHROPIC_API_KEY, Bedrock, Vertex AI, Azure Foundry)
13. SDK vs CLI Comparison (table: same capabilities, different interfaces)
14. Best Practices
15. Further Reading

**Key examples:** Python and TypeScript side by side for core operations. Per CONTEXT.md, Claude's discretion on weighting -- recommend leading with Python for each section (more common in automation/CI use case) with TypeScript equivalent shown immediately after.

**Cross-references OUT:**
- Link to Ch8 for hook event reference (SDK hooks use same events)
- Link to Ch7 for skill configuration (SDK loads skills via setting_sources)
- Link to Ch6 for MCP server setup (SDK uses same MCP config)
- Link to Ch12 (Plugins) for plugin integration via plugins option

### Ch14: Computer Use (computer-use.mdx)

**Target length:** 350-400 lines (shorter than Skills/Hooks -- more focused topic with less configuration surface)

**Content source:** FEATURES-claude-code-guide-refresh.md lines 249-281

**Section outline:**
1. What You'll Learn (brief intro)
2. Quick Start (enable via /mcp, grant permissions, first GUI interaction)
3. Safety Callout Box (prominent Callout component, links to Ch11's permission model)
4. Safety Model (per-session app approval, machine-wide lock, Esc abort, terminal exclusion, no sandbox)
5. Per-App Approval Flow (what the prompt looks like, warning tiers, session scope)
6. App Control Tiers (browsers/trading: view-only, terminals/IDEs: click-only, everything else: full)
7. Enabling Computer Use (CLI via /mcp setup, Desktop via Settings > General)
8. CLI vs Desktop Differences (macOS-only for CLI, macOS+Windows for Desktop)
9. Screenshots and Retina Handling (auto-downscaling behavior)
10. Practical Examples (CLI-focused: terminal commands, flags, expected output)
11. Best Practices
12. Further Reading

**Key requirement:** Safety-first structure. The safety model and per-app approval MUST come before practical usage, per CONTEXT.md.

**Cross-references OUT:**
- Prominent link to Ch11 Security (in callout box)
- Link to Ch6 MCP (Computer Use is an MCP server)
- Link to Ch3 Permissions (per-app approval leverages permission system)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG images | Custom OG generation route | Existing `[slug].png.ts` dynamic route | Auto-discovers all pages in claudeCodePages collection |
| Callout box | Custom HTML/CSS callout | `Callout.astro` from `src/components/blog/` | Already exists with warning/important variants |
| Code highlighting | Custom code blocks | `CodeBlock.astro` with astro-expressive-code | Standard across all 11 existing chapters |
| Sidebar navigation | Custom chapter list | `guide.json` chapters array | GuideLayout reads this automatically |
| Prev/next navigation | Custom nav logic | `guide.json` chapter order | GuideChapterNav.astro derives from array position |

**Key insight:** All infrastructure already exists. Adding chapters is purely additive -- create MDX files with correct frontmatter + add guide.json entries. No build configuration, no new routes, no new components.

## Common Pitfalls

### Pitfall 1: Wrong order values in frontmatter
**What goes wrong:** Chapters appear in wrong position in sidebar, prev/next navigation breaks
**Why it happens:** `order` is 0-indexed. Existing Ch11 (Security) is `order: 10`. Easy to use 1-indexed numbering.
**How to avoid:** Plugins = order 11, Agent SDK = order 12, Computer Use = order 13. Verify by checking security.mdx has `order: 10`.
**Warning signs:** Sidebar shows chapters in wrong sequence after build

### Pitfall 2: guide.json slug mismatch with MDX slug
**What goes wrong:** OG images 404, sidebar links 404, chapter page doesn't render
**Why it happens:** `guide.json` chapter slug must exactly match the MDX frontmatter `slug` field
**How to avoid:** Use identical slugs: "plugins", "agent-sdk", "computer-use" in both places
**Warning signs:** Build warnings about missing pages, broken links in dev mode

### Pitfall 3: guide.json description not updated
**What goes wrong:** Landing page and guide meta still say "11 chapters", SEO signals stale
**Why it happens:** Top-level `description` field in guide.json is separate from the chapters array
**How to avoid:** Update the description to reflect 14 chapters
**Warning signs:** grep for "11 chapters" or "11 practitioner" in guide.json

### Pitfall 4: Self-contained content not achieved
**What goes wrong:** Readers jumping to Ch12/13/14 encounter unexplained terms (skills, hooks, MCP)
**Why it happens:** Authors unconsciously assume prior chapter knowledge
**How to avoid:** Each new chapter briefly defines any cross-chapter concept before using it. E.g., "Skills are reusable instruction sets (see Ch7)" on first mention in Plugins chapter.
**Warning signs:** Reading a new chapter cold and finding undefined jargon

### Pitfall 5: Missing Quick Start section
**What goes wrong:** Chapters don't match the new convention specified in CONTEXT.md
**Why it happens:** Existing chapters don't have Quick Start -- easy to follow old pattern
**How to avoid:** Quick Start is the SECOND section in every new chapter (after "What You'll Learn")
**Warning signs:** Chapter starts with "What You'll Learn" then jumps to concept explanation without Quick Start

### Pitfall 6: Callout component import path wrong
**What goes wrong:** Build error on Computer Use chapter
**Why it happens:** Callout.astro lives in `src/components/blog/` not `src/components/guide/`
**How to avoid:** Import path from chapter MDX: `import Callout from '../../../../components/blog/Callout.astro';`
**Warning signs:** Astro build error mentioning unresolved import

## Code Examples

### Frontmatter Pattern (all new chapters)
```yaml
---
title: "Plugins"
description: "Build shareable plugin packages with manifests, bin/ executables, userConfig, hooks, and marketplace publishing for distribution across teams and the community."
order: 11
slug: "plugins"
lastVerified: 2026-04-12
updatedDate: 2026-04-12
keywords: ["claude code plugins", "plugin manifest", "plugin marketplace", "bin executables", "userConfig", "plugin publishing"]
---
import CodeBlock from '../../../../components/guide/CodeBlock.astro';
```

### guide.json Chapter Entries
```json
{ "slug": "plugins", "title": "Plugins", "description": "Build shareable plugin packages with manifests, bin/ executables, userConfig, hooks, and marketplace publishing for distribution across teams and the community." },
{ "slug": "agent-sdk", "title": "Agent SDK", "description": "Use the Python and TypeScript SDKs to embed Claude Code's agent loop, tools, and context management into production applications and CI/CD pipelines." },
{ "slug": "computer-use", "title": "Computer Use", "description": "Control native desktop applications through Claude Code with per-app approval, safety-first design, and CLI or Desktop GUI setup on macOS and Windows." }
```

### Quick Start Pattern (new convention)
```markdown
## Quick Start

Get a working plugin running in under two minutes.

<CodeBlock
  code={`mkdir my-plugin && cd my-plugin
mkdir -p .claude-plugin skills/format-md

cat > .claude-plugin/plugin.json << 'EOF'
{
  "name": "markdown-formatter",
  "description": "Format Markdown files to consistent style",
  "version": "1.0.0"
}
EOF

cat > skills/format-md/SKILL.md << 'EOF'
---
name: format-md
description: Format a Markdown file to consistent style
argument-hint: "[file-path]"
---
Read the file at $ARGUMENTS and reformat it...
EOF`}
  lang="bash"
  title="Terminal"
  caption="A minimal plugin with one skill. Load it with claude --plugin-dir ./my-plugin"
/>
```

### Safety Callout Pattern (Computer Use chapter)
```markdown
import Callout from '../../../../components/blog/Callout.astro';

<Callout type="warning" title="Safety First: Computer Use Controls Real Applications">
  Computer Use gives Claude direct control over native desktop applications -- mouse clicks, keyboard input, and screenshots on your actual machine. Unlike the sandboxed Bash tool, Computer Use operates outside the sandbox. Every app requires explicit per-session approval, and you can press Escape at any time to abort. Review the full permission model in [Security & Enterprise Administration](/guides/claude-code/security/) before enabling Computer Use in any production environment.
</Callout>
```

### Agent SDK Python Example Pattern
```python
# Source: https://code.claude.com/docs/en/agent-sdk
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Find all TODO comments and create GitHub issues for them",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob", "Bash"],
        permission_mode="auto",
    )
):
    if message.type == "text":
        print(message.content)
```

### Plugin Manifest Complete Example
```json
{
  "name": "markdown-formatter",
  "description": "Consistent Markdown formatting with configurable rules",
  "version": "1.0.0",
  "author": "your-github-username"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| Claude Code SDK (name) | Agent SDK (name) | v2.1.91 | Package names unchanged; branding updated |
| No plugin system | Full plugin ecosystem | v2.1.91 | Skills, agents, hooks, MCP, LSP, bin/ all shareable |
| No computer use | MCP-based desktop control | v2.1.91 | Per-app approval safety model |

**Naming note:** The SDK packages retained their original names (`claude-agent-sdk` for Python, `@anthropic-ai/claude-agent-sdk` for TypeScript). Only the marketing name changed from "Claude Code SDK" to "Agent SDK." The chapter should use "Agent SDK" exclusively per CONTEXT.md.

## Integration Touchpoints

Files that need modification (beyond the 3 new MDX files):

| File | Change | Why |
|------|--------|-----|
| `src/data/guides/claude-code/guide.json` | Add 3 chapter entries to `chapters` array; update top-level `description` | Registration, sidebar, navigation |
| `src/pages/guides/claude-code/[slug].astro` | **No change needed** | Dynamic route auto-discovers all pages in claudeCodePages collection |
| `src/pages/open-graph/guides/claude-code/[slug].png.ts` | **No change needed** | Dynamic route auto-generates OG for all pages |
| `src/pages/guides/claude-code/index.astro` | **May need comment update** | Comment says "11 chapters" -- cosmetic but good hygiene |
| `src/content.config.ts` | **No change needed** | claudeCodePages collection uses glob pattern that auto-discovers new MDX |

## Open Questions

1. **Callout component reuse across guide chapters**
   - What we know: Callout.astro exists in `src/components/blog/` and works with MDX imports. No guide chapter has imported it before.
   - What's unclear: Whether the import path from guide chapter MDX (`../../../../components/blog/Callout.astro`) will resolve correctly at build time. Relative imports from MDX to components outside the data directory are used by CodeBlock already (`../../../../components/guide/CodeBlock.astro`), so the pattern is established.
   - Recommendation: Use it. If the build fails, the fallback is inline HTML with matching Tailwind classes.

2. **Landing page chapter count**
   - What we know: The landing page index.astro comment says "all 11 chapters" but the chapter count is dynamically derived from guide.json. The guide.json top-level description says "11 practitioner-driven chapters."
   - What's unclear: Whether any other hardcoded "11" references exist in rendered content.
   - Recommendation: Update guide.json description. Grep for "11 chapters" or "11 practitioner" site-wide in the integration task.

3. **Agent SDK package import names vs marketing name**
   - What we know: Marketing name is "Agent SDK" but Python package is `claude-agent-sdk` and npm is `@anthropic-ai/claude-agent-sdk`.
   - What's unclear: Nothing -- this is clear from the feature research.
   - Recommendation: Chapter title "Agent SDK", code examples use actual package names. One-line mention of the rename per CONTEXT.md.

## Sources

### Primary (HIGH confidence)
- `.planning/research/FEATURES-claude-code-guide-refresh.md` -- Deep-dive content for all three topics (Plugins lines 339-363, Agent SDK lines 283-315, Computer Use lines 249-281)
- `src/data/guides/claude-code/guide.json` -- Current guide structure, chapter slugs, descriptions
- `src/lib/guides/schema.ts` -- guidePageSchema and guideMetaSchema Zod definitions
- `src/content.config.ts` -- Collection definitions, glob patterns, loaders
- `src/pages/open-graph/guides/claude-code/[slug].png.ts` -- OG image generation route
- All 11 existing chapter MDX files -- Structure patterns, frontmatter conventions, component imports

### Secondary (MEDIUM confidence)
- https://code.claude.com/docs/en/plugins -- Official plugin system docs
- https://code.claude.com/docs/en/agent-sdk -- Official Agent SDK docs
- https://code.claude.com/docs/en/computer-use -- Official Computer Use docs

### Tertiary (LOW confidence)
None. All findings verified against codebase or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all infrastructure verified against codebase, no new packages
- Architecture: HIGH -- chapter file pattern, frontmatter schema, guide.json format all verified from existing 11 chapters
- Content scope: HIGH -- deep-dive feature research already completed, CONTEXT.md locks decisions
- Pitfalls: HIGH -- derived from verified codebase patterns (order indexing, slug matching, OG route behavior)

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable -- content authoring infrastructure unlikely to change)
