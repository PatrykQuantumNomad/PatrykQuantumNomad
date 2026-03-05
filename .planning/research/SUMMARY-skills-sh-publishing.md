# Project Research Summary: skills.sh Publishing

**Project:** v1.14 -- Publish DevOps Skills to skills.sh
**Domain:** AI Agent Skill publishing (Vercel Agent Skills ecosystem)
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

Publishing the 4 existing DevOps SKILL.md files (gha-validator, dockerfile-analyzer, compose-validator, k8s-analyzer) to skills.sh requires zero new dependencies, zero build changes, and zero new tooling. The work is purely structural: move skill directories from `public/skills/` to `skills/` at the repository root -- a Tier 2 priority directory in the skills CLI's three-tier discovery strategy -- and create a symlink from `public/skills` back to `../skills` so that Astro static serving continues unchanged. Non-skill artifacts (benchmarks, workspace directories) must be relocated to `public/benchmarks/` to keep the skills directory clean.

The recommended approach is a single atomic restructure: move the 4 skill directories, relocate benchmark artifacts, replace the `public/skills/` directory with a symlink, verify discovery via `npx skills add --list`, seed the first install to trigger skills.sh listing, and update README.md with install commands. All 4 SKILL.md files already have valid frontmatter, correct name-directory matches, and acceptable file sizes. The skills CLI runs via `npx` -- no `package.json` changes needed.

The primary risk is invisibility: skills will NOT appear on the skills.sh leaderboard until at least one user runs `npx skills add`. There is no submission process, no registry, and no approval flow. Listing is driven entirely by anonymous install telemetry. The mitigation is straightforward: seed the first install yourself after pushing, then promote the install command in README.md and blog posts. Secondary risks include hook scripts losing execute permissions during `git mv` and stale path references in documentation -- both easily detected and fixed.

## Key Findings

### Recommended Stack

No new dependencies. The skills CLI (`npx skills` v1.4.4) runs on-demand via npx and must not be added to `package.json`. The Agent Skills Specification v1.0 is the governing standard, already adopted by Claude Code, Codex, Cursor, Copilot, and 37+ agents. Existing SKILL.md files already conform.

**Core technologies:**
- **skills CLI (npx skills v1.4.4):** Skill discovery, installation, and testing -- the canonical Vercel CLI for the Agent Skills ecosystem
- **Agent Skills Spec 1.0:** Open standard for SKILL.md format -- existing files already conform, no changes needed

**Critical version notes:** Node.js 18+ required by the skills CLI (already present in CI).

### Expected Features

**Must have (table stakes):**
- All 4 skills discoverable via `npx skills add --list` -- requires correct `skills/` directory structure
- Individual skill install via `--skill` flag -- already supported when directory name matches frontmatter `name`
- Valid SKILL.md frontmatter -- already valid (`name` + `description` present and conformant)
- Cross-agent compatibility -- Agent Skills spec is agent-agnostic, SKILL.md content is universal
- README with install instructions -- add install badge and command examples

**Should have (differentiators -- already built):**
- Quantitative scoring (0-100 + letter grade) -- most DevOps skills give only qualitative advice
- Comprehensive rule sets (46-67 rules each) -- 3-10x more thorough than competitors
- Fix recommendations with before/after examples
- 4-tool cohesive DevOps suite -- complete linting stack in one install
- Proactive activation triggers via description keywords

**Defer (v2+):**
- `license` and `metadata` frontmatter fields (optional per spec, not blocking)
- Cross-marketplace publishing (LobeHub, SkillsMP -- different ecosystems)
- CI validation pipeline (overkill for 4 static files)
- SKILL.md splitting into `references/` (degrades quality for rule-based analyzers)

### Architecture Approach

The architecture uses a symlink bridge pattern: skills live in `skills/` at repo root (Tier 2 priority directory for CLI discovery), while `public/skills` is a symlink pointing to `../skills` so Astro copies the same files to `dist/skills/` during build. This creates a single source of truth serving two consumers -- the skills.sh CLI (scans the git repo) and GitHub Pages (serves static files). Benchmark and workspace artifacts move to `public/benchmarks/` to keep the skills directory pristine.

**Major components:**
1. **`skills/` (root)** -- Source of truth for 4 SKILL.md files + hooks scripts. NEW directory.
2. **`public/skills` (symlink)** -- Filesystem bridge from Astro's static directory to root `skills/`. Replaces the current directory.
3. **`public/benchmarks/`** -- New home for benchmark data and workspace eval directories. Keeps skills directory clean.
4. **`README.md`** -- Add `npx skills add` install command and skills.sh badge for organic discovery.

### Critical Pitfalls

1. **Name-directory mismatch** -- If `name` in frontmatter does not match directory name, the CLI silently skips the skill. Prevention: verify match after any move (all 4 currently pass).
2. **Workspace directories polluting discovery** -- `*-workspace/` directories co-located with skills confuse `--list` output. Prevention: move all non-skill artifacts to `public/benchmarks/`.
3. **Skills not appearing on skills.sh** -- Listing requires at least one install via `npx skills add`, not just pushing code. Prevention: seed the first install yourself after pushing.
4. **Hook scripts losing execute permissions** -- `git mv` or copy operations can strip the executable bit. Prevention: verify `chmod +x` on all `hooks/*.sh` files after move.
5. **Stale path references** -- README, CLAUDE.md, or `.planning/` docs still referencing `public/skills/`. Prevention: `grep -r "public/skills" .` after move and update all references.

## Implications for Roadmap

Based on research, this is a single-phase milestone with a strictly linear dependency chain. The work naturally divides into 3 sub-phases that must execute in order.

### Phase 1: Directory Restructure

**Rationale:** Everything depends on this. Discovery, verification, and promotion all require skills to be in the correct location first. Steps must happen in a single commit to avoid broken state.
**Delivers:** Skills in `skills/` at root, symlink bridge for Astro, benchmark artifacts relocated.
**Addresses:** Table stakes features (discoverability, correct directory structure).
**Avoids:** Pitfall 1 (name mismatch -- verify after move), Pitfall 2 (workspace pollution -- remove artifacts), Pitfall 6 (permission loss -- verify execute bits).

**Specific tasks:**
- Create `skills/` at root, move 4 skill directories from `public/skills/`
- Create `public/benchmarks/`, move benchmark/workspace artifacts
- Replace `public/skills/` directory with symlink to `../skills`
- Verify Astro build produces `dist/skills/` correctly
- Verify `npx skills add --list` finds exactly 4 skills
- Fix any stale path references (Pitfall 4)

### Phase 2: Discovery Verification and Seeding

**Rationale:** Cannot promote what is not verified. Must confirm discovery works and seed the first install to trigger skills.sh listing before updating public-facing documentation.
**Delivers:** Confirmed skills.sh listing, verified install flow for all 4 skills.
**Addresses:** Table stakes (cross-agent compatibility, individual skill install).
**Avoids:** Pitfall 3 (invisible on skills.sh -- seed first install).

**Specific tasks:**
- Run `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` to verify
- Test individual install with `--skill` flag for each skill
- Run install to seed telemetry and trigger skills.sh listing
- Verify skills.sh pages appear at expected URLs

### Phase 3: README and Promotion

**Rationale:** With verified, listed skills, update the public-facing profile to drive organic installs.
**Delivers:** README.md with install commands, skills.sh badge, and promotion content.
**Addresses:** Table stakes (README with install instructions), differentiator visibility.
**Avoids:** Pitfall 4 (stale documentation -- all references updated).

**Specific tasks:**
- Add `npx skills add` install command block to README.md
- Add skills.sh badge or link for organic discovery
- Update any blog references or CLAUDE.md references

### Phase Ordering Rationale

- **Strict linear dependency:** Directory structure must be correct before discovery can be verified. Discovery must be verified and seeded before promotion makes sense.
- **Single-commit atomic restructure:** Phase 1's file operations (move, symlink, cleanup) must land in one commit to avoid a broken intermediate state where Astro build fails.
- **Promotion last:** Sharing install commands before verifying discovery would embarrass the author if skills are not found.

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **All phases:** This is a well-documented, straightforward restructure. The skills CLI, Agent Skills spec, and Astro static serving are all thoroughly documented with HIGH confidence sources. No phase needs additional research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero dependencies needed. CLI version confirmed via npm. Spec is stable at 1.0. |
| Features | HIGH | All differentiators already built. Table stakes are structural only. |
| Architecture | HIGH | Symlink bridge pattern verified against Astro docs and skills CLI source code. Three-tier discovery confirmed via DeepWiki analysis of `discoverSkills()`. |
| Pitfalls | HIGH | All pitfalls have straightforward detection and prevention. No exotic failure modes. |

**Overall confidence:** HIGH

### Gaps to Address

- **Symlink on Windows:** `public/skills` symlink requires `git config core.symlinks true` on Windows. Not relevant for this project (CI runs Ubuntu, primary dev is macOS), but worth noting in documentation for contributors.
- **skills.sh listing latency:** Unknown how quickly skills appear on the leaderboard after the first install. Could be instant or have a delay. Verify empirically after seeding.
- **Benchmark URL change:** Moving benchmarks from `/skills/benchmark-*` to `/benchmarks/benchmark-*` changes public URLs. Check if any external links point to the old benchmark URLs (unlikely but worth a quick check).
- **Security audit badges:** skills.sh shows Agent Trust Hub, Socket, and Snyk audit status. Unclear whether audits are triggered automatically for public repos or require opt-in. Does not block publishing.

## Sources

### Primary (HIGH confidence)
- [Agent Skills Specification](https://agentskills.io/specification) -- Frontmatter format, name validation, directory structure
- [Vercel Skills CLI (GitHub)](https://github.com/vercel-labs/skills) -- Three-tier discovery, `discoverSkills()` source code, 34 priority directories
- [Vercel KB: Agent Skills Guide](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context) -- No submission process, telemetry-based listing, `skills/` convention
- [Claude Code Docs: Skills](https://code.claude.com/docs/en/skills) -- Discovery paths, context budget, frontmatter reference
- [skills.sh](https://skills.sh/) -- Leaderboard UI, 85K+ skills indexed, no submission button
- [npm: skills](https://www.npmjs.com/package/skills) -- Version 1.4.4 confirmed 2026-03-05
- [Astro Docs: Project Structure](https://docs.astro.build/en/basics/project-structure/) -- `public/` copies files verbatim to build output

### Secondary (MEDIUM confidence)
- [DeepWiki: vercel-labs/skills](https://deepwiki.com/vercel-labs/skills) -- Discovery internals, recursive fallback logic
- [SmartScope: Agent Skills troubleshooting](https://smartscope.blog/en/blog/agent-skills-guide/) -- Common SKILL.md loading failures
- [Skills.sh Review (Toolworthy)](https://www.toolworthy.ai/tool/skills-sh) -- Anonymous telemetry listing mechanism

---
*Research completed: 2026-03-05*
*Ready for roadmap: yes*
