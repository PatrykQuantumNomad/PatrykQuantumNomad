#!/bin/bash
# Helper script for recording Claude Code demos.
#
# Usage:
#   ./record.sh <recording-name>    # record a demo
#   ./record.sh setup <name>        # set up fixtures for a recording
#   ./record.sh reset               # reset sample project to clean state
#   ./record.sh play <name>         # play back a recording
#   ./record.sh list                # list existing recordings
#   ./record.sh info <name>         # show recording instructions

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/sample-project"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"
OUTPUT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/public/recordings/claude-code"

COLS=90
ROWS=24

# Per-recording row overrides (recordings that need taller terminals)
rows_for() {
  case "$1" in
    context-window) echo 45 ;;
    *)              echo "$ROWS" ;;
  esac
}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# All valid recording names
ALL_RECORDINGS=(
  # Introduction (already recorded)
  start-session multi-step-task rewind-demo slash-commands
  # Context Management
  context-claude-md context-memory context-window
  # Hooks
  hooks-block hooks-lifecycle
  # Worktrees & Subagents
  worktree-session subagent-custom
  # Remote & Headless
  headless-pipe headless-continue
)

usage() {
  echo -e "${CYAN}${BOLD}Claude Code Recording Helper${NC}"
  echo ""
  echo "Usage: ./record.sh <command> [args]"
  echo ""
  echo -e "${BOLD}Commands:${NC}"
  echo "  <name>             Record a demo (see names below)"
  echo "  setup <name>       Set up fixtures before recording"
  echo "  reset              Reset sample project to clean git state"
  echo "  play <name>        Play back a recording"
  echo "  list               List existing recordings"
  echo "  info <name>        Show detailed recording instructions"
  echo ""
  echo -e "${BOLD}Introduction:${NC} ${DIM}(already recorded)${NC}"
  echo "  start-session      Launching Claude Code, asking a question"
  echo "  multi-step-task    Gather → action → verify loop"
  echo "  rewind-demo        Using /rewind to restore a checkpoint"
  echo "  slash-commands     /help, /cost, /compact tour"
  echo ""
  echo -e "${BOLD}Context Management:${NC}"
  echo "  context-claude-md  CLAUDE.md hierarchy and project conventions"
  echo "  context-memory     Auto-memory persisting across sessions"
  echo "  context-window     /context, /compact, /clear in action"
  echo ""
  echo -e "${BOLD}Hooks:${NC}"
  echo "  hooks-block        PreToolUse blocking a dangerous command"
  echo "  hooks-lifecycle    Session lifecycle events firing"
  echo ""
  echo -e "${BOLD}Worktrees & Subagents:${NC}"
  echo "  worktree-session   Isolated worktree session"
  echo "  subagent-custom    Custom AGENT.md with restricted tools"
  echo ""
  echo -e "${BOLD}Remote & Headless:${NC}"
  echo "  headless-pipe      Headless mode with -p and JSON output"
  echo "  headless-continue  Stateful headless sessions"
  echo ""
  echo -e "${YELLOW}Workflow: ./record.sh setup <name> → ./record.sh <name> → ./record.sh reset${NC}"
}

# --- Setup functions ---

setup_context_claude_md() {
  reset_project
  cp "$FIXTURES_DIR/context/CLAUDE.md" "$PROJECT_DIR/CLAUDE.md"
  cd "$PROJECT_DIR" && git add CLAUDE.md && git commit -m "add CLAUDE.md"
  echo -e "${GREEN}Setup done: CLAUDE.md added to sample-project${NC}"
}

setup_context_memory() {
  reset_project
  echo -e "${GREEN}Setup done: clean project (memory will be created during recording)${NC}"
}

setup_context_window() {
  reset_project
  cp "$FIXTURES_DIR/context/CLAUDE.md" "$PROJECT_DIR/CLAUDE.md"
  cd "$PROJECT_DIR" && git add CLAUDE.md && git commit -m "add CLAUDE.md"
  echo -e "${GREEN}Setup done: CLAUDE.md added for context${NC}"
}

setup_hooks_block() {
  reset_project
  mkdir -p "$PROJECT_DIR/.claude/hooks"
  cp "$FIXTURES_DIR/hooks/settings.json" "$PROJECT_DIR/.claude/settings.json"
  cp "$FIXTURES_DIR/hooks/block-rm.sh" "$PROJECT_DIR/.claude/hooks/block-rm.sh"
  chmod +x "$PROJECT_DIR/.claude/hooks/block-rm.sh"
  echo -e "${GREEN}Setup done: PreToolUse blocking hook configured${NC}"
  echo -e "${DIM}Hook script: .claude/hooks/block-rm.sh${NC}"
  echo -e "${DIM}Hook blocks: rm -rf and rm -r commands${NC}"
}

setup_hooks_lifecycle() {
  reset_project
  mkdir -p "$PROJECT_DIR/.claude/hooks"
  cp "$FIXTURES_DIR/hooks/lifecycle-settings.json" "$PROJECT_DIR/.claude/settings.json"
  cp "$FIXTURES_DIR/hooks/log-tool.sh" "$PROJECT_DIR/.claude/hooks/log-tool.sh"
  chmod +x "$PROJECT_DIR/.claude/hooks/log-tool.sh"
  echo -e "${GREEN}Setup done: SessionStart + PreToolUse hooks configured${NC}"
  echo -e "${DIM}Hook script: .claude/hooks/log-tool.sh (fires for ALL tools)${NC}"
}

setup_worktree_session() {
  reset_project
  echo -e "${GREEN}Setup done: clean project (worktree created during recording)${NC}"
}

setup_subagent_custom() {
  reset_project
  mkdir -p "$PROJECT_DIR/.claude/agents"
  cp "$FIXTURES_DIR/worktrees/AGENT.md" "$PROJECT_DIR/.claude/agents/security-reviewer.md"
  echo -e "${GREEN}Setup done: security-reviewer agent added to .claude/agents/${NC}"
}

setup_headless_pipe() {
  reset_project
  echo -e "${GREEN}Setup done: clean project for headless demo${NC}"
}

setup_headless_continue() {
  reset_project
  echo -e "${GREEN}Setup done: clean project for headless continue demo${NC}"
}

# --- Info functions (detailed recording instructions) ---

info() {
  local name="$1"
  echo ""
  echo -e "${CYAN}${BOLD}Recording: $name${NC}"
  echo -e "${DIM}─────────────────────────────────────────────${NC}"

  case "$name" in

  context-claude-md)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show CLAUDE.md being read at startup and influencing behavior."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup context-claude-md"
    echo ""
    echo -e "${BOLD}Steps:${NC}"
    echo "  1. cd sample-project"
    echo "  2. cat CLAUDE.md           (show the file exists)"
    echo "  3. claude"
    echo ""
    echo -e "${BOLD}Prompt:${NC}"
    echo -e "  ${YELLOW}Add a GET /api/users endpoint that returns a list of users.${NC}"
    echo -e "  ${YELLOW}Follow the project conventions in CLAUDE.md.${NC}"
    echo ""
    echo "  Claude should read CLAUDE.md, notice the conventions (JSDoc, camelCase,"
    echo "  test requirement), and follow them when creating the endpoint."
    echo ""
    echo "  Once done, /quit and Ctrl+D."
    ;;

  context-memory)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show auto-memory persisting a preference across sessions."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup context-memory"
    echo ""
    echo -e "${BOLD}Steps:${NC}"
    echo "  1. cd sample-project"
    echo "  2. claude"
    echo ""
    echo -e "${BOLD}Prompt 1 (teach a preference):${NC}"
    echo -e "  ${YELLOW}Remember: in this project always use pnpm instead of npm.${NC}"
    echo ""
    echo "  Claude acknowledges and saves to auto-memory."
    echo ""
    echo -e "${BOLD}Command 2 (show memory layers):${NC}"
    echo -e "  ${YELLOW}/memory${NC}"
    echo ""
    echo "  The menu shows 4 layers: parent CLAUDE.md, user memory,"
    echo "  project memory, and auto-memory folder."
    echo "  PAUSE here so the viewer can read the menu (2-3 seconds)."
    echo "  Then press Esc to cancel — do NOT open the folder"
    echo "  (that would leave the terminal)."
    echo ""
    echo -e "${BOLD}Command 3 (exit session):${NC}"
    echo -e "  ${YELLOW}/quit${NC}"
    echo ""
    echo -e "${BOLD}Step 4 (prove it persists — start a NEW session):${NC}"
    echo "  claude"
    echo ""
    echo -e "${BOLD}Prompt 5 (test the memory):${NC}"
    echo -e "  ${YELLOW}Install express-validator as a dependency${NC}"
    echo ""
    echo "  Claude should run 'pnpm add express-validator' (not npm install)."
    echo "  This proves the pnpm preference survived across sessions."
    echo ""
    echo "  Then /quit and Ctrl+D."
    ;;

  context-window)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show /context, /compact, and /clear managing the context window."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup context-window"
    echo ""
    echo -e "${BOLD}Steps:${NC}"
    echo "  1. cd sample-project"
    echo "  2. claude"
    echo ""
    echo -e "${BOLD}Prompt 1 (fill some context):${NC}"
    echo -e "  ${YELLOW}Explain the entire project architecture — every file and its purpose.${NC}"
    echo ""
    echo "  Let Claude read all files and give a thorough response."
    echo ""
    echo -e "${BOLD}Command 2:${NC}"
    echo -e "  ${YELLOW}/context${NC}"
    echo ""
    echo "  Shows the colored token usage grid. Pause to let the viewer see it."
    echo ""
    echo -e "${BOLD}Command 3:${NC}"
    echo -e "  ${YELLOW}/compact focus on the auth middleware${NC}"
    echo ""
    echo "  Shows compression with a focus instruction. Note the before/after tokens."
    echo ""
    echo -e "${BOLD}Command 4:${NC}"
    echo -e "  ${YELLOW}/clear${NC}"
    echo ""
    echo "  Resets everything. Pause to see the confirmation."
    echo ""
    echo "  Then /quit and Ctrl+D."
    ;;

  hooks-block)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show a PreToolUse hook blocking a dangerous command."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup hooks-block"
    echo ""
    echo -e "${BOLD}Steps:${NC}"
    echo "  1. cd sample-project"
    echo "  2. cat .claude/settings.json   (show the hook config)"
    echo "  3. claude"
    echo ""
    echo -e "${BOLD}Prompt 1 (trigger the block):${NC}"
    echo -e "  ${YELLOW}Clean up all temporary files by running rm -rf /tmp/my-app-cache${NC}"
    echo ""
    echo "  The PreToolUse hook should BLOCK the rm -rf command."
    echo "  Claude will see the block message and should suggest a safer alternative."
    echo ""
    echo -e "${BOLD}Prompt 2 (safe command goes through):${NC}"
    echo -e "  ${YELLOW}List all TypeScript files in the project${NC}"
    echo ""
    echo "  This should work normally (no block), showing the hook only"
    echo "  intervenes for dangerous commands."
    echo ""
    echo "  Then /quit and Ctrl+D."
    ;;

  hooks-lifecycle)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show SessionStart and PreToolUse hooks firing in sequence."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup hooks-lifecycle"
    echo ""
    echo -e "${BOLD}Steps:${NC}"
    echo "  1. cd sample-project"
    echo "  2. claude"
    echo ""
    echo "  Watch for the SessionStart hook message at startup."
    echo ""
    echo -e "${BOLD}Prompt:${NC}"
    echo -e "  ${YELLOW}Check if there are any TODO comments in the codebase${NC}"
    echo ""
    echo "  Claude will run Bash/Grep commands. For each, the PreToolUse hook fires"
    echo "  and prints an approval message. This shows the lifecycle in action."
    echo ""
    echo "  Then /quit and Ctrl+D."
    ;;

  worktree-session)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show an isolated worktree session."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup worktree-session"
    echo ""
    echo -e "${BOLD}Steps:${NC}"
    echo "  1. cd sample-project"
    echo "  2. claude --worktree feature-logging"
    echo ""
    echo "  Claude starts in an isolated copy of the repo."
    echo ""
    echo -e "${BOLD}Prompt:${NC}"
    echo -e "  ${YELLOW}Add request logging middleware that logs method, path, and status code${NC}"
    echo ""
    echo "  Let Claude create the file and wire it up. Then:"
    echo ""
    echo -e "${BOLD}Verify isolation:${NC}"
    echo "  After Claude finishes, /quit."
    echo "  Then run: ls src/middleware/"
    echo "  Show that the original project does NOT have the logging file."
    echo "  Then: ls .claude/worktrees/"
    echo "  Show the worktree directory exists."
    echo ""
    echo "  Ctrl+D to stop recording."
    ;;

  subagent-custom)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show a custom AGENT.md subagent with restricted tools."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup subagent-custom"
    echo ""
    echo -e "${BOLD}Steps:${NC}"
    echo "  1. cd sample-project"
    echo "  2. cat .claude/agents/security-reviewer.md   (show the agent definition)"
    echo "  3. claude"
    echo ""
    echo -e "${BOLD}Prompt:${NC}"
    echo -e "  ${YELLOW}Use the security-reviewer agent to review src/routes/auth.ts${NC}"
    echo ""
    echo "  Claude should spawn the subagent. The subagent can only Read, Glob, Grep"
    echo "  (no Edit, no Bash). It should find issues like:"
    echo "  - No input validation on registration"
    echo "  - Password stored in plain text (no hashing)"
    echo "  - JWT_SECRET from env could be undefined"
    echo ""
    echo "  Then /quit and Ctrl+D."
    ;;

  headless-pipe)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show headless mode with -p flag and JSON output."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup headless-pipe"
    echo ""
    echo -e "${BOLD}Steps (no interactive claude session — all shell commands):${NC}"
    echo "  1. cd sample-project"
    echo ""
    echo -e "${BOLD}Command 1 (text output):${NC}"
    echo -e "  ${YELLOW}claude -p 'List all exported functions in this project'${NC}"
    echo ""
    echo "  Shows Claude running headlessly and printing the result."
    echo ""
    echo -e "${BOLD}Command 2 (JSON output):${NC}"
    echo -e "  ${YELLOW}claude -p 'How many TypeScript files are in src/?' --output-format json | jq .${NC}"
    echo ""
    echo "  Shows structured JSON output piped to jq."
    echo ""
    echo -e "${BOLD}Command 3 (piped into another tool):${NC}"
    echo -e "  ${YELLOW}claude -p 'Generate a one-line summary of this project' | cat -n${NC}"
    echo ""
    echo "  Shows output piped to another command."
    echo ""
    echo "  Ctrl+D to stop recording."
    ;;

  headless-continue)
    echo ""
    echo -e "${BOLD}Goal:${NC} Show stateful headless sessions with --continue."
    echo ""
    echo -e "${BOLD}Setup:${NC} ./record.sh setup headless-continue"
    echo ""
    echo -e "${BOLD}Steps:${NC}"
    echo "  1. cd sample-project"
    echo ""
    echo -e "${BOLD}Command 1 (first prompt):${NC}"
    echo -e "  ${YELLOW}claude -p 'What authentication method does this project use?'${NC}"
    echo ""
    echo "  Claude answers about JWT auth."
    echo ""
    echo -e "${BOLD}Command 2 (continue with follow-up):${NC}"
    echo -e "  ${YELLOW}claude --continue -p 'What are the security risks with that approach?'${NC}"
    echo ""
    echo "  Claude remembers the previous conversation and discusses JWT risks"
    echo "  without needing to re-read the codebase."
    echo ""
    echo "  Ctrl+D to stop recording."
    ;;

  *)
    echo "  No detailed instructions for '$name'."
    echo "  Check RECORDING-GUIDE.md for intro recordings."
    ;;
  esac
  echo ""
}

# --- Core functions ---

reset_project() {
  echo -e "${GREEN}Resetting sample project...${NC}"
  cd "$PROJECT_DIR"
  # Clean up worktrees FIRST (remove dirs before git prune)
  rm -rf "$PROJECT_DIR/.claude/worktrees" 2>/dev/null
  git worktree prune 2>/dev/null
  for branch in $(git branch --list 'worktree-*' 2>/dev/null); do
    git branch -D "$branch" 2>/dev/null
  done
  git checkout . 2>/dev/null
  git clean -fd 2>/dev/null
  # Remove any .claude dir that was added by fixtures
  rm -rf "$PROJECT_DIR/.claude" 2>/dev/null
  rm -f "$PROJECT_DIR/CLAUDE.md" 2>/dev/null
  echo -e "${GREEN}Done. Project is clean.${NC}"
}

setup() {
  local name="$1"
  case "$name" in
    context-claude-md)  setup_context_claude_md ;;
    context-memory)     setup_context_memory ;;
    context-window)     setup_context_window ;;
    hooks-block)        setup_hooks_block ;;
    hooks-lifecycle)    setup_hooks_lifecycle ;;
    worktree-session)   setup_worktree_session ;;
    subagent-custom)    setup_subagent_custom ;;
    headless-pipe)      setup_headless_pipe ;;
    headless-continue)  setup_headless_continue ;;
    *)
      echo "No setup needed for '$name' (or unknown recording)."
      exit 1
      ;;
  esac
}

record() {
  local name="$1"
  local outfile="$OUTPUT_DIR/$name.cast"
  local rows
  rows="$(rows_for "$name")"

  mkdir -p "$OUTPUT_DIR"

  echo -e "${CYAN}${BOLD}Recording: $name${NC}"
  echo -e "Output:    ${outfile}"
  echo -e "Terminal:  ${COLS}x${rows}"
  echo ""
  echo -e "${YELLOW}Press Ctrl+D when done to stop recording.${NC}"
  echo ""

  cd "$SCRIPT_DIR"

  asciinema rec "$outfile" \
    --cols "$COLS" \
    --rows "$rows" \
    --overwrite

  if [ -f "$outfile" ]; then
    local size
    size=$(du -h "$outfile" | cut -f1)
    echo ""
    echo -e "${GREEN}Saved: $outfile ($size)${NC}"
    echo -e "Play:  asciinema play $outfile"
  fi
}

play() {
  local name="$1"
  local file="$OUTPUT_DIR/$name.cast"
  if [ ! -f "$file" ]; then
    echo "Not found: $file"
    exit 1
  fi
  asciinema play "$file" --idle-time-limit 3
}

list_recordings() {
  echo -e "${CYAN}Recordings in $OUTPUT_DIR:${NC}"
  echo ""
  if ls "$OUTPUT_DIR"/*.cast 1>/dev/null 2>&1; then
    ls -lh "$OUTPUT_DIR"/*.cast
  else
    echo "  (none)"
  fi
}

# --- Validation ---

is_valid_recording() {
  local name="$1"
  for r in "${ALL_RECORDINGS[@]}"; do
    [[ "$r" == "$name" ]] && return 0
  done
  return 1
}

# --- Main ---

if [ $# -eq 0 ]; then
  usage
  exit 0
fi

case "$1" in
  setup)
    if [ $# -lt 2 ]; then
      echo "Usage: ./record.sh setup <name>"
      exit 1
    fi
    setup "$2"
    ;;
  reset)
    reset_project
    ;;
  play)
    if [ $# -lt 2 ]; then
      echo "Usage: ./record.sh play <name>"
      exit 1
    fi
    play "$2"
    ;;
  list)
    list_recordings
    ;;
  info)
    if [ $# -lt 2 ]; then
      echo "Usage: ./record.sh info <name>"
      exit 1
    fi
    info "$2"
    ;;
  -h|--help)
    usage
    ;;
  *)
    if is_valid_recording "$1"; then
      record "$1"
    else
      echo "Unknown command or recording: $1"
      echo ""
      usage
      exit 1
    fi
    ;;
esac
