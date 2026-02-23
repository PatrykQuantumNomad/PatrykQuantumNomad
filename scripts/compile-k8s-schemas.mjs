/**
 * Pre-compiles Kubernetes 1.31 JSON Schemas into a standalone Ajv validation
 * module with named exports for 19 resource types. The output module works
 * without `new Function()`, making it safe for Content-Security-Policy
 * environments that disallow `unsafe-eval`.
 *
 * Steps:
 *   1. Download K8s v1.31.0-local schemas from yannh/kubernetes-json-schema
 *   2. Strip `description`, `format`, `x-kubernetes-*` fields and `status` properties
 *   3. Compile all schemas together via ajv standalone (shared definitions deduplicated)
 *   4. Replace require() calls with inline implementations for pure ESM output
 *   5. Validate gzipped bundle size < 200KB
 *
 * Run: node scripts/compile-k8s-schemas.mjs
 */

import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { gzipSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = resolve(__dirname, 'schemas');
const OUTPUT_PATH = resolve(__dirname, '..', 'src/lib/tools/k8s-analyzer/validate-k8s.js');

// K8s v1.31.0-local schema base URL
const BASE_URL = 'https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.31.0-local/';

// All 19 resource type schemas to download and compile
const RESOURCE_SCHEMAS = {
  configmap: 'configmap-v1.json',
  secret: 'secret-v1.json',
  service: 'service-v1.json',
  serviceaccount: 'serviceaccount-v1.json',
  namespace: 'namespace-v1.json',
  pod: 'pod-v1.json',
  persistentvolumeclaim: 'persistentvolumeclaim-v1.json',
  deployment: 'deployment-apps-v1.json',
  statefulset: 'statefulset-apps-v1.json',
  daemonset: 'daemonset-apps-v1.json',
  job: 'job-batch-v1.json',
  cronjob: 'cronjob-batch-v1.json',
  ingress: 'ingress-networking-v1.json',
  networkpolicy: 'networkpolicy-networking-v1.json',
  horizontalpodautoscaler: 'horizontalpodautoscaler-autoscaling-v2.json',
  role: 'role-rbac-v1.json',
  clusterrole: 'clusterrole-rbac-v1.json',
  rolebinding: 'rolebinding-rbac-v1.json',
  clusterrolebinding: 'clusterrolebinding-rbac-v1.json',
};

// --- Step 1: Download schemas ---

async function downloadFile(url, outputPath) {
  if (existsSync(outputPath)) {
    console.log(`  [cached] ${outputPath}`);
    return;
  }
  console.log(`  [download] ${url}`);
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to download ${url}: ${resp.status} ${resp.statusText}`);
  }
  const text = await resp.text();
  writeFileSync(outputPath, text);
}

async function downloadSchemas() {
  console.log('Step 1: Downloading K8s v1.31.0-local schemas...');
  if (!existsSync(SCHEMAS_DIR)) {
    mkdirSync(SCHEMAS_DIR, { recursive: true });
  }

  // Download shared definitions
  await downloadFile(
    `${BASE_URL}_definitions.json`,
    resolve(SCHEMAS_DIR, '_definitions.json'),
  );

  // Download each resource schema
  for (const [name, file] of Object.entries(RESOURCE_SCHEMAS)) {
    await downloadFile(
      `${BASE_URL}${file}`,
      resolve(SCHEMAS_DIR, file),
    );
  }
  console.log('  Downloads complete.\n');
}

// --- Step 2: Strip descriptions, status, and x-kubernetes extensions ---

function stripForSize(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripForSize);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remove description fields (large strings, not used by validation)
      if (key === 'description') continue;
      // Remove x-kubernetes-* extension fields (not used by ajv validation)
      if (key.startsWith('x-kubernetes-')) continue;
      // Remove format fields (int32, int64, double, byte, date-time are K8s type
      // hints, not validation constraints; stripping avoids ajv-formats require())
      if (key === 'format') continue;
      result[key] = stripForSize(value);
    }
    return result;
  }
  return obj;
}

function stripStatusProperty(schema) {
  // Remove 'status' from properties and required arrays at top level
  if (schema.properties && schema.properties.status) {
    delete schema.properties.status;
  }
  if (Array.isArray(schema.required)) {
    schema.required = schema.required.filter(r => r !== 'status');
  }
  return schema;
}

// --- Step 3 & 4: Compile via ajv standalone ---

function compileSchemas() {
  console.log('Step 2: Stripping descriptions, format, status, and x-kubernetes-* fields...');

  // Load and strip shared definitions
  let definitions = JSON.parse(
    readFileSync(resolve(SCHEMAS_DIR, '_definitions.json'), 'utf8'),
  );
  definitions = stripForSize(definitions);

  // Load, strip, and prepare each resource schema
  const schemas = {};
  for (const [name, file] of Object.entries(RESOURCE_SCHEMAS)) {
    let schema = JSON.parse(
      readFileSync(resolve(SCHEMAS_DIR, file), 'utf8'),
    );
    schema = stripForSize(schema);
    schema = stripStatusProperty(schema);
    schema.$id = name;
    schemas[name] = schema;
  }
  console.log(`  Stripped ${Object.keys(schemas).length} resource schemas + definitions.\n`);

  console.log('Step 3: Compiling via ajv standalone...');
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    verbose: true,
    validateSchema: false,
    code: { source: true, esm: true },
  });
  // Note: addFormats() not needed -- K8s format keywords (int32, int64, double,
  // byte, date-time) are stripped during preprocessing because they are type
  // hints rather than validation constraints. This avoids ajv-formats require()
  // calls in the standalone output.

  // Add shared definitions schema (referenced by $ref in resource schemas)
  ajv.addSchema(definitions, '_definitions.json');

  // Add each resource schema
  const exportMap = {};
  for (const [name, schema] of Object.entries(schemas)) {
    ajv.addSchema(schema);
    exportMap[name] = name;
  }

  // Generate single ESM module with named exports
  let code = standaloneCode(ajv, exportMap);

  // Replace require("ajv/dist/runtime/equal") with inline deep-equal function
  // (same pattern as compile-compose-schema.mjs)
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

  // Check for remaining require() calls
  if (code.includes('require(')) {
    const remaining = code.match(/require\([^)]+\)/g);
    console.error('ERROR: Remaining require() calls found:', remaining);
    process.exit(1);
  }

  const output = `// AUTO-GENERATED — do not edit. Run: node scripts/compile-k8s-schemas.mjs\n// @ts-nocheck\n${code}`;
  console.log('  Compilation complete.\n');

  return output;
}

// --- Step 5: Write and validate bundle size ---

function writeAndValidate(output) {
  console.log('Step 4: Writing compiled validator and validating size...');

  // Ensure output directory exists
  const outputDir = dirname(OUTPUT_PATH);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, output);

  const rawSize = Buffer.byteLength(output, 'utf8');
  const gzippedSize = gzipSync(Buffer.from(output)).length;
  const MAX_GZIP = 204800; // 200KB

  console.log(`  Output: ${OUTPUT_PATH}`);
  console.log(`  Raw size:    ${rawSize} bytes (${(rawSize / 1024).toFixed(1)} KB)`);
  console.log(`  Gzipped:     ${gzippedSize} bytes (${(gzippedSize / 1024).toFixed(1)} KB)`);
  console.log(`  Limit:       ${MAX_GZIP} bytes (200.0 KB)`);

  if (gzippedSize > MAX_GZIP) {
    console.error(`\n  ERROR: Gzipped size ${gzippedSize} exceeds 200KB limit (${MAX_GZIP}).`);
    process.exit(1);
  }

  console.log(`\n  SUCCESS: K8s schema validators compiled. ${Object.keys(RESOURCE_SCHEMAS).length} resource types, ${(gzippedSize / 1024).toFixed(1)} KB gzipped.`);
}

// --- Main ---

async function main() {
  console.log('=== K8s Schema Compilation ===\n');
  await downloadSchemas();
  const output = compileSchemas();
  writeAndValidate(output);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
