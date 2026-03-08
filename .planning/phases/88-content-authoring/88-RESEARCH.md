# Phase 88: Content Authoring - Research

**Researched:** 2026-03-08
**Domain:** MDX content authoring for 11 FastAPI production guide domain pages with embedded components, code snippets, and AI agent narrative
**Confidence:** HIGH

## Summary

Phase 88 is a content authoring phase, not a technical infrastructure phase. All infrastructure is already built: the content collection pipeline (Phase 85), the layout and navigation system (Phase 86), and the reusable components -- CodeFromRepo, SVG diagram wrappers, and React Flow deployment topology (Phase 87). The work is writing 11 MDX files, each covering one production concern from the fastapi-template repository.

The content source material is the fastapi-template repository at `/Users/patrykattc/work/git/fastapi-template/`. This is a private repository owned by the same author. Every domain page must explain the production concern, reference specific source files via CodeFromRepo, embed the appropriate diagram (4 of the 11 pages have diagrams), and frame the content through the AI agent narrative lens (AGENT-01 opener + AGENT-02 closer per page). The existing stub MDX at `00-builder-pattern.mdx` shows the frontmatter pattern. The existing EDA case study MDX pages (e.g., ceramic-strength.mdx at 390+ lines) demonstrate the depth and style expected for data-rich technical content with embedded components.

A critical blocker exists: the fastapi-template repository has NO tags. The CodeFromRepo component hardcodes `versionTag: "v1.0.0"` and constructs GitHub URLs using this tag. The tag must be created before "View source" links will work in production. However, MDX content can be authored before the tag exists since CodeFromRepo renders the code snippets correctly regardless -- only the external links will 404 until the tag is created.

**Primary recommendation:** Author each MDX page as a self-contained chapter referencing the actual fastapi-template source code, using CodeFromRepo for code snippets and importing diagram components where specified. Follow the existing EDA MDX depth/style. Group pages into 3-4 plans by natural domain affinity to keep individual plans manageable.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAGE-01 | Builder Pattern page: FastAPIAppBuilder, setup_*() composition, factory function | Source: `src/app/app_builder.py` (347 lines), `src/app/__init__.py` (create_app factory), `main.py`. Diagram: BuilderPatternDiagram.astro |
| PAGE-02 | Authentication page: 3-mode JWT validation (shared secret, static key, JWKS) | Source: `src/app/auth/service.py` (254 lines), `src/app/auth/dependencies.py`, `src/app/auth/models.py`. Diagram: JwtAuthFlowDiagram.astro |
| PAGE-03 | Middleware page: 6 raw ASGI middlewares, ordering, why not BaseHTTPMiddleware | Source: `src/app/middleware/*.py` (6 files, ~383 lines total), `app_builder.py` setup_middleware(). Diagram: MiddlewareStackDiagram.astro |
| PAGE-04 | Observability page: OpenTelemetry, Prometheus metrics, structured JSON logging | Source: `src/app/observability/tracing.py`, `src/app/log_config/`, `src/app/logging_setup.py`, app_builder.py setup_tracing()/setup_metrics()/setup_logging() |
| PAGE-05 | Database page: async SQLAlchemy, Alembic migrations, multi-backend support | Source: `src/app/db/engine.py`, `src/app/db/session.py`, `src/app/settings.py` (database settings), `alembic/` |
| PAGE-06 | Docker page: multi-stage builds, tini, unprivileged user, digest-pinned images | Source: `Dockerfile` (90 lines), `docker-compose*.yml`, `ops/docker-entrypoint.sh`. Diagram: DeploymentTopology (React Flow) |
| PAGE-07 | Testing page: unit/integration architecture, hermetic helpers, 98%+ coverage | Source: `tests/` directory structure, `tests/conftest.py`, `tests/helpers.py`, `pyproject.toml` (pytest config) |
| PAGE-08 | Health Checks page: readiness vs liveness separation, dependency-aware registry | Source: `src/app/readiness/registry.py`, `src/app/routes/health.py`, `src/app/db/health.py`, `src/app/cache/health.py` |
| PAGE-09 | Security Headers page: HSTS, CSP, permissions policy, trusted hosts | Source: `src/app/middleware/security_headers.py` (69 lines), `src/app/settings.py` (security_* fields) |
| PAGE-10 | Rate Limiting page: fixed-window algorithm, memory/Redis backends, proxy trust | Source: `src/app/middleware/rate_limit.py` (205 lines), `src/app/settings.py` (rate_limit_* fields) |
| PAGE-11 | Caching page: optional memory/Redis cache layer with per-key TTL | Source: `src/app/cache/store.py` (148 lines), `src/app/cache/dependencies.py`, `src/app/settings.py` (cache_* fields) |
| AGENT-01 | Each domain page opens with what the AI agent inherits | Pattern: 2-3 sentence opening section per page explaining what production concern is already handled |
| AGENT-02 | Each domain page closes with summary of what the agent never needs to implement | Pattern: bullet list closing section per page summarizing what the template handles so the agent does not |
| AGENT-03 | Landing page hero frames template as "production concerns handled" | ALREADY COMPLETE (Phase 86) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 | Static site framework / MDX rendering | Already installed, content pipeline operational |
| @astrojs/mdx | 4.3.13 | MDX support for content collections | Already installed, enables component imports in MDX |
| astro-expressive-code | 0.41.6 | Syntax highlighting for fenced code blocks in MDX | Already integrated, handles Python/YAML/Dockerfile highlighting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CodeFromRepo.astro | N/A (project component) | Code snippets with GitHub source links | Every code excerpt from fastapi-template |
| MiddlewareStackDiagram.astro | N/A (project component) | DIAG-01 SVG | PAGE-03 (Middleware) |
| BuilderPatternDiagram.astro | N/A (project component) | DIAG-02 SVG | PAGE-01 (Builder Pattern) |
| JwtAuthFlowDiagram.astro | N/A (project component) | DIAG-03 SVG | PAGE-02 (Authentication) |
| DeploymentTopology.tsx | N/A (project component) | DIAG-04 React Flow | PAGE-06 (Docker) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CodeFromRepo for all snippets | Standard MDX fenced code blocks | Fenced blocks lack source attribution and GitHub links; CodeFromRepo is purpose-built for this guide |
| Importing components in MDX | Passing content via slots from [slug].astro | MDX component imports are the standard Astro pattern; slot-based approach would require per-page logic in [slug].astro |

**Installation:**
```bash
# No new packages needed -- all infrastructure already built in Phases 85-87
```

## Architecture Patterns

### Recommended Project Structure
```
src/data/guides/fastapi-production/pages/
    00-builder-pattern.mdx       # PAGE-01 (exists as stub, needs full content)
    01-middleware.mdx             # PAGE-03
    02-authentication.mdx        # PAGE-02
    03-observability.mdx         # PAGE-04
    04-database.mdx              # PAGE-05
    05-docker.mdx                # PAGE-06
    06-testing.mdx               # PAGE-07
    07-health-checks.mdx         # PAGE-08
    08-security-headers.mdx      # PAGE-09
    09-rate-limiting.mdx         # PAGE-10
    10-caching.mdx               # PAGE-11
```

### Pattern 1: MDX Page Structure for Domain Pages
**What:** Each MDX file follows a consistent structure: frontmatter, component imports, AI agent opener, domain sections with CodeFromRepo snippets, diagram embedding, and AI agent closer.
**When to use:** Every one of the 11 domain pages.
**Example:**
```mdx
---
title: "Middleware Stack"
description: "How the FastAPI template configures 6 raw ASGI middlewares with deliberate ordering"
order: 1
slug: "middleware"
---
import CodeFromRepo from '../../../../components/guide/CodeFromRepo.astro';
import MiddlewareStackDiagram from '../../../../components/guide/MiddlewareStackDiagram.astro';

## What Your Agent Inherits

When your AI agent generates a FastAPI endpoint, it runs inside a middleware
pipeline that has already handled request IDs, rate limiting, body size limits,
timeouts, security headers, CORS, and trusted host validation. The agent never
touches any of this.

## The Middleware Stack

[Main domain content with multiple CodeFromRepo snippets...]

<CodeFromRepo
  code={`class RequestIDMiddleware:
    ...`}
  lang="python"
  filePath="src/app/middleware/request_id.py"
/>

<MiddlewareStackDiagram />

## Why Raw ASGI, Not BaseHTTPMiddleware

[Explanation of design decision...]

## What the Agent Never Implements

- Request ID generation and correlation header propagation
- Rate limiting with memory or Redis backends
- Body size validation and rejection
- ...
```

### Pattern 2: CodeFromRepo Usage in MDX
**What:** Import CodeFromRepo and use it with inline code props for each source excerpt.
**When to use:** Every code snippet from the fastapi-template repository.
**Example:**
```mdx
import CodeFromRepo from '../../../../components/guide/CodeFromRepo.astro';

<CodeFromRepo
  code={`def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    from .app_builder import FastAPIAppBuilder

    configure_root_logging(settings)
    logger = logging.getLogger(settings.app_name)

    app = (
        FastAPIAppBuilder(settings=settings, logger=logger)
        .setup_settings()
        .setup_logging()
        .setup_database()
        .setup_auth()
        .setup_cache()
        .setup_tracing()
        .setup_metrics()
        .setup_error_handlers()
        .setup_routes()
        .setup_middleware()
        .build()
    )
    return app`}
  lang="python"
  filePath="src/app/__init__.py"
  startLine={36}
  endLine={73}
/>
```

### Pattern 3: Diagram Embedding in MDX
**What:** Import and render diagram Astro components inline in MDX content.
**When to use:** Only the 4 pages that have diagrams assigned (PAGE-01, PAGE-02, PAGE-03, PAGE-06).
**Example for SVG diagrams:**
```mdx
import BuilderPatternDiagram from '../../../../components/guide/BuilderPatternDiagram.astro';

## How the Builder Composes the Application

<BuilderPatternDiagram />

The diagram above shows how each `setup_*()` method...
```

**Example for React Flow (DeploymentTopology in Docker page):**
```mdx
import DeploymentTopology from '../../../../components/guide/DeploymentTopology';

## Deployment Topology

<DeploymentTopology client:visible />

The interactive diagram above shows the four services...
```

### Pattern 4: AI Agent Narrative Framing
**What:** Each page opens with a "What Your Agent Inherits" section and closes with a "What the Agent Never Implements" section.
**When to use:** All 11 domain pages (AGENT-01 and AGENT-02 requirements).
**Opener pattern:**
```markdown
## What Your Agent Inherits

[2-3 sentences explaining what production concern is already handled by the
template, framed from the perspective of an AI agent that will write business
logic on top of this foundation.]
```
**Closer pattern:**
```markdown
## What the Agent Never Implements

- [Bullet point of handled concern]
- [Bullet point of handled concern]
- [...]
```

### Pattern 5: File Numbering and Ordering
**What:** MDX filenames use zero-padded order prefixes matching guide.json chapter order.
**When to use:** All 11 MDX files.
**Convention:** The `order` frontmatter field matches the guide.json chapters array index. Filename prefix matches the order value. The `slug` frontmatter field matches the guide.json chapter slug exactly.

### Anti-Patterns to Avoid
- **Referencing external FastAPI docs for template-specific behavior:** The guide must be self-contained. Explain WHY the template makes specific choices (e.g., raw ASGI over BaseHTTPMiddleware) inline, not via links to external docs.
- **Extracting code from the template at build time:** OUT OF SCOPE per REQUIREMENTS.md. All code snippets are curated inline excerpts passed as `code` string props to CodeFromRepo.
- **Using standard fenced code blocks for template code:** Use CodeFromRepo for all template source excerpts so readers get file path attribution and "View source" links. Reserve standard fenced code blocks only for configuration examples, shell commands, or non-template code.
- **Shallow "what it does" descriptions:** Each page must explain the "why not the obvious approach" angle. The reader should understand WHY the template makes each design choice, not just WHAT it does.
- **Inconsistent frontmatter slugs:** The `slug` field in each MDX frontmatter MUST exactly match the corresponding entry in guide.json's `chapters` array. Any mismatch causes 404s or missing sidebar entries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code snippet rendering | Custom code blocks | CodeFromRepo.astro | Already built in Phase 87; handles highlighting, file path, GitHub link |
| Architecture diagrams | Inline SVGs or ASCII art | Diagram wrapper components | Already built in Phase 87; consistent styling, accessible |
| Page navigation | Manual prev/next links | GuideChapterNav.astro | Already built in Phase 86; auto-derives from guide.json |
| Sidebar highlighting | Manual current-page logic | GuideSidebar.astro | Already built in Phase 86; uses currentSlug prop |
| Prose styling | Custom CSS per page | [slug].astro prose classes | Already configured with heading styles, text colors, spacing |

**Key insight:** Phase 88 is purely content authoring. Every piece of infrastructure is already operational. The implementer's job is to write excellent MDX content using the components and patterns established in Phases 85-87.

## Common Pitfalls

### Pitfall 1: Frontmatter Slug Mismatch with guide.json
**What goes wrong:** An MDX file's `slug` field does not match the corresponding guide.json chapter entry. The page builds but does not appear in sidebar or prev/next navigation correctly.
**Why it happens:** guide.json uses specific slug values (e.g., "middleware" not "middleware-stack") and any deviation breaks the chapter-to-page mapping.
**How to avoid:** Cross-reference each MDX frontmatter `slug` against the guide.json `chapters` array before committing. The exact slugs are: `builder-pattern`, `middleware`, `authentication`, `observability`, `database`, `docker`, `testing`, `health-checks`, `security-headers`, `rate-limiting`, `caching`.
**Warning signs:** Page renders but sidebar shows it as inactive, or prev/next links skip over it.

### Pitfall 2: Component Import Paths in MDX
**What goes wrong:** Build fails because MDX component import paths are wrong. MDX files in `src/data/guides/fastapi-production/pages/` need to reach `src/components/guide/` which is 4 directories up.
**Why it happens:** The relative path from the MDX location to the component directory is `../../../../components/guide/`.
**How to avoid:** Use the exact path: `import CodeFromRepo from '../../../../components/guide/CodeFromRepo.astro';`. Verify by checking how EDA MDX pages import components (same 4-level relative pattern).
**Warning signs:** Build error mentioning "Module not found" or "Cannot resolve" for component imports.

### Pitfall 3: Code String Escaping in MDX Props
**What goes wrong:** Code passed as string props to CodeFromRepo contains backticks or curly braces that conflict with MDX/JSX parsing.
**Why it happens:** MDX treats `{` and `}` as JSX expression boundaries. Template strings using backticks can conflict with MDX formatting.
**How to avoid:** Use template literals (backtick strings) for the `code` prop value. If the Python code itself contains backticks or curly braces in f-strings, wrap the code prop in `{` backtick-string `}` syntax. For f-string braces in Python code, they should render correctly inside template literals.
**Warning signs:** Build errors mentioning "Unexpected token" or "Expression expected" in MDX files.

### Pitfall 4: Deploying Before v1.0.0 Tag Exists
**What goes wrong:** All "View source" links from CodeFromRepo return 404 on GitHub because the fastapi-template repository has no v1.0.0 tag.
**Why it happens:** CodeFromRepo constructs URLs as `github.com/Translucent-Computing/fastapi-template/blob/v1.0.0/path/to/file`. Without the tag, GitHub returns 404.
**How to avoid:** Create the v1.0.0 tag on the fastapi-template repository before deploying the site with the guide content. Content authoring can proceed without the tag -- only the external links will be affected.
**Warning signs:** Clicking "View source" on any code snippet leads to a GitHub 404 page.

### Pitfall 5: DeploymentTopology Missing client:visible Directive
**What goes wrong:** The React Flow deployment topology diagram either does not render (SSR failure) or loads all JavaScript eagerly, hurting page performance.
**Why it happens:** React Flow requires DOM measurements for layout. Without `client:visible`, it may attempt SSR rendering which fails, or `client:load` loads JavaScript before the user scrolls to the diagram.
**How to avoid:** When importing DeploymentTopology in the Docker page MDX, use `<DeploymentTopology client:visible />`. This ensures the component only hydrates when scrolled into view.
**Warning signs:** Empty container where the deployment topology should appear, or slow page load from eager JavaScript loading.

### Pitfall 6: Overly Long MDX Pages That Don't Build
**What goes wrong:** Very large MDX files with many component imports can slow the Astro build or hit memory limits.
**Why it happens:** Each CodeFromRepo instance inlines the code string and the MDX compiler processes everything in one pass.
**How to avoid:** Keep code excerpts focused -- show the critical 10-30 lines, not entire 300-line files. Use `startLine`/`endLine` props to indicate the excerpt's position in the full file. The "View source" link lets readers see the complete file.
**Warning signs:** Build times increase significantly per page, or out-of-memory errors during build.

### Pitfall 7: Inconsistent Chapter Order Values
**What goes wrong:** The `order` frontmatter field does not match the chapter's position in guide.json, causing incorrect prev/next navigation ordering.
**Why it happens:** guide.json chapters array defines the canonical order (0-indexed). The `order` field in MDX frontmatter should match this index.
**How to avoid:** The guide.json chapters array ordering is: 0=builder-pattern, 1=middleware, 2=authentication, 3=observability, 4=database, 5=docker, 6=testing, 7=health-checks, 8=security-headers, 9=rate-limiting, 10=caching. Each MDX file's `order` field must match.
**Warning signs:** Prev/next navigation goes to wrong chapters, or sidebar order does not match expected sequence.

## Code Examples

Verified patterns from the existing project codebase:

### EDA MDX Component Import Pattern (Existing)
```mdx
---
title: "Ceramic Strength Case Study"
description: "EDA case study analyzing NIST JAHANMI2.DAT..."
section: "1.4.2"
category: "case-studies"
nistSection: "1.4.2.10 Ceramic Strength"
---
import CaseStudyDataset from '../../../../components/eda/CaseStudyDataset.astro';
import InlineMath from '../../../../components/eda/InlineMath.astro';
import CeramicStrengthPlots from '../../../../components/eda/CeramicStrengthPlots.astro';

## Background and Data

This case study applies exploratory data analysis...
```
Source: `src/data/eda/pages/case-studies/ceramic-strength.mdx`

### CodeFromRepo Component Usage (Existing)
```astro
<CodeFromRepo
  code={codeString}
  lang="python"
  filePath="src/app/app_builder.py"
  startLine={47}
  endLine={75}
/>
```
Source: `src/components/guide/CodeFromRepo.astro` -- Props: code (string), lang (string), filePath (string), title (optional), templateRepo (defaults to fastapi-template URL), versionTag (defaults to v1.0.0), startLine (optional), endLine (optional)

### SVG Diagram Embedding (Existing)
```astro
<!-- MiddlewareStackDiagram.astro wraps PlotFigure with zero-JS SVG -->
<PlotFigure svg={svg} caption="Request flow through the 8-layer middleware stack" maxWidth="720px" />
```
Source: `src/components/guide/MiddlewareStackDiagram.astro`

### React Flow Component in MDX (Established Pattern)
```mdx
import DeploymentTopology from '../../../../components/guide/DeploymentTopology';

<DeploymentTopology client:visible />
```
Note: The `.tsx` extension is omitted in the import. The `client:visible` directive is required for React components in MDX.

### [slug].astro Rendering (Existing)
```astro
<div class="prose max-w-none
  [&>h2]:text-xl [&>h2]:font-heading [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4
  [&>p]:text-[var(--color-text-secondary)] [&>p]:leading-relaxed [&>p]:mb-4
">
  <Content />
</div>
```
Source: `src/pages/guides/fastapi-production/[slug].astro` -- The prose styling is already configured. MDX content inherits these styles automatically.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-written HTML code blocks | CodeFromRepo with expressive-code | Phase 87 | Source attribution and GitHub links automatic |
| Static diagrams as images | Build-time SVG + React Flow | Phase 87 | Theme-aware, accessible, interactive where needed |
| Generic technical docs | AI agent narrative framing | Phase 86/88 | Each page opens/closes with agent perspective |

**Deprecated/outdated:**
- BaseHTTPMiddleware in FastAPI: The template deliberately avoids this. The Middleware page (PAGE-03) must explain WHY raw ASGI is preferred (streaming body access, proper exception handling, no double-wrapping).

## Content Domain Reference

### Source File Map per Chapter

This section maps each chapter to its primary source files in the fastapi-template repository, the specific code excerpts to highlight, and the key design decisions to explain.

#### PAGE-01: Builder Pattern
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/__init__.py` | `create_app()` factory with builder chain | Why factory function over module-level instantiation |
| `src/app/app_builder.py` | `FastAPIAppBuilder` class, `setup_*()` methods | Fluent interface, each method returns `Self` |
| `src/app/app_builder.py` | `build()` method | Final assembly, logging confirmation |
| `main.py` | Module-level `app = create_app()` | How ASGI servers reference the factory output |

#### PAGE-02: Authentication
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/auth/service.py` | `JWTAuthService.__init__()` | 3 key material sources: secret, public key, JWKS URL |
| `src/app/auth/service.py` | `_resolve_key()` | Decision tree for selecting verification material |
| `src/app/auth/service.py` | `_fetch_jwks()` with lock + stale cache | Cache-aside pattern with graceful degradation |
| `src/app/auth/models.py` | `Principal` dataclass | Normalized token claims as domain model |
| `src/app/settings.py` | `auth_*` fields + `_validate_auth_settings()` | Configuration validation prevents misconfiguration |

#### PAGE-03: Middleware
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/app_builder.py` | `setup_middleware()` | Registration order with comments explaining WHY |
| `src/app/middleware/request_id.py` | `__call__` with raw ASGI protocol | Why raw ASGI: direct scope/receive/send access |
| `src/app/middleware/request_logging.py` | Access-style structured log per request | Correlation with request ID |
| `src/app/middleware/security_headers.py` | Header injection on response | HSTS, CSP, referrer policy |
| `src/app/middleware/rate_limit.py` | Fixed-window algorithm + store abstraction | Memory vs Redis pluggability |
| `src/app/middleware/body_size.py` | Early rejection of oversized bodies | Streaming-aware body counting |
| `src/app/middleware/timeout.py` | asyncio timeout wrapping | Cancellation semantics |

#### PAGE-04: Observability
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/observability/tracing.py` | `configure_tracing()` | TracerProvider, Resource, BatchSpanProcessor setup |
| `src/app/observability/tracing.py` | `instrument_fastapi_app()` / `instrument_database_engine()` | Auto-instrumentation with path exclusions |
| `src/app/app_builder.py` | `setup_metrics()` | Prometheus via starlette-exporter, skip paths |
| `src/app/app_builder.py` | `setup_logging()` | JSON vs text format, structured fields |
| `src/app/log_config/request_context.py` | Context variables for request_id/correlation_id | Thread-safe logging context |

#### PAGE-05: Database
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/db/engine.py` | `create_database_engine()` | SQLite-first, pool config for Postgres |
| `src/app/db/session.py` | Session factory and `session_scope()` | Async session lifecycle |
| `src/app/db/base.py` | Declarative base | Shared metadata for models |
| `src/app/settings.py` | `_derive_database_url()` | Multi-backend URL derivation (SQLite, Postgres, custom) |
| `src/app/settings.py` | `_derive_alembic_database_url()` | Async-to-sync URL mapping for migrations |
| `alembic/` | Migration configuration | Alembic integration with async engine |

#### PAGE-06: Docker
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `Dockerfile` | Full multi-stage build | Builder + runtime separation, digest pinning |
| `Dockerfile` | `tini` installation and ENTRYPOINT | PID 1 signal forwarding, zombie reaping |
| `Dockerfile` | `USER app` + `groupadd/useradd` | Unprivileged user with stable UID/GID |
| `Dockerfile` | `HEALTHCHECK` directive | Container-level liveness separate from Kubernetes |
| `docker-compose.yml` | Service orchestration | Local development stack |

#### PAGE-07: Testing
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `tests/conftest.py` | Shared pytest fixtures | Test app factory, async fixtures |
| `tests/helpers.py` | Hermetic test helpers | JWT minting, factory functions |
| `tests/unit/` | Unit test structure | Per-module test files, no DB dependency |
| `tests/integration/` | Integration test structure | Full middleware stack, auth flows |
| `pyproject.toml` | pytest configuration | Coverage config, markers |

#### PAGE-08: Health Checks
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/routes/health.py` | `health_check()` vs `readiness_check()` | Liveness = "am I alive?", readiness = "can I serve traffic?" |
| `src/app/readiness/registry.py` | `ReadinessRegistry` + `ReadinessCheckResult` | Dependency-aware readiness with latency tracking |
| `src/app/db/health.py` | Database readiness check | Async ping with timeout |
| `src/app/cache/health.py` | Cache readiness check | Redis/memory connectivity |
| `src/app/app_builder.py` | setup_settings/setup_database/setup_auth/setup_cache | Each registers its readiness check |

#### PAGE-09: Security Headers
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/middleware/security_headers.py` | Header injection logic | HSTS conditional on HTTPS, CSP, referrer policy |
| `src/app/settings.py` | `security_*` settings fields | All configurable with safe defaults |
| `src/app/settings.py` | `_resolve_csp_for_docs()` | Automatic CSP relaxation when Swagger/ReDoc enabled |

#### PAGE-10: Rate Limiting
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/middleware/rate_limit.py` | `RateLimitMiddleware` class | ASGI protocol, exempt paths, response headers |
| `src/app/middleware/rate_limit.py` | `MemoryRateLimitStore` + `RedisRateLimitStore` | Fixed-window algorithm, pluggable backend |
| `src/app/middleware/rate_limit.py` | `_build_rate_limit_key()` | IP vs authorization key strategies, proxy trust |
| `src/app/settings.py` | `rate_limit_*` settings | Configuration surface |

#### PAGE-11: Caching
| Source File | Key Excerpt | Explanation Focus |
|-------------|-------------|-------------------|
| `src/app/cache/store.py` | `CacheStore` ABC | Abstract interface (get, set, delete, exists, clear, ping, close) |
| `src/app/cache/store.py` | `MemoryCacheStore` | Dict-based with monotonic TTL, max-entry eviction |
| `src/app/cache/store.py` | `RedisCacheStore` | Redis client with key prefix namespacing |
| `src/app/cache/store.py` | `create_cache_store()` | Factory function driven by settings |
| `src/app/cache/dependencies.py` | FastAPI dependency injection | Cache access per request |

## Open Questions

1. **v1.0.0 Tag on fastapi-template**
   - What we know: The fastapi-template repository at `/Users/patrykattc/work/git/fastapi-template/` has zero tags. guide.json references `versionTag: "v1.0.0"`. This is listed as a blocker in STATE.md.
   - What's unclear: When the tag will be created, and whether content authoring should block on it.
   - Recommendation: Author all content without waiting for the tag. CodeFromRepo renders code correctly regardless. The tag only affects "View source" link validity. Add a note in the plan that the tag must be created before Phase 89 (deployment/SEO) or before the guide goes live.

2. **Page Content Depth and Length**
   - What we know: EDA case study pages range from 50-390+ lines of MDX. The guide's success criteria says pages must explain "the production concern, configuration options, and 'why not the obvious approach' callouts." The guide must be self-contained.
   - What's unclear: Exact target length per page.
   - Recommendation: Aim for 150-300 lines of MDX per page. Shorter pages (Security Headers, Health Checks, Caching) may be 100-150 lines. Longer pages (Builder Pattern, Middleware, Authentication) may reach 250-350 lines. Quality and self-containedness matter more than specific line counts.

3. **Plan Splitting Strategy**
   - What we know: 11 pages + AI agent narrative. Each page is largely independent (can be authored in any order).
   - What's unclear: Optimal number of plans.
   - Recommendation: 3-4 plans grouped by domain affinity. Plan 1: Core architecture (Builder Pattern, Middleware). Plan 2: Security & auth (Authentication, Security Headers, Rate Limiting). Plan 3: Infrastructure (Observability, Database, Docker, Health Checks). Plan 4: Optional layers (Testing, Caching). This keeps each plan at 2-3 pages and allows natural cross-referencing within a plan.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 through PAGE-11 | Each page renders with complete prose, code snippets, and correct frontmatter | smoke | `npx astro build 2>&1 \| tail -10` | N/A (build validation) |
| AGENT-01 | Each page opens with agent narrative section | manual-only | Visual review of rendered pages | N/A |
| AGENT-02 | Each page closes with agent summary section | manual-only | Visual review of rendered pages | N/A |
| All PAGE-* | Frontmatter slugs match guide.json chapters | unit | Existing `npx vitest run src/lib/guides/__tests__/schema.test.ts` validates schema | Exists |

### Sampling Rate
- **Per task commit:** `npx astro build` (full build validates all MDX frontmatter and component imports)
- **Per wave merge:** `npx vitest run && npx astro build`
- **Phase gate:** Full suite green + successful build + visual review of all 11 rendered pages

### Wave 0 Gaps
None -- existing test infrastructure (schema validation tests + build smoke test) covers all automated validation needs. Content quality is verified by visual review and self-check against success criteria.

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/data/guides/fastapi-production/guide.json` -- chapter slugs, ordering, template repo URL, version tag
- Project codebase: `src/data/guides/fastapi-production/pages/00-builder-pattern.mdx` -- existing stub MDX showing frontmatter pattern
- Project codebase: `src/data/eda/pages/case-studies/ceramic-strength.mdx` -- reference for MDX depth, component import pattern, content style
- Project codebase: `src/components/guide/CodeFromRepo.astro` -- component API (props interface, defaults)
- Project codebase: `src/components/guide/MiddlewareStackDiagram.astro`, `BuilderPatternDiagram.astro`, `JwtAuthFlowDiagram.astro` -- diagram component import patterns
- Project codebase: `src/components/guide/DeploymentTopology.tsx` -- React Flow component requiring `client:visible`
- Project codebase: `src/pages/guides/fastapi-production/[slug].astro` -- rendering pipeline, prose styling classes
- fastapi-template repository: `/Users/patrykattc/work/git/fastapi-template/` -- ALL source files for content excerpts (verified by reading key files)

### Secondary (MEDIUM confidence)
- Project STATE.md blocker note -- "Template repo tagging: fastapi-template needs a v1.0.0 tag before content authoring"
- Prior phase summaries (85, 86, 87) -- confirmed all infrastructure is operational

### Tertiary (LOW confidence)
- None -- all findings verified against actual project codebase and fastapi-template source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages; all infrastructure built and verified in Phases 85-87
- Architecture: HIGH -- MDX content authoring pattern verified against existing EDA pages; component import paths validated
- Pitfalls: HIGH -- derived from actual codebase structure, verified file paths, and known blocker
- Content domain: HIGH -- all 11 source modules read from the fastapi-template repository; content scope clearly defined

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (30 days -- content authoring against stable source code; no infrastructure changes expected)
