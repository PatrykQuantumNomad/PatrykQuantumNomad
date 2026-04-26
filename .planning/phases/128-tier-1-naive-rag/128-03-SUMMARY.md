---
phase: 128-tier-1-naive-rag
plan: 03
subsystem: rag-embed-store-retrieve
tags: [openai, chromadb, embeddings, persistent-client, cosine-hnsw, cost-tracking]

# Dependency graph
requires:
  - phase: 128-01
    provides: "[tier-1] extras (chromadb 1.5.8, openai 2.32.0) and OPENAI_API_KEY=REQUIRED"
  - phase: 128-02
    provides: "tier-1-naive package skeleton (__init__.py, conftest.py) — no tier-1-naive/tests/__init__.py"
provides:
  - "build_openai_client() factory — SystemExit guard for missing OPENAI_API_KEY (Pitfall 10)"
  - "embed_batch(client, texts, tracker) — single OpenAI request, records cost via tracker.record_embedding (Pitfall 5)"
  - "EMBED_MODEL='text-embedding-3-small', EMBED_DIMS=1536 (locked constants)"
  - "open_collection(reset, path=None) — chromadb PersistentClient at chroma_db/tier-1-naive/, cosine HNSW config at first creation only (Pitfall 4)"
  - "CHROMA_PATH and COLLECTION_NAME='enterprise_kb_naive' constants"
  - "retrieve_top_k(coll, query_vec, k) — normalized result dict {documents, metadatas, distances, similarities} with similarities = 1 - distances (Pitfall 2)"
affects: [128-04 cli-pipeline, 128-05 live-smoke, 130-tier-4 (path convention), 130-tier-5 (reads chroma_db/tier-1-naive/)]

# Tech tracking
tech-stack:
  added: []  # No new pinned deps — Plan 01 already added chromadb + openai
  patterns:
    - "Pre-computed embeddings (NOT OpenAIEmbeddingFunction) — every API call passes through CostTracker for auditability (Pitfall 5)"
    - "Cosine distance -> similarity normalization in retrieve_top_k (1 - d) — UI never sees raw distances"
    - "PersistentClient with cosine HNSW configured via configuration={hnsw:{space:cosine}} dict (1.x shape — re-passing on existing collections is silently ignored, Pitfall 4)"
    - "tier-local module ownership — embed_openai.py / store.py / retrieve.py are the ONLY surface that touches OpenAI / disk; CLI in Plan 04 is pure orchestration glue"
    - "importlib loader pattern for hyphenated package dir — test_store.py mirrors test_chunker.py from Plan 02"

key-files:
  created:
    - "../rag-architecture-patterns/tier-1-naive/embed_openai.py"
    - "../rag-architecture-patterns/tier-1-naive/store.py"
    - "../rag-architecture-patterns/tier-1-naive/retrieve.py"
    - "../rag-architecture-patterns/tier-1-naive/tests/test_store.py"
  modified: []

key-decisions:
  - "EMBED_MODEL locked to text-embedding-3-small (1536d default; do NOT pass dimensions= to keep cl100k_base default tokenizer compatibility with Plan 02 chunker)"
  - "build_openai_client raises SystemExit (not RuntimeError) — exits cleanly without stack trace at the user level (Pitfall 10)"
  - "embed_batch does ONE API request per call — caller batches <=100 texts (Pitfall 6); CLI in Plan 04 enforces"
  - "Cosine HNSW configured ONLY at first creation (Pitfall 4: get_or_create_collection silently ignores re-passed metadata in 1.x); use reset=True to change index params"
  - "delete_collection wrapped in try/except — reset=True is idempotent on fresh paths"
  - "retrieve_top_k indexes [0] of batched query() result — single-query pattern (k results, not k*N)"
  - "test_store.py uses importlib.util loader (mirrors test_chunker.py from Plan 02) — direct `from tier_1_naive.* import *` does NOT work because dir is `tier-1-naive` (hyphens not valid Python identifiers); plan's verbatim test code edited to use this loader pattern"
  - "shared/embeddings.py NOT touched — Gemini-only contract from Phase 127 preserved (smoke test depends on it)"

patterns-established:
  - "Pattern: tier-local thin wrappers around external SDKs with cost tracking baked in — replicated for Tier 3 (LightRAG) and Tier 4 (RAG-Anything) embed/store layers"
  - "Pattern: distance->similarity conversion at the retrieve layer (display.render_query_result expects similarity-shaped scores)"
  - "Pattern: chroma_db/{tier-name}/ path convention — Tier 5 will read from chroma_db/tier-1-naive/ but write to chroma_db/tier-5-agentic/ (Pitfall 8)"

# Metrics
duration: ~2.5min
completed: 2026-04-26
---

# Phase 128 Plan 03: OpenAI Embeddings + ChromaDB Store + Retrieval Summary

**Three Tier-1-local modules — embed_openai.py (OpenAI client + cost-tracked embed_batch), store.py (PersistentClient with cosine HNSW), retrieve.py (top-k with distance-to-similarity normalization) — plus a 5-test non-live store suite using a tmp_path PersistentClient and synthetic 1536-dim vectors. No OpenAI API calls; no shared/embeddings.py modification.**

## Performance

- **Duration:** ~2.5 min (executor wall clock)
- **Started:** 2026-04-26T12:12:07Z
- **Completed:** 2026-04-26T12:14:34Z
- **Tasks:** 2 (atomic commits per task)
- **Files created:** 4 (embed_openai.py, store.py, retrieve.py, test_store.py)
- **Lines of code:** 60 (embed_openai.py) + 50 (store.py) + 47 (retrieve.py) + 144 (test_store.py) = 301 LOC

## Accomplishments

- **All four locked contracts shipped:**
  - `embed_openai.build_openai_client()` returns `openai.OpenAI` from `shared.config.get_settings().openai_api_key.get_secret_value()`; raises `SystemExit("OPENAI_API_KEY required for Tier 1 (embeddings). Copy .env.example to .env...")` when the key is None — verified via direct loader-based test (Pitfall 10).
  - `embed_openai.embed_batch(client, texts, tracker)` does exactly one `client.embeddings.create(model="text-embedding-3-small", input=texts)` call, records `tracker.record_embedding("text-embedding-3-small", resp.usage.prompt_tokens)`, returns `list[list[float]]` of length `len(texts)` — verified end-to-end with a fake client returning 2x 1536-dim vectors and `usage.prompt_tokens=42` (Pitfall 5).
  - `store.open_collection(reset, path=None)` returns a chromadb collection at `chroma_db/tier-1-naive/` (or override path), passes `configuration={"hnsw": {"space": "cosine"}}` at first creation, and is idempotent across re-opens — verified by 4 of the 5 test_store.py tests.
  - `retrieve.retrieve_top_k(coll, query_vec, k)` returns `{documents, metadatas, distances, similarities}` with `similarities = 1 - distances` — verified for 5-vector synthetic collection: query-vec-equals-stored case yields distance ≤ 1e-3 and similarity ≥ 1.0 - 1e-3 (Pitfall 2).
- **Cost tracking auditable end-to-end:** `embed_batch` writes through to `CostTracker.record_embedding`, which looks up `text-embedding-3-small` price ($0.02/1M tokens) and records USD per call. Pitfall 5 honored — no hidden ChromaDB-internal embeddings.
- **Test suite expanded cleanly:** non-live count went 56 → 61 (+5 store tests). 2 skipped (pre-existing live skips), 4 deselected (live marker), 0 regressions.
- **shared/embeddings.py untouched:** `git log --oneline -1 -- shared/embeddings.py` shows last touch is `d766773 feat(127-02)` from Phase 127. Gemini-only contract preserved; smoke test still green.
- **Atomic commits per task pushed to origin/main:**
  - Task 1 — `f9c7e16 feat(128-03): add OpenAI embedding wrapper with cost tracking`
  - Task 2 — `70a59cc feat(128-03): add ChromaDB store + retrieve helpers with non-live tests`

## Task Commits

| Task | Name                                                          | Commit    | Files                                                  |
| ---- | ------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| 1    | embed_openai.py — OpenAI client + cost-tracked embed_batch    | `f9c7e16` | `tier-1-naive/embed_openai.py`                         |
| 2    | store.py + retrieve.py + 5 non-live store tests               | `70a59cc` | `tier-1-naive/store.py`, `tier-1-naive/retrieve.py`, `tier-1-naive/tests/test_store.py` |

## Versions Verified

- `chromadb`: **1.5.8** — confirmed by `python -c "import chromadb; print(chromadb.__version__)"`. Matches Plan 01 pin (`chromadb>=1.5.8,<2`). 1.x `configuration={"hnsw": {...}}` shape used per 128-RESEARCH.md (Pitfall 4: legacy `metadata={"hnsw:space": "cosine"}` is silently ignored on existing collections in 1.x).
- `openai`: **2.32.0** — confirmed by `python -c "import openai; print(openai.__version__)"`. Matches Plan 01 pin (`openai>=1.50,<3`). `client.embeddings.create(...).usage.prompt_tokens` is reliable for embeddings on 2.x.
- 1536-dim assertion: 5 store tests use `_synthetic_vec(seed, dim=1536)` with deterministic `random.Random(seed)` ; collection `add(embeddings=...)` accepts the synthetic vectors without dimension errors and round-trips them through `query()`.

## Test Summary

**Final non-live test count: 61 passed, 2 skipped, 4 deselected.**

Breakdown:
- 5 store tests (this plan): `test_constants_match_research_decision`, `test_open_collection_creates_and_persists`, `test_open_collection_reset_wipes`, `test_retrieve_top_k_returns_normalized_shape`, `test_open_collection_idempotent_reopen`
- 7 chunker tests (Plan 02)
- 49 shared / curation / smoke tests (carried from prior phases; unchanged)

Run command: `cd ../rag-architecture-patterns && uv run pytest -q -m "not live"` → `61 passed, 2 skipped, 4 deselected`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Plan's verify-step Python imports use `from tier_1_naive.X import ...` which the package layout cannot support**

- **Found during:** Task 1 (smoke-import verify step)
- **Issue:** The on-disk directory is `tier-1-naive/` (hyphenated), which is not a valid Python identifier. `from tier_1_naive.embed_openai import ...` raises `ModuleNotFoundError`. Plan 02 hit the same blocker and resolved it via `importlib.util.spec_from_file_location` in `test_chunker.py`.
- **Fix:** (a) Replaced the plan's `python -c "from tier_1_naive.embed_openai import ..."` smoke-import with an `importlib.util.spec_from_file_location` loader-based import for verification (verbatim contracts still confirmed: `EMBED_MODEL == 'text-embedding-3-small'`, `EMBED_DIMS == 1536`). (b) Rewrote `test_store.py` to use the same `importlib.util` pattern as `test_chunker.py` (loading `store.py` and `retrieve.py` under synthetic names `_tier1_store` and `_tier1_retrieve`) — the plan's verbatim test code used `from tier_1_naive.store import ...` which would have failed at collection. Both store and retrieve modules themselves remain untouched and import cleanly under the loader.
- **Files modified:** `tier-1-naive/tests/test_store.py` (loader pattern instead of direct package import)
- **Commit:** Captured in Task 2 commit `70a59cc`.

**2. [Rule 2 - Auto-added critical functionality] Augmented automated verify with embed_batch CostTracker round-trip check**

- **Found during:** Task 1 (verify step)
- **Issue:** Plan 1's automated verify only `grep`s for `tracker.record_embedding` but does not exercise the call path; without a live OpenAI key, no test exercises the cost-recording behavior in this plan (Plan 05 does it live).
- **Fix:** Added an inline manual verify step (NOT a committed test — keeps this plan non-live) using a fake client returning `usage.prompt_tokens=42` and 2x 1536-dim vectors. Confirmed `tracker.queries[0]` shape: `{model: 'text-embedding-3-small', kind: 'embedding', input_tokens: 42, output_tokens: 0, usd: 8.4e-07}`. This is a non-committed verification — the live behavior is exercised end-to-end in Plan 05.
- **Files modified:** None (manual one-shot verify; no test artifact committed)
- **Commit:** N/A (verification-only)

### Uncommitted Working Tree Changes (Pre-existing, Out of Scope)

- `dataset/manifests/metadata.json` — pre-existing modified state in companion repo at start of plan (last modified before plan start). Per Scope Boundary rule, left untouched. Not staged in either Task 1 or Task 2 commits.

## Pitfalls Honored

| Pitfall | Description                                                            | Where it lives in this plan                                         |
| ------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2       | ChromaDB returns *distance* not similarity                             | `retrieve.py` — `sims = [1.0 - d for d in dists]`                   |
| 4       | `get_or_create_collection` metadata silently ignored on existing colls | `store.py` — `configuration={"hnsw": {"space": "cosine"}}` at create only; `reset=True` for changes |
| 5       | Hidden cost via `OpenAIEmbeddingFunction`                              | `embed_openai.py` — pre-compute + `tracker.record_embedding`        |
| 6       | OpenAI batch limits                                                    | `embed_batch` does ONE request per call; CLI in Plan 04 batches     |
| 8       | Tier collection collisions on shared chroma_db path                    | `store.py` — `CHROMA_PATH = Path("chroma_db") / "tier-1-naive"`     |
| 10      | `OPENAI_API_KEY` may be None                                           | `embed_openai.build_openai_client` — `SystemExit` with friendly msg |

## What's Next

- **Plan 04 (cli-pipeline):** wires `embed_openai.embed_batch` + `store.open_collection` + `retrieve.retrieve_top_k` into the `tier-1-naive/cli.py` ingest/query commands; enforces <=100-text batches per Pitfall 6.
- **Plan 05 (live-smoke):** end-to-end test with real OpenAI calls + small PDF corpus + assertions on cost tracker totals and chunk citation shape.

## Self-Check: PASSED

Verifications run after writing this SUMMARY:

1. **Created files exist:**
   - `../rag-architecture-patterns/tier-1-naive/embed_openai.py` — FOUND (60 lines)
   - `../rag-architecture-patterns/tier-1-naive/store.py` — FOUND (50 lines)
   - `../rag-architecture-patterns/tier-1-naive/retrieve.py` — FOUND (47 lines)
   - `../rag-architecture-patterns/tier-1-naive/tests/test_store.py` — FOUND (144 lines)

2. **Commits exist (companion repo):**
   - `f9c7e16` (Task 1) — FOUND in `git log --oneline -5`
   - `70a59cc` (Task 2) — FOUND in `git log --oneline -5`
   - Both pushed to `origin/main`

3. **Test suite green:**
   - `uv run pytest -q -m "not live"` → 61 passed, 2 skipped, 4 deselected — VERIFIED
   - `uv run pytest tier-1-naive/tests/test_store.py -v` → 5 passed — VERIFIED

4. **Negative invariants:**
   - `git log --oneline -1 -- shared/embeddings.py` → `d766773 feat(127-02)` (NOT touched by 128-03) — VERIFIED
   - No accidental file deletions in either Task commit (`git diff --diff-filter=D --name-only HEAD~1 HEAD` empty) — VERIFIED
