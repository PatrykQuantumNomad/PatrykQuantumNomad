---
phase: quick-007
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/layouts/Layout.astro
autonomous: true
must_haves:
  truths:
    - "All pages include Content-Security-Policy meta tag with frame-ancestors 'self'"
    - "All pages include Referrer-Policy meta tag"
    - "All pages include Permissions-Policy meta tag restricting unused browser APIs"
    - "Google Fonts still loads correctly (not blocked by CSP)"
    - "Inline scripts and styles used by Astro still function (not blocked by CSP)"
    - "Site builds without errors"
  artifacts:
    - path: "src/layouts/Layout.astro"
      provides: "Security meta tags in HTML head"
      contains: "Content-Security-Policy"
  key_links:
    - from: "src/layouts/Layout.astro"
      to: "all pages"
      via: "shared layout"
      pattern: "meta http-equiv"
---

<objective>
Add security-hardening meta tags to the site's shared layout to address findings from a Nikto security scan.

Purpose: Mitigate clickjacking risk (X-Frame-Options equivalent via CSP frame-ancestors) and add defense-in-depth security headers that are achievable on GitHub Pages (which does not support custom HTTP response headers). Also add Referrer-Policy and Permissions-Policy meta tags for privacy and API restriction.

Output: Updated Layout.astro with security meta tags applied to all pages.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/layouts/Layout.astro
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add security meta tags to Layout.astro</name>
  <files>src/layouts/Layout.astro</files>
  <action>
Add the following meta tags to the `<head>` section of `src/layouts/Layout.astro`, placed immediately after the viewport meta tag (line 65) and before the favicon section. Group them under a clear HTML comment `<!-- Security Headers -->`.

**1. Content-Security-Policy meta tag:**

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" />
```

CSP directive rationale:
- `default-src 'self'` -- baseline: only same-origin resources allowed
- `script-src 'self' 'unsafe-inline'` -- Astro inlines `<script>` tags and the Google Fonts `<link>` uses an inline `onload` handler (`onload="this.onload=null;this.rel='stylesheet'"`). Both require `'unsafe-inline'`. All JS libraries (GSAP, Lenis, vanilla-tilt) are bundled by Astro and served from same origin.
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` -- Astro inlines `<style>` tags (requires `'unsafe-inline'`), and Google Fonts CSS is loaded from `fonts.googleapis.com`
- `font-src 'self' https://fonts.gstatic.com` -- Google Fonts serves font files from `fonts.gstatic.com`
- `img-src 'self' data:` -- all images are same-origin; `data:` allows any base64-encoded inline images or SVG data URIs if used
- `connect-src 'self'` -- no external API calls are made
- `frame-ancestors 'self'` -- THIS IS THE KEY DIRECTIVE: prevents the site from being embedded in iframes on other domains (modern replacement for X-Frame-Options header). This directly addresses the Nikto finding.
- `base-uri 'self'` -- prevents base tag injection attacks
- `form-action 'self'` -- restricts form submissions to same origin

**2. Referrer-Policy meta tag:**

```html
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

This sends the full URL as referrer for same-origin requests (useful for analytics) but only the origin (not full path) for cross-origin requests (privacy).

**3. Permissions-Policy meta tag:**

```html
<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" />
```

Explicitly disables browser APIs the portfolio site does not use. This is defense-in-depth: even if XSS occurs, these APIs cannot be exploited.

**Important notes:**
- Do NOT remove or modify the existing `onload` handler on the Google Fonts link tag -- the CSP allows it via `'unsafe-inline'` in `script-src`.
- Do NOT add `'unsafe-eval'` -- it is not needed and would weaken security.
- The `X-Content-Type-Options: nosniff` header CANNOT be set via meta tags (no browser support). This is a known GitHub Pages limitation. Add a comment noting this:
  ```html
  <!-- Note: X-Content-Type-Options: nosniff cannot be set via meta tags (GitHub Pages limitation) -->
  ```
  </action>
  <verify>
Run `npm run build` to confirm the site builds without errors. Then inspect the built HTML output to confirm the meta tags are present:

```bash
npm run build
grep -c "Content-Security-Policy" dist/index.html
grep -c "referrer" dist/index.html
grep -c "Permissions-Policy" dist/index.html
grep "frame-ancestors" dist/index.html
```

All grep commands should return matches. Also spot-check a blog page:

```bash
grep -c "Content-Security-Policy" dist/blog/index.html
```

This confirms the Layout.astro changes propagate to all pages.
  </verify>
  <done>
- All built HTML pages contain a Content-Security-Policy meta tag with `frame-ancestors 'self'` (addresses Nikto X-Frame-Options finding)
- All pages contain Referrer-Policy and Permissions-Policy meta tags
- CSP allows Google Fonts (fonts.googleapis.com for CSS, fonts.gstatic.com for font files)
- CSP allows Astro's inline scripts and styles via 'unsafe-inline'
- Site builds successfully with zero errors
- A comment documents the X-Content-Type-Options limitation
  </done>
</task>

<task type="auto">
  <name>Task 2: Dev server smoke test</name>
  <files>src/layouts/Layout.astro</files>
  <action>
After the build succeeds, run `npx astro check` (if available) or `npm run build` again to confirm TypeScript and Astro compilation pass cleanly.

Then do a quick visual validation: start the dev server, curl the homepage, and verify:
1. The CSP meta tag is present in the response HTML
2. No CSP errors appear in the server output
3. The page structure is intact (header, main, footer all present)

```bash
npm run build 2>&1 | tail -20
```

If the build shows any warnings related to the new meta tags, investigate and fix.
  </action>
  <verify>
```bash
npm run build 2>&1 | grep -i "error\|warning" || echo "Clean build"
```

Build must complete with no errors. Warnings unrelated to security tags are acceptable.
  </verify>
  <done>
- Build completes cleanly
- No CSP-related errors in build output
- Security meta tags verified in built output across multiple pages (index, blog, about)
  </done>
</task>

</tasks>

<verification>
1. `npm run build` completes with exit code 0
2. `grep "frame-ancestors" dist/index.html` returns a match
3. `grep "Content-Security-Policy" dist/index.html` returns a match
4. `grep "Permissions-Policy" dist/index.html` returns a match
5. `grep "referrer" dist/index.html` shows `strict-origin-when-cross-origin`
6. `grep "Content-Security-Policy" dist/blog/index.html` returns a match (confirms all pages)
7. Google Fonts domains appear in CSP: `fonts.googleapis.com` in style-src, `fonts.gstatic.com` in font-src
</verification>

<success_criteria>
- Nikto X-Frame-Options finding addressed via CSP `frame-ancestors 'self'` directive
- GitHub Pages limitation for X-Content-Type-Options documented in code comment
- All pages include CSP, Referrer-Policy, and Permissions-Policy meta tags
- No functionality regression: Google Fonts load, inline scripts run, animations work
- Clean build with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/007-add-security-headers-via-csp-meta-tag/007-SUMMARY.md`
</output>
