# Phase 111: High-Impact Chapter Rewrites - Research

**Researched:** 2026-04-12
**Domain:** Claude Code guide chapter content updates (MDX on Astro 5)
**Confidence:** HIGH

## Summary

This phase rewrites five existing guide chapters (Ch3 Models & Costs, Ch4 Environment, Ch7 Skills, Ch8 Hooks, Ch11 Security) to reflect 6+ months of Claude Code evolution since the guide's publish date (2026-03-15, v2.1.82). The work is pure content authoring against established infrastructure -- no new components, no new npm packages, no schema changes. Each chapter is a single `.mdx` file using the existing `CodeBlock` component, optional diagram components, and standard Markdown.

The feature research already performed in `.planning/research/FEATURES-claude-code-guide-refresh.md` catalogues every new feature with detailed behavioral descriptions, configuration examples, and availability requirements. This document does not repeat that feature inventory. Instead, it focuses on what the planner needs: per-chapter scope, structural recommendations, deprecation targets, cross-reference impacts, and patterns the executor must follow.

**Primary recommendation:** Plan as five independent chapter rewrites (one plan per chapter), each executable in isolation. The chapters have no internal dependencies -- they cross-reference each other but the links use stable slugs that will not change.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Content structure:** Claude decides per chapter whether to add new sections or restructure the flow. Chapters stay as single long pages with anchor-based TOC. Reference content (e.g., 26 hook events) uses full tables. No "What's New" callouts -- updated chapters read seamlessly.
- **Deprecation handling:** Silent removal of deprecated features. Deprecation sweep per-chapter during each rewrite (not cross-cutting). Renamed features use new name only (no parenthetical former names). No standalone changelog page.
- **Code examples:** Complete working copy-paste examples. JSON only for configuration. Representative examples for repetitive content (3-5 well-chosen, not all). Inline comments at Claude's discretion.
- **Cross-reference strategy:** Forward references to Ch12-14 at Claude's discretion. Ch7 Skills mentions Plugins briefly and points to Plugins chapter. Inline hyperlink style matching existing patterns. No callout boxes for cross-references.

### Claude's Discretion
- Per-chapter decision on whether to add new sections or restructure the chapter flow
- Whether to include forward references to not-yet-written chapters (Plugins, Agent SDK, Computer Use)
- When to use inline code comments vs. letting prose explain

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|-----------|---------|---------|-------------|
| Astro MDX | 4.3.13 | Chapter page format | Already used by all 11 existing chapters |
| CodeBlock.astro | Existing | Syntax-highlighted code with file-path tab headers | The only code display component used in guide chapters |
| astro-expressive-code | 0.41.6 | Underlying syntax highlighting engine | JSON, YAML, Bash, TypeScript, Markdown all supported |

### Supporting

| Technology | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| PermissionModelDiagram.astro | Existing | SVG permission flowchart | Ch3 already imports it, keep |
| PermissionFlowExplorer (React) | Existing | Interactive permission tree | Ch3 already imports it, keep |
| HookLifecycleDiagram.astro | Existing | SVG hook lifecycle | Ch8 already imports it, may need update for 26 events |
| HookEventVisualizer (React) | Existing | Interactive hook event explorer | Ch8 already imports it, needs update for 8 new events |
| TerminalRecording.astro | Existing | Terminal session playback | Ch8 already imports it, keep |

### Alternatives Considered

None. This phase is pure content rewriting within established infrastructure. No technology decisions needed.

## Architecture Patterns

### Existing Chapter File Structure

All five chapters follow an identical pattern:
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

### Chapter Rewrite Pattern

For each chapter rewrite:
1. **Read the existing chapter** in full to understand current structure, cross-references, and component imports
2. **Identify additions** from the feature research (FEATURES-claude-code-guide-refresh.md feature numbers mapped below)
3. **Identify removals** from the deprecation sweep (listed per chapter below)
4. **Decide: additive or restructure** (Claude's discretion per CONTEXT.md)
5. **Write the complete rewritten chapter** as a single MDX file replacement
6. **Update frontmatter:** bump `lastVerified` and `updatedDate`, update `description` and `keywords` if scope changed
7. **Verify cross-references:** ensure all inline links to other chapters still use correct slugs and section names

### Anti-Patterns to Avoid

- **Partial updates (find-and-replace approach):** Do NOT try to surgically insert new content into existing text. Write the complete chapter fresh, using the existing chapter as a structural reference. The "reads seamlessly as if always written this way" decision requires holistic rewriting.
- **"What's New" sections:** Per CONTEXT.md, no callout boxes or highlighted sections marking what changed. Every update blends into the natural chapter flow.
- **Parenthetical former names:** Per CONTEXT.md, do NOT write "Auto Mode (formerly known as...)" or "managed-settings.d/ (new in v2.1.91)". Use current names only.
- **Snippet-only code examples:** Per CONTEXT.md, examples must be complete and copy-pasteable. A settings.json example should be a valid JSON object, not a fragment.
- **YAML/TOML for config examples:** Per CONTEXT.md, use JSON only for configuration examples. This matches Claude Code's native settings.json format.

## Per-Chapter Scope Analysis

### Ch3: Models & Costs (models-and-costs.mdx)

**Current state:** 353 lines. Covers models (Sonnet/Opus/Haiku/Opusplan), effort levels (low/medium/high), extended context (1M beta), cost tracking, cost reduction, permission system (deny/ask/allow), permission modes (5 modes), interactive explorer, settings precedence.

**Imports:** CodeBlock, PermissionModelDiagram, PermissionFlowExplorer

**Additions needed (from feature research):**
| Feature | Research # | What to Add |
|---------|-----------|-------------|
| 1M Opus context | #1 context | Opus now has 1M context window (not just beta). Update the Extended Context section to reflect Opus specifically getting the 1M treatment. Sonnet[1m] remains. |
| Effort level restructure | General | The default effort level changed. Update the Effort Levels section. The `/effort` command now exists as a quick way to change effort mid-session. |
| /effort command | General | Add inline mention of the `/effort` slash command alongside existing env var and settings.json methods |
| 6 permission modes (was 5) | #9 | Add Auto Mode as the 6th permission mode. Update the Permission Modes section from 5 to 6 modes. |
| Auto Mode | #1 | Auto Mode is the major new feature for this chapter. Needs dedicated coverage: what it does, how the classifier works, what it blocks/allows, fallback behavior, availability requirements. This is the single largest content addition. |
| Plan Mode approval flow | #22 | Update Plan mode description to include the 5-option approval flow after plan completion |
| dontAsk mode update | #9 | Update dontAsk description: auto-denies unpermitted tools (designed for CI) |
| acceptEdits mode update | #9 | Update: acceptEdits now also auto-approves mkdir, touch, rm, mv, cp, sed in working directory |

**Deprecations to remove:**
| Deprecated Item | Current Location | Action |
|----------------|-----------------|--------|
| Thinking summaries default | Not explicitly mentioned, but effort section implies medium is default | Note that thinking summaries are off by default in interactive sessions. Mention `showThinkingSummaries: true` to restore. |
| Effort default changed | Line 88: "This is the default" for medium | Verify current default and update accordingly |

**Structural recommendation:** RESTRUCTURE. The current chapter mixes model selection, cost tracking, and the permission system in one page. With Auto Mode being a major addition, the permission modes section needs expansion. Recommend reorganizing into clearer sections: Models -> Effort -> Extended Context -> Cost Tracking -> Permission System -> Permission Modes (including Auto Mode) -> Best Practices.

**Cross-reference impacts:**
- Ch11 (Security) references Ch3 for permission system basics -- link stays valid
- Ch4 (Environment) references Ch3 for permissions -- link stays valid
- Introduction references Ch3 for cost info -- link stays valid

**Estimated size change:** ~353 lines -> ~450-500 lines (Auto Mode section is significant)

---

### Ch4: Environment (environment.mdx)

**Current state:** 363 lines. Covers configuration scopes (4 tiers), settings file format, environment variables, sandboxing (why, modes, filesystem, network), status line customization.

**Imports:** CodeBlock only

**Additions needed (from feature research):**
| Feature | Research # | What to Add |
|---------|-----------|-------------|
| managed-settings.d/ directory | #20 | New drop-in directory for layered enterprise policy fragments. Add to Managed Settings section. |
| --bare flag | General | Minimal startup flag. Add to a new CLI flags section or integrate into environment setup. |
| NO_FLICKER / fullscreen rendering | #7 | `CLAUDE_CODE_NO_FLICKER=1` env var, `CLAUDE_CODE_DISABLE_MOUSE=1`, `CLAUDE_CODE_SCROLL_SPEED=N`. Add to Environment Variables section. |
| Transcript mode | #8 | `Ctrl+O` for transcript mode with search. Brief mention alongside fullscreen. |
| New env vars | General | Any new environment variables beyond NO_FLICKER that have appeared since original writing |
| PowerShell tool mention | #26 | Brief mention: `CLAUDE_CODE_USE_POWERSHELL_TOOL=1` for Windows. |

**Deprecations to remove:**
| Deprecated Item | Current Location | Action |
|----------------|-----------------|--------|
| `ANTHROPIC_SMALL_FAST_MODEL` | Lines 138, 147 | Remove the mention of this deprecated env var. Just show `ANTHROPIC_DEFAULT_HAIKU_MODEL` as the current var. Per silent-removal decision, do not mention the old name. |

**Structural recommendation:** ADDITIVE. The current structure works well. Add managed-settings.d/ to the Managed Settings section, add new env vars (NO_FLICKER and friends) to the Environment Variables section, and add --bare flag where appropriate. No major reorganization needed.

**Cross-reference impacts:**
- Links to Ch3 for permissions stay valid
- "Further Reading" next-chapter link to Remote & Headless stays valid

**Estimated size change:** ~363 lines -> ~410-430 lines (moderate additions)

---

### Ch7: Skills (custom-skills.mdx)

**Current state:** 366 lines. Covers SKILL.md anatomy, 10 frontmatter fields, 3 invocation modes, 4 storage locations, string substitutions, dynamic injection, subagent forking, bundled skills, restricting skill access.

**Imports:** CodeBlock only

**Additions needed (from feature research):**
| Feature | Research # | What to Add |
|---------|-----------|-------------|
| `paths` frontmatter | #41 | Glob patterns for conditional skill activation. `paths: ["src/api/**/*.ts"]` auto-loads skill only when matching files are read. Add as new frontmatter field in the reference section. |
| Content lifecycle/compaction | #23 | Skills survive compaction with first 5,000 tokens re-attached. Combined budget 25,000 tokens across all invoked skills. Most recently invoked skills prioritized. NEW SECTION. |
| `shell` frontmatter | #19 | PowerShell support on Windows via `shell: powershell` frontmatter. Add to frontmatter reference. |
| Plugins relationship | #6 | Brief mention that Plugins are the distribution mechanism for skills. Plugin skills are namespaced as `/plugin-name:skill-name`. Point to upcoming Plugins chapter (Ch12). Do NOT include comparison section per CONTEXT.md. |
| `disableSkillShellExecution` | #21 | Managed setting that blocks inline shell (`!command`) from skills. Security control for enterprises. Brief mention with cross-ref to Ch11 Security. |
| Skills-subagents bidirectional | #19 | Skills with `context: fork` run in subagents. Subagents with `skills` field preload skill content. Cross-reference both directions. |

**Deprecations to remove:**
| Deprecated Item | Current Location | Action |
|----------------|-----------------|--------|
| None identified | - | The Skills chapter does not appear to reference any deprecated features. Clean slate. |

**Structural recommendation:** ADDITIVE with one new section. Current structure is clean. Add `paths` and `shell` to the Frontmatter Reference section (currently 10 fields, becomes 12). Add a new "Content Lifecycle and Compaction" section after the Running Skills in Subagents section. Add a brief "Skills and Plugins" subsection to the Where Skills Live section. Update Bundled Skills if the list has changed.

**Cross-reference impacts:**
- Link to Ch8 Hooks for frontmatter hooks stays valid
- Link to Ch5 Remote & Headless for /loop stays valid
- NEW: Forward reference to Plugins chapter (Ch12) -- at Claude's discretion
- NEW: Cross-reference to Ch11 Security for disableSkillShellExecution

**Estimated size change:** ~366 lines -> ~430-460 lines (lifecycle section is meaningful)

---

### Ch8: Hooks (hooks.mdx)

**Current state:** 503 lines. Covers 18 lifecycle events (3 categories), 4 handler types, configuration format, matcher patterns, exit codes, JSON output/decision control, hook locations/scopes, /hooks management.

**Imports:** CodeBlock, TerminalRecording, HookLifecycleDiagram, HookEventVisualizer

**Additions needed (from feature research):**
| Feature | Research # | What to Add |
|---------|-----------|-------------|
| 26 events (was 18) | #10 | 8 new events: PermissionDenied, CwdChanged, FileChanged, ConfigChange, WorktreeCreate, WorktreeRemove, Elicitation, ElicitationResult. Must add to the event tables. |
| Conditional `if` field | #4 | New `if` field on hook handlers using permission rule syntax. Narrows beyond matcher to specific tool arguments. Supported on PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, PermissionDenied. |
| PermissionDenied event | #10 | Fires on auto mode denials. Has `retry: true` option. Significant for auto mode integration. |
| `defer` permission decision | #10 | New PreToolUse decision value. Pauses `-p` sessions at tool call, exits with `deferred_tool_use` payload for SDK apps, resume with `--resume`. |
| Hook output size cap | #33 | Output over 50K saved to disk with path + preview instead of injected into context. Brief mention. |

**Deprecations to remove:**
| Deprecated Item | Current Location | Action |
|----------------|-----------------|--------|
| Old top-level `decision`/`reason` fields | Lines 417, 496 | Currently mentioned as "deprecated." Per silent-removal, remove the mentions entirely. Only show `hookSpecificOutput` with `permissionDecision` and `permissionDecisionReason`. |
| "18 lifecycle events" count | Multiple locations (title description, line 17, line 33) | Update all references from 18 to 26. |

**Structural recommendation:** RESTRUCTURE. The event tables need significant expansion. Current structure has "Key Loop Events" (5) and "Additional Loop Events" (7 in a table). With 8 new events, the categorization needs updating:
- Session Events: SessionStart, SessionEnd (unchanged)
- Loop Events: Update the full list with new events (PermissionDenied, CwdChanged, FileChanged join this category)
- Standalone Async Events: Update (ConfigChange was already here, add new ones)
- New: Elicitation events may need their own subsection or join standalone
- Decision control section: Add `defer` alongside allow/deny/ask
- Configuration format section: Add the `if` field

Per CONTEXT.md: "Reference content like the 26 hook events uses a full table with all columns (event name, trigger, payload, example)." This means the current split between prose descriptions and a minimal table needs to become a comprehensive reference table.

**Cross-reference impacts:**
- Links to Ch7 Skills for frontmatter hooks stay valid
- Link to Ch9 Worktrees for next chapter stays valid
- NEW: PermissionDenied event connects to Auto Mode in Ch3 and Ch11

**Interactive component impact:** The HookEventVisualizer React component needs updating to include the 8 new events. This is a code change to the component, not just content. The planner should account for this.

**Estimated size change:** ~503 lines -> ~650-750 lines (the full event reference table is significant)

---

### Ch11: Security (security.mdx)

**Current state:** 522 lines. Covers security model overview, managed settings (5 delivery mechanisms), settings precedence, permission governance, hook governance, MCP server governance, plugin governance, sandbox enforcement, authentication controls, vulnerability scanning pattern, prompt injection protections, monitoring/compliance.

**Imports:** CodeBlock only

**Additions needed (from feature research):**
| Feature | Research # | What to Add |
|---------|-----------|-------------|
| Auto Mode | #1 | Major new section. Classifier architecture, what's blocked/allowed by default, subagent handling during auto mode, fallback behavior, availability requirements (Team/Enterprise/API plan, Sonnet/Opus 4.6, API only). Configuration: `permissions.disableAutoMode`, `autoMode.environment`. |
| 6 permission modes | #9 | Update any references from 5 to 6 modes. Add auto mode to the permission spectrum. |
| Bash hardening | General | Improvements to Bash tool security. Protected paths that are never auto-approved in any permission mode. |
| managed-settings.d/ | #20 | Layered policy fragments directory. Add to the Managed Settings section. |
| disableSkillShellExecution | #21 | Security setting blocking inline shell from skills. Add to a governance section. |
| Protected paths | #9 | List of paths that are never auto-approved regardless of permission mode. |

**Deprecations to remove:**
| Deprecated Item | Current Location | Action |
|----------------|-----------------|--------|
| 5 permission modes count | If mentioned anywhere | Update to 6 |
| Any outdated managed settings syntax | Throughout | Verify all JSON examples reflect current syntax |

**Structural recommendation:** RESTRUCTURE (minor). The current structure is solid. The main addition is a new "Auto Mode" section. Recommend placing it after the Permission Governance section (it's a permission feature) and before Hook Governance. The managed-settings.d/ addition integrates into the existing Managed Settings section. Bash hardening and protected paths fit into a new or expanded subsection under Sandbox Enforcement or a new "Bash Hardening" section.

**Cross-reference impacts:**
- Link to Ch3 for individual permission system stays valid
- Links to Ch8 Hooks, Ch6 MCP, Ch7 Skills, Ch9 Worktrees all stay valid
- NEW: Auto Mode connects to Ch3 permission modes and Ch8 PermissionDenied event

**Estimated size change:** ~522 lines -> ~650-700 lines (Auto Mode section is significant)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code highlighting | Custom syntax highlighter | CodeBlock.astro + expressive-code | Already handles JSON, YAML, Bash, Markdown |
| File-path headers on code | Custom tab component | CodeBlock `title` prop | Already renders the file-path tab header |
| Diagram updates | New diagram components | Edit existing HookLifecycleDiagram, HookEventVisualizer | Components already exist, just need data updates |
| Chapter navigation | Manual prev/next links | GuideChapterNav.astro | Automatically generated from guide.json |
| Table of contents | Manual anchor links | Astro built-in TOC from headings | `##` headings automatically generate anchors |

**Key insight:** This phase is 100% content work. Every infrastructure component needed already exists. The temptation will be to "improve" components while rewriting chapters. Resist this -- component improvements belong in a separate phase.

## Common Pitfalls

### Pitfall 1: Inconsistent Deprecation Sweep

**What goes wrong:** A deprecated feature is silently removed from one chapter but still referenced in another chapter's cross-reference or code example. For instance, removing `/tag` from Ch3 but Ch7's bundled skills list still mentions it.

**Why it happens:** Deprecation items span multiple chapters. Each chapter is rewritten independently.

**How to avoid:** The planner should include a cross-reference verification step at the end of each chapter rewrite. After writing Ch3, grep the five chapter files for any deprecated terms. The deprecation target list:
- `/tag` command -- verify not referenced anywhere in the 5 chapters
- `/vim` command -- verify not referenced anywhere
- `ANTHROPIC_SMALL_FAST_MODEL` env var -- currently in Ch4, remove there
- Old `decision`/`reason` hook fields -- currently in Ch8, remove there
- Old "18 events" count -- update everywhere (description, body, diagram alt text)
- "5 permission modes" -- update to 6 everywhere
- Effort default (medium) -- verify current default and update

**Warning signs:** Build succeeds but a deprecated term still appears in published content.

### Pitfall 2: Breaking Interactive Component Data

**What goes wrong:** The HookEventVisualizer React component hard-codes event data (names, descriptions, payload fields). Updating the chapter MDX to reference 26 events while the component still shows 18 creates a visible inconsistency.

**Why it happens:** Content and component data are maintained separately.

**How to avoid:** The planner must include a task to update HookEventVisualizer.tsx alongside the Ch8 content rewrite. Similarly, if the PermissionFlowExplorer needs to show Auto Mode, its data needs updating alongside Ch3.

**Warning signs:** Interactive component shows different information than the surrounding prose.

### Pitfall 3: Oversized Code Examples

**What goes wrong:** "Complete working examples" is interpreted as "include every field." A settings.json example with all 26 hook events configured bloats the chapter and overwhelms readers.

**Why it happens:** The CONTEXT.md says "complete working examples" but also says "representative examples for repetitive content (3-5 well-chosen hook event examples covering the main patterns, not all 26)."

**How to avoid:** Follow the CONTEXT.md guidance precisely. Configuration examples should be complete (valid JSON objects) but representative (showing 3-5 patterns, not every permutation). The full reference is in the table, not in the code blocks.

**Warning signs:** A single CodeBlock exceeds 40 lines. Multiple nearly-identical code examples in the same section.

### Pitfall 4: Cross-Reference to Non-Existent Chapters

**What goes wrong:** A forward reference like "see the Plugins chapter" links to `/guides/claude-code/plugins/` but Phase 112 (New Chapters) hasn't run yet. The link 404s on the live site between Phase 111 and Phase 112 deploys.

**Why it happens:** CONTEXT.md allows forward references "at Claude's discretion" but doesn't address the deployment gap.

**How to avoid:** Forward references to Ch12-14 should use text-only mentions without hyperlinks: "the upcoming Plugins chapter will cover..." or "see the Plugins chapter (coming soon)." Only add actual hyperlinks after Phase 112 completes (handled in Phase 116 cross-reference audit).

**Warning signs:** An `<a href=` or markdown `[text](/path)` pointing to a chapter slug that doesn't exist yet.

### Pitfall 5: Stale Chapter Description in guide.json

**What goes wrong:** The chapter MDX content is rewritten with new scope (e.g., Ch8 now covers 26 events) but the `description` field in guide.json still says "18 lifecycle events." The stale description appears on the landing page, in OG images, and in structured data.

**Why it happens:** guide.json is a separate file from the MDX chapters. Content rewrites focus on the MDX file and forget the metadata.

**How to avoid:** Each chapter rewrite plan must include a guide.json update task. Update the `description` field for the rewritten chapter.

**Warning signs:** Landing page card description doesn't match chapter content.

## Code Examples

Verified patterns from the existing codebase:

### Standard CodeBlock Usage (JSON config)
```mdx
<CodeBlock
  code={`{
    "permissions": {
      "mode": "auto"
    }
}`}
  lang="json"
  title=".claude/settings.json"
  caption="Enable auto mode as the default permission mode"
/>
```
Source: Existing pattern throughout all 11 chapters.

### Standard CodeBlock Usage (Bash)
```mdx
<CodeBlock
  code={`claude --permission-mode auto`}
  lang="bash"
  caption="Start a session in auto mode"
/>
```

### Standard CodeBlock Usage (Shell script)
```mdx
<CodeBlock
  code={`#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE 'rm\s+-rf'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked rm -rf"}}'
  exit 2
fi
exit 0`}
  lang="bash"
  title=".claude/hooks/block-rm.sh"
  caption="A PreToolUse hook that blocks destructive rm -rf commands"
/>
```
Source: Existing pattern in Ch8 hooks chapter.

### Cross-Reference Pattern (Inline)
```mdx
For more on how the classifier interacts with hooks, see [Hooks & Lifecycle Automation](/guides/claude-code/hooks/).
```
Source: Existing pattern. CONTEXT.md confirms: "Inline hyperlink style for cross-references."

### Forward Reference Pattern (No Link)
```mdx
The Plugins system packages and distributes skills as installable units. Skills installed via plugins are namespaced as `/plugin-name:skill-name`. See the Plugins chapter for full details.
```
Rationale: Forward references to not-yet-written chapters use text-only mentions to avoid 404 links.

## State of the Art

| Old Approach (Guide as Published) | Current Approach (What Chapters Need) | When Changed | Impact |
|-----------------------------------|---------------------------------------|--------------|--------|
| 5 permission modes | 6 modes (added Auto Mode) | ~March 2026 | Ch3 and Ch11 need updates |
| 18 hook events | 26 hook events | ~March 2026 | Ch8 needs major expansion |
| No conditional hook filtering | `if` field on hook handlers | ~March 2026 | Ch8 needs new section |
| Skills: 10 frontmatter fields | Skills: 12+ frontmatter fields (added `paths`, `shell`) | ~March 2026 | Ch7 needs field additions |
| No skill content lifecycle docs | Skills survive compaction with 5K token budget | ~March 2026 | Ch7 needs new section |
| Single managed-settings.json | managed-settings.json + managed-settings.d/ directory | ~March 2026 | Ch4 and Ch11 need updates |
| Medium effort default | Effort default may have changed | ~March 2026 | Ch3 needs verification |
| `ANTHROPIC_SMALL_FAST_MODEL` | `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Already deprecated | Ch4 still mentions deprecated name |

**Deprecated/outdated items to remove silently:**
- `/tag` command: removed
- `/vim` command: removed
- `ANTHROPIC_SMALL_FAST_MODEL` env var: replaced by `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- Old hook `decision`/`reason` top-level fields: replaced by `hookSpecificOutput`
- Thinking summaries on by default: now off by default in interactive sessions

## Open Questions

1. **HookLifecycleDiagram SVG update scope**
   - What we know: The SVG diagram generator in `src/lib/guides/svg-diagrams/hook-lifecycle.ts` was built for 18 events. Now there are 26.
   - What's unclear: Whether the SVG needs a complete regeneration or can accommodate 8 more nodes without layout breakage.
   - Recommendation: Include a diagram update task in the Ch8 plan. Read the generator source, assess whether adding nodes is straightforward or requires layout restructuring. If complex, defer diagram update to a separate plan and update only the prose event table in this phase.

2. **HookEventVisualizer React component data**
   - What we know: The interactive component has hard-coded event data for the original 18 events.
   - What's unclear: The exact data structure inside the component and how much work adding 8 events requires.
   - Recommendation: The Ch8 plan must include updating this component's data. Read the component source as the first task in the plan.

3. **PermissionFlowExplorer Auto Mode integration**
   - What we know: The interactive permission flow explorer in Ch3 currently shows the deny/ask/allow evaluation chain.
   - What's unclear: Whether Auto Mode should appear as a new path in this explorer or is orthogonal to it.
   - Recommendation: Auto Mode is a permission *mode*, not a permission *rule*. The explorer shows rule evaluation, which is the same in auto mode. Auto mode just changes which tool calls reach the rule evaluator vs. which are auto-decided by the classifier. The explorer likely does not need updating, but verify by reading the component source.

4. **Exact effort default current value**
   - What we know: The feature research mentions "effort default changed" (UPD-13) but does not specify the new default.
   - What's unclear: Whether medium is still the default or something else.
   - Recommendation: The executor should verify the current default by checking official docs before writing the effort section. Flag as needing verification during execution.

## Sources

### Primary (HIGH confidence)
- `.planning/research/FEATURES-claude-code-guide-refresh.md` -- Comprehensive feature inventory (42 features catalogued with behavioral details)
- Existing chapter files in `src/data/guides/claude-code/pages/` -- Read all five chapters in full
- `src/data/guides/claude-code/guide.json` -- Guide metadata with chapter descriptions
- `src/components/guide/CodeBlock.astro` -- Component API verified
- `.planning/phases/111-high-impact-chapter-rewrites/111-CONTEXT.md` -- User decisions

### Secondary (MEDIUM confidence)
- `.planning/research/STACK-claude-code-guide.md` -- Infrastructure patterns verified against codebase
- `.planning/research/PITFALLS-claude-code-guide.md` -- Pitfall patterns verified against codebase
- Official docs URLs referenced in feature research (code.claude.com/docs/en/hooks, skills, permission-modes, plugins, etc.)

### Tertiary (LOW confidence)
- Exact effort default value -- needs executor verification against current official docs
- Exact set of new environment variables beyond NO_FLICKER -- needs executor verification

## Metadata

**Confidence breakdown:**
- Per-chapter scope: HIGH -- based on direct reading of all five chapters and comprehensive feature research
- Deprecation targets: HIGH -- explicitly listed in requirements (UPD-13) and verified in chapter content
- Interactive component updates: MEDIUM -- scope is clear but implementation effort depends on component internals not yet read
- Exact feature behavioral details: MEDIUM -- sourced from feature research which was verified against official docs, but Claude Code may have shipped additional changes since April 12

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (30 days -- Claude Code ships updates weekly but the guide structure and component patterns are stable)
