# Feature Research: Docker Compose Validator

**Domain:** Interactive browser-based Docker Compose validation tool on an Astro 5 portfolio site
**Researched:** 2026-02-22
**Confidence:** HIGH
**Scope:** Docker Compose Validator at /tools/compose-validator/ with schema validation, semantic analysis, security rules, best practice rules, category-weighted scoring, per-rule documentation, interactive dependency graph, and companion blog post

---

## Existing Infrastructure (Already Built)

These capabilities exist on patrykgolabek.dev and directly inform what the Compose Validator can leverage:

| Capability | Where | Reuse Potential |
|------------|-------|-----------------|
| **Dockerfile Analyzer pattern** | `src/lib/tools/dockerfile-analyzer/` -- LintRule interface, engine, scorer, types | MIRROR -- Compose Validator follows the same modular rule architecture: one file per rule, category subdirectories, flat registry array |
| **Category-weighted scoring** | `src/lib/tools/dockerfile-analyzer/scorer.ts` -- diminishing returns formula | ADAPT -- same algorithm with different categories and weights |
| **CodeMirror 6 editor** | `src/lib/tools/dockerfile-analyzer/use-codemirror.ts`, editor-theme.ts | ADAPT -- swap Dockerfile language for YAML language mode |
| **Inline annotations** | `src/lib/tools/dockerfile-analyzer/highlight-line.ts` -- squiggly underlines + gutter markers | DIRECT -- same annotation pattern for YAML violations |
| **Score gauge component** | React component with SVG circular gauge + letter grade | DIRECT -- identical component, different input |
| **Category breakdown panel** | React component showing sub-scores per dimension | ADAPT -- new category names |
| **Violation list component** | Severity-grouped, expandable details, click-to-navigate | DIRECT -- same UX pattern |
| **Badge generator** | `src/lib/tools/dockerfile-analyzer/badge-generator.ts` -- programmatic SVG-to-PNG | ADAPT -- "Compose Validator" branding |
| **URL state compression** | `src/lib/tools/dockerfile-analyzer/url-state.ts` -- lz-string | DIRECT -- same pattern for compose YAML |
| **Rule documentation pages** | `src/pages/tools/dockerfile-analyzer/rules/[code].astro` | MIRROR -- same template at /tools/compose-validator/rules/[code] |
| **OG image generation** | `src/lib/og-image.ts` using Satori + Sharp | EXTEND -- Compose Validator OG images |
| **JSON-LD structured data** | SoftwareApplication schema on Dockerfile Analyzer | DIRECT -- same schema for Compose Validator |
| **Nanostore bridge** | Editor-to-React state communication pattern | DIRECT -- same cross-framework pattern |
| **React island pattern** | `client:only="react"` with View Transitions lifecycle | DIRECT -- same island approach |
| **Homepage callout** | Pattern for featuring tools on homepage | DIRECT -- add Compose Validator card |
| **Tools page** | `src/pages/tools/index.astro` | EXTEND -- add Compose Validator card |

---

## Competitive Landscape Analysis

### Existing Docker Compose Validation Tools

| Tool | Type | Rules | Strengths | Weaknesses |
|------|------|-------|-----------|------------|
| **DCLint** (zavoloklom) | CLI, npm | ~15 rules across 4 categories (Style, Security, Best Practice, Performance) | Auto-fix support, inline comments to disable rules, configurable | No browser UI, no scoring, no dependency visualization, limited rule count |
| **Code Pathfinder** | CLI, CI/CD | 10 COMPOSE-SEC security rules | Deep CWE-mapped security focus, well-documented | Security-only, no best practice/semantic checks, no browser UI |
| **Semgrep** (docker-compose ruleset) | CLI, CI/CD | ~8 security rules | Pattern-based, integrates with CI/CD | Not compose-specific, no scoring, no browser UI |
| **dcvalidator** (ZHAW SPLab) | Web + CLI | ~3 checks (duplicates, structural) | Academic pedigree, web-accessible | Minimal rule set, unmaintained, no scoring |
| **onewebcare.com** | Web | Schema + basic checks | Browser-based, example templates | Shallow validation (schema + obvious errors), no scoring, no security rules |
| **multitools.ovh** | Web | 10 validation types claimed | Categorized results | Basic implementation, limited depth, no line numbers |
| **docker compose config** | Built-in CLI | Schema validation | Official tool, catches structural errors | No security rules, no best practices, no scoring, requires Docker installed |
| **VS Code YAML extension** | IDE plugin | Schema validation via JSON Schema | Real-time, inline | Schema-only, no semantic/security analysis |

### Gap Analysis

**What NO existing tool provides:**
1. Category-weighted scoring with letter grades
2. Interactive dependency graph visualization
3. Combined schema + semantic + security + best practice analysis in one browser tool
4. Per-rule documentation pages (SEO value)
5. Exportable score badges
6. Shareable URL state
7. Expert-voice rule explanations with production consequences

This is the same gap the Dockerfile Analyzer fills for Dockerfiles -- no browser-based tool combines depth, scoring, and interactivity.

---

## Validation Rule Categories (Research Synthesis)

### Category 1: Schema Validation

**What it is:** Structural correctness against the compose-spec JSON Schema (Draft 7). This is the foundation -- if the YAML is malformed or uses invalid keys, nothing else matters.

**Implementation:** ajv + ajv-formats validating parsed YAML against compose-spec.json. The compose-spec schema is well-maintained, Draft 7 (fully supported by ajv in browser), and has no required top-level fields (but `services` is effectively required for any useful file).

**Key rules:**

| Rule Code | Name | Severity | What It Catches |
|-----------|------|----------|-----------------|
| CV-S001 | Invalid YAML syntax | error | Indentation errors, missing colons, tab characters, malformed arrays |
| CV-S002 | Unknown top-level property | error | Typos in `services`, `networks`, `volumes`, `secrets`, `configs` |
| CV-S003 | Unknown service property | error | Typos within service definitions (e.g., `port` instead of `ports`) |
| CV-S004 | Invalid port format | error | Malformed port mappings (not matching `[host:]container[/protocol]`) |
| CV-S005 | Invalid volume format | error | Malformed volume mounts |
| CV-S006 | Invalid duration format | error | Healthcheck intervals, timeouts not matching Docker duration format |
| CV-S007 | Invalid restart policy | error | Values other than `no`, `always`, `unless-stopped`, `on-failure` |
| CV-S008 | Invalid depends_on condition | error | Conditions other than `service_started`, `service_healthy`, `service_completed_successfully` |

**Confidence:** HIGH -- compose-spec JSON Schema is authoritative and well-documented. ajv is the standard JSON Schema validator for JavaScript, proven in browser.

### Category 2: Semantic Analysis

**What it is:** Logic errors that pass schema validation but will cause runtime failures or unexpected behavior. These require understanding relationships between services, networks, volumes, and ports.

**Key rules:**

| Rule Code | Name | Severity | What It Catches |
|-----------|------|----------|-----------------|
| CV-M001 | Duplicate exported ports | error | Two services publishing the same host port (e.g., both mapping to 80:80) -- Docker will fail at runtime |
| CV-M002 | Circular depends_on | error | Service A depends on B, B depends on C, C depends on A -- Docker Compose detects this but our tool catches it pre-deploy with visualization |
| CV-M003 | Undefined network reference | error | Service references a network not defined in top-level `networks` |
| CV-M004 | Undefined volume reference | error | Service references a named volume not defined in top-level `volumes` |
| CV-M005 | Undefined secret reference | error | Service references a secret not defined in top-level `secrets` |
| CV-M006 | Undefined config reference | error | Service references a config not defined in top-level `configs` |
| CV-M007 | Orphan network definition | warning | Network defined at top level but never referenced by any service |
| CV-M008 | Orphan volume definition | warning | Named volume defined at top level but never referenced by any service |
| CV-M009 | Orphan secret definition | warning | Secret defined at top level but never referenced by any service |
| CV-M010 | depends_on with service_healthy but no healthcheck | warning | Service depends on another with `condition: service_healthy` but the dependency has no healthcheck defined |
| CV-M011 | Self-referencing dependency | error | Service lists itself in depends_on |
| CV-M012 | Dependency on undefined service | error | depends_on references a service name that does not exist |
| CV-M013 | Duplicate container names | error | Multiple services with the same `container_name` value |
| CV-M014 | Port range overlap | warning | Port ranges that overlap between services (e.g., 8080-8090 and 8085-8095) |
| CV-M015 | Invalid image reference | warning | Image names with obvious format issues (spaces, special characters) |

**Confidence:** HIGH -- these are well-documented runtime failure modes from Docker Compose issue trackers and Stack Overflow. Port conflicts (docker/compose#6708, #7188), circular deps (docker/compose#7239, #11586), and undefined references are the top categories of "compose file that validates but fails to start."

### Category 3: Security

**What it is:** Configuration choices that weaken container isolation, expose the host, or leak secrets. Mapped to OWASP Docker Security Cheat Sheet and CWE standards.

**Key rules:**

| Rule Code | Name | Severity | What It Catches |
|-----------|------|----------|-----------------|
| CV-C001 | Privileged mode enabled | error | `privileged: true` -- disables ALL container isolation, equivalent to root on host (CWE-250) |
| CV-C002 | Docker socket mounted | error | `/var/run/docker.sock` in volumes -- gives container full control of Docker daemon (CWE-250) |
| CV-C003 | Host network mode | error | `network_mode: host` -- bypasses network namespace isolation entirely |
| CV-C004 | Host PID mode | error | `pid: host` -- container can see and signal all host processes |
| CV-C005 | Host IPC mode | warning | `ipc: host` -- shared memory access between container and host |
| CV-C006 | Dangerous capabilities added | error | `cap_add` includes SYS_ADMIN, NET_ADMIN, SYS_PTRACE, or ALL -- over-privileged containers |
| CV-C007 | Capabilities not dropped | warning | No `cap_drop: [ALL]` -- containers retain default Linux capabilities |
| CV-C008 | Secrets in environment variables | error | `environment` contains keys matching secret patterns (PASSWORD, API_KEY, TOKEN, SECRET) with inline values |
| CV-C009 | Unbound port interface | warning | Ports without explicit host IP binding (e.g., `8080:80` instead of `127.0.0.1:8080:80`) -- exposes port on all interfaces |
| CV-C010 | Missing no-new-privileges | info | `security_opt` does not include `no-new-privileges:true` -- allows privilege escalation via setuid/setgid |
| CV-C011 | Writable filesystem | info | `read_only` not set to `true` -- container can write to root filesystem |
| CV-C012 | Seccomp disabled | warning | `security_opt` includes `seccomp:unconfined` -- disables syscall filtering |
| CV-C013 | SELinux disabled | info | `security_opt` includes `label:disable` -- disables SELinux separation |
| CV-C014 | Image uses latest tag | warning | `image: name:latest` or `image: name` (no tag) -- mutable, non-reproducible, supply chain risk |

**Confidence:** HIGH -- mapped directly from OWASP Docker Security Cheat Sheet, Code Pathfinder COMPOSE-SEC rules, and Semgrep docker-compose ruleset. CWE references validated against source.

### Category 4: Best Practices

**What it is:** Configuration patterns that improve reliability, maintainability, and operability. Not security-critical but important for production readiness.

**Key rules:**

| Rule Code | Name | Severity | What It Catches |
|-----------|------|----------|-----------------|
| CV-B001 | Missing healthcheck | warning | Service has no `healthcheck` defined -- no way to determine if the service is actually ready |
| CV-B002 | No restart policy | warning | Service has no `restart` field -- container stays stopped after crash |
| CV-B003 | No resource limits | info | Service has no `deploy.resources.limits` -- can consume unlimited host resources |
| CV-B004 | Image tag not pinned | warning | Using mutable tags like `latest`, `stable`, `lts` instead of specific version tags |
| CV-B005 | No logging configuration | info | Service has no `logging` config -- defaults to json-file with no rotation, can fill disk |
| CV-B006 | Deprecated version field | info | Top-level `version` field present -- deprecated since Docker Compose v1.27.0 (2020), ignored by modern Compose |
| CV-B007 | Missing project name | info | No top-level `name` field -- Compose generates name from directory, which is non-portable |
| CV-B008 | Both build and image | warning | Service specifies both `build` and `image` -- ambiguous whether to build or pull |
| CV-B009 | Anonymous volume usage | info | Short-form volumes without names (e.g., `/data`) -- creates anonymous volumes that are hard to manage |
| CV-B010 | No memory reservation | info | `deploy.resources.limits` set but no `deploy.resources.reservations` -- no guaranteed minimum resources |
| CV-B011 | Healthcheck timeout exceeds interval | warning | `timeout` is longer than `interval` -- health check can overlap with itself |
| CV-B012 | Default network only | info | No custom networks defined -- all services share one network with no isolation |

**Confidence:** HIGH -- sourced from Docker official documentation, CNCF best practices, HashiCorp guidance, and common Stack Overflow troubleshooting patterns.

### Category 5: Style / Formatting

**What it is:** Consistency and readability rules that do not affect correctness or security but improve maintainability.

**Key rules:**

| Rule Code | Name | Severity | What It Catches |
|-----------|------|----------|-----------------|
| CV-F001 | Services not alphabetically ordered | info | Services defined in non-alphabetical order -- harder to navigate large files |
| CV-F002 | Ports not quoted | info | Port values not wrapped in quotes -- YAML may parse "80:80" as base-60 integer |
| CV-F003 | Inconsistent quoting in ports | info | Mix of quoted and unquoted port values in the same file |

**Confidence:** MEDIUM -- style rules are subjective. DCLint implements these with auto-fix. Our tool should include them but weight them minimally in scoring.

### Recommended Category Weights

Following the Dockerfile Analyzer's proven pattern, weights should reflect real-world impact:

| Category | Weight | Rationale |
|----------|--------|-----------|
| Security | 30% | Container escapes, secret leaks, host compromise -- highest real-world impact |
| Semantic Analysis | 25% | Runtime failures, port conflicts, circular deps -- things that prevent your stack from starting |
| Best Practices | 20% | Production readiness -- healthchecks, restart policies, resource limits |
| Schema Validation | 15% | Structural correctness -- caught early, usually obvious |
| Style / Formatting | 10% | Readability and consistency -- lowest impact on correctness |

**Total rules: ~44** (8 schema + 15 semantic + 14 security + 12 best practice + 3 style + 2 bonus from schema)

This is comparable to the Dockerfile Analyzer's 39 rules, providing similar depth without scope creep.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Dependencies on Existing Code |
|---------|--------------|------------|-------------------------------|
| CodeMirror 6 editor with YAML syntax highlighting | Dockerfile Analyzer sets the precedent -- users expect the same code editor experience | MEDIUM | Adapt `use-codemirror.ts`, swap Dockerfile lang for `@codemirror/lang-yaml` |
| Pre-loaded sample compose file with deliberate issues | Dockerfile Analyzer has this; users need something to analyze immediately | LOW | New sample file, same pattern as `sample-dockerfile.ts` |
| On-demand analysis (Analyze button + Cmd/Ctrl+Enter) | Proven UX from Dockerfile Analyzer -- not real-time, deliberate trigger | LOW | Direct reuse of the same trigger pattern |
| Schema validation (structural correctness) | Most basic expectation -- compose file must be valid YAML and valid compose-spec | MEDIUM | New: ajv + compose-spec.json schema, yaml package for parsing |
| Semantic analysis (port conflicts, undefined refs, circular deps) | The main value proposition -- catching logic errors that schema alone misses | HIGH | New rule engine operating on parsed YAML document model |
| Security rules (privileged, socket, secrets, capabilities) | Core differentiator over basic validators -- OWASP-aligned security checks | MEDIUM | New rules, same LintRule interface pattern |
| Best practice rules (healthchecks, restart, resource limits, pinned images) | Production readiness guidance is the expert value proposition | MEDIUM | New rules, same LintRule interface pattern |
| Category-weighted 0-100 scoring with letter grades | Trademark of the Dockerfile Analyzer -- users expect the same scoring system | LOW | Adapt `scorer.ts` with new category weights |
| Inline editor annotations (squiggly underlines + gutter markers) | Dockerfile Analyzer has this -- users expect violations highlighted in context | LOW | Direct reuse of `highlight-line.ts` pattern |
| Score gauge with letter grade | Visual centerpiece of results panel | LOW | Direct reuse of existing SVG gauge component |
| Category breakdown panel | Shows where points are lost | LOW | Adapt with new category names |
| Violation list (severity-grouped, expandable, click-to-navigate) | Standard results presentation pattern | LOW | Direct reuse of existing component |
| Per-rule documentation pages at /tools/compose-validator/rules/[code] | SEO powerhouse -- 44+ indexable pages with expert content | MEDIUM | Mirror Dockerfile Analyzer rule page template |
| Score badge PNG download | Proven sharing feature | LOW | Adapt badge-generator.ts with new branding |
| Shareable URL state (lz-string compressed) | Users want to share findings | LOW | Direct reuse of url-state.ts pattern |
| Dark-only editor theme matching site aesthetic | Consistency with existing tool | LOW | Direct reuse of editor-theme.ts |
| Responsive layout (stacked mobile, side-by-side desktop) | Accessibility requirement | LOW | Same layout pattern as Dockerfile Analyzer |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but high value.

| Feature | Value Proposition | Complexity | Dependencies on Existing Code |
|---------|-------------------|------------|-------------------------------|
| Interactive service dependency graph | NO competing browser tool visualizes service relationships -- this is the headline differentiator. Shows depends_on chains, network membership, volume sharing, and cycle detection visually | HIGH | New: React Flow + dagre/elkjs layout engine. New React island component. Proven React island pattern. |
| Cycle detection with visual highlighting | When circular depends_on is found, the graph highlights the cycle in red -- immediately obvious what is wrong | MEDIUM | Part of dependency graph implementation |
| Network topology overlay on graph | Color-coded network membership showing which services can communicate | MEDIUM | Extension of dependency graph, requires parsing networks config |
| Multi-tab results (Violations / Dependency Graph / Scoring) | Organize rich output without overwhelming -- users switch between validation results and visual graph | LOW | Nanostores tab state, same pattern as Beauty Index code comparison |
| Companion blog post ("Docker Compose Best Practices" or "Securing Your Docker Compose Files") | SEO content pillar, bidirectional cross-linking with tool | MEDIUM | Same MDX blog post pattern |
| OG images for tool page and overview | Social sharing, SEO | LOW | Extend existing og-image.ts |
| Homepage callout | Drive traffic from homepage to tool | LOW | Same pattern as Dockerfile Analyzer callout |
| JSON-LD SoftwareApplication schema | SEO structured data | LOW | Direct reuse pattern |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Explicitly NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-fix / auto-correct | DCLint has auto-fix for style rules | Too many edge cases for security/semantic fixes; modifying user's YAML risks breaking their intent; scope explosion | Show clear fix suggestions with before/after code in rule docs (already proven in Dockerfile Analyzer) |
| Real-time as-you-type linting | Feels more responsive | YAML parsing on every keystroke is expensive; partial YAML is often invalid; creates noise while user is mid-edit | On-demand analysis (Analyze button + keyboard shortcut) -- proven superior UX |
| Multi-file compose support (includes, extends, overrides) | Real projects use multiple files | Browser tool receives a single paste -- there is no filesystem to resolve includes/extends from; massively increases parser complexity | Validate single file; document that multi-file merging should use `docker compose config` to produce a single resolved file first |
| Environment variable resolution | ${VAR} appears in real compose files | Browser has no access to the user's environment; .env file content is unknown; substituting wrong values could mask real issues | Flag unresolved ${VAR} references as informational; suggest the user substitute values before pasting |
| Version migration tool | Converting between compose v2/v3 formats | The `version` field is deprecated; modern Compose ignores it; migration complexity for minimal value | Flag deprecated version field with rule CV-B006; recommend simply removing it |
| AI-powered analysis | Trendy, seems powerful | Contradicts human-expertise positioning of the portfolio; requires API calls (not zero-backend); unpredictable suggestions | Expert-written rule explanations with production consequences (the existing approach) |
| Docker Hub image verification | Check if images exist in registries | Requires network calls to Docker Hub API; rate-limited; can be slow; some images are in private registries | Validate image reference format; flag `latest` and untagged images |
| Kubernetes manifest generation | Convert compose to K8s | Massive scope; Kompose already exists for this; not a validation concern | Out of scope entirely; link to Kompose in companion blog post |
| Profile-aware validation | Validate per-profile subsets | Adds significant complexity; profiles are a deployment concern not a validation concern | Validate the full file; profiles do not create invalid configurations |

---

## Feature Dependencies

```
[YAML Parser (yaml npm pkg)]
    |
    +--requires--> [Schema Validation (ajv + compose-spec.json)]
    |
    +--requires--> [Semantic Analysis Engine]
    |                  |
    |                  +--requires--> [Dependency Graph Builder]
    |                  |                  |
    |                  |                  +--enables--> [Interactive Dependency Graph (React Flow)]
    |                  |                  |
    |                  |                  +--enables--> [Cycle Detection + Visual Highlighting]
    |                  |
    |                  +--enables--> [Port Conflict Detection]
    |                  +--enables--> [Orphan Resource Detection]
    |                  +--enables--> [Cross-Reference Validation]
    |
    +--requires--> [Security Rules]
    +--requires--> [Best Practice Rules]
    +--requires--> [Style Rules]

[Scoring Engine (adapted from Dockerfile Analyzer)]
    |
    +--requires--> [All rule categories producing violations]
    +--enables--> [Score Gauge Component]
    +--enables--> [Category Breakdown Panel]
    +--enables--> [Badge Generator]
    +--enables--> [URL State (shareable links)]

[CodeMirror 6 Editor]
    |
    +--requires--> [@codemirror/lang-yaml]
    +--enables--> [Inline Annotations]
    +--enables--> [Click-to-navigate from violations]

[Rule Documentation Pages]
    |
    +--requires--> [Rule definitions with explanations and fix suggestions]
    +--enables--> [SEO indexable pages (44+)]

[Interactive Dependency Graph]
    |
    +--requires--> [Dependency Graph Builder (from semantic analysis)]
    +--requires--> [React Flow + layout engine]
    +--enables--> [Network topology overlay]
    +--enables--> [Volume sharing visualization]
```

### Dependency Notes

- **YAML Parser is foundational:** Everything depends on parsing YAML into a document model with line/column positions. The `yaml` npm package provides this via its Document API and LineCounter class.
- **Schema validation before semantic analysis:** Schema errors should be caught first; if the YAML is structurally invalid, semantic analysis may produce confusing results.
- **Dependency graph builder is shared:** Both the semantic rules (cycle detection, undefined service refs) and the visual graph need the same underlying graph data structure.
- **React Flow depends on graph builder:** The interactive visualization renders data computed by the semantic analysis phase.
- **Scoring depends on all rules:** The scorer needs violations from all categories to compute weighted scores.
- **Rule docs are decoupled:** Per-rule documentation pages are build-time Astro pages, independent of runtime analysis logic.

---

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the concept and ship.

- [ ] YAML parsing with line numbers (yaml npm package + LineCounter) -- foundational for everything
- [ ] Schema validation via ajv + compose-spec.json (~8 rules) -- structural correctness baseline
- [ ] Semantic analysis engine (~15 rules) -- port conflicts, circular deps, undefined references, orphan resources -- the core value
- [ ] Security rules (~14 rules) -- privileged mode, socket exposure, secrets in env, capabilities -- the expert differentiator
- [ ] Best practice rules (~12 rules) -- healthchecks, restart policies, resource limits, image pinning -- production readiness
- [ ] Style rules (~3 rules) -- alphabetical ordering, port quoting -- minimal effort, completeness
- [ ] Category-weighted scoring with letter grades -- adapted from Dockerfile Analyzer scorer
- [ ] CodeMirror 6 editor with YAML highlighting -- adapted from Dockerfile Analyzer
- [ ] Pre-loaded sample compose file with deliberate issues across all categories
- [ ] Inline annotations (squiggly underlines + gutter markers)
- [ ] Score gauge, category breakdown, violation list
- [ ] Per-rule documentation pages (44+ pages at /tools/compose-validator/rules/[code])
- [ ] Score badge download (PNG)
- [ ] Shareable URL state (lz-string)
- [ ] Interactive dependency graph with React Flow -- the headline differentiator
- [ ] Cycle detection with red highlighting in the graph
- [ ] Companion blog post
- [ ] OG images, homepage callout, header navigation, JSON-LD, breadcrumbs
- [ ] Accessibility audit (keyboard nav, screen reader, WCAG 2.1 AA)
- [ ] Lighthouse 90+ on all new pages

### Add After Validation (v1.x)

Features to add once core is working and user feedback is available.

- [ ] Network topology overlay on dependency graph -- color-coded network membership showing communication paths
- [ ] Volume sharing visualization on dependency graph -- which services share named volumes
- [ ] Graph export as PNG/SVG -- download the dependency visualization
- [ ] Rule severity configuration -- allow users to adjust severity levels (similar to DCLint's configurable rules)
- [ ] Additional semantic rules based on user feedback

### Future Consideration (v2+)

Features to defer until the tool has proven its value.

- [ ] YAML formatting / prettification (low value, many tools already do this)
- [ ] Compose file templates library (curated example files for common stacks)
- [ ] Side-by-side comparison mode (compare two compose files)
- [ ] Integration with Dockerfile Analyzer (validate Dockerfiles referenced in `build` sections)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Notes |
|---------|------------|---------------------|----------|-------|
| Schema validation (ajv) | HIGH | MEDIUM | P1 | Foundation -- catches structural errors before semantic analysis |
| Semantic analysis (port conflicts, circular deps, refs) | HIGH | HIGH | P1 | Core value proposition -- what no browser tool does well |
| Security rules (OWASP-aligned) | HIGH | MEDIUM | P1 | Expert differentiator -- maps to real-world security concerns |
| Best practice rules | HIGH | MEDIUM | P1 | Production readiness guidance |
| Category-weighted scoring | HIGH | LOW | P1 | Proven pattern from Dockerfile Analyzer |
| CodeMirror 6 YAML editor | HIGH | LOW | P1 | Adapted from existing implementation |
| Inline annotations | HIGH | LOW | P1 | Direct reuse |
| Score gauge + category breakdown + violations | HIGH | LOW | P1 | Direct reuse |
| Interactive dependency graph (React Flow) | HIGH | HIGH | P1 | Headline differentiator -- no competing tool has this |
| Per-rule documentation pages | HIGH | MEDIUM | P1 | 44+ SEO pages, proven traffic driver |
| Score badge + shareable URL | MEDIUM | LOW | P1 | Low cost, proven sharing feature |
| Companion blog post | MEDIUM | MEDIUM | P1 | SEO content pillar |
| OG images + JSON-LD + site integration | MEDIUM | LOW | P1 | Standard site integration |
| Style rules | LOW | LOW | P1 | Minimal effort for completeness |
| Network topology overlay | MEDIUM | MEDIUM | P2 | Enhances graph but not essential for launch |
| Volume sharing visualization | MEDIUM | MEDIUM | P2 | Same -- enhances graph |
| Graph PNG/SVG export | LOW | LOW | P2 | Nice to have |
| Rule severity configuration | LOW | MEDIUM | P3 | Power user feature |

---

## Competitor Feature Analysis

| Feature | DCLint (CLI) | Code Pathfinder | onewebcare.com | multitools.ovh | Our Approach |
|---------|-------------|-----------------|----------------|----------------|-------------|
| Schema validation | Yes (built-in pre-check) | No (security only) | Basic | Basic | ajv + compose-spec.json -- full spec compliance |
| Semantic analysis | Limited (ports, names) | No | Basic deps/refs | Claims 10 types | Deep: 15 rules covering ports, deps, refs, orphans, cycles |
| Security rules | 5 rules | 10 rules (CWE-mapped) | None | Claims "best practices" | 14 rules, OWASP + CWE mapped |
| Best practice rules | 4 rules | None | Mentions recommendations | Unclear | 12 rules covering healthchecks, restart, resources, images |
| Scoring system | None | None | Pass/fail | Pass/fail | Category-weighted 0-100 with letter grades |
| Dependency graph | None | None | None | None | React Flow interactive graph with cycle detection |
| Inline annotations | N/A (CLI) | N/A (CLI) | None | None | CodeMirror squiggly underlines + gutter markers |
| Per-rule docs | Markdown docs | CWE references | None | None | 44+ dedicated pages with expert explanations |
| Auto-fix | Yes (style rules) | No | No | No | No (anti-feature) -- fix suggestions in docs instead |
| Browser-based | No | No | Yes | Yes | Yes |
| Badge/sharing | No | No | No | No | PNG badge + lz-string URL |
| Expert explanations | Basic descriptions | Good CWE context | Generic tips | Generic tips | Production consequence narratives (proven in Dockerfile Analyzer) |

---

## Rule Naming Convention

Following the established pattern:

- **Dockerfile Analyzer:** DL-prefixed (Hadolint-compatible) and PG-prefixed (custom)
- **Compose Validator:** CV-prefixed (Compose Validator custom), with sub-prefixes for categories:
  - `CV-S0xx` -- Schema validation
  - `CV-M0xx` -- seMantic analysis (M to avoid collision with S)
  - `CV-C0xx` -- seCurity
  - `CV-B0xx` -- Best practices
  - `CV-F0xx` -- Formatting/style

This gives each rule a unique, predictable code that maps to a documentation URL: `/tools/compose-validator/rules/cv-s001`.

---

## Sample Compose File Design

The pre-loaded sample should contain deliberate issues across ALL categories (mirroring the Dockerfile Analyzer's approach):

```yaml
# Sample compose file with deliberate issues for demonstration
version: "3.8"

services:
  web:
    image: nginx:latest
    privileged: true
    ports:
      - 80:80
      - 443:443
    environment:
      - DATABASE_PASSWORD=supersecret123
      - API_KEY=sk-1234567890abcdef
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /data
    depends_on:
      - api

  api:
    image: myapp
    ports:
      - 80:3000
    network_mode: host
    cap_add:
      - SYS_ADMIN
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres
    environment:
      POSTGRES_PASSWORD: mysecretpassword
    volumes:
      - db-data:/var/lib/postgresql/data

  worker:
    build: ./worker
    image: myworker:latest
    depends_on:
      - api
      - worker

  cache:
    image: redis:latest
    networks:
      - backend

volumes:
  db-data:
  unused-volume:

networks:
  frontend:
```

This sample triggers:
- **Schema:** deprecated `version` field
- **Semantic:** duplicate port 80, self-referencing dependency (worker), undefined network ref (backend from cache), orphan volume (unused-volume), orphan network (frontend), healthcheck dependency without healthcheck (api->db), undefined service dependency (worker->worker self-ref)
- **Security:** privileged mode, Docker socket mount, secrets in env vars, host network mode, SYS_ADMIN capability, unbound ports, latest tags
- **Best practice:** no healthchecks, no restart policies, no resource limits, both build and image, anonymous volume, latest/untagged images, no logging config
- **Style:** services not alphabetical

---

## Sources

### Primary (HIGH confidence)
- [compose-spec JSON Schema](https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json) -- Draft 7, authoritative schema
- [Docker Compose Services Reference](https://docs.docker.com/reference/compose-file/services/) -- official service configuration docs
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) -- security rule foundation
- [Code Pathfinder COMPOSE-SEC Rules](https://codepathfinder.dev/blog/announcing-docker-compose-security-rules) -- 10 CWE-mapped security rules
- [DCLint GitHub](https://github.com/zavoloklom/docker-compose-linter) -- 15 rules across 4 categories, auto-fix patterns
- [Docker Compose Networking](https://docs.docker.com/compose/how-tos/networking/) -- network isolation patterns
- [Docker Resource Constraints](https://docs.docker.com/engine/containers/resource_constraints/) -- memory/CPU limits
- [Docker Secrets in Compose](https://docs.docker.com/compose/how-tos/use-secrets/) -- secrets management

### Secondary (MEDIUM confidence)
- [Semgrep docker-compose ruleset](https://semgrep.dev/p/docker-compose) -- pattern-based security rules
- [dcvalidator (ZHAW SPLab)](https://github.com/serviceprototypinglab/dcvalidator) -- academic compose validator
- [multitools.ovh Compose Validator](https://multitools.ovh/docker-compose-validator/) -- 10-category browser validator
- [onewebcare.com Compose Validator](https://onewebcare.com/docker-compose-validator/) -- browser-based with templates
- [Docker Compose port conflict issue #6708](https://github.com/docker/compose/issues/6708) -- static port duplicate detection request
- [Docker Compose circular dependency issue #7239](https://github.com/docker/compose/issues/7239) -- circular dep discussion
- [MoldStud: Common Docker Compose Mistakes](https://moldstud.com/articles/p-avoid-these-common-docker-compose-pitfalls-tips-and-best-practices) -- common mistake patterns

### Existing Codebase (VERIFIED -- these files exist and work)
- `src/lib/tools/dockerfile-analyzer/types.ts` -- LintRule interface, RuleViolation, ScoreResult
- `src/lib/tools/dockerfile-analyzer/engine.ts` -- rule engine loop pattern
- `src/lib/tools/dockerfile-analyzer/scorer.ts` -- diminishing returns scoring algorithm
- `src/lib/tools/dockerfile-analyzer/rules/index.ts` -- rule registry pattern
- `src/lib/tools/dockerfile-analyzer/rules/security/PG001-secrets-in-env.ts` -- rule implementation pattern

---
*Feature research for: Docker Compose Validator (v1.6 milestone)*
*Researched: 2026-02-22*
