/**
 * Node/edge definitions and detail content for the interactive
 * permission flow explorer (INTV-01).
 *
 * The decision tree models Claude Code's permission evaluation chain:
 *   Tool Call Request -> deny rules -> ask rules -> allow rules -> default ask
 *
 * All positions are {x:0, y:0} -- dagre handles layout at render time.
 */
import { MarkerType, type Node, type Edge } from '@xyflow/react';

// ---- Types ----

export interface DetailContent {
  title: string;
  description: string;
  details: Array<{ key: string; value: string }>;
}

// ---- Node data ----

export const rawNodes: Node[] = [
  // Entry point
  {
    id: 'entry',
    type: 'input',
    position: { x: 0, y: 0 },
    data: { label: 'Tool Call Request', description: 'Claude attempts to use a tool', outcome: 'entry' },
  },
  // Decision diamonds
  {
    id: 'deny-check',
    type: 'decision',
    position: { x: 0, y: 0 },
    data: { label: 'Deny rules match?', description: 'Check deny rules first', outcome: 'deny' },
  },
  {
    id: 'ask-check',
    type: 'decision',
    position: { x: 0, y: 0 },
    data: { label: 'Ask rules match?', description: 'Check ask rules second', outcome: 'ask' },
  },
  {
    id: 'allow-check',
    type: 'decision',
    position: { x: 0, y: 0 },
    data: { label: 'Allow rules match?', description: 'Check allow rules third', outcome: 'allow' },
  },
  // Result nodes
  {
    id: 'blocked',
    type: 'result',
    position: { x: 0, y: 0 },
    data: { label: 'BLOCKED', description: 'Tool call rejected', outcome: 'deny' },
  },
  {
    id: 'prompt-user',
    type: 'result',
    position: { x: 0, y: 0 },
    data: { label: 'Prompt User', description: 'User approves or denies', outcome: 'ask' },
  },
  {
    id: 'allowed',
    type: 'result',
    position: { x: 0, y: 0 },
    data: { label: 'ALLOWED', description: 'Tool call proceeds', outcome: 'allow' },
  },
  {
    id: 'default-ask',
    type: 'result',
    position: { x: 0, y: 0 },
    data: { label: 'Default: Ask', description: 'No rules matched, ask user', outcome: 'ask' },
  },
];

// ---- Edge data ----

const EDGE_STYLE = { stroke: '#888' };
const MARKER_END = { type: MarkerType.ArrowClosed, color: '#888' };

export const rawEdges: Edge[] = [
  // Entry -> first check
  {
    id: 'e-entry-deny',
    source: 'entry',
    target: 'deny-check',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
  // Deny check branches
  {
    id: 'e-deny-blocked',
    source: 'deny-check',
    target: 'blocked',
    label: 'Yes',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
  {
    id: 'e-deny-ask',
    source: 'deny-check',
    target: 'ask-check',
    label: 'No',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
  // Ask check branches
  {
    id: 'e-ask-prompt',
    source: 'ask-check',
    target: 'prompt-user',
    label: 'Yes',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
  {
    id: 'e-ask-allow',
    source: 'ask-check',
    target: 'allow-check',
    label: 'No',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
  // Allow check branches
  {
    id: 'e-allow-allowed',
    source: 'allow-check',
    target: 'allowed',
    label: 'Yes',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
  {
    id: 'e-allow-default',
    source: 'allow-check',
    target: 'default-ask',
    label: 'No',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
  // Prompt user outcomes
  {
    id: 'e-prompt-allowed',
    source: 'prompt-user',
    target: 'allowed',
    label: 'Yes',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
  {
    id: 'e-prompt-blocked',
    source: 'prompt-user',
    target: 'blocked',
    label: 'No',
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
  },
];

// ---- Detail content (revealed on node click) ----

export const detailContent: Record<string, DetailContent> = {
  entry: {
    title: 'Tool Call Request',
    description:
      'Claude attempts to use a tool such as reading a file, running a bash command, or writing to a file. Every tool call passes through the permission evaluation chain before execution.',
    details: [
      { key: 'Tool Types', value: 'Read, Write, Bash, WebSearch, MCP tools' },
      { key: 'Trigger', value: 'Any tool invocation by Claude during a session' },
      { key: 'Evaluation Order', value: 'Deny -> Ask -> Allow -> Default Ask' },
    ],
  },
  'deny-check': {
    title: 'Deny Rule Evaluation',
    description:
      'Deny rules are evaluated first and always take precedence. If any deny rule matches the tool call, it is immediately blocked with no override possible.',
    details: [
      { key: 'Evaluation Order', value: '1st (highest priority)' },
      { key: 'On Match', value: 'Tool call rejected immediately' },
      { key: 'Rule Syntax', value: 'Tool(specifier) with glob patterns' },
      { key: 'Example', value: 'Bash(rm -rf *), Edit(*.env)' },
    ],
  },
  'ask-check': {
    title: 'Ask Rule Evaluation',
    description:
      'Ask rules prompt the user for explicit approval before the tool call executes. The user can approve once, for the session, for the project, or deny.',
    details: [
      { key: 'Evaluation Order', value: '2nd (after deny rules)' },
      { key: 'Prompt Behavior', value: 'User sees approval dialog' },
      { key: 'Scope Options', value: 'Allow Once, Session, Project, Deny' },
      { key: 'Example', value: 'Bash(npm install *), Write(src/**)' },
    ],
  },
  'allow-check': {
    title: 'Allow Rule Evaluation',
    description:
      'Allow rules auto-approve tool calls without user interaction. Typically used for trusted read-only operations or well-understood commands.',
    details: [
      { key: 'Evaluation Order', value: '3rd (after ask rules)' },
      { key: 'On Match', value: 'Tool call proceeds automatically' },
      { key: 'Common Use Cases', value: 'Read-only operations, linting, tests' },
      { key: 'Trust Level', value: 'Highest -- no confirmation needed' },
    ],
  },
  blocked: {
    title: 'BLOCKED',
    description:
      'The tool call is immediately rejected. No user override is possible. Deny rules are absolute -- once matched, the tool call cannot proceed.',
    details: [
      { key: 'Behavior', value: 'Tool call rejected, error returned to Claude' },
      { key: 'User Override', value: 'Not possible -- deny rules are absolute' },
      { key: 'Trigger', value: 'Deny rule match or user denial at prompt' },
    ],
  },
  'prompt-user': {
    title: 'Prompt User',
    description:
      'The user is presented with an approval dialog showing the tool call details. They can approve with various scope levels or deny the call.',
    details: [
      { key: 'Approval Options', value: 'Allow Once, Allow Session, Allow Project, Deny' },
      { key: 'Session Scope', value: 'Approval lasts until session ends' },
      { key: 'Project Scope', value: 'Approval persists across sessions' },
      { key: 'On Deny', value: 'Tool call blocked, Claude receives error' },
    ],
  },
  allowed: {
    title: 'ALLOWED',
    description:
      'The tool call proceeds without any user interaction. Either an allow rule matched or the user explicitly approved the call at the prompt.',
    details: [
      { key: 'Behavior', value: 'Tool executes immediately' },
      { key: 'No Interaction', value: 'User is not prompted' },
      { key: 'Trust Level', value: 'Full trust -- auto-approved or user-approved' },
    ],
  },
  'default-ask': {
    title: 'Default: Ask',
    description:
      'When no deny, ask, or allow rule matches, the default behavior is to prompt the user for approval. This is the safest fallback.',
    details: [
      { key: 'Fallback Behavior', value: 'Ask user when no rules match' },
      { key: 'Safety Rationale', value: 'Prevents unexpected tool execution' },
      { key: 'Override', value: 'Add explicit allow/deny rules to skip prompts' },
    ],
  },
};

// ---- Supplementary data ----

/** Tool permission tiers and their default behaviors */
export const toolTiers = [
  { tier: 'Read-only', behavior: 'No approval needed', examples: 'File read, directory listing, git status' },
  { tier: 'Bash commands', behavior: 'Permanent per-project approval', examples: 'npm install, make build, pytest' },
  { tier: 'File modification', behavior: 'Approval valid until session end', examples: 'File write, file edit, file create' },
];

/** Settings precedence from highest to lowest priority */
export const settingsPrecedence = [
  { level: 'Managed', scope: 'Enterprise admin policy', overridable: false },
  { level: 'CLI flags', scope: 'Current invocation only', overridable: true },
  { level: 'Local', scope: '.claude/settings.local.json', overridable: true },
  { level: 'Shared', scope: '.claude/settings.json (committed)', overridable: true },
  { level: 'User', scope: '~/.claude/settings.json', overridable: true },
];

/** Available permission modes */
export const permissionModes = [
  { mode: 'default', description: 'Standard deny/ask/allow evaluation' },
  { mode: 'acceptEdits', description: 'Auto-accept file edits, ask for bash' },
  { mode: 'plan', description: 'Read-only planning mode, no writes allowed' },
  { mode: 'dontAsk', description: 'Skip all prompts, deny disallowed actions' },
  { mode: 'bypassPermissions', description: 'Skip all checks (requires --dangerously-skip-permissions)' },
];
