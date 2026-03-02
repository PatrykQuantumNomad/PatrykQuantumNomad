# Pitfalls Research

**Domain:** Adding Lisp (Common Lisp) as the 26th language to an existing Beauty Index
**Researched:** 2026-03-01
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Incomplete Hardcoded "25 Languages" Text Updates

**What goes wrong:**
The string "25 programming languages" appears in at least 22 locations across the codebase. Missing even one creates an inconsistency that undermines credibility -- the page says "25 languages" but the ranking chart shows 26. Worse, some of these are in structured data (JSON-LD, meta descriptions, OG image text) where search engines and social media previews will display stale counts.

**Why it happens:**
The count was baked into prose, comments, structured data, and generated images rather than computed from the data source. When adding the 26th language, a developer does a find-and-replace for "25" but misses instances in: code comments, OG image render text (`og-image.ts` line 618), JSON-LD descriptions (`BeautyIndexJsonLd.astro` line 23), the blog post body (`the-beauty-index.mdx` lines 3, 30, 36, 227, 229), meta descriptions in multiple page files, the `llms.txt` and `llms-full.txt.ts` machine-readable files, citation text in `index.astro`, and the `[slug].astro` language detail page template (line 80). The `FeatureMatrix.astro` and `code/index.astro` comments also reference "25".

**How to avoid:**
Create a comprehensive checklist of every file containing "25" before touching any code. The exact files requiring updates (confirmed by grep):

1. `src/pages/beauty-index/index.astro` -- meta description, ogImageAlt, hero text `<p>`, citation `<em>` (4 occurrences)
2. `src/pages/beauty-index/[slug].astro` -- `fullDescription` template string (line 80), page comment (line 4)
3. `src/pages/beauty-index/code/index.astro` -- meta description, ogImageAlt, hero `<p>`, file comment (4 occurrences)
4. `src/pages/beauty-index/justifications/index.astro` -- meta description, ogImageAlt, file comment (3 occurrences)
5. `src/lib/og-image.ts` -- hardcoded subtitle string (line 618)
6. `src/components/BeautyIndexJsonLd.astro` -- JSON-LD description, file comment (2 occurrences)
7. `src/components/beauty-index/RankingBarChart.astro` -- aria-label (line 84)
8. `src/data/beauty-index/code-features.ts` -- ALL_LANGS comment (line 28), file comment (line 3025)
9. `src/data/beauty-index/snippets.ts` -- file comment (line 13)
10. `src/data/blog/the-beauty-index.mdx` -- frontmatter description, body text (lines 3, 30, 36, 227, 229)
11. `src/data/blog/building-kubernetes-observability-stack.mdx` -- cross-link text (line 173)
12. `src/pages/llms.txt.ts` -- machine-readable text (lines 89, 94)
13. `src/pages/llms-full.txt.ts` -- machine-readable text (line 143)
14. `src/pages/index.astro` -- homepage description (line 181)

Additionally, computed counts that will auto-update but whose comments need updating:
- `src/pages/beauty-index/vs/[slug].astro` -- comment says "600 static pages (25 x 24)" but will actually generate 650 (26 x 25)
- `src/pages/llms-full.txt.ts` -- "600 comparison pages" text (line 184) becomes "650"

**Warning signs:**
- A build passes but the OG image still says "25 languages" when shared on social media
- Google caches meta descriptions showing "25" while the page content shows "26"
- The blog post description in search results contradicts the actual index
- LLM-facing pages (`llms.txt`) give incorrect counts to AI crawlers

**Phase to address:**
Phase 1 (Data & Infrastructure). Create the checklist before any data changes. Update all hardcoded references as the final step of the phase, with a grep-based verification pass.

---

### Pitfall 2: Lisp-vs-Clojure Identity Crisis -- Failing to Differentiate

**What goes wrong:**
Clojure is already in the index and is explicitly described as a "functional, Lisp dialect" in its paradigm field. Its justifications reference "Lisp-family syntax" and "nested Lisp." If the new "Lisp" entry uses similar language, scores similarly on the same dimensions, and showcases similar S-expression code snippets, readers will see it as a duplicate rather than a distinct entry. The character sketch, justifications, and code snippets must clearly establish *why both deserve separate entries*.

**Why it happens:**
Common Lisp and Clojure share surface-level similarities (S-expression syntax, parentheses-heavy code, Lisp heritage) that make lazy differentiation easy. A developer who knows one Lisp dialect may unconsciously write justifications that apply to both. The existing Clojure justifications already claim broad Lisp-family credit (e.g., "Homoiconicity (code is data)" in omega, "threading macros transform nested Lisp" in lambda).

**How to avoid:**
Define the differentiation framework upfront before writing any content:

| Dimension | Common Lisp Emphasis | Clojure Emphasis (existing) |
|-----------|---------------------|-----------------------------|
| Phi | Dense, traditional S-expression walls; `defun`/`defmacro` ceremony | "Regular and tree-like" with modern data literals (`[]`, `{}`) |
| Omega | CLOS (Common Lisp Object System), `loop` macro, condition system, decades of metaprogramming wisdom | Persistent data structures, transducers, Hickey's simplicity |
| Lambda | Macro-based DSLs, `format` directives, `defmethod` dispatch | Threading macros (`->`, `->>`) as readable pipelines |
| Psi | Small community, Emacs-centric workflow, "archaeological" ecosystem feel | REPL-driven workflow, modern tooling (Leiningen, deps.edn) |
| Gamma | CLOS extensibility, `defmethod`/`defgeneric` open dispatch, decades-old codebases still running | Immutability-first, "simple made easy" philosophy |
| Sigma | ANSI standard (1994), multi-paradigm grand unification, "programmable programming language" | Rich Hickey's axioms, "code is data, data is code" |

The character sketch must position Common Lisp as the *ancestor*, not a competitor. Suggested angle: "The ancient civilization whose ruins modern languages are still excavating." vs Clojure's "The Zen master who sees through your abstractions."

Code snippets must showcase *different* features: Common Lisp's `defmacro`, CLOS `defgeneric`/`defmethod`, the condition system (`handler-bind`/`restart-case`), `loop` macro. Avoid duplicating the threading/pipeline patterns already shown for Clojure.

**Warning signs:**
- The character sketch could describe either language interchangeably
- Code snippets use only `defun` and basic list operations (overlaps with Clojure's `defn`)
- Justifications say "homoiconicity" without specifying *which language's* version
- Score deltas between Lisp and Clojure are less than 2 points on most dimensions (suggests insufficient differentiation of the *reasoning*, even if the scores happen to be similar)

**Phase to address:**
Phase 2 (Scoring & Content). Write the differentiation framework first, then scores and justifications. Have the Clojure justifications open in a side-by-side view while writing.

---

### Pitfall 3: Syntax Highlighting Failure or Misidentification

**What goes wrong:**
Shiki (via Astro Expressive Code) is used for all syntax highlighting. The Shiki grammar for Common Lisp uses the language ID `common-lisp` with alias `lisp` (sourced from `qingpeng9802/vscode-common-lisp`). If the `lang` field in code snippets uses an incorrect identifier (e.g., `"lisp"` when Astro Expressive Code expects `"common-lisp"`, or vice versa), code blocks will render without syntax highlighting or throw build errors. Worse, if the developer uses `"clojure"` grammar for Common Lisp code (since they look superficially similar), the highlighting will be subtly wrong -- Clojure-specific forms like `defn` and `#()` would highlight but Common Lisp-specific forms like `defun`, `defmacro`, `handler-bind` would not.

**Why it happens:**
The existing codebase uses `lang: 'clojure'` for all Clojure snippets. A developer adding Common Lisp might copy-paste a Clojure snippet as a template and forget to change the `lang` field. Or they might use `"lisp"` as the lang identifier without verifying it works with Astro Expressive Code (which wraps Shiki). The alias `lisp` maps to `common-lisp` in Shiki's grammar, but this mapping may or may not work depending on how Astro Expressive Code resolves aliases.

**How to avoid:**
1. Before writing any snippets, test the exact lang identifier with a minimal Astro page:
   ```astro
   <Code code="(defun hello () (format t \"Hello\"))" lang="common-lisp" />
   ```
   Test both `"common-lisp"` and `"lisp"` to determine which works.
2. In `code-features.ts`, use the verified identifier consistently for all 10+ snippet entries.
3. In `snippets.ts`, use the same verified identifier for the signature snippet.
4. Note: Scheme is NOT available as a Shiki grammar. If the intent is to add "Scheme" rather than "Common Lisp," a custom TextMate grammar would need to be loaded. The `common-lisp` grammar is the only classic Lisp variant available (besides Clojure and Emacs Lisp).

**Warning signs:**
- Code blocks render with monochrome text (no syntax coloring)
- Build warnings about unknown language identifiers
- Parentheses and keywords highlight differently than expected (e.g., `defun` not colored as a keyword)
- The `lang` field in snippets says `"lisp"` but the `id` field in `languages.json` says `"common-lisp"` or vice versa (these serve different purposes but should be coordinated)

**Phase to address:**
Phase 1 (Data & Infrastructure). Verify the Shiki grammar before writing any content. This gates everything downstream.

---

### Pitfall 4: ALL_LANGS Const Array Omission

**What goes wrong:**
The `ALL_LANGS` array in `src/data/beauty-index/code-features.ts` (line 29-34) is a `const` tuple that lists all language IDs. It is NOT automatically derived from `languages.json`. If the new language ID is added to `languages.json` but not to `ALL_LANGS`, the new language will appear in rankings, radar charts, and scoring tables (which read from the content collection) but will be completely absent from the Code Comparison page and Feature Matrix. The site builds successfully -- there is no type error or runtime crash -- but the code comparison page silently shows 25 languages instead of 26.

**Why it happens:**
The `ALL_LANGS` array exists as a TypeScript `as const` tuple used for type narrowing and iteration within `code-features.ts`. It is manually maintained and disconnected from the content collection. The content collection (`languages.json`) is the source of truth for rankings, but code features use their own source of truth.

**How to avoid:**
1. Add the new language ID to the `ALL_LANGS` array in `code-features.ts` (line 29-34).
2. Consider refactoring `ALL_LANGS` to be derived from `languages.json` import to prevent future divergence:
   ```typescript
   import languagesData from './languages.json';
   const ALL_LANGS = languagesData.map(l => l.id) as const;
   ```
   However, this refactor changes the `as const` tuple behavior and may require downstream type adjustments. Evaluate tradeoffs.
3. After adding, verify the new language appears on `/beauty-index/code/` and in the Feature Matrix.

**Warning signs:**
- The code comparison page shows N-1 languages while the main index shows N
- The Feature Matrix table has fewer rows than expected
- No build error or warning -- this is a silent omission

**Phase to address:**
Phase 1 (Data & Infrastructure). Add to `ALL_LANGS` in the same commit as `languages.json`.

---

### Pitfall 5: VS Comparison Page Count Explosion Without Build Time Verification

**What goes wrong:**
VS comparison pages are generated as N x (N-1) ordered pairs. Going from 25 to 26 languages increases this from 600 to 650 pages -- a jump of 50 new pages. Each page also generates an OG image via `src/pages/open-graph/beauty-index/vs/[slug].png.ts`. The build time increase may be significant (OG image generation uses satori + sharp, which is CPU-intensive). On CI/CD with memory constraints, the additional 50 OG images could cause OOM failures.

**Why it happens:**
The quadratic growth of comparison pages (O(n^2)) means each additional language adds 2*(N-1) = 50 new pages plus 50 new OG images. This is invisible during development because `astro dev` only generates pages on demand. The problem surfaces only during `astro build`.

**How to avoid:**
1. Run a full `astro build` locally after adding the language to verify build completes.
2. Monitor build time and memory usage. The 50 additional OG images (each involving satori rendering) are the main concern.
3. Update the comment in `vs/[slug].astro` from "600 static pages (25 x 24)" to "650 static pages (26 x 25)".
4. Update `llms-full.txt.ts` line 184 from "600 comparison pages" to "650 comparison pages."

**Warning signs:**
- Build time increases by more than 30 seconds (suggests OG image generation is the bottleneck)
- CI/CD pipeline fails with memory errors on the build step
- The dev server works perfectly but production builds fail

**Phase to address:**
Phase 3 (Integration & Verification). Run full production build as a verification step after all content is in place.

---

### Pitfall 6: Score Calibration Relative to Clojure Creates Contradictions

**What goes wrong:**
Clojure currently scores: Phi=6, Omega=9, Lambda=8, Psi=7, Gamma=8, Sigma=10 (total: 48, "beautiful" tier at the tier boundary). If Common Lisp scores *higher* than Clojure on Sigma (Conceptual Integrity) or Omega (Mathematical Elegance), the justification text must convincingly explain how the ancestor language outperforms its modernized descendant on that dimension. Readers familiar with both languages will immediately challenge scores that defy expectations -- e.g., giving Common Lisp a higher Lambda (Linguistic Clarity) than Clojure would be indefensible given Clojure's threading macros vs Common Lisp's deeply nested `let`/`cond` blocks.

**Why it happens:**
Common Lisp has genuine strengths that can tempt score inflation: CLOS is arguably the most powerful object system ever designed (Omega), the ANSI standard is a remarkable feat of design coherence (Sigma), and the condition/restart system has no equivalent in any other language on the list (Omega/Gamma). But Common Lisp also has genuine weaknesses: verbose syntax (`defun` vs `defn`), inconsistent naming (`car`/`cdr`/`first`/`rest`), ecosystem fragmentation (SBCL vs CCL vs ECL vs ABCL), and a reputation for being "dead" that hurts practitioner happiness.

**How to avoid:**
Establish score ranges before writing justifications:

| Dimension | Likely Range | Rationale |
|-----------|-------------|-----------|
| Phi (Geometry) | 4-5 | Dense parentheses, less visual differentiation than Clojure's `[]`/`{}` literals. Lower than Clojure's 6. |
| Omega (Elegance) | 8-9 | CLOS, condition system, `loop` macro are genuinely elegant. Could tie Clojure's 9. |
| Lambda (Clarity) | 5-6 | `car`/`cdr` naming, deeply nested forms, `format` directive opacity. Below Clojure's 8. |
| Psi (Happiness) | 4-5 | Tiny community, Emacs-dependent workflow, "dead language" perception. Below Clojure's 7. |
| Gamma (Habitability) | 7-8 | CLOS extensibility is excellent; `defmethod` open dispatch. Could match Clojure's 8. |
| Sigma (Integrity) | 8-9 | ANSI standard provides coherence, but multi-paradigm sprawl (OOP + functional + imperative) dilutes the singular vision compared to Clojure's 10. |

Expected total: 36-42, placing Common Lisp in "practical" to "handsome" tier. This feels right: Common Lisp is respected but not as refined as its modern descendants.

**Warning signs:**
- Common Lisp's total score exceeds Clojure's (48) -- this would be very hard to justify
- Any dimension where Common Lisp scores higher than Clojure without a clear, specific justification
- The justification text for Common Lisp doesn't reference Clojure at all (missed opportunity for comparative analysis)

**Phase to address:**
Phase 2 (Scoring & Content). Establish the comparative calibration framework before assigning individual scores.

---

### Pitfall 7: Missing Justifications Entry

**What goes wrong:**
The `JUSTIFICATIONS` object in `src/data/beauty-index/justifications.ts` is a manually maintained `Record<string, Record<string, string>>` keyed by language ID. If the new language entry is added to `languages.json` but not to `justifications.ts`, the language detail page (`[slug].astro`) will render without a "Dimension Analysis" section. There is no build error -- the template uses a conditional check (`{justifications && ...}`) that silently omits the section. The justifications overview page (`justifications/index.astro`) will also be missing the entry.

**Why it happens:**
`justifications.ts` is completely disconnected from `languages.json`. There is no type-level or runtime check that every language ID has a justifications entry. The conditional rendering in the template was designed as a graceful fallback but masks the omission.

**How to avoid:**
1. Add all 6 dimension justifications to `justifications.ts` for the new language ID.
2. After adding, visit `/beauty-index/{id}/` and verify the "Dimension Analysis" section renders with all 6 dimensions.
3. Visit `/beauty-index/justifications/` and verify the new language appears.
4. Consider adding a build-time assertion: `Object.keys(JUSTIFICATIONS).length === languages.length`.

**Warning signs:**
- The language detail page has a radar chart and scores but no explanatory text below
- The justifications overview page shows 25 entries instead of 26
- The `llms-full.txt.ts` output shows the new language's scores but no justification text

**Phase to address:**
Phase 2 (Scoring & Content). Write justifications in the same work session as scores.

---

### Pitfall 8: S-Expression Readability in Code Blocks

**What goes wrong:**
Common Lisp code is inherently parentheses-dense. In the existing code comparison layout (2-column grid, `Code` component with Expressive Code), deeply nested S-expressions may be harder to read than the other 25 languages' code blocks. If snippets use traditional Lisp formatting with deep nesting (3-4 levels of parentheses), the code blocks will look like parentheses soup to readers unfamiliar with Lisp. This undermines the pedagogical value of the code comparison page.

**Why it happens:**
The code comparison snippets have a target of 5-12 lines per snippet (defined in the `CodeSnippet` interface). Common Lisp's verbose naming (`defun` vs `fn`, `multiple-value-bind` vs destructuring) and nested structure make it challenging to write concise, readable snippets within this line budget. The temptation is to squeeze in complex examples that showcase Common Lisp's power but sacrifice readability.

**How to avoid:**
1. Choose snippets that showcase readable Common Lisp idioms, not complex ones:
   - `defun` with clear naming (not `defmacro` with backquote/unquote)
   - `loop` macro with keyword syntax (reads like English)
   - `defgeneric`/`defmethod` for pattern matching (clean dispatch)
   - `with-open-file` for error handling (clear resource management)
2. Avoid snippets that require understanding backquote/comma notation (`,@` etc.)
3. Use consistent 2-space indentation within snippets
4. For features where Common Lisp genuinely lacks clean syntax (e.g., "Type Declarations"), mark as `undefined` in the snippets record rather than forcing a poor example
5. Test rendered output at the actual viewport widths used by the code comparison grid (each column is roughly 50% of max-w-6xl = ~576px)

**Warning signs:**
- A snippet has more than 3 levels of parenthesis nesting
- A snippet uses backquote notation (`,`, `,@`, `` ` ``)
- A snippet requires more than 12 lines to be readable
- The rendered code block has horizontal scrolling on mobile

**Phase to address:**
Phase 2 (Scoring & Content). Draft snippets with readability as the primary constraint, not feature coverage.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `"lisp"` alias instead of `"common-lisp"` as the language ID | Shorter, more familiar ID in URLs and data | Ambiguous -- "lisp" could mean any Lisp. If Scheme is ever added, creates collision. Also the `languages.json` `id` field is used in URL generation (`/beauty-index/lisp/` vs `/beauty-index/common-lisp/`) | Never for the `id` field. Use `"common-lisp"` as the canonical ID. The Shiki alias `"lisp"` is fine for the `lang` field in snippets if it works. |
| Skipping some code feature snippets (marking as `undefined`) | Less content to write and maintain | Gaps in the Feature Matrix table (dashes instead of checkmarks) | Acceptable for features Common Lisp genuinely doesn't support natively (e.g., "Async/Await" -- CL has no built-in async). Not acceptable for core features like "Variable Declaration" or "Pattern Matching" where CL has clear idioms. |
| Reusing Clojure snippet patterns | Faster development | Undermines differentiation; readers notice the similarity | Never. Each Common Lisp snippet must showcase a different idiom than its Clojure counterpart. |
| Not updating the blog post | Avoids modifying published content | The blog post's "25 languages" claims become factually wrong; SEO descriptions mismatch | Never. The blog post is the methodology reference and must reflect the current state. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `languages.json` (content collection) | Adding the entry but using a `tier` value inconsistent with the total score (e.g., total=38 but tier="handsome" when handsome requires 40+) | Calculate total score, check `tiers.ts` boundaries (workhorses: 6-31, practical: 32-39, handsome: 40-47, beautiful: 48-60), assign the correct tier string |
| `code-features.ts` (10 features) | Adding snippets for only some features, forgetting that each feature's `snippets` record must include the new language ID for it to appear in that tab | Systematically add all 10 feature snippets (or explicitly set `undefined` for unsupported features) |
| `snippets.ts` (signature snippet) | Forgetting to add the signature code snippet -- the one shown on the language detail page | Add a single representative snippet that captures Common Lisp's distinctive character (suggest: CLOS `defgeneric`/`defmethod` or the `loop` macro) |
| `justifications.ts` | Writing justifications that don't reference existing Clojure justifications, creating contradictions (e.g., both claiming to be "the most data-oriented Lisp") | Read Clojure's justifications first; write Common Lisp's in explicit contrast |
| OG images | Forgetting that OG images are generated at build time -- no manual image creation needed, but the new language must be in the content collection for the `[slug].png.ts` route to generate its image | Verify `/open-graph/beauty-index/common-lisp.png` generates correctly in the build |
| `llms.txt.ts` / `llms-full.txt.ts` | These files auto-generate language listings from the content collection, but hardcoded text ("25 languages", "600 comparison pages") needs manual updates | Update hardcoded text strings alongside the data changes |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| VS page generation quadratic growth | Build time increase of ~4-8% per additional language (50 new pages + 50 OG images) | Monitor build time; current 600 VS pages are already the largest static generation surface | Becomes noticeable at ~30 languages; at 50 languages the VS pages alone would be 2,450 |
| Code comparison page DOM size | The code comparison page renders N languages x 10 features = 260 code blocks total (up from 250). All are rendered at build time but shown/hidden via JS tabs. | The `content-visibility: auto` CSS property is already applied (line 66 of `code/index.astro`), which mitigates rendering cost. Adding one language's blocks is marginal. | Not a concern at 26 languages |
| Astro content collection rebuild | Adding an entry to `languages.json` triggers a full content collection re-parse | Expected behavior; no mitigation needed | Not a concern |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Lisp and Clojure appearing adjacent in alphabetical/score-sorted lists without clear differentiation | Users wonder "why are there two Lisps?" | Ensure the character sketch and tier badge create immediate visual differentiation. If they're in the same tier, users need the character sketch to explain the difference at a glance. |
| Common Lisp code blocks looking like "the same language" as Clojure to non-Lisp users | Users perceive the code comparison as redundant | Choose snippets that look visually distinct: CL's `defun`, `loop`, `format`, `handler-case` vs Clojure's `defn`, `->>`/`->>`, persistent data structure literals |
| URL slug confusion: `/beauty-index/common-lisp/` vs `/beauty-index/clojure/` | Users might expect `/beauty-index/lisp/` | Use `common-lisp` as the ID for precision. Consider adding "Common Lisp" (not just "Lisp") as the display name to avoid ambiguity with the Lisp family |
| The language filter on the code comparison page showing two similar entries | Users accidentally select Clojure when they want Common Lisp or vice versa | Ensure the filter uses the full display name "Common Lisp" not just "Lisp" |

## "Looks Done But Isn't" Checklist

- [ ] **languages.json:** Entry added with all 8 required fields (id, name, phi, omega, lambda, psi, gamma, sigma) plus 3 optional (tier, characterSketch, year, paradigm) -- verify `tier` matches score range in `tiers.ts`
- [ ] **ALL_LANGS array:** New language ID added to `code-features.ts` line 29-34 -- verify array length is now 26
- [ ] **code-features.ts snippets:** All 10 feature snippets added (or explicitly `undefined`) -- verify by counting entries in the Feature Matrix
- [ ] **snippets.ts:** Signature snippet added -- verify by visiting `/beauty-index/common-lisp/` and checking the "Signature Code" section renders
- [ ] **justifications.ts:** All 6 dimension justifications written -- verify by visiting `/beauty-index/common-lisp/` and checking the "Dimension Analysis" section has 6 entries
- [ ] **Shiki lang identifier:** The `lang` field in all snippet objects uses the verified working identifier (`"common-lisp"` or `"lisp"`) -- verify by checking syntax highlighting renders in color
- [ ] **"25" -> "26" updates:** All 22+ hardcoded references updated -- verify with `grep -r "25 " src/ | grep -i "lang"` returns zero results
- [ ] **"600" -> "650" updates:** VS page count references updated in `vs/[slug].astro` comment and `llms-full.txt.ts` -- verify with grep
- [ ] **"150" -> "156" updates:** Justification count in `justifications/index.astro` meta description and `llms.txt.ts` updated (25*6=150 becomes 26*6=156)
- [ ] **Blog post:** `the-beauty-index.mdx` frontmatter description, body references, and any Lisp-family analysis sections updated
- [ ] **Cross-reference blog post:** `building-kubernetes-observability-stack.mdx` line 173 reference to "25 languages" updated
- [ ] **OG image text:** `src/lib/og-image.ts` line 618 "Ranking 25" updated to "Ranking 26"
- [ ] **Full build test:** `astro build` completes without errors -- check for Shiki lang warnings
- [ ] **VS pages:** New language appears in VS comparison picker and generates all 50 bidirectional comparison pages
- [ ] **Homepage:** `src/pages/index.astro` line 181 "25 programming languages" updated

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing hardcoded "25" references | LOW | Grep for "25 " in src/ directory; update missed instances; rebuild |
| Wrong Shiki lang identifier | LOW | Change `lang` field in all snippet entries; rebuild and verify highlighting |
| Missing ALL_LANGS entry | LOW | Add ID to the array; rebuild and verify code comparison page |
| Score contradiction with Clojure | MEDIUM | Rewrite justifications to address the contradiction; may require adjusting 1-2 dimension scores to create clearer separation |
| Missing justifications | LOW | Write the 6 justification paragraphs; deploy |
| Build time/memory failure from VS pages | MEDIUM | If OG image generation is the bottleneck, consider caching OG images or generating them in a separate build step. If the VS page count itself is the issue, consider lazy generation or limiting to popular pairs only (breaking change). |
| Blog post inconsistency | LOW | Update the 5-6 affected lines in `the-beauty-index.mdx` and rebuild |
| Lisp-Clojure differentiation failure (post-publish) | HIGH | Requires rewriting character sketch, justifications, and potentially re-scoring -- editorial work that needs care and review |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hardcoded "25" text | Phase 1 (Data & Infrastructure) | Run `grep -rn "25 " src/ \| grep -i lang` and confirm zero matches for the old count |
| Lisp-vs-Clojure differentiation | Phase 2 (Scoring & Content) | Side-by-side review: can each character sketch and justification *only* apply to its language? |
| Syntax highlighting failure | Phase 1 (Data & Infrastructure) | Render a test page with `<Code lang="common-lisp">` and verify colored output |
| ALL_LANGS omission | Phase 1 (Data & Infrastructure) | Code comparison page shows 26 languages; Feature Matrix has 26 rows |
| VS page count explosion | Phase 3 (Integration & Verification) | Full `astro build` completes; 650 VS pages generated; build time within acceptable range |
| Score calibration contradictions | Phase 2 (Scoring & Content) | Total score is less than Clojure's (48); each dimension score has a justification that references the comparative position |
| Missing justifications | Phase 2 (Scoring & Content) | `/beauty-index/common-lisp/` shows "Dimension Analysis" section with 6 entries |
| S-expression readability | Phase 2 (Scoring & Content) | Each code snippet is 5-12 lines, max 3 levels of parenthesis nesting, no horizontal scroll at 576px width |
| Blog post inconsistency | Phase 3 (Integration & Verification) | All pages containing "languages" + a count show the correct number |
| llms.txt/llms-full.txt accuracy | Phase 3 (Integration & Verification) | Build and inspect `/llms.txt` and `/llms-full.txt` output for correct counts and new language listing |

## Sources

- Codebase analysis: `src/data/beauty-index/languages.json`, `code-features.ts`, `snippets.ts`, `justifications.ts` (direct file inspection)
- Codebase analysis: `src/pages/beauty-index/index.astro`, `[slug].astro`, `code/index.astro`, `vs/[slug].astro` (direct file inspection)
- Codebase analysis: `src/lib/og-image.ts`, `src/components/BeautyIndexJsonLd.astro` (direct file inspection)
- Codebase analysis: `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts` (direct file inspection)
- Codebase analysis: `src/data/blog/the-beauty-index.mdx` (direct file inspection)
- Shiki grammar support: [tm-grammars package](https://github.com/shikijs/textmate-grammars-themes/tree/main/packages/tm-grammars) -- confirmed `common-lisp` (alias: `lisp`) is available; Scheme/Racket are NOT available
- Shiki language documentation: [Languages | Shiki](https://shiki.style/languages)
- Common Lisp grammar source: [qingpeng9802/vscode-common-lisp](https://github.com/qingpeng9802/vscode-common-lisp) (MIT license)

---
*Pitfalls research for: Adding Lisp (Common Lisp) as the 26th language to the Beauty Index*
*Researched: 2026-03-01*
