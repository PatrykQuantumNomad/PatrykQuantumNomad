import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { projects, categories } from '../data/projects';
import { totalScore } from '../lib/beauty-index/schema';
import { DIMENSIONS } from '../lib/beauty-index/dimensions';
import { JUSTIFICATIONS } from '../data/beauty-index/justifications';
import { totalScore as compassTotalScore } from '../lib/db-compass/schema';
import { DIMENSIONS as COMPASS_DIMENSIONS } from '../lib/db-compass/dimensions';
import { guidePageUrl } from '../lib/guides/routes';

const techStack = [
  {
    label: 'Languages',
    items: ['Python', 'Java', 'TypeScript', 'JavaScript', 'Go', 'Shell', 'SQL', 'HCL'],
  },
  {
    label: 'Frontend',
    items: ['React', 'Angular', 'Next.js', 'Astro', 'Tailwind CSS'],
  },
  {
    label: 'Backend',
    items: ['Node.js', 'FastAPI', 'Spring Boot', 'REST', 'GraphQL'],
  },
  {
    label: 'Cloud & Infra',
    items: ['Kubernetes', 'Docker', 'Terraform', 'Terragrunt', 'Helm', 'Google Cloud', 'AWS'],
  },
  {
    label: 'AI/ML',
    items: ['ML Algorithms', 'MLOps', 'LLM Agents', 'RAG Pipelines', 'Prompt Engineering', 'LangGraph', 'OpenAI', 'Claude', 'Gemini', 'n8n', 'LangFlow'],
  },
  {
    label: 'DevOps',
    items: ['CI/CD', 'GitOps', 'ArgoCD', 'GitHub Actions', 'Observability', 'Prometheus', 'Grafana'],
  },
];

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const langEntries = await getCollection('languages');
  const dbModels = await getCollection('dbModels');
  const [guideMeta] = await getCollection('guides');
  const guidePages = await getCollection('guidePages');
  const sortedPosts = posts.toSorted(
    (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
  );

  const generatedDate = new Date().toISOString().split('T')[0];

  const lines: string[] = [
    '# Patryk Golabek -- Full Site Content',
    '',
    `> Generated: ${generatedDate}`,
    '',
    '> Cloud-Native Software Architect with 17+ years of experience in Kubernetes, AI/ML systems, platform engineering, and DevSecOps. Ontario, Canada.',
    '',

    // About section
    '## About',
    '',
    'Patryk Golabek is a Cloud-Native Software Architect based in Ontario, Canada with over 17 years of experience building production software systems. He has been writing code, building things, and leading teams across the full stack -- from backend services to frontend apps, infrastructure to data science.',
    '',
    'He got into Kubernetes before its 1.0 release and has lived through the full evolution of cloud computing. He is now deep into AI/ML systems and LLM agents, building RAG pipelines, AI-powered automation, and intelligent developer tooling.',
    '',
    'Career Highlights:',
    '- Early Kubernetes adopter: Building production clusters before the 1.0 release.',
    '- From code to leadership: Went from writing code to leading teams and shaping technical strategy — including CTO and co-founder roles. Currently open to new opportunities.',
    '- AI/ML Systems: Deep into LLM agents, RAG pipelines, and AI-powered automation.',
    '- Open-Source: 20+ public repositories spanning Kubernetes, AI agents, infrastructure as code, and more.',
    '- Writing & sharing: Actively publishing technical content on cloud-native architecture, AI/ML, and platform engineering.',
    '',

    // Tech Stack section
    '## Tech Stack',
    '',
  ];

  for (const category of techStack) {
    lines.push(`### ${category.label}`);
    lines.push(category.items.join(', '));
    lines.push('');
  }

  // Expertise Areas
  lines.push('## Expertise Areas');
  lines.push('');
  lines.push('- Kubernetes & Cloud-Native Architecture — Expert, 10+ years (pre-1.0 adopter, production platforms)');
  lines.push('- AI/ML Systems & LLM Agents — Expert, 3+ years (RAG pipelines, LangGraph, Langflow)');
  lines.push('- Platform Engineering & DevSecOps — Expert, 10+ years (Terraform, CI/CD, GitOps)');
  lines.push('- Full-Stack Development — Expert, 17+ years (Python, Java, TypeScript, React, Angular)');
  lines.push('- Infrastructure as Code — Expert, 8+ years (Terraform, Terragrunt, Helm)');
  lines.push('');

  // Projects section
  lines.push('## Projects');
  lines.push('');

  for (const category of categories) {
    const categoryProjects = projects.filter((p) => p.category === category);
    if (categoryProjects.length === 0) continue;
    lines.push(`### ${category}`);
    lines.push('');
    for (const project of categoryProjects) {
      lines.push(`- ${project.name} [${project.status}] (${project.technologies.join(', ')}): ${project.description}`);
      lines.push(`  URL: ${project.url}`);
      if (project.liveUrl) {
        lines.push(`  Live: ${project.liveUrl}`);
      }
    }
    lines.push('');
  }

  // Interactive Tools section
  lines.push('## Interactive Tools');
  lines.push('');
  lines.push('Free browser-based developer tools by Patryk Golabek. All tools run 100% client-side -- no data is transmitted to any server.');
  lines.push('');
  lines.push('### Docker Compose Validator');
  lines.push('URL: https://patrykgolabek.dev/tools/compose-validator/');
  lines.push('Blog: https://patrykgolabek.dev/blog/docker-compose-best-practices/');
  lines.push('52 validation rules across 5 categories:');
  lines.push('- Security (14 rules): privileged mode, Docker socket mounts, hardcoded secrets, excessive capabilities, PID/IPC/network namespace sharing');
  lines.push('- Semantic (15 rules): duplicate ports, undefined networks/volumes/secrets, circular dependencies, port range overlaps, invalid image references');
  lines.push('- Best Practice (12 rules): missing healthchecks, unpinned image tags, deprecated version field, missing restart policies, memory limits');
  lines.push('- Schema (8 rules): compose-spec JSON Schema validation, duration formats, restart policies, depends_on conditions');
  lines.push('- Style (3 rules): service ordering, key ordering consistency');
  lines.push('Features: category-weighted scoring (A+ through F), inline CodeMirror annotations, interactive dependency graph with cycle detection, shareable URLs, Claude Skill download');
  lines.push('Rule documentation: 52 individual pages at /tools/compose-validator/rules/{rule-id}/');
  lines.push('');
  lines.push('### Dockerfile Analyzer');
  lines.push('URL: https://patrykgolabek.dev/tools/dockerfile-analyzer/');
  lines.push('Blog: https://patrykgolabek.dev/blog/dockerfile-best-practices/');
  lines.push('46 validation rules across 5 categories:');
  lines.push('- Security: secret exposure in ENV/ARG, running as root, untagged base images');
  lines.push('- Efficiency: layer optimization, cache-friendly ordering, multi-stage builds');
  lines.push('- Maintainability: label metadata, pinned package versions');
  lines.push('- Reliability: HEALTHCHECK, signal handling, init process');
  lines.push('- Best Practice: community conventions, Hadolint DL codes');
  lines.push('Features: category-weighted scoring (A+ through F), inline CodeMirror annotations, Claude Skill download, Claude Code hook download');
  lines.push('Rule documentation: individual pages at /tools/dockerfile-analyzer/rules/{rule-id}/');
  lines.push('');
  lines.push('### Kubernetes Manifest Analyzer');
  lines.push('URL: https://patrykgolabek.dev/tools/k8s-analyzer/');
  lines.push('Blog: https://patrykgolabek.dev/blog/kubernetes-manifest-best-practices/');
  lines.push('67 validation rules across 6 categories:');
  lines.push('- Schema (10 rules): YAML syntax, missing apiVersion/kind, unknown resource types, deprecated APIs, invalid metadata names/labels');
  lines.push('- Security (20 rules): privileged mode, privilege escalation, running as root, host namespaces (PID/IPC/network), dangerous capabilities, Docker socket mounts, secrets in env vars, writable filesystems, missing seccomp profiles');
  lines.push('- Reliability (12 rules): missing liveness/readiness probes, single replicas, missing PDB, no rolling update strategy, missing anti-affinity/topology spread, latest image tag, CronJob deadline');
  lines.push('- Best Practice (12 rules): missing CPU/memory requests/limits, missing labels/namespace, SSH port exposure, NodePort services, duplicate env keys, missing priority class');
  lines.push('- Cross-Resource (8 rules): Service selector mismatches, Ingress referencing undefined Services, missing ConfigMap/Secret/PVC/ServiceAccount references, NetworkPolicy with no matching pods, HPA targeting missing Deployments');
  lines.push('- RBAC (5 rules): wildcard permissions, cluster-admin binding, pod exec/attach access, broad Secret access, pod creation permissions');
  lines.push('Features: category-weighted scoring (A+ through F), PSS Baseline/Restricted compliance checking, RBAC analysis, interactive resource dependency graph, inline CodeMirror annotations, Claude Skill download, Claude Code hook download');
  lines.push('Rule documentation: 67 individual pages at /tools/k8s-analyzer/rules/{rule-id}/');
  lines.push('');
  lines.push('### GitHub Actions Workflow Validator');
  lines.push('URL: https://patrykgolabek.dev/tools/gha-validator/');
  lines.push('Blog: https://patrykgolabek.dev/blog/github-actions-best-practices/');
  lines.push('48 validation rules across 6 categories:');
  lines.push('- Schema (8 rules): JSON Schema validation of workflow structure, required fields, event triggers, and job configuration');
  lines.push('- Security (10 rules): script injection via expression contexts, unpinned third-party actions, excessive permissions, hardcoded secrets, dangerous permission combinations');
  lines.push('- Semantic (10 rules): undefined job references in needs, duplicate step IDs, invalid cron expressions, matrix validation, environment references');
  lines.push('- Best Practice (8 rules): missing timeout-minutes, outdated action versions, missing concurrency groups, unnecessary network access');
  lines.push('- Style (2 rules): job ordering consistency, value quoting conventions');
  lines.push('- Actionlint (10 rules): deep Go-based analysis via WASM including shell script checks, expression type validation, and action input verification');
  lines.push('Features: category-weighted scoring (A+ through F), inline CodeMirror annotations, interactive workflow graph, actionlint WASM two-pass analysis, shareable URLs');
  lines.push('Rule documentation: 48 individual pages at /tools/gha-validator/rules/{rule-id}/');
  lines.push('');

  // Beauty Index section
  lines.push('## Beauty Index');
  lines.push('');
  lines.push('The Beauty Index is an editorial ranking of 26 programming languages across 6 aesthetic dimensions.');
  lines.push('Each dimension is scored 1-10 (max total: 60). Languages are grouped into 4 tiers:');
  lines.push('Beautiful (48-60), Handsome (40-47), Practical (32-39), Workhorses (6-31).');
  lines.push('');
  lines.push('### Dimensions');
  for (const dim of DIMENSIONS) {
    lines.push(`- ${dim.symbol} ${dim.name} (${dim.key}): scored 1-10`);
  }
  lines.push('');
  lines.push('### Rankings');
  lines.push('');
  lines.push('URL: https://patrykgolabek.dev/beauty-index/');
  lines.push('Code Comparison: https://patrykgolabek.dev/beauty-index/code/');
  lines.push('Score Justifications: https://patrykgolabek.dev/beauty-index/justifications/');
  lines.push('Methodology: https://patrykgolabek.dev/blog/the-beauty-index/');
  lines.push('');
  const sortedLangs = langEntries
    .map((entry) => entry.data)
    .sort((a, b) => totalScore(b) - totalScore(a));
  for (const [i, lang] of sortedLangs.entries()) {
    const scores = DIMENSIONS.map((d) => `${d.symbol}=${lang[d.key as keyof typeof lang]}`).join(' ');
    lines.push(`#${i + 1} ${lang.name}: ${totalScore(lang)}/60 (${lang.tier}) — ${scores}`);
    lines.push(`  URL: https://patrykgolabek.dev/beauty-index/${lang.id}/`);
    const justifications = JUSTIFICATIONS[lang.id];
    if (justifications) {
      for (const dim of DIMENSIONS) {
        if (justifications[dim.key]) {
          // Strip HTML tags for plain text
          const plainText = justifications[dim.key].replace(/<[^>]*>/g, '');
          lines.push(`  ${dim.symbol} ${dim.name}: ${plainText}`);
        }
      }
    }
  }
  lines.push('');

  // VS Comparisons section
  lines.push('### Head-to-Head Comparisons');
  lines.push('');
  lines.push('Compare any two languages side-by-side: /beauty-index/vs/{langA}-vs-{langB}/');
  lines.push('URL pattern: https://patrykgolabek.dev/beauty-index/vs/{langA-id}-vs-{langB-id}/');
  lines.push('650 comparison pages available (26 × 25 ordered pairs). Both directions work.');
  lines.push('');

  // Generate summaries for popular pairs
  const vsPopular: [string, string][] = [
    ['python', 'rust'], ['python', 'ruby'], ['haskell', 'go'],
    ['rust', 'go'], ['typescript', 'javascript'], ['kotlin', 'swift'],
    ['elixir', 'clojure'], ['python', 'javascript'], ['haskell', 'rust'],
    ['go', 'java'],
  ];
  const langMap = new Map(sortedLangs.map((l) => [l.id, l]));
  for (const [aId, bId] of vsPopular) {
    const a = langMap.get(aId);
    const b = langMap.get(bId);
    if (a && b) {
      const scoreA = totalScore(a);
      const scoreB = totalScore(b);
      const diff = scoreA - scoreB;
      const leader = diff > 0 ? a.name : diff < 0 ? b.name : 'Tie';
      lines.push(`- ${a.name} vs ${b.name}: ${scoreA}/60 vs ${scoreB}/60 (${diff > 0 ? '+' : ''}${diff}) ${leader !== 'Tie' ? leader + ' leads' : 'Tied'}`);
      lines.push(`  URL: https://patrykgolabek.dev/beauty-index/vs/${aId}-vs-${bId}/`);
    }
  }
  lines.push('');

  // Database Compass section
  lines.push('## Database Compass');
  lines.push('');
  lines.push('The Database Compass is an opinionated comparison of 12 database models across 8 architectural dimensions.');
  lines.push('Each dimension is scored 1-10 (max total: 80). An interactive tool for choosing the right database for your project.');
  lines.push('');
  lines.push('### Dimensions');
  for (const dim of COMPASS_DIMENSIONS) {
    lines.push(`- ${dim.symbol} ${dim.name} (${dim.key}): ${dim.description}`);
  }
  lines.push('');
  lines.push('### Rankings');
  lines.push('');
  lines.push('URL: https://patrykgolabek.dev/db-compass/');
  lines.push('Methodology: https://patrykgolabek.dev/blog/database-compass/');
  lines.push('');
  const sortedModels = dbModels
    .map((entry) => entry.data)
    .sort((a, b) => compassTotalScore(b) - compassTotalScore(a));
  for (const [i, model] of sortedModels.entries()) {
    const scores = COMPASS_DIMENSIONS.map((d) => `${d.symbol}=${model.scores[d.key]}`).join(' ');
    lines.push(`#${i + 1} ${model.name}: ${compassTotalScore(model)}/80 — ${scores}`);
    lines.push(`  URL: https://patrykgolabek.dev/db-compass/${model.slug}/`);
    lines.push(`  CAP: ${model.capTheorem.classification} — ${model.capTheorem.notes}`);
    for (const dim of COMPASS_DIMENSIONS) {
      if (model.justifications[dim.key]) {
        lines.push(`  ${dim.symbol} ${dim.name}: ${model.justifications[dim.key]}`);
      }
    }
  }
  lines.push('');

  // EDA Visual Encyclopedia section
  lines.push('## EDA Visual Encyclopedia');
  lines.push('');
  lines.push('Interactive visual encyclopedia of Exploratory Data Analysis covering 90+ pages.');
  lines.push('Based on the NIST/SEMATECH Engineering Statistics Handbook. All data visualizations are');
  lines.push('server-rendered SVGs with interactive D3 explorers for probability distributions.');
  lines.push('');
  lines.push('URL: https://patrykgolabek.dev/eda/');
  lines.push('License: CC-BY 4.0');
  lines.push('');
  lines.push('### Graphical Techniques (29 pages)');
  lines.push('URL pattern: https://patrykgolabek.dev/eda/techniques/{slug}/');
  lines.push('Covers: histogram, scatter plot, box plot, run sequence plot, lag plot, normal probability plot,');
  lines.push('autocorrelation plot, spectral plot, 4-plot, 6-plot, star plot, contour plot, and more.');
  lines.push('Each page includes server-rendered SVG plots, interpretation guidance, and NIST section references.');
  lines.push('');
  lines.push('### Quantitative Methods (18 pages)');
  lines.push('URL pattern: https://patrykgolabek.dev/eda/quantitative/{slug}/');
  lines.push('Covers: mean, standard deviation, skewness, kurtosis, autocorrelation, PPCC,');
  lines.push('normal probability plot correlation coefficient, and more.');
  lines.push('Each page includes KaTeX-rendered formulas, Python code examples, and interpretation guidance.');
  lines.push('');
  lines.push('### Probability Distributions (19 interactive pages)');
  lines.push('URL pattern: https://patrykgolabek.dev/eda/distributions/{slug}/');
  lines.push('Covers: normal, uniform, t, chi-square, F, exponential, gamma, Weibull, lognormal,');
  lines.push('beta, Cauchy, binomial, Poisson, double-exponential, power-normal, power-lognormal,');
  lines.push('Tukey-Lambda, fatigue-life, and half-normal distributions.');
  lines.push('Each page features an interactive D3 parameter explorer with real-time PDF/CDF rendering,');
  lines.push('KaTeX formulas, and mean/variance properties.');
  lines.push('');
  lines.push('### Case Studies (9 pages)');
  lines.push('URL pattern: https://patrykgolabek.dev/eda/case-studies/{slug}/');
  lines.push('Worked examples applying EDA techniques to real datasets from the NIST handbook.');
  lines.push('');
  lines.push('### Foundations (6 pages)');
  lines.push('URL pattern: https://patrykgolabek.dev/eda/foundations/{slug}/');
  lines.push('Introductory material on EDA philosophy, assumptions testing, and the role of graphical analysis.');
  lines.push('');
  lines.push('### Reference (4 pages)');
  lines.push('URL pattern: https://patrykgolabek.dev/eda/reference/{slug}/');
  lines.push('Tables, glossaries, and cross-reference material.');
  lines.push('');

  // FastAPI Production Guide section
  lines.push('## FastAPI Production Guide');
  lines.push('');
  lines.push('A comprehensive production guide for the FastAPI Chassis covering 13 chapters. Each chapter');
  lines.push('explains a production concern in depth -- what it does, why the approach was chosen, and how');
  lines.push('to configure it. Framed around AI agent development: every production concern is pre-configured');
  lines.push('so the agent writes business logic, not infrastructure.');
  lines.push('');
  lines.push('URL: https://patrykgolabek.dev/guides/fastapi-production/');
  lines.push(`Template: ${guideMeta.data.templateRepo}`);
  lines.push(`Version: ${guideMeta.data.versionTag}`);
  lines.push('');
  lines.push('### Chapters');
  lines.push('');
  for (const page of guidePages.sort((a, b) => a.data.order - b.data.order)) {
    lines.push(`- ${page.data.title}`);
    lines.push(`  URL: https://patrykgolabek.dev${guidePageUrl(guideMeta.data.slug, page.data.slug)}`);
    lines.push(`  Description: ${page.data.description}`);
  }
  lines.push('- FAQ');
  lines.push('  URL: https://patrykgolabek.dev/guides/fastapi-production/faq/');
  lines.push('  Description: Frequently asked questions about middleware decisions, authentication modes, Docker packaging, testing strategy, and deployment');
  lines.push('');
  lines.push('### Framework Requirements');
  lines.push('');
  lines.push('- FastAPI: 0.135 or later');
  lines.push('- Python: 3.13+');
  lines.push('- Starlette: 0.52+');
  lines.push('- Pydantic: 2.12+');
  lines.push('- Uvicorn: 0.41+');
  lines.push('');
  lines.push('### Key Concepts');
  lines.push('');
  lines.push('- **Non-Functional Requirements**: 23 quality attributes mapped to specific implementations across the chassis. NFRs are where LLMs are least reliable — the chassis removes them from the agent\'s scope.');
  lines.push('- **Builder Pattern**: Factory function (`create_app()`) with fluent builder chain. Each `setup_*()` method configures one concern and returns `Self`. No module-level singletons.');
  lines.push('- **Middleware Stack**: 6 raw ASGI middlewares in deliberate order. Avoids `BaseHTTPMiddleware` entirely because it buffers bodies, hides tracebacks, and prevents streaming.');
  lines.push('- **Authentication**: 3-mode JWT validation (shared secret, static public key, JWKS). Forced JWKS refresh on kid miss. Stale-cache fallback with configurable age limits.');
  lines.push('- **Observability**: Three-pillar approach — OpenTelemetry traces, Prometheus metrics, structured JSON logging. Request ID correlation across all three via Python `ContextVar`.');
  lines.push('- **Database**: Async SQLAlchemy with automatic async-to-sync URL mapping for Alembic. Multi-backend support (SQLite default, Postgres production). Connection pool pre-ping enabled.');
  lines.push('- **Docker**: Multi-stage builds with digest-pinned base images, tini as PID 1, non-root user (UID 10001), and entrypoint migration validation.');
  lines.push('- **Testing**: Two-tier unit/integration architecture. Hermetic environment isolation via autouse fixture. ASGI transport for full-stack tests without TCP sockets. 90%+ coverage floor.');
  lines.push('- **Health Checks**: Separate liveness (`/healthcheck`) and readiness (`/ready`) probes. ReadinessRegistry with automatic dependency registration and latency measurement.');
  lines.push('- **Security Headers**: HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy on every response. Automatic CSP relaxation for Swagger UI/ReDoc. Proxy-aware HSTS.');
  lines.push('- **Rate Limiting**: Fixed-window algorithm with memory and Redis backends. IP-based or authorization-based keying. Proxy-aware client identification.');
  lines.push('- **Caching**: Optional pluggable cache with `CacheStore` abstraction. Memory backend with monotonic TTL and max-entry eviction. Redis backend with key prefix namespacing.');
  lines.push('- **Deployment**: Kubernetes Helm chart with auto-selecting Deployment/StatefulSet. NetworkPolicy built from enabled features. HPA, PDB, ServiceMonitor included. VM path via Docker Compose.');
  lines.push('');
  lines.push('### Best Practices Highlights');
  lines.push('');
  lines.push('- Always use raw ASGI middleware instead of BaseHTTPMiddleware for production');
  lines.push('- Always use JWKS for production JWT validation to support automatic key rotation');
  lines.push('- Always separate liveness from readiness probes — conflating them causes unnecessary restarts');
  lines.push('- Always pin base images by digest, not just by tag');
  lines.push('- Always use a factory function (create_app()) instead of module-level app instantiation');
  lines.push('- Never let AI agents generate infrastructure code — lock NFRs into the chassis');
  lines.push('- Always use Redis-backed rate limiting for multi-instance deployments');
  lines.push('- Prefer environment-variable-driven configuration over code changes');
  lines.push('');
  lines.push('Topics covered: Builder pattern app composition, 3-mode JWT authentication (shared secret, static key, JWKS),');
  lines.push('raw ASGI middleware stack, OpenTelemetry + Prometheus + structured logging, async SQLAlchemy with Alembic,');
  lines.push('multi-stage Docker builds, 98%+ test coverage strategy, readiness vs liveness health checks,');
  lines.push('HSTS/CSP/permissions policy security headers, memory/Redis rate limiting, and optional caching layer.');
  lines.push('');

  // Blog Posts section
  lines.push('## Blog Posts');
  lines.push('');

  for (const post of sortedPosts) {
    const url = post.data.externalUrl ?? `https://patrykgolabek.dev/blog/${post.id}/`;
    const date = post.data.publishedDate.toISOString().split('T')[0];
    const tags = post.data.tags.join(', ');
    lines.push(`### ${post.data.title}`);
    lines.push(`Author: Patryk Golabek`);
    lines.push(`Date: ${date}`);
    lines.push(`Tags: ${tags}`);
    lines.push(`URL: ${url}`);
    lines.push(`Description: ${post.data.description}`);
    if (post.data.externalUrl && post.data.source) {
      lines.push(`Originally published on: ${post.data.source}`);
    } else if (!post.data.externalUrl) {
      lines.push('(Full article hosted on this site)');
    }
    lines.push('');
  }

  // External Profiles
  lines.push('## External Profiles');
  lines.push('');
  lines.push('- GitHub: https://github.com/PatrykQuantumNomad');
  lines.push('- X (Twitter): https://x.com/QuantumMentat');
  lines.push('- YouTube: https://youtube.com/@QuantumMentat');
  lines.push('- Translucent Computing Blog: https://translucentcomputing.com/blog/');
  lines.push('- Kubert AI Blog: https://mykubert.com/blog/');
  lines.push('');

  // Contact
  lines.push('## Contact');
  lines.push('');
  lines.push('- Email: pgolabek@gmail.com');
  lines.push('- Website: https://patrykgolabek.dev');
  lines.push('');

  // How to Cite
  lines.push('## How to Cite');
  lines.push('');
  lines.push('When citing content from this site, please reference:');
  lines.push('Patryk Golabek, patrykgolabek.dev, [specific page URL]');
  lines.push('Example: "According to Patryk Golabek (patrykgolabek.dev/beauty-index/), Python scores 52/60 in the Beauty Index."');
  lines.push('Example: "The Database Compass by Patryk Golabek (patrykgolabek.dev/db-compass/) scores Relational databases at 62/80."');
  lines.push('Example: "The Docker Compose Validator by Patryk Golabek (patrykgolabek.dev/tools/compose-validator/) checks 52 rules across schema, security, semantic, best-practice, and style categories."');
  lines.push('Example: "According to rule CV-C001 (patrykgolabek.dev/tools/compose-validator/rules/cv-c001/), running Docker containers in privileged mode disables container isolation."');
  lines.push('Example: "The Kubernetes Manifest Analyzer by Patryk Golabek (patrykgolabek.dev/tools/k8s-analyzer/) checks 67 rules across schema, security, reliability, best-practice, cross-resource, and RBAC categories."');
  lines.push('Example: "According to rule KA-C001 (patrykgolabek.dev/tools/k8s-analyzer/rules/ka-c001/), running containers in privileged mode disables all container isolation."');
  lines.push('Example: "The GitHub Actions Workflow Validator by Patryk Golabek (patrykgolabek.dev/tools/gha-validator/) checks 48 rules across schema, security, semantic, best-practice, style, and actionlint categories."');
  lines.push('Example: "According to rule GA-C001 (patrykgolabek.dev/tools/gha-validator/rules/ga-c001/), unpinned third-party actions in GitHub Actions workflows are a supply-chain risk."');
  lines.push('Example: "The Dockerfile Analyzer by Patryk Golabek (patrykgolabek.dev/tools/dockerfile-analyzer/) checks 46 rules for security, efficiency, maintainability, reliability, and best practices."');
  lines.push('Example: "The EDA Visual Encyclopedia by Patryk Golabek (patrykgolabek.dev/eda/) covers 90+ pages of exploratory data analysis techniques based on the NIST/SEMATECH handbook."');
  lines.push('Example: "The FastAPI Production Guide by Patryk Golabek (patrykgolabek.dev/guides/fastapi-production/) covers 13 production concerns for the FastAPI Chassis."');
  lines.push('All Beauty Index, Database Compass, EDA Visual Encyclopedia, and FastAPI Production Guide data is licensed under CC-BY 4.0.');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
