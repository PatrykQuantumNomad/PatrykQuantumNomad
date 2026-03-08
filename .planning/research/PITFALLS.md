# Pitfalls Research

**Domain:** Adding a multi-page FastAPI production guide section to an existing 1010+ page Astro 5 static site
**Researched:** 2026-03-08
**Confidence:** HIGH (site structure verified from source, FastAPI template inspected, 14 prior milestones provide strong pattern evidence)

## Critical Pitfalls

### Pitfall 1: Code Snippet Drift -- Guide Snippets Diverge From Template Code

**What goes wrong:**
The guide will contain code snippets extracted from the FastAPI template repository (github.com/PatrykQuantumNomad/fastapi-template). Within weeks, the template evolves -- dependency updates (Dependabot is already merging PRs today), refactors, new features -- while the guide snippets remain frozen in MDX files. Readers clone the template, see different code than the guide shows, lose trust in the content, and file issues or abandon the guide entirely.

This is the single highest-risk pitfall for this milestone. The FastAPI template had 20+ commits on a single day (2026-03-08) including dependency bumps for ruff, redis, and multiple GitHub Actions. The template is actively maintained and evolving.

**Why it happens:**
Code snippets are copied into MDX/Astro files as static text during guide authoring. There is no mechanism to detect when the source files change. Unlike the EDA Encyclopedia (which references static NIST data that never changes) or the Dockerfile Analyzer (which contains self-authored rules), this guide references a living, external codebase. The previous 14 milestones have not encountered this pattern -- every prior content section used either self-contained data (languages.json, models.json, techniques.json) or self-authored analysis rules.

**How to avoid:**
1. **Snapshot the template at a specific git tag/commit.** Create a tagged release (e.g., `v1.0.0`) of the fastapi-template repo. All guide snippets reference this exact version. The guide intro clearly states: "This guide covers fastapi-template v1.0.0."
2. **Use file path + line range comments** in each snippet: `<!-- source: src/app/builder.py L12-L45 @ v1.0.0 -->`. This creates a machine-readable audit trail.
3. **Show conceptual patterns, not exact implementations.** Snippets should demonstrate the pattern (e.g., builder composition, middleware stacking) rather than copy-pasting entire files. Conceptual snippets survive refactors better than verbatim code.
4. **Add a "Last verified" date** to the guide landing page footer. Readers can see at a glance whether the guide is current.

**Warning signs:**
- A dependency update in the template changes import paths or API signatures
- Template README changes function names or configuration keys that the guide references
- Readers open issues saying "the code in the guide doesn't match the repo"
- The guide references a file path that no longer exists in the template

**Phase to address:** Phase 1 (Content planning). Tag the template repo and establish the snippet strategy before writing any guide content. Every subsequent content phase must follow this convention.

---

### Pitfall 2: Scope Creep -- Guide Becomes a Full FastAPI Course

**What goes wrong:**
The template covers 10+ production domains (builder pattern, JWT auth, middleware, observability, database, Docker, testing, health checks, security headers, rate limiting, caching). Each domain is deep enough for its own multi-article series. A "comprehensive guide" for each domain easily expands from the planned ~12 pages to 30-40 pages. Authentication alone could fill 5 pages (JWT mechanics, key rotation, JWKS discovery, token refresh, testing auth). Observability could fill another 5 (OpenTelemetry spans, Prometheus metrics, structured logging, Grafana dashboards, alerting rules).

The EDA Encyclopedia started as "modernize NIST Chapter 1" and delivered 90+ pages across 8 phases. The Beauty Index started as "rank languages" and grew to 26 detail pages + 650 VS comparisons + code comparison explorer. This project has a demonstrated pattern of scope expansion.

**Why it happens:**
The template is genuinely deep. Every domain has nuances worth explaining. The AI agent narrative adds a tempting thread to pull ("what if we showed how agents use each domain?"). Writing about production concerns naturally leads to edge cases, failure modes, and operational stories that are all valuable but not all necessary for the guide's purpose.

**How to avoid:**
1. **Hard cap at ~12 pages** (landing + 11 domain pages). No exceptions without explicit scope amendment.
2. **Define the depth boundary per page:** Each domain page covers WHAT the template does, WHY that decision was made, and HOW to configure it. It does NOT cover the full theory behind the domain (no "What is JWT?" -- link to external resources instead).
3. **Use the ADR pattern:** The template already has 5 ADRs (builder pattern, factory function, raw ASGI middleware, proxy trust, health separation). Each guide page should follow a similar "decision + rationale + trade-offs" structure rather than a "tutorial + exercises" structure.
4. **The guide is a map, not a textbook.** It shows the territory and explains the decisions. Readers who want to learn JWT from scratch should go elsewhere. Readers who want to understand why THIS template chose static keys over JWKS for the default config -- that is the guide's job.

**Warning signs:**
- Any single domain page exceeding 2,000 words of prose (not counting code snippets)
- Adding sub-pages within a domain (e.g., `/guides/fastapi-production/auth/jwt/` and `/guides/fastapi-production/auth/jwks/`)
- Creating new components specifically for one guide page
- The phrase "we should also cover..." appearing in planning

**Phase to address:** Phase 1 (Content planning). Define the page list and per-page scope boundaries. Revisit the boundary at each phase start.

---

### Pitfall 3: SEO Cannibalization -- Guide Pages Compete With Future Blog Posts

**What goes wrong:**
The site already has 22 blog posts. Every prior content section (Dockerfile Analyzer, Compose Validator, K8s Analyzer, DB Compass, EDA Encyclopedia) ships with a companion blog post that cross-links to the tool/section. If the guide pages at `/guides/fastapi-production/observability/` rank for "FastAPI observability" and a future companion blog post at `/blog/fastapi-observability-best-practices/` targets the same keywords, Google limits results per domain and both pages underperform. Neither reaches page 1.

The existing blog-to-tool pattern works because the blog post is a narrative overview ("why these rules matter") while the tool pages are reference documentation (individual rule pages). For the guide, the boundary is fuzzier -- guide pages ARE narrative content, just like blog posts.

**Why it happens:**
The guide structure (multi-page narrative with code examples explaining "why" decisions were made) occupies the exact same content niche as a blog post series. When both exist, Google must choose which to rank, and it often chooses neither decisively.

**How to avoid:**
1. **Write the companion blog post FIRST in the planning phase** (even if just an outline). Define its keyword targets and narrative angle before writing guide pages. The blog post should be the entry point ("I built a FastAPI template for AI agents -- here's why every production concern matters") while guide pages are the depth layer.
2. **Use a hub-and-spoke model:** The blog post is the hub targeting broad keywords ("FastAPI production template", "FastAPI best practices"). Guide pages are spokes targeting specific long-tail keywords ("FastAPI builder pattern composition", "FastAPI ASGI middleware stack order", "FastAPI readiness vs liveness health checks").
3. **Canonical cross-linking:** Every guide page links to the companion blog post. The blog post links to all 11 guide pages. This tells Google they are a related cluster, not competitors.
4. **Differentiate search intent:** Blog post serves informational intent ("what should I know about production FastAPI?"). Guide pages serve navigational/transactional intent ("show me how to configure the middleware stack in this template").

**Warning signs:**
- Google Search Console shows multiple URLs from the site competing for the same query
- Guide page titles overlap with blog post titles (e.g., both contain "FastAPI Production Best Practices")
- Guide pages are written in blog-style first-person narrative rather than reference/guide style
- Internal links between blog and guide are missing or one-directional

**Phase to address:** Phase 1 (Content planning -- define keyword boundaries), final integration phase (implement cross-linking and JSON-LD).

---

### Pitfall 4: Architecture Diagram Maintenance Burden

**What goes wrong:**
The guide requires architecture diagrams (request flow, middleware stack, builder pattern, deployment topologies). If these are created as static images (PNG/SVG exported from a design tool), they become unmaintainable artifacts. When the middleware stack changes order, or a new middleware is added, someone must open the design tool, edit the diagram, re-export, and update the image reference. This never happens. The diagrams go stale silently because there is no CI check or build error to catch outdated visuals.

The site already has 17 build-time SVG generators for the EDA section. But those generate data visualizations from typed data (technique scores, distribution curves), not architectural diagrams with labels, arrows, and layout logic.

**Why it happens:**
Architecture diagrams are high-effort to create and modify. Unlike code (where tests catch regressions) or data visualizations (where the data model enforces structure), architectural diagrams are free-form visuals with no programmatic validation. The temptation is to use a design tool once and export a "good enough" image.

**How to avoid:**
1. **Use build-time SVG components in Astro.** Create `.astro` components that render diagrams as inline SVG with CSS custom properties for dark/light mode. This matches the proven pattern from EDA (13 SVG generators). The "data" is a TypeScript constant defining middleware names and their order -- when the stack changes, update the constant, not a design file.
2. **Keep diagrams simple.** 4-5 diagrams total for the entire guide. Each diagram should illustrate ONE concept (not a comprehensive system overview). Simple diagrams are faster to build and easier to maintain.
3. **Avoid Mermaid.** While Mermaid integrations exist for Astro, they add a runtime dependency (client-side JS) or a build dependency (Playwright/Chrome for server-side rendering). The site currently uses zero Mermaid. Adding it for ~4 diagrams is not worth the dependency cost. Hand-crafted SVG components are more maintainable and consistent with the existing approach.
4. **Each diagram component receives its data as props.** This makes them testable -- you can verify the middleware stack array matches the template's actual middleware registration.

**Warning signs:**
- Diagrams are committed as binary PNG files in `public/images/`
- Diagram content references middleware or components no longer in the template
- Dark mode shows diagrams with white backgrounds or unreadable labels
- Diagrams use different visual style than the rest of the site (inconsistent branding)

**Phase to address:** Phase 2 (Infrastructure/components). Build SVG diagram components before content authoring begins, so content phases can use them immediately.

---

### Pitfall 5: Build Time Regression Adding 12+ Pages to 1010+ Page Site

**What goes wrong:**
The site already generates 1010+ pages. Each new page requires: Astro page compilation, HTML generation, CSS extraction, and (if OG images are generated) Satori rendering + Sharp PNG conversion. Adding 12 guide pages plus OG images (12-13 new images) adds to the build. The risk is not the 12 pages themselves -- it is the OG image generation. The EDA section already required a content-hash caching system (`src/lib/eda/og-cache.ts`) to prevent build time regression at 90+ pages. If the guide OG images do not use this caching system, every build regenerates all guide OG images unnecessarily.

Additionally, if the guide introduces new npm dependencies (e.g., a Mermaid renderer, a diagram library), Vite's dependency pre-bundling adds overhead to every build, not just guide page builds.

**Why it happens:**
OG image generation is CPU-intensive (Satori renders JSX to SVG, Sharp converts SVG to PNG). Without caching, adding N pages means N additional Sharp operations per build. At 12 pages this is manageable (~5-10 seconds), but the pattern must be established correctly or it compounds as more guide sections are added in the future.

**How to avoid:**
1. **Reuse the existing OG cache system.** The `getOrGenerateOgImage()` function from `src/lib/eda/og-cache.ts` already implements content-hash caching in `node_modules/.cache/og-eda`. Either reuse this directly or create a parallel cache directory (`og-guides`). The hash computation is deterministic based on title + description, so unchanged pages skip regeneration.
2. **No new npm dependencies for diagrams.** Use build-time Astro SVG components (zero JS shipped to client). This matches the established pattern and adds zero Vite pre-bundling overhead.
3. **Use the existing `generateOgImage()` function** from `src/lib/og-image.ts` for guide OG images rather than creating a new OG template. The existing function accepts title, description, tags, and optional cover image -- sufficient for guide pages.
4. **Measure build time before and after.** Run `time npm run build` before the milestone starts to establish a baseline. Compare after each phase.

**Warning signs:**
- Build time increases by more than 15 seconds after adding guide pages
- CI/CD deployment time noticeably longer
- OG images regenerate on every build even when content has not changed
- New `node_modules/` entries appearing in `package.json` for guide-specific libraries

**Phase to address:** Phase 2 (Infrastructure). Set up OG image generation with caching before content authoring. Verify build time after infrastructure phase completes.

---

### Pitfall 6: Guide Content Not Self-Contained -- Assumes Reader Has Cloned the Repo

**What goes wrong:**
The guide is supposed to "stand alone without requiring repo docs" (per the PROJECT.md requirements). But the natural tendency when writing about a template is to say "see the `src/app/builder.py` file" or "run `make test` to verify." If the guide assumes the reader has the repo cloned and open, it fails as a standalone resource. Readers discovering the guide via search will not have the repo. The guide becomes useless documentation that requires a context switch to another tab/terminal to follow along.

The FastAPI template already has 1,838 lines of documentation in its `docs/` directory (architecture.md, security.md, configuration.md, etc.). The guide must add value beyond these docs, not duplicate or depend on them.

**Why it happens:**
Writing about code you have open in another terminal naturally leads to "refer to line 42" language. The template's own docs are written for people who HAVE cloned the repo. The guide author will likely have the repo open while writing, making it hard to notice when references leak in.

**How to avoid:**
1. **Every code snippet must be complete and runnable in the guide context.** No "see the full file at..." references. Show the relevant excerpt with enough context to understand it.
2. **The guide explains the WHY and the PATTERN. The repo README explains the HOW.** This is the key differentiation: the guide is for understanding the architectural decisions. The repo docs are for operational setup.
3. **Review each page with the test: "If I found this via Google and have never seen the repo, does this page make sense?"**
4. **Cross-link to the repo generously** (e.g., "The full implementation is available in the [FastAPI Production Template](https://github.com/PatrykQuantumNomad/fastapi-template)") but never REQUIRE the reader to visit the repo to understand the page.

**Warning signs:**
- Phrases like "as you can see in the file..." or "open `src/app/...` to follow along"
- Code snippets that import from template-specific paths without explaining what those imports do
- Pages that make no sense without having read the template's README first
- Missing context about what the template IS on pages other than the landing page

**Phase to address:** Every content phase. Add this as a review criterion for each guide page before marking it complete.

---

### Pitfall 7: Navigation Complexity -- Guide Section Disrupts Existing Site IA

**What goes wrong:**
The site header already has 9 navigation links (Home, Blog, Beauty Index, DB Compass, EDA, Tools, Projects, About, Contact). Adding a "Guides" or "FastAPI Guide" link makes 10. On mobile, this creates a crowded hamburger menu. More critically, the URL structure introduces a new top-level path (`/guides/`) that has no precedent in the existing IA. All prior content sections live at either root level (`/beauty-index/`, `/eda/`, `/db-compass/`) or under `/tools/` (`/tools/dockerfile-analyzer/`). The guide at `/guides/fastapi-production/` introduces a new organizational pattern.

If more guides are planned in the future, this establishes a pattern. If this is the only guide, a top-level `/guides/` path with one child looks sparse and architecturally premature.

**Why it happens:**
Each new content section adds navigation weight. The site has grown organically from 5 nav items (v1.0) to 9 (v1.13). Adding more without restructuring creates a flat, overwhelming navigation.

**How to avoid:**
1. **Add the guide under the existing header nav WITHOUT a dedicated top-level link.** Instead, use a dropdown/submenu under an existing category (e.g., "Resources" grouping EDA + Guides), or add it as a homepage callout and blog post cross-link without a header nav slot.
2. **Alternatively, use a grouped nav approach:** Collapse "Beauty Index", "DB Compass", "EDA", and "Guides" into a single "Explore" dropdown. This reduces header items from 9 to 6-7.
3. **If a header link is added,** use "Guides" (not "FastAPI Guide") to anticipate future guides. The landing page at `/guides/` can list available guides, even if there is only one initially.
4. **Within the guide section,** use sidebar or breadcrumb navigation (not the main header) for page-to-page navigation. The EDA section uses breadcrumbs effectively -- follow this pattern.

**Warning signs:**
- Mobile hamburger menu requires scrolling to see all items
- Users cannot find the guide from the homepage without knowing the URL
- Guide pages lack a way to navigate between chapters without returning to the landing page
- The `/guides/` index page looks empty with only one guide listed

**Phase to address:** Phase 1 (Content planning -- decide URL structure and nav strategy), final integration phase (implement nav changes).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-code code snippets as MDX strings instead of referencing tagged source | Faster initial authoring | Snippets drift from template within weeks; no audit trail | Never -- always tag the source commit and annotate snippets |
| Skip OG image caching for 12 pages | Avoid touching og-cache.ts | Adds ~10s to every build; compounds with future guide pages | MVP only -- must add caching before shipping |
| Use PNG exports from Excalidraw/Figma for diagrams | Beautiful diagrams quickly | No dark mode support; unmaintainable binary files; no version control of diagram logic | Never for this site -- build-time SVG is the established pattern |
| Create a new Layout for guide pages | Clean separation from other sections | Layout maintenance burden; diverges from main Layout.astro updates | Acceptable IF extending EDALayout pattern (wrapping Layout.astro, not replacing it) |
| Put all 11 domain pages in a single mega-page | Fewer files to manage; faster to write | Terrible UX; huge page weight; SEO misses long-tail keywords; no shareable deep links | Never -- multi-page is the established pattern and the stated requirement |
| Skip companion blog post | One fewer thing to write | No entry point from the blog section; breaks the established content-to-blog cross-linking pattern; weaker SEO | Never -- every prior content section ships with a companion blog post |
| Duplicate template docs content | Guide pages have content quickly | Two sources of truth; guide and repo docs drift; confusing for readers who see both | Never -- guide should reference repo docs for operational details, not copy them |
| Skip JSON-LD structured data | Saves 30 minutes of implementation | Guide pages invisible to Google's structured data features; breaks site-wide consistency | Never -- every prior section includes JSON-LD |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Guide pages + existing sitemap | Forgetting to verify new pages appear in sitemap-index.xml | Astro sitemap integration auto-includes all non-filtered pages; verify filter function in astro.config.mjs does not exclude `/guides/` |
| Guide pages + LLMs.txt | Not updating llms.txt and llms-full.txt with guide section | Add guide section to the LLMs.txt generation in `src/pages/llms-full.txt.ts` following the existing pattern for EDA/tools sections |
| OG images + guide pages | Creating a new OG image template instead of reusing existing | Use `generateOgImage()` from `src/lib/og-image.ts` which already handles title/description/tags; add caching via `getOrGenerateOgImage()` from `src/lib/eda/og-cache.ts` |
| Header nav + guide link | Adding 10th item to already-crowded navigation | Group content sections or use homepage callout as primary entry point; consider nav restructuring |
| Content collection + guide data | Creating a new content collection for guide pages when MDX glob would suffice | If guide pages use MDX, add a `guidePages` collection in `src/content.config.ts`; if pages are pure Astro, no collection needed -- use regular page routing |
| Guide code snippets + Expressive Code | Astro Expressive Code plugin is already configured; forgetting to use its features | Leverage frame titles, line highlighting, diff markers, and copy buttons already available via astro-expressive-code in astro.config.mjs |
| View Transitions + guide navigation | Guide pages not participating in View Transitions (inconsistent navigation feel) | Ensure guide pages use the main `Layout.astro` which already includes View Transition support |
| Homepage callout + guide CTA | Adding guide callout but not matching the visual pattern of existing callouts (Beauty Index, Dockerfile Analyzer, DB Compass, EDA) | Follow the exact component pattern used by existing homepage callouts for visual consistency |
| Guide breadcrumbs + site breadcrumbs | Implementing a different breadcrumb system for the guide | Reuse the breadcrumb pattern from tool rule pages and EDA section pages |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| OG images without caching | Build time increases 10-15s per guide build | Use `getOrGenerateOgImage()` content-hash cache | Immediately -- every build regenerates all 12+ images |
| Client-side diagram rendering (Mermaid JS) | 200-400KB JS bundle for diagrams; Lighthouse performance drop | Build-time SVG components; zero client JS for diagrams | At first page load; 200KB+ JS budget is the anti-pattern |
| Interactive architecture diagram with D3 or React Flow | Massive island (React Flow is 222KB) for a non-interactive need | Static SVG with CSS hover states; interactivity only if genuinely needed (not just "it looks cool") | On mobile devices and slow connections; Lighthouse 90+ target at risk |
| Large code blocks without lazy rendering | Pages with 10+ code blocks (all domain pages will have multiple snippets) slow initial render | Use `content-visibility: auto` on code block containers (pattern from Beauty Index code comparison page) | On lower-end devices when scrolling through code-heavy pages |
| Adding new fonts for diagram labels | Extra font file download (100-300KB) for diagram text | Use existing Space Grotesk / Inter / JetBrains Mono already loaded | When any page with a diagram is first loaded |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Including real API keys/secrets in code examples | Readers copy-paste example secrets; template repo secrets leak into public guide | Use obviously fake values (`YOUR_SECRET_KEY`, `sk-example-not-real`) with clear comments |
| Showing JWT tokens in examples that contain real payloads | JWT payloads are base64-decoded, not encrypted; real user data exposed | Generate example JWTs with synthetic data; add note that example tokens are fabricated |
| Linking to template repo internal paths that expose CI/CD secrets patterns | Readers learn which env vars contain secrets and where they are stored | Reference secret management patterns generically; do not enumerate specific CI variable names |
| Guide code snippets showing permissive CORS or security header configs | Readers copy-paste development configs into production | Always show production-safe defaults in guide snippets; if dev configs are shown, add explicit "DEVELOPMENT ONLY" warnings |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress indicator across guide pages | Readers do not know how deep the guide goes or where they are in the journey | Add a chapter sidebar or progress indicator showing all 11 domains with current position highlighted |
| Guide pages lack prev/next navigation | Readers must return to landing page to find the next chapter | Add prev/next links at the bottom of each guide page (pattern from Beauty Index detail pages and EDA technique pages) |
| Landing page lists all 11 domains without visual hierarchy | Readers do not know where to start or which domains are most important | Group domains into tiers (e.g., "Start here: Builder Pattern, Middleware, Health Checks" and "Deep dives: Observability, Database, Caching") |
| Code snippets show Python but the site is primarily TypeScript-focused | Visual inconsistency; readers confused about which language they are reading | Use clear language labels on all code blocks via Expressive Code frame titles (e.g., `python title="src/app/builder.py"`) |
| Mixing "AI agent" narrative with technical content confuses the audience | Readers here for FastAPI production patterns do not care about AI agents; AI-focused readers do not care about middleware details | Keep the AI agent narrative in the landing page and intro paragraphs; let domain pages focus on technical content with occasional agent callbacks |
| No visual differentiation between guide pages and blog posts | Readers cannot tell if they are in the guide section or reading a blog post | Use a distinct layout wrapper (similar to EDALayout.astro) with guide-specific breadcrumbs and chapter navigation |

## "Looks Done But Isn't" Checklist

- [ ] **Code snippets:** Every snippet includes a source annotation comment (file path + commit/tag) -- verify no orphaned snippets reference deleted template files
- [ ] **Cross-links:** Blog post links to all guide pages AND guide landing page links to blog post -- verify bidirectional linking with no broken links
- [ ] **OG images:** All 12+ guide pages have OG images that render correctly -- verify with Twitter Card Validator or opengraph.xyz
- [ ] **JSON-LD:** Guide pages include appropriate structured data (TechArticle or HowTo schema) -- verify with Google Rich Results Test
- [ ] **Sitemap:** All guide URLs appear in sitemap-index.xml -- verify with `grep guides dist/sitemap-*.xml`
- [ ] **LLMs.txt:** Guide section added to both `/llms.txt` and `/llms-full.txt` -- verify guide pages are listed
- [ ] **Mobile navigation:** Guide is discoverable from mobile navigation without scrolling past 8 items -- verify on real device or responsive mode
- [ ] **Dark mode:** All diagrams and code blocks render correctly in both light and dark mode -- verify by toggling theme on every guide page
- [ ] **Prev/next navigation:** Every guide page (except first and last) has both prev and next links -- verify no broken prev/next on boundary pages
- [ ] **Homepage callout:** Guide section has a callout on the homepage matching the visual pattern of existing callouts -- verify it does not break the homepage layout
- [ ] **Guide landing page:** Accessible from at least 2 entry points (header nav or homepage callout + blog post link) -- verify discoverability
- [ ] **Self-contained test:** Read each guide page pretending you have never seen the FastAPI template repo -- verify the page makes sense without the repo context
- [ ] **Keyword differentiation:** Guide page titles and meta descriptions use different primary keywords than the companion blog post -- verify with a keyword overlap check

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Code snippets diverged from template | LOW | Tag the template at current commit; add source annotations to all snippets; update stale snippets to match tagged version. ~2-4 hours for all 11 pages. |
| Scope crept to 25+ pages | MEDIUM | Audit all pages against the scope boundary ("does this explain a decision or teach a concept?"); merge tutorial-style pages back into parent domain pages; archive cut content as blog post candidates. ~1 day. |
| SEO cannibalization detected | LOW | Add canonical cross-links; differentiate title tags; adjust meta descriptions to target different search intents. ~2-3 hours. |
| Diagrams are stale PNG files | HIGH | Rebuild all diagrams as Astro SVG components; extract diagram data into TypeScript constants; delete PNG files and update all page references. ~1-2 days depending on diagram count. |
| Build time regressed >30s | LOW | Add OG cache to guide image generation (if missing); verify no unnecessary dependencies were added; profile with astro-speed-measure. ~1-2 hours. |
| Guide requires repo context | MEDIUM | Review each page for repo-dependent language; rewrite "see file X" references as inline explanations; add context paragraphs to pages that assume repo knowledge. ~4-6 hours for all pages. |
| Navigation overloaded | MEDIUM | Restructure header nav into grouped dropdowns; or remove guide from header and rely on homepage callout + blog cross-links. ~3-4 hours including responsive testing. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1: Code snippet drift | Phase 1 (Content planning -- tag template repo, define snippet strategy) | Every snippet has a source annotation; template repo has a tagged release referenced in guide intro |
| P2: Scope creep | Phase 1 (Content planning -- define page list and depth boundaries) | Page count remains at ~12; no domain page exceeds 2,000 words of prose; no sub-pages created |
| P3: SEO cannibalization | Phase 1 (Content planning -- keyword boundaries) + final phase (cross-linking) | Blog post and guide pages target different primary keywords; canonical cross-links in place |
| P4: Diagram maintenance | Phase 2 (Infrastructure -- build SVG diagram components) | All diagrams are Astro components; no PNG/binary image files for architecture diagrams |
| P5: Build time regression | Phase 2 (Infrastructure -- OG cache setup) | Build time within 15s of pre-milestone baseline; OG images use content-hash caching |
| P6: Non-self-contained content | Every content phase (review criterion) | Every guide page passes the "never seen the repo" readability test |
| P7: Navigation complexity | Phase 1 (URL structure decision) + final phase (nav implementation) | Mobile nav does not scroll; guide discoverable from at least 2 entry points |

## Sources

### Primary (HIGH confidence -- verified from source code inspection)
- Site source code at `/Users/patrykattc/work/git/PatrykQuantumNomad/` -- content.config.ts, astro.config.mjs, Header.astro, og-cache.ts, og-image.ts, EDALayout.astro all inspected directly
- FastAPI template at `/Users/patrykattc/work/git/fastapi-template/` -- docs/, src/, git log inspected directly; 1,838 lines of existing docs, 41 Python source files, 20+ commits on 2026-03-08 confirming active evolution
- PROJECT.md (737 requirements across 14 milestones) -- established patterns for content sections, companion blog posts, OG images, JSON-LD, LLMs.txt, sitemap integration
- 14 prior milestones in MILESTONES.md -- scope growth pattern documented (EDA: 90+ pages; Beauty Index: 26 detail + 650 VS pages)

### Secondary (MEDIUM confidence -- web search verified)
- [Astro Islands Architecture Documentation](https://docs.astro.build/en/concepts/islands/) -- client:* directives, island loading strategies
- [Semrush Keyword Cannibalization Guide](https://www.semrush.com/blog/keyword-cannibalization-guide/) -- hub-and-spoke model for avoiding cannibalization
- [Ahrefs Keyword Cannibalization Analysis](https://ahrefs.com/blog/keyword-cannibalization/) -- Google domain result limits
- [Mermaid Diagrams in Astro](https://marcandreuf.com/blog/2025-03-27-mermaid-diagrams/) -- Playwright/Chrome requirement for server-side Mermaid rendering
- [Astro Mermaid Integration](https://orchestrator.dev/blog/2025-12-08-astro-mermaid-integration/) -- client-side vs server-side rendering trade-offs

### Tertiary (LOW confidence -- general pattern knowledge)
- InfoQ Continuous Documentation article -- code-coupled documentation and drift detection patterns
- Springer empirical study on detecting outdated code references in documentation

---
*Pitfalls research for: Adding a multi-page FastAPI production guide section to a 1010+ page Astro 5 static site*
*Researched: 2026-03-08*
