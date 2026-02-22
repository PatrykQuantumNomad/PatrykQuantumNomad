/**
 * Variable interpolation detection and normalization for Docker Compose.
 *
 * Docker Compose supports shell-style variable interpolation:
 *   ${VAR:-default}  -- use default if VAR is unset or empty
 *   ${VAR-default}   -- use default if VAR is unset
 *   ${VAR:+replacement} -- use replacement if VAR is set and non-empty
 *   ${VAR+replacement}  -- use replacement if VAR is set
 *   ${VAR:?error}    -- error if VAR is unset or empty
 *   ${VAR?error}     -- error if VAR is unset
 *   ${VAR}           -- substitute variable value
 *   $VAR             -- substitute variable value (short form)
 *   $$               -- literal dollar sign escape
 *
 * The normalizer replaces interpolation patterns with concrete values
 * so that JSON Schema validation (ajv) does not produce false positives.
 * It runs on the JSON object AFTER doc.toJSON(), NOT on raw YAML, to
 * preserve correct AST line offsets.
 */

// Regex to detect any interpolation pattern in a string
const INTERPOLATION_REGEX = /\$\$|\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*/;

/**
 * Test whether a string contains Docker Compose variable interpolation.
 */
export function containsInterpolation(value: string): boolean {
  return INTERPOLATION_REGEX.test(value);
}

/**
 * Normalize interpolation patterns to concrete values for schema validation.
 *
 * Processing order matters to avoid regex conflicts:
 * 1. $$ -> $ (literal dollar escape)
 * 2. ${VAR:-default} and ${VAR-default} -> default value
 * 3. ${VAR:+replacement} and ${VAR+replacement} -> replacement value
 * 4. ${VAR:?error} and ${VAR?error} -> 'placeholder'
 * 5. ${VAR} -> 'placeholder'
 * 6. $VAR -> 'placeholder'
 */
export function normalizeInterpolation(value: string): string {
  let result = value;

  // 1. Literal dollar escape: $$ -> $
  result = result.replace(/\$\$/g, '$');

  // 2. Default value patterns: ${VAR:-default} and ${VAR-default}
  result = result.replace(
    /\$\{[A-Za-z_][A-Za-z0-9_]*:-([^}]*)\}/g,
    '$1',
  );
  result = result.replace(
    /\$\{[A-Za-z_][A-Za-z0-9_]*-([^}]*)\}/g,
    '$1',
  );

  // 3. Replacement patterns: ${VAR:+replacement} and ${VAR+replacement}
  result = result.replace(
    /\$\{[A-Za-z_][A-Za-z0-9_]*:\+([^}]*)\}/g,
    '$1',
  );
  result = result.replace(
    /\$\{[A-Za-z_][A-Za-z0-9_]*\+([^}]*)\}/g,
    '$1',
  );

  // 4. Error patterns: ${VAR:?error} and ${VAR?error} -> placeholder
  result = result.replace(
    /\$\{[A-Za-z_][A-Za-z0-9_]*:\?[^}]*\}/g,
    'placeholder',
  );
  result = result.replace(
    /\$\{[A-Za-z_][A-Za-z0-9_]*\?[^}]*\}/g,
    'placeholder',
  );

  // 5. Bare braced variable: ${VAR} -> placeholder
  result = result.replace(
    /\$\{[A-Za-z_][A-Za-z0-9_]*\}/g,
    'placeholder',
  );

  // 6. Bare variable: $VAR -> placeholder
  result = result.replace(
    /\$[A-Za-z_][A-Za-z0-9_]*/g,
    'placeholder',
  );

  return result;
}

/**
 * Recursively walk a JSON object and normalize all interpolated string values.
 * Returns a new object (does not mutate the original).
 *
 * Handles: strings, arrays, plain objects.
 * Pass-through: null, number, boolean, undefined.
 */
export function normalizeJsonForValidation(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return containsInterpolation(obj) ? normalizeInterpolation(obj) : obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeJsonForValidation(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = normalizeJsonForValidation(value);
    }
    return result;
  }

  return obj;
}
