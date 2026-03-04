# Requirements: GitHub Actions Workflow Validator

**Defined:** 2026-03-04
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression

## v1.13 Requirements

Requirements for the GitHub Actions Workflow Validator. Each maps to roadmap phases.

### WASM Infrastructure

- [x] **WASM-01**: actionlint WASM binary served as static asset from `public/wasm/` directory
- [x] **WASM-02**: Web Worker loads and initializes actionlint WASM with `wasm_exec.js` bridge
- [x] **WASM-03**: Worker exposes `runActionlint(yamlSource)` returning `ActionlintError[]` with `{kind, message, line, column}`
- [x] **WASM-04**: WASM loading shows progress indicator while binary downloads (~3MB gzipped)
- [x] **WASM-05**: Worker message protocol handles analyze requests and returns results to main thread

### Schema Validation

- [x] **SCHEMA-01**: SchemaStore `github-workflow.json` pre-compiled into ajv standalone validator at build time
- [x] **SCHEMA-02**: Schema validation runs synchronously on main thread for instant structural feedback
- [x] **SCHEMA-03**: 8 schema rules (GA-S001 through GA-S008) mapped from ajv validation errors with line numbers
- [x] **SCHEMA-04**: Schema rules cover: YAML syntax, unknown properties, type mismatches, missing required fields, invalid enum values

### Two-Pass Engine

- [x] **ENGINE-01**: Two-pass architecture: Pass 1 (schema + custom rules, synchronous) and Pass 2 (actionlint WASM, async via Worker)
- [x] **ENGINE-02**: Diagnostic deduplication merges findings from both passes, suppressing duplicates on `(line, column)` pairs
- [x] **ENGINE-03**: Results from Pass 1 displayed immediately while WASM loads and runs Pass 2
- [x] **ENGINE-04**: All violations mapped to unified format with `{ruleId, message, line, column, severity, category}`

### Security Rules

- [x] **SEC-01**: GA-C001 flags unpinned action versions (`actions/checkout@v4` instead of SHA)
- [x] **SEC-02**: GA-C002 flags mutable action tags (branch refs like `@main`)
- [x] **SEC-03**: GA-C003 flags overly permissive permissions (`permissions: write-all`)
- [x] **SEC-04**: GA-C004 flags missing permissions block at workflow level
- [x] **SEC-05**: GA-C005 flags script injection risk (`${{ github.event.*.title }}` in `run:` blocks)
- [x] **SEC-06**: GA-C006 flags `pull_request_target` without path/branch restrictions
- [x] **SEC-07**: GA-C007 flags hardcoded secrets in workflow file
- [x] **SEC-08**: GA-C008 flags third-party actions without SHA pinning
- [x] **SEC-09**: GA-C009 flags dangerous combined GITHUB_TOKEN permission scopes
- [x] **SEC-10**: GA-C010 flags self-hosted runner usage (informational security reminder)

### Semantic Rules (actionlint)

- [x] **SEM-01**: 18 actionlint rule kinds mapped to GA-L001 through GA-L018 with stable rule IDs
- [x] **SEM-02**: Each actionlint kind assigned to appropriate scoring category (Security, Semantic, or Best Practice)
- [x] **SEM-03**: GA-L017 (shellcheck) and GA-L018 (pyflakes) documented as unavailable in browser WASM build
- [x] **SEM-04**: actionlint error messages enriched with rule-specific explanations and fix suggestions

### Best Practice Rules

- [x] **BP-01**: GA-B001 flags jobs missing `timeout-minutes` (default is 6 hours)
- [x] **BP-02**: GA-B002 flags workflows missing `concurrency:` group
- [x] **BP-03**: GA-B003 flags steps without `name:` field
- [x] **BP-04**: GA-B004 flags duplicate step names within same job
- [x] **BP-05**: GA-B005 flags empty `env:` blocks
- [x] **BP-06**: GA-B006 flags jobs without conditional on PR-only workflows
- [x] **BP-07**: GA-B007 flags outdated major versions of well-known actions
- [x] **BP-08**: GA-B008 flags steps fetching external data without `continue-on-error`

### Style Rules

- [x] **STYLE-01**: GA-F001 flags jobs not alphabetically ordered
- [x] **STYLE-02**: GA-F002 flags inconsistent `uses:` quoting
- [x] **STYLE-03**: GA-F003 flags step names exceeding 80 characters
- [x] **STYLE-04**: GA-F004 flags workflows missing `name:` at top level

### Scoring

- [x] **SCORE-01**: Category-weighted scoring: Schema 15%, Security 35%, Semantic 20%, Best Practice 20%, Style 10%
- [x] **SCORE-02**: Overall 0-100 score with letter grade (A+ through F) using diminishing-returns formula
- [x] **SCORE-03**: Per-category sub-scores alongside aggregate score
- [x] **SCORE-04**: Score gauge component (SVG circular gauge with letter grade)

### Editor & Results

- [x] **UI-01**: CodeMirror 6 YAML editor with syntax highlighting and line numbers
- [x] **UI-02**: Analyze button triggers validation cycle (Cmd/Ctrl+Enter shortcut)
- [x] **UI-03**: Pre-loaded sample workflow with deliberate issues across all rule categories
- [x] **UI-04**: Inline CodeMirror annotations (squiggly underlines + gutter severity markers)
- [x] **UI-05**: Tabbed results panel with score gauge, category breakdown, and violation list
- [x] **UI-06**: Click-to-navigate from results panel to corresponding editor line
- [x] **UI-07**: Violation list grouped by category with expandable details and rule ID links
- [x] **UI-08**: Clean workflow empty state ("No issues found" with congratulatory message)
- [x] **UI-09**: Responsive layout — stacked on mobile, side-by-side on desktop
- [x] **UI-10**: React island with `client:only="react"` directive

### Workflow Graph

- [ ] **GRAPH-01**: Full workflow graph with 3 node types: trigger events, jobs, steps
- [ ] **GRAPH-02**: Job dependency edges from `needs:` declarations with cycle detection
- [ ] **GRAPH-03**: Trigger-to-job edges from `on:` event definitions
- [ ] **GRAPH-04**: Steps displayed as sequential nodes within job containers
- [ ] **GRAPH-05**: Color-coded nodes by violation status (clean/warning/error)
- [ ] **GRAPH-06**: React Flow lazy-loaded via React.lazy (separate chunk for Lighthouse 90+)
- [ ] **GRAPH-07**: dagre hierarchical layout (left-to-right) with grouped dependency levels

### Sharing

- [ ] **SHARE-01**: Score badge download as PNG image for social media sharing
- [ ] **SHARE-02**: URL state encoding with `#gha=` hash prefix (lz-string compression)
- [ ] **SHARE-03**: 3-tier share fallback (Web Share API > Clipboard API > prompt())

### Rule Documentation

- [ ] **DOC-01**: Per-rule SEO documentation pages at `/tools/gha-validator/rules/[code]`
- [ ] **DOC-02**: Each rule page includes expert explanation, fix suggestion, before/after YAML code
- [ ] **DOC-03**: Rule pages include severity badge, category tag, and related rules links
- [ ] **DOC-04**: GA-L017/GA-L018 rule pages note browser WASM limitation with CLI recommendation

### Site Integration

- [ ] **SITE-01**: Tool page at `/tools/gha-validator/` with full editor and results
- [ ] **SITE-02**: Header navigation link for GitHub Actions Validator
- [ ] **SITE-03**: Homepage callout linking to the validator
- [ ] **SITE-04**: Tools page card entry
- [ ] **SITE-05**: JSON-LD structured data (SoftwareApplication schema) on tool page
- [ ] **SITE-06**: Build-time OG image via Satori + Sharp
- [ ] **SITE-07**: Breadcrumb navigation on tool page and rule documentation pages
- [ ] **SITE-08**: All tool and rule pages in sitemap
- [ ] **SITE-09**: SEO-optimized meta descriptions for tool page and all rule pages
- [ ] **SITE-10**: LLMs.txt updated with GitHub Actions Validator entry

### Blog Post

- [ ] **BLOG-01**: Companion blog post covering GitHub Actions best practices and tool architecture
- [ ] **BLOG-02**: Cross-links between blog post and tool page (bidirectional)
- [ ] **BLOG-03**: Blog post links to individual rule documentation pages

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Features

- **ENH-01**: Reusable workflow resolution (multi-file upload for `uses: ./.github/workflows/*.yml`)
- **ENH-02**: Custom rule configuration UI (enable/disable rules, adjust severities)
- **ENH-03**: Matrix expansion preview (show all combinations a matrix strategy generates)
- **ENH-04**: Action version update suggestions (requires GitHub API)
- **ENH-05**: Export validation report as JSON/Markdown

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live GitHub API validation | Requires auth token, breaks offline use, CORS issues |
| Auto-fix / rewrite workflow | Context-dependent fixes need API access (SHA pinning) |
| Real-time as-you-type linting | WASM takes 50-200ms per run; debounced on-demand is better UX |
| shellcheck/pyflakes integration | Native binaries, not available as WASM — documented limitation |
| Custom rule configuration | Power-user feature, breaks "paste and validate" simplicity |
| Multi-file workflow analysis | Complex UX, cross-file resolution scope explosion |
| GitHub Marketplace integration | Requires API, network dependency, scope creep |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WASM-01 | Phase 75 | Complete |
| WASM-02 | Phase 75 | Complete |
| WASM-03 | Phase 75 | Complete |
| WASM-04 | Phase 75 | Complete |
| WASM-05 | Phase 75 | Complete |
| SCHEMA-01 | Phase 75 | Complete |
| SCHEMA-02 | Phase 75 | Complete |
| SCHEMA-03 | Phase 75 | Complete |
| SCHEMA-04 | Phase 75 | Complete |
| ENGINE-01 | Phase 76 | Complete |
| ENGINE-02 | Phase 76 | Complete |
| ENGINE-03 | Phase 76 | Complete |
| ENGINE-04 | Phase 76 | Complete |
| SEC-01 | Phase 76 | Complete |
| SEC-02 | Phase 76 | Complete |
| SEC-03 | Phase 76 | Complete |
| SEC-04 | Phase 76 | Complete |
| SEC-05 | Phase 76 | Complete |
| SEC-06 | Phase 76 | Complete |
| SEC-07 | Phase 76 | Complete |
| SEC-08 | Phase 76 | Complete |
| SEC-09 | Phase 76 | Complete |
| SEC-10 | Phase 76 | Complete |
| SEM-01 | Phase 77 | Complete |
| SEM-02 | Phase 77 | Complete |
| SEM-03 | Phase 77 | Complete |
| SEM-04 | Phase 77 | Complete |
| BP-01 | Phase 77 | Complete |
| BP-02 | Phase 77 | Complete |
| BP-03 | Phase 77 | Complete |
| BP-04 | Phase 77 | Complete |
| BP-05 | Phase 77 | Complete |
| BP-06 | Phase 77 | Complete |
| BP-07 | Phase 77 | Complete |
| BP-08 | Phase 77 | Complete |
| STYLE-01 | Phase 77 | Complete |
| STYLE-02 | Phase 77 | Complete |
| STYLE-03 | Phase 77 | Complete |
| STYLE-04 | Phase 77 | Complete |
| SCORE-01 | Phase 78 | Complete |
| SCORE-02 | Phase 78 | Complete |
| SCORE-03 | Phase 78 | Complete |
| SCORE-04 | Phase 78 | Complete |
| UI-01 | Phase 78 | Complete |
| UI-02 | Phase 78 | Complete |
| UI-03 | Phase 78 | Complete |
| UI-04 | Phase 78 | Complete |
| UI-05 | Phase 78 | Complete |
| UI-06 | Phase 78 | Complete |
| UI-07 | Phase 78 | Complete |
| UI-08 | Phase 78 | Complete |
| UI-09 | Phase 78 | Complete |
| UI-10 | Phase 78 | Complete |
| GRAPH-01 | Phase 79 | Pending |
| GRAPH-02 | Phase 79 | Pending |
| GRAPH-03 | Phase 79 | Pending |
| GRAPH-04 | Phase 79 | Pending |
| GRAPH-05 | Phase 79 | Pending |
| GRAPH-06 | Phase 79 | Pending |
| GRAPH-07 | Phase 79 | Pending |
| SHARE-01 | Phase 80 | Pending |
| SHARE-02 | Phase 80 | Pending |
| SHARE-03 | Phase 80 | Pending |
| DOC-01 | Phase 80 | Pending |
| DOC-02 | Phase 80 | Pending |
| DOC-03 | Phase 80 | Pending |
| DOC-04 | Phase 80 | Pending |
| SITE-01 | Phase 81 | Pending |
| SITE-02 | Phase 81 | Pending |
| SITE-03 | Phase 81 | Pending |
| SITE-04 | Phase 81 | Pending |
| SITE-05 | Phase 81 | Pending |
| SITE-06 | Phase 81 | Pending |
| SITE-07 | Phase 81 | Pending |
| SITE-08 | Phase 81 | Pending |
| SITE-09 | Phase 81 | Pending |
| SITE-10 | Phase 81 | Pending |
| BLOG-01 | Phase 81 | Pending |
| BLOG-02 | Phase 81 | Pending |
| BLOG-03 | Phase 81 | Pending |

**Coverage:**
- v1.13 requirements: 80 total
- Mapped to phases: 80
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after roadmap creation*
