# Architecture Patterns

**Domain:** EDA Graphical Techniques NIST Parity -- extending 29 graphical technique pages with full NIST section depth
**Researched:** 2026-02-27
**Confidence:** HIGH (based on direct codebase analysis of all current files and NIST source structure verification)

## Current Architecture Inventory

### What Exists Today

| Component | File | Role |
|---|---|---|
| `TechniqueContent` interface | `src/lib/eda/technique-content.ts` | 5 string fields: definition, purpose, interpretation, assumptions, nistReference |
| `TECHNIQUE_CONTENT` record | `src/lib/eda/technique-content.ts` | 29 entries, one per graphical technique |
| `getTechniqueContent()` | `src/lib/eda/technique-content.ts` | Lookup by slug, returns `TechniqueContent \| undefined` |
| `[slug].astro` | `src/pages/eda/techniques/[slug].astro` | Dynamic route, renders SVG plot + prose into TechniquePage slots |
| `TechniquePage.astro` | `src/components/eda/TechniquePage.astro` | Layout component with 5 named slots: plot, description, formula, code, interpretation |
| `technique-renderer.ts` | `src/lib/eda/technique-renderer.ts` | SVG rendering: `renderTechniquePlot()` and `renderVariants()` |
| `QuantitativeContent` interface | `src/lib/eda/quantitative-content.ts` | Extended interface with formulas array and optional pythonCode |
| `[slug].astro` (quantitative) | `src/pages/eda/quantitative/[slug].astro` | Pattern to follow -- uses formula slot with KaTeX, code slot with expressive-code |

### Current Graphical Technique Page Structure

The `[slug].astro` route currently renders:

```
Header (title + NIST section)
  slot:plot       -> SVG chart (or PlotVariantSwap for Tier B)
  slot:description -> 4 sections: "What It Is", "When to Use It", "How to Interpret", "Assumptions and Limitations" + reference
  slot:formula    -> UNUSED on graphical pages
  slot:code       -> UNUSED on graphical pages
  slot:interpretation -> UNUSED
Related Techniques (pill links)
```

### NIST Source Section Structure (Verified)

Every NIST graphical technique page follows this section order (confirmed via fetching histogram, scatter plot, and autocorrelation plot pages):

| NIST Section | Current Coverage | Gap |
|---|---|---|
| Purpose | Covered by `purpose` field | OK but brief (2-3 sentences vs NIST's full paragraph) |
| Sample Plot | Covered by SVG generator | OK |
| Definition | Covered by `definition` field | OK but brief |
| **Questions** | **NOT COVERED** | Each technique lists 5-9 specific questions the plot answers |
| **Importance** | **NOT COVERED** | Present on some techniques (e.g., autocorrelation), explains WHY this matters |
| **Examples** | **NOT COVERED** | Links to sub-pages showing different data patterns |
| Related Techniques | Covered by `relatedTechniques` in JSON | OK |
| **Case Study** | **NOT COVERED** | Links to case studies that use this technique |
| **Software** | **NOT COVERED** -- replaced by Python code | Python examples serve this role |

## Recommended Architecture

### Decision 1: Extend TechniqueContent Interface (NOT Separate Data Files)

**Recommendation: Add new optional fields to the existing `TechniqueContent` interface.**

**Rationale:**

1. **Single source of truth.** All prose content for a technique lives in one record entry. Adding a separate `technique-questions.ts` or JSON file would split the content across files, making edits require cross-file coordination.

2. **Incremental migration.** Making new fields optional means existing content works unchanged. Techniques can be enhanced one at a time without breaking the build.

3. **Follows quantitative precedent.** The `QuantitativeContent` interface extended the base pattern by adding `formulas` and `pythonCode` fields. This is the established pattern in this codebase.

4. **Type safety.** TypeScript interface gives compile-time validation for all new fields.

**New `TechniqueContent` interface:**

```typescript
export interface TechniqueContent {
  // --- Existing fields (unchanged) ---
  /** 1-2 sentences: what this technique is */
  definition: string;
  /** 2-3 sentences: when and why to use it */
  purpose: string;
  /** 3-5 sentences: how to read the plot */
  interpretation: string;
  /** 1-3 sentences: key assumptions and limitations */
  assumptions: string;
  /** NIST/SEMATECH section reference string */
  nistReference: string;

  // --- New NIST-parity fields (all optional for incremental migration) ---

  /** Questions this technique answers (NIST "Questions" section).
   *  Array of question strings, e.g., "Are the data random?" */
  questions?: string[];

  /** Why this technique matters (NIST "Importance" section).
   *  2-4 sentences explaining statistical/engineering significance. */
  importance?: string;

  /** Expanded definition beyond the 1-2 sentence `definition` field.
   *  Covers mathematical formulation, axis meanings, etc. */
  definitionExpanded?: string;

  /** Python code example using numpy/scipy/matplotlib.
   *  Replaces NIST "Software" section with modern Python. */
  pythonCode?: string;

  /** Case study cross-references.
   *  Array of case study slugs that use this technique. */
  caseStudySlugs?: string[];

  /** Worked example descriptions (NIST "Examples" section).
   *  Each entry describes a pattern the technique reveals. */
  examples?: Array<{
    /** Short label, e.g., "Strong Positive Correlation" */
    label: string;
    /** 2-3 sentence description of what this example shows */
    description: string;
    /** Optional: link to a variant if this technique is Tier B */
    variantLabel?: string;
  }>;
}
```

### Decision 2: Render New Sections in [slug].astro (NOT in a Separate Renderer)

**Recommendation: Render all new sections directly in `[slug].astro` using the existing slot pattern, NOT by modifying `technique-renderer.ts`.**

**Rationale:**

1. **technique-renderer.ts is for SVG generation only.** Its name, imports, and API (`renderTechniquePlot`, `renderVariants`) are exclusively about SVG chart creation. Adding HTML section rendering would violate single-responsibility and confuse the naming.

2. **Quantitative precedent.** The quantitative `[slug].astro` renders formulas and Python code directly in the template -- it does NOT delegate to technique-renderer.ts. Graphical pages should follow the same pattern.

3. **Astro components have direct access to astro-expressive-code's `<Code>` component.** Python code rendering requires importing `Code` from `astro-expressive-code/components`, which only works in `.astro` files (not `.ts` files).

**What changes in `technique-renderer.ts`: NOTHING.** It stays a pure SVG rendering module.

### Decision 3: Use Existing Slots Plus Template Sections (NOT New Slots)

**Recommendation: Render Questions, Importance, expanded Definition, and Examples as part of the `description` slot. Use the `code` slot for Python. Do NOT add new named slots to TechniquePage.astro.**

**Rationale:**

1. **TechniquePage.astro is shared between graphical and quantitative pages.** Adding new named slots would affect both page types. The quantitative pages already use `description`, `formula`, and `code` slots -- the same slots serve graphical pages.

2. **The new sections are semantically part of "description."** Questions, Importance, expanded Definition, and Examples are all descriptive prose about the technique. They belong in the description slot alongside the existing "What It Is" / "When to Use It" / "How to Interpret" / "Assumptions" sections.

3. **Case study links and Python code use existing unused slots.** The `code` slot is already defined but unused on graphical pages. Activating it for Python follows the quantitative page pattern exactly.

**Slot mapping after changes:**

```
slot:plot        -> SVG chart (UNCHANGED)
slot:description -> Expanded prose:
                    - "What It Is" (definition + definitionExpanded)
                    - "Questions This Plot Answers" (questions array)
                    - "Why It Matters" (importance)
                    - "When to Use It" (purpose)
                    - "How to Interpret" (interpretation)
                    - "Examples" (examples array -- links to Tier B variants if applicable)
                    - "Assumptions and Limitations" (assumptions)
                    - "Case Studies" (caseStudySlugs -> resolved links)
                    - Reference (nistReference)
slot:formula     -> UNUSED for graphical (same as today)
slot:code        -> Python example via <Code> component (NEW)
slot:interpretation -> UNUSED (same as today)
```

### Decision 4: Case Study Cross-Links via Slug Array + Build-Time Resolution

**Recommendation: Store case study slugs in `TechniqueContent.caseStudySlugs`, resolve to titles and URLs at build time in `[slug].astro`.**

**Rationale:**

1. **Case studies already exist as an Astro content collection (`edaPages`).** The `[...slug].astro` route uses `getCollection('edaPages')` to access them. The graphical `[slug].astro` can do the same.

2. **Bidirectional linking is already handled.** Case study MDX files already contain markdown links to technique pages (e.g., `[4-plot](/eda/techniques/4-plot/)`). The reverse link (technique -> case study) just needs slug references.

3. **Slug-based references are stable and validate at build time.** If a case study slug is renamed, TypeScript will still compile but the link will 404 -- which is catchable by running the build. This is the same pattern used for `relatedTechniques` in `techniques.json`.

**Implementation in `[slug].astro`:**

```typescript
// In getStaticPaths or at page level:
const caseStudyPages = await getCollection('edaPages');
const caseStudyMap = new Map(
  caseStudyPages
    .filter(p => p.data.category === 'case-studies')
    .map(p => [p.id.replace('case-studies/', ''), p.data])
);

// Resolve slugs to display data:
const caseStudyLinks = (content?.caseStudySlugs ?? [])
  .filter(slug => caseStudyMap.has(slug))
  .map(slug => ({
    slug,
    title: caseStudyMap.get(slug)!.title,
    url: caseStudyUrl(slug),
  }));
```

**Technique-to-case-study mapping (initial, based on current case study content analysis):**

| Technique | Case Studies That Use It |
|---|---|
| `4-plot` | random-walk, normal-random-numbers, uniform-random-numbers, filter-transmittance, heat-flow-meter, cryothermometry, beam-deflections, ceramic-strength, fatigue-life, standard-resistor |
| `run-sequence-plot` | random-walk, normal-random-numbers, uniform-random-numbers, filter-transmittance, ceramic-strength |
| `lag-plot` | random-walk, normal-random-numbers, uniform-random-numbers, filter-transmittance, ceramic-strength |
| `histogram` | random-walk, normal-random-numbers, uniform-random-numbers, filter-transmittance, ceramic-strength |
| `normal-probability-plot` | random-walk, normal-random-numbers, uniform-random-numbers, filter-transmittance, ceramic-strength |
| `autocorrelation-plot` | random-walk, uniform-random-numbers, filter-transmittance |
| `spectral-plot` | random-walk, uniform-random-numbers, filter-transmittance |
| `box-plot` | ceramic-strength |
| `bihistogram` | ceramic-strength |
| `block-plot` | ceramic-strength |
| `doe-plots` | ceramic-strength |
| `probability-plot` | uniform-random-numbers |
| `ppcc-plot` | uniform-random-numbers |
| `scatter-plot` | beam-deflections |

Techniques not currently referenced by any case study (15 of 29): box-cox-linearity, box-cox-normality, bootstrap-plot, complex-demodulation, conditioning-plot, contour-plot, linear-plots, mean-plot, qq-plot, scatterplot-matrix, star-plot, std-deviation-plot, weibull-plot, youden-plot, 6-plot. These will have empty `caseStudySlugs` arrays.

### Decision 5: Python Code Inline in TechniqueContent (NOT Separate Files)

**Recommendation: Store Python code as a string in `TechniqueContent.pythonCode`, NOT as separate `.py` files.**

**Rationale:**

1. **Quantitative precedent.** The `QuantitativeContent` interface stores Python code as `pythonCode?: string` directly in the content record. Every quantitative technique with code uses this pattern. Graphical techniques should be identical.

2. **Build simplicity.** Separate `.py` files would require a file-reading step at build time (`fs.readFileSync` or a content collection loader), adding complexity for zero benefit. The code is a string that gets passed to the `<Code>` component.

3. **Content colocation.** When editing a technique's content, having definition, questions, Python code, and case study links all in one record entry makes authoring faster and reduces cross-file mistakes.

4. **Code size is small.** Each Python example is 15-30 lines. Storing 29 such examples as strings adds roughly 2-3KB to `technique-content.ts` -- negligible.

**Python code structure per technique:**

```python
import numpy as np
import matplotlib.pyplot as plt

# Generate or load sample data
data = np.random.normal(loc=0, scale=1, size=200)

# Create the plot
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(data, bins=20, edgecolor='black', alpha=0.7)
ax.set_xlabel('Value')
ax.set_ylabel('Frequency')
ax.set_title('Histogram')
plt.tight_layout()
plt.show()
```

Standard pattern: numpy for data, matplotlib for plotting, scipy.stats for statistical functions when needed. Each example should be self-contained and runnable.

## Component Boundaries

### What Gets Modified

| Component | Change Type | Details |
|---|---|---|
| `TechniqueContent` interface | **EXTEND** | Add 6 optional fields: questions, importance, definitionExpanded, pythonCode, caseStudySlugs, examples |
| `TECHNIQUE_CONTENT` record | **EXTEND** | Add new field values to all 29 entries (incremental -- can do batches) |
| `[slug].astro` (graphical) | **MODIFY** | Add description sections for questions/importance/examples, add code slot for Python, add case study resolution |
| `technique-renderer.ts` | **NO CHANGE** | Stays pure SVG rendering |
| `TechniquePage.astro` | **NO CHANGE** | Existing 5 slots suffice |
| `techniques.json` | **NO CHANGE** | Metadata schema unchanged |

### What Gets Created

| Component | Purpose |
|---|---|
| Nothing new | All changes fit within existing files and patterns |

This is a key architectural finding: **no new files, components, or modules are needed.** The integration is purely additive to existing interfaces and templates.

## Data Flow

### Current Flow

```
techniques.json                    technique-content.ts
      |                                   |
      v                                   v
getStaticPaths()                 getTechniqueContent(slug)
      |                                   |
      +------- [slug].astro <-------------+
                    |
                    v
            TechniquePage.astro
              slot:plot -> SVG from technique-renderer.ts
              slot:description -> 4 prose sections
```

### Enhanced Flow

```
techniques.json                    technique-content.ts (EXTENDED)
      |                                   |
      v                                   v
getStaticPaths()                 getTechniqueContent(slug)
      |                                   |
      |    edaPages collection             |
      |         |                          |
      +------- [slug].astro <---------+---+
                    |
                    | (resolves caseStudySlugs -> titles/URLs)
                    | (imports <Code> from astro-expressive-code)
                    | (optional: imports katex for formula rendering)
                    v
            TechniquePage.astro (UNCHANGED)
              slot:plot -> SVG from technique-renderer.ts (UNCHANGED)
              slot:description -> 8-10 prose sections (EXPANDED)
              slot:code -> Python example via <Code> (NEW)
```

### Key Observation: No New Data Sources

The enhanced flow adds exactly one new data dependency: `getCollection('edaPages')` for case study resolution. This collection is already used elsewhere in the codebase. The graphical `[slug].astro` does not currently import it but the quantitative `[slug].astro` does not either -- both would need it added.

## Patterns to Follow

### Pattern 1: Optional Field Extension (from QuantitativeContent)

**What:** Add optional fields to an interface, existing entries compile without changes.

**When:** Adding new content sections that not all entries have yet.

**Example:**

```typescript
// Before:
export interface TechniqueContent {
  definition: string;
  purpose: string;
  // ...
}

// After:
export interface TechniqueContent {
  definition: string;
  purpose: string;
  // ... existing fields unchanged ...
  questions?: string[];      // NEW, optional
  pythonCode?: string;        // NEW, optional
}
```

### Pattern 2: Conditional Slot Rendering (from quantitative [slug].astro)

**What:** Only render a slot when content exists. Use `{content?.field && (...)}` guards.

**When:** Rendering optional sections.

**Example (from existing quantitative page):**

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

### Pattern 3: Collection-Based Link Resolution (from case study cross-refs)

**What:** Store slugs in content, resolve to full objects at build time via `getCollection()`.

**When:** Cross-referencing between content types.

**Example (from graphical [slug].astro `getStaticPaths`):**

```typescript
const caseStudyPages = await getCollection('edaPages');
const caseStudyMap = new Map(
  caseStudyPages
    .filter(p => p.data.category === 'case-studies')
    .map(p => [p.id.replace('case-studies/', ''), p.data])
);
```

### Pattern 4: Section Ordering Mirrors NIST (Established Convention)

**What:** The "What It Is" / "When to Use It" / "How to Interpret" / "Assumptions" section order in current pages roughly mirrors the NIST page structure (Definition / Purpose / [content] / [caveats]).

**When:** Adding new sections, insert them in the NIST-standard position.

**Recommended section order (matching NIST flow):**

1. **What It Is** -- `definition` + `definitionExpanded` (NIST: Definition)
2. **Questions This Plot Answers** -- `questions` (NIST: Questions)
3. **Why It Matters** -- `importance` (NIST: Importance)
4. **When to Use It** -- `purpose` (NIST: Purpose)
5. **How to Interpret** -- `interpretation` (NIST: Sample Plot + interpretation text)
6. **Examples** -- `examples` (NIST: Examples)
7. **Assumptions and Limitations** -- `assumptions`
8. **Case Studies** -- `caseStudySlugs` resolved to links (NIST: Case Study)
9. **Reference** -- `nistReference`
10. *(separate slot)* **Python Example** -- `pythonCode` (NIST: Software)

## Anti-Patterns to Avoid

### Anti-Pattern 1: Creating a New TechniqueContentV2 Interface

**What:** Making a separate `TechniqueContentExtended` interface and having two content systems.

**Why bad:** Fragments the content, requires migration code, two lookup functions, and conditional logic to pick which interface to use.

**Instead:** Extend the existing interface with optional fields. TypeScript handles the transition gracefully.

### Anti-Pattern 2: Moving Content to MDX

**What:** Converting graphical technique pages from TypeScript content objects to MDX files (like case studies use).

**Why bad:** The graphical pages have a rigid, repeating structure. MDX is for free-form content. Converting to MDX would lose the structural guarantees (every page has questions, every page has assumptions) and require each of the 29 pages to manually maintain consistent formatting. It would also break the current `getTechniqueContent()` API that quantitative pages also rely on as a pattern.

**Instead:** Keep the TypeScript Record pattern. It enforces structure, enables programmatic access, and keeps all 29 techniques in one reviewable file.

### Anti-Pattern 3: Adding Formulas to Graphical Technique Pages

**What:** Using the `formula` slot with KaTeX for graphical technique definitions.

**Why bad:** Graphical techniques are about visual interpretation, not mathematical formulas. The `formula` slot exists for quantitative techniques that need to show equations (t-test formula, ANOVA F-statistic, etc.). Adding formulas to graphical pages would blur the distinction between the two page types. NIST's graphical technique pages rarely include formulas -- the autocorrelation coefficient formula is an exception, not the rule.

**Instead:** If a graphical technique needs a mathematical definition (e.g., the autocorrelation formula), include it as text in the `definitionExpanded` field. Reserve the `formula` slot for quantitative pages.

### Anti-Pattern 4: Building a Generic "Section Renderer" Component

**What:** Creating a `TechniqueSection.astro` component that takes a section type enum and renders different content based on the type.

**Why bad:** Over-abstraction for what is essentially a list of `<div>` elements with headings and paragraphs. The sections have slightly different rendering needs (questions is a `<ul>`, examples may have links, case studies need resolved URLs). A generic renderer would need so many conditionals it would be harder to understand than the direct template.

**Instead:** Render each section directly in the `[slug].astro` template. The total template grows from ~87 lines to approximately 160 lines -- still well within single-file readability.

## Scalability Considerations

| Concern | At 29 techniques (current) | At 50+ techniques (future) |
|---|---|---|
| `technique-content.ts` file size | ~35KB currently, ~80-100KB after expansion | Consider splitting into per-category files if 50+ techniques are added |
| Build time | Negligible (static string rendering) | Still negligible -- no runtime computation |
| Python code maintenance | 29 code examples, ~500 lines total | Could extract to separate file if > 75 techniques |
| Case study resolution | 10 case studies, Map lookup is O(1) | Still O(1) per lookup, no concern |

The current architecture handles 29 techniques easily. The only future concern is `technique-content.ts` becoming very large (100KB+), at which point splitting by category (time-series techniques, distribution techniques, comparison techniques) would be appropriate. This is not needed now.

## Build Order

The recommended build order respects data dependencies and enables incremental verification:

### Phase 1: Interface Extension + Template Update (foundation)

**Dependencies:** None -- this is the starting point.

1. **Extend `TechniqueContent` interface** with 6 new optional fields
2. **Update `[slug].astro` template** to render new sections conditionally
3. **Add `<Code>` import** to `[slug].astro` for Python rendering
4. **Add case study collection resolution** to `getStaticPaths()`

**Verification:** Build succeeds with no visible changes (all new fields are optional and empty).

### Phase 2: Content Population (batch by batch)

**Dependencies:** Phase 1 complete.

Populate new fields for all 29 techniques. Recommended batching by complexity:

1. **Batch A (high-traffic, Tier B):** histogram, scatter-plot, normal-probability-plot, autocorrelation-plot, lag-plot, spectral-plot (6 techniques). These have variants and are referenced by most case studies.
2. **Batch B (time-series cluster):** run-sequence-plot, 4-plot, 6-plot, complex-demodulation (4 techniques). Related techniques that share context.
3. **Batch C (probability/distribution cluster):** probability-plot, ppcc-plot, qq-plot, weibull-plot, box-plot, box-cox-normality, box-cox-linearity, bootstrap-plot (8 techniques).
4. **Batch D (comparison/DOE cluster):** bihistogram, block-plot, doe-plots, mean-plot, std-deviation-plot, youden-plot (6 techniques).
5. **Batch E (multivariate/remaining):** scatter-plot-matrix, conditioning-plot, contour-plot, star-plot, linear-plots (5 techniques).

**Verification per batch:** Build succeeds, new sections render correctly, no regressions on existing sections.

### Phase 3: Python Code Examples

**Dependencies:** Phase 1 complete (Phase 2 can proceed in parallel).

Add `pythonCode` field to all 29 techniques. Each example follows the standard pattern:
- numpy for data generation
- matplotlib.pyplot for visualization
- scipy.stats for statistical functions where needed
- Self-contained, runnable, 15-30 lines

**Verification:** Python code renders via `<Code>` component with syntax highlighting.

### Phase 4: Case Study Cross-Links

**Dependencies:** Phase 1 complete, case study slugs must exist in the content collection.

1. Add `caseStudySlugs` arrays to all 29 technique entries
2. Render case study link section in `[slug].astro`

**Verification:** Links resolve correctly, no 404s on case study URLs.

## Template Diff Preview

The key change in `src/pages/eda/techniques/[slug].astro`:

```astro
---
// ADDED IMPORTS:
import { Code } from 'astro-expressive-code/components';
import { caseStudyUrl } from '../../../lib/eda/routes';

// IN getStaticPaths -- ADD case study resolution:
const caseStudyPages = await getCollection('edaPages');
const caseStudyMap = new Map(
  caseStudyPages
    .filter(p => p.data.category === 'case-studies')
    .map(p => [p.id.replace('case-studies/', ''), p.data])
);

// In the return props, add:
//   caseStudyLinks: resolved array
---

{/* UPDATED description slot: */}
{content && (
  <Fragment slot="description">
    <section class="prose-section mt-8 space-y-6">
      {/* 1. What It Is (existing + expanded) */}
      <div>
        <h2 class="text-xl font-heading font-bold mb-3">What It Is</h2>
        <p class="text-[var(--color-text-secondary)] leading-relaxed">{content.definition}</p>
        {content.definitionExpanded && (
          <p class="text-[var(--color-text-secondary)] leading-relaxed mt-3">{content.definitionExpanded}</p>
        )}
      </div>

      {/* 2. Questions (NEW) */}
      {content.questions && content.questions.length > 0 && (
        <div>
          <h2 class="text-xl font-heading font-bold mb-3">Questions This Plot Answers</h2>
          <ul class="list-disc pl-6 space-y-1">
            {content.questions.map(q => (
              <li class="text-[var(--color-text-secondary)] leading-relaxed">{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Why It Matters (NEW) */}
      {content.importance && (
        <div>
          <h2 class="text-xl font-heading font-bold mb-3">Why It Matters</h2>
          <p class="text-[var(--color-text-secondary)] leading-relaxed">{content.importance}</p>
        </div>
      )}

      {/* 4. When to Use It (existing) */}
      <div>
        <h2 class="text-xl font-heading font-bold mb-3">When to Use It</h2>
        <p class="text-[var(--color-text-secondary)] leading-relaxed">{content.purpose}</p>
      </div>

      {/* 5. How to Interpret (existing) */}
      <div>
        <h2 class="text-xl font-heading font-bold mb-3">How to Interpret</h2>
        <p class="text-[var(--color-text-secondary)] leading-relaxed">{content.interpretation}</p>
      </div>

      {/* 6. Examples (NEW) */}
      {content.examples && content.examples.length > 0 && (
        <div>
          <h2 class="text-xl font-heading font-bold mb-3">Examples</h2>
          <ul class="space-y-3">
            {content.examples.map(ex => (
              <li>
                <span class="font-semibold text-[var(--color-text-primary)]">{ex.label}:</span>
                <span class="text-[var(--color-text-secondary)] ml-1">{ex.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Assumptions (existing) */}
      <div>
        <h2 class="text-xl font-heading font-bold mb-3">Assumptions and Limitations</h2>
        <p class="text-[var(--color-text-secondary)] leading-relaxed">{content.assumptions}</p>
      </div>

      {/* 8. Case Studies (NEW) */}
      {caseStudyLinks.length > 0 && (
        <div>
          <h2 class="text-xl font-heading font-bold mb-3">Case Studies</h2>
          <p class="text-[var(--color-text-secondary)] mb-3">
            This technique is demonstrated in the following case studies:
          </p>
          <div class="flex flex-wrap gap-3">
            {caseStudyLinks.map(cs => (
              <a href={cs.url}
                 class="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors">
                {cs.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 9. Reference (existing) */}
      <p class="text-sm text-[var(--color-text-secondary)] italic mt-4">
        Reference: {content.nistReference}
      </p>
    </section>
  </Fragment>
)}

{/* NEW: Python code slot (follows quantitative page pattern) */}
{content?.pythonCode && (
  <Fragment slot="code">
    <section class="prose-section mt-8">
      <h2 class="text-xl font-heading font-bold mb-3">Python Example</h2>
      <Code code={content.pythonCode} lang="python" />
    </section>
  </Fragment>
)}
```

## Sources

- Direct codebase analysis: `src/lib/eda/technique-content.ts`, `src/lib/eda/technique-renderer.ts`, `src/pages/eda/techniques/[slug].astro`, `src/pages/eda/quantitative/[slug].astro`, `src/lib/eda/quantitative-content.ts`, `src/data/eda/techniques.json`, `src/components/eda/TechniquePage.astro`
- NIST/SEMATECH e-Handbook: Histogram page (https://www.itl.nist.gov/div898/handbook/eda/section3/histogra.htm) -- section structure verified
- NIST/SEMATECH e-Handbook: Scatter Plot page (https://www.itl.nist.gov/div898/handbook/eda/section3/scatterp.htm) -- Questions section verified
- NIST/SEMATECH e-Handbook: Autocorrelation Plot page (https://www.itl.nist.gov/div898/handbook/eda/section3/autocopl.htm) -- Questions, Importance, Examples sections verified
- Case study cross-reference analysis: grep of all 10 case study MDX files for technique URL references
