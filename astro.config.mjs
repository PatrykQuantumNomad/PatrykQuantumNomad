import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://patrykgolabek.dev',
  output: 'static',
  integrations: [tailwind()],
});
