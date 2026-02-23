import { atom } from 'nanostores';
import type { EditorView } from '@codemirror/view';
import type { K8sAnalysisResult } from '../lib/tools/k8s-analyzer/types';

/** Current K8s analysis result — null before first analysis */
export const k8sResult = atom<K8sAnalysisResult | null>(null);

/** Whether K8s analysis is currently running */
export const k8sAnalyzing = atom<boolean>(false);

/** EditorView ref — set by K8sEditorPanel on mount, read by K8sResultsPanel for click-to-navigate */
export const k8sEditorViewRef = atom<EditorView | null>(null);

/** Whether results are stale (doc changed after last analysis) */
export const k8sResultsStale = atom<boolean>(false);
