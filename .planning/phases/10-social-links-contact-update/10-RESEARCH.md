# Phase 10: Social Links & Contact Update - Research

**Researched:** 2026-02-11
**Domain:** Social link management, SVG icons, contact info in Astro static site
**Confidence:** HIGH

## Summary

Phase 10 is a pure HTML/SVG editing phase with zero new dependencies. The work consists of updating hardcoded social links and email addresses across 5 component files (`Footer.astro`, `contact.astro`, `index.astro`, `about.astro`, `PersonJsonLd.astro`). The About page is an additional location beyond the 4 originally scoped in FEATURES.md -- it has LinkedIn on lines 152-163 and email on line 194.

All changes follow established patterns already in the codebase: inline SVG icons with `aria-hidden="true"`, link elements with `aria-label`, `target="_blank"` with `rel="noopener noreferrer"` for external links, and the same Tailwind CSS utility classes for styling. The SVG paths for X (Twitter) and YouTube are available from Simple Icons (24x24 viewBox, `fill="currentColor"`) and verified against multiple sources.

**Primary recommendation:** Update all 5 files in a single atomic plan. Use the Simple Icons SVG paths for X and YouTube. Keep the existing inline SVG pattern (no icon library). Update PersonJsonLd `sameAs` to add X and YouTube URLs but do NOT remove LinkedIn from `sameAs` per CONFIG-02 (deferred to v1.2).

## Standard Stack

### Core

No new libraries. This phase uses only what is already in the codebase.

| Technology | Version | Purpose | Role in Phase 10 |
|------------|---------|---------|-------------------|
| Astro | 5.17.1 | Static site generator | Component files being edited |
| Tailwind CSS | 3.4.19 | Utility CSS | Styling classes on social link elements |

### Supporting

None. No new packages.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline SVG paths | `astro-icon` + `@iconify-json/simple-icons` | Adds 2 dependencies for 2 icons. Entire codebase uses inline SVGs. Would require refactoring all existing icons for consistency. **Rejected.** |
| Inline SVG paths | Font Awesome CDN | 30KB+ external script for 2 icons. Performance regression on a static portfolio. **Rejected.** |
| Hardcoded links per component | Centralized `src/data/social-links.ts` | Better long-term but deferred to v1.2 per CONFIG-01. Prior decision: "Core only" approach -- update directly in component files. |

**Installation:**

```bash
# No new packages to install.
```

## Architecture Patterns

### Current Social Links Architecture

Social links are hardcoded independently in each component. There is no shared data source. This is a known technical debt item (CONFIG-01), deferred to v1.2.

```
src/
├── components/
│   ├── Footer.astro          # GitHub, LinkedIn, TC Blog (SVG icons)
│   └── PersonJsonLd.astro    # sameAs: GitHub, LinkedIn, TC Blog, Kubert Blog
├── pages/
│   ├── index.astro           # CTA: email (mailto), LinkedIn (button)
│   ├── contact.astro         # Cards: email, LinkedIn. Secondary: GitHub, TC Blog, Kubert Blog
│   └── about.astro           # Connect section: GitHub, LinkedIn, TC Blog, Kubert Blog, Email
```

### Target State After Phase 10

```
src/
├── components/
│   ├── Footer.astro          # GitHub, X, YouTube, TC Blog (SVG icons)
│   └── PersonJsonLd.astro    # sameAs: GitHub, LinkedIn*, X, YouTube, TC Blog, Kubert Blog
├── pages/
│   ├── index.astro           # CTA: email (mailto, pgolabek@gmail.com) -- LinkedIn button REMOVED
│   ├── contact.astro         # Cards: email (pgolabek@gmail.com), X, YouTube. Secondary: GitHub, TC Blog, Kubert Blog
│   └── about.astro           # Connect section: GitHub, X, YouTube, TC Blog, Kubert Blog, Email (pgolabek@gmail.com) -- LinkedIn REMOVED
```

*LinkedIn retained in PersonJsonLd `sameAs` only, per CONFIG-02 (deferred removal to v1.2).

### Pattern 1: Inline SVG Social Link (Footer Style)

**What:** Small icon-only social link with aria-label for accessibility.
**When to use:** Footer social links row.
**Example (existing GitHub pattern from Footer.astro):**

```html
<!-- Source: src/components/Footer.astro lines 18-34 -->
<a
  href="https://github.com/PatrykQuantumNomad"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="GitHub profile"
  class="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
>
  <svg
    class="w-5 h-5"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31..." />
  </svg>
</a>
```

### Pattern 2: Contact Card (Contact Page Style)

**What:** Large card with icon, heading, and description text.
**When to use:** Contact page primary contact methods.
**Example (existing Email card pattern from contact.astro):**

```html
<!-- Source: src/pages/contact.astro lines 19-35 -->
<a
  href="mailto:patryk@translucentcomputing.com"
  class="group p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-[var(--color-accent)] transition-colors"
>
  <div class="mb-4 text-[var(--color-accent)]">
    <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <!-- icon paths -->
    </svg>
  </div>
  <h2 class="text-lg font-heading font-bold mb-1 group-hover:text-[var(--color-accent)] transition-colors">
    Email
  </h2>
  <p class="text-[var(--color-text-secondary)]">
    patryk@translucentcomputing.com
  </p>
</a>
```

### Pattern 3: Connect Link (About Page Style)

**What:** Button-style link with icon and visible text label.
**When to use:** About page "Let's Connect" section.
**Example (existing GitHub pattern from about.astro):**

```html
<!-- Source: src/pages/about.astro lines 140-150 -->
<a
  href="https://github.com/PatrykQuantumNomad"
  target="_blank"
  rel="noopener noreferrer"
  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
>
  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0..." />
  </svg>
  GitHub
</a>
```

### Anti-Patterns to Avoid

- **Partial update:** Updating Footer but forgetting About page or PersonJsonLd. All 5 files must change atomically.
- **Missing aria-label on icon-only links:** Footer links have no visible text, so `aria-label` is mandatory for screen readers.
- **Wrong SVG attributes:** X and YouTube icons use `fill="currentColor"` (not stroke). Misusing `stroke` on a filled logo produces invisible icons.
- **Forgetting `aria-hidden="true"` on SVGs:** Without this, screen readers announce SVG path data as gibberish.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| X logo SVG path | Custom-drawn X letterform | Simple Icons verified path | Brand accuracy matters; hand-drawn logos look wrong |
| YouTube logo SVG path | Custom play button shape | Simple Icons verified path | The YouTube logo has specific proportions and rounded rectangle shape |
| Centralized social config | A `social-links.ts` data file | Direct hardcoded edits | Prior decision: "Core only" for v1.1, centralize in v1.2 (CONFIG-01) |

**Key insight:** This phase is deliberately NOT building infrastructure. The prior decision is to update directly in component files. The centralized social config is CONFIG-01, deferred to v1.2.

## Common Pitfalls

### Pitfall 1: About Page Forgotten

**What goes wrong:** The About page (`about.astro`) has LinkedIn on lines 152-163 and the old email on line 194. The requirements list "Footer, Contact, and Home CTA" but the About page ALSO has LinkedIn and email. If it is not updated, LinkedIn persists on the live site.
**Why it happens:** The requirements spec mentions Footer, Contact, and Home CTA. The About page's "Let's Connect" section is a 4th location with the same links.
**How to avoid:** Include `about.astro` in the change list. Verify all 5 files are updated.
**Warning signs:** After changes, grep for `linkedin.com` in `src/` -- should only appear in `PersonJsonLd.astro` (in `sameAs`).

### Pitfall 2: Contact Page Grid Layout Breaking

**What goes wrong:** The contact page currently uses a 2-column grid (`grid-cols-1 sm:grid-cols-2`) for 2 cards (Email + LinkedIn). Replacing LinkedIn with X and adding YouTube makes 3 cards. A 2-column grid with 3 items leaves one card orphaned on its own row.
**Why it happens:** The grid was designed for exactly 2 cards.
**How to avoid:** Either (a) expand to 3-column grid (`sm:grid-cols-3`) for 3 equal cards, or (b) keep 2-column grid and accept the 3rd card spanning full width on the second row. Option (a) is cleaner.
**Warning signs:** Visually inspect at sm breakpoint. One card looks significantly wider than the others.

### Pitfall 3: Home Page CTA Left with Single Button

**What goes wrong:** The Home page CTA currently has 2 buttons: "Get in Touch" (email) + "Connect on LinkedIn". Removing LinkedIn leaves a single CTA button. This may look intentional or may look incomplete.
**Why it happens:** LinkedIn was the secondary CTA. The replacement approach matters.
**How to avoid:** Replace the LinkedIn CTA with either (a) an X profile link ("Follow on X"), or (b) a contact page link ("View Contact Info"), or (c) simply remove the second button and keep just the email CTA. Recommendation: replace with "Follow on X" to maintain two CTAs and provide a secondary non-email contact option.
**Warning signs:** Visually inspect the CTA section. Does it feel complete with one button?

### Pitfall 4: JSON-LD sameAs Inconsistency

**What goes wrong:** Adding X and YouTube to visible links but not to PersonJsonLd `sameAs` creates an inconsistency between what Google sees in structured data and what users see on the page.
**Why it happens:** PersonJsonLd is a separate component file, easy to forget when editing page templates.
**How to avoid:** Add `https://x.com/QuantumMentat` and `https://youtube.com/@QuantumMentat` to the `sameAs` array. Keep LinkedIn in `sameAs` per CONFIG-02.
**Warning signs:** After changes, check that `sameAs` array has at least 6 entries (GitHub, LinkedIn, X, YouTube, TC Blog, Kubert Blog).

### Pitfall 5: X vs Twitter URL Format

**What goes wrong:** Using `twitter.com/QuantumMentat` instead of `x.com/QuantumMentat`. Both currently redirect to the same place, but the canonical brand URL is now `x.com`.
**Why it happens:** Muscle memory, old documentation, copy-paste from old templates.
**How to avoid:** Use `https://x.com/QuantumMentat` consistently. Label the link as "X" (not "Twitter").
**Warning signs:** Grep for `twitter.com` in `src/` -- should return 0 results (except possibly in SEOHead.astro meta tags which use `twitter:card` -- that is a standard spec name, not a URL).

## Code Examples

Verified SVG icon paths from authoritative sources:

### X (Twitter) Logo SVG

```html
<!-- Source: Simple Icons (https://simpleicons.org) - 24x24 viewBox, fill only -->
<svg
  class="w-5 h-5"
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
</svg>
```

### YouTube Logo SVG

```html
<!-- Source: Simple Icons (https://simpleicons.org) - 24x24 viewBox, fill only -->
<svg
  class="w-5 h-5"
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
</svg>
```

### Email Address Update

```
Old: patryk@translucentcomputing.com
New: pgolabek@gmail.com
```

Appears in 3 locations as `mailto:` href and 1 location as visible text:
1. `src/pages/contact.astro` line 20 (href) and line 33 (visible text)
2. `src/pages/index.astro` line 159 (href only)
3. `src/pages/about.astro` line 194 (href only)

### Social Link URLs

```
X:       https://x.com/QuantumMentat
YouTube: https://youtube.com/@QuantumMentat
GitHub:  https://github.com/PatrykQuantumNomad  (unchanged)
LinkedIn: https://www.linkedin.com/in/patrykgolabek/  (removed from UI, kept in sameAs)
```

## Inventory of All Changes

### File 1: `src/components/Footer.astro` (79 lines)

| Lines | Current | Action |
|-------|---------|--------|
| 36-52 | LinkedIn SVG link | **REPLACE** with X (Twitter) SVG link |
| -- | (none) | **ADD** YouTube SVG link after X |

Result: Footer social row becomes GitHub, X, YouTube, TC Blog.

### File 2: `src/pages/contact.astro` (101 lines)

| Lines | Current | Action |
|-------|---------|--------|
| 17 | `grid-cols-1 sm:grid-cols-2` | **UPDATE** to `grid-cols-1 sm:grid-cols-3` (3 cards) |
| 20 | `mailto:patryk@translucentcomputing.com` | **UPDATE** to `mailto:pgolabek@gmail.com` |
| 33 | `patryk@translucentcomputing.com` | **UPDATE** to `pgolabek@gmail.com` |
| 37-55 | LinkedIn card | **REPLACE** with X card |
| -- | (after X card) | **ADD** YouTube card |

Result: Contact has 3 primary cards (Email, X, YouTube) + secondary links.

### File 3: `src/pages/index.astro` (204 lines)

| Lines | Current | Action |
|-------|---------|--------|
| 159 | `mailto:patryk@translucentcomputing.com` | **UPDATE** to `mailto:pgolabek@gmail.com` |
| 164-171 | LinkedIn CTA button | **REPLACE** with X profile CTA ("Follow on X") |

Result: CTA section has "Get in Touch" (email) + "Follow on X".

### File 4: `src/pages/about.astro` (206 lines)

| Lines | Current | Action |
|-------|---------|--------|
| 152-163 | LinkedIn button with SVG | **REPLACE** with X button |
| -- | (after X button) | **ADD** YouTube button |
| 194 | `mailto:patryk@translucentcomputing.com` | **UPDATE** to `mailto:pgolabek@gmail.com` |

Result: Connect section has GitHub, X, YouTube, TC Blog, Kubert Blog, Email.

### File 5: `src/components/PersonJsonLd.astro` (44 lines)

| Lines | Current | Action |
|-------|---------|--------|
| 25-30 | `sameAs` with 4 URLs | **ADD** X and YouTube URLs, **KEEP** LinkedIn |

Result: `sameAs` has 6 entries: GitHub, LinkedIn, X, YouTube, TC Blog, Kubert Blog.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `twitter.com` URLs | `x.com` URLs | July 2023 (X rebrand) | Use `x.com/QuantumMentat`, not `twitter.com` |
| Twitter bird SVG icon | X lettermark SVG icon | July 2023 (X rebrand) | Simple Icons provides the current X logo |
| `youtube.com/channel/UCXXX` | `youtube.com/@handle` | November 2022 (YouTube handles) | Use `youtube.com/@QuantumMentat` handle format |

**Deprecated/outdated:**
- Twitter bird logo SVG: Replaced by X lettermark. Do not use the old blue bird icon.
- `twitter.com` domain: Still works as redirect but `x.com` is the canonical brand domain.

## Open Questions

1. **Home page CTA replacement for LinkedIn**
   - What we know: LinkedIn CTA button must be removed. Email CTA stays.
   - What's unclear: What should the second CTA be? "Follow on X"? "View Contact Info"? Or just one button?
   - Recommendation: Use "Follow on X" with the X icon to maintain visual balance with two CTAs and provide a secondary contact option. This is a reasonable default -- if Patryk disagrees, it is a 1-line copy change.

2. **Contact page grid columns with 3 cards**
   - What we know: Currently 2-column grid for 2 cards. Adding YouTube makes 3.
   - What's unclear: Should it be 3-column (`sm:grid-cols-3`) or keep 2-column?
   - Recommendation: Use `sm:grid-cols-3` for 3 equal cards. This keeps the visual balance and matches the existing card sizes. On mobile it falls back to single column.

3. **About page LinkedIn removal scope**
   - What we know: Requirements specify "Footer, Contact, and Home CTA" for LinkedIn removal. About page also has LinkedIn.
   - What's unclear: Is About page in scope for Phase 10?
   - Recommendation: Yes. SOCIAL-04 says "LinkedIn is removed from visible social links in Footer, Contact, and Home CTA" but the About page has an identical LinkedIn link. Leaving it would be inconsistent. Include it.

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection of all 5 target files (Footer.astro, contact.astro, index.astro, about.astro, PersonJsonLd.astro) -- exact line numbers, current content, and patterns documented
- Simple Icons (https://simpleicons.org) -- X and YouTube SVG paths, 24x24 viewBox, verified via WebFetch
- Bootstrap Icons (https://icons.getbootstrap.com/icons/twitter-x/) -- cross-reference for X logo SVG path
- `.planning/research/FEATURES.md` -- prior analysis of social links locations and required changes
- `.planning/research/PITFALLS.md` -- prior analysis of social link update pitfalls
- `.planning/research/STACK.md` -- confirmed zero new dependencies for social link updates

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` -- SOCIAL-01 through SOCIAL-04 requirement definitions
- `.planning/STATE.md` -- prior decisions: "Core only" for social links, LinkedIn kept in sameAs for v1.2

### Tertiary (LOW confidence)

- None. All findings are from direct codebase inspection and verified brand asset sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all patterns already in codebase
- Architecture: HIGH -- direct file inspection, exact line numbers documented
- Pitfalls: HIGH -- all pitfalls identified from concrete codebase analysis (e.g., About page forgotten, grid layout)

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable -- no moving parts, pure content editing)
