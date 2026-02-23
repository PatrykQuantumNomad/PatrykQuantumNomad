import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type K8sResourceNodeData = {
  label: string;
  kind: string;
  namespace: string;
  categoryColor: string;
  isPhantom?: boolean;
};

export type K8sResourceNodeType = Node<K8sResourceNodeData, 'k8s-resource'>;

export const CATEGORY_COLORS: Record<string, string> = {
  workload: '#3b82f6',
  service: '#10b981',
  config: '#f59e0b',
  storage: '#8b5cf6',
  rbac: '#ef4444',
  scaling: '#06b6d4',
};

export function K8sResourceNode({ data }: NodeProps<K8sResourceNodeType>) {
  const isPhantom = data.isPhantom ?? false;

  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm w-[200px]"
      style={{
        borderColor: isPhantom ? 'rgba(239, 68, 68, 0.6)' : data.categoryColor,
        borderStyle: isPhantom ? 'dashed' : 'solid',
        backgroundColor: isPhantom
          ? 'rgba(0, 0, 0, 0.25)'
          : 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--color-accent,#c44b20)]" />
      <div
        className="font-mono uppercase truncate"
        style={{ fontSize: '10px', color: data.categoryColor }}
        title={data.kind}
      >
        {data.kind}
      </div>
      <div
        className="font-bold text-[var(--color-text-primary,#e0e0e0)] truncate"
        title={data.label}
      >
        {data.label}
      </div>
      {data.namespace !== 'default' && (
        <div
          className="text-[var(--color-text-secondary,#a0a0a0)] truncate mt-0.5"
          style={{ fontSize: '12px' }}
          title={data.namespace}
        >
          ns: {data.namespace}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--color-accent,#c44b20)]" />
    </div>
  );
}
