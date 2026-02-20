import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { AnalysisResult } from '../lib/tools/dockerfile-analyzer/types';

/** Current analysis result — null before first analysis */
export const analysisResult = atom<AnalysisResult | null>(null);

/** Whether analysis is currently running */
export const isAnalyzing = atom<boolean>(false);

/** EditorView ref — set by EditorPanel on mount, read by ResultsPanel for click-to-navigate */
export const editorViewRef = atom<EditorView | null>(null);

/** Whether results are stale (doc changed after last analysis) */
export const resultsStale = atom<boolean>(false);
