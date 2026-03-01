import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkReadingTime } from './remark-reading-time.mjs';
import indexNow from './src/integrations/indexnow';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://patrykgolabek.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [expressiveCode(), mdx(), tailwind(), sitemap({
    filter: (page) => !page.includes('/404'),
    serialize(item) {
      item.lastmod = new Date().toISOString();
      return item;
    },
  }), indexNow(), react()],
  markdown: {
    remarkPlugins: [remarkReadingTime, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});