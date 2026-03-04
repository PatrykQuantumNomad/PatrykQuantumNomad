/**
 * Custom React Flow node for workflow trigger events (push, pull_request, etc.).
 * Indigo-bordered node with a single right-side source handle (GRAPH-01/GRAPH-04).
 */
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type GhaTriggerNodeData = {
  label: string;
};

export type GhaTriggerNodeType = Node<GhaTriggerNodeData, 'gha-trigger'>;

export function GhaTriggerNode({ data }: NodeProps<GhaTriggerNodeType>) {
  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm w-[140px]"
      style={{
        borderColor: '#6366f1',
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <div
        className="font-mono uppercase text-[10px] tracking-wider mb-1"
        style={{ color: '#818cf8' }}
      >
        trigger
      </div>
      <div
        className="font-bold text-[var(--color-text-primary,#e0e0e0)] truncate"
        title={data.label}
      >
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
    </div>
  );
}
