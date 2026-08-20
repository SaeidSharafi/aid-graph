import { nodes } from "../data/dictionary";

export const layoutNodes = nodes.filter((n) => Boolean(n.layout));
export const MOTION_COUNT = layoutNodes.length;
export const slugToMotionIndex = new Map<string, number>(
  layoutNodes.map((n, idx) => [n.slug, idx])
);

export const restPositions = new Float32Array(3 * MOTION_COUNT);
layoutNodes.forEach((n, idx) => {
  if (n.layout) {
    const [x, y, z] = n.layout;
    restPositions[3 * idx + 0] = x;
    restPositions[3 * idx + 1] = y;
    restPositions[3 * idx + 2] = z;
  }
});