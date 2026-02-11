# patrykgolabek.dev

## What This Is

A personal portfolio and blog site for Patryk Golabek, a Cloud-Native Software Architect with 17+ years of experience. Built with Astro and deployed on GitHub Pages at patrykgolabek.dev. The site features a custom "Quantum Explorer" theme — dark space canvas, particle effects, futuristic typography — designed to stand out from generic dev portfolios while maximizing SEO and professional discoverability.

## Core Value

The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Astro static site scaffolded from scratch (no starter template)
- [ ] Custom "Quantum Explorer" theme with dark space canvas aesthetic
- [ ] Light/dark mode toggle
- [ ] Rich animations — particle/star effects, animated hero, scroll-triggered reveals
- [ ] Clean futuristic typography
- [ ] Home page with headline, intro, featured projects, blog links
- [ ] Blog listing page at /blog/
- [ ] Individual blog post pages at /blog/[slug]/
- [ ] Projects page showcasing all 19 GitHub repos, grouped by category
- [ ] About page with professional bio, tech stack, profile links
- [ ] Content collections for blog posts with full schema (title, description, pubDate, updatedDate, heroImage, tags, draft)
- [ ] First blog post: "Building a Kubernetes Observability Stack"
- [ ] Full real content — bio, project descriptions, blog post (ship-ready)
- [ ] SEO component with title, meta description, canonical URL, Open Graph, Twitter Cards
- [ ] JSON-LD structured data (Person schema on homepage, BlogPosting on posts)
- [ ] @astrojs/sitemap generating sitemap-index.xml
- [ ] RSS feed at /rss.xml via @astrojs/rss
- [ ] @astrojs/mdx for component-enhanced Markdown
- [ ] Tailwind CSS for styling
- [ ] public/CNAME with patrykgolabek.dev
- [ ] public/robots.txt pointing to sitemap-index.xml
- [ ] GitHub Actions deployment workflow using withastro/action@v3
- [ ] astro.config.mjs with site: 'https://patrykgolabek.dev', output: 'static'
- [ ] Lighthouse scores 90+ across all categories
- [ ] Keywords naturally integrated: Kubernetes, cloud-native, AI/ML, platform engineering, DevSecOps, etc.

### Out of Scope

- Cloning Astro Nano or any starter template — building custom from scratch
- Server-side rendering — static output only for GitHub Pages
- CMS integration — content managed as Markdown files in repo
- Contact form with backend — no server to process it
- Analytics dashboard — may add later but not v1
- Mobile app or PWA — web-first
- E-commerce or payment features — portfolio only
- DNS configuration and domain verification — manual steps documented but not automated

## Context

- **Owner:** Patryk Golabek, Cloud-Native Software Architect, Ontario, Canada
- **GitHub:** github.com/PatrykQuantumNomad (19 repos — Kubernetes, AI/ML, Terraform, Python)
- **Blogs:** translucentcomputing.com/blog/ (cloud architecture), mykubert.com/blog/ (AI)
- **LinkedIn:** linkedin.com/in/patryk-golabek-65b94617b
- **Domain:** patrykgolabek.dev (purchased, needs DNS configuration)
- **Target audience:** Recruiters, collaborators, developer community
- **Target roles:** Software Architect, Staff Engineer, Engineering Leadership
- **Repo name:** patrykquantumnomad.github.io (GitHub user site)
- **Theme inspiration:** Star Trek, Dune, "QuantumNomad" identity — a nomad traversing the digital cosmos
- **Key SEO keywords:** Python, Java, TypeScript, Kubernetes, Terraform, Terragrunt, Google Cloud, AWS, Docker, React, Angular, Next.js, LangGraph, LLM Agents, RAG Pipelines, Prompt Engineering, CI/CD, GitOps, Observability, DevSecOps, Platform Engineering, Cloud-Native, Infrastructure as Code

## Constraints

- **Framework:** Astro (static site generator) — non-negotiable
- **Hosting:** GitHub Pages — free, integrates with repo
- **Custom domain:** patrykgolabek.dev — must be set as site URL everywhere
- **Deployment:** GitHub Actions only — withastro/action@v3
- **Content format:** Markdown with YAML frontmatter in content collections
- **Content config:** src/content.config.ts (Astro 5+ convention)
- **Performance:** Lighthouse 90+ in all categories
- **Sitemap path:** sitemap-index.xml (Astro convention, not sitemap.xml)
- **No base path:** User-level GitHub Pages site, no base config needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fresh Astro scaffold over Astro Nano | Full creative control for custom Quantum Explorer theme | — Pending |
| Tailwind CSS for styling | Industry standard utility-first CSS, great with Astro | — Pending |
| "Quantum Explorer" theme direction | Distinctive identity tied to QuantumNomad brand — not another boring dev site | — Pending |
| Rich animations (particles, scroll reveals) | Memorable first impression, showcases frontend capability | — Pending |
| All 19 repos on projects page | Comprehensive showcase of work across Kubernetes, AI/ML, IaC domains | — Pending |
| Full real content for first deploy | SEO value from day one — search engines index real content, not placeholders | — Pending |
| Static output only | GitHub Pages requires static files, no SSR needed for portfolio | — Pending |

---
*Last updated: 2026-02-11 after initialization*
