# Requirements: patrykgolabek.dev

**Defined:** 2026-03-05
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.14 Requirements

Requirements for DevOps Skills Publishing milestone. Each maps to roadmap phases.

### Directory Structure

- [x] **DIR-01**: Skills directories moved from `public/skills/{name}/` to `skills/{name}/` at repo root
- [x] **DIR-02**: Symlink created at `public/skills` pointing to `../skills` for Astro static serving
- [x] **DIR-03**: Benchmark artifacts moved from `public/skills/` to `public/benchmarks/` (JSON, MD, workspace dirs)
- [x] **DIR-04**: Shell hook scripts retain executable permission after move
- [x] **DIR-05**: Astro build produces `dist/skills/*/SKILL.md` for all 4 skills via symlink
- [x] **DIR-06**: Stale `--help/` directory removed if present at repo root

### Discovery & Verification

- [x] **DSC-01**: `npx skills add --list PatrykQuantumNomad/PatrykQuantumNomad` discovers exactly 4 skills
- [x] **DSC-02**: Each skill installable individually via `--skill` flag
- [x] **DSC-03**: All 4 SKILL.md frontmatter passes name validation regex `^[a-z0-9]+(-[a-z0-9]+)*$`
- [x] **DSC-04**: Directory name matches frontmatter `name` field for all 4 skills
- [x] **DSC-05**: First install seeded via `npx skills add` to trigger skills.sh telemetry listing

### Documentation

- [ ] **DOC-01**: README.md includes Agent Skills section with `npx skills add` install command
- [ ] **DOC-02**: README.md lists all 4 skills with descriptions and individual install commands
- [ ] **DOC-03**: README.md includes benchmark highlight (98.8% pass rate, +42.4% improvement)
- [ ] **DOC-04**: GitHub Actions Workflow Validator added to README Interactive Tools table
- [ ] **DOC-05**: All repo references to `public/skills/` updated to reflect new structure

## Future Requirements

None currently deferred.

## Out of Scope

| Feature | Reason |
|---------|--------|
| SKILL.md content refactoring | Files already work at 98.8% pass rate; restructuring risks degrading quality |
| Rename hooks/ to scripts/ | CLI doesn't enforce subdirectory names; zero functional benefit |
| Cross-marketplace publishing (LobeHub, SkillsMP) | Different ecosystems; scope creep |
| CI validation pipeline | Overkill for 4 static files that already pass validation |
| skills.sh custom landing page | Auto-generated from frontmatter; no custom HTML supported |
| Skill versioning / changelog | Agent Skills spec has no version enforcement |
| Dedicated skills repository | 4 skills is well within profile repo sweet spot |
| license/metadata frontmatter fields | Optional per spec; not blocking for publishing |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DIR-01 | Phase 82 | Complete |
| DIR-02 | Phase 82 | Complete |
| DIR-03 | Phase 82 | Complete |
| DIR-04 | Phase 82 | Complete |
| DIR-05 | Phase 82 | Complete |
| DIR-06 | Phase 82 | Complete |
| DSC-01 | Phase 83 | Complete |
| DSC-02 | Phase 83 | Complete |
| DSC-03 | Phase 83 | Complete |
| DSC-04 | Phase 83 | Complete |
| DSC-05 | Phase 83 | Complete |
| DOC-01 | Phase 84 | Pending |
| DOC-02 | Phase 84 | Pending |
| DOC-03 | Phase 84 | Pending |
| DOC-04 | Phase 84 | Pending |
| DOC-05 | Phase 84 | Pending |

**Coverage:**
- v1.14 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after Phase 83 completion*
