# Roadmap: patrykgolabek.dev

## Milestones

- ~~v1.0 MVP~~ - Phases 1-7 (shipped 2026-02-11)
- ~~v1.1 Content Refresh~~ - Phases 8-12 (shipped 2026-02-12)
- ~~v1.2 Projects Page Redesign~~ - Phases 13-15 (shipped 2026-02-13)
- ~~v1.3 The Beauty Index~~ - Phases 16-21 (shipped 2026-02-17)
- ~~v1.4 Dockerfile Analyzer~~ - Phases 22-27 (shipped 2026-02-20)
- ~~v1.5 Database Compass~~ - Phases 28-32 (shipped 2026-02-22)
- ~~v1.6 Docker Compose Validator~~ - Phases 33-40 (shipped 2026-02-23)
- ~~v1.7 Kubernetes Manifest Analyzer~~ - Phases 41-47 (shipped 2026-02-23)
- ~~v1.8 EDA Visual Encyclopedia~~ - Phases 48-55 (shipped 2026-02-25)
- ~~v1.9 EDA Case Study Deep Dive~~ - Phases 56-63 (shipped 2026-02-27)
- ~~v1.10 EDA Graphical Techniques — NIST Parity & Validation~~ - Phases 64-68 (shipped 2026-02-27)
- [ ] **v1.11 Beauty Index: Lisp** - Phases 69-71 (in progress)

## Phases

<details>
<summary>v1.0 through v1.10 (Phases 1-68) - SHIPPED</summary>

Phases 1-68 delivered across milestones v1.0-v1.10. 609 requirements, 159 plans completed.
See `.planning/milestones/` for detailed archives.

</details>

### v1.11 Beauty Index: Lisp (In Progress)

**Milestone Goal:** Add Lisp (Common Lisp / Scheme family) as the 26th language to the Beauty Index, with full scoring, content, code snippets, and site integration.

- [ ] **Phase 69: Lisp Data Foundation** - Lisp entry in languages.json, signature snippet, dimension justifications, and ALL_LANGS registration
- [ ] **Phase 70: Code Comparison Snippets** - All 10 code feature snippets for Lisp with Clojure differentiation
- [ ] **Phase 71: Site-Wide Integration** - Update all hardcoded counts from 25 to 26 and verify full production build

## Phase Details

### Phase 69: Lisp Data Foundation
**Goal**: Lisp exists as a valid 26th language entry with correct scores, tier placement, character sketch, signature snippet, and dimension justifications -- the detail page at /beauty-index/lisp/ renders with complete content
**Depends on**: Nothing (first phase of v1.11)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Visiting /beauty-index/lisp/ renders a detail page with radar chart, tier badge, character sketch, and signature code snippet with syntax highlighting
  2. Lisp appears in the overview page ranking chart, scoring table, and language grid at the correct tier position (Handsome, score 44)
  3. The code comparison page at /beauty-index/code/ includes Lisp in the feature support matrix (even if individual snippets are placeholder/undefined)
  4. All 6 dimension justifications display on the Lisp detail page with Lisp-specific reasoning that differentiates from Clojure
**Plans**: TBD

Plans:
- [ ] 69-01: TBD

### Phase 70: Code Comparison Snippets
**Goal**: Lisp has complete, readable code snippets across all 10 feature tabs that showcase distinctive Lisp idioms (CLOS, condition system, macros) rather than duplicating patterns already covered by Clojure
**Depends on**: Phase 69
**Requirements**: CODE-01, CODE-02, CODE-03, CODE-04, CODE-05, CODE-06, CODE-07, CODE-08, CODE-09, CODE-10
**Success Criteria** (what must be TRUE):
  1. All 10 feature tabs on /beauty-index/code/ show a Lisp code block with correct common-lisp syntax highlighting (colored tokens, not plain text)
  2. The Structs tab shows CLOS defclass/defgeneric/defmethod (not defstruct), distinguishing Lisp from Clojure's protocol-based approach
  3. The Error Handling tab shows the condition/restart system (handler-bind, restart-case), a feature unique to Common Lisp
  4. The Signature Idiom tab shows defmacro with backquote/unquote, the quintessential Lisp capability that Clojure simplified
  5. No snippet exceeds 12 lines or requires horizontal scrolling at 576px viewport width
**Plans**: TBD

Plans:
- [ ] 70-01: TBD

### Phase 71: Site-Wide Integration
**Goal**: Every reference to the language count across the entire site reflects 26 languages, and the full production build passes with the Lisp detail page, OG image, and all VS comparison pages generated
**Depends on**: Phase 70
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07
**Success Criteria** (what must be TRUE):
  1. Running `astro build` completes without errors, generating the Lisp detail page, Lisp OG image, and all VS comparison pages including Lisp pairings
  2. Searching the built output for "25 languages" returns zero results -- all instances read "26 languages"
  3. The homepage Beauty Index callout, overview page meta description, blog post body, JSON-LD structured data, and LLMs.txt all reference 26 languages
  4. PROJECT.md contains Lisp-related validated requirements under the v1.11 section
**Plans**: TBD

Plans:
- [ ] 71-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 69 -> 70 -> 71

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-7 | v1.0 MVP | 15/15 | Complete | 2026-02-11 |
| 8-12 | v1.1 Content Refresh | 7/7 | Complete | 2026-02-12 |
| 13-15 | v1.2 Projects Page Redesign | 6/6 | Complete | 2026-02-13 |
| 16-21 | v1.3 The Beauty Index | 15/15 | Complete | 2026-02-17 |
| 22-27 | v1.4 Dockerfile Analyzer | 13/13 | Complete | 2026-02-20 |
| 28-32 | v1.5 Database Compass | 10/10 | Complete | 2026-02-22 |
| 33-40 | v1.6 Docker Compose Validator | 14/14 | Complete | 2026-02-23 |
| 41-47 | v1.7 Kubernetes Manifest Analyzer | 23/23 | Complete | 2026-02-23 |
| 48-55 | v1.8 EDA Visual Encyclopedia | 24/24 | Complete | 2026-02-25 |
| 56-63 | v1.9 EDA Case Study Deep Dive | 19/19 | Complete | 2026-02-27 |
| 64-68 | v1.10 EDA Graphical NIST Parity | 12/12 | Complete | 2026-02-27 |
| 69 | v1.11 Beauty Index: Lisp | 0/TBD | Not started | - |
| 70 | v1.11 Beauty Index: Lisp | 0/TBD | Not started | - |
| 71 | v1.11 Beauty Index: Lisp | 0/TBD | Not started | - |
