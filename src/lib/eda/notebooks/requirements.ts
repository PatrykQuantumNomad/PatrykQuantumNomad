/**
 * Requirements.txt template for EDA Jupyter notebooks.
 *
 * Uses floor version pins (>=) rather than exact pins (==) because these
 * are educational notebooks, not production applications. Students and
 * practitioners should get the latest compatible versions of these
 * well-established scientific Python libraries.
 */

export const REQUIREMENTS_TXT = [
  'numpy>=2.0.0',
  'scipy>=1.14.0',
  'pandas>=2.2.0',
  'matplotlib>=3.9.0',
  'seaborn>=0.13.0',
].join('\n') + '\n';
