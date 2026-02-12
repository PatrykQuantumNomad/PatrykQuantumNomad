---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/favicon.svg
  - public/favicon-32.png
  - public/favicon-16.png
  - public/apple-touch-icon.png
  - public/site.webmanifest
  - src/layouts/Layout.astro
autonomous: true
must_haves:
  truths:
    - "Browser tab shows a branded PG favicon instead of default globe icon"
    - "Apple devices show a branded touch icon when bookmarking"
    - "SVG favicon renders at any resolution with accent color branding"
    - "ICO/PNG fallback works in older browsers"
  artifacts:
    - path: "public/favicon.svg"
      provides: "SVG favicon with PG initials"
      contains: "PG"
    - path: "public/apple-touch-icon.png"
      provides: "180x180 PNG for Apple devices"
    - path: "public/site.webmanifest"
      provides: "Web app manifest with icon references"
    - path: "src/layouts/Layout.astro"
      provides: "Favicon link tags in head"
      contains: "favicon"
  key_links:
    - from: "src/layouts/Layout.astro"
      to: "public/favicon.svg"
      via: "link rel=icon tag"
      pattern: "rel=\"icon\".*favicon\\.svg"
    - from: "src/layouts/Layout.astro"
      to: "public/site.webmanifest"
      via: "link rel=manifest tag"
      pattern: "rel=\"manifest\""
---

<objective>
Create a branded favicon set for patrykgolabek.dev using the "PG" initials and the site's accent color (#c44b20).

Purpose: The site currently has no favicon, showing a generic browser icon. A branded favicon improves professional appearance, brand recognition in browser tabs, and bookmarks.
Output: SVG favicon, PNG fallbacks, Apple touch icon, web manifest, and link tags in Layout.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/layouts/Layout.astro
@src/styles/global.css
@src/data/site.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create SVG favicon and generate PNG variants</name>
  <files>public/favicon.svg, public/favicon-32.png, public/favicon-16.png, public/apple-touch-icon.png</files>
  <action>
Create an SVG favicon at `public/favicon.svg` with these specifications:

- **Viewbox:** 0 0 32 32
- **Background:** Rounded rectangle (rx=6) filled with `#c44b20` (the site's accent color)
- **Text:** "PG" initials in white, bold, sans-serif font
  - Use a clean geometric sans-serif: `font-family="Arial, Helvetica, sans-serif"` for maximum cross-browser SVG text rendering
  - `font-weight="700"`, `font-size="16"`, centered with `text-anchor="middle"` and `dominant-baseline="central"`
  - Position at x="16" y="17" (slightly below center looks visually centered due to cap height)
  - `letter-spacing="-0.5"` to keep the two letters tightly paired

The SVG should be minimal — no unnecessary groups, metadata, or namespaces. Just the svg element, a rect, and a text element.

Then use a Node.js script (run once, then delete) to generate the PNG variants from the SVG:

```js
// scripts/generate-favicons.mjs
import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('public/favicon.svg');
await sharp(svg).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(svg).resize(16, 16).png().toFile('public/favicon-16.png');
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('Favicons generated');
```

Sharp is already a project dependency (used for OG image generation). Run the script with `node scripts/generate-favicons.mjs` from the project root, then delete the script file.

Also create `public/site.webmanifest`:
```json
{
  "name": "Patryk Golabek",
  "short_name": "PG",
  "icons": [
    { "src": "/favicon-32.png", "sizes": "32x32", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }
  ],
  "theme_color": "#c44b20",
  "background_color": "#fffaf7",
  "display": "standalone"
}
```
  </action>
  <verify>
Confirm all files exist: `ls -la public/favicon.svg public/favicon-32.png public/favicon-16.png public/apple-touch-icon.png public/site.webmanifest`

Verify the SVG contains "PG" text and the accent color: `grep -q "PG" public/favicon.svg && grep -q "c44b20" public/favicon.svg && echo "OK"`

Verify PNG files are valid and correct sizes: `npx sharp-cli --input public/favicon-32.png --info 2>/dev/null || file public/favicon-32.png`
  </verify>
  <done>Four favicon files (SVG, 32px PNG, 16px PNG, 180px PNG) and a web manifest exist in public/ with correct dimensions and branding</done>
</task>

<task type="auto">
  <name>Task 2: Add favicon link tags to Layout head</name>
  <files>src/layouts/Layout.astro</files>
  <action>
In `src/layouts/Layout.astro`, add favicon link tags inside the `<head>` element, immediately after the `<meta name="generator" ...>` line and before the `<ClientRouter />` line.

Add these tags:
```html
<!-- Favicon -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#c44b20" />
```

The order matters: SVG first (modern browsers prefer it), then PNG fallbacks by size, then Apple touch icon, manifest, and theme-color.

Do NOT add a `<link rel="shortcut icon" href="/favicon.ico">` — there is no ICO file and modern browsers do not need one when SVG + PNG are provided.
  </action>
  <verify>
Run `npm run build` to confirm the site builds successfully with the new favicon tags.

Check the built HTML contains favicon references: `grep -c "favicon" dist/index.html` should return a count >= 3.
  </verify>
  <done>Layout.astro contains all favicon link tags. Site builds cleanly. Every page served includes favicon references in the head.</done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds with no errors
2. Built HTML files contain favicon link tags in head
3. All favicon files present in public/ and included in dist/ output
4. SVG favicon displays "PG" on an orange (#c44b20) rounded rectangle background
</verification>

<success_criteria>
- Browser tab shows "PG" favicon with the site's accent color when visiting any page
- Apple touch icon exists at 180x180 for bookmark/home screen use
- Web manifest provides theme color and icon metadata
- No build regressions — site builds and deploys cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/001-create-favicon-for-the-website/001-SUMMARY.md`
</output>
