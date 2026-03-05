# Feature Landscape: skills.sh Publishing

**Domain:** Publishing DevOps SKILL.md files to skills.sh
**Researched:** 2026-03-05

## Table Stakes

Features users expect when installing skills from a multi-skill repo.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All 4 skills discoverable via `--list` | Users run `npx skills add --list` to see what's available before installing | Low | Requires correct directory structure only |
| Individual skill install via `--skill` | Users want to pick specific skills, not install all 4 | Low | Already supported by CLI when directory name matches frontmatter `name` |
| Valid SKILL.md frontmatter | CLI rejects skills with malformed frontmatter | Low | Already valid -- `name` + `description` present and conformant |
| Skills work across agents | Users on Claude Code, Codex, Cursor, Copilot all expect the same skill to work | Low | Agent Skills spec is agent-agnostic. SKILL.md content is universal. |
| README with install instructions | Users finding the repo on GitHub need clear install commands | Low | Add install badge and command examples to README.md |

## Differentiators

Features that set these skills apart from other DevOps skills on skills.sh.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Quantitative scoring (0-100 + letter grade) | Most DevOps skills give qualitative advice. These give a numeric score. | Already built | Embedded in SKILL.md content |
| Comprehensive rule sets (46-67 rules each) | Most competitor skills have 5-15 rules. These are 3-10x more thorough. | Already built | Rule density is the main differentiator |
| Fix recommendations with before/after | Most skills just flag issues. These show exactly how to fix them. | Already built | Embedded in SKILL.md content |
| 4-tool DevOps suite | Install once, get analyzers for Dockerfile, Compose, K8s, and GHA. Cohesive set. | Already built | Unique value: complete DevOps linting stack |
| Proactive activation triggers | Skills fire automatically when user pastes relevant YAML, not just on explicit invoke | Already built | `description` field contains activation keywords |

## Anti-Features

Features to explicitly NOT build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Custom skills.sh landing page | skills.sh auto-generates skill pages from frontmatter. No custom HTML needed or supported. | Let skills.sh generate pages automatically |
| Skill versioning / changelog | Agent Skills spec has no version enforcement. Users always get the latest from main branch. | Track changes via git commits, not skill versioning |
| `scripts/` directory refactor | Renaming `hooks/` to `scripts/` adds churn with zero functional benefit. CLI doesn't enforce subdirectory names. | Keep `hooks/` as-is |
| SKILL.md splitting into references/ | Rule-based analyzer skills need all rules in context simultaneously. Splitting degrades quality. | Keep monolithic SKILL.md files |
| LobeHub / SkillsMP cross-posting | Different ecosystems, different submission processes. Scope creep. | Focus on skills.sh only |
| CI validation pipeline | Running `skills-ref validate` in CI is overkill for 4 static files that already pass. | Manual verification is sufficient |

## Feature Dependencies

```
Directory restructure --> Discovery verification --> README badge --> Promotion
                                                                      |
                                            Install telemetry --> skills.sh listing
```

The dependency chain is strictly linear. Each step is trivial.

## MVP Recommendation

Prioritize:
1. Move skills from `public/skills/` to `skills/` at repo root
2. Remove workspace/benchmark artifacts from skill directories
3. Verify discovery with `npx skills add --list`
4. Add install instructions to README.md

Defer:
- `license` field in frontmatter (nice-to-have, not blocking)
- `metadata.author` / `metadata.version` fields (optional per spec)
- Cross-marketplace publishing (out of scope)

## Sources

- [Agent Skills Specification](https://agentskills.io/specification) -- Feature requirements derived from spec [HIGH confidence]
- [skills.sh](https://skills.sh/) -- Leaderboard shows existing DevOps skills for comparison [HIGH confidence]
- [skills.sh/jeffallan/claude-skills/devops-engineer](https://skills.sh/jeffallan/claude-skills/devops-engineer) -- Competitor skill page showing auto-generated display format [HIGH confidence]

---
*Feature landscape for: skills.sh publishing*
*Researched: 2026-03-05*
