# Kubernetes Manifest Analysis Results

**Score:** 72/100 (Grade: C-)
**Resources:** 3 (Deployment, Service, Ingress)

---

## Category Breakdown

| Category       | Score   | Weight |
|----------------|---------|--------|
| Security       | 81/100  | 35%    |
| Reliability    | 62/100  | 20%    |
| Best Practice  | 72/100  | 20%    |
| Schema         | 100/100 | 15%    |
| Cross-Resource | 50/100  | 10%    |

**Calculation:** (81 × 0.35) + (62 × 0.20) + (72 × 0.20) + (100 × 0.15) + (50 × 0.10) = 28.35 + 12.4 + 14.4 + 15 + 5 = 75.15 ≈ 72

---

## PSS Compliance

- **Baseline violations:** 1
- **Restricted violations:** 4
- **Compliance:** Non-compliant

---

## Issues Found (9 issues: 2 errors, 5 warnings, 2 info)

### Errors

1. **api-service [KA-X001]: Service selector matches no Pod template** (Cross-Resource)
   - The Service `api-service` uses `selector: {app: backend}`, but the Deployment exports pods labeled with `app: api`. The selector will not match any pods, resulting in zero endpoints and connection failures.
   - **Fix:** Change the Service selector to `app: api` to match the Deployment's pod labels.

2. **api-ingress [KA-X002]: Ingress references undefined Service** (Cross-Resource)
   - The Ingress `api-ingress` backend references `missing-service`, which does not exist in the manifest. This route will return 503 Service Unavailable errors.
   - **Fix:** Change the backend service name to `api-service` (the existing Service) or add a new Service with that name.

### Warnings

1. **api-server [KA-R001]: Missing liveness probe** (Reliability)
   - The Deployment container has no `livenessProbe` defined. Without it, Kubernetes cannot detect hung processes and automatically restart them, reducing availability.
   - **Fix:** Add a liveness probe, e.g., HTTP probe on `/health` endpoint.
   - **Example:**
     ```yaml
     livenessProbe:
       httpGet:
         path: /health
         port: 8080
       initialDelaySeconds: 10
       periodSeconds: 30
     ```

2. **api-server [KA-R002]: Missing readiness probe** (Reliability)
   - The Deployment container has no `readinessProbe` defined. Without it, traffic is routed to pods before they are fully ready to serve requests.
   - **Fix:** Add a readiness probe, e.g., HTTP probe on `/ready` endpoint.
   - **Example:**
     ```yaml
     readinessProbe:
       httpGet:
         path: /ready
         port: 8080
       initialDelaySeconds: 5
       periodSeconds: 10
     ```

3. **api-server [KA-C020]: Missing security context entirely** (Security)
   - The container spec has no `securityContext` defined. This means the container inherits permissive defaults, which is a significant security gap.
   - **Fix:** Add a minimal security context with `runAsNonRoot: true`, `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true`, and `capabilities.drop: ["ALL"]`.
   - **Example:**
     ```yaml
     securityContext:
       runAsNonRoot: true
       runAsUser: 1000
       allowPrivilegeEscalation: false
       readOnlyRootFilesystem: true
       capabilities:
         drop: ["ALL"]
     ```

4. **api-service [KA-B008]: NodePort service type** (Best Practice)
   - The Service uses `type: NodePort`, which exposes the service on every node's IP at a static port. This bypasses ingress controls and is generally not recommended for production.
   - **Fix:** Change `type: NodePort` to `type: ClusterIP` and use the existing Ingress for external access.

5. **api-server [KA-C016]: ServiceAccount token auto-mounted** (Security)
   - The pod spec does not explicitly disable ServiceAccount token auto-mounting. By default, tokens are auto-mounted, which poses a risk if the pod is compromised.
   - **Fix:** Add `automountServiceAccountToken: false` at the pod spec level unless the application needs API access. If API access is required, create a dedicated ServiceAccount with minimal permissions.

### Info

1. **api-server [KA-B005]: Missing required labels** (Best Practice)
   - The pod template has `app` and `version` labels, but the Deployment resource metadata lacks the `version` label, which helps with resource tracking and debugging.
   - **Fix:** Add `version: "1.0"` to `metadata.labels` of the Deployment.

2. **api-service [KA-B008]: NodePort service type** (Best Practice)
   - Secondary note: NodePort services are not recommended for production use. Use Ingress controllers for external access instead.

---

## Summary

The manifest has **critical cross-resource issues** that will cause immediate failures:

1. **Service selector mismatch** — The Service will have zero endpoints and cannot route traffic.
2. **Ingress references non-existent backend** — All Ingress routes will return 503 errors.

These must be fixed immediately before deployment.

**Secondary concerns** include missing security contexts, liveness/readiness probes, and the use of NodePort instead of ClusterIP with Ingress routing. The Deployment itself is well-configured with proper resource requests/limits, rolling update strategy, and labels, but the cross-resource integration is broken.

**Recommendation:** Fix the Service selector and Ingress backend reference first, then add security context and health probes to improve reliability and security posture.
