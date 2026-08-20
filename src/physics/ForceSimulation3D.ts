/**
 * 3D Force Simulation Engine with Barnes-Hut Octree & High-Precision Collision Resolution
 */

import { PhysicsParams, DEFAULT_PHYSICS_PARAMS, SimulationLink, SimulationNode } from '../types/graph';
import { Octree3D, OctreeNode } from './Octree3D';

export class ForceSimulation3D {
  public nodes: SimulationNode[] = [];
  public links: SimulationLink[] = [];
  public alpha = 1.0;
  public alphaMin = 0.001;
  public alphaDecay = 1 - Math.pow(0.001, 1 / 300); // ~0.0227629
  public velocityDecay = 0.6; // 0.4 retained
  public params: PhysicsParams;
  public stopped = false;
  public tickCount = 0;

  constructor(
    nodes: SimulationNode[],
    links: SimulationLink[] = [],
    params: Partial<PhysicsParams> = {}
  ) {
    this.nodes = nodes;
    this.links = links;
    this.params = { ...DEFAULT_PHYSICS_PARAMS, ...params };
    this.velocityDecay = this.params.velocityDecay;
  }

  public restart(): this {
    this.alpha = 1.0;
    this.stopped = false;
    this.tickCount = 0;
    return this;
  }

  public stop(): this {
    this.alpha = 0;
    this.stopped = true;
    return this;
  }

  /**
   * Performs one simulation tick
   */
  public tick(): void {
    if (this.nodes.length === 0) return;

    this.alpha += (this.alphaMin - this.alpha) * this.alphaDecay;
    this.tickCount++;

    // 1. Centering forces (pull gently towards origin)
    this.applyCenteringForces();

    // 2. Many-Body Charge Force (Repulsion)
    this.applyManyBodyForce();

    // 3. Link Spring Forces (Connected nodes spring with generous distance)
    this.applyLinkForces();

    // 4. Update Node Positions from Velocities
    const friction = 1 - this.velocityDecay;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.vx *= friction;
      node.vy *= friction;
      node.vz *= friction;

      node.x += node.vx;
      node.y += node.vy;
      node.z += node.vz;
    }

    // 5. High-Precision 3D Sphere Collision Relaxation (Exact pairwise pushes)
    this.applyCollideForces();

    if (this.alpha < this.alphaMin) {
      this.stop();
    }
  }

  /**
   * Centering Forces: Pulls node gently towards (0,0,0)
   */
  private applyCenteringForces(): void {
    const k = this.params.centeringStrength * this.alpha;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.vx -= node.x * k;
      node.vy -= node.y * k;
      node.vz -= node.z * k;
    }
  }

  /**
   * 3D Many-Body Repulsion
   */
  private applyManyBodyForce(): void {
    const n = this.nodes.length;
    const baseStrength = this.params.chargeStrength * this.alpha;

    if (n < 60) {
      // Direct exact N^2 for high-fidelity subgraphs
      for (let i = 0; i < n; i++) {
        const nodeA = this.nodes[i];
        for (let j = i + 1; j < n; j++) {
          const nodeB = this.nodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dz = nodeB.z - nodeA.z;
          const distSq = Math.max(dx * dx + dy * dy + dz * dz, 1.0);
          const dist = Math.sqrt(distSq);

          // Force = strength / dist^2
          const w = baseStrength / (distSq * Math.max(dist, 10.0));
          nodeA.vx += dx * w;
          nodeA.vy += dy * w;
          nodeA.vz += dz * w;

          nodeB.vx -= dx * w;
          nodeB.vy -= dy * w;
          nodeB.vz -= dz * w;
        }
      }
      return;
    }

    // Barnes-Hut Octree for larger node counts
    const octree = new Octree3D(this.nodes);
    const theta2 = this.params.theta * this.params.theta;

    for (let i = 0; i < n; i++) {
      const node = this.nodes[i];

      octree.visit((treeNode: OctreeNode) => {
        if (!treeNode.weight) return true;

        const dx = treeNode.cx - node.x;
        const dy = treeNode.cy - node.y;
        const dz = treeNode.cz - node.z;
        const l2 = dx * dx + dy * dy + dz * dz;

        if (treeNode.isLeaf) {
          let leaf: typeof treeNode | undefined = treeNode;
          while (leaf) {
            if (leaf.data !== node) {
              const pdx = leaf.data.x - node.x;
              const pdy = leaf.data.y - node.y;
              const pdz = leaf.data.z - node.z;
              const pl2 = Math.max(pdx * pdx + pdy * pdy + pdz * pdz, 1.0);
              const dist = Math.sqrt(pl2);
              const w = (baseStrength * leaf.weight) / (pl2 * Math.max(dist, 10.0));
              node.vx += pdx * w;
              node.vy += pdy * w;
              node.vz += pdz * w;
            }
            leaf = leaf.next;
          }
          return true;
        }

        if (l2 > 0 && (treeNode.length * treeNode.length) / l2 < theta2) {
          const dist = Math.sqrt(l2);
          const w = (baseStrength * treeNode.weight) / (l2 * Math.max(dist, 10.0));
          node.vx += dx * w;
          node.vy += dy * w;
          node.vz += dz * w;
          return true;
        }

        return false;
      });
    }
  }

  /**
   * Custom 3D Link Spring Force
   */
  private applyLinkForces(): void {
    const linkK = this.params.linkStrength;
    const padding = this.params.linkDistancePadding;

    for (let i = 0; i < this.links.length; i++) {
      const link = this.links[i];
      const e = link.source;
      const o = link.target;

      const dx = o.x - e.x;
      const dy = o.y - e.y;
      const dz = o.z - e.z;

      const dist = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 1e-6);
      const targetDist = e.r + o.r + padding;
      const factor = ((dist - targetDist) / dist) * linkK;

      e.x += dx * factor;
      e.y += dy * factor;
      e.z += dz * factor;

      o.x -= dx * factor;
      o.y -= dy * factor;
      o.z -= dz * factor;
    }
  }

  /**
   * High-Precision 3D Sphere Collision Relaxation
   * Prevents nodes from overlapping or sitting inside each other
   */
  private applyCollideForces(): void {
    const iters = this.params.collideIterations || 8;
    const padding = this.params.collideRadiusPadding || 26;
    const strength = this.params.collideStrength || 1.2;
    const n = this.nodes.length;

    for (let iter = 0; iter < iters; iter++) {
      for (let i = 0; i < n; i++) {
        const nodeA = this.nodes[i];
        const rA = nodeA.r + padding;

        for (let j = i + 1; j < n; j++) {
          const nodeB = this.nodes[j];
          const rB = nodeB.r + padding;
          const targetDist = rA + rB;

          let dx = nodeB.x - nodeA.x;
          let dy = nodeB.y - nodeA.y;
          let dz = nodeB.z - nodeA.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < targetDist * targetDist) {
            let dist = Math.sqrt(distSq);
            if (dist < 0.5) {
              const phi = Math.random() * Math.PI * 2;
              const costheta = Math.random() * 2 - 1;
              const u = Math.sqrt(Math.max(0, 1 - costheta * costheta));
              dx = u * Math.cos(phi) * 1.5;
              dy = u * Math.sin(phi) * 1.5;
              dz = costheta * 1.5;
              dist = 1.5;
            }

            const overlap = ((targetDist - dist) / dist) * 0.5 * strength;

            nodeA.x -= dx * overlap;
            nodeA.y -= dy * overlap;
            nodeA.z -= dz * overlap;

            nodeB.x += dx * overlap;
            nodeB.y += dy * overlap;
            nodeB.z += dz * overlap;
          }
        }
      }
    }
  }
}
