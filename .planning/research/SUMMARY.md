# Project Research Summary

**Project:** Add Lisp as the 26th language to the Beauty Index
**Domain:** Language data addition — static site content update (Astro)
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

Adding Lisp (Common Lisp / Scheme family) to the Beauty Index is a pure data-addition task with zero dependency changes. The existing Astro 5.17.1 stack already bundles Shiki 3.22.0 with the `common-lisp` grammar, validates entries via Zod, and auto-generates all detail pages, VS comparison pages, and OG images from `languages.json` through `getCollection()`. The only development work is: (1) writing the 4 data files — `languages.json`, `snippets.ts`, `justifications.ts`, `code-features.ts`; and (2) updating approximately 28 hardcoded "25 languages" count strings scattered across source files.

The proposed Beauty Index score for Lisp is **44** (Handsome tier), with a paradox profile: Omega (Mathematical Elegance) = 10 — tied only with Haskell — and Gamma (Organic Habitability) = 9, offset by Phi (Aesthetic Geometry) = 5 and Psi (Practitioner Happiness) = 5. This makes Lisp the highest Omega scorer and one of the lowest Phi/Psi scorers in the index. The score is 4 points below Clojure (48), which is justified because Rich Hickey's auteur vision and JVM ecosystem refined the raw Lisp ideas into a more polished product.

The critical risk is identity confusion between Lisp and Clojure. Because Clojure is already in the index and already described as a "functional, Lisp dialect," the new Lisp entry must establish distinct identity through its character sketch, justification texts, and code snippets. Snippets must showcase features Clojure does not have: the condition/restart system, CLOS `defgeneric`/`defmethod`, and the full macro system — not just `defun` and list operations that overlap with Clojure's `defn` and `map`. A secondary risk is the hardcoded "25" count spread across 28 locations, including OG images, JSON-LD structured data, and LLM-facing text files — a missed update creates SEO inconsistencies visible to crawlers.

## Key Findings

### Recommended Stack

No new dependencies are required. Shiki 3.22.0, installed transitively via `astro-expressive-code@0.41.6`, bundles the `common-lisp` TextMate grammar. The grammar ID `common-lisp` is canonical; `lisp` is an alias that re-exports it. Research directly verified both identifiers resolve at build time.

**Core technologies (no changes needed):**
- **Astro 5.17.1**: Static site generator — data-driven, `getCollection()` auto-generates all pages from `languages.json`
- **astro-expressive-code 0.41.6**: Syntax highlighting wrapper — resolves `common-lisp` from bundled Shiki grammars, no registration needed
- **Shiki 3.22.0**: TextMate grammar engine — `common-lisp`, `lisp` (alias), and `scheme` all bundled; use `common-lisp` as the `lang` field value
- **Zod (via Astro)**: Schema validation — generic schema in `schema.ts` requires no changes for a new language entry

**Key data-file decisions:**
- Language URL slug and data key: `lisp` (short, lowercase, matches existing convention)
- Shiki `lang` field in snippets: `common-lisp` (canonical grammar name, not the alias)
- These serve different purposes; inconsistency between them breaks keyed lookups silently

### Expected Features

The 10 code comparison features are well-defined for Lisp. All should be populated, with deliberate choices about which idioms to showcase.

**Must have (table stakes for any language entry):**
- Variable declaration — `defvar`, `defparameter`, `let` bindings
- If/else — `if`, `cond`, `when`
- Loops — `dotimes`, functional `mapcar` (avoid complex `loop` macro as primary)
- Functions — `defun`, `lambda`, `funcall`
- Structs — CLOS `defclass` with `:initarg` / `:accessor`
- Error handling — condition system: `handler-bind`, `restart-case` (uniquely Lisp)
- List operations — `mapcar`, `remove-if-not`, `reduce` (Lisp's strength)
- Signature idiom — `defmacro` with backquote/unquote (quintessential Lisp, distinguishes from Clojure)

**Should have (differentiators from Clojure):**
- CLOS `defgeneric` / `defmethod` for pattern matching (shows multiple dispatch, unlike Clojure protocols)
- `format` directives for string formatting (not interpolation — mark "String Interpolation" as `undefined` or show `format` as the idiom)

**Defer / mark as unsupported:**
- Native pattern matching — Lisp lacks it; use `cond`/`typecase` or mark `undefined`
- String interpolation — `format` is the idiom, not interpolation; mark `undefined` with a note

**Anti-features (do not highlight):**
- `LOOP` macro complexity (divisive mini-language)
- Reader macros (too obscure, alienating)
- `format` directive zoo (looks like line noise)
- Multiple inheritance CLOS (creates "complexity" impression)

### Architecture Approach

The codebase follows a strict data-first architecture: all rendering derives dynamically from `languages.json` via Astro's `getCollection()`. Adding Lisp is an entirely additive operation — no existing files are modified except for count strings. Dynamic routes (`[slug].astro`, `vs/[slug].astro`), OG image generation, JSON-LD structured data, and LLM-readable text files all auto-generate from the collection. The `code-features.ts` file maintains a separate manual `ALL_LANGS` const array that is NOT derived from the collection — this is the one place where the data-first pattern breaks.

**Major components and their change surface:**
1. `src/data/beauty-index/languages.json` — Add 1 JSON object with all required fields; defines canonical ID `lisp` and scores
2. `src/data/beauty-index/snippets.ts` — Add `lisp` key with `lang: 'common-lisp'` and signature snippet
3. `src/data/beauty-index/justifications.ts` — Add `lisp` key with all 6 dimension justification strings
4. `src/data/beauty-index/code-features.ts` — Add `'lisp'` to `ALL_LANGS` array AND add `lisp` snippets to all 10 feature objects
5. ~28 source files — Update hardcoded "25" count strings to "26" (and derived counts: 600 -> 650, 150 -> 156, 250 -> 260)

**Data flow:**
```
languages.json -> content.config.ts (Zod validation) -> getCollection('languages')
  -> [slug].astro (26 detail pages, auto)
  -> vs/[slug].astro (650 comparison pages, auto)
  -> index.astro (overview, auto)
  -> code/index.astro (reads CODE_FEATURES, NOT collection)
  -> open-graph/beauty-index/[slug].png.ts (OG images, auto)
```

### Critical Pitfalls

1. **Incomplete hardcoded "25 languages" text updates** — 28 locations across source files, including OG image render text (`og-image.ts` line 618), JSON-LD structured data (`BeautyIndexJsonLd.astro` line 23), blog post body (`the-beauty-index.mdx` multiple lines), `llms.txt`/`llms-full.txt.ts`, homepage, and page meta descriptions. Use grep to audit all occurrences before and after the update pass. Missed instances cause SEO inconsistency visible to crawlers.

2. **Lisp-vs-Clojure identity confusion** — Clojure is already in the index as a "functional, Lisp dialect." Without deliberate differentiation, readers see Lisp as a duplicate. Character sketch must position Lisp as the ancestor (pre-Clojure), not a competitor. Code snippets must showcase CLOS, condition system, and macros — features Clojure deliberately simplified or removed. Justifications must write in explicit contrast to Clojure's existing justifications.

3. **ALL_LANGS const array omission** — `code-features.ts` has a manually maintained `ALL_LANGS` const tuple that is NOT derived from `languages.json`. Missing `'lisp'` in this array causes the Code Comparison page and Feature Matrix to silently omit the new language — no build error, no warning, just a missing row. Add `'lisp'` to `ALL_LANGS` in the same commit as `languages.json`.

4. **Shiki language identifier mismatch** — Use `common-lisp` (not `lisp`, not `scheme`, not `clojure`) as the `lang` field in all snippet objects. The `lisp` alias works but is less explicit. Copying a Clojure snippet as a template and forgetting to change the `lang` field is the primary failure mode. Test syntax highlighting renders in color before writing all 10+ snippets.

5. **Score calibration contradiction with Clojure** — Common Lisp must score below Clojure's total (48) because Clojure represents a more refined editorial selection of Lisp ideas. Any dimension where Lisp scores higher than Clojure requires a specific, defensible justification. Omega=10 (vs Clojure's 9) is justified by CLOS MOP and condition system. Lambda or Psi scores above Clojure's 8 and 7 respectively would be indefensible.

## Implications for Roadmap

The research clearly defines a 3-phase structure based on data dependencies and content quality requirements.

### Phase 1: Data & Infrastructure Foundation

**Rationale:** `languages.json` is the source of truth for all downstream pages. It must exist with correct fields and a valid Shiki grammar identifier before any content work begins. The `ALL_LANGS` array update must be simultaneous to prevent a "looks done but isn't" trap. The "25 -> 26" count audit should happen in this phase, even if string updates are deferred, so the complete list is known.

**Delivers:** A valid Lisp entry that builds without errors, appears in rankings and radar charts, and has placeholder or minimal content in snippets/justifications/code-features. The site builds and the `/beauty-index/lisp/` page renders (even if incomplete).

**Addresses:** Variable declaration, if/else, loops, functions (placeholder snippets sufficient for Phase 1)

**Avoids pitfalls:**
- Pitfall 3 (Shiki lang ID) — verify `common-lisp` renders before writing all snippets
- Pitfall 4 (ALL_LANGS omission) — add to array in the same commit as `languages.json`
- Pitfall 1 (hardcoded "25") — audit all occurrences with grep in this phase

**Files changed:** `languages.json` (add entry), `snippets.ts` (add key + signature snippet), `justifications.ts` (stub or full), `code-features.ts` (add to `ALL_LANGS` + all 10 snippets or `undefined` markers)

**No research flag needed:** Patterns are fully established by existing 25 languages. The Shiki grammar ID was verified directly.

### Phase 2: Scoring & Content

**Rationale:** Scores must be calibrated against Clojure before justifications are written — the justification text references the comparative position. Content quality (differentiation from Clojure, snippet readability) determines whether the Lisp entry adds value to the index or is perceived as noise. This phase is creative work requiring editorial judgment.

**Delivers:** All 6 justification texts finalized, all 10 code feature snippets written and readable, character sketch polished, scores confirmed at 44 with correct tier "handsome".

**Addresses:** Score calibration, Lisp-Clojure differentiation, snippet readability constraints (5-12 lines, max 3 nesting levels, no horizontal scroll at 576px)

**Avoids pitfalls:**
- Pitfall 2 (Lisp-vs-Clojure identity crisis) — write with Clojure's justifications open in parallel
- Pitfall 6 (score calibration contradictions) — total score must stay below Clojure's 48
- Pitfall 7 (missing justifications) — write all 6 dimensions in one session
- Pitfall 8 (S-expression readability) — prefer `defun`/`loop`/`defgeneric` over backquote-heavy macros

**Files changed:** `justifications.ts` (all 6 texts), `code-features.ts` (all 10 snippets refined), `languages.json` (confirm scores + character sketch), `snippets.ts` (signature snippet refined)

**Research flag:** No additional research needed — all scores, justifications, and snippets are fully specified in FEATURES.md. Treat FEATURES.md as the content brief.

### Phase 3: Count Updates & Integration Verification

**Rationale:** Count string updates are mechanical but high-impact (SEO, structured data). They are best done as a single coordinated pass after content is complete, so a grep-based verification pass covers the final state. The full production build must be run to catch any build-time issues before deployment.

**Delivers:** All 28 hardcoded "25" references updated to "26", all derived counts updated (600 -> 650, 150 -> 156, 250 -> 260), full `astro build` passes, 650 VS pages and 650 VS OG images generated, blog posts updated.

**Addresses:** Homepage, meta descriptions, JSON-LD, OG image text, LLM-facing files, blog posts, code comments

**Avoids pitfalls:**
- Pitfall 1 (incomplete count updates) — systematic grep audit, not ad-hoc find-and-replace
- Pitfall 5 (VS page count explosion) — verify full build completes within acceptable time/memory

**Files changed:** ~28 files across `src/pages/`, `src/components/`, `src/data/blog/`, `src/lib/`, `src/pages/llms*.ts`

**No research flag needed:** This is mechanical string replacement with a defined checklist from ARCHITECTURE.md and PITFALLS.md.

### Phase Ordering Rationale

- Phase 1 before Phase 2: The Shiki grammar identifier must be verified working before all 10+ snippets are written. Writing snippets with a wrong `lang` field means rewriting all of them.
- Phase 1 before Phase 3: Count updates assume the entry exists. Updating "25 -> 26" before `languages.json` has the Lisp entry creates a period where counts are wrong.
- Phase 2 before Phase 3: Content must be finalized before the full build verification, so Phase 3's `astro build` test validates the complete state.
- The hardcoded count audit belongs to Phase 1 (identify all locations), while the actual string replacements belong to Phase 3 (execute all replacements together). This prevents partial updates.

### Research Flags

Phases with standard patterns (no `/gsd:research-phase` needed):
- **Phase 1:** Fully established patterns from 25 existing languages; Shiki grammar verified by direct inspection
- **Phase 2:** Content brief is complete in FEATURES.md; scores, justifications, and code snippets all specified
- **Phase 3:** Mechanical string replacement with complete location inventory in ARCHITECTURE.md and PITFALLS.md

No phases require deeper research. The project is bounded and fully documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Shiki grammar verified by direct file inspection of `node_modules`; all technologies already installed and in production use for 25 languages |
| Features | HIGH | Scores and justifications fully specified with calibration against all 25 existing languages; Lisp has decades of aesthetic discourse to draw from |
| Architecture | HIGH | Direct codebase analysis of every affected file; data flow is explicit and well-understood; hardcoded count locations fully inventoried |
| Pitfalls | HIGH | Pitfalls identified from direct codebase inspection, not inference; recovery strategies specified with concrete grep commands |

**Overall confidence:** HIGH

### Gaps to Address

- **Shiki alias behavior in Astro Expressive Code**: Research recommends `common-lisp` as canonical and notes `lisp` is an alias. Before writing all snippets, a 30-second test with `<Code lang="common-lisp">` in a dev page confirms the identifier works as expected. This is a verification step, not a research gap.

- **`when-let` vs. simpler signature idiom**: FEATURES.md recommends the `when-let` macro as the signature snippet, which uses backquote/unquote syntax. PITFALLS.md cautions against backquote in code blocks (readability). The implementation phase should resolve this by testing both options at the rendered viewport width. A simpler CLOS example may be the better signature idiom if `when-let` reads poorly in the two-column grid.

- **Blog post editorial decisions**: ARCHITECTURE.md identifies 7 blog post locations containing "25 languages." The Kubernetes observability blog post (`building-kubernetes-observability-stack.mdx`) is a cross-reference to the Beauty Index — updating it is straightforward. The main `the-beauty-index.mdx` post may benefit from a paragraph acknowledging Lisp's addition as a milestone (25th vs. 26th language). This is an editorial choice for Phase 3, not a research gap.

## Sources

### Primary (HIGH confidence)
- Direct inspection of `node_modules/@shikijs/langs/dist/common-lisp.mjs`, `scheme.mjs`, `lisp.mjs` — grammar availability verified
- Direct codebase analysis: `src/data/beauty-index/languages.json`, `code-features.ts`, `snippets.ts`, `justifications.ts`, `schema.ts`, `tiers.ts` — architecture and data model
- Direct codebase analysis: `src/pages/beauty-index/index.astro`, `[slug].astro`, `code/index.astro`, `vs/[slug].astro` — hardcoded count locations
- Direct codebase analysis: `src/lib/og-image.ts`, `BeautyIndexJsonLd.astro`, `src/pages/llms.txt.ts`, `llms-full.txt.ts` — structured data and LLM-facing files

### Secondary (MEDIUM confidence)
- [Paul Graham - What Made Lisp Different](https://paulgraham.com/diff.html) — historical and aesthetic context for scores
- [Peter Seibel - Beyond Exception Handling: Conditions and Restarts](https://gigamonkeys.com/book/beyond-exception-handling-conditions-and-restarts.html) — condition system justification
- [Richard Gabriel - Patterns of Software](https://www.dreamsongs.com/Files/PatternsOfSoftware.pdf) — Gamma/habitability score rationale
- [Clojure.org - Differences with other Lisps](https://clojure.org/reference/lisps) — Lisp-vs-Clojure differentiation
- [Shiki Languages](https://shiki.style/languages) — grammar availability
- Common Lisp community tooling survey (2025) — Psi score calibration

### Tertiary (LOW confidence)
- Stack Overflow Developer Survey 2025 — community size for Psi calibration
- Community comparisons of Clojure vs. Common Lisp — secondary calibration, not primary source

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
