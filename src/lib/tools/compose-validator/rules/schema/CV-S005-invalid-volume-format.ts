import type { SchemaRuleMetadata } from '../../types';

export const CVS005: SchemaRuleMetadata = {
  id: 'CV-S005',
  title: 'Invalid Volume Format',
  severity: 'error',
  category: 'schema',
  explanation:
    'Docker Compose volumes accept short syntax strings ("SOURCE:TARGET" or ' +
    '"SOURCE:TARGET:MODE" where mode is ro, rw, z, or Z), named volumes ' +
    '("volume_name:/container/path"), and long syntax objects with type (bind, volume, ' +
    'tmpfs, npipe, cluster), source, target, and optional read_only, bind, volume, or tmpfs ' +
    'sub-options. A common mistake is specifying only the source path without a target ' +
    '(e.g., "./data" instead of "./data:/app/data"), which does not create a valid mount. ' +
    'Avoid backslashes in paths even on Windows; Compose normalizes forward slashes.',
  fix: {
    description:
      'Use valid SOURCE:TARGET[:MODE] short syntax or long syntax with type, source, and target.',
    beforeCode: 'volumes:\n  - ./data',
    afterCode: 'volumes:\n  - ./data:/app/data',
  },
};
