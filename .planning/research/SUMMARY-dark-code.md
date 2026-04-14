# Project Research Summary

**Project:** Dark Code — Long-Form Thought-Leadership Blog Post
**Domain:** Standalone MDX blog post on existing Astro 5 portfolio site (patrykgolabek.dev)
**Researched:** 2026-04-14
**Confidence:** HIGH

## Executive Summary

The "Dark Code" blog post is a 3000-5000 word thought-leadership essay coining a new term for production code nobody understands — code that runs, ships, and degrades without anyone owning its meaning. The essay follows a proven narrative arc (wake-up call → AI acceleration → why fixes fail → framework → practical defense) and draws from 48 NotebookLM research sources spanning GitClear's 2024-2025 code quality reports, Anthropic's RCT on coding skill formation, Addy Osmani's "Comprehension Debt," OWASP supply chain findings, and DX's Code Rot research. This is a content-dominant project: the site already has everything needed technically, and the work is almost entirely writing and one targeted code update.

The recommended approach is to write first, integrate second, verify third. The Astro 5 site's content collection auto-discovery means a single new MDX file at `src/data/blog/dark-code.mdx` activates 14 build pipelines automatically — blog listing, tag pages, RSS, OG image, sitemap, LLMs.txt, related posts, and all JSON-LD. Only one code file requires a manual edit: `src/pages/blog/[slug].astro` needs a new per-post boolean to set `articleSection` and optionally inject FAQPage structured data. Two new Astro components (`StatHighlight` and `TermDefinition`) are needed to deliver the differentiating visual moments — both are zero-dependency and follow the site's existing component patterns. No new npm packages, no config changes, no new collections.

The dominant risks are not technical — they are editorial. The essay's authority rests on 48 sources, and that density creates two failure modes: source hallucination (dead or misattributed citations destroy credibility immediately) and word count bloat (the wake-up call section swells to 2000 words while the framework — the actual value — gets squeezed). A third risk is voice: writing a research-backed essay with AI assistance at this source density produces "assembled" content rather than "considered" content. Patryk Golabek's 17 years of production engineering experience is the only thing the 48 sources cannot provide, and the essay must lead from that perspective, not from the literature.

## Key Findings

### Recommended Stack

No new dependencies are required. The existing site stack — Astro 5.3, `@astrojs/mdx` 4.3.13, `@tailwindcss/typography` 0.5.19, `astro-expressive-code` 0.41.6 — is fully sufficient. GFM footnotes are available for free via `remark-gfm` (bundled in the MDX integration, enabled by default). The recommended citation pattern for a thought-leadership essay is inline hyperlinks (not footnotes), matching the pattern established by "The Beauty Index."

**Core technologies:**
- `@astrojs/mdx` — MDX authoring with component imports; footnotes available via GFM if needed
- `@tailwindcss/typography` — prose styling for headings, blockquotes, lists; covers long-form layout
- `astro-expressive-code` — syntax-highlighted code blocks for concrete "dark code" examples
- `satori + sharp` — OG image generation pipeline; auto-activates from frontmatter; no changes needed
- `remark-reading-time` — auto-computes reading time from word count; will show ~15-20 min for a 4000-word post

**New components needed (zero dependencies, follow existing patterns):**
- `StatHighlight.astro` — large number + label + source; most shareable visual unit in data-driven essays
- `TermDefinition.astro` — dictionary-entry-style block for the "Dark Code" definition moment; used once
- `PullQuote.astro` — visual break for shareable pull quotes (P2; not blocking for launch)

**What NOT to use:** `rehype-citation` (BibTeX overkill), footnotes/endnotes system (breaks reading flow on web), animated counter components (adds client JS for a static page), any interactive visualization (D3/Chart.js adds complexity without matching the essay's prose-argumentation strength).

### Expected Features

**Must have for launch (P1):**
- `OpeningStatement` with a bold, opinionated first-person thesis — not a topic introduction
- `TldrSummary` with 5-6 bullet points (mandatory for a 15+ minute read; Google speakable schema targets `[data-tldr]`)
- 6-8 H2 sections with argument-as-heading titles (e.g., "Your Codebase Has a Shadow" not "Dark Code Overview")
- `TermDefinition` component for the "Dark Code" definition moment — the essay's most shareable single block
- `StatHighlight` component for 4-6 key data points (GitClear 4x code clones, Anthropic 17% mastery drop, 41% higher churn)
- Inline hyperlinked citations to 20-30 of the 48 sources — not all 48, not footnotes
- 2-3 `KeyTakeaway` blocks at narrative pivot points
- 2-3 `Callout` boxes for warnings and tips
- 2-3 code blocks showing recognizable "dark code" patterns (a gap vs. all competitor posts)
- Cover/hero SVG in `public/images/dark-code-cover.svg` — required for social sharing identity
- Frontmatter: `title`, `description` (thesis statement, not topic summary), `publishedDate`, `tags`, `coverImage`, `draft: false`
- JSON-LD BlogPosting: `articleSection` + `wordCount` via `[slug].astro` update
- 3-5 internal cross-links to existing posts ("Death by a Thousand Arrows," "The Beauty Index," AI content)

**Should have, add within one week of publication (P2):**
- `PullQuote` component — enhances visual rhythm, designed for social screenshot sharing
- FAQ section with 4-6 questions targeting real search queries ("What is dark code?", "How do I find dark code?")
- `FAQPageJsonLd` entries in `[slug].astro` — significant Google rich results value
- Reciprocal cross-link FROM "Death by a Thousand Arrows" TO the Dark Code post

**Defer to v2+:**
- Static SVG data chart (only if StatHighlight blocks feel insufficient)
- "Dark Code Score" calculator tool page (extends the framework if it resonates)
- Audio narration / NotebookLM podcast version

### Architecture Approach

The site uses a single-file content collection pattern: drop `dark-code.mdx` in `src/data/blog/` and 14 pipelines activate automatically via `getCollection('blog')`. The only file requiring manual modification is `src/pages/blog/[slug].astro`, which uses hardcoded per-post boolean checks to enrich JSON-LD with `articleSection`, `aboutDataset`, and optional `FAQPageJsonLd`. The cover image SVG goes in `public/images/` (not `src/`) because the OG image generator reads from the public directory. All component imports in MDX use the established path `../../components/blog/`.

**Files to create (2):**
1. `src/data/blog/dark-code.mdx` — the post itself; frontmatter + MDX content
2. `public/images/dark-code-cover.svg` — cover image for social sharing and OG card

**Files to modify (1):**
1. `src/pages/blog/[slug].astro` — add `isDarkCodePost` boolean, `articleSection: 'Software Engineering'`, optional FAQ JSON-LD

**Files that need NO changes (auto-integrate):** `src/content.config.ts`, blog listing page, tag pages, RSS feed, LLMs.txt generators, OG image generator, sitemap, IndexNow integration, reading time plugin, table of contents component.

**Key patterns to follow:**
- `not-prose` class on all new components to escape typography defaults
- CSS custom properties (`--color-accent`, `--color-surface-alt`) for theme compatibility
- `<slot />` for content projection in new components
- Lowercase kebab-case filename (`dark-code.mdx`) — the filename becomes the URL slug
- External links in MDX as raw HTML with `target="_blank" rel="noopener noreferrer"` — not standard Markdown links

### Critical Pitfalls

1. **Source hallucination and dead citation links** — With 48 sources and AI-assisted drafting, citation URLs can be constructed from memory rather than verified. One dead link destroys the essay's authority. Prevention: create a `sources.md` reference file with every URL clicked and verified BEFORE writing begins. Run `npx linkinator` after drafting. Recovery cost is HIGH post-publication.

2. **Word count bloat in the wake-up call section** — 48 alarming data sources create sunk-cost pressure to deploy all of them in Act 1. The result: 2000 words of doom before the framework arrives. Prevention: hard word budgets per section (wake-up call max 1000 words; framework 1200-1500 words; practical defense 800-1200 words). Cite the 8 best sources inline; put the rest in Further Reading.

3. **Essay reads like an AI literature review, not a human perspective** — "Assembled" content (facts organized) is not "considered" content (facts interpreted by someone with earned perspective). Prevention: write the opening paragraph and thesis BEFORE consulting sources. Every section must make a claim first, then support it. Include 2-3 first-person experience observations. Recovery cost is HIGH — requires substantive rewrite.

4. **Tag taxonomy mismatch creating orphaned tag pages** — Novel tags produce thin single-post tag pages with no SEO value and break the related-posts algorithm. Prevention: use existing tags `code-quality`, `ai`, `software-aesthetics` as the core set; accept at most ONE new tag (`dark-code`) alongside 3-4 established tags. Verify Related Articles sidebar shows 3+ posts after build.

5. **JSON-LD incomplete from missing `[slug].astro` update** — The post renders in the browser but has no `articleSection`, no `about` property, and no FAQ schema. Prevention: the `[slug].astro` update must be in the same commit as the MDX file, not a deferred follow-up.

6. **Missing or unverified OG image** — OG images are invisible during local browser testing; the post looks fine but shares as a blank card on LinkedIn and Twitter. Prevention: visit `/open-graph/blog/dark-code.png` locally; use Twitter Card Validator and LinkedIn Post Inspector after deployment.

## Implications for Roadmap

Based on combined research, the project maps cleanly to five phases driven by one core dependency chain: verified sources → written content → new components → integration → publish verification.

### Phase 1: Source Verification and Outline

**Rationale:** Citation integrity cannot be retrofitted after writing. Every source URL must be verified before it appears in the essay. The outline must include per-section word budgets to prevent Act 1 bloat before writing begins.

**Delivers:** A verified `sources.md` with 48 sources (URL, claim, date accessed); a structured outline with argument-as-heading section titles and word budgets; 20-30 pre-selected inline sources identified.

**Avoids:** Source hallucination (Pitfall 1), word count bloat (Pitfall 2).

**Research flag:** NotebookLM already has all 48 sources — use it to synthesize and surface the strongest 8-10 data points. No `/gsd-research-phase` needed.

### Phase 2: New Component Development

**Rationale:** `StatHighlight` and `TermDefinition` must exist before writing begins, because the essay is structured around these visual moments. Building components first means the writer can drop `<StatHighlight>` inline during drafting without context-switching.

**Delivers:** `src/components/blog/StatHighlight.astro`, `src/components/blog/TermDefinition.astro`, and optionally `src/components/blog/PullQuote.astro`. Each follows the existing `not-prose` + CSS variable + `<slot />` component pattern.

**Uses:** Existing Tailwind CSS custom properties, `@tailwindcss/typography` prose escaping, established component architecture from 8 existing blog components.

**Avoids:** Context-switching interruptions during writing; retrofitting components into a completed draft.

**Research flag:** Standard Astro component patterns — no research phase needed. Pattern is fully exemplified by `src/components/blog/*.astro`.

### Phase 3: Content Authoring

**Rationale:** Writing is the dominant work of this project. It must follow the outline and word budgets from Phase 1 and use the components built in Phase 2. The essay must be written from the author's perspective first (claim → evidence), not from the literature outward.

**Delivers:** Complete draft MDX file at `src/data/blog/dark-code.mdx` with `draft: true`, all components used, 20-30 inline citations verified against `sources.md`, cover image SVG at `public/images/dark-code-cover.svg`, 3-5 internal cross-links to existing posts, all required frontmatter fields.

**Addresses:** All P1 features — OpeningStatement, TldrSummary, TermDefinition, StatHighlight, KeyTakeaways, Callouts, code blocks, FAQ content, tags.

**Avoids:** AI literature review voice (Pitfall 8 — use first-person observations and argument-first structure), word count bloat (Pitfall 2 — enforce section word budgets), tag taxonomy mismatch (Pitfall 3 — use `code-quality`, `ai`, `software-aesthetics` + one new tag).

**Research flag:** No research phase needed — sources are in NotebookLM, outline is completed in Phase 1. This phase is pure authoring.

### Phase 4: Integration and SEO Enrichment

**Rationale:** After the draft is complete, all integration work happens in one focused pass so nothing is forgotten. The `[slug].astro` update is the one manual step the auto-discovery pipeline cannot handle.

**Delivers:** Updated `src/pages/blog/[slug].astro` with `isDarkCodePost` boolean, `articleSection: 'Software Engineering'`, `about` object, and FAQ JSON-LD entries. Draft flag set to `false`.

**Avoids:** JSON-LD incomplete (Pitfall 6), LLMs.txt description quality (Pitfall 4 — dynamic generation works, but frontmatter `description` must be a thesis statement, not a topic summary).

**Research flag:** Standard codebase pattern — no research phase needed. Pattern established by 7 existing posts in `[slug].astro`.

### Phase 5: Build Verification and Publish

**Rationale:** The 14 auto-integrations create 14 failure modes. Each must be explicitly checked before IndexNow fires and Google is notified. Social card verification is explicitly required because OG images are invisible during local browser testing.

**Delivers:** Published post at `patrykgolabek.dev/blog/dark-code/` with verified OG image, JSON-LD validated by Google Rich Results Test, tag pages and related posts sidebar confirmed, LLMs.txt entry verified, social card preview checked via Twitter Card Validator and LinkedIn Post Inspector. Reciprocal cross-link added to "Death by a Thousand Arrows."

**Avoids:** Missing OG image (Pitfall 5), tag orphan pages (Pitfall 3 verification), JSON-LD gaps (Pitfall 6 verification), LLMs.txt quality (Pitfall 4 verification).

**Research flag:** Checklist-driven — no research phase needed. PITFALLS.md contains the full 13-item "Looks Done But Isn't" checklist.

### Phase Ordering Rationale

- Source verification must precede writing because citation retrofitting post-publication has HIGH recovery cost (Pitfall 1).
- Component development must precede writing because the essay's structure depends on `StatHighlight` and `TermDefinition` existing as concrete tools during drafting; retrofitting components into a completed draft is disruptive.
- Integration follows writing because `[slug].astro` updates require knowing the final post ID, tags, and whether FAQ content was written.
- Verification is the final gate because it catches the 6 "looks done but isn't" failures that are invisible during development.

### Research Flags

Phases needing deeper research during planning:
- **None.** All 48 sources are already gathered in NotebookLM. The site architecture is fully documented. Component patterns are established. This project is unusually well-researched before execution begins.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Component Development):** Astro component patterns are documented and exemplified by 8 existing blog components. No ambiguity.
- **Phase 4 (Integration):** The `[slug].astro` enrichment pattern is used by 7 existing posts. Zero open questions.
- **Phase 5 (Verification):** PITFALLS.md provides the complete checklist with specific URLs and tools.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase verification — `package.json`, `astro.config.mjs`, `content.config.ts`, all component files read. Zero ambiguity about what exists and what is needed. No new dependencies required. |
| Features | HIGH | Grounded in competitor analysis (Osmani, DX, GitClear) and direct audit of 8 existing blog components. Feature prioritization is clear and sequenced with explicit P1/P2/v2+ tiers. |
| Architecture | HIGH | Direct analysis of all 14 auto-integration pipelines, 14 existing posts as pattern references, and exact file paths confirmed. Single-file content collection pattern is fully verified. |
| Pitfalls | HIGH | 8 critical pitfalls identified via direct codebase analysis plus external research on citation integrity and thought-leadership writing. Each has prevention strategy, warning signs, and recovery cost estimate. |

**Overall confidence:** HIGH

The research is unusually thorough for a content project. The main execution risk is not knowledge — it is discipline: enforcing word budgets, writing from experience rather than from sources, and completing the 13-item verification checklist before publish.

### Gaps to Address

- **Cover image design direction:** Research confirms a custom SVG cover is required and must evoke production code running in shadow — dark, networked, invisible. The specific visual concept is an authoring decision, not a research gap.
- **Exact FAQ questions:** Research confirms FAQPage JSON-LD is valuable and 4-6 questions are appropriate. Final question selection depends on the completed essay content and what the framework naturally answers.
- **Framework name:** The post must propose a named framework (e.g., "The Dark Code Spectrum," "The Four Vectors of Darkness"). The name will crystallize during writing. The architecture for a named framework with a table or visual is fully ready.

## Sources

### Primary (HIGH confidence — direct codebase verification)

- `src/content.config.ts` — blog collection Zod schema, verified field set
- `src/pages/blog/[slug].astro` — per-post JSON-LD enrichment pattern, 362 lines reviewed
- `src/pages/open-graph/[...slug].png.ts` — OG image pipeline, auto-generation logic
- `src/pages/llms.txt.ts` and `llms-full.txt.ts` — dynamic LLMs.txt generation
- `src/pages/blog/tags/[tag].astro` — tag page generation and related posts algorithm
- `src/components/blog/*.astro` (8 components) — existing component patterns
- `astro.config.mjs` — sitemap, reading time, expressive code configuration
- `package.json` — confirmed `remark-gfm` bundled in `@astrojs/mdx`; no new packages needed

### Primary (HIGH confidence — competitor analysis)

- [Addy Osmani, "Comprehension Debt" (March 2026)](https://addyosmani.com/blog/comprehension-debt/) — structural and shareability reference for coined-term posts
- [DX, "Code Rot and Productivity" (October 2025)](https://getdx.com/blog/code-rot/) — competitor post format analysis
- [GitClear, "AI Copilot Code Quality 2025"](https://www.gitclear.com/ai_assistant_code_quality_2025_research) — primary data source (211M lines analyzed; 4x code clone growth)
- [Anthropic RCT, "AI Assistance and Coding Skills"](https://www.anthropic.com/research/AI-assistance-coding-skills) — 17% mastery drop finding (52-engineer RCT)
- [GitHub Blog, "Open Source Vulnerability Trends"](https://github.blog/security/supply-chain-security/a-year-of-open-source-vulnerability-trends-cves-advisories-and-malware/) — 69% malware advisory increase

### Secondary (MEDIUM confidence — methodology research)

- [Hallucinated citations in scientific literature (Nature, 2026)](https://www.nature.com/articles/d41586-026-00969-z) — citation integrity risk quantification (2.6% hallucination rate in 2025)
- [Animalz, "Thought Leadership Content"](https://www.animalz.co/blog/thought-leadership-content) — assembled vs. considered content distinction
- [Number Analytics, "Pull Quotes and Callouts"](https://www.numberanalytics.com/blog/ultimate-guide-pull-quotes-callouts) — editorial component design patterns
- [Astro MDX Integration Docs](https://docs.astro.build/en/guides/integrations-guide/mdx/) — GFM footnote support verification

---
*Research completed: 2026-04-14*
*Ready for roadmap: yes*
