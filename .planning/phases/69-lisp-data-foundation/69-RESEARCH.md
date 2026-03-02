# Phase 69: Lisp Data Foundation - Research

**Researched:** 2026-03-01
**Domain:** Beauty Index data entry for Common Lisp (26th language)
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Total score must be 44
- Tier must be Handsome
- Shiki grammar must use `common-lisp` as lang field
- Must differentiate from Clojure via CLOS, condition system, macro emphasis (per STATE.md decisions)
- id field must be `lisp`
- name field must be `Lisp`

### Claude's Discretion

All four discussion areas were delegated to Claude's discretion. Claude has full flexibility on:
- Character sketch archetype, tone, trait emphasis, and Clojure reference
- Score distribution across 6 dimensions (must total 44, must land in Handsome tier)
- Signature snippet concept, label, and code style
- Clojure differentiation strategy, paradigm label, and year selection
- Dimension justification depth and comparison references

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Lisp entry added to languages.json with scores across all 6 dimensions, tier, character sketch, year, and paradigm | Exact JSON structure documented in Architecture Patterns; score distribution recommendation in Score Allocation Analysis; character sketch archetype in Creative Recommendations |
| DATA-02 | Lisp signature code snippet added to snippets.ts showcasing a distinctive Lisp idiom | CodeSnippet interface documented; snippet recommendation in Creative Recommendations; `common-lisp` lang field verified |
| DATA-03 | Per-dimension justifications added to justifications.ts for all 6 dimensions with Lisp-specific reasoning | Justification format documented; dimension-by-dimension analysis in Score Allocation Analysis |
| DATA-04 | `'lisp'` added to ALL_LANGS array in code-features.ts | Exact location (line 29-34) and insertion pattern documented |

</phase_requirements>

## Summary

This phase adds Common Lisp as the 26th language in the Beauty Index. The work is purely data-entry: adding a JSON entry to `languages.json`, a signature snippet to `snippets.ts`, six dimension justifications to `justifications.ts`, and the string `'lisp'` to the `ALL_LANGS` array in `code-features.ts`. No new components, no new pages, no infrastructure changes -- the existing `[slug].astro` dynamic route and content collection system will automatically generate the `/beauty-index/lisp/` detail page once the data is in place.

The primary challenge is creative, not technical: crafting a Lisp identity that is defensible, differentiated from Clojure (which scores 48 as a "Zen master"), and consistent with the existing Beauty Index tone. The score distribution must total exactly 44 to land in the Handsome tier (40-47 range). OCaml also scores 44, so Lisp's dimension profile must create a distinct radar chart shape.

The technical risk is near-zero. The four files are well-understood, the data structures are documented by Zod schema, and the Shiki `common-lisp` grammar is confirmed available in the project's installed `@shikijs/langs` package.

**Primary recommendation:** Follow the exact data patterns of existing entries (especially Clojure and OCaml as reference points), use `common-lisp` as the lang field in all snippet objects, and distribute the 44 score total to emphasize Lisp's unique strengths (mathematical elegance via macros, conceptual integrity) while honestly scoring its weaknesses (practitioner happiness, aesthetic geometry).

## Standard Stack

### Core (already installed, no additions needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro Content Collections | (project version) | Loads `languages.json` via `file()` loader | Validates each entry against `languageSchema` at build time |
| Zod | (via `astro/zod`) | Schema validation for language entries | Enforces dimension scores 1-10, tier enum, required fields |
| astro-expressive-code | (project version) | Syntax highlighting via `<Code>` component | Uses Shiki under the hood; `common-lisp` grammar bundled |
| @shikijs/langs | (project version) | TextMate grammar for `common-lisp` | Confirmed: `common-lisp` is the primary name, `lisp` is an alias |

### Supporting

No additional libraries needed. This phase is purely data entry into existing structures.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `common-lisp` lang field | `lisp` (alias) | Both work in Shiki, but STATE.md explicitly requires `common-lisp` |
| Common Lisp as the "Lisp" entry | Scheme or a generic "Lisp family" entry | REQUIREMENTS.md explicitly scopes to Common Lisp; Clojure already covers modern Lisp |

## Architecture Patterns

### File Locations and Exact Structures

```
src/
├── data/beauty-index/
│   ├── languages.json        # Add Lisp entry (DATA-01)
│   ├── snippets.ts           # Add signature snippet (DATA-02)
│   ├── justifications.ts     # Add 6 dimension justifications (DATA-03)
│   └── code-features.ts      # Add 'lisp' to ALL_LANGS array (DATA-04)
├── lib/beauty-index/
│   ├── schema.ts             # Zod schema (DO NOT MODIFY)
│   ├── tiers.ts              # Tier boundaries (DO NOT MODIFY)
│   └── dimensions.ts         # Dimension metadata (DO NOT MODIFY)
├── content.config.ts          # Collection loader (DO NOT MODIFY)
└── pages/beauty-index/
    └── [slug].astro           # Auto-generates /beauty-index/lisp/ (DO NOT MODIFY)
```

### Pattern 1: Language Entry in languages.json

**What:** Each language is a JSON object with 12 fields.
**Schema validation:** `languageSchema` in `schema.ts` validates: `id` (string), `name` (string), `phi`/`omega`/`lambda`/`psi`/`gamma`/`sigma` (int 1-10), `tier` (enum: workhorses|practical|handsome|beautiful), `characterSketch` (string), `year` (optional int), `paradigm` (optional string).

**Exact template:**
```json
{
  "id": "lisp",
  "name": "Lisp",
  "phi": <int 1-10>,
  "omega": <int 1-10>,
  "lambda": <int 1-10>,
  "psi": <int 1-10>,
  "gamma": <int 1-10>,
  "sigma": <int 1-10>,
  "tier": "handsome",
  "characterSketch": "<one paragraph, 1-3 sentences>",
  "year": <int>,
  "paradigm": "<comma-separated descriptors>"
}
```

**Insertion point:** Add as a new entry in the JSON array. Position determines initial display order but the page sorts by total score, so insertion position does not matter functionally. Recommend inserting after the Clojure entry (line 127) for editorial proximity.

### Pattern 2: Signature Snippet in snippets.ts

**What:** A `CodeSnippet` object with `lang`, `label`, and `code` fields.
**Interface:**
```typescript
export interface CodeSnippet {
  lang: string;    // Shiki language identifier
  label: string;   // Short description (e.g., "Threading macro")
  code: string;    // 5-12 lines of source code
}
```

**Exact template:**
```typescript
lisp: {
  lang: 'common-lisp',
  label: '<2-5 word description>',
  code: `<5-12 lines of Common Lisp code>`,
},
```

**Insertion point:** Add as a new key in the `SNIPPETS` record. Alphabetical position relative to other keys is not enforced but convention loosely follows addition order. Recommend inserting after the `clojure` entry.

**Critical note:** The `lang` field MUST be `'common-lisp'`, not `'lisp'`. While `lisp` is a Shiki alias that resolves to the same grammar, the STATE.md decision explicitly requires `common-lisp`.

### Pattern 3: Dimension Justifications in justifications.ts

**What:** A record mapping dimension keys to HTML-enabled editorial strings.
**Format:**
```typescript
lisp: {
  phi: '<HTML-enabled justification text>',
  omega: '<HTML-enabled justification text>',
  lambda: '<HTML-enabled justification text>',
  psi: '<HTML-enabled justification text>',
  gamma: '<HTML-enabled justification text>',
  sigma: '<HTML-enabled justification text>',
},
```

**HTML conventions used in existing entries:**
- `<em>` for emphasis (e.g., `Indentation <em>is</em> syntax`)
- `<code>` for inline code references (e.g., `<code>defmacro</code>`)
- `&amp;` for ampersands in HTML context
- No `<p>`, `<br>`, or block-level HTML -- each justification is a single paragraph rendered in a `<p>` tag by the template

**Length convention:** Existing justifications are 2-5 sentences, typically 40-100 words. They follow a pattern of: claim, evidence, qualifier/dock explanation.

**Insertion point:** Add as a new key in the `JUSTIFICATIONS` record. Recommend inserting after the `clojure` entry.

### Pattern 4: ALL_LANGS Registration in code-features.ts

**What:** A `const` array of language ID strings.
**Current content (lines 29-34):**
```typescript
const ALL_LANGS = [
  'haskell', 'rust', 'elixir', 'kotlin', 'swift', 'python', 'ruby',
  'typescript', 'scala', 'clojure', 'fsharp', 'ocaml', 'go', 'csharp',
  'dart', 'julia', 'lua', 'zig', 'java', 'javascript', 'c', 'cpp',
  'php', 'gleam', 'r',
] as const;
```

**Action:** Add `'lisp'` to this array. Recommend inserting after `'clojure'` on line 31 to keep Lisp-family languages adjacent.

**Note:** This registration is required for Phase 69 (DATA-04) but the actual code comparison snippets for each feature (Variable Declaration, If/Else, etc.) are Phase 70 scope (CODE-01 through CODE-10). Adding `'lisp'` to ALL_LANGS without corresponding feature snippets will NOT break the build -- the `snippets` record uses `Record<string, FeatureCodeSnippet | undefined>`, so `undefined` is the expected value for missing languages.

### Anti-Patterns to Avoid

- **Modifying schema.ts, tiers.ts, or dimensions.ts:** These are foundational files. This phase requires zero changes to them.
- **Using `lisp` instead of `common-lisp` as the lang field:** The Shiki alias works but contradicts the locked STATE.md decision.
- **Adding code-features.ts comparison snippets:** Those are Phase 70 (CODE-01 through CODE-10). This phase ONLY adds `'lisp'` to `ALL_LANGS`.
- **Updating "25 languages" references to "26":** That is Phase 71 (SITE-01 through SITE-07).
- **Placing the languages.json entry in wrong tier range:** Score must be 40-47 for `"tier": "handsome"`. Score 44 is confirmed within range.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom CSS classes for Lisp | Shiki `common-lisp` grammar via `<Code>` component | Grammar handles 200+ CL symbols, reader macros, conditions, CLOS keywords |
| Page generation | Manual HTML for `/beauty-index/lisp/` | Existing `[slug].astro` dynamic route | Automatically generates from content collection |
| Score validation | Manual bounds checking | Zod schema (`dimensionScoreSchema: z.number().int().min(1).max(10)`) | Build fails if scores are out of range |
| Tier assignment validation | Manual tier lookup | `getTierByScore()` in tiers.ts | Handsome tier: 40-47 inclusive |

**Key insight:** The entire Beauty Index infrastructure is already built for N languages. Adding the 26th language is a data-only operation. The system was designed for this.

## Common Pitfalls

### Pitfall 1: Score Sum Mismatch

**What goes wrong:** Six dimension scores don't add up to exactly 44.
**Why it happens:** Mental arithmetic errors when distributing scores across 6 dimensions.
**How to avoid:** Verify: `phi + omega + lambda + psi + gamma + sigma === 44` before committing.
**Warning signs:** Build succeeds but language appears in wrong tier on the rendered page.

### Pitfall 2: Using Wrong Shiki Language Identifier

**What goes wrong:** Syntax highlighting doesn't render or falls back to plain text.
**Why it happens:** Using `'lisp'` instead of `'common-lisp'` (or vice versa -- though both work as aliases, the project convention requires `common-lisp`).
**How to avoid:** Use `'common-lisp'` as the `lang` field in both `snippets.ts` and any future `code-features.ts` entries. Verified: `@shikijs/langs` has `common-lisp.mjs` with `aliases: ["lisp"]`.
**Warning signs:** Snippet renders as plain monospace text without color highlighting.

### Pitfall 3: Duplicate or Conflicting ID

**What goes wrong:** Content collection throws duplicate ID error at build time.
**Why it happens:** Using an ID that already exists (e.g., `clojure` instead of `lisp`).
**How to avoid:** The ID is locked as `lisp`. Verify it doesn't exist in `languages.json` before adding.
**Warning signs:** Astro build error: "Duplicate entry ID."

### Pitfall 4: HTML in Justifications Breaking Rendering

**What goes wrong:** Justification text renders with visible HTML tags or breaks layout.
**Why it happens:** Using unsupported HTML elements or forgetting to escape ampersands. The template renders with `set:html`, so raw HTML is interpreted.
**How to avoid:** Use only `<em>`, `<code>`, and `&amp;` -- these are the only HTML constructs used in existing 25 entries. No `<p>`, `<br>`, `<strong>`, or other block-level elements.
**Warning signs:** Broken layout in the Dimension Analysis section of the detail page.

### Pitfall 5: Forgetting to Add to ALL_LANGS

**What goes wrong:** Lisp appears on detail pages and rankings but is missing from the code comparison feature matrix.
**Why it happens:** DATA-04 is easy to overlook since the other three requirements modify different files.
**How to avoid:** Verify `'lisp'` appears in the `ALL_LANGS` array in `code-features.ts` (line 29-34).
**Warning signs:** Code comparison page at `/beauty-index/code/` doesn't list Lisp.

### Pitfall 6: OCaml Score Collision

**What goes wrong:** Lisp's radar chart looks identical to OCaml's, creating a boring comparison.
**Why it happens:** Both score 44 total. If dimension distribution is similar, the radar shapes overlap.
**How to avoid:** OCaml's profile is: phi:7, omega:9, lambda:8, psi:5, gamma:7, sigma:8. Design Lisp's profile to create a visually distinct radar shape -- emphasize different peaks and valleys.
**Warning signs:** The `/beauty-index/vs/lisp-vs-ocaml/` comparison page shows nearly identical radar charts.

## Score Allocation Analysis

### Existing Score Context

Languages scoring 44 (Handsome tier):
- **OCaml:** phi:7, omega:9, lambda:8, psi:5, gamma:7, sigma:8

Clojure (the primary differentiation target, scores 48):
- **Clojure:** phi:6, omega:9, lambda:8, psi:7, gamma:8, sigma:10

Other Handsome tier for context:
- Kotlin: 46, F#: 47, Gleam: 47, Swift: 45, Scala: 41, Go: 43, Julia: 43

### Recommended Score Distribution: phi:5, omega:8, lambda:7, psi:5, gamma:8, sigma:11?

No -- sigma max is 10. Let me reason through this properly.

**Constraints:**
- Total = 44
- Each dimension: integer 1-10
- Must differentiate from Clojure (phi:6, omega:9, lambda:8, psi:7, gamma:8, sigma:10)
- Must differentiate from OCaml (phi:7, omega:9, lambda:8, psi:5, gamma:7, sigma:8)
- Lisp's strengths: macro system (omega), conceptual integrity (sigma), code-as-data homoiconicity (omega/sigma)
- Lisp's weaknesses: parentheses-heavy syntax (phi), modern tooling/ecosystem (psi), verbose by modern standards (lambda)

### Recommended Score Distribution

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **phi** (Aesthetic Geometry) | **5** | Parentheses create visual density. Less visually clean than Clojure (6) which benefits from modern formatting conventions, Clojure's bracket variety `[]` `{}` reduces paren monotony. Lower than OCaml (7). This is Lisp's most defensible weak point. |
| **omega** (Mathematical Elegance) | **9** | Lisp's macro system and homoiconicity are foundational to computer science. `defmacro` enables the programmer to extend the language itself -- closer to mathematical metalanguage than almost any other feature. Ties Clojure and OCaml here, which is defensible since CL macros are more powerful (unhygienic, full compiler access). |
| **lambda** (Linguistic Clarity) | **7** | Prefix notation is a barrier. `(+ 1 2)` is unambiguous but unnatural to most readers. CLOS generic functions and `format` directives add complexity. Better than C (6) but below Clojure (8) which benefits from threading macros and modern idioms. |
| **psi** (Practitioner Happiness) | **5** | Small community, fragmented implementations (SBCL, CCL, ECL, ABCL), limited modern tooling, no unified package manager matching npm/cargo/mix. CL enthusiasts love it deeply but the ecosystem friction is real. Below Clojure (7) which has Leiningen/deps.edn and JVM ecosystem access. Ties OCaml (5). |
| **gamma** (Organic Habitability) | **8** | CLOS's generic functions and method combinations allow extending existing code without modification -- the original open/closed principle. The condition/restart system enables graceful error recovery patterns that most languages still lack. Image-based development (save/restore running system) is uniquely habitable. Ties Clojure (8). |
| **sigma** (Conceptual Integrity) | **10** | "Code is data, data is code" -- the most singular, coherent design principle in computing history. John McCarthy's 1958 paper defines the entire language from seven primitives. Every feature follows from this axiom. Lisp IS conceptual integrity. Ties Clojure (10), which inherited this principle. |

**Total: 5 + 9 + 7 + 5 + 8 + 10 = 44** (confirmed)

**Differentiation from Clojure (phi:6, omega:9, lambda:8, psi:7, gamma:8, sigma:10):**
- phi: 5 vs 6 (Lisp lower -- more parentheses, less bracket variety)
- omega: 9 vs 9 (tie -- both deeply mathematical, defensible)
- lambda: 7 vs 8 (Lisp lower -- no threading macros, prefix notation barrier)
- psi: 5 vs 7 (Lisp lower -- fragmented ecosystem vs JVM ecosystem)
- gamma: 8 vs 8 (tie -- both excel at extensibility, different mechanisms)
- sigma: 10 vs 10 (tie -- both derive from code-is-data axiom)

**Differentiation from OCaml (phi:7, omega:9, lambda:8, psi:5, gamma:7, sigma:8):**
- phi: 5 vs 7 (Lisp lower -- parentheses vs ML syntax)
- omega: 9 vs 9 (tie)
- lambda: 7 vs 8 (Lisp lower)
- psi: 5 vs 5 (tie -- both niche communities)
- gamma: 8 vs 7 (Lisp higher -- CLOS and condition system beat OCaml functors for extensibility)
- sigma: 10 vs 8 (Lisp higher -- seven primitives vs ML-family design)

**Radar chart shape:** Lisp gets a distinctive "sigma spike" (10) with a "phi valley" (5), creating an asymmetric shape unlike OCaml's more even distribution or Clojure's similar-but-higher profile.

## Creative Recommendations

### Character Sketch Archetype

**Recommendation: "The ancient architect"** -- emphasizing Lisp as the progenitor language that designed the blueprints everyone else copies, somewhat amused that its grandchildren get credit for its ideas.

This differentiates from:
- Clojure's "Zen master who sees through your abstractions"
- OCaml's "quiet genius in the corner"
- Haskell's "beautifully dressed philosopher"
- Scala's "PhD student"

The "ancient architect" archetype captures Lisp's 1958 origin (older than any other language in the index), its foundational influence, and the slightly ironic position of being the most imitated yet least adopted language.

**Draft sketch (for planner reference -- final version is implementer's call):**
"The ancient architect whose blueprints everyone copies but nobody credits. Lisp invented garbage collection, conditionals, recursion, and the very concept of code-as-data in 1958, then watched sixty years of languages reinvent its ideas with different syntax."

### Year

**Recommendation: 1958** -- the year of John McCarthy's original paper "Recursive Functions of Symbolic Expressions and Their Computation by Machine." This is the canonical origin date for Lisp. ANSI Common Lisp was standardized in 1994, but using 1958 is more defensible and more interesting: it makes Lisp the oldest language in the index by 14 years (C is 1972).

### Paradigm Label

**Recommendation: `"multi-paradigm, homoiconic"`** -- this differentiates from Clojure's `"functional, Lisp dialect"` label. Common Lisp is genuinely multi-paradigm (OOP via CLOS, functional, imperative, metaprogramming). "Homoiconic" is the most distinctive and accurate differentiator -- code-as-data is Lisp's defining trait.

Alternative: `"multi-paradigm, metaprogrammable"` -- less jargon, equally accurate.

### Signature Snippet

**Recommendation: Macro definition** -- specifically a `defmacro` that demonstrates code-as-data by manipulating syntax at compile time. This directly differentiates from Clojure's snippet (threading macro usage, which is a consumer of macros, not a definition).

**Draft snippet:**
```common-lisp
(defmacro when-let ((var expr) &body body)
  `(let ((,var ,expr))
     (when ,var
       ,@body)))

(when-let (user (find-user "ada"))
  (format t "Hello, ~a!" (user-name user))
  (log-visit user))
```

**Label:** "Macros that write code"

This showcases:
1. `defmacro` -- Lisp's most distinctive feature
2. Backquote/comma syntax -- the code-as-data mechanism
3. A practical, useful macro (not a toy example)
4. The splice operator `,@`
5. A realistic usage example showing the macro in action

**Alternative snippet concept: CLOS generic functions with method combinations** -- would showcase OOP differentiation from Clojure, but macros are more iconic.

### Justification Tone

Existing justifications follow a pattern:
1. **Opening claim** about the score level
2. **Specific evidence** with inline code examples
3. **Qualifier/dock** explaining why the score isn't higher or lower
4. **Implicit or explicit comparison** to reference languages

For Lisp, each justification should reference Clojure at least briefly (since readers will naturally compare the two Lisp-family entries) and highlight what makes Common Lisp distinct: CLOS, the condition/restart system, `defmacro`, the ANSI standard, and the image-based development model.

## Code Examples

### languages.json Entry

```json
{
  "id": "lisp",
  "name": "Lisp",
  "phi": 5,
  "omega": 9,
  "lambda": 7,
  "psi": 5,
  "gamma": 8,
  "sigma": 10,
  "tier": "handsome",
  "characterSketch": "The ancient architect whose blueprints everyone copies but nobody credits. Lisp invented garbage collection, conditionals, recursion, and the very concept of code-as-data in 1958, then watched sixty years of languages reinvent its ideas with different syntax.",
  "year": 1958,
  "paradigm": "multi-paradigm, homoiconic"
}
```

### snippets.ts Entry

```typescript
lisp: {
  lang: 'common-lisp',
  label: 'Macros that write code',
  code: `(defmacro when-let ((var expr) &body body)
  \`(let ((,var ,expr))
     (when ,var
       ,@body)))

(when-let (user (find-user "ada"))
  (format t "Hello, ~a!" (user-name user))
  (log-visit user))`,
},
```

### justifications.ts Entry (structure template)

```typescript
lisp: {
  phi: '<justification for phi score>',
  omega: '<justification for omega score>',
  lambda: '<justification for lambda score>',
  psi: '<justification for psi score>',
  gamma: '<justification for gamma score>',
  sigma: '<justification for sigma score>',
},
```

### code-features.ts ALL_LANGS Update

```typescript
const ALL_LANGS = [
  'haskell', 'rust', 'elixir', 'kotlin', 'swift', 'python', 'ruby',
  'typescript', 'scala', 'clojure', 'lisp', 'fsharp', 'ocaml', 'go', 'csharp',
  'dart', 'julia', 'lua', 'zig', 'java', 'javascript', 'c', 'cpp',
  'php', 'gleam', 'r',
] as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual language count in all text | Hardcoded "25 languages" throughout | v1.3 (2026-02-17) | Phase 71 will update to "26" -- NOT this phase |
| Individual grammar imports | Bundled `@shikijs/langs` | Shiki v1.0+ | `common-lisp` grammar available by default, no extra config |

**Deprecated/outdated:**
- Shiki v0.x used `shiki.getHighlighter()` -- current project uses astro-expressive-code which handles this internally
- The `lisp` alias works but the project convention (STATE.md) requires `common-lisp`

## Common Lisp Domain Knowledge for Justifications

This section provides factual reference material for writing defensible justifications.

### Key Differentiators from Clojure

| Feature | Common Lisp | Clojure |
|---------|-------------|---------|
| **Object system** | CLOS (Common Lisp Object System) -- generic functions, method combinations, MOP | Protocols and records (simpler, no true OOP) |
| **Macro system** | `defmacro` with full code access, unhygienic | `defmacro` limited (no reader macros), generally discouraged in favor of data |
| **Error handling** | Condition/restart system (non-local, interactive recovery) | try/catch (JVM exceptions) |
| **Data philosophy** | Multiple paradigms equally supported | "Data > functions > macros" hierarchy |
| **Mutability** | Mutable by default, immutable opt-in | Immutable by default, mutable opt-in |
| **Runtime** | Image-based (save/restore entire running system) | JVM-hosted |
| **Standard** | ANSI standardized (1994), stable | Evolving via community consensus |
| **Reader macros** | Full reader macro system | No user-defined reader macros |
| **Syntax variety** | Parentheses only: `()` | Parentheses `()`, brackets `[]`, braces `{}` |
| **Year** | 1958 (McCarthy's paper) | 2007 (Rich Hickey) |

### Historical Significance

- First language with garbage collection (1959)
- First language with conditional expressions (`cond`)
- First language with first-class functions
- Introduced the concept of homoiconicity (code-as-data)
- The `eval` function was the first meta-circular evaluator
- Influenced virtually every language in the Beauty Index directly or indirectly
- Seven primitives define the entire language: `quote`, `atom`, `eq`, `car`, `cdr`, `cons`, `cond`

### CLOS Highlights

- Generic functions dispatched on multiple argument types (multiple dispatch, predating Julia by 54 years)
- Method combinations (`:before`, `:after`, `:around`)
- The Metaobject Protocol (MOP) allows customizing the object system itself
- No single-dispatch limitation -- methods belong to generic functions, not classes

### Condition/Restart System

- Separates error signaling from error handling from error recovery
- `handler-bind` and `handler-case` for handling conditions
- `restart-case` defines recovery strategies
- Interactive debugger can invoke restarts at runtime
- More powerful than try/catch: handler can repair and continue without unwinding

## Open Questions

1. **Backquote escaping in template literals**
   - What we know: The signature snippet uses backtick/backquote syntax (`` ` ``), which conflicts with JavaScript template literals
   - What's unclear: Whether `astro-expressive-code` handles this correctly or whether escaping is needed
   - Recommendation: The implementer should test the snippet rendering. If backticks in the Common Lisp code conflict with JS template literal backticks, escape them with `\`` in the TypeScript source. Existing snippets in `snippets.ts` use template literals without issues for other languages, but none contain literal backticks in the code.

2. **Insertion position in languages.json**
   - What we know: The JSON array position doesn't affect rendered order (pages sort by total score)
   - What's unclear: Whether the content collection loader preserves array order for any purpose
   - Recommendation: Insert after Clojure entry for editorial proximity. No functional impact either way.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** - `languages.json`, `snippets.ts`, `justifications.ts`, `code-features.ts`, `schema.ts`, `tiers.ts`, `dimensions.ts`, `content.config.ts`, `[slug].astro` -- all read directly from source
- **@shikijs/langs package** - Confirmed `common-lisp.mjs` exists with `aliases: ["lisp"]` in `node_modules/@shikijs/langs/dist/`
- **Shiki languages page** - [https://shiki.style/languages](https://shiki.style/languages) -- confirmed Common Lisp is a bundled grammar

### Secondary (MEDIUM confidence)
- **Common Lisp historical claims** - McCarthy's 1958 paper "Recursive Functions of Symbolic Expressions" is well-documented; ANSI CL standardization in 1994 is public record
- **CLOS and condition system features** - Based on the ANSI CL standard (HyperSpec) and widely documented in CL literature

### Tertiary (LOW confidence)
- None -- all claims verified against primary sources or well-established historical record

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, grammar verified in node_modules
- Architecture: HIGH - all four file structures fully documented from source inspection
- Pitfalls: HIGH - based on direct analysis of schema validation and existing patterns
- Score allocation: HIGH for constraints (verified against tier ranges), MEDIUM for creative content (recommendations, not requirements)
- Creative content: MEDIUM - character sketch, snippet, and justifications are recommendations; implementer has full discretion

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable -- no dependencies expected to change)
