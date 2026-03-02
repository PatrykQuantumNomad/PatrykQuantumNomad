# Feature Research: Cloud Architecture Patterns Visual Encyclopedia

**Domain:** Interactive visual encyclopedia for cloud/distributed systems architecture patterns
**Researched:** 2026-03-01
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist when visiting a pattern catalog. Missing any of these makes the encyclopedia feel like a half-finished blog post series rather than a reference tool.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Catalog page with pattern grid | Microsoft Azure, microservices.io, and AWS all lead with a catalog overview. Users arrive expecting to browse. | LOW | Reuse `ModelCardGrid` pattern from DB Compass. Route: `/patterns/` |
| Category grouping | Every major reference (Azure: 8 categories, microservices.io: 12 categories) groups patterns. Users scan by problem domain, not alphabetically. | LOW | 5 categories recommended (see Pattern Selection below). Render as headed sections within the grid. |
| Per-pattern detail pages | Azure devotes 2,000-4,000 words per pattern with Context/Problem, Solution, When to Use, When Not To Use. Users expect deep dives. | MEDIUM | Route: `/patterns/[slug]/`. Follow DB Compass `[slug].astro` structure with `getStaticPaths`. |
| Architecture diagram per pattern | Every serious pattern reference includes a visual. Azure uses SVG diagrams, O'Reilly books use hand-drawn illustrations. A "visual encyclopedia" without visuals is a contradiction. | HIGH | Custom SVG per pattern. This is the highest-effort table-stakes item. Budget ~2-4 hours per diagram. |
| "When to use" / "When not to use" sections | Azure and microservices.io both include these for every pattern. Architects need decision-support, not just description. | LOW | Two string arrays per pattern in the data model, rendered as bullet lists on detail pages. |
| Related patterns with links | Patterns form a connected graph (CQRS pairs with Event Sourcing, Saga relates to Compensating Transaction). Every major reference cross-links. | LOW | `relatedPatterns` array of slug strings in the JSON. Render as linked cards at bottom of detail page. |
| SEO metadata and JSON-LD | Existing pillars all have structured data (CreativeWork, BreadcrumbList). Google indexes these pages for competitive search terms. | LOW | Copy `CompassJsonLd.astro` pattern. Target keywords: "cloud architecture patterns", "microservices patterns", "distributed systems patterns". |
| Strengths and weaknesses | DB Compass has these per model. Pattern references universally discuss tradeoffs. | LOW | Two string arrays per pattern in the JSON schema. |
| Responsive mobile layout | Existing pillars are all mobile-responsive. A broken mobile experience on a new pillar undermines the whole site. | LOW | Inherits from Layout.astro. Grid cards and detail page already responsive in existing pillars. |
| Prev/next navigation between patterns | DB Compass and Beauty Index both have this. Enables sequential browsing through the collection. | LOW | Copy `ModelNav.astro` pattern from DB Compass. |

### Differentiators (Competitive Advantage)

Features that elevate this beyond "yet another pattern blog" into a tool architects bookmark and return to.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-dimensional radar chart scoring | No existing pattern catalog scores patterns across comparable dimensions. Azure maps to Well-Architected pillars (binary tags, not scores). This would be the only pattern reference with quantitative comparison across 7 dimensions. | MEDIUM | Reuse `CompassRadarChart.astro` with new dimension set. Requires defining 7 orthogonal scoring dimensions (see Scoring Dimensions below). |
| Category filter (React island) | Azure has no filtering. microservices.io has no filtering. Adding toggle-filter pills that show/hide pattern cards by category gives instant interactivity that static references lack. | LOW | Reuse `UseCaseFilter.tsx` pattern from DB Compass. Already proven with nanostores. |
| Pattern comparison picker | "Compare Circuit Breaker vs Bulkhead" with overlapping radar charts. No existing pattern reference offers side-by-side quantitative comparison. | MEDIUM | Adapt `VsComparePicker.tsx` and `OverlayRadarChart.astro` from Beauty Index. Route: `/patterns/vs/[slug]/`. |
| Character sketches | DB Compass's character sketches ("The sprinter of the database world") and Beauty Index's character sketches are the site's signature voice. No other pattern catalog uses opinionated personality descriptions. | LOW | One `characterSketch` string field per pattern in JSON. ~1-2 sentences. |
| Complexity spectrum visualization | DB Compass uses a horizontal complexity bar positioning models from simple to complex. Patterns have a similar simple-to-complex axis (Retry is simple, Saga is complex). | LOW | Reuse `ComplexitySpectrum.astro` and `spectrum-math.ts` from DB Compass. |
| Interactive SVG diagrams | Static SVGs are table stakes. SVGs with hover states that highlight data flow paths, clickable components that show tooltips, or animated sequence flows would be unique among pattern references. | HIGH | CSS transitions on SVG elements. Keep animations subtle (opacity, stroke-dashoffset for flow arrows). |
| Scoring justifications | DB Compass provides a written justification paragraph for each dimension score. No pattern catalog does this. It turns subjective scores into defensible opinions. | MEDIUM | `justifications` object with one string per dimension key in the JSON schema. ~50-100 words each. |
| OG images per pattern | Per-pattern social sharing images showing the pattern name, radar chart, and a visual identity. Makes shared links look professional on LinkedIn/Twitter. | MEDIUM | Follow existing OG image generation pipeline. One PNG per pattern at `/open-graph/patterns/[slug].png`. |
| Decision flowchart | "I have problem X, which pattern should I use?" -- a guided decision tree. This is what architects actually need. Azure offers something similar with Well-Architected pillar mapping but it is not interactive. | HIGH | Could be a dedicated page at `/patterns/decide/` with a step-through wizard component. Defer to v1.x. |
| Share controls | URL copy, Twitter/LinkedIn share buttons. Beauty Index and DB Compass both have these. | LOW | Reuse `CompassShareControls.astro`. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Exhaustive 40+ pattern catalog | Completeness signals authority | 40+ patterns at this quality level (custom SVG + 7-dimension scoring + justifications + character sketch) would take months and create a maintenance burden. Most patterns are niche. Azure can do 40+ because they have a docs team. | Start with 13 core patterns. Expand to 20-25 over time. Each pattern added should justify its inclusion by search volume or architectural significance. |
| Code implementation examples | Azure and microservices.io include code samples | Code examples require language-specific maintenance (which language? which framework?), age quickly, and bloat the page. The value proposition is architectural understanding, not implementation tutorials. | Link to authoritative implementation references (Azure docs, microservices.io) in a "Further Reading" section per pattern. |
| Cloud-provider-specific mapping | "Here's how to implement this pattern on AWS/Azure/GCP" | Ties content to vendor specifics that change constantly. Creates maintenance burden and vendor-bias perception. | Keep patterns vendor-agnostic. Mention representative technologies (e.g., "message brokers like RabbitMQ, Kafka, or cloud-native equivalents") without mapping to specific cloud services. |
| User-submitted ratings or comments | Community engagement | Requires authentication, moderation, spam prevention, and database infrastructure. This is a static Astro site. The opinions are deliberately the author's own (consistent with Beauty Index and DB Compass positioning). | "This index is deliberately opinionated" framing. Author authority over crowd-sourced scores. |
| Real-time playground / simulator | "See the pattern in action with live message passing" | Enormous implementation complexity for marginal educational value. Requires server-side infrastructure or complex client-side simulation. | Animated SVG diagrams with step-through sequence (CSS-only, no runtime) convey flow effectively without the engineering cost. |
| Comparison matrix table (all patterns x all dimensions) | Quick overview of all scores at once | With 13 patterns x 7 dimensions = 91 cells, a table is dense but manageable. However, radar charts communicate the shape of tradeoffs more effectively than raw numbers. | Sortable scoring table (like DB Compass `CompassScoringTable.astro`) as a secondary view below the visual grid. Table supplements radar charts rather than replacing them. This is actually useful -- include it as a P1 table stakes feature. |

---

## Recommended Pattern Selection (13 Core Patterns)

Patterns selected based on: (1) frequency of appearance across Azure, AWS, and microservices.io catalogs, (2) architectural significance for cloud-native systems, (3) coverage of all 5 categories without redundancy, (4) search volume and SEO value.

### Category: Resilience (3 patterns)

| Pattern | Why Include | Category Justification |
|---------|-------------|----------------------|
| **Circuit Breaker** | Appears in all 3 major catalogs. The canonical resilience pattern. High search volume ("circuit breaker pattern" ~5K monthly). | Prevents cascading failures by failing fast when a dependency is down. |
| **Retry with Backoff** | Foundational resilience. Every distributed system needs retry logic. Azure, AWS, and microservices.io all include it. | Handles transient failures transparently with exponential backoff and jitter. |
| **Bulkhead** | Critical isolation pattern. Often paired with Circuit Breaker. Appears in Azure and microservices.io. | Isolates failures to prevent one failing component from consuming all resources. |

### Category: Data Management (3 patterns)

| Pattern | Why Include | Category Justification |
|---------|-------------|----------------------|
| **CQRS** | Appears in all 3 major catalogs. High search volume. Pairs naturally with Event Sourcing. | Separates read and write models for independent scaling and optimization. |
| **Event Sourcing** | Appears in Azure and AWS catalogs. Pairs with CQRS. Foundational for event-driven architectures. | Stores state as an append-only sequence of domain events rather than current state. |
| **Saga** | Appears in all 3 catalogs. Critical for microservices data consistency. Two sub-patterns (orchestration vs choreography) add depth. | Manages distributed transactions across services using compensating actions. |

### Category: Communication (3 patterns)

| Pattern | Why Include | Category Justification |
|---------|-------------|----------------------|
| **API Gateway** | Universal in microservices architectures. Appears in microservices.io as a core pattern. High search volume. | Single entry point that routes, aggregates, and cross-cuts concerns for client requests. |
| **Pub/Sub (Publisher-Subscriber)** | Appears in Azure and AWS. The foundational async communication pattern. | Decouples producers from consumers through topic-based event distribution. |
| **Backends for Frontends (BFF)** | Appears in Azure. Increasingly important with mobile/web/API client diversity. | Creates dedicated backend services tailored to each frontend's specific needs. |

### Category: Structural (2 patterns)

| Pattern | Why Include | Category Justification |
|---------|-------------|----------------------|
| **Sidecar** | Appears in Azure and microservices.io. Critical for Kubernetes/service mesh architectures. Directly relevant to the author's K8s expertise. | Deploys auxiliary processes alongside the main container for cross-cutting concerns. |
| **Strangler Fig** | Appears in all 3 catalogs. The canonical migration pattern. Every organization with legacy systems needs this. | Incrementally replaces legacy system functionality by routing traffic to new implementations. |

### Category: Scaling (2 patterns)

| Pattern | Why Include | Category Justification |
|---------|-------------|----------------------|
| **Cache-Aside** | Appears in Azure. Universally needed. Simple enough to be a good entry-level pattern but has real tradeoffs. | Loads data into cache on demand, improving read performance while managing staleness. |
| **Queue-Based Load Leveling** | Appears in Azure. Essential for decoupling producers from consumers and handling traffic spikes. | Uses a queue as a buffer between task submission and processing to smooth load spikes. |

### Pattern Selection Rationale

**Why 13 and not 10 or 15:** 13 covers all 5 categories with at least 2 patterns each (needed for meaningful within-category comparison on radar charts) without overcommitting on content production. Each pattern requires: custom SVG diagram, 7-dimension scoring with justifications, character sketch, when-to-use/avoid lists, strengths/weaknesses, and related patterns. At ~4-6 hours per pattern, 13 patterns = 52-78 hours of content work.

**Why these 5 categories:** They map to the fundamental concerns of distributed systems architecture:
- **Resilience** -- How does the system handle failure?
- **Data Management** -- How does the system manage state and transactions?
- **Communication** -- How do services talk to each other?
- **Structural** -- How are services organized and deployed?
- **Scaling** -- How does the system handle growing load?

**Patterns deliberately excluded:**
- **Choreography** -- Covered within Saga (choreography vs orchestration is a Saga sub-topic)
- **Event-Driven Architecture** -- Too broad; it is an architectural style, not a pattern. Pub/Sub + Event Sourcing cover the concrete patterns.
- **Service Mesh** -- Infrastructure concern, not an application pattern. Sidecar covers the pattern that underlies service mesh.
- **Materialized View** -- Covered as a sub-topic within CQRS (CQRS with materialized read models).
- **Compensating Transaction** -- Covered within Saga (compensating actions are the mechanism sagas use).
- **Leader Election** -- Niche. Important but rarely a decision point for application architects. Add in v1.x expansion.
- **Throttling / Rate Limiting** -- Closely related to Bulkhead and Queue-Based Load Leveling. Add in v1.x if search demand warrants.

---

## Scoring Dimensions (7 Dimensions)

Designed to be orthogonal (each measures something different), relevant (architects actually care about these tradeoffs), and compatible with the existing radar chart infrastructure (DB Compass uses 8 dimensions on an octagonal chart; 7 produces a heptagonal chart which renders cleanly).

| Dimension | Key | Short Name | Description (what it measures) | Why Orthogonal |
|-----------|-----|------------|-------------------------------|----------------|
| **Scalability Impact** | `scalability` | Scale | How much the pattern improves or enables horizontal scaling; 1 = no scaling benefit, 10 = enables near-linear horizontal scale. | Measures throughput capacity. Independent of latency, coupling, or operational burden. |
| **Resilience Gain** | `resilience` | Resil | How much the pattern improves fault tolerance and graceful degradation; 1 = no resilience benefit, 10 = system survives cascading failures. | Measures failure handling. A pattern can be highly resilient but complex (Circuit Breaker) or simple but fragile. |
| **Complexity Cost** | `complexity` | Cmplx | Inverse: how simple the pattern is to implement and maintain; 1 = requires distributed systems expertise to implement correctly, 10 = straightforward to implement in any codebase. | Measures implementation burden. Independent of what the pattern achieves -- CQRS is powerful but complex, Retry is simple but limited. |
| **Coupling** | `coupling` | Coupl | How much the pattern reduces inter-service coupling; 1 = creates tight dependencies between services, 10 = fully decouples services with zero direct knowledge of each other. | Measures architectural independence. Orthogonal to resilience (tightly coupled systems can still be resilient via retry). |
| **Data Consistency** | `consistency` | Consis | How well the pattern preserves data consistency guarantees; 1 = introduces eventual consistency with complex conflict resolution, 10 = maintains strong consistency with no additional effort. | Measures correctness guarantees. Independent of performance -- strong consistency often costs latency but that is captured separately. |
| **Latency Impact** | `latency` | Latcy | How the pattern affects request latency; 1 = adds significant latency (extra network hops, async processing), 10 = reduces or does not affect end-to-end latency. | Measures speed impact. Independent of throughput (a pattern can improve throughput while adding latency). |
| **Observability** | `observability` | Obsrv | How easy the pattern makes it to monitor, debug, and trace behavior; 1 = creates opaque distributed flows that are hard to trace, 10 = produces clear, linear flows that are easy to monitor and debug. | Measures operational visibility. Independent of complexity -- a simple pattern with poor logging is hard to observe; a complex one with good tracing is easy. |

### Dimension Rationale

**Why 7 and not 8 (like DB Compass):** Seven dimensions produce a clean heptagonal radar chart. More importantly, 7 is the right number of truly orthogonal concerns for architecture patterns. Adding an 8th would require either splitting a dimension (breaking orthogonality) or adding a dimension like "Ecosystem Maturity" which does not meaningfully differentiate patterns (all 13 selected patterns are well-established).

**Why these 7:**
- **Scalability + Resilience** are the two core "what does the pattern give you?" dimensions.
- **Complexity + Coupling** are the two core "what does the pattern cost you?" dimensions.
- **Consistency + Latency** are the two core tradeoff dimensions that the CAP theorem and distributed systems theory identify as fundamental tensions.
- **Observability** captures the operational reality that patterns which are theoretically elegant can be nightmares to debug in production.

**Dimensions deliberately excluded:**
- **Performance** -- Overlaps with Latency + Scalability. "Performance" is too vague as a standalone dimension.
- **Security** -- Most patterns are security-neutral. Only a few (API Gateway, Sidecar) have direct security implications. Not orthogonal enough across 13 patterns.
- **Learning Curve** -- Correlates too strongly with Complexity. If it is hard to implement, it is hard to learn.
- **Ecosystem Maturity** -- All 13 selected patterns are mature, well-documented, and widely adopted. This dimension would not differentiate them.
- **Cost** -- Cloud cost impact is too dependent on implementation specifics and cloud provider pricing to score meaningfully at the pattern level.

### Sample Scoring (3 patterns to illustrate dimension utility)

| Dimension | Circuit Breaker | CQRS | Retry with Backoff |
|-----------|----------------|------|-------------------|
| Scalability | 3 | 9 | 2 |
| Resilience | 9 | 3 | 7 |
| Complexity | 6 | 3 | 9 |
| Coupling | 5 | 6 | 8 |
| Consistency | 8 | 4 | 8 |
| Latency | 7 | 5 | 4 |
| Observability | 7 | 4 | 8 |

These scores produce distinct radar chart shapes: Circuit Breaker has a resilience spike, CQRS has a scalability spike with a complexity trough, Retry is balanced and simple. This confirms the dimensions differentiate patterns effectively.

---

## Feature Dependencies

```
Content Collection (Zod schema + JSON data file)
    |-- required by --> Catalog Page (/patterns/)
    |                       |-- requires --> Category Filter (React island)
    |                       |-- requires --> Complexity Spectrum
    |                       |-- requires --> Pattern Card Grid
    |                       |-- requires --> Scoring Table
    |
    |-- required by --> Detail Pages (/patterns/[slug]/)
    |                       |-- requires --> Radar Chart
    |                       |-- requires --> Score Breakdown
    |                       |-- requires --> SVG Architecture Diagrams (per-pattern)
    |                       |-- requires --> Share Controls
    |                       |-- requires --> Prev/Next Nav
    |                       |-- requires --> JSON-LD structured data
    |
    |-- required by --> Comparison Pages (/patterns/vs/[slug]/)
                            |-- requires --> Overlay Radar Chart
                            |-- requires --> Compare Picker (React island)

SVG Architecture Diagrams ──blocks──> Detail Pages (cannot ship detail pages without diagrams)

Category Filter ──reuses──> UseCaseFilter pattern (nanostores + React)
Radar Chart ──reuses──> CompassRadarChart (DB Compass)
Compare Picker ──reuses──> VsComparePicker (Beauty Index)
Scoring Table ──reuses──> CompassScoringTable (DB Compass)
Complexity Spectrum ──reuses──> ComplexitySpectrum (DB Compass)
```

### Dependency Notes

- **Content Collection must come first:** Everything depends on the Zod schema and JSON data file. This is the foundation.
- **SVG diagrams block detail page launch:** Detail pages without architecture diagrams are the single biggest quality gap. These are the highest-effort individual items.
- **Catalog page can launch before detail pages:** The catalog page with cards, filtering, and the scoring table provides value even if detail pages are still in progress. Ship catalog first.
- **Comparison pages depend on detail pages:** Cannot compare patterns that do not have detail pages yet. Ship comparisons last.
- **All React islands reuse existing patterns:** No new React component architecture. Adapt existing UseCaseFilter, VsComparePicker, and nanostores infrastructure.

---

## MVP Definition

### Launch With (v1)

The minimum set that delivers a complete, usable pattern encyclopedia.

- [ ] **Content collection** -- Zod schema, JSON data file with all 13 patterns, content.config.ts registration
- [ ] **Catalog page** (`/patterns/`) -- Pattern card grid grouped by category, scoring table, complexity spectrum
- [ ] **Category filter** -- React island with 5 toggle pills (Resilience, Data Management, Communication, Structural, Scaling)
- [ ] **Detail pages** (`/patterns/[slug]/`) -- All 13 patterns with: summary, character sketch, radar chart, score breakdown, strengths/weaknesses, when to use/avoid, related patterns, prev/next nav
- [ ] **SVG architecture diagrams** -- One custom SVG per pattern (13 total)
- [ ] **SEO metadata** -- JSON-LD CreativeWork per pattern, BreadcrumbList, OG meta tags
- [ ] **Header navigation** -- Add "Patterns" to site navigation

### Add After Validation (v1.x)

Features to add once the core 13 patterns are live and generating traffic.

- [ ] **Pattern comparison pages** (`/patterns/vs/[slug]/`) -- Side-by-side radar chart overlay. Trigger: after all 13 detail pages are live
- [ ] **Interactive SVG diagrams** -- Hover states, flow animation, clickable components. Trigger: after base SVGs are solid and user feedback confirms demand
- [ ] **Scoring justifications** -- Written paragraph per dimension per pattern (91 paragraphs total). Trigger: when organic search traffic confirms the pillar is worth the investment
- [ ] **OG images per pattern** -- Auto-generated social sharing images. Trigger: before any social promotion campaign
- [ ] **Additional patterns** (expand to 18-20) -- Add Event-Driven Architecture (as a style overview), Service Mesh, Outbox, Materialized View, Throttling. Trigger: when initial 13 are fully polished

### Future Consideration (v2+)

- [ ] **Decision flowchart** (`/patterns/decide/`) -- Interactive wizard: "I need to handle [problem]" leads to pattern recommendation. Defer because it requires significant UX design and testing.
- [ ] **Pattern relationship graph** -- D3.js force-directed graph showing how patterns connect. Defer because it is visually impressive but low practical utility compared to inline related-pattern links.
- [ ] **Blog series tie-in** -- "Pattern of the Month" deep-dive posts linking back to encyclopedia entries. Defer until encyclopedia is established.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Content collection + schema | HIGH | LOW | P1 |
| Catalog page with grid | HIGH | LOW | P1 |
| Category filter | HIGH | LOW | P1 |
| Detail pages (13) | HIGH | MEDIUM | P1 |
| SVG diagrams (13) | HIGH | HIGH | P1 |
| Radar charts | HIGH | LOW | P1 |
| Score breakdown | MEDIUM | LOW | P1 |
| Prev/next navigation | MEDIUM | LOW | P1 |
| SEO metadata + JSON-LD | HIGH | LOW | P1 |
| Complexity spectrum | MEDIUM | LOW | P1 |
| Scoring table | MEDIUM | LOW | P1 |
| Share controls | LOW | LOW | P1 |
| Character sketches | MEDIUM | LOW | P1 |
| Pattern comparison pages | MEDIUM | MEDIUM | P2 |
| Interactive SVG animations | MEDIUM | HIGH | P2 |
| Scoring justifications | MEDIUM | MEDIUM | P2 |
| OG images per pattern | MEDIUM | MEDIUM | P2 |
| Additional patterns (18-20) | MEDIUM | HIGH | P2 |
| Decision flowchart | HIGH | HIGH | P3 |
| Pattern relationship graph | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (13 patterns with full detail pages, catalog, filtering, radar charts)
- P2: Should have, add after initial launch validates the pillar
- P3: Nice to have, future consideration after traffic and engagement data

---

## Competitor Feature Analysis

| Feature | Azure Architecture Center | microservices.io | AWS Prescriptive Guidance | Our Approach |
|---------|--------------------------|-----------------|--------------------------|--------------|
| Pattern count | ~40 | ~44 | ~14 | 13 (curated, not exhaustive) |
| Visual diagrams | Static SVG per pattern | Minimal/none | Minimal | Custom SVG per pattern, interactive in v1.x |
| Scoring/comparison | Binary pillar tags | None | None | 7-dimension quantitative scoring with radar charts -- **unique** |
| Filtering | None | None | None | Category toggle filter -- **unique** |
| Side-by-side comparison | None | None | None | Pattern vs pattern with overlay radar -- **unique** |
| Character/personality | None (dry technical prose) | None | None | Opinionated character sketches -- **unique** |
| Code examples | Yes (C#/Azure specific) | Yes (Java) | Yes (AWS specific) | No (vendor-agnostic by design) |
| When to use/avoid | Yes | Partial | Partial | Yes, with structured data |
| Related patterns | Yes | Yes | Partial | Yes, bidirectional links |
| Complexity indicator | No | No | No | Complexity spectrum bar -- **unique** |
| Mobile responsive | Yes | Partial | Yes | Yes |
| Social sharing | No | No | No | Per-pattern share controls -- **unique** |
| SEO structured data | Minimal | No | No | Full JSON-LD per pattern -- **unique** |

**Competitive advantage summary:** The major pattern references are text-heavy documentation sites with no quantitative comparison, no filtering, no interactivity, and no visual personality. Our approach brings the DB Compass treatment (scoring + radar charts + character sketches + filtering) to architecture patterns, creating the only pattern reference that lets you visually compare tradeoffs across dimensions.

---

## Sources

- [Azure Architecture Center - Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) -- 40+ patterns, 8 categories, per-pattern pages with Context/Problem, Solution, When to Use, Considerations, Example
- [microservices.io - Pattern Language](https://microservices.io/patterns/) -- 44+ patterns by Chris Richardson, organized by decomposition, data, communication, deployment, testing, observability
- [AWS Prescriptive Guidance - Cloud Design Patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/introduction.html) -- 14 patterns focused on modernization and microservices
- [Martin Fowler - Patterns of Distributed Systems](https://martinfowler.com/articles/patterns-of-distributed-systems/) -- Distributed systems pattern catalog with academic rigor
- [FreeCodeCamp - Design Patterns for Distributed Systems Handbook](https://www.freecodecamp.org/news/design-patterns-for-distributed-systems/) -- Community overview of core patterns and tradeoffs
- [Cloud Native Architecture Patterns 2026 Guide](https://clearfuze.com/blog/cloud-native-architecture-patterns/) -- Contemporary pattern overview with current relevance
- [Azure Circuit Breaker Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) -- Detailed reference for pattern page structure (Context/Problem, Solution, Considerations, When to Use, Example)
- [Azure CQRS Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs) -- Detailed reference for data management pattern depth
- Existing site pillars (DB Compass, Beauty Index) analyzed for reusable component patterns, data model structure, and interaction patterns

---
*Feature research for: Cloud Architecture Patterns Visual Encyclopedia*
*Researched: 2026-03-01*
