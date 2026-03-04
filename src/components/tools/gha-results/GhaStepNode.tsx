/**
 * Custom React Flow node for individual workflow steps within a job container.
 * Compact display with status-colored left border. No handles -- purely visual
 * within parent job group (GRAPH-01/GRAPH-05).
 */
import type { NodeProps, Node } from '@xyflow/react';

export type GhaStepNodeData = {
  label: string;
  violationStatus: 'clean' | 'warning' | 'error';
  stepIndex: number;
};

export type GhaStepNodeType = Node<GhaStepNodeData, 'gha-step'>;

const STATUS_BG: Record<GhaStepNodeData['violationStatus'], string> = {
  clean: 'rgba(16, 185, 129, 0.1)',
  warning: 'rgba(245, 158, 11, 0.1)',
  error: 'rgba(239, 68, 68, 0.1)',
};

const STATUS_BORDER: Record<GhaStepNodeData['violationStatus'], string> = {
  clean: 'rgba(16, 185, 129, 0.3)',
  warning: 'rgba(245, 158, 11, 0.3)',
  error: 'rgba(239, 68, 68, 0.3)',
};

export function GhaStepNode({ data }: NodeProps<GhaStepNodeType>) {
  return (
    <div
      className="px-2 py-1.5 rounded text-xs text-[var(--color-text-primary,#e0e0e0)] truncate"
      style={{
        backgroundColor: STATUS_BG[data.violationStatus],
        borderLeft: `3px solid ${STATUS_BORDER[data.violationStatus]}`,
        width: '100%',
      }}
      title={data.label}
    >
      {data.label}
    </div>
  );
}
