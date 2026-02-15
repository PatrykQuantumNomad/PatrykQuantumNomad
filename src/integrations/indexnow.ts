import type { AstroIntegration } from 'astro';

const INDEXNOW_KEY = '970b0a65b110ef7d7f6311827aff7146';
const HOST = 'patrykgolabek.dev';

export default function indexNow(): AstroIntegration {
  return {
    name: 'indexnow',
    hooks: {
      'astro:build:done': async ({ pages }) => {
        if (!process.env.CI) {
          console.log('IndexNow: skipping submission (not CI)');
          return;
        }

        const urls = pages.map(
          (p) => `https://${HOST}/${p.pathname}`
        );

        if (urls.length === 0) return;

        try {
          const res = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: HOST,
              key: INDEXNOW_KEY,
              keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
              urlList: urls,
            }),
          });
          console.log(`IndexNow: submitted ${urls.length} URLs — ${res.status}`);
        } catch (e) {
          console.error('IndexNow submission failed:', e);
        }
      },
    },
  };
}
