# patrykgolabek.dev

## What This Is

A personal portfolio, blog, and interactive tools site for Patryk Golabek, a Cloud-Native Software Architect with 17+ years of experience. Built with Astro 5 and deployed on GitHub Pages at patrykgolabek.dev. Features a custom "Quantum Explorer" dark space theme with particle canvas, view transitions, scroll reveals, and futuristic typography. The projects page showcases 16 GitHub repos in an interactive bento grid with GSAP-animated category filtering. Includes five content pillars: The Beauty Index (25 programming languages ranked across 6 aesthetic dimensions), a Dockerfile Analyzer (browser-based linting tool with 39 expert rules and category-weighted scoring), Database Compass (interactive database model explorer with 12 categories scored across 8 dimensions), Docker Compose Validator (browser-based compose file validation with 52 rules, interactive dependency graph, and category-weighted scoring), and Kubernetes Manifest Analyzer (browser-based K8s manifest linter with 67 rules across 5 categories, multi-resource schema validation, security/RBAC analysis, interactive dependency graph, and 67 rule documentation pages).

## Core Value

The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## Requirements

### Validated

- ✓ Astro static site scaffolded from scratch (no starter template) — v1.0
- ✓ Custom "Quantum Explorer" theme with dark space canvas aesthetic — v1.0
- ✓ Light/dark mode toggle with localStorage persistence — v1.0
- ✓ Rich animations — particle canvas, animated hero typing, scroll-triggered reveals, view transitions — v1.0
- ✓ Futuristic typography (Space Grotesk, Inter, JetBrains Mono) — v1.0
- ✓ Home page with hero, featured projects, blog links, contact CTA — v1.0
- ✓ Blog listing page at /blog/ with chronological sorting — v1.0
- ✓ Individual blog post pages at /blog/[slug]/ with prose typography — v1.0
- ✓ Projects page showcasing all 16 GitHub repos grouped by category — v1.0
- ✓ About page with professional bio, tech stack, career highlights — v1.0
- ✓ Content collections with Zod schema (title, description, pubDate, tags, draft, etc.) — v1.0
- ✓ First blog post: "Building a Kubernetes Observability Stack" — v1.0
- ✓ Full real content — bio, project descriptions, blog post (ship-ready) — v1.0
- ✓ SEO component with title, meta description, canonical URL, Open Graph, Twitter Cards — v1.0
- ✓ JSON-LD structured data (Person on homepage, BlogPosting on posts) — v1.0
- ✓ @astrojs/sitemap generating sitemap-index.xml — v1.0
- ✓ RSS feed at /rss.xml — v1.0
- ✓ @astrojs/mdx for component-enhanced Markdown — v1.0
- ✓ Tailwind CSS for styling — v1.0
- ✓ public/CNAME with patrykgolabek.dev — v1.0
- ✓ public/robots.txt pointing to sitemap-index.xml — v1.0
- ✓ GitHub Actions deployment with withastro/action@v3 — v1.0
- ✓ astro.config.mjs with site URL and static output — v1.0
- ✓ Lighthouse scores 90+ across all categories — v1.0
- ✓ SEO keywords naturally integrated throughout content — v1.0
- ✓ Syntax-highlighted code blocks with copy buttons — v1.0
- ✓ Reading time estimates on blog posts — v1.0
- ✓ Draft post filtering in production — v1.0
- ✓ Tag pages at /blog/tags/[tag]/ — v1.0
- ✓ Auto-generated table of contents for blog posts — v1.0
- ✓ Dynamic OG images per blog post (Satori + Sharp) — v1.0
- ✓ LLMs.txt for AI-friendly content discovery — v1.0
- ✓ GEO optimization with structured, authoritative content — v1.0
- ✓ WCAG 2.1 AA accessibility (semantic HTML, keyboard nav, contrast) — v1.0
- ✓ Reduced-motion fallbacks for all animations — v1.0
- ✓ Responsive design across mobile, tablet, and desktop — v1.0
- ✓ Centralized hero config (site.ts) propagating to title, meta, JSON-LD — v1.1
- ✓ Blog schema extended with optional externalUrl and source fields — v1.1
- ✓ 10 curated external blog posts from Kubert AI and Translucent Computing — v1.1
- ✓ External posts show source badges, external link icons, open in new tab — v1.1
- ✓ External posts excluded from detail pages, OG images, and internal routing — v1.1
- ✓ RSS feed includes external blog entries with canonical external URLs — v1.1
- ✓ Updated email (pgolabek@gmail.com) across Footer, Contact, Home CTA — v1.1
- ✓ X and YouTube social links with proper SVG icons and aria-labels — v1.1
- ✓ LinkedIn removed from visible UI (retained in JSON-LD sameAs) — v1.1
- ✓ Hero tagline updated to craft-and-precision architect messaging — v1.1
- ✓ Projects curated from 19 to 16 (removed Full-Stack Applications category) — v1.1
- ✓ Draft placeholder deleted, all build outputs verified consistent — v1.1
- ✓ LLMs.txt and homepage external URLs resolved correctly — v1.1
- ✓ Project data model extended with technologies, featured, status, gridSize fields — v1.2
- ✓ Asymmetric bento grid layout with featured hero section — v1.2
- ✓ Responsive bento: 4-col desktop, 2-col tablet, 1-col mobile with grid-flow-dense — v1.2
- ✓ Category-separated layout with gradient dividers — v1.2
- ✓ Tech stack badges as styled pills on project cards — v1.2
- ✓ Status badges (Featured/Active/Live) with colored dot indicators — v1.2
- ✓ Category-tinted glassmorphism glow on hover — v1.2
- ✓ Category headers with monospace project count metadata — v1.2
- ✓ GSAP Flip-animated category filter tabs with URL hash persistence — v1.2
- ✓ Filter tab pill buttons with hover and aria-pressed active states — v1.2
- ✓ Mouse-tracking gradient glow on project cards — v1.2
- ✓ Floating parallax orbs behind category sections — v1.2
- ✓ Magnetic pull effect on CTA buttons — v1.2
- ✓ All v1.2 animations respect prefers-reduced-motion and touch device fallbacks — v1.2
- ✓ Language data schema (languages.json) with Zod validation for 25 languages across 6 dimensions — v1.3
- ✓ Shared radar SVG math utility (radar-math.ts) for Astro components and OG images — v1.3
- ✓ Content collection integration via Astro 5 file() loader for language data — v1.3
- ✓ Greek symbol rendering with Noto Sans unicode-range fallback — v1.3
- ✓ Build-time SVG radar chart component (zero client-side JS) — v1.3
- ✓ Build-time SVG ranking bar chart with tier group headers — v1.3
- ✓ Tier badge component with color-coded indicators (Beautiful/Handsome/Practical/Workhorses) — v1.3
- ✓ Score breakdown display component — v1.3
- ✓ Overview page at /beauty-index/ with ranking chart, scoring table, and language grid — v1.3
- ✓ Sortable scoring table with column header sort — v1.3
- ✓ 4-tier visual grouping with color-coded sections — v1.3
- ✓ 25 radar charts in overview grid linking to detail pages — v1.3
- ✓ Per-language detail pages at /beauty-index/[slug]/ for all 25 languages — v1.3
- ✓ Character sketch narrative per language — v1.3
- ✓ Signature code snippet with syntax highlighting per language — v1.3
- ✓ Navigation between languages and back to overview — v1.3
- ✓ Code comparison page at /beauty-index/code/ with 10 feature-tabbed layout — v1.3
- ✓ All 25 languages per tab with syntax-highlighted code blocks (240 total) — v1.3
- ✓ Tab-based lazy rendering with content-visibility: auto — v1.3
- ✓ Feature support matrix table — v1.3
- ✓ Build-time OG images with radar chart visuals for overview and all 25 language pages — v1.3
- ✓ Download-as-image button via client-side SVG-to-PNG at 2x — v1.3
- ✓ Web Share API on mobile, Clipboard API on desktop, text URL fallback — v1.3
- ✓ Full Beauty Index methodology blog post as local MDX content — v1.3
- ✓ Bidirectional cross-links between blog post and Beauty Index pages — v1.3
- ✓ Navigation link in site header for Beauty Index — v1.3
- ✓ JSON-LD structured data (Dataset/ItemList + BreadcrumbList) on Beauty Index pages — v1.3
- ✓ Beauty Index callout on homepage between What I Build and Latest Writing — v1.3
- ✓ All Beauty Index pages in sitemap — v1.3
- ✓ Lighthouse 90+ on all Beauty Index page types — v1.3
- ✓ Accessibility audit (keyboard navigation, screen reader, WCAG 2.1 AA) — v1.3
- ✓ Nanostores atom for tab state management (286 bytes) — v1.3
- ✓ Responsive layout across mobile, tablet, and desktop for all Beauty Index pages — v1.3
- ✓ CodeMirror 6 editor with Dockerfile syntax highlighting — v1.4
- ✓ Analyze button triggers lint cycle (on-demand, not real-time) — v1.4
- ✓ Pre-loaded sample Dockerfile with deliberate issues across all rule categories — v1.4
- ✓ Keyboard shortcut (Cmd/Ctrl+Enter) to trigger analysis — v1.4
- ✓ Dark-only editor theme matching site aesthetic — v1.4
- ✓ Responsive layout — stacked on mobile, side-by-side on desktop — v1.4
- ✓ React island with `client:only="react"` directive — v1.4
- ✓ View Transitions lifecycle — destroy/recreate EditorView on navigation — v1.4
- ✓ 39 lint rules across 3 tiers (15 critical, 15 high-value, 9 nice-to-have) — v1.4
- ✓ Modular rule architecture — LintRule interface, one file per rule, category subdirectories — v1.4
- ✓ Expert-voice explanation per rule with production consequences — v1.4
- ✓ Actionable fix suggestion per rule with before/after code examples — v1.4
- ✓ DL-prefixed (Hadolint-compatible) and PG-prefixed (custom) rule codes — v1.4
- ✓ Category-weighted scoring (Security 30%, Efficiency 25%, Maintainability 20%, Reliability 15%, Best Practice 10%) — v1.4
- ✓ Overall 0-100 score with letter grade (A+ through F) — v1.4
- ✓ Per-category sub-scores alongside aggregate — v1.4
- ✓ Inline CodeMirror annotations (squiggly underlines + gutter severity markers) — v1.4
- ✓ Score gauge component (SVG circular gauge with letter grade) — v1.4
- ✓ Category breakdown panel with sub-scores per dimension — v1.4
- ✓ Violation list grouped by severity with expandable details — v1.4
- ✓ Click-to-navigate from results panel to corresponding editor line — v1.4
- ✓ Clean Dockerfile empty state ("No issues found" with congratulatory message) — v1.4
- ✓ Score badge download as PNG image for social media sharing — v1.4
- ✓ URL state encoding — Dockerfile content in URL hash for shareable analysis links — v1.4
- ✓ Companion blog post covering Dockerfile best practices and tool architecture deep-dive — v1.4
- ✓ Cross-links between blog post and tool page (bidirectional) — v1.4
- ✓ 39 rule documentation pages at /tools/dockerfile-analyzer/rules/[code] — v1.4
- ✓ Each rule page includes: explanation, fix suggestion, before/after code, related rules — v1.4
- ✓ Header navigation link for Dockerfile Analyzer — v1.4
- ✓ Breadcrumb navigation on tool page and rule documentation pages — v1.4
- ✓ JSON-LD structured data (SoftwareApplication schema) on tool page — v1.4
- ✓ Homepage callout linking to the Dockerfile Analyzer — v1.4
- ✓ All tool and rule pages in sitemap — v1.4
- ✓ SEO-optimized meta descriptions for tool page and all rule pages — v1.4

- ✓ Database model categories defined in JSON with Zod schema validation for 12 models across 8 dimensions — v1.5
- ✓ 8-dimension scoring with per-dimension justifications, CAP theorem profiles, and cross-category linking — v1.5
- ✓ Build-time SVG complexity spectrum and 8-axis octagonal radar charts (zero client-side JS) — v1.5
- ✓ Sortable scoring table, score breakdowns, and CAP badges — v1.5
- ✓ Overview page at /tools/db-compass/ with interactive use-case filtering (10 categories, 58 use cases) — v1.5
- ✓ 12 model detail pages with radar charts, share controls, and SVG-to-PNG download — v1.5
- ✓ 13 build-time OG images for Database Compass (overview + 12 detail) — v1.5
- ✓ Homepage callout and tools page card for Database Compass — v1.5
- ✓ Companion blog post "How to Choose a Database in 2026" with 15 cross-links — v1.5

- ✓ YAML 1.1 parser with merge key support, variable interpolation normalizer, compose-spec JSON Schema validation via ajv — v1.6
- ✓ 52 lint rules (8 schema, 15 semantic, 14 security, 12 best practice, 3 style) with category-weighted scoring — v1.6
- ✓ CodeMirror 6 YAML editor with inline annotations, score gauge, category breakdown, tabbed results panel — v1.6
- ✓ Interactive React Flow dependency graph with dagre layout, cycle highlighting, and lazy loading — v1.6
- ✓ 52 per-rule SEO documentation pages at /tools/compose-validator/rules/[code] — v1.6
- ✓ Score badge PNG download, lz-string URL state encoding, and 3-tier share fallback — v1.6
- ✓ Full site integration (header nav, homepage callout, tools page, JSON-LD, breadcrumbs, sitemap) — v1.6
- ✓ Build-time OG image via Satori + Sharp for social sharing — v1.6
- ✓ Companion blog post "Docker Compose Best Practices" with 26 rule links and bidirectional cross-linking — v1.6

- ✓ Multi-document YAML parser with GVK registry and pre-compiled K8s 1.31 JSON Schema validators for 19 resource types (76KB gzipped) — v1.7
- ✓ 67 K8s rules across 5 categories: 10 schema, 20 security (PSS/CIS), 12 reliability, 12 best practice, 8 cross-resource, 5 RBAC — v1.7
- ✓ CodeMirror 6 YAML editor with tabbed results panel (score gauge, categories, violations, PSS compliance, resource summary) — v1.7
- ✓ Interactive React Flow dependency graph with dagre layout and color-coded resource kind nodes — v1.7
- ✓ Category-weighted scoring (Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%) — v1.7
- ✓ 67 per-rule SEO documentation pages at /tools/k8s-analyzer/rules/[code] with PSS/CIS tags — v1.7
- ✓ Full site integration (header nav, homepage 3-card grid, tools page, JSON-LD, breadcrumbs, sitemap, LLMs.txt) — v1.7
- ✓ Build-time OG image and companion blog post "Kubernetes Manifest Best Practices" with 21 cross-links — v1.7

### Active

<!-- Current scope. Building toward these. -->

## Current Milestone: v1.8 EDA Visual Encyclopedia

**Goal:** Modernize the NIST/SEMATECH Engineering Statistics Handbook Chapter 1 (Exploratory Data Analysis) as a complete interactive pillar section with 90+ pages, build-time SVG plots, Python code examples, KaTeX formulas, and D3.js distribution parameter explorers.

**Target features:**
- Visual Encyclopedia landing page at /eda/ with filterable technique card grid
- 6 Foundations pages (EDA philosophy, assumptions, 4-plot interpretation)
- 30 Graphical Technique walkthrough pages with build-time SVG plots and interpretation variants
- 18 Quantitative Technique pages with formulas, Python code, and annotated examples
- 19 Probability Distribution pages with D3.js interactive parameter explorers (~30KB micro-bundle)
- 9 Case Study walkthrough pages with datasets and sequential analysis
- 4 Reference pages (analysis questions, techniques-by-category, distribution tables, related distributions)
- 3-tier interactivity: build-time SVG + vanilla JS hover/swap (70% of pages), D3 micro-bundle for distributions only
- Python-generated SVG plots styled to Quantum Explorer palette
- KaTeX-rendered mathematical formulas
- Python code blocks replacing Dataplot commands (matplotlib/seaborn/scipy/plotly)
- Companion blog post + full site integration (nav, homepage callout, JSON-LD, sitemap, OG images)
- Source: NIST/SEMATECH e-Handbook of Statistical Methods (public domain)

### Out of Scope

- Cloning Astro Nano or any starter template — building custom from scratch (achieved in v1.0)
- Server-side rendering — static output only for GitHub Pages
- CMS integration — content managed as Markdown files in repo
- Contact form with backend — no server to process it; mailto + LinkedIn sufficient
- Analytics dashboard — may add in future milestone
- Mobile app or PWA — web-first
- E-commerce or payment features — portfolio only
- DNS configuration automation — manual steps documented
- Comments system — requires moderation, attracts spam; use "Reply via email" approach
- Multi-language / i18n — doubles content maintenance for English-speaking audience
- Google Analytics — 45KB+ script, requires cookie consent; consider Plausible/Fathom later
- Real-time features (WebSockets) — fetch GitHub data at build time
- Project screenshots — requires creating/hosting 16 images; consider for v2
- GitHub API runtime calls — static site, would need build-time fetch
- Sort options on projects — no date/popularity data; consider after GitHub API integration
- AI-powered Dockerfile analysis — contradicts the human-expertise positioning
- Auto-fix / auto-correct for Dockerfiles — too many edge cases
- Real-time as-you-type linting — on-demand is better UX

## Context

Shipped v1.7 Kubernetes Manifest Analyzer on top of v1.6 Docker Compose Validator, v1.5 Database Compass, v1.4 Dockerfile Analyzer, v1.3 The Beauty Index, v1.2 Projects Page Redesign, v1.1 Content Refresh, and v1.0 MVP.
Tech stack: Astro 5, Tailwind CSS, TypeScript, MDX, Satori + Sharp for OG images, GSAP for animations, Nanostores for client state, CodeMirror 6 for code editing, dockerfile-ast for Dockerfile parsing, yaml (eemeli) for YAML AST parsing, ajv + ajv-formats for JSON Schema validation, @xyflow/react + @dagrejs/dagre for dependency graphs.
v1.8 additions: KaTeX (remark-math + rehype-katex) for formula rendering, D3.js micro-bundle (d3-scale, d3-shape, d3-axis, d3-selection ~30KB) for distribution parameter explorers, Python build scripts for SVG plot generation.
Site live at patrykgolabek.dev via GitHub Pages with custom domain.
All 36 v1.0 + 18 v1.1 + 23 v1.2 + 37 v1.3 + 38 v1.4 + 28 v1.5 + 100 v1.6 + 123 v1.7 requirements delivered (403 total). 857 total pages. Lighthouse 90+ on mobile.
Custom "Quantum Explorer" theme is distinctive and fully accessible.
Blog shows 21 posts (11 local MDX + 10 external from Kubert AI and Translucent Computing).
Projects page features interactive bento grid with GSAP Flip filtering, mouse-tracking glow, and floating orbs.
Beauty Index content pillar: 25 languages ranked across 6 aesthetic dimensions, with overview page, 25 detail pages, code comparison explorer (240 code blocks), and companion blog essay.
Dockerfile Analyzer: browser-based linting tool with CodeMirror 6 editor, 39 expert rules (Hadolint DL codes + custom PG rules), category-weighted scoring, inline annotations, 39 rule documentation pages, PNG badge export, and shareable URL state.
Database Compass: interactive database model explorer with 12 categories scored across 8 dimensions, complexity spectrum, octagonal radar charts, sortable scoring table, use-case filtering, share controls, 13 OG images, and companion blog post.
Docker Compose Validator: browser-based compose file validation with 52 rules (8 schema + 44 custom), CodeMirror 6 YAML editor, React Flow dependency graph, category-weighted scoring, 52 rule documentation pages, PNG badge export, shareable URL state, and companion blog post.
Kubernetes Manifest Analyzer: browser-based K8s manifest linter with 67 rules (10 schema + 20 security + 12 reliability + 12 best practice + 8 cross-resource + 5 RBAC), multi-resource schema validation for 19 K8s resource types, PSS/CIS compliance, interactive React Flow dependency graph, 67 rule documentation pages, and companion blog post.
Hero messaging emphasizes cloud-native architect identity with 17+ years experience.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fresh Astro scaffold over Astro Nano | Full creative control for custom Quantum Explorer theme | ✓ Good — enabled fully custom theme |
| Tailwind CSS for styling | Industry standard utility-first CSS, great with Astro | ✓ Good — fast development, responsive design |
| "Quantum Explorer" theme direction | Distinctive identity tied to QuantumNomad brand | ✓ Good — visually memorable, stands out |
| Rich animations (particles, scroll reveals) | Memorable first impression, showcases frontend capability | ✓ Good — with proper reduced-motion fallbacks |
| All 16 repos on projects page | Comprehensive showcase across Kubernetes, AI/ML, IaC | ✓ Good — full portfolio visibility |
| Full real content for first deploy | SEO value from day one — search engines index real content | ✓ Good — indexed with rich content |
| Static output only | GitHub Pages requires static files, no SSR needed | ✓ Good — fast, simple, reliable |
| Class-based dark mode (darkMode: 'class') | Supports manual toggle with OS fallback | ✓ Good — no FOUC, persists across sessions |
| CSS custom properties for theming | Runtime switching without recompilation | ✓ Good — clean theme architecture |
| Inline head script for FOUC prevention | Sets .dark class before first paint | ✓ Good — zero FOUC on any navigation |
| Satori + Sharp for OG images | Build-time generation, no server needed | ✓ Good — unique images per post, zero runtime cost |
| media="print" onload for async fonts | Non-blocking font loading for performance | ✓ Good — improved Lighthouse performance score |
| focus-visible over focus for outlines | Mouse users see no outline, keyboard users get indicators | ✓ Good — better UX for both input methods |
| Centralized siteConfig with `as const` | Type-safe hero data propagation across pages | ✓ Good — single source of truth for identity |
| Schema extension for external posts | Single collection, not separate data source | ✓ Good — simple, no breaking changes |
| Frontmatter-only stubs for externals | No body content needed for link-only posts | ✓ Good — minimal overhead |
| getStaticPaths guards for externals | Exclude external posts from detail/OG routes | ✓ Good — clean build output |
| Direct component updates for social links | No centralized social config (deferred) | ✓ Good — fast, minimal scope |
| Nullish coalescing for URL resolution | `externalUrl ?? internal path` pattern | ✓ Good — consistent across RSS, LLMs.txt, homepage |
| Inline --category-glow over data-attr selectors | Simpler, fewer CSS rules, co-located with component | ✓ Good — clean category glow system |
| Button elements for filter tabs | Prevents Astro ClientRouter interception | ✓ Good — reliable filter behavior |
| replaceState for URL hash updates | Avoids polluting browser history with filter changes | ✓ Good — clean back-button behavior |
| vanilla-tilt lifecycle in Flip transitions | Destroy before getState, reinit in onComplete | ✓ Good — no stale tilt on filtered cards |
| grid-flow-dense for bento grids | Auto-fills gaps from 2-col spanning cards | ✓ Good — no empty cells in grid |
| ProjectCard conditional div/anchor | Full card clickable only when no liveUrl buttons | ✓ Good — proper button-in-link avoidance |
| client:only="react" for CodeMirror island | CodeMirror cannot be SSR'd; avoids hydration mismatch | ✓ Good — clean client-side rendering |
| Destroy/recreate EditorView on View Transitions | Avoids stale editor state after navigation | ✓ Good — reliable editor lifecycle |
| dockerfile-ast for Dockerfile parsing | Browser-safe, source-audited, 21 KB gzipped | ✓ Good — well under 50 KB budget |
| Nanostore bridge for CodeMirror-React state | Decouples editor linter callback from React results panel | ✓ Good — clean cross-framework communication |
| Diminishing returns scoring formula | Prevents extreme scores; each additional violation matters less | ✓ Good — meaningful score differentiation |
| Category-weighted scoring algorithm | Security weighted highest (30%), reflects real-world priority | ✓ Good — calibrated and transparent |
| SVG data URL gutter markers | Explicit fill/stroke colors for cross-browser reliability | ✓ Good — consistent rendering |
| lz-string for URL state compression | ~1KB dependency, URL-safe encoding for shareable links | ✓ Good — compact shareable URLs |
| Programmatic SVG badge generator | No DOM capture, no external fonts; portable rendering | ✓ Good — reliable PNG export |
| Buffer polyfill for dockerfile-ast | feross/buffer package for browser compatibility | ✓ Good — resolved isUTF8BOM runtime error |
| Zero new npm dependencies for DB Compass | Existing stack (Astro, Satori, Sharp, Nanostores) fully sufficient | ✓ Good — no bundle growth |
| radar-math.ts reused for 8-axis octagon | Axis-count parameter makes it feature-agnostic | ✓ Good — clean cross-feature reuse |
| No VS comparison pages | Avoids 66+ page OG image explosion | ✓ Good — scope control |
| Dimension-at-a-time score calibration | Prevents calibration drift across 12 models | ✓ Good — consistent relative rankings |
| BMP-safe Unicode symbols for dimensions | Avoids emoji cross-platform rendering issues | ✓ Good — consistent rendering everywhere |
| Fixed accent color for all radar charts | DB Compass has no tier system unlike Beauty Index | ✓ Good — simpler, unified look |
| UseCaseFilter follows LanguageFilter pattern | Proven nanostores + DOM manipulation pattern | ✓ Good — consistent React island architecture |
| SVG-to-PNG via XMLSerializer + Canvas | Simpler than Beauty Index Canvas 2D composite | ✓ Good — reliable chart download |
| Aliased DB Compass imports in og-image.ts | Avoids name collisions with Beauty Index exports | ✓ Good — clean multi-feature OG generation |
| yaml 2.x with YAML 1.1 mode | Docker Compose uses merge keys (<<) requiring YAML 1.1 | ✓ Good — correct merge key support |
| ajv singleton at module level | Compile schema once, reuse across validations | ✓ Good — efficient validation |
| SchemaRuleMetadata (no check method) | ajv drives schema validation, rules are metadata only | ✓ Good — clean separation of concerns |
| @xyflow/react + @dagrejs/dagre | Maintained React Flow + dagre layout for dependency graphs | ✓ Good — professional graph visualization |
| Cycle-safe dagre layout | Remove cycle edges before layout, recombine after | ✓ Good — prevents infinite loop in layout |
| React Flow lazy-loaded via React.lazy | 222 KB separate chunk loads only on Graph tab click | ✓ Good — Lighthouse 90+ maintained |
| #compose= hash prefix | Distinct from #dockerfile= to prevent cross-tool collision | ✓ Good — clean URL namespace |
| DocumentedRule interface | Unifies ComposeLintRule and SchemaRuleMetadata for page generation | ✓ Good — 52 rule pages from single source |
| 3-tier share fallback | Web Share API > Clipboard API > prompt() | ✓ Good — platform-adaptive sharing |
| Async K8s engine with dynamic schema imports | K8s schemas too large for sync import; dynamic per-resource loading | ✓ Good — 76KB gzipped bundle |
| Single compiled Ajv module for 19 K8s schemas | Dedup shared definitions across resource types | ✓ Good — efficient schema compilation |
| Strip format fields from K8s schemas | Avoids ajv-formats require() in standalone output | ✓ Good — clean browser-safe validators |
| 19 resource types including ClusterRoleBinding | ClusterRoleBinding needed for RBAC analysis | ✓ Good — complete RBAC coverage |
| PSS Restricted inherits Baseline | Zero Baseline AND zero Restricted violations required | ✓ Good — accurate PSS compliance |
| totalRules = 10 + allK8sRules.length | Auto-adapts rule count without hardcoding | ✓ Good — zero Phase 44-47 engine changes needed |
| RBAC rules under Security category (35% weight) | RBAC is fundamentally a security concern | ✓ Good — SCORE-04 compliance |
| React Flow lazy-loaded for K8s graph | 222 KB separate chunk loads only on Graph tab | ✓ Good — Lighthouse 90+ maintained |
| #k8s= hash prefix for URL state | Distinct from #dockerfile= and #compose= | ✓ Good — clean cross-tool URL namespace |
| allDocumentedK8sRules includes SCHEMA_RULE_METADATA | Compatible DocumentedK8sRule shape via spread | ✓ Good — 67 rule pages from single source |
| 21 CIS Benchmark mappings on rule pages | Omit 3 rules with no direct CIS mapping | ✓ Good — accurate reference linking |

## Constraints

- **Framework:** Astro 5 (static site generator) — non-negotiable
- **Hosting:** GitHub Pages — free, integrates with repo
- **Custom domain:** patrykgolabek.dev — set as site URL everywhere
- **Deployment:** GitHub Actions only — withastro/action@v3
- **Content format:** Markdown with YAML frontmatter in content collections
- **Content config:** src/content.config.ts (Astro 5+ convention)
- **Performance:** Lighthouse 90+ in all categories (achieved)
- **Sitemap path:** sitemap-index.xml (Astro convention)
- **No base path:** User-level GitHub Pages site

---
*Last updated: 2026-02-24 after v1.8 milestone started*
