import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  analysisResult,
  editorViewRef,
} from '../../../stores/dockerfileAnalyzerStore';
import type { LintViolation } from '../../../lib/tools/dockerfile-analyzer/types';

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };
const SEVERITY_HEADINGS: Record<string, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
};

function groupBySeverity(violations: LintViolation[]): [string, LintViolation[]][] {
  const groups = new Map<string, LintViolation[]>();
  for (const v of violations) {
    const group = groups.get(v.severity) ?? [];
    group.push(v);
    groups.set(v.severity, group);
  }
  return [...groups.entries()].sort(
    ([a], [b]) => (SEVERITY_ORDER[a] ?? 3) - (SEVERITY_ORDER[b] ?? 3),
  );
}

function buildIssuesBlock(violations: LintViolation[]): string {
  const groups = groupBySeverity(violations);
  const lines: string[] = [];

  for (const [severity, items] of groups) {
    lines.push(`### ${SEVERITY_HEADINGS[severity] ?? severity}`);
    for (const v of items) {
      lines.push(`- ${v.ruleId} (line ${v.line}, ${v.category}): ${v.title}`);
      lines.push(`  ${v.explanation}`);
      lines.push(`  Fix: ${v.fix.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function buildPrompt(dockerfile: string, result: NonNullable<ReturnType<typeof analysisResult.get>>): string {
  const { violations, score } = result;
  const issuesBlock = buildIssuesBlock(violations);

  return `<role>
You are a senior DevOps engineer and Docker security specialist. You fix
Dockerfiles by applying issue reports precisely — every flagged issue must
be resolved while preserving the original image's intended functionality.
You prioritize production-readiness, security, and minimal image size.
</role>

<context>
A Dockerfile has been analyzed by an automated linting and security
scanning pipeline (score: ${score.overall}/100, grade: ${score.grade}).
The analysis produced ${violations.length} issue${violations.length !== 1 ? 's' : ''} categorized
by severity (error, warning, info) and domain (security, reliability,
efficiency, maintainability, best-practice). Your job is to produce a
corrected Dockerfile that resolves every reported issue.
</context>

<dockerfile>
${dockerfile}
</dockerfile>

<issues>
${issuesBlock}
</issues>

<instructions>
1. Parse every issue in <issues>. For each one, identify the affected
   line(s) in the original <dockerfile> and determine the minimal change
   that resolves the issue without altering intended behavior.

2. Apply fixes in this priority order:
   a. Errors — these represent broken or dangerous instructions that must
      be fixed first.
   b. Warnings — these represent security risks or reproducibility
      problems that should be addressed next.
   c. Info — these represent efficiency and best-practice improvements
      to apply last.

3. When multiple issues affect the same line or instruction (e.g.,
   several "pin versions" warnings on a single apt-get install), combine
   all fixes into a single corrected instruction.

4. Preserve the original functionality:
   - Keep all intended packages, files, ports, and runtime commands.
   - Do not add packages, services, or configuration beyond what is
     needed to resolve the reported issues.
   - If an issue requires removing something (e.g., a hardcoded secret),
     replace it with a clearly documented placeholder or recommended
     pattern (e.g., runtime environment variable injection).

5. Follow these Dockerfile best practices when restructuring:
   - Combine related RUN instructions into single layers using && and
     line continuations (\\).
   - Order instructions from least-frequently changing (base image) to
     most-frequently changing (application code) to maximize layer cache.
   - Use comments sparingly to explain non-obvious fixes.
</instructions>

<output_format>
Return your response in two sections:

1. A summary of changes — a brief list mapping each issue ID or line
   reference to the fix you applied. Group by severity level.

2. The complete corrected Dockerfile — ready to use, inside a single
   \`\`\`dockerfile code block. Do not omit any lines or use placeholders
   like "... rest unchanged". The full file must be present.
</output_format>

<constraints>
- Resolve ALL reported issues. Do not skip any, even info-level ones.
- Do not introduce new linting issues while fixing existing ones.
- Do not change the base operating system or language runtime unless an
  issue explicitly requires it.
- When pinning package versions and exact versions are not specified in
  the issue report, use a comment (e.g., # pin to current version) as a
  placeholder rather than inventing version numbers.
- Never leave secrets, passwords, or API keys in the final Dockerfile,
  even as examples.
</constraints>`;
}

export function PromptGenerator() {
  const result = useStore(analysisResult);
  const [copied, setCopied] = useState(false);

  if (!result || !result.parseSuccess || !result.violations.length) {
    return null;
  }

  const handleCopy = async () => {
    const view = editorViewRef.get();
    if (!view) return;
    const dockerfile = view.state.doc.toString();
    if (!dockerfile.trim()) return;

    const prompt = buildPrompt(dockerfile, result);

    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all
        border border-[var(--color-border)] bg-transparent
        hover:bg-white/5
        active:bg-white/10
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z" />
        <path d="M10 6a2 2 0 1 1 4 0v1h-4V6Z" />
      </svg>
      {copied ? 'Copied!' : 'Copy AI Fix Prompt'}
    </button>
  );
}
