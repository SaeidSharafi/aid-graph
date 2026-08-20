"use client";

import React, { useEffect, useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, Billboard, CameraControls } from "@react-three/drei";
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

import {
  ACCENT,
  BG,
  INK,
  edges,
  nodeBySlug,
  neighborsOf,
} from "../../data/dictionary";
import { useJourney } from "../../store/useJourney";
import { useBoot } from "../../store/useBoot";
import { MOTION_COUNT, restPositions, slugToMotionIndex, layoutNodes } from "../../physics/motionData";
import { matchTarget, repackOffset, repackState } from "../../physics/repack";
import { DuotoneEffect } from "./DuotoneEffect";
import { FocusRing } from "./FocusRing";
import { playTapSound } from "../../utils/sound";

const currentWorldPositions = new Float32Array(3 * MOTION_COUNT);
const currentVisibilities = new Float32Array(MOTION_COUNT).fill(1);
const nodeRadii = new Float32Array(MOTION_COUNT);
const labelOffsets = new Float32Array(MOTION_COUNT);

const phaseOffsets = new Float32Array(3 * MOTION_COUNT);
const wobbleAmplitudes = new Float32Array(3 * MOTION_COUNT);
const wobbleFrequencies = new Float32Array(3 * MOTION_COUNT);
const springK = new Float32Array(MOTION_COUNT);
const neighborPull = new Float32Array(MOTION_COUNT);
const spatialJitter = new Float32Array(3 * MOTION_COUNT);
const vel = new Float32Array(3 * MOTION_COUNT);
const acc = new Float32Array(3 * MOTION_COUNT);
const neighborIndexSets: Set<number>[] = [];

function prng(seed: number) {
  const t = 43758.5453 * Math.sin(127.1 * seed + 311.7);
  return t - Math.floor(t);
}

layoutNodes.forEach((node, i) => {
  const r = 2.2 + (Math.log1p(node.inDegree) / Math.log1p(37)) * 6.5;
  nodeRadii[i] = r;
  labelOffsets[i] = r + 3.0;

  const basePhase = 2.39996 * i;
  for (let c = 0; c < 3; c++) {
    const idx = 3 * i + c;
    phaseOffsets[idx] = basePhase + 6.283 * prng(idx);
    wobbleAmplitudes[idx] = 1.4 * (0.45 + 1.1 * prng(idx + 7.1));
    wobbleFrequencies[idx] = 0.18 * (0.6 + 1.1 * prng(idx + 13.3));
  }

  springK[i] = 42 * (0.45 + 1.4 * prng(i + 0.5));
  neighborPull[i] = 0.24 * (0.55 + 0.95 * prng(i + 4.2));
  spatialJitter[3 * i + 0] = (prng(i + 21.1) - 0.5) * 5;
  spatialJitter[3 * i + 1] = (prng(i + 31.7) - 0.5) * 5;
  spatialJitter[3 * i + 2] = (prng(i + 41.3) - 0.5) * 5;

  const neighborSet = new Set<number>();
  for (const neighborSlug of neighborsOf(node.slug)) {
    const nMi = slugToMotionIndex.get(neighborSlug);
    if (nMi !== undefined) neighborSet.add(nMi);
  }
  neighborIndexSets.push(neighborSet);
});

// View-Space Relative Depth Shader (Camera-Aware Depth Sorting)
const NodeShader = {
  vertexShader: `
    attribute vec3 aOffset;
    attribute float aRadius;
    attribute vec3 aColor;
    attribute float aState;
    varying vec3 vColor;
    varying float vState;
    varying float vRelDepth;
    varying vec2 vUv;

    void main() {
      vColor = aColor;
      vState = aState;
      vUv = position.xy;

      // Transform node into Camera View-Space
      vec4 centerView = modelViewMatrix * vec4(aOffset, 1.0);
      centerView.xy += position.xy * (aRadius * 2.0);

      // Transform Globe Center (0,0,0) into Camera View-Space
      vec4 globeCenterView = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);

      vRelDepth = centerView.z - globeCenterView.z;

      gl_Position = projectionMatrix * centerView;
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform vec3 uAccent;
    uniform vec3 uPaper;
    uniform vec3 uInk;
    varying vec3 vColor;
    varying float vState;
    varying float vRelDepth;
    varying vec2 vUv;

    void main() {
      if (length(vUv) > 0.5) discard;

      // Map [-60 (back), +60 (front)] smoothly into [0.0, 1.0]
      float t = clamp((vRelDepth + 60.0) / 120.0, 0.0, 1.0);

      vec3 backColor  = mix(uInk, uPaper, 0.78);
      vec3 frontColor = uInk;
      vec3 col = mix(backColor, frontColor, t);

      float hot = clamp(vState - 1.0, 0.0, 1.0);
      col = mix(col, uAccent, hot);

      float dim = clamp(vState, 0.0, 1.0);
      col = mix(uPaper, col, mix(0.35, 1.0, dim));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

const CurvedEdgeShader = {
  vertexShader: `
    attribute float aOpacity;
    varying float vOpacity;
    varying float vRelDepth;

    void main() {
      vOpacity = aOpacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vec4 globeCenterView = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vRelDepth = mvPosition.z - globeCenterView.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform vec3 uLineColor;
    varying float vOpacity;
    varying float vRelDepth;

    void main() {
      if (vOpacity < 0.005) discard;
      float depthFade = clamp((vRelDepth + 70.0) / 140.0, 0.35, 1.0);
      gl_FragColor = vec4(uLineColor, vOpacity * depthFade);
    }
  `,
};

const ParticleShader = {
  vertexShader: `
    attribute float aSize;
    attribute float aOpacity;
    varying float vOpacity;

    void main() {
      vOpacity = aOpacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * (350.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform vec3 uColor;
    varying float vOpacity;

    void main() {
      if (vOpacity < 0.005) discard;
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.35, d) * vOpacity;
      gl_FragColor = vec4(uColor, a);
    }
  `,
};

const SEGS_PER_CURVE = 16;
const MAX_PARTICLES = 120;
const aB = (50 * Math.PI) / 360;
const defaultCameraDir = new THREE.Vector3(130, 100, 540).normalize();

function calcOverviewDistance(width: number, height: number): number {
  const r = Math.atan((width / Math.max(1, height)) * Math.tan(aB));
  return Math.min(1200, Math.max(320, 230 / Math.sin(Math.min(aB, r))));
}

export const Atlas: React.FC = () => {
  const controlsRef = useRef<CameraControls | null>(null);
  const nodeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const labelGroupRefs = useRef<(THREE.Group | null)[]>([]);

  const offsetAttrRef = useRef<THREE.InstancedBufferAttribute | null>(null);
  const radiusAttrRef = useRef<THREE.InstancedBufferAttribute | null>(null);
  const stateAttrRef = useRef<THREE.InstancedBufferAttribute | null>(null);

  const edgeLinePosAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const edgeLineOpAttrRef = useRef<THREE.BufferAttribute | null>(null);

  const particlePosAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const particleOpAttrRef = useRef<THREE.BufferAttribute | null>(null);

  const { camera, gl, size } = useThree();
  const focusedSlug = useJourney((s) => s.focusedSlug);
  const hoveredSlug = useJourney((s) => s.hoveredSlug);
  const setHovered = useJourney((s) => s.setHovered);
  const focusNode = useJourney((s) => s.focusNode);
  const searchActive = useJourney((s) => s.searchActive);

  const planeGeom = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const { offsetAttr, radiusAttr, colorAttr, stateAttr } = useMemo(() => {
    const offsets = new Float32Array(3 * MOTION_COUNT);
    const radii = new Float32Array(MOTION_COUNT);
    const colors = new Float32Array(3 * MOTION_COUNT);
    const states = new Float32Array(MOTION_COUNT).fill(1);

    const baseColor = new THREE.Color("#1a1a19");

    for (let i = 0; i < MOTION_COUNT; i++) {
      offsets[3 * i + 0] = restPositions[3 * i + 0];
      offsets[3 * i + 1] = restPositions[3 * i + 1];
      offsets[3 * i + 2] = restPositions[3 * i + 2];
      radii[i] = nodeRadii[i];
      colors[3 * i + 0] = baseColor.r;
      colors[3 * i + 1] = baseColor.g;
      colors[3 * i + 2] = baseColor.b;
    }

    const oAttr = new THREE.InstancedBufferAttribute(offsets, 3);
    const rAttr = new THREE.InstancedBufferAttribute(radii, 1);
    const cAttr = new THREE.InstancedBufferAttribute(colors, 3);
    const sAttr = new THREE.InstancedBufferAttribute(states, 1);

    oAttr.setUsage(THREE.DynamicDrawUsage);
    rAttr.setUsage(THREE.DynamicDrawUsage);
    sAttr.setUsage(THREE.DynamicDrawUsage);

    return { offsetAttr: oAttr, radiusAttr: rAttr, colorAttr: cAttr, stateAttr: sAttr };
  }, []);

  const {
    curvedLineGeom,
    particleGeom,
    validEdges,
    currentEdgeOpacities,
    edgeCurveOffsets,
    particleStates,
  } = useMemo(() => {
    const valid = edges.filter(
      (e) => nodeBySlug.get(e.source)?.layout && nodeBySlug.get(e.target)?.layout
    );

    const totalLineVertices = valid.length * SEGS_PER_CURVE * 2;
    const posArr = new Float32Array(totalLineVertices * 3);
    const opArr = new Float32Array(totalLineVertices).fill(0);
    const opacities = new Float32Array(valid.length).fill(0);
    const offsets: [number, number, number][] = [];

    valid.forEach((e, idx) => {
      const sNode = nodeBySlug.get(e.source)!;
      const tNode = nodeBySlug.get(e.target)!;
      const sPos = sNode.layout!;
      const tPos = tNode.layout!;

      const dx = tPos[0] - sPos[0];
      const dy = tPos[1] - sPos[1];
      const dz = tPos[2] - sPos[2];
      const dist = Math.hypot(dx, dy, dz) || 1;

      const normX = -dy / dist;
      const normY = dx / dist;
      const normZ = (dz / dist) * 0.4;
      const curveHeight = dist * (0.16 + 0.08 * prng(idx + 5.5));

      offsets.push([normX * curveHeight, normY * curveHeight, normZ * curveHeight]);
    });

    const lGeom = new THREE.BufferGeometry();
    const lPosAttr = new THREE.BufferAttribute(posArr, 3);
    const lOpAttr = new THREE.BufferAttribute(opArr, 1);
    lPosAttr.setUsage(THREE.DynamicDrawUsage);
    lOpAttr.setUsage(THREE.DynamicDrawUsage);
    lGeom.setAttribute("position", lPosAttr);
    lGeom.setAttribute("aOpacity", lOpAttr);

    const pPosArr = new Float32Array(MAX_PARTICLES * 3);
    const pOpArr = new Float32Array(MAX_PARTICLES).fill(0);
    const pSizeArr = new Float32Array(MAX_PARTICLES).fill(2.8);

    const pStates = Array.from({ length: MAX_PARTICLES }, () => ({
      edgeIdx: 0,
      t: Math.random(),
      speed: 0.12 + 0.15 * Math.random(),
      active: false,
    }));

    const pGeom = new THREE.BufferGeometry();
    const pPosAttr = new THREE.BufferAttribute(pPosArr, 3);
    const pOpAttr = new THREE.BufferAttribute(pOpArr, 1);
    const pSizeAttr = new THREE.BufferAttribute(pSizeArr, 1);
    pPosAttr.setUsage(THREE.DynamicDrawUsage);
    pOpAttr.setUsage(THREE.DynamicDrawUsage);

    pGeom.setAttribute("position", pPosAttr);
    pGeom.setAttribute("aOpacity", pOpAttr);
    pGeom.setAttribute("aSize", pSizeAttr);

    return {
      curvedLineGeom: lGeom,
      particleGeom: pGeom,
      validEdges: valid,
      currentEdgeOpacities: opacities,
      edgeCurveOffsets: offsets,
      particleStates: pStates,
    };
  }, []);

  useEffect(() => {
    if (!nodeMeshRef.current) return;
    const mesh = nodeMeshRef.current;
    const dummy = new THREE.Matrix4();
    for (let i = 0; i < MOTION_COUNT; i++) mesh.setMatrixAt(i, dummy);
    mesh.instanceMatrix.needsUpdate = true;

    mesh.geometry.setAttribute("aOffset", offsetAttr);
    mesh.geometry.setAttribute("aRadius", radiusAttr);
    mesh.geometry.setAttribute("aColor", colorAttr);
    mesh.geometry.setAttribute("aState", stateAttr);

    offsetAttrRef.current = offsetAttr;
    radiusAttrRef.current = radiusAttr;
    stateAttrRef.current = stateAttr;
  }, [offsetAttr, radiusAttr, colorAttr, stateAttr]);

  useEffect(() => {
    edgeLinePosAttrRef.current = curvedLineGeom.getAttribute("position") as THREE.BufferAttribute;
    edgeLineOpAttrRef.current = curvedLineGeom.getAttribute("aOpacity") as THREE.BufferAttribute;
    particlePosAttrRef.current = particleGeom.getAttribute("position") as THREE.BufferAttribute;
    particleOpAttrRef.current = particleGeom.getAttribute("aOpacity") as THREE.BufferAttribute;
  }, [curvedLineGeom, particleGeom]);

  useFrame((state, delta) => {
    const boot = useBoot.getState();
    if (!boot.ready) boot.setReady();

    const time = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const lerpRate = 1 - Math.exp(-dt / 0.18);

    const activeSlug = focusedSlug ?? hoveredSlug;
    const activeMi = activeSlug ? slugToMotionIndex.get(activeSlug) ?? -1 : -1;
    const neighbors = activeMi >= 0 ? neighborIndexSets[activeMi] : null;

    const fX = activeMi >= 0 ? restPositions[3 * activeMi + 0] : 0;
    const fY = activeMi >= 0 ? restPositions[3 * activeMi + 1] : 0;
    const fZ = activeMi >= 0 ? restPositions[3 * activeMi + 2] : 0;

    const offsetArr = offsetAttrRef.current?.array as Float32Array | undefined;
    const radiusArr = radiusAttrRef.current?.array as Float32Array | undefined;
    const stateArr = stateAttrRef.current?.array as Float32Array | undefined;

    for (let i = 0; i < MOTION_COUNT; i++) {
      const rx = restPositions[3 * i + 0];
      const ry = restPositions[3 * i + 1];
      const rz = restPositions[3 * i + 2];

      let targetVis = currentVisibilities[i];
      targetVis += (matchTarget[i] - targetVis) * lerpRate;
      currentVisibilities[i] = targetVis;

      const wobX =
        wobbleAmplitudes[3 * i + 0] *
        Math.sin(time * wobbleFrequencies[3 * i + 0] + phaseOffsets[3 * i + 0]);
      const wobY =
        wobbleAmplitudes[3 * i + 1] *
        Math.sin(time * wobbleFrequencies[3 * i + 1] + phaseOffsets[3 * i + 1]);
      const wobZ =
        wobbleAmplitudes[3 * i + 2] *
        Math.sin(time * wobbleFrequencies[3 * i + 2] + phaseOffsets[3 * i + 2]);

      let targetOffsetX = 0, targetOffsetY = 0, targetOffsetZ = 0;
      if (repackState.active) {
        targetOffsetX = repackOffset[3 * i + 0];
        targetOffsetY = repackOffset[3 * i + 1];
        targetOffsetZ = repackOffset[3 * i + 2];
      } else if (neighbors?.has(i)) {
        const pull = neighborPull[i];
        targetOffsetX = (fX - rx) * pull + spatialJitter[3 * i + 0];
        targetOffsetY = (fY - ry) * pull + spatialJitter[3 * i + 1];
        targetOffsetZ = (fZ - rz) * pull + spatialJitter[3 * i + 2];
      }

      const k = springK[i];
      let aX = acc[3 * i + 0];
      let aY = acc[3 * i + 1];
      let aZ = acc[3 * i + 2];
      let vX = vel[3 * i + 0];
      let vY = vel[3 * i + 1];
      let vZ = vel[3 * i + 2];

      aX += ((targetOffsetX - vX) * k - 18 * aX) * dt;
      aY += ((targetOffsetY - vY) * k - 18 * aY) * dt;
      aZ += ((targetOffsetZ - vZ) * k - 18 * aZ) * dt;
      vX += aX * dt;
      vY += aY * dt;
      vZ += aZ * dt;

      vel[3 * i + 0] = vX; vel[3 * i + 1] = vY; vel[3 * i + 2] = vZ;
      acc[3 * i + 0] = aX; acc[3 * i + 1] = aY; acc[3 * i + 2] = aZ;

      const wx = rx + wobX + vX;
      const wy = ry + wobY + vY;
      const wz = rz + wobZ + vZ;

      currentWorldPositions[3 * i + 0] = wx;
      currentWorldPositions[3 * i + 1] = wy;
      currentWorldPositions[3 * i + 2] = wz;

      if (offsetArr) {
        offsetArr[3 * i + 0] = wx;
        offsetArr[3 * i + 1] = wy;
        offsetArr[3 * i + 2] = wz;
      }
      if (radiusArr) {
        radiusArr[i] = nodeRadii[i] * targetVis;
      }

      if (stateArr) {
        if (focusedSlug) {
          const focusedMi = slugToMotionIndex.get(focusedSlug) ?? -1;
          const focusedNeighbors = focusedMi >= 0 ? neighborIndexSets[focusedMi] : null;
          stateArr[i] = (i === focusedMi) ? 2.0 : (focusedNeighbors?.has(i) ? 1.3 : 0.2);
        } else if (hoveredSlug) {
          const hoveredMi = slugToMotionIndex.get(hoveredSlug) ?? -1;
          stateArr[i] = (i === hoveredMi) ? 1.8 : 1.0;
        } else {
          stateArr[i] = 1.0;
        }
      }

      // Hide and scale label cleanly when node is filtered out by search
      const labelGrp = labelGroupRefs.current[i];
      if (labelGrp) {
        labelGrp.position.set(wx, wy + labelOffsets[i], wz);
        labelGrp.visible = targetVis > 0.08;
        labelGrp.scale.setScalar(Math.max(0.001, targetVis));
      }
    }

    if (offsetAttrRef.current) offsetAttrRef.current.needsUpdate = true;
    if (radiusAttrRef.current) radiusAttrRef.current.needsUpdate = true;
    if (stateAttrRef.current) stateAttrRef.current.needsUpdate = true;

    // Curved Lines: Only render between nodes that are BOTH VISIBLE
    const edgePosAttr = edgeLinePosAttrRef.current;
    const edgeOpAttr = edgeLineOpAttrRef.current;
    const pPosAttr = particlePosAttrRef.current;
    const pOpAttr = particleOpAttrRef.current;

    const activeEdgeIndices: number[] = [];

    if (edgePosAttr && edgeOpAttr) {
      const posArr = edgePosAttr.array as Float32Array;
      const opArr = edgeOpAttr.array as Float32Array;
      const opSpeed = 1 - Math.exp(-dt / 0.12);

      let vOffset = 0;
      validEdges.forEach((e, idx) => {
        const sMi = slugToMotionIndex.get(e.source) ?? 0;
        const tMi = slugToMotionIndex.get(e.target) ?? 0;

        const sVis = currentVisibilities[sMi];
        const tVis = currentVisibilities[tMi];
        const bothVisible = sVis > 0.3 && tVis > 0.3;

        const isConnected = Boolean(
          bothVisible && activeSlug && (e.source === activeSlug || e.target === activeSlug)
        );

        if (isConnected) activeEdgeIndices.push(idx);

        const targetOp = isConnected ? 0.65 * Math.min(sVis, tVis) : 0.0;
        currentEdgeOpacities[idx] += (targetOp - currentEdgeOpacities[idx]) * opSpeed;
        const edgeOp = currentEdgeOpacities[idx];

        const sX = currentWorldPositions[3 * sMi + 0];
        const sY = currentWorldPositions[3 * sMi + 1];
        const sZ = currentWorldPositions[3 * sMi + 2];

        const tX = currentWorldPositions[3 * tMi + 0];
        const tY = currentWorldPositions[3 * tMi + 1];
        const tZ = currentWorldPositions[3 * tMi + 2];

        const [cOffX, cOffY, cOffZ] = edgeCurveOffsets[idx];
        const cX = (sX + tX) * 0.5 + cOffX;
        const cY = (sY + tY) * 0.5 + cOffY;
        const cZ = (sZ + tZ) * 0.5 + cOffZ;

        for (let s = 0; s < SEGS_PER_CURVE; s++) {
          const u0 = s / SEGS_PER_CURVE;
          const u1 = (s + 1) / SEGS_PER_CURVE;

          const mu0 = 1 - u0;
          const p0x = mu0 * mu0 * sX + 2 * mu0 * u0 * cX + u0 * u0 * tX;
          const p0y = mu0 * mu0 * sY + 2 * mu0 * u0 * cY + u0 * u0 * tY;
          const p0z = mu0 * mu0 * sZ + 2 * mu0 * u0 * cZ + u0 * u0 * tZ;

          const mu1 = 1 - u1;
          const p1x = mu1 * mu1 * sX + 2 * mu1 * u1 * cX + u1 * u1 * tX;
          const p1y = mu1 * mu1 * sY + 2 * mu1 * u1 * cY + u1 * u1 * tY;
          const p1z = mu1 * mu1 * sZ + 2 * mu1 * u1 * cZ + u1 * u1 * tZ;

          const baseIdx = vOffset * 3;
          posArr[baseIdx + 0] = p0x;
          posArr[baseIdx + 1] = p0y;
          posArr[baseIdx + 2] = p0z;

          posArr[baseIdx + 3] = p1x;
          posArr[baseIdx + 4] = p1y;
          posArr[baseIdx + 5] = p1z;

          opArr[vOffset + 0] = edgeOp;
          opArr[vOffset + 1] = edgeOp;

          vOffset += 2;
        }
      });

      edgePosAttr.needsUpdate = true;
      edgeOpAttr.needsUpdate = true;
    }

    // Flowing Particles (Only on active edges between visible nodes)
    if (pPosAttr && pOpAttr) {
      const pPosArr = pPosAttr.array as Float32Array;
      const pOpArr = pOpAttr.array as Float32Array;
      const numActiveEdges = activeEdgeIndices.length;

      for (let p = 0; p < MAX_PARTICLES; p++) {
        const pState = particleStates[p];
        if (numActiveEdges > 0) {
          const targetEdge = activeEdgeIndices[p % numActiveEdges];
          pState.edgeIdx = targetEdge;
          pState.t = (pState.t + pState.speed * dt) % 1;
          pState.active = true;

          const e = validEdges[targetEdge];
          const sMi = slugToMotionIndex.get(e.source) ?? 0;
          const tMi = slugToMotionIndex.get(e.target) ?? 0;

          const sX = currentWorldPositions[3 * sMi + 0];
          const sY = currentWorldPositions[3 * sMi + 1];
          const sZ = currentWorldPositions[3 * sMi + 2];
          const tX = currentWorldPositions[3 * tMi + 0];
          const tY = currentWorldPositions[3 * tMi + 1];
          const tZ = currentWorldPositions[3 * tMi + 2];

          const [cOffX, cOffY, cOffZ] = edgeCurveOffsets[targetEdge];
          const cX = (sX + tX) * 0.5 + cOffX;
          const cY = (sY + tY) * 0.5 + cOffY;
          const cZ = (sZ + tZ) * 0.5 + cOffZ;

          const u = pState.t;
          const mu = 1 - u;
          pPosArr[3 * p + 0] = mu * mu * sX + 2 * mu * u * cX + u * u * tX;
          pPosArr[3 * p + 1] = mu * mu * sY + 2 * mu * u * cY + u * u * tY;
          pPosArr[3 * p + 2] = mu * mu * sZ + 2 * mu * u * cZ + u * u * tZ;

          pOpArr[p] = Math.sin(u * Math.PI) * currentEdgeOpacities[targetEdge] * 1.3;
        } else {
          pOpArr[p] = 0;
        }
      }

      pPosAttr.needsUpdate = true;
      pOpAttr.needsUpdate = true;
    }

    if (controlsRef.current && !focusedSlug && !hoveredSlug && !searchActive) {
      controlsRef.current.azimuthAngle += 0.001;
    }
  });

  // Pointer Selection
  useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pVec = new THREE.Vector3();
    const sphere = new THREE.Sphere();
    let downPos = { x: 0, y: 0 };

    const getIntersectedSlug = (clientX: number, clientY: number) => {
      const rect = dom.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      let closestSlug: string | null = null;
      let minCamDist = Infinity;

      for (let i = 0; i < MOTION_COUNT; i++) {
        if (currentVisibilities[i] < 0.2) continue;
        pVec.set(
          currentWorldPositions[3 * i + 0],
          currentWorldPositions[3 * i + 1],
          currentWorldPositions[3 * i + 2]
        );

        const r = Math.max(nodeRadii[i] * 1.8, 6.5);
        sphere.set(pVec, r);

        if (raycaster.ray.intersectsSphere(sphere)) {
          const distToCam = raycaster.ray.origin.distanceTo(pVec);
          if (distToCam < minCamDist) {
            minCamDist = distToCam;
            closestSlug = layoutNodes[i].slug;
          }
        }
      }
      return closestSlug;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const hit = getIntersectedSlug(e.clientX, e.clientY);
      dom.style.cursor = hit ? "pointer" : "auto";
      setHovered(hit);
    };

    const handlePointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;
      const hit = getIntersectedSlug(e.clientX, e.clientY);
      if (hit) {
        playTapSound();
        focusNode(hit);
      }
    };

    dom.addEventListener("pointermove", handlePointerMove);
    dom.addEventListener("pointerdown", handlePointerDown);
    dom.addEventListener("pointerup", handlePointerUp);

    return () => {
      dom.removeEventListener("pointermove", handlePointerMove);
      dom.removeEventListener("pointerdown", handlePointerDown);
      dom.removeEventListener("pointerup", handlePointerUp);
    };
  }, [camera, gl, setHovered, focusNode]);

  // Camera Framing & Overview Reset
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const isMobile = size.width < 768;

    if (focusedSlug) {
      const mi = slugToMotionIndex.get(focusedSlug);
      const node = nodeBySlug.get(focusedSlug);
      if (mi !== undefined && node?.layout) {
        const [nx, ny, nz] = node.layout;
        const radius = nodeRadii[mi];

        let dist = Math.min(1100, (220 + 8.5 * radius) * (isMobile ? 1.05 : 1.0));
        dist *= 1 - 0.28 * (1 - Math.min(1, Math.hypot(nx, ny, nz) / 210));

        const dir = new THREE.Vector3(nx, ny, nz);
        if (dir.lengthSq() < 1) dir.set(0.3, 0.4, 1.0);
        dir.normalize().multiplyScalar(dist);

        const screenOffsetX = isMobile ? 0 : 25;
        controls.setLookAt(
          nx + dir.x + screenOffsetX,
          ny + dir.y,
          nz + dir.z,
          nx + screenOffsetX,
          ny,
          nz,
          true
        );
      }
    } else if (repackState.active && repackState.fitRadius > 0) {
      const r = Math.max(repackState.fitRadius * 2.6, 140);
      controls.setLookAt(r * 0.6, r * 0.4, r * 0.7, 0, 0, 0, true);
    } else {
      const overviewDist = calcOverviewDistance(size.width, size.height) * (isMobile ? 0.52 : 0.85);
      controls.setLookAt(
        defaultCameraDir.x * overviewDist,
        defaultCameraDir.y * overviewDist,
        defaultCameraDir.z * overviewDist,
        0,
        0,
        0,
        true
      );
    }
  }, [focusedSlug, repackState.tick, size.width, size.height]);

  return (
    <>
      <color attach="background" args={[BG]} />

      <CameraControls ref={controlsRef} makeDefault smoothTime={0.32} />

      {/* Billboard Node Discs */}
      <instancedMesh
        ref={nodeMeshRef}
        args={[planeGeom, undefined, MOTION_COUNT]}
        frustumCulled={false}
        renderOrder={3}
      >
        <shaderMaterial
          uniforms={{
            uAccent: { value: new THREE.Color(ACCENT) },
            uPaper: { value: new THREE.Color(BG) },
            uInk: { value: new THREE.Color(INK) },
          }}
          vertexShader={NodeShader.vertexShader}
          fragmentShader={NodeShader.fragmentShader}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Selection Focus Ring */}
      <FocusRing currentWorldPositions={currentWorldPositions} />

      {/* Curved Connection Lines */}
      <lineSegments geometry={curvedLineGeom} frustumCulled={false} renderOrder={1}>
        <shaderMaterial
          uniforms={{
            uLineColor: { value: new THREE.Color("#1a1a19") },
          }}
          vertexShader={CurvedEdgeShader.vertexShader}
          fragmentShader={CurvedEdgeShader.fragmentShader}
          transparent={true}
          depthWrite={false}
          depthTest={true}
        />
      </lineSegments>

      {/* Flowing Particles */}
      <points geometry={particleGeom} frustumCulled={false} renderOrder={2}>
        <shaderMaterial
          uniforms={{
            uColor: { value: new THREE.Color("#1a1a19") },
          }}
          vertexShader={ParticleShader.vertexShader}
          fragmentShader={ParticleShader.fragmentShader}
          transparent={true}
          depthWrite={false}
          depthTest={true}
        />
      </points>

      {/* Billboard Labels */}
      <Suspense fallback={null}>
        {layoutNodes.map((node, i) => (
          <Billboard
            key={node.slug}
            ref={(el) => {
              labelGroupRefs.current[i] = el;
            }}
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <Text
              fontSize={1.8 + (nodeRadii[i] / 8.7) * 1.6}
              color={INK}
              anchorX="center"
              anchorY="bottom"
              fillOpacity={0.88}
              outlineColor={BG}
              outlineWidth="8%"
              renderOrder={10}
            >
              {node.title.toUpperCase()}
            </Text>
          </Billboard>
        ))}
      </Suspense>

      {/* Postprocessing Grain Overlay */}
      <EffectComposer multisampling={4}>
        <DuotoneEffect />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.16} />
      </EffectComposer>
    </>
  );
};