import type { SchemaRuleMetadata } from '../../types';

export const CVS002: SchemaRuleMetadata = {
  id: 'CV-S002',
  title: 'Unknown Top-Level Property',
  severity: 'error',
  category: 'schema',
  explanation:
    'Docker Compose files only allow a fixed set of top-level keys: services, networks, ' +
    'volumes, secrets, configs, name, and version (deprecated). Any other key is rejected ' +
    'by the compose-spec schema. Common typos include "service" instead of "services" and ' +
    '"volume" instead of "volumes". If you need custom metadata, use extension fields ' +
    'prefixed with "x-" (e.g., x-common-env), which the spec explicitly allows and Docker ' +
    'Compose ignores during deployment.',
  fix: {
    description:
      'Use a valid top-level property name or prefix custom properties with x-.',
    beforeCode: 'service:\n  web:\n    image: nginx',
    afterCode: 'services:\n  web:\n    image: nginx',
  },
};
