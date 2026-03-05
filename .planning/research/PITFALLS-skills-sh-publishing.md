# Domain Pitfalls: skills.sh Publishing

**Domain:** Publishing DevOps SKILL.md files to skills.sh
**Researched:** 2026-03-05

## Critical Pitfalls

### Pitfall 1: Name-Directory Mismatch
**What goes wrong:** The `name` field in SKILL.md frontmatter does not match the parent directory name. The skills CLI silently skips the skill or throws `SkillInvalidError`.
**Why it happens:** Renaming a directory without updating frontmatter, or vice versa.
**Consequences:** Skill is invisible to discovery. `--list` shows nothing. No error message unless verbose mode is on.
**Prevention:** After any directory move/rename, verify that directory name exactly equals the `name` field value. Current state: all 4 skills pass (verified).
**Detection:** Run `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` and confirm 4 skills appear.

### Pitfall 2: Workspace Directories Discovered as Skills
**What goes wrong:** The `*-workspace/` directories (e.g., `gha-validator-workspace/`) contain test fixture YAML files but no SKILL.md. During recursive fallback, the CLI may scan into these directories and waste time or (if someone accidentally adds a SKILL.md) surface them as fake skills.
**Why it happens:** Test fixtures are co-located with skill directories in `public/skills/`.
**Consequences:** Confusing `--list` output, potential false discovery, users installing test fixtures.
**Prevention:** Move workspace directories out of the skill tree entirely (to `.planning/benchmarks/` or `tests/`). Never co-locate non-skill directories alongside skill directories.
**Detection:** `npx skills add --list` should show exactly 4 skills, not 8.

## Moderate Pitfalls

### Pitfall 3: Skills Not Appearing on skills.sh
**What goes wrong:** After pushing the restructured directory, skills don't appear on skills.sh leaderboard.
**Why it happens:** skills.sh listing requires at least one actual install via `npx skills add`. Pushing code alone does NOT trigger listing. The leaderboard is populated by anonymous install telemetry, not by crawling GitHub.
**Prevention:** After pushing, run `npx skills add PatrykQuantumNomad/PatrykQuantumNomad` yourself to register the first install. Then promote the install command.
**Detection:** Search skills.sh or use `npx skills find` for your skill names.

### Pitfall 4: Stale `public/skills/` Path in Documentation
**What goes wrong:** README, blog posts, or CLAUDE.md still reference `public/skills/` after the move. Users navigating the repo or following docs find nothing at the old path.
**Why it happens:** Forgetting to update all references when moving directories.
**Prevention:** After moving, search the entire repo for `public/skills` and update all references to `skills/`. Check README.md, CLAUDE.md, any blog post content, and .planning/ docs.
**Detection:** `grep -r "public/skills" .` in the repo root.

### Pitfall 5: SKILL.md Name Validation Failure
**What goes wrong:** The `name` field contains uppercase letters, consecutive hyphens, leading/trailing hyphens, or exceeds 64 characters. Validation fails.
**Why it happens:** Not knowing the exact regex: `^[a-z0-9]+(-[a-z0-9]+)*$`
**Prevention:** Current names (`gha-validator`, `k8s-analyzer`, `dockerfile-analyzer`, `compose-validator`) all pass. Do not rename with uppercase or special characters.
**Detection:** `skills-ref validate ./skills/<name>` or manual regex check.

### Pitfall 6: Hooks Scripts Losing Execute Permission
**What goes wrong:** After `git mv` or file operations, the `hooks/*.sh` scripts lose their executable bit. Agents that try to run these scripts get permission denied.
**Why it happens:** Some git operations or file copy tools don't preserve file permissions.
**Prevention:** After moving, verify: `ls -la skills/*/hooks/*.sh` shows `-rwxr-xr-x`.
**Detection:** `git diff --stat` shows permission changes. `find skills -name "*.sh" ! -perm -111` finds non-executable scripts.

## Minor Pitfalls

### Pitfall 7: Description Too Vague for Agent Activation
**What goes wrong:** Agent doesn't activate the skill when user provides relevant input because the description lacks specific trigger keywords.
**Prevention:** Already mitigated. All 4 descriptions include extensive trigger keywords (e.g., "Use this skill PROACTIVELY whenever a user shares a GitHub Actions workflow...").
**Detection:** Test by pasting relevant YAML to an agent with the skill installed. It should auto-activate.

### Pitfall 8: Large SKILL.md Exceeding Context Budget
**What goes wrong:** With 4 skills installed, the combined description text may exceed the agent's skill description budget (2% of context window, ~16,000 chars default for Claude Code). Some skills may be excluded from context.
**Prevention:** This is unlikely with only 4 skills. The descriptions (not full content) are loaded at startup -- each description is ~500 chars = ~2,000 chars total, well within budget. Full SKILL.md content only loads when activated.
**Detection:** In Claude Code, run `/context` to check for skill exclusion warnings.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Directory restructure | Pitfall 1 (name mismatch), Pitfall 6 (permission loss) | Verify name-directory match and file permissions after move |
| Artifact cleanup | Pitfall 2 (workspace discovery) | Move all non-skill files out of skill tree |
| Discovery verification | Pitfall 3 (not on skills.sh) | Run install command yourself to seed telemetry |
| Documentation update | Pitfall 4 (stale paths) | Search entire repo for old path references |
| README promotion | Pitfall 3 (no installs) | Include copy-paste install command prominently |

## Sources

- [agentskills.io/specification](https://agentskills.io/specification) -- Name validation regex, frontmatter requirements [HIGH confidence]
- [GitHub Issue #37: skills frontmatter validation](https://github.com/anthropics/skills/issues/37) -- Validation errors from malformed frontmatter [MEDIUM confidence]
- [SmartScope: Agent Skills troubleshooting](https://smartscope.blog/en/blog/agent-skills-guide/) -- Common SKILL.md loading failures [MEDIUM confidence]
- [Claude Code Docs: Skills](https://code.claude.com/docs/en/skills) -- Context budget for skill descriptions, `/context` diagnostic [HIGH confidence]
- [Vercel KB: Agent Skills](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context) -- Telemetry-based listing, no submission process [HIGH confidence]

---
*Domain pitfalls for: skills.sh publishing*
*Researched: 2026-03-05*
