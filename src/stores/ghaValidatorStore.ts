import { atom } from 'nanostores';
import type { GhaUnifiedViolation } from '../lib/tools/gha-validator/types';

/** Whether the WASM binary has been loaded and is ready */
export const ghaWasmReady = atom<boolean>(false);

/** WASM binary download progress (bytes received / total) */
export const ghaWasmProgress = atom<{ received: number; total: number } | null>(null);

/** WASM loading error message, if any */
export const ghaWasmError = atom<string | null>(null);

/** Whether WASM is currently loading (between init and ready/error) */
export const ghaWasmLoading = atom<boolean>(false);

/** Merged violations from both passes (updated twice: Pass 1 immediate, Pass 2 merged) */
export const ghaViolations = atom<GhaUnifiedViolation[]>([]);
