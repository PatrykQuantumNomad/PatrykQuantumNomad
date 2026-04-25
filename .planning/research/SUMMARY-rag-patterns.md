# Project Research Summary

**Project:** RAG Architecture Patterns — Blog Post + Companion Repo (v1.22)
**Domain:** Research-heavy thought-leadership blog post (~4,500 words) with runnable Python companion repository (5-tier progressive RAG examples)
**Researched:** 2026-04-17
**Confidence:** HIGH

## Executive Summary

This milestone delivers two tightly coupled artifacts: a thought-leadership blog post on patrykgolabek.dev and a companion GitHub repo (`PatrykQuantumNomad/rag-architecture-patterns`). The central thesis — "RAG is an architecture decision, not an implementation detail" — positions the post against the 2026 sea of "how to build RAG" tutorials by reframing tier selection as an engineering leadership judgment analogous to choosing microservices over a monolith. The five tiers (Naive RAG with ChromaDB, Google Gemini File Search, LightRAG graph RAG, RAG-Anything multimodal, and Agentic RAG via the OpenAI Agents SDK) are demonstrated against a single synthetic enterprise knowledge base, which is the structural differentiator no existing 2026 RAG post offers. The post resolves with Adaptive RAG as the "hidden sixth tier" — a query classifier that routes each incoming question to the cheapest tier that can handle it, which is the architecture decision itself.

The recommended stack is Python 3.10+ managed with uv, with per-tier dependency isolation via individual `requirements.txt` files and a root `pyproject.toml`. Four libraries anchor the tiers where the HKUDS lab's work is most significant: chromadb (Tier 1, zero-config embedded vector DB), google-genai (Tier 2, File Search API), lightrag-hku (Tier 3, EMNLP 2025 knowledge graph RAG), and raganything (Tier 4, multimodal RAG built on LightRAG). The OpenAI Agents SDK replaces LangGraph for Tier 5 because its code reads like plain Python rather than a framework DSL — critical for a teaching repo where readers need to understand the concepts, not debug a graph abstraction. Default model is gpt-4o-mini for all OpenAI-dependent tiers; gemini-2.5-flash for Tier 2; the shared embedding is text-embedding-3-small at $0.02/M tokens. Total estimated cost for a full demo run across all five tiers: under $2.

The primary risks are reproducibility and voice. Reproducibility: Tier 3 (LightRAG) requires LLM calls during indexing that cost 3-5x more than naive RAG indexing; Tier 4 (RAG-Anything) depends on MinerU and optionally LibreOffice, making it the most fragile tier; Tier 5 (Agentic) can enter cost-explosion loops without explicit iteration caps. Each must be addressed with Docker paths, cost estimates, and hard limits before the blog post is written. Voice: with 105+ NotebookLM sources and a 5-tier structure that naturally pulls toward tutorial style, the post risks reading like a literature review. Every section must lead with an opinionated claim ("what goes wrong here and why"), not a description of how the tier works.

## Key Findings

### Recommended Stack

The stack is unusually well-defined for research output because every package version was verified against PyPI at research time (HIGH confidence across all tiers). The most important architectural choice is using the OpenAI Agents SDK over LangGraph for Tier 5 — LangGraph's StateGraph DSL adds abstraction overhead that obscures the agentic pattern in a tutorial context. The LightRAG-to-RAG-Anything progression between Tiers 3 and 4 is architecturally coherent (same HKUDS team, RAG-Anything literally extends LightRAG), which makes the educational progression clean. The decision to avoid LangChain/LlamaIndex entirely is correct: the whole value of the 5-tier structure is seeing the mechanics, not a framework's API.

**Core technologies:**
- Python 3.10+: runtime floor driven by google-genai's strict requirement
- uv (latest): package management — 10-100x faster than pip, lockfile reproducibility; pip fallback via `requirements.txt`
- openai >=2.32.0: LLM client for Tiers 1, 3, 4, 5 (text-embedding-3-small + gpt-4o-mini)
- google-genai >=1.73.1: unified Gemini SDK for Tier 2 File Search; do NOT use legacy `google-generativeai`
- chromadb >=1.5.8: embedded vector DB for Tier 1 (zero-config, no server)
- lightrag-hku >=1.4.15: EMNLP 2025 knowledge graph RAG for Tier 3
- raganything >=1.2.10: multimodal RAG for Tier 4, built on LightRAG (install with `[all]` extra)
- openai-agents >=0.14.5: lightweight agentic framework for Tier 5, plain Python tools
- pypdf >=6.10.2: PDF extraction for Tier 1 (PyPDF2 is deprecated — avoid)
- rich >=15.0.0: terminal output for visually compelling demos without a UI
- tiktoken >=0.12.0: token counting for chunking and cost estimation

**What NOT to use:** LangChain (hides RAG mechanics), llama-index (same problem), Pinecone/Weaviate/Milvus (require cloud accounts or Docker servers), sentence-transformers (pulls PyTorch ~2GB unnecessarily), Docker for Tiers 1-2 (adds complexity that distracts from concepts).

### Expected Features

The feature landscape is well-characterized with clear priority tiers. The single most important structural decision — which no existing 2026 RAG post makes — is running the same enterprise knowledge base dataset across all five tiers. Everything else follows from that.

**Must have (table stakes):**
- OpeningStatement + TldrSummary (existing site component, reuse Dark Code pattern)
- Clear 5-tier progression narrative with thesis framing in every section heading
- Cost/latency/accuracy comparison data across tiers (arxiv 2601.07711 + Starmorph benchmarks)
- Same enterprise knowledge base dataset across all tiers (5 Markdown docs + 2 PDFs + 1 image + metadata.json)
- Companion GitHub repo with 5 tier directories, shared `/dataset/`, and runnable `main.py` per tier
- 25-35 GFM footnote citations from 105+ NotebookLM source pool (URLs verified before committing)
- Custom cover SVG (breaks listing page visual consistency if missing)
- FAQPage JSON-LD with 5-7 high-search-volume questions
- Cross-links to AI Landscape Explorer, Claude Code Guide, and Dark Code post
- Comparison table: accuracy, cost, latency, complexity across all 5 tiers

**Should have (competitive differentiators):**
- "RAG is an architecture decision" thesis framing — distinguishes from every implementation-focused tutorial
- Adaptive RAG conclusion section — the thesis resolution, not a 6th tier
- StatHighlight components with benchmark data (4-6 callouts at tier transition points)
- Per-tier SVG architecture diagrams (5 diagrams, data flow per tier) — P2, add within a week of publication
- "When to use this tier" decision framework — named, referenceable model analogous to Dark Code's spectrum
- First-person observations per tier ("I ran the same 15 documents through all 5 tiers. Here is what surprised me.")
- Evaluation harness with 30 golden Q&A pairs and RAGAS metrics
- Per-tier expected output files in repo (`expected-output/tier-N-response.json`)

**Defer (v2+):**
- Interactive tier selector tool page (only if post gains organic traction)
- Companion video walkthrough
- RAGAS metrics as a standalone blog post
- Framework comparison (LangChain vs LlamaIndex vs LangGraph) — dates instantly, out of scope
- Vector database comparison — same problem
- "Open in Colab" notebook versions — add after launch

### Architecture Approach

The system is two tightly coupled artifacts connected by hyperlinks, not build-time coupling. The blog post is an MDX file integrated into the existing Astro 5 pipeline identically to `dark-code.mdx` — zero new components needed. The companion repo is a standalone Python project with a clear separation of concerns: `dataset/` (shared corpus), `shared/` (LLM client factory, embedding wrapper, config), `evaluation/` (RAGAS harness + golden Q&A), and five `tier-N-name/` directories each containing `ingest.py`, `query.py`, and a per-tier `requirements.txt`. The only cross-tier dependency in the repo is Tier 5 reusing Tier 1's ChromaDB index as its retriever tool — this must be documented explicitly.

**Major components:**

1. **Enterprise knowledge base dataset** (`dataset/`) — 5 Markdown docs (~11,000 words total), 2 PDFs (tables, charts, diagrams), 1 org chart image, metadata.json manifest. Synthetic "Acme Corp" content with deliberate cross-document references and mixed modalities. Critical path: everything else depends on it.

2. **Shared utilities** (`shared/`) — Pydantic Settings config reading from `.env`, LLM client factory, text-embedding-3-small wrapper, document loader that reads `dataset/` by format. All tiers import from here; dataset/ is read-only from tier code.

3. **Evaluation harness** (`evaluation/`) — 30 human-curated golden Q&A pairs, RAGAS runner computing faithfulness/answer relevancy/context precision/context recall per tier, results in `evaluation/results/`. Objective comparison mechanism.

4. **Tier implementations** (5 directories) — self-contained, independently runnable. Tier 1: ~50 LOC raw ChromaDB + OpenAI. Tier 2: ~30 LOC Google File Search API. Tier 3: ~60 LOC LightRAG hybrid query. Tier 4: ~70 LOC RAG-Anything multimodal. Tier 5: ~150 LOC OpenAI Agents SDK with tool loop and iteration cap.

5. **Blog post MDX** (`src/data/blog/rag-architecture-patterns.mdx`) — uses only existing components. Two files need manual modification in the Astro site: `[slug].astro` (add `isRagPatternsPost`, articleSection, FAQ JSON-LD) and `src/data/projects.ts` (add repo entry).

### Critical Pitfalls

Ten pitfalls documented at HIGH confidence. These five are phase-blocking:

1. **"Yet another RAG post" angle** — Open with the thesis, not a definition of RAG. Every section heading is an argument ("When Cosine Similarity Stops Being Enough"), not a tier name. First-person observations mandatory in every tier section. Catch in outline review against 3-5 existing 2026 RAG posts before a word is written.

2. **NotebookLM citation laundering** — 105 sources creates false confidence. Every quantitative claim must trace to the primary source — not a Medium blog post that cited the paper. Create `sources-rag.md` with primary/secondary classification before writing begins. Version-lock all framework claims to specific release dates.

3. **Companion repo reproducibility** — RAG repos have uniquely high reproducibility failure rates: API keys, system-level dependencies (LibreOffice for Tier 4, 32B+ model for Tier 3 local mode), non-deterministic LLM outputs. Every tier must document expected API costs. Tier 4 must be Dockerized as the primary pathway. All tiers tested on a clean environment before publication.

4. **Enterprise KB dataset too simple** — A text-only or single-document dataset makes Tier 3 and Tier 4 look like unnecessary complexity. Design the dataset backward from all 5 tier requirements: cross-document references for graph RAG, PDFs with tables and images for multimodal RAG, versioned documents for agentic temporal reasoning. Include 30 ground-truth Q&A pairs.

5. **Agentic RAG (Tier 5) cost explosion** — Each agent loop is 10-15 LLM calls. Set `max_iterations=10` and `max_tokens=50000` as hard limits in code. Include a cost estimator script. Provide 3 example queries with pre-computed cost estimates (simple ~$0.01, medium ~$0.05, complex ~$0.15).

## Implications for Roadmap

Based on research, the architecture imposes a clear dependency order: dataset first, shared layer second, tiers in ascending complexity, evaluation after all tiers exist, blog post last (references evaluation results and all implementations). This maps to 7 phases.

### Phase 1: Dataset + Shared Layer + Repo Skeleton

**Rationale:** Every tier depends on the same dataset. Every tier imports from the shared utilities. Nothing else can be built until these exist. Most risk-laden phase: if the dataset is too simple, the entire progression argument fails.

**Delivers:** Companion repo skeleton (README, pyproject.toml, .env.example, .gitignore), enterprise KB dataset (5 Markdown docs + 2 PDFs + 1 org chart image + metadata.json), shared utilities (config.py, llm.py, embeddings.py, loader.py, display.py), 30 golden Q&A pairs for evaluation.

**Addresses:** Enterprise KB dataset (P1 feature), shared dataset requirement, ground-truth evaluation pairs.

**Avoids:** Pitfall 4 (dataset too simple — design backward from all 5 tier requirements); Pitfall 3 (repo reproducibility — `.env.example` and `.gitignore` from first commit); security (no real company data, entirely synthetic).

### Phase 2: Tier 1 (Naive RAG)

**Rationale:** Tier 1 validates the entire shared layer and is the baseline against which all other tiers are measured. Tier 5 has a hard dependency on Tier 1's ChromaDB index. Completing Tier 1 before anything else ensures the foundation is solid.

**Delivers:** `tier-1-naive/` with `ingest.py`, `query.py`, `requirements.txt`, `README.md`. ~50 LOC raw OpenAI + ChromaDB, no framework. Expected output samples in `expected-output/tier-1-response.json`.

**Uses:** chromadb >=1.5.8, openai >=2.32.0, pypdf >=6.10.2.

**Avoids:** Framework maximalism in Naive RAG — no LangChain; reader sees every step.

### Phase 3: Tiers 2 + 3 (Managed RAG + Graph RAG)

**Rationale:** Both depend only on the dataset and shared layer. They can be developed in parallel. Together they form the conceptual middle: Tier 2 shows what you give up with managed services (control), Tier 3 shows what you gain with graph structures (cross-document reasoning).

**Delivers:** `tier-2-managed/` (~30 LOC) and `tier-3-graph/` (~60 LOC). Dual-pathway documentation for Tier 3: API mode (Gemini Flash, documented cost ~$0.35 for full dataset indexing) and local mode (Ollama + 32B model, documented hardware requirements). Embedding model locked in config and documented prominently with warning against changing it post-index.

**Uses:** google-genai >=1.73.1 (Tier 2), lightrag-hku >=1.4.15 (Tier 3).

**Avoids:** Pitfall 5 (Tier 2 black-box — frame as "trading control for convenience," include managed-service failure cases); Pitfall 6 (LightRAG compute — document costs, dual pathway, warn against reasoning models during indexing).

### Phase 4: Tiers 4 + 5 (Multimodal + Agentic RAG)

**Rationale:** Tier 4 naturally extends Tier 3 (RAG-Anything extends LightRAG). Tier 5 requires Tier 1's ChromaDB index. Both are the highest-complexity tiers and should be built last to avoid overengineering.

**Delivers:** `tier-4-multimodal/` with Dockerfile as primary pathway (LibreOffice + MinerU pre-installed), version-pinned raganything, pre-computed outputs for readers who cannot install dependencies. `tier-5-agentic/` with hard limits (max_iterations=10, max_tokens=50000), cost estimator script, 3 example queries with pre-computed cost estimates, execution trace logs.

**Uses:** raganything >=1.2.10 (Tier 4), openai-agents >=0.14.5 (Tier 5).

**Avoids:** Pitfall 7 (RAG-Anything fragility — Docker primary, version pinned, troubleshooting section in README); Pitfall 8 (Agentic cost explosion — hard limits, cost estimator, pre-computed traces).

### Phase 5: Evaluation Harness + Comparison Scripts

**Rationale:** All 5 tiers must exist before evaluation can run. Evaluation results are what the blog post references as objective comparison data. Converts cost estimates to measured numbers.

**Delivers:** RAGAS runner, per-tier score JSON files in `evaluation/results/`, `scripts/compare_tiers.py` output (comparison table used directly in blog post). Actual measured costs per tier to populate blog StatHighlights with verified numbers.

**Uses:** RAGAS evaluation framework, all 5 tier `query.py` modules.

**Avoids:** Pitfall 2 (citation laundering — measured costs replace estimated costs; blog claims grounded in repo-generated data, not secondary sources).

### Phase 6: Blog Post + Site Integration

**Rationale:** Blog post is written last, after all code is frozen and evaluation results are in hand. Repo is the source of truth. Writing after code freezes eliminates blog-repo cross-reference drift entirely.

**Delivers:** `src/data/blog/rag-architecture-patterns.mdx` (~4,500 words), cover SVG, `[slug].astro` modifications (isRagPatternsPost, articleSection, FAQ JSON-LD), `src/data/projects.ts` entry, repo root README with architecture diagram and bidirectional links, `BLOG_SYNC.md` mapping blog sections to repo directories.

**Avoids:** Pitfall 1 (tutorial voice — outline reviewed against 5 existing RAG posts; every section heads with a claim); Pitfall 9 (cross-reference drift — every code snippet has file path comment, every output has date and model version); Pitfall 10 (literature review voice — first-person observations mandatory, repo handles "how," blog handles "why").

### Phase 7: Polish + Verification

**Rationale:** Integration testing after all artifacts exist. The 6-verifier build chain. Clean-room test of the companion repo is a hard gate before publication.

**Delivers:** Verified OG image, Rich Results Test passing for JSON-LD, all internal cross-links functional, companion repo clean-room test passing, all code snippets in blog verified against repo.

### Phase Ordering Rationale

- Dataset before code: the enterprise KB is the critical path dependency for all 5 tiers and the evaluation harness. Design it wrong and every subsequent phase is compromised.
- Tier 1 before all other tiers: validates the shared layer, creates the ChromaDB index Tier 5 depends on, establishes the baseline every other tier is compared against.
- Tiers 2 and 3 in parallel: neither depends on the other, and their contrast (managed simplicity vs. graph power) is a natural narrative pairing.
- Tiers 4 and 5 last among tiers: highest complexity, Tier 4 extends Tier 3, Tier 5 extends Tier 1.
- Evaluation before blog: converts estimates to measured numbers, generates objective comparison data.
- Blog last: repo is the source of truth. Writing after code freezes eliminates cross-reference drift entirely.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3 (Tier 3: LightRAG):** Verify the Python API (`LightRAG`, `QueryParam`, async insert/query) against `lightrag-hku==1.4.15` before implementation. Specifically: which storage backends work without Neo4j, whether `text-embedding-3-small` is supported as the embedding function, and whether the "do NOT use reasoning models during indexing" warning still applies to v1.4.x.
- **Phase 4 (Tier 4: RAG-Anything):** Active academic package (published October 2025). Verify MinerU installation steps and whether LibreOffice is required for our dataset (Markdown + PDF only, no .docx). Pre-check whether `raganything[all]` installs cleanly without system-level dependencies for PDF-only file types.
- **Phase 4 (Tier 5: Agentic RAG):** Verify that `FileSearchTool` and custom `@function_tool` decorators coexist cleanly in the same OpenAI Agents SDK agent, and that the retrieve → grade → rewrite → retrieve loop is expressible without StateGraph. If the SDK proves insufficient, LangGraph is the documented fallback.

Phases with standard patterns (skip additional research):

- **Phase 1 (Dataset + Shared Layer):** Synthetic dataset creation, Pydantic Settings, document loaders — well-documented patterns.
- **Phase 2 (Tier 1: Naive RAG):** Most documented RAG pattern in existence. No research needed.
- **Phase 3 (Tier 2: Managed RAG):** Google File Search API pattern verified in STACK.md with exact code. No additional research needed.
- **Phase 7 (Polish + Verification):** 6-verifier build chain and site integration patterns established from v1.20/v1.21. Follow Dark Code precedent.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified against PyPI at research time. Version compatibility matrix validated. API patterns verified against official SDKs. |
| Features | HIGH | Grounded in competitive analysis (Galileo, NirDiamant, Starmorph, arxiv 2601.07711) and direct analysis of existing site patterns. Feature prioritization is opinionated and well-justified. |
| Architecture | HIGH | Repository structure follows proven patterns (NirDiamant/RAG_Techniques for repo design, dark-code.mdx for blog integration). Internal boundaries clearly defined. |
| Pitfalls | HIGH | Grounded in 2026 RAG ecosystem research, v1.20/v1.21 site analysis, official LightRAG and RAG-Anything repository documentation for specific limitations. |

**Overall confidence:** HIGH

### Gaps to Address

- **LightRAG API drift from paper:** The EMNLP 2025 paper and `lightrag-hku` v1.4.15 may have diverged. Verify the `QueryParam(mode="hybrid")` pattern and embedding function signatures before Phase 3 implementation begins.
- **RAG-Anything file type dependency:** Research documents LibreOffice as a dependency for Office formats. Our dataset uses only Markdown and PDF. Verify whether LibreOffice is required at install time even when processing PDF-only documents — if not, the Tier 4 Docker image may be significantly lighter.
- **OpenAI Agents SDK multi-tool coexistence:** Verify that `FileSearchTool` and custom `@function_tool` decorators work cleanly in the same Agent before committing to the OpenAI Agents SDK for Tier 5.
- **Google File Search API stability:** A community report documents backend-update-induced degradation. Test and document results on publication date. Frame managed-service instability as a teaching point in the Tier 2 section.
- **Source verification scope:** `sources-rag.md` with primary/secondary classification for all 105+ NotebookLM sources must be completed as a standalone pre-writing step. Every quantitative claim (2.7-3.9x token overhead, 25-40% accuracy improvement, $0.001 vs $0.10/query) must trace to its primary source before appearing in the blog post.

## Sources

### Primary (HIGH confidence)

- [ChromaDB PyPI v1.5.8](https://pypi.org/project/chromadb/) — Tier 1 vector DB, version verified
- [OpenAI Python SDK PyPI v2.32.0](https://pypi.org/project/openai/) — LLM client for Tiers 1, 3, 4, 5
- [google-genai PyPI v1.73.1](https://pypi.org/project/google-genai/) — Tier 2 Gemini SDK with File Search support
- [lightrag-hku PyPI v1.4.15](https://pypi.org/project/lightrag-hku/) — Tier 3 Graph RAG
- [raganything PyPI v1.2.10](https://pypi.org/project/raganything/) — Tier 4 Multimodal RAG
- [openai-agents PyPI v0.14.5](https://pypi.org/project/openai-agents/) — Tier 5 Agentic RAG
- [Gemini File Search API documentation](https://ai.google.dev/gemini-api/docs/file-search) — Tier 2 pattern verified
- [HKUDS/LightRAG GitHub](https://github.com/HKUDS/LightRAG) — architecture, usage, EMNLP 2025
- [HKUDS/RAG-Anything GitHub](https://github.com/HKUDS/RAG-Anything) — 1+3+N architecture, multimodal workflow
- [OpenAI Agents SDK documentation](https://openai.github.io/openai-agents-python/tools/) — FileSearchTool + function_tool patterns
- [arxiv 2601.07711 "Is Agentic RAG Worth It?"](https://arxiv.org/abs/2601.07711) — 2.7-3.9x token overhead, 1.5x latency benchmark
- [LightRAG arXiv paper](https://arxiv.org/html/2410.05779v1) — EMNLP 2025, peer-reviewed
- [RAG-Anything arXiv paper](https://arxiv.org/abs/2510.12323) — academic source for Tier 4
- [SoK: Agentic RAG arXiv survey](https://arxiv.org/html/2603.07379v1) — systematic survey of agentic patterns
- [NirDiamant/RAG_Techniques GitHub](https://github.com/NirDiamant/RAG_Techniques) — gold standard for companion repo structure
- [RAGAS documentation](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) — evaluation metrics
- [Docker RAG containerization guide](https://docs.docker.com/guides/rag-ollama/containerize/) — reproducibility patterns for Tier 4

### Secondary (MEDIUM confidence)

- [Galileo "RAG Architecture: From Naive to Agentic"](https://galileo.ai/blog/rag-architecture) — 3-tier competitive baseline
- [Starmorph "RAG Techniques Compared 2026"](https://blog.starmorph.com/blog/rag-techniques-compared-best-practices-guide) — cost/latency comparison tables
- [Techment "10 RAG Architectures in 2026"](https://www.techment.com/blogs/rag-architectures-enterprise-use-cases-2026/) — "RAG architecture is a strategic decision" framing
- [Synvestable "Enterprise RAG"](https://www.synvestable.com/enterprise-rag.html) — "40-60% of RAG implementations fail to reach production"
- [kapa.ai "RAG Gone Wrong"](https://www.kapa.ai/blog/rag-gone-wrong-the-7-most-common-mistakes-and-how-to-avoid-them) — failure patterns
- [Firecrawl "Best Chunking Strategies for RAG in 2026"](https://www.firecrawl.dev/blog/best-chunking-strategies-rag) — chunking vs. embedding model impact
- [Severe RAG degradation Google AI Forum](https://discuss.ai.google.dev/t/severe-rag-system-degradation-project-rendered-unusable-after-recent-updates/112823) — Tier 2 managed service instability warning
- [Milvus embedding model comparison 2026](https://milvus.io/blog/choose-embedding-model-rag-2026.md) — text-embedding-3-small benchmarks
- v1.20 Dark Code pitfalls research — direct precedent for citation model and voice guidelines

---
*Research completed: 2026-04-17*
*Ready for roadmap: yes*
