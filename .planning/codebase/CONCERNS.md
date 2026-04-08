# Codebase Concerns

**Analysis Date:** 2026-04-08

## Tech Debt

**Monolithic OG image generator file:**
- Issue: All 20+ OG image generator functions live in a single 3,879-line, 109KB file.
- Files: `src/lib/og-image.ts`
- Impact: Slow to navigate and modify; any change to shared utilities (fonts, `truncate`, `renderOgPng`) risks breaking unrelated generators; TypeScript compile times are longer for this module.
- Fix approach: Split by domain — one file per feature (beauty-index, db-compass, eda, ai-landscape, guides, tools). A shared `src/lib/og-image/shared.ts` holds fonts and utilities.

**Stale planning-phase comments embedded in source:**
- Issue: Code comments reference internal implementation phases (e.g., "Phase 55", "Phase 75", "Phase 96") that have no meaning to future contributors.
- Files: `src/lib/eda/og-cache.ts` (line 50), `src/lib/eda/thumbnail.ts` (line 7), `src/lib/eda/technique-content/types.ts` (line 22), `src/lib/eda/notebooks/templates/sections/setup.ts` (lines 31-34), `src/lib/tools/compose-validator/graph-builder.ts` (lines 6, 99), `src/lib/tools/k8s-analyzer/sample-manifest.ts` (line 4), `src/stores/ghaValidatorStore.ts` (lines 6, 23)
- Impact: Comments become misleading after the phases complete; reduces readability.
- Fix approach: Replace phase references with descriptive intent comments ("Used by OG image endpoints", "Pre-loaded editor sample").

**Duplicate URL-state modules across four tools:**
- Issue: Each tool has its own near-identical `url-state.ts` using lz-string for hash-based state sharing.
- Files: `src/lib/tools/dockerfile-analyzer/url-state.ts`, `src/lib/tools/compose-validator/url-state.ts`, `src/lib/tools/k8s-analyzer/url-state.ts`, `src/lib/tools/gha-validator/share/url-state.ts`
- Impact: Bug fixes or format changes must be applied in four places. The gha-validator already diverged (different prefix scheme).
- Fix approach: Extract a generic `src/lib/tools/shared/url-state.ts` parameterized by prefix string.

**Large data files with inline console.log in code examples:**
- Issue: `src/data/beauty-index/code-features.ts` (3,161 lines, 71KB) contains `console.log` calls embedded in language code samples at lines 759, 763, 767, 938, 942, 946. These are intentional code examples, not debug statements, but automated linting will flag them if a linter is ever added.
- Files: `src/data/beauty-index/code-features.ts`
- Impact: Would block any future eslint `no-console` rule adoption.
- Fix approach: Document exception with inline comment, or store code samples as raw strings in a separate data format.

**`@ts-ignore` suppression for GSAP Flip import:**
- Issue: A `// @ts-ignore` comment suppresses a TypeScript error around the GSAP Flip plugin import due to a case-insensitive filesystem issue.
- Files: `src/pages/projects/index.astro` (line 103)
- Impact: The type error is silently bypassed; if the import ever fails at runtime the error won't be caught early.
- Fix approach: Use a conditional import with an explicit type annotation or upgrade GSAP to a version that resolves the casing issue.

## Known Bugs

**No known runtime bugs identified. The following are latent risks rather than confirmed defects.**

## Security Considerations

**IndexNow API key hardcoded in source:**
- Risk: The IndexNow submission key `970b0a65b110ef7d7f6311827aff7146` is committed as a plain string constant.
- Files: `src/integrations/indexnow.ts` (line 3)
- Current mitigation: The IndexNow protocol explicitly allows the key to be public — it is verified by a `.txt` file at the domain root (`public/970b0a65b110ef7d7f6311827aff7146.txt`), so this is intentional and not a security exposure for this specific API.
- Recommendations: Add an inline comment clarifying this is intentionally public per the IndexNow spec to prevent future maintainers from treating it as a secret rotation incident.

**WASM binary committed to git (actionlint):**
- Risk: `public/wasm/actionlint.wasm` (9.4MB) is listed in `.gitignore` as a generated download artifact, meaning it is NOT tracked in git — the `.gitignore` entry correctly excludes `public/wasm/`. The binary is downloaded by `scripts/download-actionlint-wasm.mjs` at build time.
- Files: `public/wasm/actionlint.wasm`, `scripts/download-actionlint-wasm.mjs`
- Current mitigation: `.gitignore` excludes the directory. The `prebuild` script re-downloads the binary.
- Recommendations: Pin the downloaded version to a specific release hash to prevent supply chain drift.

**`window.__cursorState` global namespace pollution:**
- Risk: A global object is attached to `window` to persist cursor state across Astro view transitions.
- Files: `src/components/animations/CustomCursor.astro` (lines 8-19)
- Current mitigation: Prefixed with `__` to signal private intent.
- Recommendations: Use a module-level variable or a named Map stored in a dedicated module instead of window pollution.

**`window.__heroScrollProgress` global in scroll animations:**
- Risk: Scroll progress is written directly to `window.__heroScrollProgress` to share state between GSAP scroll trigger and the Three.js canvas.
- Files: `src/lib/scroll-animations.ts` (line 78), `src/components/HeadScene.tsx` (line 8, global declaration)
- Current mitigation: TypeScript global interface declaration prevents accidental access in typed code.
- Recommendations: Replace with a nanostores atom or a module-level shared ref to eliminate window mutation.

**Dockerfile sample contains plaintext credentials:**
- Risk: Sample Dockerfile used in the tool contains `ENV DATABASE_URL=postgres://admin:password@db:5432/myapp`.
- Files: `src/lib/tools/dockerfile-analyzer/sample-dockerfile.ts` (line 17)
- Current mitigation: These are intentional fake credentials used to trigger the tool's own security rules and demonstrate the linter's detection capability.
- Recommendations: Add a comment confirming these are intentionally fake test credentials, not real ones.

## Performance Bottlenecks

**38MB unoptimized 3D head model committed to public:**
- Problem: `public/head.glb` is 38MB. An optimized version (`head-opt.glb` at 1.3MB) exists and is what the code actually loads (`useGLTF.preload('/head-opt.glb')`), but the original 38MB file is still present.
- Files: `public/head.glb` (38MB), `public/head-opt.glb` (1.3MB), `public/head-opt-25.glb` (2.5MB)
- Cause: The large source asset was never removed after optimization.
- Improvement path: Delete `public/head.glb` and `public/head-opt-25.glb` from the repo to reduce clone size. They are not referenced in production code.

**OG image generation lacks caching for the majority of pages:**
- Problem: Only EDA pages and guide pages use `getOrGenerateOgImage` with the `node_modules/.cache/og-eda` disk cache. All beauty-index, db-compass, ai-landscape, and tool OG pages regenerate their images on every build.
- Files: `src/pages/open-graph/beauty-index/[slug].png.ts`, `src/pages/open-graph/db-compass/[slug].png.ts`, `src/pages/open-graph/ai-landscape/[slug].png.ts`, `src/pages/open-graph/ai-landscape/vs/[slug].png.ts`, `src/pages/open-graph/tools/*.png.ts`
- Cause: The shared `src/lib/eda/og-cache.ts` wrapper was not applied outside EDA/guides sections.
- Improvement path: Apply `getOrGenerateOgImage` to all non-EDA OG endpoints; unify the two separate cache modules (`src/lib/eda/og-cache.ts` and `src/lib/guides/og-cache.ts`) into a single `src/lib/og-cache.ts`.

**`InteractiveGraph.tsx` is a 964-line mega-component:**
- Problem: The AI Landscape graph component handles D3 zoom, SVG rendering, keyboard navigation, tour state, URL state, comparison mode, and tooltip management in a single file.
- Files: `src/components/ai-landscape/InteractiveGraph.tsx`
- Cause: Feature additions were appended rather than decomposed.
- Improvement path: Extract zoom/pan behavior to `useGraphZoom`, rendering to a `GraphCanvas` sub-component, and keyboard navigation to the existing `graph-navigation.ts` module.

## Fragile Areas

**`src/lib/tools/gha-validator/worker/actionlint-worker.ts` — WASM Go bridge:**
- Files: `src/lib/tools/gha-validator/worker/actionlint-worker.ts`
- Why fragile: The worker aliases `self` as `window` to satisfy Go's WASM runtime (`(self as any).window = self`), sets multiple `any`-typed callbacks on `self`, and relies on `go.run()` never resolving. Any Go WASM ABI change will break silently at runtime with no TypeScript protection.
- Safe modification: Always test against the exact `actionlint.wasm` version in use before changing callback names or message types. The typed `WorkerOutMessage` / `WorkerInMessage` in `src/lib/tools/gha-validator/types.ts` must stay in sync.
- Test coverage: Basic worker message types tested in `src/lib/tools/gha-validator/__tests__/types.test.ts`, but no integration test for the WASM binary interaction.

**`src/integrations/indexnow.ts` — CI-only external call:**
- Files: `src/integrations/indexnow.ts`
- Why fragile: The integration fires a live HTTP request to `api.indexnow.org` during every CI build. A network timeout or API failure will silently fail (error is caught and logged) but could delay or fail builds if error handling changes.
- Safe modification: Keep the `if (!process.env.CI) return` guard. Do not add `throw` to the catch block.
- Test coverage: Not tested. Relies on CI environment variable detection.

**`src/components/animations/CustomCursor.astro` — Astro view transition state:**
- Files: `src/components/animations/CustomCursor.astro`
- Why fragile: Uses `window.__cursorState` to avoid re-initializing the cursor on Astro client-side page transitions. If the component is re-mounted without a page transition, or if the window property is cleared by another script, the cursor DOM node will be duplicated or lost.
- Safe modification: Ensure the component is only included once in a layout, not conditionally.
- Test coverage: No tests.

## Scaling Limits

**Validator rule counts — manual indexing:**
- Current capacity: The k8s analyzer has 81 rule files in `src/lib/tools/k8s-analyzer/rules/`, compose validator has 72 rule files in `src/lib/tools/compose-validator/`. Rules are indexed in manually-maintained `index.ts` barrel files.
- Limit: Each new rule requires a manual entry in the corresponding `index.ts` and a unique rule code. There is no validation that codes are unique or that new rules are registered.
- Scaling path: Generate rule indexes from the file system at build time using a script (similar to how `generate-layout.mjs` works in prebuild).

**OG image build time scales linearly:**
- Current capacity: With 14 OG image endpoint files producing hundreds of images across ai-landscape, beauty-index, db-compass, and tools sections, the static build regenerates all uncached images sequentially.
- Limit: Adding content sections multiplies build time directly. At current scales (est. ~300+ OG images) builds complete but are slow.
- Scaling path: Apply caching uniformly (see Performance Bottlenecks above) and consider parallelizing OG generation using `Promise.all` within each endpoint file.

## Dependencies at Risk

**`astro` at `^5.3.0` — major version in active development:**
- Risk: Astro 5.x introduces breaking changes (content collections v2 API). The project pins to `^5.3.0` which accepts patch and minor upgrades automatically.
- Impact: Future minor versions could break content collection schemas or Astro integrations.
- Migration plan: Pin to a specific minor version (`~5.3.0`) until the next Astro upgrade is explicitly tested.

**`volar-service-yaml` override to `0.0.70`:**
- Risk: The `overrides` block in `package.json` pins `volar-service-yaml` to `0.0.70` to work around a compatibility issue.
- Files: `package.json` (line 69-71)
- Impact: This dependency cannot be updated automatically via `npm update`. If the root cause is fixed upstream, the override must be manually removed.
- Migration plan: Track the upstream issue; remove the override when `volar-service-yaml` is compatible again.

**`three` at `^0.182.0` and `@react-three/fiber` at `^9.5.0`:**
- Risk: Three.js has a history of breaking API changes between minor versions. The `^` range allows any future `0.x` upgrade.
- Impact: The `HeadScene` component uses Three.js material and geometry APIs that may change.
- Migration plan: Pin to `~0.182.0` and test explicitly before upgrading.

## Missing Critical Features

**No CI/CD pipeline configured:**
- Problem: There is no `.github/workflows/` directory and no CI configuration. The `prebuild` script downloads a WASM binary from the internet at build time but this is not validated in any pipeline.
- Blocks: Automated quality gates, PR preview deployments, and reproducible production builds require a CI definition.

**No ESLint or Prettier configuration:**
- Problem: No `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, or `biome.json` exists at the project root. The `tsconfig.json` extends `astro/tsconfigs/strict` for type checking only.
- Files: `tsconfig.json` (type-check only), no linting config present.
- Blocks: Consistent code style enforcement. Multiple `as any` casts and `eslint-disable` comments in source suggest ad-hoc style rather than enforced standards.

## Test Coverage Gaps

**k8s-analyzer — zero unit tests for all 81 rule files:**
- What's not tested: All 81 rule files under `src/lib/tools/k8s-analyzer/rules/` have no corresponding tests. The engine, parser, scorer, and graph extractor also have no test files.
- Files: `src/lib/tools/k8s-analyzer/` (entire directory)
- Risk: Rule logic regressions are invisible. Scoring changes and false-positive/negative changes go undetected.
- Priority: High — this is a security-focused tool that checks for privileged containers, root users, and RBAC over-permissions.

**compose-validator — zero unit tests for all 72 rule files:**
- What's not tested: All 72 rule files under `src/lib/tools/compose-validator/rules/` have no tests. The parser, graph extractor, and schema validator are also untested.
- Files: `src/lib/tools/compose-validator/` (entire directory)
- Risk: Semantic rule changes (undefined volumes, orphaned secrets) cannot be verified without manual testing.
- Priority: High — semantic validation bugs could produce false negatives on real security issues.

**dockerfile-analyzer — 61 source files, only 2 test files:**
- What's not tested: Only rules `PG011-missing-user-directive` and `PG012-node-caged-pointer-compression` have tests. All other 59+ rule files have no coverage.
- Files: `src/lib/tools/dockerfile-analyzer/rules/` (tested: `rules/security/__tests__/`, `rules/efficiency/__tests__/`; untested: all remaining rules)
- Risk: Dockerfile analysis rules have zero regression protection outside the two tested rules.
- Priority: High.

**React components — no component tests:**
- What's not tested: No `.test.tsx` files exist anywhere. Components like `InteractiveGraph.tsx`, `HeadScene.tsx`, and all tool editor/results panels have no unit or integration tests.
- Files: `src/components/` (entire directory)
- Risk: UI regressions in interactive features (AI landscape graph, tool editors) are caught only through manual testing.
- Priority: Medium.

**Vitest config excludes `.test.tsx` files:**
- What's not tested: `vitest.config.ts` includes only `src/**/*.test.ts`, which means any future `.test.tsx` React component tests would be silently ignored.
- Files: `vitest.config.ts` (line 4)
- Risk: If someone writes a component test with `.test.tsx` extension, it will not run.
- Priority: Medium — fix the glob to `src/**/*.test.{ts,tsx}`.

---

*Concerns audit: 2026-04-08*
