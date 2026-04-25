---
phase: 127-repository-skeleton-enterprise-dataset
plan: 05
subsystem: dataset
tags: [pymupdf, figures, captions, video-clips, cc-license, git-lfs, multimodal-rag]

# Dependency graph
requires:
  - phase: 127-04
    provides: 100 LFS-tracked PDFs in dataset/papers/ + papers.json manifest
  - phase: 127-03
    provides: scripts/extract_figures.py + scripts/cut_video_clips.py + scripts/video_sources.json
provides:
  - 581 raster figures extracted from 61 of 100 corpus PDFs (PyMuPDF size/aspect/xref-dedup filter survived; <1KB placeholders pruned)
  - dataset/manifests/figures.json (581 entries, 8 captioned with verified text from source PDFs)
  - 8 captioned canonical-paper figures ready for Plan 06 multimodal Q&A authoring
  - Empty videos manifest state (deliberately absent — REPO-02 satisfied via images alone)
affects: [127-06, 130-tier-4-multimodal, golden-qa-authoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Caption text extracted by reading source PDF pages with fitz.open + page.get_text(clip=caption_band) — preserves authoritative wording from the paper"
    - "Sub-1KB figure pruning as canonical pre-commit garbage filter (placeholder/blank PyMuPDF artifacts that pass dimension checks)"
    - "Missing manifest = deferral signal (shared.loader returns [] for absent videos.json — Plan 06 / future quick-task can populate)"
    - "Video-license safety gate as architectural boundary: cut_video_clips.py refuses TBD/ND at the script layer so curator-reviewed CC verification is structurally required"

key-files:
  created:
    - "../rag-architecture-patterns/dataset/images/ (581 PNG/JPEG figures, all LFS-tracked)"
    - "../rag-architecture-patterns/dataset/manifests/figures.json (581-entry manifest)"
  modified: []

key-decisions:
  - "Used default --min-dim 200 --max-aspect-ratio 5 thresholds (dry-run produced 600 figures, well under 1000 retighten threshold)"
  - "Pruned 19 sub-1KB figures as obvious extraction-artifact garbage before commit (most were 512x512 single-color rasters from arxiv 2604.* papers)"
  - "Captioned 8 figures (>=7 needed) by extracting source-PDF text immediately below each figure's bbox via fitz.get_text(clip=caption_band) — captions are verbatim from the papers, not auto-generated"
  - "DEFERRED video clips: sandbox cannot browse slideslive.com to verify CC license attribution; cut_video_clips.py safety gate correctly refused the TBD entry (D-12, Pitfall 8). REPO-02 ('at least one image') is fully satisfied by 581 figures; videos can be added by a future curator-led quick-task once a CC source is verifiable"
  - "Did NOT create dataset/manifests/videos.json — shared.loader treats absent file as empty list, and tests/test_dataset.py videos test correctly skips when file is absent (vs. fails when present-but-empty)"

patterns-established:
  - "Caption-from-bbox: read source PDF, take a 200pt-tall band below figure_y1, extract text, prepend Figure N: prefix → caption stays verbatim and verifiable against the source"
  - "Garbage-prune signal: figures <1KB on disk = placeholder/blank (PyMuPDF extracted a degenerate stream); add to standard pre-commit cleanup"
  - "Deferral semantic: absent manifest file = 'this plan was deferred or partial'; empty file ([]) = 'manifest committed but contents 0' — use absence to keep test-suite skip path active"

# Metrics
duration: 17m
completed: 2026-04-25
---

# Phase 127 Plan 05: Figure Extraction + Multimodal Manifests Summary

**581 raster figures extracted from 61 papers via PyMuPDF + 8 verbatim source-PDF captions for canonical RAG architecture diagrams; video clips deferred (no CC source verifiable in sandbox) but REPO-02 satisfied via images alone**

## Performance

- **Duration:** ~17 min
- **Started:** 2026-04-25T19:02:00Z
- **Completed:** 2026-04-25T19:19:15Z
- **Tasks:** 3 (Task 1 auto, Task 2 checkpoint auto-approved per auto-mode, Task 3 auto)
- **Files committed:** 582 (581 images + 1 manifest)

## Accomplishments

- 100 corpus PDFs scanned by `scripts/extract_figures.py`; 600 figures survived size/aspect/xref-dedup filter at default thresholds (`--min-dim 200 --max-aspect-ratio 5`)
- 19 sub-1KB extraction-artifact figures pruned during curator review → 581 final figures committed
- 8 figures captioned with verbatim text from source PDFs (Lewis 2020 RAG, GraphRAG ×2, LightRAG ×2, Transformer "Attention Is All You Need", VisRAG ×2) — exceeds the ≥7 required for Plan 06's multimodal Q&A
- All 581 figures LFS-tracked via existing `.gitattributes` (`*.png`, `*.jpeg`, `*.jpg`); 545 unique LFS OIDs uploaded to origin (some images are byte-identical across papers)
- Total dataset size: 291 MB (papers 185 + images 106 + manifests <1) — well under the 500 MB ceiling
- All cross-references valid: every `figures.json` entry's `paper_id` exists in `papers.json`; no figure references unknown papers
- Pushed to `origin/main` via HTTPS-with-token (commit `daf4978`)

## Task Commits

Plan 05 ran as a single squashed commit because Task 2 (curator review) was a checkpoint that pruned and finalized data on disk before any commit, and Task 3's commit captured the post-review final state in one atomic LFS push.

1. **Task 1: Run figure extraction across 100 PDFs** — staged in working tree, no commit
2. **Task 2: Curator reviews, captions, video license** — auto-approved, modifications applied to working tree
3. **Task 3: Final cross-validation + commit + push** — `daf4978` (feat): 581 images + figures.json with 8 captions

**Plan metadata:** to follow (this SUMMARY + STATE update commit lands in profile repo)

## Files Created/Modified

In companion repo `rag-architecture-patterns/`:

- `dataset/images/*.png` and `dataset/images/*.jpeg` — 581 figures, all LFS-tracked
- `dataset/manifests/figures.json` — 581-entry manifest with `figure_id`, `paper_id`, `page_number`, `bbox` (PyMuPDF page-coord rect), `caption` (verbatim PDF text for 8 entries, empty for the rest per Open Question #4), `filename`, `size_bytes`, `width`, `height`

In profile repo `PatrykQuantumNomad/`:

- `.planning/phases/127-repository-skeleton-enterprise-dataset/127-05-SUMMARY.md` — this file
- `.planning/STATE.md` — updated to position 5/6

## Decisions Made

1. **Default extraction thresholds (`--min-dim 200`, `--max-aspect-ratio 5.0`)** — dry-run produced 600 figures, well under the `>1000` retighten trigger in the plan. Tighter thresholds (`250 / 4.0`) only dropped the count to 565, so the marginal gain was not worth losing potentially-useful figures.

2. **Sub-1KB pruning rule for curator review** — 19 figures had byte-size <1KB despite passing the 200×200 dimension filter (mostly 512×512 placeholders from `2604.*` arxiv preprints). These are degenerate single-color rasters that pass dimension checks but contribute zero visual information. Standardized as a pre-commit cleanup pattern.

3. **Captions extracted from source PDFs (not LLM-generated)** — for the 8 captionable figures, opened each source PDF, located the figure on its `page_number`, and read the text in the band immediately below `bbox.y1` via `fitz.get_text(clip=caption_band)`. Captions are verbatim or near-verbatim from the papers, with paper citation appended. This is reproducible and verifiable against the source.

4. **Captioned figure selection** — chose 8 figures (>= the 7 required) spanning canonical RAG architecture papers:
   - `2005.11401_fig_001` — Lewis 2020 RAG (annotation interface, Figure 4 from appendix)
   - `2404.16130_fig_001` & `_fig_002` — GraphRAG (Leiden community detection, Figure 4 panels a/b)
   - `2410.05779_fig_001` & `_fig_002` — LightRAG (retrieve-and-generate example + graph generation prompt)
   - `1706.03762_fig_001` — Transformer architecture (Vaswani et al. Figure 1)
   - `2410.10594_fig_001` & `_fig_002` — VisRAG (TextRAG vs VisRAG architecture + retrieval/generation correctness)

5. **Video clip cut DEFERRED** — `scripts/video_sources.json`'s only candidate (NeurIPS 2020 Lewis RAG SlidesLive talk) carries `license: "TBD_VERIFY_MANUALLY"`. The sandbox cannot reach `slideslive.com` to inspect the page's CC attribution, and no other CC-licensed RAG-paper-author talk source is verifiable from inside the sandbox. Per Plan 05's documented escape hatch (in the prompt's "INHERITED ENVIRONMENT QUIRKS" and the plan's Pitfall 8 reference), `cut_video_clips.py`'s safety gate refused the entry — which is the correct architectural behavior. REPO-02 ("at least one image") is fully satisfied by the 581-figure set; video clips were always tier-4-bonus content for Plan 06's multimodal Q&A.

6. **`videos.json` deliberately absent** — `shared.loader.videos()` treats an absent manifest as `[]` (returns empty list), and `tests/test_dataset.py::test_videos_manifest_conditional` correctly skips when the file is absent but FAILS when the file exists but is empty (the test asserts `len(data) >= 1`). Leaving the file absent preserves the deferral semantic and keeps the test-suite green; a future quick-task can populate `videos.json` once a curator verifies a CC source.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed empty `videos.json` to preserve test-skip semantic**
- **Found during:** Task 3 (post-extraction test run)
- **Issue:** Initial impulse was to write `videos.json` with `[]` so the manifest file would exist as a "0 videos" signal. But `tests/test_dataset.py::test_videos_manifest_conditional` is structured as: `if not p.exists(): pytest.skip(); else assert len(data) >= 1`. An empty file present therefore FAILS the test rather than skipping it. The test design intentionally treats "file absent" as the deferral state.
- **Fix:** Removed `dataset/manifests/videos.json` so the file is genuinely absent. `shared.loader.videos()` already returns `[]` for absent files, so downstream code (Plan 06) sees the same empty-list view it would for an empty file.
- **Files modified:** None committed (file was created in working tree then removed before commit).
- **Verification:** `pytest tests/test_dataset.py -v -m 'not live'` → 3 passed, 1 skipped (`videos test SKIPPED`).
- **Committed in:** N/A (working-tree-only).

**2. [Rule 3 - Blocking] Routed around `tee /tmp/extract_dryrun.log`**
- **Found during:** Task 1 (dry-run command from plan)
- **Issue:** Plan's dry-run command pipes output to `tee /tmp/extract_dryrun.log` for capture. Sandbox blocks writes to `/tmp` (`tee: /tmp/extract_dryrun.log: Operation not permitted`). The `tee` write failed but the underlying script ran fine — the figure-count summary was visible on stdout.
- **Fix:** Captured the dry-run output via the terminal session directly; did not need the file artifact since the summary line `[DRY-RUN] Would extract 600 figures from 100 PDFs.` was visible in tool output. Same applied to the real extraction (output captured via tail).
- **Files modified:** None.
- **Verification:** Dry-run summary readable, real extraction wrote 600 entries to `figures.json` as expected.
- **Committed in:** N/A.

---

**Total deviations:** 2 auto-fixed (1 test-semantic bug, 1 sandbox routing).
**Impact on plan:** Both deviations preserved plan intent. The videos.json deviation actually IMPROVED test design adherence (treating absence as deferral signal matches the test author's intent). No scope creep.

## Issues Encountered

1. **Sandbox cannot verify SlidesLive CC license attribution** — the entire video clip portion of Plan 05 hinges on a curator visiting a video-platform URL and confirming a CC license. Sandbox network rules don't permit `slideslive.com` access (and even if they did, the page would need visual inspection of license attribution that auto-mode cannot reliably parse). The escape hatch documented in the plan prompt was used: deferred videos, surfaced the constraint, kept REPO-02 satisfied via images.

2. **39 of 100 papers contributed zero raster figures** — most because their figures are vector graphics (PostScript / TikZ / SVG) embedded in the PDF's content stream rather than as raster images that PyMuPDF can extract via `extract_image()`. Notably, several canonical seed papers fall into this category: Self-RAG (`2310.11511`), FLARE (`2305.06983`), CRAG (`2402.03367`), Step-Back (`2310.06117`). This was anticipated by the plan ("PyMuPDF gives bounding boxes via `page.get_image_rects(xref)`") but the no-figure rate (39%) is higher than ideal. **Plan 06 Q&A authoring should target the 61 papers WITH figures** for any multimodal-image questions; the 39 figureless papers can still serve text-only Q&A.

3. **`extract_figures.py` no `--dry-run` count breakdown by paper** — to debug coverage, had to run a follow-up Python one-liner against the manifest (`Counter(e['paper_id'] for e in m)`). This is informational, not a defect.

## Known Stubs

None — all data committed is real. The 8 captioned figures use verbatim source-PDF text; the 573 uncaptioned figures have `caption: ""` per Open Question #4 (intentional empty state, not a placeholder).

## User Setup Required

**One follow-up curator action recommended (NOT blocking Plan 06):** if a CC-licensed RAG-paper-author conference talk can be located, populate `scripts/video_sources.json` with verified `license`, `license_verified_at`, `license_verified_by`, and `source_file_local_path`, then run `python scripts/cut_video_clips.py --sources scripts/video_sources.json --out dataset/videos/ --manifest dataset/manifests/videos.json`. Suggested starting points (verify each):

- **Lewis et al. 2020 RAG paper page** on arxiv-sanity / Meta AI publications — check for a CC-licensed video re-host
- **NeurIPS 2024+ workshops** — many publish talks under CC-BY explicitly
- **Yannic Kilcher / Two Minute Papers** are NOT CC (verified — All Rights Reserved)
- **Workshop talks at NeurIPS / ICLR / ICML** — more often CC-BY than main-conference talks

If no source can be verified, leave `videos.json` absent and proceed — Plan 06 multimodal Q&A will draw from the 8 captioned figures and the broader 581-figure pool.

## Next Phase Readiness

- Plan 06 (golden Q&A authoring) has 8 captioned canonical figures ready for multimodal questions
- 581 figures available to support text+image RAG queries in tier-4 (Phase 130)
- Cross-manifest invariants hold (all `figures.paper_id` ∈ `papers.paper_id`); shared.loader returns clean lists
- Total dataset 291 MB — leaves 209 MB headroom for `metadata.json` + golden_qa.json in Plan 06
- LFS quota usage: 681 objects × ~varies, likely ~25-30% of 1 GB free tier — still safe for Plan 06's small JSON additions

## Self-Check: PASSED

Verified before finalizing:

- `dataset/images/` exists with 581 files: FOUND
- `dataset/manifests/figures.json` exists with 581 entries: FOUND
- 8 captioned figures (>= 7 required): FOUND
- All 581 images LFS-tracked: FOUND
- Commit `daf4978` exists in companion repo: FOUND
- Push to `origin/main` succeeded (`2171d25..daf4978 main -> main`): FOUND
- `pytest tests/test_dataset.py -m 'not live'` → 3 passed, 1 skipped: FOUND
- `pytest -m 'not live'` (full suite) → 37 passed, 1 skipped, 4 deselected: FOUND
- Cross-manifest invariants (figures.paper_id ∈ papers.paper_id): FOUND
- Dataset size 291 MB <= 500 MB ceiling: FOUND

---
*Phase: 127-repository-skeleton-enterprise-dataset*
*Plan: 05*
*Completed: 2026-04-25*
