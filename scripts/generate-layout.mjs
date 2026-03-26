/**
 * Headless d3-force layout generator for AI Landscape graph.
 *
 * Reads nodes.json + graph.json, runs a deterministic d3-force simulation
 * (300 ticks), clamps positions within the viewBox, and writes layout.json.
 *
 * Run: node scripts/generate-layout.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Constants ---
const WIDTH = 1200;
const HEIGHT = 900;
const TICKS = 300;
const PAD = 40;

// Cluster centroids for spatial grouping (forceX / forceY targets)
const CLUSTER_CENTROIDS = {
  ai: { x: 420, y: 225 },
  ml: { x: 360, y: 360 },
  nn: { x: 300, y: 495 },
  dl: { x: 360, y: 585 },
  genai: { x: 540, y: 675 },
  levels: { x: 900, y: 180 },
  agentic: { x: 900, y: 495 },
  'agent-frameworks': { x: 960, y: 585 },
  devtools: { x: 840, y: 765 },
};

// --- Read source data ---
const nodesPath = resolve(ROOT, 'src/data/ai-landscape/nodes.json');
const graphPath = resolve(ROOT, 'src/data/ai-landscape/graph.json');

const nodes = JSON.parse(readFileSync(nodesPath, 'utf-8'));
const graph = JSON.parse(readFileSync(graphPath, 'utf-8'));

const startTime = performance.now();

// --- Clone data (d3-force mutates input arrays!) ---
const simNodes = nodes.map((n) => ({
  id: n.id,
  cluster: n.cluster,
  x: CLUSTER_CENTROIDS[n.cluster]?.x ?? WIDTH / 2,
  y: CLUSTER_CENTROIDS[n.cluster]?.y ?? HEIGHT / 2,
}));

const simLinks = graph.edges.map((e) => ({
  source: e.source,
  target: e.target,
}));

// --- Configure and run simulation ---
const simulation = forceSimulation(simNodes)
  .force(
    'link',
    forceLink(simLinks)
      .id((d) => d.id)
      .distance(60)
      .strength(0.3),
  )
  .force('charge', forceManyBody().strength(-200).distanceMax(300))
  .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
  .force('collide', forceCollide(25))
  .force(
    'x',
    forceX((d) => CLUSTER_CENTROIDS[d.cluster]?.x ?? WIDTH / 2).strength(0.15),
  )
  .force(
    'y',
    forceY((d) => CLUSTER_CENTROIDS[d.cluster]?.y ?? HEIGHT / 2).strength(0.15),
  )
  .stop();

// Run simulation headlessly for deterministic results
for (let i = 0; i < TICKS; i++) {
  simulation.tick();
}

// --- Clamp positions within viewBox bounds and round ---
const positions = simNodes.map((n) => ({
  id: n.id,
  x: Math.round(Math.max(PAD, Math.min(WIDTH - PAD, n.x)) * 100) / 100,
  y: Math.round(Math.max(PAD, Math.min(HEIGHT - PAD, n.y)) * 100) / 100,
}));

// --- Write layout.json ---
const layout = {
  meta: {
    width: WIDTH,
    height: HEIGHT,
    ticks: TICKS,
    generated: new Date().toISOString(),
  },
  positions,
};

const outputPath = resolve(ROOT, 'src/data/ai-landscape/layout.json');
writeFileSync(outputPath, JSON.stringify(layout, null, 2) + '\n', 'utf-8');

const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
console.log(
  `  Layout generated: ${positions.length} nodes, ${WIDTH}x${HEIGHT} viewBox, ${TICKS} ticks (${elapsed}s)`,
);
