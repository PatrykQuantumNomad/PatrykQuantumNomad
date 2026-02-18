import { atom } from 'nanostores';

/** Set of currently visible language IDs */
export const visibleLanguages = atom<Set<string>>(new Set());

/** Initialize the store with all language IDs */
export function initLanguages(ids: string[]) {
  visibleLanguages.set(new Set(ids));
}

/** Toggle a single language on/off */
export function toggleLanguage(id: string) {
  const current = visibleLanguages.get();
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  visibleLanguages.set(next);
}

/** Select all languages */
export function selectAll(ids: string[]) {
  visibleLanguages.set(new Set(ids));
}

/** Deselect all languages */
export function selectNone() {
  visibleLanguages.set(new Set());
}
