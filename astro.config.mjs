import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  site: 'https://patrykgolabek.dev',
  output: 'static',
  integrations: [
    expressiveCode({
      themes: ['github-dark', 'github-light'],
      themeCssSelector: (theme) => {
        if (theme.name === 'github-dark') return '.dark';
        if (theme.name === 'github-light') return ':root:not(.dark)';
        return undefined;
      },
      useDarkModeMediaQuery: false,
    }),
    mdx(),
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
});
