/**
 * Downloads the pre-built actionlint WASM binary and wasm_exec.js from the
 * official actionlint playground. These files are required at runtime for the
 * GHA Validator Web Worker to load and run actionlint in the browser.
 *
 * Pinned to actionlint v1.7.11 (Go 1.24).
 *
 * Run: node scripts/download-actionlint-wasm.mjs
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { stat } from 'fs/promises';
import { resolve } from 'path';

const WASM_DIR = resolve('public/wasm');

const FILES = [
  {
    url: 'https://rhysd.github.io/actionlint/main.wasm',
    dest: resolve(WASM_DIR, 'actionlint.wasm'),
    label: 'actionlint.wasm',
    sizeUnit: 'MB',
  },
  {
    url: 'https://rhysd.github.io/actionlint/lib/js/wasm_exec.js',
    dest: resolve(WASM_DIR, 'wasm_exec.js'),
    label: 'wasm_exec.js',
    sizeUnit: 'KB',
  },
];

mkdirSync(WASM_DIR, { recursive: true });

for (const { url, dest, label, sizeUnit } of FILES) {
  if (existsSync(dest)) {
    const info = await stat(dest);
    const size =
      sizeUnit === 'MB'
        ? `${(info.size / 1024 / 1024).toFixed(1)} MB`
        : `${(info.size / 1024).toFixed(1)} KB`;
    console.log(`  ${label} [cached] (${size})`);
    continue;
  }

  console.log(`  Downloading ${label} ...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${label}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(dest, buffer);

  const size =
    sizeUnit === 'MB'
      ? `${(buffer.length / 1024 / 1024).toFixed(1)} MB`
      : `${(buffer.length / 1024).toFixed(1)} KB`;
  console.log(`  ${label} downloaded (${size})`);
}

console.log('actionlint WASM files ready.');
