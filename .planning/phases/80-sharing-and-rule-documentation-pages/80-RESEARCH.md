# Phase 80: Sharing and Rule Documentation Pages - Research

**Researched:** 2026-03-04
**Domain:** Browser sharing APIs, URL state encoding, static page generation, Canvas PNG rendering
**Confidence:** HIGH

## Summary

This phase adds two complementary feature sets to the GitHub Actions Workflow Validator: (1) sharing capabilities (score badge PNG download, URL state encoding with `#gha=` prefix, and a 3-tier share fallback) and (2) per-rule SEO documentation pages at `/tools/gha-validator/rules/[code]`. Both feature sets follow well-established patterns already proven in the codebase (compose-validator has identical rule documentation pages) and use mature browser APIs.

The sharing features are straightforward: Canvas API for PNG badge generation (no external library needed), `lz-string` (already installed, v1.5.0) for URL hash encoding, and Web Share API / Clipboard API / prompt() as a 3-tier fallback. The rule documentation pages follow the exact `[code].astro` + `getStaticPaths()` pattern from `src/pages/tools/compose-validator/rules/[code].astro`. The main implementation gap is that schema rules (GA-S001 through GA-S008) currently lack metadata objects -- they need to be created following the `actionlintMeta()` factory pattern to bring `allDocumentedGhaRules` from 40 to 48 entries.

**Primary recommendation:** Follow the compose-validator rule page pattern exactly, add schema rule metadata objects, use Canvas API for badge PNG (no external dep), and use `lz-string.compressToEncodedURIComponent` for URL state encoding.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHARE-01 | Score badge download as PNG image for social media sharing | Canvas API `toBlob()` + `URL.createObjectURL()` for download trigger. Render SVG gauge to canvas at 2x resolution for crisp badge. No external library needed. |
| SHARE-02 | URL state encoding with `#gha=` hash prefix (lz-string compression) | `lz-string` v1.5.0 already installed. Use `compressToEncodedURIComponent()` / `decompressFromEncodedURIComponent()`. Encode raw YAML, read from `window.location.hash` on load. |
| SHARE-03 | 3-tier share fallback (Web Share API > Clipboard API > prompt()) | Feature-detect `navigator.share`, fall back to `navigator.clipboard.writeText()`, then `window.prompt()` with pre-selected URL text. |
| DOC-01 | Per-rule SEO documentation pages at `/tools/gha-validator/rules/[code]` | Astro `getStaticPaths()` pattern proven in compose-validator. Need to extend `allDocumentedGhaRules` to include 8 schema rules (GA-S001--GA-S008), bringing total to 48 pages. |
| DOC-02 | Each rule page includes expert explanation, fix suggestion, before/after YAML code | All `GhaLintRule` objects already carry `explanation`, `fix.description`, `fix.beforeCode`, `fix.afterCode`. Schema rules need these fields added. |
| DOC-03 | Rule pages include severity badge, category tag, and related rules links | Follow compose-validator severity/category badge pattern. Create `getRelatedGhaRules()` mirroring `getRelatedComposeRules()`. |
| DOC-04 | GA-L017/GA-L018 rule pages note browser WASM limitation with CLI recommendation | GA-L017 and GA-L018 already have `category: 'actionlint'` and explanations mentioning WASM limitation. Add a visible callout banner on their rule pages. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static page generation with `getStaticPaths()` | Already used; `output: 'static'` with `trailingSlash: 'always'` |
| lz-string | ^1.5.0 | URL-safe compression for hash state encoding | Already installed; `compressToEncodedURIComponent` is URI-safe |
| Canvas API | Browser native | PNG badge rendering from SVG gauge | No external dependency; `toBlob()` + download anchor |
| Web Share API | Browser native | Native sharing on supported platforms | Progressive enhancement; feature-detect with `navigator.share` |
| Clipboard API | Browser native | Copy-to-clipboard fallback | `navigator.clipboard.writeText()`; Baseline since March 2025 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro:components | Built-in | `<Code>` component for syntax-highlighted YAML blocks | Rule page before/after code examples |
| BreadcrumbJsonLd | Existing component | Structured data for rule page breadcrumbs | Every rule documentation page |
| FAQPageJsonLd | Existing component | Structured data for FAQ schema markup | Every rule documentation page |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canvas API | html-to-image (npm) | External dep for simple SVG-to-PNG; Canvas API is sufficient for the gauge |
| Canvas API | dom-to-image-more | Same tradeoff; adds ~15KB for something Canvas does natively |
| lz-string | pako (gzip) | lz-string already installed, URI-safe output built-in; pako needs Base64 wrapper |

**Installation:**
```bash
# No new packages needed -- lz-string already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/tools/gha-validator/
│   ├── rules/
│   │   ├── schema/                    # NEW: GA-S001--GA-S008 metadata
│   │   │   ├── GA-S001-yaml-syntax.ts
│   │   │   ├── GA-S002-unknown-property.ts
│   │   │   ├── ...
│   │   │   └── index.ts
│   │   ├── related.ts                 # NEW: getRelatedGhaRules()
│   │   └── index.ts                   # UPDATE: include schema rules in allDocumentedGhaRules
│   ├── share/                         # NEW: sharing utilities
│   │   ├── badge-png.ts               # Canvas badge renderer
│   │   ├── url-state.ts               # lz-string hash encoding/decoding
│   │   └── share-fallback.ts          # 3-tier share helper
│   └── types.ts                       # Possibly extend with schema metadata type
├── components/tools/
│   ├── GhaEditorPanel.tsx             # UPDATE: read hash state on mount
│   └── GhaResultsPanel.tsx            # UPDATE: add Share/Download buttons
├── pages/tools/gha-validator/
│   └── rules/
│       └── [code].astro               # NEW: per-rule documentation pages
```

### Pattern 1: Static Path Generation from Rule Registry
**What:** Use Astro's `getStaticPaths()` to generate one page per rule from the `allDocumentedGhaRules` array.
**When to use:** For all 48 rule documentation pages (22 custom + 18 actionlint + 8 schema).
**Example:**
```typescript
// Source: Existing compose-validator pattern at src/pages/tools/compose-validator/rules/[code].astro
import { allDocumentedGhaRules } from '../../../../lib/tools/gha-validator/rules/index';

export function getStaticPaths() {
  return allDocumentedGhaRules.map((rule) => ({
    params: { code: rule.id.toLowerCase() },
    props: { rule },
  }));
}
```

### Pattern 2: Schema Rule Metadata Factory
**What:** Create metadata-only rule objects for GA-S001--GA-S008, matching the `GhaLintRule` interface with no-op `check()` methods (same pattern as `actionlintMeta()`).
**When to use:** Schema rules currently exist only as categorized error mappings in `schema-validator.ts`. They need metadata objects for documentation pages.
**Example:**
```typescript
// Follows the actionlintMeta() factory pattern from actionlint-rules.ts
function schemaMeta(
  id: string,
  title: string,
  severity: GhaSeverity,
  explanation: string,
  fix: GhaRuleFix,
): GhaLintRule {
  return {
    id,
    title,
    severity,
    category: 'schema' as GhaCategory,
    explanation,
    fix,
    check(): GhaRuleViolation[] { return []; },
  };
}

export const GAS001 = schemaMeta(
  'GA-S001',
  'YAML syntax error',
  'error',
  'The workflow file contains invalid YAML syntax...',
  { description: 'Fix the YAML syntax error.', beforeCode: '...', afterCode: '...' },
);
```

### Pattern 3: Canvas Badge PNG Generation
**What:** Render a score badge to an off-screen canvas and trigger download via `toBlob()`.
**When to use:** SHARE-01 badge download.
**Example:**
```typescript
// Source: MDN Canvas API, HTMLCanvasElement.toBlob()
export function downloadScoreBadge(score: number, grade: string): void {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 2;
  const width = 200;
  const height = 80;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Draw badge background, score arc, grade text...
  // (Reproduce ScoreGauge SVG layout on canvas)

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gha-score-${score}-${grade}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
```

### Pattern 4: URL Hash State Encoding
**What:** Compress YAML content into URL hash for shareable links.
**When to use:** SHARE-02 URL state encoding.
**Example:**
```typescript
// Source: lz-string npm docs, pieroxy.net
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

export function encodeGhaState(yaml: string): string {
  return `#gha=${compressToEncodedURIComponent(yaml)}`;
}

export function decodeGhaState(hash: string): string | null {
  if (!hash.startsWith('#gha=')) return null;
  const compressed = hash.slice(5); // Remove '#gha='
  return decompressFromEncodedURIComponent(compressed);
}
```

### Pattern 5: 3-Tier Share Fallback
**What:** Progressive enhancement: Web Share API > Clipboard API > prompt().
**When to use:** SHARE-03 share functionality.
**Example:**
```typescript
// Source: MDN Navigator.share(), Clipboard API
export async function shareUrl(url: string, title: string): Promise<void> {
  // Tier 1: Web Share API (primarily mobile)
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // User cancelled
    }
  }

  // Tier 2: Clipboard API
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    // Show toast: "Link copied to clipboard"
    return;
  }

  // Tier 3: prompt() fallback
  window.prompt('Copy this link to share:', url);
}
```

### Anti-Patterns to Avoid
- **Over-engineering badge generation:** Do NOT use html-to-image or html2canvas for a simple score badge. The Canvas API is sufficient and avoids a new dependency.
- **Storing analysis results in URL:** Only encode the raw YAML in the URL hash. Re-run analysis on load. Storing violations/scores would make URLs enormous and couple them to rule versions.
- **Client-side dynamic rule pages:** Rule pages MUST be statically generated via `getStaticPaths()` for SEO. Do NOT create a single SPA page that renders rule content dynamically.
- **Missing `trailingSlash`:** Astro config requires `trailingSlash: 'always'`. All internal links to rule pages must end with `/` (e.g., `/tools/gha-validator/rules/ga-c001/`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL-safe compression | Custom Base64 + compression | `lz-string.compressToEncodedURIComponent()` | Handles URI encoding edge cases, well-tested, already installed |
| Share functionality | Custom share dialog | Web Share API with Clipboard API fallback | Native UX, platform-appropriate share targets |
| YAML syntax highlighting | Custom code renderer | Astro `<Code>` component with `lang="yaml"` | Built-in, SSR-rendered, already used in compose-validator rule pages |
| Related rules lookup | Hardcoded related rule arrays | Category-based `getRelatedGhaRules()` function | Same pattern as compose-validator; auto-updates when rules change |
| JSON-LD structured data | Manual script tags | `BreadcrumbJsonLd` + `FAQPageJsonLd` components | Already exist, consistent with rest of site |

**Key insight:** The compose-validator already implements the exact same rule documentation page pattern. Mirror it for GHA rules to minimize implementation risk and maintain site consistency.

## Common Pitfalls

### Pitfall 1: Schema Rules Missing from Documentation Registry
**What goes wrong:** `allDocumentedGhaRules` currently has 40 rules (22 custom + 18 actionlint). Schema rules GA-S001 through GA-S008 are NOT included. Without them, `getStaticPaths()` will only generate 40 pages, and clicking schema rule links from the violation list will 404.
**Why it happens:** Schema violations are generated by `categorizeSchemaErrors()` in `schema-validator.ts` without corresponding `GhaLintRule` metadata objects.
**How to avoid:** Create 8 schema metadata objects (following `actionlintMeta()` pattern), add them to `allDocumentedGhaRules`, update the test assertion from 40 to 48.
**Warning signs:** The test `allDocumentedGhaRules has 40 documented rules` in `style-rules.test.ts:333` will need updating.

### Pitfall 2: URL Hash Too Long for Browsers
**What goes wrong:** Very large YAML files compressed with lz-string can produce URLs exceeding browser limits (IE: ~2083 chars, modern: ~65K chars but practically ~8K for sharing).
**Why it happens:** Some workflows are 500+ lines. Even compressed, they may exceed practical URL length limits.
**How to avoid:** Check compressed length before encoding. If too long (> 6000 chars), warn the user that the link may not work in all contexts. Show a fallback message.
**Warning signs:** Share button produces extremely long URLs; links break when pasted into social media or messaging apps.

### Pitfall 3: Canvas Badge DPR/Resolution Issues
**What goes wrong:** Badge PNG looks blurry on high-DPI displays or when shared on social media.
**Why it happens:** Canvas rendered at 1x resolution on a 2x+ screen, or exported at low resolution.
**How to avoid:** Always render at 2x or 3x resolution (`window.devicePixelRatio`). Set canvas dimensions to `width * dpr` and use `ctx.scale(dpr, dpr)`.
**Warning signs:** Badge looks pixelated compared to the live SVG gauge.

### Pitfall 4: Web Share API Cancellation Error
**What goes wrong:** User cancels the native share dialog and the app shows an error.
**Why it happens:** `navigator.share()` rejects with `AbortError` when user cancels, which is expected behavior.
**How to avoid:** Catch `AbortError` specifically and treat it as a no-op.
**Warning signs:** Console errors or user-visible error messages when cancelling share.

### Pitfall 5: Hash Change Race Condition
**What goes wrong:** URL hash is read before CodeMirror editor is mounted, so the decoded YAML is dropped.
**Why it happens:** React component lifecycle -- hash read happens before editor ref is available.
**How to avoid:** Read hash in a `useEffect` that runs after editor mount, or store decoded content and apply it when editor becomes available.
**Warning signs:** Shared links open with the default sample workflow instead of the shared content.

### Pitfall 6: Rule ID Case Mismatch
**What goes wrong:** Links to rule pages use uppercase IDs (e.g., `/rules/GA-C001/`) but `getStaticPaths` generates lowercase (e.g., `/rules/ga-c001/`).
**Why it happens:** Inconsistency between rule ID casing and URL slug generation.
**How to avoid:** Always use `.toLowerCase()` for URL params in `getStaticPaths` and in all links. Violation list already does this correctly (line 111 of GhaViolationList.tsx).
**Warning signs:** 404 errors when clicking rule ID links from the results panel.

## Code Examples

Verified patterns from existing codebase:

### Rule Page getStaticPaths (proven pattern)
```typescript
// Source: src/pages/tools/compose-validator/rules/[code].astro
export function getStaticPaths() {
  return allDocumentedRules.map((rule) => ({
    params: { code: rule.id.toLowerCase() },
    props: { rule },
  }));
}
```

### Related Rules Function (proven pattern)
```typescript
// Source: src/lib/tools/compose-validator/rules/related.ts
const SEVERITY_ORDER: Record<GhaSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function getRelatedGhaRules(ruleId: string, limit = 5): GhaLintRule[] {
  const rule = allDocumentedGhaRules.find((r) => r.id === ruleId);
  if (!rule) return [];
  return allDocumentedGhaRules
    .filter((r) => r.category === rule.category && r.id !== ruleId)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, limit);
}
```

### Existing Rule Link Pattern (already implemented)
```tsx
// Source: src/components/tools/gha-results/GhaViolationList.tsx:111
<a
  href={`/tools/gha-validator/rules/${violation.ruleId.toLowerCase()}/`}
  className="font-mono text-xs text-[var(--color-accent)] hover:underline"
  onClick={(e) => e.stopPropagation()}
>
  {violation.ruleId}
</a>
```

### lz-string Usage
```typescript
// Source: lz-string npm package docs
import LZString from 'lz-string';

// Encode: produces URI-safe string (no URL encoding needed)
const compressed = LZString.compressToEncodedURIComponent(yamlContent);
window.location.hash = `gha=${compressed}`;

// Decode: on page load
const hash = window.location.hash.slice(1); // Remove '#'
if (hash.startsWith('gha=')) {
  const yaml = LZString.decompressFromEncodedURIComponent(hash.slice(4));
  if (yaml) {
    // Load into editor
  }
}
```

### Canvas Badge Download
```typescript
// Source: MDN HTMLCanvasElement.toBlob()
canvas.toBlob((blob) => {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gha-score-${score}-${grade}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}, 'image/png');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| html2canvas for DOM screenshots | Canvas API for simple graphics, html-to-image for complex DOM | 2024+ | Canvas API is zero-dependency for simple badge rendering |
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Baseline March 2025 | Async, secure (requires HTTPS), cleaner API |
| Query string state (`?state=`) | Hash state (`#state=`) | Convention | Hash changes don't trigger page reload; better for SPA-like tools |
| Custom compression | lz-string | Stable since 2014 | Battle-tested, URI-safe output format built in |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated in favor of Clipboard API. Still works but should not be primary approach.
- `toDataURL()` for large images: `toBlob()` is more memory-efficient for downloads.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/tools/gha-validator --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHARE-01 | Badge PNG download function generates valid canvas | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/badge-png.test.ts -x` | No -- Wave 0 |
| SHARE-02 | URL state encode/decode roundtrip with lz-string | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/url-state.test.ts -x` | No -- Wave 0 |
| SHARE-03 | Share fallback tier selection logic | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/share-fallback.test.ts -x` | No -- Wave 0 |
| DOC-01 | allDocumentedGhaRules has 48 entries; getStaticPaths generates all | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Yes -- update assertion |
| DOC-02 | Every rule has explanation, fix.description, fix.beforeCode, fix.afterCode | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/schema-rules.test.ts -x` | No -- Wave 0 |
| DOC-03 | getRelatedGhaRules returns same-category rules sorted by severity | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/related-rules.test.ts -x` | No -- Wave 0 |
| DOC-04 | GA-L017 and GA-L018 have actionlint category and WASM limitation text | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/semantic-rules.test.ts -x` | Yes -- extend |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/tools/gha-validator --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/tools/gha-validator/__tests__/url-state.test.ts` -- covers SHARE-02 roundtrip
- [ ] `src/lib/tools/gha-validator/__tests__/share-fallback.test.ts` -- covers SHARE-03 tier logic (mock navigator)
- [ ] `src/lib/tools/gha-validator/rules/__tests__/schema-rules.test.ts` -- covers DOC-02 schema metadata completeness
- [ ] `src/lib/tools/gha-validator/rules/__tests__/related-rules.test.ts` -- covers DOC-03 related rules function
- [ ] Update `style-rules.test.ts` assertion: `allDocumentedGhaRules` count from 40 to 48

Note: SHARE-01 badge PNG test requires Canvas API mocking (jsdom limitation). Test the badge rendering function logic (color selection, dimensions) without actual canvas calls, or mark as manual-only with visual verification.

## Open Questions

1. **Badge Design Details**
   - What we know: ScoreGauge is an SVG circle with score number and letter grade. Badge should be downloadable PNG.
   - What's unclear: Exact badge dimensions for social media (Twitter/LinkedIn cards expect specific aspect ratios). Should it include "GitHub Actions Validator" branding text?
   - Recommendation: Use a 400x200 badge (2:1 aspect ratio) at 2x DPR with score gauge on left, grade + "GHA Validator Score" text on right. This works for both social media embedding and README badges.

2. **URL Length Limits for Sharing**
   - What we know: lz-string compression is very efficient. A typical 50-line workflow compresses to ~500 chars.
   - What's unclear: Should there be a hard cutoff? What happens with 500+ line workflows?
   - Recommendation: Implement soft limit at 6000 chars compressed. Show warning but still allow sharing. Most social media and messaging platforms handle up to 8000+ chars.

3. **Schema Rule Page Content Quality**
   - What we know: Schema rules (GA-S001--GA-S008) need metadata objects with explanations and fix examples. The ajv error categories are clear.
   - What's unclear: How detailed should schema rule explanations be? They're more generic than custom rules.
   - Recommendation: Write explanations at the same quality level as security/best-practice rules. Reference GitHub Actions schema documentation for accuracy.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/pages/tools/compose-validator/rules/[code].astro` -- proven rule page pattern
- Existing codebase: `src/lib/tools/gha-validator/rules/index.ts` -- `allDocumentedGhaRules` registry (40 rules, needs 48)
- Existing codebase: `src/lib/tools/compose-validator/rules/related.ts` -- related rules function pattern
- Existing codebase: `src/components/tools/gha-results/GhaViolationList.tsx:111` -- rule ID links already point to `/tools/gha-validator/rules/`
- Existing codebase: `package.json` -- `lz-string` ^1.5.0 already installed
- [MDN HTMLCanvasElement.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) -- Canvas PNG export
- [MDN Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) -- Web Share API
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) -- Clipboard fallback

### Secondary (MEDIUM confidence)
- [lz-string official docs](https://pieroxy.net/blog/pages/lz-string/index.html) -- compression API reference
- [lz-string GitHub](https://github.com/pieroxy/lz-string) -- `compressToEncodedURIComponent` details

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, browser APIs well-documented
- Architecture: HIGH -- exact same pattern exists in compose-validator (proven in production)
- Pitfalls: HIGH -- identified through codebase analysis (schema rules gap, existing test assertions)
- Sharing APIs: HIGH -- MDN documentation, widely adopted browser APIs

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable domain, no fast-moving dependencies)
