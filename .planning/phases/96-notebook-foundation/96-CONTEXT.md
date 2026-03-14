# Phase 96: Notebook Foundation - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

TypeScript nbformat v4.5 types, cell factories, case study registry, and requirements.txt template. This phase builds the contracts and factories that all notebook generation (phases 97 and 100) depends on. No actual notebooks are produced in this phase.

</domain>

<decisions>
## Implementation Decisions

### Notebook cell structure
- Textbook chapter style with theory before each technique, building understanding progressively
- Rich explanations: 2-4 paragraph markdown cells explaining what each step does, why it matters, and how to interpret output
- Automated interpretation: code prints conclusions like "Reject H0 at alpha=0.05: data is NOT random (p=0.003)"
- Each notebook ends with key findings summary + next steps (pointers to related techniques, case studies, and the website)

### Case study registry design
- Per-study config files: 10 separate config files, one per case study (cleaner diffs, easier to edit individually)
- Comprehensive config: registry defines everything (dataset file, skiprows, column names, expected statistics, test parameters, plot titles)
- Include NIST-verified expected values for validation (mean, std dev, test statistics) so notebooks can assert correctness
- Extended type: single base CaseStudyConfig with optional fields for model params, DOE factors — no discriminated union needed

### Python setup experience
- First cell: dependency check + install with try/except import checks and !pip install fallback
- Matplotlib configured with dark theme matching the site's Quantum Explorer aesthetic (dark background, accent colors)
- No Python version check — modern scientific stack handles compatibility
- Custom seaborn theme configured alongside matplotlib for consistent dark-themed plot aesthetics

### Data loading approach
- Load from bundled .DAT file via pd.read_fwf() — straightforward file read from zip contents
- Data loading cell includes preview: df.shape, df.head(), df.dtypes to confirm successful load
- Assert expected row count: `assert len(df) == N, 'Expected N rows'` catches parsing errors immediately
- Colab fallback: if local file not found, fetch from GitHub raw URL (raw.githubusercontent.com)

### Claude's Discretion
- Exact matplotlib/seaborn color palette for dark theme
- Cell ID generation strategy (deterministic, hash-based or sequential)
- TypeScript interface structure details
- File organization within src/utils/notebooks/

</decisions>

<specifics>
## Specific Ideas

- Dark theme for plots should match the site's Quantum Explorer aesthetic — dark backgrounds, accent colors consistent with the site's visual identity
- Notebooks should feel like a textbook chapter, not just a code dump — rich narrative that teaches EDA concepts as users work through the analysis
- Colab compatibility is a first-class concern — data loading must work both locally (bundled .DAT) and in Colab (GitHub raw URL fetch)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 96-notebook-foundation*
*Context gathered: 2026-03-14*
