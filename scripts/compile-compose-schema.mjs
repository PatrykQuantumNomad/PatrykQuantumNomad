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
let code = standaloneCode(ajv, validate);

// Replace require("ajv/dist/runtime/equal") with an inline deep-equal
// function so the output is pure ESM with no Node.js require() calls.
const equalFn = `
function equal(a, b) {
  if (a === b) return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;
    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;) if (!equal(a[i], b[i])) return false;
      return true;
    }
    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;
    for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    for (i = length; i-- !== 0;) { var key = keys[i]; if (!equal(a[key], b[key])) return false; }
    return true;
  }
  return a !== a && b !== b;
}
`;
code = code.replace(
  /const (\w+)\s*=\s*require\("ajv\/dist\/runtime\/equal"\)\.default;/g,
  `${equalFn}\nconst $1 = equal;`,
);
// Catch any remaining require() calls
if (code.includes('require(')) {
  const remaining = code.match(/require\([^)]+\)/g);
  console.error('WARNING: Remaining require() calls:', remaining);
  process.exit(1);
}

const output = `// AUTO-GENERATED — do not edit. Run: node scripts/compile-compose-schema.mjs\n// @ts-nocheck\n${code}`;

writeFileSync(
  'src/lib/tools/compose-validator/validate-compose.js',
  output,
);

console.log('Compose schema compiled successfully.');
