import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  k8sResult,
  k8sEditorViewRef,
} from '../../../stores/k8sAnalyzerStore';
import type { K8sLintViolation } from '../../../lib/tools/k8s-analyzer/types';

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };
const SEVERITY_HEADINGS: Record<string, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
};

function groupBySeverity(violations: K8sLintViolation[]): [string, K8sLintViolation[]][] {
  const groups = new Map<string, K8sLintViolation[]>();
  for (const v of violations) {
    const group = groups.get(v.severity) ?? [];
    group.push(v);
    groups.set(v.severity, group);
  }
  return [...groups.entries()].sort(
    ([a], [b]) => (SEVERITY_ORDER[a] ?? 3) - (SEVERITY_ORDER[b] ?? 3),
  );
}

function buildIssuesBlock(violations: K8sLintViolation[]): string {
  const groups = groupBySeverity(violations);
  const lines: string[] = [];

  for (const [severity, items] of groups) {
    lines.push(`### ${SEVERITY_HEADINGS[severity] ?? severity}`);
    for (const v of items) {
      const resourceCtx =
        v.resourceKind && v.resourceName
          ? ` [${v.resourceKind}/${v.resourceName}]`
          : '';
      lines.push(`- ${v.ruleId} (line ${v.line}, ${v.category})${resourceCtx}: ${v.title}`);
      lines.push(`  ${v.explanation}`);
      lines.push(`  Fix: ${v.fix.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function buildPrompt(yaml: string, result: NonNullable<ReturnType<typeof k8sResult.get>>): string {
  const { violations, score } = result;
  const issuesBlock = buildIssuesBlock(violations);

  return `<role>
You are a senior platform engineer and Kubernetes security specialist. You fix
Kubernetes manifests by applying issue reports precisely. Every flagged issue
must be resolved while preserving the original workload's intended functionality.
You prioritize production-readiness, security hardening, and operational best
practices following the Pod Security Standards (PSS) framework.
</role>

<context>
A Kubernetes manifest has been analyzed by an automated linting and security
scanning pipeline (score: ${score.overall}/100, grade: ${score.grade}).
The analysis produced ${violations.length} issue${violations.length !== 1 ? 's' : ''} categorized
by severity (error, warning, info) and domain (schema, security, reliability,
best-practice, cross-resource). Your job is to produce corrected Kubernetes
manifests that resolve every reported issue.
</context>

<k8s_manifest>
${yaml}
</k8s_manifest>

<issues>
${issuesBlock}
</issues>

<instructions>
1. Parse every issue in <issues>. For each one, identify the affected
   resource and line(s) in the original <k8s_manifest> and determine the
   minimal change that resolves the issue without altering intended behavior.

2. Apply fixes in this priority order:
   a. Errors: these represent broken or dangerous configurations that must
      be fixed first.
   b. Warnings: these represent security risks or operational problems
      that should be addressed next.
   c. Info: these represent best-practice improvements to apply last.

3. When multiple issues affect the same resource, combine all fixes into a
   single corrected resource definition.

4. Preserve the original functionality:
   - Keep all intended resources, their relationships, and configurations.
   - Do not add resources beyond what is needed to resolve reported issues.
   - If an issue requires removing something (e.g., privileged mode),
     replace it with the minimal secure alternative (e.g., specific
     capabilities via securityContext).

5. Follow these Kubernetes best practices when restructuring:
   - Use specific image version tags instead of :latest or untagged.
   - Define resource requests and limits for all containers.
   - Set securityContext with least privilege (non-root, drop ALL caps).
   - Use namespaces for workload isolation.
   - Add standard labels (app.kubernetes.io/name, version, component).
   - Define liveness and readiness probes for all containers.
</instructions>

<output_format>
Return your response in two sections:

1. A summary of changes: a brief list mapping each issue ID or line
   reference to the fix you applied. Group by severity level.

2. The complete corrected Kubernetes manifest, ready to apply, inside a
   single \`\`\`yaml code block. Do not omit any sections or use placeholders
   like "... rest unchanged". The full manifest must be present.
</output_format>

<constraints>
- Resolve ALL reported issues. Do not skip any, even info-level ones.
- Do not introduce new linting issues while fixing existing ones.
- Do not change base images or workload purposes unless an issue explicitly
  requires it.
- When pinning image versions and exact versions are not specified in the
  issue report, use a comment (e.g., # pin to current version) as a
  placeholder rather than inventing version numbers.
- Never leave secrets or API keys as plain-text values in the final manifest.
  Use Kubernetes Secrets with secretKeyRef instead.
- Maintain valid YAML syntax throughout. Separate resources with --- markers.
</constraints>`;
}

export function K8sPromptGenerator() {
  const result = useStore(k8sResult);
  const [copied, setCopied] = useState(false);

  if (!result || !result.parseSuccess || !result.violations.length) {
    return null;
  }

  const handleCopy = async () => {
    const view = k8sEditorViewRef.get();
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
