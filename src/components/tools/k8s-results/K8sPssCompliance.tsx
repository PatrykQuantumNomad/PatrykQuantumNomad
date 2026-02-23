import type { PssComplianceSummary } from '../../../lib/tools/k8s-analyzer/types';

interface K8sPssComplianceProps {
  pssCompliance: PssComplianceSummary;
}

export function K8sPssCompliance({ pssCompliance }: K8sPssComplianceProps) {
  // If no workload resources exist (both compliant with zero violations), skip rendering
  if (
    pssCompliance.baselineCompliant &&
    pssCompliance.restrictedCompliant &&
    pssCompliance.totalPssViolations === 0
  ) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <PssBadge
        label="PSS Baseline"
        compliant={pssCompliance.baselineCompliant}
        violations={pssCompliance.baselineViolations}
      />
      <PssBadge
        label="PSS Restricted"
        compliant={pssCompliance.restrictedCompliant}
        violations={pssCompliance.restrictedViolations}
      />
    </div>
  );
}

function PssBadge({
  label,
  compliant,
  violations,
}: {
  label: string;
  compliant: boolean;
  violations: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${
        compliant
          ? 'bg-green-500/15 text-green-400'
          : 'bg-red-500/15 text-red-400'
      }`}
    >
      {compliant ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      )}
      {label}
      {!compliant && (
        <span className="font-mono">({violations})</span>
      )}
    </span>
  );
}
