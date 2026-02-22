import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

export const GET: APIRoute = async () => {
  const svgBuffer = await readFile('./public/images/database-compass-cover.svg');
  const png = await sharp(svgBuffer, { density: 150 })
    .resize(1200, 630, { fit: 'contain', background: { r: 255, g: 250, b: 247, alpha: 1 } })
    .png()
    .toBuffer();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
