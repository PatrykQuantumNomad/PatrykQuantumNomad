# Phase 82: Directory Restructure - Research

**Researched:** 2026-03-05
**Domain:** Filesystem restructure, git operations, Astro static serving via symlinks
**Confidence:** HIGH

## Summary

This phase moves 4 skill directories from `public/skills/{name}/` to `skills/{name}/` at repo root so the skills.sh CLI can discover them in a priority directory. A symlink at `public/skills` pointing to `../skills` preserves Astro static serving -- the Astro build copies symlinked content into `dist/` as real files. Benchmark artifacts (JSON, MD, and workspace directories) move to `public/benchmarks/` to keep the skills directory pristine. The stale `--help/` directory at repo root is removed.

The core challenge is executing this as a single atomic commit to avoid broken intermediate states. Git handles the mechanics well: `git mv` preserves executable permissions (100755 mode), git tracks symlinks natively (stores the target path as blob content), and Astro/Vite 6.4.1 follows symlinks in `public/` during build (verified experimentally on this exact repo). The `scripts/test-validator-hooks.sh` file references `public/skills/` paths that will resolve through the symlink without code changes.

**Primary recommendation:** Use `git mv` for all tracked file moves (preserves history), `git rm` for the old directory, then `ln -s ../skills public/skills` for the symlink bridge. Execute as a single commit.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIR-01 | Skills directories moved from `public/skills/{name}/` to `skills/{name}/` at repo root | `git mv` preserves file modes and history; `skills/` is a Tier 2 priority directory for skills.sh CLI discovery |
| DIR-02 | Symlink created at `public/skills` pointing to `../skills` for Astro static serving | Verified: Astro/Vite 6.4.1 follows symlinks in `public/` during build, copies content to `dist/` as real files. Git tracks symlinks natively. |
| DIR-03 | Benchmark artifacts moved from `public/skills/` to `public/benchmarks/` (JSON, MD, workspace dirs) | 3 files (benchmark-all-skills.json, benchmark-all-skills.md, grading-summary.json) + 4 workspace dirs. Use `git mv`. |
| DIR-04 | Shell hook scripts retain executable permission after move | All 4 hooks currently tracked as 100755. `git mv` preserves file mode bits. Verify with `git ls-files -s` after move. |
| DIR-05 | Astro build produces `dist/skills/*/SKILL.md` for all 4 skills via symlink | Experimentally verified: `npm run build` follows symlinks in `public/` and copies contents to `dist/`. No `preserveSymlinks` Vite config needed. |
| DIR-06 | Stale `--help/` directory removed if present at repo root | Confirmed present and untracked. Contains a template SKILL.md. Safe to `rm -rf`. |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| git | system | File moves, symlink tracking, atomic commit | `git mv` preserves file modes and enables rename detection for history |
| Astro | 5.3.0 | Static site generator consuming `public/` directory | Project's build system; copies `public/` contents to `dist/` during build |
| Vite | 6.4.1 | Bundler underlying Astro | Follows symlinks in `public/` during build (fix shipped Dec 2023 in PR #15264) |
| Node.js | system | Build tooling (`npm run build`) | Used for Astro build verification |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `ln -s` | Create relative symlink | After `git rm` of old directory, before `git add` of symlink |
| `chmod +x` | Ensure executable permission | Post-move verification; `git mv` should preserve but verify |
| `stat` / `git ls-files -s` | Verify file modes | Post-move check that hooks retained 100755 mode |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `git mv` | Manual `mv` + `git add` | `git mv` is atomic index update; manual approach risks missing files |
| Relative symlink (`../skills`) | Absolute symlink | Absolute symlinks break on clone; relative symlinks are portable |
| `public/benchmarks/` for benchmark artifacts | `.planning/benchmarks/` | `public/benchmarks/` keeps them web-accessible which is fine for display; `.planning/` would hide them from Astro |

## Architecture Patterns

### Current Directory Structure
```
public/skills/
  benchmark-all-skills.json      # benchmark artifact
  benchmark-all-skills.md        # benchmark artifact
  grading-summary.json           # benchmark artifact
  compose-validator/             # skill directory
    SKILL.md
    hooks/validate-compose.sh
  compose-validator-workspace/   # benchmark workspace
  dockerfile-analyzer/           # skill directory
    SKILL.md
    hooks/validate-dockerfile.sh
  dockerfile-analyzer-workspace/ # benchmark workspace
  gha-validator/                 # skill directory
    SKILL.md
    hooks/validate-gha.sh
  gha-validator-workspace/       # benchmark workspace
  k8s-analyzer/                  # skill directory
    SKILL.md
    hooks/validate-k8s.sh
  k8s-analyzer-workspace/        # benchmark workspace
```

### Target Directory Structure
```
skills/                          # NEW: repo root, Tier 2 discovery path
  compose-validator/
    SKILL.md
    hooks/validate-compose.sh
  dockerfile-analyzer/
    SKILL.md
    hooks/validate-dockerfile.sh
  gha-validator/
    SKILL.md
    hooks/validate-gha.sh
  k8s-analyzer/
    SKILL.md
    hooks/validate-k8s.sh
public/
  skills -> ../skills            # SYMLINK: bridges Astro serving
  benchmarks/                    # NEW: benchmark artifacts relocated
    benchmark-all-skills.json
    benchmark-all-skills.md
    grading-summary.json
    compose-validator-workspace/
    dockerfile-analyzer-workspace/
    gha-validator-workspace/
    k8s-analyzer-workspace/
```

### Pattern 1: Symlink Bridge for Dual-Consumer Architecture
**What:** A single source of truth (`skills/` at root) with a filesystem symlink (`public/skills -> ../skills`) that allows a second consumer (Astro build) to access the same files.
**When to use:** When one directory must serve two different systems (skills.sh CLI discovery + Astro static asset pipeline).
**How it works:**
1. skills.sh CLI scans `skills/` at repo root (Tier 2 priority directory)
2. Astro build scans `public/` and follows the symlink to find the same files
3. `dist/skills/*/SKILL.md` is produced with real file copies (not symlinks)
4. GitHub Pages serves `dist/` -- visitors download real files

### Pattern 2: Atomic Restructure via Single Commit
**What:** All file moves, symlink creation, and cleanup happen in one commit.
**When to use:** When intermediate states would leave the project broken (e.g., files moved but symlink not yet created = broken Astro build).
**Key constraint:** The roadmap explicitly requires "single atomic commit for directory restructure."

### Anti-Patterns to Avoid
- **Absolute symlinks:** `ln -s /Users/.../skills public/skills` breaks on every other machine. Always use relative: `ln -s ../skills public/skills`.
- **Copying instead of symlinking:** Duplicating files creates drift between the two copies. Use symlink for single source of truth.
- **Moving benchmarks into `skills/`:** Benchmark artifacts would be discovered by skills.sh CLI as potential skill directories, causing noise. Keep them separate.
- **Leaving `--help/` directory:** Contains a template SKILL.md that could confuse skills.sh CLI if ever tracked.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File moves with git history | Manual `cp` + `git rm` + `git add` | `git mv source dest` | `git mv` is an atomic index operation; preserves rename detection and file modes |
| Symlink creation | Custom script or Astro plugin | `ln -s ../skills public/skills` | Built-in OS feature; git tracks it natively as a blob containing the path |
| Permission preservation | Post-move `chmod` scripts | `git mv` (preserves 100755 mode) | Git tracks file mode; `git mv` does not change it |
| Verifying build output | Manual `dist/` inspection | `npm run build && test -f dist/skills/dockerfile-analyzer/SKILL.md` | Astro build is the authoritative test; checking 1 file per skill suffices |

**Key insight:** This phase is filesystem operations and git plumbing, not application code. Every operation has a standard git or POSIX command. No custom tooling is needed.

## Common Pitfalls

### Pitfall 1: Git Does Not Follow Symlinks
**What goes wrong:** After creating `public/skills -> ../skills`, running `git add public/skills/` might seem like it should track the files through the symlink. It does not. Git stores the symlink itself (a blob containing `../skills`), not the files it points to.
**Why it happens:** Git has never followed symlinks (since Git 1.6.1, September 2010). The symlink is tracked as a special file type.
**How to avoid:** Track the actual files in `skills/` at root. Track the symlink at `public/skills`. Do not expect `git ls-files public/skills/` to show the skill files.
**Warning signs:** `git status` shows `public/skills` as a single modified file (typechange), not as individual file changes.

### Pitfall 2: Deleting Directory Before Creating Symlink
**What goes wrong:** `git rm -r public/skills/` removes the tracked directory from the index and working tree. If you then try to create the symlink, `public/skills` parent dir must still exist (it does -- `public/` remains).
**Why it happens:** The `git rm -r` removes the `public/skills/` directory entirely. The symlink replaces it.
**How to avoid:** Sequence matters. First: `git mv` files out. Then: `git rm -r public/skills/` (or it may already be empty). Then: `ln -s ../skills public/skills && git add public/skills`.

### Pitfall 3: Benchmark Workspace Directories Containing SKILL.md-like Content
**What goes wrong:** Workspace directories contain test fixtures (e.g., `test-insecure.Dockerfile`) but no SKILL.md. If accidentally left in `skills/`, they would not be discovered as skills but add repo noise.
**Why it happens:** Workspaces were co-located with skills for convenience during benchmarking.
**How to avoid:** Move all `*-workspace/` dirs to `public/benchmarks/` explicitly. Verify with `ls skills/` showing exactly 4 entries.

### Pitfall 4: Script Path References Not Updated
**What goes wrong:** `scripts/test-validator-hooks.sh` hardcodes `$REPO_ROOT/public/skills/{name}/hooks/` paths. After the symlink, these paths still resolve correctly on the filesystem, but the code references the wrong conceptual location.
**Why it happens:** The symlink makes old paths work, masking the conceptual incorrectness.
**How to avoid:** The symlink bridge means `public/skills/{name}/hooks/` resolves to `skills/{name}/hooks/` through the symlink. The script will work without changes. However, for DOC-05 in Phase 84, all references should be updated. For Phase 82, the symlink ensures functional correctness without script changes.
**Decision:** Do NOT update `scripts/test-validator-hooks.sh` in Phase 82. The symlink makes it work. Phase 84 (DOC-05) handles reference updates.

### Pitfall 5: `--help/` Directory Requires Special Git/Shell Handling
**What goes wrong:** The `--help` string is interpreted as a flag by most commands. `rm -rf --help` prints help instead of deleting.
**Why it happens:** Shell argument parsing treats `--` prefixed strings as flags.
**How to avoid:** Use `rm -rf -- '--help'` or `rm -rf './--help'` to disambiguate. Since it is untracked, no `git rm` needed.

### Pitfall 6: Astro Dev Server vs Build Behavior with Symlinks
**What goes wrong:** Historically, Vite dev server had issues with symlinks in `public/` (Vite issue #15261). The fix shipped Dec 2023 and Vite 6.4.1 (installed) includes it.
**Why it happens:** Vite v5 initially broke symlink resolution in dev mode.
**How to avoid:** Already resolved in installed Vite version. Build verified experimentally on this repo. No `preserveSymlinks` config needed.

## Code Examples

Verified patterns from direct investigation of this repository:

### Complete Restructure Sequence
```bash
# 1. Create target directories
mkdir -p skills
mkdir -p public/benchmarks

# 2. Move skill directories to root (git mv preserves history + 100755 mode)
git mv public/skills/compose-validator skills/
git mv public/skills/dockerfile-analyzer skills/
git mv public/skills/gha-validator skills/
git mv public/skills/k8s-analyzer skills/

# 3. Move benchmark artifacts to public/benchmarks/
git mv public/skills/benchmark-all-skills.json public/benchmarks/
git mv public/skills/benchmark-all-skills.md public/benchmarks/
git mv public/skills/grading-summary.json public/benchmarks/
git mv public/skills/compose-validator-workspace public/benchmarks/
git mv public/skills/dockerfile-analyzer-workspace public/benchmarks/
git mv public/skills/gha-validator-workspace public/benchmarks/
git mv public/skills/k8s-analyzer-workspace public/benchmarks/

# 4. public/skills/ should now be empty and removed by git
# If not, explicitly: git rm -r public/skills/

# 5. Create symlink
ln -s ../skills public/skills
git add public/skills

# 6. Remove stale --help/ directory (untracked, needs special quoting)
rm -rf './--help'

# 7. Verify
ls skills/                              # 4 directories
readlink public/skills                  # ../skills
git ls-files -s skills/*/hooks/*.sh     # all 100755
npm run build                           # should succeed
test -f dist/skills/dockerfile-analyzer/SKILL.md && echo "OK"
test -f dist/skills/compose-validator/SKILL.md && echo "OK"
test -f dist/skills/gha-validator/SKILL.md && echo "OK"
test -f dist/skills/k8s-analyzer/SKILL.md && echo "OK"
```

### Verifying Executable Permissions Post-Move
```bash
# Check git index for file mode (should show 100755 for all .sh files)
git ls-files -s -- 'skills/*/hooks/*.sh'
# Expected output:
# 100755 ... skills/compose-validator/hooks/validate-compose.sh
# 100755 ... skills/dockerfile-analyzer/hooks/validate-dockerfile.sh
# 100755 ... skills/gha-validator/hooks/validate-gha.sh
# 100755 ... skills/k8s-analyzer/hooks/validate-k8s.sh
```

### Verifying Symlink in Git
```bash
# Git tracks symlinks as a special file type
git ls-files -s public/skills
# Expected output:
# 120000 <hash> 0 public/skills
# (120000 = symlink mode)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Skills in `public/skills/` (Astro-centric) | Skills in `skills/` at root with symlink bridge | Phase 82 (this phase) | Enables skills.sh CLI discovery via Tier 2 priority directory |
| Vite symlink handling broken | Vite follows symlinks in `public/` correctly | Dec 2023 (Vite PR #15264) | No `preserveSymlinks` workaround needed |

**Current state of symlink support:**
- macOS (dev): Full native symlink support. `core.symlinks` defaults to `true`.
- Ubuntu (CI, GitHub Actions): Full native symlink support. `actions/checkout@v4` preserves symlinks.
- Windows: Requires elevated permissions or developer mode. Not relevant for this project's CI/dev environment.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (includes `src/**/*.test.ts`) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run && npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIR-01 | Skills dirs at `skills/` root | smoke | `test -d skills/dockerfile-analyzer && test -d skills/compose-validator && test -d skills/gha-validator && test -d skills/k8s-analyzer` | N/A (shell check) |
| DIR-02 | `public/skills` is symlink to `../skills` | smoke | `readlink public/skills` returns `../skills` | N/A (shell check) |
| DIR-03 | Benchmarks at `public/benchmarks/` | smoke | `test -f public/benchmarks/benchmark-all-skills.json && test -d public/benchmarks/dockerfile-analyzer-workspace` | N/A (shell check) |
| DIR-04 | Hook scripts executable | smoke | `git ls-files -s 'skills/*/hooks/*.sh' \| grep -c 100755` equals 4 | N/A (git check) |
| DIR-05 | Astro build produces dist/skills/*/SKILL.md | integration | `npm run build && test -f dist/skills/dockerfile-analyzer/SKILL.md` | N/A (build check) |
| DIR-06 | `--help/` removed | smoke | `test ! -d './--help'` | N/A (shell check) |

### Sampling Rate
- **Per task commit:** `readlink public/skills && ls skills/ && git ls-files -s 'skills/*/hooks/*.sh'`
- **Per wave merge:** `npm run build && for s in dockerfile-analyzer compose-validator gha-validator k8s-analyzer; do test -f "dist/skills/$s/SKILL.md" || echo "FAIL: $s"; done`
- **Phase gate:** Full build green + all 6 DIR-xx requirements verified before `/gsd:verify-work`

### Wave 0 Gaps
None -- this phase uses filesystem operations and git commands. No test framework setup needed. All validation is done via shell commands and the Astro build.

## Open Questions

1. **Should `scripts/test-validator-hooks.sh` paths be updated in Phase 82?**
   - What we know: The symlink makes old `public/skills/` paths resolve correctly. The script works without changes.
   - What's unclear: DOC-05 (Phase 84) requires updating all `public/skills/` references. Should this script be updated early?
   - Recommendation: Leave it for Phase 84. The symlink ensures functional correctness. Updating it now would go beyond DIR-xx scope and risk the atomic commit.

2. **Should benchmark workspace directories be web-accessible at `public/benchmarks/`?**
   - What we know: Workspace dirs contain eval results (timing.json, grading.json, analysis.md) and test fixtures (intentionally insecure files). They are currently web-accessible at `public/skills/`.
   - What's unclear: Whether exposing intentionally insecure test fixtures publicly is a concern.
   - Recommendation: Move to `public/benchmarks/` as specified in DIR-03. The files are already public. The benchmark data has display value for the portfolio.

## Sources

### Primary (HIGH confidence)
- **Direct repo inspection** -- All directory listings, file permissions, git tracked modes verified via `ls`, `stat`, `git ls-files -s` on the actual repository
- **Experimental verification** -- Astro build with symlink in `public/` tested on this repo. Created test symlink, ran `npm run build`, confirmed `dist/` contained real file copies through symlink.
- **Vite 6.4.1 source** -- Installed version verified via `node_modules/vite/package.json`. Symlink fix (PR #15264) shipped Dec 2023, well before Vite 6.x.
- [Vite PR #15264](https://github.com/vitejs/vite/pull/15264) -- Fix for symlinks in public directory

### Secondary (MEDIUM confidence)
- [Astro project structure docs](https://docs.astro.build/en/basics/project-structure/) -- public/ directory behavior documented: files "copied into the build folder untouched"
- [Elio Struyf: Symlink content in Astro](https://www.eliostruyf.com/symlink-content-astro-portability/) -- Confirms symlink approach with `preserveSymlinks` for content collections (not needed for `public/` in our Vite version)
- [Git symlink handling](https://www.geeksforgeeks.org/git/how-does-git-handle-symbolic-links/) -- Git stores symlink target path as blob, does not follow symlinks

### Tertiary (LOW confidence)
- None. All findings verified through direct inspection or official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools are basic git/POSIX commands verified on this repo
- Architecture: HIGH -- symlink bridge pattern experimentally verified on this exact codebase
- Pitfalls: HIGH -- each pitfall verified through direct investigation (git behavior, Vite version, file modes)

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable -- filesystem operations and git behavior do not change)
