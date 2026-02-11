import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  return rss({
    title: 'Patryk Golabek | Blog',
    description:
      'Articles on cloud-native architecture, Kubernetes, AI/ML, and platform engineering',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
