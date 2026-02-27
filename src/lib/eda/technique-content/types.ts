/**
 * Shared interface for all graphical technique content entries.
 *
 * Each entry provides structured educational text derived from
 * NIST/SEMATECH Engineering Statistics Handbook Section 1.3.3.
 */

export interface TechniqueContent {
  // ── Required fields (original) ──────────────────────────────

  /** 1-2 sentences: what this technique is */
  definition: string;
  /** 2-3 sentences: when and why to use it */
  purpose: string;
  /** 3-5 sentences: how to read the plot */
  interpretation: string;
  /** 1-3 sentences: key assumptions and limitations */
  assumptions: string;
  /** NIST/SEMATECH section reference string */
  nistReference: string;

  // ── Optional fields (extended for Phase 66-67 content) ──────

  /** Analyst questions this technique answers (e.g. "Is the data random?") */
  questions?: string[];

  /** Why this technique matters in practice (1-2 sentences) */
  importance?: string;

  /** Longer definition expanding on the concise `definition` field */
  definitionExpanded?: string;

  /** Mathematical formulas displayed on the technique page */
  formulas?: Array<{
    /** Human-readable label (e.g. "Sample Autocorrelation") */
    label: string;
    /** KaTeX display-mode formula (MUST use String.raw) */
    tex: string;
    /** Plain-English explanation of the formula */
    explanation: string;
  }>;

  /** Complete Python example demonstrating the technique */
  pythonCode?: string;

  /** Slugs of related EDA case-study pages */
  caseStudySlugs?: string[];

  /** Worked examples showing the technique applied to real data */
  examples?: Array<{
    /** Short title for the example */
    label: string;
    /** Narrative description of the example */
    description: string;
    /** Optional SVG variant label for visual toggle */
    variantLabel?: string;
  }>;
}
