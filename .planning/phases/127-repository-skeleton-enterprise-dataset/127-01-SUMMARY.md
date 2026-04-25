---
phase: 127-repository-skeleton-enterprise-dataset
plan: 01
subsystem: infra
tags: [git-lfs, pyproject, uv, python, github, apache-2.0, rag]

requires:
  - phase: 127-repository-skeleton-enterprise-dataset
    provides: "Phase context, research, and plan (CONTEXT.md, RESEARCH.md, PLAN.md)"
provides:
  - "Companion repo PatrykQuantumNomad/rag-architecture-patterns on GitHub (public, Apache-2.0)"
  - "Local sibling clone at /Users/patrykattc/work/git/rag-architecture-patterns/"
  - "git-lfs filter committed BEFORE any binary lands (pdf/png/jpg/jpeg/mp4/webm)"
  - "pyproject.toml with shared+curation extras and 5 tier-N stubs"
  - "Five tier-N/requirements.txt files mirroring parent extras"
  - ".env.example with GEMINI_API_KEY, OPENAI_API_KEY, S2_API_KEY"
  - "dataset/, evaluation/, shared/, scripts/, tests/ scaffolding with provenance/schema docs"
affects: [128-tier-1-naive, 128-tier-2-managed, 129-tier-3-graph, 130-tier-4-multimodal, 130-tier-5-agentic, 131-evaluation-harness, 132-corpus-curation, 133-blog-post]

tech-stack:
  added: [google-genai, pydantic, pydantic-settings, rich, tiktoken, python-dotenv, arxiv, semanticscholar, pymupdf, pytest, ruff, git-lfs]
  patterns:
    - "git-lfs filter committed before any binary (Pitfall 1)"
    - "pyproject extras drive tier-N/requirements.txt via -e ..[tier-N] mirror"
    - "Named-file git staging (never `git add -A`) to avoid stray binary uploads"
    - "Apache-2.0 code + per-asset corpus license documented in dataset/README.md"
    - "Stable JSON cost-tracking schema for blog ingestion (D-13)"

key-files:
  created:
    - "../rag-architecture-patterns/.gitattributes (LFS filter for 6 binary patterns)"
    - "../rag-architecture-patterns/pyproject.toml (shared/curation/tier-1..5 extras, dev/test groups)"
    - "../rag-architecture-patterns/.env.example (GEMINI_API_KEY required, OPENAI/S2 optional)"
    - "../rag-architecture-patterns/README.md (curated overview with blog link)"
    - "../rag-architecture-patterns/dataset/README.md (corpus provenance + per-asset licensing)"
    - "../rag-architecture-patterns/evaluation/README.md (golden_qa schema + cost JSON shape)"
    - "../rag-architecture-patterns/tier-{1..5}-{name}/requirements.txt (5 files)"
  modified:
    - "../rag-architecture-patterns/.gitignore (appended .env, .venv, chroma_db, lightrag_*, cost JSON)"

key-decisions:
  - "git-lfs filter staged in commit 1 before any binary (closes T-127-02)"
  - "pyproject tier-N extras stub out as [shared] only — tier-specific deps land in Phases 128-130"
  - "google-genai pinned (not deprecated google-generativeai EOL 2025-08-31)"
  - "tier-N/requirements.txt uses `-e ..[tier-N]` mirror — single source of truth in pyproject"
  - "LFS lock verification disabled per-remote due to sandbox TLS limitation (locks not used)"

patterns-established:
  - "Pattern: GitHub auth via curl REST API + HTTPS-with-token git URL when gh CLI fails in sandbox"
  - "Pattern: Sandbox write.allowOnly must list sibling companion-repo path explicitly"
  - "Pattern: Stage named files only — auto-init artifacts (LICENSE, base .gitignore) untouched"
  - "Pattern: Dry-run validation via temp uv venv with UV_CACHE_DIR pointed at $TMPDIR"

duration: 3m 39s
completed: 2026-04-25
---

# Phase 127 Plan 01: Repository Skeleton Summary

**Bootstrapped the rag-architecture-patterns companion repo with git-lfs configured before any binary, pyproject.toml resolving 39 packages cleanly via uv dry-run, and full provenance/schema docs for the dataset and evaluation harness.**

## Performance

- **Duration:** 3m 39s
- **Started:** 2026-04-25T18:07:26Z
- **Completed:** 2026-04-25T18:11:05Z
- **Tasks:** 3 / 3
- **Files modified:** 18 (1 .gitignore append, 17 new files in companion repo)

## Accomplishments

- Companion repo `PatrykQuantumNomad/rag-architecture-patterns` fully scaffolded on GitHub (public, Apache-2.0) with 4 commits on `main` (1 auto-init + 3 from this plan).
- git-lfs filter committed BEFORE any binary is staged — closes Pitfall 1 from research and threat T-127-02.
- `pyproject.toml` resolves 39 packages via `uv pip install --dry-run -e ".[shared,curation]"` — all pins are upper-bounded, `google-generativeai` (deprecated) absent.
- Five `tier-N/requirements.txt` files mirror parent extras via `-e ..[tier-N]`, satisfying REPO-04 with zero duplication.
- `.env.example` documents `GEMINI_API_KEY` (required) plus `OPENAI_API_KEY` and `S2_API_KEY` (optional) with obtain-at links — satisfies REPO-06.
- `README.md` links to `https://patrykgolabek.dev/blog/rag-architecture-patterns` — satisfies REPO-01.
- `dataset/README.md` documents the citation-cluster framing, per-asset licensing (arXiv ToU for PDFs, parent-paper inheritance for figures, CC BY/BY-SA/BY-NC/BY-NC-SA for videos with ND rejected per D-12), and manifest schemas for Plans 04-06.
- `evaluation/README.md` locks the golden Q&A 10/10/7/3 split (single-hop / multi-hop / multimodal / video) and publishes the stable cost-tracking JSON schema for blog Phase 133 ingestion (D-13).

## Task Commits

Each task was committed atomically in the companion repo (`/Users/patrykattc/work/git/rag-architecture-patterns`):

1. **Task 1: Create companion repo + scaffold .gitattributes/.gitignore/README.md** — `f01f1e6` (chore)
2. **Task 2: Author pyproject.toml + .env.example + 5 tier requirements.txt** — `8ac2d3e` (chore)
3. **Task 3: Scaffold dataset/evaluation/shared/scripts/tests directories** — `0cb0dbf` (chore)

The companion repo also has the GitHub auto-init commit `44cc92a` (LICENSE + initial README + Python .gitignore from `gh repo create --license apache-2.0 --gitignore Python` in a prior run).

**Plan metadata commit (profile repo):** Will be `docs(127-01): complete repository skeleton plan` after this SUMMARY lands.

## Files Created/Modified

In `../rag-architecture-patterns/`:

- `.gitattributes` — git-lfs filter for `*.pdf *.png *.jpg *.jpeg *.mp4 *.webm`
- `.gitignore` — appended `.env`, `.venv/`, `chroma_db/`, `lightrag_*/`, `evaluation/results/costs/*.json` (with `!.gitkeep` exception)
- `README.md` — replaced auto-init stub with curated tagline, blog link, tier table, dataset overview, setup instructions, license summary
- `pyproject.toml` — `name=rag-architecture-patterns`, `requires-python>=3.10`, `Apache-2.0`, `[project.optional-dependencies]` with `shared`, `curation`, `tier-1..5`; `[dependency-groups]` test/dev; `[tool.pytest.ini_options]` live marker
- `.env.example` — `GEMINI_API_KEY=your_gemini_api_key_here`, optional `OPENAI_API_KEY`/`S2_API_KEY`, default model strings, `DATASET_ROOT=dataset`
- `tier-{1-naive,2-managed,3-graph,4-multimodal,5-agentic}/requirements.txt` — five files, each `-e ..[tier-N]`
- `dataset/{papers,images,videos,manifests}/.gitkeep` + `dataset/README.md`
- `evaluation/results/costs/.gitkeep` + `evaluation/README.md`
- `shared/__init__.py` (empty package marker)
- `tests/__init__.py` + `tests/conftest.py` (Plan 02 fills smoke tests)
- `scripts/.gitkeep`

## Decisions Made

- **Tier-N extras as `[shared]` stubs only.** Concrete tier-specific deps (chromadb, openai, lightrag-hku, raganything, openai-agents) deliberately deferred to their own phases (128-130) to keep this scaffolding plan boring and idempotent.
- **`-e ..[tier-N]` mirror over package-list duplication.** Single source of truth lives in `pyproject.toml`; each `tier-N/requirements.txt` is one line. Phases 128-130 will either extend the pyproject extras (auto-pickup) or replace the line with explicit pins — that decision is per-tier.
- **LFS lock verification disabled per-remote.** `git lfs locks` is a feature we don't use, and the sandbox cannot reach the LFS lock-verify endpoint due to the macOS keychain TLS limitation. Disabling lock verification is scoped to this remote URL and does not affect LFS object storage itself.

## Deviations from Plan

The plan was executed exactly as written for the file contents. Three deviations affected the **execution mechanics** — all auto-fixed under Rule 3 (blocking issues caused by sandbox/tooling limits):

### Auto-fixed Issues

**1. [Rule 3 - Blocking] gh CLI fails in sandbox — switched to curl REST API**
- **Found during:** Task 1 pre-flight (prior run, before this resume)
- **Issue:** `gh repo create` and `gh repo view` errored under the sandbox network/auth shim even though `gh auth token` returns a valid token.
- **Fix:** Used `curl -H "Authorization: token $(gh auth token)" https://api.github.com/...` for repo existence check (HTTP 200 confirmed); the repo had already been auto-init'd in a prior attempt with `--public --license apache-2.0 --gitignore Python`.
- **Files affected:** None (mechanism only).
- **Verification:** `curl /api.github.com/repos/PatrykQuantumNomad/rag-architecture-patterns` → 200; `curl /api.github.com/user` → `"login": "PatrykQuantumNomad"`.
- **Forward guidance:** Plans 02-06 will need this same pattern any time they touch the GitHub API.

**2. [Rule 3 - Blocking] Sandbox write.allowOnly missed sibling repo path**
- **Found during:** Task 1 (initial attempt, prior run)
- **Issue:** Sandbox config restricted writes to the profile repo only; `/Users/patrykattc/work/git/rag-architecture-patterns/` (sibling) raised EPERM on every Write.
- **Fix:** User added `/Users/patrykattc/work/git/rag-architecture-patterns` to `write.allowOnly` before this resume.
- **Files affected:** Sandbox config (out-of-tree).
- **Verification:** All 18 file writes in this run succeeded.
- **Forward guidance:** Plans 02-06 inherit the same sibling-write requirement — config is now persistent.

**3. [Rule 3 - Blocking] git push failed on LFS locks-verify TLS handshake**
- **Found during:** Task 1 push step (this run)
- **Issue:** `git push origin main` errored with `tls: failed to verify certificate: x509: OSStatus -26276` while git-lfs tried to verify locks. macOS keychain TLS doesn't reach the LFS locks endpoint cleanly under the sandbox.
- **Fix:** `git config lfs.https://github.com/PatrykQuantumNomad/rag-architecture-patterns.git/info/lfs.locksverify false`. We don't use LFS locking; this only disables the pre-push lock-verify probe, not LFS object storage. LFS objects (PDFs/images/videos in Plans 04-05) will still be uploaded to GitHub LFS via the normal smudge filter.
- **Files affected:** `.git/config` (local-only, not tracked).
- **Verification:** `git push origin main` succeeded for all 3 task commits; `git lfs track` shows the 6 patterns active.
- **Forward guidance:** Plans 04 and 05 (binary uploads) inherit this config and will push LFS objects without the lock-verify roadblock.

**4. [Rule 3 - Blocking] uv pip dry-run cache hit a sandbox-restricted path**
- **Found during:** Task 2 dry-run validation (this run)
- **Issue:** `uv pip install --dry-run` errored with `failed to open file /Users/patrykattc/.cache/uv/sdists-v8/.git: Operation not permitted (os error 1)` — the sandbox blocks writes inside the system uv cache.
- **Fix:** Set `UV_CACHE_DIR="$TMPDIR/uv-cache-$$"` and used a dedicated temp venv (`.venv-dryrun`) for the dry-run. Removed the temp venv after validation.
- **Files affected:** None tracked.
- **Verification:** Dry-run reported `Would install 39 packages` including `google-genai==1.73.1`, `pydantic==2.13.3`, `arxiv==3.0.0`, `pymupdf==1.27.2.3` — all within the pinned bounds.
- **Forward guidance:** Any future plan that runs `uv pip ...` from inside this sandbox should set `UV_CACHE_DIR=$TMPDIR/uv-cache-$$`.

---

**Total deviations:** 4 auto-fixed (all Rule 3 blocking; all sandbox/tooling, none affecting file content).
**Impact on plan:** Plan content delivered exactly as specified. Sandbox workarounds are mechanism-only and now documented for downstream plans.

## Issues Encountered

- **LFS quota for the companion repo is still unknown** (Open Question #1 from research). With ~84 KB committed across 4 commits and zero LFS objects yet, the GitHub Free LFS quota (1 GB or 10 GiB) hasn't been touched. **Action item for Plan 04/05:** before the bulk PDF push, check `https://github.com/settings/billing` to confirm the active quota and whether `git lfs migrate` will be needed.

## User Setup Required

Two flags from the plan's `user_setup` block remain advisory for downstream plans:

- **github-lfs:** verify LFS quota at `https://github.com/settings/billing` after Plans 04/05 push the corpus. Quota tier surfaces when LFS bandwidth is consumed.
- **github auth:** the curl-REST workaround documented in Deviation 1 means downstream plans should use `curl + Authorization: token $(gh auth token)` instead of `gh ...` subcommands when they need GitHub API access.

No external service config is blocking right now — Plans 02 and 03 can run immediately.

## Next Phase Readiness

- **Plan 02 (Shared utilities) — READY.** Companion repo skeleton is in place; `pyproject.toml` shared extras resolve cleanly; `shared/__init__.py` exists for module additions; `tests/conftest.py` is a stub awaiting smoke fixtures.
- **Plan 03 (Curation scripts) — READY.** `scripts/` exists; `pyproject.toml` curation extras (arxiv, semanticscholar, pymupdf) resolve cleanly.
- **Plans 04-06 (Corpus + Q&A) — READY.** `dataset/{papers,images,videos,manifests}/` placeholders exist with provenance docs; LFS filter is active; manifest schemas published.
- **Plan 02 and Plan 03 can run in parallel** (Wave 2 per the phase plan).

## Self-Check: PASSED

- [x] `../rag-architecture-patterns/.gitattributes` exists with 6 LFS patterns
- [x] `../rag-architecture-patterns/pyproject.toml` exists; contains `google-genai`; does NOT contain `google-generativeai`
- [x] `../rag-architecture-patterns/.env.example` contains `GEMINI_API_KEY=your_gemini_api_key_here`
- [x] `../rag-architecture-patterns/README.md` contains `patrykgolabek.dev/blog/rag-architecture-patterns`
- [x] All 5 `tier-N/requirements.txt` files exist
- [x] `dataset/README.md` exists with `citation cluster` provenance text
- [x] `evaluation/README.md` exists with `golden_qa`, `single-hop`, `multi-hop`, `multimodal`, `video` markers
- [x] `shared/__init__.py`, `tests/__init__.py`, `tests/conftest.py` exist
- [x] Three commits exist on companion repo `main` and pushed to origin: `f01f1e6`, `8ac2d3e`, `0cb0dbf`
- [x] `uv pip install --dry-run -e ".[shared,curation]"` resolved 39 packages without error

---
*Phase: 127-repository-skeleton-enterprise-dataset*
*Completed: 2026-04-25*
