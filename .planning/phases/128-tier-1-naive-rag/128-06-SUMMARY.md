---
phase: 128-tier-1-naive-rag
plan: 06
type: pivot
status: complete
completed: 2026-04-26
companion_repo_head: fe06e84
---

# Plan 128-06 Summary — Migrate Tier 1 to OpenRouter

## Why this plan exists

Mid-phase pivot. The user requested a change from direct OpenAI (embeddings) +
direct Gemini (chat) to a single OpenRouter unified gateway. Web search
verified that OpenRouter has a first-class embeddings API (in addition to
chat) and that the OpenAI Python SDK is fully compatible when pointed at
`https://openrouter.ai/api/v1` — confirming the user's hypothesis. This
unblocks:

- **Single key** for the whole tier (`OPENROUTER_API_KEY`).
- **Selectable chat model** via `--model` (`anthropic/claude-haiku-4.5`,
  `openai/gpt-4o-mini`, etc.) — useful for the blog narrative comparing
  models on the same RAG pipeline.
- **Phase 127 contracts preserved** — `shared/llm.py` and
  `shared/embeddings.py` (Gemini-only) untouched; OpenRouter usage is
  isolated to two tier-local modules.

## Files changed (companion repo `rag-architecture-patterns`)

| File | Kind | Purpose |
|------|------|---------|
| `shared/config.py` | mod | Add `openrouter_api_key: SecretStr \| None` field (optional at validation time so Phase 127 smoke test still imports cleanly) |
| `shared/pricing.py` | mod | Add OpenRouter slugs: `openai/text-embedding-3-small`, `openai/{text-embedding-3-large,gpt-4o,gpt-4o-mini}`, `google/gemini-2.5-{flash,pro}`, `anthropic/claude-{haiku,sonnet}-4.5` |
| `.env.example` | mod | Document `OPENROUTER_API_KEY` as REQUIRED for Tier 1+; reframe `GEMINI_API_KEY` as legacy direct-Gemini path; demote `OPENAI_API_KEY` to OPTIONAL |
| `.env` | mod | Mirror the new comment block (gitignored; values preserved) |
| `tier-1-naive/embed_openai.py` | rewrite | Repoint OpenAI SDK at OpenRouter base URL with `OPENROUTER_API_KEY`; embed model now `openai/text-embedding-3-small` (same 1536-dim, ChromaDB index unchanged); filename + factory name retained for caller compatibility |
| `tier-1-naive/chat.py` | new | OpenRouter chat completion via OpenAI SDK; `ChatResponse` dataclass mirrors `LLMResponse` shape; `DEFAULT_CHAT_MODEL = "google/gemini-2.5-flash"` for narrative continuity |
| `tier_1_naive/__init__.py` | mod | Register the new `chat` submodule in the importable shim |
| `tier-1-naive/main.py` | mod | Drop `shared.llm` import; wire `chat_complete()` instead of `get_llm_client()`; add `--model` flag; replace `OPENAI_API_KEY=None` startup guard with `OPENROUTER_API_KEY=None`; thread model through `cmd_query`; pass `console_override=console` to `render_query_result` (fixes a pre-existing bug Plan 128-05 missed because the live test never ran) |
| `tier-1-naive/tests/conftest.py` | mod | `tier1_live_keys` now requires only `OPENROUTER_API_KEY`; inject repo root onto `sys.path` so `from tier_1_naive import main` resolves in pytest's process |
| `tier-1-naive/tests/test_main_live.py` | mod | Pass `model=DEFAULT_CHAT_MODEL` through to `cmd_query`; update docstring + assertion message |
| `tier-1-naive/README.md` | mod | Sub-title now reads "OpenRouter unified gateway"; Quickstart documents single-key setup + `--model` swap; CLI reference adds `--model` row; cost table compares 3 chat models; architecture diagram updated |
| `tests/test_env_example.py` | mod | New trace test: `test_env_example_documents_openrouter_api_key` |

## Commits (all pushed to `origin/main`)

| SHA | Message |
|-----|---------|
| `0b31e24` | `deps(128-06): add OPENROUTER_API_KEY + OpenRouter model pricing` |
| `8ecb402` | `feat(128-06): route Tier 1 chat + embeddings through OpenRouter` |
| `b49f093` | `test(128-06): adapt Tier 1 live e2e test to OpenRouter single-key gate` |
| `fe06e84` | `docs(128-06): update Tier 1 README for OpenRouter routing + --model flag` |

## Verification — live test PASSED

```
.venv/bin/pytest tier-1-naive/tests/test_main_live.py -m live -v
======================== 1 passed, 5 warnings in 8.04s =========================
```

- 42 chunks ingested across 2 papers
- Query through `google/gemini-2.5-flash` (default `--model`)
- Cost: **$0.001379** (input_tokens=2914, output_tokens=61)
- Latency: **4.08s**
- Cost JSON written to `evaluation/results/costs/tier-1-test-<timestamp>.json`

All 3 ROADMAP Phase 128 must-haves now empirically verified (not just
statically verified):

1. ✓ `python tier-1-naive/main.py` ingests + answers a sample query end-to-end
2. ✓ ChromaDB index persists to `chroma_db/tier-1-naive/` and is re-readable
3. ✓ Cost (`Cost: $0.001379`) and latency (`Latency: 4.08s`) printed for the query

## Non-live regression check

```
62 passed, 2 skipped, 5 deselected, 5 warnings in 1.20s
```

(+1 vs Plan 128-05 from the new `test_env_example_documents_openrouter_api_key`.)

## Deviations from the proposed scope

None substantive. Two minor adjustments during execution:

1. **`embed_openai.py` filename retained** rather than renamed to `embed.py`.
   Rationale: minimize churn in the importable shim and existing SUMMARYs;
   the docstring now explains the OpenRouter routing.
2. **Pre-existing console-routing bug fixed inline** — `cmd_query` was
   calling `render_query_result()` without `console_override`, so the
   "Cost:" line went to `shared.display`'s module-level `Console` (stdout)
   instead of the test-recorded console. Plan 128-05 missed this because
   the live test never ran. Fix landed in commit `8ecb402`.

## Out of scope (left as-is)

- `dataset/manifests/metadata.json` — pre-existing untracked timestamp diff
  from Plan 128-04 (a runtime artifact of `build_metadata.py`); left
  untouched per scope-boundary rule.
- `shared/llm.py` and `shared/embeddings.py` — Phase 127 Gemini-only
  contracts preserved. Future tiers may migrate to OpenRouter on a per-tier
  basis.
- Sandbox-specific `socksio` install for SOCKS5 proxy support (only needed
  when running the live test in this CC sandbox; user's local machine
  doesn't need it because `ALL_PROXY` is unset there).
