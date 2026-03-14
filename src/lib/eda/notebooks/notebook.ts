import type { Cell, NotebookV4 } from './types';

/**
 * Assemble cells into a complete nbformat v4.5 notebook.
 * Uses Python 3 kernelspec and language_info defaults.
 */
export function createNotebook(cells: Cell[]): NotebookV4 {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
        language: 'python',
      },
      language_info: {
        name: 'python',
        version: '3.11.0',
        codemirror_mode: { name: 'ipython', version: 3 },
        file_extension: '.py',
        mimetype: 'text/x-python',
        pygments_lexer: 'ipython3',
      },
    },
    cells,
  };
}
