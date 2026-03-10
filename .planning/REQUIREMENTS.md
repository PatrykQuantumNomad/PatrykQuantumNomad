# Requirements: Claude Code Guide

**Defined:** 2026-03-10
**Core Value:** The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well in search engines and makes a memorable impression

## v1 Requirements

Requirements for v1.16 milestone. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Multi-guide content collection system supporting multiple guides without hardcoded single-guide assumptions
- [x] **INFRA-02**: Guide page schema extended with `lastVerified` date field for content freshness tracking
- [x] **INFRA-03**: Claude Code guide.json metadata with 11 chapters, requirements, and guide-level configuration
- [x] **INFRA-04**: Guide landing page at /guides/claude-code/ with chapter card grid and AI agent narrative hero
- [x] **INFRA-05**: Dynamic chapter routing at /guides/claude-code/[slug] for all 11 chapters
- [x] **INFRA-06**: Existing FastAPI guide renders identically after all infrastructure changes (regression gate)
- [x] **INFRA-07**: CodeBlock component for inline code snippets without GitHub source attribution

### Content Chapters

- [x] **CHAP-01**: Chapter 1 — Introduction & Getting Started (agentic loop, installation, interfaces, core tools, checkpointing)
- [x] **CHAP-02**: Chapter 2 — Project Context & Memory Management (CLAUDE.md hierarchy, auto-memory, context rot, .claudeignore)
- [x] **CHAP-03**: Chapter 3 — Models, Cost Economics & Permissions (model selection, effort levels, pricing tiers, permission system)
- [x] **CHAP-04**: Chapter 4 — Environment Sandboxing & Workspace Customization (config scopes, sandboxed execution, status lines)
- [x] **CHAP-05**: Chapter 5 — Remote Control, Headless Automation & Crons (remote control, headless mode, cron scheduling, HTTP proxies)
- [x] **CHAP-06**: Chapter 6 — Model Context Protocol (connecting external tools, transports, tool search, troubleshooting)
- [x] **CHAP-07**: Chapter 7 — Custom Skills (SKILL.md anatomy, slash commands vs auto-invocation, skill creator)
- [x] **CHAP-08**: Chapter 8 — Hooks & Lifecycle Automation (18 lifecycle events, exit codes, prompt/agent hooks)
- [x] **CHAP-09**: Chapter 9 — Git Worktrees & Subagent Delegation (parallel development, custom agent personas)
- [x] **CHAP-10**: Chapter 10 — Agent Teams & Advanced Orchestration (team architecture, shared tasks, dependency tracking)
- [x] **CHAP-11**: Chapter 11 — Security & Enterprise Administration (vulnerability scanning, managed settings, plugin governance)

### SVG Diagrams

- [x] **DIAG-01**: Build-time SVG diagram — Agentic Loop (gather context → take action → verify results cycle)
- [x] **DIAG-02**: Build-time SVG diagram — Hook Lifecycle (13+ lifecycle events with branching execution paths)
- [x] **DIAG-03**: Build-time SVG diagram — Permission Model (evaluation flowchart: allow/ask/deny rules)
- [x] **DIAG-04**: Build-time SVG diagram — MCP Architecture (server topology with stdio/HTTP transports)
- [x] **DIAG-05**: Build-time SVG diagram — Agent Teams (lead agent, subagents, shared task list, mailboxes)

### Interactive Components

- [x] **INTV-01**: Interactive permission flow explorer (React Flow clickable decision tree with allow/ask/deny paths)
- [x] **INTV-02**: Interactive hook event visualizer (React Flow event sequence with payload reveal on click)

### Site Integration

- [ ] **SITE-01**: Header navigation link for Claude Code guide
- [ ] **SITE-02**: Homepage callout card linking to the Claude Code guide
- [ ] **SITE-03**: /guides/ hub page updated to show both FastAPI and Claude Code guides
- [ ] **SITE-04**: All Claude Code guide pages included in sitemap
- [ ] **SITE-05**: LLMs.txt and LLMs-full.txt updated with Claude Code guide entries
- [ ] **SITE-06**: JSON-LD structured data (TechArticle + BreadcrumbList) on all guide pages
- [ ] **SITE-07**: Build-time OG images for landing page and all 11 chapter pages (12 total)
- [ ] **SITE-08**: Companion blog post with bidirectional cross-links to guide chapters

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Interactives

- **EINT-01**: Interactive MCP topology (upgrade static SVG to React Flow)
- **EINT-02**: Interactive context window visualizer showing token accumulation and auto-compaction
- **EINT-03**: Downloadable starter .claude/ configuration bundle

### Additional Content

- **ACNT-01**: FAQ page with FAQPage JSON-LD (write after observing reader questions)
- **ACNT-02**: CLAUDE.md starter templates with tabbed copy UI
- **ACNT-03**: Before/after comparison blocks showing workflow improvements

## Out of Scope

| Feature | Reason |
|---------|--------|
| Agent SDK / API coverage | Guide focuses on CLI tool, not programmatic API — different audience |
| CI/CD dedicated chapter | Deserves its own standalone guide — too large for a chapter |
| Translated versions | Only if analytics show non-English demand |
| Real-time Claude Code feature tracking | Static site cannot auto-update; lastVerified field provides manual freshness |
| Video embeds or screencasts | Adds maintenance burden, hosting cost; prose + diagrams sufficient |
| Interactive code playground | Would require server-side execution; contradicts static site constraint |
| Comparison with competing tools | Pure mastery guide — no Cursor/Copilot/Windsurf comparisons |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 90 | Complete |
| INFRA-02 | Phase 90 | Complete |
| INFRA-03 | Phase 90 | Complete |
| INFRA-04 | Phase 90 | Complete |
| INFRA-05 | Phase 90 | Complete |
| INFRA-06 | Phase 90 | Complete |
| INFRA-07 | Phase 90 | Complete |
| DIAG-01 | Phase 91 | Complete |
| DIAG-02 | Phase 91 | Complete |
| DIAG-03 | Phase 91 | Complete |
| DIAG-04 | Phase 91 | Complete |
| DIAG-05 | Phase 91 | Complete |
| INTV-01 | Phase 92 | Complete |
| INTV-02 | Phase 92 | Complete |
| CHAP-01 | Phase 93 | Complete |
| CHAP-02 | Phase 93 | Complete |
| CHAP-03 | Phase 93 | Complete |
| CHAP-04 | Phase 93 | Complete |
| CHAP-05 | Phase 93 | Complete |
| CHAP-06 | Phase 93 | Complete |
| CHAP-07 | Phase 94 | Complete |
| CHAP-08 | Phase 94 | Complete |
| CHAP-09 | Phase 94 | Complete |
| CHAP-10 | Phase 94 | Complete |
| CHAP-11 | Phase 94 | Complete |
| SITE-01 | Phase 95 | Pending |
| SITE-02 | Phase 95 | Pending |
| SITE-03 | Phase 95 | Pending |
| SITE-04 | Phase 95 | Pending |
| SITE-05 | Phase 95 | Pending |
| SITE-06 | Phase 95 | Pending |
| SITE-07 | Phase 95 | Pending |
| SITE-08 | Phase 95 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
