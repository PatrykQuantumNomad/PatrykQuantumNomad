# Phase 119: Content Authoring - Research

**Researched:** 2026-04-14
**Domain:** MDX blog post authoring with custom Astro components and GFM footnote citations
**Confidence:** HIGH

## Summary

Phase 119 is a content authoring phase -- writing a 3000-5000 word essay in MDX format using pre-built Astro components and pre-verified citation sources. All upstream dependencies are complete: the sources reference file (17 inline citations, 37 further reading) and structured outline were created in Phase 117, and the StatHighlight, TermDefinition, and cover image SVG were built in Phase 118. The writing environment (Astro 5.17.1 + @astrojs/mdx 4.3.13) is stable and well-understood.

The primary technical risk is that GFM footnote syntax (`[^1]`) has never been used in an MDX file in this project. While `remark-gfm@4.0.1` is installed as a dependency of `@astrojs/mdx` and Astro's `extendMarkdownConfig` defaults to `true` (inheriting GFM support into MDX), this path is untested. The first plan should include an early build verification after placing a test footnote. A secondary risk is the tension between the Phase 117 outline's "hyperlinked text" citation style and the CONT-04 requirement for "GFM footnote syntax" -- the requirements take precedence.

**Primary recommendation:** Write the essay in three sequential plans matching the three-act structure. Each plan must end with `npm run build` verification. Use GFM footnote syntax as required by CONT-04, test it in the first plan, and fall back to hyperlinked text only if the build breaks (documenting the deviation).

## Project Constraints (from CLAUDE.md)

- Repository is a GitHub profile repo for PatrykQuantumNomad (patrykgolabek.dev)
- SEO and public visibility are primary goals -- keyword-rich content, backlinks, structured formatting
- Tone: professional but approachable, first person, concise, confident
- Avoid walls of text; use scannable sections with clear hierarchy
- GitHub-flavored Markdown compatibility required
- Featured projects link to other PatrykQuantumNomad repos
- Owner: Patryk Golabek, Cloud-Native Software Architect (17+ years), Ontario, Canada

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Blog post MDX file at src/data/blog/dark-code.mdx with complete frontmatter | Frontmatter schema verified in content.config.ts: title, description, publishedDate, tags, coverImage, draft fields. Cover image at /images/dark-code-cover.svg confirmed. |
| CONT-02 | 3000-5000 words following wake-up call -> framework -> defense arc | Outline with word budgets exists (Act 1: ~1500w, Act 2: ~1200w, Act 3: ~1000w, Act 4: ~800w = ~4500w). remarkReadingTime plugin provides word count. |
| CONT-04 | 20-30 inline citations using GFM footnote syntax with verified URLs | remark-gfm@4.0.1 installed via @astrojs/mdx. 17 inline citation sources verified. UNTESTED in project MDX files -- needs build verification. |
| CONT-05 | Bold opening statement using OpeningStatement component | Component verified: slot-based, renders centered text in not-prose div. Pattern: `<OpeningStatement>Text here</OpeningStatement>` |
| CONT-06 | TL;DR summary using TldrSummary component | Component verified: aside with title prop (default "TL;DR"), supports markdown in slot. Pattern: `<TldrSummary>\n- bullets\n</TldrSummary>` |
| CONT-07 | Named framework with memorable 3-5 dimension structure | "The Dark Code Spectrum" with 5 dimensions defined in outline: Clone Density, Ownership Vacuum, Comprehension Decay, Refactoring Deficit, Vulnerability Surface |
| CONT-08 | Key statistics via StatHighlight component | Component verified: props are stat (string), label (string), source (optional string). Pattern: `<StatHighlight stat="4x" label="Code clone growth" source="GitClear 2025" />` |
| CONT-09 | Formal "Dark Code" definition via TermDefinition component | Component verified: props are term (string), pronunciation (optional string), definition in slot. Pattern: `<TermDefinition term="Dark Code" pronunciation="/dark kohd/">\nDefinition text\n</TermDefinition>` |
| INTG-05 | Tags from existing taxonomy with overlap for related post discovery | 47 existing tags catalogued. Recommended tags identified with overlap analysis. |
| INTG-07 | Internal cross-links to existing blog posts and tools | 5 cross-link targets identified with thematic relevance. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 | Static site framework | Already installed, powers the entire site [VERIFIED: npm ls] |
| @astrojs/mdx | 4.3.13 | MDX processing for blog posts | Already installed, processes .mdx blog files [VERIFIED: npm ls] |
| remark-gfm | 4.0.1 | GFM extensions including footnotes | Transitive dependency via @astrojs/mdx, inherited by default [VERIFIED: npm ls] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| reading-time (via remark plugin) | N/A | Word count and reading time | Automatically applied via remarkReadingTime plugin in astro.config.mjs [VERIFIED: codebase] |
| @tailwindcss (via @astrojs/tailwind) | N/A | Styling for components | All blog components use Tailwind + CSS custom properties [VERIFIED: codebase] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GFM footnotes | Hyperlinked text citations | Outline used hyperlinked style, but CONT-04 requires footnotes. If footnotes break in MDX, fall back to hyperlinks with deviation documented. |

**Installation:**
No new packages needed -- all dependencies already installed.

## Architecture Patterns

### MDX Blog Post Structure

```
src/data/blog/dark-code.mdx
├── Frontmatter (YAML)
│   ├── title, description (thesis statement)
│   ├── publishedDate, tags, coverImage
│   └── draft: true
├── Component Imports
│   ├── OpeningStatement
│   ├── TldrSummary
│   ├── StatHighlight
│   └── TermDefinition
├── OpeningStatement (bold claim)
├── TldrSummary (3-5 bullet summary)
├── Act 1: Wake-up Call (~1500w)
│   ├── Sections 1.1-1.4 with StatHighlight and TermDefinition
│   └── GFM footnotes [^1] through [^8]
├── Act 2: Framework (~1200w)
│   ├── Dark Code Spectrum table (5 dimensions)
│   └── Feedback loop narrative
├── Act 3: Defense (~1000w)
│   ├── Ownership, refactoring, supply chain
│   └── Internal cross-links woven in
├── Act 4: Closing (~800w)
│   ├── Philosophical frame + first-person moment
│   └── Call to action
└── Footnote definitions [^1]: URL\n...[^N]: URL
```

### Pattern 1: Component Usage in MDX

**What:** Astro components imported and used inline within MDX prose
**When to use:** Every component specified in requirements (OpeningStatement, TldrSummary, StatHighlight, TermDefinition)
**Example:**
```mdx
// Source: verified from existing blog posts (death-by-a-thousand-arrows.mdx, claude-code-guide-refresh.mdx)
import OpeningStatement from '../../components/blog/OpeningStatement.astro';
import TldrSummary from '../../components/blog/TldrSummary.astro';
import StatHighlight from '../../components/blog/StatHighlight.astro';
import TermDefinition from '../../components/blog/TermDefinition.astro';

<OpeningStatement>Your codebase is full of code that no one understands, no one owns, and no one can safely change.</OpeningStatement>

<TldrSummary>

- **Bullet one** with markdown formatting
- **Bullet two** with [links](/path/)

</TldrSummary>

<StatHighlight stat="4x" label="Increase in code clones since AI assistants went mainstream" source="GitClear 2025" />

<TermDefinition term="Dark Code" pronunciation="/dark kohd/">

Code that executes in production but is not understood by any current team member. It compiles, it ships, it runs -- but no one on the team can explain what it does or why.

</TermDefinition>
```

### Pattern 2: GFM Footnote Citations

**What:** Inline superscript references with footnote definitions at the bottom
**When to use:** All 20-30 inline citations per CONT-04
**Example:**
```mdx
GitClear's analysis of 211 million lines of code reveals that copy-pasted code rose from 8.3% to 12.3%[^1], 
while refactoring collapsed from 25% to less than 10% of all code changes[^1].

[^1]: [GitClear AI Copilot Code Quality 2025](https://www.gitclear.com/ai_assistant_code_quality_2025_research)
```

**Important:** Footnote definitions must be placed at the end of the MDX file, after all prose content. Each definition on its own line with a blank line before the footnote block.

### Pattern 3: Frontmatter Convention

**What:** Frontmatter fields matching the content.config.ts schema
**When to use:** First lines of dark-code.mdx
**Example:**
```yaml
---
title: "Dark Code: The Silent Rot AI Accelerated and No One Is Measuring"
description: "AI coding assistants have accelerated a pre-existing problem: codebases filling with code no one understands, no one owns, and no one can safely change. A framework for measuring how much of your codebase has gone dark."
publishedDate: 2026-04-14
tags: ["code-quality", "ai-coding-assistant", "technical-debt", "software-architecture", "security", "devops"]
coverImage: "/images/dark-code-cover.svg"
draft: true
---
```

### Pattern 4: Internal Cross-Links

**What:** Markdown links to existing blog posts and tools using relative paths with trailing slash
**When to use:** Woven naturally into prose where thematically relevant
**Example:**
```mdx
If you have read [The Beauty Index](/blog/the-beauty-index/), you know I care about how code looks and reads.
```

### Anti-Patterns to Avoid

- **Footnotes inside JSX components:** GFM footnote syntax `[^n]` will NOT work inside Astro component slots (JSX context). Keep footnote references in plain MDX prose only, not inside `<StatHighlight>`, `<TermDefinition>`, etc.
- **Empty lines before/after component tags:** MDX requires blank lines around component tags to separate them from prose. Missing blank lines cause parse errors.
- **Footnote definitions scattered throughout the file:** All `[^n]: ...` definitions must be grouped together at the end of the file. Scattered definitions cause rendering issues.
- **Components inside markdown constructs:** Do not place Astro components inside blockquotes, lists, or other markdown constructs. They must be at the top level of the MDX document.
- **First paragraph drop cap conflict:** The `.prose > p:first-of-type::first-letter` CSS rule creates a decorative drop cap. Since `<OpeningStatement>` is `not-prose`, the first actual `<p>` after it will get the drop cap. Ensure the first prose paragraph after the TldrSummary reads well with a large first letter.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Statistics callouts | Custom HTML/CSS blocks | StatHighlight component | Already built in Phase 118, tested, themed |
| Term definitions | Custom blockquote styling | TermDefinition component | Already built in Phase 118, consistent with site design |
| Bold opening | Manual styling | OpeningStatement component | Established pattern across existing blog posts |
| TL;DR section | Manual aside | TldrSummary component | Established pattern, supports markdown in slot |
| Citation formatting | Manual superscript HTML | GFM footnote syntax `[^n]` | remark-gfm handles rendering, backlinks, and accessibility |
| Word counting | Manual counting | remarkReadingTime plugin | Automatically counts via Astro build pipeline |
| Related posts | Manual links section | Built-in tag-overlap sidebar | [slug].astro computes related posts automatically from tag overlap |

**Key insight:** This phase is pure content authoring. Every technical component is already built. The task is writing prose and assembling pre-built pieces correctly.

## Common Pitfalls

### Pitfall 1: Footnotes Fail in MDX Build

**What goes wrong:** GFM footnotes have never been tested in an MDX file in this project. remark-gfm is a transitive dependency, not explicitly configured.
**Why it happens:** MDX processes markdown differently than plain .md files. While Astro should inherit GFM support via extendMarkdownConfig, the footnote feature specifically may have edge cases.
**How to avoid:** Add a test footnote in the very first plan (119-01) and run `npm run build` immediately after. If it fails, switch to hyperlinked text citations and document the deviation.
**Warning signs:** Build errors mentioning "footnote", "remark-gfm", or unexpected HTML in the output. [VERIFIED: remark-gfm@4.0.1 is installed, but footnote usage in .mdx is UNTESTED]

### Pitfall 2: Component Slot Parse Errors

**What goes wrong:** MDX requires blank lines around component tags. Missing them causes cryptic parse errors like "Expected closing tag for X."
**Why it happens:** MDX parser needs whitespace to distinguish between JSX and markdown content.
**How to avoid:** Always include a blank line after the opening tag and before the closing tag when the slot contains markdown content.
**Warning signs:** Build fails with MDX parsing errors pointing to component lines.

```mdx
// WRONG - will fail
<TldrSummary>
- Bullet one
</TldrSummary>

// CORRECT
<TldrSummary>

- Bullet one

</TldrSummary>
```

### Pitfall 3: Citation URL Mismatch

**What goes wrong:** Footnote URLs don't match the verified URLs in sources.md, introducing hallucinated or broken citations.
**Why it happens:** Copying URLs from memory instead of from the sources reference file.
**How to avoid:** Every citation URL must be copy-pasted from `.planning/phases/117-source-verification-and-outline/sources.md`. Never type a URL from memory. The planner should include explicit source file references in task descriptions.
**Warning signs:** Any URL in the MDX file that doesn't appear in sources.md.

### Pitfall 4: Word Budget Overrun

**What goes wrong:** Essay exceeds 5000 words or individual acts exceed their budgets, making the post too long for the intended reading experience.
**Why it happens:** Each section feels like it needs "just one more paragraph" to fully develop the argument.
**How to avoid:** Write to target budgets (Act 1: ~1500w, Act 2: ~1200w, Act 3: ~1000w, Act 4: ~800w). Use the remarkReadingTime word count after each plan's build to check cumulative total. The outline already has per-section targets.
**Warning signs:** Any act exceeding its budget by more than 15%.

### Pitfall 5: Drop Cap on Wrong Paragraph

**What goes wrong:** The `.prose > p:first-of-type::first-letter` CSS rule applies a large decorative first letter. If the first paragraph after the components starts with a quote mark, number, or unintended character, the drop cap looks wrong.
**Why it happens:** OpeningStatement and TldrSummary are `not-prose`, so the first actual `<p>` tag in the `.prose` div gets the treatment.
**How to avoid:** Ensure the first prose paragraph after TldrSummary begins with a strong, intentional word (not a quote, number, or parenthetical). Check existing posts for the pattern -- they all start with clear narrative sentences.
**Warning signs:** Visually inspect the rendered post.

### Pitfall 6: Tag Taxonomy Bloat

**What goes wrong:** Adding too many new tags that have no overlap with existing posts, preventing the related posts sidebar from finding matches.
**Why it happens:** Temptation to create new tags for novel concepts like "dark-code" or "technical-debt."
**How to avoid:** The requirement says "at most one new tag." Use primarily existing tags (code-quality, security, devops, ai-coding-assistant) and add at most one new tag if essential for the post's discoverability.
**Warning signs:** More than 1 new tag not in the existing 47-tag taxonomy.

## Code Examples

### Complete Frontmatter

```yaml
# Source: content.config.ts schema + existing blog post conventions
---
title: "Dark Code: The Silent Rot AI Accelerated and No One Is Measuring"
description: "AI coding assistants have accelerated a pre-existing problem: codebases filling with code no one understands, no one owns, and no one can safely change. A framework for measuring how much of your codebase has gone dark."
publishedDate: 2026-04-14
tags: ["code-quality", "ai-coding-assistant", "technical-debt", "software-architecture", "security", "devops"]
coverImage: "/images/dark-code-cover.svg"
draft: true
---
```

### Component Import Block

```mdx
// Source: existing pattern in death-by-a-thousand-arrows.mdx, claude-code-guide-refresh.mdx
import OpeningStatement from '../../components/blog/OpeningStatement.astro';
import TldrSummary from '../../components/blog/TldrSummary.astro';
import StatHighlight from '../../components/blog/StatHighlight.astro';
import TermDefinition from '../../components/blog/TermDefinition.astro';
```

### StatHighlight Usage (Multiple Instances)

```mdx
// Source: StatHighlight.astro component interface
<StatHighlight stat="4x" label="Increase in code clones since AI coding assistants went mainstream" source="GitClear 2025" />

<StatHighlight stat="<10%" label="Refactoring as a share of all code changes, down from 25%" source="GitClear 2025" />

<StatHighlight stat="17%" label="Lower comprehension scores for AI-assisted developers" source="Anthropic 2025" />

<StatHighlight stat="23.7%" label="More security vulnerabilities in AI-generated code" source="ResearchGate 2024" />

<StatHighlight stat="31%" label="Defect density increase per standard deviation of technical debt" source="American Impact Review 2026" />
```

### TermDefinition Usage

```mdx
// Source: TermDefinition.astro component interface
<TermDefinition term="Dark Code" pronunciation="/dark kohd/">

Code that executes in production but is not understood by any current team member. It compiles, it ships, it runs -- and no one on the team can explain what it does, why it exists, or what breaks if it changes. Dark code is the shadow inventory of every codebase: unmeasured, unowned, and growing.

</TermDefinition>
```

### GFM Footnote Pattern

```mdx
// Source: GFM specification + remark-gfm documentation
// Inline reference in prose:
GitClear's 2025 analysis of 211 million lines of code found that copy-pasted code rose from 8.3% to 12.3%[^1].

// Definition at end of file:
[^1]: [GitClear: AI Copilot Code Quality 2025](https://www.gitclear.com/ai_assistant_code_quality_2025_research)
```

### Internal Cross-Link Pattern

```mdx
// Source: existing blog post patterns (death-by-a-thousand-arrows.mdx line 15)
If you have read [The Beauty Index](/blog/the-beauty-index/), you know I care deeply about how code reads.

The same principles that make [Kubernetes manifests secure](/blog/kubernetes-manifest-best-practices/) apply to the code those manifests deploy.
```

## Tag Taxonomy Analysis

### Existing Tags with Thematic Overlap

| Tag | Posts Using It | Relevance to Dark Code |
|-----|---------------|----------------------|
| `code-quality` | 2 (beauty-index, death-by-arrows) | Direct match -- dark code is a code quality argument |
| `security` | 5 (k8s, dockerfile, compose, gha, fastapi) | Vulnerability surface is a core Dark Code Spectrum dimension |
| `devops` | 7 posts | CI/CD and observability are defense mechanisms discussed in Act 3 |
| `ai-coding-assistant` | 2 (claude-code-guide, refresh) | AI as accelerant is the essay's central thesis |
| `software-aesthetics` | 2 (beauty-index, death-by-arrows) | Philosophical quality angle aligns with Act 4 |

### Recommended Tag Set

```yaml
tags: ["code-quality", "ai-coding-assistant", "technical-debt", "software-architecture", "security", "devops"]
```

- **Existing tags (5):** code-quality, ai-coding-assistant, security, devops, software-architecture (wait -- `software-architecture` is not in the existing taxonomy)
- **Correction:** `architecture` exists (from database-compass). Use that.

**Revised recommended tags:**
```yaml
tags: ["code-quality", "ai-coding-assistant", "technical-debt", "security", "devops", "architecture"]
```

- **Existing tags (5):** code-quality, ai-coding-assistant, security, devops, architecture
- **New tag (1):** technical-debt -- essential for SEO discoverability, high search volume term, no existing equivalent in taxonomy
- **Tag overlap for related posts:** code-quality overlaps with beauty-index and death-by-arrows; security overlaps with 5 posts; devops overlaps with 7 posts; ai-coding-assistant overlaps with 2 posts. This gives strong related post sidebar coverage.

## Internal Cross-Link Targets

### Recommended Cross-Links (5 targets)

| Target | URL | Where in Essay | Justification |
|--------|-----|---------------|---------------|
| The Beauty Index | `/blog/the-beauty-index/` | Act 1 or Act 4 | Code aesthetics and quality -- "If you care about how code looks, you should care about code no one reads" |
| Death by a Thousand Arrows | `/blog/death-by-a-thousand-arrows/` | Act 1 | Code quality erosion through small syntactic choices -- thematic parallel to dark code accumulation |
| Kubernetes Manifest Best Practices | `/blog/kubernetes-manifest-best-practices/` | Act 3 (defense) | Security practices at the deployment layer -- the code dark code ships in |
| GitHub Actions Best Practices | `/blog/github-actions-best-practices/` | Act 3 (CI/CD defense) | CI/CD pipeline as a defense against dark code reaching production |
| Claude Code Guide | `/guides/claude-code/` | Act 4 (nuanced AI framing) | The guide to using AI tools responsibly -- "AI is the accelerant, not the cause; here is how to use it well" |

### Alternative Cross-Links (if needed)

| Target | URL | Context |
|--------|-----|---------|
| Building Kubernetes Observability Stack | `/blog/building-kubernetes-observability-stack/` | Observability as illumination -- detecting dark code in production |
| Dockerfile Best Practices | `/blog/dockerfile-best-practices/` | Container security as a dark code boundary |

## Citation Conflict Resolution

### Issue: Outline vs. Requirements Citation Style

**Outline (Phase 117):** "Citation style: Hyperlinked text (e.g., '[GitClear's 2025 analysis](url) found...')" [VERIFIED: outline.md line 4]

**Requirement CONT-04:** "20-30 inline citations using GFM footnote syntax with verified URLs" [VERIFIED: REQUIREMENTS.md]

**Resolution:** CONT-04 requirements take precedence. Use GFM footnote syntax (`[^n]`). The outline's hyperlinked text style was a Phase 117 discretionary choice about the outline document itself, not a locked decision about the final prose format. The requirement is explicit.

**Hybrid approach (if footnotes break):** If the first build test reveals that GFM footnotes do not render correctly in MDX, fall back to the outline's hyperlinked text style. Document the deviation in the plan summary.

### Citation Count Reconciliation

**Outline specifies:** 17 unique inline sources across 19 citation instances (some sources cited in multiple acts)
**Requirement CONT-04:** 20-30 inline citations
**Reconciliation:** The outline's 17 sources with 19+ citation instances (many sources are cited twice across acts) may produce 20-25 footnote references, which satisfies the 20-30 range. If the count falls short, additional citations from the Further Reading pool can be promoted. The outline already maps which sources go where.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| rehype-citation for academic-style citations | GFM footnotes via remark-gfm | Project decision (REQUIREMENTS.md) | ~200KB lighter, simpler syntax, native GFM support |
| Manual reading time estimates | remarkReadingTime plugin | Already in use | Automatic word count validation after each build |
| External link citations only | Internal cross-links + external footnotes | This phase | Better SEO through internal linking, longer session duration |

**Deprecated/outdated:**
- remark-footnotes: Deprecated in favor of remark-gfm which includes footnote support [VERIFIED: remark-gfm GitHub repo]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GFM footnotes will render correctly in MDX files because extendMarkdownConfig defaults to true | Architecture Patterns | High -- would require switching to hyperlinked text citations, changing every citation in the essay |
| A2 | Footnote syntax inside Astro component slots will not work | Anti-Patterns | Medium -- if it does work, some citations could be placed inside components, but keeping them in prose is safer |
| A3 | The prose > p:first-of-type::first-letter drop cap will apply to the first paragraph after TldrSummary | Pitfall 5 | Low -- visual issue only, easily fixed by adjusting paragraph order |

**Mitigation for A1:** Build test in Plan 119-01 before writing significant content. This is the single highest-risk assumption.

## Open Questions

1. **Will GFM footnotes render with acceptable styling in the existing Tailwind prose setup?**
   - What we know: No custom footnote CSS exists. Footnotes will inherit default prose link and heading styles.
   - What's unclear: Whether the auto-generated "Footnotes" h2 heading looks good with the existing `.prose h2` border-left styling.
   - Recommendation: Accept default styling for now. Footnote CSS refinement is a post-publish polish task, not a blocker.

2. **Does the outline's 17 unique inline sources produce enough footnote references to meet the 20-30 citation requirement?**
   - What we know: 17 sources x ~1.5 avg. references = ~25 footnote references. Several sources (e.g., #7 GitClear, #25 Anthropic, #28 Bug Resolution) are cited in multiple acts.
   - What's unclear: Exact count depends on how densely citations are woven into prose.
   - Recommendation: Aim for 20-25 footnotes using the 17 sources. Promote 2-3 Further Reading sources to inline if needed.

## Sources

### Primary (HIGH confidence)
- **Codebase audit** -- content.config.ts schema, astro.config.mjs plugins, existing blog post patterns, component source code, global.css prose styles
- **npm ls** -- Verified astro@5.17.1, @astrojs/mdx@4.3.13, remark-gfm@4.0.1
- **Phase 117 outputs** -- sources.md (17 inline citations verified), outline.md (4-act structure with word budgets)
- **Phase 118 outputs** -- StatHighlight.astro, TermDefinition.astro, dark-code-cover.svg

### Secondary (MEDIUM confidence)
- [Astro MDX integration docs](https://docs.astro.build/en/guides/integrations-guide/mdx/) -- extendMarkdownConfig behavior confirmed
- [MDX GFM guide](https://mdxjs.com/guides/gfm/) -- GFM not default in MDX, requires remark-gfm plugin
- [Astro Markdown docs](https://docs.astro.build/en/guides/markdown-content/) -- Astro applies remark-gfm by default

### Tertiary (LOW confidence)
- [Footnote styling behavior](https://www.andrewhoog.com/posts/how-to-annotate-blog-posts-with-footnotes-in-astro/) -- Community post on Astro footnotes, used for general patterns only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies verified via npm ls and codebase inspection
- Architecture: HIGH -- patterns extracted from existing blog posts, component interfaces verified
- Pitfalls: HIGH -- identified from MDX documentation and codebase-specific analysis (untested footnotes, CSS drop cap, component slot parsing)
- Citation handling: MEDIUM -- footnote syntax is untested in this project's MDX pipeline (mitigated by early build test)

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable stack, no expected breaking changes)
