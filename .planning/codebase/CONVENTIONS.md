# Coding Conventions

## Language & Style

- **TypeScript strict mode** — extends `astro/tsconfigs/strict`
- **ESM everywhere** — `"type": "module"` in package.json
- **React JSX** — `jsxImportSource: "react"` in tsconfig

## Naming Patterns

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `InteractiveGraph.tsx`, `BlogCard.astro` |
| Files (lib/utils) | kebab-case | `og-image.ts`, `url-state.ts` |
| Files (stores) | camelCase + Store | `ghaValidatorStore.ts` |
| Functions | camelCase | `buildContentDateMap()`, `parseManifest()` |
| Constants | UPPER_SNAKE_CASE | `INDEXNOW_KEY`, `SITE`, `DATE_RE` |
| Types/Interfaces | PascalCase | `SiteConfig`, `ValidationResult` |
| React hooks | use* prefix | `useTour.ts`, `useMediaQuery.ts`, `useUrlNodeState.ts` |
| Rule IDs | PG### prefix | `PG011-missing-user-directive`, `PG012-node-caged-pointer-compression` |
| Test files | same-name.test.ts in `__tests__/` | `__tests__/engine.test.ts` |

## Import Order

Observed convention (not enforced by linter):
1. Node built-ins (`node:fs`, `node:path`)
2. External packages (`astro`, `react`, `d3-*`)
3. Internal aliases / relative imports

## Module Design

- **Domain modules** follow a consistent structure: `engine.ts` (orchestrator), `types.ts` (shared types), `rules/` (categorized rules), `scorer.ts` (scoring), `url-state.ts` (URL serialization)
- **Astro components** handle server-side rendering and layout
- **React components** (`.tsx`) used exclusively for client-side interactivity (islands architecture)
- **Nanostores** for cross-component client state (filters, editor content)

## Error Handling

- Build-time errors: try/catch with `/* non-fatal */` comments for graceful degradation (e.g., sitemap date parsing)
- Validation engines: structured error/warning/info result objects, never throw
- CI integration: `process.env.CI` guard for external API calls (IndexNow)

## Component Patterns

### Astro Components
- Server-rendered by default
- Props via Astro.props destructuring
- JSON-LD structured data as dedicated `*JsonLd.astro` components
- Layout composition: page → layout → components

### React Islands
- `client:load` or `client:visible` directives for hydration
- Nanostores for state shared between islands
- Custom hooks in same directory as component (`useTour.ts`, `useMediaQuery.ts`)

## Data Patterns

- **Site config:** `src/data/site.ts` — centralized site metadata with `as const` assertions
- **Content collections:** MDX in `src/data/blog/`, guide JSON + chapters in `src/data/guides/`
- **Static JSON:** `nodes.json`, `graph.json`, `models.json` for tool/explorer data
- **Large data files:** TypeScript exports for type safety (e.g., `code-features.ts` at 3,161 lines)

## SVG Generation

- EDA charts use D3-based SVG generators in `src/lib/eda/svg-generators/`
- Each generator follows `plot-base.ts` conventions
- Guide diagrams in `src/lib/guides/svg-diagrams/` with dedicated test coverage

## OG Image Generation

- Single monolithic file: `src/lib/og-image.ts` (3,879 lines)
- Uses satori (SVG) + sharp (PNG conversion)
- Covers all page types with variant-specific layouts
