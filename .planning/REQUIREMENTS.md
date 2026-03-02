# Requirements: patrykgolabek.dev

**Defined:** 2026-03-01
**Core Value:** The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well in search engines and makes a memorable impression.

## v1.11 Requirements

Requirements for Beauty Index: Lisp milestone. Each maps to roadmap phases.

### Data Entry

- [x] **DATA-01**: Lisp entry added to languages.json with scores across all 6 dimensions (phi, omega, lambda, psi, gamma, sigma), tier, character sketch, year, and paradigm
- [x] **DATA-02**: Lisp signature code snippet added to snippets.ts showcasing a distinctive Lisp idiom
- [x] **DATA-03**: Per-dimension justifications added to justifications.ts for all 6 dimensions with Lisp-specific reasoning
- [x] **DATA-04**: `'lisp'` added to ALL_LANGS array in code-features.ts

### Code Content

- [x] **CODE-01**: Variable Declaration snippet for Lisp added to code-features.ts
- [x] **CODE-02**: If/Else snippet for Lisp added to code-features.ts
- [x] **CODE-03**: Loops snippet for Lisp added to code-features.ts
- [x] **CODE-04**: Functions snippet for Lisp added to code-features.ts
- [x] **CODE-05**: Structs snippet for Lisp added to code-features.ts (CLOS classes)
- [x] **CODE-06**: Pattern Matching snippet for Lisp added to code-features.ts (cond/typecase)
- [x] **CODE-07**: Error Handling snippet for Lisp added to code-features.ts (condition system)
- [x] **CODE-08**: String Interpolation snippet for Lisp added to code-features.ts (format)
- [x] **CODE-09**: List Operations snippet for Lisp added to code-features.ts
- [x] **CODE-10**: Signature Idiom snippet for Lisp added to code-features.ts

### Site Integration

- [ ] **SITE-01**: All hardcoded "25 languages" references updated to "26 languages" across pages, components, and meta descriptions
- [ ] **SITE-02**: Blog post referencing "25 languages" updated to "26 languages"
- [ ] **SITE-03**: OG image text references updated from 25 to 26
- [ ] **SITE-04**: JSON-LD structured data updated with correct language count
- [ ] **SITE-05**: LLMs.txt updated with correct language count
- [ ] **SITE-06**: PROJECT.md updated with Lisp-related validated requirements
- [ ] **SITE-07**: Full `astro build` passes with Lisp detail page, OG image, and all VS comparison pages generated

## Future Requirements

None — this is a focused single-language addition.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Adding multiple languages at once | Milestone scoped to Lisp only |
| Redesigning Beauty Index infrastructure | Existing architecture handles 26 languages without changes |
| New code comparison features (11th tab) | Existing 10 tabs are sufficient |
| Scheme as a separate entry | Lisp entry represents the family; Clojure already covers modern Lisp |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 69 | Complete |
| DATA-02 | Phase 69 | Complete |
| DATA-03 | Phase 69 | Complete |
| DATA-04 | Phase 69 | Complete |
| CODE-01 | Phase 70 | Complete |
| CODE-02 | Phase 70 | Complete |
| CODE-03 | Phase 70 | Complete |
| CODE-04 | Phase 70 | Complete |
| CODE-05 | Phase 70 | Complete |
| CODE-06 | Phase 70 | Complete |
| CODE-07 | Phase 70 | Complete |
| CODE-08 | Phase 70 | Complete |
| CODE-09 | Phase 70 | Complete |
| CODE-10 | Phase 70 | Complete |
| SITE-01 | Phase 71 | Pending |
| SITE-02 | Phase 71 | Pending |
| SITE-03 | Phase 71 | Pending |
| SITE-04 | Phase 71 | Pending |
| SITE-05 | Phase 71 | Pending |
| SITE-06 | Phase 71 | Pending |
| SITE-07 | Phase 71 | Pending |

**Coverage:**
- v1.11 requirements: 21 total
- Mapped to phases: 21/21
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
