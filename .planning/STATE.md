# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.4 Dockerfile Analyzer — Phase 27 COMPLETE (Shareability). Milestone v1.4 complete.

## Current Position

Phase: 27 of 27 (Shareability) -- COMPLETE
Plan: 2 of 2 complete
Status: Phase 27 complete. All shareability features shipped (badge download, shareable URLs, URL hash restore). v1.4 Dockerfile Analyzer milestone complete.
Last activity: 2026-02-20 — Completed 27-02-PLAN.md (ShareActions UI component)

Progress: [############################] 100% of v1.4 (6/6 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 57 (16 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 13 v1.4)
- Average duration: ~10 min (v1.0), ~3 min (v1.1), ~3 min (v1.2), ~5.5 min (v1.3)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | 15 | 37 | 2026-02-17 |
| v1.4 Dockerfile Analyzer | 22-27 | 13 | 38 | 2026-02-20 |
| **Total** | **27** | **57** | **152** | |
| Phase 27 P01 | 3min | 2 tasks | 3 files |
| Phase 27 P02 | 3min | 2 tasks | 3 files |

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

v1.4 execution decisions (Phase 24):
- highlightLineField in separate highlight-line.ts file for clean import by ResultsPanel
- editorViewRef set directly after EditorView creation, cleared in both cleanup paths
- Stale results detected via EditorView.updateListener (docChanged + non-null analysisResult)
- SVG data URL gutter markers with explicit fill/stroke colors (not CSS color override)
- Import path from lib/tools/dockerfile-analyzer/ to stores/ requires 3 parent traversals
- SVG gauge uses relative+absolute positioning for text overlay (inset-0)
- Native HTML details/summary for zero-JS expand/collapse with accessibility
- Category bar widths use inline style percentage for dynamic score values
- Fix code blocks use grid-cols-1 sm:grid-cols-2 for mobile-responsive layout

v1.4 execution decisions (Phase 25):
- Astro Code component for Dockerfile syntax-highlighted before/after blocks (no extra dependency)
- Related rules sorted by severity priority (error > warning > info) via SEVERITY_ORDER record
- Stripped trailing slash from Astro.site before BreadcrumbJsonLd URL construction
- Companion blog post follows exact pattern from the-beauty-index.mdx (OpeningStatement, TldrSummary, KeyTakeaway)
- Blog post links to 14 rule documentation pages (exceeding 5+ requirement)
- Tool page back-link uses aside element after DockerfileAnalyzer component

v1.4 execution decisions (Phase 26):
- Tools nav link href points to /tools/dockerfile-analyzer/ directly (avoids redirect hop since only one tool)
- /tools/index.astro uses Astro.redirect() with 301 for permanent redirect
- DockerfileAnalyzerJsonLd component uses static data (no props) for single-tool pattern
- Homepage Dockerfile Analyzer callout uses mb-8 pt-2 (no mt-8) to avoid double spacing after Beauty Index callout
- "Free Browser Tool" subtitle communicates tool nature at a glance (matching "2026 Edition" pattern)
- Buffer polyfill via feross/buffer package imported before dockerfile-ast for browser compatibility
- CSP frame-src 'self' for Astro View Transitions, script-src updated for GTM
- WCAG AA syntax highlighting replaces oneDark bundled highlighting (comment contrast 5.0:1 vs 3.6:1)

v1.4 execution decisions (Phase 27):
- lz-string compressToEncodedURIComponent for URL-safe Dockerfile compression (~1KB gzipped dependency)
- Programmatic SVG string builder with inline styles (no DOM capture, no external fonts) for portable badge rendering
- Canvas devicePixelRatio capped at 3x for retina PNG export without excessive file size
- SVG badge built as string array joined without separator (not template literal) to avoid whitespace rendering issues
- Category colors/grade colors duplicated as module constants in badge-generator.ts (avoids importing React components)
- ShareActions reads nanostores directly (no props) for zero-coupling integration into ResultsPanel
- hashContentRef pattern: decode URL hash into useRef before useCodeMirror to prevent race condition with EditorView creation
- history.replaceState for URL update on Copy Share Link (not window.location.hash to avoid navigation trigger)
- Auto-analyze useEffect fires after useCodeMirror useEffect due to declaration order with empty deps arrays

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
- [v1.4 Resolved]: Buffer polyfill needed for dockerfile-ast isUTF8BOM (Node.js Buffer API not in browser)

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 27-02-PLAN.md (ShareActions UI component) -- Phase 27 complete, v1.4 milestone complete
Resume file: None
Next: None -- v1.4 Dockerfile Analyzer milestone complete
