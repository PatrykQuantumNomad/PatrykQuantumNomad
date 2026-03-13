#!/bin/bash
# PreToolUse hook: logs every tool call for lifecycle demo.
# No matcher — fires for ALL tools (Read, Grep, Bash, Write, etc.)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')

echo "✓ Hook approved: $TOOL_NAME"
exit 0
