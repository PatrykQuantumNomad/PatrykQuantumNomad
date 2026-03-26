# Phase 102: Data Foundation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert the DOT file into a canonical JSON data model with Zod-validated content collection, two-tier educational content for all concept nodes, and Astro registration. This data model is the single prerequisite for every downstream phase (SEO pages, graph, panel, search, tours).

</domain>

<decisions>
## Implementation Decisions

### Content Depth & Tone
- **Simple tier:** Informed layperson level — plain English, assumes basic tech literacy but no AI expertise. ~100-150 words per node.
- **Technical tier:** Wikipedia-level — accurate terminology, brief history, key characteristics. Assumes some CS knowledge. ~100-150 words per node.
- **"Why it matters" field:** Each node gets a 1-2 sentence "why it matters" line connecting abstract concepts to real-world impact (e.g., for LLMs: "This is the technology behind ChatGPT, Claude, and Gemini.")
- Content written by Claude during this phase — user reviews quality in verification

### Node Taxonomy
- **Concept nodes stay as individual graph nodes:** AI subfields (NLP, CV, Robotics, Expert Systems, etc.), ML types (Supervised, Unsupervised, Reinforcement), DL architectures (CNN, RNN, Transformers), LLM-related concepts (RAG, Prompt Engineering, Hallucination, etc.), Agentic characteristics (Autonomy, Tool Use, Memory, etc.), Intelligence Levels (ANI, ACI, AGI, ASI)
- **Product/framework examples are GROUPED into parent nodes:** GPT-4o/Claude/Gemini/Llama/DeepSeek → listed as examples on LLM page. Stable Diffusion/DALL-E/Midjourney/Sora → Diffusion Models page. o1/o3/DeepSeek R1/Extended Thinking → Reasoning Models page. BERT → Foundation Models page. LangGraph/CrewAI/AutoGen/AG2/Anthropic SDK/OpenClaw → Agentic AI page. Claude Code/Cursor/Copilot/Windsurf → AI Coding Assistants page.
- **ML techniques grouped into parents:** Decision Trees, SVM, K-Means, Linear Regression, Logistic Regression, PCA, Ensemble → listed on Supervised/Unsupervised Learning pages
- **NN concepts grouped into parent:** Perceptron, MLP, Backpropagation, Activation Functions, SOM → listed on Neural Networks page
- **Historical DL architectures grouped:** LSTM, GRU → RNN page. DBN, Boltzmann Machines → Deep Learning page
- **Estimated final node count:** ~50-55 concept nodes (down from ~80 in DOT)

### Data Model Structure
- **Hierarchy:** Nested tree structure — clusters contain children arrays, mirroring the DOT nesting
- **Examples:** Parent nodes have an `examples` array: `[{name: "GPT-4o", description: "..."}, ...]` — displayed on parent's page and side panel
- **Edges:** Separate top-level edges array with `{source, target, label, type}` — canonical source for D3 force simulation. Side panel derives per-node relationships from this.
- **File format:** Single JSON (or TypeScript) file with all nodes, edges, and cluster definitions
- **Edition label:** Global "2026 Edition" on landing page, no per-node dates

### DOT-to-JSON Extraction
- **Source of truth:** JSON becomes canonical after extraction. DOT file becomes a historical visual reference.
- **Extraction method:** Claude's discretion — manual conversion or one-time script, whichever produces higher-quality JSON

### Claude's Discretion
- Extraction method (manual vs script)
- Exact Zod schema field names and types
- Content collection naming convention (aiNodes, aiLandscape, etc.)
- How to derive per-node relationships from the edges array at runtime vs build time
- Cluster color hex values for dark mode equivalents

</decisions>

<specifics>
## Specific Ideas

- The DOT file at `public/images/ai_landscape.dot` is the visual reference for node names, cluster nesting, edge labels, and relationship types
- Two-tier content follows the ELI5 toggle pattern: "simple" is default, "technical" is toggled
- "Why it matters" should connect to things non-technical users recognize (ChatGPT, self-driving cars, Netflix recommendations, etc.)
- The Beauty Index `languages.json` pattern is a good reference for single-file data + Zod validation + content collection registration

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 102-data-foundation*
*Context gathered: 2026-03-26*
