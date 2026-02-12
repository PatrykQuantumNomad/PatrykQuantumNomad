# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** Phase 11 - Hero & Project Curation (v1.1 Content Refresh) -- COMPLETE

## Current Position

Phase: 11 of 12 (Hero & Project Curation) -- COMPLETE
Plan: 1 of 1 in current phase (done)
Status: Phase 11 complete, ready for Phase 12
Last activity: 2026-02-12 — Completed 11-01 Hero & Project Curation

Progress: [███████████████████████░] 95% (v1.0 complete: 16/16 plans | v1.1: 6/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 22 (16 v1.0 + 6 v1.1)
- Average duration: ~10 min (v1.0 baseline)
- Total execution time: ~2.5 hours (v1.0)

**By Phase (v1.1):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 8. Schema & Config | 2/2 | 6min | 3min |
| 9. External Blog | 2/2 | 4min | 2min |
| 10. Social Links | 1/1 | 3min | 3min |
| 11. Hero & Projects | 1/1 | 3min | 3min |
| 12. Cleanup & Verify | 0/1 | - | - |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
All v1.0 decisions marked with outcomes (all good).

v1.1 decisions so far:
- "Core only" for social links: update directly in component files, no centralized site.ts for social
- "All listed" for hero: includes site.ts for hero keyword propagation
- Keep existing blog post (building-kubernetes-observability-stack), only delete draft-placeholder.md
- Single-collection approach for external blog posts (schema extension, not separate data source)
- LinkedIn removed from UI but consider keeping in JSON-LD sameAs (deferred to v1.2 per CONFIG-02)
- Used `as const` for siteConfig to preserve literal types for downstream consumers
- Used `z.enum` for blog source field to enforce type safety on blog post sources
- Added `@astrojs/check` and `typescript` as dev dependencies for type verification
- Used spread `[...siteConfig.roles]` in define:vars to convert readonly tuple for JSON serialization
- Computed pageTitle/pageDescription in frontmatter for clean config-to-template data flow
- Frontmatter-only stubs with no body content for external blog posts
- getStaticPaths guards exclude external posts in both dev and prod modes (not just PROD)
- Inline SVG for external link icon (no icon library dependency)
- Nullish coalescing for RSS link fallback (externalUrl ?? internal path)

### Pending Todos

None yet.

### Blockers/Concerns

- [Infra]: DNS configuration for patrykgolabek.dev is a manual step outside automation scope
- [Content]: Hero tagline approved by user during Phase 11 execution (resolved)

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 11-01-PLAN.md (Hero & Project Curation)
Resume file: None
Next: Plan and execute Phase 12 (Cleanup & Verification)
