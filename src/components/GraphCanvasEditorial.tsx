/**
 * 3D Force-Directed Knowledge Graph WebGL Canvas - Editorial Paper & Matte Charcoal Aesthetic
 * Features:
 * 1. Matte Non-Glossy Nodes (Flat Ink & Paper finish)
 * 2. Buttery Smooth Hover & Selection Interpolation
 * 3. Spherical Invisible Ball Containment & Scattering
 * 4. Ambient Slow Idle Rotation when no node is selected
 */

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GraphStore } from '../store/GraphStore';
import { calculateNodeRadius, evaluateBezier3D, PALETTE } from '../types/graph';

interface GraphCanvasEditorialProps {
  store: GraphStore;
  selectedSlug: string | null;
  hoveredSlug: string | null;
  onSelectNode: (slug: string | null) => void;
  onHoverNode: (slug: string | null) => void;
  sectionColorOn: boolean;
}

interface NodeVisualState {
  scale: number;
  opacity: number;
  color: THREE.Color;
  labelOpacity: number;
  haloOpacity: number;
}

interface EdgeVisualState {
  opacity: number;
  particleOpacity: number;
  color: THREE.Color;
}

export const GraphCanvasEditorial: React.FC<GraphCanvasEditorialProps> = ({
  store,
  selectedSlug,
  hoveredSlug,
  onSelectNode,
  onHoverNode,
  sectionColorOn,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js Core
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Camera Orbit & Pan State
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const isInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef<number | null>(null);

  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number; target: THREE.Vector3 }>({
    radius: 340,
    theta: 0.2,
    phi: Math.PI / 2.2,
    target: new THREE.Vector3(0, 0, 0),
  });

  const targetCameraSphericalRef = useRef<{ radius: number; theta: number; phi: number; target: THREE.Vector3 }>({
    radius: 340,
    theta: 0.2,
    phi: Math.PI / 2.2,
    target: new THREE.Vector3(0, 0, 0),
  });

  // Scene Object References
  const nodeMeshesRef = useRef<THREE.Mesh[]>([]);
  const nodeHalosRef = useRef<THREE.Mesh[]>([]);
  const edgeLinesRef = useRef<THREE.Line[]>([]);
  const edgeParticlesRef = useRef<THREE.Points[]>([]);
  const labelSpritesRef = useRef<THREE.Sprite[]>([]);

  // Smooth Per-Frame Visual State Buffers
  const nodeVisualStatesRef = useRef<NodeVisualState[]>([]);
  const edgeVisualStatesRef = useRef<EdgeVisualState[]>([]);

  // Dragging Node
  const draggedNodeIndexRef = useRef<number | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());

  // Texture generator for clean uppercase typography billboard labels
  const createLabelTexture = (text: string, color = '#1a1a19') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 512;
    canvas.height = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 32px "Space Grotesk", "SF Pro Display", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '2px';

    // Charcoal label with subtle light shadow for legibility over lines
    ctx.shadowColor = 'rgba(242, 242, 240, 0.95)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  // Section Color Palette definition
  const SECTION_PAPERS = PALETTE.SECTION_PAPERS;

  const getNodeTargetColor = useCallback(
    (sectionIdx: number, isSelected: boolean, isNeighbor: boolean, isDimmed: boolean) => {
      const baseHex = SECTION_PAPERS[sectionIdx % SECTION_PAPERS.length] || '#1a1a19';
      const baseColor = new THREE.Color(baseHex);

      if (sectionColorOn) {
        if (isSelected) return baseColor.clone().offsetHSL(0, 0.1, -0.05);
        if (isNeighbor) return baseColor.clone();
        if (isDimmed) return baseColor.clone().lerp(new THREE.Color('#dcdcd8'), 0.75);
        return baseColor;
      }

      if (isSelected) return new THREE.Color('#050505');
      if (isNeighbor) return new THREE.Color('#222222');
      if (isDimmed) return new THREE.Color('#d2d2cd');
      return new THREE.Color('#2e2e2c');
    },
    [sectionColorOn, SECTION_PAPERS]
  );

  // Build Scene Objects
  const buildScene = useCallback(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear old children
    while (scene.children.length > 0) {
      const obj = scene.children[0];
      scene.remove(obj);
    }

    nodeMeshesRef.current = [];
    nodeHalosRef.current = [];
    edgeLinesRef.current = [];
    edgeParticlesRef.current = [];
    labelSpritesRef.current = [];
    nodeVisualStatesRef.current = [];
    edgeVisualStatesRef.current = [];

    // Ambient Soft Illumination (Matte paper look)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const sphereGeom = new THREE.SphereGeometry(1, 32, 32);
    const haloGeom = new THREE.RingGeometry(1.25, 1.45, 32);

    // 1. Build Nodes with Pure Matte Non-Glossy Material (Strictly Opacity = 1.0)
    for (let i = 0; i < store.nodes.length; i++) {
      const node = store.nodes[i];
      const radius = calculateNodeRadius(node.inDegree, store.maxInDegree);
      const targetColor = getNodeTargetColor(node.section, node.slug === selectedSlug, false, false);

      // Matte Non-Glossy Material with 1.0 Opacity
      const mat = new THREE.MeshBasicMaterial({
        color: targetColor.clone(),
        transparent: false,
        opacity: 1.0,
      });

      const mesh = new THREE.Mesh(sphereGeom, mat);
      mesh.scale.set(radius, radius, radius);
      mesh.userData = { index: i, slug: node.slug, baseRadius: radius, title: node.title };
      scene.add(mesh);
      nodeMeshesRef.current.push(mesh);

      // Focus Halo Ring (for selected/hovered node)
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x050505,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
      });
      const halo = new THREE.Mesh(haloGeom, haloMat);
      halo.scale.set(radius * 1.5, radius * 1.5, 1);
      scene.add(halo);
      nodeHalosRef.current.push(halo);

      // Uppercase Label Sprite
      const texture = createLabelTexture(node.title);
      if (texture) {
        const spriteMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0.85,
          depthTest: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(radius * 5.2, radius * 1.05, 1);
        scene.add(sprite);
        labelSpritesRef.current.push(sprite);
      }

      // Initialize smooth visual state (Opacity ALWAYS 1.0)
      nodeVisualStatesRef.current.push({
        scale: radius,
        opacity: 1.0,
        color: targetColor.clone(),
        labelOpacity: node.inDegree > 25 ? 0.85 : 0.45,
        haloOpacity: 0.0,
      });
    }

    // 2. Build 3D Bézier Curved Edges & Dotted Stippling Particles
    const segments = 24;
    for (let e = 0; e < store.edges.length; e++) {
      const edge = store.edges[e];

      const lineGeom = new THREE.BufferGeometry();
      const linePositions = new Float32Array((segments + 1) * 3);
      lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: 0x1a1a19,
        transparent: true,
        opacity: 0.0,
        linewidth: 1,
        depthWrite: false,
      });

      const line = new THREE.Line(lineGeom, lineMat);
      line.userData = { edgeIndex: e, source: edge.source, target: edge.target };
      line.visible = false;
      scene.add(line);
      edgeLinesRef.current.push(line);

      // Discrete stippled dots along the curve
      const dotCount = 6;
      const dotGeom = new THREE.BufferGeometry();
      const dotPositions = new Float32Array(dotCount * 3);
      dotGeom.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));

      const dotMat = new THREE.PointsMaterial({
        color: 0x1a1a19,
        size: 2.2,
        transparent: true,
        opacity: 0.0,
        sizeAttenuation: true,
        depthWrite: false,
      });

      const points = new THREE.Points(dotGeom, dotMat);
      points.visible = false;
      scene.add(points);
      edgeParticlesRef.current.push(points);

      edgeVisualStatesRef.current.push({
        opacity: 0.0,
        particleOpacity: 0.0,
        color: new THREE.Color(0x1a1a19),
      });
    }
  }, [store, getNodeTargetColor, selectedSlug]);

  // Initial Setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f2f0);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 3000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    buildScene();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [buildScene]);

  // Re-build on store/color changes
  useEffect(() => {
    buildScene();
  }, [store.nodes, store.edges, sectionColorOn, buildScene]);

  // Fit camera smoothly when node/repack changes
  useEffect(() => {
    if (store.fitRadius > 0 && cameraRef.current) {
      const radius = Math.max(store.fitRadius * 2.3, 120);
      targetCameraSphericalRef.current.radius = radius;
      targetCameraSphericalRef.current.target.set(0, 0, 0);
    }
  }, [store.fitRadius]);

  // Animation & Rendering Loop with Slow Idle Ambient Rotation and Spherical Boundary
  useEffect(() => {
    const SPHERE_RADIUS = 135; // Invisible spherical containment radius

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // 1. Slow Ambient Rotation when no node is selected and not actively interacting
      const isIdle = !selectedSlug && !isDraggingRef.current && !isRightDraggingRef.current && !isInteractingRef.current;
      if (isIdle) {
        targetCameraSphericalRef.current.theta += 0.0012; // Slow graceful rotation
      }

      // Camera Orbit Lerping
      const curr = cameraSphericalRef.current;
      const target = targetCameraSphericalRef.current;
      curr.radius += (target.radius - curr.radius) * 0.08;
      curr.theta += (target.theta - curr.theta) * 0.08;
      curr.phi += (target.phi - curr.phi) * 0.08;
      curr.target.lerp(target.target, 0.08);

      if (cameraRef.current) {
        const x = curr.target.x + curr.radius * Math.sin(curr.phi) * Math.sin(curr.theta);
        const y = curr.target.y + curr.radius * Math.cos(curr.phi);
        const z = curr.target.z + curr.radius * Math.sin(curr.phi) * Math.cos(curr.theta);

        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(curr.target);
      }

      const activeSlug = selectedSlug || hoveredSlug;
      const neighborSlugs = activeSlug ? store.neighborsOf(activeSlug) : new Set<string>();

      // 1. Calculate Dynamic Camera Distances for all Nodes (for dynamic depth dimming and title cutoff)
      const n = store.nodes.length;
      const camPos = cameraRef.current ? cameraRef.current.position : new THREE.Vector3(0, 0, 340);
      const nodeDists = new Float32Array(n);
      let minDist = Infinity;
      let maxDist = -Infinity;

      for (let i = 0; i < n; i++) {
        const cx = store.currentPositions[i * 3 + 0];
        const cy = store.currentPositions[i * 3 + 1];
        const cz = store.currentPositions[i * 3 + 2];
        const dist = Math.hypot(cx - camPos.x, cy - camPos.y, cz - camPos.z);
        nodeDists[i] = dist;
        if (dist < minDist) minDist = dist;
        if (dist > maxDist) maxDist = dist;
      }
      const distRange = Math.max(maxDist - minDist, 1e-4);

      // 2. Update Node Positions with Spherical Containment & Smoothed Visual States
      for (let i = 0; i < n; i++) {
        const node = store.nodes[i];
        const mesh = nodeMeshesRef.current[i];
        const halo = nodeHalosRef.current[i];
        const label = labelSpritesRef.current[i];
        const state = nodeVisualStatesRef.current[i];

        if (!mesh || !state) continue;

        let tx = store.restPositions[i * 3 + 0] + store.repackOffset[i * 3 + 0];
        let ty = store.restPositions[i * 3 + 1] + store.repackOffset[i * 3 + 1];
        let tz = store.restPositions[i * 3 + 2] + store.repackOffset[i * 3 + 2];

        // Soft Spherical Containment Constraint (Invisible Ball)
        const distFromCenter = Math.hypot(tx, ty, tz);
        if (distFromCenter > SPHERE_RADIUS) {
          const factor = SPHERE_RADIUS / distFromCenter;
          tx *= factor;
          ty *= factor;
          tz *= factor;
        }

        // Smooth Position Lerp
        store.currentPositions[i * 3 + 0] += (tx - store.currentPositions[i * 3 + 0]) * 0.12;
        store.currentPositions[i * 3 + 1] += (ty - store.currentPositions[i * 3 + 1]) * 0.12;
        store.currentPositions[i * 3 + 2] += (tz - store.currentPositions[i * 3 + 2]) * 0.12;

        const cx = store.currentPositions[i * 3 + 0];
        const cy = store.currentPositions[i * 3 + 1];
        const cz = store.currentPositions[i * 3 + 2];

        mesh.position.set(cx, cy, cz);

        if (halo && cameraRef.current) {
          halo.position.set(cx, cy, cz);
          halo.lookAt(cameraRef.current.position);
        }

        if (label) {
          label.position.set(cx, cy + mesh.userData.baseRadius + 4.5, cz);
        }

        // Normalized Depth: 0.0 = Closest Node (0%), 1.0 = Furthest Node (100%)
        const depthRatio = Math.max(0, Math.min(1, (nodeDists[i] - minDist) / distRange));

        const isHovered = node.slug === hoveredSlug;
        const isSelected = node.slug === selectedSlug;
        const isNeighbor = neighborSlugs.has(node.slug);

        const baseHex = SECTION_PAPERS[node.section % SECTION_PAPERS.length] || '#1a1a19';
        let targetColor = sectionColorOn ? new THREE.Color(baseHex) : new THREE.Color('#2e2e2c');

        let targetScale = mesh.userData.baseRadius;
        let targetHaloOpacity = 0.0;
        let targetLabelOpacity = 0.0;

        if (selectedSlug) {
          // --- CASE 1: A NODE IS CURRENTLY SELECTED ---
          if (isSelected) {
            targetScale = mesh.userData.baseRadius * 1.25;
            targetHaloOpacity = 0.85;
            targetLabelOpacity = 1.0;
            if (sectionColorOn) targetColor.offsetHSL(0, 0.1, -0.05);
            else targetColor = new THREE.Color('#050505');
          } else if (isNeighbor) {
            // Direct connected neighbors show their title
            targetScale = mesh.userData.baseRadius * 1.08;
            targetHaloOpacity = 0.0;
            targetLabelOpacity = 0.90;
            if (!sectionColorOn) targetColor = new THREE.Color('#222222');
          } else {
            // Unconnected nodes: hide title & apply dimming
            targetScale = mesh.userData.baseRadius * 0.86;
            targetHaloOpacity = 0.0;
            targetLabelOpacity = 0.0; // Hide title for nodes that do not have links
            targetColor.lerp(new THREE.Color('#dcdcd8'), 0.80);
          }
        } else {
          // --- CASE 2: NO NODE IS SELECTED ---
          // Dynamic distance-based dimming: the further from camera, the dimmer the node
          const depthDimFactor = 0.05 + depthRatio * 0.70;
          targetColor.lerp(new THREE.Color('#dcdcd8'), depthDimFactor);

          // Title visibility: show title only for 50% closer nodes (depthRatio <= 0.50)
          if (depthRatio <= 0.50) {
            const closeness = 1.0 - (depthRatio / 0.50);
            targetLabelOpacity = Math.max(0.40, closeness * 0.85);
          } else {
            targetLabelOpacity = 0.0; // Hide title for 50% further nodes
          }

          if (isHovered) {
            targetScale = mesh.userData.baseRadius * 1.25;
            targetHaloOpacity = 0.85;
            targetLabelOpacity = 1.0;
            targetColor = sectionColorOn ? new THREE.Color(baseHex) : new THREE.Color('#050505');
          } else if (hoveredSlug && isNeighbor) {
            targetScale = mesh.userData.baseRadius * 1.08;
            targetHaloOpacity = 0.0;
            targetLabelOpacity = 0.90;
            targetColor = sectionColorOn ? new THREE.Color(baseHex) : new THREE.Color('#222222');
          }
        }

        // Hover override: hovering on ANY node ALWAYS displays its title
        if (isHovered) {
          targetLabelOpacity = 1.0;
        }

        // 3. Buttery Smooth Visual State Interpolation (Lerp)
        state.scale += (targetScale - state.scale) * 0.12;
        state.opacity = 1.0; // Strictly 1.0 per requirement
        state.haloOpacity += (targetHaloOpacity - state.haloOpacity) * 0.12;
        state.labelOpacity += (targetLabelOpacity - state.labelOpacity) * 0.12;
        state.color.lerp(targetColor, 0.14);

        // Apply interpolated values to Three.js primitives
        mesh.scale.setScalar(state.scale);

        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.copy(state.color);
        mat.opacity = 1.0;

        if (halo) {
          const haloMat = halo.material as THREE.MeshBasicMaterial;
          haloMat.opacity = state.haloOpacity;
        }

        if (label) {
          const labelMat = label.material as THREE.SpriteMaterial;
          labelMat.opacity = state.labelOpacity;
        }
      }

      // 4. Update 3D Bézier Curved Lines & Dots with Smooth Transition
      const segments = 24;
      const dotCount = 6;
      for (let e = 0; e < store.edges.length; e++) {
        const line = edgeLinesRef.current[e];
        const points = edgeParticlesRef.current[e];
        const state = edgeVisualStatesRef.current[e];
        if (!line || !state) continue;

        const edge = store.edges[e];
        const sIdx = store.slugToIndex.get(edge.source);
        const tIdx = store.slugToIndex.get(edge.target);

        if (sIdx === undefined || tIdx === undefined) continue;

        const p0: [number, number, number] = [
          store.currentPositions[sIdx * 3 + 0],
          store.currentPositions[sIdx * 3 + 1],
          store.currentPositions[sIdx * 3 + 2],
        ];
        const p2: [number, number, number] = [
          store.currentPositions[tIdx * 3 + 0],
          store.currentPositions[tIdx * 3 + 1],
          store.currentPositions[tIdx * 3 + 2],
        ];

        const p1: [number, number, number] = [
          (p0[0] + p2[0]) * 0.5 + (edge.control ? edge.control[0] * 0.35 : 0),
          (p0[1] + p2[1]) * 0.5 + (edge.control ? edge.control[1] * 0.35 : 8),
          (p0[2] + p2[2]) * 0.5 + (edge.control ? edge.control[2] * 0.35 : 0),
        ];

        // Update line geometry points
        const linePosAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        const lineArray = linePosAttr.array as Float32Array;

        for (let seg = 0; seg <= segments; seg++) {
          const t = seg / segments;
          const [bx, by, bz] = evaluateBezier3D(p0, p1, p2, t);
          lineArray[seg * 3 + 0] = bx;
          lineArray[seg * 3 + 1] = by;
          lineArray[seg * 3 + 2] = bz;
        }
        linePosAttr.needsUpdate = true;

        // Update stippled dots
        if (points) {
          const dotPosAttr = points.geometry.attributes.position as THREE.BufferAttribute;
          const dotArray = dotPosAttr.array as Float32Array;
          for (let d = 0; d < dotCount; d++) {
            const t = (d + 1) / (dotCount + 1);
            const [bx, by, bz] = evaluateBezier3D(p0, p1, p2, t);
            dotArray[d * 3 + 0] = bx;
            dotArray[d * 3 + 1] = by;
            dotArray[d * 3 + 2] = bz;
          }
          dotPosAttr.needsUpdate = true;
        }

        // Highlight logic - Hide all lines when no node is selected/active
        const isConnected =
          activeSlug &&
          ((edge.source === activeSlug && (neighborSlugs.has(edge.target) || edge.target === activeSlug)) ||
            (edge.target === activeSlug && (neighborSlugs.has(edge.source) || edge.source === activeSlug)));

        let targetLineOpacity = 0.0;
        let targetDotOpacity = 0.0;
        let targetLineColor = new THREE.Color(0x1a1a19);

        if (isConnected) {
          targetLineOpacity = 0.85;
          targetDotOpacity = 0.9;
          targetLineColor = new THREE.Color(0x1a1a19);
        } else {
          targetLineOpacity = 0.0;
          targetDotOpacity = 0.0;
          targetLineColor = new THREE.Color(0x1a1a19);
        }

        // Lerp edge visual state smoothly
        state.opacity += (targetLineOpacity - state.opacity) * 0.15;
        state.particleOpacity += (targetDotOpacity - state.particleOpacity) * 0.15;
        state.color.lerp(targetLineColor, 0.15);

        const lineMat = line.material as THREE.LineBasicMaterial;
        lineMat.opacity = Math.max(0, state.opacity);
        lineMat.color.copy(state.color);
        line.visible = state.opacity > 0.01;

        if (points) {
          const dotMat = points.material as THREE.PointsMaterial;
          dotMat.opacity = Math.max(0, state.particleOpacity);
          dotMat.color.copy(state.color);
          points.visible = state.particleOpacity > 0.01;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [store, hoveredSlug, selectedSlug, getNodeTargetColor]);

  // Pointer Interaction
  const markInteraction = () => {
    isInteractingRef.current = true;
    if (interactionTimeoutRef.current) {
      window.clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = window.setTimeout(() => {
      isInteractingRef.current = false;
    }, 2500);
  };

  const getPointerNormalized = (e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    markInteraction();
    if (e.button === 0) {
      isDraggingRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      const p = getPointerNormalized(e);
      if (cameraRef.current && sceneRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(p.x, p.y), cameraRef.current);
        const intersects = raycaster.intersectObjects(nodeMeshesRef.current);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const idx = hit.userData.index as number;
          const slug = hit.userData.slug as string;
          draggedNodeIndexRef.current = idx;

          const camDir = new THREE.Vector3();
          cameraRef.current.getWorldDirection(camDir);
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(
            camDir.negate(),
            new THREE.Vector3(
              store.currentPositions[idx * 3 + 0],
              store.currentPositions[idx * 3 + 1],
              store.currentPositions[idx * 3 + 2]
            )
          );

          onSelectNode(slug);
        }
      }
    } else if (e.button === 2) {
      isRightDraggingRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - mousePosRef.current.x;
    const dy = e.clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    if (draggedNodeIndexRef.current !== null && cameraRef.current) {
      markInteraction();
      const p = getPointerNormalized(e);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(p.x, p.y), cameraRef.current);
      const hitPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(dragPlaneRef.current, hitPoint)) {
        const idx = draggedNodeIndexRef.current;
        store.repackOffset[idx * 3 + 0] = hitPoint.x - store.restPositions[idx * 3 + 0];
        store.repackOffset[idx * 3 + 1] = hitPoint.y - store.restPositions[idx * 3 + 1];
        store.repackOffset[idx * 3 + 2] = hitPoint.z - store.restPositions[idx * 3 + 2];
      }
      return;
    }

    if (isDraggingRef.current) {
      markInteraction();
      const sph = targetCameraSphericalRef.current;
      sph.theta -= dx * 0.006;
      sph.phi = Math.max(0.08, Math.min(Math.PI - 0.08, sph.phi - dy * 0.006));
      return;
    }

    if (isRightDraggingRef.current && cameraRef.current) {
      markInteraction();
      const cam = cameraRef.current;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      const factor = targetCameraSphericalRef.current.radius * 0.001;

      targetCameraSphericalRef.current.target.addScaledVector(right, -dx * factor);
      targetCameraSphericalRef.current.target.addScaledVector(up, dy * factor);
      return;
    }

    // Hover detection & pointer hand cursor
    const p = getPointerNormalized(e);
    if (cameraRef.current && sceneRef.current) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(p.x, p.y), cameraRef.current);
      const intersects = raycaster.intersectObjects(nodeMeshesRef.current);

      if (intersects.length > 0) {
        const slug = intersects[0].object.userData.slug as string;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'pointer';
        }
        onHoverNode(slug);
      } else {
        if (canvasRef.current) {
          canvasRef.current.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
        }
        onHoverNode(null);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
    draggedNodeIndexRef.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredSlug ? 'pointer' : 'grab';
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    markInteraction();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    const sph = targetCameraSphericalRef.current;
    sph.radius = Math.max(50, Math.min(1200, sph.radius * zoomFactor));
  };

  return (
    <div
      ref={containerRef}
      id="editorial-graph-viewport"
      className="relative w-full h-full select-none overflow-hidden bg-[#f2f2f0]"
      style={{
        backgroundImage: `radial-gradient(#d5d5cf 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        id="editorial-graph-canvas"
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};
