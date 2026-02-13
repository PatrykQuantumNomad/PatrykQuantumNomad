# patrykgolabek.dev

## What This Is

A personal portfolio and blog site for Patryk Golabek, a Cloud-Native Software Architect with 17+ years of experience. Built with Astro 5 and deployed on GitHub Pages at patrykgolabek.dev. Features a custom "Quantum Explorer" dark space theme with particle canvas, view transitions, scroll reveals, and futuristic typography. The projects page showcases 16 GitHub repos in an interactive bento grid with GSAP-animated category filtering, mouse-tracking glow effects, and responsive design — demonstrating frontend craft alongside backend expertise.

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

### Active

(No active requirements — next milestone not yet defined)

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

## Context

Shipped v1.2 Projects Page Redesign on top of v1.1 Content Refresh and v1.0 MVP.
Tech stack: Astro 5, Tailwind CSS, TypeScript, MDX, Satori + Sharp for OG images, GSAP for animations.
Site live at patrykgolabek.dev via GitHub Pages with custom domain.
5,874 lines in src/ across Astro, TypeScript, CSS, MDX, and Markdown files.
All 36 v1.0 + 18 v1.1 + 23 v1.2 requirements delivered (77 total). Lighthouse 90+ on mobile.
Custom "Quantum Explorer" theme is distinctive and fully accessible.
Blog shows 11 posts (1 local + 10 external from Kubert AI and Translucent Computing).
Projects page features interactive bento grid with GSAP Flip filtering, mouse-tracking glow, and floating orbs.
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
*Last updated: 2026-02-13 after v1.2 milestone*
