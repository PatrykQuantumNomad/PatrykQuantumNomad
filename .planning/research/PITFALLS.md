# Pitfalls Research

**Domain:** Astro 5+ portfolio/blog site with GitHub Pages deployment, custom domain, rich animations
**Researched:** 2026-02-11
**Confidence:** HIGH (verified via official docs, GitHub issues, and multiple community sources)

## Critical Pitfalls

### Pitfall 1: CNAME File Deleted on Every Deploy

**What goes wrong:**
Custom domain (patrykgolabek.dev) stops working after every GitHub Actions deployment. GitHub Pages forgets the custom domain configuration, reverting to `username.github.io`. The site goes down or redirects to the wrong URL.

**Why it happens:**
The `withastro/action@v3` GitHub Action rebuilds and deploys from scratch each time. If the `CNAME` file is not in the `public/` directory of your source repository, it gets wiped from the deployed branch on every push. GitHub Pages reads the CNAME file from the deployed artifact to know which custom domain to serve.

**How to avoid:**
1. Create `public/CNAME` containing exactly one line: `patrykgolabek.dev`
2. Commit this file to the repository -- it will be copied to `dist/` during build
3. Set `site: 'https://patrykgolabek.dev'` in `astro.config.mjs`
4. Do NOT set `base` -- with a custom domain, base must be omitted (it is only for subdirectory deployments like `username.github.io/repo-name`)
5. Verify after first deploy: check Settings > Pages shows patrykgolabek.dev as custom domain

**Warning signs:**
- Site accessible at `username.github.io` but not at custom domain after deploy
- GitHub Pages settings show custom domain field is blank after a push
- SSL certificate errors on the custom domain

**Phase to address:**
Phase 1 (Project scaffold / deployment pipeline). This must be correct from the very first deploy.

---

### Pitfall 2: Dark Mode Flash of Unstyled Content (FOUC)

**What goes wrong:**
Users who prefer dark mode see a blinding white flash on every page load and on every page navigation (with View Transitions). The page renders in light mode first, then snaps to dark mode once JavaScript executes. This is jarring, unprofessional, and especially noticeable on the "Quantum Explorer" dark theme.

**Why it happens:**
Two separate failure modes:
1. **Initial load FOUC:** Theme JavaScript runs after the browser's first paint, so the `dark` class is not on `<html>` when CSS first renders
2. **View Transitions FOUC:** Astro's View Transitions swap DOM elements, which resets the `<html>` class list, stripping the `dark` class during navigation

**How to avoid:**
Place an inline script in the `<head>` using the `is:inline` directive (prevents Astro from bundling/deferring it). This script must:
- Read `localStorage.theme` preference
- Fall back to `window.matchMedia('(prefers-color-scheme: dark)')` for OS preference
- Apply the `dark` class to `document.documentElement` immediately
- Register event listeners for both `astro:page-load` and `astro:after-swap` to reapply after View Transitions

```astro
<script is:inline>
  function applyTheme() {
    const theme = localStorage.getItem('theme')
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
  applyTheme();
  document.addEventListener('astro:page-load', applyTheme);
  document.addEventListener('astro:after-swap', applyTheme);
</script>
```

**Warning signs:**
- Any visible color flash when navigating between pages
- Testing only in light mode and never toggling to dark mode during dev
- Not testing View Transitions with dark mode active

**Phase to address:**
Phase 2 (Layout / theme system). Must be implemented when the base layout and theme toggle are first created, not bolted on later.

---

### Pitfall 3: Particle Animations Destroying Lighthouse Performance and Battery Life

**What goes wrong:**
Canvas-based particle effects (the "Quantum Explorer" theme) tank Lighthouse Performance score below 90. On mobile devices, continuous `requestAnimationFrame` loops drain battery even when the tab is backgrounded or the user has scrolled past the animated section. Total Blocking Time (TBT) spikes because particle initialization blocks the main thread.

**Why it happens:**
- Particle libraries like tsParticles ship large bundles (full bundle is 200KB+) that increase Time to Interactive
- Continuous animation loops consume CPU even when not visible on screen
- Canvas redraws on every frame regardless of whether the animation is in the viewport
- No built-in mechanism to pause when the user scrolls away or switches tabs
- Mobile devices with limited GPU/CPU budget struggle with high particle counts

**How to avoid:**
1. **Lazy-load the particle system:** Use `client:visible` or Intersection Observer to only initialize particles when the hero section enters the viewport
2. **Use a slim bundle:** tsParticles offers `loadSlim` (much smaller than `loadFull`). Better yet, write a minimal custom Canvas particle system (~50-100 lines) for simple effects
3. **Pause when not visible:** Use `document.visibilitychange` event to cancel `requestAnimationFrame` when the tab is hidden. Use Intersection Observer to pause when scrolled out of view
4. **Respect `prefers-reduced-motion`:** Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and either disable particles entirely or show a static background. This is a WCAG 2.1 requirement (SC 2.3.3)
5. **Cap particle count on mobile:** Detect viewport width and reduce particle count by 50-75% on screens under 768px
6. **Avoid layout shift:** Give the canvas container explicit dimensions so it does not cause CLS when it loads

**Warning signs:**
- Lighthouse Performance below 90 on mobile
- TBT exceeding 200ms
- Fans spinning on laptops when viewing the page
- Mobile devices getting warm
- Users with vestibular disorders experiencing discomfort

**Phase to address:**
Phase 3 (Hero section / animations). Must be designed with performance constraints from the start. Do not implement the full particle system first and optimize later -- build with the constraints baked in.

---

### Pitfall 4: Content Collections Silent Failures with Glob Loader

**What goes wrong:**
Blog posts exist in the filesystem but do not appear on the site. The content collection returns an empty array. No build error is thrown. The developer wastes hours debugging what appears to be a rendering issue when it is actually a content loading issue.

**Why it happens:**
Astro 5's `glob()` loader has historically weak validation:
- The `base` path resolves relative to the **project root**, not the config file. Writing `base: './content/blog'` does not mean "relative to `src/content.config.ts`" -- it means relative to the project root
- An invalid `base` directory produces an empty collection **without any error**
- Glob patterns that match zero files produce only a vague warning: "The collection does not exist or is empty"
- The config file location changed from `src/content/config.ts` (Astro 4) to `src/content.config.ts` (Astro 5) -- using the old location silently fails

**How to avoid:**
1. Place the config at `src/content.config.ts` (not `src/content/config.ts`)
2. Use absolute-looking paths from project root: `base: 'src/content/blog'` not `base: './content/blog'`
3. After any schema change, run `npx astro sync` to regenerate types
4. Add a smoke test: after build, verify that the blog index page contains at least one post title
5. Use `z.coerce.date()` instead of `z.date()` for date fields -- raw strings from frontmatter will fail strict date validation
6. Test the content collection query in isolation before building page templates around it

**Warning signs:**
- Blog index page renders but shows "No posts found" with no error
- TypeScript errors about missing `astro:content` module (run `npx astro sync`)
- Collection name uses singular form ("blog" is fine, but some edge cases with singular/plural can cause issues with image integration)

**Phase to address:**
Phase 4 (Blog / content collections). Define the schema and verify content loading works before building any blog UI.

---

### Pitfall 5: Sitemap and SEO Metadata Silently Generating Wrong URLs

**What goes wrong:**
The sitemap-index.xml generates URLs pointing to the wrong domain or missing the base path. Open Graph tags use relative URLs that social media crawlers cannot resolve. Google Search Console reports the sitemap as having errors. Pages are not indexed despite being live.

**Why it happens:**
- `@astrojs/sitemap` requires the `site` field in `astro.config.mjs` to be set and must begin with `http://` or `https://`. If missing, the build silently succeeds but generates no sitemap
- If `site` includes a trailing path (like `https://example.com/blog/`), the sitemap URLs get mangled -- subdirectory is either doubled or dropped
- Open Graph `og:url` and `og:image` tags must be absolute URLs. Using relative paths like `/images/og.png` causes social sharing previews to break
- RSS feed URLs follow the same pattern -- relative links in feed items break feed readers
- JSON-LD structured data must also use absolute URLs for `url`, `image`, and `logo` fields

**How to avoid:**
1. Set `site: 'https://patrykgolabek.dev'` (no trailing slash, no path) in `astro.config.mjs`
2. Use `Astro.site` to construct absolute URLs in templates: `new URL('/og-image.png', Astro.site).href`
3. After build, validate `dist/sitemap-index.xml` contains correct absolute URLs
4. Test Open Graph tags with Facebook Sharing Debugger or opengraph.xyz
5. Validate JSON-LD with Google's Rich Results Test and schema.org validator
6. Verify RSS feed in a feed reader after deploy
7. Submit sitemap to Google Search Console after first deploy

**Warning signs:**
- Social media shares show no preview image or wrong title
- Google Search Console reports sitemap errors
- `dist/sitemap-index.xml` is missing or contains `undefined` in URLs
- RSS feed items have broken links

**Phase to address:**
Phase 5 (SEO). But the `site` configuration must be correct from Phase 1, since other integrations depend on it.

---

### Pitfall 6: Sharp Image Service Failing in CI but Working Locally

**What goes wrong:**
The Astro build succeeds locally but fails in GitHub Actions with `Could not find Sharp` errors. Image optimization breaks, causing the entire build to fail and blocking deployments.

**Why it happens:**
- Sharp is a native Node.js module with platform-specific binary dependencies
- Astro includes Sharp by default but relies on it being resolvable at build time
- Different Node.js versions between local and CI environments cause binary incompatibility
- pnpm's strict dependency resolution can fail to hoist Sharp correctly
- The lockfile may not include platform-specific binaries for the CI environment (Linux) when developed on macOS

**How to avoid:**
1. Pin Node.js version in the GitHub Actions workflow and locally (use `.nvmrc` with the same version)
2. If using pnpm, add `shamefully-hoist=true` to `.npmrc` or explicitly install sharp: `pnpm add sharp`
3. Always commit the lockfile (`package-lock.json`, `pnpm-lock.yaml`)
4. For a static site with pre-optimized images, consider using `image.service: { entrypoint: 'astro/assets/services/noop' }` to skip runtime optimization entirely and handle images manually
5. Add `"engines": { "node": ">=20.3.0" }` to `package.json`

**Warning signs:**
- Build works locally but fails in CI
- Error messages mentioning Sharp, libvips, or native module compilation
- Images display as broken links after deployment

**Phase to address:**
Phase 1 (Project scaffold / CI pipeline). Verify image handling works in CI on the very first deploy.

---

### Pitfall 7: Tailwind CSS v4 Integration Breaking Styles

**What goes wrong:**
After installing Tailwind CSS, styles are missing, utility classes do not apply, or `@apply` directives fail. Component-scoped `<style>` blocks in `.astro` files cannot access Tailwind theme variables.

**Why it happens:**
- The `@astrojs/tailwind` integration is **deprecated** for Tailwind v4. Using it with v4 causes silent failures
- Tailwind v4 uses `@import "tailwindcss"` instead of the v3 `@tailwind base; @tailwind utilities; @tailwind components;` directives
- Stylesheet bundling in Astro means that CSS modules and `<style>` blocks in Astro/Vue/Svelte components are bundled separately and do **not** have access to Tailwind theme variables
- `@apply` behavior changed in v4 and may not work as expected without explicit configuration
- Arbitrary values syntax changed -- some square bracket patterns from v3 break in v4

**How to avoid:**
1. Use the Vite plugin approach, **not** `@astrojs/tailwind`: install `@tailwindcss/vite` and add it to Vite plugins in `astro.config.mjs`
2. Ensure Astro >= 5.2 (first version with official Tailwind v4 support)
3. Use `@import "tailwindcss"` in your main CSS file, not `@tailwind` directives
4. For component `<style>` blocks that need Tailwind, use `@reference "../../styles/global.css"` or apply classes directly in HTML instead of `@apply`
5. Test the upgrade with `npx @tailwindcss/upgrade` tool before manual migration

**Warning signs:**
- Styles appear in dev but are missing in production build
- Console warnings about unknown utility classes
- `@apply` throwing errors or being silently ignored
- Theme colors not resolving in component-scoped styles

**Phase to address:**
Phase 1 (Project scaffold). Tailwind must be correctly configured from the start, not retrofitted.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `loadFull` for tsParticles | All effects available immediately | 200KB+ bundle, poor mobile performance | Never for a portfolio targeting Lighthouse 90+ |
| Hardcoding `site` URL in templates | Quick Open Graph tags | Breaks when domain changes, duplicated strings everywhere | Never -- always use `Astro.site` |
| Skipping `astro sync` after schema changes | Saves 2 seconds | TypeScript errors pile up, IDE autocomplete breaks, silent runtime failures | Never |
| Inline styles instead of Tailwind classes | Fast prototyping | Inconsistent theming, dark mode doesn't apply, unmaintainable | Only in throwaway prototypes |
| Skipping `prefers-reduced-motion` support | Faster initial development | Accessibility violation (WCAG 2.1 SC 2.3.3), excludes users with vestibular disorders | Never |
| Using `@astrojs/tailwind` with Tailwind v4 | Familiar setup from v3 projects | Silent style failures, deprecated integration | Never with Tailwind v4 |
| Committing without testing the build | Ship faster | Broken deploys, custom domain resets, missing content | Never for production deployments |

## Integration Gotchas

Common mistakes when connecting to external services and integrations.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages + Custom Domain | Setting `base: '/repo-name'` alongside a custom domain | With a custom domain, remove `base` entirely. Base is only for subdirectory deployments |
| `@astrojs/sitemap` | Forgetting to set `site` in astro.config.mjs | Always set `site: 'https://patrykgolabek.dev'` -- sitemap silently generates nothing without it |
| `@astrojs/rss` | Using relative URLs in feed item links | Use `new URL(post.slug, Astro.site).href` for absolute URLs in all feed items |
| Google Search Console | Submitting sitemap before DNS/SSL is fully propagated | Wait 24-72 hours after custom domain setup for DNS and SSL propagation before submitting sitemap |
| View Transitions + 404 page | Using View Transitions on the 404 page | View Transitions on a 404 page can break client-side navigation when users try to navigate away. Keep 404.astro simple with no View Transitions |
| GitHub Actions + withastro/action | Not committing the lockfile | The action detects your package manager by reading the lockfile. No lockfile = build failure |
| Tailwind v4 + Astro components | Using `@apply` in component `<style>` blocks | Component-scoped styles are bundled separately and lack access to Tailwind context. Use utility classes in HTML or `@reference` |

## Performance Traps

Patterns that work during development but fail at production quality.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unoptimized web fonts | FOUT (flash of unstyled text), CLS spike of 0.1+ | Self-host fonts, use `font-display: swap`, preload critical fonts, use `size-adjust` on fallback | First real Lighthouse audit |
| Canvas animation never pausing | Battery drain on mobile, CPU usage stays high when tab is in background | Use `document.visibilitychange` to pause, Intersection Observer to stop when off-screen | Mobile users, background tabs |
| Full tsParticles bundle | 200KB+ JS download, TBT exceeds 200ms | Use `loadSlim` or write custom minimal particle system (< 5KB) | Lighthouse mobile audit |
| Uncompressed images in content | LCP exceeds 2.5s, bandwidth waste | Use Astro's `<Image>` component or pre-optimize all images. Set explicit width/height to prevent CLS | Any page with hero images or blog post images |
| Synchronous font loading | Render-blocking resource, LCP delay | Use `<link rel="preload">` for critical fonts, `font-display: optional` for non-critical | Lighthouse Performance audit, slow 3G test |
| No image dimensions specified | CLS from images loading and pushing content | Always set `width` and `height` on `<img>` or use Astro's `<Image>` which handles this | CLS audit, any page with images above the fold |

## Security Mistakes

Domain-specific security issues for a static portfolio/blog site.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing draft posts in static output | Unpublished content visible in dist/ and indexed by search engines | Filter drafts in content collection queries: `filter: (entry) => !entry.data.draft` AND verify dist/ does not contain draft HTML files |
| Missing Content Security Policy headers | XSS vectors if embedding third-party scripts or analytics | Add CSP headers via `_headers` file or meta tags. For GitHub Pages, use `<meta http-equiv="Content-Security-Policy">` since you cannot set HTTP headers |
| API keys in client-side code | Exposed secrets in browser DevTools | Never use `PUBLIC_` prefixed env vars for sensitive keys. For a static site, handle API calls at build time only |
| Missing `rel="noopener noreferrer"` on external links | Tab nabbing vulnerability on external links | Add `rel="noopener noreferrer"` to all `target="_blank"` links, or use Astro's built-in link handling |

## UX Pitfalls

Common user experience mistakes in portfolio/blog sites with rich animations.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Particle animations with no reduced-motion support | Users with vestibular disorders experience dizziness/nausea | Check `prefers-reduced-motion: reduce` and show a static gradient or still image instead |
| Dark mode toggle without system preference detection | User's OS says "dark mode" but site loads in light mode | Default to OS preference via `matchMedia`, only override when user explicitly toggles |
| Animation-heavy hero blocking content visibility | Users wait 3+ seconds to see actual content (bio, projects) | Content must be visible immediately; animations are progressive enhancement, not gates |
| No loading state for dynamic blog list | Blank space while content loads (though this is minimal with static output) | For static output, ensure all content is pre-rendered. Use skeleton states only if using client-side data fetching |
| Dark mode that forgets preference on navigation | Annoying re-flash on every page if localStorage check is missing after View Transitions | Use the `astro:after-swap` event handler pattern described in Pitfall 2 |
| Animations that run continuously in the background | Battery drain, fan noise, laptop overheating | Pause all Canvas/requestAnimationFrame animations when the page is not visible or the section is off-screen |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Custom domain:** Site loads at patrykgolabek.dev -- but verify HTTPS is enforced (Settings > Pages > "Enforce HTTPS" checkbox), and both `www.patrykgolabek.dev` and `patrykgolabek.dev` resolve correctly
- [ ] **Sitemap:** `sitemap-index.xml` exists -- but verify all URLs are absolute, use the custom domain (not github.io), and include all blog posts
- [ ] **Open Graph:** Meta tags are present -- but verify `og:image` uses an absolute URL and the image actually renders when shared on LinkedIn/Twitter (test with sharing debugger tools)
- [ ] **RSS feed:** Feed endpoint exists -- but verify feed items contain full absolute URLs and the feed validates in a feed reader
- [ ] **Dark mode:** Toggle works -- but verify no FOUC on first load, no FOUC during View Transitions, system preference is respected as default, and preference persists across sessions
- [ ] **404 page:** Custom 404.astro exists -- but verify `dist/404.html` is generated and GitHub Pages actually serves it on invalid routes (test a nonsense URL on the live site)
- [ ] **Blog posts:** Posts render -- but verify draft posts are excluded from production build, dates parse correctly, and the collection schema validates all required frontmatter fields
- [ ] **Particle animations:** Particles render on desktop -- but verify they pause when tab is hidden, reduce on mobile, respect `prefers-reduced-motion`, and do not cause CLS
- [ ] **Lighthouse scores:** Desktop scores are 90+ -- but verify **mobile** scores are also 90+, which is harder to achieve with canvas animations and web fonts
- [ ] **JSON-LD structured data:** `<script type="application/ld+json">` exists -- but verify it passes Google's Rich Results Test and the schema.org validator without errors
- [ ] **Content Security Policy:** CSP meta tag is in the head -- but verify `unsafe-inline` is scoped correctly for the inline dark-mode script and `unsafe-eval` is not present

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CNAME deleted on deploy | LOW | Add `public/CNAME`, push, wait for GitHub to re-provision SSL (up to 1 hour). Re-trigger by removing and re-adding domain in Settings > Pages |
| Dark mode FOUC | LOW | Add the `is:inline` script to the base layout `<head>`. No structural changes needed |
| Particle animations tanking Lighthouse | MEDIUM | Replace tsParticles with a custom minimal canvas system. Requires rewriting the animation but not the page structure |
| Content collections returning empty | LOW | Fix `base` path in `src/content.config.ts`, run `npx astro sync`, rebuild |
| Wrong sitemap URLs | LOW | Fix `site` in `astro.config.mjs`, rebuild, resubmit to Search Console |
| Sharp CI failure | LOW | Pin Node.js version in workflow and add explicit `sharp` dependency. Or switch to `noop` image service for fully static approach |
| Tailwind v4 styles broken | MEDIUM | Migrate from `@astrojs/tailwind` to `@tailwindcss/vite` plugin. Requires updating imports and possibly rewriting `@apply` usage |
| SSL not provisioning for custom domain | LOW | Remove domain from Settings > Pages, save, re-add, save. Check for conflicting DNS records (extra A/AAAA records, missing CAA for letsencrypt.org). Wait 24-72 hours |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CNAME deleted on deploy | Phase 1: Scaffold + CI | Custom domain resolves after a push to main. Automated: check `dist/CNAME` exists in build output |
| Tailwind v4 misconfiguration | Phase 1: Scaffold | Utility classes render in both dev and production build. No console warnings |
| Sharp CI failure | Phase 1: Scaffold + CI | First GitHub Actions build succeeds with image processing |
| Dark mode FOUC | Phase 2: Layout + Theme | No visible flash when loading any page in dark mode. Test with View Transitions active |
| Particle performance | Phase 3: Hero + Animations | Lighthouse mobile Performance >= 90. TBT < 200ms. Animation pauses when tab is hidden |
| Reduced motion accessibility | Phase 3: Hero + Animations | With `prefers-reduced-motion: reduce` enabled, no animations play. Static fallback visible |
| Content collections empty | Phase 4: Blog + Content | Blog index shows all non-draft posts. `astro sync` completes without errors |
| Sitemap wrong URLs | Phase 5: SEO | All URLs in sitemap-index.xml use `https://patrykgolabek.dev`. No `undefined` values |
| Open Graph / social sharing | Phase 5: SEO | Facebook Sharing Debugger shows correct title, description, and image for all page types |
| JSON-LD validation | Phase 5: SEO | Google Rich Results Test passes for homepage, blog posts, and about page |
| RSS feed broken links | Phase 5: SEO | Feed validates in W3C Feed Validation Service. All links are absolute |
| Draft posts in production | Phase 4: Blog + Content | Build output (`dist/`) contains no HTML files for draft posts |

## Sources

- [Astro Deploy to GitHub Pages -- Official Docs](https://docs.astro.build/en/guides/deploy/github/) (HIGH confidence)
- [GitHub Community Discussion: Custom Domain Deleted After Deploy](https://github.com/orgs/community/discussions/22366) (HIGH confidence)
- [GitHub Community Discussion: Custom Domain Deleted by Workflow](https://github.com/orgs/community/discussions/159544) (HIGH confidence)
- [Astro Content Collections -- Official Docs](https://docs.astro.build/en/guides/content-collections/) (HIGH confidence)
- [Glob Loader Weak Validation -- GitHub Issue #12795](https://github.com/withastro/astro/issues/12795) (HIGH confidence)
- [Content Config Loading Error -- GitHub Issue #14317](https://github.com/withastro/astro/issues/14317) (HIGH confidence)
- [FOUC Dark Mode with Astro Transitions and Tailwind -- simonporter.co.uk](https://www.simonporter.co.uk/posts/what-the-fouc-astro-transitions-and-tailwind/) (MEDIUM confidence)
- [Dark Mode in Astro with Tailwind: Preventing FOUC -- danielnewton.dev](https://www.danielnewton.dev/blog/dark-mode-astro-tailwind-fouc/) (MEDIUM confidence)
- [View Transitions Dark Mode Flash -- GitHub Issue #8711](https://github.com/withastro/astro/issues/8711) (HIGH confidence)
- [Astro Sitemap Integration -- Official Docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/) (HIGH confidence)
- [Sitemap URLs Wrong with Base Directory -- GitHub Issue #13315](https://github.com/withastro/astro/issues/13315) (HIGH confidence)
- [Sharp Missing in Docker/CI -- GitHub Issue #14531](https://github.com/withastro/astro/issues/14531) (HIGH confidence)
- [Astro 5.2 Tailwind v4 Support -- astro.build](https://astro.build/blog/astro-520/) (HIGH confidence)
- [Tailwind v4 Astro Integration Issue -- GitHub Issue #18055](https://github.com/tailwindlabs/tailwindcss/issues/18055) (HIGH confidence)
- [Canvas Optimization -- MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) (HIGH confidence)
- [requestAnimationFrame Battery Drain -- cytoscape/cytoscape.js Issue #2657](https://github.com/cytoscape/cytoscape.js/issues/2657) (MEDIUM confidence)
- [WCAG 2.1 SC 2.3.3 Animation from Interactions -- W3C](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) (HIGH confidence)
- [GitHub Pages HTTPS Troubleshooting -- GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) (HIGH confidence)
- [Astro Build Failures Guide -- eastondev.com](https://eastondev.com/blog/en/posts/dev/20251203-astro-build-failures-guide/) (MEDIUM confidence)
- [Fixing Font Layout Shifts -- DebugBear](https://www.debugbear.com/blog/web-font-layout-shift) (MEDIUM confidence)

---
*Pitfalls research for: Astro 5+ portfolio/blog on GitHub Pages with custom domain, rich animations, and full SEO*
*Researched: 2026-02-11*
