---
phase: quick-006
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/data/projects.ts
  - src/pages/projects/index.astro
  - src/components/PersonJsonLd.astro
  - src/pages/llms.txt.ts
  - src/pages/llms-full.txt.ts
autonomous: true

must_haves:
  truths:
    - "networking-tools project card shows both Source and Live Site links on the projects page"
    - "PersonJsonLd structured data includes Penetration Testing and Network Security in knowsAbout"
    - "PersonJsonLd sameAs array includes the networking-tools GitHub Pages URL"
    - "llms.txt includes a Featured Projects section with networking-tools live URL and description"
    - "llms-full.txt shows live URLs for projects that have them"
  artifacts:
    - path: "src/data/projects.ts"
      provides: "Project interface with optional liveUrl field, updated networking-tools entry"
      contains: "liveUrl"
    - path: "src/pages/projects/index.astro"
      provides: "Dual-link rendering for projects with liveUrl"
      contains: "liveUrl"
    - path: "src/components/PersonJsonLd.astro"
      provides: "Updated knowsAbout and sameAs arrays"
      contains: "Penetration Testing"
    - path: "src/pages/llms.txt.ts"
      provides: "Featured Projects section with networking-tools"
      contains: "Featured Projects"
    - path: "src/pages/llms-full.txt.ts"
      provides: "Live URL output for projects that have liveUrl"
      contains: "liveUrl"
  key_links:
    - from: "src/data/projects.ts"
      to: "src/pages/projects/index.astro"
      via: "Project interface and liveUrl field"
      pattern: "project\\.liveUrl"
    - from: "src/data/projects.ts"
      to: "src/pages/llms-full.txt.ts"
      via: "projects import with liveUrl rendering"
      pattern: "project\\.liveUrl"
---

<objective>
Add SEO cross-linking between patrykgolabek.dev and the networking-tools GitHub Pages project site.

Purpose: Strengthen SEO signal between the personal portfolio and the networking-tools project by adding bidirectional links, enriching structured data, and updating LLM-facing content files.
Output: Updated project data model, project page rendering, structured data, and LLM content files.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/data/projects.ts
@src/pages/projects/index.astro
@src/components/PersonJsonLd.astro
@src/pages/llms.txt.ts
@src/pages/llms-full.txt.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add liveUrl to Project interface and update networking-tools entry</name>
  <files>src/data/projects.ts</files>
  <action>
    1. Add `liveUrl?: string;` as an optional field to the `Project` interface, after the `url` field.

    2. Update the networking-tools project entry:
       - Add `liveUrl: 'https://patrykquantumnomad.github.io/networking-tools/'`
       - Update description to: `'Pentesting learning lab with 17 security tools (Nmap, Metasploit, SQLMap, etc.), 28 use-case scripts, and Docker-based vulnerable targets'`
  </action>
  <verify>Run `npx astro check` (or `npx tsc --noEmit`) to confirm no TypeScript errors. Grep for `liveUrl` in projects.ts to confirm the field exists in both the interface and the networking-tools entry.</verify>
  <done>Project interface has optional liveUrl field. networking-tools entry has liveUrl set to the GitHub Pages URL and an expanded SEO-rich description.</done>
</task>

<task type="auto">
  <name>Task 2: Update project card rendering to show dual links when liveUrl exists</name>
  <files>src/pages/projects/index.astro</files>
  <action>
    Modify the project card rendering in `src/pages/projects/index.astro` to handle projects with a `liveUrl`:

    Currently each project card is a single `<a>` tag linking to `project.url` (the GitHub repo). When `project.liveUrl` exists, change the card to a `<div>` (not a link itself) and render TWO links at the bottom of the card:

    1. Replace the outer `<a>` with a `<div>` conditionally: if the project has `liveUrl`, use a `<div>` container; otherwise keep the existing `<a>` tag behavior.

    Implementation approach -- use a conditional render:
    - For projects WITHOUT liveUrl: keep the existing `<a>` card markup exactly as-is (single clickable card linking to GitHub).
    - For projects WITH liveUrl: render a `<div>` card with same styling classes (minus group-hover link behaviors on the outer element), containing:
      - The same project name, language badge, fork badge, and description content
      - A footer row with two links side-by-side:
        - "Source" link pointing to `project.url` (GitHub repo) with a small GitHub/code icon or arrow
        - "Live Site" link pointing to `project.liveUrl` with an external-link arrow icon
      - Both links should use the accent color on hover, have `target="_blank"` and `rel="noopener noreferrer"`
      - Style the footer links as small pill/button-like elements: `text-sm font-medium px-3 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors`

    Keep the existing `data-card-item` and `data-tilt` attributes on the outer element (whether `<a>` or `<div>`).
    Keep the `class:list` logic for `projIdx === 0` col-span.

    The card should still look cohesive -- the two links at the bottom are a subtle addition, not a redesign.
  </action>
  <verify>Run `npx astro build` to confirm the page builds without errors. Visually inspect by running `npx astro dev` and navigating to /projects/ -- networking-tools card should show "Source" and "Live Site" links, while all other cards remain as single clickable cards.</verify>
  <done>Projects with liveUrl show both "Source" (GitHub) and "Live Site" links. Projects without liveUrl render identically to before. No build errors.</done>
</task>

<task type="auto">
  <name>Task 3: Update structured data and LLM content files</name>
  <files>src/components/PersonJsonLd.astro, src/pages/llms.txt.ts, src/pages/llms-full.txt.ts</files>
  <action>
    **PersonJsonLd.astro** (src/components/PersonJsonLd.astro):
    1. Add "Penetration Testing" and "Network Security" to the `knowsAbout` array (append after the existing entries).
    2. Add `"https://patrykquantumnomad.github.io/networking-tools/"` to the `sameAs` array (append after the existing entries).

    **llms.txt.ts** (src/pages/llms.txt.ts):
    Add a "Featured Projects" section between the "## Pages" section and the "## Blog Posts" section. Insert these lines after the Pages entries and before Blog Posts:

    ```
    '## Featured Projects',
    '',
    '- networking-tools: Pentesting learning lab with 17 security tools (Nmap, Metasploit, SQLMap, etc.), 28 use-case scripts, and Docker-based vulnerable targets',
    '  Live: https://patrykquantumnomad.github.io/networking-tools/',
    '  Source: https://github.com/PatrykQuantumNomad/networking-tools',
    '',
    ```

    **llms-full.txt.ts** (src/pages/llms-full.txt.ts):
    In the projects rendering loop (around lines 89-93), after the line that outputs `URL: ${project.url}`, add a conditional line:
    ```typescript
    if (project.liveUrl) {
      lines.push(`  Live URL: ${project.liveUrl}`);
    }
    ```
    This ensures any project with a `liveUrl` will have it listed in the full LLM content file.
  </action>
  <verify>
    1. Run `npx astro build` to confirm all pages build without errors.
    2. Grep PersonJsonLd.astro for "Penetration Testing" and "networking-tools" to confirm both additions.
    3. After build, check `dist/llms.txt` contains "Featured Projects" with networking-tools entries.
    4. Check `dist/llms-full.txt` contains "Live URL: https://patrykquantumnomad.github.io/networking-tools/" under the networking-tools project.
  </verify>
  <done>PersonJsonLd includes "Penetration Testing", "Network Security" in knowsAbout and the GitHub Pages URL in sameAs. llms.txt has a Featured Projects section. llms-full.txt renders liveUrl for projects that have it.</done>
</task>

</tasks>

<verification>
1. `npx astro build` completes without errors
2. All 7 specified changes are implemented across the 5 files
3. The networking-tools project card on /projects/ shows dual links (Source + Live Site)
4. All other project cards remain unchanged (single clickable card)
5. PersonJsonLd schema includes the new knowsAbout entries and sameAs URL
6. llms.txt has a Featured Projects section between Pages and Blog Posts
7. llms-full.txt conditionally outputs Live URL for projects with liveUrl
</verification>

<success_criteria>
- `npx astro build` passes cleanly
- networking-tools card renders with two distinct links: GitHub source and GitHub Pages live site
- JSON-LD structured data enriched with security expertise and cross-link to networking-tools site
- Both LLM content endpoints surface the networking-tools live URL
- No regressions to existing project cards or page layout
</success_criteria>

<output>
After completion, create `.planning/quick/006-seo-cross-linking-for-networking-tools-p/006-SUMMARY.md`
</output>
