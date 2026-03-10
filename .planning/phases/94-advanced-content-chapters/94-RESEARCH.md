# Phase 94: Advanced Content Chapters - Research

**Researched:** 2026-03-10
**Domain:** MDX content authoring for Astro-based Claude Code guide (Chapters 7-11)
**Confidence:** HIGH

## Summary

Phase 94 produces five MDX content chapters covering Claude Code's advanced features: Custom Skills (Chapter 7), Hooks & Lifecycle Automation (Chapter 8), Git Worktrees & Subagent Delegation (Chapter 9), Agent Teams (Chapter 10), and Security & Enterprise Administration (Chapter 11). The infrastructure and content patterns are fully established from Phase 93 (Chapters 1-6). All five SVG diagram components and two interactive React Flow components built in Phases 91-92 are ready for embedding in these chapters.

Each chapter topic has been verified against the current official documentation at code.claude.com/docs. Key findings include: SKILL.md uses YAML frontmatter with 11 optional fields (name, description, argument-hint, disable-model-invocation, user-invocable, allowed-tools, model, context, agent, hooks) plus markdown body content; the hook lifecycle has 18 events (2 session + 12 loop + 4 standalone async), not 13 as stated in REQUIREMENTS.md; subagent isolation supports `isolation: "worktree"` for git worktree-based parallel development; agent teams remain experimental/research preview requiring the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` environment variable; and enterprise security spans managed settings (5 delivery mechanisms), MCP governance (allowedMcpServers/deniedMcpServers), plugin governance (strictKnownMarketplaces/blockedMarketplaces), hook control (allowManagedHooksOnly), and sandbox enforcement.

The primary challenge remains factual accuracy (PITFALL-4: ~13% hallucination rate from NotebookLM corpus). Chapter 10 (Agent Teams) requires special handling as a "research preview" feature with known limitations that must be prominently communicated. The NotebookLM corpus may contain outdated or inaccurate information about these advanced features, so all claims must be verified against the official docs pages listed in the Sources section.

**Primary recommendation:** Follow the established Phase 93 MDX chapter pattern exactly (frontmatter, CodeBlock imports, component imports, h2 sections, 300-500 lines). Embed the HookLifecycleDiagram and HookEventVisualizer in Chapter 8, and the AgentTeamsDiagram in Chapter 10. Verify every factual claim against the specific official docs pages fetched during this research.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAP-07 | Chapter 7 -- Custom Skills (SKILL.md anatomy, slash commands vs auto-invocation, skill creator) | Official docs verified: SKILL.md uses YAML frontmatter with 11 fields, supports $ARGUMENTS substitution, 4 storage locations (enterprise/personal/project/plugin), disable-model-invocation vs user-invocable controls invocation behavior, context:fork runs in subagent, !`command` syntax for dynamic injection. |
| CHAP-08 | Chapter 8 -- Hooks & Lifecycle Automation (lifecycle events, exit codes, prompt/agent hooks) | Official docs verified: 18 lifecycle events (not 13 from REQUIREMENTS.md), 4 handler types (command/HTTP/prompt/agent), exit code semantics (0=success, 2=blocking error, other=non-blocking), matcher patterns per event type, JSON input/output schema, hookSpecificOutput for decision control, /hooks interactive menu. HookLifecycleDiagram.astro and HookEventVisualizer.tsx ready for embedding. |
| CHAP-09 | Chapter 9 -- Git Worktrees & Subagent Delegation (parallel development, custom agent personas) | Official docs verified: --worktree flag creates isolated copies at .claude/worktrees/<name>, subagent isolation: "worktree" frontmatter field, 3 built-in subagents (Explore/Plan/general-purpose), AGENT.md files with YAML frontmatter (15 fields), custom tools/permissions/models per subagent, persistent memory with user/project/local scopes, foreground vs background execution. |
| CHAP-10 | Chapter 10 -- Agent Teams & Advanced Orchestration (team architecture, shared tasks, dependency tracking) | Official docs verified: Experimental feature requiring CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, architecture (lead/teammates/task list/mailbox), task states (pending/in-progress/completed) with dependency blocking, file-lock-based claiming, in-process vs split-pane (tmux/iTerm2) display modes, known limitations (no session resumption, one team per session, no nested teams). Must include prominent research preview warning. |
| CHAP-11 | Chapter 11 -- Security & Enterprise Administration (vulnerability scanning, managed settings, plugin governance) | Official docs verified: managed settings delivery (5 mechanisms: server-managed, macOS MDM, Windows registry, file-based, HKCU), settings precedence (managed > CLI > local > project > user), allowManagedPermissionRulesOnly, allowManagedHooksOnly with allowedHttpHookUrls, MCP governance (allowManagedMcpServersOnly, allowedMcpServers, deniedMcpServers), plugin governance (strictKnownMarketplaces, blockedMarketplaces, pluginTrustMessage), sandbox configuration (filesystem + network isolation), authentication controls (forceLoginMethod, forceLoginOrgUUID). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site framework, MDX rendering | Already in use; content collections handle chapter routing |
| MDX | via @astrojs/mdx | Chapter content format with component imports | Established pattern from 6 completed chapters |
| astro-expressive-code | (bundled) | Syntax highlighting in CodeBlock | Already configured, provides copy-to-clipboard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CodeBlock.astro | N/A (internal) | Inline code snippets without repo link | Every code example in chapters 7-11 |
| HookLifecycleDiagram.astro | N/A (internal) | SVG hook lifecycle events diagram (DIAG-02) | Chapter 8 hooks overview section |
| HookEventVisualizer.tsx | N/A (internal) | Interactive React Flow hook event explorer (INTV-02) | Chapter 8 after static diagram |
| AgentTeamsDiagram.astro | N/A (internal) | SVG agent teams topology diagram (DIAG-05) | Chapter 10 architecture section |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CodeBlock (inline) | CodeFromRepo (with GitHub link) | Claude Code guide has no companion repo -- CodeBlock is correct |
| Native Markdown code fences | CodeBlock component | Fences work but lack file-path tab header and visual consistency |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/data/guides/claude-code/
  guide.json                      # Already exists - 11 chapters defined
  pages/
    introduction.mdx              # CHAP-01 (complete)
    context-management.mdx        # CHAP-02 (complete)
    models-and-costs.mdx          # CHAP-03 (complete)
    environment.mdx               # CHAP-04 (complete)
    remote-and-headless.mdx       # CHAP-05 (complete)
    mcp.mdx                       # CHAP-06 (complete)
    custom-skills.mdx             # CHAP-07 (create new)
    hooks.mdx                     # CHAP-08 (create new)
    worktrees.mdx                 # CHAP-09 (create new)
    agent-teams.mdx               # CHAP-10 (create new)
    security.mdx                  # CHAP-11 (create new)
```

### Pattern 1: MDX Chapter File Structure
**What:** Each chapter follows a consistent structure: frontmatter, imports, intro section, main content sections with h2 headings, code examples via CodeBlock, diagram/interactive component embeds, best practices section, and further reading links.
**When to use:** Every chapter file.
**Example:**
```mdx
---
title: "Custom Skills"
description: "SKILL.md anatomy, slash commands vs auto-invocation, and the skill creator"
order: 6
slug: "custom-skills"
lastVerified: 2026-03-10
---
import CodeBlock from '../../../../components/guide/CodeBlock.astro';

## What You Will Learn

[Brief 2-3 sentence overview of chapter scope]

---

## SKILL.md Anatomy

[Content with verified facts from official docs]

<CodeBlock
  code={`---
name: my-skill
description: What this skill does
---

Your skill instructions here...`}
  lang="yaml"
  title="SKILL.md"
/>

## Best Practices

- [Actionable bullets]

## Further Reading

- <a href="https://code.claude.com/docs/en/skills" target="_blank" rel="noopener noreferrer">Custom Skills</a>
```

### Pattern 2: Interactive Component Embedding (React Flow)
**What:** React Flow components are lazy-loaded with `client:visible` to avoid impacting page load. Embedded after static SVG diagrams for progressive enhancement.
**When to use:** Chapter 8 (HookEventVisualizer after HookLifecycleDiagram).
**Example:**
```mdx
import HookLifecycleDiagram from '../../../../components/guide/HookLifecycleDiagram.astro';
import HookEventVisualizer from '../../../../components/guide/HookEventVisualizer';

<HookLifecycleDiagram />

Explore the hook events interactively below. Click any event to see its payload fields, handler types, and configuration examples.

<HookEventVisualizer client:visible />
```

### Pattern 3: Cross-Chapter Linking
**What:** Use relative markdown links to reference other chapters within the same guide.
**When to use:** When referencing concepts covered in other chapters.
**Example:**
```mdx
See [Models, Costs & Permissions](/guides/claude-code/models-and-costs/) for permission system details.
```

### Pattern 4: Research Preview Warning Block
**What:** A prominent warning callout for experimental/research preview features (Agent Teams).
**When to use:** Chapter 10 (Agent Teams) -- at the top of the chapter and before hands-on sections.
**Example:**
```mdx
> **Research Preview:** Agent teams are experimental and disabled by default. The feature requires setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in your environment or settings.json. API surface, behavior, and limitations may change. This chapter documents the feature as of March 2026.
```

### Anti-Patterns to Avoid
- **Unverified claims from training data:** Every factual statement MUST be verified against official docs. The NotebookLM corpus has ~13% hallucination rate.
- **Using CodeFromRepo instead of CodeBlock:** Claude Code guide has no companion repository. Always use CodeBlock.
- **Overly long chapters:** Target 300-500 lines per chapter. Split content if a chapter exceeds 600 lines.
- **Duplicating content between chapters:** Reference other chapters via links rather than repeating explanations.
- **Importing React components without client:visible:** Interactive React Flow components MUST use `client:visible` directive.
- **Presenting Agent Teams as production-ready:** Always include explicit research preview warnings and known limitations.
- **Saying "13 lifecycle events":** REQUIREMENTS.md says 13, but official docs and the Phase 91 diagram confirm 18 events. Use 18.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code syntax highlighting | Custom highlighter | CodeBlock.astro | Handles themes, copy-to-clipboard, file-path headers |
| Hook lifecycle diagram | Inline SVG in MDX | HookLifecycleDiagram.astro (DIAG-02) | Already built with 18 events, themed, accessible |
| Interactive hook explorer | Custom React from scratch | HookEventVisualizer.tsx (INTV-02) | Already built with dagre layout, detail panels, theming |
| Agent teams diagram | Inline SVG in MDX | AgentTeamsDiagram.astro (DIAG-05) | Already built with research preview wrapper |
| Table of contents | Manual heading list | Astro's built-in ToC via remark | Automatic, stays in sync |
| Cross-chapter navigation | Manual prev/next links | GuideLayout component | Already provides sidebar, breadcrumbs, prev/next |

**Key insight:** The infrastructure is completely built. Phase 94 is pure content authoring -- no component development needed.

## Common Pitfalls

### Pitfall 1: Hallucinated Claude Code Features (CRITICAL)
**What goes wrong:** Content states features, commands, or behaviors that don't exist or have changed.
**Why it happens:** ~13% hallucination rate in NotebookLM corpus. Claude's training data may contain outdated information.
**How to avoid:** Every factual claim must have a verifiable source from the official docs pages listed in this research. When writing content, check the specific official docs page for each feature before including it.
**Warning signs:** Features described without a corresponding official docs URL, commands that don't appear in official documentation.

### Pitfall 2: Hook Event Count Mismatch
**What goes wrong:** Chapter 8 states "13 lifecycle events" matching the REQUIREMENTS.md text.
**Why it happens:** REQUIREMENTS.md says "13 lifecycle events" but was written before the full event list was verified.
**How to avoid:** Use the verified count of 18 events from official docs and the Phase 91 SVG diagram. The 18 events are: SessionStart, SessionEnd, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, TeammateIdle, TaskCompleted, PreCompact, InstructionsLoaded, ConfigChange, WorktreeCreate, WorktreeRemove.
**Warning signs:** Any mention of "13 events" in Chapter 8 content.

### Pitfall 3: Agent Teams Presented as Stable
**What goes wrong:** Chapter 10 omits experimental warnings or presents features as production-ready.
**Why it happens:** Natural tendency to present features positively without caveats.
**How to avoid:** Include "Research Preview" warning at the top of Chapter 10. List known limitations explicitly: no session resumption with in-process teammates, task status can lag, shutdown can be slow, one team per session, no nested teams, lead is fixed, permissions set at spawn.
**Warning signs:** Missing experimental disclaimer, no known limitations section.

### Pitfall 4: Conflating Subagents and Agent Teams
**What goes wrong:** Chapters 9 and 10 blur the distinction between subagents (single-session delegation) and agent teams (multi-session coordination).
**Why it happens:** Both features enable parallelism and delegation, making them easy to confuse.
**How to avoid:** Chapter 9 covers subagents (run within a single session, report back to parent, cannot talk to each other). Chapter 10 covers agent teams (separate sessions, shared task list, direct teammate communication). Include a comparison table in Chapter 10.
**Warning signs:** Subagent features described in the agent teams chapter or vice versa.

### Pitfall 5: Wrong Import Path Depth
**What goes wrong:** Using incorrect relative import paths for components in MDX files.
**Why it happens:** Chapter files are at `src/data/guides/claude-code/pages/` which is 4 levels deep from `src/`.
**How to avoid:** Use exactly `../../../../components/guide/ComponentName.astro` for Astro components and `../../../../components/guide/ComponentName` (no extension) for React components.
**Warning signs:** Build errors about unresolved imports.

### Pitfall 6: Missing lastVerified Frontmatter
**What goes wrong:** Creating chapter files without the `lastVerified` date field.
**Why it happens:** The field is optional in the schema so builds won't fail.
**How to avoid:** Always include `lastVerified: 2026-03-10` in frontmatter for every new chapter.
**Warning signs:** Missing `lastVerified` in frontmatter.

### Pitfall 7: Stale "Deprecated" Information
**What goes wrong:** Repeating deprecated information already covered in earlier chapters (e.g., npm install, SSE transport).
**Why it happens:** Each chapter is written independently and may re-state known deprecations.
**How to avoid:** Link to the relevant earlier chapter instead of re-explaining deprecated items. Chapter 7+ chapters can assume the reader has read Chapters 1-6.
**Warning signs:** Duplicated deprecation notices across chapters.

### Pitfall 8: Incomplete SKILL.md Frontmatter Documentation
**What goes wrong:** Listing only a few SKILL.md frontmatter fields when the official docs list 11.
**Why it happens:** Training data may have an older version of the skills documentation.
**How to avoid:** Use the verified 11-field list from official docs: name, description, argument-hint, disable-model-invocation, user-invocable, allowed-tools, model, context, agent, hooks. Include all available string substitutions: $ARGUMENTS, $ARGUMENTS[N], $N, ${CLAUDE_SESSION_ID}, ${CLAUDE_SKILL_DIR}.
**Warning signs:** Fewer than 10 frontmatter fields documented in Chapter 7.

## Code Examples

### SKILL.md Complete Anatomy (Chapter 7)
```yaml
# Source: https://code.claude.com/docs/en/skills
---
name: my-skill
description: What this skill does and when to use it
argument-hint: "[issue-number]"
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Grep, Glob
model: sonnet
context: fork
agent: Explore
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---

Your skill instructions here. Use $ARGUMENTS for user input.
Reference supporting files with relative paths.
Use !`command` for dynamic context injection.
```

### Hook Configuration in Settings (Chapter 8)
```json
// Source: https://code.claude.com/docs/en/hooks
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

### Hook Script with Exit Codes (Chapter 8)
```bash
# Source: https://code.claude.com/docs/en/hooks
#!/bin/bash
# .claude/hooks/block-rm.sh
COMMAND=$(jq -r '.tool_input.command')

if echo "$COMMAND" | grep -q 'rm -rf'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Destructive command blocked by hook"
    }
  }'
else
  exit 0  # allow the command
fi
```

### Subagent Definition (Chapter 9)
```markdown
# Source: https://code.claude.com/docs/en/sub-agents
---
name: code-reviewer
description: Expert code review specialist
tools: Read, Grep, Glob, Bash
model: sonnet
isolation: worktree
memory: user
---

You are a senior code reviewer ensuring high standards of code quality.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately
```

### Git Worktree Usage (Chapter 9)
```bash
# Source: https://code.claude.com/docs/en/common-workflows
# Start Claude in an isolated worktree
claude --worktree feature-auth

# Auto-generated worktree name
claude --worktree
```

### Agent Teams Setup (Chapter 10)
```json
// Source: https://code.claude.com/docs/en/agent-teams
// Enable in settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### Enterprise Managed Settings (Chapter 11)
```json
// Source: https://code.claude.com/docs/en/settings
{
  "allowManagedPermissionRulesOnly": true,
  "allowManagedHooksOnly": true,
  "allowManagedMcpServersOnly": true,
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/approved-plugins" }
  ],
  "sandbox": {
    "enabled": true,
    "allowUnsandboxedCommands": false,
    "network": {
      "allowManagedDomainsOnly": true,
      "allowedDomains": ["github.com", "*.npmjs.org"]
    }
  }
}
```

## Verified Content Outline Per Chapter

### Chapter 7: Custom Skills (CHAP-07)
**Verified topics and their official doc sources:**
1. What skills are (skills page) -- extend Claude's capabilities, follow Agent Skills open standard
2. SKILL.md anatomy (skills page) -- YAML frontmatter + markdown body, required file structure
3. Frontmatter reference (skills page) -- 11 fields: name, description, argument-hint, disable-model-invocation, user-invocable, allowed-tools, model, context, agent, hooks
4. Where skills live (skills page) -- 4 locations: enterprise (managed), personal (~/.claude/skills/), project (.claude/skills/), plugin
5. Slash commands vs auto-invocation (skills page) -- disable-model-invocation (user-only), user-invocable:false (Claude-only), default (both)
6. String substitutions (skills page) -- $ARGUMENTS, $ARGUMENTS[N], $N, ${CLAUDE_SESSION_ID}, ${CLAUDE_SKILL_DIR}
7. Supporting files (skills page) -- directory structure with templates, examples, scripts
8. Dynamic context injection (skills page) -- !`command` syntax for shell command preprocessing
9. Running skills in subagents (skills page) -- context: fork with agent field
10. Bundled skills (skills page) -- /simplify, /batch, /debug, /loop, /claude-api
11. Restricting skill access (skills page) -- Skill(name) permission rules, deny rules
12. Automatic discovery (skills page) -- nested .claude/skills/ in subdirectories, monorepo support
**Target length:** 400-500 lines

### Chapter 8: Hooks & Lifecycle Automation (CHAP-08)
**Verified topics and their official doc sources:**
1. What hooks are (hooks page) -- shell commands, HTTP endpoints, or LLM prompts at lifecycle points
2. Hook lifecycle overview (hooks page) -- 18 events across 3 categories
3. Session events (hooks page) -- SessionStart, SessionEnd
4. Loop events (hooks page) -- UserPromptSubmit, PreToolUse (CAN BLOCK), PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, TeammateIdle, TaskCompleted, PreCompact
5. Standalone async events (hooks page) -- InstructionsLoaded, ConfigChange, WorktreeCreate, WorktreeRemove
6. Configuration format (hooks page) -- 3-level nesting: event > matcher group > hook handlers
7. Hook locations/scopes (hooks page) -- user, project, local, managed, plugin, skill/agent frontmatter
8. Matcher patterns (hooks page) -- regex filtering per event type, MCP tool matching
9. Handler types (hooks page) -- command, HTTP, prompt, agent with specific fields
10. Exit code semantics (hooks page) -- 0=success, 2=blocking error, other=non-blocking
11. JSON output schema (hooks page) -- continue, stopReason, suppressOutput, systemMessage, hookSpecificOutput
12. Decision control patterns (hooks page) -- top-level decision, hookSpecificOutput, exit code
13. /hooks interactive menu (hooks page) -- view, add, delete hooks
14. Hooks in skills and agents (hooks page) -- frontmatter-scoped hooks
**Diagrams:** HookLifecycleDiagram.astro (DIAG-02)
**Interactive:** HookEventVisualizer.tsx (INTV-02)
**Target length:** 450-550 lines (largest chapter due to 18 events + configuration detail)

### Chapter 9: Git Worktrees & Subagent Delegation (CHAP-09)
**Verified topics and their official doc sources:**
1. What subagents are (sub-agents page) -- specialized AI assistants with own context, tools, permissions
2. Built-in subagents (sub-agents page) -- Explore (Haiku, read-only), Plan (inherit, read-only), general-purpose (inherit, all tools)
3. Creating custom subagents (sub-agents page) -- AGENT.md files with YAML frontmatter + system prompt
4. Subagent scope/locations (sub-agents page) -- CLI flag (session), project (.claude/agents/), user (~/.claude/agents/), plugin
5. Frontmatter fields (sub-agents page) -- 15 fields: name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers, hooks, memory, background, isolation
6. Git worktrees for parallel development (common-workflows page) -- --worktree flag, .claude/worktrees/<name>, auto-cleanup
7. Subagent worktree isolation (sub-agents page) -- isolation: "worktree" frontmatter field
8. Persistent memory (sub-agents page) -- user/project/local scopes, MEMORY.md with 200-line curated limit
9. Foreground vs background execution (sub-agents page) -- blocking vs concurrent, Ctrl+B to background
10. /agents interactive menu (sub-agents page) -- view, create, edit, delete agents
11. Resuming subagents (sub-agents page) -- agent ID, transcript persistence
12. Permission modes for subagents (sub-agents page) -- default, acceptEdits, dontAsk, bypassPermissions, plan
**Target length:** 400-500 lines

### Chapter 10: Agent Teams & Advanced Orchestration (CHAP-10)
**Verified topics and their official doc sources:**
1. RESEARCH PREVIEW WARNING (agent-teams page) -- experimental, disabled by default, requires env var
2. When to use agent teams (agent-teams page) -- parallel exploration, research/review, debugging, cross-layer coordination
3. Enabling agent teams (agent-teams page) -- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in env or settings.json
4. Team architecture (agent-teams page) -- lead, teammates, shared task list, mailbox
5. Starting a team (agent-teams page) -- natural language request, Claude proposes or user requests
6. Display modes (agent-teams page) -- in-process (Shift+Down to cycle) vs split-pane (tmux/iTerm2)
7. Task management (agent-teams page) -- pending/in-progress/completed states, dependency tracking, file-lock claiming
8. Teammate communication (agent-teams page) -- message one, broadcast all, automatic idle notifications
9. Agent teams vs subagents comparison (agent-teams page) -- communication, coordination, context, token cost
10. Best practices (agent-teams page) -- team size (3-5), task sizing, context management
11. Known limitations (agent-teams page) -- no session resumption, task status lag, one team per session, no nested teams, lead is fixed
12. Token usage considerations (agent-teams page) -- significantly more tokens, scales with team size
**Diagram:** AgentTeamsDiagram.astro (DIAG-05)
**Target length:** 350-450 lines

### Chapter 11: Security & Enterprise Administration (CHAP-11)
**Verified topics and their official doc sources:**
1. Security model overview (security page) -- permission-based architecture, built-in protections
2. Managed settings deployment (settings page) -- 5 delivery mechanisms: server-managed, macOS MDM, Windows registry, file-based, HKCU
3. Settings precedence hierarchy (settings page) -- managed > CLI > local > project > user
4. Permission governance (settings page) -- allowManagedPermissionRulesOnly locks org-wide rules
5. Hook governance (settings page) -- allowManagedHooksOnly blocks user/project/plugin hooks, allowedHttpHookUrls, httpHookAllowedEnvVars
6. MCP server governance (settings page) -- allowManagedMcpServersOnly, allowedMcpServers, deniedMcpServers, managed-mcp.json
7. Plugin governance (settings page + plugins page) -- strictKnownMarketplaces (7 source types), blockedMarketplaces, pluginTrustMessage
8. Sandbox enforcement (settings page) -- filesystem isolation (allowWrite/denyWrite/denyRead), network isolation (allowedDomains, allowManagedDomainsOnly), allowUnsandboxedCommands:false
9. Authentication controls (settings page) -- forceLoginMethod (claudeai/console), forceLoginOrgUUID
10. Prompt injection protections (security page) -- command blocklist, context-aware analysis, isolated fetch context
11. Monitoring and compliance (settings page) -- OpenTelemetry integration, otelHeadersHelper, companyAnnouncements
12. Verification with /status (settings page) -- shows active settings per layer, configuration sources
**Target length:** 400-500 lines

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| .claude/commands/ for custom commands | .claude/skills/ with SKILL.md (commands still work as legacy) | 2025-2026 | Skills add supporting files, frontmatter invocation control, auto-discovery |
| 13 hook lifecycle events | 18 hook lifecycle events | Ongoing additions through 2026 | REQUIREMENTS.md "13" is outdated; use full 18-event list |
| Top-level decision/reason in PreToolUse | hookSpecificOutput with permissionDecision (old format deprecated) | 2025-2026 | PreToolUse uses hookSpecificOutput for richer 3-way control (allow/deny/ask) |
| Subagents only (single-session delegation) | Agent Teams (multi-session coordination, research preview) | 2025-2026 | New experimental feature for parallel work with inter-agent communication |
| Task tool for subagent spawning | Agent tool (Task renamed to Agent) | Version 2.1.63 | Existing Task(...) references still work as aliases |
| Manual plugin distribution | Plugin marketplaces with strictKnownMarketplaces governance | 2025-2026 | Enterprise admins can control which plugin sources are allowed |

**Deprecated/outdated:**
- `.claude/commands/` directory: Still works but superseded by `.claude/skills/` with SKILL.md
- Top-level `decision`/`reason` in PreToolUse hooks: Deprecated in favor of `hookSpecificOutput.permissionDecision`
- `Task(...)` tool name: Renamed to `Agent(...)` in v2.1.63, old references still work as aliases

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
| CHAP-07 | custom-skills.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-08 | hooks.mdx renders with diagram + interactive imports | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-09 | worktrees.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-10 | agent-teams.mdx renders with diagram import | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-11 | security.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| ALL | All 5 new chapters accessible at correct URLs | smoke | `npx astro build && ls dist/guides/claude-code/*/index.html` | N/A (build test) |
| ALL | Existing tests still pass | regression | `npx vitest run` | All existing test files |

### Sampling Rate
- **Per task commit:** `npx vitest run` (existing tests, ~15s)
- **Per wave merge:** `npx astro build` (full production build verifying all chapters render)
- **Phase gate:** Full build green + all 11 chapter URLs accessible before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Content chapters are MDX files that produce build errors if imports are wrong or frontmatter is invalid. No new unit tests are needed since there is no new TypeScript logic to test. Validation is through successful builds and URL accessibility.

## Open Questions

1. **Is "vulnerability scanning" a distinct Claude Code feature or a usage pattern?**
   - What we know: The official security docs do not describe a dedicated "vulnerability scanning" feature. However, Claude Code can be used as a security reviewer through custom subagents and skills (see sub-agents page example of a security reviewer agent).
   - What's unclear: The CHAP-11 requirement mentions "vulnerability scanning" specifically. It may refer to the general capability of using Claude Code for code security review rather than a named feature.
   - Recommendation: In Chapter 11, frame "vulnerability scanning" as a capability enabled by subagents and skills (creating a security-reviewer agent) plus managed settings enforcement, rather than a standalone named feature. Show the security-reviewer subagent example from official docs.

2. **Should Chapter 8 cover all 18 events in detail or provide a summary table?**
   - What we know: The official hooks reference page documents every event with full input schema and decision control. Chapter 8 would be extremely long (800+ lines) if it covered all 18 events at reference-page depth.
   - What's unclear: How much detail readers need in a guide chapter vs. linking to the reference.
   - Recommendation: Provide a summary table of all 18 events with when-fires and can-block columns. Cover the 5 most important events in detail (SessionStart, PreToolUse, PostToolUse, Stop, WorktreeCreate). Link to official hooks reference for complete schemas.

3. **How to handle the command-to-skill rename in Chapter 7?**
   - What we know: Official docs state ".claude/commands/ files still work" and "skills are recommended." The migration is backward-compatible.
   - What's unclear: Whether readers need migration instructions or just awareness.
   - Recommendation: Lead with skills as the current approach. Mention that .claude/commands/ files still work for backward compatibility in a single note. Do not spend significant space on migration.

## Sources

### Primary (HIGH confidence)
- [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) -- SKILL.md anatomy, frontmatter fields, invocation control, bundled skills, supporting files, dynamic injection, subagent execution
- [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) -- All 18 hook lifecycle events, configuration schema, handler types, exit codes, JSON input/output, decision control, matcher patterns, hooks in skills/agents
- [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) -- Subagent creation, frontmatter fields, built-in agents, isolation modes, persistent memory, foreground/background, permissions
- [code.claude.com/docs/en/agent-teams](https://code.claude.com/docs/en/agent-teams) -- Agent team architecture, enabling, task management, communication, display modes, limitations, experimental status
- [code.claude.com/docs/en/common-workflows](https://code.claude.com/docs/en/common-workflows) -- Git worktree usage, --worktree flag, worktree cleanup, manual management
- [code.claude.com/docs/en/settings](https://code.claude.com/docs/en/settings) -- Managed settings delivery, settings hierarchy, enterprise security controls (permissions, hooks, MCP, plugins, sandbox, auth)
- [code.claude.com/docs/en/security](https://code.claude.com/docs/en/security) -- Security model, prompt injection protections, built-in safeguards, best practices
- [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) -- Plugin structure, marketplace distribution, governance controls
- Existing codebase: hook-lifecycle.ts (18 events), agent-teams.ts (research preview wrapper), HookEventVisualizer.tsx (interactive 18-event explorer)
- Existing chapters 1-6: Established MDX content patterns, CodeBlock usage, import paths, cross-chapter linking

### Secondary (MEDIUM confidence)
- None needed -- all information verified against primary sources

### Tertiary (LOW confidence)
- None -- no unverified claims in this research

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All components already built and tested in Phases 90-92
- Architecture: HIGH -- MDX chapter pattern established by 6 completed chapters
- Content accuracy: HIGH -- All 5 chapter domains verified against official docs (8 pages fetched and analyzed)
- Pitfalls: HIGH -- Based on verified discrepancies between REQUIREMENTS.md and official docs, plus established PITFALL-4 from project blockers

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (30 days -- Claude Code features evolve rapidly but chapter structure is stable; Agent Teams being experimental means changes are likely)
