---
phase: quick-009
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/data/projects.ts
autonomous: true
must_haves:
  truths:
    - "networking-tools and JobFlow appear in the Featured Projects hero section on /projects/"
    - "kps-graph-agent and kps-cluster-deployment appear in their normal category sections, not in the hero"
    - "The 'jobs' project displays as 'JobFlow' everywhere its name renders"
    - "Both newly featured projects render as large hero cards in the 2-column hero grid"
  artifacts:
    - path: "src/data/projects.ts"
      provides: "Updated featured flags and display name"
      contains: "JobFlow"
  key_links:
    - from: "src/data/projects.ts"
      to: "src/pages/projects/index.astro"
      via: "projects.filter(p => p.featured)"
      pattern: "featured.*true"
---

<objective>
Change which projects are featured on the projects page: un-feature kps-graph-agent and kps-cluster-deployment, make networking-tools and jobs featured. Rename the "jobs" project display name to "JobFlow".

Purpose: Update the project showcase to highlight networking-tools and JobFlow in the hero section, replacing the previous featured projects which move back to their category grids.
Output: Updated src/data/projects.ts with corrected featured flags, gridSize values, and display name.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/data/projects.ts
@src/pages/projects/index.astro
@src/components/ProjectHero.astro
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update featured flags, gridSize, and display name in projects.ts</name>
  <files>src/data/projects.ts</files>
  <action>
    Make these exact changes in src/data/projects.ts:

    1. **kps-graph-agent** (line ~34): Remove `featured: true` entirely, change `gridSize: 'large'` to `gridSize: 'medium'`

    2. **kps-cluster-deployment** (line ~114): Remove `featured: true` entirely, change `gridSize: 'large'` to `gridSize: 'medium'`

    3. **networking-tools** (line ~200): Add `featured: true`, confirm `gridSize` is already `'large'` (it is — no change needed)

    4. **jobs** (line ~187): Change `name: 'jobs'` to `name: 'JobFlow'`, add `featured: true`, change `gridSize: 'small'` to `gridSize: 'large'`

    Important: The `name` field is the display name shown in ProjectHero.astro (line 54: `{project.name}`) and ProjectCard.astro. The `url` field remains unchanged as `https://github.com/PatrykQuantumNomad/jobs`.

    Note: The projects page filters featured projects out of category groups (line 23 of projects/index.astro: `!p.featured`), so un-featuring kps-graph-agent and kps-cluster-deployment will automatically return them to their category sections, and featuring networking-tools and jobs will move them to the hero.
  </action>
  <verify>
    Run: `grep -n 'featured\|JobFlow\|gridSize' src/data/projects.ts` and confirm:
    - Only networking-tools and JobFlow have `featured: true`
    - kps-graph-agent and kps-cluster-deployment have no `featured` property and `gridSize: 'medium'`
    - jobs entry shows `name: 'JobFlow'` and `gridSize: 'large'`
    - networking-tools shows `gridSize: 'large'`

    Run: `npm run build` to confirm no build errors.
  </verify>
  <done>
    - Exactly 2 projects have `featured: true`: networking-tools and JobFlow
    - kps-graph-agent and kps-cluster-deployment have no featured flag and gridSize medium
    - The jobs project displays as "JobFlow" with gridSize large
    - Build succeeds with no errors
  </done>
</task>

</tasks>

<verification>
- `grep -c 'featured: true' src/data/projects.ts` returns exactly 2
- `grep 'JobFlow' src/data/projects.ts` shows the renamed project
- `npm run build` completes successfully
- Featured hero section on /projects/ will show networking-tools and JobFlow
</verification>

<success_criteria>
- networking-tools and JobFlow are the only featured projects
- kps-graph-agent and kps-cluster-deployment return to their category grids with medium gridSize
- The "jobs" project displays as "JobFlow" across the site
- Site builds without errors
</success_criteria>

<output>
After completion, create `.planning/quick/009-change-which-project-is-featured/009-SUMMARY.md`
</output>
