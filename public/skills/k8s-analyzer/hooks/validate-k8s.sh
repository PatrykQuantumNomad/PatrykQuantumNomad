#!/usr/bin/env bash
# Hook:    validate-k8s.sh
# Author:  Patryk Golabek
# Website: https://patrykgolabek.dev
# Type:    Claude Code PostToolUse hook
#
# Purpose:
#   - Validate Kubernetes manifests after file-edit tool calls
#   - Return actionable violations via stderr for Claude feedback
#   - Stay fail-safe (exit 0) for unrelated or malformed hook payloads
#
# Environment:
#   CLAUDE_PROJECT_DIR — set by Claude Code to the project root
#
# Install:
#   1. Copy this file to .claude/hooks/validate-k8s.sh
#   2. chmod +x .claude/hooks/validate-k8s.sh
#   3. Add the PostToolUse hook config to .claude/settings.json:
#      {
#        "hooks": {
#          "PostToolUse": [{
#            "matcher": "Edit|Write",
#            "hooks": [{
#              "type": "command",
#              "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-k8s.sh"
#            }]
#          }]
#        }
#      }
#
# Exit codes (per Claude Code hook contract):
#   0 — file is not a K8s manifest, or manifest passed validation
#   2 — manifest has violations (stderr is sent as feedback to Claude)

set -euo pipefail

# --- Prerequisite checks ---
if ! command -v jq >/dev/null 2>&1; then
  echo "validate-k8s.sh: jq is required but not installed." >&2
  exit 1
fi

# --- Read hook input from stdin ---
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# No file path means this isn't a file-editing tool call
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# --- Check if the file is a Kubernetes manifest ---
BASENAME=$(basename "$FILE_PATH")
BASENAME_LOWER="${BASENAME,,}"

IS_K8S=false

# Quick extension check — must be .yaml or .yml
case "$BASENAME_LOWER" in
  *.yaml|*.yml) ;;
  *) exit 0 ;;
esac

# Exclude known non-K8s YAML files
case "$BASENAME_LOWER" in
  docker-compose*.yml|docker-compose*.yaml) exit 0 ;;
  compose*.yml|compose*.yaml)               exit 0 ;;
  .pre-commit-config.yaml)                  exit 0 ;;
  mkdocs.yml|mkdocs.yaml)                   exit 0 ;;
  .github/*)                                exit 0 ;;
  package.json|tsconfig.json)               exit 0 ;;
esac

# File must exist and be readable
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

CONTENT=$(<"$FILE_PATH")

# --- Detect K8s manifest by checking for apiVersion + kind ---
# We need at least one document with both apiVersion and kind
HAS_API_VERSION=false
HAS_KIND=false

if echo "$CONTENT" | grep -qE '^\s*apiVersion:\s*\S'; then
  HAS_API_VERSION=true
fi
if echo "$CONTENT" | grep -qE '^\s*kind:\s*\S'; then
  HAS_KIND=true
fi

if [[ "$HAS_API_VERSION" != "true" ]] || [[ "$HAS_KIND" != "true" ]]; then
  exit 0
fi

# --- Known K8s kinds for validation ---
K8S_KINDS="Deployment|StatefulSet|DaemonSet|Job|CronJob|Pod|Service|Ingress|ConfigMap|Secret|PersistentVolumeClaim|ServiceAccount|HorizontalPodAutoscaler|NetworkPolicy|Role|ClusterRole|RoleBinding|ClusterRoleBinding|PodDisruptionBudget|Namespace|ReplicaSet|LimitRange|ResourceQuota"

# Verify at least one document has a recognized K8s kind
if ! echo "$CONTENT" | grep -qE "^\s*kind:\s*($K8S_KINDS)\s*$"; then
  exit 0
fi

IS_K8S=true

# --- Validate the K8s manifest ---
VIOLATIONS=()

# --- Helper: extract pod spec sections from workload resources ---
# Lightweight line-by-line parser. We look for container-level and pod-level
# security context fields, probes, resources, etc.

# Track which resources we've found
declare -a RESOURCE_KINDS=()
declare -a RESOURCE_NAMES=()
CURRENT_KIND=""
CURRENT_NAME=""

while IFS= read -r LINE; do
  # Detect kind
  if [[ "$LINE" =~ ^kind:[[:space:]]*(.+) ]]; then
    CURRENT_KIND="${BASH_REMATCH[1]}"
    CURRENT_KIND=$(echo "$CURRENT_KIND" | xargs)
  fi
  # Detect name
  if [[ "$LINE" =~ ^[[:space:]]*name:[[:space:]]*(.+) ]] && [[ -z "$CURRENT_NAME" || "$LINE" =~ ^[[:space:]]{2}name: ]]; then
    # Only capture metadata.name (indented under metadata)
    INDENT="${LINE%%[^[:space:]]*}"
    if [[ ${#INDENT} -le 4 ]]; then
      CURRENT_NAME="${BASH_REMATCH[1]}"
      CURRENT_NAME=$(echo "$CURRENT_NAME" | xargs | tr -d '"' | tr -d "'")
    fi
  fi
  # On document separator, save and reset
  if [[ "$LINE" == "---" ]]; then
    if [[ -n "$CURRENT_KIND" ]]; then
      RESOURCE_KINDS+=("$CURRENT_KIND")
      RESOURCE_NAMES+=("${CURRENT_NAME:-unnamed}")
    fi
    CURRENT_KIND=""
    CURRENT_NAME=""
  fi
done <<< "$CONTENT"

# Save last resource
if [[ -n "$CURRENT_KIND" ]]; then
  RESOURCE_KINDS+=("$CURRENT_KIND")
  RESOURCE_NAMES+=("${CURRENT_NAME:-unnamed}")
fi

# --- Pod-level security checks (apply to workload kinds) ---
WORKLOAD_KINDS="Deployment|StatefulSet|DaemonSet|Job|CronJob|Pod"

for i in "${!RESOURCE_KINDS[@]}"; do
  KIND="${RESOURCE_KINDS[$i]}"
  NAME="${RESOURCE_NAMES[$i]}"

  # Only check workload resources for security
  if ! echo "$KIND" | grep -qE "^($WORKLOAD_KINDS)$"; then
    continue
  fi

  # Extract the section of YAML for this resource (between --- markers)
  # For simplicity, we grep the full content for patterns per resource

  # KA-C001: Privileged container
  if echo "$CONTENT" | grep -qE '^\s*privileged:\s*true'; then
    VIOLATIONS+=("$KIND/$NAME [KA-C001] (error): Container runs as privileged. Remove privileged: true and use specific capabilities.")
  fi

  # KA-C006: Host PID
  if echo "$CONTENT" | grep -qE '^\s*hostPID:\s*true'; then
    VIOLATIONS+=("$KIND/$NAME [KA-C006] (error): Host PID namespace shared. Remove hostPID: true.")
  fi

  # KA-C007: Host IPC
  if echo "$CONTENT" | grep -qE '^\s*hostIPC:\s*true'; then
    VIOLATIONS+=("$KIND/$NAME [KA-C007] (error): Host IPC namespace shared. Remove hostIPC: true.")
  fi

  # KA-C008: Host network
  if echo "$CONTENT" | grep -qE '^\s*hostNetwork:\s*true'; then
    VIOLATIONS+=("$KIND/$NAME [KA-C008] (warning): Host network enabled. Use Services/Ingress instead.")
  fi

  # KA-C014: Sensitive host path
  if echo "$CONTENT" | grep -qE '^\s*path:\s*(/etc|/proc|/sys|/var/run|/root|/var/log)'; then
    VIOLATIONS+=("$KIND/$NAME [KA-C014] (error): Sensitive host path mounted. Use ConfigMaps/Secrets instead.")
  fi

  # KA-C015: Docker socket
  if echo "$CONTENT" | grep -qE '/var/run/docker\.sock'; then
    VIOLATIONS+=("$KIND/$NAME [KA-C015] (error): Docker socket mounted. This grants root-level host access.")
  fi

  # KA-C010: Dangerous capabilities
  if echo "$CONTENT" | grep -qE '^\s*-\s*(SYS_ADMIN|ALL|NET_RAW)'; then
    VIOLATIONS+=("$KIND/$NAME [KA-C010] (error): Dangerous capability added. Remove SYS_ADMIN/ALL/NET_RAW.")
  fi

  # KA-C020: Missing securityContext entirely
  if ! echo "$CONTENT" | grep -qE '^\s*securityContext:'; then
    VIOLATIONS+=("$KIND/$NAME [KA-C020] (warning): Missing securityContext. Add runAsNonRoot, readOnlyRootFilesystem, allowPrivilegeEscalation: false.")
  fi

  # KA-R009: Image uses latest or no tag
  while IFS= read -r IMG_LINE; do
    IMAGE_VAL=$(echo "$IMG_LINE" | sed 's/^[^:]*:\s*//' | xargs)
    # Skip variable references
    if [[ "$IMAGE_VAL" != *'$'* ]]; then
      if [[ "$IMAGE_VAL" != *:* ]] && [[ "$IMAGE_VAL" != *@* ]]; then
        VIOLATIONS+=("$KIND/$NAME [KA-R009] (warning): Image '$IMAGE_VAL' has no version tag. Pin to a specific version.")
      elif [[ "$IMAGE_VAL" == *:latest ]]; then
        VIOLATIONS+=("$KIND/$NAME [KA-R009] (warning): Image uses :latest tag. Pin to a specific version.")
      fi
    fi
  done < <(echo "$CONTENT" | grep -E '^\s*image:\s*\S' || true)

  # KA-B001/B003: Missing resource requests
  if ! echo "$CONTENT" | grep -qE '^\s*requests:'; then
    VIOLATIONS+=("$KIND/$NAME [KA-B001] (warning): Missing resource requests. Add resources.requests.cpu and memory.")
  fi

  # KA-B002/B004: Missing resource limits
  if ! echo "$CONTENT" | grep -qE '^\s*limits:'; then
    VIOLATIONS+=("$KIND/$NAME [KA-B002] (warning): Missing resource limits. Add resources.limits.cpu and memory.")
  fi

  break  # For single-resource manifests, avoid duplicate checking
done

# --- RBAC checks ---
for i in "${!RESOURCE_KINDS[@]}"; do
  KIND="${RESOURCE_KINDS[$i]}"
  NAME="${RESOURCE_NAMES[$i]}"

  if [[ "$KIND" == "Role" ]] || [[ "$KIND" == "ClusterRole" ]]; then
    # KA-A001: Wildcard permissions
    if echo "$CONTENT" | grep -qE '^\s*-\s*"\*"' || echo "$CONTENT" | grep -qE "^\s*-\s*'\*'" || echo "$CONTENT" | grep -qE '^\s*-\s*\*\s*$'; then
      VIOLATIONS+=("$KIND/$NAME [KA-A001] (error): Wildcard permissions detected. Use specific resources and verbs. CIS 5.1.3.")
    fi
  fi

  if [[ "$KIND" == "RoleBinding" ]] || [[ "$KIND" == "ClusterRoleBinding" ]]; then
    # KA-A002: cluster-admin binding
    if echo "$CONTENT" | grep -qE '^\s*name:\s*cluster-admin'; then
      VIOLATIONS+=("$KIND/$NAME [KA-A002] (error): cluster-admin RoleBinding. Use a custom Role with minimal permissions. CIS 5.1.1.")
    fi
  fi
done

# --- Deprecated API version check ---
if echo "$CONTENT" | grep -qE '^\s*apiVersion:\s*(extensions/v1beta1|apps/v1beta1|apps/v1beta2)'; then
  VIOLATIONS+=("[KA-S006] (warning): Deprecated API version detected. Migrate to the current stable API (e.g., apps/v1).")
fi

# --- Report results ---
if [[ ${#VIOLATIONS[@]} -eq 0 ]]; then
  exit 0
fi

# Deduplicate violations
declare -A SEEN
UNIQUE_VIOLATIONS=()
for V in "${VIOLATIONS[@]}"; do
  if [[ -z "${SEEN[$V]+x}" ]]; then
    SEEN["$V"]=1
    UNIQUE_VIOLATIONS+=("$V")
  fi
done

{
  echo "Kubernetes manifest validation found ${#UNIQUE_VIOLATIONS[@]} issue(s) in $FILE_PATH:"
  echo ""
  for V in "${UNIQUE_VIOLATIONS[@]}"; do
    echo "  - $V"
  done
  echo ""
  echo "Fix these issues to improve security and reliability. See https://patrykgolabek.dev/tools/k8s-analyzer/ for full analysis."
} >&2

exit 2
