export interface GraphNode {
  slug: string;
  title: string;
  aliases: string[];
  description: string;
  body: string;
  usage: string[];
  avoid?: string;
  links: string[];
  section: number;
  inDegree: number;
  layout?: [number, number, number];
}

export interface GraphEdge {
  source: string;
  target: string;
  control?: [number, number, number];
}

export interface Section {
  index: number;
  title: string;
  slugs: string[];
  centroid: [number, number, number];
  radius: number;
}

export interface GraphData {
  generatedFrom: string;
  sections: Section[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const BG = "#f2f2f0";
export const INK = "#1a1a19";
export const NEUTRAL_INK = "#1a1a19";
export const ACCENT = "#0a0a0a";

export const SECTION_COLORS = [
  "#FFD79E",
  "#ffffff",
  "#000000",
  "#000000",
  "#ffffff",
  "#000000",
  "#ffffff",
];

export const SECTION_PAPERS = [
  "#4500B3",
  "#EB4347",
  "#9DD395",
  "#D3C2FE",
  "#0F7A6B",
  "#FFD23F",
  "#2D3DCF",
];

export const AIHERO_SHARE_URL = "https://www.aihero.dev/s/dictionary";
export const AIHERO_URL = "https://www.aihero.dev/ai-coding-dictionary";
export const SOURCE_REPO_URL = "https://github.com/mattpocock/dictionary-of-ai-coding";

export function nodeRadius(inDegree: number): number {
  return 2.2 + (Math.log1p(inDegree) / Math.log1p(37)) * 6.5;
}

export function evaluateBezier3D(
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  t: number
): [number, number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = 2 * mt * t;
  return [
    mt2 * p0[0] + a * p1[0] + t2 * p2[0],
    mt2 * p0[1] + a * p1[1] + t2 * p2[1],
    mt2 * p0[2] + a * p1[2] + t2 * p2[2],
  ];
}