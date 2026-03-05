# Kubernetes Manifest Analysis: test-mixed.yaml

## Executive Summary

The manifest defines three related Kubernetes resources (Deployment, Service, Ingress) in the production namespace. While the configuration demonstrates some best practices (resource requests/limits, rolling update strategy), there are critical cross-resource issues that will prevent the workload from functioning correctly.

**Critical Issues: 3**
**Major Issues: 2**
**Minor Issues: 2**

---

## Critical Issues

### 1. Service Selector Mismatch (Line 45)

**Severity:** CRITICAL
**Location:** Service resource, selector field

**Issue:**
The Service selector specifies `app: backend` but the Deployment labels only define `app: api`. This mismatch breaks the connection between the Service and Deployment.

```yaml
# Service (lines 44-45)
selector:
  app: backend

# Deployment (lines 7, 21)
labels:
  app: api
```

**Impact:**
- The Service will not discover or route traffic to any pods
- Ingress will fail to reach the API pods through the Service
- Workload will be unreachable despite running pods

**Resolution:**
Change the Service selector to:
```yaml
selector:
  app: api
```

### 2. Ingress References Non-existent Service (Line 64)

**Severity:** CRITICAL
**Location:** Ingress resource, backend service name

**Issue:**
The Ingress specifies `backend.service.name: missing-service`, but no Service with this name exists. The actual Service is named `api-service`.

```yaml
# Ingress backend (lines 63-66)
backend:
  service:
    name: missing-service
    port:
      number: 80

# Actual Service name (line 40)
name: api-service
```

**Impact:**
- Ingress will fail to route traffic to any backend
- External users accessing `api.example.com` will receive 502/503 errors
- Requests cannot reach the workload

**Resolution:**
Change the Ingress backend service name to:
```yaml
name: api-service
```

### 3. Service Type Mismatch with Ingress Pattern (Line 43)

**Severity:** CRITICAL (in context)
**Location:** Service resource, type field

**Issue:**
The Service is configured as `type: NodePort`, which exposes the service on each node's IP address. However, Ingress is the intended traffic path (lines 50-66), which typically requires `type: ClusterIP` for internal service discovery.

**Impact:**
- NodePort is unnecessary and exposes the service directly to cluster nodes
- Creates a redundant traffic path that bypasses intended Ingress routing
- Increases attack surface and complicates network policy enforcement
- Potential confusion about the intended traffic flow architecture

**Resolution:**
Change Service type to:
```yaml
type: ClusterIP
```

---

## Major Issues

### 4. Image Tag Lacks Immutability (Line 26)

**Severity:** MAJOR
**Location:** Deployment container image

**Issue:**
The image is specified as `my-api:1.2.3` with a mutable tag. While semantic versioning tags are generally better than `latest`, they can still be retagged in registries, leading to unpredictable deployments.

```yaml
image: my-api:1.2.3
```

**Best Practice:**
Use immutable image references (digest hash or explicit immutable tag policies):
```yaml
image: my-api:1.2.3@sha256:abc123...  # with digest
```

**Impact:**
- Deployments are not reproducible if the tag is overwritten
- Rolling rollbacks may not return to the exact same image
- Complicates compliance and audit trails

### 5. Container Missing Health Checks (Lines 24-35)

**Severity:** MAJOR
**Location:** Deployment container spec

**Issue:**
No liveness or readiness probes are defined for the API container. This means Kubernetes has no way to detect if the application is healthy or ready to serve traffic.

**Missing:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

**Impact:**
- Failed pods will remain in the Service pool, causing request failures
- Rolling updates cannot verify pod readiness before shifting traffic
- No automatic recovery from application crashes
- Degraded service availability without alerting

---

## Minor Issues

### 6. Missing SecurityContext (Lines 23-35)

**Severity:** MINOR
**Location:** Pod spec

**Issue:**
No securityContext is defined at pod or container level.

**Best Practice:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

**Impact:**
- Container may run as root, violating security hardening standards
- Increased risk of privilege escalation attacks
- Non-compliance with CIS Kubernetes Benchmarks
- Pod Security Standards would fail in restricted mode

### 7. Missing Request Type in Ingress Path (Line 61)

**Severity:** MINOR
**Location:** Ingress pathType declaration

**Issue:**
While `pathType: Prefix` is specified (which is correct), the Ingress lacks an `ingressClassName` field and doesn't specify which ingress controller should handle it.

**Missing:**
```yaml
ingressClassName: nginx  # or other appropriate controller
```

**Impact:**
- Ingress may not be claimed by any controller if multiple are present
- Behavior depends on default ingress controller configuration
- Reduces clarity and portability across clusters

---

## Cross-Resource Relationship Map

```
Deployment (api-server)
  └─ Labels: app: api (version: 1.0)

Service (api-service) [MISMATCH]
  └─ Selector: app: backend ❌ (should be app: api)
  └─ Type: NodePort (should be ClusterIP for Ingress pattern)

Ingress (api-ingress) [BROKEN REFERENCE]
  └─ Backend Service: missing-service ❌ (should be api-service)
  └─ Service Port: 80 ✓ (matches Service port)
  └─ Target Port: 8080 ✓ (matches container port)
```

---

## Traffic Flow Analysis

### Intended Flow (if fixed):
```
Client (api.example.com)
  → Ingress (api-ingress)
    → Service (api-service, ClusterIP)
      → Deployment pods (app=api)
        → Container port 8080
```

### Current Issues:
1. Ingress cannot find `missing-service` → 502 Bad Gateway
2. Even if fixed, Service selector won't match any pods → 503 Service Unavailable
3. NodePort type is unnecessary and adds operational complexity

---

## Summary Table

| Issue | Severity | Resource | Fix |
|-------|----------|----------|-----|
| Service selector mismatch | CRITICAL | Service | Change `app: backend` to `app: api` |
| Ingress references wrong service | CRITICAL | Ingress | Change `missing-service` to `api-service` |
| Service type incorrect for Ingress | CRITICAL | Service | Change `type: NodePort` to `type: ClusterIP` |
| Image tag not immutable | MAJOR | Deployment | Add digest hash or use immutable tag |
| Missing health checks | MAJOR | Deployment | Add liveness and readiness probes |
| No securityContext | MINOR | Pod | Add non-root user and capability restrictions |
| No ingressClassName | MINOR | Ingress | Specify `ingressClassName: nginx` (or other) |

---

## Recommendations (Priority Order)

### Phase 1: Critical Fixes (Deploy-blocking)
1. Fix Service selector to match Deployment labels
2. Update Ingress to reference the correct Service name
3. Change Service type to ClusterIP

### Phase 2: Major Improvements (Before production)
4. Add container health checks (liveness + readiness probes)
5. Update image reference with digest hash

### Phase 3: Security Hardening (Compliance)
6. Add Pod securityContext with non-root user
7. Specify ingressClassName for explicit controller binding

### Phase 4: Monitoring
8. Add resource quotas for the namespace
9. Configure pod disruption budgets for high availability
10. Set up monitoring/alerting for deployment rollouts

---

## Positive Aspects

The manifest demonstrates several best practices:
- ✓ Resource requests and limits defined (100m-500m CPU, 128Mi-256Mi memory)
- ✓ Rolling update strategy with controlled surge/unavailable (maxSurge: 1, maxUnavailable: 0)
- ✓ Explicit namespace declaration (production)
- ✓ Clear labeling scheme (app: api)
- ✓ Semantic versioning on image tag (1.2.3)
- ✓ Container port explicitly declared
- ✓ Appropriate replica count (2) for availability

These foundations should be preserved while addressing the critical cross-resource issues.
