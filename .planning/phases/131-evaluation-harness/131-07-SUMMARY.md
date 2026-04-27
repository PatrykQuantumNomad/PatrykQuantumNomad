---
phase: 131-evaluation-harness
plan: 07
subsystem: evaluation
tags: [phase-131-close-out, readme, live-smoke, deferred, ragas, three-stage-harness, tier-4-deferred-preserved, sandbox-empty-indices, eval-01, eval-02, eval-03, eval-04]

requires:
  - phase: 131-evaluation-harness
    plan: 01
    provides: "EvalRecord/QueryLog/ScoreRecord schema; conftest fixtures live_eval_keys_ok + tier1_index_present"
  - phase: 131-evaluation-harness
    plan: 02
    provides: "evaluation/harness/adapters/tier_1.py — async run_tier1(question_id, question, k=5) -> EvalRecord"
  - phase: 131-evaluation-harness
    plan: 04
    provides: "evaluation/harness/run.py — Stage 1 capture loop; Tier 4 cached-mode pass-through"
  - phase: 131-evaluation-harness
    plan: 05
    provides: "evaluation/harness/score.py — Stage 2 RAGAS scoring; score_query_log(log, qa_index, judge_llm, judge_emb, batch_size, raise_exceptions) -> (scores, usage)"
  - phase: 131-evaluation-harness
    plan: 06
    provides: "evaluation/harness/compare.py — Stage 3 aggregator; aggregate_tier(tier, results_dir) -> Optional[dict]; emit_markdown(...) -> str"

provides:
  - "evaluation/README.md — user-facing harness docs (175 LOC): Section-0 [!WARNING] banner + 9-section template + 3-stage Quickstart + sandbox SOCKS5+socksio recipe + Tier 4 deferral note + sample comparison.md snippet"
  - "evaluation/tests/test_eval_smoke_live.py — @pytest.mark.live smoke (163 LOC): Tier 1 × 1 question through all 3 stages end-to-end; gated on live_eval_keys_ok + tier1_index_present; <60s wall time + <$0.02 cost target"
  - "Phase 131 close-out: 7/7 plans shipped; live smoke DEFERRED in-sandbox (no populated index for any live-capable tier); ready for user's local full-corpus run + Tier 4 local capture before Phase 132"

affects: [132-source-verification-diagrams, 133-blog-publication]

tech-stack:
  added: []  # README + test code only; all surfaces reused from Plans 131-{01..06}
  patterns:
    - "Pattern 11 (sandbox SOCKS5+socksio recipe): documented verbatim in evaluation/README.md Section 6"
    - "Pattern 12 (live smoke shape): 1 tier × 1 question; <60s; <$0.02; gated on conftest fixtures"
    - "Phase 130 SC-1 deferral preserved: README documents Tier 4 user-runs-this-locally path; commits no Tier 4 live data"
    - "Open Q5 commit policy: comparison.md IS committed when generated; queries/ + metrics/ stay gitignored"

key-files:
  created:
    - "../rag-architecture-patterns/evaluation/tests/test_eval_smoke_live.py"
  modified:
    - "../rag-architecture-patterns/evaluation/README.md"  # Phase 127 placeholder REPLACED with full harness docs
  not-created:
    - "../rag-architecture-patterns/evaluation/results/comparison.md"  # DEFERRED — no live smoke ran

key-decisions:
  - "Live smoke DEFERRED, not failed — chroma_db/tier-1-naive/ is structurally present but EMPTY (count=0; drained by Phase 130-06's live test). Tier 1 adapter would short-circuit with error='tier1_chroma_empty' BEFORE reaching the cost-bearing API path. The smoke test's `assert rec.error is None` would fail for the wrong reason (no usable index), masking whether the live path actually works."
  - "All three live-capable tiers in this sandbox are unprovisioned: chroma_db/tier-1-naive empty (count=0); tier-2-managed/.store_id MISSING; lightrag_storage/tier-3-graph/ directory exists but is EMPTY (no files). To run any live smoke would require a fresh ingest first (Tier 1 ~$0.001-0.005 + ~30s; Tier 2 ~$0.0001 + Gemini File Search upload; Tier 3 ~$1.00 + ~10 min). The plan's autonomous=false convention says the executor STOPS at the live gate and surfaces the prereq question — exactly what this SUMMARY documents."
  - "comparison.md NOT created — no real query logs OR metrics on disk to aggregate. The synthetic smoke + 10 non-live tests in Plan 06 fully exercise the emit path; the real comparison.md is the user's first full-corpus run output OR a follow-up live smoke once an index exists. Per Open Q5 (131-RESEARCH), comparison.md is committed WHEN generated; the absence is the honest state."
  - "Smoke test code SHIPPED + statically verified — pytest collects 1 test cleanly; skips cleanly when OPENROUTER_API_KEY unset; full non-live suite remains 135/4/10 (was 135/4/9 — +1 deselect for the new live test). The empirical resolution of A2/A6/A8/Open Q1 is deferred to the user's first run; the test infrastructure is ready and reproducible."
  - "Tier 4 deferral preserved (Phase 130 SC-1): README explicitly documents `python tier-4-multimodal/scripts/eval_capture.py` as the user's local-run path. Phase 131 ships zero Tier 4 live data and the comparison.md emitter (Plan 06) auto-fires the deferral footer when no Tier 4 row is populated."
  - "Phase 131 close-out is HONEST: 7 plans shipped, all non-live tests pass, all 4 requirements (EVAL-01..04) implementable but only EVAL-01 (golden_qa.json) and partially EVAL-04 (comparison.md emitter shipped, awaiting first real data) are empirically verified. EVAL-02 (RAGAS metrics) and EVAL-03 (cost+latency tracking) are STATICALLY verified across 135 non-live tests; the live empirical confirmation is the user's next action."

duration: 12min
completed: 2026-04-27
---

# Phase 131 Plan 07: README + Live Smoke + Phase 131 Close-Out Summary

**`evaluation/README.md` (175 LOC) ships the user-facing harness docs — Section-0 [!WARNING] banner + 9-section template + 3-stage Quickstart + sandbox SOCKS5+socksio recipe + Tier 4 deferral note. `evaluation/tests/test_eval_smoke_live.py` (163 LOC) ships the @pytest.mark.live smoke — Tier 1 × 1 question through all 3 stages, gated on live_eval_keys_ok + tier1_index_present, <60s wall time, <$0.02 cost. Live smoke DEFERRED in-sandbox: chroma_db/tier-1-naive/ is structurally present but EMPTY (count=0; drained by Phase 130-06); tier-2-managed/.store_id MISSING; lightrag_storage/tier-3-graph/ EMPTY. No live-capable tier has a populated index; running the smoke would test the empty-index short-circuit, not the cost-bearing API path. Smoke code shipped + statically verified (pytest collects 1; skips cleanly without key; full non-live suite remains 135/4/10). Phase 131 closes out at 7/7 plans complete; comparison.md NOT generated (no real data); user's first full-corpus run produces it.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-27T12:11Z
- **Completed:** 2026-04-27T12:23Z
- **Tasks:** 2 (README + smoke test; comparison.md generation conditional + DEFERRED)
- **Files modified:** 1 created, 1 modified (README), 0 generated (comparison.md DEFERRED)

## Accomplishments

- **`evaluation/README.md` REPLACED** (Phase 127 placeholder → full harness docs, **175 LOC** ≥ 100 required):
  - Section 0: `> [!WARNING]` banner with 3 bullets — full-corpus cost ~$0.30-1.00; Tier 4 deferred to user (Phase 130 SC-1); judge cost auditable separately in `results/costs/ragas-judge-*.json`.
  - Section 1: Title (`# Evaluation Harness — Phase 131`) + 3-stage diagram (capture → score → compare).
  - Section 2: Quickstart — `uv pip install -e ".[evaluation,tier-1,tier-2,tier-3,tier-5]"` + per-stage commands + Tier 4 cached pass-through subsection.
  - Section 3: CLI reference table (7 rows covering all 3 stages + Tier 4 helper).
  - Section 4: Expected cost table — per-tier inference + RAGAS judge ~$0.20-0.50 + full-sweep total ~$0.55-1.00.
  - Section 5: Persistence file tree — queries/ (gitignored) + costs/ (committed D-13) + metrics/ (gitignored) + comparison.md (committed).
  - Section 6: Sandbox SOCKS5+socksio recipe — verbatim from Phase 128/129/130 (`ALL_PROXY=socks5h://localhost:61994` + `uv pip install socksio`).
  - Section 7: Known limitations — 6 bullets (Tier 4 deferred / n=30 / multi-hop ≡ cross-document / Tiers 1-3 text-only / judge=gemini-flash bias / NaN-not-zero).
  - Section 8: Sample comparison.md snippet (Tier 1 smoke shape).
  - Section 9: Architecture map (text diagram of golden_qa → run → score → compare).
  - Section 10: "Reused by" — Phase 132 (StatHighlight) + Phase 133 (BLOG-04 imports verbatim).

- **`evaluation/tests/test_eval_smoke_live.py` CREATED** (**163 LOC** ≥ 70 required):
  - `@pytest.mark.live` decorator (deselected by default; runs only with `-m live`).
  - Single test function `test_eval_smoke_tier1_full_pipeline(live_eval_keys_ok, tier1_index_present, tmp_path)` — gated on both fixtures.
  - SMOKE_QUESTION at module level — uses `single-hop-001` (verified against golden_qa.json).
  - Stage 1: `await run_tier1(question_id, question, k=5)` → asserts EvalRecord with non-empty answer + non-empty contexts + cost > 0 + latency > 0 + error is None.
  - Stage 2: builds `judge_llm = llm_factory("openrouter/google/gemini-2.5-flash", provider="litellm", client=litellm.completion)` + `judge_emb = embedding_factory("litellm", model="openrouter/openai/text-embedding-3-small")` (with `.base` import fallback per Plan 01) → `score_query_log(...)` → asserts ScoreRecord metrics ∈ [0, 1] + nan_reason is None.
  - Stage 3: `aggregate_tier(1, tmp_path)` → asserts row populated, n=1, n_nan=0, faithfulness ∈ [0,1], total_cost_usd > 0.
  - Empirical-resolution assertions: `usage["input_tokens"] > 0` (A2 / Open Q1) + `usage["output_tokens"] >= 0` (sanity).
  - tmp_path isolation for cost JSONs + metrics persistence (real `evaluation/results/costs/` is the adapter's default; tmp_path is for the score+compare stages).

- **Live smoke DEFERRED** — see Empirical Findings § "Live smoke prereq inventory" below.

- **Full non-live suite remains green:** 135 passed / 4 skipped / 10 deselected (was 135/4/9 — exactly +1 deselect for the new `live` test; ZERO regressions). Wall time 7.10s.

## Task Commits

Each task committed atomically + pushed to `origin/main` in companion repo `/Users/patrykattc/work/git/rag-architecture-patterns`:

1. **Task 1: evaluation/README.md** — `314961e` (docs)
   - `docs(131-07): evaluation/README.md — banner + 3-stage Quickstart + sandbox recipe + Tier 4 deferral`
   - 1 file changed, 156 insertions(+), 46 deletions(-)
2. **Task 2: evaluation/tests/test_eval_smoke_live.py** — `d6014f5` (test)
   - `test(131-07): @pytest.mark.live smoke — Tier 1 × 1 question through all 3 stages`
   - 1 file changed, 163 insertions(+)

**Plan metadata commit (this SUMMARY + STATE + ROADMAP):** in PatrykQuantumNomad repo, separate from companion-repo task commits.

## Files Created/Modified

### Companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`)

- `evaluation/README.md` — **175 LOC** (replaced 65-line Phase 127 placeholder; ≥100 required).
- `evaluation/tests/test_eval_smoke_live.py` — **163 LOC** (≥70 required).
- `evaluation/results/comparison.md` — **NOT created** (live smoke DEFERRED; no real query/metrics data on disk).

### Planning repo (`/Users/patrykattc/work/git/PatrykQuantumNomad`)

- `.planning/phases/131-evaluation-harness/131-07-SUMMARY.md` (this file)
- `.planning/STATE.md` (updated by metadata commit — Plan 7/7 done; Phase 131 close-out entry added)
- `.planning/ROADMAP.md` (Phase 131 plan progress 7/7 complete; status DEFERRED in-sandbox)

## Decisions Made

- **Live smoke DEFERRED in-sandbox, NOT failed.** chroma_db/tier-1-naive/ is structurally present but EMPTY (count=0; verified via `chromadb.PersistentClient(...).list_collections()`); the Tier 1 adapter short-circuits with `error='tier1_chroma_empty'` BEFORE reaching the cost-bearing OpenAI embed + Gemini chat path. Running the smoke would test the empty-index short-circuit (which Plan 04 already verified empirically), NOT the cost-bearing live path A2/A6/A8 are gated on.
- **All three live-capable tiers are unprovisioned.** Tier 1 EMPTY (count=0); Tier 2 `.store_id` MISSING (would require Phase 129 ingest first); Tier 3 `lightrag_storage/tier-3-graph/` directory exists but contains zero files (would require ~$1.00 LightRAG ingest, ~10 min). Pivoting to Tier 2 or 3 (per Plan 06 SUMMARY's recommendation) does NOT unblock the smoke without a fresh ingest in either tier.
- **Re-ingesting Tier 1 was deliberately NOT done** in this plan because it's an architectural decision (an extra cost-bearing prerequisite step, ~$0.001-0.005, ~30s) that the plan's autonomous=false stance reserves for the user. The plan's deferral path is documented + honored: "live smoke deferred — comparison.md will be generated by the user's first full-corpus run". The user can either (a) re-ingest Tier 1 + re-run, (b) accept the DEFERRED close-out, or (c) run the full sweep locally — all three paths are documented in the README + this SUMMARY.
- **Smoke test code shipped + statically verified.** `OPENROUTER_API_KEY="" pytest -m live --collect-only` returns "1 test collected"; `OPENROUTER_API_KEY="" pytest -m live` returns "1 skipped". The empirical resolution of A2/A6/A8/Open Q1 is gated on the user's first live run — the test infrastructure is correct and reproducible.
- **comparison.md deliberately NOT created.** Per Open Q5: comparison.md IS committed WHEN generated; the absence with no underlying data is more honest than synthesizing a fake row. Plan 06's emitter still auto-fires the Tier 4 deferral footer + the "no NaN scores across the run" defaults; Plan 06's test suite proves this works against canned inputs.

## Empirical Findings (for downstream phases)

### LOC counts

| File | LOC | Min required |
|---|---|---|
| `evaluation/README.md` | 175 | 100 |
| `evaluation/tests/test_eval_smoke_live.py` | 163 | 70 |
| `evaluation/results/comparison.md` | — (NOT created; DEFERRED) | 30 (target) |

### Verbatim head -25 of evaluation/README.md

```markdown
> [!WARNING]
> **Full-corpus evaluation costs ~$0.30-1.00** (Tier inference + RAGAS judge LLM combined; ~30 questions × ≤5 tiers × 3 metrics × ~3 internal LLM calls per metric).
> **Tier 4 is deferred to the user** (Phase 130 SC-1 — sandbox kernel-level OMP shmem block on MineRU; not solvable here). Run Tier 4 locally via `python tier-4-multimodal/scripts/eval_capture.py`.
> **Judge LLM cost is auditable separately** in `evaluation/results/costs/ragas-judge-*.json` (D-13 schema; same `shared.cost_tracker.CostTracker` infra as the tier costs).

# Evaluation Harness — Phase 131

3-stage RAG benchmarking pipeline over the 30-question golden Q&A in `evaluation/golden_qa.json`:

```
Stage 1 (capture)   →  evaluation/results/queries/{tier}-{ts}.json
Stage 2 (score)     →  evaluation/results/metrics/{tier}-{ts}.json
Stage 3 (compare)   →  evaluation/results/comparison.md
```

Each stage is independently re-runnable. Re-running Stage 2 with a different judge LLM doesn't re-pay Stage 1 (tier inference cost). Re-running Stage 3 doesn't re-pay either. This decoupling is the point.

The harness compares five RAG architectures answering the **same 30 questions** against the same corpus, using **RAGAS** (`faithfulness`, `answer_relevancy`, `context_precision`) plus a captured-cost ledger (D-13 schema, same `shared.cost_tracker.CostTracker` as every per-tier `main.py`). The output `comparison.md` is committed to git and Phase 133's `BLOG-04` imports it verbatim.

## Quickstart

From repo root:

```bash
# Once: install evaluation deps + the tiers you want to drive live
uv pip install -e ".[evaluation,tier-1,tier-2,tier-3,tier-5]"   # Tier 4 separately if you have MineRU
```

(Banner + Section 1 + Quickstart all render correctly; full file 175 LOC.)

### Live smoke prereq inventory (the deferral root cause)

Verified at the live-test gate:

| Prereq | Required for | State in sandbox | Result |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Tier 1 chat + RAGAS judge | Present in `.env` (loaded by conftest's `load_dotenv()`) | OK |
| `socksio` | sandbox SOCKS5 proxy egress | Installed (`socksio==1.0.0` in venv) | OK |
| `ALL_PROXY` | sandbox network routing | Set (`socks5h://localhost:61994`) | OK |
| `chroma_db/tier-1-naive/` (populated) | Tier 1 retrieval | **EMPTY** (collection exists, count=0; drained by Phase 130-06's live test) | **BLOCKS** Tier 1 smoke |
| `tier-2-managed/.store_id` | Tier 2 Gemini File Search | **MISSING** (would require `python tier-2-managed/main.py --ingest`) | BLOCKS Tier 2 alt |
| `lightrag_storage/tier-3-graph/` (populated) | Tier 3 LightRAG | EMPTY (directory exists, no files; would require ~$1.00 + ~10 min ingest) | BLOCKS Tier 3 alt |

**Verbatim probe outputs:**

```
$ uv run python -c "import chromadb; c = chromadb.PersistentClient(path='chroma_db/tier-1-naive'); [print(f'{x.name}: count={x.count()}') for x in c.list_collections()]"
enterprise_kb_naive: count=0

$ ls -la tier-2-managed/.store_id 2>/dev/null
(no output — file does not exist)

$ ls -la lightrag_storage/tier-3-graph/
total 0
drwxr-xr-x@ 2 patrykattc  staff  64 Apr 26 20:17 .
drwxr-xr-x@ 3 patrykattc  staff  96 Apr 26 20:17 ..
```

**Conclusion:** the sandbox lacks any populated index for the live-capable tiers. Re-ingesting any tier IS POSSIBLE in-sandbox (Tier 1 cheapest at ~$0.001-0.005 + ~30s) but is an architectural prerequisite that the plan's autonomous=false convention reserves for the user.

### Path forward for the user (commands to run locally)

**Option A — Re-ingest Tier 1 + run the smoke** (cheapest; ~$0.005 total; <2 min wall):

```bash
cd /Users/patrykattc/work/git/rag-architecture-patterns
# Refresh Tier 1 ChromaDB (Phase 130-06 drained it)
uv run python tier-1-naive/main.py --ingest --yes
# Run the live smoke
UV_CACHE_DIR=/tmp/claude/uv-cache uv run pytest evaluation/tests/test_eval_smoke_live.py -v -m live -s
# If passing, generate the first comparison.md
uv run python -m evaluation.harness.run --tiers 1 --limit 1 --yes
uv run python -m evaluation.harness.score --tiers 1 --limit 1 --yes
uv run python -m evaluation.harness.compare --tiers 1
git add evaluation/results/comparison.md evaluation/results/costs/tier-1-eval-*.json evaluation/results/costs/ragas-judge-*.json
git commit -m "docs(131-07): comparison.md from live smoke (Tier 1 × 1 question; gemini-2.5-flash judge)"
```

**Option B — Full-corpus run on local laptop** (recommended; produces a real comparison.md for Phase 133):

```bash
# Locally (NOT in agent sandbox; no socksio needed)
uv pip install -e ".[evaluation,tier-1,tier-2,tier-3,tier-5]"
# Re-ingest each tier as needed
python tier-1-naive/main.py --ingest --yes
python tier-2-managed/main.py --ingest --yes
python tier-3-graph/main.py --ingest --yes  # ~$1.00 + ~10 min
# Tier 4 separately via the user-helper:
python tier-4-multimodal/scripts/eval_capture.py --yes  # local MineRU run
# Full sweep:
python -m evaluation.harness.run --tiers 1,2,3,5 --tier-4-from-cache evaluation/results/queries/tier-4-{TS}.json --yes
python -m evaluation.harness.score --tiers 1,2,3,4,5 --yes
python -m evaluation.harness.compare --tiers 1,2,3,4,5
```

**Option C — Accept the DEFERRED close-out as Phase 131's outcome.** Code is shipped + statically verified (135 non-live tests pass; live test collects + skips cleanly). Phase 131's user-facing surface (README + 3 CLIs + smoke test) is complete; the empirical comparison.md ships in the user's first full-corpus run.

### Empirical resolution of every 131-RESEARCH Open Question

| ID | Question | Status | How resolved (or what blocks) |
|---|---|---|---|
| Open Q1 / A2 | Does `get_token_usage_for_openai` parse OpenRouter responses? | **DEFERRED** | Import works (Plan 01); behavior on OpenRouter response shape gated on first live judge call. Smoke test asserts `usage["input_tokens"] > 0` to catch this. User's first run is the empirical resolution. |
| Open Q2 | Is `batch_size=10` sufficient at concurrency 1? | **TRIVIALLY YES (n=1)** | For 1-question smoke; full-corpus verification deferred to user's local run. |
| Open Q3 | Tier 4 cached log shape | **RESOLVED in Plan 03** | `eval_capture.py` ships; user runs locally; round-trip verified by Plan 04 (`run.py --tier-4-from-cache PATH`). |
| Open Q4 | Judge model bias | **DOCUMENTED** | README Section 7 + comparison.md emitter footer (Plan 06) acknowledge `gemini-2.5-flash` self-grading. v1 stays gemini-flash; not "resolved" technically — it's a meta-decision. |
| Open Q5 | Commit comparison.md? | **YES — committed when generated** | Plan 01 .gitignore tracks `evaluation/results/comparison.md` as committed; queries/+metrics/ gitignored. The file is absent in this plan because no live data exists; will be committed in user's first full-corpus run. |
| Open Q6 | Lockfile guard post-ragas | **RESOLVED in Plan 01** | `tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk` passes empirically. |
| A3 | LightRAG separator `-----` | **PARTIALLY RESOLVED** | Plan 02's `_split_context` tests verify on canned input; live confirmation deferred to user's full Tier 3 capture. |
| A6 | `EvaluationResult.to_pandas()` works in 0.4.3? | **DEFERRED** | `hasattr(result, 'to_pandas')` defensive check in Plan 05 handles either branch; user's first live run reveals which branch fires. |
| A7 | Transitive conflict-free | **RESOLVED in Plan 01** | `uv lock` succeeded; `test_lockfile_does_not_contain_deprecated_sdk` passed. |
| A8 | OPENROUTER_API_KEY sole-key sufficiency | **DEFERRED** | Static evidence: judge LLM + embedder both routed via OpenRouter LiteLLM (verified at import time in Plan 01 + Plan 05). Live smoke would empirically confirm; deferred to user's first run. |

**Status summary:** 4 RESOLVED in earlier plans (Q3, Q6, A7, plus Q4 documented), 1 trivially yes (Q2), 5 DEFERRED to user's first live run (Q1/A2, A3, A6, A8, Q5 commit happens then). The deferred set is exactly the cost-bearing live API path; the static verification surface is complete.

### Test results verbatim

```
$ OPENROUTER_API_KEY="" UV_CACHE_DIR=/tmp/claude/uv-cache uv run pytest evaluation/tests/test_eval_smoke_live.py -m live --collect-only -q
evaluation/tests/test_eval_smoke_live.py::test_eval_smoke_tier1_full_pipeline

1 test collected in 0.01s

$ OPENROUTER_API_KEY="" UV_CACHE_DIR=/tmp/claude/uv-cache uv run pytest evaluation/tests/test_eval_smoke_live.py -m live
collected 1 item

evaluation/tests/test_eval_smoke_live.py s                               [100%]

============================== 1 skipped in 0.01s ==============================
```

### Full non-live suite

```
$ UV_CACHE_DIR=/tmp/claude/uv-cache uv run pytest -q -m "not live"
135 passed, 4 skipped, 10 deselected, 11 warnings in 7.10s
```

Up from 135 / 4 / 9 (131-06 hand-off baseline). +1 deselect = the 1 new `live`-marked test in `test_eval_smoke_live.py`. Zero regressions; the new smoke test is correctly excluded from `-m "not live"` runs.

### STATE.md decisions entry verbatim (the exact text appended)

```
- Plan 131-07: README + live smoke + Phase 131 close-out — README replaces Phase 127 placeholder (175 LOC; banner + 9-section template + 3-stage Quickstart + sandbox SOCKS5+socksio recipe + Tier 4 deferral); test_eval_smoke_live.py ships @pytest.mark.live smoke (163 LOC; Tier 1 × 1 question end-to-end through run_tier1 + score_query_log + aggregate_tier; gated on live_eval_keys_ok + tier1_index_present). Live smoke DEFERRED in-sandbox: chroma_db/tier-1-naive/ EMPTY (count=0; drained by Phase 130-06); tier-2-managed/.store_id MISSING; lightrag_storage/tier-3-graph/ EMPTY. No live-capable tier has populated index; smoke would test empty-index short-circuit not cost-bearing API path. Per autonomous=false convention, executor STOPS at the gate and surfaces prereq question to user. Code shipped + statically verified (pytest collects 1; skips cleanly without key; full non-live suite 135/4/10 — was 135/4/9 → +1 deselect for new live test). comparison.md NOT created (no real query/metrics data on disk; per Open Q5 commit-when-generated). Phase 131 closes out at 7/7 plans complete; user's first full-corpus run produces comparison.md. Empirical resolution of Open Q1/A2 + A6 + A8 deferred to that run.
```

### ROADMAP.md Phase 131 row update verbatim

```
| 131. Evaluation Harness | v1.22 | 7/7 | ✅ Complete (live smoke DEFERRED — sandbox lacks populated indices for any live-capable tier; user runs full-corpus eval locally; code + non-live suite 135/4/10 green) | - |
```

### Final wave summary table

| Wave | Plan | Status | Notes |
|---|---|---|---|
| 1 | 01 | DONE | foundation: pyproject [evaluation] extra + EvalRecord/QueryLog/ScoreRecord schema + conftest fixtures + lockfile guard intact (8 files / 219 LOC) |
| 2 | 02 | DONE | Tier 1/2/3/5 adapters — uniform `async run_tierN(question_id, question, **kwargs) -> EvalRecord` (5 files) |
| 2 | 03 | DONE | Tier 4 dual-mode adapter + `eval_capture.py` user-helper for Phase 130 SC-1 deferral (4 files / 473 LOC) |
| 3 | 04 | DONE | Stage 1 `harness/run.py` — per-tier capture loop with single asyncio.run boundary + 1 CostTracker/tier (Pitfall 11) + Tier 3/5 reuse + Tier 4 cached pass-through (2 files / 553 LOC) |
| 4 | 05 | DONE | Stage 2 `harness/score.py` — RAGAS evaluate() with 3 metrics + LiteLLM/OpenRouter judge + 4-branch NaN short-circuit + D-13 judge cost (2 files / 630 LOC) |
| 5 | 06 | DONE | Stage 3 `harness/compare.py` — pure-sync aggregator + comparison.md emitter (9-col tier rollup + 7-col class rollup + footer) (2 files / 647 LOC) |
| 6 | 07 | DONE | README (175 LOC) + live smoke (163 LOC) + Phase 131 close-out; comparison.md DEFERRED to user's first full-corpus run |

## Deviations from Plan

**Total deviations: 1 (intentional, plan-sanctioned).**

### 1. [Plan-sanctioned deferral - DEFERRED outcome] Live smoke not run; comparison.md not generated

- **Found at:** Live-test gate (Task 2, before invoking the smoke).
- **Issue:** Live-test prereqs require a populated retrieval index for any live-capable tier; the sandbox has none. chroma_db/tier-1-naive/ has the structural files but `count=0` (drained by Phase 130-06's live test); tier-2-managed/.store_id is missing; lightrag_storage/tier-3-graph/ directory is empty.
- **Plan's stance:** The plan explicitly accommodates this — `autonomous: false`, with a documented "If the smoke was DEFERRED" branch in Task 2's action: skip comparison.md generation, document the deferral in SUMMARY, leave smoke code shipped + statically verified.
- **Action taken:** Followed the DEFERRED branch verbatim. Smoke test code committed (`d6014f5`); README committed (`314961e`); no comparison.md written; no cost JSONs from a live run exist to commit.
- **Files modified:** None unexpected.
- **Commit:** None for the deferral itself (it's an absence, not an edit).
- **Impact:** Zero — the plan's `autonomous: false` convention exists precisely for this scenario. The user's next action determines the empirical outcome (Options A/B/C in "Path forward" above).

The plan's `<success_criteria>` block accepts BOTH outcomes: "Live smoke run outcome documented: PASSED → comparison.md committed... DEFERRED → no comparison.md created; SUMMARY documents the missing prereq (key/index/sandbox); user runs locally."

## Issues Encountered

- **chroma_db/tier-1-naive/ is structurally present but empty (count=0).** Same finding as Plan 04 SUMMARY (Phase 130-06 drained the index without re-ingesting). Plan 07 inherits this state; cannot run the live smoke without re-ingesting. Plan 04's empirical observation now becomes the Plan 07 deferral cause.
- **No live-capable tier has a populated index in this sandbox.** Tier 2's `.store_id` MISSING; Tier 3's `lightrag_storage/tier-3-graph/` empty. Per Plan 06 SUMMARY's recommendation, pivoting to Tier 2 was considered but doesn't unblock without an ingest step.
- **`UV_CACHE_DIR=/tmp/claude/uv-cache` workaround** still required for all `uv run` invocations (sandbox-level `uv` cache permission shape; Open Q4 in 131-RESEARCH). No code change; documented for users running in the same sandbox.
- **Pre-existing untracked `dataset/manifests/metadata.json` drift** — same as Plans 131-{01..06}. Out of scope; left unstaged. A future docs/dataset commit can address it.

## User Setup Required

To produce the empirical comparison.md (Phase 133 BLOG-04 import target), the user runs ONE of:

1. **In-sandbox re-ingest + smoke** (cheapest path; ~$0.005; <2 min):
   ```bash
   cd /Users/patrykattc/work/git/rag-architecture-patterns
   uv run python tier-1-naive/main.py --ingest --yes
   UV_CACHE_DIR=/tmp/claude/uv-cache uv run pytest evaluation/tests/test_eval_smoke_live.py -v -m live -s
   ```

2. **Local full-corpus run** (recommended for Phase 133; produces complete comparison.md):
   ```bash
   uv pip install -e ".[evaluation,tier-1,tier-2,tier-3,tier-5]"
   python tier-1-naive/main.py --ingest --yes  # if not already populated
   python tier-2-managed/main.py --ingest --yes
   python tier-3-graph/main.py --ingest --yes  # ~$1.00 + ~10 min
   python tier-4-multimodal/scripts/eval_capture.py --yes  # local MineRU
   python -m evaluation.harness.run --tiers 1,2,3,5 --tier-4-from-cache evaluation/results/queries/tier-4-{TS}.json --yes
   python -m evaluation.harness.score --tiers 1,2,3,4,5 --yes
   python -m evaluation.harness.compare --tiers 1,2,3,4,5
   ```

3. **Accept the close-out as-is.** All 135 non-live tests pass; smoke test code is statically verified; Phase 131 ships zero functional gaps in the harness contract. Phase 132 / Phase 133 can begin against the placeholder comparison.md (or wait for the user's full-corpus run).

## Next Phase Readiness

**Phase 132 (Source verification + diagrams) ready** — depends on Phase 131 outcomes; the harness contracts (3 CLIs + comparison.md schema) are locked. Phase 132's StatHighlight components reference `comparison.md` numbers; they can either (a) wait for the user's first run, or (b) ship with placeholder numbers + a "TODO: import from comparison.md" marker.

**Phase 133 (Blog post) ready** — BLOG-04 imports `comparison.md` verbatim; the file's emitter (Plan 06) is locked + tested + reproducible. Phase 133 should NOT begin until comparison.md exists with real data; the user's full-corpus run is the gate.

**No blockers.** Phase 131 closes out at 7/7 plans complete; the live smoke is the user's next action, not a Phase 131 deliverable.

## Phase 131 closing recommendation

**Phase 131 is COMPLETE in code + tests + documentation.** The empirical comparison.md is the user's first full-corpus run output, NOT a Phase 131 deliverable. Phase 132 (Source verification + diagrams) and Phase 133 (Blog post) can either:

1. **Wait for the user's full-corpus run** — produces the real comparison.md; Phase 133 BLOG-04 imports verbatim.
2. **Begin in parallel with placeholder numbers** — ship Phase 132's StatHighlight components + Phase 133's blog draft with `{COMPARISON_MD_PLACEHOLDER}` markers; user fills them in post-eval.

Given the autonomous=false stance of Plan 07 + the user-interactive checkpoint, Option 1 (wait for live smoke or full-corpus run) is the cleanest path. The user decides when to run the live tests; Phase 131 closes out at "shipped + statically verified".

---
*Phase: 131-evaluation-harness*
*Completed: 2026-04-27*

## Self-Check: PASSED

Verification commands run after SUMMARY draft:

```
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/README.md
FOUND: evaluation/README.md (175 LOC)

$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/tests/test_eval_smoke_live.py
FOUND: evaluation/tests/test_eval_smoke_live.py (163 LOC)

$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/results/comparison.md
NOT FOUND: comparison.md (DEFERRED — see Decisions Made + Path forward for the user)

$ git -C /Users/patrykattc/work/git/rag-architecture-patterns log --oneline | grep -E '131-07'
FOUND: 314961e  (Task 1: docs — evaluation/README.md)
FOUND: d6014f5  (Task 2: test — test_eval_smoke_live.py)

$ UV_CACHE_DIR=/tmp/claude/uv-cache uv run pytest -q -m "not live"
PASS: 135 passed, 4 skipped, 10 deselected, 11 warnings in 7.10s
```

Both committed files present on disk; both task commits visible on companion repo `origin/main`; comparison.md absence is the documented DEFERRED state; non-live suite green with zero regressions.
