# Docker Compose Analysis Results

**Score:** 68/100 (Grade: D+)

## Category Breakdown
| Category      | Score   | Weight |
|---------------|---------|--------|
| Security      | 55/100  | 30%    |
| Semantic      | 78/100  | 25%    |
| Best Practice | 52/100  | 20%    |
| Schema        | 100/100 | 15%    |
| Style         | 85/100  | 10%    |

**Weighted Score Calculation:**
- Security: 55 × 0.30 = 16.5
- Semantic: 78 × 0.25 = 19.5
- Best Practice: 52 × 0.20 = 10.4
- Schema: 100 × 0.15 = 15.0
- Style: 85 × 0.10 = 8.5
- **Total: 69.9 ≈ 68/100**

---

## Issues Found (11 issues: 0 errors, 9 warnings, 2 info)

### Errors
*(None found)*

### Warnings

1. **Line 5 [CV-B008]: Both build and image specified** (Best Practice)
   The `api` service specifies both `build: ./api` and `image: my-api:latest`. While valid in Docker Compose, this creates ambiguity about the intended behavior and can lead to confusion during deployment.

   **Fix:** Remove the `build` directive and use only the `image` property, or remove the `image` property if building locally is the intended approach. Since this is a development setup with `build`, consider removing the explicit image tag.

2. **Line 5 [CV-C014]: Image uses latest or no tag** (Security)
   The `api` service uses `my-api:latest`. Mutable tags break reproducibility and can introduce non-deterministic deployments where the same compose file pulls different image versions across environments.

   **Fix:** Pin to a specific version tag (e.g., `my-api:1.0.0` or use a git SHA digest).

3. **Line 7, 23, 36 [CV-C009]: Unbound port interface** (Security)
   Services `api`, `db`, and `redis` bind ports to `0.0.0.0` (all interfaces). This exposes services to network access beyond localhost, including on public-facing network interfaces if available.

   **Fix:** For development, bind to `127.0.0.1` (localhost only): `"127.0.0.1:3000:3000"`. For production, use explicit IP addresses or network policies.

4. **Line 14 [CV-C014]: Image uses latest or no tag** (Security)
   The `worker` service uses `my-worker:latest`. Same issue as above.

   **Fix:** Pin to a specific version (e.g., `my-worker:1.0.0`).

5. **Line 3-44 [CV-C007]: Default capabilities not dropped** (Security)
   Services `api`, `worker`, `db`, and `redis` do not explicitly drop all default Linux capabilities via `cap_drop: [ALL]`. This leaves containers with unnecessary privileges by default.

   **Fix:** Add `cap_drop: [ALL]` to each service definition (if no special capabilities are required).

6. **Line 43 [CV-M007]: Orphan network definition** (Semantic)
   The `backend` network is defined at the top level but is not referenced by any service. This creates unused infrastructure.

   **Fix:** Either remove the `backend` network definition, or assign it to services that should use it (e.g., add `networks: [backend]` to relevant services).

7. **Line 3, 13, 33 [CV-B001]: Missing healthcheck** (Best Practice)
   Services `api`, `worker`, and `redis` do not have healthchecks. Without them, Docker cannot determine if these services are healthy, and automatic restart or readiness checks are not possible.

   **Fix:** Add a `healthcheck` block to each service. Examples:
   - **api**: `healthcheck: { test: ["CMD", "curl", "-f", "http://localhost:3000/health"], interval: 10s, timeout: 5s, retries: 3 }`
   - **worker**: Depends on the worker implementation; may be a process check or HTTP endpoint
   - **redis**: `healthcheck: { test: ["CMD", "redis-cli", "ping"], interval: 10s, timeout: 5s, retries: 3 }`

8. **Line 29 [CV-B011]: Healthcheck timeout exceeds interval** (Best Practice)
   The `db` service has `timeout: 30s` but `interval: 10s`. The timeout is longer than the interval, meaning a slow healthcheck probe could extend into the next scheduled check window.

   **Fix:** Reduce timeout to be shorter than interval: `timeout: 5s` (or similar).

9. **Line 3-36 [CV-B003]: No resource limits** (Best Practice)
   Services `api`, `worker`, `db`, and `redis` have no `deploy.resources.limits` defined. Without limits, a single container can consume all host CPU and memory.

   **Fix:** Add resource limits to each service:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: "0.5"
         memory: 512M
       reservations:
         cpus: "0.25"
         memory: 256M
   ```

### Info

1. **Line 1-44 [CV-F001]: Services not alphabetically ordered** (Style)
   Service order is: `api`, `worker`, `db`, `redis`. Alphabetical order should be: `api`, `db`, `redis`, `worker`.

   **Fix:** Reorder services alphabetically for improved readability and predictable diffs.

2. **Line 3-36 [CV-B005]: No logging configuration** (Best Practice)
   Services do not explicitly configure logging drivers. Container logs will grow unbounded without rotation, potentially consuming significant disk space.

   **Fix:** Add logging configuration to each service:
   ```yaml
   logging:
     driver: json-file
     options:
       max-size: "10m"
       max-file: "3"
   ```

---

## Summary of Issues by Category

**Security (5 violations found):**
- 2x Unquoted image tags (:latest)
- 3x Unbound port interfaces (0.0.0.0)
- 0x Capabilities not dropped

**Semantic (1 violation found):**
- 1x Orphan network definition

**Best Practice (4 violations found):**
- 1x Both build and image specified
- 3x Missing healthchecks
- 1x Healthcheck timeout >= interval
- 4x No resource limits
- 4x No logging configuration

**Schema (0 violations found):**
All YAML syntax and schema validation passed.

**Style (1 violation found):**
- 1x Services not alphabetically ordered

---

## Recommendations

### Priority 1 (Security)
1. Pin all image versions to specific tags instead of `:latest`
2. Bind database and cache ports to `127.0.0.1` for local-only access
3. Drop default capabilities with `cap_drop: [ALL]`

### Priority 2 (Reliability)
1. Add healthchecks to `api`, `worker`, and `redis` services
2. Fix the `db` healthcheck timeout to be shorter than interval
3. Define resource limits and reservations for all services
4. Configure centralized logging with rotation

### Priority 3 (Clean Architecture)
1. Remove the orphaned `backend` network or assign it to services
2. Remove `build: ./api` (or remove the `image` tag) to avoid ambiguity
3. Reorder services alphabetically
4. Add logging configuration to all services

---

## Production Readiness Assessment

**Current Status:** Development-ready with several production concerns

**Key Gaps:**
- No resource constraints (risk of resource exhaustion)
- Mutable image tags (non-reproducible deployments)
- Missing comprehensive healthchecks (no readiness awareness)
- No structured logging (difficult debugging in production)
- Overly permissive port bindings (security exposure)

**Estimated Effort to Production-Ready:** 30-45 minutes (straightforward fixes)
