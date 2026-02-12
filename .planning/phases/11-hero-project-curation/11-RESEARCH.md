# Phase 11: Hero & Project Curation - Research

**Researched:** 2026-02-11
**Domain:** Astro static site content updates -- hero messaging in centralized config, project data curation, meta description synchronization
**Confidence:** HIGH

## Summary

Phase 11 is a pure content and data update phase. No new libraries, no new patterns, no new components. The infrastructure established in Phase 8 (centralized `siteConfig` in `src/data/site.ts`) means the hero updates require changing only **one file** (`site.ts`) -- the tagline and roles automatically propagate to the page title, meta description, JSON-LD, and the typing animation script. The project curation requires changes to **two files** (`src/data/projects.ts` and `src/pages/projects/index.astro`) to remove the Full-Stack Applications category, remove gemini-beauty-math, and update the hardcoded project count in the meta description.

The current project count is **19**. After removing the "Full-Stack Applications" category (2 projects: PatrykQuantumNomad and arjancode_examples) and gemini-beauty-math (in AI/ML & LLM Agents category), the count will be **16**. This number must be updated in two places: the projects page meta description (`src/pages/projects/index.astro` line 13) and the about page career highlights (`src/pages/about.astro` line 46, which says "19+ repositories").

Additionally, the projects page meta description text mentions "full-stack applications" as a category -- this phrase must be removed or replaced since the category is being deleted.

**Primary recommendation:** Update `src/data/site.ts` (tagline + roles), `src/data/projects.ts` (remove category + project), and `src/pages/projects/index.astro` (update meta description count). Also update `src/pages/about.astro` (repository count). This can be done in a single plan since all changes are independent data edits with no complex interactions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Static site framework | Already installed, all work is content/data changes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | - | All work uses existing Astro/TypeScript | No new dependencies for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded count in meta description | Computed count from `projects.length` | Could compute dynamically, but the meta description string also needs category names updated. A hardcoded string update is simpler and matches the existing pattern. Phase 12 will verify consistency. |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### File Change Map

```
src/
  data/
    site.ts              # MODIFY: update tagline and roles array
    projects.ts          # MODIFY: remove Full-Stack category, remove gemini-beauty-math
  pages/
    projects/
      index.astro        # MODIFY: update meta description (count + category list)
    about.astro          # MODIFY: update "19+ repositories" count in highlights
```

### Pattern 1: Centralized Config Propagation (Phase 8 Foundation)

**What:** Changing values in `site.ts` automatically propagates to all consumers.
**When to use:** Hero tagline and roles updates.
**How it works:** Phase 8 established these data flows:

```
src/data/site.ts
  |
  +--> src/pages/index.astro
  |      - pageTitle = `${siteConfig.name} -- ${siteConfig.roles[0]} & ${siteConfig.roles[2]}`
  |      - pageDescription = `Portfolio of ${siteConfig.name}, ${siteConfig.description}.`
  |      - <h1>{siteConfig.name}</h1>
  |      - <span id="typing-role">{siteConfig.roles[0]}</span>
  |      - <p>{siteConfig.tagline}</p>
  |      - <script define:vars={{ roles: [...siteConfig.roles] }}>
  |
  +--> src/components/PersonJsonLd.astro
         - "name": siteConfig.name
         - "url": siteConfig.url
         - "jobTitle": siteConfig.jobTitle
         - "description": siteConfig.description
```

**Critical constraint from HERO-01:** The new tagline must NOT contain "Pre-1.0 Kubernetes adopter" or a location reference (Ontario, Canada). The current tagline is:
```
Building resilient cloud-native systems and AI-powered solutions for 17+ years. Pre-1.0 Kubernetes adopter. Ontario, Canada.
```

**Critical constraint from HERO-02:** Updated roles array must reflect architect/engineer/builder identity. Current roles:
```typescript
['Cloud-Native Architect', 'Kubernetes Pioneer', 'AI/ML Engineer', 'Platform Builder']
```

### Pattern 2: Project Data Array Filtering

**What:** The `projects` array and `categories` tuple in `projects.ts` are the single source of truth for the projects page.
**How the projects page works:**
```typescript
// projects/index.astro
const grouped = categories.map((category) => ({
  category,
  items: projects.filter((p) => p.category === category),
}));
```
The page iterates `categories` and filters projects for each. Removing a category from the `categories` tuple AND removing its projects from the `projects` array is sufficient -- no template changes needed for that part.

### Pattern 3: TypeScript `as const` Tuple Type Safety

**What:** The `categories` array uses `as const` to create a literal union type `Category`. Removing `'Full-Stack Applications'` from the tuple also removes it from the `Category` type, so any remaining project with `category: 'Full-Stack Applications'` will cause a type error at build time.
**Why this matters:** This is a safety net -- the type system will catch any missed project removal.

### Anti-Patterns to Avoid

- **Changing hero values in index.astro instead of site.ts:** Phase 8 centralized these. Edit site.ts only.
- **Removing projects from the template instead of the data file:** The template auto-generates from data. Edit projects.ts only.
- **Forgetting to update the `categories` tuple:** If you remove `'Full-Stack Applications'` projects but leave it in the `categories` array, an empty category heading will render on the page.
- **Updating only the meta description count but not the about page count:** The "19+ repositories" text in about.astro is a separate hardcoded string that also needs updating.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project count sync | Dynamic count computation in meta description | Hardcoded update matching the data change | Meta description is a static string in Astro frontmatter. Dynamic computation would add unnecessary complexity. Phase 12 verification will confirm consistency. |
| Hero keyword propagation | Editing each consumer file | Single edit to site.ts | Phase 8 already built the propagation. Editing consumers would create drift. |

**Key insight:** Phase 11 is a content editing phase, not an engineering phase. The infrastructure is already in place. The work is choosing the right words and removing the right data entries.

## Common Pitfalls

### Pitfall 1: Title Tag Depends on Roles Array Indices
**What goes wrong:** The home page title is constructed as `${siteConfig.roles[0]} & ${siteConfig.roles[2]}`. If you reorder the roles array, the title changes unexpectedly.
**Why it happens:** `index.astro` line 16 uses hardcoded indices `[0]` and `[2]` to select which roles appear in the title.
**How to avoid:** When updating the roles array, be aware that position matters. `roles[0]` appears in the title and as the default visible role in the hero. `roles[2]` also appears in the title. All roles cycle through the typing animation.
**Warning signs:** The page title no longer reads naturally (e.g., "Patryk Golabek -- Platform Builder & AI/ML Engineer" when you wanted the reverse).

### Pitfall 2: gemini-beauty-math Is NOT in Full-Stack Applications
**What goes wrong:** Removing the Full-Stack Applications category does NOT remove gemini-beauty-math. It is categorized under "AI/ML & LLM Agents".
**Why it happens:** The project name suggests it might be a full-stack app, but the data file categorizes it as AI/ML.
**How to avoid:** Remove gemini-beauty-math explicitly from the projects array (PROJ-02 is a separate requirement from PROJ-01).
**Warning signs:** After removing Full-Stack Applications, gemini-beauty-math still appears on the projects page under AI/ML.

### Pitfall 3: Hardcoded Count in Two Files
**What goes wrong:** Updating the project count in one file but forgetting the other. The count "19" appears in two places:
1. `src/pages/projects/index.astro` line 13: `"Explore 19 open-source projects..."`
2. `src/pages/about.astro` line 46: `"Maintaining 19+ repositories..."`
**How to avoid:** Update both files. The new count after removals is **16**.
**Warning signs:** Meta description says one number, About page says another.

### Pitfall 4: Meta Description Text References Removed Category
**What goes wrong:** The projects page meta description says "spanning Kubernetes platforms, AI/ML agents, infrastructure as code, and full-stack applications." After removing the Full-Stack Applications category, this text is inaccurate.
**Why it happens:** The meta description was written to match all 5 categories.
**How to avoid:** Update the meta description text to reflect the remaining 4 categories: AI/ML & LLM Agents, Kubernetes & Infrastructure, Platform & DevOps Tooling, Security & Networking.
**Warning signs:** Meta description advertises a category that no longer exists on the page.

### Pitfall 5: description Field in siteConfig Also Used in PersonJsonLd
**What goes wrong:** If you change `siteConfig.description`, it also changes the JSON-LD Person entity's description. This is intentional but could be surprising if you only wanted to change the home page meta description.
**Why it happens:** Phase 8 wired PersonJsonLd.astro to use `siteConfig.description`.
**How to avoid:** The `siteConfig.description` field is the professional summary used in structured data. It should remain an accurate professional description. The `siteConfig.tagline` is the hero-specific text shown visually. These serve different purposes.
**Warning signs:** JSON-LD validation tools showing unexpected description text.

## Code Examples

### Updated site.ts (tagline and roles)

The planner must provide final copy for the tagline and roles. Here is the structure:

```typescript
// src/data/site.ts
export const siteConfig = {
  /** Owner's full name */
  name: 'Patryk Golabek',
  /** Professional title for structured data */
  jobTitle: 'Cloud-Native Software Architect',
  /** One-line description for meta tags and JSON-LD */
  description:
    'Cloud-Native Software Architect with 17+ years of experience in Kubernetes, AI/ML systems, platform engineering, and DevSecOps',
  /** Hero tagline shown below the name -- UPDATED in Phase 11 (HERO-01) */
  tagline:
    '[NEW TAGLINE HERE -- craft & precision tone, no location, no "Pre-1.0 Kubernetes adopter"]',
  /** Roles for the typing animation -- UPDATED in Phase 11 (HERO-02) */
  roles: [
    '[role 1 -- appears in page title at index 0]',
    '[role 2]',
    '[role 3 -- appears in page title at index 2]',
    '[role 4]',
  ] as const,
  /** Canonical site URL */
  url: 'https://patrykgolabek.dev',
} as const;
```

**Constraints on new tagline:**
- Must NOT contain "Pre-1.0 Kubernetes adopter"
- Must NOT contain location reference (Ontario, Canada)
- Must convey "craft and precision" architect identity
- Will be displayed as the subtitle paragraph in the hero section

**Constraints on new roles:**
- Must reflect architect/engineer/builder identity
- `roles[0]` is the default visible role AND appears in the page title
- `roles[2]` also appears in the page title
- All roles cycle through the 3-second typing animation

### Updated projects.ts (removals)

```typescript
// Remove from categories tuple:
// Before:
export const categories = [
  'AI/ML & LLM Agents',
  'Kubernetes & Infrastructure',
  'Platform & DevOps Tooling',
  'Full-Stack Applications',    // <-- REMOVE
  'Security & Networking',
] as const;

// After:
export const categories = [
  'AI/ML & LLM Agents',
  'Kubernetes & Infrastructure',
  'Platform & DevOps Tooling',
  'Security & Networking',
] as const;

// Remove from projects array:
// 1. The gemini-beauty-math entry (in AI/ML & LLM Agents section)
// 2. The PatrykQuantumNomad entry (in Full-Stack Applications section)
// 3. The arjancode_examples entry (in Full-Stack Applications section)
```

### Updated projects/index.astro (meta description)

```astro
<Layout
  title="Projects -- Patryk Golabek | Open-Source Portfolio"
  description="Explore 16 open-source projects by Patryk Golabek spanning AI/ML agents, Kubernetes platforms, infrastructure as code, and security tooling."
>
```

### Updated about.astro (highlights count)

```typescript
// Line 46 change:
// Before:
text: 'Maintaining 19+ repositories spanning Kubernetes tooling, AI agents, infrastructure as code, and developer platforms.',
// After:
text: 'Maintaining 16+ repositories spanning Kubernetes tooling, AI agents, infrastructure as code, and developer platforms.',
```

## Detailed Impact Analysis

### Files Modified and Why

| File | What Changes | Requirement | Propagation |
|------|-------------|-------------|-------------|
| `src/data/site.ts` | `tagline` field value | HERO-01 | Auto-propagates to index.astro hero paragraph |
| `src/data/site.ts` | `roles` array values | HERO-02 | Auto-propagates to index.astro title, typing default, typing script |
| `src/data/projects.ts` | Remove `'Full-Stack Applications'` from categories | PROJ-01 | Type-checked: any remaining project with this category will fail build |
| `src/data/projects.ts` | Remove PatrykQuantumNomad and arjancode_examples entries | PROJ-01 | Projects page auto-excludes them |
| `src/data/projects.ts` | Remove gemini-beauty-math entry | PROJ-02 | Projects page auto-excludes it |
| `src/pages/projects/index.astro` | Update meta description count from 19 to 16 and fix category text | PROJ-03 | SEO meta tags update |
| `src/pages/about.astro` | Update "19+" to "16+" in highlights | PROJ-03 (implied) | Visible text update |

### Files NOT Modified (and why)

| File | Why No Change |
|------|---------------|
| `src/pages/index.astro` | Consumes from site.ts -- no direct edits needed |
| `src/components/PersonJsonLd.astro` | Consumes from site.ts -- no direct edits needed |
| `src/components/SEOHead.astro` | Receives title/description via Layout props -- no direct edits needed |
| `src/layouts/Layout.astro` | Passes props through -- no direct edits needed |
| `src/pages/llms.txt.ts` | Does not reference project count or hero tagline |
| `src/pages/rss.xml.ts` | Does not reference project count or hero tagline |

### HERO-03 Status

HERO-03 (hero keywords propagate consistently to page title tag, meta description, and JSON-LD structured data via centralized hero config) was already completed in Phase 8. No action needed in Phase 11 -- the propagation infrastructure is in place and will carry the new values automatically.

## Verification Checklist

After Phase 11 execution, these conditions must all be TRUE:

1. **HERO-01:** `siteConfig.tagline` does NOT contain "Pre-1.0 Kubernetes adopter" or "Ontario, Canada" or any location reference
2. **HERO-02:** `siteConfig.roles` contains updated values reflecting architect/engineer/builder identity
3. **HERO-02:** The typing animation script receives the new roles via `define:vars` (no code change needed -- this is automatic)
4. **PROJ-01:** `categories` tuple does NOT contain `'Full-Stack Applications'`
5. **PROJ-01:** `projects` array does NOT contain entries with `category: 'Full-Stack Applications'`
6. **PROJ-02:** `projects` array does NOT contain an entry with `name: 'gemini-beauty-math'`
7. **PROJ-03:** Projects page meta description says "16" (not "19")
8. **PROJ-03:** About page highlights text says "16+" (not "19+")
9. **Build:** `npx astro build` completes with zero errors
10. **Type safety:** TypeScript compilation succeeds (removing category from tuple removes it from union type)

## Open Questions

1. **What should the new tagline text be?**
   - What we know: Must convey "craft and precision architect identity", must NOT include location or "Pre-1.0 Kubernetes adopter"
   - What's unclear: The exact copy
   - Recommendation: The planner should draft tagline copy. Suggested direction: "Architecting resilient cloud-native systems and AI-powered platforms with 17+ years of hands-on engineering." (This preserves the experience qualifier while removing location and pre-1.0 reference, and shifts tone toward craftsmanship.)

2. **What should the updated roles array be?**
   - What we know: Must reflect "architect/engineer/builder identity"
   - What's unclear: Whether to keep any current roles or replace all four
   - Recommendation: Keep the same number (4 roles). Current roles are already close to the target tone. Possible update: keep "Cloud-Native Architect" at [0], keep "AI/ML Engineer" at [2] (both used in title), and refine others. Example: `['Cloud-Native Architect', 'Systems Engineer', 'AI/ML Engineer', 'Platform Builder']`.

3. **Should the projects page intro paragraph also be updated?**
   - What we know: Line 18 says "Open-source work spanning Kubernetes, AI/ML, infrastructure as code, and platform engineering." -- this does not mention "full-stack applications" explicitly
   - What's unclear: Whether it's close enough to the new category set
   - Recommendation: The intro paragraph is fine as-is. It describes work areas, not categories. No change needed.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all files listed in the impact analysis
- Phase 8 RESEARCH.md and PLAN documents confirming the propagation architecture
- STATE.md confirming accumulated decisions and prior context

### Codebase Audit (HIGH confidence)
- `src/data/site.ts` -- current tagline and roles (lines 9-18)
- `src/data/projects.ts` -- current categories tuple (lines 10-16), all 19 project entries
- `src/pages/projects/index.astro` -- meta description with count (line 13)
- `src/pages/about.astro` -- "19+ repositories" text (line 46)
- `src/pages/index.astro` -- title construction using roles indices (line 16), tagline rendering (line 35), typing script (line 192)
- `src/components/PersonJsonLd.astro` -- consuming siteConfig (lines 7-10)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries, pure content/data updates
- Architecture: HIGH -- Phase 8 infrastructure verified via direct codebase inspection. Propagation paths confirmed.
- Pitfalls: HIGH -- All findings from direct code audit. Count "19" locations verified via grep. Category membership of gemini-beauty-math verified.
- Project count: HIGH -- 19 total minus 2 (Full-Stack) minus 1 (gemini-beauty-math) = 16. Verified by counting `name:` occurrences and `category:` assignments.

**Research date:** 2026-02-11
**Valid until:** 2026-04-11 (stable domain -- content edits, no API changes)
