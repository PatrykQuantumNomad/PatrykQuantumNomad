# Requirements: GitHub Actions Workflow Validator

**Defined:** 2026-03-04
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression

## v1.13 Requirements

Requirements for the GitHub Actions Workflow Validator. Each maps to roadmap phases.

### WASM Infrastructure

- [ ] **WASM-01**: actionlint WASM binary served as static asset from `public/wasm/` directory
- [ ] **WASM-02**: Web Worker loads and initializes actionlint WASM with `wasm_exec.js` bridge
- [ ] **WASM-03**: Worker exposes `runActionlint(yamlSource)` returning `ActionlintError[]` with `{kind, message, line, column}`
- [ ] **WASM-04**: WASM loading shows progress indicator while binary downloads (~3MB gzipped)
- [ ] **WASM-05**: Worker message protocol handles analyze requests and returns results to main thread

### Schema Validation

- [ ] **SCHEMA-01**: SchemaStore `github-workflow.json` pre-compiled into ajv standalone validator at build time
- [ ] **SCHEMA-02**: Schema validation runs synchronously on main thread for instant structural feedback
- [ ] **SCHEMA-03**: 8 schema rules (GA-S001 through GA-S008) mapped from ajv validation errors with line numbers
- [ ] **SCHEMA-04**: Schema rules cover: YAML syntax, unknown properties, type mismatches, missing required fields, invalid enum values

### Two-Pass Engine

- [ ] **ENGINE-01**: Two-pass architecture: Pass 1 (schema + custom rules, synchronous) and Pass 2 (actionlint WASM, async via Worker)
- [ ] **ENGINE-02**: Diagnostic deduplication merges findings from both passes, suppressing duplicates on `(line, column)` pairs
- [ ] **ENGINE-03**: Results from Pass 1 displayed immediately while WASM loads and runs Pass 2
- [ ] **ENGINE-04**: All violations mapped to unified format with `{ruleId, message, line, column, severity, category}`

### Security Rules

- [ ] **SEC-01**: GA-C001 flags unpinned action versions (`actions/checkout@v4` instead of SHA)
- [ ] **SEC-02**: GA-C002 flags mutable action tags (branch refs like `@main`)
- [ ] **SEC-03**: GA-C003 flags overly permissive permissions (`permissions: write-all`)
- [ ] **SEC-04**: GA-C004 flags missing permissions block at workflow level
- [ ] **SEC-05**: GA-C005 flags script injection risk (`${{ github.event.*.title }}` in `run:` blocks)
- [ ] **SEC-06**: GA-C006 flags `pull_request_target` without path/branch restrictions
- [ ] **SEC-07**: GA-C007 flags hardcoded secrets in workflow file
- [ ] **SEC-08**: GA-C008 flags third-party actions without SHA pinning
- [ ] **SEC-09**: GA-C009 flags dangerous combined GITHUB_TOKEN permission scopes
- [ ] **SEC-10**: GA-C010 flags self-hosted runner usage (informational security reminder)

### Semantic Rules (actionlint)

- [ ] **SEM-01**: 18 actionlint rule kinds mapped to GA-L001 through GA-L018 with stable rule IDs
- [ ] **SEM-02**: Each actionlint kind assigned to appropriate scoring category (Security, Semantic, or Best Practice)
- [ ] **SEM-03**: GA-L017 (shellcheck) and GA-L018 (pyflakes) documented as unavailable in browser WASM build
- [ ] **SEM-04**: actionlint error messages enriched with rule-specific explanations and fix suggestions

### Best Practice Rules

- [ ] **BP-01**: GA-B001 flags jobs missing `timeout-minutes` (default is 6 hours)
- [ ] **BP-02**: GA-B002 flags workflows missing `concurrency:` group
- [ ] **BP-03**: GA-B003 flags steps without `name:` field
- [ ] **BP-04**: GA-B004 flags duplicate step names within same job
- [ ] **BP-05**: GA-B005 flags empty `env:` blocks
- [ ] **BP-06**: GA-B006 flags jobs without conditional on PR-only workflows
- [ ] **BP-07**: GA-B007 flags outdated major versions of well-known actions
- [ ] **BP-08**: GA-B008 flags steps fetching external data without `continue-on-error`

### Style Rules

- [ ] **STYLE-01**: GA-F001 flags jobs not alphabetically ordered
- [ ] **STYLE-02**: GA-F002 flags inconsistent `uses:` quoting
- [ ] **STYLE-03**: GA-F003 flags step names exceeding 80 characters
- [ ] **STYLE-04**: GA-F004 flags workflows missing `name:` at top level

### Scoring

- [ ] **SCORE-01**: Category-weighted scoring: Schema 15%, Security 35%, Semantic 20%, Best Practice 20%, Style 10%
- [ ] **SCORE-02**: Overall 0-100 score with letter grade (A+ through F) using diminishing-returns formula
- [ ] **SCORE-03**: Per-category sub-scores alongside aggregate score
- [ ] **SCORE-04**: Score gauge component (SVG circular gauge with letter grade)

### Editor & Results

- [ ] **UI-01**: CodeMirror 6 YAML editor with syntax highlighting and line numbers
- [ ] **UI-02**: Analyze button triggers validation cycle (Cmd/Ctrl+Enter shortcut)
- [ ] **UI-03**: Pre-loaded sample workflow with deliberate issues across all rule categories
- [ ] **UI-04**: Inline CodeMirror annotations (squiggly underlines + gutter severity markers)
- [ ] **UI-05**: Tabbed results panel with score gauge, category breakdown, and violation list
- [ ] **UI-06**: Click-to-navigate from results panel to corresponding editor line
- [ ] **UI-07**: Violation list grouped by category with expandable details and rule ID links
- [ ] **UI-08**: Clean workflow empty state ("No issues found" with congratulatory message)
- [ ] **UI-09**: Responsive layout — stacked on mobile, side-by-side on desktop
- [ ] **UI-10**: React island with `client:only="react"` directive

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
| WASM-01 | — | Pending |
| WASM-02 | — | Pending |
| WASM-03 | — | Pending |
| WASM-04 | — | Pending |
| WASM-05 | — | Pending |
| SCHEMA-01 | — | Pending |
| SCHEMA-02 | — | Pending |
| SCHEMA-03 | — | Pending |
| SCHEMA-04 | — | Pending |
| ENGINE-01 | — | Pending |
| ENGINE-02 | — | Pending |
| ENGINE-03 | — | Pending |
| ENGINE-04 | — | Pending |
| SEC-01 | — | Pending |
| SEC-02 | — | Pending |
| SEC-03 | — | Pending |
| SEC-04 | — | Pending |
| SEC-05 | — | Pending |
| SEC-06 | — | Pending |
| SEC-07 | — | Pending |
| SEC-08 | — | Pending |
| SEC-09 | — | Pending |
| SEC-10 | — | Pending |
| SEM-01 | — | Pending |
| SEM-02 | — | Pending |
| SEM-03 | — | Pending |
| SEM-04 | — | Pending |
| BP-01 | — | Pending |
| BP-02 | — | Pending |
| BP-03 | — | Pending |
| BP-04 | — | Pending |
| BP-05 | — | Pending |
| BP-06 | — | Pending |
| BP-07 | — | Pending |
| BP-08 | — | Pending |
| STYLE-01 | — | Pending |
| STYLE-02 | — | Pending |
| STYLE-03 | — | Pending |
| STYLE-04 | — | Pending |
| SCORE-01 | — | Pending |
| SCORE-02 | — | Pending |
| SCORE-03 | — | Pending |
| SCORE-04 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |
| UI-04 | — | Pending |
| UI-05 | — | Pending |
| UI-06 | — | Pending |
| UI-07 | — | Pending |
| UI-08 | — | Pending |
| UI-09 | — | Pending |
| UI-10 | — | Pending |
| GRAPH-01 | — | Pending |
| GRAPH-02 | — | Pending |
| GRAPH-03 | — | Pending |
| GRAPH-04 | — | Pending |
| GRAPH-05 | — | Pending |
| GRAPH-06 | — | Pending |
| GRAPH-07 | — | Pending |
| SHARE-01 | — | Pending |
| SHARE-02 | — | Pending |
| SHARE-03 | — | Pending |
| DOC-01 | — | Pending |
| DOC-02 | — | Pending |
| DOC-03 | — | Pending |
| DOC-04 | — | Pending |
| SITE-01 | — | Pending |
| SITE-02 | — | Pending |
| SITE-03 | — | Pending |
| SITE-04 | — | Pending |
| SITE-05 | — | Pending |
| SITE-06 | — | Pending |
| SITE-07 | — | Pending |
| SITE-08 | — | Pending |
| SITE-09 | — | Pending |
| SITE-10 | — | Pending |
| BLOG-01 | — | Pending |
| BLOG-02 | — | Pending |
| BLOG-03 | — | Pending |

**Coverage:**
- v1.13 requirements: 76 total
- Mapped to phases: 0
- Unmapped: 76

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after initial definition*
