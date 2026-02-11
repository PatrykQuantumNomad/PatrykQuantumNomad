# Feature Research

**Domain:** Developer portfolio + blog site (senior architect)
**Researched:** 2026-02-11
**Confidence:** HIGH

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features visitors assume exist. Missing any of these and recruiters/collaborators bounce.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Responsive / mobile-first layout** | 53% of users abandon sites that take >3s on mobile; recruiters browse on phones. Mobile-responsive is non-negotiable. | MEDIUM | Tailwind CSS handles breakpoints; test on real devices. Must hit 44x44px tap targets. |
| **Fast page loads (Core Web Vitals)** | LCP <2.5s, INP <200ms, CLS <0.1. Google ranks on these; slow = unprofessional. Astro static HTML is fast by default. | LOW | Astro pre-renders static HTML. Main risk is heavy JS from particle effects or large images. Lazy-load all images. |
| **Clear navigation (max 5-7 items)** | Visitors decide in seconds whether to stay. Confused navigation = immediate bounce. | LOW | Home, Projects, Blog, About, Contact. Keep it flat. |
| **Projects showcase with descriptions** | 87% of hiring managers value portfolios over resumes. Each project needs: what it is, tech used, your role, link to repo/demo. | MEDIUM | Astro content collection for projects. 4-10 curated projects (not all 19 repos -- pick the strongest). Include screenshots/diagrams. |
| **About page with professional bio** | Recruiters want to know who you are, your experience level, location, and what you're looking for. | LOW | First-person, concise. Include title, years experience, specialties, location, availability. Link to LinkedIn. |
| **Contact method** | The whole point of a portfolio is reachability. No contact = dead end. | LOW | For a static site on GitHub Pages, use a mailto: link + LinkedIn link. Contact forms require a backend service. Start simple. |
| **Blog with readable posts** | Technical writing demonstrates expertise. A blog without good typography, code highlighting, and reading experience fails its purpose. | MEDIUM | Astro content collections + MDX. Shiki syntax highlighting (built-in). Readable line lengths (65-75 chars). |
| **Code syntax highlighting** | Developer audience expects properly highlighted code blocks. Monospace font, theme-appropriate colors, copy button. | LOW | Astro ships Shiki built-in with github-dark theme. Supports 200+ languages. Add copy-to-clipboard button via rehype plugin. |
| **Dark mode support** | 82% of mobile users prefer dark mode. For a "Quantum Explorer" dark-first theme, this is baked in -- but provide a light toggle for accessibility. | MEDIUM | Default dark (matches theme). Use CSS custom properties for theming. Persist preference to localStorage. Respect prefers-color-scheme. |
| **SEO fundamentals** | The site exists to be found. Title tags (50-60 chars), meta descriptions (160 chars), semantic HTML, heading hierarchy, clean URLs. | MEDIUM | Astro generates clean HTML. Add astro-seo component. Unique title/description per page. Canonical URLs. |
| **Sitemap** | Search engines need to discover all pages. Standard for any site that wants to rank. | LOW | `@astrojs/sitemap` integration -- one line in config. Auto-generates from all routes. |
| **RSS feed** | Developer audience subscribes via RSS. Expected for any blog. Enriched metadata increases subscriptions by ~18%. | LOW | `@astrojs/rss` integration. Auto-generate from blog content collection. Include full content, categories, author. |
| **Open Graph / social meta tags** | Links shared on Twitter/X, LinkedIn, Discord must show proper cards with title, description, image. | MEDIUM | OG tags + Twitter card meta on every page. Requires OG images (can be static initially, dynamic later). |
| **Accessible design (WCAG 2.1 AA)** | Legal requirement in many jurisdictions. Screen reader support, keyboard navigation, sufficient color contrast, alt text on all images. | MEDIUM | Astro view transitions include route announcer for screen readers. Test contrast ratios on dark theme (common pitfall). Use semantic HTML. |
| **Custom domain (patrykgolabek.dev)** | yourname.com signals professionalism. GitHub Pages supports custom domains via CNAME record. | LOW | Add CNAME file to public/. Configure DNS. Set `site` in astro.config. |
| **Reading time estimate** | Blog readers expect to know time commitment before reading. Standard on dev blogs. | LOW | Calculate from word count at build time (~200-250 wpm). Display in blog post header. |

### Differentiators (Competitive Advantage)

Features that set patrykgolabek.dev apart from generic developer portfolios. These are what make visitors remember the site.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"Quantum Explorer" visual theme** | Dark space canvas with particle effects, rich animations, futuristic typography. Makes the site memorable and signals creative technical ability. Most senior architect portfolios are plain. | HIGH | This is the signature differentiator. Use canvas-based particles (three.js or tsparticles) as Astro islands -- hydrate only on the home page hero. Must not tank performance. Provide reduced-motion fallback (static gradient). |
| **View transitions (page animations)** | Smooth animated transitions between pages make the site feel like an app, not a static document. Astro has built-in support via `<ClientRouter />`. | MEDIUM | Astro provides fade, slide, and custom animations. Automatically respects prefers-reduced-motion. Persist elements (like nav) across navigations. |
| **Dynamic OG image generation** | Auto-generated social sharing cards for each blog post with title, date, and branding. Looks polished when shared. Most portfolios use a single generic OG image. | MEDIUM | Use Satori + Sharp at build time. Generate 1200x630 images per blog post. Template matches site branding. No runtime dependency. |
| **Project case studies (not just links)** | Instead of just linking to GitHub repos, provide context: problem, approach, architecture decisions, tech stack, outcomes. Demonstrates senior-level thinking. | MEDIUM | MDX content collection for projects. Include architecture diagrams, tech badges, and key decisions. 3-5 deep case studies for flagship projects; brief cards for the rest. |
| **Blog post series / tags / categories** | Organize content by topic (Kubernetes, AI/ML, Platform Engineering, DevSecOps). Helps visitors find relevant content and signals depth in each domain. | LOW | Tags via frontmatter. Generate tag index pages. Content collection schema validates tags. |
| **Search functionality** | Lets visitors quickly find blog posts and projects. Expected on content-heavy sites. | MEDIUM | Use Pagefind (indexes at build time, zero runtime cost, <10KB JS). Integrates well with Astro static output. Better than Fuse.js for content-heavy blogs. |
| **JSON-LD structured data** | Schema.org Person markup with jobTitle, knowsAbout (skills), sameAs (social links). Helps Google understand the site is about a real professional. Increasingly important for AI-powered search. | MEDIUM | Add JSON-LD to layout. Person type on home/about. BlogPosting type on blog posts. Use `<script type="application/ld+json">` in head. |
| **GitHub activity integration** | Show recent contributions, pinned repos, or commit activity. Signals active developer (not just a static resume). | LOW | Fetch GitHub API at build time. Display pinned repos or contribution count. Rebuilds via scheduled GitHub Action (weekly). |
| **Animated hero section** | Eye-catching entry point with typing effect or animated text revealing title/tagline. First 3 seconds determine if a visitor stays. | MEDIUM | Keep it tasteful -- one animation, not a circus. Typing effect for role title. Particle background. CTA buttons below. |
| **Performance score badge** | Display Lighthouse 100/100 score. For a site built by an architect, perfect performance IS the portfolio piece. | LOW | Astro static sites regularly score 95-100. Achieving and displaying this demonstrates technical competence. |
| **Blog post table of contents** | Auto-generated ToC from headings. Essential for long-form technical articles. Helps readers navigate and signals comprehensive content. | LOW | Parse headings from rendered markdown. Sticky sidebar on desktop, collapsible on mobile. Highlight current section on scroll. |
| **Cross-posting links to existing blogs** | Link to articles on Translucent Computing blog and Kubert AI blog. Strengthens SEO backlink profile. Shows depth of writing without duplicating content. | LOW | Add "Also published on" links. Or aggregate external blog posts into the content collection with external URLs. |
| **Email newsletter subscription** | Capture interested readers for ongoing engagement. Simple Buttondown, Convertkit, or Substack integration. | LOW | Single email input + CTA. No complex forms. Link to external newsletter service. Progressive enhancement. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem appealing but create problems. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **CMS backend (WordPress, Strapi, etc.)** | "Easier to update content" | Adds hosting complexity, security surface, ongoing maintenance, and cost. For a single-author site updated monthly, it is overkill. Astro content collections with Git-based editing is simpler and more reliable. | Write Markdown/MDX in VS Code. Commit and push. GitHub Actions deploys automatically. Zero maintenance. |
| **Comments system** | "Engagement and community" | Requires moderation, attracts spam, needs a backend or third-party service (Disqus injects ads and tracking). For a portfolio site, comments add noise without proportional value. | Add a "Discuss on Twitter/X" or "Reply via email" link. Engage on social platforms where the audience already is. |
| **Complex contact form with validation** | "Professional contact method" | On a static GitHub Pages site, forms need a third-party service (Formspree, Netlify Forms, etc.) adding a dependency and potential failure point. For a portfolio targeting recruiters, they already know how to email. | Prominent mailto: link with pre-filled subject line + LinkedIn profile link. Simple, reliable, zero dependencies. |
| **Multi-language / i18n** | "Reach broader audience" | Doubles content maintenance burden. Patryk's target audience (English-speaking tech recruiters, collaborators) does not require translation. | Write in English. If needed later, Astro has built-in i18n routing -- but defer until there is actual demand. |
| **User accounts / authentication** | "Personalized experience" | A portfolio is a public read-only site. Authentication adds massive complexity (sessions, security, passwords) for zero user value. | None needed. The site is fully public. |
| **Real-time features (WebSockets, live data)** | "Show GitHub stats live" or "Live visitor count" | Requires a server or serverless functions, adds complexity, and the data is not meaningfully different from build-time fetched data for a portfolio. | Fetch GitHub data at build time. Rebuild weekly via scheduled GitHub Action. Data is fresh enough. |
| **Heavy animation throughout (every page)** | "Showcase frontend skills" | Particle effects and animations on EVERY page tank performance, distract from content, and cause accessibility issues. Research shows this is the #1 portfolio mistake. | Reserve heavy animations for the home page hero ONLY. Use subtle view transitions between pages. Blog posts should be clean reading experiences with zero animation distractions. |
| **Analytics with Google Analytics** | "Track visitors" | GA4 is heavyweight (45KB+), requires cookie consent banner (GDPR), and is overkill for a portfolio. Sends visitor data to Google. | Use Plausible or Fathom (~1KB script, no cookies, GDPR compliant, privacy-friendly). Or skip analytics entirely for v1 -- know your content is good and focus on writing. |
| **Infinite scroll for blog** | "Modern feel" | Breaks back button, harms SEO (search engines prefer paginated URLs), and frustrates users who want to reach the footer. | Standard pagination (10 posts per page) or "Load more" button. Clean URL per page. |
| **Client-side rendering (SPA mode)** | "App-like experience" | Defeats Astro's core advantage (zero JS by default). SPAs hurt SEO, increase bundle size, and break without JS. Astro view transitions give the same UX benefit without the downsides. | Use Astro's default static output with view transitions for smooth navigation. Islands for interactive components only. |

---

## Feature Dependencies

```
[Content Collections (blog + projects)]
    |-- requires --> [MDX Integration]
    |-- requires --> [Zod Schema Validation]
    |-- enables --> [Blog Post Pages]
    |       |-- enables --> [Reading Time]
    |       |-- enables --> [Table of Contents]
    |       |-- enables --> [Tags/Categories]
    |       |-- enables --> [RSS Feed]
    |       |-- enables --> [OG Image Generation]
    |       |-- enables --> [Search (Pagefind)]
    |-- enables --> [Project Case Studies]
    |       |-- enables --> [GitHub Activity Integration]

[Base Layout + Theming]
    |-- requires --> [Tailwind CSS]
    |-- requires --> [Dark Mode System]
    |-- enables --> [Responsive Design]
    |-- enables --> [View Transitions]
    |-- enables --> [Quantum Explorer Theme]
    |       |-- requires --> [Particle Effects (Canvas/Islands)]
    |       |-- requires --> [Reduced Motion Fallback]

[SEO Foundation]
    |-- requires --> [Sitemap (@astrojs/sitemap)]
    |-- requires --> [Meta Tags (astro-seo)]
    |-- requires --> [Canonical URLs]
    |-- enables --> [JSON-LD Structured Data]
    |-- enables --> [OG Image Generation]

[Custom Domain]
    |-- requires --> [CNAME in public/]
    |-- requires --> [DNS Configuration]
    |-- requires --> [site config in astro.config]
```

### Dependency Notes

- **Content Collections require MDX Integration:** MDX enables component-in-markdown for interactive code examples and custom layouts in blog posts and project case studies.
- **OG Image Generation requires Content Collections:** Needs access to post titles, descriptions, and dates from frontmatter to generate images at build time.
- **Pagefind Search requires built static output:** Pagefind indexes the generated HTML post-build, so it runs as a post-build step.
- **View Transitions require Base Layout:** The `<ClientRouter />` component lives in the base layout and wraps all pages.
- **Quantum Explorer Theme requires Reduced Motion Fallback:** Particle effects and heavy animations MUST have a static fallback for accessibility compliance (prefers-reduced-motion).
- **JSON-LD Structured Data enhances SEO Foundation:** Built on top of basic meta tags, adds machine-readable context that improves search engine and AI understanding.

---

## MVP Definition

### Launch With (v1)

Minimum viable site -- enough to replace the GitHub profile as the primary professional web presence.

- [ ] **Responsive 5-page site** (Home, Blog, Blog Post, Projects, About) -- the core structure
- [ ] **Base dark theme with light mode toggle** -- core visual identity without particle effects yet
- [ ] **Content collections for blog + projects** -- Markdown/MDX with Zod schemas
- [ ] **3-5 initial blog posts** (can be cross-posted from existing Translucent Computing or Kubert AI blogs)
- [ ] **Project showcase (top 6-8 repos)** with descriptions, tech stacks, repo links
- [ ] **SEO fundamentals** -- meta tags, sitemap, RSS, canonical URLs, OG tags
- [ ] **Code syntax highlighting** -- Shiki built-in with copy button
- [ ] **Contact section** -- mailto link + LinkedIn + GitHub profile links
- [ ] **Custom domain** -- patrykgolabek.dev configured with GitHub Pages
- [ ] **GitHub Actions CI/CD** -- auto-deploy on push to main
- [ ] **Accessible design** -- semantic HTML, keyboard nav, contrast ratios, alt text

### Add After Validation (v1.x)

Features to add once the core site is live and content is flowing.

- [ ] **Quantum Explorer particle effects** -- add to home hero only, with reduced-motion fallback
- [ ] **View transitions** -- smooth page animations via `<ClientRouter />`
- [ ] **Dynamic OG image generation** -- Satori + Sharp for per-post social cards
- [ ] **JSON-LD structured data** -- Person + BlogPosting schemas
- [ ] **Blog post table of contents** -- auto-generated from headings
- [ ] **Reading time estimates** -- calculated at build time
- [ ] **Tags/categories with index pages** -- organize blog content by topic
- [ ] **Animated hero section** -- typing effect for role title

### Future Consideration (v2+)

Features to defer until the site has content and traffic.

- [ ] **Pagefind search** -- worthwhile after 15-20+ blog posts
- [ ] **GitHub activity integration** -- fetch pinned repos / contribution data at build time
- [ ] **Newsletter subscription** -- add when there are regular readers to retain
- [ ] **Deep project case studies** -- 3-5 detailed write-ups with architecture diagrams
- [ ] **Privacy-friendly analytics** -- Plausible or Fathom when you want traffic data
- [ ] **Performance score badge** -- display after achieving consistent Lighthouse 100

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Responsive 5-page structure | HIGH | MEDIUM | P1 |
| Content collections (blog + projects) | HIGH | MEDIUM | P1 |
| Dark/light theme | HIGH | MEDIUM | P1 |
| SEO fundamentals (meta, sitemap, RSS) | HIGH | LOW | P1 |
| Code syntax highlighting | HIGH | LOW | P1 |
| Custom domain | HIGH | LOW | P1 |
| GitHub Actions CI/CD | HIGH | LOW | P1 |
| Contact section | HIGH | LOW | P1 |
| Accessibility (WCAG 2.1 AA) | HIGH | MEDIUM | P1 |
| Quantum Explorer particle effects | MEDIUM | HIGH | P2 |
| View transitions | MEDIUM | LOW | P2 |
| OG image generation | MEDIUM | MEDIUM | P2 |
| JSON-LD structured data | MEDIUM | MEDIUM | P2 |
| Table of contents | MEDIUM | LOW | P2 |
| Reading time | MEDIUM | LOW | P2 |
| Tags/categories | MEDIUM | LOW | P2 |
| Animated hero | MEDIUM | MEDIUM | P2 |
| Search (Pagefind) | LOW | MEDIUM | P3 |
| GitHub activity integration | LOW | LOW | P3 |
| Newsletter subscription | LOW | LOW | P3 |
| Deep case studies | MEDIUM | HIGH | P3 |
| Analytics (Plausible) | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- site is incomplete without these
- P2: Should have, add in v1.x -- enhance the experience
- P3: Nice to have, future consideration -- defer until content/traffic justify

---

## Competitor Feature Analysis

| Feature | Generic Dev Portfolios | Top Astro Blog Templates (AstroPaper, etc.) | patrykgolabek.dev Approach |
|---------|------------------------|----------------------------------------------|---------------------------|
| Visual identity | Generic templates, similar look | Clean and minimal, interchangeable | Unique "Quantum Explorer" dark theme with particle effects -- memorable and distinctive |
| Project showcase | List of repo links | Basic cards with descriptions | Curated case studies demonstrating architectural thinking, not just code links |
| Blog experience | Basic markdown rendering | Full-featured (tags, search, RSS) | Full-featured blog with emphasis on code quality (Shiki, copy button, ToC) |
| SEO | Often afterthought | Good defaults (sitemap, meta) | Aggressive from day one: structured data, OG images, schema.org, clean URLs |
| Performance | Variable (often heavy frameworks) | Excellent (Astro default) | Target Lighthouse 100 -- the performance IS the portfolio for an architect |
| Content depth | Surface-level project lists | Blog posts | Deep technical writing + architecture decision records + cross-links to external blogs |
| Personal brand | Name + photo + links | Minimal branding | Strong narrative: 17+ years, pre-1.0 K8s, cloud-native + AI/ML intersection |
| Animations | Either none or overdone | Minimal (view transitions) | Tasteful: particles on home hero only, view transitions between pages, clean blog reading |

---

## Sources

- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- HIGH confidence, official documentation
- [Astro View Transitions docs](https://docs.astro.build/en/guides/view-transitions/) -- HIGH confidence, official documentation
- [Astro Syntax Highlighting docs](https://docs.astro.build/en/guides/syntax-highlighting/) -- HIGH confidence, official documentation
- [Astro GitHub Pages Deployment docs](https://docs.astro.build/en/guides/deploy/github/) -- HIGH confidence, official documentation
- [SEO Checklist for Developer Portfolios (Shipixen)](https://shipixen.com/blog/seo-checklist-for-developer-portfolios-and-landing-pages) -- MEDIUM confidence, verified against multiple sources
- [5 Mistakes Developers Make in Portfolio Websites](https://www.devportfoliotemplates.com/blog/5-mistakes-developers-make-in-their-portfolio-websites) -- MEDIUM confidence, aligns with multiple sources
- [How Recruiters Actually Look at Your Portfolio](https://blog.opendoorscareers.com/p/how-recruiters-and-hiring-managers-actually-look-at-your-portfolio) -- MEDIUM confidence
- [Beyond the ATS: Build a Tech Portfolio That Gets Hired (TieTalent)](https://tietalent.com/en/blog/220/beyond-the-ats-how-to-build-a-tech-portfolio) -- MEDIUM confidence
- [Astro OG Image Generation (Cassidy Williams)](https://cassidoo.co/post/og-image-gen-astro/) -- MEDIUM confidence, practical implementation guide
- [Dynamic OG Images in AstroPaper](https://astro-paper.pages.dev/posts/dynamic-og-image-generation-in-astropaper-blog-posts/) -- MEDIUM confidence
- [Pagefind for Static Site Search](https://www.webdong.dev/en/post/how-to-add-search-to-any-kind-of-static-site-using-pagefind/) -- MEDIUM confidence
- [Plausible Analytics](https://plausible.io/) -- HIGH confidence, official site
- [Dark Mode Design Trends 2025 (AlterSquare)](https://www.altersquare.io/dark-mode-design-trends-for-2025-should-your-startup-adopt-it/) -- MEDIUM confidence
- [Structured Data for SEO (DK Development)](https://dkdevelopment.net/seo-structured-data-2025/) -- MEDIUM confidence

---
*Feature research for: patrykgolabek.dev -- Developer Portfolio + Blog*
*Researched: 2026-02-11*
