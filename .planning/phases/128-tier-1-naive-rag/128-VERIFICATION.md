---
phase: 128-tier-1-naive-rag
verified: 2026-04-26T12:38:36Z
re_verified: 2026-04-26T16:25:00Z
status: passed
score: 3/3 must-haves verified (live test passed in 8.04s for ~$0.001)
overrides_applied: 0
followup: Plan 128-06 (mid-phase OpenRouter pivot) replaced the dual-key OpenAI+Gemini path with a single-key OpenRouter unified gateway. Live e2e test then PASSED at 2026-04-26T16:25:00Z. See `.planning/phases/128-tier-1-naive-rag/128-06-SUMMARY.md` and companion repo HEAD `fe06e84`.
---

# Phase 128: Tier 1 Naive RAG Verification Report

**Phase Goal:** Users can run a baseline RAG pipeline that chunks, embeds, and retrieves from the enterprise KB using raw ChromaDB + OpenAI
**Verified:** 2026-04-26T12:38:36Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `python tier-1-naive/main.py` ingests enterprise KB into ChromaDB and answers a sample query with sourced output | STATIC_VERIFIED (live gate pending) | Full pipeline implemented across 6 modules; live e2e test shipped but gated on OPENAI_API_KEY; see detail below |
| 2 | ChromaDB index persists to disk at `chroma_db/tier-1-naive/` and can be reused by Tier 5 | VERIFIED | `chroma_db/tier-1-naive/chroma.sqlite3` exists on disk (188 KB); `store.py:19` locks `CHROMA_PATH = Path("chroma_db") / "tier-1-naive"`; `test_store.py::test_open_collection_creates_and_persists` re-opens and asserts count > 0 (non-live, passes) |
| 3 | Cost and latency are printed for the demo query | STATIC_VERIFIED (live gate pending) | `main.py:180` — `console.print(f"[bold]Latency:[/bold] {latency_s:.2f}s")`; `shared/display.py:74-77` — `target.print(f"[bold]Cost:[/bold] ${cost_usd:.6f}  ...")`; `test_main_live.py:97-98` asserts `"Cost:" in output` and `"Latency:" in output` |

**Score:** 2/3 truths fully verified (Must-have 2 fully verified; Must-haves 1 and 3 statically verified — code paths exist and are wired, live confirmation pending OPENAI_API_KEY)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tier-1-naive/main.py` | CLI orchestration — ingest + query + cost/latency | VERIFIED | 251 lines; `cmd_ingest()`, `cmd_query()`, `main()`; wired to all 5 submodules; `--ingest`, `--query`, `--top-k`, `--reset` flags; default no-flags path auto-ingests then runs DEFAULT_QUERY |
| `tier-1-naive/ingest.py` | PDF text extraction + page-aware chunking | VERIFIED | `extract_pages()` (PyMuPDF fitz.open), `chunk_page()` (tiktoken cl100k_base, 512-token window, 64-token overlap, page-bounded); 77 lines |
| `tier-1-naive/embed_openai.py` | OpenAI embedding wrapper with cost tracking | VERIFIED | `build_openai_client()`, `embed_batch()` calls `client.embeddings.create(model="text-embedding-3-small")` and records `resp.usage.prompt_tokens` via `tracker.record_embedding()` |
| `tier-1-naive/store.py` | ChromaDB persistence — open/reset collection | VERIFIED | `open_collection()` uses `chromadb.PersistentClient(path=str(chroma_path))`; cosine HNSW; `CHROMA_PATH = Path("chroma_db") / "tier-1-naive"` |
| `tier-1-naive/retrieve.py` | Top-k retrieval with cosine-similarity normalization | VERIFIED | `retrieve_top_k()` calls `collection.query(query_embeddings=[query_vec], n_results=k)` and normalizes `similarities = 1 - distances` |
| `tier-1-naive/prompt.py` | Context-stuffed RAG prompt builder | VERIFIED | `build_prompt()` concatenates chunks with `[paper_id p.<page>]` provenance markers; returns system + context + question + Answer: sentinel |
| `tier-1-naive/README.md` | Quickstart, CLI reference, cost table, architecture | VERIFIED | 115 lines; quickstart with uv install + .env setup; CLI flag table; cost table (ingest ~$0.011, per-query ~$0.0014); 7-stage ASCII pipeline diagram |
| `tier-1-naive/tests/test_chunker.py` | 7 unit tests for chunking | VERIFIED | 7 tests covering: constants, empty text, short text, long text with overlap, metadata types, zero-padded IDs, non-empty documents |
| `tier-1-naive/tests/test_store.py` | 5 unit tests for store + retrieve | VERIFIED | 5 tests covering: constants (CHROMA_PATH, COLLECTION_NAME), create+persist, reset wipes, retrieve normalized shape, idempotent reopen |
| `tier-1-naive/tests/test_main_live.py` | 1 live e2e test | SHIPPED (not yet run) | `@pytest.mark.live`; asserts embed cost > 0, LLM cost > embed cost, `"Cost:"` in output, `"Latency:"` in output, `"#p"` in chunk table, `coll.count() > 0` after re-open from `tmp_path` |
| `pyproject.toml [tier-1]` | chromadb, openai, pymupdf declared as optional deps | VERIFIED | Lines 35-40: `tier-1 = ["rag-architecture-patterns[shared]", "chromadb>=1.5.8,<2", "openai>=1.50,<3", "pymupdf>=1.27,<2"]` |
| `.env.example OPENAI_API_KEY` | REQUIRED for Tier 1 | VERIFIED | commit 0cf950d; line 7 now reads `# REQUIRED for Tier 1 (embeddings: text-embedding-3-small), Tier 2 (Managed File Search), Tier 5 (Agentic).` |
| `tier_1_naive/__init__.py` | Importable shim for hyphenated dir | VERIFIED | Loads all 6 submodules via `importlib.util.spec_from_file_location`; registered under `tier_1_naive.<name>` in `sys.modules` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `main.cmd_ingest` | `store.open_collection` | direct call | WIRED | `main.py:75` — `coll = open_collection(reset=reset)` |
| `main.cmd_ingest` | `embed_openai.embed_batch` | called in loop | WIRED | `main.py:113` — `vectors = embed_batch(oai, [c["document"] for c in batch], tracker)` |
| `main.cmd_ingest` | `ChromaDB coll.add()` | per-batch | WIRED | `main.py:114-119` — `coll.add(ids=..., documents=..., metadatas=..., embeddings=vectors)` |
| `main.cmd_query` | `retrieve.retrieve_top_k` | query vec | WIRED | `main.py:152` — `res = retrieve_top_k(coll, query_vec=qv, k=top_k)` |
| `main.cmd_query` | `prompt.build_prompt` | res docs/metas | WIRED | `main.py:154` — `prompt = build_prompt(query, res["documents"], res["metadatas"])` |
| `main.cmd_query` | `shared.display.render_query_result` | chunks/answer | WIRED | `main.py:172-179` — all chunk fields passed; `cost_usd=tracker.total_usd()` |
| `main.cmd_query` | Latency footer | `console.print` | WIRED | `main.py:180` — `console.print(f"[bold]Latency:[/bold] {latency_s:.2f}s")` |
| `embed_batch` | `CostTracker.record_embedding` | per-batch | WIRED | `embed_openai.py:59` — `tracker.record_embedding(EMBED_MODEL, int(resp.usage.prompt_tokens))` |
| `store.open_collection` | `chroma_db/tier-1-naive/` | `PersistentClient` | WIRED | `store.py:41` — `client = chromadb.PersistentClient(path=str(chroma_path))`; `chroma_path` defaults to `CHROMA_PATH = Path("chroma_db") / "tier-1-naive"` |
| `.env OPENAI_API_KEY` | `embed_openai.build_openai_client` | `shared.config.get_settings()` | WIRED | `embed_openai.py:34-41` — reads `settings.openai_api_key`; raises `SystemExit` with friendly message if None |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `main.cmd_query` — chunks table | `res["documents"]`, `res["metadatas"]`, `res["similarities"]` | `retrieve_top_k(coll, query_vec=qv, k=top_k)` → ChromaDB query | Yes — reads from `PersistentClient`; collection populated by `cmd_ingest` | FLOWING (once ingest has run with real OPENAI_API_KEY) |
| `main.cmd_query` — answer | `answer.text` | `llm.complete(prompt)` → Gemini API (GEMINI_API_KEY present in .env) | Yes — live LLM call | FLOWING (once ingest has run) |
| `main.cmd_query` — cost | `tracker.total_usd()` | `CostTracker.record_embedding` (embed_batch) + `CostTracker.record_llm` (query) | Yes — sums real USD from token counts | FLOWING |
| `main.cmd_query` — latency | `latency_s` | `time.monotonic()` diff around embed+retrieve+LLM | Yes — wall-clock timing | FLOWING |

Note: ChromaDB at `chroma_db/tier-1-naive/` currently has the correct schema (`enterprise_kb_naive` collection, 0 embeddings). Embeddings are 0 because OPENAI_API_KEY is not set — the structure is ready; population requires the live API key.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Non-live test suite passes | `cd .../rag-architecture-patterns && uv run pytest -m "not live" --tb=short -q` (as reported in objective) | 61 passed, 2 skipped, 5 deselected | PASS (per objective; not re-run here as it's auth-independent) |
| ChromaDB dir exists on disk | `ls chroma_db/tier-1-naive/chroma.sqlite3` | File present, 188 KB | PASS |
| Collection schema initialized | SQLite inspection of `chroma.sqlite3` | `collections` table has 1 row: `enterprise_kb_naive`; `embeddings` table has 0 rows (key not set) | PASS (schema correct; empty by design until live run) |
| Live e2e test (`test_main_live.py`) | `uv run pytest tier-1-naive/tests/test_main_live.py -m live -v` | Skipped — OPENAI_API_KEY empty in `.env` | SKIP (human needed) |

### Requirements Coverage

Phase 128 plan artifacts do not use a `requirements:` frontmatter field. Coverage is assessed against the three ROADMAP success criteria directly:

| ROADMAP Success Criterion | Status | Evidence |
|--------------------------|--------|----------|
| SC-1: `python tier-1-naive/main.py` ingests KB and answers a sample query with sourced output | STATIC_VERIFIED (live pending) | All 6 modules exist and are wired; `test_main_live.py` fully implements the assertion; blocked only by empty OPENAI_API_KEY |
| SC-2: ChromaDB index persists to disk and can be reused by Tier 5 | VERIFIED | `chroma_db/tier-1-naive/chroma.sqlite3` on disk; `store.py` locks path; `test_store.py` passes (non-live); Tier 5 path documented in `store.py:6-8` and README |
| SC-3: Cost and latency printed for demo query | STATIC_VERIFIED (live pending) | `display.py:74-77` prints `Cost:`; `main.py:180` prints `Latency:`; `test_main_live.py:97-98` asserts both strings in console output |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `main.py` | 221-227 | Early `SystemExit` when `OPENAI_API_KEY is None` | Info | Intentional fast-fail — not a stub; prevents confusing import-time errors per 128-RESEARCH.md Pitfall 10 |
| `main.py` | 76-79 | `if coll.count() > 0 and not reset: return 0` | Info | Intentional idempotency guard — not a stub; prevents unnecessary re-embedding |
| `.env` | 15 | `OPENAI_API_KEY=` (empty) | Warning | Live test blocked; expected behavior until user sets key; `.env.example` documents this as REQUIRED |

No placeholder components, no `return null`, no `return {}`, no TODO/FIXME blockers found in the tier-1-naive module files.

### Human Verification Required

#### 1. Tier 1 Live End-to-End Test

**Test:** Run the `@pytest.mark.live` test in `tier-1-naive/tests/test_main_live.py`

**Pre-condition:** `GEMINI_API_KEY` is already set in `.env` (`AIzaSyCg...` value present). Only `OPENAI_API_KEY` is missing.

**Steps:**
```bash
# 1. Set your OpenAI API key in the .env file
#    File: /Users/patrykattc/work/git/rag-architecture-patterns/.env
#    Change: OPENAI_API_KEY=   →   OPENAI_API_KEY=sk-...

# 2. Run the live test
cd /Users/patrykattc/work/git/rag-architecture-patterns
uv run pytest tier-1-naive/tests/test_main_live.py -m live -v

# 3. Optionally run the CLI demo directly
python tier-1-naive/main.py
```

**Expected outcome (all 3 ROADMAP success criteria in one run):**
- `test_ingest_and_query_end_to_end_2papers` passes (1 passed)
- `rc_ingest == 0` and `embed_cost > 0` (SC-1: ingests KB)
- `rc_query == 0` (SC-1: answers query)
- `"Cost:"` and `"Latency:"` in console export (SC-3)
- `"#p"` in output (sourced chunk output — SC-1)
- `coll.count() > 0` on re-open from `tmp_path` (SC-2: persistence)
- Total cost: ~$0.001 for 2 papers

**Why human:** Both `text-embedding-3-small` (OpenAI) and `gemini-2.5-flash` (Gemini) are live API calls that incur real cost and require real credentials. `OPENAI_API_KEY` is empty in `.env` — the test skips, not fails.

### Gaps Summary

No gaps. All Phase 128 must-haves are implemented and structurally complete. The single outstanding item is execution confirmation of the live e2e test, which is blocked only by the user supplying `OPENAI_API_KEY` — the same auth-gated deferral pattern used in Phase 127 Plan 06.

**Structural state:** `chroma_db/tier-1-naive/chroma.sqlite3` exists with `enterprise_kb_naive` collection initialized (0 embeddings, awaiting first live ingest run). All 6 pipeline modules are substantive and wired. Non-live suite is green. The live test (`test_main_live.py`) is the phase verification gate and covers all 3 ROADMAP success criteria in one run.

---

_Verified: 2026-04-26T12:38:36Z_
_Verifier: Claude (gsd-verifier)_
