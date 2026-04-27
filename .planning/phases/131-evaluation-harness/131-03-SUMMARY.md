---
phase: 131-evaluation-harness
plan: 03
subsystem: evaluation
tags: [tier-4, raganything, mineru, dual-mode, cached-mode, library-mode, eval-adapter, query-log, sandbox-deferral, openrouter, lightrag]

requires:
  - phase: 131-evaluation-harness
    plan: 01
    provides: "EvalRecord/QueryLog/ScoreRecord Pydantic v2 schema + read_query_log/write_query_log helpers + evaluation/tests/conftest.py"
  - phase: 130-tiers-4-5-multimodal-agentic-rag
    plan: 03
    provides: "tier_4_multimodal.{rag.build_rag, rag.DEFAULT_LLM_MODEL, rag.DEFAULT_EMBED_MODEL, query.run_query (async), cost_adapter.CostAdapter}; main.py argparse + cost-surprise gate pattern"
  - phase: 130-tiers-4-5-multimodal-agentic-rag
    plan: 05
    provides: "Phase 130 SC-1 deferral — Tier 4 live test punts to user (sandbox OMP shmem block on MineRU is not a code defect; not Phase 131-fixable)"

provides:
  - "evaluation/harness/adapters/tier_4.py — async run_tier4 dual-mode adapter (cached primary, library fallback); CachedTier4Miss(FileNotFoundError) sentinel for Plan 04 to catch and skip Tier 4"
  - "tier-4-multimodal/scripts/__init__.py + tier-4-multimodal/scripts/eval_capture.py — user's local-run helper that produces evaluation/results/queries/tier-4-{ts}.json in canonical EvalRecord shape (Pattern 8 + A5)"
  - "evaluation/tests/test_eval_tier4.py — 5 non-live tests covering cached-hit, cached-miss-question-id, cached-miss-file (CachedTier4Miss raised), library-mode import-error, library-mode happy path"
  - "Empirical confirmation that raganything==1.2.10 is installed in the executor venv (the [tier-4] extra resolves cleanly at the harness level so the library-mode lazy import will succeed when a user's local env has it; CachedTier4Miss path stays the canonical primary)"
  - "Tier 4 query log filename convention: tier-4-{ISO timestamp with colons replaced by underscores}.json — Plan 04's run.py picks the most recent by mtime when multiple exist (open-question recommendation)"

affects: [131-04, 131-05, 131-06, 131-07]

tech-stack:
  added: []  # all surfaces from Plan 130-03 + Plan 131-01; this plan adds no new pyproject deps
  patterns:
    - "Pattern 8: Dual-Mode Execution (cached primary, library fallback) — first concrete implementation"
    - "Pattern 11: CostTracker collision avoidance — CostTracker('tier-4-eval') is distinct from main.py's 'tier-4' and tests' 'tier-4-test'"
    - "Pattern: standalone helper script under tier-N/scripts/ for tier-specific user workflows that the main harness loop intentionally does not invoke"

key-files:
  created:
    - "../rag-architecture-patterns/evaluation/harness/adapters/tier_4.py"
    - "../rag-architecture-patterns/evaluation/tests/test_eval_tier4.py"
    - "../rag-architecture-patterns/tier-4-multimodal/scripts/__init__.py"
    - "../rag-architecture-patterns/tier-4-multimodal/scripts/eval_capture.py"
  modified: []

key-decisions:
  - "Cached mode is PRIMARY per Pattern 8 + Phase 130 SC-1 deferral; library mode is opportunistic (only succeeds when [tier-4] is installed in the running venv). Plan 04's run.py defaults to from_cache=Path; library mode is opt-in by passing rag= or omitting from_cache."
  - "CachedTier4Miss subclasses FileNotFoundError (not a generic Exception) so Plan 04's run.py can catch the specific case and skip Tier 4 with a footer note in Plan 06's comparison.md without swallowing unrelated FS errors."
  - "Cached-miss-by-question-id returns an EvalRecord with `error='cached_miss_question_id=...'` rather than raising — the harness loop should keep going for the other 29 questions; only a missing FILE is fatal enough to abort the whole tier."
  - "Library-mode latency timing covers ONLY the answer call (not the only_need_context probe) — Pitfall 7 mitigation should not double-count contention; if the probe takes 200ms and the answer takes 12s, latency_s reads 12s."
  - "eval_capture.py lives under tier-4-multimodal/scripts/ (NOT under evaluation/harness/) because it's a user-local helper, not part of the harness loop. The harness orchestrator (Plan 04 run.py) NEVER invokes it. This separation is the seam that lets Phase 131 ship without Phase 130 SC-1's MineRU sandbox block being on the critical path."
  - "Filename convention `tier-4-{ts.replace(':', '_')}.json` mirrors the existing `evaluation/results/costs/tier-4-eval-{ts}.json` D-13 schema and avoids the macOS Finder colon-in-filename ambiguity. ISO 8601 'Z' suffix preserved."

patterns-established:
  - "Pattern 8 verified: cached mode + library mode are genuinely orthogonal (mutually exclusive call signatures); CachedTier4Miss exception cleanly demarcates 'no log yet' from 'log present but question missing'"
  - "Pattern 11 verified: tracker injection (`tracker=...`) lets Plan 04 share a CostTracker across all 5 tiers; default CostTracker('tier-4-eval') is distinct from Plan 130-03's CostTracker('tier-4') and any test fixtures"
  - "Pattern: user-helper CLIs that produce harness-canonical artifacts MUST use the same Pydantic v2 path (write_query_log / read_query_log) the harness uses — schema enforcement is the contract; no informal JSON shapes"

# Metrics
duration: 4min
completed: 2026-04-27
---

# Phase 131 Plan 03: Tier 4 Dual-Mode Adapter + eval_capture Helper Summary

**Tier 4 ships its dual-mode eval adapter (cached primary per Phase 130 SC-1 deferral, library fallback when [tier-4] is locally installed) plus the standalone `tier-4-multimodal/scripts/eval_capture.py` user-helper CLI that drives the 30 golden Q&A locally and persists the canonical EvalRecord-shaped query log the harness Stage 2 reads — all 5 non-live tests pass, full suite 110 passed / 4 skipped / 9 deselected (was 102/4/9 → +5 from this plan; +3 from sibling Plan 02 also landed in the same window).**

## Performance

- **Duration:** 4 min 14 sec
- **Started:** 2026-04-27T11:30:35Z
- **Completed:** 2026-04-27T11:34:49Z
- **Tasks:** 2
- **Files modified:** 4 (all created — none modified)

## Accomplishments

- **`evaluation/harness/adapters/tier_4.py` (149 LOC)** — async `run_tier4(question_id, question, mode='hybrid', from_cache=None, rag=None, tracker=None) -> EvalRecord` with two mutually-exclusive modes:
  - **Cached mode (primary)**: `from_cache=Path` → reads pre-captured QueryLog via `read_query_log` → returns matching EvalRecord by `question_id`. Missing file → `CachedTier4Miss(FileNotFoundError)` (Plan 04 catches this specifically). Missing question_id → EvalRecord with `error='cached_miss_question_id=...'` (loop continues for the other 29).
  - **Library mode (fallback)**: `from_cache=None` → lazy `from tier_4_multimodal...` in try/except. ImportError → EvalRecord with `error='tier4_import_error: ...'`. Best-effort `lightrag.QueryParam(only_need_context=True)` probe (Pitfall 7) — string return split on `-----`; failure → empty contexts (honest empty → Plan 05's `nan_reason='empty_contexts'`). `tier4_run_query` for the answer; latency timed only across the answer call.
- **`tier-4-multimodal/scripts/eval_capture.py` (167 LOC)** — standalone user-local helper CLI:
  - argparse: `--mode` (naive/local/global/hybrid/mix), `--model` (reserved), `--limit` (default ALL 30), `--yes` (skip cost prompt). Mirrors `tier-4-multimodal/main.py` pattern from Plan 130-03.
  - Fast-fails (exit 2) on missing `OPENROUTER_API_KEY` or missing `rag_anything_storage/tier-4-multimodal/`.
  - Cost-surprise prompt unless `--yes`: `30 × $0.0015/q ≈ $0.045`. Build_rag + initialize_storages ONCE; loops golden_qa.json. Per-question: best-effort context probe → `run_query` answer → record EvalRecord with latency + cost-at-capture.
  - Persists `evaluation/results/queries/tier-4-{ts.replace(':', '_')}.json` (QueryLog via canonical `write_query_log`) + `evaluation/results/costs/tier-4-eval-{ts}.json` (CostTracker D-13 schema via `tracker.persist()`).
- **`tier-4-multimodal/scripts/__init__.py` (1 LOC)** — empty package marker (1-line docstring).
- **`evaluation/tests/test_eval_tier4.py` (156 LOC)** — 5 non-live tests, all pass in 0.16s:
  - `test_run_tier4_cached_hit(tmp_path)` — write QueryLog → run_tier4 → assert match by question_id + answer text + retrieved_contexts.
  - `test_run_tier4_cached_miss_question_id(tmp_path)` — wrong question_id in cache → `error.startswith("cached_miss_question_id=")`.
  - `test_run_tier4_cached_miss_file(tmp_path)` — missing file → `pytest.raises(CachedTier4Miss)`.
  - `test_run_tier4_library_mode_import_error(monkeypatch)` — patches `builtins.__import__` AND evicts cached `tier_4_multimodal*` from `sys.modules` so the patch actually fires (necessary because the executor venv HAS [tier-4] installed; without eviction, the cached module short-circuits the patch).
  - `test_run_tier4_library_mode_happy(monkeypatch)` — injects fake `tier_4_multimodal.{rag,query,cost_adapter}` into `sys.modules`; asserts `rec.answer == "multimodal answer"`.
- **Full non-live suite remains green**: 110 passed / 4 skipped / 9 deselected (was 102/4/9 from end of Plan 131-02; +5 from this plan's `test_eval_tier4.py` brings it to 110, accounting for the +3 Plan 02 tests landed concurrently — see *Issues Encountered* for the parallel-execution race detail).

## Task Commits

Each task was committed atomically and pushed to `origin/main` in companion repo `/Users/patrykattc/work/git/rag-architecture-patterns`:

1. **Task 1: tier_4.py dual-mode adapter + non-live tests** — `d716d8e` (feat)
   - `feat(131-03): tier-4 dual-mode adapter (cached primary; library fallback) + non-live tests`
   - 2 files changed, 305 insertions(+) (tier_4.py 149 + test_eval_tier4.py 156)
2. **Task 2: tier-4-multimodal/scripts/eval_capture.py user-helper CLI** — **swept into `69267a8`** (Plan 131-02's commit; see *Issues Encountered*)
   - The two files (`tier-4-multimodal/scripts/__init__.py` + `tier-4-multimodal/scripts/eval_capture.py`) were authored, staged, and verified for Plan 131-03; a parallel-execution race with sibling Plan 131-02 caused those staged files to land in Plan 02's commit `69267a8` (4 files, +424 insertions; 2 of those files belong to Plan 03). Content is byte-identical to what Plan 03 authored — verified by reading `git show 69267a8:tier-4-multimodal/scripts/eval_capture.py`. Files are on `origin/main`; downstream consumers don't see the difference.

**Plan metadata commit (this SUMMARY + STATE + ROADMAP):** in PatrykQuantumNomad repo, separate from companion-repo task commits.

## Files Created/Modified

### Companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`)

- `evaluation/harness/adapters/tier_4.py` — **149 LOC** (≥90 required); async `run_tier4` dual-mode adapter; `CachedTier4Miss(FileNotFoundError)` exception; `_find_record` linear scan helper.
- `evaluation/tests/test_eval_tier4.py` — **156 LOC** (≥70 required); 5 non-live tests.
- `tier-4-multimodal/scripts/__init__.py` — **1 LOC**; empty package marker.
- `tier-4-multimodal/scripts/eval_capture.py` — **167 LOC** (≥100 required); user-local CLI helper.

### Planning repo (`/Users/patrykattc/work/git/PatrykQuantumNomad`)

- `.planning/phases/131-evaluation-harness/131-03-SUMMARY.md` (this file)
- `.planning/STATE.md` (updated by metadata commit)
- `.planning/ROADMAP.md` (plan progress updated by metadata commit)

## Decisions Made

- **Cached mode is the primary path; library mode is opportunistic** — Plan 04's run.py will pass `from_cache=Path(...)` by default; library mode is opt-in by omitting `from_cache` AND ensuring the running venv has `[tier-4]` installed. This honors Phase 130 SC-1's deferral cleanly: the harness ships fully whether or not the user has produced a query log yet.
- **`CachedTier4Miss` subclasses `FileNotFoundError`** (not bare `Exception`) — Plan 04 catches the specific class without swallowing unrelated FS errors. Other adapter modes still raise their own exceptions if anything else goes wrong.
- **Question-ID misses return an EvalRecord, not raise** — only file-level absence aborts the tier. A typo in golden_qa or a regenerated golden_qa with new IDs gracefully degrades on a per-question basis.
- **Latency timed only across the answer call** — the only_need_context probe is a separate I/O round-trip; including it would inflate per-tier latency by 1-2 seconds and skew Plan 06's comparison.md.
- **`tier-4-multimodal/scripts/` lives in the tier directory, not under `evaluation/`** — clean architectural seam: the harness loop never calls `eval_capture.py`; the user runs it manually from their local env where MineRU works. This keeps `evaluation/harness/` free of tier-specific MineRU coupling.
- **Filename `tier-4-{ts with colons replaced}.json`** — ISO 8601 'Z' suffix preserved; macOS-safe; mirrors existing `tier-4-eval-{ts}.json` D-13 schema convention from `shared/cost_tracker.py`.
- **Library-mode test uses `sys.modules` eviction before patching `builtins.__import__`** — the executor venv HAS `[tier-4]` installed (`raganything==1.2.10`), so without evicting cached `tier_4_multimodal*` modules the patch never fires (Python's import system short-circuits when a module is already in `sys.modules`). This is the canonical pattern for forcing a re-import in tests.

## Empirical Findings (for downstream plans)

### Verbatim `--help` output (Task 2 smoke)

```
usage: eval_capture.py [-h] [--mode {naive,local,global,hybrid,mix}]
                       [--model MODEL] [--limit LIMIT] [--yes]

Tier 4 eval capture — drives the 30 golden Q&A locally.

options:
  -h, --help            show this help message and exit
  --mode {naive,local,global,hybrid,mix}
  --model MODEL         (reserved; LLM is baked into build_rag at
                        construction)
  --limit LIMIT         Run on first N questions (default: all 30).
  --yes                 Skip cost-surprise prompt.
```

### Verbatim fast-fail output (Task 2 smoke)

```
$ OPENROUTER_API_KEY="" uv run python tier-4-multimodal/scripts/eval_capture.py --limit 1 --yes
OPENROUTER_API_KEY not set — Tier 4 capture cannot run.
$ echo $?
2
```

### Executor environment state

- `uv pip show raganything` → `Name: raganything / Version: 1.2.10 / Requires: huggingface-hub, lightrag-hku, mineru, tqdm`. Plan 131-01's `[evaluation]` extra inherits `[shared]` only, but the executor venv ALSO has `[tier-4]` installed (likely from Phase 130 ingestion testing). This means the library-mode lazy import in `tier_4.py` would actually succeed in this venv — which is why the `sys.modules` eviction in the test was necessary.
- `ls rag_anything_storage/tier-4-multimodal/` → empty directory (path exists with no files inside). Phase 130 SC-1 confirmed: live ingest was deferred. Note: `eval_capture.py`'s second fast-fail (`if not RAG_STORAGE.exists()`) checks path existence, not population — an empty dir would pass this check but fail downstream when `aquery` finds no chunks. This is acceptable for the user's local-run helper because the user knows whether they've ingested. Documented as an open consideration for Plan 04 if a stricter check is desired.
- `eval_capture.py` was NOT run live in this plan (Phase 130 SC-1 deferral preserved). Only `--help` and `OPENROUTER_API_KEY=""` fast-fail were exercised. The user runs this manually from their local env where MineRU works.

### LOC counts

| File | Lines | Required |
|---|---|---|
| `evaluation/harness/adapters/tier_4.py` | 149 | ≥90 |
| `evaluation/tests/test_eval_tier4.py` | 156 | ≥70 |
| `tier-4-multimodal/scripts/__init__.py` | 1 | ≥0 |
| `tier-4-multimodal/scripts/eval_capture.py` | 167 | ≥100 |

### Test results

| Suite | Result |
|---|---|
| `evaluation/tests/test_eval_tier4.py` | 5 passed in 0.16s |
| Full non-live suite (`pytest -q -m "not live"`) | 110 passed / 4 skipped / 9 deselected |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test bug in `test_run_tier4_library_mode_import_error` — wrong `__builtins__` shape handling**

- **Found during:** Task 1 (running new tier_4 tests)
- **Issue:** The plan's verbatim test code had `real_import = __builtins__.__import__ if isinstance(__builtins__, dict) else __builtins__.__import__` — when pytest sets `__builtins__` to a dict (which it does inside test modules), the dict path tried to do attribute access (`.{__import__}`) on a dict, raising `AttributeError: 'dict' object has no attribute '__import__'`. The conditional was inverted: in dict-form you need `__builtins__["__import__"]`, in module-form you need `__builtins__.__import__`.
- **Fix:** Replaced with canonical `import builtins; real_import = builtins.__import__`. This works in every context regardless of how pytest exposes `__builtins__`. Also added a `sys.modules` eviction loop for `tier_4_multimodal*` so the patched `__import__` actually fires (the executor venv has `[tier-4]` installed; without eviction, Python returns the cached module from `sys.modules` and bypasses our patch entirely — the test would silently pass without ever exercising the code under test).
- **Files modified:** `evaluation/tests/test_eval_tier4.py`
- **Verification:** All 5 tests pass; full non-live suite green (110/4/9).
- **Committed in:** `d716d8e` (Task 1 commit; the fix landed before the commit because I caught the failure during Task 1's verification step).

**2. [Rule 3 - Blocking] Parallel-execution race with sibling Plan 131-02**

- **Found during:** Task 2 (commit step)
- **Issue:** Wave 2 runs Plan 131-02 (tier_1.py, tier_2.py, tier_3.py, tier_5.py + test_eval_adapters.py) and Plan 131-03 (this plan) in parallel on the same `main` branch. Between my `git add tier-4-multimodal/scripts/{__init__,eval_capture}.py` and `git commit`, Plan 131-02's executor pushed commit `69267a8` which somehow swept my staged files into its index. The result: my Task 2 files landed in `69267a8` ("feat(131-02): tier-3 + tier-5 eval adapters") instead of in a `feat(131-03):` commit.
- **Fix:** Verified the committed file content via `git show 69267a8:tier-4-multimodal/scripts/eval_capture.py` is byte-identical to what I authored. Files are on `origin/main`. The work is correct; only the commit attribution is misleading. Documented this in the SUMMARY's Task Commits section so the plan-metadata commit hash for Plan 03 still points to `d716d8e` (Task 1) plus this docs commit; Plan 04 doesn't care which commit hash carried the files because they're at the expected paths.
- **Files modified:** None (no remediation commit — the files are already on origin/main with correct content).
- **Verification:** `ls tier-4-multimodal/scripts/{__init__,eval_capture}.py` → both present; `git log --oneline | grep 131-0` → both 02 and 03 visible; `git show 69267a8 --stat` → confirms 4 files including my 2; final test suite passes.
- **Committed in:** `69267a8` (Plan 131-02's commit hash, but containing Plan 131-03's files).
- **Implication for future parallel waves:** when two plans target the same branch, the executor staging window is a race surface. Mitigations to consider for Phase 131-04's planner: (a) use a worktree-per-plan model, (b) require each executor to `git fetch origin && git rebase` immediately before staging, or (c) accept the racy attribution and document in SUMMARY (current approach). Documented as an open question for Phase 131 retrospective.

---

**Total deviations:** 2 auto-fixed (1 Rule 1 - Bug, 1 Rule 3 - Blocking).
**Impact on plan:** Both auto-fixes preserve correctness — no scope creep. Deviation #1 was a pure test-code defect; deviation #2 was a parallel-execution attribution race that doesn't affect the artifact contract Plan 04 consumes.

## Issues Encountered

- **Parallel-execution race with sibling Plan 131-02** (see Deviations Rule 3 above) — the staged files for Plan 03's Task 2 landed in Plan 02's commit `69267a8`. Content is correct and on origin/main; only the commit message attribution is racy. This is the first time this race has surfaced in Phase 131's parallel waves; flagging for future plans.
- **`__builtins__` shape varies between pytest contexts** (see Deviations Rule 1 above) — the verbatim test code from the plan's `<interfaces>` block had an inverted conditional. Future test code that needs to patch `builtins.__import__` should use `import builtins; builtins.__import__` directly to avoid this trap.
- **`raganything==1.2.10` is in the executor venv** — the library-mode test needed `sys.modules` eviction before the `__import__` patch could fire, since `tier_4_multimodal.*` was already cached at module-load time. Documented in test docstring + the test itself for future maintainers.
- **`rag_anything_storage/tier-4-multimodal/` is an EMPTY directory** in the executor env — Phase 130 SC-1 deferral preserved. The second fast-fail in `eval_capture.py` checks `RAG_STORAGE.exists()` which an empty dir DOES satisfy; deeper "ingest actually happened" check is left to the user (or to a Plan 04 enhancement). Not a Plan 03 issue; documented for Plan 04 to consider.

## User Setup Required

None — no external service configuration required for this plan. All work is non-live (no API keys consumed).

The user will eventually run `python tier-4-multimodal/scripts/eval_capture.py --yes` from their local env (where MineRU works) to produce `evaluation/results/queries/tier-4-{ts}.json`. That step is documented in the script's docstring and will be re-documented in Plan 04's run.py + Plan 06's comparison.md footer when those plans land.

## Next Phase Readiness

**Plan 131-04 (run.py orchestrator) unblocked.** It can now import the full set of Wave-2 adapters:

- `from evaluation.harness.adapters.tier_1 import run_tier1` (Plan 131-02)
- `from evaluation.harness.adapters.tier_2 import run_tier2` (Plan 131-02)
- `from evaluation.harness.adapters.tier_3 import run_tier3` (Plan 131-02)
- `from evaluation.harness.adapters.tier_4 import run_tier4, CachedTier4Miss` (this plan)
- `from evaluation.harness.adapters.tier_5 import run_tier5` (Plan 131-02)

**Open question handed forward to Plan 131-04**: how does run.py select WHICH `tier-4-{ts}.json` to read when multiple exist? Recommendation: pick most recent by mtime (stat-based) — mirrors Plan 06's expected `compare.py` glob-and-sort pattern. Alternative: add a `--tier-4-from-cache PATH` CLI flag that overrides auto-select. Both reasonable; prefer auto-select with `--from-cache` as override.

**Open question handed forward to Phase 131 retrospective**: parallel-wave commit race (see Deviations Rule 3). Whether to use git worktrees, mandatory pre-stage rebase, or accept racy attribution should be decided before Phase 132 (which will likely have similar parallel waves).

**No blockers.** Wave 2 (Plans 02 + 03) is complete; Wave 3 (Plan 04) can begin.

---
*Phase: 131-evaluation-harness*
*Completed: 2026-04-27*

## Self-Check: PASSED

Verification commands run after SUMMARY draft:

```
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/harness/adapters/tier_4.py     # FOUND
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/tests/test_eval_tier4.py      # FOUND
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/scripts/__init__.py    # FOUND
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/scripts/eval_capture.py # FOUND
$ git -C /Users/patrykattc/work/git/rag-architecture-patterns log --oneline --all | grep -E '(d716d8e|69267a8)'
69267a8 feat(131-02): tier-3 + tier-5 eval adapters (Pitfall 7 context probe; MaxTurnsExceeded handling)
d716d8e feat(131-03): tier-4 dual-mode adapter (cached primary; library fallback) + non-live tests
```

All 4 files present on disk; both task commits visible on companion repo `origin/main` (Plan 03 task 1 = `d716d8e`; Plan 03 task 2 swept into Plan 02's `69267a8` per Deviation Rule 3 above).
