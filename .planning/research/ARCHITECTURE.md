# Architecture Research

**Domain:** Astro 5+ portfolio + blog static site (patrykgolabek.dev)
**Researched:** 2026-02-11
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Build Layer (Astro SSG)                     │
│                                                                     │
│  astro.config.mjs          src/content.config.ts                    │
│  (site, base, vite         (defineCollection, glob loader,          │
│   plugins, integrations)    Zod schemas, type generation)           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                         Page Layer (src/pages/)                     │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ ┌──────────────────┐ │
│  │ index    │ │ about    │ │ projects/      │ │ blog/            │ │
│  │ .astro   │ │ .astro   │ │ index.astro    │ │ index.astro      │ │
│  │          │ │          │ │                │ │ [slug].astro     │ │
│  └────┬─────┘ └────┬─────┘ └──────┬─────────┘ └──────┬───────────┘ │
│       │            │              │                   │             │
│       └────────────┴──────────────┴───────────────────┘             │
│                            │                                        │
├────────────────────────────┼────────────────────────────────────────┤
│                      Layout Layer                                   │
│                            │                                        │
│                   ┌────────┴────────┐                               │
│                   │  BaseLayout     │                               │
│                   │  (html, head,   │                               │
│                   │   body shell)   │                               │
│                   └────────┬────────┘                               │
│                            │                                        │
│              ┌─────────────┼──────────────┐                         │
│              │             │              │                          │
│       ┌──────┴──────┐ ┌───┴────┐  ┌──────┴──────┐                  │
│       │  SEO        │ │ Header │  │  Footer     │                  │
│       │  (meta,og,  │ │ (nav,  │  │  (links,    │                  │
│       │   schema)   │ │  theme)│  │   social)   │                  │
│       └─────────────┘ └────────┘  └─────────────┘                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      Component Layer                                │
│                                                                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│  │ Hero      │ │ BlogCard  │ │ Project   │ │ Particle  │          │
│  │ Section   │ │           │ │ Card      │ │ Background│          │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│  │ ScrollRe- │ │ ThemeTog- │ │ Tag/Badge │ │ Section   │          │
│  │ veal      │ │ gle       │ │           │ │ Heading   │          │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      Content Layer                                  │
│                                                                     │
│  src/data/blog/              src/data/projects/                     │
│  ├── post-1.md               ├── projects.json                     │
│  ├── post-2.md               (or individual .md files)             │
│  └── post-3.mdx                                                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      Static Assets (public/)                        │
│                                                                     │
│  ├── favicon.svg   ├── robots.txt   ├── CNAME                      │
│  └── og-default.png                                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      Output (dist/)                                 │
│                                                                     │
│  Static HTML + CSS + minimal JS  -->  GitHub Pages                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `astro.config.mjs` | Site URL, Vite plugins (Tailwind), build output, integrations | Build system, all components |
| `src/content.config.ts` | Collection definitions (blog, projects), Zod schemas, glob loaders | Content layer, page layer |
| `BaseLayout.astro` | HTML shell (`<html>`, `<head>`, `<body>`), global CSS import, `<slot />` for page content | SEO, Header, Footer, ClientRouter, all pages |
| `SEO.astro` | `<title>`, `<meta>`, Open Graph, Twitter Cards, JSON-LD schema | BaseLayout (receives props), `<head>` |
| `Header.astro` | Navigation links, site logo, ThemeToggle mount point | BaseLayout, ThemeToggle |
| `Footer.astro` | Social links, copyright, secondary navigation | BaseLayout |
| `ThemeToggle.astro` | Light/dark mode switch, localStorage persistence, system preference detection | Header, inline `<script>`, `<html>` class attribute |
| `ParticleBackground` | Canvas-based or CSS particle animation for hero sections | Hero section (client:idle or client:visible island) |
| `ScrollReveal.astro` | IntersectionObserver-based reveal animations for sections | Any section wrapper, inline `<script>` |
| `BlogCard.astro` | Preview card for blog posts (title, date, excerpt, tags) | Blog index page, content collection data |
| `ProjectCard.astro` | Preview card for projects (name, tech stack, links) | Projects page, content collection data |
| Page files (`src/pages/`) | Route definitions, data fetching via `getCollection()`/`getEntry()`, template composition | Layouts, components, content collections |
| `[slug].astro` | Dynamic blog post routes via `getStaticPaths()`, renders `<Content />` from `render()` | Content collections, BaseLayout |

## Recommended Project Structure

```
patrykgolabek.dev/
├── public/                        # Static assets (no processing)
│   ├── favicon.svg                # Site favicon
│   ├── og-default.png             # Default Open Graph image
│   ├── robots.txt                 # Search engine directives
│   └── CNAME                      # Custom domain for GitHub Pages
│
├── src/
│   ├── components/                # Reusable UI components
│   │   ├── layout/                # Layout-specific components
│   │   │   ├── Header.astro       # Site navigation + theme toggle
│   │   │   ├── Footer.astro       # Footer content + social links
│   │   │   └── SEO.astro          # Meta tags, OG, JSON-LD
│   │   │
│   │   ├── ui/                    # Generic UI primitives
│   │   │   ├── BlogCard.astro     # Blog post preview card
│   │   │   ├── ProjectCard.astro  # Project showcase card
│   │   │   ├── TagBadge.astro     # Tag/category badge
│   │   │   ├── SectionHeading.astro # Consistent section headers
│   │   │   └── Button.astro       # Reusable button/link component
│   │   │
│   │   ├── sections/              # Page-specific section blocks
│   │   │   ├── Hero.astro         # Landing page hero
│   │   │   ├── FeaturedPosts.astro  # Recent blog posts section
│   │   │   ├── FeaturedProjects.astro # Highlighted projects
│   │   │   └── SkillsGrid.astro   # Technology/skills showcase
│   │   │
│   │   └── effects/               # Animation & visual effects
│   │       ├── ScrollReveal.astro # IntersectionObserver reveals
│   │       ├── ParticleCanvas.astro # Particle background effect
│   │       └── ThemeToggle.astro  # Dark/light mode switcher
│   │
│   ├── layouts/                   # Page layout templates
│   │   └── BaseLayout.astro       # Root layout (html/head/body)
│   │
│   ├── pages/                     # File-based routes (REQUIRED)
│   │   ├── index.astro            # Home page (/)
│   │   ├── about.astro            # About page (/about/)
│   │   ├── projects/
│   │   │   └── index.astro        # Projects listing (/projects/)
│   │   └── blog/
│   │       ├── index.astro        # Blog listing (/blog/)
│   │       └── [slug].astro       # Individual post (/blog/[slug]/)
│   │
│   ├── data/                      # Content collection source files
│   │   ├── blog/                  # Blog post markdown/MDX files
│   │   │   ├── my-first-post.md
│   │   │   └── another-post.mdx
│   │   └── projects/              # Project data
│   │       └── projects.json      # Or individual .md files
│   │
│   ├── styles/                    # Global styles
│   │   └── global.css             # Tailwind import + custom CSS vars
│   │
│   ├── lib/                       # Utility functions
│   │   ├── constants.ts           # Site metadata, nav links, social links
│   │   ├── utils.ts               # Date formatting, slug helpers
│   │   └── types.ts               # Shared TypeScript types
│   │
│   └── content.config.ts          # Content collection definitions
│
├── astro.config.mjs               # Astro configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
└── .github/
    └── workflows/
        └── deploy.yml             # GitHub Pages deployment action
```

### Structure Rationale

- **`src/components/` with subdirectories:** Prevents a flat dump of 15+ components. `layout/` holds structural pieces that appear on every page. `ui/` holds generic reusable primitives. `sections/` holds composed blocks used on specific pages. `effects/` isolates animation concerns that may need client-side JS.
- **`src/data/` instead of `src/content/`:** Astro 5's Content Layer API decoupled content from the `src/content/` directory. The `glob()` loader points to any directory. Using `src/data/` makes the separation between "content files" and "content config" clearer and avoids confusion with the old convention. The config file lives at `src/content.config.ts` regardless of where data files are stored.
- **`src/lib/`:** Centralizes non-component logic (constants, utilities, types). Keeps components focused on rendering, not data manipulation.
- **`src/styles/global.css`:** Single entry point for Tailwind (`@import "tailwindcss"`) plus CSS custom properties for theme colors, fonts, and animation variables. Imported once in `BaseLayout.astro`.
- **`public/CNAME`:** Required for custom domain on GitHub Pages. Must contain `patrykgolabek.dev`.

## Architectural Patterns

### Pattern 1: Single Base Layout with Prop-Driven SEO

**What:** One `BaseLayout.astro` wraps every page. It receives SEO data as props and passes them to the `SEO.astro` component. No separate layout per page type -- use composition within pages instead.

**When to use:** Always. Every page needs the HTML shell, global CSS, header, footer, and SEO meta.

**Trade-offs:** Simpler than multiple layouts. If a page needs radically different chrome (no header), use a boolean prop like `hideNav` rather than creating a second layout.

**Example:**

```astro
---
// src/layouts/BaseLayout.astro
import SEO from '../components/layout/SEO.astro';
import Header from '../components/layout/Header.astro';
import Footer from '../components/layout/Footer.astro';
import { ClientRouter } from 'astro:transitions';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedDate?: string;
  canonicalUrl?: string;
}

const { title, description, ogImage, ogType = 'website', publishedDate, canonicalUrl } = Astro.props;
---

<!doctype html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <SEO
      title={title}
      description={description}
      ogImage={ogImage}
      ogType={ogType}
      publishedDate={publishedDate}
      canonicalUrl={canonicalUrl ?? Astro.url.href}
    />
    <ClientRouter />
  </head>
  <body class="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

### Pattern 2: Content Collection with Type-Safe Schema

**What:** Define blog collection in `src/content.config.ts` using the Astro 5 Content Layer API with `glob()` loader and Zod schema validation. The schema enforces frontmatter structure at build time -- invalid posts fail the build with helpful error messages.

**When to use:** For all structured content (blog posts, projects).

**Trade-offs:** Slightly more setup than raw markdown imports, but provides type safety, validation, and the `getCollection()`/`render()` API. Worth it for any site with more than a handful of content files.

**Example:**

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: file('./src/data/projects/projects.json'),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    repo: z.string().url().optional(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
```

### Pattern 3: Dynamic Routes via getStaticPaths + Content Collections

**What:** The `[slug].astro` page exports `getStaticPaths()` which queries the blog collection and generates one static HTML page per post at build time. Data is passed via `props` -- no re-querying inside the component.

**When to use:** For the `/blog/[slug]/` route. This is the canonical Astro 5 pattern for content-driven static pages.

**Trade-offs:** All routes must be known at build time (this is correct for a static blog). Adding a new post means rebuilding the site.

**Example:**

```astro
---
// src/pages/blog/[slug].astro
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
---

<BaseLayout
  title={post.data.title}
  description={post.data.description}
  ogType="article"
  publishedDate={post.data.publishedDate.toISOString()}
>
  <article class="prose dark:prose-invert max-w-3xl mx-auto px-4 py-12">
    <h1>{post.data.title}</h1>
    <time datetime={post.data.publishedDate.toISOString()}>
      {post.data.publishedDate.toLocaleDateString('en-CA')}
    </time>
    <Content />
  </article>
</BaseLayout>
```

### Pattern 4: Theme Toggle with Anti-Flicker Inline Script

**What:** Dark mode uses Tailwind's `class` strategy (`dark:` variants). A tiny inline script in `<head>` reads `localStorage` and applies the `dark` class to `<html>` before the page paints. The toggle component updates localStorage and the class. When using View Transitions (`<ClientRouter />`), the `astro:after-swap` event re-applies the theme to prevent flash-of-wrong-theme between navigations.

**When to use:** Any Astro site with dark mode and View Transitions.

**Trade-offs:** The inline script in `<head>` adds ~200 bytes to every page but eliminates the flash-of-incorrect-theme (FOIT) that would occur if theme detection ran after paint.

**Example:**

```astro
---
// In BaseLayout.astro <head>, BEFORE any stylesheet:
---
<script is:inline>
  const theme = (() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })();
  document.documentElement.classList.toggle('dark', theme === 'dark');

  // Re-apply on View Transition page swap
  document.addEventListener('astro:after-swap', () => {
    const t = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', t === 'dark');
  });
</script>
```

### Pattern 5: Scroll Reveal via IntersectionObserver (No Framework)

**What:** A `ScrollReveal.astro` wrapper component that uses a small inline script with `IntersectionObserver` to add a CSS class when elements enter the viewport. Pure CSS handles the animation. No React/Vue/Svelte needed -- this stays within Astro's zero-JS-by-default philosophy.

**When to use:** For scroll-triggered fade-in, slide-up, or other reveal animations on sections.

**Trade-offs:** Lighter than a framework island. Inline script re-runs per page if `data-astro-rerun` is set or if using `is:inline`. For View Transitions, listen to `astro:page-load` to re-initialize observers.

**Example:**

```astro
---
// src/components/effects/ScrollReveal.astro
interface Props {
  animation?: 'fade-up' | 'fade-in' | 'slide-left';
  delay?: number;
  threshold?: number;
}

const { animation = 'fade-up', delay = 0, threshold = 0.1 } = Astro.props;
---

<div
  class="scroll-reveal opacity-0"
  data-animation={animation}
  data-delay={delay}
  data-threshold={threshold}
>
  <slot />
</div>

<script>
  function initScrollReveal() {
    const elements = document.querySelectorAll('.scroll-reveal:not(.revealed)');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => el.classList.add('revealed'), delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    elements.forEach((el) => observer.observe(el));
  }

  // Run on initial load and after View Transition navigations
  initScrollReveal();
  document.addEventListener('astro:page-load', initScrollReveal);
</script>
```

### Pattern 6: SEO Component with Structured Data

**What:** A single `SEO.astro` component owns all `<head>` meta tags: basic meta, Open Graph, Twitter Cards, and JSON-LD structured data. Pages pass data as props. Defaults come from a site constants file.

**When to use:** Every page, via BaseLayout.

**Trade-offs:** Centralizes all SEO logic in one place. If structured data becomes complex (e.g., different schemas per page type), consider splitting into sub-components, but start unified.

**Example:**

```astro
---
// src/components/layout/SEO.astro
import { SITE } from '../../lib/constants';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedDate?: string;
  canonicalUrl: string;
}

const {
  title,
  description,
  ogImage = SITE.defaultOgImage,
  ogType = 'website',
  publishedDate,
  canonicalUrl,
} = Astro.props;

const fullTitle = `${title} | ${SITE.name}`;
const ogImageUrl = new URL(ogImage, Astro.site).href;

const jsonLd = ogType === 'article'
  ? {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      datePublished: publishedDate,
      author: { '@type': 'Person', name: SITE.author },
      image: ogImageUrl,
    }
  : {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.url,
      description,
    };
---

<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalUrl} />

<!-- Open Graph -->
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImageUrl} />
<meta property="og:type" content={ogType} />
<meta property="og:url" content={canonicalUrl} />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImageUrl} />

<!-- Structured Data -->
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

## Data Flow

### Build-Time Data Flow (Primary)

```
┌─────────────────┐     glob()       ┌──────────────────────┐
│  Markdown/MDX   │────────────────>│  Content Collections  │
│  files in       │                  │  (validated by Zod    │
│  src/data/blog/ │                  │   schema at build)    │
└─────────────────┘                  └──────────┬───────────┘
                                                │
                         getCollection('blog')  │  getEntry('blog', id)
                                                │
                    ┌───────────────────────────┬┴──────────────────────┐
                    │                           │                       │
              ┌─────┴─────┐             ┌───────┴──────┐        ┌──────┴──────┐
              │ blog/     │             │ blog/        │        │ index.astro │
              │ index     │             │ [slug].astro │        │ (featured   │
              │ .astro    │             │              │        │  posts)     │
              │           │             │ render(post) │        │             │
              │ Lists all │             │ -> <Content/>│        │             │
              │ posts     │             │ -> headings  │        │             │
              └─────┬─────┘             └──────┬───────┘        └──────┬──────┘
                    │                          │                       │
                    │        props             │   props               │  props
                    ▼                          ▼                       ▼
              ┌───────────┐             ┌────────────┐         ┌────────────┐
              │ BaseLayout│             │ BaseLayout │         │ BaseLayout │
              │  + SEO    │             │  + SEO     │         │  + SEO     │
              │  + Header │             │  + Header  │         │  + Header  │
              │  + Footer │             │  + Footer  │         │  + Footer  │
              └─────┬─────┘             └─────┬──────┘         └─────┬──────┘
                    │                         │                      │
                    ▼                         ▼                      ▼
              ┌───────────┐             ┌────────────┐         ┌────────────┐
              │ Static    │             │ Static     │         │ Static     │
              │ HTML      │             │ HTML       │         │ HTML       │
              │ /blog/    │             │ /blog/slug │         │ /          │
              └───────────┘             └────────────┘         └────────────┘
```

### Client-Side Data Flow (Minimal)

```
                    Browser loads static HTML
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌────────────┐ ┌──────────────────┐
    │ Theme inline │ │ ScrollRev. │ │ ParticleCanvas   │
    │ script (head)│ │ observer   │ │ (client:idle or  │
    │              │ │ (inline)   │ │  client:visible)  │
    │ Reads:       │ │            │ │                   │
    │ localStorage │ │ Watches:   │ │ Reads: nothing    │
    │ media query  │ │ viewport   │ │ Writes: canvas    │
    │              │ │ position   │ │                   │
    │ Writes:      │ │            │ │                   │
    │ html.class   │ │ Writes:    │ │                   │
    │ localStorage │ │ CSS classes│ │                   │
    └──────────────┘ └────────────┘ └──────────────────┘
            │
            │  View Transition navigation
            ▼
    ┌──────────────────┐
    │ astro:after-swap │ --> Re-apply theme class
    │ astro:page-load  │ --> Re-init scroll observers
    └──────────────────┘
```

### Key Data Flows

1. **Content to Page:** Markdown files -> `glob()` loader -> Zod validation -> `getCollection()` in page frontmatter -> props to components -> static HTML. All happens at build time. Zero runtime data fetching.

2. **SEO Prop Cascade:** Page defines `title`/`description` -> passes as props to `BaseLayout` -> BaseLayout passes to `SEO` component -> SEO renders `<meta>`, `<title>`, JSON-LD into `<head>`. Constants file provides defaults.

3. **Theme State:** `localStorage` + system `prefers-color-scheme` -> inline script sets `html.dark` class -> Tailwind `dark:` variants activate. Toggle button updates both localStorage and class. View Transition `astro:after-swap` event re-applies.

4. **Blog Post Rendering:** `getStaticPaths()` calls `getCollection('blog')` -> returns `params.slug` + `props.post` per entry -> page calls `render(post)` to get `<Content />` component + headings -> `<Content />` renders markdown as HTML inside the article layout.

## Scaling Considerations

| Concern | Current Scale (Portfolio) | If Content Grows (100+ posts) | Notes |
|---------|--------------------------|-------------------------------|-------|
| Build time | Sub-second for ~10 pages | Astro 5 Content Layer handles tens of thousands of entries with caching between builds | Not a concern until hundreds of posts |
| Page weight | ~20-50KB per page (static HTML + Tailwind) | Same per page; listing pages may need pagination | Use `paginate()` helper at ~20 posts per page |
| SEO | JSON-LD + OG tags per page | Consider generating sitemap.xml via `@astrojs/sitemap` integration | Add sitemap from Phase 1 |
| Client JS | Near-zero (inline scripts only) | Same unless adding search | Pagefind for client-side search if needed later |
| Images | `<Image />` component for optimization | Same; Sharp handles well | Use `src/` images for optimization, `public/` only for favicon/CNAME |

### Scaling Priorities

1. **First optimization needed:** Pagination on the blog listing page. Once you have more than ~15-20 posts, a single listing page becomes unwieldy. Use Astro's built-in `paginate()` function in `getStaticPaths()`.

2. **Second optimization needed:** Client-side search. At 50+ posts, visitors will want to search by keyword/tag. Pagefind is the standard choice for Astro static sites (runs at build time, generates a search index, ~5KB client bundle).

3. **Third optimization needed:** Image optimization pipeline. If blog posts include many images, ensure all content images are in `src/` (not `public/`) so Astro's Sharp-based `<Image />` component can optimize format, dimensions, and quality at build time.

## Anti-Patterns

### Anti-Pattern 1: Multiple Layout Files for Minor Variations

**What people do:** Create `BlogLayout.astro`, `PageLayout.astro`, `HomeLayout.astro` that all duplicate the HTML shell, head tags, header, and footer.

**Why it's wrong:** Leads to divergent `<head>` content across layouts, missed SEO tags on some pages, and duplicated maintenance burden. When you update the header, you must update it in every layout.

**Do this instead:** One `BaseLayout.astro` with props for customization. Use conditional rendering for minor differences (e.g., `{showHero && <Hero />}`). Compose unique page sections inside the `<slot />`.

### Anti-Pattern 2: Using `src/content/` Directory with Astro 5 Content Layer

**What people do:** Place content files in `src/content/blog/` following the Astro 4 convention, then configure the `glob()` loader to point there.

**Why it's wrong:** While it works, `src/content/` has legacy significance in Astro. The Content Layer API in Astro 5 decoupled the content directory from the config. Using `src/content/` can cause confusion about whether you are using the old or new API, and the legacy system may still try to process files there.

**Do this instead:** Use `src/data/` (or any other directory name) for content files. The `glob()` loader in `src/content.config.ts` explicitly points to wherever your files are. This makes the new API boundary clear.

### Anti-Pattern 3: Framework Islands for Static-Only Interactions

**What people do:** Import React or Svelte components with `client:load` for simple interactions like a theme toggle, mobile menu, or scroll animation.

**Why it's wrong:** Adds 30-80KB+ of framework JavaScript for interactions that need only a few lines of vanilla JS. Breaks Astro's zero-JS-by-default benefit. Increases time-to-interactive.

**Do this instead:** Use Astro components with inline `<script>` tags for simple interactions. The theme toggle, mobile nav, and scroll reveals all work perfectly with vanilla JS. Reserve framework islands for genuinely complex interactive widgets (e.g., a filterable/sortable data table, a rich text editor).

### Anti-Pattern 4: Fetching Data Inside Components Instead of Pages

**What people do:** Import `getCollection()` inside a `BlogCard.astro` component to fetch its own data.

**Why it's wrong:** Breaks the data-down pattern. Components become tightly coupled to the data source. Makes the component unusable in other contexts. Multiple components on a page might independently query the same collection.

**Do this instead:** Fetch data in pages (or `getStaticPaths()`), pass data as props to components. Components are pure renderers -- they receive data and emit HTML.

### Anti-Pattern 5: Skipping `astro:page-load` Re-initialization with View Transitions

**What people do:** Initialize client-side behavior (scroll observers, event listeners) only on initial page load. After a View Transition navigation, those scripts do not re-run, leaving the page broken.

**Why it's wrong:** The `<ClientRouter />` performs a soft DOM swap on navigation. Module scripts only execute once. Without re-initialization, interactive features silently break on the second page.

**Do this instead:** Always wrap initialization logic in an `astro:page-load` event listener. This fires on initial load AND after every View Transition navigation.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages | `withastro/action@v5` GitHub Action, `public/CNAME` for custom domain | Set source to "GitHub Actions" in repo settings, not "Deploy from a branch" |
| Google Analytics | Inline script in BaseLayout `<head>` or Partytown integration | Use Partytown to move analytics off main thread if needed |
| RSS Feed | `@astrojs/rss` integration, generate in `src/pages/rss.xml.ts` | Queries content collections at build time |
| Sitemap | `@astrojs/sitemap` integration in `astro.config.mjs` | Auto-generates from all pages; respects `site` config |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pages <-> Content Collections | `getCollection()`, `getEntry()`, `render()` from `astro:content` | Build-time only. Pages own data fetching, not components |
| Pages <-> BaseLayout | Props (`title`, `description`, `ogImage`, etc.) + `<slot />` for content | Layout never fetches its own data |
| BaseLayout <-> SEO Component | Props cascade from page -> layout -> SEO | SEO component is a pure renderer |
| Theme Script <-> ThemeToggle | Shared `localStorage` key ('theme') + `html.classList` | Both read/write the same storage key; the inline script runs first |
| ScrollReveal <-> View Transitions | `astro:page-load` event | Observer re-initialization after every navigation |
| Content Config <-> Markdown Files | `glob()` loader pattern + Zod schema | Config specifies base directory and file pattern; schema validates frontmatter |

## Suggested Build Order

Based on component dependencies, build in this order:

### Phase 1: Foundation (no visible output depends on later phases)
1. **Project scaffold** -- `astro.config.mjs`, `tsconfig.json`, Tailwind v4 setup
2. **`src/lib/constants.ts`** -- Site metadata, nav links, social URLs (everything else references this)
3. **`src/styles/global.css`** -- Tailwind import, CSS custom properties for theme colors
4. **`src/content.config.ts`** -- Collection definitions and schemas (enables type generation via `astro sync`)

### Phase 2: Layout Shell (all pages depend on this)
5. **`SEO.astro`** -- Meta tags, OG, JSON-LD (needed by BaseLayout)
6. **`Header.astro`** -- Navigation (needed by BaseLayout)
7. **`Footer.astro`** -- Footer content (needed by BaseLayout)
8. **`BaseLayout.astro`** -- Composes SEO + Header + Footer + global CSS + ClientRouter
9. **Theme toggle inline script** -- Add to BaseLayout head (prevents FOIT)

### Phase 3: Content Infrastructure (blog depends on this)
10. **Sample blog post(s)** in `src/data/blog/` -- Needed to test collection queries
11. **`BlogCard.astro`** -- Used by blog listing and home page
12. **`/blog/index.astro`** -- Blog listing page with `getCollection('blog')`
13. **`/blog/[slug].astro`** -- Dynamic post pages with `getStaticPaths()` + `render()`

### Phase 4: Static Pages (independent of content infra)
14. **`/index.astro`** -- Home page (can use placeholder content initially)
15. **`/about.astro`** -- About page
16. **`/projects/index.astro`** -- Projects page with project collection or static data

### Phase 5: Visual Effects (enhances existing pages)
17. **`ThemeToggle.astro`** -- Interactive toggle button (depends on theme script from Phase 2)
18. **`ScrollReveal.astro`** -- Scroll-triggered reveals
19. **`ParticleCanvas.astro`** -- Hero particle effect

### Phase 6: Polish & Deployment
20. **Sitemap** (`@astrojs/sitemap` integration)
21. **RSS feed** (`src/pages/rss.xml.ts`)
22. **GitHub Actions workflow** (`.github/workflows/deploy.yml`)
23. **`public/CNAME`**, `robots.txt`, favicon

**Why this order:**
- Constants and config must exist before anything references them
- BaseLayout must exist before any page can render
- Content collections must be defined before blog pages can query them
- Pages can be built with placeholder content, then enriched with effects
- Deployment is last because it requires a buildable site

## Sources

- [Astro Project Structure](https://docs.astro.build/en/basics/project-structure/) -- Official docs on directory conventions (HIGH confidence)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) -- Content Layer API, loaders, schemas (HIGH confidence)
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- `render()`, `getCollection()`, `getEntry()` (HIGH confidence)
- [Astro Upgrade to v5](https://docs.astro.build/en/guides/upgrade-to/v5/) -- Breaking changes: content.config.ts location, slug->id, render() import, ClientRouter rename (HIGH confidence)
- [Astro Layouts](https://docs.astro.build/en/basics/layouts/) -- Layout composition, props, Markdown layout props (HIGH confidence)
- [Astro Islands](https://docs.astro.build/en/concepts/islands/) -- Partial hydration, client directives (HIGH confidence)
- [Astro Routing](https://docs.astro.build/en/guides/routing/) -- File-based routing, getStaticPaths, dynamic routes (HIGH confidence)
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/) -- ClientRouter, lifecycle events, transition directives (HIGH confidence)
- [Astro Images](https://docs.astro.build/en/guides/images/) -- Image/Picture components, src/ vs public/ (HIGH confidence)
- [Astro Deploy to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/) -- Action, CNAME, site/base config (HIGH confidence)
- [Tailwind CSS v4 Astro Installation](https://tailwindcss.com/docs/installation/framework-guides/astro) -- @tailwindcss/vite plugin setup (HIGH confidence)
- [Astro Dark Mode with Tailwind + View Transitions](https://namoku.dev/blog/darkmode-tailwind-astro/) -- Anti-flicker pattern, astro:after-swap (MEDIUM confidence)
- [Astro SEO Complete Guide](https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/) -- Meta tags, JSON-LD patterns (MEDIUM confidence)

---
*Architecture research for: Astro 5+ portfolio + blog static site*
*Researched: 2026-02-11*
