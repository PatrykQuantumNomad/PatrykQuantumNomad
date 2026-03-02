# Stack Research

**Domain:** Adding Lisp (Common Lisp/Scheme family) as 26th language to the Beauty Index
**Researched:** 2026-03-01
**Confidence:** HIGH

## Verdict: No New Dependencies Required

Adding Lisp requires **zero npm installs** and **zero config changes**. Every technology needed is already present in the project. This is a pure data-addition task.

## Shiki Language Support (Verified)

Shiki 3.22.0 (installed via `astro-expressive-code@0.41.6`) ships bundled grammars for all Lisp-family languages:

| Shiki Language ID | Display Name | File Extensions | Aliases |
|-------------------|-------------|-----------------|---------|
| `common-lisp` | Common Lisp | `.lisp`, `.lsp`, `.l`, `.cl`, `.asd`, `.asdf` | `lisp` |
| `scheme` | Scheme | `.scm`, `.ss`, `.sch`, `.rkt` | (none) |
| `clojure` | Clojure | (already in use) | (already entry #10) |
| `racket` | Racket | `.rkt` | (available if needed) |
| `emacs-lisp` | Emacs Lisp | (available) | `elisp` |
| `lisp` | (alias) | -- | Re-exports `common-lisp` |

**Verification method:** Direct inspection of `node_modules/@shikijs/langs/dist/` and `node_modules/shiki/dist/langs/` confirmed all grammars are bundled. Node.js module loading confirmed `bundledLanguages['common-lisp']`, `bundledLanguages['lisp']`, and `bundledLanguages['scheme']` all resolve correctly. The `lisp.mjs` file is a re-export of `common-lisp.mjs`.

### Recommended Shiki Language ID: `common-lisp`

Use `common-lisp` (not `lisp`, not `scheme`) for the `lang` field in `snippets.ts` and `code-features.ts` entries. Rationale:

1. **Primary, not alias.** `common-lisp` is the grammar's canonical `name` field. `lisp` is a convenience alias that re-exports it. Using the primary name avoids confusion and matches how the grammar identifies itself internally.

2. **The entry covers Common Lisp/Scheme as a family.** The Common Lisp grammar provides richer highlighting than the Scheme grammar (supports CLOS classes, condition types, format strings, package qualifiers, `defmacro`/`defgeneric`/`defmethod`, lambda lists, reader macros). Most "iconic Lisp" code snippets will look better with Common Lisp highlighting.

3. **Consistency with existing pattern.** The Clojure entry uses `lang: 'clojure'` (its canonical Shiki name). Following the same pattern means using `common-lisp`.

4. **Scheme snippets also highlight acceptably under `common-lisp`.** S-expression syntax, `define`, `lambda`, `let`, `cond` -- all shared forms highlight correctly in either grammar. If a specific Scheme-only snippet is needed in `code-features.ts`, that individual snippet can use `lang: 'scheme'` since `astro-expressive-code` resolves per-block.

### Alternative: Per-Snippet Switching

For `code-features.ts` entries, if some feature snippets are written in Scheme dialect while others use Common Lisp dialect, each snippet's `lang` field can be set independently:

```typescript
// Common Lisp snippet
clSnippet: { lang: 'common-lisp', label: '...', code: '...' }

// Scheme snippet for the same language entry
schemeSnippet: { lang: 'scheme', label: '...', code: '...' }
```

Both will resolve at build time without any configuration. However, **for simplicity and consistency, prefer writing all snippets in Common Lisp style and using `common-lisp` throughout.**

## Existing Stack (No Changes Needed)

### Core Technologies (Already Installed)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Astro | 5.17.1 | Static site generator | No change |
| astro-expressive-code | 0.41.6 | Syntax highlighting (wraps Shiki) | No change |
| Shiki | 3.22.0 | TextMate grammar engine | No change, `common-lisp` grammar bundled |
| Zod | (via Astro) | Schema validation for `languages.json` | No change |

### Data Files to Update (Not Stack Changes)

| File | Change | Type |
|------|--------|------|
| `src/data/beauty-index/languages.json` | Add Lisp entry object | Data |
| `src/data/beauty-index/snippets.ts` | Add `lisp` key with `lang: 'common-lisp'` | Data |
| `src/data/beauty-index/code-features.ts` | Add `lisp` entries to all 10 features | Data |
| `src/data/beauty-index/justifications.ts` | Add `lisp` justification entries | Data |

Note: The language ID in data files should be `lisp` (the slug used in URLs like `/beauty-index/lisp/`), while the Shiki language identifier in the `lang` field should be `common-lisp`.

### Build Pipeline (No Changes)

| Step | How It Works | Impact of Adding Lisp |
|------|-------------|----------------------|
| Content collection | `file()` loader reads `languages.json`, validates with Zod | One more entry validated |
| Static paths | `getStaticPaths()` generates `/beauty-index/[slug]/` | One more page at `/beauty-index/lisp/` |
| Radar chart SVG | `radar-math.ts` computes at build time | One more SVG generated |
| OG image | Satori + Sharp at `/open-graph/beauty-index/[slug].png` | One more OG image |
| Syntax highlighting | `<Code>` component from `astro-expressive-code` | Resolves `common-lisp` from bundled Shiki grammars |
| VS comparison pages | `[slug].astro` in `/beauty-index/vs/` | ~50 new comparison pages (lisp-vs-X, X-vs-lisp) |

## Installation

```bash
# No installation needed. Zero new dependencies.
```

## Alternatives Considered

| Decision | Chosen | Alternative | Why Not Alternative |
|----------|--------|-------------|---------------------|
| Shiki lang ID | `common-lisp` | `lisp` (alias) | `lisp` is a re-export alias. Use the canonical name for clarity. |
| Shiki lang ID | `common-lisp` | `scheme` | Scheme grammar is simpler (fewer token types). Common Lisp grammar highlights more constructs (CLOS, conditions, format strings). |
| Data ID / URL slug | `lisp` | `common-lisp` | Other entries use short slugs (`csharp` not `c-sharp`, `cpp` not `cplusplus`). `lisp` is the natural short form and differentiates from the existing `clojure` entry. |

## What NOT to Do

| Avoid | Why | Do Instead |
|-------|-----|------------|
| Adding `shiki` as a direct dependency | Already installed transitively via `astro-expressive-code` | Use existing `<Code>` component |
| Configuring Shiki languages in `astro.config.mjs` | `common-lisp` and `scheme` are bundled by default in Shiki 3.x; no explicit registration needed | Just use the language ID in `<Code lang="common-lisp">` |
| Using `lang: 'lisp'` in snippet data | While it works (alias), it obscures which grammar is actually being used | Use `lang: 'common-lisp'` explicitly |
| Creating a custom TextMate grammar | Shiki already bundles comprehensive Common Lisp and Scheme grammars | Use bundled grammars |
| Adding `@shikijs/langs` directly | Languages are loaded on-demand from the bundled set by Shiki's core | No additional package needed |

## Version Compatibility

| Package | Version | Common Lisp Support | Notes |
|---------|---------|---------------------|-------|
| shiki@3.22.0 | 3.22.0 | Bundled | `common-lisp`, `scheme`, `lisp` (alias) all available |
| astro-expressive-code@0.41.6 | 0.41.6 | Via Shiki | Uses `@expressive-code/plugin-shiki` which delegates to Shiki |
| astro@5.17.1 | 5.17.1 | Via expressive-code | No direct Shiki config needed |

## Common Lisp Grammar Coverage

The bundled `common-lisp` TextMate grammar provides highlighting for:

- **Special operators:** `block`, `catch`, `let`, `let*`, `if`, `progn`, `quote`, `function`, etc.
- **Macros:** `defun`, `defmacro`, `defclass`, `defmethod`, `defgeneric`, `loop`, `cond`, `when`, `unless`, etc.
- **CLOS:** Classes, methods, generic functions, method combinations
- **Type system:** Built-in types, condition types, type specifiers
- **Constants:** `t`, `nil`, `pi`, numeric constants
- **Lambda lists:** `&optional`, `&key`, `&rest`, `&body`, `&whole`, etc.
- **Accessor functions:** `car`, `cdr`, `caar`-`cddddr`, `aref`, `gethash`, etc.
- **Strings:** Including `format` directive highlighting (`~A`, `~D`, `~{...~}`, etc.)
- **Reader macros:** `#'`, `#\`, `#|...|#`, `'`, backtick/unquote
- **Package qualifiers:** `package:symbol`, `package::symbol`
- **Style conventions:** `*earmuffs*` for specials, `+constants+`

This is comprehensive enough for all Beauty Index snippet categories (variable declaration, control flow, pattern matching, error handling, etc.).

## Sources

- Shiki bundled languages: Direct inspection of `node_modules/@shikijs/langs/dist/common-lisp.mjs` (grammar name: `common-lisp`, scope: `source.commonlisp`)
- Shiki bundled languages: Direct inspection of `node_modules/@shikijs/langs/dist/scheme.mjs` (grammar name: `scheme`, scope: `source.scheme`)
- Shiki bundled languages: Direct inspection of `node_modules/@shikijs/langs/dist/lisp.mjs` (re-export of `common-lisp.mjs`)
- Shiki version: `npm ls shiki` confirmed 3.22.0 installed via `astro-expressive-code` dependency chain
- Existing codebase: `astro.config.mjs`, `snippets.ts`, `code-features.ts`, `[slug].astro`, `code/index.astro` -- confirmed `<Code>` component from `astro-expressive-code` is used for all syntax highlighting with per-block `lang` attribute

---
*Stack research for: Adding Lisp to the Beauty Index*
*Researched: 2026-03-01*
