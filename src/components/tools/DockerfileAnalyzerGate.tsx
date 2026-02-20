import { parseDockerfile } from '../../lib/tools/dockerfile-analyzer/parser';

/**
 * Minimal React component to validate dockerfile-ast bundles in Vite.
 * This is a go/no-go gate test -- will be replaced by the real component in Plan 02.
 */
export default function DockerfileAnalyzerGate() {
  const result = parseDockerfile('FROM node:18-alpine\nRUN npm install\n');

  return (
    <div>
      <h2>Go/No-Go Gate: dockerfile-ast Bundle Test</h2>
      <p>Parse success: {String(result.success)}</p>
      <p>Instruction count: {result.nodeCount}</p>
      <ul>
        {result.instructions.map((inst, i) => (
          <li key={i}>
            {inst.keyword} (line {inst.line}): {inst.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
