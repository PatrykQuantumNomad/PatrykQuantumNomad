/**
 * Pre-compiles the GitHub Actions workflow JSON Schema (from SchemaStore) into
 * a standalone Ajv validation function. The output module exports a `validate`
 * function that works without `new Function()`, making it safe for CSP
 * environments that disallow `unsafe-eval`.
 *
 * Run: node scripts/compile-gha-schema.mjs
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const SCHEMA_URL = 'https://json.schemastore.org/github-workflow.json';
const SCHEMA_CACHE = 'scripts/schemas/github-workflow.json';
const OUTPUT_PATH = 'src/lib/tools/gha-validator/validate-gha.js';

// ── 1. Download or use cached schema ────────────────────────────────

let schemaText;

if (existsSync(SCHEMA_CACHE)) {
  console.log(`Schema: ${SCHEMA_CACHE} [cached]`);
  schemaText = readFileSync(SCHEMA_CACHE, 'utf8');
} else {
  console.log(`Downloading ${SCHEMA_URL} ...`);
  const res = await fetch(SCHEMA_URL);
  if (!res.ok) {
    console.error(`Failed to download schema: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  schemaText = await res.text();
  mkdirSync('scripts/schemas', { recursive: true });
  writeFileSync(SCHEMA_CACHE, schemaText);
  console.log(`Cached to ${SCHEMA_CACHE}`);
}

let schema = JSON.parse(schemaText);

// ── 2. Compile with Ajv ─────────────────────────────────────────────

const ajvOptions = {
  allErrors: true,
  strict: false,
  verbose: true,
  validateSchema: false,
  code: { source: true, esm: true },
};

/**
 * Attempt compilation with ajv-formats first. If the output contains
 * require("ajv-formats/dist/formats"), strip format fields from the schema
 * and re-compile without ajv-formats (K8s approach).
 */
function compileSchema(schemaObj, useFormats) {
  const ajv = new Ajv(ajvOptions);
  if (useFormats) addFormats(ajv);
  const validate = ajv.compile(schemaObj);
  return standaloneCode(ajv, validate);
}

let code = compileSchema(schema, true);

// Check for ajv-formats runtime require
if (code.includes('require("ajv-formats')) {
  console.log('Detected ajv-formats runtime require -- stripping format fields and recompiling...');
  // Deep-clone and strip all "format" fields from schema
  const stripped = JSON.parse(JSON.stringify(schema));
  stripFormats(stripped);
  code = compileSchema(stripped, false);
}

function stripFormats(obj) {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      for (const item of obj) stripFormats(item);
    } else {
      delete obj.format;
      for (const val of Object.values(obj)) stripFormats(val);
    }
  }
}

// ── 3. Replace require("ajv/dist/runtime/equal") with inline deep-equal ─

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

// Replace require("ajv/dist/runtime/ucs2length") with inline ucs2length
// (counts Unicode code points, handling surrogate pairs)
const ucs2lengthFn = `
function ucs2length(str) {
  const len = str.length;
  let length = 0;
  let pos = 0;
  let value;
  while (pos < len) {
    length++;
    value = str.charCodeAt(pos++);
    if (value >= 0xD800 && value <= 0xDBFF && pos < len) {
      value = str.charCodeAt(pos);
      if ((value & 0xFC00) === 0xDC00) pos++;
    }
  }
  return length;
}
`;
code = code.replace(
  /const (\w+)\s*=\s*require\("ajv\/dist\/runtime\/ucs2length"\)\.default;/g,
  `${ucs2lengthFn}\nconst $1 = ucs2length;`,
);

// ── 4. Fail if any require() calls remain ───────────────────────────

if (code.includes('require(')) {
  const remaining = code.match(/require\([^)]+\)/g);
  console.error('ERROR: Remaining require() calls:', remaining);
  process.exit(1);
}

// ── 5. Write output ─────────────────────────────────────────────────

const output = `// AUTO-GENERATED — do not edit. Run: node scripts/compile-gha-schema.mjs\n// @ts-nocheck\n${code}`;

writeFileSync(OUTPUT_PATH, output);
console.log(`GHA workflow schema compiled successfully to ${OUTPUT_PATH}`);
