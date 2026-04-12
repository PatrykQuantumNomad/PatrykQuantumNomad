# Stack Research: Claude Code Feature Inventory (Feb-Apr 2026)

**Domain:** Claude Code guide content refresh -- new features, changes, and deprecations
**Researched:** 2026-04-12
**Confidence:** HIGH (sourced from official docs and changelog at code.claude.com)

## Purpose

Complete inventory of Claude Code features released between the guide's publication (2026-03-15) and today (2026-04-12), plus features from the Feb-Mar window that may have been in-flight during original authoring. This informs which guide chapters need updates and whether new chapters are needed.

---

## Existing Guide Chapters (published 2026-03-15)

| # | Chapter | Topics Covered |
|---|---------|----------------|
| 1 | Introduction | What Claude Code is, installation, first session |
| 2 | Context Management | CLAUDE.md, auto memory, context window |
| 3 | Models & Costs | Model selection, effort levels, token costs |
| 4 | Environment | Settings, env vars, configuration |
| 5 | Remote & Headless | Non-interactive mode, CI/CD, headless |
| 6 | MCP | Model Context Protocol servers |
| 7 | Custom Skills | Slash commands, skills, custom commands |
| 8 | Hooks | PreToolUse, PostToolUse, lifecycle hooks |
| 9 | Worktrees | Git worktrees, parallel sessions |
| 10 | Agent Teams | Subagents, multi-agent orchestration |
| 11 | Security & Enterprise | Permissions, sandboxing, managed settings |

---

## MAJOR NEW FEATURES (Require New Content or Significant Rewrites)

### 1. Computer Use (Research Preview)

**Released:** Week 13 (Mar 23-27) Desktop, Week 14 (Mar 30-Apr 3) CLI
**Versions:** v2.1.83+ (Desktop), v2.1.85+ (CLI)
**Status:** Research preview, Pro/Max plans only
**Confidence:** HIGH

Claude can control the native desktop: open apps, click, type, screenshot, and verify GUI changes. Available in both Desktop app (macOS + Windows) and CLI (macOS only).

**Key details:**
- Enable via `/mcp` menu, toggle `computer-use` MCP server
- Requires macOS Accessibility + Screen Recording permissions
- Per-app approval per session; apps categorized by trust tier
- Machine-wide lock (one session at a time)
- Not available in `-p` mode, not on Team/Enterprise
- Not on Bedrock/Vertex/Foundry -- requires claude.ai auth
- Fallback hierarchy: MCP > Bash > Chrome > Computer Use

**Guide impact:** NEW SECTION needed. Could be standalone chapter or added to an existing chapter (MCP or a new "Browser & Desktop Automation" chapter). Significant feature with detailed safety model.

---

### 2. Auto Mode (Research Preview)

**Released:** Week 13 (Mar 23-27, 2026)
**Versions:** v2.1.83+
**Status:** Research preview
**Confidence:** HIGH

A classifier-based permission mode. Safe actions auto-approved; destructive/suspicious ones blocked. Middle ground between manual approval and `--dangerously-skip-permissions`.

**Key details:**
- Requires: Team, Enterprise, or API plan + Sonnet 4.6 or Opus 4.6 + Anthropic API
- NOT available on Pro/Max, NOT on Bedrock/Vertex/Foundry
- Classifier runs on Sonnet 4.6 regardless of session model (adds cost)
- Admin must enable in Claude Code admin settings
- Blocks: curl|bash, production deploys, force push, IAM changes, mass deletion
- Allows: local file ops, dependency installs, read-only HTTP, branch push
- Falls back after 3 consecutive or 20 total blocks
- `claude auto-mode defaults` prints full rule list
- `--enable-auto-mode` flag, `defaultMode: "auto"` in settings
- `PermissionDenied` hook fires on classifier denials (v2.1.89)

**Guide impact:** MAJOR UPDATE to Security & Enterprise chapter (Ch 11). Auto mode is a new permission mode that sits alongside the existing `default`, `acceptEdits`, `plan`, `dontAsk`, `bypassPermissions`. The permission modes section needs restructuring.

---

### 3. Channels (Research Preview)

**Released:** v2.1.80 (Mar 19, 2026) initial, v2.1.81+ expanded
**Status:** Research preview, requires claude.ai login
**Confidence:** HIGH

MCP servers that push events INTO a running session. Two-way communication: Claude reads events and replies back through the same channel. Supported: Telegram, Discord, iMessage, custom webhook.

**Key details:**
- Install as plugins from `claude-plugins-official` marketplace
- `--channels plugin:telegram@claude-plugins-official` flag
- Sender allowlist security model with pairing codes
- Enterprise: `channelsEnabled` and `allowedChannelPlugins` managed settings
- Permission relay capability for remote tool approval
- Each channel plugin requires Bun runtime
- Events only arrive while session is open

**Guide impact:** NEW SECTION needed. This is a significant integration feature. Could be part of Remote & Headless chapter (Ch 5) or warrant its own section. Connects to Plugins ecosystem.

---

### 4. Plugins System (Mature)

**Released:** Matured significantly Mar-Apr 2026
**Status:** GA (marketplace, install, create, share)
**Confidence:** HIGH

Full plugin ecosystem with marketplace, skills, agents, hooks, MCP servers, LSP servers, and `bin/` executables.

**Key details:**
- `.claude-plugin/plugin.json` manifest
- Namespaced skills: `/plugin-name:skill-name`
- `claude plugin install name@marketplace`, `/reload-plugins`
- `userConfig` for settings at enable time, keychain-backed secrets (v2.1.85)
- `bin/` directory executables on Bash PATH (v2.1.91)
- `settings.json` for default plugin settings including `agent` key
- LSP server support (`.lsp.json`)
- Plugin marketplace creation and distribution
- `--plugin-dir` for local development
- `disableSkillShellExecution` setting (v2.1.91)
- `claude plugin validate` for frontmatter checking (v2.1.77)

**Guide impact:** NEW CHAPTER likely needed. The existing Custom Skills chapter (Ch 7) covers standalone skills but not the full plugin system. Plugins are now the distribution mechanism for skills, agents, hooks, and MCP servers combined.

---

### 5. Scheduled Tasks and /loop

**Released:** v2.1.71 (Mar 7, 2026) `/loop` + cron tools, cloud/desktop tasks matured
**Status:** GA
**Confidence:** HIGH

Three-tier scheduling system: `/loop` (session-scoped), Desktop scheduled tasks, Cloud scheduled tasks.

**Key details:**
- `/loop 5m check the deploy` -- fixed interval
- `/loop check the deploy` -- Claude chooses interval dynamically
- `/loop` bare -- built-in maintenance prompt or custom `loop.md`
- `CronCreate`, `CronList`, `CronDelete` tools
- 7-day auto-expiry for recurring tasks
- Monitor tool for streaming background script events
- Cloud tasks via `/schedule` -- survive machine off
- Desktop tasks -- local files, configurable permissions
- `CLAUDE_CODE_DISABLE_CRON=1` to disable

**Guide impact:** NEW SECTION needed. This is a significant workflow feature not covered in any existing chapter. Could be added to Remote & Headless (Ch 5) or a new "Automation & Scheduling" section.

---

### 6. Chrome Browser Integration (Beta)

**Released:** Pre-dates guide but significantly evolved
**Status:** Beta
**Confidence:** HIGH

Claude controls Chrome/Edge browser tabs: navigate, click, type, read console, record GIFs. Uses Claude in Chrome extension with native messaging.

**Key details:**
- `claude --chrome` or `/chrome` to enable
- Requires Claude in Chrome extension v1.0.36+
- Inherits browser login state
- Capabilities: live debugging, design verification, form filling, data extraction
- Session recording as GIFs
- Site-level permissions from Chrome extension
- Not available via Bedrock/Vertex/Foundry

**Guide impact:** NEW SECTION needed. Works alongside Computer Use (Computer Use is for native apps when Chrome can't reach them).

---

### 7. Remote Control (Evolved Significantly)

**Released:** Pre-dates guide but major additions in Mar-Apr 2026
**Versions:** v2.1.51+ base, significant improvements through v2.1.101
**Confidence:** HIGH

Continue local CLI sessions from phone/browser/mobile app. Session runs locally; web/mobile are just windows into it.

**Key additions since guide publication:**
- Server mode with `--spawn` (same-dir, worktree, session), `--capacity N`
- `--remote-control-session-name-prefix` for auto-naming
- VS Code `/remote-control` command (v2.1.79)
- QR code display for mobile pairing
- Enable for all sessions via `/config`
- Improved session titles, connection resilience

**Guide impact:** UPDATE Remote & Headless chapter (Ch 5). Remote Control has matured significantly with server mode and multi-session support.

---

### 8. Desktop App (New Surface)

**Released:** Mar 2026, evolved rapidly
**Status:** GA
**Confidence:** HIGH

Standalone app with Code tab (local coding), Cowork tab (cloud VM agent), Chat tab. Key features beyond CLI:
- Visual diff review with inline comments
- Live app preview with dev server
- PR monitoring with auto-merge and auto-fix (Web, v2.1.83)
- Dispatch (message tasks from mobile app)
- Computer Use integration
- Scheduled tasks UI
- SSH session support

**Guide impact:** The existing guide focuses on CLI. Desktop app may warrant a mention/section in the Introduction chapter or a dedicated section for Desktop-specific workflows.

---

### 9. Slack Integration

**Released:** Mar 2026
**Status:** GA
**Confidence:** HIGH

Mention `@Claude` in Slack channels for coding tasks. Auto-detects coding intent, creates Claude Code web session, posts updates to thread.

**Key details:**
- Code only or Code + Chat routing modes
- Context gathering from threads/channels
- Repository auto-selection
- Action buttons: View Session, Create PR, Retry as Code, Change Repo
- Requires Claude Code on the web access + GitHub

**Guide impact:** NEW SECTION possible. Could fit in Remote & Headless (Ch 5) or a new integrations overview.

---

## SIGNIFICANT UPDATES TO EXISTING FEATURES

### 10. Permission Modes Restructured

**Versions:** v2.1.83+
**Confidence:** HIGH

Full permission mode system now documented as first-class concept:
- `default` -- reads only auto-approved
- `acceptEdits` -- reads + file edits + safe filesystem commands auto-approved
- `plan` -- research and propose, no edits
- `auto` -- classifier-based (NEW, see #2 above)
- `dontAsk` -- only pre-approved tools
- `bypassPermissions` -- everything except protected paths
- `Shift+Tab` cycling with configurable mode set
- Protected paths list (`.git`, `.vscode`, `.idea`, `.husky`, `.claude` partial)

**Guide impact:** UPDATE Security & Enterprise chapter (Ch 11). Major restructuring of permissions content.

---

### 11. Hooks System Updates

**Versions:** v2.1.69-v2.1.101
**Confidence:** HIGH

New hook events and capabilities:
- `if` conditional field using permission rule syntax (v2.1.85)
- `PermissionDenied` hook on auto mode denials (v2.1.89)
- `defer` permission decision for headless sessions (v2.1.89)
- `CwdChanged` and `FileChanged` hook events (v2.1.83)
- `TaskCreated` hook (v2.1.84)
- `WorktreeCreate` hook HTTP support (v2.1.84)
- `StopFailure` hook on API error turn end (v2.1.78)
- `InstructionsLoaded` hook (v2.1.69)
- `Elicitation` and `ElicitationResult` hooks (v2.1.76)
- `PostCompact` hook (v2.1.76)
- `TeammateIdle`, `TaskCreated`, `TaskCompleted` hooks for agent teams
- Hook output >50K saved to disk with path + preview (v2.1.89)
- Hook source display in permission prompts (v2.1.75)
- `agent_id` and `agent_type` added to hook events (v2.1.69)

**Guide impact:** UPDATE Hooks chapter (Ch 8). Significant new hook events and the `if` conditional feature.

---

### 12. MCP Updates

**Versions:** v2.1.76-v2.1.101
**Confidence:** HIGH

- MCP elicitation support -- interactive dialog for structured input (v2.1.76)
- Per-tool result-size override via `_meta["anthropic/maxResultSizeChars"]` up to 500K (v2.1.91)
- MCP OAuth following RFC 9728 Protected Resource Metadata (v2.1.85)
- OAuth Client ID Metadata Document support (v2.1.81)
- MCP tool/server instructions capped at 2KB (v2.1.84)
- MCP servers deduplicated, local config wins (v2.1.84)
- `CLAUDE_CODE_MCP_SERVER_NAME` and `CLAUDE_CODE_MCP_SERVER_URL` env vars (v2.1.85)
- `MCP_CONNECTION_NONBLOCKING=true` for `-p` mode (v2.1.89)

**Guide impact:** UPDATE MCP chapter (Ch 6). Elicitation and per-tool result-size are notable additions.

---

### 13. Agent System Updates

**Versions:** v2.1.69-v2.1.101
**Confidence:** HIGH

- `/agents` tabbed layout with Running tab and Library tab (v2.1.98)
- `initialPrompt` frontmatter for auto-submit on agent start (v2.1.83)
- Named subagents in `@` mention typeahead (v2.1.89)
- Agent `model` parameter restored for per-invocation overrides (v2.1.72)
- `effort`, `maxTurns`, `disallowedTools` frontmatter for plugin agents (v2.1.78)
- `--agents` flag for dynamic JSON-defined subagents (CLI reference)
- `--teammate-mode` flag: auto, in-process, tmux

**Guide impact:** UPDATE Agent Teams chapter (Ch 10). New frontmatter fields, `/agents` UI, dynamic agent creation.

---

### 14. Models & Effort Level Changes

**Versions:** v2.1.72-v2.1.101
**Confidence:** HIGH

- 1M context for Opus 4.6 by default for Max, Team, Enterprise (v2.1.75)
- Increased default max output tokens: Opus 4.6 64k, upper bound 128k (v2.1.77)
- Default effort level changed from medium to high for API/Bedrock/Vertex/Team/Enterprise (v2.1.94)
- Simplified effort levels: low/medium/high (removed max, except Opus 4.6) (v2.1.72)
- `/effort` slash command (v2.1.76)
- `--effort` CLI flag (session-scoped, does not persist) -- low/medium/high/max(Opus only)
- `--fallback-model` for automatic fallback on overload (print mode)
- Thinking summaries off by default (set `showThinkingSummaries: true` to restore)
- Per-model and cache-hit breakdown in `/cost` for subscription users (v2.1.92)

**Guide impact:** UPDATE Models & Costs chapter (Ch 3). Significant changes to effort levels and context sizes.

---

### 15. Environment & Settings Updates

**Versions:** v2.1.69-v2.1.101
**Confidence:** HIGH

New settings and env vars:
- `managed-settings.d/` drop-in directory for layered policy fragments (v2.1.83)
- `autoMemoryDirectory` for custom auto-memory storage (v2.1.74)
- `modelOverrides` for custom model picker entries (v2.1.73)
- `disableSkillShellExecution` to block inline shell in skills (v2.1.91)
- `forceRemoteSettingsRefresh` for fail-closed managed settings (v2.1.92)
- `CLAUDE_CODE_NO_FLICKER=1` for flicker-free alt-screen rendering (v2.1.89)
- `CLAUDE_CODE_PERFORCE_MODE` for p4 edit hints (v2.1.98)
- `CLAUDE_CODE_USE_POWERSHELL_TOOL` for Windows PowerShell (v2.1.84)
- `CLAUDE_CODE_USE_MANTLE=1` for Bedrock via Mantle (v2.1.94)
- `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` to strip credentials from subprocesses (v2.1.83)
- `CLAUDE_CODE_DISABLE_CRON=1` to disable scheduler (v2.1.72)
- `--exclude-dynamic-system-prompt-sections` for cross-user prompt caching (v2.1.98)
- `--setting-sources` to control which setting sources load (v2.1.98)
- `--bare` mode for faster scripted calls (v2.1.81)

**Guide impact:** UPDATE Environment chapter (Ch 4). Many new env vars and settings.

---

### 16. Headless & SDK Updates

**Versions:** v2.1.69-v2.1.101
**Confidence:** HIGH

- `--bare` flag skips auto-discovery of hooks, LSP, plugins, MCP, auto memory, CLAUDE.md (v2.1.81)
- `defer` permission decision for PreToolUse hooks in headless sessions (v2.1.89)
- `--no-session-persistence` for ephemeral sessions (print mode)
- `--json-schema` for structured outputs after agent workflow (print mode)
- `--from-pr` to resume sessions linked to GitHub PR (CLI reference)
- `--teleport` to resume web session in local terminal
- `--remote` to create web session from CLI
- `claude setup-token` for long-lived OAuth tokens in CI
- Monitor tool for streaming background script events (v2.1.98)

**Guide impact:** UPDATE Remote & Headless chapter (Ch 5). New `--bare` mode and structured outputs are significant.

---

### 17. Worktree & Session Updates

**Versions:** v2.1.72-v2.1.101
**Confidence:** HIGH

- `worktree.sparsePaths` setting for sparse-checkout in monorepos (v2.1.76)
- `ExitWorktree` tool (v2.1.72)
- `--fork-session` flag for resume without reusing session ID
- `/rename` for mid-session name changes
- `/fork` renamed to `/branch` (v2.1.77)
- `--resume` improvements: accept session titles from `/rename`, PR-linked sessions
- Session names displayed on prompt bar

**Guide impact:** UPDATE Worktrees chapter (Ch 9). Sparse paths and ExitWorktree are notable additions.

---

## NEW COMMANDS AND SLASH COMMANDS

| Command | Version | Description |
|---------|---------|-------------|
| `/powerup` | v2.1.90 | Interactive lessons with animated demos |
| `/loop` | v2.1.71 | Run prompts repeatedly on schedule |
| `/effort` | v2.1.76 | Set effort level mid-session |
| `/color` | v2.1.75 | Customize prompt color for all users |
| `/context` | v2.1.74 | Actionable context-window suggestions |
| `/release-notes` | v2.1.92 | Interactive version picker for release notes |
| `/team-onboarding` | v2.1.91 | Generate teammate ramp-up guide |
| `/claude-api` | v2.1.69 | Skill for Claude API/Anthropic SDK apps |
| `/schedule` | - | Create cloud scheduled tasks |
| `/chrome` | - | Toggle Chrome browser integration |
| `/mobile` | - | QR code to download Claude mobile app |
| `/insights` | - | Session insights report |

**Removed commands:**
- `/tag` -- removed (v2.1.92)
- `/vim` -- removed, toggle via `/config` (v2.1.92)
- `/output-style` -- deprecated, fixed at session start (v2.1.73)

---

## DEPRECATIONS AND BREAKING CHANGES

| Item | Version | Details |
|------|---------|---------|
| `/tag` command | v2.1.92 | Removed |
| `/vim` command | v2.1.92 | Removed; use `/config` > Editor mode |
| `/output-style` | v2.1.73 | Deprecated; fixed at session start for prompt caching |
| `TaskOutput` tool | v2.1.83 | Deprecated in favor of Read on output file path |
| Windows managed settings fallback | v2.1.75 | Removed `C:\ProgramData\ClaudeCode\managed-settings.json` |
| Agent tool `resume` parameter | v2.1.77 | No longer accepted |
| Thinking summaries | v2.1.89 | Off by default; set `showThinkingSummaries: true` to restore |
| Default effort level | v2.1.94 | Changed from medium to high for API/Bedrock/Vertex/Team/Enterprise |
| `cleanupPeriodDays: 0` | v2.1.89 | Now rejected with validation error |
| `Ctrl+F` for stop background agents | v2.1.83 | Changed to `Ctrl+X Ctrl+K` |

---

## SECURITY HARDENING (Significant since guide publication)

**Versions:** v2.1.78-v2.1.101
**Confidence:** HIGH

Extensive Bash tool permission security fixes:
- Backslash-escaped flag bypass fixed (v2.1.98)
- Compound command forced-prompt bypass fixed (v2.1.98)
- Env-var prefix read-only commands now prompt unless known-safe (v2.1.98)
- `/dev/tcp` and `/dev/udp` redirect prompting (v2.1.98)
- PowerShell trailing `&`, `-ErrorAction Break`, archive TOCTOU hardening (v2.1.90)
- Command injection in POSIX `which` fallback for LSP detection fixed (v2.1.101)
- Nested skill discovery loading from gitignored directories fixed (v2.1.69)
- Trust dialog per-server MCP approval (v2.1.69)
- `sandbox.failIfUnavailable` setting (v2.1.83)
- Subprocess sandboxing with PID namespace isolation on Linux (v2.1.98)

**Guide impact:** UPDATE Security & Enterprise chapter (Ch 11). Security posture has improved significantly.

---

## NEW PLATFORM SUPPORT

| Platform/Surface | Details |
|-----------------|---------|
| PowerShell tool (Windows) | Opt-in preview via `CLAUDE_CODE_USE_POWERSHELL_TOOL=1` (v2.1.84) |
| Desktop App (macOS + Windows) | Full GUI surface with Code/Cowork/Chat tabs |
| Slack integration | @Claude mention routing to Claude Code web sessions |
| Vertex AI setup wizard | Interactive setup from login screen (v2.1.98) |
| Bedrock setup wizard | Interactive setup from login screen (v2.1.92) |
| Bedrock via Mantle | `CLAUDE_CODE_USE_MANTLE=1` (v2.1.94) |
| Homebrew stable/latest casks | `claude-code` (stable) vs `claude-code@latest` (latest) |
| WinGet install | `winget install Anthropic.ClaudeCode` |
| Native install scripts | `curl -fsSL https://claude.ai/install.sh \| bash` and PowerShell/CMD equivalents |
| Voice mode improvements | 10 new STT languages (20 total), push-to-talk improvements (v2.1.69+) |

---

## GUIDE CHAPTER IMPACT MATRIX

| Chapter | Impact Level | Key Changes |
|---------|-------------|-------------|
| Ch 1: Introduction | MODERATE | New surfaces (Desktop, Web, Slack), new install methods, /powerup |
| Ch 2: Context Management | LOW | `autoMemoryDirectory` setting, `PostCompact` hook, MEMORY.md index truncating |
| Ch 3: Models & Costs | HIGH | 1M context Opus, effort level changes, default effort high, /effort command |
| Ch 4: Environment | HIGH | Many new env vars, settings, `--bare`, NO_FLICKER, managed-settings.d/ |
| Ch 5: Remote & Headless | HIGH | Remote Control server mode, Channels, Scheduled Tasks, Slack, --bare, --teleport |
| Ch 6: MCP | MODERATE | Elicitation, per-tool result-size, OAuth improvements, computer-use MCP |
| Ch 7: Custom Skills | HIGH | Full Plugins system, marketplace, LSP, bin/, plugin conversion |
| Ch 8: Hooks | HIGH | Conditional `if`, PermissionDenied, CwdChanged, FileChanged, 6+ new events |
| Ch 9: Worktrees | LOW | sparsePaths, ExitWorktree, /branch rename |
| Ch 10: Agent Teams | MODERATE | /agents UI, initialPrompt, dynamic agents, agent frontmatter fields |
| Ch 11: Security & Enterprise | HIGH | Auto mode, permission modes restructured, extensive Bash hardening |

### Potential New Chapters/Sections

| Topic | Rationale |
|-------|-----------|
| Plugins | Too large for the existing Skills chapter. Full ecosystem with marketplace, distribution, multi-component packages |
| Browser & Desktop Automation | Chrome integration + Computer Use form a coherent "GUI automation" story |
| Scheduling & Automation | /loop, cron tools, cloud/desktop scheduled tasks, Monitor tool |
| Desktop App & Surfaces | Desktop app, Web, Slack, Remote Control server mode -- the "surfaces" story |
| Cheatsheet Page | Standalone reference page (not a chapter) |

---

## Sources

- https://code.claude.com/docs/en/whats-new -- Weekly digests (Weeks 13-14)
- https://code.claude.com/docs/en/whats-new/2026-w14 -- Week 14 full digest
- https://code.claude.com/docs/en/whats-new/2026-w13 -- Week 13 full digest
- https://code.claude.com/docs/en/changelog -- Full changelog v2.1.69 through v2.1.101
- https://code.claude.com/docs/en/overview -- Product overview
- https://code.claude.com/docs/en/cli-reference -- Complete CLI flags and commands
- https://code.claude.com/docs/en/computer-use -- Computer Use documentation
- https://code.claude.com/docs/en/permission-modes -- Permission modes including Auto mode
- https://code.claude.com/docs/en/channels -- Channels documentation
- https://code.claude.com/docs/en/plugins -- Plugins creation guide
- https://code.claude.com/docs/en/scheduled-tasks -- /loop and cron scheduling
- https://code.claude.com/docs/en/remote-control -- Remote Control documentation
- https://code.claude.com/docs/en/agent-teams -- Agent Teams documentation
- https://code.claude.com/docs/en/chrome -- Chrome browser integration
- https://code.claude.com/docs/en/slack -- Slack integration
- https://code.claude.com/docs/en/desktop-quickstart -- Desktop app guide

---
*Stack research for: Claude Code guide content refresh*
*Researched: 2026-04-12*
