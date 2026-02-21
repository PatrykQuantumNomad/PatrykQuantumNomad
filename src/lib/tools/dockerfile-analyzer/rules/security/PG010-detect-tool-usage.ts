import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

/**
 * Network and download tool executables to detect in RUN commands.
 * Unlike PG009 which maps package names for installation detection,
 * this maps binary/command names for usage detection.
 */
const NETWORK_TOOLS: Record<string, string> = {
  curl: 'curl',
  wget: 'wget',
  nc: 'netcat (nc)',
  netcat: 'netcat',
  ncat: 'ncat',
  nmap: 'nmap',
  telnet: 'telnet',
  ftp: 'ftp',
  lftp: 'lftp',
  ssh: 'ssh',
  scp: 'scp',
  sftp: 'sftp',
  socat: 'socat',
  tcpdump: 'tcpdump',
};

const toolNames = Object.keys(NETWORK_TOOLS);

/** Matches any flagged tool name as a whole word. */
const toolPatternGlobal = new RegExp(
  String.raw`\b(${toolNames.join('|')})\b`,
  'g',
);

/** Matches package-manager removal commands so we can skip false positives. */
const REMOVAL_PATTERN =
  /\b(?:apt-get\s+(?:purge|remove|autoremove)|apt\s+(?:purge|remove|autoremove)|apk\s+del|yum\s+(?:remove|erase)|dnf\s+(?:remove|erase))\b/;

export const PG010: LintRule = {
  id: 'PG010',
  title: 'Avoid using network tools in the final build stage',
  severity: 'info',
  category: 'security',
  explanation:
    'Network utilities like curl, wget, and netcat are used in RUN commands of the ' +
    'final build stage. Even when these tools are not explicitly installed (they may come ' +
    'pre-installed in the base image), their presence expands the attack surface of the ' +
    'production container. The CIS Docker Benchmark (Section 4.3) advises against keeping ' +
    'unnecessary packages in containers. Real-world campaigns such as Commando Cat (2024) ' +
    'exploited pre-existing curl and netcat inside containers for payload download and ' +
    'reverse shells. Use a multi-stage build to confine network tool usage to a builder ' +
    'stage, then COPY only the artifacts into a minimal final image.',
  fix: {
    description:
      'Move network tool usage to a builder stage and COPY artifacts into the final image',
    beforeCode:
      'FROM node:22-bookworm\n' +
      'RUN curl -fsSL https://bun.sh/install | bash\n' +
      'CMD ["node", "server.js"]',
    afterCode:
      'FROM node:22-bookworm AS builder\n' +
      'RUN curl -fsSL -o /tmp/install.sh https://bun.sh/install \\\n' +
      '    && bash /tmp/install.sh\n\n' +
      'FROM node:22-slim\n' +
      'COPY --from=builder /root/.bun /root/.bun\n' +
      'CMD ["node", "server.js"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();
    const instructions = dockerfile.getInstructions();

    // Determine the start of the final build stage
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

      // Split into sub-commands on shell operators
      const commands = normalized.split(/&&|\|\||;/);

      const matched: string[] = [];

      for (const cmd of commands) {
        const trimmed = cmd.trim();

        // Skip removal commands to avoid false positives
        if (REMOVAL_PATTERN.test(trimmed)) continue;

        // Find all tool name matches in this sub-command
        for (const m of trimmed.matchAll(toolPatternGlobal)) {
          matched.push(NETWORK_TOOLS[m[1]]);
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
            `Network tool${unique.length > 1 ? 's' : ''} used in final stage: ${unique.join(', ')}. ` +
            'Consider a multi-stage build to avoid shipping these tools in the production image.',
        });
      }
    }

    return violations;
  },
};
