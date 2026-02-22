import type { SchemaRuleMetadata } from '../../types';

export const CVS008: SchemaRuleMetadata = {
  id: 'CV-S008',
  title: 'Invalid depends_on Condition',
  severity: 'error',
  category: 'schema',
  explanation:
    'The long-form depends_on syntax allows specifying startup conditions for service ' +
    'dependencies. There are exactly three valid conditions: "service_started" (default -- ' +
    'waits for the container to start), "service_healthy" (waits for the dependency\'s ' +
    'healthcheck to pass, which requires a healthcheck definition on the target service), ' +
    'and "service_completed_successfully" (waits for the dependency to exit with code 0, ' +
    'useful for init/migration containers). Common mistakes include abbreviated forms like ' +
    '"healthy" instead of "service_healthy", "started" instead of "service_started", or ' +
    '"completed" instead of "service_completed_successfully".',
  fix: {
    description:
      'Use a valid depends_on condition: service_started, service_healthy, or service_completed_successfully.',
    beforeCode:
      'depends_on:\n  db:\n    condition: healthy',
    afterCode:
      'depends_on:\n  db:\n    condition: service_healthy',
  },
};
