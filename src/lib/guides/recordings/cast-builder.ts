/**
 * Cast file builder — generates asciicast v2 files programmatically.
 *
 * The asciicast v2 format is NDJSON:
 *   Line 1: header object (version, width, height)
 *   Lines 2+: event arrays [timestamp, type, data]
 *
 * This builder provides a fluent API for constructing typed, realistic
 * terminal recordings without needing an actual terminal.
 */

// ANSI escape helpers
export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Standard colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright colors
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',

  // Cursor/screen
  clearScreen: '\x1b[2J\x1b[H',
  clearLine: '\x1b[2K',
  cursorUp: (n: number) => `\x1b[${n}A`,
  cursorDown: (n: number) => `\x1b[${n}B`,
  cursorTo: (row: number, col: number) => `\x1b[${row};${col}H`,
} as const;

/** Wrap text in an ANSI color and reset. */
export function c(color: string, text: string): string {
  return `${color}${text}${ANSI.reset}`;
}

interface CastHeader {
  version: 2;
  width: number;
  height: number;
  timestamp?: number;
  title?: string;
  env?: Record<string, string>;
}

type CastEvent = [number, 'o' | 'i', string];

export class CastBuilder {
  private header: CastHeader;
  private events: CastEvent[] = [];
  private cursor = 0; // current timestamp in seconds

  constructor(opts: { width?: number; height?: number; title?: string } = {}) {
    this.header = {
      version: 2,
      width: opts.width ?? 80,
      height: opts.height ?? 20,
      env: { TERM: 'xterm-256color', SHELL: '/bin/zsh' },
      ...(opts.title ? { title: opts.title } : {}),
    };
  }

  /** Advance the clock by `ms` milliseconds. */
  pause(ms: number): this {
    this.cursor += ms / 1000;
    return this;
  }

  /** Write output text instantly. */
  output(text: string): this {
    this.events.push([round(this.cursor), 'o', text]);
    return this;
  }

  /** Simulate typing with realistic per-character delays. */
  type(text: string, opts: { baseDelay?: number; jitter?: number } = {}): this {
    const baseDelay = opts.baseDelay ?? 65;
    const jitter = opts.jitter ?? 30;

    // Use a seeded-ish pattern for deterministic but natural-looking timing
    for (let i = 0; i < text.length; i++) {
      const variance = ((i * 7 + text.charCodeAt(i)) % (jitter * 2)) - jitter;
      const delay = Math.max(20, baseDelay + variance);
      this.cursor += delay / 1000;
      this.events.push([round(this.cursor), 'o', text[i]]);
    }
    return this;
  }

  /** Type text and press enter. */
  typeLine(text: string, opts?: { baseDelay?: number; jitter?: number }): this {
    this.type(text, opts);
    this.pause(100);
    this.output('\r\n');
    return this;
  }

  /** Output a full line of text (no typing animation). */
  line(text: string): this {
    this.output(text + '\r\n');
    return this;
  }

  /** Output multiple lines at once. */
  lines(texts: string[]): this {
    for (const text of texts) {
      this.line(text);
    }
    return this;
  }

  /** Show a shell prompt. */
  prompt(cwd = '~/projects/my-app', user = ''): this {
    const promptStr = user
      ? `${c(ANSI.green, user)} ${c(ANSI.blue, cwd)} ${c(ANSI.yellow, '$')} `
      : `${c(ANSI.blue, cwd)} ${c(ANSI.yellow, '$')} `;
    this.output(promptStr);
    return this;
  }

  /** Show the Claude Code input prompt. */
  claudePrompt(): this {
    this.output(`${c(ANSI.bold + ANSI.magenta, '  >')} `);
    return this;
  }

  /** Show a tool action (Read, Edit, Bash, etc.) with a path. */
  toolAction(tool: string, detail: string, delayMs = 350): this {
    this.output(`  ${c(ANSI.cyan, tool)} `);
    this.output(`${c(ANSI.dim, detail)}\r\n`);
    this.pause(delayMs);
    return this;
  }

  /** Output a block of response text with per-line delay for realism. */
  responseBlock(lines: string[], lineDelayMs = 40): this {
    for (const text of lines) {
      this.line(text);
      if (lineDelayMs > 0) this.pause(lineDelayMs);
    }
    return this;
  }

  /** Show a diff-style block with green additions and red deletions. */
  diff(filename: string, removals: string[], additions: string[]): this {
    this.line(`  ${c(ANSI.bold, filename)}`);
    for (const r of removals) {
      this.line(`  ${c(ANSI.red, '- ' + r)}`);
    }
    for (const a of additions) {
      this.line(`  ${c(ANSI.green, '+ ' + a)}`);
    }
    return this;
  }

  /** Build the .cast file content as a string. */
  build(): string {
    const lines = [
      JSON.stringify(this.header),
      ...this.events.map((e) => JSON.stringify(e)),
    ];
    return lines.join('\n') + '\n';
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
