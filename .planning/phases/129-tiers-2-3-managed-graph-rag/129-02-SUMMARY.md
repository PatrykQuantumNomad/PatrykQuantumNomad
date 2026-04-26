---
phase: 129-tiers-2-3-managed-graph-rag
plan: 02
subsystem: rag-tier
tags: [gemini, file-search-store, managed-rag, google-genai, importlib-shim, long-running-operation]

# Dependency graph
requires:
  - phase: 129-01
    provides: "[shared] extras include google-genai>=1.73 (which exposes client.file_search_stores.*); .gitignore covers tier-2-managed/.store_id"
  - phase: 128-04
    provides: "tier_1_naive importable shim pattern (importlib.util.spec_from_file_location) used verbatim for tier_2_managed"
provides:
  - "tier-2-managed/store.py — 5 FileSearchStore lifecycle helpers (get_or_create_store, upload_pdf, upload_with_retry, list_existing_documents, delete_store) + STORE_ID_PATH / STORE_DISPLAY_NAME / POLL_INTERVAL_S module constants"
  - "tier_2_managed/ — importable shim package mirroring tier_1_naive (registers tier-2-managed/*.py modules under tier_2_managed.<name>)"
  - "Operation polling abstraction: client.operations.get(op) loop until op.done (Pattern 2)"
  - "503 backoff abstraction: 30s/60s/120s exponential retry (Pitfall 2)"
  - "Idempotent ingest helper: list_existing_documents() returns display_names already uploaded so --ingest can resume after 503 storms"
affects: [129-04, 129-06, 129-07, "Tier 2 CLI (Plan 04) consumes these helpers", "Tier 2 live e2e test (Plan 06) exercises the full lifecycle"]

# Tech tracking
tech-stack:
  added:
    - "google.genai.Client.file_search_stores.* (was already in [shared] from 128-01 / 129-01; this plan is the first consumer)"
    - "google.genai.Client.operations.get (long-running operation polling — Pattern 2)"
  patterns:
    - "Hyphen-dir + underscore-shim: human-readable on-disk dir tier-2-managed/, importable name tier_2_managed (mirrors tier_1_naive from 128-04 + tier_3_graph from 129-03)"
    - "Long-running operation polling via client.operations.get(op).done with POLL_INTERVAL_S=2.0s (cookbook 1-3s middle)"
    - "Pitfall-2 503 backoff: 30s base × 2^attempt → 30/60/120 (community-verified minimum that escapes TPM saturation)"
    - "Sidecar caching with stale-handle recovery: .store_id holds server-assigned name; get/delete failure prompts cache invalidation + recreate"
    - "Idempotent ingest via documents.list(parent=...) display-name set diff (skip already-indexed PDFs)"

key-files:
  created:
    - "/Users/patrykattc/work/git/rag-architecture-patterns/tier-2-managed/__init__.py"
    - "/Users/patrykattc/work/git/rag-architecture-patterns/tier-2-managed/store.py"
    - "/Users/patrykattc/work/git/rag-architecture-patterns/tier_2_managed/__init__.py"
  modified:
    - "/Users/patrykattc/work/git/rag-architecture-patterns/pyproject.toml"

key-decisions:
  - "Plan 129-02: Used parent= kwarg (NOT file_search_store_name=) for client.file_search_stores.documents.list() — verified against google-genai==1.73.0 SDK source (documents.py L327-354). Plan/research draft used the wrong kwarg; SDK reuses the standard Google API parent= convention for list endpoints while upload/import keep file_search_store_name=. Caught and fixed via Rule 1 before commit."
  - "Plan 129-02: tier_2_managed shim is 64 lines vs tier_1_naive's 62 — only difference is two extra docstring lines mentioning Plan 129-04 module names (query, main); load loop is structurally identical. Confirms the hyphen-dir → underscore-shim is now a stable repo convention across Tiers 1, 2, 3."
  - "Plan 129-02: pyproject.toml [tool.setuptools].packages = [\"shared\", \"scripts\", \"tier_1_naive\", \"tier_2_managed\", \"tier_3_graph\"] — Plan 129-03 added tier_3_graph concurrently; this plan's edit was the second of two parallel-wave shim package additions and merged cleanly because each plan touched a distinct list element on a distinct line context."
  - "Plan 129-02: NO live API calls executed during this plan. The smoke test exercises pure import resolution + module-level constant assertions (STORE_DISPLAY_NAME == 'rag-arch-patterns-tier-2', STORE_ID_PATH endswith 'tier-2-managed/.store_id', POLL_INTERVAL_S == 2.0). Live store-create/upload deferred to Plan 06 e2e per plan instructions to avoid burning quota on import-only assertions."
  - "Plan 129-02: client.file_search_stores.documents.list() returns google.genai.pagers.Pager[types.Document] (auto-paginates on iteration). For Plan 06's live test loop: a plain `for doc in pager: ...` covers stores larger than one page without manual next_page() calls."

patterns-established:
  - "Tier shim pattern (now applied to Tiers 1, 2, 3): importlib.util.spec_from_file_location loads tier-N-name/X.py as tier_N_name.X; sys.path.insert(0, tier_dir) lets intra-tier flat imports work both when modules run as scripts and when loaded via shim"
  - "FileSearchStore lifecycle pattern: 5 small helpers with an in-process dependency-injected Client (no module-level genai.Client construction → safe for non-live tests, no API key required at import time)"
  - "Long-running-operation polling shape: walrus refresh `while not (op := client.operations.get(op)).done: time.sleep(2)` — copy-pasteable to Tiers 4 (RAG-Anything) and 5 (Agentic) when those operations land"

# Metrics
duration: 14min
completed: 2026-04-26
---

# Phase 129 Plan 02: Tier 2 FileSearchStore Lifecycle Summary

**Tier 2 store lifecycle module wraps Gemini's managed File Search Store API behind 5 small helpers (get/create/upload/list/delete) with operation polling (Pattern 2), 30s/60s/120s 503 backoff (Pitfall 2), idempotent re-ingest via display-name diff, and a tier_2_managed importable shim mirroring the Phase 128 tier_1_naive convention.**

## Performance

- **Duration:** 14 min (1777223987 → 1777224832)
- **Started:** 2026-04-26T17:19:47Z
- **Completed:** 2026-04-26T17:33:52Z
- **Tasks:** 1 / 1
- **Files modified:** 4 (3 created + 1 modified, ~240 LOC delta)

## Accomplishments
- `tier-2-managed/store.py` (171 LOC) exposes the 5 lifecycle helpers + 3 module constants required by the plan's `must_haves.truths` block.
- `tier_2_managed/__init__.py` (64 LOC) shim makes the hyphenated dir importable; structurally identical to the Phase 128 `tier_1_naive` shim.
- `pyproject.toml [tool.setuptools].packages` now lists all three shim packages (`tier_1_naive`, `tier_2_managed`, `tier_3_graph`) so editable installs register them.
- Caught and fixed a Rule 1 bug in the plan's reference code (`documents.list(file_search_store_name=...)` → `documents.list(parent=...)`) by introspecting the actual SDK signature.
- All 64 non-live tests still pass; no regressions introduced.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement tier-2-managed/store.py + tier-2-managed/__init__.py + tier_2_managed shim package + pyproject packages list** — `332f2d2` (feat)

## Files Created/Modified

- `tier-2-managed/__init__.py` (created, 1 LOC) — empty-ish package marker with docstring; allows the hyphenated dir to act as a relative-import root for its own modules.
- `tier-2-managed/store.py` (created, 171 LOC) — `get_or_create_store`, `upload_pdf`, `upload_with_retry`, `list_existing_documents`, `delete_store` + `STORE_ID_PATH`, `STORE_DISPLAY_NAME`, `POLL_INTERVAL_S` constants. Implementation follows 129-RESEARCH.md Pattern 1 (sidecar caching with stale-handle recovery), Pattern 2 (operation polling via `client.operations.get(op).done`), Pitfall 2 (30s base × 2^attempt backoff), and Pitfall 2 resilience (idempotent ingest via `documents.list(parent=...)`).
- `tier_2_managed/__init__.py` (created, 64 LOC) — importable shim. Verbatim mirror of `tier_1_naive/__init__.py` (62 LOC) modulo two extra docstring lines noting Plan 129-04 module names.
- `pyproject.toml` (modified, 1 line changed + comment refresh) — `packages = ["shared", "scripts", "tier_1_naive", "tier_2_managed", "tier_3_graph"]`.

### Final Exports List (`tier-2-managed/store.py`)

| Symbol | Kind | Purpose |
|---|---|---|
| `STORE_ID_PATH` | `Path` constant | `tier-2-managed/.store_id` (gitignored) — caches server-assigned store name |
| `STORE_DISPLAY_NAME` | `str` constant | `"rag-arch-patterns-tier-2"` — stable display name for Gemini console recognition |
| `POLL_INTERVAL_S` | `float` constant | `2.0` — middle of cookbook 1-3s polling range |
| `get_or_create_store(client, reset=False)` | function | Resolve cached store handle OR create a new `FileSearchStore`; auto-recovers from stale `.store_id` |
| `upload_pdf(client, store_name, pdf_path, display_name)` | function | Single-PDF upload with `client.operations.get(op)` polling until `op.done`; raises `RuntimeError` on `op.error` |
| `upload_with_retry(client, store_name, pdf_path, display_name, max_attempts=3, base_wait_s=30.0)` | function | 30s / 60s / 120s exponential backoff wrapper around `upload_pdf` for Pitfall 2 |
| `list_existing_documents(client, store_name) -> set[str]` | function | Iterates `client.file_search_stores.documents.list(parent=store_name)` and returns `display_name`s already in the store (idempotent ingest) |
| `delete_store(client, store_name) -> None` | function | Force-deletes the server-side store and removes the `.store_id` sidecar |

### Shim Pattern Confirmation

The `tier_2_managed/__init__.py` shim uses `importlib.util.spec_from_file_location` (line 38: `spec = importlib.util.spec_from_file_location(full_name, src)`) to register `tier-2-managed/*.py` files as importable submodules of `tier_2_managed`. It is structurally identical to `tier_1_naive/__init__.py` (62 LOC vs 64 LOC; the only differences are the directory name swap and two docstring lines mentioning the Plan 129-04 modules `query` and `main`).

The submodule load loop tries `("store", "query", "main")` and silently skips missing files via try/except so the shim is usable during partial Plan 02 execution (when only `store.py` exists).

### `pyproject.toml [tool.setuptools].packages` (verbatim)

```toml
packages = ["shared", "scripts", "tier_1_naive", "tier_2_managed", "tier_3_graph"]
```

The accompanying comment was refreshed to mention all three shim packages.

### Live API Calls

**Zero live API calls** were made during this plan. The smoke test exercises only:
- Pure import resolution: `from tier_2_managed.store import ...`
- Module-level constant assertions: `STORE_DISPLAY_NAME`, `STORE_ID_PATH`, `POLL_INTERVAL_S` checked against expected values.
- Source-level fix verification: `inspect.getsource(list_existing_documents)` confirms `parent=store_name` is the kwarg actually called.

The `genai.Client(...)` constructor is never invoked at module-import time and is never invoked from any test in this plan. Live store-create / upload / query exercises remain deferred to Plan 06 e2e per plan instructions.

### Documents Pager Shape (informs Plan 06 live test loop)

`client.file_search_stores.documents.list(parent=store_name)` returns `google.genai.pagers.Pager[google.genai.types.Document]` on `google-genai==1.73.0`. From the SDK source (`google/genai/documents.py:327-354` and `google/genai/pagers.py`):

- The `Pager` class is `Generic[T]` with MRO `[Pager, _BasePager, Generic, object]`.
- Iterating the pager (`for doc in pager: ...`) auto-fetches the next page when the current page is exhausted.
- A single `for` loop therefore covers stores larger than one page; no manual `next_page()` calls required for Plan 06's live test loop.
- Each yielded `Document` has fields: `name`, `display_name`, `state`, `size_bytes`, `mime_type`, `create_time`, `update_time`, `custom_metadata`. `list_existing_documents` reads only `display_name`.

## Decisions Made

See frontmatter `key-decisions` for the four decisions extracted to STATE.md. Brief rationales:

1. **`parent=` kwarg correction (Rule 1 fix).** The plan's `<interfaces>` block proposed `documents.list(file_search_store_name=...)`. The actual SDK uses `parent=store_name`. This was caught by introspecting `Documents.list.signature` against the installed `google-genai==1.73.0` and would have failed at first live call.
2. **Hyphen-dir + underscore-shim is now a stable repo pattern.** Tiers 1, 2, and 3 all use it; the only diff between shims is the literal directory name + the submodule list.
3. **Concurrent-wave merge handled cleanly.** Plan 129-03 added `tier_3_graph` to the packages list ~14 minutes earlier; my edit added `tier_2_managed` on the same line (different element). Each agent's diff stayed scoped to its own tier; no merge conflict, no force-push, no rebase needed.
4. **Live tests deferred to Plan 06.** Storing, uploading, and querying real PDFs would burn Gemini File Search quota for what is fundamentally a "module imports cleanly" assertion in this plan. The single Plan 06 live e2e is the canonical billing point for Tier 2.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] `documents.list()` kwarg corrected to `parent=` (was `file_search_store_name=` in plan reference code)**
- **Found during:** Task 1 (during pre-commit SDK introspection)
- **Issue:** The plan's `<interfaces>` block and code example both call `client.file_search_stores.documents.list(file_search_store_name=store_name)`. The actual `google.genai.documents.Documents.list` signature on `google-genai==1.73.0` is `list(*, parent: str, config: ...) -> Pager[Document]` (verified at `.venv/.../google/genai/documents.py:327-354`). Calling with `file_search_store_name=` would raise `TypeError: list() got an unexpected keyword argument 'file_search_store_name'` at the first live invocation. The kwarg `file_search_store_name` IS used by `upload_to_file_search_store` and `import_file` (verified at `file_search_stores.py:594, 683`), but the list-style endpoint follows the standard Google API `parent=` convention.
- **Fix:** `list_existing_documents` now calls `client.file_search_stores.documents.list(parent=store_name)`. Docstring updated to document why and to clarify the kwarg distinction across endpoints.
- **Files modified:** `tier-2-managed/store.py` (lines 134-153)
- **Verification:**
  1. `inspect.signature(Documents.list)` confirmed signature.
  2. Smoke import + assertion that source contains `parent=store_name` and not `file_search_store_name=store_name`.
  3. Plan automated verification block re-run, all 13 grep checks pass.
- **Committed in:** `332f2d2` (Task 1 commit — fix bundled into the atomic feat commit before push, not separated into a follow-on, because the smoke test asserting correct kwarg usage depends on it)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix is essential for correctness — Plan 06's live e2e would have failed immediately on the idempotent-ingest path. Caught pre-flight via SDK introspection. No scope creep; the fix touched only the one function whose signature was wrong.

## Issues Encountered

- **Pre-existing test failures in `tier-1-naive/tests/test_store.py` (5 tests)** — these failures are environmental (the executor's `.venv` has `[shared]` deps installed but NOT `[tier-1]` deps, so `chromadb` is missing). Confirmed pre-existing by temporarily moving Plan 129-02 changes aside and reverting `pyproject.toml` to HEAD `720810b` — same 5 failures occur on baseline. **Out of scope** per the SCOPE BOUNDARY rule (failures are not caused by this plan's changes); deferred for the user to resolve via `uv sync --extra tier-1 --extra tier-2 --extra tier-3` or by running `pytest -m "not live"` after a tier-1 sync. All 64 tier-2-relevant tests pass.
- **`uv run` blocked by sandbox** (cannot write to `~/.cache/uv/sdists-v8/.git`). Worked around by invoking `.venv/bin/python` directly for both smoke import and pytest. Tests + smoke checks ran cleanly via this path.
- **Concurrent push race with Plan 129-03.** Plan 129-03 pushed `b26e171` and `720810b` onto `origin/main` while this plan was executing. My push of `332f2d2` was a clean fast-forward (`720810b..332f2d2 main -> main`) because Plan 129-03 only touched `tier-3-graph/` + `tier_3_graph/` files plus a different element of the same `packages` array; no conflict.

## User Setup Required

None — this plan adds zero new external service requirements. Tier 2 reuses the existing `GEMINI_API_KEY` (`shared.config.gemini_api_key`, REQUIRED since Phase 127). Plan 04's CLI will be the first consumer that actually invokes `genai.Client()`.

## Next Phase Readiness

- **Plan 04 (Tier 2 CLI orchestration) is unblocked.** The five `store.py` helpers are the public API Plan 04 consumes; main.py / query.py can import them via `from tier_2_managed.store import ...`.
- **Plan 06 (Tier 2 live e2e test) is unblocked.** The `documents.list(parent=...)` shape is now confirmed; the live test loop can iterate the pager directly without manual pagination.
- **No blockers introduced.** The chromadb-missing pre-existing failures pre-date this plan and are tier-1's environmental concern.

## Self-Check: PASSED

- `tier-2-managed/__init__.py` — exists at `/Users/patrykattc/work/git/rag-architecture-patterns/tier-2-managed/__init__.py` (1 LOC).
- `tier-2-managed/store.py` — exists at `/Users/patrykattc/work/git/rag-architecture-patterns/tier-2-managed/store.py` (171 LOC, > 80-line min from frontmatter `min_lines: 80`).
- `tier_2_managed/__init__.py` — exists at `/Users/patrykattc/work/git/rag-architecture-patterns/tier_2_managed/__init__.py` (64 LOC, > 30-line min from frontmatter `min_lines: 30`).
- `pyproject.toml` — packages line includes `tier_2_managed` (verified by grep).
- Commit `332f2d2` — present in `git log --oneline` on local main and pushed to `origin/main` (`720810b..332f2d2 main -> main`).
- All 13 plan automated-verification greps PASS; non-live pytest (excluding pre-existing chromadb-missing failures) PASS (64 passed, 2 skipped, 5 deselected).
- Smoke import: `from tier_2_managed.store import (get_or_create_store, upload_pdf, upload_with_retry, list_existing_documents, delete_store, STORE_ID_PATH, STORE_DISPLAY_NAME, POLL_INTERVAL_S)` resolves cleanly, all module constants match expected values.

---
*Phase: 129-tiers-2-3-managed-graph-rag*
*Plan: 02*
*Completed: 2026-04-26*
