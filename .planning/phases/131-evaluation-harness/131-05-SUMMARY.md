---
phase: 131-evaluation-harness
plan: 05
subsystem: evaluation
tags: [stage-2, harness, score.py, ragas-0.4.3, judge-llm-litellm-openrouter, nan-short-circuit, batch-size-10, d-13-judge-cost]

requires:
  - phase: 131-evaluation-harness
    plan: 01
    provides: "EvalRecord/QueryLog/ScoreRecord schema; read_query_log helper; empirical confirmation that ragas.cost.get_token_usage_for_openai imports cleanly; ragas.embeddings.base.embedding_factory is the correct path"
  - phase: 131-evaluation-harness
    plan: 04
    provides: "evaluation/results/queries/{tier}-{ts}.json shape (Stage 1 capture); _latest-by-mtime auto-discovery convention"
  - phase: 127-repository-skeleton-enterprise-dataset
    provides: "shared/cost_tracker.py D-13 schema; shared/pricing.py PRICES (google/gemini-2.5-flash + openai/text-embedding-3-small)"

provides:
  - "evaluation/harness/score.py — Stage 2 RAGAS scoring entry point: `python -m evaluation.harness.score --tiers 1,2,3,5 --yes` reads per-tier QueryLog JSONs, builds ragas.EvaluationDataset of SingleTurnSample, calls ragas.evaluate() with [faithfulness, answer_relevancy, context_precision], persists per-tier metrics JSONs"
  - "Judge LLM + embedder via OpenRouter LiteLLM: llm_factory(JUDGE_LLM_SLUG, provider='litellm', client=litellm.completion); embedding_factory('litellm', model=JUDGE_EMB_SLUG)"
  - "NaN short-circuit branches (4): empty_contexts (Pitfall 2), agent_truncated (Pitfall 8), tier4_unavailable, cached_miss — all skip the judge call entirely (zero cost paid for known-bad records)"
  - "Judge cost capture via shared.cost_tracker.CostTracker(f'ragas-judge-tier-{N}') (Pattern 2; collision-free vs Plan 04's tier-{N}-eval); D-13 JSON written to evaluation/results/costs/ragas-judge-tier-{N}-{ts}.json"
  - "8-flag argparse: --queries-dir, --output-dir, --tiers, --judge-model, --judge-emb, --batch-size, --limit, --yes; build_parser() module-level so tests can introspect"
  - "evaluation/tests/test_eval_score.py — 11 non-live tests covering all 4 short-circuit branches + passthrough + helpers + persistence + full-short-circuit run + CLI --help"

affects: [131-06, 131-07, 133-blog-publication]

tech-stack:
  added: []  # all surfaces from Plans 131-{01,02,03,04} + Phase 127; no new pyproject deps
  patterns:
    - "Pattern 1: ScoreRecord shape persisted as list[dict] indent-2 JSON; nan_reason populated for short-circuited rows"
    - "Pattern 2: judge cost via shared.cost_tracker — same accounting infra as tier costs"
    - "Pattern 6: judge LLM/embedder via litellm + OpenRouter (single OPENROUTER_API_KEY routes all judge work)"
    - "Pitfall 2 mitigation: empty retrieved_contexts → ScoreRecord(nan_reason='empty_contexts') BEFORE evaluate() is called"
    - "Pitfall 3 mitigation: batch_size=10 to evaluate() — bounds judge concurrency/cost"
    - "Pitfall 5 mitigation: single asyncio.run(amain(...)) boundary; RAGAS handles its own internal async"
    - "Pitfall 8 mitigation: error='max_turns_exceeded' → ScoreRecord(nan_reason='agent_truncated') BEFORE evaluate()"
    - "Pitfall 11 mitigation: tier string `ragas-judge-tier-{N}` distinct from Plan 04's `tier-{N}-eval` — no D-13 filename collision"

key-files:
  created:
    - "../rag-architecture-patterns/evaluation/harness/score.py"
    - "../rag-architecture-patterns/evaluation/tests/test_eval_score.py"
  modified: []

key-decisions:
  - "Lazy import of ragas / litellm inside score_query_log + _build_judge keeps `python -m evaluation.harness.score --help` responsive (~ms instead of ~3s for first ragas import)"
  - "_to_float_or_none defensive helper maps NaN / None / pandas-NA / non-numeric strings → Optional[float] uniformly — survives ragas 0.4.x patch drift in result.scores vs result.to_pandas()"
  - "Token usage extraction is doubly defensive: result.total_tokens() may not exist on every 0.4.x patch (hasattr check); usage.input_tokens may be 0 / None (getattr-with-default)"
  - "_short_circuit_nan branch order: agent_truncated → empty_contexts → tier4_unavailable → cached_miss. Reordering matters for the empty-contexts-PLUS-tier4-error case; Plan calls this out (test test_short_circuit_tier4_unavailable accepts either return value)"
  - "Cost-surprise gate uses ~$0.003/q × n_records ballpark (3 metrics × ~3 internal LLM calls × ~$0.0003/call); --yes bypasses; aborts exit 1 on user 'no'"
  - "Judge pricing key derives from --judge-model via _strip_openrouter_prefix (Pattern 7 — PRICES uses provider-only slugs like `google/gemini-2.5-flash`)"
  - "score.py preserves the source query log's timestamp when naming the metrics JSON: `metrics/tier-{N}-{queryts}.json` — Plan 06's compare.py can join queries→metrics by timestamp directly (or use most-recent by mtime; the latter is the recommended pattern)"

patterns-established:
  - "Pattern 1 verified for ScoreRecord persistence: the JSON shape Plan 06's compare.py will read is `[{question_id, faithfulness, answer_relevancy, context_precision, nan_reason}, ...]` with None for short-circuited rows + nan_reason set"
  - "Pattern 6 verified empirically: ragas.llms.llm_factory + ragas.embeddings.base.embedding_factory + ragas.cost.get_token_usage_for_openai all import cleanly in 0.4.3 (matches Plan 01 SUMMARY's empirical findings)"
  - "Cost-surprise gate convention now applies to BOTH stages: Plan 04 (tier inference cost) and Plan 05 (judge cost); both prompt unless --yes"

duration: 3min 3sec
completed: 2026-04-27
---

# Phase 131 Plan 05: RAGAS Scoring Pipeline (Stage 2) Summary

**`evaluation/harness/score.py` ships the Stage 2 entry point — reads per-tier QueryLog JSONs from Plan 04, builds `ragas.EvaluationDataset`, runs `evaluate()` with the 3 locked metrics under a LiteLLM/OpenRouter judge with `batch_size=10`, persists per-tier metrics JSONs, and records judge cost via `CostTracker('ragas-judge-tier-{N}')`. NaN short-circuits for empty contexts (Pitfall 2) and agent truncation (Pitfall 8) skip the judge entirely — zero cost paid for known-bad records. 11 non-live tests pass; full suite 125 passed / 4 skipped / 9 deselected (was 114/4/9 → +11).**

## Performance

- **Duration:** 3 min 3 sec
- **Started:** 2026-04-27T11:53:06Z
- **Completed:** 2026-04-27T11:56:09Z
- **Tasks:** 2
- **Files modified:** 2 created, 0 modified

## Accomplishments

- **`evaluation/harness/score.py` (408 LOC)** — Stage 2 entry point of the harness:
  - argparse with 8 flags (`--queries-dir`, `--output-dir`, `--tiers`, `--judge-model`, `--judge-emb`, `--batch-size`, `--limit`, `--yes`); `build_parser()` exposed module-level so tests introspect flags without invoking `main()`.
  - **Single `asyncio.run(amain(args, Console()))` boundary** at top level (Pitfall 5); RAGAS's `evaluate()` handles its own internal asyncio nesting (`allow_nest_asyncio=True` default).
  - **Lazy import of `ragas` / `litellm`** inside `score_query_log` + `_build_judge` — keeps `--help` responsive (no 3s ragas-import penalty for CLI introspection).
  - **`_short_circuit_nan(rec)` — 4 branches** (in order): `error == 'max_turns_exceeded'` → `agent_truncated`; empty `retrieved_contexts` → `empty_contexts`; `error.startswith('tier4_import_error')` → `tier4_unavailable`; `error.startswith('cached_miss')` → `cached_miss`. Returns `None` to pass through (RAGAS scores it).
  - **`score_query_log(log, golden_qa_index, judge_llm, judge_emb, batch_size, raise_exceptions)`** — async; preserves original record indices when mapping back from RAGAS results; uses `result.to_pandas()` if available, else `result.scores` fallback (defensive against 0.4.x patch drift).
  - **`evaluate(metrics=[faithfulness, answer_relevancy, context_precision], llm=judge_llm, embeddings=judge_emb, token_usage_parser=get_token_usage_for_openai, batch_size=10, raise_exceptions=False, show_progress=True)`** — exactly the surface 131-RESEARCH planned.
  - **`_build_judge(judge_model, judge_emb)`** — fallback for `embedding_factory` location (`.base` confirmed primary per Plan 01 SUMMARY; top-level alias kept as forward-compat ImportError catch).
  - **Token usage extraction defensive**: `result.total_tokens()` may not exist on every 0.4.x patch (`hasattr` check); `usage.input_tokens` / `.output_tokens` use `getattr(..., 0) or 0`.
  - **`amain(args, console)` flow:** fast-fail on missing OPENROUTER_API_KEY (exit 2); fast-fail on missing queries_dir (exit 2; points at `python -m evaluation.harness.run`); fast-fail on missing golden_qa.json (exit 2); validate `--tiers` (exit 2 on unsupported); discover latest query log per tier (yellow skip if none); abort exit 1 if nothing found; cost-surprise gate (unless `--yes`); build judge LLM/embedder; per-tier serial scoring loop; persist metrics; record judge cost via `CostTracker(f'ragas-judge-tier-{N}')`; persist judge cost JSON; return 0.
  - **Metrics JSON naming:** `metrics/tier-{N}-{queryts}.json` — preserves the source query log's timestamp so Plan 06's `compare.py` can join queries→metrics by timestamp OR by most-recent-by-mtime (both work; the latter is recommended per Plan 04's hand-off).

- **`evaluation/tests/test_eval_score.py` (222 LOC)** — 11 non-live tests, all pass in <5s:
  - `test_short_circuit_empty_contexts` — Pitfall 2 verified
  - `test_short_circuit_agent_truncated` — Pitfall 8 verified
  - `test_short_circuit_tier4_unavailable` — empty contexts + tier4_import_error → either `empty_contexts` or `tier4_unavailable` is acceptable (current order yields `empty_contexts` first)
  - `test_short_circuit_tier4_unavailable_with_contexts` — populated contexts + tier4_import_error → deterministically `tier4_unavailable`
  - `test_short_circuit_cached_miss` — populated contexts + cached_miss → `cached_miss`
  - `test_short_circuit_passthrough` — populated contexts + no error → returns None
  - `test_to_float_or_none` — None / float / numeric str / NaN / non-numeric all map correctly
  - `test_persist_metrics(tmp_path)` — JSON shape Plan 06 will read; nan rows have None metrics + nan_reason set
  - `test_strip_openrouter_prefix` — Pattern 7 helper covers all 3 cases
  - `test_score_query_log_all_short_circuit` — every record short-circuits → `usage['n_scored']=0`, `usage['input_tokens']=0` (PROVES no judge call paid)
  - `test_cli_help_exits_zero` — argparse `SystemExit(0)` on `--help`

- **Full non-live suite green:** 125 passed / 4 skipped / 9 deselected (was 114/4/9 at end of Plan 131-04 → exactly +11 from this plan; no regressions). Wall time 7.27s.

## Task Commits

Each task was committed atomically and pushed to `origin/main` in companion repo `/Users/patrykattc/work/git/rag-architecture-patterns`:

1. **Task 1: evaluation/harness/score.py** — `5e40620` (feat)
   - `feat(131-05): harness/score.py — RAGAS scoring (judge LiteLLM/OpenRouter; NaN short-circuits; D-13 judge cost)`
   - 1 file changed, 408 insertions(+)
2. **Task 2: evaluation/tests/test_eval_score.py** — `6d7b4d7` (test)
   - `test(131-05): non-live tests for harness/score.py — NaN short-circuits, persistence, --help`
   - 1 file changed, 222 insertions(+)

**Plan metadata commit (this SUMMARY + STATE + ROADMAP):** in PatrykQuantumNomad repo, separate from companion-repo task commits.

## Files Created/Modified

### Companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`)

- `evaluation/harness/score.py` — **408 LOC** (≥200 required). 8-flag argparse + RAGAS judge wiring + 4-branch NaN short-circuit + per-tier scoring loop + judge cost via D-13.
- `evaluation/tests/test_eval_score.py` — **222 LOC** (≥70 required). 11 non-live tests; <5s wall time.

### Planning repo (`/Users/patrykattc/work/git/PatrykQuantumNomad`)

- `.planning/phases/131-evaluation-harness/131-05-SUMMARY.md` (this file)
- `.planning/STATE.md` (updated by metadata commit — Plan 5/7 done; status moves to Wave 5 ready)
- `.planning/ROADMAP.md` (Phase 131 plan progress 5/7)

## Decisions Made

- **Lazy import of `ragas` / `litellm`** inside `score_query_log` + `_build_judge`. Importing `ragas` at module top-level adds ~3s to `--help` invocation due to its transitive `langchain` + `pydantic-ai` imports. Lazy imports keep CLI introspection responsive while paying the cost only when scoring actually runs.
- **`_short_circuit_nan` branch order**: `agent_truncated` first (deterministic on error string), then `empty_contexts`, then `tier4_unavailable`, then `cached_miss`. The order matters for the empty-contexts-PLUS-tier4-error case (current order yields `empty_contexts` first). The test `test_short_circuit_tier4_unavailable` accepts either return value to keep the contract loose; `test_short_circuit_tier4_unavailable_with_contexts` pins down the deterministic case.
- **Cost-surprise gate uses ~$0.003/q × n_records ballpark** (3 metrics × ~3 internal LLM calls per metric × ~$0.0003/call from Plan 01's PRICES verification of `google/gemini-2.5-flash`). For 30 questions × 4 tiers = 120 records, the prompt would show ~$0.36 — close to the planned 131-RESEARCH ballpark of $0.18-$0.50. The actual logged cost in the D-13 JSON is the empirical truth.
- **`metrics/tier-{N}-{queryts}.json` naming** preserves the source query log's timestamp (NOT regenerated). Plan 06's `compare.py` can join queries→metrics by timestamp directly OR use most-recent-by-mtime (the latter mirrors Plan 04's auto-discovery; recommended for compare.py per Plan 04's hand-off note).
- **Judge cost extraction is doubly defensive**: `result.total_tokens()` may not exist on every 0.4.x patch (`hasattr` check); `usage.input_tokens` / `.output_tokens` use `getattr(..., 0) or 0`. Worst case (no usage info available) → tracker records 0 tokens / $0 USD; the cost JSON is still written (D-13 schema honored), just with empty queries.
- **`tracker.record_llm` wrapped in try/KeyError**: defensive against PRICES drift (if a future judge model isn't in PRICES, the tracker leaves itself empty rather than raising).

## Empirical Findings (for downstream plans)

### Verbatim `--help` output

```
$ uv run python -m evaluation.harness.score --help
usage: score.py [-h] [--queries-dir QUERIES_DIR] [--output-dir OUTPUT_DIR]
                [--tiers TIERS] [--judge-model JUDGE_MODEL]
                [--judge-emb JUDGE_EMB] [--batch-size BATCH_SIZE]
                [--limit LIMIT] [--yes]

Phase 131 Stage 2 — RAGAS scoring of per-tier QueryLog JSONs.

options:
  -h, --help            show this help message and exit
  --queries-dir QUERIES_DIR
                        Directory holding {tier}-{timestamp}.json files.
  --output-dir OUTPUT_DIR
                        Parent of metrics/ + costs/. (Default:
                        evaluation/results.)
  --tiers TIERS         Comma-separated tier numbers to score. Default: all 5.
  --judge-model JUDGE_MODEL
                        LiteLLM judge slug. Default:
                        openrouter/google/gemini-2.5-flash.
  --judge-emb JUDGE_EMB
                        LiteLLM embedder slug. Default:
                        openrouter/openai/text-embedding-3-small.
  --batch-size BATCH_SIZE
                        evaluate() batch_size (Pitfall 3 — bounds
                        concurrency). Default: 10.
  --limit LIMIT         Truncate each tier's records to first N (smoke).
  --yes                 Skip cost-surprise prompt.
```

### Verbatim fast-fail smokes

**1. Missing OPENROUTER_API_KEY (judge LLM):**
```
$ OPENROUTER_API_KEY="" uv run python -m evaluation.harness.score --tiers 1 --yes
OPENROUTER_API_KEY not set — judge LLM cannot run.
exit=2
```

**2. Missing queries_dir:**
```
$ OPENROUTER_API_KEY="dummy" uv run python -m evaluation.harness.score --queries-dir /nonexistent --tiers 1 --yes
queries_dir not found: /nonexistent
Run `python -m evaluation.harness.run --tiers 1,2,3,5 --yes` first.
exit=2
```

### Empirical RAGAS import surface (confirms Plan 01 SUMMARY)

Re-verified at the top of Task 1 with the same probe Plan 01 used:

```python
from ragas import evaluate, EvaluationDataset, SingleTurnSample           # OK
from ragas.metrics import faithfulness, answer_relevancy, context_precision  # OK (deprecation warning)
from ragas.llms import llm_factory                                         # OK
from ragas.embeddings.base import embedding_factory                        # OK (primary path)
from ragas.cost import get_token_usage_for_openai                          # OK — Open Q1 RESOLVED YES
```

**Path locked:** `from ragas.embeddings.base import embedding_factory` is the primary; `_build_judge` keeps a fallback to `from ragas.embeddings import embedding_factory` for forward-compat with future patches that may relocate the symbol.

**Open Q1 (131-RESEARCH) re-confirmed RESOLVED YES:** `get_token_usage_for_openai` exists in `ragas==0.4.3`. No custom parser required.

**Forward-compat note:** All 3 metric imports emit `DeprecationWarning: Importing X from 'ragas.metrics' is deprecated and will be removed in v1.0. Please use 'ragas.metrics.collections' instead.` This matches Plan 01 SUMMARY's observation. Migration to `ragas.metrics.collections` is recommended before the eventual ragas 1.0 release; both paths work in 0.4.3.

### OPTIONAL real live smoke

**Run:** NO — deferred to Plan 07.

**Why deferred:**
1. **No tier-1 query log exists** in `evaluation/results/queries/` in this venv. Plan 04's optional smoke wrote `evaluation/results/queries/tier-1-2026-04-27T11_47_09Z.json` but it isn't tracked (`.gitignore` ignores `evaluation/results/queries/`) and the Plan 04 executor's tmp state didn't persist to this Plan 05 executor's filesystem.
2. **`OPENROUTER_API_KEY` is unset** in this executor environment (verified: `key UNSET`).
3. The cost-bearing live drive is out of scope for Plan 05's "ship the entry point" objective — Plan 07's smoke (the cheapest live tier × 1 question end-to-end) covers it.

**What this means for Plan 07:** the live smoke must (a) produce a tier-1 query log via `python -m evaluation.harness.run --tiers 1 --limit 1 --yes` (after re-ingesting `chroma_db/tier-1-naive/` if Plan 130-06's index drain still applies), THEN (b) run `python -m evaluation.harness.score --tiers 1 --limit 1 --yes`, THEN (c) verify the metrics JSON has 3 non-None floats for the 1 record, AND the judge cost JSON shows USD > 0.

**Open Q resolution deferred to Plan 07:**
- **A2 (does `get_token_usage_for_openai` parse OpenRouter responses?)** — UNKNOWN; the import works (verified above), but the parser's behavior on OpenRouter response shape will only be confirmed when judge cost > 0 in Plan 07's live smoke.
- **A6 (does `EvaluationResult.to_pandas()` work in 0.4.3?)** — UNKNOWN; the `hasattr` defensive check handles either branch, but Plan 07's live smoke will exercise exactly one path and reveal the truth.

### Test results verbatim

```
$ uv run pytest evaluation/tests/test_eval_score.py -v
============================= test session starts ==============================
platform darwin -- Python 3.13.1, pytest-8.4.2, pluggy-1.6.0
rootdir: /Users/patrykattc/work/git/rag-architecture-patterns
configfile: pyproject.toml
plugins: langsmith-0.7.37, anyio-4.13.0
collected 11 items

evaluation/tests/test_eval_score.py::test_short_circuit_empty_contexts PASSED [  9%]
evaluation/tests/test_eval_score.py::test_short_circuit_agent_truncated PASSED [ 18%]
evaluation/tests/test_eval_score.py::test_short_circuit_tier4_unavailable PASSED [ 27%]
evaluation/tests/test_eval_score.py::test_short_circuit_tier4_unavailable_with_contexts PASSED [ 36%]
evaluation/tests/test_eval_score.py::test_short_circuit_cached_miss PASSED [ 45%]
evaluation/tests/test_eval_score.py::test_short_circuit_passthrough PASSED [ 54%]
evaluation/tests/test_eval_score.py::test_to_float_or_none PASSED        [ 63%]
evaluation/tests/test_eval_score.py::test_persist_metrics PASSED         [ 72%]
evaluation/tests/test_eval_score.py::test_strip_openrouter_prefix PASSED [ 81%]
evaluation/tests/test_eval_score.py::test_score_query_log_all_short_circuit PASSED [ 90%]
evaluation/tests/test_eval_score.py::test_cli_help_exits_zero PASSED     [100%]

======================== 11 passed, 6 warnings in 4.68s ========================
```

(The 6 warnings are the `ragas.metrics` → `ragas.metrics.collections` deprecation warnings, surfaced because `test_score_query_log_all_short_circuit` imports them at module-import time. These are Plan-01-known and forward-compat-only; do not block.)

### Full non-live suite

```
$ uv run pytest -q -m "not live"
125 passed, 4 skipped, 9 deselected, 11 warnings in 7.27s
```

Up from 114 / 4 / 9 (131-04 hand-off baseline). +11 new = the 11 cases in test_eval_score.py.

### LOC counts

| File | LOC | Min required |
|---|---|---|
| `evaluation/harness/score.py` | 408 | 200 |
| `evaluation/tests/test_eval_score.py` | 222 | 70 |

Both well over min.

### Pricing surface (Pattern 7 — no edits)

`shared/pricing.py` already contains both judge slugs (verified at Task 1 start):
- `openai/text-embedding-3-small` (line 36) — judge embedder
- `google/gemini-2.5-flash` (line 40) — judge LLM

No edits to `shared/pricing.py` were needed. `_strip_openrouter_prefix` strips the `openrouter/` prefix before PRICES lookup.

## Deviations from Plan

None — plan executed exactly as written.

The plan's verbatim `<interfaces>` block compiled and ran without modification. All 11 tests pass on first run; both fast-fails (no API key, missing queries_dir) return exit 2 with the planned messages. The optional live smoke is deferred to Plan 07 per the plan's "if executor lacks key/log, skip" branch.

The plan called for **8 tests** in `test_eval_score.py`; this executor authored **11 tests** by splitting the tier4_unavailable case into two (acceptance-set + deterministic) and adding `test_short_circuit_cached_miss` + `test_strip_openrouter_prefix`. This is additive coverage, not a deviation from intent — the plan explicitly listed all 4 short-circuit branches (empty_contexts, agent_truncated, tier4_unavailable, cached_miss) and the test file simply covers each branch with a dedicated test plus the helper functions.

## Issues Encountered

- **Pre-existing untracked `dataset/manifests/metadata.json` drift** — same as Plans 131-{01,02,03,04}. Out of scope; left unstaged.
- **`UV_CACHE_DIR=/tmp/claude/uv-cache` workaround** still required for all `uv run` invocations (sandbox-level uv cache permission shape; Open Q4 in 131-RESEARCH). No code change.
- **OMP warning** (`Function Can't set size of /tmp file failed`) on the first ragas import probe in this venv — informational only; ragas import succeeded. Does not affect functional correctness.
- **No tier-1 query log on disk** — Plan 04's optional smoke wrote one but it isn't tracked in git (the `evaluation/results/queries/` dir is gitignored per Plan 01) and didn't persist into this executor's environment. The optional live drive of `score.py` is therefore deferred to Plan 07.

## User Setup Required

None — no external service configuration required for this plan. All 11 tests are non-live; the cost-bearing live drive is deferred to Plan 07.

When the user (or Plan 07) runs `python -m evaluation.harness.score --tiers 1,2,3,5 --yes` for real, they need:
1. `OPENROUTER_API_KEY` in `.env` (already required by Plans 128/129/130/131-04 — no new key needed)
2. At least one `tier-{N}-{ts}.json` in `evaluation/results/queries/` (produced by `python -m evaluation.harness.run`)
3. `evaluation/golden_qa.json` (already present)

## Next Phase Readiness

**Plan 131-06 (compare.py — comparison.md generator) unblocked.** Plan 06 reads:
- `evaluation/results/queries/tier-{N}-{ts}.json` from Plan 04 (latency, cost_usd_at_capture, error)
- `evaluation/results/metrics/tier-{N}-{ts}.json` from Plan 05 (faithfulness, answer_relevancy, context_precision, nan_reason)
- `evaluation/results/costs/tier-{N}-eval-{ts}.json` from Plan 04 (tier inference cost)
- `evaluation/results/costs/ragas-judge-tier-{N}-{ts}.json` from Plan 05 (judge cost — informational; not blended into per-tier cost columns)

**Recommendation for Plan 06's join logic:** use **most-recent-by-mtime per tier** for both queries and metrics. This mirrors Plan 04's `_latest_query_log` pattern AND Plan 05's `_latest_query_log` (re-used). Joining by exact timestamp would fail when Stage 2 runs minutes after Stage 1 and the user re-runs only Stage 2 with a tighter `--limit` (the metrics file's timestamp matches the source query log's, but compare.py shouldn't depend on that exact match — `_latest_query_log` for queries + `_latest_metrics_log` for metrics is the cleaner contract).

**Open question handed forward to Plan 06:** how should compare.py present the judge cost? Options:
- (a) **Footnote-only** — judge cost is meta-cost (Stage 2 tooling cost, not Stage 1 tier cost); recommend a single "Total RAGAS judge cost: \$X.XXXX (informational)" line in the comparison.md footer.
- (b) **Per-tier judge column** — break out per-tier judge cost; risks confusing readers who think judge cost is "tier cost".
- (c) **Blended** — sum tier inference cost + judge cost into a single per-tier figure; rejected because it conflates unrelated costs.

**Recommendation: option (a)** — footnote-only. Phase 133 BLOG-04 imports comparison.md verbatim and the audience benefits from a clean per-tier cost column without judge-cost contamination.

**No blockers.** Wave 4 (Plan 05) is complete; Wave 5 (Plan 06) can begin.

---
*Phase: 131-evaluation-harness*
*Completed: 2026-04-27*

## Self-Check: PASSED

Verification commands run after SUMMARY draft:

```
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/harness/score.py
FOUND: score.py

$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/tests/test_eval_score.py
FOUND: test_eval_score.py

$ git -C /Users/patrykattc/work/git/rag-architecture-patterns log --oneline | grep -E '131-05'
FOUND: 5e40620  (Task 1: feat — harness/score.py)
FOUND: 6d7b4d7  (Task 2: test — test_eval_score.py)
```

Both files present on disk; both task commits visible on companion repo `origin/main`.
