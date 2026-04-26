# Requirements: patrykgolabek.dev — v1.22 RAG Architecture Patterns

**Defined:** 2026-04-25
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.22 Requirements

Requirements for the RAG Architecture Patterns milestone. Each maps to roadmap phases.

### Companion Repository

- [x] **REPO-01
**: Companion repo exists at PatrykQuantumNomad/rag-architecture-patterns with README linking to blog post
- [x] **REPO-02
**: Synthetic enterprise knowledge base dataset with text docs, PDFs, and at least one image, designed with cross-document relationships to showcase Graph RAG advantage
- [x] **REPO-03**: Shared utilities (embeddings, output formatting, cost tracking) reused across tiers
- [x] **REPO-04
**: Per-tier requirements.txt files for isolated dependency installation
- [ ] **REPO-05**: Docker support for Tiers 3-5 where dependency complexity requires it
- [x] **REPO-06
**: .env.example documenting all required API keys per tier

### Tier Implementations

- [x] **TIER-01
**: Tier 1 (Naive RAG) with ChromaDB + OpenAI embeddings, basic vector similarity retrieval against enterprise KB
- [x] **TIER-02

**: Tier 2 (Google Managed RAG) with Gemini File Search API, managed indexing and retrieval
- [x] **TIER-03

**: Tier 3 (Graph RAG) with LightRAG, knowledge graph extraction and entity-relationship retrieval
- [ ] **TIER-04**: Tier 4 (Multimodal RAG) with RAG-Anything processing images, tables, and text as unified knowledge graph
- [ ] **TIER-05**: Tier 5 (Agentic RAG) with OpenAI Agents SDK, autonomous multi-tool retrieval with iteration limits

### Evaluation

- [ ] **EVAL-01**: Golden Q&A test set (30+ questions) covering single-hop, multi-hop, cross-document, and multimodal queries
- [ ] **EVAL-02**: RAGAS evaluation metrics (faithfulness, answer relevance, context precision) per tier
- [ ] **EVAL-03**: Cost and latency tracking per tier with comparison summary
- [ ] **EVAL-04**: Comparison script generating tier-by-tier results table

### Source Verification

- [ ] **SRCS-01**: NotebookLM sources verified and curated with tiered citation model (inline vs further-reading)
- [ ] **SRCS-02**: All cited URLs verified (HTTP 200 or confirmed bot-blocked)

### Blog Post

- [ ] **BLOG-01**: ~4,500-word thought-leadership essay with thesis "RAG is an architecture decision, not an implementation detail"
- [ ] **BLOG-02**: 5-section progression narrative (Naive -> Managed -> Graph -> Multimodal -> Agentic) with opinion-led analysis
- [ ] **BLOG-03**: StatHighlight components for key statistics (cost/accuracy data from evaluation results)
- [ ] **BLOG-04**: TermDefinition components for RAG-specific terminology
- [ ] **BLOG-05**: GFM footnote citations with verified URLs from curated sources
- [ ] **BLOG-06**: Cross-links to companion repo GitHub tree URLs per tier
- [ ] **BLOG-07**: Custom cover SVG matching site aesthetic

### Architecture Diagrams

- [ ] **DIAG-01**: Per-tier SVG architecture diagrams showing data flow for each RAG approach (5 diagrams)
- [ ] **DIAG-02**: Overview comparison diagram showing the 5-tier progression

### Site Integration

- [ ] **SITE-01**: BlogPosting JSON-LD with FAQ schema
- [ ] **SITE-02**: OG image auto-generated (1200x630)
- [ ] **SITE-03**: LLMs.txt entry with thesis statement
- [ ] **SITE-04**: Sitemap and RSS activation
- [ ] **SITE-05**: Internal cross-links to existing content (AI Landscape Explorer, Claude Code Guide)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Companion Repository Enhancements

- **REPO-07**: Jupyter notebook versions of each tier for zero-setup Colab execution
- **REPO-08**: Benchmarking suite with configurable dataset sizes
- **REPO-09**: CI/CD pipeline for automated tier testing

### Blog Enhancements

- **BLOG-08**: Interactive RAG architecture selector component (choose your tier based on requirements)
- **BLOG-09**: Video walkthrough of companion repo

## Out of Scope

| Feature | Reason |
|---------|--------|
| Interactive RAG playground on site | Static site constraint; companion repo serves this purpose |
| Framework/vector-DB comparison matrix | Anti-pattern per research — invites endless debate, distracts from architecture thesis |
| Tutorial-style step-by-step walkthrough | Blog is thought-leadership with "Try It" links, not a tutorial |
| Production deployment guides per tier | Scope explosion; companion repo shows patterns, not production ops |
| Fine-tuning or RLHF coverage | Different domain; blog is about retrieval architecture, not model training |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REPO-01 | Phase 127 | Complete (Plan 02 — test_repo_metadata.py automated trace) |
| REPO-02 | Phase 127 | In progress (Plan 02 — test_dataset.py conditional trace; Plan 03 — curation scripts authored; full data lands in Plans 04/05) |
| REPO-03 | Phase 127 | Complete (Plan 02 — 7 shared/ modules + smoke test) |
| REPO-04 | Phase 127 | Complete (Plan 01 + Plan 02 — test_tier_requirements.py automated trace) |
| REPO-05 | Phase 130 | Pending |
| REPO-06 | Phase 127 | Complete (Plan 01 + Plan 02 — test_env_example.py automated trace) |
| TIER-01 | Phase 128 | In progress (Plans 01-04 complete; Plan 05 = live end-to-end test + README) |
| TIER-02 | Phase 129 | In progress (Plans 01-04 complete — store helpers + query.py + main.py CLI shipped; Plan 06 = README + live e2e test) |
| TIER-03 | Phase 129 | In progress (Plan 01 — [tier-3] extras concretized w/ lightrag-hku==1.4.15; full impl in Plans 03/05/07) |
| TIER-04 | Phase 130 | Pending |
| TIER-05 | Phase 130 | Pending |
| EVAL-01 | Phase 131 | Pending |
| EVAL-02 | Phase 131 | Pending |
| EVAL-03 | Phase 131 | Pending |
| EVAL-04 | Phase 131 | Pending |
| SRCS-01 | Phase 132 | Pending |
| SRCS-02 | Phase 132 | Pending |
| BLOG-01 | Phase 133 | Pending |
| BLOG-02 | Phase 133 | Pending |
| BLOG-03 | Phase 133 | Pending |
| BLOG-04 | Phase 133 | Pending |
| BLOG-05 | Phase 133 | Pending |
| BLOG-06 | Phase 133 | Pending |
| BLOG-07 | Phase 133 | Pending |
| DIAG-01 | Phase 132 | Pending |
| DIAG-02 | Phase 132 | Pending |
| SITE-01 | Phase 134 | Pending |
| SITE-02 | Phase 134 | Pending |
| SITE-03 | Phase 134 | Pending |
| SITE-04 | Phase 134 | Pending |
| SITE-05 | Phase 134 | Pending |

**Coverage:**
- v1.22 requirements: 31 total
- Mapped to phases: 31/31
- Unmapped: 0

---
*Requirements defined: 2026-04-25*
*Last updated: 2026-04-17 after roadmap creation*
