import { useState, useEffect, useRef } from 'react';

interface ScoreGaugeProps {
  score: number;
  grade: string;
  size?: number;
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#84cc16';
  if (grade.startsWith('C')) return '#eab308';
  if (grade.startsWith('D')) return '#f97316';
  return '#ef4444';
}

function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    if (from === target) {
      setDisplay(target);
      return;
    }

    let start: number | null = null;
    let raf: number;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

export function ScoreGauge({ score, grade, size = 120 }: ScoreGaugeProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const gradeColor = getGradeColor(grade);
  const displayScore = useAnimatedNumber(score);

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Centered text overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="status"
        aria-label={`Analysis score: ${score} out of 100, grade ${grade}`}
      >
        <span className="text-2xl font-bold font-heading">{displayScore}</span>
        <span className="text-sm font-semibold" style={{ color: gradeColor }}>
          {grade}
        </span>
      </div>
    </div>
  );
}
