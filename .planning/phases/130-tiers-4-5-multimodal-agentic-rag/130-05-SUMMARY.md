---
phase: 130-tiers-4-5-multimodal-agentic-rag
plan: 05
subsystem: tier-4-multimodal-readme-and-live-e2e
tags: [tier-4, raganything, mineru, readme, docker, live-e2e, sandbox-deferral, cost-surprise-gate, expected-output]
requirements_completed: [TIER-04, REPO-05]
dependency_graph:
  requires:
    - "130-03 (tier-4 query.py + main.py CLI + Dockerfile + rag.py factory refactor)"
    - "130-02 (build_rag + CostAdapter + ingest_pdfs + ingest_standalone_images)"
    - "129-07 (Tier 3 banner-first README pattern + smallest-by-size subset live-test convention)"
    - "128-02 (no per-tier tests/__init__.py — pytest rootdir basename uniqueness)"
  provides:
    - "tier-4-multimodal/README.md (202 LOC) — Section-0 banner + 9-section template + mandatory-Docker quickstart"
    - "tier-4-multimodal/expected_output.md (33 LOC skeleton) — Pattern 9 placeholder, captured by user's live run"
    - "tier-4-multimodal/tests/conftest.py (54 LOC) — tier4_live_keys_ok fixture + repo-root sys.path bootstrap"
    - "tier-4-multimodal/tests/test_tier4_e2e_live.py (~250 LOC) — @pytest.mark.live 3-paper + 5-image subset"
    - "tier-4-multimodal/ingest_pdfs.py (Rule 1 fix) — drop parser= kwarg that crashes raganything==1.2.10"
  affects:
    - "Phase 130 close-out (next: 130-06 Tier 5 live e2e wraps Wave 4)"
    - "Phase 131 (RAGAS evaluation) — Tier 4 multimodal slots become benchmarkable once user runs the live test"
tech_stack:
  added: []
  patterns:
    - "Section-0 [!WARNING] banner BEFORE title (Tier 3 / Phase 129-07 pattern extended to Tier 4 with MineRU + cost double warning)"
    - "Smallest-by-size paper subset for cost-bounded live tests (Phase 129-07 pattern → 3 papers for Tier 4 vs 2 for Tier 3)"
    - "Synthetic dataset_subset/ tree under tmp_path with symlinked images (NEW for Tier 4 — multimodal ingest needs both papers + figures.json)"
    - "Sandbox-bounded live-test deferral pattern (Phase 129-06 first-attempt precedent — kernel-level restriction beyond proxy/socksio reach)"
key_files:
  created:
    - "../rag-architecture-patterns/tier-4-multimodal/README.md (202 LOC)"
    - "../rag-architecture-patterns/tier-4-multimodal/expected_output.md (33 LOC, skeleton)"
    - "../rag-architecture-patterns/tier-4-multimodal/tests/conftest.py (54 LOC)"
    - "../rag-architecture-patterns/tier-4-multimodal/tests/test_tier4_e2e_live.py (~250 LOC)"
  modified:
    - "../rag-architecture-patterns/tier-4-multimodal/ingest_pdfs.py (+6/-1 LOC — Rule 1 fix: drop parser= kwarg)"
decisions:
  - "Live test EXECUTOR-DEFERRED to user (kernel-level sandbox restriction). MineRU's MKL/OpenMP runtime initializes shared-memory files in /tmp via ftruncate; sandbox kernel returns PermissionError before any Python-level env vars (OMP_NUM_THREADS=1, KMP_INIT_AT_FORK=FALSE, TMPDIR=$TMPDIR) take effect. This is an order of magnitude lower in the stack than the SOCKS5+socksio workaround that unblocked Phase 128-06 / 129-06 retry / 129-07. Network reachability was verified GREEN (httpx GET against openrouter.ai = 200, huggingface.co = 200) — the wall is OS-level, not network."
  - "Rule 1 fix discovered DURING the live test: ingest_pdfs.py was passing parser=\"mineru\" as a kwarg to rag.process_document_complete(), which forwards **kwargs through to MineruParser._run_mineru_command — that method raises TypeError on unexpected kwargs. Crashes EVERY ingest invocation on raganything==1.2.10 regardless of sandbox. Verified against inspect.signature(RAGAnything.process_document_complete). Fix preserves device= (which IS accepted; forwarded to mineru CLI -d flag). Without the live test attempt, this bug would have shipped to users."
  - "expected_output.md committed in SKELETON state (33 LOC with <fill at capture time> markers). Plan body's <interfaces> contract specified \"min_lines: 25\" and \"contains: Captured\" — both met (skeleton header carries 'Captured: <fill at capture time> (UTC)'). User's first successful local run will populate the skeleton; preserves Pattern 9's reproducibility-shape semantics."
  - "Test SUBSET_PAPERS=3 + SUBSET_IMAGES=5 (vs Tier 3's SUBSET_PAPERS=2). Tier 4 vision pass adds ~$0.05 floor regardless of paper count, so 3 papers stays in the ~$0.10-0.30 budget while exercising more entity edges. SUBSET_IMAGES=5 is the first 5 entries from figures.json (NOT smallest-by-size) — figure ordering is paper-grouped so first-N gets a coherent multi-figure context for the same source paper."
  - "Symlink-with-copy-fallback pattern for the synthetic dataset_subset/images/ tree (try os.symlink, except OSError fall back to shutil.copyfile) — works on macOS APFS (symlinks default), Linux ext4, and Docker overlayfs without filesystem-specific code paths."
  - "Test uses generic 'main contribution' question, NOT canned multimodal probe — smallest-3 paper subset is unlikely to contain Attention Is All You Need; canned probe would assert against papers not in the test corpus. Generic question still exercises the full hybrid graph traversal + multimodal entity surface."
  - "tier4_live_keys_ok matches Plan body's contract verbatim (vs Tier 3's tier3_live_keys_ok ALIAS pattern). Tier 4 has no prior fixture to alias around — clean greenfield."
  - "MineRU model fetch was NOT triggered (the OS-level OMP shmem failure happened BEFORE MineRU could begin downloading; HuggingFace connectivity verified green via probe but never exercised). User's local run will trigger the ~3-5 GB download on first invocation."
  - "OPEN Q1 (does aquery 1.2.10 return structured chunks?) NOT empirically resolved this plan — the OMP failure killed the run before query path executed. Plan 03's static-only guard (to_display_chunks returns [] for str responses) remains the documented contract; user's local live run can validate."
  - "OPEN Q3 (device autodetect on executor's machine — cpu/cuda/mps?) NOT empirically resolved this plan — same reason. Plan 03's _detect_device() static implementation is correct (probes torch.cuda → torch.backends.mps → cpu fallback); needs runtime confirmation on user hardware."
metrics:
  duration: "~30 minutes"
  completed: "2026-04-27"
  tasks: 2
  files: 5
---

# Phase 130 Plan 05: Tier 4 README + Live e2e Summary

**One-liner:** Authored the Tier 4 user-facing surface — a 202-line README mirroring Tiers 1-3's 9-section template (with a Section-0 [!WARNING] banner and a Docker-mandatory quickstart for the 3-5 GB MineRU cold-start case), the @pytest.mark.live 3-paper + 5-image e2e test, plus a Rule 1 fix discovered live (ingest_pdfs was passing a kwarg that raganything==1.2.10 rejects). Live test deferred to user — kernel-level sandbox restriction on MineRU's OpenMP shared-memory initialization is below the layer the SOCKS5+socksio workaround can reach.

## Tasks Completed

| Task | Name                                                                                | Commit  | Files                                                              |
| ---- | ----------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| 1    | tier-4 README — banner + Docker quickstart + 9-section template + expected_output skeleton | 178a03f | tier-4-multimodal/{README,expected_output}.md (247 insertions)     |
| 2    | tier-4 live e2e (3-paper + 5-image subset, hybrid mode, cost > 0 assert)           | a264065 | tier-4-multimodal/tests/{conftest,test_tier4_e2e_live}.py (330 insertions) |
| —    | Rule 1 fix discovered live: drop parser= kwarg from process_document_complete       | 48047fe | tier-4-multimodal/ingest_pdfs.py (+6/-1)                           |

## README Final State

```
$ wc -l tier-4-multimodal/README.md
202 tier-4-multimodal/README.md
```

### Section Headers (verbatim, in order)

```
> [!WARNING]                       (Section 0 — banner BEFORE title)
# Tier 4: Multimodal RAG (RAG-Anything)
## Quickstart (pip)
## Docker Quickstart (REPO-05 mandatory path)
## CLI reference
   ### `--mode` choices                (subsection)
## Expected cost (vintage 2026-04)
## Persistence
## Known weaknesses (deliberate)
   ### First-run MineRU model download (~3-5 GB; Pitfall 1)
   ### Vision pass calls VLM once per image (Pitfall 5)
   ### `aquery` returns a string — no structured `chunks` field (Pitfall 7)
   ### Standalone images need ABSOLUTE `img_path` (Pitfall 4)
   ### Sparse caption coverage (Phase 127 dataset asymmetry)
   ### Docker dependency (REPO-05 honest)
## Sample query
## Architecture
## Reused by
```

9 H2 sections + Section-0 banner + 6 H3 weakness subsections — matches the Tier 1/2/3 template AND ships the Tier-4-specific banner + Docker-mandatory subsection (REPO-05 contract honest).

## Live Test Outcome (2026-04-27T01:00Z)

**Status:** EXECUTOR-DEFERRED — code committed, statically verified, live run BLOCKED in-sandbox by a kernel-level OS restriction beyond the layer prior workarounds reach.

### Was the live test run by the executor?

**No** — but two attempts were made. Sequence:

1. **Pre-flight network probe (PASSED):** `httpx.get('https://openrouter.ai/api/v1/models')` returned 200; `httpx.get('https://huggingface.co/')` returned 200. SOCKS5+socksio workaround was set up correctly (proxy env vars intact, socksio==1.0.0 importable in venv). Both endpoints reachable from the sandbox.

2. **Attempt 1 (Rule 1 bug surfaced; FAILED at TypeError):**
   ```
   TypeError: MineruParser._run_mineru_command received unexpected keyword argument(s): parser
   .venv/lib/python3.13/site-packages/raganything/parser.py:695: TypeError
   FAILED tier-4-multimodal/tests/test_tier4_e2e_live.py::test_tier4_end_to_end_subset
   1 failed in 16.67s
   ```
   `ingest_pdfs.py` was passing `parser="mineru"` as a kwarg to `rag.process_document_complete()`. raganything==1.2.10 forwards **kwargs through to `MineruParser._run_mineru_command` which raises `TypeError` on unexpected kwargs. Fix: drop the kwarg (parser is set on `RAGAnythingConfig` at build time). **Without this fix, every user invocation of `tier-4-multimodal/main.py --ingest` would crash on the first PDF.**

3. **Attempt 2 (post Rule 1 fix; FAILED at OMP shmem PermissionError):**
   ```
   WARNING  raganything.parser:parser.py:775 [MinerU] OMP: Warning #179: Function Can't set size of /tmp file failed:
   ERROR    raganything.parser:parser.py:777 [MinerU] PermissionError: [Errno 1] Operation not permitted
   ERROR: Mineru command failed: Mineru command failed with return code 1: ['PermissionError: [Errno 1] Operation not permitted']
   FAILED tier-4-multimodal/tests/test_tier4_e2e_live.py::test_tier4_end_to_end_subset
   1 failed in 4.29s
   ```
   MineRU spawns a subprocess (`mineru` CLI) that initializes Intel MKL/OpenMP. OpenMP creates shared-memory files in `/tmp/__KMP_REGISTERED_LIB_*` via `ftruncate(2)` — sandbox kernel returns `EPERM` (Operation not permitted) before any Python-level env can intercept.

4. **Attempt 3 (with `OMP_NUM_THREADS=1 KMP_INIT_AT_FORK=FALSE TMPDIR=$TMPDIR`; FAILED with SAME error):**
   The OMP env vars are read AFTER the shmem allocation attempt during MKL runtime initialization. The kernel restriction is below the layer Python-level workarounds can reach (cf. Phase 129-06 first-attempt's DNS-block precedent — kernel-level walls cannot be tunneled around with userspace env tweaks).

### Path forward for the user

```bash
# In a normal shell (NOT inside the orchestrator's sandbox):
cd ~/work/git/rag-architecture-patterns
export OPENROUTER_API_KEY=<your-key>
mkdir -p ~/.mineru                    # or set MINERU_CACHE_DIR to a writable path
uv run --extra tier-4 --extra tier-5 pytest \
  tier-4-multimodal/tests/test_tier4_e2e_live.py -v -m live -s 2>&1 | tee /tmp/tier4_live.txt
```

Expected behavior on user's machine:

- First run: ~5-15 min cold start (MineRU model download to `~/.mineru/`)
- Subsequent runs: ~1-3 min (3 PDF parses + entity extraction + 5 image vision pass + 1 hybrid query)
- Cost: ~$0.10-0.30 (LLM entity extraction + vision pass + embedding + per-query LLM)
- Stdout shows: ingest latency, query latency, total cost, answer (truncated 300 chars), graphml size

When the test passes locally, the user can update `tier-4-multimodal/expected_output.md` by replacing the `<fill at capture time>` markers with verbatim stdout from `/tmp/tier4_live.txt` plus today's date and `git rev-parse --short HEAD`.

### Was MineRU model download triggered?

**No** — the OMP shmem failure happens during MineRU subprocess startup BEFORE the model loader runs. HuggingFace connectivity was verified reachable (probe returned 200), but no model bytes were transferred. User's first local run will trigger the full ~3-5 GB download.

### Was `expected_output.md` captured live?

**No** — file remains in skeleton state with `<fill at capture time>` placeholders. Plan body's `<interfaces>` contract for the skeleton (`min_lines: 25` + `contains: Captured`) is met by the skeleton itself (33 LOC, header carries "Captured: <fill at capture time> (UTC)"). User's first successful run populates it.

## Verbatim Live-Test Stdout (Attempt 2 — post Rule 1 fix)

```
============================= test session starts ==============================
platform darwin -- Python 3.13.1, pytest-8.4.2, pluggy-1.6.0
collecting ... collected 1 item

tier-4-multimodal/tests/test_tier4_e2e_live.py::test_tier4_end_to_end_subset
INFO: Created working directory: .../rag_anything_storage/tier-4-multimodal-test
INFO: RAGAnything initialized with config:
INFO:   Working directory: .../rag_anything_storage/tier-4-multimodal-test
INFO:   Parser: mineru
INFO:   Parse method: auto
INFO:   Multimodal processing - Image: True, Table: True, Equation: True
INFO:   Max concurrent files: 1
INFO: Parser 'mineru' installation verified
INFO: Initializing LightRAG with parameters: {'working_dir': '.../tier-4-multimodal-test'}
INFO: Created new empty graph file: .../graph_chunk_entity_relation.graphml
INFO: KV load full_docs / text_chunks / full_entities / full_relations / entity_chunks / relation_chunks / llm_response_cache / parse_cache (all 0 records)
INFO: Multimodal processors initialized with context support
INFO: Available processors: ['image', 'table', 'equation', 'generic']
INFO: LightRAG, parse cache, and multimodal processors initialized
INFO: Starting complete document processing: dataset/papers/1808.04776_retrieve_and_refine_improved_sequence_ge.pdf
INFO: Starting document parsing: dataset/papers/1808.04776...pdf
INFO: Using mineru parser with method: auto
INFO: Detected PDF file, using parser for PDF...
WARNING  raganything.parser:parser.py:775 [MinerU] OMP: Warning #179: Function Can't set size of /tmp file failed:
ERROR    raganything.parser:parser.py:777 [MinerU] PermissionError: [Errno 1] Operation not permitted
ERROR: Mineru command failed: Mineru command failed with return code 1: ['PermissionError: [Errno 1] Operation not permitted']
INFO: Successfully finalized 12 storages
INFO: Successfully finalized all RAGAnything storages
FAILED tier-4-multimodal/tests/test_tier4_e2e_live.py::test_tier4_end_to_end_subset
============================== 1 failed in 4.29s ===============================
```

The progression confirms: RAGAnything constructor succeeds → LightRAG initializes → multimodal processors come up → first PDF parse begins → MineRU subprocess spawned → OMP shmem allocation fails inside the subprocess. **All Tier-4 code paths up to the MineRU subprocess boundary work correctly in-sandbox.**

## Static Verification (all green)

```
$ test -f tier-4-multimodal/README.md && \
  test $(wc -l < tier-4-multimodal/README.md) -ge 90 && \
  grep -q '\[!WARNING\]' tier-4-multimodal/README.md && \
  grep -q 'docker build' tier-4-multimodal/README.md && \
  grep -q 'ALL_PROXY' tier-4-multimodal/README.md && \
  grep -q 'rag_anything_storage' tier-4-multimodal/README.md && \
  test -f tier-4-multimodal/expected_output.md && \
  grep -q 'Captured' tier-4-multimodal/expected_output.md && \
  test -f tier-4-multimodal/tests/conftest.py && \
  test -f tier-4-multimodal/tests/test_tier4_e2e_live.py && \
  test ! -f tier-4-multimodal/tests/__init__.py && \
  grep -q '@pytest.mark.live' tier-4-multimodal/tests/test_tier4_e2e_live.py && \
  grep -q 'SUBSET_PAPERS' tier-4-multimodal/tests/test_tier4_e2e_live.py && \
  grep -q 'tier4_live_keys_ok' tier-4-multimodal/tests/conftest.py && \
  echo OK
OK
```

## Skip-Without-Key Behavior (verified)

```
$ OPENROUTER_API_KEY="" uv run --extra tier-4 --extra tier-5 pytest \
    tier-4-multimodal/tests/test_tier4_e2e_live.py -m live -v
collected 1 item
tier-4-multimodal/tests/test_tier4_e2e_live.py::test_tier4_end_to_end_subset SKIPPED [100%]
============================== 1 skipped in 0.01s ==============================
```

## Full Non-Live Suite (verified — no regressions)

```
$ UV_CACHE_DIR=$TMPDIR/uv-cache uv run --extra tier-1 --extra tier-2 --extra tier-3 \
    --extra tier-4 --extra tier-5 pytest -q -m "not live"
91 passed, 4 skipped, 8 deselected, 5 warnings in 4.67s
```

Same passing total as before Plan 05 (91), and the Rule 1 fix in `ingest_pdfs.py` did NOT regress any non-live test (those tests stub the rag instance — they never exercised the kwarg path).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Drop `parser=` kwarg from `process_document_complete` call**

- **Found during:** Task 2 first live-test attempt (16.67s before crash).
- **Issue:** Plan 02's `tier-4-multimodal/ingest_pdfs.py` line 73 passed `parser=parser` (default `"mineru"`) as a kwarg. raganything==1.2.10's `RAGAnything.process_document_complete` forwards **kwargs through to `MineruParser._run_mineru_command` which raises `TypeError` on unexpected kwargs. Verified against `inspect.signature(RAGAnything.process_document_complete)` — only `file_path`, `output_dir`, `parse_method`, `display_stats`, `split_by_character`, `split_by_character_only`, `doc_id`, `file_name`, `**kwargs` are accepted; the parser is set ONCE on `RAGAnythingConfig` at build time. Without this fix, EVERY user invocation of `python tier-4-multimodal/main.py --ingest` would crash on the first PDF.
- **Fix:** Removed `parser=parser` from the kwargs; preserved `device=device` (which IS accepted; forwarded to mineru CLI's `-d` flag). Added a 5-line explanatory comment.
- **Files modified:** `tier-4-multimodal/ingest_pdfs.py` (+6/-1)
- **Commit:** `48047fe` (`fix(130-05)`)
- **Why this slipped through:** Plan 02's non-live tests exercise `build_image_content_list` (pure helper) and `EMBED_DIMS` (constant) but never `process_document_complete` (live-only). Plan 03's CLI was tested end-to-end via static-only structural checks. The bug needed an actual MineRU subprocess invocation to surface, which is exactly what Plan 05's live test attempted.

### Sandbox-bounded deferral (NOT a deviation)

The OMP shared-memory PermissionError that blocks the live test is identical in shape to Phase 129-06's first-attempt DNS-block: a kernel-level restriction below the layer userspace workarounds can reach. Phase 129-06 was unblocked when Plan 07 surfaced the SOCKS5+socksio recipe (the failure class was actually network-via-proxy, not "sandbox can't talk to Google"). For Plan 130-05, the equivalent "is there a workaround?" probe was thorough: `OMP_NUM_THREADS=1`, `KMP_INIT_AT_FORK=FALSE`, `TMPDIR=$TMPDIR`, `MINERU_CACHE_DIR=$TMPDIR/mineru`, `HF_HOME=$TMPDIR/hf-cache` all tried; none reach the kernel `ftruncate` call. **Documented as deferral, not as a "Plan 05 incomplete" — code is shipped + statically verified + ready for user's local run.**

## Auth Gates

None — `OPENROUTER_API_KEY` was present in the local `.env` (verified), and the `tier4_live_keys_ok` fixture skips cleanly when absent. No 2FA / email-link / dashboard-config gates.

## Threat Surface Scan

No new security-relevant surface introduced. README documents the existing OpenRouter trust boundary (Phase 128-06 + Phase 129-03 / 130-02 / 130-03 inheritance). The Docker quickstart documents the standard `--env-file .env` mount pattern (secrets at run time, never baked into image). No new endpoints, auth paths, file-access patterns, or schema changes at trust boundaries.

## Known Stubs

`tier-4-multimodal/expected_output.md` is committed in **skeleton state** with `<fill at capture time>` markers in 4 places:

| Line | Marker | Resolution |
|------|--------|------------|
| 7 | `**Captured:** \`<fill at capture time>\` (UTC)` | User's first successful live run populates with `date -u +"%Y-%m-%d (UTC)"` |
| 11 | `**Git SHA:** \`<fill at capture time>\`` | User's first successful live run populates with `git rev-parse --short HEAD` |
| 25-30 | `<rendered shared.display table>`, `Ingest latency: <fill>s`, `Query latency: <fill>s`, `Total cost: $<fill>`, `Cost JSON: ...`, `graphml size: <fill> bytes`, `Answer (truncated 300 chars): <fill>` | User pastes verbatim stdout from `/tmp/tier4_live.txt` |

This is INTENTIONAL — Pattern 9's reproducibility-shape contract (the file's structure is locked; the values vary per run because LLM outputs are non-deterministic). The plan body explicitly green-lights this state: "If executor lacks key OR live test was deferred: expected_output.md remains in skeleton state; SUMMARY documents deferral."

## Empirical Resolutions of Open Questions

- **Open Q1 (does aquery 1.2.10 return structured chunks?):** NOT empirically resolved this plan. The OMP shmem failure killed the run before query path executed. Plan 03's static contract (`to_display_chunks` returns `[]` for str responses) remains the documented behavior; user's local live run will validate.
- **Open Q3 (device autodetect on executor's machine — cpu/cuda/mps?):** NOT empirically resolved this plan — same reason. Plan 03's `_detect_device()` static implementation is correct (probes `torch.cuda.is_available` → `torch.backends.mps.is_available` → `cpu` fallback); needs runtime confirmation on user hardware. The test forces `device="cpu"` to bypass this concern in the cost-bounded subset case.

## Commits

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| `178a03f` | `docs(130-05)` | tier-4 README — banner + Docker quickstart + 9-section template | tier-4-multimodal/{README,expected_output}.md (247 insertions) |
| `a264065` | `test(130-05)` | tier-4 live e2e (3-paper + 5-image subset, hybrid mode, cost > 0 assert) | tier-4-multimodal/tests/{conftest,test_tier4_e2e_live}.py (330 insertions) |
| `48047fe` | `fix(130-05)` | drop parser= kwarg from process_document_complete (Rule 1) | tier-4-multimodal/ingest_pdfs.py (+6/-1) |

Push: `0267ce1..178a03f` → `178a03f..a264065` → `a264065..48047fe` (three sequential fast-forwards on `origin/main`). No rebase needed.

## Self-Check: PASSED

**Files modified verified present on disk:**
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/README.md` (202 LOC, contains `[!WARNING]` + `MineRU` + `docker build` + `ALL_PROXY`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/expected_output.md` (33 LOC, contains `Captured`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/tests/conftest.py` (54 LOC, contains `tier4_live_keys_ok`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/tests/test_tier4_e2e_live.py` (~250 LOC, contains `@pytest.mark.live` + `SUBSET_PAPERS` + `SUBSET_IMAGES`)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/tests/__init__.py` ABSENT (matches Tier 1/2/3 baseline)
- [x] `/Users/patrykattc/work/git/rag-architecture-patterns/tier-4-multimodal/ingest_pdfs.py` (Rule 1 fix — `parser=` kwarg removed)

**Commits verified in git log:**
- [x] `178a03f` (`docs(130-05)`) — `git log --oneline | grep 178a03f` returns the README commit
- [x] `a264065` (`test(130-05)`) — `git log --oneline | grep a264065` returns the test commit
- [x] `48047fe` (`fix(130-05)`) — `git log --oneline | grep 48047fe` returns the Rule 1 fix
- [x] All three pushed to `origin/main` (push outputs: `0267ce1..178a03f` → `178a03f..a264065` → `a264065..48047fe`)

**Behavior verified:**
- [x] Test SKIPS cleanly with `OPENROUTER_API_KEY=""` (1 skipped in 0.01s)
- [x] Test COLLECTS cleanly under `-m live` (1 collected, 0 errors)
- [x] Full non-live suite still 91 passed / 4 skipped / 8 deselected (no regressions from Rule 1 fix)
- [x] Live test attempted in-sandbox per executor instructions; deferred to user due to kernel-level OMP shmem PermissionError (not a code issue; no userspace workaround within the sandbox boundary)
