# Phase 131: Evaluation Harness — Research

**Researched:** 2026-04-27
**Domain:** RAG evaluation orchestration. Drive 5 already-built tier CLIs (Tiers 1-5) over the 30-question golden Q&A, score with **RAGAS 0.4.x** (faithfulness, answer relevancy, context precision), persist cost + latency + metric scores per `(tier, question)` pair, and emit a Markdown comparison table consumable directly by Phase 133's blog post.
**Confidence:** HIGH (RAGAS 0.4.x metric API surface, judge-LLM wiring via LiteLLM/OpenRouter, repo conventions inherited from Phases 127-130, lockfile guard implications for `langchain-community` 0.4.x) / MEDIUM (judge-cost ballpark on 30 × 5 × 3 evaluations, optimal judge-model choice, latency-persistence schema choice between separate vs combined JSON) / LOW (Tier 4 chunk-shape after the user runs MineRU live — Phase 130 SC-1 deferred; whether RAGAS evaluator handles `retrieved_contexts=[]` gracefully or returns NaN; whether the deprecated `evaluate()` API or the new `@experiment` decorator is the right pick for v1).

> **Note on upstream input:** No CONTEXT.md exists for Phase 131 (no `/gsd:discuss-phase` was run). Per the orchestrator brief, this RESEARCH.md treats ROADMAP.md + REQUIREMENTS.md + the verified Phase 127-130 outputs as the locked source of truth. The "User Constraints" section below reconstructs the locked decisions from those artifacts.

<user_constraints>
## User Constraints (from ROADMAP + REQUIREMENTS + Phase 127-130 outputs)

### Locked Decisions

**From ROADMAP.md Phase 131 success criteria:**
1. Golden Q&A test set covers 30+ questions spanning single-hop, multi-hop, cross-document, and multimodal queries.
2. RAGAS metrics (faithfulness, answer relevance, context precision) are computed and saved per tier.
3. Cost and latency are tracked per tier with a comparison summary.
4. A comparison script generates a tier-by-tier results table usable directly in the blog post.

**From REQUIREMENTS.md:**
- **EVAL-01:** Golden Q&A test set (30+ questions) covering single-hop, multi-hop, cross-document, and multimodal queries — **already shipped in Phase 127-06 at `evaluation/golden_qa.json`** (10 single-hop / 10 multi-hop / 10 multimodal / 0 video; videos slot deliberately substituted with multimodal extras per D-04 deviation, documented in 127-06-SUMMARY.md). Phase 131 verifies the existing file satisfies EVAL-01 as-is — see Pattern 9 below for the cross-document confirmation.
- **EVAL-02:** RAGAS evaluation metrics (faithfulness, answer relevance, context precision) per tier.
- **EVAL-03:** Cost and latency tracking per tier with comparison summary.
- **EVAL-04:** Comparison script generating tier-by-tier results table (format usable directly in the blog post — Phase 133 BLOG-04).

**From Phase 127-130 outputs (must be honored — already shipped, additive only):**
- `evaluation/golden_qa.json` — 30 entries with locked schema (`id`, `question`, `expected_answer`, `source_papers`, `modality_tag`, `hop_count_tag`, `figure_ids`, `video_ids`). `expected_answer` is the natural place to source RAGAS's `reference` (= ground truth). **Do NOT modify the file.** Phase 131 reads it.
- `shared/cost_tracker.py` — D-13 schema **frozen**: `evaluation/results/costs/{tier}-{timestamp}.json` with `tier`, `timestamp`, `queries[]`, `totals{}`. `record_llm`, `record_embedding`, `persist`. Capture timestamp once at construction; repeat `persist()` overwrites. **Phase 131 must reuse this for the RAGAS judge calls** so judge costs land in the same accounting (Pattern 2).
- `shared/pricing.py` PRICES table — locked for current models (`google/gemini-2.5-flash`, `openai/gpt-4o-mini`, `openai/text-embedding-3-small`, etc.). **No new prices required if the judge LLM is `google/gemini-2.5-flash` and the answer-relevancy embedder is `openai/text-embedding-3-small`** (already in PRICES).
- `shared/loader.py` — `DatasetLoader().papers()` and metadata helpers; not directly needed by harness (each tier already consumes its own dataset).
- `shared/display.py:render_query_result` — used by tier CLIs for human display; **harness does NOT use it** (harness collects structured records, not human output).
- Each tier exposes a Python library entry point (verified):
  - Tier 1 — `tier_1_naive.retrieve.retrieve_top_k(coll, query_vec, k)` + `tier_1_naive.chat.complete(...)` ; collection opened via `tier_1_naive.store.open_collection(reset=False)`.
  - Tier 2 — `tier_2_managed.query.query(client, store_name, question, model)` returns `GenerateContentResponse` with `grounding_metadata.grounding_chunks`. Adapter `to_display_chunks(resp)` already in `tier_2_managed/query.py`.
  - Tier 3 — `tier_3_graph.query.run_query(rag, question, mode, model, tracker)` async; returns `(answer, in_tok, out_tok)`. LightRAG's `aquery` is the underlying call; chunks are NOT structured (LightRAG returns a string).
  - Tier 4 — `tier_4_multimodal.query.run_query(rag, question, mode, multimodal_content)` async; returns `str` (RAG-Anything 1.2.10 returns a string; `to_display_chunks` returns `[]` for string responses — Pitfall 7 in 130-RESEARCH).
  - Tier 5 — `agents.Runner.run(agent, question, max_turns=10)` async; agent is `tier_5_agentic.agent.build_agent(model)`. Tools are `search_text_chunks` + `lookup_paper_metadata`. Returns `RunResult` with `final_output`, `context_wrapper.usage`, raises `MaxTurnsExceeded` on truncation.
- **Tier 5 reads Tier 1's `chroma_db/tier-1-naive/` collection (Pitfall 9 in 130-RESEARCH — read-only invariant).** Phase 131 must run Tier 1's ingest before Tier 5's harness pass — same prerequisite the live e2e test enforces via `tier1_index_present` fixture.
- `tests/test_tier_requirements.py` — lockfile guard: fails if `google-generativeai` (deprecated, EOL 2025-08-31) appears in `uv.lock`. **Phase 131 must verify `ragas==<chosen>` and its transitive deps do NOT pull `google-generativeai` in.** Verified: `ragas` 0.4.3's `requires_dist` excludes `google-generativeai`; `langchain-community` 0.4.1's `requires_dist` also excludes it [VERIFIED: PyPI `/pypi/ragas/0.4.3/json`, `/pypi/langchain-community/0.4.1/json`]. Pattern 10 below adds the `[evaluation]` extra; the guard test must be re-run after a fresh `uv lock`.
- `tests/conftest.py` — repo-root `live_keys_ok` fixture skips if `GEMINI_API_KEY` is unset; loads `.env` via `python-dotenv` so pytest from any subdirectory sees the keys. **Phase 131 mirrors this pattern**: `evaluation/tests/conftest.py` exposes `live_eval_keys_ok` (requires `OPENROUTER_API_KEY` since the judge LLM routes through OpenRouter via LiteLLM, mirroring Tier 5).
- `pyproject.toml` extras — `[shared]`, `[curation]`, `[tier-1]`..`[tier-5]` exist; `[evaluation]` does NOT exist yet. **Phase 131 MUST add `[evaluation]` extras (Pattern 10).** `[dependency-groups.test]` already declares `pytest>=8.4,<9` for the test runner.
- **Live test environment (Phase 128/129/130 hard-won — applies verbatim to RAGAS):**
  - Sandbox proxy: `ALL_PROXY=socks5h://localhost:61994` + `HTTP_PROXY=...`.
  - Venv MUST have `socksio` installed (`uv pip install socksio` — sandbox-only patch, NOT in pyproject.toml).
  - `httpx`-based clients (`openai` SDK, `google-genai`, `lightrag`, `raganything`, **`litellm`**) auto-detect the proxy via `trust_env=True`. RAGAS routes the judge LLM through `litellm.completion` (Pattern 6) — same path Tier 5 already proved works in-sandbox 2026-04-27. **Document the recipe in `evaluation/README.md` mirroring Phase 129 Plan 07's docs.**
- **Phase 130 SC-1 (Tier 4 live) is deferred to user** — sandbox kernel-level OMP shmem block on MineRU. The harness MUST therefore work in TWO modes:
  - **Live mode** — drives each tier's library entry point end-to-end (Tiers 1, 2, 3, 5 work in-sandbox; Tier 4 the user runs locally).
  - **Cached mode** — RAGAS scores pre-computed `{question, answer, retrieved_contexts}` JSON files persisted by an earlier live pass (per-tier). This is the cleanest separation: each tier writes a "query log" once, RAGAS scores the logs offline. **Recommended primary mode** — see Pattern 1 + Pattern 8.
- Persistence path conventions (locked):
  - Cost JSON — `evaluation/results/costs/{tier}-{timestamp}.json` (frozen by D-13).
  - **New for Phase 131 (proposed):**
    - Per-query records — `evaluation/results/queries/{tier}-{timestamp}.json` (each row: `question_id`, `question`, `answer`, `retrieved_contexts[]`, `latency_s`, `cost_usd`, `cost_breakdown_ref`, optional `error`).
    - Per-tier metric scores — `evaluation/results/metrics/{tier}-{timestamp}.json` (each row: `question_id`, `faithfulness`, `answer_relevancy`, `context_precision`, optional `nan_reason`).
    - Comparison Markdown table — `evaluation/results/comparison.md` (single overwrite-in-place file; the artifact Phase 133 imports).

### Claude's Discretion (this phase)

**Judge LLM selection:**
- **Recommend `google/gemini-2.5-flash` via OpenRouter (LiteLLM-routed).**
  - Already in PRICES at $0.30/1M input, $2.50/1M output.
  - Already proven in-sandbox via Tier 3, 4, 5 (same provider/route/proxy recipe).
  - Cheapest competent judge in the PRICES table; faithfulness/relevancy don't need Pro-tier reasoning.
- **Alternate: `openai/gpt-4o-mini`** ($0.15/1M input, $0.60/1M output — cheaper input, more expensive output). Either is defensible. Gemini Flash is recommended for narrative continuity with Tiers 2-4.
- **Cost ballpark** (30 questions × 5 tiers × 3 metrics = 450 evaluation invocations; each metric makes 1-3 internal LLM calls). Conservative: ~1,350 LLM calls × ~500 input tokens × ~50 output tokens = ~675K input + ~67K output = **~$0.37 at gemini-2.5-flash rates** [ASSUMED — based on per-call envelope from Tier 5 live capture × 3-call-per-metric assumption; actual per-metric internal call count needs empirical confirmation in Wave 0]. Add the embedding cost for `answer_relevancy` (cosine similarity over 30 generated alternative-question variants × ~20 tokens each × 5 tiers = ~3K embedding tokens, ~$0.0001).
- **Whether to include `answer_correctness` or `semantic_similarity`** — ROADMAP locks 3 metrics. **Stick to the 3.** `LLMContextPrecisionWithReference` (uses `expected_answer` as `reference`) gives ground-truth-aware precision without adding a 4th metric. Document the choice.

**Embedding model for `AnswerRelevancy`:**
- **Recommend `openai/text-embedding-3-small` via OpenRouter** (1536 dim — already in PRICES; matches Tier 1 + Tier 3's embedder so the eval-time embedder doesn't introduce a new dependency). Routed through LiteLLM same as the judge LLM.

**Harness architecture (Pattern 3 — hybrid adapter):**
- **Recommend Option C (hybrid adapter, library-first).** The harness imports each tier's `query` library function and adapts the return shape to a uniform `EvalRecord{question_id, question, answer, retrieved_contexts, latency_s, cost_usd}`. Falls back to subprocess-via-CLI ONLY if a tier's library surface is too costly to import in the harness venv (e.g. Tier 4's MineRU torch deps).
- **Concretely:**
  - Tier 1 + Tier 5 — direct library import (Tier 5 even shares Tier 1's chroma collection — same venv).
  - Tier 2 — direct library import (only `google-genai` + `tiktoken`; lightweight).
  - Tier 3 — direct library import (`lightrag-hku==1.4.15`; medium weight; avoids subprocess overhead × 30 questions).
  - **Tier 4 — subprocess via `python tier-4-multimodal/main.py --query "..."` and parse stdout** OR **cached mode only** (read pre-generated `evaluation/results/queries/tier-4-*.json` the user produced locally). The harness is dual-mode capable for Tier 4 specifically. Pattern 8 details.
- **Justification:** `RAGAnything` + MineRU + `paddlepaddle` is ~5GB of torch/CUDA deps. The harness venv MUST be installable WITHOUT those deps (so the user can run Tiers 1/2/3/5 + RAGAS scoring without ever touching MineRU). The `[evaluation]` extra MUST NOT include `[tier-4]` — see Pattern 10.

**Latency persistence:**
- **Recommend combined per-query JSON** (`evaluation/results/queries/{tier}-{timestamp}.json`) with `latency_s` as a field on each record — NOT a separate `latency/` directory. Justification: latency is per-query (mirrors the per-query nature of the cost tracker), comparison output joins `cost`, `latency`, `metric_scores` per (tier, question), so colocating them simplifies aggregation. The cost JSON stays in `evaluation/results/costs/` (D-13 frozen schema, untouched). Pattern 4.

**Comparison table format (EVAL-04 / BLOG-04):**
- **Recommend single Markdown table** with columns: `Tier`, `Faithfulness`, `Answer Relevancy`, `Context Precision`, `Mean Latency (s)`, `Total Cost (USD)`, `Cost / Query (USD)`, `n questions`, `n NaN`. Sort tiers 1→5 in row order. Numbers rounded to 3 decimals (metrics in [0,1]) / 2 decimals (latency seconds) / 6 decimals (USD costs).
- **Per-question-class rollup** (single-hop / multi-hop / multimodal) — **YES, include as a second table** below the primary tier-rollup. Phase 133 may use either table depending on what reads better in the essay. Cheap to compute; high value for the multi-hop / multimodal narrative ("Tier 3 graph wins on multi-hop, Tier 4 wins on multimodal").

**Tests (mirror Phase 128-130 conventions):**
- `evaluation/tests/test_eval_dataset.py` — non-live: validates `golden_qa.json` shape (already covered by `tests/test_golden_qa.py`; the new file tests the `EvalRecord` adapter and the comparison-emitter).
- `evaluation/tests/test_comparison.py` — non-live: feeds canned `EvalRecord`s + canned metric scores into the Markdown emitter; checks the table renders with expected columns / rounding.
- `evaluation/tests/test_eval_smoke_live.py` — `@pytest.mark.live`: 1-2 questions × 1 tier (recommend Tier 1 — fastest, cheapest, no async); runs the harness end-to-end including RAGAS scoring; asserts `cost > 0`, `0 ≤ score ≤ 1` for each of the 3 metrics, no NaN. Target wall time < 60s. Skips on missing `OPENROUTER_API_KEY` via `live_eval_keys_ok` fixture.
- **Filename convention:** `test_evaluation_*.py` (matches Phase 129 Plan 07 / Phase 130 Plan 06 pytest rootdir basename uniqueness rule — no `__init__.py` in tier-local `tests/`).

### Deferred Ideas (OUT OF SCOPE for Phase 131)

- **Adding more golden Q&A entries.** `golden_qa.json` is already at 30 (covers EVAL-01 spec of "30+"). Expansion is a Phase 131-future task or v1.23+.
- **Cross-document Q&A as a separate bucket.** EVAL-01 lists "cross-document" but the existing 10 multi-hop entries ALL cite ≥2 papers (verified in 127-06-SUMMARY.md by `test_multi_hop_has_multiple_papers`). Multi-hop ≡ cross-document for our corpus. Document the equivalence; do NOT add a separate bucket.
- **Video Q&A**. Deliberately substituted with multimodal extras in Phase 127 — already documented as a deferral. Phase 131 does NOT add video.
- **Live-runs in Phase 131 plan execution for Tier 4.** Phase 130 SC-1 is deferred to user. Phase 131's harness MUST handle the case where `evaluation/results/queries/tier-4-*.json` is absent (skip Tier 4 row in comparison with a clear "Tier 4 deferred — run Tier 4 locally and re-run aggregator" note in the table).
- **Re-implementing retrieval inside the harness.** All 5 tiers have working retrieval/generation pipelines. Harness imports them; never re-implements.
- **A 4th metric (`answer_correctness`, `semantic_similarity`, `context_recall`, `noise_sensitivity`).** ROADMAP locks 3 metrics. Stick to 3.
- **Streaming evaluation results to a dashboard.** Single offline-batch run; markdown comparison. No dashboard.
- **Caching judge-LLM responses.** RAGAS does not cache by default in 0.4.x; adding a cache layer is premature optimization for ~$0.37 per full run.
- **Per-tool-call cost attribution for Tier 5.** Tier 5's per-turn cost rolls up via `cost_tracker.persist()` already (one record per turn — no separate attribution needed for the comparison table).
- **Multi-tier ensembling / agentic-oversight evaluation.** Out of scope; we're benchmarking 5 tiers independently.
- **Statistical significance tests** (paired t-tests etc. across tiers). 30 questions × 5 tiers is too small for meaningful significance testing. Report raw means + n; the blog post can speak to magnitude not p-values. **Document this honestly in the comparison output footer.**
- **A custom `@experiment`-decorator workflow.** RAGAS 0.4.x is mid-migration — `evaluate()` is deprecated but still works. Use `evaluate()` for v1; revisit `@experiment` once it stabilizes (confirmation: `evaluate()` is documented in 0.4.3 stable docs as still-functional with a deprecation warning, not removed).
</user_constraints>

## Phase Requirements

| ID       | Description                                                                                                | Research Support |
|----------|------------------------------------------------------------------------------------------------------------|------------------|
| EVAL-01  | Golden Q&A test set (30+ questions) covering single-hop, multi-hop, cross-document, multimodal queries     | Pattern 9 — verifies existing `golden_qa.json` (30 entries: 10/10/10/0) satisfies EVAL-01; multi-hop ≡ cross-document for our corpus (D-04 + 127-06-SUMMARY) |
| EVAL-02  | RAGAS metrics (faithfulness, answer relevancy, context precision) per tier                                 | Pattern 1 + Pattern 6 + Code Examples A/B/C |
| EVAL-03  | Cost and latency tracking per tier with comparison summary                                                 | Pattern 2 + Pattern 4 — cost via existing `shared.cost_tracker`; latency persisted in `EvalRecord` JSON |
| EVAL-04  | Comparison script generating tier-by-tier results table                                                    | Pattern 5 — `evaluation/compare.py` emits Markdown table; Phase 133 imports the file verbatim |

## Domain Background

### What RAGAS Is and What Each Metric Measures

**RAGAS** (Es et al. 2023, arXiv 2309.15217) is a **reference-free evaluation framework for RAG systems**. Latest stable version is **0.4.3** [VERIFIED: PyPI `/pypi/ragas/json`, fetched 2026-04-27]. It uses LLM-as-judge prompts to score four aspects of RAG output without requiring fully human-annotated ground truth (though some metrics — like `LLMContextPrecisionWithReference` — DO accept a reference answer for higher reliability).

**The three locked metrics:**

| Metric              | What it measures                                                                                            | Inputs (RAGAS 0.4.x)                                  | Needs LLM | Needs Embedder | Needs Reference |
|---------------------|-------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|-----------|----------------|-----------------|
| **Faithfulness**    | Are the claims in `response` grounded in the `retrieved_contexts`? (hallucination detector)                 | `user_input`, `response`, `retrieved_contexts`        | Yes       | No             | No              |
| **Answer Relevancy**| Is the `response` semantically aligned with the `user_input`? (uses generated counter-questions + cosine)   | `user_input`, `response`                              | Yes       | Yes            | No              |
| **Context Precision** (with reference) | Are the `retrieved_contexts` relevant to the `user_input`, in rank order? Uses `reference` to verify. | `user_input`, `retrieved_contexts`, `reference` | Yes | No | Yes (use `expected_answer`) |

[CITED: docs.ragas.io/en/stable/concepts/metrics/available_metrics/{faithfulness,answer_relevance,context_precision}/]

**Why "with reference" for context precision:** the golden Q&A already has hand-authored `expected_answer` (Phase 127-06, D-04 citation-chain discipline). Using it as `reference` makes context-precision more reliable than the reference-free variant and costs nothing extra (the data is already there). This is the right tradeoff for our corpus.

### Judge LLM Mechanics

RAGAS sends one or more LLM prompts per metric per sample. Faithfulness, for example, asks the judge to enumerate the claims in `response`, then for each claim check whether it is supported by the retrieved contexts. The score is `supported_claims / total_claims`. Answer relevancy asks the judge to generate K alternative questions that COULD have produced the response, then computes cosine similarity between the embedding of each alternative and the original question (hence the embedding model dependency). Context precision asks the judge whether each retrieved chunk would help answer the question.

**Implication for cost:** judge cost grows linearly with `30 questions × 5 tiers × 3 metrics ≈ 450 evaluations × (1-3 internal LLM calls)`. Pattern 6 details the recommended judge model.

### Version Surface as of 2026-04

RAGAS is in active migration from v0.3 to v0.4. Important changes for us [CITED: docs.ragas.io/en/stable/howtos/migrations/migrate_from_v03_to_v04/]:

| What                              | v0.3 (legacy)                                                | v0.4.x (current)                                                                                                                              |
|-----------------------------------|--------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `evaluate()` function             | Primary API                                                  | **Deprecated, still functional.** Use for now; revisit `@experiment` decorator post-stabilization.                                            |
| `LangchainLLMWrapper`             | Standard wrapper for non-OpenAI LLMs                         | **Deprecated.** Use `llm_factory(provider="litellm", client=litellm.completion)`.                                                              |
| Metric scoring                    | `single_turn_ascore(SingleTurnSample(...))`                  | **Both APIs work.** Old: `from ragas.metrics import faithfulness; faithfulness.single_turn_ascore(sample)`. New: `from ragas.metrics.collections import Faithfulness; Faithfulness(llm=llm).ascore(user_input=..., response=..., retrieved_contexts=[...])`. |
| `ground_truths`                   | List of strings                                              | **Renamed to `reference`, single string.**                                                                                                    |

**Recommendation for Phase 131:** use the **`evaluate()` bulk API** + the **legacy `ragas.metrics.{faithfulness, answer_relevancy, context_precision}`** module-level metric instances + an **`EvaluationDataset`** of `SingleTurnSample`s. This is the well-documented, stable path. The `ragas.metrics.collections` per-metric-class API is newer but documentation is sparser; defer.

## Recommended Approach

### Architecture

```
evaluation/
├── golden_qa.json              # 30 entries — UNCHANGED, locked from Phase 127-06
├── README.md                   # User docs; live-test recipe (proxy + socksio); cost envelope
├── harness/
│   ├── __init__.py
│   ├── records.py              # EvalRecord dataclass + per-tier EvalRecord persistence
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── tier_1.py           # imports tier_1_naive.{retrieve,chat,store,embed_openai}
│   │   ├── tier_2.py           # imports tier_2_managed.query
│   │   ├── tier_3.py           # imports tier_3_graph.{rag,query} (async)
│   │   ├── tier_4.py           # subprocess CLI OR cached-JSON read (dual mode)
│   │   └── tier_5.py           # imports tier_5_agentic.agent + agents.Runner (async)
│   ├── run.py                  # `python -m evaluation.harness.run --tiers 1,2,3,5 --live` — main entry
│   ├── score.py                # RAGAS scoring over EvalRecord JSONs → metric JSONs
│   └── compare.py              # Aggregator: queries/ + costs/ + metrics/ → comparison.md
├── results/
│   ├── costs/                  # {tier}-{timestamp}.json — D-13 schema (existing, untouched)
│   ├── queries/                # {tier}-{timestamp}.json — NEW: per-question records w/ latency
│   ├── metrics/                # {tier}-{timestamp}.json — NEW: RAGAS scores per question
│   └── comparison.md           # NEW: tier-by-tier markdown table for Phase 133
└── tests/
    ├── conftest.py             # live_eval_keys_ok + repo-root sys.path bootstrap
    ├── test_eval_records.py    # non-live: EvalRecord shape; adapter contracts (canned tier outputs)
    ├── test_compare.py         # non-live: compare.py emits well-formed markdown
    └── test_eval_smoke_live.py # @pytest.mark.live: 1 tier × 1 question, full harness E2E
```

**Two-stage execution model (cached-first):**

1. **Stage 1 — capture per-tier query logs** (`evaluation.harness.run --tiers 1,2,3,5 --live`):
   - For each tier in `--tiers`, for each question in `golden_qa.json`:
     - Call the tier's library entry point.
     - Time it with `time.monotonic()`.
     - Collect `{question_id, question, answer, retrieved_contexts, latency_s, cost_usd}`.
   - Persist all records into `evaluation/results/queries/{tier}-{timestamp}.json`.
   - Persist the `CostTracker` JSON into `evaluation/results/costs/{tier}-{timestamp}.json` as usual.
   - Tier 4 deferred: user runs `python tier-4-multimodal/main.py --query "..."` over the 30 questions locally and writes their own `tier-4-*.json` query log (the harness provides a helper `python -m evaluation.harness.run --tier 4 --batch-from-cli` that loops through the questions and shells out — usable IF the user's local env has MineRU working).

2. **Stage 2 — score the query logs** (`evaluation.harness.score --inputs results/queries/`):
   - Load each `{tier}-{timestamp}.json`.
   - Build a RAGAS `EvaluationDataset` of `SingleTurnSample` with `user_input`, `response`, `retrieved_contexts`, `reference` (= `expected_answer` from `golden_qa.json`).
   - Wire judge LLM + embedder via `llm_factory(..., provider="litellm")`.
   - Call `evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision], llm=..., embeddings=..., token_usage_parser=...)`.
   - Persist results to `evaluation/results/metrics/{tier}-{timestamp}.json`.
   - Persist the judge's own cost via a SEPARATE `CostTracker("ragas-judge")` so judge cost is auditable separately from tier cost.

3. **Stage 3 — emit the comparison table** (`evaluation.harness.compare`):
   - Read latest `queries/`, `costs/`, `metrics/` per tier.
   - Aggregate: mean(`faithfulness`), mean(`answer_relevancy`), mean(`context_precision`), mean(`latency_s`), sum(`cost_usd` over costs JSON), n_questions, n_NaN.
   - Emit `evaluation/results/comparison.md` with: (a) primary tier-rollup table, (b) per-question-class rollup table (single-hop / multi-hop / multimodal).
   - Also emit a "missing tiers" footer if any tier has no recent query log (e.g. Tier 4 if user hasn't run it).

**Why two stages and not one:** judge LLM evaluation is independently re-runnable. If RAGAS prompts change, or we add a 4th metric, we re-run Stage 2 against the unchanged Stage 1 query logs without re-paying for tier inference. Cleanly separates "did the tier work" (Stage 1) from "did the tier do well" (Stage 2). Mirrors the Phase 130 separation of "expected_output.md captured live" + "RAGAS scoring deferred to Phase 131" — same philosophy.

### Latency Persistence

**Decision:** colocate latency with the query record, NOT with cost JSON.

- `evaluation/results/costs/{tier}-{timestamp}.json` — D-13 frozen, **unchanged**.
- `evaluation/results/queries/{tier}-{timestamp}.json` — NEW. Each row:
  ```json
  {
    "question_id": "single-hop-001",
    "question": "What is the core mechanism Lewis et al. 2020...",
    "answer": "RAG models combine a pre-trained seq2seq...",
    "retrieved_contexts": [
      "...chunk text 1...",
      "...chunk text 2..."
    ],
    "latency_s": 4.32,
    "cost_usd_at_capture": 0.000795,
    "error": null
  }
  ```

`cost_usd_at_capture` is a CONVENIENCE COPY (snapshot of `tracker.total_usd()` after the query) — the authoritative cost source remains the cost JSON. Useful for the comparison aggregator: avoids needing a perfect timestamp match between `costs/` and `queries/` JSON files.

### Combined-vs-Separate Schema Recommendation

**Recommend separate** (`queries/` for per-question records + `costs/` D-13-frozen + `metrics/` for RAGAS scores) over a single combined `evaluation/results/{tier}-{timestamp}.json`. Justification:

- **D-13 cost schema is frozen** — modifying it would require a (politically expensive) re-derivation of the lock; cleaner to add NEW directories.
- **Stage 2 (RAGAS scoring) writes only `metrics/`** — separating it lets Stage 2 re-run independently of Stage 1.
- **Phase 133 (blog post)** consumes `comparison.md`, not the underlying JSONs, so the JSON layout is invisible to downstream consumers.

## Standard Stack

### Core (Evaluation)

| Library                       | Version            | Purpose                                                       | Why Standard                                                                 |
|-------------------------------|--------------------|---------------------------------------------------------------|------------------------------------------------------------------------------|
| `ragas`                       | `>=0.4.3,<0.5`     | Faithfulness / Answer Relevancy / Context Precision metrics  | The reference-free RAG eval framework cited in our own golden Q&A multi-hop-009; native LLM-as-judge prompts maintained by Es et al.'s team [VERIFIED: PyPI 0.4.3 metadata] |
| `langchain-openai`            | `>=0.2,<0.4`       | OpenAI-compatible LLM client used by ragas internally        | `ragas.llms.llm_factory` constructs LangChain wrappers under the hood; pin LangChain ecosystem to compatible majors                                                       |
| `langchain-community`         | `>=0.4,<0.5`       | LangChain ecosystem foundation                                | Required transitively by ragas; verified to NOT pull `google-generativeai` [VERIFIED: PyPI 0.4.1 metadata]                                                                |
| `litellm`                     | `>=1.0,<2`         | Unified LLM router used by `llm_factory(provider="litellm")`  | Same router Tier 5 already uses (`openai-agents[litellm]==0.14.6` pulls it); proven in-sandbox via SOCKS5+socksio + OpenRouter routing                                    |
| `datasets`                    | `>=4.0`            | HuggingFace Datasets — RAGAS's `EvaluationDataset` parent     | RAGAS hard-requires `datasets>=4.0.0` per its `requires_dist`; no project-side feature use, just the transitive lock                                                      |

### Supporting (already shipped — REUSED, not re-installed)

| Library      | Version              | Purpose                                                | When to Use                                                  |
|--------------|----------------------|--------------------------------------------------------|--------------------------------------------------------------|
| `pytest`     | `>=8.4,<9`           | Test runner                                             | Already in `[dependency-groups.test]`; mark live tests with `@pytest.mark.live` |
| `pydantic`   | `>=2.10,<3`          | EvalRecord dataclass schema + validation               | Already in `[shared]` — REUSE                                 |
| `rich`       | `>=14,<16`           | Console output for harness progress                    | Already in `[shared]` — REUSE for harness CLI logging         |
| `tiktoken`   | `>=0.10,<1`          | Token counting fallback                                | Already in `[shared]`; not strictly required (RAGAS uses LangChain's own counter) |
| `python-dotenv`| `>=1.0,<2`         | `.env` loading in conftest                             | Already in `[shared]` — REUSE                                 |

### Alternatives Considered

| Instead of                         | Could Use                       | Tradeoff                                                                                                                          |
|------------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| `ragas`                            | `deepeval` / `trulens`          | DeepEval has similar metrics but smaller community; TruLens is observability-first not eval-first; RAGAS is the canonical RAG eval lib cited in literature |
| `evaluate()` function              | `@experiment` decorator         | `@experiment` is the v0.4 successor; `evaluate()` is deprecated but stable. Use `evaluate()` for v1; document the migration path |
| `llm_factory(provider="litellm")`  | `LangchainLLMWrapper(ChatOpenAI(...))` | Wrapper is deprecated in 0.4.x. `llm_factory` is the new canonical path. Both work today                                          |
| `LLMContextPrecisionWithReference` | `LLMContextPrecisionWithoutReference` | Reference variant is more reliable; `expected_answer` is already in golden_qa.json — free to use                                  |
| `google/gemini-2.5-flash` judge    | `openai/gpt-4o-mini` judge      | Either works. Gemini Flash chosen for narrative continuity with Tiers 2/4 and slightly cheaper at output (we expect ~50 output tokens per call) |
| Subprocess Tier 4                  | Library-import Tier 4           | Library-import requires installing `[tier-4]` (5GB MineRU/torch) into the harness venv. Subprocess keeps the harness lightweight. Same for cached mode. |

**Installation:**

```bash
# In rag-architecture-patterns/
uv pip install -e ".[evaluation]"
# Optional, for live runs of all tiers in-sandbox:
uv pip install -e ".[evaluation,tier-1,tier-2,tier-3,tier-5]"
# Tier 4 is a separate concern — install [tier-4] only if you have MineRU set up locally
```

**Version verification commands** (run in Wave 0):

```bash
npm view ragas version           # Wrong tool — use pip
python -c "import ragas; print(ragas.__version__)"   # confirm 0.4.x post-install
python -c "from ragas.metrics import faithfulness, answer_relevancy, context_precision; print('OK')"
```

The chosen version (`ragas>=0.4.3,<0.5`) was verified as the latest published 0.4-series release as of 2026-04-27 [VERIFIED: PyPI metadata].

## Architecture Patterns

### System Architecture Diagram

```
                        +----------------------------------+
                        |    evaluation/golden_qa.json     |  (30 questions; READ-ONLY input)
                        +-----------------+----------------+
                                          |
                  +-----------------------+------------------------+
                  |  Stage 1: harness.run --tiers 1,2,3,5 --live   |
                  +-----------------------+------------------------+
                                          | per (tier × question)
                  +----+--------+--------+-+------+--------+
                  |    |        |        |        |        |
                  v    v        v        v        v        v
              +-----+ +----+ +-----+ +-----+ +-----+   (Tier 4 = USER-LOCAL or SUBPROCESS)
              |T1   | |T2  | |T3   | |T5   | |T4*  |   * deferred / dual-mode
              |lib  | |lib | |lib  | |lib  | |CLI  |
              +-----+ +----+ +-----+ +-----+ +-----+
                  |    |        |        |        |
                  +----+----+---+---+----+----+----+
                            v        v        v
                   +-------------+ +-----------+ +-----------+
                   | results/    | | results/  | | results/  |
                   | queries/    | | costs/    | | (per tier)|
                   | {tier}.json | | {tier}.json| (D-13 frozen)
                   +------+------+ +-----+-----+ +-----------+
                          |              |
                          v              |
                  +-------+-------+      |
                  | Stage 2:      |      |
                  | harness.score |      |
                  | (RAGAS judge) |      |
                  +-------+-------+      |
                          |              |
                          v              |
                  +---------------+      |
                  | results/      |      |
                  | metrics/      |      |
                  | {tier}.json   |      |
                  +-------+-------+      |
                          |              |
                          +----+---------+
                               |
                               v
                  +-----------------------+
                  | Stage 3:              |
                  | harness.compare       |
                  | (aggregator)          |
                  +----------+------------+
                             |
                             v
                  +---------------------------+
                  | results/comparison.md     |  -> Phase 133 BLOG-04
                  | (tier rollup + class      |
                  |  rollup; markdown tables) |
                  +---------------------------+
```

**Stage independence (load-bearing property):** Stage 2 re-runs without re-paying Stage 1 (judge model swap); Stage 3 re-runs without re-paying either (rounding/format change).

### Component Responsibilities

| File                                 | Responsibility                                                                                          |
|--------------------------------------|----------------------------------------------------------------------------------------------------------|
| `evaluation/harness/records.py`      | `EvalRecord` Pydantic model; `read_query_log(path)`, `write_query_log(path, records)`                    |
| `evaluation/harness/adapters/tier_1.py` | `async run_tier1(question: str, k: int = 5) -> EvalRecord` — opens chroma collection, embeds, retrieves, generates, captures latency + cost |
| `evaluation/harness/adapters/tier_2.py` | `async run_tier2(question: str) -> EvalRecord` — calls `tier_2_managed.query.query`, extracts grounding chunks |
| `evaluation/harness/adapters/tier_3.py` | `async run_tier3(question: str, mode: str = "hybrid") -> EvalRecord` — wraps `tier_3_graph.query.run_query`; LightRAG returns string; `retrieved_contexts` populated via LightRAG's chunk-retrieval probe (see Pattern 9) |
| `evaluation/harness/adapters/tier_4.py` | `async run_tier4(question: str, mode: str = "hybrid") -> EvalRecord` — subprocess CLI mode OR read-from-cached-json mode |
| `evaluation/harness/adapters/tier_5.py` | `async run_tier5(question: str, max_turns: int = 10) -> EvalRecord` — wraps `agents.Runner.run`; handles `MaxTurnsExceeded` |
| `evaluation/harness/run.py`          | Top-level CLI: parses `--tiers`, iterates golden_qa, calls adapter per tier × question, persists query log + cost JSON |
| `evaluation/harness/score.py`        | Loads query logs → `EvaluationDataset` of `SingleTurnSample` → `evaluate()` with judge LLM/embedder → persists metrics JSON + judge cost |
| `evaluation/harness/compare.py`      | Aggregates queries/ + costs/ + metrics/ → emits `comparison.md` (two tables: tier rollup, class rollup) |

### Recommended Project Structure

(Already shown in Architecture section above. Repeating just the harness for clarity:)

```
evaluation/
├── golden_qa.json
├── README.md                         # NEW: harness usage + live recipe
├── harness/                          # NEW: the harness package
│   ├── __init__.py
│   ├── records.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── tier_1.py
│   │   ├── tier_2.py
│   │   ├── tier_3.py
│   │   ├── tier_4.py
│   │   └── tier_5.py
│   ├── run.py
│   ├── score.py
│   └── compare.py
├── results/                          # already exists; new subdirs added by Phase 131
│   ├── costs/                        # existing (D-13 frozen)
│   ├── queries/                      # NEW
│   ├── metrics/                      # NEW
│   └── comparison.md                 # NEW
└── tests/                            # NEW: harness unit + smoke tests
    ├── conftest.py
    ├── test_eval_records.py
    ├── test_compare.py
    └── test_eval_smoke_live.py
```

### Pattern 1: Cached Per-Tier Query JSON

**What:** Each tier's per-question outputs (answer, retrieved_contexts, latency, cost) are persisted to `evaluation/results/queries/{tier}-{timestamp}.json` BEFORE RAGAS scoring runs. RAGAS reads these JSONs offline.

**When to use:** Always. The two-stage separation is THE architectural decision of Phase 131.

**Example:**
```python
# evaluation/harness/records.py
from pydantic import BaseModel, Field
from typing import Optional

class EvalRecord(BaseModel):
    question_id: str
    question: str
    answer: str
    retrieved_contexts: list[str] = Field(default_factory=list)
    latency_s: float
    cost_usd_at_capture: float
    error: Optional[str] = None

class QueryLog(BaseModel):
    tier: str
    timestamp: str  # ISO 8601 UTC, "Z" suffix (matches D-13)
    git_sha: str
    model: str
    records: list[EvalRecord]

    def write(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.model_dump_json(indent=2), encoding="utf-8")
```

### Pattern 2: RAGAS Judge Cost via `shared.cost_tracker`

**What:** Wire RAGAS's built-in `token_usage_parser` to ALSO record into `shared.cost_tracker.CostTracker("ragas-judge")` so judge LLM cost lands in the same accounting infrastructure as tier costs.

**When to use:** Stage 2 (`harness.score`) — every time RAGAS runs.

**Example:**
```python
# evaluation/harness/score.py
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
from ragas.cost import get_token_usage_for_openai  # works for OpenAI-compatible (incl. OpenRouter)
from shared.cost_tracker import CostTracker

tracker = CostTracker("ragas-judge")

result = evaluate(
    dataset=eval_dataset,
    metrics=[faithfulness, answer_relevancy, context_precision],
    llm=judge_llm,
    embeddings=judge_embeddings,
    token_usage_parser=get_token_usage_for_openai,  # populates result.total_tokens()
)

usage = result.total_tokens()
# Convert TokenUsage -> CostTracker rows. Pricing key: provider/model slug
tracker.record_llm("google/gemini-2.5-flash", usage.input_tokens, usage.output_tokens)
tracker.persist()
```

[CITED: docs.ragas.io/en/stable/howtos/applications/_cost/, GitHub issue 540]

**Why this matters:** Phase 133's blog post will likely report total evaluation cost ("comparing the 5 tiers cost $X across all metrics"). Funnel everything through CostTracker so the number is auditable in one place.

### Pattern 3: Per-Tier Adapter Contract

**What:** Each adapter exposes a uniform `async run_tierN(question: str, **kwargs) -> EvalRecord` signature. The harness loop is tier-agnostic.

**When to use:** Always. The contract is the load-bearing abstraction.

**Example:**
```python
# evaluation/harness/adapters/tier_1.py
import time
from shared.cost_tracker import CostTracker
from tier_1_naive.store import open_collection
from tier_1_naive.embed_openai import build_openai_client, embed_batch
from tier_1_naive.retrieve import retrieve_top_k
from tier_1_naive.chat import build_chat_client, complete as chat_complete
from tier_1_naive.prompt import build_prompt
from evaluation.harness.records import EvalRecord

async def run_tier1(question: str, k: int = 5, model: str = "google/gemini-2.5-flash") -> EvalRecord:
    coll = open_collection(reset=False)
    if coll.count() == 0:
        return EvalRecord(question_id="", question=question, answer="",
                          latency_s=0.0, cost_usd_at_capture=0.0,
                          error="Tier 1 chroma empty — run `python tier-1-naive/main.py --ingest` first")

    tracker = CostTracker("tier-1-eval")
    t0 = time.monotonic()

    embed_client = build_openai_client()
    [qv] = embed_batch(embed_client, [question], tracker)
    res = retrieve_top_k(coll, query_vec=qv, k=k)

    prompt = build_prompt(question, res["documents"], res["metadatas"])
    chat_client = build_chat_client()
    answer = chat_complete(chat_client, prompt, model=model, tracker=tracker)
    latency = time.monotonic() - t0

    return EvalRecord(
        question_id="",  # set by caller
        question=question,
        answer=answer.text,
        retrieved_contexts=list(res["documents"]),
        latency_s=latency,
        cost_usd_at_capture=tracker.total_usd(),
    )
```

### Pattern 4: Latency Dataclass + Persist (Combined with Query Record)

**What:** Latency lives ON the `EvalRecord`, not in a separate file. The latency persistence story is "write `EvalRecord.latency_s` into `queries/{tier}-{timestamp}.json`."

**When to use:** Always. Latency separation was considered and rejected — see "Latency Persistence" decision above.

**Example:** Already shown in Pattern 1's `EvalRecord` schema.

### Pattern 5: Comparison Markdown Emitter

**What:** `compare.py` reads `queries/`, `costs/`, `metrics/` → emits `comparison.md` with two tables (tier rollup + class rollup) and a footer.

**When to use:** Stage 3, post-Stage 2.

**Example:**
```python
# evaluation/harness/compare.py — table emitter sketch
def emit_tier_rollup(rows: list[dict]) -> str:
    header = "| Tier | Faithfulness | Answer Relevancy | Context Precision | Mean Latency (s) | Total Cost (USD) | Cost / Query (USD) | n | n NaN |"
    sep    = "|------|--------------|------------------|--------------------|-------------------|-------------------|---------------------|---|-------|"
    lines = [header, sep]
    for r in rows:
        lines.append(
            f"| {r['tier']} "
            f"| {r['faithfulness']:.3f} "
            f"| {r['answer_relevancy']:.3f} "
            f"| {r['context_precision']:.3f} "
            f"| {r['mean_latency_s']:.2f} "
            f"| {r['total_cost_usd']:.6f} "
            f"| {r['cost_per_query_usd']:.6f} "
            f"| {r['n']} "
            f"| {r['n_nan']} |"
        )
    return "\n".join(lines)
```

The class-rollup table has the same columns but rows are `(class, tier)` pairs (so 3 classes × 5 tiers = 15 rows). Phase 133 picks whichever rendering reads better.

### Pattern 6: Judge Model Selection — `google/gemini-2.5-flash` via OpenRouter LiteLLM

**What:** RAGAS judge LLM and embedding model both routed through `litellm.completion` and `litellm.embedding` (which transparently handles OpenRouter via the `openrouter/` prefix).

**When to use:** Stage 2 wiring.

**Example:**
```python
# evaluation/harness/score.py — judge wiring
import litellm
from ragas.llms import llm_factory
from ragas.embeddings.base import embedding_factory

# Judge LLM — google/gemini-2.5-flash via OpenRouter (LiteLLM)
judge_llm = llm_factory(
    "openrouter/google/gemini-2.5-flash",
    provider="litellm",
    client=litellm.completion,
)

# Embedder for AnswerRelevancy — text-embedding-3-small via OpenRouter
judge_embeddings = embedding_factory(
    "litellm",
    model="openrouter/openai/text-embedding-3-small",
)
```

[CITED: docs.ragas.io/en/stable/howtos/customizations/customize_models/]

**Why OpenRouter not native APIs:** the sandbox SOCKS5 + socksio proxy recipe routes ALL OpenRouter traffic; Tier 5 already proved this works. Direct `google-genai` would also work but adds a second auth path (`GEMINI_API_KEY`) where one (`OPENROUTER_API_KEY`) suffices.

### Pattern 7: Pricing Entry for Judge

**What:** Verify every model used by the judge appears in `shared/pricing.PRICES` — they ALL already do as of 2026-04-25 (`PRICING_DATE`).

**When to use:** Wave 0 verification step.

**Example:**
```python
# Pre-flight check
from shared.pricing import PRICES
JUDGE_LLM = "google/gemini-2.5-flash"
JUDGE_EMB = "openai/text-embedding-3-small"
assert JUDGE_LLM in PRICES, f"add {JUDGE_LLM} to PRICES"
assert JUDGE_EMB in PRICES, f"add {JUDGE_EMB} to PRICES"
# Both verified present in shared/pricing.py as of Phase 127.
```

**No PRICES edits needed.** Document this in the plan as an explicit "Pattern 7 OK" check.

### Pattern 8: Dual-Mode Execution (Live | Cached)

**What:** Each adapter accepts a `--from-cache PATH` flag (or its module API equivalent) that bypasses the live tier call and reads pre-existing `EvalRecord`s from disk. Tier 4 specifically defaults to cached mode.

**When to use:** Tier 4 always (deferred per Phase 130 SC-1); other tiers when re-running Stage 2 only.

**Example:**
```python
# evaluation/harness/run.py
if args.from_cache:
    log = QueryLog.parse_file(args.from_cache)
    persist_log(log)  # idempotent; already on disk
else:
    log = await run_tier_live(args.tier, golden_qa)
    persist_log(log)
```

**Tier 4 specific subcommand:** `python -m evaluation.harness.run --tier 4 --from-cache evaluation/results/queries/tier-4-2026-04-28T12:00:00Z.json` — accepts a user-generated query log captured by THEIR local Tier 4 run.

### Pattern 9: Empty-Context Handling and Cross-Document Verification

**What:** RAGAS metrics return NaN when `retrieved_contexts=[]` (faithfulness has nothing to ground against; context_precision has nothing to score). The harness MUST detect this and:
1. Persist `nan_reason: "empty_contexts"` on the metric record.
2. Surface `n_NaN` count per tier in the comparison table.

**When to use:** Stage 2 score persistence + Stage 3 aggregator.

**Why this happens for Tier 5 specifically:** Phase 130-06 captured an empirical case — Tier 5 agent declined to call `search_text_chunks` when Tier 1's collection was empty. Even with a populated collection, the agent may decline to fabricate citations on questions where retrieval returns garbage. Tier 5's `retrieved_contexts` may legitimately be `[]` for some questions; that's honest behavior, not a bug.

**Cross-document verification (EVAL-01):** Multi-hop ≡ cross-document for our corpus. Verify by:
```python
# Wave 0 sanity check
import json
from collections import Counter
qa = json.load(open("evaluation/golden_qa.json"))
multi_hop = [q for q in qa if q["hop_count_tag"] == "multi-hop"]
assert all(len(q["source_papers"]) >= 2 for q in multi_hop), \
    "multi-hop entries must cite >=2 papers (cross-document)"
print(f"Cross-document coverage: {len(multi_hop)}/30 questions cite >=2 papers")
# Should print "Cross-document coverage: 10/30 questions cite >=2 papers"
```

This satisfies EVAL-01's "cross-document" criterion without adding a new bucket.

### Pattern 10: pyproject `[evaluation]` Extra

**What:** Add `[project.optional-dependencies.evaluation]` to `pyproject.toml`.

**When to use:** Plan 01 (foundation).

**Example:**
```toml
# pyproject.toml — additive (do NOT modify [tier-*])
[project.optional-dependencies]
# ... existing extras unchanged ...
evaluation = [
  "rag-architecture-patterns[shared]",
  "ragas>=0.4.3,<0.5",
  "langchain-openai>=0.2,<0.4",
  "langchain-community>=0.4,<0.5",
  "litellm>=1.0,<2",
  "datasets>=4.0",
]
```

**Critical:** `[evaluation]` does NOT depend on `[tier-1]`...`[tier-5]`. The harness uses tier APIs but the user opt-ins (or composes extras) per their needs. The smoke test invocation will be:

```bash
uv pip install -e ".[evaluation,tier-1]"   # smoke: Tier 1 + RAGAS
uv pip install -e ".[evaluation,tier-1,tier-2,tier-3,tier-5]"   # full live (skip Tier 4)
```

**After lock:** re-run `pytest tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk` — the existing guard test catches `google-generativeai` regression. Verified safe today; re-verify post-lock.

### Pattern 11: SOCKS5 + ALL_PROXY Parity for RAGAS

**What:** The sandbox proxy environment that works for Tiers 1-5 (verified Phase 128/129/130) ALSO works for RAGAS because RAGAS uses LiteLLM which uses `httpx` which honors `trust_env=True` by default.

**When to use:** Live RAGAS runs in-sandbox.

**Pre-flight invariants:**
1. `ALL_PROXY=socks5h://localhost:61994`, `HTTPS_PROXY=...` set in shell environment.
2. `socksio==1.0.0` in venv (`uv pip install socksio` — sandbox-only patch).
3. `OPENROUTER_API_KEY` in `.env`.
4. NOT in `pyproject.toml`: `socksio` (it's a sandbox patch only).

**Verification:** `python -c "import litellm; print(litellm.completion(model='openrouter/google/gemini-2.5-flash', messages=[{'role':'user','content':'hi'}]))"` succeeds in <5s.

### Pattern 12: tests/test_evaluation_*.py Shape

**What:** Three test files mirror Phase 128-130 conventions exactly.

**When to use:** Plan tests in last task before Stage 3.

**Conventions inherited:**
- No `__init__.py` in `evaluation/tests/` (Phase 128-02 follow-on rule).
- Filenames must be unique across the whole repo (pytest rootdir basename uniqueness): `test_eval_records.py`, `test_compare.py`, `test_eval_smoke_live.py` — all unique.
- Live tests `@pytest.mark.live`-marked; gated on `live_eval_keys_ok` fixture (skip if `OPENROUTER_API_KEY` unset).
- `evaluation/tests/conftest.py` does the repo-root `sys.path` bootstrap + `load_dotenv(".env")` (mirrors `tier-5-agentic/tests/conftest.py`).
- Smoke test target: < 60 seconds wall time, < $0.01 cost, 1 tier × 1-2 questions × all 3 metrics.

**Example smoke test skeleton:**
```python
# evaluation/tests/test_eval_smoke_live.py
import pytest
from evaluation.harness.adapters.tier_1 import run_tier1
from evaluation.harness.score import score_records
from evaluation.harness.records import EvalRecord

@pytest.mark.live
async def test_eval_smoke_tier1(live_eval_keys_ok, tier1_index_present, tmp_path):
    # 1. Live tier run — 1 question
    rec = await run_tier1("What is RAG?")
    assert rec.answer
    assert rec.cost_usd_at_capture > 0
    assert rec.latency_s > 0
    assert isinstance(rec.retrieved_contexts, list)

    # 2. RAGAS scoring on that one record
    scored = await score_records(
        records=[rec],
        reference="RAG combines parametric and non-parametric memory.",
        judge_model="openrouter/google/gemini-2.5-flash",
    )
    assert 0.0 <= scored[0].faithfulness <= 1.0
    assert 0.0 <= scored[0].answer_relevancy <= 1.0
    assert 0.0 <= scored[0].context_precision <= 1.0
    assert scored[0].nan_reason is None
```

## Don't Hand-Roll

| Problem                                              | Don't Build                                | Use Instead                                                                              | Why                                                                                                                                |
|------------------------------------------------------|--------------------------------------------|------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Faithfulness scoring (claim-decomposition + grounding) | Custom prompt loop                       | `ragas.metrics.faithfulness`                                                              | RAGAS's prompts are battle-tested across academic publications; rolling your own claim decomposer guarantees worse calibration       |
| Answer-relevancy via cosine over generated questions | Manual question generation + numpy cosine | `ragas.metrics.answer_relevancy`                                                          | Same — the prompt for generating alternative-questions matters; RAGAS team has tuned it                                              |
| Token-usage tracking during eval                     | Custom callback handler                    | `ragas.cost.get_token_usage_for_openai` + `evaluate(token_usage_parser=...)`              | Built-in, returns `TokenUsage(input_tokens, output_tokens, model)`; `result.total_cost(...)` for USD [CITED: docs.ragas.io _cost/]   |
| OpenRouter judge LLM wiring                          | Direct `httpx` calls to RAGAS prompt URLs  | `llm_factory(provider="litellm", client=litellm.completion)`                              | LiteLLM transparently handles `openrouter/` prefix; same proxy/socksio recipe as Tier 5                                              |
| Question/answer/context dataset shape                | Custom JSON schema with hand-written parser | `ragas.SingleTurnSample` + `ragas.EvaluationDataset`                                      | Native to RAGAS; `evaluate()` consumes EvaluationDataset directly                                                                    |
| Markdown table generator                             | f-string concatenation in 50+ lines       | Pattern 5 sketch + a small helper; OR `tabulate` if dependency budget allows              | Tabulate is overkill for two tables of ≤15 rows; ~30 lines of f-string is maintainable. **Don't add `tabulate` dependency.**         |
| Per-tier subprocess management for Tier 4            | Custom subprocess + stdout parser          | `subprocess.run([sys.executable, "tier-4-multimodal/main.py", "--query", q], capture_output=True)` + parse the cost JSON's last write | Stdlib subprocess is enough; cost JSON path is well-known                                                                            |
| Latency persistence schema                           | Separate `latency/` directory              | Field on `EvalRecord` (Pattern 4)                                                         | Avoids cross-file timestamp matching; co-located with the record it describes                                                        |
| Cost rollup across costs/ JSON files                 | Custom directory walk + JSON parse         | Glob latest `{tier}-*.json` per tier, sort by timestamp DESC, take first                  | Trivial; ~10 lines. Don't add `pandas` for this                                                                                      |

**Key insight:** RAGAS exists precisely because RAG eval is full of subtle prompt-engineering decisions (claim decomposition, alternative-question generation, context-relevance grading). Hand-rolling these means committing to maintaining their calibration in lockstep with the literature, which we will not do. Use RAGAS, document the pinned version, and re-evaluate at Phase 134 if scores look off.

## Runtime State Inventory

> Phase 131 is **additive**, not a rename / refactor / migration. No prior runtime state needs migrating.

| Category                       | Items Found                                                                                                                                                  | Action Required                  |
|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------|
| Stored data                    | None — `evaluation/golden_qa.json` is read-only input. Tier 1's `chroma_db/`, Tier 3's `lightrag_storage/`, Tier 4's `rag_anything_storage/` already populated by prior phases. | None                             |
| Live service config            | None — no external services modified. Tier 2's Gemini File Search store is owned by Tier 2; the harness consumes it read-only via `tier_2_managed.query.query`. | None                             |
| OS-registered state            | None — no daemons / scheduled tasks / pm2 processes.                                                                                                          | None                             |
| Secrets / env vars             | `OPENROUTER_API_KEY` already required by Tier 1, 3, 5; reused by RAGAS judge. `GEMINI_API_KEY` already required by Tier 2. **No new secrets.**               | None                             |
| Build artifacts                | `pyproject.toml` adds `[evaluation]` extra. After `uv lock` the lockfile updates. Re-run `pytest tests/test_tier_requirements.py` to reverify guard.          | Re-run lockfile guard post-lock  |

**Nothing found in any category requires migration.** Phase 131 is purely additive: new directory `evaluation/harness/`, new directory `evaluation/tests/`, new pyproject extra, new result-output directories `evaluation/results/{queries,metrics}/`.

## Common Pitfalls

### Pitfall 1: RAGAS Version Churn (v0.3 → v0.4 → v0.5)

**What goes wrong:** RAGAS shipped a major API rewrite in v0.4 with TWO parallel APIs (legacy `ragas.metrics.faithfulness` + new `ragas.metrics.collections.Faithfulness`). Tutorials online mix both. Code copy-pasted from a 2024 tutorial breaks on 0.4.x.
**Why it happens:** `LangchainLLMWrapper` deprecated in 0.4; `ground_truths` renamed to `reference`; `single_turn_ascore(sample)` vs `ascore(**kwargs)`.
**Mitigation:** Pin `ragas>=0.4.3,<0.5` in `[evaluation]`. Stick to the legacy bulk `evaluate()` API + `ragas.metrics.{faithfulness, answer_relevancy, context_precision}` (documented in 0.4.x stable docs as still-functional). Document the choice in code comments. Re-evaluate when 0.5 ships.
**Warning signs:** Code suddenly fails with `TypeError: __init__() got an unexpected keyword argument 'llm'` after a `ragas` minor bump.

### Pitfall 2: NaN Scores on Empty Contexts

**What goes wrong:** Faithfulness and context_precision return `NaN` when `retrieved_contexts=[]`. Mean over a column with NaN returns NaN — corrupting the comparison table.
**Why it happens:** Faithfulness needs claims to ground against contexts; if there are no contexts, the metric is undefined. Tier 5 may legitimately return empty contexts (agent declined to call retriever, observed in 130-06 live capture).
**Mitigation:** Pattern 9 — detect empty `retrieved_contexts` BEFORE calling RAGAS, mark `nan_reason="empty_contexts"`, surface `n_NaN` per tier in comparison.md, aggregate with `numpy.nanmean` (skips NaN). Don't substitute zero — that lies about performance.
**Warning signs:** comparison.md shows `nan` literal in a metric column.

### Pitfall 3: Judge Cost Runaway

**What goes wrong:** RAGAS sends multiple LLM calls per metric per sample. Naive run hits OpenRouter rate limits or burns more budget than expected.
**Why it happens:** Faithfulness decomposes the answer into claims (1 call) + verifies each claim (1 call per claim, ~3-7 claims typical). Answer relevancy generates K=3 alternative questions (1 call), embeds each (4 embed calls). Context precision grades each chunk (1 call per chunk, ~3-7 chunks). Worst case per sample: ~20 judge calls.
**Mitigation:** Conservative ballpark: 30 questions × 5 tiers × ~20 judge calls × ~500 input + ~50 output tokens = ~$0.5 for full eval at gemini-2.5-flash rates. **Set a soft budget alarm in `score.py`**: if running cost exceeds $2 mid-run, log a warning. **Use `batch_size` parameter** of `evaluate()` to control concurrency (default unbounded — may hammer the judge). Document the empirical cost in `evaluation/README.md` after the first full run.
**Warning signs:** OpenRouter 429 rate limit responses; judge wall time > 10 minutes for full 5-tier eval.

### Pitfall 4: Lockfile Guard Regression (`google-generativeai`)

**What goes wrong:** Adding `ragas` or its transitives to `uv.lock` accidentally pulls `google-generativeai` (deprecated, EOL 2025-08-31). `tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk` fails.
**Why it happens:** `langchain-google-genai`, if pulled in, depended on `google-generativeai` historically. Or a transitive of `datasets` / `langchain-community` adds it.
**Mitigation:** [VERIFIED] As of 2026-04-27, `ragas==0.4.3` and `langchain-community==0.4.1` `requires_dist` exclude `google-generativeai`. Plan 01 must include a "post-uv-lock guard test" task that re-runs `pytest tests/test_tier_requirements.py` and aborts the plan if the test fails. If it does fail: pin the offending transitive away (e.g., add `--no-binary` constraint or fork the dep tree). [VERIFIED: PyPI metadata]
**Warning signs:** Plan 01 lockfile-guard task fails. Phase 127 escape hatch: pin `langchain-google-genai` away.

### Pitfall 5: Async/Sync Boundary Confusion

**What goes wrong:** Tiers 3, 4, 5 are async (`aquery`, `Runner.run`); Tier 1, 2 are sync. RAGAS's metric `.score()` is sync, `.ascore()` is async. Mixing in a pytest function without `pytest-asyncio` causes deadlocks or "RuntimeError: This event loop is already running".
**Why it happens:** The harness loop wants to call all 5 adapters uniformly, but the adapters mix sync/async.
**Mitigation:** Make ALL adapters `async def` (wrap sync tier calls in `await asyncio.to_thread(...)` if needed). The harness top-level `run.py` calls `asyncio.run(amain(args))` ONCE. RAGAS's `evaluate()` handles its own event loop internally (it sets `allow_nest_asyncio=True` by default, which monkey-patches `asyncio` to allow nesting). This works inside a top-level `asyncio.run`. **Document the single asyncio.run boundary at the top of `run.py` and `score.py`.**
**Warning signs:** "RuntimeError: asyncio.run() cannot be called from a running event loop" or test hangs.

### Pitfall 6: Tier 4 Subprocess Output Parsing

**What goes wrong:** The harness shells out to `python tier-4-multimodal/main.py --query "..."`, but parsing answer + retrieved_contexts from rich-formatted stdout is brittle (rich emits ANSI color codes; tables wrap on terminal width).
**Why it happens:** Tier 4's CLI was designed for human display, not machine parsing.
**Mitigation:** **Don't parse stdout.** After `main.py` exits, READ the cost JSON it just persisted to `evaluation/results/costs/tier-4-{timestamp}.json`. For answer + retrieved_contexts: extend `tier-4-multimodal/main.py` with a `--json-out PATH` flag (Phase 131 Plan 03 task) that emits a JSON file alongside the existing rich output. Alternatively (cleaner): import `tier_4_multimodal.query.run_query` in the harness, but only if the harness venv has `[tier-4]` installed — see Pattern 8. **Recommended: cached mode primary, subprocess+`--json-out` flag fallback.**
**Warning signs:** Adapter unit tests fail because rich-format stdout doesn't match an expected regex.

### Pitfall 7: LightRAG Returns String, Not Chunks

**What goes wrong:** `tier_3_graph.query.run_query` returns `(answer_text, in_tok, out_tok)` but NOT the structured chunks LightRAG retrieved internally. RAGAS's faithfulness needs `retrieved_contexts: list[str]`.
**Why it happens:** LightRAG (1.4.15) does not expose retrieved chunks via its public API in the version we pinned (per 129-RESEARCH Pattern 4 + 130-RESEARCH inherited convention).
**Mitigation:** **Two options:**
1. **Use LightRAG's lower-level retrieval probe** to surface chunks before generation. LightRAG's `aquery` accepts `param=QueryParam(only_need_context=True)` which returns the assembled context string instead of generating an answer. Call this once per question to capture contexts; call `aquery(only_need_context=False)` to get the answer. Two LLM-free calls total per question (cheaper than one full call but ~2× retrieval time).
2. **Split LightRAG's context** — `aquery` with `only_need_context=True` returns a single string with all chunks concatenated. Split on the documented section delimiter (`-----` per LightRAG conventions) into a list of strings.
**Recommended: option 1 + option 2 together** — call `only_need_context=True` first (cheap; just retrieval), split into list, then call `only_need_context=False` for the answer. Persists answer + contexts independently. Document in adapter docstring.
**Same applies to Tier 4** (RAG-Anything wraps LightRAG — same `QueryParam` flag accessible). [VERIFIED: 130-RESEARCH adopted Tier 3's chunks adapter pattern]
**Warning signs:** RAGAS evaluation of Tier 3 / Tier 4 returns NaN faithfulness for every row — symptom of `retrieved_contexts=[]`.

### Pitfall 8: Tier 5 MaxTurnsExceeded Empty Answer

**What goes wrong:** Tier 5 raises `MaxTurnsExceeded` after 10 agent iterations; `final_output` is empty or "[truncated]". RAGAS scores this as faithful (no claims = trivially supported) and irrelevant (response is gibberish).
**Why it happens:** Long multi-hop queries can spiral; agent loops on tool-calling without ever synthesizing.
**Mitigation:** Pattern 9 + a Tier-5-specific extension: if `EvalRecord.error == "max_turns_exceeded"`, mark all 3 metrics as `NaN` with `nan_reason="agent_truncated"` BEFORE sending to RAGAS. The comparison-table footer reports n_truncated separately from n_NaN (both per tier).
**Warning signs:** Tier 5 column shows suspiciously high faithfulness or suspiciously low answer_relevancy on multi-hop questions.

### Pitfall 9: Multimodal Questions vs Text-Only Tiers

**What goes wrong:** 10 of the 30 golden Q&A entries reference figures (multimodal_001..010 with `figure_ids: ["1706.03762_fig_001"]` etc.). Tiers 1, 2, 3 are TEXT ONLY — they cannot retrieve figures. RAGAS scores their answers low on multimodal questions, but that's expected behavior (the design goal: multimodal questions discriminate Tier 4).
**Why it happens:** Mixing modalities in the eval set is the WHOLE POINT — each tier's strengths show up in the per-class rollup.
**Mitigation:** Per-class rollup table (Pattern 5) makes this visible. Phase 133 narrates: "Tiers 1-3 score X on text questions, Y on multimodal; Tier 4 scores X' on multimodal." **Do NOT filter multimodal questions out for text tiers** — that hides the point. **Do** make sure the comparison footer notes "Tiers 1-3 are text-only; multimodal scores reflect their limitation."
**Warning signs:** Tier 4 lower than Tier 1 on multimodal — would indicate Tier 4 is broken (Phase 130 SC-1 unfinished risk).

### Pitfall 10: `text-embedding-3-small` Dim Mismatch (RAGAS vs Tier)

**What goes wrong:** RAGAS uses the embedder for AnswerRelevancy alone (1536-dim by default for `text-embedding-3-small`). Tier 1 uses the same embedder for retrieval. There is NO interaction between the two embedding paths — RAGAS does not embed the corpus, only the question + alternative-questions.
**Why it happens:** Phantom concern — listed because it WOULD apply if RAGAS embedded the corpus, but it doesn't.
**Mitigation:** Document explicitly in `evaluation/README.md`: "the embedding model used by RAGAS for AnswerRelevancy is independent of any tier's retrieval embedder." Avoids confusion in Phase 132/133 review.
**Warning signs:** None — it's a non-issue.

### Pitfall 11: CostTracker Path Collision Across Tier and Judge

**What goes wrong:** Phase 131 calls `CostTracker("tier-1-eval")` for Tier 1 capture and `CostTracker("ragas-judge")` for judge cost. Both write into `evaluation/results/costs/`. If two `CostTracker` instances are constructed within the same UTC second, their filenames collide.
**Why it happens:** D-13 schema uses `{tier}-{filename_timestamp}.json` where `filename_timestamp` is YYYYMMDDTHHMMSSZ — second-precision.
**Mitigation:** **Use distinct `tier` strings** — `tier-1-eval`, `ragas-judge-tier-1`, etc. The first segment differentiates them; collision requires two `CostTracker(tier=X)` calls in the same second (rare but possible if Stage 1 + Stage 2 chain in <1s). Add a small post-construction sanity check: if `dest_dir / f"{tier}-{ts}.json"` already exists, append `-2`, `-3`, etc. **Cleaner alternative**: pass a unique `tier` string per logical grouping (e.g., `tier-1-eval-{question_id}` per-question — but that's 30 files per tier; messy). **Recommend: stick with one CostTracker per tier per harness invocation**, distinct tier strings for tier-cost vs judge-cost, accept second-resolution timestamps as sufficient.
**Warning signs:** A previous run's cost JSON gets overwritten silently.

### Pitfall 12: `evaluate()` Deprecation Warning Causes Test Failure

**What goes wrong:** RAGAS 0.4.x emits a `DeprecationWarning` from `evaluate()`. If the project's pytest config sets `filterwarnings = ["error"]`, the warning becomes an error and the smoke test fails.
**Why it happens:** Some teams configure pytest to escalate warnings to errors as a CI hygiene practice.
**Mitigation:** Verify `pyproject.toml`'s `[tool.pytest.ini_options]` does NOT set `filterwarnings = ["error"]`. Currently it only declares `markers = ["live: ..."]` — safe. If it ever changes, add `filterwarnings = ["ignore::DeprecationWarning:ragas.*"]` to scope the suppression.
**Warning signs:** Smoke test fails with `DeprecationWarning: evaluate() is deprecated` after an unrelated pytest config edit.

## Code Examples

### Example A — Minimal RAGAS Scoring with `evaluate()` (Pattern 1 + 2 + 6)

```python
# evaluation/harness/score.py — sketch
"""RAGAS scoring stage. Reads query logs → computes 3 metrics → persists.

Source: docs.ragas.io/en/stable/references/evaluate/
"""
from __future__ import annotations

import json
from pathlib import Path

import litellm
from ragas import evaluate, EvaluationDataset, SingleTurnSample
from ragas.metrics import faithfulness, answer_relevancy, context_precision
from ragas.llms import llm_factory
from ragas.embeddings.base import embedding_factory
from ragas.cost import get_token_usage_for_openai

from shared.cost_tracker import CostTracker
from evaluation.harness.records import EvalRecord, QueryLog


JUDGE_LLM_SLUG = "openrouter/google/gemini-2.5-flash"
JUDGE_EMB_SLUG = "openrouter/openai/text-embedding-3-small"
JUDGE_PRICING_KEY = "google/gemini-2.5-flash"  # PRICES key (no openrouter/ prefix)


def _golden_qa_index(path: Path = Path("evaluation/golden_qa.json")) -> dict[str, dict]:
    return {q["id"]: q for q in json.loads(path.read_text(encoding="utf-8"))}


def score_query_log(query_log_path: Path, out_path: Path) -> Path:
    log = QueryLog.parse_file(query_log_path)
    qa = _golden_qa_index()

    samples = []
    for rec in log.records:
        if not rec.retrieved_contexts:
            # Pitfall 2 — skip empty-context records, mark NaN downstream
            continue
        ref = qa[rec.question_id]["expected_answer"]
        samples.append(SingleTurnSample(
            user_input=rec.question,
            response=rec.answer,
            retrieved_contexts=rec.retrieved_contexts,
            reference=ref,
        ))

    dataset = EvaluationDataset(samples=samples)

    judge_llm = llm_factory(JUDGE_LLM_SLUG, provider="litellm", client=litellm.completion)
    judge_emb = embedding_factory("litellm", model=JUDGE_EMB_SLUG)

    result = evaluate(
        dataset=dataset,
        metrics=[faithfulness, answer_relevancy, context_precision],
        llm=judge_llm,
        embeddings=judge_emb,
        token_usage_parser=get_token_usage_for_openai,
        raise_exceptions=False,  # NaN on per-sample failure rather than abort
        show_progress=True,
    )

    # Persist judge cost via shared.cost_tracker (Pattern 2)
    tracker = CostTracker(f"ragas-judge-{log.tier}")
    usage = result.total_tokens()
    tracker.record_llm(JUDGE_PRICING_KEY, int(usage.input_tokens), int(usage.output_tokens))
    tracker.persist()

    # Persist metrics JSON
    df = result.to_pandas()  # ragas EvaluationResult exposes .to_pandas()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_json(out_path, orient="records", indent=2)
    return out_path
```

[CITED: docs.ragas.io/en/stable/references/evaluate/, docs.ragas.io/en/stable/howtos/customizations/customize_models/, docs.ragas.io/en/stable/concepts/components/eval_dataset/]

### Example B — Tier 3 Adapter with Context Probe (Pitfall 7 mitigation)

```python
# evaluation/harness/adapters/tier_3.py — sketch
import time
from lightrag import QueryParam

from shared.cost_tracker import CostTracker
from tier_3_graph.rag import build_rag, DEFAULT_LLM_MODEL, DEFAULT_EMBED_MODEL
from tier_3_graph.cost_adapter import CostAdapter
from evaluation.harness.records import EvalRecord


async def run_tier3(question: str, mode: str = "hybrid") -> EvalRecord:
    tracker = CostTracker("tier-3-eval")
    adapter = CostAdapter(tracker, DEFAULT_LLM_MODEL, DEFAULT_EMBED_MODEL)
    rag = build_rag(llm_token_tracker=adapter)
    await rag.initialize_storages()

    t0 = time.monotonic()
    # Pitfall 7 — separate context retrieval from answer generation
    context_str = await rag.aquery(question, param=QueryParam(mode=mode, only_need_context=True))
    # LightRAG separates chunks with documented delimiters; split conservatively
    contexts = [c.strip() for c in context_str.split("-----") if c.strip()]

    answer = await rag.aquery(question, param=QueryParam(mode=mode))
    latency = time.monotonic() - t0

    return EvalRecord(
        question_id="",  # set by caller
        question=question,
        answer=answer,
        retrieved_contexts=contexts,
        latency_s=latency,
        cost_usd_at_capture=tracker.total_usd(),
    )
```

[VERIFIED: lightrag-hku 1.4.15 `QueryParam(only_need_context=True)` from 129-RESEARCH Pattern 4]

### Example C — Comparison Markdown Emitter (Pattern 5)

```python
# evaluation/harness/compare.py — sketch
import json
from pathlib import Path

import numpy as np  # for np.nanmean


def aggregate_tier(tier: str, queries_dir: Path, costs_dir: Path, metrics_dir: Path) -> dict:
    # Latest query log (sort by mtime DESC, take first)
    query_log = sorted(queries_dir.glob(f"{tier}-*.json"), key=lambda p: p.stat().st_mtime, reverse=True)[0]
    cost_log = sorted(costs_dir.glob(f"{tier}-*.json"), key=lambda p: p.stat().st_mtime, reverse=True)[0]
    metric_log = sorted(metrics_dir.glob(f"{tier}-*.json"), key=lambda p: p.stat().st_mtime, reverse=True)[0]

    queries = json.loads(query_log.read_text())
    metrics = json.loads(metric_log.read_text())
    costs = json.loads(cost_log.read_text())

    latencies = [r["latency_s"] for r in queries["records"]]
    f_scores = [m["faithfulness"] for m in metrics if m.get("faithfulness") is not None]
    ar_scores = [m["answer_relevancy"] for m in metrics if m.get("answer_relevancy") is not None]
    cp_scores = [m["context_precision"] for m in metrics if m.get("context_precision") is not None]

    return {
        "tier": tier,
        "faithfulness": float(np.nanmean(f_scores)),
        "answer_relevancy": float(np.nanmean(ar_scores)),
        "context_precision": float(np.nanmean(cp_scores)),
        "mean_latency_s": float(np.mean(latencies)),
        "total_cost_usd": float(costs["totals"]["usd"]),
        "cost_per_query_usd": float(costs["totals"]["usd"]) / max(1, len(queries["records"])),
        "n": len(queries["records"]),
        "n_nan": sum(1 for m in metrics if m.get("faithfulness") is None),
    }


def emit_markdown(rows: list[dict]) -> str:
    lines = [
        "# RAG Tier Comparison — Phase 131",
        "",
        "## Tier Rollup",
        "",
        "| Tier | Faithfulness | Answer Relevancy | Context Precision | Mean Latency (s) | Total Cost (USD) | Cost / Query (USD) | n | n NaN |",
        "|------|--------------|------------------|-------------------|------------------|------------------|--------------------|---|-------|",
    ]
    for r in rows:
        lines.append(
            f"| {r['tier']} | {r['faithfulness']:.3f} | {r['answer_relevancy']:.3f} | "
            f"{r['context_precision']:.3f} | {r['mean_latency_s']:.2f} | "
            f"{r['total_cost_usd']:.6f} | {r['cost_per_query_usd']:.6f} | {r['n']} | {r['n_nan']} |"
        )
    return "\n".join(lines) + "\n"
```

## State of the Art

| Old Approach                           | Current Approach                                            | When Changed     | Impact                                                                        |
|----------------------------------------|-------------------------------------------------------------|------------------|-------------------------------------------------------------------------------|
| `LangchainLLMWrapper(ChatOpenAI(...))` | `llm_factory(slug, provider="litellm", client=...)`         | RAGAS 0.4 (2025) | Use new factory; old wrapper deprecated                                       |
| `from ragas.metrics import answer_relevancy` (sync `single_turn_ascore`) | `from ragas.metrics.collections import AnswerRelevancy` (async `ascore`) | RAGAS 0.4 (2025) | Both APIs work; legacy is documented + stable for v1                          |
| `evaluate()` bulk function             | `@experiment` decorator                                     | RAGAS 0.4 (2025) | `evaluate()` deprecated but functional; use it for v1                         |
| `ground_truths: list[str]`             | `reference: str`                                            | RAGAS 0.4 (2025) | Schema-breaking; document the rename in adapter code                          |
| `google-generativeai` SDK              | `google-genai` (unified SDK)                                | 2025-08 EOL      | Already migrated by Phase 127 — lockfile guard prevents regression            |
| Manual judge LLM HTTP calls            | `litellm.completion` via `provider="litellm"`               | RAGAS 0.4 (2025) | Single line of config swaps providers (OpenRouter / Vertex / Bedrock / etc.) |

**Deprecated/outdated:**
- `LangchainLLMWrapper` / `LangchainEmbeddingsWrapper` — replaced by `llm_factory` / `embedding_factory`.
- `evaluate(dataset=hf_dataset, ...)` with raw `datasets.Dataset` — `EvaluationDataset` is the new preferred shape (still accepts `Dataset`).

## Assumptions Log

| #  | Claim                                                                                                                                                                                                                  | Section                          | Risk if Wrong                                                                                                                       |
|----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| A1 | Judge cost ≈ $0.37 for full 30 × 5 × 3 eval at gemini-2.5-flash rates                                                                                                                                                  | User Constraints — Judge LLM     | Real cost may be 2-3× higher if RAGAS makes more internal calls than estimated (e.g. claim count > 7); validated empirically in Wave 0 |
| A2 | RAGAS 0.4.x's `evaluate(token_usage_parser=get_token_usage_for_openai, llm=llm_factory(... litellm ...))` correctly captures token usage when judge is OpenRouter-routed Gemini Flash                                | Pattern 2                        | If `get_token_usage_for_openai` only handles native-OpenAI usage shape, judge cost lands as 0; need a custom parser. Verify in smoke test |
| A3 | LightRAG 1.4.15's `aquery(param=QueryParam(only_need_context=True))` returns concatenated context separable on `-----` delimiter                                                                                       | Pitfall 7, Example B             | If LightRAG's separator differs (e.g. `\n---\n` or no delimiter), `retrieved_contexts` ends up as one giant string; RAGAS still works but context_precision degrades. Check empirically |
| A4 | RAGAS metric calls (`faithfulness`, `answer_relevancy`, `context_precision`) handle async-internal correctly when called from `evaluate()` inside an outer `asyncio.run(amain(...))`                                | Pitfall 5                        | If nested-asyncio fails, must restructure harness to call score in a separate process. RAGAS docs claim `allow_nest_asyncio=True` solves it; verify in smoke test |
| A5 | Tier 4's user-generated query log (cached mode) will have the same `EvalRecord` schema as the harness produces                                                                                                          | Pattern 8                        | If user runs Tier 4 manually and produces a different shape, harness breaks. Mitigate: ship a `tier-4-multimodal/scripts/eval_capture.py` that produces the canonical shape |
| A6 | RAGAS `EvaluationResult.to_pandas()` exists in 0.4.3                                                                                                                                                                    | Example A                        | If the method was renamed, swap to manual `result.scores` dict iteration. Tested in smoke test                                       |
| A7 | The harness venv (with `[evaluation,tier-1,tier-2,tier-3,tier-5]` extras) does not have a transitive conflict between `lightrag-hku==1.4.15`, `openai-agents==0.14.6`, `ragas>=0.4.3`, and the existing `[shared]` deps | Pattern 10                       | If conflict, must split into multiple venvs (eval venv vs tier venv) and add subprocess boundaries. Verify with `uv lock` in Plan 01 |
| A8 | `OPENROUTER_API_KEY` alone is sufficient for the entire Phase 131 live run (judge LLM + embedder routed via LiteLLM)                                                                                                   | User Constraints — Live env       | If LiteLLM's embedder route doesn't accept `openrouter/openai/text-embedding-3-small`, fall back to direct `openai` SDK with OpenRouter base URL (already used by Tier 1) |
| A9 | Multi-hop ≡ cross-document for our golden_qa.json corpus (verified by `test_multi_hop_has_multiple_papers` in 127-06-SUMMARY); EVAL-01 satisfied without expansion                                                       | User Constraints / Pattern 9     | If reviewer disagrees that multi-hop ≡ cross-document, add 5+ explicit "cross-document" entries (deferred per User Constraints; would need re-authoring discipline) |
| A10 | RAGAS judge LLM call count per metric is approximately 1-3 for faithfulness, 1+K for answer_relevancy (K alt-questions), 1 per chunk for context_precision                                                              | Pitfall 3                        | Empirical bound; if calls are 5-10× higher, full-run cost may exceed $2. Check during smoke run                                       |

**Per-claim sources:** A1, A3, A6, A8, A10 are inferences from documented behavior (training data + cited docs) that need empirical confirmation in Wave 0. A2 is supported by [CITED: docs.ragas.io _cost/] but the OpenRouter-via-LiteLLM combination specifically is unverified. A4, A7, A9 are evidence-backed but not directly tested in this research session.

## Open Questions

1. **Does `get_token_usage_for_openai` parse OpenRouter-routed responses correctly?**
   - What we know: RAGAS exposes `get_token_usage_for_openai` (a `TokenUsageParser`); OpenRouter returns OpenAI-compatible response shape (Tier 1's `chat.complete` already extracts `usage.{prompt,completion}_tokens` from OpenRouter responses without modification).
   - What's unclear: Does the parser key on response provider (`openai-only`) or response shape (any OpenAI-compatible)?
   - Recommendation: **Plan 01 Wave-0 task** — add a 1-question smoke test that runs `evaluate(... token_usage_parser=get_token_usage_for_openai)` against an OpenRouter judge and asserts `result.total_tokens().input_tokens > 0`. If it fails, write a tiny custom parser (~15 lines reading `litellm.Response.usage`) and document.

2. **Is RAGAS's `evaluate()` call concurrent enough to need `batch_size`?**
   - What we know: Default behavior is async-concurrent; OpenRouter rate limits gemini-2.5-flash at ~600 RPM per key.
   - What's unclear: The exact concurrency RAGAS uses by default.
   - Recommendation: Set `batch_size=10` explicitly in Stage 2 to bound concurrency; document. Empirically verify zero 429s in the smoke test.

3. **Tier 4 cached mode — what does the user produce locally?**
   - What we know: Phase 130 SC-1 deferred Tier 4 live test to user; no Tier 4 query JSON exists yet.
   - What's unclear: Whether the user's local Tier 4 run emits a JSON in our `EvalRecord` shape or just markdown.
   - Recommendation: **Plan 03** ships `tier-4-multimodal/scripts/eval_capture.py` (loops golden_qa, drives `tier_4_multimodal.query.run_query`, persists `evaluation/results/queries/tier-4-{timestamp}.json`). User runs this once locally; harness Stage 2 reads the file.

4. **Should the judge LLM differ from the answer LLM to avoid self-grading bias?**
   - What we know: Self-grading (judge LLM = answer LLM) introduces a known bias (LLMs prefer their own outputs). Tier 2 uses `gemini-2.5-flash`; Tier 3/4 use `google/gemini-2.5-flash` via OpenRouter.
   - What's unclear: For Phase 131's narrative honesty, would a different judge (e.g. `anthropic/claude-haiku-4.5`) produce more credible scores?
   - Recommendation: Document the judge model in the comparison footer ("Judge: gemini-2.5-flash via OpenRouter") so readers can audit. **Use gemini-flash for v1** — narrative continuity outweighs the small self-grading bias on a 30-question set. Phase 133 may discuss the bias explicitly.

5. **Should `comparison.md` be committed to git?**
   - What we know: `evaluation/results/costs/` is currently NOT gitignored — Phase 128's live test JSON IS committed. `commit_docs: true` in `.planning/config.json`.
   - What's unclear: Whether `comparison.md` (regenerable from the JSONs) belongs in git or in `.gitignore`.
   - Recommendation: **Commit `comparison.md`** (it's the artifact Phase 133 imports; gating it on a re-run before publishing is fine). **Gitignore the `results/queries/` and `results/metrics/` directories?** Probably YES — they're intermediate; `comparison.md` is the public face. Plan 01 `.gitignore` task to confirm.

6. **Does ragas ≥ 0.4.3 fully drop google-generativeai?**
   - What we know: `requires_dist` excludes it [VERIFIED]; `langchain-community` 0.4.1 also excludes it [VERIFIED].
   - What's unclear: Whether `langchain-openai` or `litellm` transitively pulls a `langchain-google-genai` extra unexpectedly.
   - Recommendation: Plan 01 `uv lock` task → re-run `pytest tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk` IMMEDIATELY after lock. If it fails, pin the offending dep.

## Recommendations Summary (Planner-Ready)

- **Two-stage harness:** Stage 1 captures per-tier query logs (live); Stage 2 scores with RAGAS (offline-replayable); Stage 3 emits comparison.md.
- **Library-first adapters; subprocess fallback for Tier 4** (which is dual-mode: cached primary, subprocess fallback).
- **Pin RAGAS at `>=0.4.3,<0.5`**; use legacy `evaluate()` API + `ragas.metrics.{faithfulness, answer_relevancy, context_precision}` (the well-documented stable path).
- **Judge LLM:** `openrouter/google/gemini-2.5-flash` via `litellm.completion`. **Embedder:** `openrouter/openai/text-embedding-3-small`. Both already in `shared.pricing.PRICES` — no edits.
- **Cost via existing `shared.cost_tracker`**: `CostTracker("tier-{N}-eval")` for tier capture; `CostTracker("ragas-judge-{tier}")` for judge cost. D-13 schema unchanged.
- **Latency lives on `EvalRecord`** in `evaluation/results/queries/{tier}-{timestamp}.json` — separate from costs JSON.
- **Comparison output**: single `evaluation/results/comparison.md` with TWO tables (tier rollup + per-class rollup). Phase 133 imports verbatim.
- **Pyproject `[evaluation]` extra** (additive); `[evaluation]` does NOT depend on any `[tier-N]`. After lock, re-run `tests/test_tier_requirements.py` lockfile guard.
- **3 test files** under `evaluation/tests/`: `test_eval_records.py` (non-live), `test_compare.py` (non-live), `test_eval_smoke_live.py` (`@pytest.mark.live`, 1 tier × 1 question).
- **Live test recipe** = Phase 128/129/130 SOCKS5+socksio recipe verbatim (Pattern 11). RAGAS is httpx-under-the-hood via LiteLLM, same proxy, same socksio.
- **NaN handling** (Pitfall 2 / 8): record `nan_reason`; `numpy.nanmean` aggregation; `n_NaN` in comparison footer.
- **Cross-document EVAL-01**: existing 10 multi-hop entries already cite ≥2 papers; document equivalence; do NOT add a separate bucket.
- **Tier 4** stays deferred per Phase 130 SC-1 — harness handles missing tier 4 query log gracefully (footer note in comparison.md).

## Sources

### Primary (HIGH confidence)
- [VERIFIED: PyPI](https://pypi.org/pypi/ragas/json) — RAGAS latest stable: 0.4.3; dependencies confirm no `google-generativeai`. Fetched 2026-04-27.
- [VERIFIED: PyPI](https://pypi.org/pypi/ragas/0.4.3/json) — RAGAS 0.4.3 `requires_dist` enumerated; OpenAI ≥1.0.0, langchain ecosystem unpinned.
- [VERIFIED: PyPI](https://pypi.org/pypi/langchain-community/0.4.1/json) — langchain-community 0.4.1 `requires_dist` excludes `google-generativeai`.
- [CITED: docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/) — Faithfulness metric API + signature.
- [CITED: docs.ragas.io/en/stable/concepts/metrics/available_metrics/answer_relevance/](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/answer_relevance/) — AnswerRelevancy metric API + embedder requirement.
- [CITED: docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/) — `LLMContextPrecisionWithReference` vs `WithoutReference`.
- [CITED: docs.ragas.io/en/stable/references/evaluate/](https://docs.ragas.io/en/stable/references/evaluate/) — `evaluate()` signature + parameters; deprecation notice.
- [CITED: docs.ragas.io/en/stable/howtos/migrations/migrate_from_v03_to_v04/](https://docs.ragas.io/en/stable/howtos/migrations/migrate_from_v03_to_v04/) — v0.3 → v0.4 migration: deprecated `LangchainLLMWrapper`, deprecated `evaluate()`, `ground_truths` → `reference`.
- [CITED: docs.ragas.io/en/stable/howtos/customizations/customize_models/](https://docs.ragas.io/en/stable/howtos/customizations/customize_models/) — `llm_factory(provider="litellm")` for Azure/Vertex/Bedrock; same pattern for OpenRouter.
- [VERIFIED via WebSearch + secondary corroboration]: `ragas.cost.get_token_usage_for_openai`, `result.total_tokens()`, `result.total_cost(...)` — token usage parser API.

### Secondary (MEDIUM confidence)
- Phase 127-06 SUMMARY (`.planning/phases/127-repository-skeleton-enterprise-dataset/127-06-SUMMARY.md`) — golden_qa.json schema, 10/10/10/0 split rationale, multi-hop citation chain discipline.
- Phase 128 RESEARCH (`.planning/phases/128-tier-1-naive-rag/128-RESEARCH.md`) — Tier 1 surface (`tier_1_naive.{retrieve,chat,store,embed_openai}`).
- Phase 129 RESEARCH (`.planning/phases/129-tiers-2-3-managed-graph-rag/129-RESEARCH.md`) — Tier 2/3 surface, OpenRouter+SOCKS5+socksio recipe, LightRAG `only_need_context=True` pattern.
- Phase 130 RESEARCH (`.planning/phases/130-tiers-4-5-multimodal-agentic-rag/130-RESEARCH.md`) — Tier 4 chunk shape (Pitfall 7), Tier 5 `MaxTurnsExceeded` semantics, judge cost vs Tier-5 per-turn cost shape.
- Phase 130-06 SUMMARY (`.planning/phases/130-tiers-4-5-multimodal-agentic-rag/130-06-SUMMARY.md`) — Tier 5 live PASSED in-sandbox 2026-04-27; SOCKS5+socksio recipe verified for OpenRouter HTTP traffic; empirical Tier 5 empty-context behavior.
- Companion repo `pyproject.toml`, `shared/cost_tracker.py`, `shared/pricing.py` — D-13 frozen schemas, PRICES table contents.

### Tertiary (LOW confidence — flagged for Wave 0 verification)
- A2 (token_usage_parser correctly handles OpenRouter responses) — needs smoke test verification.
- A3 (LightRAG context separator is `-----`) — needs empirical check on Tier 3 output.
- A6 (`EvaluationResult.to_pandas()` exists in 0.4.3) — needs smoke test verification.

## Environment Availability

| Dependency                                      | Required By                       | Available | Version          | Fallback                                                                |
|-------------------------------------------------|-----------------------------------|-----------|------------------|-------------------------------------------------------------------------|
| Python 3.13 (sandbox)                           | All harness code                  | ✓         | 3.13.1           | —                                                                        |
| `uv` package manager                            | Plan 01 lock + install            | ✓         | per repo conv.   | `pip install` fallback                                                   |
| OpenRouter API key in `.env`                    | Stage 1 (Tiers 1, 3, 5) + Stage 2 | ✓         | (.env present)   | —                                                                        |
| `GEMINI_API_KEY` in `.env`                      | Stage 1 (Tier 2 only)             | ✓         | (.env present)   | —                                                                        |
| Tier 1 `chroma_db/tier-1-naive/` populated      | Tier 1 + Tier 5 adapters          | ?         | TBD              | `python tier-1-naive/main.py --ingest` — documented prereq               |
| Tier 2 Gemini File Search store populated       | Tier 2 adapter                    | ?         | TBD              | `python tier-2-managed/main.py --ingest`                                |
| Tier 3 `lightrag_storage/tier-3-graph/` populated | Tier 3 adapter                  | ?         | TBD              | `python tier-3-graph/main.py --ingest --yes`                            |
| Tier 4 `rag_anything_storage/tier-4-multimodal/` populated | Tier 4 adapter (cached mode) | ✗ (deferred) | —          | User runs Tier 4 locally + ships `evaluation/results/queries/tier-4-*.json` |
| `socksio` in venv                               | Live in-sandbox runs              | ?         | 1.0.0 (Tier 5 confirmed) | `uv pip install socksio` (sandbox patch, NOT in pyproject.toml)         |
| SOCKS5 proxy `localhost:61994`                  | Live in-sandbox runs              | ?         | (env-dependent)  | Run live tests outside sandbox (e.g. user's local machine)              |
| `ragas==0.4.3`                                  | Stage 2                           | ✗         | not installed    | `uv pip install -e ".[evaluation]"` (Plan 01 task)                       |

**Missing dependencies with no fallback:**
- None blocking — all are install-time tasks in Plan 01 or pre-existing artifacts from prior phases.

**Missing dependencies with fallback:**
- Each tier's persisted index (chroma / lightrag / file-search-store / rag_anything_storage) — fallback is to run that tier's `--ingest` first; documented in `evaluation/README.md`.
- Tier 4 query log — fallback is cached mode (Pattern 8); user runs locally.
- `socksio` — sandbox patch; documented.

## Validation Architecture

### Test Framework
| Property             | Value                                                                                  |
|----------------------|----------------------------------------------------------------------------------------|
| Framework            | pytest 8.4.2                                                                           |
| Config file          | `pyproject.toml` `[tool.pytest.ini_options]`                                            |
| Quick run command    | `uv run --extra evaluation --extra tier-1 pytest evaluation/tests/test_eval_records.py evaluation/tests/test_compare.py -x` |
| Full suite command   | `uv run --extra evaluation --extra tier-1 --extra tier-2 --extra tier-3 --extra tier-5 pytest evaluation/tests -v` |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                          | Test Type   | Automated Command                                                        | File Exists?       |
|---------|-----------------------------------------------------------------------------------|-------------|--------------------------------------------------------------------------|--------------------|
| EVAL-01 | golden_qa.json has 30 entries, ≥10 multi-hop with ≥2 source_papers (cross-doc)    | unit        | `pytest tests/test_golden_qa.py -x`                                       | ✅ existing         |
| EVAL-02 | RAGAS 3 metrics computed end-to-end on 1 tier × 1 question (live)                 | smoke (live)| `pytest evaluation/tests/test_eval_smoke_live.py -m live -x`              | ❌ Wave 0           |
| EVAL-03 | Per-tier cost JSON + per-query latency persisted; comparison.md emits the columns | unit        | `pytest evaluation/tests/test_compare.py -x`                              | ❌ Wave 0           |
| EVAL-04 | comparison.md emits 2 tables (tier rollup + class rollup) with correct columns/rounding | unit | `pytest evaluation/tests/test_compare.py::test_emit_two_tables -x`         | ❌ Wave 0           |

### Sampling Rate
- **Per task commit:** `pytest evaluation/tests/test_eval_records.py evaluation/tests/test_compare.py -x` (~5 sec, no live calls).
- **Per wave merge:** `pytest evaluation/tests -v` (~30 sec without `-m live`; ~60 sec with `-m live` and one tier configured).
- **Phase gate:** Full suite green, ALL tier query logs present (Tier 4 cached log MUST exist before phase gate, supplied by user).

### Wave 0 Gaps
- [ ] `evaluation/tests/conftest.py` — `live_eval_keys_ok`, `tier1_index_present` (mirror Tier 5 pattern); repo-root `sys.path` bootstrap; `load_dotenv` from repo root.
- [ ] `evaluation/tests/test_eval_records.py` — `EvalRecord` Pydantic schema + roundtrip + `QueryLog.write/read`.
- [ ] `evaluation/tests/test_compare.py` — emitter renders 2 tables; rounding rules; class rollup row count = 3 × 5 = 15.
- [ ] `evaluation/tests/test_eval_smoke_live.py` — 1 tier × 1 question end-to-end; assertions per Pattern 12.
- [ ] `[evaluation]` extra in `pyproject.toml` (Plan 01 install).
- [ ] `evaluation/harness/__init__.py` — empty; package marker.

*(Once Wave 0 lands: re-run `pytest tests/test_tier_requirements.py::test_lockfile_does_not_contain_deprecated_sdk` to confirm `uv.lock` post-evaluation-extra still excludes `google-generativeai`.)*

## Metadata

**Confidence breakdown:**
- Standard stack (RAGAS 0.4.x): HIGH — version verified on PyPI 2026-04-27; metric APIs cited from current docs.ragas.io.
- Architecture (two-stage harness, library-first adapters): HIGH — direct extension of Phase 128-130 patterns (cost tracker, async-boundary, sub-second latency capture). All tier surfaces verified by reading the actual companion-repo files.
- Judge LLM wiring (LiteLLM via OpenRouter): MEDIUM — same proxy/socksio path Tier 5 proved 2026-04-27; LiteLLM-via-RAGAS specifically unverified end-to-end (A2).
- Pitfalls (12 total): HIGH on Pitfalls 1, 4, 9 (well-documented in upstream sources); MEDIUM on Pitfalls 2, 3, 5, 7, 8, 11, 12 (extrapolated from Phase 128-130 hard-won lessons + RAGAS docs); LOW on Pitfall 10 (phantom concern, included for completeness).
- Tier 4 dual-mode (cached + subprocess): MEDIUM — pattern is sound, but tier-4-multimodal/scripts/eval_capture.py needs to ship in Plan 03; user-side compliance for cached log shape is an open dependency.

**Research date:** 2026-04-27
**Valid until:** ~2026-05-27 for the RAGAS surface (1 month — RAGAS is fast-moving; v0.5 may ship); valid through Phase 131 completion for everything else (Phase 127-130 outputs are locked).

## RESEARCH COMPLETE

**Phase:** 131 - Evaluation Harness
**Confidence:** HIGH

### Key Findings
- RAGAS 0.4.3 is the current stable version; legacy `evaluate(...)` + `ragas.metrics.{faithfulness, answer_relevancy, context_precision}` is the well-documented stable path. New `ragas.metrics.collections.*` API and `@experiment` decorator exist but are less documented; defer.
- Judge LLM wiring via `llm_factory(provider="litellm", client=litellm.completion)` lets us route to OpenRouter using Phase 128/129/130's proven SOCKS5+socksio recipe. Same `OPENROUTER_API_KEY`. No new secrets.
- `ragas==0.4.3` and `langchain-community==0.4.1` `requires_dist` BOTH exclude `google-generativeai` [VERIFIED]. Lockfile guard in `tests/test_tier_requirements.py` is safe; Plan 01 must re-run after `uv lock`.
- Two-stage architecture (capture-then-score) lets RAGAS scoring re-run independently of tier inference — judge prompt changes or 4th metric experiments don't re-pay tier costs.
- Tier 4 stays deferred per Phase 130 SC-1; harness is dual-mode (cached primary, subprocess fallback). User produces Tier 4 query log locally; `tier-4-multimodal/scripts/eval_capture.py` ships in Plan 03 to standardize the shape.
- Empty contexts (Tier 5 declined retrieval) and `MaxTurnsExceeded` (Tier 5 truncation) MUST yield `nan_reason` records, NOT zero scores. `np.nanmean` aggregates honestly. Comparison footer surfaces `n_NaN` per tier.

### File Created
`/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/phases/131-evaluation-harness/131-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack (RAGAS 0.4.x) | HIGH | Version, deps, and metric APIs all verified against current PyPI + docs.ragas.io. |
| Architecture (two-stage harness, per-tier adapters) | HIGH | Direct extension of Phase 128-130 patterns; tier surfaces verified by reading companion-repo files. |
| Pitfalls (12 named + mitigations) | MEDIUM-HIGH | 1, 4, 9 well-grounded; 2, 3, 5, 7, 8, 11, 12 extrapolated from hard-won Phase 128-130 lessons. |
| Judge cost ballpark (~$0.37/run) | MEDIUM | Estimate based on per-call envelope × assumed metric internal-call counts; needs Wave 0 empirical confirmation. |
| Tier 4 dual-mode | MEDIUM | Pattern sound; user-side compliance for cached log shape requires `eval_capture.py` to ship in Plan 03. |

### Open Questions (full list in document above)
1. Does `get_token_usage_for_openai` parse OpenRouter responses correctly? → Wave 0 smoke test.
2. RAGAS `evaluate()` concurrency — set `batch_size=10`? → empirical.
3. Tier 4 cached-mode shape — ship `eval_capture.py` in Plan 03.
4. Self-grading bias — document judge model in comparison footer; live with `gemini-flash` for v1.
5. `comparison.md` git policy — recommend commit; gitignore `queries/` and `metrics/` directories.
6. ragas transitive lockfile risk → re-run `test_lockfile_does_not_contain_deprecated_sdk` post-`uv lock`.

### Ready for Planning
Research complete. Planner can now create PLAN.md files. Recommended plan structure:
- **Plan 01** — `[evaluation]` pyproject extra + lockfile-guard re-run + `EvalRecord` schema + `evaluation/tests/conftest.py` (Wave 0 foundation).
- **Plan 02** — Per-tier adapters (Tier 1, 2, 3, 5) with library-first contract.
- **Plan 03** — Tier 4 dual-mode adapter + `tier-4-multimodal/scripts/eval_capture.py` (the user's local-run helper).
- **Plan 04** — Stage 1 `harness/run.py` + per-tier query log persistence (live capture for in-sandbox tiers).
- **Plan 05** — Stage 2 `harness/score.py` + RAGAS judge wiring + judge-cost via shared.cost_tracker.
- **Plan 06** — Stage 3 `harness/compare.py` + `comparison.md` emitter + class rollup table.
- **Plan 07** — `evaluation/README.md` (live recipe, cost envelope) + `@pytest.mark.live` smoke test (1 tier × 1 question) + Phase 131 close-out.
