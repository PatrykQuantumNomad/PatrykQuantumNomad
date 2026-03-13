#!/bin/bash
# PreToolUse hook: blocks rm -rf and rm -r commands.
# Exit 0 = allow, Exit 2 = block.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE 'rm\s+-rf|rm\s+-r\s'; then
  echo "BLOCKED: Refusing to run destructive rm command: $COMMAND" >&2
  exit 2
fi

exit 0
