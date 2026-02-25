import { atom } from 'nanostores';

/** Currently active category filter. 'all' shows everything. */
export const activeCategory = atom<string>('all');

/** Set the active category */
export function setCategory(cat: string) {
  activeCategory.set(cat);
}
