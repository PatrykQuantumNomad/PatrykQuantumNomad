import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

/** Basenames of well-known lightweight init processes for containers. */
const KNOWN_INIT_BINARIES = ['tini', 'dumb-init', 'docker-init'];

/**
 * Extract the first element from a JSON-form argument string.
 * e.g. '["/usr/bin/tini", "--"]' → "/usr/bin/tini"
 */
function firstJsonElement(args: string): string | null {
  const trimmed = args.trim();
  if (!trimmed.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed[0];
    }
  } catch {
    // JSON parse can fail on variable references like ["${CMD}"]
  }
  return null;
}

/** Check whether a path or command name matches a known init binary. */
function isInitBinary(cmd: string): boolean {
  // Extract basename from path (e.g. "/usr/bin/tini" → "tini")
  const basename = cmd.split('/').pop() ?? '';
  return KNOWN_INIT_BINARIES.some((init) => basename === init);
}

export const PG008: LintRule = {
  id: 'PG008',
  title: 'Use an init process (tini) for proper signal handling and zombie reaping',
  severity: 'info',
  category: 'reliability',
  explanation:
    'When your application runs as PID 1 inside a container, the kernel treats it differently: ' +
    'SIGTERM has no default handler and is silently ignored. This means `docker stop` and ' +
    'Kubernetes graceful shutdown signals do nothing. The container just hangs for the full ' +
    'terminationGracePeriodSeconds (default 30s) until it is forcefully killed with SIGKILL. ' +
    'On top of that, PID 1 is responsible for reaping zombie child processes by calling wait(). ' +
    'Most applications never do this, so orphaned children accumulate as zombies until the PID ' +
    'table is exhausted (~32,768 entries), at which point fork() fails and the container becomes ' +
    'unresponsive. A lightweight init process like tini (~25 KB) or dumb-init sits as PID 1, ' +
    'forwards signals to your application, and reaps zombies automatically. Docker provides ' +
    'a --init flag for local development, but Kubernetes has no equivalent runtime flag, so the ' +
    'init binary must be installed in the image.',
  fix: {
    description:
      'Install tini and use it as the ENTRYPOINT. Your application command moves to CMD.',
    beforeCode: 'CMD ["node", "server.js"]',
    afterCode:
      'RUN apt-get update && apt-get install -y --no-install-recommends tini && \\\n' +
      '    rm -rf /var/lib/apt/lists/*\n' +
      'ENTRYPOINT ["/usr/bin/tini", "--"]\n' +
      'CMD ["node", "server.js"]',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const froms = dockerfile.getFROMs();

    if (froms.length === 0) return violations;

    // Scope to the final build stage
    const lastFrom = froms.at(-1);
    if (!lastFrom) return violations;
    const lastFromLine = lastFrom.getRange().start.line;

    // Collect ENTRYPOINT and CMD in the final stage
    const entrypoints = dockerfile
      .getENTRYPOINTs()
      .filter((ep) => ep.getRange().start.line > lastFromLine);

    const cmds = dockerfile
      .getCMDs()
      .filter((c) => c.getRange().start.line > lastFromLine);

    // Nothing to run → no violation (base image or build-only stage)
    if (entrypoints.length === 0 && cmds.length === 0) return violations;

    // Check if any ENTRYPOINT wraps a known init binary
    for (const ep of entrypoints) {
      const args = ep.getArgumentsContent();
      if (!args) continue;

      const trimmed = args.trim();

      // JSON form: ENTRYPOINT ["/usr/bin/tini", "--"]
      if (trimmed.startsWith('[')) {
        const first = firstJsonElement(trimmed);
        if (first && isInitBinary(first)) return violations; // init present
      } else {
        // Shell form: ENTRYPOINT tini -- node app.js
        const firstToken = trimmed.split(/\s+/)[0];
        if (firstToken && isInitBinary(firstToken)) return violations;
      }
    }

    // Check RUN instructions for init binary installation patterns
    const instructions = dockerfile.getInstructions();
    for (const inst of instructions) {
      if (inst.getKeyword() !== 'RUN') continue;
      if (inst.getRange().start.line <= lastFromLine) continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      const normalized = args.replace(/\\\n/g, ' ');

      // Detect package manager installs of tini or dumb-init
      if (/\b(?:apt-get|apk|yum|dnf)\b.*\b(?:tini|dumb-init)\b/.test(normalized)) {
        return violations; // init is being installed
      }

      // Detect pip install of dumb-init
      if (/\bpip\b.*\binstall\b.*\bdumb-init\b/.test(normalized)) {
        return violations;
      }

      // Detect COPY of tini binary (common multi-stage pattern)
      // This is handled below via COPY check
    }

    // Check COPY instructions that bring in tini from a builder stage
    for (const inst of instructions) {
      if (inst.getKeyword() !== 'COPY') continue;
      if (inst.getRange().start.line <= lastFromLine) continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // Match patterns like: COPY --from=builder /usr/bin/tini /usr/bin/tini
      if (/\btini\b/.test(args) || /\bdumb-init\b/.test(args)) {
        return violations; // init binary is being copied in
      }
    }

    // No init process detected, flag on the last ENTRYPOINT or CMD
    const flagTarget =
      entrypoints.length > 0
        ? entrypoints[entrypoints.length - 1]
        : cmds[cmds.length - 1];

    const range = flagTarget.getRange();
    violations.push({
      ruleId: this.id,
      line: range.start.line + 1,
      column: 1,
      message:
        'No init process (tini, dumb-init) detected. Without an init process, PID 1 ignores ' +
        'SIGTERM and cannot reap zombie child processes. Add tini as your ENTRYPOINT.',
    });

    return violations;
  },
};
