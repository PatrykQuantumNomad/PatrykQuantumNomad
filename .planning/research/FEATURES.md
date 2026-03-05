# Feature Research

**Domain:** Publishing DevOps validator skills to skills.sh
**Researched:** 2026-03-05
**Confidence:** HIGH

## Context

Four existing DevOps validator skills (dockerfile-analyzer, compose-validator, k8s-analyzer, gha-validator) are fully built with complete SKILL.md files, evaluation workspaces, benchmark data, and hooks. The research question is narrow: what publishing-specific features are needed to make these skills discoverable, installable, and successful on skills.sh?

## How skills.sh Works

Skills.sh is a leaderboard and directory, not a registry. There is no submission process, approval queue, or package upload. Skills appear on skills.sh automatically through anonymous telemetry when users run `npx skills add <owner>/<repo>`. The leaderboard ranks by aggregate install count. The CLI tool (`npx skills`) scans GitHub repos for SKILL.md files in standard discovery locations (`skills/`, `.agents/skills/`, `.claude/skills/`).

For a multi-skill repo like PatrykQuantumNomad, the install command is:
```
npx skills add PatrykQuantumNomad/PatrykQuantumNomad
```

Users can also install individual skills:
```
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill dockerfile-analyzer
```

The CLI discovers skills by scanning known directory paths. The `public/skills/<name>/SKILL.md` path may not be auto-discovered. The standard paths are `skills/`, `.claude/skills/`, or `.agents/skills/`.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = skill doesn't get installed or gets uninstalled quickly.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Correct directory structure for CLI discovery** | `npx skills add` scans `skills/`, `.claude/skills/`, `.agents/skills/` for SKILL.md files. Current `public/skills/` path will NOT be auto-discovered. Skills must be in a recognized discovery location. | MEDIUM | Move or symlink the 4 skill directories from `public/skills/` to `skills/` at repo root. Each skill needs its own directory containing SKILL.md. The `dist/` copies are irrelevant to skills.sh. |
| **SKILL.md frontmatter compliance** | Name must be lowercase letters, numbers, hyphens only (max 64 chars). Description must be non-empty, max 1024 chars, no XML tags, third-person voice. Current SKILL.md files already have name+description. | LOW | Verify existing frontmatter against spec. Current names (dockerfile-analyzer, compose-validator, k8s-analyzer, gha-validator) are compliant. Descriptions need third-person verification per Anthropic best practices. |
| **Description quality for discovery** | Claude uses the description field to decide when to auto-load a skill. skills.sh search indexes name+description. A vague description means the skill never triggers. Current descriptions are detailed and trigger-rich. | LOW | Current descriptions are already well-crafted with trigger keywords. May need minor tuning to ensure third-person voice ("Analyzes..." not "I analyze..."). Already uses proactive trigger patterns. |
| **One-command install works** | Users expect `npx skills add <owner>/<repo>` to work. If the repo structure doesn't match CLI expectations, install silently finds no skills. | HIGH | This is the single most critical feature. Without it, nothing else matters. Must validate with `npx skills add . --list` from local repo. |
| **Each skill functions independently** | Users may install just one skill (e.g., only dockerfile-analyzer). Skills must not depend on each other or on shared files outside their directory. | LOW | Current skills are already self-contained. Each SKILL.md contains the complete rule set, scoring methodology, and output format. No cross-skill dependencies exist. |
| **Security audit pass** | skills.sh runs automated security audits via Gen Agent Trust Hub, Socket, and Snyk. Audit results appear publicly on each skill's page. A "Fail" badge deters installs. | LOW | SKILL.md files are pure markdown with frontmatter -- no executable code, no dependencies to scan. The `hooks/` scripts (shell scripts like `validate-dockerfile.sh`) may trigger scrutiny but are simple validators. Should pass audits cleanly. |

### Differentiators (Competitive Advantage)

Features that set these skills apart from competing DevOps skills on skills.sh.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Repo-level README with benchmark data** | Top multi-skill repos (Trail of Bits, vercel-labs) use their README to showcase the skill collection. No competing DevOps skill repo has benchmark data proving measurable improvement. The +42.4% improvement stat is a powerful differentiator. | MEDIUM | Create or update repo README to include: skill catalog table with rule counts, install commands, benchmark results table, before/after comparison narrative. The README is the landing page when someone visits the GitHub repo from skills.sh. |
| **Benchmark-backed credibility** | The 98.8% pass rate vs 56.4% baseline across 8 evals is unique among DevOps skills. kubernetes-specialist, k8s-security-policies, and devops-engineer skills on skills.sh have zero quantitative proof of effectiveness. | LOW | The benchmark data already exists in `benchmark-all-skills.md` and `benchmark-all-skills.json`. Need to surface it prominently in the README and individual skill descriptions. This is the strongest competitive moat. |
| **Suite coherence with consistent methodology** | All 4 skills share identical scoring methodology (0-100, A+ through F, category-weighted, diminishing returns formula). No other skills.sh DevOps suite has this consistency. Users who install one will want all four. | LOW | Already built. Highlight the consistency in the README -- "same scoring methodology across all four validators." Cross-reference between skills ("If you use dockerfile-analyzer, also try compose-validator"). |
| **Rule count as social proof** | 211 total rules (46+52+67+46) across 4 skills. The closest competitor (k8s-security at skills.sh) has no published rule count. Concrete numbers signal thoroughness. | LOW | Already built. Display prominently: "211 rules across 4 DevOps validators." Per-skill counts in the catalog table. |
| **Hooks for CI/CD integration** | Each skill includes a `hooks/` directory with shell scripts (e.g., `validate-dockerfile.sh`). These enable automated validation beyond interactive Claude sessions. Few skills on skills.sh include hooks. | LOW | Already built. Document the hooks in the README. Show how to wire them into pre-commit or CI pipelines. This extends the skill's value beyond Claude Code sessions. |
| **Category badges or shields in README** | GitHub shields.io badges showing rule counts, pass rates, or grades are uncommon in skill repos but standard in popular open-source projects. They make the README scannable and professional. | LOW | Add shields.io badges for: total rules (211), benchmark pass rate (98.8%), number of skills (4), supported agents (Claude Code, Cursor, Copilot, etc.). |
| **Cross-referencing install command per skill** | Top skills.sh pages show install commands with `--skill` targeting. Documenting each skill's individual install command alongside the full-suite command caters to both "I want everything" and "I only need K8s" users. | LOW | List both commands in README. Full suite: `npx skills add PatrykQuantumNomad/PatrykQuantumNomad`. Individual: `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill k8s-analyzer`. |
| **Progressive disclosure in SKILL.md structure** | Anthropic best practices recommend keeping SKILL.md under 500 lines and using separate reference files for detailed content. Current SKILL.md files are 500-600+ lines each. Splitting would follow official guidance and reduce context token cost. | MEDIUM | Consider splitting each SKILL.md into a concise core (under 500 lines) with rule details in a `RULES.md` reference file. However, the current monolithic format has been benchmarked at 98.8% -- splitting risks degrading performance. This is a tradeoff to evaluate carefully. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good for publishing but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Splitting SKILL.md to reduce token count** | Anthropic recommends under 500 lines. Current files are 530-615 lines. Token overhead is +42% vs baseline. | The 98.8% benchmark pass rate was achieved with the current monolithic SKILL.md files. Splitting into SKILL.md + RULES.md introduces a progressive disclosure dependency where Claude must decide to read the rules file. If Claude skips the reference file, rule coverage drops. The benchmark explicitly showed that structured rule IDs and category breakdowns NEVER appear without the full skill loaded. | Keep SKILL.md monolithic. The token cost (+10K tokens, ~42%) is justified by the +42.4% improvement. The files are within reasonable bounds. Only split if benchmark shows no degradation. |
| **Adding install count tracking or analytics** | Want to know how many people install the skills. | skills.sh already tracks install counts via anonymous telemetry. Adding custom tracking (webhook, analytics script) would fail security audits and deter users. The skills CLI handles this automatically. | Rely on skills.sh leaderboard for install metrics. Check `https://skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/<skill-name>` after first installs appear. |
| **Creating a Claude Plugin marketplace manifest** | `.claude-plugin/marketplace.json` enables `npx skills add` with plugin-style browsing in Claude Code. Trail of Bits uses this. | Plugin marketplace format is separate from skills.sh discovery. It adds complexity (manifest file, package groupings) and is only relevant for Claude Code -- not Cursor, Copilot, or the other 37 agents. The `skills/` directory structure is universal. | Use standard `skills/` directory. Plugin marketplace is a v2 concern only if Claude Code-specific features are needed. |
| **Custom landing page or documentation site** | A dedicated docs site for the skills would be professional. | Over-engineering for 4 skills. The README is the landing page. Each SKILL.md is self-documenting. The existing blog posts on patrykgolabek.dev already provide deep documentation. Maintaining a separate docs site fragments the content. | Link to existing blog posts from the README. Use the README as the single landing page. Link to existing browser-based tools for interactive demos. |
| **Versioning skills with semver tags** | Users might want to pin to specific skill versions. | skills.sh does not support versioned skills. The CLI always installs from the latest commit on the default branch. Versioning would require a release workflow that skills.sh ignores entirely. | Keep skills on main branch. Use git history for version tracking. If breaking changes are needed, document them in the README. |
| **Adding evaluation test cases to the published repo** | The eval workspaces prove the skills work. Publishing them would show rigor. | Eval workspace directories (`*-workspace/`) contain test fixtures, timing data, grading results. They add 100+ files of noise to the repo tree. Users installing skills don't need eval infrastructure. The benchmark summary (`benchmark-all-skills.md`) conveys the results without the raw data. | Keep eval workspaces in the repo (they're already there) but ensure they're in directories the skills CLI won't scan. Document results in the README via the benchmark summary. |

## Feature Dependencies

```
Correct Directory Structure (skills/ at repo root)
    required by ──> npx skills add discovery
    required by ──> skills.sh leaderboard appearance
    required by ──> Individual skill install (--skill flag)

SKILL.md Frontmatter Compliance
    required by ──> Claude auto-loading (name + description)
    required by ──> skills.sh page rendering
    required by ──> Security audit pass

Repo README with Skill Catalog
    enhanced by ──> Benchmark Data Display
    enhanced by ──> shields.io Badges
    enhanced by ──> Per-Skill Install Commands
    NOTE: README is what users see on GitHub when visiting from skills.sh

Benchmark Data Display
    requires ──> Existing benchmark-all-skills.md data
    enhances ──> Repo README credibility

Hooks Documentation
    requires ──> Existing hooks/ scripts
    enhances ──> README completeness
    independent of ──> skills.sh discovery

Security Audit Pass
    requires ──> Clean SKILL.md (no executable imports)
    requires ──> Clean hooks/ (simple shell scripts)
    independent of ──> Directory structure
```

### Dependency Notes

- **Directory structure is the single blocking dependency.** Without `skills/` at repo root, `npx skills add` finds nothing. Everything else is enhancement.
- **README is independent of discovery** but is the first thing users see after finding the skill on skills.sh. It directly affects install conversion.
- **Benchmark data is already generated** and just needs to be surfaced in the README. No new computation required.
- **Hooks exist and work** but are undocumented in the context of skills.sh publishing.
- **Security audits run automatically** when skills appear on skills.sh. No action needed unless audits fail.

## MVP Definition

### Launch With (v1)

Minimum needed to make all 4 skills installable via `npx skills add` and appearing on skills.sh.

- [ ] **Move skills to `skills/` directory at repo root** -- The blocking requirement. Create `skills/dockerfile-analyzer/`, `skills/compose-validator/`, `skills/k8s-analyzer/`, `skills/gha-validator/` each containing their SKILL.md and hooks/ directory.
- [ ] **Verify frontmatter compliance** -- Confirm all name and description fields meet the spec (lowercase, hyphens, no XML tags, third-person, under 1024 chars for description).
- [ ] **Validate local install** -- Run `npx skills add . --list` from repo root to confirm all 4 skills are discovered. Run `npx skills add .` to confirm installation works.
- [ ] **Update repo README with skill catalog** -- Add a "DevOps Validator Skills" section listing all 4 skills with rule counts, descriptions, and install commands (both full-suite and individual).
- [ ] **Surface benchmark data in README** -- Add the key benchmark stats: 98.8% pass rate vs 56.4% baseline, +42.4% improvement, 211 total rules.

### Add After Validation (v1.x)

Features to add once skills are live on skills.sh and first installs are tracked.

- [ ] **shields.io badges in README** -- Total rules, pass rate, skill count, once installs start appearing
- [ ] **Cross-reference between skills** -- Add "Related skills" section to each SKILL.md description suggesting the other validators
- [ ] **Blog post announcing the skills** -- "4 Free DevOps Validator Skills for Claude Code" targeting SEO for skills.sh discovery
- [ ] **Link skills from existing profile README** -- Add skills to the Interactive Tools section of the GitHub profile README
- [ ] **Hooks documentation** -- Document how to use the validation hooks in CI/CD pipelines

### Future Consideration (v2+)

Features to defer until install metrics prove demand.

- [ ] **Progressive disclosure refactoring** -- If SKILL.md token cost becomes a problem, split into core + reference files and re-benchmark
- [ ] **Claude Plugin marketplace manifest** -- `.claude-plugin/marketplace.json` for enhanced Claude Code browsing
- [ ] **Additional skills** -- Terraform validator, Helm chart analyzer, based on community request patterns
- [ ] **Evaluation framework publication** -- Open-source the eval harness and benchmark methodology

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Directory structure for CLI discovery | CRITICAL | MEDIUM | P0 |
| Frontmatter compliance verification | HIGH | LOW | P1 |
| Local install validation | HIGH | LOW | P1 |
| README skill catalog with install commands | HIGH | MEDIUM | P1 |
| Benchmark data in README | HIGH | LOW | P1 |
| shields.io badges | MEDIUM | LOW | P2 |
| Cross-skill references in descriptions | MEDIUM | LOW | P2 |
| Announcement blog post | MEDIUM | MEDIUM | P2 |
| Profile README skill links | MEDIUM | LOW | P2 |
| Hooks CI/CD documentation | LOW | LOW | P2 |
| Progressive disclosure refactoring | LOW | HIGH | P3 |
| Plugin marketplace manifest | LOW | MEDIUM | P3 |
| Additional skills | LOW | HIGH | P3 |

**Priority key:**
- P0: Blocking -- nothing works without this
- P1: Must have for launch (professional, discoverable, installable)
- P2: Should have, add after skills appear on leaderboard
- P3: Nice to have, defer until demand signal

## Competitor Feature Analysis

| Feature | kubernetes-specialist (jeffallan) | k8s-security (kcns008) | security-analyzer (Cornjebus) | devops-engineer (antigravity) | Our Approach |
|---------|----------------------------------|------------------------|-------------------------------|-------------------------------|--------------|
| Rule count | Not specified | Not specified | 80+ checkpoints | Not specified | **211 rules across 4 skills** |
| Scoring methodology | None | None | None | None | **0-100 with A+ through F grades, category-weighted** |
| Benchmark data | None | None | None | None | **98.8% pass rate, +42.4% vs baseline** |
| Multi-skill suite | Part of 15-skill collection | Single skill | Single skill | Part of collection | **4 focused DevOps validators with consistent methodology** |
| Hooks / CI integration | None | None | None | None | **Shell script hooks per skill** |
| Before/after examples | None | Brief | Phased plans | None | **Every rule includes before/after code** |
| Coverage domains | K8s only | K8s security only | Broad security | Broad DevOps | **Dockerfile + Compose + K8s + GitHub Actions** |
| Install count (approx) | 2.1K weekly | Unknown | Unknown | Unknown | Target: organic growth from quality |

### Key Competitive Insights

1. **No competing DevOps skill has quantitative benchmarks.** The +42.4% improvement stat is unmatched. Every other skill makes qualitative claims ("expert-level", "comprehensive") without proof.

2. **No suite covers all four DevOps config domains.** Most skills are either single-domain (K8s only) or overly broad (generic "DevOps engineer" persona). Four focused validators with consistent methodology is a unique positioning.

3. **Rule-based scoring is exclusive to this suite.** Every competing skill outputs free-form text. The structured scoring (0-100, letter grades, category breakdowns, specific rule IDs) provides actionable, comparable results that free-form analysis cannot.

4. **The jeff allan/claude-skills kubernetes-specialist has 2.1K weekly installs** as a reference point. This is a single skill in a 15-skill collection with 4.7K GitHub stars. Reaching comparable install numbers would require the repo itself to gain visibility through quality README, blog posts, and community sharing.

5. **Trail of Bits model is instructive.** Their 50-skill security repo uses a clean README with categorical organization, one-line descriptions per skill, and a "Trophy Case" section showing real bugs found using their skills. The benchmark data serves a similar credibility function.

## Sources

- [skills.sh homepage](https://skills.sh) -- Leaderboard, install counts, ecosystem overview
- [skills.sh FAQ](https://skills.sh/docs/faq) -- Publishing, telemetry, listing mechanics
- [vercel-labs/skills GitHub](https://github.com/vercel-labs/skills) -- CLI source, discovery paths, multi-skill repo patterns
- [anthropics/skills GitHub](https://github.com/anthropics/skills) -- Official skill template, directory structure, spec
- [Anthropic Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) -- Frontmatter spec, naming conventions, progressive disclosure, 500-line guidance
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- Skill discovery paths, frontmatter reference, directory structure
- [find-skills skill page on skills.sh](https://skills.sh/vercel-labs/skills/find-skills) -- Individual skill page layout, metadata display, security audit badges
- [kubernetes-specialist on skills.sh](https://skills.sh/jeffallan/claude-skills/kubernetes-specialist) -- DevOps competitor reference, 2.1K weekly installs
- [Trail of Bits skills repo](https://github.com/trailofbits/skills) -- Multi-skill README pattern, 50 skills, categorical organization
- [Pulumi Blog: Top 8 Claude Skills for DevOps 2026](https://www.pulumi.com/blog/top-8-claude-skills-devops-2026/) -- DevOps skill patterns, progressive disclosure effectiveness
- [Skills.sh Review (vibecoding.app)](https://vibecoding.app/blog/skills-sh-review) -- Install count as quality signal, search/discovery mechanics
- Existing benchmark data at `public/skills/benchmark-all-skills.md` -- 98.8% pass rate, +42.4% improvement

---
*Feature research for: skills.sh publishing of DevOps validator skills*
*Researched: 2026-03-05*
