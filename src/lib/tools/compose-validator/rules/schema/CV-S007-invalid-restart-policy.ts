import type { SchemaRuleMetadata } from '../../types';

export const CVS007: SchemaRuleMetadata = {
  id: 'CV-S007',
  title: 'Invalid Restart Policy',
  severity: 'error',
  category: 'schema',
  explanation:
    'Docker Compose supports exactly four restart policies: "no" (the default, container does ' +
    'not restart automatically), "always" (always restarts on exit regardless of exit code), ' +
    '"on-failure" (restarts only on non-zero exit code), and "unless-stopped" (restarts on ' +
    'exit unless the container was explicitly stopped). Common mistakes include using "never" ' +
    'instead of "no", "on_failure" with an underscore instead of "on-failure" with a hyphen, ' +
    'or boolean true/false. Always quote "no" in YAML because the bare word no is parsed as ' +
    'boolean false in YAML 1.1.',
  fix: {
    description:
      'Use a valid restart policy: "no", "always", "on-failure", or "unless-stopped".',
    beforeCode: 'restart: never',
    afterCode: 'restart: "no"',
  },
};
