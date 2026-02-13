import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { projects, categories } from '../data/projects';

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
  const sortedPosts = posts.sort(
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

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
