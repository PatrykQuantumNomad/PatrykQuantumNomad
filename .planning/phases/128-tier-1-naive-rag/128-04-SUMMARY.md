---
phase: 128-tier-1-naive-rag
plan: 04
subsystem: rag-pipeline-cli
tags: [argparse, rich, chromadb, openai-embeddings, gemini, cost-tracking, cli, latency]

requires:
  - phase: 127-repository-skeleton-enterprise-dataset
    provides: shared.{config, loader, llm, display, cost_tracker, pricing}
  - phase: 128-tier-1-naive-rag/02
    provides: tier_1_naive.ingest (extract_pages, chunk_page)
  - phase: 128-tier-1-naive-rag/03
    provides: tier_1_naive.{embed_openai, store, retrieve}
provides:
  - "tier-1-naive/main.py — argparse CLI entrypoint (--ingest / --query / --top-k / --reset)"
  - "tier-1-naive/prompt.py — context-stuffed citation-aware prompt builder"
  - "tier_1_naive/ shim package — re-exports hyphenated tier-1-naive/* modules under an importable dotted name"
  - "Single CostTracker(\"tier-1\") instance threaded through embed_batch + record_llm + persist (D-13 schema)"
  - "End-to-end query latency via time.monotonic() printed alongside cost"
  - "DEFAULT_QUERY locked verbatim to golden_qa.json::single-hop-001 (Lewis et al. 2020 RAG paper)"
affects: [128-05 (live end-to-end test consumes this CLI), 128-README, 130 (tier 5 reads chroma_db/tier-1-naive/)]

tech-stack:
  added: [] # all imports come from previously-installed shared and tier-1 deps
  patterns:
    - "Pattern 4: Idempotent ingest (skip if collection.count() > 0 and not --reset)"
    - "Pattern 5: render_query_result + tracker.persist() at end of query path"
    - "Pitfall 10: OPENAI_API_KEY None-check at CLI start before any work"
    - "Importable shim for hyphenated package directories (tier_1_naive/__init__.py loads tier-1-naive/*.py via importlib)"

key-files:
  created:
    - "../rag-architecture-patterns/tier-1-naive/prompt.py (43 LOC)"
    - "../rag-architecture-patterns/tier-1-naive/main.py (251 LOC)"
    - "../rag-architecture-patterns/tier_1_naive/__init__.py (62 LOC, importable shim)"
  modified:
    - "../rag-architecture-patterns/pyproject.toml (added tier_1_naive to setuptools packages)"

key-decisions:
  - "tier_1_naive importable shim package was REQUIRED because the on-disk directory tier-1-naive/ has hyphens (invalid Python identifiers); the shim uses importlib.util.spec_from_file_location to register tier-1-naive/*.py modules under tier_1_naive.* — main.py, prompt.py, and external test/import callers can use the dotted name without renaming the directory or duplicating code"
  - "Bundled the shim into Task 1's commit (rather than a separate Rule-3 follow-on) because Task 1's smoke test (`from tier_1_naive.prompt import build_prompt`) cannot run without it; keeps the atomic unit coherent"
  - "OPENAI_API_KEY None guard placed BEFORE CostTracker instantiation and before any client construction — fast-fail with friendly red error + exit code 2 (Pitfall 10); verified with patched get_settings returning a fake settings object with openai_api_key=None"
  - "Default flag-less invocation auto-sets args.ingest=True AND args.query=DEFAULT_QUERY — relies on cmd_ingest's idempotency to skip embed work when index already populated, so users get the demo without needing to know flags"
  - "Estimated ingest cost printed via inline arithmetic (chunks * 512 tokens / 1M * $0.02) — conservative because actual chunk sizes vary; matches Pitfall 5's informational-not-blocking approach (no --yes prompt at this corpus size)"

patterns-established:
  - "Hyphenated tier dirs + importable shim package: applies to all future tier directories (tier-2-managed, tier-3-graph, tier-4-multimodal, tier-5-agentic) that need cross-module imports"
  - "Latency-with-cost footer: time.monotonic() bracket around embed+retrieve+LLM, printed as 'Latency: X.XXs' after render_query_result"

duration: 5min
completed: 2026-04-26
---

# Phase 128 Plan 04: Tier 1 CLI Orchestration Summary

**Argparse CLI (`tier-1-naive/main.py`) wiring shared.{config,loader,llm,display,cost_tracker} + tier_1_naive.{ingest,embed_openai,store,retrieve,prompt} into a single Naive-RAG demo entrypoint with idempotent --ingest, OPENAI_API_KEY fast-fail guard, and cost+latency reporting via render_query_result.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-26T12:18:16Z
- **Completed:** 2026-04-26T12:23:04Z
- **Tasks:** 2
- **Files created:** 3 (prompt.py, main.py, tier_1_naive/__init__.py)
- **Files modified:** 1 (pyproject.toml)

## Accomplishments

- `tier-1-naive/prompt.py` exposes `build_prompt(question, docs, metas)` emitting a context-stuffed prompt with `[N] paper_id=... page=...` markers, `--- CONTEXT ---` / `--- QUESTION ---` sentinels, and a trailing `Answer:` cue (steers Gemini toward inline `[paper_id p.<page>]` citations without rerank/rewrite scaffolding).
- `tier-1-naive/main.py` argparse CLI with `--ingest`, `--query`, `--top-k`, `--reset` flags + flag-less default that auto-ingests an empty index and runs the canonical `single-hop-001` demo query.
- One `CostTracker("tier-1")` instance threaded through `embed_batch` (record_embedding) + LLM completion (record_llm) + `.persist()` at end of query path — D-13 schema preserved.
- End-to-end query latency measured via `time.monotonic()` and printed as `Latency: X.XXs` alongside cost in the render footer.
- `OPENAI_API_KEY=None` fast-fail guard at startup (Pitfall 10) — verified with mocked settings: emits friendly red error and returns exit code 2 BEFORE any API client is constructed.
- Idempotent `--ingest` (Pattern 4): `collection.count() > 0 and not --reset` short-circuits the embed loop and prints "already populated".
- Estimated ingest cost printed before the embed loop (Pitfall 5): `~${chunks * 512 / 1M * $0.02}` (conservative for text-embedding-3-small).
- `tier_1_naive/__init__.py` importable shim package — uses `importlib.util.spec_from_file_location` to register each `tier-1-naive/*.py` module under `tier_1_naive.<name>` so external callers (and test code) can write `from tier_1_naive.X import Y` without renaming the on-disk hyphenated directory.

## Verbatim `--help` output

```
usage: tier-1-naive [-h] [--ingest] [--query QUERY] [--top-k TOP_K] [--reset]

Tier 1 (Naive RAG) — ChromaDB + OpenAI embeddings + Gemini chat.

options:
  -h, --help     show this help message and exit
  --ingest       Run ingest (PDFs -> chunks -> embeddings -> ChromaDB).
  --query QUERY  Run a query against the persisted index.
  --top-k TOP_K  Number of chunks to retrieve (default 5).
  --reset        Wipe the collection before --ingest.
```

## Task Commits

Each task was committed atomically (companion repo `rag-architecture-patterns`):

1. **Task 1: prompt.py + tier_1_naive shim package** — `4d2a9ca` (feat)
2. **Task 2: main.py CLI orchestration** — `7cd5da7` (feat)

**Plan metadata commit (this SUMMARY + STATE):** to be created next in the profile repo.

## Files Created/Modified

In companion repo `/Users/patrykattc/work/git/rag-architecture-patterns/`:

- `tier-1-naive/prompt.py` (43 LOC) — `build_prompt(question, docs, metas) -> str` with CONTEXT/QUESTION sentinels and per-chunk `[N] paper_id=... page=...` markers.
- `tier-1-naive/main.py` (251 LOC) — argparse CLI with `cmd_ingest`, `cmd_query`, `_build_parser`, `main` entrypoint; constants `EMBED_BATCH=100`, `DEFAULT_TOP_K=5`, `DEFAULT_QUERY` locked to single-hop-001.
- `tier_1_naive/__init__.py` (62 LOC) — importable shim package that loads sibling modules from `tier-1-naive/` via importlib so `from tier_1_naive.X import Y` works repo-wide.
- `pyproject.toml` — added `tier_1_naive` to `[tool.setuptools] packages` list.

## Decisions Made

See `key-decisions` in frontmatter. Highlights:

- **Hyphenated-dir shim:** the most general solution for cross-module imports across tier directories that follow the human-readable `tier-N-name/` convention. The shim adds no logic — only path resolution — and keeps each underlying `*.py` file a clean library file.
- **OPENAI_API_KEY guard placement:** before any tracker or client construction, so the user sees a single friendly message even if they forgot to set the key.
- **Default-flag UX:** auto-ingest + canned query gets users to a working demo in one command, leveraging cmd_ingest's idempotency for repeat invocations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created `tier_1_naive/` importable shim package**

- **Found during:** Task 1 (smoke import of `from tier_1_naive.prompt import build_prompt`)
- **Issue:** The plan's smoke test for prompt.py (and main.py's full import block — `from tier_1_naive.embed_openai import ...`, `from tier_1_naive.ingest import ...`, etc.) uses the dotted name `tier_1_naive`, but the on-disk directory is `tier-1-naive` (with hyphens). Hyphens are not valid Python identifiers, so Python cannot import `tier-1-naive` as `tier_1_naive` directly. Plans 02 and 03 worked around this in their tests via `importlib.util.spec_from_file_location` (per `_tier1_ingest` synthetic name), but main.py's import block uses the standard dotted form which would have produced `ModuleNotFoundError`.
- **Fix:** Added a tiny `tier_1_naive/__init__.py` shim package at repo root that:
  1. Inserts the hyphenated `tier-1-naive/` directory onto `sys.path` so flat imports inside it work when modules are loaded.
  2. Eagerly registers each tier-1-naive sibling module (`ingest`, `embed_openai`, `store`, `retrieve`, `prompt`, `main`) under `tier_1_naive.<name>` via `importlib.util.spec_from_file_location` + `sys.modules`-pinning.
  3. The `main` module is loaded best-effort during partial Plan 04 execution (skipped silently if not yet written).
- **Files created/modified:** `tier_1_naive/__init__.py` (new), `pyproject.toml` (added `tier_1_naive` to setuptools packages).
- **Verification:** `from tier_1_naive.prompt import build_prompt` works. `from tier_1_naive.main import main, DEFAULT_QUERY, DEFAULT_TOP_K, EMBED_BATCH` works. Full non-live test suite (61 passed, 2 skipped, 4 deselected) unchanged — Plan 02/03 tests still use their own `importlib` loader pattern (independent of this shim) and nothing regresses.
- **Committed in:** `4d2a9ca` (bundled with Task 1's prompt.py commit because Task 1's smoke test depends on it).

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking)
**Impact on plan:** No scope creep. The shim is the minimum necessary to satisfy the plan's literal `tier_1_naive.*` import statements and preserves the existing on-disk hyphenated-directory convention. Future tier plans (02-managed, 03-graph, 04-multimodal, 05-agentic) can adopt the same shim pattern when they need cross-module imports.

## Verification

All success criteria from the plan satisfied:

- `python tier-1-naive/main.py --help` exits 0 and lists `--ingest`, `--query`, `--top-k`, `--reset`. ✓
- `EMBED_BATCH=100` and `DEFAULT_TOP_K=5` constants present and exported from `tier_1_naive.main`. ✓
- `OPENAI_API_KEY=None` guard fires with friendly red error + exit code 2 (verified via patched `get_settings`). ✓
- Single `CostTracker("tier-1")` instance threaded through `embed_batch` + `record_llm` + `tracker.persist()` (grep'd in main.py). ✓
- Latency via `time.monotonic()` printed as `Latency: X.XXs` footer line (grep'd). ✓
- Idempotent `--ingest` short-circuits when `collection.count() > 0 and not reset` (line 76-83 of main.py). ✓
- Imports from `shared.{config,loader,llm,display,cost_tracker}` and `tier_1_naive.{ingest,embed_openai,store,retrieve,prompt}` (grep'd). ✓
- Full non-live test suite passes (`pytest -q -m "not live"` → 61 passed, 2 skipped, 4 deselected). ✓
- `from tier_1_naive.main import main, cmd_ingest, cmd_query, EMBED_BATCH, DEFAULT_TOP_K, DEFAULT_QUERY` resolves cleanly. ✓
- `from tier_1_naive.prompt import build_prompt` resolves cleanly and produces expected sentinel-bracketed output. ✓
- Atomic per-task commits pushed (`4d2a9ca`, `7cd5da7`). ✓

## Issues Encountered

- **`uv run` blocked by sandbox cache permissions** — `uv` failed to open `~/.cache/uv/sdists-v8/.git` with `Operation not permitted`. Worked around by invoking the existing `.venv/bin/python` directly for all smoke tests and pytest runs. No functional impact: the `.venv` is already populated with the Plan 128-01 install set, so this only changes the invocation form, not the behavior under test.

## Known Stubs

None. main.py is fully wired (no placeholder data sources, no mock LLM responses, no hardcoded empty lists flowing to UI).

## Self-Check

**Files exist:**
- `tier-1-naive/prompt.py`: FOUND
- `tier-1-naive/main.py`: FOUND
- `tier_1_naive/__init__.py`: FOUND

**Commits exist (companion repo `rag-architecture-patterns`):**
- `4d2a9ca` (Task 1 — feat(128-04): add context-stuffed RAG prompt builder): FOUND
- `7cd5da7` (Task 2 — feat(128-04): add Tier 1 CLI orchestration): FOUND

**Status:** PASSED

## Next Phase Readiness

- Plan 128-05 (live end-to-end test + README finalization) is unblocked. The CLI demo target (`python tier-1-naive/main.py`) is ready to execute against the persisted Phase 127 dataset.
- No new external services required — `.env` from Plan 128-01 already has `OPENAI_API_KEY` (REQUIRED for Tier 1) and `GEMINI_API_KEY` slots wired.
- The `tier_1_naive` shim package is the canonical pattern future tier-N plans should reuse if they need cross-module imports.

---
*Phase: 128-tier-1-naive-rag*
*Plan: 04*
*Completed: 2026-04-26*
