# Phase 114: Cheatsheet - Research

**Researched:** 2026-04-12
**Domain:** SVG cheatsheet content updates + Astro static page creation + SEO structured data
**Confidence:** HIGH

## Summary

Phase 114 requires two distinct work streams: (1) updating the content in two existing SVG cheatsheet files to reflect all commands/shortcuts documented in the finalized guide chapters from Phase 113, and (2) creating a new dedicated Astro page at `/guides/claude-code/cheatsheet/` with inline SVG rendering, download buttons, OG image, and JSON-LD structured data.

The SVG files are hand-crafted (not generated) at 1600x1000px with a four-column layout using JetBrains Mono and DM Sans fonts. Both the interactive (dark theme) and print (light theme) versions share identical content but use different color palettes. The SVGs are located in `public/images/cheatsheet/` and are served as static assets. The page will follow established patterns from the existing guide infrastructure (Layout.astro, GuideJsonLd.astro, BreadcrumbJsonLd.astro, generateGuideOgImage).

**Primary recommendation:** Update both SVG files in parallel (they share the same content structure, just different colors), then create a standalone `.astro` page at `src/pages/guides/claude-code/cheatsheet.astro` using the base Layout (not GuideLayout, since this is not a chapter page). Add the OG image endpoint, reuse existing JSON-LD components, and add a Resources section to the landing page.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site generator | Already used; page is a `.astro` file |
| Tailwind CSS | via @astrojs/tailwind ^6.0.2 | Styling for the cheatsheet page | Already used across all pages |
| satori + sharp | Already in og-image.ts | OG image generation | Existing `generateGuideOgImage()` function |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GuideJsonLd.astro | N/A (component) | TechArticle JSON-LD | Reuse for cheatsheet page structured data |
| BreadcrumbJsonLd.astro | N/A (component) | Breadcrumb JSON-LD | Standard breadcrumb pattern |
| Layout.astro | N/A (layout) | Base page layout with SEO, header, footer | Use for cheatsheet page (not GuideLayout) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GuideLayout | Layout.astro | GuideLayout adds sidebar navigation for chapter pages; cheatsheet is a standalone resource page, so the base Layout is more appropriate. The FAQ page at `/guides/fastapi-production/faq/` uses Layout.astro as the precedent for non-chapter guide sub-pages. |
| Hand-editing SVG | Programmatic SVG generation | SVGs are already hand-crafted with precise positioning. Switching to programmatic generation would be a larger refactor with no immediate benefit. Continue hand-editing. |

## Architecture Patterns

### File Structure for New Files
```
src/pages/guides/claude-code/
├── index.astro              # Existing landing page (modify: add Resources section)
├── [slug].astro             # Existing chapter template
└── cheatsheet.astro         # NEW: dedicated cheatsheet page

src/pages/open-graph/guides/claude-code/
├── [slug].png.ts            # Existing chapter OG
└── cheatsheet.png.ts        # NEW: cheatsheet OG image endpoint

public/images/cheatsheet/
├── claude-code-cheatsheet.svg        # MODIFY: add missing commands
└── claude-code-cheatsheet-print.svg  # MODIFY: add missing commands (light theme)
```

### Pattern 1: Standalone Sub-Page Under Guide (Precedent: FAQ page)
**What:** A non-chapter page nested under a guide route, using Layout.astro instead of GuideLayout.astro
**When to use:** Pages that are part of the guide ecosystem but are not numbered chapters (cheatsheet, FAQ, glossary)
**Example from codebase:**
```
src/pages/guides/fastapi-production/faq.astro
```
This page uses `Layout` directly, includes `BreadcrumbJsonLd` and `FAQPageJsonLd`, and has its own breadcrumb navigation. The cheatsheet page should follow this exact pattern.

### Pattern 2: OG Image Endpoint (Precedent: claude-code.png.ts)
**What:** A standalone `.png.ts` file that generates and caches an OG image at build time
**When to use:** Any page that needs a custom OG image
**Example from codebase:**
```typescript
// src/pages/open-graph/guides/claude-code.png.ts
import { generateGuideOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/guides/og-cache';
```
The cheatsheet OG image should use `generateGuideOgImage()` with a label like "Cheatsheet" as the chapter label.

### Pattern 3: Inline SVG Rendering
**What:** Embedding SVG content directly in the page for interactive viewing, while also providing download links to the raw files
**When to use:** When SVG needs to be viewable inline AND downloadable as a standalone file
**Approach:** Use an `<img>` tag or `<object>` tag for inline rendering (pointing to the public asset path), plus `<a href="..." download>` for the download buttons. Since the SVGs live in `public/images/cheatsheet/`, they are directly accessible at `/images/cheatsheet/claude-code-cheatsheet.svg`.

### Anti-Patterns to Avoid
- **Inlining the full SVG source into the Astro template:** The SVG files are 495 and 487 lines respectively. Inlining would bloat the page HTML. Instead, reference them via `<img>` or `<object>` tags pointing to the public asset URL.
- **Using `<iframe>` for SVG display:** Iframes add unnecessary complexity and CSP issues. Use `<img>` (simpler, cached) or `<object>` (supports interactivity if needed).
- **Modifying SVG viewBox or dimensions:** Both SVGs are carefully laid out at 1600x1000. Do not change the viewBox; only add/modify content elements within the existing grid.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image generation | Custom canvas/image generation | `generateGuideOgImage()` from `src/lib/og-image.ts` | Already handles fonts, caching, branding |
| OG image caching | Custom cache logic | `getOrGenerateOgImage()` from `src/lib/guides/og-cache.ts` | MD5 hash-based, handles cache directory creation |
| JSON-LD structured data | Custom JSON-LD script | `GuideJsonLd.astro` + `BreadcrumbJsonLd.astro` | Established components with correct schema.org types |
| Breadcrumb navigation | Custom breadcrumb HTML | Copy pattern from `faq.astro` | Consistent nav styling across guide sub-pages |
| SVG download | Custom download endpoint | HTML `<a>` with `download` attribute | SVGs are static files in `public/`; browsers handle download natively |

**Key insight:** Every infrastructure piece needed for the page already exists in the codebase. The cheatsheet page is essentially a composition of existing patterns, not new infrastructure.

## Common Pitfalls

### Pitfall 1: SVG Color Mismatch Between Interactive and Print Versions
**What goes wrong:** Editing only one SVG and forgetting the other, or using the wrong color palette
**Why it happens:** The two SVGs have identical content but completely different color schemes (dark bg with light text vs white bg with dark text)
**How to avoid:** Always edit both files in the same task. Use the existing color mapping:
- Interactive dark theme: bg `#0c0c14`, text `#c8c8da`/`#7a7a90`, accent `#e8845c`
- Print light theme: bg `#ffffff`, text `#2a2a34`/`#505060`, accent `#c45a30`
- Section colors are also different between themes (e.g., teal is `#6ec8c8` in dark, `#1a8a8a` in light)
**Warning signs:** Visual diff between the two SVGs showing different commands

### Pitfall 2: SVG Layout Overflow
**What goes wrong:** Adding new commands causes content to overflow the 1000px height or overlap with adjacent columns
**Why it happens:** The SVG has a fixed 1600x1000 viewBox with tight column spacing (columns at x=48, x=440, x=800, x=1160)
**How to avoid:** When adding new entries, check remaining vertical space in each section. If space is tight, consider condensing existing entries or reducing font sizes for less-critical items. The gap between the last content and the footer line at y=960 is the available space.
**Warning signs:** Elements with y-coordinates above 840 (the last content area boundary) or below 960 (the footer line)

### Pitfall 3: Missing `download` Attribute on Download Links
**What goes wrong:** Clicking "Download" opens the SVG in the browser tab instead of triggering a file download
**Why it happens:** Without the `download` attribute, browsers render SVGs inline
**How to avoid:** Use `<a href="/images/cheatsheet/claude-code-cheatsheet.svg" download="claude-code-cheatsheet.svg">` with both the `download` attribute and a filename suggestion

### Pitfall 4: CSP Blocking External Font Loading in SVGs
**What goes wrong:** SVGs reference Google Fonts via `@import url(...)` which may be blocked by CSP
**Why it happens:** The existing CSP in Layout.astro allows `https://fonts.googleapis.com` for style-src, so this should work. But if the SVG is loaded via `<img>`, the browser blocks all external resource loading (including fonts).
**How to avoid:** When SVGs are rendered via `<img>` tags, external fonts will NOT load. This is fine because JetBrains Mono and DM Sans are system-fallback-friendly. For pixel-perfect rendering, use `<object>` tags instead of `<img>`, which allows external resource loading. Alternatively, accept the fallback font rendering in `<img>` mode (the existing SVGs already work this way on the current site).

### Pitfall 5: Landing Page Link Placement
**What goes wrong:** Adding the cheatsheet link to the wrong section of the landing page
**Why it happens:** The landing page currently has only a "Chapters" section with no "Resources" section
**How to avoid:** Add a new "Resources" section after the chapter grid. The requirement says "linked from the guide landing page Resources section" -- this section needs to be created, not just a link added somewhere.

## SVG Content Gap Analysis

### Commands/Shortcuts Currently in SVGs
Based on full audit of both SVG files:

**CORE 5:** Ctrl+C (stop), Ctrl+R (history), Opt+T (thinking), Shift+Tab (cycle modes: Normal/Auto/Plan), /compact
**RECOVERY:** Esc Esc (rewind), /rewind, /clear, Ctrl+D (exit)
**WHILE CODING:** ! cmd, Ctrl+B (background), /review, /security-review, /todos, /bashes, /sandbox, /pr-comments
**WHILE EXPLORING:** Ctrl+O (verbose), /context, /cost, /model, @file, /resume
**MANAGING SESSION:** /init, /memory, # note, /config, /permissions, /add-dir, /export
**EXTENDING:** /agents, /mcp, /hooks, /plugin, /ide, custom commands box (.claude/commands, ~/.claude/commands, .claude/skills)
**Ctrl+R WORKFLOW:** search/filter/edit/run/cancel flow
**INPUT:** \ Enter (newline), Opt+Enter, Shift+Enter, Ctrl+V (paste image)
**STATUS & ADMIN:** /status, /usage, /doctor, /login, /logout, /help, /bug, /output-style, /vim, Ctrl+L, /terminal-setup, /install-github-app, /release-notes, /statusline, /privacy-settings
**VIM MODE:** Full insert/move/edit/undo sections
**COMMAND COST:** Safe/Modifies/Destructive/Exit categories
**INTENT -> ACTION:** Decision tree mapping intents to commands
**CONCEPT MAP:** Control Flow / Agent Behavior / Context Mgmt / Shell Escape / Knowledge / Extensions / Recovery

### New Commands/Features to ADD (from Phase 113 chapter updates)
1. **`/effort`** - Set reasoning effort level (low/medium/high) -- from Ch3 (models-and-costs.mdx)
   - Best fit: MANAGING SESSION section or WHILE EXPLORING section (it modifies agent behavior)
   - Also add to COMMAND COST box under "MODIFIES" category

2. **`/remote-control`** - Start remote control server -- from Ch5 (remote-and-headless.mdx)
   - Best fit: STATUS & ADMIN section

3. **`/loop`** - Schedule recurring tasks -- from Ch5 (remote-and-headless.mdx) and Ch7 (custom-skills.mdx)
   - Best fit: EXTENDING section or MANAGING SESSION section

4. **Auto Mode** - Already partially present (Shift+Tab cycles include "Auto"), but the INTENT -> ACTION section should mention "Auto Mode" more prominently if needed. Currently shows "Hands-free mode -> Shift+Tab -> Auto" which is adequate.

5. **`--bare` flag** - Skip project config in headless mode -- from Ch4 (environment.mdx) and Ch5
   - This is a CLI flag, not an interactive command. May not belong in the cheatsheet (which is titled "Interactive Mode"). Consider omitting or adding a small footnote.

6. **`initialPrompt`** - Agent auto-start -- from Ch9 (worktrees.mdx) and Ch10 (agent-teams.mdx)
   - This is an AGENT.md frontmatter field, not an interactive command. Does not belong in the interactive mode cheatsheet.

7. **PermissionDenied hook event** - from Ch8 (hooks.mdx)
   - This is a hooks concept, not an interactive command. Does not belong in the cheatsheet.

8. **24 lifecycle events** - from Ch8 (hooks.mdx)
   - Concept, not interactive command. The /hooks command is already present.

### Placement Decision
The cheatsheet SVG title says "Interactive Mode" -- it documents keyboard shortcuts and slash commands available during an interactive session. CLI flags (--bare), AGENT.md frontmatter fields (initialPrompt), and hook events (PermissionDenied) are NOT interactive session commands and should NOT be added.

Commands to add:
- `/effort` -- add to MANAGING SESSION or WHILE EXPLORING (it changes agent behavior mid-session)
- `/remote-control` -- add to STATUS & ADMIN
- `/loop` -- add to EXTENDING section (it's a skill, not a built-in slash command, but it's commonly used)

Also update:
- Version tag from "v5" to current if applicable
- CONCEPT MAP: verify /agents is listed under EXTENSIONS (already is)
- COMMAND COST: add /effort under MODIFIES

## Code Examples

### Cheatsheet Page Structure (Astro)
```astro
---
import Layout from '../../../layouts/Layout.astro';
import GuideJsonLd from '../../../components/guide/GuideJsonLd.astro';
import BreadcrumbJsonLd from '../../../components/BreadcrumbJsonLd.astro';

const ogImageURL = new URL('/open-graph/guides/claude-code/cheatsheet.png', Astro.site).toString();
---

<Layout
  title="Claude Code Cheatsheet | Interactive Mode Shortcuts & Commands"
  description="..."
  ogImage={ogImageURL}
  ogImageAlt="Claude Code Cheatsheet"
>
  <GuideJsonLd ... />
  <BreadcrumbJsonLd crumbs={[
    { name: 'Home', url: 'https://patrykgolabek.dev/' },
    { name: 'Guides', url: 'https://patrykgolabek.dev/guides/' },
    { name: 'Claude Code Guide', url: 'https://patrykgolabek.dev/guides/claude-code/' },
    { name: 'Cheatsheet', url: 'https://patrykgolabek.dev/guides/claude-code/cheatsheet/' },
  ]} />
  <!-- breadcrumb nav, title, SVG display, download buttons -->
</Layout>
```

### OG Image Endpoint
```typescript
// src/pages/open-graph/guides/claude-code/cheatsheet.png.ts
import type { APIRoute } from 'astro';
import { generateGuideOgImage } from '../../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../../lib/guides/og-cache';

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    'Claude Code Cheatsheet',
    'Every keyboard shortcut and slash command for Claude Code interactive mode',
    () => generateGuideOgImage(
      'Claude Code Cheatsheet',
      'Every keyboard shortcut and slash command for Claude Code interactive mode',
      'Cheatsheet',
    ),
  );
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
```

### Download Button Pattern
```html
<a
  href="/images/cheatsheet/claude-code-cheatsheet.svg"
  download="claude-code-cheatsheet.svg"
  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border ..."
>
  Download Interactive (SVG)
</a>
```

### Landing Page Resources Section Addition
```astro
<!-- After the chapter grid closing </div> -->
<h2 class="text-2xl font-heading font-bold mt-16 mb-8">Resources</h2>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
  <a href="/guides/claude-code/cheatsheet/" class="group rounded-lg border ...">
    <h3>Cheatsheet</h3>
    <p>Every keyboard shortcut and slash command on one page</p>
  </a>
</div>
```

## SVG Editing Guide

### Adding a New Keycap Entry (Interactive Dark Theme)
```xml
<!-- Template for a new keycap command entry -->
<g transform="translate(X_POS, Y_POS)">
  <rect x="0" y="0" width="KEYCAP_WIDTH" height="24" rx="5"
        fill="url(#keycap)" stroke="#333348" stroke-width="0.4"
        filter="url(#keyShadow)"/>
  <text x="CENTER_X" y="16"
        font-family="'JetBrains Mono', monospace" font-size="11"
        fill="SECTION_COLOR" font-weight="600" text-anchor="middle"
        style="white-space: pre;">COMMAND_TEXT</text>
  <text x="AFTER_KEYCAP" y="16"
        font-family="'DM Sans', sans-serif" font-size="12"
        fill="#7a7a90" style="white-space: pre;">Description</text>
</g>
```

### Section Color Reference
| Section | Interactive (Dark) | Print (Light) |
|---------|-------------------|---------------|
| CORE 5 | #e8845c | #c45a30 |
| RECOVERY | #e05555 | #c03030 |
| WHILE CODING | #6ec8c8 | #1a8a8a |
| WHILE EXPLORING | #a088d0 | #6848a8 |
| MANAGING SESSION | #c8a84e | #8a7820 |
| EXTENDING | #c06888 | #983868 |
| STATUS & ADMIN | #555568 | #808090 (text) |
| VIM MODE | #c06888 | #983868 |
| INTENT -> ACTION | #e8845c (header) | #c45a30 (header) |

### Key Dimensions
- Full canvas: 1600 x 1000
- Column dividers: x=420 (col1|col2), x=780 (col2|col3), x=1140 (col3|col4)
- Content margins: 48px left, 1552px right
- Footer line: y=960
- Maximum content y: ~840 (before CONCEPT MAP in col4 extends to ~620)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No cheatsheet page | Static SVGs in public/ only | Pre-phase 114 | SVGs exist but have no dedicated page, no SEO, no download UX |
| Manual SVG editing | Manual SVG editing (unchanged) | N/A | Both SVGs are hand-crafted; this is appropriate for a fixed-format cheatsheet |

## Open Questions

1. **Astro trailingSlash and the route**
   - What we know: `trailingSlash: 'always'` in astro.config.mjs. File at `src/pages/guides/claude-code/cheatsheet.astro` will produce `/guides/claude-code/cheatsheet/`
   - What's unclear: Nothing -- this is confirmed behavior
   - Recommendation: Create `cheatsheet.astro` (not `cheatsheet/index.astro`) to match the pattern used by `faq.astro`

2. **SVG version tag**
   - What we know: Both SVGs show "v5" in the top-right corner
   - What's unclear: Whether the version should be updated (it references the Claude Code major version)
   - Recommendation: Keep "v5" unless the guide chapters indicate a version bump. The cheatsheet tracks Claude Code version, not the guide version.

3. **Which JSON-LD @type for cheatsheet page**
   - What we know: Chapter pages use `TechArticle`, landing page uses `CollectionPage`
   - What's unclear: What's best for a reference/cheatsheet page
   - Recommendation: Use `TechArticle` with `proficiencyLevel: "Beginner"` since the cheatsheet is a technical reference document. The existing `GuideJsonLd.astro` component supports this when `isLanding` is false.

## Sources

### Primary (HIGH confidence)
- Codebase analysis of `src/pages/guides/claude-code/index.astro` -- landing page structure
- Codebase analysis of `src/pages/guides/fastapi-production/faq.astro` -- standalone sub-page pattern
- Codebase analysis of `src/pages/open-graph/guides/claude-code/[slug].png.ts` -- OG image pattern
- Codebase analysis of `src/components/guide/GuideJsonLd.astro` -- JSON-LD component API
- Codebase analysis of `src/components/BreadcrumbJsonLd.astro` -- breadcrumb component API
- Codebase analysis of `src/lib/og-image.ts` -- `generateGuideOgImage()` function signature
- Codebase analysis of `src/lib/guides/og-cache.ts` -- caching mechanism
- Full audit of both SVG cheatsheet files (495 and 487 lines respectively)
- Phase 113 verification report confirming all chapter updates

### Secondary (MEDIUM confidence)
- Astro documentation on static page generation and `trailingSlash: 'always'` behavior
- HTML `download` attribute behavior for SVG files across browsers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries/components already exist in codebase, no new dependencies
- Architecture: HIGH - following established patterns (faq.astro, [slug].png.ts, GuideJsonLd)
- SVG content gaps: HIGH - full audit of both SVGs against all 14 chapter contents
- Pitfalls: HIGH - identified from actual codebase constraints (CSP, viewBox, color schemes)

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable -- codebase patterns unlikely to change)
