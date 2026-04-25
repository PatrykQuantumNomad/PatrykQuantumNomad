# Feature Research: RAG Architecture Patterns Blog + Companion Repo

**Domain:** Research-heavy thought-leadership blog post with runnable companion repository (5-tier RAG architecture progression)
**Researched:** 2026-04-17
**Confidence:** HIGH

## Feature Landscape

This analysis maps the content and technical features needed for a ~4,500-word blog post on RAG architecture progression and a companion GitHub repo with runnable examples for all 5 tiers. The domain is a hybrid format: conceptual narrative (like Dark Code) fused with executable demonstrations (like the FastAPI Production Guide). The reference set includes the Galileo "RAG Architecture: From Naive to Agentic" progression, the arxiv "Is Agentic RAG Worth It?" benchmark paper (2601.07711), Starmorph's 2026 RAG Techniques Compared guide, NirDiamant/RAG_Techniques (42-notebook companion repo), and the existing Dark Code blog post pattern on patrykgolabek.dev.

### Table Stakes (Readers Expect These)

Features readers assume exist in a 2026 RAG architecture blog post. Missing these = post feels shallow or behind the curve.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **OpeningStatement + TldrSummary** | Established site pattern. Every research-heavy post uses this. Readers arriving from search expect the thesis in 10 seconds | LOW | Already exists. Reuse from Dark Code. Opening should state the thesis: "RAG is an architecture decision, not an implementation detail" |
| **Clear 5-tier progression narrative** | The thesis IS the progression. Without it the post is just another "what is RAG" explainer. Readers need to understand WHY each tier exists and what problem it solves that the previous tier cannot | MEDIUM | Content-only. H2 per tier. Each tier section needs: problem statement, architecture diagram reference, key insight, link to companion code |
| **Cost/latency/accuracy comparison across tiers** | 2026 readers are past "RAG is cool" and into "what does it cost." The arxiv paper (2601.07711) shows Agentic RAG costs 2.7-3.9x more tokens with only marginal accuracy gains. Starmorph benchmarks: Naive $0.001/query vs Agentic $0.01-0.10/query. This data is what makes the architecture-decision thesis concrete | MEDIUM | Use StatHighlight components for the key numbers. Must cite arxiv paper and at least 2 additional benchmark sources |
| **Same dataset across all 5 tiers** | This is the single most important structural decision. Every existing RAG comparison blog uses different datasets per technique, making comparison impossible. Using one enterprise knowledge base scenario across all tiers is what makes the progression visible | HIGH | Enterprise knowledge base scenario: company policy docs, technical specs, org charts, meeting notes, architecture diagrams. Mix of text, tables, images to stress multimodal tier |
| **Companion GitHub repo with runnable examples** | In 2026, blog posts without code are opinion pieces. The NirDiamant/RAG_Techniques pattern (42 notebooks) is the standard. Practitioners want to clone, run, and see results | HIGH | Separate repo: `rag-architecture-patterns`. One directory per tier with README, requirements, and a single-file runnable script or notebook |
| **GFM footnotes with verified citations** | Established site pattern from Dark Code (28 footnotes, 56 sources). Research-heavy posts without citations are blog spam in 2026 | MEDIUM | NotebookLM notebook has 105+ references. Select 20-30 for inline footnotes. Verify URLs before committing (learned from Dark Code: HTTP 403 from bot-blocking is acceptable) |
| **Custom cover SVG** | Every blog post on the site has a custom cover SVG. Missing it breaks the listing page visual consistency | MEDIUM | Needs creation. Should visually communicate "progression" or "tiers" -- perhaps a layered architecture diagram motif |
| **JSON-LD BlogPosting schema** | Existing site infrastructure. Already auto-generates from frontmatter | LOW | Already exists. Pass wordCount and articleSection props |
| **OG image, sitemap, RSS, LLMs.txt** | Full site pipeline. Every post gets these automatically or with minimal config | LOW | Already exists. Follow Dark Code pattern |
| **Table of contents** | 4,500 words needs navigation. Auto-generated from H2/H3 headings | LOW | Already exists |
| **Reading time display** | Standard on the existing blog | LOW | Already implemented |
| **Tags for discoverability** | Blog tag pages exist. RAG post needs appropriate tags for cross-linking | LOW | Tags: `rag`, `ai`, `architecture`, `llm`, `knowledge-graph`, `enterprise` |
| **Cross-links to existing content** | The AI Landscape Explorer covers RAG, embeddings, and transformer concepts. The Claude Code Guide covers agent patterns. Internal linking creates topical authority | LOW | Link to AI Landscape Explorer, Claude Code Guide agent sections, and Dark Code post |

### Differentiators (Competitive Advantage)

Features that elevate the post from "another RAG tutorial" to "the definitive RAG architecture progression piece." These are where the post competes for shares, backlinks, and search ranking.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"RAG is an architecture decision" thesis framing** | Most RAG content in 2026 is implementation-focused: "how to chunk," "which vector DB," "LangChain vs LlamaIndex." The thesis that RAG tier selection is an architecture decision (like choosing microservices vs monolith) elevates the discussion to engineering leadership. This is the Dark Code equivalent of coining a term -- it reframes the conversation. Multiple enterprise sources confirm: "selecting the right RAG architecture is now a strategic architectural decision -- not an implementation detail" (Techment 2026) | LOW | Content decision, not a component. The thesis must appear in the opening statement, drive every tier section, and resolve in the conclusion |
| **Unified enterprise knowledge base scenario** | No existing RAG tutorial runs the same queries against the same dataset across 5 architectures. Every comparison uses toy examples (Wikipedia chunks, PDF summaries). A realistic enterprise knowledge base (policy docs + tech specs + org charts + meeting notes + architecture diagrams) across all tiers makes the quality/cost tradeoffs visceral and measurable | HIGH | Dataset design is critical. Needs: plain text docs (policy, procedures), structured data (org chart JSON, product catalog), tabular data (metrics, budgets), images (architecture diagrams, whiteboard photos), and cross-document relationships (policy references tech spec which references architecture diagram) |
| **StatHighlight components with benchmark data** | Dark Code proved that big-number callouts are the most shareable element. RAG has even better numbers: "$0.001 vs $0.10 per query" (100x cost difference), "2.7-3.9x token overhead for Agentic RAG" (arxiv 2601.07711), "25-40% accuracy improvement from Advanced RAG over Naive" (Starmorph 2026) | LOW | Already exists from v1.20. Place 4-6 StatHighlights across the post at tier transition points |
| **Per-tier architecture diagrams** | Text descriptions of RAG pipelines are insufficient. Readers need visual flow: query -> embed -> retrieve -> generate for Naive; query -> classify -> route -> rerank -> generate for Advanced. The existing site has 5 SVG diagrams for Claude Code and 3 for FastAPI -- this is an established pattern | HIGH | 5 SVG diagrams, one per tier. Follow the `diagram-base.ts` pattern from the Claude Code guide. Each diagram shows the data flow for that tier |
| **"When to use this tier" decision framework** | The Galileo blog and arxiv paper both conclude: neither approach is universally superior. The differentiator is giving readers a concrete decision matrix: "Use Tier 1 when X, Tier 3 when Y." This is the equivalent of Dark Code's "Dark Code Spectrum" framework -- a named, referenceable model | MEDIUM | Content decision with visual support. A comparison table or decision tree. Could use the existing table styling or a new lightweight component |
| **Adaptive RAG as the conclusion** | The 2026 consensus is that production systems should use Adaptive RAG: a query classifier routes to the cheapest tier that can handle each query. This is the "hidden sixth tier" that resolves the thesis -- the architecture decision is not picking ONE tier but building the routing logic to use all of them appropriately | MEDIUM | Content section. This is where the thesis pays off: if RAG is an architecture decision, then the best architecture is one that makes the decision per-query |
| **FAQ section with FAQPage schema** | "What is RAG architecture?" "What is the difference between naive and agentic RAG?" "How much does RAG cost per query?" -- these are high-search-volume queries that FAQPage schema can capture in Google's "People Also Ask" | LOW | Already exists: `FAQPageJsonLd.astro`. 5-7 FAQ items targeting real search queries |
| **Repo structure: one directory per tier, shared dataset** | The NirDiamant/RAG_Techniques repo uses one notebook per technique but different datasets. The differentiator is structuring the companion repo so the shared dataset is in `/data/` and each tier is in `/tier-N-name/` with a single runnable entry point. This makes the progression physically navigable | MEDIUM | Repo design decision. Each tier directory: `README.md`, `requirements.txt`, `main.py` (or notebook), and results output |
| **Source density from 105+ references** | Dark Code deployed 56 sources. The RAG post has 105+ from the NotebookLM notebook. This is genuinely unusual -- most RAG blog posts cite 5-10 sources. The research gravity effect (post becomes the definitive aggregation point) is even stronger for a rapidly evolving domain like RAG | LOW | Content strategy: cite 25-35 inline via GFM footnotes, keep the rest as supporting research. Never cite for the sake of citing |
| **Dual audience: practitioners AND engineering leaders** | Most RAG content targets only practitioners (code examples) or only leaders (strategy slides). The hybrid format -- conceptual narrative that leaders read + "Try It" links to runnable code that practitioners clone -- serves both audiences in a single post. The blog post IS the architecture argument; the repo IS the proof | MEDIUM | Structural decision. Each tier section needs a narrative paragraph (for leaders) and a concrete code/config snippet or "Try It" link (for practitioners) |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like they would enhance the post or repo but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Framework comparison (LangChain vs LlamaIndex vs LangGraph)** | "Which framework should I use?" is the most asked RAG question in 2026 | Framework comparison dates instantly (LangChain v0.3 broke v0.2 patterns, CrewAI 0.x APIs churn monthly). It shifts focus from architecture (which is durable) to implementation (which is ephemeral). The arxiv paper explicitly notes that "both approaches scaled similarly across different LLM sizes" -- the framework matters less than the architecture | Keep the companion repo framework-agnostic where possible. Use one framework consistently (Google ADK or lightweight Python) and note in the README that the patterns transfer to any framework |
| **Interactive RAG playground in the blog post** | "Let readers paste their own documents and query against each tier" | Massive implementation complexity (server-side inference, API keys, cost per visitor). The site is static (GitHub Pages). Even cloud-hosted playgrounds require ongoing cost management. The Dockerfile Analyzer and K8s Manifest Analyzer work because linting is client-side; RAG requires LLM inference | Link to the companion repo with clear "clone and run locally" instructions. Optionally include Colab links for zero-setup execution |
| **Vector database comparison (Pinecone vs Weaviate vs Chroma vs pgvector)** | "Which vector DB?" is the second most asked RAG question | Same problem as framework comparison: it dates instantly and shifts from architecture to infrastructure. The choice of vector DB matters far less than the choice of RAG architecture tier. Vectara's research shows chunking strategy has more impact on quality than embedding model choice, let alone DB choice | Mention the vector DB used in each tier example without positioning it as a recommendation. Note that the patterns work with any vector store |
| **Full production deployment guide** | "How do I deploy this RAG system?" | Scope explosion. The post's thesis is about architecture selection, not operations. Deployment patterns (Kubernetes, serverless, managed services) are each a separate blog post. The FastAPI Production Guide already covers deployment patterns | Keep the companion repo as "local development" examples. Note that production deployment adds concerns (scaling, monitoring, auth) that are out of scope |
| **Fine-tuning vs RAG comparison** | "Should I fine-tune or use RAG?" | Well-covered territory with a clear 2026 consensus (RAG for knowledge augmentation, fine-tuning for behavior modification). Adding it dilutes the post's unique thesis about architecture tiers. It is a fundamentally different question | One sentence in the introduction acknowledging the distinction, linking to authoritative sources |
| **Embedding model benchmarks** | "Which embedding model is best for my use case?" | MTEB leaderboard changes monthly. Any recommendation dates within weeks. The arxiv paper shows model choice matters less than architecture design | Note which embedding model the examples use. Link to MTEB for current rankings. Do not rank models |
| **Live benchmark results in the blog post** | "Show me real latency/cost numbers from your runs" | Numbers become stale as models and APIs update pricing. Screenshots of terminal output look amateur. Self-reported benchmarks lack credibility vs published research | Cite the arxiv paper (2601.07711) and Starmorph benchmarks for authoritative numbers. Include approximate cost/latency ranges, not exact measurements |
| **D3/interactive architecture diagrams** | "Make the diagrams interactive like the AI Landscape Explorer" | The AI Landscape Explorer justifies its D3 weight because exploration IS the product. For a blog post, static SVG diagrams (like the 5 Claude Code guide SVGs) are the correct choice: faster load, no JavaScript, screenshot-friendly, accessible | Build-time SVGs following the `diagram-base.ts` pattern. Dark/light theme via CSS custom properties |
| **Jupyter notebook embedded in the blog post** | "Run the code right in the blog" | EDA notebooks are downloadable, not embedded. Embedding notebooks adds massive JavaScript weight (Pyodide is 14MB+ WASM). The established pattern is download + Colab link | Companion repo with standalone scripts. "Open in Colab" links per tier if notebooks are used |
| **Covering every RAG technique** | "Add hybrid search, HyDE, RAPTOR, CRAG, Self-RAG, Corrective RAG, Speculative RAG..." | The Meilisearch blog lists 14 RAG types. Covering all of them turns the post into a taxonomy (boring, already exists) rather than a progression (compelling, unique). The 5-tier model is the editorial choice that makes the post work | Stick to 5 tiers. Mention that each tier subsumes techniques (e.g., Tier 2 can include hybrid search, reranking) without dedicating sections to every variant |

## Per-Tier Demonstration Scope

### Tier 1: Naive RAG

**What it demonstrates:** The baseline that most teams build first. Chunk -> Embed -> Retrieve -> Generate.

| Element | Content |
|---------|---------|
| **Problem it solves** | "I have documents and I want to ask questions about them" |
| **Architecture** | Document chunking (recursive character, 512 tokens) -> embedding (text-embedding-004) -> vector store (Chroma/in-memory) -> similarity search (top-k) -> LLM generation |
| **Key limitation to expose** | Query: "What is the relationship between our security policy and the architecture diagram for Service X?" -- Naive RAG retrieves chunks about security and chunks about Service X but cannot connect them. The answer is a hallucinated mashup |
| **StatHighlight** | "$0.001/query, 100-500ms latency" |
| **Companion repo** | `tier-1-naive/main.py` -- ~50 lines. Load docs, chunk, embed, query. Deliberately simple |
| **Complexity** | LOW |

### Tier 2: Google Managed RAG (Gemini File Search)

**What it demonstrates:** What happens when you hand the entire RAG pipeline to a cloud provider. Zero infrastructure, zero chunking decisions.

| Element | Content |
|---------|---------|
| **Problem it solves** | "I don't want to manage embeddings, chunking, or vector stores. I just want to upload files and ask questions" |
| **Architecture** | Upload docs to File Search store -> Gemini handles chunking, embedding, indexing -> Query with grounding tool -> Response with inline citations |
| **Key insight to surface** | Managed RAG eliminates the infrastructure burden but removes your ability to tune retrieval. You trade control for convenience. For simple knowledge bases this is the right trade. File Search supports text, docs, spreadsheets, presentations, code files -- up to 100MB each, at $0.15/M tokens for embedding |
| **Key limitation to expose** | Same cross-document relationship query. Managed RAG may or may not find the connection -- you cannot control the chunking strategy or retrieval logic. You get better results than Naive (Google's internal optimization) but no visibility into why |
| **Companion repo** | `tier-2-managed/main.py` -- File Search API calls. Show the dramatic reduction in code vs Tier 1 |
| **Complexity** | LOW |
| **Dependency** | Google Cloud project, Gemini API key |

### Tier 3: Graph RAG (LightRAG)

**What it demonstrates:** The paradigm shift from "retrieve similar chunks" to "traverse a knowledge graph." Entity extraction + relationship mapping.

| Element | Content |
|---------|---------|
| **Problem it solves** | "My questions require connecting information across multiple documents -- relationships between entities, not just keyword similarity" |
| **Architecture** | Document ingestion -> LLM entity/relationship extraction -> Knowledge graph construction (dual-level: entity-level + topic-level) -> Graph traversal + vector search hybrid -> LLM generation with graph context |
| **Key insight to surface** | LightRAG (EMNLP 2025) builds a knowledge graph automatically from documents using an LLM. Dual-level retrieval: low-level (specific entity relationships) and high-level (broader themes). This is where the cross-document query starts working -- the graph knows that "Security Policy Section 4.2" references "Architecture Diagram for Service X" |
| **Key limitation to expose** | Graph construction is expensive (LLM calls per document to extract entities). Latency 1-5s per query. Cost $0.02-0.15/query. The graph must be rebuilt when documents change. Works best for relatively static knowledge bases |
| **StatHighlight** | "2x processing time vs Naive RAG, but cross-document relationship queries go from hallucination to accurate answers" |
| **Companion repo** | `tier-3-graph/main.py` -- LightRAG setup, graph construction, dual-level query. Show the knowledge graph output |
| **Complexity** | MEDIUM |
| **Dependency** | lightrag-hku Python package, LLM API key |

### Tier 4: Multimodal RAG (RAG-Anything)

**What it demonstrates:** RAG beyond text. Images, tables, equations, diagrams -- all queryable through a unified interface.

| Element | Content |
|---------|---------|
| **Problem it solves** | "My knowledge base contains architecture diagrams, data tables, and flowcharts that text-only RAG ignores" |
| **Architecture** | Multi-stage pipeline: document parsing -> modality detection -> parallel processors (ImageModalProcessor, TableModalProcessor, EquationModalProcessor) -> unified knowledge graph with cross-modal edges -> multimodal retrieval -> LLM generation with visual context |
| **Key insight to surface** | RAG-Anything (HKUDS, built on LightRAG) is the first unified multimodal RAG framework. The "1+3+N" architecture: 1 knowledge graph engine + 3 built-in modality processors + N extensible plugins. This is where the architecture diagram in the enterprise knowledge base becomes queryable: "What services does the architecture diagram show as dependencies of the auth service?" |
| **Key limitation to expose** | Multimodal processing adds significant cost and latency. Image understanding requires vision models. The quality of answers about visual content depends heavily on the vision model's capability. Not all enterprises need multimodal RAG -- if your knowledge base is text-only, this tier adds cost without value |
| **Companion repo** | `tier-4-multimodal/main.py` -- RAG-Anything setup with image and table processors. Include sample architecture diagram and data table in the shared dataset |
| **Complexity** | HIGH |
| **Dependency** | rag-anything Python package, vision-capable LLM API |

### Tier 5: Agentic RAG

**What it demonstrates:** RAG as an autonomous reasoning loop, not a fixed pipeline. The agent decides what to retrieve, when to re-query, and whether the answer is sufficient.

| Element | Content |
|---------|---------|
| **Problem it solves** | "My queries require multi-step reasoning: first find X, then use X to look up Y, then synthesize X and Y into an answer" |
| **Architecture** | Query -> Agent controller (LLM as reasoning engine) -> Tool selection (vector search, graph traversal, web search, calculator) -> Iterative retrieval loop (retrieve -> evaluate -> re-query if insufficient) -> Self-reflection / answer quality check -> Final generation |
| **Key insight to surface** | Agentic RAG is not a pipeline; it is a control loop. The arxiv paper (2601.07711) shows: 2.7-3.9x more input tokens, 1.5x latency, up to 3.6x cost -- with only marginal accuracy gains on most query types. The paper's conclusion: "neither approach is universally superior." Agentic RAG shines for complex multi-hop questions but is pure waste for simple factual queries |
| **Key limitation to expose** | The same cross-document query that Tier 3 handles via graph traversal, Agentic RAG handles via iteration -- retrieving security policy, then detecting a reference to an architecture diagram, then retrieving that diagram, then synthesizing. It gets the right answer, but at 3-5x the cost and latency of the graph approach. The architecture decision: is the flexibility worth the cost? |
| **StatHighlight** | "$0.01-0.10/query, 2-10s latency, 2.7-3.9x token overhead vs Enhanced RAG" (arxiv 2601.07711) |
| **Companion repo** | `tier-5-agentic/main.py` -- Agent with retrieval tools, iterative loop, self-reflection. Use Google ADK or lightweight custom agent. Show the reasoning trace |
| **Complexity** | HIGH |
| **Dependency** | Agent framework (Google ADK or LangGraph), LLM API key |

### Resolution: Adaptive RAG (The Architecture Decision Made Per-Query)

**What it demonstrates:** The thesis resolution. The best architecture is not picking one tier but building a query classifier that routes each query to the cheapest tier that can handle it.

| Element | Content |
|---------|---------|
| **Key insight** | "The emerging best practice in 2026 is Adaptive RAG -- a query classifier routes each query to the appropriate pipeline based on complexity" (Starmorph 2026). Simple factual queries go to Tier 1 (fast, cheap). Relationship queries go to Tier 3 (graph traversal). Complex multi-hop questions go to Tier 5 (agentic loop). This is the architecture decision -- not which tier to use, but how to use all of them |
| **Placement** | Conclusion section of the blog post. Not a separate tier in the companion repo (that would be Tier 6, scope creep) |

## Feature Dependencies

```
[Enterprise Knowledge Base Dataset]
    |--required by--> [Tier 1: Naive RAG]
    |--required by--> [Tier 2: Managed RAG]
    |--required by--> [Tier 3: Graph RAG]
    |--required by--> [Tier 4: Multimodal RAG]
    |--required by--> [Tier 5: Agentic RAG]

[Tier 1: Naive RAG]
    |--must precede--> [Tier 2: Managed RAG] (shows what Tier 2 eliminates)
    |--must precede--> [Tier 3: Graph RAG] (shows what Tier 1 cannot do)

[Tier 3: Graph RAG (LightRAG)]
    |--must precede--> [Tier 4: Multimodal RAG (RAG-Anything)] (RAG-Anything is built on LightRAG)

[Custom Cover SVG]
    |--required by--> [OG Image] (auto-generated)
    |--required by--> [Blog Listing Card]

[StatHighlight component]  --> already exists from v1.20
[TermDefinition component] --> already exists from v1.20
[OpeningStatement]         --> already exists
[TldrSummary]              --> already exists
[GFM footnotes]            --> already exists (remark-gfm)
[BlogPosting JSON-LD]      --> already exists
[FAQPage JSON-LD]          --> already exists

[Per-Tier SVG Diagrams]
    |--follows pattern of--> [Claude Code Guide SVG Diagrams] (diagram-base.ts)
    |--enhances--> [Blog Post Narrative] (visual tier progression)

[Companion Repo]
    |--independent of--> [Blog Post Build] (separate GitHub repo)
    |--linked from--> [Blog Post] (inline "Try It" links per tier)
```

### Dependency Notes

- **Enterprise Knowledge Base Dataset is the critical path:** Every tier depends on the same dataset. Design it first. Include: plain text (policies, procedures), structured data (org chart JSON, product catalog), tabular data (metrics CSV), images (architecture diagrams PNG/SVG), and cross-document references (policy cites tech spec which cites architecture diagram). The dataset quality determines whether the tier progression is convincing.
- **Tier 3 must precede Tier 4:** RAG-Anything is built on top of LightRAG. The blog narrative should make this explicit -- Tier 4 extends Tier 3's knowledge graph with multimodal processors.
- **Per-tier SVG diagrams follow Claude Code pattern:** The 5 SVGs for the Claude Code guide (agentic loop, hook lifecycle, permission model, MCP topology, agent teams) used `diagram-base.ts`. Same pattern works here. Each diagram shows the data flow for one tier.
- **Companion repo is a separate GitHub repo:** Not built into the Astro site. Linked from the blog post. This follows the established pattern where tools live in the portfolio site and code examples live in separate repos.
- **All blog components already exist:** StatHighlight, TermDefinition, OpeningStatement, TldrSummary, KeyTakeaway, Callout, FAQ JSON-LD, BlogPosting JSON-LD -- all built in v1.20 or earlier. Zero new components needed for the blog post itself.

## MVP Definition

### Launch With (v1)

Minimum viable blog post + companion repo -- publishable and competitive.

- [ ] Enterprise knowledge base dataset designed and populated (text + tables + images + cross-references)
- [ ] Blog post: ~4,500 words with 5-tier narrative arc, thesis framing, and Adaptive RAG conclusion
- [ ] Blog post: OpeningStatement + TldrSummary + 4-6 StatHighlights + KeyTakeaways
- [ ] Blog post: 25-35 GFM footnote citations from 105+ NotebookLM sources (URLs verified)
- [ ] Blog post: Custom cover SVG
- [ ] Blog post: FAQPage JSON-LD with 5-7 high-search-volume questions
- [ ] Blog post: Cross-links to AI Landscape Explorer, Claude Code Guide, Dark Code post
- [ ] Blog post: Full frontmatter, tags, JSON-LD, OG image, LLMs.txt, sitemap
- [ ] Companion repo: `rag-architecture-patterns` with shared `/data/` directory
- [ ] Companion repo: 5 tier directories with README, requirements, and runnable main.py
- [ ] Companion repo: Root README with architecture overview, prerequisites, and per-tier instructions

### Add After Validation (v1.x)

Features to add once the core post is published and performing.

- [ ] Per-tier SVG architecture diagrams (5 diagrams following diagram-base.ts pattern) -- significant visual value but the post functions with text descriptions initially
- [ ] "Open in Colab" links per tier -- requires notebook versions of the Python scripts
- [ ] Comparison table component showing cost/latency/accuracy across all 5 tiers -- can be a standard markdown table at launch, enhanced later
- [ ] Cross-links FROM existing posts TO the RAG post (AI Landscape Explorer concept pages, Claude Code Guide agent chapter)

### Future Consideration (v2+)

Features to defer until the post's performance is validated.

- [ ] Companion video walkthrough of the 5 tiers -- high production effort, separate content medium
- [ ] Interactive tier selector tool page (like Database Compass) -- only if the decision framework resonates and organic traffic justifies the build
- [ ] Evaluation harness comparing RAGAS metrics across tiers -- significant implementation effort, better as a separate blog post
- [ ] Additional tiers (Self-RAG, Corrective RAG, Speculative RAG) -- scope creep, each could be its own post

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Enterprise knowledge base dataset | HIGH | HIGH | P1 |
| Blog post narrative (all 5 tiers + conclusion) | HIGH | HIGH (writing effort) | P1 |
| OpeningStatement + TldrSummary | HIGH | LOW (exists) | P1 |
| StatHighlight components (4-6) | HIGH | LOW (exists) | P1 |
| GFM footnote citations (25-35) | HIGH | MEDIUM (research curation) | P1 |
| Custom cover SVG | HIGH | MEDIUM | P1 |
| Companion repo structure + 5 tier scripts | HIGH | HIGH | P1 |
| Shared dataset in companion repo | HIGH | MEDIUM | P1 |
| FAQPage JSON-LD (5-7 questions) | MEDIUM | LOW (exists) | P1 |
| Cross-links to existing content | MEDIUM | LOW | P1 |
| JSON-LD + OG image + LLMs.txt + sitemap | MEDIUM | LOW (exists) | P1 |
| Comparison table (cost/latency/accuracy) | MEDIUM | LOW | P1 |
| Per-tier SVG architecture diagrams (5) | HIGH | HIGH | P2 |
| "Open in Colab" links | MEDIUM | MEDIUM | P2 |
| Cross-links from existing posts | LOW | LOW | P2 |
| Interactive tier selector tool page | LOW | HIGH | P3 |
| Evaluation harness (RAGAS metrics) | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- the post is incomplete without these
- P2: Should have, add within a week of publication
- P3: Nice to have, only if the post gains traction

## Competitor Feature Analysis

| Feature | Galileo "RAG Architecture" | NirDiamant/RAG_Techniques | Starmorph "RAG Compared" | arxiv 2601.07711 | Our Approach |
|---------|---------------------------|---------------------------|--------------------------|-------------------|--------------|
| **Tiers/levels** | 3 (Naive, Production, Agentic) | ~42 techniques (flat) | 6 (Naive, Advanced, Agentic, Graph, Modular, Adaptive) | 2 (Enhanced vs Agentic) | 5 tiers in a clear progression + Adaptive RAG conclusion |
| **Same dataset** | No | No (different per notebook) | No | Yes (benchmark datasets) | Yes -- single enterprise knowledge base across all 5 tiers |
| **Runnable code** | No | Yes (42 notebooks) | No | No (research paper) | Yes -- 5 runnable scripts, one per tier |
| **Cost/latency data** | Mentioned | No | Yes (table) | Yes (detailed) | Yes -- StatHighlight callouts with cited benchmarks |
| **Audience** | Practitioners | Practitioners | Both | Researchers | Both practitioners AND engineering leaders |
| **Thesis/framework** | Implicit (add complexity when needed) | None (reference collection) | Implicit (start simple) | "Neither universally superior" | Explicit: "RAG is an architecture decision, not an implementation detail" |
| **Citation density** | Low (~5) | Medium (~10 per notebook) | Medium (~15) | High (~30) | High (25-35 from 105+ source pool) |
| **Multimodal tier** | No | Limited | No | No | Yes -- RAG-Anything as Tier 4 |
| **Visual diagrams** | Minimal | Per-notebook | Table | Academic figures | Per-tier SVG architecture diagrams (P2) |
| **Enterprise framing** | Some | No (academic/tutorial) | Yes | No (benchmark) | Yes -- enterprise knowledge base scenario throughout |

## Sources

### RAG Architecture Progression
- [Galileo, "RAG Architecture: From Naive Pipelines to Agentic"](https://galileo.ai/blog/rag-architecture) -- 3-tier progression (Naive, Production, Agentic). HIGH confidence.
- [Starmorph, "RAG Techniques Compared: A Practical Guide to RAG in 2026"](https://blog.starmorph.com/blog/rag-techniques-compared-best-practices-guide) -- 6-architecture comparison with cost/latency tables. HIGH confidence.
- [arxiv 2601.07711, "Is Agentic RAG Worth It?"](https://arxiv.org/abs/2601.07711) -- Experimental comparison: Agentic 2.7-3.9x more tokens, 1.5x latency, up to 3.6x cost. HIGH confidence.
- [Techment, "10 RAG Architectures in 2026"](https://www.techment.com/blogs/rag-architectures-enterprise-use-cases-2026/) -- Enterprise strategy perspective: "RAG architecture is a strategic decision, not an implementation detail." MEDIUM confidence.
- [Explore Database, "RAG Design Patterns Explained (2026)"](https://www.exploredatabase.com/2026/03/rag-design-patterns-explained-2026.html) -- Naive, Hybrid, Graph, Agentic patterns. MEDIUM confidence.

### Specific Technologies
- [Google, "File Search Tool in Gemini API"](https://ai.google.dev/gemini-api/docs/file-search) -- Managed RAG: upload, auto-chunk, auto-embed, $0.15/M tokens. HIGH confidence.
- [HKUDS/LightRAG GitHub](https://github.com/hkuds/lightrag) -- EMNLP 2025, knowledge graph RAG, dual-level retrieval. HIGH confidence.
- [HKUDS/RAG-Anything GitHub](https://github.com/HKUDS/RAG-Anything) -- Multimodal RAG with 1+3+N architecture, built on LightRAG. HIGH confidence.
- [Google ADK Documentation](https://google.github.io/adk-docs) -- Agent Development Kit for building agent systems. HIGH confidence.
- [Google Codelabs, "Building GraphRAG Agents with ADK"](https://codelabs.developers.google.com/neo4j-adk-graphrag-agents) -- ADK + Neo4j + MCP tutorial. MEDIUM confidence.

### RAG Evaluation and Benchmarks
- [RAGAS Documentation](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) -- Faithfulness, context precision, context recall, response relevancy metrics. HIGH confidence.
- [Label Your Data, "RAG Evaluation: 2026 Metrics and Benchmarks"](https://labelyourdata.com/articles/llm-fine-tuning/rag-evaluation) -- Enterprise evaluation: precision@k, recall@k, MRR, nDCG. MEDIUM confidence.
- [Firecrawl, "Best Chunking Strategies for RAG in 2026"](https://www.firecrawl.dev/blog/best-chunking-strategies-rag) -- Chunking has as much impact as embedding model choice. MEDIUM confidence.

### RAG Anti-Patterns and Best Practices
- [Towards AI, "Production RAG: From Anti-Patterns to Platform Engineering"](https://pub.towardsai.net/rag-systems-anti-patterns-and-design-patterns-for-production-48b7d86c4bbd) -- Production anti-patterns: local session state, hardcoded prompts, one-time metrics. MEDIUM confidence.
- [kapa.ai, "RAG Gone Wrong: 7 Most Common Mistakes"](https://www.kapa.ai/blog/rag-gone-wrong-the-7-most-common-mistakes-and-how-to-avoid-them) -- Common failure patterns. MEDIUM confidence.
- [nat.io, "RAG Didn't Solve AI. It Made AI a Systems Engineering Problem."](https://nat.io/blog/rag-systems-engineering-problem) -- RAG as infrastructure, not feature. MEDIUM confidence.

### Companion Repository Patterns
- [NirDiamant/RAG_Techniques](https://github.com/NirDiamant/RAG_Techniques) -- 42 notebook tutorials, the gold standard for RAG companion repos. HIGH confidence.
- [athina-ai/rag-cookbooks](https://github.com/athina-ai/rag-cookbooks) -- Advanced RAG technique implementations. MEDIUM confidence.

### Enterprise RAG Strategy
- [Synvestable, "Enterprise RAG: Architecture Patterns, Benchmarks & Implementation Guide 2026"](https://www.synvestable.com/enterprise-rag.html) -- "40-60% of RAG implementations fail to reach production." MEDIUM confidence.
- [NStarX, "The Next Frontier of RAG: Enterprise Knowledge Systems 2026-2030"](https://nstarxinc.com/blog/the-next-frontier-of-rag-how-enterprise-knowledge-systems-will-evolve-2026-2030/) -- Strategic roadmap for enterprise RAG. MEDIUM confidence.

### Existing Site Infrastructure (HIGH confidence -- local verification)
- `src/components/blog/StatHighlight.astro` -- Big-number statistic callouts (built v1.20)
- `src/components/blog/TermDefinition.astro` -- Dictionary-entry coined term definition (built v1.20)
- `src/components/blog/OpeningStatement.astro` -- Thesis statement display text
- `src/components/blog/TldrSummary.astro` -- Summary box with speakable schema target
- `src/components/blog/KeyTakeaway.astro` -- Accent-bordered insight block
- `src/components/blog/Callout.astro` -- Info/warning/tip/important asides
- `src/components/BlogPostingJsonLd.astro` -- Full BlogPosting schema
- `src/components/FAQPageJsonLd.astro` -- FAQPage schema for rich snippets
- `src/lib/diagrams/diagram-base.ts` -- SVG diagram foundation with CSS-var theming
- Dark Code post frontmatter pattern -- GFM footnotes, StatHighlight/TermDefinition imports

---
*Feature research for: RAG Architecture Patterns blog post + companion repository*
*Researched: 2026-04-17*
