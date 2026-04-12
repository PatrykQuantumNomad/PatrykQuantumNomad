/**
 * Hook event data for the interactive Hook Event Visualizer (INTV-02).
 *
 * Defines 24 hook events across 3 categories (Session, Loop, Standalone Async)
 * with node/edge definitions for React Flow and detail content for the
 * click-to-reveal panel.
 *
 * All positions are {x:0, y:0} -- dagre handles layout in the component.
 */
import { MarkerType, type Node, type Edge } from '@xyflow/react';

// ---- Types ----

export type EventNodeData = {
  label: string;
  category: 'session' | 'loop' | 'standalone';
  canBlock?: boolean;
};

export type CategoryNodeData = {
  label: string;
  count: number;
};

export interface EventDetail {
  title: string;
  description: string;
  handlerTypes: string[];
  fields: Array<{ key: string; value: string }>;
  configExample: string;
  blockingInfo?: string;
}

// ---- Nodes ----

const pos = { x: 0, y: 0 };

export const rawNodes: Node[] = [
  // Category headers
  {
    id: 'session-events',
    type: 'category',
    position: pos,
    data: { label: 'Session Events', count: 2 },
  },
  {
    id: 'loop-events',
    type: 'category',
    position: pos,
    data: { label: 'Loop Events', count: 15 },
  },
  {
    id: 'standalone-events',
    type: 'category',
    position: pos,
    data: { label: 'Standalone Async Events', count: 7 },
  },

  // Session Events (2)
  {
    id: 'SessionStart',
    type: 'event',
    position: pos,
    data: { label: 'SessionStart', category: 'session' },
  },
  {
    id: 'SessionEnd',
    type: 'event',
    position: pos,
    data: { label: 'SessionEnd', category: 'session' },
  },

  // Loop Events (12)
  {
    id: 'UserPromptSubmit',
    type: 'event',
    position: pos,
    data: { label: 'UserPromptSubmit', category: 'loop' },
  },
  {
    id: 'PreToolUse',
    type: 'event',
    position: pos,
    data: { label: 'PreToolUse', category: 'loop', canBlock: true },
  },
  {
    id: 'PermissionRequest',
    type: 'event',
    position: pos,
    data: { label: 'PermissionRequest', category: 'loop' },
  },
  {
    id: 'PostToolUse',
    type: 'event',
    position: pos,
    data: { label: 'PostToolUse', category: 'loop' },
  },
  {
    id: 'PostToolUseFailure',
    type: 'event',
    position: pos,
    data: { label: 'PostToolUseFailure', category: 'loop' },
  },
  {
    id: 'Notification',
    type: 'event',
    position: pos,
    data: { label: 'Notification', category: 'loop' },
  },
  {
    id: 'SubagentStart',
    type: 'event',
    position: pos,
    data: { label: 'SubagentStart', category: 'loop' },
  },
  {
    id: 'SubagentStop',
    type: 'event',
    position: pos,
    data: { label: 'SubagentStop', category: 'loop' },
  },
  {
    id: 'Stop',
    type: 'event',
    position: pos,
    data: { label: 'Stop', category: 'loop' },
  },
  {
    id: 'TeammateIdle',
    type: 'event',
    position: pos,
    data: { label: 'TeammateIdle', category: 'loop' },
  },
  {
    id: 'TaskCompleted',
    type: 'event',
    position: pos,
    data: { label: 'TaskCompleted', category: 'loop' },
  },
  {
    id: 'PreCompact',
    type: 'event',
    position: pos,
    data: { label: 'PreCompact', category: 'loop' },
  },
  {
    id: 'PermissionDenied',
    type: 'event',
    position: pos,
    data: { label: 'PermissionDenied', category: 'loop' },
  },
  {
    id: 'Elicitation',
    type: 'event',
    position: pos,
    data: { label: 'Elicitation', category: 'loop' },
  },
  {
    id: 'ElicitationResult',
    type: 'event',
    position: pos,
    data: { label: 'ElicitationResult', category: 'loop' },
  },

  // Standalone Async Events (7)
  {
    id: 'InstructionsLoaded',
    type: 'event',
    position: pos,
    data: { label: 'InstructionsLoaded', category: 'standalone' },
  },
  {
    id: 'ConfigChange',
    type: 'event',
    position: pos,
    data: { label: 'ConfigChange', category: 'standalone' },
  },
  {
    id: 'WorktreeCreate',
    type: 'event',
    position: pos,
    data: { label: 'WorktreeCreate', category: 'standalone' },
  },
  {
    id: 'WorktreeRemove',
    type: 'event',
    position: pos,
    data: { label: 'WorktreeRemove', category: 'standalone' },
  },
  {
    id: 'CwdChanged',
    type: 'event',
    position: pos,
    data: { label: 'CwdChanged', category: 'standalone' },
  },
  {
    id: 'FileChanged',
    type: 'event',
    position: pos,
    data: { label: 'FileChanged', category: 'standalone' },
  },
  {
    id: 'PermissionDeniedAsync',
    type: 'event',
    position: pos,
    data: { label: 'PermissionDenied', category: 'standalone' },
  },
];

// ---- Edges ----

const edgeStyle = { stroke: '#888' };
const markerEnd = { type: MarkerType.ArrowClosed, color: '#888' };

export const rawEdges: Edge[] = [
  // Session Events: category -> first event -> second event
  { id: 'e-session-start', source: 'session-events', target: 'SessionStart', markerEnd, style: edgeStyle },
  { id: 'e-session-1-2', source: 'SessionStart', target: 'SessionEnd', markerEnd, style: edgeStyle },

  // Loop Events: category -> sequential flow through all 12
  { id: 'e-loop-start', source: 'loop-events', target: 'UserPromptSubmit', markerEnd, style: edgeStyle },
  { id: 'e-loop-1-2', source: 'UserPromptSubmit', target: 'PreToolUse', markerEnd, style: edgeStyle },
  { id: 'e-loop-2-3', source: 'PreToolUse', target: 'PermissionRequest', markerEnd, style: edgeStyle },
  { id: 'e-loop-3-4', source: 'PermissionRequest', target: 'PostToolUse', markerEnd, style: edgeStyle },
  { id: 'e-loop-4-5', source: 'PostToolUse', target: 'PostToolUseFailure', markerEnd, style: edgeStyle },
  { id: 'e-loop-5-6', source: 'PostToolUseFailure', target: 'Notification', markerEnd, style: edgeStyle },
  { id: 'e-loop-6-7', source: 'Notification', target: 'SubagentStart', markerEnd, style: edgeStyle },
  { id: 'e-loop-7-8', source: 'SubagentStart', target: 'SubagentStop', markerEnd, style: edgeStyle },
  { id: 'e-loop-8-9', source: 'SubagentStop', target: 'Stop', markerEnd, style: edgeStyle },
  { id: 'e-loop-9-10', source: 'Stop', target: 'TeammateIdle', markerEnd, style: edgeStyle },
  { id: 'e-loop-10-11', source: 'TeammateIdle', target: 'TaskCompleted', markerEnd, style: edgeStyle },
  { id: 'e-loop-11-12', source: 'TaskCompleted', target: 'PreCompact', markerEnd, style: edgeStyle },
  { id: 'e-loop-12-13', source: 'PreCompact', target: 'PermissionDenied', markerEnd, style: edgeStyle },
  { id: 'e-loop-13-14', source: 'PermissionDenied', target: 'Elicitation', markerEnd, style: edgeStyle },
  { id: 'e-loop-14-15', source: 'Elicitation', target: 'ElicitationResult', markerEnd, style: edgeStyle },

  // Standalone Events: category -> sequential flow through all 7
  { id: 'e-standalone-start', source: 'standalone-events', target: 'InstructionsLoaded', markerEnd, style: edgeStyle },
  { id: 'e-standalone-1-2', source: 'InstructionsLoaded', target: 'ConfigChange', markerEnd, style: edgeStyle },
  { id: 'e-standalone-2-3', source: 'ConfigChange', target: 'WorktreeCreate', markerEnd, style: edgeStyle },
  { id: 'e-standalone-3-4', source: 'WorktreeCreate', target: 'WorktreeRemove', markerEnd, style: edgeStyle },
  { id: 'e-standalone-4-5', source: 'WorktreeRemove', target: 'CwdChanged', markerEnd, style: edgeStyle },
  { id: 'e-standalone-5-6', source: 'CwdChanged', target: 'FileChanged', markerEnd, style: edgeStyle },
  { id: 'e-standalone-6-7', source: 'FileChanged', target: 'PermissionDeniedAsync', markerEnd, style: edgeStyle },
];

// ---- Detail Content ----

/**
 * Detail content for each of the 24 hook events.
 * Shown in the HookDetailPanel when an event node is clicked.
 *
 * All events receive session context (session_id, session_type, transcript_path).
 */
export const detailContent: Record<string, EventDetail> = {
  SessionStart: {
    title: 'SessionStart',
    description:
      'Fires when a new Claude Code session begins or resumes. Use this hook to set up logging, initialize external services, or configure the session environment.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'session_id', value: 'Unique session identifier' },
      { key: 'session_type', value: 'interactive or headless' },
      { key: 'resume', value: 'Whether this is a resumed session' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          SessionStart: [
            {
              hooks: [
                { type: 'command', command: 'echo "Session started: $SESSION_ID"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  SessionEnd: {
    title: 'SessionEnd',
    description:
      'Fires when a Claude Code session terminates. Use this hook for cleanup tasks like uploading logs, closing connections, or sending notifications.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'session_id', value: 'Unique session identifier' },
      { key: 'duration_ms', value: 'Total session duration in milliseconds' },
      { key: 'turn_count', value: 'Number of conversation turns' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          SessionEnd: [
            {
              hooks: [
                { type: 'command', command: 'curl -X POST https://logging.example.com/session-end' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  UserPromptSubmit: {
    title: 'UserPromptSubmit',
    description:
      'Fires when the user submits a prompt to Claude. Use this hook to log user inputs, validate prompt content, or modify the prompt before processing.',
    handlerTypes: ['command', 'HTTP', 'prompt'],
    fields: [
      { key: 'prompt', value: 'The submitted prompt text' },
      { key: 'session_id', value: 'Current session identifier' },
      { key: 'turn_number', value: 'Current conversation turn number' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          UserPromptSubmit: [
            {
              hooks: [
                { type: 'command', command: 'echo \"$PROMPT\" >> ~/.claude/prompt-log.txt' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  PreToolUse: {
    title: 'PreToolUse',
    description:
      'Fires before a tool call is executed. This is the ONLY hook that can block execution -- exit code 2 blocks the tool call with a message. Use it to enforce policies, validate commands, or gate dangerous operations.',
    handlerTypes: ['command', 'HTTP', 'prompt', 'agent'],
    fields: [
      { key: 'tool_name', value: 'Name of the tool being called (e.g., Bash, Edit, Read)' },
      { key: 'tool_input', value: 'The input/arguments passed to the tool' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                { type: 'command', command: 'if echo \"$TOOL_INPUT\" | grep -q \"rm -rf\"; then exit 2; fi' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
    blockingInfo:
      'Exit code 2 blocks the tool call and sends stdout as the block reason to Claude. Exit code 0 allows the call to proceed. Any other non-zero exit code logs an error but does not block.',
  },

  PermissionRequest: {
    title: 'PermissionRequest',
    description:
      'Fires when a permission dialog is about to be shown to the user. Use this hook to auto-approve trusted operations or log permission requests for auditing.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'tool_name', value: 'Tool requesting permission' },
      { key: 'permission_type', value: 'Type of permission being requested' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          PermissionRequest: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Permission requested for: $TOOL_NAME\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  PostToolUse: {
    title: 'PostToolUse',
    description:
      'Fires after a tool call completes successfully. Use this hook to log results, trigger follow-up actions, or validate outputs.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'tool_name', value: 'Name of the tool that was called' },
      { key: 'tool_input', value: 'The input/arguments that were passed' },
      { key: 'tool_output', value: 'The output returned by the tool' },
      { key: 'exit_code', value: 'Tool exit code (0 = success)' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          PostToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                { type: 'command', command: 'echo \"Bash completed with exit code: $EXIT_CODE\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  PostToolUseFailure: {
    title: 'PostToolUseFailure',
    description:
      'Fires after a tool call fails. Use this hook to log failures, send alerts, or trigger recovery workflows.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'tool_name', value: 'Name of the tool that failed' },
      { key: 'tool_input', value: 'The input/arguments that were passed' },
      { key: 'error', value: 'Error message or description' },
      { key: 'exit_code', value: 'Non-zero exit code from the tool' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          PostToolUseFailure: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Tool failure: $TOOL_NAME\" | tee -a ~/.claude/errors.log' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  Notification: {
    title: 'Notification',
    description:
      'Fires when a notification is sent to the user (e.g., task completion, error alerts). Use this hook to forward notifications to external services like Slack or email.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'message', value: 'Notification message content' },
      { key: 'level', value: 'Notification severity level' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          Notification: [
            {
              hooks: [
                { type: 'command', command: 'osascript -e \'display notification \"$MESSAGE\" with title \"Claude Code\"\'' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  SubagentStart: {
    title: 'SubagentStart',
    description:
      'Fires when a subagent is spawned during multi-agent orchestration. Use this hook to log subagent creation, allocate resources, or track parallel work.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'subagent_id', value: 'Unique identifier for the spawned subagent' },
      { key: 'task', value: 'Description of the task assigned to the subagent' },
      { key: 'parent_session_id', value: 'Session ID of the parent agent' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          SubagentStart: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Subagent spawned: $SUBAGENT_ID\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  SubagentStop: {
    title: 'SubagentStop',
    description:
      'Fires when a subagent finishes execution. Use this hook to collect results, clean up resources, or update task tracking.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'subagent_id', value: 'Identifier of the finished subagent' },
      { key: 'result', value: 'Summary of the subagent result' },
      { key: 'duration_ms', value: 'Subagent execution duration in milliseconds' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          SubagentStop: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Subagent $SUBAGENT_ID finished in ${DURATION_MS}ms\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  Stop: {
    title: 'Stop',
    description:
      'Fires when Claude finishes responding to a prompt. Use this hook for post-response processing, logging, or triggering downstream workflows.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'stop_reason', value: 'Why Claude stopped (end_turn, max_tokens, etc.)' },
      { key: 'session_id', value: 'Current session identifier' },
      { key: 'turn_number', value: 'Conversation turn that just completed' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          Stop: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Claude finished responding\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  TeammateIdle: {
    title: 'TeammateIdle',
    description:
      'Fires when an agent team teammate is about to go idle. Use this hook to reassign work, log idle state, or trigger load balancing in multi-agent setups.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'teammate_id', value: 'Identifier of the idle teammate' },
      { key: 'last_task', value: 'Description of the last completed task' },
      { key: 'idle_since', value: 'Timestamp when the teammate became idle' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          TeammateIdle: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Teammate $TEAMMATE_ID is idle\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  TaskCompleted: {
    title: 'TaskCompleted',
    description:
      'Fires when a task is marked as completed. Use this hook to update project management tools, send completion notifications, or trigger CI/CD pipelines.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'task_id', value: 'Identifier of the completed task' },
      { key: 'task_description', value: 'Description of what was completed' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          TaskCompleted: [
            {
              hooks: [
                { type: 'command', command: 'gh issue comment $TASK_ID --body \"Task completed by Claude\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  PreCompact: {
    title: 'PreCompact',
    description:
      'Fires before context compaction occurs (when the context window is too full). Use this hook to save important context, export conversation state, or log compaction events.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'context_tokens', value: 'Current token count before compaction' },
      { key: 'threshold', value: 'Token threshold that triggered compaction' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          PreCompact: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Context compaction at $CONTEXT_TOKENS tokens\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  InstructionsLoaded: {
    title: 'InstructionsLoaded',
    description:
      'Fires when a CLAUDE.md file or rules file is loaded into context. Use this hook to validate instructions, log which files were loaded, or augment the loaded content.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'file_path', value: 'Path to the loaded instructions file' },
      { key: 'file_type', value: 'Type of file (CLAUDE.md, rules, etc.)' },
      { key: 'content_length', value: 'Size of the loaded content in characters' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          InstructionsLoaded: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Loaded instructions from: $FILE_PATH\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  ConfigChange: {
    title: 'ConfigChange',
    description:
      'Fires when a configuration file changes (e.g., .claude/settings.json is modified). Use this hook to validate configuration, reload services, or log changes.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'config_path', value: 'Path to the changed configuration file' },
      { key: 'change_type', value: 'Type of change (created, modified, deleted)' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          ConfigChange: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Config changed: $CONFIG_PATH ($CHANGE_TYPE)\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  WorktreeCreate: {
    title: 'WorktreeCreate',
    description:
      'Fires when a git worktree is being created (used in parallel development workflows). Use this hook to initialize worktree-specific configuration or set up isolated environments.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'worktree_path', value: 'Filesystem path of the new worktree' },
      { key: 'branch', value: 'Branch name for the worktree' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          WorktreeCreate: [
            {
              hooks: [
                { type: 'command', command: 'cp .env.template \"$WORKTREE_PATH/.env\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  WorktreeRemove: {
    title: 'WorktreeRemove',
    description:
      'Fires when a git worktree is being removed. Use this hook to clean up worktree-specific resources, archive logs, or update tracking systems.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'worktree_path', value: 'Filesystem path of the worktree being removed' },
      { key: 'branch', value: 'Branch name of the worktree' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          WorktreeRemove: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Worktree removed: $WORKTREE_PATH ($BRANCH)\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  PermissionDenied: {
    title: 'PermissionDenied',
    description:
      'Fires when a tool call is denied by the permission system, including auto mode classifier denials. Use this hook to log denied actions, alert administrators, or implement retry logic for auto mode sessions.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'tool_name', value: 'Name of the tool that was denied' },
      { key: 'tool_input', value: 'The input/arguments that were blocked' },
      { key: 'deny_reason', value: 'Explanation of why the action was denied' },
      { key: 'permission_mode', value: 'Active permission mode (e.g., auto, default)' },
      { key: 'retry', value: 'Whether the action can be retried (true in auto mode)' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          PermissionDenied: [
            {
              hooks: [
                { type: 'command', command: '.claude/hooks/log-denied-actions.sh' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  Elicitation: {
    title: 'Elicitation',
    description:
      'Fires before an MCP elicitation prompt is shown to the user. Use this hook to log elicitation requests, auto-fill known values, or validate the elicitation schema before presenting it.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'server_name', value: 'Name of the MCP server requesting elicitation' },
      { key: 'message', value: 'Elicitation prompt message' },
      { key: 'schema', value: 'JSON Schema describing the expected response format' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          Elicitation: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Elicitation from: $SERVER_NAME\" >> ~/.claude/elicitations.log' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  ElicitationResult: {
    title: 'ElicitationResult',
    description:
      'Fires after the user responds to an MCP elicitation prompt. Use this hook to log user responses, validate answers, or trigger follow-up workflows based on the elicitation outcome.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'server_name', value: 'Name of the MCP server that requested elicitation' },
      { key: 'action', value: 'User action (submit, cancel, dismiss)' },
      { key: 'response', value: 'User response data matching the elicitation schema' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          ElicitationResult: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Elicitation result: $ACTION\" >> ~/.claude/elicitations.log' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  CwdChanged: {
    title: 'CwdChanged',
    description:
      'Fires when the working directory changes during a session. Use this hook to update environment variables, reload project-specific configuration, or log directory transitions.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'old_cwd', value: 'Previous working directory path' },
      { key: 'new_cwd', value: 'New working directory path' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          CwdChanged: [
            {
              hooks: [
                { type: 'command', command: 'echo \"Directory changed: $OLD_CWD -> $NEW_CWD\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  FileChanged: {
    title: 'FileChanged',
    description:
      'Fires when file system changes are detected in the project. Use this hook to trigger rebuilds, update caches, or notify external systems about file modifications.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'file_path', value: 'Path to the changed file' },
      { key: 'change_type', value: 'Type of change (created, modified, deleted)' },
      { key: 'session_id', value: 'Current session identifier' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          FileChanged: [
            {
              hooks: [
                { type: 'command', command: 'echo \"File changed: $FILE_PATH ($CHANGE_TYPE)\"' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },

  PermissionDeniedAsync: {
    title: 'PermissionDenied',
    description:
      'Fires asynchronously when a tool call is denied by the permission system. This standalone variant allows external integrations to track denied actions without blocking the main loop.',
    handlerTypes: ['command', 'HTTP'],
    fields: [
      { key: 'tool_name', value: 'Name of the tool that was denied' },
      { key: 'tool_input', value: 'The input/arguments that were blocked' },
      { key: 'deny_reason', value: 'Explanation of why the action was denied' },
      { key: 'permission_mode', value: 'Active permission mode (e.g., auto, default)' },
    ],
    configExample: JSON.stringify(
      {
        hooks: {
          PermissionDenied: [
            {
              hooks: [
                { type: 'http', url: 'https://audit.example.com/denied-actions' },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  },
};
