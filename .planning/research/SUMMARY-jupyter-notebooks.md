# Research Summary: Jupyter Notebook Case Study Downloads

**Domain:** Build-time generation of downloadable Jupyter notebooks for EDA case studies
**Researched:** 2026-03-14
**Overall confidence:** HIGH

## Executive Summary

Adding downloadable Jupyter notebooks to the existing Astro 5 EDA case study pages is architecturally straightforward. The core insight is that Jupyter notebooks (.ipynb files) are plain JSON conforming to the nbformat v4.5 specification -- they can be generated entirely in TypeScript at build time without any Python dependency or npm notebook library. The only new npm dependency needed is `archiver` (for zip file creation), plus its TypeScript type definitions.

The recommended approach uses a custom Astro integration (following the existing `indexnow.ts` pattern) that hooks into `astro:build:done`. For each of the 10 case studies, it constructs a valid .ipynb JSON object, bundles it with the corresponding NIST .DAT file and a requirements.txt, creates a .zip archive, and writes it to `dist/downloads/notebooks/{slug}.zip`. The case study pages already have a dataset panel (CaseStudyDataset.astro) with CSV download and NIST source buttons -- adding a "Download Notebook" button alongside these is a natural extension.

The Python scientific stack (numpy, scipy, pandas, matplotlib, seaborn) is specified inside the notebooks as pip requirements, not as build-time dependencies. Version floors are set broadly (e.g., `pandas>=2.0,<4`) to maximize compatibility across user environments. The notebooks are generated with empty outputs -- users execute them locally, which is the standard Jupyter workflow.

The highest-risk area is ensuring the .DAT file parsing code works correctly for each case study. NIST .DAT files are not standard CSV -- they use fixed-width or whitespace-delimited formats with varying header structures. Each of the 10 loading routines must be tested against the actual .DAT file.

## Key Findings

**Stack:** Only 2 new npm dependencies: `archiver` ^7.0.1 (zip creation) + `@types/archiver` ^7.0.0 (types). Notebook generation is hand-rolled TypeScript -- no notebook library needed.
**Architecture:** Custom Astro integration using `astro:build:done` hook, following the existing `indexnow.ts` pattern. Notebook builder module generates nbformat v4.5 JSON.
**Critical pitfall:** NIST .DAT file format variability -- each case study's data-loading code must be individually verified against the actual file structure.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Notebook Infrastructure** - Build the notebook builder module, cell factory, and archiver packager
   - Addresses: Notebook JSON generation, zip packaging, TypeScript types
   - Avoids: Pitfall 1 (invalid nbformat) by establishing typed foundation first

2. **Notebook Content & Templates** - Create per-case-study analysis templates and .DAT parsing code
   - Addresses: All 10 case study notebooks with correct data loading and EDA analysis
   - Avoids: Pitfall 2 (.DAT parsing failures) by requiring manual verification of each file

3. **Download UI & Integration** - Wire up the Astro integration, add download buttons to case study pages
   - Addresses: User-facing download experience, build pipeline integration
   - Avoids: Pitfall 7 (GitHub Pages 404) by testing deployment

**Phase ordering rationale:**
- Infrastructure first because the builder module is the foundation for all 10 notebooks
- Content second because templates depend on the builder API
- UI last because it depends on the integration producing the zip files

**Research flags for phases:**
- Phase 2 (Content): Needs hands-on verification -- each .DAT file has different format quirks. This is the most labor-intensive phase.
- Phase 1 (Infrastructure): Standard patterns, unlikely to need additional research. nbformat v4.5 spec is well-documented.
- Phase 3 (UI): Standard Astro patterns, unlikely to need additional research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only 2 new deps. archiver is battle-tested (14.6M weekly downloads). nbformat is well-documented JSON. |
| Features | HIGH | Clear scope (10 case studies). Existing UI pattern (CaseStudyDataset.astro) to extend. |
| Architecture | HIGH | Follows existing integration pattern. Build hook API verified against Astro docs. |
| Pitfalls | HIGH | Most pitfalls are well-understood (file formats, stream handling). Highest risk (.DAT parsing) is mitigable with testing. |

## Gaps to Address

- **Per-case-study .DAT file format:** Each of the 10 .DAT files needs its parsing parameters documented (delimiter, skip rows, column names). This is implementation work, not research -- the files are available locally in `handbook/datasets/`.
- **Notebook analysis depth:** The research recommends starting with a standard EDA template (4-plot, summary stats) and enhancing individual notebooks later. The specific analysis code for each case study (e.g., ANOVA for ceramic strength, stationarity tests for random walk) will be authored during the content phase.
- **Download button design:** The exact UI placement and styling within CaseStudyDataset.astro was not researched. This is a design decision, not a technical question.

---

*Research summary: 2026-03-14*
