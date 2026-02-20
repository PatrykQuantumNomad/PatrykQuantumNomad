import { atom } from 'nanostores';
import type { AnalysisResult } from '../lib/tools/dockerfile-analyzer/types';

/** Current analysis result — null before first analysis */
export const analysisResult = atom<AnalysisResult | null>(null);

/** Whether analysis is currently running */
export const isAnalyzing = atom<boolean>(false);
