# Dockerfile Security and Best Practice Analysis

## Critical Issues

### 1. Hardcoded Secrets (CRITICAL)
**Lines 5-6**: API keys and database passwords are hardcoded in environment variables
```dockerfile
ENV API_KEY=sk-1234567890abcdef
ENV DB_PASSWORD=mysecretpassword
```
**Risk**: Secrets are visible in image history, container logs, and inspections. Anyone with access to the image can extract credentials.
**Recommendation**: Use Docker secrets, build-time arguments, or external secret management tools (Vault, AWS Secrets Manager, etc.). Never commit secrets to the Dockerfile or image.

### 2. Untagged Base Image (HIGH)
**Line 1**: Using `ubuntu` without a specific version tag
```dockerfile
FROM ubuntu
```
**Risk**: Pulls the latest version, causing non-deterministic builds. Updates could break compatibility. Difficult to track what version is in use.
**Recommendation**: Use a specific tag: `FROM ubuntu:22.04` or `FROM ubuntu:24.04`

### 3. Piping External Script Directly to bash (HIGH)
**Line 4**: Downloading and executing a script directly from the internet
```dockerfile
RUN curl -sSL https://example.com/install.sh | bash
```
**Risk**: Man-in-the-middle attacks, malicious scripts, or compromised upstream sources can execute arbitrary code in the image. The `-s` flag suppresses error messages, hiding problems.
**Recommendation**:
- Verify script integrity with checksums (SHA256)
- Download and inspect the script before execution
- Use pinned versions and checksums
- Use official package managers when available

### 4. Overly Permissive File Permissions (HIGH)
**Line 9**: Granting world-writable permissions
```dockerfile
RUN sudo chmod 777 /app
```
**Risk**: Any user or process can read, write, and execute files in `/app`, creating security vulnerabilities. Also, `sudo` is unnecessary in containers running as root.
**Recommendation**: Use restrictive permissions: `chmod 755` or `chmod 750` depending on use case. Example: `RUN chmod 755 /app`

### 5. .env File Committed to Container (HIGH)
**Line 8**: Copying a `.env` file into the image
```dockerfile
COPY .env /app/.env
```
**Risk**: Secrets in `.env` files are embedded in the image and visible in its history. Same vulnerability as hardcoded secrets.
**Recommendation**: Don't commit `.env` files to Docker images. Use runtime environment variables or secret management.

## Medium Severity Issues

### 6. Missing USER Directive
**Missing**: No `USER` statement to drop root privileges
**Risk**: Container runs as root, increasing blast radius of any container escape or vulnerability.
**Recommendation**: Create a non-root user and switch to it:
```dockerfile
RUN useradd -m -s /bin/bash appuser
USER appuser
```

### 7. No Health Check
**Missing**: No `HEALTHCHECK` instruction
**Risk**: Orchestrators cannot automatically detect unhealthy containers.
**Recommendation**: Add appropriate health check:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

### 8. Inefficient Layer Caching
**Lines 2-3**: Multiple RUN statements that could be combined
```dockerfile
RUN apt-get update
RUN apt-get install -y curl wget netcat
```
**Risk**: Creates extra layers and increases image size. If the second command fails, the cache from the first is still used.
**Recommendation**: Combine into a single RUN statement:
```dockerfile
RUN apt-get update && apt-get install -y curl wget netcat && apt-get clean && rm -rf /var/lib/apt/lists/*
```

### 9. Unused Tools Installed
**Line 3**: Installing `wget` and `netcat` without evidence of use
**Risk**: Increases attack surface and image size unnecessarily.
**Recommendation**: Remove unused packages. Only install what the application needs.

### 10. Missing Cleanup After apt-get
**Lines 2-3**: No cleanup of apt package lists
**Risk**: Increases image size unnecessarily. Package lists can be 10-20MB.
**Recommendation**: Add cleanup:
```dockerfile
RUN apt-get update && apt-get install -y curl wget netcat && apt-get clean && rm -rf /var/lib/apt/lists/*
```

## Low Severity Issues

### 11. Unspecified Application Dependencies
**Line 11**: CMD references `node server.js` but Node.js is not installed
**Risk**: Container will fail to start. Missing dependency management makes the image unreliable.
**Recommendation**: Add Node.js installation or use a Node.js base image: `FROM node:20-alpine`

### 12. ADD vs COPY
**Line 7**: Using ADD for file copying
```dockerfile
ADD ./config /app/config
```
**Risk**: ADD has automatic archive extraction and remote URL support, which adds complexity and potential security issues.
**Recommendation**: Use COPY for file transfers (unless archive extraction is explicitly needed):
```dockerfile
COPY ./config /app/config
```

### 13. Missing WORKDIR
**Missing**: No WORKDIR directive
**Risk**: Working directory defaults to `/`, making relative paths confusing and error-prone.
**Recommendation**: Set a clear working directory:
```dockerfile
WORKDIR /app
```

## Summary

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 2 | Hardcoded secrets, exposed credentials |
| High | 3 | Untagged base image, unsafe script execution, overly permissive permissions, .env exposure |
| Medium | 5 | Missing non-root user, no health check, inefficient caching, unused tools, missing cleanup |
| Low | 3 | Missing Node.js dependency, ADD vs COPY, missing WORKDIR |

## Remediation Priority

1. **Remove all hardcoded secrets** (lines 5-6, 8)
2. **Fix base image tagging** (line 1)
3. **Secure the installation method** (line 4)
4. **Restrict file permissions** (line 9)
5. **Add non-root user**
6. **Optimize layer caching and cleanup**
7. **Use appropriate base image** (Node.js instead of Ubuntu)

## Recommended Secure Dockerfile Structure

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install only necessary tools
RUN apk add --no-cache curl

# Copy application files
COPY ./config /app/config
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Document port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Run application
CMD ["node", "server.js"]
```

**Note**: Secrets (API_KEY, DB_PASSWORD) should be injected at runtime using environment variables, Docker secrets, or a secret management solution—never embedded in the image.
