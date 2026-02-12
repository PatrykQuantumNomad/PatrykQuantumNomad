---
phase: "09-external-blog-integration"
plan: "01"
subsystem: "blog-content"
tags: ["external-blog", "content-stubs", "getStaticPaths", "astro"]
requires: ["content.config.ts blog schema with externalUrl and source fields"]
provides: ["10 external blog post stubs", "getStaticPaths guards for external posts"]
affects: ["src/data/blog/", "src/pages/blog/[slug].astro", "src/pages/open-graph/[...slug].png.ts"]
tech-stack:
  added: []
  patterns: ["frontmatter-only stub files for external content", "getStaticPaths filter chaining"]
key-files:
  created:
    - src/data/blog/ext-ollama-kubernetes-deployment.md
    - src/data/blog/ext-open-source-kubernetes-ai-assistant.md
    - src/data/blog/ext-custom-ai-agent-sql-server.md
    - src/data/blog/ext-red-teaming-llms-ai-agents.md
    - src/data/blog/ext-golden-paths-agentic-ai.md
    - src/data/blog/ext-devops-handbook-ai-agents.md
    - src/data/blog/ext-kubernetes-cloud-costs.md
    - src/data/blog/ext-apache-airflow-data-pipeline.md
    - src/data/blog/ext-cloud-composer-terraform.md
    - src/data/blog/ext-kubernetes-elasticsearch-python.md
  modified:
    - src/pages/blog/[slug].astro
    - src/pages/open-graph/[...slug].png.ts
key-decisions:
  - "Frontmatter-only stubs with no body content for external posts"
  - "getStaticPaths guards exclude external posts in both dev and prod modes"
duration: "2min 18s"
completed: "2026-02-12"
---

# Phase 9 Plan 1: External Blog Content and getStaticPaths Guards Summary

10 frontmatter-only external blog post stubs (6 Kubert AI, 4 Translucent Computing) with getStaticPaths guards preventing external posts from generating detail pages or OG images.

## Performance

- Duration: 2min 18s
- Build time: 1.19s (down from 1.41s after guards removed 10 unnecessary pages)
- Pages built: 19 (down from 29 before guards)

## Accomplishments

### Task 1: Create 10 external blog post stub files
- Created 10 frontmatter-only markdown files in `src/data/blog/` with `ext-` prefix
- 6 Kubert AI posts covering: Ollama K8s deployment, K8s AI assistant, SQL Server agent, red teaming LLMs, golden paths agentic AI, DevOps handbook
- 4 Translucent Computing posts covering: K8s cloud costs, Apache Airflow pipelines, Cloud Composer Terraform, K8s Elasticsearch Python
- All stubs pass Zod schema validation (externalUrl as valid URL, source as enum value)
- Commit: `b1912e9`

### Task 2: Add getStaticPaths guards to exclude external posts
- Modified `[slug].astro` to filter out posts with `externalUrl` set
- Modified `[...slug].png.ts` to filter out posts with `externalUrl` set
- Guards active in both dev and prod modes (external posts never get detail pages)
- Blog detail pages reduced from 11 to 1, OG images reduced from 11 to 1
- Commit: `2055c71`

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | b1912e9 | feat(09-01): create 10 external blog post stub files |
| 2 | 2055c71 | feat(09-01): add getStaticPaths guards to exclude external posts |

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| src/data/blog/ext-ollama-kubernetes-deployment.md | created | Kubert AI external post stub |
| src/data/blog/ext-open-source-kubernetes-ai-assistant.md | created | Kubert AI external post stub |
| src/data/blog/ext-custom-ai-agent-sql-server.md | created | Kubert AI external post stub |
| src/data/blog/ext-red-teaming-llms-ai-agents.md | created | Kubert AI external post stub |
| src/data/blog/ext-golden-paths-agentic-ai.md | created | Kubert AI external post stub |
| src/data/blog/ext-devops-handbook-ai-agents.md | created | Kubert AI external post stub |
| src/data/blog/ext-kubernetes-cloud-costs.md | created | Translucent Computing external post stub |
| src/data/blog/ext-apache-airflow-data-pipeline.md | created | Translucent Computing external post stub |
| src/data/blog/ext-cloud-composer-terraform.md | created | Translucent Computing external post stub |
| src/data/blog/ext-kubernetes-elasticsearch-python.md | created | Translucent Computing external post stub |
| src/pages/blog/[slug].astro | modified | Added externalUrl filter to getStaticPaths |
| src/pages/open-graph/[...slug].png.ts | modified | Added externalUrl filter to getStaticPaths |

## Decisions Made

1. **Frontmatter-only stubs**: External posts have zero body content -- only frontmatter fields. This ensures they never accidentally render content on detail pages and clearly signal their role as metadata-only entries.

2. **Guards in both dev and prod**: The `!data.externalUrl` filter runs unconditionally (not just in PROD), so external posts never generate detail pages even during development. This prevents confusion and broken pages.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues/Concerns

None.

## Next Phase Readiness

Plan 09-01 provides the data layer that Plan 09-02 will consume. The 10 external post stubs are ready for:
- Blog listing page integration (rendering external posts with outbound links)
- RSS feed inclusion
- Tag page aggregation (already happening -- build shows 13 tag pages including new tags from external posts)

## Self-Check: PASSED

- All 12 files verified (10 created, 2 modified)
- Both commits verified (b1912e9, 2055c71)
- External post count: 10
