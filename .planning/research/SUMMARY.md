# Project Research Summary

**Project:** patrykgolabek.dev — Developer Portfolio + Blog
**Domain:** Static portfolio/blog site for senior cloud-native architect
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

This is a personal portfolio and blog site for a senior cloud-native software architect (17+ years experience, Kubernetes pre-1.0 adopter). The site serves as the professional web presence targeting recruiters, collaborators, and the developer community. Research shows that experts build these sites as content-driven static sites with aggressive SEO optimization, strong visual identity to stand out from generic portfolios, and performance as a portfolio piece itself (Lighthouse 90+ scores).

The recommended approach is Astro 5 with static output deployed to GitHub Pages with a custom domain. Astro dominates this space for content-heavy static sites with its zero-JS-by-default architecture, native MDX support, and type-safe content collections. Tailwind CSS v4 for styling, GSAP for animations (now 100% free), tsParticles for the signature "Quantum Explorer" dark theme particle effects, and comprehensive SEO tooling. The core differentiator is the visual theme — most senior architect portfolios are plain text resumes, while this site will have a memorable dark space aesthetic with particle effects and rich animations while maintaining perfect performance.

Key risks center around three areas: (1) GitHub Pages custom domain configuration breaking on every deploy if not set up correctly from day one, (2) particle animations destroying mobile performance and battery life if not constrained with visibility observers and reduced-motion fallbacks, and (3) dark mode flash-of-unstyled-content on page transitions if theme detection isn't implemented with an inline script before first paint. All three have documented solutions and must be addressed in the first three phases respectively.

## Key Findings

### Recommended Stack

Astro 5.17.x is the clear choice for this domain. It's purpose-built for content-driven sites with static output, ships with zero JavaScript by default (unlike Next.js/Nuxt which are app frameworks), and has first-class TypeScript and MDX support. The Content Layer API with glob loaders and Zod schema validation provides type-safe content management without a CMS backend.

**Core technologies:**
- **Astro 5.17.x**: Static site framework — zero JS by default, island architecture, Content Collections with type safety
- **TypeScript 5.9.x**: Type safety — Astro has first-class support, Content Collection schemas are fully typed
- **Tailwind CSS 4.1.x**: Utility-first CSS — v4 is a ground-up rewrite, config lives in CSS, use `@tailwindcss/vite` plugin NOT the deprecated `@astrojs/tailwind` integration
- **GSAP 3.14.x**: Scroll animations and timeline effects — now 100% free including ScrollTrigger after Webflow acquisition, 23KB core vs Motion's 85KB
- **@tsparticles/slim**: Particle background effects — actively maintained successor to particles.js, GPU-friendly rendering for the "Quantum Explorer" theme
- **@astrojs/sitemap + @astrojs/rss**: SEO infrastructure — auto-generate sitemap and RSS feed from content collections
- **astro-expressive-code**: Code highlighting — wraps Shiki with copy buttons, window frames, line markers out of the box
- **Sharp 0.34.x**: Image optimization — Astro's default (Squoosh was removed in v5), handles WebP/AVIF generation at build time

**Critical version note:** DO NOT use Astro 6 beta (currently 6.0.0-beta.10) — it's pre-release and not production-ready. Stay on 5.17.x stable.

### Expected Features

Research identifies a clear three-tier feature hierarchy based on what users expect, what provides competitive advantage, and what should be deferred.

**Must have (table stakes):**
- Responsive mobile-first layout — 53% of users abandon sites that take >3s on mobile, recruiters browse on phones
- Fast page loads (Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1) — Astro static HTML achieves this by default if images are optimized
- Clear navigation (5-7 items max) — Home, Projects, Blog, About, Contact
- Projects showcase with descriptions — 87% of hiring managers value portfolios over resumes
- About page with professional bio — recruiters need to know experience level, location, specialties
- Contact method — mailto link + LinkedIn (simple and reliable for static site, no form backend needed)
- Blog with readable posts — Astro content collections + MDX, 65-75 char line length, proper typography
- Code syntax highlighting — Shiki built-in with copy button
- Dark mode support — 82% of mobile users prefer dark mode, baked into "Quantum Explorer" theme with light toggle for accessibility
- SEO fundamentals — title/meta tags (50-60 chars title, 160 chars description), semantic HTML, sitemap, RSS, Open Graph
- Custom domain (patrykgolabek.dev) — signals professionalism, GitHub Pages supports via CNAME
- Reading time estimate — standard on dev blogs, calculate from word count at build (~200-250 wpm)

**Should have (competitive advantage):**
- "Quantum Explorer" visual theme — dark space canvas with particle effects, futuristic typography, makes the site memorable (most senior portfolios are plain)
- View transitions — smooth page animations via Astro's `<ClientRouter />`, feels like an app not a static document
- Dynamic OG image generation — auto-generated social cards per blog post using Satori + Sharp at build time
- Project case studies (not just links) — demonstrate senior-level thinking with problem/approach/architecture/outcomes
- Blog post series/tags/categories — organize by topic (Kubernetes, AI/ML, Platform Engineering)
- Search functionality — Pagefind indexes at build time, zero runtime cost, <10KB JS
- JSON-LD structured data — Schema.org Person markup for homepage, BlogPosting for posts, helps Google and AI-powered search
- Animated hero section — eye-catching entry point, typing effect for role title, particle background, CTA buttons
- Blog post table of contents — auto-generated from headings, sticky sidebar, essential for long-form technical articles

**Defer (v2+):**
- Pagefind search — worthwhile after 15-20+ blog posts
- GitHub activity integration — fetch pinned repos at build time
- Newsletter subscription — add when there are regular readers
- Deep project case studies — 3-5 detailed write-ups with architecture diagrams
- Privacy-friendly analytics — Plausible or Fathom when traffic data is needed

**Anti-features (deliberately NOT building):**
- CMS backend — overkill for single-author site updated monthly, Git-based editing is simpler
- Comments system — requires moderation, attracts spam, adds noise without value
- Complex contact form — needs third-party service for static site, mailto link + LinkedIn is reliable
- Multi-language i18n — doubles maintenance burden, target audience is English-speaking tech recruiters
- Heavy animation throughout every page — tanks performance and distracts from content (reserve for home hero only)
- Google Analytics — GA4 is 45KB+, requires cookie consent, sends data to Google (use Plausible/Fathom or skip for v1)

### Architecture Approach

Astro follows a build-layer-first architecture where content is queried at build time, pages are pre-rendered to static HTML, and client-side JavaScript is minimal (inline scripts only for theme toggle, scroll observers, and particle effects as islands). The Content Layer API with glob loaders decouples content from the `src/content/` directory — content files live in `src/data/blog/` and the config points to them via glob patterns. This avoids confusion with the legacy Astro 4 convention.

**Major components:**
1. **BaseLayout.astro** — Single layout wrapping every page with HTML shell, head tags, SEO component, header, footer, and global CSS. Receives SEO data as props, no multiple layouts for minor variations.
2. **Content Collections** — Zod schema validation for blog and project frontmatter, glob loader for `.md`/`.mdx` files, type generation via `astro sync`. Pages query via `getCollection()`, render via `render()` to get `<Content />` component.
3. **SEO.astro** — Centralized component owning all `<head>` meta tags (basic meta, Open Graph, Twitter Cards, JSON-LD structured data). Receives props from BaseLayout, defaults from site constants.
4. **Theme system** — Inline script in `<head>` reads localStorage + system `prefers-color-scheme` to apply `dark` class before first paint. Listens to `astro:after-swap` event to reapply after View Transitions. ThemeToggle component updates both localStorage and class.
5. **Dynamic routes** — `/blog/[slug].astro` exports `getStaticPaths()` which queries content collection and generates one static page per post. All routes known at build time.
6. **Particle effects** — Canvas-based particle system hydrated only on home hero using `client:visible` or `client:idle`. Must pause when tab is hidden (document.visibilitychange) and when scrolled off-screen (IntersectionObserver). Reduced-motion fallback shows static gradient.

**Key patterns:**
- **Data flows down**: Pages fetch data via `getCollection()`, pass as props to components. Components never fetch their own data.
- **Build-time only**: No runtime data fetching, no API calls from browser. Rebuild site weekly via scheduled GitHub Action to refresh GitHub stats if integrated.
- **Inline scripts for simple interactions**: Theme toggle, mobile nav, scroll reveals use vanilla JS in `<script>` tags. Reserve framework islands only for complex widgets.
- **Single source of truth for constants**: Site metadata, nav links, social URLs in `src/lib/constants.ts`. Everything references this file.

### Critical Pitfalls

Research identified seven critical pitfalls with documented recovery strategies. Top five:

1. **CNAME file deleted on every deploy** — Custom domain breaks after GitHub Actions deployment. GitHub Pages forgets the domain, site reverts to username.github.io. **How to avoid:** Add `public/CNAME` containing `patrykgolabek.dev`, set `site: 'https://patrykgolabek.dev'` in astro.config.mjs, do NOT set `base` (only for subdirectory deployments). Verify after first deploy.

2. **Dark mode flash of unstyled content (FOUC)** — Users see blinding white flash on every page load and navigation. **How to avoid:** Inline script in `<head>` with `is:inline` directive reads localStorage and applies `dark` class before first paint. Listen to `astro:after-swap` and `astro:page-load` events to reapply after View Transitions.

3. **Particle animations destroying Lighthouse Performance** — Canvas effects tank mobile performance below 90, drain battery even when tab is backgrounded. **How to avoid:** Use `client:visible` to lazy-load, pause via `document.visibilitychange` when hidden, reduce particle count 50-75% on mobile, respect `prefers-reduced-motion` with static fallback, use tsParticles slim bundle or custom minimal system (<5KB).

4. **Content Collections silent failures** — Blog posts exist but collection returns empty array, no build error thrown. **How to avoid:** Config at `src/content.config.ts` (not old `src/content/config.ts`), glob `base` path relative to project root (`src/data/blog` not `./content/blog`), run `npx astro sync` after schema changes, use `z.coerce.date()` not `z.date()` for date fields.

5. **Sitemap and SEO metadata generating wrong URLs** — Sitemap uses wrong domain or relative URLs, Open Graph tags break social sharing. **How to avoid:** Set `site: 'https://patrykgolabek.dev'` in astro.config.mjs (no trailing slash), use `new URL('/path', Astro.site).href` for absolute URLs in templates, validate sitemap-index.xml after build, test OG tags with Facebook Sharing Debugger.

**Additional pitfalls:**
6. Sharp image service failing in CI but working locally — Pin Node.js version, commit lockfile, install sharp explicitly if using pnpm
7. Tailwind CSS v4 integration breaking styles — Use `@tailwindcss/vite` plugin NOT deprecated `@astrojs/tailwind` integration, Astro >=5.2 required

## Implications for Roadmap

Based on research, the roadmap should follow dependency order: foundation (config + layout) → content infrastructure → static pages → visual effects → SEO polish → deployment. This order ensures each phase builds on stable primitives and avoids rework.

### Phase 1: Project Scaffold + Deployment Pipeline
**Rationale:** Must be correct from day one. CNAME deletion, Sharp failures, and Tailwind misconfiguration all manifest here. Get the foundation right before building anything visible.

**Delivers:**
- Astro 5.17.x project with TypeScript strict mode
- Tailwind CSS v4 configured via `@tailwindcss/vite` plugin
- GitHub Actions workflow with `withastro/action@v5`
- Custom domain (patrykgolabek.dev) with `public/CNAME` and correct `site` config
- Sharp image service verified working in CI
- Initial build deploys successfully to GitHub Pages with HTTPS

**Addresses:**
- Project structure from ARCHITECTURE.md
- Stack installation from STACK.md
- Custom domain requirement from FEATURES.md (table stakes)

**Avoids:**
- Pitfall 1 (CNAME deletion)
- Pitfall 6 (Sharp CI failure)
- Pitfall 7 (Tailwind v4 misconfiguration)

**Research flag:** Standard patterns, skip `/gsd:research-phase`. Well-documented in Astro official docs.

---

### Phase 2: Layout Shell + Theme System
**Rationale:** Every page depends on BaseLayout. Theme system must prevent FOUC from the start — retrofitting it later means touching every page. Build the shell once, use everywhere.

**Delivers:**
- `BaseLayout.astro` with HTML shell, head, body, slot
- `SEO.astro` component for meta tags, OG, Twitter Cards
- `Header.astro` with navigation (placeholder links initially)
- `Footer.astro` with social links
- Dark mode inline script preventing FOUC
- ThemeToggle component with localStorage persistence
- `src/lib/constants.ts` for site metadata
- `src/styles/global.css` with Tailwind import and CSS custom properties

**Addresses:**
- BaseLayout pattern from ARCHITECTURE.md
- Dark mode requirement from FEATURES.md (table stakes)
- Theme toggle pattern from ARCHITECTURE.md

**Avoids:**
- Pitfall 2 (Dark mode FOUC)

**Research flag:** Standard patterns, skip research. Theme FOUC solution is well-documented.

---

### Phase 3: Content Collections + Blog Infrastructure
**Rationale:** Content Collections must be defined and validated before blog pages can query them. Schema validation prevents silent failures. This phase establishes the content pipeline that feeds all blog-related pages.

**Delivers:**
- `src/content.config.ts` with blog collection definition
- Zod schema for blog frontmatter (title, description, date, tags, draft, ogImage)
- 3-5 initial blog posts in `src/data/blog/` (can cross-post from existing blogs)
- `BlogCard.astro` component for post previews
- `/blog/index.astro` listing page with `getCollection('blog')`
- `/blog/[slug].astro` dynamic routes with `getStaticPaths()` + `render()`
- Reading time calculation (200-250 wpm)
- Draft post filtering in production builds

**Addresses:**
- Content Collection pattern from ARCHITECTURE.md
- Blog with readable posts from FEATURES.md (table stakes)
- Code syntax highlighting from FEATURES.md (Shiki built-in)
- Reading time from FEATURES.md (table stakes)

**Avoids:**
- Pitfall 4 (Content Collections silent failures)

**Research flag:** Standard patterns, skip research. Content Collections are well-documented.

---

### Phase 4: Core Static Pages
**Rationale:** With layout and content infrastructure in place, pages are straightforward composition. These pages can launch with placeholder content and be enriched later.

**Delivers:**
- `/index.astro` home page with hero section (no particles yet, just static background)
- `/about.astro` with professional bio
- `/projects/index.astro` with curated project showcase (6-8 repos)
- Contact section on home or about page (mailto + LinkedIn links)
- Responsive design tested on mobile/tablet/desktop
- Accessible design (semantic HTML, keyboard nav, sufficient contrast)

**Addresses:**
- 5-page responsive structure from FEATURES.md (table stakes)
- About page from FEATURES.md (table stakes)
- Projects showcase from FEATURES.md (table stakes)
- Contact method from FEATURES.md (table stakes)
- Accessibility requirement from FEATURES.md (WCAG 2.1 AA)

**Avoids:**
- No pitfalls specific to this phase (depends on solid foundation from Phases 1-3)

**Research flag:** Standard patterns, skip research.

---

### Phase 5: SEO Foundation
**Rationale:** SEO infrastructure should go live with the site, not be added later. Sitemap, RSS, and OG tags are table stakes. JSON-LD is a differentiator but builds on the same primitives.

**Delivers:**
- `@astrojs/sitemap` integration generating sitemap-index.xml
- `@astrojs/rss` integration with `/rss.xml` endpoint
- Open Graph tags on all pages (unique per page)
- JSON-LD structured data (Person schema on home/about, BlogPosting on blog posts)
- `robots.txt` in `public/`
- Canonical URLs via `Astro.url` + `site` config
- Favicon and basic social meta
- Sitemap submitted to Google Search Console

**Addresses:**
- SEO fundamentals from FEATURES.md (table stakes)
- Sitemap from FEATURES.md (table stakes)
- RSS feed from FEATURES.md (table stakes)
- Open Graph tags from FEATURES.md (table stakes)
- JSON-LD structured data from FEATURES.md (competitive advantage)

**Avoids:**
- Pitfall 5 (Sitemap wrong URLs)
- Pitfall 5 (Open Graph relative URLs)

**Research flag:** Standard patterns, skip research. Well-documented in Astro guides.

---

### Phase 6: Visual Effects + Quantum Explorer Theme
**Rationale:** Visual effects are the signature differentiator but must not compromise performance. Build with constraints baked in: lazy-load, pause when hidden, respect reduced-motion. This phase comes after core functionality is solid.

**Delivers:**
- Particle canvas component (`ParticleCanvas.astro`) using tsParticles slim or custom system
- Hero section with particle background (home page only, not every page)
- Scroll reveal animations via IntersectionObserver for section reveals
- View Transitions enabled via `<ClientRouter />`
- Reduced-motion fallback (static gradient when `prefers-reduced-motion: reduce`)
- Particle system pauses when tab is hidden (document.visibilitychange)
- Particle count reduced 50-75% on mobile
- Lighthouse Performance >=90 on mobile verified

**Addresses:**
- Quantum Explorer visual theme from FEATURES.md (competitive advantage)
- View transitions from FEATURES.md (competitive advantage)
- Animated hero section from FEATURES.md (competitive advantage)

**Avoids:**
- Pitfall 3 (Particle animations destroying performance)
- Reduced-motion accessibility requirement

**Research flag:** NEEDS RESEARCH. Particle performance optimization and reduced-motion patterns need deeper investigation. Run `/gsd:research-phase` before implementation.

---

### Phase 7: Enhanced Blog Features
**Rationale:** Blog is functional from Phase 3, but these enhancements improve discoverability and reading experience. Tags, ToC, and dynamic OG images are competitive advantages.

**Delivers:**
- Tags/categories with index pages (`/blog/tags/[tag]`)
- Blog post table of contents (auto-generated from headings)
- Dynamic OG image generation using Satori + Sharp (per-post social cards)
- Pagination if >15-20 posts exist

**Addresses:**
- Tags/categories from FEATURES.md (competitive advantage)
- Table of contents from FEATURES.md (competitive advantage)
- Dynamic OG images from FEATURES.md (competitive advantage)

**Avoids:**
- No specific pitfalls (builds on validated content collections)

**Research flag:** NEEDS RESEARCH for OG image generation. Satori + Sharp integration patterns need investigation. Standard for tags/ToC.

---

### Phase Ordering Rationale

- **Foundation first (Phases 1-2):** CNAME, Tailwind, and theme FOUC must be correct from day one. Fixing these later requires touching every page.
- **Content infrastructure before pages (Phase 3 before 4):** Pages depend on content collections. Define schema and validate loading before building UI.
- **SEO with launch (Phase 5):** Sitemap and RSS should go live with the site. Adding later means search engines already crawled without them.
- **Effects last (Phase 6):** Visual differentiation is important but should not block launch. Core functionality must be solid first. Effects are progressive enhancement.
- **Enhanced features iterative (Phase 7):** Tags, ToC, and dynamic OG images improve existing blog. Can be added post-launch based on content volume and feedback.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 6 (Visual Effects):** Particle performance optimization strategies, reduced-motion patterns, IntersectionObserver + visibilitychange integration. Niche domain with sparse documentation for performance-constrained particle systems.
- **Phase 7 (OG Image Generation):** Satori + Sharp build-time integration, template design, font loading in Satori. Community patterns exist but need validation for Astro 5.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Astro scaffold, Tailwind v4 setup, GitHub Actions — all officially documented
- **Phase 2:** BaseLayout composition, theme toggle — standard patterns
- **Phase 3:** Content Collections — extensively documented in Astro guides
- **Phase 4:** Static page composition — straightforward Astro usage
- **Phase 5:** Sitemap, RSS, SEO meta — official integrations with clear docs

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry and official docs. Astro 5.17.x stable, Tailwind 4.1.x current, GSAP free for all use confirmed. No experimental packages recommended. |
| Features | HIGH | MVP definition backed by multiple sources (recruiter surveys, portfolio best practices, developer community consensus). Anti-features validated by pitfall research. |
| Architecture | HIGH | Based on official Astro documentation for Content Collections, layouts, and routing. Patterns align with Astro core team recommendations. |
| Pitfalls | HIGH | All seven critical pitfalls sourced from official docs, GitHub issues, and community blog posts with HIGH/MEDIUM confidence ratings. Recovery strategies documented. |

**Overall confidence:** HIGH

### Gaps to Address

Research was comprehensive for this domain, but three areas need attention during planning/execution:

- **Particle performance constraints:** While the pitfall is well-documented, the specific particle count thresholds, IntersectionObserver margin values, and Canvas optimization techniques for this project need empirical testing on target devices (mobile mid-range Android). Phase 6 should include device testing as acceptance criteria.

- **Dynamic OG image template design:** Technical implementation of Satori + Sharp is documented, but the visual design of the OG image template (layout, fonts, branding) is a design decision not covered by research. Phase 7 should include design mockup before implementation.

- **Content strategy:** Research covered technical blog features but not content strategy (which existing blog posts to cross-post, publishing cadence, topic mix). This is out of scope for technical research but should be addressed in Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- Astro official documentation (docs.astro.build) — project structure, content collections, routing, deployment, view transitions, images
- Astro npm registry — version verification for all packages (5.17.1 verified 2026-02-11)
- Tailwind CSS official docs — v4 installation for Astro, Vite plugin approach
- GitHub official docs — Pages deployment, custom domain, HTTPS
- GSAP official announcement — 100% free confirmation, all plugins included
- WCAG 2.1 specification — accessibility requirements for animations

### Secondary (MEDIUM confidence)
- Community blog posts on Astro dark mode FOUC solutions (simonporter.co.uk, danielnewton.dev)
- GitHub issues for Astro (#8711 View Transitions FOUC, #12795 glob loader validation, #14317 content config)
- Community guides on SEO for developer portfolios (Shipixen, eastondev.com)
- tsParticles GitHub repository and community implementations

### Tertiary (LOW confidence)
- None — all recommendations based on HIGH or MEDIUM confidence sources

---
*Research completed: 2026-02-11*
*Ready for roadmap: yes*
