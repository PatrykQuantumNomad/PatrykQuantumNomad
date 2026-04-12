# Phase 111: High-Impact Chapter Rewrites - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite five guide chapters (Ch3 Models & Costs, Ch4 Environment, Ch7 Skills, Ch8 Hooks, Ch11 Security) with major feature additions reflecting 6+ months of Claude Code evolution, plus a deprecation sweep. No new chapters or pages are added in this phase.

</domain>

<decisions>
## Implementation Decisions

### Content structure
- Claude decides per chapter whether to add new sections or restructure the flow — some chapters may need reorganization while others just need additions
- Chapters stay as single long pages with anchor-based table of contents navigation (no sub-pages)
- Reference content like the 26 hook events in Ch8 uses a full table with all columns (event name, trigger, payload, example)
- No "What's New" callouts — updated chapters read seamlessly as if always written this way

### Deprecation handling
- Silent removal of deprecated features — the guide reflects current state only
- Deprecation sweep happens per-chapter during each rewrite (not a separate cross-cutting pass)
- Renamed features use the new name exclusively — no parenthetical "(formerly X)" mentions
- No standalone changelog page in the guide — the Phase 115 blog post covers what changed

### Code examples
- Complete working examples that readers can copy-paste and run (not minimal snippets)
- JSON only for configuration examples — matches Claude Code's native settings.json format
- Representative examples for repetitive content (e.g., 3-5 well-chosen hook event examples covering the main patterns, not all 26)
- Inline comments at Claude's discretion — use when code isn't self-evident from surrounding prose

### Cross-reference strategy
- Forward references to upcoming new chapters (Ch12-14) at Claude's discretion — include where natural, skip where forced
- Ch7 Skills mentions Plugins briefly and points readers to the Plugins chapter — does not include a comparison section
- Inline hyperlink style for cross-references: "...permission modes (see Chapter 11)" — no callout boxes
- Match the existing guide's cross-reference patterns rather than standardizing a new format

### Claude's Discretion
- Per-chapter decision on whether to add new sections or restructure the chapter flow
- Whether to include forward references to not-yet-written chapters (Plugins, Agent SDK, Computer Use)
- When to use inline code comments vs. letting prose explain

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 111-high-impact-chapter-rewrites*
*Context gathered: 2026-04-12*
