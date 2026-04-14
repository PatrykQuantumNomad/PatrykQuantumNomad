# Requirements: patrykgolabek.dev

**Defined:** 2026-04-14
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.20 Requirements

Requirements for the Dark Code Blog Post milestone. Each maps to roadmap phases.

### Content Authoring

- [x] **CONT-01**: Blog post MDX file created at src/data/blog/dark-code.mdx with complete frontmatter (title, description, pubDate, tags, heroImage, draft)
- [x] **CONT-02**: Post is 3000-5000 words following wake-up call → framework → defense arc
- [x] **CONT-03**: 48 research sources verified and curated into a sources reference file before content authoring begins
- [x] **CONT-04**: 20-30 inline citations using GFM footnote syntax with verified URLs
- [x] **CONT-05**: Bold opening statement using OpeningStatement component
- [x] **CONT-06**: TL;DR summary using TldrSummary component
- [x] **CONT-07**: Named framework section with memorable 3-5 dimension structure
- [x] **CONT-08**: Key statistics rendered via StatHighlight component (4x code clones, 17% mastery drop, refactoring collapsed from 25% to <10%, etc.)
- [x] **CONT-09**: Formal "Dark Code" definition rendered via TermDefinition component
- [x] **CONT-10**: Section word budgets enforced (Act 1: ~1000w, Act 2: ~1200w, Act 3: ~1000w, Act 4: ~800w)

### Components

- [x] **COMP-01**: StatHighlight Astro component for big-number statistics callouts (zero dependencies, Tailwind-styled)
- [x] **COMP-02**: TermDefinition Astro component for dictionary-entry styled definitions (zero dependencies, Tailwind-styled)

### Site Integration

- [x] **INTG-01**: OG image auto-generated and verified for social sharing
- [x] **INTG-02**: JSON-LD BlogPosting schema with articleSection and about fields added to [slug].astro
- [x] **INTG-03**: FAQ JSON-LD schema for framework question-answer pairs
- [x] **INTG-04**: Custom cover image SVG with dark-on-dark motif matching site visual language
- [x] **INTG-05**: Tags selected from existing taxonomy with overlap for related post discovery
- [x] **INTG-06**: LLMs.txt entry with quality description for AI discoverability
- [x] **INTG-07**: Internal cross-links to existing blog posts and tools where relevant
- [x] **INTG-08**: Sitemap, RSS feed, and blog listing automatically include the new post

### Verification

- [x] **VERF-01**: All footnote URLs resolve (no dead links or hallucinated citations)
- [x] **VERF-02**: Production build passes cleanly with no errors
- [x] **VERF-03**: OG image and social card render correctly in preview
- [x] **VERF-04**: Related posts sidebar shows relevant articles via tag overlap
- [x] **VERF-05**: Lighthouse 90+ on the new blog post page

## Future Requirements

None for this milestone — standalone blog post with no deferred features.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Interactive data visualizations | Prose-first essay; stat callouts are sufficient visual breaks |
| Tweet/social media embeds | Third-party scripts hurt performance; quote text inline instead |
| Comment section | Requires moderation infrastructure; use "Reply via email" pattern |
| Multi-part series | Single essay is the right format for this topic |
| Animated scroll effects | Would distract from the argument; not the site's blog post pattern |
| Academic citation format (BibTeX/CSL) | GFM footnotes are cleaner and lighter than rehype-citation (~200KB) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 119 | Complete |
| CONT-02 | Phase 119 | Complete |
| CONT-03 | Phase 117 | Complete |
| CONT-04 | Phase 119 | Complete |
| CONT-05 | Phase 119 | Complete |
| CONT-06 | Phase 119 | Complete |
| CONT-07 | Phase 119 | Complete |
| CONT-08 | Phase 119 | Complete |
| CONT-09 | Phase 119 | Complete |
| CONT-10 | Phase 117 | Complete |
| COMP-01 | Phase 118 | Complete |
| COMP-02 | Phase 118 | Complete |
| INTG-01 | Phase 120 | Complete |
| INTG-02 | Phase 120 | Complete |
| INTG-03 | Phase 120 | Complete |
| INTG-04 | Phase 118 | Complete |
| INTG-05 | Phase 119 | Complete |
| INTG-06 | Phase 120 | Complete |
| INTG-07 | Phase 119 | Complete |
| INTG-08 | Phase 120 | Complete |
| VERF-01 | Phase 121 | Complete |
| VERF-02 | Phase 121 | Complete |
| VERF-03 | Phase 121 | Complete |
| VERF-04 | Phase 121 | Complete |
| VERF-05 | Phase 121 | Pending |

**Coverage:**
- v1.20 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after roadmap creation*
