---
gsd_state_version: 1.0
milestone: v1.16
milestone_name: Claude Code Guide
status: in-progress
stopped_at: Completed Phase 94 (all 3 plans)
last_updated: "2026-03-10T23:14:09Z"
last_activity: 2026-03-10 — Completed Phase 94 (all 11 content chapters done)
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 15
  completed_plans: 15
  percent: 97
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.16 Claude Code Guide — Phase 94 Complete, ready for Phase 95

## Current Position

Phase: 94 (5 of 6) — Advanced Content Chapters — COMPLETE
Plan: 3 of 3 complete
Status: Phase 94 Complete
Last activity: 2026-03-10 — Completed 94-02 (Chapters 9-10 Worktrees & Agent Teams)

Progress: [█████████░] 97%

## Performance Metrics

**Velocity:**
- Total plans completed: 201 (across 15 milestones)
- v1.15 plans completed: 13
- v1.16 plans completed: 15

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | 15 | 37 | 2026-02-17 |
| v1.4 Dockerfile Analyzer | 22-27 | 13 | 38 | 2026-02-20 |
| v1.5 Database Compass | 28-32 | 10 | 28 | 2026-02-22 |
| v1.6 Compose Validator | 33-40 | 14 | 100 | 2026-02-23 |
| v1.7 K8s Analyzer | 41-47 | 23 | 123 | 2026-02-23 |
| v1.8 EDA Encyclopedia | 48-55 | 24 | 145 | 2026-02-25 |
| v1.9 Case Study Deep Dive | 56-63 | 19 | 41 | 2026-02-27 |
| v1.10 EDA Graphical NIST Parity | 64-68 | 13 | 20 | 2026-02-27 |
| v1.11 Beauty Index: Lisp | 69-71 | 3 | 21 | 2026-03-02 |
| v1.12 Dockerfile Rules Expansion | 72-74 | 3 | 11 | 2026-03-02 |
| v1.13 GHA Workflow Validator | 75-81 | 19 | 80 | 2026-03-04 |
| v1.14 DevOps Skills Publishing | 82-84 | 3 | 16 | 2026-03-05 |
| v1.15 FastAPI Production Guide | 85-89 | 13 | 36 | 2026-03-08 |
| **Total** | **89** | **200** | **773** | |
| Phase 90 P01 | 4 | 2 tasks | 8 files |
| Phase 90 P03 | 4min | 2 tasks | 5 files |
| Phase 90 P04 | ~15min | 2 tasks | 2 files |
| Phase 91 P01 | 4min | 2 tasks | 8 files |
| Phase 91 P02 | 4min | 2 tasks | 7 files |
| Phase 91 P03 | 3min | 2 tasks | 4 files |
| Phase 92 P01 | 4min | 2 tasks | 7 files |
| Phase 92 P02 | 5min | 2 tasks | 7 files |
| Phase 93 P01 | 13min | 2 tasks | 2 files |
| Phase 93 P02 | 9min | 2 tasks | 2 files |
| Phase 93 P03 | 9min | 2 tasks | 2 files |
| Phase 94 P01 | 8min | 2 tasks | 2 files |
| Phase 94 P02 | 8min | 2 tasks | 2 files |
| Phase 94 P03 | 3min | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

- (90-02) CodeBlock uses same expressive-code wrapper pattern as CodeFromRepo but without source attribution
- (90-02) GuideJsonLd defaults parentTitle/parentUrl to FastAPI values for zero-change backward compatibility
- (90-02) Companion link rendered conditionally -- Claude Code guide pages will simply omit the prop
- [Phase 90]: Removed GUIDE_ROUTES.landing constant -- guideLandingUrl() is the single source of truth for all guide landing URLs
- [Phase 90]: Per-guide collection registration pattern (claudeCodePages, claudeCodeGuide) rather than merged collections
- [Phase 90]: Dynamic sitemap builder uses readdirSync to iterate src/data/guides/* directories
- (90-03) Landing page uses render() to extract reading time from remarkPluginFrontmatter at build time
- (90-03) Claude Code hub card uses guide title prominently instead of logo image
- (90-03) templateRepo/versionTag access wrapped in conditionals in llms-full.txt.ts
- (90-04) 'Zero-to-Hero Guide' subtitle used in Claude Code landing OG image to differentiate from FastAPI's 'Production Guide'
- (90-04) OG image directory structure mirrors routing: open-graph/guides/{slug}/ per guide
- (91-01) Triangular layout for agentic loop with curved Bezier arrows connecting 3 phase boxes in a cycle
- (91-01) Hook lifecycle uses 18 events (not 13 from REQUIREMENTS.md) based on verified official docs
- (91-01) PreToolUse highlighted with accent border and CAN BLOCK label to indicate blocking capability
- (91-02) Permission model uses 3 diamondNode decision nodes for deny->ask->allow evaluation chain
- (91-02) MCP architecture uses groupBox containers for Local Servers and Remote Servers with transport badges
- (91-02) SSE transport labeled as deprecated, HTTP highlighted as recommended with accent color
- (91-03) Dashed groupBox wrapping entire diagram conveys Research Preview status prominently
- (91-03) Task state indicators use accent color for in-progress and textSecondary for pending/completed
- (92-01) Diamond nodes use decorative SVG background (not clip-path) to avoid clipping React Flow handles
- (92-01) 9 edges include 2 prompt-user outcome edges for complete decision tree
- (92-01) Data module separated from component in src/lib/guides/interactive-data/ for independent unit testing
- (92-01) Detail panel rendered as sibling below ReactFlow canvas, not inside the flow
- (92-02) Independent hook event data module separate from Phase 91 SVG generators to avoid coupling
- (92-02) Category colors: session=blue, loop=violet, standalone=amber for instant visual grouping
- (92-02) CAN BLOCK badge uses accent color with transparent background matching Phase 91 convention
- (92-02) Category nodes use dashed border and are non-interactive to distinguish from event nodes
- (93-01) Native install script (curl) as primary installation method; npm explicitly deprecated
- (93-01) File exclusion documented via respectGitignore + claudeMdExcludes, not standalone .claudeignore
- (93-01) Slash commands quick reference added to Chapter 1 for reader convenience
- (94-01) HTML entity escaping for ${} variable references in MDX prose to prevent JSX interpolation
- (94-01) 10 SKILL.md frontmatter fields documented; PreToolUse is ONLY loop event that can block execution
- (94-01) hookSpecificOutput used exclusively for PreToolUse decision control (deprecated top-level format not recommended)
- (94-02) Chapter 9 uses descriptive format for 13 AGENT.md frontmatter fields rather than table format for readability
- (94-02) Research Preview blockquote placed immediately after What You Will Learn in Chapter 10 for maximum visibility
- (94-02) Comparison table in Chapter 10 uses 8 dimensions for thorough subagents vs agent teams differentiation
- (94-03) Vulnerability scanning framed as capability pattern (subagents + skills + hooks), not standalone named feature
- (94-03) 520 lines covers all 16 sections including 5 managed settings mechanisms, 3 governance flags, plugin/sandbox/auth controls

### Pending Todos

None.

### Blockers/Concerns

- NotebookLM 51-source corpus has ~13% hallucination rate -- every factual claim in chapters must be verified against official docs (PITFALL-4)
- Agent Teams (Chapter 10) is "research preview" status -- scope content conservatively with explicit warnings

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 010 | Correctness validation | 2026-02-26 | 9d20b42 | [010-correctness-validation](./quick/010-correctness-validation/) |
| 011 | EDA content correctness validation | 2026-02-26 | 958be19 | [011-eda-content-correctness-validation](./quick/011-eda-content-correctness-validation/) |
| 012 | Fix Snyk security scan vulnerabilities (npm audit + W007 secret redaction) | 2026-03-06 | ddf902c | [012-fix-snyk-security-scan-issue-on-gha-vali](./quick/012-fix-snyk-security-scan-issue-on-gha-vali/) |

## Session Continuity

Last session: 2026-03-10T23:14:09Z
Stopped at: Completed 94-02-PLAN.md (Chapters 9-10 Worktrees & Agent Teams)
Resume file: None
Next: Phase 95 (Site Integration & Blog Post)
