// scripts/copy-preload-fonts.mjs
// Copies LCP-critical woff2 files from node_modules to public/fonts/ so
// preload <link> hrefs can use stable paths that match the hand-written
// @font-face src URLs in src/styles/global.css.
//
// See .planning/phases/124-font-self-hosting/124-RESEARCH.md Pitfall 1
// for the preload URL-match rationale.
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const PUBLIC_FONTS = join(ROOT, 'public', 'fonts');

const COPIES = [
  {
    from: 'node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2',
    to: 'public/fonts/dm-sans-400.woff2',
  },
  {
    from: 'node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2',
    to: 'public/fonts/bricolage-700.woff2',
  },
];

await mkdir(PUBLIC_FONTS, { recursive: true });
for (const { from, to } of COPIES) {
  await copyFile(join(ROOT, from), join(ROOT, to));
  console.log(`[copy-preload-fonts] ${from} -> ${to}`);
}
