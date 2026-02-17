import { atom } from 'nanostores';

/** Currently active tab index (0-9 for 10 features) */
export const activeTab = atom<number>(0);

/** Set the active tab index and sync DOM visibility */
export function setActiveTab(index: number) {
  activeTab.set(index);
}
