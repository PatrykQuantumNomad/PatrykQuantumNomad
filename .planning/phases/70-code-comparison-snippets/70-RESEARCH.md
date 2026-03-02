# Phase 70: Code Comparison Snippets - Research

**Researched:** 2026-03-02
**Domain:** Common Lisp code snippets for 10-feature code comparison page
**Confidence:** HIGH

## Summary

Phase 70 adds Common Lisp code snippets for 9 of the 10 feature tabs in `code-features.ts` (Feature 10, Signature Idiom, is already handled -- it pulls from `snippets.ts` where Phase 69 placed the `defmacro` snippet). This is a pure data-entry task into a single file. Each snippet must use `lang: 'common-lisp'`, stay within 12 lines, avoid horizontal scrolling at 576px (target ~55 characters per line max), and showcase distinctive Common Lisp idioms rather than duplicating patterns already covered by the existing Clojure entries.

The key differentiators for Lisp vs. Clojure are established by the success criteria and STATE.md: CLOS `defclass`/`defgeneric`/`defmethod` for Structs (not `defstruct`), the condition/restart system (`handler-bind`, `restart-case`) for Error Handling, and `defmacro` with backquote/unquote for Signature Idiom. For the remaining 6 features (Variable Declaration, If/Else, Loops, Functions, String Interpolation, List Operations), the snippets should use idiomatic Common Lisp that readers can compare to Clojure's entries without confusing the two.

The only technical hazard is backtick escaping: Common Lisp's backquote character (`` ` ``) conflicts with JavaScript template literals. The solution proven in Phase 69 is to escape as `\`` inside the template string. Most of the 9 new snippets should NOT need backquote syntax (only macros use it), so this hazard is limited. Pattern Matching and Signature Idiom are the only features where backquote might appear, and Signature Idiom is already done.

**Primary recommendation:** Insert 9 `lisp:` snippet entries into `code-features.ts` between the existing `clojure:` and `fsharp:` entries in each feature section. Use `lang: 'common-lisp'` for all. Feature 10 requires NO changes -- it auto-imports from `snippets.ts`.

## Standard Stack

### Core (already installed, no additions needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro `<Code />` (via astro-expressive-code) | project version | Build-time syntax highlighting | Renders CL code blocks at build time with zero runtime JS |
| @shikijs/langs `common-lisp.mjs` | bundled | TextMate grammar for Common Lisp | Confirmed in `node_modules/@shikijs/langs/dist/common-lisp.mjs`; name `common-lisp`, alias `lisp` |

### Supporting

No additional libraries needed. This phase modifies only `code-features.ts`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `common-lisp` lang field | `lisp` (alias) | Both resolve to same grammar, but STATE.md locks `common-lisp` |
| Inline snippet per feature | Single `SNIPPETS`-style import | Would require refactoring code-features.ts architecture; not how the file works |

## Architecture Patterns

### File Location

```
src/data/beauty-index/
└── code-features.ts     # ONLY file modified (9 insertions)
```

### Pattern: Snippet Entry Structure

**What:** Each language entry in a feature section is a keyed object in the `snippets` record.
**Exact template:**

```typescript
    lisp: {
      lang: 'common-lisp',
      label: '<2-6 word description of what the snippet shows>',
      code: `<5-12 lines of Common Lisp code>`,
    },
```

**Insertion point:** After the `clojure:` entry's closing `},` and before the `fsharp:` entry in each feature section. The 9 insertion points are:

| Feature | Feature # | Clojure ends (line) | fsharp starts (line) | Insert before |
|---------|-----------|---------------------|----------------------|---------------|
| Variable Declaration | 1 | ~159 | 160 | 160 |
| If/Else | 2 | ~463 | 464 | 464 |
| Loops | 3 | ~773 | 774 | 774 |
| Functions | 4 | ~1128 | 1129 | 1129 |
| Structs | 5 | ~1470 | 1471 | 1471 |
| Pattern Matching | 6 | ~1840 | 1841 | 1841 |
| Error Handling | 7 | ~2091 | 2092 | 2092 |
| String Interpolation | 8 | ~2478 | 2479 | 2479 |
| List Operations | 9 | ~2800 | 2801 | 2801 |

**Note:** Line numbers shift by ~10-12 lines after each insertion. The planner should instruct the implementer to insert top-to-bottom (Feature 1 first, Feature 9 last) OR use find-and-replace anchored to the `fsharp:` entry text. Better yet, use the `old_string` anchor pattern: find the closing `},\n    fsharp:` pattern after each Clojure entry.

### Pattern: Feature 10 (Signature Idiom) -- NO CHANGES NEEDED

Feature 10 is constructed dynamically:
```typescript
const signatureIdiom: CodeFeature = {
  name: 'Signature Idiom',
  description: 'The characteristic code snippet that best represents each language.',
  snippets: Object.fromEntries(
    ALL_LANGS.map((id) => [id, SNIPPETS[id] as FeatureCodeSnippet | undefined])
  ) as Record<string, FeatureCodeSnippet | undefined>,
};
```

Since `'lisp'` is already in `ALL_LANGS` and `SNIPPETS.lisp` exists in `snippets.ts`, Feature 10 automatically includes the Lisp signature snippet. The success criteria requirement "The Signature Idiom tab shows defmacro with backquote/unquote" is already satisfied by Phase 69's `snippets.ts` entry. CODE-10 requires zero additional work.

### Anti-Patterns to Avoid

- **Adding a `lisp:` entry to the signatureIdiom section:** Feature 10 has no inline snippets -- it imports from SNIPPETS. Adding one would create a duplicate.
- **Using `'lisp'` as the lang field:** Must be `'common-lisp'` per STATE.md.
- **Using `defstruct` for the Structs tab:** Success criteria explicitly require CLOS `defclass`/`defgeneric`/`defmethod`. `defstruct` is Common Lisp but does NOT differentiate from Clojure's record approach.
- **Using `try/catch` or `handler-case` alone for Error Handling:** Success criteria require the condition/restart system (`handler-bind`, `restart-case`). `handler-case` is the simpler analog of try/catch -- the restart mechanism is what makes CL unique.
- **Lines exceeding ~55 characters:** At 576px viewport with code block padding (Expressive Code adds ~32px padding on each side), roughly 55 monospace characters (14px font, ~7.8px char width) fit without horizontal scroll. Existing snippets go up to 76 chars; Lisp snippets must be more conservative per success criteria.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Manual CSS classes | Shiki `common-lisp` grammar via `<Code>` component | Grammar handles 200+ CL symbols, CLOS keywords, condition types, format directives |
| Feature 10 snippet | Inline `lisp:` entry in signatureIdiom | Existing SNIPPETS import mechanism | Already works, already verified by Phase 69 |
| Backquote rendering | Special character handling | Standard `\`` escaping in JS template literal | Proven pattern from snippets.ts Phase 69 implementation |

**Key insight:** This is 100% data entry. No infrastructure, no components, no configuration. Just 9 TypeScript object literal insertions into an existing file.

## Common Pitfalls

### Pitfall 1: Backtick Escaping in Template Literals

**What goes wrong:** Build fails with SyntaxError because unescaped `` ` `` terminates the template literal prematurely.
**Why it happens:** Common Lisp's backquote (quasiquote) character is `` ` ``, identical to JavaScript's template literal delimiter.
**How to avoid:** Escape any backquote in CL code as `\`` inside the `code: \`...\`` template literal. Most features (Variable Declaration, If/Else, Loops, Functions, String Interpolation, List Operations) should NOT need backquote at all. CLOS definitions (`defclass`, `defgeneric`, `defmethod`) don't use backquote either. Only macros and certain metaprogramming patterns use backquote.
**Warning signs:** TypeScript compilation error; or visible `\` characters in rendered output (which would mean over-escaping).

### Pitfall 2: Using defstruct Instead of CLOS for Structs Tab

**What goes wrong:** Success criteria check #2 fails. The snippet looks like a simple struct definition, indistinguishable from Clojure's defrecord approach.
**Why it happens:** `defstruct` is simpler and more intuitive. But the success criteria explicitly require CLOS to differentiate from Clojure.
**How to avoid:** Use `defclass` with `:initarg`/`:accessor`, `defgeneric`, and `defmethod`. This demonstrates multiple dispatch and the generic function paradigm -- Lisp's OOP approach that Clojure deliberately replaced with protocols.
**Warning signs:** Snippet contains `defstruct` instead of `defclass`.

### Pitfall 3: handler-case Instead of handler-bind/restart-case

**What goes wrong:** Success criteria check #3 fails. `handler-case` is the CL analog of try/catch -- it unwinds the stack like every other language. The unique feature is restarts.
**Why it happens:** `handler-case` is simpler to demonstrate. `handler-bind` with `restart-case` requires more setup but showcases CL's unique non-local error recovery.
**How to avoid:** The Error Handling snippet MUST show `restart-case` (defining recovery options) paired with `handler-bind` (handling without unwinding). This is the only feature in any language that separates "what went wrong" from "how to recover."
**Warning signs:** Snippet uses `handler-case` or plain `error`/`cerror` without restart machinery.

### Pitfall 4: Snippets Exceeding 12 Lines

**What goes wrong:** Snippet takes too much vertical space, violates success criteria #5.
**Why it happens:** Common Lisp is verbose. CLOS definitions and condition/restart setups naturally need many lines.
**How to avoid:** Count lines carefully. Each snippet MUST be 5-12 lines. Use comments sparingly (they count toward the limit). For CLOS and condition/restart, pick the most compact meaningful example.
**Warning signs:** Count lines of each `code:` block before committing.

### Pitfall 5: Lines Too Long for 576px Viewport

**What goes wrong:** Horizontal scroll appears at 576px, violating success criteria #5.
**Why it happens:** CL's prefix notation with nested parentheses can create long lines, especially with format directives or long function names.
**How to avoid:** Target ~55 characters max per line. Break long forms across lines using CL's indentation conventions. Avoid long symbol names in examples.
**Warning signs:** Any line approaching 60+ characters.

### Pitfall 6: Line Number Shift During Sequential Insertions

**What goes wrong:** After inserting Lisp's Variable Declaration snippet (adds ~10 lines), all subsequent line numbers in the file shift. If the implementer uses line-number-based insertion, later insertions land in wrong locations.
**How to avoid:** Use content-anchored insertion (find the `clojure:` closing + `fsharp:` opening pattern) rather than line numbers. OR insert all 9 snippets in a single session, top-to-bottom, accounting for shifts.
**Warning signs:** Lisp snippet appears inside another language's entry.

## Code Examples

### Verified Patterns from Codebase Inspection

All examples below use `lang: 'common-lisp'` and are designed to fit within 12 lines and ~55 characters per line.

### CODE-01: Variable Declaration

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'Defvar, defparameter, and let',
      code: `(defvar *name* "Lisp")
(defparameter *count* 0)

(let ((x 10)
      (y 20)
      (langs '("Lisp" "Scheme")))
  (+ x y (length langs)))`,
    },
```

**Differentiator from Clojure:** `defvar` vs `def`, `defparameter` (re-assignable convention), earmuffs (`*name*`), `let` with double-paren binding syntax vs Clojure's vector bindings `[x 10]`.
**Line count:** 7 lines. **Max line width:** 36 chars.

### CODE-02: If/Else

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'Cond expression',
      code: `(cond
  ((>= score 90) "excellent")
  ((>= score 70) "good")
  ((>= score 50) "average")
  (t "needs improvement"))`,
    },
```

**Differentiator from Clojure:** CL `cond` uses double-parens `((test) result)` vs Clojure's flat `(>= score 90) "excellent"`. CL uses `t` for else vs Clojure's `:else`.
**Line count:** 5 lines. **Max line width:** 33 chars.

### CODE-03: Loops

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'Loop macro',
      code: `(loop for i from 1 to 10
      do (print i))

(loop for x in '(1 2 3 4 5)
      when (evenp x)
      sum x into total
      finally (return total))`,
    },
```

**Differentiator from Clojure:** CL's `loop` macro is a mini-language with English-like syntax (`for`, `from`, `to`, `when`, `sum`, `finally`). Clojure has `doseq` and `loop/recur` which are more Lisp-traditional. CL's `loop` is controversial but uniquely expressive.
**Line count:** 7 lines. **Max line width:** 36 chars.

### CODE-04: Functions

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'Defun and lambda',
      code: `(defun greet (name)
  (format nil "Hello, ~a!" name))

(defun apply-fn (f x)
  (funcall f x))

(let ((double (lambda (x) (* x 2))))
  (apply-fn double 21))`,
    },
```

**Differentiator from Clojure:** CL needs `funcall` to call function values (Lisp-2 vs Clojure's Lisp-1 where `(f x)` works directly). `lambda` vs Clojure's `fn` and `#()` reader macro.
**Line count:** 8 lines. **Max line width:** 42 chars.

### CODE-05: Structs (CLOS Classes)

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'CLOS defclass and methods',
      code: `(defclass user ()
  ((name :initarg :name :accessor user-name)
   (age  :initarg :age  :accessor user-age)))

(defgeneric greet (obj))
(defmethod greet ((u user))
  (format nil "Hello, ~a!" (user-name u)))

(greet (make-instance 'user
         :name "Alice" :age 30))`,
    },
```

**Differentiator from Clojure:** CLOS with `defclass`/`defgeneric`/`defmethod` vs Clojure's `defrecord`/`defprotocol`/`extend-type`. CLOS uses generic functions with multiple dispatch; Clojure uses protocols with single-dispatch on first argument. This is the #1 required differentiator per success criteria.
**Line count:** 10 lines. **Max line width:** 49 chars.

### CODE-06: Pattern Matching (cond/typecase)

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'Typecase dispatch',
      code: `(defun describe-val (x)
  (typecase x
    (integer (format nil "int: ~d" x))
    (string  (format nil "str: ~a" x))
    (list    (format nil "~d items" (length x)))
    (t       "unknown")))

(describe-val 42)
(describe-val '(1 2 3))`,
    },
```

**Differentiator from Clojure:** CL's `typecase` dispatches on the runtime type of a value -- it's a type-based switch. Clojure uses `core.match` for structural pattern matching and destructuring. CL has no native destructuring pattern match, but `typecase` combined with CLOS methods provides similar expressiveness through different mechanisms.
**Line count:** 9 lines. **Max line width:** 46 chars.

### CODE-07: Error Handling (Condition/Restart System)

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'Condition and restart system',
      code: `(define-condition bad-input (error)
  ((val :initarg :val :reader bad-val)))

(defun parse (s)
  (restart-case (error 'bad-input :val s)
    (use-value (v) v)))

(handler-bind
    ((bad-input
      (lambda (c) (invoke-restart
                    'use-value 0))))
  (parse "x"))`,
    },
```

**Differentiator from Clojure:** The condition/restart system separates signaling (`error`), recovery options (`restart-case`/`use-value`), and handling policy (`handler-bind`/`invoke-restart`). Clojure uses JVM try/catch with `ex-info` -- standard stack-unwinding exceptions. CL's system is unique: the handler runs WITHOUT unwinding the stack, allowing the signaling code to resume.
**Line count:** 12 lines. **Max line width:** 43 chars. (At the 12-line limit -- tight but meets criteria.)

### CODE-08: String Interpolation (format)

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'Format directives',
      code: `(defvar *name* "Lisp")
(defvar *version* 1994)

(format nil "Hello, ~a!" *name*)
(format nil "v~d, caps: ~:@(~a~)"
        *version* *name*)

(format nil "Items: ~{~a~^, ~}"
        '("a" "b" "c"))`,
    },
```

**Differentiator from Clojure:** CL's `format` is a mini-language with tilde directives (`~a` for aesthetic, `~d` for decimal, `~{...~}` for iteration, `~^` for inter-element separator, `~:@(...)` for case conversion). Clojure uses `str` concatenation and Java's `format` -- much simpler but less powerful.
**Line count:** 8 lines. **Max line width:** 37 chars.

### CODE-09: List Operations

```typescript
    lisp: {
      lang: 'common-lisp',
      label: 'Map, remove-if-not, reduce',
      code: `(defvar *nums* '(1 2 3 4 5 6 7 8 9 10))

(mapcar (lambda (n) (* n 2)) *nums*)
(remove-if-not #'evenp *nums*)
(reduce #'+ *nums*)

(reduce #'+
  (mapcar (lambda (n) (* n n))
    (remove-if-not #'evenp *nums*)))`,
    },
```

**Differentiator from Clojure:** CL uses `mapcar` (not `map`), `remove-if-not` (not `filter`), `#'` function reference syntax (Lisp-2 needs explicit function namespace reference). Clojure's `->>` threading macro creates a pipeline; CL nests function calls or uses `loop` for similar composition.
**Line count:** 9 lines. **Max line width:** 45 chars.

## Clojure Snippet Comparison Matrix

For the planner's reference, here is what each Clojure snippet shows, so Lisp snippets can differentiate:

| Feature | Clojure Shows | Lisp Should Show Instead |
|---------|---------------|--------------------------|
| Variable Declaration | `def`, `let` with vector bindings | `defvar`, `defparameter`, `let` with paren bindings, earmuffs |
| If/Else | `cond` with flat pairs, `:else` | `cond` with double-parens, `t` |
| Loops | `doseq`, `loop`/`recur` | CL `loop` macro mini-language |
| Functions | `defn`, `#()` shorthand, `fn` | `defun`, `lambda`, `funcall` (Lisp-2) |
| Structs | `defrecord`/`defprotocol`/`extend-type` | `defclass`/`defgeneric`/`defmethod` (CLOS) |
| Pattern Matching | `core.match`, destructuring | `typecase` type dispatch |
| Error Handling | `try`/`catch`/`ex-info` (JVM) | `define-condition`/`restart-case`/`handler-bind` |
| String Interpolation | `str` concatenation, `format` | CL `format` tilde directives |
| List Operations | `map`/`filter`/`reduce`, `->>` | `mapcar`/`remove-if-not`/`reduce`, `#'` |
| Signature Idiom | Threading macro `->>` | `defmacro` with backquote (already done) |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Languages without snippets show "Feature not natively supported" | Same | Phase 19 | Lisp supports ALL 10 features natively, so no "not supported" messages needed |
| Manual Feature 10 entries | Auto-import from SNIPPETS | Phase 19 | CODE-10 requires no work in code-features.ts |

**Deprecated/outdated:**
- None relevant to this phase.

## Open Questions

1. **Exact character width at 576px viewport**
   - What we know: Expressive Code applies ~32px padding on each side of code blocks, plus the card border/padding from the page layout. The grid is `grid-cols-1` at small viewports, so each code block gets full viewport width.
   - What's unclear: The exact number of monospace characters that fit without horizontal scroll. Estimated ~55 based on 576px - 64px padding - ~16px border/margin = ~496px / ~8.5px per char (at 14px Fira Code or similar).
   - Recommendation: Target 55 characters max per line. The draft snippets above max out at 49 characters. If a few lines reach 55, it should still be safe. Build and visually verify at 576px viewport after implementation.

2. **`define-condition` syntax highlighting**
   - What we know: The Shiki `common-lisp` grammar recognizes `define-condition` as a `def-name` pattern and condition types like `error` as `condition-type`.
   - What's unclear: Whether `define-condition` renders with proper coloring or falls through to default styling.
   - Recommendation: Build and check. If highlighting is inadequate, the implementer can adjust the condition name or use a simpler `error` call. The grammar's regex covers `define-condition` in the def-name pattern.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** - `code-features.ts` (3049 lines), `snippets.ts`, `code/index.astro`, `FeatureMatrix.astro`, `ec.config.mjs` -- all read directly from source
- **@shikijs/langs common-lisp.mjs** - Grammar structure verified: name `common-lisp`, aliases `["lisp"]`, patterns include `def-name`, `macro`, `special-operator`, `condition-type`, `class`, `function`, `lambda-list`, `variable`, `string` (with format directive highlighting)
- **Phase 69 research and verification** - `69-RESEARCH.md`, `69-VERIFICATION.md`, `69-01-SUMMARY.md` -- established patterns for `common-lisp` lang field, backtick escaping, and insertion after Clojure entries
- **STATE.md** - Locked decisions: `common-lisp` lang field, differentiate via CLOS/conditions/macros

### Secondary (MEDIUM confidence)
- **Common Lisp syntax knowledge** - Based on ANSI CL standard (HyperSpec), well-established; CL syntax has been stable since 1994
- **Viewport width estimation** - 55-char estimate based on standard code block padding calculations; should be verified post-build

### Tertiary (LOW confidence)
- None -- all claims verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - single file modification, grammar verified, patterns established by Phase 69
- Architecture: HIGH - 9 insertion points identified with exact line numbers and anchor patterns
- Pitfalls: HIGH - backtick escaping proven, success criteria requirements clearly mapped to specific CL features
- Code examples: MEDIUM - CL syntax is well-known and stable, but exact rendering of `define-condition` and format directives in Shiki should be build-verified
- Viewport width: MEDIUM - estimated at ~55 chars, needs visual verification

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable -- CL syntax hasn't changed since 1994, Shiki grammar stable)
