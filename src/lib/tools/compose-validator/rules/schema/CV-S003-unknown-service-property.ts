import type { SchemaRuleMetadata } from '../../types';

export const CVS003: SchemaRuleMetadata = {
  id: 'CV-S003',
  title: 'Unknown Service Property',
  severity: 'error',
  category: 'schema',
  explanation:
    'Service definitions in Docker Compose have a defined set of properties such as image, ' +
    'build, command, ports, volumes, environment, depends_on, healthcheck, and restart. Any ' +
    'property not in the compose-spec service schema is rejected. Common typos include "port" ' +
    'instead of "ports", "volume" instead of "volumes", and "env" instead of "environment". ' +
    'Extension fields starting with "x-" are allowed within services for custom metadata that ' +
    'Docker Compose will pass through to deploy contexts or ignore.',
  fix: {
    description:
      'Use a valid service property name. Check the Docker Compose reference for the full list.',
    beforeCode:
      'services:\n  web:\n    image: nginx\n    port:\n      - "80:80"',
    afterCode:
      'services:\n  web:\n    image: nginx\n    ports:\n      - "80:80"',
  },
};
