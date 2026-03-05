# Docker Compose Security and Configuration Analysis

## File: test-insecure.yml

### Critical Security Issues

#### 1. **Privileged Mode (Line 5)**
- **Issue**: `privileged: true` on the web service
- **Severity**: CRITICAL
- **Description**: Running a container in privileged mode grants it extensive capabilities equivalent to root access on the host system. This defeats container isolation and is a major security risk.
- **Recommendation**: Remove `privileged: true` unless absolutely necessary. Use specific `cap_add` directives with minimal required capabilities instead.

#### 2. **Docker Socket Mount (Line 9)**
- **Issue**: `/var/run/docker.sock:/var/run/docker.sock` mounted inside the container
- **Severity**: CRITICAL
- **Description**: Exposing the Docker socket allows the container to control the Docker daemon on the host, essentially giving it full host access. Combined with privileged mode, this is extremely dangerous.
- **Recommendation**: Remove this mount entirely unless Docker-in-Docker functionality is absolutely required. If needed, use alternatives like socket proxies with restricted permissions.

#### 3. **Secrets in Environment Variables (Lines 11-12, 20)**
- **Issue**: Database and API credentials stored as plain-text environment variables:
  - `DB_PASSWORD: supersecret123`
  - `API_KEY: sk-live-abc123def456`
  - `POSTGRES_PASSWORD: admin123`
- **Severity**: CRITICAL
- **Description**: Credentials are visible in compose file, logs, process listings, and Docker inspect output. This violates security best practices and compliance requirements.
- **Recommendation**: Use Docker Secrets (for Swarm) or external secret management (Vault, AWS Secrets Manager, etc.). Pass secrets via `.env` files (excluded from version control) or better yet, use orchestration platform secret management.

#### 4. **Host Network Mode (Line 13)**
- **Issue**: `network_mode: host` on the web service
- **Severity**: HIGH
- **Description**: Using host network mode removes network isolation, allowing the container to access all host network interfaces and ports. This increases attack surface.
- **Recommendation**: Use bridge networking (default) or custom networks. Only use host mode if absolutely necessary for performance-critical applications.

#### 5. **No Image Tags (Lines 4, 16)**
- **Issue**: Services use `nginx` (latest implicitly) and `postgres:latest`
- **Severity**: HIGH
- **Description**: Using latest or untagged images means containers can break unexpectedly when base images update. No way to ensure consistency or reproduce issues.
- **Recommendation**: Always specify explicit version tags (e.g., `nginx:1.24-alpine`, `postgres:15.2`).

#### 6. **Direct Port Binding for Database (Line 18)**
- **Issue**: PostgreSQL exposed on `5432:5432` to host
- **Severity**: MEDIUM-HIGH
- **Description**: Database is directly accessible from the network, increasing attack surface. Anyone with network access can attempt to connect to the database.
- **Recommendation**: Don't expose the database port unless required. Use internal networking between services. If external access is needed, implement authentication, network policies, and consider using a bastion host.

#### 7. **No Resource Limits**
- **Issue**: No `resources.limits` or `resources.reservations` specified
- **Severity**: MEDIUM
- **Description**: Containers can consume unlimited CPU and memory, potentially causing host resource exhaustion and denial of service.
- **Recommendation**: Set appropriate CPU and memory limits:
  ```yaml
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
  ```

#### 8. **Missing Restart Policy**
- **Issue**: No `restart_policy` specified
- **Severity**: LOW-MEDIUM
- **Description**: If containers crash, they won't automatically restart, reducing resilience.
- **Recommendation**: Add `restart_policy: unless-stopped` or similar:
  ```yaml
  restart_policy:
    condition: unless-stopped
    delay: 5s
    max_attempts: 5
    window: 120s
  ```

### Configuration Issues

#### 9. **No Health Checks**
- **Issue**: No `healthcheck` directives defined
- **Severity**: MEDIUM
- **Description**: No way to detect if services are functioning properly. Load balancers and orchestrators can't make intelligent decisions about container status.
- **Recommendation**: Add health checks to both services:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
  ```

#### 10. **No Logging Configuration**
- **Issue**: No explicit logging driver or configuration
- **Severity**: LOW-MEDIUM
- **Description**: Logs may consume excessive disk space without limits. Difficult to aggregate logs for monitoring.
- **Recommendation**: Configure logging:
  ```yaml
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
  ```

#### 11. **No User Specification**
- **Issue**: No `user` directive specified
- **Severity**: MEDIUM
- **Description**: Containers likely run as root, increasing risk if container is compromised.
- **Recommendation**: Specify non-root users in Dockerfiles or via compose:
  ```yaml
  user: "nobody"
  ```

### Summary Table

| Issue | Service | Severity | Type |
|-------|---------|----------|------|
| Privileged mode | web | CRITICAL | Security |
| Docker socket mount | web | CRITICAL | Security |
| Hardcoded secrets | both | CRITICAL | Security |
| Host network mode | web | HIGH | Security |
| Untagged images | both | HIGH | Configuration |
| Exposed database port | db | MEDIUM-HIGH | Security |
| No resource limits | both | MEDIUM | Configuration |
| No restart policy | both | MEDIUM | Configuration |
| No health checks | both | MEDIUM | Configuration |
| No logging limits | both | MEDIUM | Configuration |
| Running as root | both | MEDIUM | Security |

### Recommended Secure Configuration Template

```yaml
version: "3.8"

services:
  web:
    image: nginx:1.24-alpine
    user: "nobody"
    ports:
      - "8080:80"
    environment:
      DB_HOST: db
      DB_PORT: 5432
    env_file: .env.secrets
    networks:
      - internal
    restart_policy:
      condition: unless-stopped
      delay: 5s
      max_attempts: 5
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

  db:
    image: postgres:15.2-alpine
    user: "postgres"
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
    env_file: .env.secrets
    networks:
      - internal
    restart_policy:
      condition: unless-stopped
      delay: 5s
      max_attempts: 5
    volumes:
      - db-data:/var/lib/postgresql/data
    resources:
      limits:
        cpus: '2.0'
        memory: 1024M
      reservations:
        cpus: '1.0'
        memory: 512M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    cap_drop:
      - ALL

volumes:
  db-data:

networks:
  internal:
    driver: bridge
```

### Additional Security Recommendations

1. **Use .env files** (not checked into version control) for sensitive environment variables
2. **Implement network policies** to restrict inter-service and inbound/outbound communication
3. **Run security scanning** on base images (nginx, postgres) regularly
4. **Use non-root users** in all containers
5. **Implement secret rotation** practices
6. **Set up monitoring and alerting** for container security events
7. **Use read-only root filesystems** where possible: `read_only: true`
8. **Implement proper access controls** on docker.sock and Docker daemon
9. **Consider using container security tools** like Trivy, Falco, or AppArmor/SELinux profiles
10. **Document security decisions** and keep audit logs of configuration changes
