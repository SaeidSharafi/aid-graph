"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useJourney } from "../../store/useJourney";
import { nodeBySlug, nodeRadius, ACCENT } from "../../data/dictionary";
import { slugToMotionIndex } from "../../physics/motionData";

const ringVertexShader = `
  uniform vec3 uCenter;
  uniform float uSize;
  varying vec2 vUv;

  void main() {
    vUv = position.xy;
    vec4 cv = modelViewMatrix * vec4(uCenter, 1.0);
    cv.xy += position.xy * (uSize * 2.0);
    gl_Position = projectionMatrix * cv;
  }
`;

const ringFragmentShader = `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uRingR;
  uniform float uThick;
  varying vec2 vUv;

  void main() {
    float d = length(vUv) * 2.0;
    float band =
      smoothstep(uRingR - uThick, uRingR - uThick * 0.45, d) -
      smoothstep(uRingR + uThick * 0.45, uRingR + uThick, d);
    float a = clamp(band, 0.0, 1.0) * uOpacity;
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

interface FocusRingProps {
  currentWorldPositions: Float32Array;
}

export const FocusRing: React.FC<FocusRingProps> = ({ currentWorldPositions }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const prevSlug = useRef<string | null>(null);
  const targetRadius = useRef(4.0);
  const opacity = useRef(0);
  const animProgress = useRef(0);

  const geometry = useRef(new THREE.PlaneGeometry(1, 1)).current;

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const { hoveredSlug, focusedSlug } = useJourney.getState();
    const active = focusedSlug ?? hoveredSlug;

    if (active && active !== prevSlug.current) {
      prevSlug.current = active;
      animProgress.current = 0;
      const n = nodeBySlug.get(active);
      targetRadius.current = n ? nodeRadius(n.inDegree) : 4.0;
    }

    const targetOp = active ? 0.95 : 0.0;
    const lerpSpeed = targetOp > opacity.current ? 0.13 : 0.05;
    opacity.current += (targetOp - opacity.current) * (1 - Math.exp(-delta / lerpSpeed));

    if (opacity.current < 0.003 && !active) {
      mesh.visible = false;
      prevSlug.current = null;
      return;
    }

    mesh.visible = true;
    if (active) {
      animProgress.current += (1 - animProgress.current) * (1 - Math.pow(0.0009, delta));
    }

    const currentActiveSlug = prevSlug.current;
    const mi = currentActiveSlug ? slugToMotionIndex.get(currentActiveSlug) ?? -1 : -1;
    if (mi >= 0) {
      mat.uniforms.uCenter.value.set(
        currentWorldPositions[3 * mi + 0],
        currentWorldPositions[3 * mi + 1],
        currentWorldPositions[3 * mi + 2]
      );
    }

    const r = targetRadius.current;
    const ringGap = 1.1 * (0.5 + 0.35 * (1 - animProgress.current));
    const totalSize = r + ringGap + 0.17 + 1.2;

    mat.uniforms.uSize.value = totalSize;
    mat.uniforms.uRingR.value = (r + ringGap) / totalSize;
    mat.uniforms.uThick.value = 0.17 / totalSize;
    mat.uniforms.uOpacity.value = opacity.current * (0.35 + 0.65 * animProgress.current);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} frustumCulled={false} renderOrder={4} visible={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={{
          uCenter: { value: new THREE.Vector3() },
          uColor: { value: new THREE.Color(ACCENT) },
          uOpacity: { value: 0 },
          uRingR: { value: 0.8 },
          uThick: { value: 0.05 },
          uSize: { value: 10 },
        }}
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        transparent={true}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};