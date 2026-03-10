# Phase 90: Infrastructure Refactoring - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the single-guide codebase into a multi-guide content collection system. Scaffold the Claude Code guide pipeline (landing page, chapter routing, CodeBlock component, schema extension) while maintaining full regression on the existing FastAPI guide. No content authoring — just infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Guide landing page
- Numbered card grid layout (2-3 columns) showing all 11 chapters
- Flat grid with no tier grouping — chapter numbers imply progression
- Above the grid: guide title, subtitle, 2-3 sentence description, and a prerequisites/audience box (e.g., "For developers familiar with CLI tools")
- Shared base layout across all guides, but each guide gets a unique accent color for visual identity

### Chapter page layout
- Sidebar shows full chapter list (all 11 chapters) with current chapter highlighted, always visible on desktop
- No separate on-page table of contents — two-column layout only (sidebar + content)
- Prev + Next navigation cards at the bottom of each chapter showing neighboring chapter titles
- Three-level breadcrumbs: Guides / Claude Code / [Chapter Title]

### CodeBlock component
- Filename tab-style header showing the file path (mimics editor tab, subtle background)
- Copy-to-clipboard button always visible (top-right corner)
- Optional caption field below the code block for brief explanations
- No GitHub source link (confirmed in requirements)

### Claude's Discretion
- Line highlighting support — Claude decides whether to include based on content chapter needs
- Syntax highlighting theme choice — match existing site theme
- Exact card component sizing, spacing, and responsive breakpoints
- Sidebar collapse behavior on mobile
- Loading/skeleton states for guide pages

### Guide metadata & identity
- Guide slug: `/guides/claude-code/` (short, clean, matches product name)
- Chapter slugs: topic-based without numbers (e.g., `/guides/claude-code/context-management/`)
- Per-guide accent color stored in metadata — Claude Code guide uses a distinct color from FastAPI
- Estimated reading time per chapter displayed on landing page cards and chapter pages

</decisions>

<specifics>
## Specific Ideas

- Card grid style inspired by the numbered card preview: chapter number prominent, title below, short description
- Breadcrumb format: "Guides / Claude Code / Context Management" — three levels for clear navigation hierarchy
- Prev/Next cards show chapter number + title, with directional arrows
- Prerequisites box on landing page sets reader expectations upfront

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 90-infrastructure-refactoring*
*Context gathered: 2026-03-10*
