# Dark Code Blog Post: Source Reference

**Verified:** 2026-04-14
**Total sources:** 56 (48 NotebookLM + 8 external)
**Inline citations:** 17
**Further reading:** 37
**Not citable:** 2

## Verification Summary

| Status | Count | Notes |
|--------|-------|-------|
| VERIFIED | 36 | Successfully resolved (HTTP 200) |
| VERIFIED (login wall) | 6 | ResearchGate abstracts accessible, PDFs require login |
| FLAGGED (bot protection) | 4 | Defense.gov, MDPI, Preprints.org block automated requests; accessible in browser |
| NOT-CITABLE | 2 | NotebookLM generated_text (#30, #42) |
| DUPLICATE | 3 pairs | Canonical URL selected for each |
| YOUTUBE (unverified) | 1 | #26 -- no direct URL in source metadata |

**Verification method:** `curl -sI -o /dev/null -w "%{http_code}" -L --max-time 15` with fallback to GET + User-Agent for HEAD-rejecting servers.

**Note on FLAGGED sources:** Sources #19, #28, #34, and #37 return HTTP 403 to automated requests but are known to be accessible in web browsers. Defense.gov (#19, #37) uses bot protection on PDF downloads. MDPI (#28) and Preprints.org (#34) block automated downloads. These are considered reachable for citation purposes.

---

## Inline Citation Sources (17 sources)

### 7. AI Copilot Code Quality 2025 (GitClear)
- **URL:** https://www.gitclear.com/ai_assistant_code_quality_2025_research
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Analysis of 211M lines of code shows copy/pasted code rose from 8.3% to 12.3% (4x clone growth), while refactoring collapsed from 25% to less than 10% of all code changes since AI coding assistants became mainstream.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 1 (opening bombshell), Act 2 (Clone Density + Refactoring Deficit dimensions)
- **Key Data Point:** 4x code clone growth; refactoring collapse from 25% to <10%

### 25. AI Assistance and Coding Skills (Anthropic)
- **URL:** https://www.anthropic.com/research/AI-assistance-coding-skills
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Randomized controlled trial with 52 professional engineers found that AI-assisted developers scored 17% lower on code comprehension quizzes compared to unassisted developers, suggesting AI tool reliance degrades understanding of the codebase.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 1 (comprehension alarm), Act 2 (Comprehension Decay dimension)
- **Key Data Point:** 17% lower comprehension scores in RCT

### 2. Empirical Analysis of AI-Assisted Code Generation
- **URL:** https://www.researchgate.net/publication/397890586
- **Status:** VERIFIED (login wall -- ResearchGate abstract accessible, PDF requires login)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** AI-generated code contains 23.7% more security vulnerabilities than human-written code, with 89% acceptance rate among junior developers and 76% of developers bypassing security review.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 1 (vulnerability alarm), Act 2 (Vulnerability Surface dimension)
- **Key Data Point:** 23.7% more vulnerabilities; 89% junior acceptance rate

### 6. 2026 State of Vulnerabilities (Mondoo)
- **URL:** https://mondoo.com/vulnerability-intelligence/state-of-vulnerabilities-2026
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** 48,175 CVEs reported in 2025 with 192,742 malicious packages detected. Time-to-exploit has collapsed to just 5 days from disclosure to active exploitation.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 1 (vulnerability scale), Act 2 (Vulnerability Surface dimension)
- **Key Data Point:** 48,175 CVEs; 5-day time-to-exploit window

### 5. Turnover in OSS: Core Developers (ResearchGate)
- **URL:** https://www.researchgate.net/publication/344078871
- **Status:** VERIFIED (login wall -- ResearchGate abstract accessible)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Study of 174 FLOSS projects found 59.7% experience 30%+ annual core developer turnover, with unstable projects exhibiting 2x slower bug fix rates.
- **Citation Tier:** INLINE (canonical -- duplicate of #44)
- **Act Assignment:** Act 2 (Ownership Vacuum dimension)
- **Key Data Point:** 59.7% of projects have 30%+ turnover

### 45. Turnover-Induced Knowledge Loss (McGill)
- **URL:** https://www.cs.mcgill.ca/~martin/papers/esecfse2021.pdf
- **Status:** VERIFIED (HTTP 200)
- **Type:** pdf
- **Date Accessed:** 2026-04-14
- **Key Claim:** Qualitative study documenting how developer turnover forces remaining team members to reverse-engineer departed developers' code, with significant productivity cost from knowledge loss.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 2 (Ownership Vacuum support)
- **Key Data Point:** Reverse-engineering cost of knowledge loss

### 41. Technical Debt Quantification (AIR)
- **URL:** https://americanimpactreview.com/article/e2026034
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Each standard deviation increase in technical debt correlates with a 31% increase in defect density, compounding at approximately 14% per quarter when left unaddressed.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 1 (debt compounding)
- **Key Data Point:** 31% defect increase per SD of technical debt

### 16. Coding on Copilot 2023 (GitClear)
- **URL:** https://www.gitclear.com/coding_on_copilot_data_shows_ais_downward_pressure_on_code_quality
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Baseline analysis of 150M+ lines showing early downward pressure on code quality metrics from AI coding assistants, establishing the pre-2024 trend lines that the 2025 report dramatically extended.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 1 (trend context)
- **Key Data Point:** 150M lines baseline; established pre-AI quality trends

### 15. Code Inflation (SpinRoot)
- **URL:** https://spinroot.com/gerard/pdf/Code_Inflation.pdf
- **Status:** VERIFIED (HTTP 200)
- **Type:** pdf
- **Date Accessed:** 2026-04-14
- **Key Claim:** Codebases grow exponentially regardless of team intent -- the "First Law of Software Development." More code means more places for bugs to hide and more surface area that no one fully understands.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 1 (structural inevitability)
- **Key Data Point:** "First Law of Software Development" -- code inflates exponentially

### 38. Software Vulnerability Stats 2026 (AppSec Santa)
- **URL:** https://appsecsanta.com/research/software-vulnerability-statistics
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** 25.1% of AI-generated code contains exploitable security vulnerabilities, representing a significant and measurable attack surface expansion.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 1 (AI vulnerability confirmation)
- **Key Data Point:** 25.1% of AI code has exploitable vulns

### 40. Supply Chain Attack Stats 2025 (DeepStrike)
- **URL:** https://deepstrike.io/blog/supply-chain-attack-statistics-2025
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Third-party software supply chain breaches doubled to 30% of all breaches, with attackers increasingly targeting the dependency graph rather than the application itself.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 3 (supply chain defense)
- **Key Data Point:** Third-party breaches doubled to 30%

### 11. Bug-Proneness of Refactored Code (arXiv HTML)
- **URL:** https://arxiv.org/html/2505.08005v1
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Single-type refactoring operations are 3x more bug-prone than composite refactoring, suggesting that AI-generated "quick fix" refactors may introduce more defects than holistic restructuring.
- **Citation Tier:** INLINE (canonical -- duplicate of #10)
- **Act Assignment:** Act 3 (refactoring quality)
- **Key Data Point:** Single refactoring 3x more bug-prone than composite

### 28. Bug Resolution Times (MDPI)
- **URL:** https://www.mdpi.com/2076-3417/13/5/3150
- **Status:** FLAGGED (bot protection -- HTTP 403 to automated requests, accessible in browser)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Bugs are resolved 1.71x faster when fixed by the original author of the code, and project scale significantly impacts resolution times -- larger projects with more ownership diffusion see slower fixes.
- **Citation Tier:** INLINE (canonical -- duplicate of #27)
- **Act Assignment:** Act 2 (Ownership Vacuum support), Act 3 (ownership defense)
- **Key Data Point:** 1.71x faster fix by original author

### 46. 50 AI Developer Tools Evaluated (AutonomyAI)
- **URL:** https://autonomyai.io/ai/we-evaluated-50-ai-developer-tools-most-dont-make-teams-faster-and-some-make-them-slower/
- **Status:** VERIFIED (HTTP 200)
- **Type:** web_page
- **Date Accessed:** 2026-04-14
- **Key Claim:** Evaluation of 50 AI developer tools found that most do not measurably improve team velocity, and some make teams 19% slower -- challenging the assumption that AI assistance always improves productivity.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 3 (tool evaluation)
- **Key Data Point:** Some AI tools make teams 19% slower

### 9. Empirical Study of Bug Fixing Rate (SMU)
- **URL:** http://www.mysmu.edu/faculty/davidlo/papers/compsac15-fixrate.pdf
- **Status:** VERIFIED (HTTP 200)
- **Type:** pdf
- **Date Accessed:** 2026-04-14
- **Key Claim:** Bug fix rate negatively correlates with time cost -- the longer a bug sits unfixed, the more expensive and complex it becomes to resolve, creating a compounding debt spiral.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 3 (time-to-fix urgency)
- **Key Data Point:** Negative correlation between fix rate and time cost

### 19. DIB SWAP Report (Defense.gov)
- **URL:** https://media.defense.gov/2019/apr/30/2002124828/-1/-1/0/softwareisneverdone_refactoringtheacquisitioncodeforcompetitiveadvantage_final.swap.report.pdf
- **Status:** FLAGGED (bot protection -- HTTP 403 to automated requests; defense.gov PDF accessible in browser)
- **Type:** pdf
- **Date Accessed:** 2026-04-14
- **Key Claim:** "Software Is Never Done" -- the Defense Innovation Board's landmark report arguing that software must be continuously refactored and maintained, not treated as a one-time deliverable.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 4 (philosophical frame)
- **Key Data Point:** "Software Is Never Done" framing from DOD

### 21. Enterprise-scale Computation Imaging (HKUST)
- **URL:** https://cse.hkust.edu.hk/event/RTF2022/charlesz.pdf
- **Status:** VERIFIED (HTTP 200)
- **Type:** pdf
- **Date Accessed:** 2026-04-14
- **Key Claim:** At enterprise scale, the majority of control flows in microservice architectures are "mostly dark" -- paths that execute in production but are never explicitly tested or monitored.
- **Citation Tier:** INLINE
- **Act Assignment:** Act 4 (the scale of the unknown)
- **Key Data Point:** "Mostly dark" control flows in enterprise systems

---

## Further Reading Sources (37 sources)

### AI and Code Quality

- **23.** [GitClear Research Hub](https://www.gitclear.com/research_studies) -- Overview of the "Diff Delta" metric and research methodology behind GitClear's code quality studies (VERIFIED)
- **26.** Amazon AI Broke Everything (YouTube) -- Video critique of AI replacement dynamics in software development (YOUTUBE -- no direct URL in source metadata)
- **E7.** [InfoQ: AI-Generated Code Technical Debt](https://www.infoq.com/news/2025/11/ai-code-technical-debt/) -- Industry press coverage of growing concerns about AI code quality and technical debt accumulation (VERIFIED)
- **E8.** [GitClear 2025 PDF (direct)](https://gitclear-public.s3.us-west-2.amazonaws.com/GitClear-AI-Copilot-Code-Quality-2025.pdf) -- Direct PDF download link for the full GitClear 2025 research report (VERIFIED)

### Software Defect Research

- **1.** [A Defect is Being Born: Time Sensitive Forecasting](https://www.researchgate.net/publication/399453518) -- Predictive model for bug density based on temporal code patterns (VERIFIED, login wall)
- **13.** [Bug Characteristics in OSS](https://www.researchgate.net/publication/257559907) -- Semantic bugs identified as the dominant root cause category in open-source projects (VERIFIED, login wall)
- **14.** [Quantum Software Bugs](https://arxiv.org/html/2512.24656v2) -- Automated testing achieves 60% bug reduction in quantum software, demonstrating testing ROI (VERIFIED)
- **32.** [Rampant Software Errors (NIH/PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4629271/) -- Evidence that software bugs undermine scientific reproducibility and research integrity (VERIFIED)
- **E6.** [Nature: Hallucinated Citations](https://www.nature.com/articles/d41586-026-00969-z) -- Meta-source on AI citation integrity risk and the danger of fabricated references (VERIFIED)

### Technical Debt Management

- **48.** [What is Technical Debt (Kissflow)](https://kissflow.com/low-code/what-is-technical-debt/) -- Accessible guide to technical debt types, causes, and management strategies (VERIFIED)
- **22.** [Architectural Evolution in Microservices (EPrints)](https://eprints.cs.univie.ac.at/8103/1/Exploring%20Architectural%20Evolution%20in%20Microservice%20Systems%20using%20Repository%20Mining%20Techniques%20and%20Static%20Code%20Analysis.pdf) -- Connection Anomaly Ratio as a metric for architectural erosion in microservices (VERIFIED)

### CI/CD and DevSecOps

- **3.** [CI/CD Impact on Software Quality in Linux](https://www.researchgate.net/publication/384471159) -- Study of CI/CD effectiveness in the Linux kernel ecosystem (VERIFIED, login wall)
- **8.** [Bad Practices in CI (IFI UZH)](https://www.ifi.uzh.ch/seal/people/vassallo/ZampettiEMSE2019.pdf) -- Catalog of 79 CI bad smells with prevalence data (VERIFIED)
- **17.** [CI/CD in QA (Compunnel)](https://www.compunnel.com/blogs/continuous-integration-and-continuous-deployment-ci-cd-in-quality-assurance-qa/) -- General overview of CI/CD integration in quality assurance workflows (VERIFIED)
- **35.** [Salesforce Release Management (IJNRD)](https://ijnrd.org/papers/IJNRD2409416.pdf) -- SaaS CI/CD best practices and release management patterns (VERIFIED)
- **36.** [Security-Driven Pipelines (IJETCSIT)](https://www.ijetcsit.org/index.php/ijetcsit/article/download/256/214/500) -- DevSecOps pipeline integration patterns and security automation (VERIFIED)
- **47.** [What Is CI/CD (Black Duck)](https://www.blackduck.com/glossary/what-is-cicd.html) -- CI/CD glossary definition and foundational concepts (VERIFIED)

### Security and Supply Chain

- **4.** [Program-PLATE: Vulnerability Feature Extraction](https://www.researchgate.net/publication/399762770) -- Machine learning approaches to automated code vulnerability detection and their current limitations (VERIFIED, login wall)
- **29.** [Dark Web Cybercrime (Forbes)](https://www.forbes.com/councils/forbestechcouncil/2024/02/02/lessons-learned-from-tracing-cybercrimes-evolution-on-the-dark-web/) -- General cybersecurity landscape and evolving threat patterns (VERIFIED)
- **31.** [OWASP Top 10 2021 on Google Cloud](https://docs.cloud.google.com/architecture/security/owasp-top-ten-mitigation) -- Google Cloud's guide to mitigating OWASP Top 10 vulnerabilities (VERIFIED)
- **33.** [Web Security Scanner Remediation (GCloud)](https://docs.cloud.google.com/security-command-center/docs/how-to-remediate-web-security-scanner-findings) -- Practical vulnerability remediation guidance for web applications (VERIFIED)
- **39.** [Static Code Detection Tool Market](https://www.intelmarketresearch.com/static-code-detection-tool-2025-2032-288-5358) -- SAST market growth projections indicating industry investment in code quality tooling (VERIFIED)
- **E3.** [GitHub Blog: Open Source Vulnerability Trends](https://github.blog/security/supply-chain-security/a-year-of-open-source-vulnerability-trends-cves-advisories-and-malware/) -- 69% increase in malware advisories and open-source vulnerability trends (VERIFIED)
- **E4.** [OWASP Top 10:2025 A03](https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/) -- OWASP framework for software supply chain failure categories (VERIFIED)

### Knowledge Loss and Team Dynamics

- **12.** [Virtual Workplaces Impact (Frontiers)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1581029/full) -- EEG data on developer concentration and fatigue in virtual work environments (VERIFIED)
- **34.** [Remote-Capable Knowledge Work (Preprints)](https://www.preprints.org/frontend/manuscript/6f9efe565425a903b13be4961d08a185/download_pub) -- AI's role in lowering coordination costs for distributed teams (FLAGGED, bot protection)
- **E1.** [Addy Osmani: Comprehension Debt](https://addyosmani.com/blog/comprehension-debt/) -- Companion concept to dark code; coined "comprehension debt" as the cost of unreadable code (VERIFIED)
- **E2.** [DX: Code Rot and Productivity](https://getdx.com/blog/code-rot/) -- Related concept exploring how code quality decay erodes developer productivity (VERIFIED)

### Defense and Government

- **20.** [DIB Ten Commandments of Software](https://stib.cto.mil/wp-content/uploads/2026/01/2019-8-2_ConceptPapers-CompletePackage.pdf) -- CI, automated testing, and continuous delivery mandates for defense software (VERIFIED)
- **37.** [SWAP Supplementary (Defense.gov)](https://media.defense.gov/2019/mar/26/2002105908/-1/-1/0/swap.report_supplementary.docs.3.21.19.pdf) -- Empirical data and supplementary analysis backing the DIB SWAP Report (FLAGGED, bot protection)

### Observability and Monitoring

- **43.** [Three Pillars of Observability (SentinelOne)](https://www.sentinelone.com/blog/three-pillars-of-observability/) -- Metrics, logs, and traces as the foundation for system observability (VERIFIED)
- **24.** [AI Test Case Prioritization (Ranger)](https://www.ranger.net/post/how-ai-improves-test-case-prioritization) -- AI-driven test case prioritization in DevOps testing workflows (VERIFIED)

### Miscellaneous

- **18.** [Dark Language HN Discussion](https://news.ycombinator.com/item?id=20562192) -- Hacker News discussion of "Dark" as a concept in technology; tangentially relevant background (VERIFIED)
- **E5.** [John D. Cook: Dark Debt (2018)](https://www.johndcook.com/blog/2018/03/01/dark-debt/) -- Prior art on using "dark" metaphor in technical debt discourse (VERIFIED)

---

## Not Citable Sources

### 30. Longitudinal Analysis of Software Defects
- **Status:** NOT-CITABLE (NotebookLM generated_text synthesis)
- **Type:** generated_text
- **Useful claims traced to:**
  - Defect density prediction patterns --> Source #1 (A Defect is Being Born)
  - Bug characteristics and root causes --> Source #13 (Bug Characteristics in OSS)
  - Software error impact on research --> Source #32 (Rampant Software Errors)
  - Technical debt compounding --> Source #41 (Technical Debt Quantification)
- **Note:** This is a NotebookLM-synthesized note combining findings from multiple real sources. All factual claims should be attributed to the original sources listed above.

### 42. Pathogenesis of Dark Code
- **Status:** NOT-CITABLE (NotebookLM generated_text synthesis)
- **Type:** generated_text
- **Useful claims traced to:**
  - Code clone growth and refactoring collapse --> Source #7 (GitClear 2025)
  - Comprehension decay mechanism --> Source #25 (Anthropic RCT)
  - Vulnerability surface expansion --> Source #2 (Empirical Analysis) and Source #6 (Mondoo 2026)
  - Ownership vacuum dynamics --> Source #5 (Turnover in OSS)
  - "Dark code" as a concept --> Source #21 (Enterprise Computation Imaging)
- **Note:** This is a NotebookLM-synthesized note that essentially pre-drafts the "dark code" argument. Its structure informed the essay outline, but all factual claims must cite the original research sources.

---

## Duplicate Sources

| Canonical | Duplicate | Reason |
|-----------|-----------|--------|
| #11 (arXiv HTML) | #10 (arXiv PDF) | Same paper "Assessing Bug-Proneness of Refactored Code" -- HTML version more accessible, no download required |
| #5 (ResearchGate) | #44 (UFMG PDF) | Same paper "Turnover in Open-Source Projects: Core Developers" -- ResearchGate has abstract + login; UFMG PDF verified at HTTP 200 |
| #28 (MDPI HTML) | #27 (Chapman PDF) | Same study "Bug Resolution Times" -- MDPI is the published journal version; Chapman is the institutional repository |

**Note on duplicate handling:** Canonical source is used in all inline citations and outline references. Duplicate URLs are retained as alternate access paths in Further Reading where applicable. Source #44 (UFMG PDF, HTTP 200) serves as a direct-access fallback for canonical #5 (ResearchGate, login wall).

---

*Source verification completed: 2026-04-14*
*Verification tool: curl with HEAD/GET fallback*
*Next phase consumer: Phase 119 (Content Authoring)*
