/**
 * Custom React Flow decision node for permission evaluation diamonds.
 *
 * Renders a rectangular container with a decorative diamond SVG background
 * (NOT clip-path, which would clip handles -- Pitfall 5 from research).
 * Shows accent ring when selected.
 */
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type DecisionNodeData = {
  label: string;
  description: string;
  outcome: 'deny' | 'ask' | 'allow';
};

export type DecisionNodeType = Node<DecisionNodeData, 'decision'>;

const OUTCOME_COLORS: Record<DecisionNodeData['outcome'], string> = {
  deny: '#ef4444',
  ask: '#f59e0b',
  allow: '#22c55e',
};

export function PermissionDecisionNode({ data, selected }: NodeProps<DecisionNodeType>) {
  const color = OUTCOME_COLORS[data.outcome] ?? '#888';

  return (
    <div
      className={`relative px-3 py-3 rounded-lg border text-sm cursor-pointer transition-all w-[140px] ${
        selected ? 'ring-2 ring-[var(--color-accent,#c44b20)]' : ''
      }`}
      style={{
        borderColor: selected ? 'var(--color-accent, #c44b20)' : color,
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      {/* Decorative diamond SVG background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 140 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="70,2 138,30 70,58 2,30"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent,#c44b20)]"
      />

      <div className="flex items-center justify-center h-full relative z-10">
        <span
          className="font-bold text-[var(--color-text-primary,#e0e0e0)] text-xs text-center leading-tight"
          title={data.description}
        >
          {data.label}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
    </div>
  );
}
