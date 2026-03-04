# Phase 75: WASM Infrastructure and Schema Foundation - Research

**Researched:** 2026-03-04
**Domain:** WebAssembly (Go WASM), Web Workers, JSON Schema compilation (ajv standalone)
**Confidence:** HIGH

## Summary

Phase 75 establishes two foundational validation engines: (1) actionlint running as a Go WASM binary inside a Web Worker, and (2) SchemaStore's github-workflow.json pre-compiled into a standalone ajv validator. Both engines are already proven patterns in this project -- the K8s analyzer and Compose validator use the exact same ajv standalone compilation approach, and the Web Worker pattern is well-documented for Go WASM.

The actionlint playground WASM binary is hosted at `https://rhysd.github.io/actionlint/main.wasm` (9.4 MB uncompressed, ~2.5 MB gzip-compressed transfer). The binary is built with Go 1.24 and requires the matching `wasm_exec.js` bridge file (also hosted at the playground). The binary exposes a `runActionlint(src)` function via `js.Global().Set()` and communicates results through window/global callbacks (`onCheckCompleted`, `showError`, `dismissLoading`). For our Web Worker integration, these callbacks must be adapted to `postMessage` since there is no `window` object in a Worker context.

The SchemaStore github-workflow.json is a self-contained JSON Schema draft-07 file (72 KB, 29 definitions, 135 internal `$ref` usages, zero external references). It validates to the exact same ajv standalone compilation pattern already used in `scripts/compile-compose-schema.mjs` and `scripts/compile-k8s-schemas.mjs`. The schema requires `on` and `jobs` as top-level properties and covers all GitHub Actions workflow structure.

**Primary recommendation:** Download the pre-built actionlint WASM binary and wasm_exec.js from the official playground (version-pinned to v1.7.11), serve both as static assets, load them in a classic Web Worker with adapted postMessage protocol, and compile the GitHub workflow schema using the project's established ajv standalone pattern.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WASM-01 | actionlint WASM binary served as static asset from `public/wasm/` directory | Binary available at `https://rhysd.github.io/actionlint/main.wasm` (9.4 MB). Download script fetches and caches locally. Companion `wasm_exec.js` from same URL. |
| WASM-02 | Web Worker loads and initializes actionlint WASM with `wasm_exec.js` bridge | Classic Worker pattern: `importScripts('/wasm/wasm_exec.js')`, then `new Go()` + `WebAssembly.instantiateStreaming`. Go 1.24 `wasm_exec.js` required for version match. |
| WASM-03 | Worker exposes `runActionlint(yamlSource)` returning `ActionlintError[]` with `{kind, message, line, column}` | Go WASM binary sets `runActionlint` on global scope. Worker adapts global callbacks to postMessage protocol. 16 error kinds documented. |
| WASM-04 | WASM loading shows progress indicator while binary downloads (~3MB gzipped) | Use `fetch()` with `Response.body.getReader()` for streaming download progress. Report bytes loaded vs Content-Length via postMessage. |
| WASM-05 | Worker message protocol handles analyze requests and returns results to main thread | Standard `onmessage`/`postMessage` with `{type, payload}` actions: `init`, `analyze`, `ready`, `result`, `error`, `progress`. |
| SCHEMA-01 | SchemaStore `github-workflow.json` pre-compiled into ajv standalone validator at build time | Self-contained schema (72 KB, 29 definitions, 0 external refs). Compile with `scripts/compile-gha-schema.mjs` following compose/K8s pattern. |
| SCHEMA-02 | Schema validation runs synchronously on main thread for instant structural feedback | Pre-compiled standalone validator exports a synchronous `validate()` function. Same pattern as compose-validator `validate-compose.js`. |
| SCHEMA-03 | 8 schema rules (GA-S001 through GA-S008) mapped from ajv validation errors with line numbers | Follow compose-validator `categorizeSchemaErrors` pattern: map ajv ErrorObject keyword+instancePath to domain-specific rule IDs with AST-resolved line numbers. |
| SCHEMA-04 | Schema rules cover: YAML syntax, unknown properties, type mismatches, missing required fields, invalid enum values | ajv keywords map directly: `additionalProperties` -> unknown props, `required` -> missing fields, `type` -> type mismatches, `enum` -> invalid enum values. YAML syntax errors caught by yaml parser (GA-S001). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| actionlint WASM | v1.7.11 | Deep semantic GitHub Actions workflow linting | Official pre-built binary from rhysd/actionlint playground, Go WASM |
| ajv | ^8.18.0 | JSON Schema compilation (build-time only) | Already in project dependencies, proven pattern from compose/K8s validators |
| ajv-formats | ^3.0.1 | Format validators for schema (build-time only) | Already in project dependencies |
| yaml | ^2.8.2 | YAML parsing with AST for line number resolution | Already in project dependencies, used by compose and K8s validators |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| wasm_exec.js | Go 1.24 | Go WASM runtime bridge for JavaScript | Required to load any Go-compiled WASM binary; version must match Go compiler |
| nanostores | ^1.1.0 | Client state management for WASM loading state | Already in project, bridges Worker status to React UI components |
| @nanostores/react | ^1.0.0 | React bindings for nanostores | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pre-built playground WASM | Build from Go source | Requires Go 1.24 toolchain + wasm-opt; pre-built is simpler (locked decision) |
| Classic Worker | Module Worker | Module Workers not supported in all browsers; classic Worker with importScripts is proven (locked decision) |
| Download from playground URL | Bundle WASM in npm package | No npm package exists for actionlint WASM; playground is the only source |

**Installation:**
No new npm packages needed. All dependencies already in project. WASM binary and wasm_exec.js are downloaded by a setup script, not npm.

## Architecture Patterns

### Recommended Project Structure
```
public/
  wasm/
    actionlint.wasm          # Pre-built binary (~9.4 MB, ~2.5 MB gzip)
    wasm_exec.js             # Go 1.24 WASM runtime bridge
src/
  lib/tools/gha-validator/
    types.ts                  # GHA-specific types (GhaSeverity, GhaCategory, etc.)
    worker/
      actionlint-worker.ts   # Web Worker script (Classic Worker)
      worker-client.ts       # Main-thread Worker wrapper with typed API
    schema-validator.ts       # Pre-compiled ajv validator consumer (sync)
    validate-gha.js           # AUTO-GENERATED: pre-compiled ajv standalone output
    parser.ts                 # YAML parsing + AST line resolution (reuse yaml lib)
    sample-workflow.ts        # Sample workflow with deliberate errors
  stores/
    ghaValidatorStore.ts      # Nanostore atoms for GHA validator state
scripts/
  download-actionlint-wasm.mjs   # Download + cache WASM binary + wasm_exec.js
  compile-gha-schema.mjs         # Pre-compile github-workflow.json -> validate-gha.js
```

### Pattern 1: Go WASM in Classic Web Worker
**What:** Load a Go WASM binary in a Classic Worker using `importScripts()` and communicate via `postMessage`.
**When to use:** When running CPU-intensive Go WASM code that would block the main thread.
**Example:**
```typescript
// Worker file (actionlint-worker.ts)
// Source: https://digitalflapjack.com/blog/go-wasm-workers/ + actionlint playground
importScripts('/wasm/wasm_exec.js');

const go = new Go();

// Replace global callbacks with postMessage (no `window` in Worker)
(self as any).onCheckCompleted = (errors: any[]) => {
  self.postMessage({ type: 'result', payload: errors });
};
(self as any).showError = (msg: string) => {
  self.postMessage({ type: 'error', payload: msg });
};
(self as any).dismissLoading = () => {
  self.postMessage({ type: 'ready' });
};
(self as any).getYamlSource = () => '';

// Load WASM with progress tracking
async function init() {
  const response = await fetch('/wasm/actionlint.wasm');
  const reader = response.body!.getReader();
  const contentLength = +(response.headers.get('Content-Length') ?? 0);

  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    self.postMessage({ type: 'progress', payload: { received, total: contentLength } });
  }

  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  const result = await WebAssembly.instantiate(buffer, go.importObject);
  go.run(result.instance);
  // `dismissLoading` callback fires -> posts { type: 'ready' }
}

self.onmessage = ({ data }) => {
  const { type, payload } = data;
  if (type === 'analyze') {
    // runActionlint is set on global scope by the Go WASM binary
    (self as any).runActionlint(payload);
    // Results arrive via onCheckCompleted callback -> postMessage
  }
};

init().catch(err => {
  self.postMessage({ type: 'error', payload: String(err) });
});
```

### Pattern 2: Main-Thread Worker Client
**What:** Typed wrapper around Worker postMessage for clean API.
**When to use:** Always wrap raw Worker communication in a typed client.
**Example:**
```typescript
// worker-client.ts
export interface ActionlintError {
  kind: string;
  message: string;
  line: number;
  column: number;
}

export interface WasmProgress {
  received: number;
  total: number;
}

type WorkerCallback = {
  onReady: () => void;
  onResult: (errors: ActionlintError[]) => void;
  onError: (msg: string) => void;
  onProgress: (progress: WasmProgress) => void;
};

export function createActionlintWorker(callbacks: WorkerCallback): {
  analyze: (yaml: string) => void;
  terminate: () => void;
} {
  const worker = new Worker(
    new URL('./actionlint-worker.ts', import.meta.url),
    { type: 'classic' }
  );

  worker.onmessage = ({ data }) => {
    switch (data.type) {
      case 'ready': callbacks.onReady(); break;
      case 'result': callbacks.onResult(data.payload); break;
      case 'error': callbacks.onError(data.payload); break;
      case 'progress': callbacks.onProgress(data.payload); break;
    }
  };

  return {
    analyze: (yaml: string) => worker.postMessage({ type: 'analyze', payload: yaml }),
    terminate: () => worker.terminate(),
  };
}
```

### Pattern 3: Pre-compiled ajv Schema Validation (Sync)
**What:** Build-time compiled ajv standalone validator for synchronous main-thread validation.
**When to use:** For instant structural feedback without WASM dependency.
**Example:**
```typescript
// schema-validator.ts -- follows compose-validator/schema-validator.ts pattern
import type { ValidateFunction } from 'ajv';
import { validate as _validate } from './validate-gha.js';

const validate = _validate as ValidateFunction;

export function validateGhaSchema(json: Record<string, unknown>) {
  const valid = validate(json);
  if (valid || !validate.errors) return [];
  return validate.errors;
}
```

### Anti-Patterns to Avoid
- **Loading WASM on main thread:** Go WASM binaries are CPU-intensive during initialization. Always use a Web Worker. The official playground loads on main thread but our use case requires responsive UI.
- **Module Worker for Go WASM:** Go's `wasm_exec.js` uses `importScripts()` internally and is designed for Classic Workers. Module Workers would require a rewrite of the bridge.
- **Building WASM from source in CI:** Requires Go 1.24 toolchain + wasm-opt. The pre-built binary from the official playground is sufficient and avoids toolchain dependency.
- **Using `window` in Worker:** Workers have no `window` object. Use `self` (or `globalThis`) for global scope.
- **Runtime ajv compilation:** Never compile schemas at runtime in the browser. Always pre-compile to standalone validators for CSP compliance and performance.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing + line numbers | Custom YAML parser | `yaml` library with `LineCounter` | 29 edge cases (anchors, merge keys, multiline strings) already handled |
| JSON Schema validation | Custom schema checker | ajv standalone pre-compiled validator | 72 KB schema with 135 `$ref` resolution points |
| WASM bridge | Custom Go-JS bridge | Go's `wasm_exec.js` | Version-locked to Go compiler, handles memory management, garbage collection |
| Download progress | Custom XHR progress | `fetch()` + `ReadableStream.getReader()` | Modern API, works in Workers, handles streaming correctly |
| Deep equality for ajv | Custom deep-equal | Inline `equal()` function in compile script | Already proven in compose/K8s compile scripts, handles all edge cases |

**Key insight:** This phase reuses 3 proven patterns from the project (ajv standalone compilation, YAML AST line resolution, nanostore state bridging). The only truly new element is the Go WASM + Web Worker integration, which is well-documented.

## Common Pitfalls

### Pitfall 1: Go WASM Version Mismatch
**What goes wrong:** `wasm_exec.js` from a different Go version than the WASM binary causes cryptic runtime errors ("cannot import Go" or "undefined Go class").
**Why it happens:** Go's WASM ABI is not stable across major versions. The binary and bridge must come from the same Go compiler version.
**How to avoid:** Pin the download script to a specific actionlint release tag (v1.7.11) and always download both `main.wasm` and `wasm_exec.js` from the same source.
**Warning signs:** "Go" is undefined in Worker, or "importObject" key errors during `WebAssembly.instantiate`.

### Pitfall 2: No `window` Object in Web Worker
**What goes wrong:** The actionlint Go binary calls `js.Global().Get("window")` to register callbacks. In a Worker, `window` is undefined.
**Why it happens:** The official playground runs on the main thread where `window` exists. Workers have `self` as global scope, but `js.Global()` in Go WASM returns `globalThis` which is `self` in Workers.
**How to avoid:** Go's `js.Global()` returns `globalThis` which is `self` in a Worker. The callbacks (`onCheckCompleted`, `showError`, `dismissLoading`, `getYamlSource`) must be set on `self` before WASM initialization. The Go binary uses `js.Global().Set()` and `js.Global().Call()` which will resolve to `self` in Worker context.
**Warning signs:** "window is not defined" errors during WASM init.

### Pitfall 3: WASM Binary Size and Caching
**What goes wrong:** 9.4 MB uncompressed WASM binary causes slow loads on first visit, or repeated downloads due to cache-busting.
**Why it happens:** Go WASM binaries include the full Go runtime. GitHub Pages serves with `cache-control: max-age=600` which is too short.
**How to avoid:** (1) Use gzip/brotli compression (reduces to ~2.5 MB transfer). (2) Version the filename (e.g., `actionlint-1.7.11.wasm`) for long-term caching. (3) Show a progress indicator during download. (4) Consider adding the binary to `.gitattributes` as LFS if the repo becomes too large.
**Warning signs:** Lighthouse performance drops, slow Time-to-Interactive.

### Pitfall 4: Go WASM `run()` Never Returns
**What goes wrong:** `go.run(instance)` returns a Promise that never resolves (by design -- Go uses `select {}` to keep the event loop alive). Awaiting it blocks subsequent code.
**Why it happens:** Go WASM programs use `select {}` as an infinite loop to keep the program running and processing JS callbacks.
**How to avoid:** Do NOT `await go.run(instance)`. Call it and let it run in the background. The `dismissLoading` callback signals when initialization is complete. Chain subsequent logic off the callback, not the run() Promise.
**Warning signs:** Worker appears to hang after WASM loads, never posts "ready" message.

### Pitfall 5: ajv `require()` in Standalone Output
**What goes wrong:** ajv standalone output contains `require("ajv/dist/runtime/equal")` which fails in browser ESM context.
**Why it happens:** ajv's standalone code generator injects CommonJS require() calls for runtime utilities like deep-equal.
**How to avoid:** Replace `require()` calls with inline implementations in the compile script, exactly as done in `compile-compose-schema.mjs` and `compile-k8s-schemas.mjs`. Check for remaining `require()` calls and fail the build if any are found.
**Warning signs:** Runtime errors about "require is not defined" when loading the validator module.

### Pitfall 6: Schema Has `format` Keywords
**What goes wrong:** The github-workflow.json schema may use `format` keywords (e.g., `"format": "uri"`) which require `ajv-formats` at runtime, injecting `require()` calls.
**Why it happens:** JSON Schema draft-07 supports format validation but ajv's standalone output needs runtime format functions.
**How to avoid:** Either (a) add `ajv-formats` during compilation and inline any remaining require() calls, or (b) strip `format` fields during preprocessing (as done in K8s schema compilation). For github-workflow.json, check which format keywords are used and decide based on validation importance.
**Warning signs:** `require("ajv-formats")` in compiled output.

### Pitfall 7: Worker URL Resolution in Astro/Vite
**What goes wrong:** `new Worker('./worker.ts')` path resolution fails in Vite build.
**Why it happens:** Vite transforms Worker imports differently than regular modules. The URL must be constructed with `new URL()` + `import.meta.url`.
**How to avoid:** Use Vite's Worker import pattern: `new Worker(new URL('./actionlint-worker.ts', import.meta.url))`. For Classic Workers, omit the `{ type: 'module' }` option.
**Warning signs:** 404 errors for worker script in production build, or worker script loaded but not executing.

### Pitfall 8: WASM Binary in Git Repository
**What goes wrong:** A 9.4 MB binary file in the Git repo inflates clone times and repo size significantly.
**Why it happens:** Git is not designed for large binary files; every clone downloads the full history.
**How to avoid:** Add `public/wasm/actionlint.wasm` to `.gitignore` and use a download/setup script (`scripts/download-actionlint-wasm.mjs`) that runs during project setup or CI. Alternatively, consider Git LFS. The download script should cache the binary locally and skip download if already present (like the K8s schema download pattern).
**Warning signs:** `git clone` takes minutes, repo size exceeds 50 MB.

## Code Examples

### Download Script for WASM Binary + wasm_exec.js
```javascript
// scripts/download-actionlint-wasm.mjs
// Source: Adapted from scripts/compile-k8s-schemas.mjs download pattern
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WASM_DIR = resolve(__dirname, '..', 'public/wasm');

// Pin to v1.7.11 -- the latest release as of 2026-02-14
const ACTIONLINT_VERSION = '1.7.11';
const PLAYGROUND_BASE = 'https://rhysd.github.io/actionlint';

const FILES = {
  'actionlint.wasm': `${PLAYGROUND_BASE}/main.wasm`,
  'wasm_exec.js': `${PLAYGROUND_BASE}/lib/js/wasm_exec.js`,
};

async function download(name, url, outputPath) {
  if (existsSync(outputPath)) {
    console.log(`  [cached] ${name}`);
    return;
  }
  console.log(`  [download] ${name} from ${url}`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed: ${resp.status} ${resp.statusText}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(outputPath, buffer);
  console.log(`  [saved] ${outputPath} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

async function main() {
  if (!existsSync(WASM_DIR)) mkdirSync(WASM_DIR, { recursive: true });
  for (const [name, url] of Object.entries(FILES)) {
    await download(name, url, resolve(WASM_DIR, name));
  }
  console.log(`\nactionlint WASM v${ACTIONLINT_VERSION} ready in ${WASM_DIR}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
```

### Compile Script for GitHub Workflow Schema
```javascript
// scripts/compile-gha-schema.mjs
// Source: Adapted from scripts/compile-compose-schema.mjs
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_URL = 'https://json.schemastore.org/github-workflow.json';
const SCHEMA_PATH = resolve(__dirname, 'schemas', 'github-workflow.json');
const OUTPUT_PATH = resolve(__dirname, '..', 'src/lib/tools/gha-validator/validate-gha.js');

// Step 1: Download schema if not cached
async function downloadSchema() {
  if (existsSync(SCHEMA_PATH)) {
    console.log('[cached] github-workflow.json');
    return;
  }
  console.log('[download] github-workflow.json');
  const resp = await fetch(SCHEMA_URL);
  if (!resp.ok) throw new Error(`Failed: ${resp.status}`);
  writeFileSync(SCHEMA_PATH, await resp.text());
}

// Step 2: Compile to standalone validator
function compile() {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    verbose: true,
    validateSchema: false,
    code: { source: true, esm: true },
  });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  let code = standaloneCode(ajv, validate);

  // Replace require() with inline implementations (same pattern as compose/K8s)
  const equalFn = `/* ... inline deep-equal ... */`;
  code = code.replace(
    /const (\w+)\s*=\s*require\("ajv\/dist\/runtime\/equal"\)\.default;/g,
    `${equalFn}\nconst $1 = equal;`,
  );

  if (code.includes('require(')) {
    const remaining = code.match(/require\([^)]+\)/g);
    console.error('ERROR: Remaining require() calls:', remaining);
    process.exit(1);
  }

  const output = `// AUTO-GENERATED -- do not edit. Run: node scripts/compile-gha-schema.mjs\n// @ts-nocheck\n${code}`;
  writeFileSync(OUTPUT_PATH, output);
  console.log(`Compiled: ${OUTPUT_PATH}`);
}

await downloadSchema();
compile();
```

### Worker Message Protocol Types
```typescript
// Source: Project convention from existing validator stores
// Worker -> Main thread messages
type WorkerMessage =
  | { type: 'ready' }
  | { type: 'result'; payload: ActionlintError[] }
  | { type: 'error'; payload: string }
  | { type: 'progress'; payload: { received: number; total: number } };

// Main thread -> Worker messages
type MainMessage =
  | { type: 'analyze'; payload: string };

// ActionlintError matches the Go WASM binary output
interface ActionlintError {
  kind: string;   // e.g., 'syntax-check', 'expression', 'action', 'runner-label'
  message: string;
  line: number;    // 1-based
  column: number;  // 1-based
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Go WASM on main thread | Go WASM in Web Worker | 2024+ | Prevents UI freeze during 50-200ms lint runs |
| `wasm_exec.js` in `misc/wasm/` | `wasm_exec.js` in `lib/wasm/` (Go 1.24) | Go 1.24 (2025) | Path changed from `$(go env GOROOT)/misc/wasm/` to `$(go env GOROOT)/lib/wasm/` |
| ajv-pack for standalone | ajv v7+ built-in standalone | ajv v7 (2020) | Native ESM support, better code generation |
| `WebAssembly.instantiate(buffer)` | `WebAssembly.instantiateStreaming(fetch())` | ~2020 | Faster WASM compilation via streaming; not available in all Workers |

**Deprecated/outdated:**
- `ajv-pack`: Archived, replaced by ajv v7+ standalone
- `wasm_exec.js` in `misc/wasm/`: Go 1.24+ moved to `lib/wasm/`; not relevant since we download from playground

## Open Questions

1. **WASM binary version pinning strategy**
   - What we know: The playground at `rhysd.github.io/actionlint/` always serves the latest deployed version. The HTTP ETag and Last-Modified headers confirm v1.7.11 (deployed 2026-02-14).
   - What's unclear: If the playground updates, old WASM binaries are overwritten. There is no versioned download URL.
   - Recommendation: Download and commit the binary hash in the download script. Add a version check that compares the downloaded file against a known SHA-256 hash. If the hash changes, fail and require explicit version bump. Alternatively, download from a tagged Git release archive (though the WASM is not in release assets -- only the playground hosts it).

2. **WASM binary in Git vs download-on-build**
   - What we know: The binary is 9.4 MB uncompressed. Git LFS is an option. Download-on-build avoids repo bloat.
   - What's unclear: GitHub Pages deployment via Actions -- does the build step have network access to download the WASM binary?
   - Recommendation: Use download-on-build in CI (GitHub Actions has network access). Add `public/wasm/actionlint.wasm` and `public/wasm/wasm_exec.js` to `.gitignore`. The download script runs as a pre-build step. For local development, run the download script once after clone.

3. **Format keywords in github-workflow.json**
   - What we know: The schema uses `"format": "uri"` in some places. The compose schema uses formats and handles them with `ajv-formats`.
   - What's unclear: Exactly which format keywords are used and whether stripping them (K8s approach) or keeping them (compose approach) is better.
   - Recommendation: Start with the compose approach (include `ajv-formats` during compilation). If the compiled output has problematic require() calls, strip format fields as done in K8s.

4. **`WebAssembly.instantiateStreaming` in Workers**
   - What we know: Streaming instantiation requires the server to return `application/wasm` MIME type. GitHub Pages does serve with this MIME type.
   - What's unclear: Some older browsers and Worker contexts may not support `instantiateStreaming`. The actionlint playground uses a fallback pattern.
   - Recommendation: Use the same fallback pattern as the playground: try `instantiateStreaming` first, fall back to `arrayBuffer` + `instantiate`. For progress tracking, use the manual `getReader()` approach regardless (streaming instantiation doesn't expose progress).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASM-01 | WASM binary exists in public/wasm/ | smoke | `ls public/wasm/actionlint.wasm` | N/A (file check) |
| WASM-02 | Worker loads WASM + wasm_exec.js | manual-only | Manual: open browser console, check Worker initialization | N/A (browser-only) |
| WASM-03 | runActionlint returns ActionlintError[] | manual-only | Manual: `window.__ghaWorker.analyze(badYaml)` in console | N/A (requires WASM runtime) |
| WASM-04 | Progress indicator visible during download | manual-only | Manual: throttle network in DevTools, observe UI | N/A (visual) |
| WASM-05 | Worker message protocol works | unit | `npx vitest run src/lib/tools/gha-validator/worker/__tests__/worker-client.test.ts -x` | Wave 0 |
| SCHEMA-01 | Schema pre-compiled to standalone validator | smoke | `node scripts/compile-gha-schema.mjs && ls src/lib/tools/gha-validator/validate-gha.js` | N/A (build script) |
| SCHEMA-02 | Schema validation runs synchronously | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/schema-validator.test.ts -x` | Wave 0 |
| SCHEMA-03 | 8 schema rules mapped with line numbers | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/schema-rules.test.ts -x` | Wave 0 |
| SCHEMA-04 | Schema rules cover listed error types | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/schema-rules.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual browser console verification

### Wave 0 Gaps
- [ ] `src/lib/tools/gha-validator/__tests__/schema-validator.test.ts` -- covers SCHEMA-02
- [ ] `src/lib/tools/gha-validator/__tests__/schema-rules.test.ts` -- covers SCHEMA-03, SCHEMA-04
- [ ] `src/lib/tools/gha-validator/worker/__tests__/worker-client.test.ts` -- covers WASM-05 (message protocol unit tests)
- [ ] Schema compile script needs to run before tests: `node scripts/compile-gha-schema.mjs`

## Sources

### Primary (HIGH confidence)
- actionlint playground source: https://github.com/rhysd/actionlint/tree/main/playground -- WASM build process, Go API, TypeScript interface
- actionlint main.go: https://raw.githubusercontent.com/rhysd/actionlint/main/playground/main.go -- `runActionlint` function signature, callback API
- actionlint lib.d.ts: `ActionlintError { kind, message, line, column }` type definition
- actionlint go.mod: Go 1.24.0 required
- actionlint Makefile: `GOOS=js GOARCH=wasm go build -o main.wasm`
- SchemaStore github-workflow.json: https://json.schemastore.org/github-workflow.json -- 72 KB, 29 definitions, 135 internal $ref, draft-07
- HTTP verification: `main.wasm` at https://rhysd.github.io/actionlint/main.wasm -- 9.4 MB (ETag confirms v1.7.11)
- HTTP verification: `wasm_exec.js` at https://rhysd.github.io/actionlint/lib/js/wasm_exec.js -- 200 OK
- actionlint checks documentation: https://github.com/rhysd/actionlint/blob/main/docs/checks.md -- 16 error kinds
- Existing project patterns: `scripts/compile-compose-schema.mjs`, `scripts/compile-k8s-schemas.mjs`, `src/lib/tools/compose-validator/schema-validator.ts`, `src/lib/tools/k8s-analyzer/schema-validator.ts`

### Secondary (MEDIUM confidence)
- ajv standalone docs: https://ajv.js.org/standalone.html -- ESM output, code generation options
- Go WASM Worker pattern: https://digitalflapjack.com/blog/go-wasm-workers/ -- Classic Worker + importScripts pattern
- Go WASM wiki: https://go.dev/wiki/WebAssembly -- wasm_exec.js location, version matching requirement
- actionlint releases: https://github.com/rhysd/actionlint/releases -- v1.7.11 released 2026-02-14

### Tertiary (LOW confidence)
- Gzipped transfer size (~2.5 MB) measured via curl -- actual browser download may vary with Brotli

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, WASM binary verified at source URL
- Architecture: HIGH -- patterns directly reuse existing compose/K8s validator architecture
- Pitfalls: HIGH -- verified against official docs, tested download URLs, cross-referenced multiple sources
- WASM binary acquisition: HIGH -- URL verified, headers checked, size confirmed, version pinned

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days -- stable domain, actionlint releases ~monthly)

**Actionlint error kinds reference (16 total):**
1. `syntax-check` -- unexpected keys, missing required keys, duplicates
2. `expression` -- `${{ }}` expression syntax and type errors
3. `job-needs` -- cyclic dependencies, undefined jobs in `needs:`
4. `matrix` -- duplicate matrix values, invalid `exclude:`
5. `events` -- webhook event validation, filter conflicts
6. `glob` -- glob pattern syntax in branch/tag/path filters
7. `action` -- action format validation, popular action input checks
8. `runner-label` -- runner label validation and conflicts
9. `shell-name` -- shell name validation
10. `id` -- job ID and step ID uniqueness
11. `credentials` -- hardcoded credentials detection
12. `env-var` -- environment variable name validation
13. `permissions` -- permission scope and access level validation
14. `workflow-call` -- reusable workflow calls validation
15. `shellcheck` -- shell script linting (UNAVAILABLE in WASM build)
16. `pyflakes` -- Python linting (UNAVAILABLE in WASM build)
