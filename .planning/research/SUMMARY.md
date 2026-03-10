# Project Research Summary

**Project:** Claude Code Guide — comprehensive developer guide integrated into patrykgolabek.dev
**Domain:** Multi-chapter technical guide (10-12 chapters) for Claude Code CLI, built on an existing Astro 5 portfolio site with established guide infrastructure
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

This project adds a comprehensive Claude Code guide to an existing Astro 5 portfolio site that already has a mature, proven guide architecture from the FastAPI Production Guide. The good news: no new npm dependencies are required. Every needed technology is already installed and every structural pattern is already proven. The work decomposes cleanly into infrastructure (making the existing single-guide system multi-guide), diagram creation (5 build-time SVG generators + 2 interactive React components following exact existing patterns), and content authoring (10-12 MDX chapters). The recommended approach is to treat this as an extension of the existing system, not a new system.

The key risk is not technical — it is content quality under rapid product evolution. Claude Code ships updates weekly (176 releases in 2025 alone), and the content research foundation is a 51-source NotebookLM corpus that carries a ~13% hallucination rate. Every factual claim must be independently verified against official documentation before any chapter is marked complete. A `lastVerified` frontmatter field must be added to the schema from day one to enable targeted freshness maintenance. The guide's competitive advantage is not comprehensive coverage (official docs do that) — it is practitioner perspective: how a 17+ year cloud-native architect integrates Claude Code into real production workflows, filtered through the same opinionated lens that made the FastAPI guide successful.

The second major risk is SEO positioning. Official Anthropic documentation ranks near-perfectly for all head keywords related to Claude Code features. The guide must target long-tail, workflow-oriented keywords that official docs do not cover ("Claude Code workflow for Kubernetes development", "Claude Code CI/CD patterns with GitHub Actions") and angle every chapter as practitioner opinion rather than feature documentation. Infrastructure work must precede all content work — 7 hardcoded single-guide assumptions in the existing codebase will silently break or exclude the new guide if not addressed first.

## Key Findings

### Recommended Stack

The stack verdict is unusually clean: zero new dependencies. The site already has Astro 5.17.1, @xyflow/react 12.10.1, dagre 2.0.4, astro-expressive-code 0.41.6, satori + sharp for OG images, and a proven build-time SVG diagram infrastructure. All languages needed for Claude Code config examples (JSON, JSONC, TOML, YAML, Bash, TypeScript, JavaScript, Markdown, Python) are already supported by installed Shiki grammars. The only structural change is generalizing content collections from single-guide to multi-guide.

**Core technologies (all already installed):**
- Astro 5.17.1: Static site generator, MDX rendering, content collections — no changes needed
- @xyflow/react 12.10.1 + @dagrejs/dagre 2.0.4: Interactive React Flow diagrams — proven by DeploymentTopology.tsx
- astro-expressive-code 0.41.6: Syntax highlighting with copy buttons — supports all needed languages
- satori 0.19.2 + sharp 0.34.5: Build-time OG image generation — extend existing og-cache.ts pattern
- diagram-base.ts (existing): SVG primitive helpers with CSS-variable theme support — reuse for all 5 new diagrams

**What is genuinely new (no new packages):**
- 5 build-time SVG diagram generators following the exact existing pattern (agentic loop, hook lifecycle, permission model, MCP architecture, agent teams)
- 2 interactive React Flow components (PermissionFlowExplorer, HookEventVisualizer)
- 1 new CodeBlock.astro for inline code snippets without GitHub source links
- Multi-guide content collection wiring in content.config.ts

See `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/research/STACK.md` for full analysis.

### Expected Features

The feature set splits cleanly between infrastructure already built, content to author, and differentiators to build. The must-have core is 10-12 MDX chapters with proper navigation, diagrams, and SEO metadata. The competitive differentiators are the programmatic SVG diagrams (no competing guide has them), the interactive visualizers, and the practitioner voice with real examples from the author's own repositories.

**Must have (table stakes):**
- Progressive 10-12 chapter structure with zero-to-hero progression — every competing guide uses this
- Sticky sidebar navigation with active state — already built in GuideSidebar.astro
- Prev/next chapter navigation — already built in GuideChapterNav.astro
- Syntax-highlighted code blocks with copy button — provided by astro-expressive-code
- File-path-annotated code blocks — new CodeBlock.astro (trivial to build)
- Per-chapter OG images — extend existing satori + sharp pipeline
- JSON-LD structured data (Article + BreadcrumbList) — already built in GuideJsonLd.astro
- In-page table of contents per chapter — existing TableOfContents.astro
- Guide landing page with chapter card grid — follow fastapi-production/index.astro pattern
- Callout/admonition blocks for warnings and tips — existing Callout.astro from blog components
- Cross-chapter linking — authoring discipline, no new component needed
- Chapter difficulty badges — small frontmatter field addition

**Should have (competitive differentiators):**
- 5-6 build-time SVG architecture diagrams (CLAUDE.md hierarchy, context window lifecycle, permission evaluation flowchart, hook event lifecycle, MCP server topology) — no competing guide has these
- Interactive context window visualizer (React island) — most misunderstood Claude Code topic, no visual exists anywhere
- CLAUDE.md starter templates with tabbed copy UI — more polished than FlorianBruniaux's raw GitHub files
- Real CLAUDE.md examples from author's own public repos — authentic practitioner credibility
- Companion blog post for bidirectional SEO traffic — proven pattern from FastAPI guide

**Defer to v1.x (post-launch validation):**
- FAQ page with FAQPage JSON-LD — write after observing actual reader questions
- Interactive MCP topology (React Flow upgrade from static SVG)
- Downloadable starter .claude/ config bundle — after template patterns stabilize

**Defer to v2+:**
- Agent team coordination interactive diagram — feature is still "research preview"
- GitHub Actions / CI dedicated chapter — deserves its own guide
- Translated versions — only if analytics show non-English demand

See `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/research/FEATURES.md` for full analysis including competitor comparison.

### Architecture Approach

The architecture follows a strict "parallel extension" pattern: add a `claude-code/` directory tree that mirrors the existing `fastapi-production/` tree at every layer (data, pages, components, OG images), modify 6 existing files to remove hardcoded single-guide assumptions, and add new SVG generators and React components following exact existing patterns. No new architectural patterns are introduced — the existing pattern set is comprehensive and proven.

**Major components:**
1. Content collections (content.config.ts + guide.json + MDX pages) — add `claudeCodeGuidePages` and `claudeCodeGuides` collections; reuse existing Zod schemas with one addition: `lastVerified` date field to guidePageSchema
2. Page generation layer (src/pages/guides/claude-code/) — parallel to fastapi-production; follows identical [slug].astro and index.astro patterns; OG images at parallel path
3. Build-time SVG diagram generators (src/lib/guides/svg-diagrams/) — 5 new TypeScript generators using existing diagram-base.ts primitives; wrapped by 5 new thin Astro components
4. Interactive React components (src/components/guide/claude-code/) — 2 React Flow components following DeploymentTopology.tsx pattern; loaded with client:visible
5. Modified shared infrastructure — GuideLayout.astro (parameterize companion link), GuideJsonLd.astro (parameterize isPartOf), routes.ts (remove hardcoded path), guides hub page (iterate all guides), astro.config.mjs sitemap builder (scan all guide.json files), llms.txt endpoints (iterate all guides)

**Key architectural constraint:** Use separate content collection per guide, not a unified multi-guide glob pattern. This matches the codebase convention (EDA has its own collections) and avoids runtime collection switching that conflicts with Astro's typed getCollection() API.

See `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/research/ARCHITECTURE.md` for full dependency-aware build order and component specifications.

### Critical Pitfalls

1. **Content staleness from rapid Claude Code evolution** — Add `lastVerified` frontmatter field to schema from day one; verify every factual claim against official docs before marking any chapter complete; quarantine volatile content (specific flags, exact syntax) into dated callout boxes; structure chapters around durable concepts not specific commands
2. **Hardcoded single-guide assumptions breaking multi-guide architecture** — Must be fixed FIRST before any content work; 7 specific hardcoded locations catalogued by file and line number: content.config.ts (2), astro.config.mjs, guides hub page, llms.txt, llms-full.txt, GuideLayout companion link — all must be refactored and tested before adding any Claude Code content
3. **SEO cannibalization with official Anthropic documentation** — Angle every chapter as practitioner workflow not feature documentation; run keyword gap analysis before writing each chapter; no chapter title should match an official docs section header
4. **NotebookLM hallucination and interpretive overconfidence** — Treat NotebookLM output as outline draft only; build a feature verification checklist per chapter; every Claude Code behavior mentioned must have a corresponding current official docs entry or recent CHANGELOG confirmation
5. **Breaking the /guides/ hub page and supporting pages** — Hub page uses `[guideMeta]` destructure (takes only first guide); llms.txt and llms-full.txt have the same bug; sitemap builder hardcodes FastAPI path; all three must be fixed in the infrastructure phase

See `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/research/PITFALLS.md` for full analysis including recovery strategies and "looks done but isn't" verification checklist.

## Implications for Roadmap

Based on combined research, the build order is strictly constrained by dependency analysis. Infrastructure must precede content. Diagrams can be built in parallel with early content chapters. Interactive components come after static diagrams are proven.

### Phase 1: Infrastructure Refactoring
**Rationale:** 7 hardcoded single-guide assumptions in the existing codebase will silently break or exclude Claude Code guide content if not fixed first. Changes touch existing shipping code and carry real regression risk. Test gate: FastAPI guide renders identically after all changes; build succeeds without errors.
**Delivers:** Multi-guide-capable codebase; content collection system ready for Claude Code MDX; hub page, sitemap, and llms.txt iterate all guides; GuideLayout and GuideJsonLd are parameterized
**Addresses:** Pitfalls 2 and 6 (hardcoded single-guide assumptions, hub page breakage)
**Modifies existing files:** content.config.ts, astro.config.mjs, GuideLayout.astro, GuideJsonLd.astro, routes.ts, guides/index.astro, llms.txt.ts, llms-full.txt.ts, fastapi-production/[slug].astro

### Phase 2: Content Schema and Guide Metadata
**Rationale:** Schema changes and guide.json creation are prerequisites for all content and page work. Adding `lastVerified` to guidePageSchema must happen before any MDX files are authored so the field is present from the start, not backfilled.
**Delivers:** Extended guidePageSchema with `lastVerified` date field; claude-code/guide.json with full chapter list; stub introduction.mdx for pipeline validation; content collections registered and type-checking
**Addresses:** Pitfall 1 (content staleness — `lastVerified` field established at schema level)
**Uses:** Existing guideMetaSchema and guidePageSchema from schema.ts (additive only)

### Phase 3: Page Routes and OG Images
**Rationale:** Route scaffolding enables testing the full page generation pipeline before investing in heavy content and diagram work. Once routes exist, chapter MDX files can be added incrementally without structural risk.
**Delivers:** /guides/claude-code/ landing page; /guides/claude-code/[slug] chapter routing; OG image endpoints for landing and all chapters; hub page showing both guides
**Addresses:** Pitfall 2 completion (OG image endpoints)
**Uses:** Existing satori + sharp + og-cache.ts pipeline

### Phase 4: CodeBlock Component
**Rationale:** All Claude Code guide code examples are inline (no template repo), so CodeBlock.astro must exist before content authoring begins. Small, focused, low-risk — build it early so it is available for all chapters.
**Delivers:** CodeBlock.astro wrapping astro-expressive-code with file-path header but no GitHub source link
**Implements:** Pattern 3 (Inline Code Blocks) from ARCHITECTURE.md

### Phase 5: SVG Diagram Generators
**Rationale:** Diagrams are independent of chapter prose and can be built in parallel with early chapter drafts. Building them early establishes a visual vocabulary that informs how chapters are written. All 5 follow the same diagram-base.ts pattern — batch work is efficient.
**Delivers:** 5 SVG generator functions (agentic-loop.ts, hook-lifecycle.ts, permission-model.ts, mcp-architecture.ts, agent-teams.ts); 5 Astro wrapper components; barrel export updates in svg-diagrams/index.ts
**Implements:** Pattern 2 (Build-Time SVG Diagram Generators) from ARCHITECTURE.md
**Performance constraint:** Each diagram under 50KB and 250 lines (established bounds from existing diagrams: 94-252 lines)

### Phase 6: Interactive React Components
**Rationale:** React islands add client-side JavaScript weight and must be capped at 2 total to control bundle size. Build these after diagrams are proven so the decision to add interactivity is informed by whether the static version is already sufficient.
**Delivers:** PermissionFlowExplorer.tsx (permission decision tree with clickable nodes); HookEventVisualizer.tsx (hook event sequence with payload reveal)
**Uses:** @xyflow/react + @dagrejs/dagre following DeploymentTopology.tsx pattern exactly
**Performance constraint:** client:visible loading; each component under 30KB gzipped; max 2 React islands per chapter page

### Phase 7: MDX Chapter Content
**Rationale:** Content is the primary deliverable. By this phase, all infrastructure, diagrams, and components are ready. Each chapter can be authored and verified independently.
**Delivers:** 10-12 MDX chapter files with prose, diagrams, code blocks, callouts, cross-links, difficulty badges, `lastVerified` dates, and in-page table of contents
**Critical process requirement:** Feature verification checklist per chapter — every Claude Code behavior mentioned must be confirmed in current official docs or recent CHANGELOG before chapter is marked complete. This directly addresses Pitfalls 1 and 5.
**Content strategy:** Angle chapters as practitioner workflows, not feature reference; target long-tail keywords after running keyword gap analysis per chapter before writing; keep chapters to 2000-3000 words maximum. Addresses Pitfalls 3 and 4.

### Phase 8: SEO, Polish, and Post-Launch Enhancements
**Rationale:** FAQ, companion blog post, and enhanced interactive features are high-value but depend on chapter content being finalized. These are the v1.x post-launch additions that SEO value compounds over time.
**Delivers:** FAQ page with FAQPage JSON-LD; companion blog post targeting broad queries with cross-links to all chapters; CLAUDE.md starter templates with tabbed UI; before/after comparison blocks; Lighthouse audit and Google Rich Results structured data validation
**Addresses:** Pitfall 4 completion (SEO cannibalization — companion blog post creates two-pronged traffic strategy)

### Phase Ordering Rationale

- Infrastructure first is non-negotiable: 7 hardcoded assumptions cause silent failures if not fixed before content is added
- Schema before content: prevents needing to backfill `lastVerified` fields across all 10-12 chapters after the fact
- Diagrams (Phase 5) before content (Phase 7): authors can reference diagram component names in MDX from the start
- Interactive components (Phase 6) after static diagrams (Phase 5): upgrades a static diagram to interactive only where the static version proves insufficient
- FAQ and blog post (Phase 8) last: FAQ emerges from actual chapter content; blog post must link to finalized chapter URLs

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 7 (Chapter Content):** Each chapter needs a keyword gap analysis before writing to avoid SEO cannibalization with official docs. Also requires a feature verification checklist built from current official docs — these docs must be re-read at content authoring time, not treated as current from this research snapshot.
- **Phase 5 (SVG Diagrams — hook lifecycle specifically):** The hook lifecycle diagram (DIAG-CC-02) is the most complex of the five, covering 17+ hook events with branching execution paths. The complete list of hook events and their payload schemas should be pulled fresh from official docs immediately before implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Infrastructure):** The 7 hardcoded locations are fully catalogued by file and line number. The fixes are mechanical refactors following established patterns.
- **Phase 3 (Page Routes / OG):** Follows the exact fastapi-production page and OG pattern. No unknown territory.
- **Phase 4 (CodeBlock component):** Trivially small component wrapping existing astro-expressive-code. Pattern fully specified in ARCHITECTURE.md.
- **Phase 6 (Interactive React):** Follows DeploymentTopology.tsx pattern exactly. Node/edge specifications documented in ARCHITECTURE.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against installed versions. Zero new dependencies confirmed. Pattern compatibility confirmed by existing DeploymentTopology.tsx, diagram-base.ts, og-cache.ts usage. |
| Features | HIGH | Feature set verified against official Anthropic docs (overview, permissions, hooks, skills, MCP, memory, agent teams). Competitor analysis conducted on 5 competing guides. Feature prioritization grounded in existing site capabilities. |
| Architecture | HIGH | Based on direct codebase analysis of all integration points. 7 hardcoded single-guide assumptions identified by file and line number. Dependency-aware build order derived from actual file dependencies, not assumptions. |
| Pitfalls | HIGH | Pitfalls grounded in direct codebase inspection (7 hardcoded paths verified by line number), Claude Code CHANGELOG.md (release cadence confirmed: 176 updates in 2025), NotebookLM hallucination research (arxiv study: 13% rate), and OG image build-time benchmarks (documented case studies: 100-300ms per image). |

**Overall confidence:** HIGH

### Gaps to Address

- **Chapter keyword strategy:** Keyword gap analysis per chapter must be conducted during Phase 7 planning at writing time, not during this research phase. The research establishes the approach (target long-tail workflow keywords), but specific keywords for each of 10-12 chapters require checking actual SERPs given how rapidly the Claude Code ecosystem evolves.
- **`lastVerified` schema impact on OG image caching:** The og-cache.ts system uses title + description to compute the cache hash. Adding `lastVerified` to guidePageSchema is confirmed necessary, but the impact on OG image cache invalidation (should `lastVerified` date changes trigger new OG images?) needs to be decided at implementation time.
- **guide.json `templateRepo` field for Claude Code:** The guideMetaSchema requires a `.url()` validated `templateRepo` field. Claude Code has no template repo. Confirmed approach is to use official Anthropic docs URL, but this should be validated against the Zod schema at implementation time.
- **Agent Teams chapter scope:** Agent Teams shipped March 7, 2026 as "research preview." The feature may change significantly before GA. The chapter should exist at launch (it is a genuine differentiator), but content must be scoped conservatively with explicit "research preview" warnings and the tightest `lastVerified` maintenance cadence of any chapter.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: content.config.ts, astro.config.mjs, GuideLayout.astro, GuideJsonLd.astro, routes.ts, guides/index.astro, llms.txt.ts, llms-full.txt.ts, diagram-base.ts, DeploymentTopology.tsx, og-cache.ts, schema.ts — all integration points verified by file and line number
- [Claude Code Official Docs](https://code.claude.com/docs/en/overview) — feature surface, permissions, hooks, skills, MCP, memory, agent teams verified at research date
- [Claude Code CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) — 176 updates in 2025; /simplify, /batch, HTTP hooks (March 3 2026); Agent Teams, Automatic Memories (March 7 2026)

### Secondary (MEDIUM confidence)
- [FlorianBruniaux/claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide) — most comprehensive community guide (22K+ lines, 41 Mermaid diagrams); primary competitor analysis source
- [alexop.dev - Understanding Claude Code's Full Stack](https://alexop.dev/posts/understanding-claude-code-full-stack/) — conceptual layer dependency analysis
- [adityabawankule.io - Claude Code Complete Guide](https://www.adityabawankule.io/guides/claude-code-complete-guide) — web-hosted guide with sidebar nav
- [NotebookLM Hallucination Research - arxiv](https://arxiv.org/html/2509.25498v1) — 13% hallucination rate, interpretive overconfidence as primary error mode
- [Astro OG Image Caching - ainoya.dev](https://ainoya.dev/posts/astro-ogp-build-cache/) — build time benchmarks: 100-300ms per satori+sharp image

### Tertiary (LOW confidence — validate at authoring time)
- [Claude Code Cron Scheduling - winbuzzer.com](https://winbuzzer.com/2026/03/09/anthropic-claude-code-cron-scheduling-background-worker-loop-xcxwbn/) — March 2026 feature announcement; validate against official docs before including in chapter
- [claudefa.st Agent Teams guide](https://claudefa.st/blog/guide/agents/agent-teams) — practical agent teams patterns; all claims must be verified against official docs at chapter authoring time

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
