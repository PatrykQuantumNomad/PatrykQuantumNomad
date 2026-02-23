/**
 * Custom React Flow node displaying service name, image, ports, and
 * network color-coded border. Used by DependencyGraph for GRAPH-02/GRAPH-05.
 */
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type ServiceNodeData = {
  label: string;
  image?: string;
  ports?: string;
  networks?: string[];
  networkColor?: string;
};

export type ServiceNodeType = Node<ServiceNodeData, 'service'>;

export function ServiceNode({ data }: NodeProps<ServiceNodeType>) {
  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm w-[220px]"
      style={{
        borderColor: data.networkColor ?? 'var(--color-border, rgba(255,255,255,0.1))',
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
      <div className="font-bold text-[var(--color-text-primary,#e0e0e0)] truncate" title={data.label}>
        {data.label}
      </div>
      {data.image && (
        <div className="text-xs text-[var(--color-text-secondary,#a0a0a0)] truncate mt-0.5" title={data.image}>
          {data.image}
        </div>
      )}
      {data.ports && (
        <div className="text-xs text-[var(--color-accent,#c44b20)] truncate mt-0.5" title={data.ports}>
          {data.ports}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
    </div>
  );
}
