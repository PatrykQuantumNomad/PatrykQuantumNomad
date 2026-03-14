// nbformat v4.5 TypeScript interfaces
// Source: https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json
//
// These interfaces mirror the nbformat v4.5 JSON schema exactly.
// Property names use snake_case to match the JSON output format.

/** nbformat v4.5 multiline string: single string or array of strings */
export type MultilineString = string | string[];

/** Cell ID: alphanumeric, hyphen, underscore; 1-64 chars. Pattern: ^[a-zA-Z0-9-_]+$ */
export type CellId = string;

/** Markdown cell: renders Markdown content */
export interface MarkdownCell {
  id: CellId;
  cell_type: 'markdown';
  metadata: Record<string, unknown>;
  source: MultilineString;
  attachments?: Record<string, Record<string, string>>;
}

/** Code cell: contains executable code with outputs */
export interface CodeCell {
  id: CellId;
  cell_type: 'code';
  metadata: Record<string, unknown>;
  source: MultilineString;
  outputs: Output[];
  execution_count: number | null;
}

/** Raw cell: unformatted text, not executed */
export interface RawCell {
  id: CellId;
  cell_type: 'raw';
  metadata: Record<string, unknown>;
  source: MultilineString;
}

/** Discriminated union of all cell types */
export type Cell = MarkdownCell | CodeCell | RawCell;

/** Output from executing a code cell with a return value */
export interface ExecuteResult {
  output_type: 'execute_result';
  data: Record<string, MultilineString>;
  metadata: Record<string, unknown>;
  execution_count: number;
}

/** Rich display output (images, HTML, etc.) */
export interface DisplayData {
  output_type: 'display_data';
  data: Record<string, MultilineString>;
  metadata: Record<string, unknown>;
}

/** Stream output (stdout/stderr) */
export interface StreamOutput {
  output_type: 'stream';
  name: 'stdout' | 'stderr';
  text: MultilineString;
}

/** Error output from failed execution */
export interface ErrorOutput {
  output_type: 'error';
  ename: string;
  evalue: string;
  traceback: string[];
}

/** Union of all output types */
export type Output = ExecuteResult | DisplayData | StreamOutput | ErrorOutput;

/** Jupyter kernel specification */
export interface KernelSpec {
  name: string;
  display_name: string;
  language?: string;
}

/** Programming language metadata */
export interface LanguageInfo {
  name: string;
  version?: string;
  codemirror_mode?: string | Record<string, unknown>;
  file_extension?: string;
  mimetype?: string;
  pygments_lexer?: string;
}

/** Notebook-level metadata */
export interface NotebookMetadata {
  kernelspec: KernelSpec;
  language_info: LanguageInfo;
  [key: string]: unknown;
}

/** Complete nbformat v4.5 notebook */
export interface NotebookV4 {
  nbformat: 4;
  nbformat_minor: 5;
  metadata: NotebookMetadata;
  cells: Cell[];
}
