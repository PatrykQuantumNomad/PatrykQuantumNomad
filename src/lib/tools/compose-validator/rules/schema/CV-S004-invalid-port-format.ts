import type { SchemaRuleMetadata } from '../../types';

export const CVS004: SchemaRuleMetadata = {
  id: 'CV-S004',
  title: 'Invalid Port Format',
  severity: 'error',
  category: 'schema',
  explanation:
    'Docker Compose supports two port mapping syntaxes. Short syntax uses strings like ' +
    '"HOST:CONTAINER", "CONTAINER", or "HOST:CONTAINER/PROTOCOL" (e.g., "8080:80/tcp"). ' +
    'Long syntax uses an object with target (required), published, protocol, and host_ip. ' +
    'A critical YAML pitfall: unquoted port mappings like 80:80 are interpreted as a base-60 ' +
    'integer (4880) by the YAML 1.1 parser, not as a string. Always quote port mappings in ' +
    'your Compose file to avoid silent misinterpretation.',
  fix: {
    description:
      'Quote port mappings as strings and use valid HOST:CONTAINER or long syntax format.',
    beforeCode: 'ports:\n  - 8080:80',
    afterCode: 'ports:\n  - "8080:80"',
  },
};
