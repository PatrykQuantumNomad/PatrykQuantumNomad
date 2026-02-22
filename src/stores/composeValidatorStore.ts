import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { ComposeAnalysisResult } from '../lib/tools/compose-validator/types';

/** Current compose analysis result — null before first analysis */
export const composeResult = atom<ComposeAnalysisResult | null>(null);

/** Whether compose analysis is currently running */
export const composeAnalyzing = atom<boolean>(false);

/** EditorView ref — set by ComposeEditorPanel on mount, read by ComposeResultsPanel for click-to-navigate */
export const composeEditorViewRef = atom<EditorView | null>(null);

/** Whether results are stale (doc changed after last analysis) */
export const composeResultsStale = atom<boolean>(false);
