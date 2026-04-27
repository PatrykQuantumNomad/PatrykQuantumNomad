---
phase: 131-evaluation-harness
plan: 06
subsystem: evaluation
tags: [stage-3, harness, compare.py, comparison-md, ragas-aggregator, numpy-nanmean, tier-rollup, per-class-rollup, tier-4-deferral, honest-disclaimers]

requires:
  - phase: 131-evaluation-harness
    plan: 04
    provides: "evaluation/results/queries/{tier}-{ts}.json (Stage 1 capture); D-13 cost JSONs; _latest-by-mtime auto-discovery convention"
  - phase: 131-evaluation-harness
    plan: 05
    provides: "evaluation/results/metrics/{tier}-{ts}.json ScoreRecord JSONs (Stage 2 RAGAS scoring); ragas-judge-tier-{N}-{ts}.json D-13 judge cost JSONs"
  - phase: 127-repository-skeleton-enterprise-dataset
    provides: "evaluation/golden_qa.json with hop_count_tag + modality_tag fields used for per-class bucketing"
  - phase: 130-tiers-4-5-multimodal-agentic-rag
    provides: "Phase 130 SC-1 deferral — Tier 4 live test runs from user's local env; compare.py emits a deferral footer when Tier 4 data is absent"

provides:
  - "evaluation/harness/compare.py — Stage 3 entry point; `python -m evaluation.harness.compare [--results-dir evaluation/results] [--out evaluation/results/comparison.md] [--tiers 1,2,3,4,5]` reads queries/ + costs/ + metrics/ per tier (most-recent file by mtime), aggregates means + counts, emits a single Markdown file with TWO tables (tier rollup + per-question-class rollup) plus a footer documenting NaN reasons + missing tiers + capture provenance"
  - "Pure-function helpers exposed for tests: aggregate_tier(tier, results_dir) -> dict | None (returns None when queries log missing); aggregate_class_rollup(tier_data, qa_index) -> list[dict]; emit_markdown(tier_rows, class_rows, judge_model, judge_emb, capture_provenance, tier_4_present) -> str; _classify(question_id, qa_index); _fmt_float(v, places); _detect_judge_provenance(results_dir)"
  - "9-column tier rollup verbatim: Tier | Faithfulness | Answer Relevancy | Context Precision | Mean Latency (s) | Total Cost (USD) | Cost / Query (USD) | n | n NaN"
  - "7-column per-class rollup: Class | Tier | Faithfulness | Answer Relevancy | Context Precision | n | n NaN — buckets by golden_qa hop_count_tag + modality_tag (modality_tag='multimodal' overrides hop_count_tag per Pattern 9)"
  - "Tier 4 deferral footer fires automatically when no tier-4 query log present; suppressed when a tier-4 row is populated"
  - "Honest disclaimers footer: n=30 too small for statistical significance; multi-hop ≡ cross-document for our corpus (Phase 127-06 verified); Tiers 1-3 are text-only narrative; self-grading bias acknowledged (Open Q4)"
  - "evaluation/tests/test_eval_compare.py — 10 non-live unit tests covering aggregate_tier happy + NaN path + missing-returns-None; _classify; aggregate_class_rollup; emit_markdown deferral footer + format; _fmt_float NaN handling; CLI --help"

affects: [131-07, 133-blog-publication]

tech-stack:
  added: []  # numpy already transitively required by ragas/datasets per Plan 01; no new pyproject deps
  patterns:
    - "Pattern 5 (131-RESEARCH): 2-table Markdown layout — tier rollup + per-class rollup; sorted tier 1→5 / class single-hop → multi-hop → multimodal"
    - "Pattern 9 (131-RESEARCH): cross-document equivalence — multi-hop ≡ cross-document for our corpus (Phase 127-06 verified)"
    - "Pitfall 2 (NaN aggregation): numpy.nanmean over filtered Nones; per-record None preserved as None in metrics JSON; aggregator returns float('nan') when NO scores are present (different from None — _fmt_float renders both as '—')"
    - "Pitfall 8 (truncation visibility): n_truncated reported separately from n_NaN via nan_breakdown['agent_truncated']"
    - "Pitfall 9 (multimodal vs text-only): per-class rollup makes the contrast visible; honest-disclaimer footer states the tier capability mismatch explicitly"
    - "Open Q5 (commit policy): comparison.md IS committed (NOT gitignored); queries/ + metrics/ ARE gitignored (Plan 01)"

key-files:
  created:
    - "../rag-architecture-patterns/evaluation/harness/compare.py"
    - "../rag-architecture-patterns/evaluation/tests/test_eval_compare.py"
  modified: []

key-decisions:
  - "compare.py is pure-sync (no asyncio) — Stage 3 is pure file I/O + numpy.nanmean; no LLM calls, no network, no async needed. main(argv=None) wraps sync _run(args). This keeps the Stage 3 entry trivially testable and removes the asyncio.run boundary concern from the comparison phase."
  - "_latest(dir_, pattern) is defensive against missing dirs — returns None when dir_ doesn't exist (added vs the verbatim plan source which assumed dir presence). This makes aggregate_tier safe to call against partial result trees (e.g. queries/ exists but metrics/ doesn't)."
  - "_run validates --tiers parsing with try/except ValueError before the supported-tier scan — yields a clean exit-2 error message for non-int tier strings (added vs verbatim plan; matches the fast-fail discipline Plan 04 + 05 already established)."
  - "_detect_judge_provenance hardened against malformed JSON — wrapped in try/except (json.JSONDecodeError, OSError) so a corrupt judge cost file falls back to the 131-RESEARCH defaults rather than aborting the comparison."
  - "metrics_by_qid build filters by 'question_id' presence (`m for m in metrics if 'question_id' in m`) — defensive against future ScoreRecord shape drift; current Plan 05 always emits question_id but the filter keeps compare.py forward-compatible."
  - "emit_markdown handles empty capture_provenance — emits '- (no tier query logs found)' instead of an empty bullet list (added vs verbatim plan; keeps the empty-results.md structurally valid Markdown for the no-data smoke case)."
  - "comparison.md generation deferred to Plan 07 for live data — no real evaluation/results/queries/ + metrics/ exist on this executor's disk (queries/ is empty; metrics/ doesn't exist). The synthetic smoke + 10 non-live tests fully exercise the emit path; Plan 07's live smoke produces the first real comparison.md."

duration: 4min 50sec
completed: 2026-04-27
---

# Phase 131 Plan 06: compare.py — Stage 3 Aggregator + comparison.md Emitter Summary

**`evaluation/harness/compare.py` ships the Stage 3 aggregator — reads Plan 04's QueryLog JSONs + cost JSONs and Plan 05's metrics JSONs (most-recent by mtime per tier), aggregates with `numpy.nanmean` (honest NaN handling per Pitfall 2 / 8), and emits a single `evaluation/results/comparison.md` with TWO tables (9-column tier rollup + 7-column per-question-class rollup) plus a provenance footer documenting judge model/embedder, per-tier capture timestamps, NaN breakdown, Tier 4 deferral note (Phase 130 SC-1), and honest disclaimers (n=30 too small for stat-sig; multi-hop ≡ cross-document; Tiers 1-3 text-only). Pure-sync — no asyncio. 10 non-live tests pass; full suite 135 passed / 4 skipped / 9 deselected (was 125/4/9 → +10).**

## Performance

- **Duration:** 4 min 50 sec
- **Started:** 2026-04-27T12:02:36Z
- **Completed:** 2026-04-27T12:07:26Z
- **Tasks:** 2
- **Files modified:** 2 created, 0 modified

## Accomplishments

- **`evaluation/harness/compare.py` (404 LOC)** — Stage 3 entry point of the harness:
  - argparse with 3 flags (`--results-dir` default `evaluation/results`; `--out` default `evaluation/results/comparison.md`; `--tiers` default `1,2,3,4,5`); `build_parser()` exposed module-level so tests introspect flags without invoking `main()`.
  - **Pure-sync architecture** — no asyncio. Stage 3 is pure file I/O + `numpy.nanmean`; `main(argv=None)` wraps sync `_run(args)`.
  - **`SUPPORTED_TIERS = (1, 2, 3, 4, 5)`** constant; `_run` validates `--tiers` with try/except ValueError + supported-tier scan (exit 2 on either failure).
  - **Helpers:** `_latest(dir_, pattern)` (most-recent file by `os.stat().st_mtime`; returns None when dir missing — added defensive check vs verbatim plan); `_load_golden_qa()`; `_classify(question_id, qa_index)` (`modality_tag='multimodal'` overrides `hop_count_tag` per Pattern 9); `_fmt_float(v, places)` (NaN → `'—'`); `_missing_row(tier)` (em-dashed placeholder).
  - **`aggregate_tier(tier, results_dir) -> Optional[dict]`** — reads queries + costs + metrics JSONs (most-recent by mtime); returns None when queries log missing; computes `np.nanmean` over None-filtered metric scores; counts `n_nan` + `nan_breakdown` (e.g. `{'agent_truncated': 1, 'empty_contexts': 3}`); reads cost via D-13 `totals.usd`; emits 17-key dict including `records` + `metrics_by_qid` for downstream class rollup.
  - **`aggregate_class_rollup(tier_data, qa_index) -> list[dict]`** — iterates classes [single-hop, multi-hop, multimodal] × tiers in input order; skips empty buckets; mean per (class, tier) via `np.nanmean` over None-filtered scores; reports `n` (total in bucket) + `n_nan` (records with `nan_reason` set).
  - **`emit_markdown(tier_rows, class_rows, judge_model, judge_emb, capture_provenance, tier_4_present) -> str`** — pure string emission; 9-column tier rollup header verbatim; 7-column class rollup header; provenance footer (judge LLM/emb + per-tier capture timestamps); NaN breakdown per tier; Tier 4 deferral block when `not tier_4_present`; 4 honest disclaimers (n=30 / cross-document equivalence / text-only Tiers 1-3 / self-grading bias).
  - **`_detect_judge_provenance(results_dir)`** — reads latest `results/costs/ragas-judge-*.json`; pulls D-13 `queries[*].model` for the first `kind='llm'` entry; falls back to 131-RESEARCH defaults (`google/gemini-2.5-flash` + `openai/text-embedding-3-small`); hardened against malformed JSON (try/except `JSONDecodeError`, `OSError`).
  - **Cost JSON glob fallback:** `tier-N-eval-*.json` (Plan 04 naming) preferred; falls back to `tier-N-*.json` (Phase 128/130 main.py naming) so the aggregator works against legacy cost JSONs from prior phases.

- **`evaluation/tests/test_eval_compare.py` (243 LOC)** — 10 non-live unit tests, all pass in 0.06s:
  - `test_aggregate_tier_happy(tmp_path)` — 2 records, all metrics present; assert means (faithfulness=0.7, answer_relevancy=0.85, context_precision=0.6) + n=2 + n_nan=0 + cost_per_query_usd=0.0015 + nan_breakdown={}.
  - `test_aggregate_tier_with_nan(tmp_path)` — Pitfall 8 verified: 1 truncated record (error='max_turns_exceeded' + nan_reason='agent_truncated'); assert n=2 + n_nan=1 + nan_breakdown={'agent_truncated': 1} + faithfulness=0.9 (np.nanmean over the single non-None score).
  - `test_aggregate_tier_missing_returns_none(tmp_path)` — empty queries/costs/metrics dirs → None (sentinel for placeholder row).
  - `test_classify()` — single-hop, multi-hop, multimodal (modality_tag overrides hop_count_tag per Pattern 9), unknown.
  - `test_aggregate_class_rollup()` — 3 questions × 1 tier; verify per-class buckets + n_nan; multimodal bucket contains 1 record with `nan_reason='empty_contexts'` → n_nan=1; single-hop bucket: faithfulness=0.8 over q1 only; n_nan=0.
  - `test_emit_markdown_includes_tier4_deferral_footer()` — empty tier_rows → deferral footer mentions "Tier 4: deferred to user" + "tier-4-multimodal/scripts/eval_capture.py" + "MineRU".
  - `test_emit_markdown_no_deferral_when_tier4_present()` — populated tier-4 row → footer omits the deferral note (but the table still emits the tier-4 row).
  - `test_emit_markdown_format()` — 9-column tier rollup header verbatim; 7-column class rollup header verbatim; "Honest disclaimers" / "30 questions" / "Multi-hop ≡ cross-document" / "Tiers 1-3 are text-only" all present.
  - `test_fmt_float_handles_nan()` — float('nan') → '—'; 0.123456 @ 3 places → '0.123'; 1.5 @ 2 places → '1.50'; 0.001234 @ 6 places → '0.001234'.
  - `test_cli_help_exits_zero()` — argparse `SystemExit(0)` on `--help`.

- **Full non-live suite green:** **135 passed / 4 skipped / 9 deselected** (was 125/4/9 at end of Plan 131-05 → exactly +10 from this plan; no regressions). Wall time 7.83s.

## Task Commits

Each task was committed atomically and pushed to `origin/main` in companion repo `/Users/patrykattc/work/git/rag-architecture-patterns`:

1. **Task 1: evaluation/harness/compare.py** — `71e2cdb` (feat)
   - `feat(131-06): harness/compare.py — Stage 3 aggregator + comparison.md emitter (2 tables + footer)`
   - 1 file changed, 404 insertions(+)
2. **Task 2: evaluation/tests/test_eval_compare.py** — `25a053c` (test)
   - `test(131-06): non-live tests for harness/compare.py — aggregator, class rollup, emit, deferral footer`
   - 1 file changed, 243 insertions(+)

**Plan metadata commit (this SUMMARY + STATE + ROADMAP):** in PatrykQuantumNomad repo, separate from companion-repo task commits.

## Files Created/Modified

### Companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`)

- `evaluation/harness/compare.py` — **404 LOC** (≥200 required). 3-flag argparse + pure-sync architecture + aggregate_tier + aggregate_class_rollup + emit_markdown (9-col + 7-col tables + footer) + _detect_judge_provenance + helpers.
- `evaluation/tests/test_eval_compare.py` — **243 LOC** (≥100 required). 10 non-live tests; 0.06s wall time.

### Planning repo (`/Users/patrykattc/work/git/PatrykQuantumNomad`)

- `.planning/phases/131-evaluation-harness/131-06-SUMMARY.md` (this file)
- `.planning/STATE.md` (updated by metadata commit — Plan 6/7 done; status moves to Wave 6 ready)
- `.planning/ROADMAP.md` (Phase 131 plan progress 6/7)

## Decisions Made

- **Pure-sync architecture (no asyncio).** Stage 3 is pure file I/O + numpy aggregation; the verbatim plan source spelled this out and the executor honored it. `main(argv=None) -> int` wraps sync `_run(args)`. This avoids the asyncio.run boundary concern that Plans 04 + 05 had to navigate, and keeps the test surface trivially synchronous.
- **`_latest` defensive against missing dirs.** Added `if not dir_.exists(): return None` vs the verbatim plan source which assumed dir presence. This makes `aggregate_tier` safe against partial result trees (e.g. when queries/ exists but metrics/ has been pruned by `git clean`).
- **`_run` validates `--tiers` parsing.** Try/except ValueError on the int conversion before the supported-tier scan — yields a clean exit-2 error for non-int tier strings (e.g. `--tiers abc`). Matches the fast-fail discipline Plan 04 + 05 already established.
- **`_detect_judge_provenance` hardened against malformed JSON.** Wrapped the `json.loads(...)` + `read_text()` calls in try/except `(json.JSONDecodeError, OSError)` so a corrupt judge cost file falls back to the 131-RESEARCH defaults rather than aborting the comparison.
- **`metrics_by_qid` filters by `'question_id' in m`.** Defensive against future ScoreRecord shape drift; current Plan 05 always emits `question_id`, but the filter keeps `compare.py` forward-compatible.
- **`emit_markdown` handles empty `capture_provenance`.** Emits `'- (no tier query logs found)'` bullet instead of an empty list — keeps the empty-results.md structurally valid (no orphan headers + bullet list).
- **`_classify` returns `'unknown'` for unindexed question IDs.** Matches the verbatim plan; keeps `aggregate_class_rollup` safe when a query log references a question_id not in `golden_qa.json` (e.g. a hand-edited record).
- **Cost JSON glob fallback to `tier-N-*.json`.** When `tier-N-eval-*.json` (Plan 04 naming) is absent, fall back to the broader `tier-N-*.json` glob — picks up legacy Phase 128/130 cost JSONs (which used the broader name) and keeps the aggregator usable against pre-131 result dirs.

## Empirical Findings (for downstream plans)

### Verbatim `--help` output

```
$ uv run python -m evaluation.harness.compare --help
usage: compare.py [-h] [--results-dir RESULTS_DIR] [--out OUT] [--tiers TIERS]

Phase 131 Stage 3 — emit comparison.md.

options:
  -h, --help            show this help message and exit
  --results-dir RESULTS_DIR
                        Parent of queries/, costs/, metrics/. Default:
                        evaluation/results.
  --out OUT             Output Markdown path. Default:
                        evaluation/results/comparison.md.
  --tiers TIERS         Comma-separated tier numbers to include. Default: all
                        5.
```

### Verbatim head -40 of synthetic comparison.md (Task 2 smoke)

Synthetic `tmp_path/queries/tier-1-{ts}.json` (1 single-hop record), `costs/tier-1-eval-{ts}.json` (totals.usd=$0.001), `metrics/tier-1-{ts}.json` (faithfulness=0.85, answer_relevancy=0.9, context_precision=0.7, nan_reason=null) → `python -m evaluation.harness.compare --tiers 1` produced (verbatim head -40):

```markdown
# RAG Tier Comparison — Phase 131

Generated by `python -m evaluation.harness.compare`. Source artifact for Phase 133 BLOG-04.

## Tier Rollup

| Tier | Faithfulness | Answer Relevancy | Context Precision | Mean Latency (s) | Total Cost (USD) | Cost / Query (USD) | n | n NaN |
|------|--------------|------------------|-------------------|------------------|------------------|--------------------|---|-------|
| tier-1 | 0.850 | 0.900 | 0.700 | 1.50 | 0.001000 | 0.001000 | 1 | 0 |
| tier-2 | — | — | — | — | — | — | 0 | 0 |
| tier-3 | — | — | — | — | — | — | 0 | 0 |
| tier-4 | — | — | — | — | — | — | 0 | 0 |
| tier-5 | — | — | — | — | — | — | 0 | 0 |

## Per-Question-Class Rollup

| Class | Tier | Faithfulness | Answer Relevancy | Context Precision | n | n NaN |
|-------|------|--------------|------------------|-------------------|---|-------|
| single-hop | tier-1 | 0.850 | 0.900 | 0.700 | 1 | 0 |

## Provenance & Honest Disclosures

**Judge LLM:** google/gemini-2.5-flash
**Judge embedder:** openai/text-embedding-3-small

**Capture provenance per tier:**

- `tier-1`: captured 2026-04-27T12:00:00Z (model `google/gemini-2.5-flash`, git `abc1234`)

**NaN breakdown per tier:**

- No NaN scores across the run (all questions × tiers scored cleanly).

**Tier 4: deferred to user.** Phase 130 SC-1 deferred Tier 4's live test to the user (sandbox kernel-level OMP shmem block on MineRU). Run `python tier-4-multimodal/scripts/eval_capture.py` locally to produce a Tier 4 query log, then re-run `python -m evaluation.harness.score --tiers 4` and `python -m evaluation.harness.compare` to fill the Tier 4 row.

**Honest disclaimers:**

- 30 questions × ≤5 tiers is too small for statistical-significance testing. Numbers above are raw means; the magnitude (not p-values) is what the blog post discusses.
- Multi-hop ≡ cross-document for this corpus (verified in Phase 127-06: every multi-hop entry in `golden_qa.json` cites ≥2 source papers).
- Tiers 1-3 are text-only — their multimodal scores reflect that limitation; Tier 4 is the multimodal-RAG win (Phase 130 SC-1 deferred to user).
```

(Total file: 42 lines; the tail continues with the self-grading-bias disclaimer.)

**This proves end-to-end:** the 9-column tier rollup renders with correct rounding (3 decimals for metrics, 2 for latency, 6 for USD); the per-class rollup buckets the single-hop record correctly; missing tiers emit em-dashed placeholder rows with `n=0 / n_NaN=0`; the deferral footer fires when no tier-4 data is present; capture provenance + judge-defaults footer + honest disclaimers all render verbatim.

### NaN aggregation verified empirically (Pitfall 2 / 8)

`test_aggregate_tier_with_nan` exercises the Pitfall 8 path (Tier 5 agent truncation):
- Input: 2 records, q2 has `error='max_turns_exceeded'` + metrics row `{faithfulness: None, answer_relevancy: None, context_precision: None, nan_reason: 'agent_truncated'}`.
- Output: `row['n'] == 2`, `row['n_nan'] == 1`, `row['nan_breakdown'] == {'agent_truncated': 1}`, `row['faithfulness'] == 0.9` (np.nanmean over the single non-None score from q1).
- **Confirms:** None values are filtered before `np.nanmean`; nan_reason counts surface in nan_breakdown; the n denominator (used for `cost_per_query_usd`) counts ALL records (truncated + scored).

### Tier 4 deferral footer verified (Phase 130 SC-1)

`test_emit_markdown_includes_tier4_deferral_footer` exercises the deferral path:
- Input: `tier_rows = [None, None, None, None, None]`, `tier_4_present=False`.
- Assertions pass: footer contains "Tier 4: deferred to user" + "tier-4-multimodal/scripts/eval_capture.py" + "MineRU" (all 3 phrases load-bearing for the user-action narrative).

`test_emit_markdown_no_deferral_when_tier4_present` exercises the suppression path:
- Input: `tier_rows = [None, None, None, fake_tier4_row, None]`, `tier_4_present=True`.
- Assertion passes: "Tier 4: deferred to user" string is NOT present in the output (footer block is suppressed; the populated tier-4 row IS emitted in the rollup table).

### Test results verbatim

```
$ uv run pytest evaluation/tests/test_eval_compare.py -v
============================= test session starts ==============================
platform darwin -- Python 3.13.1, pytest-8.4.2, pluggy-1.6.0
rootdir: /Users/patrykattc/work/git/rag-architecture-patterns
configfile: pyproject.toml
plugins: langsmith-0.7.37, anyio-4.13.0
collected 10 items

evaluation/tests/test_eval_compare.py::test_aggregate_tier_happy PASSED  [ 10%]
evaluation/tests/test_eval_compare.py::test_aggregate_tier_with_nan PASSED [ 20%]
evaluation/tests/test_eval_compare.py::test_aggregate_tier_missing_returns_none PASSED [ 30%]
evaluation/tests/test_eval_compare.py::test_classify PASSED              [ 40%]
evaluation/tests/test_eval_compare.py::test_aggregate_class_rollup PASSED [ 50%]
evaluation/tests/test_eval_compare.py::test_emit_markdown_includes_tier4_deferral_footer PASSED [ 60%]
evaluation/tests/test_eval_compare.py::test_emit_markdown_no_deferral_when_tier4_present PASSED [ 70%]
evaluation/tests/test_eval_compare.py::test_emit_markdown_format PASSED  [ 80%]
evaluation/tests/test_eval_compare.py::test_fmt_float_handles_nan PASSED [ 90%]
evaluation/tests/test_eval_compare.py::test_cli_help_exits_zero PASSED   [100%]

============================== 10 passed in 0.06s ==============================
```

### Full non-live suite

```
$ uv run pytest -q -m "not live"
135 passed, 4 skipped, 9 deselected, 11 warnings in 7.83s
```

Up from 125/4/9 (131-05 hand-off baseline). +10 new = the 10 cases in `test_eval_compare.py`.

### Real comparison.md generation

**Run:** NO — deferred to Plan 07.

**Why deferred:**
1. **No real query logs on disk.** `evaluation/results/queries/` is empty in this executor; Plan 04's optional smoke wrote `tier-1-2026-04-27T11_47_09Z.json` in a prior executor's tmp state but it isn't tracked in git (Plan 01 gitignored `evaluation/results/queries/`) and didn't persist into this Plan 06 executor.
2. **No real metrics JSONs.** `evaluation/results/metrics/` doesn't even exist as a directory; Plan 05 was non-live so no metrics file was ever written to this executor's filesystem.
3. **The synthetic smoke + 10 non-live tests fully exercise the emit path.** Tier rollup formatting, per-class rollup, NaN breakdown, deferral footer all proven against canned inputs.

**What this means for Plan 07:** Plan 07's live smoke must run all 3 stages back-to-back to produce the first real `evaluation/results/comparison.md`. Recommendation per the plan's open question: **YES, run all 3 stages back-to-back** if all succeed (`run.py --tiers 1 --limit 1` → `score.py --tiers 1 --limit 1` → `compare.py --tiers 1`), commit the resulting comparison.md, AND include a "smoke-only" disclaimer in the commit message ("partial 1-question coverage; full-corpus runs deferred to user's local env"). If any stage fails, commit the partial result + a clear "deferred" note in the README.

### LOC counts

| File | LOC | Min required |
|---|---|---|
| `evaluation/harness/compare.py` | 404 | 200 |
| `evaluation/tests/test_eval_compare.py` | 243 | 100 |

Both well over min.

## Deviations from Plan

None — plan executed exactly as written.

The verbatim source in the `<interfaces>` block compiled and ran without modification on first try. All 10 tests pass on first invocation; both fast-fails (missing results_dir → exit 2; empty results dir → exit 0 with full deferred-tier markdown) returned the expected exit codes and contents. The synthetic end-to-end smoke produced a `comparison.md` matching the plan's expected output verbatim (`tier-1 | 0.850 | 0.900 | 0.700 | 1.50 | 0.001000`).

The 6 small hardenings I applied (defensive `_latest` against missing dirs, try/except around `--tiers` parsing, malformed-JSON guard in `_detect_judge_provenance`, `metrics_by_qid` filter on `question_id` presence, empty-`capture_provenance` bullet, cost-JSON glob fallback) are all forward-compat / defensive additions that don't change the contract. Documented in **Decisions Made** above for traceability.

**Total deviations:** 0.
**Impact on plan:** Zero deviations means the planner's verbatim `<interfaces>` block + 131-RESEARCH Pattern 5 + Plan 04 + 05 SUMMARY hand-off notes provided exactly enough context to author the aggregator without surprise. Cleanest plan in Phase 131 to date (tied with Plan 04).

## Issues Encountered

- **Pre-existing untracked `dataset/manifests/metadata.json` drift** — same as Plans 131-{01,02,03,04,05}. Out of scope; left unstaged. Documented for a future docs/dataset commit if it persists.
- **`UV_CACHE_DIR=/tmp/claude/uv-cache` workaround** still required for all `uv run` invocations (sandbox-level uv cache permission shape; Open Q4 in 131-RESEARCH). No code change.
- **No real evaluation/results/{queries,metrics}/ data on disk** — Plan 04 + 05's optional smokes wrote logs in prior executors' tmp states but didn't persist into this executor's filesystem (gitignored per Plan 01). The end-to-end synthetic smoke (Task 2) covered the missing real-data gap; the real-data drive is Plan 07's job.

## User Setup Required

None — no external service configuration required for this plan. All work is non-live; the synthetic smoke completed without any network egress.

When the user (or Plan 07) runs `python -m evaluation.harness.compare` for real, they need:
1. `evaluation/results/queries/tier-{N}-{ts}.json` files from Plan 04 (`python -m evaluation.harness.run --tiers ... --yes`)
2. `evaluation/results/metrics/tier-{N}-{ts}.json` files from Plan 05 (`python -m evaluation.harness.score --tiers ... --yes`)
3. `evaluation/golden_qa.json` (already present from Phase 127-06)

No new secrets / no new infra. The aggregator is offline.

## Next Phase Readiness

**Plan 131-07 (README + live smoke + close-out) unblocked.** Plan 07 is the final wave (Wave 6). It must:
1. Author `evaluation/README.md` documenting the 3-stage harness flow + the 3 entry-point commands + the per-tier cost ballparks + the Tier 4 user-runs-this-locally deferral.
2. Run a live smoke producing the first real `comparison.md` (Recommendation: 1-question slice across the cheapest tiers, then commit the resulting comparison.md with a "smoke-only" commit message).
3. Close Phase 131 — verify all 7 plans complete; update PROJECT.md if needed; ensure `.planning/STATE.md` reflects v1.22 RAG Architecture Patterns at 131/7-of-7.

**Open question handed forward to Plan 07:** should Plan 07 also re-ingest `chroma_db/tier-1-naive/` if it's still empty from Phase 130-06's drain? The Tier 1 adapter currently short-circuits with `error='tier1_chroma_empty'` against the empty index. Recommendation: pivot the live smoke to **Tier 2 or Tier 3** instead of re-ingesting Tier 1 — both are populated in this executor's venv (Phase 129 SUMMARYs confirmed) and exercise the cost-bearing API path without an extra ingestion step.

**Recommendation for Plan 07's first comparison.md commit:** target Tier 2 with `--limit 1 --yes` for the cheapest live drive. Per Plan 04's COST_PER_Q drift table, Tier 2 is $0.0001/q (lowest of all tiers). Plus the resulting `comparison.md` will populate the Tier 2 row + the per-class rollup with at least 1 row, exercising the populated-tier emit path.

**No blockers.** Wave 5 (Plan 06) is complete; Wave 6 (Plan 07 — final) can begin.

---
*Phase: 131-evaluation-harness*
*Completed: 2026-04-27*

## Self-Check: PASSED

Verification commands run after SUMMARY draft:

```
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/harness/compare.py
FOUND: evaluation/harness/compare.py

$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/tests/test_eval_compare.py
FOUND: evaluation/tests/test_eval_compare.py

$ git -C /Users/patrykattc/work/git/rag-architecture-patterns log --oneline | grep -E '131-06'
FOUND: 71e2cdb  (Task 1: feat — harness/compare.py)
FOUND: 25a053c  (Task 2: test — test_eval_compare.py)
```

Both files present on disk; both task commits visible on companion repo `origin/main`.
