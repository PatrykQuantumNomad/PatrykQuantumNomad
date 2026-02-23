import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { projects, categories } from '../data/projects';
import { totalScore } from '../lib/beauty-index/schema';
import { DIMENSIONS } from '../lib/beauty-index/dimensions';
import { JUSTIFICATIONS } from '../data/beauty-index/justifications';
import { totalScore as compassTotalScore } from '../lib/db-compass/schema';
import { DIMENSIONS as COMPASS_DIMENSIONS } from '../lib/db-compass/dimensions';

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
    '- Open-Source: 16+ public repositories spanning Kubernetes, AI agents, infrastructure as code, and more.',
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
  lines.push('40 validation rules across 5 categories:');
  lines.push('- Security: secret exposure in ENV/ARG, running as root, untagged base images');
  lines.push('- Efficiency: layer optimization, cache-friendly ordering, multi-stage builds');
  lines.push('- Maintainability: label metadata, pinned package versions');
  lines.push('- Reliability: HEALTHCHECK, signal handling, init process');
  lines.push('- Best Practice: community conventions, Hadolint DL codes');
  lines.push('Features: category-weighted scoring (A+ through F), inline CodeMirror annotations, Claude Skill download, Claude Code hook download');
  lines.push('Rule documentation: individual pages at /tools/dockerfile-analyzer/rules/{rule-id}/');
  lines.push('');

  // Beauty Index section
  lines.push('## Beauty Index');
  lines.push('');
  lines.push('The Beauty Index is an editorial ranking of 25 programming languages across 6 aesthetic dimensions.');
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
  lines.push('600 comparison pages available (25 × 24 ordered pairs). Both directions work.');
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
  lines.push('All Beauty Index and Database Compass data is licensed under CC-BY 4.0.');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
