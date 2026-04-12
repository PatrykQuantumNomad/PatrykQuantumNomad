# Feature Research: Claude Code Guide Refresh (April 2026)

**Domain:** Claude Code guide update -- new features since v2.1.83 (March 15, 2026 guide publish date)
**Researched:** 2026-04-12
**Confidence:** HIGH
**Sources:** Official docs at code.claude.com/docs/en (whats-new W13-W14, hooks, skills, mcp, memory, agent-sdk, sub-agents, computer-use, permission-modes, plugins, channels, fullscreen)

## Scope

This document catalogues every user-facing Claude Code feature released between the guide's publish date (2026-03-15, v2.1.82) and today (2026-04-12, v2.1.91). Features are classified as table stakes (must update), differentiators (makes the guide stand out), or mention-only (too niche/volatile for deep coverage). Each entry identifies which existing guide chapter needs updating or whether a new chapter/section is required.

---

## Feature Landscape

### Table Stakes (Readers Expect These Covered)

Missing these means the guide is visibly out of date. Readers will notice gaps.

| # | Feature | What It Does | User Experience | Complexity | Existing Chapter | Notes |
|---|---------|--------------|-----------------|------------|------------------|-------|
| 1 | **Auto Mode** | Classifier-based permission automation. Safe edits and commands run uninterrupted; destructive/suspicious actions blocked. Middle ground between approving everything and `--dangerously-skip-permissions`. | Press `Shift+Tab` to cycle to `auto`, or set `"defaultMode": "auto"` in settings. Blocked actions appear in `/permissions > Recently denied` with `r` to retry. Falls back to prompting after 3 consecutive or 20 total blocks. | HIGH | Ch3 (Models & Costs) / Ch4 (Environment) / Ch11 (Security) | **Requires:** Team/Enterprise/API plan, Sonnet 4.6 or Opus 4.6, Anthropic API only. Classifier runs on Sonnet 4.6 regardless of session model. Classifier sees user messages + tool calls + CLAUDE.md but NOT tool results. Separate server-side probe scans tool results for hostile content. Subagent actions also go through classifier at spawn, during execution, and on return. |
| 2 | **Computer Use (CLI + Desktop)** | Claude opens native apps, clicks through UI, takes screenshots, and verifies changes. Extends beyond web-only verification to GUI-only apps. | Enable via `/mcp` toggle for `computer-use` server (CLI) or Settings toggle (Desktop). Per-app approval each session. `Esc` aborts instantly. One session at a time (machine-wide lock). | HIGH | Ch6 (MCP) -- needs new section or new chapter | **Research preview.** macOS only for CLI. macOS + Windows for Desktop. Requires Pro/Max plan, v2.1.85+, claude.ai auth. Not available in `-p` mode. Apps hidden during computer use. Terminal excluded from screenshots. App tiers: browsers/trading = view-only, terminals/IDEs = click-only, everything else = full control. |
| 3 | **Agent SDK (renamed from Claude Code SDK)** | Python + TypeScript SDK to build production AI agents with Claude Code's tools, agent loop, and context management as a library. Same built-in tools (Read, Edit, Bash, Glob, Grep, WebSearch, etc.), hooks, subagents, MCP, permissions, sessions. | `pip install claude-agent-sdk` or `npm install @anthropic-ai/claude-agent-sdk`. Call `query()` with prompt and options, iterate over streaming messages. Supports Bedrock, Vertex AI, Azure Foundry auth. | HIGH | Ch5 (Remote & Headless) -- needs major new section or new chapter | Renamed from "Claude Code SDK." Includes `Monitor` tool (watch background script, react to each output line). Sessions can be resumed via session ID. Hooks use callback functions instead of JSON config. Agents defined programmatically via `AgentDefinition`. Branding: "Claude Agent" or "Claude" OK, "Claude Code" NOT permitted. |
| 4 | **Conditional `if` Hooks** | Hooks can declare an `if` field using permission rule syntax to narrow beyond the matcher to specific tool arguments. Avoids process spawn overhead. | Add `"if": "Bash(git commit *)"` to a hook handler. Only fires when the tool call matches both the matcher AND the `if` condition. | MEDIUM | Ch8 (Hooks) | Supported on: PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, PermissionDenied. Uses same syntax as permission rules. |
| 5 | **Channels (Telegram, Discord, iMessage)** | MCP servers that push external events INTO a running Claude Code session. Two-way: Claude reads event and replies through the same channel. | Install as plugin (`/plugin install telegram@claude-plugins-official`), configure credentials, restart with `--channels plugin:telegram@claude-plugins-official`. Sender allowlist with pairing codes. | HIGH | Ch6 (MCP) or new chapter | **Research preview.** Requires v2.1.80+, claude.ai login. Team/Enterprise must enable via managed settings (`channelsEnabled`). Supports Telegram, Discord, iMessage, plus fakechat demo. Permission relay capability lets remote approval of tool use. |
| 6 | **Plugins System** | Package and distribute skills, agents, hooks, MCP servers, LSP servers as installable units with `.claude-plugin/plugin.json` manifest. | `/plugin install name@marketplace`, namespaced skills (`/plugin-name:skill-name`), `--plugin-dir` for local dev, `/reload-plugins`. | HIGH | Needs new chapter or major section | Plugin structure: `.claude-plugin/plugin.json` + `skills/`, `agents/`, `hooks/hooks.json`, `.mcp.json`, `.lsp.json`, `bin/`, `settings.json`. Marketplace support with official Anthropic marketplace submission. `userConfig` for settings at enable time with keychain-backed secrets. |
| 7 | **Fullscreen Rendering (Flicker-Free)** | Alt-screen renderer with virtualized scrollback. Prompt pinned to bottom, mouse support, flat memory usage. | Set `CLAUDE_CODE_NO_FLICKER=1`. Mouse click-to-expand tool results, click-to-position cursor, URL clicking, drag-to-select with auto-copy. `Ctrl+O` for transcript mode with search. | MEDIUM | Ch1 (Introduction) or Ch4 (Environment) | **Research preview.** v2.1.89+. `CLAUDE_CODE_DISABLE_MOUSE=1` to keep flicker-free without mouse capture. `CLAUDE_CODE_SCROLL_SPEED=N` to adjust. Works in tmux (with `set -g mouse on`). Incompatible with iTerm2 `tmux -CC` integration mode. |
| 8 | **Transcript Search** | Press `/` in transcript mode to search conversation history. `n`/`N` step through matches. `less`-style navigation. | `Ctrl+O` to enter transcript mode, then `/query`, `n`/`N` to navigate, `Esc` to exit. `[` writes full conversation to native scrollback for terminal search. `v` opens in `$EDITOR`. | LOW | Ch1 (Introduction) or Ch4 (Environment) | Part of fullscreen rendering. Also works without flicker-free mode via `Ctrl+O`. |
| 9 | **Permission Modes Expansion** | Full permission mode system with 6 modes: `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. `dontAsk` mode auto-denies unpermitted tools for CI. | `Shift+Tab` to cycle. `--permission-mode dontAsk` for CI. Mode selector in VS Code, Desktop, Web. Protected paths never auto-approved in any mode. | MEDIUM | Ch3 (Models & Costs) / Ch11 (Security) | `dontAsk` is new -- only pre-approved tools run, everything else auto-denied. `acceptEdits` now also auto-approves `mkdir`, `touch`, `rm`, `mv`, `cp`, `sed` in working directory. |
| 10 | **Hook Events Expansion (26 total)** | Hook system expanded from 18 to 26 events. New events: `PermissionDenied`, `CwdChanged`, `FileChanged`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove`, `Elicitation`, `ElicitationResult`. | Configure in settings.json or agent/skill frontmatter. New `PermissionDenied` event fires on auto mode denials with `retry: true` option. | MEDIUM | Ch8 (Hooks) | New `defer` value for `permissionDecision` in PreToolUse: pauses `-p` sessions at tool call, exits with `deferred_tool_use` payload for SDK apps, resume with `--resume`. |

### Differentiators (Makes Guide Stand Out)

Features that, if covered well, make this guide more valuable than alternatives.

| # | Feature | Value Proposition | Complexity | Existing Chapter | Notes |
|---|---------|-------------------|------------|------------------|-------|
| 11 | **`/powerup` Interactive Lessons** | In-terminal animated demos teaching Claude Code features. Helps readers discover features they missed. | LOW | Ch1 (Introduction) | v2.1.90. Just run `/powerup`. Great for guide to mention as discovery tool. |
| 12 | **MCP Result-Size Override (per-tool, 500K cap)** | MCP server authors can raise truncation cap on specific tools via `anthropic/maxResultSizeChars` in `tools/list` metadata. Up to 500K characters. Keeps large payloads inline. | MEDIUM | Ch6 (MCP) | v2.1.91. Previously global cap. Now per-tool via `_meta` in tools/list response JSON. |
| 13 | **Plugin `bin/` Executables on PATH** | Place executables in plugin `bin/` directory; Claude Code adds it to Bash tool's PATH while plugin is enabled. Claude invokes as bare commands. | LOW | New plugins chapter | v2.1.91. Handy for packaging CLI helpers alongside commands/agents/hooks. |
| 14 | **Subagent Persistent Memory** | Subagents can maintain their own auto-memory across sessions via `memory` frontmatter field. Scopes: `user`, `project`, `local`. | MEDIUM | Ch9 (Worktrees/Subagents) | Stored at `~/.claude/agent-memory/<name>/` (user) or `.claude/agent-memory/<name>/` (project). MEMORY.md entrypoint with topic files. First 200 lines / 25KB loaded at start. |
| 15 | **Subagent `initialPrompt` Frontmatter** | Agents can auto-submit a first turn when running as main session agent (via `--agent` or `agent` setting). | LOW | Ch9 (Worktrees/Subagents) | Commands and skills processed in the prompt. Prepended to user-provided prompt. |
| 16 | **Subagent `isolation: worktree`** | Run subagent in a temporary git worktree giving it an isolated repo copy. Auto-cleaned if no changes. | MEDIUM | Ch9 (Worktrees/Subagents) | Combines worktree concept from Ch9 with subagent system. |
| 17 | **Subagent `background` Flag** | Subagents can run concurrently via `background: true` frontmatter or `Ctrl+B`. Pre-approves permissions upfront. Auto-denies unapproved tools. | MEDIUM | Ch9 (Worktrees/Subagents) | `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` to disable. |
| 18 | **Subagent `--agents` CLI Flag** | Define subagents inline as JSON at launch. Session-only, not saved to disk. | LOW | Ch9 (Worktrees/Subagents) | Useful for automation scripts and quick testing. |
| 19 | **Skills + Subagents Merged Understanding** | Skills with `context: fork` run in subagent. Subagents with `skills` field preload skill content. Two-way relationship now fully documented. | MEDIUM | Ch7 (Skills) / Ch9 (Subagents) | `paths` frontmatter on skills for glob-based auto-activation. `shell` frontmatter for PowerShell. |
| 20 | **`managed-settings.d/` Drop-in Directory** | Layered policy fragments for enterprise managed settings. | LOW | Ch11 (Security) | Enables modular policy management. |
| 21 | **`disableSkillShellExecution` Setting** | Blocks inline shell (`!command`) from skills, slash commands, and plugin commands. Managed settings cannot be overridden by users. | LOW | Ch7 (Skills) / Ch11 (Security) | Security control for enterprises. Bundled and managed skills unaffected. |
| 22 | **Plan Mode Approval Flow** | After plan completion, Claude presents 5 options: approve + auto mode, approve + acceptEdits, approve + manual review, keep planning, or refine with Ultraplan. | MEDIUM | Ch3 or new permissions section | Better documented flow for plan -> execute transition. |
| 23 | **Skills Content Lifecycle & Compaction** | Skills survive compaction with first 5,000 tokens re-attached. Combined budget of 25,000 tokens across all invoked skills. Most recently invoked skills prioritized. | MEDIUM | Ch7 (Skills) | Important for understanding why skills stop influencing behavior. |
| 24 | **Agent SDK Hooks as Callbacks** | SDK hooks use native callback functions (Python/TypeScript) instead of JSON config. Same events as CLI but programmatic. | MEDIUM | Agent SDK chapter | `HookMatcher` with matcher pattern + callback function array. |
| 25 | **Agent SDK Sessions (Resume + Fork)** | Capture session_id from init message, resume with `resume: session_id` option. Full context preserved. | MEDIUM | Agent SDK chapter | Key for multi-turn agent workflows. |

### Mention-Only (Too Niche, Volatile, or Experimental for Deep Coverage)

Reference these briefly. Do not deep-dive.

| # | Feature | Why Mention-Only | Where to Note | Notes |
|---|---------|------------------|---------------|-------|
| 26 | **PowerShell Tool (Windows)** | Preview, Windows-only, niche audience. | Ch4 (Environment) | `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`. Native cmdlets and Windows paths. |
| 27 | **PR Auto-Fix (Web)** | Web-only feature, toggle in CI panel. Very brief. | Ch5 (Remote & Headless) | Claude watches CI, fixes failures, handles nits, pushes until green. |
| 28 | **Voice Mode Improvements** | Push-to-talk modifier combos, Windows WebSocket, Apple Silicon mic. Incremental. | Ch1 (Introduction) | Just note voice improvements exist. |
| 29 | **`/buddy` Command** | April 1st joke. A small creature watches you code. | Skip entirely | Easter egg, not a real feature. |
| 30 | **Deep Links (`claude-cli://`)** | Multi-line prompt support, preferred terminal selection. | Ch5 (Remote & Headless) | Encoded `%0A` for newlines. Minor UX improvement. |
| 31 | **Pasted Image Chips** | `[Image #N]` chips for positional reference of pasted images. | Ch1 (Introduction) | Minor UX convenience. |
| 32 | **Edit Tool Enhancement** | Edit tool now works on files viewed via `cat` or `sed -n` without separate Read. | Ch1 (Introduction) | Minor DX improvement. |
| 33 | **Hook Output Size Cap** | Output over 50K saved to disk with path + preview instead of injected into context. | Ch8 (Hooks) | Prevents context bloat from verbose hooks. |
| 34 | **Thinking Summaries Default** | Off by default in interactive sessions. `showThinkingSummaries: true` to restore. | Ch3 (Models & Costs) | Behavioral change, brief note. |
| 35 | **`/status` While Responding** | Works mid-response now. | Ch1 (Introduction) | Minor UX fix. |
| 36 | **Idle-Return `/clear` Nudge** | After 75+ minutes away, suggests clearing context. | Ch1 (Introduction) | Minor UX improvement. |
| 37 | **Ctrl+X Ctrl+E External Editor** | Opens readline-style external editor for prompt input. | Ch1 (Introduction) | Matches readline convention. Minor. |
| 38 | **`/agents` UI Improvements** | Running tab, Library tab, Generate with Claude, color picker. | Ch9 (Subagents) | UX polish for agent management. |
| 39 | **LSP Server Plugins** | `.lsp.json` in plugins for code intelligence. | Plugins chapter | Niche -- pre-built plugins exist for common languages. |
| 40 | **Agent SDK Branding Rules** | "Claude Agent" OK, "Claude Code" not permitted in partner products. | Agent SDK section | Legal/branding, not user-facing. |
| 41 | **Skills `paths` Frontmatter** | Glob patterns for conditional skill activation based on working files. | Ch7 (Skills) | `paths: ["src/api/**/*.ts"]`. Auto-loads skill only when matching files are read. |
| 42 | **New Init Flow (`CLAUDE_CODE_NEW_INIT=1`)** | Multi-phase interactive `/init` that sets up CLAUDE.md, skills, and hooks. | Ch2 (Context Management) | Opt-in preview. Explores codebase with subagent, asks follow-up questions. |

---

## Feature Dependencies

```
Auto Mode (#1)
    requires Permission Modes Expansion (#9)
    enhances Security chapter (Ch11)
    interacts with Hook Events (#10) via PermissionDenied event

Computer Use (#2)
    requires MCP infrastructure (Ch6)
    enhances with Channels (#5) for remote verification

Agent SDK (#3)
    requires Subagents knowledge (Ch9)
    requires Hooks knowledge (Ch8)
    requires MCP knowledge (Ch6)
    enhances Remote & Headless (Ch5)

Conditional If Hooks (#4)
    enhances Hook Events (#10)
    requires existing Hooks chapter (Ch8)

Channels (#5)
    requires Plugins System (#6)
    requires MCP infrastructure (Ch6)
    enhances with Auto Mode (#1) for unattended operation

Plugins System (#6)
    enhances Skills (Ch7) via plugin skills
    enhances Subagents (Ch9) via plugin agents
    enhances MCP (Ch6) via plugin MCP servers
    enhances Hooks (Ch8) via plugin hooks

Fullscreen Rendering (#7)
    enhances Transcript Search (#8)
    independent of other features

Skills-Subagents Integration (#19)
    requires Skills (Ch7)
    requires Subagents (Ch9)
    context: fork <--> skills preloading are inverse patterns
```

### Dependency Notes

- **Auto Mode requires Permission Modes:** Auto mode is one of 6 permission modes. The guide must cover the full mode system before explaining auto mode specifics.
- **Agent SDK requires multiple chapters:** The SDK surfaces nearly every Claude Code feature programmatically. Readers need Hooks, MCP, Subagents, and Permissions understanding first.
- **Channels require Plugins:** Channels are installed as plugins and managed through the plugin system.
- **Fullscreen + Transcript Search are coupled:** Transcript search is part of the fullscreen rendering system. Cover together.
- **Skills and Subagents have bidirectional relationship:** Skills can run in subagents (`context: fork`), and subagents can preload skills (`skills` field). Both directions should be cross-referenced.

---

## Priority Definition (Guide Update Phases)

### Phase 1: Mandatory Updates (Existing Chapters)

Features that update existing chapters. The guide is factually incomplete without these.

- [x] **Hooks overhaul** (#4, #10, #33) -- Update Ch8 with 26 events (was 18), conditional `if` field, `defer` permission decision, `PermissionDenied` event, output size cap
- [x] **Permission modes** (#1, #9, #22) -- Update Ch3/Ch11 with 6-mode system, auto mode deep-dive, `dontAsk` mode, plan mode approval flow, protected paths list
- [x] **Skills updates** (#19, #21, #23, #41) -- Update Ch7 with `paths` frontmatter, `shell` frontmatter, content lifecycle/compaction behavior, `disableSkillShellExecution`, skills-subagents relationship
- [x] **Subagents updates** (#14, #15, #16, #17, #18, #38) -- Update Ch9 with persistent memory, `initialPrompt`, `isolation: worktree`, background flag, `--agents` CLI flag, `/agents` UI
- [x] **MCP updates** (#12) -- Update Ch6 with per-tool result-size override, channels mention with forward reference
- [x] **Memory updates** (#42) -- Update Ch2 with new `/init` flow, any memory behavior changes
- [x] **Minor UX notes** (#26, #27, #31, #32, #34, #35, #36, #37) -- Scatter through relevant chapters

### Phase 2: New Sections/Chapters

Features requiring new content that does not exist in the guide.

- [x] **Auto Mode** (#1) -- New dedicated section within permissions/security coverage. Classifier behavior, what's blocked/allowed, subagent handling, cost/latency, fallback behavior
- [x] **Computer Use** (#2) -- New section or chapter. CLI and Desktop setup, per-app approval, safety model, use cases, platform differences
- [x] **Agent SDK** (#3) -- New chapter. Installation, query API, built-in tools, hooks as callbacks, subagents, MCP, permissions, sessions, comparison with CLI
- [x] **Plugins** (#6, #13) -- New chapter. Manifest, directory structure, skills/agents/hooks/MCP/LSP components, `bin/` executables, `userConfig`, marketplaces, migration from standalone
- [x] **Channels** (#5) -- New section within MCP or standalone. Telegram/Discord/iMessage setup, security model, enterprise controls, comparison with other features
- [x] **Fullscreen Rendering** (#7, #8) -- New section. Environment setup, mouse support, transcript mode + search, tmux compatibility

### Phase 3: Polish and Cross-References

- [x] Update cheatsheet page with new slash commands (`/powerup`, `/agents`, `/memory`, `/mcp`, `/plugin`)
- [x] Cross-reference skills <-> subagents bidirectional relationship
- [x] Cross-reference auto mode <-> hooks (PermissionDenied event)
- [x] Cross-reference channels <-> plugins
- [x] Verify all version numbers and plan requirements

---

## Feature Prioritization Matrix

| Feature | Reader Value | Writing Cost | Priority |
|---------|-------------|--------------|----------|
| Auto Mode | HIGH | HIGH | P1 |
| Permission Modes (full system) | HIGH | MEDIUM | P1 |
| Hooks Overhaul (26 events + if) | HIGH | MEDIUM | P1 |
| Agent SDK | HIGH | HIGH | P1 |
| Computer Use | HIGH | MEDIUM | P1 |
| Plugins System | HIGH | HIGH | P1 |
| Subagent Updates (memory, background, etc.) | HIGH | MEDIUM | P1 |
| Skills Updates (paths, lifecycle) | MEDIUM | MEDIUM | P1 |
| Channels | MEDIUM | MEDIUM | P2 |
| Fullscreen Rendering | MEDIUM | LOW | P2 |
| MCP Result-Size Override | MEDIUM | LOW | P2 |
| Transcript Search | MEDIUM | LOW | P2 |
| /powerup Lessons | LOW | LOW | P2 |
| Plugin bin/ on PATH | LOW | LOW | P3 |
| PowerShell Tool | LOW | LOW | P3 |
| PR Auto-Fix | LOW | LOW | P3 |
| Agent SDK Branding | LOW | LOW | P3 |
| Minor UX improvements | LOW | LOW | P3 |

**Priority key:**
- P1: Must have -- guide is incomplete without it
- P2: Should have -- adds significant value
- P3: Nice to have -- brief mention sufficient

---

## Detailed Feature Behaviors

### Auto Mode (Deep Dive)

**What it does:** A background classifier model (Sonnet 4.6) reviews each tool call before execution. Safe actions proceed silently. Destructive, suspicious, or out-of-scope actions are blocked.

**How users interact:**
1. Press `Shift+Tab` to cycle to auto mode (must be enabled first)
2. Or set `"permissions": { "defaultMode": "auto" }` in settings
3. Or start with `claude --enable-auto-mode`

**What the classifier blocks by default:**
- `curl | bash` (download + execute)
- Sending sensitive data to external endpoints
- Production deploys and migrations
- Mass cloud storage deletion
- IAM/repo permission grants
- Force push or push to main
- Destroying pre-existing files

**What it allows by default:**
- Local file ops in working directory
- Installing declared dependencies
- Reading `.env` and sending credentials to matching API
- Read-only HTTP requests
- Pushing to current branch or Claude-created branch
- Sandbox network access

**Fallback behavior:**
- 3 consecutive blocks or 20 total blocks -> pauses auto mode, resumes prompting
- Approving the prompted action resumes auto mode
- In `-p` mode, repeated blocks abort the session

**Subagent handling:**
1. Task description evaluated at spawn
2. Each subagent action goes through classifier
3. Full action history reviewed on return
4. `permissionMode` in subagent frontmatter is ignored during auto mode

**Availability requirements:**
- Team, Enterprise, or API plan (NOT Pro/Max)
- Sonnet 4.6 or Opus 4.6 model
- Anthropic API provider only
- Admin must enable on Team/Enterprise

**Configuration:**
- `permissions.disableAutoMode: "disable"` in managed settings to block
- `autoMode.environment` for trusted repos/buckets/services
- `claude auto-mode defaults` to view full rule lists

### Computer Use (Deep Dive)

**What it does:** Claude opens native apps on your actual desktop, controls mouse/keyboard, takes screenshots, and verifies changes visually.

**CLI setup:**
1. Run `/mcp` in interactive session
2. Find and enable `computer-use` server
3. Grant macOS Accessibility + Screen Recording permissions
4. Ask Claude to interact with a GUI app

**Per-session app approval:**
- Each new app requires explicit approval per session
- Shows which apps Claude wants + extra permissions needed
- Warning tiers: "Equivalent to shell access" (terminals), "Can read/write any file" (Finder), "Can change system settings" (System Settings)

**Safety model:**
- Per-app approval required each session
- Terminal excluded from screenshots (prevents feedback loops)
- `Esc` key aborts from anywhere (consumed, not passable to dialogs)
- Machine-wide lock (one session at a time)
- Other apps hidden during control
- NOT sandboxed like Bash tool

**App control tiers:**
- Browsers + trading platforms: view-only
- Terminals + IDEs: click-only
- Everything else: full control

**Screenshots:** Auto-downscaled for Retina (e.g., 3456x2234 -> ~1372x887)

**CLI vs Desktop differences:**
- CLI: macOS only, enable via `/mcp`
- Desktop: macOS + Windows, enable in Settings > General

### Agent SDK (Deep Dive)

**What it is:** Python and TypeScript SDKs that expose Claude Code's agent loop, tools, and context management as a library for building production AI agents.

**Installation:**
```bash
pip install claude-agent-sdk        # Python
npm install @anthropic-ai/claude-agent-sdk  # TypeScript
```

**Core API:**
```python
async for message in query(
    prompt="Find and fix the bug",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"])
):
    print(message)
```

**Built-in tools:** Read, Write, Edit, Bash, Monitor (new), Glob, Grep, WebSearch, WebFetch, AskUserQuestion

**Key capabilities:**
- Hooks as native callback functions (not JSON)
- Subagents via `AgentDefinition` objects
- MCP servers via `mcp_servers` option
- Permission modes via `permission_mode` option
- Session resume via `resume: session_id`
- Skills/commands/memory via `setting_sources=["project"]`
- Plugins via `plugins` option

**Authentication:** ANTHROPIC_API_KEY, Bedrock, Vertex AI, Azure Foundry

**vs CLI:** Same capabilities. CLI for interactive dev, SDK for CI/CD, custom apps, production automation.

### Channels (Deep Dive)

**What it does:** MCP servers that push external events into your running session. Two-way: Claude reads event and replies through the same channel.

**Supported channels:**
- Telegram (via BotFather bot)
- Discord (via Discord bot)
- iMessage (reads Messages database, replies via AppleScript, macOS only)
- fakechat (localhost demo)

**Security model:**
- Sender allowlist per channel
- Pairing codes for Telegram/Discord
- Per-handle access for iMessage
- `--channels` flag controls which servers active per session
- Permission relay capability for remote tool approval

**Enterprise controls:**
- `channelsEnabled` managed setting (master switch, off by default for Team/Enterprise)
- `allowedChannelPlugins` to restrict which plugins can register
- Pro/Max users skip these checks

### Plugins System (Deep Dive)

**Plugin structure:**
```
my-plugin/
  .claude-plugin/
    plugin.json          # Manifest (name, description, version, author)
  skills/                # SKILL.md directories
  commands/              # Legacy flat Markdown skills
  agents/                # AGENT.md files
  hooks/
    hooks.json           # Hook configurations
  .mcp.json              # MCP server configs
  .lsp.json              # LSP server configs
  bin/                   # Executables added to PATH
  settings.json          # Default settings (currently only `agent` key)
```

**Key behaviors:**
- Skills namespaced as `/plugin-name:skill-name`
- `--plugin-dir` for local development
- `/reload-plugins` picks up changes without restart
- `userConfig` for settings at enable time (keychain-backed secrets)
- Plugin subagents cannot use `hooks`, `mcpServers`, or `permissionMode` (security restriction)
- Official marketplace submission via claude.ai or Console

### Fullscreen Rendering (Deep Dive)

**What it changes:**
- Alt-screen buffer (like vim) instead of terminal scrollback
- Prompt input pinned to bottom
- Only visible messages rendered (flat memory)
- Mouse support for click, drag-select, scroll, URL click, expand/collapse

**Env vars:**
- `CLAUDE_CODE_NO_FLICKER=1` to enable
- `CLAUDE_CODE_DISABLE_MOUSE=1` to disable mouse capture only
- `CLAUDE_CODE_SCROLL_SPEED=N` (1-20) to adjust scroll speed

**Transcript mode (`Ctrl+O`):**
- Three states: normal -> transcript -> focus view -> normal
- `/` to search, `n`/`N` for next/prev match
- `[` to write conversation to native scrollback
- `v` to open in `$EDITOR`
- Full `less`-style navigation (j/k, g/G, Ctrl+u/d, etc.)

---

## Chapter Impact Summary

| Existing Chapter | Updates Needed | New Features |
|-----------------|----------------|--------------|
| Ch1 Introduction | Fullscreen rendering, transcript search, /powerup, image chips, edit tool enhancement, Ctrl+X Ctrl+E, /status, idle nudge | Minor additions |
| Ch2 Context Management | New /init flow, memory/rules clarifications | Minor |
| Ch3 Models & Costs | Permission modes system, thinking summaries default change | Moderate |
| Ch4 Environment | PowerShell tool mention, fullscreen rendering section | Moderate |
| Ch5 Remote & Headless | PR auto-fix mention, deep links, Agent SDK forward reference | Minor |
| Ch6 MCP | Per-tool result-size override, channels section, computer-use as built-in MCP | Significant |
| Ch7 Skills | paths frontmatter, shell frontmatter, content lifecycle, disableSkillShellExecution, skills<->subagents relationship | Significant |
| Ch8 Hooks | 26 events (was 18), conditional if, defer decision, PermissionDenied event, output cap, new handler fields | Significant |
| Ch9 Worktrees/Subagents | Persistent memory, initialPrompt, isolation: worktree, background flag, --agents CLI, /agents UI, color, effort | Significant |
| Ch10 Agent Teams | Minor -- subagent resume via SendMessage | Minor |
| Ch11 Security | Auto mode section, managed-settings.d/, disableSkillShellExecution, protected paths, classifier architecture | Significant |
| NEW: Plugins | Full chapter needed | Major |
| NEW: Agent SDK | Full chapter needed | Major |
| NEW: Computer Use | Full section or chapter needed | Major |
| NEW: Channels | Section within MCP or standalone | Moderate |

---

## Sources

- https://code.claude.com/docs/en/whats-new (W13: March 23-27, W14: March 30 - April 3)
- https://code.claude.com/docs/en/whats-new/2026-w13
- https://code.claude.com/docs/en/whats-new/2026-w14
- https://code.claude.com/docs/en/hooks (26 events, conditional if, defer)
- https://code.claude.com/docs/en/skills (paths, shell, lifecycle, disableSkillShellExecution)
- https://code.claude.com/docs/en/mcp (per-tool override, channels, plugin MCP)
- https://code.claude.com/docs/en/memory (auto memory, /memory command, rules)
- https://code.claude.com/docs/en/agent-sdk (renamed SDK, Python + TypeScript)
- https://code.claude.com/docs/en/sub-agents (memory, initialPrompt, isolation, background, --agents)
- https://code.claude.com/docs/en/computer-use (CLI computer use)
- https://code.claude.com/docs/en/permission-modes (6 modes including auto, dontAsk)
- https://code.claude.com/docs/en/plugins (plugin system, manifest, structure)
- https://code.claude.com/docs/en/channels (Telegram, Discord, iMessage, security)
- https://code.claude.com/docs/en/fullscreen (flicker-free rendering, mouse, transcript search)

---
*Feature research for: Claude Code Guide Refresh (April 2026)*
*Researched: 2026-04-12*
