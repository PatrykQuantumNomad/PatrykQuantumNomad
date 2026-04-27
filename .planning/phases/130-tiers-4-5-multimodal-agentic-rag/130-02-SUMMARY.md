---
phase: 130-tiers-4-5-multimodal-agentic-rag
plan: 02
subsystem: tier-4-rag-anything-init-and-ingest
tags: [tier-4, raganything, mineru, lightrag, openrouter, cost-adapter, ingest, multimodal, vision]
requirements_completed: [TIER-04]
dependency_graph:
  requires:
    - phase-130-plan-01-tier-4-deps (raganything==1.2.10 + lightrag-hku==1.4.15 + Pillow on origin/main)
    - phase-129-plan-03-tier-3-cost-adapter (CostAdapter dispatch precedent for token_tracker protocol)
    - phase-128-plan-04-tier-1-shim (importlib spec_from_file_location convention for hyphen-dir → underscore-shim)
  provides:
    - "tier-4-multimodal/rag.py: build_rag + 5 locked constants + 3 OpenRouter-routed async closures (Pattern 1)"
    - "tier-4-multimodal/cost_adapter.py: CostAdapter mirror of tier-3-graph (completion_tokens key dispatch)"
    - "tier-4-multimodal/ingest_pdfs.py: process_document_complete with stable doc_id (Pattern 2)"
    - "tier-4-multimodal/ingest_images.py: insert_content_list with absolute img_path (Pattern 3 + Pitfall 4) + pure build_image_content_list helper for tests"
    - "tier_4_multimodal/__init__.py: importlib shim — Plan 03's query/main land later"
    - "tier_4_multimodal package added to pyproject [tool.setuptools].packages"
  affects:
    - "Plan 130-03 (Tier 4 query/CLI/Dockerfile) — consumes build_rag + ingest_* + CostAdapter directly"
    - "Plan 130-05 (Tier 4 live e2e) — consumes ingest_pdfs/ingest_images for the live MineRU + RAG-Anything path"
tech_stack:
  added:
    - "raganything 1.2.10 (live import — Pattern 1 RAGAnythingConfig + RAGAnything constructor)"
    - "lightrag.llm.openai.openai_complete_if_cache + openai_embed (live import — OpenRouter-compatible LLM/embed)"
    - "lightrag.utils.EmbeddingFunc (live import — wraps the async embed closure with dim + max-tokens)"
  patterns:
    - "Lazy env-read closures (mirrors Phase 129 Plan 03 tier-3-graph/rag.py — module imports without OPENROUTER_API_KEY)"
    - "Two-shape vision_func contract (Pitfall 3 — handles BOTH messages= and image_data= shapes)"
    - "Absolute img_path via Path().resolve() before composing content list (Pitfall 4 mitigation)"
    - "CostAdapter dispatch on completion_tokens key presence (NOT value) — single instance for both LLM + embedding closures"
    - "Pure builder helper exposed alongside async ingest function — testable without live rag side effects"
key_files:
  created:
    - "../rag-architecture-patterns/tier-4-multimodal/rag.py (174 LOC)"
    - "../rag-architecture-patterns/tier-4-multimodal/cost_adapter.py (82 LOC)"
    - "../rag-architecture-patterns/tier-4-multimodal/ingest_pdfs.py (78 LOC)"
    - "../rag-architecture-patterns/tier-4-multimodal/ingest_images.py (77 LOC)"
    - "../rag-architecture-patterns/tier_4_multimodal/__init__.py (69 LOC)"
    - "../rag-architecture-patterns/tier-4-multimodal/tests/test_tier4_rag.py (51 LOC)"
    - "../rag-architecture-patterns/tier-4-multimodal/tests/test_ingest_images.py (66 LOC)"
  modified:
    - "../rag-architecture-patterns/pyproject.toml (+1/-1 lines — tier_4_multimodal added to packages list)"
decisions:
  - "Mirrored tier-3-graph/cost_adapter.py verbatim for Tier 4 — same constructor (tracker, llm_model, embed_model), same key-presence dispatch. RAG-Anything composes a LightRAG instance internally so the protocol transfers 1:1."
  - "Tier 4 shim uses the FULLER tier_3_graph pattern (sys.path injection + _load() helper + try/except per submodule) instead of the more compact loop in the plan body, because tier_3_graph's pattern is the more recent + battle-tested precedent (Phase 129 Plan 03 ran live with it)."
  - "Test filename test_tier4_rag.py (NOT test_rag.py per plan body) — Rule 3 fix for pytest rootdir collection collision with tier-3-graph/tests/test_rag.py. Establishes the tier-prefix convention extension to non-live tests (was already in use for live tests via Phase 129 Plan 06/07)."
  - "Plan 04 (parallel Tier 5) added tier_5_agentic to pyproject packages list while this plan ran. No conflict — different list element, clean fast-forward push (a081238..1d9946e Task1, then linter-applied tier_5_agentic addition included implicitly when committing Task 2)."
  - "Vision_func degrades to text-only LLM closure when neither messages= nor image_data= is provided. Defensive — avoids crash if RAG-Anything 1.2.x ever calls vision_model_func for a text-only prompt during edge cases."
  - "ingest_images exposes BOTH async ingest_standalone_images (live path) AND pure build_image_content_list (test path) — same logic factored once. Test path runs in <1 ms; live path is gated behind real RAG-Anything insert_content_list."
metrics:
  duration: "~14 minutes"
  completed: "2026-04-26"
  tasks: 2
  files: 8
---

# Phase 130 Plan 02: Tier 4 RAG-Anything Init + Ingest Plumbing Summary

Authored Tier 4's `rag.py` (build_rag + 3 OpenRouter-routed async closures), `cost_adapter.py` (LightRAG token-tracker bridge mirroring Phase 129 Plan 03), and both ingest paths — `ingest_pdfs.py` (process_document_complete with stable doc_id) and `ingest_images.py` (insert_content_list with absolute img_path per Pitfall 4). Plus the `tier_4_multimodal` importlib shim and 2 non-live test files (4 tests total) covering constants + content_list shape. All 4 tests pass; module imports cleanly without `OPENROUTER_API_KEY`.

## What Shipped

### `tier-4-multimodal/rag.py` (174 LOC)

Pattern 1 verbatim from 130-RESEARCH.md:

- 5 locked module-level constants: `WORKING_DIR = "rag_anything_storage/tier-4-multimodal"`, `DEFAULT_LLM_MODEL = "google/gemini-2.5-flash"`, `DEFAULT_VISION_MODEL = "google/gemini-2.5-flash"`, `DEFAULT_EMBED_MODEL = "openai/text-embedding-3-small"`, `EMBED_DIMS = 1536`. (`OPENROUTER_BASE` and `EMBED_MAX_TOKENS = 8192` are also pinned.)
- 3 OpenRouter-routed async closures: `_llm_func`, `_vision_func` (BOTH `messages=` and `image_data=` shapes per Pitfall 3), `_embed_func`. All 3 read `os.environ["OPENROUTER_API_KEY"]` LAZILY at call time so the module imports cleanly without the key.
- `build_rag(working_dir=WORKING_DIR) -> RAGAnything` — sets `parser="mineru"`, `parse_method="auto"`, all 3 enable_*_processing=True flags.

### `tier-4-multimodal/cost_adapter.py` (82 LOC)

Mirror of `tier-3-graph/cost_adapter.py` (Phase 129 Plan 03):

- Constructor `(tracker, llm_model, embed_model)` — single instance threadable through both LLM and embedding closures.
- `add_usage(payload)` dispatches on `completion_tokens` KEY PRESENCE (not value). LLM payloads include the key → `record_llm`; embedding payloads omit it → `record_embedding`.
- `_has_key` + `_extract` helpers handle both dict and attribute-bearing usage objects (matches LightRAG's documented protocol on lightrag-hku==1.4.15, which RAG-Anything 1.2.10 composes internally).

### `tier-4-multimodal/ingest_pdfs.py` (78 LOC)

Pattern 2:

- `ingest_pdfs(rag, papers, dataset_root, console, *, device="cpu", parser="mineru") -> int`.
- Iterates papers, calls `await rag.process_document_complete(file_path=str(pdf), output_dir=..., parse_method="auto", parser=parser, device=device, doc_id=p["paper_id"])` per paper.
- Stable `doc_id=p["paper_id"]` is the load-bearing detail — without it, RAG-Anything generates a fresh content-hash-derived id every run, defeating dedup and re-extracting the entire PDF on every ingest (anti-pattern; burns MineRU + LLM cost).
- File-existence-filtered count returned for telemetry.
- The MineRU model fetch (~3-5 GB) happens lazily on the first `process_document_complete` call — Plan 02 (this plan) does NOT exercise that path.

### `tier-4-multimodal/ingest_images.py` (77 LOC)

Pattern 3 + Pitfall 4:

- `ingest_standalone_images(rag, dataset_root) -> int` — async live path; calls `await rag.insert_content_list(content_list=..., file_path="dataset_figures_bundle", doc_id="figures-bundle")`.
- `build_image_content_list(figures, images_dir) -> list[dict]` — pure helper exposed for non-live testing. Same logic factored once; both paths call `Path(...).resolve()` BEFORE composing entries.
- Filtering: manifest entries whose file is missing on disk are dropped (matches the live path's behavior).
- Caption shape: `[caption]` if present, `[]` otherwise (RAG-Anything contract per `image_caption: list`).
- `page_idx` set from manifest position (informational).

### `tier_4_multimodal/__init__.py` (69 LOC)

Importable shim — mirrors `tier_3_graph/__init__.py` (the more recent / battle-tested precedent) verbatim:

- Locates `tier-4-multimodal/` (sibling dir, hyphenated).
- Adds it to `sys.path` so intra-tier flat imports work AND any module loaded via importlib resolves sibling imports.
- `_load(submodule)` uses `importlib.util.spec_from_file_location` to register `tier-4-multimodal/<name>.py` under the dotted path `tier_4_multimodal.<name>`.
- Eagerly loads the 6 known submodules: `rag`, `cost_adapter`, `ingest_pdfs`, `ingest_images`, `query`, `main`. The last 2 don't exist yet (Plan 03 lands them); the loop wraps `_load` in `try/except ImportError` for graceful skip.

### `pyproject.toml` modification

`[tool.setuptools].packages` now includes `tier_4_multimodal`:

```toml
packages = ["shared", "scripts", "tier_1_naive", "tier_2_managed", "tier_3_graph", "tier_4_multimodal", "tier_5_agentic"]
```

(Plan 04's parallel Tier 5 agent added `tier_5_agentic` to the same list while this plan ran — clean fast-forward push, no merge conflict; the linter-applied tier_5_agentic addition is reflected in the final state.)

### Tests (117 LOC across 2 files)

`tier-4-multimodal/tests/test_tier4_rag.py` (51 LOC, 2 tests):

- `test_locked_constants` — asserts all 5 module constants + sanity-checks OpenRouter slug shape (`provider/model`).
- `test_build_rag_constructs(tmp_path)` — RAGAnything builds without API calls; constructor creates `working_dir` as a side effect.

`tier-4-multimodal/tests/test_ingest_images.py` (66 LOC, 2 tests):

- `test_content_list_uses_absolute_img_path(tmp_path)` — Pitfall 4 invariant; 3-figure synthetic manifest (2 keep, 1 drop).
- `test_content_list_empty_when_no_figures(tmp_path)` — empty-input edge case.

NO `tier-4-multimodal/tests/__init__.py` — matches Tier 1/2/3 baseline (Phase 128 Plan 02 follow-on rule: pytest rootdir collection raises ImportPathMismatchError when both repo-root `tests/__init__.py` and tier-local `tests/__init__.py` register as the `tests` package).

## Verbatim Test Output

```
$ uv run --extra tier-4 --extra tier-5 pytest tier-4-multimodal/tests/ -v
============================= test session starts ==============================
platform darwin -- Python 3.13.1, pytest-8.4.2, pluggy-1.6.0 -- /Users/patrykattc/work/git/rag-architecture-patterns/.venv/bin/python3
cachedir: .pytest_cache
rootdir: /Users/patrykattc/work/git/rag-architecture-patterns
configfile: pyproject.toml
plugins: anyio-4.13.0
collecting ... collected 4 items

tier-4-multimodal/tests/test_ingest_images.py::test_content_list_uses_absolute_img_path PASSED [ 25%]
tier-4-multimodal/tests/test_ingest_images.py::test_content_list_empty_when_no_figures PASSED [ 50%]
tier-4-multimodal/tests/test_tier4_rag.py::test_locked_constants PASSED  [ 75%]
tier-4-multimodal/tests/test_tier4_rag.py::test_build_rag_constructs PASSED [100%]

============================== 4 passed in 0.44s ===============================
```

## No-Key Import Verification

```
$ OPENROUTER_API_KEY="" uv run --extra tier-4 python -c \
    "from tier_4_multimodal.rag import build_rag, EMBED_DIMS; \
     assert EMBED_DIMS == 1536; print('no-key import OK; EMBED_DIMS =', EMBED_DIMS)"
no-key import OK; EMBED_DIMS = 1536
```

Module imports cleanly without `OPENROUTER_API_KEY` set; closures only read the env at call time. Mirrors the lazy-env pattern established in Phase 129 Plan 03 (`tier-3-graph/rag.py`).

## Full Non-Live Suite Status

`uv run --extra tier-1 --extra tier-2 --extra tier-3 --extra tier-4 --extra tier-5 pytest -q -m "not live"` →

```
85 passed, 2 skipped, 7 deselected, 5 warnings in 3.58s
```

All 4 new Tier 4 tests pass alongside the prior 81 non-live tests. Note: invoking `pytest -q -m "not live"` without the per-tier `--extra` flags will fail on tier-1 chunker tests (require `pymupdf` from `[tier-1]`) and tier-3 main tests (require `lightrag` from `[tier-3]`); these are pre-existing extras-coverage caveats, NOT regressions from this plan.

## Test Layout Convention Verification

```
$ ls tier-4-multimodal/tests/__init__.py
ls: tier-4-multimodal/tests/__init__.py: No such file or directory
```

Confirmed ABSENT — matches Tier 1/2/3 (`tier-1-naive/tests/`, `tier-2-managed/tests/`, `tier-3-graph/tests/` all omit `__init__.py`). The Phase 128 Plan 02 follow-on rule continues to hold: per-tier `tests/__init__.py` collides with repo-root `tests/__init__.py` under pytest's rootdir importer.

## Commits

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| `1d9946e` | `feat(130-02)` | Tier 4 RAGAnything builder + cost adapter + ingest plumbing | rag.py + cost_adapter.py + ingest_pdfs.py + ingest_images.py + tier_4_multimodal/__init__.py + pyproject.toml (6 files, +486/-5) |
| `c26258b` | `test(130-02)` | Tier 4 non-live unit tests (constants + content_list shape) | test_tier4_rag.py + test_ingest_images.py (2 files, +117/-0) |

Push: `a081238..1d9946e main -> main` (Task 1 fast-forward), then `1d9946e..c26258b main -> main` (Task 2 fast-forward). No rebase needed despite Plan 04's parallel work in `tier-5-agentic/` + `tier_5_agentic/` — file ownership was strictly disjoint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renamed `test_rag.py` → `test_tier4_rag.py`**
- **Found during:** Task 2 (full non-live suite run after creating tests)
- **Issue:** pytest's rootdir collection (no `__init__.py` per Phase 128 Plan 02 follow-on) raised `ImportPathMismatchError` because `tier-3-graph/tests/test_rag.py` already exists; two test files cannot share a basename across tier dirs without unique-package markers.
- **Fix:** Renamed to `test_tier4_rag.py`. Same convention as Phase 129 Plan 06's `test_e2e_live.py` and Plan 07's `test_tier3_e2e_live.py` for live tests; this plan extends it to non-live tests.
- **Files modified:** `tier-4-multimodal/tests/test_tier4_rag.py` (was `test_rag.py`).
- **Commit:** `c26258b`.

**2. [Rule 3 - Blocking] Re-synced venv with --extra tier-4 (twice)**
- **Found during:** Task 2 (`uv run pytest` initially failed with `ModuleNotFoundError: No module named 'raganything'`).
- **Issue:** Plan 04's parallel `uv` invocations re-synced the venv to a different extras set; `raganything` was dropped between Task 1's smoke test and Task 2's pytest run.
- **Fix:** Always invoke pytest with `uv run --extra tier-4 --extra tier-5 pytest ...`. Sandbox-only ergonomics; not a project-dep change. Documented in the verbatim-output block.
- **Files modified:** none (operational fix only).
- **Commit:** none directly — captured in Task 2's commit message + this SUMMARY.

### Shim implementation deviation (intentional, not a fix)

The plan body's shim uses a compact `for _mod in _MODULES: ... if not _src.exists(): continue ...` loop. I adopted the FULLER pattern from `tier_3_graph/__init__.py` (Phase 129 Plan 03) — `sys.path` injection + `_load(submodule)` helper + per-submodule `try/except ImportError`. Functionally equivalent for the success path, but the fuller pattern is the more recent + battle-tested precedent (Phase 129 Plan 03 ran live with it; Phase 128 Plan 04 pioneered it for tier_1_naive). Keeps tier_4_multimodal in lockstep with tier_3_graph for future-readers' convenience.

### Plan 04 concurrent edit (NOT a deviation)

Plan 04 (parallel Tier 5 agent) added `tier_5_agentic` to `pyproject.toml [tool.setuptools].packages` while this plan was in flight. The linter-applied edit appeared between Task 1 (which added `tier_4_multimodal`) and Task 2's pytest run. Final state on `main`: `packages = ["shared", "scripts", "tier_1_naive", "tier_2_managed", "tier_3_graph", "tier_4_multimodal", "tier_5_agentic"]`. Both wave-2 plans landed cleanly via fast-forward; mirrors Phase 129 Plans 02+03 / 04+05 / 06+07 concurrent-wave behavior.

## Auth Gates

None — this plan was fully autonomous (no live API calls; only deps install + smoke imports + non-live unit tests).

## Threat Surface Scan

No new security-relevant surface introduced. All new code is local library/test code; no new network endpoints, no auth paths beyond the existing OpenRouter routing established in Phase 128-06 + 129-03, no schema changes at trust boundaries, no file-access patterns at trust boundaries. Plan 130-02 has no `<threat_model>` and none was warranted.

## Known Stubs

None — all 4 modules implement their full contract. `query.py` and `main.py` are deliberately deferred to Plan 03 (per the plan's split rationale: keeps each Wave 2 plan's diff tractable at ~5-7 files); the shim's `try/except ImportError` gracefully skips them until they land.

## Next Plan

**Plan 130-03 (Wave 2, autonomous):** Tier 4 query layer + main.py CLI + Dockerfile. Consumes `build_rag` + `CostAdapter` + `ingest_pdfs` + `ingest_standalone_images` from this plan; lands `tier-4-multimodal/query.py` (the chunk-shape adapter for RAG-Anything's `aquery` return per Pitfall 7) and `tier-4-multimodal/main.py` (CLI mirroring the Tier 1/3 ergonomics). Plan 03 depends ONLY on this plan's surface (already on origin/main).

## Self-Check: PASSED

**Files modified verified present on disk:**
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/rag.py` (174 LOC, contains `build_rag` + `EMBED_DIMS = 1536`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/cost_adapter.py` (82 LOC, contains `def add_usage`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/ingest_pdfs.py` (78 LOC, contains `process_document_complete`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/ingest_images.py` (77 LOC, contains `insert_content_list` + `resolve()`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier_4_multimodal/__init__.py` (69 LOC, contains `spec_from_file_location`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/tests/test_tier4_rag.py` (51 LOC, contains `EMBED_DIMS == 1536`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/tests/test_ingest_images.py` (66 LOC, contains `is_absolute`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/pyproject.toml` (contains `tier_4_multimodal`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/tests/__init__.py` ABSENT (matches Tier 1/2/3)

**Commits verified in git log:**
- [x] `1d9946e` (feat(130-02)) — `git log --oneline | grep 1d9946e` returns the feature commit
- [x] `c26258b` (test(130-02)) — `git log --oneline | grep c26258b` returns the test commit
- [x] Both pushed to `origin/main` (push outputs: `a081238..1d9946e` then `1d9946e..c26258b`)

**Tests verified passing:**
- [x] `tier-4-multimodal/tests/` 4/4 PASS in 0.44s
- [x] Full non-live suite: 85 passed, 2 skipped (with all tier extras enabled)
- [x] No-key import: `OPENROUTER_API_KEY="" python -c "from tier_4_multimodal.rag import build_rag, EMBED_DIMS"` succeeds; `EMBED_DIMS == 1536`
