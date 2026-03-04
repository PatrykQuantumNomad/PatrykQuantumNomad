import { atom } from 'nanostores';

/** Whether the WASM binary has been loaded and is ready */
export const ghaWasmReady = atom<boolean>(false);

/** WASM binary download progress (bytes received / total) */
export const ghaWasmProgress = atom<{ received: number; total: number } | null>(null);

/** WASM loading error message, if any */
export const ghaWasmError = atom<string | null>(null);

/** Whether WASM is currently loading (between init and ready/error) */
export const ghaWasmLoading = atom<boolean>(false);
