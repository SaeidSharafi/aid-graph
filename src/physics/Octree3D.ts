/**
 * 3D Octree Spatial Partitioning Structure for Barnes-Hut N-body simulation & Collision Detection
 */

import { SimulationNode } from '../types/graph';

export interface OctreeInternalNode {
  isLeaf: false;
  children: (OctreeNode | null)[]; // 8 octants
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
  cx: number; // Center of mass X
  cy: number; // Center of mass Y
  cz: number; // Center of mass Z
  weight: number; // Total weight / charge accumulated
  length: number; // Max bounding cube edge length
}

export interface OctreeLeafNode {
  isLeaf: true;
  data: SimulationNode;
  next?: OctreeLeafNode; // In case of coincident points
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
  cx: number;
  cy: number;
  cz: number;
  weight: number;
  length: number;
}

export type OctreeNode = OctreeInternalNode | OctreeLeafNode;

export class Octree3D {
  public root: OctreeNode | null = null;
  public minX = 0;
  public minY = 0;
  public minZ = 0;
  public maxX = 0;
  public maxY = 0;
  public maxZ = 0;

  constructor(nodes?: SimulationNode[]) {
    if (nodes && nodes.length > 0) {
      this.addAll(nodes);
    }
  }

  public addAll(nodes: SimulationNode[]): void {
    if (nodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < nodes.length; i++) {
      const d = nodes[i];
      if (isNaN(d.x) || isNaN(d.y) || isNaN(d.z)) continue;
      if (d.x < minX) minX = d.x;
      if (d.x > maxX) maxX = d.x;
      if (d.y < minY) minY = d.y;
      if (d.y > maxY) maxY = d.y;
      if (d.z < minZ) minZ = d.z;
      if (d.z > maxZ) maxZ = d.z;
    }

    // Make cubic bounding box to keep aspect ratio 1:1:1
    const dx = maxX - minX;
    const dy = maxY - minY;
    const dz = maxZ - minZ;
    const maxSpan = Math.max(dx, dy, dz, 1);

    maxX = minX + maxSpan;
    maxY = minY + maxSpan;
    maxZ = minZ + maxSpan;

    this.minX = minX;
    this.minY = minY;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxY = maxY;
    this.maxZ = maxZ;

    for (let i = 0; i < nodes.length; i++) {
      this.insert(nodes[i]);
    }

    // Compute Barnes-Hut centers of mass
    this.accumulate(this.root);
  }

  private insert(p: SimulationNode): void {
    if (isNaN(p.x) || isNaN(p.y) || isNaN(p.z)) return;

    if (!this.root) {
      this.root = {
        isLeaf: true,
        data: p,
        x0: this.minX,
        y0: this.minY,
        z0: this.minZ,
        x1: this.maxX,
        y1: this.maxY,
        z1: this.maxZ,
        cx: p.x,
        cy: p.y,
        cz: p.z,
        weight: 1,
        length: this.maxX - this.minX,
      };
      return;
    }

    let node = this.root;
    let x0 = this.minX;
    let y0 = this.minY;
    let z0 = this.minZ;
    let x1 = this.maxX;
    let y1 = this.maxY;
    let z1 = this.maxZ;

    while (true) {
      const xm = (x0 + x1) * 0.5;
      const ym = (y0 + y1) * 0.5;
      const zm = (z0 + z1) * 0.5;

      const right = p.x >= xm ? 1 : 0;
      const bottom = p.y >= ym ? 2 : 0;
      const back = p.z >= zm ? 4 : 0;
      const octant = right | bottom | back;

      if (node.isLeaf) {
        const existing = node.data;

        // If exact same position, chain in leaf
        if (existing.x === p.x && existing.y === p.y && existing.z === p.z) {
          const leaf: OctreeLeafNode = {
            isLeaf: true,
            data: p,
            next: node.next,
            x0, y0, z0, x1, y1, z1,
            cx: p.x, cy: p.y, cz: p.z,
            weight: 1,
            length: x1 - x0,
          };
          node.next = leaf;
          return;
        }

        // Subdivide leaf into internal node
        const children: (OctreeNode | null)[] = [null, null, null, null, null, null, null, null];
        const internal: OctreeInternalNode = {
          isLeaf: false,
          children,
          x0, y0, z0, x1, y1, z1,
          cx: 0, cy: 0, cz: 0,
          weight: 0,
          length: x1 - x0,
        };

        // Re-assign node in tree reference or root
        if (node === this.root) {
          this.root = internal;
        }

        // Re-insert the existing point
        const exRight = existing.x >= xm ? 1 : 0;
        const exBottom = existing.y >= ym ? 2 : 0;
        const exBack = existing.z >= zm ? 4 : 0;
        const exOctant = exRight | exBottom | exBack;

        const ex0 = exRight ? xm : x0;
        const ey0 = exBottom ? ym : y0;
        const ez0 = exBack ? zm : z0;
        const ex1 = exRight ? x1 : xm;
        const ey1 = exBottom ? y1 : ym;
        const ez1 = exBack ? z1 : zm;

        children[exOctant] = {
          isLeaf: true,
          data: existing,
          next: node.next,
          x0: ex0, y0: ey0, z0: ez0, x1: ex1, y1: ey1, z1: ez1,
          cx: existing.x, cy: existing.y, cz: existing.z,
          weight: 1,
          length: ex1 - ex0,
        };

        // Now place the new point
        if (octant === exOctant) {
          // Both fell in same child -> iterate down
          node = children[octant]!;
          if (right) x0 = xm; else x1 = xm;
          if (bottom) y0 = ym; else y1 = ym;
          if (back) z0 = zm; else z1 = zm;
          continue;
        } else {
          const nx0 = right ? xm : x0;
          const ny0 = bottom ? ym : y0;
          const nz0 = back ? zm : z0;
          const nx1 = right ? x1 : xm;
          const ny1 = bottom ? y1 : ym;
          const nz1 = back ? z1 : zm;

          children[octant] = {
            isLeaf: true,
            data: p,
            x0: nx0, y0: ny0, z0: nz0, x1: nx1, y1: ny1, z1: nz1,
            cx: p.x, cy: p.y, cz: p.z,
            weight: 1,
            length: nx1 - nx0,
          };
          return;
        }
      } else {
        // Internal node: step into child
        const internal = node as OctreeInternalNode;
        if (!internal.children[octant]) {
          const nx0 = right ? xm : x0;
          const ny0 = bottom ? ym : y0;
          const nz0 = back ? zm : z0;
          const nx1 = right ? x1 : xm;
          const ny1 = bottom ? y1 : ym;
          const nz1 = back ? z1 : zm;

          internal.children[octant] = {
            isLeaf: true,
            data: p,
            x0: nx0, y0: ny0, z0: nz0, x1: nx1, y1: ny1, z1: nz1,
            cx: p.x, cy: p.y, cz: p.z,
            weight: 1,
            length: nx1 - nx0,
          };
          return;
        } else {
          node = internal.children[octant]!;
          if (right) x0 = xm; else x1 = xm;
          if (bottom) y0 = ym; else y1 = ym;
          if (back) z0 = zm; else z1 = zm;
        }
      }
    }
  }

  /**
   * Accumulates centers of mass for Barnes-Hut simulation
   */
  private accumulate(node: OctreeNode | null): number {
    if (!node) return 0;

    if (node.isLeaf) {
      let count = 1;
      let leaf: OctreeLeafNode | undefined = node;
      while (leaf?.next) {
        count++;
        leaf = leaf.next;
      }
      node.weight = count;
      return count;
    }

    const internal = node as OctreeInternalNode;
    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (let i = 0; i < 8; i++) {
      const child = internal.children[i];
      if (child) {
        const childWeight = this.accumulate(child);
        totalWeight += childWeight;
        sumX += child.cx * childWeight;
        sumY += child.cy * childWeight;
        sumZ += child.cz * childWeight;
      }
    }

    if (totalWeight > 0) {
      internal.cx = sumX / totalWeight;
      internal.cy = sumY / totalWeight;
      internal.cz = sumZ / totalWeight;
    }
    internal.weight = totalWeight;
    return totalWeight;
  }

  /**
   * Traversal helper
   */
  public visit(callback: (node: OctreeNode) => boolean | void): void {
    if (!this.root) return;
    const stack: OctreeNode[] = [this.root];

    while (stack.length > 0) {
      const curr = stack.pop()!;
      const skipChildren = callback(curr);
      if (skipChildren !== true && !curr.isLeaf) {
        const internal = curr as OctreeInternalNode;
        for (let i = 7; i >= 0; i--) {
          const child = internal.children[i];
          if (child) stack.push(child);
        }
      }
    }
  }
}
