# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.4 Dockerfile Analyzer — Phase 23 complete, ready for Phase 24 (Results Display)

## Current Position

Phase: 23 of 27 (Rule Engine & Scoring) -- COMPLETE
Plan: 2 of 2 complete
Status: Phase 23 complete. Ready for Phase 24.
Last activity: 2026-02-20 — Completed 23-02-PLAN.md (24 rules, 39 total, sample calibration)

Progress: [########....................] 33% of v1.4 (2/6 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 49 (16 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 5 v1.4)
- Average duration: ~10 min (v1.0), ~3 min (v1.1), ~3 min (v1.2), ~5.5 min (v1.3)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | 15 | 37 | 2026-02-17 |
| v1.4 Dockerfile Analyzer | 22-27 | 5 | 38 | In progress |
| **Total** | **27** | **49** | **152** | |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.0-v1.3 decisions archived in respective milestone files.

v1.4 key research decisions:
- Use `client:only="react"` for CodeMirror island (not client:load)
- Destroy/recreate EditorView on View Transitions (not transition:persist)
- Vanilla useRef/useEffect for CodeMirror (not @uiw/react-codemirror)
- dockerfile-ast for parsing (browser-safe, source-audited)
- Nanostore bridge between CodeMirror linter callback and React results panel

v1.4 execution decisions (Phase 22):
- dockerfile-ast GO: bundles at 21 KB gzipped (58% under 50 KB budget), no CJS warnings
- DockerfileParser.parse() accepts plain string directly -- no TextDocument adapter needed
- Pre-existing tsc errors in open-graph/*.png.ts are out of scope
- analyzeRef pattern: wrap onAnalyze in useRef to avoid EditorView re-creation on render
- lintGutter() without linter(): enables setDiagnostics gutter markers without real-time linting
- Empty deps array for useCodeMirror useEffect: editor created once, destroyed on unmount only

v1.4 execution decisions (Phase 23):
- LintRule.check() accepts Dockerfile AST + rawText, returns RuleViolation[] with 1-based line numbers
- Diminishing returns formula: deduction = baseSeverityPoints / (1 + 0.3 * priorViolationsInCategory)
- Category weights: Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10%
- DL3020 skips URLs and archives where ADD is valid; only flags plain file copies
- DL3002 only flags explicit USER root in final stage, not absence of USER instruction
- PG001 checks ENV/ARG via Property API for secret keywords and known key patterns
- DL3045 stage-aware: tracks WORKDIR per build stage using FROM boundaries
- PG004 uses Property.getAssignmentOperator() === null for legacy ENV detection
- DL4001/DL3057 use "flag once per Dockerfile" pattern to avoid noise
- PG005 determines majority case convention before flagging outliers
- 39 total rules: 10 security, 8 efficiency, 7 maintainability, 5 reliability, 9 best-practice

### Pending Todos

None.

### Blockers/Concerns

- [Infra]: DNS configuration for patrykgolabek.dev is a manual step outside automation scope
- [Tech Debt]: No shared getBlogPostUrl helper — URL resolution duplicated in 3 files
- [Tech Debt]: Social links hardcoded across 5 component files instead of centralized config
- [Tech Debt]: Category colors defined in 3 places (ProjectCard, ProjectHero, FloatingOrbs)
- [Tech Debt]: Filter system inline script (~80 lines) in projects/index.astro
- [Deferred]: LinkedIn removal from JSON-LD sameAs (CONFIG-02)
- [v1.3 Gap]: Dark mode strategy deferred — charts use light mode CSS custom properties only
- [v1.4 Resolved]: dockerfile-ast Vite bundle compatibility CONFIRMED -- 21 KB gzipped, no CJS errors (Plan 22-01)
- [v1.4 Resolved]: Scoring calibration verified -- sample Dockerfile triggers all 5 categories with 39 rules

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 23-02-PLAN.md (24 rules, 39 total, sample calibration)
Resume file: None
Next: Phase 24 (Results Display)
