---
phase: 130-tiers-4-5-multimodal-agentic-rag
plan: 03
subsystem: tier-4-multimodal-cli
tags: [tier-4, raganything, docker, cli, cost-surprise-gate, device-autodetect, multi-stage-dockerfile]
requirements: [TIER-04, REPO-05]
dependency_graph:
  requires:
    - "130-02 (build_rag + CostAdapter + ingest_pdfs + ingest_standalone_images)"
    - "tier-3-graph/main.py (Phase 129 Plan 05 — async cost-surprise gate precedent)"
    - "shared/cost_tracker.py (CostTracker queries[] / total_usd / persist)"
    - "shared/display.py (render_query_result console_override threading)"
  provides:
    - "tier-4-multimodal/query.py — Pattern 4 query branching + Pitfall 7 chunk adapter"
    - "tier-4-multimodal/main.py — async argparse CLI (485 LOC) with cost-surprise gate + device autodetect"
    - "tier-4-multimodal/Dockerfile — Pattern 8 multi-stage build (114 LOC)"
    - "tier-4-multimodal/.dockerignore — lean image manifest (37 LOC)"
    - "tier-4-multimodal/rag.py — refactored to factory pattern with llm_token_tracker plumbing (Rule 1 deviation)"
  affects:
    - "Plan 130-05 (Tier 4 README) — references main.py CLI flags + Dockerfile in README"
    - "Plan 130-06 (Tier 5 live e2e) — establishes CLI ergonomics convention for Tier 5 main.py"
tech_stack:
  added: []
  patterns:
    - "Pattern 4 (multimodal_content branching) — query.py Lines 31-58"
    - "Pattern 8 (multi-stage Dockerfile) — Dockerfile Lines 28-114"
    - "Cost-surprise gate (Phase 129 Plan 05 precedent extended to Tier 4)"
    - "Factory closure with token_tracker (Tier 3 → Tier 4 mirror — Rule 1 fix)"
    - "Device autodetect (Open Q3 — torch.cuda.is_available → mps → cpu fallback)"
    - "Default flag-less invocation auto-sets args.ingest=True (Phase 128 Plan 04 convention)"
key_files:
  created:
    - "tier-4-multimodal/query.py (91 LOC)"
    - "tier-4-multimodal/main.py (485 LOC)"
    - "tier-4-multimodal/Dockerfile (114 LOC)"
    - "tier-4-multimodal/.dockerignore (37 LOC)"
  modified:
    - "tier-4-multimodal/rag.py (174 → 239 LOC; +65 LOC, factory refactor — Rule 1 deviation)"
decisions:
  - "Rule 1 deviation — Plan 02's build_rag did NOT plumb llm_token_tracker through to closures despite cost_adapter.py docstring promising it. Refactored rag.py to factory pattern (_make_llm_func/_make_vision_func/_make_embed_func accepting token_tracker) verbatim from tier-3-graph/rag.py; build_rag now accepts (working_dir, llm_token_tracker, model). Backward-compatible: existing test_build_rag_constructs(tmp_path) still passes."
  - "Rule 2 defensive correctness — fast-fail check guards against BOTH None AND empty SecretStr (raw_key check). Empty .env value is a real user error mode (copy .env.example, never fill in OPENROUTER_API_KEY). Plan body said 'is None' only; emptiness is the more common failure."
  - "main.py 485 LOC vs plan's ≥150 LOC minimum — extra lines spent on docstring (covers usage modes + architecture + cost-surprise mitigation) and inline pre/post tracker snapshot for per-query token delta (mirror of tier-3-graph/query.py)."
  - "Dockerfile MineRU pre-download is graceful triple-fallback (ensure_models → mineru --help → || true). RAG-Anything 1.2.10's MineRU integration entrypoint shape changes between minor releases; refusing to fail the build keeps CI green even if the helper is renamed."
  - "Dockerfile copies BOTH tier-1-naive/ AND tier_1_naive/ (and tier-4 hyphen+underscore) so the script-path AND shim-path imports both resolve inside the container — same convention used by the Plan 02 file layout."
  - "Docker build NOT attempted in this plan (sandbox blocks docker.sock with permission-denied; per plan's default behavior, Plan 05 owns the optional live build path). Static-only verification."
metrics:
  duration: "~25 min"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
  total_loc: 902
  completed_date: "2026-04-27"
---

# Phase 130 Plan 03: Tier 4 Multimodal CLI + Dockerfile Summary

**One-liner:** Tier 4's CLI surface fully wired — async argparse main.py with cost-surprise gate + device autodetect + console_override threading, async query.py with multimodal_content branching, multi-stage Dockerfile (raganything==1.2.10 + lightrag-hku==1.4.15 + socksio==1.0.0 + LibreOffice), and a Rule 1 refactor of Plan 02's rag.py to actually plumb the cost adapter through both LLM/vision and embedding closures (Plan 02 left a documented contract gap).

## Tasks Completed

| Task | Name                                                                          | Commit  | Files                                                              |
| ---- | ----------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| 1    | query.py + main.py CLI with cost-surprise gate + device autodetect (+ rag.py Rule 1 refactor) | a78b0da | tier-4-multimodal/{query,main,rag}.py (709 insertions / 68 deletions) |
| 2    | Dockerfile + .dockerignore                                                   | 0267ce1 | tier-4-multimodal/{Dockerfile,.dockerignore} (151 insertions)      |

## Implementation Notes

### query.py (91 LOC)

- `async def run_query(rag, question, mode="hybrid", multimodal_content=None) -> str` — Pattern 4 branching: `aquery_with_multimodal` when content list provided, plain `aquery` otherwise (multimodal KG still surfaces co-indexed image/table chunks).
- `def to_display_chunks(response: Any) -> list[dict]` — defensive Pitfall 7 adapter. Returns `[]` for string responses (RAG-Anything 1.2.10 returns `str`, no structured chunks). Forward-compat: dict response with `chunks`/`context`/`retrieved_chunks` keys auto-populates display dict shape.

### main.py (485 LOC)

- argparse with the full Tier 4 flag set: `--ingest`, `--query`, `--mode {naive,local,global,hybrid,mix}`, `--model`, `--reset`, `--include-images / --no-images`, `--include-pdfs / --no-pdfs`, `--device {auto,cpu,cuda:0,mps}`, `--yes`.
- Single `asyncio.run(amain(args, console))` boundary in `main()` (Pitfall 8).
- `_detect_device()` autodetects via torch (cuda → mps → cpu fallback). Defensive: try/except around `import torch` so a [tier-5]-only venv doesn't crash.
- `_confirm_or_abort(prompt, yes, console)` — CI-safe. Returns `False` on EOFError or non-`y` answer; mirrors Phase 129 Plan 05 pattern verbatim.
- `cmd_ingest` — hybrid path. `--include-pdfs` calls `ingest_pdfs(..., device=args.device, parser="mineru")`; `--include-images` calls `ingest_standalone_images(rag, dataset_root)`. Both honored independently.
- `cmd_query` — pre/post tracker delta for per-query token counts (`tracker.queries`, NOT plan body's incorrect `tracker.lines`); threads `console_override=console` to `render_query_result` (Plan 128-06 retro-fix).
- `amain` fast-fails with red error + exit 2 if `OPENROUTER_API_KEY` missing OR empty (Pitfall 10 + Rule 2).
- Cost-surprise gate fires on `--reset` (wipe confirmation) and on first ingest (graphml-size > 1KB heuristic mirrors Tier 3 — file is created at constructor init as empty placeholder).
- Default flag-less invocation auto-sets `args.ingest = True` (Phase 128 Plan 04 convention).
- `tracker.persist()` happens AFTER cmd_query so the cost JSON includes the full LLM+embed history.

### rag.py refactor (Rule 1 deviation)

Plan 02's build_rag did NOT accept `llm_token_tracker` despite cost_adapter.py's docstring promising:

> "A single instance is threadable through both the LLM closure and the embedding closure via `token_tracker=` so the full Tier 4 cost is captured under one adapter."

Plan 03's main.py wiring (`build_rag(..., llm_token_tracker=adapter)`) would have raised TypeError without the refactor. Fix: factory pattern mirroring `tier-3-graph/rag.py` verbatim:

- `_make_llm_func(model, token_tracker)` → wraps `openai_complete_if_cache(..., token_tracker=token_tracker)`
- `_make_vision_func(model, token_tracker)` → wraps both `messages=` and `image_data=` paths with `token_tracker=`; degrades to text-only via the same factory's `_make_llm_func` for empty calls
- `_make_embed_func(token_tracker)` → wraps `openai_embed(..., token_tracker=token_tracker)` (Phase 129 Plan 03 probe-validated)
- `build_rag(working_dir=WORKING_DIR, llm_token_tracker=None, model=None) -> RAGAnything` — backward-compatible (existing `test_build_rag_constructs(tmp_path)` still passes; default `llm_token_tracker=None` means tests skip cost recording).

### Dockerfile (114 LOC)

Multi-stage Pattern 8 build:

- **Stage 1 (model-builder):** `python:3.11-slim-bookworm AS model-builder` + apt install libreoffice-core + libreoffice-writer + build-essential + libgl1 + libglib2.0-0 + ca-certificates + curl. pip install raganything==1.2.10 + lightrag-hku==1.4.15 + openai>=1.50,<3 + Pillow>=10,<12 + socksio==1.0.0 (Pitfall 11). Best-effort MineRU pre-download via triple-fallback `python -c "from mineru.cli.client import ensure_models; ensure_models()" || mineru --help || true`.
- **Stage 2 (runtime):** Same Python base, runtime-only apt deps (no build-essential). `COPY --from=model-builder` brings `/root/.mineru` cache + `/usr/local/lib/python3.11/site-packages` + `/usr/local/bin` forward. Project source copied (both hyphen + underscore variants for both script-path and shim-path imports). `pip install --no-cache-dir -e ".[tier-4]"` wires editable install. `ENTRYPOINT ["python", "tier-4-multimodal/main.py"]` + sane `CMD` default.
- 3× OCI image labels (source / title / description). NEVER bakes `.env` in.

### .dockerignore (37 LOC)

Excludes `__pycache__`, `.pytest_cache`, `.venv/`, `*.egg-info/`, persistence dirs (`chroma_db/`, `lightrag_storage/`, `rag_anything_storage/`), `tier-4-multimodal/{output,.cache}/`, `evaluation/results/`, `.git/`, `.github/`, editor detritus, and `.env*` (with `!.env.example` exception).

## CLI flag list (verbatim from `--help`)

```
options:
  -h, --help            show this help message and exit
  --ingest              Run ingest pass (PDFs via MineRU + standalone images).
  --query QUERY         Question to answer. Defaults to a canned multimodal probe.
  --mode {naive,local,global,hybrid,mix}
                        LightRAG query mode (default hybrid). naive=vector-only,
                        local=entity-neighborhood, global=community-summary,
                        hybrid=local+global, mix=hybrid+rerank (requires reranker).
  --model MODEL         OpenRouter LLM slug for entity extraction + answers + vision
                        (default google/gemini-2.5-flash). Must be present in shared.pricing.PRICES.
  --reset               Wipe rag_anything_storage/tier-4-multimodal before --ingest.
  --include-images      Include standalone images in ingest (default: on).
  --no-images           Skip standalone images during ingest.
  --include-pdfs        Include PDFs in ingest (default: on).
  --no-pdfs             Skip PDF ingest (e.g. images-only run).
  --device DEVICE       MineRU compute device: auto (default), cpu, cuda:0, or mps.
  --yes                 Skip cost-surprise confirmation prompts (for non-interactive use).
```

## Fast-fail verbatim output

```
$ GEMINI_API_KEY="x" OPENROUTER_API_KEY="" uv run --extra tier-4 python tier-4-multimodal/main.py --query test
OPENROUTER_API_KEY required for Tier 4 (RAG-Anything entity-extraction + answers
+ embeddings + vision). Copy .env.example to .env and set your key from
https://openrouter.ai/keys
See tier-4-multimodal/README.md → Quickstart.
$ echo $?
2
```

## Dockerfile size estimate

```
$ wc -l tier-4-multimodal/Dockerfile
114 tier-4-multimodal/Dockerfile
```

## Docker build outcome

**SKIPPED — Plan 05 owns the optional live build path per plan default.**

Reason: agent sandbox blocks Docker socket with permission-denied. `docker --version` succeeds (Docker 29.4.0 detected on host) but `docker build --check -f tier-4-multimodal/Dockerfile .` returns:

```
ERROR: permission denied while trying to connect to the docker API at unix:///Users/patrykattc/.docker/run/docker.sock
```

Static verification confirms structural correctness:
- 2× `FROM python:3.11-slim-bookworm` (model-builder + runtime)
- 3× `COPY --from=model-builder ...` directives (well-formed)
- All `RUN apt-get install` lines end with `&& rm -rf /var/lib/apt/lists/*` (image-size hygiene)
- Both `ENTRYPOINT` and `CMD` present
- 3× `LABEL org.opencontainers.image.*` annotations
- Pin contracts: raganything==1.2.10 + lightrag-hku==1.4.15 + socksio==1.0.0 all present

User can verify locally with: `docker build -t rag-tier-4 -f tier-4-multimodal/Dockerfile .` (estimated 10+ min, ~4 GB image).

## Plan automated verification (all green)

```
OK query.py
OK main.py
OK Dockerfile
OK .dockerignore
OK aquery_with_multimodal
OK to_display_chunks
OK asyncio.run
OK console_override
OK _detect_device
OK CostAdapter
OK AS model-builder
OK raganything pin
OK lightrag pin
OK socksio pin
OK libreoffice
OK ENTRYPOINT
OK rag_anything_storage
OK .git/
```

## Test suite

```
$ UV_CACHE_DIR=$TMPDIR/uv-cache GEMINI_API_KEY="x" uv run --extra tier-4 --extra tier-5 pytest -q -m "not live"
91 passed, 4 skipped, 7 deselected, 5 warnings in 4.64s
```

Same passing total as before Plan 03 (no regressions from the Rule 1 rag.py refactor).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] rag.py build_rag missing llm_token_tracker plumbing**

- **Found during:** Task 1 — about to write `rag = build_rag(working_dir=WORKING_DIR, llm_token_tracker=adapter)` per plan body's must_have, but Plan 02's build_rag signature was `build_rag(working_dir: str = WORKING_DIR) -> RAGAnything` with no token_tracker support. The closures (`_llm_func`, `_vision_func`, `_embed_func`) were module-level and didn't accept `token_tracker=` either.
- **Issue:** cost_adapter.py docstring explicitly promised "single instance threadable through both the LLM closure and the embedding closure via token_tracker=" — but Plan 02 left the wiring unimplemented. Setting `rag.llm_token_tracker = adapter` post-construction (as the plan body suggested) would have been a no-op because the closures don't reference it.
- **Fix:** Refactored rag.py to factory pattern mirroring `tier-3-graph/rag.py` verbatim — `_make_llm_func(model, token_tracker)`, `_make_vision_func(model, token_tracker)`, `_make_embed_func(token_tracker)`. `build_rag(working_dir, llm_token_tracker=None, model=None)` threads tracker into all three closures via factory close-over. Backward-compatible (existing test still passes; default `None` means non-tracker callers behave identically to before).
- **Files modified:** tier-4-multimodal/rag.py (174 → 239 LOC; +65)
- **Commit:** a78b0da (bundled with Task 1's main.py because main.py's `build_rag(llm_token_tracker=adapter)` call would have crashed without it)

**2. [Rule 2 - Defensive correctness] Fast-fail guards empty SecretStr in addition to None**

- **Found during:** Task 1 smoke verification — `OPENROUTER_API_KEY=""` (empty value) skipped the fast-fail because `settings.openrouter_api_key is None` was False (it was `SecretStr('')`).
- **Issue:** Plan body's must_have said "fast-fails if OPENROUTER_API_KEY is None" but empty values are the more common user error (copy `.env.example`, never fill in the key). Same gap exists in Tier 3's main.py — flagged here, not fixed there (out of scope).
- **Fix:** Replaced `if settings.openrouter_api_key is None` with `raw_key = ... or ""; if not raw_key:`. Both None and empty SecretStr now hit the friendly red error + exit 2 path.
- **Files modified:** tier-4-multimodal/main.py
- **Commit:** a78b0da (same commit as Rule 1 fix)

**3. [Rule 3 - Sandbox-only] Docker build skipped (sandbox blocks docker.sock)**

- **Found during:** Task 2 — attempted `docker build --check` to verify Dockerfile syntax via BuildKit linter, got permission-denied on the docker socket.
- **Issue:** Agent sandbox does not grant access to `/Users/patrykattc/.docker/run/docker.sock`. This is not a Dockerfile correctness problem — it's a sandbox restriction (consistent with Phase 128-06 / 129-07 SOCKS5 sandbox precedent).
- **Fix:** Per plan's default behavior, skipped Docker build. Static structural verification covered (FROM stages, COPY --from, ENTRYPOINT, LABEL, dep pins, apt cache cleanup). Plan 05 owns the live build path; documented in this SUMMARY as "verify locally with docker build -t rag-tier-4 ...".
- **Files modified:** None (sandbox-only adjustment)
- **Commit:** N/A

### Plan body inaccuracies caught and silently corrected (not Rule 4)

- Plan body referenced `tracker.lines` in cmd_query — actual attribute is `tracker.queries` (CostTracker schema). Used correct attribute.
- Plan body referenced `tracker.timestamp` for the cost-JSON path message — actual method is private `_filename_timestamp()`. Replaced with `tracker.persist()`'s return value (a `Path`) which is the public contract.
- Plan body's CostAdapter constructor call (`CostAdapter(tracker, llm_model=args.model or DEFAULT_LLM_MODEL, embed_model=DEFAULT_EMBED_MODEL)`) is correct as-written.

### None of the above required user permission (Rules 1-3 only).

## Threat surface scan

No new network endpoints, auth paths, or trust-boundary schema changes introduced. Tier 4 inherits the existing OpenRouter (`https://openrouter.ai/api/v1`) trust boundary established in Phase 128-06 + extended in Phases 129-03 / 130-02. Dockerfile NEVER bakes secrets in; `.env` is excluded by `.dockerignore` (with `!.env.example` exception for the template).

## Self-Check: PASSED

- File `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/query.py` — FOUND
- File `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/main.py` — FOUND
- File `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/Dockerfile` — FOUND
- File `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/.dockerignore` — FOUND
- Commit `a78b0da` — FOUND on origin/main (feat 130-03: tier-4 query.py + main.py CLI)
- Commit `0267ce1` — FOUND on origin/main (feat 130-03: tier-4 Dockerfile)

All success criteria from the plan verified.
