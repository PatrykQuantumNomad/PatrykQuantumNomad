import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort(
    (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
  );

  const lines = [
    '# Patryk Golabek',
    '',
    '> Cloud-Native Software Architect with 17+ years of experience in Kubernetes, AI/ML systems, platform engineering, and DevSecOps. Ontario, Canada.',
    '',
    '## Expertise Areas',
    '',
    '- Kubernetes & Cloud-Native Architecture (pre-1.0 adopter, production platforms)',
    '- AI/ML Systems & LLM Agents (RAG pipelines, LangGraph, Langflow)',
    '- Platform Engineering & DevSecOps (Terraform, CI/CD, GitOps)',
    '- Full-Stack Development (Python, Java, TypeScript, React, Angular)',
    '- Infrastructure as Code (Terraform, Terragrunt, Helm)',
    '',
    '## Pages',
    '',
    '- [Projects](https://patrykgolabek.dev/projects/): Featured open-source projects and work',
    '- [About](https://patrykgolabek.dev/about/): Background and experience',
    '- [Contact](https://patrykgolabek.dev/contact/): Get in touch',
    '',
    '## Featured Projects',
    '',
    '- networking-tools: Pentesting learning lab with 17 security tools (Nmap, Metasploit, SQLMap, etc.), 28 use-case scripts, and Docker-based vulnerable targets',
    '  Live: https://patrykquantumnomad.github.io/networking-tools/',
    '  Source: https://github.com/PatrykQuantumNomad/networking-tools',
    '',
    '## Blog Posts',
    '',
    ...sortedPosts.map(
      (p) =>
        `- [${p.data.title}](${p.data.externalUrl ?? `https://patrykgolabek.dev/blog/${p.id}/`}): ${p.data.description}`
    ),
    '',
    '## External Profiles',
    '',
    '- GitHub: https://github.com/PatrykQuantumNomad',
    '- X (Twitter): https://x.com/QuantumMentat',
    '- YouTube: https://youtube.com/@QuantumMentat',
    '- Translucent Computing Blog: https://translucentcomputing.com/blog/',
    '- Kubert AI Blog: https://mykubert.com/blog/',
    '',
    '> For full content, see: https://patrykgolabek.dev/llms-full.txt',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
