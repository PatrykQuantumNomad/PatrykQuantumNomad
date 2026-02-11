# patrykgolabek.dev

## What This Is

A personal portfolio and blog site for Patryk Golabek, a Cloud-Native Software Architect with 17+ years of experience. Built with Astro 5 and deployed on GitHub Pages at patrykgolabek.dev. Features a custom "Quantum Explorer" dark space theme with particle canvas, view transitions, scroll reveals, and futuristic typography — designed to stand out from generic dev portfolios while maximizing SEO and professional discoverability.

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
- ✓ Projects page showcasing all 19 GitHub repos grouped by category — v1.0
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

### Active

(None — next milestone requirements to be defined via `/gsd:new-milestone`)

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

## Context

Shipped v1.0 with ~30,070 lines of code across 203 files.
Tech stack: Astro 5, Tailwind CSS, TypeScript, MDX, Satori + Sharp for OG images.
Site live at patrykgolabek.dev via GitHub Pages with custom domain.
All 36 v1 requirements delivered. Lighthouse 90+ on mobile.
Custom "Quantum Explorer" theme is distinctive and fully accessible.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fresh Astro scaffold over Astro Nano | Full creative control for custom Quantum Explorer theme | ✓ Good — enabled fully custom theme |
| Tailwind CSS for styling | Industry standard utility-first CSS, great with Astro | ✓ Good — fast development, responsive design |
| "Quantum Explorer" theme direction | Distinctive identity tied to QuantumNomad brand | ✓ Good — visually memorable, stands out |
| Rich animations (particles, scroll reveals) | Memorable first impression, showcases frontend capability | ✓ Good — with proper reduced-motion fallbacks |
| All 19 repos on projects page | Comprehensive showcase across Kubernetes, AI/ML, IaC | ✓ Good — full portfolio visibility |
| Full real content for first deploy | SEO value from day one — search engines index real content | ✓ Good — indexed with rich content |
| Static output only | GitHub Pages requires static files, no SSR needed | ✓ Good — fast, simple, reliable |
| Class-based dark mode (darkMode: 'class') | Supports manual toggle with OS fallback | ✓ Good — no FOUC, persists across sessions |
| CSS custom properties for theming | Runtime switching without recompilation | ✓ Good — clean theme architecture |
| Inline head script for FOUC prevention | Sets .dark class before first paint | ✓ Good — zero FOUC on any navigation |
| Satori + Sharp for OG images | Build-time generation, no server needed | ✓ Good — unique images per post, zero runtime cost |
| media="print" onload for async fonts | Non-blocking font loading for performance | ✓ Good — improved Lighthouse performance score |
| focus-visible over focus for outlines | Mouse users see no outline, keyboard users get indicators | ✓ Good — better UX for both input methods |

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
*Last updated: 2026-02-11 after v1.0 milestone*
