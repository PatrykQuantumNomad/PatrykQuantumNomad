import type { Dockerfile } from 'dockerfile-ast';
import type { LintRule, RuleViolation } from '../../types';

export const DL3020: LintRule = {
  id: 'DL3020',
  title: 'Use COPY instead of ADD for files and folders',
  severity: 'error',
  category: 'security',
  explanation:
    'ADD has implicit behaviors that COPY does not: it auto-extracts archives and ' +
    'can fetch remote URLs. This unpredictability is a security concern because ADD ' +
    'from a URL fetches content without checksum verification, and auto-extraction ' +
    'can unpack unexpected content. Use COPY for straightforward file copies and ' +
    'explicit commands (curl/wget + tar) when you need archives or remote resources.',
  fix: {
    description: 'Replace ADD with COPY for local file copies',
    beforeCode: 'ADD ./config /app/config',
    afterCode: 'COPY ./config /app/config',
  },

  check(dockerfile: Dockerfile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const instructions = dockerfile.getInstructions();

    for (const inst of instructions) {
      if (inst.getKeyword() !== 'ADD') continue;

      const args = inst.getArgumentsContent();
      if (!args) continue;

      // ADD is valid for URLs (http/https) -- these need ADD or explicit fetch
      // ADD is valid for tar archives (.tar, .tar.gz, .tgz, .tar.bz2, .tar.xz)
      // which auto-extract on ADD
      const firstArg = args.trim().split(/\s+/)[0];
      if (!firstArg) continue;

      const isUrl = /^https?:\/\//.test(firstArg);
      const isArchive =
        /\.(tar|tar\.gz|tgz|tar\.bz2|tar\.xz|tar\.zst)$/i.test(firstArg);

      // Skip URLs and archives where ADD has valid use cases
      if (isUrl || isArchive) continue;

      const range = inst.getRange();
      violations.push({
        ruleId: this.id,
        line: range.start.line + 1,
        column: 1,
        message:
          'Use COPY instead of ADD for files and folders. ADD has implicit archive extraction behavior.',
      });
    }

    return violations;
  },
};
