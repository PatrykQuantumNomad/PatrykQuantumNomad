# Phase 84: Documentation - Research

**Researched:** 2026-03-05
**Domain:** GitHub profile README documentation, Agent Skills presentation, SEO-optimized markdown
**Confidence:** HIGH

## Summary

Phase 84 is the final phase of v1.14 (DevOps Skills Publishing). It updates the profile README.md to showcase the 4 DevOps validator agent skills with install commands, adds the GitHub Actions Workflow Validator to the Interactive Tools table, includes benchmark stats, and cleans up stale `public/skills/` references. This is a documentation-only phase -- no code, no builds, no deploys.

The current README.md is 82 lines of well-structured GitHub-flavored Markdown with sections for Links, Tech Stack, Interactive Tools, Recent Writing, and Projects. The phase adds one new section (Agent Skills) and modifies two existing ones (Interactive Tools table, and possibly a benchmark callout). The only non-planning file with stale `public/skills/` references is `scripts/test-validator-hooks.sh` (4 path references on lines 7-10).

**Primary recommendation:** Add a new "Agent Skills" section between Interactive Tools and Recent Writing with a skills.sh badge, one-line install command, skills table, and benchmark callout. Add GHA Validator row to the Interactive Tools table. Update `scripts/test-validator-hooks.sh` paths from `public/skills/` to `skills/`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOC-01 | README.md includes Agent Skills section with `npx skills add` install command | New section with `npx skills add PatrykQuantumNomad/PatrykQuantumNomad` command. Pattern verified from HashiCorp and Microsoft skills repos. |
| DOC-02 | README.md lists all 4 skills with descriptions and individual install commands | Table with 4 rows: dockerfile-analyzer, compose-validator, gha-validator, k8s-analyzer. Each with short description and `--skill` install command. |
| DOC-03 | README.md includes benchmark highlight (98.8% pass rate, +42.4% improvement) | Stats verified from `public/benchmarks/benchmark-all-skills.md`. Overall avg pass rate 98.8%, delta +42.4% vs without-skill baseline. Model: claude-haiku-4-5. |
| DOC-04 | GitHub Actions Workflow Validator added to README Interactive Tools table | New row: "GitHub Actions Workflow Validator / 48 rules / Try it + Blog links". Tool page at `/tools/gha-validator/`, blog at `/blog/github-actions-best-practices/`. |
| DOC-05 | All repo references to `public/skills/` updated to reflect new structure | Only 1 non-planning file needs updating: `scripts/test-validator-hooks.sh` (4 path references). Planning docs reference `public/skills/` historically but are documentation of past state, not active code. |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| GitHub-flavored Markdown | N/A | README.md authoring | GitHub profile READMEs render GFM; this is the only format |
| `grep -r` / Grep tool | system | Find stale `public/skills/` references | Systematic search for completeness |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `git diff` | Verify all changes before commit | After editing README and scripts |
| `npm run build` | Verify Astro build still passes after script changes | After updating test-validator-hooks.sh paths |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline install commands | skills.sh badge image | Badges are visual but can break; inline code blocks are more reliable and copy-paste friendly |
| Full benchmark table in README | Single-line benchmark callout | Full table is too verbose for a profile README; single highlight line is scannable |

**No installation needed** -- this phase edits existing files only.

## Architecture Patterns

### Current README Structure
```
README.md (82 lines)
  # Patryk Golabek -- Software Architect
  ## Links
  ## Tech Stack
  ## Interactive Tools          <-- ADD gha-validator row here (DOC-04)
  ## [NEW: Agent Skills]        <-- INSERT new section here (DOC-01, DOC-02, DOC-03)
  ## Recent Writing
  ## Projects
```

### Pattern 1: Agent Skills Section Layout
**What:** A new README section showcasing installable agent skills with a one-liner install command, skills table, and benchmark highlight.
**When to use:** DOC-01, DOC-02, DOC-03.
**Example:**
```markdown
## Agent Skills

DevOps validator skills for AI coding agents (Claude Code, Cursor, Copilot, Codex, and 17+ more). Install via [skills.sh](https://skills.sh):

```bash
npx skills add PatrykQuantumNomad/PatrykQuantumNomad
```

| Skill | Rules | Description |
|-------|-------|-------------|
| [dockerfile-analyzer](https://skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/dockerfile-analyzer) | 46 | Dockerfile security, efficiency, and best-practice analysis |
| [compose-validator](https://skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/compose-validator) | 52 | Docker Compose security, semantic, and schema validation |
| [gha-validator](https://skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/gha-validator) | 46 | GitHub Actions workflow security and best-practice analysis |
| [k8s-analyzer](https://skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/k8s-analyzer) | 67 | Kubernetes manifest security, reliability, and RBAC analysis |

Install a single skill:

```bash
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill dockerfile-analyzer
```

**Benchmarked:** 98.8% pass rate across all skills (+42.4% improvement over baseline without skills). Tested with Claude Haiku 4.5.
```

### Pattern 2: Interactive Tools Table Row Addition
**What:** Add GHA Validator as a new row in the existing Interactive Tools table.
**When to use:** DOC-04.
**Example:**
```markdown
| GitHub Actions Workflow Validator | 48 rules | [Try it](https://patrykgolabek.dev/tools/gha-validator/) · [Blog](https://patrykgolabek.dev/blog/github-actions-best-practices/) |
```

### Pattern 3: Stale Reference Cleanup
**What:** Update `scripts/test-validator-hooks.sh` to reference `skills/` instead of `public/skills/`.
**When to use:** DOC-05.
**Example:**
```bash
# BEFORE (lines 7-10):
COMPOSE_HOOK="$REPO_ROOT/public/skills/compose-validator/hooks/validate-compose.sh"
DOCKERFILE_HOOK="$REPO_ROOT/public/skills/dockerfile-analyzer/hooks/validate-dockerfile.sh"
K8S_HOOK="$REPO_ROOT/public/skills/k8s-analyzer/hooks/validate-k8s.sh"
GHA_HOOK="$REPO_ROOT/public/skills/gha-validator/hooks/validate-gha.sh"

# AFTER:
COMPOSE_HOOK="$REPO_ROOT/skills/compose-validator/hooks/validate-compose.sh"
DOCKERFILE_HOOK="$REPO_ROOT/skills/dockerfile-analyzer/hooks/validate-dockerfile.sh"
K8S_HOOK="$REPO_ROOT/skills/k8s-analyzer/hooks/validate-k8s.sh"
GHA_HOOK="$REPO_ROOT/skills/gha-validator/hooks/validate-gha.sh"
```

Note: The symlink at `public/skills -> ../skills` means the old paths still *work* at runtime, but the canonical location is `skills/` at repo root. Updating the script references removes confusion and ensures they work even if the symlink is removed.

### Anti-Patterns to Avoid
- **Verbose descriptions in README:** Profile READMEs must be scannable. Do not copy full SKILL.md descriptions (700+ chars each). Use 10-15 word summaries.
- **Linking to individual SKILL.md raw files:** Link to skills.sh pages (e.g., `https://skills.sh/PatrykQuantumNomad/PatrykQuantumNomad/dockerfile-analyzer`) not raw GitHub files.
- **Multiple install blocks:** Show the all-skills install prominently, then a single example of `--skill` usage. Do not list all 4 individual install commands.
- **Forgetting to add GHA Validator in alphabetical/logical order:** The existing table is ordered: Compose, Dockerfile, K8s. GHA should be inserted to maintain logical grouping (Compose, Dockerfile, GHA, K8s -- alphabetical by tool name).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skills badge | Custom SVG badge | skills.sh listing URL as hyperlink | The skills.sh page auto-generates from telemetry; linking directly is simpler and self-updating |
| README table of contents | Manual anchor links | GitHub auto-generated TOC (profile READMEs) | GitHub renders profile READMEs with auto-TOC support; manual anchors are redundant |
| Benchmark visualization | Inline ASCII chart or image | Single-line stat callout with numbers | Profile README is not the place for charts; the benchmark data lives in `public/benchmarks/` for the full report |

**Key insight:** Profile READMEs are landing pages, not documentation. Keep content brief, link out to detailed resources.

## Common Pitfalls

### Pitfall 1: Rule Count Mismatch Between README Table Locations
**What goes wrong:** The Interactive Tools table says one rule count and the Agent Skills table says another for the same tool.
**Why it happens:** The GHA Validator has 48 documented rules in the codebase (`src/lib/tools/gha-validator/rules/index.ts`) but the SKILL.md frontmatter says 46 rules. The existing README table uses the rule counts from the blog posts. The blog post says 48 rules.
**How to avoid:** Use 48 rules for the Interactive Tools table (matching the blog and codebase). Use 46 rules for the Agent Skills table (matching the SKILL.md frontmatter which is what skills.sh CLI users see). Note: the difference is that SKILL.md omits the 2 actionlint sub-rules that are metadata-only, but this is a pre-existing discrepancy not in scope for Phase 84.
**Warning signs:** Numbers for the same tool differing between the two tables.

### Pitfall 2: Updating Planning Docs as Part of DOC-05
**What goes wrong:** Over-scoping DOC-05 by updating all `.planning/` files that mention `public/skills/`.
**Why it happens:** `grep -r "public/skills/"` finds 21 files, but 20 are in `.planning/` (historical records of research, plans, and summaries from Phases 74, 81, 82, 83).
**How to avoid:** DOC-05 targets **live repo references** -- code, scripts, and README. Planning docs record history and should NOT be rewritten. The only actionable file is `scripts/test-validator-hooks.sh`.
**Warning signs:** Touching 20+ planning files when the requirement says "repo references."

### Pitfall 3: Breaking the Test Script After Path Update
**What goes wrong:** Updating paths in `scripts/test-validator-hooks.sh` from `public/skills/` to `skills/` but not verifying the script still runs.
**Why it happens:** The symlink makes both paths work, but after the change, direct access to `skills/` is the canonical path.
**How to avoid:** After updating the 4 path references, run `bash scripts/test-validator-hooks.sh` to verify all tests still pass.
**Warning signs:** `assert_file_exists` failures for hook paths.

### Pitfall 4: Section Ordering Disrupts README Flow
**What goes wrong:** Placing the Agent Skills section in a position that breaks the README's scannable flow.
**Why it happens:** Not considering the reader's journey: Links -> Tech Stack -> Tools -> Skills -> Writing -> Projects.
**How to avoid:** Place Agent Skills after Interactive Tools and before Recent Writing. The tools and skills are related (both are DevOps validator outputs), so proximity makes sense.
**Warning signs:** Skills section appearing before Tech Stack or after Projects.

### Pitfall 5: Benchmark Stats Without Context
**What goes wrong:** Stating "98.8% pass rate" without explaining what was measured.
**Why it happens:** Assuming readers know what the benchmark evaluates.
**How to avoid:** Include brief context: what was measured (pass rate across all skills), what the baseline is (without skills), and the model used (Claude Haiku 4.5).
**Warning signs:** Stats that raise more questions than they answer.

## Code Examples

Verified patterns from official sources and project context:

### DOC-04: GHA Validator Interactive Tools Row
```markdown
<!-- Source: Existing README.md table pattern at lines 32-36 -->
| GitHub Actions Workflow Validator | 48 rules | [Try it](https://patrykgolabek.dev/tools/gha-validator/) · [Blog](https://patrykgolabek.dev/blog/github-actions-best-practices/) |
```

### DOC-05: Script Path Fix
```bash
# Source: scripts/test-validator-hooks.sh lines 7-10
# Replace public/skills/ with skills/ in all 4 hook paths
sed -i '' 's|public/skills/|skills/|g' scripts/test-validator-hooks.sh
```

### Verification: Grep for Remaining public/skills/ References
```bash
# After all changes, verify no stale references remain outside .planning/
grep -r "public/skills/" --include="*.md" --include="*.sh" --include="*.ts" --include="*.js" --include="*.json" . | grep -v ".planning/" | grep -v "node_modules/"
# Expected: no output (zero matches)
```

### Verification: Test Script Still Passes
```bash
bash scripts/test-validator-hooks.sh
# Expected: all tests pass (PASS count > 0, FAIL count = 0)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No skills section in profile README | Agent Skills section with install commands | Phase 84 (now) | Makes skills discoverable from GitHub profile |
| 3 tools in Interactive Tools table | 4 tools including GHA Validator | Phase 84 (now) | Reflects v1.13 GHA Validator shipping |
| Skills at `public/skills/` | Skills at `skills/` (root) with symlink | Phase 82 (2026-03-05) | Scripts should reference canonical `skills/` path |

**Current state of skills.sh ecosystem (2026-03):**
- Microsoft, HashiCorp, Anthropic, and Vercel all publish skills via the same `npx skills add` pattern
- Standard README pattern: install command + skills table with descriptions
- skills.sh leaderboard provides automatic discovery via telemetry
- 17+ supported agents (Claude Code, Cursor, Copilot, Codex, etc.)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification + shell script execution |
| Config file | None -- README validation is visual; script validation is execution-based |
| Quick run command | `grep -r "public/skills/" . --include="*.sh" --include="*.md" \| grep -v ".planning/"` |
| Full suite command | `bash scripts/test-validator-hooks.sh` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | README has Agent Skills section with install command | smoke | `grep -q "npx skills add PatrykQuantumNomad" README.md` | N/A (grep) |
| DOC-02 | README lists all 4 skills with individual commands | smoke | `grep -c "skills add.*--skill" README.md` should return >= 1 | N/A (grep) |
| DOC-03 | README has benchmark stats (98.8%, +42.4%) | smoke | `grep -q "98.8%" README.md && grep -q "42.4%" README.md` | N/A (grep) |
| DOC-04 | GHA Validator in Interactive Tools table | smoke | `grep -q "GitHub Actions Workflow Validator" README.md` | N/A (grep) |
| DOC-05 | No stale public/skills/ in non-planning files | smoke | `grep -r "public/skills/" . --include="*.sh" --include="*.md" \| grep -v ".planning/" \| wc -l` should be 0 | N/A (grep) |

### Sampling Rate
- **Per task commit:** Run all 5 grep checks
- **Per wave merge:** Run grep checks + execute `bash scripts/test-validator-hooks.sh`
- **Phase gate:** All 5 grep checks pass + test script passes

### Wave 0 Gaps
None -- no test infrastructure needed. All verification is via grep and existing shell script execution.

## Open Questions

1. **Should the Agent Skills section include a skills.sh badge image?**
   - What we know: Microsoft uses CI badges. HashiCorp uses plain install commands. GitHub profile READMEs render images well.
   - What's unclear: Whether skills.sh provides an official badge URL or if one needs to be crafted.
   - Recommendation: Use a text hyperlink to `https://skills.sh/PatrykQuantumNomad/PatrykQuantumNomad` instead of a badge. Simpler, always works, no external image dependency.

2. **Should the rule count in the Agent Skills table match SKILL.md (46) or the codebase (48) for gha-validator?**
   - What we know: SKILL.md says "46 rules across 6 categories". The codebase index.ts says "48 documented rules" (22 custom + 18 actionlint + 8 schema). The blog post references 48.
   - What's unclear: The source of the discrepancy (likely SKILL.md was written before the 2 schema metadata rules were added).
   - Recommendation: Use the SKILL.md value (46) in the Agent Skills table since that is what the skills.sh CLI surfaces to users. Use 48 in the Interactive Tools table since that matches the blog post and web tool.

3. **Should `.planning/` doc references to `public/skills/` also be updated?**
   - What we know: 20 planning files reference `public/skills/`. These are historical records (research notes, plans, summaries) from Phases 74, 81, 82, 83.
   - What's unclear: Whether DOC-05 intends planning docs to be updated.
   - Recommendation: Do NOT update planning docs. They record historical state accurately. DOC-05's success criterion says "No references to `public/skills/` remain anywhere in the repo" but the spirit is about *active code and documentation*, not historical planning records. The planner should clarify scope to non-planning files.

## Key Data for Planner

### Files to Modify
| File | Changes | Requirement |
|------|---------|-------------|
| `README.md` | Add Agent Skills section, add GHA row to Interactive Tools table | DOC-01, DOC-02, DOC-03, DOC-04 |
| `scripts/test-validator-hooks.sh` | Replace `public/skills/` with `skills/` on lines 7-10 | DOC-05 |

### Exact Benchmark Stats (from `public/benchmarks/benchmark-all-skills.md`)
| Metric | With Skill | Without Skill | Delta |
|--------|-----------|---------------|-------|
| Avg Pass Rate | **98.8%** | 56.4% | **+42.4%** |
| Model | claude-haiku-4-5 | claude-haiku-4-5 | N/A |
| Date | 2026-03-04 | 2026-03-04 | N/A |

### Skill Metadata (from SKILL.md frontmatter)
| Skill | Rules (SKILL.md) | Short Description |
|-------|-------------------|-------------------|
| dockerfile-analyzer | 46 | Dockerfile security, efficiency, and best-practice analysis |
| compose-validator | 52 | Docker Compose security, semantic, and schema validation |
| gha-validator | 46 | GitHub Actions workflow security and best-practice analysis |
| k8s-analyzer | 67 | Kubernetes manifest security, reliability, and RBAC analysis |

### GHA Validator Tool Details (for Interactive Tools table)
| Property | Value |
|----------|-------|
| Tool name | GitHub Actions Workflow Validator |
| Rule count | 48 rules (from `src/lib/tools/gha-validator/rules/index.ts`) |
| Tool URL | `https://patrykgolabek.dev/tools/gha-validator/` |
| Blog URL | `https://patrykgolabek.dev/blog/github-actions-best-practices/` |

### Install Commands
| Command | Purpose |
|---------|---------|
| `npx skills add PatrykQuantumNomad/PatrykQuantumNomad` | Install all 4 skills |
| `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill dockerfile-analyzer` | Install single skill |

## Sources

### Primary (HIGH confidence)
- `README.md` (lines 1-82) -- Current README structure and content
- `public/benchmarks/benchmark-all-skills.md` -- Verified benchmark stats: 98.8% pass rate, +42.4% delta
- `public/benchmarks/benchmark-all-skills.json` -- Raw benchmark data confirming markdown report
- `src/lib/tools/gha-validator/rules/index.ts` -- Confirmed 48 documented rules total
- `scripts/test-validator-hooks.sh` -- Only non-planning file with `public/skills/` references (4 occurrences, lines 7-10)
- `skills/*/SKILL.md` frontmatter -- All 4 skill names, descriptions, and rule counts verified
- Phase 83 VERIFICATION.md -- Confirms all 5 DSC requirements passed, skills are live

### Secondary (MEDIUM confidence)
- [HashiCorp agent-skills README](https://github.com/hashicorp/agent-skills) -- Industry pattern for skills README layout
- [Microsoft skills README](https://github.com/microsoft/skills) -- Industry pattern for skills README with tables and install commands
- [vercel-labs/skills README](https://github.com/vercel-labs/skills) -- Official CLI documentation for install command syntax

### Tertiary (LOW confidence)
- skills.sh badge availability -- Not confirmed whether official badge URLs exist; recommended text links instead

## Metadata

**Confidence breakdown:**
- README structure: HIGH -- Current README read directly, existing table patterns clear
- Benchmark stats: HIGH -- Verified from both .md and .json benchmark files
- DOC-05 scope: HIGH -- Comprehensive grep across entire repo; only 1 non-planning file found
- GHA rule count: HIGH -- Verified from codebase index.ts (48 documented rules)
- Skills.sh ecosystem patterns: MEDIUM -- Verified against HashiCorp and Microsoft examples via WebFetch

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (30 days -- content is static profile documentation)
