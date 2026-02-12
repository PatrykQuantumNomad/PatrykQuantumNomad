# Codebase Structure

**Analysis Date:** 2026-02-12

## Directory Layout

```
PatrykQuantumNomad/
├── .claude/                    # Claude Code configuration and custom commands
├── .planning/                  # Project planning documents (phases, research)
├── public/                     # Static assets served as-is
│   ├── images/                 # Public images (not imported)
│   ├── CNAME                   # GitHub Pages domain config
│   └── robots.txt              # Search engine directives
├── src/                        # Source code
│   ├── assets/                 # Imported assets (optimized by Astro)
│   ├── components/             # Reusable UI components
│   ├── data/                   # Static data and content
│   ├── layouts/                # Page layout wrappers
│   ├── lib/                    # Client-side utilities
│   ├── pages/                  # File-based routing
│   ├── styles/                 # Global CSS
│   └── content.config.ts       # Content collections schema
├── astro.config.mjs            # Astro framework configuration
├── tailwind.config.mjs         # Tailwind CSS configuration
├── package.json                # Dependencies and scripts
└── README.md                   # GitHub profile README
```

## Directory Purposes

**`.claude/`:**
- Purpose: Claude Code agent definitions, hooks, and custom commands
- Contains: Agent YAML files, command scripts, GSD workflow templates
- Key files: `.claude/settings.json`, `.claude/commands/gsd/`

**`.planning/`:**
- Purpose: Development roadmap, phase plans, and codebase documentation
- Contains: Milestone definitions, phase execution plans, research notes
- Key files: `.planning/milestones/`, `.planning/phases/`, `.planning/codebase/`

**`public/`:**
- Purpose: Static files served directly without processing
- Contains: Domain config, SEO files, images not requiring optimization
- Key files: `public/CNAME`, `public/robots.txt`, `public/images/`

**`src/assets/`:**
- Purpose: Images and media that are imported and optimized by Astro
- Contains: Hero images, profile photos, illustrations
- Key files: `src/assets/images/meandbatman.jpg`, `src/assets/images/hulk.png`

**`src/components/`:**
- Purpose: Reusable Astro components (UI, animations, structured data)
- Contains: Header, Footer, BlogCard, animation components, JSON-LD components
- Key files: `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/animations/`

**`src/components/animations/`:**
- Purpose: Client-side animation effects (GSAP-based)
- Contains: CustomCursor, TiltCard, MagneticButton, SplitText, TextScramble, WordReveal, FloatingOrbs, TimelineDrawLine
- Key files: `src/components/animations/CustomCursor.astro`, `src/components/animations/TiltCard.astro`

**`src/components/blog/`:**
- Purpose: Blog-specific UI components
- Contains: Blog listing components, author info, reading progress
- Key files: Components in this directory are blog-focused

**`src/data/`:**
- Purpose: Static data and blog content in Markdown/MDX
- Contains: Site configuration, project listings, blog posts
- Key files: `src/data/site.ts`, `src/data/projects.ts`, `src/data/blog/*.md`

**`src/layouts/`:**
- Purpose: Page layout templates with shared structure
- Contains: Main layout wrapper with header, footer, SEO, animations
- Key files: `src/layouts/Layout.astro`

**`src/lib/`:**
- Purpose: Client-side utilities and animation lifecycle management
- Contains: GSAP scroll animations, Lenis smooth scroll, animation cleanup
- Key files: `src/lib/scroll-animations.ts`, `src/lib/smooth-scroll.ts`, `src/lib/animation-lifecycle.ts`, `src/lib/og-image.ts`

**`src/pages/`:**
- Purpose: File-based routing (each file becomes a route)
- Contains: Index page, blog routes, projects, about, contact
- Key files: `src/pages/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/projects/index.astro`

**`src/styles/`:**
- Purpose: Global CSS with theme system
- Contains: CSS custom properties, global styles, dark/light mode
- Key files: `src/styles/global.css`

## Key File Locations

**Entry Points:**
- `src/pages/index.astro`: Homepage with hero, skills, latest posts, CTA
- `src/pages/blog/index.astro`: Blog listing page
- `src/pages/blog/[slug].astro`: Individual blog post dynamic route
- `src/pages/projects/index.astro`: Projects portfolio page
- `src/pages/about.astro`: About page with biography and timeline
- `src/pages/contact.astro`: Contact page with form and social links

**Configuration:**
- `astro.config.mjs`: Astro build config, integrations, plugins
- `tailwind.config.mjs`: Tailwind CSS theme customization
- `src/content.config.ts`: Content collections schema (blog posts)
- `package.json`: NPM dependencies and build scripts
- `remark-reading-time.mjs`: Custom remark plugin for reading time

**Core Logic:**
- `src/data/site.ts`: Site metadata and configuration constants
- `src/data/projects.ts`: Project portfolio data with categories
- `src/lib/scroll-animations.ts`: GSAP ScrollTrigger initialization
- `src/lib/smooth-scroll.ts`: Lenis smooth scroll setup
- `src/lib/animation-lifecycle.ts`: Animation cleanup on navigation

**Testing:**
- Not detected (no test files present)

**SEO & Metadata:**
- `src/components/SEOHead.astro`: Meta tags, Open Graph, Twitter Cards
- `src/components/PersonJsonLd.astro`: Person structured data
- `src/components/BlogPostingJsonLd.astro`: Blog post structured data
- `src/pages/rss.xml.ts`: RSS feed generation
- `src/pages/llms.txt.ts`: LLM context file for AI crawlers

## Naming Conventions

**Files:**
- `.astro` files: PascalCase for components (`Header.astro`, `BlogCard.astro`), kebab-case for pages (`[slug].astro`)
- `.ts` files: kebab-case (`scroll-animations.ts`, `animation-lifecycle.ts`)
- Data files: kebab-case (`site.ts`, `projects.ts`)
- Markdown blog posts: kebab-case in `src/data/blog/`

**Directories:**
- kebab-case for multi-word directories (`blog/`, `animations/`, `open-graph/`)
- Single-word directories when possible (`lib/`, `data/`, `pages/`)

**Components:**
- PascalCase component names match file names
- Animation components descriptive (`CustomCursor`, `MagneticButton`, `TiltCard`)
- Structured data components end in `JsonLd` (`PersonJsonLd`, `BlogPostingJsonLd`)

**Data Attributes:**
- Animation triggers use `data-` prefix (`data-reveal`, `data-tilt`, `data-magnetic`, `data-word-reveal`)
- Directional reveals use values (`data-reveal="left"`, `data-reveal="right"`, `data-reveal="up"`)

## Where to Add New Code

**New Page:**
- Primary code: `src/pages/{page-name}.astro`
- Tests: Not applicable (no test infrastructure)
- SEO: Add meta props to `<Layout>` component
- Navigation: Update `navLinks` array in `src/components/Header.astro`

**New Blog Post:**
- Implementation: `src/data/blog/{post-slug}.md` or `.mdx`
- Schema: Already defined in `src/content.config.ts`
- Frontmatter: `title`, `description`, `publishedDate`, `tags`, `draft`, optional `externalUrl` and `source`

**New Component:**
- Implementation: `src/components/{ComponentName}.astro`
- Animation component: `src/components/animations/{AnimationName}.astro`
- Blog-specific: `src/components/blog/{ComponentName}.astro`
- Import into: Layout or specific pages as needed

**New Animation Effect:**
- Implementation: `src/components/animations/{EffectName}.astro` or add to `src/lib/scroll-animations.ts`
- Pattern: Use `data-` attribute for declarative triggers
- Lifecycle: Ensure cleanup in `src/lib/animation-lifecycle.ts` if using ScrollTrigger

**Utilities:**
- Shared helpers: `src/lib/{utility-name}.ts`
- Client-side only: Must be imported in `<script>` tags, not in Astro frontmatter
- Build-time: Can be imported in frontmatter

**Static Data:**
- Configuration: `src/data/{data-name}.ts`
- Export as `const` with TypeScript types
- Import in components or pages as needed

**Styling:**
- Global styles: Add to `src/styles/global.css`
- Theme colors: Use CSS custom properties defined in `global.css`
- Tailwind utilities: Extend in `tailwind.config.mjs`
- Component styles: Use `<style>` blocks in `.astro` files (scoped by default)

## Special Directories

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

**`dist/`:**
- Purpose: Build output for deployment
- Generated: Yes (via `npm run build`)
- Committed: No (in `.gitignore`)

**`.astro/`:**
- Purpose: Astro build cache and content collection types
- Generated: Yes (during development and build)
- Committed: No (in `.gitignore`)

**`.github/workflows/`:**
- Purpose: GitHub Actions CI/CD pipelines
- Generated: No (manually created)
- Committed: Yes

**`src/data/blog/`:**
- Purpose: Blog post content (Markdown/MDX files)
- Generated: No (manually authored)
- Committed: Yes

**`src/assets/images/`:**
- Purpose: Imported images optimized by Astro
- Generated: No (manually added)
- Committed: Yes

**`public/images/`:**
- Purpose: Static images served as-is
- Generated: No (manually added)
- Committed: Yes

## Import Patterns

**Astro Component Imports:**
```astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
```

**Astro Built-in APIs:**
```astro
import { getCollection } from 'astro:content';
import { Image } from 'astro:assets';
```

**Data Imports:**
```astro
import { siteConfig } from '../data/site';
import { projects } from '../data/projects';
```

**Asset Imports:**
```astro
import heroImg from '../assets/images/meandbatman.jpg';
```

**Client-Side Library Imports (in `<script>` tags only):**
```typescript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSmoothScroll } from '../lib/smooth-scroll';
```

## Page Organization

**Route Structure:**
- `/` → `src/pages/index.astro`
- `/blog/` → `src/pages/blog/index.astro`
- `/blog/{slug}/` → `src/pages/blog/[slug].astro`
- `/blog/tags/{tag}/` → `src/pages/blog/tags/[tag].astro`
- `/projects/` → `src/pages/projects/index.astro`
- `/about/` → `src/pages/about.astro`
- `/contact/` → `src/pages/contact.astro`
- `/rss.xml` → `src/pages/rss.xml.ts`
- `/llms.txt` → `src/pages/llms.txt.ts`
- `/open-graph/blog/{slug}.png` → `src/pages/open-graph/blog/[slug].png.ts`

**Dynamic Routes:**
- Blog posts: `[slug].astro` uses `getStaticPaths()` to generate routes from content collection
- Tag pages: `tags/[tag].astro` generates routes for each unique tag

---

*Structure analysis: 2026-02-12*
