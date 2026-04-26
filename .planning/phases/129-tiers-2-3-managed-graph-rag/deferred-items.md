# Phase 129 Deferred Items

Out-of-scope discoveries logged here per the executor Scope Boundary rule.
These are NOT auto-fixed by Plans 02/03 — they require their own remediation.

## Pre-existing tier-1 test_store.py failures (discovered 2026-04-26 by Plan 03)

**Symptom:**
```
FAILED tier-1-naive/tests/test_store.py::test_constants_match_research_decision
FAILED tier-1-naive/tests/test_store.py::test_open_collection_creates_and_persists
FAILED tier-1-naive/tests/test_store.py::test_open_collection_reset_wipes
FAILED tier-1-naive/tests/test_store.py::test_retrieve_top_k_returns_normalized_shape
FAILED tier-1-naive/tests/test_store.py::test_open_collection_idempotent_reopen
AttributeError: module '_tier1_store' has no attribute 'open_collection'
```

**Verification this is pre-existing**: Plan 03 stashed its changes, ran the
suite on clean HEAD `b26e171` (Plan 03 probe commit) — same 5 failures
appeared. Companion repo origin/main HEAD as of probe push is `b26e171`,
which only adds the probe script — so the failures predate Plan 03 and
likely date back to Phase 128 Plan 06 (OpenRouter migration) when
`tier-1-naive/store.py` and `embed_openai.py` were refactored.

**Hypothesis (NOT verified — out of scope):** `test_store.py` uses
`importlib.util.spec_from_file_location` to load `store.py` and
`retrieve.py` directly (the Plan 128-02 follow-on `_tier1_store` /
`_tier1_retrieve` pattern). After Phase 128 Plan 06 refactored Tier 1,
either `open_collection` was renamed/moved or the test's import shape no
longer aligns with the module's public surface.

**Suggested next step:** Open a quick-task to either:
- Update `test_store.py` to match the post-Plan-128-06 store.py API, OR
- Restore the `open_collection` symbol on `store.py` if it was accidentally
  removed during the OpenRouter migration.

**Plan 128-06 SUMMARY does not flag this** (Phase 128 verifier passed 4/4
must-haves), so the regression slipped past `pytest -m "not live"` somehow
— possibly because the Phase 128 verifier ran live tests only, or the
test was added/altered between Plan 128-06 and Plan 129-01.

## Stale dataset/manifests/metadata.json timestamp drift

**Symptom:** `git status` in `rag-architecture-patterns/` consistently shows
`dataset/manifests/metadata.json` modified — the only change is the
`generated_at` timestamp regenerating on each `scripts/build_metadata.py`
run. Plan 03 left this uncommitted (out of scope).

**Suggested fix:** Either make `build_metadata.py` skip rewrite when only
the timestamp would change, or commit a stable timestamp once and stop
regenerating it on every dev session.
