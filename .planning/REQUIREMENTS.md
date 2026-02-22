# Requirements: patrykgolabek.dev

**Defined:** 2026-02-22
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.6 Requirements

Requirements for Docker Compose Validator milestone. Each maps to roadmap phases.

### Editor Foundation

- [x] **EDIT-01**: CodeMirror 6 editor with YAML syntax highlighting via @codemirror/lang-yaml
- [x] **EDIT-02**: Analyze button triggers lint cycle (not real-time as-you-type)
- [x] **EDIT-03**: Pre-loaded sample docker-compose.yml with deliberate issues across all 5 rule categories
- [x] **EDIT-04**: Keyboard shortcut (Cmd/Ctrl+Enter) to trigger analysis
- [x] **EDIT-05**: Dark-only editor theme matching site aesthetic (reuse existing editor-theme.ts pattern)
- [x] **EDIT-06**: Responsive layout — stacked on mobile, side-by-side on desktop
- [x] **EDIT-07**: React island with `client:only="react"` directive
- [x] **EDIT-08**: View Transitions lifecycle — destroy/recreate EditorView on navigation

### YAML Parsing & Schema Validation

- [x] **PARSE-01**: YAML parsing via `yaml` package (eemeli) with YAML 1.1 mode for merge key support
- [x] **PARSE-02**: LineCounter integration for mapping validation errors to source line numbers
- [x] **PARSE-03**: Variable interpolation normalizer — handle ${VAR:-default} patterns gracefully
- [x] **PARSE-04**: compose-spec JSON Schema validation via ajv v8 with Draft-07 support
- [x] **PARSE-05**: Human-readable error messages from ajv oneOf/anyOf validation failures
- [x] **PARSE-06**: compose-spec schema bundled statically at build time (not fetched at runtime)

### Schema Rules

- [x] **SCHEMA-01**: CV-S001 — Invalid YAML syntax detection with line-level error reporting
- [x] **SCHEMA-02**: CV-S002 — Unknown top-level property detection (typos in services, networks, volumes)
- [x] **SCHEMA-03**: CV-S003 — Unknown service property detection (typos within service definitions)
- [x] **SCHEMA-04**: CV-S004 — Invalid port format validation
- [x] **SCHEMA-05**: CV-S005 — Invalid volume format validation
- [x] **SCHEMA-06**: CV-S006 — Invalid duration format in healthcheck intervals and timeouts
- [x] **SCHEMA-07**: CV-S007 — Invalid restart policy values
- [x] **SCHEMA-08**: CV-S008 — Invalid depends_on condition values

### Semantic Rules

- [x] **SEM-01**: CV-M001 — Duplicate exported host ports between services
- [x] **SEM-02**: CV-M002 — Circular depends_on detection via topological sort
- [x] **SEM-03**: CV-M003 — Undefined network reference (service uses network not in top-level networks)
- [x] **SEM-04**: CV-M004 — Undefined volume reference (service uses volume not in top-level volumes)
- [x] **SEM-05**: CV-M005 — Undefined secret reference
- [x] **SEM-06**: CV-M006 — Undefined config reference
- [x] **SEM-07**: CV-M007 — Orphan network definition (defined but never referenced)
- [x] **SEM-08**: CV-M008 — Orphan volume definition (defined but never referenced)
- [x] **SEM-09**: CV-M009 — Orphan secret definition (defined but never referenced)
- [x] **SEM-10**: CV-M010 — depends_on service_healthy without healthcheck on target
- [x] **SEM-11**: CV-M011 — Self-referencing dependency
- [x] **SEM-12**: CV-M012 — Dependency on undefined service
- [x] **SEM-13**: CV-M013 — Duplicate container names across services
- [x] **SEM-14**: CV-M014 — Port range overlap between services
- [x] **SEM-15**: CV-M015 — Invalid image reference format

### Security Rules

- [x] **SEC-01**: CV-C001 — Privileged mode enabled (CWE-250)
- [x] **SEC-02**: CV-C002 — Docker socket mounted in volumes (CWE-250)
- [x] **SEC-03**: CV-C003 — Host network mode bypassing isolation
- [x] **SEC-04**: CV-C004 — Host PID mode exposing host processes
- [x] **SEC-05**: CV-C005 — Host IPC mode sharing memory
- [x] **SEC-06**: CV-C006 — Dangerous capabilities added (SYS_ADMIN, NET_ADMIN, ALL)
- [x] **SEC-07**: CV-C007 — Default capabilities not dropped (missing cap_drop: [ALL])
- [x] **SEC-08**: CV-C008 — Secrets in environment variables (PASSWORD, API_KEY, TOKEN patterns)
- [x] **SEC-09**: CV-C009 — Unbound port interface (missing explicit host IP binding)
- [x] **SEC-10**: CV-C010 — Missing no-new-privileges security option
- [x] **SEC-11**: CV-C011 — Writable filesystem (read_only not set)
- [x] **SEC-12**: CV-C012 — Seccomp disabled (seccomp:unconfined)
- [x] **SEC-13**: CV-C013 — SELinux disabled (label:disable)
- [x] **SEC-14**: CV-C014 — Image uses latest or no tag (supply chain risk)

### Best Practice Rules

- [x] **BP-01**: CV-B001 — Missing healthcheck definition
- [x] **BP-02**: CV-B002 — No restart policy set
- [x] **BP-03**: CV-B003 — No resource limits (deploy.resources.limits)
- [x] **BP-04**: CV-B004 — Image tag not pinned (mutable tags like latest, stable, lts)
- [x] **BP-05**: CV-B005 — No logging configuration (risk of disk fill)
- [x] **BP-06**: CV-B006 — Deprecated version field present
- [x] **BP-07**: CV-B007 — Missing top-level project name field
- [x] **BP-08**: CV-B008 — Both build and image specified (ambiguous)
- [x] **BP-09**: CV-B009 — Anonymous volume usage
- [x] **BP-10**: CV-B010 — No memory reservation alongside limits
- [x] **BP-11**: CV-B011 — Healthcheck timeout exceeds interval
- [x] **BP-12**: CV-B012 — Default network only (no custom network isolation)

### Style Rules

- [x] **STYLE-01**: CV-F001 — Services not alphabetically ordered
- [x] **STYLE-02**: CV-F002 — Ports not quoted (YAML base-60 risk)
- [x] **STYLE-03**: CV-F003 — Inconsistent quoting in port values

### Scoring

- [x] **SCORE-01**: Category-weighted scoring (Security 30%, Semantic 25%, Best Practice 20%, Schema 15%, Style 10%)
- [x] **SCORE-02**: Overall 0-100 score with letter grade (A+ through F)
- [x] **SCORE-03**: Per-category sub-scores displayed alongside aggregate
- [x] **SCORE-04**: Diminishing returns formula (same pattern as Dockerfile Analyzer)

### Results Display

- [x] **RESULT-01**: Inline CodeMirror annotations (squiggly underlines + gutter severity markers)
- [x] **RESULT-02**: Score gauge component (SVG circular gauge with letter grade)
- [x] **RESULT-03**: Category breakdown panel with sub-scores per dimension
- [x] **RESULT-04**: Violation list grouped by severity with expandable details
- [x] **RESULT-05**: Click-to-navigate from results panel to corresponding editor line
- [x] **RESULT-06**: Clean compose file empty state ("No issues found" with congratulatory message)
- [x] **RESULT-07**: Tabbed results panel — Violations tab and Dependency Graph tab

### Dependency Graph

- [ ] **GRAPH-01**: Interactive service dependency graph using React Flow with dagre layout
- [ ] **GRAPH-02**: Service nodes with name, image, and port summary
- [ ] **GRAPH-03**: Directed edges for depends_on relationships with condition labels
- [ ] **GRAPH-04**: Cycle detection with red-highlighted cycle edges
- [ ] **GRAPH-05**: Network membership color-coding on nodes
- [ ] **GRAPH-06**: Zoom, pan, and drag interaction controls
- [ ] **GRAPH-07**: React Flow lazy-loaded to maintain Lighthouse 90+ performance

### Shareability

- [ ] **SHARE-01**: Score badge download as PNG image for social media sharing
- [ ] **SHARE-02**: URL state encoding — compose YAML content in URL hash via lz-string
- [ ] **SHARE-03**: Web Share API on mobile, Clipboard API on desktop, text URL fallback

### Rule Documentation

- [ ] **DOC-01**: Per-rule documentation pages at /tools/compose-validator/rules/[code]
- [ ] **DOC-02**: Each rule page includes: expert explanation, fix suggestion, before/after code, related rules
- [ ] **DOC-03**: Rule pages generated via getStaticPaths from rule registry
- [ ] **DOC-04**: SEO-optimized meta descriptions for each rule page

### Site Integration

- [ ] **SITE-01**: Header navigation link for Docker Compose Validator
- [ ] **SITE-02**: Homepage callout linking to the Compose Validator
- [ ] **SITE-03**: Tools page card for Compose Validator
- [ ] **SITE-04**: JSON-LD SoftwareApplication structured data on tool page
- [ ] **SITE-05**: BreadcrumbList JSON-LD on tool page and rule documentation pages
- [ ] **SITE-06**: All tool and rule pages in sitemap
- [ ] **SITE-07**: Build-time OG image for tool page via Satori + Sharp

### Content

- [ ] **CONTENT-01**: Companion blog post covering Docker Compose best practices and tool architecture
- [ ] **CONTENT-02**: Bidirectional cross-links between blog post and tool page

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Graph Enhancements

- **GRAPH-F01**: Volume sharing visualization (dotted lines between services sharing volumes)
- **GRAPH-F02**: Export graph as PNG/SVG image
- **GRAPH-F03**: Service health status indicators on nodes (visual healthcheck presence)

### Analysis Enhancements

- **ANALYSIS-F01**: Inline rule disable comments (# cv-ignore: CV-C001)
- **ANALYSIS-F02**: Configurable rule severity overrides
- **ANALYSIS-F03**: Multi-file compose support (extends, includes)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Auto-fix / auto-correct | Too many edge cases; modifying user's YAML risks breaking intent |
| Real-time as-you-type linting | YAML parsing on every keystroke is expensive; partial YAML is invalid |
| Multi-file compose (includes, extends, overrides) | Browser has no filesystem; user should run `docker compose config` first |
| Environment variable resolution | Browser has no access to user's .env; substituting wrong values masks issues |
| AI-powered analysis | Contradicts human-expertise positioning; requires API calls |
| Docker Hub image verification | Requires network calls; rate-limited; private registries |
| Kubernetes manifest generation | Massive scope; Kompose exists for this |
| Version migration tool | Version field is deprecated; simply remove it |
| Profile-aware validation | Profiles don't create invalid configurations |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PARSE-01 | Phase 33 | Complete |
| PARSE-02 | Phase 33 | Complete |
| PARSE-03 | Phase 33 | Complete |
| PARSE-04 | Phase 33 | Complete |
| PARSE-05 | Phase 33 | Complete |
| PARSE-06 | Phase 33 | Complete |
| SCHEMA-01 | Phase 33 | Complete |
| SCHEMA-02 | Phase 33 | Complete |
| SCHEMA-03 | Phase 33 | Complete |
| SCHEMA-04 | Phase 33 | Complete |
| SCHEMA-05 | Phase 33 | Complete |
| SCHEMA-06 | Phase 33 | Complete |
| SCHEMA-07 | Phase 33 | Complete |
| SCHEMA-08 | Phase 33 | Complete |
| SEM-01 | Phase 34 | Complete |
| SEM-02 | Phase 34 | Complete |
| SEM-03 | Phase 34 | Complete |
| SEM-04 | Phase 34 | Complete |
| SEM-05 | Phase 34 | Complete |
| SEM-06 | Phase 34 | Complete |
| SEM-07 | Phase 34 | Complete |
| SEM-08 | Phase 34 | Complete |
| SEM-09 | Phase 34 | Complete |
| SEM-10 | Phase 34 | Complete |
| SEM-11 | Phase 34 | Complete |
| SEM-12 | Phase 34 | Complete |
| SEM-13 | Phase 34 | Complete |
| SEM-14 | Phase 34 | Complete |
| SEM-15 | Phase 34 | Complete |
| SEC-01 | Phase 34 | Complete |
| SEC-02 | Phase 34 | Complete |
| SEC-03 | Phase 34 | Complete |
| SEC-04 | Phase 34 | Complete |
| SEC-05 | Phase 34 | Complete |
| SEC-06 | Phase 34 | Complete |
| SEC-07 | Phase 34 | Complete |
| SEC-08 | Phase 34 | Complete |
| SEC-09 | Phase 34 | Complete |
| SEC-10 | Phase 34 | Complete |
| SEC-11 | Phase 34 | Complete |
| SEC-12 | Phase 34 | Complete |
| SEC-13 | Phase 34 | Complete |
| SEC-14 | Phase 34 | Complete |
| BP-01 | Phase 34 | Complete |
| BP-02 | Phase 34 | Complete |
| BP-03 | Phase 34 | Complete |
| BP-04 | Phase 34 | Complete |
| BP-05 | Phase 34 | Complete |
| BP-06 | Phase 34 | Complete |
| BP-07 | Phase 34 | Complete |
| BP-08 | Phase 34 | Complete |
| BP-09 | Phase 34 | Complete |
| BP-10 | Phase 34 | Complete |
| BP-11 | Phase 34 | Complete |
| BP-12 | Phase 34 | Complete |
| STYLE-01 | Phase 34 | Complete |
| STYLE-02 | Phase 34 | Complete |
| STYLE-03 | Phase 34 | Complete |
| SCORE-01 | Phase 34 | Complete |
| SCORE-02 | Phase 34 | Complete |
| SCORE-03 | Phase 34 | Complete |
| SCORE-04 | Phase 34 | Complete |
| EDIT-01 | Phase 35 | Complete |
| EDIT-02 | Phase 35 | Complete |
| EDIT-03 | Phase 35 | Complete |
| EDIT-04 | Phase 35 | Complete |
| EDIT-05 | Phase 35 | Complete |
| EDIT-06 | Phase 35 | Complete |
| EDIT-07 | Phase 35 | Complete |
| EDIT-08 | Phase 35 | Complete |
| RESULT-01 | Phase 36 | Complete |
| RESULT-02 | Phase 36 | Complete |
| RESULT-03 | Phase 36 | Complete |
| RESULT-04 | Phase 36 | Complete |
| RESULT-05 | Phase 36 | Complete |
| RESULT-06 | Phase 36 | Complete |
| RESULT-07 | Phase 36 | Complete |
| GRAPH-01 | Phase 36 | Pending |
| GRAPH-02 | Phase 36 | Pending |
| GRAPH-03 | Phase 36 | Pending |
| GRAPH-04 | Phase 36 | Pending |
| GRAPH-05 | Phase 36 | Pending |
| GRAPH-06 | Phase 36 | Pending |
| GRAPH-07 | Phase 36 | Pending |
| SHARE-01 | Phase 37 | Pending |
| SHARE-02 | Phase 37 | Pending |
| SHARE-03 | Phase 37 | Pending |
| DOC-01 | Phase 38 | Pending |
| DOC-02 | Phase 38 | Pending |
| DOC-03 | Phase 38 | Pending |
| DOC-04 | Phase 38 | Pending |
| SITE-01 | Phase 39 | Pending |
| SITE-02 | Phase 39 | Pending |
| SITE-03 | Phase 39 | Pending |
| SITE-04 | Phase 39 | Pending |
| SITE-05 | Phase 39 | Pending |
| SITE-06 | Phase 39 | Pending |
| SITE-07 | Phase 40 | Pending |
| CONTENT-01 | Phase 40 | Pending |
| CONTENT-02 | Phase 40 | Pending |

**Coverage:**
- v1.6 requirements: 100 total
- Mapped to phases: 100
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after roadmap creation (phases 33-40)*
