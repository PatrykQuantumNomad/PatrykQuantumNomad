---
phase: 129-tiers-2-3-managed-graph-rag
plan: 05
subsystem: rag
tags: [lightrag, graph-rag, openrouter, async-cli, cost-surprise-gate, pymupdf, asyncio, python]

# Dependency graph
requires:
  - phase: 129-03
    provides: "build_rag(working_dir, llm_token_tracker, model) returning a configured LightRAG instance with OpenRouter LLM + embedding closures; CostAdapter dispatching add_usage payloads to record_llm vs record_embedding on completion_tokens key presence; locked WORKING_DIR/EMBED_DIMS/DEFAULT_LLM_MODEL/DEFAULT_EMBED_MODEL constants"
  - phase: 129-01
    provides: "[tier-3] extras with lightrag-hku==1.4.15 + pymupdf>=1.27 + openai>=1.50 (PyMuPDF available for Tier-3-owned PDF extraction per Pitfall 11)"
  - phase: 128
    provides: "OpenRouter routing pattern (single OPENROUTER_API_KEY); shared.cost_tracker.CostTracker + record_llm + record_embedding API; shared.display.render_query_result with console_override (Phase 128-06 fix); shared.loader.DatasetLoader; tier_1_naive shim convention for hyphen-dir → underscore-import; tier-1-naive/main.py as the CLI bootstrap reference"
  - phase: 127
    provides: "shared.config.get_settings + openrouter_api_key SecretStr field; dataset/manifests/papers.json (paper_id + filename); CostTracker.persist() writing evaluation/results/costs/{tier}-{ts}.json"
provides:
  - "tier-3-graph/ingest.py — extract_full_text (Tier-3-owned PyMuPDF) + async ingest_corpus passing stable ids=[paper_id] for kv_store_doc_status dedup (Pattern 5)"
  - "tier-3-graph/query.py — async run_query wrapping rag.aquery(QueryParam(mode=...)) with pre/post tracker-delta for per-query token attribution"
  - "tier-3-graph/main.py — async CLI orchestration (asyncio.run(amain) bridge per Pitfall 8); --ingest / --query / --mode / --reset / --model / --yes flags; cost-surprise gates on first ingest AND --reset"
  - "tier-3-graph/tests/test_main.py — 12 non-live tests covering yes-gate auto-confirm + abort-on-EOF/empty/decline + argparse surface + no-flags default-demo behavior + query-only does-not-auto-ingest"
  - "Tier 3 functionally complete (ingest + query + cost + latency) — Plan 07 ships README + live e2e test against 2-paper subset"
affects: [phase-129-06-tier-2-readme-live-test, phase-129-07-tier-3-readme-live-test, phase-130-tier-4-rag-anything, phase-131-eval-quality]

# Tech tracking
tech-stack:
  added: ["LightRAG ainsert/aquery via async CLI", "Per-query token-delta accounting (snapshot tracker before/after rag.aquery to attribute LLM tokens to a single query without losing ingest cost in the same JSON file)"]
  patterns:
    - "Cost-surprise gate is a TWO-LAYER defense: (1) CLI-level --yes flag with friendly _confirm_or_abort prompt that aborts on EOF (CI-safe default), (2) LightRAG-level kv_store_doc_status idempotency keyed on ids=[paper_id]. Both must hold; either alone is insufficient (CLI gate doesn't survive a script that always passes --yes; LightRAG dedup doesn't survive a --reset)."
    - "Single asyncio.run(amain) bridge at the bottom of main() — every other async call lives inside amain. Pitfall 8 protection against accidental nested-loop / sync-blocking patterns that hang LightRAG's storage finalizers."
    - "Render-without-citations honesty: passing chunks=[] to render_query_result for graph queries because LightRAG blends multiple sources into the answer; the renderer correctly prints 'No chunks retrieved.' which is more honest than fabricating a citation list from internal entity references."
    - "First-ingest detection via Path(WORKING_DIR, 'graph_chunk_entity_relation.graphml').stat().st_size > 1024 — bare existence is unreliable because LightRAG creates the file at constructor-init time as empty; size > 1KB indicates entities have been extracted and persisted."

key-files:
  created:
    - "rag-architecture-patterns/tier-3-graph/ingest.py (149 LOC)"
    - "rag-architecture-patterns/tier-3-graph/query.py (98 LOC)"
    - "rag-architecture-patterns/tier-3-graph/main.py (367 LOC)"
    - "rag-architecture-patterns/tier-3-graph/tests/test_main.py (231 LOC, 12 non-live tests)"
  modified: []

key-decisions:
  - "DEFAULT_MODE = 'hybrid' (Open Q4 resolution) — works on every install; --mode mix is opt-in once a reranker is configured"
  - "DEFAULT_QUERY = the multi-hop DPR/RAG probe verbatim from Plan body — designed to demonstrate cross-document entity-edge traversal that Tier 1's vector-only top-k cannot reach"
  - "First-ingest detection uses graphml file SIZE > 1KB (not bare existence) because LightRAG creates the file at constructor-init time empty; this prevents the cost gate from firing on every subsequent run"
  - "CostAdapter constructor uses keyword args (llm_model=, embed_model=) NOT positional (model=) — the constructor signature in Plan 03 requires both slugs; plan body's `CostAdapter(tracker, model=args.model)` was a typo that would have raised TypeError at runtime. Adapted to `CostAdapter(tracker, llm_model=args.model, embed_model=DEFAULT_EMBED_MODEL)`."
  - "_confirm_or_abort returns False on EOFError — CI-safe default. A non-interactive script without --yes MUST abort silently rather than hang on input() or accidentally proceed. Unit-tested via mock.patch('builtins.input', side_effect=EOFError)."
  - "render_query_result called with chunks=[] for graph queries — LightRAG does not expose per-chunk citations the same way Tier 1 does; the answer blends multiple graph sources. Passing [] is the honest representation; the renderer prints 'No chunks retrieved.' which accurately conveys the difference."
  - "12 non-live tests added covering yes-gate (5 tests: auto-confirm under --yes, abort on decline/empty/EOF/lowercase-y proceed) + argparse surface (3 tests) + constants surface (2 tests) + no-flags default behavior (2 tests). Live e2e is reserved for Plan 07."
  - "NO live --ingest invocation during this plan — orchestrator instructions explicit that the ~$1, ~10-min one-time entity extraction is reserved for Plan 07's 2-paper subset live test (Phase 128-06 precedent for live deferral)."

patterns-established:
  - "Two-layer cost-surprise defense pattern: --yes CLI gate + ids=[paper_id] storage-level dedup. Tier 4 (Phase 130 RAG-Anything) and Tier 5 (Agentic) should follow the same pattern when they have one-time-expensive setup operations."
  - "EOFError-aborts pattern for confirmation prompts: input() in try/except EOFError so non-interactive shells never hang and never silently proceed. Reusable for any CLI that needs to gate destructive ops."
  - "Token-delta attribution pattern: snapshot tracker.queries before+after the operation to compute per-call token counts WITHOUT losing aggregate cost from the same JSON file. Works for any tracker that accumulates queries across multiple operations (ingest + query in the same run)."

# Metrics
duration: 6min
completed: 2026-04-26
---

# Phase 129 Plan 05: Tier 3 Ingest + Query + CLI Orchestration Summary

**Tier 3 (LightRAG Graph RAG) functionally complete — async CLI with `--yes`-gated `ainsert`/`aquery` orchestration, per-query token-delta attribution from a single CostTracker, and a 2-layer cost-surprise defense (CLI gate + LightRAG `kv_store_doc_status` dedup). Plan 07 covers live e2e + README.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-26T17:39:55Z
- **Completed:** 2026-04-26T17:45:46Z
- **Tasks:** 2/2
- **Files created:** 4 (ingest.py, query.py, main.py, tests/test_main.py)

## Accomplishments

- **Tier 3 ingest path** — Tier-3-owned PyMuPDF extractor (Pitfall 11 compliance: `import fitz` lives in `tier-3-graph/ingest.py`, not borrowed from tier-1) + idempotent `await rag.ainsert(text, ids=[paper_id])` with cost projection printed BEFORE the loop starts (Pitfall 3 — cost-surprise visible even after `--yes` gate).
- **Tier 3 query path** — `await rag.aquery(question, param=QueryParam(mode=...))` wrapped with pre/post tracker-delta to extract per-query LLM tokens (separates query cost from accumulated ingest cost in the same persisted JSON).
- **Async CLI orchestration** — `asyncio.run(amain)` is the SINGLE async/sync bridge (Pitfall 8); every other call inside `amain` is async. `--ingest` / `--query` / `--mode` / `--reset` / `--model` / `--yes` flags wired via argparse with `--mode` constrained to `{naive,local,global,hybrid,mix}`.
- **Two-layer cost-surprise defense** — `_confirm_or_abort` gates BOTH first-time `--ingest` (detected via graphml file > 1KB) AND `--reset` wipes; both honor `--yes` for CI; abort on `EOFError` so non-interactive shells without `--yes` fail safe.
- **OPENROUTER_API_KEY guard** (Pitfall 10) — fast-fail with friendly red error + exit code 2 BEFORE building any client. Verified via patched `get_settings`.
- **12 non-live unit tests** — 5 yes-gate, 3 argparse surface, 2 constants, 2 no-flags default behavior. Total tier-3 test count: 19 (7 from Plan 03 + 12 new).
- **NO live `--ingest` invocation** — strictly respected the cost gate. Plan 07 owns the 2-paper subset live test.

## Task Commits

Each task was committed atomically and pushed to `origin/main`:

1. **Task 1: tier-3-graph/{ingest.py, query.py}** — `b95b5a3` (feat)
2. **Task 2: tier-3-graph/main.py + tests/test_main.py** — `63aaf7e` (feat)

**Plan metadata:** (this SUMMARY commit will follow)

## Verbatim `python tier-3-graph/main.py --help` Output

```
usage: tier-3-graph [-h] [--ingest] [--query QUERY]
                    [--mode {naive,local,global,hybrid,mix}] [--reset]
                    [--model MODEL] [--yes]

Tier 3 (Graph RAG) — LightRAG knowledge-graph extraction + multi-mode
retrieval over the rag-architecture-patterns corpus.

options:
  -h, --help            show this help message and exit
  --ingest              Build the knowledge graph (one-time ~$1, idempotent on
                        re-run).
  --query QUERY         Run a query against the persisted graph.
  --mode {naive,local,global,hybrid,mix}
                        LightRAG query mode (default hybrid). naive=vector-
                        only, local=entity-neighborhood, global=community-
                        summary, hybrid=local+global, mix=hybrid+rerank
                        (requires reranker).
  --reset               Wipe lightrag_storage/tier-3-graph before --ingest
                        (warning: re-ingest costs ~$1).
  --model MODEL         OpenRouter LLM slug for entity extraction + answers
                        (default google/gemini-2.5-flash). Must be present in
                        shared.pricing.PRICES.
  --yes                 Skip cost-surprise confirmation prompts (for non-
                        interactive use).
```

## Final Line Counts

| File | LOC | Min Required (per `must_haves.artifacts`) | Status |
|------|-----|-------------------------------------------|--------|
| `tier-3-graph/ingest.py` | 149 | 50 | well over |
| `tier-3-graph/query.py` | 98 | 25 | well over |
| `tier-3-graph/main.py` | 367 | 130 | well over |
| `tier-3-graph/tests/test_main.py` | 231 | n/a | new (12 tests) |
| **Total** | **845** | | |

The actual files exceed the minimums comfortably because docstrings document the non-obvious decisions inline (cost-surprise gate rationale, token-delta strategy, EOFError-aborts safety, render_query_result chunks=[] honesty). The pure executable lines hew much closer to the `<interfaces>` shapes.

## Cost-Adapter Wiring Shape (verbatim from Plan 03 SUMMARY's Outcome)

**Outcome A** — confirmed in Plan 03 by `scripts/probe_lightrag_token_tracker.py` against lightrag-hku==1.4.15. Both `openai_complete_if_cache` AND `openai_embed` accept `token_tracker` and call `add_usage(token_counts)` after each response. Single `CostAdapter` instance threaded into `build_rag(llm_token_tracker=adapter)` captures BOTH LLM and embedding spend automatically — dispatch on `completion_tokens` key presence routes LLM payloads to `record_llm` and embed payloads to `record_embedding`.

The Outcome-C tiktoken fallback documented in `query.py`'s docstring is NOT active. The `model` parameter on `run_query` is unused on the active Outcome-A path but kept in the public signature so swapping to Outcome-C (if a future LightRAG release removes `token_tracker`) is a one-line body change, not a contract change.

## Tier-3-Owned PyMuPDF Confirmation (Pitfall 11)

`tier-3-graph/ingest.py` line 31: `import fitz` (PyMuPDF). This is Tier 3's OWN dependency — `pymupdf>=1.27,<2` was added to `[tier-3]` extras by Plan 129-01. NO import from `tier_1_naive.ingest`. Tier 3 is reproducible from `tier-3-graph/requirements.txt` alone (which mirrors `[tier-3]` extras via `-e ..[tier-3]`). Cross-tier coupling avoided per architectural Pitfall 11.

```bash
$ grep -c 'tier_1_naive\|from tier-1' tier-3-graph/ingest.py tier-3-graph/query.py tier-3-graph/main.py
tier-3-graph/ingest.py:0
tier-3-graph/query.py:0
tier-3-graph/main.py:0
```

Zero cross-tier imports. Tier 3 is fully isolated.

## --yes Bypasses Both Cost-Surprise Prompts

Confirmed by code path inspection AND unit test:

* **First-ingest gate** (`amain` lines ~150-160): `_confirm_or_abort("First-time ingest extracts a knowledge graph from ~100 papers...", args.yes, console)` — `args.yes` short-circuits to `True` and skips `input()`.
* **--reset gate** (`amain` lines ~108-116): `_confirm_or_abort("--reset will wipe ... — next --ingest will re-extract entities (~$1, ~10 min).", args.yes, console)` — same `--yes` short-circuit.

Test coverage:

* `test_yes_gate_auto_confirms_when_yes_flag_passed` — verifies `--yes=True` returns `True` without calling `input()` (would hang in pytest if `input()` were called because stdin is closed under pytest).
* `test_yes_gate_aborts_on_eof_without_yes_flag` — verifies `--yes=False` + `EOFError` (CI/non-interactive) returns `False` (the safe default).
* `test_yes_gate_aborts_on_user_decline_without_yes_flag` — `input()` returns `'n'` → `False`.
* `test_yes_gate_aborts_on_empty_input_without_yes_flag` — `input()` returns `''` → `False` (default-N behavior).
* `test_yes_gate_proceeds_on_lowercase_y` — `input()` returns `'y'` → `True`.

## Files Created/Modified

**Companion repo `/Users/patrykattc/work/git/rag-architecture-patterns/`:**

- `tier-3-graph/ingest.py` (new, 149 LOC) — `extract_full_text(pdf_path) -> str` (Tier-3-owned PyMuPDF concatenating page text with double-newline separators, skipping empty pages) + `ingest_corpus(rag, papers, console, tracker, model) -> int` (idempotent `await rag.ainsert(text, ids=[paper_id])` with cost projection printed BEFORE the loop and running `tracker.total_usd()` printed after each insert).
- `tier-3-graph/query.py` (new, 98 LOC) — `run_query(rag, question, mode, model, tracker) -> tuple[str, int, int]` wrapping `await rag.aquery(question, param=QueryParam(mode=mode))` with pre/post tracker-delta to extract per-query LLM token counts. Outcome A path active; Outcome C tiktoken fallback documented but not active.
- `tier-3-graph/main.py` (new, 367 LOC) — async CLI orchestration. `_confirm_or_abort` helper. `amain(args, console) -> int` does OPENROUTER_API_KEY guard → optional --reset wipe (gated) → CostTracker + CostAdapter + build_rag → initialize_storages → ingest (gated on first run via graphml > 1KB) → query → finalize_storages. `main()` parses argparse, applies no-flags-default (auto-ingest + auto-DEFAULT_QUERY), wraps `amain` in `asyncio.run`.
- `tier-3-graph/tests/test_main.py` (new, 231 LOC, 12 tests) — non-live unit tests covering yes-gate (5), constants surface (2), argparse surface (3), no-flags default behavior (2). All 12 pass.

**Profile/planning repo `/Users/patrykattc/work/git/PatrykQuantumNomad/`:**

- `.planning/phases/129-tiers-2-3-managed-graph-rag/129-05-SUMMARY.md` (this file).

## Decisions Made

See frontmatter `key-decisions` for the full list. Most consequential:

1. **CostAdapter constructor mismatch in plan body fixed silently as a Rule-1 deviation** — Plan body shows `CostAdapter(tracker, model=args.model)` but Plan 03's actual `__init__(self, tracker, llm_model: str, embed_model: str)` requires both slugs. I called it as `CostAdapter(tracker, llm_model=args.model, embed_model=DEFAULT_EMBED_MODEL)`. The plan body's signature would have raised `TypeError` at runtime; this is the correct adaptation to Plan 03's actual API contract.

2. **First-ingest detection via graphml file SIZE > 1KB** — bare `.exists()` is unreliable because LightRAG creates `graph_chunk_entity_relation.graphml` at constructor-init time as an empty NetworkX placeholder. Without the size check, the gate would NEVER fire on second runs (always look "already built"), defeating cost-surprise protection on `--reset --ingest` cycles where the user wipes and forgets to pass `--yes`. Size > 1KB is a sound proxy for "entities have been extracted and persisted" because the empty NetworkX header alone is well under 1KB.

3. **EOFError-aborts pattern in `_confirm_or_abort`** — `try: input(...) except EOFError: return False`. The default in non-interactive shells (CI, scripts where stdin is closed, pytest subprocesses) MUST be ABORT, not "silently proceed". This is the strongest safety property of the cost-surprise gate; without it, accidentally invoking `python tier-3-graph/main.py --ingest` from a CI script (no `--yes`) would silently spend $1 every CI run. Explicitly unit-tested via `mock.patch('builtins.input', side_effect=EOFError)`.

4. **`render_query_result(chunks=[])` for graph queries** — LightRAG blends multiple graph sources into the answer; it does not expose per-chunk citations the same way Tier 1 does. Synthesizing a fake citation list from internal entity references would be dishonest. Passing `[]` makes `render_query_result` print "No chunks retrieved." which accurately conveys: "the answer comes from a graph traversal, not from a top-k chunk list." Phase 131 (eval/quality) will quantify this difference; this plan just ships the honest renderer wiring.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] CostAdapter constructor signature mismatch in plan body**

- **Found during:** Task 2 (writing main.py)
- **Issue:** Plan body's `<interfaces>` section shows `adapter = CostAdapter(tracker, model=args.model)` but Plan 03's actual `CostAdapter.__init__(self, tracker, llm_model: str, embed_model: str)` requires BOTH `llm_model` and `embed_model` slugs (because the adapter dispatches on payload shape and needs to know WHICH model to record against for each shape). Calling it with `model=args.model` would raise `TypeError: __init__() got an unexpected keyword argument 'model'` at the first invocation.
- **Fix:** Call `CostAdapter(tracker, llm_model=args.model, embed_model=DEFAULT_EMBED_MODEL)` where `DEFAULT_EMBED_MODEL` is imported alongside `DEFAULT_LLM_MODEL` from `tier_3_graph.rag`. This matches the actual constructor and ensures both LLM and embedding cost is correctly attributed.
- **Files modified:** `tier-3-graph/main.py` (imports + CostAdapter construction).
- **Verification:** Smoke import passes (`uv run python -c "from tier_3_graph.main import ..."`); `python tier-3-graph/main.py --help` runs without `TypeError`.
- **Committed in:** `63aaf7e` (Task 2 commit).

**2. [Rule 2 — Missing critical functionality] Empty papers manifest guard in --ingest path**

- **Found during:** Task 2 (writing amain)
- **Issue:** Plan body's `amain` skeleton calls `loader.papers()` without checking for an empty manifest. If `dataset/manifests/papers.json` is missing or empty (e.g., fresh checkout where Phase 127 Plan 04 hasn't run), `ingest_corpus` would silently iterate over an empty list and return `0` papers ingested — looking like success but actually building an empty graph. Subsequent `--query` would then return a hallucinated answer with zero retrieved context.
- **Fix:** Added `if not papers: console.print("[red]No papers in dataset/manifests/papers.json. Run scripts/curate_corpus.py first.[/red]"); return 2` mirroring Tier 1's `cmd_ingest` precedent (tier-1-naive/main.py:88-94). Same friendly red-error + exit-2 pattern as the OPENROUTER_API_KEY guard.
- **Files modified:** `tier-3-graph/main.py` (lines ~155-162).
- **Verification:** Existing tests still pass; the guard would have fired in `test_no_flags_invocation_runs_default_demo` if it weren't a pure-args-capture mock test.
- **Committed in:** `63aaf7e` (Task 2 commit).

---

**Total deviations:** 2 auto-fixed (1 bug fix in CostAdapter call, 1 missing-critical empty-manifest guard).

**Impact on plan:** Both deviations are necessary for correctness. Deviation #1 (CostAdapter signature) is the more consequential — without it, the CLI would crash on first invocation with a confusing `TypeError`. Deviation #2 (empty-manifest guard) prevents a silent-success-with-broken-state failure mode. No scope creep — both fixes live entirely inside `main.py`, the file the plan already mandated, and follow patterns already established by Plan 03 (CostAdapter API) and Tier 1 (empty-papers guard).

## Issues Encountered

- **Pre-existing tier-1 `test_store.py` failures (5)** — already logged to `.planning/phases/129-tiers-2-3-managed-graph-rag/deferred-items.md` by Plan 03. Verified pre-existing during this plan via git-stash + pytest-on-clean-tree. Out of scope (Scope Boundary rule); NOT auto-fixed.
- **`dataset/manifests/metadata.json` shows uncommitted timestamp drift** — pre-existing from Phase 127; NOT caused by Plan 05; left untouched.
- **Wave 3 parallel push** — Plan 04 (Tier 2 CLI) pushed concurrently. My push fast-forwarded cleanly because tier-3-graph/* and tier-2-managed/* file paths do not overlap. Final companion repo HEAD after my push: `63aaf7e`.

## Wave 3 Coordination Status

At Plan 05 completion (push `63aaf7e` at 17:45:46Z), companion repo `origin/main` HEAD is `63aaf7e`. Plan 04 (Tier 2 CLI) pushed `94b6f97` between my Task 1 and Task 2 — clean parallel work, no conflicts.

Final Wave 3 history (chronological):
- `b95b5a3` (Plan 05 Task 1 — tier-3 ingest + query) — 2026-04-26 17:42Z
- `94b6f97` (Plan 04 Task 3 — tier-2 CLI orchestration) — 2026-04-26 17:43Z
- `63aaf7e` (Plan 05 Task 2 — tier-3 async CLI) — 2026-04-26 17:45Z

Wave 3 complete. Ready for Wave 4 (Plans 06 + 07: README + live e2e tests for Tiers 2 + 3).

## User Setup Required

None — no new external services. `OPENROUTER_API_KEY` was already declared by Phase 128 and promoted to Tier 3 in Plan 129-01. Plan 07 (live e2e) is the first time this plan's code will exercise the real OpenRouter API.

## Next Phase Readiness

- **Plan 129-06 (Wave 4 — Tier 2 README + live test):** Independent of Tier 3. Plan 04's tier-2-managed/main.py is now on origin/main; Plan 06 just adds README + live test.
- **Plan 129-07 (Wave 4 — Tier 3 README + live test):** Ready. Will exercise `python tier-3-graph/main.py --yes` with `OPENROUTER_API_KEY` set and a 2-paper subset of `dataset/manifests/papers.json` to keep cost ≤$0.05 and latency ≤2 min. The cost-surprise gate IS the property under test (must auto-confirm on `--yes`; must abort without `--yes` in non-interactive shell).
- **Phase 130 (Tiers 4-5):** Ready. Tier 4 (RAG-Anything) and Tier 5 (Agentic) can adopt the two-layer cost-surprise defense pattern + asyncio.run-bridge pattern from Tier 3 — both addressed in this plan's `patterns-established`.

**Blockers/concerns:**

- 5 pre-existing tier-1 test_store failures (logged to `deferred-items.md`; non-blocking for Tier 3 but should be addressed before the Phase 129 verifier runs).

## Self-Check: PASSED

Verified after writing this SUMMARY:

- `tier-3-graph/ingest.py` exists ✓ (149 LOC, has `extract_full_text` + `ingest_corpus` + `import fitz`)
- `tier-3-graph/query.py` exists ✓ (98 LOC, has `run_query` + `QueryParam`)
- `tier-3-graph/main.py` exists ✓ (367 LOC, has `main` + `amain` + `asyncio.run` + `CostTracker("tier-3")` + `CostAdapter` + `render_query_result` + `DatasetLoader` + `build_rag` + `--yes` + `--mode` + `time.monotonic` + `tracker.persist` + `OPENROUTER_API_KEY`)
- `tier-3-graph/tests/test_main.py` exists ✓ (231 LOC, 12 tests)
- Commit `b95b5a3` (Task 1) on origin/main ✓
- Commit `63aaf7e` (Task 2) on origin/main ✓
- 19 non-live tier-3 tests pass (7 from Plan 03 + 12 from Plan 05) ✓
- `python tier-3-graph/main.py --help` exits 0 with all 6 flags + 5 mode choices ✓
- `from tier_3_graph.main import main, amain, DEFAULT_QUERY, DEFAULT_MODE, VALID_MODES` resolves ✓
- `DEFAULT_MODE == 'hybrid'` (Open Q4 resolution) ✓
- `'DPR' in DEFAULT_QUERY` (multi-hop probe) ✓
- NO live `--ingest` invocation against corpus (cost gate respected; Plan 07 owns the live test) ✓
- No tier-2-managed files modified (file ownership respected per Wave 3 coordination) ✓
- shared/embeddings.py + shared/llm.py NOT modified ✓
- Tier 3 is reproducible from `tier-3-graph/requirements.txt` alone (zero cross-tier imports) ✓

---
*Phase: 129-tiers-2-3-managed-graph-rag*
*Completed: 2026-04-26*
