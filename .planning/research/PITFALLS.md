# Pitfalls Research

**Domain:** Publishing existing SKILL.md files to skills.sh from a GitHub profile repo
**Researched:** 2026-03-05
**Confidence:** HIGH (skills.sh CLI behavior, SKILL.md spec, Claude Code discovery), MEDIUM (multi-line frontmatter bug status, context budget edge cases)

## Critical Pitfalls

### Pitfall 1: Skills Live in `public/skills/` -- Not Discoverable by skills.sh CLI

**What goes wrong:**
The 4 SKILL.md files currently live at `public/skills/<name>/SKILL.md` (e.g., `public/skills/gha-validator/SKILL.md`). The skills.sh CLI (`npx skills add`) searches for skills in specific standard directories: root-level `skills/`, `.claude/skills/`, `.agents/skills/`, and agent-specific paths. It does NOT search `public/skills/`. When someone runs `npx skills add PatrykQuantumNomad/PatrykQuantumNomad`, the CLI finds zero skills because none are in a recognized location. The fallback recursive search may eventually find them, but the path `public/skills/` is Astro-specific (a static asset directory) and not a standard skills location -- the CLI may skip it or fail to resolve it correctly.

**Why it happens:**
The skills were originally created as Astro static assets to be served on the portfolio website, not as installable skill packages. The `public/` directory is an Astro convention for assets served at the root URL path. The skills.sh CLI has no knowledge of Astro or static site generators.

**How to avoid:**
Move (or symlink/copy) the 4 skill directories to the root-level `skills/` directory, which is the primary standard location the CLI searches:
```
skills/
  gha-validator/
    SKILL.md
    hooks/validate-gha.sh
  dockerfile-analyzer/
    SKILL.md
    hooks/validate-dockerfile.sh
  compose-validator/
    SKILL.md
    hooks/validate-compose.sh
  k8s-analyzer/
    SKILL.md
    hooks/validate-k8s.sh
```
If both locations are needed (Astro serving AND skills.sh distribution), use one as the source of truth and symlink the other, or restructure the Astro config to reference `skills/` instead of `public/skills/`.

**Warning signs:**
- `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --list` shows no skills or unexpected results
- Skills do not appear on skills.sh leaderboard despite installations
- Users report "no skills found" when trying to install

**Phase to address:** Phase 1 (Directory restructuring). This must be the first thing done -- nothing else works until the directory location is correct.

---

### Pitfall 2: Multi-line YAML Folded Scalar (`>`) Description Breaks Claude Code Discovery

**What goes wrong:**
All 4 SKILL.md files use the YAML folded scalar indicator (`>`) for the `description` field:
```yaml
description: >
  Analyze GitHub Actions workflow files for security vulnerabilities, semantic
  errors, best-practice violations...
```
This is valid YAML per the spec, but Claude Code's frontmatter parser has a documented bug (issues [#9817](https://github.com/anthropics/claude-code/issues/9817), [#4700](https://github.com/anthropics/claude-code/issues/4700), [#9068](https://github.com/anthropics/claude-code/issues/9068)) where multi-line description values cause skills to be **silently not discovered**. No error message is shown. The skill simply does not appear in Claude Code's available skills list. Users who install these skills via `npx skills add` into their `.claude/skills/` directory will find that Claude Code never triggers them.

**Why it happens:**
Claude Code's internal YAML frontmatter parser does not correctly handle all valid YAML multi-line string formats. The `>` folded scalar, `|` literal scalar, and indented continuation formats have all been reported as problematic. Standard YAML parsers (Python's `yaml.safe_load`, JS `js-yaml`) handle these correctly, but Claude Code's parser is more restrictive.

**How to avoid:**
Rewrite all 4 SKILL.md frontmatter blocks to use single-line `description` values:
```yaml
---
name: gha-validator
description: Analyze GitHub Actions workflow files for security vulnerabilities, semantic errors, best-practice violations, schema issues, and style problems using 46 rules across 6 categories. Scores workflows 0-100 with letter grades. Generates fix recommendations with before/after YAML. Use when reviewing GitHub Actions workflows, CI/CD YAML, or .github/workflows files.
---
```
Yes, this means one very long line. This is the only format guaranteed to work across all consumers (Claude Code, Cursor, Codex CLI, skills.sh CLI).

**Warning signs:**
- Skills installed via `npx skills add` do not appear when asking Claude "What skills are available?"
- `/skills` command in Claude Code shows "No skills found"
- Skill works when invoked via `/skill-name` manually but Claude never auto-triggers it

**Phase to address:** Phase 1 (Frontmatter normalization). Must be done before any publishing or testing.

---

### Pitfall 3: SKILL.md Files Exceed 500-Line Recommended Limit (490-612 Lines Each)

**What goes wrong:**
The 4 SKILL.md files range from 490 to 612 lines (19-31KB each). The official Anthropic best practices documentation explicitly states: "Keep SKILL.md body under 500 lines for optimal performance." The Agent Skills specification recommends under 5,000 tokens for the instruction body. These files are comprehensive rule-set references containing 46-67 rules each with detailed tables, code examples, and scoring formulas. When Claude loads one of these skills, the entire SKILL.md body consumes context window tokens -- at ~30KB, a single skill could consume 7,000-10,000 tokens of the 200K window. With 4 skills loaded, that is 28,000-40,000 tokens of rule reference competing with conversation history, system prompts, and other context.

Current file sizes:
| Skill | Lines | Bytes | Estimated Tokens |
|-------|-------|-------|------------------|
| k8s-analyzer | 612 | 25,296 | ~8,000 |
| compose-validator | 565 | 22,637 | ~7,000 |
| dockerfile-analyzer | 532 | 30,761 | ~9,500 |
| gha-validator | 490 | 19,217 | ~6,000 |

**Why it happens:**
The skills were designed as self-contained rule-set documents. Each contains the complete rule table (all 46-67 rules with IDs, descriptions, severity levels, and categories), scoring methodology with category weights and deduction formulas, detailed fix examples with before/after code blocks, and a comprehensive "When to Activate" section. This design makes sense for a standalone reference but violates the progressive disclosure principle that skills are designed around.

**How to avoid:**
Apply the progressive disclosure pattern from the official best practices:
1. Keep SKILL.md under 500 lines with the core analysis process, scoring methodology summary, and when-to-activate triggers
2. Move the complete rule tables to `references/rules.md`
3. Move fix example templates to `references/fix-examples.md`
4. Move scoring formula details to `references/scoring.md`
5. Reference these files from SKILL.md so Claude loads them only when needed:
   ```markdown
   ## Complete Rule Reference
   For all rules with IDs, categories, and severities, see [references/rules.md](references/rules.md)
   ```

**Warning signs:**
- Claude Code auto-compaction triggers frequently when skills are loaded
- `/context` shows high token usage with skill content as a major contributor
- Claude "forgets" earlier conversation context after loading a skill
- Performance degrades with multiple skills loaded simultaneously

**Phase to address:** Phase 2 (Content restructuring). After directory and frontmatter fixes, but before publishing.

---

### Pitfall 4: Stale `--help` Skill Directory Pollutes the Repository

**What goes wrong:**
There is a `--help/SKILL.md` directory at the repo root containing a boilerplate/template skill with `name: --help` and `description: A brief description of what this skill does`. This appears to be an artifact from running `npx skills` with `--help` flag, which may have been misinterpreted as a skill name and created a scaffold directory. This directory will confuse the skills.sh CLI (the name `--help` contains two consecutive hyphens, which violates the naming spec), may cause CLI argument parsing errors (the directory name starts with `--`), and adds noise to skill listings.

**Why it happens:**
The `npx skills` CLI may have been invoked with `--help` in a context where it interpreted the flag as a skill creation target, or a skill scaffold/init command created a placeholder. The resulting directory name is problematic on multiple levels: it starts with `--` (can be interpreted as a CLI flag), contains consecutive hyphens (violates SKILL.md name spec), and the content is a template that was never customized.

**How to avoid:**
Delete the `--help/` directory entirely. Add a `.gitignore` entry if needed to prevent accidental recreation. Verify no other spurious skill directories exist at the root level.

**Warning signs:**
- `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --list` shows a `--help` skill
- CLI parsing errors when the `--help` directory name is interpreted as a flag
- Validation errors about consecutive hyphens in skill name

**Phase to address:** Phase 1 (Cleanup). Remove before any publishing activity.

---

### Pitfall 5: `hooks/` Directory Not in Agent Skills Standard -- May Not Be Portable

**What goes wrong:**
Each skill contains a `hooks/` subdirectory with validation shell scripts (`validate-gha.sh`, `validate-k8s.sh`, etc.). These are Claude Code-specific PostToolUse hooks -- they are NOT part of the Agent Skills open standard. The standard specifies `scripts/`, `references/`, and `assets/` as optional directories. When users install these skills in other agents (Cursor, Codex CLI, Windsurf, Copilot), the `hooks/` directory is meaningless and the shell scripts will not execute. Users may be confused by non-functional files. Additionally, the Claude Code `hooks` frontmatter field (which registers hooks in the skill lifecycle) is not present in the SKILL.md frontmatter, so even in Claude Code, these hooks may not auto-register correctly -- they would need to be configured in `.claude/settings.json` or via the `hooks` frontmatter field.

**Why it happens:**
The skills were developed for Claude Code specifically. Claude Code has a hooks system (PostToolUse, PreToolUse) that is a Claude Code extension, not part of the Agent Skills standard. The shell scripts rely on Claude Code's hook execution context.

**How to avoid:**
1. Keep the hooks for Claude Code users by documenting them clearly in SKILL.md ("Claude Code users can configure the included hook scripts for automated validation")
2. Rename `hooks/` to `scripts/` to match the Agent Skills standard directory convention
3. Add the `hooks` frontmatter field to SKILL.md if you want auto-registration in Claude Code:
   ```yaml
   hooks:
     PostToolUse:
       - matcher: Write
         command: "./hooks/validate-gha.sh"
   ```
4. Or document manual hook configuration instructions in SKILL.md
5. Add a `compatibility` frontmatter field: `compatibility: Hook scripts require Claude Code`

**Warning signs:**
- Users on non-Claude Code agents report "extra files" or "scripts that don't work"
- Claude Code users install the skill but hooks don't fire (not registered)
- Skill validation tools flag `hooks/` as a non-standard directory

**Phase to address:** Phase 2 (Portability). Address during content restructuring.

---

### Pitfall 6: GitHub Profile Repo as Skill Package Creates Discovery Noise

**What goes wrong:**
The PatrykQuantumNomad/PatrykQuantumNomad repo is a GitHub profile repo containing an Astro site with 1000+ pages, a handbook directory, benchmark data, workspace directories, and other non-skill content. When the skills.sh CLI clones or scans this repo to find skills, it must process the entire repository. If the recursive search fallback triggers (because skills are not in standard locations), the CLI may attempt to scan the entire `handbook/` directory (local copy of the NIST/SEMATECH website), `dist/` directory (which also contains SKILL.md copies), `node_modules/`, and other large directories. This creates:
- Slow installation times (large repo clone)
- Potential duplicate skill discovery (skills in both `public/skills/` and `dist/skills/`)
- False positives from benchmark/test SKILL.md files
- User confusion about which repo to point at

**Why it happens:**
The repo serves dual purposes: it is both a GitHub profile page (with Astro site) and a skill package source. These are fundamentally different use cases. Skills.sh expects lean repos focused on skill distribution. The handbook directory alone could be hundreds of MB.

**How to avoid:**
1. Put skills in the standard `skills/` root directory so the CLI finds them immediately without recursive scanning
2. Add `.gitignore` entries or ensure `dist/` remains gitignored (it is currently gitignored -- verify this stays true)
3. Consider a dedicated skills repo (`PatrykQuantumNomad/devops-skills`) if installation performance is a concern -- users install via `npx skills add PatrykQuantumNomad/devops-skills`
4. At minimum, document the install command clearly: `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill gha-validator` to target specific skills

**Warning signs:**
- Installation takes >30 seconds (large repo clone)
- Users see unexpected skills from test/benchmark directories
- Duplicate skills appear in listing
- Skills from `dist/` shadow skills from the source directory

**Phase to address:** Phase 1 (Directory structure). Proper `skills/` placement eliminates recursive scanning.

---

### Pitfall 7: Description Field Used for Routing -- Keyword Quality Determines Discoverability

**What goes wrong:**
The skill `description` field is not just metadata -- it is the primary routing mechanism that determines when Claude (and other agents) auto-trigger the skill. The current descriptions are comprehensive (700-920 characters each) but include phrases like "Use this skill PROACTIVELY whenever a user shares..." which is first-person instruction language. The official best practices explicitly warn: "Always write in third person. The description is injected into the system prompt, and inconsistent point-of-view can cause discovery problems." Additionally, descriptions that are too long may be truncated by some agents or fail to match keyword searches effectively.

Current description issues:
- All 4 use first/second person framing ("Use this skill PROACTIVELY whenever a user...")
- Descriptions are 700-920 characters (within 1024 limit but longer than typical -- most published skills use 100-300 characters)
- Include em dashes (--) which some parsers may handle inconsistently
- Include trigger instructions that should be in the SKILL.md body, not the description

**Why it happens:**
The descriptions were written to maximize Claude Code's auto-invocation -- they serve as detailed trigger instructions. This is effective for local Claude Code usage but inappropriate for the `description` frontmatter field, which should be a concise third-person summary for multi-agent discovery.

**How to avoid:**
Rewrite descriptions in third-person, under 300 characters, focusing on what the skill does and key trigger terms:
```yaml
description: Analyzes GitHub Actions workflow files for security vulnerabilities, semantic errors, and best-practice violations. Scores workflows 0-100 with letter grades. Use when reviewing .github/workflows YAML or CI/CD configurations.
```
Move the detailed "PROACTIVELY activate when..." trigger instructions into the "When to Activate" section of the SKILL.md body, where they belong.

**Warning signs:**
- Claude triggers skills inconsistently across different models (Haiku vs Opus)
- skills.sh search does not surface the skills for relevant queries
- Other agents (Cursor, Codex) do not discover the skills when they should
- Description appears truncated in skills.sh listings

**Phase to address:** Phase 1 (Frontmatter normalization). Must be done alongside the multi-line YAML fix.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep skills in `public/skills/` instead of `skills/` | No Astro config changes needed | Skills.sh CLI cannot find them; not installable | Never for publishing -- must move to `skills/` |
| Keep multi-line `>` YAML descriptions | Prettier formats nicely | Claude Code silently ignores the skill (bug #9817) | Never -- use single-line descriptions |
| Ship 500+ line SKILL.md files as-is | No restructuring work | Consumes excessive context; degrades agent performance | MVP only -- restructure before promoting to users |
| Keep `hooks/` instead of `scripts/` | No renaming required | Non-portable; not recognized by Agent Skills spec | Acceptable if documenting Claude Code dependency |
| Symlink `skills/` to `public/skills/` | Both locations work | Symlinks can break across OS, git may not preserve them | Acceptable as temporary solution; prefer config change |
| Keep first-person description language | Works for Claude Code auto-invocation | Fails third-person requirement; inconsistent across agents | Never for publishing |
| Leave `--help/` directory in repo | No cleanup effort | Pollutes skill listings; validation errors | Never -- must delete |
| Keep benchmark data alongside skills | Convenient for development | Inflates repo clone time; may cause false skill discovery | Acceptable if skills are in standard location (no recursive scan) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| skills.sh CLI + GitHub profile repo | Assuming CLI searches all directories | Place skills in root `skills/` directory -- the standard search path |
| npx skills add + symlinks | Using symlink installation on platforms that do not follow symlinks (Cursor) | Use `--copy` flag for Cursor; symlinks work for Claude Code |
| Claude Code + multi-line frontmatter | Using `>`, `|`, or indented continuation for description values | Single-line description string only; avoid Prettier reformatting |
| Agent Skills spec + Claude Code hooks | Putting hooks in `hooks/` directory and expecting auto-registration | Use `hooks` frontmatter field or `.claude/settings.json` for registration |
| skills.sh leaderboard + install telemetry | Expecting skills to appear immediately after publishing | Skills appear only after user installations are tracked via CLI telemetry |
| skills.sh + large repo | Hosting skills in a repo with large non-skill assets (handbook, node_modules) | Use `.gitignore` properly; place skills in standard location to prevent recursive scanning |
| Multiple agents + `allowed-tools` field | Specifying Claude Code tool names (Read, Write, Grep) in frontmatter | `allowed-tools` is experimental and agent-specific; only use if targeting Claude Code |
| Agent Skills validation + extra frontmatter keys | Adding `version`, `author`, or `category` to frontmatter | Only `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility` are allowed; extra keys cause validation failure |
| skills.sh + `dist/` directory | Forgetting that `dist/` contains built copies of skills | Ensure `dist/` is gitignored; it is currently, but verify during restructuring |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 30KB SKILL.md loaded into context | Claude forgets earlier conversation; auto-compaction triggers | Progressive disclosure: main file <500 lines, rules in `references/` | Always -- each skill consumes ~7-10K tokens |
| 4 skills loaded simultaneously | 28-40K tokens consumed by skill content alone | Only load skill content on-demand (default behavior); but descriptions alone are ~3K chars | With very long descriptions (700-920 chars each) |
| Large repo clone for skill installation | `npx skills add` takes 30+ seconds | Place skills in standard `skills/` directory; consider dedicated repo | When handbook + node_modules + dist are all present |
| Recursive skill search fallback | CLI scans entire repo tree including handbook (1000+ pages) | Standard directory placement prevents fallback | When skills are not in any recognized path |
| Multiple description character budget exceeded | Some skills silently excluded from Claude Code context | Keep descriptions under 300 chars; total budget is 2% of context window (~16K chars fallback) | With 40+ skills installed, or very long descriptions |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Distributing shell scripts (hooks/*.sh) without review guidance | Users install and trust executable scripts from unknown repos | Add security notice in README; document what each script does; recommend review before enabling |
| Hook scripts with broad filesystem access | PostToolUse hooks execute on every tool call matching the pattern | Scope hook matchers narrowly (e.g., only `Write` for files matching `*.yml`) |
| Skill description used as injection vector | Malicious descriptions could manipulate agent behavior | Keep descriptions factual and third-person; avoid instruction-like language in description field |
| Publishing internal/workspace paths in SKILL.md | Leaks local development environment details | Audit SKILL.md content for absolute paths, usernames, or local directory references |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No README with install instructions | Users do not know how to install or use the skills | Add clear README with `npx skills add PatrykQuantumNomad/PatrykQuantumNomad` command and per-skill descriptions |
| Skills work in Claude Code but not other agents | Users on Cursor/Codex/Windsurf get degraded experience | Test with at least 2-3 agents; document Claude Code-specific features (hooks) separately |
| No skill preview/demo | Users cannot evaluate skill quality before installing | Add example input/output in README or in a `references/examples.md` within each skill |
| Hook auto-registration not documented | Claude Code users install skill but hooks do not activate | Document explicit hook setup steps or use `hooks` frontmatter field |
| Monolithic SKILL.md overwhelms context | Agent performance degrades; users notice slower/worse responses | Split into progressive disclosure structure with references |

## "Looks Done But Isn't" Checklist

- [ ] **Directory location:** Skills are in root `skills/` directory, not `public/skills/` -- verify with `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --list`
- [ ] **Frontmatter format:** All descriptions are single-line strings (no `>`, `|`, or indented continuation) -- verify by checking Claude Code discovers them after local install
- [ ] **Description content:** Written in third person, under 1024 characters, includes trigger keywords -- verify descriptions do not start with "Use this skill..." or "I can..."
- [ ] **Name matches directory:** Each `name` field exactly matches its parent directory name -- verify `gha-validator/SKILL.md` has `name: gha-validator`
- [ ] **No forbidden frontmatter keys:** Only `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility` present -- verify with `npx skills-ref validate ./skills/gha-validator` or manual check
- [ ] **SKILL.md under 500 lines:** Main instruction file is under 500 lines -- verify with `wc -l skills/*/SKILL.md`
- [ ] **No stale artifacts:** `--help/` directory removed, no duplicate skills in `dist/` or `public/skills/` -- verify with `find . -name SKILL.md`
- [ ] **Hooks documented:** If hooks are included, installation/setup instructions explain how to activate them -- verify Claude Code hook registration
- [ ] **Install command works:** `npx skills add PatrykQuantumNomad/PatrykQuantumNomad` successfully lists and installs all 4 skills
- [ ] **skills.sh listing:** After installations, skills appear on skills.sh (may take time for telemetry to propagate)
- [ ] **Multi-agent testing:** Skills load and trigger correctly in at least Claude Code and one other agent
- [ ] **Benchmark data excluded:** Benchmark JSON/MD files in workspace directories are not picked up as skill content

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Skills in wrong directory (`public/skills/`) | LOW | Move 4 directories to `skills/`; update Astro config if needed to reference new location. ~30 minutes. |
| Multi-line YAML descriptions | LOW | Rewrite 4 frontmatter blocks to single-line. ~15 minutes per skill (verify description content too). |
| SKILL.md over 500 lines | MEDIUM | Extract rule tables and examples to `references/` files; rewrite SKILL.md as navigation hub. ~2-4 hours for all 4 skills. |
| `--help/` directory in repo | LOW | `rm -rf -- "--help/"` and commit. ~2 minutes. |
| First-person descriptions | LOW | Rewrite 4 descriptions in third person. ~30 minutes total. |
| Hooks not registering | LOW | Add `hooks` frontmatter field or document manual setup. ~15 minutes per skill. |
| Large repo causing slow installs | MEDIUM | Create dedicated `PatrykQuantumNomad/devops-skills` repo; or accept slower installs with proper `skills/` placement. ~1 hour for new repo. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1: Wrong directory location | Phase 1 (Directory restructuring) | `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --list` shows all 4 skills |
| P2: Multi-line YAML descriptions | Phase 1 (Frontmatter normalization) | Claude Code discovers all skills after local install; no `>` or `|` in frontmatter |
| P3: SKILL.md over 500 lines | Phase 2 (Content restructuring) | `wc -l skills/*/SKILL.md` shows all under 500 lines; `references/` directories exist |
| P4: Stale `--help/` directory | Phase 1 (Cleanup) | `find . -name SKILL.md` shows only 4 expected files in `skills/` |
| P5: Non-standard `hooks/` directory | Phase 2 (Portability) | Hook scripts documented; `compatibility` field added if hooks require Claude Code |
| P6: Large repo scanning noise | Phase 1 (Directory restructuring) | Standard `skills/` placement prevents recursive scanning; `dist/` remains gitignored |
| P7: First-person descriptions | Phase 1 (Frontmatter normalization) | All descriptions are third-person; under 300 characters recommended, under 1024 required |

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- official skill discovery paths, frontmatter reference, progressive disclosure, 500-line recommendation, `SLASH_COMMAND_TOOL_CHAR_BUDGET` (2% of context window)
- [Anthropic Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) -- under 500 lines, third-person descriptions, progressive disclosure patterns, anti-patterns
- [Agent Skills Specification (agentskills.io)](https://agentskills.io/specification) -- name constraints (kebab-case, 64 chars, no consecutive hyphens), description max 1024 chars, allowed frontmatter keys, directory structure, progressive disclosure (<5000 tokens recommended)
- [skills.sh CLI (vercel-labs/skills)](https://github.com/vercel-labs/skills) -- skill discovery paths (`skills/`, `.claude/skills/`, `.agents/skills/`, agent-specific paths), installation flow, `--list` and `--skill` flags

### Secondary (MEDIUM confidence)
- [Claude Code Bug #9817: Frontmatter sensitivity](https://github.com/anthropics/claude-code/issues/9817) -- multi-line YAML descriptions silently break skill discovery; closed as duplicate of #4700; not confirmed fixed
- [Claude Code Bug #4700: YAML parsing fails with line breaks](https://github.com/anthropics/claude-code/issues/4700) -- root issue for multi-line frontmatter parsing; related issues #9068, #7943
- [Anthropic Skills Issue #37: Frontmatter validation](https://github.com/anthropics/skills/issues/37) -- only `name`, `description`, `license`, `allowed-tools`, `metadata` allowed; extra keys (`version`, `author`, `category`) cause validation failure
- [Vercel KB: Agent Skills Guide](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context) -- "no special publish command"; leaderboard via install telemetry; name must match directory name
- [skills-best-practices (mgechev)](https://github.com/mgechev/skills-best-practices) -- under 500 lines, <5000 tokens, third-person descriptions, negative triggers, JiT loading pattern
- [Claude Code Skills Troubleshooting blog](https://blog.fsck.com/2025/12/17/claude-code-skills-not-triggering/) -- skill descriptions budget scaling at 2% of context window, ~42 skills at 263 chars each fit in default budget
- [Cursor symlink bug](https://forum.cursor.com/t/skills-installed-by-skill-sh-will-not-be-found-if-use-symlink-method/151014) -- Cursor does not follow symlinks for skill discovery

### Tertiary (LOW confidence)
- [skills.sh FAQ](https://skills.sh/docs/faq) -- leaderboard ranking via anonymous telemetry; telemetry can be disabled
- [SKILL.md Format Specification (DeepWiki)](https://deepwiki.com/anthropics/skills/2.2-skill.md-format-specification) -- community documentation of the spec; validation rules including consecutive hyphen check

---
*Pitfalls research for: Publishing DevOps SKILL.md files to skills.sh from GitHub profile repo*
*Researched: 2026-03-05*
