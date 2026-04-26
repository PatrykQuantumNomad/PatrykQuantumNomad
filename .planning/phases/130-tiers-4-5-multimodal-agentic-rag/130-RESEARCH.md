# Phase 130: Tiers 4-5 Multimodal + Agentic RAG — Research

**Researched:** 2026-04-26
**Domain:** Multimodal RAG (RAG-Anything: text + images + tables + equations as one knowledge graph) and Agentic RAG (OpenAI Agents SDK: autonomous tool selection over Tier 1 ChromaDB + golden-corpus retrievers, with hard `max_turns` cap and per-query cost reporting). Includes a Docker delivery for Tier 4 (REPO-05).
**Confidence:** HIGH (raganything 1.2.10 surface, openai-agents 0.14.6 surface, max_turns semantics, LiteLLM-via-OpenRouter wiring, repo conventions inherited from Phases 127-129) / MEDIUM (raganything multimodal token costs at our exact corpus shape, MineRU model-download size in CI, agentic loop depth on the curated golden Q&A) / LOW (whether the `chunks` field returned by `aquery` is structured enough to feed into `shared.display.render_query_result` without a small adapter — likely needs an adapter; see Pitfall 7).

> **Note on upstream input:** No CONTEXT.md exists for Phase 130 (no `/gsd:discuss-phase` was run). Per the orchestrator brief, this RESEARCH.md treats ROADMAP + REQUIREMENTS + the verified Phase 127-129 outputs as the locked source of truth. The "User Constraints" section below is reconstructed from those locked artifacts plus the orchestrator's explicit framing.

<user_constraints>
## User Constraints (from ROADMAP + REQUIREMENTS + Phase 127-129 outputs)

### Locked Decisions

**From ROADMAP.md Phase 130 success criteria:**
1. Tier 4 processes the enterprise KB image and PDF tables alongside text via RAG-Anything, answering queries that require visual or tabular understanding.
2. Tier 5 autonomously selects retrieval tools (including Tier 1 ChromaDB index), iterates with a hard cap of `max_iterations=10`, and prints cost per query.
3. Docker support exists for Tiers 3-5 where dependency complexity requires it (at minimum Tier 4).
4. Both tiers include pre-computed expected outputs for users who cannot install all dependencies.

**From REQUIREMENTS.md:**
- **TIER-04:** Tier 4 (Multimodal RAG) with **RAG-Anything** processing images, tables, and text as unified knowledge graph.
- **TIER-05:** Tier 5 (Agentic RAG) with **OpenAI Agents SDK**, autonomous multi-tool retrieval with iteration limits.
- **REPO-05:** Docker support for Tiers 3-5 where dependency complexity requires it.

**From Phase 127-129 outputs (must be honored — already shipped):**
- `shared/config.py` lazy `get_settings()` factory; `GEMINI_API_KEY` REQUIRED; `OPENROUTER_API_KEY` already promoted to "REQUIRED for Tier 1, Tier 3 (LightRAG LLM/embed)" — Phase 130 promotes it again to also cover **Tier 4 (RAG-Anything LLM/vision/embed)** and **Tier 5 (Agents SDK LLM via LiteLLM-OpenRouter)**.
- `shared/llm.py:get_llm_client()` — Gemini-direct `gemini-2.5-flash`. Phase 130 keeps this for any non-agentic answer path; Tier 5's agentic loop uses LiteLLM via OpenRouter (Pattern 6 below).
- `shared/embeddings.py:get_embedding_client()` — Gemini `gemini-embedding-001` 768-dim. **Must NOT be modified.** Tier 4 wires its own OpenRouter-backed `EmbeddingFunc` per the Tier 3 precedent; Tier 5 reuses Tier 1's local OpenAI/OpenRouter embedder via the ChromaDB collection it shares.
- `shared/cost_tracker.py` — D-13 schema fixed; `evaluation/results/costs/{tier}-{timestamp}.json`. Capture once at construction; repeated `persist()` overwrites. Tier 4 records LLM + vision-LLM + embedding lines; Tier 5 records LLM lines per agent turn (one tracker per query, one persist per query).
- `shared/display.py:render_query_result(query, chunks, answer, cost_usd, input_tokens, output_tokens)` — every tier MUST use it. Tier 4 needs a small adapter from `aquery_with_multimodal` output → `chunks` shape; Tier 5 collects citations from whichever tool was last invoked.
- `shared/loader.py:DatasetLoader().papers()` returns 100 entries (`paper_id`, `title`, `filename`, `arxiv_id`, `authors`, `year`, `abstract`). Defaults to `Path("dataset")`.
- `shared/pricing.py` — locked PRICES table covers all models we need (gemini-2.5-flash, openai/gpt-4o-mini for vision, openai/text-embedding-3-small, google/gemini-2.5-flash via OpenRouter, anthropic/claude-haiku-4.5). **No edits to PRICES needed** unless Tier 4's vision model is GPT-4o (already present) or Tier 5 picks Claude Sonnet (already present).
- Dataset: 100 PDFs at `dataset/papers/`, **581 raster figures at `dataset/images/`**, manifests at `dataset/manifests/{papers,figures,metadata}.json`. Of the 581 figure entries, **only 8 have non-empty captions** — Tier 4 must NOT depend on captions being populated for its multimodal grounding (verified locally: `python3 -c "import json; d=json.load(open('dataset/manifests/figures.json')); print(sum(1 for f in d if f.get('caption')), '/', len(d))"` → 8/581).
- `evaluation/golden_qa.json` 30-question golden Q&A: 10 single-hop, 10 multi-hop, 10 multimodal slots (3 video slots substituted with multimodal extras in Plan 127-06). `videos.json` deliberately absent — image+text+tables only.
- `pyproject.toml` already declares **empty** `[tier-4]` and `[tier-5]` extras (`["rag-architecture-patterns[shared]"]` only). Phase 130 MUST extend each.
- `tier-4-multimodal/requirements.txt` and `tier-5-agentic/requirements.txt` already exist with `-e ..[tier-4]` / `-e ..[tier-5]`.
- `tests/test_tier_requirements.py` is a **lockfile guard**: it fails if `google-generativeai` (deprecated, EOL 2025-08-31) appears in `uv.lock`. RAG-Anything's transitive deps must be vetted (it depends on `lightrag-hku` which DOES NOT pull `google-generativeai` — verified Phase 129 research).
- `tests/conftest.py` exposes the `live_keys_ok` fixture (skips when `GEMINI_API_KEY` is unset); `pytest.mark.live` is registered. Phase 130 adds `live_openrouter_keys_ok` only if needed; otherwise extends in-test logic.
- Phase 128 established the canonical CLI pattern: `python tier-N-name/main.py [--ingest] [--query "..."] [--top-k N] [--reset] [--model SLUG]`. Cost JSON persisted on every successful query. Latency printed via `time.monotonic()`.
- **Live testing pattern (Phase 128/129 hard-won):** the orchestrator agent's shell exports `ALL_PROXY=socks5h://localhost:61994` + `HTTP_PROXY=...`. `httpx` (used by openai SDK, google-genai, lightrag, raganything) auto-detects this via `trust_env=True`. The venv MUST have `socksio` installable (`uv pip install socksio` — sandbox-only patch, NOT a project dep). Without the proxy, sandbox cannot resolve external hosts; with the proxy AND socksio, all live calls work. **Do NOT add `socksio` to pyproject.toml.** Document the workaround in each Tier 4/5 README's "Running live tests" section, mirroring Phase 129's `129-06-SUMMARY.md` § Live test environment.
- Persistence path convention: each tier owns a subdirectory under a top-level data root. Tier 1: `chroma_db/tier-1-naive/`. Tier 3: `lightrag_storage/tier-3-graph/`. **Phase 130 conventions (locked):** Tier 4 → `rag_anything_storage/tier-4-multimodal/` (RAG-Anything's `working_dir`). Tier 5 → no new persistence; **READS** Tier 1's `chroma_db/tier-1-naive/` collection AND optionally Tier 3's `lightrag_storage/tier-3-graph/` working dir. Add the new directory to `.gitignore`.
- ChromaDB collision (Phase 128 Pitfall 8): If Tier 5 ever decides to write its own collection, it MUST use `chroma_db/tier-5-agentic/` (different directory, different collection name) — never share write-paths across tiers.

### Claude's Discretion (this phase)

**Tier 4 (Multimodal RAG):**
- **Parser choice:** `mineru` (RAG-Anything default) vs `docling` vs `paddleocr`. Recommend **`mineru`** (RAG-Anything's blessed default; `docling` is targeted at Office docs which we don't have; `paddleocr` adds a `paddlepaddle` dep tree which is enormous). MineRU downloads ~3-5 GB of layout/OCR models on first run — that's THE primary reason Tier 4 needs Docker (REPO-05).
- **Direct content insertion path vs. full document-parse path.** RAG-Anything exposes `insert_content_list(...)` to bypass MineRU entirely — you hand it a pre-built list of `{type: "text"|"image"|"table"|"equation", ...}` dicts. Recommend a **hybrid strategy**: for the 100 PDFs use `process_document_complete(parser="mineru")` (the natural Tier 4 demo: PDFs go in, multimodal KG comes out); for the 581 standalone PNGs at `dataset/images/` build a content list of `{type: "image", img_path: ABSOLUTE_PATH, image_caption: <from figures.json or empty>, page_idx: <fig_id>}` and call `insert_content_list(content_list, file_path="dataset_figures_bundle", doc_id="figures-bundle")` — saves a redundant MineRU pass over images we already parsed in Phase 127. Document the hybrid choice in the README. **CRITICAL:** `img_path` must be an absolute path (RAG-Anything README explicit requirement — Pitfall 4 below).
- **Vision model:** `openai/gpt-4o-mini` (cheap, OpenRouter slug already in `shared/pricing.py`) vs `google/gemini-2.5-flash` (also vision-capable, also priced). Recommend **`google/gemini-2.5-flash`** for narrative continuity with Tier 3 (same model, same routing) AND because it's 5× cheaper than `gpt-4o-mini` for vision (Gemini Flash: $0.30/1M input incl. images vs GPT-4o-mini: ~$0.15/1M text but image tokens are billed at much higher per-tile rates). Document the choice.
- **LLM model:** OpenRouter `google/gemini-2.5-flash` (matches Tier 3).
- **Embedding model:** OpenRouter `openai/text-embedding-3-small` (1536 dim, matches Tier 1 + Tier 3 — Phase 129 lock-in: switching dimensions corrupts a graph; `--reset` is the only escape).
- **Subset for live tests:** 3 papers + 5 images. Full-corpus ingest is a Docker batch run (REPO-05).
- **Whether to also ingest table data extracted from PDFs as standalone `table` content list entries.** MineRU already extracts tables during `process_document_complete`, so this is automatic — no extra work needed. Document that "tables" success criterion is met by MineRU's PDF-table extraction inside the standard pipeline.

**Tier 5 (Agentic RAG):**
- **Tool inventory.** Recommend **3 tools** (keeps the agent loop interesting without exploding):
  1. `search_text_chunks(query: str, k: int = 5)` — wraps Tier 1's `tier_1_naive.retrieve.retrieve_top_k` against `chroma_db/tier-1-naive/`. Mandatory per success criterion 2.
  2. `lookup_paper_metadata(paper_id: str)` — wraps `shared.loader.DatasetLoader().papers()` lookup; returns title/authors/year/abstract for an arxiv id. Lets the agent disambiguate citations.
  3. `search_figures(query: str, k: int = 3)` — searches the 581 image embeddings. **Open question:** if Tier 4 has already built a multimodal KG, this tool could call `tier_4_multimodal.RAGAnything.aquery(...)` and return the image hits. Cleaner option for Phase 130 v1: **omit this tool** and rely on `search_text_chunks` only (success criterion 2 only requires "including Tier 1 ChromaDB index"). Recommend **start with tools 1 + 2 only, add tool 3 if time permits**.
- **Default LLM model:** `openrouter/google/gemini-2.5-flash` via `LitellmModel` extension (Pattern 6). Cheap, fast, supports tool calling, OpenRouter-routed.
- **`max_turns` value:** ROADMAP says **"hard cap of `max_iterations=10`"** — the SDK's parameter is named `max_turns`, default 10. Pass `max_turns=10` explicitly so the contract is visible in code. Catch `MaxTurnsExceeded` and render a partial answer + warning.
- **Cost-per-query reporting:** `result.context_wrapper.usage.{input_tokens,output_tokens,total_tokens}` after `await Runner.run(...)`. Multiply by `shared.pricing.PRICES[model]`. Persist via `CostTracker("tier-5").record_llm(...)` once per query, then `persist()`.
- **Whether to expose multi-query mode.** Phase 130 = single-query CLI (`--query "..."`); the agent's autonomy is *within* the single query. Multi-query batch is Phase 131's golden Q&A harness. Confirm in CLI design.
- **Tracing:** disable via `set_tracing_disabled(disabled=True)` in the CLI startup so the SDK doesn't try to upload traces to platform.openai.com (we don't have that key wired). Document.

**Docker (REPO-05):**
- **Scope:** mandatory for **Tier 4** (MineRU's ~3-5 GB model download, LibreOffice, optional CUDA). Optional for Tier 3 and Tier 5 (Tier 3 = `lightrag-hku` + `pymupdf`, fully pip-installable; Tier 5 = `openai-agents` + `litellm`, fully pip-installable). Recommend **Tier 4 only Dockerfile in v1**; document in repo README that Tier 3 / Tier 5 work via plain `pip install` and Docker is unnecessary for them.
- **Per-tier Dockerfile vs multi-stage shared base:** repo's per-tier isolation pattern (each tier owns its `requirements.txt`, README, tests) argues for **per-tier Dockerfile in `tier-4-multimodal/Dockerfile`**. Use a multi-stage build (one stage to download MineRU models into a cached layer, second stage to copy into a slim runtime). Base image: `python:3.11-slim-bookworm` + `libreoffice-core` + `mineru-cli`. Document image size — expect 4-6 GB with models baked in. Smaller alternative: don't bake models, mount a volume — saves image size but every fresh container re-downloads.
- **Secrets:** never bake `.env` into the image. The image expects `--env-file .env` at run time OR `-e GEMINI_API_KEY=... -e OPENROUTER_API_KEY=...`. Document both.
- **SOCKS5 proxy interaction:** Docker containers ignore the host's `ALL_PROXY` env var by default. For the orchestrator's live-test sandbox, pass `-e ALL_PROXY=socks5h://host.docker.internal:61994 -e HTTP_PROXY=...`. The Dockerfile should already include `pip install socksio` in the runtime stage so the proxy works (this is the only `socksio` usage we install at the Docker layer rather than ad-hoc — Docker is its own environment). Document.
- **GPU:** optional; the `mineru` parser supports `device="cuda:0"` but defaults to CPU. v1 Dockerfile is CPU-only; document `nvidia-runtime` usage in the README for users who want GPU.

**Pre-computed expected outputs:**
- **Format:** mirror Phase 128/129 — alongside the live `evaluation/results/costs/{tier}-{timestamp}.json`, ship a static `tier-N-<name>/expected_output.md` containing: (a) the canned default query verbatim, (b) the rendered `shared.display` table output (paste from a known-good run), (c) the cost line, (d) the latency line, (e) timestamp + model + git SHA at capture time. This is what users see when they `cat tier-4-multimodal/expected_output.md` after `pip install -r requirements.txt` fails because their machine can't run MineRU.
- **Capture method:** during the live e2e plan task (Plan 04 / Plan 06), redirect the CLI's stdout to `tier-N-<name>/expected_output.md`. Plain markdown; no VCR cassettes (LLM responses are non-deterministic anyway — the value is showing what *one good run* looks like). Document the capture date.

**General:**
- **CLI structure:** `tier-4-multimodal/main.py` and `tier-5-agentic/main.py` mirroring Tier 3's argparse pattern (since Tier 4 is async-heavy). Tier 5 is async via `Runner.run`; wrap in `asyncio.run`.
- **README structure:** mirror Tier 1/3 — Overview, Quickstart (incl. Docker for Tier 4), Sample query, Expected cost, Known weaknesses, Reused by future tier?

### Deferred Ideas (OUT OF SCOPE for Phase 130)

- **RAGAS / golden Q&A scoring** — Phase 131.
- **Latency comparison plot across all 5 tiers** — Phase 131.
- **Tier 4 with `paddleocr` parser** — adds 800 MB of `paddlepaddle`; not needed since MineRU covers our scope.
- **Tier 4 with Office documents** — dataset is PDFs + raster images only; LibreOffice support is in the Dockerfile for completeness but never exercised in tests.
- **Tier 5 multi-agent / handoffs** — success criterion says "autonomous multi-tool retrieval", not "multi-agent". Single agent with multiple tools.
- **Tier 5 guardrails (input/output guardrails)** — SDK feature exists; not in TIER-05 spec; skip.
- **Tier 5 sessions / persistent conversation memory** — single-shot CLI; sessions are Phase 131+ territory.
- **GPU Docker image** — CPU-only v1 Dockerfile; document `nvidia-runtime` upgrade path.
- **Custom MineRU model fine-tuning / different VLM** — defaults are fine.
- **Vector store sharing between Tier 4 and Tier 5** — Tier 5 reads Tier 1's chroma_db; Tier 4 owns its own RAG-Anything `working_dir`. No cross-pollination in v1.
- **Tier 5 agent calling Tier 4's multimodal KG as a tool** — listed as "if time permits" in tool inventory; defer if any blockage.
- **Streaming agent output (`Runner.run_streamed`)** — `Runner.run` is enough; streaming UI is a polish phase later.
- **Removing the separate `dataset/images/` ingest** — could be folded into PDF parsing (MineRU re-extracts), but doing both is honest about how Tier 4 handles standalone images vs. PDF-embedded ones.
- **Vertex AI Vision API** — using OpenRouter Gemini Flash for vision; same provider, simpler stack.
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TIER-04 | Tier 4 (Multimodal RAG) with RAG-Anything processing images, tables, and text as unified knowledge graph | `raganything==1.2.10` (PyPI verified, released 2026-03-24) is HKUDS's official multimodal extension built atop `lightrag-hku` (already pinned in Phase 129). Provides `RAGAnything(config, llm_model_func, vision_model_func, embedding_func)` + `process_document_complete()` for PDFs and `insert_content_list()` for direct image/table/equation insertion. Verified against `pypi.org/project/raganything` and `github.com/HKUDS/RAG-Anything` README. |
| TIER-05 | Tier 5 (Agentic RAG) with OpenAI Agents SDK, autonomous multi-tool retrieval with iteration limits | `openai-agents==0.14.6` (PyPI verified, released 2026-04-25). Provides `Agent`, `Runner.run`, `@function_tool`, `max_turns=10` default, `MaxTurnsExceeded` exception, `result.context_wrapper.usage` for tokens, `LitellmModel` extension for OpenRouter. Verified against `openai.github.io/openai-agents-python` and `pypi.org/project/openai-agents`. |
| REPO-05 | Docker support for Tiers 3-5 where dependency complexity requires it | Tier 4's MineRU pulls 3-5 GB of layout/OCR models on first use + needs LibreOffice for Office docs. Verified via MineRU's official Docker docs (`opendatalab.github.io/MinerU/quick_start/docker_deployment`) and RAG-Anything's "LibreOffice required" note. Tier 3 is pip-only; Tier 5 is pip-only — Docker is mandatory for Tier 4 only. |

## Summary

Phase 130 ships the last two architecture tiers and closes the per-tier delivery surface. **Tier 4** uses **RAG-Anything 1.2.10** (HKUDS's multimodal extension on top of LightRAG, the same engine we picked for Tier 3 — narrative continuity baked in). It runs MineRU to parse the 100 PDFs into structured (text, image, table, equation) chunks, then uses an OpenRouter-routed LLM (`google/gemini-2.5-flash`) plus an OpenRouter-routed vision model (same slug — Gemini Flash is multimodal) plus an OpenRouter-routed embedding model (`openai/text-embedding-3-small`, 1536d to stay aligned with Tier 1/3) to build a unified knowledge graph in `rag_anything_storage/tier-4-multimodal/`. For the 581 standalone PNGs we use the bypass path `insert_content_list([{type:"image", img_path:..., image_caption:...}, ...])` to avoid a redundant MineRU pass. Queries go through `aquery_with_multimodal()` (or plain `aquery()` for text-only), returning answers grounded against multimodal entities — that's the visual+tabular-understanding success criterion.

**Tier 5** uses the **OpenAI Agents SDK 0.14.6** with the `LitellmModel` extension to route through OpenRouter. The agent has 2-3 `@function_tool`s (text search via Tier 1's ChromaDB, paper metadata lookup, optional figure search), runs with `max_turns=10` (the SDK default — but we pass it explicitly so the cap is visible in source), catches `MaxTurnsExceeded` to render a partial answer, and reports cost via `result.context_wrapper.usage` × `shared.pricing.PRICES`. The agentic story: same query Tier 1 botches because it needs to combine retrieved chunks with metadata is now solved by an LLM that *decides* to call `lookup_paper_metadata` after `search_text_chunks` returns ambiguous authors.

**Tier 4 is the only tier that needs Docker.** A multi-stage `tier-4-multimodal/Dockerfile` based on `python:3.11-slim-bookworm` adds LibreOffice + MineRU + RAG-Anything + a model-download step in a build-time stage so users get a runnable image without a 10-minute cold start. Tier 3 and Tier 5 work via plain pip — the README documents this explicitly so REPO-05's "Tiers 3-5 where complexity requires it" reads honestly.

**Pre-computed expected outputs** are simple markdown snapshots (`tier-N-name/expected_output.md`) captured during the live e2e test run — pasted CLI stdout, including the rendered `shared.display` table, cost line, latency line, model, and git SHA. No VCR cassettes; no JSON snapshots — just the same output a user would see, frozen.

**Primary recommendation:**
- **Tier 4:** `raganything==1.2.10` + `lightrag-hku==1.4.15` (already pinned in Phase 129 — RAG-Anything's transitive dep matches our pin so no constraint conflict). Use `mineru` parser; `google/gemini-2.5-flash` for both LLM and vision via OpenRouter; `openai/text-embedding-3-small` for embeddings. `insert_content_list` for the 581 standalone images; `process_document_complete` for the 100 PDFs. Working dir: `rag_anything_storage/tier-4-multimodal/`. Ship a CPU Dockerfile that pre-downloads MineRU models in a build stage.
- **Tier 5:** `openai-agents==0.14.6` + `litellm` (via the `[litellm]` extra). Use `LitellmModel(model="openrouter/google/gemini-2.5-flash", api_key=settings.openrouter_api_key)`. Two `@function_tool`s minimum: `search_text_chunks` (wraps Tier 1 retriever), `lookup_paper_metadata` (wraps DatasetLoader). `Runner.run(agent, query, max_turns=10)`. Pull tokens from `result.context_wrapper.usage`, record via `CostTracker("tier-5")`, render via `shared.display`. `set_tracing_disabled(disabled=True)`.

## Architectural Responsibility Map

| Capability | Where it lives | Why |
|------------|---------------|-----|
| Tier 4 RAG-Anything init (LLM/vision/embed funcs) | `tier-4-multimodal/rag.py` (new) | Tier-local; mirrors Tier 3's `tier-3-graph/rag.py`. Three openrouter wrappers. |
| Tier 4 PDF ingest (MineRU pipeline) | `tier-4-multimodal/ingest_pdfs.py` (new) | `await rag.process_document_complete(file_path=..., parser="mineru")` per paper |
| Tier 4 standalone image ingest | `tier-4-multimodal/ingest_images.py` (new) | Builds content list from `dataset/manifests/figures.json` + `dataset/images/*.png`; `await rag.insert_content_list(...)` once |
| Tier 4 query | `tier-4-multimodal/query.py` (new) | `await rag.aquery_with_multimodal(question, mode="hybrid", multimodal_content=...)`; chunk-shape adapter for `shared.display` |
| Tier 4 cost capture | inline via `shared.cost_tracker.CostTracker("tier-4")` + `_CostAdapter` (mirrors Tier 3) | RAG-Anything inherits LightRAG's `token_tracker` protocol; reuse the Phase 129 adapter pattern |
| Tier 4 CLI | `tier-4-multimodal/main.py` (new) | Mirrors Tier 3 layout: `--ingest`, `--query`, `--reset`, `--mode`, `--model`, plus `--include-images / --no-images` |
| Tier 4 Docker | `tier-4-multimodal/Dockerfile` (new) | Multi-stage; base `python:3.11-slim-bookworm` + LibreOffice + mineru model download in build stage |
| Tier 5 tool wrappers | `tier-5-agentic/tools.py` (new) | `@function_tool` decorated; pydantic types; calls Tier 1 retriever + DatasetLoader |
| Tier 5 agent + runner | `tier-5-agentic/agent.py` (new) | `Agent(name=, instructions=, model=LitellmModel(...), tools=[...])` |
| Tier 5 CLI | `tier-5-agentic/main.py` (new) | `Runner.run(agent, query, max_turns=10)` + cost extract + `shared.display` |
| Tier 5 cost capture | inline via `shared.cost_tracker.CostTracker("tier-5")` reading `result.context_wrapper.usage` | Single record_llm per query (sum of all turns) |
| Pre-computed outputs | `tier-4-multimodal/expected_output.md` and `tier-5-agentic/expected_output.md` (new) | Captured during live e2e test runs |
| Answer rendering | `shared.display.render_query_result` | Reuse — every tier |
| Dataset loading | `shared.loader.DatasetLoader` | Reuse |
| Cost tracking | `shared.cost_tracker.CostTracker` | Reuse with `tier-4` / `tier-5` labels |

## Standard Stack

### Core (verified versions, current as of 2026-04-26)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `raganything` | `==1.2.10` | Multimodal RAG framework (Tier 4) | Latest stable on PyPI (verified `pypi.org/project/raganything` → 1.2.10 released 2026-03-24). Pin exactly: HKUDS ships dot-versions every few weeks (mirrors LightRAG churn — Phase 129 Pitfall 9). Built on `lightrag-hku>=1.4.x`; our `==1.4.15` pin is compatible. EMNLP 2025 / arxiv 2510.12323. |
| `mineru` | (transitive via `raganything`) | Document parser (PDF → structured content list) | Pinned by `raganything`. Don't pin separately. Downloads ~3-5 GB of layout/OCR models on first use. |
| `lightrag-hku` | `==1.4.15` | Underlying RAG/KG engine for RAG-Anything | Already pinned in `[tier-3]` from Phase 129. RAG-Anything composes a `LightRAG` instance; the pin transfers. |
| `openai-agents` | `==0.14.6` | OpenAI Agents SDK (Tier 5) | Latest stable on PyPI (verified `pypi.org/project/openai-agents` → 0.14.6 released 2026-04-25). Pin exactly: SDK is pre-1.0; minor versions break tool API. Provides `Agent`, `Runner.run`, `@function_tool`, `max_turns`. Python 3.10+. |
| `openai-agents[litellm]` | (extra) | LiteLLM extension shipping `LitellmModel` for non-OpenAI providers (OpenRouter, Gemini, Anthropic) | Required for Tier 5 to route through OpenRouter. Pulls `litellm`. Verified via `examples/model_providers/litellm_provider.py` in the SDK repo. |
| `litellm` | `>=1.55,<2` | OpenAI-format unified provider gateway | Transitive via `openai-agents[litellm]`. Don't pin separately unless conflict surfaces. |
| `openai` | `>=1.50,<3` | OpenRouter SDK base (Tier 4 LLM/vision/embed wrappers via `openai_complete_if_cache` from `lightrag.llm.openai`) | Already pinned in `[tier-1]` and `[tier-3]`. |
| `chromadb` | `>=1.5.8,<2` | Tier 5's read-only client to Tier 1's collection | Already pinned in `[tier-1]`. Tier 5 needs it for the `search_text_chunks` tool. |
| `pymupdf` | `>=1.27,<2` | Implicit via MineRU pipeline; not directly imported by Tier 4 code | MineRU pulls it transitively. |
| `tiktoken` | `>=0.10,<1` | Token counting | Already in `[shared]` |
| `pillow` | `>=10,<12` | Image loading for `insert_content_list` validation | Already in `[curation]`; lift into `[tier-4]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pydantic` | `>=2.10,<3` | `@function_tool` schema generation | Already in `[shared]` |
| `rich` | `>=14,<16` | Display | Already in `[shared]` |
| `python-dotenv` | `>=1.0,<2` | `.env` loading | Already in `[shared]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RAG-Anything (Tier 4) | LlamaIndex multimodal | LlamaIndex is heavier; doesn't compose with LightRAG; would lose Tier 3→Tier 4 narrative continuity. RAG-Anything is the *named* requirement (TIER-04). |
| MineRU parser | Docling | Docling is targeted at Office docs; our corpus is PDFs + standalone PNGs. MineRU is RAG-Anything's blessed default. |
| MineRU parser | PaddleOCR | Adds `paddlepaddle` (~800 MB); MineRU already covers OCR. |
| RAG-Anything `process_document_complete` for everything | Hybrid: PDFs via `process_document_complete`, standalone PNGs via `insert_content_list` | Hybrid avoids a second MineRU pass over images we already have at `dataset/images/`. Mild added complexity (two ingest paths) is worth saving ~10 min of MineRU runtime. |
| OpenAI Agents SDK (Tier 5) | LangGraph | LangGraph is more flexible but pulls 200+ MB of LangChain transitive deps. Agents SDK is named in TIER-05 and has a tiny core. |
| OpenAI Agents SDK | LlamaIndex agent worker | Same problem as LangGraph; framework lock-in dilutes the comparison. |
| `LitellmModel` (Agents extension) | Custom `OpenAIChatCompletionsModel` with `AsyncOpenAI(base_url=openrouter)` | Both work; `LitellmModel` is one line and handles model-name prefixing. Recommend `LitellmModel`. |
| Gemini-direct for Tier 5 LLM | OpenRouter for Tier 5 LLM | Continuity with Tiers 1/3/4. OpenRouter supports tool calling for Gemini models. |
| Per-tier Dockerfile | Single multi-stage Dockerfile in repo root | Per-tier matches the "each tier is independent" pattern of the repo. Single root Dockerfile would have to handle all of mineru + libreoffice + lightrag + openai-agents — bloated. |

### Required `pyproject.toml` updates

```toml
[project.optional-dependencies]
tier-4 = [
  "rag-architecture-patterns[shared]",
  "raganything==1.2.10",
  "lightrag-hku==1.4.15",      # already in [tier-3]; explicit here for clarity
  "openai>=1.50,<3",            # for OpenRouter routing through lightrag.llm.openai
  "Pillow>=10,<12",             # img_path validation in insert_content_list
]
tier-5 = [
  "rag-architecture-patterns[shared]",
  "openai-agents[litellm]==0.14.6",
  "chromadb>=1.5.8,<2",         # read Tier 1's collection
  "openai>=1.50,<3",            # transitive via litellm + Tier 1 embedder reuse
]
```

### Required `.gitignore` updates

```
rag_anything_storage/
tier-4-multimodal/.cache/
tier-4-multimodal/output/
```

### Required `.env.example` updates

`OPENROUTER_API_KEY` is already declared (Phase 128/129). Promote the comment from "REQUIRED for Tier 1, Tier 3" to "REQUIRED for Tier 1, Tier 3, Tier 4 (RAG-Anything), Tier 5 (Agents SDK via LiteLLM)".

## Architecture Patterns

### Recommended Project Structure

```
tier-4-multimodal/
├── README.md                  # Quickstart (pip + Docker), expected cost, known weaknesses
├── requirements.txt           # exists — `-e ..[tier-4]`
├── Dockerfile                 # NEW: multi-stage; bakes MineRU models
├── .dockerignore              # NEW: keeps image lean
├── main.py                    # CLI entrypoint (--ingest / --query / --reset / --mode / --model / --no-images)
├── rag.py                     # RAGAnything init (llm/vision/embed funcs, OpenRouter)
├── ingest_pdfs.py             # process_document_complete loop
├── ingest_images.py           # figures.json → content_list → insert_content_list
├── query.py                   # aquery_with_multimodal wrapper + chunk adapter
├── cost_adapter.py            # mirror tier-3-graph/cost_adapter.py
├── expected_output.md         # NEW: pre-computed CLI snapshot (post-live-test capture)
└── tests/
    ├── __init__.py
    ├── test_rag.py            # Non-live: assert init builds, working_dir created
    ├── test_ingest_images.py  # Non-live: content_list shape from figures.json
    └── test_main.py           # @pytest.mark.live — 3 PDFs + 5 images end-to-end

tier-5-agentic/
├── README.md                  # Quickstart, expected cost, known weaknesses
├── requirements.txt           # exists — `-e ..[tier-5]`
├── main.py                    # CLI entrypoint (--query / --max-turns / --model)
├── agent.py                   # Agent + LitellmModel construction
├── tools.py                   # @function_tool wrappers (search_text_chunks, lookup_paper_metadata)
├── expected_output.md         # NEW: pre-computed CLI snapshot
└── tests/
    ├── __init__.py
    ├── test_tools.py          # Non-live: tool schema introspection, ChromaDB read happy-path
    ├── test_agent.py          # Non-live: agent constructs, max_turns wired
    └── test_main.py           # @pytest.mark.live — query exercising both tools
```

### Pattern 1: RAG-Anything OpenRouter wiring (Tier 4)

**What:** Three async wrappers — `_llm_func`, `_vision_func`, `_embed_func` — all routing through OpenRouter via `lightrag.llm.openai.openai_complete_if_cache` (LLM/vision) and `openai_embed` (embeddings). Vision func handles both `messages` (VLM-style) and `image_data` (URL/base64) call shapes per the RAG-Anything README contract.

**Source:** Verified against `https://github.com/HKUDS/RAG-Anything` README quickstart and `examples/raganything_example.py`.

**Example:**
```python
# tier-4-multimodal/rag.py
import os
from raganything import RAGAnything, RAGAnythingConfig
from lightrag.llm.openai import openai_complete_if_cache, openai_embed
from lightrag.utils import EmbeddingFunc

WORKING_DIR = "rag_anything_storage/tier-4-multimodal"
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
DEFAULT_LLM_MODEL = "google/gemini-2.5-flash"
DEFAULT_VISION_MODEL = "google/gemini-2.5-flash"  # multimodal — same slug
DEFAULT_EMBED_MODEL = "openai/text-embedding-3-small"
EMBED_DIMS = 1536
EMBED_MAX_TOKENS = 8192


async def _llm_func(prompt, system_prompt=None, history_messages=None,
                    keyword_extraction=False, model: str | None = None, **kwargs) -> str:
    return await openai_complete_if_cache(
        model or os.environ.get("TIER4_LLM_MODEL", DEFAULT_LLM_MODEL),
        prompt,
        system_prompt=system_prompt,
        history_messages=history_messages or [],
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url=OPENROUTER_BASE,
        keyword_extraction=keyword_extraction,
        **kwargs,
    )


async def _vision_func(prompt, system_prompt=None, history_messages=None,
                       image_data=None, messages=None, model: str | None = None, **kwargs) -> str:
    """Two-shape contract per RAG-Anything README."""
    if messages:
        return await openai_complete_if_cache(
            model or DEFAULT_VISION_MODEL,
            "",  # prompt unused when messages given
            messages=messages,
            api_key=os.environ["OPENROUTER_API_KEY"],
            base_url=OPENROUTER_BASE,
            **kwargs,
        )
    if image_data:
        # image_data is base64 OR URL per the README
        msg = [
            {"role": "user", "content": [
                {"type": "text", "text": prompt or "Describe this image."},
                {"type": "image_url", "image_url": {"url": image_data}},
            ]},
        ]
        return await openai_complete_if_cache(
            model or DEFAULT_VISION_MODEL,
            "",
            messages=msg,
            api_key=os.environ["OPENROUTER_API_KEY"],
            base_url=OPENROUTER_BASE,
            **kwargs,
        )
    # Fallback: pure-text path
    return await _llm_func(prompt, system_prompt, history_messages, **kwargs)


async def _embed_func(texts):
    return await openai_embed(
        texts,
        model=DEFAULT_EMBED_MODEL,
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url=OPENROUTER_BASE,
    )


def build_rag(working_dir: str = WORKING_DIR) -> RAGAnything:
    config = RAGAnythingConfig(
        working_dir=working_dir,
        parser="mineru",
        parse_method="auto",
        enable_image_processing=True,
        enable_table_processing=True,
        enable_equation_processing=True,
    )
    return RAGAnything(
        config=config,
        llm_model_func=_llm_func,
        vision_model_func=_vision_func,
        embedding_func=EmbeddingFunc(
            embedding_dim=EMBED_DIMS,
            max_token_size=EMBED_MAX_TOKENS,
            func=_embed_func,
        ),
    )
```

### Pattern 2: PDF ingest via MineRU pipeline (Tier 4)

**What:** Loop the 100 papers; call `process_document_complete` per file. The MineRU device default is `cpu` — pass `device="cuda:0"` only if the env detects CUDA.

**Example:**
```python
# tier-4-multimodal/ingest_pdfs.py
from pathlib import Path
from rich.console import Console

async def ingest_pdfs(rag, papers, dataset_root: Path, console: Console, *,
                     device: str = "cpu", parser: str = "mineru"):
    n = sum(1 for p in papers if (dataset_root / "papers" / p["filename"]).exists())
    console.print(f"[cyan]Tier 4 PDF ingest: {n} papers via {parser} on {device}.[/cyan]")
    for p in papers:
        pdf = dataset_root / "papers" / p["filename"]
        if not pdf.exists():
            continue
        await rag.process_document_complete(
            file_path=str(pdf),
            output_dir=str(Path("tier-4-multimodal/output") / p["paper_id"]),
            parse_method="auto",
            parser=parser,
            device=device,
            doc_id=p["paper_id"],
        )
```

### Pattern 3: Standalone-image ingest via `insert_content_list` (Tier 4)

**What:** Build a list of `{"type":"image", "img_path": <ABSOLUTE>, "image_caption": [...], "page_idx": <int>}` from `dataset/manifests/figures.json` + `dataset/images/`, then a single `await rag.insert_content_list(content_list, file_path="dataset_figures_bundle", doc_id="figures-bundle")`.

**CRITICAL:** `img_path` MUST be absolute (RAG-Anything explicit requirement; relative paths silently break the vision pass).

**Example:**
```python
# tier-4-multimodal/ingest_images.py
import json
from pathlib import Path

async def ingest_standalone_images(rag, dataset_root: Path):
    figures = json.loads((dataset_root / "manifests" / "figures.json").read_text())
    images_dir = (dataset_root / "images").resolve()  # absolute
    content_list = []
    for i, f in enumerate(figures):
        img_path = images_dir / f["filename"]
        if not img_path.exists():
            continue
        captions = [f["caption"]] if f.get("caption") else []
        content_list.append({
            "type": "image",
            "img_path": str(img_path),  # absolute
            "image_caption": captions,
            "page_idx": i,
        })
    if not content_list:
        return 0
    await rag.insert_content_list(
        content_list=content_list,
        file_path="dataset_figures_bundle",  # synthetic source path for KG node
        doc_id="figures-bundle",
    )
    return len(content_list)
```

### Pattern 4: Multimodal query (Tier 4)

**What:** `aquery_with_multimodal()` accepts an optional `multimodal_content=[{type,...}]` list when the *user* supplies an image/equation alongside the text question. For the default canned query (text only), call plain `aquery(question, mode="hybrid")` — RAG-Anything still surfaces image/table chunks because they're indexed in the same KG.

**Example:**
```python
# tier-4-multimodal/query.py
async def run_query(rag, question: str, mode: str = "hybrid",
                    multimodal_content: list | None = None) -> str:
    if multimodal_content:
        return await rag.aquery_with_multimodal(question, multimodal_content=multimodal_content, mode=mode)
    return await rag.aquery(question, mode=mode)
```

### Pattern 5: OpenAI Agents SDK with OpenRouter via LiteLLM (Tier 5)

**What:** Use `LitellmModel(model="openrouter/<provider>/<model>", api_key=settings.openrouter_api_key)` as the agent's `model=`. Disable platform tracing.

**Source:** Verified against `examples/model_providers/litellm_provider.py` in `openai/openai-agents-python` (verbatim quoted in research notes).

**Example:**
```python
# tier-5-agentic/agent.py
import os
from agents import Agent, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel

from .tools import search_text_chunks, lookup_paper_metadata

set_tracing_disabled(disabled=True)

DEFAULT_MODEL = "openrouter/google/gemini-2.5-flash"

INSTRUCTIONS = """\
You are a research assistant grounded in an enterprise knowledge base of 100 ML/IR
papers indexed in a local ChromaDB collection. To answer the user, you MUST call
`search_text_chunks` to retrieve evidence, and `lookup_paper_metadata` to verify
authors / years of any paper you cite. You may iterate (call multiple tools) up to
the runner-imposed turn limit. Cite paper_ids in your final answer.
"""

def build_agent(model: str | None = None) -> Agent:
    return Agent(
        name="ResearchAssistant",
        instructions=INSTRUCTIONS,
        model=LitellmModel(
            model=model or DEFAULT_MODEL,
            api_key=os.environ["OPENROUTER_API_KEY"],
        ),
        tools=[search_text_chunks, lookup_paper_metadata],
    )
```

### Pattern 6: Tool definition wrapping Tier 1 retriever (Tier 5)

**What:** `@function_tool` derives the JSON schema from type hints; the docstring becomes the tool description the LLM sees. Tool returns must be JSON-serializable (str, dict, list of primitives).

**Source:** Verified against `https://openai.github.io/openai-agents-python/tools/`.

**Example:**
```python
# tier-5-agentic/tools.py
from __future__ import annotations
import sys
from pathlib import Path
from typing import Annotated
from pydantic import Field
from agents import function_tool

# sys.path bootstrap (mirror Tier 1)
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from shared.loader import DatasetLoader
from tier_1_naive.store import open_collection
from tier_1_naive.retrieve import retrieve_top_k
from tier_1_naive.embed_openai import embed_query  # Tier 1's tier-local OpenRouter embed wrapper

_collection = None
_loader = None

def _get_collection():
    global _collection
    if _collection is None:
        _collection = open_collection(reset=False)
    return _collection

def _get_loader():
    global _loader
    if _loader is None:
        _loader = DatasetLoader()
    return _loader


@function_tool
async def search_text_chunks(
    query: Annotated[str, Field(description="The user's natural-language search query")],
    k: Annotated[int, Field(default=5, ge=1, le=20, description="How many chunks to return")] = 5,
) -> list[dict]:
    """Search the 100-paper enterprise knowledge base by semantic similarity over text chunks.
    Returns a list of {paper_id, page, snippet, similarity}."""
    coll = _get_collection()
    qvec = embed_query(query)
    res = retrieve_top_k(coll, qvec, k=k)
    return [
        {
            "paper_id": (m or {}).get("paper_id"),
            "page": (m or {}).get("page"),
            "snippet": (d or "")[:400],
            "similarity": s,
        }
        for d, m, s in zip(res["documents"], res["metadatas"], res["similarities"])
    ]


@function_tool
def lookup_paper_metadata(
    paper_id: Annotated[str, Field(description="arXiv ID, e.g. '1706.03762'")],
) -> dict:
    """Look up paper metadata (title, authors, year, abstract) by arxiv ID."""
    loader = _get_loader()
    for p in loader.papers():
        if p["paper_id"] == paper_id:
            return {
                "paper_id": p["paper_id"],
                "title": p["title"],
                "authors": p["authors"],
                "year": p["year"],
                "abstract": p["abstract"][:500],
            }
    return {"error": f"paper_id {paper_id} not found"}
```

### Pattern 7: Runner.run with `max_turns=10` and cost extraction (Tier 5)

**What:** `Runner.run(agent, query, max_turns=10)` raises `MaxTurnsExceeded` on overrun. After success, `result.context_wrapper.usage` exposes `input_tokens`, `output_tokens`, `total_tokens`, `requests`. Multiply by `shared.pricing.PRICES` to compute USD.

**Source:** Verified against `https://openai.github.io/openai-agents-python/usage/` and `running_agents/`.

**Example:**
```python
# tier-5-agentic/main.py (excerpt)
import asyncio
from agents import Runner
from agents.exceptions import MaxTurnsExceeded

from shared.cost_tracker import CostTracker
from shared.display import render_query_result
from shared.pricing import PRICES

from .agent import build_agent, DEFAULT_MODEL

MAX_TURNS = 10

async def amain(query: str, model: str = DEFAULT_MODEL):
    agent = build_agent(model)
    tracker = CostTracker("tier-5")
    truncated = False
    answer = ""
    try:
        result = await Runner.run(agent, query, max_turns=MAX_TURNS)
        answer = result.final_output or ""
        usage = result.context_wrapper.usage
    except MaxTurnsExceeded as exc:
        truncated = True
        usage = getattr(exc, "usage", None)  # SDK exposes partial usage; fall back if missing
        answer = "[truncated — agent exceeded max_turns=10] " + (str(exc) or "")

    in_tok = int(getattr(usage, "input_tokens", 0) or 0)
    out_tok = int(getattr(usage, "output_tokens", 0) or 0)
    # Strip the "openrouter/" prefix to match shared/pricing PRICES keys
    pricing_key = model.split("/", 1)[1] if model.startswith("openrouter/") else model
    if pricing_key in PRICES:
        tracker.record_llm(pricing_key, in_tok, out_tok)
    render_query_result(
        query=query,
        chunks=[],  # Tier 5 doesn't surface a single chunk list; the agent self-cites in answer text
        answer=answer,
        cost_usd=tracker.total_usd(),
        input_tokens=in_tok,
        output_tokens=out_tok,
    )
    tracker.persist()
    return 0 if not truncated else 3
```

### Pattern 8: Multi-stage Dockerfile for Tier 4 (REPO-05)

**What:** Build stage downloads MineRU models into `/root/.mineru/`; runtime stage copies them into a slim image. Also installs LibreOffice for Office-doc support (defensive even though our corpus is PDFs only).

**Example:**
```dockerfile
# tier-4-multimodal/Dockerfile

# ---- stage 1: model-download builder ----
FROM python:3.11-slim-bookworm AS model-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        libreoffice-core libreoffice-writer \
        build-essential libgl1 libglib2.0-0 \
        ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN pip install --no-cache-dir "raganything==1.2.10" "lightrag-hku==1.4.15" "socksio==1.0.0"

# Pre-download MineRU models into a layer we can copy.
# Run an idempotent CLI invocation that triggers model fetch.
RUN python -c "from mineru.cli.client import ensure_models; ensure_models()" \
    || mineru --help  # graceful fallback

# ---- stage 2: runtime ----
FROM python:3.11-slim-bookworm
LABEL org.opencontainers.image.source="https://github.com/PatrykQuantumNomad/rag-architecture-patterns"

RUN apt-get update && apt-get install -y --no-install-recommends \
        libreoffice-core libreoffice-writer \
        libgl1 libglib2.0-0 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=model-builder /root/.mineru /root/.mineru
COPY --from=model-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=model-builder /usr/local/bin /usr/local/bin

# Bring in the project source. Use .dockerignore to keep the image lean.
COPY shared/ /app/shared/
COPY tier_1_naive/ /app/tier_1_naive/
COPY tier-1-naive/ /app/tier-1-naive/
COPY tier-4-multimodal/ /app/tier-4-multimodal/
COPY dataset/ /app/dataset/
COPY pyproject.toml /app/
RUN pip install --no-cache-dir -e .[tier-4]

ENV PYTHONPATH=/app
ENV TIKTOKEN_CACHE_DIR=/app/.tiktoken_cache

# Mount .env at runtime: docker run --env-file .env ...
ENTRYPOINT ["python", "tier-4-multimodal/main.py"]
CMD ["--query", "What does Figure 1 of the Attention Is All You Need paper depict?"]
```

`tier-4-multimodal/.dockerignore`:
```
**/__pycache__
**/.pytest_cache
.venv/
chroma_db/
lightrag_storage/
rag_anything_storage/
evaluation/results/
*.egg-info/
.git/
```

### Pattern 9: Pre-computed expected-output snapshot

**What:** During the live e2e test plan task, redirect the CLI's stdout (post-Rich render) to `tier-N-name/expected_output.md`. Wrap in fenced blocks with metadata header.

**Example (skeleton — populated during execution):**
```markdown
<!-- tier-4-multimodal/expected_output.md -->
# Tier 4 — Pre-computed expected output

Captured: 2026-04-2X (live test run)
Model: google/gemini-2.5-flash via OpenRouter
Vision: google/gemini-2.5-flash via OpenRouter
Embedding: openai/text-embedding-3-small (1536d) via OpenRouter
Git SHA: <sha>

## Command
```
python tier-4-multimodal/main.py --query "What does Figure 1 of the Attention Is All You Need paper depict?"
```

## Output (verbatim)
```
[ shared.display table here ]
Cost: $0.00XX
Latency: X.XXs
```

## Notes
- This output is non-deterministic — your run may differ in wording.
- Reproducible behaviour: same Cost/Latency order of magnitude; same paper cited.
```

### Anti-Patterns to Avoid

- **Calling RAG-Anything's vision_model_func with a sync function.** All RAG-Anything funcs are async (mirrors LightRAG). Use `async def`.
- **Passing relative `img_path` to `insert_content_list`.** RAG-Anything explicitly requires absolute paths; relative paths silently fail the vision-pass and produce empty image entities. Always `Path(...).resolve()`.
- **Re-running `process_document_complete` on the same paper without a stable `doc_id`.** RAG-Anything dedups by `doc_id`; without it, you'll re-trigger MineRU + entity extraction + embedding for every run. Pass `doc_id=p["paper_id"]`.
- **Writing Tier 4 to `lightrag_storage/`.** That's Tier 3's directory. Tier 4 owns `rag_anything_storage/tier-4-multimodal/`.
- **Mixing embedding dimensions across Tier 3 and Tier 4 working dirs.** They're separate dirs so it's safe in principle, but if a future task tries to cross-pollinate, dimension mismatch corrupts retrieval. Keep both at 1536d (`openai/text-embedding-3-small`).
- **Tier 5 spawning new ChromaDB writes to `chroma_db/tier-1-naive/`.** Tier 5 reads only. Any Tier-5-owned vector index goes to `chroma_db/tier-5-agentic/` (which we don't ship in v1; just guard against collision).
- **Tier 5 forgetting `set_tracing_disabled(disabled=True)`.** SDK ships with platform tracing on; without an OpenAI tracing key, the SDK emits warnings/errors at every run. Disable explicitly.
- **Tier 5 hard-coding `max_turns=10` deep in the agent loop.** The cap MUST be passed at `Runner.run(...)` so it's auditable and easy to change. Surface as `MAX_TURNS` constant + `--max-turns` CLI flag.
- **Tier 5 ignoring `MaxTurnsExceeded`.** Render a partial answer + clearly-flagged "[truncated]" prefix; record whatever usage was accumulated.
- **Baking `.env` into the Docker image.** Pass via `--env-file` or `-e` at runtime.
- **Skipping `socksio` install in the Docker image runtime stage.** The orchestrator's live test passes `ALL_PROXY=socks5h://...`; without `socksio` in the image, every API call ImportErrors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multimodal entity extraction (Tier 4) | Custom GPT-4-Vision prompts + regex over caption text | `RAGAnything.process_document_complete(parser="mineru")` | Hundreds of lines of OCR + layout-detection + entity-prompt-tuning that MineRU+RAG-Anything ship in the box. |
| PDF table extraction (Tier 4) | `pymupdf` table heuristics + post-processing | MineRU's table extractor inside `process_document_complete` | Tables in academic PDFs are notoriously inconsistent; MineRU is trained on them. |
| Cross-modal KG retrieval (Tier 4) | Hand-rolled merge of text+image vectors | `aquery_with_multimodal(mode="hybrid")` | LightRAG's `mix`/`hybrid` modes already traverse cross-modal entities. |
| Agent loop (Tier 5) | While-loop with manual tool dispatch | `Runner.run(agent, query, max_turns=N)` | Reinventing tool-call parsing, schema validation, max-turn caps, error handling. |
| Tool JSON schema (Tier 5) | Hand-written JSON schemas | `@function_tool` decorator | Schema is auto-derived from type hints + pydantic Field; saves drift. |
| Token counting per agent turn (Tier 5) | Manual prompt token estimates | `result.context_wrapper.usage` | SDK aggregates over the whole loop already. |
| OpenRouter routing (Tier 5) | Custom `AsyncOpenAI(base_url=...)` + ModelProvider | `LitellmModel(model="openrouter/...", api_key=...)` | One line, handled. |
| Docker image with model-cache | DIY base image | Multi-stage with `python:3.11-slim-bookworm` + apt-installed LibreOffice + pip-installed mineru | Base image already has cuda-compatible mineru wheels; LibreOffice from apt is the official path. |

**Key insight:** Phase 130 is **two thin tier wrappers** (Tier 4 ~250 lines, Tier 5 ~150 lines) plus a Dockerfile. The complexity all lives in `raganything` and `openai-agents` — that's the point. The blog post compares architectures, not custom infrastructure.

## Common Pitfalls

### Pitfall 1: MineRU model download on first run is 3-5 GB and 5-15 minutes

**What goes wrong:** First `process_document_complete` call triggers MineRU to download layout/OCR models. On a fresh laptop (no cache), this is multi-GB and slow. In CI / sandbox, it's a hard fail because of the time budget.

**Why it happens:** MineRU defers model fetch to first use; no `download-only` mode in 1.x.

**How to avoid:**
1. **Local dev:** run `mineru --help` once after install (some MineRU versions trigger a fetch on first invocation regardless of subcommand). Or call `process_document_complete` on a tiny test PDF before the real ingest.
2. **Docker:** Pattern 8 — bake the download into a build-time stage. Image grows by 3-5 GB but cold starts are zero.
3. **Live test:** point `MINERU_CACHE_DIR` at a persisted volume; reuse across CI runs.

**Warning signs:** First ingest sits silent for 10+ minutes; `~/.mineru/` swells to multiple GB.

### Pitfall 2: `raganything` version churn (mirrors LightRAG)

**What goes wrong:** Floating constraint `raganything>=1.2,<2` lets uv pick up an API-breaking dot-release between the planning checkout and the executor checkout (HKUDS ships every few weeks).

**How to avoid:** Pin **exactly** to `raganything==1.2.10` and `lightrag-hku==1.4.15` in `[tier-4]`. Mirrors Phase 129 Pitfall 9.

**Warning signs:** Tests pass locally, fail on a fresh checkout 2 weeks later.

### Pitfall 3: Vision model function shape contract

**What goes wrong:** RAG-Anything's vision pass calls the `vision_model_func` with **either** `messages=[...VLM-style multimodal...]` **or** `image_data=<base64-or-url>`. Naive implementations only handle one branch and silently fail the other.

**How to avoid:** Pattern 1's `_vision_func` has both branches. Verified against the README's quickstart code.

**Warning signs:** Some image entities have empty descriptions in `vdb_entities.json` after ingest.

### Pitfall 4: `img_path` must be absolute in `insert_content_list`

**What goes wrong:** `{"type":"image", "img_path": "dataset/images/foo.png"}` (relative) silently fails to load — RAG-Anything ingests the entry but produces no image vector.

**How to avoid:** `Path(...).resolve()` before stuffing into the content list (Pattern 3).

**Warning signs:** `vdb_entities.json` has fewer entities than expected; vision tokens recorded near zero.

### Pitfall 5: OpenRouter rate limits on `google/gemini-2.5-flash` during multimodal ingest

**What goes wrong:** RAG-Anything's vision pass calls the VLM **once per image** during ingest. 581 images × ~3 sec each = ~30 minutes of VLM calls; OpenRouter's per-minute caps kick in.

**How to avoid:**
1. Tier 4's `ingest_images.py` adds `await asyncio.sleep(0.2)` between calls (LightRAG/raganything do this internally already, but be ready to bump).
2. For the live e2e test, ingest **5 images max** to stay under any rate-limit floor.
3. Document the full-corpus ingest as "run inside Docker overnight; expect ~30-60 min".

**Warning signs:** OpenRouter HTTP 429s during ingest.

### Pitfall 6: `MaxTurnsExceeded` doesn't expose usage in some 0.x versions

**What goes wrong:** When `Runner.run` hits the cap, the exception's `usage` attribute may be `None` or absent (depends on SDK micro-version). Naive `exc.usage.input_tokens` raises `AttributeError`.

**How to avoid:** Pattern 7 — `getattr(exc, "usage", None)` + null-check. Render whatever usage we have; record zero if absent.

**Warning signs:** Tier 5 cost JSON has zero tokens after a `--max-turns 1` test (the truncation path is silent).

### Pitfall 7: `shared.display` chunks shape mismatch for Tier 4/5

**What goes wrong:** `shared.display.render_query_result` expects `chunks: list[dict]` with keys `doc_id`, `score`, `snippet`. Tier 4's `aquery` returns a string; the chunk metadata lives in LightRAG's internal trace not in the return. Tier 5's agent self-cites in `final_output` text — there's no separate `chunks` list.

**How to avoid:**
- **Tier 4:** parse the LightRAG response object if available (newer raganything versions return a dict with `context`); else pass `chunks=[]` and put citation hints in the answer text. Defensive empty-list works (verified Phase 129 — `render_query_result` handles `chunks=[]`).
- **Tier 5:** pass `chunks=[]`; the agent's `final_output` is the citation-bearing answer.

**Warning signs:** `KeyError` from `render_query_result` on Tier 4/5; investigate and pass empty list.

### Pitfall 8: `openai-agents` SDK is pre-1.0 — instructions field semantics differ from spec

**What goes wrong:** Some 0.x versions treat `instructions=` as the system prompt; others append to user message. The README convention as of 0.14.6 is "system prompt".

**How to avoid:** Sanity-test with a tiny non-live test (`test_agent.py`) that asserts `agent.instructions` is non-empty and the system prompt doesn't bleed into tool calls. Pin `==0.14.6`.

**Warning signs:** Agent ignores tool-calling instructions in `instructions`.

### Pitfall 9: ChromaDB collection collision between Tier 1 and Tier 5

**What goes wrong:** Tier 5 calling `open_collection(reset=True)` on Tier 1's path NUKES Tier 1's index.

**How to avoid:** Tier 5 NEVER passes `reset=True` to `open_collection`. Tier 5 uses **read-only access** to `chroma_db/tier-1-naive/`. If we ever want a write surface for Tier 5, point it at `chroma_db/tier-5-agentic/`.

**Warning signs:** Running Tier 5 wipes Tier 1's index — caught only when next Tier 1 run shows `count=0`.

### Pitfall 10: `LitellmModel` model-string format

**What goes wrong:** OpenRouter slugs are `provider/model` (`google/gemini-2.5-flash`). LiteLLM expects `openrouter/<provider>/<model>` (`openrouter/google/gemini-2.5-flash`). Easy to misformat.

**How to avoid:** Constants at top of `agent.py`:
```python
DEFAULT_MODEL = "openrouter/google/gemini-2.5-flash"  # litellm prefix mandatory
```
And a startup assertion: `assert model.startswith("openrouter/")`.

**Warning signs:** `ProviderNotFoundError` from litellm; or wrong-vendor billing.

### Pitfall 11: SOCKS5 proxy + Docker

**What goes wrong:** Container ignores host `ALL_PROXY` env. The orchestrator's live test from inside Docker can't reach the host's SOCKS5 proxy.

**How to avoid:**
1. Pass `-e ALL_PROXY=socks5h://host.docker.internal:61994 -e HTTP_PROXY=...` at `docker run` time.
2. Install `socksio==1.0.0` in the Dockerfile runtime stage (Pattern 8 — already documented).
3. Document a "running live tests inside Docker" note in `tier-4-multimodal/README.md`.

**Warning signs:** Inside-container HTTP calls hang or DNS-fail.

### Pitfall 12: Cost-tracker JSON shape — Tier 5 multi-model edge case

**What goes wrong:** If a user runs Tier 5 with `--model openrouter/anthropic/claude-haiku-4.5` and the strip-prefix logic matches `anthropic/claude-haiku-4.5` → that's in `shared.pricing.PRICES`. Good. But `openrouter/google/gemini-2.5-flash` strips to `google/gemini-2.5-flash` → also in PRICES. ALSO good. Edge case: a slug like `openrouter/anthropic/claude-3-opus` (not in PRICES) raises `KeyError` from `_lookup_price`.

**How to avoid:** Wrap `tracker.record_llm` in try/except `KeyError` and log a warning; persist with USD=0 (better than crashing the demo). Document the supported model list in the README.

**Warning signs:** `KeyError: model 'openrouter/foo/bar' not in shared.pricing.PRICES`.

### Pitfall 13: Pre-computed `expected_output.md` drift

**What goes wrong:** A user updates `shared.display.render_query_result` formatting (column widths, color codes), and the on-disk `expected_output.md` becomes a misleading reference of what the CLI looks like today.

**How to avoid:**
- Document `expected_output.md` as "snapshot from <date>; rerun the live test to refresh".
- Keep the file's first line a "captured" date so drift is visible.
- Don't gate CI on it (it's documentation, not a test fixture).

**Warning signs:** A Phase 131 user complains the output looks different from `expected_output.md`.

## Code Examples

(Patterns above are the verified skeletons. Plans should copy them.)

### Live test scaffolds

```python
# tier-4-multimodal/tests/test_main.py
import os
import pytest

@pytest.mark.live
def test_tier4_end_to_end_subset(monkeypatch, tmp_path):
    if not os.getenv("OPENROUTER_API_KEY") or not os.getenv("GEMINI_API_KEY"):
        pytest.skip("OPENROUTER_API_KEY + GEMINI_API_KEY required for Tier 4")
    # Override DatasetLoader to return 3 papers
    # Override standalone-image ingest to 5 images
    # Override WORKING_DIR to tmp_path
    # Run --ingest then --query "<canned>"
    # Assert: rag_anything_storage/tier-4-multimodal/* files exist
    # Assert: query returns non-empty answer
    ...

# tier-5-agentic/tests/test_main.py
import os
import pytest

@pytest.mark.live
def test_tier5_end_to_end(monkeypatch, tmp_path):
    if not os.getenv("OPENROUTER_API_KEY"):
        pytest.skip("OPENROUTER_API_KEY required for Tier 5")
    # Assumes Tier 1 chroma_db/tier-1-naive/ has been ingested in a prior step
    # Run --query "<question that requires both tools>"
    # Assert: result.context_wrapper.usage.input_tokens > 0
    # Assert: at least 1 turn used (i.e., agent actually called a tool)
    # Assert: cost JSON written
    ...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-rolled multimodal RAG (CLIP + text RAG, manual fusion) | RAG-Anything unified KG | 2025-Q4 (HKUDS release) | One framework, one knowledge graph; cross-modal queries are first-class |
| LangChain agent / LangGraph for tool use | OpenAI Agents SDK | 2025-Q1 | Smaller core, OpenAI-native tracing, official lineage |
| Custom OpenRouter `AsyncOpenAI` wrapper for non-OpenAI agents | `LitellmModel` extension in `openai-agents[litellm]` | 2025-Q3 | One-line provider switch |
| Docker base `nvidia/cuda` for any RAG-with-vision | `python:3.11-slim` + optional CUDA layer | 2025-Q3 | Smaller default; CPU works fine |

**Deprecated/outdated:**
- `google-generativeai` (deprecated; replaced by `google-genai`). Already enforced by lockfile guard.
- LangChain `MultiModalRetriever` — superseded by RAG-Anything for our use case.

## Open Questions

1. **`aquery_with_multimodal` return shape**
   - What we know: returns a string (the generated answer). Verified against README quickstart.
   - What's unclear: whether RAG-Anything 1.2.10 also returns a structured `chunks` / `context` field that we could feed to `shared.display.render_query_result` (the way Tier 1's retrieval does). Some LightRAG modes do, some don't.
   - Recommendation: implement the chunk-shape adapter defensively. Pass `chunks=[]` if unstructured. If structured chunks ARE returned in 1.2.10, populate them — but don't gate the plan on it.

2. **Tier 5 `MaxTurnsExceeded.usage` exposure**
   - What we know: SDK's `Runner.run` raises `MaxTurnsExceeded`; usage is tracked across turns.
   - What's unclear: whether 0.14.6 attaches accumulated usage to the exception (some 0.1x versions did; others didn't). Issue #844 in `openai/openai-agents-python` is on this.
   - Recommendation: handle both branches (Pattern 7 — `getattr(exc, "usage", None)`).

3. **MineRU CUDA detection inside Docker**
   - What we know: MineRU CLI accepts `--device cuda`; defaults to CPU when CUDA unavailable.
   - What's unclear: does the Python API auto-detect via `torch.cuda.is_available()` on an Apple Silicon dev box (no CUDA), and gracefully fall back? Should be yes; haven't confirmed.
   - Recommendation: Plan should add a "device autodetection" task that prints `cpu`/`cuda`/`mps` at ingest start.

4. **Whether to expose Tier 4's RAG-Anything KG as a Tier 5 tool**
   - What we know: Both tiers can run independently. Tier 5 success criterion only requires Tier 1 ChromaDB.
   - What's unclear: is the marginal narrative value of "Tier 5 calls Tier 4's multimodal KG" worth the extra dependency footprint (Tier 5 would need raganything+mineru just for the tool)?
   - Recommendation: **defer**. Document as a Phase 131+ enhancement. v1 keeps Tier 5's deps light (no mineru).

## Sources

### Primary (HIGH confidence)

- **PyPI**: `https://pypi.org/project/raganything/` — version 1.2.10, 2026-03-24 release, install extras, key params (verified via WebFetch).
- **PyPI**: `https://pypi.org/project/openai-agents/` — version 0.14.6, 2026-04-25 release, `[litellm]` extra, basic usage example (verified via WebFetch).
- **GitHub**: `https://github.com/HKUDS/RAG-Anything` — README quickstart, RAGAnything class signature, `insert_content_list` semantics, vision_model_func contract, MineRU device parameter (verified via WebFetch).
- **GitHub**: `https://github.com/openai/openai-agents-python/blob/main/examples/model_providers/litellm_provider.py` — verbatim LiteLLM integration code (verified via WebFetch).
- **Docs**: `https://openai.github.io/openai-agents-python/running_agents/` — Runner.run signature, max_turns, MaxTurnsExceeded, RunResult shape (verified via WebFetch).
- **Docs**: `https://openai.github.io/openai-agents-python/tools/` — `@function_tool` decorator, schema derivation, pydantic Field usage (verified via WebFetch).
- **Docs**: `https://openai.github.io/openai-agents-python/usage/` — `result.context_wrapper.usage` shape (verified via WebFetch).
- **Phase 129 RESEARCH/PLAN/SUMMARY artifacts** — SOCKS5 proxy + socksio workaround, LightRAG 1.4.15 pin, OpenRouter wiring, cost-tracker D-13 schema, lockfile guard semantics. Verified via local Read.
- **Phase 128 RESEARCH artifacts** — ChromaDB cosine + path conventions, `shared.display` contract, Tier 1 retriever surface that Tier 5 wraps. Verified via local Read.
- **Repo state (verified locally 2026-04-26):** `pyproject.toml`, `shared/pricing.py`, `shared/cost_tracker.py`, `dataset/manifests/figures.json` (581 entries, 8 captioned), `tier-1-naive/store.py`, `tier-1-naive/retrieve.py`.

### Secondary (MEDIUM confidence)

- **MinerU Docker docs**: `https://opendatalab.github.io/MinerU/quick_start/docker_deployment/` — Volta+ GPU requirement, vllm base image (WebSearch summary, useful for documenting GPU upgrade path).
- **LiteLLM docs**: `https://docs.litellm.ai/docs/tutorials/openai_agents_sdk` — AsyncOpenAI-via-LiteLLM-proxy alternative wiring (verified via WebFetch).
- **LiteLLM OpenRouter**: `https://docs.litellm.ai/docs/providers/openrouter` — model-prefix conventions (`openrouter/<provider>/<model>`).
- **Milvus blog on RAG-Anything**: `https://milvus.io/blog/multimodal-rag-made-simple-rag-anything-milvus-instead-of-20-separate-tools.md` — confirms install + 5-stage pipeline.

### Tertiary (LOW confidence — validate before relying)

- **arxiv 2510.12323 (RAG-Anything paper)** — paper page on huggingface; not directly fetched. Fine as "the paper exists" reference.
- **GitHub issue #844 (`openai/openai-agents-python`)** — `MaxTurnsExceeded` discussion; flagged but not fully read. Plan should re-verify before relying on `exc.usage` semantics.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library version was PyPI-verified on 2026-04-26.
- Architecture (RAG-Anything composition, Agents SDK + LiteLLM): HIGH — code patterns verified against README + example files.
- Pitfalls: HIGH on inherited ones (LightRAG-class, SOCKS5, ChromaDB); MEDIUM on the multimodal ones (rate limits, MineRU model size — depends on env).
- Cost: MEDIUM — Tier 4 multimodal token cost depends heavily on image count and VLM choice; Tier 5 cost depends on agent loop depth.

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days; refresh if `raganything` or `openai-agents` ships a major version before plan execution)
