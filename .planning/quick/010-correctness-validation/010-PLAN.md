---
phase: 010-correctness-validation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/lib/og-image.ts
  - src/pages/blog/[slug].astro
  - src/lib/eda/svg-generators/contour-plot.ts
  - src/pages/open-graph/eda/[...slug].png.ts
  - src/pages/projects/index.astro
autonomous: true
requirements: [CV-01]

must_haves:
  truths:
    - "npx astro check reports 0 errors"
    - "npx astro build completes successfully (already passing, must remain so)"
  artifacts:
    - path: "src/lib/og-image.ts"
      provides: "OG image generation returning Uint8Array instead of Buffer"
    - path: "src/lib/eda/svg-generators/contour-plot.ts"
      provides: "Properly typed d3-contour usage"
  key_links:
    - from: "src/pages/open-graph/**/*.png.ts"
      to: "src/lib/og-image.ts"
      via: "generateOgImage / generateEdaPillarOgImage return type"
      pattern: "new Response\\(png"
---

<objective>
Fix all 26 TypeScript errors reported by `npx astro check` across the codebase.

Purpose: Ensure type correctness across the 950-page Astro site, preventing runtime regressions and enabling strict CI type checking.
Output: Zero-error `npx astro check` run.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/og-image.ts
@src/pages/open-graph/default.png.ts
@src/pages/open-graph/eda/[...slug].png.ts
@src/pages/blog/[slug].astro
@src/lib/eda/svg-generators/contour-plot.ts
@src/pages/projects/index.astro
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Buffer-to-Response type errors in OG image pipeline (14 errors)</name>
  <files>
    src/lib/og-image.ts
  </files>
  <action>
The root cause: `sharp().toBuffer()` returns `Buffer` but `new Response()` in modern TS/Node types expects `BodyInit` (Uint8Array, string, etc). Buffer extends Uint8Array at runtime but the type checker disagrees due to Buffer's extra properties.

Fix at the source in `src/lib/og-image.ts`: Every function that currently returns a `Buffer` from sharp should convert to `Uint8Array` before returning. Find all places where `sharp(...).toBuffer()` is called and wrap with `new Uint8Array(...)`:

```typescript
// Instead of:
return await sharp(pngBuffer).png().toBuffer();
// Use:
const buf = await sharp(pngBuffer).png().toBuffer();
return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
```

Also update any explicit `Buffer` return type annotations to `Uint8Array`.

This fixes all 14 `ts(2345)` errors in the open-graph/*.png.ts files at once, since they all consume the return value of functions from `og-image.ts`.

Additionally, update the font variables at the top of og-image.ts from `let interFont: Buffer | undefined` to use the `readFile` return type properly -- or cast to `ArrayBuffer` where satori expects it. Check what satori's `font.data` field expects (it accepts `ArrayBuffer | Buffer`) so fonts can stay as Buffer.

Do NOT modify any of the 15 open-graph/*.png.ts consumer files -- the fix should be entirely in the source og-image.ts functions.
  </action>
  <verify>
    <automated>cd /Users/patrykattc/work/git/PatrykQuantumNomad && npx astro check 2>&1 | grep -c "ts(2345)"</automated>
    Expected output: 0 (down from 14)
  </verify>
  <done>All Buffer-to-Response type errors eliminated by fixing return types at the source in og-image.ts</done>
</task>

<task type="auto">
  <name>Task 2: Fix remaining 12 TypeScript errors (d3-contour types, btn null checks, GetStaticPaths, gsap casing)</name>
  <files>
    package.json
    src/lib/eda/svg-generators/contour-plot.ts
    src/pages/blog/[slug].astro
    src/pages/open-graph/eda/[...slug].png.ts
    src/pages/projects/index.astro
  </files>
  <action>
Fix four distinct error categories:

**A. d3-contour missing types (3 errors in contour-plot.ts):**
Install the missing type package: `npm install --save-dev @types/d3-contour`
This resolves ts(7016) "Could not find a declaration file for module 'd3-contour'" and the two ts(7006) "Parameter 'c' implicitly has an 'any' type" errors that cascade from it.

**B. 'btn' possibly null (6 errors in blog/[slug].astro):**
The issue is that `btn` is narrowed by the `if (btn)` guard on line 266, but TypeScript loses that narrowing inside the nested `toggleVisibility()` function (closure over a mutable variable). Fix by adding a non-null assertion or by capturing btn in a const inside the if-block:

```typescript
if (btn) {
  const backToTopBtn = btn; // TypeScript knows this is non-null
  function toggleVisibility() {
    if (window.scrollY > 400) {
      backToTopBtn.style.opacity = '1';
      backToTopBtn.style.transform = 'translateY(0)';
      backToTopBtn.style.pointerEvents = 'auto';
    } else {
      backToTopBtn.style.opacity = '0';
      backToTopBtn.style.transform = 'translateY(1rem)';
      backToTopBtn.style.pointerEvents = 'none';
    }
  }
  // ... rest uses backToTopBtn
}
```

**C. GetStaticPaths type mismatch (1 error in eda/[...slug].png.ts):**
The ts(2322) error occurs because the return type `{ params: { slug: string }; props: OgEntry }[]` doesn't satisfy `GetStaticPaths`. The `GetStaticPaths` type expects `props` to be `Record<string, any>`. Fix by removing the explicit `GetStaticPaths` type annotation and using `satisfies` instead, OR by casting the return. The simplest fix: remove the `: GetStaticPaths` annotation and just export the async function directly (Astro infers the type):

```typescript
export const getStaticPaths = async () => {
```

Alternatively, if keeping the type annotation, ensure the returned props match by using `as const satisfies GetStaticPaths` or adding `[k: string]: unknown` to the OgEntry interface.

**D. gsap/Flip casing issue (1 error in projects/index.astro):**
The ts(1149) error is a macOS case-sensitivity issue with gsap's type declarations (Flip.d.ts vs flip.d.ts). Fix by adding a `// @ts-ignore` comment above the import line:

```typescript
// @ts-ignore - gsap Flip type casing issue on case-insensitive filesystems
import { Flip } from 'gsap/Flip';
```

This is a known gsap issue on macOS and the ts-ignore is the standard workaround. The import works correctly at runtime.
  </action>
  <verify>
    <automated>cd /Users/patrykattc/work/git/PatrykQuantumNomad && npm install --save-dev @types/d3-contour && npx astro check 2>&1 | tail -5</automated>
    Expected output: "Result (441 files): 0 errors"
  </verify>
  <done>All 26 TypeScript errors resolved. `npx astro check` reports 0 errors. `npx astro build` still completes successfully.</done>
</task>

</tasks>

<verification>
Run the full validation suite after both tasks:

1. `npx astro check` -- must report 0 errors, 0 warnings
2. `npx astro build` -- must complete successfully (950 pages)
3. Spot-check that OG images still generate correctly by verifying the build output includes `/open-graph/default.png` and `/open-graph/eda/*.png` files in the dist folder
</verification>

<success_criteria>
- `npx astro check` reports exactly 0 errors (down from 26)
- `npx astro build` completes successfully with all 950 pages
- No runtime regressions in OG image generation
- All fixes are minimal and targeted (no unnecessary refactoring)
</success_criteria>

<output>
After completion, create `.planning/quick/010-correctness-validation/010-SUMMARY.md`
</output>
