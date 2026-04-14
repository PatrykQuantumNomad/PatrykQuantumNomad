# Roadmap: patrykgolabek.dev

## Milestones

- v1.0 through v1.17 (shipped) - Phases 1-101
- v1.18 AI Landscape Explorer (shipped 2026-03-27) - Phases 102-110
- v1.19 Claude Code Guide Refresh (shipped 2026-04-12) - Phases 111-116
- v1.20 Dark Code Blog Post (in progress) - Phases 117-121

## Phases

**Phase Numbering:**
- Integer phases (117, 118, ...): Planned milestone work
- Decimal phases (117.1, 117.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 117: Source Verification and Outline** - Verify all 48 research sources and create structured outline with word budgets (completed 2026-04-14)
- [x] **Phase 118: Component Development and Cover Image** - Build StatHighlight and TermDefinition components plus dark-on-dark cover SVG (completed 2026-04-14)
- [x] **Phase 119: Content Authoring** - Write the complete 3000-5000 word Dark Code essay in MDX (completed 2026-04-14)
- [ ] **Phase 120: Site Integration and SEO Enrichment** - Wire up JSON-LD, OG image, LLMs.txt, and auto-discovery pipelines
- [ ] **Phase 121: Build Verification and Publish** - Validate all 14 integration points and publish

## Phase Details

### Phase 117: Source Verification and Outline
**Goal**: Every citation URL is verified and a word-budgeted outline exists before any prose is written
**Depends on**: Nothing (first phase of v1.20)
**Requirements**: CONT-03, CONT-10
**Success Criteria** (what must be TRUE):
  1. A sources reference file exists with all 48 research URLs verified as reachable, each annotated with the claim it supports and date accessed
  2. 15-20 sources are pre-selected for inline citation, with the remaining sources tagged as background or further-reading
  3. A structured outline exists with argument-as-heading section titles and per-section word budgets (Act 1 ~1500w, Act 2 ~1200w, Act 3 ~1000w, Act 4 ~800w = ~4500w total)
**Plans**: 1 plan

Plans:
- [x] 117-01-PLAN.md — Verify all source URLs, build sources reference file, and create structured outline with word budgets

### Phase 118: Component Development and Cover Image
**Goal**: Reusable blog components and cover image are ready for the author to use during drafting
**Depends on**: Phase 117
**Requirements**: COMP-01, COMP-02, INTG-04
**Success Criteria** (what must be TRUE):
  1. StatHighlight component renders a large number, label, and source citation as a visually distinct callout block
  2. TermDefinition component renders a dictionary-entry styled definition block with term, pronunciation guide, and definition text
  3. Both components use zero dependencies, Tailwind styling, CSS custom properties for theme compatibility, and the not-prose escape pattern
  4. A custom cover SVG exists at public/images/dark-code-cover.svg with a dark-on-dark motif that matches the site's visual language
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 118-01-PLAN.md — StatHighlight and TermDefinition Astro components
- [x] 118-02-PLAN.md — Dark Code cover image SVG

### Phase 119: Content Authoring
**Goal**: The complete Dark Code essay exists as a draft MDX file with all components used, all citations inline, and all structural requirements met
**Depends on**: Phase 118
**Requirements**: CONT-01, CONT-02, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, CONT-09, INTG-05, INTG-07
**Success Criteria** (what must be TRUE):
  1. dark-code.mdx exists at src/data/blog/ with complete frontmatter (title, description as thesis statement, pubDate, tags from existing taxonomy plus at most one new tag, heroImage, draft: true)
  2. The essay is 3000-5000 words following the wake-up call -> framework -> defense narrative arc with section word budgets enforced
  3. All required components are used in the post: OpeningStatement for bold opening, TldrSummary for summary, StatHighlight for key statistics (4x code clones, 17% mastery drop, refactoring collapse), TermDefinition for the formal Dark Code definition
  4. The post contains a named framework with a memorable 3-5 dimension structure and 20-30 inline citations using GFM footnote syntax with verified URLs from the sources reference file
  5. Internal cross-links to 3-5 existing blog posts and tools are present where relevant
**Plans**: 3 plans

Plans:
- [x] 119-01-PLAN.md — MDX frontmatter, opening, TL;DR, and Act 1 (wake-up call) with GFM footnote validation
- [x] 119-02-PLAN.md — Act 2 (Dark Code Spectrum framework) and Act 3 (defense strategies) with cross-links
- [x] 119-03-PLAN.md — Act 4 (closing), remaining cross-links, and draft quality pass

### Phase 120: Site Integration and SEO Enrichment
**Goal**: The post is fully wired into all site pipelines with enriched structured data and AI discoverability
**Depends on**: Phase 119
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-06, INTG-08
**Success Criteria** (what must be TRUE):
  1. [slug].astro contains an isDarkCodePost boolean that adds articleSection and about fields to the BlogPosting JSON-LD
  2. FAQ JSON-LD schema is injected for framework question-answer pairs on the Dark Code post page
  3. OG image auto-generates correctly from frontmatter (verifiable at /open-graph/blog/dark-code.png)
  4. LLMs.txt entry includes a quality thesis-statement description for AI discoverability
  5. Draft flag is set to false and the post appears in sitemap, RSS feed, and blog listing page
**Plans**: TBD

Plans:
- [ ] 120-01: JSON-LD enrichment, LLMs.txt, and publish activation

### Phase 121: Build Verification and Publish
**Goal**: Every integration point is verified, all links resolve, and the post is production-ready
**Depends on**: Phase 120
**Requirements**: VERF-01, VERF-02, VERF-03, VERF-04, VERF-05
**Success Criteria** (what must be TRUE):
  1. All footnote citation URLs resolve with no dead links or hallucinated references
  2. Production build completes cleanly with zero errors
  3. OG image and social card render correctly in preview tools (Twitter Card Validator, LinkedIn Post Inspector patterns)
  4. Related posts sidebar shows relevant articles via tag overlap (3+ related posts visible)
  5. Lighthouse scores 90+ on the published blog post page
**Plans**: TBD

Plans:
- [ ] 121-01: Link validation, build verification, and Lighthouse audit

## Progress

**Execution Order:**
Phases execute in numeric order: 117 -> 117.1 -> 118 -> 119 -> 120 -> 121

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 117. Source Verification and Outline | 1/1 | Complete   | 2026-04-14 |
| 118. Component Development and Cover Image | 2/2 | Complete | 2026-04-14 |
| 119. Content Authoring | 3/3 | Complete   | 2026-04-14 |
| 120. Site Integration and SEO Enrichment | 0/1 | Not started | - |
| 121. Build Verification and Publish | 0/1 | Not started | - |
