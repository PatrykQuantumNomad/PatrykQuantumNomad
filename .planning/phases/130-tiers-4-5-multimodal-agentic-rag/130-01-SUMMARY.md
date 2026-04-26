---
phase: 130-tiers-4-5-multimodal-agentic-rag
plan: 01
subsystem: dependency-contract
tags: [deps, pyproject, gitignore, env-template, tier-4, tier-5, raganything, openai-agents, litellm]
requirements_completed: [TIER-04, TIER-05, REPO-04]
dependency_graph:
  requires:
    - phase-129-tier-3-extras (lightrag-hku==1.4.15 already pinned in [tier-3])
    - phase-128-tier-1-extras (chromadb pin reused under [tier-5])
    - phase-127-shared-baseline (rag-architecture-patterns[shared] composition)
  provides:
    - "[tier-4] extras: raganything==1.2.10 + lightrag-hku==1.4.15 + openai>=1.50,<3 + Pillow>=10,<12"
    - "[tier-5] extras: openai-agents[litellm]==0.14.6 + chromadb>=1.5.8,<2 + openai>=1.50,<3"
    - "OPENROUTER_API_KEY documented as required for Tier 4 + Tier 5"
    - "rag_anything_storage/ + tier-4-multimodal/.cache/ + tier-4-multimodal/output/ in .gitignore"
  affects:
    - "all Phase 130 downstream plans (Tier 4 ingest/query, Tier 5 agent + tools, Tier 4 Dockerfile)"
tech_stack:
  added:
    - "raganything==1.2.10 (multimodal RAG over MineRU + LightRAG)"
    - "openai-agents[litellm]==0.14.6 (Agents SDK with LiteLLM extra for OpenRouter routing)"
    - "Pillow>=10,<12 (lifted from [curation] into [tier-4] for img_path validation)"
  patterns:
    - "Exact-pin contract for rapid-churn HKUDS / OpenAI-Agents releases (Pitfall 2 / 9 mitigation)"
    - "Two-commit deps + lockfile pattern (Phase 128-01 + 129-01 precedent)"
key_files:
  modified:
    - "../rag-architecture-patterns/pyproject.toml"
    - "../rag-architecture-patterns/.gitignore"
    - "../rag-architecture-patterns/.env.example"
    - "../rag-architecture-patterns/uv.lock (separate chore commit)"
  unchanged_verified:
    - "../rag-architecture-patterns/tier-4-multimodal/requirements.txt (still `-e ..[tier-4]`)"
    - "../rag-architecture-patterns/tier-5-agentic/requirements.txt (still `-e ..[tier-5]`)"
decisions:
  - "Mirrored Phase 128-01 + 129-01 deps-then-lockfile two-commit pattern; never amend"
  - "raganything==1.2.10 EXACT pin (not >=1.2,<2) per Pitfall 2 — RAG-Anything ships dot releases that break APIs every few weeks; mirrors lightrag-hku==1.4.15 from Phase 129"
  - "openai-agents[litellm]==0.14.6 EXACT pin per Pitfall 2 same risk profile (Agents SDK is pre-1.0 and ships breaking changes in 0.x dot releases)"
  - "lightrag-hku==1.4.15 RE-DECLARED in [tier-4] (not just inherited from [tier-3]) — RAG-Anything composes a LightRAG instance internally; explicit re-pin documents the dependency at the Tier 4 contract layer for future readers"
  - ".env.example comment block reworded (single key for all OpenRouter-routable tiers — Tier 1, Tier 3, Tier 4, Tier 5; Tier 2 stays Gemini-native)"
  - "Pillow LIFTED from [curation] into [tier-4] (was only in [curation] from Phase 127); Tier 4 needs it at runtime for insert_content_list img_path validation, so it belongs in the tier extras"
  - "torch + torchvision pulled in as MineRU transitives (not directly pinned by us) — verified via uv pip install --dry-run output; raganything 1.2.10 pulls these via mineru's required deps"
metrics:
  duration: "~7 minutes"
  completed: "2026-04-26"
  tasks: 2
  files: 4
---

# Phase 130 Plan 01: Tiers 4-5 Dependency Contract Summary

Concretized empty `[tier-4]` and `[tier-5]` pyproject extras into pinned dependency sets per 130-RESEARCH.md Standard Stack: `raganything==1.2.10`, `lightrag-hku==1.4.15`, `openai-agents[litellm]==0.14.6`, `chromadb>=1.5.8,<2`, with `.gitignore` and `.env.example` updated for Tier 4/Tier 5 runtime artifacts and OpenRouter key documentation.

## What Shipped

### Pyproject extras (the dependency contract)

Both extras concretized verbatim per `<interfaces>` block in 130-01-PLAN.md:

```toml
tier-4 = [
  "rag-architecture-patterns[shared]",
  "raganything==1.2.10",      # exact pin — Pitfall 2
  "lightrag-hku==1.4.15",     # composed by RAG-Anything; explicit re-pin
  "openai>=1.50,<3",          # OpenRouter routing through lightrag.llm.openai
  "Pillow>=10,<12",           # img_path validation in insert_content_list
]
tier-5 = [
  "rag-architecture-patterns[shared]",
  "openai-agents[litellm]==0.14.6",  # exact pin — Pitfall 2
  "chromadb>=1.5.8,<2",              # read Tier 1's collection
  "openai>=1.50,<3",                 # transitive via litellm + Tier 1 reuse
]
```

### `.gitignore` additions

Appended at the end of the file with a blank-line separator:

```
# Phase 130 — Tier 4 RAG-Anything working dir + MineRU intermediate dirs
rag_anything_storage/
tier-4-multimodal/.cache/
tier-4-multimodal/output/
```

Confirmed `chroma_db/` and `lightrag_*/` already covered from prior phases (Phase 128/129); not re-added here (out-of-scope).

### `.env.example` update

`OPENROUTER_API_KEY` REQUIRED-for comment promoted from "Tier 1, Tier 3" to "Tier 1, Tier 3, Tier 4 (RAG-Anything LLM/vision/embed), Tier 5 (Agents SDK via LiteLLM)". Single key continues to cover all OpenRouter-routable tiers (Tier 2 stays Gemini-native — `generativelanguage.googleapis.com` is not OpenRouter-proxyable).

### Per-tier `requirements.txt` mirrors

Both files remain `-e ..[tier-N]` editable-install pointers (single-source-of-truth contract preserved):
- `tier-4-multimodal/requirements.txt` → `-e ..[tier-4]` (verbatim from Phase 127)
- `tier-5-agentic/requirements.txt` → `-e ..[tier-5]` (verbatim from Phase 127)

## Resolution Sizes

| Extra | Resolved | Would Install (fresh venv) | New direct pins | Notable transitives |
|-------|----------|----------------------------|-----------------|---------------------|
| `[tier-4]` | 156 packages | 90 packages | raganything==1.2.10, Pillow | mineru, torch==2.10.0, torchvision==0.25.0, transformers==4.57.6, tokenizers, sympy, lightrag-hku (re-resolved) |
| `[tier-5]` | 108 packages | 58 packages | openai-agents==0.14.6, openai-agents[litellm], chromadb (re-pinned) | litellm, types-requests, websocket-client, watchfiles, uvicorn, starlette |

Resolution times: tier-4 36 ms, tier-5 3.53 s (cached after first resolution).

## Lockfile Status

`uv.lock` was regenerated by `uv sync --extra tier-4 --extra tier-5` (+2396 / -16 lines). Committed separately as `chore(130-01)` per Phase 128-01 + 129-01 precedent (`a081238`) — keeps the deps-vs-lockfile diff narrow per GSD git protocol.

**Lockfile guard verification:** `tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk` PASSED. Neither `raganything 1.2.10` nor `openai-agents 0.14.6` pulls the deprecated `google-generativeai` SDK:
- `raganything 1.2.10` → no Google deps directly; transitive Google access flows through `lightrag-hku 1.4.15` which uses `google-genai` (the unified SDK from Phase 127's pin), NOT the deprecated sibling.
- `openai-agents 0.14.6` → no Google deps in transitive graph at all; LiteLLM proxies all model calls.

Full test result: `5 passed in 0.01s` (4 pre-existing tests + the lockfile guard, all green).

## Smoke Import Output

All 4 imports pass in the synced venv (`UV_CACHE_DIR=$TMPDIR/uv-cache uv run python -c ...`):

```
$ python -c "import raganything; print('raganything', raganything.__version__)"
raganything 1.2.10

$ python -c "import agents; print('agents', getattr(agents, '__version__', 'n/a'))"
agents 0.14.6

$ python -c "from agents.extensions.models.litellm_model import LitellmModel; print('LitellmModel OK')"
LitellmModel OK

$ python -c "import chromadb; print('chromadb', chromadb.__version__)"
chromadb 1.5.8

$ python -c "import raganything, agents, chromadb; print('ALL OK')"
ALL OK
```

Two notes:
1. **Pin truth-check:** `agents.__version__` IS exposed as `0.14.6` (plan body cautioned it might be `n/a`); both libraries surface their version strings cleanly. Exact pin holds.
2. **LiteLLM SOCKS warning:** `LitellmModel` import emits a benign warning about the SOCKS proxy + httpx[socks] when fetching the remote model-cost-map JSON; this is a sandbox-only network-egress artifact (Phase 128-06 / 129-07 precedent — `socksio` IS in the venv via `httpx[socks]` transitive in `[shared]`, but LiteLLM's diagnostic check looks for it differently). Import itself succeeds; cost-map fallback to local backup is the documented LiteLLM behavior. Not a deps issue, not a project bug.

## Commits

Both commits pushed to `origin/main` (companion repo `rag-architecture-patterns`, branch `main`):

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| `08a0917` | `deps(130-01)` | Concretize [tier-4] + [tier-5] extras + .gitignore + .env.example | `pyproject.toml` (+13/-2), `.gitignore` (+5/-0), `.env.example` (+5/-3) |
| `a081238` | `chore(130-01)` | Regenerate uv.lock after [tier-4]+[tier-5] concretization | `uv.lock` (+2396/-16) |

Push: `cc2620f..a081238  main -> main` (fast-forward, no rebase needed).

## Deviations from Plan

None — plan executed exactly as written. All 5 must-haves passed:

- [x] `uv pip install --dry-run -e ".[tier-4]"` resolved cleanly (156 / 90 packages, no conflicts)
- [x] `uv pip install --dry-run -e ".[tier-5]"` resolved cleanly (108 / 58 packages, no conflicts)
- [x] `tests/test_tier_requirements.py` 5/5 PASS (lockfile guard intact)
- [x] `.env.example` documents OPENROUTER_API_KEY as REQUIRED for Tier 1 + Tier 3 + Tier 4 + Tier 5
- [x] `.gitignore` covers `rag_anything_storage/` + `tier-4-multimodal/.cache/` + `tier-4-multimodal/output/`
- [x] Per-tier requirements.txt mirrors unchanged (single source of truth in pyproject preserved)
- [x] `shared/embeddings.py`, `shared/llm.py`, `shared/pricing.py` NOT modified (Phase 127/128/129 contracts preserved — verified via `git diff --name-only HEAD~2 HEAD` showing only the 4 files in scope)

### Sandbox-only adjustments (NOT project-dep changes)

- `UV_CACHE_DIR=$TMPDIR/uv-cache` was needed for all `uv` invocations in the executor sandbox (default `~/.cache/uv` is not writable from the sandboxed shell — Phase 129-07 precedent). This is environmental, not a project change; users running `uv sync` in their own shells need no override.

## Auth Gates

None — this plan was fully autonomous (no live API calls; only deps install + smoke imports).

## Threat Surface Scan

No new security-relevant surface introduced by this plan. All changes are dependency declarations + local .gitignore + .env.example documentation; no network endpoints, no auth paths, no schema changes, no file-access patterns at trust boundaries. Plan 130-01 has no `<threat_model>` and none was warranted.

## Next Plan

**Plan 130-02 (Wave 1, autonomous):** Tier 4 RAG-Anything `rag.py` module — three OpenRouter wrappers (`llm_model_func`, `vision_model_func`, `embedding_func`), `WORKING_DIR = "rag_anything_storage/tier-4-multimodal"`, EMBED_DIMS=1536 hardcoded (Pitfall 4), CostAdapter mirroring Tier 3's pattern. Plan 02 depends ONLY on this plan's `[tier-4]` extras landing on origin/main (which they have).

## Self-Check: PASSED

**Files modified verified present on disk:**
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/pyproject.toml` — contains `raganything==1.2.10` + `openai-agents[litellm]==0.14.6` (grep confirmed)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/.gitignore` — contains `rag_anything_storage` (grep confirmed)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/.env.example` — contains "Tier 4" and "Tier 5" (grep confirmed)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/uv.lock` — regenerated, no `google-generativeai` (test confirmed)

**Commits verified in git log:**
- [x] `08a0917` (deps(130-01)) — `git log --oneline | grep 08a0917` returns the deps commit
- [x] `a081238` (chore(130-01)) — `git log --oneline | grep a081238` returns the lockfile commit
- [x] Both pushed to `origin/main` (push output: `cc2620f..a081238  main -> main`)

**Tests verified passing:**
- [x] `tests/test_tier_requirements.py` 5/5 PASS (including `test_lockfile_does_not_contain_deprecated_sdk`)
- [x] All 4 smoke imports PASS (raganything 1.2.10, agents 0.14.6, LitellmModel OK, chromadb 1.5.8)
