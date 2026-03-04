# Roadmap: GitHub Actions Workflow Validator (v1.13)

## Overview

Build a browser-based GitHub Actions workflow validator with two-pass linting (SchemaStore JSON Schema + actionlint WASM), full workflow graph visualization, category-weighted scoring, and per-rule SEO documentation pages. This is the fifth tool in the portfolio suite and the first to use WebAssembly. Phases 75-81 deliver the complete tool from WASM infrastructure de-risking through site integration and companion blog post.

## Milestones

- [x] **v1.0 MVP** - Phases 1-7 (shipped 2026-02-11)
- [x] **v1.1 Content Refresh** - Phases 8-12 (shipped 2026-02-12)
- [x] **v1.2 Projects Page Redesign** - Phases 13-15 (shipped 2026-02-13)
- [x] **v1.3 The Beauty Index** - Phases 16-21 (shipped 2026-02-17)
- [x] **v1.4 Dockerfile Analyzer** - Phases 22-27 (shipped 2026-02-20)
- [x] **v1.5 Database Compass** - Phases 28-32 (shipped 2026-02-22)
- [x] **v1.6 Docker Compose Validator** - Phases 33-40 (shipped 2026-02-23)
- [x] **v1.7 Kubernetes Manifest Analyzer** - Phases 41-47 (shipped 2026-02-23)
- [x] **v1.8 EDA Visual Encyclopedia** - Phases 48-55 (shipped 2026-02-25)
- [x] **v1.9 EDA Case Study Deep Dive** - Phases 56-63 (shipped 2026-02-27)
- [x] **v1.11 Beauty Index: Lisp** - Phases 69-71 (shipped 2026-03-02)
- [x] **v1.12 Dockerfile Rules Expansion** - Phases 72-74 (shipped 2026-03-02)
- [ ] **v1.13 GitHub Actions Workflow Validator** - Phases 75-81 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (75, 76, ...): Planned milestone work
- Decimal phases (75.1, 75.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 75: WASM Infrastructure and Schema Foundation** - De-risk actionlint WASM in Web Worker and pre-compile SchemaStore schema validator (completed 2026-03-04)
- [x] **Phase 76: Two-Pass Engine and Security Rules** - Build validation orchestrator with deduplication and all 10 security rules (completed 2026-03-04)
- [x] **Phase 77: Semantic, Best Practice, and Style Rules** - Complete all remaining rule categories (18 actionlint mappings + 8 best practice + 4 style) (completed 2026-03-04)
- [x] **Phase 78: Scoring, Editor, and Results Panel** - Category-weighted scoring engine with CodeMirror 6 editor and tabbed results UI (completed 2026-03-04)
- [x] **Phase 79: Workflow Graph Visualization** - React Flow workflow graph with trigger, job, and step nodes using dagre layout (completed 2026-03-04)
- [x] **Phase 80: Sharing and Rule Documentation Pages** - Shareable results and per-rule SEO documentation pages for all rules (completed 2026-03-04)
- [ ] **Phase 81: Site Integration and Blog Post** - Full site integration with navigation, homepage callout, JSON-LD, OG image, and companion blog post

## Phase Details

### Phase 75: WASM Infrastructure and Schema Foundation
**Goal**: Users can load the actionlint WASM binary in a Web Worker and validate a workflow against the SchemaStore JSON Schema -- the two foundational engines that all subsequent phases build on
**Depends on**: Nothing (first phase of v1.13)
**Requirements**: WASM-01, WASM-02, WASM-03, WASM-04, WASM-05, SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04
**Success Criteria** (what must be TRUE):
  1. actionlint WASM binary loads in a Web Worker and returns lint errors for a known-bad workflow YAML string
  2. A progress indicator is visible while the WASM binary downloads and initializes
  3. SchemaStore github-workflow.json is pre-compiled into a standalone ajv validator that runs synchronously and returns structural errors with line numbers
  4. Both validation paths can be invoked independently from the browser console with correct error output
**Plans**: 2 plans (1 wave, parallel)

Plans:
- [ ] 75-01-PLAN.md — WASM Worker infrastructure (download script, Worker, client, types, store)
- [ ] 75-02-PLAN.md — Schema compilation pipeline (compile script, parser, schema-validator, sample workflow)

### Phase 76: Two-Pass Engine and Security Rules
**Goal**: Users get merged, deduplicated validation results from both schema and WASM passes, with all 10 security rules detecting dangerous workflow patterns
**Depends on**: Phase 75
**Requirements**: ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10
**Success Criteria** (what must be TRUE):
  1. Pass 1 (schema + custom rules) returns results immediately while Pass 2 (WASM) loads and runs asynchronously
  2. Duplicate diagnostics from both passes on the same (line, column) are merged into a single violation
  3. All violations carry a unified format with ruleId, message, line, column, severity, and category
  4. Security rules detect unpinned actions, script injection, overly permissive permissions, pull_request_target misuse, hardcoded secrets, and self-hosted runner usage
**Plans**: 3 plans (3 waves, sequential)

Plans:
- [ ] 76-01-PLAN.md — Unified types, two-pass engine with runPass1/mergePass2, deduplication, and actionlint error mapping
- [ ] 76-02-PLAN.md — Security rules GA-C001 through GA-C005 (action pinning, permissions, script injection) with AST helpers
- [ ] 76-03-PLAN.md — Security rules GA-C006 through GA-C010 (pull_request_target, secrets, third-party, scopes, self-hosted) with rule registry and security sample

### Phase 77: Semantic, Best Practice, and Style Rules
**Goal**: All 30 remaining lint rules are implemented -- actionlint semantic mappings, best practice checks, and style conventions -- completing the full 48-rule registry
**Depends on**: Phase 76
**Requirements**: SEM-01, SEM-02, SEM-03, SEM-04, BP-01, BP-02, BP-03, BP-04, BP-05, BP-06, BP-07, BP-08, STYLE-01, STYLE-02, STYLE-03, STYLE-04
**Success Criteria** (what must be TRUE):
  1. 18 actionlint error kinds are mapped to stable GA-L001 through GA-L018 rule IDs with appropriate scoring categories
  2. GA-L017 (shellcheck) and GA-L018 (pyflakes) are documented as unavailable in the browser WASM build
  3. Best practice rules detect missing timeout-minutes, missing concurrency groups, unnamed steps, duplicate step names, empty env blocks, missing conditionals, outdated actions, and missing continue-on-error
  4. Style rules detect non-alphabetical job ordering, inconsistent quoting, long step names, and missing workflow name
  5. All rules include enriched explanations and fix suggestions beyond raw actionlint messages
**Plans**: 3 plans (3 waves, sequential)

Plans:
- [ ] 77-01-PLAN.md — Actionlint semantic enrichment (18 GA-L* metadata rules, engine mapping completion, AST helpers)
- [ ] 77-02-PLAN.md — Best practice rules GA-B001 through GA-B008
- [ ] 77-03-PLAN.md — Style rules GA-F001 through GA-F004, master registry integration, comprehensive sample workflow

### Phase 78: Scoring, Editor, and Results Panel
**Goal**: Users can paste a GitHub Actions workflow into a CodeMirror editor, trigger analysis, and see a scored results panel with inline annotations, category breakdowns, and violation details
**Depends on**: Phase 77
**Requirements**: SCORE-01, SCORE-02, SCORE-03, SCORE-04, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, UI-10
**Success Criteria** (what must be TRUE):
  1. User can paste or edit YAML in a CodeMirror 6 editor with syntax highlighting and trigger analysis via button or Cmd/Ctrl+Enter
  2. Inline squiggly underlines and gutter severity markers appear on lines with violations
  3. Tabbed results panel shows an SVG score gauge with letter grade, per-category sub-scores, and violation list grouped by category with expandable details
  4. Clicking a violation in the results panel scrolls the editor to the corresponding line
  5. A clean workflow shows a congratulatory "No issues found" empty state
**Plans**: 3 plans (3 waves, sequential)

Plans:
- [ ] 78-01-PLAN.md — TDD scoring engine with category weights, diminishing returns, letter grades
- [ ] 78-02-PLAN.md — CodeMirror YAML editor with two-pass analysis orchestration and inline annotations
- [ ] 78-03-PLAN.md — Results panel with score gauge, category breakdown, violation list, empty state, and Astro page

### Phase 79: Workflow Graph Visualization
**Goal**: Users can see their workflow rendered as an interactive graph showing triggers flowing to jobs flowing to steps, with color-coded violation status
**Depends on**: Phase 78
**Requirements**: GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06, GRAPH-07
**Success Criteria** (what must be TRUE):
  1. Workflow graph displays three node types -- trigger events, jobs, and steps -- connected by dependency edges
  2. Job dependency edges from `needs:` declarations are rendered with cycle detection
  3. Nodes are color-coded by violation status (clean/warning/error)
  4. React Flow loads lazily via React.lazy as a separate chunk to maintain Lighthouse 90+ performance
**Plans**: 3 plans (2 waves)

Plans:
- [ ] 79-01-PLAN.md — TDD graph data extractor with cycle detection, three node types, trigger-to-job edges, violation status
- [ ] 79-02-PLAN.md — Custom React Flow node/edge components, graph skeleton, dark theme CSS
- [ ] 79-03-PLAN.md — GhaWorkflowGraph dagre LR layout and lazy-loaded integration into GhaResultsPanel

### Phase 80: Sharing and Rule Documentation Pages
**Goal**: Users can share their validation results and browse per-rule SEO documentation pages for all rules
**Depends on**: Phase 79
**Requirements**: SHARE-01, SHARE-02, SHARE-03, DOC-01, DOC-02, DOC-03, DOC-04
**Success Criteria** (what must be TRUE):
  1. User can download a score badge as a PNG image for social media or README embedding
  2. Workflow content is encoded in the URL hash with `#gha=` prefix for shareable analysis links
  3. Per-rule documentation pages exist at `/tools/gha-validator/rules/[code]` with expert explanation, fix suggestion, before/after YAML code, severity badge, and related rules
  4. GA-L017 and GA-L018 rule pages note the browser WASM limitation with CLI recommendation
**Plans**: 3 plans (2 waves)

Plans:
- [ ] 80-01-PLAN.md — TDD schema rule metadata (GA-S001--GA-S008), related rules function, registry update to 48 entries
- [ ] 80-02-PLAN.md — Per-rule SEO documentation pages at /tools/gha-validator/rules/[code]/ with WASM limitation callout
- [ ] 80-03-PLAN.md — Sharing utilities (badge PNG, URL state encoding, share fallback) and UI wiring

### Phase 81: Site Integration and Blog Post
**Goal**: The GitHub Actions Validator is fully integrated into the site with navigation, homepage presence, SEO metadata, and a companion blog post driving organic traffic
**Depends on**: Phase 80
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07, SITE-08, SITE-09, SITE-10, BLOG-01, BLOG-02, BLOG-03
**Success Criteria** (what must be TRUE):
  1. Tool page is accessible at `/tools/gha-validator/` with full editor and results functionality
  2. Header navigation includes a link to the validator, homepage has a callout card, and tools page has an entry
  3. JSON-LD SoftwareApplication structured data, build-time OG image, breadcrumb navigation, sitemap entries, SEO meta descriptions, and LLMs.txt entry are all present
  4. Companion blog post covers GitHub Actions best practices and tool architecture with bidirectional cross-links to the tool page and individual rule documentation pages
**Plans**: 2 plans (1 wave, parallel)

Plans:
- [ ] 81-01-PLAN.md — Site integration: JSON-LD, OG image, tool page enhancement, homepage card, tools page card, LLMs.txt
- [ ] 81-02-PLAN.md — Companion blog post with bidirectional cross-links and [slug].astro structured data wiring

## Progress

**Execution Order:**
Phases execute in numeric order: 75 -> 76 -> 77 -> 78 -> 79 -> 80 -> 81

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 75. WASM Infrastructure and Schema Foundation | 2/2 | Complete   | 2026-03-04 |
| 76. Two-Pass Engine and Security Rules | 3/3 | Complete   | 2026-03-04 |
| 77. Semantic, Best Practice, and Style Rules | 3/3 | Complete   | 2026-03-04 |
| 78. Scoring, Editor, and Results Panel | 3/3 | Complete   | 2026-03-04 |
| 79. Workflow Graph Visualization | 3/3 | Complete   | 2026-03-04 |
| 80. Sharing and Rule Documentation Pages | 3/3 | Complete   | 2026-03-04 |
| 81. Site Integration and Blog Post | 0/2 | Not started | - |
