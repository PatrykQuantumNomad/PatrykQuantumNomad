/**
 * Custom React Flow group node for workflow jobs. Renders header chrome with
 * status-colored border; step children are placed inside via React Flow parentId.
 * Has both left target and right source handles (GRAPH-01/GRAPH-04/GRAPH-05).
 */
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type GhaJobNodeData = {
  label: string;
  violationStatus: 'clean' | 'warning' | 'error';
  stepCount: number;
};

export type GhaJobNodeType = Node<GhaJobNodeData, 'gha-job'>;

const STATUS_COLORS: Record<GhaJobNodeData['violationStatus'], string> = {
  clean: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export function GhaJobNode({ data }: NodeProps<GhaJobNodeType>) {
  const borderColor = STATUS_COLORS[data.violationStatus];

  return (
    <div
      className="rounded-lg border text-sm"
      style={{
        borderColor,
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
        width: '100%',
        height: '100%',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
      <div
        className="px-3 py-2"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div
          className="font-mono uppercase text-[10px] tracking-wider mb-1"
          style={{ color: borderColor }}
        >
          job
        </div>
        <div
          className="font-bold text-[var(--color-text-primary,#e0e0e0)] truncate"
          title={data.label}
        >
          {data.label}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
    </div>
  );
}
