---
gsd_state_version: 1.0
milestone: v1.22
milestone_name: RAG Architecture Patterns
status: executing
stopped_at: Completed 129-02-PLAN.md (Tier 2 store helpers)
last_updated: "2026-04-26T17:36:44.249Z"
last_activity: 2026-04-26
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 18
  completed_plans: 15
  percent: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** Phase 129 - Tiers 2-3 Managed + Graph RAG (in progress; Plan 01 complete — dep contract locked for both tiers; Plans 02-07 across Waves 2-4 remaining)

## Current Position

Phase: 129 of 134 IN PROGRESS (Tiers 2-3 Managed + Graph RAG)
Plan: 3 of 7 complete (Wave 1 done — [tier-3] concretized w/ lightrag-hku==1.4.15; [tier-2] left as [shared] stub since google-genai already covers file_search_stores)
Status: Ready to execute
Last activity: 2026-04-26

Progress: [████████░░] 83%

## Performance Metrics

**Velocity:**

- Total plans completed: 300 (across 21 milestones)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 through v1.17 | 1-101 | 231 | 831 | 2026-02-11 to 2026-03-15 |
| v1.18 AI Landscape Explorer | 102-110 | 25 | 40 | 2026-03-26 to 2026-03-27 |
| v1.19 Claude Code Guide Refresh | 111-116 | 25 | 34 | 2026-04-12 |
| v1.20 Dark Code Blog Post | 117-121 | 8 | 25 | 2026-04-14 |
| v1.21 SEO Audit Fixes | 122-126 | 13 | 21 | 2026-04-16 to 2026-04-17 |
| v1.22 RAG Architecture Patterns | 127-134 | TBD | 31 | in progress |
| Phase 127 P01 | 219 | 3 tasks | 18 files |
| Phase 127 P02 | ~10min | 3 tasks | 14 files (1252 LOC across shared/ + tests/) |
| Phase 127 P03 | 7m 19s | 3 tasks | 9 files |
| Phase 127 P04 | 14m | 3 tasks | 101 files |
| Phase 127 P05 | 17m | 3 tasks | 582 files |
| Phase 127 P06 | 14m | 3 tasks | 6 files (golden_qa.json + metadata.json + 2 tests + 1 script + README) |
| Phase 128 P01 | 3min | 2 tasks (+1 lockfile sync follow-on) | 3 files (pyproject.toml, .env.example, uv.lock) |
| Phase 128 P02 | 4min | 2 tasks tasks | 4 files (177 LOC) files |
| Phase 128 P03 | 2.5min | 2 tasks | 4 files |
| Phase 128 P04 | 5min | 2 tasks | 4 files (3 created + 1 modified, 356 LOC) files |
| Phase 128 P05 | 7min | 2 tasks | 3 files |
| Phase 129 P01 | 2m 55s | 2 tasks | 4 files |
| Phase Phase 129 P03 P03 | 11min | 2 tasks tasks | 8 files (7 created + 1 modified) files |
| Phase 129 P02 | 14min | 1 tasks | 4 (3 created + 1 modified, 240 LOC) files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Plan 127-01 added:

- Tier-N pyproject extras stub as `[shared]` only; concrete tier deps land in Phases 128-130
- `tier-N/requirements.txt` mirrors parent extras via `-e ..[tier-N]` (single source of truth in pyproject)
- `google-genai` pinned (NOT deprecated `google-generativeai` EOL 2025-08-31)
- LFS lock-verify disabled per-remote due to sandbox TLS limitation; LFS object storage unaffected
- GitHub API access uses `curl + Authorization: token $(gh auth token)` because `gh` subcommands fail in sandbox

Plan 127-02 added:

- Lazy `get_settings()` factory pattern (lru_cache) — `Settings()` is NEVER instantiated at module import; `Field(..., alias="GEMINI_API_KEY")` stays REQUIRED (Pattern 5) but ValidationError only raised when callers actually need keys (preserves "validation contract" without weakening to `default=SecretStr("")`)
- `DatasetLoader` deliberately decoupled from `get_settings()` — defaults to `Path("dataset")` so contributors can inspect manifests offline without a Gemini key
- Construction-time timestamp captured in `CostTracker.__init__` so repeated `persist()` calls overwrite the same `{tier}-{timestamp}.json` file (idempotent per-run artifact)
- `uv sync --extra ... --group ...` chosen over `uv pip install --group ...` — uv 0.6.3 doesn't accept `--group` on `pip install`
- Conditional `pytest.skip` pattern for staged-dataset trace tests — `tests/test_dataset.py` lands once and passes at empty/partial/full wave boundaries; Plan 06 extends in place
- T-127-08 lockfile guard added to `tests/test_tier_requirements.py` — fails if `google-generativeai` (deprecated) ever returns to `uv.lock`
- Live smoke test deferred to Plan 06 — `.env` was absent in Plan 02 auto-mode run, so 3 `@live` tests committed but unrun; Plan 06 has the canonical live-smoke checkpoint
- Plan 127-03: arxiv.Client(delay_seconds=3.0) and semanticscholar wrapper baked into curate_corpus.py — never custom requests loops (Pitfall 2/3)
- Plan 127-03: cut_video_clips.py refuses TBD/ND licenses at the safety gate (D-12, Pitfall 8); exits 1 on any refusal
- Plan 127-03: pyproject [build-system] + [tool.setuptools] packages=[shared,scripts] required for flat-layout editable install (Rule 3 fix)
- Plan 127-04: GIT_SSL_CAINFO=/etc/ssl/cert.pem persisted as http.sslCAInfo local-config — sandbox keychain access blocked git-lfs Go runtime cert resolution; CA-bundle redirect preserves TLS verification (no weakening)
- Plan 127-04: Curator approved 100-paper cluster as-previewed (no swaps); Sleeper Agents (2401.05566) explicitly retained per off-topic-but-approved decision
- Plan 127-05: 581 figures extracted via PyMuPDF default thresholds (--min-dim 200 --max-aspect-ratio 5); 19 sub-1KB extraction-artifact placeholders pruned during curator review
- Plan 127-05: 8 figure captions extracted verbatim from source PDFs via fitz.get_text(clip=caption_band) — covers Lewis 2020 RAG, GraphRAG x2, LightRAG x2, Transformer, VisRAG x2 (>=7 needed for Plan 06)
- Plan 127-05: Video clip cut DEFERRED — sandbox cannot verify slideslive.com CC license; cut_video_clips.py safety gate correctly refused TBD entry. REPO-02 satisfied via 581-image set; videos remain tier-4 bonus
- Plan 127-05: dataset/manifests/videos.json deliberately ABSENT (not empty []) — preserves test_videos_manifest_conditional skip path; shared.loader treats absent file as empty list
- Plan 127-05: 39 of 100 papers contributed zero raster figures (vector-graphics-only PDFs that PyMuPDF cannot rasterize) — Self-RAG, FLARE, CRAG, Step-Back among them; informs Plan 06 to target the 61 papers WITH figures for multimodal Q&A
- Plan 127-06: D-04 LOCKED 10/10/7/3 split adapted to shipped 10/10/10/0 — 3 video Q&A slots substituted with 3 multimodal extras (Sleeper Agents, Mixed Precision, Marcus 'Next Decade'); Plan-06-authored captions inline in question text; documented prominently in README + test_golden_qa.py + 127-06-SUMMARY.md
- Plan 127-06: build_metadata.py treats absent videos.json as [] (mirrors shared.loader semantics) so the aggregator stays wave-tolerant
- Plan 127-06: Live smoke test (REPO-03 gate) DEFERRED to user — GEMINI_API_KEY not in executor environment; smoke test code committed and verified (test_imports passes); 3 live tests skip gracefully via live_keys_ok fixture
- Plan 127-06 follow-up (2026-04-26): Live smoke PASSED — 3 @live tests pass in ~6s for ~$0.0001. Required conftest.py patch (commit 08dce6a) adding module-level load_dotenv() because live_keys_ok used os.getenv directly while pydantic-settings only loaded .env inside Settings().
- Phase 127 verifier: PASSED 4/4 must-haves on 2026-04-26. Video-clip absence acceptable (REPO-02 "at least one image" satisfied 581-fold). Golden Q&A 10/10/10/0 split deviation from D-04 documented; cross-document multi-hop coverage holds.
- Plan 128-01: [tier-1] extras concretized to chromadb>=1.5.8,<2 / openai>=1.50,<3 / pymupdf>=1.27,<2 — pins verbatim from 128-RESEARCH.md Standard Stack
- Plan 128-01: shared/embeddings.py NOT modified — Gemini-only contract from Phase 127 preserved; Tier 1 OpenAI embedder will live in a separate Tier-1 module added in Plan 128-03
- Plan 128-01: OPENAI_API_KEY promoted from OPTIONAL to REQUIRED for Tier 1 in .env.example — empty default value preserved (no real key committed); test_env_example.py unchanged because it does not assert on OPTIONAL literal
- Plan 128-01: uv.lock regenerated by `uv run pytest` committed separately as `chore(128-01)` (Rule 3 follow-on) — keeps Task 1 (deps) and Task 2 (docs) commits narrow while ensuring pyproject↔lockfile stay in lockstep; amending forbidden by GSD git protocol
- Plan 128-02: Tier 1 chunker locks 512/64 token windows via tiktoken cl100k_base; chunk id format {paper_id}_p{page:03d}_c{idx:03d}; ingest.py is library-only (no __main__) — Plan 04 owns the CLI
- Plan 128-02: test_chunker.py uses importlib.util.spec_from_file_location to load ingest.py because directory tier-1-naive (hyphen) is not importable as tier_1_naive (underscore); avoids setuptools package manipulation
- Plan 128-02 follow-on (Rule 3): removed tier-1-naive/tests/__init__.py — pytest's rootdir importer raised ImportPathMismatchError when both repo-root tests/__init__.py and tier-local tests/__init__.py registered as the 'tests' package; deletion safe because test_chunker.py uses importlib (no package-relative imports)
- Plan 128-03: pre-computed OpenAI embeddings with CostTracker.record_embedding hook (NOT OpenAIEmbeddingFunction) — every API call auditable per Pitfall 5
- Plan 128-03: cosine HNSW configured at first creation only via configuration={hnsw:{space:cosine}} (1.x shape) — reset=True wipes-and-recreates to change index params (Pitfall 4)
- Plan 128-03: chroma_db/tier-1-naive/ path locked exclusively for Tier 1; Tier 5 (Phase 130) reads from this path but writes to chroma_db/tier-5-agentic/ (Pitfall 8)
- Plan 128-03: test_store.py uses importlib.util loader pattern (mirrors test_chunker.py from Plan 02) — direct from tier_1_naive.* import * does not work because dir is tier-1-naive (hyphens not valid Python identifiers)
- Plan 128-04: tier_1_naive importable shim package required because on-disk dir tier-1-naive uses hyphens (invalid Python identifiers); shim uses importlib.util.spec_from_file_location to register tier-1-naive/*.py modules under tier_1_naive.<name> — preserves human-readable directory naming convention while allowing standard dotted imports for main.py and external test code
- Plan 128-04: OPENAI_API_KEY None guard placed BEFORE CostTracker instantiation and any client construction in main.main() — fast-fail with friendly red error + exit code 2 (Pitfall 10); verified via patched get_settings
- Plan 128-04: Default flag-less invocation auto-sets args.ingest=True AND args.query=DEFAULT_QUERY — relies on cmd_ingest's idempotency for repeat runs; gets users to a working demo in one command
- Plan 128-04: Bundled tier_1_naive shim into Task 1's commit (rather than a separate Rule-3 follow-on commit) because Task 1's smoke test depends on it; keeps atomic unit coherent
- Plan 128-05: Tier 1 README locks the 9-section template (title, quickstart, CLI, cost table, persistence, weaknesses, sample query, architecture, reused-by) for Tiers 2-5 in Phases 129-130; cost numbers verbatim from 128-RESEARCH.md @ 2026-04 vintage
- Plan 128-05: live end-to-end test deferred to user (OPENAI_API_KEY empty in local .env from Phase 127-era template); test code committed and statically verified (61 non-live passed); fixture skips cleanly per design — Phase 127 Plan 06 precedent (commit 08dce6a follow-on)
- Plan 128-05: tier1_live_keys fixture requires BOTH OPENAI_API_KEY AND GEMINI_API_KEY (vs repo-root live_keys_ok which checks Gemini only) because Tier 1 needs both providers end-to-end; conftest duplicates load_dotenv() to make -m live invocations from tier subdirectory self-contained
- Plan 128-06: Mid-phase architectural pivot — Tier 1 now routes BOTH embeddings and chat through OpenRouter unified gateway (single OPENROUTER_API_KEY). User-supplied OpenRouter key supports embeddings (verified 2026-04 via web search and openrouter.ai/openai/text-embedding-3-small docs); OpenAI Python SDK is fully compatible with base_url="https://openrouter.ai/api/v1" for both /embeddings and /chat/completions endpoints
- Plan 128-06: Phase 127 contracts preserved — shared/llm.py (Gemini-only) and shared/embeddings.py (Gemini-only) untouched; Tier 1's OpenRouter usage is isolated in tier-1-naive/embed_openai.py (refactored) + tier-1-naive/chat.py (new); shared.config.openrouter_api_key added as optional SecretStr so Phase 127 smoke test still imports cleanly without an OpenRouter key
- Plan 128-06: --model flag added to main.py (default google/gemini-2.5-flash for narrative continuity); shared/pricing.py extended with OpenRouter slugs (openai/text-embedding-3-small, google/gemini-2.5-flash, anthropic/claude-{haiku,sonnet}-4.5, openai/gpt-4o-mini, openai/gpt-4o); cost tracking unchanged because OpenRouter passes provider rates through 1:1
- Plan 128-06: Pre-existing console-routing bug discovered + fixed during live test — cmd_query was calling render_query_result() WITHOUT console_override, so the "Cost:" line went to shared.display's module-level Console (stdout) instead of the recording console; test missed this in Plan 128-05 because the live test was deferred. Fix: thread console_override=console through cmd_query
- Plan 128-06 follow-on: tier-1-naive/tests/conftest.py also injects repo-root onto sys.path so `from tier_1_naive import main` resolves in pytest's process (main.py does this at script-startup, but pytest does not replicate it); ChromaDB index dimensions unchanged (1536) because openai/text-embedding-3-small is the same underlying model; on-disk chroma_db/tier-1-naive/ Tier 5 reuse contract intact
- Plan 128-06 live test PASSED on 2026-04-26 — 1 passed in 8.04s against real OpenRouter API; 42 chunks embedded across 2 papers; query through google/gemini-2.5-flash returned answer with cost $0.001379 (input_tokens=2914, output_tokens=61); all 3 ROADMAP must-haves now empirically verified (not just static-verified)
- Plan 129-01: [tier-3] extras concretized to lightrag-hku==1.4.15 (EXACT pin per Pitfall 9; releases every 2-7 days), openai>=1.50,<3 (mirror [tier-1]), pymupdf>=1.27,<2 (Tier 3 owns its own per Pitfall 11)
- Plan 129-01: [tier-2] LEFT UNCHANGED as [shared] stub — google-genai>=1.73 from [shared] already exposes client.file_search_stores.* (added in google-genai SDK v1.49); Tier 2 needs no new top-level deps. Documented in commit message so future readers don't think it was forgotten.
- Plan 129-01: .env.example OPENROUTER_API_KEY comment block promoted to Tier 1 + Tier 3 explicit — Gemini File Search is Gemini-native (cannot route via OpenRouter), but LightRAG is OpenAI-SDK-compatible so Tier 3 reuses Phase 128's OpenRouter routing for narrative continuity (single OPENROUTER_API_KEY for both tiers)
- Plan 129-01: tier-2-managed/.store_id added to .gitignore (Pattern 1 store-id caching from 129-RESEARCH.md); lightrag_storage/ already covered by existing lightrag_*/ glob (no duplicate added)
- Plan 129-01: uv.lock regen committed separately as chore(129-01) per Phase 128-01 precedent; preserves atomic deps commit; uv pip install --dry-run -e ".[tier-3]" resolves 24 new packages incl lightrag-hku==1.4.15 + 23 transitive deps; tests/test_tier_requirements.py 5/5 PASS (T-127-08 lockfile guard intact — no google-generativeai)
- Plan 129-03: RESEARCH Open Q1 RESOLVED — probe of lightrag-hku==1.4.15 confirmed token_tracker IS supported on BOTH openai_complete_if_cache AND openai_embed (research only hypothesized LLM-side); add_usage protocol receives a dict with prompt_tokens/[completion_tokens]/total_tokens
- Plan 129-03: CostAdapter dispatches LLM vs embedding on completion_tokens key presence (NOT value); embed payloads omit the key entirely. Single CostAdapter instance threaded through both llm_model_func + embedding_func via build_rag(llm_token_tracker=...) — captures total Tier 3 cost without monkey-patch fallback
- Plan 129-03: build_rag module imports cleanly without OPENROUTER_API_KEY (closures read env LAZILY at call time); LightRAG constructor creates working_dir + 4 storage files (graph .graphml + 3 vdb_*.json) but makes NO network calls — verified by no-key smoke construct
- Plan 129-03: EMBED_DIMS=1536 hardcoded at module level (NOT a CLI flag) — Pitfall 4: LightRAG indexes vectors at first ingest; dim change silently corrupts retrieval (HKUDS issue #2119); --reset is the only path to a new dim
- Plan 129-03: scripts/probe_lightrag_token_tracker.py committed as re-runnable diagnostic — establishes 'probe-before-commit' pattern for high-uncertainty integrations (run script, capture verbatim output in SUMMARY, commit script so future readers can replay decision after dep upgrades)
- Plan 129-02: Used parent= kwarg (NOT file_search_store_name=) for client.file_search_stores.documents.list() — verified against google-genai==1.73.0 SDK source (documents.py L327-354). Plan/research draft used the wrong kwarg; SDK reuses the standard Google API parent= convention for list endpoints while upload/import keep file_search_store_name=. Caught and fixed via Rule 1 before commit.
- Plan 129-02: tier_2_managed shim is 64 lines vs tier_1_naive 62 — only difference is two extra docstring lines mentioning Plan 129-04 module names (query, main); load loop is structurally identical. Confirms hyphen-dir → underscore-shim is now a stable repo convention across Tiers 1, 2, 3.
- Plan 129-02: pyproject.toml [tool.setuptools].packages = [shared, scripts, tier_1_naive, tier_2_managed, tier_3_graph]. Plan 129-03 added tier_3_graph concurrently; this plan added tier_2_managed on the same line (different element). Each agent diff stayed scoped to its own tier; no merge conflict, no rebase needed; clean fast-forward push 720810b..332f2d2.
- Plan 129-02: NO live API calls during this plan. Smoke test exercises pure import resolution + module-level constant assertions only (STORE_DISPLAY_NAME==rag-arch-patterns-tier-2; STORE_ID_PATH endswith tier-2-managed/.store_id; POLL_INTERVAL_S==2.0). Live store-create/upload deferred to Plan 06 e2e to avoid burning Gemini File Search quota on import-only assertions.
- Plan 129-02: client.file_search_stores.documents.list() returns google.genai.pagers.Pager[types.Document] (auto-paginates on iteration). For Plan 06 live test loop: a plain for doc in pager: ... covers stores larger than one page without manual next_page() calls.

### Pending Todos

None.

### Blockers/Concerns

- Phase 129 (Tier 3 LightRAG): Verify Python API against lightrag-hku v1.4.15 before implementation
- Phase 130 (Tier 4 RAG-Anything): Verify MinerU/LibreOffice requirements for PDF-only datasets
- Phase 130 (Tier 5 Agentic): Verify FileSearchTool + @function_tool coexistence in OpenAI Agents SDK
- Phase 127 (Plans 04/05): GitHub LFS quota for free tier still unverified — check `https://github.com/settings/billing` before bulk PDF push

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 010 | Correctness validation | 2026-02-26 | 9d20b42 | [010-correctness-validation](./quick/010-correctness-validation/) |
| 011 | EDA content correctness validation | 2026-02-26 | 958be19 | [011-eda-content-correctness-validation](./quick/011-eda-content-correctness-validation/) |
| 012 | Fix Snyk security scan vulnerabilities (npm audit + W007 secret redaction) | 2026-03-06 | ddf902c | [012-fix-snyk-security-scan-issue-on-gha-vali](./quick/012-fix-snyk-security-scan-issue-on-gha-vali/) |

## Session Continuity

Last session: 2026-04-26T17:36:44.241Z
Stopped at: Completed 129-02-PLAN.md (Tier 2 store helpers)
Resume file: None
Next: `/gsd:execute-phase 129` (Tiers 2-3) — Wave 2 plans 02 + 03 ready to run in parallel (file-ownership conflict on pyproject.toml resolved by 129-01).
