import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkReadingTime } from './remark-reading-time.mjs';
import { rehypeExternalLinks } from './rehype-external-links.mjs';
import indexNow from './src/integrations/indexnow';
import notebookPackager from './src/integrations/notebook-packager';
import { buildContentDateMap, resolvePrefixLastmod, buildSparseTagSet } from './src/lib/sitemap/content-dates';

import react from '@astrojs/react';

// Phase 126 — CSS bundle analyzer, gated by ANALYZE=1 env var.
// When set, rollup-plugin-visualizer emits two reports to
// .planning/reports/ (NOT dist/ — would break Phase 123 sitemap
// determinism). Default builds never load the plugin.
const ANALYZE = process.env.ANALYZE === '1';

// Single timestamp reused across both visualizer outputs so the treemap
// HTML and raw-data JSON from the same analyze run share a suffix.
const ANALYZE_STAMP = new Date().toISOString().replace(/\D/g, '').slice(0, 13);

/* ------------------------------------------------------------------ */
/*  Content date map — URL → ISO lastmod, built at config load time   */
/*  from src/lib/sitemap/content-dates.ts. Every value is deterministic*/
/*  (no new Date()/Date.now()/statSync). See that module for details. */
/* ------------------------------------------------------------------ */
const SITE = 'https://patrykgolabek.dev';
const contentDates = buildContentDateMap();
const sparseTags = buildSparseTagSet(3); // tags with < 3 posts → excluded from sitemap (TSEO-05)

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  integrations: [expressiveCode(), mdx(), tailwind(), sitemap({
    filter: (page) => {
      if (page.includes('/404')) return false;
      if (/\/blog\/\d+\/?$/.test(page)) return false; // TSEO-03: exclude /blog/{N}/ pagination
      const tagMatch = page.match(/\/blog\/tags\/([^/]+)\/?$/); // TSEO-05: exclude sparse tags
      if (tagMatch && sparseTags.has(tagMatch[1])) return false;
      return true;
    },
    serialize(item) {
      // --- lastmod: direct map, then prefix fallback, else undefined -----
      const knownDate = contentDates.get(item.url) ?? resolvePrefixLastmod(item.url);
      if (knownDate) {
        item.lastmod = knownDate;
      } else {
        // In dev, surface any category whose URLs aren't yet covered so
        // gaps show up during local authoring. Prod stays silent to keep
        // CI logs clean.
        if (!import.meta.env.PROD) console.warn(`[sitemap] no lastmod for ${item.url}`);
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
      } else if (item.url.includes('/ai-landscape/')) {
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
  }), indexNow(), notebookPackager(), react()],
  markdown: {
    remarkPlugins: [remarkReadingTime, remarkMath],
    rehypePlugins: [rehypeKatex, rehypeExternalLinks],
  },
  vite: ANALYZE
    ? {
        plugins: [
          // Dynamic import so the module is ONLY loaded when ANALYZE=1 —
          // keeps default builds deterministic (Phase 123 invariant).
          // Top-level await works here because astro.config.mjs is ESM
          // and Astro 5 + Node 22+ supports it.
          // emitFile: false — do NOT route through Rollup's asset
          // emission (would land in dist/_astro/stats.html and pollute
          // the deploy artefact). Write the file directly to
          // .planning/reports/ via plain filesystem write.
          (await import('rollup-plugin-visualizer')).visualizer({
            emitFile: false,
            filename: `.planning/reports/css-visualizer-${ANALYZE_STAMP}.html`,
            template: 'treemap',
            title: 'Homepage CSS bundle — Phase 126',
            gzipSize: true,
            brotliSize: true,
            sourcemap: false,
          }),
          (await import('rollup-plugin-visualizer')).visualizer({
            emitFile: false,
            filename: `.planning/reports/css-visualizer-${ANALYZE_STAMP}.json`,
            template: 'raw-data',
            gzipSize: true,
            brotliSize: true,
          }),
        ],
      }
    : {},
});
