import { useState } from 'react';
import type { AiNode, Edge } from '../../lib/ai-landscape/schema';
import { groupRelationshipsByType } from '../../lib/ai-landscape/schema';
import { conceptUrl } from '../../lib/ai-landscape/routes';

export interface DetailPanelProps {
  node: AiNode;
  edges: Edge[];
  nodeMap: Map<string, AiNode>;
  onClose: () => void;
  onShowAncestry: (nodeSlug: string) => void;
}

/**
 * Presentational panel displaying concept details with an ELI5 toggle,
 * grouped relationships, and a link to the full concept page.
 *
 * Does NOT manage its own open/close state or positioning — those are
 * controlled by the parent wrapper (Plan 02).
 */
export function DetailPanel({
  node,
  edges,
  nodeMap,
  onClose,
  onShowAncestry,
}: DetailPanelProps) {
  const [isSimple, setIsSimple] = useState(true);

  const groups = groupRelationshipsByType(node.id, edges, nodeMap);

  return (
    <div className="overflow-y-auto p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {node.name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
          aria-label="Close panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* ELI5 toggle */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={isSimple ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}
        >
          Simple
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isSimple}
          onClick={() => setIsSimple((prev) => !prev)}
          className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors"
          style={{
            backgroundColor: isSimple ? 'var(--color-accent)' : 'var(--color-border)',
          }}
        >
          <span
            className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
            style={{
              transform: isSimple ? 'translateX(2px)' : 'translateX(18px)',
            }}
          />
        </button>
        <span
          className={!isSimple ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}
        >
          Technical
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {isSimple ? node.simpleDescription : node.technicalDescription}
      </p>

      {/* Ancestry button */}
      {node.parentId !== null && (
        <button
          type="button"
          onClick={() => onShowAncestry(node.slug)}
          className="mt-2 text-xs text-[var(--color-accent)] hover:underline"
        >
          How did we get here?
        </button>
      )}

      {/* Grouped relationships */}
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {group.label}
          </h3>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.slug} className="text-sm">
                <a
                  href={conceptUrl(item.slug)}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {item.name}
                </a>
                <span className="ml-1.5 text-xs text-[var(--color-text-secondary)]">
                  {item.edgeLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Full page link */}
      <div className="mt-6">
        <a
          href={conceptUrl(node.slug)}
          className="inline-block rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-mono text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors"
        >
          View full page &rarr;
        </a>
      </div>
    </div>
  );
}
