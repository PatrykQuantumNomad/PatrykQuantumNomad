/**
 * vs-content.ts — pure, deterministic content assembly for Beauty Index VS pages.
 *
 * Given two Language objects + the full language array, `buildVsContent` produces
 * a fully-populated `VsContent` object covering:
 *   - 6 dimension prose entries (sorted by |delta| desc)
 *   - A 2-3 sentence verdict hero paragraph
 *   - 2-3 differ-most code feature comparisons
 *   - 3 score-driven FAQ entries
 *   - 4 cross-links (reverse, shared-language, paradigm-adjacent, single-lang back-link)
 *   - A computed wordCount sanity-check field
 *
 * Zero side effects: no file I/O, no network, no AI, no mutation of source data.
 * All content pools are module-level `const` so they are parsed once, not per call.
 *
 * See `.planning/phases/122-vs-page-content-enrichment/122-01-PLAN.md` for the
 * design contract this module implements.
 */

import { DIMENSIONS, type Dimension } from './dimensions';
import { DIMENSION_COLORS } from './tiers';
import { JUSTIFICATIONS } from '../../data/beauty-index/justifications';
import { CODE_FEATURES } from '../../data/beauty-index/code-features';
import { totalScore, type Language } from './schema';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface VsDimensionEntry {
  dim: Dimension;
  scoreA: number;
  scoreB: number;
  delta: number;
  color: string;
  /** HTML-safe paragraph. Render with `set:html`. */
  prose: string;
}

export interface VsCodeSnippet {
  lang: string;
  label: string;
  code: string;
}

export interface VsCodeFeatureEntry {
  featureName: string;
  caption: string;
  snippetA: VsCodeSnippet;
  snippetB: VsCodeSnippet;
}

export interface VsFaqEntry {
  question: string;
  /** Plain text (no HTML). Safe for JSON-LD. */
  answer: string;
}

export interface VsCrossLink {
  label: string;
  href: string;
  placement: 'inline' | 'footer';
}

export interface VsContent {
  verdict: string;
  dimensions: VsDimensionEntry[];
  codeFeatures: VsCodeFeatureEntry[];
  faq: VsFaqEntry[];
  crossLinks: VsCrossLink[];
  wordCount: number;
}

// ─── Dimension key type aliases ───────────────────────────────────────────────

type DimKey = Dimension['key'];
type DeltaBucket = 'tie' | 'narrow' | 'standard';

// ─── FNV-1a 32-bit hash (deterministic pool selection) ────────────────────────

/** 32-bit FNV-1a hash of a string. Returns non-negative integer. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic pick from a non-empty array using a hash key. */
function pick<T>(pool: readonly T[], key: string): T {
  if (pool.length === 0) throw new Error('pick: empty pool');
  return pool[hash(key) % pool.length];
}

// ─── Delta bucket classifier ──────────────────────────────────────────────────

function deltaBucket(delta: number): DeltaBucket {
  const a = Math.abs(delta);
  if (a === 0) return 'tie';
  if (a === 1) return 'narrow';
  return 'standard';
}

// ─── Strip HTML for plain-text contexts (FAQ answers, word counting) ──────────

export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// ─── Connective clause pools (≥3 options per (dim, bucket)) ───────────────────
//
// Connective clauses sit between the two language justifications inside a
// dimension paragraph. Placeholders {winner}, {loser}, {both}, and {langA}/{langB}
// are filled in at render time. Each pool has ≥3 options so collisions across
// the 650 pages stay rare.

const CONNECTIVE_POOLS: Record<DimKey, Record<DeltaBucket, readonly string[]>> = {
  phi: {
    standard: [
      'The visual gap between the two is not subtle — where {winner} prizes geometric calm, {loser} trades that serenity for other commitments.',
      '{loser}, by contrast, accepts visual density in exchange for other priorities.',
      'The difference is not cosmetic: {winner} rewards the eye, while {loser} asks the reader to absorb more punctuation and more ceremony.',
      'Set the two side by side and the shape of each language announces itself before you read a single identifier.',
    ],
    narrow: [
      'Both {langA} and {langB} care about how code looks — they simply draw the line in slightly different places.',
      'The edge here is thin; a seasoned reader might prefer one strictly on personal taste.',
      '{winner} edges ahead on visual rhythm, but {loser} is comfortably readable in its own right.',
    ],
    tie: [
      'On geometry the two languages converge; whatever separates them must be found on another axis.',
      'Visually they stand in similar territory — any difference here is a matter of taste, not of kind.',
      'When both languages look this clean, the decision moves elsewhere entirely.',
    ],
  },
  omega: {
    standard: [
      '{winner} lets algorithms approach mathematical statement, while {loser} asks more of the programmer when elegance is the goal.',
      'The gap on Elegance is real: {winner} rewards precise thought, {loser} rewards precise bookkeeping.',
      'Where {winner} compresses an idea into a line or two, {loser} tends to spread the same idea across a paragraph.',
    ],
    narrow: [
      'Both {langA} and {langB} can express algorithms cleanly; {winner} merely gets there with slightly less ceremony.',
      'The elegance gap is narrow enough that idiomatic style often matters more than the language itself.',
      '{winner} nudges ahead, but {loser} is capable of the same expressive heights in the hands of a confident user.',
    ],
    tie: [
      'Algorithmically the two meet on equal ground; elegance is not what separates them.',
      'Both {langA} and {langB} support the same class of elegant patterns — the decision lives on another axis.',
      'When it comes to reaching "The Book," these two arrive together.',
    ],
  },
  lambda: {
    standard: [
      '{winner} reads like a well-edited paragraph; {loser} reads like a sentence that is still being translated.',
      'The clarity gap is felt on first contact — {winner} invites, {loser} introduces friction before trust is earned.',
      'Where {winner} favours plain intent, {loser} trades clarity for control, capability, or history.',
    ],
    narrow: [
      'Both {langA} and {langB} communicate their intent without heroic effort; {winner} is only a little more forgiving.',
      'On readability the edge is slim and disappears quickly as idioms are learned.',
      'The difference is real but modest — pick either and a team will read fluently within weeks.',
    ],
    tie: [
      'On linguistic clarity the two converge; what separates them is elsewhere.',
      'Both {langA} and {langB} aim for the same high bar on readability, and both reach it.',
      'Neither language wins the clarity argument outright — the tiebreaker lies on another dimension.',
    ],
  },
  psi: {
    standard: [
      '{winner} has done the harder cultural work: tooling that delights, a community that welcomes, documentation that explains.',
      'The practitioner experience on {winner} is simply more fun, day in and day out, than on {loser}.',
      'Where {winner} feels designed for the human, {loser} feels designed for the machine first — the human catches up second.',
    ],
    narrow: [
      'Both {langA} and {langB} are broadly loved; {winner} is loved a little harder, a little more loudly.',
      'On developer happiness the edge is modest — the two communities are both thriving.',
      '{winner} noses ahead in surveys, but {loser} retains a devoted following of its own.',
    ],
    tie: [
      'Both communities love their language with equal fervour; this is the one dimension where {langA} and {langB} genuinely agree.',
      'On happiness the verdict is a draw — choose based on what the work demands, not on what feels good.',
      'When practitioner joy is a wash, the pragmatic factors rise to the top.',
    ],
  },
  gamma: {
    standard: [
      '{winner} invites modification; {loser} rewards planning more than adjustment.',
      'Where {winner} accommodates change gracefully, {loser} makes you earn each new direction.',
      'The habitability gap shows in long-lived codebases — {winner} ages, {loser} calcifies without careful discipline.',
    ],
    narrow: [
      'Both {langA} and {langB} age reasonably well; {winner} is merely a little kinder to the future reader.',
      'The habitability edge is slim and often dominated by team culture rather than language choice.',
      'On extensibility the two are close enough that the decision rarely hinges on this axis alone.',
    ],
    tie: [
      'For long-lived codebases the two languages sit on roughly equal ground.',
      'Both {langA} and {langB} have proven they can carry code across decades — this is not where they differ.',
      'On habitability the outcome is even; what tips the scale is elsewhere.',
    ],
  },
  sigma: {
    standard: [
      '{winner} speaks with a single design voice; {loser} speaks with a committee.',
      'The design philosophy of {winner} feels inevitable, each feature a consequence of one idea — {loser} feels assembled from several good ideas instead of from one great one.',
      'Where {winner} holds a line, {loser} has negotiated with history, ecosystems, and legacy users.',
    ],
    narrow: [
      'Both {langA} and {langB} have coherent design philosophies; {winner} merely holds to its centre with a firmer grip.',
      'The integrity gap is narrow and more visible in edge cases than in everyday code.',
      'On conceptual unity the two are close enough that the decision turns on other factors.',
    ],
    tie: [
      'Both {langA} and {langB} feel designed by a single mind, even when they are not; on integrity they meet as equals.',
      'Conceptually the two languages stand on the same firm ground.',
      'Neither language apologises for its philosophy — and the philosophies, though different, are equally complete.',
    ],
  },
};

// ─── Strength words for standard verdicts (≥4 options per key) ────────────────

const STRENGTH_WORDS: Record<DimKey, readonly string[]> = {
  phi: ['a decisive visual advantage', 'a clear geometric edge', 'a meaningful cleanliness gap', 'an unmistakable aesthetic lead'],
  omega: ['a decisive elegance advantage', 'a genuine expressive lead', 'a clear algorithmic edge', 'a substantive reach beyond idiom'],
  lambda: ['a real readability advantage', 'a clear signal-to-noise edge', 'a meaningful clarity gap', 'an unmistakable prose-like flow'],
  psi: ['a decisive cultural edge', 'a real happiness advantage', 'a genuine community lead', 'an unmistakable experiential gap'],
  gamma: ['a real habitability advantage', 'a clear edge for long-lived code', 'a meaningful extensibility gap', 'an unmistakable lead in how well code ages'],
  sigma: ['a decisive philosophical edge', 'a clear integrity advantage', 'a genuine lead in design coherence', 'an unmistakable unity of purpose'],
};

// ─── Closer pools (≥2 options per dim — 6 keys × 2 paradigm-clusters) ─────────
//
// Closers tie the dimension back to the pair's character. They are keyed on
// (dim.key, winnerParadigmCluster) where cluster ∈ { 'systems' | 'high-level' }.

type ParadigmCluster = 'systems' | 'high-level';

function paradigmCluster(lang: Language): ParadigmCluster {
  const p = (lang.paradigm ?? '').toLowerCase();
  if (p.includes('systems') || p.includes('imperative') || p.includes('procedural')) return 'systems';
  return 'high-level';
}

const CLOSER_POOLS: Record<DimKey, Record<ParadigmCluster, readonly string[]>> = {
  phi: {
    systems: [
      'In systems work the visual cost shows up in long functions; the winner here saves attention across a full file.',
      'Where every byte matters, visual clarity still matters — and {winner} keeps that ledger honest.',
      'The geometric advantage is felt most on the hundredth line, not the tenth.',
    ],
    'high-level': [
      'For application code the geometry translates directly into readability for new contributors.',
      'In a language where expressiveness is the selling point, visual calm amplifies the advantage.',
      'Designers of high-level code feel this difference the moment they open an unfamiliar module.',
    ],
  },
  omega: {
    systems: [
      'At the systems level elegance is rare and valuable — the winner earns it under real constraints.',
      'When performance and precision matter, the language that expresses the algorithm most directly wins twice.',
      'Elegance under tight constraints is the hardest kind; the winner here does not take it for granted.',
    ],
    'high-level': [
      'In application code the elegance edge shows up as less boilerplate per idea.',
      'For high-level work, the gap compounds: fewer lines per algorithm means fewer bugs per feature.',
      'The winner lets the author think in algorithms rather than in ceremony.',
    ],
  },
  lambda: {
    systems: [
      'At the systems level clarity is sometimes sacrificed for control; the winner here refuses that trade.',
      'In low-level code every line of clarity is a line of maintenance earned back.',
      'The winner proves that proximity to the machine need not mean distance from the reader.',
    ],
    'high-level': [
      'For application code the clarity advantage is the whole point of the language category.',
      'In high-level work, readable code is the difference between a 6-month onboarding and a 6-week one.',
      'The winner here treats readability as a core feature rather than a style preference.',
    ],
  },
  psi: {
    systems: [
      'Even in low-level work the human experience matters — the winner proves systems code need not be joyless.',
      'The practitioner-happiness edge in a systems language is unusual and worth noting.',
      'When the tools fight you less, the code comes out better; the winner keeps more of the author\'s attention on the problem.',
    ],
    'high-level': [
      'For high-level work, developer happiness is the main driver of long-term retention.',
      'In application languages the community culture compounds the language advantage.',
      'The winner here invites the next generation of contributors without asking them to earn it first.',
    ],
  },
  gamma: {
    systems: [
      'In systems work habitability is rare — the winner has managed to make change cheap without sacrificing correctness.',
      'At the systems level, long-lived code is the exception; the winner makes it the rule.',
      'The habitability advantage compounds across decades of maintenance.',
    ],
    'high-level': [
      'For application codebases the habitability edge determines whether a project survives its second rewrite.',
      'In high-level work, the language that welcomes modification wins the decade, not the quarter.',
      'The winner here is the language you will still enjoy reading in five years.',
    ],
  },
  sigma: {
    systems: [
      'At the systems level a coherent philosophy is the difference between a language you master and a language you survive.',
      'The winner\'s design discipline pays off most under the extreme constraints systems work imposes.',
      'Philosophical unity in a systems language is a rare and load-bearing virtue.',
    ],
    'high-level': [
      'For application code the integrity edge means fewer "wait, why does it behave that way?" moments per week.',
      'In high-level work a coherent philosophy is the frame that holds the language\'s features together.',
      'The winner\'s philosophical discipline is what keeps its idioms stable as the language evolves.',
    ],
  },
};

// ─── DIM → useCase lookup for FAQ Q2 ──────────────────────────────────────────

const DIM_TO_USE_CASE: Record<DimKey, string> = {
  phi: 'visually clean syntax',
  omega: 'algorithm-heavy code',
  lambda: 'readable code',
  psi: 'developer happiness',
  gamma: 'long-lived codebases',
  sigma: 'principled design',
};

// ─── Q3 recommendation pools (≥3 options per gap-bucket) ──────────────────────

type GapBucket = 'small' | 'medium' | 'large';

function gapBucket(gap: number): GapBucket {
  const a = Math.abs(gap);
  if (a <= 3) return 'small';
  if (a <= 8) return 'medium';
  return 'large';
}

const Q3_RECOMMENDATIONS: Record<GapBucket, readonly string[]> = {
  small: [
    'The gap is narrow enough that team familiarity and ecosystem fit should decide. Pick the one your hires already know.',
    'With so little between them on raw score, choose on ecosystem: the library set, hiring market, and tooling you already own.',
    'At this score gap the choice turns on context. Evaluate the two against the specific project rather than in the abstract.',
  ],
  medium: [
    'The score gap is real; the higher-scoring language has a measurable edge. Go the other way only if a concrete ecosystem need pulls you there.',
    'With this spread, default to the higher-ranked language and reserve the other for projects where its specific strengths matter.',
    'The gap is wide enough to matter in day-to-day experience. Pick the higher scorer unless a hard constraint pushes otherwise.',
  ],
  large: [
    'The gap is wide. Unless a specific platform or ecosystem constraint forces the other choice, go with the higher-scoring language.',
    'On this score difference the answer is clear: the higher-ranked language wins unless you have an explicit reason to pay the cost of the other.',
    'With this much daylight between them, the higher scorer is the default and the lower scorer needs a business case.',
  ],
};

// ─── Character-sketch closer pool for FAQ Q1 (≥3 options) ─────────────────────

const Q1_FRAMES: readonly string[] = [
  'For a newcomer picking up their first serious language in 2026, the happiness-score winner is the more forgiving starting point.',
  'For a developer adding a new language to their toolbelt, the happier one is the one you will still be writing in six months.',
  'When ease of learning is the deciding factor, the happier community wins every time — mentors, docs, and examples are simply more abundant.',
  'For classroom or self-directed study, the practitioner-happiness winner almost always has better learning materials and kinder error messages.',
];

// ─── Cluster sum helper ───────────────────────────────────────────────────────

const CLUSTERS: Record<string, DimKey[]> = {
  aesthetic: ['phi', 'lambda'],
  mathematical: ['omega'],
  human: ['psi', 'gamma'],
  design: ['sigma'],
};

const CLUSTER_LABELS: Record<string, string> = {
  aesthetic: 'aesthetic',
  mathematical: 'mathematical',
  human: 'human',
  design: 'design',
};

function clusterSum(lang: Language, dims: readonly DimKey[]): number {
  let s = 0;
  for (const d of dims) s += lang[d] as number;
  return s;
}

// ─── Dimension entry assembly (Pattern 1) ─────────────────────────────────────

function buildDimensionEntry(
  dim: Dimension,
  langA: Language,
  langB: Language,
): VsDimensionEntry {
  const scoreA = langA[dim.key] as number;
  const scoreB = langB[dim.key] as number;
  const delta = scoreA - scoreB;
  const bucket = deltaBucket(delta);
  const color = DIMENSION_COLORS[dim.key];

  const jA = JUSTIFICATIONS[langA.id]?.[dim.key] ?? '';
  const jB = JUSTIFICATIONS[langB.id]?.[dim.key] ?? '';

  const winner = delta > 0 ? langA : delta < 0 ? langB : null;
  const loser = delta > 0 ? langB : delta < 0 ? langA : null;
  const winnerJust = delta > 0 ? jA : delta < 0 ? jB : jA;
  const otherJust = delta > 0 ? jB : delta < 0 ? jA : jB;

  // Verdict clause
  let verdict: string;
  if (delta === 0) {
    verdict = `Both score ${scoreA} — this is one dimension where ${langA.name} and ${langB.name} genuinely agree.`;
  } else if (Math.abs(delta) === 1) {
    verdict = `${winner!.name} edges ${loser!.name} by a single point on ${dim.name}; the practical difference is slim but real.`;
  } else {
    const sw = pick(STRENGTH_WORDS[dim.key], `${langA.id}|${langB.id}|${dim.key}|sw`);
    verdict = `${winner!.name} wins ${dim.name} by ${Math.abs(delta)} points — ${sw}.`;
  }

  // Connective clause (fill placeholders)
  const rawConnective = pick(
    CONNECTIVE_POOLS[dim.key][bucket],
    `${langA.id}|${langB.id}|${dim.key}|conn`,
  );
  const connective = rawConnective
    .replace(/\{winner\}/g, winner ? winner.name : langA.name)
    .replace(/\{loser\}/g, loser ? loser.name : langB.name)
    .replace(/\{both\}/g, `${langA.name} and ${langB.name}`)
    .replace(/\{langA\}/g, langA.name)
    .replace(/\{langB\}/g, langB.name);

  // Closer clause — cluster based on winner (fall back to langA for ties)
  const closerLang = winner ?? langA;
  const closerCluster = paradigmCluster(closerLang);
  const rawCloser = pick(
    CLOSER_POOLS[dim.key][closerCluster],
    `${langA.id}|${langB.id}|${dim.key}|close`,
  );
  const closer = rawCloser
    .replace(/\{winner\}/g, winner ? winner.name : langA.name)
    .replace(/\{loser\}/g, loser ? loser.name : langB.name)
    .replace(/\{langA\}/g, langA.name)
    .replace(/\{langB\}/g, langB.name);

  // Compose paragraph: verdict + winnerJust + connective + otherJust + closer
  // Winner justification first so the paragraph reads with the winner's voice.
  const prose = `<p>${verdict} ${winnerJust} ${connective} ${otherJust} ${closer}</p>`;

  return { dim, scoreA, scoreB, delta, color, prose };
}

// ─── Verdict hero (Pattern 2) ─────────────────────────────────────────────────

function buildVerdict(langA: Language, langB: Language, dims: VsDimensionEntry[]): string {
  const totalA = totalScore(langA);
  const totalB = totalScore(langB);
  const dimsWonByA = dims.filter((d) => d.delta > 0).length;
  const dimsWonByB = dims.filter((d) => d.delta < 0).length;

  // Sentence 1 — overall
  let s1: string;
  if (totalA > totalB) {
    s1 = `${langA.name} scores ${totalA}/60 against ${langB.name}'s ${totalB}/60, leading in ${dimsWonByA} of 6 dimensions.`;
  } else if (totalB > totalA) {
    s1 = `${langB.name} scores ${totalB}/60 against ${langA.name}'s ${totalA}/60, leading in ${dimsWonByB} of 6 dimensions.`;
  } else {
    s1 = `${langA.name} and ${langB.name} finish level at ${totalA}/60, splitting the six dimensions ${dimsWonByA}-${dimsWonByB} with ${6 - dimsWonByA - dimsWonByB} tied.`;
  }

  // Sentence 2 — cluster ownership
  const clusterOwners: Record<string, 'A' | 'B' | 'tie'> = {};
  for (const name of Object.keys(CLUSTERS)) {
    const sA = clusterSum(langA, CLUSTERS[name]);
    const sB = clusterSum(langB, CLUSTERS[name]);
    clusterOwners[name] = sA > sB ? 'A' : sB > sA ? 'B' : 'tie';
  }
  const ownedByA = Object.entries(clusterOwners).filter(([, v]) => v === 'A').map(([k]) => CLUSTER_LABELS[k]);
  const ownedByB = Object.entries(clusterOwners).filter(([, v]) => v === 'B').map(([k]) => CLUSTER_LABELS[k]);

  let s2: string;
  if (ownedByA.length >= 3) {
    s2 = `${langA.name} dominates the ${joinNames(ownedByA)} axes.`;
  } else if (ownedByB.length >= 3) {
    s2 = `${langB.name} dominates the ${joinNames(ownedByB)} axes.`;
  } else if (ownedByA.length > 0 && ownedByB.length > 0) {
    s2 = `${langA.name} owns ${joinNames(ownedByA)} while ${langB.name} leads in ${joinNames(ownedByB)}.`;
  } else {
    // All clusters tied
    s2 = `${langA.name} and ${langB.name} share the four axis clusters evenly, trading leads without either side claiming the frame.`;
  }

  // Sentence 3 — always emit, to keep verdicts in the 2-3 sentence / 30+ word target range.
  // Branches:
  //   (a) psi winner ≠ gamma winner (the classic tension pool)
  //   (b) otherwise: a fallback pool framed on the top-delta dimension
  const psiWinner = (langA.psi > langB.psi) ? 'A' : (langB.psi > langA.psi ? 'B' : 'tie');
  const gammaWinner = (langA.gamma > langB.gamma) ? 'A' : (langB.gamma > langA.gamma ? 'B' : 'tie');
  let s3: string;
  if (psiWinner !== gammaWinner && psiWinner !== 'tie' && gammaWinner !== 'tie') {
    const happier = psiWinner === 'A' ? langA : langB;
    const homier = gammaWinner === 'A' ? langA : langB;
    const pool: readonly string[] = [
      `The pair splits practitioner joy from long-term habitability — ${happier.name} wins the week, ${homier.name} wins the decade.`,
      `${happier.name}'s happiness edge does not offset ${homier.name}'s lead in how well code ages; which matters more is a team-level question.`,
      `Choose ${happier.name} if the next six months are what matter, ${homier.name} if the next six years are.`,
    ];
    s3 = pick(pool, `${langA.id}|${langB.id}|s3tension`);
  } else {
    // Fallback — frame the decision on the top-delta dimension so the verdict keeps weight.
    const topDim = dims[0];
    const topWinner = topDim.delta > 0 ? langA : topDim.delta < 0 ? langB : null;
    const topLoser = topDim.delta > 0 ? langB : topDim.delta < 0 ? langA : null;
    let pool: readonly string[];
    if (topWinner && topLoser) {
      pool = [
        `The widest gap sits on ${topDim.dim.name}, where ${topWinner.name}'s ${Math.abs(topDim.delta)}-point lead over ${topLoser.name} shapes most of the pair's character.`,
        `${topDim.dim.name} is where the pair separates most cleanly — ${topWinner.name} leads ${topLoser.name} by ${Math.abs(topDim.delta)} points and that gap colours everything else on the page.`,
        `Read the comparison through ${topDim.dim.name} first: ${topWinner.name} wins that axis by ${Math.abs(topDim.delta)} points over ${topLoser.name}, and it is the single best lens on the pair.`,
      ];
    } else {
      pool = [
        `With the six dimensions close to evenly matched, the choice between ${langA.name} and ${langB.name} turns on ecosystem, tooling, and the specific shape of the work at hand.`,
        `When the numbers cluster this tightly, context decides — the project's constraints and the team's history matter more than any score margin between ${langA.name} and ${langB.name}.`,
        `A pair this evenly matched rewards a careful look at ecosystem fit; the ${langA.name}-versus-${langB.name} decision becomes a judgement about surrounding libraries rather than core language design.`,
      ];
    }
    s3 = pick(pool, `${langA.id}|${langB.id}|s3fallback`);
  }

  return `${s1} ${s2} ${s3}`;
}

function joinNames(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// ─── Differ-most helpers (Pattern 3) ──────────────────────────────────────────

function charBigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + 2 <= s.length; i++) out.add(s.slice(i, i + 2));
  return out;
}

function jaccardSets(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const RESERVED_TOKEN_RE = /\b(let|const|var|fn|function|def|class|struct|impl|match|case|when|if|else|elif|elseif|for|while|do|return|yield|async|await|try|catch|except|finally|throw|import|from|use|package|module|interface|type|enum|val|mut|public|private|protected|static|final|override|abstract|new|this|self|nil|null|none|true|false)\b/g;

function reservedTokenRatio(code: string): number {
  const tokens = code.split(/\W+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const matches = code.match(RESERVED_TOKEN_RE);
  return (matches ? matches.length : 0) / tokens.length;
}

function differenceScore(snipA: string, snipB: string): number {
  const lines = (s: string) => s.split('\n').length;
  const lineCountDelta = Math.min(Math.abs(lines(snipA) - lines(snipB)) / 10, 1);
  const bigramDist = 1 - jaccardSets(charBigrams(snipA), charBigrams(snipB));
  const keywordDelta = Math.abs(reservedTokenRatio(snipA) - reservedTokenRatio(snipB));
  return lineCountDelta * 0.3 + bigramDist * 0.5 + keywordDelta * 0.2;
}

function buildCodeFeatures(langA: Language, langB: Language): VsCodeFeatureEntry[] {
  const candidates: { feature: typeof CODE_FEATURES[number]; score: number }[] = [];

  for (const feature of CODE_FEATURES) {
    const snipA = feature.snippets[langA.id];
    const snipB = feature.snippets[langB.id];
    if (!snipA?.code || !snipB?.code) continue;
    const score = differenceScore(snipA.code, snipB.code);
    candidates.push({ feature, score });
  }

  // Sort descending by score, tie-break on feature.name for determinism
  candidates.sort((a, b) => b.score - a.score || a.feature.name.localeCompare(b.feature.name));

  const pick = candidates.slice(0, 3);
  return pick.map(({ feature }) => {
    const snipA = feature.snippets[langA.id]!;
    const snipB = feature.snippets[langB.id]!;
    return {
      featureName: feature.name,
      caption: feature.description || feature.name,
      snippetA: { lang: snipA.lang, label: snipA.label, code: snipA.code },
      snippetB: { lang: snipB.lang, label: snipB.label, code: snipB.code },
    };
  });
}

// ─── FAQ (Pattern 4) ──────────────────────────────────────────────────────────

function buildFaq(langA: Language, langB: Language, dims: VsDimensionEntry[]): VsFaqEntry[] {
  const totalA = totalScore(langA);
  const totalB = totalScore(langB);
  const tierA = langA.tier;
  const tierB = langB.tier;

  // Find psi dim entry
  const psiEntry = dims.find((d) => d.dim.key === 'psi')!;
  const psiWinner = psiEntry.delta > 0 ? langA : psiEntry.delta < 0 ? langB : null;
  const psiLoser = psiEntry.delta > 0 ? langB : psiEntry.delta < 0 ? langA : null;
  const psiWinnerJust = stripHtml(JUSTIFICATIONS[psiWinner ? psiWinner.id : langA.id]?.psi ?? '');

  // Q1 — easier to learn
  let q1Answer: string;
  if (psiWinner && psiLoser) {
    const frame = pick(Q1_FRAMES, `${langA.id}|${langB.id}|q1`);
    q1Answer = `${psiWinner.name} scores ${psiWinner.psi} on Practitioner Happiness versus ${psiLoser.name}'s ${psiLoser.psi}. ${psiWinnerJust} ${frame}`;
  } else {
    const frame = pick(Q1_FRAMES, `${langA.id}|${langB.id}|q1tie`);
    q1Answer = `${langA.name} and ${langB.name} are tied on Practitioner Happiness at ${langA.psi}/10 — both are broadly welcoming to newcomers. ${stripHtml(JUSTIFICATIONS[langA.id]?.psi ?? '')} ${frame}`;
  }
  q1Answer = clampWords(q1Answer, 40, 80);

  // Q2 — better for {useCase}
  // Top delta dim after sort is dims[0]
  const topDim = dims[0];
  const useCase = DIM_TO_USE_CASE[topDim.dim.key];
  const topWinner = topDim.delta > 0 ? langA : topDim.delta < 0 ? langB : null;
  const topLoser = topDim.delta > 0 ? langB : topDim.delta < 0 ? langA : null;
  let q2Answer: string;
  if (topWinner && topLoser) {
    const winnerJust = stripHtml(JUSTIFICATIONS[topWinner.id]?.[topDim.dim.key] ?? '');
    q2Answer = `For ${useCase}, ${topWinner.name} has a clear edge — it scores ${topWinner[topDim.dim.key]}/10 on ${topDim.dim.name} against ${topLoser.name}'s ${topLoser[topDim.dim.key]}/10. ${winnerJust}`;
  } else {
    const justA = stripHtml(JUSTIFICATIONS[langA.id]?.[topDim.dim.key] ?? '');
    q2Answer = `On ${topDim.dim.name} — the axis that tracks ${useCase} — ${langA.name} and ${langB.name} land on equal ground at ${langA[topDim.dim.key]}/10. ${justA}`;
  }
  q2Answer = clampWords(q2Answer, 40, 80);

  // Q3 — pick X or Y in 2026
  const gap = totalA - totalB;
  const rec = pick(Q3_RECOMMENDATIONS[gapBucket(gap)], `${langA.id}|${langB.id}|q3`);
  const q3Answer = clampWords(
    `${langA.name} lands in the ${tierA} tier at ${totalA}/60; ${langB.name} in the ${tierB} tier at ${totalB}/60. ${rec}`,
    40,
    80,
  );

  return [
    { question: `Which is easier to learn, ${langA.name} or ${langB.name}?`, answer: q1Answer },
    { question: `Is ${langA.name} or ${langB.name} better for ${useCase}?`, answer: q2Answer },
    { question: `Should I pick ${langA.name} or ${langB.name} in 2026?`, answer: q3Answer },
  ];
}

/** Clamp plain text to [minWords, maxWords]. Truncates with ellipsis if too long. Pads with context sentence if too short. */
function clampWords(text: string, min: number, max: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > max) {
    return words.slice(0, max).join(' ') + '.';
  }
  if (words.length < min) {
    // Pad with generic framing — this rarely triggers because justifications are long.
    const pad = ' The score difference reflects years of community use, tooling maturity, and the editorial judgment of the Beauty Index rubric.';
    return clampWords(text.trim() + pad, min, max);
  }
  return words.join(' ');
}

// ─── Cross-links (Pattern 5) ──────────────────────────────────────────────────

function buildCrossLinks(langA: Language, langB: Language, allLangs: Language[]): VsCrossLink[] {
  const out: VsCrossLink[] = [];

  // 1. Reverse pair
  out.push({
    label: `${langB.name} vs ${langA.name}`,
    href: `/beauty-index/vs/${langB.id}-vs-${langA.id}/`,
    placement: 'footer',
  });

  // 2. Shared-language pair
  // Candidates: (langA, X) and (X, langB) for X != langA, langB
  type SharedCandidate = { left: Language; right: Language; gapDelta: number };
  const currentGap = Math.abs(totalScore(langA) - totalScore(langB));
  const sharedCandidates: SharedCandidate[] = [];
  for (const X of allLangs) {
    if (X.id === langA.id || X.id === langB.id) continue;
    const g1 = Math.abs(totalScore(langA) - totalScore(X));
    sharedCandidates.push({ left: langA, right: X, gapDelta: Math.abs(g1 - currentGap) });
    const g2 = Math.abs(totalScore(X) - totalScore(langB));
    sharedCandidates.push({ left: X, right: langB, gapDelta: Math.abs(g2 - currentGap) });
  }
  // Pick candidate with largest gapDelta (most editorially different gap)
  sharedCandidates.sort((a, b) => b.gapDelta - a.gapDelta || a.left.id.localeCompare(b.left.id) || a.right.id.localeCompare(b.right.id));
  if (sharedCandidates.length > 0) {
    const top = sharedCandidates[0];
    out.push({
      label: `${top.left.name} vs ${top.right.name}`,
      href: `/beauty-index/vs/${top.left.id}-vs-${top.right.id}/`,
      placement: 'inline',
    });
  }

  // 3. Paradigm-adjacent pair
  // Group by paradigm bucket (first word of paradigm field)
  const bucketOf = (l: Language) => (l.paradigm ?? 'unknown').split(',')[0].trim().toLowerCase();
  const langABucket = bucketOf(langA);

  // Highest-scoring lang in langA's bucket excluding langA and langB
  const sameBucket = allLangs
    .filter((l) => l.id !== langA.id && l.id !== langB.id && bucketOf(l) === langABucket)
    .sort((x, y) => totalScore(y) - totalScore(x) || x.id.localeCompare(y.id));

  if (sameBucket.length > 0) {
    const X = sameBucket[0];
    // Pick Y as highest-scoring lang in a DIFFERENT bucket
    const differentBucket = allLangs
      .filter((l) => l.id !== langA.id && l.id !== langB.id && l.id !== X.id && bucketOf(l) !== langABucket)
      .sort((a, b) => totalScore(b) - totalScore(a) || a.id.localeCompare(b.id));
    if (differentBucket.length > 0) {
      const Y = differentBucket[0];
      out.push({
        label: `${X.name} vs ${Y.name}`,
        href: `/beauty-index/vs/${X.id}-vs-${Y.id}/`,
        placement: 'footer',
      });
    }
  }

  // If the paradigm-adjacent slot didn't fill (e.g., langA has a singleton bucket),
  // fall back to highest-scoring non-involved pair.
  if (out.length < 3) {
    const rest = allLangs.filter((l) => l.id !== langA.id && l.id !== langB.id).sort((a, b) => totalScore(b) - totalScore(a) || a.id.localeCompare(b.id));
    if (rest.length >= 2) {
      out.push({
        label: `${rest[0].name} vs ${rest[1].name}`,
        href: `/beauty-index/vs/${rest[0].id}-vs-${rest[1].id}/`,
        placement: 'footer',
      });
    }
  }

  // 4. Single-language back-link (langA)
  out.push({
    label: langA.name,
    href: `/beauty-index/${langA.id}/`,
    placement: 'inline',
  });

  return out;
}

// ─── Word count (sanity) ──────────────────────────────────────────────────────

function computeWordCount(dims: VsDimensionEntry[], verdict: string, faq: VsFaqEntry[], codeFeatures: VsCodeFeatureEntry[]): number {
  const parts: string[] = [verdict];
  for (const d of dims) parts.push(stripHtml(d.prose));
  for (const f of faq) parts.push(f.question, f.answer);
  for (const c of codeFeatures) parts.push(c.caption);
  const combined = parts.join(' ');
  return stripHtml(combined).split(/\s+/).filter(Boolean).length;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildVsContent(langA: Language, langB: Language, allLangs: Language[]): VsContent {
  // 1. Dimensions sorted by |delta| desc, tie-break on dim.key lexicographic
  const dimensions: VsDimensionEntry[] = DIMENSIONS.map((dim) => buildDimensionEntry(dim, langA, langB));
  dimensions.sort((a, b) => {
    const ad = Math.abs(a.delta);
    const bd = Math.abs(b.delta);
    if (ad !== bd) return bd - ad;
    return a.dim.key.localeCompare(b.dim.key);
  });

  // 2. Verdict hero
  const verdict = buildVerdict(langA, langB, dimensions);

  // 3. Code features (differ-most top 3)
  const codeFeatures = buildCodeFeatures(langA, langB);

  // 4. FAQ (3 entries)
  const faq = buildFaq(langA, langB, dimensions);

  // 5. Cross-links (4 entries)
  const crossLinks = buildCrossLinks(langA, langB, allLangs);

  // 6. Word count sanity
  const wordCount = computeWordCount(dimensions, verdict, faq, codeFeatures);

  return {
    verdict,
    dimensions,
    codeFeatures,
    faq,
    crossLinks,
    wordCount,
  };
}
