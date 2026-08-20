import {
  GraphData,
  GraphNode,
  GraphEdge,
  Section,
  SECTION_COLORS,
  ACCENT,
} from "../types/graph";
import dictionaryRaw from "./dictionary.json";

// Re-export all types, helpers (nodeRadius, evaluateBezier3D), and constants
export * from "../types/graph";

export const rawData: GraphData = dictionaryRaw as unknown as GraphData;
export const nodes: GraphNode[] = rawData.nodes;
export const edges: GraphEdge[] = rawData.edges;
export const sections: Section[] = rawData.sections;

export const nodeBySlug = new Map<string, GraphNode>(nodes.map((n) => [n.slug, n]));

const neighborMap = new Map<string, Set<string>>();
const addNeighbor = (src: string, tgt: string) => {
  if (!neighborMap.has(src)) neighborMap.set(src, new Set());
  neighborMap.get(src)!.add(tgt);
};

for (const e of edges) {
  addNeighbor(e.source, e.target);
  addNeighbor(e.target, e.source);
}

export function neighborsOf(slug: string): Set<string> {
  return neighborMap.get(slug) ?? new Set<string>();
}

export interface OrderedTerm {
  node: GraphNode;
  index: number;
  indexInSection: number;
  sectionSize: number;
  startsSection: boolean;
}

export const orderedTerms: OrderedTerm[] = (() => {
  const result: OrderedTerm[] = [];
  let globalIdx = 0;
  for (const sec of sections) {
    const secNodes = sec.slugs
      .map((s) => nodeBySlug.get(s))
      .filter((n): n is GraphNode => Boolean(n));
    secNodes.forEach((n, idxInSection) => {
      result.push({
        node: n,
        index: globalIdx++,
        indexInSection: idxInSection,
        sectionSize: secNodes.length,
        startsSection: idxInSection === 0,
      });
    });
  }
  return result;
})();

export const TERM_COUNT = orderedTerms.length;
export const orderIndexBySlug = new Map<string, number>(
  orderedTerms.map((item) => [item.node.slug, item.index])
);

export function sectionColor(sectionIdx: number): string {
  return SECTION_COLORS[sectionIdx] ?? ACCENT;
}