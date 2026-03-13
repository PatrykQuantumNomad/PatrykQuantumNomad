# Terminal Recording Guide

Record real Claude Code sessions for the introduction chapter.

## Setup

The `sample-project/` directory is a small Express + JWT app that Claude Code
can read and modify. It's already a git repo so Claude Code will work normally.

## Recording Commands

Each recording uses asciinema. The `.cast` files go straight into `public/recordings/claude-code/`.

### Tips for clean recordings

- **Terminal size**: resize to ~90 cols x 24 rows before recording
- **Clean prompt**: use a simple PS1 if possible (the default zsh prompt works fine)
- **Pace**: type at a natural speed, pause briefly after pressing Enter
  so the viewer can read each step
- **Reset between takes**: `git checkout .` and `git clean -fd` in the sample project
  to reset any Claude Code edits
- After recording, you can trim idle time with `--idle-time-limit 3` on playback,
  but try to keep pauses natural during recording

## Recording 1: Start Session

**Goal**: Show launching Claude Code in a project and asking a question.

```bash
# Start recording
asciinema rec ../public/recordings/claude-code/start-session.cast \
  --cols 90 --rows 24 --overwrite

# Inside the recording:
cd ~/work/git/PatrykQuantumNomad/recordings-workspace/sample-project
claude

# At the Claude Code prompt, type:
# What does the auth middleware do in this project?

# Let Claude read files and respond.
# Once the response is done, press Ctrl+C or type /quit to exit.
# Then press Ctrl+D to stop asciinema.
```

**Reset after**:
```bash
cd sample-project && git checkout . && git clean -fd
```

## Recording 2: Multi-Step Task (Agentic Loop)

**Goal**: Show Claude Code gathering context, editing code, and running tests.

```bash
asciinema rec ../public/recordings/claude-code/multi-step-task.cast \
  --cols 90 --rows 24 --overwrite

# Inside the recording, launch Claude Code in the sample project:
cd ~/work/git/PatrykQuantumNomad/recordings-workspace/sample-project
claude

# At the Claude Code prompt, type:
# Add input validation to the user registration endpoint.
# Validate that email is a valid format and password is at least 8 characters.
# Run the tests to verify.

# Let Claude read files, make edits, and run tests.
# Once done, exit Claude Code and stop asciinema.
```

**Reset after**:
```bash
cd sample-project && git checkout . && git clean -fd
```

## Recording 3: Rewind

**Goal**: Show the /rewind command and checkpoint selection.

You'll need at least 2 completed prompts before using /rewind, so the menu
has entries to choose from. You can either:
- Chain this after Recording 2 (do 2 prompts, then /rewind), or
- Do two quick prompts first:
  1. "What does the auth middleware do?"
  2. "Add a health check endpoint at /api/health"
  3. Then type `/rewind` and walk through the menu

```bash
asciinema rec ../public/recordings/claude-code/rewind-demo.cast \
  --cols 90 --rows 24 --overwrite

# Inside the recording, launch Claude Code and do 2 prompts:
cd ~/work/git/PatrykQuantumNomad/recordings-workspace/sample-project
claude

# Prompt 1: What does the auth middleware do?
# (let it respond)

# Prompt 2: Add a health check endpoint at GET /api/health
# (let it make the edit)

# Now type: /rewind
# Walk through the menu — select a checkpoint, choose "Restore code and conversation"

# Exit and stop recording.
```

**Reset after**:
```bash
cd sample-project && git checkout . && git clean -fd
```

## Recording 4: Slash Commands

**Goal**: Show /help, /cost, and /compact in a live session.

```bash
asciinema rec ../public/recordings/claude-code/slash-commands.cast \
  --cols 90 --rows 24 --overwrite

# Inside the recording:
cd ~/work/git/PatrykQuantumNomad/recordings-workspace/sample-project
claude

# Do one quick question first so there's some context:
# How many routes does this project have?

# Then try each command:
# /help
# (pause to let the user see the output)
# /cost
# (pause)
# /compact
# (pause to see the compression result)

# Exit and stop recording.
```

**Reset after**:
```bash
cd sample-project && git checkout . && git clean -fd
```

## After Recording

1. Verify the cast file plays correctly:
   ```bash
   asciinema play public/recordings/claude-code/start-session.cast
   ```

2. Check file sizes — they should be small (5-50KB per recording):
   ```bash
   ls -lh public/recordings/claude-code/*.cast
   ```

3. The site will pick them up automatically — the TerminalRecording components
   in the introduction MDX already reference these filenames.

4. Update the transcripts in `introduction.mdx` to match the actual recording
   content (the current transcripts reflect the programmatic demos).

## Quick Reference

| Recording | File | Section in Guide |
|-----------|------|-----------------|
| Start Session | `start-session.cast` | Your First Session |
| Multi-Step Task | `multi-step-task.cast` | Your First Session |
| Rewind | `rewind-demo.cast` | Checkpoints and Undo |
| Slash Commands | `slash-commands.cast` | Slash Commands Quick Reference |
