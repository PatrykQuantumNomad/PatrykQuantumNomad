---
phase: 129-tiers-2-3-managed-graph-rag
plan: 01
subsystem: infra
tags: [pyproject, lightrag-hku, openrouter, gemini-file-search, pymupdf, uv, dependency-management, tier-extras]

# Dependency graph
requires:
  - phase: 127-rag-architecture-patterns-foundation
    provides: "[shared] extras (google-genai>=1.73, pydantic, rich, tiktoken, python-dotenv); tier-N/requirements.txt mirror pattern; T-127-08 lockfile guard against deprecated google-generativeai"
  - phase: 128-tier-1-naive-rag
    provides: "OPENROUTER_API_KEY contract in shared.config (optional SecretStr); .env.example OpenRouter comment block; openai>=1.50,<3 / pymupdf>=1.27,<2 pin ranges from [tier-1]"
provides:
  - "[tier-3] extras concretized (lightrag-hku==1.4.15, openai>=1.50,<3, pymupdf>=1.27,<2)"
  - "[tier-2] extras intentionally left as `[shared]` stub (google-genai>=1.73 already exposes client.file_search_stores.*)"
  - ".env.example OPENROUTER_API_KEY comment promoted to Tier 1 + Tier 3"
  - ".gitignore covers tier-2-managed/.store_id sidecar (Pattern 1 store-id caching)"
  - "uv.lock synced — lightrag-hku 1.4.15 transitive deps locked, no google-generativeai"
affects: [129-02-tier-2-store, 129-03-tier-3-rag, 130-tier-4-multimodal, 130-tier-5-agentic]

# Tech tracking
tech-stack:
  added:
    - "lightrag-hku==1.4.15 (Tier 3 graph extraction + retrieval)"
    - "23 lightrag transitive deps (networkx, nano-vectordb, ascii-colors, pipmaster, json-repair, pypinyin, configparser, xlsxwriter, aiohttp, pandas, google-api-core, proto-plus, etc.)"
  patterns:
    - "Tier 2 inherits google-genai from [shared] (no new top-level deps) — File Search is Gemini-native"
    - "Tier 3 owns its own pymupdf (Pitfall 11 — avoid cross-tier coupling on tier_1_naive.ingest.extract_pages)"
    - "Tier 3 routes LightRAG LLM/embeddings through OpenRouter (Phase 128 narrative continuity)"
    - "Lockfile sync as separate `chore(NN-NN)` commit (Phase 128-01 precedent — commits stay narrow)"

key-files:
  created: []
  modified:
    - "../rag-architecture-patterns/pyproject.toml ([tier-3] concretized)"
    - "../rag-architecture-patterns/.env.example (OPENROUTER comment block)"
    - "../rag-architecture-patterns/.gitignore (tier-2-managed/.store_id)"
    - "../rag-architecture-patterns/uv.lock (lightrag transitive deps locked)"

key-decisions:
  - "[tier-2] = [shared] stub LEFT UNCHANGED: google-genai>=1.73 from [shared] already exposes client.file_search_stores.* (added in SDK v1.49, verified)"
  - "lightrag-hku==1.4.15 EXACT pin (Pitfall 9 — LightRAG ships dot releases every 2-7 days; floating constraint risks silent breakage)"
  - "Tier 3 owns its own pymupdf>=1.27,<2 (Pitfall 11 — same range as [tier-1] and [curation], deliberate duplication beats cross-tier import coupling)"
  - "openai>=1.50,<3 mirrored from [tier-1] (LightRAG uses lightrag.llm.openai_complete_if_cache for OpenRouter routing)"
  - "uv.lock regen committed separately as chore(129-01) (Phase 128-01 precedent; preserves atomic deps commit; amending forbidden by GSD git protocol)"
  - "tier-N/requirements.txt files NOT modified — already mirror via `-e ..[tier-N]` (single source of truth in pyproject)"
  - "shared/embeddings.py and shared/llm.py NOT touched (Phase 127 contract; verified last commit is d766773 feat(127-02))"
  - "tests/test_env_example.py NOT updated — assertions check key NAMES, not comment text (`REQUIRED for Tier 1+` only appears in test docstring, not as an assertion)"
  - "OpenRouter for Tier 3, direct Gemini for Tier 2 — Gemini File Search is Gemini-native (cannot route via OpenRouter); Tier 3 LightRAG is OpenAI-SDK-compatible (can route)"

patterns-established:
  - "Pattern: pyproject [tier-N] extras concretization adds tier-specific deps + inherits [shared] via self-reference (rag-architecture-patterns[shared])"
  - "Pattern: lockfile sync follow-on commit — `chore(NN-NN): sync uv.lock with [tier-N] extras` separate from `deps(NN-NN):` to keep atomic units narrow"

# Metrics
duration: 2m 55s
completed: 2026-04-26
---

# Phase 129 Plan 01: Tier 2/3 Dep Contract Summary

**Tier-3 extras concretized (lightrag-hku==1.4.15 EXACT pin + openai>=1.50,<3 + pymupdf>=1.27,<2); Tier-2 left as `[shared]` stub because google-genai>=1.73 already exposes `client.file_search_stores.*`; OPENROUTER_API_KEY promoted to Tier 1 + Tier 3 in `.env.example`; `tier-2-managed/.store_id` sidecar gitignored.**

## Performance

- **Duration:** 2m 55s
- **Started:** 2026-04-26T17:11:34Z
- **Completed:** 2026-04-26T17:14:29Z
- **Tasks:** 2
- **Files modified:** 4 (companion repo: pyproject.toml, .env.example, .gitignore, uv.lock)
- **Commits:** 3 (deps + chore + docs)

## Accomplishments

- `[tier-3]` extras list now lists `lightrag-hku==1.4.15`, `openai>=1.50,<3`, `pymupdf>=1.27,<2` — Plans 02-05 can install Tier 3 deps in parallel from Wave 2 onward.
- `[tier-2]` extras intentionally left as `["rag-architecture-patterns[shared]"]` — Tier 2 inherits `google-genai>=1.73` from `[shared]`, which already exposes `client.file_search_stores.*` (added in google-genai SDK v1.49). No new top-level deps needed for managed Gemini File Search.
- `.env.example` OPENROUTER_API_KEY comment block now explicitly names Tier 1 (chat + embeddings) AND Tier 3 (LightRAG entity-extraction + answer LLM + embeddings).
- `.gitignore` now ignores `tier-2-managed/.store_id` so the cached File Search store handle never leaks (Pattern 1 store-id caching from 129-RESEARCH.md).
- `uv.lock` synced — 24 new packages locked (lightrag-hku 1.4.15 + transitives); T-127-08 lockfile guard test confirms no `google-generativeai` (deprecated) returned.
- Phase 127 contracts intact: `shared/embeddings.py` and `shared/llm.py` untouched (last commit `d766773 feat(127-02)`).

## Final Extras Lists (verbatim)

```toml
[project.optional-dependencies]
shared = [
  "google-genai>=1.73,<2",
  "pydantic>=2.10,<3",
  "pydantic-settings>=2.10,<3",
  "rich>=14,<16",
  "tiktoken>=0.10,<1",
  "python-dotenv>=1.0,<2",
]

# ...

tier-2 = ["rag-architecture-patterns[shared]"]
tier-3 = [
  "rag-architecture-patterns[shared]",
  "lightrag-hku==1.4.15",
  "openai>=1.50,<3",
  "pymupdf>=1.27,<2",
]
tier-4 = ["rag-architecture-patterns[shared]"]
tier-5 = ["rag-architecture-patterns[shared]"]
```

## Dry-Run Resolution

### `uv pip install --dry-run -e ".[tier-2]"` (last lines)

```
Resolved 34 packages in 9ms
Would download 1 package
Would uninstall 1 package
Would install 1 package
 - rag-architecture-patterns==0.1.0 (from file:///Users/patrykattc/work/git/rag-architecture-patterns)
 + rag-architecture-patterns @ file:///Users/patrykattc/work/git/rag-architecture-patterns
```

Tier-2 resolves to 34 packages — same set as `[shared]` plus the editable self-install. Zero new top-level packages, confirming the inherited `google-genai>=1.73` covers `file_search_stores`.

### `uv pip install --dry-run -e ".[tier-3]"` (last 28 lines)

```
Resolved 68 packages in 3.42s
Would download 24 packages
Would uninstall 1 package
Would install 24 packages
 + aiohappyeyeballs==2.6.1
 + aiohttp==3.13.5
 + aiosignal==1.4.0
 + ascii-colors==0.11.21
 + configparser==7.2.0
 + frozenlist==1.8.0
 + google-api-core==2.30.3
 + json-repair==0.59.5
 + lightrag-hku==1.4.15
 + multidict==6.7.1
 + nano-vectordb==0.0.4.3
 + networkx==3.6.1
 + pandas==2.3.3
 + pipmaster==1.1.8
 + propcache==0.4.1
 + proto-plus==1.27.2
 + pypinyin==0.55.0
 + pytz==2026.1.post1
 - rag-architecture-patterns==0.1.0 (from file:///Users/patrykattc/work/git/rag-architecture-patterns)
 + rag-architecture-patterns @ file:///Users/patrykattc/work/git/rag-architecture-patterns
 + setuptools==82.0.1
 + tzdata==2026.2
 + wcwidth==0.6.0
 + xlsxwriter==3.2.9
 + yarl==1.23.0
```

Tier-3 resolves to 68 packages total (34 from `[shared]` + 23 lightrag transitive + lightrag itself). `lightrag-hku==1.4.15` resolves to the EXACT pinned version. `openai>=1.50,<3` and `pymupdf>=1.27,<2` already lock-resolved from `[shared]`-adjacent context (so they don't appear in "Would install" — they're already there). `google-generativeai` (deprecated SDK) is **not** present.

## Lockfile Guard Verification

```
$ uv run pytest tests/test_tier_requirements.py -q
.....                                                                    [100%]
5 passed in 0.01s
```

`uv.lock` content scanned: `grep -c 'google-generativeai' uv.lock = 0` (deprecated SDK absent — T-127-08 mitigation holds).

## Untouched-Files Verification

```
$ git log --oneline -1 -- shared/embeddings.py
d766773 feat(127-02): shared.llm + shared.embeddings (Gemini) + shared.loader + shared.display

$ git log --oneline -1 -- shared/llm.py
d766773 feat(127-02): shared.llm + shared.embeddings (Gemini) + shared.loader + shared.display
```

Both files last modified in Phase 127 Plan 02 — Phase 129 Plan 01 has not touched them. Phase 127 Gemini-only contract preserved; Phase 128 smoke test still imports cleanly.

## Task Commits

Each task was committed atomically (all in companion repo `rag-architecture-patterns`, pushed to `origin/main`):

1. **Task 1: Extend [tier-3] extras** — `fe2a118` (`deps(129-01): extend [tier-3] extras (lightrag-hku==1.4.15, openai, pymupdf)`)
2. **Task 1 follow-on: Lockfile sync** — `515d817` (`chore(129-01): sync uv.lock with [tier-3] extras (lightrag-hku transitive deps)`)
3. **Task 2: OPENROUTER_API_KEY + .gitignore** — `5b87143` (`docs(129-01): promote OPENROUTER_API_KEY for Tier 3; gitignore tier-2-managed/.store_id`)

All 3 commits pushed: `fe06e84..5b87143  main -> main`.

## Files Created/Modified

- `../rag-architecture-patterns/pyproject.toml` — `[tier-3]` extras concretized; `[tier-2]` deliberately unchanged (inherits from `[shared]`).
- `../rag-architecture-patterns/.env.example` — `OPENROUTER_API_KEY` comment block now names Tier 1 AND Tier 3 explicitly; mentions LightRAG entity-extraction + `--model` flag for Tier 3.
- `../rag-architecture-patterns/.gitignore` — Added `tier-2-managed/.store_id` (NEW entry) right after existing `lightrag_*/` glob.
- `../rag-architecture-patterns/uv.lock` — 935 insertions, 4 deletions; locks 24 new packages introduced by `lightrag-hku==1.4.15` transitive closure.

NOT modified (deliberately):
- `tier-2-managed/requirements.txt` — already references `-e ..[tier-2]`; `-e ..[tier-N]` line picks up new deps automatically (single source of truth in pyproject).
- `tier-3-graph/requirements.txt` — same pattern; unchanged.
- `shared/embeddings.py` — Phase 127 Gemini-only contract preserved.
- `shared/llm.py` — Phase 127 Gemini-only contract preserved.
- `shared/config.py` — `openrouter_api_key: SecretStr | None` already declared correctly from Phase 128.
- `tests/test_env_example.py` — assertions check key NAMES, not comment text (the docstring `REQUIRED for Tier 1+` is descriptive only, not an assertion).

## Decisions Made

All decisions from the plan body were locked in unchanged. No course corrections needed — research (`129-RESEARCH.md`) verified all pins on 2026-04-26 and the dry-run confirmed clean resolution. Notable rationale:

- **`[tier-2]` left as stub:** `google-genai>=1.73,<2` from `[shared]` exposes `client.file_search_stores.*` (added in SDK v1.49). Documenting this in the commit message (`fe2a118`) so future readers don't think Tier 2 deps were forgotten.
- **`lightrag-hku==1.4.15` EXACT pin:** LightRAG ships dot releases every 2-7 days. Released 2026-04-19 (verified 2026-04-26 via PyPI). Floating constraint = silent-breakage risk (Pitfall 9, 129-RESEARCH.md).
- **Tier 3 owns its own `pymupdf`:** Pitfall 11 — Tier 3 must not import from `tier_1_naive.ingest.extract_pages`. Same range as `[tier-1]` and `[curation]` (`>=1.27,<2`), but deliberate duplication is the right call.
- **OpenRouter for Tier 3, Gemini direct for Tier 2:** Gemini File Search is Gemini-native (cannot route via OpenRouter — it's a Gemini-specific managed-RAG primitive). LightRAG is OpenAI-SDK-compatible, so Tier 3 reuses Phase 128's OpenRouter routing for narrative continuity (single OPENROUTER_API_KEY for both tiers).
- **Lockfile sync as separate `chore(129-01)`:** Phase 128-01 precedent (STATE.md decisions log). `uv run pytest` regenerated `uv.lock`; bundling it into the deps commit would inflate the atomic unit; amending is forbidden by GSD git protocol; separate commit keeps both narrow.

## Deviations from Plan

None - plan executed exactly as written.

The plan instructions said "Update `tests/test_env_example.py` ONLY if it asserts on the literal `REQUIRED for Tier 1+` string." Grep confirmed the string only appears in a test docstring (line 42) and a parenthetical in an assertion message (line 46) — neither is an assertion against `.env.example` content, so the test was correctly left untouched.

The companion repo also had a pre-existing unrelated modification to `dataset/manifests/metadata.json` from a prior session. Per scope boundary rule (only auto-fix issues caused by current task), this was left untouched and not staged in any of this plan's commits.

## Issues Encountered

- **uv cache permission denied:** `uv pip install --dry-run` initially failed with `failed to open file '/Users/patrykattc/.cache/uv/sdists-v8/.git': Operation not permitted (os error 1)` because the sandbox blocks the global uv cache. Worked around by setting `UV_CACHE_DIR="$TMPDIR/uv-cache-129-01"` for all uv invocations in this plan. Not a code issue — pure sandbox interaction.
- **Plan asks for `--python python3.11`, local venv is 3.13:** Plan specifies `--python python3.11` in dry-run examples, but the companion repo's `.venv/pyvenv.cfg` is Python 3.13.1 (uv 0.6.3). Used the existing venv directly (no `--python` flag), which is the actual install context for Phase 128 and `uv run pytest`. Resolution still cleanly validates the dep contract for the project's runtime.

## User Setup Required

No new external service configuration required for this plan (config-only).

OPENROUTER_API_KEY (already required by Phase 128) and GEMINI_API_KEY (already required by Phase 127) remain the only external service keys; both already documented in `.env.example`. Tier 3 will USE OPENROUTER_API_KEY but no new key is needed.

## Next Phase Readiness

- **Plan 129-02 (Tier 2 Managed File Search store) ready:** Can install `[tier-2]` extras (no new deps; google-genai already in [shared]) and proceed with `client.file_search_stores.create/import_file/list_files`.
- **Plan 129-03 (Tier 3 LightRAG rag) ready:** Can install `[tier-3]` extras (lightrag-hku==1.4.15 + openai + pymupdf) and proceed with LightRAG OpenRouter wiring.
- **Wave 2 parallelization unblocked:** Plans 02 and 03 no longer have a file-ownership conflict on `pyproject.toml` (Plan 01 locked the dep contract for both tiers).

## Self-Check: PASSED

- pyproject.toml `[tier-3]` contains `lightrag-hku==1.4.15`, `openai>=1.50`, `pymupdf>=1.27`: VERIFIED.
- pyproject.toml `[tier-2]` unchanged (`["rag-architecture-patterns[shared]"]`): VERIFIED.
- `.env.example` mentions `Tier 3` and `LightRAG`: VERIFIED.
- `.gitignore` contains `tier-2-managed/.store_id`: VERIFIED.
- shared/embeddings.py last commit is `d766773 feat(127-02)`: VERIFIED (NOT touched by Phase 129).
- shared/llm.py last commit is `d766773 feat(127-02)`: VERIFIED (NOT touched by Phase 129).
- uv pip install --dry-run -e ".[tier-2]" resolves cleanly (34 packages): VERIFIED.
- uv pip install --dry-run -e ".[tier-3]" resolves cleanly (68 packages, 24 new): VERIFIED.
- tests/test_tier_requirements.py 5/5 PASS: VERIFIED.
- tests/test_env_example.py 5/5 PASS: VERIFIED.
- tests/test_pricing.py 4/4 PASS: VERIFIED (consolidated 14/14 in plan verification block).
- Commits `fe2a118`, `515d817`, `5b87143` exist in companion repo `git log`: VERIFIED.
- All 3 commits pushed to origin/main (`fe06e84..5b87143`): VERIFIED.

---
*Phase: 129-tiers-2-3-managed-graph-rag*
*Completed: 2026-04-26*
