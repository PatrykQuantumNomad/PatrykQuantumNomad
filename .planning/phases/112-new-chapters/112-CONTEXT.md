# Phase 112: New Chapters - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Author three new guide chapters — Plugins (Ch12), Agent SDK (Ch13), and Computer Use (Ch14) — as complete, self-contained learning resources integrated into the existing 11-chapter Claude Code guide structure. Includes guide.json registration and OG images.

</domain>

<decisions>
## Implementation Decisions

### Chapter ordering & numbering
- Plugins → Agent SDK → Computer Use (Ch12, Ch13, Ch14)
- Sequential after existing Ch11 (Security & Governance)
- Computer Use (Ch14) gets a prominent safety/governance callout box early in the chapter linking back to Ch11

### Narrative style
- Match existing chapter style: concept explanation with code examples woven in, section-by-section
- Same narrative pattern across all three chapters — consistent reading experience
- Similar length to existing chapters (comparable to Ch7 or Ch8)
- Each chapter includes a Quick Start / TL;DR section at the top (new convention for these chapters)

### Code examples
- Plugins: full working plugin example — complete manifest + bin/ executable that readers could copy and run
- Computer Use: CLI-focused examples (commands, flags, terminal output)
- All examples use realistic scenarios ("build a plugin that formats Markdown") not minimal/contrived demos
- Agent SDK language balance: Claude's discretion on Python vs TypeScript weighting

### Content scope
- Fully self-contained — reader can jump to any new chapter without reading Ch1–Ch11; re-explain core concepts briefly as needed
- Plugins chapter: authoring-focused (manifest format, bin/ executables, userConfig, lifecycle, publishing) — not marketplace/consumption
- Agent SDK: brief one-line mention of the rename from "Claude Code SDK", then move on
- Computer Use: safety-first structure — lead with per-app approval flow and safety model, then cover practical CLI/GUI control

### Claude's Discretion
- How Plugins chapter bridges from Ch7 Skills (could open with "Skills are local, Plugins are shareable" or standalone intro)
- Agent SDK: Python vs TypeScript example balance per section
- Cross-referencing density between new chapters and existing Ch7/Ch8/Ch11

</decisions>

<specifics>
## Specific Ideas

- Quick Start section at top of each chapter is a new convention not present in Ch1–Ch11 — keep it brief ("get running in 2 minutes")
- Computer Use safety callout should be prominent (callout box, not just inline text) and link specifically to Ch11's permission model
- Plugins code example should be complete enough to copy-paste and run

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 112-new-chapters*
*Context gathered: 2026-04-12*
