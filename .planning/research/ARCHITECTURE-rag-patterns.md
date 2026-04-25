# Architecture Research

**Domain:** RAG Architecture Patterns blog post + companion GitHub repo integration
**Researched:** 2026-04-17
**Confidence:** HIGH

## System Overview

This milestone delivers two artifacts that reference each other: (1) a blog post on patrykgolabek.dev and (2) a companion GitHub repo (`PatrykQuantumNomad/rag-architecture-patterns`). The blog post integrates into the existing Astro 5 pipeline identically to dark-code.mdx. The companion repo is a standalone Python project with 5 tier directories sharing a common enterprise knowledge base dataset, evaluation harness, and utility layer.

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  BLOG POST (patrykgolabek.dev)                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────────┐     │
│  │  src/data/blog/rag-architecture-patterns.mdx                                │     │
│  │  - MDX content (~4,500 words)                                               │     │
│  │  - Imports existing blog components (StatHighlight, TermDefinition, etc.)    │     │
│  │  - Links to companion repo per-tier README anchors                          │     │
│  │  - Footnotes with research citations                                        │     │
│  └───────────────────────┬──────────────────────────────────────────────────────┘     │
│                          │                                                            │
│  ┌───────────────────────┼──────────────────────────────────────────────────────┐     │
│  │  BUILD PIPELINES      │  (all auto, zero config -- same as dark-code)       │     │
│  │  Content Collection → Page Gen → OG Image → Sitemap → RSS → LLMs.txt      │     │
│  └───────────────────────┼──────────────────────────────────────────────────────┘     │
│                          │                                                            │
│  ┌───────────────────────┼──────────────────────────────────────────────────────┐     │
│  │  MANUAL UPDATES       │  (same pattern as every native blog post)           │     │
│  │  [slug].astro: isRagPatternsPost + articleSection + FAQ JSON-LD             │     │
│  │  projects.ts: add entry for rag-architecture-patterns repo                  │     │
│  └───────────────────────┘──────────────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  COMPANION REPO (github.com/PatrykQuantumNomad/rag-architecture-patterns)            │
│                                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │ Tier 1     │  │ Tier 2     │  │ Tier 3     │  │ Tier 4     │  │ Tier 5     │     │
│  │ Naive RAG  │  │ Managed    │  │ Graph RAG  │  │ Multimodal │  │ Agentic    │     │
│  │ (ChromaDB) │  │ (File      │  │ (LightRAG) │  │ (RAG-      │  │ (LangGraph │     │
│  │            │  │  Search)   │  │            │  │  Anything) │  │  + tools)  │     │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘     │
│         │               │               │               │               │            │
│  ┌──────┴───────────────┴───────────────┴───────────────┴───────────────┴──────┐     │
│  │  SHARED LAYER                                                               │     │
│  │  dataset/     -- Enterprise KB (Markdown docs, PDFs, org chart image)       │     │
│  │  shared/      -- Config, LLM client factory, embedding utilities            │     │
│  │  evaluation/  -- RAGAS harness, golden Q&A pairs, scoring scripts           │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Blog MDX file | Research-heavy content, tier explanations, architecture diagrams, cross-links to repo | `src/data/blog/rag-architecture-patterns.mdx` |
| Blog post page | Renders MDX, injects JSON-LD, computes related posts | `src/pages/blog/[slug].astro` (modify) |
| Cover SVG | Visual identity for the post | `public/images/rag-architecture-patterns-cover.svg` |
| Projects registry | Lists companion repo on /projects/ page | `src/data/projects.ts` (modify) |
| Companion repo root | README with tier overview, quick-start, architecture diagram | `README.md` |
| Tier directories | Self-contained Python scripts with per-tier README | `tier-1-naive/`, `tier-2-managed/`, etc. |
| Shared dataset | Enterprise KB corpus used by all 5 tiers | `dataset/` |
| Shared utilities | LLM client factory, embedding wrapper, config | `shared/` |
| Evaluation harness | RAGAS-based scoring against golden Q&A pairs | `evaluation/` |

## Recommended Project Structure

### Companion Repo: `rag-architecture-patterns`

```
rag-architecture-patterns/
├── README.md                          # Repo overview, architecture diagram, quick-start
├── LICENSE                            # Apache 2.0
├── pyproject.toml                     # Project metadata, dependencies, optional groups
├── .env.example                       # Required API keys template
├── .gitignore                         # Python, .env, __pycache__, chroma_db/, lightrag_*
│
├── dataset/                           # Enterprise Knowledge Base (shared across all tiers)
│   ├── README.md                      # Dataset documentation, schema, provenance
│   ├── docs/                          # Markdown documents (primary text corpus)
│   │   ├── engineering-handbook.md    # ~3,000 words, engineering standards
│   │   ├── onboarding-guide.md       # ~2,000 words, new hire procedures
│   │   ├── architecture-decisions.md  # ~2,500 words, ADRs with cross-references
│   │   ├── incident-runbooks.md       # ~2,000 words, operational procedures
│   │   └── security-policies.md       # ~1,500 words, compliance & access control
│   ├── pdfs/                          # PDF documents (for multimodal tier)
│   │   ├── quarterly-report-q1.pdf    # Synthetic report with tables and charts
│   │   └── system-architecture.pdf    # Diagrams, flowcharts, technical drawings
│   ├── images/                        # Images (for multimodal tier)
│   │   └── org-chart.png             # Organizational chart referenced in docs
│   └── metadata.json                  # Document metadata: titles, authors, dates, tags
│
├── shared/                            # Shared utilities across all tiers
│   ├── __init__.py
│   ├── config.py                      # Pydantic Settings: API keys, model names, paths
│   ├── llm.py                         # LLM client factory (Gemini, OpenAI-compatible)
│   ├── embeddings.py                  # Embedding wrapper (text-embedding-004 default)
│   ├── loader.py                      # Document loader: reads dataset/, splits by format
│   └── display.py                     # Rich console output for demo scripts
│
├── evaluation/                        # RAGAS evaluation harness
│   ├── __init__.py
│   ├── golden_qa.json                 # 30 golden question-answer pairs with source docs
│   ├── run_evaluation.py              # Runs all tiers against golden QA, outputs scores
│   ├── metrics.py                     # Wraps RAGAS: faithfulness, relevancy, context recall
│   └── results/                       # .gitkeep, evaluation output JSONs land here
│       └── .gitkeep
│
├── tier-1-naive/                      # Tier 1: Naive RAG (basic vector similarity)
│   ├── README.md                      # Tier explanation, how to run, expected output
│   ├── ingest.py                      # Chunk docs, embed with text-embedding-004, store in ChromaDB
│   ├── query.py                       # Retrieve top-k chunks, send to Gemini for answer
│   └── requirements.txt              # Tier-specific deps: chromadb, google-genai
│
├── tier-2-managed/                    # Tier 2: Google Managed RAG (File Search API)
│   ├── README.md                      # Tier explanation, how to run, expected output
│   ├── setup_store.py                 # Create FileSearchStore, upload dataset files
│   ├── query.py                       # Query via generateContent with file_search tool
│   └── requirements.txt              # Tier-specific deps: google-genai
│
├── tier-3-graph/                      # Tier 3: Graph RAG (LightRAG)
│   ├── README.md                      # Tier explanation, how to run, expected output
│   ├── ingest.py                      # Feed docs into LightRAG, builds knowledge graph
│   ├── query.py                       # Query in naive/local/global/hybrid modes
│   └── requirements.txt              # Tier-specific deps: lightrag-hku
│
├── tier-4-multimodal/                 # Tier 4: Multimodal RAG (RAG-Anything)
│   ├── README.md                      # Tier explanation, how to run, expected output
│   ├── ingest.py                      # process_document_complete() with PDFs + images
│   ├── query.py                       # aquery_with_multimodal() for cross-modal retrieval
│   └── requirements.txt              # Tier-specific deps: raganything
│
├── tier-5-agentic/                    # Tier 5: Agentic RAG (LangGraph)
│   ├── README.md                      # Tier explanation, how to run, expected output
│   ├── graph.py                       # StateGraph: router -> retrieve -> grade -> generate
│   ├── tools.py                       # Retriever tool wrapping ChromaDB from Tier 1
│   ├── nodes.py                       # Node functions: grade_documents, rewrite, generate
│   └── requirements.txt              # Tier-specific deps: langgraph, langchain-google-genai
│
└── scripts/                           # Utility scripts
    ├── run_all_tiers.py               # Sequential demo: ingest + query each tier
    └── compare_tiers.py               # Runs same questions across tiers, tabulates results
```

### Structure Rationale

- **`dataset/` at root:** Every tier imports from the same dataset directory. This is the key architectural decision -- it enables apples-to-apples comparison across RAG approaches. The dataset is NOT duplicated per tier.
- **`shared/` utilities:** All tiers use the same LLM client factory and embedding functions. This eliminates boilerplate and ensures consistent model usage. The config module reads `.env` for API keys.
- **`evaluation/` with golden Q&A:** The golden_qa.json file contains 30 human-curated question-answer pairs derived from the dataset. RAGAS scores (faithfulness, answer relevancy, context precision, context recall) are computed per-tier and stored in `evaluation/results/`.
- **Per-tier `requirements.txt`:** Each tier has its own requirements file listing only tier-specific dependencies. A root `pyproject.toml` with optional groups (`[tier1]`, `[tier2]`, etc.) provides the full dependency tree for anyone who wants to install everything at once.
- **Per-tier README.md:** Each tier is self-contained. A reader can navigate to any tier directory and run it independently. The README explains the RAG pattern, shows expected output, and links back to the blog post section.
- **Flat tier directories:** No nested `src/` inside each tier. Each tier is 2-3 Python files. This keeps the cognitive load low for a tutorial repo.

## Architectural Patterns

### Pattern 1: Shared Dataset, Isolated Pipelines

**What:** All 5 tiers read from the same `dataset/` directory but build their own indexes/stores independently. No tier depends on another tier's output.

**When to use:** Tutorial/comparison repos where isolation between approaches is essential for fair comparison.

**Trade-offs:**
- Pro: Each tier can be run independently, in any order
- Pro: A reader interested only in Graph RAG can skip to `tier-3-graph/` without setting up ChromaDB
- Con: Some redundancy in ingestion code (each tier loads the same files differently)
- Con: Disk usage grows with each tier's index/store

### Pattern 2: Progressive Complexity Layering

**What:** Tiers are ordered from simplest (Naive RAG, ~50 LOC) to most complex (Agentic RAG, ~150 LOC). Each tier introduces exactly one new concept.

**When to use:** Educational content where the reader builds mental models incrementally.

**Trade-offs:**
- Pro: Clear learning progression
- Pro: Blog post can reference "if you understood Tier 1, Tier 3 adds knowledge graphs on top"
- Con: Some tiers (Tier 2 -- Managed) are actually simpler than Tier 1 in code volume, but more complex conceptually due to API abstraction

**Tier complexity progression:**

| Tier | New Concept Introduced | Approximate LOC | Key Library |
|------|------------------------|------------------|-------------|
| 1 - Naive | Vector similarity, chunking, top-k | ~50 | chromadb |
| 2 - Managed | Fully managed pipeline, zero infrastructure | ~30 | google-genai |
| 3 - Graph | Knowledge graph extraction, entity relationships | ~60 | lightrag-hku |
| 4 - Multimodal | Cross-modal retrieval (text + images + tables) | ~70 | raganything |
| 5 - Agentic | Stateful decision loops, routing, self-correction | ~150 | langgraph |

### Pattern 3: Blog-Repo Cross-Referencing via Anchored Links

**What:** The blog post links to specific tier directories and README anchors in the companion repo. The repo README links back to the blog post. This creates a bidirectional reference loop.

**When to use:** Any blog post with a companion repo. This is the established pattern in the existing site (see fastapi-chassis + FastAPI Production Guide).

**Cross-reference schema:**

```
Blog MDX:
  "See the [working implementation](https://github.com/PatrykQuantumNomad/rag-architecture-patterns/tree/main/tier-3-graph)"
  "The [companion repository](https://github.com/PatrykQuantumNomad/rag-architecture-patterns) contains runnable examples for all five tiers."

Repo README:
  "This repository accompanies the blog post [RAG Architecture Patterns](https://patrykgolabek.dev/blog/rag-architecture-patterns/)."

Per-tier README:
  "This tier implements the Naive RAG pattern described in the [RAG Architecture Patterns](https://patrykgolabek.dev/blog/rag-architecture-patterns/#naive-rag-the-baseline) blog post."
```

## Data Flow

### Enterprise Knowledge Base Dataset Architecture

The dataset simulates a mid-size engineering organization's internal knowledge base. It contains 5 Markdown documents (~11,000 words total), 2 PDF files (with tables, charts, and diagrams), 1 image file (org chart), and a metadata manifest.

```
┌─────────────────────────────────────────────────────────────────────┐
│  dataset/                                                          │
│                                                                     │
│  docs/ (Markdown)                     pdfs/ (Binary)               │
│  ┌──────────────────────┐             ┌──────────────────────┐     │
│  │ engineering-handbook  │             │ quarterly-report-q1   │     │
│  │ onboarding-guide     │             │ (tables, charts)      │     │
│  │ architecture-decisions│             │                       │     │
│  │ incident-runbooks    │             │ system-architecture    │     │
│  │ security-policies    │             │ (diagrams, flows)      │     │
│  └──────────┬───────────┘             └──────────┬───────────┘     │
│             │                                     │                 │
│  ┌──────────┴─────────────────────────────────────┴───────────┐    │
│  │  metadata.json                                              │    │
│  │  { "documents": [                                           │    │
│  │    { "id": "eng-handbook",                                  │    │
│  │      "path": "docs/engineering-handbook.md",                │    │
│  │      "title": "Engineering Standards Handbook",             │    │
│  │      "author": "Platform Team",                             │    │
│  │      "updated": "2026-03-15",                               │    │
│  │      "tags": ["standards", "code-review", "testing"],       │    │
│  │      "format": "markdown" }                                 │    │
│  │    ...                                                      │    │
│  │  ] }                                                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

**Design decisions for the dataset:**

1. **Synthetic, not proprietary.** All content is generated specifically for this repo. No real company data, no licensing issues, no privacy concerns. The dataset is committed directly to the repo.
2. **Cross-referencing between documents.** The architecture-decisions.md references the engineering-handbook.md by name. The onboarding-guide.md links to security-policies.md. This creates the kind of inter-document relationships that Graph RAG (Tier 3) and Agentic RAG (Tier 5) handle better than Naive RAG.
3. **Mixed modalities.** PDFs contain tables and charts. The org chart is an image. This gives Tier 4 (Multimodal) something meaningful to work with, while Tiers 1-3 can still operate on the text-only subset.
4. **~11,000 words total text.** Large enough for meaningful retrieval (chunking matters), small enough to run on a laptop without GPU.
5. **metadata.json as manifest.** Loaders can iterate this file to discover documents. Tags enable filtered retrieval in advanced tiers.

### Ingestion Flow (varies by tier)

```
dataset/docs/*.md + dataset/pdfs/*.pdf
    │
    ├── Tier 1: shared/loader.py → chunk (512 tokens) → embed → ChromaDB
    ├── Tier 2: upload to FileSearchStore → Google handles chunking/embedding
    ├── Tier 3: LightRAG.insert() → entity extraction → knowledge graph + vector store
    ├── Tier 4: RAGAnything.process_document_complete() → multimodal KG
    └── Tier 5: reuses Tier 1 ChromaDB as retriever tool for LangGraph agent
```

### Query Flow (varies by tier)

```
User Question: "What is the incident escalation process for P1 outages?"
    │
    ├── Tier 1: embed query → top-k cosine similarity → concatenate chunks → LLM
    ├── Tier 2: generateContent(file_search=store) → Google retrieves + generates
    ├── Tier 3: LightRAG.query(mode="hybrid") → graph traversal + vector → LLM
    ├── Tier 4: RAGAnything.aquery() → multimodal retrieval → LLM with image context
    └── Tier 5: StateGraph: route → retrieve → grade relevance → generate OR rewrite
                     ↑                                              │
                     └──────── loop if documents grade as irrelevant ┘
```

### Evaluation Flow

```
evaluation/golden_qa.json (30 Q&A pairs)
    │
    ├── Each tier's query.py answers all 30 questions
    ├── RAGAS computes per-tier metrics:
    │   - Faithfulness (is the answer grounded in retrieved context?)
    │   - Answer Relevancy (does the answer address the question?)
    │   - Context Precision (are relevant chunks ranked higher?)
    │   - Context Recall (were all relevant chunks retrieved?)
    └── Results written to evaluation/results/tier-{N}-scores.json
```

### Key Data Flows

1. **Dataset to indexes:** Each tier creates its own index/store from the shared dataset. Tiers 1 and 5 share ChromaDB. Tier 2 uploads to Google Cloud. Tiers 3 and 4 build local knowledge graphs.
2. **Blog to repo:** The blog post links to specific tier directories. Each link uses the GitHub tree URL pattern: `https://github.com/PatrykQuantumNomad/rag-architecture-patterns/tree/main/tier-N-name`.
3. **Repo to blog:** Each tier README and the root README link back to the blog post URL: `https://patrykgolabek.dev/blog/rag-architecture-patterns/`.
4. **Evaluation loop:** The `compare_tiers.py` script generates a comparison table that could be embedded as a screenshot or reconstructed as a Markdown table in the blog post.

## Blog Post Integration Points

### Files to CREATE

```
src/data/blog/
└── rag-architecture-patterns.mdx     # The blog post

public/images/
└── rag-architecture-patterns-cover.svg  # Cover SVG (referenced in frontmatter)
```

### Files to MODIFY

```
src/pages/blog/
└── [slug].astro                       # Add isRagPatternsPost boolean:
                                       #   - articleSection = 'AI Architecture'
                                       #   - aboutDataset = { type: 'SoftwareSourceCode',
                                       #     name: 'RAG Architecture Patterns',
                                       #     url: 'https://github.com/PatrykQuantumNomad/rag-architecture-patterns' }
                                       #   - ragPatternsFAQ array (3-5 FAQ items)

src/data/projects.ts                   # Add new project entry:
                                       #   { name: 'rag-architecture-patterns',
                                       #     description: '...',
                                       #     url: 'https://github.com/PatrykQuantumNomad/...',
                                       #     language: 'Python',
                                       #     category: 'AI & Intelligent Agents',
                                       #     technologies: ['Python', 'LangGraph', 'LightRAG',
                                       #       'RAG-Anything', 'ChromaDB', 'Gemini'],
                                       #     status: 'active',
                                       #     gridSize: 'medium' }
```

### Files that need NO changes (auto-integrate)

```
src/content.config.ts                  # glob('**/*.{md,mdx}') auto-discovers
src/pages/blog/[...page].astro         # Listing page queries collection dynamically
src/pages/blog/tags/[tag].astro        # Tag pages query collection dynamically
src/pages/rss.xml.ts                   # RSS iterates all non-draft posts
src/pages/llms.txt.ts                  # Blog section iterates all non-draft posts
src/pages/llms-full.txt.ts             # Same, extended content
src/pages/open-graph/[...slug].png.ts  # OG image generated from collection
astro.config.mjs                       # Sitemap automatically includes blog pages
remark-reading-time.mjs                # Computes reading time automatically
src/components/TableOfContents.astro   # Generated from headings
```

### New Astro Components: NONE

No new components are needed. The existing blog component library covers all requirements:

| Existing Component | Usage in RAG Post |
|-------------------|-------------------|
| `OpeningStatement` | Opening paragraph hook |
| `TldrSummary` | 4-5 bullet summary |
| `StatHighlight` | Key statistics (e.g., "5x" context window utilization improvement) |
| `TermDefinition` | Define "Naive RAG", "Graph RAG", "Agentic RAG" |
| `Figure` | Architecture diagrams as SVGs |
| `Callout` | Tips, warnings (e.g., "Tier 2 requires a Google API key") |
| `KeyTakeaway` | Section conclusions |

## Anti-Patterns

### Anti-Pattern 1: Monolithic Notebook Per Tier

**What people do:** Put each tier in a single Jupyter notebook with inline explanations.
**Why it's wrong:** Notebooks are hard to test, hard to diff, hard to run in CI, and create import dependency nightmares. They also cannot share utilities cleanly across tiers.
**Do this instead:** Use plain Python scripts (`.py`) with per-tier READMEs for explanation. The blog post itself provides the narrative. The repo provides runnable code.

### Anti-Pattern 2: Duplicating the Dataset Per Tier

**What people do:** Copy the corpus into each tier's directory so each is "self-contained."
**Why it's wrong:** Dataset drift. When you fix a typo in the engineering handbook, you need to fix it in 5 places. Comparison results become meaningless if tiers run against subtly different datasets.
**Do this instead:** Single `dataset/` at root. All tiers import from it via relative path or a shared loader.

### Anti-Pattern 3: Hardcoded API Keys in Examples

**What people do:** Include placeholder API keys like `sk-xxx` directly in Python files.
**Why it's wrong:** Even placeholder keys teach bad habits. Real keys inevitably leak when someone forgets to swap them.
**Do this instead:** Use `.env.example` with empty values. `shared/config.py` reads from environment via Pydantic Settings. Every README starts with "Copy `.env.example` to `.env` and add your keys."

### Anti-Pattern 4: Framework Maximalism in Naive RAG

**What people do:** Use LangChain for Tier 1 to "keep things consistent."
**Why it's wrong:** The entire point of Naive RAG is showing the raw pattern: embed, store, retrieve, generate. Adding LangChain abstractions obscures the mechanism. The reader learns LangChain's API, not RAG.
**Do this instead:** Tier 1 uses only `chromadb` and `google-genai` directly. No framework. The reader sees every step. LangChain/LangGraph are reserved for Tier 5 where the framework's graph abstraction genuinely adds value.

### Anti-Pattern 5: Over-Engineering the Enterprise Dataset

**What people do:** Build a 100-document corpus with complex taxonomies, versioning, and access control simulation.
**Why it's wrong:** The dataset exists to demonstrate RAG tier differences, not to simulate a real enterprise. Complexity in the dataset obscures the RAG pattern being demonstrated.
**Do this instead:** 5 Markdown docs + 2 PDFs + 1 image. Small enough to read in 30 minutes, large enough that retrieval matters. Inter-document references create the graph structure Graph RAG needs. Mixed modalities give Multimodal RAG something to work with.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Gemini API | `google-genai` Python SDK, used as LLM + embeddings across all tiers | Requires `GOOGLE_API_KEY`. Free tier sufficient for demo. |
| Google File Search API | `client.file_search_stores` via same SDK | Tier 2 only. Stores persist in Google Cloud. Cleanup script recommended. |
| ChromaDB | Local persistent storage in `tier-1-naive/chroma_db/` | No cloud service. Runs on laptop. `.gitignore` the storage dir. |
| LightRAG | Local knowledge graph storage in `tier-3-graph/lightrag_data/` | No cloud service. Requires 32B+ param model for entity extraction (Gemini works). |
| RAG-Anything | Extends LightRAG with MinerU for document parsing | Tier 4 only. May need LibreOffice for Office docs (not used in our dataset). |
| LangGraph | Stateful agent graph, in-memory state | Tier 5 only. No cloud service. |
| RAGAS | Evaluation framework, uses LLM for metric computation | Runs against all tiers. Consumes LLM tokens for scoring. |

### Internal Boundaries (Companion Repo)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| dataset/ <-> tier-N/ | File system reads via shared/loader.py | Tiers never write to dataset/ |
| shared/ <-> tier-N/ | Python imports: `from shared.config import settings` | All tiers depend on shared/ |
| evaluation/ <-> tier-N/ | evaluation/run_evaluation.py imports each tier's query module | Evaluation is a consumer, not a dependency |
| tier-5-agentic/ <-> tier-1-naive/ | Tier 5 reuses Tier 1's ChromaDB as its retriever tool | Only cross-tier dependency. Tier 1 must ingest before Tier 5 can run. |

### Internal Boundaries (Blog Site)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MDX content <-> blog components | Astro component imports in MDX | Uses existing components only |
| [slug].astro <-> MDX | Post-specific config (articleSection, FAQ, aboutDataset) | Same pattern as dark-code, beauty-index, etc. |
| projects.ts <-> /projects/ page | Data file drives page rendering | Add one entry |
| Blog post <-> companion repo | Hyperlinks (not embeds, not submodules) | No build-time coupling |

## Suggested Build Order

Based on dependency analysis, the recommended phase structure:

1. **Phase 1: Dataset + Shared Layer + Tier 1 (Naive RAG)**
   - Create the companion repo skeleton
   - Write the enterprise KB dataset (5 docs + 2 PDFs + 1 image + metadata.json)
   - Build shared/ utilities (config, LLM factory, embeddings, loader)
   - Implement Tier 1 (Naive RAG with ChromaDB) -- validates the entire shared layer
   - Write Tier 1 README
   - Rationale: Everything else depends on dataset and shared layer

2. **Phase 2: Tier 2 (Managed) + Tier 3 (Graph RAG)**
   - Implement Tier 2 (Google File Search API) -- simplest API, validates dataset upload
   - Implement Tier 3 (LightRAG Graph RAG) -- validates dataset with graph extraction
   - Write per-tier READMEs
   - Rationale: Independent of each other, both depend only on dataset + shared

3. **Phase 3: Tier 4 (Multimodal) + Tier 5 (Agentic RAG)**
   - Implement Tier 4 (RAG-Anything) -- needs PDFs and images from dataset
   - Implement Tier 5 (Agentic RAG with LangGraph) -- depends on Tier 1 ChromaDB
   - Write per-tier READMEs
   - Rationale: Tier 5 depends on Tier 1 being complete. Tier 4 is independent but grouped here by complexity.

4. **Phase 4: Evaluation Harness**
   - Write golden_qa.json (30 Q&A pairs derived from dataset)
   - Build RAGAS evaluation runner
   - Run evaluation across all 5 tiers
   - Build comparison script
   - Rationale: All tiers must exist before evaluation can run

5. **Phase 5: Blog Post + Site Integration**
   - Write the MDX blog post (~4,500 words)
   - Generate cover SVG
   - Modify [slug].astro (articleSection, FAQ JSON-LD, aboutDataset)
   - Add projects.ts entry
   - Write repo root README with architecture diagram
   - Rationale: Blog references evaluation results and all tier implementations

6. **Phase 6: Polish + Verification**
   - Run the 6-verifier build chain
   - Verify all cross-links (blog -> repo, repo -> blog)
   - Ensure OG image generates correctly
   - Final review of all READMEs
   - Rationale: Integration testing after all artifacts exist

## Sources

- [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG) -- Graph RAG library, EMNLP 2025
- [HKUDS/RAG-Anything](https://github.com/HKUDS/RAG-Anything) -- Multimodal RAG framework built on LightRAG
- [Google File Search API docs](https://ai.google.dev/gemini-api/docs/file-search) -- Managed RAG via Gemini API
- [LangGraph Agentic RAG tutorial](https://docs.langchain.com/oss/python/langgraph/agentic-rag) -- Official LangChain docs
- [RAGAS evaluation framework](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) -- RAG evaluation metrics
- [NirDiamant/RAG_Techniques](https://github.com/NirDiamant/rag_techniques) -- Comprehensive RAG tutorial repository
- [Azure-Samples/Design-and-evaluation-of-RAG-solutions](https://github.com/Azure-Samples/Design-and-evaluation-of-RAG-solutions) -- Enterprise RAG best practices
- [LightRAG PyPI (lightrag-hku)](https://pypi.org/project/lightrag-hku/1.2.6/) -- Package distribution
- [DataCamp Google File Search Tutorial](https://www.datacamp.com/tutorial/google-file-search-tool) -- File Search API walkthrough
- [RAG Architecture Explained (orq.ai)](https://orq.ai/blog/rag-architecture) -- Tier maturity framework

---
*Architecture research for: RAG Architecture Patterns blog + companion repo*
*Researched: 2026-04-17*
