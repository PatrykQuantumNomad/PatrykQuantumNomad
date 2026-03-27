import { useMemo, useCallback } from 'react';
import type { AiNode } from '../../lib/ai-landscape/schema';

/**
 * Bidirectional URL <-> node selection sync hook.
 *
 * Reads the `?node=slug` query parameter on mount and provides a
 * `syncToUrl` callback that updates the URL via `history.replaceState`
 * (avoids polluting browser history with pushState).
 */
export function useUrlNodeState(
  nodeMap: Map<string, AiNode>,
): {
  initialNodeSlug: string | null;
  syncToUrl: (slug: string | null) => void;
} {
  const initialNodeSlug = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('node');
    if (slug && nodeMap.has(slug)) {
      return slug;
    }
    return null;
  }, [nodeMap]);

  const syncToUrl = useCallback((slug: string | null) => {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set('node', slug);
    } else {
      url.searchParams.delete('node');
    }
    history.replaceState(null, '', url.toString());
  }, []);

  return { initialNodeSlug, syncToUrl };
}
