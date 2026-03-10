---
gsd_state_version: 1.0
milestone: v1.16
milestone_name: Claude Code Guide
status: in-progress
stopped_at: Completed 91-01-PLAN.md
last_updated: "2026-03-10T20:14:44Z"
last_activity: 2026-03-10 — Completed 91-01 (diagram-base extensions + agentic loop + hook lifecycle diagrams)
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 3
  completed_plans: 1
  percent: 22
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.16 Claude Code Guide — Phase 91 SVG Diagram Generators

## Current Position

Phase: 91 (2 of 6) — SVG Diagram Generators — IN PROGRESS
Plan: 1 of 3 complete
Status: Executing Phase 91
Last activity: 2026-03-10 — Completed 91-01 (diagram-base extensions + agentic loop + hook lifecycle diagrams)

Progress: [██▒░░░░░░░] 22%

## Performance Metrics

**Velocity:**
- Total plans completed: 201 (across 15 milestones)
- v1.15 plans completed: 13
- v1.16 plans completed: 5

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

Last session: 2026-03-10T20:14:44Z
Stopped at: Completed 91-01-PLAN.md
Resume file: None
Next: Execute 91-02-PLAN.md (Permission Model + MCP Architecture diagrams)
