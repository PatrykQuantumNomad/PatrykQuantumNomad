# Phase 127: Repository Skeleton + Enterprise Dataset - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the companion repo at `PatrykQuantumNomad/rag-architecture-patterns` and populate it with a real-world arXiv-derived corpus (PDFs + extracted images + 1–2 CC-licensed video clips) sized to expose tier differences across the 5 RAG architectures, plus shared utilities and a smoke test that validates the layer end-to-end.

**Tier implementations themselves are NOT in this phase.** Phase 127 ends when shared utilities import cleanly, the corpus is committed (with git-lfs), and a smoke test passes against real APIs.

</domain>

<decisions>
## Implementation Decisions

### Corpus composition

- **Pure benchmark approach**, not synthetic. Replaces the original architecture research's plan of 5 synthetic markdown docs + 2 PDFs + 1 image.
- **~100 arXiv papers** (PDFs) sourced from the ML/systems space.
- **Anchor topic: RAG / retrieval-augmented LMs (meta-recursive).** Center on the RAG literature itself — Lewis et al. 2020, LightRAG, GraphRAG, RAG-Anything, retrieval evals — plus closely-cited dependencies. The blog post demonstrates RAG architectures using the RAG literature as its corpus.
- **Curate as a citation cluster.** Papers are not random — they are chosen so multi-hop reasoning across the citation graph is meaningful.
- **1–2 short (~30s) video clips** sourced from CC-licensed conference talks (NeurIPS / MLSys / ICLR — verify licenses per clip). Tier 4 will be extended with frame-sampling + image embeddings to index them.
- **Voice/tone:** neutral corporate. Reader focuses on RAG mechanics, not on author personality.
- **Repo size:** ~100 PDFs + extracted images + video clips will land at ~300–500MB. **git-lfs required** for PDFs, images, videos.

### Multi-hop reasoning design

- **Citation-graph chains.** Multi-hop questions traverse the citation network: "Paper A cited B for claim X; paper C disputed it — what's the current consensus?" Tier 1 (Naive) cannot follow these chains; Tier 3 (Graph RAG) extracts entities/citations and traverses them; Tier 5 (Agentic) iteratively retrieves.
- **30 hand-authored golden Q&A** in `evaluation/golden_qa.json`. Tightly tuned to expose tier differences. No LLM-generated questions.
- **Balanced split:**
  - 10 single-hop (any tier should answer)
  - 10 multi-hop (citation-chain — Tier 3 / Tier 5 win)
  - 7 multimodal (figures, tables, equations from PDFs — Tier 4 wins)
  - 3 video (Tier 4 with video extension wins)
- Each Q&A entry includes: question, expected answer, source paper(s), modality tag, hop-count tag.

### Image & video assets

- **Pre-extract figures** from PDFs into `dataset/images/` at ingestion-prep time, with a manifest mapping `figure_id → paper_id → caption → page_number`.
- Images **also remain embedded** in PDFs — RAG-Anything's parser sees them in-place; the standalone copies are for clean Tier 4 indexing and for debugging/inspection.
- **Videos in `dataset/videos/`** with a manifest documenting source talk, speaker, paper(s) referenced, CC license type, and clip start/end.
- License verification step is part of Phase 127 (don't defer to Phase 132 source verification — these are committed assets).

### Shared utilities

- **`shared/cost_tracker.py`:** Tracks input/output tokens per LLM call + embedding tokens. Computes USD estimates via per-model price table (kept in `shared/pricing.py` and committed). Persists per-run JSON to `evaluation/results/costs/{tier}-{timestamp}.json`. Used by every tier's query script.
- **`shared/display.py`:** Uses the `rich` library. Query in a Panel, retrieved chunks in a Table with similarity scores, answer in a styled block, cost summary at end. Looks good in screencasts and blog screenshots.
- **`shared/loader.py`:** Reads from `dataset/` based on `metadata.json` manifest. Tier-specific loaders import from here.
- **`shared/llm.py` and `shared/embeddings.py`:** Per the architecture research — Gemini default, factory pattern.
- **`shared/config.py`:** Pydantic Settings reading `.env` for API keys.
- **Smoke test (`tests/smoke_test.py`):** Imports all `shared/` modules, validates `.env` keys present, runs **1 embedding call** on `"hello world"` and **1 LLM call** with a trivial prompt. Verifies real API connectivity. Cost ~$0.0001 per run. Runs in <5s.

### Claude's Discretion

- Exact `pyproject.toml` optional-group layout for tier-specific deps
- Specific paper selection within the citation cluster (subject to "anchored on RAG literature, ~100 papers, citation-graph density")
- Exact rich console layout (panels, table styles, color choices)
- Pricing table values and update cadence (commit current Gemini/OpenAI prices as of phase build date)
- Manifest schema (JSON shape for figure/video manifests)
- Smoke test exit codes and CI integration patterns
- README structure beyond the requirement of linking to the (yet-to-exist) blog post

</decisions>

<specifics>
## Specific Ideas

- **Meta-recursive anchor is a narrative gift.** The blog post can open with: "We're going to demonstrate 5 RAG architectures by indexing the RAG literature itself." That self-referential framing should be preserved end-to-end.
- **Citation-graph multi-hop questions should be specific and verifiable.** Example: "GraphRAG cited LightRAG's entity-extraction approach as inspiration, but added what specific mechanism for hierarchical summarization?" — answerable only by traversing GraphRAG paper → LightRAG paper.
- **Video extensions for Tier 4 are real engineering.** This is not free — frame-sampling cadence, multimodal embedding choice, and storage of video-derived chunks all need decisions in Tier 4's plan phase. Phase 127 only commits the source clips + manifest.
- **Cost tracker becomes a blog-post asset.** The blog will likely include a real cost-comparison table per tier per query type. Keep the JSON output schema stable so blog Phase 133 can ingest it directly.
- **Smoke test must work without paid Tier 2/3/4 dependencies.** Smoke test only validates `shared/` (Gemini API). It must not require LightRAG, RAG-Anything, or LangGraph to be installed. Those land per-tier later.

</specifics>

<deferred>
## Deferred Ideas

- **CC license verification automation.** Building tooling to programmatically verify video licenses is out of scope — manual verification at curation time is fine for Phase 127.
- **Citation-graph extraction tooling.** A reusable script that pulls a paper's citation network from arXiv/Semantic Scholar would be useful, but for Phase 127 the curation can be manual / one-off.
- **Synthetic content alongside real corpus.** If the citation graph proves too sparse for strong multi-hop demos, a small set of synthetic "linker" docs could be added later — captured as fallback, not initial scope.
- **Per-tier README content** — handled in each tier's phase, not Phase 127.
- **Evaluation harness implementation** — Phase 131. Phase 127 only commits the empty `evaluation/` directory and the golden_qa.json structure.

</deferred>

<deviations>
## Deviations From Milestone Architecture Research

`.planning/research/ARCHITECTURE-rag-patterns.md` (dated 2026-04-17) assumed:
- 5 synthetic markdown docs (~11k words total)
- 2 synthetic PDFs
- 1 synthetic image (org chart)
- Synthetic cross-references designed for multi-hop

Phase 127 supersedes this with:
- ~100 real arXiv PDFs as a citation cluster anchored on RAG literature
- Pre-extracted images from those PDFs
- 1–2 CC-licensed conference talk video clips
- Citation-graph multi-hop replacing synthetic cross-refs

**Implications for downstream:**
- `gsd-phase-researcher` should investigate: arXiv PDF curation tooling, citation-graph queries (Semantic Scholar API?), figure extraction libraries (PyMuPDF, pdfplumber, marker), video frame sampling for Tier 4 extension, git-lfs setup patterns.
- Tier 2 (Gemini File Search), Tier 3 (LightRAG), Tier 4 (RAG-Anything + video extension) all need to validate they handle 100-PDF corpus volume — flagged as a re-scope concern for Phase 129 / 130.
- Repo storage costs (git-lfs bandwidth on GitHub Free tier: 1GB/month) are now a real constraint — re-clones during development add up.

</deviations>

---

*Phase: 127-repository-skeleton-enterprise-dataset*
*Context gathered: 2026-04-25*
