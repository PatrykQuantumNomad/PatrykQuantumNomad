/**
 * URL construction helpers for notebook downloads and Colab links.
 *
 * Pure functions consumed by the NotebookActions.astro component.
 * Phase 100 will extend NOTEBOOK_SLUGS to include advanced case studies.
 */

import { STANDARD_SLUGS } from './templates/standard';

/** Slugs that currently have generated notebooks. */
export const NOTEBOOK_SLUGS: string[] = STANDARD_SLUGS;

/** Return the local download path for a notebook ZIP. */
export function getDownloadUrl(slug: string): string {
  return `/downloads/notebooks/${slug}.zip`;
}

/** Return the Google Colab URL to open a notebook from the GitHub repo. */
export function getColabUrl(slug: string): string {
  return `https://colab.research.google.com/github/PatrykQuantumNomad/PatrykQuantumNomad/blob/main/notebooks/eda/${slug}.ipynb`;
}

/** Check whether a notebook exists for the given case study slug. */
export function hasNotebook(slug: string): boolean {
  return NOTEBOOK_SLUGS.includes(slug);
}
