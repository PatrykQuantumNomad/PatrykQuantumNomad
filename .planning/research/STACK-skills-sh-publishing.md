# Stack Research: skills.sh Publishing

**Domain:** Publishing DevOps SKILL.md files to skills.sh via Vercel Skills CLI
**Researched:** 2026-03-05
**Confidence:** HIGH

## Verdict: Zero Stack Additions Required

Publishing 4 existing SKILL.md files to skills.sh requires **no new npm dependencies, no build changes, and no new tooling**. The work is purely structural: move skill directories to the correct location, clean up non-skill artifacts, and verify discovery. The skills CLI runs via `npx` and does not need to be installed.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| skills CLI (`npx skills`) | 1.4.4 | Skill discovery, installation, and testing | The canonical CLI for the Agent Skills ecosystem by Vercel. No alternative needed. Version confirmed 2026-03-05 via `npm view skills version`. |
| Agent Skills Spec | 1.0 | SKILL.md format standard | Open standard at agentskills.io adopted by Claude Code, Codex, GitHub Copilot, Cursor, and 37+ agents. Existing SKILL.md files already conform. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| skills-ref | latest | Frontmatter validation | Optional. Run `skills-ref validate ./skills/gha-validator` to verify SKILL.md passes spec validation before publishing. Not required -- manual verification is sufficient for 4 files. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npx skills add --list <owner/repo>` | Verify skill discovery | Run against your own repo URL post-push to confirm all 4 skills are discoverable. |
| `npx skills add <owner/repo> --skill <name>` | Test individual skill installation | Verify each skill installs correctly to Claude Code (or other agent). |
| `npx skills find` | Search skills.sh directory | Use post-publish to confirm your skills appear on the leaderboard. Appearance requires at least one install. |

## Installation

```bash
# No npm installation needed. Zero new dependencies.
# The skills CLI runs entirely via npx.

# Verify discovery (run after pushing restructured directory):
npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad

# Test install of a specific skill:
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill gha-validator

# Test install of ALL skills:
npx skills add PatrykQuantumNomad/PatrykQuantumNomad
```

## How skills.sh Publishing Actually Works

### Discovery Mechanism (HIGH confidence)

The skills CLI discovers SKILL.md files using a three-tier search strategy:

1. **Direct check**: Looks for SKILL.md in the repository root
2. **Priority directories**: Searches 34 hardcoded priority paths including `skills/`, `.claude/skills/`, `.agents/skills/`, and agent-specific directories
3. **Recursive fallback**: If no skills found in priority directories, recursively scans up to 5 levels deep (skipping `node_modules`, `.git`, `dist`, `build`, `__pycache__`)

**Critical finding:** `skills/` at repo root is a **priority directory**. `public/skills/` is NOT. Skills in `public/skills/` would only be found via the recursive fallback, which is slower and less reliable.

### Listing on skills.sh (HIGH confidence)

There is **no submission process, no registry, no approval flow, no manifest to file.**

1. Put SKILL.md files in a public GitHub repo with valid frontmatter
2. Share the install command: `npx skills add PatrykQuantumNomad/PatrykQuantumNomad`
3. When any user runs `npx skills add` for your repo, anonymous install telemetry is sent
4. Skills appear on skills.sh leaderboard ranked by aggregate install count
5. Per-agent install distribution is tracked (Claude Code, Codex, Cursor, etc.)

**Implication:** Skills will NOT appear on skills.sh until at least one person installs them. Initial visibility requires manual promotion.

### skills.sh URL Pattern

Each skill gets a page at:
```
https://skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/<skill-name>
```

Pages display: description, install command, weekly installs, GitHub stars, security audit status, and per-agent distribution.

### Install Command Formats

```bash
# All 4 skills at once
npx skills add PatrykQuantumNomad/PatrykQuantumNomad

# Specific skill by name
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill gha-validator

# Specific skill by GitHub path
npx skills add https://github.com/PatrykQuantumNomad/PatrykQuantumNomad/tree/main/skills/gha-validator

# List without installing
npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad
```

## Directory Structure: Current vs Required

### Current Structure (Suboptimal)

```
public/skills/                        # NOT a priority directory
  benchmark-all-skills.json           # Benchmark artifact (not a skill)
  benchmark-all-skills.md             # Benchmark artifact (not a skill)
  grading-summary.json                # Benchmark artifact (not a skill)
  compose-validator/
    SKILL.md                          # Valid skill
    hooks/validate-compose.sh         # Supporting script
  compose-validator-workspace/        # Test fixture (not a skill)
  dockerfile-analyzer/
    SKILL.md                          # Valid skill
    hooks/validate-dockerfile.sh      # Supporting script
  dockerfile-analyzer-workspace/      # Test fixture (not a skill)
  gha-validator/
    SKILL.md                          # Valid skill
    hooks/validate-gha.sh             # Supporting script
  gha-validator-workspace/            # Test fixture (not a skill)
  k8s-analyzer/
    SKILL.md                          # Valid skill
    hooks/validate-k8s.sh             # Supporting script
  k8s-analyzer-workspace/             # Test fixture (not a skill)
```

### Required Structure

```
skills/                               # Priority directory (immediate discovery)
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
```

### Why Move from `public/skills/` to `skills/`

| Reason | Detail |
|--------|--------|
| **Priority discovery** | `skills/` is one of 34 hardcoded priority directories in the CLI. `public/skills/` is not. Moving ensures immediate, deterministic discovery without relying on recursive fallback. |
| **Astro collision** | `public/` is Astro's static asset directory. Files there are copied to `dist/` and served by GitHub Pages. SKILL.md files are agent instructions, not web assets. |
| **Convention alignment** | Every major skill repository (vercel-labs/skills, vercel-labs/agent-skills, jeffallan/claude-skills) uses `skills/` at root. |
| **Artifact pollution** | The `*-workspace/` directories and `benchmark-*.json` files pollute the discovery namespace. A clean `skills/` directory contains only actual skills. |

## SKILL.md Validation Status

### Frontmatter Requirements (from agentskills.io/specification)

| Field | Required | Constraints | All 4 Skills |
|-------|----------|-------------|--------------|
| `name` | YES | 1-64 chars, lowercase + hyphens, regex `^[a-z0-9]+(-[a-z0-9]+)*$`, must match directory name | PASS |
| `description` | YES | 1-1024 chars, describes what + when to use | PASS |
| `license` | No | License name or file reference | Not set |
| `compatibility` | No | Max 500 chars, environment requirements | Not set |
| `metadata` | No | Arbitrary key-value map (author, version) | Not set |
| `allowed-tools` | No | Space-delimited tool list (experimental) | Not set |

### Name-Directory Match

| Directory | Frontmatter `name` | Valid? |
|-----------|---------------------|--------|
| `compose-validator` | `compose-validator` | YES |
| `dockerfile-analyzer` | `dockerfile-analyzer` | YES |
| `gha-validator` | `gha-validator` | YES |
| `k8s-analyzer` | `k8s-analyzer` | YES |

### File Size Assessment

| Skill | Lines | Recommended Max | Status |
|-------|-------|-----------------|--------|
| gha-validator | 490 | 500 | OK |
| dockerfile-analyzer | 532 | 500 | 32 lines over (acceptable) |
| compose-validator | 565 | 500 | 65 lines over (acceptable) |
| k8s-analyzer | 612 | 500 | 112 lines over (acceptable) |

The 500-line recommendation is a soft guideline for optimal context usage, not a hard limit. These are comprehensive rule-based analyzer skills where the complete rule set must be loaded into context for accurate analysis. Splitting into `references/` files would degrade skill quality because the agent needs all rules simultaneously during analysis.

**Recommendation:** Accept current sizes. Do NOT refactor into multi-file structure for initial publish.

## Artifacts to Clean Up

| File/Directory | Action | Reason |
|----------------|--------|--------|
| `public/skills/benchmark-all-skills.json` | Move to `.planning/benchmarks/` | Benchmark data, not a skill |
| `public/skills/benchmark-all-skills.md` | Move to `.planning/benchmarks/` | Benchmark report, not a skill |
| `public/skills/grading-summary.json` | Move to `.planning/benchmarks/` | Grading data, not a skill |
| `public/skills/*-workspace/` (4 dirs) | Move to `.planning/benchmarks/` or `tests/skills/` | Test fixtures with intentionally insecure example files |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `skills/` at repo root | `public/skills/` (current) | Never for skills.sh publishing. `public/` is for Astro static assets. |
| `skills/` at repo root | `.claude/skills/` | Only for project-internal skills not intended for public distribution via skills.sh. |
| No manifest file | `.claude-plugin/marketplace.json` | Only if building a Claude Code plugin package, which is a different distribution mechanism. |
| `npx skills` (Vercel) | `npx add-skill` (community fork) | Never -- smaller ecosystem, less adoption, not the canonical CLI. |
| `npx skills` (Vercel) | `skillpm` (npm-based) | Never -- different registry, different format expectations. |
| Keep `hooks/` subdirectory name | Rename to `scripts/` | Optional. The Agent Skills spec names the convention `scripts/` but the CLI does not enforce subdirectory names. `hooks/` works fine since SKILL.md references files by relative path. |

## What NOT to Do

| Avoid | Why | Do Instead |
|-------|-----|------------|
| Add `skills` to `package.json` | It runs via `npx`, not as a project dependency | Use `npx skills` directly |
| Create `.claude-plugin/marketplace.json` | Different ecosystem (Claude Code plugins). Adds unnecessary coupling and complexity. | Rely on standard `skills/` directory discovery |
| Create any `skills.json` or manifest file | Does not exist in the Agent Skills spec. The CLI discovers SKILL.md by directory traversal. | Proper directory structure is the manifest. |
| Run `npx skills init` | Overwrites existing SKILL.md content with a boilerplate template | Move existing files manually |
| Split SKILL.md into `references/` files | For analyzer skills, rules must all be in context simultaneously. Splitting degrades analysis quality. | Keep rule sets in the main SKILL.md |
| Add `astro.config.mjs` changes | Skills are not part of the Astro build pipeline. They are independent markdown files. | No config changes needed |
| Modify the build script | `npm run build` (Astro) does not need to process skills. Skills are consumed by agent CLIs, not the website. | Leave build scripts unchanged |
| Submit to skills.sh | There is no submission process. Skills appear automatically via install telemetry. | Share the install command and wait for installs. |
| Register on LobeHub, SkillsMP, or other marketplaces | Different ecosystems with different requirements. Out of scope for this milestone. | Focus on skills.sh only. |

## Stack Patterns

**If the goal is skills.sh visibility:**
- Move to `skills/` directory, push to main, share install command
- Add install badge to README.md for organic discovery
- Blog about the skills to drive initial installs (skills appear on leaderboard only after installs)

**If the goal is Claude Code project-internal use only:**
- Use `.claude/skills/` directory instead
- No skills.sh visibility needed
- Skills load automatically when working in the repo

**If the goal is both skills.sh AND project-internal:**
- Use `skills/` at root for skills.sh discovery
- Claude Code also discovers skills in `skills/` via its own search paths
- No duplication needed

## Version Compatibility

| Component | Version | Verified | Notes |
|-----------|---------|----------|-------|
| skills CLI | 1.4.4 | 2026-03-05 via npm | Current latest |
| Agent Skills Spec | 1.0 | 2026-03-05 via agentskills.io | Stable specification |
| Node.js | 18+ | Required by skills CLI | Already in CI |
| Git | Any | Required for repo cloning | Already available |

## Sources

- [Agent Skills Specification](https://agentskills.io/specification) -- Formal SKILL.md format: frontmatter fields, name validation regex, directory structure, progressive disclosure guidelines [HIGH confidence]
- [Vercel Skills CLI (GitHub)](https://github.com/vercel-labs/skills) -- Source code: 34 priority directories, recursive fallback to 5 levels, `discoverSkills()` in `src/skills.ts` [HIGH confidence]
- [Vercel KB: Agent Skills Guide](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context) -- No submission process, telemetry-based listing [HIGH confidence]
- [Vercel Blog: Agent Skills FAQ](https://vercel.com/blog/agent-skills-explained-an-faq) -- Skill package structure, naming conventions, multi-skill repos [HIGH confidence]
- [Claude Code Docs: Skills](https://code.claude.com/docs/en/skills) -- Claude Code discovery paths (personal, project, plugin), frontmatter reference, nested directory support [HIGH confidence]
- [skills.sh](https://skills.sh/) -- Leaderboard UI, 85K+ total skills indexed, no submission button [HIGH confidence]
- [npm: skills](https://www.npmjs.com/package/skills) -- Version 1.4.4 confirmed [HIGH confidence]
- [DeepWiki: vercel-labs/skills](https://deepwiki.com/vercel-labs/skills) -- Discovery internals, `findSkillDirs()` recursive logic [MEDIUM confidence]
- [Skills.sh Review (Toolworthy)](https://www.toolworthy.ai/tool/skills-sh) -- Anonymous telemetry listing mechanism [MEDIUM confidence]

---
*Stack research for: skills.sh publishing of DevOps SKILL.md files*
*Researched: 2026-03-05*
