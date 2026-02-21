import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

const SENSITIVE_PATTERNS = [
  /(?:^|\/)\.env(?:\.|$)/i, // .env, .env.local, .env.production
  /(?:^|\/)id_rsa(?:\.pub)?$/i, // SSH RSA keys
  /(?:^|\/)id_ed25519(?:\.pub)?$/i, // SSH Ed25519 keys
  /(?:^|\/)id_dsa(?:\.pub)?$/i, // SSH DSA keys
  /(?:^|\/)id_ecdsa(?:\.pub)?$/i, // SSH ECDSA keys
  /\.pem$/i, // PEM certificates/keys
  /\.key$/i, // Private keys
  /\.p12$/i, // PKCS12 keystores
  /\.pfx$/i, // PFX certificates
  /(?:^|\/)credentials$/i, // Generic credentials file
  /(?:^|\/)\.aws\//i, // AWS config directory
  /(?:^|\/)\.ssh\//i, // SSH config directory
  /(?:^|\/)\.gnupg\//i, // GPG directory
  /(?:^|\/)\.npmrc$/i, // npm auth tokens
  /(?:^|\/)\.pypirc$/i, // PyPI auth tokens
];

export const PG003: LintRule = {
  id: 'PG003',
  title: 'Avoid copying sensitive files into the image',
  severity: 'warning',
  category: 'security',
  explanation:
    'Copying sensitive files like private keys, .env files, or credentials into a Docker ' +
    'image embeds them in the layer history. Even if you delete them in a later step, ' +
    'they can still be extracted from earlier layers. Anyone with access to the image ' +
    'can pull out your secrets. Use .dockerignore to exclude sensitive files, mount ' +
    'secrets at runtime, or use Docker build secrets (--mount=type=secret).',
  fix: {
    description:
      'Add sensitive files to .dockerignore and use build secrets or runtime mounts',
    beforeCode: 'COPY .env /app/.env\nCOPY id_rsa /root/.ssh/id_rsa',
    afterCode:
      '# Add to .dockerignore: .env, id_rsa\n# Use build secret instead:\nRUN --mount=type=secret,id=env,target=/app/.env cat /app/.env',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      const keyword = inst.getKeyword();
      if (keyword !== 'COPY' && keyword !== 'ADD') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // Split arguments -- last one is destination, rest are sources
      // Handle --from=... and --chown=... flags
      const tokens = args
        .replaceAll('\\\n', ' ')
        .split(/\s+/)
        .filter((t) => t.length > 0 && !t.startsWith('--'));

      // Need at least source + destination
      if (tokens.length < 2) continue;

      // All tokens except the last are source paths
      const sources = tokens.slice(0, -1);

      for (const source of sources) {
        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.test(source)) {
            const range = inst.getRange();
            violations.push({
              ruleId: this.id,
              line: range.start.line + 1,
              column: 1,
              message: `Sensitive file '${source}' copied into image. Use .dockerignore or build secrets.`,
            });
            break; // One violation per source file
          }
        }
      }
    }

    return violations;
  },
};
