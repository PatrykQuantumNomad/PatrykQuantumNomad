# Roadmap: patrykgolabek.dev

## Milestones

- SHIPPED **v1.0 MVP** — Phases 1-7 (shipped 2026-02-11)
- SHIPPED **v1.1 Content Refresh** — Phases 8-12 (shipped 2026-02-12)
- SHIPPED **v1.2 Projects Page Redesign** — Phases 13-15 (shipped 2026-02-13)
- SHIPPED **v1.3 The Beauty Index** — Phases 16-21 (shipped 2026-02-17)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-7) — SHIPPED 2026-02-11</summary>

- [x] Phase 1: Project Scaffold & Deployment Pipeline (3/3 plans) — completed 2026-02-11
- [x] Phase 2: Layout Shell & Theme System (2/2 plans) — completed 2026-02-11
- [x] Phase 3: Blog Infrastructure (2/2 plans) — completed 2026-02-11
- [x] Phase 4: Core Static Pages (2/2 plans) — completed 2026-02-11
- [x] Phase 5: SEO Foundation (2/2 plans) — completed 2026-02-11
- [x] Phase 6: Visual Effects & Quantum Explorer (2/2 plans) — completed 2026-02-11
- [x] Phase 7: Enhanced Blog & Advanced SEO (3/3 plans) — completed 2026-02-11

See `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

<details>
<summary>v1.1 Content Refresh (Phases 8-12) — SHIPPED 2026-02-12</summary>

- [x] Phase 8: Schema & Hero Config Foundation (2/2 plans) — completed 2026-02-11
- [x] Phase 9: External Blog Integration (2/2 plans) — completed 2026-02-12
- [x] Phase 10: Social Links & Contact Update (1/1 plan) — completed 2026-02-11
- [x] Phase 11: Hero & Project Curation (1/1 plan) — completed 2026-02-12
- [x] Phase 12: Cleanup & Verification (1/1 plan) — completed 2026-02-12

See `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

<details>
<summary>v1.2 Projects Page Redesign (Phases 13-15) — SHIPPED 2026-02-13</summary>

- [x] Phase 13: Data Model & Bento Grid Layout (2/2 plans) — completed 2026-02-13
- [x] Phase 14: Visual Design & Card Components (2/2 plans) — completed 2026-02-13
- [x] Phase 15: Filtering, Animations & Polish (2/2 plans) — completed 2026-02-13

See `.planning/milestones/v1.2-ROADMAP.md` for full details.

</details>

<details>
<summary>v1.3 The Beauty Index (Phases 16-21) — SHIPPED 2026-02-17</summary>

- [x] Phase 16: Data Foundation & Chart Components (2/2 plans) — completed 2026-02-17
- [x] Phase 17: Overview & Language Detail Pages (3/3 plans) — completed 2026-02-17
- [x] Phase 18: OG Images & Shareability (2/2 plans) — completed 2026-02-17
- [x] Phase 19: Code Comparison Page (2/2 plans) — completed 2026-02-17
- [x] Phase 20: Blog Content & Cross-Linking (1/1 plan) — completed 2026-02-17
- [x] Phase 21: SEO & Launch Readiness (3/3 plans) — completed 2026-02-17

See `.planning/milestones/v1.3-ROADMAP.md` for full details.

</details>

### v1.4 Dockerfile Analyzer

**Milestone Goal:** Add an interactive browser-based Dockerfile analysis tool at /tools/dockerfile-analyzer — users paste a Dockerfile, click Analyze, and get an overall quality score plus inline annotations and a categorized findings panel. 40 lint rules based on Hadolint DL codes and professional Kubernetes/cloud-native experience. Rule documentation pages for SEO. Companion blog post covering Dockerfile best practices and tool architecture.

- [x] **Phase 22: Editor Foundation & Technology Validation** - CodeMirror 6 React island with Dockerfile syntax highlighting, dockerfile-ast bundle verification, and View Transitions lifecycle (completed 2026-02-20)
- [x] **Phase 23: Rule Engine & Scoring** - 40 lint rules across 3 tiers with modular architecture, category-weighted scoring algorithm, and expert-voice explanations (completed 2026-02-20)
- [x] **Phase 24: Results Display & Interaction** - Score gauge, category breakdown, violation list, inline annotations, click-to-navigate, and empty state (completed 2026-02-20)
- [x] **Phase 25: Content & Rule Documentation** - 39 rule documentation pages and companion blog post with bidirectional cross-links (completed 2026-02-20)
- [ ] **Phase 26: SEO, Navigation & Launch Readiness** - Header navigation, breadcrumbs, JSON-LD, sitemap, homepage callout, Lighthouse, and accessibility audits
- [ ] **Phase 27: Shareability** - Score badge PNG download and URL state encoding for shareable analysis links

## Phase Details

### Phase 22: Editor Foundation & Technology Validation
**Goal**: Users can open /tools/dockerfile-analyzer/, see a working code editor with Dockerfile syntax highlighting, type or paste Dockerfile content, and trigger an analysis action — confirming the entire technology stack works end-to-end in the browser
**Depends on**: Nothing (first phase of v1.4)
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, EDIT-08
**Success Criteria** (what must be TRUE):
  1. Visiting /tools/dockerfile-analyzer/ displays a CodeMirror 6 editor with Dockerfile syntax highlighting (FROM, RUN, COPY keywords colored) pre-loaded with a sample Dockerfile containing deliberate issues across all rule categories
  2. The `astro build` completes without errors with the dockerfile-ast import present — the Vite bundle includes the parser at an acceptable size (under 50 KB gzipped for dockerfile-ast portion) and produces no CJS-to-ESM conversion warnings
  3. Navigating away from the page and back (via View Transitions) produces a fully functional editor with no console errors, no orphaned EditorView instances, and no blank/broken editor state
  4. Clicking "Analyze" (or pressing Cmd/Ctrl+Enter) triggers a lint cycle that parses the Dockerfile via dockerfile-ast and produces output (even if no rules exist yet, the parser runs and returns an AST without errors)
  5. The editor displays correctly on mobile (stacked layout) and desktop (side-by-side layout) with a dark theme matching the site's Quantum Explorer aesthetic
**Plans:** 2/2 plans complete
Plans:
- [x] 22-01-PLAN.md — Go/no-go gate: install dependencies, verify dockerfile-ast Vite bundle, create foundation modules (types, parser, sample, store)
- [x] 22-02-PLAN.md — CodeMirror editor island: useCodeMirror hook, editor theme, React components, Astro page at /tools/dockerfile-analyzer/

### Phase 23: Rule Engine & Scoring
**Goal**: The analysis engine evaluates Dockerfiles against 40 expert rules across 5 categories and produces a meaningful, calibrated quality score with transparent deductions
**Depends on**: Phase 22
**Requirements**: RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07, SCORE-01, SCORE-02, SCORE-03, SCORE-04
**Success Criteria** (what must be TRUE):
  1. Pasting a Dockerfile with known issues and clicking Analyze produces findings from all 3 rule tiers — the sample Dockerfile triggers at least one rule from each of the 5 categories (Security, Efficiency, Maintainability, Reliability, Best Practice)
  2. Each finding includes a DL-prefixed or PG-prefixed rule code, a severity level (error/warning/hint), an expert-voice explanation describing production consequences, and a fix suggestion with before/after code
  3. The overall score (0-100 with letter grade A+ through F) reflects category weights (Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10%) — a security-only violation produces a larger score drop than a best-practice-only violation of equal count
  4. Per-category sub-scores are computed alongside the aggregate, and each deduction is traceable to a specific finding
  5. A clean Dockerfile (no violations) scores 100/A+; the pre-loaded sample Dockerfile scores in a range that demonstrates meaningful differentiation (not clustering at 85-100)
**Plans:** 2/2 plans complete
Plans:
- [x] 23-01-PLAN.md — Foundation: expanded types, rule engine, scorer, 15 Tier 1 rules, EditorPanel integration
- [x] 23-02-PLAN.md — Remaining rules: 15 Tier 2 + 9 Tier 3 rules, sample Dockerfile calibration

### Phase 24: Results Display & Interaction
**Goal**: Users see their Dockerfile analysis results through rich visual feedback — inline editor annotations, a score gauge, category breakdown, and an interactive violation list — all driven by real rule engine output
**Depends on**: Phase 23
**Requirements**: RESULT-01, RESULT-02, RESULT-03, RESULT-04, RESULT-05, RESULT-06
**Success Criteria** (what must be TRUE):
  1. After analysis, the CodeMirror editor shows inline annotations — squiggly underlines on problematic lines and severity-colored gutter markers (red for error, amber for warning, blue for hint) — visible without scrolling to the results panel
  2. A score gauge component displays the overall numeric score and letter grade with a visual indicator (circular gauge or similar) that makes the score immediately scannable
  3. A category breakdown panel shows sub-scores for each of the 5 scoring dimensions (Security, Efficiency, Maintainability, Reliability, Best Practice) as visual bars or similar indicators
  4. Clicking a violation in the results panel scrolls the editor to and highlights the corresponding line — the connection between finding and source code is one click
  5. Analyzing a clean Dockerfile (no violations) shows a congratulatory empty state message ("No issues found") instead of an empty results panel
**Plans:** 2/2 plans complete
Plans:
- [x] 24-01-PLAN.md — Editor infrastructure: severity color overrides, EditorView nanostore ref, highlight-line extension, stale results detection
- [x] 24-02-PLAN.md — Results UI components: ScoreGauge, CategoryBreakdown, ViolationList, EmptyState, ResultsPanel rewrite with click-to-navigate

### Phase 25: Content & Rule Documentation
**Goal**: Every rule has its own SEO-optimized documentation page, and a companion blog post covers Dockerfile best practices and the tool's architecture — creating 41 new indexable URLs
**Depends on**: Phase 23 (rule definitions must exist), Phase 24 (tool must work for blog screenshots/links)
**Requirements**: BLOG-01, BLOG-02, DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. Each of the 39 rules has a documentation page at /tools/dockerfile-analyzer/rules/[code] containing the rule explanation, fix suggestion with before/after code examples, severity and category metadata, and links to related rules
  2. A companion blog post appears in the blog listing at /blog/, covering Dockerfile best practices informed by the 39 rules and including a tool architecture deep-dive section explaining the browser-based analysis approach
  3. The blog post links to the analyzer tool page and at least 5 rule documentation pages; the tool page links back to the blog post; rule pages link back to both the tool and the blog post
**Plans:** 2/2 plans complete
Plans:
- [ ] 25-01-PLAN.md — Rule documentation pages: getRelatedRules utility and [code].astro dynamic route generating 39 rule pages
- [ ] 25-02-PLAN.md — Companion blog post and bidirectional cross-links between blog, tool page, and rule pages

### Phase 26: SEO, Navigation & Launch Readiness
**Goal**: The Dockerfile Analyzer is fully integrated into the site's navigation, discoverable by search engines, and meets all quality and accessibility standards
**Depends on**: Phase 24 (tool page complete), Phase 25 (content pages complete)
**Requirements**: NAV-01, NAV-02, SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06
**Success Criteria** (what must be TRUE):
  1. The site header navigation includes a link to the Dockerfile Analyzer that is visible and accessible on all pages
  2. Breadcrumb navigation appears on the tool page and all 39 rule documentation pages, with correct hierarchy (Home > Tools > Dockerfile Analyzer > Rules > [Code])
  3. The tool page includes JSON-LD structured data using SoftwareApplication schema, and all 41 new pages (tool + 39 rules + blog post) appear in the sitemap with SEO-optimized meta descriptions
  4. The homepage contains a callout section linking to the Dockerfile Analyzer, consistent with the existing Beauty Index callout pattern
  5. Lighthouse audit scores 90+ on Performance, Accessibility, Best Practices, and SEO for the tool page; keyboard navigation works through the editor (with proper Tab escape), results panel, and rule pages; screen readers can access all analysis results
**Plans:** 2/3 plans executed
Plans:
- [ ] 26-01-PLAN.md — Navigation + structured data + breadcrumbs + sitemap + meta descriptions
- [ ] 26-02-PLAN.md — Homepage Dockerfile Analyzer callout
- [ ] 26-03-PLAN.md — Lighthouse audit + accessibility fixes + user verification

### Phase 27: Shareability
**Goal**: Users can share their Dockerfile analysis results — as a visual score badge image or as a URL that recreates the exact analysis
**Depends on**: Phase 24 (score display must exist to capture)
**Requirements**: SHARE-01, SHARE-02
**Success Criteria** (what must be TRUE):
  1. After analysis, users can download a PNG score badge image showing their overall score, letter grade, and category breakdown — suitable for sharing on social media or in documentation
  2. Users can copy a shareable URL that encodes their Dockerfile content; opening that URL in a new browser loads the Dockerfile into the editor and triggers analysis, reproducing the same results
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 22 -> 23 -> 24 -> 25 -> 26 -> 27
Note: Phase 27 depends only on Phase 24 (not 25 or 26), so it could run before Phase 25/26 if needed. Phase 25 depends on both 23 and 24.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffold | v1.0 | 3/3 | Complete | 2026-02-11 |
| 2. Layout & Theme | v1.0 | 2/2 | Complete | 2026-02-11 |
| 3. Blog Infrastructure | v1.0 | 2/2 | Complete | 2026-02-11 |
| 4. Core Static Pages | v1.0 | 2/2 | Complete | 2026-02-11 |
| 5. SEO Foundation | v1.0 | 2/2 | Complete | 2026-02-11 |
| 6. Visual Effects | v1.0 | 2/2 | Complete | 2026-02-11 |
| 7. Enhanced Blog & SEO | v1.0 | 3/3 | Complete | 2026-02-11 |
| 8. Schema & Hero Config | v1.1 | 2/2 | Complete | 2026-02-11 |
| 9. External Blog | v1.1 | 2/2 | Complete | 2026-02-12 |
| 10. Social Links | v1.1 | 1/1 | Complete | 2026-02-11 |
| 11. Hero & Projects | v1.1 | 1/1 | Complete | 2026-02-12 |
| 12. Cleanup & Verify | v1.1 | 1/1 | Complete | 2026-02-12 |
| 13. Data Model & Bento Grid | v1.2 | 2/2 | Complete | 2026-02-13 |
| 14. Visual Design & Cards | v1.2 | 2/2 | Complete | 2026-02-13 |
| 15. Filtering & Animations | v1.2 | 2/2 | Complete | 2026-02-13 |
| 16. Data Foundation & Charts | v1.3 | 2/2 | Complete | 2026-02-17 |
| 17. Overview & Detail Pages | v1.3 | 3/3 | Complete | 2026-02-17 |
| 18. OG Images & Shareability | v1.3 | 2/2 | Complete | 2026-02-17 |
| 19. Code Comparison | v1.3 | 2/2 | Complete | 2026-02-17 |
| 20. Blog Content | v1.3 | 1/1 | Complete | 2026-02-17 |
| 21. SEO & Launch | v1.3 | 3/3 | Complete | 2026-02-17 |
| 22. Editor Foundation | v1.4 | 2/2 | Complete | 2026-02-20 |
| 23. Rule Engine & Scoring | v1.4 | 2/2 | Complete | 2026-02-20 |
| 24. Results Display | v1.4 | 2/2 | Complete | 2026-02-20 |
| 25. Content & Rule Docs | v1.4 | 2/2 | Complete | 2026-02-20 |
| 26. SEO & Launch | 2/3 | In Progress|  | - |
| 27. Shareability | v1.4 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-11*
*Last updated: 2026-02-20 — Phase 25 complete (2/2 plans)*
