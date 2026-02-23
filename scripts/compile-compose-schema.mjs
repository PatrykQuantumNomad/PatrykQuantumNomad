/**
 * Pre-compiles the compose-spec JSON Schema into a standalone Ajv validation
 * function. The output module exports a `validate` function that works without
 * `new Function()`, making it safe for Content-Security-Policy environments
 * that disallow `unsafe-eval`.
 *
 * Run: node scripts/compile-compose-schema.mjs
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { readFileSync, writeFileSync } from 'fs';

const schema = JSON.parse(
  readFileSync(
    'src/lib/tools/compose-validator/compose-spec-schema.json',
    'utf8',
  ),
);

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  verbose: true,
  validateSchema: false,
  code: { source: true, esm: true },
});

addFormats(ajv);

const validate = ajv.compile(schema);
const code = standaloneCode(ajv, validate);

const output = `// AUTO-GENERATED — do not edit. Run: node scripts/compile-compose-schema.mjs\n// @ts-nocheck\n${code}`;

writeFileSync(
  'src/lib/tools/compose-validator/validate-compose.js',
  output,
);

console.log('Compose schema compiled successfully.');
