# Requirements: patrykgolabek.dev

**Defined:** 2026-04-12
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.19 Requirements

Requirements for Claude Code Guide Refresh milestone. Each maps to roadmap phases.

### Chapter Updates

- [ ] **UPD-01**: Ch1 Introduction updated with new surfaces (Desktop App, web), /powerup, install methods
- [ ] **UPD-02**: Ch2 Context Management updated with autoMemoryDirectory, PostCompact hook
- [x] **UPD-03**: Ch3 Models & Costs updated with 1M Opus context, effort level restructure, /effort command
- [x] **UPD-04**: Ch4 Environment updated with new env vars, managed-settings.d/, --bare, NO_FLICKER
- [ ] **UPD-05**: Ch5 Remote & Headless updated with Remote Control server mode, Channels, --bare, scheduled tasks
- [ ] **UPD-06**: Ch6 MCP updated with elicitation, per-tool result-size caps
- [x] **UPD-07**: Ch7 Skills updated with paths frontmatter, lifecycle/compaction, Plugins relationship
- [x] **UPD-08**: Ch8 Hooks updated with 26 events (was 18), conditional `if` field, PermissionDenied, defer
- [ ] **UPD-09**: Ch9 Worktrees & Subagents updated with memory, background, initialPrompt, sparsePaths
- [ ] **UPD-10**: Ch10 Agent Teams updated with /agents UI, initialPrompt, dynamic agents
- [x] **UPD-11**: Ch11 Security updated with Auto Mode, 6 permission modes, Bash hardening
- [ ] **UPD-12**: All updated chapters have bumped `lastVerified` and `updatedDate` frontmatter
- [x] **UPD-13**: Deprecations reflected across all chapters (/tag removed, /vim removed, effort default changed, thinking summaries default)
- [ ] **UPD-14**: Cross-references verified across all 11 chapters (30+ bidirectional links intact)

### New Chapters

- [ ] **NEW-01**: Plugins chapter covering manifest, marketplace, bin/ executables, userConfig, lifecycle
- [ ] **NEW-02**: Agent SDK chapter covering Python + TypeScript APIs, renamed from Claude Code SDK
- [ ] **NEW-03**: Computer Use chapter covering CLI + Desktop GUI control, per-app approval, safety model
- [ ] **NEW-04**: New chapters registered in guide.json with proper slugs and descriptions
- [ ] **NEW-05**: New chapters have build-time OG images following existing pattern

### Cheatsheet

- [ ] **CS-01**: Both SVG cheatsheets updated with new commands/shortcuts (Auto Mode, /agents, new hooks, etc.)
- [ ] **CS-02**: Dedicated cheatsheet page at /guides/claude-code/cheatsheet/ with inline SVG rendering
- [ ] **CS-03**: Download buttons for both SVG files (interactive + print versions)
- [ ] **CS-04**: Cheatsheet page has OG image
- [ ] **CS-05**: Cheatsheet page has JSON-LD structured data
- [ ] **CS-06**: Cheatsheet linked from guide landing page Resources section

### Blog

- [ ] **BLOG-01**: New blog post covering Claude Code updates (What's New highlights)
- [ ] **BLOG-02**: New blog post cross-links to updated guide chapters and cheatsheet
- [ ] **BLOG-03**: Old blog post "The Context Window Is the Product" has update callout banner linking to new post
- [ ] **BLOG-04**: New blog post has OG image

### Site Integration

- [ ] **SITE-01**: LLMs.txt entries updated for cheatsheet page and new chapters
- [ ] **SITE-02**: guide.json metadata updated (chapter count, descriptions)
- [ ] **SITE-03**: Guide landing page reflects new chapter count and cheatsheet link
- [ ] **SITE-04**: Sitemap includes all new pages
- [ ] **SITE-05**: Lighthouse 90+ on all updated and new pages

## Future Requirements

### Cheatsheet Evolution

- **CS-F01**: Convert cheatsheet SVGs to build-time diagram pipeline (if frequent updates needed)
- **CS-F02**: Dark mode variant of cheatsheet SVGs

### Guide Expansion

- **NEW-F01**: Channels chapter (currently research preview, may graduate)
- **NEW-F02**: Voice Mode chapter (extensive improvements but outside current guide scope)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Voice Mode coverage | Extensive improvements but outside the guide's zero-to-hero CLI focus |
| /buddy easter egg | April 1st joke, not a real feature |
| Interactive React Flow diagrams for new chapters | Existing 5 SVG + 2 React Flow visualizers sufficient; new chapters use prose + code examples |
| Cheatsheet dark mode | SVGs use hardcoded dark theme already; light variant deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPD-01 | Phase 113 | Pending |
| UPD-02 | Phase 113 | Pending |
| UPD-03 | Phase 111 | Complete |
| UPD-04 | Phase 111 | Complete |
| UPD-05 | Phase 113 | Pending |
| UPD-06 | Phase 113 | Pending |
| UPD-07 | Phase 111 | Complete |
| UPD-08 | Phase 111 | Complete |
| UPD-09 | Phase 113 | Pending |
| UPD-10 | Phase 113 | Pending |
| UPD-11 | Phase 111 | Complete |
| UPD-12 | Phase 116 | Pending |
| UPD-13 | Phase 111 | Complete |
| UPD-14 | Phase 116 | Pending |
| NEW-01 | Phase 112 | Pending |
| NEW-02 | Phase 112 | Pending |
| NEW-03 | Phase 112 | Pending |
| NEW-04 | Phase 112 | Pending |
| NEW-05 | Phase 112 | Pending |
| CS-01 | Phase 114 | Pending |
| CS-02 | Phase 114 | Pending |
| CS-03 | Phase 114 | Pending |
| CS-04 | Phase 114 | Pending |
| CS-05 | Phase 114 | Pending |
| CS-06 | Phase 114 | Pending |
| BLOG-01 | Phase 115 | Pending |
| BLOG-02 | Phase 115 | Pending |
| BLOG-03 | Phase 115 | Pending |
| BLOG-04 | Phase 115 | Pending |
| SITE-01 | Phase 116 | Pending |
| SITE-02 | Phase 116 | Pending |
| SITE-03 | Phase 116 | Pending |
| SITE-04 | Phase 116 | Pending |
| SITE-05 | Phase 116 | Pending |

**Coverage:**
- v1.19 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after roadmap creation*
