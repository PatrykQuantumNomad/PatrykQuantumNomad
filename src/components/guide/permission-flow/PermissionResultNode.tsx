/**
 * Custom React Flow result node for permission evaluation outcomes.
 *
 * Renders a rectangular node with a left border colored by outcome:
 *   deny = red, ask = amber, allow = green.
 * Shows accent ring when selected.
 */
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type ResultNodeData = {
  label: string;
  description: string;
  outcome: 'deny' | 'ask' | 'allow';
};

export type ResultNodeType = Node<ResultNodeData, 'result'>;

const OUTCOME_COLORS: Record<ResultNodeData['outcome'], string> = {
  deny: '#ef4444',
  ask: '#f59e0b',
  allow: '#22c55e',
};

export function PermissionResultNode({ data, selected }: NodeProps<ResultNodeType>) {
  const color = OUTCOME_COLORS[data.outcome] ?? '#888';

  return (
    <div
      className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-all w-[140px] ${
        selected ? 'ring-2 ring-[var(--color-accent,#c44b20)]' : ''
      }`}
      style={{
        borderLeft: `3px solid ${color}`,
        borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))',
        borderRight: '1px solid var(--color-border, rgba(255,255,255,0.1))',
        borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))',
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent,#c44b20)]"
      />

      <div className="min-w-0">
        <div
          className="font-bold text-[var(--color-text-primary,#e0e0e0)] truncate text-xs"
          title={data.label}
        >
          {data.label}
        </div>
        <div
          className="text-[10px] text-[var(--color-text-secondary,#a0a0a0)] truncate"
          title={data.description}
        >
          {data.description}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
    </div>
  );
}
