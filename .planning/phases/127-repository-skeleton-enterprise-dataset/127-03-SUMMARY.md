---
phase: 127-repository-skeleton-enterprise-dataset
plan: 03
subsystem: curation
tags: [arxiv, semantic-scholar, pymupdf, ffmpeg, citation-graph, dry-run, cc-license]

requires:
  - phase: 127-repository-skeleton-enterprise-dataset
    provides: "Repo skeleton + git-lfs + pyproject curation extras (Plan 01)"
provides:
  - "scripts/curate_corpus.py — arxiv 3.0 + semanticscholar 0.12 RAG citation-cluster crawler with --dry-run"
  - "scripts/extract_figures.py — PyMuPDF figure extractor with size/aspect/xref-dedup filters"
  - "scripts/cut_video_clips.py — ffmpeg stream-copy clip cutter with CC-license safety gate"
  - "scripts/seed_papers.json — 10 RAG-literature anchor arXiv IDs (Lewis 2020, LightRAG, GraphRAG, RAG-Anything, RGB, Self-RAG, FLARE, Query-Rewriting, DPR, RAGAS)"
  - "scripts/video_sources.json — 1 candidate clip entry awaiting Plan 05 manual license verification"
  - "scripts/README.md — pipeline order, dry-run-first protocol, license verification table, ffmpeg/LFS/ToU notes"
affects: [127-04-corpus-download, 127-05-figure-extraction-video-cuts]

tech-stack:
  added: [Pillow]
  patterns:
    - "arxiv.Client(delay_seconds=3.0, num_retries=5, page_size=100) — ToU compliant per Pitfall 2"
    - "Exponential backoff on Semantic Scholar 429 (5s × 2^attempt, ≤5 retries) per Pitfall 3"
    - "Reference-first citation expansion (older work foundational over newer tangential)"
    - "Drop non-arxiv refs/cits (Open Question #2) — only papers with ArXiv external ID make cluster"
    - "PyMuPDF xref-dedup within PDF + min-dim + max-aspect filters per Pitfall 7"
    - "ffmpeg stream-copy (-c copy) for lossless instant clip cuts (no re-encode)"
    - "subprocess.run with list args (no shell=True) — mitigates T-127-15 shell injection"
    - "License safety gate: CC-BY/BY-SA/BY-NC/BY-NC-SA accept; ND/TBD reject (D-12, Pitfall 8)"
    - "Defensive shared.config import (fallback to env var) for cross-plan compatibility with parallel Plan 02"

key-files:
  created:
    - "../rag-architecture-patterns/scripts/__init__.py"
    - "../rag-architecture-patterns/scripts/curate_corpus.py (481 lines)"
    - "../rag-architecture-patterns/scripts/seed_papers.json (10 anchor IDs)"
    - "../rag-architecture-patterns/scripts/extract_figures.py (356 lines)"
    - "../rag-architecture-patterns/scripts/cut_video_clips.py (289 lines)"
    - "../rag-architecture-patterns/scripts/video_sources.json (1 candidate clip)"
    - "../rag-architecture-patterns/scripts/README.md (160 lines)"
  modified:
    - "../rag-architecture-patterns/pyproject.toml (build-system + setuptools.packages + Pillow in [curation])"
    - "../rag-architecture-patterns/uv.lock (regenerated with Pillow 11.3.0)"

key-decisions:
  - "Anchor seed list locked at planning time per D-02 (RAG-literature topic): Lewis 2020 + 9 high-citation peers"
  - "Cluster expansion = references-then-citations per hop, capped at --max-papers (foundational over tangential)"
  - "Drop refs/cits without arXiv external ID per Open Question #2"
  - "Defensive S2 API key lookup: shared.config (Plan 02) → S2_API_KEY/SEMANTIC_SCHOLAR_API_KEY env → None (unauthenticated shared pool)"
  - "Filter thresholds (min-dim=200, max-aspect=5.0) per Pitfall 7 are CLI flags so Plan 05 can tune"
  - "Captions stay empty in figure manifest (Open Question #4) — manual fill in Plan 05 review"
  - "video_sources.json ships license=TBD_VERIFY_MANUALLY sentinel — script refuses cut until Plan 05 curator updates"
  - "Bundled pyproject.toml [build-system]+[tool.setuptools].packages fix into Task 1 (Rule 3 — flat-layout multi-top-level package discovery error blocked editable install + import-test verify step)"
  - "Pillow added to [curation] in Task 1 commit (one pyproject.toml + one uv.lock churn instead of two)"

duration: "7m 19s"
completed: "2026-04-25"
---

# Phase 127 Plan 03: Curation Scripts Summary

**Authored three throwaway curation scripts (arxiv-cluster crawler, PyMuPDF figure extractor, ffmpeg clip cutter) with --dry-run modes + CC-license safety gate, ready for Plan 04/05 to run against external services.**

## Performance

- **Duration:** 7m 19s
- **Started:** 2026-04-25T18:16:58Z
- **Completed:** 2026-04-25T18:24:17Z
- **Tasks:** 3 / 3
- **Files created:** 7 in companion repo (`scripts/`)
- **Files modified:** 2 in companion repo (`pyproject.toml`, `uv.lock`)
- **Lines added:** 1,346 (across 3 Python scripts + 2 JSON seeds + 1 README + pyproject delta)
- **Companion repo commits:** 3 atomic feat commits, all pushed to `origin/main`

## Accomplishments

- All three curation scripts ship with `--help` and `--dry-run` modes that exit 0 cleanly without any external side effects (only S2 reads happen, and even those are optional on dry-run).
- `arxiv.Client(delay_seconds=3.0, num_retries=5, page_size=100)` baked into `curate_corpus.py` — arXiv ToU compliance is a library-enforced default, not a comment in code (per Pitfall 2 silent-ban risk).
- `semanticscholar.SemanticScholar` wrapper with explicit exponential backoff (5s × 2^attempt, ≤5 retries) on 429s and transient errors (per Pitfall 3 shared-pool throttle).
- Reference-first citation graph traversal: foundational refs win over newer tangential citations when capping at `--max-papers`.
- Non-arXiv refs/cits dropped per Open Question #2 — only papers with `externalIds.ArXiv` enter the cluster.
- PyMuPDF figure extraction filters all three Pitfall 7 noise sources: xref dedup within PDF (decorative reuse), min-dim 200 (page numbers/icons), max-aspect 5.0 (separator bars).
- True pixel dimensions read via PIL — PyMuPDF's bbox is page coords, not pixel coords (subtle bug avoided).
- Captions intentionally left empty (Open Question #4) — manual Plan 05 curator pass.
- `cut_video_clips.py` license safety gate refuses 5 sentinels: `TBD_VERIFY_MANUALLY`, `CC-BY-ND`, `CC-BY-ND-4.0`, `CC-BY-NC-ND`, `CC-BY-NC-ND-4.0`. Acceptable set: `CC-BY`, `CC-BY-SA`, `CC-BY-NC`, `CC-BY-NC-SA` (each with `-4.0` variants).
- `subprocess.run(['ffmpeg', ...], check=True, capture_output=True)` — list args, no `shell=True`, paths resolved via `Path().resolve()` before subprocess (mitigates T-127-15 shell injection).
- `scripts/README.md` documents the 5-step manual license verification protocol with an explicit accept/reject table.

## Final CLI Surface (per output requirement)

### `curate_corpus.py`

| Flag                  | Default                            | Purpose                                 |
| --------------------- | ---------------------------------- | --------------------------------------- |
| `--dry-run`           | off                                | Plan only; no PDF downloads             |
| `--seeds`             | `scripts/seed_papers.json`         | Anchor arXiv ID JSON                    |
| `--output`            | `dataset/papers/`                  | PDF download dir                        |
| `--max-papers`        | `100`                              | Cluster size cap                        |
| `--hops`              | `2`                                | Citation graph hops (1=seeds, 2=+refs/cits, 3=+1) |
| `--output-manifest`   | `dataset/manifests/papers.json`    | Manifest path                           |
| `--log-level`         | `INFO`                             | Logging verbosity                       |

### `extract_figures.py`

| Flag                  | Default                            | Purpose                                 |
| --------------------- | ---------------------------------- | --------------------------------------- |
| `--pdf` / `--all`     | (mutex required)                   | Single-PDF or batch mode                |
| `--out`               | `dataset/images/`                  | Figure file dir                         |
| `--manifest`          | `dataset/manifests/figures.json`   | Manifest path                           |
| `--min-dim`           | `200`                              | Min width AND height in px (Pitfall 7)  |
| `--max-aspect-ratio`  | `5.0`                              | Reject if max(w/h, h/w) > N (Pitfall 7) |
| `--dry-run`           | off                                | Print would-be extraction; write nothing|
| `--log-level`         | `INFO`                             | Logging verbosity                       |

### `cut_video_clips.py`

| Flag                  | Default                            | Purpose                                 |
| --------------------- | ---------------------------------- | --------------------------------------- |
| `--sources`           | `scripts/video_sources.json`       | Source-clip JSON                        |
| `--out`               | `dataset/videos/`                  | Cut-clip dir                            |
| `--manifest`          | `dataset/manifests/videos.json`    | Manifest path                           |
| `--dry-run`           | off                                | Print ffmpeg commands; don't run them   |
| `--log-level`         | `INFO`                             | Logging verbosity                       |

## Task Commits

Each task is its own atomic commit in the companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`), pushed to `origin/main`:

1. **Task 1: scripts/curate_corpus.py + seed_papers.json + __init__.py** — `4dc09a3`
   (also bundled the pyproject `[build-system]` + `[tool.setuptools]` packages fix and the `Pillow` extras bump for Task 2 — see deviation 1 below)
2. **Task 2: scripts/extract_figures.py** — `6bd771e`
3. **Task 3: scripts/cut_video_clips.py + video_sources.json + scripts/README.md** — `5dea1e9`

Plan 02 ran in parallel and committed `a00aaf9`, `d766773`, `859c8da` on the same branch — neither plan touched files owned by the other (clean disjoint subdirs: `scripts/*` vs `shared/*`/`tests/*`). The interleaved log:

```
5dea1e9 feat(127-03): cut_video_clips.py + video_sources.json + README.md   <- Plan 03 Task 3
859c8da test(127-02): smoke test + REPO-01/02/04/06 trace tests             <- Plan 02
6bd771e feat(127-03): extract_figures.py                                    <- Plan 03 Task 2
d766773 feat(127-02): shared.llm + shared.embeddings + shared.loader + shared.display  <- Plan 02
4dc09a3 feat(127-03): curate_corpus.py + seed_papers.json + __init__.py     <- Plan 03 Task 1
a00aaf9 feat(127-02): shared.config + shared.pricing + shared.cost_tracker  <- Plan 02
```

## Dry-Run Smoke Result (per output requirement)

`python scripts/curate_corpus.py --dry-run --seeds scripts/seed_papers.json --max-papers 3 --hops 1` ran in ~0.3s and printed:

```
Loaded 10 seeds from scripts/seed_papers.json
No Semantic Scholar API key (S2_API_KEY). Using shared pool — expect 429s on bursts; OK for ≤3k calls (per Pitfall 3).
Expanding cluster: hops=1, max_papers=3 (this hits Semantic Scholar)
... (S2 calls failed in this sandbox with the SOCKS-proxy `socksio` quirk; defensive path kept seeds in cluster) ...

=== Cluster: 3 papers ===
  2005.11401  (????)  [seed]  (unknown title)
  2410.05779  (????)  [seed]  (unknown title)
  2404.16130  (????)  [seed]  (unknown title)

Counts: seeds=10  cluster_size=3
S2 calls: 0    arXiv calls (download phase): 3
Estimated wall time for full run: ~9s (0.1m)

[DRY-RUN] Skipping PDF downloads. Re-run without --dry-run to fetch.
```

The script exited 0 cleanly. The S2 SOCKS-proxy warning is a sandbox-only artefact (Plan 04 will run on a normal dev box where S2 reaches will succeed). The defensive cluster-build path keeps seeds even when S2 lookup fails, so Plan 04 can still drive an arXiv-only fetch if S2 happens to be down.

`python scripts/cut_video_clips.py --dry-run` correctly REFUSED the single TBD entry:

```
[REFUSED] neurips2020_lewis_rag_clip: License not verified or is ND-restricted. Refusing to cut clip
neurips2020_lewis_rag_clip. Update license field in scripts/video_sources.json after manual verification
(acceptable: CC-BY, CC-BY-SA, CC-BY-NC, CC-BY-NC-SA per 127-RESEARCH.md Pitfall 8).

=== Cut Summary ===
Sources: 1   Cut: 0   Refused: 1
[DRY-RUN] No clips written, manifest not updated.
```

That refusal IS the safety gate working as designed — Plan 05 must verify and update the license before this script will cut anything.

## Estimated Total Wall Time for Full Curation Run (per output requirement)

Driven entirely by arXiv's mandatory 3s/request gap (per Pitfall 2). With `--max-papers 100 --hops 2`:

- **Semantic Scholar phase:** ~3-5 calls per seed × 10 seeds = ~30-50 calls. With API key: ~30s. Without key: ~30s nominal but 429-subject; backoff could push to ~60s on the worst burst.
- **arXiv download phase:** 100 papers × 3s minimum delay = **300s minimum just for the rate gate**. Real per-PDF download time on a typical home connection is 1-3s per ~1MB PDF, so the rate gate dominates: total ≈ **6 minutes** wall time for 100 PDFs.
- **Figure extraction:** PyMuPDF on 100 PDFs ≈ 10-30s on a modern laptop (CPU-bound, no network).
- **Video cuts:** ffmpeg stream-copy on 1-2 30s clips ≈ <2s total (instant — no re-encode).

**Total Plan 04 + Plan 05 wall time:** ≈ **7-10 minutes** for the full ~100-paper corpus + figures + video clips, dominated by the arXiv 3s rate gate. Plan 04 should validate this empirically.

## Decisions Made

- **Defensive `shared.config` import.** `_get_s2_api_key()` tries `from shared.config import settings`, falls back to `S2_API_KEY` / `SEMANTIC_SCHOLAR_API_KEY` env vars, then to `None`. This works whether Plan 02 lands first, second, or fails — and the unauthenticated path is fine for Plan 04's ≤3k S2 calls per Pitfall 3.
- **Empty captions, by design.** Per Open Question #4 in research, automatic caption extraction from PDF figures is unreliable (the surrounding text is laid out per-column, not per-figure). The `caption: ""` field is a manual-fill slot for Plan 05's curator review.
- **License safety gate AT THE SOURCE.** `cut_video_clips.py` refuses BEFORE invoking ffmpeg, not after. The script exits 1 if any clip was refused — Plan 05's review loop can read that exit code to know "you have unverified clips".
- **Internal-only `source_file_local_path` stripped from manifest.** The local download path is private to the curator's machine; `dataset/manifests/videos.json` ships only the public-safe fields.
- **Filter thresholds as CLI flags, not constants.** `--min-dim` and `--max-aspect-ratio` default to the Pitfall 7 starting values (200 / 5.0) but Plan 05 can tune per-PDF via the flag if a paper has unusually small or wide figures.

## Deviations from Plan

The plan was executed exactly as written for the file contents. One deviation affected **commit packaging** — auto-fixed under Rule 3:

### Auto-fixed Issues

**1. [Rule 3 - Blocking] pyproject.toml needed `[build-system]` + `[tool.setuptools]` packages list — bundled into Task 1 commit**

- **Found during:** Task 1 verify (`uv pip install -e ".[curation]"`)
- **Issue:** The companion repo's `pyproject.toml` from Plan 01 had no `[build-system]` block, so setuptools defaulted to flat-layout auto-discovery. With `shared/`, `dataset/`, `evaluation/`, `tier-{1..5}/`, `scripts/` all at the top level, setuptools refused to build:

  > error: Multiple top-level packages discovered in a flat-layout: ['shared', 'dataset', 'evaluation'].

  Without an editable install, Task 1's verify step `python -c "import scripts.curate_corpus as m..."` fails on `ModuleNotFoundError`. This blocks the verify automation chain.

- **Fix:** Added `[build-system]` (`setuptools>=68`, `wheel`, `setuptools.build_meta`) and `[tool.setuptools] packages = ["shared", "scripts"]` to pyproject.toml. The other top-level dirs (`dataset/`, `evaluation/`, `tier-*/`) are NOT Python packages, so the explicit list is correct. Bundled with Task 1's commit because Task 1's verify needs the editable install to work.
- **Files affected:** `pyproject.toml` (additive only — no existing field changed).
- **Verification:** `uv pip install -e ".[shared,curation]"` resolved 40 packages and built `rag-architecture-patterns==0.1.0` cleanly; `python -c "import scripts.curate_corpus..."` succeeded.
- **Forward guidance:** Phases 128-130 (tier-N implementations) inherit this packages list. If a tier ever needs a new top-level Python package, append it to `[tool.setuptools].packages`.

**2. [Rule 3 - Bundling] `Pillow` extras bump packaged with Task 1, not Task 2**

- **Found during:** Task 2 planning
- **Issue:** Task 2 instructs both adding `Pillow` to `[curation]` AND running `uv lock`. Doing this in Task 2 would touch `pyproject.toml` and `uv.lock` again — a second churn for files already touched in Task 1's pyproject build-system fix. Cleaner to land both pyproject changes once.
- **Fix:** Added `Pillow>=10,<12` to `[curation]` in Task 1's pyproject edit; ran `uv lock` once; committed both with Task 1. Task 2 only commits `scripts/extract_figures.py`.
- **Files affected:** Same files (`pyproject.toml`, `uv.lock`) — just shifted commits.
- **Verification:** `grep -q 'Pillow' pyproject.toml` (Task 2's verify check) passed at Task 2 commit time.
- **Forward guidance:** None — purely commit packaging.

---

**Total deviations:** 2 auto-fixed (both Rule 3, both commit packaging / build-config; zero changes to plan file contents or behavior).
**Impact on plan:** Plan content delivered exactly as specified.

## Issues Encountered

- **Sandbox SOCKS-proxy quirk in S2 dry-run.** `python scripts/curate_corpus.py --dry-run` in this sandbox emitted `Using SOCKS proxy, but the 'socksio' package is not installed`. This is a sandbox-only environmental artefact (not a script bug) — the defensive cluster-build path correctly kept seeds in the cluster despite the failed S2 lookups. Plan 04 will run on a normal dev box where S2 reaches will succeed. Documented in the "Dry-Run Smoke Result" section above so Plan 04 doesn't chase a phantom bug.
- **No 404s on seed arXiv IDs.** All 10 anchor IDs in `scripts/seed_papers.json` were locked at planning time (2026-04-25) per the plan's note. No swap needed in this dry-run pass; Plan 04 will validate live against `arxiv.Search(id_list=...)` before mass download.

## User Setup Required

None for Plan 03 — code-only deliverables. Plan 04/05 surface their own setup needs:

- **Plan 04:** Optional `S2_API_KEY` in `.env` if curation hits 429s (free key from <https://semanticscholar.org/product/api>).
- **Plan 05:** Manual download of source talk videos to a local mp4/webm; manual CC license verification at the source talk page; update `scripts/video_sources.json` per the protocol in `scripts/README.md`.

## Next Phase Readiness

- **Plan 04 (Corpus download) — READY.** All three required scripts exist with `--help` and `--dry-run`. Plan 04 starts by validating the 10 seed arxiv IDs against `arxiv.Search(id_list=...)`, then runs `python scripts/curate_corpus.py --max-papers 100 --hops 2`. Estimated wall time: 7-10 minutes including S2 graph walk.
- **Plan 05 (Figure extraction + Video cuts) — READY.** `extract_figures.py` is batch-ready (`--all dataset/papers/`); `cut_video_clips.py` will refuse the single TBD entry until the curator manually verifies the license at SlidesLive (or wherever the source talk lives) and updates `scripts/video_sources.json`. The script's exit-code-1-on-refusal makes it CI-friendly.
- **No blockers introduced by this plan.**

## Self-Check: PASSED

- [x] `../rag-architecture-patterns/scripts/__init__.py` exists (empty package marker)
- [x] `../rag-architecture-patterns/scripts/curate_corpus.py` exists (481 lines)
- [x] `../rag-architecture-patterns/scripts/seed_papers.json` exists with 10 entries; first is `2005.11401`
- [x] `../rag-architecture-patterns/scripts/extract_figures.py` exists (356 lines)
- [x] `../rag-architecture-patterns/scripts/cut_video_clips.py` exists (289 lines)
- [x] `../rag-architecture-patterns/scripts/video_sources.json` exists with 1 entry; license=`TBD_VERIFY_MANUALLY`
- [x] `../rag-architecture-patterns/scripts/README.md` exists (160 lines) with `CC-BY-ND` + `REJECT` markers
- [x] `pyproject.toml` contains `Pillow>=10,<12` in `[curation]`
- [x] `pyproject.toml` contains `[build-system]` + `[tool.setuptools]` packages list
- [x] `uv.lock` regenerated with `pillow==11.3.0`
- [x] All three scripts respond to `--help` (exit 0)
- [x] `scripts.curate_corpus` exposes `main`, `expand_cluster`, `download_papers`
- [x] `scripts.extract_figures` exposes `main`, `extract_figures`
- [x] `scripts.cut_video_clips` exposes `main`, `cut_clip`
- [x] `arxiv.Client(... delay_seconds=3.0 ...)` literally present in `curate_corpus.py` (Pitfall 2)
- [x] `from semanticscholar import` literally present in `curate_corpus.py` (Pitfall 3)
- [x] `page.get_images` and `page.get_image_rects` and `extract_image` literally present in `extract_figures.py` (Pattern 3)
- [x] `ffmpeg` and `TBD_VERIFY_MANUALLY` and `CC-BY-ND` literally present in `cut_video_clips.py` (D-12, Pitfall 8)
- [x] `cut_video_clips.py --dry-run` REFUSES the TBD entry with the expected error message
- [x] Three commits exist on companion repo `main` and pushed to origin: `4dc09a3`, `6bd771e`, `5dea1e9`
- [x] No untracked files left in `scripts/`

---
*Phase: 127-repository-skeleton-enterprise-dataset*
*Completed: 2026-04-25*
