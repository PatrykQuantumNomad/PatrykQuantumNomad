# Stack Research: RAG Architecture Patterns Companion Repo

**Domain:** Python RAG companion repository (5-tier progressive examples)
**Researched:** 2026-04-17
**Confidence:** HIGH

## Recommended Stack

### Runtime & Package Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python | 3.10+ | Runtime | Minimum for google-genai, python-dotenv, sentence-transformers. 3.10 is the highest common floor across all tier dependencies. |
| uv | latest | Package manager | 10-100x faster than pip, lockfile reproducibility, manages venvs and Python versions. Industry standard for new Python projects in 2026. Provide `requirements.txt` fallback for pip users. |

### Shared Dependencies (All Tiers)

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| openai | >=2.32.0 | LLM API client | Used by Tiers 1, 3, 4, 5. Provides embeddings (text-embedding-3-small) and chat completions (gpt-4o-mini). Async + sync clients, type-safe. |
| python-dotenv | >=1.2.2 | Environment config | Loads API keys from `.env`. Every tier needs at least one API key. Python >=3.10 required. |
| rich | >=15.0.0 | Terminal output | Pretty-prints retrieval results, progress bars during indexing, syntax-highlighted code in responses. Makes demos visually compelling without a UI. |
| tiktoken | >=0.12.0 | Token counting | Counts tokens for chunking logic (Tier 1) and cost estimation across all tiers. Fast BPE tokenizer from OpenAI. |

### Tier 1: Naive RAG (Basic Vector Similarity)

| Library | Version | Purpose | Why This Library |
|---------|---------|---------|------------------|
| chromadb | >=1.5.8 | Vector database | Zero-config embedded vector DB. No server needed -- runs in-process with persistent local storage. Perfect for "build RAG from scratch" demo. |
| pypdf | >=6.10.2 | PDF text extraction | Pure Python, no system dependencies. Extracts text from digitally-born PDFs. Lightweight for the "naive" tier. |

**What Tier 1 demonstrates:** Manual chunking, embedding with `text-embedding-3-small`, vector similarity search with ChromaDB, prompt assembly with retrieved context. No framework abstractions -- raw OpenAI API + ChromaDB.

**API keys required:** `OPENAI_API_KEY`

### Tier 2: Google Managed RAG (Gemini File Search)

| Library | Version | Purpose | Why This Library |
|---------|---------|---------|------------------|
| google-genai | >=1.73.1 | Gemini API client | Official unified SDK for Gemini Developer API. File Search is a first-class tool. Python >=3.10 required. |

**What Tier 2 demonstrates:** Zero-infrastructure RAG. Google handles chunking, embedding, storage, and retrieval. Developer uploads files to a `FileSearchStore`, then queries with `generate_content()` using the `FileSearch` tool. Automatic citations in responses.

**API pattern:**
```python
from google import genai
from google.genai import types

client = genai.Client(api_key=GEMINI_API_KEY)

# 1. Create store + upload file (one-time)
store = client.file_search_stores.create(config={"display_name": "enterprise-kb"})
op = client.file_search_stores.upload_to_file_search_store(
    file="knowledge-base.pdf",
    file_search_store_name=store.name,
    config={"display_name": "kb-doc"}
)
# 2. Query with File Search tool
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="What is the company policy on remote work?",
    config=types.GenerateContentConfig(
        tools=[types.Tool(file_search=types.FileSearch(
            file_search_store_names=[store.name]
        ))]
    )
)
```

**API keys required:** `GEMINI_API_KEY` (free tier available; storage + embedding at query time are free, indexing costs $0.15/M tokens)

**Pricing advantage:** Cheapest managed RAG option. No vector DB costs, no embedding API costs at query time.

### Tier 3: Graph RAG (LightRAG)

| Library | Version | Purpose | Why This Library |
|---------|---------|---------|------------------|
| lightrag-hku | >=1.4.15 | Graph-based RAG | EMNLP2025 paper implementation. Builds knowledge graphs from documents automatically. Dual-level retrieval (entity-level + community-level). Outperforms naive RAG, HyDE, and Microsoft GraphRAG on benchmarks. |

**What Tier 3 demonstrates:** Knowledge graph construction from unstructured text, entity/relationship extraction, graph-augmented retrieval that captures connections across documents that vector similarity misses.

**Key configuration:**
```python
from lightrag import LightRAG, QueryParam

rag = LightRAG(
    working_dir="./lightrag_workdir",
    llm_model_func=...,  # OpenAI-compatible function
    embedding_func=...,  # Embedding function
)

# Insert documents
await rag.ainsert(document_text)

# Query with different modes
result = await rag.aquery("What are the key relationships?",
    param=QueryParam(mode="hybrid"))  # naive | local | global | hybrid
```

**Storage backends:** JSON (default, good for demos), PostgreSQL, MongoDB, Neo4j, OpenSearch (production).

**API keys required:** `OPENAI_API_KEY` (for LLM extraction + embeddings)

**Important:** LightRAG uses LLM calls during indexing (entity/relationship extraction). Budget ~3-5x more tokens for indexing vs. naive RAG. This is a feature, not a bug -- it's what builds the knowledge graph.

### Tier 4: Multimodal RAG (RAG-Anything)

| Library | Version | Purpose | Why This Library |
|---------|---------|---------|------------------|
| raganything[all] | >=1.2.10 | Multimodal document processing | Built on LightRAG. Processes PDFs with interleaved text, images, tables, and equations through one pipeline. VLM-enhanced query mode. Same team (HKUDS) as LightRAG, so architecturally coherent progression. |

**What Tier 4 demonstrates:** Processing documents where text-only RAG fails -- technical docs with diagrams, financial reports with charts, manuals with annotated images. Shows how vision-language models integrate with RAG retrieval.

**Key configuration:**
```python
from raganything import RAGAnything, RAGAnythingConfig

config = RAGAnythingConfig(
    working_dir="./raganything_workdir",
    parser_type="mineru",  # Document parser
)

rag = RAGAnything(config=config, llm_model_func=..., vlm_model_func=...)

# Process multimodal document
await rag.process_document_complete("technical-manual.pdf")

# Text-only query
result = await rag.aquery("What does the architecture diagram show?")

# Multimodal query (includes images in response)
result = await rag.aquery_with_multimodal("Explain the system diagram")
```

**System dependencies:** MinerU (document parser, installed via pip). Optional: LibreOffice for .doc/.ppt/.xls files.

**API keys required:** `OPENAI_API_KEY` (for LLM + VLM via gpt-4o or gpt-4o-mini)

**Note:** RAG-Anything extends LightRAG, so Tier 4 code builds naturally on Tier 3 concepts. This makes the progression pedagogically clean.

### Tier 5: Agentic RAG (OpenAI Agents SDK)

| Library | Version | Purpose | Why This Library |
|---------|---------|---------|------------------|
| openai-agents | >=0.14.5 | Agent framework | Lightweight, minimal abstractions, built-in FileSearchTool for managed vector stores. Provider-agnostic (100+ LLMs). No heavy framework overhead like LangGraph. Better for a companion repo because the code reads like plain Python, not framework DSL. |

**Why OpenAI Agents SDK over LangGraph:**
- LangGraph (v1.1.0) is powerful but adds significant abstraction overhead (StateGraph, conditional edges, reducer patterns). For a blog companion repo, readers want to understand the concepts, not debug a framework.
- OpenAI Agents SDK uses plain Python functions as tools, explicit agent handoffs, and minimal boilerplate. The agentic pattern is visible in the code, not buried in framework conventions.
- Built-in `FileSearchTool` provides managed RAG without infrastructure. Built-in `WebSearchTool` adds real-time grounding.
- Tracing is built in for debugging.

**What Tier 5 demonstrates:** An agent that decides WHEN to retrieve, WHAT to retrieve from, and WHETHER the retrieved context is sufficient. Implements query planning, retrieval, self-evaluation, and re-retrieval loops.

**Key configuration:**
```python
from agents import Agent, FileSearchTool, WebSearchTool, Runner, function_tool

@function_tool
def search_knowledge_base(query: str) -> str:
    """Search the enterprise knowledge base for relevant information."""
    # Custom retrieval logic using ChromaDB from Tier 1
    ...

agent = Agent(
    name="Enterprise KB Assistant",
    instructions="You are an enterprise knowledge assistant. Search the knowledge base "
                 "before answering. If results are insufficient, reformulate and search again.",
    tools=[
        FileSearchTool(
            vector_store_ids=["vs_..."],
            max_num_results=5,
        ),
        search_knowledge_base,
    ],
)

result = await Runner.run(agent, "Compare our remote work policy with industry standards")
```

**API keys required:** `OPENAI_API_KEY`

## Enterprise Knowledge Base Dataset

### Recommended Format

Use a synthetic "Acme Corp" enterprise knowledge base with documents in multiple formats to exercise each tier's capabilities:

| Document | Format | Purpose | Exercises |
|----------|--------|---------|-----------|
| Company Handbook | Markdown (.md) | HR policies, org structure | All tiers (text baseline) |
| Technical Architecture | PDF with diagrams | System architecture docs | Tiers 1-5 (text), Tier 4 (images) |
| Quarterly Report | PDF with tables/charts | Financial data | Tiers 1-5 (text), Tier 4 (tables/charts) |
| Product Roadmap | Markdown (.md) | Feature plans, timelines | Cross-document queries (Tier 3 graph) |
| Engineering Standards | PDF | Coding standards, processes | Entity extraction (Tier 3) |
| Meeting Notes | Plain text (.txt) | Decision records | Relationship extraction (Tier 3) |

**Total size:** ~50-100 pages across 6-8 documents. Small enough to index quickly in demos, large enough to show meaningful retrieval differences between tiers.

**Why synthetic, not real:** No licensing issues, no PII concerns, can be version-controlled in the repo, can be designed to highlight each tier's strengths (e.g., documents with deliberate cross-references for graph RAG, documents with diagrams for multimodal RAG).

### Dataset Directory Structure

```
data/
  enterprise-kb/
    handbook.md           # HR policies, benefits, org chart
    architecture.pdf      # System diagrams, component descriptions
    quarterly-report.pdf  # Tables, charts, financial summaries
    roadmap.md           # Product plans with cross-refs to architecture
    standards.pdf        # Engineering standards
    meeting-notes/
      2024-q4-planning.txt
      2025-q1-review.txt
```

## Embedding Model

| Model | Dimensions | Cost | When to Use |
|-------|------------|------|-------------|
| text-embedding-3-small | 1,536 | $0.02/M tokens | Tier 1 (Naive RAG), Tier 3 (LightRAG), Tier 5 (Agentic). Best cost/quality ratio for demos. |
| Gemini built-in | N/A (managed) | Free at query time | Tier 2 only. Embedding is handled by File Search internally. |
| text-embedding-3-small via LightRAG | 1,536 | $0.02/M tokens | Tier 4 (RAG-Anything inherits from LightRAG). |

**Why not text-embedding-3-large?** For a companion repo, the cost savings of -small matter (readers will run this with their own API keys). Quality difference is negligible for a 50-100 page demo corpus.

## LLM Model

| Model | Context | Cost (input/output) | When to Use |
|-------|---------|---------------------|-------------|
| gpt-4o-mini | 128K | $0.15/$0.60 per M tokens | Default for all tiers. Cheap enough for readers to experiment. Smart enough for entity extraction and RAG generation. |
| gpt-4o | 128K | $2.50/$10.00 per M tokens | Tier 4 VLM queries (image understanding). Optional upgrade for any tier. |
| gemini-2.5-flash | 1M | Pay-per-use | Tier 2 only. Used via google-genai SDK. |

## Installation

```bash
# Option 1: uv (recommended)
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

# Option 2: pip
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### requirements.txt (all tiers)

```
# Shared
openai>=2.32.0
python-dotenv>=1.2.2
rich>=15.0.0
tiktoken>=0.12.0

# Tier 1: Naive RAG
chromadb>=1.5.8
pypdf>=6.10.2

# Tier 2: Google Managed RAG
google-genai>=1.73.1

# Tier 3: Graph RAG
lightrag-hku>=1.4.15

# Tier 4: Multimodal RAG
raganything[all]>=1.2.10

# Tier 5: Agentic RAG
openai-agents>=0.14.5
```

### Per-tier requirements (for readers who want to run individual tiers)

```
# tier1-requirements.txt
openai>=2.32.0
python-dotenv>=1.2.2
rich>=15.0.0
tiktoken>=0.12.0
chromadb>=1.5.8
pypdf>=6.10.2

# tier2-requirements.txt
google-genai>=1.73.1
python-dotenv>=1.2.2
rich>=15.0.0

# tier3-requirements.txt
openai>=2.32.0
python-dotenv>=1.2.2
rich>=15.0.0
lightrag-hku>=1.4.15

# tier4-requirements.txt
openai>=2.32.0
python-dotenv>=1.2.2
rich>=15.0.0
raganything[all]>=1.2.10

# tier5-requirements.txt
openai>=2.32.0
python-dotenv>=1.2.2
rich>=15.0.0
chromadb>=1.5.8
openai-agents>=0.14.5
```

### Environment Variables (.env.example)

```bash
# Required for Tiers 1, 3, 4, 5
OPENAI_API_KEY=sk-...

# Required for Tier 2
GEMINI_API_KEY=AI...

# Optional: Override default models
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
GEMINI_MODEL=gemini-2.5-flash
```

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| chromadb (Tier 1) | FAISS | ChromaDB has simpler API, built-in persistence, metadata filtering. FAISS requires numpy array management. For a teaching repo, DX matters more than raw speed. |
| chromadb (Tier 1) | Qdrant, Weaviate, Pinecone | All require running a server or cloud account. ChromaDB runs embedded -- zero infrastructure for readers. |
| google-genai (Tier 2) | OpenAI Assistants API (file_search) | Google File Search is free for storage + query-time embeddings. OpenAI charges for vector store storage. Google's approach is newer and less documented in tutorials, making it more interesting content. |
| lightrag-hku (Tier 3) | Microsoft GraphRAG | LightRAG is simpler (single package), faster, and benchmarks better per the EMNLP2025 paper. GraphRAG requires more configuration and has heavier dependencies. |
| lightrag-hku (Tier 3) | neo4j + LangChain GraphRAG | Requires running Neo4j server. LightRAG's built-in graph storage (JSON/networkx) works for demos. Same team as Tier 4, so natural progression. |
| raganything (Tier 4) | Unstructured + LangChain multimodal | RAG-Anything is purpose-built for multimodal RAG, not a general ETL tool. Built on LightRAG so it shares the Tier 3 foundation. One package vs. assembling 5+ libraries. |
| openai-agents (Tier 5) | LangGraph (v1.1.0) | LangGraph is more powerful but adds StateGraph DSL overhead. For a companion repo, code readability is paramount. OpenAI Agents SDK reads like plain Python. |
| openai-agents (Tier 5) | CrewAI | CrewAI is multi-agent focused (role-playing agents). Overkill for single-agent RAG. Adds unnecessary abstraction for the demo scope. |
| text-embedding-3-small | Gemini Embedding 2, voyage-3-large | OpenAI embedding is used by default in LightRAG and RAG-Anything. Using the same embedding model across tiers keeps comparisons fair and reduces API key requirements. |
| Synthetic dataset | Real company docs | Licensing, PII, can't version control. Synthetic lets you design documents that showcase each tier's strengths. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain (full framework) | Adds massive dependency tree (200+ transitive deps). Abstracts away the RAG mechanics readers need to learn. Version churn is constant. | Direct OpenAI SDK + ChromaDB for Tier 1. LightRAG/RAG-Anything handle their own orchestration for Tiers 3-4. |
| llama-index | Same problem as LangChain -- heavy abstraction layer that hides the RAG pipeline. Readers should see the mechanics. | Direct API calls. The whole point of the 5-tier structure is progressive complexity, not framework wrapping. |
| Pinecone / Weaviate / Milvus | Require cloud accounts or Docker servers. Adds infrastructure friction that blocks readers from running demos. | ChromaDB (embedded, zero-config). |
| PyPDF2 | Deprecated. Merged into pypdf. Still appears in tutorials but is a dead project. | pypdf (>=6.10.2). |
| google-generativeai | Legacy SDK. Replaced by google-genai. Still importable but missing File Search support. | google-genai (>=1.73.1). |
| sentence-transformers | Pulls in PyTorch (~2GB). Overkill when OpenAI API embeddings work fine for demos. Only use if you need local/offline embeddings. | openai (text-embedding-3-small via API). |
| Docker / docker-compose | Adds deployment complexity that distracts from the RAG concepts. The companion repo should run with `python tier1_naive.py`. | Embedded ChromaDB, JSON storage for LightRAG. |

## Stack Patterns by Tier

**Tier 1 (Naive RAG):**
- Zero framework, zero abstraction. Raw OpenAI API + ChromaDB.
- Reader sees every step: load PDF, chunk text, embed chunks, store vectors, query, assemble prompt, generate.
- This is the "understand the fundamentals" tier.

**Tier 2 (Managed RAG):**
- Zero infrastructure. One API, one SDK (google-genai).
- Reader sees: upload file, query. That's it. The contrast with Tier 1 is the whole point.
- Shows what you get (simplicity, citations) and what you lose (control, customization).

**Tier 3 (Graph RAG):**
- Adds knowledge graph on top of vector retrieval. LightRAG handles graph construction.
- Reader sees: entities and relationships extracted from documents, graph-augmented retrieval.
- Key insight: vector similarity misses cross-document connections that graphs capture.

**Tier 4 (Multimodal RAG):**
- Extends Tier 3 with vision-language model integration. RAG-Anything builds on LightRAG.
- Reader sees: same documents, but now diagrams/tables/charts are understood.
- Key insight: text extraction loses information that multimodal processing preserves.

**Tier 5 (Agentic RAG):**
- Adds decision-making layer. Agent decides when/what/how to retrieve.
- Reader sees: query planning, retrieval, self-evaluation, re-retrieval loops.
- Key insight: static retrieval assumes one query is enough. Agents iterate until satisfied.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| lightrag-hku >=1.4.15 | openai >=2.32.0 | LightRAG uses OpenAI for LLM + embeddings by default |
| raganything >=1.2.10 | lightrag-hku >=1.4.15 | RAG-Anything depends on LightRAG as foundation |
| openai-agents >=0.14.5 | openai >=2.32.0 | Agents SDK uses openai SDK internally |
| chromadb >=1.5.8 | Python >=3.9 | Lower Python floor, but 3.10 required by other deps |
| google-genai >=1.73.1 | Python >=3.10 | Strictest Python requirement in the stack |

**Python version floor: 3.10** -- driven by google-genai, python-dotenv, and sentence-transformers requirements. All other packages support 3.10+.

## API Cost Estimate (Full Demo Run)

| Tier | Indexing Cost | Query Cost (10 queries) | Notes |
|------|--------------|-------------------------|-------|
| Tier 1 | ~$0.01 (embeddings) | ~$0.02 (embeddings + gpt-4o-mini) | Cheapest. Local ChromaDB. |
| Tier 2 | ~$0.01 (Gemini indexing) | Free (query embeddings) + ~$0.01 (generation) | Google's pricing advantage. |
| Tier 3 | ~$0.10-0.30 (LLM entity extraction + embeddings) | ~$0.02 (retrieval + generation) | Indexing is LLM-heavy -- budget accordingly. |
| Tier 4 | ~$0.20-0.50 (LLM + VLM extraction) | ~$0.05 (multimodal queries use gpt-4o) | Most expensive due to vision model usage. |
| Tier 5 | ~$0.01 (if reusing Tier 1 index) | ~$0.05-0.10 (agent may do 2-3 retrieval rounds) | Agent loops increase token usage. |

**Total estimated cost for full demo: $1-2.** Readers can run everything for under $5 even with experimentation.

## Sources

- [ChromaDB PyPI](https://pypi.org/project/chromadb/) -- version 1.5.8 verified (HIGH confidence)
- [OpenAI Python SDK PyPI](https://pypi.org/project/openai/) -- version 2.32.0 verified (HIGH confidence)
- [google-genai PyPI](https://pypi.org/project/google-genai/) -- version 1.73.1 verified (HIGH confidence)
- [lightrag-hku PyPI](https://pypi.org/project/lightrag-hku/) -- version 1.4.15 verified (HIGH confidence)
- [raganything PyPI](https://pypi.org/project/raganything/) -- version 1.2.10 verified (HIGH confidence)
- [openai-agents PyPI](https://pypi.org/project/openai-agents/) -- version 0.14.5 verified (HIGH confidence)
- [python-dotenv PyPI](https://pypi.org/project/python-dotenv/) -- version 1.2.2 verified (HIGH confidence)
- [rich PyPI](https://pypi.org/project/rich/) -- version 15.0.0 verified (HIGH confidence)
- [pypdf PyPI](https://pypi.org/project/pypdf/) -- version 6.10.2 verified (HIGH confidence)
- [tiktoken PyPI](https://pypi.org/project/tiktoken/) -- version 0.12.0 verified (HIGH confidence)
- [Gemini File Search API docs](https://ai.google.dev/gemini-api/docs/file-search) -- File Search workflow verified (HIGH confidence)
- [LightRAG GitHub (HKUDS)](https://github.com/HKUDS/LightRAG) -- architecture and usage patterns verified (HIGH confidence)
- [RAG-Anything GitHub (HKUDS)](https://github.com/HKUDS/RAG-Anything) -- multimodal workflow verified (HIGH confidence)
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/tools/) -- FileSearchTool usage verified (HIGH confidence)
- [Milvus embedding model comparison](https://milvus.io/blog/choose-embedding-model-rag-2026.md) -- text-embedding-3-small benchmarks (MEDIUM confidence)

---
*Stack research for: RAG Architecture Patterns companion repo (5-tier)*
*Researched: 2026-04-17*
