/**
 * Custom React Flow node for hook event category headers.
 * Displays category name with event count badge.
 * Not selectable -- categories are entry points, not interactive.
 */
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type CategoryNodeData = {
  label: string;
  count: number;
};

export type CategoryNodeType = Node<CategoryNodeData, 'category'>;

export function HookCategoryNode({ data }: NodeProps<CategoryNodeType>) {
  return (
    <div
      className="px-4 py-2.5 rounded-lg text-sm w-[200px]"
      style={{
        border: '1px dashed var(--color-border, rgba(255,255,255,0.2))',
        backgroundColor: 'var(--color-surface, #1a1a2e)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[var(--color-text-primary,#e0e0e0)]">
          {data.label}
        </span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{
            color: 'var(--color-text-secondary, #a0a0a0)',
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        >
          {data.count}
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
