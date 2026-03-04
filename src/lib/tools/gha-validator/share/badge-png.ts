/**
 * Score badge PNG generator for the GHA Validator.
 *
 * Creates an off-screen canvas with a visual score badge (arc gauge + grade)
 * and triggers a PNG download. Designed for sharing on READMEs and social media.
 *
 * Canvas rendered at 2x DPR (800x400 physical pixels) for crisp rendering
 * on high-density displays.
 */

// ── Grade color logic (mirrors ScoreGauge.tsx) ──────────────────────

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#84cc16';
  if (grade.startsWith('C')) return '#eab308';
  if (grade.startsWith('D')) return '#f97316';
  return '#ef4444';
}

// ── Badge renderer ──────────────────────────────────────────────────

/**
 * Generate and download a PNG score badge.
 *
 * @param score  Overall score 0-100
 * @param grade  Letter grade (e.g. "A+", "B", "F")
 */
export function downloadScoreBadge(score: number, grade: string): void {
  const DPR = 2;
  const W = 400;
  const H = 200;

  const canvas = document.createElement('canvas');
  canvas.width = W * DPR;
  canvas.height = H * DPR;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(DPR, DPR);

  const gradeColor = getGradeColor(grade);

  // ── Background ──────────────────────────────────────────────────
  ctx.fillStyle = '#1a1b26';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // ── Score arc (left side) ───────────────────────────────────────
  const cx = 100;
  const cy = 100;
  const radius = 60;
  const lineWidth = 10;

  // Background track
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Score arc -- starts from top (-PI/2), sweeps proportional to score
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (score / 100) * Math.PI * 2;

  ctx.strokeStyle = gradeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();

  // Score number centered in arc
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(score), cx, cy - 8);

  // Grade letter below score
  ctx.fillStyle = gradeColor;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(grade, cx, cy + 24);

  // ── Title text (right side) ─────────────────────────────────────
  const textX = 270;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GHA Validator', textX, cy - 16);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Workflow Score', textX, cy + 12);

  // ── Trigger download ────────────────────────────────────────────
  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gha-score-${score}-${grade}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
