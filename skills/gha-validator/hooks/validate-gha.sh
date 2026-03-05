#!/usr/bin/env bash
# Hook:    validate-gha.sh
# Author:  Patryk Golabek
# Website: https://patrykgolabek.dev
# Type:    Claude Code PostToolUse hook
#
# Purpose:
#   - Validate GitHub Actions workflow files after file-edit tool calls
#   - Return actionable violations via stderr for Claude feedback
#   - Stay fail-safe (exit 0) for unrelated or malformed hook payloads
#
# Environment:
#   CLAUDE_PROJECT_DIR - set by Claude Code to the project root
#
# Install:
#   1. Copy this file to .claude/hooks/validate-gha.sh
#   2. chmod +x .claude/hooks/validate-gha.sh
#   3. Add the PostToolUse hook config to .claude/settings.json:
#      {
#        "hooks": {
#          "PostToolUse": [{
#            "matcher": "Edit|Write",
#            "hooks": [{
#              "type": "command",
#              "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-gha.sh"
#            }]
#          }]
#        }
#      }
#
# Exit codes (per Claude Code hook contract):
#   0 - file is not a GHA workflow, or workflow passed validation
#   2 - workflow has violations (stderr is sent as feedback to Claude)

set -euo pipefail

# --- Prerequisite checks ---
if ! command -v jq >/dev/null 2>&1; then
  echo "validate-gha.sh: jq is required but not installed." >&2
  exit 1
fi

# --- Read hook input from stdin ---
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# No file path means this isn't a file-editing tool call
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# --- Check if the file is a GitHub Actions workflow ---
# Workflows live in .github/workflows/*.yml or .github/workflows/*.yaml
IS_GHA=false

case "$FILE_PATH" in
  */.github/workflows/*.yml)  IS_GHA=true ;;
  */.github/workflows/*.yaml) IS_GHA=true ;;
  .github/workflows/*.yml)    IS_GHA=true ;;
  .github/workflows/*.yaml)   IS_GHA=true ;;
esac

if [[ "$IS_GHA" != "true" ]]; then
  exit 0
fi

# --- Validate the workflow file ---
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

VIOLATIONS=()

# Read the file content
CONTENT=$(<"$FILE_PATH")

# --- Helper: check if pattern exists in content ---
has_pattern() {
  grep -qE "$1" <<< "$CONTENT"
}

# --- Helper: extract all uses: lines ---
get_uses_lines() {
  grep -nE '^\s*-?\s*uses:\s*' <<< "$CONTENT" || true
}

# --- Top-level checks ---

# GA-C004: Missing permissions block
if ! has_pattern '^\s*permissions:'; then
  VIOLATIONS+=("[GA-C004] (info): No top-level permissions block. Add explicit permissions to restrict GITHUB_TOKEN scope.")
fi

# GA-C003: Overly permissive permissions
if has_pattern '^\s*permissions:\s*write-all'; then
  VIOLATIONS+=("[GA-C003] (warning): Overly permissive permissions (write-all). Declare only specific scopes needed.")
fi

# GA-F004: Missing workflow name
if ! has_pattern '^name:'; then
  VIOLATIONS+=("[GA-F004] (info): Missing workflow name. Add a top-level 'name:' field for better UI display.")
fi

# --- Job-level checks ---
# Extract job names and check for timeout-minutes and concurrency

IN_JOBS=false
CURRENT_JOB=""
JOB_INDENT=""
HAS_TIMEOUT=false
HAS_CONCURRENCY=false
JOB_NAMES=()

# Check for top-level concurrency
if has_pattern '^concurrency:'; then
  HAS_CONCURRENCY=true
fi

LINE_NUM=0
while IFS= read -r LINE || [[ -n "$LINE" ]]; do
  LINE_NUM=$((LINE_NUM + 1))

  # Detect top-level jobs: key
  if [[ "$LINE" =~ ^jobs: ]]; then
    IN_JOBS=true
    continue
  fi

  # Detect a new top-level key (end of jobs block)
  if [[ "$IN_JOBS" == "true" ]] && [[ "$LINE" =~ ^[^[:space:]#].*: ]]; then
    # Save last job
    if [[ -n "$CURRENT_JOB" ]]; then
      JOB_NAMES+=("$CURRENT_JOB")
      if [[ "$HAS_TIMEOUT" != "true" ]]; then
        VIOLATIONS+=("Job '$CURRENT_JOB' [GA-B001] (warning): Missing timeout-minutes. Add timeout-minutes to prevent hung jobs (default is 6 hours).")
      fi
    fi
    IN_JOBS=false
    continue
  fi

  # Inside jobs block, detect job names (2-space indent)
  if [[ "$IN_JOBS" == "true" ]]; then
    if [[ "$LINE" =~ ^[[:space:]]{2}[a-zA-Z_][a-zA-Z0-9_-]*: ]]; then
      # Save previous job
      if [[ -n "$CURRENT_JOB" ]]; then
        JOB_NAMES+=("$CURRENT_JOB")
        if [[ "$HAS_TIMEOUT" != "true" ]]; then
          VIOLATIONS+=("Job '$CURRENT_JOB' [GA-B001] (warning): Missing timeout-minutes. Add timeout-minutes to prevent hung jobs (default is 6 hours).")
        fi
      fi
      CURRENT_JOB=$(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -d: -f1)
      HAS_TIMEOUT=false
    elif [[ -n "$CURRENT_JOB" ]]; then
      # Check for timeout-minutes within the job
      if [[ "$LINE" =~ timeout-minutes ]]; then
        HAS_TIMEOUT=true
      fi
    fi
  fi
done <<< "$CONTENT"

# Save last job
if [[ -n "$CURRENT_JOB" ]]; then
  JOB_NAMES+=("$CURRENT_JOB")
  if [[ "$HAS_TIMEOUT" != "true" ]]; then
    VIOLATIONS+=("Job '$CURRENT_JOB' [GA-B001] (warning): Missing timeout-minutes. Add timeout-minutes to prevent hung jobs (default is 6 hours).")
  fi
fi

# GA-B002: Missing concurrency group
if [[ "$HAS_CONCURRENCY" != "true" ]]; then
  VIOLATIONS+=("[GA-B002] (info): No concurrency group. Add concurrency with cancel-in-progress to avoid redundant runs.")
fi

# GA-F001: Jobs not alphabetically ordered
if [[ ${#JOB_NAMES[@]} -ge 2 ]]; then
  SORTED=($(printf '%s\n' "${JOB_NAMES[@]}" | sort))
  IS_SORTED=true
  for i in "${!JOB_NAMES[@]}"; do
    if [[ "${JOB_NAMES[$i]}" != "${SORTED[$i]}" ]]; then
      IS_SORTED=false
      break
    fi
  done
  if [[ "$IS_SORTED" != "true" ]]; then
    VIOLATIONS+=("[GA-F001] (info): Jobs are not in alphabetical order. Reorder for better readability.")
  fi
fi

# --- Action reference checks ---
while IFS= read -r USES_LINE; do
  [[ -z "$USES_LINE" ]] && continue

  LNUM=$(echo "$USES_LINE" | cut -d: -f1)
  ACTION_REF=$(echo "$USES_LINE" | sed 's/^[^u]*uses:[[:space:]]*//' | sed "s/['\"]//g" | xargs)

  # Skip local actions (./path)
  if [[ "$ACTION_REF" == ./* ]]; then
    continue
  fi

  # Skip docker:// references
  if [[ "$ACTION_REF" == docker://* ]]; then
    continue
  fi

  # GA-C002: Mutable branch tag (@main, @master, @develop, @dev, @HEAD)
  if [[ "$ACTION_REF" =~ @(main|master|develop|dev|HEAD)$ ]]; then
    VIOLATIONS+=("Line $LNUM [GA-C002] (warning): Action '$ACTION_REF' uses mutable branch ref. Pin to a versioned tag or commit SHA.")
    continue
  fi

  # Check if pinned to SHA (40 hex chars after @)
  REF_PART="${ACTION_REF##*@}"
  if [[ "$REF_PART" =~ ^[0-9a-f]{40}$ ]]; then
    # Properly SHA-pinned, skip
    continue
  fi

  # GA-C001: Unpinned action (using semver tag)
  # Determine if first-party (actions/ or github/) or third-party
  OWNER=$(echo "$ACTION_REF" | cut -d/ -f1)
  if [[ "$OWNER" == "actions" ]] || [[ "$OWNER" == "github" ]]; then
    VIOLATIONS+=("Line $LNUM [GA-C001] (warning): Action '$ACTION_REF' not pinned to commit SHA. Pin to full SHA for supply chain security.")
  else
    # GA-C008: Third-party action without SHA pinning (higher risk)
    VIOLATIONS+=("Line $LNUM [GA-C008] (warning): Third-party action '$ACTION_REF' not SHA-pinned. Third-party actions carry higher supply chain risk.")
  fi
done < <(get_uses_lines)

# --- Script injection check ---
# GA-C005: Direct interpolation of user-controlled context in run: blocks
while IFS= read -r RUN_LINE; do
  [[ -z "$RUN_LINE" ]] && continue
  LNUM=$(echo "$RUN_LINE" | cut -d: -f1)
  # Check for dangerous context interpolation
  if echo "$RUN_LINE" | grep -qE '\$\{\{\s*github\.event\.(issue|pull_request|comment|review|discussion|head_commit\.message)'; then
    VIOLATIONS+=("Line $LNUM [GA-C005] (warning): Script injection risk. User-controlled context interpolated in run block. Use env var indirection instead.")
  fi
done < <(grep -nE '^\s*run:.*\$\{\{' <<< "$CONTENT" || true)

# Also check multi-line run blocks
while IFS= read -r RUN_LINE; do
  [[ -z "$RUN_LINE" ]] && continue
  LNUM=$(echo "$RUN_LINE" | cut -d: -f1)
  if echo "$RUN_LINE" | grep -qE '\$\{\{\s*github\.event\.(issue|pull_request|comment|review|discussion|head_commit\.message)'; then
    VIOLATIONS+=("Line $LNUM [GA-C005] (warning): Script injection risk. User-controlled context interpolated in run block. Use env var indirection instead.")
  fi
done < <(grep -nE '\$\{\{\s*github\.event\.' <<< "$CONTENT" | grep -v '^\s*#' | grep -v 'env:' | grep -v 'if:' || true)

# --- Hardcoded secrets check ---
# GA-C007: Common secret patterns
while IFS= read -r SECRET_LINE; do
  [[ -z "$SECRET_LINE" ]] && continue
  LNUM=$(echo "$SECRET_LINE" | cut -d: -f1)
  VIOLATIONS+=("Line $LNUM [GA-C007] (warning): Possible hardcoded secret detected. Use \${{ secrets.* }} instead.")
done < <(grep -nE '(ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+)' <<< "$CONTENT" | grep -v '^\s*#' || true)

# --- Deduplicate violations ---
declare -A SEEN_VIOLATIONS
UNIQUE_VIOLATIONS=()
for V in "${VIOLATIONS[@]}"; do
  if [[ -z "${SEEN_VIOLATIONS[$V]+x}" ]]; then
    SEEN_VIOLATIONS["$V"]=1
    UNIQUE_VIOLATIONS+=("$V")
  fi
done

# --- Report results ---
if [[ ${#UNIQUE_VIOLATIONS[@]} -eq 0 ]]; then
  exit 0
fi

{
  echo "GitHub Actions workflow validation found ${#UNIQUE_VIOLATIONS[@]} issue(s) in $FILE_PATH:"
  echo ""
  for V in "${UNIQUE_VIOLATIONS[@]}"; do
    echo "  - $V"
  done
  echo ""
  echo "Fix these issues to improve security and reliability. See https://patrykgolabek.dev/tools/gha-validator/ for full analysis."
} >&2

exit 2
