#!/usr/bin/env bash
# Hook:    validate-dockerfile.sh
# Author:  Patryk Golabek
# Website: https://patrykgolabek.dev
# Type:    Claude Code PostToolUse hook
#
# Purpose:
#   - Validate Dockerfiles after file-edit tool calls
#   - Return actionable violations via stderr for Claude feedback
#   - Stay fail-safe (exit 0) for unrelated or malformed hook payloads
#
# Environment:
#   CLAUDE_PROJECT_DIR — set by Claude Code to the project root
#
# Install:
#   1. Copy this file to .claude/hooks/validate-dockerfile.sh
#   2. chmod +x .claude/hooks/validate-dockerfile.sh
#   3. Add the PostToolUse hook config to .claude/settings.json:
#      {
#        "hooks": {
#          "PostToolUse": [{
#            "matcher": "Edit|Write",
#            "hooks": [{
#              "type": "command",
#              "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-dockerfile.sh"
#            }]
#          }]
#        }
#      }
#
# Exit codes (per Claude Code hook contract):
#   0 — file is not a Dockerfile, or Dockerfile passed validation
#   2 — Dockerfile has violations (stderr is sent as feedback to Claude)

set -euo pipefail

# --- Prerequisite checks ---
# Exit 1 (not 2) so Claude Code logs the error but doesn't treat it as a
# validation block — exit 2 would send stderr as feedback to the model.
if ! command -v jq >/dev/null 2>&1; then
  echo "validate-dockerfile.sh: jq is required but not installed." >&2
  exit 1
fi

# --- Read hook input from stdin ---
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# No file path means this isn't a file-editing tool call
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# --- Check if the file is a Dockerfile ---
BASENAME=$(basename "$FILE_PATH")
DIRNAME=$(dirname "$FILE_PATH")

IS_DOCKERFILE=false

# Match: Dockerfile, Dockerfile.*, *.dockerfile, *.Dockerfile
case "$BASENAME" in
  Dockerfile)          IS_DOCKERFILE=true ;;
  Dockerfile.*)        IS_DOCKERFILE=true ;;
  *.dockerfile)        IS_DOCKERFILE=true ;;
  *.Dockerfile)        IS_DOCKERFILE=true ;;
esac

# Also check for Dockerfiles inside a docker/ or .docker/ directory
if [[ "$DIRNAME" == *docker* ]] && [[ "$BASENAME" == Dockerfile* ]]; then
  IS_DOCKERFILE=true
fi

if [[ "$IS_DOCKERFILE" != "true" ]]; then
  exit 0
fi

# --- Validate the Dockerfile ---
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

VIOLATIONS=()

# --- Pre-process: join continuation lines for multi-line instruction support ---
# Produces an array of logical lines with their starting line numbers.
LOGICAL_LINES=()
LOGICAL_LINE_NUMS=()
BUFFER=""
BUFFER_START=0
LINE_NUM=0

while IFS= read -r LINE || [[ -n "$LINE" ]]; do
  LINE_NUM=$((LINE_NUM + 1))

  if [[ -z "$BUFFER" ]]; then
    BUFFER_START=$LINE_NUM
  fi

  # Strip trailing backslash-continuation and accumulate
  if [[ "$LINE" == *'\' ]]; then
    BUFFER+="${LINE%\\} "
    continue
  fi

  BUFFER+="$LINE"
  LOGICAL_LINES+=("$BUFFER")
  LOGICAL_LINE_NUMS+=("$BUFFER_START")
  BUFFER=""
done < "$FILE_PATH"

# Flush any remaining buffer (file ended mid-continuation)
if [[ -n "$BUFFER" ]]; then
  LOGICAL_LINES+=("$BUFFER")
  LOGICAL_LINE_NUMS+=("$BUFFER_START")
fi

# --- Track state for multi-stage and consecutive-RUN detection ---
LAST_INSTRUCTION=""        # previous instruction keyword (for DL3059)
FINAL_STAGE_USER=""        # USER in the current (final) stage

for i in "${!LOGICAL_LINES[@]}"; do
  FULL_LINE="${LOGICAL_LINES[$i]}"
  LN="${LOGICAL_LINE_NUMS[$i]}"

  # Trim leading/trailing whitespace
  TRIMMED="${FULL_LINE#"${FULL_LINE%%[![:space:]]*}"}"
  TRIMMED="${TRIMMED%"${TRIMMED##*[![:space:]]}"}"

  # Skip empty lines and comments
  [[ -z "$TRIMMED" ]] && continue
  [[ "$TRIMMED" == \#* ]] && continue

  # Extract the instruction keyword (lowercased for matching)
  KEYWORD="${TRIMMED%% *}"
  KEYWORD_LOWER="${KEYWORD,,}"

  # --- Track FROM boundaries for multi-stage builds ---
  if [[ "$KEYWORD_LOWER" == "from" ]]; then
    FINAL_STAGE_USER=""  # reset per-stage tracking

    IMAGE=$(echo "$TRIMMED" | awk '{print $2}')
    # Skip scratch, build args, and stage aliases
    if [[ "$IMAGE" != "scratch" ]] && [[ "$IMAGE" != *'$'* ]]; then
      if [[ "$IMAGE" != *:* ]] && [[ "$IMAGE" != *@* ]]; then
        VIOLATIONS+=("Line $LN — DL3006 (warning): FROM $IMAGE has no version tag. Pin to a specific version for reproducible builds.")
      elif [[ "$IMAGE" == *:latest* ]]; then
        VIOLATIONS+=("Line $LN — DL3007 (warning): Do not use the :latest tag. Pin to a specific version.")
      fi
    fi
    LAST_INSTRUCTION="from"
    continue
  fi

  # --- Track USER per stage (for DL3002 multi-stage fix) ---
  if [[ "$KEYWORD_LOWER" == "user" ]]; then
    FINAL_STAGE_USER=$(echo "$TRIMMED" | awk '{print $2}')
  fi

  # --- DL4000: MAINTAINER is deprecated ---
  if [[ "$KEYWORD_LOWER" == "maintainer" ]]; then
    VIOLATIONS+=("Line $LN — DL4000 (error): MAINTAINER is deprecated. Use LABEL maintainer=\"...\" instead.")
  fi

  # --- DL3004: Do not use sudo ---
  if [[ "$KEYWORD_LOWER" == "run" ]]; then
    BODY="${TRIMMED#* }"
    if [[ "$BODY" == *sudo* ]]; then
      # Confirm it's the word "sudo", not part of another word
      if echo "$BODY" | grep -qw 'sudo'; then
        VIOLATIONS+=("Line $LN — DL3004 (error): Do not use sudo. Builds run as root by default.")
      fi
    fi
  fi

  # --- DL3020: Use COPY instead of ADD ---
  if [[ "$KEYWORD_LOWER" == "add" ]]; then
    # Flag ADD with remote URLs (should use curl/wget + COPY instead)
    if [[ "$TRIMMED" == *http://* ]] || [[ "$TRIMMED" == *https://* ]]; then
      VIOLATIONS+=("Line $LN — DL3020 (error): Do not use ADD for remote URLs. Use curl/wget to download with checksum verification, then COPY the file.")
    # Flag ADD for local files (should use COPY)
    elif [[ "$TRIMMED" != *".tar"* ]] && [[ "$TRIMMED" != *".gz"* ]] && [[ "$TRIMMED" != *".bz2"* ]] && [[ "$TRIMMED" != *".xz"* ]] && [[ "$TRIMMED" != *".zip"* ]]; then
      VIOLATIONS+=("Line $LN — DL3020 (error): Use COPY instead of ADD for local files. ADD has implicit archive extraction behavior.")
    fi
  fi

  # --- DL3000: Use absolute WORKDIR ---
  if [[ "$KEYWORD_LOWER" == "workdir" ]]; then
    DIR=$(echo "$TRIMMED" | awk '{print $2}')
    if [[ "$DIR" != /* ]] && [[ "$DIR" != '$'* ]]; then
      VIOLATIONS+=("Line $LN — DL3000 (error): Use an absolute path for WORKDIR. Got: $DIR")
    fi
  fi

  # --- PG001: Secrets in ENV or ARG ---
  if [[ "$KEYWORD_LOWER" == "env" ]] || [[ "$KEYWORD_LOWER" == "arg" ]]; then
    BODY="${TRIMMED#* }"
    # Check each key=value pair on the line individually
    while IFS= read -r KV_PAIR; do
      [[ -z "$KV_PAIR" ]] && continue
      KV_KEY="${KV_PAIR%%=*}"
      KV_KEY_UPPER="${KV_KEY^^}"
      if [[ "$KV_KEY_UPPER" == *PASSWORD* ]] || [[ "$KV_KEY_UPPER" == *SECRET* ]] || \
         [[ "$KV_KEY_UPPER" == *API_KEY* ]] || [[ "$KV_KEY_UPPER" == *TOKEN* ]] || \
         [[ "$KV_KEY_UPPER" == *PRIVATE_KEY* ]] || [[ "$KV_KEY_UPPER" == *AWS_ACCESS* ]] || \
         [[ "$KV_KEY_UPPER" == *AWS_SECRET* ]]; then
        KV_VAL="${KV_PAIR#*=}"
        # Skip empty values, variable references, and placeholder quotes
        if [[ -n "$KV_VAL" ]] && [[ "$KV_VAL" != '$'* ]] && \
           [[ "$KV_VAL" != '""' ]] && [[ "$KV_VAL" != "''" ]]; then
          VIOLATIONS+=("Line $LN — PG001 (error): Possible hardcoded secret in $KV_KEY. Use Docker build secrets or runtime environment injection.")
          break  # one violation per line is enough
        fi
      fi
    done <<< "$(echo "$BODY" | grep -oE '[A-Za-z_][A-Za-z0-9_]*=[^ ]*')"
  fi

  # --- PG002: Avoid piping curl/wget to shell (now works with multi-line RUN) ---
  if [[ "$KEYWORD_LOWER" == "run" ]]; then
    BODY="${TRIMMED#* }"
    if [[ "$BODY" == *curl* ]] || [[ "$BODY" == *wget* ]]; then
      if echo "$BODY" | grep -qE '\|\s*(bash|sh|zsh)'; then
        VIOLATIONS+=("Line $LN — PG002 (error): Avoid piping remote scripts to shell. Download first, verify checksum, then execute.")
      fi
    fi
  fi

  # --- DL3011: Valid UNIX ports range from 0 to 65535 ---
  if [[ "$KEYWORD_LOWER" == "expose" ]]; then
    BODY="${TRIMMED#* }"
    for PORT_TOKEN in $BODY; do
      # Strip protocol suffix (e.g., 8080/tcp → 8080)
      PORT_NUM="${PORT_TOKEN%%/*}"
      # Skip variable references
      [[ "$PORT_NUM" == *'$'* ]] && continue
      # Check if numeric and in range
      if [[ "$PORT_NUM" =~ ^[0-9]+$ ]] && [[ "$PORT_NUM" -gt 65535 ]]; then
        VIOLATIONS+=("Line $LN — DL3011 (error): Invalid port $PORT_NUM. Valid range is 0-65535.")
      fi
    done
  fi

  # --- DL3025: Use JSON notation for CMD and ENTRYPOINT ---
  if [[ "$KEYWORD_LOWER" == "cmd" ]] || [[ "$KEYWORD_LOWER" == "entrypoint" ]]; then
    BODY="${TRIMMED#* }"
    BODY_TRIMMED="${BODY#"${BODY%%[![:space:]]*}"}"
    # Shell form: doesn't start with [
    if [[ "$BODY_TRIMMED" != "["* ]]; then
      # Skip if the command uses variable substitution (JSON form can't expand vars)
      if [[ "$BODY_TRIMMED" != *'$'* ]]; then
        VIOLATIONS+=("Line $LN — DL3025 (warning): Use JSON notation for ${KEYWORD^^} (e.g., ${KEYWORD^^} [\"cmd\", \"arg\"]). Shell form prevents proper signal handling.")
      fi
    fi
  fi

  # --- DL3059: Multiple consecutive RUN instructions ---
  if [[ "$KEYWORD_LOWER" == "run" ]] && [[ "$LAST_INSTRUCTION" == "run" ]]; then
    VIOLATIONS+=("Line $LN — DL3059 (info): Consecutive RUN instructions. Combine with && to reduce image layers.")
  fi

  # --- DL3009: Delete apt-get lists after installing ---
  if [[ "$KEYWORD_LOWER" == "run" ]]; then
    BODY="${TRIMMED#* }"
    if [[ "$BODY" == *"apt-get update"* ]]; then
      if [[ "$BODY" != *"/var/lib/apt/lists"* ]]; then
        VIOLATIONS+=("Line $LN — DL3009 (info): apt-get update without cleaning lists. Add && rm -rf /var/lib/apt/lists/* in the same RUN.")
      fi
    fi
  fi

  # Track last instruction for consecutive-RUN detection (skip comments)
  LAST_INSTRUCTION="$KEYWORD_LOWER"

done

# --- Multi-line checks (need full file context) ---

# DL4003: Multiple CMD instructions (count across logical lines)
CMD_COUNT=0
for LINE in "${LOGICAL_LINES[@]}"; do
  KW="${LINE#"${LINE%%[![:space:]]*}"}"
  KW="${KW%% *}"
  [[ "${KW,,}" == "cmd" ]] && CMD_COUNT=$((CMD_COUNT + 1))
done
if [[ "$CMD_COUNT" -gt 1 ]]; then
  VIOLATIONS+=("DL4003 (warning): Multiple CMD instructions found ($CMD_COUNT). Only the last one takes effect.")
fi

# DL4004: Multiple ENTRYPOINT instructions
EP_COUNT=0
for LINE in "${LOGICAL_LINES[@]}"; do
  KW="${LINE#"${LINE%%[![:space:]]*}"}"
  KW="${KW%% *}"
  [[ "${KW,,}" == "entrypoint" ]] && EP_COUNT=$((EP_COUNT + 1))
done
if [[ "$EP_COUNT" -gt 1 ]]; then
  VIOLATIONS+=("DL4004 (error): Multiple ENTRYPOINT instructions found ($EP_COUNT). Only the last one takes effect.")
fi

# DL3002: Last USER should not be root (uses per-stage tracking from the loop)
if [[ -n "$FINAL_STAGE_USER" ]] && [[ "$FINAL_STAGE_USER" == "root" ]]; then
  VIOLATIONS+=("DL3002 (warning): Last USER in the final stage is root. Switch to a non-root user for production security.")
fi

# --- Report results ---
if [[ ${#VIOLATIONS[@]} -eq 0 ]]; then
  exit 0
fi

{
  echo "Dockerfile validation found ${#VIOLATIONS[@]} issue(s) in $FILE_PATH:"
  echo ""
  for V in "${VIOLATIONS[@]}"; do
    echo "  - $V"
  done
  echo ""
  echo "Fix these issues to improve security and reliability. See https://patrykgolabek.dev/tools/dockerfile-analyzer/ for full analysis."
} >&2

exit 2
