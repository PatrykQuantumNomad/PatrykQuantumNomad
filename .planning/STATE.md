# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.8 EDA Visual Encyclopedia — Phase 50 (SVG Generation)

## Current Position

Phase: 50 of 55 (SVG Generation) -- PHASE COMPLETE
Plan: 3 of 3 in current phase (all complete)
Status: Phase 50 complete, ready for Phase 51
Last activity: 2026-02-25 — Completed 50-03 (contour, distribution curve, composite generators, barrel export)

Progress: ████░░░░░░ 39% (v1.8 — 9/23 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 109 (15 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 13 v1.4 + 10 v1.5 + 14 v1.6 + 23 v1.7 + 6 v1.8)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | 15 | 37 | 2026-02-17 |
| v1.4 Dockerfile Analyzer | 22-27 | 13 | 38 | 2026-02-20 |
| v1.5 Database Compass | 28-32 | 10 | 28 | 2026-02-22 |
| v1.6 Compose Validator | 33-40 | 14 | 100 | 2026-02-23 |
| v1.7 K8s Analyzer | 41-47 | 23 | 123 | 2026-02-23 |
| v1.8 EDA Encyclopedia | 48-55 | ~23 | 145 | in progress |
| **Total** | **55** | **~126** | **548** | |

**Phase Execution Log:**

| Phase-Plan | Duration | Tasks | Files |
|------------|----------|-------|-------|
| 49-01 | 4min | 2 | 1 |
| 49-02 | 2min | 1 | 1 |
| 49-03 | 6min | 3 | 22 |
| 50-01 | 4min | 2 | 6 |
| 50-02 | 4min | 2 | 6 |
| 50-03 | 8min | 2 | 7 |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.0-v1.7 decisions archived in respective milestone files.

v1.8 decisions:
- KaTeX version: remark-math@6.0.0 works with Astro 5 (no fallback needed, confirmed in 48-01)
- KaTeX CSS conditional loading via Layout head slot pattern (confirmed in 48-01)
- OG caching: content-hash of (title + description), md5 truncated to 12 hex chars, CACHE_VERSION salt (confirmed in 48-02)
- D3 micro-modules only (17KB gzipped), never full d3 package (280KB)
- EDA content collections use file() loader for JSON, glob() for MDX pages (confirmed in 48-02)
- D3 bundle isolation confirmed: exactly 1 chunk (16.7KB), distribution pages only (confirmed in 48-03)
- client:visible hydration for D3 islands (load on scroll, not page load) (confirmed in 48-03)
- SVG cleanup on mount+unmount for view transition safety (confirmed in 48-03)
- 29 graphical entries (not 30): DATA-01 count includes PlotVariantSwap component (GRAPH-30), not a data entry (confirmed in 49-01)
- Cross-links validated at data level: relatedTechniques slugs reference entries within techniques.json (confirmed in 49-01)
- phi/Phi notation for power-normal, power-lognormal, fatigue-life PDF/CDF formulas (compact standard convention, confirmed in 49-02)
- Tukey-Lambda defined via quantile function Q(F) -- no closed-form PDF/CDF (confirmed in 49-02)
- Discrete distributions (binomial, poisson) use PMF notation P(X=k) in pdfFormula field (confirmed in 49-02)
- MDX stub bodies use category-specific phase comments (Phase 52 for foundations, Phase 54 for case studies/reference) (confirmed in 49-03)
- Dataset values use realistic NIST reference data subsets for meaningful plot output (confirmed in 49-03)
- Validation script uses node:fs direct I/O rather than astro/zod imports for portability (confirmed in 49-03)
- PALETTE uses CSS custom property references for automatic dark/light theme support without regenerating SVGs (confirmed in 50-01)
- Dark mode CSS overrides added to global.css now (not deferred to Phase 55) for immediate visual verification (confirmed in 50-01)
- statistics.ts pure TypeScript math (~200 lines): KDE, FFT, regression, normal quantile, autocorrelation (confirmed in 50-01)
- All SVG coordinate values use .toFixed(2) to prevent markup bloat (confirmed in 50-01)
- Scatter confidence band uses pointwise leverage-based 95% CI, rendered as polygon path (confirmed in 50-02)
- ACF lollipop style (line+circle) for autocorrelation plots, significance bounds at 1.96/sqrt(n) (confirmed in 50-02)
- PPCC mode uses Tukey-Lambda quantile Q(p)=(p^r-(1-p)^r)/r for shape parameter sweep (confirmed in 50-02)
- Star plot reuses polarToCartesian from radar-math.ts with 40px viewBox padding for labels (confirmed in 50-02)
- Spectral plot auto-selects log/linear Y scale based on PSD dynamic range (>100:1 triggers log) (confirmed in 50-02)
- Contour fills use quantized-opacity with PALETTE.dataSecondary (low) and PALETTE.dataPrimary (high) -- no hardcoded hex colors (confirmed in 50-03)
- Lanczos gamma (g=7, 9 coefficients) for chi-square, t, gamma distribution math (confirmed in 50-03)
- Abramowitz & Stegun 7.1.26 erf approximation for normalCDF with max error 1.5e-7 (confirmed in 50-03)
- Composite plots strip SVG wrappers and compose via <g transform> groups for multi-panel layouts (confirmed in 50-03)
- Phase 50 complete: 13 generators + 2 cross-cutting requirements (SVG-12, SVG-13) = 15 SVG requirements satisfied (confirmed in 50-03)

### Pending Todos

None.

### Blockers/Concerns

- ~~[Infra]: KaTeX + MDX formula parsing version conflicts~~ RESOLVED: remark-math@6.0.0 works (48-01)
- ~~[Infra]: D3 bundle must not leak to non-distribution pages (verify with Vite bundle analysis)~~ RESOLVED: D3 isolated to 1 chunk, distribution pages only (48-03)
- ~~[Infra]: OG image generation at 90+ page scale risks build time regression~~ RESOLVED: content-hash caching implemented (48-02)
- [Content]: NIST formula accuracy -- character-by-character verification required
- [SEO]: Bulk publishing 90+ template-similar pages risks SpamBrain classification
- ~~[Tech Debt]: GSAP/D3 animation lifecycle conflicts need EDALayout.astro isolation~~ RESOLVED: EDALayout uses slot composition (48-01)

## Session Continuity

Last session: 2026-02-25
Stopped at: Completed 50-03-PLAN.md (contour, distribution curve, composite generators, barrel export -- Phase 50 complete)
Resume file: None
Next: Execute Phase 51 (graphical technique pages)
