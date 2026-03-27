import { useState } from 'react';
import type { AiNode, Edge, Cluster } from '../../lib/ai-landscape/schema';
import { groupRelationshipsByType } from '../../lib/ai-landscape/schema';
import { buildAncestryChain } from '../../lib/ai-landscape/ancestry';
import { POPULAR_COMPARISONS, comparisonSlug } from '../../lib/ai-landscape/comparisons';
import { vsPageUrl, conceptUrl } from '../../lib/ai-landscape/routes';

export interface ComparePanelProps {
  node1: AiNode;
  node2: AiNode;
  edges: Edge[];
  nodeMap: Map<string, AiNode>;
  clusterMap: Map<string, Cluster>;
  onClose: () => void;
}

/**
 * Side-by-side comparison panel for two AI landscape concepts.
 *
 * Shows descriptions (with shared ELI5 toggle), ancestry paths,
 * key relationships, and a link to the curated VS page if available.
 * Replaces DetailPanel when compare mode is active.
 */
export function ComparePanel({
  node1,
  node2,
  edges,
  nodeMap,
  clusterMap,
  onClose,
}: ComparePanelProps) {
  const [isSimple, setIsSimple] = useState(true);

  const ancestry1 = buildAncestryChain(node1.slug, nodeMap);
  const ancestry2 = buildAncestryChain(node2.slug, nodeMap);

  const groups1 = groupRelationshipsByType(node1.id, edges, nodeMap);
  const groups2 = groupRelationshipsByType(node2.id, edges, nodeMap);

  // Check if this pair has a curated VS page
  const pairSlug = comparisonSlug(node1.slug, node2.slug);
  const hasCuratedPage = POPULAR_COMPARISONS.some((p) => p.slug === pairSlug);

  const cluster1 = clusterMap.get(node1.cluster);
  const cluster2 = clusterMap.get(node2.cluster);

  return (
    <div className="overflow-y-auto p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h2
          className="text-base font-bold leading-tight"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {node1.name} vs {node2.name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
          aria-label="Close compare panel"
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

      {/* Shared ELI5 toggle */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={
            isSimple
              ? 'font-semibold text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]'
          }
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
          className={
            !isSimple
              ? 'font-semibold text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]'
          }
        >
          Technical
        </span>
      </div>

      {/* Two-column comparison (stacked on mobile via grid) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Column 1 */}
        <ConceptColumn
          node={node1}
          isSimple={isSimple}
          ancestry={ancestry1}
          groups={groups1}
          accentColor={cluster1?.color ?? 'var(--color-accent)'}
        />

        {/* Column 2 */}
        <ConceptColumn
          node={node2}
          isSimple={isSimple}
          ancestry={ancestry2}
          groups={groups2}
          accentColor={cluster2?.color ?? 'var(--color-accent)'}
        />
      </div>

      {/* VS page link for curated pairs */}
      {hasCuratedPage && (
        <div className="mt-5 pt-3 border-t border-[var(--color-border)]">
          <a
            href={vsPageUrl(pairSlug)}
            className="inline-block rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-mono text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors"
          >
            View full comparison page &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Internal: single concept column                                     */
/* ------------------------------------------------------------------ */

interface ConceptColumnProps {
  node: AiNode;
  isSimple: boolean;
  ancestry: ReturnType<typeof buildAncestryChain>;
  groups: ReturnType<typeof groupRelationshipsByType>;
  accentColor: string;
}

function ConceptColumn({ node, isSimple, ancestry, groups, accentColor }: ConceptColumnProps) {
  // Show top 3 relationship groups, capped at 3 items each
  const topGroups = groups.slice(0, 3).map((g) => ({
    ...g,
    items: g.items.slice(0, 3),
  }));

  return (
    <div
      className="rounded-lg border border-[var(--color-border)] p-3"
      style={{ borderLeftWidth: '3px', borderLeftColor: accentColor }}
    >
      {/* Concept name */}
      <h3
        className="text-sm font-bold"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <a
          href={conceptUrl(node.slug)}
          className="hover:text-[var(--color-accent)] hover:underline"
        >
          {node.name}
        </a>
      </h3>

      {/* Description */}
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        {isSimple ? node.simpleDescription : node.technicalDescription}
      </p>

      {/* Ancestry breadcrumb */}
      {ancestry.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
          {ancestry.map((a, i) => (
            <span key={a.slug}>
              {i > 0 && <span className="mr-1">&rsaquo;</span>}
              <a
                href={conceptUrl(a.slug)}
                className="hover:text-[var(--color-accent)] hover:underline"
              >
                {a.name}
              </a>
            </span>
          ))}
          <span>
            <span className="mr-1">&rsaquo;</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{node.name}</span>
          </span>
        </div>
      )}

      {/* Key relationships */}
      {topGroups.length > 0 && (
        <div className="mt-3 space-y-2">
          {topGroups.map((group) => (
            <div key={group.label}>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {group.label}
              </h4>
              <ul className="mt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.slug} className="text-xs">
                    <a
                      href={conceptUrl(item.slug)}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
