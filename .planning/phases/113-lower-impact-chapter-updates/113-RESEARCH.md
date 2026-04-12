# Phase 113: Lower-Impact Chapter Updates - Research

**Researched:** 2026-04-12
**Domain:** Claude Code guide chapter content updates (MDX on Astro 5)
**Confidence:** HIGH

## Summary

This phase updates six existing guide chapters (Ch1 Introduction, Ch2 Context Management, Ch5 Remote & Headless, Ch6 MCP, Ch9 Worktrees & Subagents, Ch10 Agent Teams) with incremental feature additions that accumulated since the guide's publish date (2026-03-15, v2.1.82). Unlike Phase 111's high-impact rewrites that required major restructuring, these chapters need targeted additions -- new sections inserted into existing structure, updated descriptions, and content reflecting current Claude Code behavior.

The feature research already performed in `.planning/research/FEATURES-claude-code-guide-refresh.md` and `.planning/research/STACK.md` catalogues every new feature with behavioral details. This document does not repeat that inventory. Instead, it focuses on what the planner needs: per-chapter scope analysis, structural recommendations, feature-to-chapter mapping, cross-reference considerations (especially to the three new Ch12-14 chapters completed in Phase 112), and patterns the executor must follow.

Phase 111 established the chapter rewrite pattern (complete MDX replacement, not surgical edits) and Phase 112 established the new chapter conventions (Quick Start sections, Callout components for safety). The six chapters in this phase are lower impact individually but collectively represent significant content work across six files.

**Primary recommendation:** Plan as six independent chapter update plans (one per chapter), each executable in isolation. The chapters have no internal dependencies between them -- they cross-reference each other but links use stable slugs that will not change. Ch9 and Ch10 have the most content additions; Ch2 has the fewest.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UPD-01 | Ch1 Introduction updated with new surfaces (Desktop App, web), /powerup, install methods | Feature research #7 (fullscreen), #8 (transcript), #11 (/powerup), STACK.md #8 (Desktop), #9 (Slack). Ch1 already mentions Desktop and web -- needs expansion, not greenfield. |
| UPD-02 | Ch2 Context Management updated with autoMemoryDirectory, PostCompact hook | STACK.md #15 (autoMemoryDirectory v2.1.74), #11 (PostCompact hook v2.1.76). Smallest update in the phase -- two additions to existing sections. |
| UPD-05 | Ch5 Remote & Headless updated with Remote Control server mode, Channels, --bare, scheduled tasks | STACK.md #7 (Remote Control server mode with --spawn), #3 (Channels), #16 (--bare flag). Channels is the largest addition -- needs its own section. |
| UPD-06 | Ch6 MCP updated with elicitation, per-tool result-size caps | Feature research #12 (per-tool result-size via _meta), STACK.md #12 (elicitation v2.1.76). Two focused additions to existing MCP chapter. |
| UPD-09 | Ch9 Worktrees & Subagents updated with memory, background, initialPrompt, sparsePaths | Feature research #14 (persistent memory), #15 (initialPrompt), #17 (background flag), STACK.md #17 (sparsePaths v2.1.76). Ch9 already covers memory, background, and isolation -- these are expansions of existing sections. |
| UPD-10 | Ch10 Agent Teams updated with /agents UI, initialPrompt, dynamic agents | STACK.md #13 (/agents tabbed layout v2.1.98, initialPrompt v2.1.83, --agents flag). Moderate additions to a chapter that's otherwise stable. |
</phase_requirements>

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|-----------|---------|---------|-------------|
| Astro MDX | 4.3.13 | Chapter page format | Already used by all 14 existing chapters [VERIFIED: codebase] |
| CodeBlock.astro | Existing | Syntax-highlighted code with file-path tab headers | The only code display component used in guide chapters [VERIFIED: codebase] |
| TerminalRecording.astro | Existing | Terminal session playback (asciinema) | Used in Ch1, Ch2, Ch5, Ch9 already [VERIFIED: codebase] |

### Supporting

| Technology | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| AgenticLoopDiagram.astro | Existing | SVG agentic loop diagram | Ch1 already imports it, keep [VERIFIED: codebase] |
| McpArchitectureDiagram.astro | Existing | SVG MCP architecture | Ch6 already imports it, keep [VERIFIED: codebase] |
| AgentTeamsDiagram.astro | Existing | SVG agent teams diagram | Ch10 already imports it, keep [VERIFIED: codebase] |
| Callout.astro | Existing | Callout box (info/warning/tip/important) | Used in Ch14 Computer Use (Phase 112). Available if needed for research preview warnings. [VERIFIED: codebase] |

### Alternatives Considered

None. This phase is pure content updating within established infrastructure. No technology decisions needed. [VERIFIED: same conclusion as Phase 111 research]

## Architecture Patterns

### Existing Chapter File Structure

All six chapters follow the identical pattern established across the guide: [VERIFIED: read all six chapter files]

```
src/data/guides/claude-code/pages/<slug>.mdx
```

Each MDX file has:
1. YAML frontmatter (title, description, order, slug, lastVerified, updatedDate, keywords)
2. Component imports (CodeBlock always, optional diagram/interactive components)
3. "What You'll Learn" introduction section
4. Main content sections with `##` headings
5. CodeBlock examples throughout
6. "Best Practices" section near the end
7. "Further Reading" section with external links and next-chapter link

### Chapter Update Pattern (Phase 113 Specific)

Phase 111 established the "complete rewrite" pattern. Phase 113 chapters are lower impact but the same approach applies -- write the complete chapter fresh using the existing chapter as structural reference. This ensures consistent voice and avoids visible seams between old and new content.

For each chapter update:
1. **Read the existing chapter** in full to understand structure, imports, cross-references
2. **Identify additions** from feature research (mapped in Per-Chapter Scope below)
3. **Identify deprecation cleanup** (Phase 111 did the sweep, but verify nothing was missed)
4. **Decide: additive or restructure** (per-chapter guidance below)
5. **Write the complete updated chapter** as a single MDX file replacement
6. **Update frontmatter:** bump `lastVerified` and `updatedDate` to 2026-04-12, update `description` and `keywords` if scope expanded
7. **Add cross-references to Ch12-14** where natural (Plugins, Agent SDK, Computer Use are now live)
8. **Update guide.json description** if chapter scope expanded significantly
9. **Verify next-chapter links** in the "Further Reading" footer still point to the correct chapter

### Cross-Reference Convention for Ch12-14

Phase 111 used text-only forward references ("see the Plugins chapter") because Ch12-14 did not yet exist. Now that Phase 112 is complete, all six chapters in Phase 113 should use **real hyperlinks** to Ch12-14 where appropriate:

```mdx
For full details on plugin distribution, see [Plugins](/guides/claude-code/plugins/).
```

This is a difference from Phase 111 patterns. [VERIFIED: Ch12-14 all exist in the codebase with proper slugs]

### Anti-Patterns to Avoid

- **Partial updates (find-and-replace approach):** Do NOT surgically insert text into existing paragraphs. Write the complete chapter fresh. [VERIFIED: Phase 111 CONTEXT.md decision]
- **"What's New" callouts:** No callout boxes marking what changed. Updates read seamlessly. [VERIFIED: Phase 111 CONTEXT.md decision]
- **Parenthetical former names:** No "(formerly X)" mentions. Use current names only. [VERIFIED: Phase 111 CONTEXT.md decision]
- **Snippet-only code examples:** Examples must be complete and copy-pasteable. [VERIFIED: Phase 111 CONTEXT.md decision]
- **JSON only for config:** Use JSON for configuration examples, matching Claude Code's native settings.json format. [VERIFIED: Phase 111 CONTEXT.md decision]
- **Overloading chapters with barely-relevant features:** Each chapter should only include features within its clear domain. Features that belong in multiple chapters get a brief mention + cross-reference. [ASSUMED: based on guide style]

## Per-Chapter Scope Analysis

### Ch1: Introduction (introduction.mdx)

**Current state:** 375 lines. Covers agentic loop, installation (native script, Homebrew, WinGet), available interfaces (terminal, VS Code, JetBrains, Desktop, Web, Slack), core tools, checkpoints/undo, first session walkthrough, best practices, slash commands reference. [VERIFIED: read full chapter]

**Imports:** CodeBlock, AgenticLoopDiagram, TerminalRecording

**Additions needed:**

| Feature | Source | What to Add |
|---------|--------|-------------|
| Desktop App expansion | STACK.md #8 | Ch1 already mentions Desktop at line 112 ("Desktop app runs on macOS and Windows"). Expand with a bit more detail about Code/Cowork/Chat tabs, but keep it brief -- this is an intro chapter, not a Desktop guide. |
| Web interface expansion | Existing line 113 | Already mentioned. Minimal expansion. |
| /powerup command | Feature research #11 | Add to Slash Commands Quick Reference section. `/powerup` runs interactive animated demos teaching features. v2.1.90. Great discovery tool for new users -- fits perfectly in the intro chapter. |
| Fullscreen rendering mention | Feature research #7 | Brief mention in Available Interfaces or Best Practices. `CLAUDE_CODE_NO_FLICKER=1` for alt-screen rendering. Cross-ref to Ch4 Environment for full details. |
| Minor UX improvements | Feature research #31-37 | Scatter brief mentions: image chips (#31), edit tool enhancement (#32), /status while responding (#35), idle-return /clear nudge (#36), Ctrl+X Ctrl+E external editor (#37). Keep these as one-liners in relevant sections, not dedicated sections. |
| Install method updates | STACK.md #15 | Verify install commands are current. The native script (`curl -fsSL https://claude.ai/install.sh | bash`) and npm deprecation are already documented. Add note about Homebrew stable vs latest if appropriate. |

**Structural recommendation:** ADDITIVE. The current structure works well. Add /powerup to slash commands section, expand Desktop/Web mentions slightly, scatter minor UX improvements into relevant spots. No reorganization needed.

**Estimated size change:** ~375 lines -> ~400-420 lines (minor additions)

**Cross-reference updates:**
- Existing cross-refs to Ch2, Ch3, Ch5 stay valid
- ADD: cross-ref to Ch14 Computer Use if Desktop app section mentions computer use capability
- ADD: cross-ref to Ch12 Plugins if /powerup or discovery section mentions plugins

---

### Ch2: Context Management (context-management.mdx)

**Current state:** 447 lines. Covers CLAUDE.md file, hierarchy (managed/project/user), writing effective instructions, path-specific rules (.claude/rules/), @import syntax, auto-memory system, context window management (/context, /compact, /clear, /btw), file exclusion (respectGitignore, claudeMdExcludes), best practices. [VERIFIED: read full chapter]

**Imports:** CodeBlock, TerminalRecording

**Additions needed:**

| Feature | Source | What to Add |
|---------|--------|-------------|
| autoMemoryDirectory | STACK.md #15, v2.1.74 | New setting that lets users specify a custom directory for auto-memory storage instead of the default `~/.claude/projects/`. Add to the Auto-Memory System section. Brief addition -- just a CodeBlock showing the setting and a paragraph explaining when to use it. |
| PostCompact hook | STACK.md #11, v2.1.76 | A new hook event that fires after context compaction. Add a brief mention in the Context Window Management section alongside /compact. Cross-reference Ch8 Hooks for full hook documentation. This is NOT a deep dive -- just note it exists as an integration point. |
| New /init flow mention | Feature research #42 | Opt-in preview (`CLAUDE_CODE_NEW_INIT=1`). Multi-phase interactive init that sets up CLAUDE.md, skills, and hooks. Brief mention in the CLAUDE.md File section or a new "Getting Started with CLAUDE.md" subsection. Keep brief -- it's an opt-in preview. |

**Structural recommendation:** ADDITIVE (minimal). This is the smallest update in the phase. Two additions to existing sections and one brief mention. No reorganization needed.

**Estimated size change:** ~447 lines -> ~470-490 lines (small additions)

**Cross-reference updates:**
- Existing cross-refs to Ch3, Ch8 stay valid
- PostCompact hook mention should link to Ch8

---

### Ch5: Remote & Headless (remote-and-headless.mdx)

**Current state:** 397 lines. Covers remote control (QR code, URL), remote vs web sessions, -p flag, output formats, --json-schema, system prompt customization, --allowedTools, session management (--continue, --resume), scheduled tasks (/loop, CronCreate/List/Delete), cron expressions, durable scheduling alternatives. [VERIFIED: read full chapter]

**Imports:** CodeBlock, TerminalRecording

**Additions needed:**

| Feature | Source | What to Add |
|---------|--------|-------------|
| Remote Control server mode | STACK.md #7 | **Significant addition.** The `--spawn` flag for server mode with modes: same-dir, worktree, session. `--capacity N` for multi-session. `--remote-control-session-name-prefix` for auto-naming. This goes into the Remote Control section as a new subsection. |
| Channels | Feature research #5, STACK.md #3 | **Significant addition.** New section covering Telegram/Discord/iMessage channels as an alternative way to interact with a running session. Install as plugins, `--channels` flag, sender allowlist security model, pairing codes, enterprise controls. Research preview status should be noted. Cross-ref to Ch12 Plugins for installation details. |
| --bare flag | STACK.md #16, v2.1.81 | New flag that skips auto-discovery of hooks, LSP, plugins, MCP, auto memory, CLAUDE.md. Significant for scripted/CI contexts. Add to the Programmatic Usage section or create a "Performance Flags" subsection. |
| Scheduled tasks updates | STACK.md | Verify current scheduled task behavior. The existing chapter covers CLI cron with 3-day expiry and Desktop persistent tasks. Check if anything changed. |
| --teleport flag | STACK.md #16 | Resume a web session in local terminal. Brief mention in session management section. |
| PR Auto-Fix mention | Feature research #27 | Very brief mention. Web-only feature where Claude watches CI and fixes failures. One-liner in a "Web-Based Workflows" subsection or mention. |
| Deep links mention | Feature research #30 | Very brief. `claude-cli://` protocol for multi-line prompts. Minor UX note. |

**Structural recommendation:** ADDITIVE with two new sections. Current structure is strong. Add a "Server Mode" subsection under Remote Control. Add a new "Channels" section (this is the largest addition for this chapter). Add --bare to the Programmatic Usage section. Scatter minor mentions.

**Estimated size change:** ~397 lines -> ~520-570 lines (Channels section and server mode are significant)

**Cross-reference updates:**
- Existing links to Ch3 for permissions stay valid
- ADD: cross-ref to Ch12 Plugins (Channels installed as plugins)
- ADD: cross-ref to Ch13 Agent SDK (SDK is the programmatic alternative to -p flag)
- ADD: cross-ref to Ch11 Security for enterprise Channels controls (channelsEnabled)

---

### Ch6: MCP (mcp.mdx)

**Current state:** 355 lines. Covers MCP architecture, transport modes (stdio, HTTP, SSE deprecated), adding servers, server scopes, .mcp.json, OAuth, tool search, MCP resources, managed MCP, troubleshooting. [VERIFIED: read full chapter]

**Imports:** CodeBlock, McpArchitectureDiagram

**Additions needed:**

| Feature | Source | What to Add |
|---------|--------|-------------|
| MCP elicitation | STACK.md #12, v2.1.76 | New capability where MCP servers can request structured input from the user through an interactive dialog. Add a new section or subsection after MCP Resources. Explain what elicitation is, how it works (server sends elicitation request, Claude presents it to user, user responds), and when it's used. |
| Per-tool result-size caps | Feature research #12, v2.1.91 | MCP server authors can set per-tool maximum result size via `_meta["anthropic/maxResultSizeChars"]` in `tools/list` metadata. Up to 500K characters. Currently the chapter mentions `MAX_MCP_OUTPUT_TOKENS` in troubleshooting. This new per-tool override is a related but different mechanism. Add alongside the existing troubleshooting "Output too large" section or as a new subsection in the main content. |
| Computer Use as MCP | Feature research #2 | The Computer Use feature is implemented as a built-in MCP server. Brief mention with cross-ref to Ch14 Computer Use. One line in the architecture overview or a brief note. |
| MCP OAuth improvements | STACK.md #12 | RFC 9728 Protected Resource Metadata (v2.1.85), OAuth Client ID Metadata (v2.1.81). These are incremental improvements to existing OAuth section. Update OAuth section with current behavior. |
| MCP server deduplication | STACK.md #12, v2.1.84 | When the same MCP server appears in multiple scopes, local config wins. Brief mention in Server Scopes section. |
| MCP env vars | STACK.md #12 | `CLAUDE_CODE_MCP_SERVER_NAME`, `CLAUDE_CODE_MCP_SERVER_URL` (v2.1.85), `MCP_CONNECTION_NONBLOCKING=true` for -p mode (v2.1.89). Add to relevant sections or troubleshooting. |

**Structural recommendation:** ADDITIVE with one new section. Current structure is solid. Add an "Elicitation" section after MCP Resources. Expand the troubleshooting section with per-tool result-size caps. Update OAuth section with improvements. Scatter minor mentions.

**Estimated size change:** ~355 lines -> ~410-440 lines (elicitation section is the main addition)

**Cross-reference updates:**
- Existing links to Ch7 Skills stay valid
- ADD: cross-ref to Ch14 Computer Use (computer use runs as MCP server)
- ADD: cross-ref to Ch12 Plugins (plugins can bundle MCP servers)

---

### Ch9: Worktrees & Subagents (worktrees.mdx)

**Current state:** 436 lines. Covers subagent concept, built-in subagents (Explore, Plan, General), creating custom subagents (AGENT.md), frontmatter reference (14 fields including name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers, hooks, memory, background, isolation), where subagents live, git worktrees, subagent worktree isolation, persistent memory, foreground vs background, /agents management, permission modes. [VERIFIED: read full chapter]

**Imports:** CodeBlock, TerminalRecording

**Key observation:** Ch9 ALREADY documents memory, background, initialPrompt, and isolation in the frontmatter reference section (lines 145-149). The requirement is to **expand** these existing mentions with more depth, not add them from scratch. [VERIFIED: read chapter frontmatter reference]

**Additions needed:**

| Feature | Source | What to Add |
|---------|--------|-------------|
| Persistent memory expansion | Feature research #14 | Ch9 already has a "Persistent Memory" section (lines 307-334). Expand with: storage paths (`~/.claude/agent-memory/<name>/` for user, `.claude/agent-memory/<name>/` for project), MEMORY.md entrypoint, topic files, first 200 lines / 25KB loaded at start. The existing section covers scope choices but not storage details. |
| background mode expansion | Feature research #17 | Ch9 already covers background at lines 338-364. Expand with: `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` env var, how permissions work in background mode (pre-approved upfront, auto-denied otherwise), Ctrl+B to send foreground to background. Some of this is already present; verify and expand. |
| initialPrompt expansion | Feature research #15 | Already in frontmatter reference (line 147). Expand: auto-submit first turn when running as main session agent (via `--agent` or `agent` setting), commands and skills processed in the prompt, prepended to user-provided prompt. Add a dedicated example showing initialPrompt in use. |
| sparsePaths | STACK.md #17, v2.1.76 | New `worktree.sparsePaths` setting for sparse-checkout in monorepos. This is a worktree optimization -- only check out specified directories in worktrees. Add to the Git Worktrees section. New subsection or integrated into existing worktree content. |
| /agents UI improvements | Feature research #38, STACK.md #13 | Running tab, Library tab, Generate with Claude, color picker (v2.1.98). Update the existing "/agents" management section. |
| ExitWorktree tool | STACK.md #17, v2.1.72 | New tool that cleanly exits a worktree session. Brief mention in the worktree section. |
| --agents CLI flag | Feature research #18, STACK.md #13 | Define subagents inline as JSON at launch. Session-only. Add to "Where Subagents Live" section under the CLI flag subsection (already documented at line 205-206). Expand with example. |
| Named subagents in @ mention | STACK.md #13, v2.1.89 | Type `@agent-name` in prompt to invoke a specific subagent. Brief mention in invoking subagents section. |

**Structural recommendation:** ADDITIVE with section expansions. No reorganization needed. The chapter structure is excellent. Expand Persistent Memory, Background Execution, and Git Worktrees sections. Add sparsePaths. Update /agents UI description.

**Estimated size change:** ~436 lines -> ~520-560 lines (several section expansions)

**Cross-reference updates:**
- Existing link to Ch10 Agent Teams stays valid
- ADD: cross-ref to Ch12 Plugins (plugin agents)
- ADD: cross-ref to Ch13 Agent SDK (agents defined programmatically in SDK)

---

### Ch10: Agent Teams (agent-teams.mdx)

**Current state:** 320 lines. Covers agent teams concept, when to use, enabling (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1), team architecture (lead, teammates, shared task list, mailbox), starting a team, display modes (in-process, split-pane), task management (pending/in-progress/completed with dependencies), teammate communication (direct, broadcast, idle notifications), agent teams vs subagents comparison, token cost, best practices, practical workflow, known limitations. [VERIFIED: read full chapter]

**Imports:** CodeBlock, AgentTeamsDiagram

**Additions needed:**

| Feature | Source | What to Add |
|---------|--------|-------------|
| /agents UI updates | Feature research #38, STACK.md #13 | Running tab shows active teammates, Library tab for available agents. Update the "Starting a Team" section or "Display Modes" section. Cross-ref to Ch9 where /agents is documented more fully. |
| initialPrompt for team agents | Feature research #15, STACK.md #13 | Team lead can use agents with initialPrompt frontmatter -- the agent auto-submits a first turn when spawned as a teammate. Add brief mention to Team Architecture or Starting a Team. |
| Dynamic agents (--agents flag) | STACK.md #13 | Lead can spawn teammates using dynamically-defined agent JSON instead of AGENT.md files. Add brief mention with cross-ref to Ch9 for full --agents documentation. |
| --teammate-mode flag | STACK.md #13 | `--teammate-mode auto|in-process|tmux` flag. Update Display Modes section. |
| Agent frontmatter fields for teams | STACK.md #13 | `effort`, `maxTurns`, `disallowedTools` for plugin agents (v2.1.78). These are documented in Ch9's frontmatter reference but relevant here when teammates use AGENT.md files. Cross-ref to Ch9. |

**Structural recommendation:** ADDITIVE (moderate). No reorganization needed. Update relevant existing sections. Ch10 is fundamentally about the team coordination model, which hasn't changed -- these are incremental capability additions.

**Note on research preview status:** Ch10 currently opens with a "Research Preview" blockquote noting the feature is experimental. Verify whether agent teams are still research preview or have graduated to GA. If still preview, keep the note. [ASSUMED: still research preview based on no evidence of GA graduation]

**Estimated size change:** ~320 lines -> ~360-390 lines (moderate additions)

**Cross-reference updates:**
- Existing links to Ch9 Worktrees stay valid
- Existing link to Ch11 Security stays valid
- ADD: cross-ref to Ch12 Plugins (plugin agents as teammates)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code highlighting | Custom syntax highlighter | CodeBlock.astro + expressive-code | Already handles JSON, YAML, Bash, Markdown [VERIFIED: codebase] |
| File-path headers on code | Custom tab component | CodeBlock `title` prop | Already renders the file-path tab header [VERIFIED: codebase] |
| Callout boxes | Custom HTML/CSS | Callout.astro component | Already used in Ch14 Computer Use, supports info/warning/tip/important variants [VERIFIED: codebase] |
| Chapter navigation | Manual prev/next links | GuideChapterNav.astro | Automatically generated from guide.json [VERIFIED: codebase] |
| Table of contents | Manual anchor links | Astro built-in TOC from headings | `##` headings automatically generate anchors [VERIFIED: codebase] |
| Terminal demos | Manual text blocks | TerminalRecording.astro | Component already used in Ch1, Ch2, Ch5, Ch9 [VERIFIED: codebase] |

**Key insight:** This phase is 100% content work. Every infrastructure component needed already exists. The only code artifact is updated MDX content and possibly guide.json description updates.

## Common Pitfalls

### Pitfall 1: Scope Creep from Phase 111 Features

**What goes wrong:** An executor sees a Phase 111 feature (e.g., Auto Mode, managed-settings.d/) that could be mentioned in a Phase 113 chapter and adds extensive coverage, duplicating Phase 111's work.
**Why it happens:** Phase 113 chapters cross-reference Phase 111 chapters. The boundary between "mention with cross-reference" and "re-explain" is fuzzy.
**How to avoid:** The rule: if a feature has primary coverage in Ch3/Ch4/Ch7/Ch8/Ch11 (Phase 111 chapters), Phase 113 chapters get at most a one-paragraph mention with a hyperlink. Never re-explain what another chapter covers in depth.
**Warning signs:** A new section in a Phase 113 chapter that explains Auto Mode, permission modes, or hook events in detail.

### Pitfall 2: Missing Cross-References to New Chapters (Ch12-14)

**What goes wrong:** Phase 113 chapters are written without linking to Ch12 Plugins, Ch13 Agent SDK, or Ch14 Computer Use, even where the connection is natural (e.g., Ch5 discussing Channels without linking to Ch12 Plugins for installation).
**Why it happens:** The executor follows Phase 111's pattern of text-only forward references, not realizing Ch12-14 now exist.
**How to avoid:** Every plan should include an explicit task: "Add hyperlinks to Ch12-14 where natural." The research above identifies specific cross-reference opportunities per chapter.
**Warning signs:** Text mentions "the Plugins chapter" without a hyperlink.

### Pitfall 3: Inconsistent Research Preview Labeling

**What goes wrong:** Channels is labeled "research preview" but the blockquote/callout style differs from Ch10's research preview notation or Ch14's safety callout.
**Why it happens:** Three different phases, three different authors/runs, no shared convention.
**How to avoid:** Use the same pattern as Ch10 Agent Teams for research preview features -- a markdown blockquote at the start of the relevant section:
```mdx
> **Research Preview:** Channels are experimental and may change...
```
For safety-critical callouts, use the Callout.astro component (as Ch14 does). For research preview notes, use blockquotes (as Ch10 does). [VERIFIED: both patterns in codebase]
**Warning signs:** A `<Callout type="warning">` used for a simple research preview, or no label at all on an experimental feature.

### Pitfall 4: Stale guide.json Descriptions

**What goes wrong:** A chapter's scope expands (e.g., Ch5 now covers Channels) but the guide.json description still reflects the old scope. The stale description appears on the landing page and in OG images.
**Why it happens:** guide.json is a separate file from the MDX chapters. Content updates forget the metadata.
**How to avoid:** Each chapter plan must include a guide.json update step. Check whether the chapter's `description` field in guide.json needs updating to reflect new scope.
**Warning signs:** Landing page description says "remote control" but the chapter now covers Channels too.

### Pitfall 5: Overwriting Phase 111 Deprecation Sweep

**What goes wrong:** A Phase 113 chapter rewrite accidentally reintroduces a deprecated term that Phase 111 removed. For example, re-adding `/tag` or `/vim` to a slash commands list, or mentioning "5 permission modes" instead of 6.
**Why it happens:** The executor uses pre-Phase-111 knowledge or old documentation as reference material instead of the current chapter files (which already have Phase 111 edits).
**How to avoid:** Each plan's first task must read the CURRENT chapter file (which includes Phase 111 and Phase 112 changes). Never use the original (pre-Phase-111) content as reference. The deprecation targets are:
- `/tag` command: removed
- `/vim` command: removed  
- `ANTHROPIC_SMALL_FAST_MODEL` env var: replaced by `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- Old hook `decision`/`reason` top-level fields: replaced by `hookSpecificOutput`
- "5 permission modes": now 6
- Thinking summaries default: now off

[VERIFIED: Phase 111 RESEARCH.md deprecation targets list]
**Warning signs:** A deprecated term appearing in a completed chapter.

### Pitfall 6: Channels Section Bloat in Ch5

**What goes wrong:** The Channels section in Ch5 becomes a full chapter-length deep dive, making Ch5 disproportionately long and unfocused.
**Why it happens:** Channels is a rich feature (Telegram, Discord, iMessage, security model, enterprise controls). The temptation is to cover everything.
**How to avoid:** Ch5's Channels section should cover: what channels are (2 paragraphs), setup flow (1 code example), the security model (pairing codes, sender allowlist), enterprise controls (brief), and then cross-reference Ch12 Plugins for installation details. Total: ~60-80 lines. NOT a full deep dive on each channel platform.
**Warning signs:** Ch5 exceeds 600 lines, or the Channels section exceeds 100 lines.

## Code Examples

Verified patterns from the existing codebase and Phase 111/112:

### Standard CodeBlock Usage (JSON config)
```mdx
<CodeBlock
  code={`{
    "autoMemoryDirectory": "/path/to/custom/memory"
}`}
  lang="json"
  title="settings.json"
  caption="Customize where auto-memory files are stored."
/>
```
Source: Established pattern throughout all 14 chapters. [VERIFIED: codebase]

### Standard CodeBlock Usage (Bash command)
```mdx
<CodeBlock
  code={`claude remote-control --spawn worktree --capacity 3`}
  lang="bash"
  title="Starting remote control in server mode"
  caption="Server mode with worktree isolation and 3-session capacity."
/>
```
Source: Established pattern. [VERIFIED: codebase]

### Cross-Reference Pattern (Inline with Hyperlink)
```mdx
Channels are installed as plugins. See [Plugins](/guides/claude-code/plugins/) for installation and marketplace details.
```
Source: Existing cross-ref pattern with REAL hyperlinks (Ch12-14 now exist). [VERIFIED: codebase]

### Research Preview Blockquote
```mdx
> **Research Preview:** Channels are experimental and disabled by default. The API surface, behavior, and limitations may change. This section documents the feature as of April 2026.
```
Source: Ch10 Agent Teams uses this exact pattern. [VERIFIED: codebase]

### TerminalRecording Pattern
```mdx
<TerminalRecording
  src="/recordings/claude-code/example.cast"
  caption="Description of what's shown"
  rows={24}
  cols={90}
  speed={1}
  idleTimeLimit={3}
  transcript={`  > /powerup

  Interactive lesson launcher.
  Select a topic to learn about...`}
/>
```
Source: Used in Ch1, Ch2, Ch5, Ch9. The `transcript` prop provides accessible text fallback. [VERIFIED: codebase]

## State of the Art

| Old Approach (Guide as Published) | Current Approach (What Chapters Need) | When Changed | Impact |
|-----------------------------------|---------------------------------------|--------------|--------|
| Remote Control is basic QR+URL only | Server mode with --spawn, --capacity, multi-session | ~March 2026 | Ch5 needs server mode section |
| No Channels feature | Channels: Telegram, Discord, iMessage push events into sessions | v2.1.80+ | Ch5 needs Channels section |
| No MCP elicitation | MCP servers can request structured user input | v2.1.76 | Ch6 needs elicitation section |
| Global MCP output cap only | Per-tool result-size via _meta, up to 500K | v2.1.91 | Ch6 needs per-tool cap info |
| Memory at default directory only | autoMemoryDirectory setting for custom paths | v2.1.74 | Ch2 needs setting addition |
| No PostCompact hook | PostCompact hook fires after compaction | v2.1.76 | Ch2 needs brief mention |
| Subagent memory mentioned briefly | Full storage paths, MEMORY.md entrypoint, 200-line/25KB limits | v2.1.83+ | Ch9 needs expanded memory section |
| sparsePaths not documented | worktree.sparsePaths for monorepo sparse-checkout | v2.1.76 | Ch9 needs sparsePaths section |
| /agents as simple menu | Tabbed /agents with Running + Library tabs | v2.1.98 | Ch9 and Ch10 need UI update |
| Forward refs to Ch12-14 used text-only | Ch12-14 now exist -- use real hyperlinks | Phase 112 | All 6 chapters can link to Ch12-14 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Agent Teams is still a research preview (not GA) | Ch10 scope analysis | If GA, the research preview blockquote should be removed from Ch10. Low risk -- easy to verify and fix during execution. |
| A2 | Each chapter should only include features within its clear domain, with cross-references for shared features | Anti-Patterns | If wrong, chapters could overlap significantly. Medium risk -- affects content strategy. |
| A3 | Channels section in Ch5 should be 60-80 lines, not a full deep dive | Pitfall 6 | If user wants deeper coverage, the plan would undersize the Channels section. Low risk -- easily expanded. |

## Open Questions

1. **Ch5 Channels scope: section vs. dedicated chapter**
   - What we know: Feature research suggests Channels could be "part of Remote & Headless chapter (Ch 5) or warrant its own section." The roadmap/requirements list it under Ch5 updates (UPD-05).
   - What's unclear: How deep the Channels coverage should go. The feature has its own security model, enterprise controls, and per-platform setup (Telegram vs Discord vs iMessage).
   - Recommendation: Include as a section within Ch5 (per UPD-05 requirement), covering the concept, setup flow, security basics, and enterprise controls. Cross-ref Ch12 Plugins for installation. Keep it focused -- Channels is research preview and may change.

2. **guide.json description updates**
   - What we know: Phase 112 already updated guide.json descriptions for some chapters. Phase 113 chapters may need description updates if scope expanded significantly.
   - What's unclear: Which of the 6 chapters need guide.json description changes vs. which current descriptions are still accurate.
   - Recommendation: Ch5 definitely needs a description update (adding Channels and server mode to its scope). Ch9 may need update (adding sparsePaths). Ch1, Ch2, Ch6, Ch10 current descriptions are likely still adequate. Verify during planning.

3. **TerminalRecording .cast files**
   - What we know: Existing chapters reference .cast files in `/recordings/claude-code/`. These are likely static transcript-based recordings (the component has a `transcript` prop for accessible text).
   - What's unclear: Whether new .cast files need to be created for new features (e.g., Channels setup, /powerup demo), or if the transcript prop provides sufficient representation.
   - Recommendation: Do NOT create new .cast files. Use the `transcript` prop on TerminalRecording for any new terminal demos. This is consistent with the existing pattern and avoids the complexity of recording actual terminal sessions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual content review + Astro build verification |
| Config file | astro.config.mjs |
| Quick run command | `npx astro build 2>&1 \| head -50` |
| Full suite command | `npx astro build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPD-01 | Ch1 documents Desktop App, web, /powerup, install | manual + build | `npx astro build` (validates MDX compiles) | N/A -- content verification |
| UPD-02 | Ch2 documents autoMemoryDirectory, PostCompact hook | manual + build | `npx astro build` | N/A -- content verification |
| UPD-05 | Ch5 documents Remote Control server, Channels, --bare | manual + build | `npx astro build` | N/A -- content verification |
| UPD-06 | Ch6 documents elicitation, per-tool result-size | manual + build | `npx astro build` | N/A -- content verification |
| UPD-09 | Ch9 documents memory, background, initialPrompt, sparsePaths | manual + build | `npx astro build` | N/A -- content verification |
| UPD-10 | Ch10 documents /agents UI, initialPrompt, dynamic agents | manual + build | `npx astro build` | N/A -- content verification |

### Sampling Rate
- **Per task commit:** `npx astro build` (validates MDX compilation and no broken imports)
- **Per wave merge:** Content review against requirements checklist
- **Phase gate:** All 6 chapters build clean, grep for deprecated terms returns zero matches, guide.json descriptions verified

### Wave 0 Gaps
None -- existing build infrastructure covers all phase requirements. No test framework install needed. Content verification is manual.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). This phase is pure MDX content editing. Astro build tooling is already configured in the project.

## Security Domain

Not applicable for this phase. The work is content authoring (updating guide chapter text). No authentication, input validation, cryptography, or access control code is being written. The chapter content may describe security features (e.g., Channels security model, permission modes) but the implementation is documentation, not code.

## Sources

### Primary (HIGH confidence)
- All six chapter MDX files read in full: introduction.mdx, context-management.mdx, remote-and-headless.mdx, mcp.mdx, worktrees.mdx, agent-teams.mdx [VERIFIED: codebase]
- guide.json read in full [VERIFIED: codebase]
- `.planning/research/FEATURES-claude-code-guide-refresh.md` -- 42-feature inventory with behavioral details [VERIFIED: codebase]
- `.planning/research/STACK.md` -- Detailed feature changelog with version numbers [VERIFIED: codebase]
- Phase 111 RESEARCH.md -- Established patterns, anti-patterns, and conventions [VERIFIED: codebase]
- Phase 111 CONTEXT.md -- Locked decisions on content style, deprecations, code examples [VERIFIED: codebase]
- Phase 112 CONTEXT.md -- New chapter conventions (Quick Start, Callout component) [VERIFIED: codebase]
- CodeBlock.astro, Callout.astro, TerminalRecording.astro component APIs [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- Official Claude Code docs URLs referenced in STACK.md (code.claude.com/docs/en/channels, remote-control, mcp, sub-agents, etc.) [CITED: urls listed in STACK.md sources]

### Tertiary (LOW confidence)
- Agent Teams GA status -- assumed still research preview [ASSUMED]

## Metadata

**Confidence breakdown:**
- Per-chapter scope: HIGH -- based on direct reading of all six chapters, complete feature research, and STACK.md changelog
- Architecture patterns: HIGH -- identical to Phase 111 (verified patterns used successfully)
- Pitfalls: HIGH -- based on Phase 111 execution experience and cross-phase dependency analysis
- Feature-to-chapter mapping: HIGH -- all features mapped from feature research with version numbers

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (30 days -- Claude Code ships updates weekly but the guide structure and component patterns are stable)
