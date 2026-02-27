# Requirements: patrykgolabek.dev

**Defined:** 2026-02-27
**Core Value:** The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well and makes a memorable impression.

## v1.10 Requirements

Requirements for EDA Graphical Techniques — NIST Parity & Validation. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: technique-content.ts is split into manageable modules (per-category or per-group) to prevent 200KB+ monolith
- [x] **INFRA-02**: TechniqueContent interface is extended with optional fields: questions, importance, definitionExpanded, formulas, pythonCode, caseStudySlugs, examples
- [ ] **INFRA-03**: Graphical [slug].astro template renders new sections (Questions Answered, Importance, expanded Definition, Examples, Case Studies) in the description slot
- [ ] **INFRA-04**: Graphical [slug].astro template activates the code slot for Python examples using astro-expressive-code Code component
- [ ] **INFRA-05**: Graphical [slug].astro template renders KaTeX formulas at build time using katex.renderToString() for techniques that have formulas
- [ ] **INFRA-06**: Case study cross-link resolution works at build time (technique slug → case study title + URL)

### SVG Validation

- [ ] **SVG-01**: All 29 graphical technique SVGs are audited against NIST original plots for visual accuracy (axes, shapes, labels, scales)
- [ ] **SVG-02**: All 29 graphical technique SVGs are audited for data pattern correctness (statistical patterns match what NIST describes)
- [ ] **SVG-03**: All identified SVG visual issues are fixed (incorrect shapes, axes, labels, scales)
- [ ] **SVG-04**: All identified SVG data pattern issues are fixed (datasets generating incorrect statistical patterns)

### Content — Questions Answered

- [ ] **QUES-01**: All 29 graphical technique pages have a "Questions This Plot Answers" section with 2-9 numbered questions sourced from NIST
- [ ] **QUES-02**: Questions are specific and actionable (e.g., "Are the data random?" not "What does this show?")

### Content — Importance

- [ ] **IMPT-01**: All 29 graphical technique pages have a "Why It Matters" section explaining statistical/engineering significance
- [ ] **IMPT-02**: Importance sections connect to practical consequences (e.g., "invalid if assumption violated")

### Content — Expanded Definitions

- [ ] **DEFN-01**: All 29 graphical technique pages have expanded definitions covering axis meanings, construction method, and mathematical formulation where applicable
- [ ] **DEFN-02**: 12 techniques with NIST formulas have KaTeX-rendered formulas (autocorrelation, spectral, probability plot, normal probability, PPCC, Box-Cox linearity, Box-Cox normality, Weibull, Q-Q, bootstrap, mean plot, std deviation plot)

### Content — Case Study Cross-Links

- [ ] **CASE-01**: All techniques with matching case studies display a "See It In Action" section with links to relevant case studies
- [ ] **CASE-02**: At least 14 of 29 techniques have at least one case study cross-link (based on research mapping)
- [ ] **CASE-03**: Case study links render as styled pill buttons matching the existing Related Techniques pattern

### Content — Examples

- [ ] **EXMP-01**: All 6 Tier B techniques have interpretive captions on their variant plots explaining what each pattern means
- [ ] **EXMP-02**: Tier A techniques with NIST examples have an Examples section describing common patterns the technique reveals

### Python Code

- [ ] **PYTH-01**: All 29 graphical technique pages have a Python code example section
- [ ] **PYTH-02**: Python examples use current matplotlib/seaborn/scipy APIs (no deprecated functions like distplot or vert=True)
- [ ] **PYTH-03**: Python examples include sample data generation so they are self-contained and runnable
- [ ] **PYTH-04**: Python examples render with syntax highlighting via astro-expressive-code

### Verification

- [ ] **VRFY-01**: Build completes cleanly with zero errors after all changes
- [ ] **VRFY-02**: Lighthouse performance score remains 90+ on graphical technique pages
- [ ] **VRFY-03**: All case study cross-links resolve to valid pages (no broken links)
- [ ] **VRFY-04**: All KaTeX formulas render correctly (no raw LaTeX visible on page)
- [ ] **VRFY-05**: Python code examples use no deprecated API calls (verified via grep)

## Future Requirements

### Extended EDA Features

- **FUTURE-01**: Interactive "Try It" Python snippets with editable code blocks
- **FUTURE-02**: Technique decision tree ("When to use X instead of Y" guidance)
- **FUTURE-03**: Formula-to-code visual pairing showing formula alongside implementing function
- **FUTURE-04**: Variant deep-linking via URL fragments for PlotVariantSwap tabs
- **FUTURE-05**: Python code validation CI step (run examples in CI to verify correctness)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Client-side interactive D3/Plotly plots on technique pages | Massive JS bundle; site is static-first with build-time SVG |
| Full NIST "Software" section (Dataplot/R references) | Dataplot is obsolete; Python examples serve this role |
| Exhaustive formula derivations | Turns pages into textbook chapters; link to NIST for full derivations |
| NIST .DAT file downloads | Copyright/licensing ambiguity; Python examples generate synthetic data |
| Video tutorials per technique | Production cost of 29 videos; text + SVG + Python code is more searchable |
| New case studies beyond existing 9 (e.g., Alaska Pipeline for 6-Plot) | Scope control; cross-link to existing case studies only |
| In-browser Python execution (Pyodide) | 14MB+ WASM destroys performance |
| Unified TechniqueContent/QuantitativeContent interface merge | Separate concern; refactor after this milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 64 | Complete |
| INFRA-02 | Phase 64 | Complete |
| INFRA-03 | Phase 64 | Pending |
| INFRA-04 | Phase 64 | Pending |
| INFRA-05 | Phase 64 | Pending |
| INFRA-06 | Phase 64 | Pending |
| SVG-01 | Phase 65 | Pending |
| SVG-02 | Phase 65 | Pending |
| SVG-03 | Phase 65 | Pending |
| SVG-04 | Phase 65 | Pending |
| QUES-01 | Phase 66 | Pending |
| QUES-02 | Phase 66 | Pending |
| IMPT-01 | Phase 66 | Pending |
| IMPT-02 | Phase 66 | Pending |
| DEFN-01 | Phase 66 | Pending |
| CASE-01 | Phase 66 | Pending |
| CASE-02 | Phase 66 | Pending |
| CASE-03 | Phase 66 | Pending |
| EXMP-01 | Phase 66 | Pending |
| EXMP-02 | Phase 66 | Pending |
| DEFN-02 | Phase 67 | Pending |
| PYTH-01 | Phase 67 | Pending |
| PYTH-02 | Phase 67 | Pending |
| PYTH-03 | Phase 67 | Pending |
| PYTH-04 | Phase 67 | Pending |
| VRFY-01 | Phase 68 | Pending |
| VRFY-02 | Phase 68 | Pending |
| VRFY-03 | Phase 68 | Pending |
| VRFY-04 | Phase 68 | Pending |
| VRFY-05 | Phase 68 | Pending |

**Coverage:**
- v1.10 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after roadmap creation*
