# Phase 16: Data Foundation & Chart Components - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the language data schema (25 languages, 6 aesthetic dimensions, tier assignments, character sketches) and all build-time SVG chart components (radar charts, ranking bar charts) that every downstream Beauty Index page depends on. No user-facing pages in this phase — only data and reusable visual components.

</domain>

<decisions>
## Implementation Decisions

### The 6 Aesthetic Dimensions
- **B = Φ + Ω + Λ + Ψ + Γ + Σ** (total Beauty score)
- **Φ (Phi) — Aesthetic Geometry**: Visual cleanliness, grid-based order, proportional structure. How code *looks* on a screen. Grounded in Bauhaus design.
- **Ω (Omega) — Mathematical Elegance**: Inevitability, unexpectedness, economy. Algorithms that feel "straight from The Book." Grounded in Hardy's *A Mathematician's Apology*.
- **Λ (Lambda) — Linguistic Clarity**: Code that reads like well-written prose. Signal-to-noise ratio at the level of meaning. Grounded in Knuth's Literate Programming.
- **Ψ (Psi) — Practitioner Happiness**: The felt experience of writing and reading code. Flow states, community love, tooling pleasure. Grounded in developer experience research.
- **Γ (Gamma) — Organic Habitability**: Code as a place where programmers can live. Growth points, graceful aging, extensibility. Grounded in Richard Gabriel's "Habitability" and Wabi-Sabi philosophy.
- **Σ (Sigma) — Conceptual Integrity**: Does the language have a soul? Coherent design philosophy where features feel like natural consequences of a single idea. Grounded in Aristotelian consistency.

### Scoring System
- Each dimension scored 1-10, **integers only**
- All dimensions **equally weighted** — total = simple sum, max 60
- No weighting multipliers

### Tier System
- 4 tiers: **Beautiful**, **Handsome**, **Practical**, **Workhorses**
- Tier boundaries: **evenly distributed** across the 6-60 score range
- Each tier gets a **distinct color** used consistently across the site (bar charts, badges, language cards, radar fills)
- **Tier colors only** — no per-language brand colors. Languages inherit their tier's color.

### Character Sketches
- **Personality/editorial style** — opinionated, witty character descriptions for each language
- Not factual summaries; these should give each language a voice and make content shareable

### Dimension Display
- **Short versions on-site**: Each dimension gets a 1-2 sentence summary for the overview page or tooltips
- Full intellectual grounding (Bauhaus, Hardy, Knuth references) lives in the methodology **blog post only**
- Data model stores: name, Greek symbol, short description — NOT the philosophical grounding

### Radar Chart Style
- **Filled polygon** — solid/semi-transparent fill, no outline-only
- Polygon color = **tier color** of the language
- Axis labels: **Symbols + short names** (e.g., "Φ Geometry", "Ω Elegance", "Λ Clarity", "Ψ Happiness", "Γ Habitability", "Σ Integrity")
- **Grid rings visible** — concentric hexagons at score intervals for reading exact values

### Bar Chart Style
- **Horizontal orientation** — language names left-aligned, bars extend right
- **Stacked segments** — each bar divided into 6 colored segments for the 6 dimensions
- Dimension segments use **distinct dimension colors** (unique color per dimension, consistent across all bars, with legend)
- **Visual tier dividers** — horizontal lines or background bands separating the 4 tier groups

### Claude's Discretion
- Exact tier color palette selection (must be distinct, work with the site's existing design)
- Exact dimension segment color palette for stacked bars
- Grid ring intervals on radar charts (e.g., every 2 points vs every 2.5)
- Radar chart sizing at different contexts (thumbnail vs full-size vs OG image)
- Polygon opacity level
- Font choices for chart labels
- Exact tier boundary numbers (evenly distributed across 6-60 range)

</decisions>

<specifics>
## Specific Ideas

- The scoring formula is **B = Φ + Ω + Λ + Ψ + Γ + Σ** — this exact notation should be used on-site
- Each dimension has deep intellectual grounding (Bauhaus, Hardy, Knuth, Stack Overflow surveys, Wabi-Sabi, Kolmogorov complexity) — this content is authored and ready for the blog post in Phase 20
- Character sketches should be personality-driven ("Rust is the overprotective friend who's always right" style) — not Wikipedia summaries
- The Greek symbols (Φ, Ω, Λ, Ψ, Γ, Σ) are integral to the brand identity of the Beauty Index

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-data-foundation-chart-components*
*Context gathered: 2026-02-17*
