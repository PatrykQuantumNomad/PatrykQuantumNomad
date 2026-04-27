---
phase: 131-evaluation-harness
plan: 01
subsystem: evaluation
tags: [ragas, langchain, litellm, datasets, pydantic-v2, evaluation-harness, pyproject-extras, lockfile-guard]

requires:
  - phase: 127-repository-skeleton-enterprise-dataset
    provides: "shared/pricing.py PRICES (google/gemini-2.5-flash + openai/text-embedding-3-small already present); shared/cost_tracker.py D-13 timestamp format; tests/test_tier_requirements.py lockfile guard"
  - phase: 128-tier-1-naive
    provides: "OpenRouter routing recipe (single OPENROUTER_API_KEY for both embeddings and chat via OpenAI-compatible base_url); chroma_db/tier-1-naive/ index Plan 07 will reuse"
  - phase: 130-tiers-4-5-multimodal-agentic
    provides: "tier-5-agentic/tests/conftest.py sys.path bootstrap pattern (verbatim mirrored here); test filename uniqueness convention (test_tierN_e2e_live.py); openai-agents[litellm]==0.14.6 + raganything==1.2.10 lockfile co-existence proof"
provides:
  - "[evaluation] pyproject extra inheriting [shared] only (Pattern 10 — does NOT depend on any [tier-N])"
  - "evaluation/harness/records.py — EvalRecord/QueryLog/ScoreRecord Pydantic v2 schema (single load-bearing contract for Plans 02-07)"
  - "evaluation/harness/__init__.py + adapters/__init__.py — package markers"
  - "evaluation/tests/conftest.py — live_eval_keys_ok + tier1_index_present fixtures + repo-root sys.path bootstrap + load_dotenv"
  - "evaluation/tests/test_eval_records.py — 6 non-live tests proving roundtrip + nan_reason permutations"
  - ".gitignore additions: evaluation/results/queries/ + evaluation/results/metrics/ (regenerable intermediates); costs/ + comparison.md remain tracked"
  - "Empirical confirmation that ragas==0.4.3 + langchain-community==0.4.1 do NOT pull google-generativeai (Pitfall 4 mitigated)"
  - "Empirical RAGAS import surface confirmed: ragas.llms.llm_factory + ragas.embeddings.base.embedding_factory + ragas.cost.get_token_usage_for_openai all import cleanly"
affects: [131-02, 131-03, 131-04, 131-05, 131-06, 131-07, 133-blog-publication]

tech-stack:
  added: ["ragas==0.4.3", "langchain-openai==0.3.34", "langchain-community==0.4.1", "langchain-core==1.3.2", "langchain==1.2.15", "litellm==1.83.0", "datasets==4.8.4"]
  patterns: ["Pattern 10: [evaluation] extra inherits [shared] only (no [tier-N] entanglement)", "Pattern 1: EvalRecord/QueryLog/ScoreRecord schema as single source of truth across all 7 plans", "Pattern 12: evaluation/tests/ omits __init__.py (basename-uniqueness rule); test_eval_*.py filenames unique repo-wide"]

key-files:
  created:
    - "../rag-architecture-patterns/evaluation/harness/__init__.py"
    - "../rag-architecture-patterns/evaluation/harness/records.py"
    - "../rag-architecture-patterns/evaluation/harness/adapters/__init__.py"
    - "../rag-architecture-patterns/evaluation/tests/conftest.py"
    - "../rag-architecture-patterns/evaluation/tests/test_eval_records.py"
  modified:
    - "../rag-architecture-patterns/pyproject.toml"
    - "../rag-architecture-patterns/uv.lock"
    - "../rag-architecture-patterns/.gitignore"

key-decisions:
  - "Pydantic v2 idioms locked: model_dump_json(indent=2) + model_validate_json (NOT v1 parse_file/parse_raw which emit deprecation warnings on pydantic 2.10+)"
  - "ScoreRecord allows all 3 RAGAS metrics + nan_reason to be Optional — Pitfall 2 (empty contexts) and Pitfall 8 (Tier 5 MaxTurnsExceeded) MUST yield NaN, not zero"
  - "EvalRecord.retrieved_contexts uses Field(default_factory=list) — mutable default trap avoidance"
  - "evaluation/tests/conftest.py mirrors tier-5-agentic verbatim (load_dotenv override=False; env-set vars win over .env)"
  - "RAGAS deprecation warnings noted: ragas.metrics imports work in 0.4.3 but emit DeprecationWarning pointing at ragas.metrics.collections — Plan 05 will migrate to the new path"
  - "evaluation/results/comparison.md NOT gitignored (Phase 133 BLOG-04 imports it verbatim; D-13 frozen)"
  - "evaluation/results/costs/ NOT gitignored at directory level (Phase 128 precedent); only *.json files inside costs/ are gitignored via existing rule"

patterns-established:
  - "Pattern 10 verified empirically: [evaluation] extra inherits [shared] only — RAGAS judge routes via OpenRouter LiteLLM, no top-level [tier-N] import"
  - "Pattern 1 verified empirically: EvalRecord/QueryLog/ScoreRecord schema roundtrips cleanly via tmp_path; 6 non-live tests cover defaults + full + nan_reason permutations"
  - "Lockfile guard regression pattern (Pitfall 4): every time a new pyproject extra is added, re-run tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk post-uv-lock to confirm google-generativeai stays excluded"

duration: 4min
completed: 2026-04-27
---

# Phase 131 Plan 01: Evaluation Harness Foundation Summary

**[evaluation] pyproject extra (ragas 0.4.3 + langchain-* + litellm + datasets) regenerated lockfile with google-generativeai still excluded; EvalRecord/QueryLog/ScoreRecord Pydantic v2 schema + conftest fixtures committed; 6 non-live tests pass; full suite 97 passed / 4 skipped / 9 deselected (was 91/4/9).**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-27T11:19:05Z
- **Completed:** 2026-04-27T11:23:31Z
- **Tasks:** 2
- **Files modified:** 8 (3 modified — pyproject.toml, uv.lock, .gitignore; 5 created — evaluation/harness/{__init__,records,adapters/__init__}.py + evaluation/tests/{conftest,test_eval_records}.py)

## Accomplishments

- Locked the load-bearing contract every Wave 2-6 plan depends on: `EvalRecord{question_id, question, answer, retrieved_contexts, latency_s, cost_usd_at_capture, error}`, `QueryLog{tier, timestamp, git_sha, model, records}`, `ScoreRecord{question_id, faithfulness?, answer_relevancy?, context_precision?, nan_reason?}` — Pydantic v2 throughout.
- Added `[project.optional-dependencies.evaluation]` extra inheriting `[shared]` only (Pattern 10) and appended `"evaluation"` to `[tool.setuptools].packages` so `import evaluation.harness` works after `uv pip install -e ".[evaluation]"`.
- Regenerated `uv.lock` (added 30+ packages incl. ragas==0.4.3, langchain==1.2.15, langchain-core==1.3.2, langchain-openai==0.3.34, langchain-community==0.4.1, langgraph==1.1.9, litellm==1.83.0, datasets==4.8.4, pyarrow==24.0.0, scikit-network==0.33.5, sqlalchemy==2.0.49) and re-ran the lockfile guard test — `tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk` PASSES post-lock (Pitfall 4 mitigated empirically).
- Authored `evaluation/tests/conftest.py` mirroring `tier-5-agentic/tests/conftest.py` (repo-root sys.path bootstrap + load_dotenv) plus two harness-specific fixtures: `live_eval_keys_ok` (skips on missing OPENROUTER_API_KEY) and `tier1_index_present` (skips if `chroma_db/tier-1-naive/` absent — Plan 07 dependency).
- 6 non-live tests in `evaluation/tests/test_eval_records.py` pass: EvalRecord defaults/full + QueryLog roundtrip via `tmp_path` + ScoreRecord nan_reason permutations (`empty_contexts`, `agent_truncated`, `full_pass`).
- `.gitignore` adds `evaluation/results/queries/` + `evaluation/results/metrics/` (regenerable intermediates); `costs/` and `comparison.md` remain tracked per D-13 freeze + Phase 133 BLOG-04 contract.

## Task Commits

Each task was committed atomically and pushed to `origin/main` in the companion repo `/Users/patrykattc/work/git/rag-architecture-patterns`:

1. **Task 1: Add [evaluation] extra + regenerate lockfile + verify lockfile guard still passes** — `b6210cf` (feat)
   - `feat(131-01): add [evaluation] pyproject extra (ragas 0.4.3, langchain-*, litellm, datasets)`
   - 3 files changed, 1091 insertions(+), 102 deletions(-) (uv.lock dominates)
2. **Task 2: Author EvalRecord/QueryLog/ScoreRecord schema + conftest + non-live test** — `d839d81` (feat)
   - `feat(131-01): EvalRecord schema + conftest fixtures + non-live records test`
   - 5 files changed, 219 insertions(+)

**Plan metadata commit (this SUMMARY + STATE):** in PatrykQuantumNomad repo, separate from companion-repo task commits.

## Files Created/Modified

### Companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`)

- `pyproject.toml` — added `[project.optional-dependencies.evaluation]` (6 deps inheriting `[shared]`); appended `"evaluation"` to `[tool.setuptools].packages`
- `uv.lock` — regenerated; +30 new packages, 0 deprecated SDKs added (lockfile guard PASSES)
- `.gitignore` — added 3 lines (1 comment + 2 ignore globs) for evaluation/results/{queries,metrics}/
- `evaluation/harness/__init__.py` — 1 line (docstring); empty package marker
- `evaluation/harness/records.py` — 84 LOC; Pattern 1 schema verbatim (EvalRecord + QueryLog + ScoreRecord + read/write helpers)
- `evaluation/harness/adapters/__init__.py` — 4 lines (multi-line docstring noting Plans 02/03 ship adapters)
- `evaluation/tests/conftest.py` — 36 LOC; 2 fixtures + sys.path bootstrap + load_dotenv
- `evaluation/tests/test_eval_records.py` — 94 LOC; 6 non-live tests

### Planning repo (`/Users/patrykattc/work/git/PatrykQuantumNomad`)

- `.planning/phases/131-evaluation-harness/131-01-SUMMARY.md` (this file)
- `.planning/STATE.md` (updated by metadata commit)

## Decisions Made

- **RAGAS version pinned at `>=0.4.3,<0.5`** — research validated 0.4.3 as latest stable; <0.5 prevents the breaking ragas 1.0 migration from breaking Plans 02-07 silently. Resolved version is exactly 0.4.3.
- **`langchain-community>=0.4,<0.5`** — research-verified that 0.4.1 (the resolved version) excludes `google-generativeai` from `requires_dist`, which was the Pitfall 4 risk. The lockfile guard test confirmed this empirically post-lock.
- **No PRICES edit needed (Pattern 7)** — `shared/pricing.py` lines 36 + 40 already contain `openai/text-embedding-3-small` ($0.02/$0.0) and `google/gemini-2.5-flash` ($0.30/$2.50/$0.03 cache). RAGAS judge runs through `litellm` via OpenRouter using these existing slugs.
- **Pydantic v2 path locked**: `model_dump_json(indent=2)` and `model_validate_json` — NOT `parse_file`/`parse_raw`/`dict()`/`json()`. The shared.config already pins pydantic>=2.10, so v1 paths emit deprecation warnings.
- **`evaluation/results/costs/` NOT directory-level gitignored** — there's already a more granular rule (`evaluation/results/costs/*.json` with `!evaluation/results/costs/.gitkeep`); leaving it intact preserves Phase 128 precedent. Only `queries/` and `metrics/` are new directory-level ignores.
- **`evaluation/results/comparison.md` NOT gitignored** — Phase 133 BLOG-04 imports the file verbatim, so it must stay tracked. Open Q5 in 131-RESEARCH.md resolved in favor of "track comparison.md, ignore queries/+metrics/".

## Empirical Findings (for downstream plans)

### Resolved versions in `uv.lock` (verbatim)

| Package | Version |
|---|---|
| `ragas` | 0.4.3 |
| `langchain` | 1.2.15 |
| `langchain-core` | 1.3.2 |
| `langchain-openai` | 0.3.34 |
| `langchain-community` | 0.4.1 |
| `litellm` | 1.83.0 |
| `datasets` | 4.8.4 |

### Lockfile guard verbatim output (post-lock)

```
============================= test session starts ==============================
platform darwin -- Python 3.13.1, pytest-8.4.2, pluggy-1.6.0
rootdir: /Users/patrykattc/work/git/rag-architecture-patterns
configfile: pyproject.toml
plugins: anyio-4.13.0
collecting ... collected 1 item

tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk PASSED

============================== 1 passed in 0.01s ===============================
```

Pitfall 4 mitigated empirically: `ragas==0.4.3` + `langchain-community==0.4.1` do NOT pull `google-generativeai` (deprecated EOL 2025-08-31).

### Empirical RAGAS import surface (Plan 05 should consume)

All four candidate import paths from 131-RESEARCH succeed in `ragas==0.4.3`:

```python
from ragas import evaluate, EvaluationDataset, SingleTurnSample           # OK
from ragas.metrics import faithfulness, answer_relevancy, context_precision  # OK (deprecation warning — see below)
from ragas.metrics.collections import faithfulness as f2                  # OK (new path; Plan 05 should prefer this)
from ragas.llms import llm_factory                                         # OK
from ragas.embeddings.base import embedding_factory                        # OK
from ragas.embeddings import embedding_factory                             # OK (alias works too)
from ragas.cost import get_token_usage_for_openai                          # OK — Open Q1 RESOLVED YES
```

**RAGAS 0.4.3 deprecation warning** (informational; importing from `ragas.metrics` still works in 0.4.3):

> `DeprecationWarning: Importing faithfulness from 'ragas.metrics' is deprecated and will be removed in v1.0. Please use 'ragas.metrics.collections' instead.`

**Recommendation for Plan 05**: import from `ragas.metrics.collections` directly to avoid the warning and stay forward-compatible with the eventual 1.0 release. This is a forward-compatibility choice, not a 0.4.3 functional requirement.

### Pricing surface (Pattern 7 — no edits needed)

```
shared/pricing.py:36:    "openai/text-embedding-3-small": {"input": 0.02, "output": 0.0},
shared/pricing.py:40:    "google/gemini-2.5-flash": {"input": 0.30, "output": 2.50, "cache": 0.03},
```

Both slugs already present from Phase 127 + Phase 128. RAGAS judge cost capture in Plan 05 will work via `shared.cost_tracker` end-to-end without touching `shared/pricing.py`.

### LOC counts

- `evaluation/harness/records.py` — **84** lines (≥70 required)
- `evaluation/tests/conftest.py` — **36** lines (≥25 required)
- `evaluation/tests/test_eval_records.py` — **94** lines (≥50 required)

### Test results

| Suite | Result |
|---|---|
| `evaluation/tests/test_eval_records.py` (Task 2) | 6 passed in 0.02s |
| Full non-live suite (`pytest -q -m "not live"`) | 97 passed / 4 skipped / 9 deselected (was 91/4/9 → +6 new tests) |
| Lockfile guard | 1 passed in 0.01s |

## Deviations from Plan

None — plan executed exactly as written.

The plan's auto-fix branches (resolution conflicts, alternate ragas import paths) did not trigger empirically:

- `uv lock` resolved cleanly with no transitive conflicts; no relaxation of existing tier pins was needed.
- The hypothesized RAGAS import path `from ragas.embeddings.base import embedding_factory` works as-is (the planner had hedged on whether it might be flat under `ragas.embeddings`, but both work).
- `from ragas.cost import get_token_usage_for_openai` imports cleanly — Open Q1 from 131-RESEARCH resolved YES.
- The `[evaluation]` extra was new (no partial prior attempt to abort on).

The only side-observation worth flagging for Plan 05 is the `ragas.metrics` → `ragas.metrics.collections` deprecation warning. Both paths work in 0.4.3; the new path is forward-compatible. Documented in **Empirical Findings** above; not a deviation from this plan since this plan didn't author downstream consumers.

## Issues Encountered

- **uv cache permission denied** — `uv lock` initially failed with `failed to open file '/Users/patrykattc/.cache/uv/sdists-v8/.git'`. Workaround: redirected to a session-local cache via `UV_CACHE_DIR=/tmp/claude/uv-cache`. This is a sandbox-level permission shape (not a project bug), recurs across sessions, and was used for all subsequent `uv` invocations in this plan. No code change needed; the env-var fallback is documented for future executors.
- **Pre-existing untracked diff** in `dataset/manifests/metadata.json` (timestamp drift from a prior session: `2026-04-25T19:28:25Z` → `2026-04-26T11:25:57Z`, content-identical otherwise). Out of scope for Plan 131-01 — left unstaged. Will be cleaned up in a future docs/dataset commit if it persists.
- **`litellm.__version__` AttributeError** during version-print smoke check. The litellm package's `__getattr__` raises rather than exposing `__version__`. Not a functional issue — `importlib.metadata.version("litellm")` returns `1.83.0` correctly. Documented in case Plan 05 attempts the same idiom.

## User Setup Required

None — no external service configuration required for this plan. All work is non-live (no API keys consumed).

The `.env` already has `OPENROUTER_API_KEY` from Phase 128-06 / 130-04. The `live_eval_keys_ok` fixture in `evaluation/tests/conftest.py` will route Plans 05/07 cleanly via the existing key — no new environment variables introduced by this plan.

## Next Phase Readiness

**Plans 02-07 unblocked.** Wave 1 (this plan) is the foundation; subsequent waves can now run in parallel where their `depends_on` graph permits:

- **Plan 131-02** (per-tier adapters for Tiers 1, 2, 3, 5) — can start immediately; imports `EvalRecord` from `evaluation.harness.records`.
- **Plan 131-03** (Tier 4 dual-mode adapter — live + cached) — can start immediately; imports `EvalRecord` and the cached-mode helper will use `read_query_log` from this plan.
- **Plan 131-04** (run.py orchestrator) — depends on 02 + 03 (adapter contract live).
- **Plan 131-05** (RAGAS scoring pipeline) — depends on 04; will use the RAGAS imports validated empirically here. **Recommendation**: import from `ragas.metrics.collections` (not `ragas.metrics`) to avoid the deprecation warning.
- **Plan 131-06** (comparison.md generator) — depends on 05; will write to `evaluation/results/comparison.md` (the gitignore exception preserved here).
- **Plan 131-07** (smoke live test) — depends on 06; will use `live_eval_keys_ok` + `tier1_index_present` fixtures from this plan's `conftest.py`.

**Open questions handed forward:**

- **Open Q4 (131-RESEARCH)** — UV cache write permission. Sandbox-level workaround (`UV_CACHE_DIR=/tmp/claude/uv-cache`) is repeatable; future plans should expect to set this env var when they regenerate the lockfile or install extras.

**No blockers.** The lockfile guard regression has been re-mitigated; the RAGAS import surface is empirically confirmed; the EvalRecord schema is stable.

---
*Phase: 131-evaluation-harness*
*Completed: 2026-04-27*

## Self-Check: PASSED

Verification commands run after SUMMARY draft:

```
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/harness/records.py
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/harness/__init__.py
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/harness/adapters/__init__.py
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/tests/conftest.py
$ test -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/tests/test_eval_records.py
$ test ! -f /Users/patrykattc/work/git/rag-architecture-patterns/evaluation/tests/__init__.py
$ git -C /Users/patrykattc/work/git/rag-architecture-patterns log --oneline | grep -E '(b6210cf|d839d81)'
b6210cf feat(131-01): add [evaluation] pyproject extra (ragas 0.4.3, langchain-*, litellm, datasets)
d839d81 feat(131-01): EvalRecord schema + conftest fixtures + non-live records test
```

All claims verified: 5 files exist, 1 sentinel-non-existent file confirmed, 2 commits visible in companion repo `origin/main`.
