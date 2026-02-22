# Phase 37: Shareability & Badge Export - Research

**Researched:** 2026-02-22
**Domain:** Client-side image generation, URL state encoding, Web Share / Clipboard APIs
**Confidence:** HIGH

## Summary

Phase 37 adds three shareability features to the Compose Validator: (1) a branded PNG badge download showing the analysis score, (2) URL hash encoding of compose YAML content via lz-string for shareable links, and (3) platform-adaptive sharing using Web Share API on mobile and Clipboard API on desktop with text URL fallback.

The Dockerfile Analyzer (v1.4) already implements all three features with a proven, tested pattern. The compose validator should mirror these patterns exactly, adapting only the category labels, colors, tool name, and URL hash prefix. lz-string is already installed (`^1.5.0` with `@types/lz-string ^1.3.34`). No new dependencies are needed.

**Primary recommendation:** Mirror the Dockerfile Analyzer's `badge-generator.ts`, `url-state.ts`, and `ShareActions.tsx` patterns, adapting category names/colors and hash prefix for compose-validator. Add Web Share API support (navigator.share) on mobile as a new enhancement beyond the Dockerfile Analyzer pattern.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHARE-01 | Score badge download as PNG image for social media sharing | Existing `badge-generator.ts` pattern: SVG badge string built from `ScoreResult`, rasterized to retina-aware PNG via Canvas API, downloaded via anchor click. Adapt category labels/colors for compose categories (schema, security, semantic, best-practice, style) |
| SHARE-02 | URL state encoding -- compose YAML content in URL hash via lz-string | Existing `url-state.ts` pattern: `compressToEncodedURIComponent`/`decompressFromEncodedURIComponent` with `#compose=` prefix. lz-string already installed. EditorPanel decodes on mount, auto-triggers analysis |
| SHARE-03 | Web Share API on mobile, Clipboard API on desktop, text URL fallback | Existing `ShareActions.tsx` uses Clipboard API. Add `navigator.share()` detection for mobile. Clipboard API is Baseline since March 2020. Web Share API has 92.48% global coverage -- strong on mobile, partial on desktop (Firefox desktop does NOT support) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lz-string | ^1.5.0 | Compress YAML content for URL hash encoding | Already installed; proven in Dockerfile Analyzer; URI-safe compression |
| Canvas API (browser) | N/A | Rasterize SVG badge to PNG | Native browser API, no dependencies; retina-aware via devicePixelRatio |
| Web Share API (browser) | N/A | Native share sheet on mobile devices | 92.48% global coverage; native UX on iOS/Android |
| Clipboard API (browser) | N/A | Copy URL to clipboard on desktop | Baseline since March 2020; widely supported |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/lz-string | ^1.3.34 | TypeScript types for lz-string | Already installed |
| nanostores | (existing) | Cross-component state for analysis results | Already used for composeResult, composeEditorViewRef |
| @nanostores/react | (existing) | React bindings for nanostores | Already used in ComposeResultsPanel |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SVG-to-Canvas badge | html2canvas / html-to-image | Adds dependency; slower; SVG string approach is simpler, proven in codebase, zero-dependency |
| lz-string URL encoding | base64 / pako | lz-string already installed and proven; base64 URL is much longer; pako adds dependency |
| Canvas toBlob PNG | Satori + Sharp | Server-side only; this is client-side browser download |

**Installation:**
```bash
# No new packages needed -- lz-string and @types/lz-string already installed
```

## Architecture Patterns

### Recommended File Structure
```
src/
  lib/tools/compose-validator/
    badge-generator.ts     # NEW: buildComposeBadgeSvg() + downloadComposeBadgePng()
    url-state.ts           # NEW: encodeToHash() + decodeFromHash() + buildShareUrl() + isUrlSafeLength()
  components/tools/
    compose-results/
      ComposeShareActions.tsx  # NEW: Download Badge + Share/Copy Link buttons
    ComposeEditorPanel.tsx     # MODIFIED: decode URL hash on mount, auto-analyze
    ComposeResultsPanel.tsx    # MODIFIED: render ComposeShareActions after violations/empty state
```

### Pattern 1: SVG Badge Generation (Mirror Dockerfile Analyzer)
**What:** Build an SVG string from `ComposeScoreResult`, rasterize via Canvas API, trigger browser download
**When to use:** SHARE-01 badge download
**Example:**
```typescript
// Source: src/lib/tools/dockerfile-analyzer/badge-generator.ts (existing pattern)
// Adapted for compose categories

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  semantic: 'Semantic',
  'best-practice': 'Best Practice',
  schema: 'Schema',
  style: 'Style',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444',
  semantic: '#3b82f6',
  'best-practice': '#06b6d4',
  schema: '#f59e0b',
  style: '#8b5cf6',
};

export function buildComposeBadgeSvg(score: ComposeScoreResult): string {
  // Same SVG construction as dockerfile badge-generator.ts
  // Change title text: "Docker Compose Analysis"
  // Change footer URL: "patrykgolabek.dev/tools/compose-validator"
  // Uses compose CATEGORY_LABELS and CATEGORY_COLORS above
  // 5 categories instead of 5, dimensions remain 400x200
}

export async function downloadComposeBadgePng(score: ComposeScoreResult): Promise<void> {
  // Identical logic: SVG -> Blob -> Image -> Canvas -> toBlob -> anchor download
  // Change filename: `compose-score-${score.overall}-${score.grade}.png`
  // Retina-aware: Math.min(window.devicePixelRatio || 1, 3)
}
```

### Pattern 2: URL State Encoding (Mirror Dockerfile Analyzer)
**What:** Compress YAML content into URL hash, decode on page load, auto-trigger analysis
**When to use:** SHARE-02 URL encoding
**Example:**
```typescript
// Source: src/lib/tools/dockerfile-analyzer/url-state.ts (existing pattern)
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

const HASH_PREFIX = '#compose=';  // Different from '#dockerfile='

export function encodeToHash(content: string): string {
  return `${HASH_PREFIX}${compressToEncodedURIComponent(content)}`;
}

export function decodeFromHash(): string | null {
  const hash = globalThis.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const compressed = hash.slice(HASH_PREFIX.length);
  if (!compressed) return null;
  try {
    return decompressFromEncodedURIComponent(compressed);
  } catch {
    return null;
  }
}

export function buildShareUrl(content: string): string {
  const base = globalThis.location.origin + globalThis.location.pathname;
  return `${base}${encodeToHash(content)}`;
}

export function isUrlSafeLength(content: string): { safe: boolean; length: number } {
  const url = buildShareUrl(content);
  return { safe: url.length <= 2000, length: url.length };
}
```

### Pattern 3: Platform-Adaptive Share (Enhancement over Dockerfile Analyzer)
**What:** Use Web Share API on mobile, Clipboard API on desktop, text URL select fallback
**When to use:** SHARE-03 sharing
**Example:**
```typescript
// Enhancement: navigator.share on mobile, clipboard.writeText on desktop
const handleShare = async () => {
  const url = buildShareUrl(content);

  // Mobile: use native share sheet if available
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Docker Compose Score: ${score.grade} (${score.overall}/100)`,
        text: 'Check out my Docker Compose validation results!',
        url,
      });
      return;
    } catch (err) {
      // User cancelled or API failed -- fall through to clipboard
      if ((err as DOMException).name === 'AbortError') return;
    }
  }

  // Desktop: copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    history.replaceState(null, '', url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    // Final fallback: prompt user to copy manually
    prompt('Copy this URL:', url);
  }
};
```

### Pattern 4: URL Decode + Auto-Analyze on Mount (Mirror Dockerfile Analyzer)
**What:** Decode hash content before editor creation, auto-trigger analysis
**When to use:** Loading a shared link
**Example:**
```typescript
// Source: src/components/tools/EditorPanel.tsx (existing pattern)
// In ComposeEditorPanel:

// Decode BEFORE editor creation (synchronous)
const hashContentRef = useRef<string | null>(
  typeof window !== 'undefined' ? decodeFromHash() : null,
);
const initialDoc = hashContentRef.current || SAMPLE_COMPOSE;

// Pass initialDoc to useCodeMirrorYaml
const { containerRef, viewRef } = useCodeMirrorYaml({
  initialDoc,  // <-- Now uses hash content if present
  onAnalyze: () => { ... },
});

// Auto-trigger analysis after mount when loaded from URL
useEffect(() => {
  if (hashContentRef.current && viewRef.current) {
    analyzeRef.current(viewRef.current);
  }
}, []);
```

### Anti-Patterns to Avoid
- **Rendering badge with html2canvas/html-to-image:** These libraries add dependencies and are slower. The existing pure SVG string approach is proven, zero-dependency, and produces crisp results.
- **Storing state in URL search params instead of hash:** Hash changes do not cause server requests or page reloads. Search params would trigger Astro server requests in SSR mode.
- **Using `document.execCommand('copy')` directly:** Deprecated API. Use `navigator.clipboard.writeText()` first, with `prompt()` as a last-resort fallback.
- **Calling navigator.share() without feature detection:** Will throw on Firefox desktop. Always check `navigator.share` existence first.
- **Not clamping devicePixelRatio:** Extremely high-DPI devices can create massive canvases. Clamp to 3x maximum (matching existing pattern).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL-safe compression | Custom base64/encoding | lz-string `compressToEncodedURIComponent` | Handles URI encoding, good compression ratio, already installed |
| PNG rasterization | Server-side image generation | Canvas API `toBlob('image/png')` | Native browser API, zero-dependency, retina-aware |
| Mobile share sheet | Custom share dialog UI | `navigator.share()` | Native OS integration, handles all share targets automatically |
| Clipboard access | `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Modern API, Promise-based, Baseline since March 2020 |

**Key insight:** Every piece of this phase has a proven pattern in the existing Dockerfile Analyzer. The work is adaptation (category labels, colors, hash prefix, tool name), not invention. The only genuinely new code is the Web Share API integration, which is a thin feature-detection wrapper.

## Common Pitfalls

### Pitfall 1: SVG Image Loading Race Condition
**What goes wrong:** The `img.onload` callback for SVG-to-Canvas rendering fires before the SVG is fully painted, producing a blank or partial PNG.
**Why it happens:** SVG rendering is asynchronous even after `img.src` is set.
**How to avoid:** The existing pattern correctly uses `new Promise` with `img.onload`/`img.onerror` callbacks. Mirror it exactly.
**Warning signs:** Blank or partially rendered badge PNG downloads.

### Pitfall 2: URL Length Exceeding Platform Limits
**What goes wrong:** Large YAML files produce URLs that exceed browser/platform URL length limits (typically 2000-8000 characters).
**Why it happens:** Docker Compose files can be large (100+ lines with many services).
**How to avoid:** Use `isUrlSafeLength()` to warn users when URL exceeds 2000 characters. Display amber warning text (matching existing pattern).
**Warning signs:** Share links that get truncated when pasted into social media, messaging apps, or email clients.

### Pitfall 3: Web Share API Requires User Activation
**What goes wrong:** `navigator.share()` throws `NotAllowedError` when called outside a user gesture (click/tap event).
**Why it happens:** Browser security requirement -- transient activation needed.
**How to avoid:** Only call from button click handlers. Never from `useEffect`, timers, or async chains that lose the user activation context.
**Warning signs:** Console error "NotAllowedError: Failed to execute 'share' on 'Navigator'".

### Pitfall 4: Web Share API AbortError on Cancel
**What goes wrong:** When user opens native share sheet then cancels, `navigator.share()` rejects with `AbortError`. If not handled, this looks like an error.
**Why it happens:** Cancellation is a normal user flow, not an error.
**How to avoid:** Catch the rejection and check `err.name === 'AbortError'` -- do not show error UI for cancellations.
**Warning signs:** Error toasts or console errors when user cancels the share sheet.

### Pitfall 5: Hash Prefix Collision Between Tools
**What goes wrong:** If both Dockerfile Analyzer and Compose Validator use the same hash prefix, loading one tool's share link on the other's page produces garbage.
**Why it happens:** Both tools live under `/tools/` with similar URL structures.
**How to avoid:** Use distinct hash prefixes: `#dockerfile=` (existing) and `#compose=` (new). The `decodeFromHash()` function returns `null` for unrecognized prefixes.
**Warning signs:** Loading a Dockerfile share link on the compose validator page shows corrupt YAML.

### Pitfall 6: Canvas Security Taint with External Fonts
**What goes wrong:** Canvas `toBlob()` throws a SecurityError if the SVG references fonts that trigger a cross-origin load.
**Why it happens:** Browser canvas taint security model.
**How to avoid:** Use only system fonts (`system-ui, sans-serif`, `monospace`) in the SVG badge -- no `@font-face` or Google Fonts. The existing badge pattern already does this correctly.
**Warning signs:** "SecurityError: The operation is insecure" on `canvas.toBlob()`.

### Pitfall 7: SSR/Build-Time Access to `window` / `globalThis.location`
**What goes wrong:** `decodeFromHash()` accesses `globalThis.location.hash` which is undefined during SSR/build.
**Why it happens:** Astro renders pages at build time; `window` does not exist.
**How to avoid:** Guard with `typeof window !== 'undefined'` before calling `decodeFromHash()` (matching existing EditorPanel pattern). The compose validator uses `client:only="react"` which avoids SSR, but the guard is still good practice.
**Warning signs:** Build-time crash: "location is not defined".

## Code Examples

Verified patterns from existing codebase:

### Badge SVG Construction (Compose-Adapted)
```typescript
// Adapted from: src/lib/tools/dockerfile-analyzer/badge-generator.ts
// Key differences: 5 compose categories, compose-specific labels/colors

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  semantic: 'Semantic',
  'best-practice': 'Best Practice',
  schema: 'Schema',
  style: 'Style',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444',     // Red
  semantic: '#3b82f6',     // Blue
  'best-practice': '#06b6d4', // Cyan
  schema: '#f59e0b',       // Amber
  style: '#8b5cf6',        // Violet
};

// Title line: 'Docker Compose Analysis' instead of 'Dockerfile Analysis'
// Footer: 'patrykgolabek.dev/tools/compose-validator'
// Filename: `compose-score-${overall}-${grade}.png`
```

### ComposeEditorPanel URL Decode Integration
```typescript
// Source: src/components/tools/EditorPanel.tsx (pattern to mirror)
// Add to ComposeEditorPanel.tsx:

import { decodeFromHash } from '../../lib/tools/compose-validator/url-state';

// Before editor creation -- synchronous decode
const hashContentRef = useRef<string | null>(
  typeof window !== 'undefined' ? decodeFromHash() : null,
);
const initialDoc = hashContentRef.current || SAMPLE_COMPOSE;

// After editor mount -- auto-analyze if loaded from hash
useEffect(() => {
  if (hashContentRef.current && viewRef.current) {
    analyzeRef.current(viewRef.current);
  }
}, []);
```

### ComposeShareActions Component Structure
```typescript
// Adapted from: src/components/tools/results/ShareActions.tsx
// Key additions: navigator.share() for mobile, compose-specific imports

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  composeResult,
  composeEditorViewRef,
} from '../../../stores/composeValidatorStore';
import { downloadComposeBadgePng } from '../../../lib/tools/compose-validator/badge-generator';
import {
  buildShareUrl,
  isUrlSafeLength,
} from '../../../lib/tools/compose-validator/url-state';

export function ComposeShareActions() {
  const result = useStore(composeResult);
  const [copied, setCopied] = useState(false);
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (!result || !result.parseSuccess) return null;

  // Share handler with Web Share API -> Clipboard -> prompt fallback
  const handleShare = async () => {
    const view = composeEditorViewRef.get();
    if (!view) return;
    const content = view.state.doc.toString();
    if (!content.trim()) return;

    const { safe, length } = isUrlSafeLength(content);
    if (!safe) {
      setUrlWarning(`URL is ${length.toLocaleString()} chars -- may be truncated`);
    } else {
      setUrlWarning(null);
    }

    const url = buildShareUrl(content);

    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Compose Score: ${result.score.grade} (${result.score.overall}/100)`,
          url,
        });
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        // Fall through to clipboard
      }
    }

    // Clipboard fallback (desktop)
    try {
      await navigator.clipboard.writeText(url);
      history.replaceState(null, '', url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this URL:', url);
    }
  };

  // Render: Download Badge button + Share/Copy Link button + URL warning
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Baseline March 2020 | Modern async API; deprecated method still works as fallback |
| No native share | `navigator.share()` | Widely supported 2023+ | Native share sheet on mobile; 92.48% global coverage |
| Data URLs for images | `URL.createObjectURL()` + `URL.revokeObjectURL()` | Current best practice | Better memory management; avoids base64 overhead |
| html2canvas for screenshots | Pure SVG string + Canvas API | N/A (this codebase) | Zero-dependency, faster, crisper output |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated but functional. Use as last-resort fallback only behind `navigator.clipboard.writeText()`.
- `window.prompt()` for URL copy: Crude but universal fallback when clipboard API fails (e.g., non-HTTPS development).

## Open Questions

1. **Should ComposeShareActions include a PromptGenerator (AI Fix Prompt) like the Dockerfile Analyzer?**
   - What we know: The Dockerfile Analyzer includes a "Copy AI Fix Prompt" button in ShareActions. The Compose Validator has the same violation metadata structure.
   - What's unclear: Whether this is in scope for Phase 37 or should be deferred.
   - Recommendation: Include it -- the code pattern is identical, and it adds user value. However, if Phase 37 scope should be minimal, defer to a future phase. The SHARE-01/02/03 requirements do not mention it.

2. **Should the badge show 5 categories (matching compose) even though the SVG is 400x200?**
   - What we know: Dockerfile Analyzer badge shows 5 categories (security, efficiency, maintainability, reliability, best-practice) in a 400x200 SVG. Compose Validator also has exactly 5 categories.
   - What's unclear: Nothing -- 5 categories fit the same layout exactly.
   - Recommendation: Use the same 400x200 layout. 5 categories = same spacing as Dockerfile Analyzer.

## Sources

### Primary (HIGH confidence)
- `src/lib/tools/dockerfile-analyzer/badge-generator.ts` -- existing badge SVG generation and PNG download pattern
- `src/lib/tools/dockerfile-analyzer/url-state.ts` -- existing lz-string URL hash encoding/decoding
- `src/components/tools/results/ShareActions.tsx` -- existing share actions UI component with badge download + clipboard copy
- `src/components/tools/EditorPanel.tsx` -- existing URL decode on mount + auto-analyze pattern
- `src/lib/tools/compose-validator/types.ts` -- `ComposeScoreResult`, `ComposeCategoryScore` type definitions
- `src/stores/composeValidatorStore.ts` -- existing nanostore atoms
- MDN Web Docs: `navigator.share()` -- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- MDN Web Docs: `navigator.clipboard.writeText()` -- https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText

### Secondary (MEDIUM confidence)
- Can I Use: Web Share API -- https://caniuse.com/web-share -- 92.48% global coverage, Firefox desktop NOT supported
- Can I Use: Clipboard API -- Baseline since March 2020, universally supported

### Tertiary (LOW confidence)
- None -- all findings verified against existing codebase and official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- lz-string already installed; Canvas/Clipboard/Web Share are native browser APIs
- Architecture: HIGH -- all patterns directly mirror existing Dockerfile Analyzer implementation verified in codebase
- Pitfalls: HIGH -- identified from existing codebase patterns and MDN documentation; 7 specific pitfalls catalogued

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable browser APIs, no expected breaking changes)
