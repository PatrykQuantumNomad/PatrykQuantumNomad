# Phase 102: Data Foundation - Research

**Researched:** 2026-03-26
**Domain:** Astro content collections, Zod schema design, DOT-to-JSON data extraction
**Confidence:** HIGH

## Summary

Phase 102 converts the DOT-file-based AI landscape diagram into a canonical JSON data model with Zod validation and two-tier educational content. The project already has a mature pattern for this exact workflow -- the Beauty Index (`languages.json` + `languageSchema` + `file()` loader) and DB Compass (`models.json` + `dbModelSchema`) provide battle-tested templates. The technical challenge is modest; the content authoring (writing ~51 two-tier descriptions) is the bulk of the work.

The project runs Astro 5.17.1 with its Content Layer API. Content collections are defined in `src/content.config.ts` using `defineCollection()` with `file()` loaders for JSON data and Zod schemas imported from `src/lib/*/schema.ts`. The `file()` loader requires JSON arrays where each object has a unique `id` field. All schemas in this project use `import { z } from 'astro/zod'` (not bare `zod`). Vitest 4.0.18 is available for schema validation tests.

The DOT file contains 82 labeled nodes across 9 clusters (including one nested sub-cluster). Per CONTEXT.md decisions, approximately 31 of these become "examples" grouped into parent node `examples` arrays, leaving ~51 concept nodes as individual entries in the JSON data model. The edges array captures ~48 unique relationships with labeled types.

**Primary recommendation:** Follow the DB Compass pattern exactly -- single JSON file at `src/data/ai-landscape/nodes.json`, Zod schema at `src/lib/ai-landscape/schema.ts`, content collection registered in `src/content.config.ts` with `file()` loader. Write all content inline in the JSON.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Content Depth & Tone
- **Simple tier:** Informed layperson level -- plain English, assumes basic tech literacy but no AI expertise. ~100-150 words per node.
- **Technical tier:** Wikipedia-level -- accurate terminology, brief history, key characteristics. Assumes some CS knowledge. ~100-150 words per node.
- **"Why it matters" field:** Each node gets a 1-2 sentence "why it matters" line connecting abstract concepts to real-world impact (e.g., for LLMs: "This is the technology behind ChatGPT, Claude, and Gemini.")
- Content written by Claude during this phase -- user reviews quality in verification

#### Node Taxonomy
- **Concept nodes stay as individual graph nodes:** AI subfields (NLP, CV, Robotics, Expert Systems, etc.), ML types (Supervised, Unsupervised, Reinforcement), DL architectures (CNN, RNN, Transformers), LLM-related concepts (RAG, Prompt Engineering, Hallucination, etc.), Agentic characteristics (Autonomy, Tool Use, Memory, etc.), Intelligence Levels (ANI, ACI, AGI, ASI)
- **Product/framework examples are GROUPED into parent nodes:** GPT-4o/Claude/Gemini/Llama/DeepSeek listed as examples on LLM page. Stable Diffusion/DALL-E/Midjourney/Sora on Diffusion Models page. o1/o3/DeepSeek R1/Extended Thinking on Reasoning Models page. BERT on Foundation Models page. LangGraph/CrewAI/AutoGen/AG2/Anthropic SDK/OpenClaw on Agentic AI page. Claude Code/Cursor/Copilot/Windsurf on AI Coding Assistants page.
- **ML techniques grouped into parents:** Decision Trees, SVM, K-Means, Linear Regression, Logistic Regression, PCA, Ensemble listed on Supervised/Unsupervised Learning pages
- **NN concepts grouped into parent:** Perceptron, MLP, Backpropagation, Activation Functions, SOM listed on Neural Networks page
- **Historical DL architectures grouped:** LSTM, GRU on RNN page. DBN, Boltzmann Machines on Deep Learning page
- **Estimated final node count:** ~50-55 concept nodes (down from ~80 in DOT)

#### Data Model Structure
- **Hierarchy:** Nested tree structure -- clusters contain children arrays, mirroring the DOT nesting
- **Examples:** Parent nodes have an `examples` array: `[{name: "GPT-4o", description: "..."}, ...]` -- displayed on parent's page and side panel
- **Edges:** Separate top-level edges array with `{source, target, label, type}` -- canonical source for D3 force simulation. Side panel derives per-node relationships from this.
- **File format:** Single JSON (or TypeScript) file with all nodes, edges, and cluster definitions
- **Edition label:** Global "2026 Edition" on landing page, no per-node dates

#### DOT-to-JSON Extraction
- **Source of truth:** JSON becomes canonical after extraction. DOT file becomes a historical visual reference.
- **Extraction method:** Claude's discretion -- manual conversion or one-time script, whichever produces higher-quality JSON

### Claude's Discretion
- Extraction method (manual vs script)
- Exact Zod schema field names and types
- Content collection naming convention (aiNodes, aiLandscape, etc.)
- How to derive per-node relationships from the edges array at runtime vs build time
- Cluster color hex values for dark mode equivalents

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | DOT file converted to canonical TypeScript/JSON data model with ~80 nodes, cluster membership, and edge relationships | Node inventory completed: 51 concept nodes + 31 grouped examples. Edge extraction pattern documented. File location and format established via existing project patterns. |
| DATA-02 | Zod-validated content collection schema for AI landscape concepts (slug, name, cluster, simpleDescription, technicalDescription, relationships) | Schema design pattern verified from Beauty Index + DB Compass examples. `import { z } from 'astro/zod'` confirmed as project convention. |
| DATA-03 | Two-tier educational content (simple + technical) written for all ~80 nodes in plain English for non-technical audience | Content applies to ~51 concept nodes (the individual entries). Grouped examples get short descriptions in their parent's examples array. Word count targets: 100-150 words per tier per node. |
| DATA-04 | Edge data preserves relationship labels from DOT file ("subset of", "enables", "e.g.", "powers", "characterized by") | ~48 edge relationships identified in DOT file. Edge types catalogued: subset of, enables, e.g., powers, characterized by, includes fields, types, architectures, paradigms, technique, variants, specialisation of, related tech/concepts, built with, standardizes, informs, combined with DL, trains via, extends to, uses, primarily develops, Potential Progression, relates to, aims for, aspires to, steps toward, paradigm applied, enables interop, used by. |
| DATA-05 | Content collection registered in Astro config with file() loader | Exact registration pattern confirmed from `src/content.config.ts`. The `file()` loader + Zod schema pattern is used for 4 existing collections in this project. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Repository is a GitHub profile repo for PatrykQuantumNomad / patrykgolabek.dev
- SEO and public visibility are the primary goals
- Content tone: professional but approachable, first person, concise, confident
- Use GitHub-flavored Markdown compatible formatting
- Keyword-rich content with natural searchable terms

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 | Framework -- content collections, `file()` loader, `defineCollection()` | Already installed, project runs on it |
| zod (via `astro/zod`) | 3.25.76 | Schema validation for content collection entries | Already used by all 4 existing JSON collections in this project |
| vitest | 4.0.18 | Schema unit tests | Already configured at `vitest.config.ts` with `src/**/*.test.ts` pattern |
| typescript | 5.9.3 | Type safety, `z.infer<>` for derived types | Already installed, project uses strict Astro tsconfig |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | This phase requires no additional dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single JSON file | Multiple JSON files per cluster | Single file is simpler, matches Beauty Index / DB Compass pattern, and the data is small enough (~51 entries) |
| `file()` loader | `glob()` loader with MDX per node | Would allow Markdown body content but adds 51 files; JSON is simpler for structured data and matches the project's data-centric pattern |
| `astro/zod` | bare `zod` package | Project convention is `import { z } from 'astro/zod'` -- must follow this |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── data/
│   └── ai-landscape/
│       └── nodes.json           # Single canonical data file (~51 concept nodes + edges + clusters)
├── lib/
│   └── ai-landscape/
│       ├── schema.ts            # Zod schemas (nodeSchema, edgeSchema, clusterSchema, etc.)
│       ├── types.ts             # Derived TypeScript types (optional -- can co-locate in schema.ts)
│       └── __tests__/
│           └── schema.test.ts   # Zod validation tests
└── content.config.ts            # Register aiLandscape collection with file() loader
```

### Pattern 1: Single-File JSON Data + Zod Schema + Content Collection
**What:** All concept nodes, edges, and cluster metadata live in one JSON file. A Zod schema validates each entry. The content collection registration in `content.config.ts` uses the `file()` loader.
**When to use:** When the data is structured, relatively small (<200 entries), and consumed by multiple downstream features (pages, graph, panel, search).
**Example:**
```typescript
// src/lib/ai-landscape/schema.ts
// Source: Matches existing patterns in src/lib/beauty-index/schema.ts and src/lib/db-compass/schema.ts
import { z } from 'astro/zod';

export const exampleSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const aiNodeSchema = z.object({
  id: z.string(),                              // URL-safe slug, e.g., "large-language-models"
  name: z.string(),                            // Display name, e.g., "Large Language Models (LLM)"
  slug: z.string(),                            // URL slug for /ai-landscape/[slug]/
  cluster: z.string(),                         // Cluster ID, e.g., "genai"
  parentId: z.string().nullable(),             // Parent concept node ID, null for root nodes
  simpleDescription: z.string().min(50),       // Layperson tier, ~100-150 words
  technicalDescription: z.string().min(50),    // Technical tier, ~100-150 words
  whyItMatters: z.string(),                    // 1-2 sentence real-world connection
  examples: z.array(exampleSchema).default([]),// Grouped product/framework examples
  dotNodeId: z.string(),                       // Original DOT node identifier for traceability
});

export type AiNode = z.infer<typeof aiNodeSchema>;

export const edgeSchema = z.object({
  source: z.string(),     // Source node slug
  target: z.string(),     // Target node slug
  label: z.string(),      // Relationship label from DOT, e.g., "subset of"
  type: z.enum([
    'hierarchy',           // "subset of" backbone
    'includes',            // "includes fields", "types", "architectures"
    'enables',             // "enables", "powers"
    'example',             // "e.g."
    'relates',             // "relates to", "informs", "combined with"
    'progression',         // "Potential Progression" (intelligence levels)
    'characterizes',       // "characterized by"
    'other',               // Catch-all for remaining edge types
  ]),
});

export type Edge = z.infer<typeof edgeSchema>;

export const clusterSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),        // Light mode hex from DOT bgcolor
  darkColor: z.string(),    // Dark mode equivalent
  parentClusterId: z.string().nullable(),
});

export type Cluster = z.infer<typeof clusterSchema>;
```

### Pattern 2: JSON Data File Structure
**What:** The JSON file is a flat array of node objects (for `file()` loader compatibility) with cluster and edge data stored separately or at the top level.
**When to use:** The `file()` loader expects a JSON array of objects with `id` fields. Edges and clusters are not individual collection entries -- they are supporting data.

**Recommended approach -- two files:**
```typescript
// src/data/ai-landscape/nodes.json -- array of AiNode objects (consumed by file() loader)
[
  {
    "id": "artificial-intelligence",
    "name": "Artificial Intelligence (AI)",
    "slug": "artificial-intelligence",
    "cluster": "ai",
    "parentId": null,
    "simpleDescription": "...",
    "technicalDescription": "...",
    "whyItMatters": "...",
    "examples": [],
    "dotNodeId": "AI_Node"
  },
  ...
]

// src/data/ai-landscape/graph.json -- edges and clusters (imported directly, not a collection)
{
  "clusters": [...],
  "edges": [...]
}
```

**Why two files:** The `file()` loader expects a flat JSON array of homogeneous objects. Mixing nodes, edges, and clusters into one file would require a custom parser. Two files keeps the `file()` loader happy for nodes (the content collection) while edges and clusters are imported directly in TypeScript where they are needed (graph rendering, page generation). The Zod schemas still validate everything -- just not via the content collection API.

### Pattern 3: Content Collection Registration
**What:** Register the node data as a content collection in `content.config.ts`.
**Example:**
```typescript
// src/content.config.ts addition
import { aiNodeSchema } from './lib/ai-landscape/schema';

const aiLandscape = defineCollection({
  loader: file('src/data/ai-landscape/nodes.json'),
  schema: aiNodeSchema,
});

// Add to exports
export const collections = {
  // ...existing collections
  aiLandscape,
};
```

### Anti-Patterns to Avoid
- **Putting content in MDX files per node:** The Beauty Index/DB Compass pattern uses inline JSON strings for descriptions. With ~51 nodes this is manageable and keeps everything in one place. MDX per node would create 51 files and require `glob()` loader instead of `file()`.
- **Importing `z` from bare `zod`:** The project convention is `import { z } from 'astro/zod'`. Using bare `zod` can cause version mismatches.
- **Edges as a content collection:** Edges are relational, not entities. Store them as a separate JSON file imported directly in TypeScript.
- **Storing derived relationships on each node:** The CONTEXT.md explicitly says "Side panel derives per-node relationships from the edges array." Pre-computing per-node relationships at build time is fine for performance, but the canonical source must be the edges array.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom validation logic | Zod schemas via `astro/zod` | Project convention, type inference, content collection integration |
| Content collection loading | Custom JSON parsing + global state | `file()` loader + `getCollection()` | Already proven pattern in 4 project collections, gives type safety for free |
| DOT file parsing | Regex-based DOT parser | Manual conversion referencing the DOT file | The DOT file is small (322 lines), well-structured, and will only be converted once. A parser is overengineering for a one-time extraction. |
| Dark mode colors | Manual color picking | Systematic HSL shift of DOT's light-mode bg colors | Consistent results, less error-prone |
| Slug generation | Custom slugify function | Hand-authored slugs in JSON | Only ~51 entries; hand-authored slugs ensure URL-friendly, SEO-optimal values without edge cases (e.g., "RLHF / DPO" vs "rlhf-dpo") |

**Key insight:** This phase is fundamentally a data authoring task, not an engineering task. The technical infrastructure (Astro content collections, Zod, file loader) already exists and works. The effort is in producing high-quality, accurate educational content for ~51 AI concepts and structuring the data correctly.

## Common Pitfalls

### Pitfall 1: file() Loader ID Requirement
**What goes wrong:** The `file()` loader silently fails or produces no entries if JSON objects lack an `id` field.
**Why it happens:** Unlike `glob()` which auto-generates IDs from filenames, `file()` requires each object in the JSON array to have an explicit `id` property.
**How to avoid:** Ensure every node object in `nodes.json` has a unique `id` field. The schema should enforce `id: z.string()`.
**Warning signs:** `getCollection('aiLandscape')` returns an empty array.

### Pitfall 2: Zod Import Source
**What goes wrong:** Build fails or types don't match when importing Zod from the wrong package.
**Why it happens:** The project has both `astro/zod` (re-exported by Astro) and potentially `zod` as a transitive dependency. Using the wrong one causes type incompatibilities.
**How to avoid:** Always use `import { z } from 'astro/zod'` in schema files. Match the existing patterns in `src/lib/beauty-index/schema.ts`, `src/lib/db-compass/schema.ts`, and `src/lib/eda/schema.ts`.
**Warning signs:** TypeScript errors about incompatible Zod types in `content.config.ts`.

### Pitfall 3: Content Quality Inconsistency
**What goes wrong:** Some nodes get rich, engaging descriptions while others are perfunctory. Simple tier drifts into jargon. Technical tier is too shallow or too deep.
**Why it happens:** Writing 51x2 descriptions in sequence leads to fatigue and inconsistency. Early nodes get more attention than later ones.
**How to avoid:** Write content by cluster (all AI subfield nodes together, all ML nodes together, etc.) to maintain consistent depth. Use a template for each tier. Review by reading all "simple" descriptions sequentially, then all "technical" ones.
**Warning signs:** Word counts vary wildly between nodes. Simple descriptions use terms like "epoch" or "gradient descent." Technical descriptions are just slightly rephrased versions of simple ones.

### Pitfall 4: Edge Data Loss During Grouping
**What goes wrong:** When grouping product examples into parent nodes (e.g., GPT-4o into LLM), the edges that pointed to those products in the DOT file are lost.
**Why it happens:** The DOT file has edges like `Transformers -> GPT` and `MoE -> DeepSeek`. After grouping, GPT and DeepSeek are not standalone nodes, so these edges have no target.
**How to avoid:** When grouping, redirect meaningful edges to the parent node. `Transformers -> GPT` becomes `Transformers -> LLM` (which the "powers" edge already covers). Document which DOT edges were intentionally dropped vs. redirected.
**Warning signs:** The edge count drops dramatically after grouping, losing important conceptual relationships.

### Pitfall 5: Cluster Nesting Not Captured
**What goes wrong:** The flat JSON structure loses the deeply nested cluster hierarchy (AI > ML > NN > DL > GenAI).
**Why it happens:** JSON arrays are flat. The DOT file uses `subgraph` nesting to express hierarchy.
**How to avoid:** Each cluster object has a `parentClusterId` field. Each node has a `cluster` field pointing to its immediate cluster. The nesting can be reconstructed at render time by walking `parentClusterId` chains.
**Warning signs:** Graph rendering cannot determine that GenAI is inside DL which is inside NN.

### Pitfall 6: Slug Collisions
**What goes wrong:** Two nodes end up with the same slug, causing build failures or overwritten pages.
**Why it happens:** Similar names like "Planning & Scheduling" (AI subfield) and "Planning & Decomposition" (agentic characteristic) could both slugify to "planning".
**How to avoid:** Hand-author all slugs. Use descriptive, unique slugs: `planning-scheduling` vs `agent-planning`. The slug is also the `id` field for the content collection.
**Warning signs:** Astro build error about duplicate collection entries.

## Code Examples

Verified patterns from this project's existing code:

### Existing Schema Pattern (Beauty Index)
```typescript
// Source: src/lib/beauty-index/schema.ts (verified)
import { z } from 'astro/zod';

export const languageSchema = z.object({
  id: z.string(),
  name: z.string(),
  phi: dimensionScoreSchema,
  // ...
  tier: tierSchema,
  characterSketch: z.string(),
  year: z.number().int().optional(),
  paradigm: z.string().optional(),
});

export type Language = z.infer<typeof languageSchema>;
```

### Existing Content Collection Registration Pattern
```typescript
// Source: src/content.config.ts (verified)
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { languageSchema } from './lib/beauty-index/schema';

const languages = defineCollection({
  loader: file('src/data/beauty-index/languages.json'),
  schema: languageSchema,
});

export const collections = { /* ... */ languages /* ... */ };
```

### Existing Schema Test Pattern
```typescript
// Source: src/lib/guides/__tests__/schema.test.ts (verified)
import { describe, it, expect } from 'vitest';
import { guidePageSchema } from '../schema';

describe('guidePageSchema', () => {
  it('validates a correct guide page object', () => {
    const result = guidePageSchema.safeParse({
      title: 'Builder Pattern',
      description: 'How the app composes itself',
      order: 0,
      slug: 'builder-pattern',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when required fields are missing', () => {
    const result = guidePageSchema.safeParse({ title: 'Missing fields' });
    expect(result.success).toBe(false);
  });
});
```

### Querying Collection Data in Astro Pages
```typescript
// Source: Astro docs pattern, verified against project usage
import { getCollection, getEntry } from 'astro:content';

// Get all nodes
const allNodes = await getCollection('aiLandscape');

// Get a single node
const llmNode = await getEntry('aiLandscape', 'large-language-models');
// Access: llmNode.data.name, llmNode.data.simpleDescription, etc.
```

## DOT File Node Inventory

Detailed breakdown of the 82 DOT nodes mapped to the CONTEXT.md grouping decisions:

### Concept Nodes (~51 entries in nodes.json)

| Cluster | Concept Nodes | Count |
|---------|---------------|-------|
| AI | AI_Node, NLP, CV, Robotics, ExpertSystems, PlanningScheduling, KnowledgeRep, SpeechRec, SearchOptimization, AI_Ethics | 10 |
| ML | ML_Node, Supervised, Unsupervised, Reinforcement, SemiSupervised, SelfSupervised | 6 |
| NN | NN_Node | 1 |
| DL | DL_Node, CNN, RNN, Transformers, Autoencoders, FoundationModels, DeepRL, MoE, Multimodal, ReasoningModels | 10 |
| GenAI | GenAI_Node, GANs, VAEs, Diffusion, LLM, RLHF, PromptEng, FewZeroShot, Hallucination, RAG, FineTuning, ContextWindow | 12 |
| Levels | ANI, ACI, AGI, ASI | 4 |
| Agentic | AgenticAI, Autonomy, AgentPlanning, ToolUse, AgentMemory, SelfCorrection | 6 |
| DevTools | AIDevTools | 1 |
| Standalone | MCP | 1 |
| **Total** | | **51** |

### Grouped Examples (stored in parent `examples` arrays)

| Parent Node | Examples | Count |
|-------------|----------|-------|
| LLM | GPT-4o/GPT-5, Claude, Gemini, Llama, DeepSeek | 5 |
| Diffusion | Stable Diffusion, DALL-E 2/3, Midjourney, Sora | 4 |
| ReasoningModels | o1/o3, DeepSeek R1, Extended Thinking | 3 |
| FoundationModels | BERT | 1 |
| AgenticAI | LangGraph, CrewAI, AutoGen, AG2, Anthropic Agent SDK, OpenClaw | 6 |
| AIDevTools | Claude Code, Cursor, GitHub Copilot, Windsurf | 4 |
| Supervised | Decision Trees, SVM, Linear Regression, Logistic Regression, Ensemble Methods | 5 |
| Unsupervised | K-Means Clustering, PCA | 2 |
| NN_Node | Perceptron, MLP, Backpropagation, Activation Functions, SOM | 5 |
| RNN | LSTM, GRU | 2 |
| DL_Node | DBN, Boltzmann Machines | 2 |
| **Total** | | **39** |

**Note:** The total is 51 + 39 = 90 accounted items vs 82 DOT nodes. The difference is because some DOT nodes appear both as labeled nodes and as unlabeled references (e.g., Robotics, Hallucination, Midjourney appear as node names without explicit `[label=...]` declarations). All 82 explicitly labeled DOT nodes are accounted for.

## Cluster Color Mapping

### Light Mode (from DOT file)
| Cluster | DOT bgcolor | Cluster ID |
|---------|-------------|------------|
| Artificial Intelligence | `#e0f7fa` (Light cyan) | `ai` |
| Machine Learning | `#c8e6c9` (Light green) | `ml` |
| Neural Networks | `#fff9c4` (Light yellow) | `nn` |
| Deep Learning | `#ffecb3` (Amber) | `dl` |
| Generative AI | `#ffcdd2` (Light pink) | `genai` |
| Levels of Intelligence | `#eeeeee` (Light grey) | `levels` |
| Agentic AI | `#d1c4e9` (Light purple) | `agentic` |
| Agent Frameworks | `#b39ddb` (Deeper purple) | `agent-frameworks` |
| AI Developer Tools | `#b3e5fc` (Light blue) | `devtools` |

### Dark Mode Equivalents (Recommendation)
Use desaturated, darkened versions of each light-mode color. These need to maintain sufficient contrast for white text on a dark background while remaining visually distinct from each other:

| Cluster | Recommended Dark Mode | Rationale |
|---------|-----------------------|-----------|
| AI | `#00696e` | Dark teal, preserves cyan identity |
| ML | `#2e7d32` | Dark green, strong contrast |
| NN | `#827717` | Dark olive-yellow, avoids muddy brown |
| DL | `#e65100` | Deep amber/orange, distinct |
| GenAI | `#c62828` | Dark red, preserves pink/red identity |
| Levels | `#424242` | Dark grey, neutral |
| Agentic | `#4527a0` | Deep purple, strong identity |
| Agent Frameworks | `#311b92` | Deeper indigo-purple, distinguishable from parent |
| DevTools | `#01579b` | Dark blue, preserves light blue identity |

## Discretion Recommendations

### Extraction Method: Manual Conversion
**Recommendation:** Manual conversion (Claude writes the JSON directly) rather than a DOT parser script.
**Rationale:**
1. The DOT file is only 322 lines -- small enough to read entirely.
2. Content authoring (descriptions, examples) must be manual anyway.
3. A parser would extract structure but still require manual content addition.
4. The grouping decisions (31 nodes becoming examples) require human judgment about which edges to keep vs. drop.
5. One-time extraction -- no need for repeatability.

### Content Collection Name: `aiLandscape`
**Recommendation:** Use `aiLandscape` as the collection name.
**Rationale:**
- Matches the project's camelCase convention for collection names (`dbModels`, `edaTechniques`, `edaDistributions`)
- Descriptive and unambiguous
- Used as `getCollection('aiLandscape')` in downstream phases

### Relationship Derivation: Build-Time Helper Function
**Recommendation:** Store edges in a separate `graph.json` file. Provide a helper function in `src/lib/ai-landscape/schema.ts` (or a separate `helpers.ts`) that derives per-node relationships from the edges array. This runs at build time in `.astro` pages.
**Rationale:**
- Edges are the canonical source (per CONTEXT.md decision)
- Per-node relationship lookups are needed by: concept pages (Phase 103), detail panel (Phase 106), ancestry paths (Phase 106)
- Build-time derivation is fast for ~48 edges and avoids duplicating data
- Example helper:
```typescript
export function getNodeRelationships(nodeSlug: string, edges: Edge[]): {
  parents: Edge[];
  children: Edge[];
  related: Edge[];
} {
  return {
    parents: edges.filter(e => e.target === nodeSlug),
    children: edges.filter(e => e.source === nodeSlug),
    related: edges.filter(e =>
      (e.source === nodeSlug || e.target === nodeSlug) &&
      e.type === 'relates'
    ),
  };
}
```

### Cluster Dark Mode Colors
See the "Cluster Color Mapping" section above for recommended hex values.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` with `type: 'content'` | `src/content.config.ts` with loaders (`file()`, `glob()`) | Astro 5.0 (Dec 2024) | This project already uses the new approach |
| Separate `zod` package | `astro/zod` re-export | Astro 5.0 | This project already uses `astro/zod` |
| Manual type definitions | `z.infer<typeof schema>` | Standard Zod pattern | This project already uses this pattern |

**Deprecated/outdated:**
- `type: 'content'` / `type: 'data'` in `defineCollection()` -- replaced by explicit loaders in Astro 5.0. This project does not use the old pattern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run src/lib/ai-landscape/__tests__/schema.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | JSON data file has ~51 nodes with required fields | unit | `npx vitest run src/lib/ai-landscape/__tests__/schema.test.ts -x` | Wave 0 |
| DATA-02 | Zod schema validates correct nodes and rejects malformed ones | unit | `npx vitest run src/lib/ai-landscape/__tests__/schema.test.ts -x` | Wave 0 |
| DATA-03 | All nodes have simpleDescription and technicalDescription meeting min length | unit | `npx vitest run src/lib/ai-landscape/__tests__/content.test.ts -x` | Wave 0 |
| DATA-04 | Edge data has source, target, label, type for all relationships | unit | `npx vitest run src/lib/ai-landscape/__tests__/schema.test.ts -x` | Wave 0 |
| DATA-05 | Astro build succeeds and `getCollection('aiLandscape')` returns entries | smoke | `npx astro build 2>&1 \| tail -5` | Verified by build |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/ai-landscape/__tests__/ -x`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + successful `npx astro build`

### Wave 0 Gaps
- [ ] `src/lib/ai-landscape/__tests__/schema.test.ts` -- covers DATA-01, DATA-02, DATA-04
- [ ] `src/lib/ai-landscape/__tests__/content.test.ts` -- covers DATA-03 (word count checks, all nodes have both tiers)

## Open Questions

1. **Agent Frameworks sub-cluster handling**
   - What we know: The DOT file has `cluster_AgentFrameworks` nested inside `cluster_Agentic`. Per CONTEXT.md, all agent frameworks (LangGraph, CrewAI, etc.) are grouped as examples on the AgenticAI page.
   - What's unclear: Should `agent-frameworks` remain as a distinct cluster in the clusters data, or be merged into `agentic`? It has a distinct color (`#b39ddb` vs `#d1c4e9`).
   - Recommendation: Keep it as a sub-cluster with `parentClusterId: "agentic"`. The graph rendering in Phase 104/105 may want the visual distinction. This is a data-preserving choice that doesn't constrain downstream phases.

2. **Edge deduplication after grouping**
   - What we know: Some edges in the DOT point from concept nodes to example nodes (e.g., `Transformers -> GPT`, `MoE -> DeepSeek`). After grouping, these targets become examples, not standalone nodes.
   - What's unclear: Should these edges be redirected to parent nodes, or dropped entirely?
   - Recommendation: Redirect meaningful ones to parent nodes when not redundant. `Transformers -> GPT` is redundant with `Transformers -> LLM` (already exists as "powers"). `MoE -> DeepSeek` is meaningful -- redirect to a note in the examples array or add `MoE -> LLM` with "technique used by" label. Document all redirects.

## Sources

### Primary (HIGH confidence)
- `src/content.config.ts` -- verified existing content collection registration patterns for `file()` loader
- `src/lib/beauty-index/schema.ts` -- verified Zod schema pattern with `import { z } from 'astro/zod'`
- `src/lib/db-compass/schema.ts` -- verified complex schema with nested objects and enums
- `src/lib/eda/schema.ts` -- verified additional schema pattern
- `src/lib/guides/__tests__/schema.test.ts` -- verified test pattern for schema validation
- `public/images/ai_landscape.dot` -- verified DOT source file (322 lines, 82 labeled nodes)
- `vitest.config.ts` -- verified test infrastructure
- `package.json` -- verified Astro 5.17.1, TypeScript 5.9.3, Vitest 4.0.18

### Secondary (MEDIUM confidence)
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- verified `file()` loader requires `id` field, JSON array format
- [Astro Content Loader API reference](https://docs.astro.build/en/reference/content-loader-reference/) -- verified `file()` loader configuration options

### Tertiary (LOW confidence)
- Dark mode color hex recommendations -- based on color theory principles, not verified against specific design system. Should be validated visually during Phase 104.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in this project; patterns verified from source code
- Architecture: HIGH -- directly replicates existing Beauty Index / DB Compass patterns; `file()` loader behavior confirmed via official docs
- Pitfalls: HIGH -- derived from analyzing actual project code patterns and Astro docs; `id` field requirement confirmed
- Content structure: HIGH -- node inventory derived directly from DOT file; grouping decisions locked in CONTEXT.md
- Dark mode colors: LOW -- recommendations based on general color theory, not verified visually

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- Astro content collections API is mature, project patterns are established)
