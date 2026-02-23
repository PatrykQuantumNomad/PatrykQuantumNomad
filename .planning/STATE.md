# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.6 Docker Compose Validator - Phase 39 complete (Tool Page & Site Integration)

## Current Position

Phase: 39 of 40 (Tool Page & Site Integration) -- COMPLETE
Plan: 1 of 1 complete in current phase
Status: Phase 39 complete (all 6 requirements: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06)
Last activity: 2026-02-23 -- Plan 39-01 complete (JSON-LD, breadcrumbs, tools page card, homepage callout, sitemap verified)

Progress: [██████████] 100% (Phase 39 plan 1/1)

## Performance Metrics

**Velocity:**
- Total plans completed: 78 (16 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 13 v1.4 + 9 v1.5 + 12 v1.6)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | 15 | 37 | 2026-02-17 |
| v1.4 Dockerfile Analyzer | 22-27 | 13 | 38 | 2026-02-20 |
| v1.5 Database Compass | 28-32 | 10 | 28 | 2026-02-22 |
| v1.6 Compose Validator | 33-40 | TBD | 100 | In progress |
| **Total** | **40** | **66+** | **280** | |
| Phase 34 P01 | 5min | 2 tasks | 18 files |
| Phase 34 P02 | 7min | 2 tasks | 28 files |
| Phase 34 P03 | 3min | 2 tasks | 7 files |
| Phase 35 P01 | 4min | 2 tasks | 5 files |
| Phase 35 P02 | 3min | 2 tasks | 4 files |
| Phase 36 P01 | 4min | 2 tasks | 5 files |
| Phase 36 P02 | 4min | 2 tasks | 8 files |
| Phase 37 P01 | 3min | 2 tasks | 5 files |
| Phase 38 P01 | 3min | 2 tasks | 4 files |
| Phase 39 P01 | 4min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.0-v1.5 decisions archived in respective milestone files.

**v1.6 Decisions:**
- Used yaml 2.x with version: '1.1' mode for YAML merge key support critical to Docker Compose
- Interpolation normalizer operates on JSON output (post-toJSON) not raw YAML to preserve AST line offsets
- compose-spec schema bundled as static JSON file with $comment attribution rather than runtime fetch
- getNodeLine includes try/catch and range-undefined guard per yaml issue #573
- ajv singleton compiled at module level with strict:false (compose-spec uses patternProperties), allErrors:true, verbose:true
- Schema rules use SchemaRuleMetadata interface (no check method) because ajv drives validation, not per-rule check() calls
- Error categorization uses keyword+instancePath regex matching to map ajv errors to specific CV-S rules
- CV-S006 (invalid duration) set to warning severity since durations may work at runtime even if schema-invalid
- Port conflict detection uses numeric range intersection instead of set expansion for efficiency
- CV-M001 handles single-port duplicates while CV-M014 handles range overlaps to avoid duplicate violations
- extractDependsOn helper centralized in graph-builder.ts for reuse across 4 semantic rules
- Bind mount detection uses prefix check (., /, ~, $) to prevent false positives on named volume references
- CV-C014 handles registry URLs with port numbers by checking if text after last colon contains slash
- CV-B004 skips 'latest' tag since CV-C014 already covers it, avoiding duplicate violations
- CV-C008 uses suffix-anchored regex to avoid false positives on names like PASSWORD_MIN_LENGTH
- CV-F002 uses yaml Scalar.PLAIN type check to detect unquoted ports at AST level
- Master registry separates 44 custom rules (with check methods) from 8 schema rules (metadata only)
- Engine counts 52 total rules run (44 custom + 8 schema) for accurate reporting
- Scorer builds lookup from both allComposeRules and schemaRules for complete coverage
- Reuse editor-theme.ts and highlight-line.ts from dockerfile-analyzer for compose editor (no duplication)
- analyzeRef pattern (useRef + update outside useEffect) for stale-closure-safe Mod-Enter callback in CodeMirror keymap
- Dual registry lookup (getComposeRuleById ?? getSchemaRuleById) covers all 52 rules in diagnostic mapping and enrichment
- Line number clamping (Math.min(v.line, view.state.doc.lines)) prevents CodeMirror Position out of range crash
- ComposeResultsPanel refactored from stub to tabbed panel with Violations and Dependency Graph tabs
- Compose-specific wrapper components (ComposeCategoryBreakdown, ComposeViolationList, ComposeEmptyState) instead of extending shared Dockerfile components
- Rule IDs rendered as anchor links in ComposeViolationList with stopPropagation to prevent details toggle (Phase 38)
- Tab state via useState (UI-local) not nanostore since tab selection is component-local
- Used @xyflow/react 12.x (scoped package) and @dagrejs/dagre 2.x (maintained fork) for dependency graph
- Cycle-safe dagre layout: remove cycle edges before dagre.layout() to prevent infinite loops, recombine after
- Network color assigned from primary (first) network via 8-color palette for node border coloring
- React Flow CSS imported inside lazy-loaded DependencyGraph.tsx (not globally) to keep initial bundle clean
- nodeTypes/edgeTypes defined at module level to prevent React Flow re-registration flicker
- Graph data memoized with useMemo keyed on yamlContent to avoid recomputation on tab switches
- 3-tier share fallback: Web Share API (mobile) > Clipboard API (desktop) > prompt() (fallback) -- enhanced over Dockerfile pattern
- #compose= hash prefix distinct from #dockerfile= to prevent cross-tool URL collision
- No PromptGenerator in ComposeShareActions -- compose rules differ from Dockerfile rules, deferred to future phase
- DocumentedRule interface unifies ComposeLintRule and SchemaRuleMetadata for page generation without requiring check() method
- allDocumentedRules merges 44 custom + 8 schema rules via cast to DocumentedRule[] for 52-rule static path generation
- Compose rule pages mirror Dockerfile Analyzer pattern: [code].astro with getStaticPaths from allDocumentedRules
- No header nav changes for Compose Validator -- existing /tools/ link with startsWith covers all /tools/* pages
- Database Compass excluded from tools page per user's prior removal (commit 222e677)
- Minimal aside linking to rule docs; companion blog post aside deferred to Phase 40

### Pending Todos

None.

### Blockers/Concerns

- [Infra]: DNS configuration for patrykgolabek.dev is a manual step outside automation scope
- [Tech Debt]: No shared getBlogPostUrl helper -- URL resolution duplicated in 3 files
- [Tech Debt]: Social links hardcoded across 5 component files instead of centralized config
- [Tech Debt]: Category colors defined in 3 places (ProjectCard, ProjectHero, FloatingOrbs)
- [Tech Debt]: Filter system inline script (~80 lines) in projects/index.astro
- [Deferred]: LinkedIn removal from JSON-LD sameAs (CONFIG-02)
- [v1.3 Gap]: Dark mode strategy deferred -- charts use light mode CSS custom properties only
- [v1.4 Tech Debt]: Category colors/grade colors duplicated in badge-generator.ts
- [v1.6 Resolved]: YAML 1.1 merge key config implemented with version: '1.1' and merge: true
- [v1.6 Resolved]: AST path resolver (resolveInstancePath + getNodeLine) implemented for ajv error line mapping
- [v1.6 Resolved]: React Flow bundle lazy-loaded via React.lazy -- 222 KB separate chunk loads only on Graph tab click

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 39-01-PLAN.md (JSON-LD, breadcrumbs, tools page card, homepage callout, sitemap verified) -- Phase 39 complete
Resume file: None
Next: Phase 40 -- OG Images, Blog Post & Polish
