import { readdirSync, readFileSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
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

/* ------------------------------------------------------------------ */
/*  Build a URL → lastmod map from blog post frontmatter at config    */
/*  load time so the sitemap uses real content dates, not build dates. */
/* ------------------------------------------------------------------ */
const SITE = 'https://patrykgolabek.dev';
const DATE_RE = /(?:updatedDate|publishedDate):\s*["']?(\d{4}-\d{2}-\d{2})["']?/g;

function buildContentDateMap() {
  /** @type {Map<string, string>} URL → ISO date */
  const map = new Map();

  // Blog posts: prefer updatedDate, fall back to publishedDate
  try {
    const blogDir = './src/data/blog';
    for (const file of readdirSync(blogDir)) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
      const raw = readFileSync(join(blogDir, file), 'utf-8');
      const slug = basename(file, extname(file));

      let published = '';
      let updated = '';
      for (const m of raw.matchAll(DATE_RE)) {
        if (m[0].startsWith('updated')) updated = m[1];
        else published = m[1];
      }
      const date = updated || published;
      if (date) map.set(`${SITE}/blog/${slug}/`, new Date(date).toISOString());
    }
  } catch { /* non-fatal — pages will omit lastmod */ }

  // Guide pages: use guide-level publishedDate from guide.json
  try {
    const meta = JSON.parse(
      readFileSync('./src/data/guides/fastapi-production/guide.json', 'utf-8'),
    );
    const guideDate = meta[0]?.publishedDate;
    if (guideDate) {
      const iso = new Date(guideDate).toISOString();
      map.set(`${SITE}/guides/fastapi-production/`, iso);
      map.set(`${SITE}/guides/fastapi-production/faq/`, iso);
      for (const ch of meta[0].chapters ?? []) {
        map.set(`${SITE}/guides/fastapi-production/${ch.slug}/`, iso);
      }
    }
  } catch { /* non-fatal */ }

  return map;
}

const contentDates = buildContentDateMap();

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  integrations: [expressiveCode(), mdx(), tailwind(), sitemap({
    filter: (page) => !page.includes('/404'),
    serialize(item) {
      // --- lastmod: use real content dates, omit when unknown -----------
      const knownDate = contentDates.get(item.url);
      if (knownDate) {
        item.lastmod = knownDate;
      } else {
        item.lastmod = undefined;
      }

      // --- changefreq + priority by section ----------------------------
      if (item.url === `${SITE}/`) {
        item.changefreq = 'weekly';
        item.priority = 1.0;
      } else if (item.url.includes('/guides/')) {
        item.changefreq = 'weekly';
        item.priority = 0.8;
      } else if (item.url.includes('/blog/')) {
        item.changefreq = 'monthly';
        item.priority = 0.7;
      } else if (item.url.includes('/tools/') && !item.url.includes('/rules/')) {
        item.changefreq = 'monthly';
        item.priority = 0.6;
      } else if (item.url.includes('/beauty-index/') || item.url.includes('/db-compass/') || item.url.includes('/eda/')) {
        item.changefreq = 'monthly';
        item.priority = 0.5;
      } else if (item.url.includes('/rules/')) {
        item.changefreq = 'yearly';
        item.priority = 0.3;
      } else {
        item.changefreq = 'monthly';
        item.priority = 0.5;
      }

      return item;
    },
  }), indexNow(), react()],
  markdown: {
    remarkPlugins: [remarkReadingTime, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});