# Phase 113: Lower-Impact Chapter Updates - Validation

**Created:** 2026-04-12
**Source:** 113-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual content review + Astro build verification |
| Config file | astro.config.mjs |
| Quick run command | `npx astro build 2>&1 \| head -50` |
| Full suite command | `npx astro build` |

## Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPD-01 | Ch1 documents Desktop App, web, /powerup, install | manual + build | `npx astro build` (validates MDX compiles) | N/A -- content verification |
| UPD-02 | Ch2 documents autoMemoryDirectory, PostCompact hook | manual + build | `npx astro build` | N/A -- content verification |
| UPD-05 | Ch5 documents Remote Control server, Channels, --bare, scheduled tasks | manual + build | `npx astro build` | N/A -- content verification |
| UPD-06 | Ch6 documents elicitation, per-tool result-size | manual + build | `npx astro build` | N/A -- content verification |
| UPD-09 | Ch9 documents memory, background, initialPrompt, sparsePaths | manual + build | `npx astro build` | N/A -- content verification |
| UPD-10 | Ch10 documents /agents UI, initialPrompt, dynamic agents | manual + build | `npx astro build` | N/A -- content verification |

## Sampling Rate

- **Per task commit:** `npx astro build` (validates MDX compilation and no broken imports)
- **Per wave merge:** Content review against requirements checklist
- **Phase gate:** All 6 chapters build clean, grep for deprecated terms returns zero matches, guide.json descriptions verified

## Deprecation Sweep Commands

```bash
# Must return zero matches across all 6 updated chapter files
grep -rn '/tag\|/vim\|ANTHROPIC_SMALL_FAST_MODEL' src/data/guides/claude-code/pages/{introduction,context-management,remote-and-headless,mcp,worktrees,agent-teams}.mdx
```

## Cross-Reference Verification Commands

```bash
# Verify real hyperlinks to Ch12-14 (not text-only mentions)
grep -rn '/guides/claude-code/plugins/\|/guides/claude-code/agent-sdk/\|/guides/claude-code/computer-use/' src/data/guides/claude-code/pages/{introduction,context-management,remote-and-headless,mcp,worktrees,agent-teams}.mdx
```

## Wave 0 Gaps

None -- existing build infrastructure covers all phase requirements. No test framework install needed. Content verification is manual.
