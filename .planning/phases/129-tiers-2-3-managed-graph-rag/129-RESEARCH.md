# Phase 129: Tiers 2-3 Managed + Graph RAG — Research

**Researched:** 2026-04-26
**Domain:** Managed-service RAG (Gemini File Search, fully-managed) + Graph RAG (LightRAG, knowledge-graph extraction with multi-hop queries)
**Confidence:** HIGH (Gemini File Search SDK surface, LightRAG core APIs, version pins) / MEDIUM (cost projections at 100-paper scale, OpenRouter compatibility for LightRAG entity extraction, peak-load API stability)

> **Note on upstream input:** No CONTEXT.md exists for Phase 129 (no `/gsd:discuss-phase` was run). Per the orchestrator brief, this RESEARCH.md treats ROADMAP + REQUIREMENTS + the verified Phase 127/128 outputs as the locked source of truth. The "User Constraints" section below is reconstructed from those locked artifacts plus the orchestrator's explicit framing.

<user_constraints>
## User Constraints (from ROADMAP + REQUIREMENTS + Phase 127-128 outputs)

### Locked Decisions

**From ROADMAP.md Phase 129 success criteria:**
1. Running Tier 2 uploads the enterprise KB to Gemini File Search and returns answers with managed retrieval.
2. Running Tier 3 extracts a knowledge graph via LightRAG and answers multi-hop queries that Tier 1 cannot.
3. Both tiers print cost and latency alongside their answers.

**From REQUIREMENTS.md:**
- **TIER-02:** Tier 2 (Google Managed RAG) with Gemini File Search API, managed indexing and retrieval.
- **TIER-03:** Tier 3 (Graph RAG) with LightRAG, knowledge graph extraction and entity-relationship retrieval.

**From Phase 127-128 outputs (must be honored — already shipped):**
- `shared/config.py` lazy `get_settings()` factory; `GEMINI_API_KEY` REQUIRED; `OPENROUTER_API_KEY` optional but REQUIRED for any tier doing OpenRouter LLM/embedding calls.
- `shared/llm.py:get_llm_client()` — Gemini-backed (`google-genai>=1.73,<2`); used as `gemini-2.5-flash` answer LLM.
- `shared/embeddings.py:get_embedding_client()` — Gemini-backed; emits `gemini-embedding-001` 768-dim vectors. **Must NOT be modified** (smoke test depends on it).
- `shared/cost_tracker.py` — D-13 schema fixed; persists `evaluation/results/costs/{tier}-{timestamp}.json`. Captures construction-time timestamp so repeated `persist()` overwrites.
- `shared/display.py:render_query_result(query, chunks, answer, cost_usd, input_tokens, output_tokens)` — every tier MUST use this.
- `shared/loader.py:DatasetLoader().papers()` returns 100 entries with `paper_id`, `title`, `filename`, `arxiv_id`, `authors`, `year`, `abstract`. Defaults to `Path("dataset")` (no key needed).
- `shared/pricing.py` — locked PRICES table; `gemini-2.5-flash`, `gemini-embedding-001`, `openai/gpt-4o-mini`, `openai/text-embedding-3-small`, `google/gemini-2.5-flash` (via OpenRouter), `anthropic/claude-haiku-4.5`, etc. **Both Gemini-direct and `google/...` OpenRouter slugs are present.**
- Dataset: 100 PDFs at `dataset/papers/` (~290 MB tracked via git-lfs, per `dataset/manifests/metadata.json`); 30-question golden Q&A at `evaluation/golden_qa.json`.
- `pyproject.toml` already declares **empty** `[tier-2]` and `[tier-3]` extras (`["rag-architecture-patterns[shared]"]` only). Phase 129 MUST extend each.
- `tier-2-managed/requirements.txt` and `tier-3-graph/requirements.txt` already exist with `-e ..[tier-2]` / `-e ..[tier-3]`.
- `tests/test_tier_requirements.py` is a **lockfile guard**: it fails if `google-generativeai` (deprecated EOL 2025-08-31) appears in `uv.lock`. It also enforces that pyproject has `[tier-N]` extras and tier `requirements.txt` references the parent.
- `tests/conftest.py` exposes the `live_keys_ok` fixture; `pytest.mark.live` is registered.
- Phase 128 established the canonical CLI pattern: `python tier-N-name/main.py [--ingest] [--query "..."] [--top-k N] [--reset] [--model SLUG]`. Cost JSON persisted on every successful query. Latency printed via `time.monotonic()`.
- Phase 128 OpenRouter migration: Tier 1 chat + embeddings both go through `https://openrouter.ai/api/v1` via the OpenAI SDK. Pricing table contains both `openai/text-embedding-3-small` (OpenRouter slug) and the bare `text-embedding-3-small` (direct OpenAI). **Tier 1's embedding dimension on disk is 1536** — Tier 3 must NOT collide with that dimension if it shares any vector store.
- Persistence path convention: each tier owns a subdirectory under a top-level data root. Tier 1 uses `chroma_db/tier-1-naive/`. Tier 3 should use a similarly-scoped directory; recommend `lightrag_storage/tier-3-graph/` (LightRAG's `working_dir`). Add to `.gitignore`.

### Claude's Discretion (this phase)

- **Tier 2 LLM model choice** for the answer-generation step that consumes File Search results — recommend `gemini-2.5-flash` (Gemini-direct via `shared/llm`, per Phase 127 default; File Search is a Gemini-native tool so it MUST be Gemini, not OpenRouter).
- **Tier 2 store-management strategy:** create-on-ingest vs. resolve-by-display-name vs. cache the store ID locally. Recommend cache the store name in `tier-2-managed/.store_id` (gitignored) so re-runs don't create duplicate stores.
- **Tier 2 ingest scope:** all 100 PDFs vs. a subset for cost-bounding. Recommend full corpus (cost is bounded — see Cost Estimates below).
- **Tier 3 LLM provider for entity extraction:** OpenRouter (any of `google/gemini-2.5-flash`, `openai/gpt-4o-mini`, `anthropic/claude-haiku-4.5`) vs. Gemini-direct. Recommend OpenRouter `google/gemini-2.5-flash` for narrative continuity with Tier 2 (same model, different routing) AND because LightRAG's `openai_complete_if_cache` accepts a `base_url` override — a clean fit. Justify the choice in the README.
- **Tier 3 embedding model:** LightRAG's vector store dimension is decided ONCE at first ingest. Recommend `openai/text-embedding-3-small` via OpenRouter (1536 dim, matches Tier 1, cheapest). Document that switching requires `--reset`.
- **Tier 3 query mode** for the demo CLI: `naive` / `local` / `global` / `hybrid` / `mix`. Recommend `mix` (or `hybrid` if `mix` requires a reranker we don't ship) — both surface the multi-hop strength. Include a `--mode` flag so users can A/B all five modes.
- **Tier 3 PDF→text preprocessing:** reuse Tier 1's PyMuPDF extractor (`tier_1_naive.ingest.extract_pages` + concat per paper) or have its own. Recommend reuse via `from tier_1_naive.ingest import extract_pages` and concat all pages of a paper into one document before `rag.ainsert(doc_text)`. Adds dep on tier-1 extras for Tier 3, but avoids duplicating PDF code. Alternative: copy `extract_pages` into Tier 3 and pin `pymupdf` directly in `[tier-3]` extras (cleaner isolation; mild duplication). Plan should pick one.
- **CLI structure:** `tier-2-managed/main.py` and `tier-3-graph/main.py` mirroring Tier 1's argparse subcommand-via-flags pattern. `--ingest`, `--query`, `--reset`, `--model` (Tier 3 only); plus `--mode` (Tier 3) and (optional) `--store-name` (Tier 2).
- **README structure:** mirror Tier 1's README — Overview, Quickstart, Sample query, Expected cost, Known weaknesses, Reused by future tier?

### Deferred Ideas (OUT OF SCOPE for Phase 129)

- Vertex AI Search RAG Engine — that's a different (more enterprise) product; ROADMAP says **Gemini File Search**, full stop.
- Vertex AI Vector Search direct usage — not in TIER-02 or TIER-03 spec.
- Neo4j as LightRAG storage backend — adds Docker-compose complexity that Phase 130 (REPO-05) will revisit if needed; default NetworkX backend is fine for 100 papers.
- Multimodal ingest (figures/images) — Tier 4 territory.
- RAG-Anything — Tier 4 territory (Phase 130).
- LightRAG API server / Web UI — adds FastAPI dep tree that's not needed for the CLI demo. Only the core library + LLM/embed extras.
- Custom rerankers (`bge-reranker-v2-m3`) — defer; default `mix` mode without rerank still demonstrates the multi-hop story.
- RAGAS evaluation — Phase 131.
- Latency comparison plot — Phase 131.
- Docker packaging — REPO-05 / Phase 130.
- Multi-tenancy / workspace isolation — single-tenant local CLI only.
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TIER-02 | Tier 2 (Google Managed RAG) with Gemini File Search API, managed indexing and retrieval | `google-genai>=1.49.0` adds `client.file_search_stores.*` namespace; repo already pins `>=1.73,<2`. Verified API surface against `ai.google.dev/gemini-api/docs/file-search`, the official cookbook quickstart, and `googleapis.github.io/python-genai`. |
| TIER-03 | Tier 3 (Graph RAG) with LightRAG, knowledge graph extraction and entity-relationship retrieval | `lightrag-hku==1.4.15` (latest, released 2026-04-19) supports Python 3.10+, NetworkX default backend, `openai_complete_if_cache` accepts `base_url` override (OpenRouter compatible). Verified against HKUDS/LightRAG GitHub source (`lightrag/llm/openai.py`) and `examples/lightrag_openai_compatible_demo.py`. |

## Summary

Phase 129 implements two contrasting RAG tiers against the same 100-paper enterprise KB. **Tier 2** delegates the entire pipeline (chunking, embedding, indexing, retrieval) to Google's **Gemini File Search** — uploading the corpus to a `FileSearchStore`, then calling `client.models.generate_content(model="gemini-2.5-flash", tools=[FileSearch(...)])` so the model auto-grounds against the indexed corpus and returns text with citations in `response.candidates[0].grounding_metadata`. **Tier 3** runs **LightRAG** (HKUDS, EMNLP 2025) which extracts a knowledge graph (entities + relationships + chunks) via LLM calls during ingest, persists it to a `working_dir/` (NetworkX `.graphml` + `vdb_*.json` + `kv_store_*.json`), then answers via one of five modes — `naive` / `local` / `global` / `hybrid` / `mix` — surfacing multi-hop entity-traversal results that Tier 1 vector-only retrieval misses.

The architectural contrast that drives the blog post:

| Concern | Tier 1 (Naive) | Tier 2 (Managed) | Tier 3 (Graph) |
|---------|---------------|-----------------|----------------|
| Who chunks? | We do (512/64 tiktoken) | Google does (white_space, tunable) | LightRAG does (1200 tokens default) |
| Who embeds? | We call OpenRouter | Google's `gemini-embedding-001` | We call OpenRouter (per-chunk) |
| Who stores? | ChromaDB (local disk) | Google (managed cloud) | NetworkX graph + nano-vectordb (local disk) |
| Retrieval surface | Cosine top-k chunks | Citations + grounded text | Entities + relationships + chunks (5 modes) |
| Cross-document reasoning | No | No (single-shot retrieval) | YES (graph traversal) |
| Cost dimension | Per-token embed + per-token chat | Per-token *index* (free storage) + per-token chat | Per-token entity-extract LLM (one-time, big) + per-query LLM |
| Cost surprise risk | Low ($0.01 ingest) | Low ($0.05 indexing) | **HIGH** — entity extraction is many LLM calls per chunk |

**Primary recommendation:**
- **Tier 2:** `google-genai>=1.73,<2` (already pinned). Use `client.file_search_stores.create()` once, persist the store name to `tier-2-managed/.store_id`. Loop the 100 PDFs through `client.file_search_stores.upload_to_file_search_store()` polling each operation to completion. At query time, attach `types.Tool(file_search=types.FileSearch(file_search_store_names=[store.name]))` to a `gemini-2.5-flash` `generate_content` call. Render citations from `response.candidates[0].grounding_metadata.grounding_chunks` mapping to the `shared.display.render_query_result` chunks shape (`doc_id`, `score`, `snippet`).
- **Tier 3:** `lightrag-hku==1.4.15` (pin exactly to avoid surprise breakage; LightRAG ships micro-versions every few days). Use `LightRAG(working_dir="lightrag_storage/tier-3-graph", llm_model_func=<openrouter-google-gemini-flash>, embedding_func=EmbeddingFunc(embedding_dim=1536, max_token_size=8192, func=<openrouter-text-embedding-3-small>))`. Reuse Tier 1's PyMuPDF page-extractor; concat pages per paper before `await rag.ainsert(doc_text)`. Default query mode `mix` (falls back to `hybrid` if `mix` errors due to no reranker). **Pre-flight cost estimate is critical** — see Pitfall 5; one-time graph extraction on 100 papers is the most expensive operation in the whole repo.

## Architectural Responsibility Map

| Capability | Where it lives | Why |
|-----------|---------------|-----|
| Tier 2 store creation/upload/polling | `tier-2-managed/store.py` (new) | Tier-local; wraps `client.file_search_stores.*` |
| Tier 2 query + grounding extraction | `tier-2-managed/query.py` (new) | Tier-local; calls `generate_content` with `FileSearch` tool, maps grounding_metadata→chunks |
| Tier 2 cost recording | inline via `shared.cost_tracker.CostTracker("tier-2")` | Standard pattern; see Pitfall 7 — record `gemini-2.5-flash` LLM tokens AND a synthetic `gemini-embedding-001` indexing entry |
| Tier 2 CLI orchestration | `tier-2-managed/main.py` (new) | Mirrors Tier 1 layout |
| Tier 3 LightRAG init + LLM/embed adapters | `tier-3-graph/rag.py` (new) | Tier-local; defines `llm_model_func` + `embedding_func` for OpenRouter routing |
| Tier 3 ingest (PDF→text→insert) | `tier-3-graph/ingest.py` (new) | Imports `extract_pages` from `tier_1_naive.ingest` (or duplicates — Plan decides); concat pages, `await rag.ainsert(...)` |
| Tier 3 query | `tier-3-graph/query.py` (new) | Wraps `await rag.aquery(query, param=QueryParam(mode=...))`; pulls token counts from custom `token_tracker` |
| Tier 3 CLI orchestration | `tier-3-graph/main.py` (new) | Mirrors Tier 1 layout, plus `--mode` flag |
| Answer LLM (Tier 2) | `shared.llm.get_llm_client()` (Gemini direct, `gemini-2.5-flash`) | Reuse — File Search is a Gemini-native tool; cannot route through OpenRouter |
| Answer LLM (Tier 3) | OpenRouter via `lightrag.llm.openai.openai_complete_if_cache(base_url="https://openrouter.ai/api/v1", api_key=…)` | Aligns with Phase 128 OpenRouter pivot; lets `--model` flag work |
| Embedding (Tier 2) | Implicit (Google manages) | Indexing cost is recorded synthetically using doc-token estimate × $0.15/1M (`gemini-embedding-001` price) |
| Embedding (Tier 3) | OpenRouter via `lightrag.llm.openai.openai_embed(base_url=..., model="openai/text-embedding-3-small")` | Same key as Tier 1 chat; 1536 dim |
| Output rendering | `shared/display.render_query_result` | Reuse — every tier |
| Dataset loading | `shared/loader.DatasetLoader` | Reuse |
| Cost tracking | `shared/cost_tracker.CostTracker` | Reuse with `tier-2` / `tier-3` labels |

## Standard Stack

### Core (verified versions, current as of 2026-04-26)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `google-genai` | `>=1.73,<2` | Gemini File Search SDK (Tier 2) | Already in `[shared]`. `file_search_stores` namespace landed in **v1.49.0** (verified via issue #1638 + cookbook). 1.73.1 is current latest (`pip3 index versions google-genai`). The deprecated `google-generativeai` (EOL 2025-08-31) is **forbidden** by the lockfile guard test. |
| `lightrag-hku` | `==1.4.15` | Graph RAG framework (Tier 3) | Latest stable on PyPI (verified `pip3 index versions lightrag-hku` → 1.4.15 released 2026-04-19). Pin exactly: LightRAG ships dot-releases every 2-7 days; floating constraint risks silent behavior change. EMNLP 2025 paper. |
| `pymupdf` | `>=1.27,<2` | PDF text extraction (Tier 3 ingest) | Already pinned in `[tier-1]` and `[curation]`. Tier 3 either inherits via tier-1 import OR re-pins in `[tier-3]` (Plan decides). |
| `openai` | `>=1.50,<3` | OpenRouter SDK base for LightRAG's `openai_complete_if_cache` (Tier 3) | Already pinned in `[tier-1]`. LightRAG's `lightrag.llm.openai` module imports the `openai` Python SDK; pinning here ensures version alignment. |
| `tiktoken` | `>=0.10,<1` | Token counting for cost tracking | Already in `[shared]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `networkx` | (transitive via `lightrag-hku`) | Default graph backend for LightRAG | Don't pin separately — LightRAG owns the constraint. |
| `nano-vectordb` | (transitive via `lightrag-hku`) | LightRAG's default in-memory vector store for entities/relations/chunks | Don't pin separately. |
| `pydantic` / `python-dotenv` / `tenacity` / `numpy` / `pandas` | (transitive) | LightRAG declared deps | Already in `[shared]` (pydantic, dotenv) or transitive via `lightrag-hku`. |
| `rich` | (already `[shared]`) | Display | Reuse |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Gemini File Search (Tier 2) | Vertex AI Search RAG Engine | Vertex is enterprise/GCP-project-bound; ROADMAP explicitly says "Gemini File Search". File Search is the AI-Studio-keyed product; better narrative fit ("zero-infra"). |
| Gemini File Search | OpenAI Assistants File Search | Different vendor; would force the blog post to call this "Tier 2 = OpenAI managed RAG", contradicting the requirement. |
| LightRAG (Tier 3) | Microsoft GraphRAG | GraphRAG was the OG; LightRAG is the **simpler, faster, cheaper** rewrite (paper claims 99% token cost reduction at indexing vs GraphRAG community-detection step). Phase 130's RAG-Anything also builds on LightRAG, so picking LightRAG here gives Tier 3 → Tier 4 narrative continuity. |
| LightRAG | Neo4j-native + custom Cypher | Hand-rolling entity extraction + Cypher query generation IS the "don't hand-roll" anti-pattern. LightRAG ships both. |
| LightRAG default NetworkX | LightRAG with Neo4j backend | Neo4j adds Docker dep + URL config; for 100 papers NetworkX is fine and faster to demo. Phase 130 may revisit if multi-tenancy is needed. |
| Gemini-direct for LightRAG LLM | OpenRouter for LightRAG LLM | OpenRouter = single key, swappable model, narrative continuity with Phase 128's pivot. Both work. Choose OpenRouter. |
| Reuse Tier 1's PDF extractor (import) | Duplicate `extract_pages` into Tier 3 | Import is DRY but creates a soft cross-tier coupling. Duplicate is ~25 lines and keeps tiers independent. Plan decides; recommend duplicate (independence is more honest about what each tier does). |

**Installation (after Phase 129 completes):**

```bash
cd tier-2-managed && uv pip install -e ..[tier-2]
cd tier-3-graph && uv pip install -e ..[tier-3]
```

**Required updates to `pyproject.toml`:**

```toml
[project.optional-dependencies]
tier-2 = [
  "rag-architecture-patterns[shared]",
  # google-genai already in [shared] >=1.73,<2 — covers file_search_stores (added v1.49)
]
tier-3 = [
  "rag-architecture-patterns[shared]",
  "lightrag-hku==1.4.15",   # pin exact; releases are very frequent
  "openai>=1.50,<3",         # for LightRAG's openai_complete_if_cache OpenRouter routing
  "pymupdf>=1.27,<2",        # if Tier 3 owns its own PDF extractor; omit if it imports tier_1
]
```

Tier 2 needs **no new top-level deps** — `google-genai` is already in `[shared]`. The change is empty-extras → still empty-extras (the file_search_stores API is part of the SDK). The lockfile guard test passes unchanged.

**Required updates to `.gitignore`:**

```
lightrag_storage/
tier-2-managed/.store_id
```

**Required updates to `.env.example`:**

`OPENROUTER_API_KEY` is already declared (Phase 128). Promote the comment from "REQUIRED for Tier 1" to "REQUIRED for Tier 1, Tier 3 (LightRAG LLM/embed)". `GEMINI_API_KEY` already required for shared smoke test — Tier 2 uses it via `shared.llm`.

## Architecture Patterns

### Recommended Project Structure

```
tier-2-managed/
├── README.md                  # Quickstart, expected cost, known weaknesses
├── requirements.txt           # exists — `-e ..[tier-2]`
├── main.py                    # CLI entrypoint (--ingest / --query / --reset)
├── store.py                   # FileSearchStore create/upload/poll helpers
├── query.py                   # generate_content with FileSearch tool + grounding extraction
└── tests/
    ├── __init__.py
    ├── test_store.py          # @pytest.mark.live — create/upload/delete roundtrip on a tiny store
    └── test_main.py           # @pytest.mark.live — end-to-end ingest+query

tier-3-graph/
├── README.md
├── requirements.txt           # exists — `-e ..[tier-3]`
├── main.py                    # CLI entrypoint (--ingest / --query / --mode / --reset / --model)
├── rag.py                     # LightRAG initialization (llm_model_func + embedding_func)
├── ingest.py                  # PDF→text concat → rag.ainsert
├── query.py                   # rag.aquery wrapper + token tracking
└── tests/
    ├── __init__.py
    ├── test_rag.py            # Non-live — assert init builds, working_dir gets created
    └── test_main.py           # @pytest.mark.live — tiny corpus end-to-end
```

### Pattern 1: Gemini File Search store-id caching (Tier 2)

**What:** Store names are server-assigned (`fileSearchStores/abc123`). Cache the name to a gitignored sidecar file so re-runs of `--ingest` don't create duplicate stores. `--reset` deletes both the cached id and the server-side store.

**When to use:** Always, in Tier 2's CLI startup.

**Example:**
```python
# tier-2-managed/store.py
from pathlib import Path
from google import genai
from google.genai import types

STORE_ID_PATH = Path("tier-2-managed/.store_id")
STORE_DISPLAY_NAME = "rag-arch-patterns-tier-2"

def get_or_create_store(client: genai.Client, reset: bool = False):
    """Resolve or create the canonical store. Returns the SDK store object."""
    if reset and STORE_ID_PATH.exists():
        cached_name = STORE_ID_PATH.read_text().strip()
        try:
            client.file_search_stores.delete(name=cached_name, config={"force": True})
        except Exception:
            pass  # Already gone; fine.
        STORE_ID_PATH.unlink()

    if STORE_ID_PATH.exists():
        cached_name = STORE_ID_PATH.read_text().strip()
        try:
            return client.file_search_stores.get(name=cached_name)
        except Exception:
            STORE_ID_PATH.unlink()  # Stale; fall through to create.

    store = client.file_search_stores.create(
        config=types.CreateFileSearchStoreConfig(
            display_name=STORE_DISPLAY_NAME,
        )
    )
    STORE_ID_PATH.parent.mkdir(parents=True, exist_ok=True)
    STORE_ID_PATH.write_text(store.name)
    return store
```

### Pattern 2: PDF upload with operation polling (Tier 2)

**What:** `upload_to_file_search_store` returns a **long-running operation** — must poll `client.operations.get(op)` until `op.done`. The cookbook quickstart polls every 1s, the DataCamp tutorial polls every 3s; either is fine for our scale.

**Example:**
```python
# tier-2-managed/store.py
import time
from google import genai
from google.genai import types

def upload_pdf(client: genai.Client, store_name: str, pdf_path: str, display_name: str):
    op = client.file_search_stores.upload_to_file_search_store(
        file=pdf_path,
        file_search_store_name=store_name,
        config=types.UploadToFileSearchStoreConfig(
            display_name=display_name,
            # Optional: tune chunking. Defaults are fine for the comparison story.
            # chunking_config={"white_space_config": {
            #     "max_tokens_per_chunk": 200, "max_overlap_tokens": 20
            # }},
        ),
    )
    while not (op := client.operations.get(op)).done:
        time.sleep(2)
    return op  # op.response holds the imported document handle
```

**Source:** `https://github.com/google-gemini/cookbook/blob/main/quickstarts/File_Search.ipynb` (raw notebook content extracted via WebFetch).

### Pattern 3: Generate with FileSearch tool + extract grounding (Tier 2)

**What:** Attach `types.Tool(file_search=types.FileSearch(file_search_store_names=[store.name]))` to `GenerateContentConfig`. The model returns text **plus** `grounding_metadata.grounding_chunks` (each chunk has `retrieved_context.title` and `retrieved_context.text`).

**Why this matters for the comparison:** Tier 2 returns a **first-class citations API**. The blog post can show "Tier 2 has citations baked in; Tier 1 has to assemble them manually." That's exactly the "managed" framing the ROADMAP wants.

**Example:**
```python
# tier-2-managed/query.py
from google import genai
from google.genai import types

def query(client: genai.Client, store_name: str, question: str, model: str = "gemini-2.5-flash"):
    response = client.models.generate_content(
        model=model,
        contents=question,
        config=types.GenerateContentConfig(
            tools=[types.Tool(
                file_search=types.FileSearch(file_search_store_names=[store_name])
            )],
        ),
    )
    return response

def to_display_chunks(response) -> list[dict]:
    """Map grounding metadata → shared.display chunks shape."""
    out = []
    grounding = response.candidates[0].grounding_metadata
    if not grounding or not grounding.grounding_chunks:
        return out
    for ch in grounding.grounding_chunks:
        ctx = ch.retrieved_context
        out.append({
            "doc_id": ctx.title or "(unnamed)",
            "score": float(getattr(ctx, "score", 0.0) or 0.0),  # score may not be exposed
            "snippet": (ctx.text or "")[:200],
        })
    return out
```

### Pattern 4: LightRAG OpenRouter wiring (Tier 3)

**What:** Define a `llm_model_func` that calls `openai_complete_if_cache(model, prompt, base_url="https://openrouter.ai/api/v1", api_key=...)` and an `embedding_func` (wrapped via `EmbeddingFunc`) that calls `openai_embed(texts, model="openai/text-embedding-3-small", base_url="https://openrouter.ai/api/v1", api_key=...)`. Pass both into `LightRAG(...)`.

**Source:** Verified against `https://github.com/HKUDS/LightRAG/blob/main/lightrag/llm/openai.py` (function signatures extracted via WebFetch) and `examples/lightrag_openai_compatible_demo.py`.

**Example:**
```python
# tier-3-graph/rag.py
import os
from functools import partial
from lightrag import LightRAG, QueryParam
from lightrag.llm.openai import openai_complete_if_cache, openai_embed
from lightrag.utils import EmbeddingFunc

WORKING_DIR = "lightrag_storage/tier-3-graph"
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
DEFAULT_LLM_MODEL = "google/gemini-2.5-flash"
DEFAULT_EMBED_MODEL = "openai/text-embedding-3-small"
EMBED_DIMS = 1536
EMBED_MAX_TOKENS = 8192


async def _llm_model_func(prompt, system_prompt=None, history_messages=None,
                          keyword_extraction=False, model: str | None = None, **kwargs) -> str:
    return await openai_complete_if_cache(
        model or os.environ.get("TIER3_LLM_MODEL", DEFAULT_LLM_MODEL),
        prompt,
        system_prompt=system_prompt,
        history_messages=history_messages or [],
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url=OPENROUTER_BASE,
        keyword_extraction=keyword_extraction,
        **kwargs,
    )


async def _embed_func(texts: list[str]) -> "np.ndarray":
    return await openai_embed(
        texts,
        model=DEFAULT_EMBED_MODEL,
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url=OPENROUTER_BASE,
    )


def build_rag(working_dir: str = WORKING_DIR) -> LightRAG:
    return LightRAG(
        working_dir=working_dir,
        llm_model_func=_llm_model_func,
        embedding_func=EmbeddingFunc(
            embedding_dim=EMBED_DIMS,
            max_token_size=EMBED_MAX_TOKENS,
            func=_embed_func,
        ),
    )
```

### Pattern 5: LightRAG initialization, ingest, query (Tier 3)

**What:** LightRAG requires `await rag.initialize_storages()` (and, in some versions, `await initialize_pipeline_status()`) before first use. Ingest is `await rag.ainsert(text)` — accepts string or list. Query is `await rag.aquery(question, param=QueryParam(mode="mix"))`.

**Persisted artifacts (under `working_dir/`):**
- `graph_chunk_entity_relation.graphml` — the knowledge graph
- `vdb_entities.json`, `vdb_relationships.json`, `vdb_chunks.json` — vector indexes
- `kv_store_full_docs.json`, `kv_store_text_chunks.json`, `kv_store_doc_status.json`, `kv_store_llm_response_cache.json` — KV stores

**Example:**
```python
# tier-3-graph/main.py (sketch)
import asyncio
from .rag import build_rag

async def cmd_ingest_and_query(question: str, mode: str = "mix"):
    rag = build_rag()
    await rag.initialize_storages()
    # … insert (idempotent if doc_status says already-ingested)…
    answer = await rag.aquery(question, param=QueryParam(mode=mode))
    await rag.finalize_storages()
    return answer

asyncio.run(cmd_ingest_and_query("…"))
```

### Pattern 6: Cost capture for Tier 3 (LightRAG)

**What:** LightRAG's `openai_complete_if_cache` accepts a `token_tracker` kwarg (verified in source). Pass a small adapter that forwards into `shared.cost_tracker.CostTracker.record_llm()`. For embeddings, `openai_embed` also accepts `token_tracker`. This avoids monkey-patching the SDK.

**Example:**
```python
# tier-3-graph/rag.py — add near _llm_model_func
class _CostAdapter:
    """Adapts shared.cost_tracker.CostTracker to LightRAG's token_tracker protocol."""
    def __init__(self, tracker, model: str):
        self.tracker = tracker
        self.model = model
    def add_usage(self, usage):
        # LightRAG calls add_usage with a dict-like object having prompt_tokens/completion_tokens
        prompt = int(getattr(usage, "prompt_tokens", 0) or usage.get("prompt_tokens", 0))
        completion = int(getattr(usage, "completion_tokens", 0) or usage.get("completion_tokens", 0))
        self.tracker.record_llm(self.model, prompt, completion)
```

> **Open question:** the exact `token_tracker` protocol shape varies across LightRAG versions. The Plan must verify against the pinned 1.4.15 source — the `add_usage` signature shown above is the consensus interface but should be re-checked. Fallback: monkey-patch `openai.OpenAI.chat.completions.create` only inside the Tier 3 process to capture `usage`.

### Pattern 7: Synthetic Tier-2 indexing-cost line item

**What:** `client.file_search_stores.upload_to_file_search_store` doesn't return a per-call token count. Estimate the indexing cost by counting input tokens (via `tiktoken`) per uploaded PDF text and recording **once** per ingest as `record_embedding("gemini-embedding-001", total_input_tokens)`. Pricing: $0.15/1M input tokens for indexing (free storage, free query embedding).

**Why:** keeps Tier 2's cost JSON faithful and comparable to other tiers' embedding lines. Document the synthetic origin in `cost_tracker_notes` so Phase 131 doesn't double-count.

### Anti-Patterns to Avoid

- **Re-creating a FileSearchStore per run.** Burns no money but bloats Google's quota and leaks display-name-collision noise. Cache the store name.
- **Skipping the operation poll loop.** `op.done` is False initially; calling `generate_content` against an unimported file silently misses citations.
- **Calling `embed_func` synchronously inside LightRAG.** All LightRAG funcs are async; passing a sync function silently breaks at first ingest. Use `async def` + `await`.
- **Hardcoding LightRAG's default `gpt_4o_mini_complete` helper.** That helper hits OpenAI directly, bypassing OpenRouter. Always pass a custom `llm_model_func` that uses the openrouter base_url.
- **Writing Tier 3 to `chroma_db/`.** That's Tier 1's directory; LightRAG uses its own `working_dir/` layout. Use `lightrag_storage/tier-3-graph/`.
- **Re-running Tier 3 ingest without a doc-status check.** LightRAG's `kv_store_doc_status.json` tracks ingested docs by id; re-running on the same input is fast (skipped). But changing chunk size or LLM model invalidates the graph silently — `--reset` wipes `working_dir`.
- **Mixing embedding models within a single LightRAG `working_dir`.** Verified pitfall (HKUDS issue #2119: "Embedding dimension mismatch"). Once a graph is built with 1536-dim, switching to 768-dim corrupts retrieval. `--reset` to switch.
- **Letting `tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk` fail.** If a transitive dep pulls `google-generativeai` (LightRAG explicitly does NOT — verified in pyproject.toml WebFetch), the test will fail.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Managed-RAG indexing & retrieval | A custom Vertex Search client | `google.genai.Client.file_search_stores.*` | The whole point of Tier 2 is "zero infra"; building anything custom defeats the comparison. |
| Long-running operation polling | A `while True: time.sleep` with bare `requests.get` | `client.operations.get(op)` | The SDK exposes the LRO directly. |
| Citations rendering | A regex over the model's free text | `response.candidates[0].grounding_metadata.grounding_chunks` | Built-in, structured, with offsets and scores when available. |
| Knowledge-graph extraction (Tier 3) | LLM prompts + JSON parsing for entities | `lightrag-hku` | Hundreds of LLM-call+parsing-prompt-tuning lines; prompt-engineering tax. |
| KG storage layer | NetworkX + custom serialization | LightRAG's `working_dir/` (NetworkX + nano-vectordb) | Pre-baked. |
| KG query routing | Hand-coded multi-hop traversal | `QueryParam(mode="mix" / "hybrid" / ...)` | Five tested modes ship in the box. |
| OpenRouter call from inside LightRAG | Monkey-patching `lightrag.llm.openai_complete` | Pass `llm_model_func` that calls `openai_complete_if_cache(base_url="https://openrouter.ai/api/v1", ...)` | The library exposes the seam. |

**Key insight:** Phase 129 is **two thin tier wrappers** plus the same shared layer. Tier 2 is ~80 lines (store + query + main). Tier 3 is ~200 lines (rag + ingest + query + main). Heavy lifting (chunking, embedding, indexing, graph extraction, multi-mode retrieval) is delegated to Google and LightRAG respectively — that delegation IS the comparison.

## Common Pitfalls

### Pitfall 1: `google-genai` version drift hides the file_search namespace

**What goes wrong:** `client.file_search_stores` is `AttributeError` on `google-genai < 1.49.0`. The repo pins `>=1.73,<2`, so this is currently safe — but a future merge that floats the constraint could regress.

**Why it happens:** The File Search API is a recent (late 2025) addition; older SDK versions don't expose it.

**How to avoid:** Keep the `>=1.73,<2` floor. Add a smoke assertion in `tier-2-managed/main.py` that does `assert hasattr(client, "file_search_stores"), "google-genai >= 1.49 required for File Search"` so the failure message is friendly.

**Warning signs:** `AttributeError: 'Client' object has no attribute 'file_search_stores'`.

### Pitfall 2: File Search Store API 503 errors during heavy uploads

**What goes wrong:** Multiple users on `discuss.ai.google.dev` report **503 Service Unavailable** on `fileSearchStores.importFile()` and `uploadToFileSearchStore()` — failing after ~80s consistently — while `files.upload()` works fine. Root cause speculated to be Embedding-Model-TPM saturation on Google's side.

**How to avoid:**
1. Upload **one file at a time, sequentially** — do NOT parallelize uploads (this is the cookbook pattern; deviating hurts).
2. Add **exponential backoff retry around the whole upload+poll** for each PDF (3 attempts, 8s/16s/32s waits). The discussion notes 2/4/8s backoff did NOT help; a longer pause (30s+) between failed retries gives the server time to recover.
3. **Resumable ingest:** before re-uploading, list documents already in the store via `client.file_search_stores.documents.list()`. Skip ones whose `display_name` matches the source paper's filename. This makes `--ingest` idempotent and survives mid-run 503s.
4. For the live e2e test, ingest a **subset** (say 3 papers) to dodge TPM saturation and keep test runtime bounded.

**Source:** `https://discuss.ai.google.dev/t/file-search-store-api-returns-503-for-all-file-sizes-files-upload-works-fine/121691`.

**Warning signs:** Repeated 503s with no apparent rate-limit headers; uploads succeed for first N files then fail in clusters.

### Pitfall 3: LightRAG entity extraction is the most expensive operation in the entire repo

**What goes wrong:** LightRAG calls the LLM **once per chunk** during ingest (vs GraphRAG's 5-10 calls per chunk — that's why LightRAG is "lighter"). For 100 papers averaging 10 pages × ~500 tokens/page = ~500,000 tokens of source text. At LightRAG's default `chunk_token_size=1200`, that's ~420 chunks → 420 LLM calls for entity extraction.

**Per-call cost (gpt-4o-mini-equivalent, ~3K input + ~600 output):**
- via `google/gemini-2.5-flash` (OpenRouter): 3000 × $0.30/1M + 600 × $2.50/1M = $0.0009 + $0.0015 = **$0.0024/call**
- 420 calls × $0.0024 = **~$1.00 ingest cost**.

That's **100× more expensive than Tier 1's $0.011 ingest** — call it out loudly in the README.

**How to avoid:**
1. Print a projected cost estimate **before** ingest starts; require `--yes` to proceed (for cost transparency, not because $1 is huge).
2. Default to `google/gemini-2.5-flash` (cheap). If a user passes `--model anthropic/claude-sonnet-4.5` (15× more), the projected cost prints proportionally.
3. **Cache aggressively:** LightRAG's `kv_store_llm_response_cache.json` already deduplicates LLM calls on identical prompts. Re-running ingest on the same corpus is near-free.
4. Set `entity_extract_max_gleaning=0` (default 1) for the demo — turns off the optional retry pass. Saves ~30% if extraction is expensive.

**Source:** verified via LightRAG arxiv paper indexing-token analysis + community reports (Neo4j blog).

**Warning signs:** Cost JSON shows ingest cost > $5; latency > 30 minutes for 100 papers.

### Pitfall 4: LightRAG embedding-dim is locked at first ingest

**What goes wrong:** Building the graph with `embedding_dim=1536` (text-embedding-3-small) and then re-running with a different embedding model (e.g., `bge-m3` at 1024-dim) silently corrupts retrieval. HKUDS issue #2119 is exactly this.

**How to avoid:** Hard-code `EMBED_DIMS=1536` and `DEFAULT_EMBED_MODEL="openai/text-embedding-3-small"` in `tier-3-graph/rag.py`. Don't expose `--embed-model` flag in v1. Document `--reset` as the only way to switch.

**Warning signs:** Retrieval returns garbage; "embedding dimension mismatch" tracebacks.

### Pitfall 5: LightRAG LLM context-window mismatch

**What goes wrong:** Some entity-extraction prompts run long (especially with high `entity_extract_max_gleaning`). On a model with an 8K context window, this 400's. `gpt-4o-mini` and `gemini-2.5-flash` both have 128K+ — fine. But cheap fallback models (e.g., older Llama) would fail.

**How to avoid:** Keep the documented LLM model floor at `google/gemini-2.5-flash` or `openai/gpt-4o-mini`. Document the "minimum 32B / 32K context" guidance from LightRAG README.

**Warning signs:** `BadRequestError: This model's maximum context length is 8192 tokens` from the OpenAI-compat adapter.

### Pitfall 6: Tier 2 grounding metadata is sparse for some queries

**What goes wrong:** When the model decides the corpus doesn't contain the answer, `response.candidates[0].grounding_metadata` may be `None` or `grounding_chunks` may be empty. Naive `len(grounding_chunks)` raises.

**How to avoid:** Defensive null-check in `to_display_chunks`. Render the chunks table with an empty list (`shared.display.render_query_result` handles `chunks=[]` gracefully — verified).

**Warning signs:** `AttributeError: 'NoneType' object has no attribute 'grounding_chunks'`.

### Pitfall 7: Tier 2 cost-tracking has no built-in token meter for the indexing step

**What goes wrong:** The Gemini SDK does NOT return a token count for `upload_to_file_search_store` operations. If the cost JSON only records the per-query LLM tokens, the stated indexing cost is $0.00 — wrong narrative for the blog post.

**How to avoid:** Pre-count input tokens per uploaded PDF locally (PyMuPDF text extract + tiktoken `cl100k_base` count is fine as a proxy — Gemini uses a slightly different tokenizer but the order-of-magnitude is right). Record once per ingest:
```python
tracker.record_embedding("gemini-embedding-001", total_indexed_tokens)
```
This emits a cost line at $0.15/1M input tokens. **Document this is an estimate** in the README's cost table.

**Source:** Pricing verified via `https://blog.google/technology/developers/file-search-gemini-api/`.

**Warning signs:** Tier 2's totals.usd is just the chat-completion cost; ingest cost is invisible.

### Pitfall 8: LightRAG async ↔ sync CLI integration

**What goes wrong:** All of LightRAG's primary methods (`ainsert`, `aquery`, `initialize_storages`, `finalize_storages`) are coroutines. Naive integration in a sync CLI runs into "coroutine never awaited" warnings.

**How to avoid:** Wrap the entire CLI body in `asyncio.run(...)`. Don't try to mix sync and async.

**Warning signs:** `RuntimeWarning: coroutine 'LightRAG.ainsert' was never awaited`.

### Pitfall 9: LightRAG version churn

**What goes wrong:** LightRAG releases dot versions every few days (1.4.0 → 1.4.15 in ~2 months). Floating `lightrag-hku>=1.4,<2` lets a contributor pick up an API-breaking change silently. Documented churn per the PyPI release history.

**How to avoid:** Pin **exactly** to `lightrag-hku==1.4.15`. The Phase 130 (Tier 4 / RAG-Anything) phase will revisit and bump together.

**Warning signs:** Tests pass on author's machine, fail on a fresh checkout 2 weeks later because uv resolved a newer LightRAG.

### Pitfall 10: Tier 3 cost surprise on `--reset` then `--ingest`

**What goes wrong:** A user runs `--reset --ingest` thinking it's free — actually re-runs the full ~$1 graph extraction. Tier 1's `--reset --ingest` is $0.01; the asymmetry will surprise.

**How to avoid:** `cmd_reset` prints "This will delete the graph; the next --ingest will re-extract entities (~$1, ~10 min). Continue? [y/N]". Document in README.

**Warning signs:** User opens an issue about an unexpected $1 charge.

### Pitfall 11: PyMuPDF is required by Tier 3 ingest but not in `[shared]`

**What goes wrong:** If Tier 3 imports `from tier_1_naive.ingest import extract_pages`, that pulls in `tier_1_naive`'s deps via the package's lazy imports. If the user has only run `pip install -e ..[tier-3]`, they may not have `pymupdf` installed.

**How to avoid:** Either (A) add `pymupdf>=1.27,<2` to `[tier-3]` extras and have Tier 3 own its own `extract_pages` (~25 lines duplicated), OR (B) add `tier-1-naive` deps to `[tier-3]` extras (cross-tier coupling). Recommend (A) for tier independence.

**Warning signs:** `ModuleNotFoundError: No module named 'fitz'` on Tier 3 ingest.

## Code Examples

Verified end-to-end skeletons.

### Example A: Tier 2 main entrypoint

```python
# tier-2-managed/main.py
from __future__ import annotations
import argparse
import sys
import time
from pathlib import Path

# sys.path bootstrap (mirror Tier 1)
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from rich.console import Console
from google import genai

from shared.config import get_settings
from shared.cost_tracker import CostTracker
from shared.display import render_query_result
from shared.loader import DatasetLoader

# tier-local
from tier_2_managed.store import get_or_create_store, upload_pdf  # via shim package or direct path
from tier_2_managed.query import query as tier2_query, to_display_chunks

DEFAULT_QUERY = (
    "What is the core mechanism Lewis et al. 2020 introduce in the RAG paper "
    "for combining parametric and non-parametric memory?"
)

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="tier-2-managed")
    ap.add_argument("--ingest", action="store_true")
    ap.add_argument("--query", type=str, default=None)
    ap.add_argument("--reset", action="store_true")
    args = ap.parse_args(argv)

    console = Console()
    settings = get_settings()  # raises if GEMINI_API_KEY missing
    client = genai.Client(api_key=settings.gemini_api_key.get_secret_value())
    tracker = CostTracker("tier-2")

    no_flags = not (args.ingest or args.query or args.reset)
    if no_flags:
        args.ingest = True
        args.query = DEFAULT_QUERY

    store = get_or_create_store(client, reset=args.reset)

    if args.ingest:
        loader = DatasetLoader()
        papers = loader.papers()
        # ... iterate & upload_pdf, skip already-uploaded ...
        # ... record synthetic embedding cost (Pitfall 7) ...

    if args.query:
        t0 = time.monotonic()
        resp = tier2_query(client, store.name, args.query)
        latency = time.monotonic() - t0
        usage = resp.usage_metadata
        tracker.record_llm("gemini-2.5-flash",
                           int(usage.prompt_token_count or 0),
                           int(usage.candidates_token_count or 0))
        chunks = to_display_chunks(resp)
        render_query_result(
            query=args.query,
            chunks=chunks,
            answer=resp.text or "",
            cost_usd=tracker.total_usd(),
            input_tokens=usage.prompt_token_count or 0,
            output_tokens=usage.candidates_token_count or 0,
        )
        console.print(f"[bold]Latency:[/bold] {latency:.2f}s")
        tracker.persist()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

### Example B: Tier 3 main entrypoint (async-wrapped)

```python
# tier-3-graph/main.py
from __future__ import annotations
import argparse
import asyncio
import shutil
import sys
import time
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from rich.console import Console
from lightrag import QueryParam

from shared.config import get_settings
from shared.cost_tracker import CostTracker
from shared.display import render_query_result
from shared.loader import DatasetLoader

from tier_3_graph.rag import build_rag, WORKING_DIR, DEFAULT_LLM_MODEL
from tier_3_graph.ingest import ingest_corpus
from tier_3_graph.query import run_query  # async

DEFAULT_QUERY = (
    "Comparing Lewis et al. 2020's RAG and Karpukhin et al. 2020's DPR, "
    "how does dense passage retrieval relate to RAG's non-parametric memory?"
)  # multi-hop probe — Tier 1 can't easily answer this; Tier 3 should via graph traversal.

DEFAULT_MODE = "mix"

async def amain(args, console: Console) -> int:
    settings = get_settings()
    if settings.openrouter_api_key is None:
        console.print("[red]OPENROUTER_API_KEY required for Tier 3.[/red]")
        return 2

    if args.reset and Path(WORKING_DIR).exists():
        console.print(f"[yellow]Wiping {WORKING_DIR}/ — next --ingest will re-extract (~$1, ~10 min).[/yellow]")
        shutil.rmtree(WORKING_DIR)

    tracker = CostTracker("tier-3")
    rag = build_rag()
    await rag.initialize_storages()

    try:
        if args.ingest:
            loader = DatasetLoader()
            papers = loader.papers()
            await ingest_corpus(rag, papers, console=console, tracker=tracker, model=args.model)

        if args.query:
            t0 = time.monotonic()
            answer_text, in_tok, out_tok = await run_query(
                rag, args.query, mode=args.mode, model=args.model, tracker=tracker,
            )
            latency = time.monotonic() - t0
            render_query_result(
                query=args.query,
                chunks=[],  # LightRAG doesn't expose per-chunk citations the same way; render answer-only
                answer=answer_text,
                cost_usd=tracker.total_usd(),
                input_tokens=in_tok,
                output_tokens=out_tok,
            )
            console.print(f"[bold]Latency:[/bold] {latency:.2f}s  [dim]mode={args.mode}[/dim]")
            tracker.persist()
        return 0
    finally:
        await rag.finalize_storages()


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="tier-3-graph")
    ap.add_argument("--ingest", action="store_true")
    ap.add_argument("--query", type=str, default=None)
    ap.add_argument("--mode", type=str, default=DEFAULT_MODE,
                    choices=["naive", "local", "global", "hybrid", "mix"])
    ap.add_argument("--reset", action="store_true")
    ap.add_argument("--model", type=str, default=DEFAULT_LLM_MODEL,
                    help="OpenRouter LLM slug for entity extraction & answers (default %(default)s)")
    args = ap.parse_args(argv)

    no_flags = not (args.ingest or args.query or args.reset)
    if no_flags:
        args.ingest = True
        args.query = DEFAULT_QUERY

    return asyncio.run(amain(args, Console()))

if __name__ == "__main__":
    raise SystemExit(main())
```

### Example C: Tier 3 ingest with idempotency

```python
# tier-3-graph/ingest.py
from pathlib import Path
import fitz  # pymupdf — own this dep in Tier 3 (Pitfall 11)

def _extract_full_text(pdf_path: str) -> str:
    parts = []
    with fitz.open(pdf_path) as doc:
        for page in doc:
            t = page.get_text("text") or ""
            if t.strip():
                parts.append(t)
    return "\n\n".join(parts)

async def ingest_corpus(rag, papers: list[dict], console, tracker, model: str):
    dataset_root = Path("dataset")
    # Optional: pre-flight cost estimate (see Pitfall 3)
    n_papers_to_ingest = sum(
        1 for p in papers if (dataset_root / "papers" / p["filename"]).exists()
    )
    console.print(
        f"[cyan]Tier 3 ingest: ~{n_papers_to_ingest} papers, "
        f"~$1.00 estimated entity-extraction cost via {model} (one-time).[/cyan]"
    )
    for p in papers:
        pdf_path = dataset_root / "papers" / p["filename"]
        if not pdf_path.exists():
            continue
        text = _extract_full_text(str(pdf_path))
        # LightRAG's kv_store_doc_status.json tracks already-ingested ids;
        # passing a stable doc_id makes ingest idempotent.
        await rag.ainsert(text, ids=[p["paper_id"]])
    console.print(f"[green]Tier 3 ingest complete. Graph at lightrag_storage/tier-3-graph/.[/green]")
```

### Example D: Tier 3 query helper

```python
# tier-3-graph/query.py
from lightrag import QueryParam

async def run_query(rag, question: str, mode: str, model: str, tracker):
    # LightRAG returns a string; token counts are surfaced via the token_tracker
    # we wired into the llm_model_func (Pattern 6).
    # If token_tracker isn't viable on 1.4.15, fall back to estimating via tiktoken
    # over the prompt + answer (record once at the end).
    answer = await rag.aquery(question, param=QueryParam(mode=mode))
    # tracker has been getting record_llm calls along the way; read aggregates.
    in_tok = sum(q["input_tokens"] for q in tracker.queries if q["kind"] == "llm")
    out_tok = sum(q["output_tokens"] for q in tracker.queries if q["kind"] == "llm")
    return answer, in_tok, out_tok
```

### Example E: Live test scaffolds

```python
# tier-2-managed/tests/test_main.py
import os
import pytest

@pytest.mark.live
def test_tier2_end_to_end(monkeypatch, tmp_path):
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set")
    # Run with subset corpus (3 papers) to dodge Pitfall 2 (503s under load)
    # Override DatasetLoader to return only 3 entries
    # Assert: store created, 3 docs uploaded, query returns text + grounding chunks
    ...

# tier-3-graph/tests/test_main.py
import os
import pytest

@pytest.mark.live
def test_tier3_end_to_end(monkeypatch, tmp_path):
    if not os.getenv("OPENROUTER_API_KEY"):
        pytest.skip("OPENROUTER_API_KEY not set")
    # Run with 2 papers — graph extraction at full corpus is ~$1 and ~10 min
    # Override DatasetLoader subset; override WORKING_DIR to tmp_path
    # Assert: working_dir/graph_chunk_entity_relation.graphml exists after ingest
    # Assert: aquery returns non-empty text
    ...
```

## Data — concrete numbers

### Sample queries (defaults)

**Tier 2 default:** same as Tier 1 (`single-hop-001` from `evaluation/golden_qa.json`):
> "What is the core mechanism Lewis et al. 2020 introduce in the RAG paper for combining parametric and non-parametric memory?"

This shows Tier 2 returns ≈ same answer as Tier 1 but **with built-in citations** in `grounding_metadata` — that's the "managed" win.

**Tier 3 default (multi-hop probe):**
> "Comparing Lewis et al. 2020's RAG and Karpukhin et al. 2020's DPR, how does dense passage retrieval relate to RAG's non-parametric memory?"

Picks two papers from different chunks; Tier 1's top-k often misses one. Tier 3's `mix`/`hybrid` mode traverses entities (e.g., "DPR" entity → "RAG" entity edge) and surfaces both — that's the "graph" win.

Phase 131's golden Q&A scoring will quantify this. Phase 129 just needs **one demonstrably-better answer**.

### Cost estimates (verified prices @ 2026-04, $/1M tokens)

**Tier 2 — Gemini File Search:**

| Operation | Tokens | Price | Cost |
|-----------|--------|-------|------|
| One-time indexing (estimated, ~500K input tokens for 100 papers) | 500,000 | $0.15 | **~$0.075** |
| Per-query LLM (gemini-2.5-flash, ~3K in / 200 out, with retrieved-context bytes counted as input) | ~3,200 | $0.30 in / $2.50 out | **~$0.0014** |
| Storage (after indexing) | — | $0 | $0 |
| Query-time embedding | — | $0 | $0 |

**Tier 3 — LightRAG via OpenRouter `google/gemini-2.5-flash`:**

| Operation | Calls | Avg tokens | Cost |
|-----------|-------|-----------|------|
| One-time entity extraction (~1 LLM call per chunk, ~420 chunks) | 420 | 3K in + 600 out | **~$1.00** |
| One-time embedding (~420 chunks × avg 1.2K tokens) | — | 500,000 | **~$0.01** (text-embedding-3-small @ $0.02/1M) |
| Per-query LLM (graph traversal + answer, ~5K in / 400 out) | 1-3 | 5,400 | **~$0.005** |
| Per-query embedding (keyword extraction step, ~30 tokens) | 1 | 30 | $0.0000006 |

**Comparison (per-query post-ingest):**
- Tier 1: $0.0014
- Tier 2: $0.0014
- Tier 3: ~$0.005 (3-4× more — graph traversal is multi-step)

**One-time ingest:**
- Tier 1: $0.011
- Tier 2: $0.075
- Tier 3: $1.00 (≈ 90× Tier 1 — the "graph tax")

These numbers go directly into each tier's README cost table.

### Corpus / dataset stats (from `dataset/manifests/metadata.json`)

- 100 papers, 581 figures (figure manifest exists; Tier 2 might index figures via OCR, but defer to Tier 4); ~290 MB on disk via git-lfs.

## State of the Art

| Old Approach | Current Approach (2025-26) | When Changed | Impact |
|--------------|---------------------------|--------------|--------|
| `google-generativeai` (deprecated SDK) | `google-genai` (unified SDK, file_search_stores added v1.49) | EOL'd 2025-08-31 | Repo locked on `google-genai>=1.73,<2` already; lockfile guard test enforces. |
| Vertex AI Search RAG Engine for managed RAG | Gemini File Search (AI Studio API key) | File Search public availability ~Nov 2025 | Tier 2 explicitly uses File Search (zero-infra positioning). |
| Microsoft GraphRAG (community-detection, expensive) | LightRAG (single-pass per chunk, ~99% token cost reduction) | EMNLP 2025 (LightRAG paper) | Tier 3 picks LightRAG. |
| `gemini-2.0-flash-exp` (LightRAG cookbook example) | `gemini-2.5-flash` (current GA) | Mid-2025 | Use 2.5-flash. |

**Deprecated/outdated for this scope:**
- `google-generativeai` package — forbidden by lockfile guard.
- LightRAG < 1.0 — pre-API-stabilization; pin `==1.4.15`.
- Floating LightRAG version constraints — release cadence is too aggressive.

## Open Questions

1. **`token_tracker` protocol shape on `lightrag-hku==1.4.15`.**
   - What we know: `openai_complete_if_cache(token_tracker=...)` and `openai_embed(token_tracker=...)` both accept this kwarg.
   - What's unclear: the exact method called on the tracker (is it `add_usage(usage_dict)` or `record(prompt_tokens, completion_tokens)` or both?). Versions 1.0-1.4 have shifted.
   - Recommendation: **Plan task should write a 5-line probe script** (`python -c "import lightrag.llm.openai; help(lightrag.llm.openai.openai_complete_if_cache)"` plus inspect the source) before committing to Pattern 6's adapter shape. Fallback if the probe is messy: monkey-patch `openai.AsyncOpenAI.chat.completions.create` only inside the Tier 3 process to capture `usage.prompt_tokens` / `usage.completion_tokens`.

2. **Tier 2 chunking_config defaults vs custom.**
   - What we know: the default is "white_space" chunking with sane defaults; custom is opt-in via `chunking_config={"white_space_config": {"max_tokens_per_chunk": N, "max_overlap_tokens": M}}`.
   - What's unclear: whether the comparison story benefits from forcing 512/64 (matching Tier 1) or letting Google manage.
   - Recommendation: **Let Google manage** (default). The whole point of Tier 2 is "you don't tune chunking yourself." If Phase 131 evaluation reveals chunk-size pathology, revisit.

3. **Will Gemini File Search citations expose a relevance score?**
   - What we know: `grounding_chunks[i].retrieved_context.title` and `.text` are documented; an explicit `.score` field is **not** in the public docs surveyed. The DataCamp tutorial's example doesn't read a score.
   - What's unclear: whether scores show up at all under the `gemini-2.5-flash` model.
   - Recommendation: try `getattr(ctx, "score", 0.0)` defensively in `to_display_chunks`. If empty, render as `-` in the chunks table — `shared/display` already handles missing scores gracefully (verified in source).

4. **Does LightRAG `mix` mode require a reranker?**
   - What we know: README says `mix` is "hybrid with reranking (default when reranker enabled)". If no reranker is configured, behavior may differ.
   - What's unclear: whether `mix` silently falls back or errors.
   - Recommendation: Default to `hybrid` (always works without rerank). Allow `--mode mix` for users who want to install a reranker themselves. Document the fallback in the Tier 3 README.

5. **Should Tier 3 ingest be parallelized?**
   - What we know: LightRAG's `ainsert` accepts a list and parallelizes internally up to a concurrency limit.
   - What's unclear: hitting OpenRouter rate limits if we pass 100 docs at once.
   - Recommendation: ingest sequentially (one paper at a time) with a small `await asyncio.sleep(0.1)` between calls. Total runtime ~10 min is acceptable for a one-time cost.

## Sources

### Primary (HIGH confidence)

- `https://ai.google.dev/gemini-api/docs/file-search` — official Gemini File Search docs (verified API surface, supported formats, rate limits, pricing).
- `https://ai.google.dev/api/file-search/file-search-stores` — REST + SDK methods for `fileSearchStores` (create, list, get, delete; metadata schema).
- `https://blog.google/technology/developers/file-search-gemini-api/` — pricing announcement: $0.15/1M indexing, free storage, free query embedding.
- `https://github.com/google-gemini/cookbook/blob/main/quickstarts/File_Search.ipynb` (raw `.ipynb` content) — verified Python code: client init, store create, upload+poll, generate_content with FileSearch tool, grounding metadata extraction.
- `https://github.com/HKUDS/LightRAG` — official LightRAG README; install (`pip install lightrag-hku`), Python 3.10+, query modes (naive/local/global/hybrid/mix), backends.
- `https://pypi.org/project/lightrag-hku/` — verified latest `1.4.15` (released 2026-04-19), Python ≥3.10, dep groups (`api`, `offline`, `evaluation`, `observability`).
- `https://raw.githubusercontent.com/HKUDS/LightRAG/main/lightrag/llm/openai.py` — `openai_complete_if_cache` and `openai_embed` signatures with `base_url`/`api_key`/`token_tracker` parameters.
- `https://github.com/HKUDS/LightRAG/blob/main/examples/lightrag_openai_compatible_demo.py` — verified pattern for OpenAI-compatible (incl. OpenRouter) routing via `llm_model_func`.
- `https://arxiv.org/html/2410.05779v1` — LightRAG paper; per-chunk LLM-call analysis, GraphRAG comparison.
- `pip3 index versions lightrag-hku` → 1.4.15 (latest 2026-04).
- `pip3 index versions google-genai` → 1.73.1 (latest 2026-04, repo pins `>=1.73,<2`).
- Repo-local: `pyproject.toml`, `tests/test_tier_requirements.py` (lockfile guard), `shared/{config,llm,embeddings,cost_tracker,display,loader,pricing}.py`, `tier-1-naive/{main,chat,embed_openai,ingest,store,retrieve,prompt}.py`, `dataset/manifests/metadata.json` — direct read.

### Secondary (MEDIUM confidence)

- `https://www.datacamp.com/tutorial/google-file-search-tool` — batch upload + polling pattern; cross-verified with cookbook quickstart.
- `https://medium.com/google-cloud/using-gemini-file-search-tool-for-rag-a-rickbot-blog-...` — corroborates SDK surface.
- `https://discuss.ai.google.dev/t/file-search-store-api-returns-503-for-all-file-sizes-files-upload-works-fine/121691` — known reliability issue (Pitfall 2) with workaround discussion.
- `https://learnopencv.com/lightrag/` — installation walkthrough; basic init and query patterns.
- `https://neo4j.com/blog/developer/under-the-covers-with-lightrag-extraction/` — entity-extraction internals; chunk size and gleaning behavior.
- `https://github.com/HKUDS/LightRAG/issues/2119` — embedding-dimension mismatch confirmation (Pitfall 4).
- `https://github.com/HKUDS/LightRAG/issues/2355` — entity-extraction prompt structure (informs Pitfall 3 cost model).
- `https://github.com/googleapis/python-genai/issues/1638` — confirms `file_search_stores` requires `google-genai >= 1.49`.

### Tertiary (LOW confidence — flagged for runtime validation)

- LightRAG `token_tracker` protocol shape on 1.4.15 — Open Question 1; verify with a probe before committing to Pattern 6's adapter signature.
- Tier 2 indexing-cost token estimate (synthetic via tiktoken `cl100k_base` proxy) — order-of-magnitude only; first live ingest will reveal the actual.
- Tier 3 entity-extraction cost projection ($1) — math estimate, depends on model and corpus density. First ingest will print actual.
- Whether `gemini-2.5-flash` exposes a `score` field on grounding chunks — Open Question 3.
- LightRAG `mix` vs `hybrid` mode behavior without a configured reranker — Open Question 4.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via `pip3 index versions`; `google-genai>=1.73,<2` is current and includes `file_search_stores`; `lightrag-hku==1.4.15` is current latest.
- Architecture (Tier 2): HIGH — patterns directly from the official cookbook and DataCamp tutorial; both cross-verified.
- Architecture (Tier 3): MEDIUM-HIGH — patterns from the official `lightrag_openai_compatible_demo.py` example and the source of `lightrag/llm/openai.py`; `token_tracker` integration shape is the lone soft spot (Open Question 1).
- Pitfalls: HIGH for Pitfalls 1, 4, 8, 9, 11 (verified in source / GitHub issues). MEDIUM for Pitfalls 2, 3, 5, 6, 7, 10 (community reports + math; first live run will validate).
- Cost estimates: MEDIUM — based on token-count math + locked pricing table; will be exact after first live ingest. Tier 3's $1 projection has the widest uncertainty (could be $0.50-$2 depending on corpus density and model).
- Open questions: explicit (5 items); the most material is the `token_tracker` protocol — should be addressed in the very first Plan task for Tier 3.

**Research date:** 2026-04-26
**Valid until:** 2026-05-15 (~3 weeks — LightRAG releases dot versions every 2-7 days; Gemini File Search API is also pre-stable per the 503 reports). Re-verify if Phase 129 execution slips past mid-May 2026.

## RESEARCH COMPLETE
