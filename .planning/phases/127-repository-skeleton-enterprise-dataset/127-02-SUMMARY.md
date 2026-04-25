---
phase: 127-repository-skeleton-enterprise-dataset
plan: 02
subsystem: shared-utilities
tags: [pydantic, pydantic-settings, google-genai, gemini, rich, pytest, uv-lock, secretstr, cost-tracking, json-schema]

# Dependency graph
requires:
  - phase: 127-01
    provides: "Repository skeleton, pyproject.toml with shared/curation extras + tier-N entries, .env.example template, dataset/ tree, tier-N requirements files, git-lfs config"
provides:
  - "shared.config — lazy get_settings() factory with REQUIRED SecretStr GEMINI_API_KEY (Pattern 5)"
  - "shared.pricing — locked PRICES table for Gemini + OpenAI (PRICING_DATE 2026-04-25)"
  - "shared.llm — get_llm_client() returning google-genai chat client; LLMResponse dataclass"
  - "shared.embeddings — get_embedding_client() returning google-genai embedding client"
  - "shared.cost_tracker — CostTracker with D-13 JSON schema (tier/timestamp/queries/totals)"
  - "shared.display — render_query_result() rich Panel + Table renderer with console_override"
  - "shared.loader — DatasetLoader robust to missing manifests (returns []/{} pre-Plan-04)"
  - "tests/smoke_test.py — 4 tests (1 import, 3 @live) — canonical Phase 127 done signal"
  - "tests/test_env_example.py — REPO-06 trace"
  - "tests/test_tier_requirements.py — REPO-04 trace + T-127-08 lockfile guard"
  - "tests/test_repo_metadata.py — REPO-01 trace (replaces Plan 01 manual grep)"
  - "tests/test_dataset.py — REPO-02 trace (conditional skip pattern; passes empty/partial/full)"
  - "uv.lock — 48 locked packages, no deprecated google-generativeai"
affects: [phase-128-tier-1-naive, phase-129-tier-2-managed, phase-129-tier-3-graph, phase-130-tier-4-multimodal, phase-130-tier-5-agentic, phase-131-evaluation-harness, phase-133-cost-aggregation]

# Tech tracking
tech-stack:
  added: [pydantic-settings 2.14, google-genai 1.x, rich 15, pytest 8.4]
  patterns:
    - "Pattern 5: lazy get_settings() factory (lru_cache) — Settings() never instantiated at module import; ValidationError surfaces only when callers actually need keys"
    - "Pattern 4: google-genai unified SDK (NOT deprecated google-generativeai)"
    - "Pattern 6: rich Panel + Table for query/chunks/answer/cost rendering with console_override DI"
    - "Conditional pytest.skip for staged-dataset trace tests (file lands once, passes at every wave boundary)"
    - "D-13 cost tracker JSON schema (tier/timestamp/queries[]/totals{}) — locked for Phase 133 ingestion"
    - "Construction-time timestamp capture in CostTracker so repeated persist() calls overwrite the same file"

key-files:
  created:
    - "shared/config.py — Pydantic Settings + get_settings() lazy factory"
    - "shared/pricing.py — PRICES dict + PRICING_DATE"
    - "shared/llm.py — get_llm_client() + LLMResponse"
    - "shared/embeddings.py — get_embedding_client()"
    - "shared/cost_tracker.py — CostTracker class"
    - "shared/loader.py — DatasetLoader class"
    - "shared/display.py — render_query_result()"
    - "tests/smoke_test.py — REPO-03 trace"
    - "tests/test_env_example.py — REPO-06 trace"
    - "tests/test_tier_requirements.py — REPO-04 trace"
    - "tests/test_repo_metadata.py — REPO-01 trace"
    - "tests/test_dataset.py — REPO-02 trace"
    - "tests/test_pricing.py / tests/test_cost_tracker.py / tests/test_loader.py / tests/test_display.py — unit tests"
    - "uv.lock — locked dependencies"
  modified:
    - "shared/__init__.py — package docstring documenting public surface"
    - "tests/conftest.py — tmp_costs_dir + live_keys_ok fixtures"

key-decisions:
  - "Lazy get_settings() factory chosen over module-level Settings() instantiation — preserves Field(...) required-key contract (Pattern 5) while keeping import-time tests green in fresh checkouts without .env"
  - "DatasetLoader deliberately decoupled from get_settings() (Path('dataset') default, not settings.dataset_root) — keeps offline manifest inspection possible without GEMINI_API_KEY"
  - "uv sync (not uv pip install --group) — uv 0.6.3 flag compatibility"
  - "Live smoke deferred to Plan 06 — .env not present in this auto-mode run; non-live test_imports + 3 @live tests committed; Plan 06 has the final live smoke checkpoint"

patterns-established:
  - "Pattern 5 lazy factory — every shared.* module that needs keys imports get_settings() inside the constructor, never at module scope"
  - "Trace test naming convention — tests/test_<requirement_short_name>.py (test_env_example, test_tier_requirements, test_repo_metadata, test_dataset)"
  - "Conditional manifest tests via pytest.skip — same file passes at multiple wave boundaries (empty / partial / full)"
  - "console_override parameter on every rich-rendering function for testability"

# Metrics
duration: ~10min
completed: 2026-04-25
---

# Phase 127 Plan 02: Shared Utilities Summary

**Seven import-safe shared/ modules (config, pricing, llm, embeddings, loader, display, cost_tracker) with 35 passing unit tests, 4 trace tests covering REPO-01/02/04/06, and a 4-test smoke harness — all backed by a 48-package uv.lock with zero deprecated SDKs.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-25T18:13:36Z
- **Completed:** 2026-04-25T18:23:35Z
- **Tasks:** 3 (all atomic commits)
- **Files created:** 14
- **Files modified:** 2 (shared/__init__.py, tests/conftest.py)

## Accomplishments

- All 7 shared/ modules import cleanly without `.env` (lazy `get_settings()` factory per Pattern 5)
- `shared.config.Settings` enforces required `GEMINI_API_KEY` via `Field(..., alias=...)`; `get_settings()` raises `ValidationError` only when actually called
- `shared.pricing.PRICES` covers Gemini + OpenAI with locked values at PRICING_DATE 2026-04-25
- `shared.cost_tracker.CostTracker` writes D-13 JSON schema (tier/timestamp/queries/totals); construction-time timestamp ensures idempotent persist()
- `shared.llm` and `shared.embeddings` wrap google-genai unified SDK (NOT deprecated google-generativeai — T-127-08 mitigated)
- `shared.loader.DatasetLoader` is robust to missing manifests — same code path works pre-Plan-04 (empty), post-Plan-04 (papers only), and post-Plan-05 (full)
- `shared.display.render_query_result` builds rich Panel + Table; `console_override` parameter enables capture in tests
- 35 unit tests pass; 3 conditional tests skip (manifests not yet generated, by design); 4 live tests deselected (deferred to Plan 06)
- `uv.lock` committed (48 packages); deprecated `google-generativeai` confirmed absent

## Public Exports (downstream tier consumers)

```
shared.config:        Settings, get_settings
shared.pricing:       PRICES, PRICING_DATE
shared.llm:           LLMClient (Protocol), LLMResponse, get_llm_client
shared.embeddings:    EmbeddingClient (Protocol), get_embedding_client
shared.loader:        DatasetLoader
shared.display:       console, render_query_result
shared.cost_tracker:  CostTracker, DEFAULT_COSTS_DIR
```

## Task Commits

All commits are on `main` of the companion repo `PatrykQuantumNomad/rag-architecture-patterns`:

1. **Task 1: shared.config + shared.pricing + shared.cost_tracker + unit tests** — `a00aaf9` (feat)
2. **Task 2: shared.llm + shared.embeddings + shared.loader + shared.display + unit tests** — `d766773` (feat)
3. **Task 3: smoke test + REPO-01/02/04/06 trace tests** — `859c8da` (test)

Parallel-plan commits (127-03, written by sibling executor) were interleaved in chronological order:

- `4dc09a3` — feat(127-03): scripts/curate_corpus.py
- `6bd771e` — feat(127-03): scripts/extract_figures.py

(Plans 02 and 03 operated on disjoint files: shared/* + tests/* vs scripts/*. No conflicts.)

## Files Created/Modified

### shared/ (7 production modules)
- `shared/__init__.py` — package docstring (modified)
- `shared/config.py` — Pydantic Settings + lazy `get_settings()` factory
- `shared/pricing.py` — `PRICES` table + `PRICING_DATE = "2026-04-25"`
- `shared/llm.py` — `get_llm_client()` + `LLMResponse` frozen dataclass + Protocol
- `shared/embeddings.py` — `get_embedding_client()` + Protocol
- `shared/cost_tracker.py` — `CostTracker` class with D-13 JSON schema persistence
- `shared/loader.py` — `DatasetLoader` with `@cache` per-method memoization
- `shared/display.py` — `render_query_result()` + module-level `console`

### tests/ (10 files)
- `tests/conftest.py` — `tmp_costs_dir` + `live_keys_ok` fixtures (modified)
- `tests/test_pricing.py` — 4 tests (required models, cache prices, pricing date, locked values)
- `tests/test_cost_tracker.py` — 7 tests (LLM/embedding arithmetic, JSON schema, persist round-trip, idempotency, KeyError)
- `tests/test_loader.py` — 9 tests (missing manifest fallback, populated reads, no get_settings() at construction)
- `tests/test_display.py` — 2 tests (rich Console capture)
- `tests/test_env_example.py` — 4 tests (REPO-06 trace)
- `tests/test_tier_requirements.py` — 5 tests (REPO-04 trace + T-127-08 lockfile guard)
- `tests/test_repo_metadata.py` — 3 tests (REPO-01 trace, 1 @live optional)
- `tests/test_dataset.py` — 4 tests (REPO-02 trace, 3 conditional skip)
- `tests/smoke_test.py` — 4 tests (REPO-03 trace, 3 @live)

### Lockfile
- `uv.lock` — 48 packages (SHA256 `07edc1bb2a3dd8830998fda0bea8e9fc66fc44a908d8bb343f1bc3c54e71c7a9`)

## Decisions Made

1. **Lazy `get_settings()` factory** — module-level `settings = Settings()` would break `test_imports` in fresh checkouts without `.env`. Instead, `Field(..., alias="GEMINI_API_KEY")` is REQUIRED, but `Settings()` is only constructed when `get_settings()` is invoked. Callers (`shared.llm`, `shared.embeddings`, smoke `test_real_*`) trigger validation; bare `from shared.config import Settings, get_settings` does not. This preserves the spec'd "validation contract" without weakening it to `default=SecretStr("")`.

2. **`DatasetLoader` decoupled from `get_settings()`** — `__init__` defaults to `Path("dataset")` rather than `Settings().dataset_root`. Documented as deliberate: lets contributors inspect manifests offline without provisioning Gemini keys.

3. **`uv sync` over `uv pip install --group`** — uv 0.6.3 doesn't accept `--group` on `pip install`. `uv sync --extra shared --extra curation --group test --group dev` produced the lockfile cleanly.

4. **Construction-time timestamp in `CostTracker`** — captured once in `__init__` (`datetime.now(timezone.utc)`) so multiple `persist()` calls overwrite the same `{tier}-{timestamp}.json` file. Ensures a tier evaluation produces a single artifact even if the run logs intermediate state.

5. **Live smoke deferred** — `.env` was absent in this auto-mode run. Per the plan's Step 7 explicit instruction ("Do NOT block on user — surface and proceed"), the live tests were committed but NOT executed. Plan 06 contains the final live smoke checkpoint where the user provides `GEMINI_API_KEY` and the full smoke runs end-to-end.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `uv pip install --group` flag rejected by uv 0.6.3**
- **Found during:** Task 1 (dependency install + lockfile generation)
- **Issue:** Plan instructed `uv pip install -e ".[shared,curation]" --group dev --group test`. uv 0.6.3 emitted `error: unexpected argument '--group' found`.
- **Fix:** Used `uv sync --extra shared --extra curation --group test --group dev` instead. `uv sync` is the documented entry point for groups in this uv version and produced the same lockfile content.
- **Files modified:** uv.lock (created)
- **Verification:** `uv sync` exited 0; lockfile contains 48 packages; `pytest` runs with all required deps; deprecated `google-generativeai` confirmed absent (T-127-08).
- **Committed in:** a00aaf9 (Task 1)

**2. [Rule 3 - Blocking] `pyproject.toml` needed setuptools build-system + explicit packages**
- **Found during:** Task 1 (`uv sync` for editable install of the project)
- **Issue:** Plan 01 left pyproject.toml WITHOUT a `[build-system]` table. Editable install via `uv sync` requires one. Additionally, the flat-layout repo (shared/, scripts/, dataset/, evaluation/, tier-*/) needs `[tool.setuptools].packages = ["shared", "scripts"]` to scope the build to the actual Python packages.
- **Fix:** The parallel-plan agent (127-03) had already added `[build-system]`, `[tool.setuptools]` packages = ["shared", "scripts"], and Pillow to the curation extras. I observed the modification but did NOT stage `pyproject.toml` in my commits — it falls under plan 03's file ownership.
- **Files modified:** None by 127-02 (handled by 127-03)
- **Verification:** `uv sync` succeeded; editable install of the project works; tests collect without ModuleNotFoundError.
- **Committed in:** Out of scope for 127-02 (committed by parallel 127-03)

**3. [Rule 2 - Missing Critical] T-127-08 lockfile guard added to test_tier_requirements.py**
- **Found during:** Task 3 (writing REPO-04 trace test)
- **Issue:** Plan's <threat_model> assigns `mitigate` to T-127-08 (deprecated `google-generativeai` sneaking back into the lockfile) but the plan body did not specify the exact assertion. Without an automated test, regressions could slip through.
- **Fix:** Added `test_lockfile_does_not_contain_deprecated_sdk` to `tests/test_tier_requirements.py` — fails if `uv.lock` contains the substring `google-generativeai`. Skips gracefully if `uv.lock` not yet present (partial checkout).
- **Files modified:** tests/test_tier_requirements.py
- **Verification:** Test passes against current lockfile; would fail if a contributor accidentally added the deprecated SDK.
- **Committed in:** 859c8da (Task 3)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical / threat-model mitigation)
**Impact on plan:** All auto-fixes necessary for correctness or completing tasks. No scope creep.

## Issues Encountered

- **Live smoke not run:** `.env` was absent in the auto-mode execution context. Per the plan's explicit instruction, this was surfaced and the test files were committed without running the @live suite. Plan 06 contains the canonical live smoke checkpoint where the user provides `GEMINI_API_KEY` and the 4-test smoke suite (test_imports + 3 @live) runs end-to-end against real Gemini APIs (~$0.0001, <5s wall time per D-10).

## User Setup Required

A future Plan 06 invocation (or any contributor wanting to run the live smoke locally) needs:

1. Copy `.env.example` to `.env`: `cp .env.example .env`
2. Obtain a Gemini API key at https://aistudio.google.com/app/apikey
3. Set `GEMINI_API_KEY=...` in `.env`
4. Run `pytest tests/smoke_test.py -v -m live --timeout=15`

Cost: ~$0.0001/run. Wall time: <5s. Uses gemini-2.5-flash + gemini-embedding-001 (defaults).

## Next Phase Readiness

- **Plan 04 (corpus curation, Wave 3) — READY.** Plan 03 (parallel) has already pushed `scripts/curate_corpus.py` to `main` (`4dc09a3`); Plan 04 will run that script to produce `dataset/manifests/papers.json`. Test `test_papers_manifest_conditional` will then exit `pytest.skip` and run real assertions.
- **Plan 05 (figures + videos, Wave 4) — READY.** `scripts/extract_figures.py` (`6bd771e`) already on main; Plan 05 produces `figures.json` and `videos.json`. Tests `test_figures_manifest_conditional` and `test_videos_manifest_conditional` will start enforcing real assertions.
- **Plan 06 (final smoke + verification, Wave 5) — READY.** Will:
  1. Run live smoke against real Gemini.
  2. Extend `tests/test_dataset.py` with stricter thresholds (≥30 figures, ≥7 captions, metadata.json present).
  3. Generate `dataset/manifests/metadata.json`.
- **Phases 128-130 (tier implementations) — READY downstream.** All shared/ exports are stable, lockfile is reproducible, JSON schema (D-13) is locked.

## Verification Results

```
$ python -c "from shared import config, pricing, llm, embeddings, loader, display, cost_tracker"
all 7 imports OK

$ pytest tests/ -v -m 'not live'
35 passed, 3 skipped, 4 deselected in 0.50s

$ git ls-files | grep -q '^uv\.lock$'
(returns 0)

$ grep -q 'google-generativeai' uv.lock
(returns 1 — confirms absent)
```

## Self-Check: PASSED

- shared/config.py, shared/pricing.py, shared/cost_tracker.py, shared/llm.py, shared/embeddings.py, shared/loader.py, shared/display.py — all created and tracked.
- tests/test_pricing.py, tests/test_cost_tracker.py, tests/test_loader.py, tests/test_display.py, tests/test_env_example.py, tests/test_tier_requirements.py, tests/test_repo_metadata.py, tests/test_dataset.py, tests/smoke_test.py — all created and tracked.
- uv.lock created and tracked.
- All 3 commits exist in `main`: a00aaf9, d766773, 859c8da.
- All 35 non-live tests pass; 3 conditional skips behave correctly; 4 @live tests deferred to Plan 06.
- No deprecated `google-generativeai` in lockfile.

---
*Phase: 127-repository-skeleton-enterprise-dataset*
*Completed: 2026-04-25*
