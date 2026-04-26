# Roadmap: patrykgolabek.dev

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-11)
- ✅ **v1.1 Content Refresh** - Phases 8-12 (shipped 2026-02-12)
- ✅ **v1.2 Projects Page Redesign** - Phases 13-15 (shipped 2026-02-13)
- ✅ **v1.3 The Beauty Index** - Phases 16-21 (shipped 2026-02-17)
- ✅ **v1.4 Dockerfile Analyzer** - Phases 22-27 (shipped 2026-02-20)
- ✅ **v1.5 Database Compass** - Phases 28-32 (shipped 2026-02-22)
- ✅ **v1.6 Docker Compose Validator** - Phases 33-40 (shipped 2026-02-23)
- ✅ **v1.7 Kubernetes Manifest Analyzer** - Phases 41-47 (shipped 2026-02-23)
- ✅ **v1.8 EDA Visual Encyclopedia** - Phases 48-55 (shipped 2026-02-25)
- ✅ **v1.9 EDA Case Study Deep Dive** - Phases 56-63 (shipped 2026-02-27)
- ✅ **v1.11 Beauty Index: Lisp** - Phases 69-71 (shipped 2026-03-02)
- ✅ **v1.12 Dockerfile Rules Expansion** - Phases 72-74 (shipped 2026-03-02)
- ✅ **v1.13 GitHub Actions Workflow Validator** - Phases 75-81 (shipped 2026-03-04)
- ✅ **v1.14 DevOps Skills Publishing** - Phases 82-84 (shipped 2026-03-05)
- ✅ **v1.15 FastAPI Production Guide** - Phases 85-89 (shipped 2026-03-08)
- ✅ **v1.16 Claude Code Guide** - Phases 90-95 (shipped 2026-03-11)
- ✅ **v1.17 EDA Jupyter Notebooks** - Phases 96-101 (shipped 2026-03-15)
- ✅ **v1.18 AI Landscape Explorer** - Phases 102-110 (shipped 2026-03-27)
- ✅ **v1.19 Claude Code Guide Refresh** - Phases 111-116 (shipped 2026-04-12)
- ✅ **v1.20 Dark Code Blog Post** - Phases 117-121 (shipped 2026-04-14)
- ✅ **v1.21 SEO Audit Fixes** - Phases 122-126 (shipped 2026-04-17)
- **v1.22 RAG Architecture Patterns** - Phases 127-134 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>Phases 1-126 (v1.0 through v1.21) - SHIPPED</summary>

See MILESTONES.md for completed milestone details.

</details>

### v1.22 RAG Architecture Patterns (In Progress)

**Milestone Goal:** Publish a ~4,500-word research-heavy thought-leadership blog post on RAG architecture progression (Naive -> Managed -> Graph -> Multimodal -> Agentic) with a companion GitHub repo containing runnable examples for all 5 tiers against an enterprise knowledge base scenario.

- [x] **Phase 127: Repository Skeleton + Enterprise Dataset** - Scaffold companion repo with shared utilities and synthetic enterprise knowledge base (completed 2026-04-26)
- [ ] **Phase 128: Tier 1 Naive RAG** - Validate shared layer with baseline ChromaDB + OpenAI vector similarity retrieval
- [ ] **Phase 129: Tiers 2-3 Managed + Graph RAG** - Build Gemini File Search and LightRAG implementations against the shared dataset
- [ ] **Phase 130: Tiers 4-5 Multimodal + Agentic RAG** - Build highest-complexity tiers with Docker support and safety limits
- [ ] **Phase 131: Evaluation Harness** - Run RAGAS metrics and cost/latency tracking across all 5 tiers with comparison output
- [ ] **Phase 132: Source Verification + Architecture Diagrams** - Verify all citations and create per-tier + overview SVG diagrams
- [ ] **Phase 133: Blog Post** - Write the thought-leadership essay with evaluation data, diagrams, and repo cross-links
- [ ] **Phase 134: Site Integration + Polish** - Wire JSON-LD, OG image, LLMs.txt, sitemap, RSS, and cross-links

## Phase Details

### Phase 127: Repository Skeleton + Enterprise Dataset
**Goal**: A runnable companion repo exists with a synthetic enterprise knowledge base dataset designed to expose the strengths and weaknesses of each RAG tier
**Depends on**: Nothing (first phase of v1.22)
**Requirements**: REPO-01, REPO-02, REPO-03, REPO-04, REPO-06
**Success Criteria** (what must be TRUE):
  1. Companion repo at PatrykQuantumNomad/rag-architecture-patterns has a README linking to the blog post placeholder
  2. Enterprise KB dataset contains text docs, PDFs, and at least one image with cross-document relationships that require multi-hop reasoning
  3. Shared utilities (embeddings, output formatting, cost tracking) import cleanly and a smoke test passes
  4. Each tier directory has its own requirements.txt and .env.example documents all required API keys
**Plans**: 6 plans across 5 waves

Plans:
- [x] 127-01-PLAN.md — Repo creation + git-lfs + Python project skeleton + per-tier requirements.txt + .env.example
- [x] 127-02-PLAN.md — Shared utilities (config/pricing/llm/embeddings/loader/display/cost_tracker) + smoke test scaffolding
- [x] 127-03-PLAN.md — Curation scripts (curate_corpus.py + extract_figures.py + cut_video_clips.py + seed lists)
- [ ] 127-04-PLAN.md — Run corpus curation: download ~100 arXiv PDFs as RAG citation cluster (LFS commit)
- [ ] 127-05-PLAN.md — Run figure extraction + video clip cutting + manifests with verified CC licenses
- [ ] 127-06-PLAN.md — Author 30 golden Q&A + metadata.json + final live smoke + README finalization

### Phase 128: Tier 1 Naive RAG
**Goal**: Users can run a baseline RAG pipeline that chunks, embeds, and retrieves from the enterprise KB using raw ChromaDB + OpenAI
**Depends on**: Phase 127
**Requirements**: TIER-01
**Success Criteria** (what must be TRUE):
  1. Running `python tier-1-naive/main.py` ingests the enterprise KB into ChromaDB and answers a sample query with sourced output
  2. The ChromaDB index persists to disk and can be reused by Tier 5
  3. Cost and latency are printed for the demo query
**Plans**: 6 plans (5 original + 1 mid-phase OpenRouter pivot)
- [x] 128-01-PLAN.md — Extend [tier-1] extras (chromadb, openai, pymupdf) + promote OPENAI_API_KEY to REQUIRED in .env.example
- [x] 128-02-PLAN.md — Page-aware PDF extraction + 512/64 chunker (TDD) with non-live unit tests
- [x] 128-03-PLAN.md — OpenAI embedding wrapper + ChromaDB store/retrieve helpers + non-live store tests
- [x] 128-04-PLAN.md — main.py CLI orchestration (--ingest/--query/--top-k/--reset) + prompt builder
- [x] 128-05-PLAN.md — Tier 1 README + live end-to-end test (deferred for OPENAI_API_KEY at the time)
- [x] 128-06 (mid-phase pivot) — Migrate Tier 1 chat + embeddings to OpenRouter unified gateway; --model flag added; live test PASSED in 8.04s for ~$0.001 (2026-04-26)

### Phase 129: Tiers 2-3 Managed + Graph RAG
**Goal**: Users can compare managed-service RAG (zero infrastructure) against knowledge-graph RAG (cross-document reasoning) using the same dataset
**Depends on**: Phase 127
**Requirements**: TIER-02, TIER-03
**Success Criteria** (what must be TRUE):
  1. Running Tier 2 uploads the enterprise KB to Gemini File Search and returns answers with managed retrieval
  2. Running Tier 3 extracts a knowledge graph via LightRAG and answers multi-hop queries that Tier 1 cannot
  3. Both tiers print cost and latency alongside their answers
**Plans**: 7 plans across 4 waves
- [x] 129-01-PLAN.md — Extend [tier-3] extras (lightrag-hku==1.4.15, openai, pymupdf); promote OPENROUTER for Tier 3; gitignore .store_id
- [ ] 129-02-PLAN.md — Tier 2 store helpers: FileSearchStore lifecycle (create/upload/poll/list/delete) + 503 backoff + tier_2_managed shim
- [x] 129-03-PLAN.md — Tier 3 LightRAG init + cost adapter + token_tracker probe (resolves RESEARCH Open Q1) + tier_3_graph shim
- [ ] 129-04-PLAN.md — Tier 2 query.py (FileSearch tool + grounding extraction) + main.py CLI (synthetic indexing-cost line)
- [ ] 129-05-PLAN.md — Tier 3 ingest + query + async main.py CLI (--yes-gated cost-surprise mitigation; 5-mode --mode flag)
- [ ] 129-06-PLAN.md — Tier 2 README + live e2e test (3-paper subset, store cleanup, cost > 0 assert)
- [ ] 129-07-PLAN.md — Tier 3 README + non-live constants test + live e2e test (2-paper subset, graphml-exists, hybrid-mode)

### Phase 130: Tiers 4-5 Multimodal + Agentic RAG
**Goal**: Users can run multimodal RAG (images + tables + text as unified knowledge graph) and agentic RAG (autonomous multi-tool retrieval with iteration limits)
**Depends on**: Phase 128, Phase 129
**Requirements**: TIER-04, TIER-05, REPO-05
**Success Criteria** (what must be TRUE):
  1. Tier 4 processes the enterprise KB image and PDF tables alongside text via RAG-Anything, answering queries that require visual or tabular understanding
  2. Tier 5 autonomously selects retrieval tools (including Tier 1 ChromaDB index), iterates with a hard cap of max_iterations=10, and prints cost per query
  3. Docker support exists for Tiers 3-5 where dependency complexity requires it (at minimum Tier 4)
  4. Both tiers include pre-computed expected outputs for users who cannot install all dependencies
**Plans**: TBD

### Phase 131: Evaluation Harness
**Goal**: Objective comparison data exists showing faithfulness, relevance, precision, cost, and latency across all 5 tiers
**Depends on**: Phase 130
**Requirements**: EVAL-01, EVAL-02, EVAL-03, EVAL-04
**Success Criteria** (what must be TRUE):
  1. Golden Q&A test set covers 30+ questions spanning single-hop, multi-hop, cross-document, and multimodal queries
  2. RAGAS metrics (faithfulness, answer relevance, context precision) are computed and saved per tier
  3. Cost and latency are tracked per tier with a comparison summary
  4. A comparison script generates a tier-by-tier results table usable directly in the blog post
**Plans**: TBD

### Phase 132: Source Verification + Architecture Diagrams
**Goal**: All citations are verified against primary sources and per-tier architecture diagrams visualize the data flow for each RAG approach
**Depends on**: Phase 131
**Requirements**: SRCS-01, SRCS-02, DIAG-01, DIAG-02
**Success Criteria** (what must be TRUE):
  1. NotebookLM sources are verified and curated with tiered citation model (inline vs further-reading)
  2. All cited URLs return HTTP 200 or are confirmed bot-blocked (per v1.20 precedent)
  3. 5 per-tier SVG architecture diagrams show data flow for each RAG approach
  4. 1 overview comparison diagram shows the 5-tier progression
**Plans**: TBD

### Phase 133: Blog Post
**Goal**: A ~4,500-word thought-leadership essay argues that RAG is an architecture decision with opinion-led analysis, verified citations, evaluation data, and companion repo cross-links
**Depends on**: Phase 132
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05, BLOG-06, BLOG-07
**Success Criteria** (what must be TRUE):
  1. Blog post at /blog/rag-architecture-patterns/ presents a 5-section progression narrative with thesis framing in every section
  2. StatHighlight components display key statistics sourced from evaluation results (Phase 131 data)
  3. TermDefinition components define RAG-specific terminology inline
  4. GFM footnote citations link to verified URLs from curated sources
  5. Cross-links point to companion repo GitHub tree URLs per tier, and a custom cover SVG matches the site aesthetic
**Plans**: TBD
**UI hint**: yes

### Phase 134: Site Integration + Polish
**Goal**: The blog post is fully wired into the site pipeline and all artifacts pass quality verification
**Depends on**: Phase 133
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05
**Success Criteria** (what must be TRUE):
  1. BlogPosting JSON-LD with FAQ schema passes Rich Results Test
  2. OG image auto-generates at 1200x630 and renders correctly in social previews
  3. LLMs.txt entry with thesis statement, sitemap activation, and RSS feed include the new post
  4. Internal cross-links to AI Landscape Explorer and Claude Code Guide are functional
  5. Production build passes with all 6 existing verifiers clean

## Progress

**Execution Order:**
Phases execute in numeric order: 127 -> 128 -> 129 -> 130 -> 131 -> 132 -> 133 -> 134

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 127. Repo Skeleton + Enterprise Dataset | v1.22 | 6/6 | ✅ Complete | 2026-04-26 |
| 128. Tier 1 Naive RAG | v1.22 | 6/6 | ✅ Complete (live test passed 2026-04-26 via OpenRouter) | 2026-04-26 |
| 129. Tiers 2-3 Managed + Graph RAG | v1.22 | 2/7 | In progress | - |
| 130. Tiers 4-5 Multimodal + Agentic RAG | v1.22 | 0/TBD | Not started | - |
| 131. Evaluation Harness | v1.22 | 0/TBD | Not started | - |
| 132. Source Verification + Diagrams | v1.22 | 0/TBD | Not started | - |
| 133. Blog Post | v1.22 | 0/TBD | Not started | - |
| 134. Site Integration + Polish | v1.22 | 0/TBD | Not started | - |
