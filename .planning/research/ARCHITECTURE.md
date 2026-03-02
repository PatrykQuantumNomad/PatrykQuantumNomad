# Architecture Patterns

**Domain:** Adding Lisp (26th language) to the Beauty Index
**Researched:** 2026-03-01

## Recommended Architecture

No new architecture needed. Lisp integrates into the existing data-driven architecture by adding entries to existing data files and updating hardcoded count strings. The system is designed for language additions -- all rendering is dynamic from the `languages` content collection.

### Language ID Convention

Use `lisp` as the language ID. Convention analysis:

| Language | ID | Pattern |
|----------|-----|---------|
| C# | `csharp` | Spelled-out name |
| C++ | `cpp` | Common abbreviation |
| F# | `fsharp` | Spelled-out name |
| JavaScript | `javascript` | Full lowercase |
| Clojure | `clojure` | Full lowercase (already a Lisp dialect) |

**Recommendation: `lisp`** -- simple, follows the lowercase single-word convention. Since Clojure already uses `clojure` (not `clojure-lisp`), and the entry represents the Common Lisp/Scheme family broadly, `lisp` is the correct ID. This also matches Shiki's language identifier for syntax highlighting (`lisp`).

**Display name: "Lisp"** -- matches the family name. The `paradigm` field can clarify: `"functional, homoiconic, multi-paradigm"`.

### Component Boundaries

| Component | Responsibility | Impact of Adding Lisp |
|-----------|---------------|----------------------|
| `src/data/beauty-index/languages.json` | Language entries with scores | Add 1 JSON object |
| `src/data/beauty-index/snippets.ts` | Signature code snippets | Add 1 keyed entry |
| `src/data/beauty-index/justifications.ts` | Per-dimension editorial text | Add 1 keyed entry (6 justifications) |
| `src/data/beauty-index/code-features.ts` | 10 features x N languages | Add `lisp` to `ALL_LANGS`, add up to 10 snippets |
| `src/lib/beauty-index/schema.ts` | Zod validation schema | **No changes needed** -- schema is generic |
| `src/lib/beauty-index/dimensions.ts` | 6 dimension definitions | **No changes needed** |
| `src/lib/beauty-index/tiers.ts` | Tier boundaries + colors | **No changes needed** |
| `src/lib/beauty-index/radar-math.ts` | SVG chart math | **No changes needed** -- works with any `values.length` |
| `src/content.config.ts` | Collection definitions | **No changes needed** -- uses `file()` loader |
| Pages (`[slug].astro`, `vs/[slug].astro`) | Dynamic route generation | **Auto-generated** from collection |
| OG images (`open-graph/beauty-index/`) | Build-time PNG generation | **Auto-generated** from collection |

### Data Flow

```
languages.json (source of truth)
      |
      v
content.config.ts (file() loader + Zod validation)
      |
      v
getCollection('languages') (Astro content layer)
      |
      +---> [slug].astro (26 detail pages, auto-generated)
      +---> vs/[slug].astro (650 comparison pages: 26x25, auto-generated)
      +---> index.astro (overview: bar chart, scoring table, radar grid)
      +---> code/index.astro (code comparison, reads CODE_FEATURES)
      +---> justifications/index.astro (editorial justifications)
      +---> open-graph/beauty-index/[slug].png.ts (26 OG images)
      +---> open-graph/beauty-index/vs/[slug].png.ts (650 OG images)
      +---> open-graph/beauty-index.png.ts (overview OG image)
      +---> llms.txt.ts / llms-full.txt.ts (LLM-readable summaries)
      +---> BeautyIndexJsonLd.astro (structured data)
```

**Key insight:** The dynamic pages (`[slug].astro`, `vs/[slug].astro`, OG image routes) all use `getCollection('languages')` and iterate over the result. Adding an entry to `languages.json` automatically creates the new detail page, all VS comparison pages, and the OG image. No page file modifications needed for routing.

## File-by-File Integration Plan

### Phase 1: Core Data (must be done together, order matters)

**1. `src/data/beauty-index/languages.json`** -- ADD ENTRY

Add a new object to the JSON array. Position in array does not matter (pages sort by score). Required fields per Zod schema:

```json
{
  "id": "lisp",
  "name": "Lisp",
  "phi": <1-10>,
  "omega": <1-10>,
  "lambda": <1-10>,
  "psi": <1-10>,
  "gamma": <1-10>,
  "sigma": <1-10>,
  "tier": "<workhorses|practical|handsome|beautiful>",
  "characterSketch": "<editorial character sketch>",
  "year": 1958,
  "paradigm": "functional, homoiconic, multi-paradigm"
}
```

The `tier` field must match the total score against tier boundaries:
- beautiful: 48-60
- handsome: 40-47
- practical: 32-39
- workhorses: 6-31

**Build validation:** Zod schema in `schema.ts` validates all fields at build time. A wrong tier-score mismatch won't be caught by schema (tier is independent enum), but the UI will display inconsistently.

**2. `src/data/beauty-index/snippets.ts`** -- ADD ENTRY

Add a `lisp` key to the `SNIPPETS` record. The Shiki language identifier for Common Lisp syntax highlighting is `lisp`. Example:

```typescript
lisp: {
  lang: 'lisp',
  label: 'Recursive macros',
  code: `(defmacro when (test &body body)
  \`(if ,test
       (progn ,@body)))

(defun factorial (n)
  (if (<= n 1)
      1
      (* n (factorial (1- n)))))`,
},
```

**Shiki support:** Shiki (used by astro-expressive-code) supports `lisp` as a language identifier. This covers Common Lisp syntax. If Scheme-specific highlighting is needed, `scheme` is also available, but `lisp` is the correct choice for representing the Lisp family.

**3. `src/data/beauty-index/justifications.ts`** -- ADD ENTRY

Add a `lisp` key with justifications for all 6 dimensions (`phi`, `omega`, `lambda`, `psi`, `gamma`, `sigma`). Text may contain HTML (`<em>`, `<code>`). Example structure:

```typescript
lisp: {
  phi: 'Parentheses create a uniform tree structure...',
  omega: 'Homoiconicity means code is data...',
  lambda: 'S-expressions are transparent...',
  psi: 'A small but deeply devoted community...',
  gamma: 'Macros enable organic extension...',
  sigma: 'The oldest surviving design philosophy...',
},
```

**4. `src/data/beauty-index/code-features.ts`** -- ADD TO ALL_LANGS + ADD SNIPPETS

Two changes required:

a) Add `'lisp'` to the `ALL_LANGS` array (line 29-34):
```typescript
const ALL_LANGS = [
  'haskell', 'rust', 'elixir', 'kotlin', 'swift', 'python', 'ruby',
  'typescript', 'scala', 'clojure', 'fsharp', 'ocaml', 'go', 'csharp',
  'dart', 'julia', 'lua', 'zig', 'java', 'javascript', 'c', 'cpp',
  'php', 'gleam', 'r', 'lisp',
] as const;
```

b) Add `lisp` snippets to each of the 10 feature objects (`variableDeclaration`, `ifElse`, `loops`, `functions`, `structs`, `patternMatching`, `errorHandling`, `stringInterpolation`, `listOperations`, `signatureIdiom`). Each snippet is optional -- `undefined` means "Feature not natively supported" is displayed.

Lisp should have snippets for most features. Notable considerations:
- **Variable Declaration**: `defvar`, `defparameter`, `let` bindings
- **If/Else**: `if`, `cond`, `when`
- **Loops**: `loop`, `do`, `mapcar` (functional iteration)
- **Functions**: `defun`, `lambda`
- **Structs**: `defstruct`, `defclass` (CLOS)
- **Pattern Matching**: Lisp doesn't have native pattern matching (use `cond`/`typecase`), or mark as unsupported
- **Error Handling**: `handler-case`, `restart-case` (condition system)
- **String Interpolation**: Lisp lacks native string interpolation (`format` instead), mark as unsupported or show `format`
- **List Operations**: `mapcar`, `remove-if-not`, `reduce` -- Lisp's strength
- **Signature Idiom**: Macros -- the quintessential Lisp feature

### Phase 2: Hardcoded Count Updates (25 -> 26)

Every hardcoded "25" that refers to the language count must be updated to "26". Every derived count (150 justifications = 25x6, 250 code blocks = 25x10, 600 VS pages = 25x24) must also be updated.

**CRITICAL: Complete list of hardcoded "25 languages" references to update:**

| File | Line | Current Text | New Text |
|------|------|-------------|----------|
| `src/pages/beauty-index/index.astro` | 30 | `"...ranks 25 programming languages..."` | `"...ranks 26 programming languages..."` |
| `src/pages/beauty-index/index.astro` | 32 | `"...Ranking 25 programming languages..."` | `"...Ranking 26 programming languages..."` |
| `src/pages/beauty-index/index.astro` | 47 | `Ranking 25 programming languages` | `Ranking 26 programming languages` |
| `src/pages/beauty-index/index.astro` | 124 | `Ranking 25 Programming Languages` | `Ranking 26 Programming Languages` |
| `src/pages/beauty-index/[slug].astro` | 4 | `Generates 25 static pages` (comment) | `Generates 26 static pages` |
| `src/pages/beauty-index/[slug].astro` | 80 | `among 25 programming languages` | `among 26 programming languages` |
| `src/pages/beauty-index/code/index.astro` | 5 | `for all 25 languages. All 250 code blocks` (comment) | `for all 26 languages. All 260 code blocks` |
| `src/pages/beauty-index/code/index.astro` | 29 | `"Compare how 25 programming languages..."` | `"Compare how 26 programming languages..."` |
| `src/pages/beauty-index/code/index.astro` | 31 | `"...across 25 programming languages"` | `"...across 26 programming languages"` |
| `src/pages/beauty-index/code/index.astro` | 39 | `See how 25 languages` | `See how 26 languages` |
| `src/pages/beauty-index/justifications/index.astro` | 5 | `for all 25 languages` (comment) | `for all 26 languages` |
| `src/pages/beauty-index/justifications/index.astro` | 31 | `"...25 languages, 6 dimensions, 150 justifications."` | `"...26 languages, 6 dimensions, 156 justifications."` |
| `src/pages/beauty-index/justifications/index.astro` | 33 | `"...for 25 programming languages"` | `"...for 26 programming languages"` |
| `src/pages/beauty-index/vs/[slug].astro` | 4 | `600 static pages (25 x 24)` (comment) | `650 static pages (26 x 25)` |
| `src/pages/index.astro` | 181 | `25 programming languages ranked` | `26 programming languages ranked` |
| `src/pages/llms.txt.ts` | 89 | `ranks 25 programming languages` | `ranks 26 programming languages` |
| `src/pages/llms.txt.ts` | 94 | `25 languages compared` | `26 languages compared` |
| `src/pages/llms.txt.ts` | 95 | `150 editorial justifications` | `156 editorial justifications` |
| `src/pages/llms-full.txt.ts` | 143 | `ranking of 25 programming languages` | `ranking of 26 programming languages` |
| `src/pages/llms-full.txt.ts` | 184 | `600 comparison pages available (25 x 24)` | `650 comparison pages available (26 x 25)` |
| `src/lib/og-image.ts` | 618 | `Ranking 25 programming languages` | `Ranking 26 programming languages` |
| `src/components/BeautyIndexJsonLd.astro` | 5 | `list all 25 languages` (comment) | `list all 26 languages` |
| `src/components/BeautyIndexJsonLd.astro` | 23 | `"Ranking 25 programming languages..."` | `"Ranking 26 programming languages..."` |
| `src/components/beauty-index/RankingBarChart.astro` | 84 | `all 25 languages sorted` | `all 26 languages sorted` |
| `src/components/beauty-index/FeatureMatrix.astro` | 4 | `25-row x 10-column` (comment) | `26-row x 10-column` |
| `src/data/beauty-index/snippets.ts` | 12 | `all 25 Beauty Index languages` (comment) | `all 26 Beauty Index languages` |
| `src/data/beauty-index/justifications.ts` | 2 | `all 25 Beauty Index languages` (comment) | `all 26 Beauty Index languages` |
| `src/data/beauty-index/code-features.ts` | 28 | `All 25 language IDs` (comment) | `All 26 language IDs` |
| `src/data/beauty-index/code-features.ts` | 3025 | `up to 25 languages` (comment) | `up to 26 languages` |

**Blog post references (editorial decision needed):**

| File | Line | Current Text | Decision |
|------|------|-------------|----------|
| `src/data/blog/the-beauty-index.mdx` | 3 | `ranks 25 programming languages` | Update to 26 |
| `src/data/blog/the-beauty-index.mdx` | 16 | (long line, references 25) | Update to 26 |
| `src/data/blog/the-beauty-index.mdx` | 30 | `ranking of 25 programming languages` | Update to 26 |
| `src/data/blog/the-beauty-index.mdx` | 36 | `25 languages scored` | Update to 26 |
| `src/data/blog/the-beauty-index.mdx` | 227 | (references 25 languages) | Update to 26 |
| `src/data/blog/the-beauty-index.mdx` | 229 | `all 25 languages` | Update to 26 |
| `src/data/blog/building-kubernetes-observability-stack.mdx` | 173 | `25 languages are scored` | Update to 26 |

### Phase 3: No Changes Needed (Auto-Generated)

These files require **zero modifications** -- they dynamically derive from the collection:

- `src/pages/beauty-index/[slug].astro` -- `getStaticPaths()` iterates `getCollection('languages')`, auto-generates `/beauty-index/lisp/`
- `src/pages/beauty-index/vs/[slug].astro` -- Double loop generates all pairs, auto-creates 50 new VS pages (25 existing + lisp, lisp + 25 existing)
- `src/pages/open-graph/beauty-index/[slug].png.ts` -- Auto-generates `/open-graph/beauty-index/lisp.png`
- `src/pages/open-graph/beauty-index/vs/[slug].png.ts` -- Auto-generates 50 new VS OG images
- `src/pages/beauty-index/index.astro` -- Overview dynamically renders all languages (bar chart, table, grid all use `sorted` array from collection)
- `src/components/beauty-index/ScoringTable.astro` -- Renders from props
- `src/components/beauty-index/LanguageGrid.astro` -- Renders from props
- `src/components/beauty-index/RadarChart.astro` -- Renders from single language prop
- `src/components/beauty-index/OverlayRadarChart.astro` -- Renders from two language props
- `src/components/beauty-index/VsComparePicker.tsx` -- Receives language list from parent
- `src/components/beauty-index/LanguageFilter.tsx` -- Receives language list from parent
- `src/components/beauty-index/FeatureMatrix.astro` -- Reads from `languages.json` directly (sorted alphabetically)
- `src/content.config.ts` -- Generic `file()` loader, no count awareness

## Patterns to Follow

### Pattern 1: Data-First Architecture
**What:** All rendering derives from `languages.json`. Adding a language is purely a data operation plus count string updates.
**When:** Always -- this is the existing pattern.
**Example:** The `[slug].astro` page uses `getStaticPaths()` to iterate all languages. Adding a JSON entry automatically creates the page.

### Pattern 2: Keyed Records for Optional Data
**What:** `snippets.ts`, `justifications.ts`, and `code-features.ts` use `Record<string, T>` keyed by language ID. Missing keys are handled gracefully (show "not supported" or skip section).
**When:** For all language-specific data that might not exist for every language.
**Example:** If a code feature snippet is `undefined` for lisp, the code comparison page shows "Feature not natively supported" -- no crash.

### Pattern 3: Score-Based Sorting
**What:** All display ordering uses `totalScore(b) - totalScore(a)` descending sort. Array position in `languages.json` is irrelevant.
**When:** Rankings, navigation (prev/next), radar grids.
**Example:** Lisp's position in `languages.json` does not affect display order. Its total score determines rank.

### Pattern 4: Shiki Language Identifiers
**What:** The `lang` field in snippets must match a Shiki grammar identifier for syntax highlighting.
**When:** Every `CodeSnippet` object.
**Example:** Use `lisp` (not `common-lisp` or `scheme`). Shiki supports `lisp` as a built-in grammar.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoding Language Count in Dynamic Logic
**What:** Using `25` as a number in calculations or conditionals.
**Why bad:** Breaks silently when languages are added.
**Instead:** The codebase already avoids this -- all dynamic logic uses `.length`, `sorted.length`, etc. The "25" references are only in human-readable strings, comments, and meta descriptions. Keep it that way.

### Anti-Pattern 2: Adding Lisp Data Without ALL_LANGS Update
**What:** Adding lisp snippets to code-features.ts but forgetting to add `'lisp'` to the `ALL_LANGS` const array.
**Why bad:** `getFeatureSupport()` won't include lisp in its results, and the FeatureMatrix will not show the lisp row properly.
**Instead:** Always update `ALL_LANGS` when adding a language to code-features.ts.

### Anti-Pattern 3: Inconsistent ID Between Files
**What:** Using `common-lisp` in one file and `lisp` in another.
**Why bad:** Keyed lookups (`SNIPPETS[languageId]`, `JUSTIFICATIONS[languageId]`) will fail silently, returning `undefined`.
**Instead:** Use `lisp` consistently across all files. The `id` field in `languages.json` is the canonical key.

### Anti-Pattern 4: Mismatched Tier and Score
**What:** Setting `"tier": "beautiful"` when the total score is 38 (which falls in "practical" range).
**Why bad:** The Zod schema does not validate tier-score consistency. The detail page will show a "Beautiful" badge but the overview page groups by tier score, causing visual inconsistency.
**Instead:** Calculate total score first, then assign tier based on boundaries: beautiful 48-60, handsome 40-47, practical 32-39, workhorses 6-31.

## Build Order (Correct Dependency Sequence)

```
Step 1: languages.json        (content collection source -- must exist for build)
Step 2: snippets.ts           (keyed by language ID from Step 1)
Step 3: justifications.ts     (keyed by language ID from Step 1)
Step 4: code-features.ts      (ALL_LANGS array + snippets, keyed by language ID)
Step 5: Count string updates  (all hardcoded "25" -> "26" updates)
Step 6: Blog post updates     (editorial "25" -> "26" references)
Step 7: Build + verify        (astro build, check new pages render)
```

Steps 1-4 are data additions (no existing code modified, only new entries added).
Step 5 is string replacements (existing text modified).
Step 6 is editorial content updates.

Steps 1-4 can technically be done in any order since they're all consumed at build time, but `languages.json` should be first because it defines the canonical ID and scores that inform the other files.

## Scalability Considerations

| Concern | At 26 languages | At 50 languages | At 100 languages |
|---------|-----------------|-----------------|------------------|
| Build time (VS pages) | 650 pages (26x25) | 2,450 pages (50x49) | 9,900 pages (100x99) |
| Build time (VS OG images) | 650 PNGs via Satori | 2,450 PNGs -- **may need optimization** | 9,900 PNGs -- **will need pagination/lazy** |
| Page load (overview) | 26 radar charts: fine | 50 charts: may need virtualization | 100 charts: needs virtualization |
| `code-features.ts` file size | ~25K tokens: manageable | ~50K tokens: consider splitting | ~100K tokens: **must split** |

At 26 languages, no scalability concerns exist. The quadratic VS page growth (N*(N-1)) is the first thing that will become a problem if languages continue to be added.

## Clojure vs Lisp: Relationship Note

Clojure is already in the Beauty Index with `id="clojure"` and `paradigm: "functional, Lisp dialect"`. Adding Lisp as a separate entry is valid because:

1. Clojure is a modern JVM-hosted Lisp dialect with its own distinct characteristics (persistent data structures, STM, Java interop)
2. "Lisp" (Common Lisp / Scheme family) represents the original 1958 language family with its own distinct beauty characteristics (condition system, CLOS, reader macros, historical significance)
3. The existing codebase treats each language as independent -- no parent-child relationships in the schema

The `characterSketch` and `justifications` for Lisp should acknowledge Clojure's existence as a descendant while focusing on what makes traditional Lisp distinctive.

## Sources

- Direct codebase analysis of all files listed above (HIGH confidence)
- Shiki language grammar list (built-in `lisp` support): verified via Shiki documentation (HIGH confidence)
- Astro content collections with `file()` loader: verified in `content.config.ts` (HIGH confidence)
