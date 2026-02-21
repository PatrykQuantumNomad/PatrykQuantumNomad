# Pitfalls Research: Database Compass

**Domain:** Adding an interactive database model explorer (Database Compass) to an existing Astro 5 portfolio site
**Researched:** 2026-02-21
**Confidence:** HIGH (verified against codebase analysis, Astro build output, visualization research, SEO best practices, existing content pillar patterns)

**Context:** This is a SUBSEQUENT milestone pitfalls document for v1.5. The site (patrykgolabek.dev) already has 152 requirements across 5 milestones, 714 pages building in 22.17 seconds, and two content pillars: The Beauty Index (25 languages, 6 dimensions, 600+ vs-comparison OG images) and the Dockerfile Analyzer (39 rule pages, interactive CodeMirror editor). Database Compass adds 12 static model category pages + 1 overview + 1 blog post with a new JSON data file scored across 8 dimensions. This is a content-heavy addition, NOT an interactive tool -- zero client-side JS required beyond existing sort tables.

---

## Critical Pitfalls

### Pitfall 1: Multi-Model Database Categorization Creates Credibility Attacks

**What goes wrong:**
Putting Redis under "Key-Value" invites immediate criticism: "Redis is also a document store, a time-series database, a pub/sub broker, and a vector database." The same problem applies to PostgreSQL (relational + document + time-series via extensions), Cosmos DB (multi-model by design), DynamoDB (key-value + document), and MongoDB (document + time-series + search). Any rigid single-category placement looks naive to database professionals -- exactly the audience this tool targets.

The industry has moved decisively toward multi-model convergence. Redis describes itself as a "multi-model database" on its own website. PostgreSQL's JSONB support makes it a credible document store. Placing these databases in a single category box contradicts how their own vendors market them.

**Why it happens:**
A "12 categories, one database per slot" model imposes false mutual exclusivity on a reality where the lines are blurry. The visual design (12 cards, each with 3-6 databases) encourages clean taxonomy. But database models are not mutually exclusive -- they are capabilities that overlap across engines.

**How to avoid:**
1. Categorize by **primary data model** (the native model the engine was designed around), not by all capabilities
2. Add a `crossCategory` array field in the JSON schema for each database entry (e.g., Redis: `crossCategory: ["document", "time-series", "vector"]`)
3. On the overview page, add a visible methodology note: "Databases are categorized by their primary data model. Many modern databases support multiple models -- see detail pages for overlap."
4. On each detail page, render an "Also supports" section that cross-links to the other model categories the listed databases participate in
5. In the companion blog post, dedicate a paragraph to explaining why rigid categorization is an approximation, not a truth

**Warning signs:**
- JSON schema has no field for secondary/overlapping model capabilities
- Detail page copy states "Redis is a key-value database" without qualification
- No methodology explanation for how "primary model" was determined
- A database professional could make a factual counter-argument to any placement

**Phase to address:**
Data schema design phase. The JSON schema must include `crossCategory` metadata from the start. Retrofitting it later means rewriting every detail page's "databases in this category" section.

---

### Pitfall 2: Dimension Scores Look Arbitrary Without Transparent Methodology

**What goes wrong:**
Scoring 12 database models across 8 dimensions with integer values (1-10) invites "who decided this?" challenges. Unlike the Beauty Index where aesthetic subjectivity is part of the concept ("one architect's aesthetic ranking"), database capability scoring carries an expectation of technical objectivity. If a DBA sees Graph Databases scored 4/10 on "Ecosystem Maturity" with no justification, the entire tool loses credibility.

DB-Engines faces exactly this criticism: "scores based on proxies rather than actual capabilities get dismissed as popularity contests, not technical assessments." This tool will face the same challenge unless every score is defensible.

**Why it happens:**
The Beauty Index succeeded partly because it leaned into subjectivity and made it a feature. Database model comparisons live in a different expectations space -- people expect benchmarks, citations, or at least documented reasoning. A 1-10 scale with no rubric definition gives the impression of arbitrary assignment.

**How to avoid:**
1. **Define each dimension with a clear rubric.** For each score value, state what the endpoints mean. Example: "Query Flexibility: 1 = single-key lookups only, 5 = secondary indexes with basic filtering, 10 = full SQL with joins, subqueries, window functions, and CTEs"
2. **Show the rubric on each detail page**, not buried in a methodology document. Users should see the rubric next to the score
3. **Add a `justification` string field per model-dimension pair in the JSON data.** Even 1-2 sentences: "Scores 3 because graph queries require learning a specialized traversal language (Gremlin/Cypher), limiting adoption"
4. **Consider using a 1-5 scale instead of 1-10.** The difference between a 6 and a 7 out of 10 is impossible to justify. A 1-5 scale (Very Low / Low / Medium / High / Very High) reduces false precision. The Beauty Index uses 1-10 but those are aesthetic judgments; technical capabilities deserve more defensible gradations
5. **Anchor at least 2-3 dimensions to verifiable facts.** "Ecosystem Maturity" can reference npm/pip package counts, Stack Overflow question volumes, managed service availability on AWS/GCP/Azure. "Adoption" can reference DB-Engines rankings or developer survey data. Anchored scores resist "arbitrary" criticism

**Warning signs:**
- Dimension names exist without definitions anywhere in the codebase or data
- Scores assigned without justification text in JSON
- Two similar models have scores that differ by 1 point with no explanation for why
- The blog post does not explain the scoring methodology

**Phase to address:**
Data authoring phase. Dimension definitions and score rubrics must be written BEFORE any scores are assigned. This is a content prerequisite, not a UI task.

---

### Pitfall 3: 8-Axis Radar Charts Become Unreadable and Misleading

**What goes wrong:**
Eight axes is at the upper edge of what visualization experts recommend (5-7 is the comfortable range). At 8 axes, three compounding problems emerge:

1. **Label crowding:** The existing `generateRadarSvgString()` positions labels at `maxRadius + size * 0.08` offset. With 8 axes (45-degree spacing instead of 60-degree), adjacent labels overlap, especially at small sizes and on mobile
2. **Shape perception failure:** Research confirms that radar chart shapes "don't leverage pre-attentive quantitative attributes" -- users cannot attribute genuine meaning to the polygon shape. At 8 axes, the polygon becomes so complex that meaningful pattern recognition breaks down entirely
3. **Axis ordering bias:** "Radar charts' effectiveness heavily depends on arbitrary design choices (specifically axis sequence) rather than the underlying data alone." With 8 axes, there are 40,320 possible orderings, each producing a different visual impression of the same data

The Beauty Index used 6 axes successfully. Going to 8 is not a 33% increase -- it crosses a readability threshold.

**Why it happens:**
The radar-math.ts utility handles any number of axes mathematically, so there is no technical barrier. The instinct is "more dimensions = more comprehensive." But comprehensiveness in the data model does not equal comprehensiveness in the visualization.

**How to avoid:**
1. **Reduce to 6 dimensions if possible.** Question whether all 8 truly earn their place. Can two be merged? "Ops Complexity" and "Learning Curve" might collapse into "Adoption Difficulty." "Data Integrity" and "Consistency Model" might collapse into "Reliability"
2. If 8 dimensions must stay, **order axes so adjacent dimensions are conceptually related.** Group operational dimensions (Ops Complexity, Scalability, Ecosystem Maturity, Cost Efficiency) on one side and developer-experience dimensions (Query Flexibility, Schema Flexibility, Learning Curve, Data Modeling Power) on the other. This makes the polygon shape semantically meaningful: wide on the left = strong ops, wide on the right = strong DX
3. **Always pair radar charts with a score breakdown table.** The table is the primary interface; the chart is supplementary visual flavor. The Beauty Index already does this well
4. **Test label rendering at 8 axes.** The current `generateRadarSvgString()` computes label positioning with angle-based `text-anchor` (start/middle/end). At 45-degree increments, two labels near the 45-degree and 315-degree positions will have similar Y coordinates and may visually collide. Verify at the actual SVG size used on detail pages (likely 300-400px)
5. Never overlay multiple database models on the same radar chart. Side-by-side is acceptable; overlay is not
6. On mobile below 480px, consider showing the score table only and hiding the radar chart

**Warning signs:**
- Axis labels overlap or truncate at the SVG render size
- Two polygon shapes for different models look nearly identical despite having meaningfully different scores
- Users consistently ignore the radar chart and read the table instead
- Mobile layout shows a tiny, unreadable radar chart

**Phase to address:**
Component development phase. The radar chart component must be built with 8-axis readability testing, not just reusing the 6-axis Beauty Index component with 2 more axes added. Test at actual render sizes before proceeding.

---

### Pitfall 4: Static Scores Become Stale Within Months

**What goes wrong:**
The database landscape changes rapidly. New capabilities ship with every major release. The vector database explosion of 2023-2024 redefined an entire category. PostgreSQL 17 added features that change its scoring on multiple dimensions. Unlike the Beauty Index (programming language aesthetics change slowly), database capabilities change with every major version.

Static scores baked into a JSON file at build time will be factually wrong within 6-12 months. The "2026 Edition" framing creates an implicit promise that the content reflects 2026 reality -- if someone reads it in 2027, they expect either updated data or a clear date qualifier.

**Why it happens:**
Static sites excel at shipping fast but lack update mechanisms. Once deployed, there is no CMS workflow to trigger content reviews. The JSON data file becomes a forgotten artifact. The site already has 152 requirements and a growing maintenance surface -- adding another data file that requires periodic expert review creates ongoing obligation.

**How to avoid:**
1. Add a `lastVerified` date field per database entry in the JSON schema. Display it on each detail page
2. Add a `dataAsOf` field on the overview-level metadata, rendered prominently: "Data as of February 2026"
3. Frame the tool as "Database Compass 2026" explicitly in the title, URL, and meta tags. This scopes reader expectations and makes annual refresh natural
4. Do NOT include specific version numbers for databases in the JSON data -- they go stale fastest. Reference general capability tiers instead ("PostgreSQL supports JSONB document storage" not "PostgreSQL 16.2 added...")
5. In the companion blog post, explicitly state: "This data represents a point-in-time assessment. Database capabilities evolve rapidly."
6. Consider adding a GitHub issue template or a "suggest a correction" link on each detail page that links to a new issue

**Warning signs:**
- JSON schema has no date/version metadata fields
- Detail pages show no "last reviewed" indicator
- Blog post makes claims about "latest" or "current" capabilities without date qualification
- A database listed scores differently than its current release capabilities justify

**Phase to address:**
Data schema design phase (schema must include date fields) AND content authoring phase (framing must be explicit about temporal scope).

---

### Pitfall 5: SEO Content Too Thin to Rank in Competitive Database SERP

**What goes wrong:**
Database comparison pages are a highly competitive SERP. DB-Engines, G2, TrustRadius, AWS/GCP/Azure comparison pages, and established developer content sites (DigitalOcean, Prisma, PlanetScale) dominate. A 12-page set with 200-word descriptions, a radar chart, and a bullet list of databases will not rank -- it will be classified as thin content.

Google explicitly rewards sites that "enable users to dive deeper into topics without returning to search." Template-driven pages with minimal unique content per page are exactly what Google's helpful content system targets. The Dockerfile Analyzer avoided this trap by having 39 rule pages each with unique expert explanation, fix suggestions, and code examples.

**Why it happens:**
The temptation is to keep detail pages short because there are 12 of them and they all follow the same template. Writing 400+ words of unique expert-voice content for each of 12 model categories is 4,800+ words of original technical writing -- a significant content investment. The developer instinct is to minimize content and maximize visual elements. But search engines cannot index radar chart SVGs.

**How to avoid:**
1. Each detail page needs 400-600 words of unique, expert-voice content -- not generic descriptions copyable from Wikipedia
2. Include a "When to Use / When to Avoid" section per model with concrete use-case scenarios from real-world architecture
3. Include "Real-World Examples" -- name actual companies, products, or open-source projects that use this model type (public knowledge only)
4. Each page must target a unique, specific long-tail keyword (e.g., "graph database use cases 2026" vs "time-series database tradeoffs")
5. Write unique meta descriptions per page -- not template-generated from the same field with only the model name swapped
6. Use HTML `<table>` elements for dimension scores -- Google extracts table snippets for comparison queries, which is a direct path to featured snippets
7. Add internal cross-links between related model pages ("If you need graph relationships but also need strong consistency, consider [relational with graph extensions]")
8. The companion blog post should link to every detail page, and every detail page should link back to the blog post and to the overview

**Warning signs:**
- All 12 detail pages use the same meta description template with only the model name swapped
- Detail page word count is under 300 words excluding UI chrome
- No internal cross-links between model pages
- Pages rank on page 3+ or not at all for their target keywords within 3 months of publish

**Phase to address:**
Content authoring phase for the data, SEO integration phase for meta/structured data. Content quality is the harder problem and should be addressed first.

---

### Pitfall 6: Build Time Grows Unsustainably with OG Image Multiplication

**What goes wrong:**
Current build: 714 pages in 22.17 seconds. Of those, **600 are Beauty Index "vs" comparison OG images** (25 choose 2 = 300 pairs x 2 orderings). Each Satori+Sharp render takes 100-300ms. If the Database Compass follows the vs-comparison pattern (12 choose 2 = 66 comparison pages with OG images), that adds 80+ renders at 100-300ms each -- potentially 8-24 more seconds.

More critically, the trajectory matters. If v1.6 adds another content pillar with vs-comparisons, the build time becomes a problem. The current 22-second build is healthy, but each new Satori render compounds.

**Why it happens:**
The vs-comparison pattern from Beauty Index is powerful for SEO ("Python vs Ruby" is a real search query). The instinct to replicate a successful pattern does not account for whether the same query pattern exists for database models. "Key-Value vs Document Database" is a valid query, but with far lower search volume than programming language comparisons.

**How to avoid:**
1. **Do NOT create vs-comparison pages for Database Compass.** "Key-Value vs Document" is a reasonable comparison but does not have the search volume to justify 66 additional pages + OG images. The Beauty Index vs pages work because individual language names are high-volume queries. Database model names are lower-volume
2. Keep OG images to: 1 overview + 12 detail pages + 1 blog post = 14 images. At 100-300ms each, this adds 1.4-4.2 seconds -- well within budget
3. If comparison content is desired, create a single "comparison table" on the overview page rather than 66 individual pages
4. Reuse the existing `renderOgPng()` helper from `og-image.ts` rather than creating a fourth OG generator function. The existing function handles font loading, Satori rendering, and Sharp conversion
5. Measure build time after integration. Set a threshold: if build time exceeds 30 seconds, investigate which images are slow

**Warning signs:**
- Build time exceeds 30 seconds after adding Database Compass
- GitHub Actions build step shows OG images taking >10 seconds
- Plans include "database model A vs database model B" comparison pages
- A new `generateDbCompassVsOgImage()` function appears in the codebase

**Phase to address:**
Architecture/planning phase. The decision about vs-comparison pages must be made explicitly and early -- do not let it emerge organically during development.

---

## Moderate Pitfalls

### Pitfall 7: Homepage Becomes a Link Directory with 3 Content Pillar Callouts

**What goes wrong:**
The homepage currently has two callout sections (Beauty Index + Dockerfile Analyzer) between "What I Build" and "Latest Writing." Adding a third callout for Database Compass pushes the callout section toward visual monotony -- three nearly identical card links stacked vertically. The homepage starts feeling like a table of contents rather than a curated portfolio landing page.

**Why it happens:**
Each milestone adds its callout following the established pattern. The pattern works for 1-2 callouts but breaks at 3+ because the section becomes the dominant visual element on the page, pushing "Latest Writing" further below the fold.

**How to avoid:**
1. Redesign the callout section as a 3-card horizontal grid (`grid-cols-1 sm:grid-cols-3`) instead of stacked vertical cards. This gives each pillar equal weight without tripling the vertical space
2. Alternatively, create a single "Explore" section with a compact list linking to all three pillars, instead of full-card callouts per pillar
3. Keep callout copy very concise (title + one-line description) when there are 3+ pillars. The current Dockerfile Analyzer callout is 3 lines -- at 3 cards, this is the maximum before clutter

**Warning signs:**
- Scrolling from "What I Build" to "Latest Writing" takes more than 2 thumb-scrolls on mobile
- Homepage layout review shows the callout section is the tallest section on the page
- Three visually identical cards provide no differentiation between pillars

**Phase to address:**
Site integration phase. Homepage layout adjustment should happen when the callout is added, not after.

---

### Pitfall 8: Tools Page Integration Creates Visual Imbalance

**What goes wrong:**
The current tools page (`/tools/index.astro`) has two cards in a 2-column grid: Dockerfile Analyzer (full card) and "More tools coming soon" (dashed placeholder). Replacing the placeholder with Database Compass creates a 2-card grid where both items have equal visual weight -- which is correct. But the Database Compass is NOT an interactive tool (unlike the Dockerfile Analyzer). It is a content explorer. Placing it on the "Tools" page alongside an interactive tool creates a category mismatch.

**Why it happens:**
The URL structure `/tools/db-compass/` places it under "Tools" by convention. But a database model explorer with static content pages is closer to the Beauty Index (a content pillar) than to the Dockerfile Analyzer (an interactive tool). This creates a taxonomy question: is Database Compass a "tool" or a "content pillar"?

**How to avoid:**
1. Decide explicitly: is Database Compass under `/tools/db-compass/` or under `/db-compass/` (top-level like Beauty Index)? The URL determines the information architecture
2. If under `/tools/`, update the tools page description to reflect that it includes both interactive tools AND reference guides. Change "Free, browser-based developer tools" to "Free developer tools and reference guides"
3. If under a top-level path, add it to the header nav like Beauty Index (but be cautious -- 8 nav items is the maximum for mobile. Currently at 7)
4. Match the card design on the tools page to accurately represent what each tool IS. The Dockerfile Analyzer card says "Free Browser Tool." The Database Compass card should say "Reference Guide" or "Interactive Explorer" -- not "Free Browser Tool"

**Warning signs:**
- Tools page describes all items as "browser-based tools" when Database Compass has no client-side interactivity
- URL structure creates confusion about where the content "lives" in the site hierarchy
- Nav highlights "Tools" when on Database Compass pages but the content feels like it belongs alongside Beauty Index

**Phase to address:**
Architecture/planning phase. URL structure and site hierarchy must be decided before any pages are created.

---

### Pitfall 9: JSON-LD Structured Data Uses Wrong Schema Type

**What goes wrong:**
The site uses three different JSON-LD schema types: `Person` (homepage), `BlogPosting` (blog posts), `Dataset`/`ItemList` (Beauty Index), and `SoftwareApplication` (Dockerfile Analyzer). Choosing the wrong schema type for Database Compass reduces its chance of earning rich snippets and being correctly interpreted by AI search engines.

**Why it happens:**
Database Compass is a hybrid: it is structured data (like a Dataset), it is a comparison tool (like a SoftwareApplication), and it is educational content (like an Article). Developers pick whichever schema type they used last or whichever seems close enough.

**How to avoid:**
1. Use `Dataset` schema for the overview page (it describes a structured collection of scored data about database models) -- this matches the Beauty Index pattern and is most accurate
2. Use `Article` or `TechArticle` schema for individual detail pages (each is a substantive writeup about a database model category)
3. Use `BlogPosting` for the companion blog post (consistent with existing blog schema)
4. Include `BreadcrumbList` on all pages (the site already does this for Beauty Index)
5. Validate with Google's Rich Results Test after deployment -- do not assume schema is correct without testing

**Warning signs:**
- All Database Compass pages use `WebPage` (the default, least informative schema)
- Schema type does not match the page content (e.g., `SoftwareApplication` for a static reference page)
- Google Search Console shows no rich results for Database Compass pages after 2 weeks

**Phase to address:**
SEO integration phase. Decide schema types during architecture, implement during integration.

---

### Pitfall 10: LLMs.txt and Sitemap Miss New Pages

**What goes wrong:**
The site maintains two LLMs.txt files (`llms.txt.ts` and `llms-full.txt.ts`) that enumerate pages for AI discoverability. Both files currently hardcode sections for blog posts and Beauty Index languages. Database Compass pages will NOT appear in LLMs.txt unless the generation code is explicitly updated. Similarly, while `@astrojs/sitemap` should auto-include new pages, verification is required.

**Why it happens:**
LLMs.txt generation is a separate endpoint that does not auto-discover pages. It requires manual enumeration. With 14 new pages added in a new content pillar, forgetting to update these endpoints is easy -- especially because the LLMs.txt files are rarely touched (last modified Feb 18).

**How to avoid:**
1. Add a Database Compass section to both `llms.txt.ts` and `llms-full.txt.ts` during site integration
2. Import the `databases` collection in both files and enumerate model pages
3. After build, grep `dist/sitemap-index.xml` for all expected Database Compass URLs (14 total)
4. After build, verify `dist/llms.txt` includes Database Compass pages

**Warning signs:**
- `llms.txt.ts` has no import for the databases collection
- `dist/llms.txt` output does not mention "database" or "db-compass"
- `dist/sitemap-index.xml` is missing any of the 14 expected URLs

**Phase to address:**
Site integration phase. This is a checklist item, not a design decision -- but easy to miss.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding 8 dimension names in components | Faster initial build | Adding/renaming a dimension requires touching every component, OG generator, and JSON schema | Never -- extract to a shared `dimensions.ts` config, mirroring the Beauty Index `DIMENSIONS` pattern |
| Reusing Beauty Index `radar-math.ts` without testing at 8 axes | No new utility code needed | Label overlap at 8 axes due to tighter angular spacing; 45-degree positioning hits edge cases in text-anchor logic | Never -- verify label rendering at 8 axes before assuming compatibility |
| Copying `generateLanguageOgImage()` for DB Compass OG | Avoids touching working code | Four near-identical OG generator functions with diverging maintenance | Acceptable for v1.5 if a refactor into a shared parametric generator is planned for v1.6 |
| Using 1-10 scale because Beauty Index does | Consistent user mental model | Some database dimensions are near-binary (e.g., "ACID Support" is yes/no/partial) and do not map to 10 gradations | Only if every dimension genuinely has at least 5 meaningful gradations |
| Omitting per-database justifications from JSON | Smaller data file, faster authoring | Scores look arbitrary; no way to show methodology on the page | Never -- even 1-2 sentence justifications per dimension prevent credibility attacks |
| Using a flat array of databases per model instead of rich objects | Simpler JSON structure | Cannot capture per-database strengths, version info, or managed-service availability | MVP only -- at least add a `description` field per database entry |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Header navigation | Adding "Database Compass" as 8th top-level nav item | Keep at 7 items; DB Compass accessible via Tools page or replace "Contact" with a consolidated approach |
| Homepage callouts | Adding a third vertically stacked callout card | Redesign as a 3-card horizontal grid or compact "Explore" list |
| Tools landing page | Replacing "Coming soon" placeholder without updating page description | Update tools page intro text; match card styling to distinguish interactive tool vs reference guide |
| Content collection | Forgetting to register in `content.config.ts` | Add `databases` collection with `file()` loader and Zod schema, mirroring the `languages` collection pattern |
| LLMs.txt | Not updating `llms.txt.ts` and `llms-full.txt.ts` | Add databases collection import and Database Compass section to both endpoint files |
| OG images | Creating a new OG generator from scratch | Extend existing `og-image.ts` with a `generateDbCompassOgImage()` function reusing `renderOgPng()`, `brandingRow()`, `accentBar()` |
| Radar chart component | Importing Beauty Index `RadarChart.astro` and passing 8 axes | Verify label positioning at 8 axes; may need increased label offset or font size adjustment |
| View Transitions | New pages not participating in transitions | All new pages use the same Layout component with `<ViewTransitions />` -- should work automatically, but verify |
| JSON-LD | Using generic `WebPage` schema | Use `Dataset` for overview, `TechArticle` for detail pages, `BlogPosting` for companion post |
| Internal linking | Only linking overview -> detail, not detail -> detail | Add "Related Models" cross-links on each detail page; add "Compare with" suggestions |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| OG image multiplication via vs-comparison pages | Build time increases by 10-20+ seconds | Limit to 14 OG images (1 overview + 12 detail + 1 blog); no vs-comparison pages | Adding 66+ comparison OG images |
| Large JSON data file with embedded justifications | Build time increases proportionally with data size | Use Astro content collection `file()` loader which caches between builds | JSON file exceeds 100KB (unlikely with 12 entries but possible with long justifications) |
| Radar chart SVG computed twice per page (once for page, once for OG) | Redundant computation during build | Pre-compute SVG string once per model; pass to both page component and OG generator | Noticeable at 50+ pages, not 12 |
| Sortable table adds client-side JS where none existed | Page weight increases; Lighthouse score drops | Use the same build-time sort approach as Beauty Index, or nanostores atom (286 bytes) | Adding a full sorting library instead of lightweight approach |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Including database connection strings in example content | Readers copy-paste examples with real-looking credentials | Use obviously fake examples: `mongodb://localhost:27017/example` |
| Linking to third-party database download pages without verification | Broken or hijacked links | Only link to official documentation domains; verify at authoring time |
| Accepting user-contributed corrections without review | Spam or malicious content in GitHub issues | GitHub issues require maintainer approval; no auto-merge of data changes |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Radar chart as primary visual with no fallback | Users who cannot parse radar charts get no value | Always pair with a score breakdown table; table is primary, chart is supplementary |
| All 12 model cards looking identical on overview | Users cannot quickly find the model they care about | Give each model a distinct icon or color accent; group by complexity spectrum position |
| "Complexity spectrum" visualization unclear | Newcomers do not understand why Key-Value is "simple" and Graph is "complex" | Add hover/click explanations on the spectrum; include brief paragraph defining the axis |
| Detail pages with no clear next action | Users read one model page and leave the site | Add "Compare with" suggestions, "If you need X, consider [Model]" cross-links, and link to blog post |
| Mobile radar chart too small to read | Primary mobile audience gets degraded experience | Hide radar chart below 480px; show score table only; or render chart full-width |
| Dimension abbreviations without context | "QF" on the chart means nothing without a legend | Always show full dimension names; if space is tight, add a legend below the chart |
| Overview page lacks entry point for "I don't know what I need" | Beginners bounce because they cannot navigate the taxonomy | Add a "Start Here" section or decision-tree intro before the model grid |
| Scores displayed without context | "7/10" means nothing without knowing what 1 and 10 represent | Show endpoint definitions: "1 = [meaning], 10 = [meaning]" at least on hover or via tooltip |

## "Looks Done But Isn't" Checklist

- [ ] **Content collection:** `databases` collection registered in `content.config.ts` with Zod schema -- build will silently produce no pages if missing
- [ ] **OG images:** All 14 new pages have working OG image endpoints returning valid PNGs -- test by visiting `/open-graph/tools/db-compass/[slug].png` in dev
- [ ] **LLMs.txt:** Both `llms.txt.ts` and `llms-full.txt.ts` include Database Compass pages -- easy to forget since these are separate endpoint files
- [ ] **Sitemap:** All 14 new URLs appear in `sitemap-index.xml` output -- run `astro build` and check dist
- [ ] **JSON-LD:** Structured data validates in Google's Rich Results Test -- paste each page URL after deploy
- [ ] **Header nav:** "Tools" link highlights as active when on `/tools/db-compass/*` pages -- verify `startsWith` logic in Header.astro (currently `link.href !== '/' && currentPath.startsWith(link.href)` which should work for `/tools/`)
- [ ] **Internal cross-links:** Blog post links to overview, overview links to blog post, detail pages link to overview, detail pages cross-link to related models -- check all directions
- [ ] **Mobile layout:** Radar charts readable at 375px viewport -- test all 12 detail pages on actual device, not just one in simulator
- [ ] **Accessibility:** Radar chart SVGs have descriptive `aria-label` or `role="img"` with alt text -- the current `generateRadarSvgString()` does not include ARIA attributes
- [ ] **Score table:** If sortable, works with keyboard (Tab + Enter) -- the Beauty Index table set this precedent
- [ ] **Multi-model metadata:** Every database that spans categories has cross-links or "also classified as" notes -- verify Redis, PostgreSQL, Cosmos DB, DynamoDB, MongoDB at minimum
- [ ] **Dimension rubric:** Each of the 8 dimensions has a visible definition accessible from both overview and detail pages -- not just in the blog post
- [ ] **Date indicators:** Overview shows "Data as of [date]"; each detail page shows per-database `lastVerified` dates
- [ ] **Word count:** Each detail page has 400+ words of unique expert content -- measure after authoring

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Scores challenged as arbitrary (P2) | MEDIUM | Add justification text per score in JSON; publish methodology addendum in blog post; add "suggest correction" link per page |
| Multi-model databases miscategorized (P1) | LOW | Add `crossCategory` field to JSON schema; update detail page template to render secondary categories with cross-links |
| Radar chart unreadable at 8 axes (P3) | MEDIUM | Reduce to 6 axes (requires rethinking dimensions and rescoring all models); or switch to horizontal bar chart |
| Build time exceeds 40 seconds (P6) | LOW | Remove vs-comparison pages if added; implement OG image caching; verify no redundant SVG generation |
| SEO thin content penalty (P5) | HIGH | Rewrite all 12 detail pages with substantial unique content (400+ words each); requires 6-8 hours of expert writing |
| Homepage cluttered with 3 callouts (P7) | LOW | Redesign callout section as 3-card grid (CSS change) or compact list |
| Stale data after 12 months (P4) | LOW | Update JSON data file, rebuild, redeploy. Architecture supports this -- the risk is remembering to do it |
| LLMs.txt/sitemap missing pages (P10) | LOW | Add collection import and section to endpoint files; rebuild; takes 15 minutes |
| Wrong JSON-LD schema type (P9) | LOW | Change schema type in page template; rebuild; takes 30 minutes |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Multi-model categorization (P1) | Data schema design | JSON schema has `crossCategory` field; detail page template renders overlap notes |
| Score arbitrariness (P2) | Data schema + content authoring | Each dimension has a rubric definition; each score has justification text in JSON |
| 8-axis radar readability (P3) | Component development | Chart tested at 375px, 768px, 1024px widths; labels do not overlap; score table always visible alongside |
| Stale data framing (P4) | Data schema + content authoring | `lastVerified` field in JSON; visible "Data as of February 2026" on overview page |
| SEO thin content (P5) | Content authoring | Each detail page word count > 400; unique meta descriptions; unique target keywords per page |
| Build time (P6) | Architecture/planning | Decision documented: no vs-comparison pages; OG images limited to 14; build time measured < 30s after integration |
| Homepage callout design (P7) | Site integration | 3-callout layout tested on mobile and desktop; vertical scroll distance acceptable |
| Tools page taxonomy (P8) | Architecture/planning | URL structure decided; tools page description updated; card labels accurate |
| JSON-LD schema type (P9) | SEO integration | Schema validates in Rich Results Test; appropriate type per page type |
| LLMs.txt coverage (P10) | Site integration | `dist/llms.txt` includes Database Compass section; sitemap includes all 14 URLs |

## Sources

- [Highcharts: Radar Chart Explained](https://www.highcharts.com/blog/tutorials/radar-chart-explained-when-they-work-when-they-fail-and-how-to-use-them-right/) -- axis count limits (5-8 recommended), when to use/avoid (HIGH confidence)
- [Data-to-Viz: Spider Chart Caveats](https://www.data-to-viz.com/caveat/spider.html) -- axis ordering effects on perception, shape distortion (HIGH confidence)
- [Scott Logic: A Critique of Radar Charts](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts.html) -- shape perception does not leverage pre-attentive attributes (HIGH confidence)
- [ChartExpo: Radar Chart Misleading Geometry](https://chartexpo.com/blog/radar-chart) -- polygon area distortion, alternatives (MEDIUM confidence)
- [Nightingale: The Stellar Chart Alternative](https://nightingaledvs.com/the-stellar-chart-an-elegant-alternative-to-radar-charts/) -- radial bar chart alternative (MEDIUM confidence)
- [Redis Multi-Model Database](https://redis.io/technology/multi-model/) -- Redis as multi-model, not just key-value (HIGH confidence)
- [Redis Data Types](https://redis.io/docs/latest/develop/data-types/) -- Redis supports strings, hashes, lists, sets, JSON, streams (HIGH confidence)
- [DB-Engines Ranking Method](https://db-engines.com/en/ranking_definition) -- methodology criticism, proxy-based scoring limitations (HIGH confidence)
- [Andy Pavlo: Databases in 2025 Retrospective](https://www.cs.cmu.edu/~pavlo/blog/2026/01/2025-databases-retrospective.html) -- rapid landscape changes (HIGH confidence)
- [Ainoya.dev: Cache Satori OGP Images in Astro](https://ainoya.dev/posts/astro-ogp-build-cache/) -- OG image build time optimization, 100-300ms per image (MEDIUM confidence)
- [Astro Content Layer Deep Dive](https://astro.build/blog/content-layer-deep-dive/) -- file() loader caching, 5x faster builds, 25-50% less memory (HIGH confidence)
- [Backlinko: Featured Snippets](https://backlinko.com/hub/seo/featured-snippets) -- table snippets for comparison queries (HIGH confidence)
- [Google: Structured Data Introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) -- JSON-LD recommended format (HIGH confidence)
- [Backlinko: Schema Markup Guide](https://backlinko.com/schema-markup-guide) -- schema critical for SERP visibility and AI search (HIGH confidence)
- Codebase analysis: `astro.config.mjs`, `content.config.ts`, `og-image.ts`, `radar-math.ts`, `Header.astro`, `index.astro`, `tools/index.astro`, `llms.txt.ts`, build output (714 pages, 22.17s) (HIGH confidence -- direct code inspection)

---
*Pitfalls research for: Database Compass -- database model explorer (v1.5 milestone)*
*Researched: 2026-02-21*
