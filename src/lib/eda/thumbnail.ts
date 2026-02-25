/**
 * Build-time SVG thumbnail generator for technique cards.
 * Produces accessibility-annotated, fixed-size SVG strings for landing page use.
 *
 * Reuses existing SVG generators via renderTechniquePlot, scaling
 * output to 200x140 thumbnail dimensions via width/height attributes.
 * Wiring to landing page cards happens in Phase 54.
 */
import { renderTechniquePlot } from './technique-renderer';

/** Thumbnail dimensions */
const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 140;

/**
 * Generate a thumbnail SVG for the given technique slug.
 * Returns the full SVG output with fixed width/height attributes
 * and an aria-label for accessibility.
 */
export function generateThumbnail(slug: string): string {
  const svg = renderTechniquePlot(slug);
  if (!svg) return '';

  // Add fixed width/height and aria-label to the <svg> tag
  // All generators use viewBox, so the content scales automatically
  const title = slug.replace(/-/g, ' ');

  return svg
    .replace(
      /<svg([^>]*)>/,
      `<svg$1 width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}" role="img" aria-label="${title} thumbnail">`,
    );
}
