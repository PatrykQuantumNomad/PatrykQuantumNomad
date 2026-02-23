#!/usr/bin/env bash
# Hook:    validate-compose.sh
# Author:  Patryk Golabek
# Website: https://patrykgolabek.dev
# Type:    Claude Code PostToolUse hook
#
# Purpose:
#   - Validate Docker Compose files after file-edit tool calls
#   - Return actionable violations via stderr for Claude feedback
#   - Stay fail-safe (exit 0) for unrelated or malformed hook payloads
#
# Environment:
#   CLAUDE_PROJECT_DIR - set by Claude Code to the project root
#
# Install:
#   1. Copy this file to .claude/hooks/validate-compose.sh
#   2. chmod +x .claude/hooks/validate-compose.sh
#   3. Add the PostToolUse hook config to .claude/settings.json:
#      {
#        "hooks": {
#          "PostToolUse": [{
#            "matcher": "Edit|Write",
#            "hooks": [{
#              "type": "command",
#              "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-compose.sh"
#            }]
#          }]
#        }
#      }
#
# Exit codes (per Claude Code hook contract):
#   0 - file is not a Compose file, or Compose file passed validation
#   2 - Compose file has violations (stderr is sent as feedback to Claude)

set -euo pipefail

# --- Prerequisite checks ---
# Exit 1 (not 2) so Claude Code logs the error but doesn't treat it as a
# validation block. Exit 2 would send stderr as feedback to the model.
if ! command -v jq >/dev/null 2>&1; then
  echo "validate-compose.sh: jq is required but not installed." >&2
  exit 1
fi

# --- Read hook input from stdin ---
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# No file path means this isn't a file-editing tool call
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# --- Check if the file is a Docker Compose file ---
BASENAME=$(basename "$FILE_PATH")
BASENAME_LOWER="${BASENAME,,}"

IS_COMPOSE=false

case "$BASENAME_LOWER" in
  docker-compose.yml)       IS_COMPOSE=true ;;
  docker-compose.yaml)      IS_COMPOSE=true ;;
  docker-compose.*.yml)     IS_COMPOSE=true ;;
  docker-compose.*.yaml)    IS_COMPOSE=true ;;
  compose.yml)              IS_COMPOSE=true ;;
  compose.yaml)             IS_COMPOSE=true ;;
  compose.*.yml)            IS_COMPOSE=true ;;
  compose.*.yaml)           IS_COMPOSE=true ;;
esac

if [[ "$IS_COMPOSE" != "true" ]]; then
  exit 0
fi

# --- Validate the Compose file ---
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

VIOLATIONS=()

# Read the file content
CONTENT=$(<"$FILE_PATH")

# --- Helper: extract all service blocks (name + indented content) ---
# We use a lightweight line parser to avoid external YAML dependencies.

# Track if we're inside the services block
IN_SERVICES=false
CURRENT_SERVICE=""
SERVICE_LINES=""
declare -A SERVICE_CONTENT

LINE_NUM=0
while IFS= read -r LINE || [[ -n "$LINE" ]]; do
  LINE_NUM=$((LINE_NUM + 1))

  # Detect top-level services: key
  if [[ "$LINE" =~ ^services: ]]; then
    IN_SERVICES=true
    continue
  fi

  # Detect a new top-level key (end of services block)
  if [[ "$IN_SERVICES" == "true" ]] && [[ "$LINE" =~ ^[^[:space:]#].*: ]]; then
    if [[ -n "$CURRENT_SERVICE" ]]; then
      SERVICE_CONTENT["$CURRENT_SERVICE"]="$SERVICE_LINES"
    fi
    IN_SERVICES=false
    continue
  fi

  # Inside services block, detect service names (2-space indent, no further indent)
  if [[ "$IN_SERVICES" == "true" ]]; then
    if [[ "$LINE" =~ ^[[:space:]]{2}[a-zA-Z_][a-zA-Z0-9_-]*: ]]; then
      # Save previous service
      if [[ -n "$CURRENT_SERVICE" ]]; then
        SERVICE_CONTENT["$CURRENT_SERVICE"]="$SERVICE_LINES"
      fi
      CURRENT_SERVICE=$(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -d: -f1)
      SERVICE_LINES=""
    elif [[ -n "$CURRENT_SERVICE" ]]; then
      SERVICE_LINES+="$LINE"$'\n'
    fi
  fi
done <<< "$CONTENT"

# Save last service
if [[ -n "$CURRENT_SERVICE" ]]; then
  SERVICE_CONTENT["$CURRENT_SERVICE"]="$SERVICE_LINES"
fi

# --- Check each service ---
for SVC in "${!SERVICE_CONTENT[@]}"; do
  SVC_BODY="${SERVICE_CONTENT[$SVC]}"
  has_pattern() {
    local pattern="$1"
    grep -qE "$pattern" <<< "$SVC_BODY"
  }

  # CV-C001: Privileged mode
  if has_pattern '^\s*privileged:\s*true'; then
    VIOLATIONS+=("Service '$SVC' [CV-C001] (error): Privileged mode enabled. Remove privileged: true and use specific capabilities via cap_add.")
  fi

  # CV-C002: Docker socket mount
  if has_pattern '/var/run/docker\.sock'; then
    VIOLATIONS+=("Service '$SVC' [CV-C002] (error): Docker socket mounted. This grants root-level control over the host Docker daemon.")
  fi

  # CV-C003: Host network mode
  if has_pattern '^\s*network_mode:\s*host'; then
    VIOLATIONS+=("Service '$SVC' [CV-C003] (error): Host network mode bypasses Docker network isolation.")
  fi

  # CV-C004: Host PID mode
  if has_pattern '^\s*pid:\s*host'; then
    VIOLATIONS+=("Service '$SVC' [CV-C004] (error): Host PID mode shares the host PID namespace.")
  fi

  # CV-C005: Host IPC mode
  if has_pattern '^\s*ipc:\s*host'; then
    VIOLATIONS+=("Service '$SVC' [CV-C005] (error): Host IPC mode shares the host IPC namespace.")
  fi

  # CV-C006: Dangerous capabilities (SYS_ADMIN, ALL, NET_ADMIN)
  if has_pattern '^\s*-\s*(SYS_ADMIN|ALL|NET_ADMIN)'; then
    VIOLATIONS+=("Service '$SVC' [CV-C006] (error): Dangerous capability added. Remove SYS_ADMIN/ALL/NET_ADMIN and use minimal capabilities.")
  fi

  # CV-C008: Secrets in environment variables
  if has_pattern '^\s*(PASSWORD|SECRET|API_KEY|TOKEN|PRIVATE_KEY|AWS_ACCESS|AWS_SECRET)[^:]*:\s*\S'; then
    # Check it's not a variable reference
    MATCH=$(grep -iE '^\s*(PASSWORD|SECRET|API_KEY|TOKEN|PRIVATE_KEY|AWS_ACCESS|AWS_SECRET)[^:]*:\s*\S' <<< "$SVC_BODY" | head -1)
    VALUE=$(echo "$MATCH" | sed 's/^[^:]*:\s*//')
    if [[ "$VALUE" != '$'* ]] && [[ "$VALUE" != '""' ]] && [[ "$VALUE" != "''" ]]; then
      VIOLATIONS+=("Service '$SVC' [CV-C008] (warning): Possible secret in environment variable. Use Docker secrets or .env files instead.")
    fi
  fi

  # CV-B001: Missing healthcheck
  if ! has_pattern '^\s*healthcheck:'; then
    # Only flag services with an image (skip pure build-only or config-only)
    if has_pattern '^\s*image:'; then
      VIOLATIONS+=("Service '$SVC' [CV-B001] (warning): Missing healthcheck. Add healthcheck for container health monitoring.")
    fi
  fi

  # CV-B002: No restart policy
  if ! has_pattern '^\s*restart:' && ! has_pattern '^\s*restart_policy:'; then
    VIOLATIONS+=("Service '$SVC' [CV-B002] (warning): No restart policy. Add restart: unless-stopped for crash recovery.")
  fi

  # CV-B003: No resource limits
  if ! has_pattern '^\s*limits:'; then
    VIOLATIONS+=("Service '$SVC' [CV-B003] (warning): No resource limits. Add deploy.resources.limits to prevent resource exhaustion.")
  fi

  # CV-C014 / CV-B004: Image not pinned
  IMAGE_LINE=$(grep -E '^\s*image:\s*' <<< "$SVC_BODY" | head -1)
  if [[ -n "$IMAGE_LINE" ]]; then
    IMAGE_VAL=$(echo "$IMAGE_LINE" | sed 's/^[^:]*:\s*//' | xargs)
    # Skip variable references
    if [[ "$IMAGE_VAL" != *'$'* ]]; then
      if [[ "$IMAGE_VAL" != *:* ]] && [[ "$IMAGE_VAL" != *@* ]]; then
        VIOLATIONS+=("Service '$SVC' [CV-C014] (warning): Image '$IMAGE_VAL' has no version tag. Pin to a specific version.")
      elif [[ "$IMAGE_VAL" == *:latest ]]; then
        VIOLATIONS+=("Service '$SVC' [CV-C014] (warning): Image uses :latest tag. Pin to a specific version for reproducibility.")
      fi
    fi
  fi
done

# --- Top-level checks ---

# CV-B006: Deprecated version field
if echo "$CONTENT" | grep -qE '^version:'; then
  VIOLATIONS+=("CV-B006 (warning): Deprecated top-level 'version' field. Remove it. Docker Compose V2 ignores it.")
fi

# --- Report results ---
if [[ ${#VIOLATIONS[@]} -eq 0 ]]; then
  exit 0
fi

{
  echo "Docker Compose validation found ${#VIOLATIONS[@]} issue(s) in $FILE_PATH:"
  echo ""
  for V in "${VIOLATIONS[@]}"; do
    echo "  - $V"
  done
  echo ""
  echo "Fix these issues to improve security and reliability. See https://patrykgolabek.dev/tools/compose-validator/ for full analysis."
} >&2

exit 2
