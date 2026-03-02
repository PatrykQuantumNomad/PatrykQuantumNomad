# Phase 69: Lisp Data Foundation - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Lisp (Common Lisp) as the 26th language in the Beauty Index with complete scoring, character sketch, signature snippet, dimension justifications, and ALL_LANGS registration. The detail page at /beauty-index/lisp/ must render with full content. Code comparison snippets (Phase 70) and site-wide count updates (Phase 71) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Character & Identity
- Archetype: Claude's discretion — pick whichever personality archetype best fits the existing index tone and differentiates from Clojure's "Zen master"
- Clojure reference in sketch: Claude's discretion — include only if it fits naturally
- Tone: Claude's discretion — match the tone to existing character sketches in the index
- Key traits: Claude's discretion — choose whichever traits best differentiate from existing entries

### Scoring Rationale
- Total score: 44 (Handsome tier), 4 points below Clojure (48)
- Highest dimensions: Claude's discretion — distribute scores to best differentiate from Clojure while hitting 44 total
- Lowest dimensions: Claude's discretion — place low scores where most defensible
- Gap framing vs Clojure: Claude's discretion — frame the 44-vs-48 gap in whatever way is most defensible and interesting
- Justification Clojure references: Claude's discretion — determine the right level of comparison per dimension

### Signature Snippet
- Concept: Claude's discretion — pick the snippet that best represents Lisp's essence and differentiates from Clojure's snippet
- Label style: Claude's discretion — write the label to match existing snippet labels' tone
- Code style: Claude's discretion — balance practical and conceptual to match existing snippets
- Constructs: No specific requirements — open to whatever best represents Lisp

### Clojure Differentiation
- Relationship positioning: Claude's discretion — position them however creates the most interesting content
- CLOS emphasis: Claude's discretion — determine the right emphasis based on most interesting reading
- Paradigm label: Claude's discretion — pick the most accurate and differentiating paradigm label
- Year: Claude's discretion — pick whichever year is most appropriate for the context

### Claude's Discretion
All four discussion areas were delegated to Claude's discretion. Claude has full flexibility on:
- Character sketch archetype, tone, trait emphasis, and Clojure reference
- Score distribution across 6 dimensions (must total 44, must land in Handsome tier)
- Signature snippet concept, label, and code style
- Clojure differentiation strategy, paradigm label, and year selection
- Dimension justification depth and comparison references

Constraints that ARE locked:
- Total score must be 44
- Tier must be Handsome
- Shiki grammar must use `common-lisp` as lang field
- Must differentiate from Clojure via CLOS, condition system, macro emphasis (per STATE.md decisions)
- id field must be `lisp`
- name field must be `Lisp`

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User delegated all creative decisions to Claude's judgment.

Reference data from STATE.md:
- Lisp score target: 44 (Handsome tier), 4 points below Clojure (48)
- Shiki grammar: use `common-lisp` as lang field, not `lisp` alias
- Lisp must differentiate from Clojure via CLOS, condition system, macro emphasis

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 69-lisp-data-foundation*
*Context gathered: 2026-03-01*
