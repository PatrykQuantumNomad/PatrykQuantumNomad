// Buffer polyfill for dockerfile-ast which uses Buffer.from() in its isUTF8BOM parser check.
// The 'buffer' npm package (feross/buffer) is already installed as a transitive dependency.
import { Buffer } from 'buffer/index.js';

const globalObj = globalThis as unknown as Record<string, unknown>;
if (globalObj.Buffer === undefined) {
  globalObj.Buffer = Buffer;
}
