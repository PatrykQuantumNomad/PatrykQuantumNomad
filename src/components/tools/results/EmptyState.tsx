import { ScoreGauge } from './ScoreGauge';

interface EmptyStateProps {
  score: number;
  grade: string;
}

export function EmptyState({ score, grade }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-lg font-heading font-semibold mb-1">No Issues Found</h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mb-4">
        This Dockerfile follows best practices. Well done!
      </p>
      <ScoreGauge score={score} grade={grade} />
    </div>
  );
}
