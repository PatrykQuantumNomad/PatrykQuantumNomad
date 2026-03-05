# Phase 83: Discovery Verification - Research

**Researched:** 2026-03-05
**Domain:** skills.sh CLI discovery, installation verification, telemetry seeding
**Confidence:** HIGH

## Summary

Phase 83 verifies that the directory restructure completed in Phase 82 (skills at repo root in `skills/`) is correctly discoverable by the skills.sh CLI (`npx skills add`). The phase has five requirements: CLI discovery of exactly 4 skills (DSC-01), individual install via `--skill` flag (DSC-02), name validation regex compliance (DSC-03), directory-name-to-frontmatter matching (DSC-04), and seed install to trigger skills.sh telemetry listing (DSC-05).

The critical blocker is that **all v1.14 commits (9 total, including the Phase 82 restructure) are currently unpushed to remote**. The skills CLI fetches from GitHub when given `owner/repo` shorthand, so discovery verification cannot succeed until these commits are pushed. DSC-03 and DSC-04 can be validated locally (frontmatter parsing), but DSC-01, DSC-02, and DSC-05 require the remote to reflect the new `skills/` directory structure.

Local pre-validation confirms all 4 skills are ready: all `name` fields match the regex `^[a-z0-9]+(-[a-z0-9]+)*$`, all directory names match their frontmatter `name` fields, and all descriptions are within the 1-1024 character limit. The actual skill names are: `dockerfile-analyzer`, `compose-validator`, `gha-validator`, `k8s-analyzer`.

**Primary recommendation:** Push all v1.14 commits to remote first, then run `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` to verify discovery, test individual installs with `--skill`, and perform a seed install to trigger skills.sh telemetry.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSC-01 | `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` discovers exactly 4 skills | CLI searches `skills/` at repo root as a standard discovery path. Requires push to remote first. |
| DSC-02 | Each skill installable individually via `--skill` flag | `--skill <name>` flag installs specific skills by name. Can use `--agent claude-code -y` for non-interactive mode. |
| DSC-03 | All 4 SKILL.md frontmatter passes name validation regex `^[a-z0-9]+(-[a-z0-9]+)*$` | Local validation confirms all 4 names pass: dockerfile-analyzer, compose-validator, gha-validator, k8s-analyzer |
| DSC-04 | Directory name matches frontmatter `name` field for all 4 skills | Local validation confirms all 4 directory-to-name matches are exact |
| DSC-05 | First install seeded via `npx skills add` to trigger skills.sh telemetry listing | Skills appear on skills.sh leaderboard automatically through anonymous telemetry when `npx skills add` is run. Requires push to remote. |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `skills` (npm) | latest via npx | CLI for discovering, listing, and installing agent skills | Official Vercel-maintained tool; the canonical way to interact with skills.sh ecosystem |
| `git` | system | Push commits to remote | Required to make skills discoverable via GitHub shorthand |
| `python3` / `bash` | system | Local frontmatter validation | Parse YAML frontmatter for pre-validation before remote tests |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `npx` | Run skills CLI without global install | All discovery and install commands |
| `grep -E` | Regex validation of name fields | Local DSC-03 pre-check |
| `yaml` (python) | Parse SKILL.md frontmatter | Validate description length, name field extraction |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `npx skills add` | Manual SKILL.md validation only | Misses CLI-specific discovery bugs; doesn't trigger telemetry |
| `--agent claude-code -y` | Interactive install | Non-interactive is faster, CI-friendly, and avoids manual prompts |
| Python YAML parsing | Manual grep/sed | Python yaml module handles multiline `>` folded scalars correctly; grep/sed fails on macOS |

**No installation needed** -- `npx skills add` runs directly without prior install.

## Architecture Patterns

### Current Directory Structure (Post Phase 82)
```
skills/                          # Repo root, Tier 2 discovery path
  compose-validator/
    SKILL.md                     # name: compose-validator
    hooks/validate-compose.sh
  dockerfile-analyzer/
    SKILL.md                     # name: dockerfile-analyzer
    hooks/validate-dockerfile.sh
  gha-validator/
    SKILL.md                     # name: gha-validator
    hooks/validate-gha.sh
  k8s-analyzer/
    SKILL.md                     # name: k8s-analyzer
    hooks/validate-k8s.sh
public/skills -> ../skills       # Symlink bridge for Astro
```

### Pattern 1: Push-Then-Verify Workflow
**What:** Push local commits to remote before running CLI discovery verification.
**When to use:** When the skills CLI needs to fetch from GitHub (which is always for `owner/repo` shorthand).
**Sequence:**
1. Validate locally (frontmatter parsing, regex, name-directory matching)
2. Push all v1.14 commits to remote (`git push origin main`)
3. Run `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad`
4. Verify 4 skills appear in output
5. Test individual install with `--skill` flag
6. Seed install to trigger telemetry

### Pattern 2: Non-Interactive CLI Usage
**What:** Use `--agent` and `-y` flags for scriptable, non-interactive CLI execution.
**When to use:** For reproducible verification and CI-friendly commands.
**Example:**
```bash
# List skills (non-interactive, no install)
npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad

# Install specific skill non-interactively
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill dockerfile-analyzer --agent claude-code -y

# Install all skills
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --all --agent claude-code -y
```

### Pattern 3: Local Pre-Validation
**What:** Validate frontmatter compliance before pushing to remote, to catch errors early.
**When to use:** Before any remote-dependent operations.
**Example:**
```bash
# Validate name regex for all 4 skills
for dir in skills/*/; do
  name=$(python3 -c "
import yaml
with open('${dir}SKILL.md') as f:
    parts = f.read().split('---', 2)
    print(yaml.safe_load(parts[1])['name'])
  ")
  dirname=$(basename "$dir")
  echo "$name" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*$' && echo "PASS: $name" || echo "FAIL: $name"
  [ "$name" = "$dirname" ] && echo "  dir match: YES" || echo "  dir match: NO"
done
```

### Anti-Patterns to Avoid
- **Running `--list` before pushing:** The CLI fetches from GitHub; local-only changes are invisible to it.
- **Using `--list` on a private repo without auth:** The CLI uses HTTPS GitHub API; private repos need auth.
- **Omitting `--agent` during install verification:** Without specifying an agent, the CLI enters interactive mode and prompts for selection.
- **Running seed install without verifying `--list` first:** If discovery fails, install will also fail; verify discovery before attempting install.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex/sed parser | `python3 -c "import yaml"` | Multiline folded scalars (`>`) break naive parsers; YAML spec is complex |
| Skills discovery testing | Manual file tree inspection | `npx skills add --list` | CLI's discovery algorithm searches 40+ directories with fallback to recursive; manual checks miss edge cases |
| Telemetry verification | Scraping skills.sh | Run `npx skills add` and check skills.sh page | Telemetry is triggered by CLI usage, not by manual API calls |
| Name validation | Custom regex in bash | Use exact regex `^[a-z0-9]+(-[a-z0-9]+)*$` with `grep -E` | This is the official spec regex; custom implementations may differ |

**Key insight:** The skills CLI is the single source of truth for discovery. Local file structure validation is a pre-check, not a substitute for CLI verification.

## Common Pitfalls

### Pitfall 1: Forgetting to Push Before CLI Verification
**What goes wrong:** `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` returns 0 skills or errors because the `skills/` directory doesn't exist on the remote.
**Why it happens:** 9 v1.14 commits are currently unpushed. The CLI clones/fetches from GitHub, not local filesystem.
**How to avoid:** Always push to remote before any `npx skills add` command that uses `owner/repo` shorthand.
**Warning signs:** "No skills found" or only old skills appearing in `--list` output.

### Pitfall 2: Name Validation False Confidence
**What goes wrong:** Assuming names are valid because they "look right" without actually running the regex.
**Why it happens:** Edge cases like consecutive hyphens (`k8s--analyzer`), leading/trailing hyphens (`-k8s-analyzer`), or uppercase letters (`K8s-Analyzer`) are easy to miss visually.
**How to avoid:** Run the exact regex `^[a-z0-9]+(-[a-z0-9]+)*$` against each name. Use `grep -E` or Python `re.match()`.
**Warning signs:** CLI rejecting skills during install with name validation errors.

### Pitfall 3: Interactive Mode Blocking Verification
**What goes wrong:** `npx skills add` enters interactive mode and waits for user input, blocking automated verification.
**Why it happens:** Without `--agent` and `-y` flags, the CLI prompts for agent selection and confirmation.
**How to avoid:** Always use `--agent <agent> -y` for non-interactive execution, or `--list` which is inherently non-interactive.
**Warning signs:** Verification step appears to hang or never completes.

### Pitfall 4: Telemetry Not Appearing Immediately
**What goes wrong:** After seed install, the skill doesn't immediately appear on skills.sh leaderboard.
**Why it happens:** Telemetry aggregation may have a delay. The leaderboard is not real-time.
**How to avoid:** Don't block on leaderboard appearance. The requirement (DSC-05) is that the install command was executed, not that the leaderboard updated.
**Warning signs:** Repeatedly checking skills.sh immediately after install.

### Pitfall 5: Confusing `--list` with `--skill`
**What goes wrong:** Using `--list` expects no installation but `--skill` without `--list` triggers installation.
**Why it happens:** The flags serve different purposes: `--list` is read-only discovery, `--skill` is selective installation.
**How to avoid:** Use `--list` first to verify discovery, then `--skill` for individual install testing.
**Warning signs:** Unexpected installations or missing installations.

### Pitfall 6: Description Length Limit
**What goes wrong:** SKILL.md with description longer than 1024 characters is rejected.
**Why it happens:** The Agent Skills spec enforces a 1-1024 character limit on the `description` frontmatter field.
**How to avoid:** Current descriptions are: compose-validator (771), dockerfile-analyzer (724), gha-validator (737), k8s-analyzer (919). All within limits. No action needed.
**Warning signs:** CLI errors mentioning "description too long" during install.

## Code Examples

Verified patterns from official sources and local validation:

### Pre-Validation: Frontmatter Check
```bash
# Source: Local validation against Agent Skills spec
python3 -c "
import yaml, os, re, glob
regex = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')
for path in sorted(glob.glob('skills/*/SKILL.md')):
    dirname = os.path.basename(os.path.dirname(path))
    with open(path) as f:
        parts = f.read().split('---', 2)
    fm = yaml.safe_load(parts[1])
    name = fm.get('name', '')
    desc = fm.get('description', '')
    name_valid = bool(regex.match(name))
    dir_match = name == dirname
    desc_valid = 1 <= len(desc) <= 1024
    status = 'PASS' if all([name_valid, dir_match, desc_valid]) else 'FAIL'
    print(f'{status}: {dirname} (name={name}, name_valid={name_valid}, dir_match={dir_match}, desc_len={len(desc)})')
"
```

### Push to Remote
```bash
# Push all unpushed v1.14 commits to remote
git push origin main
```

### Discovery Verification (DSC-01)
```bash
# Source: https://github.com/vercel-labs/skills README
npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad
# Expected output: 4 skills listed (compose-validator, dockerfile-analyzer, gha-validator, k8s-analyzer)
```

### Individual Install Verification (DSC-02)
```bash
# Source: https://github.com/vercel-labs/skills README
# Install each skill individually to verify (non-interactive)
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill dockerfile-analyzer --agent claude-code -y
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill compose-validator --agent claude-code -y
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill gha-validator --agent claude-code -y
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill k8s-analyzer --agent claude-code -y
```

### Seed Install for Telemetry (DSC-05)
```bash
# Source: skills.sh FAQ - "Skills appear on the leaderboard automatically
# through anonymous telemetry when users run npx skills add <owner/repo>"
npx skills add PatrykQuantumNomad/PatrykQuantumNomad --agent claude-code -y
```

### Cleanup After Verification
```bash
# After verification, installed skills will be at ~/.claude/skills/
# Cleanup if needed:
# ls ~/.claude/skills/
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SKILL.md distribution | `npx skills add` CLI ecosystem | Jan 2026 | Standardized discovery, install, and telemetry |
| `.claude/skills/` only | 40+ agent-specific directories + `skills/` at root | Jan 2026+ | Universal discovery across all agent platforms |
| No telemetry/listing | Anonymous telemetry powers skills.sh leaderboard | Jan 2026 | Skills auto-appear on leaderboard after first install |

**Current ecosystem state:**
- skills CLI: actively maintained by Vercel Labs
- Leaderboard: top 200 entries, both all-time and trending (24h) views
- Supported agents: 17+ (claude-code, cursor, copilot, codex, and more)
- Agent Skills spec: name (1-64 chars), description (1-1024 chars), plus optional fields

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Shell commands + Python 3 (no test framework needed) |
| Config file | None -- verification is CLI-based, not code-based |
| Quick run command | `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` |
| Full suite command | Run all 5 DSC-XX verification commands sequentially |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DSC-01 | CLI discovers exactly 4 skills | smoke | `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` | N/A (CLI command) |
| DSC-02 | Each skill installs individually | smoke | `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --skill <name> --agent claude-code -y` (x4) | N/A (CLI command) |
| DSC-03 | All 4 names pass regex `^[a-z0-9]+(-[a-z0-9]+)*$` | unit | `python3 -c "import yaml, re; ..."` (see Code Examples) | N/A (inline script) |
| DSC-04 | Directory name matches frontmatter name | unit | `python3 -c "import yaml, os; ..."` (see Code Examples) | N/A (inline script) |
| DSC-05 | Seed install triggers telemetry | manual-only | `npx skills add PatrykQuantumNomad/PatrykQuantumNomad --agent claude-code -y` | N/A (CLI command) |

### Sampling Rate
- **Per task commit:** Run local pre-validation (DSC-03, DSC-04)
- **Per wave merge:** Full CLI verification (DSC-01 through DSC-05)
- **Phase gate:** All 5 requirements verified with evidence

### Wave 0 Gaps
None -- no test infrastructure needed. All verification is done via CLI commands and inline scripts.

## Open Questions

1. **Will the CLI discover skills from `skills/` at repo root for a profile repo (owner/owner format)?**
   - What we know: The CLI documentation lists `skills/` as a standard discovery path. The `vercel-labs/agent-skills` repo uses this exact pattern. The CLI supports `owner/repo` GitHub shorthand.
   - What's unclear: Whether the profile repo format (`PatrykQuantumNomad/PatrykQuantumNomad`) has any special behavior. Profile repos are just regular repos from git's perspective.
   - Recommendation: HIGH confidence this works -- profile repos are standard GitHub repos. Verify with `--list` after push.

2. **How quickly does the skills.sh leaderboard update after first install?**
   - What we know: "Skills appear on the leaderboard automatically through anonymous telemetry." The leaderboard is not documented as real-time.
   - What's unclear: Exact propagation delay.
   - Recommendation: Don't block on leaderboard visibility. DSC-05 requires the install command to execute, not leaderboard presence. The skills.sh page at `skills.sh/PatrykQuantumNomad/PatrykQuantumNomad` currently returns 404; it should resolve after telemetry processes.

3. **Are `hooks/` subdirectories discovered/handled by the CLI?**
   - What we know: The Agent Skills spec mentions optional `scripts/` subdirectory, not `hooks/`. The CLI installs SKILL.md content. The `hooks/` directories contain shell scripts referenced within the SKILL.md content.
   - What's unclear: Whether the CLI copies `hooks/` subdirectories during install or only SKILL.md.
   - Recommendation: LOW impact -- the hooks are referenced within SKILL.md and execute via the agent, not via the skills CLI. The CLI installs the SKILL.md file; hook scripts are part of the skill directory and get copied with it.

## Sources

### Primary (HIGH confidence)
- [vercel-labs/skills GitHub README](https://github.com/vercel-labs/skills) - CLI flags, discovery directories, SKILL.md format, installation workflow
- [Vercel blog: Agent Skills FAQ](https://vercel.com/blog/agent-skills-explained-an-faq) - Name validation regex `^[a-z0-9]+(-[a-z0-9]+)*$`, frontmatter spec (name 1-64 chars, description 1-1024 chars)
- [skills.sh FAQ](https://skills.sh/docs/faq) - Telemetry mechanism ("appear on leaderboard automatically"), anonymous aggregate counts only

### Secondary (MEDIUM confidence)
- [Vercel changelog: Introducing Skills](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem) - Launch date Jan 20 2026, skills.sh directory
- [Phase 82 Research & Summary](/.planning/phases/82-directory-restructure/) - Verified local directory structure, symlink, file modes

### Tertiary (LOW confidence)
- skills.sh leaderboard propagation timing - No official documentation on delay; assumed near-real-time based on FAQ language

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - CLI is the only tool; flags verified from official README
- Architecture: HIGH - Directory structure verified locally; matches canonical vercel-labs/agent-skills pattern
- Pitfalls: HIGH - Push-before-verify is the primary risk; well-documented in STATE.md blockers
- Pre-validation: HIGH - All 4 skills validated locally against spec (regex, name matching, description length)

**Current state findings:**
- 9 unpushed commits on main (all v1.14 work)
- 4 skills at `skills/` root: dockerfile-analyzer, compose-validator, gha-validator, k8s-analyzer
- All names pass regex `^[a-z0-9]+(-[a-z0-9]+)*$`
- All directory names match frontmatter `name` fields
- All descriptions within 1-1024 character limit
- `public/skills` symlink intact pointing to `../skills`
- skills.sh/PatrykQuantumNomad/PatrykQuantumNomad returns 404 (expected -- not yet listed)

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (30 days -- skills CLI is stable, spec is frozen)
