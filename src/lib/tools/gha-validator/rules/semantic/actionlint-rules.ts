/**
 * Actionlint metadata rules (GA-L001 through GA-L018).
 *
 * These are no-op rules -- their check() methods return empty arrays.
 * They exist to provide enriched documentation (title, explanation, fix)
 * for each actionlint error kind, used by the engine's mapActionlintError()
 * to produce user-friendly diagnostic messages.
 */

import type {
  GhaLintRule,
  GhaRuleContext,
  GhaRuleViolation,
  GhaCategory,
  GhaSeverity,
  GhaRuleFix,
} from '../../types';

// ── Factory ─────────────────────────────────────────────────────────

function actionlintMeta(
  id: string,
  title: string,
  severity: GhaSeverity,
  category: GhaCategory,
  explanation: string,
  fix: GhaRuleFix,
): GhaLintRule {
  return {
    id,
    title,
    severity,
    category,
    explanation,
    fix,
    check(_ctx: GhaRuleContext): GhaRuleViolation[] {
      return [];
    },
  };
}

// ── GA-L001 through GA-L018 ─────────────────────────────────────────

export const GAL001 = actionlintMeta(
  'GA-L001',
  'Syntax error',
  'error',
  'semantic',
  'The workflow file contains a YAML syntax error or uses an unsupported GitHub Actions feature. This prevents the workflow from being parsed and will block execution entirely.',
  {
    description: 'Fix the YAML syntax error or remove the unsupported key.',
    beforeCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n    unknown-key: value',
    afterCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest',
  },
);

export const GAL002 = actionlintMeta(
  'GA-L002',
  'Invalid expression',
  'error',
  'semantic',
  'An expression inside ${{ }} is syntactically invalid or references an unknown context, function, or property. GitHub Actions will fail to evaluate the expression at runtime.',
  {
    description: 'Fix the expression syntax or use a valid context/function.',
    beforeCode: 'run: echo ${{ github.events.inputs.name }}',
    afterCode: 'run: echo ${{ github.event.inputs.name }}',
  },
);

export const GAL003 = actionlintMeta(
  'GA-L003',
  'Invalid job dependency',
  'error',
  'semantic',
  'A job\'s `needs:` field references a job ID that does not exist in this workflow. The workflow will fail to start because GitHub cannot resolve the dependency graph.',
  {
    description: 'Fix the job name in needs: or add the missing job.',
    beforeCode: 'jobs:\n  deploy:\n    needs: [bild]\n    runs-on: ubuntu-latest',
    afterCode: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n  deploy:\n    needs: [build]\n    runs-on: ubuntu-latest',
  },
);

export const GAL004 = actionlintMeta(
  'GA-L004',
  'Invalid matrix config',
  'error',
  'semantic',
  'The strategy.matrix configuration is invalid. This may be due to referencing a matrix key that is not defined, or an incorrect include/exclude entry. The workflow will fail during matrix expansion.',
  {
    description: 'Fix the matrix configuration to use valid keys and values.',
    beforeCode: 'strategy:\n  matrix:\n    os: [ubuntu-latest]\n    include:\n      - os: windows\n        node: 18',
    afterCode: 'strategy:\n  matrix:\n    os: [ubuntu-latest, windows-latest]\n    node: [18]',
  },
);

export const GAL005 = actionlintMeta(
  'GA-L005',
  'Invalid event config',
  'error',
  'semantic',
  'The `on:` trigger configuration references an unknown event type or uses an invalid sub-key for the specified event. GitHub will reject this workflow.',
  {
    description: 'Use a valid event name and correct sub-keys for that event.',
    beforeCode: 'on:\n  push:\n    branch: main',
    afterCode: 'on:\n  push:\n    branches: [main]',
  },
);

export const GAL006 = actionlintMeta(
  'GA-L006',
  'Invalid glob pattern',
  'warning',
  'semantic',
  'A glob pattern in paths:, paths-ignore:, branches:, or branches-ignore: is syntactically invalid. The pattern will not match as expected and may cause workflows to trigger (or not trigger) incorrectly.',
  {
    description: 'Fix the glob pattern to use valid syntax.',
    beforeCode: 'on:\n  push:\n    paths:\n      - src/[invalid',
    afterCode: 'on:\n  push:\n    paths:\n      - src/**/*.ts',
  },
);

export const GAL007 = actionlintMeta(
  'GA-L007',
  'Invalid action reference',
  'error',
  'semantic',
  'The `uses:` value does not match the expected format (owner/repo@ref, docker://image, or ./local-path). GitHub cannot resolve this action reference and the step will fail.',
  {
    description: 'Use the correct format: owner/repo@ref for public actions.',
    beforeCode: 'uses: actions/checkout',
    afterCode: 'uses: actions/checkout@v4',
  },
);

export const GAL008 = actionlintMeta(
  'GA-L008',
  'Invalid runner label',
  'error',
  'semantic',
  'The `runs-on:` value specifies a runner label that is not recognized by GitHub. The job will remain queued indefinitely or fail to start if no matching runner is available.',
  {
    description: 'Use a valid GitHub-hosted runner label.',
    beforeCode: 'runs-on: ubuntu-latest-xl',
    afterCode: 'runs-on: ubuntu-latest',
  },
);

export const GAL009 = actionlintMeta(
  'GA-L009',
  'Invalid shell name',
  'error',
  'semantic',
  'The `shell:` value (in defaults or a step) is not a recognized shell name. Valid shells include bash, pwsh, python, sh, cmd, and powershell.',
  {
    description: 'Use a valid shell name.',
    beforeCode: 'defaults:\n  run:\n    shell: zsh',
    afterCode: 'defaults:\n  run:\n    shell: bash',
  },
);

export const GAL010 = actionlintMeta(
  'GA-L010',
  'Invalid step/job ID',
  'error',
  'semantic',
  'A step or job identifier is invalid -- either it contains characters outside [a-zA-Z0-9_-], starts with a number, or is duplicated within the same scope. GitHub requires unique, valid identifiers.',
  {
    description: 'Use a unique ID with valid characters.',
    beforeCode: 'steps:\n  - id: my step\n    run: echo hi\n  - id: my step\n    run: echo bye',
    afterCode: 'steps:\n  - id: my-step-1\n    run: echo hi\n  - id: my-step-2\n    run: echo bye',
  },
);

export const GAL011 = actionlintMeta(
  'GA-L011',
  'Credentials leak',
  'error',
  'security',
  'Container or service credentials (username/password) are hardcoded in the workflow file. This exposes secrets in version control and CI logs. Use encrypted secrets instead.',
  {
    description: 'Move credentials to GitHub secrets.',
    beforeCode: 'services:\n  db:\n    image: postgres\n    credentials:\n      username: admin\n      password: pass123',
    afterCode: 'services:\n  db:\n    image: postgres\n    credentials:\n      username: ${{ secrets.DB_USER }}\n      password: ${{ secrets.DB_PASS }}',
  },
);

export const GAL012 = actionlintMeta(
  'GA-L012',
  'Invalid env var name',
  'warning',
  'semantic',
  'An environment variable name does not follow the expected naming convention. Environment variable names should consist of uppercase letters, digits, and underscores, and should not start with a digit.',
  {
    description: 'Rename the environment variable to follow naming conventions.',
    beforeCode: 'env:\n  my-var: value\n  123ABC: value',
    afterCode: 'env:\n  MY_VAR: value\n  ABC_123: value',
  },
);

export const GAL013 = actionlintMeta(
  'GA-L013',
  'Permissions error',
  'error',
  'security',
  'The `permissions:` configuration contains an invalid scope or access level. Valid scopes include actions, checks, contents, deployments, id-token, issues, packages, pages, pull-requests, repository-projects, security-events, and statuses. Access levels must be read, write, or none.',
  {
    description: 'Use valid permission scopes and access levels.',
    beforeCode: 'permissions:\n  contens: read\n  issues: execute',
    afterCode: 'permissions:\n  contents: read\n  issues: write',
  },
);

export const GAL014 = actionlintMeta(
  'GA-L014',
  'Workflow call error',
  'error',
  'semantic',
  'A reusable workflow call (workflow_call trigger or uses: with .github/workflows/) has an invalid configuration. This includes incorrect input/output/secret definitions, or type mismatches between caller and callee.',
  {
    description: 'Fix the reusable workflow call configuration.',
    beforeCode: 'jobs:\n  call:\n    uses: ./.github/workflows/deploy.yml\n    with:\n      unknown-input: value',
    afterCode: 'jobs:\n  call:\n    uses: ./.github/workflows/deploy.yml\n    with:\n      environment: production',
  },
);

export const GAL015 = actionlintMeta(
  'GA-L015',
  'Deprecated command',
  'warning',
  'best-practice',
  'The workflow uses a deprecated GitHub Actions command such as `set-output` or `save-state`. These commands were deprecated in October 2022 and will eventually stop working. Migrate to the new file-based approach using GITHUB_OUTPUT and GITHUB_STATE environment files.',
  {
    description: 'Replace deprecated commands with environment file equivalents.',
    beforeCode: 'run: echo "::set-output name=result::$value"',
    afterCode: 'run: echo "result=$value" >> "$GITHUB_OUTPUT"',
  },
);

export const GAL016 = actionlintMeta(
  'GA-L016',
  'If condition error',
  'warning',
  'semantic',
  'An `if:` condition uses an unnecessary `${{ }}` expression wrapper. GitHub Actions automatically evaluates `if:` values as expressions, so the wrapper is redundant and can cause confusion about when expressions are evaluated.',
  {
    description: 'Remove the unnecessary ${{ }} wrapper from the if: condition.',
    beforeCode: 'if: ${{ github.ref == \'refs/heads/main\' }}',
    afterCode: 'if: github.ref == \'refs/heads/main\'',
  },
);

export const GAL017 = actionlintMeta(
  'GA-L017',
  'Shell script error',
  'warning',
  'actionlint',
  'A shell script in a `run:` block contains a potential error detected by shellcheck analysis. This rule requires shellcheck, which is not available in the browser WASM build. Violations are only reported when running actionlint via CLI.',
  {
    description: 'Fix the shell script issue identified by shellcheck.',
    beforeCode: 'run: |\n  echo $UNQUOTED_VAR\n  cd $DIR && rm *',
    afterCode: 'run: |\n  echo "$UNQUOTED_VAR"\n  cd "$DIR" && rm ./*',
  },
);

export const GAL018 = actionlintMeta(
  'GA-L018',
  'Python script error',
  'warning',
  'actionlint',
  'A Python script in a `run:` block (with `shell: python`) contains a potential error detected by pyflakes analysis. This rule requires pyflakes, which is not available in the browser WASM build. Violations are only reported when running actionlint via CLI.',
  {
    description: 'Fix the Python script issue identified by pyflakes.',
    beforeCode: 'run: |\n  import os\n  import sys\n  print(undefined_var)',
    afterCode: 'run: |\n  import os\n  print(os.getcwd())',
  },
);

// ── Lookup map for engine enrichment ────────────────────────────────

const ALL_ACTIONLINT_META_RULES: GhaLintRule[] = [
  GAL001, GAL002, GAL003, GAL004, GAL005, GAL006,
  GAL007, GAL008, GAL009, GAL010, GAL011, GAL012,
  GAL013, GAL014, GAL015, GAL016, GAL017, GAL018,
];

const actionlintMetaMap = new Map<string, string>(
  ALL_ACTIONLINT_META_RULES.map((r) => [r.id, r.title]),
);

/**
 * Look up the human-readable title for an actionlint rule ID.
 * Used by engine.ts mapActionlintError() to enrich raw messages.
 */
export function getActionlintRuleTitle(ruleId: string): string | undefined {
  return actionlintMetaMap.get(ruleId);
}

export { ALL_ACTIONLINT_META_RULES };
