/**
 * Custom React Flow node for hook events.
 * Displays event name with category-colored left border.
 * PreToolUse events show a "CAN BLOCK" badge in accent color.
 */
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type EventNodeData = {
  label: string;
  category: 'session' | 'loop' | 'standalone';
  canBlock?: boolean;
};

export type EventNodeType = Node<EventNodeData, 'event'>;

const CATEGORY_COLORS: Record<EventNodeData['category'], string> = {
  session: '#3b82f6',    // blue
  loop: '#8b5cf6',       // violet
  standalone: '#f59e0b', // amber
};

export function HookEventNode({ data, selected }: NodeProps<EventNodeType>) {
  const borderColor = CATEGORY_COLORS[data.category] ?? '#888';

  return (
    <div
      className={`px-3 py-2 rounded-lg text-sm w-[180px] cursor-pointer transition-all ${
        selected ? 'ring-2 ring-[var(--color-accent,#c44b20)]' : ''
      }`}
      style={{
        borderLeft: `3px solid ${borderColor}`,
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
      <div className="flex items-center justify-between gap-1">
        <span
          className="font-medium text-[var(--color-text-primary,#e0e0e0)] truncate"
          title={data.label}
        >
          {data.label}
        </span>
        {data.canBlock && (
          <span
            className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color: 'var(--color-accent, #c44b20)',
              border: '1px solid var(--color-accent, #c44b20)',
              backgroundColor: 'rgba(196, 75, 32, 0.1)',
            }}
          >
            CAN BLOCK
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
    </div>
  );
}
