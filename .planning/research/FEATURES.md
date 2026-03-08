# Feature Research

**Domain:** Multi-page production framework guide (FastAPI) as a portfolio content section
**Researched:** 2026-03-08
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist when visiting a multi-page technical guide. Missing these and the guide feels amateurish or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Landing page with guide overview | Every multi-page guide starts with a table of contents and "why read this" pitch. Users need to orient before diving in. | LOW | Reuse EDA landing page card-grid pattern. Show all ~11 domain pages with brief descriptions. |
| Per-domain deep-dive pages (~11) | The guide's core promise. Each production concern (auth, middleware, observability, etc.) gets its own page with full treatment. | MEDIUM | Builder, Auth/JWT, Middleware, Observability, Database, Docker, Testing, Health checks, Security headers, Rate limiting, Caching. One .astro page per domain. |
| Code snippets from the actual template | Developers expect real code, not pseudocode. Snippets must come from the fastapi-template repo so readers can verify them. | LOW | astro-expressive-code already configured site-wide. Use Python/YAML/Bash fenced blocks. Copy-paste accuracy is critical. |
| Syntax highlighting with copy button | Standard in 2026. Every technical guide site has it. Users penalize for missing it. | NONE | Already available via astro-expressive-code (existing site pattern). Zero new work. |
| Breadcrumb navigation | Orients users within the guide hierarchy. Guides > FastAPI Production > [Current Page]. Existing pattern in EDA and tool rule pages. | LOW | Reuse EdaBreadcrumb pattern. Guides > FastAPI Production > {page title}. |
| Previous/next page navigation | Multi-page guides need sequential reading flow. Readers expect prev/next links at the bottom of each domain page. | LOW | Ordered list of domain pages. Prev/next with page titles. Omit prev on first, next on last. Similar to beauty-index [slug] prev/next pattern. |
| Responsive layout (mobile/tablet/desktop) | Non-negotiable for any web content. The site already has this. | NONE | Inherited from Layout.astro + Tailwind. Zero new work. |
| Build-time OG images per page | Every content section on this site generates OG images. Users sharing guide links on social media expect preview cards. | LOW | Existing Satori + Sharp pipeline. ~12 images (landing + 11 domain pages). Follow established og-image.ts pattern. |
| JSON-LD structured data | Site-wide pattern. TechArticle or Article schema for each guide page. BreadcrumbList for navigation. | LOW | Reuse existing JSON-LD component patterns. TechArticle schema fits best for instructional content. |
| Sitemap inclusion | All pages must appear in sitemap-index.xml. Automatic via Astro's @astrojs/sitemap. | NONE | Zero work -- Astro handles this for any page in src/pages/. |
| LLMs.txt integration | Existing site feature. Guide pages should appear in LLMs.txt for AI discoverability. | LOW | Add guide section entries to existing LLMs.txt generation. |
| Header navigation link | Every content section (Beauty Index, DB Compass, EDA, Tools) has a header nav entry. Users expect to find the guide from the top nav. | LOW | Add "Guides" to navLinks in Header.astro. |
| Homepage callout | Every content section gets a homepage callout card. Drives discovery from the landing page. | LOW | Add a callout section following the existing EDA/DB Compass/Tools pattern. |
| Table of contents per page | Long-form technical pages need in-page navigation. Existing blog posts have auto-generated TOC. | LOW | Each domain page likely 1500-3000 words. Reuse blog post TOC pattern (remark-toc or manual H2/H3 anchors). |
| Cross-link to template repo | Users reading a guide about a template need to find the template. Every page should link to the GitHub repo. | LOW | Persistent CTA banner or sidebar link to github.com/PatrykQuantumNomad/fastapi-template. |

### Differentiators (Competitive Advantage)

Features that make this guide stand out from the dozens of "FastAPI in production" blog posts and README docs.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI agent enablement narrative | The unique angle: "Every production concern is handled so your AI agent only writes business logic." No other FastAPI guide frames NFR coverage as agent-enablement. Positions the author as forward-thinking architect. | LOW | Narrative framing, not a feature to build. Woven into landing page hero and each domain page intro/outro. Each page ends with "What the agent never has to think about: [list]." |
| Architecture diagrams (SVG, build-time) | Visual learners need diagrams. Most competing guides are text-only blog posts. Build-time SVGs match the site's existing pattern (13+ SVG generators). Key diagrams: request flow through middleware stack, builder pattern composition, deployment topology, auth flow. | MEDIUM | 4-6 architecture diagrams as build-time SVG components. Request flow is the hero diagram on the landing page. Each domain page gets at least one diagram showing where that concern fits in the overall architecture. |
| "Why not the obvious approach" sections | Each domain page explains what the template does AND why the obvious alternative is wrong. E.g., "Why raw ASGI middleware, not BaseHTTPMiddleware" (ADR-0003). This is what 17-year architect expertise looks like -- knowing what NOT to do. | LOW | Content-only. Each page has a "Why not X?" callout box. Content sourced from the 5 ADRs in fastapi-template/docs/adr/. |
| Builder pattern as compositional narrative | The guide's structural metaphor: the Builder pattern is how the app composes itself, and the guide mirrors this by building up understanding one concern at a time. Each domain page is a "setup_*() method explained." | LOW | Narrative framing. The landing page shows the full builder chain, then each domain page expands one method. |
| Companion blog post with bidirectional cross-links | Existing site pattern (every content section has one). The blog post targets different search intents ("FastAPI production best practices 2026") while the guide pages target specific concerns ("FastAPI JWT authentication production"). | LOW | 1 MDX blog post, ~2000 words, linking to all 11 domain pages. Domain pages link back. Proven SEO pattern from 6 prior content sections. |
| Production checklist callouts | Each domain page includes a "Production checklist" -- 3-5 actionable items specific to that concern. E.g., for Auth: "Rotate JWKS keys quarterly, never HS256 in prod, validate audience claim." Practical value that blog posts lack. | LOW | Content-only. Styled as a checklist component (checkbox list with check icons). |
| Configuration reference per domain | Each page includes the relevant APP_* environment variables for that concern, pulled from the template's configuration.md. Saves readers from hunting through a monolithic config doc. | LOW | Content-only. Table of env vars relevant to each domain page. Source: fastapi-template/docs/configuration.md. |
| Self-contained guide (no repo dependency) | The guide stands alone. A reader who never clones the template still learns production FastAPI patterns. Rare -- most template docs assume you have the code open. | LOW | Content discipline, not a feature to build. Ensure each code snippet has enough context to understand without the repo. |
| Domain page reading time estimate | Signals content depth. "12 min read" tells users this is a thorough treatment, not a surface skim. | LOW | Existing pattern from blog posts. Calculate from word count. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build for this guide section.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Interactive code playground / REPL | "Let users run the code in-browser" sounds appealing for a Python guide. | Python REPL requires Pyodide (14MB+ WASM). Destroys Lighthouse performance. Already rejected as anti-pattern in PROJECT.md. The guide is about configuration, not runtime execution. | Static code snippets with copy button. Link to the template repo for hands-on experimentation. |
| Live API demo endpoint | "Show a running instance of the template." | Requires hosting a backend server. The site is static (GitHub Pages). Adds ongoing maintenance, security surface, and cost. | Architecture diagrams + code snippets convey the same information without runtime dependency. |
| Video walkthroughs embedded per page | "Add a video explaining each section." | Video production is a separate content stream. Embedding videos adds 2-5MB per page (YouTube embeds), breaks Lighthouse performance, and creates content that cannot be searched or indexed. | Well-written prose with diagrams. Video can be a future separate effort linked externally. |
| Client-side diagram interactivity (zoom/pan/click) | "Make diagrams interactive like the React Flow dependency graphs." | The existing React Flow pattern serves tool UIs (compose validator, k8s analyzer) where users need to explore their own data. Guide diagrams are fixed architecture visualizations -- interactivity adds complexity without value. | Static SVG diagrams with clear labeling. Build-time generation matches site pattern. |
| Diff views showing template customization | "Show how to modify the template for custom use cases." | Scope explosion. Every customization path multiplies content. The guide teaches the template's decisions, not how to fork it. | "Why this approach" sections explain the reasoning. Users who understand the reasoning can customize themselves. |
| Auto-generated content from template source | "Parse the Python source and generate guide content automatically." | Tight coupling between guide site and template repo. Content quality requires human curation. Automated extraction produces reference docs, not pedagogical guides. | Manually curated code snippets verified against the source. Human-authored explanations. |
| Multi-language code examples (Go, Node.js equivalents) | "Show the same patterns in other languages." | 11x scope multiplier per language. The guide is specifically about this FastAPI template. Cross-language comparisons dilute the focused value proposition. | Single-language focus. The patterns (builder, middleware, health checks) are language-agnostic concepts explained through Python implementation. |
| Comments / discussion per page | "Let readers ask questions on each guide page." | Requires moderation infrastructure. Attracts spam. Already rejected in PROJECT.md constraints. | "Reply via email" link or link to GitHub Discussions on the template repo. |
| Progressive disclosure / accordion sections | "Collapse advanced content behind toggles." | Each domain page is already focused on one concern. Hiding content behind accordions hurts SEO (search engines may not index collapsed content) and breaks the reading flow of a pedagogical guide. | Use clear H2/H3 hierarchy. Readers scan headings to find what they need. |

## Feature Dependencies

```
Landing Page
    |-- requires --> Domain Page Template (shared layout for all 11 pages)
    |-- requires --> Guide Navigation Data (ordered list of pages for prev/next)
    |-- requires --> GuideLayout.astro (extends Layout.astro, like EDALayout.astro)

Domain Pages (all 11)
    |-- requires --> GuideLayout.astro
    |-- requires --> Guide Navigation Data
    |-- requires --> Code Snippet Content (extracted from fastapi-template)
    |-- requires --> Breadcrumb Component

Architecture Diagrams
    |-- requires --> SVG Generator Functions (TypeScript, build-time)
    |-- enhances --> Landing Page (hero request-flow diagram)
    |-- enhances --> Domain Pages (contextual diagrams)

OG Images
    |-- requires --> Landing Page + Domain Pages (need titles/descriptions)
    |-- requires --> og-image.ts extension (existing pipeline)

Header Navigation
    |-- requires --> Landing Page (needs a URL to link to)
    |-- independent of --> Domain Pages

Homepage Callout
    |-- requires --> Landing Page
    |-- independent of --> Domain Pages

Companion Blog Post
    |-- requires --> All Domain Pages (cross-links to each)
    |-- requires --> Landing Page

JSON-LD Structured Data
    |-- requires --> Guide pages to exist
    |-- independent of --> other features

LLMs.txt Integration
    |-- requires --> All pages finalized (needs URLs and descriptions)

Site Integration (sitemap, header, homepage)
    |-- requires --> All content pages built
```

### Dependency Notes

- **All Domain Pages require GuideLayout.astro:** A shared layout component (like EDALayout.astro) provides consistent styling, navigation, and structure across all guide pages without per-page boilerplate.
- **Guide Navigation Data required early:** An ordered array of {slug, title, description} drives both the landing page card grid AND the prev/next navigation on domain pages. This data structure must be defined before any pages are built.
- **Architecture Diagrams enhance but do not block:** Diagrams add significant value but pages can ship with placeholder spots. Diagrams can be added incrementally.
- **Companion Blog Post is the final dependency:** It cross-links to all domain pages, so it must be written after all pages exist.
- **OG Images require finalized titles:** The Satori pipeline needs page titles and descriptions. Generate after content is stable to avoid rebuild churn.

## MVP Definition

### Launch With (v1)

Minimum set to ship a complete, valuable guide section.

- [ ] GuideLayout.astro with consistent styling, breadcrumbs, prev/next navigation
- [ ] Guide navigation data (ordered page list with slugs, titles, descriptions)
- [ ] Landing page at /guides/fastapi-production/ with hero section, AI agent narrative, and domain page grid
- [ ] All 11 domain deep-dive pages with full prose, code snippets, and "why not" callouts
- [ ] 4-6 architecture diagrams (request flow, middleware stack, builder pattern, auth flow, deployment topology, database lifecycle)
- [ ] AI agent narrative woven into landing page hero and each domain page intro/outro
- [ ] Production checklist callout per domain page
- [ ] Configuration reference (APP_* env vars) per domain page
- [ ] Build-time OG images for landing page + all domain pages (~12 total)
- [ ] Header navigation entry ("Guides")
- [ ] Homepage callout card
- [ ] JSON-LD structured data (TechArticle + BreadcrumbList)
- [ ] Companion blog post with bidirectional cross-links
- [ ] LLMs.txt integration
- [ ] Cross-link to fastapi-template repo on every page

### Add After Validation (v1.x)

Features to add once the guide is live and traffic patterns are visible.

- [ ] Additional architecture diagrams for complex flows (e.g., JWKS key rotation, rate limiter state machine) -- triggered by user engagement data showing which pages get most traffic
- [ ] "Quick reference" summary cards -- one-page cheat sheets per domain, triggered if users bookmark/share specific pages frequently
- [ ] Guide search / filter -- triggered if page count grows beyond ~15 pages (current 11 is manageable without search)

### Future Consideration (v2+)

Features to defer until the guide proves its value.

- [ ] Additional guide sections for other templates (e.g., /guides/nextjs-production/, /guides/go-production/) -- only after FastAPI guide validates the format
- [ ] Printable / PDF export -- requires separate styling pass, low priority for web-first audience
- [ ] Versioned guides (v1, v2 of the template) -- only if the template undergoes breaking changes

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Landing page with AI agent narrative | HIGH | LOW | P1 |
| 11 domain deep-dive pages | HIGH | MEDIUM | P1 |
| Code snippets from template | HIGH | LOW | P1 |
| Architecture diagrams (4-6 SVGs) | HIGH | MEDIUM | P1 |
| Prev/next navigation | HIGH | LOW | P1 |
| Breadcrumb navigation | MEDIUM | LOW | P1 |
| GuideLayout.astro | HIGH | LOW | P1 |
| Build-time OG images | MEDIUM | LOW | P1 |
| Header nav link | MEDIUM | LOW | P1 |
| Homepage callout | MEDIUM | LOW | P1 |
| JSON-LD structured data | MEDIUM | LOW | P1 |
| Companion blog post | HIGH | LOW | P1 |
| LLMs.txt integration | LOW | LOW | P1 |
| Production checklist callouts | MEDIUM | LOW | P1 |
| Configuration reference per page | MEDIUM | LOW | P1 |
| AI agent narrative per domain | HIGH | LOW | P1 |
| "Why not X?" callout sections | HIGH | LOW | P1 |
| Table of contents per page | MEDIUM | LOW | P1 |
| Cross-link to template repo | MEDIUM | LOW | P1 |
| Reading time estimates | LOW | LOW | P2 |
| Additional diagrams | MEDIUM | MEDIUM | P2 |
| Quick reference cards | MEDIUM | MEDIUM | P3 |
| Guide search | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- these define the guide's completeness and differentiation
- P2: Should have, add when possible -- enhances but not critical
- P3: Nice to have, future consideration -- only if guide proves popular

## AI Agent Narrative Strategy

The AI agent angle is the guide's unique differentiator. Research into how production-ready framework guides handle narrative framing reveals three options:

### Option A: Separate "AI Agent" Section
A dedicated page explaining the AI agent use case. Other pages are pure technical reference.

**Verdict: REJECT.** Isolating the narrative to one page means 10 out of 11 pages read like every other FastAPI guide. The angle becomes an afterthought.

### Option B: Woven Throughout Every Page
Each domain page opens with an AI-agent-framed motivation and closes with "what the agent never has to worry about." The landing page hero leads with the agent narrative.

**Verdict: ADOPT.** This is the recommended approach because:
- Every page reinforces the unique value proposition
- SEO benefit: "FastAPI production [topic] for AI agents" creates differentiated search intent
- The framing is honest -- production NFR coverage genuinely does enable agentic code generation
- It positions the author as an architect who thinks about the AI-assisted development future

### Option C: Framing Narrative Only (Landing Page)
The landing page pitches the AI agent angle. Domain pages are standard technical content.

**Verdict: PARTIAL.** Too weak. The narrative evaporates after one click.

### Recommended Implementation

**Landing page hero:** "Production FastAPI -- so your AI agent writes business logic, not infrastructure."

**Each domain page:**
- **Opening paragraph:** Frame the concern in agent terms. E.g., Middleware page: "When an AI agent generates a new endpoint, it should never have to think about request timeouts, body size limits, or security headers. The middleware stack handles all of it."
- **Closing section:** "What the agent inherits for free" -- 3-5 bullet points listing the NFRs that domain page covers.
- **Tone:** Confident, not hypothetical. Present tense. "The agent writes a route handler. The middleware stack ensures it has a request ID, structured logging, and a 30-second timeout."

## Competitor Feature Analysis

| Feature | FastAPI Official Template | Typical Blog Post Guide | s3rius/FastAPI-template | This Guide |
|---------|--------------------------|-------------------------|------------------------|------------|
| Landing page with overview | README only | No (single long post) | README only | Dedicated landing page with visual grid |
| Per-concern deep dives | docs/ directory (flat files) | Sections in one post | CLI generator docs | 11 dedicated pages, each 1500-3000 words |
| Architecture diagrams | None (text only) | Rare (1-2 if any) | None | 4-6 build-time SVGs |
| AI agent narrative | None | None | None | Woven throughout every page |
| Code from real template | Template IS the code | Generic examples | Template IS the code | Curated snippets with explanations |
| Production checklists | Scattered in docs | Sometimes | None | Structured per domain page |
| "Why not" reasoning | None | Rarely | None | ADR-sourced on every page |
| OG images | None | Blog platform default | None | Custom per page |
| JSON-LD / SEO | None | Blog platform default | None | TechArticle + BreadcrumbList |
| Companion blog post | None | N/A (is the blog post) | None | Dedicated blog post with cross-links |
| Cross-linked navigation | docs/ flat list | Single scroll | None | Prev/next + breadcrumbs + landing grid |

**Key insight:** No existing FastAPI guide combines all three of: (1) multi-page depth, (2) architecture diagrams, and (3) an AI agent narrative angle. Most are either monolithic blog posts or bare-bones README docs. The gap is wide.

## Domain Page Content Map

Each of the 11 domain pages follows a consistent structure:

| # | Domain Page | Key Content | Template Source | Diagrams Needed |
|---|-------------|-------------|-----------------|-----------------|
| 1 | Builder Pattern | App factory, fluent builder, setup_*() chain, testability | app_builder.py, ADR-0001 | Builder composition flow |
| 2 | Authentication (JWT) | 3 verification modes, JWKS rotation, stateless validation | auth/, security.md | Auth flow diagram |
| 3 | Middleware Stack | 6 raw ASGI middlewares, registration order, why not BaseHTTPMiddleware | middleware/, ADR-0003 | Request flow through middleware stack |
| 4 | Observability | OpenTelemetry tracing, Prometheus metrics, structured JSON logging | observability/, monitoring.md | Observability pipeline diagram |
| 5 | Database | Async SQLAlchemy, SQLite-first, Postgres migration, Alembic | db/, configuration.md | Database lifecycle diagram |
| 6 | Docker | Multi-stage build, tini, unprivileged user, digest-pinned images | Dockerfile, docker-compose*.yml | Deployment topology diagram |
| 7 | Testing | Test architecture, fixtures, coverage, builder testability | tests/, testing.md | None (code-focused) |
| 8 | Health Checks | Readiness vs liveness, ReadinessRegistry, dependency-aware | readiness/, ADR-0005 | Health check decision tree |
| 9 | Security Headers | HSTS, CSP, Permissions-Policy, X-Content-Type-Options | security_headers.py, security.md | None (table-focused) |
| 10 | Rate Limiting | Memory and Redis backends, sliding window, per-route config | rate_limit.py, configuration.md | None (config-focused) |
| 11 | Caching | Optional layer, cache key strategies, invalidation | cache/, configuration.md | None (config-focused) |

## Per-Domain Page Structure Template

Each domain page follows this consistent structure for pedagogical coherence:

1. **Agent framing intro** (1 paragraph) -- Why this concern matters in an agent-assisted world
2. **The problem** (1-2 paragraphs) -- What goes wrong without this concern handled
3. **How the template solves it** (core content, 500-1500 words) -- Code snippets, configuration, architecture
4. **Why not the obvious approach** (1 callout box) -- The architectural decision and its rationale
5. **Configuration reference** (table) -- Relevant APP_* environment variables
6. **Production checklist** (3-5 items) -- Actionable deployment items
7. **What the agent inherits for free** (closing section) -- NFRs covered by this domain

## Sources

- FastAPI Official Full-Stack Template: https://github.com/fastapi/full-stack-fastapi-template
- FastAPI Production Deployment Best Practices (Render): https://render.com/articles/fastapi-production-deployment-best-practices
- FastAPI Best Practices for Production 2026 (FastLaunchAPI): https://fastlaunchapi.dev/blog/fastapi-best-practices-production-2026
- Google Cloud: A Dev's Guide to Production-Ready AI Agents: https://cloud.google.com/blog/products/ai-machine-learning/a-devs-guide-to-production-ready-ai-agents
- Canada.ca Ordered Multi-Page Navigation Pattern: https://design.canada.ca/common-design-patterns/ordered-multipage.html
- W3C Breadcrumb Pattern (WAI-ARIA APG): https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
- Mermaid Architecture Diagrams (v11.1.0+): https://mermaid.ai/open-source/syntax/architecture.html
- D2 vs Mermaid Comparison: https://aaronjbecker.com/posts/mermaid-vs-d2-comparing-text-to-diagram-tools/
- Product Strategy -- Sequencing Table Stakes vs Differentiators: https://www.productteacher.com/articles/sequencing-table-stakes-and-differentiators
- FastAPI template source material: /Users/patrykattc/work/git/fastapi-template (local, HIGH confidence)
- Existing site patterns: /Users/patrykattc/work/git/PatrykQuantumNomad/src (local, HIGH confidence)

---
*Feature research for: FastAPI Production Guide (v1.15 milestone)*
*Researched: 2026-03-08*
