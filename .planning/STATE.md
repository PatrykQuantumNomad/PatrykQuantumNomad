---
gsd_state_version: 1.0
milestone: v1.16
milestone_name: Claude Code Guide
status: executing
stopped_at: Completed 90-03-PLAN.md
last_updated: "2026-03-10T19:25:07Z"
last_activity: 2026-03-10 — Completed 90-03 (Claude Code landing page, chapter routing, hub page, LLMs.txt)
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 4
  completed_plans: 3
  percent: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.16 Claude Code Guide — Phase 90 Infrastructure Refactoring

## Current Position

Phase: 90 (1 of 6) — Infrastructure Refactoring
Plan: 3 of 4 complete
Status: Executing
Last activity: 2026-03-10 — Completed 90-03 (Claude Code landing page, chapter routing, hub page, LLMs.txt)

Progress: [█░░░░░░░░░] 12%

## Performance Metrics

**Velocity:**
- Total plans completed: 200 (across 15 milestones)
- v1.15 plans completed: 13

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

### Pending Todos

None.

### Blockers/Concerns

- 7 hardcoded single-guide assumptions must be fixed in Phase 90 before any content work begins (PITFALL-2 from research)
- NotebookLM 51-source corpus has ~13% hallucination rate -- every factual claim in chapters must be verified against official docs (PITFALL-4)
- Agent Teams (Chapter 10) is "research preview" status -- scope content conservatively with explicit warnings

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 010 | Correctness validation | 2026-02-26 | 9d20b42 | [010-correctness-validation](./quick/010-correctness-validation/) |
| 011 | EDA content correctness validation | 2026-02-26 | 958be19 | [011-eda-content-correctness-validation](./quick/011-eda-content-correctness-validation/) |
| 012 | Fix Snyk security scan vulnerabilities (npm audit + W007 secret redaction) | 2026-03-06 | ddf902c | [012-fix-snyk-security-scan-issue-on-gha-vali](./quick/012-fix-snyk-security-scan-issue-on-gha-vali/) |

## Session Continuity

Last session: 2026-03-10T19:25:07Z
Stopped at: Completed 90-03-PLAN.md
Resume file: None
Next: Execute 90-04-PLAN.md (OG images + full regression verification)
