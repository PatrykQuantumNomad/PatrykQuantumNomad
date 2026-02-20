# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.4 Dockerfile Analyzer — Phase 23 (Rule Engine & Scoring)

## Current Position

Phase: 23 of 27 (Rule Engine & Scoring)
Plan: 0 of TBD complete
Status: Phase 22 complete, ready for Phase 23
Last activity: 2026-02-20 — Phase 22 complete (editor island at /tools/dockerfile-analyzer/ working end-to-end)

Progress: [#####.........................] 17% of v1.4 (1/6 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 47 (16 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 3 v1.4)
- Average duration: ~10 min (v1.0), ~3 min (v1.1), ~3 min (v1.2), ~5.5 min (v1.3)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | 15 | 37 | 2026-02-17 |
| v1.4 Dockerfile Analyzer | 22-27 | 3 | 38 | In progress |
| **Total** | **27** | **47** | **152** | |

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
- [v1.4 Risk]: Scoring weight calibration needs real-world Dockerfile testing in Phase 23

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed Phase 22 (22-02-PLAN.md -- CodeMirror editor island)
Resume file: None
Next: Research and plan Phase 23 (Rule Engine & Scoring)
