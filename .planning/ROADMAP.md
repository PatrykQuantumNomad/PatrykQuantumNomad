# Roadmap: v1.16 Claude Code Guide

## Overview

Build a comprehensive multi-chapter Claude Code guide at `/guides/claude-code/` — the definitive zero-to-hero resource covering setup through production mastery and advanced agent workflows. Infrastructure refactoring comes first (7 hardcoded single-guide assumptions to fix with regression gate on FastAPI guide), then SVG diagrams and interactive components to establish visual vocabulary, then 11 MDX chapters split into foundation and advanced tiers, and finally site integration with companion blog post.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-11)
- ✅ **v1.1 Content Refresh** - Phases 8-12 (shipped 2026-02-12)
- ✅ **v1.2 Projects Page Redesign** - Phases 13-15 (shipped 2026-02-13)
- ✅ **v1.3 The Beauty Index** - Phases 16-21 (shipped 2026-02-17)
- ✅ **v1.4 Dockerfile Analyzer** - Phases 22-27 (shipped 2026-02-20)
- ✅ **v1.5 Database Compass** - Phases 28-32 (shipped 2026-02-22)
- ✅ **v1.6 Compose Validator** - Phases 33-40 (shipped 2026-02-23)
- ✅ **v1.7 K8s Analyzer** - Phases 41-47 (shipped 2026-02-23)
- ✅ **v1.8 EDA Encyclopedia** - Phases 48-55 (shipped 2026-02-25)
- ✅ **v1.9 Case Study Deep Dive** - Phases 56-63 (shipped 2026-02-27)
- ✅ **v1.10 EDA Graphical NIST Parity** - Phases 64-68 (shipped 2026-02-27)
- ✅ **v1.11 Beauty Index: Lisp** - Phases 69-71 (shipped 2026-03-02)
- ✅ **v1.12 Dockerfile Rules Expansion** - Phases 72-74 (shipped 2026-03-02)
- ✅ **v1.13 GHA Workflow Validator** - Phases 75-81 (shipped 2026-03-04)
- ✅ **v1.14 DevOps Skills Publishing** - Phases 82-84 (shipped 2026-03-05)
- ✅ **v1.15 FastAPI Production Guide** - Phases 85-89 (shipped 2026-03-08)
- 🚧 **v1.16 Claude Code Guide** - Phases 90-95 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (90, 91, ...): Planned milestone work
- Decimal phases (90.1, 90.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 90: Infrastructure Refactoring** - Multi-guide content collections, schema extension, guide metadata, page routing, CodeBlock component, and FastAPI regression gate
- [x] **Phase 91: SVG Diagram Generators** - 5 build-time SVG architecture diagrams (agentic loop, hook lifecycle, permission model, MCP architecture, agent teams) (completed 2026-03-10)
- [x] **Phase 92: Interactive React Components** - Permission flow explorer and hook event visualizer as React Flow islands (completed 2026-03-10)
- [x] **Phase 93: Foundation Content Chapters** - Chapters 1-6 covering setup, context management, models/costs, sandboxing, remote/headless, and MCP (completed 2026-03-10)
- [ ] **Phase 94: Advanced Content Chapters** - Chapters 7-11 covering skills, hooks, worktrees, agent teams, and security/enterprise
- [ ] **Phase 95: Site Integration & Blog Post** - Header nav, homepage callout, hub page, sitemap, LLMs.txt, JSON-LD, OG images, companion blog post

## Phase Details

### Phase 90: Infrastructure Refactoring
**Goal**: The existing single-guide codebase supports multiple independent guides without hardcoded assumptions, and the Claude Code guide pipeline is ready to accept content
**Depends on**: Nothing (first phase in v1.16)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07
**Success Criteria** (what must be TRUE):
  1. Navigating to /guides/fastapi-production/ and all 11 FastAPI chapter pages renders identical content to the pre-refactor version (regression gate)
  2. Navigating to /guides/claude-code/ shows a landing page with chapter card grid and guide description
  3. Navigating to /guides/claude-code/introduction shows a rendered chapter page with sidebar navigation, breadcrumbs, and prev/next links
  4. A CodeBlock component renders inline code snippets with syntax highlighting and file-path header but no GitHub source link
  5. Production build succeeds with zero errors and both guides appear in the build output
**Plans:** 4/4 plans executed — COMPLETE (2026-03-10)
Plans:
- [x] 90-01-PLAN.md — Schema extension, content collections, guide.json, sitemap builder refactor
- [x] 90-02-PLAN.md — CodeBlock component, GuideLayout + GuideJsonLd parameterization
- [x] 90-03-PLAN.md — Claude Code landing page, chapter routing, hub page, LLMs.txt multi-guide
- [x] 90-04-PLAN.md — OG images + full regression verification

### Phase 91: SVG Diagram Generators
**Goal**: Five build-time SVG architecture diagrams are available as Astro components for embedding in guide chapters
**Depends on**: Phase 90
**Requirements**: DIAG-01, DIAG-02, DIAG-03, DIAG-04, DIAG-05
**Success Criteria** (what must be TRUE):
  1. Each of the 5 SVG diagrams renders correctly in both dark and light themes via CSS custom properties
  2. The Agentic Loop diagram shows the gather-context / take-action / verify-results cycle with clear directional flow
  3. The Hook Lifecycle diagram visualizes all lifecycle events with branching execution paths
  4. The Permission Model diagram shows the evaluation flowchart with allow/ask/deny decision paths
  5. The MCP Architecture diagram shows server topology with stdio and HTTP transport connections
**Plans:** 3/3 plans complete
Plans:
- [x] 91-01-PLAN.md — Extend diagram-base.ts + Agentic Loop (DIAG-01) + Hook Lifecycle (DIAG-02)
- [x] 91-02-PLAN.md — Permission Model (DIAG-03) + MCP Architecture (DIAG-04)
- [x] 91-03-PLAN.md — Agent Teams (DIAG-05) + full regression verification

### Phase 92: Interactive React Components
**Goal**: Two interactive React Flow visualizers let readers explore Claude Code permission evaluation and hook event sequences hands-on
**Depends on**: Phase 91
**Requirements**: INTV-01, INTV-02
**Success Criteria** (what must be TRUE):
  1. The permission flow explorer renders as an interactive decision tree where clicking a node reveals the allow/ask/deny evaluation path
  2. The hook event visualizer displays an event sequence where clicking an event reveals its payload structure
  3. Both components load via client:visible (lazy) and do not impact page load performance for readers who do not scroll to them
**Plans:** 2/2 plans complete
Plans:
- [x] 92-01-PLAN.md — Permission flow explorer data + React Flow component (INTV-01)
- [x] 92-02-PLAN.md — Hook event visualizer data + React Flow component (INTV-02)

### Phase 93: Foundation Content Chapters
**Goal**: Readers can follow a progressive learning path from zero Claude Code knowledge through core daily-use features (setup, context, models, environment, remote control, MCP)
**Depends on**: Phase 90, Phase 91
**Requirements**: CHAP-01, CHAP-02, CHAP-03, CHAP-04, CHAP-05, CHAP-06
**Success Criteria** (what must be TRUE):
  1. A reader with no prior Claude Code experience can follow Chapter 1 from installation through first successful agentic interaction
  2. A reader understands how to structure CLAUDE.md files, manage context window limits, and use .claudeignore after reading Chapter 2
  3. A reader can make informed model and effort-level choices based on cost/quality tradeoffs after reading Chapter 3
  4. A reader understands sandboxing, workspace configuration scopes, and environment customization after reading Chapter 4
  5. Chapters 5-6 enable a reader to set up headless automation, cron scheduling, and connect MCP servers for external tool integration
**Plans:** 3/3 plans complete
Plans:
- [x] 93-01-PLAN.md — Chapter 1 (Introduction & Getting Started) + Chapter 2 (Project Context & Memory)
- [x] 93-02-PLAN.md — Chapter 3 (Models, Costs & Permissions) + Chapter 4 (Environment & Sandboxing)
- [x] 93-03-PLAN.md — Chapter 5 (Remote Control & Headless) + Chapter 6 (Model Context Protocol)

### Phase 94: Advanced Content Chapters
**Goal**: Readers who have mastered the foundations can extend Claude Code with custom skills, hooks, parallel worktrees, multi-agent orchestration, and enterprise security controls
**Depends on**: Phase 93, Phase 92
**Requirements**: CHAP-07, CHAP-08, CHAP-09, CHAP-10, CHAP-11
**Success Criteria** (what must be TRUE):
  1. A reader can create a custom SKILL.md with proper anatomy and understand slash commands vs auto-invocation after reading Chapter 7
  2. A reader can configure hook lifecycle automations for pre/post actions on Claude Code events after reading Chapter 8
  3. A reader understands git worktree-based parallel development and subagent delegation patterns after reading Chapter 9
  4. A reader can set up agent team architecture with shared task lists, dependency tracking, and mailbox communication after reading Chapter 10
  5. A reader understands vulnerability scanning, managed enterprise settings, and plugin governance after reading Chapter 11
**Plans:** 3 plans
Plans:
- [ ] 94-01-PLAN.md — Chapter 7 (Custom Skills) + Chapter 8 (Hooks & Lifecycle Automation)
- [ ] 94-02-PLAN.md — Chapter 9 (Git Worktrees & Subagent Delegation) + Chapter 10 (Agent Teams & Advanced Orchestration)
- [ ] 94-03-PLAN.md — Chapter 11 (Security & Enterprise Administration) + full build verification

### Phase 95: Site Integration & Blog Post
**Goal**: The Claude Code guide is fully discoverable across the entire site, search engines, and AI systems, with a companion blog post driving bidirectional traffic
**Depends on**: Phase 93, Phase 94
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07, SITE-08
**Success Criteria** (what must be TRUE):
  1. The site header navigation includes a link to the Claude Code guide visible on all pages
  2. The homepage shows a callout card for the Claude Code guide and the /guides/ hub page lists both FastAPI and Claude Code guides
  3. All 12 guide pages (landing + 11 chapters) appear in sitemap-index.xml, LLMs.txt, and LLMs-full.txt
  4. Every guide page has TechArticle JSON-LD structured data, BreadcrumbList markup, and a unique build-time OG image
  5. A companion blog post exists with bidirectional cross-links to all guide chapters, targeting long-tail workflow keywords
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 90 → 91 → 92 → 93 → 94 → 95

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 90. Infrastructure Refactoring | 4/4 | Complete | 2026-03-10 |
| 91. SVG Diagram Generators | 3/3 | Complete   | 2026-03-10 |
| 92. Interactive React Components | 2/2 | Complete   | 2026-03-10 |
| 93. Foundation Content Chapters | 3/3 | Complete | 2026-03-10 |
| 94. Advanced Content Chapters | 0/3 | Not started | - |
| 95. Site Integration & Blog Post | 0/TBD | Not started | - |
