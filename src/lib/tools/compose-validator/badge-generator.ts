import type { ComposeScoreResult, ComposeCategoryScore } from './types';

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  semantic: 'Semantic',
  'best-practice': 'Best Practice',
  schema: 'Schema',
  style: 'Style',
};

const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444',
  semantic: '#3b82f6',
  'best-practice': '#06b6d4',
  schema: '#f59e0b',
  style: '#8b5cf6',
};

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#84cc16';
  if (grade.startsWith('C')) return '#eab308';
  if (grade.startsWith('D')) return '#f97316';
  return '#ef4444';
}

/** Build a standalone 400x200 SVG badge string for the given compose score result */
export function buildComposeBadgeSvg(score: ComposeScoreResult): string {
  const { overall, grade, categories } = score;
  const gradeColor = getGradeColor(grade);
  const W = 400;
  const H = 200;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (overall / 100) * circ;

  const catBars = categories
    .map((cat: ComposeCategoryScore, i: number) => {
      const y = 40 + i * 26;
      const label = CATEGORY_LABELS[cat.category] ?? cat.category;
      const color = CATEGORY_COLORS[cat.category] ?? '#94a3b8';
      const barW = (cat.score / 100) * 110;
      return [
        `<text x="135" y="${y + 4}" fill="rgba(255,255,255,0.7)" font-size="10" font-family="system-ui, sans-serif">${label}</text>`,
        `<rect x="240" y="${y - 4}" width="110" height="7" rx="3.5" fill="rgba(255,255,255,0.1)"/>`,
        `<rect x="240" y="${y - 4}" width="${barW}" height="7" rx="3.5" fill="${color}"/>`,
        `<text x="358" y="${y + 4}" fill="rgba(255,255,255,0.6)" font-size="9" font-family="monospace" text-anchor="end">${Math.round(cat.score)}</text>`,
      ].join('');
    })
    .join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    '<defs>',
    '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0%" stop-color="#1a1a2e"/>',
    '<stop offset="100%" stop-color="#16213e"/>',
    '</linearGradient>',
    '</defs>',
    `<rect width="${W}" height="${H}" rx="12" fill="url(#bg)"/>`,
    `<circle cx="68" cy="85" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>`,
    `<circle cx="68" cy="85" r="${r}" fill="none" stroke="${gradeColor}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" transform="rotate(-90 68 85)"/>`,
    `<text x="68" y="82" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="system-ui, sans-serif">${overall}</text>`,
    `<text x="68" y="100" text-anchor="middle" fill="${gradeColor}" font-size="13" font-weight="600" font-family="system-ui, sans-serif">${grade}</text>`,
    '<text x="135" y="24" fill="rgba(255,255,255,0.5)" font-size="10" font-family="system-ui, sans-serif">Docker Compose Analysis</text>',
    catBars,
    `<text x="${W / 2}" y="${H - 10}" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-size="8" font-family="system-ui, sans-serif">patrykgolabek.dev/tools/compose-validator</text>`,
    '</svg>',
  ].join('');
}

/** Rasterize the compose score badge SVG to a retina-aware PNG and trigger a browser download */
export async function downloadComposeBadgePng(score: ComposeScoreResult): Promise<void> {
  const svgString = buildComposeBadgeSvg(score);
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const W = 400;
  const H = 200;

  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.scale(dpr, dpr);

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error('PNG blob creation failed'));
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = `compose-score-${score.overall}-${score.grade}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image load failed'));
    };
    img.src = url;
  });
}
