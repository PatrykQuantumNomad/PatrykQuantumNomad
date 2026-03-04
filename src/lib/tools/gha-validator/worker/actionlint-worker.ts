/**
 * Classic Web Worker that loads the actionlint Go WASM binary and exposes
 * `runActionlint()` for analyzing GitHub Actions workflow YAML.
 *
 * Communication protocol:
 *   Worker -> Main: { type: 'ready' | 'result' | 'error' | 'progress', payload? }
 *   Main -> Worker: { type: 'analyze', payload: string }
 *
 * The Go WASM binary (via wasm_exec.js) sets global callbacks on `self`:
 *   - dismissLoading()     -> signals WASM is ready
 *   - onCheckCompleted()   -> returns lint results
 *   - showError()          -> reports errors
 *   - getYamlSource()      -> returns YAML (unused; we pass via runActionlint)
 *   - runActionlint()      -> triggers analysis (set by Go binary)
 */

declare const Go: any;
declare function importScripts(...urls: string[]): void;

importScripts('/wasm/wasm_exec.js');

const go = new Go();

// Set callbacks that the Go WASM binary expects on globalThis.
// These MUST be set BEFORE go.run() so the binary finds them.
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

async function init() {
  const response = await fetch('/wasm/actionlint.wasm');
  if (!response.ok) {
    throw new Error(`Failed to fetch actionlint.wasm: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const contentLength = +(response.headers.get('Content-Length') ?? 0);

  // Stream chunks while reporting download progress
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    self.postMessage({ type: 'progress', payload: { received, total: contentLength } });
  }

  // Concatenate chunks into a single buffer
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  const result = await WebAssembly.instantiate(buffer, go.importObject);

  // DO NOT await go.run() -- it returns a Promise that NEVER resolves
  // because the Go binary uses `select {}` to stay alive. Readiness is
  // signaled via the dismissLoading callback above.
  go.run(result.instance);
}

self.onmessage = ({ data }) => {
  if (data.type === 'analyze') {
    (self as any).runActionlint(data.payload);
  }
};

init().catch((err) => {
  self.postMessage({ type: 'error', payload: String(err) });
});
