import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

const SECRET_NAME_PATTERN =
  /(?:api[_-]?key|secret|password|passwd|token|auth|credentials?|private[_-]?key)/i;

const SECRET_VALUE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/, // OpenAI-style keys
  /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access tokens
  /gho_[a-zA-Z0-9]{36}/, // GitHub OAuth tokens
  /ghs_[a-zA-Z0-9]{36}/, // GitHub server tokens
  /postgres:\/\/[^:]+:[^@]+@/, // PostgreSQL connection strings with password
  /mysql:\/\/[^:]+:[^@]+@/, // MySQL connection strings with password
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, // MongoDB connection strings with password
  /AKIA[0-9A-Z]{16}/, // AWS access key IDs
];

export const PG001: LintRule = {
  id: 'PG001',
  title: 'Secrets detected in ENV or ARG',
  severity: 'error',
  category: 'security',
  explanation:
    'Hardcoded secrets in ENV or ARG instructions are baked into the image layers and ' +
    'visible to anyone who can pull the image. Even if you delete them in a later layer, ' +
    'they remain in the build history. In production, this is a critical security risk -- ' +
    'leaked API keys, database passwords, and tokens can be extracted with a simple ' +
    '`docker history` or `docker inspect`. Use build-time secrets (--mount=type=secret) ' +
    'or runtime environment variables injected by the orchestrator.',
  fix: {
    description:
      'Remove hardcoded secrets and use Docker build secrets or runtime injection',
    beforeCode: 'ENV API_KEY=sk-1234567890abcdef',
    afterCode:
      '# Pass at runtime:\n# docker run -e API_KEY=$API_KEY myimage\n# Or use build secrets:\nRUN --mount=type=secret,id=api_key cat /run/secrets/api_key',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Check ENV instructions
    const envs = dockerfile.getENVs();
    for (const env of envs) {
      const properties = env.getProperties();
      for (const prop of properties) {
        const name = prop.getName();
        const value = prop.getValue();

        const nameMatch = SECRET_NAME_PATTERN.test(name);
        const valueMatch =
          value != null &&
          SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));

        if (nameMatch || valueMatch) {
          const range = prop.getNameRange();
          violations.push({
            ruleId: this.id,
            line: range.start.line + 1,
            column: range.start.character + 1,
            message: `Secret detected in ENV: '${name}'. Do not hardcode secrets in Dockerfiles.`,
          });
        }
      }
    }

    // Check ARG instructions
    const args = dockerfile.getARGs();
    for (const arg of args) {
      const prop = arg.getProperty();
      if (!prop) continue;

      const name = prop.getName();
      const value = prop.getValue();

      const nameMatch = SECRET_NAME_PATTERN.test(name);
      const valueMatch =
        value != null &&
        SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));

      if (nameMatch || valueMatch) {
        const range = prop.getNameRange();
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: range.start.character + 1,
          message: `Secret detected in ARG: '${name}'. Do not hardcode secrets in Dockerfiles.`,
        });
      }
    }

    return violations;
  },
};
