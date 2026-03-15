/**
 * URL construction helpers for notebook downloads and Colab links.
 *
 * Pure functions consumed by the NotebookActions.astro component.
 */

import { ALL_CASE_STUDY_SLUGS } from './registry/index';

/** Slugs that currently have generated notebooks (all 10 case studies). */
export const NOTEBOOK_SLUGS: string[] = ALL_CASE_STUDY_SLUGS;

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
