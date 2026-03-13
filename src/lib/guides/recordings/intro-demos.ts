/**
 * Demo recordings for the Claude Code Introduction chapter.
 *
 * Each export is a function that returns a .cast file string.
 * Run `npx tsx src/lib/guides/recordings/generate.ts` to write
 * them to public/recordings/claude-code/.
 */
import { CastBuilder, ANSI, c } from './cast-builder';

// ---------------------------------------------------------------------------
// Transcripts — plain-text versions for accessibility
// ---------------------------------------------------------------------------

export const TRANSCRIPTS = {
  startSession: `$ cd projects/my-app
$ claude

  Claude Code v1.0.33

  Model: claude-sonnet-4-20250514
  Context: 200,000 tokens (used: 1,247)

  > What does the auth middleware do in this project?

  Searching codebase...
  Read src/middleware/auth.ts
  Read src/middleware/index.ts
  Read src/types/auth.ts

  The auth middleware in this project handles JWT-based authentication.
  Here's what it does:

  1. Extracts the Bearer token from the Authorization header
  2. Validates the JWT signature using the secret from env.JWT_SECRET
  3. Decodes the payload and attaches req.user with the user's ID and role
  4. Returns 401 Unauthorized if the token is missing or invalid

  The middleware is applied to all routes under /api/ except
  /api/auth/login and /api/auth/register.

  Cost: $0.003 | Tokens: 1,842 in / 247 out`,

  multiStepTask: `  > Add input validation to the user registration endpoint.
  > Validate email format and password is at least 8 characters.

  Searching codebase...
  Read src/routes/auth.ts
  Read src/schemas/user.ts
  Read src/middleware/validate.ts

  Edit src/routes/auth.ts
    - const { email, password } = req.body;
    + const { email, password } = req.body;
    + if (!email || !/^[^@]+@[^@]+\\.[^@]+$/.test(email)) {
    +   return res.status(400).json({ error: 'Invalid email format' });
    + }
    + if (!password || password.length < 8) {
    +   return res.status(400).json({ error: 'Password must be at least 8 characters' });
    + }

  Bash npm test

  Tests: 14 passed, 0 failed
  Done. Added email format and password length validation to POST /api/auth/register.`,

  rewindDemo: `  > /rewind

  Select a point to rewind to:

  ┌────────────────────────────────────────────┐
  │  3. Add input validation to registration   │
  │  2. Refactor database connection module     │
  │  1. What does the auth middleware do?       │
  └────────────────────────────────────────────┘

  What would you like to do?
  > Restore code and conversation

  Rewound to checkpoint 2. Code and conversation restored.`,

  slashCommands: `  > /help

  Available commands:

  /help            Show this help message
  /rewind          Rewind conversation/code to a previous point
  /clear           Reset conversation history
  /compact         Compact conversation to free context
  /cost            Show token usage and cost (API users)
  /stats           Show usage stats (subscribers)
  /model           Change the AI model
  /diff            Show uncommitted changes
  /quit            Exit Claude Code
    ... and more. Type / to see all commands.

  > /cost

  Session Cost

  Total cost:            $0.12
  Total duration (API):  2m 14.3s
  Total duration (wall): 18m 5.7s
  Total code changes:    42 lines added, 8 lines removed
  Tokens in:             24,571
  Tokens out:            3,842

  > /compact

  Compacting conversation...
  Done. Compressed 28,413 tokens to 4,207 tokens.`,
};

// ---------------------------------------------------------------------------
// Demo 1: Starting a session
// ---------------------------------------------------------------------------

export function startSession(): string {
  const cast = new CastBuilder({ width: 90, height: 24, title: 'Starting a Claude Code Session' });

  // Shell prompt + cd
  cast
    .prompt('~')
    .type('cd projects/my-app')
    .pause(100)
    .output('\r\n')
    .pause(300);

  // Run claude
  cast
    .prompt('~/projects/my-app')
    .type('claude')
    .pause(100)
    .output('\r\n')
    .pause(600);

  // Startup banner
  cast
    .line('')
    .line(`${c(ANSI.bold + ANSI.cyan, '  Claude Code')} ${c(ANSI.dim, 'v1.0.33')}`)
    .line('')
    .line(`${c(ANSI.dim, '  Model:')} claude-sonnet-4-20250514`)
    .line(`${c(ANSI.dim, '  Context:')} 200,000 tokens (used: 1,247)`)
    .line('')
    .pause(200);

  // Prompt
  cast
    .claudePrompt()
    .pause(800);

  // User types a question
  cast
    .type('What does the auth middleware do in this project?', { baseDelay: 50 })
    .pause(200)
    .output('\r\n')
    .pause(400);

  // Claude gathers context
  cast
    .line('')
    .line(`${c(ANSI.dim, '  Searching codebase...')}`)
    .pause(600)
    .toolAction('Read', 'src/middleware/auth.ts', 400)
    .toolAction('Read', 'src/middleware/index.ts', 300)
    .toolAction('Read', 'src/types/auth.ts', 600);

  // Claude's response
  cast
    .line('')
    .responseBlock([
      `  The auth middleware in this project handles JWT-based authentication.`,
      `  Here's what it does:`,
      '',
      `  ${c(ANSI.bold, '1.')} Extracts the Bearer token from the ${c(ANSI.cyan, 'Authorization')} header`,
      `  ${c(ANSI.bold, '2.')} Validates the JWT signature using the secret from ${c(ANSI.cyan, 'env.JWT_SECRET')}`,
      `  ${c(ANSI.bold, '3.')} Decodes the payload and attaches ${c(ANSI.cyan, 'req.user')} with the user's ID and role`,
      `  ${c(ANSI.bold, '4.')} Returns ${c(ANSI.yellow, '401 Unauthorized')} if the token is missing or invalid`,
      '',
      `  The middleware is applied to all routes under ${c(ANSI.cyan, '/api/')} except`,
      `  ${c(ANSI.cyan, '/api/auth/login')} and ${c(ANSI.cyan, '/api/auth/register')}.`,
      '',
    ], 50)
    .pause(400);

  // Cost line
  cast
    .output(`  ${c(ANSI.dim, 'Cost: $0.003 | Tokens: 1,842 in / 247 out')}\r\n`)
    .pause(200);

  // Next prompt
  cast
    .line('')
    .claudePrompt()
    .pause(1500);

  return cast.build();
}

// ---------------------------------------------------------------------------
// Demo 2: Multi-step task — the gather→action→verify loop
// ---------------------------------------------------------------------------

export function multiStepTask(): string {
  const cast = new CastBuilder({ width: 90, height: 24, title: 'Multi-step Agentic Loop' });

  cast
    .claudePrompt()
    .pause(500);

  // User types a multi-line prompt
  cast
    .type('Add input validation to the user registration endpoint.', { baseDelay: 45 })
    .pause(80)
    .output('\r\n')
    .output(`${c(ANSI.bold + ANSI.magenta, '  >')} `)
    .type('Validate email format and password is at least 8 characters.', { baseDelay: 45 })
    .pause(150)
    .output('\r\n')
    .pause(500);

  // Phase 1: Gather context
  cast
    .line('')
    .line(`${c(ANSI.dim, '  Searching codebase...')}`)
    .pause(500)
    .toolAction('Read', 'src/routes/auth.ts', 400)
    .toolAction('Read', 'src/schemas/user.ts', 300)
    .toolAction('Read', 'src/middleware/validate.ts', 400);

  // Phase 2: Take action
  cast
    .line('')
    .toolAction('Edit', 'src/routes/auth.ts', 200)
    .pause(200);

  cast.diff(
    'src/routes/auth.ts',
    ['const { email, password } = req.body;'],
    [
      'const { email, password } = req.body;',
      'if (!email || !/^[^@]+@[^@]+\\.[^@]+$/.test(email)) {',
      '  return res.status(400).json({ error: \'Invalid email format\' });',
      '}',
      'if (!password || password.length < 8) {',
      '  return res.status(400).json({ error: \'Password must be at least 8 characters\' });',
      '}',
    ],
  );

  cast.pause(600);

  // Phase 3: Verify
  cast
    .line('')
    .toolAction('Bash', 'npm test', 300)
    .pause(800);

  cast
    .line('')
    .line(`  ${c(ANSI.green, 'Tests: 14 passed')}, ${c(ANSI.dim, '0 failed')}`)
    .pause(300);

  cast
    .line('')
    .responseBlock([
      `  Done. Added email format and password length validation to`,
      `  ${c(ANSI.cyan, 'POST /api/auth/register')}.`,
      '',
    ], 30)
    .pause(200);

  cast
    .output(`  ${c(ANSI.dim, 'Cost: $0.008 | Tokens: 4,312 in / 521 out')}\r\n`)
    .pause(200);

  cast
    .line('')
    .claudePrompt()
    .pause(1500);

  return cast.build();
}

// ---------------------------------------------------------------------------
// Demo 3: Rewind
// ---------------------------------------------------------------------------

export function rewindDemo(): string {
  const cast = new CastBuilder({ width: 90, height: 24, title: 'Rewinding with /rewind' });

  cast
    .claudePrompt()
    .pause(500);

  // Type /rewind
  cast
    .type('/rewind', { baseDelay: 60 })
    .pause(100)
    .output('\r\n')
    .pause(400);

  // Rewind menu
  cast
    .line('')
    .line(`  ${c(ANSI.bold + ANSI.cyan, 'Select a point to rewind to:')}`)
    .line('')
    .pause(200);

  // Menu items — show as a list with highlighted selection
  cast
    .line(`  ${c(ANSI.dim, '┌────────────────────────────────────────────────┐')}`)
    .line(`  ${c(ANSI.dim, '│')}  ${c(ANSI.brightWhite, '3.')} Add input validation to registration      ${c(ANSI.dim, '│')}`)
    .line(`  ${c(ANSI.dim, '│')}  ${c(ANSI.brightWhite, '2.')} Refactor database connection module        ${c(ANSI.dim, '│')}`)
    .line(`  ${c(ANSI.dim, '│')}  ${c(ANSI.brightWhite, '1.')} What does the auth middleware do?           ${c(ANSI.dim, '│')}`)
    .line(`  ${c(ANSI.dim, '└────────────────────────────────────────────────┘')}`)
    .pause(800);

  // User selects item 2 (highlighted)
  cast
    .line('')
    .line(`  ${c(ANSI.dim, 'Selected:')} ${c(ANSI.bold, 'Refactor database connection module')}`)
    .line('')
    .pause(400);

  // Show options
  cast
    .line(`  ${c(ANSI.bold + ANSI.cyan, 'What would you like to do?')}`)
    .line('')
    .line(`  ${c(ANSI.bgBlue + ANSI.white, ' Restore code and conversation ')}`)
    .line(`  ${c(ANSI.dim, ' Restore conversation only')}`)
    .line(`  ${c(ANSI.dim, ' Restore code only')}`)
    .line(`  ${c(ANSI.dim, ' Summarize from here')}`)
    .line('')
    .pause(1000);

  // Execute rewind
  cast
    .line(`  ${c(ANSI.dim, 'Restoring...')}`)
    .pause(600)
    .line(`  ${c(ANSI.green, 'Rewound to checkpoint 2.')} Code and conversation restored.`)
    .line('')
    .pause(400);

  cast
    .claudePrompt()
    .pause(1500);

  return cast.build();
}

// ---------------------------------------------------------------------------
// Demo 4: Slash commands quick tour
// ---------------------------------------------------------------------------

export function slashCommands(): string {
  const cast = new CastBuilder({ width: 90, height: 24, title: 'Claude Code Slash Commands' });

  // Existing session prompt
  cast
    .claudePrompt()
    .pause(600);

  // /help
  cast
    .type('/help', { baseDelay: 60 })
    .pause(100)
    .output('\r\n')
    .pause(400);

  cast
    .line('')
    .line(`  ${c(ANSI.bold + ANSI.cyan, 'Available commands:')}`)
    .line('')
    .line(`  ${c(ANSI.yellow, '/help')}            Show this help message`)
    .line(`  ${c(ANSI.yellow, '/rewind')}          Rewind conversation/code to a previous point`)
    .line(`  ${c(ANSI.yellow, '/clear')}           Reset conversation history`)
    .line(`  ${c(ANSI.yellow, '/compact')}         Compact conversation to free context`)
    .line(`  ${c(ANSI.yellow, '/cost')}            Show token usage and cost (API users)`)
    .line(`  ${c(ANSI.yellow, '/stats')}           Show usage stats (subscribers)`)
    .line(`  ${c(ANSI.yellow, '/model')}           Change the AI model`)
    .line(`  ${c(ANSI.yellow, '/diff')}            Show uncommitted changes`)
    .line(`  ${c(ANSI.yellow, '/quit')}            Exit Claude Code`)
    .line(`  ${c(ANSI.dim, '  ... and more. Type / to see all commands.')}`)
    .line('')
    .pause(1000);

  // /cost
  cast
    .claudePrompt()
    .pause(400)
    .type('/cost', { baseDelay: 60 })
    .pause(100)
    .output('\r\n')
    .pause(300);

  cast
    .line('')
    .line(`  ${c(ANSI.bold + ANSI.cyan, 'Session Cost')}`)
    .line('')
    .line(`  Total cost:            ${c(ANSI.green, '$0.12')}`)
    .line(`  Total duration (API):  ${c(ANSI.dim, '2m 14.3s')}`)
    .line(`  Total duration (wall): ${c(ANSI.dim, '18m 5.7s')}`)
    .line(`  Total code changes:    ${c(ANSI.dim, '42 lines added, 8 lines removed')}`)
    .line(`  Tokens in:             ${c(ANSI.dim, '24,571')}`)
    .line(`  Tokens out:            ${c(ANSI.dim, '3,842')}`)
    .line('')
    .pause(1000);

  // /compact
  cast
    .claudePrompt()
    .pause(400)
    .type('/compact', { baseDelay: 60 })
    .pause(100)
    .output('\r\n')
    .pause(500);

  cast
    .line('')
    .line(`  ${c(ANSI.dim, 'Compacting conversation...')}`)
    .pause(800)
    .line(`  ${c(ANSI.green, 'Done.')} Compressed ${c(ANSI.cyan, '28,413')} tokens to ${c(ANSI.cyan, '4,207')} tokens.`)
    .line('')
    .pause(800);

  // Back to prompt
  cast
    .claudePrompt()
    .pause(1500);

  return cast.build();
}
