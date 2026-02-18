import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { remarkReadingTime } from './remark-reading-time.mjs';
import indexNow from './src/integrations/indexnow';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://patrykgolabek.dev',
  output: 'static',
  integrations: [expressiveCode(), mdx(), tailwind(), sitemap({
    customPages: [
      'https://networking-tools.patrykgolabek.dev/',
      'https://financial-data-extractor.patrykgolabek.dev/',
      'https://jobflow.patrykgolabek.dev/',
      'https://kubert-assistant-lite.patrykgolabek.dev/',
      'https://webinar-slack-bot.patrykgolabek.dev/',
    ],
  }), indexNow(), react()],
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
});