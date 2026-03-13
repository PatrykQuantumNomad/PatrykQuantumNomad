/**
 * Generate .cast files for all demo recordings.
 *
 * Usage: npx tsx src/lib/guides/recordings/generate.ts
 *
 * Writes output to public/recordings/claude-code/
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startSession, multiStepTask, rewindDemo, slashCommands } from './intro-demos';

const OUT_DIR = join(process.cwd(), 'public', 'recordings', 'claude-code');

mkdirSync(OUT_DIR, { recursive: true });

const recordings: Record<string, () => string> = {
  'start-session.cast': startSession,
  'multi-step-task.cast': multiStepTask,
  'rewind-demo.cast': rewindDemo,
  'slash-commands.cast': slashCommands,
};

for (const [filename, generator] of Object.entries(recordings)) {
  const path = join(OUT_DIR, filename);
  const content = generator();
  const lines = content.trim().split('\n').length;
  writeFileSync(path, content, 'utf-8');
  console.log(`  wrote ${path} (${lines} events, ${content.length} bytes)`);
}

console.log('\nDone. Generated', Object.keys(recordings).length, 'recordings.');
