# Feature Research

**Domain:** Comprehensive developer guide for Claude Code (CLI AI coding agent) -- zero-to-hero tutorial on an Astro 5 static site
**Researched:** 2026-03-10
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = guide feels amateur or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Progressive chapter structure (10-12 chapters, zero-to-hero) | Every competing guide (FlorianBruniaux, alexop.dev, adityabawankule.io, official docs) uses progressive complexity. Readers expect to start with setup and build toward advanced topics. | LOW | Reuse existing `guidePages` collection and `GuideLayout`. Define chapters in `guide.json`. Schema already supports `order` field for sequencing. |
| Chapter sidebar navigation with active state | Official Anthropic docs and the FastAPI guide both have sticky sidebar nav. Readers need wayfinding in multi-chapter content. | ALREADY BUILT | `GuideSidebar.astro` exists with active-state highlighting and sticky positioning. Fully reusable. |
| Prev/next chapter navigation | Every multi-page tutorial (Anthropic docs, Astro docs, Next.js docs) has bottom-of-page chapter links. Without them, readers bounce. | ALREADY BUILT | `GuideChapterNav.astro` already provides this. Reusable as-is. |
| Syntax-highlighted code blocks with copy button | Developers expect one-click copying. Every competing guide has this. astro-expressive-code already provides copy buttons out of the box. | ALREADY BUILT | `astro-expressive-code` is installed and configured. Copy button is default behavior. |
| File-path-annotated code blocks | Claude Code config lives in specific files (`.claude/settings.json`, `CLAUDE.md`, `.claude/agents/*.md`). Readers need to know WHERE code goes. | LOW | Adapt `CodeFromRepo.astro` pattern -- same file-path header bar but link to Anthropic docs or skip the "View source" link. Create a simpler `CodeBlock` variant that just shows the file path header without requiring a GitHub repo URL. |
| Breadcrumb navigation | Standard for nested content. Aids orientation and SEO. Already exists in guide infrastructure. | ALREADY BUILT | `GuideBreadcrumb.astro` exists. Reusable with new guide slug. |
| In-page table of contents per chapter | Long-form chapters (2000+ words) need anchor-linked section nav. Site already has `TableOfContents.astro`. | LOW | Existing `TableOfContents.astro` component. Integrate into `GuideLayout` or render within each chapter's MDX. |
| Per-chapter OG images | Social sharing without OG images looks broken. The OG pipeline already generates per-chapter images for the FastAPI guide. | LOW | Existing `satori` + `sharp` pipeline. Add new templates/route for `claude-code` guide slug. Follow the FastAPI guide's `og-cache.ts` pattern. |
| JSON-LD structured data (Article + BreadcrumbList) | SEO requirement. Google indexes guide content. Already implemented for the FastAPI guide. | ALREADY BUILT | `GuideJsonLd.astro` and `BreadcrumbJsonLd.astro` exist and are guide-generic. |
| Dark/light theme support | Site already has theme toggle. All new components must respect CSS custom properties. | ALREADY BUILT | Theme system uses CSS variables throughout. All existing guide components and diagram infrastructure (`DIAGRAM_PALETTE`) already support both themes. |
| Mobile-responsive layout | Developers read on phones/tablets. Sidebar must collapse. Content must reflow. | ALREADY BUILT | `GuideLayout.astro` already hides sidebar on mobile (`hidden lg:block`). Prose content reflows via Tailwind responsive utilities. |
| Callout/admonition blocks (tip, warning, danger) | Claude Code has sharp edges (permissions that bypass safety, destructive commands, context limits that silently degrade quality). Warnings are safety-critical, not decorative. | LOW | `Callout.astro` exists in blog components. Import directly in MDX guide chapters. If import path is awkward, create a thin re-export wrapper in the guide components directory. |
| Reading time estimate per chapter | Sets expectations for chapter length. Already computed for blog posts via `reading-time` package. | LOW | Apply `remark-reading-time.mjs` plugin to guide content or compute in chapter frontmatter. Display in chapter header. |
| Landing page with chapter card grid | Every guide needs an entry point showing all chapters at a glance with descriptions. FastAPI guide has this exact pattern with numbered cards and "Coming Soon" treatment for unwritten chapters. | LOW | Clone and adapt `fastapi-production/index.astro`. New hero section, new chapter descriptions, same card grid pattern. The "Coming Soon" treatment is useful during incremental chapter publishing. |
| FAQ page with FAQPage JSON-LD | SEO multiplier for long-tail queries ("how do I configure Claude Code MCP servers?", "what is CLAUDE.md?"). The FastAPI guide FAQ captures significant search traffic via rich results. | MEDIUM | Requires writing 15-20 Q&A pairs covering common Claude Code questions. Schema (`FAQPageJsonLd.astro`) and component pattern already exist. Write FAQ content after chapters are complete. |
| Cross-linking between chapters | Chapters reference each other heavily (e.g., "configure permissions before setting up hooks", "subagents inherit skills from CLAUDE.md -- see Chapter 2"). Internal links reduce bounce rate and build topical authority. | LOW | Standard MDX internal links. No component needed -- just disciplined authoring practice. Define a linking convention early. |
| Sitemap inclusion | All guide pages must appear in sitemap. | ALREADY BUILT | Automatic via `@astrojs/sitemap` for any page in `src/pages/`. Zero work required. |

### Differentiators (Competitive Advantage)

Features that set this guide apart from FlorianBruniaux's GitHub repo (the closest competitor), the official Anthropic docs, the alexop.dev blog post, and the dozens of Medium/dev.to posts on Claude Code.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Programmatic SVG architecture diagrams (theme-aware) | No competing Claude Code guide has proper architecture diagrams. FlorianBruniaux uses 41 GitHub-rendered Mermaid diagrams (no dark mode, no custom styling, no responsive sizing). Official docs use zero diagrams -- entirely text-based. The alexop.dev and adityabawankule.io guides have no visuals at all. Programmatic SVGs showing CLAUDE.md hierarchy, context window lifecycle, permission evaluation flow, hook event model, MCP server topology, and agent team communication patterns would be a genuine first in the Claude Code ecosystem. | HIGH | Build on existing `diagram-base.ts` infrastructure (semantic palette with CSS vars, rounded rects, arrow markers, text labels). Each diagram is a TypeScript generator function + Astro wrapper component. Estimate 6-8 diagrams across 10-12 chapters. This is the single most complex and most differentiating part of the guide. |
| Interactive context window visualizer | Context window management is the most misunderstood Claude Code topic. Auto-compaction triggers at ~95% of the 200K token window, silently summarizing previous context. No guide visualizes this. A live component showing how tokens accumulate (user prompts, file reads, tool outputs), when compaction fires, and how subagents get isolated context would make this THE definitive resource for understanding Claude Code's memory model. | HIGH | React island (`client:visible`) using the same pattern as `DeploymentTopology.tsx`. Animated bar chart or stacked area showing token usage zones. Slider or step-through to simulate a session progressing toward compaction. Could include a "subagent context" side panel showing the isolated context fork. |
| CLAUDE.md starter templates with copy-to-clipboard | Official docs show fragments. FlorianBruniaux has templates but they are raw markdown files buried in a GitHub directory tree. A polished UI with tabbed template selector ("Node.js project", "Python project", "Monorepo", "Solo developer", "Team with CI") and one-click "Copy this template" buttons gives immediate actionable value that no competitor offers in a web-friendly format. | MEDIUM | Astro component wrapping `expressive-code` with tab navigation and per-template descriptions. Content is static code strings. The code blocks already have copy buttons via expressive-code -- the differentiation is the curated selection and contextual descriptions. |
| Real CLAUDE.md examples from the author's own projects | Every competing guide uses generic or hypothetical examples. Showing actual CLAUDE.md files from patrykgolabek.dev (this Astro site), fastapi-chassis, and other PatrykQuantumNomad repos provides authentic practitioner credibility that cannot be faked. The reader sees that the author uses these patterns in real production work. | LOW | Content authoring effort only. Use `CodeFromRepo.astro` to link to actual CLAUDE.md files in public repos. The component already supports file-path headers and "View source" links to GitHub. |
| Hook lifecycle sequence diagram | Hooks fire at specific events: pre/post tool execution, session start/end, prompt submission, permission requests, and compaction. A visual showing the exact event sequence with hook injection points is missing from every resource including the official Anthropic documentation. The official docs list events in a table -- a sequence diagram shows the temporal flow. | MEDIUM | SVG diagram using `diagram-base.ts`. Vertical timeline with event nodes and hook insertion arrows. Color-coded by event type. Single diagram, high information density. Reuses arrow markers and text labels from the base module. |
| Permission evaluation flowchart | Claude Code permissions use a complex precedence: deny > ask > allow, with scope priority local > project > user. Multiple sources can define rules, and the first matching rule wins. A decision-tree flowchart showing how a tool invocation traverses the permission stack clarifies the most confusing part of Claude Code setup. No competing guide visualizes this. | MEDIUM | SVG flowchart diagram built on `diagram-base.ts`. Diamond decision nodes with color-coded outcomes (green = allowed, yellow = prompted, red = denied). Shows the evaluation order across scopes. |
| MCP server topology diagram | MCP servers connect Claude Code to external systems (GitHub, databases, filesystem, Slack, custom APIs). Servers override by name with scope priority: local > project > user. A topology diagram showing the layered override model and typical service connections makes the abstract concept concrete. | MEDIUM | Could be static SVG (simpler, ships faster) or interactive React Flow (like `DeploymentTopology.tsx` with pan/zoom). Start with static SVG, upgrade to interactive if warranted. |
| Agent team coordination diagram | Agent teams are a research preview feature (introduced v2.1.32, February 2026, requires Opus 4.6). Almost no guide documents this well because the feature is so new. A clear visual showing lead agent dispatching tasks to teammates, shared task state, peer-to-peer messaging, and result aggregation would be genuinely novel content. | MEDIUM | SVG or React Flow diagram. Shows message flow between agents, task assignment arrows, and result summaries flowing back. Label communication patterns (task delegation, peer messaging, status reporting). |
| Companion blog post (SEO backlink strategy) | The FastAPI guide has a companion blog post that drives bidirectional traffic. Replicating this pattern creates a two-pronged SEO strategy: the blog post targets broad queries ("Claude Code guide 2026", "how to use Claude Code"), the guide chapters target specific queries ("Claude Code MCP server setup", "Claude Code permissions configuration"). | MEDIUM | Separate blog post authored in MDX. Cross-links in both directions. Blog appears in RSS feed and blog listing page. Write after guide chapters are complete. |
| "Before/After" comparison blocks | Show what a development workflow looks like WITHOUT proper Claude Code configuration vs WITH it. For example: a CLAUDE.md-less session where Claude asks about every file vs a well-configured session where Claude already knows the project. Concrete visual proof of value that no competing guide provides. | LOW | CSS grid component with two code blocks side by side, labeled "Without" and "With". Simple Astro component. Could also use expressive-code's diff highlighting to show additions. |
| Chapter difficulty badges | Signal to readers which chapters are beginner-friendly vs advanced. The topic progression (setup -> CLAUDE.md -> context -> permissions -> skills -> hooks -> MCP -> subagents -> teams -> cron) naturally increases in complexity, but explicit badges help self-directed learners. | LOW | Small badge in chapter card grid and sidebar. Add `difficulty` field to `guide.json` chapters array or compute from chapter order. Three levels: Beginner, Intermediate, Advanced. |
| Downloadable starter `.claude/` config bundle | A ready-to-use `.claude/` directory containing recommended `settings.json`, sample hooks, example skills, a CLAUDE.md template, and a sample agent definition. Creates a tangible takeaway that goes beyond reading. No competitor offers this as a polished download. | MEDIUM | Static `.zip` file hosted in `/public/downloads/` or link to a GitHub template repository. Requires maintaining configs as Claude Code evolves. Include a `README.md` inside the bundle explaining each file. |
| Practitioner voice with opinionated defaults | Most Claude Code guides list options without recommending. The official docs are neutral by design. FlorianBruniaux provides templates but not opinionated guidance. This guide should say "Use this permission configuration because..." and "Do NOT enable bypassPermissions because..." -- the voice of someone who has used Claude Code daily for months. | LOW | Content authoring discipline, not a feature to build. Establish voice guidelines in the writing process. Every configuration example should include WHY that value was chosen. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific guide.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Video embeds per chapter | "Tutorials should have video." Common assumption from non-developer audiences. | Videos break static site performance (large payloads, layout shift, third-party tracking scripts). They go stale faster than text -- Claude Code ships updates weekly (the changelog shows multiple releases per month). Video content cannot be searched, indexed by search engines, or copy-pasted. The target audience (developers) overwhelmingly prefers scannable text + code blocks. YouTube embeds add Google tracking. | Well-crafted SVG diagrams and annotated code examples convey the same information in a searchable, lightweight, theme-aware format. If video is ever added, make it a separate companion resource linked externally, not embedded in chapters. |
| Interactive code playground / sandbox | "Let users try Claude Code in the browser." Sounds compelling for a CLI tool guide. | Claude Code requires API authentication (paid subscription), terminal access, and filesystem operations. A browser sandbox would be a fake simulation that teaches wrong mental models -- the tool IS a CLI that operates on real files. Building a genuine sandbox would require Anthropic API integration, authentication, sandboxed filesystem, and would cost real API tokens per visitor. This is an order of magnitude more complex than the guide itself. | Use realistic, annotated terminal session blocks showing exact input and output. Use SVG diagrams to visualize what happens under the hood during each command. Link to Anthropic's official web interface (claude.ai/code) for actual experimentation. |
| User comments / discussion per chapter | "Build community around the guide." Engagement metric appeal. | Comments require moderation infrastructure, spam prevention, authentication, and a database -- all antithetical to a static Astro site hosted on GitHub Pages. Comment quality on technical guides is historically poor (outdated info, "me too" posts, off-topic questions, spam). Moderation becomes an ongoing time burden. | Link to a GitHub Discussions thread or a specific social media post for each chapter. Community engagement happens where developers already are. Include a "Found an issue?" link to the site's GitHub repo. |
| Progress tracking with localStorage | "Track which chapters I've read." Gamification appeal. | Adds JavaScript complexity for marginal value on a 10-12 chapter guide. The sticky sidebar with clear active state already provides orientation. localStorage tracking creates dark patterns (completion anxiety, gamification pressure) and raises privacy concerns under GDPR. The feature would also break across devices/browsers, creating a fragmented experience. | The chapter sidebar with active state + prev/next navigation + difficulty badges is sufficient wayfinding. The 10-12 chapter scope is small enough that readers naturally track their own progress. |
| AI-powered search within the guide | "Search across all guide content." Modern documentation sites have search. | A 10-12 chapter guide does not have enough content to warrant search infrastructure. Adding Algolia DocSearch or Pagefind increases build complexity, bundle size, and external dependencies for a feature that would handle maybe 50 unique queries. Browser Ctrl+F works for in-page search. The sidebar + TOC already provides structural navigation. | The per-chapter table of contents + sidebar navigation + browser Ctrl+F covers search needs. If the site eventually adds site-wide search, guide content would be included automatically. |
| Automated freshness checking against Claude Code changelog | "Detect when Claude Code updates make guide examples outdated." Maintenance appeal. | Anthropic ships Claude Code updates multiple times per month. Automated checking against the changelog would require CI infrastructure, API calls or scraping, custom diff logic, and notification systems. False positives would vastly outnumber real issues. The core concepts covered (CLAUDE.md, MCP, hooks, permissions, skills) are stable APIs -- only edge-case syntax might change. | Manual review on a monthly cadence. Add a "Last verified: Claude Code vX.Y" badge to each chapter. Core concepts are stable; surface syntax changes are rare and easy to spot during periodic reviews. |
| Multi-language code examples (Python, JS, Go equivalents) | "Show configuration patterns in multiple languages for broader audience appeal." | Claude Code configuration files are language-agnostic. CLAUDE.md is Markdown, settings are JSON, hooks are shell scripts, skills are Markdown with YAML frontmatter. There is nothing language-specific to translate. Showing "the same thing in 3 languages" adds bulk without value and confuses readers about what is actually language-specific vs tool-level configuration. | Use the language appropriate to each context: Markdown for CLAUDE.md, JSON for settings files, Bash for hooks, TypeScript for MCP server examples. One language per example, chosen for accuracy and relevance. |
| Printable / PDF version of the guide | "I want to read the guide offline." | PDF generation from Astro MDX requires a separate build pipeline (Puppeteer, Prince, or WeasyPrint). PDFs lose interactivity, theme support, responsive diagrams, and navigation. Maintaining PDF parity with the web version creates ongoing overhead every time content changes. The effort-to-value ratio is extremely poor. | The static site works offline after first load (service worker or aggressive cache headers). If offline reading is truly needed, a `@media print` CSS stylesheet is 10x simpler than PDF generation and preserves the web format. |
| Real-time Claude Code version detection | "Auto-detect the user's Claude Code version and show relevant docs." | Requires JavaScript that calls `claude --version` -- impossible from a web browser. Even if detected via user agent or manual input, maintaining version-specific content branches creates exponential complexity. The guide covers stable features, not version-specific quirks. | State the minimum Claude Code version required in the guide intro. Note version-specific features inline where relevant (e.g., "Agent teams require v2.1.32+"). |

## Feature Dependencies

```
[Guide JSON metadata] (guide.json for claude-code)
    |
    +--requires--> [Content collection wiring in content.config.ts]
    |                  |
    |                  +--requires--> [MDX chapter files in src/data/guides/claude-code/pages/]
    |                                     |
    |                                     +--enables--> [Per-chapter OG image generation]
    |                                     +--enables--> [FAQ page content]
    |                                     +--enables--> [Companion blog post]
    |
    +--enables--> [Landing page with chapter grid]
    +--enables--> [Sidebar navigation] (ALREADY BUILT -- auto-populated from chapters array)
    +--enables--> [Prev/next chapter nav] (ALREADY BUILT)

[SVG diagram infrastructure] (diagram-base.ts -- ALREADY EXISTS)
    |
    +--enables--> [CLAUDE.md hierarchy diagram]
    +--enables--> [Context window lifecycle diagram]
    +--enables--> [Permission evaluation flowchart]
    +--enables--> [Hook event lifecycle diagram]
    +--enables--> [MCP server topology diagram]
    +--enables--> [Agent team coordination diagram]

[React island support] (ALREADY EXISTS -- pattern proven by DeploymentTopology.tsx)
    |
    +--enables--> [Interactive context window visualizer]
    +--enables--> [Interactive MCP topology] (optional upgrade from static SVG)

[Callout component] (Callout.astro -- ALREADY EXISTS in blog components)
    |
    +--enables--> [Warning/tip/danger blocks in MDX chapters]

[CLAUDE.md template content authoring]
    |
    +--requires--> [Template selector tab component] (new, small)
    +--requires--> [Code blocks with copy button] (ALREADY BUILT via expressive-code)

[Chapter content authoring]
    |
    +--requires--> [All diagrams for that chapter completed first]
    +--requires--> [Callout component available in MDX import]
    +--requires--> [File-path code block pattern established]

[FAQ page]
    |
    +--requires--> [Chapter content completed] (FAQ emerges from chapters)
    +--requires--> [FAQPageJsonLd.astro] (ALREADY BUILT)

[Companion blog post]
    |
    +--requires--> [All chapters completed] (blog summarizes and links to guide)
    +--requires--> [Landing page with URL] (blog links to guide landing)
```

### Dependency Notes

- **Content collection wiring is the critical infrastructure decision.** The existing `content.config.ts` hardcodes the guide pages loader to `./src/data/guides/fastapi-production/pages`. Adding a second guide requires either (a) a second `defineCollection` for `claudeCodeGuidePages` or (b) refactoring to a parameterized/multi-guide loader. Option (a) is simpler and proven; option (b) is cleaner but requires schema changes. This decision blocks all chapter content work.
- **SVG diagrams are independent of content and can be built in parallel.** Each diagram is a self-contained TypeScript generator + Astro wrapper. The `diagram-base.ts` foundation is proven (4+ diagrams already built for FastAPI guide) and tested. Diagram development can happen simultaneously with chapter writing.
- **Interactive React islands are optional upgrades to static SVG diagrams.** Every interactive component (context visualizer, MCP topology) can start as a static SVG and be upgraded to React later. This de-risks the build -- ship static first, enhance with interactivity after launch.
- **FAQ page depends on chapter content.** FAQ questions emerge naturally from the guide content and from observed user confusion. Write chapters first, extract FAQ second. The component and schema infrastructure is already built.
- **Companion blog post is the final deliverable.** It summarizes the guide, cross-links to all chapters, and targets broad search queries. Write it last when all chapter URLs are finalized.
- **The `GuideLayout.astro` needs a minor fix.** It currently hardcodes a companion blog post back-link to the FastAPI guide. This needs to either be parameterized via props or conditionally rendered based on guide slug.

## MVP Definition

### Launch With (v1)

Minimum viable guide -- what is needed to publish a credible, differentiated Claude Code guide that outperforms all existing web-hosted competitors.

- [ ] Guide JSON metadata (`guide.json`) with all chapter slugs and titles for `claude-code` guide
- [ ] Content collection wiring in `content.config.ts` for second guide
- [ ] Landing page at `/guides/claude-code/` with hero section, chapter card grid, and guide description
- [ ] 10-12 MDX chapters covering the full zero-to-hero progression:
  1. **Setup and Installation** -- Installing Claude Code, first run, authentication, environment options (terminal, VS Code, desktop, web)
  2. **CLAUDE.md Memory System** -- File hierarchy, auto-memory, project vs user scope, real examples from author's repos
  3. **Context Window Management** -- 200K token window, auto-compaction at 95%, manual compaction, `/clear`, monitoring usage, compaction instructions in CLAUDE.md
  4. **Permissions and Security** -- Permission types (allow/ask/deny), scope precedence (local > project > user), allowlists, sandboxing, `bypassPermissions` dangers
  5. **Skills and Custom Commands** -- SKILL.md structure, slash commands vs auto-invoked skills, creating reusable workflows, the `.claude/commands/` directory
  6. **Hooks and Automation** -- Event types (PreToolUse, PostToolUse, etc.), bash/shell hook scripts, practical examples (auto-format, auto-lint, notification), lifecycle diagram
  7. **MCP Servers** -- What MCP is, configuring servers, scope override rules, built-in vs third-party servers, security considerations
  8. **Subagents** -- Why isolated context matters, defining agents in `.claude/agents/`, YAML frontmatter, tool restrictions, when to use subagents vs main session
  9. **Agent Teams and Parallel Workflows** -- Research preview feature, lead agent coordination, task delegation, peer-to-peer messaging, practical multi-agent patterns
  10. **Cron and Scheduled Automation** -- `/loop` command, interval scheduling, background execution, auto-expiry (3 days), practical use cases
  11. **Real-World Workflows** -- Putting it all together: daily development patterns, PR review automation, codebase exploration, debugging strategies, project bootstrapping
  12. **Production Patterns and Tips** -- CI/CD integration, GitHub Actions, `.claude/settings.json` optimization, team conventions, scaling Claude Code across a team (optional capstone)
- [ ] 4-6 core SVG architecture diagrams:
  - CLAUDE.md file hierarchy and loading order
  - Context window lifecycle (fill, compact, resume)
  - Permission evaluation flowchart (deny > ask > allow across scopes)
  - Hook event lifecycle (temporal sequence of all hook points)
  - MCP server topology (scope layering + external service connections)
  - Extension system overview (how CLAUDE.md, skills, hooks, MCP, subagents, plugins relate)
- [ ] File-path-annotated code blocks throughout all chapters
- [ ] Callout/admonition blocks for warnings and tips (especially in permissions and hooks chapters)
- [ ] Per-chapter OG images via existing satori + sharp pipeline
- [ ] JSON-LD structured data (Article + BreadcrumbList per chapter, guide landing page)
- [ ] Cross-linking between chapters wherever concepts reference each other
- [ ] Chapter difficulty badges (Beginner for 1-4, Intermediate for 5-7, Advanced for 8-12)
- [ ] In-page table of contents per chapter

### Add After Validation (v1.x)

Features to add within 2-4 weeks of launch once the guide is indexed and receiving traffic.

- [ ] FAQ page with FAQPage JSON-LD -- write after observing which questions readers actually ask and which search queries drive traffic
- [ ] Interactive context window visualizer (React island) -- upgrade the static SVG context diagram to an interactive component with step-through animation
- [ ] CLAUDE.md starter templates with tabbed copy-to-clipboard UI -- after validating which project types and team sizes readers care about
- [ ] Companion blog post -- after all guide chapters are complete and indexed, write a summary post targeting broad queries
- [ ] "Before/After" comparison blocks -- add to CLAUDE.md and permissions chapters where the contrast is most striking
- [ ] Interactive MCP topology diagram (React Flow upgrade from static SVG) -- if the static diagram feels insufficient for showing the layered override model
- [ ] Downloadable starter `.claude/` config bundle -- after template patterns stabilize and are tested across Claude Code versions

### Future Consideration (v2+)

Features to defer until the guide has established search authority and consistent traffic.

- [ ] Agent team coordination interactive diagram -- the feature is still "research preview" and may change significantly before GA
- [ ] GitHub Actions / CI integration dedicated chapter -- deserves its own guide eventually, or becomes Chapter 13
- [ ] SDK / programmatic usage chapter -- Anthropic's Agent SDK is a separate product surface from Claude Code CLI
- [ ] Translated versions -- only if analytics show significant non-English traffic
- [ ] Print stylesheet for offline reading -- only if explicitly requested by users

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| MDX chapters (10-12, full content) | HIGH | HIGH | P1 |
| Guide JSON + content collection wiring | HIGH | LOW | P1 |
| Landing page with chapter grid | HIGH | LOW | P1 |
| Core SVG diagrams (6) | HIGH | HIGH | P1 |
| File-path-annotated code blocks | HIGH | LOW | P1 |
| Callout/admonition blocks in MDX | HIGH | LOW | P1 |
| Per-chapter OG images | MEDIUM | LOW | P1 |
| JSON-LD structured data | MEDIUM | LOW | P1 |
| In-page table of contents | MEDIUM | LOW | P1 |
| Cross-chapter linking | MEDIUM | LOW | P1 |
| Chapter difficulty badges | LOW | LOW | P1 |
| Real CLAUDE.md examples from author repos | HIGH | LOW | P1 |
| FAQ page + FAQPage JSON-LD | MEDIUM | MEDIUM | P2 |
| Interactive context window visualizer | HIGH | HIGH | P2 |
| CLAUDE.md templates with copy UI | MEDIUM | MEDIUM | P2 |
| Companion blog post | MEDIUM | MEDIUM | P2 |
| Before/After comparison blocks | MEDIUM | LOW | P2 |
| Downloadable starter config bundle | MEDIUM | MEDIUM | P2 |
| Interactive MCP topology (React Flow) | MEDIUM | HIGH | P3 |
| Agent team interactive diagram | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- guide is incomplete or undifferentiated without these
- P2: Should have, add within 2-4 weeks of launch to enhance value and SEO
- P3: Nice to have, future consideration based on traffic analytics and feature stability

## Competitor Feature Analysis

| Feature | Official Anthropic Docs | FlorianBruniaux (GitHub, 22K+ lines) | alexop.dev (blog post) | adityabawankule.io (web guide) | Our Approach |
|---------|------------------------|--------------------------------------|------------------------|-------------------------------|--------------|
| Architecture diagrams | None (text-only docs) | 41 Mermaid diagrams (GitHub-rendered, no dark mode, no custom styling, not responsive) | None | None | Programmatic SVG with theme-aware palette via CSS vars, ARIA accessible, responsive viewBox, tested TypeScript generators |
| Interactive elements | Accordion groups, tabs in docs | 271-question quiz, onboarding prompt, setup audit tool | None | None | Interactive context window visualizer (React island), potential React Flow topology for MCP |
| Code examples | Inline snippets, generic | 204 templates (raw .md files in repo directories) | Inline snippets in blog | Inline snippets | File-path-annotated blocks with copy button, linked to real repos via CodeFromRepo pattern, real examples from author's production projects |
| Structured data / SEO | Basic HTML meta tags | None (GitHub README renders, no SEO control) | Standard blog post meta | Basic meta + breadcrumbs | Article JSON-LD per chapter, BreadcrumbList, FAQPage JSON-LD, custom OG images per chapter, sitemap inclusion |
| Progressive structure | Flat docs hierarchy (all pages at same level) | 10 sections in a single 22K-line guide.md (monolithic) | Single long blog post | Sectioned single page | 10-12 separate chapter pages with explicit difficulty progression, sidebar nav, prev/next navigation |
| Real-world examples | Generic examples | Production templates (204) but no project context showing actual usage | Personal experience narrative (strong) | Mixed generic/personal | Author's actual CLAUDE.md files from public repos + generic patterns with opinionated recommendations |
| Accessibility | Standard web docs | None (GitHub Markdown, no ARIA, no keyboard nav) | Standard blog accessibility | Standard blog | ARIA labels on all SVG diagrams, keyboard-navigable sidebar, semantic HTML throughout, screen-reader-tested |
| Context management coverage | Brief best practices page listing 5 tips | Section within the large guide | Not covered | Brief mention | Dedicated chapter + static diagram + interactive visualizer (key differentiator) |
| Permissions coverage | Dedicated permissions doc page (good) | Comprehensive security section with threat database | Brief mention | Brief section | Dedicated chapter + visual permission evaluation flowchart (no competitor has the visual) |
| Hook documentation | Event types listed in a table | 31 hook templates with bash + PowerShell | Not covered | Not covered | Dedicated chapter with lifecycle sequence diagram + practical examples |
| Agent teams coverage | Dedicated docs page (brief, feature is new) | Agent teams workflow guide | Not covered | Not covered | Dedicated chapter with coordination diagram, practical patterns, honest assessment of research preview limitations |
| Offline / performance | Fast SSR docs site | Instant (GitHub renders Markdown natively) | Standard blog performance | Standard blog | Static site with zero external dependencies, aggressive caching, lazy-loaded React islands only where needed |
| Security depth | Permissions page + sandboxing docs | Comprehensive threat intelligence database (655 catalogued malicious skills, 24 CVE mappings) | Not covered | Not covered | Practical security guidance with permission flowchart. We do NOT compete on threat intelligence -- that is FlorianBruniaux's niche. Focus on "how to configure safely" rather than "catalog of threats." |

**Key competitive insight:** FlorianBruniaux's guide is the closest competitor and is genuinely excellent -- but it is a 22K-line GitHub Markdown file with no SEO, no dark mode diagrams, no structured data, and no web UX polish. The official Anthropic docs are authoritative but neutral and diagram-free. Every other guide is a blog post. The opportunity is a polished, visual, web-native guide with practitioner authority that bridges the gap between FlorianBruniaux's depth and the official docs' authority.

## Sources

**Official Documentation (HIGH confidence):**
- [Claude Code Overview](https://code.claude.com/docs/en/overview) -- Feature overview, installation, deployment surfaces
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) -- Context management, compaction strategies, workflow patterns
- [Claude Code Permissions](https://code.claude.com/docs/en/permissions) -- Permission model: allow/ask/deny rules, scope precedence, sandboxing
- [Claude Code Skills](https://code.claude.com/docs/en/skills) -- SKILL.md structure, slash commands, auto-invocation
- [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams) -- Multi-agent orchestration, task delegation, peer messaging
- [Claude Code Features Overview](https://code.claude.com/docs/en/features-overview) -- Extension points: MCP, hooks, skills, subagents, plugins
- [Claude Code Memory](https://code.claude.com/docs/en/memory) -- CLAUDE.md file hierarchy, auto-memory, loading behavior
- [Compaction API docs](https://platform.claude.com/docs/en/build-with-claude/compaction) -- Technical details of context compaction

**Competing Guides (analyzed for feature gaps, MEDIUM confidence):**
- [FlorianBruniaux/claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide) -- Most comprehensive community guide: 22K+ lines, 204 templates, 41 Mermaid diagrams, 271-question quiz, 655 catalogued threats
- [alexop.dev - Understanding Claude Code's Full Stack](https://alexop.dev/posts/understanding-claude-code-full-stack/) -- Best conceptual clarity on feature layer dependencies (MCP -> core -> plugins -> skills)
- [adityabawankule.io - Claude Code Complete Guide](https://www.adityabawankule.io/guides/claude-code-complete-guide) -- Web-hosted guide with sidebar nav, FAQ section, metadata tags
- [okhlopkov.com - Claude Code Setup Guide](https://okhlopkov.com/claude-code-setup-mcp-hooks-skills-2026/) -- Practical setup-focused guide
- [awesomeclaude.ai Cheatsheet](https://awesomeclaude.ai/code-cheatsheet) -- Quick reference format for commands and config

**Ecosystem Resources (MEDIUM confidence):**
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) -- Curated list of skills, hooks, commands, plugins, agent orchestrators
- [Claude Code Cron Scheduling](https://winbuzzer.com/2026/03/09/anthropic-claude-code-cron-scheduling-background-worker-loop-xcxwbn/) -- Latest feature announcement (March 2026)
- [SFEIR Institute Context Management](https://institute.sfeir.com/en/claude-code/claude-code-context-management/optimization/) -- Context optimization strategies, compaction threshold tuning
- [claudefa.st Agent Teams guide](https://claudefa.st/blog/guide/agents/agent-teams) -- Practical agent teams patterns and recommendations

**SEO and Structured Data (HIGH confidence):**
- [Google Structured Data Guide](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) -- JSON-LD implementation for Article, BreadcrumbList, FAQPage schemas

**Existing Site Infrastructure (HIGH confidence -- local verification):**
- `GuideLayout.astro` -- Proven guide layout with sidebar, breadcrumbs, chapter nav
- `GuideSidebar.astro` -- Sticky sidebar with active state
- `GuideChapterNav.astro` -- Prev/next chapter navigation
- `CodeFromRepo.astro` -- File-path-annotated code blocks with source links
- `GuideJsonLd.astro` -- Article JSON-LD for guide pages
- `diagram-base.ts` -- SVG diagram foundation with theme-aware palette
- `DeploymentTopology.tsx` -- React Flow interactive diagram pattern (React island with `client:visible`)
- `FAQPageJsonLd.astro` -- FAQ structured data component
- `content.config.ts` -- Zod-validated content collections with glob loaders

---
*Feature research for: Claude Code Developer Guide (subsequent milestone on Astro 5 portfolio site)*
*Researched: 2026-03-10*
