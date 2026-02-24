#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

COMPOSE_HOOK="$REPO_ROOT/public/skills/compose-validator/hooks/validate-compose.sh"
DOCKERFILE_HOOK="$REPO_ROOT/public/skills/dockerfile-analyzer/hooks/validate-dockerfile.sh"
K8S_HOOK="$REPO_ROOT/public/skills/k8s-analyzer/hooks/validate-k8s.sh"

PASS_COUNT=0
FAIL_COUNT=0

log_pass() {
  echo "[PASS] $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

log_fail() {
  echo "[FAIL] $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_cmd_exists() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
}

assert_file_exists() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file"
    exit 1
  fi
}

run_hook_case() {
  local case_name="$1"
  local hook_path="$2"
  local payload="$3"
  local expected_exit="$4"
  local expected_pattern="${5:-}"

  local output exit_code
  if output="$(printf '%s' "$payload" | "$hook_path" 2>&1)"; then
    exit_code=0
  else
    exit_code=$?
  fi

  if [[ "$exit_code" -ne "$expected_exit" ]]; then
    log_fail "$case_name (expected exit $expected_exit, got $exit_code)"
    echo "----- output -----"
    echo "$output"
    echo "------------------"
    return
  fi

  if [[ -n "$expected_pattern" ]] && [[ "$output" != *"$expected_pattern"* ]]; then
    log_fail "$case_name (missing pattern: $expected_pattern)"
    echo "----- output -----"
    echo "$output"
    echo "------------------"
    return
  fi

  log_pass "$case_name"
}

assert_cmd_exists jq
assert_file_exists "$COMPOSE_HOOK"
assert_file_exists "$DOCKERFILE_HOOK"
assert_file_exists "$K8S_HOOK"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

COMPOSE_GOOD="$TMP_DIR/compose.yml"
COMPOSE_BAD="$TMP_DIR/docker-compose.yml"
COMPOSE_BAD_VARIANT="$TMP_DIR/docker-compose.prod.yaml"
NON_COMPOSE="$TMP_DIR/not-compose.yaml"

cat > "$COMPOSE_GOOD" <<'YAML'
services:
  app:
    image: nginx:1.25.3-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost"]
      interval: 30s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 256M
YAML

cat > "$COMPOSE_BAD" <<'YAML'
services:
  web:
    image: nginx:latest
    privileged: true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
YAML

cat > "$COMPOSE_BAD_VARIANT" <<'YAML'
services:
  api:
    image: redis:7
    restart: unless-stopped
    environment:
      API_KEY: plaintext-secret
    deploy:
      resources:
        limits:
          cpus: "0.25"
          memory: 128M
YAML

cat > "$NON_COMPOSE" <<'YAML'
foo: bar
YAML

DOCKER_GOOD="$TMP_DIR/Dockerfile"
DOCKER_BAD="$TMP_DIR/Dockerfile.bad"
DOCKER_BAD_EXT="$TMP_DIR/service.dockerfile"
NON_DOCKER="$TMP_DIR/app.txt"

cat > "$DOCKER_GOOD" <<'DOCKER'
FROM debian:12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . /app
ENTRYPOINT ["bash", "-lc"]
CMD ["echo", "ok"]
DOCKER

cat > "$DOCKER_BAD" <<'DOCKER'
FROM ubuntu:latest
MAINTAINER test@example.com
RUN sudo apt-get update
WORKDIR app
ADD . /app
ENTRYPOINT echo bad
ENTRYPOINT ["echo", "still-bad"]
DOCKER

cat > "$DOCKER_BAD_EXT" <<'DOCKER'
FROM debian:12-slim
CMD echo first
CMD ["echo", "second"]
DOCKER

cat > "$NON_DOCKER" <<'TXT'
not a dockerfile
TXT

K8S_GOOD="$TMP_DIR/deployment.yaml"
K8S_BAD="$TMP_DIR/insecure-pod.yaml"
K8S_RBAC_BAD="$TMP_DIR/cluster-role.yaml"
K8S_NON_K8S="$TMP_DIR/config.yaml"
K8S_COMPOSE="$TMP_DIR/docker-compose.yaml"

cat > "$K8S_GOOD" <<'YAML'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      securityContext:
        runAsNonRoot: true
      containers:
        - name: app
          image: nginx:1.25.3-alpine
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
YAML

cat > "$K8S_BAD" <<'YAML'
apiVersion: v1
kind: Pod
metadata:
  name: insecure-pod
spec:
  containers:
    - name: app
      image: nginx
      securityContext:
        privileged: true
YAML

cat > "$K8S_RBAC_BAD" <<'YAML'
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: god-mode
rules:
  - apiGroups:
      - "*"
    resources:
      - "*"
    verbs:
      - "*"
YAML

cat > "$K8S_NON_K8S" <<'YAML'
database:
  host: localhost
  port: 5432
YAML

# Reuse compose bad file for K8s compose-exclusion test (already created above as COMPOSE_BAD)

echo "Running Compose hook tests..."
run_hook_case \
  "compose: valid file passes" \
  "$COMPOSE_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$COMPOSE_GOOD\"}}" \
  0

run_hook_case \
  "compose: invalid file fails with CV-C001" \
  "$COMPOSE_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$COMPOSE_BAD\"}}" \
  2 \
  "CV-C001"

run_hook_case \
  "compose: docker-compose.*.yaml variant validated (CV-C008)" \
  "$COMPOSE_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$COMPOSE_BAD_VARIANT\"}}" \
  2 \
  "CV-C008"

run_hook_case \
  "compose: non-compose file ignored" \
  "$COMPOSE_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$NON_COMPOSE\"}}" \
  0

run_hook_case \
  "compose: missing file_path ignored" \
  "$COMPOSE_HOOK" \
  "{}" \
  0

run_hook_case \
  "compose: malformed JSON input ignored" \
  "$COMPOSE_HOOK" \
  "not-json-at-all" \
  0

run_hook_case \
  "compose: full PostToolUse payload shape" \
  "$COMPOSE_HOOK" \
  "{\"session_id\":\"abc\",\"cwd\":\"/tmp\",\"hook_event_name\":\"PostToolUse\",\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$COMPOSE_BAD\"}}" \
  2 \
  "CV-C001"

echo "Running Dockerfile hook tests..."
run_hook_case \
  "dockerfile: valid file passes" \
  "$DOCKERFILE_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$DOCKER_GOOD\"}}" \
  0

run_hook_case \
  "dockerfile: invalid file fails with DL4000" \
  "$DOCKERFILE_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$DOCKER_BAD\"}}" \
  2 \
  "DL4000"

run_hook_case \
  "dockerfile: *.dockerfile variant validated (DL4003)" \
  "$DOCKERFILE_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$DOCKER_BAD_EXT\"}}" \
  2 \
  "DL4003"

run_hook_case \
  "dockerfile: non-docker file ignored" \
  "$DOCKERFILE_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$NON_DOCKER\"}}" \
  0

run_hook_case \
  "dockerfile: missing file_path ignored" \
  "$DOCKERFILE_HOOK" \
  "{}" \
  0

run_hook_case \
  "dockerfile: malformed JSON input ignored" \
  "$DOCKERFILE_HOOK" \
  "not-json-at-all" \
  0

run_hook_case \
  "dockerfile: full PostToolUse payload shape" \
  "$DOCKERFILE_HOOK" \
  "{\"session_id\":\"abc\",\"cwd\":\"/tmp\",\"hook_event_name\":\"PostToolUse\",\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$DOCKER_BAD\"}}" \
  2 \
  "DL4000"

echo "Running Kubernetes hook tests..."
run_hook_case \
  "k8s: valid manifest passes" \
  "$K8S_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$K8S_GOOD\"}}" \
  0

run_hook_case \
  "k8s: privileged container fails with KA-C001" \
  "$K8S_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$K8S_BAD\"}}" \
  2 \
  "KA-C001"

run_hook_case \
  "k8s: missing image tag detected as KA-R009" \
  "$K8S_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$K8S_BAD\"}}" \
  2 \
  "KA-R009"

run_hook_case \
  "k8s: RBAC wildcard fails with KA-A001" \
  "$K8S_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$K8S_RBAC_BAD\"}}" \
  2 \
  "KA-A001"

run_hook_case \
  "k8s: non-K8s YAML ignored" \
  "$K8S_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$K8S_NON_K8S\"}}" \
  0

run_hook_case \
  "k8s: docker-compose file excluded" \
  "$K8S_HOOK" \
  "{\"tool_input\":{\"file_path\":\"$COMPOSE_BAD\"}}" \
  0

run_hook_case \
  "k8s: missing file_path ignored" \
  "$K8S_HOOK" \
  "{}" \
  0

run_hook_case \
  "k8s: malformed JSON input ignored" \
  "$K8S_HOOK" \
  "not-json-at-all" \
  0

run_hook_case \
  "k8s: full PostToolUse payload shape" \
  "$K8S_HOOK" \
  "{\"session_id\":\"abc\",\"cwd\":\"/tmp\",\"hook_event_name\":\"PostToolUse\",\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$K8S_BAD\"}}" \
  2 \
  "KA-C001"

echo
echo "Test results: $PASS_COUNT passed, $FAIL_COUNT failed"
if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi
