// scripts/copy-katex-assets.mjs
// One-time script to copy KaTeX CSS + woff2 fonts to public/ for self-hosting.
// Patches font paths from relative to absolute so they resolve correctly
// regardless of where the CSS file is served from.

import { copyFile, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const KATEX_DIST = 'node_modules/katex/dist';
const CSS_DEST = 'public/styles';
const FONT_DEST = 'public/fonts/katex';

async function main() {
  // Create directories
  await mkdir(CSS_DEST, { recursive: true });
  await mkdir(FONT_DEST, { recursive: true });

  // Copy and patch CSS - rewrite relative font paths to absolute
  let css = await readFile(join(KATEX_DIST, 'katex.min.css'), 'utf-8');
  css = css.replace(/url\(fonts\//g, 'url(/fonts/katex/');
  await writeFile(join(CSS_DEST, 'katex.min.css'), css);

  // Copy woff2 fonts only (most efficient format, all modern browsers support)
  const fontDir = join(KATEX_DIST, 'fonts');
  const files = await readdir(fontDir);
  const woff2Files = files.filter((f) => f.endsWith('.woff2'));
  for (const file of woff2Files) {
    await copyFile(join(fontDir, file), join(FONT_DEST, file));
  }

  console.log(`Copied ${woff2Files.length} woff2 fonts to ${FONT_DEST}`);
  console.log(`Patched katex.min.css -> ${CSS_DEST}/katex.min.css`);
}

main();
