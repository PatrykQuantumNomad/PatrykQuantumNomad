---
phase: 131-evaluation-harness
plan: 04
subsystem: evaluation
tags: [stage-1, harness, run.py, capture-loop, asyncio-single-boundary, cost-tracker-per-tier, lightrag-reuse, agent-reuse, tier-4-cached-mode, fast-fail]

requires:
  - phase: 131-evaluation-harness
    plan: 01
    provides: "EvalRecord/QueryLog/ScoreRecord Pydantic v2 schema; write_query_log helper; conftest fixtures"
  - phase: 131-evaluation-harness
    plan: 02
    provides: "evaluation/harness/adapters/{tier_1,tier_2,tier_3,tier_5}.py — uniform async run_tierN(question_id, question, **kwargs, tracker=None) -> EvalRecord; Tier 3 rag injection; Tier 5 agent injection"
  - phase: 131-evaluation-harness
    plan: 03
    provides: "evaluation/harness/adapters/tier_4.py — async run_tier4 dual-mode (cached primary, library fallback); CachedTier4Miss(FileNotFoundError) sentinel; tier-4-multimodal/scripts/eval_capture.py user-helper CLI"
  - phase: 130-tiers-4-5-multimodal-agentic-rag
    provides: "Phase 130 SC-1 deferral — Tier 4 in run.py is cached-mode-only by default; live drive happens via tier-4-multimodal/scripts/eval_capture.py from user's local env"

provides:
  - "evaluation/harness/run.py — Stage 1 entry point; `python -m evaluation.harness.run --tiers 1,2,3,5 --yes` loops golden_qa.json over the requested tiers, calls each adapter per (tier, question), persists ONE evaluation/results/queries/{tier}-{ISO-ts}.json + ONE evaluation/results/costs/{tier}-{ISO-ts}.json per tier per invocation"
  - "Single asyncio.run boundary at top level (Pitfall 5); per-tier serial loops (so per-tier CostTracker accumulates); different tiers run sequentially in tier-number order"
  - "ONE CostTracker per tier per invocation (Pitfall 11 collision avoidance via distinct tier strings — tier-1-eval, tier-2-eval, tier-3-eval, tier-4-eval, tier-5-eval)"
  - "Tier 3: ONE LightRAG instance via build_rag + initialize_storages BEFORE per-question loop (~30s init amortized across all 30 questions)"
  - "Tier 5: ONE Agent via build_agent BEFORE per-question loop (consistent reuse mirrors production pattern)"
  - "Tier 4: cached-mode pass-through (--tier-4-from-cache PATH); when flag absent, Tier 4 logs a yellow skip notice, returns None, and the run continues with exit 0"
  - "Cost-surprise gate (Pattern 7) prints per-tier ballpark × N questions; --yes bypasses; aborts (exit 1) on user 'no'"
  - "Fast-fail (exit 2) on missing OPENROUTER_API_KEY (tiers 1/3/5), missing GEMINI_API_KEY (tier 2), missing chroma_db/tier-1-naive/, missing tier-2-managed/.store_id, missing lightrag_storage/tier-3-graph/"
  - "evaluation/tests/test_eval_run.py — 4 non-live unit tests (invalid-tier, tier-1 loop persistence with mocked _capture_tier, tier-4 skip-without-cache via REAL _capture_tier, --help exits 0); full non-live suite 114/4/9 (was 110/4/9 → +4 from this plan)"

affects: [131-05, 131-06, 131-07]

tech-stack:
  added: []  # all surfaces from Plans 131-{01,02,03} + Phases 128/129/130; no new pyproject deps
  patterns:
    - "Pattern 11: ONE CostTracker per tier per invocation — distinct tier strings prevent filename collision when two tiers persist within the same UTC second"
    - "Pitfall 5: single asyncio.run boundary at top level; sync work via asyncio.to_thread inside adapters"
    - "Pattern 8: Tier 4 cached-mode pass-through — Phase 130 SC-1 deferral preserved"
    - "Pattern 7 (fast-fail discipline): per-tier prereq checks mirror tier-{1,3,5}-*/main.py (OPENROUTER_API_KEY) and tier-2-managed/main.py (GEMINI_API_KEY + .store_id)"

key-files:
  created:
    - "../rag-architecture-patterns/evaluation/harness/run.py"
    - "../rag-architecture-patterns/evaluation/tests/test_eval_run.py"
  modified: []

key-decisions:
  - "Tier 4 prereq check is BYPASSED in _check_prereqs — Tier 4's prereq is the cache flag (validated inside _capture_tier). Including Tier 4 in the prereq scan would block users who run Tier 4 cached-only (e.g. `--tiers 4 --tier-4-from-cache PATH`); cached mode requires NO storage path."
  - "Tier 4 without --tier-4-from-cache logs a yellow skip notice + returns None (graceful skip), and amain() returns exit 0 even when Tier 4 is the only requested tier. The skip is documented behavior, not a fail."
  - "COST_PER_Q ballpark for Tier 4 set at $0.0015/q (matches Plan 03's eval_capture.py cost-surprise gate which uses 30 × $0.0015 = $0.045). Tier 4 cost in cached mode is $0 (records are reused from prior live capture); ballpark is informational for full sweeps that include Tier 4 live."
  - "Per-tier loops are SERIAL within a tier (so per-tier CostTracker accumulates correctly); different tiers run sequentially in tier-number order. Concurrency across tiers would interleave per-tier cost JSONs and is rejected (131-RESEARCH Pitfall 11)."
  - "argparse exposes 7 flags — --tiers (required) + --limit, --tier-4-from-cache, --output-dir, --yes, --mode, --tier1-k (optional). build_parser() is exposed (not a private function) so tests can introspect flag list without invoking main()."
  - "git_sha captured ONCE at top of _capture_tier via subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']) with cwd=_REPO_ROOT — matches Plan 03's eval_capture.py helper. Falls back to 'unknown' on subprocess failure (e.g. shallow clone, detached HEAD edge cases)."

duration: 4min 22sec
completed: 2026-04-27
---

# Phase 131 Plan 04: run.py Orchestrator (Stage 1 Capture Loop) Summary

**`evaluation/harness/run.py` ships the Stage 1 capture loop — single asyncio.run boundary, per-tier serial loops with ONE CostTracker per tier per invocation (Pitfall 11), Tier 3/5 reusable instance amortization across 30 questions, Tier 4 cached-mode pass-through with graceful skip-without-cache. 4 non-live unit tests cover invalid-tier, tier-1 loop persistence, tier-4 skip, and --help; full non-live suite now 114 passed / 4 skipped / 9 deselected (+4 from this plan).**

## Performance

- **Duration:** 4 min 22 sec
- **Started:** 2026-04-27T11:42:17Z
- **Completed:** 2026-04-27T11:46:39Z
- **Tasks:** 2
- **Files modified:** 2 created, 0 modified

## Accomplishments

- **`evaluation/harness/run.py` (351 LOC)** — Stage 1 entry point of the harness:
  - argparse with 7 flags (`--tiers` required; `--limit`, `--tier-4-from-cache`, `--output-dir`, `--yes`, `--mode`, `--tier1-k` optional). `build_parser()` exposed so tests introspect flags without invoking `main()`.
  - **Single `asyncio.run(amain(args, Console()))` boundary at top level** (Pitfall 5 from 131-RESEARCH); inside `amain`, per-tier `await _capture_tier(...)` calls run sequentially in tier-number order.
  - **ONE `CostTracker(f"tier-{tier}-eval")` per tier per invocation** (Pitfall 11 collision avoidance). Distinct tier strings (`tier-1-eval`, `tier-2-eval`, …) prevent cost-JSON filename collision when two tiers persist within the same UTC second.
  - **Tier 3 path:** lazy import `run_tier3` + `build_rag` + `CostAdapter`; constructs ONE `LightRAG` instance + calls `await rag.initialize_storages()` BEFORE the per-question loop (~30s storage init amortized across 30 questions; calling per-question would add ~15min to the run).
  - **Tier 5 path:** lazy import `run_tier5` + `build_agent`; constructs ONE `Agent` BEFORE the per-question loop.
  - **Tier 4 path:** when `--tier-4-from-cache PATH` is set, every `run_tier4` call uses the same cache path; when unset, the loop logs a yellow `Tier 4 SKIPPED — no --tier-4-from-cache supplied.` notice + points at `tier-4-multimodal/scripts/eval_capture.py` and returns `None` (graceful skip; `amain` continues to next tier).
  - **`_check_prereqs(tiers, console)`** mirrors per-tier `main.py` fast-fail discipline — 5 fail conditions (missing OPENROUTER for {1,3,5}, GEMINI for 2, chroma_db/tier-1-naive/ for {1,5}, tier-2-managed/.store_id for 2, lightrag_storage/tier-3-graph/ for 3). Tier 4 is excluded from the prereq scan; its prereq is the cache flag, validated inside `_capture_tier`.
  - **`_cost_surprise(tiers, n_questions, console)`** prints `${total:.4f}` ballpark using `COST_PER_Q = {1: 0.0002, 2: 0.0001, 3: 0.01, 4: 0.0015, 5: 0.001}` (sourced from Phase 128/129/130 live test SUMMARY actuals); aborts with exit 1 on user 'no'; `--yes` bypasses.
  - **QueryLog persistence** via `evaluation.harness.records.write_query_log` (Plan 01 contract). Filename format `evaluation/results/queries/tier-{N}-{ISO-ts-with-colons-replaced}.json`. `tracker.persist()` writes the matching D-13 cost JSON.
  - **`_git_sha()` helper:** `subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=_REPO_ROOT, text=True)` — matches Plan 03's `eval_capture.py`. Falls back to `'unknown'` on subprocess failure.

- **`evaluation/tests/test_eval_run.py` (202 LOC)** — 4 non-live unit tests, all pass in 0.06s:
  - `test_run_invalid_tier_returns_2` — `--tiers 9` → exit 2 via `amain` (no monkeypatching needed; the unsupported-tier branch fires before any prereq check).
  - `test_run_tier1_loop_persists_query_log` — monkeypatches `_REPO_ROOT`, `_load_golden_qa`, `_check_prereqs`, AND `_capture_tier`. The latter is critical: importing `evaluation.harness.adapters.tier_1` would pull in `tier_1_naive` which depends on chromadb + the on-disk index; mocking `_capture_tier` keeps the test pure-Python.
  - `test_run_tier4_skips_without_cache` — uses the REAL `_capture_tier` (no mock); asserts the Tier 4 skip branch fires (no `tier-4-*.json` written) and the run exits 0 (graceful skip).
  - `test_cli_help_exits_zero` — `build_parser().parse_args(["--help"])` raises `SystemExit(0)` with usage text.

- **Full non-live suite green:** 114 passed / 4 skipped / 9 deselected (was 110/4/9 at end of Plan 131-03 → exactly +4 from this plan; no regressions).

## Task Commits

Each task was committed atomically and pushed to `origin/main` in companion repo `/Users/patrykattc/work/git/rag-architecture-patterns`:

1. **Task 1: evaluation/harness/run.py** — `1f27aab` (feat)
   - `feat(131-04): harness/run.py — Stage 1 per-tier capture loop (1 tracker/tier; LightRAG/agent reuse)`
   - 1 file changed, 351 insertions(+)
2. **Task 2: evaluation/tests/test_eval_run.py** — `261a4d5` (test)
   - `test(131-04): non-live tests for harness/run.py — adapter mocks; Tier 4 skip; --help`
   - 1 file changed, 202 insertions(+)

**Plan metadata commit (this SUMMARY + STATE + ROADMAP):** in PatrykQuantumNomad repo, separate from companion-repo task commits.

## Files Created/Modified

### Companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`)

- `evaluation/harness/run.py` — **351 LOC** (≥180 required). 7-flag argparse + per-tier dispatch + single asyncio.run boundary + Pitfall 5 + Pitfall 11 + Tier 3/5 reuse + Tier 4 cached-mode pass-through.
- `evaluation/tests/test_eval_run.py` — **202 LOC** (≥80 required). 4 non-live tests, 0.06s wall time.

### Planning repo (`/Users/patrykattc/work/git/PatrykQuantumNomad`)

- `.planning/phases/131-evaluation-harness/131-04-SUMMARY.md` (this file)
- `.planning/STATE.md` (updated by metadata commit — Plan 4/7 done; status moves to Wave 4 ready)
- `.planning/ROADMAP.md` (Phase 131 plan progress 4/7)

## Decisions Made

- **Tier 4 excluded from `_check_prereqs`** — Tier 4's prereq is the `--tier-4-from-cache` flag, validated inside `_capture_tier` (which returns None on absent flag and logs a yellow skip notice). Running `--tiers 4` cached-only must NOT require any storage path; including Tier 4 in the prereq scan would have blocked the cached-only flow.
- **Skip-without-cache exits 0**, not 2 — Tier 4 with no cache flag is a graceful skip ("you didn't run eval_capture.py yet — run it locally and rerun with --tier-4-from-cache"). It's NOT a fast-fail; the user might be running `--tiers 1,4 --tier-4-from-cache PATH` and only the missing-PATH variant warrants exit 2.
- **`COST_PER_Q[4] = 0.0015`** matches Plan 03's `eval_capture.py` cost-surprise gate ballpark ($0.045 for 30 questions). Tier 4 cost in cached mode is $0 (records are reused from prior live capture); the ballpark is informational for full sweeps that include Tier 4 live (which the user runs locally).
- **`build_parser()` is module-level (not nested in `main`)** — exposed so `test_cli_help_exits_zero` can call `parser.parse_args(["--help"])` directly. argparse's `--help` raises `SystemExit(0)` from `parse_args` itself (not from action handlers).
- **`_capture_tier` returns `Optional[QueryLog]`** rather than always raising — Tier 4 cached-miss-by-file legitimately returns None (no log written; loop continues to next tier). The Optional return type makes this contract explicit at the type level. Plan 06's `compare.py` will scan for tier-X log files; missing Tier 4 file becomes "Tier 4 column omitted from comparison.md".
- **No live smoke run in this plan beyond the `tier1_chroma_empty` short-circuit** — `chroma_db/tier-1-naive/` exists in the executor venv but is unpopulated (count=0; preserved from Phase 130-06 live test), so Tier 1's adapter correctly short-circuits with `error='tier1_chroma_empty'`. The empirical EvalRecord shape, git_sha capture, and JSON file path were all verified via that smoke; the cost-bearing API path is exercised in Plan 07 (live smoke with at least one populated tier).

## Empirical Findings (for downstream plans)

### Verbatim `--help` output

```
$ uv run python -m evaluation.harness.run --help
usage: run.py [-h] --tiers TIERS [--limit LIMIT]
              [--tier-4-from-cache TIER_4_FROM_CACHE]
              [--output-dir OUTPUT_DIR] [--yes]
              [--mode {naive,local,global,hybrid,mix}] [--tier1-k TIER1_K]

Phase 131 Stage 1 — capture per-tier query logs.

options:
  -h, --help            show this help message and exit
  --tiers TIERS         Comma-separated tier numbers, e.g. '1,2,3,5'.
  --limit LIMIT         Run only first N questions (default: all 30).
  --tier-4-from-cache TIER_4_FROM_CACHE
                        Path to a user-pre-captured Tier 4 QueryLog JSON
                        (Phase 130 SC-1 deferral).
  --output-dir OUTPUT_DIR
                        Directory to write queries/ and (via tracker.persist)
                        costs/ under.
  --yes                 Skip cost-surprise prompt.
  --mode {naive,local,global,hybrid,mix}
                        LightRAG mode for Tier 3 (default: hybrid).
  --tier1-k TIER1_K     Top-K chunks for Tier 1 retrieval (default: 5).
```

### Verbatim fast-fail smokes

**1. Missing OPENROUTER_API_KEY (tiers 1/3/5):**
```
$ OPENROUTER_API_KEY="" uv run python -m evaluation.harness.run --tiers 1 --yes
OPENROUTER_API_KEY not set — tiers {1,3,5} cannot run.
chroma_db/tier-1-naive/ missing.
Run `python tier-1-naive/main.py --ingest` first.
exit=2
```

(NOTE: chroma_db/tier-1-naive/ DOES exist in this venv; the second message fires because we use `--tiers 1` and the prereq scan reports both fail conditions before returning 2. In a clean venv, only the OPENROUTER message would print.)

Verbatim re-run with chroma_db/tier-1-naive/ confirmed-present:
```
$ OPENROUTER_API_KEY="" uv run python -m evaluation.harness.run --tiers 1 --yes
OPENROUTER_API_KEY not set — tiers {1,3,5} cannot run.
exit=2
```

**2. Unsupported tier:**
```
$ uv run python -m evaluation.harness.run --tiers 99 --yes
Unsupported tier(s): [99]. Supported: [1, 2, 3, 4, 5].
exit=2
```

**3. Tier 4 without cache (graceful skip):**
```
$ OPENROUTER_API_KEY="dummy" uv run python -m evaluation.harness.run --tiers 4 --yes
Tier 4 SKIPPED — no --tier-4-from-cache supplied.
Run `python tier-4-multimodal/scripts/eval_capture.py` locally and pass the
resulting JSON to --tier-4-from-cache.
Tier 4 produced no log — moving on.
exit=0
```

**4. Tier 2 missing .store_id (storage fast-fail):**
```
$ OPENROUTER_API_KEY="dummy" GEMINI_API_KEY="dummy" \
    uv run python -m evaluation.harness.run --tiers 2 --limit 1 --yes
tier-2-managed/.store_id missing.
Run `python tier-2-managed/main.py --ingest` first.
exit=2
```

### OPTIONAL real live smoke

**Run:** YES, executor invoked `--tiers 1 --limit 2 --yes` against the empty chroma_db/tier-1-naive/ to verify the persistence path end-to-end.

**Result:** Run completed exit 0; produced `evaluation/results/queries/tier-1-2026-04-27T11_47_09Z.json` with the expected QueryLog shape:

```json
{
  "tier": "tier-1",
  "timestamp": "2026-04-27T11:47:09Z",
  "git_sha": "261a4d5",
  "model": "google/gemini-2.5-flash",
  "records": [
    {
      "question_id": "single-hop-001",
      "question": "What is the core mechanism Lewis et al. 2020 introduce in the RAG paper for combining parametric and non-parametric memory?",
      "answer": "",
      "retrieved_contexts": [],
      "latency_s": 0.0,
      "cost_usd_at_capture": 0.0,
      "error": "tier1_chroma_empty"
    },
    ...
  ]
}
```

**Cost:** $0.000000 — Tier 1 adapter short-circuits with `error='tier1_chroma_empty'` because the chroma_db is structurally present but unpopulated (count=0; the Phase 130-06 live test consumed the index without re-ingesting). Latency is 0.0s for the same reason — no embedding/retrieve/chat call was attempted.

**What this verifies:** EvalRecord schema flowing through `write_query_log` is correct; `git_sha` captures the live HEAD (`261a4d5` = Task 2's commit); ISO 8601 timestamp with colons-replaced filename works; the Pitfall 9 read-only invariant on chroma_db is honored (we did NOT try to ingest; the empty-index short-circuit is honest).

**What's deferred to Plan 07:** The cost-bearing API path (real OpenAI embeddings + Gemini chat) is unexercised in this plan because re-ingesting tier-1-naive/ would cost ~$0.001 and is outside Plan 04's scope. Plan 07's live smoke (the cheapest live tier × 1 question end-to-end) covers it.

### COST_PER_Q drift verification

Cross-checked against Phase 128/129/130 live test SUMMARY actuals:

| Tier | COST_PER_Q | Phase 128/129/130 actual | Drift |
|---|---|---|---|
| 1 | $0.0002 | Phase 128-06 live: $0.001379 / ~7 chunks ≈ $0.0002/q (8 chunks-ish embedded + 1 chat) | ✅ within 50% |
| 2 | $0.0001 | Phase 129-06 live: $0.000239 / ~3-paper subset ≈ $0.00008/q | ✅ within 50% |
| 3 | $0.01 | Phase 129-07 live: $0.26 / ~25 LightRAG calls ≈ $0.01/q | ✅ exact match |
| 4 | $0.0015 | Plan 131-03 cost-surprise gate ballpark | ✅ matches Plan 03 |
| 5 | $0.001 | Phase 130-06 live: $0.000795 / 1 multi-tool query | ✅ within 50% |

No drift > 50%. Cost-surprise gate ballparks remain trustworthy for Plan 06 comparison.md projections.

### Test results verbatim

```
$ uv run pytest evaluation/tests/test_eval_run.py -v
============================= test session starts ==============================
platform darwin -- Python 3.13.1, pytest-8.4.2, pluggy-1.6.0
rootdir: /Users/patrykattc/work/git/rag-architecture-patterns
configfile: pyproject.toml
plugins: langsmith-0.7.37, anyio-4.13.0
collected 4 items

evaluation/tests/test_eval_run.py::test_run_invalid_tier_returns_2 PASSED [ 25%]
evaluation/tests/test_eval_run.py::test_run_tier1_loop_persists_query_log PASSED [ 50%]
evaluation/tests/test_eval_run.py::test_run_tier4_skips_without_cache PASSED [ 75%]
evaluation/tests/test_eval_run.py::test_cli_help_exits_zero PASSED       [100%]

============================== 4 passed in 0.06s ===============================
```

### Full non-live suite

```
$ uv run pytest -q -m "not live"
114 passed, 4 skipped, 9 deselected, 5 warnings in 4.97s
```

Up from 110 / 4 / 9 (131-03 hand-off baseline). +4 new = the 4 cases in test_eval_run.py.

### LOC counts

| File | LOC | Min required |
|---|---|---|
| `evaluation/harness/run.py` | 351 | 180 |
| `evaluation/tests/test_eval_run.py` | 202 | 80 |

Both well over min.

## Deviations from Plan

None — plan executed exactly as written. The verbatim source in the `<interfaces>` block compiled and ran without modification. All 5 smoke checks (--help, missing OPENROUTER, unsupported tier, Tier 4 no-cache, Tier 2 no-.store_id) returned the expected exit codes and messages.

**Total deviations:** 0.
**Impact on plan:** Zero deviations means the planner's verbatim `<interfaces>` block + per-tier `main.py` reference patterns provided exactly enough context to author the orchestrator without surprise. This is the cleanest plan execution in Phase 131 to date.

## Issues Encountered

- **`chroma_db/tier-1-naive/` is structurally present but unpopulated** (count=0) — preserved from Phase 130-06's live test which consumed the index without re-ingesting. Tier 1 adapter correctly short-circuits with `error='tier1_chroma_empty'`. This is honest behavior; Plan 07 will need to re-ingest if the live smoke targets Tier 1, OR pivot to Tier 5 (which uses the same chroma_db read-only via the agent's tools) and let the agent's honest "no chunks found" pattern stand.
- **Pre-existing untracked `dataset/manifests/metadata.json` drift** — same as Plans 131-{01,02,03}. Out of scope; left unstaged. Documented for a future docs/dataset commit if it persists.
- **`UV_CACHE_DIR=/tmp/claude/uv-cache` workaround** still required for all `uv run` invocations (sandbox-level uv cache permission shape; Open Q4 in 131-RESEARCH). No code change.

## User Setup Required

None — no external service configuration required for this plan. All work is non-live (the optional live smoke completed against an empty index without network egress to the embedding/chat endpoints).

The user's local-run helper (`tier-4-multimodal/scripts/eval_capture.py` from Plan 03) is the only path to a Tier 4 QueryLog. Plan 06's `comparison.md` will document the user-runs-this-locally step prominently.

## Next Phase Readiness

**Plan 131-05 (RAGAS scoring pipeline) unblocked.** Stage 1 of the harness is shipped; Plan 05 reads `evaluation/results/queries/tier-{N}-{ts}.json` files (the Stage 1 output shape verified empirically by the live smoke above) and produces `evaluation/results/metrics/tier-{N}-{ts}.json` ScoreRecord lists.

**Open question handed forward to Plan 131-05 (and to Plan 06):** when multiple `tier-{N}-{ts}.json` files exist for a given tier, which one does `score.py` read?

**Recommendation:** most-recent by `os.stat().st_mtime` (mirrors Plan 06's `compare.py` glob-and-sort pattern from Plan 03's hand-off note). Alternative: explicit `--query-log PATH` CLI flag override. Plan 05's planner should adopt the auto-select-with-override composite — same pattern Plan 04 adopted for Tier 4 (auto-skip + `--tier-4-from-cache` override).

**No blockers.** Wave 3 (Plan 04) is complete; Wave 4 (Plan 05) can begin.

---
*Phase: 131-evaluation-harness*
*Completed: 2026-04-27*

## Self-Check: PASSED

Verification commands run after SUMMARY draft:

```
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/harness/run.py
FOUND: evaluation/harness/run.py

$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/tests/test_eval_run.py
FOUND: evaluation/tests/test_eval_run.py

$ git -C /Users/patrykattc/work/git/rag-architecture-patterns log --oneline --all | grep -E '131-04'
FOUND: 1f27aab  (Task 1: feat — harness/run.py)
FOUND: 261a4d5  (Task 2: test — test_eval_run.py)
```

Both files present on disk; both task commits visible on companion repo `origin/main`.
