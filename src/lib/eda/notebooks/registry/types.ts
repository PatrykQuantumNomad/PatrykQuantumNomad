/**
 * Case study registry types for EDA notebook generation.
 *
 * Each case study config maps a slug to its NIST .DAT file metadata,
 * analysis parameters, and expected statistics for validation.
 *
 * Single base type with optional fields (per user decision).
 */

export interface CaseStudyConfig {
  /** URL-friendly slug matching the MDX filename */
  slug: string;
  /** Human-readable title */
  title: string;
  /** NIST section reference (e.g., '1.4.2.1') */
  nistSection: string;
  /** .DAT filename (e.g., 'RANDN.DAT') */
  dataFile: string;
  /** Lines to skip in the .DAT file header (before data begins) */
  skipRows: number;
  /** Number of expected data rows (for assertion) */
  expectedRows: number;
  /** Column names for pd.read_fwf() */
  columns: string[];
  /** Response variable name */
  responseVariable: string;
  /** Expected statistics for validation assertions */
  expectedStats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    median?: number;
  };
  /** NIST handbook URL */
  nistUrl: string;
  /** GitHub raw URL for Colab fallback */
  githubRawUrl: string;
  /** Plot titles for the case study */
  plotTitles: {
    fourPlot: string;
    runSequence: string;
    lagPlot: string;
    histogram: string;
    probabilityPlot: string;
  };
  /** Hypothesis test parameters */
  testParams?: {
    /** Target mean for location test (H0) */
    targetMean?: number;
    /** Significance level (default 0.05) */
    alpha?: number;
  };
  /** Optional: model fitting parameters (beam deflections, random walk) */
  modelParams?: {
    type: 'sinusoidal' | 'ar1';
    [key: string]: unknown;
  };
  /** Optional: DOE factors (ceramic strength) */
  doeFactors?: {
    name: string;
    column: string;
    levels: (string | number)[];
  }[];
  /** For multi-value-per-line .DAT files (e.g., RANDN=10, RANDU=5, SOULEN=5) */
  valuesPerLine?: number;
  /** Brief description of the case study */
  description?: string;
  /** How the data was generated/collected (from NIST Background and Data page) */
  generation?: string;
}
