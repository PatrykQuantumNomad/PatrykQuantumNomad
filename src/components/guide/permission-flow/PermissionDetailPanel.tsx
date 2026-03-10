/**
 * Detail panel shown below the ReactFlow canvas when a node is clicked.
 *
 * Displays the node's evaluation context: title, description, and
 * key-value details in a 2-column grid.
 */
import type { DetailContent } from '../../../lib/guides/interactive-data/permission-flow-data';

interface DetailPanelProps {
  content: DetailContent;
  onClose: () => void;
}

export function PermissionDetailPanel({ content, onClose }: DetailPanelProps) {
  return (
    <div className="mt-3 p-4 rounded-lg border border-[var(--color-border,rgba(255,255,255,0.1))] bg-[var(--color-surface,#1a1a2e)] transition-all">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[var(--color-text-primary,#e0e0e0)] text-sm">
          {content.title}
        </h4>
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary,#a0a0a0)] hover:text-[var(--color-text-primary,#e0e0e0)] text-xs px-2 py-1 rounded border border-[var(--color-border,rgba(255,255,255,0.1))] hover:border-[var(--color-text-secondary,#a0a0a0)] transition-colors"
          aria-label="Close detail panel"
        >
          Close
        </button>
      </div>
      <p className="text-xs text-[var(--color-text-secondary,#a0a0a0)] mb-3 leading-relaxed">
        {content.description}
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {content.details.map((d) => (
          <div
            key={d.key}
            className="p-2 rounded bg-[var(--color-surface-alt,rgba(0,0,0,0.2))]"
          >
            <dt className="text-[var(--color-text-secondary,#a0a0a0)] font-medium mb-0.5">
              {d.key}
            </dt>
            <dd className="text-[var(--color-text-primary,#e0e0e0)] font-mono">
              {d.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
