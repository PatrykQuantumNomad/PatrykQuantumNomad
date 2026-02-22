import type { SchemaRuleMetadata } from '../../types';

export const CVS001: SchemaRuleMetadata = {
  id: 'CV-S001',
  title: 'Invalid YAML Syntax',
  severity: 'error',
  category: 'schema',
  explanation:
    'The YAML parser encountered a syntax error that prevents the file from being parsed. ' +
    'Common causes include incorrect indentation (YAML uses spaces, never tabs), unclosed ' +
    'quotes or brackets, duplicate keys at the same nesting level, and missing colons after ' +
    'mapping keys. Docker Compose files use YAML 1.1, which supports merge keys (<<) and ' +
    'anchors (&alias/*alias), but these must follow strict formatting rules. Fix the syntax ' +
    'error at the indicated line before any further validation can proceed.',
  fix: {
    description: 'Fix the YAML syntax error at the indicated line.',
    beforeCode:
      'services:\n' +
      '  web:\n' +
      '    image: nginx\n' +
      '  \tports:\n' +
      '      - "80:80"',
    afterCode:
      'services:\n' +
      '  web:\n' +
      '    image: nginx\n' +
      '    ports:\n' +
      '      - "80:80"',
  },
};
