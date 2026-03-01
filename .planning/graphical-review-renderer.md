# Technique Page Rendering Pipeline Review

Review of the rendering pipeline that transforms technique data into rendered HTML pages.

---

## 1. technique-renderer.ts (SVG Rendering Engine)

**File:** `src/lib/eda/technique-renderer.ts`

### Architecture

The file maps 29 graphical technique slugs to SVG generation functions:
- 18 techniques use direct generator calls (e.g., `generateHistogram`, `generateScatterPlot`)
- 11 techniques use composition via `stripSvgWrapper` + `<g transform>` to build multi-panel layouts
- 6 Tier B techniques have variant arrays with distinct statistical patterns

### Findings

**No critical bugs found.** The renderer is well-structured and correctly implements the SVG generation pipeline.

1. **stripSvgWrapper() is correct** (lines 56-60): Properly strips `<svg>` tags using regex, leaving inner content for `<g>` composition. This is safe because all SVG generators produce consistent wrapper formats.

2. **seededRandom() is correct** (lines 63-69): Uses a standard LCG (Lehmer) PRNG with modulus 2^31-1, producing deterministic sequences for reproducible variant data. Build-time reproducibility is guaranteed.

3. **Composition functions are structurally sound:** All 11 composition functions (composeBootstrapPlot, composeBoxCoxLinearity, composeBoxCoxNormality, composeComplexDemodulation, composeYoudenPlot, composeLinearPlots, composeDoePlots, composeScatterplotMatrix, composeConditioningPlot) follow the same pattern: generate sub-panels, strip wrappers, compose into a single SVG with `<g transform>`.

4. **Public API is clean** (lines 1574-1588): `renderTechniquePlot()` returns empty string for unknown slugs. `renderVariants()` returns empty array for non-variant techniques. Both are defensive and handle missing data gracefully.

### Minor Observations

- **composeYoudenPlot median calculation** (lines 522-523): Hardcodes indices 9 and 10 for the median of 20 data points. This is correct for n=20 but would break if the data size changed. Not a bug since the data is generated in the same function.

- **`defaultLabel` prop on PlotVariantSwap** (line 15 of PlotVariantSwap.astro): Declared in the interface but never destructured or used. The component always defaults to showing the first variant (index 0). Dead code.

- **Box-Cox Linearity polyline overlay** (lines 231-242): Manually replicates the scatter plot's coordinate scaling to overlay a connecting line. This is fragile if the scatter plot's margin/padding logic changes, but it works correctly with the current implementation.

---

## 2. TechniquePage.astro (Layout Component)

**File:** `src/components/eda/TechniquePage.astro`

### Findings

**Component is correct and well-structured.**

1. **Slot ordering is logical:** plot -> description -> formula -> code -> interpretation. This follows the pedagogical flow: see the visualization first, then learn what it is, then see the math, then see code.

2. **Unused `interpretation` slot** (line 59): The layout defines `<slot name="interpretation" />` but no consumer ever fills it. All interpretation content is rendered within the `description` slot in `[slug].astro`. This is dead code -- the slot renders nothing. **Not a bug** since Astro silently ignores unfilled slots, but it could be removed to avoid confusion.

3. **Breadcrumb and structured data are correct:** BreadcrumbJsonLd and EDAJsonLd receive correct URLs. The `categoryHrefMap` correctly maps 'distributions' and 'graphical-techniques' to their respective URLs.

4. **OG image path construction** (line 34): Correctly maps category slugs to OG path segments. Falls back to `categorySlug` for unmapped categories, which is reasonable.

5. **Related techniques rendering** (lines 62-74): Correctly conditional on `relatedTechniques.length > 0`. Links use chip/pill styling consistent with the design system.

6. **useKatex prop** (line 14/17): Properly passed through to EDALayout, which presumably loads KaTeX CSS only when needed. This is correct for performance.

---

## 3. PlotVariantSwap.astro (Tab Switching Component)

**File:** `src/components/eda/PlotVariantSwap.astro`

### Findings

**Component works correctly.**

1. **Build-time rendering with client-side switching:** All SVG variants are rendered at build time in hidden `<div>` panels. Only the first variant is visible by default. JavaScript toggles `hidden` class. This is the correct pattern for an SSG site -- no client-side rendering cost.

2. **Unique component IDs** (line 20): Uses `Math.random()` to generate component IDs. This is fine at build time (Astro renders server-side), though it means IDs are not deterministic across builds. No functional issue.

3. **Accessibility is good:** Uses `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, and `aria-controls` attributes correctly. `aria-label` on panels includes the technique title and variant label.

4. **View Transitions support** (line 117): Re-initializes on `astro:page-load` event, correctly handling Astro View Transitions.

5. **Guard against double-init** (line 85): Uses `data-pvs-init` attribute to prevent duplicate event listener registration.

6. **Dead prop: `defaultLabel`** (line 15): Declared in the Props interface but never destructured from `Astro.props` and never used. The component always treats index 0 as the default. Should be removed.

---

## 4. [slug].astro (Dynamic Route)

**File:** `src/pages/eda/techniques/[slug].astro`

### Findings

**Route logic is correct and robust.**

1. **getStaticPaths() correctly filters graphical techniques** (lines 19-21): Only generates pages for `category === 'graphical'`, which is correct.

2. **Case study cross-linking** (lines 24-39): Resolves case study pages and maps slugs to titles and URLs. Uses `caseStudySlugs` from the content module. The `.filter(slug => caseStudyMap.has(slug))` guard (line 34) correctly handles references to non-existent case studies without crashing.

3. **Related techniques resolution** (lines 46-55): Filters related technique slugs against the full technique map, preventing broken links to techniques that don't exist.

4. **Tier B variant handling** (lines 64-65): Correctly checks `technique.tier === 'B'` before calling `renderVariants()`. For Tier A techniques, `variants` is an empty array and the non-variant plot path is taken.

5. **KaTeX detection** (lines 80-85): Scans content fields for `$` delimiters to determine if KaTeX CSS is needed. The check covers definition, definitionExpanded, importance, purpose, interpretation, assumptions, and example descriptions. This is thorough.

6. **renderInlineMath()** (lines 68-72): Uses a simple `$...$` regex to replace inline math with KaTeX HTML. This is correct for the content format used. The regex `\$([^$]+)\$` prevents matching across multiple dollar signs.

7. **Section ordering matches pedagogical flow:** What It Is -> Questions -> Why It Matters -> When to Use It -> How to Interpret -> Examples -> Assumptions -> See It In Action -> Reference. This follows a logical learning sequence.

8. **Edge case -- technique with no content** (line 105): The entire description fragment is wrapped in `{content && (...)}`, so techniques without content entries gracefully show only the plot. This is correct defensive coding.

9. **Edge case -- technique with no formulas** (line 79): `renderedFormulas` defaults to `[]` via nullish coalescing, and the formula section is conditional on `renderedFormulas.length > 0`.

10. **Edge case -- technique with no Python code** (line 212): Conditional on `content?.pythonCode`, so no empty code block is rendered.

### Minor Issue

- **Missing `hasInlineMath` check on `assumptions` field** (line 83): The `hasInlineMath` detection array includes `content?.definition`, `content?.definitionExpanded`, `content?.importance`, `content?.purpose`, `content?.interpretation`, and example descriptions, but does NOT include `content?.assumptions` or `content?.questions`. Since the `assumptions` field is rendered with `renderInlineMath()` (line 168) and questions are rendered with `renderInlineMath()` (line 127), inline math in those fields would render correctly (KaTeX runtime parses fine without the CSS if it's already loaded for other reasons). However, if a technique had inline math ONLY in its assumptions or questions and nowhere else, `needsKatex` would be false and KaTeX CSS would not load, causing broken rendering. **Low severity** -- in practice, techniques with math in assumptions/questions also have math in other fields or formulas.

---

## 5. InlineMath.astro (Math Rendering Component)

**File:** `src/components/eda/InlineMath.astro`

### Findings

**Component is correct and minimal.**

1. **Build-time KaTeX rendering** (line 14): Calls `katex.renderToString()` at build time, producing static HTML. No client-side JavaScript needed.

2. **`throwOnError: false`** (line 14): Gracefully renders error output instead of crashing on malformed LaTeX. This is the correct setting for production.

3. **`display` prop** (line 13): Defaults to `false` (inline mode). When `true`, renders display-mode math. This correctly supports both `<InlineMath tex="..." />` and `<InlineMath tex="..." display />` usage in MDX.

4. **Component is used in MDX pages** (as indicated by the JSDoc usage example), not in the technique page pipeline directly. The technique pages use `renderInlineMath()` function in `[slug].astro` for inline math processing. Both approaches produce the same KaTeX HTML.

---

## 6. types.ts (Type Definitions)

**File:** `src/lib/eda/technique-content/types.ts`

### Findings

**Type definitions are correct and complete.**

1. **Required fields** (lines 12-20): `definition`, `purpose`, `interpretation`, `assumptions`, `nistReference` -- all five are required and used in the `[slug].astro` template (always rendered without conditional checks).

2. **Optional fields** (lines 24-61): `questions`, `importance`, `definitionExpanded`, `formulas`, `pythonCode`, `caseStudySlugs`, `anatomyDiagram`, `examples` -- all properly marked with `?` and conditionally rendered in `[slug].astro`.

3. **Field-to-template mapping is complete:** Every field in the interface is consumed by the rendering template. No orphaned fields exist.

4. **Formula type** (lines 34-41): `label`, `tex`, `explanation` are all required within the formula array. The renderer correctly uses `katex.renderToString(f.tex, { displayMode: true })` for the formula and `renderInlineMath(f.explanation)` for the explanation.

5. **Example type** (lines 53-60): `label` and `description` are required; `variantLabel` is optional. The `variantLabel` field is defined but not currently used by the technique page template. It exists as metadata for variant mapping but is not rendered.

---

## Summary

| Component | Status | Issues Found |
|-----------|--------|--------------|
| technique-renderer.ts | PASS | No bugs. Clean architecture. |
| TechniquePage.astro | PASS | Unused `interpretation` slot (dead code). |
| PlotVariantSwap.astro | PASS | Unused `defaultLabel` prop (dead code). |
| [slug].astro | PASS | Minor: `hasInlineMath` check missing `assumptions` and `questions` fields. |
| InlineMath.astro | PASS | No issues. |
| types.ts | PASS | `variantLabel` field unused by template (metadata only). |

### Severity Assessment

- **Critical bugs:** None
- **Data accuracy issues:** None
- **Dead code:** 2 items (unused slot, unused prop)
- **Low-severity gaps:** 1 (incomplete `hasInlineMath` field scan)
