---
phase: 111-high-impact-chapter-rewrites
plan: 03
subsystem: guide-content
tags: [skills, mdx, content-rewrite, frontmatter, compaction, plugins]
dependency_graph:
  requires: []
  provides: [ch7-skills-rewrite, paths-frontmatter-docs, lifecycle-compaction-docs, plugins-mention]
  affects: [custom-skills.mdx, guide.json]
tech_stack:
  added: []
  patterns: [CodeBlock-component, mdx-frontmatter, glob-patterns]
key_files:
  created: []
  modified:
    - src/data/guides/claude-code/pages/custom-skills.mdx
    - src/data/guides/claude-code/guide.json
key_decisions:
  - Plugins mention uses text-only reference (no hyperlink) since Plugins chapter does not exist yet
  - Content Lifecycle section placed after Running Skills in Subagents for logical flow
  - paths and shell fields documented with dedicated CodeBlock examples rather than just prose
  - guide.json description updated to match new chapter scope
metrics:
  duration: 5min
  completed: 2026-04-12
---

# Phase 111 Plan 03: Ch7 Custom Skills Rewrite Summary

Rewrote Ch7 (Custom Skills) adding paths/shell frontmatter fields, a Content Lifecycle and Compaction section with 5K/25K token budgets, Plugins distribution mention, and disableSkillShellExecution security setting.

## Performance

| Metric | Value |
|--------|-------|
| Tasks completed | 2/2 |
| Duration | 5 minutes |
| Files modified | 2 |
| Net lines added | ~130 |
| Build status | PASSED |

## Accomplishments

1. **paths frontmatter field** -- Documented conditional skill activation via glob patterns with a complete CodeBlock example showing API-conventions skill scoped to `src/api/**/*.ts`, `src/middleware/**`, and `src/routes/**/*.ts`.

2. **shell frontmatter field** -- Documented shell override for dynamic injection commands with PowerShell example (`shell: powershell`).

3. **Content Lifecycle and Compaction section** -- New section explaining how skills survive context compaction: first 5,000 tokens re-attached per skill, 25,000 token combined budget across all invoked skills, most recently invoked skills prioritized. Includes practical implications and a CodeBlock example showing how to structure skill content for compaction survival.

4. **Skills and Plugins subsection** -- Added under "Where Skills Live" explaining Plugins as the distribution mechanism for skills, namespaced invocation (`/plugin-name:skill-name`), and text-only forward reference to the Plugins chapter.

5. **disableSkillShellExecution setting** -- Documented in the Restricting Skill Access section with a managed-settings.json CodeBlock example and cross-reference to Ch11 Security.

6. **Subagents bidirectional relationship** -- Added note that subagents with `skills` field can preload skill content, complementing the existing `context: fork` direction.

7. **Updated frontmatter reference** -- Count updated from 10 to 12 fields throughout. "What You Will Learn" intro updated to reflect new content. Comprehensive security-review example updated to include `paths` field.

8. **Best practices expanded** -- Added two new best practices: "Use paths to reduce context noise" and "Structure content for compaction survival."

9. **guide.json description updated** -- Reflects new chapter scope: conditional path-based activation, lifecycle management, and Plugins distribution.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Read existing Ch7 and feature research | (read-only) | - |
| 2 | Rewrite Ch7 custom-skills.mdx | 59beb80 | custom-skills.mdx, guide.json |

## Files Modified

| File | Change |
|------|--------|
| src/data/guides/claude-code/pages/custom-skills.mdx | Full chapter rewrite: +130 lines net, 12 frontmatter fields, new lifecycle section, plugins subsection, disableSkillShellExecution |
| src/data/guides/claude-code/guide.json | Updated Ch7 description to reflect new scope |

## Decisions Made

1. **Text-only Plugins reference** -- The Plugins chapter does not exist yet (Phase 112). Used text-only mention ("The Plugins chapter covers...") without any hyperlink to avoid 404 links between deployments.

2. **Lifecycle section placement** -- Placed Content Lifecycle and Compaction after Running Skills in Subagents because both topics relate to how skills behave at runtime, creating a logical reading flow from invocation to long-session behavior.

3. **Dedicated CodeBlock examples for new fields** -- Both `paths` and `shell` received standalone CodeBlock examples rather than just inline prose mentions. This follows the CONTEXT.md directive for complete, copy-pasteable examples.

4. **guide.json sync** -- Updated the chapter description in guide.json to prevent the Pitfall 5 scenario (stale description on landing page) identified in the research.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated guide.json description**
- **Found during:** Task 2
- **Issue:** Plan did not mention updating guide.json, but research (Pitfall 5) specifically warns about stale descriptions
- **Fix:** Updated guide.json Ch7 description from "team conventions as slash commands" to "conditional path-based activation, content lifecycle management, and Plugins distribution"
- **Files modified:** src/data/guides/claude-code/guide.json
- **Commit:** 59beb80

## Verification Results

| Check | Result |
|-------|--------|
| MDX build | PASSED (1178 pages, 0 errors) |
| paths frontmatter documented | PASSED (line 90 with glob pattern example) |
| shell frontmatter documented | PASSED (with PowerShell example) |
| Content Lifecycle section exists | PASSED (line 371, includes 5K/25K details) |
| Plugins mention (text-only) | PASSED (no hyperlinks to /guides/claude-code/plugins/) |
| disableSkillShellExecution documented | PASSED (lines 450, 454) |
| No /tag or /vim references | PASSED |
| No forward hyperlinks to non-existent chapters | PASSED |
| Cross-references use correct slugs | PASSED (hooks, remote-and-headless, security) |

## Self-Check: PASSED

All files exist on disk and all commit hashes verified in git log.
