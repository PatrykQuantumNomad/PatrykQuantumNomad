/**
 * GA-C007: Hardcoded secrets
 *
 * Flags string values in the workflow that match known API key and token
 * patterns. Hardcoded secrets in workflow files are visible to anyone with
 * repository read access and persist in git history even after deletion.
 *
 * Skips values that are proper `${{ secrets.* }}` references.
 */

import { isMap, isPair, isScalar, isSeq, type Scalar } from 'yaml';
import { getNodeLine } from '../../parser';
import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types';
import type { LineCounter } from 'yaml';

/** Known API key and token patterns. */
const SECRET_PATTERNS = [
  { re: /ghp_[A-Za-z0-9]{36}/, name: 'GitHub Personal Access Token' },
  { re: /github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}/, name: 'GitHub Fine-Grained PAT' },
  { re: /gho_[A-Za-z0-9]{36}/, name: 'GitHub OAuth Token' },
  { re: /ghs_[A-Za-z0-9]{36}/, name: 'GitHub App Token' },
  { re: /ghr_[A-Za-z0-9]{36}/, name: 'GitHub Refresh Token' },
  { re: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key ID' },
  { re: /sk-[A-Za-z0-9]{48}/, name: 'OpenAI API Key' },
  { re: /xoxb-[0-9]+-[0-9]+-[A-Za-z0-9]+/, name: 'Slack Bot Token' },
  { re: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/, name: 'SendGrid API Key' },
];

/** Skip values that are GitHub secrets references */
const SECRETS_REF_RE = /^\$\{\{\s*secrets\./;

/**
 * Walk all scalar nodes in the YAML AST, invoking callback for each.
 * Traverses Maps, Seqs, and Pairs recursively.
 */
function walkScalars(
  node: any,
  lineCounter: LineCounter,
  callback: (value: string, scalarNode: Scalar, lineCounter: LineCounter) => void,
): void {
  if (isScalar(node)) {
    const val = String(node.value);
    callback(val, node as Scalar, lineCounter);
  } else if (isMap(node)) {
    for (const pair of node.items) {
      if (isPair(pair)) {
        // Don't check keys, only values
        walkScalars(pair.value, lineCounter, callback);
      }
    }
  } else if (isSeq(node)) {
    for (const item of node.items) {
      walkScalars(item, lineCounter, callback);
    }
  } else if (isPair(node)) {
    walkScalars(node.value, lineCounter, callback);
  }
}

export const GAC007: GhaLintRule = {
  id: 'GA-C007',
  title: 'Hardcoded secret',
  severity: 'warning',
  category: 'security',
  explanation:
    'Hardcoded API keys, tokens, and passwords in workflow files are visible to ' +
    'anyone with repository read access and persist in git history. Use ' +
    '`${{ secrets.MY_TOKEN }}` to reference secrets securely from the repository ' +
    'or organization settings.',
  fix: {
    description: 'Use `${{ secrets.MY_TOKEN }}` instead of hardcoded values',
    beforeCode: 'env:\n  TOKEN: ghp_abc123...',
    afterCode: 'env:\n  TOKEN: ${{ secrets.MY_TOKEN }}',
  },

  check(ctx: GhaRuleContext): GhaRuleViolation[] {
    const violations: GhaRuleViolation[] = [];

    walkScalars(ctx.doc.contents, ctx.lineCounter, (value, scalarNode, lc) => {
      // Skip secret references
      if (SECRETS_REF_RE.test(value)) return;

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.re.test(value)) {
          const pos = getNodeLine(scalarNode, lc);
          violations.push({
            ruleId: 'GA-C007',
            line: pos.line,
            column: pos.col,
            message: `Possible hardcoded ${pattern.name} detected. Use \`\${{ secrets.* }}\` instead.`,
          });
          // Only report first matching pattern per scalar
          break;
        }
      }
    });

    return violations;
  },
};
