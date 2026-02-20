# Requirements: patrykgolabek.dev

**Defined:** 2026-02-20
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.4 Requirements

Requirements for the Dockerfile Analyzer milestone. Each maps to roadmap phases.

### Editor Foundation

- [x] **EDIT-01**: CodeMirror 6 editor with Dockerfile syntax highlighting via @codemirror/legacy-modes
- [x] **EDIT-02**: Analyze button triggers lint cycle (not real-time as-you-type)
- [x] **EDIT-03**: Pre-loaded sample Dockerfile with deliberate issues across all rule categories
- [x] **EDIT-04**: Keyboard shortcut (Cmd/Ctrl+Enter) to trigger analysis
- [x] **EDIT-05**: Dark-only editor theme (oneDark or custom dark theme matching site aesthetic)
- [x] **EDIT-06**: Responsive layout — stacked on mobile, side-by-side on desktop
- [x] **EDIT-07**: React island with `client:only="react"` directive (CodeMirror cannot be SSR'd)
- [x] **EDIT-08**: View Transitions lifecycle — destroy/recreate EditorView on navigation

### Rule Engine

- [x] **RULE-01**: 15 Tier 1 critical rules (DL3006, DL3007, DL4000, DL3020, DL3025, DL3000, DL3004, DL3002, DL3059, DL3014, DL3015, DL3008, DL4003, DL4004, DL3061)
- [x] **RULE-02**: 15 Tier 2 high-value rules (DL3003, DL3009, DL3011, DL3027, DL4006, DL3042, DL3013, DL3045, DL3019, DL3012, DL3024, plus custom: secrets in ENV/ARG, curl-pipe-shell, COPY sensitive files)
- [x] **RULE-03**: 10 Tier 3 nice-to-have rules (DL4001, DL3057, DL3001, DL3022, inconsistent casing, legacy ENV format, yum/dnf/zypper rules)
- [x] **RULE-04**: Modular rule architecture — LintRule interface, one file per rule, category subdirectories
- [x] **RULE-05**: Expert-voice explanation per rule with "why this matters in production" architect perspective
- [x] **RULE-06**: Actionable fix suggestion per rule with before/after code examples
- [x] **RULE-07**: Rule codes: DL-prefixed (Hadolint-compatible) and PG-prefixed (custom rules)

### Scoring

- [x] **SCORE-01**: Category-weighted scoring algorithm (Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10%)
- [x] **SCORE-02**: Overall 0-100 score with letter grade (A+ through F)
- [x] **SCORE-03**: Per-category sub-scores displayed alongside aggregate
- [x] **SCORE-04**: Transparent deductions visible per finding

### Results Display

- [x] **RESULT-01**: Inline CodeMirror annotations (squiggly underlines + gutter severity markers)
- [x] **RESULT-02**: Score gauge component (visual gauge with letter grade)
- [x] **RESULT-03**: Category breakdown panel with sub-scores per dimension
- [x] **RESULT-04**: Violation list grouped by severity with expandable details
- [x] **RESULT-05**: Click-to-navigate from results panel to corresponding editor line
- [x] **RESULT-06**: Clean Dockerfile empty state ("No issues found" with congratulatory message)

### Shareability

- [ ] **SHARE-01**: Score badge download as PNG image for social media sharing
- [ ] **SHARE-02**: URL state encoding — Dockerfile content in URL hash for shareable analysis links

### Content

- [ ] **BLOG-01**: Companion blog post covering Dockerfile best practices and tool architecture deep-dive
- [ ] **BLOG-02**: Cross-links between blog post and tool page (bidirectional)
- [ ] **DOCS-01**: 40 rule documentation pages at /tools/dockerfile-analyzer/rules/[code]
- [ ] **DOCS-02**: Each rule page includes: explanation, fix suggestion, before/after code, related rules

### SEO & Navigation

- [ ] **NAV-01**: Header navigation link for Dockerfile Analyzer
- [ ] **NAV-02**: Breadcrumb navigation on tool page and rule documentation pages
- [ ] **SEO-01**: JSON-LD structured data (SoftwareApplication schema) on tool page
- [ ] **SEO-02**: Homepage callout linking to the Dockerfile Analyzer
- [ ] **SEO-03**: All tool and rule pages in sitemap
- [ ] **SEO-04**: SEO-optimized meta descriptions for tool page and all 40 rule pages
- [ ] **SEO-05**: Lighthouse 90+ audit on tool page
- [ ] **SEO-06**: Accessibility audit (keyboard navigation, screen reader, WCAG 2.1 AA)

## Future Requirements

### v1.5 Enhancements

- **THEME-01**: Full dark/light mode sync for CodeMirror editor (Compartment-based theme switching)
- **SHARE-03**: Social media Open Graph image with score badge for tool page
- **RULE-08**: Additional custom rules based on user feedback
- **PERF-01**: Web Worker for lint engine if performance requires it

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI-powered analysis | Contradicts the human-expertise positioning — this is an expert architect's rules, not an LLM |
| ShellCheck integration | Requires Haskell runtime, no browser-compatible implementation exists |
| Auto-fix / auto-correct | Too many edge cases, risks generating broken Dockerfiles |
| Real-time as-you-type linting | Debounced on-analyze is better UX than constant red squigglies during editing |
| CI/CD API endpoint | Static site architecture precludes server-side processing |
| Server-side analysis | All processing must be client-side — no user data transmitted |
| Monaco Editor | 5-10 MB bundle, overkill for a single-language editor |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EDIT-01 | Phase 22 | Complete |
| EDIT-02 | Phase 22 | Complete |
| EDIT-03 | Phase 22 | Complete |
| EDIT-04 | Phase 22 | Complete |
| EDIT-05 | Phase 22 | Complete |
| EDIT-06 | Phase 22 | Complete |
| EDIT-07 | Phase 22 | Complete |
| EDIT-08 | Phase 22 | Complete |
| RULE-01 | Phase 23 | Complete |
| RULE-02 | Phase 23 | Complete |
| RULE-03 | Phase 23 | Complete |
| RULE-04 | Phase 23 | Complete |
| RULE-05 | Phase 23 | Complete |
| RULE-06 | Phase 23 | Complete |
| RULE-07 | Phase 23 | Complete |
| SCORE-01 | Phase 23 | Complete |
| SCORE-02 | Phase 23 | Complete |
| SCORE-03 | Phase 23 | Complete |
| SCORE-04 | Phase 23 | Complete |
| RESULT-01 | Phase 24 | Complete |
| RESULT-02 | Phase 24 | Complete |
| RESULT-03 | Phase 24 | Complete |
| RESULT-04 | Phase 24 | Complete |
| RESULT-05 | Phase 24 | Complete |
| RESULT-06 | Phase 24 | Complete |
| BLOG-01 | Phase 25 | Pending |
| BLOG-02 | Phase 25 | Pending |
| DOCS-01 | Phase 25 | Pending |
| DOCS-02 | Phase 25 | Pending |
| NAV-01 | Phase 26 | Pending |
| NAV-02 | Phase 26 | Pending |
| SEO-01 | Phase 26 | Pending |
| SEO-02 | Phase 26 | Pending |
| SEO-03 | Phase 26 | Pending |
| SEO-04 | Phase 26 | Pending |
| SEO-05 | Phase 26 | Pending |
| SEO-06 | Phase 26 | Pending |
| SHARE-01 | Phase 27 | Pending |
| SHARE-02 | Phase 27 | Pending |

**Coverage:**
- v1.4 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-20 after roadmap creation (traceability populated)*
