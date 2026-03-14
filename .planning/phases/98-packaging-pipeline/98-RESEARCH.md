# Phase 98: Packaging Pipeline - Research

**Researched:** 2026-03-14
**Domain:** ZIP packaging with archiver, Astro build integration hooks, static file serving on GitHub Pages
**Confidence:** HIGH

## Summary

This phase creates a build-time ZIP packaging pipeline that bundles each case study's generated Jupyter notebook (.ipynb), its NIST .DAT dataset file (LF-normalized), and a shared requirements.txt into a self-contained downloadable ZIP. The ZIPs are generated during `astro build` via an `astro:build:done` integration hook and written to `dist/downloads/notebooks/{slug}.zip` for serving as static assets from GitHub Pages.

The decision to use archiver (not JSZip) is locked from STATE.md. Archiver v7.0.1 provides a streaming interface for ZIP creation with `file()` for disk files and `append()` for string/buffer content. The critical pitfall is that `archive.finalize()` resolves its promise before the output stream has finished flushing to disk -- the correct pattern wraps the entire operation in a Promise that resolves on the output stream's `close` event.

The existing `indexnow.ts` integration provides the exact pattern to follow: a function returning an `AstroIntegration` object with an `astro:build:done` hook. The `dir` parameter is a `URL` object pointing to the output directory (typically `dist/`), which must be converted via `fileURLToPath()` for filesystem operations. The hook receives `pages` and `logger` as additional parameters. All 10 .DAT files exist in `handbook/datasets/` and total ~83KB; several use CRLF line endings that must be normalized to LF before inclusion. Build-time notebook generation for 7 standard case studies (via `buildStandardNotebook()`) is already fast, and ZIP creation of these small files will add well under 5 seconds to the ~36-second build.

**Primary recommendation:** Create a `notebookPackager()` Astro integration in `src/integrations/notebook-packager.ts` following the `indexnow.ts` pattern, using archiver v7.0.1 with a Promise-wrapped `close` event pattern. Generate ZIP files only for case studies whose builder functions are available (initially 7 standard slugs from Phase 97, extensible to all 10 after Phase 100).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PACK-01 | Each notebook zipped with its NIST .DAT dataset file(s) as self-contained download | archiver `append()` for generated notebook JSON and requirements.txt strings, `file()` for .DAT from disk; all 10 .DAT files verified in `handbook/datasets/`; CRLF normalization needed for 8 of 10 files |
| PACK-02 | Zip files generated at build time via Astro integration hook or prebuild script | `astro:build:done` hook pattern established in `indexnow.ts`; `dir` is `URL` to dist, use `fileURLToPath()`; archiver stream-close-event pattern for reliable completion |
| PACK-03 | Generated zip files served as static assets from GitHub Pages | Files written to `dist/downloads/notebooks/{slug}.zip` are served with correct `application/zip` MIME type by GitHub Pages (mime-db standard); no special configuration needed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| archiver | 7.0.1 | ZIP archive creation with streaming interface | Locked decision from STATE.md; handles mixed binary/UTF-8 correctly (unlike JSZip) |
| @types/archiver | 7.0.0 | TypeScript type definitions for archiver | DefinitelyTyped package; provides Archiver, ArchiverOptions, EntryData types |
| Astro Integration API | 5.17.x | `astro:build:done` hook for post-build file generation | Existing pattern in project (`indexnow.ts`); official API with `dir`, `pages`, `logger` |
| Vitest | 4.x | Unit testing for packaging functions | Already configured; 639 tests passing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:fs | built-in | `createWriteStream`, `mkdirSync`, `readFileSync` | Writing ZIP output, reading .DAT files, creating directories |
| node:fs/promises | built-in | `mkdir` | Async directory creation in integration hook |
| node:url | built-in | `fileURLToPath` | Converting `dir` URL parameter to filesystem path |
| node:path | built-in | `join`, `resolve` | Path construction for cross-platform compatibility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| archiver | JSZip | JSZip has encoding issues with mixed binary/UTF-8 content (locked out by STATE.md decision) |
| archiver | adm-zip | adm-zip works synchronously with in-memory buffers; archiver's streaming is better for build pipelines |
| `astro:build:done` hook | prebuild script | Hook runs after Astro build, can access `dir` directly; prebuild would need separate output management |

**Installation:**
```bash
npm install archiver @types/archiver
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── integrations/
│   ├── indexnow.ts              # Existing integration (pattern reference)
│   └── notebook-packager.ts     # NEW: ZIP packaging integration
├── lib/eda/notebooks/
│   ├── __tests__/
│   │   ├── notebook-packager.test.ts  # NEW: Unit tests for packaging
│   │   └── ... (existing tests)
│   ├── registry/
│   │   └── index.ts             # CASE_STUDY_REGISTRY, getCaseStudyConfig()
│   ├── templates/
│   │   └── standard.ts          # buildStandardNotebook(), STANDARD_SLUGS
│   ├── requirements.ts          # REQUIREMENTS_TXT constant
│   ├── notebook.ts              # createNotebook()
│   └── types.ts                 # NotebookV4, Cell, etc.
handbook/
└── datasets/
    ├── RANDN.DAT                # 10 NIST dataset files
    └── ...
```

### Pattern 1: Astro Integration with astro:build:done Hook
**What:** A function that returns an `AstroIntegration` object with an `astro:build:done` hook
**When to use:** For generating files that should appear in the `dist/` output after Astro has completed its build
**Example:**
```typescript
// Source: existing src/integrations/indexnow.ts + Astro docs
import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';

export default function notebookPackager(): AstroIntegration {
  return {
    name: 'notebook-packager',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const distDir = fileURLToPath(dir);
        // Generate ZIP files into distDir + '/downloads/notebooks/'
      },
    },
  };
}
```

### Pattern 2: Promise-Wrapped Archiver Stream
**What:** Wrapping archiver in a Promise that resolves on the output stream's `close` event, NOT on `finalize()` return
**When to use:** Always, when using archiver to write ZIP files to disk
**Example:**
```typescript
// Source: archiver GitHub issues #772, #476 — verified best practice
import archiver from 'archiver';
import { createWriteStream } from 'node:fs';

function createZip(outputPath: string, files: ZipEntry[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') reject(err);
    });

    archive.pipe(output);

    for (const file of files) {
      if (file.sourcePath) {
        archive.file(file.sourcePath, { name: file.name });
      } else if (file.content) {
        archive.append(file.content, { name: file.name });
      }
    }

    archive.finalize();
  });
}
```

### Pattern 3: LF Normalization for .DAT Files
**What:** Reading .DAT file content as UTF-8 text, replacing `\r\n` with `\n`, and appending to archive as string
**When to use:** For all .DAT files since some use CRLF (8 of 10 verified) and some use LF
**Example:**
```typescript
// Normalize CRLF -> LF for cross-platform compatibility
const datContent = readFileSync(datPath, 'utf-8').replace(/\r\n/g, '\n');
archive.append(datContent, { name: config.dataFile });
```

### Pattern 4: Extensible Slug-Based Generation
**What:** Iterating over available builder functions rather than hard-coded slug lists
**When to use:** When Phase 100 adds 3 advanced notebooks, the packager should automatically include them
**Example:**
```typescript
// Build function map: slug -> builder
// Phase 97 provides STANDARD_SLUGS + buildStandardNotebook
// Phase 100 will add buildAdvancedNotebook for 3 more slugs
import { STANDARD_SLUGS, buildStandardNotebook } from '../lib/eda/notebooks/templates/standard';
import { getCaseStudyConfig } from '../lib/eda/notebooks/registry';

const NOTEBOOK_BUILDERS: Record<string, (slug: string) => NotebookV4> = {};
for (const slug of STANDARD_SLUGS) {
  NOTEBOOK_BUILDERS[slug] = buildStandardNotebook;
}
// Phase 100 will add: NOTEBOOK_BUILDERS['beam-deflections'] = buildAdvancedNotebook; etc.
```

### Anti-Patterns to Avoid
- **Awaiting `archive.finalize()` directly:** The returned promise resolves before the output stream finishes writing. Always wrap in a Promise that listens for the output stream's `close` event.
- **Reading .DAT files as binary and appending as Buffer:** This preserves CRLF line endings. Always read as UTF-8 string and normalize to LF.
- **Hard-coding slug list in the integration:** Use the registry and builder function availability to determine what to package. This makes Phase 100 a pure additive change.
- **Using `archive.directory()` or `archive.glob()`:** Each ZIP has exactly 3 known files. Explicit `file()` and `append()` calls are clearer and more predictable.
- **Writing to `public/` instead of `dist/`:** Files in `public/` would be committed to the repo. ZIP files are build artifacts and belong in `dist/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP file creation | Custom ZIP writer with node:zlib | archiver v7.0.1 | ZIP format has deflate, store, central directory, CRC32; archiver handles all edge cases |
| MIME type configuration for GitHub Pages | Custom headers file or edge function | Default behavior | GitHub Pages uses mime-db; `.zip` automatically gets `application/zip` |
| Cross-platform path handling | Manual string concatenation for paths | `fileURLToPath()` + `path.join()` | `dir` is a URL object; Windows paths have edge cases with drive letters |
| Stream completion detection | `setTimeout` or polling | Promise + `close` event | Only the stream knows when its internal buffer is flushed to disk |

**Key insight:** The ZIP format specification is deceptively complex (compression methods, CRC32 checksums, central directory records, UTF-8 filename flags). Archiver handles all of this correctly including mixed binary/text content.

## Common Pitfalls

### Pitfall 1: archive.finalize() Promise Race Condition
**What goes wrong:** Awaiting `archive.finalize()` and then checking the ZIP file -- the file may be empty or truncated.
**Why it happens:** `finalize()` signals that no more entries will be added, but the promise resolves when the internal queue is processed, not when the output stream has flushed all data to disk.
**How to avoid:** Wrap the entire archiver lifecycle in a Promise that resolves on the output stream's `close` event:
```typescript
return new Promise((resolve, reject) => {
  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);
  // ... add files ...
  archive.finalize();
});
```
**Warning signs:** Tests pass locally but ZIP files are occasionally empty or truncated in CI.

### Pitfall 2: CRLF Line Endings in .DAT Files
**What goes wrong:** ZIP contains .DAT files with mixed line endings; Python pandas `read_fwf()` may misparse on some platforms.
**Why it happens:** 8 of 10 NIST .DAT files use CRLF (`\r\n`), 2 use LF (`\n`). If copied as binary, the inconsistency persists.
**How to avoid:** Read all .DAT files as UTF-8 text, apply `.replace(/\r\n/g, '\n')`, and `append()` the normalized string. This is safe because all .DAT files are ASCII text.
**Warning signs:** `file` command shows "with CRLF line terminators" on .DAT files.

### Pitfall 3: Missing Output Directory
**What goes wrong:** `createWriteStream` throws `ENOENT` because `dist/downloads/notebooks/` doesn't exist.
**Why it happens:** Astro creates `dist/` but not arbitrary subdirectories within it.
**How to avoid:** Call `mkdirSync(outputDir, { recursive: true })` before creating any write streams.
**Warning signs:** Build fails with "ENOENT: no such file or directory" error.

### Pitfall 4: Notebook JSON Formatting
**What goes wrong:** Notebook JSON is minified (single line), making it unreadable when users open the `.ipynb` file in a text editor.
**Why it happens:** `JSON.stringify(notebook)` without indentation.
**How to avoid:** Use `JSON.stringify(notebook, null, 1)` (indent with 1 space, matching Jupyter's default format) and ensure a trailing newline: `+ '\n'`.
**Warning signs:** `.ipynb` file opens correctly in Jupyter but is a single very long line.

### Pitfall 5: Integration Registration Order
**What goes wrong:** Integration runs but `dir` points to wrong location or pages array is empty.
**Why it happens:** Integration added before Astro core integrations in `astro.config.mjs`.
**How to avoid:** Add `notebookPackager()` to the `integrations` array in `astro.config.mjs` AFTER `sitemap()` and before or after `indexNow()`. The `astro:build:done` hook runs after ALL integrations' build hooks complete, so order matters less for this specific hook, but convention is to add custom integrations near the end.
**Warning signs:** Unexpected behavior during build lifecycle hooks.

### Pitfall 6: Build Time Regression
**What goes wrong:** ZIP generation adds more than 5 seconds to the build.
**Why it happens:** Unlikely with these file sizes (~83KB total .DAT, ~50-100KB total notebook JSON), but possible if notebook generation is repeated instead of cached.
**How to avoid:** Generate each notebook once, serialize to JSON string, then pass the string to `archive.append()`. Do not call `buildStandardNotebook()` multiple times for the same slug. Process all ZIPs sequentially (simpler than parallel for 7-10 small files).
**Warning signs:** Build time exceeds 41 seconds (36s baseline + 5s budget).

## Code Examples

Verified patterns from official sources:

### Complete Integration Structure
```typescript
// Source: Astro Integration API docs + indexnow.ts project pattern
import type { AstroIntegration } from 'astro';
import { createWriteStream, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import archiver from 'archiver';

import { STANDARD_SLUGS, buildStandardNotebook } from '../lib/eda/notebooks/templates/standard';
import { getCaseStudyConfig } from '../lib/eda/notebooks/registry';
import { REQUIREMENTS_TXT } from '../lib/eda/notebooks/requirements';

export default function notebookPackager(): AstroIntegration {
  return {
    name: 'notebook-packager',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const distPath = fileURLToPath(dir);
        const outDir = join(distPath, 'downloads', 'notebooks');
        mkdirSync(outDir, { recursive: true });

        const start = Date.now();
        let count = 0;

        for (const slug of STANDARD_SLUGS) {
          const config = getCaseStudyConfig(slug);
          if (!config) continue;

          const notebook = buildStandardNotebook(slug);
          const notebookJson = JSON.stringify(notebook, null, 1) + '\n';
          const datPath = join(process.cwd(), 'handbook', 'datasets', config.dataFile);
          const datContent = readFileSync(datPath, 'utf-8').replace(/\r\n/g, '\n');

          await createZipFile(join(outDir, `${slug}.zip`), [
            { name: `${slug}.ipynb`, content: notebookJson },
            { name: config.dataFile, content: datContent },
            { name: 'requirements.txt', content: REQUIREMENTS_TXT },
          ]);
          count++;
        }

        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        logger.info(`Packaged ${count} notebooks in ${elapsed}s`);
      },
    },
  };
}
```

### ZIP Creation Helper
```typescript
// Source: archiver docs + GitHub issue #772 best practice
interface ZipEntry {
  name: string;
  content?: string;
  sourcePath?: string;
}

function createZipFile(outputPath: string, entries: ZipEntry[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') reject(err);
    });

    archive.pipe(output);

    for (const entry of entries) {
      if (entry.sourcePath) {
        archive.file(entry.sourcePath, { name: entry.name });
      } else if (entry.content !== undefined) {
        archive.append(entry.content, { name: entry.name });
      }
    }

    archive.finalize();
  });
}
```

### Astro Config Registration
```typescript
// Source: existing astro.config.mjs pattern
import notebookPackager from './src/integrations/notebook-packager';

export default defineConfig({
  // ...
  integrations: [
    expressiveCode(), mdx(), tailwind(), sitemap({...}),
    indexNow(),
    notebookPackager(),
    react(),
  ],
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSZip (in-memory buffer) | archiver (streaming) | Project decision | Avoids JSZip encoding issues with mixed binary/UTF-8 |
| API route endpoints for downloads | Static file serving from dist/ | Project decision | Simpler, no runtime server needed for static site |
| prebuild script | astro:build:done hook | Project decision | Hook has access to `dir` (output path); follows existing indexnow.ts pattern |

**Deprecated/outdated:**
- archiver v6.x: v7.0.1 is current; no breaking changes for this use case
- `archive.bulk()` method: Removed in archiver v5+. Use `archive.directory()` or explicit `archive.file()` calls instead.

## Open Questions

1. **Should ZIP generation process all 10 slugs or only available builders?**
   - What we know: Phase 97 provides 7 standard slugs. Phase 100 will add 3 advanced slugs. The packager runs as part of every build.
   - What's unclear: Should the packager silently skip unavailable slugs, or should it use a registry of available builders?
   - Recommendation: Use a builder registry pattern. Initially populate with `STANDARD_SLUGS` + `buildStandardNotebook`. Phase 100 adds advanced builders. The integration iterates the registry, not a hardcoded slug list. This makes Phase 100 a pure additive change.

2. **Should notebook JSON use 1-space or 2-space indentation?**
   - What we know: Jupyter's default is 1 space per level. Many tools use 2 spaces. nbformat validators accept any valid JSON.
   - What's unclear: Whether there's a convention that users expect.
   - Recommendation: Use 1-space indentation (`JSON.stringify(notebook, null, 1)`) to match Jupyter's own output format and minimize file size.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/eda/notebooks/__tests__/notebook-packager.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PACK-01 | Each ZIP contains .ipynb, .DAT, and requirements.txt | unit | `npx vitest run src/lib/eda/notebooks/__tests__/notebook-packager.test.ts -x` | Wave 0 |
| PACK-01 | .DAT content is LF-normalized (no CRLF) | unit | `npx vitest run src/lib/eda/notebooks/__tests__/notebook-packager.test.ts -x` | Wave 0 |
| PACK-01 | .ipynb is valid JSON with nbformat 4.5 | unit | `npx vitest run src/lib/eda/notebooks/__tests__/notebook-packager.test.ts -x` | Wave 0 |
| PACK-02 | Integration returns valid AstroIntegration with astro:build:done hook | unit | `npx vitest run src/integrations/__tests__/notebook-packager.test.ts -x` | Wave 0 |
| PACK-02 | ZIP files are created in correct output directory | integration | `npx astro build && ls dist/downloads/notebooks/*.zip` | manual |
| PACK-03 | ZIP files exist at dist/downloads/notebooks/{slug}.zip after build | smoke | `npx astro build && test -f dist/downloads/notebooks/normal-random-numbers.zip` | manual |
| PACK-03 | Build time regression under 5 seconds | smoke | `time npx astro build` (compare to 36s baseline) | manual |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/eda/notebooks/__tests__/notebook-packager.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + `astro build` produces ZIP files before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/eda/notebooks/__tests__/notebook-packager.test.ts` -- covers PACK-01 (ZIP content verification)
- [ ] `src/integrations/__tests__/notebook-packager.test.ts` -- covers PACK-02 (integration structure verification)
- [ ] Framework install: `npm install archiver @types/archiver` -- archiver not yet in package.json

## Sources

### Primary (HIGH confidence)
- [Astro Integration API docs](https://docs.astro.build/en/reference/integrations-reference/) -- `astro:build:done` hook signature, `dir` parameter type, `fileURLToPath` usage
- `src/integrations/indexnow.ts` (project source) -- existing integration pattern in the codebase
- `src/lib/eda/notebooks/` (project source) -- notebook generation infrastructure, registry, types
- [archiver official docs](https://www.archiverjs.com/docs/quickstart) -- API for `archive.file()`, `archive.append()`, `archive.finalize()`
- [archiver GitHub](https://github.com/archiverjs/node-archiver) -- v7.0.1 confirmed

### Secondary (MEDIUM confidence)
- [archiver GitHub issue #772](https://github.com/archiverjs/node-archiver/issues/772) -- finalize() Promise behavior, stream close event pattern
- [archiver GitHub issue #476](https://github.com/archiverjs/node-archiver/issues/476) -- finalize promise resolved before files written
- [@types/archiver on npm](https://www.npmjs.com/package/@types/archiver) -- v7.0.0, TypeScript types for archiver
- Local filesystem verification: all 10 .DAT files exist, sizes confirmed (~83KB total), CRLF patterns identified

### Tertiary (LOW confidence)
- GitHub Pages MIME type handling for .zip files -- inferred from mime-db usage, not explicitly documented for GitHub Pages specifically

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- archiver is locked decision, version verified, types available, Astro integration API well-documented
- Architecture: HIGH -- existing `indexnow.ts` provides exact pattern; `buildStandardNotebook()` and `getCaseStudyConfig()` APIs are tested and stable
- Pitfalls: HIGH -- archiver `finalize()` race condition is well-documented across multiple GitHub issues; CRLF issue verified directly on .DAT files

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain; archiver v7 and Astro 5 both mature)
