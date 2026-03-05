# Architecture Research: skills.sh Publishing for DevOps Skills

**Domain:** AI Agent Skill publishing from a GitHub profile repo that also serves an Astro static site
**Researched:** 2026-03-05
**Confidence:** HIGH

## System Overview

```
PatrykQuantumNomad/PatrykQuantumNomad (GitHub Profile Repo)
┌─────────────────────────────────────────────────────────────────────┐
│                        Source of Truth                              │
│                                                                     │
│  skills/                          <- skills.sh CLI discovers here   │
│  ├── compose-validator/              (Tier 2: priority directory)   │
│  │   ├── SKILL.md                 <- skill definition               │
│  │   └── hooks/validate-compose.sh                                  │
│  ├── dockerfile-analyzer/                                           │
│  │   ├── SKILL.md                                                   │
│  │   └── hooks/validate-dockerfile.sh                               │
│  ├── gha-validator/                                                 │
│  │   ├── SKILL.md                                                   │
│  │   └── hooks/validate-gha.sh                                      │
│  └── k8s-analyzer/                                                  │
│      ├── SKILL.md                                                   │
│      └── hooks/validate-k8s.sh                                      │
│                                                                     │
│  public/skills -> ../skills       <- symlink for Astro serving      │
│                                                                     │
│  src/pages/tools/*/index.astro    <- interactive tool pages         │
│  README.md                        <- GitHub profile page            │
└─────────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐          ┌──────────────────────┐
│     skills.sh        │          │   GitHub Pages        │
│  (CLI discovery)     │          │  patrykgolabek.dev    │
│                      │          │                       │
│ npx skills add       │          │ /skills/*/SKILL.md    │
│ PatrykQuantumNomad/  │          │ (static downloads)    │
│ PatrykQuantumNomad   │          │                       │
│                      │          │ /tools/*/             │
│ Scans: skills/       │          │ (interactive tools)   │
│ (Tier 2 priority)    │          │                       │
└─────────────────────┘          └──────────────────────┘
```

## The Core Question: `public/skills/` vs `skills/` at Root

### Recommendation: Move skills to `skills/` at root, symlink from `public/skills/`

**Verdict:** Move to root `skills/`. Both Astro static serving and skills.sh CLI discovery coexist via a single symlink.

### Why Move

The skills.sh CLI (powered by [vercel-labs/skills](https://github.com/vercel-labs/skills)) uses a three-tier search strategy when scanning a GitHub repository:

1. **Tier 1 - Direct check:** Looks for `SKILL.md` at the repo root
2. **Tier 2 - Priority directories:** Scans the `skills/` subdirectory specifically
3. **Tier 3 - Recursive fallback:** Recursively searches the entire repo

Skills in `public/skills/` would only be found via Tier 3 (recursive fallback). This works but is slower, less predictable, and signals unfamiliarity with the convention. Placing skills in `skills/` at root puts them in Tier 2 -- the standard, expected location that matches the convention used by [anthropics/skills](https://github.com/anthropics/skills), [vercel-labs/skills](https://github.com/vercel-labs/skills), and [microsoft/skills](https://github.com/microsoft/skills).

**Confidence:** HIGH -- verified via [DeepWiki analysis of vercel-labs/skills](https://deepwiki.com/vercel-labs/skills) documenting the `discoverSkills()` function's three-tier strategy, and [Vercel KB guide](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context) confirming `skills/` as the conventional directory.

### Why Astro Still Works

Astro's `public/` directory copies contents verbatim to the build output. A symlink inside `public/` pointing to the root-level `skills/` directory is resolved during the Astro build process -- the skill files end up in `dist/skills/` exactly as before. The static URLs like `patrykgolabek.dev/skills/gha-validator/SKILL.md` continue to work unchanged.

**Confidence:** HIGH -- verified through [Astro project structure docs](https://docs.astro.build/en/basics/project-structure/) that `public/` copies files as-is, and symlinks are standard filesystem operations resolved by Node.js during Astro's build.

## Component Responsibilities

| Component | Responsibility | Current State | Change Required |
|-----------|---------------|---------------|-----------------|
| `skills/` (root) | Source of truth for all 4 SKILL.md files + hooks | Does not exist | **NEW** -- move from `public/skills/` |
| `public/skills` | Astro static serving gateway | Contains skills directly | **MODIFY** -- replace directory with symlink to `../skills/` |
| `public/benchmarks/` | Benchmark data + workspace eval results | Does not exist | **NEW** -- moved from `public/skills/` |
| `src/pages/tools/*/` | Interactive web tool pages | Links to `/skills/*/SKILL.md` for download | No change needed |
| `.github/workflows/deploy.yml` | Astro build + GitHub Pages deploy | Uses `withastro/action@v3` | No change needed |
| `README.md` | GitHub profile page | No skills.sh references | **MODIFY** -- add `npx skills add` install command |

## Recommended Project Structure

```
PatrykQuantumNomad/
├── .github/
│   └── workflows/
│       └── deploy.yml                # Astro build & deploy (unchanged)
├── skills/                            # NEW: root-level skills directory
│   ├── compose-validator/
│   │   ├── SKILL.md                   # Skill definition (moved from public/)
│   │   └── hooks/
│   │       └── validate-compose.sh    # Shell hook (moved from public/)
│   ├── dockerfile-analyzer/
│   │   ├── SKILL.md
│   │   └── hooks/
│   │       └── validate-dockerfile.sh
│   ├── gha-validator/
│   │   ├── SKILL.md
│   │   └── hooks/
│   │       └── validate-gha.sh
│   └── k8s-analyzer/
│       ├── SKILL.md
│       └── hooks/
│           └── validate-k8s.sh
├── public/
│   ├── skills -> ../skills            # MODIFIED: symlink replaces directory
│   ├── benchmarks/                    # NEW: benchmark + eval data
│   │   ├── benchmark-all-skills.json
│   │   ├── benchmark-all-skills.md
│   │   ├── grading-summary.json
│   │   ├── compose-validator-workspace/
│   │   ├── dockerfile-analyzer-workspace/
│   │   ├── gha-validator-workspace/
│   │   └── k8s-analyzer-workspace/
│   ├── images/
│   ├── fonts/
│   └── ...                            # other static assets (unchanged)
├── src/
│   ├── pages/
│   │   ├── tools/                     # Interactive tool pages (unchanged)
│   │   └── ...
│   └── ...
├── astro.config.mjs                   # Unchanged
├── README.md                          # Add skills.sh install badge/command
└── package.json                       # Unchanged
```

### What NOT to Put in `skills/`

The workspace and benchmark data must NOT live in the root `skills/` directory. These are Astro-served static content for the website, not part of the skill packages:

| File/Directory | Current Location | New Location | Why Move |
|---------------|-----------------|--------------|----------|
| `benchmark-all-skills.json` | `public/skills/` | `public/benchmarks/` | Not a skill; confuses CLI discovery |
| `benchmark-all-skills.md` | `public/skills/` | `public/benchmarks/` | Not a skill; confuses CLI discovery |
| `grading-summary.json` | `public/skills/` | `public/benchmarks/` | Not a skill; confuses CLI discovery |
| `*-workspace/` directories | `public/skills/` | `public/benchmarks/` | Contain eval results, inflate download size |

The workspace directories (`compose-validator-workspace/`, etc.) contain eval results and test fixtures. Keeping them inside `skills/` would cause problems:
1. The CLI may attempt to treat workspace directories as skills during recursive scanning
2. They inflate the clone size for skill consumers who just want SKILL.md + hooks
3. They are website content (benchmark data), not agent skill content

### Structure Rationale

- **`skills/` at root:** Matches the skills.sh Tier 2 convention. Every major skills repo uses `skills/` at root. This is the de facto standard.
- **Symlink `public/skills`:** Zero-cost bridge between two consumers. One source of truth, two access paths. Git tracks symlinks natively (stored as text files pointing to target).
- **`public/benchmarks/` separated:** Keeps the skills directory pristine for CLI consumers while preserving web-accessible benchmark data at new URLs.

## Architectural Patterns

### Pattern 1: Symlink Bridge (Single Source of Truth)

**What:** Use a filesystem symlink to serve the same files through two channels (skills.sh CLI discovery + Astro static site) without duplication.

**When to use:** When the same content must be discoverable by both a package manager (skills.sh scans the git repo) and a static site generator (Astro copies from `public/`).

**Trade-offs:**
- Pro: No file duplication, single edit point, guaranteed consistency
- Pro: Git tracks symlinks natively (stored as a text file containing the target path)
- Pro: GitHub Actions on Ubuntu resolves symlinks during Astro build
- Con: Windows developers need `git config core.symlinks true` (not an issue for this project -- CI runs Ubuntu)
- Con: Some CI environments may not resolve symlinks, but `withastro/action@v3` on `ubuntu-latest` does

**Implementation:**
```bash
# After moving skills to root
cd /path/to/PatrykQuantumNomad

# Create symlink (public/skills points to ../skills)
ln -s ../skills public/skills

# Git commits the symlink as a text file
git add public/skills
git status
# modified:   public/skills (typechange from directory to symlink)
```

### Pattern 2: Frontmatter-Only Discovery (Progressive Loading)

**What:** The skills.sh CLI uses progressive loading: only YAML frontmatter (`name` and `description`) is scanned during the browse phase. Full SKILL.md content loads on-demand when a user selects a skill. Supporting files (`hooks/`, `scripts/`) are accessed only during the use phase when the agent follows instructions referencing them.

**When to use:** Understanding this pattern means the existing large SKILL.md files (19-31 KB each) are perfectly fine. No need to split or truncate.

**Trade-offs:**
- Pro: Large, comprehensive SKILL.md files do not slow discovery or listing
- Pro: The `description` field in frontmatter is the critical trigger -- it must be comprehensive enough for agents to know when to activate
- Con: The `description` field must fit the browsing context (agents read it to decide relevance)

**Current frontmatter (already correct):**
```yaml
---
name: gha-validator
description: >
  Analyze GitHub Actions workflow files for security vulnerabilities, semantic
  errors, best-practice violations, schema issues, and style problems...
---
```

### Pattern 3: Convention-Over-Configuration for Skill Layout

**What:** Each skill is a self-contained directory: `SKILL.md` at root, optional `hooks/`, `scripts/`, `templates/`, `resources/` subdirectories. The directory name must match the frontmatter `name` field (lowercase, hyphens allowed, no uppercase).

**When to use:** Always follow this convention for skills.sh compatibility.

**Current skill structure (already correct -- no changes needed within individual skills):**
```
gha-validator/          # directory name matches frontmatter name
├── SKILL.md            # name: gha-validator
└── hooks/
    └── validate-gha.sh # referenced by SKILL.md instructions
```

All 4 existing skills already follow this convention perfectly.

## Data Flow

### Skill Discovery Flow (skills.sh CLI)

```
User runs: npx skills add PatrykQuantumNomad/PatrykQuantumNomad
    |
CLI clones repo to temp directory
    |
discoverSkills() scans:
  Tier 1: root SKILL.md?  -> NO
  Tier 2: skills/ exists? -> YES, 4 subdirectories found
    |
Each subdirectory checked for SKILL.md with valid frontmatter
    |
CLI presents skill list:
  1. compose-validator
  2. dockerfile-analyzer
  3. gha-validator
  4. k8s-analyzer
    |
User selects skill(s) or uses --skill flag
    |
CLI copies/symlinks to target:
  ~/.agents/skills/{name}/    (canonical)
  ~/.claude/skills/{name}/    (Claude Code symlink)
  .codex/skills/{name}/       (Codex symlink)
    |
Install telemetry -> skill appears on skills.sh directory
  URL: skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/{skill-name}
```

### Astro Static Serving Flow

```
npm run build (astro build)
    |
Astro scans public/ directory
    |
Encounters public/skills (symlink -> ../skills/)
    |
Resolves symlink, copies all skill files to dist/skills/
    |
dist/skills/gha-validator/SKILL.md        -> served as static file
dist/skills/gha-validator/hooks/validate-gha.sh -> served as static file
    |
GitHub Pages deploys dist/
    |
patrykgolabek.dev/skills/gha-validator/SKILL.md -> downloadable
```

### Cross-Reference Flow (Tool Pages to Skills)

```
User visits: patrykgolabek.dev/tools/gha-validator/
    |
src/pages/tools/gha-validator/index.astro renders
    |
Page includes download link:
  <a href="/skills/gha-validator/SKILL.md" download="SKILL.md">
    |
Link resolves to static file served from dist/skills/
    |
User can ALSO install via CLI:
  npx skills add PatrykQuantumNomad/PatrykQuantumNomad -s gha-validator
```

### Key Data Flows

1. **Skill authoring:** Edit `skills/*/SKILL.md` -> git push -> triggers Astro rebuild (GitHub Pages) AND makes skills available for CLI install (skills.sh scans the git repo directly)
2. **Web serving:** `skills/` -> symlink -> `public/skills/` -> Astro build -> `dist/skills/` -> GitHub Pages
3. **CLI install:** GitHub repo clone -> `npx skills add` -> scans `skills/` -> installs to user's agent config directories
4. **Telemetry loop:** User installs via CLI -> anonymous telemetry -> skill appears on skills.sh leaderboard -> more visibility -> more installs

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| skills.sh directory | Automatic via install telemetry | No registration or publish step. Skills appear at `skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/{skill-name}` when users install via CLI |
| GitHub Pages | Astro static build via `withastro/action@v3` | Symlink resolved at build time. Existing workflow completely unchanged |
| Claude Code | Users install with `npx skills add` | Skill lands in `.claude/skills/` or `~/.claude/skills/` |
| OpenAI Codex CLI | Users install with `npx skills add` | Skill lands in `.codex/skills/` |
| GitHub Copilot | Users install with `npx skills add` | Skill lands in `.github/skills/` |
| Gemini CLI | Users install with `npx skills add` | Skill lands in `.agents/skills/` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `skills/` <-> `public/skills` | Filesystem symlink | One-way: `public/skills` reads from `skills/`. Never edit in `public/skills/` directly (it is a symlink) |
| `src/pages/tools/` <-> static skills | HTTP URL reference (`/skills/*/SKILL.md`) | Tool pages link to skills for download. URL path unchanged after migration |
| `public/benchmarks/` <-> skills | None (fully decoupled) | Benchmark data references skill names by convention but lives in separate directory |
| `README.md` <-> skills.sh | Text reference | README should include `npx skills add` command and link to skills.sh pages |

## Anti-Patterns

### Anti-Pattern 1: Duplicating Files Instead of Symlinking

**What people do:** Copy SKILL.md files to both `skills/` and `public/skills/` to serve both purposes.
**Why it's wrong:** Two copies drift out of sync. One edit fixes the CLI version but the website serves stale content (or vice versa). Git diff noise doubles. Merge conflicts multiply.
**Do this instead:** Single source of truth in `skills/`, symlink from `public/skills`.

### Anti-Pattern 2: Putting Workspace/Benchmark Data in `skills/`

**What people do:** Keep `*-workspace/` directories and `benchmark-*.json` alongside SKILL.md files in the skills directory.
**Why it's wrong:** `npx skills add` discovery scans subdirectories under `skills/`. Workspace directories would be listed as potential skills (they contain no `SKILL.md` so they would be skipped, but it adds noise and confusion). The workspace dirs contain eval results (JSON, timing data, model outputs) that are irrelevant to skill consumers and inflate clone/download size.
**Do this instead:** Move benchmark/workspace data to `public/benchmarks/`. Keep `skills/` with only the 4 skill directories.

### Anti-Pattern 3: Using `.claude-plugin/marketplace.json` for Discovery

**What people do:** Create plugin manifest files to explicitly declare skill locations in non-standard paths.
**Why it's wrong:** Unnecessary complexity. The standard `skills/` convention provides Tier 2 discovery automatically. A manifest is only useful for non-standard layouts and creates another file to maintain with no benefit.
**Do this instead:** Put skills in `skills/` and let convention handle discovery.

### Anti-Pattern 4: Leaving Skills in `public/skills/` Without Moving

**What people do:** Leave skills in `public/skills/` and rely on the recursive fallback (Tier 3) to find them.
**Why it's wrong:** Tier 3 is a fallback, not the expected path. It is slower (scans entire repo tree including `node_modules/`, `handbook/`, etc.). It signals unfamiliarity with the ecosystem convention. Future CLI versions could change recursive scanning behavior.
**Do this instead:** Use `skills/` at root -- the standard, expected, documented location.

### Anti-Pattern 5: Creating a Separate Repository for Skills

**What people do:** Create `PatrykQuantumNomad/devops-skills` as a dedicated skills repository, separate from the profile repo.
**Why it's wrong for this case:** With only 4 skills, a separate repo fragments discoverability. The profile repo URL (`PatrykQuantumNomad/PatrykQuantumNomad`) is memorable, directly associated with the author, and already has traffic. The skills add professional value to the profile repo. A separate repo would only make sense at 20+ skills.
**Do this instead:** Keep skills in the profile repo. The `skills/` directory coexists cleanly with Astro, README.md, and other profile content.

## Migration Checklist

### New Components

| Component | Type | Description |
|-----------|------|-------------|
| `skills/` (root directory) | **NEW** | Root-level skills directory containing 4 skill subdirectories |
| `public/benchmarks/` | **NEW** | New home for benchmark data and workspace eval directories |

### Modified Components

| Component | Change | Risk |
|-----------|--------|------|
| `public/skills/` | Directory replaced by symlink to `../skills/` | LOW -- Astro resolves symlinks; `withastro/action@v3` runs on Ubuntu which handles symlinks natively |
| `README.md` | Add skills.sh install instructions and badge | NONE -- additive text change |

### Unmodified Components

| Component | Why No Change |
|-----------|---------------|
| `astro.config.mjs` | Static output mode, no skills-specific config. `public/` handling is built-in |
| `src/pages/tools/*/index.astro` | Download links use `/skills/*/SKILL.md` -- URL path unchanged |
| `.github/workflows/deploy.yml` | `withastro/action@v3` handles symlinks in `public/` |
| `package.json` | No new dependencies for skill publishing |
| `.gitignore` | No new patterns needed |
| Individual SKILL.md files | Content and frontmatter already follow skills.sh convention |
| Individual hooks/*.sh files | Already correctly located within skill directories |

## Build Order

The migration has dependency ordering. Steps 1-3 must happen together in a single commit to avoid broken state.

1. **Create `skills/` at root** -- `mkdir skills/`
2. **Move the 4 skill directories** -- `mv public/skills/{compose-validator,dockerfile-analyzer,gha-validator,k8s-analyzer} skills/`
3. **Create `public/benchmarks/`** and move non-skill files -- `mv public/skills/{benchmark-*,grading-summary.json,*-workspace} public/benchmarks/`
4. **Replace `public/skills/` directory** with symlink -- `rm -rf public/skills && ln -s ../skills public/skills`
5. **Update internal references** -- check if any code references `public/skills/benchmark-*` or `public/skills/grading-summary.json` and update paths to `public/benchmarks/`
6. **Verify Astro build** -- `npm run build` should produce `dist/skills/` with all 4 skill directories
7. **Verify skills.sh discovery** -- `npx skills add . --list` from repo root should find exactly 4 skills
8. **Update README.md** -- add skills.sh install command block
9. **Test download links** on local dev server -- `localhost:4321/skills/gha-validator/SKILL.md` should serve content

## Scaling Considerations

| Concern | Current (4 skills) | At 10-20 skills | At 50+ skills |
|---------|---------------------|------------------|---------------|
| Repo size | Negligible (~100KB total for all skills) | Still fine, SKILL.md files are text | Consider dedicated skills repo |
| Astro build time | No impact (public/ files are copied, not processed) | No impact | Minimal impact |
| skills.sh listing | 4 entries under one repo | Manageable, good for brand coherence | Split into themed repos |
| Symlink approach | Clean and simple | Still clean | May want selective symlinks |

### Scaling Priority

The 4-skill profile repo is well within the sweet spot. The only inflection point would be at ~20+ skills, where a dedicated `PatrykQuantumNomad/devops-skills` repository might make sense for organizational clarity. For 4 skills, keeping them in the profile repo maximizes discoverability -- the profile repo URL is memorable and directly associated with the author identity.

## Verification Steps

After migration, confirm these three paths all work:

1. **skills.sh CLI discovery:** `npx skills add . --list` from repo root shows exactly 4 skills
2. **Astro static build:** `npm run build && ls dist/skills/*/SKILL.md` shows 4 SKILL.md files
3. **Dev server:** `npm run dev` then visit `localhost:4321/skills/gha-validator/SKILL.md` returns content
4. **Git status clean:** `git status` shows the symlink tracked correctly (typechange for `public/skills`)

## Sources

- [vercel-labs/skills -- The open agent skills tool](https://github.com/vercel-labs/skills) -- CLI source code and three-tier discovery strategy
- [Vercel KB -- Agent Skills: Creating, Installing, and Sharing](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context) -- Publishing convention (`skills/` directory, no publish step)
- [anthropics/skills -- Public skills repository](https://github.com/anthropics/skills) -- Reference implementation of `skills/` directory layout (84.5k stars)
- [DeepWiki -- vercel-labs/skills](https://deepwiki.com/vercel-labs/skills) -- Three-tier search strategy: direct check, priority directories, recursive fallback
- [DeepWiki -- Skill Directory Structure](https://deepwiki.com/heilcheng/awesome-agent-skills/2.3-skill-directory-structure) -- Required SKILL.md format, optional subdirectories (scripts/, templates/, resources/)
- [skills.sh FAQ](https://skills.sh/docs/faq) -- Skills appear via install telemetry, no publish step
- [Astro Docs -- Project Structure](https://docs.astro.build/en/basics/project-structure/) -- `public/` directory copies files verbatim to build output
- [skills.sh -- find-skills listing page](https://skills.sh/vercel-labs/skills/find-skills) -- Reference for how skill pages appear (install command, stats, documentation)

---
*Architecture research for: skills.sh publishing from Astro profile repo*
*Researched: 2026-03-05*
