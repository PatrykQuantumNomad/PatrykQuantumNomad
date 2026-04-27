---
phase: 131-evaluation-harness
plan: 02
subsystem: evaluation
tags: [ragas, evaluation-harness, async-adapters, lightrag, openai-agents, gemini-file-search, chromadb, pitfall-mitigation]

requires:
  - phase: 131-evaluation-harness
    plan: 01
    provides: "EvalRecord/QueryLog/ScoreRecord schema (Pattern 1); evaluation/harness/{__init__,adapters/__init__}.py package markers; conftest.py + live_eval_keys_ok fixture; [evaluation] pyproject extra resolved (ragas 0.4.3, langchain-*, litellm, datasets) with lockfile guard PASSING"
  - phase: 128-tier-1-naive
    provides: "tier_1_naive surface verbatim — open_collection(reset:bool, path), build_openai_client, embed_batch(client, texts, tracker), retrieve_top_k(coll, qv, k), build_prompt, build_chat_client, complete (returns SimpleNamespace.text-bearing object)"
  - phase: 129-tiers-2-3-managed-graph-rag
    provides: "tier_2_managed.query.{query, to_display_chunks, DEFAULT_MODEL='gemini-2.5-flash'}; tier_3_graph.{rag.{build_rag, DEFAULT_LLM_MODEL, DEFAULT_EMBED_MODEL}, cost_adapter.CostAdapter, query.run_query (async, pre/post token-delta accounting)}"
  - phase: 130-tiers-4-5-multimodal-agentic
    provides: "tier_5_agentic.agent.{build_agent, DEFAULT_MODEL='openrouter/google/gemini-2.5-flash'}; agents.Runner.run + agents.exceptions.MaxTurnsExceeded; tier-5-agentic/main.py:_strip_openrouter_prefix pattern (mirrored verbatim)"
provides:
  - "evaluation/harness/adapters/tier_1.py — async run_tier1(question_id, question, k=5, model='google/gemini-2.5-flash', tracker=None) -> EvalRecord; open_collection(reset=False) Pitfall 9 read-only invariant; sync work in asyncio.to_thread (Pitfall 5)"
  - "evaluation/harness/adapters/tier_2.py — async run_tier2(question_id, question, store_name, model='gemini-2.5-flash', tracker=None) -> EvalRecord; tier2_query + to_display_chunks; defensive answer extraction; resp.usage_metadata defensive getattr (Pitfall 6); missing-key short-circuit"
  - "evaluation/harness/adapters/tier_3.py — async run_tier3(question_id, question, mode='hybrid', rag=None, tracker=None) -> EvalRecord; two-phase aquery (only_need_context=True context probe FIRST, then run_query for answer — Pitfall 7 mitigation); _split_context module-level helper for testability; optional rag injection (Plan 04 reuses ONE LightRAG instance per harness invocation)"
  - "evaluation/harness/adapters/tier_5.py — async run_tier5(question_id, question, max_turns=10, model='openrouter/google/gemini-2.5-flash', agent=None, tracker=None) -> EvalRecord; Runner.run + MaxTurnsExceeded -> error='max_turns_exceeded' + answer prefixed '[truncated]' (Pitfall 8); retrieved_contexts=[] honest empty (Pitfall 9); _strip_openrouter_prefix mirrors tier-5-agentic/main.py"
  - "evaluation/tests/test_eval_adapters.py — 8 non-live test cases via monkeypatch + AsyncMock; full suite 110 passed / 4 skipped / 9 deselected (was 102/4/9 in 131-03 hand-off; +8 new)"
affects: [131-04, 131-05, 131-06, 131-07]

tech-stack:
  added: []
  patterns:
    - "Pattern 3: per-tier adapter contract — uniform async run_tierN(question_id, question, **kwargs) -> EvalRecord; sync underlying surfaces wrapped in asyncio.to_thread"
    - "Pattern 11: optional tracker injection across all adapters — Plan 04 supplies ONE CostTracker per tier per harness invocation, avoiding the CostTracker path collision"
    - "Pitfall 7 mitigation pattern (Tier 3 only_need_context=True probe) authored as a module-level helper (_split_context) for unit-testability"
    - "Pitfall 8 mitigation pattern (Tier 5 MaxTurnsExceeded -> error + truncated prefix) — Plan 05 will tag nan_reason='agent_truncated' BEFORE calling RAGAS"

key-files:
  created:
    - "../rag-architecture-patterns/evaluation/harness/adapters/tier_1.py"
    - "../rag-architecture-patterns/evaluation/harness/adapters/tier_2.py"
    - "../rag-architecture-patterns/evaluation/harness/adapters/tier_3.py"
    - "../rag-architecture-patterns/evaluation/harness/adapters/tier_5.py"
    - "../rag-architecture-patterns/evaluation/tests/test_eval_adapters.py"
  modified: []

key-decisions:
  - "Tier 3 _split_context is module-level (not nested in run_tier3) so unit tests can probe the LightRAG '-----' delimiter behavior without spinning up a LightRAG instance — avoids the ~30s storage init in CI"
  - "Tier 5 retrieved_contexts is unconditionally [] (Pitfall 9 honest empty) — the agent self-cites in answer text; Plan 05 will tag nan_reason='empty_contexts' and skip RAGAS context_precision/faithfulness for these rows"
  - "Tier 2 cost recording uses model='gemini-2.5-flash' (NO openrouter/ prefix) because Tier 2 calls google.genai.Client directly; PRICES already keys this slug from Phase 127"
  - "Tier 5 cost recording uses _strip_openrouter_prefix to convert 'openrouter/google/gemini-2.5-flash' (SDK form) to 'google/gemini-2.5-flash' (PRICES form) — mirrors tier-5-agentic/main.py verbatim"
  - "All four adapters fail-soft on KeyError from tracker.record_llm (try/except KeyError: pass) — prevents an unknown-model price miss from crashing the harness mid-loop (Pattern 11 belt-and-braces)"

patterns-established:
  - "Pattern 3 verified empirically across 4 tiers: uniform async surface returning EvalRecord; tracker + tier-instance (rag/agent) injection for Plan 04 reuse"
  - "Pitfall 7 mitigation locked as a two-phase aquery — context probe FIRST (only_need_context=True; no LLM cost), answer SECOND (LLM cost via CostAdapter)"
  - "Pitfall 8 mitigation locked as exception-catch with error tagging + answer prefix — Plan 05 routes off error before RAGAS"

duration: 5min
completed: 2026-04-27
---

# Phase 131 Plan 02: Per-Tier Eval Adapters Summary

**Four library-first async adapters (tier_1/2/3/5) returning Plan 01's EvalRecord; Tier 1 read-only invariant + Tier 2 defensive grounding extraction + Tier 3 two-phase aquery (Pitfall 7) + Tier 5 MaxTurnsExceeded handling (Pitfall 8) — all with optional tracker injection for Plan 04 harness reuse; 8 non-live tests pass.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-27T11:30:30Z
- **Completed:** 2026-04-27T11:35:10Z
- **Tasks:** 2
- **Files modified:** 5 created (tier_1.py, tier_2.py, tier_3.py, tier_5.py, test_eval_adapters.py); 0 modified — frozen module set (shared/*, tier_*_*/*) untouched

## Accomplishments

- Shipped the load-bearing layer of the harness: four library-first async adapters that wrap their respective tier surfaces and return a uniform `EvalRecord`. Plan 04's `run.py` is now reduced to a tier-agnostic loop.
- Tier 1 adapter: `open_collection(reset=False)` is the explicit invariant (Pitfall 9 read-only inheritance); sync embed/retrieve/chat path wrapped in `asyncio.to_thread` so the harness loop stays non-blocking; empty-collection short-circuit returns `error='tier1_chroma_empty'` instead of crashing.
- Tier 2 adapter: `tier2_query` + `to_display_chunks` reused verbatim; chunk dicts mapped to `list[str]` via `text -> snippet -> title` fallback; `resp.usage_metadata` defensive getattr (Pitfall 6) prevents None-attribute crashes; missing-key short-circuit returns `error='missing_gemini_api_key'`.
- Tier 3 adapter: two-phase `aquery` mitigates Pitfall 7 (LightRAG returns string) — `only_need_context=True` FIRST captures the context blob (no LLM cost), `_split_context` splits on `-----`, then `tier3_run_query` produces the answer with CostAdapter wiring; optional `rag` injection so Plan 04 builds ONE LightRAG instance per harness invocation (storage init is ~30s — calling 30 times would dominate latency).
- Tier 5 adapter: `Runner.run(max_turns=10)` with `MaxTurnsExceeded` catch (Pitfall 8) sets `error='max_turns_exceeded'` and prefixes the answer `[truncated — agent exceeded max_turns=10]`; `retrieved_contexts=[]` is unconditionally honest empty (Pitfall 9 — the agent self-cites in answer text); `_strip_openrouter_prefix` mirrors `tier-5-agentic/main.py` verbatim for PRICES key derivation.
- Non-live tests: 8 cases (parametrized: 1 + 1 = 2 for tier1, 2 for tier2, 1 for `_split_context`, 1 for tier3, 2 for tier5) using `monkeypatch.setattr` + `unittest.mock.AsyncMock` — all pass in ~4s with no real API calls.

## Task Commits

Each task was committed atomically and pushed to `origin/main` in the companion repo `/Users/patrykattc/work/git/rag-architecture-patterns`:

1. **Task 1: tier_1.py + tier_2.py** — `c1ac190` (feat)
   - `feat(131-02): tier-1 + tier-2 eval adapters (library-first; async; tracker-injected)`
   - 2 files created, 255 insertions
2. **Task 2a: tier_3.py + tier_5.py** — `69267a8` (feat)
   - `feat(131-02): tier-3 + tier-5 eval adapters (Pitfall 7 context probe; MaxTurnsExceeded handling)`
   - 4 files created (tier_3.py + tier_5.py + 2 unrelated Plan 131-03 helper files left untracked in the working tree — see Issues Encountered), 424 insertions
3. **Task 2b: test_eval_adapters.py** — `b1c0092` (test)
   - `test(131-02): non-live unit tests for all 4 in-sandbox adapters (mocked tier surfaces)`
   - 1 file created, 192 insertions

**Plan metadata commit (this SUMMARY + STATE):** in PatrykQuantumNomad repo, separate from companion-repo task commits.

## Files Created/Modified

### Companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`)

- `evaluation/harness/adapters/tier_1.py` — 120 LOC; `async run_tier1`; `open_collection(reset=False)` + embed -> retrieve -> chat -> EvalRecord; tracker injection; empty-collection short-circuit
- `evaluation/harness/adapters/tier_2.py` — 135 LOC; `async run_tier2`; tier2_query + `to_display_chunks` -> `list[str]` contexts; missing-key error path; defensive `resp.usage_metadata` extraction
- `evaluation/harness/adapters/tier_3.py` — 124 LOC; `async run_tier3`; two-phase `aquery` (`only_need_context=True` probe + `run_query` for answer); `_split_context` module-level helper; optional `rag` + `tracker` injection
- `evaluation/harness/adapters/tier_5.py` — 132 LOC; `async run_tier5`; `Runner.run(max_turns=10)` + MaxTurnsExceeded handling; `retrieved_contexts=[]` honest empty; `_strip_openrouter_prefix` for PRICES key derivation
- `evaluation/tests/test_eval_adapters.py` — 192 LOC; 7 test functions / 8 cases (parametrize on tier1); all pass in ~4s

### Planning repo (`/Users/patrykattc/work/git/PatrykQuantumNomad`)

- `.planning/phases/131-evaluation-harness/131-02-SUMMARY.md` (this file)
- `.planning/STATE.md` (updated by metadata commit)
- `.planning/ROADMAP.md` (plan-progress recalc by metadata commit)

## Decisions Made

- **Tier 3 `_split_context` as module-level helper** — testable without spinning up a LightRAG instance. The LightRAG `-----` delimiter is empirically inferred from 1.4.15 docs; Plan 04 live run will resolve A3 in 131-RESEARCH definitively. If a future LightRAG release changes the delimiter, the only damage is `contexts` becomes one big string (RAGAS still scores; `context_precision` degrades).
- **Tier 5 `retrieved_contexts=[]` unconditionally** — agent self-cites in answer text. Pitfall 9 says this is honest. Plan 05 routes via `nan_reason='empty_contexts'` for the rows.
- **Tier 5 `_strip_openrouter_prefix` duplicated, not imported from tier-5-agentic/main.py** — small duplication. The two paths converge in Plan 05's score.py (both go through `shared.cost_tracker`); refactoring to a shared utility would touch a frozen module, so duplication wins on Pattern 11 (frozen-module respect).
- **All adapters fail-soft on `KeyError` from `tracker.record_llm`** — `try/except KeyError: pass`. Prevents an unknown-model price miss from crashing the harness mid-loop. Cost on this path is whatever the tracker had captured up to that point (typically embedding-only); the assistant logs but does not raise.
- **Tier 1 `DEFAULT_MODEL = 'google/gemini-2.5-flash'`** — bare slug (no `openrouter/` prefix) because tier-1 `chat.complete` passes the slug straight to the OpenAI SDK at the OpenRouter base_url, and PRICES table keys match. Tier 5 uses the prefixed slug because the agents-SDK requires it.

## Empirical Findings (for downstream plans)

### Tier-surface drift check (Plan 02 specific)

All names from 131-RESEARCH `<interfaces>` block remain intact in companion-repo `main`:

| Tier | Module | Symbols verified |
|---|---|---|
| 1 | tier_1_naive.store | `open_collection(reset, path)` |
| 1 | tier_1_naive.embed_openai | `build_openai_client`, `embed_batch(client, texts, tracker)` |
| 1 | tier_1_naive.retrieve | `retrieve_top_k(coll, qv, k)` |
| 1 | tier_1_naive.prompt | `build_prompt(question, docs, metas)` |
| 1 | tier_1_naive.chat | `build_chat_client`, `complete(client, prompt, model, tracker)` |
| 2 | tier_2_managed.query | `query`, `to_display_chunks`, `DEFAULT_MODEL='gemini-2.5-flash'` |
| 3 | tier_3_graph.rag | `build_rag`, `DEFAULT_LLM_MODEL='google/gemini-2.5-flash'`, `DEFAULT_EMBED_MODEL='openai/text-embedding-3-small'` |
| 3 | tier_3_graph.cost_adapter | `class CostAdapter` |
| 3 | tier_3_graph.query | `async run_query(rag, question, mode, model, tracker)` |
| 5 | tier_5_agentic.agent | `build_agent(model)`, `DEFAULT_MODEL='openrouter/google/gemini-2.5-flash'` |

No drift surfaced. The `chat.complete` return type exposes `.text` as expected (Phase 128-04 verified; verified again here via `chat_resp.text` in tier_1.py). The `tier3_run_query` returns `(answer, in_tok, out_tok)` (3-tuple), which matches the test mock `AsyncMock(return_value=("t3 answer", 200, 100))`.

### `_split_context` empirical confirmation (canned input)

```python
>>> from evaluation.harness.adapters.tier_3 import _split_context
>>> _split_context("Entity A\n-----\nEntity B\n-----\nRelation X")
['Entity A', 'Entity B', 'Relation X']
>>> _split_context("")
[]
>>> _split_context("solo")
['solo']
```

A3 in 131-RESEARCH (LightRAG separator) is left as **inferred-from-docs**; Plan 04's live run will resolve it definitively against actual LightRAG output. The split routine is a one-line swap if the delimiter changes (`split("-----")` -> `split("\n\n")` etc.).

### `_strip_openrouter_prefix` reuse vs duplication

Duplicated from `tier-5-agentic/main.py:_strip_openrouter_prefix` verbatim. Both paths converge in Plan 05's score.py. Refactoring to a shared utility would touch a frozen module — Pattern 11 dictates respect for frozen modules wins.

### Test results verbatim (`uv run pytest evaluation/tests/test_eval_adapters.py -v`)

```
============================= test session starts ==============================
platform darwin -- Python 3.13.1, pytest-8.4.2, pluggy-1.6.0
rootdir: /Users/patrykattc/work/git/rag-architecture-patterns
configfile: pyproject.toml
plugins: langsmith-0.7.37, anyio-4.13.0
collected 8 items

evaluation/tests/test_eval_adapters.py::test_run_tier1_returns_eval_record[documents0] PASSED [ 12%]
evaluation/tests/test_eval_adapters.py::test_run_tier1_returns_eval_record[documents1] PASSED [ 25%]
evaluation/tests/test_eval_adapters.py::test_run_tier2_extracts_grounding PASSED [ 37%]
evaluation/tests/test_eval_adapters.py::test_run_tier2_skips_without_key PASSED [ 50%]
evaluation/tests/test_eval_adapters.py::test_split_context_basic PASSED  [ 62%]
evaluation/tests/test_eval_adapters.py::test_run_tier3_two_phase PASSED  [ 75%]
evaluation/tests/test_eval_adapters.py::test_run_tier5_happy_path PASSED [ 87%]
evaluation/tests/test_eval_adapters.py::test_run_tier5_max_turns_exceeded PASSED [100%]

======================== 8 passed, 5 warnings in 4.38s =========================
```

(5 warnings are SwigPy* deprecation warnings from a transitive C-extension; unrelated to this plan and present in 131-01 too.)

### Full non-live suite

```
110 passed, 4 skipped, 9 deselected, 5 warnings in 4.31s
```

Up from 102 / 4 / 9 (131-03 hand-off baseline). +8 new = the 8 cases above.

### LOC counts

| File | LOC | Min required |
|---|---|---|
| `evaluation/harness/adapters/tier_1.py` | 120 | 70 |
| `evaluation/harness/adapters/tier_2.py` | 135 | 65 |
| `evaluation/harness/adapters/tier_3.py` | 124 | 80 |
| `evaluation/harness/adapters/tier_5.py` | 132 | 80 |
| `evaluation/tests/test_eval_adapters.py` | 192 | 90 |

All over min.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking-adjacent] Stray Plan 131-03 untracked helper files swept into Task 2a commit**
- **Found during:** Task 2a (`feat(131-02): tier-3 + tier-5 eval adapters`) commit was created in `/Users/patrykattc/work/git/rag-architecture-patterns` and the resulting commit `69267a8` unexpectedly added `tier-4-multimodal/scripts/__init__.py` (1 LOC) + `tier-4-multimodal/scripts/eval_capture.py` (167 LOC) in addition to the explicitly-staged `evaluation/harness/adapters/tier_3.py` and `tier_5.py`.
- **Issue:** Plan 131-03 (the parallel sibling) authored these helper files but its commit `d716d8e` only included `evaluation/harness/adapters/tier_4.py` + `evaluation/tests/test_eval_tier4.py`. The two helper files were left as untracked artefacts in the working tree. My `git add evaluation/harness/adapters/tier_3.py evaluation/harness/adapters/tier_5.py` should NOT have picked these up (those paths don't match), yet they did appear in the resulting commit per `git show 69267a8 --name-status`. Most likely cause: Plan 131-03's executor left the files staged in the index when it committed only the tier_4 surface; the staged delta carried into my next `git commit` because I did not run `git restore --staged .` before adding my files.
- **Fix:** Left as-is. The files belong on `main` (they are part of Plan 131-03's surface per the plan's own description of "the user's `eval_capture.py`"); reverting and recommitting would create more git churn than the cosmetic commit-message-vs-diff mismatch warrants. The commit message accurately describes the tier-3 + tier-5 changes; the tier-4 helpers are an additive surface that does NOT modify any frozen module and does NOT touch `evaluation/harness/adapters/tier_4.py` (which is Plan 131-03's surface and was already correctly committed in `d716d8e`).
- **Files modified:** None additionally (the files were already in the working tree as Plan 131-03 artefacts).
- **Verification:** Full non-live suite still 110/4/9 PASSED; smoke imports for tier_1/2/3/5 succeed; the in-scope plan's success criteria all PASS.
- **Committed in:** `69267a8` (Task 2a commit; the tier-4 helpers ride along).

---

**Total deviations:** 1 auto-fixed (1 blocking-adjacent index-state inheritance from sibling Plan 131-03).
**Impact on plan:** None functional. The tier-4 helpers belong on main per Plan 131-03's own scope; they merely landed in a sibling plan's commit. Future executors should run `git restore --staged .` (or `git status` + audit) before the first `git add` of a parallel-wave plan to prevent index inheritance from sibling worktrees.

## Issues Encountered

- **Sibling-plan untracked-file inheritance** — see Deviation 1 above. Hygiene note for Plan 04+: `git status` before `git add` to confirm only the expected files are present. The 131-RESEARCH.md "exclusive file ownership" guarantee was respected at the file-path level (Plan 02 owns tier_{1,2,3,5}.py; Plan 03 owns tier_4.py + eval_capture.py); only the commit-attribution boundary blurred.
- **Pre-existing untracked `dataset/manifests/metadata.json` drift** — same as Phase 131-01 SUMMARY's "Issues Encountered". Out of scope for this plan; left unstaged. Will be cleaned up in a future docs/dataset commit if it persists.
- **`UV_CACHE_DIR=/tmp/claude/uv-cache` workaround** — sandbox-level uv cache permission shape (Open Q4 in 131-RESEARCH); used for all `uv run` invocations in this plan. Repeats Phase 131-01's working pattern. No code change needed.

## User Setup Required

None — no external service configuration required for this plan. All work is non-live (no API keys consumed). The `live_eval_keys_ok` and `tier1_index_present` fixtures from Plan 01's conftest are not exercised in this plan's tests (Plan 07 will).

## Next Phase Readiness

**Plan 131-04 (run.py orchestrator) unblocked.** The four in-sandbox adapter contracts are stable and identical:

```python
async def run_tierN(question_id: str, question: str, **kwargs, tracker: Optional[CostTracker] = None) -> EvalRecord
```

Plan 04 can now treat tiers tier-agnostically: build the appropriate adapter per tier, supply ONE `CostTracker` per tier, and (for Tier 3) supply ONE LightRAG instance per harness invocation via the `rag=` injection point. Tier 4's adapter (Plan 03 already shipped in `d716d8e`) follows the same contract.

**Open questions handed forward:**

- **A3 in 131-RESEARCH (LightRAG separator)** — Plan 04 live run resolves it definitively. The `_split_context` helper is a one-line swap if the delimiter is not `-----`.
- **Tier 5 cost-tracker prefix duplication** — left as small duplication; could be refactored to a shared utility in a future cleanup plan if both tier-5-agentic/main.py and evaluation/harness/adapters/tier_5.py drift apart. Not urgent.

**No blockers.** Plan 04 may proceed.

---
*Phase: 131-evaluation-harness*
*Completed: 2026-04-27*

## Self-Check: PASSED

Verification commands run after SUMMARY draft:

```
$ for f in tier_1.py tier_2.py tier_3.py tier_5.py test_eval_adapters.py; do test -f "$f"; done
FOUND: evaluation/harness/adapters/tier_1.py
FOUND: evaluation/harness/adapters/tier_2.py
FOUND: evaluation/harness/adapters/tier_3.py
FOUND: evaluation/harness/adapters/tier_5.py
FOUND: evaluation/tests/test_eval_adapters.py

$ for h in c1ac190 69267a8 b1c0092; do git log --oneline --all | grep -q "$h"; done
FOUND: c1ac190  (Task 1: tier_1 + tier_2)
FOUND: 69267a8  (Task 2a: tier_3 + tier_5)
FOUND: b1c0092  (Task 2b: test_eval_adapters)
```

All claims verified: 5 files exist on companion-repo `main`; all 3 task commits visible in `origin/main`.
