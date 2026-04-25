# Phase 127: Repository Skeleton + Enterprise Dataset - Research

**Researched:** 2026-04-25
**Domain:** Python repo scaffold + arXiv-derived multimodal corpus + git-lfs + shared utilities for RAG companion repo
**Confidence:** HIGH (stack, patterns) / MEDIUM (pricing, exact citation cluster size feasibility)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Corpus composition:**
- Pure benchmark approach, not synthetic. Replaces the original architecture research's plan of 5 synthetic markdown docs + 2 PDFs + 1 image.
- ~100 arXiv papers (PDFs) sourced from the ML/systems space.
- Anchor topic: RAG / retrieval-augmented LMs (meta-recursive). Center on the RAG literature itself — Lewis et al. 2020, LightRAG, GraphRAG, RAG-Anything, retrieval evals — plus closely-cited dependencies. The blog post demonstrates RAG architectures using the RAG literature as its corpus.
- Curate as a citation cluster. Papers chosen so multi-hop reasoning across the citation graph is meaningful.
- 1–2 short (~30s) video clips sourced from CC-licensed conference talks (NeurIPS / MLSys / ICLR — verify licenses per clip). Tier 4 will be extended with frame-sampling + image embeddings to index them.
- Voice/tone: neutral corporate.
- Repo size: ~100 PDFs + extracted images + video clips will land at ~300–500MB. **git-lfs required** for PDFs, images, videos.

**Multi-hop reasoning design:**
- Citation-graph chains. Multi-hop questions traverse the citation network.
- 30 hand-authored golden Q&A in `evaluation/golden_qa.json`. No LLM-generated questions.
- Balanced split: 10 single-hop / 10 multi-hop (citation-chain) / 7 multimodal (figures/tables/equations) / 3 video.
- Each Q&A entry includes: question, expected answer, source paper(s), modality tag, hop-count tag.

**Image & video assets:**
- Pre-extract figures from PDFs into `dataset/images/` at ingestion-prep time, with manifest mapping `figure_id → paper_id → caption → page_number`.
- Images also remain embedded in PDFs (RAG-Anything's parser sees them in-place).
- Videos in `dataset/videos/` with manifest documenting source talk, speaker, paper(s) referenced, CC license type, clip start/end.
- License verification step is part of Phase 127 (manual is fine).

**Shared utilities:**
- `shared/cost_tracker.py`: tracks input/output tokens per LLM call + embedding tokens, computes USD via per-model price table in `shared/pricing.py`. Persists per-run JSON to `evaluation/results/costs/{tier}-{timestamp}.json`.
- `shared/display.py`: uses `rich`. Query in Panel, retrieved chunks in Table with similarity scores, answer in styled block, cost summary at end.
- `shared/loader.py`: reads from `dataset/` based on `metadata.json` manifest.
- `shared/llm.py` and `shared/embeddings.py`: Gemini default, factory pattern.
- `shared/config.py`: Pydantic Settings reading `.env`.
- Smoke test (`tests/smoke_test.py`): imports all `shared/`, validates `.env` keys, runs 1 embedding call ("hello world") + 1 LLM call with trivial prompt against real APIs. <5s, ~$0.0001 per run.
- Smoke test must work without paid Tier 2/3/4 dependencies (LightRAG, RAG-Anything, LangGraph not required to be installed).

### Claude's Discretion

- Exact `pyproject.toml` optional-group layout for tier-specific deps
- Specific paper selection within the citation cluster (anchored on RAG literature, ~100 papers, citation-graph density)
- Exact rich console layout (panels, table styles, color choices)
- Pricing table values and update cadence (commit current Gemini/OpenAI prices as of phase build date 2026-04)
- Manifest schema (JSON shape for figure/video manifests)
- Smoke test exit codes and CI integration patterns
- README structure beyond the requirement of linking to the (yet-to-exist) blog post

### Deferred Ideas (OUT OF SCOPE)

- CC license verification automation (manual at curation time is fine).
- Citation-graph extraction tooling (one-off curation is fine for Phase 127).
- Synthetic content alongside real corpus (fallback only, not initial scope).
- Per-tier README content (handled in each tier's phase).
- Evaluation harness implementation (Phase 131). Phase 127 only commits empty `evaluation/` directory and the golden_qa.json structure.
- Tier-specific implementations (Phases 128–130).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REPO-01 | Companion repo exists at PatrykQuantumNomad/rag-architecture-patterns with README linking to blog post | gh CLI (2.91 verified available) for `gh repo create`; README anchored to blog placeholder URL |
| REPO-02 | Synthetic enterprise knowledge base dataset with text docs, PDFs, and at least one image, designed with cross-document relationships to showcase Graph RAG advantage | arxiv.py 3.0 + Semantic Scholar API for citation graph; PyMuPDF for figure extraction; conference talk video clips (CC-licensed); golden_qa.json schema |
| REPO-03 | Shared utilities (embeddings, output formatting, cost tracking) reused across tiers | google-genai 1.73 SDK, rich 14.x, pydantic-settings 2.x, tiktoken 0.12 |
| REPO-04 | Per-tier requirements.txt files for isolated dependency installation | pyproject.toml `[project.optional-dependencies]` per tier — published metadata so tier directories can also use stand-alone requirements.txt files |
| REPO-06 | .env.example documenting all required API keys per tier | python-dotenv 1.2 + Pydantic SettingsConfigDict(env_file='.env'); SecretStr for keys |
</phase_requirements>

## Summary

Phase 127 scaffolds a Python monorepo containing five tier directories sharing a common `dataset/`, `shared/`, and `evaluation/` layer. The dataset is the substantive deliverable — a curated citation cluster of ~100 RAG-literature arXiv PDFs plus pre-extracted figures and 1–2 CC-licensed conference-talk clips, all stored via git-lfs because raw repo size will be ~300–500 MB.

The build pipeline has three phases that map cleanly to wave structure: (1) repo bootstrap (gh CLI repo create, pyproject.toml, .gitattributes, git-lfs install, .env.example, README); (2) corpus curation (arxiv.py 3.0 for fetching PDFs at the arXiv-mandated 3s+ per request rate, semanticscholar 0.12 for citation graph traversal, PyMuPDF 1.27 for figure extraction with bounding-box coords + page numbers, manual CC-license verification for video clips); (3) shared utilities (google-genai 1.73 unified SDK as Gemini default, rich 14 for display, Pydantic Settings v2 for config, a smoke test that runs in <5s for ~$0.0001/run).

**Primary recommendation:** Build with **uv** as the package manager (already installed), `pyproject.toml` with both `[project.optional-dependencies]` (for tier-specific deps that downstream phases will install) **and** `[dependency-groups]` (for dev/test tooling that does not ship). Use the **new google-genai SDK** — `google-generativeai` reached EOL on 2025-08-31. Use **PyMuPDF** for figure extraction (mature, fast, returns bounding boxes via `page.get_image_rects(xref)`). For Semantic Scholar requests, **request an API key** to avoid the shared-pool bottleneck (5,000 req / 5 min for all unauthenticated users globally) — but if a one-off curation script tops out at ~100 papers × ~30 citations each = ~3,000 calls with exponential backoff, unauthenticated is sufficient.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Repo creation + remote setup | Local CLI / GitHub | — | One-shot scaffolding via `gh repo create` |
| arXiv PDF fetching | Curation script (local) | — | Run once, commit results — not part of runtime tier code |
| Citation graph traversal | Curation script (local) | — | Same — Semantic Scholar lookups happen at curation time |
| Figure extraction from PDFs | Curation script (local) | — | Pre-extracted at curation time; output lands in `dataset/images/` |
| Manifest authoring | Curation script + manual | — | `metadata.json`, figure manifest, video manifest written as final step of curation |
| Golden Q&A authoring | Manual / hand-authored | — | Decision is locked: no LLM generation |
| Shared utilities (config, llm, embeddings, display, cost, loader) | Library code (`shared/`) | — | Imported by every tier; smoke test validates the import surface |
| Smoke test | Test code (`tests/`) | — | Validates that `shared/` plus `.env` configuration plus real Gemini API connectivity works; runs <5s |
| API key management | Local `.env` (gitignored) | `.env.example` (committed) | Pydantic Settings + SecretStr — never log raw values |
| Large binary storage | git-lfs | — | PDFs, images, videos all routed through LFS via `.gitattributes` |

## Standard Stack

### Core (verified versions, current as of 2026-04-25)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `arxiv` | 3.0.0 | Programmatic arXiv search + PDF download | Reference Python wrapper; v3 hardens against API instability `[VERIFIED: pip3 index versions; CITED: github.com/lukasschwab/arxiv.py/releases]` |
| `semanticscholar` | 0.12.0 | Typed wrapper for Semantic Scholar Academic Graph API (citations/references) | Most actively maintained S2 wrapper, supports async + pagination `[VERIFIED: pip3 index versions; CITED: github.com/danielnsilva/semanticscholar]` |
| `pymupdf` | 1.27.2.3 | PDF figure extraction with bounding boxes + page numbers | Fastest pure-Python PDF lib, native image extraction via `page.get_images()` + `page.get_image_rects(xref)` `[VERIFIED: pip3 index versions; CITED: pymupdf.readthedocs.io/en/latest/recipes-images.html]` |
| `google-genai` | 1.73.1 | Unified Gemini SDK (LLM + embeddings) | Replaces deprecated `google-generativeai` (EOL 2025-08-31); single SDK for AI Studio + Vertex `[VERIFIED: pip3 index versions; CITED: github.com/googleapis/python-genai; github.com/google-gemini/deprecated-generative-ai-python]` |
| `pydantic-settings` | 2.14.0 | Type-safe `.env` loading + `SecretStr` masking | The Pydantic v2 successor to `BaseSettings`; works with `SettingsConfigDict(env_file='.env')` `[VERIFIED: pip3 index versions; CITED: pydantic.dev/docs/validation/latest/concepts/pydantic_settings/]` |
| `pydantic` | 2.13.3 | Data validation core (transitive via pydantic-settings) | `[VERIFIED: pip3 index versions]` |
| `rich` | 14.3.4 | Console output (Panel, Table, styled markup) | Industry standard for Python TUI; pin to 14.x for stability — 15.0.0 just released, allow it but don't require it `[VERIFIED: pip3 index versions; CITED: rich.readthedocs.io]` |
| `tiktoken` | 0.12.0 | OpenAI tokenizer for cost tracking when OpenAI models are used | Required if Tier 2/5 use OpenAI; Gemini has its own `client.models.count_tokens()` `[VERIFIED: pip3 index versions]` |
| `python-dotenv` | 1.2.2 | `.env` loading (transitive via pydantic-settings) | `[VERIFIED: pip3 index versions]` |
| `pytest` | 8.4.2 (use ≥8) | Test runner for smoke test | Pin to ≥8 for current ecosystem compatibility; pytest 9.0.3 is bleeding edge `[VERIFIED: pip3 index versions]` |

### Tooling

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `uv` | 0.6.3 (≥0.5 OK) | Package manager + venv | Already installed; supports both `optional-dependencies` and `dependency-groups`; 10–100× faster than pip `[VERIFIED: uv --version locally]` |
| `git-lfs` | 3.7.1 | Large file storage | Already installed; needed for PDFs/images/videos `[VERIFIED: git lfs version locally]` |
| `gh` (GitHub CLI) | 2.91.0 | `gh repo create` for REPO-01 | Already installed `[VERIFIED: gh --version locally]` |
| `ffmpeg` | 8.1 | Video clip extraction (cut 30s segments from full-length talks) | Already installed; standard for clip cuts `[VERIFIED: ffmpeg -version locally]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `arxiv` | direct OAI-PMH harvest from `export.arxiv.org` | Bulk harvesting is preferred for >1000 papers; arxiv.py wins for small targeted queries `[CITED: info.arxiv.org/help/api/tou.html]` |
| `semanticscholar` | direct REST calls via `httpx` | Direct calls are fewer dependencies; library handles pagination and typing for free. Use library. |
| `pymupdf` | `pdfplumber` 0.11.9 | pdfplumber excels at tables but is **slower for image extraction**; PyMuPDF wins for figure-extraction workload `[CITED: PyPI compare]` |
| `pymupdf` | `marker-pdf` 1.10.2 | marker-pdf is a heavier ML-based parser (good for OCR-heavy / scanned PDFs); arXiv PDFs are born-digital and PyMuPDF is sufficient `[CITED: PyPI; community comparisons]` |
| `pymupdf` | `pypdf` 6.10.2 | pypdf is text-only; image extraction is a non-feature `[CITED: PyPI]` |
| `google-genai` | `google-generativeai` | **Deprecated**, EOL 2025-08-31 — do not use `[CITED: github.com/google-gemini/deprecated-generative-ai-python]` |
| Pydantic Settings | bare `os.environ` + `python-dotenv` | Pydantic gives validation + `SecretStr` masking; bare env loses type safety. Use Pydantic Settings. |
| `rich` | `textual` | Textual is a full TUI framework — overkill for screencast-friendly output. `rich` is the right primitive. |
| `[project.optional-dependencies]` | pure `requirements.txt` per tier | The user-requested form is `requirements.txt` (REPO-04). **Solution: do both** — pyproject.toml extras drive what `pip install -e ".[tier-1]"` installs, and `tier-N/requirements.txt` is a generated mirror. Phase 128+ tier authors can reference either. |

### Installation

```bash
# Top-level project install (in repo root)
uv venv
source .venv/bin/activate
uv pip install -e ".[shared,dev]"

# Per-tier installs (in tier-N/ directory)
uv pip install -e "..[tier-1]"
# or, if tier-N/requirements.txt is preferred:
uv pip install -r tier-1/requirements.txt
```

**Version verification:** All versions verified against PyPI via `pip3 index versions <pkg>` on 2026-04-25. Gemini and pricing values verified against `ai.google.dev/gemini-api/docs/pricing` (April 2026). [VERIFIED: pip registry; CITED: ai.google.dev/gemini-api/docs/pricing]

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 127 BUILD-TIME PIPELINE  (one-shot curation, not runtime)        │
│                                                                          │
│   ┌───────────────────┐                                                 │
│   │ Anchor papers     │   curated by hand                               │
│   │ list (~10 seeds)  │   (RAG, LightRAG, GraphRAG, etc.)              │
│   └─────────┬─────────┘                                                 │
│             │                                                           │
│             ▼                                                           │
│   ┌───────────────────┐    +3s/req     ┌───────────────────────┐        │
│   │ arxiv.Client()    │───────────────►│ arxiv.org export API  │        │
│   │ download_pdf()    │◄───────────────│ (PDF fetch)           │        │
│   └─────────┬─────────┘                └───────────────────────┘        │
│             │                                                           │
│             ▼                                                           │
│   ┌───────────────────┐    backoff     ┌───────────────────────┐        │
│   │ semanticscholar   │───────────────►│ S2 Graph API          │        │
│   │ get_paper_refs +  │◄───────────────│ /paper/{id}/citations │        │
│   │ get_paper_cit     │                │ /paper/{id}/refs       │       │
│   └─────────┬─────────┘                └───────────────────────┘        │
│             │ traverse 1–2 hops to expand ~10 seeds → ~100 papers       │
│             ▼                                                           │
│   ┌───────────────────┐                                                 │
│   │ dataset/papers/   │   100 PDFs                                      │
│   │ *.pdf             │                                                 │
│   └─────────┬─────────┘                                                 │
│             │                                                           │
│             ▼                                                           │
│   ┌───────────────────┐                                                 │
│   │ pymupdf extract   │   for each pdf, page:                           │
│   │ get_images()      │     for each xref:                              │
│   │ get_image_rects() │       save image + bbox + page_no               │
│   └─────────┬─────────┘                                                 │
│             ▼                                                           │
│   ┌───────────────────┐    ┌─────────────────────┐                       │
│   │ dataset/images/   │    │ dataset/manifests/  │                      │
│   │ {paper_id}_       │    │   figures.json      │                      │
│   │   {fig_idx}.png   │    │   videos.json       │                      │
│   │                   │    │   metadata.json     │                      │
│   └───────────────────┘    └─────────────────────┘                      │
│                                                                          │
│   ┌───────────────────┐                                                 │
│   │ ffmpeg cut clips  │   30s clips from CC-licensed talks              │
│   │ + manual license  │                                                 │
│   │ verification      │                                                 │
│   └─────────┬─────────┘                                                 │
│             ▼                                                           │
│   ┌───────────────────┐                                                 │
│   │ dataset/videos/   │   1–2 mp4 files + manifest                      │
│   └───────────────────┘                                                 │
│                                                                          │
│   git-lfs tracks: *.pdf *.png *.jpg *.mp4                               │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  RUNTIME (smoke test + future tier scripts)                              │
│                                                                          │
│   .env ──► shared/config.py ──► (Pydantic Settings, SecretStr)          │
│              │                                                           │
│              ▼                                                           │
│   shared/llm.py ────► google-genai Client.models.generate_content       │
│   shared/embeddings.py ──► google-genai Client.models.embed_content     │
│   shared/loader.py  ──► dataset/metadata.json + dataset/papers/*.pdf    │
│   shared/cost_tracker.py ──► shared/pricing.py table → JSON output      │
│   shared/display.py ──► rich.Panel + rich.Table + Console               │
│              │                                                           │
│              ▼                                                           │
│   tests/smoke_test.py: import all + 1 LLM call + 1 embed call           │
└────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
rag-architecture-patterns/
├── README.md                          # Repo overview, link to blog post placeholder
├── LICENSE                            # Apache 2.0 (per architecture research)
├── pyproject.toml                     # Project metadata, optional-deps groups
├── .env.example                       # All API keys, commented per-tier
├── .gitignore                         # Python, .env, chroma_db/, lightrag_*, .venv/
├── .gitattributes                     # git-lfs patterns: *.pdf *.png *.jpg *.mp4
│
├── dataset/
│   ├── README.md                      # Provenance, license per asset class
│   ├── metadata.json                  # Top-level manifest (papers, figures, videos)
│   ├── papers/                        # 100 arXiv PDFs (git-lfs)
│   │   ├── 2005.11401_lewis_rag.pdf
│   │   ├── 2410.05779_lightrag.pdf
│   │   └── ...
│   ├── images/                        # Pre-extracted figures (git-lfs)
│   │   ├── 2005.11401_fig_001.png
│   │   ├── 2005.11401_fig_002.png
│   │   └── ...
│   ├── videos/                        # 1–2 CC-licensed clips (git-lfs)
│   │   ├── neurips2020_lewis_rag_clip.mp4
│   │   └── ...
│   └── manifests/
│       ├── papers.json                # paper_id → title, authors, year, arxiv_id, license
│       ├── figures.json               # figure_id → paper_id, page_number, bbox, caption
│       └── videos.json                # video_id → talk, speaker, papers, license, start, end
│
├── shared/
│   ├── __init__.py
│   ├── config.py                      # Pydantic Settings, SecretStr for keys
│   ├── llm.py                         # google-genai Client wrapper, factory
│   ├── embeddings.py                  # google-genai embed_content wrapper, factory
│   ├── loader.py                      # Reads dataset/manifests/*.json
│   ├── display.py                     # Rich Panel/Table renderers
│   ├── cost_tracker.py                # Token + USD accounting; writes JSON
│   └── pricing.py                     # Per-model price table (committed values)
│
├── evaluation/
│   ├── README.md                      # Phase 131 will populate
│   ├── golden_qa.json                 # 30 hand-authored Q&A entries
│   └── results/
│       └── costs/                     # cost_tracker output lands here (gitignored except .gitkeep)
│
├── scripts/
│   ├── curate_corpus.py               # arxiv + S2 citation graph crawler (one-shot)
│   ├── extract_figures.py             # pymupdf figure extraction (one-shot)
│   └── cut_video_clips.py             # ffmpeg subprocess to cut 30s clips
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── smoke_test.py                  # <5s, ~$0.0001/run
│
├── tier-1-naive/
│   ├── README.md                      # Phase 128 populates
│   └── requirements.txt               # mirror of [project.optional-dependencies.tier-1]
├── tier-2-managed/                    # ditto
├── tier-3-graph/
├── tier-4-multimodal/
└── tier-5-agentic/
```

### Pattern 1: arXiv batch fetch with rate compliance

**What:** Use `arxiv.Client(page_size=100, delay_seconds=3.0, num_retries=5)` to honor arXiv's "no more than one request every three seconds, single connection" policy. The library's internal throttle handles the cadence.

**When to use:** Always when fetching >1 paper from arXiv programmatically.

**Example:**
```python
# Source: github.com/lukasschwab/arxiv.py + info.arxiv.org/help/api/tou.html
import arxiv
from pathlib import Path

client = arxiv.Client(
    page_size=100,
    delay_seconds=3.0,   # arXiv ToU: ≥3s between requests
    num_retries=5,
)

dl_dir = Path("dataset/papers")
dl_dir.mkdir(parents=True, exist_ok=True)

# Fetch by arxiv_id list (preferred over text search for citation cluster)
arxiv_ids = ["2005.11401", "2410.05779", "2404.16130"]  # Lewis RAG, LightRAG, GraphRAG
search = arxiv.Search(id_list=arxiv_ids)

for paper in client.results(search):
    filename = f"{paper.get_short_id()}_{paper.title[:40].replace(' ', '_')}.pdf"
    paper.download_pdf(dirpath=str(dl_dir), filename=filename)
```

**Note:** arXiv 3.0 default `Search.max_results = 100` (was unlimited in 2.x). Use `id_list` instead of free-text query for deterministic curation.

### Pattern 2: Semantic Scholar citation graph traversal

**What:** Use the `semanticscholar` library to expand a seed paper list into a citation cluster by walking references and citations.

**When to use:** Building the ~100-paper cluster from ~10 anchor seeds.

**Example:**
```python
# Source: github.com/danielnsilva/semanticscholar + api.semanticscholar.org/api-docs/graph
from semanticscholar import SemanticScholar
import time

sch = SemanticScholar(timeout=10)  # api_key=os.getenv("S2_API_KEY") if available

# Anchor seeds (arxiv:<id> resolves on S2)
seeds = ["arXiv:2005.11401", "arXiv:2410.05779", "arXiv:2404.16130"]

cluster: dict[str, dict] = {}
for seed in seeds:
    paper = sch.get_paper(seed, fields=["title", "year", "authors",
                                        "externalIds", "abstract"])
    cluster[paper.paperId] = paper.raw_data

    refs = sch.get_paper_references(seed,
                                    fields=["title", "year", "externalIds"],
                                    limit=50)
    for ref in refs:
        if ref.paper and ref.paper.externalIds.get("ArXiv"):
            cluster[ref.paper.paperId] = ref.paper.raw_data

    time.sleep(1.0)  # exponential backoff baseline; library will retry on 429
```

**Rate limit note:** Unauthenticated, all users share **5,000 requests / 5 minutes** globally — request a free API key at semanticscholar.org/product/api if curation hits 429s. Authenticated key gets 1 req/s for `/paper/search` and `/paper/batch`, 10 req/s for everything else. `[CITED: github.com/allenai/s2-folks/blob/main/API_RELEASE_NOTES.md]`

### Pattern 3: PyMuPDF figure extraction with bounding boxes

**What:** Iterate document pages, call `page.get_images(full=True)` for each xref, then `page.get_image_rects(xref)` for the bounding box, save the image bytes via `Document.extract_image(xref)`.

**When to use:** Pre-extracting figures from arXiv PDFs into `dataset/images/` plus authoring the figure manifest.

**Example:**
```python
# Source: pymupdf.readthedocs.io/en/latest/recipes-images.html
import fitz  # PyMuPDF
import json
from pathlib import Path

def extract_figures(pdf_path: Path, out_dir: Path, paper_id: str) -> list[dict]:
    doc = fitz.open(pdf_path)
    manifest_entries = []
    fig_counter = 0

    for page_no, page in enumerate(doc, start=1):
        for img in page.get_images(full=True):
            xref = img[0]
            rects = page.get_image_rects(xref)
            if not rects:
                continue
            bbox = rects[0]  # first occurrence on page

            base = doc.extract_image(xref)
            ext = base["ext"]  # png, jpg, etc.
            data = base["image"]

            fig_counter += 1
            fig_id = f"{paper_id}_fig_{fig_counter:03d}"
            out_path = out_dir / f"{fig_id}.{ext}"
            out_path.write_bytes(data)

            manifest_entries.append({
                "figure_id": fig_id,
                "paper_id": paper_id,
                "page_number": page_no,
                "bbox": [bbox.x0, bbox.y0, bbox.x1, bbox.y1],
                "caption": "",  # populated manually or via heuristic in scripts/
                "filename": out_path.name,
            })

    doc.close()
    return manifest_entries
```

**Caveat:** `page.get_images()` returns *every* image — including header logos and inline math. The script should let the curator filter manually before publishing the manifest. Caption extraction is non-trivial and typically pulled from text just below `bbox.y1`; for Phase 127, treat `caption` as a manual field.

### Pattern 4: google-genai unified SDK (LLM + embeddings)

**What:** Single `Client()` instance, `client.models.generate_content()` for text, `client.models.embed_content()` for embeddings. API key from `GEMINI_API_KEY` or `GOOGLE_API_KEY` env var.

**When to use:** Default for all `shared/llm.py` and `shared/embeddings.py` calls.

**Example:**
```python
# Source: googleapis.github.io/python-genai
from google import genai
from google.genai import types

# Client reads GEMINI_API_KEY or GOOGLE_API_KEY automatically
client = genai.Client()

# LLM
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Summarize the abstract of arxiv:2005.11401 in one sentence.",
)
print(response.text)
print("input tokens:", response.usage_metadata.prompt_token_count)
print("output tokens:", response.usage_metadata.candidates_token_count)

# Embeddings
embed_response = client.models.embed_content(
    model="gemini-embedding-001",
    contents=["hello world"],
    config=types.EmbedContentConfig(output_dimensionality=768),
)
vector = embed_response.embeddings[0].values
```

**Token usage:** `response.usage_metadata` has `prompt_token_count`, `candidates_token_count`, `total_token_count`. Feed those into `shared/cost_tracker.py`.

### Pattern 5: Pydantic Settings v2 for `.env` loading

**What:** `BaseSettings` subclass with `model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')`. Use `SecretStr` for any field that holds an API key.

**When to use:** `shared/config.py` — single source of truth for API keys, model names, paths.

**Example:**
```python
# Source: pydantic.dev/docs/validation/latest/concepts/pydantic_settings/
from pydantic import SecretStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # tier-specific keys can exist in .env without breaking shared
    )

    # Required for shared/ smoke test
    gemini_api_key: SecretStr = Field(..., alias="GEMINI_API_KEY")

    # Optional per-tier
    openai_api_key: SecretStr | None = Field(None, alias="OPENAI_API_KEY")

    # Defaults
    default_chat_model: str = "gemini-2.5-flash"
    default_embedding_model: str = "gemini-embedding-001"
    dataset_root: str = "dataset"

settings = Settings()  # exported singleton

# Access:
# settings.gemini_api_key.get_secret_value()  # never log .gemini_api_key directly
```

**Why `SecretStr`:** `repr(settings)` shows `gemini_api_key=SecretStr('**********')`. Logs and tracebacks won't leak the real value.

### Pattern 6: rich display layout for query → chunks → answer → cost

**What:** Compose `Panel` (query), `Table` (chunks with similarity), `Panel` (answer with `markdown` rendering), then a final `Table` for cost summary.

**When to use:** End-of-query output in every tier's CLI script, plus screencast/blog screenshots.

**Example:**
```python
# Source: rich.readthedocs.io
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.markdown import Markdown

console = Console()

def render_query_result(
    query: str,
    chunks: list[dict],   # {"doc_id": str, "score": float, "snippet": str}
    answer: str,
    cost_usd: float,
    input_tokens: int,
    output_tokens: int,
) -> None:
    console.print(Panel(query, title="[bold cyan]Query", border_style="cyan"))

    chunks_table = Table(title="Retrieved Chunks", show_lines=False)
    chunks_table.add_column("Rank", justify="right", style="dim", width=4)
    chunks_table.add_column("Doc", style="cyan")
    chunks_table.add_column("Score", justify="right", style="magenta")
    chunks_table.add_column("Snippet", overflow="fold")
    for i, c in enumerate(chunks, start=1):
        chunks_table.add_row(str(i), c["doc_id"], f"{c['score']:.3f}",
                             c["snippet"][:120] + "...")
    console.print(chunks_table)

    console.print(Panel(Markdown(answer), title="[bold green]Answer",
                        border_style="green"))

    cost_table = Table(title="Cost", show_header=False)
    cost_table.add_column(style="bold")
    cost_table.add_column(justify="right")
    cost_table.add_row("Input tokens", f"{input_tokens:,}")
    cost_table.add_row("Output tokens", f"{output_tokens:,}")
    cost_table.add_row("Total cost", f"${cost_usd:.6f}")
    console.print(cost_table)
```

**Color choices:** cyan for query (cool, readable), magenta for scores (numeric, distinguishable), green for answer (positive/result), dim for ranks.

### Pattern 7: pyproject.toml with optional-dependencies + dependency-groups

**What:** `[project.optional-dependencies]` for tier-specific runtime deps (published with the package), `[dependency-groups]` (PEP 735) for dev/test tooling that should not be published.

**When to use:** Top-level `pyproject.toml`. Each tier directory mirrors its extras into a `requirements.txt` for users who prefer pip-style install.

**Example:**
```toml
# Source: peps.python.org/pep-0735/ + docs.astral.sh/uv/concepts/projects/dependencies/
[project]
name = "rag-architecture-patterns"
version = "0.1.0"
description = "Companion repo for the RAG Architecture Patterns blog post"
requires-python = ">=3.10"
license = { text = "Apache-2.0" }
dependencies = []  # the package itself is import-only at root; no runtime deps here

[project.optional-dependencies]
shared = [
  "google-genai>=1.73,<2",
  "pydantic>=2.10,<3",
  "pydantic-settings>=2.10,<3",
  "rich>=14,<16",
  "tiktoken>=0.10,<1",
  "python-dotenv>=1.0,<2",
]
tier-1 = [
  "rag-architecture-patterns[shared]",
  "chromadb>=0.5,<1",  # placeholder — Phase 128 verifies
]
tier-2 = ["rag-architecture-patterns[shared]"]
tier-3 = [
  "rag-architecture-patterns[shared]",
  # "lightrag-hku>=1.4.15",  # Phase 129 verifies
]
tier-4 = [
  "rag-architecture-patterns[shared]",
  # Phase 130 verifies RAG-Anything + MinerU
]
tier-5 = [
  "rag-architecture-patterns[shared]",
  # Phase 130 verifies OpenAI Agents SDK
]
curation = [
  "arxiv>=3.0,<4",
  "semanticscholar>=0.12,<1",
  "pymupdf>=1.27,<2",
]

[dependency-groups]
test = ["pytest>=8.4,<9"]
dev = [
  {include-group = "test"},
  "ruff>=0.6",
]

[tool.uv]
default-groups = ["dev"]
```

### Anti-Patterns to Avoid

- **Hardcoding API keys in code or `.env.example`.** Use the placeholder pattern: `GEMINI_API_KEY=your_key_here`.
- **Using `google-generativeai` (deprecated 2025-08-31).** Always import `from google import genai`. `[CITED: github.com/google-gemini/deprecated-generative-ai-python]`
- **Calling arXiv API more than once per 3s, or in parallel.** ToU forbids both. The arxiv.py client enforces this if you set `delay_seconds=3.0`. `[CITED: info.arxiv.org/help/api/tou.html]`
- **Using S2 unauthenticated for high-volume crawls.** Shared 5k-req/5min pool will starve your script. Request an API key. `[CITED: github.com/allenai/s2-folks/blob/main/API_RELEASE_NOTES.md]`
- **Committing PDFs without git-lfs first.** `git lfs install` (one-time per machine) + `git lfs track` patterns in `.gitattributes` **must be committed before** the first PDF is `git add`-ed, or the binary lands in regular git history and bloats the repo permanently.
- **Embedding rich Markdown directly with raw f-strings containing user data.** Rich's markup ([brackets]) interprets the brackets — escape user-supplied text via `rich.markup.escape()` if it could contain bracket characters.
- **Pinning rich to 13.x.** 14.0.0 (released 2025-08) is the current stable; 13.7.x is on the prior major. Pin to `>=14,<16` to allow 15 if released.
- **Treating `metadata.json` as ground truth duplicating the manifests.** Either the top-level metadata.json *is* the source of truth and the manifests are derived, or the manifests are the source. Pick one. **Recommendation: manifests are sources of truth, metadata.json is the index.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| arXiv API client + ToU compliance | Custom `requests` loop with `time.sleep(3)` | `arxiv` 3.0 with `Client(delay_seconds=3.0)` | Library handles retries, page boundaries, the new `id_list` deterministic mode `[CITED: github.com/lukasschwab/arxiv.py]` |
| Semantic Scholar API client + pagination | Custom `httpx` with offset/limit math | `semanticscholar` 0.12 | Typed responses, async support, exponential backoff `[CITED: semanticscholar.readthedocs.io]` |
| PDF figure extraction | Custom `pdfminer` + manual image-stream parsing | PyMuPDF `page.get_images()` + `page.get_image_rects()` | Bounding boxes, transformation matrix, all extraction in one call `[CITED: pymupdf.readthedocs.io]` |
| `.env` loading + validation | Custom `os.getenv` checks scattered across modules | Pydantic Settings v2 + `SecretStr` | Single config, type checks, masked logging `[CITED: pydantic.dev]` |
| Token counting for cost estimation | Manually count whitespace-split tokens | `client.models.count_tokens()` (Gemini), `tiktoken.encoding_for_model()` (OpenAI) | Tokenization is non-trivial — wrong tokenization → wrong cost |
| Console table layout | Manual `format()` + ANSI codes | `rich.Table` + `rich.Panel` | Renders correctly across terminals, supports markup, copies cleanly to screencasts |
| Video clip extraction | Custom Python video lib | `ffmpeg -ss START -t DURATION -c copy` via `subprocess.run` | Stream-copy is lossless, instant, doesn't decode |
| GitHub repo creation | `git init` + manual remote setup | `gh repo create org/name --public --source . --remote origin --push` | One command, sets up README + remote + push |
| Large file storage | Splitting binaries into chunks | `git-lfs` | Standard solution, GitHub-native, transparent to clones |
| arXiv ID parsing | Regex on `2005.11401v3` strings | `arxiv.Result.get_short_id()` and `paper.entry_id` | Library handles new vs old style + version suffixes |

**Key insight:** Every problem in this list has been solved. Curation scripts are throwaway — write them once, run them once, commit the output. Don't accidentally invest in custom infrastructure for a one-shot.

## Runtime State Inventory

> Phase 127 is greenfield (creating a new repo from scratch). No existing runtime state to inventory.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — new repo, no existing datastore | None |
| Live service config | None — no live services exist yet | None |
| OS-registered state | None — no scheduled jobs, services, or registered processes | None |
| Secrets/env vars | New `.env` file (gitignored); `.env.example` committed with placeholders | Document in README that user creates `.env` from `.env.example` |
| Build artifacts | None — repo does not exist yet | None |

**Nothing found in any category** — verified by inspection: the GitHub org `PatrykQuantumNomad` does not yet have a `rag-architecture-patterns` repo (Phase 127 creates it).

## Common Pitfalls

### Pitfall 1: Committing PDFs before `git lfs install`

**What goes wrong:** First PDF gets stored as a regular git blob. Even if you later `git lfs migrate`, the binary lives in history forever (unless you rewrite history with BFG, which is destructive and breaks all clones).

**Why it happens:** `git lfs install` is a per-user, per-repo init step that's easy to skip. `git lfs track "*.pdf"` only updates `.gitattributes`; it doesn't retroactively LFS-ify already-staged files.

**How to avoid:**
1. `git lfs install` immediately after `git init`
2. `git lfs track "*.pdf" "*.png" "*.jpg" "*.mp4"` and commit `.gitattributes` **first**
3. Only then `git add dataset/papers/*.pdf`

**Warning signs:** `git ls-files | xargs -I {} git check-attr filter {}` — every binary should show `filter: lfs`. If any show `filter: unspecified`, it's a regular blob.

### Pitfall 2: Hitting arXiv ToU rate limit (silent ban)

**What goes wrong:** arXiv blocks your IP for some hours/days. No clear error — just hangs or 503s.

**Why it happens:** Default `arxiv.Client()` in 3.0 sets `delay_seconds=3.0`, but if you build a custom loop or hit the OAI-PMH bulk endpoint without throttling, you can trip the limit silently.

**How to avoid:** Always use `arxiv.Client(delay_seconds=3.0, num_retries=5)` and never parallelize across multiple processes. If batch is large (>500 papers), use the OAI-PMH endpoint instead.

**Warning signs:** Long pauses, 503 errors, repeated 429s. Also, your arXiv-resolved IP should not be in a CDN — check with `curl -v` from the same machine.

### Pitfall 3: Semantic Scholar shared-pool throttling

**What goes wrong:** Even at 1 req/s your script gets 429s because **all unauthenticated users** share a 5k-per-5-min pool.

**Why it happens:** The pool is global across the planet. `[CITED: github.com/allenai/s2-folks/blob/main/API_RELEASE_NOTES.md]`

**How to avoid:** Request a free API key (no commercial restriction, free email domains rejected — use `golysoft@gmail.com` is an established personal account, but if it's a free-tier email S2 may reject — try the project's domain). Pass via `SemanticScholar(api_key=...)`. Authenticated key gets dedicated 1 req/s + retries with exponential backoff.

**Warning signs:** Sporadic 429s on the very first request of a session. If your local script gets 429 on call #1, you're hitting the global ceiling, not a local quota.

### Pitfall 4: `google-generativeai` (old SDK) snuck into the dependency tree

**What goes wrong:** Import works today, errors out after the EOL date (2025-08-31, already past). Or worse: imports succeed but routing through a deprecated endpoint silently degrades quality.

**Why it happens:** Stack Overflow and old Medium articles still show `import google.generativeai as genai` patterns. New tier authors copy-paste.

**How to avoid:** Lint rule / grep in CI: `if grep -r "import google.generativeai\|from google.generativeai" shared/ tier-*/`. Add to README and CONTRIBUTING.

**Warning signs:** `pip list | grep generativeai` returns the old package name. Pin only `google-genai` in pyproject.toml. `[CITED: github.com/google-gemini/deprecated-generative-ai-python]`

### Pitfall 5: `.env` committed to git

**What goes wrong:** Real API keys end up in public history. Costs incurred, account potentially compromised.

**Why it happens:** `.env` not in `.gitignore`, or contributor manually `git add -f .env`.

**How to avoid:**
1. `.env` listed in `.gitignore` from commit 1
2. `.env.example` committed with placeholder values like `GEMINI_API_KEY=your_key_here`
3. Pre-commit hook (optional) scanning for high-entropy strings
4. Never use `git add -A` in commit instructions; prefer named-file `git add`

**Warning signs:** `git log --diff-filter=A --name-only | grep -E '^\.env$'` returns anything non-empty.

### Pitfall 6: Smoke test consuming significant credits

**What goes wrong:** Smoke runs in CI (or locally on every commit) — each run costs $X, multiplied by frequency = real money.

**Why it happens:** Choosing the wrong model (gemini-2.5-pro instead of flash), or running too much text through the call.

**How to avoid:**
- Smoke uses `gemini-2.5-flash` ($0.30/1M input, $2.50/1M output) and `gemini-embedding-001` ($0.15/1M input)
- Smoke prompt: literal `"hello world"` (3 input tokens) + `"Reply with exactly: ok"` instruction (~10 tokens) → expected response ~3 tokens
- Per run: ~16 input tokens, ~3 output tokens, ~3 embedding tokens → about **$0.0001**, matches CONTEXT.md target.
- Skip smoke in CI on doc-only changes (path filter `paths-ignore: ['**.md', 'docs/**']`)

**Warning signs:** Monthly bill shows >$1 from smoke alone.

### Pitfall 7: Figure extraction yields hundreds of "garbage" images

**What goes wrong:** `page.get_images()` returns logo, header, footer, decorative line images on every page. You ship 5,000 images instead of ~300 real figures.

**Why it happens:** PyMuPDF returns *all* embedded images, no semantic filtering.

**How to avoid:**
- Filter by image size: skip if `width < 200 or height < 200`
- Filter by aspect: skip extreme aspect ratios (logos are usually wide)
- Filter by xref dedup: same logo on every page has the same xref — keep only one
- After programmatic extraction, **manual review** before committing the manifest. CONTEXT.md says license verification is manual; figure curation belongs in the same manual step.

**Warning signs:** Image count >> page count × 3.

### Pitfall 8: CC-license clip with ND restriction

**What goes wrong:** The selected video clip is CC BY-ND or CC BY-NC-ND, which prohibits derivatives. Cutting a 30s clip from a longer talk *is* a derivative work.

**Why it happens:** Confusion between CC BY (any reuse, attribution) and CC BY-ND (no derivatives).

**How to avoid:** Verify license per clip before cutting. Acceptable: CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA. **Reject:** CC BY-ND, CC BY-NC-ND. `[CITED: creativecommons.org/about/cclicenses/]`

**Warning signs:** The talk's license page says "NoDerivatives" or "ND".

### Pitfall 9: Repo size > git-lfs free quota during dev

**What goes wrong:** GitHub Free's git-lfs quota (1 GB storage / 1 GB bandwidth/month historically; some sources say 10 GB now — see Open Question #1) is exceeded by curation experiments. Repository becomes read-only for LFS until the next billing cycle, or you're charged for data packs ($5/50GB/month).

**Why it happens:** Re-cloning the repo during development pulls all 300–500 MB of LFS objects every time. Five clones in a month = 1.5–2.5 GB of bandwidth.

**How to avoid:**
- Use `GIT_LFS_SKIP_SMUDGE=1 git clone ...` for clones that don't need binaries
- Use `git lfs pull --include "dataset/papers/*.pdf"` for partial pulls
- Verify GitHub Free quota at the time of repo creation; if it's still 1 GB, upgrade to Pro ($4/mo) before significant LFS usage
- Document in README: "Cloning this repo pulls ~XXX MB of LFS objects."

**Warning signs:** "Git LFS bandwidth quota exceeded" error during `git push` or `git pull`.

## Code Examples

(See Pattern 1–7 above for full code examples — arXiv batch fetch, Semantic Scholar citation traversal, PyMuPDF figure extraction, google-genai unified SDK, Pydantic Settings v2, rich display, pyproject.toml with extras + dep-groups.)

### Smoke test skeleton

```python
# tests/smoke_test.py
# Source: synthesized from google-genai docs + pytest 8 conventions
"""Smoke test: <5s, ~$0.0001/run. Validates shared/ + .env + Gemini connectivity."""
from shared.config import settings
from shared.llm import get_llm_client
from shared.embeddings import get_embedding_client

def test_imports() -> None:
    """All shared/ modules import cleanly."""
    from shared import config, llm, embeddings, loader, display, cost_tracker, pricing  # noqa: F401

def test_required_env_keys() -> None:
    """At minimum, GEMINI_API_KEY is set."""
    assert settings.gemini_api_key.get_secret_value(), "GEMINI_API_KEY missing"

def test_real_embedding_call() -> None:
    """One round-trip to Gemini embedding endpoint with 'hello world'."""
    client = get_embedding_client()
    response = client.embed("hello world")
    assert isinstance(response, list)
    assert len(response) > 100  # vector dim sanity check

def test_real_llm_call() -> None:
    """One trivial LLM round-trip."""
    client = get_llm_client()
    response = client.complete("Reply with exactly: ok")
    assert "ok" in response.text.lower()
```

### .gitattributes

```
# Source: docs.github.com/en/repositories/working-with-files/managing-large-files/configuring-git-large-file-storage
*.pdf  filter=lfs diff=lfs merge=lfs -text
*.png  filter=lfs diff=lfs merge=lfs -text
*.jpg  filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.mp4  filter=lfs diff=lfs merge=lfs -text
*.webm filter=lfs diff=lfs merge=lfs -text
```

### .env.example

```
# ============================================================
# Required for shared/ smoke test (Phase 127)
# ============================================================
GEMINI_API_KEY=your_gemini_api_key_here
# Get one: https://aistudio.google.com/app/apikey

# ============================================================
# Optional — required only by specific tiers
# ============================================================

# Tier 2 (Managed File Search), Tier 5 (Agentic) — if using OpenAI
OPENAI_API_KEY=

# Semantic Scholar — only used by curation scripts/, not at runtime
S2_API_KEY=

# Override defaults
DEFAULT_CHAT_MODEL=gemini-2.5-flash
DEFAULT_EMBEDDING_MODEL=gemini-embedding-001
DATASET_ROOT=dataset
```

### shared/pricing.py (price table — discretion area, current values)

```python
# Source: ai.google.dev/gemini-api/docs/pricing (verified 2026-04-25)
#         cloudzero.com/blog/openai-pricing/ (April 2026)
# All values: USD per 1M tokens. Update on phase build.

PRICES: dict[str, dict[str, float]] = {
    # Gemini — primary
    "gemini-2.5-flash": {
        "input": 0.30,    # text/image/video; audio is $1.00
        "output": 2.50,
        "cache": 0.03,
    },
    "gemini-2.5-pro": {
        "input": 1.25,    # prompts <=200k; >200k is $2.50
        "output": 10.00,  # prompts <=200k; >200k is $15.00
        "cache": 0.125,
    },
    "gemini-embedding-001": {
        "input": 0.15,
        "output": 0.0,
    },
    # OpenAI — referenced by Tier 2 / Tier 5
    # NOTE: OpenAI's flagship is now GPT-5.4 family per April 2026 pricing.
    # Tier 2/5 phases must reverify.
    "gpt-4o-mini": {
        "input": 0.15,
        "output": 0.60,
    },
    "gpt-4o": {
        "input": 2.50,
        "output": 10.00,
    },
    "text-embedding-3-small": {
        "input": 0.02,
        "output": 0.0,
    },
    "text-embedding-3-large": {
        "input": 0.13,
        "output": 0.0,
    },
}

PRICING_DATE = "2026-04-25"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `google-generativeai` SDK | `google-genai` (unified SDK) | EOL 2025-08-31 | All Gemini calls must migrate; `from google import genai`; `client.models.generate_content()` `[CITED: github.com/google-gemini/deprecated-generative-ai-python]` |
| `setup.py` / `setup.cfg` | `pyproject.toml` (PEP 621) + optional `[dependency-groups]` (PEP 735) | PEP 735 finalized 2024 | Dev deps no longer published; `uv pip install --group dev` `[CITED: peps.python.org/pep-0735/]` |
| `pip` for installs | `uv` | uv 0.4+ stable late 2024 | 10–100× faster; same lockfile semantics; works with both extras and dep-groups `[CITED: docs.astral.sh/uv]` |
| `requests` to call arXiv directly | `arxiv` 3.0 | v3 released 2024-04 | Library enforces ToU rate, handles `id_list`, hardens against API instability `[CITED: github.com/lukasschwab/arxiv.py/releases]` |
| Pydantic v1 `BaseSettings` | `pydantic-settings` v2 with `SettingsConfigDict` | Pydantic 2 GA 2023-06 | New model_config dict, `SecretStr` is built-in, env_file via SettingsConfigDict |
| `text-embedding-004` (Gemini) | `gemini-embedding-001` | Sometime 2025 | Use new model name; pricing page no longer lists 004 `[CITED: ai.google.dev/gemini-api/docs/pricing]` |
| GitHub LFS Free 1GB/1GB | GitHub LFS Free 10GB/10GB **OR** still 1GB depending on source | Disputed — see Open Question #1 | Verify before phase execution; budget repo size accordingly |

**Deprecated / outdated:**

- **`google-generativeai` package** — replaced by `google-genai`. EOL 2025-08-31. `[CITED: github.com/google-gemini/deprecated-generative-ai-python]`
- **arXiv 2.x submodule imports** (`from arxiv import arxiv`) — removed in 3.0. Use `import arxiv`. `[CITED: github.com/lukasschwab/arxiv.py]`
- **Pydantic v1 `BaseSettings`** — keep using `pydantic-settings` v2.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Curation script topping out at ~3,000 S2 calls succeeds without an API key (within 5k/5min global pool) | Pattern 2, Pitfall 3 | Curation script throttled; need API key request before phase execution can finish |
| A2 | arXiv PDFs for the seed RAG-literature cluster are all listed (i.e., not behind preprint embargo or removed) | Corpus composition | A few seed papers may need replacement |
| A3 | PyMuPDF size-and-aspect heuristic prunes 90%+ of "garbage" images (logos, decorations) | Pitfall 7 | Manifest curation step takes longer; still feasible manually |
| A4 | gemini-2.5-flash + gemini-embedding-001 round-trip total cost ~$0.0001 per smoke run | Pitfall 6, smoke test | Over-budget by 1–2× max; would still fit under $1/month even on aggressive CI |
| A5 | Conference talk videos from NeurIPS/MLSys/ICLR have explicit CC license metadata published | Image & video assets | If no CC license is found, fall back to talks from venues that publish under CC by default (e.g., open-access workshops) |
| A6 | `gh repo create` works without additional org permissions for `PatrykQuantumNomad` | REPO-01 | One-time auth via `gh auth login` may be required first |
| A7 | OpenAI pricing for `gpt-4o`/`gpt-4o-mini` remains valid even though GPT-5.4 family is the 2026 flagship — the older models are still callable via API | shared/pricing.py | Tier 2/Tier 5 phases will refresh this table when they implement |

## Open Questions

1. **GitHub LFS Free tier quota — 1 GB or 10 GB?**
   - What we know: GitHub's official docs page on storage and bandwidth states 10 GiB for Free/Pro `[CITED: docs.github.com/en/repositories/working-with-files/managing-large-files/about-storage-and-bandwidth-usage]`. Multiple secondary sources from 2024–2025 still cite 1 GB. CONTEXT.md cites 1 GB.
   - What's unclear: Whether the increase is fully rolled out, regional, or applies only to new accounts.
   - Recommendation: Plan for the conservative 1 GB worst case at curation time. Test the actual quota by inspecting `gh api /repos/PatrykQuantumNomad/rag-architecture-patterns/lfs/objects` after the first push, or by checking the org settings panel. If the lower limit is in force, recommend Pro ($4/mo).

2. **Citation cluster density — is ~100 papers achievable from RAG seeds?**
   - What we know: Lewis et al. 2020 has thousands of citations; LightRAG and GraphRAG papers are recent (2024) and cite 30–80 references each. Walking 1–2 hops from ~10 seeds typically yields 200–500 candidate papers; filtering to "ML/systems-relevant" usually drops to ~150.
   - What's unclear: Whether all 100 selected will be on arXiv (some may be NeurIPS-only, ICML proceedings, journal articles).
   - Recommendation: Curator picks 120 candidates, drops any without an arXiv ID, lands at ~100. Documented as part of the curation manifest.

3. **Which exact Gemini embedding model is the "default" — `gemini-embedding-001` or its successor?**
   - What we know: Pricing page shows `gemini-embedding-001` (HIGH) and a "gemini-embedding-2" mentioned in passing (MEDIUM). `text-embedding-004` no longer listed (HIGH).
   - What's unclear: Whether `gemini-embedding-2` is GA or preview.
   - Recommendation: Default to `gemini-embedding-001` (verified pricing, verified GA). Phase 128+ revisits when implementing.

4. **Caption extraction in figure manifest — leave manual or auto-attempt?**
   - What we know: PyMuPDF gives bounding box but no caption-binding logic.
   - What's unclear: Whether the planner wants Phase 127 to ship a heuristic ("text immediately below bbox starting with `Figure N:`") or leave caption blank.
   - Recommendation: For the first cut, ship the manifest with bounding boxes + page number; leave `caption` field as empty string. Curator can fill in for the 30 figures referenced in golden_qa, leave the rest blank. Phase 130 (multimodal) can revisit if needed.

5. **Should video frames be sampled at curation time or runtime?**
   - What we know: CONTEXT.md says Phase 127 only commits clips + manifest. Frame sampling is a Tier 4 extension concern.
   - What's unclear: Whether the manifest schema should include placeholder fields anticipating frame sampling (e.g., `frame_sample_rate_fps`, `frame_count`).
   - Recommendation: Add optional fields to the video manifest schema (`frame_sample_rate_fps`, `frame_count`) but leave them null in Phase 127. Tier 4 phase fills them when running frame-sampling.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.10+ | All shared/ + tier code | ✓ | 3.11.7 | — |
| pip | Fallback installer | ✓ | 24.3.1 | — |
| uv | Recommended package manager | ✓ | 0.6.3 | pip works |
| git | VCS | ✓ | 2.50.1 | — |
| git-lfs | Large file storage | ✓ | 3.7.1 | — (mandatory) |
| gh CLI | Repo creation (REPO-01) | ✓ | 2.91.0 | manual via web UI |
| ffmpeg | Video clip cutting | ✓ | 8.1 | — (mandatory for video) |
| GEMINI_API_KEY | shared/llm.py + smoke test | ⚠ User must provide | — | None — required |
| OPENAI_API_KEY | Tier 2 / Tier 5 (downstream) | — | — | Skip in Phase 127; Tier 2/5 verify |
| S2_API_KEY | Curation script (recommended, optional) | — | — | Unauthenticated pool (5k/5min global) for ≤3k calls |

**Missing dependencies with no fallback:**
- `GEMINI_API_KEY` — user must obtain at https://aistudio.google.com/app/apikey before running smoke test. Document in README.

**Missing dependencies with fallback:**
- `S2_API_KEY` — unauthenticated S2 calls work for low volume. Curation script can run without; if 429s appear, recommend obtaining the key.
- `gh` CLI auth — if `gh auth status` shows logged out, plan must include `gh auth login` step.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 8.4.2 |
| Config file | `pyproject.toml` `[tool.pytest.ini_options]` block |
| Quick run command | `uv run pytest tests/ -x -q` |
| Full suite command | `uv run pytest tests/ -v` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REPO-01 | Repo exists at PatrykQuantumNomad/rag-architecture-patterns; README links to blog placeholder | smoke | `gh repo view PatrykQuantumNomad/rag-architecture-patterns --json name`<br>`grep -q 'patrykgolabek.dev/blog/rag-architecture-patterns' README.md` | ❌ Wave 0 (`tests/test_repo_metadata.py`) |
| REPO-02 | Dataset has text docs, PDFs, ≥1 image; manifests exist and parse | smoke | `pytest tests/test_dataset.py::test_manifests_parse -x` | ❌ Wave 0 (`tests/test_dataset.py`) |
| REPO-03 | All `shared/` modules importable; smoke test passes against real Gemini APIs | unit + integration | `pytest tests/smoke_test.py -x` | ❌ Wave 0 (`tests/smoke_test.py`) |
| REPO-04 | Each tier-N/ has `requirements.txt` referencing parent extras; pyproject extras defined | smoke | `pytest tests/test_tier_requirements.py -x` | ❌ Wave 0 (`tests/test_tier_requirements.py`) |
| REPO-06 | `.env.example` exists; documents all known keys | smoke | `pytest tests/test_env_example.py -x` | ❌ Wave 0 (`tests/test_env_example.py`) |

### Sampling Rate

- **Per task commit:** `uv run pytest tests/ -x -q` (skip live API tests via marker `-m 'not live'` to keep <1s)
- **Per wave merge:** `uv run pytest tests/ -v` (includes smoke_test.py with real Gemini call, ~3s, ~$0.0001)
- **Phase gate:** Full suite green before `/gsd-verify-work`. CI runs full suite on `main` only; PR runs `-m 'not live'`.

### Wave 0 Gaps

- [ ] `tests/conftest.py` — shared fixtures (e.g., `tmp_dataset_root`, `mock_settings`)
- [ ] `tests/smoke_test.py` — covers REPO-03
- [ ] `tests/test_repo_metadata.py` — covers REPO-01
- [ ] `tests/test_dataset.py` — covers REPO-02 (manifest schema validation)
- [ ] `tests/test_tier_requirements.py` — covers REPO-04
- [ ] `tests/test_env_example.py` — covers REPO-06
- [ ] Framework install: `uv pip install --group test` (after pyproject.toml is in place)
- [ ] `[tool.pytest.ini_options]` markers: `markers = ["live: tests that hit real APIs and incur cost"]`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | partial | Single-user CLI tool — no app auth, but API keys must not leak |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No multi-tenant; single-user repo |
| V5 Input Validation | yes | Pydantic Settings validates `.env` shape; manifest JSONs validated by Pydantic models |
| V6 Cryptography | partial | Use `SecretStr` for keys; never hand-roll crypto |
| V7 Error Handling & Logging | yes | Never log `SecretStr.get_secret_value()`; log only the masked repr |
| V8 Data Protection | yes | `.env` in `.gitignore`; `.gitattributes` does not include `.env` |
| V14 Configuration | yes | Single source of truth (`shared/config.py`); no hardcoded keys |

### Known Threat Patterns for Python CLI + LFS repos

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key in committed `.env` | Information Disclosure | `.env` in `.gitignore` from commit 1; pre-commit hook detects high-entropy strings |
| API key in stack trace / log | Information Disclosure | `SecretStr` masks in `repr`; never call `.get_secret_value()` in logging path |
| LFS pointer leaks repo contents publicly | Information Disclosure | Repo is intended public; not a threat — but if private, ensure LFS object permissions inherit repo permissions |
| Curation script downloads malicious PDF | Tampering | arXiv is a trusted source; PDFs are inert text/image binaries; no JS execution. PyMuPDF processes locally with no shell-out. Acceptable. |
| Smoke test in CI exposes key in logs | Information Disclosure | Use GitHub Actions secrets (`secrets.GEMINI_API_KEY`); set `GEMINI_API_KEY` as encrypted env, not echoed |
| Dependency confusion attack | Tampering | Pin top-level versions; use `uv.lock` for reproducible installs |

## Sources

### Primary (HIGH confidence)

- `pip3 index versions <pkg>` (verified locally 2026-04-25): arxiv 3.0.0, pymupdf 1.27.2.3, pdfplumber 0.11.9, rich 14.3.4, pydantic-settings 2.14.0, pydantic 2.13.3, google-genai 1.73.1, google-generativeai 0.8.6, tiktoken 0.12.0, pytest 8.4.2, marker-pdf 1.10.2, pypdf 6.10.2, semanticscholar 0.12.0, python-dotenv 1.2.2, httpx 0.28.1
- `git --version` 2.50.1, `git lfs version` 3.7.1, `gh --version` 2.91.0, `ffmpeg -version` 8.1, `python3 --version` 3.11.7, `uv --version` 0.6.3
- https://info.arxiv.org/help/api/tou.html — arXiv API ToU (3s/req, single connection)
- https://github.com/lukasschwab/arxiv.py + https://github.com/lukasschwab/arxiv.py/releases — arXiv 3.0 breaking changes
- https://pymupdf.readthedocs.io/en/latest/recipes-images.html — PyMuPDF figure extraction
- https://googleapis.github.io/python-genai/ — google-genai unified SDK API
- https://github.com/google-gemini/deprecated-generative-ai-python — `google-generativeai` deprecation notice
- https://pydantic.dev/docs/validation/latest/concepts/pydantic_settings/ — Pydantic Settings v2 API
- https://peps.python.org/pep-0735/ — Dependency Groups specification
- https://docs.astral.sh/uv/concepts/projects/dependencies/ — uv dependency management
- https://rich.readthedocs.io/en/stable/panel.html + https://rich.readthedocs.io/en/stable/tables.html — rich Panel and Table API
- https://creativecommons.org/about/cclicenses/ — CC license types
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/configuring-git-large-file-storage — git-lfs configuration
- https://ai.google.dev/gemini-api/docs/pricing — Gemini pricing (April 2026)
- https://github.com/allenai/s2-folks/blob/main/API_RELEASE_NOTES.md — S2 rate limits

### Secondary (MEDIUM confidence)

- https://www.cloudzero.com/blog/openai-pricing/ — OpenAI 2026 pricing for gpt-4o-mini, text-embedding-3-small/large
- https://semanticscholar.readthedocs.io/en/stable/api.html — semanticscholar Python lib API
- https://github.com/danielnsilva/semanticscholar — current version 0.12.0 (2026-03-29)
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-storage-and-bandwidth-usage — GitHub LFS Free quota (10 GiB per source; sources disagree)

### Tertiary (LOW confidence)

- General community comparisons of PDF libraries — flagged for verification when figure extraction is implemented
- `gemini-embedding-2` mentioned in passing on Gemini pricing page — flagged in Open Question #3

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every package version verified against PyPI today; google-genai migration verified against deprecation notice
- Architecture patterns: HIGH — patterns synthesized from official docs of each library; code examples adapted from each library's quickstart
- Pitfalls: HIGH for tooling pitfalls (LFS, deprecated SDK, ToU rate limits); MEDIUM for the smoke-test cost estimate (depends on actual response sizes)
- Pricing: MEDIUM — values verified against ai.google.dev as of 2026-04-25, but pricing changes more frequently than libraries; should be re-verified at phase build
- LFS quota: MEDIUM — official source says 10 GiB but multiple secondary sources still report 1 GiB; flagged as Open Question #1

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (30 days for stable stack); pricing values 2026-05-15 (15 days for pricing freshness)
