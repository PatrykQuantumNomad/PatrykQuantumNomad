/**
 * vs-content.test.ts — unit suite for the VS-content library.
 *
 * Covers phase 122 requirements VS-01 through VS-06 at the lib level.
 * See `.planning/phases/122-vs-page-content-enrichment/122-01-PLAN.md`.
 */

import { describe, expect, it } from 'vitest';
import langsJson from '../../../data/beauty-index/languages.json' with { type: 'json' };
import { JUSTIFICATIONS } from '../../../data/beauty-index/justifications';
import { buildVsContent, stripHtml } from '../vs-content';
import type { Language } from '../schema';

const LANGS = langsJson as Language[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(tokens: string[], k = 5): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i + k <= tokens.length; i++) {
    set.add(tokens.slice(i, i + k).join(' '));
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function byId(id: string): Language {
  const l = LANGS.find((x) => x.id === id);
  if (!l) throw new Error(`language not found: ${id}`);
  return l;
}

function allOrderedPairs(): [Language, Language][] {
  const out: [Language, Language][] = [];
  for (const a of LANGS) {
    for (const b of LANGS) {
      if (a.id === b.id) continue;
      out.push([a, b]);
    }
  }
  return out;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('buildVsContent', () => {
  describe('dimension prose (VS-01)', () => {
    it('returns 6 dimension entries with non-empty prose for python-vs-rust', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      expect(c.dimensions).toHaveLength(6);
      for (const d of c.dimensions) {
        expect(d.prose.length).toBeGreaterThan(100);
      }
    });

    it('each dimension prose references both langs justifications (canary substrings)', () => {
      const langA = byId('python');
      const langB = byId('rust');
      const c = buildVsContent(langA, langB, LANGS);

      for (const d of c.dimensions) {
        const jA = JUSTIFICATIONS[langA.id][d.dim.key];
        const jB = JUSTIFICATIONS[langB.id][d.dim.key];
        // Use a 20-char canary from each justification.
        const canaryA = jA.slice(10, 30);
        const canaryB = jB.slice(10, 30);
        expect(d.prose).toContain(canaryA);
        expect(d.prose).toContain(canaryB);
      }
    });

    it('dimensions are sorted by |delta| descending (10 sampled pairs)', () => {
      const rand = mulberry32(7);
      const pairs = allOrderedPairs();
      for (let i = 0; i < 10; i++) {
        const [a, b] = pairs[Math.floor(rand() * pairs.length)];
        const c = buildVsContent(a, b, LANGS);
        const deltas = c.dimensions.map((d) => Math.abs(d.delta));
        expect(deltas[0]).toBeGreaterThanOrEqual(deltas[5]);
        for (let k = 0; k + 1 < deltas.length; k++) {
          expect(deltas[k]).toBeGreaterThanOrEqual(deltas[k + 1]);
        }
      }
    });
  });

  describe('verdict hero (VS-02)', () => {
    it('contains at least 2 sentence-terminators mid-string', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      const matches = c.verdict.match(/[.!?]/g);
      expect(matches).not.toBeNull();
      expect((matches ?? []).length).toBeGreaterThanOrEqual(2);
    });

    it('mentions both langA.name and langB.name', () => {
      const a = byId('python');
      const b = byId('rust');
      const c = buildVsContent(a, b, LANGS);
      expect(c.verdict).toContain(a.name);
      expect(c.verdict).toContain(b.name);
    });

    it('verdict word count is between 30 and 120 words across 10 sampled pairs', () => {
      const rand = mulberry32(11);
      const pairs = allOrderedPairs();
      for (let i = 0; i < 10; i++) {
        const [a, b] = pairs[Math.floor(rand() * pairs.length)];
        const c = buildVsContent(a, b, LANGS);
        const wc = c.verdict.split(/\s+/).filter(Boolean).length;
        expect(wc).toBeGreaterThanOrEqual(30);
        expect(wc).toBeLessThanOrEqual(120);
      }
    });
  });

  describe('code features (VS-03)', () => {
    it('every ordered pair has 2-3 code features, each with both snippets populated', () => {
      const pairs = allOrderedPairs();
      expect(pairs.length).toBe(26 * 25); // 650
      for (const [a, b] of pairs) {
        const c = buildVsContent(a, b, LANGS);
        expect(c.codeFeatures.length).toBeGreaterThanOrEqual(2);
        expect(c.codeFeatures.length).toBeLessThanOrEqual(3);
        for (const cf of c.codeFeatures) {
          expect(cf.snippetA.code.length).toBeGreaterThan(0);
          expect(cf.snippetB.code.length).toBeGreaterThan(0);
          expect(cf.featureName.length).toBeGreaterThan(0);
          expect(cf.caption.length).toBeGreaterThan(0);
        }
      }
    });

    it('for python-vs-rust, selected features differ visibly (line-count delta sum >= 3)', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      let sumDelta = 0;
      for (const cf of c.codeFeatures) {
        const linesA = cf.snippetA.code.split('\n').length;
        const linesB = cf.snippetB.code.split('\n').length;
        sumDelta += Math.abs(linesA - linesB);
      }
      expect(sumDelta).toBeGreaterThanOrEqual(3);
    });
  });

  describe('FAQ (VS-04)', () => {
    it('has exactly 3 entries', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      expect(c.faq).toHaveLength(3);
    });

    it('each entry has non-empty question and answer strings', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      for (const f of c.faq) {
        expect(f.question.length).toBeGreaterThan(0);
        expect(f.answer.length).toBeGreaterThan(0);
      }
    });

    it('no answer contains a < character (plain-text guarantee for JSON-LD)', () => {
      // Check across 20 sampled pairs
      const rand = mulberry32(23);
      const pairs = allOrderedPairs();
      for (let i = 0; i < 20; i++) {
        const [a, b] = pairs[Math.floor(rand() * pairs.length)];
        const c = buildVsContent(a, b, LANGS);
        for (const f of c.faq) {
          expect(f.answer).not.toContain('<');
        }
      }
    });

    it('each answer is between 20 and 120 words (10 sampled pairs)', () => {
      const rand = mulberry32(31);
      const pairs = allOrderedPairs();
      for (let i = 0; i < 10; i++) {
        const [a, b] = pairs[Math.floor(rand() * pairs.length)];
        const c = buildVsContent(a, b, LANGS);
        for (const f of c.faq) {
          const wc = f.answer.split(/\s+/).filter(Boolean).length;
          expect(wc).toBeGreaterThanOrEqual(20);
          expect(wc).toBeLessThanOrEqual(120);
        }
      }
    });

    it('Q1 matches "easier to learn", Q2 matches "better for", Q3 matches pick/2026 pattern', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      expect(c.faq[0].question).toMatch(/Which is easier to learn/);
      expect(c.faq[1].question).toMatch(/better for/);
      expect(c.faq[2].question).toMatch(/pick .* in 2026|should (you |I )pick/i);
    });
  });

  describe('cross links (VS-05)', () => {
    it('has exactly 4 entries', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      expect(c.crossLinks).toHaveLength(4);
    });

    it('has exactly one reverse-pair link', () => {
      const a = byId('python');
      const b = byId('rust');
      const c = buildVsContent(a, b, LANGS);
      const reverseRe = new RegExp(`^/beauty-index/vs/${b.id}-vs-${a.id}/$`);
      const matches = c.crossLinks.filter((l) => reverseRe.test(l.href));
      expect(matches).toHaveLength(1);
    });

    it('has exactly one single-language back-link (no "vs" segment)', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      const single = c.crossLinks.filter((l) => /^\/beauty-index\/[a-z-]+\/$/.test(l.href));
      expect(single).toHaveLength(1);
    });

    it('every label matches comparison-name-only pattern (no descriptive prose)', () => {
      // Accept language names with alphanumeric chars, spaces, #, +, dashes, and optional " vs " join.
      const labelRe = /^[A-Z][A-Za-z+#0-9-]*( vs [A-Z][A-Za-z+#0-9-]*)?$/;
      // Sample 30 pairs to cover diverse language name shapes (F#, C++, C#, etc.)
      const rand = mulberry32(41);
      const pairs = allOrderedPairs();
      for (let i = 0; i < 30; i++) {
        const [a, b] = pairs[Math.floor(rand() * pairs.length)];
        const c = buildVsContent(a, b, LANGS);
        for (const l of c.crossLinks) {
          expect(l.label, `label "${l.label}" for ${a.id}-vs-${b.id}`).toMatch(labelRe);
          // Sanity: no descriptive phrases
          expect(l.label.toLowerCase()).not.toContain('see ');
          expect(l.label.toLowerCase()).not.toContain('compare');
          expect(l.label.toLowerCase()).not.toContain('breakdown');
        }
      }
    });

    it('has at least one inline and at least one footer link', () => {
      const c = buildVsContent(byId('python'), byId('rust'), LANGS);
      expect(c.crossLinks.some((l) => l.placement === 'inline')).toBe(true);
      expect(c.crossLinks.some((l) => l.placement === 'footer')).toBe(true);
    });
  });

  describe('overlap (VS-06)', () => {
    it('max Jaccard 5-gram similarity across 20 sampled pairs is < 0.40', () => {
      const rand = mulberry32(42);
      const allPairs = allOrderedPairs();
      // Pick 20 distinct ordered pairs
      const sampled = new Set<number>();
      while (sampled.size < 20) {
        sampled.add(Math.floor(rand() * allPairs.length));
      }
      const picked = [...sampled].map((i) => allPairs[i]);

      const contentStrings = picked.map(([a, b]) => {
        const c = buildVsContent(a, b, LANGS);
        const proseJoined = c.dimensions.map((d) => stripHtml(d.prose)).join(' ');
        const faqJoined = c.faq.map((f) => `${f.question} ${f.answer}`).join(' ');
        return `${c.verdict} ${proseJoined} ${faqJoined}`;
      });

      const shingleSets = contentStrings.map((s) => shingles(normalize(s), 5));

      let max = 0;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < shingleSets.length; i++) {
        for (let j = i + 1; j < shingleSets.length; j++) {
          const jac = jaccard(shingleSets[i], shingleSets[j]);
          if (jac > max) max = jac;
          sum += jac;
          count++;
        }
      }
      const mean = count > 0 ? sum / count : 0;

      // Emit diagnostics (test still passes silently if under threshold)

      console.log(`[VS-06] max=${max.toFixed(4)} mean=${mean.toFixed(4)} (${count} pairs across 20 sampled content blocks)`);

      expect(max).toBeLessThan(0.4);
    });
  });

  describe('determinism', () => {
    it('returns JSON-equal output for repeat calls with same inputs', () => {
      const a = byId('python');
      const b = byId('rust');
      const c1 = buildVsContent(a, b, LANGS);
      const c2 = buildVsContent(a, b, LANGS);
      expect(JSON.stringify(c1)).toBe(JSON.stringify(c2));
    });
  });

  describe('wordCount sanity', () => {
    it('every one of 650 ordered pairs reports a positive wordCount', () => {
      for (const [a, b] of allOrderedPairs()) {
        const c = buildVsContent(a, b, LANGS);
        expect(c.wordCount).toBeGreaterThan(0);
      }
    });
  });
});
