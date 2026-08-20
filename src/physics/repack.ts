import {
  forceSimulation,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  forceZ,
} from "./d3-force-3d";
import { edges, nodeBySlug, nodeRadius } from "../data/dictionary";
import { MOTION_COUNT, slugToMotionIndex, restPositions } from "./motionData";

export const matchTarget = new Float32Array(MOTION_COUNT).fill(1);
export const repackOffset = new Float32Array(3 * MOTION_COUNT);
export const repackState = {
  active: false,
  fitRadius: 0,
  tick: 0,
};

export function applyMatches(slugs: string[] | null) {
  if (!slugs) {
    matchTarget.fill(1);
    repackOffset.fill(0);
    repackState.active = false;
    repackState.fitRadius = 0;
    repackState.tick++;
    return;
  }

  const activeIndices = new Set<number>();
  for (const slug of slugs) {
    const idx = slugToMotionIndex.get(slug);
    if (idx !== undefined) activeIndices.add(idx);
  }

  for (let i = 0; i < MOTION_COUNT; i++) {
    matchTarget[i] = activeIndices.has(i) ? 1 : 0;
  }
  repackState.active = true;
}

export function solveRepack(activeSlugs: string[]) {
  const targetNodes = activeSlugs
    .map((slug) => {
      const mi = slugToMotionIndex.get(slug);
      const node = nodeBySlug.get(slug);
      return mi !== undefined && node ? { slug, mi, node } : null;
    })
    .filter((n): n is { slug: string; mi: number; node: any } => n !== null);

  if (targetNodes.length === 0) {
    repackState.fitRadius = 0;
    repackState.tick++;
    return;
  }

  if (targetNodes.length === 1) {
    const single = targetNodes[0];
    const mi = single.mi;
    repackOffset[3 * mi + 0] = -restPositions[3 * mi + 0];
    repackOffset[3 * mi + 1] = -restPositions[3 * mi + 1];
    repackOffset[3 * mi + 2] = -restPositions[3 * mi + 2];
    repackState.fitRadius = nodeRadius(single.node.inDegree) + 16;
    repackState.tick++;
    return;
  }

  let avgX = 0, avgY = 0, avgZ = 0;
  for (const item of targetNodes) {
    avgX += restPositions[3 * item.mi + 0];
    avgY += restPositions[3 * item.mi + 1];
    avgZ += restPositions[3 * item.mi + 2];
  }
  avgX /= targetNodes.length;
  avgY /= targetNodes.length;
  avgZ /= targetNodes.length;

  const simNodes = targetNodes.map((item) => ({
    mi: item.mi,
    r: nodeRadius(item.node.inDegree),
    x: restPositions[3 * item.mi + 0] - avgX,
    y: restPositions[3 * item.mi + 1] - avgY,
    z: restPositions[3 * item.mi + 2] - avgZ,
  }));

  const localIndexMap = new Map<string, number>(
    targetNodes.map((item, idx) => [item.slug, idx])
  );
  const simEdges: { source: number; target: number }[] = [];
  for (const edge of edges) {
    const s = localIndexMap.get(edge.source);
    const t = localIndexMap.get(edge.target);
    if (s !== undefined && t !== undefined) simEdges.push({ source: s, target: t });
  }

  const charge = forceManyBody(-55);
  const collide = forceCollide((d: any) => d.r + 18).iterations(4);
  const fx = forceX(0).strength(0.06);
  const fy = forceY(0).strength(0.06);
  const fz = forceZ(0).strength(0.06);

  const sim = forceSimulation(simNodes, 3);
  sim.force("charge", charge);
  sim.force("collide", collide);
  sim.force("x", fx);
  sim.force("y", fy);
  sim.force("z", fz);

  if (simEdges.length > 0) {
    sim.force("link", () => {
      for (const e of simEdges) {
        const source = simNodes[e.source];
        const target = simNodes[e.target];
        if (!source || !target) continue;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dz = target.z - source.z;
        const dist = Math.hypot(dx, dy, dz) || 1;
        const targetDist = source.r + target.r + 40;
        const k = ((dist - targetDist) / dist) * 0.08;
        const sx = dx * k, sy = dy * k, sz = dz * k;
        source.x += sx; source.y += sy; source.z += sz;
        target.x -= sx; target.y -= sy; target.z -= sz;
      }
    });
  }

  sim.stop();
  for (let i = 0; i < 180; i++) sim.tick();

  let cX = 0, cY = 0, cZ = 0;
  for (const n of simNodes) {
    cX += n.x; cY += n.y; cZ += n.z;
  }
  cX /= simNodes.length;
  cY /= simNodes.length;
  cZ /= simNodes.length;

  let maxRadius = 0;
  for (const n of simNodes) {
    const lx = n.x - cX;
    const ly = n.y - cY;
    const lz = n.z - cZ;
    repackOffset[3 * n.mi + 0] = lx - restPositions[3 * n.mi + 0];
    repackOffset[3 * n.mi + 1] = ly - restPositions[3 * n.mi + 1];
    repackOffset[3 * n.mi + 2] = lz - restPositions[3 * n.mi + 2];
    maxRadius = Math.max(maxRadius, Math.hypot(lx, ly, lz) + n.r);
  }

  repackState.fitRadius = maxRadius + 16;
  repackState.tick++;
}