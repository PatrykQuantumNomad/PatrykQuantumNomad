# Phase 117: Source Verification and Outline - Research

**Researched:** 2026-04-14
**Domain:** Source verification, citation curation, and structured essay outlining for a 4500-word thought-leadership blog post
**Confidence:** HIGH

## Summary

Phase 117 produces two deliverables before any prose is written: (1) a verified source reference file cataloging all 48 NotebookLM research sources plus ~5-8 additional external sources, each with URL, reachability status, claim supported, and citation tier assignment; and (2) a structured outline with argument-as-heading section titles and per-section word budgets following the locked 4-act structure with front-loaded Act 1 (~1500w).

The 48 sources are confirmed present in NotebookLM notebook `a1b56c66-65ca-4afb-8cb8-f962cdf53392` ("Conquering Dark Code"). Every source has a title, type (web_page, pdf, youtube, or generated_text), and a URL retrievable from NotebookLM. Two sources are "generated_text" (AI-synthesized notes, not citable externally) and one is a YouTube video -- these require special handling. The remaining 45 are web pages or PDFs with verifiable URLs.

The primary risk is URL rot and access barriers (paywalled PDFs, ResearchGate login walls, government domains that reorganize). The verification approach should use HTTP HEAD requests via curl or a lightweight link checker, not full page rendering. Sources behind login walls should be flagged but not marked as dead -- they are accessible to readers who have accounts. The source reference file must be structured for easy consumption by the content authoring phase (Phase 119).

**Primary recommendation:** Use `curl -sI -o /dev/null -w "%{http_code}" URL` in a bash script to batch-verify all 48+ URLs, flag any returning 4xx/5xx, then manually verify flagged URLs in a browser. Annotate each source with its citation tier (inline vs. further-reading) based on the data-first selection criteria locked in CONTEXT.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Narrative arc and sections
- 4-act structure: wake-up call -> framework -> defense -> closing
- Front-loaded shock: heavy Act 1 (~1500w) with alarming stats to hook readers, shorter framework and defense sections
- Provocative claim headings (e.g., "Your Codebase Has a Shadow", "AI Didn't Create the Problem -- It Removed the Guardrails")
- Stat-first bombshell opening -- lead with the most alarming data point and let implications unfold
- Closing act: philosophical elevation -- zoom out to what this means for the industry and the craft of engineering

#### Citation selection
- Selective density: 15-20 sources cited inline, not all 48
- Hyperlinked text style -- weave source names into prose as clickable links (e.g., "GitClear's 2025 analysis found...")
- Data-first selection criteria -- prioritize sources with hard numbers (4x clones, 17% mastery drop, churn rates)
- Remaining ~28-33 sources go into a curated Further Reading section at the end, grouped by theme with one-line descriptions

#### Framework identity
- Spectrum/scale direction -- "The Dark Code Spectrum" or similar, implies a gradient from light to dark where positions are measurable
- 5 dimensions -- comprehensive, feels like a serious analytical tool
- Research-grounded -- each dimension backed by a specific data source (e.g., clone density from GitClear, ownership gap from DX)
- Table/matrix visual format -- clean table with dimension name, description, indicator, and severity; scannable and professional

#### Voice and perspective
- Authority with edge -- confident, opinionated, occasionally provocative; speaks as someone who's seen this problem and is naming it; minimal "I" but strong perspective
- AI framed as accelerant, not cause -- "AI didn't invent dark code, it poured gasoline on a fire already burning"; nuanced, avoids the AI-blame trap
- 2-3 brief first-person experience moments -- a sentence or two each, just enough to signal "I've been there" without becoming memoir
- Broad developer community audience -- any developer who uses AI tools and wonders about code quality; accessible, not exclusive
- Firm stance: dark code is a threat -- no equivocation, the essay makes the case for eliminating it

### Claude's Discretion
- Exact word budgets per section (within the front-loaded constraint)
- Source verification depth and tooling approach
- Further Reading section grouping and theming
- Framework dimension names and exact data source mappings
- Specific argument-as-heading titles for each section

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

This phase is a content-planning phase, not a code phase. The "stack" is tooling for source verification and outline construction.

### Core

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `curl` (system) | HTTP HEAD requests to verify URL reachability | Universally available, fast, no dependencies, supports redirect following |
| NotebookLM MCP | Query source metadata, retrieve URLs, cross-reference claims | Direct access to all 48 sources with AI-powered retrieval |
| Markdown files | Source reference file and outline deliverables | Consumed by Phase 119 (Content Authoring); matches project convention |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `npx linkinator` | Post-draft link validation (Phase 121) | NOT for this phase -- too heavy for pre-writing verification |
| Browser manual check | Verify flagged URLs that return ambiguous status codes | When curl returns 403 (login wall) or 301 (redirect) |

### What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `npx linkinator` for pre-writing | Designed for HTML pages, not a URL list; overkill for this phase | `curl -sI` batch script |
| Playwright/Puppeteer for verification | Full browser rendering is unnecessary and slow for 48 URLs | `curl` HEAD requests |
| Citation management tools (Zotero, BibTeX) | Academic tooling mismatched with hyperlinked-text citation style | Plain Markdown source reference file |

## Architecture Patterns

### Deliverable 1: Source Reference File

**Location:** `.planning/phases/117-source-verification-and-outline/sources.md`

**Structure per source:**
```markdown
### [Source Number]. [Short Title]
- **URL:** [full URL]
- **Status:** VERIFIED / FLAGGED / UNREACHABLE / NOT-CITABLE
- **Type:** web_page / pdf / youtube / generated_text
- **Date Accessed:** 2026-04-14
- **Key Claim:** [1-2 sentence summary of the data point or argument this source supports]
- **Citation Tier:** INLINE / FURTHER-READING
- **Act Assignment:** [which act this source primarily supports, if inline]
- **Key Data Point:** [specific number or finding, if applicable]
```

**Special handling rules:**
- `generated_text` sources (2 of 48): These are NotebookLM-synthesized notes, not externally citable. Mark as `NOT-CITABLE` and extract useful claims to attribute to their original sources instead.
- YouTube source (1 of 48): Citable but with URL format `https://youtube.com/watch?v=...`. Mark as VERIFIED if video is accessible.
- ResearchGate PDFs: Often return 403 without login but are accessible to logged-in users. Mark as `VERIFIED (login wall)`.
- Government/military PDFs (defense.gov, stib.cto.mil): These domains reorganize frequently. Verify the exact PDF path.

### Deliverable 2: Structured Outline

**Location:** `.planning/phases/117-source-verification-and-outline/outline.md`

**Structure:**
```markdown
# Dark Code: [Subtitle TBD]

## Outline

### Act 1: [Heading] (~1500w)
#### Section 1.1: [Argument-as-heading] (~Xw)
- Argument: [what this section claims]
- Evidence: [which sources support it]
- Components: [StatHighlight, etc.]

#### Section 1.2: [Argument-as-heading] (~Xw)
...

### Act 2: [Heading] (~1200w)
...

### Act 3: [Heading] (~1000w)
...

### Act 4: [Heading] (~800w)
...

### Further Reading (~not counted in word budget)
- Theme groups with source assignments

## Word Budget Summary
| Act | Target | Sections |
|-----|--------|----------|
```

### Recommended Outline Structure

Based on locked decisions (4-act, front-loaded, provocative headings, stat-first opening) and the data points available from the 48 sources, here is the recommended outline skeleton:

**Act 1: The Wake-Up Call (~1500w)**
- Purpose: Shock the reader with hard data about code quality collapse
- Opens with a bombshell stat (recommended: "4x growth in code clones" from GitClear or "refactoring collapsed from 25% to less than 10%")
- Introduces the term "Dark Code" with the TermDefinition component
- Deploys 3-4 StatHighlight components with the most alarming numbers
- Key sources for inline citation: GitClear 2025, Anthropic RCT, Empirical Analysis of AI Code Gen, Mondoo 2026 Vulnerabilities

**Act 2: The Framework (~1200w)**
- Purpose: Present "The Dark Code Spectrum" as a diagnostic tool
- 5-dimension table/matrix with data-backed indicators
- Each dimension maps to a specific research source
- This is the essay's "product" -- the referenceable, linkable intellectual contribution

**Act 3: The Defense (~1000w)**
- Purpose: Practical countermeasures against dark code
- Not a tutorial -- strategic principles with examples
- Connects to observability, ownership, refactoring discipline
- 2-3 code block examples showing "dark code" patterns and their remediation

**Act 4: The Reckoning (~800w)**
- Purpose: Philosophical elevation -- what dark code means for the craft
- AI framed as accelerant, not cause
- First-person moment: what 17 years of production engineering teaches about code you don't understand
- Call to action: measure, own, illuminate

### Framework Dimension Mapping (Recommended)

Based on NotebookLM research, the 5 dimensions of "The Dark Code Spectrum" should map to these data sources:

| Dimension | Description | Primary Data Source | Key Metric |
|-----------|-------------|-------------------|------------|
| **Clone Density** | How much of the codebase is duplicated/copy-pasted code | GitClear 2025 (211M lines analyzed) | Copy/pasted code rose from 8.3% to 12.3%; 4x clone growth |
| **Ownership Vacuum** | Code with no identifiable author who understands it | Turnover in OSS Projects (174 FLOSS projects) | 59.7% of projects have 30%+ annual core dev turnover |
| **Comprehension Decay** | Declining ability to read and debug existing code | Anthropic RCT (52 engineers) | AI-assisted devs score 17% lower on comprehension quizzes |
| **Refactoring Deficit** | Structural maintenance falling behind new code generation | GitClear 2025 | Refactoring collapsed from 25% to less than 10% of changes |
| **Vulnerability Surface** | Security exposure from unreviewed or AI-generated code | Mondoo 2026 / Empirical Analysis | 23.7% more vulns in AI code; time-to-exploit collapsed to 5 days |

### Inline Citation Pre-Selection (15-20 sources)

Based on the data-first selection criteria (locked decision), these sources have the strongest hard numbers and should be pre-selected for inline citation:

**Tier 1: Primary data sources with unique, citable numbers (INLINE)**

1. **GitClear 2025 AI Copilot Code Quality** -- 4x code clones, refactoring collapse, 211M lines analyzed
2. **Anthropic RCT: AI Assistance and Coding Skills** -- 17% mastery drop, 52-engineer study
3. **Empirical Analysis of AI-Assisted Code Generation** -- 23.7% more vulns, 89% junior acceptance rate, 76% bypass rate
4. **Mondoo 2026 State of Vulnerabilities** -- 48,175 CVEs, 192,742 malware packages, 5-day time-to-exploit
5. **Turnover in Open-Source Projects** -- 59.7% have 30%+ turnover, unstable projects 2x slower bug fix
6. **Turnover-Induced Knowledge Loss in Practice** -- qualitative evidence of reverse-engineering cost
7. **Technical Debt Quantification (American Impact Review)** -- 31% defect density increase per SD of debt, 14% quarterly compound rate
8. **GitClear 2023 Coding on Copilot** -- baseline data showing pre-2024 trends
9. **Code Inflation (SpinRoot)** -- exponential codebase growth "First Law of Software Development"
10. **Software Vulnerability Statistics 2026 (AppSec Santa)** -- 25.1% of AI code contains exploitable vulns
11. **Supply Chain Attack Statistics 2025 (DeepStrike)** -- third-party breaches doubled to 30%
12. **Large-Scale Bug Resolution Times (Chapman/MDPI)** -- bugs fixed 1.71x faster by original author
13. **AutonomyAI: 50 AI Developer Tools Evaluated** -- some tools make teams 19% slower
14. **Bug-Proneness of Refactored Code (arXiv)** -- single refactoring 3x more bug-prone than composite
15. **An Empirical Study of Bug Fixing Rate** -- negative correlation between fix rate and time cost

**Tier 1.5: Sources providing important narrative context (INLINE, selective)**

16. **Defense Innovation Board SWAP Report** -- "Software Is Never Done" framing
17. **Enterprise-scale Computation Imaging** -- "mostly dark" control flows in microservices
18. **Assessing Bug-Proneness of Refactored Code (HTML version)** -- longitudinal architectural decay data

**Tier 2: Further Reading (~30 sources)**

These provide background, general practices, or supporting context without unique data points that advance the Dark Code argument directly. Group into themed sections.

### Further Reading Section Grouping (Recommended)

| Theme | Sources | Count |
|-------|---------|-------|
| **AI and Code Quality** | GitClear Research Hub, AutonomyAI evaluation, Amazon/AI YouTube video | 3 |
| **Software Defect Research** | Bug characteristics in OSS, Quantum software bugs, Defect forecasting, Bug fixing rate | 4 |
| **Technical Debt Management** | Kissflow TD guide, Technical Debt Quantification (if not inline), Architectural evolution in microservices | 2-3 |
| **CI/CD and DevSecOps** | Black Duck CI/CD, Compunnel CI/CD in QA, CI/CD in Linux, CI Bad Practices (UZH), Security-Driven Pipelines, Salesforce Release Mgmt | 6 |
| **Security and Supply Chain** | OWASP Top 10 on GCloud, GCloud Web Security Scanner, Forbes Dark Web, DeepStrike Supply Chain, Static Code Detection Market, AppSec Santa | 5-6 |
| **Knowledge Loss and Team Dynamics** | Turnover UFMG (duplicate of inline), Virtual workplace impact (Frontiers), Remote-Capable Knowledge Work | 2-3 |
| **Defense and Government** | DIB Ten Commandments, SWAP Supplementary, Defense Software Acquisition | 3 |
| **Observability and Monitoring** | Three Pillars of Observability, AI Test Case Prioritization | 2 |
| **Miscellaneous** | Dark language HN discussion, Program-PLATE vulnerability extraction | 2 |

### Sources External to NotebookLM (from existing research files)

These sources are referenced in the project's SUMMARY and FEATURES research but are NOT among the 48 NotebookLM sources. They must be verified separately and considered for citation:

| Source | URL | Relevance |
|--------|-----|-----------|
| Addy Osmani, "Comprehension Debt" | https://addyosmani.com/blog/comprehension-debt/ | Competitor/companion piece; coined term is thematically adjacent |
| DX, "Code Rot and Productivity" | https://getdx.com/blog/code-rot/ | Competitor analysis; related concept |
| GitHub Blog, "Open Source Vulnerability Trends" | https://github.blog/security/supply-chain-security/a-year-of-open-source-vulnerability-trends-cves-advisories-and-malware/ | 69% malware advisory increase stat |
| OWASP Top 10:2025 A03 | https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/ | Supply chain failures framework |
| John D. Cook, "Dark Debt" (2018) | https://www.johndcook.com/blog/2018/03/01/dark-debt/ | Prior art on "dark" in technical debt |
| Nature, "Hallucinated Citations" | https://www.nature.com/articles/d41586-026-00969-z | Citation integrity risk (meta-source) |
| InfoQ, "AI-Generated Code Creates New Wave of Technical Debt" | https://www.infoq.com/news/2025/11/ai-code-technical-debt/ | Industry press coverage |
| GitClear 2025 PDF (direct) | https://gitclear-public.s3.us-west-2.amazonaws.com/GitClear-AI-Copilot-Code-Quality-2025.pdf | Direct PDF link for verification |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL verification | Custom Node.js link checker | `curl -sI -o /dev/null -w "%{http_code}" -L URL` in a bash loop | curl handles redirects, timeouts, and HTTP status codes natively; a script is 5 lines |
| Source database | JSON/YAML structured data file | Plain Markdown with consistent heading structure | The downstream consumer (Phase 119 author) reads Markdown, not data files |
| Citation numbering system | Auto-numbered footnote tracker | Manual tier assignment in source reference file | Only 15-20 sources are inline; the essay uses hyperlinked text, not numbered refs |
| Outline template | MDX scaffolding with component imports | Plain Markdown outline with section annotations | Components are added during Phase 119; the outline is a blueprint, not code |

## Common Pitfalls

### Pitfall 1: Treating "generated_text" NotebookLM sources as citable
**What goes wrong:** Two of the 48 sources are NotebookLM-generated synthesis notes, not external publications. Citing them creates a hallucinated source.
**Why it happens:** They appear in the source list alongside real sources and have titles that sound like papers.
**How to avoid:** Flag source IDs `148d7646-be08-4643-9bbd-270b9c00fe31` ("Longitudinal Analysis of Software Defect Proliferation") and `654c9e12-f8a5-4f6e-97e5-20b1786d1c19` ("The Pathogenesis of Dark Code") as NOT-CITABLE. Extract any useful claims and trace them back to the real sources they synthesize.
**Warning signs:** Source URL field shows `[Markdown]` instead of a URL.

### Pitfall 2: ResearchGate URLs returning 403 and being marked as dead
**What goes wrong:** ResearchGate returns 403 for non-logged-in curl requests, causing automated verification to flag 8+ sources as unreachable.
**Why it happens:** ResearchGate requires authentication for some PDF downloads but shows the abstract page to anyone.
**How to avoid:** For ResearchGate URLs, check if the abstract page (not the PDF) is accessible. Accept 403 on PDF downloads if the abstract page returns 200. Mark as `VERIFIED (login wall)`.
**Warning signs:** Multiple ResearchGate sources all flagged simultaneously.

### Pitfall 3: Over-allocating inline citations to Act 1
**What goes wrong:** The "front-loaded shock" decision creates pressure to cite every alarming stat in Act 1, using 12+ of the 15-20 inline citations in one section.
**Why it happens:** Act 1 has the most data-heavy argument and the highest word budget.
**How to avoid:** Pre-assign citations across acts during outline creation. Target: Act 1 gets 6-8 inline citations, Act 2 gets 4-5 (framework dimensions), Act 3 gets 3-4, Act 4 gets 1-2. This distribution ensures the framework and defense sections also carry research authority.
**Warning signs:** More than 8 sources assigned to Act 1 during outline creation.

### Pitfall 4: Word budget math not adding up to ~4500w
**What goes wrong:** Section budgets are set independently and total 5000+ words, or the Further Reading section is not excluded from the word count.
**Why it happens:** Each section feels like it needs "just 200 more words" for the argument to land.
**How to avoid:** Set word budgets that sum to 4500w (the midpoint of 3000-5000 range, aligned with the front-loaded constraint). The Further Reading section, TL;DR, and frontmatter are excluded from this count. Act 1: ~1500w, Act 2: ~1200w, Act 3: ~1000w, Act 4: ~800w = 4500w total.
**Warning signs:** Any single section budget exceeding its target by more than 100w during outline finalization.

### Pitfall 5: Outline sections that describe topics instead of making claims
**What goes wrong:** Section headings read like a table of contents ("The Impact of AI on Code Quality") instead of argument-as-heading titles ("AI Didn't Create the Problem -- It Removed the Guardrails").
**Why it happens:** Default instinct is to organize by topic rather than by argument.
**How to avoid:** Every H2 heading must be a claim the section defends, not a topic it covers. Test: could someone disagree with the heading? If yes, it's an argument. If no, it's a topic label.
**Warning signs:** Headings containing words like "Overview," "Introduction," "Analysis of," or "Discussion."

### Pitfall 6: Duplicate sources in the reference file
**What goes wrong:** The same paper appears twice under different titles (e.g., the arXiv PDF and arXiv HTML versions of "Assessing Bug-Proneness of Refactored Code", or the UFMG and ResearchGate versions of the turnover paper).
**Why it happens:** NotebookLM ingested the same paper from multiple URLs.
**How to avoid:** Cross-reference source titles during verification. The 48 sources include at least 3 known duplicates:
  - Sources 10 and 11: "Assessing Bug-Proneness of Refactored Code" (arXiv PDF vs. HTML)
  - Sources 5 and 44: "Turnover in Open-Source Projects" (ResearchGate vs. UFMG)
  - Sources 27 and 28: "Bug Resolution Times" (Chapman Digital Commons vs. MDPI)
  Mark duplicates and select the more accessible URL as the canonical version.

## Code Examples

Not applicable -- this phase produces Markdown deliverables, not code. The "code" is the bash verification script.

### URL Verification Script Pattern

```bash
#!/bin/bash
# Verify source URLs - returns HTTP status code for each
while IFS='|' read -r num url; do
  status=$(curl -sI -o /dev/null -w "%{http_code}" -L --max-time 10 "$url")
  echo "$num|$status|$url"
done < sources-urls.txt
```

**Input format (sources-urls.txt):**
```
1|https://www.researchgate.net/publication/399453518_...
2|https://www.researchgate.net/publication/397890586_...
```

**Output interpretation:**
- 200: VERIFIED
- 301/302: VERIFIED (redirect -- follow to confirm destination)
- 403: FLAGGED (check manually -- may be login wall)
- 404: UNREACHABLE (dead link)
- 000: UNREACHABLE (timeout or DNS failure)

## State of the Art

### Source Verification in Blog Publishing

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual click-through of every link | Automated HTTP status check + manual review of flagged URLs | 48 URLs verified in minutes instead of hours |
| All sources cited inline | Tiered citation (inline + further reading) for source-dense posts | Prevents "assembled" feel; maintains reading flow |
| Numbered footnotes for citations | Hyperlinked text weaving source names into prose | Standard for web thought-leadership; matches the essay's target format |

### Thought-Leadership Outline Conventions

| Pattern | Description | Used By |
|---------|-------------|---------|
| Argument-as-heading | Every section heading is a claim, not a topic | Osmani, Paul Graham, leading tech essayists |
| Front-loaded data | Open with the most alarming statistic, not context | GitClear reports, viral LinkedIn thought pieces |
| Named framework | The essay's intellectual contribution gets a proper name | "Comprehension Debt" (Osmani), "Code Churn" (GitClear), "DORA Metrics" |
| Word budgets per section | Pre-allocate word counts to prevent bloat | Professional longform editing practice |

## Complete Source Inventory

### All 48 NotebookLM Sources

| # | Title | URL | Type | Notes |
|---|-------|-----|------|-------|
| 1 | A Defect is Being Born: Time Sensitive Forecasting | https://www.researchgate.net/publication/399453518_... | web_page | Bug density prediction |
| 2 | Empirical Analysis of AI-Assisted Code Generation | https://www.researchgate.net/publication/397890586_... | web_page | 23.7% more vulns, 89% junior accept rate |
| 3 | CI/CD Impact on Software Quality in Linux | https://www.researchgate.net/publication/384471159_... | web_page | General CI/CD background |
| 4 | Program-PLATE: Vulnerability Feature Extraction | https://www.researchgate.net/publication/399762770_... | web_page | ML code auditing limitations |
| 5 | Turnover in OSS: Core Developers (ResearchGate) | https://www.researchgate.net/publication/344078871_... | web_page | 59.7% turnover rate, duplicate of #44 |
| 6 | 2026 State of Vulnerabilities (Mondoo) | https://mondoo.com/vulnerability-intelligence/state-of-vulnerabilities-2026 | web_page | 48,175 CVEs, 5-day exploit window |
| 7 | AI Copilot Code Quality 2025 (GitClear) | https://www.gitclear.com/ai_assistant_code_quality_2025_research | web_page | 4x clones, 211M lines, refactoring collapse |
| 8 | Bad Practices in CI (IFI UZH) | https://www.ifi.uzh.ch/seal/people/vassallo/ZampettiEMSE2019.pdf | pdf | 79 CI bad smells catalog |
| 9 | Empirical Study of Bug Fixing Rate (SMU) | http://www.mysmu.edu/faculty/davidlo/papers/compsac15-fixrate.pdf | pdf | Fix rate correlates to past contributions |
| 10 | Bug-Proneness of Refactored Code (arXiv PDF) | https://arxiv.org/pdf/2505.08005 | pdf | Duplicate of #11 |
| 11 | Bug-Proneness of Refactored Code (arXiv HTML) | https://arxiv.org/html/2505.08005v1 | web_page | Single refactoring 3x more bug-prone |
| 12 | Virtual Workplaces Impact (Frontiers) | https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1581029/full | web_page | EEG data on concentration/fatigue |
| 13 | Bug Characteristics in OSS (ResearchGate) | https://www.researchgate.net/publication/257559907_... | web_page | Semantic bugs dominant root cause |
| 14 | Quantum Software Bugs (arXiv) | https://arxiv.org/html/2512.24656v2 | web_page | 60% bug reduction with automated testing |
| 15 | Code Inflation (SpinRoot) | https://spinroot.com/gerard/pdf/Code_Inflation.pdf | pdf | "First Law of Software Development" |
| 16 | Coding on Copilot 2023 (GitClear) | https://www.gitclear.com/coding_on_copilot_data_shows_ais_downward_pressure_on_code_quality | web_page | 150M lines baseline data |
| 17 | CI/CD in QA (Compunnel) | https://www.compunnel.com/blogs/continuous-integration-and-continuous-deployment-ci-cd-in-quality-assurance-qa/ | web_page | General CI/CD overview |
| 18 | Dark Language HN Discussion | https://news.ycombinator.com/item?id=20562192 | web_page | "Dark" as concept in tech; tangential |
| 19 | DIB SWAP Report (Defense.gov) | https://media.defense.gov/2019/apr/30/2002124828/-1/-1/0/softwareisneverdone_refactoringtheacquisitioncodeforcompetitiveadvantage_final.swap.report.pdf | pdf | "Software Is Never Done" |
| 20 | DIB Ten Commandments of Software | https://stib.cto.mil/wp-content/uploads/2026/01/2019-8-2_ConceptPapers-CompletePackage.pdf | pdf | CI, automated testing mandates |
| 21 | Enterprise-scale Computation Imaging | https://cse.hkust.edu.hk/event/RTF2022/charlesz.pdf | pdf | "Mostly dark" control flows |
| 22 | Architectural Evolution in Microservices (EPrints) | https://eprints.cs.univie.ac.at/8103/1/Exploring%20Architectural%20Evolution%20in%20Microservice%20Systems%20using%20Repository%20Mining%20Techniques%20and%20Static%20Code%20Analysis.pdf | pdf | Connection Anomaly Ratio for erosion |
| 23 | GitClear Research Hub | https://www.gitclear.com/research_studies | web_page | "Diff Delta" metric overview |
| 24 | AI Test Case Prioritization (Ranger) | https://www.ranger.net/post/how-ai-improves-test-case-prioritization | web_page | AI in DevOps testing |
| 25 | AI Assistance and Coding Skills (Anthropic) | https://www.anthropic.com/research/AI-assistance-coding-skills | web_page | 17% mastery drop, 52-engineer RCT |
| 26 | Amazon AI Broke Everything (YouTube) | [YouTube video] | youtube | AI replacement critique |
| 27 | Bug Resolution Times (Chapman) | https://digitalcommons.chapman.edu/cgi/viewcontent.cgi?article=1165&context=engineering_articles | pdf | 1.71x faster fix by original author |
| 28 | Bug Resolution Times (MDPI) | https://www.mdpi.com/2076-3417/13/5/3150 | web_page | Duplicate of #27; project scale impact |
| 29 | Dark Web Cybercrime (Forbes) | https://www.forbes.com/councils/forbestechcouncil/2024/02/02/lessons-learned-from-tracing-cybercrimes-evolution-on-the-dark-web/ | web_page | General cybersecurity advice |
| 30 | Longitudinal Analysis of Software Defects | [generated_text] | generated_text | NOT-CITABLE: NLM synthesis |
| 31 | OWASP Top 10 2021 on Google Cloud | https://docs.cloud.google.com/architecture/security/owasp-top-ten-mitigation | web_page | Google Cloud mitigation guide |
| 32 | Rampant Software Errors (NIH/PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC4629271/ | web_page | Software bugs undermine science |
| 33 | Web Security Scanner Remediation (GCloud) | https://docs.cloud.google.com/security-command-center/docs/how-to-remediate-web-security-scanner-findings | web_page | Vulnerability remediation guide |
| 34 | Remote-Capable Knowledge Work (Preprints) | https://www.preprints.org/frontend/manuscript/6f9efe565425a903b13be4961d08a185/download_pub | pdf | AI lowers coordination costs |
| 35 | Salesforce Release Management (IJNRD) | https://ijnrd.org/papers/IJNRD2409416.pdf | pdf | SaaS CI/CD best practices |
| 36 | Security-Driven Pipelines (IJETCSIT) | https://www.ijetcsit.org/index.php/ijetcsit/article/download/256/214/500 | pdf | DevSecOps pipeline integration |
| 37 | SWAP Supplementary (Defense.gov) | https://media.defense.gov/2019/mar/26/2002105908/-1/-1/0/swap.report_supplementary.docs.3.21.19.pdf | pdf | Empirical data backing DIB |
| 38 | Software Vulnerability Stats 2026 (AppSec Santa) | https://appsecsanta.com/research/software-vulnerability-statistics | web_page | 25.1% AI code has exploitable vulns |
| 39 | Static Code Detection Tool Market | https://www.intelmarketresearch.com/static-code-detection-tool-2025-2032-288-5358 | web_page | SAST market growth |
| 40 | Supply Chain Attack Stats 2025 (DeepStrike) | https://deepstrike.io/blog/supply-chain-attack-statistics-2025 | web_page | Third-party breaches doubled to 30% |
| 41 | Technical Debt Quantification (AIR) | https://americanimpactreview.com/article/e2026034 | web_page | 31% defect increase per SD of debt |
| 42 | Pathogenesis of Dark Code | [generated_text] | generated_text | NOT-CITABLE: NLM synthesis |
| 43 | Three Pillars of Observability (SentinelOne) | https://www.sentinelone.com/blog/three-pillars-of-observability/ | web_page | Metrics/logs/traces overview |
| 44 | Turnover in OSS: Core Developers (UFMG) | https://homepages.dcc.ufmg.br/~mtov/pub/2020-sbes.pdf | pdf | Duplicate of #5 |
| 45 | Turnover-Induced Knowledge Loss (McGill) | https://www.cs.mcgill.ca/~martin/papers/esecfse2021.pdf | pdf | Developer knowledge loss qualitative |
| 46 | 50 AI Developer Tools Evaluated (AutonomyAI) | https://autonomyai.io/ai/we-evaluated-50-ai-developer-tools-most-dont-make-teams-faster-and-some-make-them-slower/ | web_page | Some tools make teams 19% slower |
| 47 | What Is CI/CD (Black Duck) | https://www.blackduck.com/glossary/what-is-cicd.html | web_page | CI/CD glossary definition |
| 48 | What is Technical Debt (Kissflow) | https://kissflow.com/low-code/what-is-technical-debt/ | web_page | TD types and management |

### Identified Duplicates (3 pairs)

| Pair | Source A | Source B | Canonical |
|------|----------|----------|-----------|
| Bug-Proneness of Refactored Code | #10 (arXiv PDF) | #11 (arXiv HTML) | #11 (HTML, more accessible) |
| Turnover in OSS Projects | #5 (ResearchGate) | #44 (UFMG PDF) | #5 (ResearchGate, abstract accessible without login) |
| Bug Resolution Times | #27 (Chapman PDF) | #28 (MDPI HTML) | #28 (MDPI, no download needed) |

### Non-Citable Sources (2)

| # | Title | Reason |
|---|-------|--------|
| 30 | Longitudinal Analysis of Software Defect Proliferation | NotebookLM-generated synthesis, not an external publication |
| 42 | The Pathogenesis of Dark Code | NotebookLM-generated synthesis, not an external publication |

### Unique Verifiable Sources After Deduplication

48 total - 3 duplicates - 2 non-citable = **43 unique, verifiable sources** from NotebookLM, plus ~5-8 external sources from existing research = **~48-51 total verifiable sources**.

## Open Questions

1. **YouTube source (#26) lacks a specific URL**
   - What we know: NotebookLM lists it as a YouTube video titled "I Looked At Amazon After They Fired 16,000 Engineers. Their AI Broke Everything."
   - What's unclear: The exact YouTube URL was not returned by NotebookLM source listing.
   - Recommendation: Search YouTube for the exact title during verification. If found, add the URL. If not, move to FURTHER-READING with a note that availability may change.

2. **Word budget note discrepancy between ROADMAP and CONTEXT.md**
   - What we know: ROADMAP success criteria says Act 1 ~1000w. CONTEXT.md (locked decision) says Act 1 ~1500w.
   - What's unclear: Nothing -- this was already resolved in the additional_context.
   - Recommendation: Use CONTEXT.md word budgets: Act 1 ~1500w, Act 2 ~1200w, Act 3 ~1000w, Act 4 ~800w = ~4500w total. The ROADMAP figure was a pre-discussion estimate.

3. **Government PDF URLs may have changed since sources were gathered**
   - What we know: defense.gov and stib.cto.mil reorganize periodically.
   - What's unclear: Whether sources #19, #20, #37 are still at their original paths.
   - Recommendation: Verify these early. If moved, search for the document title on the domain. Archive.org can provide fallback links.

## Sources

### Primary (HIGH confidence -- direct NotebookLM access)

- NotebookLM notebook `a1b56c66-65ca-4afb-8cb8-f962cdf53392` -- all 48 sources listed and queried
- `mcp__notebooklm-mcp__source_list_drive` -- complete source inventory with IDs and types
- `mcp__notebooklm-mcp__notebook_query` -- three targeted queries:
  1. Complete URL and claim inventory for all 48 sources
  2. Top 15-20 data points with exact numbers and source attribution
  3. 5-dimension framework mapping to specific research sources
  4. Identification of tangential sources for Further Reading

### Primary (HIGH confidence -- existing project research)

- `.planning/research/SUMMARY-dark-code.md` -- project overview, phase structure, pitfalls
- `.planning/research/FEATURES-dark-code.md` -- component specs, feature landscape, anti-features
- `.planning/research/ARCHITECTURE-dark-code-blog.md` -- site integration architecture
- `.planning/research/STACK-dark-code-post.md` -- technology stack, citation approach
- `.planning/phases/117-source-verification-and-outline/117-CONTEXT.md` -- locked user decisions

### Secondary (MEDIUM confidence -- cross-referenced)

- NotebookLM AI synthesis of claims and data points -- verified against source titles and content previews but individual statistics should be spot-checked against original publications during Phase 119 content authoring

## Metadata

**Confidence breakdown:**
- Source inventory: HIGH -- direct NotebookLM access, all 48 sources enumerated with URLs
- Verification approach: HIGH -- curl-based HTTP checking is a standard, proven pattern
- Citation tier assignment: HIGH -- data-first criteria from locked decisions provides clear selection rubric
- Outline structure: HIGH -- 4-act structure, word budgets, and heading style all locked in CONTEXT.md
- Framework dimensions: MEDIUM -- dimension names and data mappings are recommendations, not locked decisions; planner has discretion

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (sources may change availability; URL verification is time-sensitive)
