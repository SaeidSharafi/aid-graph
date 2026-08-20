/**
 * GraphStore - State container & 3D Force Repacking Engine
 */

import {
  GraphNode,
  GraphEdge,
  Section,
  SimulationNode,
  SimulationLink,
  PhysicsParams,
  DEFAULT_PHYSICS_PARAMS,
  calculateNodeRadius,
  computeDefaultControlPoint,
  computeFibonacciSphericalPosition,
  RepackResult,
} from '../types/graph';
import { ForceSimulation3D } from '../physics/ForceSimulation3D';

export class GraphStore {
  public nodes: GraphNode[] = [];
  public edges: GraphEdge[] = [];
  public sections: Section[] = [];

  // Spatial Typed Arrays
  public restPositions: Float32Array = new Float32Array(0);     // [x0, y0, z0, ...]
  public repackOffset: Float32Array = new Float32Array(0);      // [ox0, oy0, oz0, ...]
  public matchTarget: Float32Array = new Float32Array(0);       // [m0, m1, ...]
  public currentPositions: Float32Array = new Float32Array(0);  // Lerped render buffer

  // Physics Simulation
  public fitRadius = 140;
  public physicsParams: PhysicsParams = { ...DEFAULT_PHYSICS_PARAMS };

  // Fast Lookup Maps
  public slugToIndex = new Map<string, number>();
  public adjacencyMap = new Map<string, Set<string>>();
  public outgoingMap = new Map<string, Set<string>>();
  public incomingMap = new Map<string, Set<string>>();
  public maxInDegree = 1;

  constructor(
    nodes: GraphNode[],
    edges: GraphEdge[],
    sections?: Section[],
    params?: Partial<PhysicsParams>
  ) {
    this.nodes = nodes;
    this.edges = edges;
    if (params) {
      this.physicsParams = { ...this.physicsParams, ...params };
    }

    const n = nodes.length;
    this.restPositions = new Float32Array(3 * n);
    this.repackOffset = new Float32Array(3 * n);
    this.matchTarget = new Float32Array(n);
    this.currentPositions = new Float32Array(3 * n);

    if (sections) {
      this.sections = sections;
    } else {
      this.sections = this.deriveSections();
    }

    this.initialize();
  }

  public setGraph(nodes: GraphNode[], edges: GraphEdge[], sections?: Section[]): void {
    this.nodes = nodes;
    this.edges = edges;

    const n = nodes.length;
    this.restPositions = new Float32Array(3 * n);
    this.repackOffset = new Float32Array(3 * n);
    this.matchTarget = new Float32Array(n);
    this.currentPositions = new Float32Array(3 * n);

    if (sections) {
      this.sections = sections;
    } else {
      this.sections = this.deriveSections();
    }

    this.initialize();
  }

  private initialize(): void {
    this.slugToIndex.clear();
    this.adjacencyMap.clear();
    this.outgoingMap.clear();
    this.incomingMap.clear();

    let maxDeg = 1;

    // 1. Index slugs and setup rest positions
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      this.slugToIndex.set(node.slug, i);
      this.adjacencyMap.set(node.slug, new Set());
      this.outgoingMap.set(node.slug, new Set());
      this.incomingMap.set(node.slug, new Set());

      // Pack rest positions (use Fibonacci spiral if layout coordinates are unset or [0,0,0])
      let x = node.layout ? node.layout[0] : 0;
      let y = node.layout ? node.layout[1] : 0;
      let z = node.layout ? node.layout[2] : 0;

      if (!node.layout || (x === 0 && y === 0 && z === 0)) {
        const [fx, fy, fz] = computeFibonacciSphericalPosition(i);
        x = fx;
        y = fy;
        z = fz;
        node.layout = [x, y, z];
      }

      this.restPositions[i * 3 + 0] = x;
      this.restPositions[i * 3 + 1] = y;
      this.restPositions[i * 3 + 2] = z;

      this.currentPositions[i * 3 + 0] = x;
      this.currentPositions[i * 3 + 1] = y;
      this.currentPositions[i * 3 + 2] = z;

      this.matchTarget[i] = 1.0;
    }

    // 2. Build adjacency caching & recalculate inDegree if needed
    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      const srcSlug = edge.source;
      const tgtSlug = edge.target;

      this.outgoingMap.get(srcSlug)?.add(tgtSlug);
      this.incomingMap.get(tgtSlug)?.add(srcSlug);

      this.adjacencyMap.get(srcSlug)?.add(tgtSlug);
      this.adjacencyMap.get(tgtSlug)?.add(srcSlug);
    }

    // Update inDegrees & find max
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const inCount = this.incomingMap.get(node.slug)?.size ?? node.inDegree ?? 0;
      node.inDegree = inCount;
      if (inCount > maxDeg) maxDeg = inCount;
    }
    this.maxInDegree = Math.max(maxDeg, 37);

    // 3. Global Rest Positions De-collision Pass
    // Ensures all nodes across the entire dataset maintain a clean non-overlapping spacing
    const SPHERE_RADIUS = 135;
    const n = this.nodes.length;
    for (let pass = 0; pass < 20; pass++) {
      for (let i = 0; i < n; i++) {
        const rA = calculateNodeRadius(this.nodes[i].inDegree, this.maxInDegree) + 14;
        let ax = this.restPositions[i * 3 + 0];
        let ay = this.restPositions[i * 3 + 1];
        let az = this.restPositions[i * 3 + 2];

        for (let j = i + 1; j < n; j++) {
          const rB = calculateNodeRadius(this.nodes[j].inDegree, this.maxInDegree) + 14;
          const targetDist = rA + rB + 8;

          let bx = this.restPositions[j * 3 + 0];
          let by = this.restPositions[j * 3 + 1];
          let bz = this.restPositions[j * 3 + 2];

          let dx = bx - ax;
          let dy = by - ay;
          let dz = bz - az;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < targetDist * targetDist) {
            let dist = Math.sqrt(distSq);
            if (dist < 0.5) {
              dx = (Math.random() - 0.5) * 2;
              dy = (Math.random() - 0.5) * 2;
              dz = (Math.random() - 0.5) * 2;
              dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            }

            const overlap = ((targetDist - dist) / dist) * 0.5;
            ax -= dx * overlap;
            ay -= dy * overlap;
            az -= dz * overlap;

            bx += dx * overlap;
            by += dy * overlap;
            bz += dz * overlap;

            this.restPositions[j * 3 + 0] = bx;
            this.restPositions[j * 3 + 1] = by;
            this.restPositions[j * 3 + 2] = bz;
          }
        }

        // Spherical constraint
        const dOrigin = Math.sqrt(ax * ax + ay * ay + az * az);
        if (dOrigin > SPHERE_RADIUS) {
          const fac = SPHERE_RADIUS / dOrigin;
          ax *= fac;
          ay *= fac;
          az *= fac;
        }

        this.restPositions[i * 3 + 0] = ax;
        this.restPositions[i * 3 + 1] = ay;
        this.restPositions[i * 3 + 2] = az;
        this.currentPositions[i * 3 + 0] = ax;
        this.currentPositions[i * 3 + 1] = ay;
        this.currentPositions[i * 3 + 2] = az;
      }
    }

    // 4. Compute Bezier controls for edges
    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      const sIdx = this.slugToIndex.get(edge.source);
      const tIdx = this.slugToIndex.get(edge.target);

      if (sIdx !== undefined && tIdx !== undefined) {
        const p0: [number, number, number] = [
          this.restPositions[sIdx * 3 + 0],
          this.restPositions[sIdx * 3 + 1],
          this.restPositions[sIdx * 3 + 2],
        ];
        const p2: [number, number, number] = [
          this.restPositions[tIdx * 3 + 0],
          this.restPositions[tIdx * 3 + 1],
          this.restPositions[tIdx * 3 + 2],
        ];

        if (!edge.control || (edge.control[0] === 0 && edge.control[1] === 0 && edge.control[2] === 0)) {
          edge.control = computeDefaultControlPoint(p0, p2, 0.25, i);
        }
      }
    }

    // 5. Update section centroids and radii
    this.updateSectionCentroids();
  }

  public neighborsOf(slug: string): Set<string> {
    return this.adjacencyMap.get(slug) ?? new Set();
  }

  public getNodePosition(identifier: string | number): [number, number, number] {
    const idx = typeof identifier === 'string' ? this.slugToIndex.get(identifier) : identifier;
    if (idx === undefined || idx < 0 || idx >= this.nodes.length) {
      return [0, 0, 0];
    }
    const bx = this.restPositions[idx * 3 + 0];
    const by = this.restPositions[idx * 3 + 1];
    const bz = this.restPositions[idx * 3 + 2];
    const ox = this.repackOffset[idx * 3 + 0];
    const oy = this.repackOffset[idx * 3 + 1];
    const oz = this.repackOffset[idx * 3 + 2];
    return [bx + ox, by + oy, bz + oz];
  }

  public updateSectionCentroids(): void {
    for (const section of this.sections) {
      let sumX = 0;
      let sumY = 0;
      let sumZ = 0;
      let count = 0;

      for (const slug of section.slugs) {
        const idx = this.slugToIndex.get(slug);
        if (idx !== undefined) {
          sumX += this.restPositions[idx * 3 + 0];
          sumY += this.restPositions[idx * 3 + 1];
          sumZ += this.restPositions[idx * 3 + 2];
          count++;
        }
      }

      if (count > 0) {
        section.centroid = [sumX / count, sumY / count, sumZ / count];
        let maxR = 0;
        for (const slug of section.slugs) {
          const idx = this.slugToIndex.get(slug);
          if (idx !== undefined) {
            const dx = this.restPositions[idx * 3 + 0] - section.centroid[0];
            const dy = this.restPositions[idx * 3 + 1] - section.centroid[1];
            const dz = this.restPositions[idx * 3 + 2] - section.centroid[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist > maxR) maxR = dist;
          }
        }
        section.radius = maxR + 25;
      }
    }
  }

  private deriveSections(): Section[] {
    const secMap = new Map<number, string[]>();
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const secIdx = node.section ?? 0;
      if (!secMap.has(secIdx)) {
        secMap.set(secIdx, []);
      }
      secMap.get(secIdx)!.push(node.slug);
    }

    const defaultColors = [
      '#4500B3', '#EB4347', '#9DD395', '#D3C2FE', '#0F7A6B', '#FFD23F', '#2D3DCF',
    ];

    const result: Section[] = [];
    const entries = Array.from(secMap.entries()).sort((a, b) => a[0] - b[0]);

    for (let i = 0; i < entries.length; i++) {
      const [secIdx, slugs] = entries[i];
      result.push({
        index: secIdx,
        title: `SECTION ${secIdx}`,
        slugs,
        centroid: [0, 0, 0],
        radius: 80,
        color: defaultColors[secIdx % defaultColors.length],
      });
    }

    return result;
  }

  /**
   * applyHoverNudge: Subtly pulls 1st-degree neighbors towards the hovered node
   * - Hovered node stays completely locked in its original rest position (repackOffset = 0)
   * - Neighbors are pulled inward by 20% of distance (capped at 30 units with minPadding safety)
   * - Camera fitRadius is untouched so camera does NOT move on hover
   */
  public applyHoverNudge(hoveredSlug: string | null): void {
    // If mouse leaves, reset all offsets to 0 and matchTarget to 1.0
    if (!hoveredSlug) {
      this.repackOffset.fill(0);
      this.matchTarget.fill(1.0);
      return;
    }

    const hoveredIdx = this.slugToIndex.get(hoveredSlug);
    if (hoveredIdx === undefined) return;
    const hoveredNode = this.nodes[hoveredIdx];
    if (!hoveredNode) return;

    const neighbors = this.neighborsOf(hoveredSlug);
    const targetX = this.restPositions[3 * hoveredIdx];
    const targetY = this.restPositions[3 * hoveredIdx + 1];
    const targetZ = this.restPositions[3 * hoveredIdx + 2];
    const targetRadius = calculateNodeRadius(hoveredNode.inDegree, this.maxInDegree);

    // Clear previous offsets
    this.repackOffset.fill(0);

    // Set highlight states: 1.0 for hovered & neighbors, 0.25 for dim background
    this.matchTarget.fill(0.25);
    this.matchTarget[hoveredIdx] = 1.0;

    // Hovered node is anchor: DO NOT MOVE IT
    this.repackOffset[3 * hoveredIdx] = 0;
    this.repackOffset[3 * hoveredIdx + 1] = 0;
    this.repackOffset[3 * hoveredIdx + 2] = 0;

    // Nudge only 1st-degree connected neighbors
    for (const neighborSlug of neighbors) {
      const neighborIdx = this.slugToIndex.get(neighborSlug);
      if (neighborIdx === undefined) continue;
      const neighborNode = this.nodes[neighborIdx];
      if (!neighborNode) continue;

      this.matchTarget[neighborIdx] = 1.0;

      const nX = this.restPositions[3 * neighborIdx];
      const nY = this.restPositions[3 * neighborIdx + 1];
      const nZ = this.restPositions[3 * neighborIdx + 2];
      const neighborRadius = calculateNodeRadius(neighborNode.inDegree, this.maxInDegree);

      // Vector towards the hovered node: D_(v -> u) = restPositions[u] - restPositions[v]
      const dx = targetX - nX;
      const dy = targetY - nY;
      const dz = targetZ - nZ;
      const dist = Math.hypot(dx, dy, dz) || 1;

      // Nudge fraction (20% of distance, capped at 30 world units)
      const minPadding = targetRadius + neighborRadius + 12;
      const maxPull = Math.min(dist * 0.20, 30.0);
      const safePull = Math.max(0, Math.min(maxPull, dist - minPadding));

      const unitX = dx / dist;
      const unitY = dy / dist;
      const unitZ = dz / dist;

      this.repackOffset[3 * neighborIdx] = unitX * safePull;
      this.repackOffset[3 * neighborIdx + 1] = unitY * safePull;
      this.repackOffset[3 * neighborIdx + 2] = unitZ * safePull;
    }
  }

  /**
   * applyMatches: Updates matchTarget intensities (1.0 for matches, 0.25 for inactive)
   */
  public applyMatches(matches: string[] | Set<string> | null): void {
    if (!matches || (matches instanceof Set ? matches.size === 0 : matches.length === 0)) {
      this.matchTarget.fill(1.0);
      this.repackOffset.fill(0);
      this.fitRadius = 140;
      return;
    }

    const matchSet = matches instanceof Set ? matches : new Set(matches);
    for (let i = 0; i < this.nodes.length; i++) {
      this.matchTarget[i] = matchSet.has(this.nodes[i].slug) ? 1.0 : 0.25;
    }
  }

  /**
   * solveRepack: Solves active sub-graph repack and keeps all nodes clearly separated
   */
  public solveRepack(selectedSlugs: string[] | Set<string>): RepackResult {
    const startTime = performance.now();
    const slugSet = selectedSlugs instanceof Set ? selectedSlugs : new Set(selectedSlugs);
    const size = slugSet.size;

    // Case 1: Empty set (|S| = 0)
    if (size === 0) {
      this.repackOffset.fill(0);
      this.matchTarget.fill(1.0);
      this.fitRadius = 140;

      return {
        fitRadius: this.fitRadius,
        iterations: 0,
        durationMs: performance.now() - startTime,
        selectedCount: 0,
      };
    }

    // Set match target: 1.0 for active cluster S, 0.2 for other nodes
    for (let i = 0; i < this.nodes.length; i++) {
      this.matchTarget[i] = slugSet.has(this.nodes[i].slug) ? 1.0 : 0.2;
    }

    // Case 2: Single Node (|S| = 1)
    if (size === 1) {
      const singleSlug = Array.from(slugSet)[0];
      const i = this.slugToIndex.get(singleSlug);

      if (i !== undefined) {
        const node = this.nodes[i];
        const r0 = this.restPositions[i * 3 + 0];
        const r1 = this.restPositions[i * 3 + 1];
        const r2 = this.restPositions[i * 3 + 2];

        this.repackOffset.fill(0);
        this.repackOffset[i * 3 + 0] = -r0;
        this.repackOffset[i * 3 + 1] = -r1;
        this.repackOffset[i * 3 + 2] = -r2;

        const nodeRadius = calculateNodeRadius(node.inDegree, this.maxInDegree);
        this.fitRadius = nodeRadius + 30;

        return {
          fitRadius: this.fitRadius,
          iterations: 0,
          durationMs: performance.now() - startTime,
          selectedCount: 1,
        };
      }
    }

    // Case 3: Multiple Nodes (|S| >= 2)
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    const selectedIndices: number[] = [];

    slugSet.forEach((slug) => {
      const idx = this.slugToIndex.get(slug);
      if (idx !== undefined) {
        selectedIndices.push(idx);
        sumX += this.restPositions[idx * 3 + 0];
        sumY += this.restPositions[idx * 3 + 1];
        sumZ += this.restPositions[idx * 3 + 2];
      }
    });

    const count = selectedIndices.length;
    if (count === 0) {
      return { fitRadius: 0, iterations: 0, durationMs: 0, selectedCount: 0 };
    }

    const restCentroidX = sumX / count;
    const restCentroidY = sumY / count;
    const restCentroidZ = sumZ / count;

    // 2. Local Coordinate Initialization with generous initial radial dispersion
    const simNodes: SimulationNode[] = [];
    const simNodeMap = new Map<number, SimulationNode>();

    for (let k = 0; k < count; k++) {
      const mi = selectedIndices[k];
      const node = this.nodes[mi];
      const r = calculateNodeRadius(node.inDegree, this.maxInDegree);

      // Add radial dispersion if initial positions are too close
      const phi = (k / count) * Math.PI * 2;
      const cosTheta = ((k % 3) - 1) * 0.5;
      const u = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
      const disperseR = 35;

      let px = this.restPositions[mi * 3 + 0] - restCentroidX;
      let py = this.restPositions[mi * 3 + 1] - restCentroidY;
      let pz = this.restPositions[mi * 3 + 2] - restCentroidZ;

      if (Math.hypot(px, py, pz) < 15) {
        px += u * Math.cos(phi) * disperseR;
        py += u * Math.sin(phi) * disperseR;
        pz += cosTheta * disperseR;
      }

      const simNode: SimulationNode = {
        index: k,
        mi,
        slug: node.slug,
        x: px,
        y: py,
        z: pz,
        vx: 0,
        vy: 0,
        vz: 0,
        r,
        inDegree: node.inDegree,
        section: node.section,
      };

      simNodes.push(simNode);
      simNodeMap.set(mi, simNode);
    }

    // 3. Filter Active Edges
    const simLinks: SimulationLink[] = [];
    for (let e = 0; e < this.edges.length; e++) {
      const edge = this.edges[e];
      const sIdx = this.slugToIndex.get(edge.source);
      const tIdx = this.slugToIndex.get(edge.target);

      if (sIdx !== undefined && tIdx !== undefined) {
        const sNode = simNodeMap.get(sIdx);
        const tNode = simNodeMap.get(tIdx);

        if (sNode && tNode) {
          simLinks.push({
            source: sNode,
            target: tNode,
            index: simLinks.length,
          });
        }
      }
    }

    // 4. Instantiate 3D Simulation & Run Ticks
    const simulation = new ForceSimulation3D(simNodes, simLinks, this.physicsParams);
    const targetTicks = this.physicsParams.simulationTicks; // 240

    for (let tick = 0; tick < targetTicks; tick++) {
      simulation.tick();
    }

    // 5. Post-simulation collision guarantee pass (Forces nodes to have min separation)
    for (let pass = 0; pass < 12; pass++) {
      for (let i = 0; i < count; i++) {
        const nA = simNodes[i];
        const rA = nA.r + 26;

        for (let j = i + 1; j < count; j++) {
          const nB = simNodes[j];
          const rB = nB.r + 26;
          const targetDist = rA + rB;

          let dx = nB.x - nA.x;
          let dy = nB.y - nA.y;
          let dz = nB.z - nA.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < targetDist * targetDist) {
            let dist = Math.sqrt(distSq);
            if (dist < 0.5) {
              const ang = Math.random() * Math.PI * 2;
              dx = Math.cos(ang) * 2;
              dy = Math.sin(ang) * 2;
              dz = (Math.random() - 0.5) * 2;
              dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            }

            const overlap = ((targetDist - dist) / dist) * 0.5;
            nA.x -= dx * overlap;
            nA.y -= dy * overlap;
            nA.z -= dz * overlap;

            nB.x += dx * overlap;
            nB.y += dy * overlap;
            nB.z += dz * overlap;
          }
        }
      }
    }

    // 6. Re-center Simulation Output
    let simSumX = 0;
    let simSumY = 0;
    let simSumZ = 0;

    for (let k = 0; k < simNodes.length; k++) {
      simSumX += simNodes[k].x;
      simSumY += simNodes[k].y;
      simSumZ += simNodes[k].z;
    }

    const simCentroidX = simSumX / count;
    const simCentroidY = simSumY / count;
    const simCentroidZ = simSumZ / count;

    // 7. Compute Displacement Offsets & Camera Fit Radius
    let maxRadius = 0;
    this.repackOffset.fill(0);

    for (let k = 0; k < simNodes.length; k++) {
      const p = simNodes[k];
      const mi = p.mi;

      const tx = p.x - simCentroidX;
      const ty = p.y - simCentroidY;
      const tz = p.z - simCentroidZ;

      this.repackOffset[mi * 3 + 0] = tx - this.restPositions[mi * 3 + 0];
      this.repackOffset[mi * 3 + 1] = ty - this.restPositions[mi * 3 + 1];
      this.repackOffset[mi * 3 + 2] = tz - this.restPositions[mi * 3 + 2];

      let distFromOrigin = Math.sqrt(tx * tx + ty * ty + tz * tz);
      const SPHERE_BOUND = 135;
      if (distFromOrigin > SPHERE_BOUND) {
        const factor = SPHERE_BOUND / distFromOrigin;
        this.repackOffset[mi * 3 + 0] = (tx * factor) - this.restPositions[mi * 3 + 0];
        this.repackOffset[mi * 3 + 1] = (ty * factor) - this.restPositions[mi * 3 + 1];
        this.repackOffset[mi * 3 + 2] = (tz * factor) - this.restPositions[mi * 3 + 2];
        distFromOrigin = SPHERE_BOUND;
      }

      const totalDist = distFromOrigin + p.r;
      if (totalDist > maxRadius) {
        maxRadius = totalDist;
      }
    }

    this.fitRadius = maxRadius + 30;

    const durationMs = performance.now() - startTime;

    return {
      fitRadius: this.fitRadius,
      iterations: targetTicks,
      durationMs,
      selectedCount: count,
    };
  }
}

/**
 * Standalone Hover-Nudge implementation function matching the exact specification:
 * - Hovered node stays locked in original position (repackOffset = 0)
 * - 1st-degree neighbors pulled inward by fraction of distance (capped at 30 units)
 * - Match target set to 1.0 for hovered + neighbors, 0.25 for dim background
 */
export function applyHoverNudge(
  hoveredSlug: string | null,
  store: GraphStore
): void {
  store.applyHoverNudge(hoveredSlug);
}

