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
const WIDTH = 1600;
const HEIGHT = 1100;
const TICKS = 300;
const PAD = 40;

// Cluster centroids for spatial grouping (forceX / forceY targets)
const CLUSTER_CENTROIDS = {
  ai: { x: 500, y: 220 },
  ml: { x: 400, y: 480 },
  nn: { x: 280, y: 720 },
  dl: { x: 260, y: 880 },
  genai: { x: 850, y: 1050 },
  levels: { x: 1400, y: 180 },
  agentic: { x: 1380, y: 700 },
  'agent-frameworks': { x: 1420, y: 850 },
  devtools: { x: 1120, y: 980 },
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
      .distance(140)
      .strength((link) => {
        // Weaken cross-cluster links so cluster grouping wins
        const srcCluster = simNodes.find((n) => n.id === (link.source.id ?? link.source))?.cluster;
        const tgtCluster = simNodes.find((n) => n.id === (link.target.id ?? link.target))?.cluster;
        return srcCluster === tgtCluster ? 0.3 : 0.08;
      }),
  )
  .force('charge', forceManyBody().strength(-600).distanceMax(600))
  .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
  .force('collide', forceCollide(65))
  .force(
    'x',
    forceX((d) => CLUSTER_CENTROIDS[d.cluster]?.x ?? WIDTH / 2).strength(0.35),
  )
  .force(
    'y',
    forceY((d) => CLUSTER_CENTROIDS[d.cluster]?.y ?? HEIGHT / 2).strength(0.35),
  )
  .stop();

// Run simulation headlessly for deterministic results
for (let i = 0; i < TICKS; i++) {
  simulation.tick();
}

// --- Post-simulation nudges for specific nodes ---

// Separate KR from Safe in the AI cluster
const krNode = simNodes.find((n) => n.id === 'knowledge-representation');
if (krNode) krNode.x += 120;

// Position GenAI children relative to their parent nodes to avoid overlaps
const llmNode = simNodes.find((n) => n.id === 'large-language-models');
const genNode = simNodes.find((n) => n.id === 'generative-ai');
if (llmNode) {
  // LLM children: arrange in a grid below LLM
  const llmNudges = {
    'fine-tuning': { dx: -120, dy: 110 },
    'prompt-engineering': { dx: 60, dy: 110 },
    'few-zero-shot-learning': { dx: -40, dy: 200 },
    'retrieval-augmented-generation': { dx: 200, dy: 220 },
    'context-windows': { dx: 220, dy: 60 },
  };
  for (const [id, { dx, dy }] of Object.entries(llmNudges)) {
    const node = simNodes.find((n) => n.id === id);
    if (node) {
      node.x = llmNode.x + dx;
      node.y = llmNode.y + dy;
    }
  }
}
if (genNode) {
  // Move Gen further left and down from LLM
  if (llmNode) {
    genNode.x = llmNode.x - 250;
    genNode.y = llmNode.y + 280;
  }
  // Position VAE above Gen
  const vaeNode = simNodes.find((n) => n.id === 'variational-autoencoders');
  if (vaeNode) {
    vaeNode.x = genNode.x - 40;
    vaeNode.y = genNode.y - 110;
  }
  // GAN to the right of Gen
  const ganNode = simNodes.find((n) => n.id === 'generative-adversarial-networks');
  if (ganNode) {
    ganNode.x = genNode.x + 120;
    ganNode.y = genNode.y + 110;
  }
  // Diff below-right of Gen
  const diffNode = simNodes.find((n) => n.id === 'diffusion-models');
  if (diffNode) {
    diffNode.x = genNode.x + 100;
    diffNode.y = genNode.y - 60;
  }
}

// --- Center the graph within the viewBox ---
const rawXs = simNodes.map((n) => n.x);
const rawYs = simNodes.map((n) => n.y);
const nodeCx = (Math.min(...rawXs) + Math.max(...rawXs)) / 2;
const nodeCy = (Math.min(...rawYs) + Math.max(...rawYs)) / 2;
const shiftX = WIDTH / 2 - nodeCx;
const shiftY = HEIGHT / 2 - nodeCy;

// --- Apply centering shift, clamp within viewBox bounds, and round ---
const positions = simNodes.map((n) => ({
  id: n.id,
  x: Math.round(Math.max(PAD, Math.min(WIDTH - PAD, n.x + shiftX)) * 100) / 100,
  y: Math.round(Math.max(PAD, Math.min(HEIGHT - PAD, n.y + shiftY)) * 100) / 100,
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
