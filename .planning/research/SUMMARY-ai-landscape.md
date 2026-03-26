# Research Summary: AI Landscape Explorer

**Domain:** Interactive educational AI knowledge map integrated into Astro 5 portfolio
**Researched:** 2026-03-26
**Overall confidence:** HIGH

## Executive Summary

The AI Landscape Explorer adds an interactive D3 force-directed graph of ~83 AI concepts (parsed from an existing DOT file) to the portfolio site at `/ai-landscape/`. Each node gets an individual SEO-optimized detail page with educational content, and the landing page features an interactive graph with click-to-explore side panel.

The existing Astro 5 architecture is an excellent fit. The project needs only 2 new npm packages (`d3-force` + `@types/d3-force`), because all other required D3 modules (`d3-selection`, `d3-zoom`, `d3-drag`, `d3-transition`, `d3-shape`) are already installed. The content collection pattern (`file()` loader + Zod schema + `getStaticPaths`) is identical to what powers the EDA distributions and Database Compass sections. The React island pattern (`client:only="react"` with nanostores) is proven across 6+ interactive components in the codebase.

The primary architectural decision is pre-computing force layout positions at build time using `d3-force` in a headless TypeScript script. This eliminates runtime simulation jank, provides a static SVG fallback for no-JS/crawler users, and keeps `d3-force` out of the client bundle entirely. The client-side graph renders from known coordinates and uses only the already-installed `d3-zoom` and `d3-drag` for interaction.

The highest-risk area is not technical -- it is content. Writing substantive educational content for 83 AI concepts is the most time-consuming task and the most important for SEO. Thin auto-generated pages risk Google's Helpful Content penalty, which is a site-wide signal that could affect the entire portfolio. Content quality must be gated before pages go live.

## Key Findings

**Stack:** Only `d3-force` (build-time) and `@types/d3-force` are new dependencies. Everything else is already installed.

**Architecture:** Build-time DOT-to-JSON pipeline -> content collection -> static pages + pre-computed force layout -> React island with SVG graph and side panel. Follows existing patterns exactly.

**Critical pitfall:** Thin content penalty is the highest-stakes risk. 83 detail pages need 300-500 words of unique, hand-authored educational content each. This is the bottleneck that determines project timeline.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Data Foundation** - Parse DOT file, define Zod schema, create content collection, seed node JSON
   - Addresses: Data model, schema validation, DOT-to-JSON transformation
   - Avoids: Building on unstable data model (Pitfall 8: DOT hierarchy mismatch)
   - Estimated effort: Low-Medium

2. **Content Authoring** - Write educational content for all 83 nodes
   - Addresses: Table stakes content, "plain English" differentiator, "why it matters" differentiator
   - Avoids: Thin content penalty (Pitfall 5, the highest-stakes risk)
   - Estimated effort: HIGH -- this is the longest phase. Consider batching by cluster.
   - Note: Can be done in parallel with Phase 3 if schema is stable

3. **Static SEO Pages** - Generate 83 detail pages with getStaticPaths, JSON-LD, OG images, sitemap
   - Addresses: Individual SEO pages, breadcrumbs, OG images, structured data
   - Avoids: OG image build time issues (use shared template initially)
   - Estimated effort: Medium
   - Delivers SEO value immediately, without needing the interactive graph

4. **Force Layout + Static Fallback** - Pre-compute layout, generate static SVG on landing page
   - Addresses: Build-time force computation, static SVG fallback, landing page structure
   - Avoids: Runtime simulation jank (Pitfall 3), non-deterministic layout (Pitfall 8)
   - Estimated effort: Medium
   - Depends on: Phase 1 (nodes.json + edges.json must exist)

5. **Interactive Graph** - React island with D3 SVG rendering, zoom/pan, click-to-select
   - Addresses: Force graph visualization, zoom/pan, node click, side panel
   - Avoids: D3/React DOM conflicts (Pitfall 4: SVG performance), scroll trap (Pitfall 2)
   - Estimated effort: High
   - Depends on: Phase 4 (layout.json must exist)

6. **Polish + Accessibility** - Cluster hulls, hover highlighting, keyboard navigation, mobile optimization
   - Addresses: Cluster filter, hover effects, ARIA labels, mobile responsiveness
   - Avoids: Mobile readability issues (Pitfall 7), accessibility gaps (Pitfall 12)
   - Estimated effort: Medium

**Phase ordering rationale:**
- Data model must come first because every downstream component depends on the JSON schema
- Content authoring is separated as its own phase because it is the longest task and the most important for SEO value. It can overlap with technical phases
- Static pages before interactive graph because they deliver SEO value independently and validate the data model end-to-end
- Force layout before interactive graph because the graph renders from pre-computed positions
- Polish last because all differentiator features (hover, cluster filter, accessibility) require the core graph to exist first

**Research flags for phases:**
- Phase 2 (Content Authoring): Needs deeper planning around content strategy -- tiered approach (full content for top ~20 concepts, shorter for the rest) vs uniform depth
- Phase 5 (Interactive Graph): Needs phase-specific research on D3-in-React patterns, specifically the D3 ref vs React JSX rendering approach
- Phase 6 (Polish): Mobile layout (force graph vs list view) needs design decision

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified all existing dependencies in `package.json` and `node_modules/`. Only d3-force is new. |
| Features | HIGH | Feature list derived from DOT file analysis (83 nodes, 9 clusters, ~130 edges) and existing site patterns |
| Architecture | HIGH | Architecture directly mirrors proven patterns: EDA distributions (content collection + getStaticPaths + D3 React island), Database Compass (JSON file() loader), tool analyzers (React island + nanostore) |
| Pitfalls | HIGH | Pitfalls identified from codebase analysis (existing D3 usage, React Flow patterns, OG image pipeline) and D3 ecosystem documentation |
| Content Strategy | MEDIUM | SEO impact of thin content is well-documented, but the optimal content depth per node (300 words? 500? 1000?) needs validation against actual writing effort |

## Gaps to Address

- **Content depth strategy:** Should all 83 nodes get equal content depth, or should ~20 high-traffic concepts (LLM, Transformers, GenAI, Agentic AI) get deeper treatment? Needs phase-specific research during content planning.
- **Mobile graph vs list view:** Architecture supports both, but the design decision (force graph at all widths vs list view below 768px) needs UX validation.
- **Cluster visual treatment:** Convex hulls vs colored background regions vs no cluster boundaries -- needs visual prototyping during the graph implementation phase.
- **View transitions interaction:** How the force graph state persists across Astro view transitions needs testing with `transition:persist` + `client:only="react"`.

## Files Created

| File | Purpose |
|------|---------|
| `.planning/research/SUMMARY-ai-landscape.md` | This file -- executive summary with roadmap implications |
| `.planning/research/STACK-ai-landscape.md` | Technology recommendations (d3-force only new dep) |
| `.planning/research/FEATURES-ai-landscape.md` | Feature landscape (table stakes, differentiators, anti-features) |
| `.planning/research/ARCHITECTURE-ai-landscape.md` | Full architecture: data flow, component boundaries, patterns, anti-patterns |
| `.planning/research/PITFALLS-ai-landscape.md` | 15 pitfalls ranked by severity with prevention strategies |
