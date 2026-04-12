---
phase: 112
plan: 03
subsystem: guide-content
tags: [computer-use, chapter, safety-model, desktop-control, gui-automation]
dependency_graph:
  requires: [111-05]
  provides: [computer-use-chapter]
  affects: [guide.json, 116-site-integration]
tech_stack:
  added: []
  patterns: [callout-component-in-guide-chapter, safety-first-chapter-structure]
key_files:
  created:
    - src/data/guides/claude-code/pages/computer-use.mdx
  modified: []
decisions:
  - Safety-first chapter ordering: callout box and safety model sections placed before all practical usage content
  - Used Callout.astro component from blog directory for safety warning (first guide chapter to import it)
  - Added "When to Use Computer Use" decision guide section (deviation Rule 2 -- helps readers choose correct tool)
  - Added "Screenshot Frequency" subsection explaining observe-act-observe loop
  - Used HTML anchor tag in Callout content for security chapter link (MDX Callout slot requires raw HTML)
metrics:
  duration: "3m 15s"
  completed: 2026-04-12
  tasks: 2
  files: 1
---

# Phase 112 Plan 03: Computer Use Chapter Summary

Complete Ch14 (Computer Use) as a safety-first guide chapter with per-app approval flow, three app control tiers, CLI/Desktop setup, Retina screenshot handling, and Callout.astro safety warning linking to Ch11 Security.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Read reference materials and Computer Use feature details | (research only) | - |
| 2 | Author computer-use.mdx chapter | 6137fa4 | src/data/guides/claude-code/pages/computer-use.mdx |

## What Was Built

### computer-use.mdx (353 lines)

A complete, self-contained guide chapter covering Computer Use with safety-first structure:

1. **What You Will Learn** -- Brief intro emphasizing safety-first approach
2. **Quick Start** -- Four-step setup for both CLI (macOS) and Desktop (macOS + Windows)
3. **Safety Callout Box** -- Prominent Callout component (type="warning") immediately after Quick Start, linking to Ch11 Security
4. **Safety Model** -- Six-mechanism summary table plus detailed subsections: per-session app approval, machine-wide lock, Escape key abort, terminal exclusion, application hiding, no sandbox
5. **Per-App Approval Flow** -- Approval prompt details, four warning tiers with table, session scope explanation
6. **App Control Tiers** -- Three tiers (view-only, click-only, full control) with table and per-tier explanations
7. **Enabling Computer Use** -- CLI Setup (macOS only, /mcp) and Desktop Setup (macOS + Windows, Settings > General)
8. **CLI vs Desktop Differences** -- Comparison table covering platform support, setup method, architecture, permissions
9. **Screenshots and Retina Handling** -- Auto-downscaling explanation (3456x2234 -> ~1372x887) plus screenshot frequency behavior
10. **Practical Examples** -- Four examples: UI verification, desktop apps, repetitive GUI tasks, combined CLI+GUI workflows, reading app state
11. **When to Use Computer Use** -- Decision guide: when to use CU vs Bash vs both
12. **Best Practices** -- Seven bullet points covering approval hygiene, Escape key, CLI preference, warning tiers, session focus, low-risk testing, tier awareness
13. **Further Reading** -- Official docs link + previous chapter link to Agent SDK

### Key Design Decisions

- **Safety-first ordering:** Callout box at line 39, Safety Model at line 45, Practical Examples at line 229. All safety content precedes all practical content.
- **Callout component:** First guide chapter to import Callout.astro from `src/components/blog/`. Uses `type="warning"` with HTML anchor for cross-reference to Ch11 Security.
- **Self-contained:** Core concepts (MCP, sandbox, permissions) briefly explained on first mention with cross-references to their dedicated chapters.

### Cross-References

| From | To | Via |
|------|----|-----|
| computer-use.mdx | security.mdx | Callout component (`/guides/claude-code/security/`) |
| computer-use.mdx | mcp.mdx | Inline reference (`/guides/claude-code/mcp/`) |
| computer-use.mdx | models-and-costs.mdx | Inline reference (`/guides/claude-code/models-and-costs/`) |
| computer-use.mdx | agent-sdk.mdx | Further Reading link (`/guides/claude-code/agent-sdk/`) |

## Deviations from Plan

### Auto-added Content

**1. [Rule 2 - Missing Functionality] Added "When to Use Computer Use" decision guide**
- **Found during:** Task 2
- **Issue:** Plan section outline had 12 sections but no guidance on when to use Computer Use vs Bash tool
- **Fix:** Added decision guide section with three categories (use CU, use Bash, use both)
- **Files modified:** src/data/guides/claude-code/pages/computer-use.mdx

**2. [Rule 2 - Missing Functionality] Added "Screenshot Frequency" subsection**
- **Found during:** Task 2
- **Issue:** Screenshots section covered Retina downscaling but not the observe-act-observe interaction loop
- **Fix:** Added subsection explaining how Claude takes screenshots after each action to verify results
- **Files modified:** src/data/guides/claude-code/pages/computer-use.mdx

**3. [Rule 2 - Missing Functionality] Added "Reading Application State" example**
- **Found during:** Task 2
- **Issue:** Practical examples covered creation/modification workflows but not read-only information extraction
- **Fix:** Added Activity Monitor example showing data extraction without modification
- **Files modified:** src/data/guides/claude-code/pages/computer-use.mdx

**4. [Rule 2 - Missing Functionality] Added safety mechanism summary table**
- **Found during:** Task 2
- **Issue:** Safety Model section listed six mechanisms but had no at-a-glance summary
- **Fix:** Added table at top of Safety Model section summarizing all six mechanisms
- **Files modified:** src/data/guides/claude-code/pages/computer-use.mdx

## Verification Results

All success criteria met:

- [x] Prominent safety callout box using Callout.astro linking to Ch11 Security
- [x] All safety model mechanisms documented (per-session approval, machine-wide lock, Escape abort, terminal exclusion, app hiding, no sandbox)
- [x] Per-app approval flow documented with four warning tiers
- [x] Three app control tiers documented (view-only, click-only, full control)
- [x] Both CLI and Desktop setup documented
- [x] CLI vs Desktop differences documented with comparison table
- [x] Screenshot auto-downscaling documented
- [x] Safety sections precede practical usage sections (Safety Model at line 45, Practical at line 229)
- [x] Quick Start section present with enabling steps
- [x] Chapter self-contained with cross-references to Ch3, Ch6, Ch11
- [x] File is 353 lines (target: 350-400)
- [x] Both imports present (CodeBlock + Callout)
- [x] Frontmatter has order: 13, slug: "computer-use"
