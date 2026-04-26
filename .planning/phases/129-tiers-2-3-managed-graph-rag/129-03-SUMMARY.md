---
phase: 129-tiers-2-3-managed-graph-rag
plan: 03
subsystem: rag
tags: [lightrag, graph-rag, openrouter, cost-tracking, token-tracker, embeddings, python]

# Dependency graph
requires:
  - phase: 129-01
    provides: "[tier-3] extras concretized — lightrag-hku==1.4.15 + openai>=1.50 + pymupdf>=1.27 pinned in pyproject; uv.lock synced"
  - phase: 128
    provides: "OpenRouter routing pattern (single OPENROUTER_API_KEY); shared.cost_tracker.record_llm + record_embedding API; shared.pricing OpenRouter slugs (openai/text-embedding-3-small, google/gemini-2.5-flash, openai/gpt-4o-mini, etc.); tier_1_naive importable shim pattern"
  - phase: 127
    provides: "shared.cost_tracker.CostTracker, shared.pricing.PRICES, shared.config.openrouter_api_key (optional SecretStr)"
provides:
  - "tier-3-graph/rag.py — build_rag(working_dir, llm_token_tracker, model) → LightRAG instance with OpenRouter-routed llm_model_func + embedding_func"
  - "tier-3-graph/cost_adapter.py — CostAdapter class that bridges LightRAG token_tracker callbacks into shared.cost_tracker (auto-dispatches LLM vs embed payloads)"
  - "tier_3_graph/__init__.py — importable shim (mirror of tier_1_naive)"
  - "scripts/probe_lightrag_token_tracker.py — re-runnable diagnostic for the token_tracker protocol on any installed lightrag-hku version"
  - "Locked Tier 3 constants: WORKING_DIR=lightrag_storage/tier-3-graph, OPENROUTER_BASE, DEFAULT_LLM_MODEL=google/gemini-2.5-flash, DEFAULT_EMBED_MODEL=openai/text-embedding-3-small, EMBED_DIMS=1536, EMBED_MAX_TOKENS=8192"
affects: [phase-129-05-tier-3-ingest-query-cli, phase-129-07-tier-3-readme-live-test, phase-130-tier-4-rag-anything]

# Tech tracking
tech-stack:
  added: ["LightRAG token_tracker integration pattern", "Probe-driven adapter authoring (resolve API uncertainty before committing)"]
  patterns:
    - "Single CostAdapter threaded through both llm_model_func + embedding_func — captures BOTH LLM and embedding cost from one tracker instance (research only anticipated LLM-side capture)"
    - "Dispatch on key presence (NOT value): completion_tokens-in-payload distinguishes LLM record from embedding record, since embed payloads omit the key entirely"
    - "Lazy env reads inside async closures — module imports without OPENROUTER_API_KEY (test_module_imports_without_api_key contract)"

key-files:
  created:
    - "rag-architecture-patterns/scripts/probe_lightrag_token_tracker.py"
    - "rag-architecture-patterns/tier-3-graph/__init__.py"
    - "rag-architecture-patterns/tier-3-graph/rag.py"
    - "rag-architecture-patterns/tier-3-graph/cost_adapter.py"
    - "rag-architecture-patterns/tier-3-graph/tests/conftest.py"
    - "rag-architecture-patterns/tier-3-graph/tests/test_rag.py"
    - "rag-architecture-patterns/tier_3_graph/__init__.py"
  modified:
    - "rag-architecture-patterns/pyproject.toml ([tool.setuptools].packages adds tier_3_graph)"

key-decisions:
  - "RESEARCH Open Q1 RESOLVED — Outcome A with bonus: token_tracker IS supported on BOTH openai_complete_if_cache AND openai_embed in lightrag-hku==1.4.15 (research only hypothesized LLM-side support). CostAdapter threads through both closures via build_rag's llm_token_tracker kwarg, capturing complete tier-3 cost (no monkey-patch fallback needed)."
  - "add_usage protocol receives a dict — LLM payload has prompt_tokens + completion_tokens + total_tokens; embed payload has prompt_tokens + total_tokens (NO completion_tokens). CostAdapter dispatches on key presence (not value) so even a 0-completion LLM record routes correctly."
  - "EMBED_DIMS=1536 hardcoded at module level (NOT a CLI flag) — Pitfall 4: LightRAG indexes vectors at first ingest; dim change silently corrupts retrieval (HKUDS issue #2119)."
  - "Constants written without type annotations (`EMBED_DIMS = 1536` not `EMBED_DIMS: int = 1536`) so the plan's exact-byte regex verify (`grep -q 'EMBED_DIMS = 1536'`) passes."
  - "tier-3-graph/tests/ has NO __init__.py — mirrors Plan 128-02's follow-on convention (avoids ImportPathMismatchError between repo-root and tier-local tests packages)."
  - "tier_3_graph shim mirrors tier_1_naive verbatim — submodule list ('rag', 'cost_adapter', 'ingest', 'query', 'main') with try/except graceful skip for ingest/query/main (Plan 05 territory)."
  - "build_rag(llm_token_tracker=...) accepts None; smoke-construction works without an API key because both closures defer env reads."
  - "Pre-existing tier-1 test_store.py failures (5) discovered during regression check — out of scope for Plan 03; logged to deferred-items.md (Scope Boundary rule)."

patterns-established:
  - "Probe-before-commit pattern for high-uncertainty integrations: write scripts/probe_*.py, run it, capture output verbatim in SUMMARY, commit the script as part of the plan so future readers can replay the decision after dep upgrades."
  - "One CostAdapter, two attachment points: same instance as token_tracker= for both LLM and embed closures; the adapter dispatches on payload shape, not on caller identity."
  - "Sandbox-friendly install pattern: UV_CACHE_DIR=$TMPDIR/uv-cache uv run ... — companion repo's home-cache uv directory is sandbox-deny on macOS Darwin 25; redirect to tmpdir for both install and run-time uv invocations."

# Metrics
duration: 11m
completed: 2026-04-26
---

# Phase 129 Plan 03: Tier 3 LightRAG Init + Cost Adapter Summary

**LightRAG initialization layer with probe-validated dual cost tracking — single CostAdapter instance threaded through llm_model_func AND embedding_func captures both LLM and embedding spend without monkey-patching, because lightrag-hku==1.4.15 accepts token_tracker on both `openai_complete_if_cache` and `openai_embed`.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-04-26T17:17:30Z
- **Completed:** 2026-04-26T17:28:15Z
- **Tasks:** 2/2 (probe + impl)
- **Files modified:** 8 (7 created + 1 modified)

## Accomplishments

- **RESEARCH Open Q1 resolved** with empirical probe — `token_tracker` is real on both LLM and embed paths in lightrag-hku==1.4.15.
- **Cost-tracking shape validated** — dict payload with `prompt_tokens` / [`completion_tokens`] / `total_tokens`; dispatch on `completion_tokens` key presence routes LLM vs embed correctly.
- **build_rag factory** — single function in rag.py that hides every LightRAG-specific decision (working_dir, OpenRouter base URL, embedding dim, token tracking) behind one signature so Plan 05 (ingest+query+CLI) consumes Tier 3 without knowing LightRAG internals.
- **No-key import contract** — module imports cleanly without OPENROUTER_API_KEY (closures read env LAZILY); LightRAG constructor itself only does local I/O (creates working_dir + 4 storage files).
- **Tier 3 test suite** — 7 non-live tests covering locked constants, no-key import, build_rag instance shape, and CostAdapter dispatch on LLM/embed/None/object payloads. All pass.
- **Probe script committed** as `scripts/probe_lightrag_token_tracker.py` — re-runnable diagnostic for any future LightRAG version bump.

## Task Commits

Each task was committed atomically and pushed to `origin/main`:

1. **Task 1: Run lightrag token_tracker protocol probe** — `b26e171` (chore)
2. **Task 2: Implement tier-3-graph rag/cost_adapter/shim + pyproject** — `720810b` (feat)

**Plan metadata:** (this SUMMARY commit will follow)

## Probe Output (Verbatim)

The following is the verbatim stdout of `scripts/probe_lightrag_token_tracker.py` against the installed `lightrag-hku==1.4.15`. This output is the authoritative reference for the CostAdapter shape committed in Task 2.

```
lightrag-hku version: 1.4.15

=== openai_complete_if_cache signature ===
(model: str, prompt: str, system_prompt: str | None = None, history_messages: list[dict[str, typing.Any]] | None = None, enable_cot: bool = False, base_url: str | None = None, api_key: str | None = None, token_tracker: typing.Any | None = None, stream: bool | None = None, timeout: int | None = None, keyword_extraction: bool = False, use_azure: bool = False, azure_deployment: str | None = None, api_version: str | None = None, **kwargs: Any) -> str

=== openai_embed signature ===
  type(EmbeddingFunc) -> resolved function
(texts: list[str], model: str = 'text-embedding-3-small', base_url: str | None = None, api_key: str | None = None, embedding_dim: int | None = None, max_token_size: int | None = None, client_configs: dict[str, typing.Any] | None = None, token_tracker: typing.Any | None = None, use_azure: bool = False, azure_deployment: str | None = None, api_version: str | None = None) -> numpy.ndarray

=== references to token_tracker / add_usage in openai_complete_if_cache source ===
  L19:     token_tracker: Any | None = None,
  L56:         token_tracker: Optional token usage tracker for monitoring API usage.
  L274:                 if token_tracker and final_chunk_usage:
  L283:                     token_tracker.add_usage(token_counts)
  L285:                 elif token_tracker:
  L426:             if token_tracker and hasattr(response, "usage"):
  L434:                 token_tracker.add_usage(token_counts)

=== references to token_tracker / add_usage in openai_embed source ===
  L21:     token_tracker: Any | None = None,
  L54:         token_tracker: Optional token usage tracker for monitoring API usage.
  L132:         if token_tracker and hasattr(response, "usage"):
  L137:             token_tracker.add_usage(token_counts)
```

The exact `token_counts` construction (from inspecting the source bodies):

* **LLM path** (`openai_complete_if_cache` L277-283 and L428-434):

  ```python
  token_counts = {
      "prompt_tokens":     getattr(response.usage, "prompt_tokens", 0),
      "completion_tokens": getattr(response.usage, "completion_tokens", 0),
      "total_tokens":      getattr(response.usage, "total_tokens", 0),
  }
  token_tracker.add_usage(token_counts)
  ```

* **Embed path** (`openai_embed` L132-137):

  ```python
  token_counts = {
      "prompt_tokens": getattr(response.usage, "prompt_tokens", 0),
      "total_tokens":  getattr(response.usage, "total_tokens", 0),
      # NB: completion_tokens INTENTIONALLY omitted — embeddings have no output tokens.
  }
  token_tracker.add_usage(token_counts)
  ```

**Outcome classification (per the plan's three-outcome decision table):** **OUTCOME A — with bonus.** Research's HIGH-confidence hypothesis was confirmed for LLM, AND `openai_embed` exposes the same kwarg with a parallel protocol. The plan anticipated this possibility (`<interfaces>` notes "If the probe shows openai_embed ALSO accepts token_tracker, add token_tracker=... to the embed call"); we did so.

## Files Created/Modified

**Companion repo `/Users/patrykattc/work/git/rag-architecture-patterns/`:**

- `scripts/probe_lightrag_token_tracker.py` (new, 122 lines) — One-shot probe; introspects `openai_complete_if_cache` + `openai_embed` signatures, greps source for `token_tracker` / `add_usage` references, also dumps `LightRAG.__init__` and `QueryParam` fields. Includes `_resolve_callable` helper that unwraps `EmbeddingFunc` (the plain `getsource(openai_embed)` raises TypeError because LightRAG exports it as a dataclass instance, not a bare function).
- `tier-3-graph/__init__.py` (new) — Empty package marker.
- `tier-3-graph/rag.py` (new, ~170 lines) — `build_rag(working_dir, llm_token_tracker, model) → LightRAG`; locked constants; `_make_llm_func` + `_make_embed_func` factories that build async closures threading `token_tracker=` through both call paths.
- `tier-3-graph/cost_adapter.py` (new, ~140 lines) — `CostAdapter(tracker, llm_model, embed_model)` with `add_usage(usage)` that dispatches on `completion_tokens` key presence to `record_llm` or `record_embedding`. Documents the monkey-patch fallback as a code-comment block (NOT activated; reserved for the day a LightRAG release removes `add_usage`).
- `tier-3-graph/tests/conftest.py` (new) — Mirrors `tier-1-naive/tests/conftest.py`; loads `.env`, ensures repo root is on `sys.path`, exposes `tier3_live_keys` skip fixture.
- `tier-3-graph/tests/test_rag.py` (new, 7 tests) — Locked constants test, no-key import contract, build_rag instance shape, CostAdapter dispatch on LLM/embed/None/object payloads.
- `tier_3_graph/__init__.py` (new) — Importable shim; verbatim mirror of `tier_1_naive` shim with submodule list `("rag", "cost_adapter", "ingest", "query", "main")` and try/except graceful skip for not-yet-authored modules (Plan 05 will add `ingest`, `query`, `main`).
- `pyproject.toml` (modified) — `[tool.setuptools].packages` extended from `["shared", "scripts", "tier_1_naive"]` to `["shared", "scripts", "tier_1_naive", "tier_3_graph"]`. The 129-02 agent (Tier 2) will append `tier_2_managed` on its commit; final state across both Wave 2 plans should be `["shared", "scripts", "tier_1_naive", "tier_2_managed", "tier_3_graph"]`.

**Profile/planning repo `/Users/patrykattc/work/git/PatrykQuantumNomad/`:**

- `.planning/phases/129-tiers-2-3-managed-graph-rag/129-03-SUMMARY.md` (this file).
- `.planning/phases/129-tiers-2-3-managed-graph-rag/deferred-items.md` (new, logs pre-existing tier-1 test_store failures + dataset metadata.json drift).

## LightRAG Constructor Behavior (Empirically Verified)

`LightRAG(working_dir=td)` constructor with locked params makes **NO network calls**. It does:

1. Create the `working_dir` if missing (`os.makedirs`).
2. Initialize three nano-vectordb empty stores: `vdb_entities.json`, `vdb_relationships.json`, `vdb_chunks.json` (all with `embedding_dim=1536` from our `EmbeddingFunc`).
3. Create an empty `graph_chunk_entity_relation.graphml` (NetworkX backend).

Smoke-construction with `OPENROUTER_API_KEY` UNSET succeeded — confirming the no-key import + construct contract. First network activity is `await rag.ainsert(...)` (Plan 05).

## Decisions Made

See frontmatter `key-decisions` for the full list. Most consequential:

1. **Dual cost capture in one CostAdapter** — research's <interfaces> section anticipated single-side capture; probe revealed both sides are wired, so I built the adapter to dispatch on payload shape. Net effect: Tier 3's reported cost will include embedding spend out of the box (vs research's plan of LLM-only capture), making `evaluation/results/costs/tier-3-{ts}.json` materially more accurate.
2. **Stripped type annotations on constants** so the plan's verify regex (`grep -q 'EMBED_DIMS = 1536'`) passes byte-for-byte. Trivial cosmetic change; values + module-level placement unchanged. Documented for the verifier so this doesn't read as accidental drift.
3. **No `__init__.py` under `tier-3-graph/tests/`** — mirrors Plan 128-02's follow-on fix; otherwise pytest's rootdir importer raises `ImportPathMismatchError` between repo-root `tests/__init__.py` and tier-local. Test discovery works without it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Probe script crashed on `inspect.getsource(openai_embed)` (TypeError: got EmbeddingFunc)**

- **Found during:** Task 1 (first probe run)
- **Issue:** LightRAG exports `openai_embed` as an `EmbeddingFunc` dataclass instance (the inner async function is on `.func`), so passing it to `inspect.getsource` raises `TypeError`. The probe terminated mid-output before printing the embed-source greps.
- **Fix:** Added `_resolve_callable(obj)` helper that unwraps `.func` / `__wrapped__` before `getsource`; widened the probe's exception handling to catch `TypeError` alongside `OSError`.
- **Files modified:** `scripts/probe_lightrag_token_tracker.py` (lines 32-43, 46-62, 75-84).
- **Verification:** Re-ran probe; embed signature + source greps now print cleanly ("L132/L137 references to add_usage" → `openai_embed` ALSO supports tracker, the bonus discovery).
- **Committed in:** `b26e171` (Task 1 commit — fix landed inside the probe-script before the script was ever committed).

**2. [Rule 2 — Missing critical functionality] `openai_embed` accepts token_tracker; CostAdapter must handle embed-shape payloads**

- **Found during:** Task 1 probe outcome analysis
- **Issue:** Research's `<interfaces>` section prescribed a CostAdapter that handled the LLM payload shape only (forwarded into `record_llm`). The probe revealed `openai_embed` ALSO calls `token_tracker.add_usage(...)` with a payload that LACKS `completion_tokens`. Without dispatch logic, ALL embed cost would be silently mis-recorded as zero-completion LLM cost (wrong row in pricing table → wrong total).
- **Fix:** CostAdapter now takes both `llm_model` and `embed_model` slugs at construction; `add_usage` dispatches on `completion_tokens` key presence to `record_llm` or `record_embedding`. Embed-side closure also accepts a tracker (`_make_embed_func(token_tracker=...)`) and threads it into `openai_embed`.
- **Files modified:** `tier-3-graph/cost_adapter.py`, `tier-3-graph/rag.py`.
- **Verification:** `test_cost_adapter_dispatches_llm_payload_to_record_llm` + `test_cost_adapter_dispatches_embed_payload_to_record_embedding` both pass; manual probe confirmed `total_usd > 0` after a 1-LLM + 1-embed call sequence.
- **Committed in:** `720810b` (Task 2 commit).

**3. [Rule 1 — Bug] Initial test `test_module_imports_without_api_key` used `importlib.reload` against shim-loaded module → `ModuleNotFoundError: spec not found`**

- **Found during:** Task 2 (running the new test suite)
- **Issue:** `tier_3_graph.rag` is loaded via the shim's one-shot `spec_from_file_location` mechanism; `importlib.reload` requires an active spec on `sys.modules[name]` and raises `ModuleNotFoundError: spec not found for the module 'tier_3_graph.rag'`. This obscured the actual no-key-import contract that the test was meant to assert.
- **Fix:** Test now loads `tier-3-graph/rag.py` directly via `importlib.util.spec_from_file_location` (as `_tier3_rag_smoke`), independent of the shim. This observes the bare-module import contract while leaving any prior shim-loaded `tier_3_graph.rag` in `sys.modules` untouched.
- **Files modified:** `tier-3-graph/tests/test_rag.py` (lines 64-94 in final form).
- **Verification:** `7 passed in 0.60s` (was `1 failed, 6 passed`).
- **Committed in:** `720810b` (Task 2 commit; fix landed before commit).

---

**Total deviations:** 3 auto-fixed (1 bug fix in probe, 1 missing-critical adapter dispatch, 1 bug fix in test). All necessary for correctness — no scope creep.

**Impact on plan:** Deviation #2 is the most consequential — it widened CostAdapter's contract beyond what `<interfaces>` prescribed because the probe surfaced behavior the research did not anticipate. Net effect: Tier 3 cost reporting is materially more accurate (embedding spend is a non-trivial fraction of one-shot ingest cost — Pitfall 3). No scope creep — the new method dispatch lives entirely inside the file the plan already mandated.

## Issues Encountered

- **`uv sync --extra tier-3` failed with sandbox permission error** on default `~/.cache/uv/` git-cache. Worked around by setting `UV_CACHE_DIR=$TMPDIR/uv-cache` for both the sync and all subsequent `uv run` invocations. This is a Darwin-25 sandbox policy, not a tool bug.
- **5 pre-existing tier-1 `test_store.py` failures** discovered during the full-suite regression check (`AttributeError: module '_tier1_store' has no attribute 'open_collection'`). Verified they fail on a clean tree at `b26e171` (after probe push, before Task 2) — they predate Plan 03. Logged to `.planning/phases/129-tiers-2-3-managed-graph-rag/deferred-items.md` per Scope Boundary; NOT auto-fixed. Suggested next step: open a quick-task to align `test_store.py` with the post-128-06 OpenRouter-routed `store.py` API.
- **`dataset/manifests/metadata.json` shows uncommitted timestamp drift** in companion repo. Not caused by Plan 03; left untouched.

## Wave 2 Coordination Status

At Plan 03 completion (push `720810b` at 17:28:15Z), companion repo `origin/main` HEAD is `720810b` and the 129-02 agent has NOT yet pushed. Therefore:

- Final pyproject.toml `[tool.setuptools].packages` = `["shared", "scripts", "tier_1_naive", "tier_3_graph"]` (Plan 03's edit; missing `tier_2_managed`).
- The 129-02 agent will need to rebase its packages-line edit against `720810b`. The conflict is a 2-line `packages = [...]` insert — trivial.
- Final expected state after both Wave 2 plans complete: `packages = ["shared", "scripts", "tier_1_naive", "tier_2_managed", "tier_3_graph"]`.

## User Setup Required

None — no new external services. `OPENROUTER_API_KEY` was already declared by Phase 128 and promoted to Tier 3 in Plan 129-01 (`.env.example` comment).

## Next Phase Readiness

- **Plan 129-04 (Wave 3 — Tier 2 ingest+query+CLI):** Independent of Tier 3 — Plan 02 lands the Tier 2 helpers; Plan 04 wires them.
- **Plan 129-05 (Wave 3 — Tier 3 ingest+query+CLI):** Ready. Will import `from tier_3_graph.rag import build_rag` and `from tier_3_graph.cost_adapter import CostAdapter`. The cost-tracking glue is already wired — Plan 05 just creates `CostAdapter(tracker, "google/gemini-2.5-flash", "openai/text-embedding-3-small")` and passes it as `build_rag(llm_token_tracker=adapter)`.
- **Plan 129-07 (Wave 4 — Tier 3 README + live test):** Ready. Live test will be the first time we exercise the full `rag.ainsert(...) → rag.aquery(...)` path; expect Pitfall 3 (~$1 ingest cost) at 100-paper scale, but a 2-paper subset (Phase 128 precedent) is the safer first run.

**Blockers/concerns:**

- 5 pre-existing tier-1 test_store failures (logged to `deferred-items.md`; non-blocking for Tier 3 but should be addressed before Phase 129 verifier runs).

## Self-Check: PASSED

Verified after writing this SUMMARY:

- `scripts/probe_lightrag_token_tracker.py` exists ✓
- `tier-3-graph/__init__.py`, `rag.py`, `cost_adapter.py` exist ✓
- `tier-3-graph/tests/conftest.py`, `test_rag.py` exist ✓
- `tier_3_graph/__init__.py` exists ✓
- Commit `b26e171` (probe) on origin/main ✓
- Commit `720810b` (impl) on origin/main ✓
- 7 non-live tier-3 tests pass ✓
- All grep checks (`def build_rag`, `WORKING_DIR`, `EMBED_DIMS = 1536`, `openai_complete_if_cache`, `openai_embed`, `class CostAdapter`, `tier_3_graph` in pyproject) pass ✓
- No tier-2 files modified ✓
- shared/embeddings.py + shared/llm.py NOT modified ✓

---
*Phase: 129-tiers-2-3-managed-graph-rag*
*Completed: 2026-04-26*
