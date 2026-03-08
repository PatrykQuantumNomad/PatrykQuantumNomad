/**
 * Custom React Flow node for deployment topology services.
 * Displays an icon, service label, and optional subtitle.
 * Follows the ServiceNode pattern from compose-results.
 */
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type TopologyNodeData = {
  label: string;
  subtitle?: string;
  icon: 'app' | 'db' | 'cache' | 'proxy';
};

export type TopologyNodeType = Node<TopologyNodeData, 'topology'>;

const ICON_MAP: Record<TopologyNodeData['icon'], { emoji: string; color: string }> = {
  app: { emoji: '\u2699\uFE0F', color: '#3b82f6' },   // gear -- blue
  db: { emoji: '\uD83D\uDDC4\uFE0F', color: '#8b5cf6' },   // file cabinet -- violet
  cache: { emoji: '\u26A1', color: '#f59e0b' },  // lightning -- amber
  proxy: { emoji: '\uD83D\uDEE1\uFE0F', color: '#10b981' }, // shield -- emerald
};

export function TopologyNode({ data }: NodeProps<TopologyNodeType>) {
  const iconInfo = ICON_MAP[data.icon] ?? ICON_MAP.app;

  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm w-[200px]"
      style={{
        borderColor: iconInfo.color,
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
      <div className="flex items-center gap-2">
        <span className="text-base" role="img" aria-hidden="true">
          {iconInfo.emoji}
        </span>
        <div className="min-w-0">
          <div
            className="font-bold text-[var(--color-text-primary,#e0e0e0)] truncate"
            title={data.label}
          >
            {data.label}
          </div>
          {data.subtitle && (
            <div
              className="text-xs text-[var(--color-text-secondary,#a0a0a0)] truncate"
              title={data.subtitle}
            >
              {data.subtitle}
            </div>
          )}
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
