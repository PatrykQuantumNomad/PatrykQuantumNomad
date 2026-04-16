# Phase 122: VS Page Content Enrichment - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Enrich 650 Beauty Index VS comparison pages from ~192 to 500+ unique words each, using existing codebase data (`justifications.ts`, `code-features.ts`), engineered for structural variation to avoid Google's scaled content abuse detection.

Each page delivers genuine, reader-useful analysis for comparing two programming languages — per-dimension prose, 2-3 code comparisons, FAQ schema, and cross-links.

Out of scope: generating new justification data, AI-authored prose, adding new dimensions, redesigning the single-language Beauty Index pages.

</domain>

<decisions>
## Implementation Decisions

### Analysis prose style
- **Opinionated with verdict** per dimension — each dimension ends with a clear "Python wins here because..." conclusion, not neutral both-sides framing.
- **Expanded depth**: full paragraph (4-6 sentences) per dimension plus a concrete example or edge case. Pages land in the 900-1200 word range, comfortably above the 500-word threshold.
- **Third-person analytical voice** — encyclopedia/reference tone ("Python's indentation-based syntax favors..."), not first-person or second-person.
- **Language-pair specific prose** — `Python vs Go` readability prose reads differently from `Python vs Rust` readability prose. Each pair's dimension gets comparative text written against that specific pair, not assembled from reusable per-language blurbs. This is the primary driver of the <40% overlap success criterion.

### Code snippet presentation
- **Side-by-side columns on desktop**, one language per column, rendered horizontally. Stacks to sequential blocks on mobile.
- **Short caption above each pair** — one-line label describing the feature, then the code. No intro sentence or takeaway narrative around the code.
- **Static syntax-highlighted only** — no runtime, no playground links. Consistent with existing site performance posture (Phase 124 is eliminating external font requests; do not reintroduce third-party code-runtime dependencies here).
- **Feature selection: Claude's discretion** — Claude chooses the selection strategy (differ-most / dimension-driven / canonical) based on what `code-features.ts` actually contains and what best supports the <40% overlap target.

### Page structure and flow
- **Verdict-first section order**:
  1. Hero with overall verdict
  2. Anchor-linked TOC under the hero ("Jump to: Dimensions · Code · FAQ")
  3. Per-dimension analysis
  4. Code comparisons
  5. FAQ (FAQPage JSON-LD schema)
  6. Related comparisons
- **Fixed order, varied content only** — the section sequence is identical across all 650 pages. Uniqueness comes purely from language-pair-specific prose, different code samples, different dimension orderings, and different cross-links. Do NOT rotate section order by hash or similar tricks — that risks looking gamed to Google.
- **Dimensions within the analysis section ordered by largest score gap first** — dimensions where the two languages differ most lead. Order differs per page naturally as a byproduct of the data, contributing to structural variation without being algorithmically manipulative.

### Cross-linking and discovery
- **Link target mix** — draw from all four target types:
  1. Shared-language pairs (other comparisons involving either language)
  2. Similar-scoring pairs (semantic relatedness by score profile)
  3. Paradigm-adjacent pairs (same paradigm bucket)
  4. Back-link to each single-language Beauty Index page
- **3-5 cross-links per page total** — Claude picks the mix from the four target types to land in that range. Tight, editorial, not spammy.
- **Inline contextual + footer placement** — one or two natural in-prose references ("see our Python vs Rust breakdown") where they fit editorially, plus a "Related comparisons" section in the footer.
- **Anchor text is the comparison name only** — e.g., `Python vs Rust`. Clean, scannable, predictable. No descriptive mini-sentences on anchors.

### Claude's Discretion
- Code feature selection strategy (differ-most vs dimension-driven vs canonical mix).
- FAQ question derivation from dimension data — how many questions (within reason), phrasing pattern, answer length.
- Hero verdict copy pattern (what the one-line "pick X for Y, Z for W" verdict looks like).
- Word-count variance across 650 pages — hitting 900-1200 on average is fine; a small tail above or below is acceptable as long as every page clears 500.
- Exact TOC styling and mobile collapse behavior.
- Handling dimensions where the two languages tie or are within 1 point (how to write a "verdict" when there isn't one).
- Handling pairs where `code-features.ts` has sparse data for one language (fallback: fewer than 3 code samples is acceptable if the data doesn't support it).
- Implementation-level decisions: how prose is stored/generated, build-time vs. pre-computed, template architecture.

</decisions>

<specifics>
## Specific Ideas

- The success criterion is the <40% content overlap across a random 20-page sample — every prose-style decision should be weighed against that metric.
- "Every page clears 500 words" is a hard floor; "900-1200 words" is the design target. The expanded depth decision was made to put comfortable headroom above the floor.
- The encyclopedia feel (third-person, verdict-based) is deliberate — these pages should read like a reference a reader lands on via search and trusts, not like a personal blog post.
- Static syntax-highlighted code is a performance decision that echoes the milestone's broader theme (Phase 124 self-hosting fonts to eliminate external requests). Introducing runtime playgrounds would undo that.

</specifics>

<deferred>
## Deferred Ideas

- Section-order rotation by hash / deterministic varied ordering — considered and rejected for this phase (risks looking algorithmic to Google). Could be revisited in a future experiment if overlap metrics don't hit target.
- Tabbed code switchers — rejected for SEO reasons (second language's code is not in the initial DOM). Could be an enhancement once content is proven out.
- Playground / runnable code links — out of scope; revisit if a measured engagement gap shows static code isn't enough.
- Sidebar-on-desktop persistent related grid — rejected in favor of inline+footer; could be tested later.
- Descriptive mini-sentence anchors (e.g., "See how Python compares to Rust for systems work →") — rejected in favor of plain comparison-name anchors; could be revisited if internal-link anchor-text diversity becomes an SEO priority.
- First-person / Patryk-voice prose — rejected for maintainability across 650 pages; reserved for individual blog posts and single-language writeups.
- AI-generated prose — explicitly ruled out by the v1.21 decision log (see `STATE.md` Decisions).

</deferred>

---

*Phase: 122-vs-page-content-enrichment*
*Context gathered: 2026-04-16*
