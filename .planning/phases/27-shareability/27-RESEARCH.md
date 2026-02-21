# Phase 27: Shareability - Research

**Researched:** 2026-02-20
**Domain:** Client-side image generation (SVG-to-PNG), URL state encoding/compression
**Confidence:** HIGH

## Summary

Phase 27 adds two shareability features to the Dockerfile Analyzer: (1) a downloadable PNG score badge, and (2) URL hash-based state encoding for shareable analysis links. Both features operate entirely client-side, consistent with the tool's "your code never leaves your browser" promise.

The score badge should be generated as a standalone SVG (programmatically built, not captured from the DOM) and rasterized to PNG via the Canvas API. This approach avoids new dependencies, sidesteps Tailwind/CSS capture pitfalls, and gives full control over the badge's visual layout. The URL state encoding should use `lz-string`'s `compressToEncodedURIComponent` to compress Dockerfile content into the URL hash fragment, which is read on page load to restore the editor content and trigger analysis.

**Primary recommendation:** Use zero-dependency vanilla SVG-to-Canvas for badge PNG generation, and add `lz-string` (~1KB gzipped) for URL state compression. Both approaches are lightweight, well-proven, and avoid complex library overhead.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHARE-01 | Score badge download as PNG image for social media sharing | Vanilla SVG-to-Canvas-to-PNG pipeline; programmatic badge SVG with inline styles; `canvas.toBlob()` + download trigger |
| SHARE-02 | URL state encoding -- Dockerfile content in URL hash for shareable analysis links | `lz-string.compressToEncodedURIComponent` for compression; `window.location.hash` for storage; read hash on mount to restore editor content + trigger analysis |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Canvas API (browser native) | N/A | Rasterize SVG to PNG bitmap | Zero-dependency, universally supported, full control over output dimensions |
| lz-string | ^1.5.0 | Compress/decompress Dockerfile content for URL-safe encoding | <1KB gzipped, battle-tested, has purpose-built `compressToEncodedURIComponent` method |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanostores | ^1.1.0 | Read `analysisResult` store for badge data | Already holds score, grade, categories |
| @nanostores/react | ^1.0.0 | React hook access to stores | Already used in ResultsPanel |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla SVG-to-Canvas | html-to-image (~15KB) | Captures DOM including CSS classes, but adds dependency and captures dark-theme styling that may not look good in isolation; DOM capture is fragile if layout changes |
| Vanilla SVG-to-Canvas | satori (already installed, ~2MB WASM) | Already in package.json but used server-side with `sharp` + `node:fs`; client-side usage requires WASM init + font fetch as ArrayBuffer; massive overkill for a simple badge |
| lz-string | CompressionStream API (native) | Native browser API but outputs binary (needs base64 encoding), async stream-based API is more complex, and produces output that is NOT inherently URL-safe |
| lz-string | btoa/atob (no compression) | Simpler but base64 only encodes (no compression); a 50-line Dockerfile becomes ~2000+ chars in base64 vs ~400-800 with lz-string |

### Decision: Why NOT satori client-side

The project already has `satori` in `package.json` for OG image generation (`src/lib/og-image.ts`), but that code:
- Uses `node:fs/promises` to load font files
- Uses `sharp` for SVG-to-PNG conversion
- Runs at build time (Astro static output)

Client-side satori would require: (a) fetching font `.woff` files as `ArrayBuffer` via HTTP, (b) initializing WASM (~2MB), (c) still needing Canvas API for final PNG conversion since `sharp` is Node-only. This is massive overhead for a 400x200 badge. The vanilla SVG approach produces the same result with zero overhead.

**Installation:**
```bash
npm install lz-string
npm install -D @types/lz-string
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/tools/
│   ├── results/
│   │   └── ShareActions.tsx          # "Download Badge" + "Copy Link" buttons
│   ├── ResultsPanel.tsx              # Add ShareActions below score display
│   └── EditorPanel.tsx               # Read URL hash on mount, restore content
├── lib/tools/dockerfile-analyzer/
│   ├── badge-generator.ts            # Programmatic SVG builder + Canvas rasterizer
│   └── url-state.ts                  # lz-string compress/decompress + URL hash helpers
└── stores/
    └── dockerfileAnalyzerStore.ts    # No changes needed (analysisResult already sufficient)
```

### Pattern 1: Programmatic SVG Badge Generation
**What:** Build the badge SVG as a string (not JSX), using the same score/grade/category data from the `analysisResult` nanostore. Inline all styles (no Tailwind classes). Rasterize via Canvas API.
**When to use:** When the output image needs to look consistent regardless of page theme or CSS context.
**Example:**
```typescript
// Source: Adapted from vanilla SVG-to-Canvas pattern
// https://www.beaubus.com/blog/how_to_save_inline_svg_as_png_with_vanilla_javascript_and_html_canvas.html

function buildBadgeSvg(score: number, grade: string, categories: CategoryScore[]): string {
  const gradeColor = getGradeColor(grade);
  const width = 400;
  const height = 200;

  // Build SVG string with all inline styles
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="12" fill="#1a1a2e"/>
    <!-- Score gauge arc -->
    <circle cx="70" cy="80" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="6"/>
    <circle cx="70" cy="80" r="45" fill="none" stroke="${gradeColor}" stroke-width="6"
      stroke-linecap="round"
      stroke-dasharray="${2 * Math.PI * 45}"
      stroke-dashoffset="${2 * Math.PI * 45 - (score / 100) * 2 * Math.PI * 45}"
      transform="rotate(-90 70 80)"/>
    <!-- Score text -->
    <text x="70" y="76" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="system-ui">${score}</text>
    <text x="70" y="96" text-anchor="middle" fill="${gradeColor}" font-size="14" font-weight="600" font-family="system-ui">${grade}</text>
    <!-- Category bars -->
    ${categories.map((cat, i) => `
      <text x="140" y="${45 + i * 28}" fill="rgba(255,255,255,0.7)" font-size="11" font-family="system-ui">${CATEGORY_LABELS[cat.category]}</text>
      <rect x="240" y="${37 + i * 28}" width="120" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
      <rect x="240" y="${37 + i * 28}" width="${(cat.score / 100) * 120}" height="8" rx="4" fill="${CATEGORY_COLORS[cat.category]}"/>
      <text x="368" y="${45 + i * 28}" fill="rgba(255,255,255,0.7)" font-size="10" font-family="monospace" text-anchor="end">${Math.round(cat.score)}</text>
    `).join('')}
    <!-- Branding -->
    <text x="${width / 2}" y="${height - 12}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9" font-family="system-ui">patrykgolabek.dev/tools/dockerfile-analyzer</text>
  </svg>`;
}

async function downloadBadgePng(svgString: string, filename: string): Promise<void> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const dpr = 2; // 2x for retina clarity
  canvas.width = 400 * dpr;
  canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);

  const img = new Image();
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 400, 200);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error('Failed to create PNG')); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')); };
    img.src = url;
  });
}
```

### Pattern 2: URL State Encoding with lz-string
**What:** Compress Dockerfile text content using lz-string, store in URL hash fragment, read on page load to restore state.
**When to use:** When the full analysis must be reproducible from a URL alone.
**Example:**
```typescript
// Source: lz-string official docs https://pieroxy.net/blog/pages/lz-string/guide.html

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/** Encode Dockerfile content into a URL hash */
export function encodeDockerfileToHash(content: string): string {
  const compressed = compressToEncodedURIComponent(content);
  return `#dockerfile=${compressed}`;
}

/** Decode Dockerfile content from the current URL hash */
export function decodeDockerfileFromHash(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#dockerfile=')) return null;
  const compressed = hash.slice('#dockerfile='.length);
  return decompressFromEncodedURIComponent(compressed);
}

/** Update the URL hash without triggering navigation */
export function setHashState(content: string): void {
  const hash = encodeDockerfileToHash(content);
  history.replaceState(null, '', hash);
}
```

### Pattern 3: Hash Reading on Component Mount
**What:** EditorPanel reads URL hash on mount. If a compressed Dockerfile is found, it replaces the initial doc and triggers analysis.
**When to use:** When a shared URL is opened in a new browser.
**Example:**
```typescript
// Inside useCodeMirror hook or EditorPanel mount effect
useEffect(() => {
  const restored = decodeDockerfileFromHash();
  if (restored && viewRef.current) {
    const view = viewRef.current;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: restored },
    });
    // Trigger analysis after restoring content
    onAnalyze(view);
  }
}, []); // Run once on mount
```

### Anti-Patterns to Avoid
- **Capturing DOM with html-to-image for badge:** The existing ScoreGauge uses Tailwind's dark theme CSS variables (`--color-text-secondary`, etc.). Capturing the DOM produces a badge that only looks correct in the current theme. A standalone SVG with hardcoded colors produces a consistent, portable image.
- **Storing analysis results in the URL:** Only store the Dockerfile content. Re-run analysis on load. This keeps URLs shorter and ensures results always reflect the latest rule engine version.
- **Using `window.location.hash = ...` directly:** This triggers a `hashchange` event and may cause unwanted navigation in Astro. Use `history.replaceState()` instead.
- **Encoding the URL hash on every keystroke:** Only encode on explicit user action ("Copy Share Link" button), not on every document change.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL-safe string compression | Custom base64 + deflate pipeline | `lz-string.compressToEncodedURIComponent` | Handles URL-safe alphabet, compression, and edge cases (null bytes, Unicode) in one call |
| SVG rasterization to PNG | Custom pixel rendering | Canvas API `drawImage` + `toBlob` | Browser-native, handles anti-aliasing and color spaces correctly |
| File download trigger | Custom blob management | `<a>` element with `download` attribute + `URL.createObjectURL` | Standard browser download pattern, works across all modern browsers |

**Key insight:** The SVG-to-Canvas-to-PNG pipeline and lz-string compression are both well-established patterns. The complexity lies in getting the SVG badge layout right (inline styles, proper SVG namespace), not in the tooling.

## Common Pitfalls

### Pitfall 1: Missing SVG namespace
**What goes wrong:** The SVG fails to render when loaded as an image because it lacks the `xmlns` attribute.
**Why it happens:** When building SVG strings programmatically, developers forget that `xmlns="http://www.w3.org/2000/svg"` is required for standalone SVG (it's optional when inline in HTML but mandatory in `<img>` sources).
**How to avoid:** Always include `xmlns="http://www.w3.org/2000/svg"` in the root `<svg>` element of the badge template.
**Warning signs:** The canvas draws a blank/transparent image; the Image `onerror` fires.

### Pitfall 2: Blurry PNG on retina displays
**What goes wrong:** The exported PNG looks fuzzy/pixelated on high-DPI screens.
**Why it happens:** Canvas dimensions match CSS pixels (e.g., 400x200) but retina screens have 2x or 3x device pixel ratio.
**How to avoid:** Multiply canvas width/height by `devicePixelRatio` (or a fixed 2x), then scale the context with `ctx.scale(dpr, dpr)`. The SVG viewport stays at the logical size.
**Warning signs:** Badge looks sharp on standard displays but blurry when shared on social media or viewed on phones.

### Pitfall 3: SVG text rendering with system fonts
**What goes wrong:** Font rendering in the exported PNG differs across platforms (e.g., different fallback fonts on macOS vs Windows vs Linux).
**Why it happens:** The SVG uses `font-family: "system-ui"` which resolves differently per OS. Unlike satori, the Canvas API does not embed font paths.
**How to avoid:** Accept minor font differences (the badge is informational, not pixel-perfect branding). Use `font-family: system-ui, -apple-system, sans-serif` for broadest coverage. Alternatively, use simple geometric text or limit to numbers which render consistently.
**Warning signs:** Comparison between badge PNGs from different OSes shows different character widths.

### Pitfall 4: URL too long for sharing platforms
**What goes wrong:** The shareable URL is truncated by Twitter, Slack, email clients, or other platforms.
**Why it happens:** A large Dockerfile (100+ lines) compresses to thousands of characters. While browsers support 65K+ character URLs, sharing platforms often truncate at 2000-4000 characters.
**How to avoid:** (a) Show a warning when the compressed URL exceeds ~2000 characters. (b) Display the URL length to the user. (c) Consider a character limit or truncation notice in the UI. Most real-world Dockerfiles are 20-50 lines which compress to 300-800 characters -- well within limits.
**Warning signs:** Users paste large Dockerfiles and the shared link doesn't work when pasted into Slack/Twitter.

### Pitfall 5: Race condition on hash restore vs. CodeMirror initialization
**What goes wrong:** The hash decode runs before CodeMirror is fully initialized, so `viewRef.current` is null.
**Why it happens:** The `useEffect` that reads the hash fires at the same time as (or before) the `useEffect` that creates the EditorView.
**How to avoid:** Read the hash INSIDE the existing `useCodeMirror` hook, AFTER the EditorView is created. Or pass a decoded initial doc to `useCodeMirror` instead of the `SAMPLE_DOCKERFILE`.
**Warning signs:** Shared URLs load with the sample Dockerfile instead of the encoded content.

### Pitfall 6: Canvas tainted by cross-origin data
**What goes wrong:** `canvas.toBlob()` throws a SecurityError.
**Why it happens:** If the SVG references external resources (images, fonts via URL), the canvas becomes "tainted" and export is blocked.
**How to avoid:** The badge SVG must be fully self-contained -- no external references. All styles inline, no external font URLs, no linked images.
**Warning signs:** `toBlob` or `toDataURL` throws DOMException with "tainted" message.

## Code Examples

### Complete Badge Generation Flow
```typescript
// Source: Synthesized from Canvas API docs + SVG specification
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob

import type { ScoreResult, CategoryScore } from './types';

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  efficiency: 'Efficiency',
  maintainability: 'Maintainability',
  reliability: 'Reliability',
  'best-practice': 'Best Practice',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444',
  efficiency: '#3b82f6',
  maintainability: '#8b5cf6',
  reliability: '#f59e0b',
  'best-practice': '#06b6d4',
};

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#84cc16';
  if (grade.startsWith('C')) return '#eab308';
  if (grade.startsWith('D')) return '#f97316';
  return '#ef4444';
}

export function buildBadgeSvg(score: ScoreResult): string {
  const { overall, grade, categories } = score;
  const gradeColor = getGradeColor(grade);
  const W = 400, H = 200;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (overall / 100) * circ;

  const catBars = categories.map((cat: CategoryScore, i: number) => {
    const y = 40 + i * 26;
    const label = CATEGORY_LABELS[cat.category] ?? cat.category;
    const color = CATEGORY_COLORS[cat.category] ?? '#94a3b8';
    const barW = (cat.score / 100) * 110;
    return `
      <text x="135" y="${y + 4}" fill="rgba(255,255,255,0.7)" font-size="10" font-family="system-ui, sans-serif">${label}</text>
      <rect x="240" y="${y - 4}" width="110" height="7" rx="3.5" fill="rgba(255,255,255,0.1)"/>
      <rect x="240" y="${y - 4}" width="${barW}" height="7" rx="3.5" fill="${color}"/>
      <text x="358" y="${y + 4}" fill="rgba(255,255,255,0.6)" font-size="9" font-family="monospace" text-anchor="end">${Math.round(cat.score)}</text>
    `;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a1a2e"/>
        <stop offset="100%" stop-color="#16213e"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" rx="12" fill="url(#bg)"/>
    <!-- Gauge background -->
    <circle cx="68" cy="85" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
    <!-- Gauge arc -->
    <circle cx="68" cy="85" r="${r}" fill="none" stroke="${gradeColor}" stroke-width="6"
      stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
      transform="rotate(-90 68 85)"/>
    <!-- Score number -->
    <text x="68" y="82" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="system-ui, sans-serif">${overall}</text>
    <!-- Grade letter -->
    <text x="68" y="100" text-anchor="middle" fill="${gradeColor}" font-size="13" font-weight="600" font-family="system-ui, sans-serif">${grade}</text>
    <!-- Title -->
    <text x="135" y="24" fill="rgba(255,255,255,0.5)" font-size="10" font-family="system-ui, sans-serif">Dockerfile Analysis</text>
    <!-- Category bars -->
    ${catBars}
    <!-- Branding -->
    <text x="${W / 2}" y="${H - 10}" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-size="8" font-family="system-ui, sans-serif">patrykgolabek.dev/tools/dockerfile-analyzer</text>
  </svg>`;
}

export async function downloadBadgePng(score: ScoreResult): Promise<void> {
  const svgString = buildBadgeSvg(score);
  const dpr = Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x
  const W = 400, H = 200;

  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.scale(dpr, dpr);

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error('PNG blob creation failed')); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = `dockerfile-score-${score.overall}-${score.grade}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image load failed'));
    };
    img.src = url;
  });
}
```

### Complete URL State Encoding
```typescript
// Source: lz-string official guide https://pieroxy.net/blog/pages/lz-string/guide.html

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

const HASH_PREFIX = '#dockerfile=';

/** Compress Dockerfile content and return the full hash string */
export function encodeToHash(content: string): string {
  return `${HASH_PREFIX}${compressToEncodedURIComponent(content)}`;
}

/** Read and decompress Dockerfile content from current URL hash. Returns null if not present. */
export function decodeFromHash(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const compressed = hash.slice(HASH_PREFIX.length);
  if (!compressed) return null;
  try {
    return decompressFromEncodedURIComponent(compressed);
  } catch {
    return null;
  }
}

/** Build a full shareable URL for the given Dockerfile content */
export function buildShareUrl(content: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}${encodeToHash(content)}`;
}

/** Estimate whether the share URL will be safe for common platforms */
export function isUrlSafeLength(content: string): { safe: boolean; length: number } {
  const url = buildShareUrl(content);
  return { safe: url.length <= 2000, length: url.length };
}
```

### ShareActions Component Pattern
```typescript
// React component for Download Badge + Copy Link buttons

import { useStore } from '@nanostores/react';
import { analysisResult } from '../../../stores/dockerfileAnalyzerStore';
import { downloadBadgePng } from '../../../lib/tools/dockerfile-analyzer/badge-generator';
import { buildShareUrl, isUrlSafeLength } from '../../../lib/tools/dockerfile-analyzer/url-state';

export function ShareActions({ dockerfileContent }: { dockerfileContent: string }) {
  const result = useStore(analysisResult);
  const [copied, setCopied] = useState(false);

  if (!result || !result.parseSuccess) return null;

  const handleDownload = async () => {
    await downloadBadgePng(result.score);
  };

  const handleCopyLink = async () => {
    const { safe, length } = isUrlSafeLength(dockerfileContent);
    const url = buildShareUrl(dockerfileContent);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (!safe) {
      // Show warning -- URL is long
      console.warn(`Share URL is ${length} chars -- may be truncated by some platforms`);
    }
  };

  return (
    <div className="flex gap-2 mt-3">
      <button onClick={handleDownload}>Download Badge</button>
      <button onClick={handleCopyLink}>{copied ? 'Copied!' : 'Copy Share Link'}</button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| html2canvas for DOM capture | html-to-image (lighter fork) | 2022+ | Better CSS support, smaller bundle |
| Custom base64 encoding for URLs | lz-string compressToEncodedURIComponent | Stable since 2014 | De facto standard for URL state compression |
| Server-side image generation | Client-side SVG-to-Canvas | Always available | Zero-dependency, runs in browser |
| CompressionStream API (native) | lz-string (for URL use cases) | CompressionStream since 2023 | Native API outputs binary (needs extra encoding step); lz-string outputs URL-safe strings directly |

**Deprecated/outdated:**
- **dom-to-image**: Unmaintained, replaced by html-to-image. Do not use.
- **html2canvas for simple SVG**: Overkill; for SVG-only content, the vanilla Canvas approach is simpler and more reliable.

## Open Questions

1. **Badge dimensions and layout**
   - What we know: 400x200 is a common social media badge size. The badge should include score, grade, category bars, and branding.
   - What's unclear: Exact pixel positions and visual design -- will need iteration.
   - Recommendation: Start with the 400x200 template in the code examples above. Iterate on visual polish during implementation.

2. **Accessing Dockerfile content for URL encoding**
   - What we know: The EditorPanel holds the CodeMirror EditorView (via `viewRef`), and the content is `view.state.doc.toString()`. The nanostore `editorViewRef` provides external access.
   - What's unclear: Whether ShareActions should read from the nanostore `editorViewRef` or receive content as a prop.
   - Recommendation: Read from `editorViewRef.get().state.doc.toString()` in the share handler -- this is the source of truth and avoids prop-threading or adding another nanostore.

3. **Hash restore timing vs. useCodeMirror hook**
   - What we know: The current `useCodeMirror` hook creates the EditorView in a `useEffect([], [])`. The hash decode must happen AFTER the view exists.
   - What's unclear: Whether to decode hash before mount (pass as `initialDoc`) or after mount (dispatch a transaction).
   - Recommendation: Decode hash before `useCodeMirror` call and pass as `initialDoc` if present, falling back to `SAMPLE_DOCKERFILE`. This is simpler than dispatching a transaction after mount and avoids the content flash. Then trigger analysis in a separate effect.

## Sources

### Primary (HIGH confidence)
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API -- toBlob, drawImage, getContext
- HTMLCanvasElement.toBlob: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- SVG 1.1 namespace requirement: https://www.w3.org/TR/SVG11/struct.html#SVGElement
- lz-string official guide: https://pieroxy.net/blog/pages/lz-string/guide.html -- compressToEncodedURIComponent API
- lz-string GitHub: https://github.com/pieroxy/lz-string -- v1.5.0

### Secondary (MEDIUM confidence)
- SVG-to-Canvas vanilla pattern: https://www.beaubus.com/blog/how_to_save_inline_svg_as_png_with_vanilla_javascript_and_html_canvas.html
- SVG-to-PNG complete guide: https://www.svgai.org/blog/svg-to-png-javascript
- URL fragment limits: https://www.codegenes.net/blog/maximum-length-of-url-fragments-hash/ -- browsers support 65K+ but sharing platforms truncate at ~2000-4000
- html-to-image GitHub: https://github.com/bubkoo/html-to-image -- evaluated and rejected for this use case

### Tertiary (LOW confidence)
- None -- all claims verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Canvas API is browser-native, lz-string is mature (v1.5.0, 3+ years stable, 1168 dependents)
- Architecture: HIGH -- Pattern directly follows existing codebase conventions (nanostores, React hooks, separate lib modules)
- Pitfalls: HIGH -- Well-documented browser behavior (xmlns requirement, canvas tainting, retina DPI, URL length limits)
- Code examples: MEDIUM -- SVG badge layout is illustrative; exact pixel positions will need iteration during implementation

**Research date:** 2026-02-20
**Valid until:** 2026-06-20 (stable domain -- Canvas API and lz-string are mature, unlikely to change)
