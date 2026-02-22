# Milestone v1.6: Docker Compose Validator

**Status:** In progress
**Phases:** 33-40
**Total Plans:** TBD

## Overview

Docker Compose Validator is an interactive browser-based Docker Compose validation tool at /tools/compose-validator/ that validates YAML files against the compose-spec JSON Schema and a custom semantic rule engine with 52 rules across 5 categories, displays category-weighted scores with letter grades, annotates violations inline in a CodeMirror 6 editor, and renders an interactive service dependency graph via React Flow. This is the fourth content pillar for the portfolio, following the Dockerfile Analyzer architecture pattern -- parallel namespace, pattern-mirrored, with YAML AST parsing (eemeli/yaml), Ajv schema validation, graphology cycle detection, and React Flow graph visualization as the novel additions. Companion blog post covers Docker Compose best practices and tool architecture.

## Phases

**Phase Numbering:**
- Integer phases (33, 34, ...): Planned milestone work
- Decimal phases (33.1, 33.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 33: YAML Parsing & Schema Validation Foundation** - YAML parser with line mapping, variable interpolation normalizer, and Ajv schema validation with 8 schema rules
- [ ] **Phase 34: Rule Engine, Rules & Scoring** - 44 analysis rules (semantic, security, best practice, style), rule engine, graph builder, cycle detector, and category-weighted scoring
- [ ] **Phase 35: CodeMirror YAML Editor & Nanostores** - CodeMirror 6 editor with YAML highlighting, analyze trigger, sample file, and nanostore state management
- [ ] **Phase 36: Results Panel & Dependency Graph** - Score gauge, category breakdown, violation list, tabbed results panel, and React Flow dependency graph with dagre layout
- [ ] **Phase 37: Shareability & Badge Export** - Score badge PNG download, lz-string URL state encoding, and Web Share / Clipboard API sharing
- [ ] **Phase 38: Rule Documentation Pages** - 52 per-rule documentation pages with explanations, fix suggestions, before/after code, and SEO metadata
- [ ] **Phase 39: Tool Page & Site Integration** - Astro tool page, header navigation, homepage callout, tools page card, JSON-LD structured data, breadcrumbs, and sitemap
- [ ] **Phase 40: OG Images, Blog Post & Polish** - Build-time OG image, companion blog post with bidirectional cross-links

## Phase Details

### Phase 33: YAML Parsing & Schema Validation Foundation
**Goal**: A YAML string can be parsed into an AST with source line numbers, variable interpolation is normalized, and the compose-spec JSON Schema validates structural correctness with human-readable error messages mapped to exact source lines
**Depends on**: Nothing (first phase of v1.6 -- builds on shipped v1.5)
**Requirements**: PARSE-01, PARSE-02, PARSE-03, PARSE-04, PARSE-05, PARSE-06, SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07, SCHEMA-08
**Success Criteria** (what must be TRUE):
  1. A Docker Compose YAML string with merge keys (<<) parses correctly in YAML 1.1 mode and returns a Document AST with node ranges
  2. Variable interpolation patterns like ${VAR:-default} are normalized before validation so they do not produce false-positive schema errors
  3. Schema validation against compose-spec reports structural errors (unknown properties, invalid port/volume/duration formats, invalid restart/depends_on values) with accurate 1-based source line numbers
  4. Invalid YAML syntax produces a clear error message with the line number where parsing failed
  5. Human-readable error messages are generated from ajv oneOf/anyOf validation failures (not raw JSON Schema paths)
**Plans**: 2 plans

Plans:
- [x] 33-01-PLAN.md — Install yaml/ajv/ajv-formats, create types, interpolation normalizer, bundled compose-spec schema, and YAML 1.1 parser with LineCounter and AST helpers
- [x] 33-02-PLAN.md — Create ajv schema validator with error categorization, human-readable messages, and 8 schema rule metadata files (CV-S001 through CV-S008)

### Phase 34: Rule Engine, Rules & Scoring
**Goal**: All 44 custom analysis rules (15 semantic, 14 security, 12 best practice, 3 style) execute against a parsed Compose file, detect violations with line-accurate positions, and produce a category-weighted 0-100 score with letter grade
**Depends on**: Phase 33
**Requirements**: SEM-01, SEM-02, SEM-03, SEM-04, SEM-05, SEM-06, SEM-07, SEM-08, SEM-09, SEM-10, SEM-11, SEM-12, SEM-13, SEM-14, SEM-15, SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10, SEC-11, SEC-12, SEC-13, SEC-14, BP-01, BP-02, BP-03, BP-04, BP-05, BP-06, BP-07, BP-08, BP-09, BP-10, BP-11, BP-12, STYLE-01, STYLE-02, STYLE-03, SCORE-01, SCORE-02, SCORE-03, SCORE-04
**Success Criteria** (what must be TRUE):
  1. Semantic rules detect port conflicts, circular depends_on, undefined resource references, orphan definitions, and invalid image references -- each violation reports the exact source line
  2. Security rules flag privileged mode, Docker socket mounts, host network/PID/IPC modes, dangerous capabilities, secrets in environment variables, and missing security hardening -- with CWE references where applicable
  3. Best practice rules detect missing healthchecks, restart policies, resource limits, logging config, and deprecated/ambiguous configurations
  4. The scoring engine produces a 0-100 score with letter grade (A+ through F) using diminishing returns formula and category weights (Security 30%, Semantic 25%, Best Practice 20%, Schema 15%, Style 10%)
  5. A graph builder extracts service dependency relationships and a cycle detector identifies circular depends_on chains (shared between semantic rules and graph visualization)
**Plans**: 3 plans

Plans:
- [ ] 34-01-PLAN.md — Shared utilities (port parser, graph builder with cycle detection) and 15 semantic rules (CV-M001 through CV-M015)
- [ ] 34-02-PLAN.md — 14 security rules (CV-C001 through CV-C014) and 12 best practice rules (CV-B001 through CV-B012)
- [ ] 34-03-PLAN.md — 3 style rules (CV-F001 through CV-F003), master rule registry, rule engine orchestrator, and category-weighted scoring engine

### Phase 35: CodeMirror YAML Editor & Nanostores
**Goal**: Users see a CodeMirror 6 editor with YAML syntax highlighting, a pre-loaded sample compose file, and can trigger analysis via button or keyboard shortcut -- with results flowing through nanostores to the results panel
**Depends on**: Phase 34
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, EDIT-08
**Success Criteria** (what must be TRUE):
  1. The editor renders with YAML syntax highlighting and a dark theme matching the site aesthetic
  2. A pre-loaded sample docker-compose.yml contains deliberate issues across all 5 rule categories so users see meaningful results immediately
  3. Clicking the Analyze button or pressing Cmd/Ctrl+Enter triggers the full validation pipeline and writes results to nanostores
  4. The editor survives View Transitions navigation (destroy/recreate lifecycle) without stale state
**Plans**: TBD

Plans:
- [ ] 35-01: TBD
- [ ] 35-02: TBD

### Phase 36: Results Panel & Dependency Graph
**Goal**: Users see their validation results as inline editor annotations, a score gauge, category breakdown, severity-grouped violation list, and an interactive service dependency graph with cycle highlighting -- all in a tabbed results panel
**Depends on**: Phase 35
**Requirements**: RESULT-01, RESULT-02, RESULT-03, RESULT-04, RESULT-05, RESULT-06, RESULT-07, GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06, GRAPH-07
**Success Criteria** (what must be TRUE):
  1. Violations appear as squiggly underlines in the editor with severity-colored gutter markers, and clicking a violation in the results panel scrolls the editor to the corresponding line
  2. The score gauge displays the overall letter grade and 0-100 score, with per-category sub-scores shown in a breakdown panel
  3. The dependency graph tab renders service nodes with names, images, and port info, connected by directed edges for depends_on relationships with condition labels
  4. Circular dependencies are highlighted with red edges in the graph, and the graph supports zoom, pan, and drag interactions
  5. React Flow is lazy-loaded so Lighthouse Performance stays at 90+ (graph bundle deferred until user activates the Graph tab)
**Plans**: TBD

Plans:
- [ ] 36-01: TBD
- [ ] 36-02: TBD

### Phase 37: Shareability & Badge Export
**Goal**: Users can download their score as a PNG badge for social sharing, share a URL that preserves their compose file content, and use native share/clipboard APIs
**Depends on**: Phase 36
**Requirements**: SHARE-01, SHARE-02, SHARE-03
**Success Criteria** (what must be TRUE):
  1. The score badge downloads as a branded PNG image suitable for social media
  2. The compose YAML content is encoded in the URL hash via lz-string so the link restores the exact file and analysis results
  3. On mobile Web Share API is available, on desktop Clipboard API copies the URL, with text URL fallback on unsupported browsers
**Plans**: TBD

Plans:
- [ ] 37-01: TBD

### Phase 38: Rule Documentation Pages
**Goal**: Every rule has its own SEO-indexed documentation page at /tools/compose-validator/rules/[code] with expert explanation, fix suggestion, and before/after code examples
**Depends on**: Phase 34 (rule registry must exist)
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04
**Success Criteria** (what must be TRUE):
  1. Navigating to /tools/compose-validator/rules/CV-C001 (or any rule code) loads a documentation page with expert explanation, fix suggestion, before/after YAML code, and related rules
  2. Pages are generated at build time via getStaticPaths from the rule registry (one page per rule)
  3. Each rule page has an SEO-optimized meta description unique to that rule
**Plans**: TBD

Plans:
- [ ] 38-01: TBD

### Phase 39: Tool Page & Site Integration
**Goal**: The Compose Validator is discoverable from every entry point -- header navigation, homepage callout, tools page, search engines (via JSON-LD and sitemap), and breadcrumb navigation
**Depends on**: Phase 36 (React island must exist), Phase 38 (rule pages must exist for cross-linking)
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06
**Success Criteria** (what must be TRUE):
  1. The header navigation includes a link to the Compose Validator (under Tools)
  2. The homepage displays a callout card linking to the Compose Validator
  3. The tools page shows a Compose Validator card alongside the Dockerfile Analyzer and Database Compass
  4. The tool page has JSON-LD SoftwareApplication structured data, BreadcrumbList JSON-LD on tool and rule pages, and all tool + rule pages appear in the sitemap
**Plans**: TBD

Plans:
- [ ] 39-01: TBD

### Phase 40: OG Images, Blog Post & Polish
**Goal**: The Compose Validator has a professional social preview image, a companion blog post provides editorial context and SEO value, and all pages pass Lighthouse and accessibility audits
**Depends on**: Phase 39 (pages must exist for OG routes and cross-linking)
**Requirements**: SITE-07, CONTENT-01, CONTENT-02
**Success Criteria** (what must be TRUE):
  1. Sharing the tool page URL on social media displays a custom OG image generated at build time via Satori + Sharp
  2. A companion blog post covers Docker Compose best practices and tool architecture, with bidirectional cross-links between the blog post and tool page
  3. All tool and rule pages maintain Lighthouse 90+ scores and pass WCAG 2.1 AA accessibility checks
**Plans**: TBD

Plans:
- [ ] 40-01: TBD
- [ ] 40-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 33 -> 34 -> 35 -> 36 -> 37 -> 38 -> 39 -> 40

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 33. YAML Parsing & Schema Validation Foundation | 2/2 | Complete | 2026-02-22 |
| 34. Rule Engine, Rules & Scoring | 1/3 | In Progress|  |
| 35. CodeMirror YAML Editor & Nanostores | 0/2 | Not started | - |
| 36. Results Panel & Dependency Graph | 0/2 | Not started | - |
| 37. Shareability & Badge Export | 0/1 | Not started | - |
| 38. Rule Documentation Pages | 0/1 | Not started | - |
| 39. Tool Page & Site Integration | 0/1 | Not started | - |
| 40. OG Images, Blog Post & Polish | 0/2 | Not started | - |
