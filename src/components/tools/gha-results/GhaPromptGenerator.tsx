import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ghaResult,
  ghaEditorViewRef,
} from '../../../stores/ghaValidatorStore';
import type { GhaUnifiedViolation } from '../../../lib/tools/gha-validator/types';

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };
const SEVERITY_HEADINGS: Record<string, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
};

function groupBySeverity(violations: GhaUnifiedViolation[]): [string, GhaUnifiedViolation[]][] {
  const groups = new Map<string, GhaUnifiedViolation[]>();
  for (const v of violations) {
    const group = groups.get(v.severity) ?? [];
    group.push(v);
    groups.set(v.severity, group);
  }
  return [...groups.entries()].sort(
    ([a], [b]) => (SEVERITY_ORDER[a] ?? 3) - (SEVERITY_ORDER[b] ?? 3),
  );
}

function buildIssuesBlock(violations: GhaUnifiedViolation[]): string {
  const groups = groupBySeverity(violations);
  const lines: string[] = [];

  for (const [severity, items] of groups) {
    lines.push(`### ${SEVERITY_HEADINGS[severity] ?? severity}`);
    for (const v of items) {
      lines.push(`- ${v.ruleId} (line ${v.line}, ${v.category}): ${v.message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function buildPrompt(yaml: string, result: NonNullable<ReturnType<typeof ghaResult.get>>): string {
  const { violations, score } = result;
  const issuesBlock = buildIssuesBlock(violations);

  return `<role>
You are a senior DevOps engineer and GitHub Actions security specialist. You fix
GitHub Actions workflows by applying issue reports precisely. Every flagged issue
must be resolved while preserving the original workflow's intended functionality.
You prioritize supply-chain security, least-privilege permissions, and CI/CD best
practices.
</role>

<context>
A GitHub Actions workflow has been analyzed by an automated linting and security
scanning pipeline (score: ${score.overall}/100, grade: ${score.grade}).
The analysis produced ${violations.length} issue${violations.length !== 1 ? 's' : ''} categorized
by severity (error, warning, info) and domain (schema, security, semantic,
best-practice, style). Your job is to produce a corrected workflow that resolves
every reported issue.
</context>

<workflow>
${yaml}
</workflow>

<issues>
${issuesBlock}
</issues>

<instructions>
1. Parse every issue in <issues>. For each one, identify the affected line(s) in
   the original <workflow> and determine the minimal change that resolves the
   issue without altering intended behavior.

2. Apply fixes in this priority order:
   a. Errors: these represent broken or dangerous configurations that must be
      fixed first.
   b. Warnings: these represent security risks or operational problems that
      should be addressed next.
   c. Info: these represent best-practice improvements to apply last.

3. Follow these GitHub Actions security best practices:
   - Pin third-party actions to full SHA commit hashes, not mutable tags.
   - Use least-privilege permissions at workflow and job level.
   - Never interpolate untrusted event data in run: blocks (use environment
     variables instead).
   - Add timeout-minutes to all jobs.
   - Add concurrency groups to prevent duplicate runs.
   - Name all steps for readability.
</instructions>

<output_format>
Return your response in two sections:

1. A summary of changes: a brief list mapping each issue ID or line reference
   to the fix you applied. Group by severity level.

2. The complete corrected workflow, ready to use, inside a single \`\`\`yaml
   code block. Do not omit any sections or use placeholders like
   "... rest unchanged". The full workflow must be present.
</output_format>

<constraints>
- Resolve ALL reported issues. Do not skip any, even info-level ones.
- Do not introduce new linting issues while fixing existing ones.
- Do not change the workflow's purpose or trigger events unless an issue
  explicitly requires it.
- When pinning action versions and exact SHAs are not known, use a comment
  (e.g., # pin to current SHA) as a placeholder rather than inventing hashes.
- Maintain valid YAML syntax throughout.
</constraints>`;
}

export function GhaPromptGenerator() {
  const result = useStore(ghaResult);
  const [copied, setCopied] = useState(false);

  if (!result || !result.violations.length) {
    return null;
  }

  const handleCopy = async () => {
    const view = ghaEditorViewRef.get();
    if (!view) return;
    const yaml = view.state.doc.toString();
    if (!yaml.trim()) return;

    const promptText = buildPrompt(yaml, result);

    try {
      await navigator.clipboard.writeText(promptText);
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
