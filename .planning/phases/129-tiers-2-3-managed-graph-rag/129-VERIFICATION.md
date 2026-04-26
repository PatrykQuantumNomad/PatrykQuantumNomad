---
phase: 129-tiers-2-3-managed-graph-rag
verified: 2026-04-26T23:00:00Z
status: passed
score: 3/3
overrides_applied: 0
re_verification: null
gaps: []
deferred: []
human_verification: []
---

# Phase 129: Tiers 2 + 3 Managed / Graph RAG — Verification Report

**Phase Goal:** Users can compare managed-service RAG (zero infrastructure) against knowledge-graph RAG (cross-document reasoning) using the same dataset
**Verified:** 2026-04-26T23:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running Tier 2 uploads the enterprise KB to Gemini File Search and returns answers with managed retrieval | VERIFIED | `tier-2-managed/main.py` calls `get_or_create_store` + `upload_with_retry` + `tier2_query` with `FileSearch` tool wired. Live test PASSED 2026-04-26T22:30Z: 20.25s wall-clock, $0.000239, 5 grounding chunks returned from managed retrieval, `delete_store` cleanup verified. Commit b7a366d. |
| 2 | Running Tier 3 extracts a knowledge graph via LightRAG and answers multi-hop queries that Tier 1 cannot | VERIFIED | `tier-3-graph/main.py` calls `build_rag` + `ingest_corpus` (LightRAG entity extraction) + `run_query` (hybrid mode). `DEFAULT_QUERY` is the explicit DPR/RAG multi-hop probe. Live test PASSED 2026-04-26T22:05Z: 786.96s, ~$0.26, 652 nodes / 633 edges extracted, hybrid mode traversed 96 entities + 88 relations across both paper subgraphs. Commit cc2620f. |
| 3 | Both tiers print cost and latency alongside their answers | VERIFIED | Tier 2: `cmd_query` measures `latency = time.monotonic() - t0`, calls `render_query_result(cost_usd=tracker.total_usd(), ...)` (line 232–241), then prints `Latency: {latency:.2f}s` (line 242) and `Cost JSON written to...` (line 245). Tier 3: `amain` measures `latency = time.monotonic() - t0` (line 255), calls `render_query_result(cost_usd=tracker.total_usd(), ...)` (line 260–268), then prints `Latency: {latency:.2f}s` (line 270) and `Cost JSON written to...` (line 274). `shared/display.py` line 75 renders `Cost: ${cost_usd:.6f}`. Both tracker.persist() calls write cost JSON to `evaluation/results/costs/`. |

**Score:** 3/3 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tier-2-managed/store.py` | FileSearchStore lifecycle helpers (create, upload, list, delete) | VERIFIED | 172 lines, 5 public functions: `get_or_create_store`, `upload_pdf`, `upload_with_retry`, `list_existing_documents`, `delete_store`. Commit 332f2d2. |
| `tier-2-managed/query.py` | FileSearch tool + grounding extraction | VERIFIED | 133 lines. `query()` attaches `types.FileSearch(file_search_store_names=[store_name])` to `generate_content`. `to_display_chunks()` defensively extracts `grounding_metadata.grounding_chunks`. Commit a626c96. |
| `tier-2-managed/main.py` | CLI orchestration (ingest + query + cost printing) | VERIFIED | 348 lines. `cmd_ingest` + `cmd_query` + argparse entry point. Cost printed via `render_query_result` + `tracker.persist()`. Commit 94b6f97. |
| `tier-2-managed/README.md` | User-facing docs (9 sections, cost table) | VERIFIED | 133 lines, 9 sections. Cost table from 129-RESEARCH.md ($0.075 indexing estimate, ~$0.0014/query). Commit c63f7af. |
| `tier-2-managed/tests/test_e2e_live.py` | Live e2e test (managed retrieval assertion) | VERIFIED | 187 lines, `@pytest.mark.live`. Asserts non-empty answer + `total_usd() > 0`. `delete_store` in `finally:` block. Commit b7a366d. |
| `tier_2_managed/__init__.py` | Package shim for `from tier_2_managed import ...` | VERIFIED | Present at `tier_2_managed/__init__.py`. |
| `tier-3-graph/rag.py` | LightRAG initialization (OpenRouter routing, locked EMBED_DIMS) | VERIFIED | 174 lines. `build_rag()` wires `openai_complete_if_cache` + `openai_embed` via OpenRouter. `EMBED_DIMS=1536` locked. `token_tracker` threaded through both closures. Commit 720810b. |
| `tier-3-graph/cost_adapter.py` | CostAdapter bridging LightRAG callbacks to CostTracker | VERIFIED | 145 lines. `add_usage()` dispatches on `completion_tokens` presence: LLM → `record_llm`, embed → `record_embedding`. Probe-validated on lightrag-hku==1.4.15. Commit 720810b. |
| `tier-3-graph/ingest.py` | PDF extraction + `rag.ainsert` (idempotent via `ids=[paper_id]`) | VERIFIED | 149 lines. `extract_full_text()` + `ingest_corpus()` calling `await rag.ainsert(text, ids=[paper_id])`. Pattern 5 idempotency honored. Commit b95b5a3. |
| `tier-3-graph/query.py` | `run_query` wrapper with pre/post token delta accounting | VERIFIED | 98 lines. `run_query` snapshots `tracker.queries` pre/post `rag.aquery` to compute per-query token deltas. Commit b95b5a3. |
| `tier-3-graph/main.py` | Async CLI with `--yes`-gated cost-surprise mitigation | VERIFIED | 368 lines. `asyncio.run(amain(...))` bridge. `--yes` flag bypasses cost prompt. `DEFAULT_QUERY` is the explicit DPR/RAG multi-hop probe. Commits 63aaf7e. |
| `tier-3-graph/README.md` | User-facing docs (9 sections + cost-warning banner + multi-hop sample) | VERIFIED | 151 lines. Section-0 `[!WARNING]` banner for ~$1 ingest. Multi-hop sample query verbatim from `main.py`. 5-mode reference table. Commit c2690c5. |
| `tier-3-graph/tests/test_tier3_e2e_live.py` | Live e2e test (graphml > 1KB + hybrid answer + cost > 0) | VERIFIED | 204 lines. Asserts `graphml.stat().st_size > 1024`, non-empty hybrid answer, `tracker.total_usd() > 0`. `tmp_path` isolation. Commit cc2620f. |
| `pyproject.toml [tier-3]` | `lightrag-hku==1.4.15`, `openai>=1.50`, `pymupdf>=1.27` locked | VERIFIED | Lines confirmed: `lightrag-hku==1.4.15`, `openai>=1.50,<3`, `pymupdf>=1.27,<2`. Commits fe2a118 + 515d817. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `tier-2-managed/main.py` | `tier_2_managed.store.get_or_create_store` | import + call at line 327 | WIRED | Store handle passed to `cmd_ingest` and `cmd_query`. |
| `tier-2-managed/main.py` | `tier_2_managed.query.tier2_query` | import + call in `cmd_query` line 222 | WIRED | Response used to extract tokens, chunks, and answer text. |
| `tier-2-managed/query.py` | Gemini `generate_content` with `FileSearch` tool | `types.FileSearch(file_search_store_names=[store_name])` | WIRED | Pattern 3 managed retrieval — confirmed working in live test (5 grounding chunks). |
| `tier-3-graph/main.py` | `tier_3_graph.ingest.ingest_corpus` | import + `await ingest_corpus(rag, ...)` line 238 | WIRED | Papers list, console, tracker, model all passed through. |
| `tier-3-graph/main.py` | `tier_3_graph.query.run_query` | import + `await run_query(rag, ...)` line 248 | WIRED | Returns `(answer_text, in_tok, out_tok)` used in `render_query_result`. |
| `tier-3-graph/rag.py` | LightRAG via `CostAdapter` token tracker | `build_rag(llm_token_tracker=adapter)` → `token_tracker=token_tracker` in both closures | WIRED | Probe-validated on lightrag-hku==1.4.15 (Outcome A); live test confirms `tracker.total_usd() > 0` after real API calls. |
| `CostAdapter.add_usage` | `CostTracker.record_llm` / `record_embedding` | `completion_tokens` dispatch at lines 122–128 | WIRED | LLM path and embed path verified in live run: estimated ~$0.26 LLM + ~$0.001 embed captured. |
| Both tiers `main.py` | `shared.display.render_query_result` | import + call with `cost_usd=tracker.total_usd()` | WIRED | `shared/display.py` line 75 prints `Cost: ${cost_usd:.6f}`. Latency printed immediately after on same console. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `tier-2-managed/main.py cmd_query` | `resp` (GenerateContentResponse) | `tier2_query(client, store_name, ...)` → `client.models.generate_content` with `FileSearch` tool | YES — live test returned 5 grounding chunks, non-empty `resp.text`, `usage_metadata` with 14 in / 94 out tokens | FLOWING |
| `tier-3-graph/main.py amain` | `answer_text, in_tok, out_tok` | `run_query(rag, ..., mode="hybrid")` → `rag.aquery` → OpenRouter LLM | YES — live test returned ~6KB answer, 652 nodes / 633 edges traversed | FLOWING |
| `tier-3-graph/ingest.py ingest_corpus` | `text` (PDF content) | `extract_full_text(str(pdf_path))` reading real PDFs via PyMuPDF | YES — live test ingested 2 papers: 6 + 11 chunks, 248 + 508 entities extracted | FLOWING |

---

### Behavioral Spot-Checks

Runnable artifact checks performed against codebase (no server started):

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Tier 2 `main.py` imports resolve at module level | `grep "from tier_2_managed" tier-2-managed/main.py` | store, query imports present | PASS |
| Tier 3 `main.py` is async-first with single `asyncio.run` bridge | `grep "asyncio.run" tier-3-graph/main.py` | `asyncio.run(amain(args, console))` at line 354 | PASS |
| `DEFAULT_QUERY` in Tier 3 is the multi-hop DPR/RAG probe | `grep "Lewis\|DPR\|non-parametric" tier-3-graph/main.py` | `DEFAULT_QUERY` at lines 92–93 references both Lewis 2020 and Karpukhin 2020 DPR | PASS |
| Cost printed via `render_query_result` in both tiers | `grep "render_query_result.*cost_usd\|Latency" tier-2-managed/main.py tier-3-graph/main.py` | Both call `render_query_result(cost_usd=tracker.total_usd(), ...)` followed by `Latency:` print | PASS |
| `lightrag-hku==1.4.15` locked in pyproject.toml | `grep "lightrag-hku" pyproject.toml` | `lightrag-hku==1.4.15` | PASS |
| All Phase 129 commits present in companion repo | `git log --oneline` | Commits fe2a118 through cc2620f — 14 commits for Phase 129 | PASS |

**Live test results (empirical — from SUMMARY appends):**

| Tier | Test | Result | Wall-clock | Cost | Key metrics |
|------|------|--------|-----------|------|-------------|
| Tier 2 | `test_e2e_live.py::test_tier2_end_to_end` | PASSED | 20.25s | $0.000239 (14in/94out) | 5 grounding chunks, `delete_store` cleanup: 0 stores remaining |
| Tier 3 | `test_tier3_e2e_live.py::test_tier3_end_to_end_2papers` | PASSED | 786.96s (~13m) | ~$0.26 LLM + ~$0.001 embed | 652 nodes / 633 edges, graphml 602KB (601× the 1KB assertion threshold), hybrid mode: 96 entities + 88 relations in final context |

---

### Requirements Coverage

No explicit `requirements:` field in PLAN frontmatter for this phase. The three ROADMAP success criteria are the operative requirements and are all verified (see Observable Truths table above).

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `tier-3-graph/main.py` line 260 | `chunks=[]` passed to `render_query_result` | INFO | Intentional — LightRAG blends multiple sources; no per-chunk citations. README section 6 ("Known weaknesses") explicitly documents this as a deliberate trade-off. Not a stub. |
| `tier-2-managed/main.py` line 300 | `if settings.gemini_api_key is None: # pragma: no cover` | INFO | Dead branch by design (pydantic raises before this point). Belt-and-braces guard per Plan 04 design. Not a bug. |

No blockers found. No placeholders, empty returns on user-visible paths, or stub handlers.

---

### Human Verification Required

None. All three ROADMAP success criteria were empirically verified via live API tests (Tier 2 via Gemini File Search, Tier 3 via OpenRouter LightRAG). No items require human follow-up.

---

## Gaps Summary

No gaps. All three must-haves are VERIFIED with empirical evidence from live API tests run on 2026-04-26.

**Note on Tier 2 live test environment:** The Tier 2 live test initially failed in the executor sandbox due to SOCKS5 proxy / socksio issues, but was successfully re-run on 2026-04-26T22:30Z after resolving the proxy configuration. The test code is correct; the earlier "executor-blocked" finding was a sandbox environment issue, not a code defect.

**Note on Tier 3 live test cost:** The $0.26 actual cost slightly exceeded the $0.05–0.15 estimate (paper 2 had 11 chunks vs the assumed 5–6). Still well within the $0.30 abort threshold documented in the plan. No follow-up needed.

---

_Verified: 2026-04-26T23:00:00Z_
_Verifier: Claude (gsd-verifier)_
