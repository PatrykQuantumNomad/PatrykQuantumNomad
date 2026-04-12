# Roadmap: patrykgolabek.dev

## Milestones

- v1.0 through v1.16: Shipped (see MILESTONES.md)
- v1.17 EDA Jupyter Notebooks: Shipped (Phases 96-101)
- v1.18 AI Landscape Explorer: Shipped (Phases 102-110)
- v1.19 Claude Code Guide Refresh: Phases 111-116 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>v1.17 EDA Jupyter Notebooks (Phases 96-101) - SHIPPED 2026-03-15</summary>

- [x] **Phase 96: Notebook Foundation** - TypeScript nbformat v4.5 types, cell factories, case study registry, and requirements.txt template (completed 2026-03-14)
- [x] **Phase 97: Standard Case Study Notebooks** - 7 standard-template notebooks with parameterized 4-plot analysis, hypothesis tests, and interpretation (completed 2026-03-14)
- [x] **Phase 98: Packaging Pipeline** - ZIP packaging with archiver, Astro build integration hook, and static file serving (completed 2026-03-14)
- [x] **Phase 99: Download UI and Colab Integration** - Download buttons on case study pages, Open in Colab badges, and committed .ipynb files for Colab GitHub URLs (completed 2026-03-15)
- [x] **Phase 100: Advanced Case Study Notebooks** - 3 complex notebooks: sinusoidal model fitting, AR(1) development, and DOE multi-factor analysis (completed 2026-03-15)
- [x] **Phase 101: Site Integration** - Notebooks landing page, companion blog post, LLMs.txt update, sitemap inclusion, and OG image (completed 2026-03-15)

</details>

<details>
<summary>v1.18 AI Landscape Explorer (Phases 102-110) - SHIPPED 2026-03-27</summary>

- [x] **Phase 102: Data Foundation** - DOT-to-JSON extraction, Zod schema, two-tier educational content for ~80 nodes, content collection registration (completed 2026-03-26)
- [x] **Phase 103: SEO Concept Pages** - Individual /ai-landscape/[slug] pages with structured data, breadcrumbs, and OG images (completed 2026-03-26)
- [x] **Phase 104: Static Landing Page & Force Layout** - Build-time force simulation, static SVG fallback, landing page with legend and concept list (completed 2026-03-27)
- [x] **Phase 105: Interactive Graph Core** - D3 force-directed React island with pan/zoom, tooltips, and edge labels (completed 2026-03-27)
- [x] **Phase 106: Detail Panel & Node Selection** - Side panel (desktop) and bottom sheet (mobile) with ELI5 toggle, grouped relationships, and ancestry path highlighting (completed 2026-03-27)
- [x] **Phase 107: Search, Navigation & Deep Links** - Search autocomplete, mobile-responsive layout, shareable URL state, keyboard navigation (completed 2026-03-27)
- [x] **Phase 108: Guided Tours & Compare Mode** - Curated learning paths with tour UI, side-by-side comparison, and VS pages (completed 2026-03-27)
- [x] **Phase 109: Graph Polish** - Cluster zoom, animated edge traversal, and mini-map (completed 2026-03-27)
- [x] **Phase 110: Site Integration** - Header nav, homepage callout, sitemap, LLMs.txt, companion blog post, and landing OG image (completed 2026-03-27)

</details>

### v1.19 Claude Code Guide Refresh (In Progress)

**Milestone Goal:** Update the existing 11-chapter Claude Code guide with 6+ months of new features, add 3 new chapters (Plugins, Agent SDK, Computer Use), publish dedicated cheatsheet page with updated SVGs, write companion blog post, and update site integration

- [x] **Phase 111: High-Impact Chapter Rewrites** - Rewrite Ch3, Ch4, Ch7, Ch8, Ch11 with major feature additions plus deprecation sweep (completed 2026-04-12)
- [x] **Phase 112: New Chapters** - Author Plugins, Agent SDK, and Computer Use chapters with guide.json registration and OG images (completed 2026-04-12)
- [ ] **Phase 113: Lower-Impact Chapter Updates** - Update Ch1, Ch2, Ch5, Ch6, Ch9, Ch10 with incremental feature additions
- [ ] **Phase 114: Cheatsheet** - Update both SVG cheatsheets and build dedicated cheatsheet page with downloads
- [x] **Phase 115: Blog Post** - New companion blog post covering guide updates plus callout banner on old post (completed 2026-04-12)
- [ ] **Phase 116: Site Integration** - LLMs.txt, guide landing page, sitemap, cross-reference audit, lastVerified bumps, Lighthouse

## Phase Details

### Phase 111: High-Impact Chapter Rewrites
**Goal**: Readers of the five most-changed chapters see accurate, current content reflecting 6+ months of Claude Code evolution
**Depends on**: Nothing (first phase)
**Requirements**: UPD-03, UPD-04, UPD-07, UPD-08, UPD-11, UPD-13
**Success Criteria** (what must be TRUE):
  1. Ch3 (Models & Costs) documents 1M Opus context, restructured effort levels, and the /effort command
  2. Ch4 (Environment) documents new env vars, managed-settings.d/ directory, --bare flag, and NO_FLICKER
  3. Ch7 (Skills) documents paths frontmatter, lifecycle/compaction behavior, and relationship to the new Plugins system
  4. Ch8 (Hooks) documents all 24 hook events (was 18), the conditional `if` field, PermissionDenied event, and defer behavior
  5. Ch11 (Security) documents Auto Mode, all 6 permission modes, and Bash hardening improvements
**Plans:** 7 plans (6 complete + 1 gap closure)
Plans:
- [x] 111-01-PLAN.md -- Ch3 Models & Costs rewrite (Auto Mode, 1M context, /effort, 6 permission modes)
- [x] 111-02-PLAN.md -- Ch4 Environment rewrite (managed-settings.d/, --bare, NO_FLICKER)
- [x] 111-03-PLAN.md -- Ch7 Skills rewrite (paths/shell frontmatter, lifecycle, Plugins mention)
- [x] 111-04-PLAN.md -- Ch8 Hooks rewrite + component updates (24 events, if field, defer, PermissionDenied)
- [x] 111-05-PLAN.md -- Ch11 Security rewrite (Auto Mode governance, Bash hardening, protected paths)
- [x] 111-06-PLAN.md -- guide.json updates + cross-chapter deprecation sweep
- [x] 111-07-PLAN.md -- Gap closure: fix event count inconsistencies (26->24) + env var name fix (completed 2026-04-12)

### Phase 112: New Chapters
**Goal**: Three new guide chapters cover Plugins, Agent SDK, and Computer Use as complete, self-contained learning resources integrated into the guide structure
**Depends on**: Phase 111 (new chapters cross-reference updated content in Ch7 Skills, Ch8 Hooks, Ch11 Security)
**Requirements**: NEW-01, NEW-02, NEW-03, NEW-04, NEW-05
**Success Criteria** (what must be TRUE):
  1. Plugins chapter covers manifest format, marketplace, bin/ executables, userConfig, and lifecycle with working code examples
  2. Agent SDK chapter covers both Python and TypeScript APIs and explains the rename from Claude Code SDK
  3. Computer Use chapter covers CLI and Desktop GUI control, per-app approval flow, and the safety model
  4. All three chapters appear in guide.json with proper slugs, descriptions, and ordering
  5. All three chapters have build-time OG images following the existing guide pattern
**Plans**: TBD

### Phase 113: Lower-Impact Chapter Updates
**Goal**: The remaining six chapters reflect current Claude Code behavior with all incremental feature additions documented
**Depends on**: Phase 111 (deprecation sweep in Phase 111 informs cross-references in these chapters)
**Requirements**: UPD-01, UPD-02, UPD-05, UPD-06, UPD-09, UPD-10
**Success Criteria** (what must be TRUE):
  1. Ch1 (Introduction) documents Desktop App, web surfaces, /powerup command, and current install methods
  2. Ch2 (Context Management) documents autoMemoryDirectory and PostCompact hook
  3. Ch5 (Remote & Headless) documents Remote Control server mode, Channels, --bare flag, and scheduled tasks
  4. Ch6 (MCP) documents elicitation and per-tool result-size caps
  5. Ch9 (Worktrees & Subagents) documents memory, background mode, initialPrompt, and sparsePaths
**Plans:** 7 plans
Plans:
- [x] 113-01-PLAN.md -- Ch1 Introduction update (Desktop App, /powerup, web surfaces)
- [x] 113-02-PLAN.md -- Ch2 Context Management update (autoMemoryDirectory, PostCompact)
- [x] 113-03-PLAN.md -- Ch5 Remote & Headless update (server mode, Channels, --bare)
- [x] 113-04-PLAN.md -- Ch6 MCP update (elicitation, per-tool result-size caps)
- [x] 113-05-PLAN.md -- Ch9 Worktrees update (memory, initialPrompt, sparsePaths, /agents UI)
- [x] 113-06-PLAN.md -- Ch10 Agent Teams update (/agents UI, initialPrompt, dynamic agents)
- [x] 113-07-PLAN.md -- guide.json description updates + cross-chapter verification sweep

### Phase 114: Cheatsheet
**Goal**: Users can view, download, and share updated Claude Code cheatsheets from a dedicated page on the site
**Depends on**: Phase 113 (cheatsheet content must reflect finalized chapter content including all commands and shortcuts)
**Requirements**: CS-01, CS-02, CS-03, CS-04, CS-05, CS-06
**Success Criteria** (what must be TRUE):
  1. Both SVG cheatsheets (interactive and print versions) include Auto Mode, /agents, new hook events, and all other new commands/shortcuts
  2. Dedicated cheatsheet page renders both SVGs inline at /guides/claude-code/cheatsheet/
  3. Download buttons serve both SVG files directly
  4. Cheatsheet page has OG image, JSON-LD structured data, and is linked from the guide landing page Resources section
**Plans**: 3 plans
Plans:
- [x] 114-01-PLAN.md -- Update both SVG cheatsheets with /effort, /remote-control, /loop commands
- [x] 114-02-PLAN.md -- Create cheatsheet page, OG image endpoint, landing page Resources section
- [x] 114-03-PLAN.md -- Build verification + visual checkpoint (completed 2026-04-12)
**UI hint**: yes

### Phase 115: Blog Post
**Goal**: A new blog post announces the guide refresh and drives traffic from search and existing readers to the updated content
**Depends on**: Phase 114 (blog post cross-links to finalized chapters and cheatsheet URL)
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04
**Success Criteria** (what must be TRUE):
  1. New blog post covers What's New highlights from the guide refresh with specific feature callouts
  2. New blog post includes cross-links to updated guide chapters and the cheatsheet page
  3. Old blog post "The Context Window Is the Product" displays an update callout banner linking to the new post
  4. New blog post has a branded OG image
**Plans**: 2 plans
Plans:
- [x] 115-01-PLAN.md -- Old post update callout banner + branded cover SVG for new post
- [x] 115-02-PLAN.md -- New blog post authoring + FAQ JSON-LD registration

### Phase 116: Site Integration
**Goal**: All new and updated pages are discoverable, indexed, cross-referenced, and pass quality gates
**Depends on**: Phase 115 (all content must be finalized before integration sweep)
**Requirements**: UPD-12, UPD-14, SITE-01, SITE-02, SITE-03, SITE-04, SITE-05
**Success Criteria** (what must be TRUE):
  1. LLMs.txt entries exist for the cheatsheet page and all three new chapters
  2. guide.json metadata reflects the updated chapter count (14) and descriptions
  3. Guide landing page shows the new chapter count and includes the cheatsheet link
  4. All new pages appear in the sitemap and all 30+ cross-references across 14 chapters are verified intact
  5. Lighthouse scores 90+ on all updated and new pages
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 111 -> 112 -> 113 -> 114 -> 115 -> 116

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 111. High-Impact Chapter Rewrites | 7/7 | Complete | 2026-04-12 |
| 112. New Chapters | 4/4 | Complete   | 2026-04-12 |
| 113. Lower-Impact Chapter Updates | 7/7 | Complete | 2026-04-12 |
| 114. Cheatsheet | 3/3 | Complete | 2026-04-12 |
| 115. Blog Post | 2/2 | Complete   | 2026-04-12 |
| 116. Site Integration | 0/TBD | Not started | - |
