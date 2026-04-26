---
phase: 128-tier-1-naive-rag
plan: 02
subsystem: rag-ingestion
tags: [pymupdf, tiktoken, cl100k_base, chunking, page-aware, tdd]

# Dependency graph
requires:
  - phase: 128-01
    provides: "[tier-1] extras pinned (chromadb / openai / pymupdf) and OPENAI_API_KEY=REQUIRED in .env.example"
provides:
  - "tier_1_naive ingest module with extract_pages(pdf_path) -> list[(int, str)]"
  - "chunk_page(text, paper_id, page) producing 512-token windows with 64-token overlap and unique ids"
  - "Module-level constants ENC, CHUNK_TOKENS=512, OVERLAP_TOKENS=64 (locked contract)"
  - "Synthetic-fixture chunker test suite (7 tests) that runs without API keys"
affects: [128-03 embed-store, 128-04 cli-pipeline, 128-05 live-smoke, 129-tier-3, 130-tier-4]

# Tech tracking
tech-stack:
  added: [tiktoken (transitive via [shared]), PyMuPDF 1.27.2.3 import surface]
  patterns:
    - "Page-aware chunking — chunks NEVER cross page boundaries; (paper_id, page) provenance preserved"
    - "Deterministic chunk ids: {paper_id}_p{page:03d}_c{idx:03d} (zero-padded)"
    - "Library-only ingest module — Plan 04 owns the CLI surface"
    - "importlib-loaded test fixture for hyphenated package directory (tier-1-naive)"

key-files:
  created:
    - "../rag-architecture-patterns/tier-1-naive/__init__.py"
    - "../rag-architecture-patterns/tier-1-naive/ingest.py"
    - "../rag-architecture-patterns/tier-1-naive/tests/conftest.py"
    - "../rag-architecture-patterns/tier-1-naive/tests/test_chunker.py"
  modified: []

key-decisions:
  - "CHUNK_TOKENS=512 / OVERLAP_TOKENS=64 / stride=448 — locked from 128-RESEARCH.md Pitfall 1; do NOT tune without re-running benchmarks"
  - "Token boundary uses tiktoken.get_encoding('cl100k_base') — matches text-embedding-3-small (Plan 03 will reuse this)"
  - "extract_pages skips empty/whitespace pages — keeps citation tables clean"
  - "Off-by-one tail-window guard: when start + CHUNK_TOKENS >= len(tokens), stop emitting — text <= 512 tokens yields exactly 1 chunk"
  - "ingest.py is library-only (no __main__) — CLI surface deferred to Plan 04"
  - "Test imports ingest.py via importlib.util.spec_from_file_location because directory tier-1-naive (hyphen) cannot be imported as tier_1_naive (underscore)"
  - "Removed tier-1-naive/tests/__init__.py — pytest's rootdir importer raised ImportPathMismatchError when both repo-root tests/__init__.py and tier-1-naive/tests/__init__.py registered as 'tests' package"

patterns-established:
  - "Pattern: Token-window chunker with citation metadata (will be replicated for Tier 3 LightRAG and Tier 4 RAG-Anything)"
  - "Pattern: synthetic-fixture pytest tests for chunkers — no real PDFs in non-live tests (live tests in Plan 05)"
  - "Pattern: importlib-based test loader for hyphenated tier directories — avoids setuptools package manipulation"

# Metrics
duration: 4min
completed: 2026-04-26
---

# Phase 128 Plan 02: Page-Aware Chunker Summary

**PDF-to-chunks pipeline for Tier 1 — PyMuPDF page extraction + tiktoken cl100k_base 512/64 token-window chunking with deterministic citation metadata, shipped TDD-first with 7 synthetic-fixture unit tests.**

## Performance

- **Duration:** ~4 min (executor wall clock)
- **Started:** 2026-04-26T12:04:21Z
- **Completed:** 2026-04-26T12:08:00Z (approx)
- **Tasks:** 2 (RED, GREEN)
- **Files created:** 4 (ingest.py, test_chunker.py, conftest.py, __init__.py)
- **Files removed:** 1 (tier-1-naive/tests/__init__.py — Rule 3 deviation, see below)
- **Lines of code:** 76 (ingest.py) + 101 (test_chunker.py) = 177 LOC

## Accomplishments

- **TDD discipline maintained:** Task 1 RED commit landed with 7 failing tests (ImportError / AttributeError on missing ingest.py); Task 2 GREEN commit flipped all 7 to pass.
- **Locked contract enforced:** CHUNK_TOKENS=512, OVERLAP_TOKENS=64, id format `{paper_id}_p{page:03d}_c{idx:03d}`, metadata `{paper_id, page, chunk_idx}` — every test asserts on these directly.
- **Library-only surface:** `ingest.py` has zero `__main__` block (verified `grep -c "if __name__"` returns 0). Plan 04 owns the CLI.
- **No shared-layer regression:** full non-live suite went from 49→56 passed (+7 new chunker tests), 2 skipped (pre-existing live skips), 4 deselected.
- **Tier-1 deps installed:** `uv pip install -e ".[tier-1]"` ran for the first time in this repo; chromadb 1.5.8, openai 2.32.0, pymupdf 1.27.2.3, tiktoken 0.12.0 verified importable.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — failing chunker tests** — `318504d` (test)
2. **Task 2: GREEN — implement extract_pages + chunk_page** — `6ed7f1d` (feat; also includes Rule 3 cleanup of tests/__init__.py)

Both commits pushed to `origin/main` without rebase (Plan 128-03 had not yet pushed concurrent work at the time of execution).

## Files Created/Modified

- `tier-1-naive/__init__.py` — empty package marker (single docstring) so `tier-1-naive` is a directory-level Python package.
- `tier-1-naive/ingest.py` — `extract_pages(pdf_path)` and `chunk_page(text, paper_id, page)` plus `ENC`, `CHUNK_TOKENS`, `OVERLAP_TOKENS`, internal `_STRIDE=448`. PyMuPDF + tiktoken only; no API calls.
- `tier-1-naive/tests/conftest.py` — placeholder docstring (no fixtures yet; Plan 05 adds `live_keys_ok`).
- `tier-1-naive/tests/test_chunker.py` — 7 unit tests: constants, empty-text, short-text, long-text + multi-chunk overlap + id uniqueness, metadata types, zero-padded ids, non-empty decoded text. Tests load `ingest.py` via `importlib.util.spec_from_file_location` and pin under `_tier1_ingest`.

## Decisions Made

1. **importlib loader for hyphenated tier directory.** The on-disk directory is `tier-1-naive` (hyphen). Python identifiers cannot contain hyphens, so `from tier_1_naive.ingest import ...` would fail with `ModuleNotFoundError` regardless of whether `ingest.py` exists. The plan's documented fallback (importlib + `spec_from_file_location`) was used. The test file itself documents this strategy in its module docstring.
2. **Tier-local conftest kept, but tests/__init__.py removed.** Pytest's default `prepend` import mode walks each `tests/` directory and registers `__init__.py` as the `tests` package. With both `<repo>/tests/__init__.py` (existing) and `<repo>/tier-1-naive/tests/__init__.py` (newly added) present, pytest raised `ImportPathMismatchError` collecting the second as `tests.conftest`. Dropping the marker (this plan) is the minimal fix and is safe because `test_chunker.py` does not perform package-relative imports.
3. **Constants kept module-level, not factory-injected.** The plan's locked contract requires `CHUNK_TOKENS` and `OVERLAP_TOKENS` to be importable as module attributes (the test asserts on them as-imported). No DI / factory was added.
4. **PyMuPDF page numbers are 1-indexed in output.** `extract_pages` increments `i + 1` so the first page is `(1, "...")`, matching academic citation convention and the chunk-id format `_p{page:03d}_c...`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Removed `tier-1-naive/tests/__init__.py` to unblock pytest collection**

- **Found during:** Task 2 (GREEN — full non-live suite run after `ingest.py` landed)
- **Issue:** With `tests/__init__.py` (repo-root) and `tier-1-naive/tests/__init__.py` (newly added in Task 1) both present, pytest's default rootdir importer raised `_pytest.pathlib.ImportPathMismatchError: ('tests.conftest', '<repo>/tests/conftest.py', PosixPath('<repo>/tier-1-naive/tests/conftest.py'))` and aborted the entire collection. The plan instructed adding the second `__init__.py` "so absolute imports work", but `test_chunker.py` actually loads `ingest.py` via `importlib.util` — no package-relative imports are made, so the marker was unnecessary.
- **Fix:** `git rm tier-1-naive/tests/__init__.py` and committed the deletion as part of the GREEN commit (one logical change: "make the chunker work end-to-end").
- **Files modified:** removed `tier-1-naive/tests/__init__.py`
- **Verification:** `uv run pytest -q -m "not live"` → 56 passed, 2 skipped, 4 deselected (was failing with collection error before the fix).
- **Committed in:** `6ed7f1d` (alongside `ingest.py`)

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** Minor cleanup-on-the-way; the plan's `tests/__init__.py` instruction was based on an outdated assumption about pytest discovery. The contract (constants, function signatures, test assertions) is unchanged.

## Issues Encountered

- **uv cache write blocked by sandbox.** Default `~/.cache/uv` is denied in this environment. Resolved by exporting `UV_CACHE_DIR="$TMPDIR/uv-cache"` for both the initial `uv pip install -e ".[tier-1]"` (which finally landed chromadb/openai/pymupdf into the venv) and every subsequent `uv run pytest` invocation. No effect on the committed artifacts.
- **PyMuPDF SwigPyPacked DeprecationWarning** appears on first import (5 warnings total across the chunker run). Upstream issue in PyMuPDF 1.27.2.3 / SWIG; safe to ignore — does not affect functionality and is not from our code.

## Next Phase Readiness

- **Plan 128-03 (embed/store) unblocked.** `chunk_page` returns the dict shape `{id, document, metadata}` that ChromaDB's `collection.add(ids=..., documents=..., metadatas=...)` expects via destructuring. The OpenAI embedder Plan 03 builds will consume `chunks[i]["document"]` and pass `chunks[i]["id"]` / `chunks[i]["metadata"]` straight through.
- **Plan 128-04 (CLI) unblocked for the ingest path.** `extract_pages` + `chunk_page` are pure functions with no side effects, so the CLI just iterates `for paper_id, pdf_path in dataset: for page, text in extract_pages(pdf_path): for chunk in chunk_page(text, paper_id, page): ...`.
- **Plan 128-05 (live smoke) unblocked for ingestion.** Real-PDF behavior is deferred to that plan; today's contract is satisfied by synthetic strings.
- **No blockers identified for downstream plans.** Token boundary contract (`cl100k_base`) is shared with the OpenAI embedder Plan 03 will instantiate.

## Self-Check: PASSED

Files verified present:
- FOUND: tier-1-naive/__init__.py
- FOUND: tier-1-naive/ingest.py
- FOUND: tier-1-naive/tests/conftest.py
- FOUND: tier-1-naive/tests/test_chunker.py
- INTENTIONALLY ABSENT: tier-1-naive/tests/__init__.py (Rule 3 deviation)

Commits verified present in `origin/main`:
- FOUND: 318504d test(128-02): add failing chunker tests for tier-1 ingest
- FOUND: 6ed7f1d feat(128-02): implement page-aware chunker for tier-1 ingest

Verification command outputs (last 5 lines from final pytest run):
```
7 passed, 5 warnings in 0.13s
```

Module-level export check:
```
CHUNK_TOKENS= 512 OVERLAP_TOKENS= 64
Has extract_pages: True
Has chunk_page: True
```

## TDD Gate Compliance

- **RED gate:** `test(128-02): add failing chunker tests for tier-1 ingest` (commit `318504d`) — 7/7 failing.
- **GREEN gate:** `feat(128-02): implement page-aware chunker for tier-1 ingest` (commit `6ed7f1d`) — 7/7 passing, full non-live suite passing.
- **REFACTOR gate:** not needed; implementation is the minimal viable form (no premature optimization, off-by-one tail-window guard is correctness, not performance).

Both required gates present in git log; ordering is RED-then-GREEN.

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes at trust boundaries. `extract_pages` reads a local PDF path that callers supply; `chunk_page` is pure-Python over an in-memory string and tokenizer. The PDF read surface itself is not new (PyMuPDF was already pinned and used in `scripts/extract_figures.py` from Phase 127 Plan 05).

---
*Phase: 128-tier-1-naive-rag*
*Completed: 2026-04-26*
