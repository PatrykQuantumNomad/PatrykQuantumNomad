# Phase 101: Site Integration - Validation

**Phase:** 101
**Created:** 2026-03-15

## Requirement-to-Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| SITE-01 | Landing page renders all 10 notebooks with correct URLs | smoke (build check) | `npx astro build && test -f dist/eda/notebooks/index.html` |
| SITE-02 | Blog post renders without errors | smoke (build check) | `npx astro build && test -f dist/blog/eda-jupyter-notebooks/index.html` |
| SITE-03 | LLMs.txt includes notebooks section | smoke (build check) | `npx astro build && grep 'Jupyter Notebooks' dist/llms.txt` |
| SITE-04 | Sitemap includes /eda/notebooks/ | smoke (build check) | `npx astro build && grep 'eda/notebooks' dist/sitemap-0.xml` |
| SITE-05 | OG image endpoint returns PNG | smoke (build check) | `npx astro build && test -f dist/open-graph/eda/notebooks.png` |

## Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose && npx astro build`
- **Phase gate:** Full suite green + `astro build` successful + all 5 smoke checks pass

## Notes

All requirements are verified via build-time smoke tests. No new unit tests required — this phase creates pages/content using existing tested utilities (CASE_STUDY_REGISTRY, getDownloadUrl, getColabUrl, generateEdaSectionOgImage).
