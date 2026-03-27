import type { Tour } from '../../lib/ai-landscape/tours';

interface TourBarProps {
  tour: Tour;
  currentStep: number;
  narrative: string;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  totalSteps: number;
}

/**
 * Tour progress bar with narrative text, step indicator, and prev/next/exit controls.
 *
 * Renders OUTSIDE the SVG element, above the graph container, as a fixed UI bar.
 * On the last step the "Next" button becomes "Finish" and calls onExit.
 * Responsive: on mobile the layout stacks vertically.
 */
export function TourBar({
  tour,
  currentStep,
  narrative,
  onNext,
  onPrev,
  onExit,
  totalSteps,
}: TourBarProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3
        px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg"
      role="region"
      aria-label={`Guided tour: ${tour.title}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Exit button */}
      <button
        onClick={onExit}
        className="shrink-0 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label="Exit tour"
        title="Exit tour"
      >
        Exit &times;
      </button>

      {/* Tour title and step indicator */}
      <div className="shrink-0 text-xs">
        <span className="font-semibold text-[var(--color-text-primary)]">
          {tour.title}
        </span>
        <span className="text-[var(--color-text-secondary)] ml-2">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Narrative text */}
      <p className="flex-1 text-sm text-[var(--color-text-secondary)] leading-relaxed md:truncate">
        {narrative}
      </p>

      {/* Navigation buttons */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="px-3 py-1 text-xs rounded border
            border-[var(--color-border)] bg-[var(--color-surface)]
            text-[var(--color-text-secondary)]
            hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
          aria-label="Previous tour step"
        >
          &lsaquo; Prev
        </button>
        <button
          onClick={isLast ? onExit : onNext}
          className="px-3 py-1 text-xs rounded border
            border-[var(--color-accent)] bg-[var(--color-accent)]/10
            text-[var(--color-accent)]
            hover:bg-[var(--color-accent)]/20
            transition-colors"
          aria-label={isLast ? 'Finish tour' : 'Next tour step'}
        >
          {isLast ? 'Finish' : 'Next \u203a'}
        </button>
      </div>
    </div>
  );
}
