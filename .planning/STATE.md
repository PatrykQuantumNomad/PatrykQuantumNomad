# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.5 Database Compass — Phase 32: OG Images & Site Integration

## Current Position

Phase: 32 (5 of 5 in v1.5) — OG Images & Site Integration
Plan: 0 of TBD complete
Status: Not Started
Last activity: 2026-02-22 — Completed 31-02 (CompassShareControls)

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 64 (16 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 13 v1.4 + 7 v1.5)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | 15 | 37 | 2026-02-17 |
| v1.4 Dockerfile Analyzer | 22-27 | 13 | 38 | 2026-02-20 |
| v1.5 Database Compass | 28-32 | TBD | 28 | In progress |
| **Total** | **32** | **57+** | **180** | |
| Phase 28 P01 | 3min | 2 tasks | 4 files |
| Phase 28 P02 | 9min | 2 tasks | 1 file |
| Phase 29 P01 | 4min | 2 tasks | 4 files |
| Phase 29 P02 | 3min | 2 tasks | 3 files |
| Phase 30 P01 | 3min | 2 tasks | 5 files |
| Phase 30 P02 | 4min | 2 tasks | 2 files |
| Phase 31 P01 | 4min | 2 tasks | 2 files |
| Phase 31 P02 | 4min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.0-v1.4 decisions archived in respective milestone files.

Recent decisions affecting current work:
- [v1.5]: Zero new npm dependencies — existing stack fully sufficient
- [v1.5]: radar-math.ts reused for 8-axis octagon charts (axis-count agnostic)
- [v1.5]: No VS comparison pages (avoids 66+ page OG image explosion)
- [v1.5]: Multi-model databases need crossCategory field in schema
- [v1.5]: PAGE-05 requires React island for interactive filtering on overview
- [28-01]: Used keyof Scores for Dimension key type to enforce compile-time sync
- [28-01]: BMP-safe Unicode symbols chosen over emoji-range codepoints
- [28-01]: justifications required (not optional) to enforce score accountability
- [28-02]: Scored all models one dimension at a time to prevent calibration drift
- [28-02]: Full 1-10 range used in every dimension (no clustering at 5-7)
- [28-02]: DB-Engines URLs as primary links; official sites for unlisted databases
- [29-01]: DIMENSION_COLORS in dimensions.ts (no separate tiers.ts -- DB Compass has no tier system)
- [29-01]: spectrum-math.ts zero imports -- pure TypeScript for Astro + Satori dual-use
- [29-01]: Fixed accent color #c44b20 for all radar charts (no tier-based coloring)
- [29-01]: DM Sans + Noto Sans font stack for Unicode symbol coverage
- [29-02]: Kebab-case data attributes with toCamel() JS helper for multi-word dimension sort keys
- [29-02]: Removed role="text" from CapBadge — not valid ARIA role; aria-label suffices
- [29-02]: Spread operator with Object.fromEntries for dimension data attributes auto-synced with DIMENSIONS array
- [30-01]: Extended RESEARCH.md category mapping with 7 additional use cases for full 58/58 coverage
- [30-01]: Healthcare->OLTP, Scientific modeling->Analytics, CAD/CAM+Rapid prototyping->Content, Global distribution+Polyglot persistence->Infrastructure
- [30-02]: UseCaseFilter follows LanguageFilter.tsx pattern exactly with nanostores subscribe and DOM manipulation
- [30-02]: Scoring table remains unfiltered -- always shows all 12 models regardless of filter state
- [30-02]: Meta description at 148 chars with database keywords under 160-char limit
- [31-01]: Complexity order for nav: key-value (0.08) to multi-model (0.88)
- [31-01]: Character heading reused from Beauty Index for consistency
- [31-01]: Section ids added for future deep linking without visible anchor icons
- [31-02]: SVG-to-PNG via XMLSerializer + Canvas with viewBox dimensions (not width/height)
- [31-02]: Download filename uses slug to avoid parentheses in model names
- [31-02]: Simpler SVG-to-PNG approach over Beauty Index Canvas 2D composite

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
- [v1.4 Tech Debt]: Category colors/grade colors duplicated in badge-generator.ts
- [v1.5 Risk]: 8-axis radar label crowding needs careful testing at 375px/768px/1024px
- [v1.5 Resolved]: Content authoring for 12 models completed (1115 lines, 96 scored dimensions)

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 31-02 (CompassShareControls — 2 files, 2 tasks)
Resume file: None
Next: Phase 32 Plan 01 (OG Images & Site Integration)
