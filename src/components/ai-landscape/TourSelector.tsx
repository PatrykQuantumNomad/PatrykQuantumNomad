import { TOURS } from '../../lib/ai-landscape/tours';

interface TourSelectorProps {
  onStartTour: (tourId: string) => void;
}

/**
 * Tour picker showing 3 tour cards.
 *
 * Displays each tour's title, description, and step count with a
 * "Start Tour" action. Renders as a flex row that wraps on smaller screens.
 */
export function TourSelector({ onStartTour }: TourSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TOURS.map((tour) => (
        <button
          key={tour.id}
          onClick={() => onStartTour(tour.id)}
          className="flex-1 min-w-[180px] text-left rounded-lg border p-3 cursor-pointer
            bg-[var(--color-surface)] border-[var(--color-border)]
            hover:border-[var(--color-accent)] transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
            {tour.title}
          </span>
          <span className="block text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            {tour.description}
          </span>
          <span className="block text-xs text-[var(--color-accent)] mt-2 font-medium">
            {tour.steps.length} steps
          </span>
        </button>
      ))}
    </div>
  );
}
