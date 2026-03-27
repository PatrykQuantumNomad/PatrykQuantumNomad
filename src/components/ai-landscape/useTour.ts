import { useState, useMemo, useCallback } from 'react';
import type { Tour } from '../../lib/ai-landscape/tours';
import { TOURS } from '../../lib/ai-landscape/tours';

export interface UseTourReturn {
  activeTour: Tour | null;
  currentStep: number;
  isActive: boolean;
  start: (tourId: string) => void;
  next: () => void;
  prev: () => void;
  exit: () => void;
  currentNodeId: string | null;
  narrative: string | null;
  highlightNodeIds: Set<string>;
}

/**
 * Tour state machine hook.
 *
 * Manages guided tour lifecycle: start, next, prev, exit.
 * Computes a highlight set containing the current step node plus
 * adjacent (prev/next) step nodes so that edges between consecutive
 * tour steps remain visible via the existing bothInChain opacity logic.
 */
export function useTour(): UseTourReturn {
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const isActive = activeTour !== null;

  const start = useCallback((tourId: string) => {
    const tour = TOURS.find((t) => t.id === tourId);
    if (!tour) return;
    setActiveTour(tour);
    setCurrentStep(0);
  }, []);

  const next = useCallback(() => {
    setCurrentStep((prev) => {
      if (!activeTour) return prev;
      return Math.min(prev + 1, activeTour.steps.length - 1);
    });
  }, [activeTour]);

  const prev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const exit = useCallback(() => {
    setActiveTour(null);
    setCurrentStep(0);
  }, []);

  const currentNodeId = useMemo(
    () => activeTour?.steps[currentStep]?.nodeId ?? null,
    [activeTour, currentStep],
  );

  const narrative = useMemo(
    () => activeTour?.steps[currentStep]?.narrative ?? null,
    [activeTour, currentStep],
  );

  const highlightNodeIds = useMemo(() => {
    if (!activeTour) return new Set<string>();
    const ids = new Set<string>();
    // Current step
    const cur = activeTour.steps[currentStep];
    if (cur) ids.add(cur.nodeId);
    // Previous step (for edge visibility between consecutive tour nodes)
    if (currentStep > 0) {
      ids.add(activeTour.steps[currentStep - 1].nodeId);
    }
    // Next step
    if (currentStep < activeTour.steps.length - 1) {
      ids.add(activeTour.steps[currentStep + 1].nodeId);
    }
    return ids;
  }, [activeTour, currentStep]);

  return {
    activeTour,
    currentStep,
    isActive,
    start,
    next,
    prev,
    exit,
    currentNodeId,
    narrative,
    highlightNodeIds,
  };
}
