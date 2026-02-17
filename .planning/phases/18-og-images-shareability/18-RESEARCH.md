# Phase 18: OG Images & Shareability - Research

**Researched:** 2026-02-17
**Domain:** Satori OG image generation, SVG-to-PNG client-side conversion, Web Share API, Clipboard API
**Confidence:** HIGH

## Summary

Phase 18 adds two capabilities to the Beauty Index: (1) build-time OG images for social sharing on `/beauty-index/` and all 25 `/beauty-index/[slug]/` pages, and (2) client-side interactivity for downloading radar charts as PNG files and sharing/copying them. The project already has a working Satori + Sharp OG image pipeline (`src/lib/og-image.ts`) and a pure TypeScript `generateRadarSvgString()` function in `src/lib/beauty-index/radar-math.ts` that was explicitly designed for Satori embedding. No new server-side dependencies are needed.

The OG image generation follows the established pattern: Astro API routes at `src/pages/open-graph/` use `getStaticPaths` to generate one PNG per page at build time, with Satori converting an HTML/CSS layout (expressed as a plain object tree) into SVG, then Sharp converting SVG to PNG. The radar chart SVG must be embedded as a `data:image/svg+xml;base64,...` `<img>` source inside the Satori layout because Satori cannot render SVG elements directly -- it only accepts HTML elements styled with CSS flexbox. This approach was validated in Phase 16 research and the `generateRadarSvgString()` function already exists for this purpose.

The client-side shareability features (download-as-image, Web Share API, copy-to-clipboard) require a small amount of client-side JavaScript. The radar chart is rendered as inline SVG at build time, so the download flow is: serialize SVG DOM node with `XMLSerializer`, draw onto an off-screen canvas, then export via `canvas.toBlob()`. The Web Share API (`navigator.share()` with files) has 92%+ global coverage but notably lacks Firefox desktop support, making the copy-to-clipboard fallback (`navigator.clipboard.write()` with `ClipboardItem`) essential. No external libraries are needed for any of these operations.

**Primary recommendation:** Create a new OG image generator function (`generateBeautyIndexOgImage`) in `src/lib/og-image.ts` that accepts language data and renders a branded layout with an embedded radar chart SVG. Wire it into new API routes using the existing `getStaticPaths` pattern. For client-side sharing, add a single Astro `<script>` component that handles SVG-to-canvas-to-PNG conversion, download, Web Share API (mobile), and clipboard copy (desktop).

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Satori | 0.19.2 | HTML/CSS to SVG conversion for OG images | Already in use for blog OG images in `src/lib/og-image.ts` |
| Sharp | 0.34.5 | SVG to PNG rasterization | Already in use, pipeline proven |
| Astro | ^5.3.0 | API routes, `getStaticPaths`, static image generation | Already in use, pattern established in `src/pages/open-graph/` |
| TypeScript | 5.9.3 | Type safety for OG layout objects, share utilities | Already configured |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `radar-math.ts` | (project) | `generateRadarSvgString()` for Satori-compatible SVG | OG image radar chart embedding |
| `tiers.ts` | (project) | Tier colors, tier lookup | OG image color theming |
| `dimensions.ts` | (project) | Dimension labels for radar chart axes | OG image radar labels |
| `schema.ts` | (project) | `totalScore()`, `dimensionScores()`, `Language` type | OG image data access |
| `astro:content` | (bundled) | `getCollection('languages')` for route generation | `getStaticPaths` in OG API routes |

### Browser APIs (Zero Dependencies)
| API | Purpose | Coverage | Fallback |
|-----|---------|----------|----------|
| `XMLSerializer` | Serialize inline SVG to string | 99%+ all browsers | None needed |
| `HTMLCanvasElement.toBlob()` | Convert canvas to PNG blob | 98%+ | `toDataURL()` polyfill |
| `navigator.share()` (Web Share API) | Native OS share sheet on mobile | 92%+ (no Firefox desktop) | Copy-to-clipboard fallback |
| `navigator.clipboard.write()` (Clipboard API) | Copy PNG image to clipboard | Baseline 2024 (all modern browsers) | Text URL fallback |
| `navigator.canShare()` | Feature detection for file sharing | Same as Web Share API | Guard before calling `share()` |

### No New Dependencies Needed
| Instead of | Why Not | Use Instead |
|------------|---------|-------------|
| html-to-image (npm) | Adds 15KB dependency for one SVG-to-PNG conversion | Vanilla `XMLSerializer` + `canvas.toBlob()` (~30 lines) |
| dom-to-image (npm) | Unmaintained, uses same `<foreignObject>` technique | Same vanilla approach, simpler |
| satori-html | Template literal to Satori VNode; project already uses plain objects | Plain object VNode trees (established pattern in `og-image.ts`) |
| @resvg/resvg-js | Alternative SVG-to-PNG rasterizer | Sharp (already installed, already working) |

**Installation:**
```bash
# No new packages needed. All tools are already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    og-image.ts                    # [MODIFY] Add Beauty Index OG generators
    beauty-index/
      radar-math.ts               # [EXISTS] generateRadarSvgString() ready for Satori
      tiers.ts                    # [EXISTS] Tier colors for OG theming
      dimensions.ts               # [EXISTS] Dimension labels for radar axes
      schema.ts                   # [EXISTS] Language type, totalScore(), dimensionScores()
  pages/
    open-graph/
      [...slug].png.ts            # [MODIFY] Add beauty-index routes alongside blog routes
      beauty-index.png.ts         # [NEW] Overview page OG image
      beauty-index/
        [slug].png.ts             # [NEW] Per-language OG images (25 pages)
    beauty-index/
      index.astro                 # [MODIFY] Add ogImage prop to Layout
      [slug].astro                # [MODIFY] Add ogImage prop to Layout
  components/
    beauty-index/
      ShareControls.astro         # [NEW] Download/share/copy buttons + client-side script
  assets/
    fonts/
      Inter-Regular.woff          # [EXISTS] Used by Satori
      SpaceGrotesk-Bold.woff      # [EXISTS] Used by Satori
```

### Pattern 1: Beauty Index OG Image Generator (SHARE-01)
**What:** A new function in `og-image.ts` that generates branded OG images featuring a radar chart and score summary.
**When to use:** Build-time OG image generation for all Beauty Index pages.
**Example:**
```typescript
// src/lib/og-image.ts -- new export
import { generateRadarSvgString } from './beauty-index/radar-math';
import { getTierColor } from './beauty-index/tiers';
import { DIMENSIONS } from './beauty-index/dimensions';
import { totalScore, dimensionScores, type Language } from './beauty-index/schema';

export async function generateLanguageOgImage(language: Language): Promise<Buffer> {
  await loadFonts();

  const scores = dimensionScores(language);
  const tierColor = getTierColor(language.tier);
  const labels = DIMENSIONS.map(d => `${d.symbol} ${d.shortName}`);
  const total = totalScore(language);

  // Generate radar chart SVG and encode as base64 data URI
  const radarSvg = generateRadarSvgString(300, scores, tierColor, 0.35, labels);
  const radarDataUri = `data:image/svg+xml;base64,${Buffer.from(radarSvg).toString('base64')}`;

  // Satori layout as plain object VNode tree (established pattern)
  const layout = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#faf8f5',
        fontFamily: 'Inter',
        position: 'relative',
      },
      children: [
        // Accent bar at top
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', top: 0, left: 0,
              width: '1200px', height: '6px',
              backgroundImage: 'linear-gradient(to right, #c44b20, #e8734a)',
            },
          },
        },
        // Left column: text content
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center',
              width: '700px', padding: '60px 40px 60px 56px', gap: '16px',
            },
            children: [
              // "The Beauty Index" label
              {
                type: 'div',
                props: {
                  style: { fontSize: '18px', color: '#c44b20', fontWeight: 700 },
                  children: 'The Beauty Index',
                },
              },
              // Language name
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Space Grotesk', fontWeight: 700,
                    fontSize: '56px', color: '#1a1a2e', lineHeight: 1.15,
                  },
                  children: language.name,
                },
              },
              // Score + tier
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: '12px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '32px', fontWeight: 700,
                          color: tierColor,
                        },
                        children: `${total}/60`,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '16px', color: '#ffffff',
                          backgroundColor: tierColor,
                          borderRadius: '20px', padding: '4px 16px',
                        },
                        children: language.tier.charAt(0).toUpperCase() + language.tier.slice(1),
                      },
                    },
                  ],
                },
              },
              // Character sketch (truncated)
              {
                type: 'div',
                props: {
                  style: { fontSize: '18px', color: '#555566', lineHeight: 1.5 },
                  children: truncate(language.characterSketch, 120),
                },
              },
            ],
          },
        },
        // Right column: radar chart
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '500px', height: '630px',
            },
            children: [
              {
                type: 'img',
                props: {
                  src: radarDataUri,
                  width: 360,
                  height: 360,
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(layout as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: interFont!, weight: 400, style: 'normal' },
      { name: 'Space Grotesk', data: spaceGroteskFont!, weight: 700, style: 'normal' },
    ],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}
```

### Pattern 2: OG Image API Route for Language Pages (SHARE-01)
**What:** Astro API route using `getStaticPaths` to generate one OG PNG per language.
**When to use:** Build-time static generation of all 25 language OG images.
**Example:**
```typescript
// src/pages/open-graph/beauty-index/[slug].png.ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateLanguageOgImage } from '../../../lib/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
  const languages = await getCollection('languages');
  return languages.map((entry) => ({
    params: { slug: entry.data.id },
    props: { language: entry.data },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await generateLanguageOgImage(props.language);
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Pattern 3: Client-Side SVG-to-PNG Download (SHARE-02)
**What:** Convert inline SVG radar chart to downloadable PNG using canvas.
**When to use:** "Download as Image" button on language detail pages.
**Example:**
```typescript
// Client-side script in ShareControls.astro
function downloadRadarAsPng(svgElement: SVGSVGElement, filename: string) {
  // 1. Serialize SVG to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  // 2. Create blob and object URL
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // 3. Draw onto canvas at 2x resolution for crisp PNG
  const canvas = document.createElement('canvas');
  const scale = 2;
  const width = svgElement.width.baseVal.value || 300;
  const height = svgElement.height.baseVal.value || 300;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  const img = new Image();
  img.onload = () => {
    // Fill white background (SVG has transparent bg)
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    // 4. Trigger download via toBlob
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const downloadUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }, 'image/png');
  };
  img.src = url;
}
```

### Pattern 4: Web Share API with Fallback (SHARE-03, SHARE-04)
**What:** Progressive enhancement: native share on mobile, clipboard copy on desktop.
**When to use:** Share button on language detail pages.
**Example:**
```typescript
// Client-side script in ShareControls.astro
async function shareOrCopy(svgElement: SVGSVGElement, languageName: string, pageUrl: string) {
  const pngBlob = await svgToBlob(svgElement);

  // Try Web Share API first (mobile)
  if (navigator.share && navigator.canShare) {
    const file = new File([pngBlob], `${languageName}-beauty-index.png`, { type: 'image/png' });
    const shareData = {
      title: `${languageName} — The Beauty Index`,
      text: `Check out ${languageName}'s beauty score on The Beauty Index`,
      url: pageUrl,
      files: [file],
    };

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return; // Success -- native share handled it
      } catch (err) {
        if ((err as Error).name === 'AbortError') return; // User cancelled
      }
    }
  }

  // Fallback: copy PNG to clipboard (desktop)
  try {
    const data = [new ClipboardItem({ [pngBlob.type]: pngBlob })];
    await navigator.clipboard.write(data);
    showToast('Chart copied to clipboard');
  } catch {
    // Final fallback: copy page URL as text
    await navigator.clipboard.writeText(pageUrl);
    showToast('Link copied to clipboard');
  }
}

// Helper: convert SVG element to PNG blob
function svgToBlob(svgElement: SVGSVGElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const canvas = document.createElement('canvas');
    const scale = 2;
    const width = svgElement.width.baseVal.value || 300;
    const height = svgElement.height.baseVal.value || 300;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        pngBlob ? resolve(pngBlob) : reject(new Error('toBlob failed'));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = url;
  });
}
```

### Pattern 5: Wiring OG Images into Page Meta Tags
**What:** Pass the OG image URL to Layout via the `ogImage` prop.
**When to use:** Beauty Index overview and language detail pages.
**Example:**
```astro
---
// In src/pages/beauty-index/[slug].astro
const ogImageURL = new URL(`/open-graph/beauty-index/${language.id}.png`, Astro.site).toString();
---
<Layout
  title={language.name + " — The Beauty Index | Patryk Golabek"}
  description={language.characterSketch}
  ogImage={ogImageURL}
>
```

### Anti-Patterns to Avoid
- **Using Satori JSX/React:** The project already uses plain object VNode trees for Satori layouts (see `og-image.ts`). Don't introduce satori-html or React JSX for OG images -- stay consistent with the established pattern.
- **Embedding SVG elements directly in Satori:** Satori converts HTML/CSS to SVG output. It cannot accept `<svg>`, `<polygon>`, or `<path>` as input. Always embed SVG as a base64 `<img>` data URI.
- **Using `getCollection()` inside OG image generators:** `getCollection()` is an Astro runtime API. In the `generateLanguageOgImage()` function, receive the language data as a parameter -- don't try to call `getCollection()` inside the image generator.
- **Loading fonts repeatedly:** The existing `og-image.ts` already caches fonts with `interFont ??= await readFile(...)`. Any new generator functions should use the same cached font buffers.
- **Adding html-to-image as a dependency:** For converting a single inline SVG to PNG, vanilla `XMLSerializer` + canvas is under 40 lines. An npm package adds unnecessary weight and complexity.
- **Trying to use `canvas.toDataURL()` for clipboard operations:** The Clipboard API requires `Blob` objects via `ClipboardItem`, not data URLs. Always use `canvas.toBlob()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image generation | New Satori setup, new font loading | Extend existing `og-image.ts` with new generator | Font caching, Satori config, Sharp pipeline all proven |
| SVG to PNG (build-time) | Custom rasterizer | Satori + Sharp pipeline (existing) | Already handles the full pipeline |
| SVG to PNG (client-side) | html-to-image npm package | Vanilla `XMLSerializer` + `canvas.toBlob()` | 30 lines vs 15KB dependency; SVG serialization is trivial |
| Mobile share | Custom share UI, share buttons per platform | Web Share API (`navigator.share()`) | Native OS share sheet handles all platforms |
| Image clipboard | Custom clipboard polyfill | Async Clipboard API (`navigator.clipboard.write()`) | Baseline 2024, all modern browsers |
| Share feature detection | User agent sniffing | `navigator.canShare()` + `navigator.share` check | Standard progressive enhancement pattern |
| Toast notification | npm toast library | 10-line CSS + JS toast component | Single use case, no external dependency needed |

**Key insight:** The hard part of this phase (Satori integration, font loading, Sharp pipeline, radar chart math) was already built in Phases 16 and 7. Phase 18 is primarily assembly and wiring -- connecting existing pieces in new API routes and adding a small client-side script.

## Common Pitfalls

### Pitfall 1: Satori Cannot Render SVG Elements Directly
**What goes wrong:** Placing `<svg>`, `<polygon>`, or `<path>` elements in the Satori layout produces blank output or errors.
**Why it happens:** Satori converts HTML/CSS to SVG output using Yoga layout engine. It only understands HTML elements with CSS flexbox styling, not SVG primitives.
**How to avoid:** Generate the radar chart as a complete SVG string using `generateRadarSvgString()`, encode it as base64, and embed it via `<img src="data:image/svg+xml;base64,...">`. Satori supports SVG data URIs in img elements.
**Warning signs:** Blank areas where radar charts should appear in OG images, or Satori rendering errors about unsupported elements.

### Pitfall 2: SVG Data URI Needs Width and Height on img
**What goes wrong:** The radar chart image appears at the wrong size or doesn't render in Satori.
**Why it happens:** Satori recommends specifying width and height on img elements for predictable layout. Without explicit dimensions, Satori may default to 0x0 or use the SVG's intrinsic size.
**How to avoid:** Always pass `width` and `height` props on the `<img>` element in the Satori layout: `{ type: 'img', props: { src: dataUri, width: 360, height: 360 } }`.
**Warning signs:** Missing images, incorrect aspect ratios, layout overflow.

### Pitfall 3: Greek Characters in Satori OG Images
**What goes wrong:** Greek symbols (Phi, Omega, etc.) in radar chart axis labels render as tofu/squares in OG images.
**Why it happens:** The existing fonts (Inter-Regular.woff, SpaceGrotesk-Bold.woff) may not include Greek glyphs. The radar chart SVG is rendered as a bitmap by Satori, so SVG text uses `font-family: sans-serif` which resolves differently in Node.js.
**How to avoid:** The `generateRadarSvgString()` function already uses `font-family: "sans-serif"` for axis labels. In the Node.js/Satori context, the SVG is rasterized independently. Two solutions: (1) accept sans-serif rendering (acceptable quality since OG images are small), or (2) download a Noto Sans WOFF file and register it as a Satori font, then reference it in the SVG string. Since the SVG is encoded as a data URI image, Satori does not apply its own fonts to SVG text -- the SVG must either use a system font or embed font paths.
**Warning signs:** Axis labels in OG images show squares or missing characters. Test early with a single language.

### Pitfall 4: SVG Font Loss in Client-Side Canvas Conversion
**What goes wrong:** When downloading the radar chart as PNG, the axis labels use a different font than on the web page.
**Why it happens:** `XMLSerializer` captures the SVG DOM but external CSS-loaded fonts (from Google Fonts) are not embedded in the serialized SVG. When the SVG is drawn onto a canvas via `new Image()`, the canvas rendering engine uses system fonts.
**How to avoid:** The radar chart's `<text>` elements use `font-family="'Noto Sans', 'DM Sans', sans-serif"`. As long as either Noto Sans or DM Sans is loaded in the browser when the canvas renders, the labels will match. Since the download is triggered by user interaction (click), fonts will already be loaded. For maximum safety, add a `document.fonts.ready` check before serialization.
**Warning signs:** Font differences between the page radar chart and the downloaded PNG.

### Pitfall 5: SVG Width/Height Required for Canvas Rendering
**What goes wrong:** The canvas draws the SVG at 0x0 pixels or a default size, resulting in a blank or tiny PNG.
**Why it happens:** When converting SVG to an Image for canvas, Firefox requires explicit `width` and `height` attributes on the root `<svg>` element. The existing `RadarChart.astro` already sets these (`width={size}` and `height={size}`), but verification is important.
**How to avoid:** When serializing, confirm the SVG root has numeric `width` and `height` attributes. Read them from `svgElement.width.baseVal.value` and `svgElement.height.baseVal.value`.
**Warning signs:** Blank PNG downloads, especially in Firefox.

### Pitfall 6: Web Share API Requires User Gesture
**What goes wrong:** `navigator.share()` throws `NotAllowedError` or `InvalidStateError`.
**Why it happens:** The Web Share API requires "transient activation" -- it must be triggered by a direct user interaction (click, tap). Cannot be called from `setTimeout`, `Promise.then`, or page load.
**How to avoid:** Call `navigator.share()` directly inside a button click event handler. The async SVG-to-blob conversion must complete before calling share, so use `await` inside the click handler: `button.addEventListener('click', async () => { ... })`.
**Warning signs:** Console errors about activation, share sheet not appearing.

### Pitfall 7: Clipboard API Permission Issues
**What goes wrong:** `navigator.clipboard.write()` throws `NotAllowedError`.
**Why it happens:** The Clipboard API requires HTTPS and may require the page to be focused. Some browsers require explicit user permission.
**How to avoid:** Always call from a user gesture (click handler). Wrap in try/catch with a fallback to `navigator.clipboard.writeText(pageUrl)` for text-only clipboard copy. Feature-detect with `navigator.clipboard && typeof ClipboardItem !== 'undefined'`.
**Warning signs:** Works in Chrome dev tools but fails in production; intermittent failures when page loses focus.

### Pitfall 8: OG Image Route Conflicts with Existing Blog Routes
**What goes wrong:** The new Beauty Index OG routes conflict with the existing `[...slug].png.ts` catch-all route.
**Why it happens:** The existing `[...slug].png.ts` uses a rest parameter that could match `beauty-index/rust.png`.
**How to avoid:** Create a dedicated route file at `src/pages/open-graph/beauty-index/[slug].png.ts` for language OG images. Astro's static routing gives specific routes priority over catch-all routes. Alternatively, add beauty index routes to the existing `[...slug].png.ts` by expanding its `getStaticPaths`. The dedicated file approach is cleaner.
**Warning signs:** 404 errors on OG images, or blog OG route returning wrong images.

## Code Examples

Verified patterns from official sources and existing codebase:

### Overview Page OG Image Generator
```typescript
// New function in src/lib/og-image.ts
export async function generateOverviewOgImage(): Promise<Buffer> {
  await loadFonts();

  const layout = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#faf8f5',
        fontFamily: 'Inter',
        position: 'relative',
        gap: '24px',
      },
      children: [
        // Accent bar
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', top: 0, left: 0,
              width: '1200px', height: '6px',
              backgroundImage: 'linear-gradient(to right, #c44b20, #e8734a)',
            },
          },
        },
        // Title
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: '64px', color: '#1a1a2e', lineHeight: 1.15,
              textAlign: 'center',
            },
            children: 'The Beauty Index',
          },
        },
        // Subtitle
        {
          type: 'div',
          props: {
            style: {
              fontSize: '24px', color: '#555566', textAlign: 'center',
              maxWidth: '800px', lineHeight: 1.5,
            },
            children: 'Ranking 25 programming languages across 6 aesthetic dimensions',
          },
        },
        // Dimension labels row
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', gap: '16px', flexWrap: 'wrap',
              justifyContent: 'center',
            },
            children: ['Geometry', 'Elegance', 'Clarity', 'Happiness', 'Habitability', 'Integrity'].map(
              (name) => ({
                type: 'div',
                props: {
                  style: {
                    fontSize: '14px', color: '#c44b20',
                    backgroundColor: 'rgba(196,75,32,0.1)',
                    borderRadius: '20px', padding: '6px 18px',
                  },
                  children: name,
                },
              })
            ),
          },
        },
        // Branding
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', bottom: '24px',
              display: 'flex', alignItems: 'center', gap: '10px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Space Grotesk', fontWeight: 700,
                    fontSize: '16px', color: '#ffffff',
                    backgroundColor: '#c44b20', borderRadius: '6px',
                    padding: '2px 8px',
                  },
                  children: 'PG',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '16px', color: '#888899' },
                  children: 'patrykgolabek.dev',
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(layout as any, {
    width: 1200, height: 630,
    fonts: [
      { name: 'Inter', data: interFont!, weight: 400, style: 'normal' },
      { name: 'Space Grotesk', data: spaceGroteskFont!, weight: 700, style: 'normal' },
    ],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}
```

### OG Route for Overview Page
```typescript
// src/pages/open-graph/beauty-index.png.ts
import type { APIRoute } from 'astro';
import { generateOverviewOgImage } from '../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateOverviewOgImage();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Wiring OG Meta Tags on Pages
```astro
---
// src/pages/beauty-index/index.astro -- add ogImage
const ogImageURL = new URL('/open-graph/beauty-index.png', Astro.site).toString();
---
<Layout
  title="The Beauty Index | Patryk Golabek"
  description="Ranking 25 programming languages across 6 aesthetic dimensions."
  ogImage={ogImageURL}
>
```

```astro
---
// src/pages/beauty-index/[slug].astro -- add ogImage
const ogImageURL = new URL(`/open-graph/beauty-index/${language.id}.png`, Astro.site).toString();
---
<Layout
  title={language.name + " — The Beauty Index | Patryk Golabek"}
  description={language.characterSketch}
  ogImage={ogImageURL}
>
```

### ShareControls Component
```astro
---
// src/components/beauty-index/ShareControls.astro
interface Props {
  languageName: string;
  languageId: string;
}
const { languageName, languageId } = Astro.props;
const pageUrl = `https://patrykgolabek.dev/beauty-index/${languageId}/`;
---

<div class="flex items-center gap-3" data-share-controls data-language-name={languageName} data-page-url={pageUrl}>
  {/* Download button -- always visible */}
  <button
    type="button"
    data-action="download"
    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:border-[var(--color-accent)] transition-colors"
    aria-label={`Download ${languageName} radar chart as PNG`}
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M8 2v8m0 0L5 7m3 3l3-3M3 12h10" />
    </svg>
    Download
  </button>

  {/* Share/Copy button -- behavior determined at runtime */}
  <button
    type="button"
    data-action="share"
    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:border-[var(--color-accent)] transition-colors"
    aria-label={`Share ${languageName} radar chart`}
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M6 9l4-4m-4 0h4v4M4 7v5h8" />
    </svg>
    <span data-share-label>Share</span>
  </button>
</div>

{/* Toast notification for copy feedback */}
<div
  data-toast
  class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-surface)] text-sm opacity-0 pointer-events-none transition-opacity duration-300 z-50"
  role="status"
  aria-live="polite"
></div>

<script>
  function initShareControls() {
    const container = document.querySelector('[data-share-controls]') as HTMLElement;
    if (!container) return;

    const languageName = container.dataset.languageName!;
    const pageUrl = container.dataset.pageUrl!;
    const svgElement = document.querySelector('[role="img"][aria-label*="Radar chart"]') as SVGSVGElement;
    if (!svgElement) return;

    // Update button label based on capability
    const shareLabel = container.querySelector('[data-share-label]');
    const hasNativeShare = !!navigator.share && !!navigator.canShare;
    if (shareLabel && !hasNativeShare) {
      shareLabel.textContent = 'Copy';
    }

    // SVG to PNG blob helper
    function svgToBlob(svg: SVGSVGElement): Promise<Blob> {
      return new Promise((resolve, reject) => {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const canvas = document.createElement('canvas');
        const scale = 2;
        const w = svg.width.baseVal.value || 300;
        const h = svg.height.baseVal.value || 300;
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(scale, scale);

        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = '#faf8f5';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
            'image/png',
          );
        };
        img.onerror = reject;
        img.src = url;
      });
    }

    // Toast helper
    function showToast(message: string) {
      const toast = document.querySelector('[data-toast]') as HTMLElement;
      if (!toast) return;
      toast.textContent = message;
      toast.style.opacity = '1';
      setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    }

    // Download handler
    container.querySelector('[data-action="download"]')?.addEventListener('click', async () => {
      const blob = await svgToBlob(svgElement);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${languageName.toLowerCase()}-beauty-index.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Share/Copy handler
    container.querySelector('[data-action="share"]')?.addEventListener('click', async () => {
      const blob = await svgToBlob(svgElement);

      // Try Web Share API (mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `${languageName.toLowerCase()}-beauty-index.png`, { type: 'image/png' });
        const shareData = { title: `${languageName} — The Beauty Index`, url: pageUrl, files: [file] };
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            return;
          } catch (err) {
            if ((err as Error).name === 'AbortError') return;
          }
        }
      }

      // Fallback: copy image to clipboard
      try {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        showToast('Chart copied to clipboard');
      } catch {
        await navigator.clipboard.writeText(pageUrl);
        showToast('Link copied to clipboard');
      }
    });
  }

  document.addEventListener('astro:page-load', initShareControls);
</script>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Headless browser (Puppeteer) for OG images | Satori + Sharp (no browser needed) | 2022+ | Faster builds, no Chrome dependency |
| html-to-image/dom-to-image for client screenshots | Vanilla XMLSerializer + canvas for SVGs | Always available | No dependency needed for pure SVG conversion |
| `document.execCommand('copy')` | `navigator.clipboard.write()` with ClipboardItem | 2024 Baseline | Async, supports images, not just text |
| Platform-specific share buttons (Twitter, FB) | Web Share API (`navigator.share()`) | 2024+ broad support | Native OS share sheet, one API for all platforms |
| `canvas.toDataURL()` for downloads | `canvas.toBlob()` + `URL.createObjectURL()` | Modern standard | More memory efficient, works with Clipboard API |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Synchronous, text-only, deprecated in favor of Async Clipboard API
- html2canvas library: Uses `<foreignObject>` trick; for pure SVG elements, direct serialization is simpler and more reliable
- Platform share buttons with SDK scripts: Web Share API provides native integration without loading third-party scripts

## Open Questions

1. **Greek Characters in OG Image Radar Charts**
   - What we know: `generateRadarSvgString()` uses `font-family: "sans-serif"` for axis labels. In the Satori context, the SVG is embedded as a data URI image, so Satori does not apply its own font rendering to the SVG text. The SVG is rasterized using whatever `sans-serif` resolves to in the Node.js Sharp/librsvg environment.
   - What's unclear: Whether `sans-serif` in the Node.js SVG rasterization context includes Greek character support. Sharp uses librsvg internally, which resolves system fonts.
   - Recommendation: Test early with a single language OG image. If Greek characters render incorrectly, two options: (a) replace Greek symbols with ASCII abbreviations in the OG-specific radar chart (e.g., "PHI", "PSI" instead of the Unicode characters), or (b) download Noto Sans .woff file and add it to Satori's font list. Option (a) is simpler and sufficient for OG images.

2. **OG Image for Overview Page Design**
   - What we know: The overview page needs a custom OG image with "Beauty Index branding and ranking visual" per success criteria
   - What's unclear: Whether to include a miniature bar chart, multiple radar thumbnails, or just text + branding
   - Recommendation: Keep the overview OG image text-based (title, subtitle, dimension pills, branding). Miniature charts at 1200x630 resolution are too small to be meaningful. The text-based approach matches the existing blog OG image aesthetic.

3. **Safari canvas.toBlob() with SVG Rendering**
   - What we know: Safari historically had issues with `toDataURL()` on inline SVGs. `toBlob()` has broader support.
   - What's unclear: Whether current Safari (17+) fully supports drawing SVG-sourced images onto canvas without taint
   - Recommendation: Use the `Blob` + `URL.createObjectURL()` approach (not data URL) for loading SVG into Image elements, as this avoids the Safari data URL taint issue. Add try/catch with a user-friendly error message as fallback.

4. **Share Button Placement**
   - What we know: Buttons go on language detail pages near the radar chart
   - What's unclear: Exact layout position (below chart, beside chart, floating action button)
   - Recommendation: Place below the radar chart in the chart+scores grid section. This keeps the share/download actions contextually near the visual they operate on.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- All OG image patterns verified by reading actual source files:
  - `src/lib/og-image.ts` -- Satori + Sharp pipeline, font loading, VNode layout pattern
  - `src/pages/open-graph/[...slug].png.ts` -- getStaticPaths API route for OG images
  - `src/pages/open-graph/default.png.ts` -- Static OG image route
  - `src/lib/beauty-index/radar-math.ts` -- `generateRadarSvgString()` designed for Satori
  - `src/components/SEOHead.astro` -- ogImage meta tag wiring
  - `src/layouts/Layout.astro` -- ogImage prop, SEOHead integration
  - `src/pages/blog/[slug].astro` -- Existing ogImage URL pattern: `/open-graph/blog/{id}.png`
- [Satori GitHub README](https://github.com/vercel/satori) -- Image support, font requirements, CSS limitations
- [MDN Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) -- Web Share API syntax, requirements, file support
- [MDN Clipboard.write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) -- Async Clipboard API, ClipboardItem construction
- [MDN HTMLCanvasElement.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) -- Canvas to blob API

### Secondary (MEDIUM confidence)
- [Can I Use: Web Share API](https://caniuse.com/web-share) -- 92.48% global support; no Firefox desktop
- [web.dev: Share files](https://web.dev/patterns/files/share-files/) -- File sharing pattern with canShare() guard
- [Satori image handler source](https://github.com/vercel/satori/blob/main/src/handler/image.ts) -- SVG data URI parsing confirmed
- [Satori PR #310: Data URI size resolution](https://github.com/vercel/satori/pull/310) -- Confirmed SVG data URI support for image size detection
- [BEAUBUS: SVG to PNG with vanilla JS](https://www.beaubus.com/blog/how_to_save_inline_svg_as_png_with_vanilla_javascript_and_html_canvas.html) -- XMLSerializer + canvas pattern
- [cjav.dev: SVG to PNG with JavaScript](https://www.cjav.dev/articles/svg-to-png-with-javascript) -- Blob URL approach for canvas rendering

### Tertiary (LOW confidence)
- Greek character rendering in Node.js librsvg context -- Not directly verified; needs implementation testing

## Metadata

**Confidence breakdown:**
- OG image generation: HIGH -- Exact same Satori + Sharp pipeline already proven in `og-image.ts`; `generateRadarSvgString()` exists and was designed for this use case
- OG image API routes: HIGH -- `getStaticPaths` pattern verified against 3 existing implementations in codebase
- OG meta tag wiring: HIGH -- `Layout.astro` already accepts `ogImage` prop, `SEOHead.astro` renders all required meta tags
- SVG data URI in Satori: MEDIUM -- SVG data URIs confirmed supported by Satori source code and PR #310; not yet tested in this specific project
- Client-side SVG-to-PNG: HIGH -- XMLSerializer + canvas + toBlob is a well-documented standard pattern
- Web Share API: HIGH -- MDN docs, 92%+ coverage, canShare() feature detection well-documented
- Clipboard API: HIGH -- Baseline 2024, MDN docs, ClipboardItem construction well-documented
- Greek characters in OG images: LOW -- Depends on Node.js librsvg font resolution; needs testing

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days -- stable domain, browser APIs are finalized standards)
