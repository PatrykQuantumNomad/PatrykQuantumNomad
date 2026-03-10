# Pitfalls Research

**Domain:** Adding a comprehensive Claude Code guide to an existing Astro 5 portfolio site (1082 pages, established guide infrastructure from FastAPI guide)
**Researched:** 2026-03-10
**Confidence:** HIGH (grounded in direct codebase analysis of 7 hardcoded integration points, verified against Claude Code changelog and official docs, confirmed NotebookLM hallucination research)

## Critical Pitfalls

### Pitfall 1: Content Staleness from Rapid Claude Code Evolution

**What goes wrong:**
Claude Code shipped 176 updates in 2025 alone and continues at a pace of roughly weekly releases in 2026. Feature names, CLI flags, configuration syntax, and even core concepts (CLAUDE.md, Skills, hooks, Agent SDK) change or appear between guide drafts and publication. A guide written against the February 2026 feature set was already partially stale by March 3, 2026 when `/simplify`, `/batch`, HTTP hooks, and worktree-shared project configs all shipped in a single release. By March 7, Automatic Memories and Agent Teams arrived. Readers encounter instructions that reference deprecated flags, missing features, or outdated workflows. The guide loses credibility and SEO authority when users bounce because instructions do not match their version.

Unlike the FastAPI guide (which pins to a semver-tagged template repo), Claude Code has no stable versioning scheme for features -- the tool auto-updates in the background, so all users are always on the latest version. There is no way to tell a reader "install Claude Code v2.3" because version pinning is not a user-facing concept.

**Why it happens:**
NotebookLM sources (51 documents) capture a snapshot in time. These sources include blog posts, changelogs, and community guides from varying dates. Claude Code's feature surface shifts weekly. Writers assume the content they researched is still current by the time they publish. The FastAPI guide avoided this because it referenced a tagged, immutable codebase.

**How to avoid:**
1. Anchor every chapter to behaviors verified against the official docs at code.claude.com/docs/en/overview and the CHANGELOG at github.com/anthropics/claude-code/blob/main/CHANGELOG.md -- not just NotebookLM sources.
2. Add a `lastVerified` date field to the guide page schema (extend `guidePageSchema` in `src/lib/guides/schema.ts`). Render this date prominently on each chapter page via GuideLayout.
3. Structure chapters around durable concepts (memory system, tool access, project configuration, CI/CD integration, multi-agent patterns) rather than specific flags or slash commands that change monthly.
4. Quarantine volatile content (specific flag names, exact command syntax, pricing details, model names) into clearly marked callout boxes labeled "Current as of [date]" that are easy to update without rewriting entire chapters.
5. Build a lightweight update checklist: before each site deploy, diff the official CHANGELOG.md against the guide's `lastVerified` dates. If breaking changes exist, update the affected callout boxes.

**Warning signs:**
- NotebookLM sources are more than 4 weeks old at time of content authoring
- Chapter text references specific CLI flags (e.g., `--from-pr`, `/simplify`) without marking them as version-specific
- No `lastVerified` date visible on chapter pages
- Official Claude Code docs structure has diverged from guide chapter structure
- Guide mentions a feature that has been renamed or removed in a recent changelog

**Phase to address:**
Content schema phase (add `lastVerified` frontmatter field) and every content authoring phase (verify against official docs before marking chapter complete). This is the single highest priority pitfall -- it is unique to guides about rapidly-evolving tools and has no equivalent in the FastAPI guide.

---

### Pitfall 2: Hardcoded Single-Guide Assumptions Breaking Multi-Guide Architecture

**What goes wrong:**
The existing guide infrastructure has at least 7 locations with hardcoded `fastapi-production` references that will silently break or exclude a second guide:

1. **`src/content.config.ts` lines 54-57:** The `guidePages` collection loader hardcodes `base: './src/data/guides/fastapi-production/pages'`. A Claude Code guide's MDX files in `./src/data/guides/claude-code/pages` will not be loaded into any collection.
2. **`src/content.config.ts` lines 59-62:** The `guides` collection loader hardcodes `file('src/data/guides/fastapi-production/guide.json')`. A Claude Code `guide.json` will not be loaded.
3. **`astro.config.mjs` lines 47-59:** The `buildContentDateMap()` function reads `./src/data/guides/fastapi-production/guide.json` directly via `readFileSync`. Claude Code guide pages will have no `lastmod` in the sitemap.
4. **`src/pages/guides/index.astro` line 13:** Destructures `const [guideMeta] = await getCollection('guides')` -- takes only the first guide, silently ignoring any second guide.
5. **`src/pages/llms.txt.ts` line 15 and `src/pages/llms-full.txt.ts` line 42:** Same `[guideMeta]` destructure pattern.
6. **`src/pages/open-graph/guides/fastapi-production/[slug].png.ts`:** OG image endpoint is nested under the `fastapi-production` path. No equivalent exists for `claude-code`.
7. **`src/pages/guides/fastapi-production/[slug].astro` and `index.astro`:** Page templates are guide-specific directories.

Adding a Claude Code guide without refactoring these hardcoded paths will cause the new guide's pages to either not build at all, be missing from the sitemap and llms.txt, or have no OG images.

**Why it happens:**
The FastAPI guide was the first and only guide (v1.15 milestone). The architecture was designed to be "future-proofed" with a `/guides/` hub page and generic route helpers (`guidePageUrl`, `guideLandingUrl`), but the content collections, sitemap builder, LLM endpoints, and OG image generators all hardcode the single guide's path. This is completely reasonable for a first guide -- it avoided over-engineering. But adding a second guide requires making these paths generic.

**How to avoid:**
1. Create separate content collections for the Claude Code guide: `claudeCodePages` (glob loader on `./src/data/guides/claude-code/pages`) and add Claude Code's `guide.json` to the existing `guides` collection by switching the `file()` loader to a `glob()` or `file()` that loads from a pattern matching all guide.json files.
2. Create guide-specific page directories: `src/pages/guides/claude-code/[slug].astro`, `src/pages/guides/claude-code/index.astro`, `src/pages/guides/claude-code/faq.astro`.
3. Create guide-specific OG endpoints: `src/pages/open-graph/guides/claude-code/[slug].png.ts` and `src/pages/open-graph/guides/claude-code.png.ts`.
4. Refactor `astro.config.mjs` to iterate over all `src/data/guides/*/guide.json` files for sitemap dates.
5. Refactor `src/pages/guides/index.astro` to iterate over all guides from the collection, not destructure the first one.
6. Refactor `llms.txt` and `llms-full.txt` to iterate over all guides.
7. Test that the FastAPI guide continues to build correctly after all infrastructure changes.

**Warning signs:**
- `getCollection('guides')` with array destructuring `[guideMeta]` instead of iteration
- Claude Code guide pages missing from sitemap (`grep claude-code dist/sitemap-0.xml` returns nothing)
- No OG images generated for Claude Code chapters
- `/guides/` hub page only showing FastAPI guide
- Build succeeds but Claude Code guide pages are silently not generated

**Phase to address:**
FIRST phase of the milestone. Infrastructure refactoring must happen before any content authoring. Attempting content first will create a tangled mess of duplicated templates or, worse, content that cannot be rendered.

---

### Pitfall 3: Content Type Confusion -- Mixing Tutorial, Reference, and Conceptual Content

**What goes wrong:**
Claude Code's feature surface is amorphous. "Memory" encompasses CLAUDE.md, auto-memory, project settings, and session context. "Tool access" includes MCP, built-in tools, shell commands, file system access, and agent SDK tools. Without careful scoping, chapters balloon into sprawling pages that blend conceptual explanation ("what is CLAUDE.md?"), tutorial steps ("create a file called CLAUDE.md..."), and reference tables ("supported directives: ..."). This produces chapters that serve nobody well: beginners get lost in reference details, experienced users cannot find the specific syntax they need, and search engines cannot determine the page's primary intent for ranking.

The FastAPI guide successfully avoided this because each chapter maps to a concrete architectural component (middleware, auth, docker) with clear boundaries. Claude Code's features are more interconnected and harder to isolate into clean chapters.

**Why it happens:**
The 51 NotebookLM sources contain a mix of tutorials, reference docs, blog posts, and changelogs. When synthesizing from diverse source types, the natural result is chapters that are "about" a topic rather than chapters that accomplish a specific reader goal. Additionally, Anthropic's official documentation already provides both tutorials (quickstart) and reference (CLI reference, settings) -- a third-party guide that tries to do both is redundant AND inferior.

**How to avoid:**
1. Define each chapter's primary content type before writing: is it explanation (understanding-oriented, discursive) or how-to guide (task-oriented, assumes knowledge)? For this guide, lean toward explanation + how-to hybrid, matching the FastAPI guide's pattern. NOT tutorial (official docs already do that) and NOT reference (official docs already do that).
2. Keep chapters to 2000-3000 words maximum. If a chapter exceeds this, it is trying to cover too much -- split it.
3. Extract reference-style content (command lists, flag tables, configuration options) into a dedicated "Quick Reference" chapter or omit it entirely (link to official docs instead).
4. Apply the "one chapter, one decision" rule from the FastAPI guide: each chapter should answer one primary question. "How does Claude Code's memory system shape your project?" is good. "Everything about CLAUDE.md, auto-memory, session context, and project settings" is too broad.
5. Create chapter outline with word count targets and primary content type labels before any writing begins. Review outline against the FastAPI guide's chapter structure for consistency.

**Warning signs:**
- Chapters exceeding 3000 words
- Chapters containing both "step 1, step 2" tutorial sequences AND tables of all available options
- Chapter titles like "Claude Code Memory System" (too broad) rather than "How CLAUDE.md Shapes Every Session" (opinionated, specific)
- Reader cannot determine what they will learn from the chapter title alone
- Content duplicates what the official Claude Code quickstart already covers

**Phase to address:**
Content planning/outline phase -- before any writing begins. This pitfall is expensive to fix after chapters are written because restructuring requires splitting, merging, and rewriting significant portions of text.

---

### Pitfall 4: SEO Cannibalization with Official Claude Code Documentation

**What goes wrong:**
Anthropic maintains comprehensive official documentation at code.claude.com/docs (overview, quickstart, memory, MCP, hooks, skills, settings, CLI reference, best practices, common workflows, and more). Writing guide chapters that target the same head keywords ("Claude Code CLAUDE.md", "Claude Code MCP setup", "Claude Code best practices") puts patrykgolabek.dev in direct competition with Anthropic's domain authority. Google will overwhelmingly prefer the official source for informational queries about a product's own features. The guide pages rank nowhere, generate no organic traffic, and the authoring effort is wasted. Worse, if search engines view the content as low-value derivative of official docs, it can subtly damage the overall domain's SEO authority through quality signals.

Additionally, multiple community guides already exist (ClaudeLog, zebbern/claude-code-guide on GitHub, claudefast, developertoolkit.ai) targeting the same general keywords. The Claude Code guide market is already crowded.

**Why it happens:**
The natural instinct is to cover what Claude Code does comprehensively. But Anthropic already does that with continuously-updated documentation. Third-party guides that merely rephrase official documentation offer zero differentiation to search engines or readers.

**How to avoid:**
1. Target long-tail, workflow-oriented keywords that official docs do NOT cover: "Claude Code workflow for Kubernetes development", "Claude Code CLAUDE.md for monorepo architecture", "Claude Code CI/CD automation with GitHub Actions patterns", "Claude Code vs Cursor for DevOps engineers", "how a staff engineer uses Claude Code daily". The FastAPI guide succeeded because it covers production architecture decisions, not what FastAPI is.
2. Angle every chapter as "practitioner's opinion + real-world patterns" rather than "what this feature does." Official docs explain features; this guide should explain how a 17+ year architect uses those features in production workflows.
3. Include canonical cross-references to official documentation for factual claims. Link to code.claude.com/docs generously. This signals to search engines that the guide is additive, not duplicative.
4. Run a keyword gap analysis before writing: search for each planned chapter title on Google and check if official docs or high-authority community guides already own the first page. If they do, reangle the chapter.
5. Use TechArticle JSON-LD schema (already established pattern from FastAPI guide) to differentiate from generic blog-style content.
6. The unique value proposition is Patryk's experience as a cloud-native architect. Every chapter should filter Claude Code through that lens, not through a generic "getting started" lens.

**Warning signs:**
- Chapter titles that match official documentation section headers (e.g., "CLAUDE.md" matches code.claude.com/docs/en/memory)
- Content that could be found in official docs with minor rewording
- Guide chapters targeting head terms ("Claude Code") instead of long-tail ("Claude Code workflow for Python microservices")
- Post-publish: Search Console shows guide pages with impressions but zero clicks (losing to official docs in every SERP)
- Community guides (ClaudeLog, etc.) already rank for the same terms

**Phase to address:**
Content planning phase (keyword research and chapter angle definition, before any writing). SEO integration phase (JSON-LD, canonical URLs, keyword verification post-build). This must be validated before investing weeks of writing effort.

---

### Pitfall 5: NotebookLM Source Hallucination and Interpretive Overconfidence

**What goes wrong:**
The 51 NotebookLM sources are the content foundation. Published research shows NotebookLM produces hallucinations in approximately 13% of responses, with the most common error being "interpretive overconfidence" -- adding unsupported characterizations, transforming attributed opinions into general statements, and presenting hedged claims as definitive. When building a guide about a tool that changes weekly, NotebookLM may synthesize outdated information from older sources as if it is still current, or confidently describe a feature that has been renamed, deprecated, or fundamentally changed.

Specific risk: if the 51 sources include blog posts from mid-2025 (when Claude Code was in early beta) alongside January 2026 changelogs, NotebookLM will synthesize them without temporal awareness. A feature described enthusiastically in source #23 (a blog post from August 2025) may have been deprecated in source #47 (a changelog from January 2026), but NotebookLM will present both as current facts.

**Why it happens:**
NotebookLM only answers from uploaded sources and cannot search the internet. It has no concept of time -- it cannot tell you that source #23 predates source #47. If the 51 sources span 6+ months of a rapidly-evolving tool, the synthesized output will contain temporal contradictions that appear as confident, coherent text.

**How to avoid:**
1. Treat NotebookLM output as a first draft outline, never as a source of truth. Every factual claim about Claude Code features must be independently verified against the official documentation at code.claude.com/docs or a recent CHANGELOG.md entry.
2. Before content authoring begins, audit the 51 sources for recency. Remove or flag any source older than 3 months. Weight newer sources explicitly.
3. For each chapter, create a feature verification checklist: every Claude Code feature, command, or behavior mentioned must have a corresponding entry in current official docs or a CHANGELOG entry from the past 60 days confirming it still exists and works as described.
4. Do not use NotebookLM's exact phrasing for technical claims. Rephrase after independent verification to avoid propagating confident-sounding inaccuracies.
5. Watch specifically for "interpretive overconfidence" patterns: claims like "Claude Code always...", "the best practice is...", "Claude Code cannot..." are red flags unless verified.

**Warning signs:**
- Chapter content describes a Claude Code feature that cannot be found in current official docs
- NotebookLM output uses confident language ("Claude Code always...", "the recommended approach is...") for claims that are actually opinions from blog post sources
- Multiple sources in the NotebookLM corpus describe the same feature differently (temporal inconsistency)
- Guide text describes behavior that contradicts a reader's actual Claude Code experience

**Phase to address:**
Every content authoring phase. Build verification into the authoring workflow as a mandatory step, not a post-hoc review. Each chapter should not be marked complete until the feature verification checklist is satisfied.

---

### Pitfall 6: Breaking the /guides/ Hub Page and Supporting Pages

**What goes wrong:**
Multiple pages beyond the hub have single-guide assumptions:

1. **Hub page (`/guides/index.astro`):** Uses `const [guideMeta] = await getCollection('guides')` and renders a single card with a hardcoded FastAPI teal gradient (`from-[#009485]/8 to-[#009485]/3`) and a hardcoded `fastapiLogo` import. Adding a Claude Code guide to the collection means `getCollection('guides')` returns two items, but the page only renders the first. The second guide silently disappears.

2. **FAQ page (`/guides/fastapi-production/faq.astro`):** Entirely hardcoded for FastAPI. The Claude Code guide will need its own FAQ page, but the pattern is not reusable -- the FAQ questions are defined as a const array inside the Astro frontmatter.

3. **GuideLayout navigation:** The sidebar, breadcrumbs, and prev/next links reference `guideMeta.data.chapters`. If a GuideLayout is shared between guides, it must correctly scope chapters to the current guide. If the Claude Code guide has 10 chapters and FastAPI has 14, the sidebar must show only the current guide's chapters.

**Why it happens:**
Single-guide implementation. The hub page was built with a grid layout (future-proofing) but single-guide data fetching and rendering. The FAQ page is a standalone page with no abstraction. The GuideLayout receives guide metadata as props but was only ever tested with one guide.

**How to avoid:**
1. Refactor `/guides/index.astro` to iterate over all guides: `const allGuides = await getCollection('guides')` then map to render guide cards.
2. Move per-guide branding (logo, gradient colors, accent color) into guide.json metadata or a separate branding config. Do not hardcode colors in page templates.
3. Create Claude Code FAQ as a separate page (`/guides/claude-code/faq.astro`). Consider extracting FAQ item data into a JSON file (matching the `guide.json` pattern) rather than embedding in frontmatter.
4. Verify GuideLayout renders correctly with Claude Code metadata: different chapter count, different slugs, different guide title in breadcrumbs.
5. Test cross-guide isolation: navigating within the Claude Code guide should never show FastAPI chapters in the sidebar or link to FastAPI pages.

**Warning signs:**
- Hub page shows only one guide after Claude Code is added
- Array destructuring `[guideMeta]` in hub page or LLM endpoint code
- Hub page gradient/logo is FastAPI-specific with no conditional logic
- Sidebar shows wrong guide's chapters when navigating between guides
- Breadcrumbs show "FastAPI Production Guide" on Claude Code pages

**Phase to address:**
Infrastructure refactoring phase (first phase). Test with both guides present before proceeding to content.

---

### Pitfall 7: Build Time Regression from OG Image Generation

**What goes wrong:**
The site currently generates 810 OG images at build time using satori + sharp. Each image takes 100-300ms. Adding 10-12 Claude Code guide chapters means 12-14 new OG images (chapters + landing + FAQ). With the existing content-hash caching in `og-cache.ts`, incremental builds are fine -- unchanged images are served from cache.

The real risk is cold-start scenarios: when CI/CD runs `npm ci` (which wipes `node_modules/`), when the `CACHE_VERSION` constant is bumped, when switching to a new CI runner, or when a developer clones fresh. In these cases, ALL 820+ OG images regenerate. At 100-300ms each, that is 82-246 seconds of pure OG generation. One developer documented their Astro site's build dropping from 30 seconds to over 10 minutes when OG caching broke.

Adding 12 more images is marginal on top of 810, but each new guide multiplies the cold-start penalty.

**Why it happens:**
The `og-cache.ts` stores cached images in `node_modules/.cache/og-guide/`. The `CACHE_VERSION` constant (`'1'`) causes bulk invalidation when bumped. CI pipelines that do not persist `node_modules/.cache/` between runs always cold-start. The site's total OG image count (810+) is already at a scale where cold-start is a material concern.

**How to avoid:**
1. Ensure CI/CD pipeline caches `node_modules/.cache/` between builds. This is the single most impactful mitigation.
2. Keep Claude Code guide OG images in the same caching system as FastAPI guide images -- the existing `og-cache.ts` handles this correctly (cache directory is shared, hash includes title+description for uniqueness).
3. Measure build time before and after adding the Claude Code guide. Set a regression budget: the guide addition should not increase clean-build time by more than 5 seconds on warm cache.
4. If cold-start becomes a problem at scale, consider pre-generating OG images as a separate build step that commits PNGs or stores them as CI artifacts.

**Warning signs:**
- Build time increases by more than 10 seconds after adding guide on warm cache
- CI builds are significantly slower than local builds (cache miss)
- `CACHE_VERSION` bump causes full OG regeneration taking multiple minutes
- New developer reports "build takes forever" after fresh clone

**Phase to address:**
OG image and SEO integration phase. Measure before and after. Verify CI caching is configured. This is lower risk than the other critical pitfalls because the caching infrastructure already exists.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Duplicate `[slug].astro` template per guide instead of shared dynamic route | Faster, avoids refactoring existing FastAPI pages, zero risk to shipped guide | Every new guide requires copying and maintaining a separate template. Bug fixes in GuideLayout integration must be applied N times. | Acceptable for guide #2 (Claude Code). Two template copies is manageable. Plan shared template refactor for guide #3. |
| Separate `claudeCodePages` content collection instead of unified multi-guide collection | Zero risk to existing FastAPI guide, simpler content queries, follows established per-section pattern (EDA has its own collections too) | Each new guide requires a new collection definition, new loader, new entry in content.config.ts | Recommended approach. Per-guide collections match the codebase convention. This is not debt -- it is the right pattern. |
| Hardcoding chapter descriptions in landing page template | Fast to author, no schema change needed | Descriptions not queryable, not in structured data, not available to llms.txt. Must be updated in two places if chapter descriptions change. FastAPI guide already has this duplication. | Never. Put descriptions in MDX frontmatter (already in `guidePageSchema.description`). Fix this pattern for Claude Code guide; do not repeat the FastAPI guide's mistake. |
| Skipping `lastVerified` date field in schema | Fewer schema changes, faster initial build | No mechanism to track content freshness. Readers and maintainers cannot tell if content is current. Critical for a rapidly-evolving tool. | Never. Essential from day one for a Claude Code guide. Non-negotiable. |
| Using NotebookLM output directly without verification | Faster content authoring, 51 sources already synthesized | 13% hallucination rate means roughly 1 in 8 factual claims may be wrong. Damaged credibility when readers find errors. | Never for technical claims. Acceptable for narrative framing and structure suggestions only. |
| Skipping keyword gap analysis before writing | Saves 2-3 hours of SEO research | Weeks of writing effort produces content that cannot rank against official docs and established community guides. | Never. The 2-3 hour investment prevents weeks of wasted effort. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `content.config.ts` content collections | Trying to add Claude Code pages to existing `guidePages` collection (hardcoded to FastAPI directory) | Create a new `claudeCodePages` collection with its own glob loader pointing to `./src/data/guides/claude-code/pages` |
| `guides` meta collection | `file()` loader hardcoded to `fastapi-production/guide.json` | Switch to a loader that reads from both guide.json files, or create a second `claudeCodeGuide` collection |
| `astro.config.mjs` sitemap builder | `buildContentDateMap()` hardcodes `fastapi-production/guide.json` path via `readFileSync` | Refactor to dynamically find and read all `src/data/guides/*/guide.json` files |
| `llms.txt` and `llms-full.txt` | `[guideMeta]` destructure only gets first guide | Iterate over all guides in collection and render a section for each |
| `/guides/index.astro` hub page | `[guideMeta]` destructure and hardcoded FastAPI branding (teal gradient, logo import) | Iterate over all guides; move branding config into guide.json or a branding module |
| `GuideLayout.astro` | Assuming layout works for any guide without testing | Verify sidebar, breadcrumbs, and prev/next render correctly with Claude Code metadata (different chapter count) |
| JSON-LD structured data | `GuideJsonLd.astro` may use hardcoded URLs | Verify component accepts dynamic guide slugs and generates correct URLs for Claude Code pages |
| Header navigation | "Guides" link already exists from v1.15 | Verify it still leads to hub page that now shows both guides (no code change needed if hub page refactor is done) |
| RSS feed | Companion blog post (if created) must appear in feed | Follow existing pattern from FastAPI companion blog post |
| OG image cache namespace | Concern that two guides sharing one cache directory causes collisions | No collision risk: hash includes title+description, which is unique per page. Shared cache is correct behavior. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| OG image cold-start in CI | CI build time doubles or triples | Cache `node_modules/.cache/og-guide/` as CI artifact between builds. 810+ images at 100-300ms = 80-240s cold start. | When CI pipeline clears cache (npm ci, new runner, cache eviction) |
| SVG diagram complexity exceeding FastAPI guide levels | Lighthouse performance drops below 90 on pages with diagrams | Keep each SVG diagram under 50KB and 250 lines (FastAPI diagrams range 94-252 lines). Use the established `diagram-base.ts` pattern. | When a single diagram exceeds ~100 SVG elements or 100KB |
| Interactive React components in Claude Code guide MDX | JS bundle size per chapter page increases, hydration delays on mobile | Use `client:visible` (not `client:load`) for any React islands. Budget: each React island under 30KB gzipped. The FastAPI guide's React Flow topology is ~50KB and represents the upper bound. | When more than 2 React islands exist on a single chapter page |
| Large MDX files with many code blocks | Build time per page increases; expressive-code processes every block | Keep code blocks to essential snippets (10-30 lines). Max 8 code blocks per chapter. Use prose to explain, not more code. | When a single MDX file has 15+ syntax-highlighted code blocks |
| Adding new npm dependencies for Claude Code guide features | Vite dependency pre-bundling overhead increases for ALL pages, not just guide pages | No new npm dependencies for diagram or guide features. Use existing satori, sharp, expressive-code, and Astro built-in capabilities. | Immediately on build -- Vite re-optimizes deps for entire site |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Including real Anthropic API keys or billing details in guide examples | Readers copy-paste credentials; keys leak into public content indexed by search engines | Use obviously fake values: `sk-ant-EXAMPLE-not-a-real-key`. Add visible warnings in code blocks. |
| Recommending `--dangerouslySkipPermissions` or `dangerouslyDisableSandbox` without warnings | Readers disable Claude Code safety features, leading to accidental file deletion or command execution | Never recommend permission bypasses in guide content. If discussing the feature, clearly warn about risks and when it is appropriate (CI environments only). |
| Showing CLAUDE.md content that grants overly broad file system or command access | Readers copy permissive CLAUDE.md configs into production repos | Show minimal-permission CLAUDE.md examples. Explain the principle of least privilege for AI tool configuration. |
| Linking to unofficial Claude Code packages or extensions without vetting | Readers install compromised or malicious packages | Only link to official Anthropic sources (code.claude.com, docs.anthropic.com, github.com/anthropics/). Vet any community resources. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Chapters assume reader uses Claude Code in terminal only | VS Code, Desktop, Web, and JetBrains users cannot follow along | Note which environment each workflow applies to. Use environment-agnostic language where possible. Claude Code runs in 5+ environments now. |
| Chapters organized by Claude Code feature ("CLAUDE.md", "MCP", "Hooks") | Reader must read entire guide to accomplish a single task; mirrors official docs structure and loses differentiation | Organize by what the reader wants to DO: "Set up a project for Claude Code", "Build effective prompt workflows", "Automate CI/CD with Claude Code", "Coordinate multi-agent tasks" |
| No difficulty indicators per chapter | Beginners start with advanced chapters (multi-agent patterns) and get frustrated; experts wade through basics | Add difficulty indicator (beginner/intermediate/advanced) to frontmatter. Render in sidebar and chapter cards. |
| Monolithic "Getting Started" chapter covering install + config + first task | First chapter is overwhelming; readers bounce before reaching the valuable content | Keep first chapter under 800 words: install + one "wow" moment. Separate project configuration into its own chapter. |
| No visual differentiation between Claude Code guide and FastAPI guide | Readers navigating between guides cannot tell which guide they are in | Use distinct accent color and branding for Claude Code guide (Anthropic orange/coral vs FastAPI teal). Different gradient on landing page. |
| Guide content duplicates official quickstart | Readers feel they already know this; no added value | Start beyond the quickstart. Assume the reader has Claude Code installed and has run it once. The guide's value starts where the official docs' quickstart ends. |

## "Looks Done But Isn't" Checklist

- [ ] **Guide hub page:** Both FastAPI and Claude Code guides appear at `/guides/` -- verify with actual build output, not just code review
- [ ] **Sitemap:** All Claude Code guide pages appear in `sitemap-0.xml` with correct `lastmod` dates -- `grep claude-code dist/sitemap-0.xml`
- [ ] **llms.txt:** Claude Code guide section appears with all chapter URLs -- fetch `/llms.txt` from build output and verify
- [ ] **llms-full.txt:** Same verification for the full-content LLM endpoint
- [ ] **OG images:** Every Claude Code chapter has a unique OG image that renders correctly -- check `dist/open-graph/guides/claude-code/*.png` exists and is valid
- [ ] **JSON-LD:** TechArticle and BreadcrumbList structured data validates for every Claude Code chapter page -- use Google Rich Results Test
- [ ] **Breadcrumbs:** Trail reads Home > Guides > Claude Code Guide > [Chapter] -- NOT Home > Guides > FastAPI Production Guide > [Chapter]
- [ ] **Sidebar navigation:** Sidebar shows only Claude Code chapters when viewing Claude Code guide, not FastAPI chapters
- [ ] **Prev/next links:** Work correctly within Claude Code guide and never link to FastAPI guide chapters
- [ ] **Header nav:** "Guides" link leads to hub page showing both guides
- [ ] **Cross-guide isolation:** Complete click-through of entire Claude Code guide never navigates to a FastAPI guide page
- [ ] **Mobile layout:** Sidebar collapses correctly on mobile for Claude Code guide (may have different chapter count than FastAPI)
- [ ] **Content freshness:** Every chapter has a `lastVerified` date within 30 days of publish date
- [ ] **Feature verification:** Every Claude Code feature mentioned in the guide exists in current official docs or recent changelog
- [ ] **Lighthouse scores:** All Claude Code guide pages score 90+ on Performance, Accessibility, Best Practices, and SEO
- [ ] **Dark mode:** All diagrams, code blocks, and callout boxes render correctly in both light and dark themes
- [ ] **FastAPI guide regression:** FastAPI guide still builds and renders correctly after Claude Code guide is added -- click through all 14 FastAPI pages

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Content staleness (outdated Claude Code features) | LOW | Update affected callout boxes with current syntax. If chapter structure is sound, updating specific claims takes 1-2 hours per chapter. The `lastVerified` field enables targeted updates. |
| Hardcoded single-guide breaking multi-guide | HIGH | Requires refactoring content.config.ts, page templates, sitemap builder, llms.txt, hub page, and OG endpoints. If done after content is written, risk of breaking both guides simultaneously. Prevention (infrastructure first) is 10x cheaper than recovery. |
| Content type confusion (mixed tutorial/reference) | MEDIUM | Restructure chapters: move reference tables to a dedicated appendix, remove tutorial sequences that duplicate official docs. May require splitting or merging 3-4 chapters. 1-2 days of rewriting. |
| SEO cannibalization with official docs | MEDIUM | Rewrite chapter titles and meta descriptions for long-tail keywords. Add canonical URLs to official docs. May require significant content rewriting if chapters are too close to official doc topics. 2-3 days. |
| NotebookLM hallucinations in published content | HIGH | Every factual claim must be re-verified against official docs. If guide is published with errors, credibility damage is immediate and hard to recover. Prevention (verify during writing) is far cheaper than correction (post-publish errata + reputation damage). |
| Hub page showing only one guide | LOW | Fix `[guideMeta]` destructure to iterate. Small code change (~30 minutes) but must verify no downstream effects in hub page rendering. |
| Build time regression from OG images | LOW | Enable CI cache for `node_modules/.cache/`. If already slow, pre-generate and commit OG images as static assets. 1-2 hours. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1: Content staleness | Schema phase (add `lastVerified` field) + every content phase (verify against official docs) | `lastVerified` field in frontmatter; each chapter date is within 30 days of publish |
| P2: Hardcoded single-guide assumptions | Phase 1: Infrastructure refactoring (MUST be first) | FastAPI guide still builds correctly; both guides appear on hub page; Claude Code pages in sitemap and llms.txt |
| P3: Content type confusion | Content planning phase (outline review with content type labels) | Each chapter has labeled primary content type; word count under 3000; no tutorial sequences |
| P4: SEO cannibalization | Content planning phase (keyword gap analysis) | No chapter title matches an official docs section header; long-tail keywords documented |
| P5: NotebookLM hallucinations | Every content authoring phase (feature verification checklist) | Every feature mentioned confirmed in official docs or recent changelog |
| P6: Hub page and supporting page breakage | Phase 1: Infrastructure refactoring | Hub page renders both guides; FAQ page renders correctly; sidebar scoped to current guide |
| P7: Build time regression | OG image/SEO integration phase | Build time delta under 5 seconds on warm cache; CI caching configured |

## Sources

### Primary (HIGH confidence -- direct codebase analysis)
- `src/content.config.ts` lines 54-62 -- hardcoded `fastapi-production/pages` and `fastapi-production/guide.json` paths in content collection loaders
- `astro.config.mjs` lines 47-59 -- hardcoded `readFileSync('./src/data/guides/fastapi-production/guide.json')` in sitemap date builder
- `src/pages/guides/index.astro` line 13 -- `[guideMeta]` array destructure taking only first guide
- `src/pages/llms.txt.ts` line 15, `src/pages/llms-full.txt.ts` line 42 -- same single-guide destructure pattern
- `src/lib/guides/og-cache.ts` -- OG caching system with `CACHE_VERSION` invalidation and `node_modules/.cache/og-guide` directory
- `src/lib/guides/schema.ts` -- current guidePageSchema lacks `lastVerified` field
- `src/lib/guides/svg-diagrams/*.ts` -- 94-252 lines per diagram, establishing safe complexity bounds

### Secondary (MEDIUM confidence -- verified web research)
- [Claude Code Official Docs](https://code.claude.com/docs/en/overview) -- current feature surface covering terminal, VS Code, desktop, web, JetBrains environments
- [Claude Code CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) -- 176 updates in 2025; /simplify, /batch, HTTP hooks shipped March 3 2026; Agent Teams, Automatic Memories shipped March 7 2026
- [Claude Code Changelog - ClaudeLog](https://claudelog.com/claude-code-changelog/) -- community-maintained version tracking confirming rapid release cadence
- [Astro OG Image Caching - ainoya.dev](https://ainoya.dev/posts/astro-ogp-build-cache/) -- build time dropping from 10+ minutes to 30 seconds with image caching
- [OG Images Build-Time vs Runtime - Jilles Soeters](https://jilles.me/og-images-astro-build-vs-runtime/) -- 100-300ms per satori+sharp image generation benchmark
- [NotebookLM Hallucination Research - arxiv](https://arxiv.org/html/2509.25498v1) -- 13% hallucination rate with interpretive overconfidence as primary error mode
- [SEO Cannibalization Guide - Search Engine Land](https://searchengineland.com/guide/keyword-cannibalization) -- keyword cannibalization detection and prevention strategies
- [Documentation Structure Best Practices - GitBook](https://gitbook.com/docs/guides/docs-best-practices/documentation-structure-tips) -- mixing content types as anti-pattern
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/) -- multi-directory collection patterns using loaders

---
*Pitfalls research for: Adding a comprehensive Claude Code guide to patrykgolabek.dev (1082-page Astro 5 site with established guide infrastructure)*
*Researched: 2026-03-10*
