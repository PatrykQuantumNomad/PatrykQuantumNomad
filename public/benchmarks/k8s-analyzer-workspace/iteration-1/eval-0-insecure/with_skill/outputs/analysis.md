# Kubernetes Manifest Analysis Results

**Score:** 54/100 (Grade: F)
**Resources:** 3 (Deployment, ClusterRole, ClusterRoleBinding)

## Category Breakdown

| Category       | Score   | Weight |
|----------------|---------|--------|
| Security       | 0/100   | 35%    |
| Reliability    | 76/100  | 20%    |
| Best Practice  | 71/100  | 20%    |
| Schema         | 100/100 | 15%    |
| Cross-Resource | 100/100 | 10%    |

## PSS Compliance

- **Baseline violations:** 8 (KA-C001, KA-C006, KA-C008, KA-C009, KA-C013, KA-C015, KA-A001, KA-A002)
- **Restricted violations:** 4 (KA-C002, KA-C004, KA-C005, KA-C011)
- **Compliance:** Non-compliant

## Issues Found (28 issues: 6 errors, 15 warnings, 7 info)

### Errors (Critical - Fix Immediately)

#### Deployment: web-app

- **web-app [KA-C006]: Host PID namespace shared** (Security - Baseline)
  Line 15: `hostPID: true` allows the container to see and signal all host processes.
  **Fix:** Remove `hostPID: true` from the pod spec.

- **web-app [KA-C001]: Container runs as privileged** (Security - Baseline)
  Line 21: `securityContext.privileged: true` disables all isolation and grants full host access.
  **Fix:** Remove `privileged: true` and use specific capabilities via `securityContext.capabilities.add` if needed.

- **web-app [KA-C005]: Running with UID 0** (Security - Restricted)
  Line 22: `securityContext.runAsUser: 0` explicitly requests root UID.
  **Fix:** Set `runAsUser` to a non-zero UID (e.g., `1000`).

- **web-app [KA-C015]: Docker socket mounted** (Security)
  Lines 32-37: Mounting `/var/run/docker.sock` grants root-level control over the host Docker daemon.
  **Fix:** Remove the Docker socket mount. Use a Docker API proxy if needed for non-privileged access.

#### ClusterRole: admin-role

- **admin-role [KA-A001]: Wildcard permissions in Role/ClusterRole** (Security)
  Lines 44-46: Using `*` in apiGroups, resources, and verbs grants unrestricted access to all resources.
  **Fix:** Replace wildcards with specific resources and verbs required by the workload.

#### ClusterRoleBinding: admin-binding

- **admin-binding [KA-A002]: cluster-admin RoleBinding** (Security)
  Line 58: Binding to `cluster-admin` grants full control over every resource in every namespace.
  **Fix:** Create a custom ClusterRole with only the specific permissions needed and bind that instead.

### Warnings (High Priority - Fix Soon)

#### Deployment: web-app

- **web-app [KA-C008]: Host network enabled** (Security - Baseline)
  Line 16: `hostNetwork: true` bypasses network isolation and shares the host network stack.
  **Fix:** Remove `hostNetwork: true` and use Services/Ingress for traffic exposure.

- **web-app [KA-C018]: Secrets in environment variables** (Security)
  Lines 27-30: Inline secrets in environment variables are exposed in `kubectl describe`, process listings, and logs.
  **Fix:** Use `valueFrom.secretKeyRef` to reference Secret objects, or mount Secrets as volumes.

- **web-app [KA-C004]: Missing runAsNonRoot** (Security - Restricted)
  No `runAsNonRoot: true` set at pod or container level. Without this, containers default to running as the image-specified user (often root).
  **Fix:** Add `runAsNonRoot: true` to pod or container securityContext.

- **web-app [KA-C011]: Capabilities not dropped** (Security - Restricted)
  Container lacks `capabilities.drop: ["ALL"]`. Best practice is to drop all capabilities and selectively add back only those needed.
  **Fix:** Add `capabilities: { drop: ["ALL"] }` at the container level and selectively add back required capabilities.

- **web-app [KA-C012]: Filesystem not read-only** (Security)
  `readOnlyRootFilesystem` is not set to `true`. A writable filesystem allows attackers to modify binaries and plant malware.
  **Fix:** Set `readOnlyRootFilesystem: true` and use `emptyDir` volumes for paths that need to be writable.

- **web-app [KA-C013]: Missing seccomp profile** (Security - Baseline)
  No seccomp profile set at pod or container level. Without seccomp, containers can use all 300+ Linux syscalls, expanding attack surface.
  **Fix:** Set `seccompProfile: { type: RuntimeDefault }` at the pod spec level.

- **web-app [KA-C016]: ServiceAccount token auto-mounted** (Security)
  `automountServiceAccountToken` is not explicitly set to `false`. Auto-mounted tokens can be stolen if the pod is compromised.
  **Fix:** Set `automountServiceAccountToken: false` at the pod spec level unless the pod needs API access.

- **web-app [KA-R001]: Missing liveness probe** (Reliability)
  Container has no `livenessProbe`. Without liveness probes, Kubernetes cannot detect and restart hung processes.
  **Fix:** Add a `livenessProbe` (HTTP, TCP, or exec) appropriate for your application.
  Example:
  ```yaml
  livenessProbe:
    httpGet:
      path: /health
      port: 80
    initialDelaySeconds: 10
    periodSeconds: 10
  ```

- **web-app [KA-R002]: Missing readiness probe** (Reliability)
  Container has no `readinessProbe`. Without readiness probes, traffic is sent to pods before they're ready.
  **Fix:** Add a `readinessProbe` (HTTP, TCP, or exec) appropriate for your application.
  Example:
  ```yaml
  readinessProbe:
    httpGet:
      path: /ready
      port: 80
    initialDelaySeconds: 5
    periodSeconds: 5
  ```

- **web-app [KA-R004]: Single replica Deployment** (Reliability)
  `replicas: 1` means zero redundancy. Any pod disruption causes downtime.
  **Fix:** Set `replicas: 2` or higher for production workloads to ensure high availability.

- **web-app [KA-R009]: Image uses latest or no tag** (Reliability)
  Line 19: `image: nginx` has no tag specified. This is equivalent to using `:latest`, making deployments non-reproducible.
  **Fix:** Pin to a specific version tag (e.g., `nginx:1.25.3`) or use a SHA256 digest.

- **web-app [KA-B001]: Missing CPU requests** (Best Practice)
  Container has no `resources.requests.cpu`. Without CPU requests, the scheduler cannot make informed placement decisions.
  **Fix:** Add `resources.requests.cpu` (e.g., `100m` for this web app).

- **web-app [KA-B002]: Missing CPU limits** (Best Practice)
  Container has no `resources.limits.cpu`. Without CPU limits, a single pod can starve other workloads.
  **Fix:** Add `resources.limits.cpu` (e.g., `500m` for this web app).

- **web-app [KA-B003]: Missing memory requests** (Best Practice)
  Container has no `resources.requests.memory`. Without memory requests, pods get best-effort QoS and are first to be evicted during resource pressure.
  **Fix:** Add `resources.requests.memory` (e.g., `128Mi` for this web app).

- **web-app [KA-B004]: Missing memory limits** (Best Practice)
  Container has no `resources.limits.memory`. Without memory limits, a leaking container can OOM-kill the node.
  **Fix:** Add `resources.limits.memory` (e.g., `256Mi` for this web app).

### Info (Nice to Have - Fix When Possible)

#### Deployment: web-app

- **web-app [KA-C009]: Host port specified** (Security - Baseline)
  Line 25: `hostPort: 80` binds to a port on the host, limiting scheduling flexibility and creating port conflicts.
  **Fix:** Remove `hostPort` and use a Service (ClusterIP or LoadBalancer) for port exposure.

- **web-app [KA-B005]: Missing required labels** (Best Practice)
  Resource lacks standard `version` label. Standard labels enable monitoring, debugging, and service mesh integration.
  **Fix:** Add `version` label to pod template metadata (e.g., `version: "1.0"`).

- **web-app [KA-B006]: Missing namespace** (Best Practice)
  Resource has no `metadata.namespace` set. Resources default to the current context, which may be unintended.
  **Fix:** Explicitly set `metadata.namespace` (e.g., `default` or a dedicated namespace).

---

## Summary

This manifest contains **critical security flaws** that must be fixed before deployment:

1. **Privileged container execution** with host access (hostPID, hostNetwork, privileged, root UID, Docker socket)
2. **Overly permissive RBAC** (wildcard permissions and cluster-admin binding)
3. **Exposed secrets** in environment variables
4. **Lack of security hardening** (no read-only filesystem, missing capabilities drop, no seccomp)
5. **Missing reliability features** (no probes, single replica, untagged image)
6. **Missing resource constraints** (no CPU/memory requests or limits)

The manifest requires substantial remediation across all categories. Start by removing privileged access, implementing proper RBAC, externalizing secrets, and adding security contexts. Then address reliability and best-practice issues.

**Recommended next steps:**
1. Remove `hostPID`, `hostNetwork`, `privileged`, root UID, and Docker socket mount
2. Create a custom ClusterRole with specific permissions; remove cluster-admin binding
3. Move secrets to a Secret object and reference via `valueFrom.secretKeyRef`
4. Add comprehensive security context with read-only filesystem, capability drops, and seccomp
5. Add liveness and readiness probes
6. Increase replicas to 2+
7. Pin image to a specific version
8. Add CPU/memory requests and limits
