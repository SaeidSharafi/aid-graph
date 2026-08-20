/**
 * 3D Force-Directed Knowledge Graph - Core Data Types, Palette & Schemas
 */

export const PALETTE = {
  BG: "#f2f2f0",
  INK: "#1a1a19",
  NEUTRAL_INK: "#1a1a19",
  ACCENT: "#0a0a0a",
  PRIMARY: "#eaeae8",
  SECTION_PAPERS: [
    "#4500B3", // 0: The Model
    "#EB4347", // 1: Sessions, Context Windows & Turns
    "#9DD395", // 2: Tools & Environment
    "#D3C2FE", // 3: Failure Modes
    "#0F7A6B", // 4: Handoffs
    "#FFD23F", // 5: Memory and Steering
    "#2D3DCF", // 6: Patterns of Work
  ],
  SECTION_COLORS: [
    "#FFD79E",
    "#ffffff",
    "#000000",
    "#000000",
    "#ffffff",
    "#000000",
    "#ffffff",
  ],
};

export interface GraphNode {
  slug: string;             // Unique identifier
  title: string;
  description: string;
  body: string;
  prose?: string;
  aliases?: string[];
  links: string[];          // Outgoing slugs
  usage?: string[];
  avoid?: string;
  heardInTheWild?: {
    user: string;
    agent: string;
  };
  section: number;          // Section cluster index
  inDegree: number;         // Number of incoming links
  layout: [number, number, number]; // Base rest position [x, y, z]
}

export interface GraphEdge {
  source: string;           // Source node slug
  target: string;           // Target node slug
  control?: [number, number, number]; // 3D quadratic Bézier control point [cx, cy, cz]
}

export interface Section {
  title: string;
  index: number;
  slugs: string[];
  centroid: [number, number, number];
  radius: number;
  color?: string;
}

export interface GraphDataset {
  generatedFrom?: string;
  sections: Section[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SimulationNode {
  index: number;
  mi: number;               // Master index in the global node array
  slug: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;                // Node radius R(inDegree)
  inDegree: number;
  section: number;
}

export interface SimulationLink {
  source: SimulationNode;
  target: SimulationNode;
  index: number;
}

export interface PhysicsParams {
  chargeStrength: number;   // default -55 or tuned
  theta: number;            // default 0.9 (theta^2 = 0.81)
  collideRadiusPadding: number; // default 18
  collideIterations: number;    // default 4
  collideStrength: number;      // default 1.0
  centeringStrength: number;    // default 0.06
  linkDistancePadding: number;  // default 40
  linkStrength: number;         // default 0.08
  velocityDecay: number;        // default 0.6 (0.4 retained)
  simulationTicks: number;      // default 180
}

export const DEFAULT_PHYSICS_PARAMS: PhysicsParams = {
  chargeStrength: -320,
  theta: 0.85,
  collideRadiusPadding: 26,
  collideIterations: 8,
  collideStrength: 1.2,
  centeringStrength: 0.015,
  linkDistancePadding: 70,
  linkStrength: 0.07,
  velocityDecay: 0.6,
  simulationTicks: 240,
};

/**
 * Formula: R(inDegree) = 2.2 + (ln(1 + inDegree) / ln(1 + 37)) * 6.5
 */
export function calculateNodeRadius(inDegree: number, maxInDegree = 37): number {
  const baseRadius = 2.2;
  const maxBonus = 6.5;
  const normalized = Math.log(1 + Math.max(0, inDegree)) / Math.log(1 + maxInDegree);
  return baseRadius + normalized * maxBonus;
}

export interface RepackResult {
  fitRadius: number;
  iterations: number;
  durationMs: number;
  selectedCount: number;
}

export function computeDefaultControlPoint(
  p0: [number, number, number],
  p2: [number, number, number],
  curvatureOffset = 0.25,
  seed = 0
): [number, number, number] {
  const mx = (p0[0] + p2[0]) / 2;
  const my = (p0[1] + p2[1]) / 2;
  const mz = (p0[2] + p2[2]) / 2;
  const chordLen = Math.hypot(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]);
  const offset = Math.max(chordLen * curvatureOffset, 6.0);

  const mLen = Math.hypot(mx, my, mz);
  if (mLen > 1e-4) {
    const factor = offset / mLen;
    return [mx + mx * factor, my + my * factor, mz + mz * factor];
  }

  const ang = (seed % 8) * (Math.PI / 4);
  return [mx + Math.cos(ang) * offset, my + Math.sin(ang) * offset, mz + offset * 0.4];
}

/**
 * Initial Spherical Placement (Fibonacci Spiral) formula:
 * θ_n = n * π(3 - √5)
 * φ_n = n * (20π / (9 + √221))
 * ρ_n = 10 * cbrt(0.5 + n)
 * x_n = ρ_n * sin(θ_n) * cos(φ_n)
 * y_n = ρ_n * cos(θ_n)
 * z_n = ρ_n * sin(θ_n) * sin(φ_n)
 */
export function computeFibonacciSphericalPosition(n: number): [number, number, number] {
  const theta = n * Math.PI * (3 - Math.sqrt(5));
  const phi = n * ((20 * Math.PI) / (9 + Math.sqrt(221)));
  const rho = 10 * Math.cbrt(0.5 + n);

  const x = rho * Math.sin(theta) * Math.cos(phi);
  const y = rho * Math.cos(theta);
  const z = rho * Math.sin(theta) * Math.sin(phi);

  return [x, y, z];
}

/**
 * 3D Quadratic Bézier curve point:
 * B(t) = (1 - t)^2 * P0 + 2 * (1 - t) * t * P1 + t^2 * P2
 */
export function evaluateBezier3D(
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  t: number
): [number, number, number] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const ut2 = 2 * u * t;

  return [
    uu * p0[0] + ut2 * p1[0] + tt * p2[0],
    uu * p0[1] + ut2 * p1[1] + tt * p2[1],
    uu * p0[2] + ut2 * p1[2] + tt * p2[2],
  ];
}
