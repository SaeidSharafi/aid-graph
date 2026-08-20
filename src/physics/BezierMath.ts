/**
 * 3D Quadratic Bézier Curve Mathematics & Arc Generation
 */

import { evaluateBezier3D } from '../types/graph';

export { evaluateBezier3D };

/**
 * Computes an elegant 3D control point for a quadratic Bézier curve connecting p0 and p2.
 * Uses the chord vector and cluster elevation to prevent line overlapping.
 */
export function computeDefaultControlPoint(
  p0: [number, number, number],
  p2: [number, number, number],
  curvatureFactor = 0.22,
  seed = 0
): [number, number, number] {
  const mx = (p0[0] + p2[0]) * 0.5;
  const my = (p0[1] + p2[1]) * 0.5;
  const mz = (p0[2] + p2[2]) * 0.5;

  const dx = p2[0] - p0[0];
  const dy = p2[1] - p0[1];
  const dz = p2[2] - p0[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (len < 1e-4) {
    return [mx, my + 10, mz];
  }

  // Unit direction vector
  const udx = dx / len;
  const udy = dy / len;
  const udz = dz / len;

  // Arbitrary reference up vector
  let rx = 0;
  let ry = 1;
  let rz = 0;

  if (Math.abs(udy) > 0.9) {
    rx = 1;
    ry = 0;
    rz = 0;
  }

  // Cross product to get perpendicular vector 1
  let px = udy * rz - udz * ry;
  let py = udz * rx - udx * rz;
  let pz = udx * ry - udy * rx;
  const plen = Math.sqrt(px * px + py * py + pz * pz);
  if (plen > 1e-4) {
    px /= plen;
    py /= plen;
    pz /= plen;
  }

  // Second perpendicular vector
  const qx = udy * pz - udz * py;
  const qy = udz * px - udx * pz;
  const qz = udx * py - udy * px;

  // Modulate with seed / angle for visual variety
  const angle = (seed * 1.61803398875) % (Math.PI * 2);
  const perpX = px * Math.cos(angle) + qx * Math.sin(angle);
  const perpY = py * Math.cos(angle) + qy * Math.sin(angle);
  const perpZ = pz * Math.cos(angle) + qz * Math.sin(angle);

  const arcHeight = Math.min(len * curvatureFactor, 60);

  return [
    mx + perpX * arcHeight,
    my + perpY * arcHeight,
    mz + perpZ * arcHeight,
  ];
}

/**
 * Samples N points along a 3D Quadratic Bézier curve for rendering
 */
export function sampleBezierCurvePoints(
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  segments = 24
): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(evaluateBezier3D(p0, p1, p2, t));
  }
  return points;
}
