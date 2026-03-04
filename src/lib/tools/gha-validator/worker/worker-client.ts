/**
 * Typed main-thread wrapper for the actionlint Web Worker.
 *
 * The consumer provides callbacks for Worker messages; store updates are the
 * consumer's responsibility (keeps the client dependency-free from nanostores).
 *
 * Usage:
 *   const w = createActionlintWorker({ onReady, onResult, onError, onProgress });
 *   // Wait for onReady(), then:
 *   w.analyze(yamlSource);
 *   // When done:
 *   w.terminate();
 */

import type { ActionlintError, WasmProgress, WorkerOutMessage } from '../types';

export interface ActionlintWorkerCallbacks {
  onReady: () => void;
  onResult: (errors: ActionlintError[]) => void;
  onError: (msg: string) => void;
  onProgress: (progress: WasmProgress) => void;
}

export function createActionlintWorker(callbacks: ActionlintWorkerCallbacks) {
  const worker = new Worker(
    new URL('./actionlint-worker.ts', import.meta.url),
    // Omit { type: 'module' } -- Classic Worker per locked decision
  );

  worker.onmessage = ({ data }: MessageEvent<WorkerOutMessage>) => {
    switch (data.type) {
      case 'ready':
        callbacks.onReady();
        break;
      case 'result':
        callbacks.onResult(data.payload);
        break;
      case 'error':
        callbacks.onError(data.payload);
        break;
      case 'progress':
        callbacks.onProgress(data.payload);
        break;
    }
  };

  worker.onerror = (event) => {
    callbacks.onError(event.message || 'Worker initialization failed');
  };

  return {
    analyze: (yaml: string) => worker.postMessage({ type: 'analyze', payload: yaml }),
    terminate: () => worker.terminate(),
  };
}
