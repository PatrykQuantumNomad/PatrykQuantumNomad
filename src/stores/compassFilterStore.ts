import { atom } from 'nanostores';

/** Set of currently active use-case category IDs */
export const activeCategories = atom<Set<string>>(new Set());

/** Initialize the store with all category IDs as active */
export function initCategories(ids: string[]) {
  activeCategories.set(new Set(ids));
}

/** Toggle a single category on/off */
export function toggleCategory(id: string) {
  const current = activeCategories.get();
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  activeCategories.set(next);
}

/** Select all categories */
export function selectAllCategories(ids: string[]) {
  activeCategories.set(new Set(ids));
}

/** Deselect all categories */
export function selectNoCategories() {
  activeCategories.set(new Set());
}
