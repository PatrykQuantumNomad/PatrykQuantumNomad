import { DockerfileParser } from 'dockerfile-ast';

export interface ParseResult {
  instructions: Array<{
    keyword: string;
    line: number; // 0-based line from AST
    content: string; // full instruction text
  }>;
  nodeCount: number;
  success: boolean;
  error?: string;
}

export function parseDockerfile(content: string): ParseResult {
  try {
    const ast = DockerfileParser.parse(content);
    const instructions = ast.getInstructions().map((inst) => ({
      keyword: inst.getKeyword(),
      line: inst.getRange().start.line,
      content: inst.toString(),
    }));
    return {
      instructions,
      nodeCount: instructions.length,
      success: true,
    };
  } catch (err) {
    return {
      instructions: [],
      nodeCount: 0,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
