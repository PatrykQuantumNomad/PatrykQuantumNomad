# Feature Research: Database Compass Interactive Explorer

**Domain:** Interactive browser-based database model comparison and exploration tool on a portfolio site
**Researched:** 2026-02-21
**Confidence:** HIGH
**Scope:** Database Compass at /tools/db-compass/ with 12 model categories, 8 scoring dimensions, complexity spectrum visualization, overview + detail pages, and companion blog post

---

## Existing Infrastructure (Already Built)

These capabilities exist on patrykgolabek.dev and directly inform what Database Compass can leverage:

| Capability | Where | Reuse Potential |
|------------|-------|-----------------|
| **Beauty Index pattern** | `src/data/beauty-index/languages.json`, scoring schema, radar charts, tiers, detail pages | MIRROR -- Database Compass follows the same data model pattern: entries with multi-dimensional scores, tier grouping, overview+detail pages |
| **OG image generation** | `src/lib/og-image.ts` using Satori + Sharp | EXTEND -- generate OG images for overview and each detail page |
| **SEO component** | `src/components/SEOHead.astro` | DIRECT -- accepts ogImage, ogType, tags, description |
| **JSON-LD structured data** | Multiple JsonLd components (BeautyIndexJsonLd, BreadcrumbJsonLd) | EXTEND -- add Dataset or TechArticle schema for database entries |
| **Radar chart component** | `src/components/beauty-index/RadarChart.astro` | ADAPT -- 8 axes instead of 6, same SVG rendering approach |
| **Score breakdown component** | `src/components/beauty-index/ScoreBreakdown.astro` | ADAPT -- different dimension names, same bar display pattern |
| **Tier badge system** | `src/lib/beauty-index/tiers.ts` | ADAPT -- new tier definitions for complexity levels |
| **Content collections** | Astro Content Collections with Zod schema | DIRECT -- new collection for database models |
| **Tailwind CSS** | Already configured with typography plugin | DIRECT -- style all tool components |
| **Sitemap + RSS** | @astrojs/sitemap, @astrojs/rss | DIRECT -- new pages auto-included |
| **GSAP animations** | ScrollTrigger, scroll-animations, stagger reveals | DIRECT -- animate grid cards, score reveals, complexity spectrum |
| **Share controls** | `src/components/beauty-index/ShareControls.astro` | ADAPT -- SVG-to-PNG share for database model radar charts |
| **VS comparison pages** | `src/pages/beauty-index/vs/[slug].astro` | OPTIONAL -- could enable "PostgreSQL vs MongoDB" comparison pages |
| **Tools landing page** | `src/pages/tools/index.astro` | EXTEND -- add Database Compass card alongside Dockerfile Analyzer |

---

## How Database Comparison Guides Work (Ecosystem Analysis)

### Content Structure Patterns

All major database comparison resources follow one of three structural approaches:

**Pattern 1: Encyclopedic Catalog (DB-Engines, dbdb.io)**

DB-Engines catalogs 433 database systems across 20 categories. Each entry has standardized properties: data model, query language, licensing, replication method, concurrency control, and system architecture. This is comprehensive but overwhelming -- useful for experts who already know what they need, intimidating for developers making their first architecture decision.

dbdb.io (Database of Databases from Carnegie Mellon) tracks 1,070 systems with deep technical properties: concurrency control mechanisms, index types, isolation levels, join strategies, storage architecture. Academic in depth, not designed for quick decision-making.

**Pattern 2: Narrative Guide (Prisma Data Guide, DigitalOcean)**

Prisma covers 6 broad categories (Legacy, Relational, NoSQL, NewSQL, Multi-model, Other) with narrative analysis organized around historical context, use cases, data structure, access patterns, scalability, schema flexibility, and trade-offs. Good for learning, but not scannable. No scoring, no visual comparison.

DigitalOcean provides conceptual articles per database type with architecture descriptions, use case applications, and comparative details. Well-written but text-heavy and spread across many separate articles.

**Pattern 3: Decision Tree (Azure Architecture Center, AWS)**

Azure provides a structured decision tree: "What level of control do you need?" leads to "Is it relational?" leads to specific service recommendations. AWS uses a "purpose-built databases" framework grouping by workload type: relational, key-value, document, graph, time-series, ledger, in-memory, search.

Useful for making a decision, but vendor-locked and not technology-neutral.

**Key insight:** No existing resource combines visual scoring + narrative depth + complexity mapping + opinionated recommendations in a single, interactive tool. The Beauty Index pattern -- visual scores + character sketches + expert analysis -- applied to database models would be genuinely novel.

### What Developers Actually Search For

Based on SEO research, developer database queries fall into these patterns:

| Query Pattern | Example | Content Type Needed |
|---------------|---------|---------------------|
| **"What is X"** | "what is a document database" | Model detail page with clear definition |
| **"X vs Y"** | "postgresql vs mongodb", "redis vs memcached" | Head-to-head comparison page |
| **"When to use X"** | "when to use graph database" | Use case analysis with decision criteria |
| **"Best database for Y"** | "best database for real-time analytics" | Decision guide mapping use cases to models |
| **"X pros and cons"** | "nosql pros and cons" | Balanced analysis with trade-offs |
| **"Types of databases"** | "types of databases explained" | Overview page with visual taxonomy |

The Database Compass should target all these query patterns through its page structure.

---

## Database Model Categories (Research Synthesis)

### Category Selection Rationale

DB-Engines uses 20 categories. Most guides cover 6-11. The right number for Database Compass is **12** -- enough for comprehensive coverage without including niche categories (Multivalue DBMS, Navigational DBMS, Native XML) that most developers never encounter.

### Recommended 12 Categories

| # | Category | Why Include | Complexity Level | Representative Examples |
|---|----------|-------------|------------------|------------------------|
| 1 | **Relational (SQL)** | Foundation of database knowledge, highest adoption, every developer encounters these | Moderate | PostgreSQL, MySQL, SQLite, Oracle, SQL Server |
| 2 | **Document** | Most popular NoSQL model, JSON-native, dominant in web development | Moderate | MongoDB, CouchDB, Amazon DocumentDB, Firestore |
| 3 | **Key-Value** | Simplest model, caching cornerstone, gateway to NoSQL understanding | Simple | Redis, Memcached, DynamoDB (KV mode), etcd |
| 4 | **Wide-Column** | Big data foundation, distinct from relational despite superficial similarity | Complex | Apache Cassandra, HBase, ScyllaDB, Google Bigtable |
| 5 | **Graph** | Relationship-centric data, growing rapidly for AI/knowledge graphs | Complex | Neo4j, Amazon Neptune, ArangoDB (graph mode), TigerGraph |
| 6 | **Time-Series** | IoT, observability, metrics -- fastest-growing category per DB-Engines | Moderate | InfluxDB, TimescaleDB, QuestDB, Amazon Timestream |
| 7 | **Search Engine** | Full-text search, log analytics, a distinct model developers use daily | Moderate | Elasticsearch, OpenSearch, Apache Solr, Meilisearch |
| 8 | **Vector** | AI/ML era essential, embedding storage for RAG and semantic search | Complex | Pinecone, Weaviate, Milvus, Chroma, pgvector |
| 9 | **In-Memory** | Performance-critical layer, caching and real-time processing | Moderate | Redis (again, dual-role), Memcached, Apache Ignite, Hazelcast |
| 10 | **NewSQL** | Distributed SQL solving CAP theorem trade-offs, the "best of both worlds" promise | Complex | CockroachDB, TiDB, YugabyteDB, Google Spanner |
| 11 | **Object-Oriented** | Niche but historically important, maps to OOP paradigms | Complex | db4o, ObjectDB, Versant |
| 12 | **Multi-Model** | Modern convergence trend, one engine for multiple data models | Complex | ArangoDB, Cosmos DB, FaunaDB, SurrealDB |

**Categories deliberately excluded:**

| Excluded Category | DB-Engines Count | Why Excluded |
|-------------------|------------------|--------------|
| RDF Stores | 21 | Semantic web niche; covered briefly under Graph |
| Spatial DBMS | 8 | Extension of relational (PostGIS); mentioned in Relational detail page |
| Native XML DBMS | 7 | Legacy/declining; XML databases peaked in 2005 |
| Multivalue DBMS | 10 | Mainframe legacy; no modern developer relevance |
| Navigational DBMS | 2 | Historical only; pre-relational era artifact |
| Event Stores | 3 | CQRS/event-sourcing pattern, not a distinct model; mentioned in use cases |
| Content Stores | 2 | CMS-specific; too narrow |
| Columnar/OLAP | 2 (DB-Engines) but more exist | Overlaps with Wide-Column; analytics dimension covered in scoring |

### Entries Per Category

**3-5 representative databases per category is the right depth.** Here is why:

- DB-Engines tracks 166 relational databases. Listing all is useless for a comparison tool.
- Developer guides that rank well (Prisma, DigitalOcean, InterSystems) consistently highlight 2-4 examples per category.
- The tool's value is in understanding the *model*, not cataloging every implementation.
- Listing 3-5 concrete databases per model anchors abstract concepts in real technology developers recognize.
- Total: 12 categories x 3-5 examples = 36-60 named databases. This is comprehensive without being encyclopedic.

---

## Scoring Dimensions (Research Synthesis)

### How Azure/AWS/Prisma Evaluate Databases

Azure Architecture Center uses 5 evaluation domains:
1. **Functional requirements** -- data format, purpose (OLTP/OLAP), search, consistency, schema flexibility, concurrency
2. **Non-functional requirements** -- latency, throughput, scalability, reliability/availability
3. **Cost and management** -- managed vs self-hosted, licensing, portability
4. **Security and governance** -- encryption, auth, auditing
5. **DevOps and team readiness** -- skill sets, client support, tooling integration

### Recommended 8 Scoring Dimensions (4 Ops + 4 Dev)

Following the Beauty Index pattern (6 dimensions per language, 1-10 scale), Database Compass should use **8 dimensions** split into two groups. Each scored 1-10, total 80 points max.

**Operational Dimensions (how it runs):**

| Dimension | Key | What It Measures | Why It Matters |
|-----------|-----|------------------|----------------|
| **Scalability** | `scale` | Horizontal scaling ability, sharding, distributed architecture | "Can it grow with my product?" |
| **Performance** | `perf` | Raw throughput, latency characteristics, optimization ceiling | "Is it fast enough for my workload?" |
| **Reliability** | `rel` | ACID compliance, durability guarantees, fault tolerance, replication | "Can I trust it with critical data?" |
| **Operational Simplicity** | `ops` | Ease of deployment, backup/restore, monitoring, managed options | "How much will this cost me in ops time?" |

**Developer Dimensions (how it feels):**

| Dimension | Key | What It Measures | Why It Matters |
|-----------|-----|------------------|----------------|
| **Query Flexibility** | `query` | Power and expressiveness of the query language, join support, aggregation | "Can I ask complex questions of my data?" |
| **Schema Flexibility** | `schema` | Schema-on-write vs schema-on-read, migration complexity, evolution story | "How painful are schema changes?" |
| **Ecosystem Maturity** | `eco` | Tooling, ORMs, drivers, community size, documentation quality, hiring pool | "Will I find help when I'm stuck?" |
| **Learning Curve** | `learn` | Time to productivity, conceptual complexity, paradigm familiarity | "How long before my team is productive?" |

**Why 8 and not 6 or 10:**
- 6 (like Beauty Index) feels too compressed -- database selection is inherently more multi-dimensional than aesthetics
- 10+ creates decision fatigue and makes radar charts unreadable
- 8 produces a well-balanced octagonal radar chart that is visually distinct from the Beauty Index hexagon
- The 4+4 split (ops vs dev) maps to the two perspectives developers actually hold when evaluating databases

**Score interpretation:** These scores apply to the *model category*, not individual databases. PostgreSQL and MySQL both get the "Relational" scores. Individual database differences are covered in the prose and examples section of each detail page.

---

## Complexity Spectrum Visualization

### How Competitors Handle Complexity

Most guides use a simple linear spectrum from "simple" to "complex" but none provide a compelling visual representation. The typical approach:

```
Simple ←——————————————————————→ Complex
Key-Value    Document    Relational    Graph    Wide-Column
```

This is reductive. A database can be simple to learn but complex to operate (Redis), or complex to learn but simple to operate once mastered (PostgreSQL).

### Recommended: Two-Axis Complexity Map

Instead of a linear spectrum, use a 2D scatter plot:

- **X-axis: Conceptual Complexity** (how hard is the mental model?) -- ranges from "intuitive" to "paradigm shift"
- **Y-axis: Operational Complexity** (how hard is production deployment?) -- ranges from "fire and forget" to "dedicated team required"

| Category | Conceptual | Operational | Quadrant |
|----------|-----------|-------------|----------|
| Key-Value | 2 | 3 | Simple/Simple |
| Document | 3 | 4 | Simple/Simple |
| Relational | 5 | 4 | Moderate/Moderate |
| Search Engine | 5 | 5 | Moderate/Moderate |
| Time-Series | 4 | 4 | Moderate/Moderate |
| In-Memory | 3 | 5 | Simple concept, Moderate ops |
| NewSQL | 6 | 7 | Complex/Complex |
| Vector | 6 | 5 | Complex concept, Moderate ops |
| Wide-Column | 7 | 8 | Complex/Complex |
| Graph | 7 | 6 | Complex/Complex |
| Multi-Model | 7 | 6 | Complex/Complex |
| Object-Oriented | 8 | 7 | Complex/Complex |

**Visual implementation:** SVG scatter plot with labeled dots for each category. Each dot is clickable, linking to the detail page. Dots sized by ecosystem popularity (larger = more popular). Color-coded by a tier system (like Beauty Index tiers).

This is a genuine differentiator -- no existing database guide provides a two-axis complexity visualization.

---

## Detail Page Content (What Developers Expect)

### Minimum Information Per Model

Based on analysis of DB-Engines entries, Prisma Data Guide articles, DigitalOcean conceptual articles, and InterSystems guide:

| Section | What It Contains | Why Developers Expect It |
|---------|-----------------|-------------------------|
| **Definition** | 2-3 sentence clear definition of the model | "What IS this?" -- the first question |
| **Data Structure** | How data is organized (tables/documents/nodes/key-value pairs) with visual | Mental model formation |
| **Use Cases** | 3-5 concrete scenarios where this model excels | "Should I use this for MY problem?" |
| **When NOT to Use** | 2-3 anti-patterns or poor fit scenarios | Equally important as use cases |
| **Scoring Radar Chart** | 8-dimension radar chart with scores | Visual comparison at a glance |
| **Score Breakdown** | Per-dimension score with brief justification | "Why did it get a 3 on scalability?" |
| **Representative Databases** | 3-5 named databases with 1-sentence description each | Anchors abstract model to real tech |
| **Trade-offs** | Key advantages and limitations | Balanced perspective builds trust |
| **Character Sketch** | Opinionated, personality-driven description (Beauty Index pattern) | Memorable, shareable, differentiating |

### Enhanced Content (Differentiators)

| Section | What It Contains | Why It Differentiates |
|---------|-----------------|----------------------|
| **CAP Theorem Position** | Where this model falls on the CAP triangle | System design interview essential |
| **Architect's Take** | 2-3 paragraphs of opinionated expert analysis | The "17 years of experience" perspective |
| **Real-World Architecture** | "Company X uses [model] for [purpose] because [reason]" | Concrete proof points |
| **Migration Paths** | "Coming from relational? Here's how to think about [model]" | Practical onboarding |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that visitors to a database comparison tool assume exist. Missing any of these makes the tool feel incomplete. Reference points: DB-Engines, Prisma Data Guide, AWS database decision guide, DigitalOcean database types article.

| # | Feature | Why Expected | Complexity | Dependencies | Notes |
|---|---------|--------------|------------|--------------|-------|
| T1 | **Overview page with all 12 categories** | Every database guide has a landing page showing all types at a glance. Users need to see the full landscape before diving into specifics. | MEDIUM | Data model, grid layout | Follow Beauty Index pattern: hero section, ranking chart, category grid. Bento grid or sortable table. |
| T2 | **Detail page per category** | DB-Engines, Prisma, and DigitalOcean all have dedicated pages per type. Users click through from overview to learn about a specific model. | MEDIUM | T1, content authoring | 12 pages at `/tools/db-compass/[slug]/`. Each follows the detail page template above. |
| T3 | **Scoring with visual representation** | The Beauty Index sets the precedent on this site. Users who've seen the language radar charts expect the same treatment for databases. Any comparison tool without visual scoring feels incomplete. | MEDIUM | Radar chart component (adapt from Beauty Index), data model | 8-axis radar chart. SVG-based, same rendering approach as Beauty Index. |
| T4 | **Category descriptions with use cases** | Every database guide provides "when to use" guidance. This is the core decision-making content. Without it, the tool is just a list. | LOW | Content authoring | 3-5 use cases per category, written from the architect perspective. |
| T5 | **Representative database examples** | Abstract model descriptions become concrete when anchored to real databases developers know. "Document database" means less than "MongoDB, CouchDB, Firestore." | LOW | Content authoring | 3-5 named databases per category with 1-2 sentence descriptions. |
| T6 | **Responsive layout** | Portfolio tool must work on all devices. Developers check references on phones during architecture discussions. | MEDIUM | Tailwind responsive utilities | Overview grid collapses to 1-col on mobile. Radar charts scale down. Detail pages stack vertically. |
| T7 | **SEO-optimized pages** | Each of the 12 detail pages targets a long-tail query ("what is a document database", "graph database use cases"). Without proper SEO, the pages have no discovery channel. | LOW | Existing SEO infrastructure (SEOHead, JSON-LD, breadcrumbs) | Each page: unique title, meta description, JSON-LD (TechArticle or Dataset), breadcrumbs, OG image. |
| T8 | **Navigation between categories** | Users browsing database types expect easy prev/next navigation and a way to jump to any category from any detail page. | LOW | URL structure, nav component | Prev/next links (like Beauty Index LanguageNav) + sidebar or top nav listing all 12 categories. |
| T9 | **Trade-offs and limitations** | Credible database guides acknowledge weaknesses. A guide that only highlights strengths feels like marketing, not expertise. | LOW | Content authoring | Each detail page has explicit "When NOT to use" and "Limitations" sections. |
| T10 | **Consistent data model** | Users expect consistent information across all 12 categories. If one category shows use cases and another doesn't, the tool feels unfinished. | LOW | TypeScript schema, content collection | Zod schema enforces consistent fields across all 12 entries. Same sections on every detail page. |

### Differentiators (Competitive Advantage)

Features that set Database Compass apart from DB-Engines, Prisma Data Guide, and generic "types of databases" blog posts. The core differentiator is the combination of **visual scoring** + **opinionated architect perspective** + **interactive exploration** that no existing database guide provides.

| # | Feature | Value Proposition | Complexity | Dependencies | Notes |
|---|---------|-------------------|------------|--------------|-------|
| D1 | **8-dimension radar chart per category** | NO existing database guide provides multi-dimensional visual scoring. DB-Engines has popularity rankings. Prisma has narrative text. Neither has radar charts showing how models compare across scalability, query flexibility, learning curve, etc. The radar chart is instantly scannable and shareable. | MEDIUM | Adapt Beauty Index RadarChart component to 8 axes | 8-axis octagonal radar chart. Reuse SVG math from `src/lib/beauty-index/radar-math.ts`. Different dimension labels and colors. |
| D2 | **Complexity spectrum 2D visualization** | No database guide maps models on a two-axis complexity grid (conceptual vs operational). This visual immediately answers "which database type is appropriate for my team's experience level?" -- a question every architect asks. | MEDIUM | SVG scatter plot, click-to-navigate | Interactive SVG with labeled dots. Each dot links to detail page. Could use GSAP for hover animations. |
| D3 | **Character sketches** | The Beauty Index's character sketches ("The poet who became a startup founder" for Ruby) are the most memorable content on the site. Applying this pattern to database models creates personality-driven descriptions that people share and remember. "Redis: The sprinter who lives in the moment" is more memorable than "Redis is an in-memory key-value store." | LOW | Content authoring | 1 character sketch per category. Opinionated, witty, technically accurate. This is pure content work, no code. |
| D4 | **Ops vs Dev scoring split** | Dividing the 8 dimensions into 4 operational + 4 developer dimensions provides a perspective no guide offers. A CTO cares about ops dimensions. A junior developer cares about learning curve. Showing both explicitly serves different audiences from one page. | LOW | Data model design | Display as two grouped bar charts or two mini-radar charts. Or a single 8-axis radar with ops/dev sides visually distinguished. |
| D5 | **CAP theorem positioning** | System design interviews heavily feature CAP theorem. Showing where each database model falls on the CAP triangle (CP, AP, or CA) with visual annotation targets the developer interview prep audience -- a massive SEO opportunity. | LOW | Content authoring + simple SVG triangle | Small CAP triangle per detail page showing the model's typical position. 1-2 sentence explanation. |
| D6 | **Compare any two models** | The Beauty Index's VS comparison pages (`/beauty-index/vs/python-vs-rust/`) drive significant traffic through long-tail "X vs Y" queries. Database "X vs Y" queries ("postgresql vs mongodb", "redis vs memcached") have even higher search volume. Generating comparison pages for all interesting pairs creates a massive SEO surface. | HIGH | T2 (detail pages), overlay radar chart component | Generate comparison pages at `/tools/db-compass/vs/relational-vs-document/`. Show overlay radar chart + dimension-by-dimension comparison. N*(N-1)/2 = 66 possible pairs for 12 categories; generate the top 15-20 most searched combinations. |
| D7 | **Companion blog post** | A blog post like "The Database Compass: How I Score 12 Database Models" serves as methodology documentation (builds credibility), content marketing (drives traffic to the tool), and SEO asset (internal linking). The Beauty Index blog post drives significant referral traffic to the tool. | MEDIUM | Blog infrastructure (exists), content authoring | 2000-3000 word post explaining the methodology, scoring rationale, and personal experience. Cross-links to tool pages. |
| D8 | **OG images per detail page** | Each of the 12 category pages and the overview page should have custom OG images for social sharing. When someone shares a link to "Document Database -- Database Compass", the preview image should show the radar chart and score, not a generic site image. | MEDIUM | Existing Satori + Sharp OG pipeline | 13 OG images total (1 overview + 12 categories). Reuse the Beauty Index OG image generation pattern. |
| D9 | **JSON-LD structured data** | Rich structured data (Schema.org TechArticle or Dataset) on each page improves search engine understanding and could earn rich snippets. The site already has a strong JSON-LD pattern from Beauty Index. | LOW | Existing JsonLd components | Each detail page: TechArticle schema. Overview: Dataset or ItemList schema. Breadcrumbs on all pages. |
| D10 | **Share controls** | SVG-to-PNG download of radar charts for sharing in Slack, documentation, or presentations. The Beauty Index share controls pattern is already built. | LOW | Adapt ShareControls from Beauty Index | "Download PNG" and "Copy link" buttons on each detail page. |

### Anti-Features (Explicitly NOT Building)

| # | Anti-Feature | Why Tempting | Why Avoid | What to Do Instead |
|---|--------------|-------------|-----------|-------------------|
| A1 | **Individual database entries** | "Cover PostgreSQL AND MySQL as separate entries, not just 'Relational'" | Explodes scope from 12 to 50+ entries. Each individual database needs benchmarks, version tracking, feature matrices. This is DB-Engines' territory (433 entries). A portfolio tool cannot compete on breadth. The value is in the MODEL comparison, not individual product reviews. | List 3-5 representative databases per model with brief descriptions. Link to official docs and DB-Engines for individual database details. |
| A2 | **Live benchmarks or performance data** | "Show actual TPS numbers, latency benchmarks" | Benchmarks are context-dependent and misleading without controlled environments. A Redis benchmark on different hardware gives different results. Maintaining current benchmark data is an ongoing burden. Publishing stale benchmarks erodes credibility. | Score "Performance" as a qualitative dimension (1-10) with prose justification. Link to canonical benchmark resources (TPC, YCSB) for readers who want numbers. |
| A3 | **Interactive database selector wizard** | "Answer 5 questions, get a recommendation" | Decision tree wizards oversimplify. "Do you need ACID?" --> "Use relational" ignores that CockroachDB is distributed SQL with ACID. The complexity of database selection cannot be reduced to a flowchart without being wrong for edge cases. Wizards also require ongoing maintenance as the ecosystem evolves. | The complexity spectrum visualization (D2) serves the "which is right for me?" use case visually without pretending a wizard can make the decision for you. Pair with prose guidance in the companion blog post. |
| A4 | **User-submitted ratings or reviews** | "Let developers rate databases and show community scores" | Requires backend, moderation, and enough traffic to make ratings meaningful. Community ratings are also heavily biased by popularity and fanboyism (MongoDB would get brigaded). A portfolio tool cannot generate enough traffic for statistical significance. | All scores are authored by one expert (the site owner). State this transparently: "These scores reflect 17 years of architecture experience." The opinionated single-author voice IS the differentiator, not crowd-sourcing. |
| A5 | **Real-time data from DB-Engines API** | "Pull popularity rankings and update automatically" | DB-Engines does not offer a public API. Scraping creates legal and maintenance risk. Popularity data changes monthly but the model characteristics the tool scores are stable over years. The tool's value is in the qualitative analysis, not freshness of popularity numbers. | Mention DB-Engines popularity ranking qualitatively in prose. Link to DB-Engines for current rankings. Focus on timeless model characteristics, not transient popularity. |
| A6 | **Migration guide generator** | "Generate migration steps from Database A to Database B" | Every migration is unique to the data model, volume, and constraints. Generic migration guides are at best incomplete, at worst dangerous. This would require deep, database-specific technical writing for every possible pair -- enormous scope. | Include a "Migration Paths" prose section on each detail page with high-level guidance: "Coming from relational? Here's how to think about document databases." Link to official migration guides from each vendor. |
| A7 | **Pricing comparison** | "Show pricing across cloud providers for each database type" | Pricing changes frequently, varies by region and instance type, and depends on workload patterns. Maintaining accurate pricing data is a full-time job. Stale pricing erodes trust faster than any other outdated content. | Qualitatively discuss cost characteristics in the "Operational Simplicity" dimension: "Managed options range from free tier to enterprise pricing." Link to cloud provider pricing pages. |

---

## Feature Dependencies

```
[Data Model & Schema Definition] (foundation -- types, scores, content structure)
    |
    +---> [Content Collection (12 database model entries)]
    |         |
    |         +---> [T1: Overview Page]
    |         |         +---> [D2: Complexity Spectrum Visualization]
    |         |         +---> [Scoring Table / Ranking Display]
    |         |         +---> [Category Grid with Radar Thumbnails]
    |         |
    |         +---> [T2: Detail Pages (12 pages)]
    |         |         +---> [D1: 8-Axis Radar Chart]
    |         |         +---> [T3: Score Breakdown]
    |         |         +---> [T4: Use Cases]
    |         |         +---> [T5: Representative Databases]
    |         |         +---> [T9: Trade-offs]
    |         |         +---> [D3: Character Sketches]
    |         |         +---> [D4: Ops vs Dev Split]
    |         |         +---> [D5: CAP Theorem Position]
    |         |         +---> [T8: Navigation Between Categories]
    |         |         +---> [D10: Share Controls]
    |         |
    |         +---> [D8: OG Images] (one per page, Satori + Sharp)
    |         +---> [D9: JSON-LD Structured Data]
    |         +---> [T7: SEO Optimization]
    |
    +---> [T6: Responsive Layout] -- cross-cutting concern
    +---> [T10: Consistent Data Model] -- enforced by Zod schema

[D6: VS Comparison Pages] -- INDEPENDENT, can ship after core
    (requires T2 detail pages + overlay radar component)
    (generates 15-20 comparison pages at /tools/db-compass/vs/[slug]/)

[D7: Companion Blog Post] -- INDEPENDENT, can ship alongside or after tool
    (content authoring, cross-links to tool pages)

[Tools Landing Page Update] -- SMALL, add Database Compass card to /tools/
```

### Dependency Notes

- **Data model is the foundation.** The Zod schema defining fields for each database model entry (scores, use cases, examples, character sketch) must be designed first. Everything renders from this data.
- **Content authoring is the bulk of the work.** The code patterns are proven (Beauty Index). The challenge is writing 12 high-quality entries with expert-level analysis across 8 dimensions.
- **Radar chart adaptation is the key technical task.** Going from 6 axes to 8 requires updating the SVG math and layout. The rendering approach is identical.
- **VS comparison pages are the biggest SEO payoff but are fully independent.** These can ship weeks after the core tool. Each comparison page targets a long-tail query.
- **The companion blog post should ship with or immediately after the tool.** It provides the methodology context and internal linking that drives SEO value.
- **OG images follow the proven Satori pipeline.** No new infrastructure needed, just new templates.

---

## What Makes a Database Guide Authoritative and SEO-Competitive

### Ranking Factors for Developer Content

Based on Google's E-E-A-T framework (Experience, Expertise, Authoritativeness, Trustworthiness) and analysis of top-ranking database guides:

| Factor | What It Means for Database Compass | How to Implement |
|--------|-----------------------------------|--------------------|
| **Experience** | First-person architect perspective based on real-world usage | Character sketches, "Architect's Take" sections, production anecdotes |
| **Expertise** | Technically accurate, deep enough for senior developers | 8-dimension scoring with justifications, CAP theorem analysis, trade-offs |
| **Authoritativeness** | Consistent methodology, comprehensive coverage, cited sources | Transparent scoring methodology (blog post), cover all major models, link to official docs |
| **Trustworthiness** | Acknowledges limitations, presents balanced view, not vendor-biased | "When NOT to use" sections, honest scores (no category gets 10/10 on everything), vendor-neutral |

### SEO Page Structure

Each of the 12 detail pages + 1 overview page should target specific keywords:

| Page | Primary Keyword Target | Secondary Keywords |
|------|----------------------|-------------------|
| Overview | "database types comparison" | "types of databases", "database models explained" |
| Relational | "relational database explained" | "SQL database use cases", "when to use relational database" |
| Document | "document database explained" | "MongoDB vs relational", "NoSQL document database" |
| Key-Value | "key-value database explained" | "Redis use cases", "when to use key-value store" |
| Wide-Column | "wide column database explained" | "Cassandra use cases", "column family database" |
| Graph | "graph database explained" | "Neo4j use cases", "when to use graph database" |
| Time-Series | "time series database explained" | "InfluxDB use cases", "TSDB comparison" |
| Search Engine | "search engine database" | "Elasticsearch use cases", "full-text search database" |
| Vector | "vector database explained" | "vector database for AI", "embedding database" |
| In-Memory | "in-memory database explained" | "Redis vs Memcached", "caching database" |
| NewSQL | "NewSQL database explained" | "CockroachDB use cases", "distributed SQL" |
| Object-Oriented | "object-oriented database" | "OODBMS explained", "object database vs relational" |
| Multi-Model | "multi-model database explained" | "ArangoDB use cases", "polyglot persistence" |

### Content Depth Targets

For SEO competitiveness, each detail page should hit **1200-2000 words** of substantive content. This includes:
- Definition (100-150 words)
- Character sketch (50-100 words)
- Data structure explanation (150-200 words)
- Use cases (200-300 words)
- When NOT to use (100-150 words)
- Score justifications (200-300 words across 8 dimensions)
- Representative databases (150-200 words for 3-5 entries)
- Trade-offs summary (100-150 words)

The overview page should hit **2500-3500 words** including the scoring methodology explanation.

---

## MVP Definition

### Launch With (v1 -- Core Compass Tool)

The minimum set to launch a complete, useful Database Compass:

- [ ] **Data model & Zod schema** -- TypeScript types and content collection definition for 12 database model entries with 8 scoring dimensions
- [ ] **T1: Overview page** -- Hero section, ranking visualization, category grid with radar thumbnails
- [ ] **T2: 12 detail pages** -- Generated from content collection via `[slug].astro`
- [ ] **T3: 8-axis radar charts** -- Adapted from Beauty Index, SVG-based
- [ ] **T4: Use cases per category** -- 3-5 concrete scenarios each
- [ ] **T5: Representative databases** -- 3-5 named databases per category
- [ ] **T6: Responsive layout** -- Mobile-first, works on all devices
- [ ] **T7: SEO optimization** -- Titles, descriptions, JSON-LD, breadcrumbs
- [ ] **T8: Navigation** -- Prev/next links between categories
- [ ] **T9: Trade-offs section** -- Honest limitations per category
- [ ] **T10: Consistent data model** -- Zod schema enforcing uniformity
- [ ] **D1: Radar charts** -- 8-dimension octagonal charts
- [ ] **D3: Character sketches** -- Personality-driven descriptions
- [ ] **D4: Ops vs Dev scoring split** -- Visual distinction in score breakdown
- [ ] **D5: CAP theorem position** -- Small visual per detail page
- [ ] **D8: OG images** -- Custom images for overview + 12 categories
- [ ] **D9: JSON-LD structured data** -- TechArticle or Dataset schema
- [ ] **Tools page update** -- Add Database Compass card to /tools/

### Add After Launch (v1.1 -- Shareability & Comparison)

Features that maximize the SEO surface and viral loop:

- [ ] **D6: VS comparison pages** -- Top 15-20 "X vs Y" comparison pages
- [ ] **D10: Share controls** -- SVG-to-PNG download for radar charts
- [ ] **D2: Complexity spectrum visualization** -- 2D scatter plot on overview page

### Add Later (v2 -- Content Expansion)

- [ ] **D7: Companion blog post** -- Methodology, scoring rationale, personal experience (can also ship with v1)
- [ ] **Additional VS pages** -- Expand from 15-20 to all high-value pairs
- [ ] **Cross-links from existing blog posts** -- Link relevant Kubernetes/architecture blog posts to Database Compass pages

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase |
|---------|------------|---------------------|----------|-------|
| Data model & schema | CRITICAL | LOW | P0 | v1 |
| Content authoring (12 entries) | CRITICAL | HIGH (content work) | P0 | v1 |
| T1: Overview page | HIGH | MEDIUM | P0 | v1 |
| T2: Detail pages (12) | HIGH | MEDIUM | P0 | v1 |
| D1: 8-axis radar charts | HIGH | MEDIUM | P0 | v1 |
| T3: Score breakdown | HIGH | LOW | P0 | v1 |
| T4: Use cases | HIGH | LOW (content) | P0 | v1 |
| T5: Representative databases | HIGH | LOW (content) | P1 | v1 |
| D3: Character sketches | HIGH | LOW (content) | P1 | v1 |
| T7: SEO optimization | HIGH | LOW | P1 | v1 |
| D9: JSON-LD structured data | MEDIUM | LOW | P1 | v1 |
| D8: OG images | MEDIUM | MEDIUM | P1 | v1 |
| T8: Navigation | MEDIUM | LOW | P1 | v1 |
| T9: Trade-offs | MEDIUM | LOW (content) | P1 | v1 |
| T10: Consistent data model | HIGH | LOW | P0 | v1 |
| T6: Responsive layout | HIGH | MEDIUM | P1 | v1 |
| D4: Ops vs Dev split | MEDIUM | LOW | P1 | v1 |
| D5: CAP theorem position | MEDIUM | LOW | P1 | v1 |
| Tools page update | LOW | LOW | P1 | v1 |
| D2: Complexity spectrum | MEDIUM | MEDIUM | P2 | v1.1 |
| D6: VS comparison pages | HIGH (SEO) | HIGH (15-20 pages) | P2 | v1.1 |
| D10: Share controls | MEDIUM | LOW | P2 | v1.1 |
| D7: Companion blog post | HIGH (SEO) | MEDIUM (content) | P2 | v1/v1.1 |

---

## Competitor Feature Matrix

| Feature | DB-Engines | Prisma Data Guide | DigitalOcean | AWS Decision Guide | **Database Compass** |
|---------|-----------|-------------------|-------------|-------------------|---------------------|
| Number of categories | 20 | 6 broad | 7-8 | 8 (vendor-specific) | **12 (curated)** |
| Visual scoring | Popularity rank only | None | None | None | **8-axis radar charts** |
| Complexity visualization | None | None | None | Decision tree | **2D complexity map** |
| Character/personality | None | None | None | None | **Yes (Beauty Index style)** |
| Use cases per type | Limited | Narrative | Narrative | Scenario-based | **Structured, 3-5 per type** |
| Trade-offs / anti-patterns | Minimal | Some | Some | None | **Explicit "When NOT to use"** |
| Head-to-head comparison | System comparison tool | None | None | None | **VS comparison pages** |
| CAP theorem mapping | None | Mentioned | Mentioned | Not explicit | **Visual per category** |
| Expert perspective | Neutral/encyclopedic | Educational | Educational | Vendor-oriented | **Opinionated architect** |
| SEO optimization | Strong (domain authority) | Strong (Prisma brand) | Strong (DO brand) | Strong (AWS brand) | **Targeted long-tail** |
| Schema.org markup | None | None | Basic | None | **TechArticle + Dataset** |
| OG images per page | None | Generic | Generic | None | **Custom per category** |
| Share controls | None | None | None | None | **PNG download** |

---

## Sources

### Database Comparison Resources
- [DB-Engines Ranking Categories](https://db-engines.com/en/ranking_categories) -- 433 systems across 20 categories, monthly popularity rankings
- [Database of Databases (dbdb.io)](https://dbdb.io/) -- Carnegie Mellon, 1,070 systems with deep technical properties
- [Prisma Data Guide - Comparing Database Types](https://www.prisma.io/dataguide/intro/comparing-database-types) -- 6 broad categories with narrative analysis
- [DigitalOcean - Database Types](https://www.digitalocean.com/community/conceptual-articles/database-types) -- Conceptual articles per type
- [InterSystems - 11 Types of Databases](https://www.intersystems.com/resources/understanding-11-types-of-databases-a-comprehensive-guide/) -- Comprehensive guide with use cases
- [Estuary - Types of Databases with Examples](https://estuary.dev/blog/types-of-databases-with-examples/) -- 2025 guide with pros/cons per type

### Database Selection Frameworks
- [Azure Architecture Center - Data Store Decision Tree](https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/data-store-decision-tree) -- 5 evaluation domains (functional, non-functional, cost, security, DevOps)
- [AWS Purpose-Built Databases](https://aws.amazon.com/products/databases/) -- 8 database categories mapped to workload types
- [AWS Decision Guide - Databases](https://docs.aws.amazon.com/decision-guides/latest/databases-on-aws-how-to-choose/databases-on-aws-how-to-choose.html) -- Structured decision criteria

### CAP Theorem & Database Theory
- [ByteByteGo - CAP, PACELC, ACID, BASE](https://blog.bytebytego.com/p/cap-pacelc-acid-base-essential-concepts) -- Essential concepts for architects
- [CAP Theorem - Wikipedia](https://en.wikipedia.org/wiki/CAP_theorem) -- Foundational distributed systems theory
- [ACID vs BASE Explained](https://phoenixnap.com/kb/acid-vs-base) -- Consistency model comparison

### SEO & Content Strategy
- [Google - Creating Helpful Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) -- E-E-A-T framework
- [Topical Authority - Search Engine Land](https://searchengineland.com/guide/topical-authority) -- Building authority across a topic cluster
- [Database Categories Are Dead - Franco Fernando](https://newsletter.francofernando.com/p/database-categories) -- Modern perspective on evolving categories

### Radar Chart Implementation
- [Chart.js Radar Chart](https://www.chartjs.org/docs/latest/charts/radar.html) -- Open source chart library (reference, not recommended -- use SVG)

---
*Feature research for: Database Compass Interactive Explorer*
*Researched: 2026-02-21*
