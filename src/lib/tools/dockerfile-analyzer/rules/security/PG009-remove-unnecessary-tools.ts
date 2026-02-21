import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

/**
 * Network and download tools that expand the attack surface of a production
 * container. These are commonly abused for payload download, reverse shells,
 * C2 communication, and lateral movement (CIS Docker Benchmark 4.3, OWASP
 * Docker Security Cheat Sheet).
 *
 * Each key is the package name as it appears in a package-manager install
 * command; the value is a human-readable label for the violation message.
 */
const FLAGGED_PACKAGES: Record<string, string> = {
  curl: 'curl',
  wget: 'wget',
  netcat: 'netcat',
  'netcat-openbsd': 'netcat',
  'netcat-traditional': 'netcat',
  ncat: 'ncat',
  nmap: 'nmap',
  telnet: 'telnet',
  ftp: 'ftp',
  lftp: 'lftp',
  'openssh-client': 'ssh client',
  'ssh-client': 'ssh client',
  socat: 'socat',
  tcpdump: 'tcpdump',
};

/** Matches a package-manager install command prefix. */
const INSTALL_PATTERN =
  /\b(?:apt-get\s+install|apt\s+install|apk\s+add|yum\s+install|dnf\s+install)\b/;

export const PG009: LintRule = {
  id: 'PG009',
  title: 'Remove unnecessary network tools from production images',
  severity: 'warning',
  category: 'security',
  explanation:
    'Network utilities like curl, wget, and netcat expand the attack surface of a ' +
    'production container. If an attacker gains code execution, these tools allow ' +
    'downloading additional payloads, establishing reverse shells, or communicating ' +
    'with command-and-control servers. The CIS Docker Benchmark (Section 4.3) states: ' +
    '"Do not install unnecessary packages in containers." Real-world campaigns such as ' +
    'Commando Cat (2024) exploited curl and netcat inside containers for exactly this ' +
    'purpose. Use multi-stage builds to keep these tools in the build stage only, or ' +
    'remove them after use with `apt-get purge` / `apk del`.',
  fix: {
    description:
      'Use a multi-stage build so network tools stay in the builder stage, or remove them after use',
    beforeCode:
      'FROM ubuntu:22.04\n' +
      'RUN apt-get update && apt-get install -y curl \\\n' +
      '    && curl -o app.tar.gz https://example.com/app.tar.gz\n' +
      'CMD ["./app"]',
    afterCode:
      'FROM ubuntu:22.04 AS builder\n' +
      'RUN apt-get update && apt-get install -y curl \\\n' +
      '    && curl -o app.tar.gz https://example.com/app.tar.gz\n\n' +
      'FROM ubuntu:22.04\n' +
      'COPY --from=builder /app.tar.gz /app.tar.gz\n' +
      'CMD ["./app"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();
    const instructions = dockerfile.getInstructions();

    // Determine the start of the final build stage so we only flag tools
    // installed in the production image, not in intermediate builder stages.
    let finalStageStart = 0;
    if (froms.length > 1) {
      const lastFrom = froms.at(-1);
      if (lastFrom) {
        finalStageStart = lastFrom.getRange().start.line;
      }
    }

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;

      // Only inspect instructions in the final stage
      if (inst.getRange().start.line < finalStageStart) continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // Collapse backslash-newline continuations
      const normalized = args.replace(/\\\n/g, ' ');

      // Check each chained command independently
      const commands = normalized.split(/&&|\|\||;/);
      const matched: string[] = [];

      for (const cmd of commands) {
        const trimmed = cmd.trim();

        if (!INSTALL_PATTERN.test(trimmed)) continue;

        // Tokenize the install command to find package names
        const tokens = trimmed.split(/\s+/);

        for (const token of tokens) {
          // Skip flags (e.g., -y, --no-install-recommends)
          if (token.startsWith('-')) continue;
          // Strip version pins (e.g., curl=7.88.1-10)
          const pkg = token.split('=')[0];
          if (FLAGGED_PACKAGES[pkg]) {
            matched.push(FLAGGED_PACKAGES[pkg]);
          }
        }
      }

      if (matched.length > 0) {
        const range = inst.getRange();
        const unique = [...new Set(matched)];
        violations.push({
          ruleId: this.id,
          line: range.start.line + 1,
          column: 1,
          message:
            `Unnecessary network tool${unique.length > 1 ? 's' : ''} installed in production image: ${unique.join(', ')}. ` +
            'Use a multi-stage build or remove after use.',
        });
      }
    }

    return violations;
  },
};
