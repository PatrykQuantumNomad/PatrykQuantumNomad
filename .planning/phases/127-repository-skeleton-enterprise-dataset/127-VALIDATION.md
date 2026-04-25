---
phase: 127-repository-skeleton-enterprise-dataset
type: validation
derived_from: 127-RESEARCH.md "## Validation Architecture"
generated_at: 2026-04-25
---

# Phase 127 — Validation Architecture (Nyquist Gate)

This file is the canonical Wave 0 validation contract for Phase 127. Every requirement in `## Phase Requirements` of `127-RESEARCH.md` MUST trace to a test file that exists BEFORE the plan that depends on it. This file enforces dimension 8 (Nyquist) of the plan checker.

## Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 8.4.2 |
| Config file | `../rag-architecture-patterns/pyproject.toml` `[tool.pytest.ini_options]` |
| Quick run | `uv run pytest tests/ -x -q -m 'not live'` |
| Full suite | `uv run pytest tests/ -v` |
| Live marker | `markers = ["live: tests that hit real APIs and incur cost"]` |

## Requirement → Test File Map

| Req ID | Behavior | Automated Trace | Test File | Created In |
|--------|----------|-----------------|-----------|------------|
| REPO-01 | Repo exists at `PatrykQuantumNomad/rag-architecture-patterns`; README links to blog placeholder | `pytest tests/test_repo_metadata.py -v -m "not live"` | `tests/test_repo_metadata.py` | Plan 02 / Task 3 |
| REPO-02 | Dataset directory tree present; manifests parse + reference real files; ≥80 PDFs after Plan 04; ≥1 image and ≥1 video after Plan 05 | `pytest tests/test_dataset.py -v -m "not live"` | `tests/test_dataset.py` | Plan 02 / Task 3 (initial form), extended in-place by Plan 06 / Task 2 |
| REPO-03 | All `shared/` modules importable at module level (lazy `get_settings()` factory); smoke test exercises real Gemini APIs in <5s for ~$0.0001 | `pytest tests/smoke_test.py -v` (live) and `pytest tests/smoke_test.py::test_imports -v -m "not live"` | `tests/smoke_test.py` | Plan 02 / Task 3 |
| REPO-04 | Each `tier-N/` has its own `requirements.txt` referencing parent extras; pyproject extras defined for every tier | `pytest tests/test_tier_requirements.py -v -m "not live"` | `tests/test_tier_requirements.py` | Plan 02 / Task 3 |
| REPO-06 | `.env.example` exists at repo root; documents `GEMINI_API_KEY` (required) plus optional keys | `pytest tests/test_env_example.py -v -m "not live"` | `tests/test_env_example.py` | Plan 02 / Task 3 |

Plans 04 and 05 do NOT create new test files. They re-run the existing `tests/test_dataset.py` after their data lands (it was authored in Plan 02 with conditional/parametric assertions that pass at every wave boundary — empty, partial, and full).

Plan 06 / Task 2 EXTENDS `tests/test_dataset.py` with stricter post-Plan-05 assertions (≥80 papers, ≥30 figures with ≥7 captions, ≥1 video with verified license, metadata.json present) and adds `tests/test_golden_qa.py`. It does not move REPO-02 trace ownership.

## Wave 0 Gaps Closed

For every test file referenced above, the following table proves the file lands BEFORE the plan that needs it.

| Test File | Created By | Wave | Consumed By (need to pass) | Wave |
|-----------|------------|------|----------------------------|------|
| `tests/conftest.py` | Plan 01 / Task 3 (placeholder), Plan 02 / Task 1 (fixtures) | 1 / 2 | Plans 02, 04, 05, 06 | 2-5 |
| `tests/test_repo_metadata.py` | Plan 02 / Task 3 | 2 | Phase verification | 5+ |
| `tests/test_env_example.py` | Plan 02 / Task 3 | 2 | Phase verification | 5+ |
| `tests/test_tier_requirements.py` | Plan 02 / Task 3 | 2 | Phase verification | 5+ |
| `tests/test_dataset.py` (initial: directory contracts + conditional manifest checks) | Plan 02 / Task 3 | 2 | Plan 04 / Task 3 (re-run), Plan 05 / Task 3 (re-run), Plan 06 / Task 2 (re-run with extended assertions) | 3, 4, 5 |
| `tests/test_pricing.py` | Plan 02 / Task 1 | 2 | Phase verification | 5+ |
| `tests/test_cost_tracker.py` | Plan 02 / Task 1 | 2 | Phase verification | 5+ |
| `tests/test_loader.py` | Plan 02 / Task 2 | 2 | Phase verification | 5+ |
| `tests/test_display.py` | Plan 02 / Task 2 | 2 | Phase verification | 5+ |
| `tests/smoke_test.py` | Plan 02 / Task 3 | 2 | Plan 06 / Task 2 (final live smoke) | 5 |
| `tests/test_golden_qa.py` | Plan 06 / Task 2 | 5 | Phase verification | 5+ |

## Wave Ordering Sanity Check

- All test files needed by Plans 04 and 05 (specifically `tests/test_dataset.py`) are created in Plan 02 (Wave 2). Plans 04 and 05 land in Waves 3 and 4. **No test is created in a wave later than the plan that depends on it.**
- `tests/smoke_test.py` is authored in Plan 02 (Wave 2). Live smoke is exercised in Plan 06 (Wave 5) once `.env` is populated by the developer; the file itself exists at smoke time.
- `tests/test_golden_qa.py` is created in Plan 06 (Wave 5) and consumed only at phase verification (post-wave-5). Same-wave consumption is permitted because the plan that creates it also runs it.

## Initial vs Extended Form of `tests/test_dataset.py`

`tests/test_dataset.py` is written ONCE in Plan 02 / Task 3 with **conditional assertions** that pass at every wave boundary. Plans 04 and 05 re-run the same file; Plan 06 extends it in place.

### Plan 02 / Task 3 — Initial form (passes against empty dataset)

Asserts:
1. `dataset/papers/` directory exists
2. `dataset/images/` directory exists
3. `dataset/videos/` directory exists
4. `dataset/manifests/` directory exists
5. If `dataset/manifests/papers.json` exists, it parses as valid JSON and is a list
6. If `dataset/manifests/figures.json` exists, it parses as valid JSON and is a list
7. If `dataset/manifests/videos.json` exists, it parses as valid JSON and is a list
8. (Conditional, gated by file existence — uses `pytest.skip` if the manifest is absent in this wave)

After Plan 02 commit: only assertions 1–4 fire; 5–7 skip. Test passes.

### Plan 04 / Task 3 — Re-run of `tests/test_dataset.py`

After bulk download lands:
- `dataset/manifests/papers.json` now exists; assertion 5 fires and passes
- `len(papers_manifest) >= 80` — Plan 04 explicitly adds an assertion gated on `if papers_json.exists()` that asserts ≥80 entries (loosened from the ~100 target to leave headroom for seed swaps)
- `dataset/papers/` is non-empty; assertion adds: every entry's `filename` exists on disk

Plan 04's verify block calls `pytest tests/test_dataset.py -v -m "not live"` instead of ad-hoc shell.

### Plan 05 / Task 3 — Re-run of `tests/test_dataset.py`

After figure extraction + video cuts land:
- `dataset/manifests/figures.json` exists; assertion 6 fires and passes
- `dataset/manifests/videos.json` exists; assertion 7 fires and passes
- ≥1 image in `dataset/images/`
- ≥1 video in `dataset/videos/`
- All `figures[i].paper_id` exist in papers manifest
- All `videos[i].papers_referenced[*]` exist in papers manifest
- All videos have `license_verified_at` and `license not in {"TBD_VERIFY_MANUALLY", "CC-BY-ND", "CC-BY-NC-ND"}`

Plan 05's verify block calls `pytest tests/test_dataset.py -v -m "not live"`.

### Plan 06 / Task 2 — In-place extension

Plan 06 ADDS strict assertions to the existing file (not a new file):
- `dataset/manifests/metadata.json` exists with `stats.paper_count >= 80`, `stats.figure_count >= 30`, `stats.video_count >= 1`
- ≥7 figures have non-empty `caption`
- ≥30 figures total (raised from ≥1 in Plan 05's contract)

The extension is documented as "Plan 06 hardens this file with stricter post-corpus thresholds" — same file path, additive assertions only.

## Sampling Rate

- **Per task commit:** `uv run pytest tests/ -x -q -m 'not live'` (skip live API tests; <1s)
- **Per wave merge:** `uv run pytest tests/ -v` (includes live smoke; ~3s; ~$0.0001)
- **Phase gate:** Full suite green before `/gsd:verify-phase 127`. CI runs full suite on `main`; PR runs `-m 'not live'`.

## Confirmation Statement

Every Phase 127 requirement (REPO-01, REPO-02, REPO-03, REPO-04, REPO-06) has a dedicated automated test file. Every test file lands in a wave at or before the plan that depends on its assertions. No requirement relies on manual `grep` or shell verification — Nyquist 8a/8c/8e are satisfied.
