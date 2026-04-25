---
gsd_state_version: 1.0
milestone: v1.22
milestone_name: RAG Architecture Patterns
status: executing
stopped_at: Plan 127-06 offline portion complete (companion repo commits 92ec4b5/1df1821/9eea8e0 pushed to origin/main — golden_qa.json with 30 entries, metadata.json with 100p/581f/0v/290MB stats, finalized README with blog link); LIVE SMOKE TEST PENDING — GEMINI_API_KEY not in executor env; user runs locally to close REPO-03 gate
last_updated: "2026-04-25T19:31:25Z"
last_activity: 2026-04-25
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 6
  completed_plans: 6
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** Phase 127 - Repository Skeleton + Enterprise Dataset

## Current Position

Phase: 127 of 134 (Repository Skeleton + Enterprise Dataset)
Plan: 6 of 6 in current phase complete (offline portion); live smoke gate pending user
Status: Awaiting live smoke test (REPO-03)
Last activity: 2026-04-25

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 300 (across 21 milestones)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 through v1.17 | 1-101 | 231 | 831 | 2026-02-11 to 2026-03-15 |
| v1.18 AI Landscape Explorer | 102-110 | 25 | 40 | 2026-03-26 to 2026-03-27 |
| v1.19 Claude Code Guide Refresh | 111-116 | 25 | 34 | 2026-04-12 |
| v1.20 Dark Code Blog Post | 117-121 | 8 | 25 | 2026-04-14 |
| v1.21 SEO Audit Fixes | 122-126 | 13 | 21 | 2026-04-16 to 2026-04-17 |
| v1.22 RAG Architecture Patterns | 127-134 | TBD | 31 | in progress |
| Phase 127 P01 | 219 | 3 tasks | 18 files |
| Phase 127 P02 | ~10min | 3 tasks | 14 files (1252 LOC across shared/ + tests/) |
| Phase 127 P03 | 7m 19s | 3 tasks | 9 files |
| Phase 127 P04 | 14m | 3 tasks | 101 files |
| Phase 127 P05 | 17m | 3 tasks | 582 files |
| Phase 127 P06 | 14m | 3 tasks | 6 files (golden_qa.json + metadata.json + 2 tests + 1 script + README) |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Plan 127-01 added:

- Tier-N pyproject extras stub as `[shared]` only; concrete tier deps land in Phases 128-130
- `tier-N/requirements.txt` mirrors parent extras via `-e ..[tier-N]` (single source of truth in pyproject)
- `google-genai` pinned (NOT deprecated `google-generativeai` EOL 2025-08-31)
- LFS lock-verify disabled per-remote due to sandbox TLS limitation; LFS object storage unaffected
- GitHub API access uses `curl + Authorization: token $(gh auth token)` because `gh` subcommands fail in sandbox

Plan 127-02 added:

- Lazy `get_settings()` factory pattern (lru_cache) — `Settings()` is NEVER instantiated at module import; `Field(..., alias="GEMINI_API_KEY")` stays REQUIRED (Pattern 5) but ValidationError only raised when callers actually need keys (preserves "validation contract" without weakening to `default=SecretStr("")`)
- `DatasetLoader` deliberately decoupled from `get_settings()` — defaults to `Path("dataset")` so contributors can inspect manifests offline without a Gemini key
- Construction-time timestamp captured in `CostTracker.__init__` so repeated `persist()` calls overwrite the same `{tier}-{timestamp}.json` file (idempotent per-run artifact)
- `uv sync --extra ... --group ...` chosen over `uv pip install --group ...` — uv 0.6.3 doesn't accept `--group` on `pip install`
- Conditional `pytest.skip` pattern for staged-dataset trace tests — `tests/test_dataset.py` lands once and passes at empty/partial/full wave boundaries; Plan 06 extends in place
- T-127-08 lockfile guard added to `tests/test_tier_requirements.py` — fails if `google-generativeai` (deprecated) ever returns to `uv.lock`
- Live smoke test deferred to Plan 06 — `.env` was absent in Plan 02 auto-mode run, so 3 `@live` tests committed but unrun; Plan 06 has the canonical live-smoke checkpoint
- Plan 127-03: arxiv.Client(delay_seconds=3.0) and semanticscholar wrapper baked into curate_corpus.py — never custom requests loops (Pitfall 2/3)
- Plan 127-03: cut_video_clips.py refuses TBD/ND licenses at the safety gate (D-12, Pitfall 8); exits 1 on any refusal
- Plan 127-03: pyproject [build-system] + [tool.setuptools] packages=[shared,scripts] required for flat-layout editable install (Rule 3 fix)
- Plan 127-04: GIT_SSL_CAINFO=/etc/ssl/cert.pem persisted as http.sslCAInfo local-config — sandbox keychain access blocked git-lfs Go runtime cert resolution; CA-bundle redirect preserves TLS verification (no weakening)
- Plan 127-04: Curator approved 100-paper cluster as-previewed (no swaps); Sleeper Agents (2401.05566) explicitly retained per off-topic-but-approved decision
- Plan 127-05: 581 figures extracted via PyMuPDF default thresholds (--min-dim 200 --max-aspect-ratio 5); 19 sub-1KB extraction-artifact placeholders pruned during curator review
- Plan 127-05: 8 figure captions extracted verbatim from source PDFs via fitz.get_text(clip=caption_band) — covers Lewis 2020 RAG, GraphRAG x2, LightRAG x2, Transformer, VisRAG x2 (>=7 needed for Plan 06)
- Plan 127-05: Video clip cut DEFERRED — sandbox cannot verify slideslive.com CC license; cut_video_clips.py safety gate correctly refused TBD entry. REPO-02 satisfied via 581-image set; videos remain tier-4 bonus
- Plan 127-05: dataset/manifests/videos.json deliberately ABSENT (not empty []) — preserves test_videos_manifest_conditional skip path; shared.loader treats absent file as empty list
- Plan 127-05: 39 of 100 papers contributed zero raster figures (vector-graphics-only PDFs that PyMuPDF cannot rasterize) — Self-RAG, FLARE, CRAG, Step-Back among them; informs Plan 06 to target the 61 papers WITH figures for multimodal Q&A
- Plan 127-06: D-04 LOCKED 10/10/7/3 split adapted to shipped 10/10/10/0 — 3 video Q&A slots substituted with 3 multimodal extras (Sleeper Agents, Mixed Precision, Marcus 'Next Decade'); Plan-06-authored captions inline in question text; documented prominently in README + test_golden_qa.py + 127-06-SUMMARY.md
- Plan 127-06: build_metadata.py treats absent videos.json as [] (mirrors shared.loader semantics) so the aggregator stays wave-tolerant
- Plan 127-06: Live smoke test (REPO-03 gate) DEFERRED to user — GEMINI_API_KEY not in executor environment; smoke test code committed and verified (test_imports passes); 3 live tests skip gracefully via live_keys_ok fixture

### Pending Todos

None.

### Blockers/Concerns

- Phase 129 (Tier 3 LightRAG): Verify Python API against lightrag-hku v1.4.15 before implementation
- Phase 130 (Tier 4 RAG-Anything): Verify MinerU/LibreOffice requirements for PDF-only datasets
- Phase 130 (Tier 5 Agentic): Verify FileSearchTool + @function_tool coexistence in OpenAI Agents SDK
- Phase 127 (Plans 04/05): GitHub LFS quota for free tier still unverified — check `https://github.com/settings/billing` before bulk PDF push

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 010 | Correctness validation | 2026-02-26 | 9d20b42 | [010-correctness-validation](./quick/010-correctness-validation/) |
| 011 | EDA content correctness validation | 2026-02-26 | 958be19 | [011-eda-content-correctness-validation](./quick/011-eda-content-correctness-validation/) |
| 012 | Fix Snyk security scan vulnerabilities (npm audit + W007 secret redaction) | 2026-03-06 | ddf902c | [012-fix-snyk-security-scan-issue-on-gha-vali](./quick/012-fix-snyk-security-scan-issue-on-gha-vali/) |

## Session Continuity

Last session: 2026-04-25T19:31:25Z
Stopped at: Plan 127-06 offline portion complete (companion repo HEAD at 9eea8e0 — golden_qa.json + metadata.json + finalized README pushed to origin/main); LIVE SMOKE TEST PENDING (REPO-03 gate)
Resume file: .planning/phases/127-repository-skeleton-enterprise-dataset/127-06-SUMMARY.md
Next: User runs `pytest tests/smoke_test.py -m live` in the companion repo with GEMINI_API_KEY set. Expected: <5s wall time, ~$0.0001 cost, 3 live tests pass. Then run `/gsd:verify-phase 127` to formally close Phase 127. Plans 04+ depend on `scripts/*.py` from Plan 03 (already complete).
