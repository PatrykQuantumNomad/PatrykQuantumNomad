# Phase 38 Research: Rule Documentation Pages

## Objective
Research how to implement per-rule documentation pages for the Docker Compose Validator at `/tools/compose-validator/rules/[code]`.

## Key Findings

### 1. Proven Pattern: Dockerfile Analyzer Rules Pages
The Dockerfile Analyzer at `src/pages/tools/dockerfile-analyzer/rules/[code].astro` is an exact template for this phase:
- Uses `getStaticPaths()` to generate one page per rule from the `allRules` array
- Each rule page shows: title, severity badge, category, explanation, fix suggestion, before/after code, related rules
- Uses `Code as AstroCode` from `astro:components` for syntax highlighting
- Layout accepts `title` and `description` for SEO meta tags
- BreadcrumbJsonLd provides structured data for breadcrumbs

### 2. Two Rule Types in Compose Validator
The compose validator has two rule types that both need documentation:
- **ComposeLintRule** (44 rules) — custom rules with `check()` functions in `rules/` subdirectories
- **SchemaRuleMetadata** (8 rules) — schema rules in `rules/schema/index.ts` without `check()` functions

Both share the same metadata shape: `id`, `title`, `severity`, `category`, `explanation`, `fix` (with `description`, `beforeCode`, `afterCode`).

### 3. Combined Registry Needed
- Current `rules/index.ts` only exports `allComposeRules` (44 custom rules)
- Schema rules are separate in `rules/schema/index.ts`
- A combined registry or helper function is needed to yield all 52 rules for `getStaticPaths()`
- Pattern: export an `allDocumentedRules` array that merges both sources

### 4. Related Rules Pattern
- The Dockerfile Analyzer has `rules/related.ts` that returns rules in the same category excluding self
- The same pattern should be mirrored for compose-validator
- Related rules link to other documentation pages within the same category

### 5. Syntax Highlighting Language
- Dockerfile Analyzer uses `lang="dockerfile"` for code blocks
- Compose Validator rules should use `lang="yaml"` for before/after code examples

### 6. SEO Structure
- Layout accepts `title` and `description` props for meta tags
- Dockerfile Analyzer pattern uses truncated `explanation` as meta description
- BreadcrumbJsonLd provides structured data: Home > Tools > Compose Validator > Rules > [Rule Code]
- Each page should have a unique, keyword-rich meta description

### 7. Category Labels
Compose Validator categories differ from Dockerfile Analyzer:
- **Compose**: schema, security, semantic, best-practice, style
- **Dockerfile**: security, efficiency, maintainability, reliability, best-practice
- Category display names and colors need mapping for the compose validator

### 8. File Structure (following Dockerfile Analyzer pattern)
```
src/pages/tools/compose-validator/rules/
  [code].astro          — Dynamic route page
src/tools/compose-validator/rules/
  related.ts            — Related rules helper
  index.ts              — Needs allDocumentedRules export (combined 52 rules)
```

## Risks & Considerations

1. **52 pages generated at build time** — Need to verify build performance is acceptable
2. **Schema rules metadata completeness** — Verify all 8 schema rules have full `fix` objects with `beforeCode`/`afterCode`
3. **Category color mapping** — Need to define severity and category colors consistent with existing UI
4. **Cross-linking to validator** — Rule pages should link back to the main validator tool

## Recommendations

1. **Clone the Dockerfile Analyzer pattern** — It's proven, tested, and follows all project conventions
2. **Create `allDocumentedRules`** — Single array combining lint rules + schema rules for getStaticPaths
3. **Add `related.ts`** — Same-category related rules helper
4. **Reuse existing layout/components** — ToolLayout, BreadcrumbJsonLd, severity badges
5. **YAML lang for Code component** — Use `lang="yaml"` instead of `lang="dockerfile"`

## RESEARCH COMPLETE
