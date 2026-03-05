# GitHub Actions Workflow Security Analysis

## File Analyzed
`test-insecure.yml`

## Executive Summary
This workflow contains **7 critical security vulnerabilities** that pose significant risks to code integrity, secret exposure, and infrastructure security. Multiple issues require immediate remediation.

---

## Critical Vulnerabilities

### 1. **Dangerous Event Trigger: `pull_request_target`**
**Severity:** CRITICAL
**Line:** 2
**Issue:** The workflow uses `pull_request_target`, which runs untrusted code from pull requests with write access to the repository. This is a known attack vector for malicious actors.

**Risk:**
- Untrusted PRs can execute arbitrary code with repository secrets and permissions
- Can compromise the entire repository and CI/CD pipeline
- Attackers can exfiltrate sensitive data or inject malicious code

**Recommendation:**
- Use `pull_request` event instead for most workflows
- If `pull_request_target` is needed, restrict checkout to the PR head ref and use strict permission boundaries
- Never grant write permissions when using this event
- Explicitly set `contents: read` and `pull-requests: read` only

**Better Alternative:**
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
```

---

### 2. **Hardcoded GitHub Token in Script**
**Severity:** CRITICAL
**Line:** 21
**Issue:** A GitHub Personal Access Token (ghp_*) is hardcoded directly in the workflow step.

**Risk:**
- Token is exposed in workflow logs and version history
- Anyone with access to the repository can see the token
- Can be used to bypass authentication and access GitHub APIs
- If token has high permissions, it can modify code, create releases, or access private repositories

**Recommendation:**
- Remove the hardcoded token immediately
- Use GitHub's GITHUB_TOKEN secret instead: `${{ secrets.GITHUB_TOKEN }}`
- If a PAT is needed, store it as a repository secret and reference it as `${{ secrets.YOUR_SECRET_NAME }}`
- Rotate the exposed token immediately

**Corrected Example:**
```yaml
- name: Deploy
  run: |
    curl -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" https://api.github.com/repos
```

---

### 3. **Exposed Webhook URL in Environment Variable**
**Severity:** CRITICAL
**Line:** 23
**Issue:** A Slack webhook URL is exposed in plaintext in the environment variables section.

**Risk:**
- Webhook URL is visible in logs and workflow runs
- Anyone with the URL can send messages to the Slack channel
- Can be used for spam, social engineering, or misinformation
- URL remains in git history

**Recommendation:**
- Store the webhook URL as a repository secret
- Reference it using `${{ secrets.SLACK_WEBHOOK }}`
- Rotate the webhook URL immediately
- Review Slack webhook logs for unauthorized access

**Corrected Example:**
```yaml
env:
  SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
```

---

### 4. **Unsafe Third-Party Action with `@main` Reference**
**Severity:** HIGH
**Line:** 11
**Issue:** The workflow uses `some-org/risky-action@main`, which pins to the main branch instead of a specific release tag.

**Risk:**
- The action code can change at any time without control
- Malicious actor could modify the action or the organization could be compromised
- No way to audit what code is being executed
- Supply chain attack vector

**Recommendation:**
- Always pin to specific version tags: `some-org/risky-action@v1.2.3`
- Use commit SHAs for maximum security: `some-org/risky-action@abc123def456`
- Review action code before use
- Consider using GitHub's official actions or well-audited community actions
- Use Dependabot to keep pinned versions updated

**Corrected Example:**
```yaml
- uses: some-org/risky-action@v1.2.3  # Use a specific tagged release
```

---

### 5. **Unvalidated User Input in Script (Command Injection Risk)**
**Severity:** HIGH
**Lines:** 13, 16
**Issue:** User-controlled input from GitHub events is directly interpolated into shell commands without validation or escaping.

**Risk:**
- `github.event.issue.title` and `github.event.pull_request.body` come from untrusted sources
- Attackers can inject shell commands through PR titles or body content
- Example: A PR title like `"; rm -rf /" would execute destructive commands`
- Can lead to data exfiltration, code injection, or system compromise

**Recommendation:**
- Avoid passing untrusted input directly to shell commands
- Use environment variables instead of direct interpolation
- Sanitize or validate user input before use
- Use tools like `jq` for safe JSON parsing
- Consider using actions designed for safe input handling

**Safer Approach:**
```yaml
- name: Process PR information
  env:
    PR_TITLE: ${{ github.event.issue.title }}
    PR_BODY: ${{ github.event.pull_request.body }}
  run: |
    echo "Processing PR with title: $PR_TITLE"
    # Use single quotes to prevent expansion
    echo 'PR body:' "$PR_BODY"
```

---

### 6. **Excessive Permissions: `write-all`**
**Severity:** HIGH
**Line:** 28
**Issue:** The `deploy` job grants `permissions: write-all`, giving unrestricted write access to all GitHub scopes.

**Risk:**
- Violates principle of least privilege
- If the job is compromised, attacker has maximum permissions
- Can modify code, create releases, delete branches, access secrets
- No containment if the self-hosted runner is compromised

**Recommendation:**
- Use principle of least privilege: only request necessary permissions
- Explicitly define required permissions
- Document why each permission is needed

**Corrected Example:**
```yaml
permissions:
  contents: read
  deployments: write
```

---

### 7. **Self-Hosted Runner Without Job Isolation**
**Severity:** HIGH
**Line:** 26
**Issue:** The `deploy` job runs on a self-hosted runner without proper isolation or dependency checks.

**Risk:**
- Self-hosted runners are trust boundaries; they run as their host user
- No automatic cleanup between jobs like GitHub-hosted runners
- If the runner is compromised, attacker has full system access
- No guarantee of clean environment for each job
- Combined with `write-all` permissions, this is especially dangerous

**Recommendation:**
- Use GitHub-hosted runners when possible (e.g., `ubuntu-latest`)
- If self-hosted runners are required:
  - Run them in isolated containers or VMs
  - Implement strict network segmentation
  - Use least-privilege service accounts
  - Monitor for suspicious activity
  - Rotate credentials regularly
  - Explicitly define minimal required permissions (not `write-all`)
  - Clean up the workspace before each job
  - Use `uses: actions/checkout@v3` with appropriate settings

**Safer Configuration:**
```yaml
deploy:
  runs-on: ubuntu-latest  # Use GitHub-hosted runner if possible
  needs: build
  permissions:
    contents: read
    deployments: write
  steps:
    - uses: actions/checkout@v3
    - run: deploy.sh
```

---

### 8. **Deployment Script Without Validation**
**Severity:** MEDIUM
**Line:** 31
**Issue:** The workflow directly executes `deploy.sh` without:
- Verifying the script exists and has correct permissions
- Checking for script integrity
- Validating the deployment target
- Error handling or rollback mechanisms

**Risk:**
- Script could be missing or corrupted
- No validation of deployment environment
- Silent failures could go unnoticed
- No audit trail of what the script does

**Recommendation:**
- Add error handling and validation:
  ```yaml
  - name: Deploy
    run: |
      if [[ ! -f deploy.sh ]]; then
        echo "Error: deploy.sh not found"
        exit 1
      fi
      chmod +x deploy.sh
      ./deploy.sh
  ```
- Use script signing or checksums to verify integrity
- Log deployment actions
- Implement pre-deployment checks
- Add post-deployment validation

---

## Summary Table

| Line | Severity | Issue | Type |
|------|----------|-------|------|
| 2 | CRITICAL | `pull_request_target` event trigger | Event Configuration |
| 21 | CRITICAL | Hardcoded GitHub token | Secret Exposure |
| 23 | CRITICAL | Exposed Slack webhook URL | Secret Exposure |
| 11 | HIGH | `@main` action reference (unpinned) | Supply Chain |
| 13, 16 | HIGH | Unvalidated user input in commands | Command Injection |
| 28 | HIGH | `permissions: write-all` | Privilege Escalation |
| 26 | HIGH | Self-hosted runner without isolation | Infrastructure |
| 31 | MEDIUM | Unvalidated deployment script execution | Deployment |

---

## Remediation Priority

1. **Immediate (Within 24 hours):**
   - Remove hardcoded GitHub token (line 21)
   - Remove exposed Slack webhook (line 23)
   - Rotate both compromised credentials
   - Change `pull_request_target` to `pull_request`

2. **Short-term (Within 1 week):**
   - Pin action versions to specific tags
   - Implement least-privilege permissions
   - Add input validation for user-controlled data
   - Replace self-hosted runner or add isolation

3. **Long-term (Ongoing):**
   - Implement secrets scanning in CI/CD
   - Add security policy checks to pull request templates
   - Conduct security audit of all workflows
   - Implement secret rotation policies
   - Use GitHub advanced security features (SAST, dependency scanning)

---

## Security Best Practices for GitHub Actions

1. **Always use GitHub-hosted runners** when possible
2. **Pin action versions** to specific release tags or commit SHAs
3. **Use `GITHUB_TOKEN` secrets** instead of PATs when possible
4. **Implement least-privilege permissions** — never use `write-all`
5. **Avoid `pull_request_target`** unless absolutely necessary with strict controls
6. **Validate and escape user input** before using in commands
7. **Store sensitive data as secrets**, never hardcode
8. **Audit workflow permissions** regularly
9. **Use branch protection rules** to require status checks
10. **Monitor and log all workflow executions**

