# Phase 128: Tier 1 Naive RAG — Research

**Researched:** 2026-04-26
**Domain:** Naive RAG pipeline (PDF → chunks → embeddings → ChromaDB → top-k → LLM answer) with cost/latency tracking
**Confidence:** HIGH (stack, ChromaDB API, OpenAI embeddings, PyMuPDF) / MEDIUM (chunk-size tradeoffs, exact ingest cost prediction)

> **Note on upstream input:** No CONTEXT.md exists for Phase 128 (no `/gsd:discuss-phase` was run). Per the orchestrator brief, this RESEARCH.md treats ROADMAP + REQUIREMENTS + the verified Phase 127 `shared/` surface as the locked source of truth. The "User Constraints" section below is reconstructed from those locked artifacts plus the orchestrator's explicit sub-decisions (e.g. embedding-vendor conflict resolution).

<user_constraints>
## User Constraints (from ROADMAP + REQUIREMENTS + Phase 127 outputs)

### Locked Decisions

**From ROADMAP.md Phase 128 success criteria:**
- `python tier-1-naive/main.py` ingests the enterprise KB into ChromaDB and answers a sample query with sourced output.
- ChromaDB index persists to disk and can be reused by Tier 5.
- Cost and latency are printed for the demo query.

**From REQUIREMENTS.md TIER-01:**
- ChromaDB + **OpenAI embeddings**, basic vector similarity retrieval against the enterprise KB.

**From Phase 127 outputs (must be honored — already shipped):**
- `shared/config.py`: lazy `get_settings()` factory; `GEMINI_API_KEY` REQUIRED, `OPENAI_API_KEY` optional.
- `shared/embeddings.py`: Gemini `_GeminiEmbeddingClient` (won't be used in Tier 1 per the OpenAI-embeddings spec).
- `shared/llm.py`: Gemini `_GeminiLLMClient` returning `LLMResponse(text, input_tokens, output_tokens, model)`.
- `shared/pricing.py`: PRICES table already includes `text-embedding-3-small` ($0.02/1M) and `text-embedding-3-large` ($0.13/1M); `gemini-2.5-flash` is the default chat model.
- `shared/cost_tracker.py`: `CostTracker(tier).record_llm()` / `record_embedding()` / `persist()` — D-13 schema is fixed.
- `shared/display.py:render_query_result(query, chunks, answer, cost_usd, input_tokens, output_tokens)` — Tier 1 must use this for output.
- `shared/loader.py:DatasetLoader().papers()` returns 100 entries with `paper_id`, `title`, `filename`, `arxiv_id`, `authors`, `year`, `abstract`.
- Dataset: 100 PDFs at `dataset/papers/` (~185 MB via git-lfs).
- Golden Q&A: 30 entries at `evaluation/golden_qa.json` (each has `id`, `question`, `expected_answer`, `source_papers`, `modality_tag`, `hop_count_tag`).
- `pyproject.toml` has `[project.optional-dependencies] tier-1 = ["rag-architecture-patterns[shared]"]` — Tier 1 phase MUST extend this group with `chromadb` + `openai` + `pymupdf`.
- `tier-1-naive/requirements.txt` already exists with `-e ..[tier-1]`.
- `.env.example` marks `OPENAI_API_KEY` as optional for tier-2/5.
- Test marker `live` is registered in `pyproject.toml`; `tests/conftest.py` exposes `live_keys_ok` fixture.
- `.gitignore` already lists `chroma_db/` — the canonical persistence directory name is therefore **`chroma_db/`**.

**Resolved sub-decision: embedding vendor (per orchestrator brief — Option A)**
- Tier 1 uses **OpenAI `text-embedding-3-small`** (1536 dims) — honors the explicit TIER-01 spec.
- This requires:
  - Adding `openai>=1.50,<3` to the `[tier-1]` optional-dependency group.
  - Adding a Tier-1-local OpenAI embedding helper (do NOT modify `shared/embeddings.py`, which Phase 127 ships as Gemini-backed and other tiers/smoke test depend on).
  - Updating `.env.example` to mark `OPENAI_API_KEY` as **REQUIRED for tier-1, tier-2, tier-5** (it was already optional; promote the comment, do not re-key).
  - Updating `shared/config.py` is NOT needed — `openai_api_key` is already declared as `SecretStr | None`. Tier 1 calls `get_settings()` and asserts the field is non-None at startup with a clear error (`"OPENAI_API_KEY required for Tier 1; see .env.example"`).

**Resolved sub-decision: answer LLM**
- Tier 1's answer LLM defaults to **Gemini via `shared/llm.get_llm_client()`** (`gemini-2.5-flash`) — consistent with the Phase-127 default stack. Rationale: cheaper than gpt-4o-mini at the comparison budget; keeps the answer-generation surface uniform across tiers so the blog post compares retrieval architectures, not chat models. The OpenAI dependency is therefore strictly for embeddings.

### Claude's Discretion

- Exact chunk size and overlap (recommend 512 tokens / 64 token overlap — see Pitfall 1).
- Persistence subdirectory layout under `chroma_db/` (recommend `chroma_db/tier-1-naive/` so Tier 5 can either reuse it or open its own subdir).
- Collection name (recommend `enterprise_kb_naive`).
- CLI argument shape (recommend `--ingest`, `--query "..."`, `--top-k 5`, `--reset`; default action when no flags = run a canned query).
- Sample default query (recommend `single-hop-001` from golden_qa.json — the RAG paper question).
- README layout (quickstart, expected cost, known weaknesses).
- Whether to expose ingest as a separate CLI vs subcommand of main.py (recommend single main.py with flags — matches roadmap success criterion 1 verbatim).

### Deferred Ideas (OUT OF SCOPE for Phase 128)

- Hybrid retrieval (BM25 + vector) — would dilute the "naive baseline" framing; Tier 3 / 5 territory.
- Reranking (cross-encoder, Cohere rerank) — explicitly absent from naive baseline.
- Query rewriting / HyDE — not in TIER-01 spec; Tier 5 explores agentic patterns.
- Evaluation harness (RAGAS, golden Q&A scoring) — Phase 131 (EVAL-01..04).
- Multimodal: figure embeddings, image-to-text — Phase 130 / Tier 4.
- Docker / Colab packaging — REPO-05 / REPO-07 deferred to later milestones.
- Multi-tenant ChromaDB / remote ChromaDB server mode — local PersistentClient only.
- Embedding cache reuse across runs — accept the ~$0.50 ingest cost as a one-time hit; idempotent ingest skips re-embedding when the collection is already populated.
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TIER-01 | Tier 1 (Naive RAG) with ChromaDB + OpenAI embeddings, basic vector similarity retrieval against enterprise KB | ChromaDB 1.5.8 PersistentClient (verified `pip3 index versions chromadb`); OpenAI Python SDK 2.32 (`pip3 index versions openai`); `text-embedding-3-small` 1536d $0.02/1M tokens (OpenAI docs); PyMuPDF 1.27 already in `[curation]` group, lift to `[tier-1]` |

## Summary

Phase 128 implements the simplest end-to-end RAG pipeline: load 100 PDFs from `dataset/papers/`, extract text per page with PyMuPDF, chunk into ~512-token windows with ~64-token overlap, embed each chunk with OpenAI `text-embedding-3-small`, persist to a local ChromaDB `PersistentClient` collection (cosine distance, HNSW), and at query time embed the question, retrieve top-k chunks, stuff them into a Gemini `gemini-2.5-flash` prompt, and render the result with `shared/display.py`. Cost and latency are tracked per-call via `shared/cost_tracker.py` and printed at the end.

The architecture is intentionally "naive": no reranking, no query expansion, no hybrid retrieval, no multimodal handling. That naivety is the point — Tier 1 is the baseline against which Tiers 2-5 prove their value in the blog post. The known weaknesses (multi-hop failures, citation chain blindness, image-question failures) are features, not bugs: each one motivates a later tier.

The only material decision the user must accept is the embedding-vendor reconciliation (Option A from the orchestrator brief): TIER-01 says "OpenAI embeddings" explicitly, so Tier 1 calls OpenAI directly for embeddings while still using Gemini for answer generation via `shared/llm`. This requires (1) adding `openai` to the `[tier-1]` dep group, (2) promoting `OPENAI_API_KEY` from "optional, tier-2/5" to "required for tier-1/2/5" in `.env.example`, and (3) writing a small tier-local OpenAI embedding wrapper (do NOT modify `shared/embeddings.py`, which is Gemini-only and other tiers depend on it).

**Primary recommendation:** `chromadb==1.5.8` `PersistentClient(path="chroma_db/tier-1-naive")` with `configuration={"hnsw":{"space":"cosine"}}` (the new 1.0+ API — collection metadata `hnsw:` prefix is deprecated but still works); pre-compute embeddings in batches of 100 chunks via `openai.embeddings.create(model="text-embedding-3-small", input=batch)` and pass them via `collection.add(embeddings=...)` (do NOT register `OpenAIEmbeddingFunction` on the collection — pre-computing keeps cost tracking auditable). Persist `chroma_db/` is git-ignored already; Tier 5 reads from the same path. CLI uses one entrypoint `tier-1-naive/main.py` with `--ingest` (idempotent — skip if `collection.count() > 0`), `--query "…"`, `--top-k 5`, and `--reset`.

## Architectural Responsibility Map

| Capability | Where it lives | Why |
|------------|---------------|-----|
| PDF page-by-page text extraction | `tier-1-naive/ingest.py:extract_pages(pdf_path)` | PyMuPDF stays Tier-1-local; Tier 4 will need a different (multimodal) extractor anyway |
| Chunking (512 tokens / 64 overlap) | `tier-1-naive/ingest.py:chunk_text(text, paper_id, page)` | Tier-specific; later tiers may chunk differently (e.g., Graph RAG by entity) |
| OpenAI embedding | `tier-1-naive/embed_openai.py:embed_batch(texts)` | Tier-1-local — DO NOT touch `shared/embeddings.py` (Gemini-only, other tiers use it) |
| Vector store | `chromadb.PersistentClient(path="chroma_db/tier-1-naive")` | Local persistence; Tier 5 reads same path |
| Retrieval | `collection.query(query_embeddings=[v], n_results=k)` | Standard ChromaDB pattern |
| Answer generation | `shared/llm.get_llm_client().complete(prompt)` | Reuse Gemini-default; consistent across tiers |
| Cost tracking | `shared/cost_tracker.CostTracker("tier-1")` | Existing D-13 schema |
| Output rendering | `shared/display.render_query_result(...)` | Existing rich-based renderer |
| Dataset loading | `shared/loader.DatasetLoader().papers()` | Existing manifest reader |
| CLI orchestration | `tier-1-naive/main.py` | Single entrypoint; matches success criterion 1 verbatim |

## Standard Stack

### Core (verified versions, current as of 2026-04-26)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `chromadb` | `>=1.5.8,<2` | Local persistent vector store | Default RAG vector DB in 2025-26 ecosystem; embeddable, no server, file-based persistence; HNSW index `[VERIFIED: pip3 index versions chromadb → 1.5.8 latest 2026-04]` |
| `openai` | `>=1.50,<3` | OpenAI Python SDK for `text-embedding-3-small` | Reference SDK; `client.embeddings.create()` is stable across 1.x and 2.x. Pin generously so future bumps don't require Tier-1 rework `[VERIFIED: pip3 index versions openai → 2.32.0 latest, 1.45 already installed]` |
| `pymupdf` | `>=1.27,<2` | PDF text extraction page-by-page | Already pinned in `[curation]` group; lift to `[tier-1]`; 10-50× faster than pdfminer for text; preserves page numbers for citation metadata `[VERIFIED: pip3 index versions pymupdf → 1.27.2.3]` |
| `tiktoken` | `>=0.10,<1` | Token counting for OpenAI embedding cost calc | Already in `[shared]` group; needed because OpenAI embedding API doesn't return usage per call to mid-size SDKs reliably (returns prompt_tokens though — see Pitfall 5) `[VERIFIED: already in pyproject.toml]` |
| `rich` | `>=14,<16` | Display layer (already imported by `shared/display`) | Transitive — already in `[shared]` |
| `google-genai` | `>=1.73,<2` | Answer LLM via `shared/llm` | Transitive — already in `[shared]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pytest` | `>=8.4,<9` | Test runner | Already in `[dependency-groups.test]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `chromadb.PersistentClient` | `faiss-cpu` + pickle | FAISS is faster at >1M vectors but has no metadata filtering, no built-in persistence story, no rich query API. Naive RAG needs the metadata (paper_id, page, chunk_idx) — Chroma wins. |
| `text-embedding-3-small` (1536d) | `text-embedding-3-large` (3072d) | Large is ~6.5× more expensive ($0.13 vs $0.02 per 1M tokens) for ~2-3 percentage-point MTEB gain. Naive baseline; small is the right choice — and the blog narrative ("naive is naive") benefits from the smaller embedding. |
| `OpenAIEmbeddingFunction` registered on collection | Pre-compute embeddings, pass via `collection.add(embeddings=...)` | The function approach is one line shorter but hides cost tracking inside ChromaDB internals. Pre-compute lets `CostTracker` see every batch and is the auditable choice for a blog post about cost transparency. |
| `pymupdf4llm` (markdown output) | Plain `page.get_text()` | `pymupdf4llm` is great but adds a dep + complexity for naive baseline. Plain text is intentional simplicity; figures/tables get mangled — that's a Tier 4 problem. |
| LangChain `RecursiveCharacterTextSplitter` | Roll-your-own simple token splitter | LangChain is a 200MB transitive-dep nightmare for a 30-line splitter. Hand-roll a small token-aware splitter using `tiktoken` (already a dep). |
| LlamaIndex / Haystack framework | Direct ChromaDB + OpenAI calls | Frameworks obscure the point of the blog post (architecture decisions). Direct API calls show the seams and motivate the higher tiers. |

**Installation (after Phase 128 completes):**
```bash
cd tier-1-naive && uv pip install -e ..[tier-1]
# Or, equivalently with pip:
cd tier-1-naive && pip install -r requirements.txt
```

**Updates required to existing files:**
- `pyproject.toml` `[project.optional-dependencies] tier-1`:
  ```toml
  tier-1 = [
    "rag-architecture-patterns[shared]",
    "chromadb>=1.5.8,<2",
    "openai>=1.50,<3",
    "pymupdf>=1.27,<2",
  ]
  ```
- `.env.example` — change comment from "OPTIONAL: ... for Tier 2 ... and Tier 5" to "REQUIRED for Tier 1 (embeddings), Tier 2 (Managed File Search), Tier 5 (Agentic)". Leave the empty default (`OPENAI_API_KEY=`) — it's a placeholder.

## Architecture Patterns

### Recommended Project Structure

```
tier-1-naive/
├── README.md                  # Quickstart, expected cost, known weaknesses
├── requirements.txt           # already exists — `-e ..[tier-1]`
├── main.py                    # CLI entrypoint
├── ingest.py                  # PDF extract + chunk
├── embed_openai.py            # OpenAI embedding wrapper (tier-1-local)
├── store.py                   # ChromaDB persistence helpers
├── retrieve.py                # Top-k retrieval
├── prompt.py                  # Build context-stuffed prompt
└── tests/
    ├── __init__.py
    ├── test_chunker.py        # Non-live: chunk shape + metadata invariants
    ├── test_embed_openai.py   # @pytest.mark.live (skips without OPENAI_API_KEY)
    └── test_main.py           # @pytest.mark.live: end-to-end ingest+query
```

### Pattern 1: PersistentClient with cosine similarity (ChromaDB 1.x API)

**What:** Use the new `configuration={"hnsw":{"space":"cosine"}}` shape (the legacy `metadata={"hnsw:space":"cosine"}` still works but is deprecated as of Chroma 1.0+). Cosine is the right metric for OpenAI embeddings (they are unit-normalized).

**When to use:** All ingest paths.

**Example (verified pattern from Chroma 1.x docs):**
```python
# Source: https://docs.trychroma.com/docs/run-chroma/clients
#         https://cookbook.chromadb.dev/core/configuration/
from pathlib import Path
import chromadb

CHROMA_PATH = Path("chroma_db") / "tier-1-naive"
COLLECTION = "enterprise_kb_naive"

def open_collection(reset: bool = False):
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    if reset:
        try:
            client.delete_collection(COLLECTION)
        except Exception:
            pass  # Collection didn't exist yet — fine
    return client.get_or_create_collection(
        name=COLLECTION,
        configuration={"hnsw": {"space": "cosine"}},
    )
```

**Distance interpretation gotcha:** ChromaDB returns cosine *distance* in the `distances` field, not similarity. Convert with `similarity = 1 - distance` for the rendered score (per `shared/display`'s `score` column). Document this in code comments.

### Pattern 2: Pre-compute embeddings (audit-friendly cost tracking)

**What:** Compute embeddings yourself with the OpenAI client, then pass the resulting vectors to `collection.add(embeddings=[...], documents=[...], metadatas=[...], ids=[...])`. Do **not** register `OpenAIEmbeddingFunction` on the collection.

**Why:** Pre-computing means `CostTracker` sees every batch — there's no hidden API call inside ChromaDB. For a blog post that boasts about cost transparency, this matters. (Also: registering an embedding function on a collection ties that collection to that function at query time too — switching to a different model later requires re-creating the collection.)

**Example:**
```python
# Source: https://platform.openai.com/docs/api-reference/embeddings
#         https://docs.trychroma.com/docs/embeddings/embedding-functions (pre-computed alternative)
from openai import OpenAI
from shared.cost_tracker import CostTracker

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMS = 1536  # default; do NOT pass dimensions=

def embed_batch(client: OpenAI, texts: list[str], tracker: CostTracker) -> list[list[float]]:
    resp = client.embeddings.create(model=EMBED_MODEL, input=texts)
    # OpenAI returns usage.prompt_tokens reliably for embeddings — record it.
    tracker.record_embedding(EMBED_MODEL, int(resp.usage.prompt_tokens))
    return [d.embedding for d in resp.data]
```

### Pattern 3: Page-aware chunking with citation metadata

**What:** Extract text page-by-page (PyMuPDF preserves page numbers), then chunk *within each page* — never across page boundaries. This guarantees every chunk has an exact `(paper_id, page)` provenance for citations.

**When to use:** Any time citation quality matters — i.e., always for this blog post.

**Example:**
```python
# Source: https://pymupdf.readthedocs.io/en/latest/tutorial.html
import fitz  # PyMuPDF
import tiktoken

ENC = tiktoken.get_encoding("cl100k_base")  # OpenAI's tokenizer for GPT-4 / embeddings
CHUNK_TOKENS = 512
OVERLAP_TOKENS = 64

def extract_pages(pdf_path: str) -> list[tuple[int, str]]:
    """Return list of (page_number_1_indexed, text)."""
    out = []
    with fitz.open(pdf_path) as doc:
        for i, page in enumerate(doc):
            txt = page.get_text("text") or ""
            if txt.strip():
                out.append((i + 1, txt))
    return out

def chunk_page(text: str, paper_id: str, page: int) -> list[dict]:
    """Token-window chunks within a single page."""
    tokens = ENC.encode(text)
    chunks = []
    step = CHUNK_TOKENS - OVERLAP_TOKENS
    for chunk_idx, start in enumerate(range(0, len(tokens), step)):
        window = tokens[start : start + CHUNK_TOKENS]
        if not window:
            break
        chunks.append({
            "id": f"{paper_id}_p{page:03d}_c{chunk_idx:03d}",
            "document": ENC.decode(window),
            "metadata": {
                "paper_id": paper_id,
                "page": page,
                "chunk_idx": chunk_idx,
            },
        })
    return chunks
```

### Pattern 4: Idempotent ingest

**What:** `--ingest` should be safe to re-run. Skip the entire ingest if `collection.count() > 0` and `--reset` was not passed. Print a clear "already populated; pass --reset to re-ingest" message.

**Why:** First-time ingest costs ~$0.50 (see Pitfall 5); accidentally re-running it because the README quickstart said `python main.py --ingest` should not silently double-bill. This is the project's explicit cost-transparency stance.

### Pattern 5: Citation-rendered output via `shared/display`

**What:** The retrieval step builds a list of `chunks` each with `doc_id`, `score`, and `snippet` keys (the shape `render_query_result` expects). Use `doc_id = f"{paper_id}#p{page}"` so the rendered table reads like `2005.11401#p3` — readers immediately see provenance.

**Example:**
```python
# Source: shared/display.py:render_query_result signature
chunks_for_display = [
    {
        "doc_id": f"{m['paper_id']}#p{m['page']}",
        "score": 1.0 - dist,       # cosine_similarity = 1 - cosine_distance
        "snippet": doc[:200] + ("…" if len(doc) > 200 else ""),
    }
    for m, dist, doc in zip(metadatas, distances, documents)
]
render_query_result(query, chunks_for_display, answer.text, tracker.total_usd(),
                    answer.input_tokens, answer.output_tokens)
```

### Anti-Patterns to Avoid

- **Embedding the whole PDF as one document.** Loses page-level citation, blows past 8192-token embedding limit. Always chunk first.
- **Calling `collection.add()` per chunk.** Round-trip overhead kills ingest perf. Add in batches of ≥100 chunks.
- **Cross-page chunks.** Page boundaries are natural semantic units in academic papers (figures sit on their own pages, sections often align with page breaks). Crossing them muddies citations.
- **Re-embedding on every run.** Idempotent ingest with `collection.count()` check is a 5-line guard.
- **Registering `OpenAIEmbeddingFunction` on the collection.** Hides cost tracking; ties the collection to one model.
- **Using cosine distance as a similarity score.** Always convert: `similarity = 1 - distance`.
- **Hard-coding the chroma path inside `tier-1-naive/`.** Use `chroma_db/tier-1-naive/` at the repo root so Tier 5 can reach it.
- **Modifying `shared/embeddings.py` to add OpenAI.** That module is Gemini-only by Phase-127 contract; the smoke test depends on it. Tier 1 ships its own tier-local OpenAI wrapper.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vector index + persistence | A pickled-FAISS-with-metadata-dict layer | `chromadb.PersistentClient` | Reinventing metadata filtering, schema migration, query API is a multi-week trap. |
| PDF text extraction | A regex-on-pdftotext-output pipeline | `pymupdf.open(...).get_text("text")` | Layout, encoding, ligatures, columnar text — PyMuPDF handles them all. |
| OpenAI HTTP client | `requests.post(...)` to `api.openai.com/v1/embeddings` | `openai` Python SDK | Retry, rate limit, batching, auth headers — all handled. |
| Tokenizer for chunk sizing | A regex word-counter | `tiktoken.get_encoding("cl100k_base")` | OpenAI tokens ≠ words; tiktoken is the only correct counter for `text-embedding-3-*`. |
| Cost tracking | Per-tier ad-hoc dicts | `shared/cost_tracker.CostTracker` | Phase 127 already shipped the D-13 schema; reinventing breaks Phase 131 aggregation. |
| Console rendering | `print()` calls | `shared/display.render_query_result` | Phase 127 already shipped the canonical layout; tier consistency matters. |
| Dataset enumeration | `glob.glob("dataset/papers/*.pdf")` | `shared/loader.DatasetLoader().papers()` | Manifest is the source of truth — file globbing diverges from manifest. |

**Key insight:** Phase 127 already shipped the full shared layer Tier 1 needs. The only Tier-1-specific code should be: PDF→chunk, OpenAI-embedding wrapper, ChromaDB store/retrieve helpers, prompt builder, and CLI glue. ~300 lines total.

## Common Pitfalls

### Pitfall 1: Wrong chunk size for academic papers

**What goes wrong:** Default LangChain chunk size (1000 chars / ~250 tokens) is too small for papers — single sentences get split mid-thought. Conversely, going to 2000+ tokens stuffs too much in the LLM context per chunk and dilutes top-k retrieval.

**Why it happens:** Academic papers have dense, formal prose with long sentences and equations. The 2025-2026 chunking benchmark consensus (Firecrawl, Databricks, NVIDIA) is **512 tokens / 50-100 token overlap** as the default for factoid queries on dense text.

**How to avoid:** Use `CHUNK_TOKENS = 512`, `OVERLAP_TOKENS = 64`. Document this choice in `tier-1-naive/README.md` and make it constants at the top of `ingest.py` so a curious reader can A/B it.

**Warning signs:** `collection.query()` returns chunks that are obviously truncated mid-sentence; multi-hop questions retrieve the same paper's chunks repeatedly because each chunk is too narrow.

### Pitfall 2: ChromaDB returns cosine *distance*, not similarity

**What goes wrong:** Naive `score = result["distances"][0]` produces values where 0 = best, 2 = worst — opposite of intuition, and `shared/display`'s table will sort/render misleadingly.

**Why it happens:** ChromaDB's `query()` returns distance in the `"distances"` key. Cosine distance ∈ [0, 2]; cosine similarity ∈ [-1, 1] (for unit-normalized vectors, in [0, 1] in practice).

**How to avoid:** `similarity = 1.0 - distance` everywhere a score is shown. Test asserts that all scores are in [0, 1].

**Warning signs:** Best-match chunks have score 0.000; "no match" chunks have score near 2.

### Pitfall 3: ChromaDB 0.5.x ↔ 1.x persistence incompatibility

**What goes wrong:** A Chroma index written by 0.5.x cannot be read by 1.x without migration. Re-installing into a fresh venv that pulls 1.5.8 over a previously-0.5.x `chroma_db/` directory will throw on first query.

**Why it happens:** The on-disk format changed at the 0.5.0 → 0.5.1 boundary and again at 1.0. Chroma docs document a migration tool.

**How to avoid:** (1) Pin `chromadb>=1.5.8,<2` from day one. (2) `--reset` flag wipes and rebuilds. (3) Document in README: "if you see a schema error, run `--reset`." (4) Note that since this repo never shipped a 0.5.x index, the migration path is "delete `chroma_db/tier-1-naive/` and re-ingest."

**Warning signs:** `RuntimeError: Schema version mismatch` or `Collection metadata format changed` on first query.

### Pitfall 4: `get_or_create_collection` metadata override gotcha

**What goes wrong:** In Chroma 1.x, calling `get_or_create_collection(name, metadata={...})` against an *existing* collection ignores the new metadata silently (used to overwrite in 0.5.x). If you "reconfigure" the HNSW space this way thinking it'll change, it won't.

**Why it happens:** Documented behavior change in Chroma 1.0 migration notes; one user reported a SIGSEGV in 1.5.x when stored vs call-site metadata diverged.

**How to avoid:** Set `configuration={"hnsw":{"space":"cosine"}}` ONLY at first creation. Use `--reset` to change indexing parameters. Don't pass conflicting metadata to `get_or_create_collection` in subsequent calls.

**Warning signs:** Distance values look like L2 (default) instead of cosine; rare crash on `get_or_create_collection`.

### Pitfall 5: OpenAI embedding cost surprise

**What goes wrong:** Ingesting 100 PDFs without a cost estimate first looks reasonable until you check the bill. Estimate up front so README can quote it.

**Back-of-envelope (text-embedding-3-small @ $0.02 / 1M tokens):**
- 100 papers × ~10 pages mean × ~500 tokens/page = ~500,000 tokens of source text.
- After 512/64 chunking, redundant overlap inflates by ~14% → ~570,000 tokens to embed.
- Cost: 570,000 / 1,000,000 × $0.02 = **~$0.011** (one cent).
- Adding 30 golden-Q&A query-time embeddings @ ~30 tokens each = negligible (~$0.00002 total).

That's much cheaper than the orchestrator's "~$0.50 ingest" guess — call it out in the README. Per-query cost: ~$0.0001 (one chat-completion of ~2k input tokens via gemini-2.5-flash).

**How to avoid:** Print the projected cost *before* ingest if it's the first run; require `--yes` to confirm OR rely on the trivially-low actual cost (likely the right call here — 1 cent is below the threshold of "needs confirmation").

**Warning signs:** N/A at this corpus size; would be a real concern at 10× the corpus.

### Pitfall 6: OpenAI batch limits

**What goes wrong:** Sending all ~1,200 chunks at once exceeds the per-request token cap.

**Constraints (verified):**
- Max array size per request: **2,048 inputs**.
- Per-input max: **8,192 tokens**.
- Practical per-request token cap: ~**300,000 tokens** (community-reported); model server pessimistic estimation can reject batches well under stated limits.

**How to avoid:** Batch size **100 chunks per request** (well under all limits). Each batch is ~100 × 512 = 51,200 tokens. With ~1,200 chunks total → 12 round-trips. At ~1s each → ingest finishes in ~15s including overhead. Use `tiktoken` to verify pre-flight that no single chunk exceeds 8,192 tokens (it shouldn't — 512 is the cap — but defensive code is cheap).

**Warning signs:** `BadRequestError: input is too large` or `400 Bad Request: This model's maximum context length is 8192 tokens`.

### Pitfall 7: PyMuPDF text extraction quirks for figures and tables

**What goes wrong:** `page.get_text("text")` returns linearized text including OCR'd figure captions and table cells — but tables get mangled into runs of words, and equations come out as gibberish (e.g., `(cid:25)` for missing glyphs). Naive RAG can't fix this; multi-modal Tier 4 will.

**How to avoid:** Don't try to fix it in Tier 1. Document in the README that "Tier 1 is text-only; figure-question accuracy is poor — see Tier 4." This is a feature of the blog narrative.

**Warning signs:** Multi-modal golden-Q&A entries (the 10 `multimodal-*` ones) score near zero on retrieval — expected.

### Pitfall 8: Persistence path collision with Tier 5

**What goes wrong:** ROADMAP says "ChromaDB index persists to disk and can be reused by Tier 5." If both tiers write to the same collection in the same path, Tier 5's modifications could corrupt Tier 1's deterministic behavior.

**How to avoid:** Tier 1 owns `chroma_db/tier-1-naive/` exclusively. Tier 5 *reads* from this path (treats it as read-only baseline) but writes its own indices to `chroma_db/tier-5-agentic/` if it needs to modify anything. Document this in the Tier 1 README's "Reused by" section so the planner of Phase 130 inherits the convention.

**Warning signs:** Tier 5 phase planning starts by asking "which collection should I write to?" — answer: not Tier 1's.

### Pitfall 9: Chunk ID uniqueness across the corpus

**What goes wrong:** ChromaDB requires unique `ids` within a collection. Two papers with the same chunk index on the same page would collide if you used `f"p{page}_c{chunk}"`.

**How to avoid:** Always include `paper_id` in the chunk id: `f"{paper_id}_p{page:03d}_c{chunk:03d}"`. Test asserts that `len(set(ids)) == len(ids)` after ingest.

**Warning signs:** `ValueError: IDs must be unique` from ChromaDB on `add()`.

### Pitfall 10: `OPENAI_API_KEY` field is `SecretStr | None` — runtime check needed

**What goes wrong:** `shared/config.py` declares `openai_api_key: SecretStr | None = Field(None, ...)`. In Tier 1, calling `settings.openai_api_key.get_secret_value()` when the field is `None` raises `AttributeError: 'NoneType' object has no attribute 'get_secret_value'` — confusing error.

**How to avoid:** At Tier 1 startup, explicit guard:
```python
if settings.openai_api_key is None:
    raise SystemExit(
        "OPENAI_API_KEY required for Tier 1 (embeddings). "
        "Copy .env.example to .env and set your key from https://platform.openai.com/api-keys"
    )
```
Do this in `main.py` before any work begins, so the failure is fast and friendly.

**Warning signs:** Cryptic `AttributeError` deep in the embedding wrapper.

## Code Examples

Verified end-to-end skeletons (paste these into PLANs as starting points — all ~MVP, ~300 lines total).

### Example A: Top-of-file constants

```python
# tier-1-naive/main.py — top
# Sources: shared/config.py (Phase 127), ROADMAP Phase 128 success criteria.
from pathlib import Path

CHROMA_PATH = Path("chroma_db") / "tier-1-naive"
COLLECTION_NAME = "enterprise_kb_naive"
EMBED_MODEL = "text-embedding-3-small"
EMBED_BATCH = 100
CHUNK_TOKENS = 512
OVERLAP_TOKENS = 64
DEFAULT_TOP_K = 5
DEFAULT_QUERY = (
    "What is the core mechanism Lewis et al. 2020 introduce in the RAG paper "
    "for combining parametric and non-parametric memory?"
)  # = golden_qa.json::single-hop-001
```

### Example B: Idempotent ingest skeleton

```python
# tier-1-naive/main.py — ingest()
def cmd_ingest(reset: bool, tracker, console):
    from shared.loader import DatasetLoader
    from .ingest import extract_pages, chunk_page
    from .embed_openai import build_openai_client, embed_batch
    from .store import open_collection

    coll = open_collection(reset=reset)
    if coll.count() > 0 and not reset:
        console.print(
            f"[yellow]Collection already populated ({coll.count()} chunks). "
            "Pass --reset to re-ingest.[/yellow]"
        )
        return

    loader = DatasetLoader()
    papers = loader.papers()
    oai = build_openai_client()
    all_chunks: list[dict] = []
    dataset_root = Path("dataset")
    for p in papers:
        pdf_path = dataset_root / "papers" / p["filename"]
        for page_no, text in extract_pages(str(pdf_path)):
            all_chunks.extend(chunk_page(text, paper_id=p["paper_id"], page=page_no))

    # Batch and add.
    for i in range(0, len(all_chunks), EMBED_BATCH):
        batch = all_chunks[i : i + EMBED_BATCH]
        vectors = embed_batch(oai, [c["document"] for c in batch], tracker)
        coll.add(
            ids=[c["id"] for c in batch],
            documents=[c["document"] for c in batch],
            metadatas=[c["metadata"] for c in batch],
            embeddings=vectors,
        )
    console.print(f"[green]Ingested {len(all_chunks)} chunks from {len(papers)} papers.[/green]")
```

### Example C: Query path

```python
# tier-1-naive/main.py — query()
def cmd_query(query: str, top_k: int, tracker, console):
    from shared.llm import get_llm_client
    from shared.display import render_query_result
    from .embed_openai import build_openai_client, embed_batch
    from .store import open_collection
    from .prompt import build_prompt

    coll = open_collection(reset=False)
    if coll.count() == 0:
        console.print("[red]Empty index. Run with --ingest first.[/red]")
        raise SystemExit(2)

    oai = build_openai_client()
    [qv] = embed_batch(oai, [query], tracker)
    res = coll.query(query_embeddings=[qv], n_results=top_k)
    docs = res["documents"][0]
    metas = res["metadatas"][0]
    dists = res["distances"][0]

    prompt = build_prompt(query, docs, metas)
    llm = get_llm_client()
    answer = llm.complete(prompt)
    tracker.record_llm(answer.model, answer.input_tokens, answer.output_tokens)

    chunks = [
        {
            "doc_id": f"{m['paper_id']}#p{m['page']}",
            "score": 1.0 - d,
            "snippet": doc[:200] + ("…" if len(doc) > 200 else ""),
        }
        for m, d, doc in zip(metas, dists, docs)
    ]
    render_query_result(
        query=query,
        chunks=chunks,
        answer=answer.text,
        cost_usd=tracker.total_usd(),
        input_tokens=answer.input_tokens,
        output_tokens=answer.output_tokens,
    )
    tracker.persist()  # writes evaluation/results/costs/tier-1-<ts>.json
```

### Example D: Prompt template

```python
# tier-1-naive/prompt.py
def build_prompt(question: str, docs: list[str], metas: list[dict]) -> str:
    ctx_blocks = []
    for i, (doc, m) in enumerate(zip(docs, metas), start=1):
        ctx_blocks.append(
            f"[{i}] paper_id={m['paper_id']} page={m['page']}\n{doc.strip()}"
        )
    ctx = "\n\n".join(ctx_blocks)
    return (
        "You are answering a research question using ONLY the provided context excerpts. "
        "If the answer is not in the excerpts, say so explicitly. Cite sources inline as [paper_id p.page].\n\n"
        f"--- CONTEXT ---\n{ctx}\n\n"
        f"--- QUESTION ---\n{question}\n\n"
        "Answer:"
    )
```

### Example E: Test scaffold

```python
# tier-1-naive/tests/test_chunker.py — non-live unit test
from tier_1_naive.ingest import chunk_page  # adjust import per package layout

def test_chunker_preserves_metadata():
    text = "x " * 2000  # ~1000 tokens
    chunks = chunk_page(text, paper_id="test.001", page=3)
    assert len(chunks) >= 2, "should produce multiple chunks for >512 tokens"
    for c in chunks:
        assert c["metadata"]["paper_id"] == "test.001"
        assert c["metadata"]["page"] == 3
        assert c["id"].startswith("test.001_p003_")

def test_chunker_unique_ids():
    text = "x " * 5000
    chunks = chunk_page(text, paper_id="test.001", page=1)
    ids = [c["id"] for c in chunks]
    assert len(set(ids)) == len(ids), "chunk ids must be unique within a page"
```

```python
# tier-1-naive/tests/test_main.py — live end-to-end (skipped without OPENAI_API_KEY + GEMINI_API_KEY)
import os
import pytest

@pytest.fixture
def live_keys_ok():
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("OPENAI_API_KEY not set; tier-1 live tests skipped")
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set; tier-1 live tests skipped")

@pytest.mark.live
def test_ingest_and_query_end_to_end(live_keys_ok, tmp_path, monkeypatch):
    """Live end-to-end: tiny corpus, one query, asserts ChromaDB roundtrip + answer."""
    # Redirect chroma path to tmp_path; subset corpus to 2 papers; assert answer non-empty.
    # ~$0.0005 per run.
    ...
```

## Data — concrete numbers

### Sample query (default)

`single-hop-001` from `evaluation/golden_qa.json`:
> "What is the core mechanism Lewis et al. 2020 introduce in the RAG paper for combining parametric and non-parametric memory?"

Expected answer paragraphs to look for: parametric (BART) + non-parametric (Wikipedia DPR vector index); RAG-Sequence vs RAG-Token. Top-k=5 retrieval should surface chunks from `2005.11401` (the RAG paper). This question is the canonical "Tier 1 looks great here" example for the blog post.

### Multi-hop probe (to expose Tier 1's weakness)

A representative multi-hop entry is `multimodal-010` ("Marcus's Next Decade in AI" + RAG paper, two `source_papers`). For a text-only weakness probe, pick any multi-hop chain in the citation cluster — e.g., a question requiring both Lewis et al. 2020 (RAG) AND Karpukhin et al. 2020 (DPR) to be in the same retrieved set. Naive top-k retrieval will frequently miss one of the two. Document this in the Tier 1 README as a teaser for Tier 3 (Graph RAG).

### Cost estimates (verified prices @ 2026-04)

| Operation | Tokens | Cost |
|-----------|--------|------|
| One-time ingest embed (570k tokens, text-embedding-3-small) | 570,000 | **~$0.011** |
| Per-query embed (~30 token question) | 30 | $0.0000006 |
| Per-query LLM (gemini-2.5-flash, ~3,000 in / 200 out) | 3,200 | **~$0.0014** |
| Total per-query (excl. one-time ingest) | — | **~$0.0014** |

These numbers go directly into `tier-1-naive/README.md`'s expected-cost table.

### Corpus stats (verified from manifest)

- Papers: 100 PDFs, 185 MB on disk.
- Estimated total chunks after 512/64 splitting: ~1,200 ± 200 (depends on per-page text density; some papers are ~8 pages, some ~30).
- Estimated ChromaDB on-disk size: ~30-50 MB (1,200 × 1536 floats × 4 bytes ≈ 7 MB raw + HNSW overhead + duplicated text).

## State of the Art

| Old Approach | Current Approach (2025-26) | When Changed | Impact |
|--------------|---------------------------|--------------|--------|
| Chroma collection metadata `{"hnsw:space":"cosine"}` | `configuration={"hnsw":{"space":"cosine"}}` | Chroma 1.0 (early 2025) | Tier 1 uses new shape; old still works (deprecated). |
| `get_or_create_collection(metadata=...)` overrides existing metadata | Now silently ignored if collection exists | Chroma 1.0 | Don't try to "reconfigure" via this method — `--reset` instead. |
| `text-embedding-ada-002` (1536d, $0.10/1M) | `text-embedding-3-small` (1536d, $0.02/1M) | Jan 2024 | 5× cheaper, marginally better MTEB; ada-002 deprecation announced. |
| Default LangChain RecursiveCharacterTextSplitter (1000 char / 200 overlap) | 512 token / 64 overlap | 2025 chunking benchmarks (Vectara NAACL 2025; Firecrawl 2026) | Token-aware beats char-aware; 512 wins for factoid queries. |
| `google-generativeai` SDK | `google-genai` (unified SDK) | EOL'd 2025-08-31 (per Phase 127 RESEARCH) | Tier 1 transitively uses `shared/llm` which already uses `google-genai`. |

**Deprecated/outdated for this scope:**
- Anything LangChain-framework-specific — naive baseline must show direct API calls so Tier 5's complexity stands out.
- `chromadb < 0.6` — pre-1.0 schema is incompatible with 1.5.8.

## Open Questions (RESOLVED)

1. **Should `--ingest` print a "this will cost ~$0.01" prompt?**
   - What we know: actual cost is ~$0.011 (one cent). User explicitly values cost transparency.
   - What's unclear: whether a confirm prompt at $0.01 is helpful or annoying.
   - Recommendation: skip the confirm; print the *projected* cost as an info line ("Estimated ingest cost: ~$0.01 across ~1,200 chunks") right before the embed loop starts. No `--yes` flag needed at this scale.

2. **Where should the canned multi-hop "weakness probe" live?**
   - What we know: blog post benefits from showing Tier 1 fail; ROADMAP success criterion only requires *one* successful demo query.
   - What's unclear: whether Phase 128 ships the weakness probe or punts to Phase 131 (eval).
   - Recommendation: ship a `--query` flag so users can run any question. The README's "Known Weaknesses" section names a specific multi-hop golden-Q&A id and shows the user how to run it. Hard-coded comparison output is Phase 131 territory.

3. **Does Tier 5 need the chunk-text snippets, or only the embeddings + metadata?**
   - What we know: Tier 5 (Agentic) will read this collection. Documents in Chroma already include the chunk text alongside the embedding.
   - What's unclear: Tier 5's exact retrieval pattern hasn't been planned yet (Phase 130).
   - Recommendation: store everything — chunk text, full metadata, embeddings — in the same collection; Tier 5 can pick what it needs. Storage cost is trivial (~50 MB) vs the re-embed cost if Tier 5 needs the text and we didn't store it.

4. **Should we use `tiktoken.encoding_for_model("text-embedding-3-small")` or `get_encoding("cl100k_base")`?**
   - What we know: `text-embedding-3-*` use `cl100k_base`. `encoding_for_model` resolves to it for both; both are equivalent for our use.
   - Recommendation: use `tiktoken.get_encoding("cl100k_base")` directly — explicit beats implicit, and avoids tiktoken needing to do a network lookup or warn on unknown new models.

## Sources

### Primary (HIGH confidence)

- Chroma official docs — clients page (`https://docs.trychroma.com/docs/run-chroma/clients`) — verified PersistentClient instantiation pattern.
- Chroma official docs — embedding functions (`https://docs.trychroma.com/docs/embeddings/embedding-functions`) — verified `OpenAIEmbeddingFunction` signature and pre-computed-embedding alternative.
- Chroma migration docs (`https://docs.trychroma.com/docs/overview/migration`) — confirmed `get_or_create_collection` 1.x semantics change and `configuration` dict replacing `metadata={"hnsw:..."}`.
- OpenAI embeddings API guide (`https://developers.openai.com/api/docs/guides/embeddings`) — verified canonical Python call, 1536d default for text-embedding-3-small, 8192-token input cap, dimensions-shrink parameter.
- PyMuPDF RAG docs (`https://pymupdf.readthedocs.io/en/latest/rag.html`) and tutorial — confirmed `fitz.open()`, `page.get_text("text")`, `len(doc)`.
- Repo-local: `shared/{config,embeddings,llm,pricing,cost_tracker,display,loader}.py` (Phase 127, verified shipped 2026-04-26) — direct read.
- Repo-local: `pyproject.toml`, `.env.example`, `.gitignore`, `tier-1-naive/requirements.txt` — direct read.
- Repo-local: `evaluation/golden_qa.json` — 30 entries verified.
- `pip3 index versions chromadb` → 1.5.8 (latest, 2026-04).
- `pip3 index versions openai` → 2.32.0 latest.
- `pip3 index versions pymupdf` → 1.27.2.3 (matches `[curation]` pin).

### Secondary (MEDIUM confidence)

- Chroma Cookbook (`https://cookbook.chromadb.dev/core/configuration/`, `.../core/clients/`, `.../embeddings/bring-your-own-embeddings/`) — community-maintained but cross-verified with official docs.
- Firecrawl 2026 RAG chunking benchmarks (`https://www.firecrawl.dev/blog/best-chunking-strategies-rag`) — 512/50-100 default validated on real documents.
- Premai 2026 RAG chunking benchmark (`https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/`) — corroborates 512-token recommendation.
- Vectara NAACL 2025 — fixed-size chunking outperforms semantic chunking on realistic docs (cited via Firecrawl summary).
- TokenMix dev guide for `text-embedding-3-small` (`https://tokenmix.ai/blog/text-embedding-3-small-developer-guide-2026`) — pricing $0.02/1M, MTEB 62.26.
- OpenAI community thread — embeddings API max batch 2048 (`https://community.openai.com/t/embeddings-api-max-batch-size/655329`).
- OpenAI community thread — token-counting discrepancy with tiktoken (`https://community.openai.com/t/token-counting-in-batch-api-text-embeddings/1231096`) — motivates server-reported `usage.prompt_tokens` over local count.

### Tertiary (LOW confidence — flagged for runtime validation)

- Specific batch-size tuning (100 chunks/request): based on community reports + my own conservative math. Verify by timing first ingest run; if rate limits hit, drop to 50.
- Exact chunk count after 512/64 over the corpus (~1,200): math estimate, not measured. First `--ingest` run will print actual count.
- ChromaDB on-disk size estimate (~30-50 MB): order-of-magnitude only.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via `pip3 index versions`; Chroma 1.5.8 is current; OpenAI SDK 2.32 stable; PyMuPDF 1.27 already pinned in `[curation]`.
- Architecture: HIGH — patterns are direct from official docs; Phase 127's shared/ surface is verified shipped.
- Pitfalls: HIGH — Pitfalls 1-6 cross-verified across multiple sources (Chroma issues, OpenAI community, RAG benchmark blogs, Phase 127 contracts).
- Cost estimates: MEDIUM — based on token-count math + locked pricing table; will be exact after first live ingest.
- Open questions: explicit and minimal; none block planning.

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days — the stack is mature and stable; Chroma 1.5.x and OpenAI embeddings APIs are not in fast churn).
