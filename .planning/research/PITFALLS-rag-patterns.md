# Pitfalls Research

**Domain:** Adding a research-heavy RAG architecture patterns blog post with 5-tier companion repo to an existing Astro 5 portfolio site (patrykgolabek.dev). Building on v1.20 Dark Code patterns with 105+ NotebookLM sources, same research integrity standards.
**Researched:** 2026-04-17
**Confidence:** HIGH (grounded in current 2026 RAG ecosystem research, direct analysis of existing site patterns from v1.20/v1.21, and verified framework/tool limitations from official repositories)

## Critical Pitfalls

### Pitfall 1: Writing Yet Another "What Is RAG" Post Into a Saturated 2026 Landscape

**What goes wrong:**
RAG tutorial searches have exploded 340% on developer forums in 2026. The "Hello World" of RAG -- shoving PDFs into a vector database and running cosine similarity -- was sufficient in 2024 but is considered a "prototype at best and a liability at worst" in 2026. The search results for "RAG architecture 2026" return hundreds of posts covering the same naive-to-advanced progression. At least 8 substantive "RAG in 2026" posts were published in Q1 2026 alone on Medium, Substack, and corporate blogs.

If the blog post opens with "What is RAG?" or spends 500+ words explaining embeddings and vector databases, it reads like every other post. The differentiation of the Dark Code essay -- a 17-year veteran making opinionated claims backed by 56 verified sources -- disappears into a sea of tutorial-style content that any junior developer with access to the same documentation could have written.

**Why it happens:**
The 5-tier progression (Naive, Google File Search, LightRAG, RAG-Anything, Agentic RAG) tempts the writer to start from first principles at Tier 1. The NotebookLM notebook has 105+ sources, creating the same "data dump" risk identified in the Dark Code pitfalls research. The writer feels obligated to demonstrate mastery of fundamentals before progressing to advanced tiers.

**How to avoid:**
1. Open with the thesis, not the definition. Lead with "Most RAG tutorials teach you to build something that breaks the moment your documents have tables, images, or cross-references" -- not "RAG stands for Retrieval-Augmented Generation."
2. Assume the reader knows what RAG is. Link to a single canonical explanation (the IBM or Anthropic explainer) for anyone who needs background, and move immediately to the enterprise knowledge base problem.
3. The differentiation is the 5-tier progression using the SAME dataset. No other 2026 RAG post demonstrates the same enterprise knowledge base failing and succeeding across 5 architectures. Lead with this.
4. Every section must answer "what goes wrong at this tier and why" -- not "how this tier works." The companion repo handles the "how."

**Warning signs:**
- The opening 3 paragraphs could appear in any RAG explainer post
- The word "embeddings" appears in the first 500 words with a definition
- Section headings describe tiers by name rather than by problem ("Naive RAG" vs. "When Cosine Similarity Stops Being Enough")
- A reviewer says "I have read this before"

**Phase to address:**
Content outline phase. The outline must be reviewed against 3-5 existing 2026 RAG posts to confirm the angle is distinct. Reject any outline that starts with a definition.

---

### Pitfall 2: NotebookLM Citation Laundering -- Trusting Synthesized Claims Without Tracing to Primary Sources

**What goes wrong:**
NotebookLM's source-grounding means it only answers from uploaded documents and provides inline citations. This creates a dangerous false confidence. The 105+ sources in the notebook include blog posts, papers, documentation, and tutorials. NotebookLM may synthesize a claim like "LightRAG reduces retrieval latency by 40% compared to GraphRAG" with a citation pointing to a blog post that itself cited an arXiv preprint that measured something subtly different (e.g., indexing time, not query latency).

The Dark Code v1.20 milestone verified 56 sources and caught this pattern: secondary sources paraphrase primary research with distortion. The blog post cited 17 inline sources and 37 further-reading sources, with every URL clicked and verified. The RAG post faces the same risk at 2x the source count.

Three specific failure modes:
1. **Citation chain laundering:** NotebookLM cites Source A, which cited Source B, which cited the actual study. The claim mutates at each hop. The blog post attributes a claim to Source A when Source A itself was paraphrasing.
2. **Version-specific claims treated as universal:** "LightRAG requires 32B+ parameter models" was true for v1.x but may not hold for v2.x. The NotebookLM source may reference an older version.
3. **Benchmark cherry-picking:** Research papers report multiple metrics. NotebookLM may surface the most favorable metric from a paper while the paper's overall conclusion is more nuanced.

**Why it happens:**
With 105+ sources, manually tracing every claim to its primary source is exhausting. NotebookLM's inline citations feel authoritative -- they link to the exact passage in the uploaded document. But the uploaded document is not necessarily the primary source; it may be a blog post summarizing a paper.

**How to avoid:**
1. Apply the Dark Code tiered citation model: primary sources (papers, official docs, official benchmarks) get inline citations. Secondary sources (blog posts summarizing papers) go to further-reading only.
2. For every quantitative claim (percentages, benchmarks, cost figures), trace to the primary source. If the primary source cannot be found, flag the claim as LOW confidence and either find the primary source or remove the claim.
3. Create a `sources-rag.md` reference file before writing, following the v1.20 pattern. Each entry: URL, date accessed, exact claim cited, primary vs. secondary classification.
4. Version-lock all framework claims: "LightRAG v2.x (as of April 2026) requires..." not "LightRAG requires..."

**Warning signs:**
- A NotebookLM citation points to a Medium blog post for a quantitative claim
- A benchmark number appears without naming the specific paper, dataset, and metric
- The same framework capability is described differently in two sections (indicating two sources with conflicting information)
- A claim uses present tense for a finding from a 2024 paper without verifying it still holds

**Phase to address:**
Source verification phase (before content authoring). Must be completed as a standalone phase, not interleaved with writing. The Dark Code v1.20 precedent: Phase 117 was dedicated to source curation.

---

### Pitfall 3: Companion Repo That Readers Cannot Actually Run -- The "Works On My Machine" Trap

**What goes wrong:**
RAG companion repos have a unique reproducibility problem that standard code examples do not: they depend on external APIs (LLM providers, embedding services), large model downloads, database services (vector stores, graph databases), and specific Python/Node versions. A reader who clones the repo encounters:

1. **API key requirement with no fallback:** Every tier except possibly Naive RAG requires at least one API key (OpenAI, Google Gemini, Anthropic). If the README says "set your OPENAI_API_KEY" without explaining costs, the reader discovers mid-run that their experiment costs $2-15 depending on corpus size and model.
2. **Dependency hell across tiers:** Tier 3 (LightRAG) requires Python 3.10+, a 32B+ parameter LLM (or API access), and a graph database. Tier 4 (RAG-Anything) requires LibreOffice for document processing. Tier 5 (Agentic RAG) may require multiple services running simultaneously. A reader who successfully ran Tier 1 may fail at Tier 3 because the dependency jump is enormous.
3. **Non-deterministic outputs:** RAG outputs vary by model version, temperature, and even API endpoint region. A reader running the same code 3 months later gets different results because the model has been updated. The blog post quotes specific outputs that the reader cannot reproduce.
4. **Large dataset downloads:** If the enterprise KB dataset is large (PDFs, images, tables), cloning the repo may take minutes and the indexing step may take hours.

**Why it happens:**
The author develops against their own API keys, their own installed dependencies, their own local models. The gap between "runs on author's machine" and "runs on a reader's fresh clone" is always larger than expected. RAG systems amplify this because they have more external dependencies than typical code examples.

**How to avoid:**
1. Every tier must have a documented "expected cost" for running the example. "Tier 1: ~$0.02 in OpenAI API costs. Tier 3: ~$0.50 in Gemini API costs. Tier 5: ~$2.00 total."
2. Provide a `.env.example` file with every required variable documented. Include comments explaining what each key does and where to get it.
3. Use Docker Compose for tiers 3-5 where complex dependencies exist. Docker is the standard for RAG reproducibility in 2026 (Docker official docs have a RAG containerization guide).
4. Pin every dependency version. `requirements.txt` with exact versions, not ranges. Include a `uv.lock` or `poetry.lock` file.
5. Include expected output samples in the repo (e.g., `expected-output/tier1-response.json`) so readers can verify their setup works without comparing to the blog post.
6. For the enterprise KB dataset, keep it small (10-20 documents, under 5MB total). Provide a script that generates/downloads it, not a binary blob in the repo.
7. Test the setup flow on a clean machine (or fresh Docker container) before publishing.

**Warning signs:**
- The README has no "Prerequisites" section or the prerequisites list is incomplete
- `pip install -r requirements.txt` fails because a system-level dependency (LibreOffice, Neo4j) is not documented
- The repo has no `.env.example` file
- Running Tier 1 works but Tier 3 fails without explanation
- The repo README does not mention expected costs

**Phase to address:**
Companion repo development phase. Each tier must be tested on a clean environment. A separate "reproducibility verification" step must be in the publish checklist.

---

### Pitfall 4: Enterprise Knowledge Base Dataset That Is Either Too Toy or Too Proprietary

**What goes wrong:**
The 5-tier progression requires a single enterprise knowledge base used across all tiers. This dataset must simultaneously:
- Be small enough for readers to run quickly (~minutes, not hours of indexing)
- Be complex enough to expose the limitations of each tier (tables, cross-references, images, multi-document reasoning)
- Be domain-realistic enough to feel like an enterprise use case
- Not contain any proprietary, PII, or licensed content

Most RAG tutorials fail at this. They use either:
- **Toy datasets** (a few paragraphs of text) that work fine with Naive RAG, making the advanced tiers seem like unnecessary complexity
- **Wikipedia dumps** that are text-only and do not demonstrate multimodal challenges
- **Proprietary enterprise documents** that cannot be shared, so the reader substitutes their own data and gets different results

The specific failure for the 5-tier blog: if the dataset is text-only, Tier 4 (RAG-Anything multimodal) has nothing interesting to demonstrate. If the dataset has no entity relationships, Tier 3 (LightRAG graph) builds a trivial graph that does not showcase the architecture's strengths.

**Why it happens:**
Creating a good synthetic enterprise KB is genuinely hard. It requires writing realistic documents with intentional structural complexity (tables spanning pages, cross-references between documents, versioned policies, organizational charts). Most tutorial authors skip this and use whatever data is convenient.

**How to avoid:**
1. Design the dataset backward from the tier requirements. What must Tier 4 demonstrate? Multimodal content (tables, images, diagrams). What must Tier 3 demonstrate? Entity relationships across documents. What must Tier 5 demonstrate? Multi-step reasoning requiring tool use. Design the dataset to contain all of these.
2. Create a synthetic "Acme Corp" enterprise KB with:
   - 10-15 policy documents (text + tables)
   - 2-3 architecture diagrams (images that RAG-Anything can parse)
   - 1-2 org charts or process flows (entities and relationships for LightRAG)
   - Versioned documents (v1 and v2 of the same policy, for temporal reasoning in Tier 5)
   - Cross-references between documents ("see Policy 3.2 for exception handling")
3. Include ground-truth Q&A pairs with the dataset: 10-15 questions with known correct answers, so readers can verify each tier's accuracy. This doubles as an evaluation set.
4. Keep total dataset under 5MB. 10-15 documents is enough to demonstrate every tier's strengths and weaknesses.
5. Put the dataset in a `data/` directory in the companion repo with a README explaining each document's purpose and what tier it exercises.

**Warning signs:**
- All documents in the dataset are plain text with no tables, images, or cross-references
- The dataset is so small (1-3 documents) that Naive RAG handles everything perfectly
- The dataset contains real company names, employee names, or actual policy numbers
- A reviewer can answer all the demo questions without any RAG system (questions too simple)
- The dataset lacks versioned or conflicting documents (no temporal reasoning challenge)

**Phase to address:**
Dataset design phase (before companion repo development). The dataset spec must be reviewed against tier requirements. This is a prerequisite for all tier implementations.

---

### Pitfall 5: Tier 2 (Google File Search) as a Black Box That Breaks the Comparison Narrative

**What goes wrong:**
Google's Gemini File Search API is a managed, opaque RAG service. You upload files, it handles chunking, embedding, indexing, and retrieval. You get results but cannot inspect or control the chunking strategy, embedding model, retrieval algorithm, or reranking logic. This creates three problems for a comparative blog post:

1. **No apples-to-apples comparison:** Tiers 1, 3, 4, and 5 use explicit, inspectable pipelines. Tier 2 is a black box. The reader cannot compare chunking strategies because Tier 2 does not expose its chunking. The blog post risks saying "Tier 2 performed better/worse than Tier 1" without being able to explain WHY, undermining the educational value.
2. **API instability:** A Google AI Developer Forum thread reports "Severe RAG System Degradation -- Project Rendered Unusable After Recent Updates." The managed service can change behavior without notice. Results demonstrated in the blog post may differ when a reader runs the same code weeks later because Google updated the backend.
3. **Store limits and pricing opacity:** The API limits to 5 stores per query, and store size is computed as ~3x input size on the backend. These limits are not well-documented. A reader hitting these limits has no diagnostic pathway because the service is managed.

**Why it happens:**
Google File Search is attractive because it is the simplest "upgrade" from Naive RAG -- you hand off the hard problems (chunking, embedding, retrieval) to Google. For a tutorial, it seems like a natural Tier 2. But for a comparative analysis that teaches readers WHY each architecture makes different tradeoffs, a black box at Tier 2 creates a gap in the educational narrative.

**How to avoid:**
1. Frame Tier 2 explicitly as "the managed service tradeoff." The section heading should communicate this: "Tier 2: Trading Control for Convenience" or "When You Want RAG Without Building a Pipeline."
2. Focus the Tier 2 section on WHAT you give up (observability, customization, cost transparency) rather than just WHAT you get. This turns the black-box limitation into a teaching moment.
3. Document the exact API version, model, and date of testing. Include a disclaimer: "Google File Search is a managed service. Results may differ from those shown here due to backend updates."
4. Include the specific failure case from the enterprise KB where the black box retrieved the wrong document. Managed services shine on simple queries but often fail on cross-document reasoning -- demonstrate this.
5. Run the same queries against Tier 1 (Naive) and Tier 2 (Google) with identical documents to show the delta. Even though the internal mechanism differs, the reader can compare outputs.

**Warning signs:**
- The Tier 2 section describes features but cannot explain behavior
- The blog post claims "Tier 2 achieves X% accuracy" without being able to explain what retrieval strategy produced that accuracy
- The companion repo's Tier 2 code is 10 lines (upload file, query) with no diagnostic output
- The reader cannot replicate the blog post's Tier 2 results because Google updated the backend

**Phase to address:**
Content authoring phase. The Tier 2 section outline must explicitly address the black-box tradeoff. The companion repo must include diagnostic output (retrieved chunks, confidence scores) from whatever the API exposes.

---

### Pitfall 6: LightRAG (Tier 3) Requiring Unrealistic Compute That Readers Cannot Reproduce

**What goes wrong:**
LightRAG's official documentation specifies minimum requirements of 32B+ parameter models with 32KB+ context windows. This is a hard requirement for the entity-relationship extraction that builds the knowledge graph. Running a 32B parameter model locally requires a GPU with 24GB+ VRAM (e.g., RTX 4090 or better). Most tutorial readers do not have this hardware.

The alternative -- using an API (OpenAI, Gemini) -- works but introduces costs that scale with corpus size. LightRAG's entity extraction passes each document through the LLM multiple times. For a 15-document enterprise KB, this can cost $0.50-$2.00 per full indexing run with a premium model. Re-indexing after changing a parameter costs the same amount again.

Additional LightRAG-specific traps:
- **Embedding model lock-in:** The embedding model must be determined before document indexing. Changing the embedding model requires clearing all data and re-indexing from scratch. If the blog post uses `text-embedding-3-large` but the reader uses `bge-m3`, results will differ and the reader cannot switch without rebuilding everything.
- **Graph database dependency:** Production LightRAG recommends Neo4j, PostgreSQL, or MongoDB as the storage backend. The default file-based storage works for demos but does not demonstrate the graph capabilities readers would expect from a "Graph RAG" tier.
- **Reasoning models fail during indexing:** LightRAG's docs explicitly warn against using reasoning models (like o1/o3) during the indexing phase. If the reader sets their default model to a reasoning model, indexing silently produces poor entity extraction.

**Why it happens:**
The blog author develops against API keys with budget headroom and may have local GPU hardware. The gap between "author's setup" and "reader's setup" is uniquely large for Graph RAG architectures because of the model size requirements.

**How to avoid:**
1. Provide two pathways for Tier 3: "API mode" (using Gemini Flash for cost efficiency) and "local mode" (using Ollama with a quantized 32B model, documenting hardware requirements).
2. Document exact costs: "Indexing the 15-document Acme Corp KB costs approximately $0.35 using Gemini 2.5 Flash-Lite at $0.10/1M tokens."
3. Lock the embedding model in the companion repo and document it prominently. Include a warning: "Changing the embedding model requires deleting the `data/` directory and re-indexing."
4. Use the default file-based storage in the companion repo for simplicity, but provide a `docker-compose.yml` for Neo4j if the reader wants the full graph experience.
5. Add a `.env.example` entry with a comment: "Do NOT use reasoning models (o1, o3, etc.) for LIGHTRAG_INDEXING_MODEL."

**Warning signs:**
- The README does not mention hardware requirements for local execution
- The cost of running Tier 3 is not documented
- The reader changes the embedding model mid-experiment and gets errors or silently wrong results
- The companion repo assumes Neo4j is installed without providing a Docker option

**Phase to address:**
Companion repo development phase (Tier 3 implementation). Must include a cost estimate and dual-pathway documentation.

---

### Pitfall 7: RAG-Anything (Tier 4) Dependency on LibreOffice and Beta-Quality Software

**What goes wrong:**
RAG-Anything is an academic framework from HKU (published October 2025, still in active development). It has three specific risks for a companion repo:

1. **LibreOffice system dependency:** Processing Office documents (.docx, .pptx, .xlsx) requires LibreOffice installed at the system level. This is not a pip-installable dependency -- it requires `brew install --cask libreoffice` (macOS), `apt-get install libreoffice` (Linux), or a Windows installer. Docker solves this but adds container complexity.
2. **MinerU document parser:** RAG-Anything uses MinerU for document parsing, which requires post-installation verification (`mineru --version`) and may download large models on first run. Network timeouts are common enough that the README suggests `UV_HTTP_TIMEOUT=120`.
3. **Beta stability:** As an academic project released 6 months ago, the API surface may change. A companion repo built against the current API may break when RAG-Anything releases a new version. Pinning the version helps but means the companion repo eventually demonstrates an outdated version.

The deeper issue: RAG-Anything is the most impressive tier (multimodal knowledge graphs, cross-modal entity extraction) but also the most fragile. If a reader cannot get Tier 4 running, they lose trust in the entire progression.

**Why it happens:**
Academic frameworks prioritize research novelty over production stability. The author is drawn to RAG-Anything because it demonstrates a genuine capability leap (multimodal RAG with knowledge graphs). But capability and reproducibility are different dimensions.

**How to avoid:**
1. Dockerize Tier 4 completely. A `Dockerfile` with LibreOffice, MinerU, and all dependencies pre-installed. The reader runs `docker compose up tier4` and gets a working environment.
2. Pin `raganything` to a specific version in requirements and document: "This example was built and tested against raganything==X.Y.Z on [date]."
3. Include a "Tier 4 Troubleshooting" section in the companion repo README covering: LibreOffice not found, MinerU model download timeout, Python version mismatch.
4. Provide a pre-computed output for Tier 4 (the multimodal knowledge graph, retrieved results) so readers who cannot install the dependencies can still see the results and compare to other tiers.
5. Consider whether a lighter multimodal alternative exists. If RAG-Anything proves too fragile for reproducibility, note this honestly in the blog post as a tradeoff.

**Warning signs:**
- The Tier 4 section of the companion repo works on macOS but fails on Linux or Windows
- `pip install raganything` installs successfully but `mineru --version` fails
- A reader reports "it worked last month but not today" because a dependency updated
- The Docker image for Tier 4 is >5GB due to LibreOffice and model downloads

**Phase to address:**
Companion repo development phase (Tier 4 implementation). Docker must be the primary pathway, not an afterthought.

---

### Pitfall 8: Agentic RAG (Tier 5) Demos That Are Impressive But Unreproducible and Expensive

**What goes wrong:**
Agentic RAG is the crown jewel of the 5-tier progression but also the most dangerous for a companion repo:

1. **Cost explosion:** Each agentic loop involves multiple LLM calls (query analysis, tool selection, retrieval, verification, synthesis). A single complex query can consume 10-15 LLM calls. If the reader runs 5-10 example queries, costs can reach $5-20 depending on the model. Unexpected API bills have killed enthusiasm for RAG tutorials.
2. **Non-deterministic behavior:** Agents make decisions at each step. Running the same query twice may produce different tool call sequences, different retrieved documents, and different final answers. The blog post shows one execution trace; the reader sees a different one. This is not a bug -- it is inherent to agentic systems -- but it confuses readers who expect deterministic tutorial outputs.
3. **Infinite loop risk:** Agents can enter loops where they repeatedly refine a query, call the same tool, or re-retrieve the same documents. Without explicit iteration limits and token budgets, a demo can consume hundreds of thousands of tokens on a single query.
4. **Security and authorization complexity:** Agentic RAG extends authorization concerns to each step. If an agent has access to multiple tools (search, database query, API call), it can chain accesses in ways the developer did not anticipate. For a demo, this is less about security and more about the agent doing unexpected things that the blog post does not discuss.

**Why it happens:**
Agentic RAG is the most exciting tier and the natural climax of the progression. The temptation is to show a complex multi-step workflow that produces an impressive result. But impressive demos are often unreproducible because they depend on a specific model version, specific retrieval results, and a specific reasoning chain that the model may not follow again.

**How to avoid:**
1. Set hard limits in the companion repo code: maximum 10 tool calls per query, maximum 50,000 input tokens per session. Document these limits and explain why they exist (cost control, loop prevention).
2. Include a cost estimator script that calculates expected costs BEFORE running agentic queries: "This query will use approximately X tokens across Y LLM calls, estimated cost: $Z."
3. Log every step of the agent's execution (tool calls, retrieved documents, intermediate reasoning) to a trace file. Include example trace files in the repo so readers can compare their execution to the expected behavior.
4. Use the cheapest viable model for agentic demos (Gemini 2.5 Flash-Lite at $0.10/1M tokens, or GPT-5 nano at $0.05/1M input tokens). Document why: "Agentic RAG multiplies every cost by the number of reasoning steps."
5. Provide 3 example queries with expected outputs and cost estimates:
   - Simple (1-2 tool calls, ~$0.01): "What is the vacation policy?"
   - Medium (3-5 tool calls, ~$0.05): "Compare the 2025 and 2026 security policies"
   - Complex (7-10 tool calls, ~$0.15): "Which department heads should review the new compliance framework based on their responsibilities?"

**Warning signs:**
- The README does not mention expected costs for Tier 5
- Running the demo consumes >$1 without warning
- The agent enters a loop and the reader has to ctrl-C to stop it
- The blog post shows a beautiful multi-step trace that the reader cannot reproduce
- No token/iteration limits are set in the companion code

**Phase to address:**
Companion repo development phase (Tier 5 implementation). Cost estimation and iteration limits must be implemented before writing the blog post section about Tier 5.

---

### Pitfall 9: Blog-to-Repo Cross-Reference Drift

**What goes wrong:**
The blog post and companion repo are two artifacts that must stay synchronized. Three drift patterns emerge:

1. **Code in the blog does not match code in the repo.** The blog shows a simplified snippet; the repo has the full implementation. The reader copies the blog snippet, it does not work, and they lose trust. This is the most common cross-reference failure in technical blog posts.
2. **Output in the blog does not match repo output.** The blog shows "retrieved 3 relevant documents with 0.95 confidence" but the reader gets different documents at different confidence scores because they used a different model version or the embedding model was updated.
3. **The blog describes a feature the repo does not implement.** "Tier 5 includes automatic evaluation against ground truth" -- but the repo's Tier 5 only has the query pipeline, not the evaluation step.

This is amplified in a 5-tier progression because 5 tiers x 3 drift vectors = 15 potential synchronization failures.

**Why it happens:**
The blog and repo are typically developed iteratively. The author writes code, writes about it, refines the code, updates the blog, adds a feature to the code, forgets to update the blog. By publication day, the two artifacts have diverged. The Dark Code essay (v1.20) did not have this problem because it had no companion repo -- the essay was self-contained.

**How to avoid:**
1. Develop the repo FIRST, freeze it, THEN write the blog. Not interleaved. Code changes after the blog is drafted require updating the blog.
2. Every code snippet in the blog must have a corresponding file path comment: `# From: tier1/naive_rag.py, lines 15-30`. The reader can find the exact code in the repo.
3. Every output shown in the blog must be generated by running the repo code and captured at a specific point in time. Include the date and model version: "Output generated on 2026-04-20 using Gemini 2.5 Flash-Lite."
4. The companion repo README must link to the blog post. The blog post must link to the repo. Both must be checked before publishing.
5. Include a `BLOG_SYNC.md` in the repo that maps blog sections to repo directories: "Blog Section: Tier 3 - LightRAG -> Repo: `tier3/`".

**Warning signs:**
- The blog shows an import statement that does not exist in the repo
- The blog describes running `python tier3/run.py` but the actual file is named `tier3/lightrag_demo.py`
- Output screenshots in the blog show a different terminal/UI than what the repo produces
- The repo has a `tier5/` directory but the blog only describes tiers 1-4

**Phase to address:**
Integration/QA phase. A dedicated "cross-reference verification" step must check every code snippet and output reference in the blog against the repo.

---

### Pitfall 10: Repeating Dark Code's Voice Problem -- Research-Heavy Essay That Reads Like a Literature Review

**What goes wrong:**
This is the same pitfall identified in the Dark Code PITFALLS.md (Pitfall 8) but amplified. The RAG post has 105+ sources (vs. 48 for Dark Code). The technical subject matter -- RAG architectures -- naturally trends toward tutorial/documentation style rather than thought-leadership style. The risk of producing an "assembled vs. considered" essay is even higher because:

1. Each tier has official documentation that the writer may unconsciously paraphrase
2. The companion repo creates a temptation to narrate the code rather than make arguments about the architecture
3. The 5-tier structure feels like a tutorial progression, pulling the essay toward "step 1, step 2, step 3" rather than "here is what I learned after building all 5"

The existing Dark Code essay demonstrates the right voice: "Your codebase is full of code that no one understands, no one owns, and no one can safely change." The RAG essay needs the same opinionated authority.

**Why it happens:**
Technical architecture content is inherently more tutorial-like than thought-leadership content. The writer has a working companion repo and feels pressure to explain how each tier works rather than arguing why each tier matters and when it fails. With 105+ sources, the temptation to let the sources speak is overwhelming.

**How to avoid:**
1. Write the opening thesis before consulting any sources. What does a 17-year veteran believe about RAG in 2026 that most tutorials get wrong?
2. Each tier section must lead with a CLAIM, not a description. "LightRAG's knowledge graph is only as good as the LLM that extracts the entities -- and most teams use a model that is too small" -- not "LightRAG uses entity extraction to build knowledge graphs."
3. Include at least one first-person observation per tier: "I ran the same 15 documents through all 5 tiers. Here is what surprised me."
4. The companion repo handles the "how." The blog post handles the "why" and "when" and "what goes wrong." If a section reads like a tutorial, move it to the repo README and replace it with analysis.
5. Apply the Dark Code v1.20 editing test: "Could someone without 17 years of enterprise experience have written this section?" If yes, add perspective.

**Warning signs:**
- More than 3 consecutive paragraphs start with a framework name or citation
- The word "simply" or "just" appears (tutorial voice, not leadership voice)
- Section headings are nouns ("LightRAG Architecture") rather than arguments ("Why Graph RAG Fails on Flat Documents")
- No first-person experience or judgment in any tier section
- A reviewer says "this is a good tutorial" (the goal is a good essay, not a tutorial)

**Phase to address:**
Content authoring phase (drafting guidelines) and editing/review phase. The Dark Code voice guidelines must be explicitly reapplied.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single API provider for all tiers | Simpler setup, one API key | Reader locked to one provider; costs not representative; if OpenAI has an outage, all tiers break | Never for a comparative blog -- each tier should demonstrate its natural provider |
| Text-only enterprise KB dataset | Easy to create, small file size | Tier 4 (multimodal) has nothing to demonstrate; Tier 3 (graph) builds a trivial graph | Never -- the dataset IS the comparison mechanism |
| Skipping Docker for companion repo | Faster initial development | Readers on different OSes cannot run tiers 3-5; "works on my machine" complaints | Acceptable for Tiers 1-2 only; Docker required for Tiers 3-5 |
| Using latest model versions without pinning | Always have newest capabilities | Results change when models update; blog post outputs become unreproducible | Never -- pin every model version in code and blog |
| Combining all tiers in one notebook | Easier to follow as a single file | Dependencies conflict between tiers; one broken tier blocks all others; notebook becomes 1000+ cells | Never -- each tier must be independently runnable |
| Skipping ground-truth evaluation set | Less upfront work for dataset | Cannot objectively compare tier performance; claims of "Tier 3 is better than Tier 1" become subjective | Never in a comparative analysis |
| Hardcoding API keys during development | Faster iteration | Keys end up in git history, companion repo, or blog post screenshots | Never -- use `.env` from the start |

## Integration Gotchas

Common mistakes when adding a RAG blog post to this specific site.

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| Blog collection schema | Adding custom fields like `companionRepo` or `notebookId` that do not exist in the schema | Use the existing `externalUrl` field pattern or add links within the MDX content. Check `src/content.config.ts` before adding frontmatter fields. |
| NotebookLM source references | Citing NotebookLM as a source instead of citing the underlying documents | NotebookLM is a tool, not a source. Citations must trace to the original paper/doc/blog that was uploaded to NotebookLM. |
| Tag taxonomy | Creating tags like `rag`, `retrieval-augmented-generation`, `vector-database`, `knowledge-graph` that create 4 orphaned tag pages | Prefer existing tags: `ai` (12+ posts), `architecture` (exists), `code-quality` (exists). Maximum ONE new tag (e.g., `rag`) alongside 3-4 existing tags. |
| Companion repo GitHub link | Linking to a private or not-yet-created repo that 404s | Create the repo and verify the URL before the blog post build. Use the blog's external link pattern (`target="_blank"` and `rel="noopener noreferrer"`). |
| Code snippets from repo | Using inline code blocks for full implementations | Show 10-15 line snippets with file path comments. Link to the full file in the companion repo. Readers should not need to read 50-line code blocks in a blog post. |
| JSON-LD for companion repo | Not adding the companion repo as a `codeRepository` in the blog post's JSON-LD | Add a SoftwareSourceCode schema with `codeRepository` pointing to the GitHub repo URL. Check the existing `[slug].astro` post-ID mapping pattern. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Embedding all documents at demo time | Works for 5 docs in 10 seconds | Pre-compute embeddings and ship a vector store snapshot with the repo | At 50+ documents or with rate-limited free-tier APIs |
| Using the largest model for every tier | Best results during development | Default to cost-efficient models (Flash-Lite, GPT-5 nano); provide upgrade instructions | When the reader has a $5 API budget and runs 3 tiers |
| Full LightRAG re-index on every query | Correct but slow | Index once, query many times; document the two-phase workflow | At 10+ documents with a 32B model |
| RAG-Anything processing large PDFs | Works for 5-page PDFs | Limit demo PDFs to 5-10 pages; note processing time in README | At 50+ page PDFs with images and tables |
| Agentic RAG with no iteration limits | Produces thorough answers | Set max_iterations=10 and max_tokens=50000 per session | On complex queries that trigger 20+ reasoning steps |

## Security Mistakes

Domain-specific security issues for a RAG companion repo.

| Mistake | Risk | Prevention |
|---------|------|------------|
| API key committed to git history | Key scraped by bots within minutes; unauthorized charges on author's account | `.env` in `.gitignore` from first commit. Provide `.env.example` with placeholder values. Rotate keys if ever exposed. |
| Enterprise KB dataset contains real company data | PII/proprietary data exposed in a public repo | Use entirely synthetic data. Never use real company documents, even "anonymized" ones -- anonymization is reversible. |
| Demo stores API responses in the repo | Cached responses may contain model outputs with embedded context that leaks source document content | Cache files must be in `.gitignore`. Expected outputs should be manually curated, not raw API responses. |
| Blog post screenshots showing API keys | Keys visible in terminal screenshots or notebook outputs | Review every screenshot before publication. Use `REDACTED` or `sk-...abc` patterns in any visible key fields. |
| Agentic RAG demo with unrestricted tool access | Agent could call unintended APIs, access file system, or make network requests beyond intended scope | Restrict agent tools to the specific retrieval and analysis functions needed. No file system access, no arbitrary code execution. |

## UX Pitfalls

Common user experience mistakes for a RAG architecture comparison blog post.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No comparison table summarizing tier tradeoffs | Reader finishes 4000 words without a clear "when to use which" takeaway | Include a comparison matrix (accuracy, cost, complexity, setup time) early in the post, then elaborate |
| Code-heavy blog post with no architecture diagrams | Reader cannot visualize how each tier's components connect | Create at least one diagram per tier showing data flow: document -> chunking -> embedding -> retrieval -> generation |
| Tier sections that do not acknowledge when simpler tiers win | Reader assumes more complex = better | Explicitly show cases where Naive RAG (Tier 1) outperforms LightRAG (Tier 3) on simple queries. Complexity is not always an upgrade. |
| No "which tier should I start with" recommendation | Reader overwhelmed by 5 options with no guidance | End with a decision flowchart or "start here" recommendation based on use case (simple Q&A, multi-document reasoning, multimodal content) |
| Blog post requires reading companion repo to understand the argument | Reader who does not want to clone a repo gets an incomplete essay | The blog post must be self-contained. The repo is supplementary. Every claim must be supported in the blog text, not just "see the code." |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Source verification:** All 105+ NotebookLM sources traced to primary sources, not secondary blog posts -- verify `sources-rag.md` is complete before writing begins
- [ ] **Dataset ground truth:** Enterprise KB has 10-15 Q&A pairs with known correct answers -- verify each tier can be evaluated objectively
- [ ] **Cost documentation:** Every tier has documented expected API costs -- verify by running each tier against the dataset and recording actual costs
- [ ] **Companion repo clean-room test:** Repo cloned to a fresh machine (or Docker container) and all 5 tiers run successfully -- verify before blog post publication
- [ ] **Model version pinning:** Every API call in the companion repo specifies a model version -- grep for model strings and verify none use "latest" or default
- [ ] **Blog-repo cross-references:** Every code snippet in the blog matches the repo code -- verify file paths, function names, and output samples
- [ ] **Existing tag overlap:** Blog post tags reuse 3-4 existing tags (e.g., `ai`, `architecture`) -- verify related posts sidebar shows 3+ articles
- [ ] **OG image:** Cover SVG created and OG endpoint verified locally -- visit `/open-graph/blog/rag-architecture-patterns.png`
- [ ] **JSON-LD enrichment:** Post ID added to `[slug].astro` with `articleSection` and `about` mappings -- verify with Rich Results Test
- [ ] **LLMs.txt thesis:** Frontmatter `description` is a thesis statement, not a topic summary -- verify it could stand as a tweet
- [ ] **Internal cross-links:** Links to Dark Code (code quality cluster), AI Landscape Explorer (AI concepts), Claude Code Guide (AI tooling) -- verify 3+ internal links
- [ ] **Expected output files:** Each tier has sample output in `expected-output/` directory -- verify they match actual output from a clean run
- [ ] **`.env.example` completeness:** Every environment variable needed across all 5 tiers is documented -- verify by deleting `.env` and reading `.env.example` only
- [ ] **Comparison matrix in blog:** A summary table comparing all 5 tiers on accuracy, cost, complexity, and setup time -- verify it is present and populated with real numbers

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| "Yet another RAG post" voice | HIGH | Requires rewriting the opening and section leads. Cannot be fixed with surface edits. Must add author perspective and opinionated claims. Catch in outline review. |
| NotebookLM citation laundering | HIGH | Every cited claim must be re-verified against primary sources. If a statistic was misattributed, the surrounding argument needs rewriting. Budget 2-4 hours for source re-verification. |
| Companion repo does not run on clean machine | MEDIUM | Debug dependency issues. Add missing system-level deps to Docker. Pin versions. Re-test. Delays publication by hours, not days. |
| Dataset too simple for advanced tiers | HIGH | Requires redesigning and recreating the enterprise KB, then re-running all 5 tiers and updating all outputs. Affects every tier section of the blog. |
| Google File Search API behavior changes | LOW | Update the Tier 2 section with a note about the change. Re-run the demo. Managed service instability is itself a teaching point. |
| LightRAG compute requirements surprise readers | MEDIUM | Add cost documentation and hardware requirements to README. Provide a cheaper model alternative. |
| RAG-Anything fails on reader's OS | MEDIUM | Dockerize the tier (if not already done). Provide pre-computed outputs as fallback. |
| Agentic RAG costs surprise readers | LOW | Add cost warnings, set iteration limits, provide cost estimator script. Can be patched quickly. |
| Blog-repo cross-reference drift | LOW-MEDIUM | Audit all code snippets and outputs. Update blog to match repo (not the other way -- repo is the source of truth). |
| API key leaked in git history | HIGH | Immediately rotate all exposed keys. Use `git filter-branch` or BFG Repo-Cleaner to remove from history. Notify any affected API provider. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| "Yet another RAG post" angle | Content outline phase | Outline reviewed against 3-5 existing 2026 RAG posts; opening paragraph is distinct |
| NotebookLM citation laundering | Source verification phase (standalone, before writing) | `sources-rag.md` complete with primary/secondary classification; all quantitative claims traced to primary sources |
| Companion repo unreproducible | Repo development phase (per-tier) | Each tier tested on clean Docker container; all 5 tiers pass |
| Dataset too simple | Dataset design phase (before repo dev) | Dataset spec reviewed against all 5 tier requirements; ground-truth Q&A pairs created |
| Google File Search black box | Content authoring (Tier 2 section) | Tier 2 section explicitly addresses tradeoff; blog teaches WHY, not just WHAT |
| LightRAG compute requirements | Repo development phase (Tier 3) | Dual pathway documented (API + local); cost estimate included; embedding model locked |
| RAG-Anything fragility | Repo development phase (Tier 4) | Docker as primary pathway; LibreOffice/MinerU pre-installed; version pinned |
| Agentic RAG cost explosion | Repo development phase (Tier 5) | Iteration limits set; cost estimator included; 3 example queries with cost estimates |
| Blog-repo cross-reference drift | Integration/QA phase | Every code snippet and output reference checked against repo; `BLOG_SYNC.md` maintained |
| Literature review voice | Content authoring + editing phase | Opening uses `<OpeningStatement>` with bold claim; first-person observations in each tier; no 3+ consecutive citation-led paragraphs |
| Tag taxonomy mismatch | Content authoring (frontmatter) | Build site; check tag pages; verify related posts sidebar shows 3+ posts |
| JSON-LD incomplete | Integration phase | Post ID added to `[slug].astro`; Rich Results Test passes |
| OG image missing | Asset creation + QA phase | Cover SVG created; OG endpoint verified locally |
| Internal cross-links missing | Content authoring + editing phase | 3+ internal links present; links to Dark Code, AI Landscape, Claude Code Guide verified |

## Sources

- [RAG Gone Wrong: The 7 Most Common Mistakes (kapa.ai)](https://www.kapa.ai/blog/rag-gone-wrong-the-7-most-common-mistakes-and-how-to-avoid-them) -- HIGH confidence (practitioner-focused, specific failure modes)
- [5 RAG Architecture Mistakes That Kill Production Accuracy (IDE)](https://ide.com/5-rag-architecture-mistakes-that-kill-production-accuracy-and-how-to-fix-them/) -- HIGH confidence (production-focused, concrete patterns)
- [LightRAG GitHub Repository (HKUDS)](https://github.com/hkuds/lightrag) -- HIGH confidence (official repo, requirements documented)
- [RAG-Anything GitHub Repository (HKUDS)](https://github.com/HKUDS/RAG-Anything) -- HIGH confidence (official repo, dependencies documented)
- [LightRAG: Simple and Fast RAG (arXiv)](https://arxiv.org/html/2410.05779v1) -- HIGH confidence (peer-reviewed, EMNLP 2025)
- [RAG-Anything: All-in-One RAG Framework (arXiv)](https://arxiv.org/abs/2510.12323) -- HIGH confidence (academic paper)
- [Gemini File Search API (Google AI for Developers)](https://ai.google.dev/gemini-api/docs/file-search) -- HIGH confidence (official documentation)
- [Severe RAG System Degradation - Google AI Forum](https://discuss.ai.google.dev/t/severe-rag-system-degradation-project-rendered-unusable-after-recent-updates/112823) -- MEDIUM confidence (community report, single source)
- [Standard RAG Is Dead (NeuraMonks)](https://www.neuramonks.com/blog/standard-rag-is-dead-heres-whats-replacing-it-in-2026) -- MEDIUM confidence (industry blog, representative of 2026 sentiment)
- [RAG Architecture in 2026 (RisingWave)](https://risingwave.com/blog/rag-architecture-2026/) -- MEDIUM confidence (vendor blog with technical depth)
- [Containerize a RAG Application (Docker Docs)](https://docs.docker.com/guides/rag-ollama/containerize/) -- HIGH confidence (official Docker documentation)
- [Secrets Management for LLM Tools (DEV Community)](https://dev.to/parth_sarthisharma_105e7/secrets-management-for-llm-tools-dont-let-your-openai-keys-end-up-on-github-38c0) -- MEDIUM confidence (community best practices)
- [LLM API Pricing 2026 (CloudIDR)](https://www.cloudidr.com/llm-pricing) -- MEDIUM confidence (aggregator, prices verified against provider sites)
- [Synthetic Data for RAG Evaluation (Red Hat Developer)](https://developers.redhat.com/articles/2026/02/23/synthetic-data-rag-evaluation-why-your-rag-system-needs-better-testing) -- HIGH confidence (major vendor, specific to RAG evaluation)
- [SoK: Agentic RAG (arXiv)](https://arxiv.org/html/2603.07379v1) -- HIGH confidence (systematic survey paper)
- [Agentic RAG Enterprise Guide 2026 (Data Nucleus)](https://datanucleus.dev/rag-and-agentic-ai/agentic-rag-enterprise-guide-2026) -- MEDIUM confidence (UK/EU enterprise focus)
- [When to Use Graphs in RAG (arXiv)](https://arxiv.org/html/2506.05690v3) -- HIGH confidence (comprehensive analysis paper, GraphRAG underperformance data)
- v1.20 Dark Code milestone pitfalls research (`.planning/research/PITFALLS.md`) -- HIGH confidence (direct precedent from this project)
- v1.20 Dark Code milestone delivery (`.planning/MILESTONES.md`) -- HIGH confidence (proven patterns: 56 sources verified, tiered citation model, voice guidelines)

---
*Pitfalls research for: RAG Architecture Patterns blog post + companion repo (v1.22)*
*Researched: 2026-04-17*
