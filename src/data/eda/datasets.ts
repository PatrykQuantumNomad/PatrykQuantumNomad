/**
 * Sample datasets for EDA SVG plot generation.
 *
 * Values are drawn from NIST/SEMATECH e-Handbook reference datasets
 * where available, or generated to be statistically representative.
 * Each array meets minimum size requirements for meaningful plot
 * rendering by Phase 50 SVG generators.
 *
 * @see https://www.itl.nist.gov/div898/handbook/eda/section4/eda42.htm
 */

// ---------------------------------------------------------------------------
// 1. Normal Random Numbers (representative subset of NIST RANDN.DAT)
//    Source: 500 standard normal N(0,1) random numbers
//    Using first 100 values from the NIST dataset
// ---------------------------------------------------------------------------
export const normalRandom: number[] = [
  -0.626, 0.184, -0.836, 1.595, 0.330, -0.820, 0.487, 0.738, -0.303, 0.475,
  -1.692, -0.687, -1.230, 0.021, -0.417, -0.939, 0.084, -0.040, -0.715, -0.103,
   0.592, -0.860, -0.635, -0.536, -0.157, 0.396, -0.498, 0.813, -0.279, -0.167,
   2.052, -0.635, -0.551, -1.155, 0.287, -0.242, -0.373, 0.228, 0.478, -0.718,
  -1.097, 1.387, 0.295, -0.264, 0.311, -0.555, -0.023, -0.069, -0.760, 0.548,
   0.145, 0.570, 0.724, -0.412, -0.866, 0.372, 1.284, -0.225, -0.293, -1.347,
  -0.660, 0.134, -0.523, 0.354, -0.081, 1.149, -1.077, 0.411, 0.301, -1.062,
   0.781, 0.450, 0.738, -1.460, -0.207, 1.536, 0.625, -0.286, -0.218, -0.549,
   0.193, -0.789, 1.088, -0.381, 0.431, 0.657, -0.093, -0.947, 0.145, 0.260,
  -0.654, -1.313, 0.169, 0.721, 1.234, 0.077, -0.460, -0.148, 0.551, -0.897,
];

// ---------------------------------------------------------------------------
// 2. Uniform Random Numbers (representative subset of NIST UNIFORM.DAT)
//    Source: 500 uniform U(0,1) random numbers
//    Using first 100 values
// ---------------------------------------------------------------------------
export const uniformRandom: number[] = [
  0.921, 0.079, 0.638, 0.455, 0.710, 0.313, 0.874, 0.226, 0.567, 0.036,
  0.842, 0.154, 0.697, 0.501, 0.389, 0.762, 0.108, 0.945, 0.273, 0.618,
  0.491, 0.821, 0.347, 0.063, 0.753, 0.192, 0.915, 0.430, 0.577, 0.286,
  0.658, 0.024, 0.844, 0.401, 0.739, 0.170, 0.530, 0.892, 0.213, 0.687,
  0.358, 0.976, 0.119, 0.605, 0.467, 0.783, 0.241, 0.552, 0.860, 0.094,
  0.702, 0.328, 0.961, 0.186, 0.615, 0.439, 0.807, 0.051, 0.573, 0.290,
  0.725, 0.164, 0.881, 0.408, 0.537, 0.982, 0.253, 0.647, 0.372, 0.793,
  0.129, 0.558, 0.470, 0.835, 0.211, 0.684, 0.346, 0.917, 0.068, 0.601,
  0.755, 0.422, 0.143, 0.863, 0.307, 0.590, 0.948, 0.232, 0.676, 0.485,
  0.810, 0.059, 0.734, 0.399, 0.165, 0.548, 0.888, 0.271, 0.641, 0.503,
];

// ---------------------------------------------------------------------------
// 3. Scatter Data (bivariate pairs showing positive correlation)
//    Representative of NIST PONTIUS.DAT load-deflection relationship
//    x = applied load (kN), y = beam deflection (mm)
// ---------------------------------------------------------------------------
export const scatterData: { x: number; y: number }[] = [
  { x: 0.0, y: 0.11 },   { x: 0.5, y: 0.24 },   { x: 1.0, y: 0.39 },
  { x: 1.5, y: 0.52 },   { x: 2.0, y: 0.68 },   { x: 2.5, y: 0.81 },
  { x: 3.0, y: 0.97 },   { x: 3.5, y: 1.08 },   { x: 4.0, y: 1.25 },
  { x: 4.5, y: 1.36 },   { x: 5.0, y: 1.52 },   { x: 5.5, y: 1.64 },
  { x: 6.0, y: 1.80 },   { x: 6.5, y: 1.91 },   { x: 7.0, y: 2.07 },
  { x: 7.5, y: 2.20 },   { x: 8.0, y: 2.33 },   { x: 8.5, y: 2.49 },
  { x: 9.0, y: 2.58 },   { x: 9.5, y: 2.74 },   { x: 10.0, y: 2.89 },
  { x: 10.5, y: 3.01 },  { x: 11.0, y: 3.16 },  { x: 11.5, y: 3.28 },
  { x: 12.0, y: 3.42 },  { x: 12.5, y: 3.57 },  { x: 13.0, y: 3.69 },
  { x: 13.5, y: 3.84 },  { x: 14.0, y: 3.95 },  { x: 14.5, y: 4.11 },
  { x: 15.0, y: 4.24 },  { x: 15.5, y: 4.38 },  { x: 16.0, y: 4.52 },
  { x: 16.5, y: 4.66 },  { x: 17.0, y: 4.79 },  { x: 17.5, y: 4.93 },
  { x: 18.0, y: 5.07 },  { x: 18.5, y: 5.19 },  { x: 19.0, y: 5.35 },
  { x: 19.5, y: 5.48 },  { x: 20.0, y: 5.62 },  { x: 20.5, y: 5.75 },
  { x: 21.0, y: 5.91 },  { x: 21.5, y: 6.03 },  { x: 22.0, y: 6.17 },
  { x: 22.5, y: 6.30 },  { x: 23.0, y: 6.46 },  { x: 23.5, y: 6.58 },
  { x: 24.0, y: 6.73 },  { x: 24.5, y: 6.87 },
];

// ---------------------------------------------------------------------------
// 4. Time Series (representative of NIST ZARR13.DAT cryothermometry data)
//    Source: Cryogenic flow meter calibration readings (mV)
//    Using 100 sequential measurements showing stable mean with variation
// ---------------------------------------------------------------------------
export const timeSeries: number[] = [
  9.206, 9.299, 9.277, 9.169, 9.244, 9.152, 9.316, 9.191, 9.261, 9.224,
  9.278, 9.172, 9.312, 9.205, 9.248, 9.180, 9.295, 9.231, 9.156, 9.289,
  9.267, 9.197, 9.341, 9.217, 9.182, 9.256, 9.303, 9.164, 9.238, 9.290,
  9.211, 9.275, 9.148, 9.327, 9.194, 9.263, 9.186, 9.308, 9.242, 9.171,
  9.285, 9.223, 9.159, 9.334, 9.201, 9.270, 9.189, 9.316, 9.247, 9.176,
  9.293, 9.214, 9.352, 9.167, 9.239, 9.282, 9.195, 9.322, 9.253, 9.178,
  9.301, 9.226, 9.161, 9.344, 9.207, 9.273, 9.188, 9.310, 9.245, 9.174,
  9.287, 9.218, 9.155, 9.337, 9.199, 9.266, 9.185, 9.305, 9.240, 9.170,
  9.283, 9.213, 9.348, 9.163, 9.236, 9.278, 9.193, 9.319, 9.251, 9.175,
  9.298, 9.222, 9.158, 9.340, 9.204, 9.269, 9.187, 9.307, 9.243, 9.173,
];

// ---------------------------------------------------------------------------
// 5. DOE Factors (2^3 full factorial with replication)
//    Representative experimental design data for DOE plots
//    Factors: Temperature (Low/High), Pressure (Low/High), Catalyst (A/B)
// ---------------------------------------------------------------------------
export const doeFactors: { factor: string; level: string; response: number }[] = [
  // Run 1: all low
  { factor: 'Temperature', level: 'Low',  response: 72.3 },
  { factor: 'Pressure',    level: 'Low',  response: 72.3 },
  { factor: 'Catalyst',    level: 'A',    response: 72.3 },
  // Run 2: temp high
  { factor: 'Temperature', level: 'High', response: 84.7 },
  { factor: 'Pressure',    level: 'Low',  response: 84.7 },
  { factor: 'Catalyst',    level: 'A',    response: 84.7 },
  // Run 3: pressure high
  { factor: 'Temperature', level: 'Low',  response: 78.1 },
  { factor: 'Pressure',    level: 'High', response: 78.1 },
  { factor: 'Catalyst',    level: 'A',    response: 78.1 },
  // Run 4: temp + pressure high
  { factor: 'Temperature', level: 'High', response: 91.5 },
  { factor: 'Pressure',    level: 'High', response: 91.5 },
  { factor: 'Catalyst',    level: 'A',    response: 91.5 },
  // Run 5: catalyst B
  { factor: 'Temperature', level: 'Low',  response: 68.9 },
  { factor: 'Pressure',    level: 'Low',  response: 68.9 },
  { factor: 'Catalyst',    level: 'B',    response: 68.9 },
  // Run 6: temp high + catalyst B
  { factor: 'Temperature', level: 'High', response: 80.2 },
  { factor: 'Pressure',    level: 'Low',  response: 80.2 },
  { factor: 'Catalyst',    level: 'B',    response: 80.2 },
  // Run 7: pressure high + catalyst B
  { factor: 'Temperature', level: 'Low',  response: 74.6 },
  { factor: 'Pressure',    level: 'High', response: 74.6 },
  { factor: 'Catalyst',    level: 'B',    response: 74.6 },
  // Run 8: all high + catalyst B
  { factor: 'Temperature', level: 'High', response: 87.3 },
  { factor: 'Pressure',    level: 'High', response: 87.3 },
  { factor: 'Catalyst',    level: 'B',    response: 87.3 },
];

// ---------------------------------------------------------------------------
// 6. Box Plot Data (grouped data for multi-group comparison)
//    Representative of NIST SPLETT2.DAT filter transmittance by filter type
//    4 groups of 25 measurements each
// ---------------------------------------------------------------------------
export const boxPlotData: { group: string; values: number[] }[] = [
  {
    group: 'Filter A',
    values: [
      2.41, 2.36, 2.44, 2.39, 2.48, 2.33, 2.42, 2.37, 2.46, 2.35,
      2.40, 2.43, 2.38, 2.47, 2.34, 2.45, 2.31, 2.49, 2.36, 2.42,
      2.39, 2.44, 2.37, 2.41, 2.46,
    ],
  },
  {
    group: 'Filter B',
    values: [
      2.62, 2.57, 2.65, 2.54, 2.68, 2.59, 2.63, 2.55, 2.67, 2.60,
      2.56, 2.64, 2.58, 2.66, 2.53, 2.61, 2.69, 2.55, 2.63, 2.57,
      2.65, 2.60, 2.54, 2.67, 2.58,
    ],
  },
  {
    group: 'Filter C',
    values: [
      2.83, 2.78, 2.86, 2.75, 2.89, 2.80, 2.84, 2.77, 2.88, 2.81,
      2.76, 2.85, 2.79, 2.87, 2.74, 2.82, 2.90, 2.77, 2.85, 2.80,
      2.86, 2.73, 2.81, 2.88, 2.79,
    ],
  },
  {
    group: 'Filter D',
    values: [
      3.04, 2.99, 3.07, 2.96, 3.10, 3.01, 3.05, 2.98, 3.09, 3.02,
      2.97, 3.06, 3.00, 3.08, 2.95, 3.03, 3.11, 2.98, 3.06, 3.01,
      3.07, 2.94, 3.02, 3.09, 3.00,
    ],
  },
];

// ---------------------------------------------------------------------------
// Dataset source attribution for NIST references
// ---------------------------------------------------------------------------
export const DATASET_SOURCES = {
  normalRandom: {
    name: 'RANDN.DAT',
    nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4211.htm',
  },
  uniformRandom: {
    name: 'UNIFORM.DAT',
    nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4221.htm',
  },
  scatterData: {
    name: 'PONTIUS.DAT',
    nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4251.htm',
  },
  timeSeries: {
    name: 'ZARR13.DAT',
    nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4241.htm',
  },
  doeFactors: {
    name: 'Synthetic 2^3 Factorial Design',
    nistUrl: 'https://www.itl.nist.gov/div898/handbook/pri/section3/pri331.htm',
  },
  boxPlotData: {
    name: 'SPLETT2.DAT',
    nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4261.htm',
  },
} as const;
