# Roadmap: patrykgolabek.dev

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-11)
- ✅ **v1.1 Content Refresh** - Phases 8-12 (shipped 2026-02-12)
- ✅ **v1.2 Projects Page Redesign** - Phases 13-15 (shipped 2026-02-13)
- ✅ **v1.3 The Beauty Index** - Phases 16-21 (shipped 2026-02-17)
- ✅ **v1.4 Dockerfile Analyzer** - Phases 22-27 (shipped 2026-02-20)
- ✅ **v1.5 Database Compass** - Phases 28-32 (shipped 2026-02-22)
- ✅ **v1.6 Docker Compose Validator** - Phases 33-40 (shipped 2026-02-23)
- ✅ **v1.7 Kubernetes Manifest Analyzer** - Phases 41-47 (shipped 2026-02-23)
- ✅ **v1.8 EDA Visual Encyclopedia** - Phases 48-55 (shipped 2026-02-25)
- ✅ **v1.9 EDA Case Study Deep Dive** - Phases 56-63 (shipped 2026-02-27)
- ✅ **v1.11 Beauty Index: Lisp** - Phases 69-71 (shipped 2026-03-02)
- ✅ **v1.12 Dockerfile Rules Expansion** - Phases 72-74 (shipped 2026-03-02)
- ✅ **v1.13 GitHub Actions Workflow Validator** - Phases 75-81 (shipped 2026-03-04)
- 🚧 **v1.14 DevOps Skills Publishing** - Phases 82-84 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>Phases 1-81 (v1.0 through v1.13) - SHIPPED</summary>

See MILESTONES.md for completed milestone details.

</details>

### v1.14 DevOps Skills Publishing (In Progress)

**Milestone Goal:** Package and publish 4 DevOps validator skills to the skills.sh open agent skills ecosystem

- [x] **Phase 82: Directory Restructure** - Move skills to repo root with symlink bridge for Astro serving (shipped 2026-03-05)
- [ ] **Phase 83: Discovery Verification** - Verify CLI discovery, individual install, and seed skills.sh listing
- [ ] **Phase 84: Documentation** - Update README with install commands, benchmark highlights, and tool references

## Phase Details

### Phase 82: Directory Restructure
**Goal**: Skills directories live at repo root for skills.sh CLI discovery while Astro build continues serving them via symlink
**Depends on**: Nothing (first phase of v1.14)
**Requirements**: DIR-01, DIR-02, DIR-03, DIR-04, DIR-05, DIR-06
**Success Criteria** (what must be TRUE):
  1. Running `ls skills/` at repo root shows exactly 4 skill directories (dockerfile-analyzer, compose-validator, k8s-analyzer, gha-validator)
  2. `public/skills` is a symlink pointing to `../skills` (not a regular directory)
  3. Benchmark artifacts exist under `public/benchmarks/` and no benchmark/workspace files remain under `skills/`
  4. All shell scripts under `skills/*/hooks/` have executable permission (`chmod +x`)
  5. `npm run build` succeeds and `dist/skills/*/SKILL.md` exists for all 4 skills
**Plans**: 1 plan

Plans:
- [x] 82-01-PLAN.md — Atomic directory restructure with symlink bridge + build verification

### Phase 83: Discovery Verification
**Goal**: All 4 skills are discoverable and installable via the skills CLI, and the first install seeds skills.sh listing
**Depends on**: Phase 82 (skills must be in correct directory structure and pushed to remote)
**Requirements**: DSC-01, DSC-02, DSC-03, DSC-04, DSC-05
**Success Criteria** (what must be TRUE):
  1. `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` outputs exactly 4 skills
  2. Each of the 4 skills installs successfully when using the `--skill` flag individually
  3. All 4 SKILL.md `name` frontmatter values match the regex `^[a-z0-9]+(-[a-z0-9]+)*$` and match their directory names
  4. At least one `npx skills add` install has been executed against the live remote to trigger skills.sh telemetry
**Plans**: TBD

Plans:
- [ ] 83-01: TBD

### Phase 84: Documentation
**Goal**: README.md showcases the skills suite with install commands so visitors can discover and install them
**Depends on**: Phase 83 (skills verified and listed before promotion)
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05
**Success Criteria** (what must be TRUE):
  1. README.md contains an Agent Skills section with a working `npx skills add PatrykQuantumNomad/PatrykQuantumNomad` install command
  2. All 4 skills are listed in README with descriptions and individual `npx skills add --skill` commands
  3. README includes benchmark highlight stats (98.8% pass rate, +42.4% improvement)
  4. GitHub Actions Workflow Validator appears in the Interactive Tools table in README
  5. No references to `public/skills/` remain anywhere in the repo (all updated to reflect new structure)
**Plans**: TBD

Plans:
- [ ] 84-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 82 → 83 → 84

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 82. Directory Restructure | v1.14 | 1/1 | Complete | 2026-03-05 |
| 83. Discovery Verification | v1.14 | 0/1 | Not started | - |
| 84. Documentation | v1.14 | 0/1 | Not started | - |
