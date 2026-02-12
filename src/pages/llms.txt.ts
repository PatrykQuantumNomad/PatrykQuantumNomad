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
    '## Blog Posts',
    '',
    ...sortedPosts.map(
      (p) =>
        `- [${p.data.title}](${p.data.externalUrl ?? `https://patrykgolabek.dev/blog/${p.id}/`}): ${p.data.description}`
    ),
    '',
    '## Optional',
    '',
    '- [Projects](https://patrykgolabek.dev/projects/): Featured open-source projects and work',
    '- [About](https://patrykgolabek.dev/about/): Background and experience',
    '- [Contact](https://patrykgolabek.dev/contact/): Get in touch',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
