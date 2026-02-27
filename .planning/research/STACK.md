# Stack Research: EDA Graphical Techniques NIST Parity

**Domain:** Expanding 29 existing EDA graphical technique pages to full NIST/SEMATECH section depth with Python code examples, KaTeX formulas, and expanded prose content
**Researched:** 2026-02-27
**Confidence:** HIGH

## Executive Summary

Zero new npm packages are required. Every capability needed -- Python syntax highlighting, KaTeX formula rendering, expanded content fields -- already exists in the codebase and is proven on the quantitative technique pages and distribution pages. The work is a TypeScript interface expansion in `technique-content.ts`, a template update in `[slug].astro`, and content authoring for 29 techniques. The quantitative page `[slug].astro` serves as the exact blueprint: it imports `Code` from `astro-expressive-code/components`, calls `katex.renderToString()` at build time, and renders both formula and code slots that already exist in TechniquePage.astro.

## Existing Stack (Zero New npm Dependencies)

Every technology needed is already installed, configured, and proven in production on other page types.

### Python Code Rendering -- Already Solved

| Component | Version | Location | How It Works |
|-----------|---------|----------|--------------|
| `astro-expressive-code` | 0.41.6 | `package.json` dependency | Astro integration for syntax highlighting with themes, line numbers, copy button |
| `Code` component | (part of above) | `import { Code } from 'astro-expressive-code/components'` | Build-time syntax highlighting -- zero JS shipped to client |
| TechniquePage `code` slot | -- | `src/components/eda/TechniquePage.astro` line 57 | Named slot already exists, ready for `<Fragment slot="code">` |

**Proven pattern** in `src/pages/eda/quantitative/[slug].astro` lines 100-107:
```astro
{content?.pythonCode && (
  <Fragment slot="code">
    <section class="prose-section mt-8">
      <h2 class="text-xl font-heading font-bold mb-3">Python Example</h2>
      <Code code={content.pythonCode} lang="python" />
    </section>
  </Fragment>
)}
```

This exact pattern copies directly into `src/pages/eda/techniques/[slug].astro`. No modifications to `Code` component, no new configuration, no new CSS.

### KaTeX Formula Rendering -- Already Solved

| Component | Version | Source | How It Works |
|-----------|---------|--------|--------------|
| `katex` | 0.16.33 | Transitive dependency of `rehype-katex@^7.0.1` | Programmatic API via `import katex from 'katex'` |
| `katex.renderToString()` | (part of above) | Called in Astro frontmatter at build time | Produces static HTML+CSS, zero client JS |
| `katex.min.css` | (part of above) | `/public/styles/katex.min.css` | Loaded conditionally via `useKatex` prop |
| TechniquePage `useKatex` prop | -- | `src/components/eda/TechniquePage.astro` line 14 | Already wired to EDALayout for conditional CSS loading |
| TechniquePage `formula` slot | -- | `src/components/eda/TechniquePage.astro` line 56 | Named slot already exists, ready for formula content |
| `InlineMath.astro` | -- | `src/components/eda/InlineMath.astro` | Renders inline KaTeX within prose text at build time |

**Proven pattern** in `src/pages/eda/quantitative/[slug].astro` lines 43-47 and 85-98:
```astro
// Frontmatter: pre-render at build time
const renderedFormulas = content?.formulas.map(f => ({
  ...f,
  html: katex.renderToString(f.tex, { displayMode: true, throwOnError: false }),
})) ?? [];

// Template: render into formula slot
{renderedFormulas.length > 0 && (
  <Fragment slot="formula">
    <section class="prose-section mt-8 space-y-6">
      <h2 class="text-xl font-heading font-bold mb-3">Formulas</h2>
      {renderedFormulas.map(f => (
        <div class="formula-block mb-6">
          <h3 class="text-lg font-semibold mb-2">{f.label}</h3>
          <div class="katex-display-wrapper my-4 overflow-x-auto" set:html={f.html} />
          <p class="text-[var(--color-text-secondary)]">{f.explanation}</p>
        </div>
      ))}
    </section>
  </Fragment>
)}
```

**Important:** `katex` is NOT listed as a direct dependency in `package.json`. It is resolved as a dependency of `rehype-katex@^7.0.1`. This works because npm hoists it to `node_modules/katex/`. This is the existing pattern used by three files (`InlineMath.astro`, `distributions/[slug].astro`, `quantitative/[slug].astro`). Adding it as a direct dependency is optional but recommended for explicitness -- see Recommendations below.

### TechniqueContent Interface Expansion -- Pure TypeScript

The current `TechniqueContent` interface in `src/lib/eda/technique-content.ts` has 5 fields:

```typescript
export interface TechniqueContent {
  definition: string;    // "What It Is"
  purpose: string;       // "When to Use It"
  interpretation: string; // "How to Interpret"
  assumptions: string;   // "Assumptions and Limitations"
  nistReference: string;  // NIST section reference
}
```

Expanding this requires zero dependencies. It is a TypeScript interface change plus content authoring.

## Recommended Stack Changes

### 1. Expand TechniqueContent Interface

Add new optional fields to avoid breaking existing content while enabling incremental enrichment:

```typescript
export interface TechniqueContent {
  // Existing fields (unchanged)
  definition: string;
  purpose: string;
  interpretation: string;
  assumptions: string;
  nistReference: string;

  // NEW: Key questions this technique answers (NIST "Questions" section)
  questions?: string[];

  // NEW: Why this technique matters in practice
  importance?: string;

  // NEW: Worked example narrative (dataset description + walkthrough)
  examples?: Array<{
    title: string;
    description: string;
  }>;

  // NEW: Links to related EDA case studies
  caseStudies?: Array<{
    slug: string;
    relevance: string;
  }>;

  // NEW: KaTeX formulas (same structure as QuantitativeContent)
  formulas?: Array<{
    label: string;
    tex: string;
    explanation: string;
  }>;

  // NEW: Python code example
  pythonCode?: string;
}
```

**Why optional fields:** 29 techniques already have content for the 5 existing fields. Making new fields optional means existing content continues to compile and render unchanged. Techniques can be enriched incrementally -- one at a time, across multiple phases if needed.

**Why match QuantitativeContent's formula structure:** The `formulas` array with `{ label, tex, explanation }` is identical to the proven `QuantitativeContent` interface. Using the same shape means the same rendering logic works in both page templates. Code review is simpler when patterns are consistent.

### 2. Update Graphical Technique Page Template

`src/pages/eda/techniques/[slug].astro` needs these additions (modeled after `quantitative/[slug].astro`):

```astro
---
import { Code } from 'astro-expressive-code/components';
import katex from 'katex';
// ... existing imports

const content = getTechniqueContent(technique.slug);

// Pre-render KaTeX formulas at build time
const renderedFormulas = content?.formulas?.map(f => ({
  ...f,
  html: katex.renderToString(f.tex, { displayMode: true, throwOnError: false }),
})) ?? [];

const hasFormulas = renderedFormulas.length > 0;
---

<TechniquePage
  title={technique.title}
  description={technique.description}
  category="Graphical Techniques"
  nistSection={technique.nistSection}
  slug={technique.slug}
  relatedTechniques={relatedTechniques}
  useKatex={hasFormulas}
>
  {/* ... existing plot slot ... */}
  {/* ... existing description slot (expanded with new sections) ... */}

  {hasFormulas && (
    <Fragment slot="formula">
      {/* Same rendering as quantitative/[slug].astro */}
    </Fragment>
  )}

  {content?.pythonCode && (
    <Fragment slot="code">
      <section class="prose-section mt-8">
        <h2 class="text-xl font-heading font-bold mb-3">Python Example</h2>
        <Code code={content.pythonCode} lang="python" />
      </section>
    </Fragment>
  )}
</TechniquePage>
```

### 3. Expand Description Slot Rendering

The existing description slot renders 4 sections. Expand to include new fields:

```astro
<Fragment slot="description">
  <section class="prose-section mt-8 space-y-6">
    {/* Existing: What It Is, When to Use It, How to Interpret, Assumptions */}

    {content.questions && content.questions.length > 0 && (
      <div>
        <h2 class="text-xl font-heading font-bold mb-3">Questions Answered</h2>
        <ul class="list-disc pl-6 space-y-1 text-[var(--color-text-secondary)]">
          {content.questions.map(q => <li>{q}</li>)}
        </ul>
      </div>
    )}

    {content.importance && (
      <div>
        <h2 class="text-xl font-heading font-bold mb-3">Why It Matters</h2>
        <p class="text-[var(--color-text-secondary)] leading-relaxed">{content.importance}</p>
      </div>
    )}

    {content.examples && content.examples.length > 0 && (
      <div>
        <h2 class="text-xl font-heading font-bold mb-3">Worked Examples</h2>
        {content.examples.map(ex => (
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-1">{ex.title}</h3>
            <p class="text-[var(--color-text-secondary)] leading-relaxed">{ex.description}</p>
          </div>
        ))}
      </div>
    )}

    {content.caseStudies && content.caseStudies.length > 0 && (
      <div>
        <h2 class="text-xl font-heading font-bold mb-3">Related Case Studies</h2>
        {/* Render links to case study pages */}
      </div>
    )}
  </section>
</Fragment>
```

## What Already Exists and Must NOT Be Re-Added

| Technology | Status | Do NOT |
|------------|--------|--------|
| `astro-expressive-code@0.41.6` | Installed, configured in Astro config | Do not add a second syntax highlighter (Shiki, Prism, highlight.js) |
| `katex@0.16.33` | Installed as dep of rehype-katex | Do not add MathJax or any other math renderer |
| `rehype-katex@^7.0.1` | Installed, configured for MDX pipeline | Do not reconfigure; it handles MDX math, while `katex.renderToString()` handles Astro components |
| `remark-math@^6.0.0` | Installed, configured for MDX pipeline | Do not add remark-directive or other MDX plugins |
| TechniquePage.astro slots (`plot`, `description`, `formula`, `code`, `interpretation`) | All 5 named slots exist | Do not add new slots; use existing ones |
| `InlineMath.astro` | Build-time inline KaTeX component | Do not create a duplicate inline math component |
| `/public/styles/katex.min.css` | KaTeX stylesheet served from public dir | Do not CDN-link katex CSS; it is already self-hosted |

## What NOT to Add

### No New npm Packages

| Tempting Addition | Why NOT | Use Instead |
|-------------------|---------|-------------|
| `katex` as direct dependency | Already resolved via rehype-katex. Adding it creates version conflict risk if rehype-katex upgrades. Three existing files import it successfully. | Continue using transitive dep. Optionally add as direct dep at same version (0.16.33) for explicitness. |
| `shiki` or `prism` for Python highlighting | astro-expressive-code already provides this with theme support, line numbers, copy button, title bars | `import { Code } from 'astro-expressive-code/components'` |
| `mdx-js/mdx` for technique content | Technique content is in TypeScript objects, not MDX files. Converting to MDX would require migrating 29 content entries and changing the rendering pipeline. | Keep TypeScript content objects; render formulas with `katex.renderToString()` at build time |
| `marked` or `remark` for rendering markdown in TS strings | Content fields are plain strings rendered as `<p>` text. Adding markdown parsing adds complexity for marginal formatting gains. | Use plain strings for paragraphs. Use `set:html` with manually crafted HTML only if needed for inline formatting. |
| Any React math component | KaTeX build-time rendering produces static HTML. No hydration needed. Adding a React math component ships unnecessary JS. | `katex.renderToString()` in Astro frontmatter |

### No Architecture Changes

| Tempting Refactor | Why NOT | Impact |
|-------------------|---------|--------|
| Convert technique-content.ts to MDX files | Would require 29 new MDX files, a new content collection, different rendering pipeline, and lose the type-safe interface. Current TS objects are simpler and faster to build. | High risk, zero benefit for this milestone |
| Create shared `TechniqueFormulas.astro` component | Only 2-3 lines of rendering logic (map + set:html). Extracting to a component adds a file and an import for trivial code. | Over-abstraction |
| Add client-side formula rendering | All formulas are static (they never change based on user input). Build-time rendering is faster, smaller, and more accessible. | Ships unnecessary JS |
| Merge graphical and quantitative page templates | The two templates share TechniquePage.astro layout but differ in content source (technique-content.ts vs quantitative-content.ts) and plot rendering (SVG generators vs none). Merging adds complexity. | Unnecessary coupling |

## Recommended Optional Improvement

### Add `katex` as Direct Dependency

Currently `katex` is a transitive dependency of `rehype-katex`. Three source files import it directly (`import katex from 'katex'`). Adding it as a direct dependency makes this explicit and protects against breakage if `rehype-katex` ever changes its dependency structure.

```bash
npm install katex@^0.16.33
```

**Priority:** Low. This is a hygiene improvement, not a blocker. The current setup works and has been stable across multiple milestones.

## Version Compatibility

No new packages means no new compatibility concerns. All versions verified from `node_modules`:

| Package | Installed Version | Relevance to This Milestone |
|---------|-------------------|---------------------------|
| `astro-expressive-code` | 0.41.6 | `Code` component for Python examples on graphical pages |
| `katex` | 0.16.33 (via rehype-katex) | `katex.renderToString()` for build-time formula rendering |
| `rehype-katex` | ^7.0.1 | Peer dependency that provides katex; no changes needed |
| `typescript` | ^5.9.3 | TechniqueContent interface expansion; no version sensitivity |
| `astro` | ^5.3.0 | Named slots, `set:html`, static paths; all features used by existing pages |

## Integration Points Summary

The graphical technique page template (`[slug].astro`) needs exactly 3 additions:

| Addition | Import | Existing Proof |
|----------|--------|----------------|
| `Code` component | `import { Code } from 'astro-expressive-code/components'` | Used in `quantitative/[slug].astro`, `beauty-index/[slug].astro` |
| `katex` API | `import katex from 'katex'` | Used in `quantitative/[slug].astro`, `distributions/[slug].astro`, `InlineMath.astro` |
| `useKatex={true}` prop | Already a TechniquePage prop | Used in `quantitative/[slug].astro` |

All three are single-line additions to an existing file, using proven imports from the same codebase.

## Estimated Scope of Changes

| File | Change Type | Estimated Lines | Notes |
|------|-------------|----------------|-------|
| `src/lib/eda/technique-content.ts` | Expand interface + 29 content entries | +2000-3000 | New fields for all 29 techniques (questions, importance, examples, caseStudies, formulas, pythonCode) |
| `src/pages/eda/techniques/[slug].astro` | Add imports + formula/code rendering | +25-35 | Copy pattern from quantitative/[slug].astro |
| `src/components/eda/TechniquePage.astro` | No changes needed | 0 | All required slots already exist |
| `src/layouts/EDALayout.astro` | No changes needed | 0 | useKatex conditional loading already works |

## Sources

- Existing codebase: `src/pages/eda/quantitative/[slug].astro` -- Proven pattern for Code + KaTeX on technique pages. 108 lines. Imports `Code` from astro-expressive-code and `katex` for build-time rendering. HIGH confidence.
- Existing codebase: `src/lib/eda/quantitative-content.ts` -- `QuantitativeContent` interface with `formulas` and `pythonCode` fields. Exact model for expanded `TechniqueContent`. HIGH confidence.
- Existing codebase: `src/lib/eda/technique-content.ts` -- Current 5-field `TechniqueContent` interface, 29 entries keyed by slug. HIGH confidence.
- Existing codebase: `src/pages/eda/techniques/[slug].astro` -- Current graphical page template, 87 lines. Uses TechniquePage with `plot` and `description` slots. HIGH confidence.
- Existing codebase: `src/components/eda/TechniquePage.astro` -- Layout component with 5 named slots (plot, description, formula, code, interpretation). `useKatex` prop already wired. HIGH confidence.
- Existing codebase: `src/components/eda/InlineMath.astro` -- Build-time inline KaTeX component. Available for use in expanded description content if needed. HIGH confidence.
- Existing codebase: `package.json` -- astro-expressive-code@^0.41.6, rehype-katex@^7.0.1 confirmed installed. HIGH confidence.
- Installed `node_modules/katex/package.json` -- Version 0.16.33 confirmed. HIGH confidence.
- Installed `node_modules/astro-expressive-code/package.json` -- Version 0.41.6 confirmed. HIGH confidence.

---
*Stack research for: EDA Graphical Techniques NIST Parity*
*Researched: 2026-02-27*
