export interface SimNode3D {
  index?: number;
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
  r?: number;
  [key: string]: any;
}

export interface Force3D {
  (alpha: number): void;
  initialize?: (nodes: SimNode3D[]) => void;
}

export interface ForceManyBody extends Force3D {
  strength(s?: number): this;
}

export interface ForceCollide extends Force3D {
  iterations(it?: number): this;
}

export interface ForcePosition extends Force3D {
  strength(s?: number): this;
}

export interface Simulation3D {
  tick(iterations?: number): Simulation3D;
  force(name: string): Force3D | undefined;
  force(name: string, f: Force3D | null): Simulation3D;
  stop(): Simulation3D;
}

export function forceManyBody(strengthVal = -30): ForceManyBody {
  let nodes: SimNode3D[] = [];
  let strength = strengthVal;

  const force: any = (alpha: number) => {
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dz = b.z - a.z;
        let l2 = dx * dx + dy * dy + dz * dz || 1;
        const w = (strength * alpha) / l2;
        a.vx = (a.vx ?? 0) - dx * w;
        a.vy = (a.vy ?? 0) - dy * w;
        a.vz = (a.vz ?? 0) - dz * w;
        b.vx = (b.vx ?? 0) + dx * w;
        b.vy = (b.vy ?? 0) + dy * w;
        b.vz = (b.vz ?? 0) + dz * w;
      }
    }
  };

  force.initialize = (initNodes: SimNode3D[]) => {
    nodes = initNodes;
  };

  force.strength = (s?: number) => {
    if (s !== undefined) {
      strength = s;
      return force;
    }
    return strength;
  };

  return force as ForceManyBody;
}

export function forceCollide(radiusAccessor: (node: SimNode3D) => number): ForceCollide {
  let nodes: SimNode3D[] = [];
  let iterations = 1;

  const force: any = (alpha: number) => {
    const n = nodes.length;
    for (let k = 0; k < iterations; k++) {
      for (let i = 0; i < n; i++) {
        const a = nodes[i];
        const ra = radiusAccessor(a);
        for (let j = i + 1; j < n; j++) {
          const b = nodes[j];
          const rb = radiusAccessor(b);
          const r = ra + rb;
          let dx = b.x + (b.vx ?? 0) - (a.x + (a.vx ?? 0));
          let dy = b.y + (b.vy ?? 0) - (a.y + (a.vy ?? 0));
          let dz = b.z + (b.vz ?? 0) - (a.z + (a.vz ?? 0));
          let l = Math.hypot(dx, dy, dz);
          if (l < r) {
            l = ((l - r) / (l || 1)) * alpha;
            dx *= l;
            dy *= l;
            dz *= l;
            a.vx = (a.vx ?? 0) + dx * 0.5;
            a.vy = (a.vy ?? 0) + dy * 0.5;
            a.vz = (a.vz ?? 0) + dz * 0.5;
            b.vx = (b.vx ?? 0) - dx * 0.5;
            b.vy = (b.vy ?? 0) - dy * 0.5;
            b.vz = (b.vz ?? 0) - dz * 0.5;
          }
        }
      }
    }
  };

  force.initialize = (initNodes: SimNode3D[]) => {
    nodes = initNodes;
  };

  force.iterations = (it?: number) => {
    if (it !== undefined) {
      iterations = it;
      return force;
    }
    return iterations;
  };

  return force as ForceCollide;
}

export function forceX(targetX = 0): ForcePosition {
  let nodes: SimNode3D[] = [];
  let strength = 0.1;
  const force: any = (alpha: number) => {
    for (const node of nodes) {
      node.vx = (node.vx ?? 0) + (targetX - node.x) * strength * alpha;
    }
  };
  force.initialize = (initNodes: SimNode3D[]) => {
    nodes = initNodes;
  };
  force.strength = (s?: number) => {
    if (s !== undefined) {
      strength = s;
      return force;
    }
    return strength;
  };
  return force as ForcePosition;
}

export function forceY(targetY = 0): ForcePosition {
  let nodes: SimNode3D[] = [];
  let strength = 0.1;
  const force: any = (alpha: number) => {
    for (const node of nodes) {
      node.vy = (node.vy ?? 0) + (targetY - node.y) * strength * alpha;
    }
  };
  force.initialize = (initNodes: SimNode3D[]) => {
    nodes = initNodes;
  };
  force.strength = (s?: number) => {
    if (s !== undefined) {
      strength = s;
      return force;
    }
    return strength;
  };
  return force as ForcePosition;
}

export function forceZ(targetZ = 0): ForcePosition {
  let nodes: SimNode3D[] = [];
  let strength = 0.1;
  const force: any = (alpha: number) => {
    for (const node of nodes) {
      node.vz = (node.vz ?? 0) + (targetZ - node.z) * strength * alpha;
    }
  };
  force.initialize = (initNodes: SimNode3D[]) => {
    nodes = initNodes;
  };
  force.strength = (s?: number) => {
    if (s !== undefined) {
      strength = s;
      return force;
    }
    return strength;
  };
  return force as ForcePosition;
}

export function forceSimulation(nodes: SimNode3D[], dimensions = 3): Simulation3D {
  let alpha = 1;
  const alphaMin = 0.001;
  const alphaDecay = 1 - Math.pow(alphaMin, 1 / 300);
  const velocityDecay = 0.6;
  const forces = new Map<string, Force3D>();

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].index = i;
    nodes[i].vx = nodes[i].vx ?? 0;
    nodes[i].vy = nodes[i].vy ?? 0;
    nodes[i].vz = nodes[i].vz ?? 0;
  }

  const sim: Simulation3D = {
    tick(iterations = 1) {
      for (let k = 0; k < iterations; k++) {
        alpha += (0 - alpha) * alphaDecay;
        forces.forEach((f) => f(alpha));
        for (const node of nodes) {
          node.x += node.vx = (node.vx ?? 0) * velocityDecay;
          node.y += node.vy = (node.vy ?? 0) * velocityDecay;
          node.z += node.vz = (node.vz ?? 0) * velocityDecay;
        }
      }
      return sim;
    },
    force(name: string, f?: Force3D | null): any {
      if (f === undefined) return forces.get(name);
      if (f === null) forces.delete(name);
      else {
        forces.set(name, f);
        f.initialize?.(nodes);
      }
      return sim;
    },
    stop() {
      return sim;
    },
  };

  return sim;
}