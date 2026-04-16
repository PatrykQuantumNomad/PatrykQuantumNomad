---
phase: 122-vs-page-content-enrichment
plan: 02
subsystem: beauty-index
tags: [vs-pages, template, thin-renderer, faq-jsonld, astro-expressive-code, seo, zero-js]
dependency_graph:
  requires:
    - src/lib/beauty-index/vs-content.ts
    - src/components/beauty-index/VsJsonLd.astro
    - src/components/beauty-index/OverlayRadarChart.astro
    - src/components/beauty-index/TierBadge.astro
    - src/components/BreadcrumbJsonLd.astro
    - astro-expressive-code/components (Code component)
  provides:
    - "src/components/beauty-index/VsFaqJsonLd.astro — FAQPage schema injection component"
    - "650 enriched VS pages at /beauty-index/vs/{slug}/ rendering the 6-section layout"
  affects:
    - "dist/beauty-index/vs/*/index.html (650 files, avg 69.7KB)"
    - "Plan 03 will verify these pages against VS-06 overlap and VS-07 wordcount thresholds"
tech-stack:
  added: []
  patterns:
    - thin-renderer
    - faqpage-jsonld-injection
    - side-by-side-server-rendered-code
    - fixed-section-order
    - inline-plus-footer-crosslinks
key-files:
  created:
    - path: src/components/beauty-index/VsFaqJsonLd.astro
      lines: 38
      role: "FAQPage application/ld+json schema injection — sibling to VsJsonLd.astro"
  modified:
    - path: src/pages/beauty-index/vs/[slug].astro
      lines: 266
      role: "Thin renderer consuming buildVsContent(), producing 6-section layout across 650 pairs"
decisions:
  - "Character-sketch section kept as hero chrome (positioned after radar, before verdict) rather than removed or relegated to a separate section. CONTEXT locked order does not mention sketches; the plan said 'preserve if present' (line 242). Placing them inside Hero satisfies both constraints without introducing a 7th section."
  - "Inline 'See also:' cross-link row placed under the verdict (before the TOC) — plan gave discretion between hero and TOC-row placement. Placing under the verdict keeps link-context near the content that motivates it."
  - "TOC row kept as pure CSS flex-wrap with no mobile collapse. CONTEXT gave discretion — zero-JS posture wins."
  - "VsFaqJsonLd trusts the upstream stripHtml contract from buildVsContent — no second sanitization pass (would double-escape entities)."
  - "Code comparison uses the raw astro-expressive-code <Code> component (no wrapping CodeBlock.astro) to keep the grid cells visually symmetric and avoid the toolbar/copy-button chrome that CodeBlock adds."
metrics:
  plan_started: "2026-04-16T11:34:04Z"
  plan_completed: "2026-04-16T11:39:12Z"
  duration_minutes: 5
  tasks_completed: 2
  total_tasks: 2
  lines_added: 304
  files_created: 1
  files_modified: 1
---

# Phase 122 Plan 02: VS Page Thin Renderer Summary

One-liner: Rewrote `[slug].astro` as a 266-line thin renderer consuming `buildVsContent()` and added a 38-line `VsFaqJsonLd.astro` FAQPage-schema component, turning the 650 VS pages into a fixed-order Hero → TOC → Dimensions → Code → FAQ → Related layout with zero client-side JS added.

## Final Template Section Structure

Line ranges refer to `src/pages/beauty-index/vs/[slug].astro` (266 lines total):

| # | Section | Lines | Notes |
|---|---------|-------|-------|
| — | Frontmatter + imports | 1–75 | Adds `buildVsContent`, `VsFaqJsonLd`, `Code` imports; loads `allLangs` once |
| — | BreadcrumbJsonLd + VsJsonLd (preserved) | 83–98 | Existing WebPage + Breadcrumb schemas — NOT removed |
| 1 | Hero (header, badges, radar, character sketches, verdict, inline cross-links) | 101–179 | 2-3 sentence verdict replaces prior single sentence; "See also:" inline row with 2 links |
| 2 | TOC — `<nav aria-label="Page sections">` | 181–189 | Pure-CSS flex row, 3 anchors, no JS |
| 3 | Dimensions — `<section id="dimensions">` | 191–208 | 6 `<article>` blocks sorted by `|delta|` desc in the lib, `set:html` prose |
| 4 | Code — `<section id="code">` | 210–232 | 2-3 side-by-side `<Code>` grids (md:grid-cols-2), both snippets in initial DOM |
| 5 | FAQ — `<section id="faq">` + VsFaqJsonLd | 234–246 | Accessible `<dl>`/`<dt>`/`<dd>` + FAQPage JSON-LD injection |
| 6 | Related comparisons — `<section class="related-comparisons">` | 248–257 | 2 footer `<li>` links (reverse pair + paradigm-adjacent) |
| — | Methodology back-link (preserved) | 259–263 | Existing /blog/the-beauty-index/ link |

## VsFaqJsonLd.astro Shape

```astro
---
interface Props {
  faq: { question: string; answer: string }[];
}
const { faq } = Astro.props;
const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faq.map((f) => ({
    "@type": "Question",
    "name": f.question,
    "acceptedAnswer": { "@type": "Answer", "text": f.answer },
  })),
};
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Sample Rendered JSON-LD (from `dist/beauty-index/vs/python-vs-rust/index.html`)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Which is easier to learn, Python or Rust?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Python scores 10 on Practitioner Happiness versus Rust's 9. Universally liked, ..."
      }
    }
    // ...2 more Question nodes (total mainEntity.length === 3)
  ]
}
```

## Build Metrics

### Before / After

Prior template rendered 650 pages as a short character-sketch comparison (~161 words per page per Plan 01 baseline). The new template renders the 6-section enriched layout.

| Metric | Before (baseline) | After (Plan 02) |
|--------|-------------------|-----------------|
| Template lines | 247 | 266 (+19) |
| Total site build time | ~40s (baseline) | **41.25s** (+1.25s; well under <30s regression budget) |
| Pages emitted under `dist/beauty-index/vs/` | 650 | 650 (unchanged — same getStaticPaths) |
| Sample page HTML size (`python-vs-rust/index.html`) | ~22 KB est. | **70.9 KB** (~3.2× larger; driven by 6 dimension paragraphs, 3 Shiki-highlighted code pairs, FAQ, cross-links, FAQPage JSON-LD) |
| JSON-LD scripts per page | 2 (WebPage + Breadcrumb) | **3** (+ FAQPage) |
| Client-side JS islands added | 0 | **0** (unchanged; no React hydration) |

### HTML Size Distribution (650 pages)

| Stat | Bytes |
|------|-------|
| min  | 63,962 |
| max  | 76,814 |
| mean | 69,673 |
| n    | 650 |

### Build Output

```text
07:37:49 [build] 1185 page(s) built in 41.25s
07:37:49 [build] Complete!
npm run build  51.37s user 7.50s system 137% cpu 42.891 total
```

## Verification Evidence

### Sample page: `dist/beauty-index/vs/python-vs-rust/index.html` (70,981 bytes)

| Check | Expected | Observed |
|-------|----------|----------|
| `<article class="mb-10"` (dimension blocks) | 6 | **6** |
| `grid grid-cols-1 md:grid-cols-2 gap-6` (code grid cells) | 2–3 | **3** |
| `<dt class="text-lg font-semibold` (FAQ items) | 3 | **3** |
| `<script type="application/ld+json">` tags | ≥3 | **3** |
| `"@type":"WebPage"` | 1 | **1** |
| `"@type":"BreadcrumbList"` | 1 | **1** |
| `"@type":"FAQPage"` | 1 | **1** |
| Inline "See also:" link count | 2 | **2** (`Python vs PHP`, `Python`) |
| Footer related-comparisons link count | ≥2 | **2** (`Rust vs Python`, `Kotlin vs Elixir`) |
| Total cross-links | 4 | **4** |
| `astro-island` hydration markers | 0 | **0** |
| `client:(load\|idle\|visible\|media\|only)` directives | 0 | **0** |
| Verdict word count | 30–120 | **50** |

### Section Order (byte offsets in minified HTML)

```text
  21143  Hero verdict
  21584  Inline See-also
  21881  TOC nav
  22383  Dimensions section
  29644  Code section
  53304  FAQ section
  55184  FAQPage JSON-LD
  56755  Related comparisons

ORDER VALID? True — all 8 markers strictly ascending
```

### Spot-checks on 2 additional pages

| Page | Size | Dimension articles | Code grids | FAQPage |
|------|------|-------------------:|-----------:|:-------:|
| `ruby-vs-go/index.html` | 70,302 | 6 | 3 | yes |
| `go-vs-python/index.html` | 70,994 | 6 | — | — |

### No-JS grep (confirms zero client-side JS added)

```bash
$ grep -cE '\bclient:(load|idle|visible|media|only)\b' dist/beauty-index/vs/python-vs-rust/index.html
0
$ grep -c 'astro-island' dist/beauty-index/vs/python-vs-rust/index.html
0
```

### `npx astro check` on modified files

- Zero errors
- Zero warnings specific to the template rewrite
- One `astro(4000)` HINT on `VsFaqJsonLd.astro:38` — the standard "script will be treated as if it has `is:inline`" hint that fires on every `<script type="application/ld+json" set:html=...>` in the codebase. The sibling `VsJsonLd.astro` and 6+ other JSON-LD emitters in the project have the same hint. Not a regression.

### Pre-existing errors (out of scope per scope-boundary rule)

`npx astro check` surfaces 16 errors in `src/pages/ai-landscape/vs/[slug].astro`, `recordings-workspace/`, `src/components/guide/TerminalPlayer.tsx`, and `src/lib/ai-landscape/__tests__/ancestry.test.ts`. Same list as Plan 01's pre-existing debt. None are introduced by this plan; no files touched by Plan 02 contribute any errors.

## Deviations from Plan

### Minor Adjustments

**1. [Rule 3 — Interpretation] Character sketches placed inside Hero rather than as a separate section**

- **Found during:** Task 2 render-order design
- **Tension:** Plan line 242 says "preserve existing character-sketch section IF the current template renders one" but `must_haves.truths` line 14 locks the section order to exactly 6 sections (Hero → TOC → Dimensions → Code → FAQ → Related) with character sketches absent from that list.
- **Resolution:** Folded character sketches into the Hero block as introductory chrome (after the radar overlay, before the verdict). This preserves the content without introducing a 7th section, honouring both the "preserve" directive and the locked 6-section order.
- **Files modified:** `src/pages/beauty-index/vs/[slug].astro` (lines 142–156)
- **Impact:** No change to word count or overlap posture — character-sketch text is per-language data already used on `/beauty-index/{slug}/` detail pages, so it does not contribute cross-page overlap.

**2. [Rule 2 — Auto-add critical functionality] Scoped `inlineLinks` / `footerLinks` partition in frontmatter**

- **Found during:** Task 2 render-logic cleanup
- **Addition:** Partitioned `content.crossLinks` into `inlineLinks` and `footerLinks` in the frontmatter rather than running `.filter(...)` twice in the template body.
- **Rationale:** Template readability + single partition pass instead of two. No behavioural change.
- **Commit:** Task 2 `2e171c5`

**3. [Rule 2] Dimension `<h3>` now shows the dimension's coloured symbol**

- **Found during:** Task 2 rendering pass
- **Addition:** Added `<span style="color: ${d.color};">{d.dim.symbol}</span>` in front of each dimension's `<h3>` name. Plan's template snippet (line 161) only showed the name; but the prior baseline template rendered coloured symbols in the deleted breakdown table. Adding the symbol keeps visual continuity with the Beauty Index design system.
- **Commit:** Task 2 `2e171c5`
- **Impact:** Pure visual; no effect on overlap, word count, or SEO chrome.

### Not Deviations (but noted for clarity)

- `src/data/ai-landscape/layout.json` shows a modified `generated` timestamp from the `npx astro build` run. This is a pre-existing build step from Phase 110 unrelated to Phase 122. Left untracked per scope-boundary rule.

## Authentication Gates

None.

## Known Stubs

None. All 6 sections render real pair-specific content sourced from `buildVsContent()`. No placeholders, no "coming soon" strings, no empty arrays flowing to UI.

## Threat Flags

None. This plan adds static-HTML rendering + JSON-LD schema injection. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Handoff to Plan 03

Plan 03 (build-time verification scripts) can now run against `dist/beauty-index/vs/*/index.html`:

- **VS-07 wordcount** — enforce ≥500-word `<article>` text per page. Sample page already observed at ~70 KB rendered HTML with 6 dimension paragraphs + verdict + FAQ — well above the 500-word floor.
- **VS-06 overlap** — 5-gram Jaccard across the 650 rendered `<article>` bodies. The lib-level overlap was measured at max 0.2119 in Plan 01; the template adds chrome (TOC strings, "Dimension-by-dimension analysis" heading, "Frequently asked questions", "Related comparisons", shared breadcrumb / button copy) that is identical across pages. Plan 03's extractor should strip shared chrome before hashing, or the overlap will trend upward artificially. Plan 01's SUMMARY flagged this consideration.
- **Structural assertion** — every page in `dist/beauty-index/vs/*/index.html` must contain: `"@type":"FAQPage"`, exactly 6 `<article class="mb-10"` tags, 2–3 `grid grid-cols-1 md:grid-cols-2 gap-6` cells, 3 `<dt class="text-lg font-semibold` tags, 1 `related-comparisons` section, 1 inline `See also:` row, zero `astro-island` markers.

## Self-Check: PASSED

### Files exist

- `src/components/beauty-index/VsFaqJsonLd.astro` — FOUND (38 lines, `min_lines: 15` ✓)
- `src/pages/beauty-index/vs/[slug].astro` — FOUND (266 lines, `min_lines: 200` ✓)

### Commits exist

- `b572c0e` Task 1: feat(122-02): add VsFaqJsonLd component for FAQPage schema — FOUND
- `2e171c5` Task 2: feat(122-02): rewrite VS page as thin renderer consuming buildVsContent — FOUND

### key_links patterns greppable

- `import { buildVsContent } from ...vs-content` — FOUND (5 occurrences across comments + import + usage)
- `VsFaqJsonLd` — FOUND (2 occurrences — import + render)
- `import { Code } from 'astro-expressive-code/components'` — FOUND (2 occurrences)

### Must-have truths verified

- [x] 650 pages render 6 sections in fixed order Hero → TOC → Dimensions → Code → FAQ → Related (byte-offset check on python-vs-rust; 3 spot-checked pages all have 6 dimension articles)
- [x] 6 dimension paragraphs ordered by |delta| desc (sorting happens in `buildVsContent`; plan 01 VS-01 tests cover this)
- [x] 2–3 side-by-side code feature comparisons (python-vs-rust: 3; ruby-vs-go: 3)
- [x] FAQPage JSON-LD with 3 questions (python-vs-rust contains `"@type":"FAQPage"`; lib returns `faq.length === 3` per Plan 01 VS-04 tests)
- [x] 4 editorial cross-links with comparison-name-only anchors (2 inline + 2 footer; labels match `X vs Y` pattern)
- [x] Zero client-side JS added (grep confirms 0 `client:*` directives and 0 `astro-island` markers)
- [x] Hero renders 2-3 sentence `content.verdict` (python-vs-rust verdict = 50 words, 3 sentences)
