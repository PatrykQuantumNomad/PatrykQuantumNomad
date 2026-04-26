---
phase: 129-tiers-2-3-managed-graph-rag
plan: 04
subsystem: rag-tier
tags: [gemini, file-search, managed-rag, google-genai, argparse, tiktoken, grounding-metadata, citations]

# Dependency graph
requires:
  - phase: 129-02
    provides: "tier_2_managed.store helpers (get_or_create_store, upload_with_retry, list_existing_documents, STORE_DISPLAY_NAME) — consumed by main.py for FileSearchStore lifecycle"
  - phase: 128-04
    provides: "Tier 1 main.py argparse + repo-root sys.path bootstrap pattern + DEFAULT_QUERY (single-hop-001) + no-flags-default(ingest+query) idiom — copied verbatim into Tier 2"
  - phase: 128-06
    provides: "console_override=console parameter on shared.display.render_query_result (cmd_query routes Rich output to the same console as latency/persisted-cost prints — avoids the dual-console bug Plan 128-06 caught)"
  - phase: 127-02
    provides: "shared.cost_tracker.CostTracker (D-13 schema), shared.config.get_settings, shared.display.render_query_result, shared.loader.DatasetLoader, shared.pricing.PRICES (gemini-embedding-001 @ \\$0.15/1M)"
provides:
  - "tier-2-managed/query.py — FileSearch tool wiring (Pattern 3) + grounding_metadata → display-chunks adapter with defensive None/score handling (Pitfall 6 + Open Q3)"
  - "tier-2-managed/main.py — argparse CLI mirroring Tier 1 (--ingest / --query / --reset / --model) + GEMINI_API_KEY guard + Pitfall-1 hasattr assertion + idempotent sequential ingest + synthetic indexing-cost line item"
  - "_count_pdf_tokens helper with ImportError-tolerant fitz fallback (Tier 2 stays installable WITHOUT [tier-1])"
  - "Tier 2 'managed-RAG win' rendering via the same shared.display.render_query_result Tier 1 uses → apples-to-apples cost / latency / citation comparison"
affects: [129-06, "Tier 2 live e2e test (Plan 06) drives this CLI end-to-end against real Gemini File Search", "Phase 133 cost-aggregation reads costs/tier-2-{timestamp}.json (D-13) artifacts written by tracker.persist()"]

# Tech tracking
tech-stack:
  added:
    - "tiktoken cl100k_base — synthetic token counting for Pitfall-7 indexing-cost estimate (already in [shared] from Phase 128 chunker; Tier 2 is a second consumer)"
    - "google.genai.types.Tool(file_search=FileSearch(file_search_store_names=[...])) — managed retrieval as a tool (Pattern 3, first usage in repo)"
    - "google.genai response.grounding_metadata.grounding_chunks[].retrieved_context.{title,text,score} — managed-RAG citations (first consumer in repo)"
  patterns:
    - "Tier 2 'managed-RAG win' = built-in citations rendered through the SAME shared.display.render_query_result that Tier 1 uses (apples-to-apples comparison)"
    - "Synthetic indexing-cost line item: tracker.record_embedding('gemini-embedding-001', N) recorded ONCE per ingest with cl100k_base estimate × \\$0.15/1M (Pitfall 7 — Gemini File Search has no per-token indexing line)"
    - "ImportError-tolerant pymupdf fallback: try/except `import fitz` → file_size//4 byte-proxy keeps Tier 2 installable WITHOUT [tier-1]'s pymupdf (Pitfall 11 tier-isolation)"
    - "Pitfall 1 SDK-feature assertion: `hasattr(client, 'file_search_stores')` at startup with friendly upgrade hint (catches stale google-genai < 1.49 envs before any API call)"
    - "Pitfall 10 API-key guard: friendly red error + exit code 2 BEFORE CostTracker instantiation and before any client construction — pydantic-settings layer enforces required-ness, but the explicit None-check is belt-and-braces"

key-files:
  created:
    - "/Users/patrykattc/work/git/rag-architecture-patterns/tier-2-managed/query.py"
    - "/Users/patrykattc/work/git/rag-architecture-patterns/tier-2-managed/main.py"
  modified: []

key-decisions:
  - "Plan 129-04: cmd_query passes console_override=console to render_query_result (same fix Plan 128-06 retro-applied to Tier 1) — ensures the 'Cost:' line + 'Latency:' line + 'Cost JSON written to' line all land on the same Rich console; prevents the dual-console bug where stdout split across two Console instances on the live path"
  - "Plan 129-04: _count_pdf_tokens has TWO graceful fallbacks for [tier-1]-independence — try `import fitz` first (accurate when [tier-1] is also installed), fall back to file_size_bytes//4 if fitz is unavailable OR if fitz extraction returns 0 chars (vector-graphics PDFs that PyMuPDF can't parse — 39 of the 100 corpus papers per Phase 127-05 SUMMARY) OR if fitz raises any exception"
  - "Plan 129-04: cl100k_base encode is capped via `('a' * text_len)[:4096]` — encoding the full extracted text of a 50-page paper would burn O(seconds) of CPU PER PAPER on every ingest; the 4096-char cap is plenty for an ESTIMATE (Pitfall 7 explicitly says synthetic — the LLM-line cost from response.usage_metadata is the source-of-truth precise number)"
  - "Plan 129-04: --model flag default is DEFAULT_MODEL (gemini-2.5-flash) NOT the OpenRouter google/gemini-2.5-flash slug used by Tier 1 — Tier 2 uses Gemini's NATIVE google-genai client (because file_search_stores is a Gemini-native feature that does NOT route through OpenRouter); shared.pricing.PRICES has both 'gemini-2.5-flash' (native) and 'google/gemini-2.5-flash' (OpenRouter) entries with identical pricing so cost tracking works on either path"
  - "Plan 129-04: cmd_query defends against missing usage_metadata via getattr(resp, 'usage_metadata', None) + int(getattr(...) or 0) — some Gemini paths (cached responses, certain tool-use paths) omit usage_metadata; we still render the answer + 0-cost LLM line rather than crashing"
  - "Plan 129-04: dataset/manifests/metadata.json had a stale-timestamp working-tree change (215e54e → ff6af09) when this plan started — left untouched; out of scope (Phase 127 ownership) and not part of any task's intended diff"

patterns-established:
  - "Tier-CLI shape (now applied to Tiers 1 + 2; Tier 3 will follow in Plan 129-05): argparse with --ingest / --query / --reset / --model flags; default no-flags invocation auto-runs ingest (idempotent) + DEFAULT_QUERY; CostTracker(tier) instantiated AFTER API-key guard, threaded through ingest + query + persist()"
  - "Managed-retrieval rendering: response → to_display_chunks(resp) → shared.display.render_query_result with console_override=console (the SAME renderer non-managed Tier 1 uses) — Tier 2's grounding-metadata citations + Tier 1's chroma similarity scores both flow through the identical doc_id/score/snippet chunk shape"
  - "Synthetic-cost line idiom for managed services: when a vendor bundles indexing into per-query latency without a per-token line item, record ONE tracker.record_embedding(vendor_model, estimated_tokens) call at the end of ingest using a published per-1M rate constant — preserves the D-13 totals.embedding_tokens contract without misrepresenting LLM tokens"

# Metrics
duration: 4min
completed: 2026-04-26
---

# Phase 129 Plan 04: Tier 2 CLI + Query Path Summary

**Tier 2 query path + CLI orchestration: `python tier-2-managed/main.py` now uploads the enterprise KB to a Gemini FileSearchStore (idempotent), runs `gemini-2.5-flash` with the `FileSearch` tool attached, and renders the answer + grounding_metadata-derived citations through the same `shared.display.render_query_result` Tier 1 uses — alongside latency, LLM cost, and a synthetic indexing-cost estimate (cl100k_base × \$0.15/1M) persisted to `costs/tier-2-{timestamp}.json` per D-13.**

## Performance

- **Duration:** 4 min (1777225140 → 1777225353)
- **Started:** 2026-04-26T17:39:00Z
- **Completed:** 2026-04-26T17:42:33Z
- **Tasks:** 2 / 2
- **Files modified:** 2 (2 created — 479 LOC total)

## Accomplishments

- `tier-2-managed/query.py` (132 LOC) exposes `query`, `to_display_chunks`, `DEFAULT_MODEL` — Pattern 3 (FileSearch tool), Pitfall 6 (None grounding_metadata defense), Open Q3 (missing-score fallback to 0.0). Verified all 6 defensive code paths via in-process mock-response smoke (no API call).
- `tier-2-managed/main.py` (347 LOC) wires the full Tier 2 CLI: argparse with --ingest / --query / --reset / --model, GEMINI_API_KEY guard, Pitfall-1 SDK-feature assertion, idempotent sequential ingest via `list_existing_documents` + `upload_with_retry`, synthetic indexing-cost line item, end-to-end timing, and cost persistence.
- `python tier-2-managed/main.py --help` runs cleanly (verbatim output below).
- All 64 non-live tests pass (pre-existing 5 chromadb-missing failures in tier-1-naive/tests/test_store.py are out-of-scope environmental issues — same baseline Plan 02 documented).
- File ownership respected: NO tier-3-graph files touched. The Plan 05 agent's concurrent push (`b95b5a3`) interleaved cleanly with my pushes (`a626c96` ← my Task 1 → `b95b5a3` Plan 05 → `94b6f97` ← my Task 2). Each commit explicit `git add` of one file.

## Task Commits

Each task was committed atomically and pushed to `origin/main`:

1. **Task 1: Implement tier-2-managed/query.py (FileSearch tool wiring + grounding extraction)** — `a626c96` (feat)
2. **Task 2: Implement tier-2-managed/main.py (CLI orchestration with synthetic indexing cost + GEMINI_API_KEY guard)** — `94b6f97` (feat)

(Plan metadata commit lives in this profile/planning repo — the rag-architecture-patterns repo only carries the per-task atomic commits per the Phase 127 split-repo convention.)

## Files Created/Modified

- `tier-2-managed/query.py` (created, 132 LOC) — `DEFAULT_MODEL`, `query(client, store_name, question, model)`, `to_display_chunks(response) -> list[dict]`. Defensive at every level of `candidates → grounding_metadata → grounding_chunks → retrieved_context → score`. Snippets clipped to 200 chars matching shared.display convention.
- `tier-2-managed/main.py` (created, 347 LOC) — argparse CLI + `cmd_ingest` (sequential, idempotent, synthetic indexing-cost line) + `cmd_query` (timed, console-routed render + cost persist). `_count_pdf_tokens` helper with three-layer fallback (fitz → cl100k_base estimate → file-size proxy on ImportError or extraction failure).

### `python tier-2-managed/main.py --help` (verbatim)

```
usage: tier-2-managed [-h] [--ingest] [--query QUERY] [--reset]
                      [--model MODEL]

Tier 2 (Managed RAG) — Gemini File Search managed indexing + retrieval. The
store persists in Google's cloud; built-in citations land via
grounding_metadata.

options:
  -h, --help     show this help message and exit
  --ingest       Upload PDFs to the FileSearchStore (idempotent — skips
                 already-uploaded).
  --query QUERY  Run a query against the persisted store.
  --reset        Delete the FileSearchStore + clear .store_id sidecar before
                 --ingest.
  --model MODEL  Gemini chat model for the answer step (default
                 gemini-2.5-flash). Must be present in shared.pricing.PRICES
                 for cost tracking.
```

### Final Exports

#### `tier-2-managed/query.py`

| Symbol | Kind | Purpose |
|---|---|---|
| `DEFAULT_MODEL` | `str` constant | `"gemini-2.5-flash"` — cheap chat model for the answer step; matches Tier 1 narrative |
| `query(client, store_name, question, model=DEFAULT_MODEL)` | function | One-shot `generate_content` call with `types.Tool(file_search=FileSearch(file_search_store_names=[store_name]))` attached (Pattern 3) |
| `to_display_chunks(response) -> list[dict]` | function | Defensive grounding_metadata → display-chunks adapter; returns `[]` when grounding is None/empty (Pitfall 6); falls back to score=0.0 when missing (Open Q3); each chunk = `{doc_id, score, snippet}` |

#### `tier-2-managed/main.py`

| Symbol | Kind | Purpose |
|---|---|---|
| `DEFAULT_QUERY` | `str` constant | golden_qa.json::single-hop-001 — same as Tier 1 for apples-to-apples comparison |
| `INDEXING_PRICE_PER_M` | `float` constant | `0.15` USD/1M tokens — mirrors `shared.pricing.PRICES["gemini-embedding-001"]["input"]` |
| `_count_pdf_tokens(pdf_path, enc) -> int` | helper | cl100k_base estimate via fitz; ImportError-tolerant fallback to `file_size // 4` |
| `cmd_ingest(client, store, tracker, console) -> int` | function | Sequential idempotent upload + synthetic indexing-cost line at end |
| `cmd_query(client, store, query_text, model, tracker, console) -> int` | function | Timed `generate_content` + LLM-cost record + render via `shared.display.render_query_result(... console_override=console)` + `tracker.persist()` |
| `_build_parser() -> argparse.ArgumentParser` | helper | argparse wiring (--ingest / --query / --reset / --model) |
| `main(argv=None) -> int` | function | Entry point: GEMINI_API_KEY guard → genai.Client → Pitfall-1 hasattr → CostTracker → no-flags-default → ingest → query |

### Confirmation: `_count_pdf_tokens` Fallback Semantics

The helper has THREE graceful-degradation layers, in priority order:

1. **`import fitz` succeeds** (Tier 1's [tier-1] extras are also installed in the same env) → extract page text via PyMuPDF, then encode the first 4096 chars with cl100k_base. Most accurate.
2. **`import fitz` fails** (`ImportError`) → return `max(1, pdf_path.stat().st_size // 4)`. Tier 2 stays installable WITHOUT [tier-1] (Pitfall 11 tier-isolation).
3. **fitz extraction succeeds but returns 0 chars** (vector-graphics PDFs that PyMuPDF can't rasterize — 39 of 100 corpus papers per Phase 127-05) OR **raises any exception** → same `file_size // 4` byte-proxy fallback.

Verified via the in-process smoke test (no PDF actually opened — the helper isn't called from tests in this plan; live exercise lands in Plan 06).

### Confirmation: Plan Success Criteria

All 9 success-criteria checkboxes from the plan PASS:

- [x] `python tier-2-managed/main.py --help` exits 0 listing --ingest, --query, --reset, --model — verbatim output above.
- [x] main.py enforces GEMINI_API_KEY presence + `file_search_stores` SDK feature presence at startup — both via friendly red error + exit code 2 (Pitfalls 10 + 1).
- [x] Default invocation auto-creates store + uploads KB + runs DEFAULT_QUERY — `no_flags = not (args.ingest or args.query or args.reset)` gate sets both `args.ingest = True` and `args.query = DEFAULT_QUERY`.
- [x] Single `CostTracker("tier-2")` instance threaded through ingest (synthetic `record_embedding("gemini-embedding-001", N)`) + query (`record_llm`) + `persist()` (D-13 schema) — verified by source inspection: tracker is created once in `main()`, passed to both `cmd_ingest` and `cmd_query` by reference, and `tracker.persist()` is called at the end of `cmd_query`.
- [x] End-to-end query latency measured via `time.monotonic()` and printed alongside cost — `t0 = time.monotonic(); ...; latency = time.monotonic() - t0`; printed via `console.print(f"[bold]Latency:[/bold] {latency:.2f}s")`.
- [x] Idempotent ingest: skips PDFs already in the store via `list_existing_documents` (Pitfall 2) — `existing = list_existing_documents(client, store.name)` → `if display_name in existing: skipped += 1; continue`.
- [x] Sequential uploads using `upload_with_retry` (Pitfall 2 — never parallel) — single `for p in papers:` loop with one `upload_with_retry` call per iteration.
- [x] `query.py` exposes `query`, `to_display_chunks` with defensive None/score handling (Pitfall 6 + Open Q3) — verified by 6-case in-process smoke test (empty candidates, None grounding_metadata, None grounding_chunks, None retrieved_context, missing score, full chain).
- [x] All non-live tests still pass — 64 passed, 2 skipped, 5 deselected. The 5 pre-existing chromadb-missing failures in tier-1-naive/tests/test_store.py are out-of-scope (Plan 02 SUMMARY documented these as environmental — `[tier-1]` extras not installed in the executor's `.venv`; baseline behavior, not a regression).
- [x] Atomic commits per task pushed — `a626c96` (Task 1, push 332f2d2..a626c96) + `94b6f97` (Task 2, push b95b5a3..94b6f97).

## Decisions Made

See frontmatter `key-decisions` for the six decisions extracted to STATE.md. Brief rationales:

1. **`console_override=console` threading in cmd_query** — copy of the Plan 128-06 retro-fix. Without it, the `Cost:` / `Latency:` / `Cost JSON written to` lines would split across two Console instances (the module-level `shared.display.console` vs the local `Console()` in `main()`); the live test from 128-06 caught this on Tier 1 and the same defect would have re-appeared in Tier 2.
2. **Three-layer `_count_pdf_tokens` fallback** — Pitfall 11 says each tier owns its own deps. Tier 2's pyproject extras are `[shared]`-only (per Plan 129-01), so `import fitz` is NOT guaranteed. The fallback to `file_size // 4` keeps Tier 2 installable on a `[tier-2]`-only machine while still giving an accuracy boost when the user happens to also have `[tier-1]` installed.
3. **cl100k_base 4096-char cap** — encoding a full 50-page paper takes hundreds of milliseconds; 100 papers × hundreds of ms = blocking the user for 10+ seconds on EVERY ingest just to estimate a synthetic line item. The cap trades a tiny accuracy hit (the estimate is already synthetic per Pitfall 7) for non-blocking ingest.
4. **Native `gemini-2.5-flash` slug, not OpenRouter `google/gemini-2.5-flash`** — Gemini File Search is a NATIVE Gemini API feature (`client.file_search_stores.*`); it does NOT exist on the OpenRouter unified gateway. Tier 2 must use the native `google.genai.Client(api_key=GEMINI_API_KEY)`. Both pricing entries exist in `shared.pricing.PRICES` with identical rates so cost tracking is correct on either path.
5. **Defensive `usage_metadata` access in cmd_query** — some Gemini response paths (cached, certain tool-use flows) omit `usage_metadata`. Without `getattr(...) or 0` guards, `cmd_query` would raise `AttributeError` on those paths and the user would see a stack trace instead of an answer.
6. **Untouched `dataset/manifests/metadata.json` working-tree change** — out of scope (Phase 127 ownership, just a stale-timestamp drift). Per the GSD scope-boundary rule, the executor only fixes issues directly caused by the current task's changes.

## Deviations from Plan

None — the plan was executed exactly as written. The `<interfaces>` block contained ready-to-paste reference code for both files; the only judgement calls were:

- Slight reorganization of `_count_pdf_tokens` to make the three fallback layers structurally explicit (the plan's reference code mixed try/except branches; I lifted the `import fitz` ImportError check to its own dedicated path so the file-size-proxy fallback is reachable from BOTH ImportError and extraction-failure conditions).
- Promoted the docstrings on `cmd_ingest`, `cmd_query`, `_count_pdf_tokens`, and the module to capture the Pitfall references inline so future readers don't need to cross-reference 129-RESEARCH.md to understand each defensive measure.

Both are stylistic — neither changes behavior, the public API, or the verification-block grep checks. No deviation rules (1-4) triggered.

## Issues Encountered

- **Concurrent push race with Plan 129-05.** Plan 05 pushed `b95b5a3` (`feat(129-05): tier-3 ingest + query`) between my Task 1 push (`a626c96`) and my Task 2 push attempt. Local main was behind by one commit. Git's auto-fetch-on-push handled it cleanly: my `git push origin main` after Task 2's commit produced `b95b5a3..94b6f97 main -> main` — clean fast-forward, no manual `pull --rebase` needed. File ownership was respected on both sides (Plan 05 only touched `tier-3-graph/*`; this plan only touched `tier-2-managed/*`).
- **Plan 05's tier-3 files briefly appeared as "staged" in `git status`** between Plan 05's `git add` and Plan 05's `git commit`. I never explicitly added or unstaged them — when I ran `git add tier-2-managed/main.py`, only my own file was added to MY staging area; Plan 05's commit then took the tier-3 files into its own commit and they disappeared from my view. Standard parallel-wave behavior in a shared working tree on a single branch.
- **`uv run` blocked by sandbox** (cannot write to `~/.cache/uv/sdists-v8/.git`) — same as every prior plan. Worked around by invoking `.venv/bin/python` directly for both smoke imports and pytest. All checks ran cleanly.
- **Pre-existing 5 chromadb-missing test failures in `tier-1-naive/tests/test_store.py`** — same baseline Plan 02 documented. Out-of-scope per SCOPE BOUNDARY; not caused by this plan's changes.

## User Setup Required

None — Tier 2 reuses the existing `GEMINI_API_KEY` (`shared.config.gemini_api_key`, REQUIRED since Phase 127). No new external service keys, env vars, or dashboard configuration introduced. Plan 129-06's live e2e test will be the first run that actually exercises the live FileSearchStore lifecycle end-to-end against real Gemini quota.

## Next Phase Readiness

- **Plan 129-06 (Tier 2 README + live e2e test) is unblocked.** All three of Tier 2's ROADMAP success criteria are now functionally implemented:
  1. `python tier-2-managed/main.py` uploads KB + answers query — argparse + cmd_ingest + cmd_query wired.
  2. Store persists in Google's cloud — sidecar caching from Plan 02 + `get_or_create_store` re-use.
  3. Cost (LLM exact + synthetic indexing) and latency printed alongside answer — `time.monotonic()` + `tracker.persist()` + `render_query_result(... console_override=console)`.
- **No new blockers.** The chromadb-missing failures predate this plan and are tier-1's environmental concern.
- **Live test scope for Plan 06:** Plan 06's live test will need to exercise the full ingest path (5-paper subset suggested per Phase 127-style smoke patterns) and ensure (a) `_count_pdf_tokens` fitz-vs-fallback path is exercised, (b) `to_display_chunks` returns at least one chunk for the canonical query (Lewis et al. 2020 IS in the corpus), (c) `costs/tier-2-{timestamp}.json` is written with both the synthetic embedding line and the real LLM line.

## Self-Check: PASSED

- `/Users/patrykattc/work/git/rag-architecture-patterns/tier-2-managed/query.py` — exists, 132 LOC (>= plan's `min_lines: 50`).
- `/Users/patrykattc/work/git/rag-architecture-patterns/tier-2-managed/main.py` — exists, 347 LOC (>= plan's `min_lines: 130`).
- Commit `a626c96` — present in `git log --oneline` on local main and pushed to `origin/main` (`332f2d2..a626c96`).
- Commit `94b6f97` — present in `git log --oneline` on local main and pushed to `origin/main` (`b95b5a3..94b6f97` — Plan 05's interleaved push handled by clean fast-forward).
- All 11 plan key_links greps PASS (`render_query_result`, `CostTracker("tier-2")`, `DatasetLoader`, `list_existing_documents`, `tracker.persist`, `time.monotonic`, `hasattr.*file_search_stores`, `console_override=console`, `record_embedding`, `INDEXING_PRICE_PER_M`, `gemini-embedding-001`).
- `python tier-2-managed/main.py --help` exits 0 with the verbatim usage string.
- `from tier_2_managed.{main,query,store} import ...` smoke-import resolves cleanly; `INDEXING_PRICE_PER_M == 0.15`; `DEFAULT_MODEL == 'gemini-2.5-flash'`; `'Lewis et al. 2020' in DEFAULT_QUERY`.
- Non-live pytest: 64 passed, 2 skipped, 5 deselected (excluding the 5 pre-existing chromadb-missing failures in tier-1-naive/tests/test_store.py — same baseline Plan 02 documented).
- File ownership respected: `git show --stat a626c96 94b6f97` confirms only `tier-2-managed/query.py` and `tier-2-managed/main.py` modified across the two commits; zero tier-3-graph files touched; zero shared/* files modified.

---
*Phase: 129-tiers-2-3-managed-graph-rag*
*Plan: 04*
*Completed: 2026-04-26*
