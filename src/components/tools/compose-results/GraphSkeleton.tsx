export function GraphSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
        className="mb-4"
      >
        {/* Three connected circles suggesting a dependency graph */}
        <circle
          cx="40"
          cy="12"
          r="10"
          stroke="var(--color-border)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="18"
          cy="62"
          r="10"
          stroke="var(--color-border)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="62"
          cy="62"
          r="10"
          stroke="var(--color-border)"
          strokeWidth="2"
          fill="none"
        />
        {/* Lines connecting the circles */}
        <line
          x1="33"
          y1="20"
          x2="23"
          y2="53"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        <line
          x1="47"
          y1="20"
          x2="57"
          y2="53"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        <line
          x1="28"
          y1="62"
          x2="52"
          y2="62"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
      </svg>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Loading dependency graph...
      </p>
    </div>
  );
}
