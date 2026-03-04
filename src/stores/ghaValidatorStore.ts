import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { GhaUnifiedViolation } from '../lib/tools/gha-validator/types';
import type { GhaScoreResult } from '../lib/tools/gha-validator/types';

// ── Phase 75: WASM state atoms ───────────────────────────────────────

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

// ── Phase 78: Analysis result atoms ──────────────────────────────────

/** Combined analysis result with violations, score, and pass indicator */
export interface GhaAnalysisResult {
  violations: GhaUnifiedViolation[];
  score: GhaScoreResult;
  pass: 1 | 2;
}

/** Analysis result atom -- null before first analysis, updated on Pass 1 and Pass 2 */
export const ghaResult = atom<GhaAnalysisResult | null>(null);

/** Whether an analysis is currently in progress */
export const ghaAnalyzing = atom<boolean>(false);

/** Reference to the CodeMirror EditorView for cross-component access (click-to-navigate) */
export const ghaEditorViewRef = atom<EditorView | null>(null);

/** Whether the editor content has changed since the last analysis */
export const ghaResultsStale = atom<boolean>(false);
