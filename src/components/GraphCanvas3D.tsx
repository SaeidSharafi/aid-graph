/**
 * 3D Force-Directed Knowledge Graph WebGL Canvas (Three.js)
 * Implements 3D Nodes, Quadratic Bézier Curved Edges, Octree Visualization, and Interaction
 */

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GraphStore } from '../store/GraphStore';
import { GraphNode, Section, calculateNodeRadius, evaluateBezier3D } from '../types/graph';
import { Octree3D, OctreeNode } from '../physics/Octree3D';

interface GraphCanvas3DProps {
  store: GraphStore;
  selectedSlug: string | null;
  hoveredSlug: string | null;
  onSelectNode: (slug: string | null) => void;
  onHoverNode: (slug: string | null) => void;
  showOctreeBounds: boolean;
  showBezierControlPoints: boolean;
  showClusterHalos: boolean;
  showLabels: boolean;
  curveResolution: number;
  pulseAnimation: boolean;
  isLiveSimulating: boolean;
  onLiveSimTick?: () => void;
}

export const GraphCanvas3D: React.FC<GraphCanvas3DProps> = ({
  store,
  selectedSlug,
  hoveredSlug,
  onSelectNode,
  onHoverNode,
  showOctreeBounds,
  showBezierControlPoints,
  showClusterHalos,
  showLabels,
  curveResolution,
  pulseAnimation,
  isLiveSimulating,
  onLiveSimTick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Interaction & Camera Controls State
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number; target: THREE.Vector3 }>({
    radius: 380,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    target: new THREE.Vector3(0, 0, 0),
  });

  // Target camera state for smooth lerping
  const targetCameraSphericalRef = useRef<{ radius: number; theta: number; phi: number; target: THREE.Vector3 }>({
    radius: 380,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    target: new THREE.Vector3(0, 0, 0),
  });

  // Scene Objects
  const nodeMeshesRef = useRef<THREE.Mesh[]>([]);
  const nodeGlowsRef = useRef<THREE.Mesh[]>([]);
  const edgeLinesRef = useRef<THREE.Line[]>([]);
  const edgeControlPointsRef = useRef<THREE.Points | null>(null);
  const octreeLinesRef = useRef<THREE.LineSegments | null>(null);
  const clusterHalosRef = useRef<THREE.Mesh[]>([]);
  const labelSpritesRef = useRef<THREE.Sprite[]>([]);

  // Dragging single node in 3D
  const draggedNodeIndexRef = useRef<number | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());

  // Helper for color lookup
  const getSectionColor = useCallback((sectionIdx: number) => {
    const sec = store.sections.find((s) => s.index === sectionIdx);
    return sec ? sec.color : '#818cf8';
  }, [store]);

  // Create Billboard Texture for Node Labels
  const createLabelTexture = (text: string, color: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 512;
    canvas.height = 128;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    
    // Rounded rect pill
    const x = 16, y = 16, w = canvas.width - 32, h = canvas.height - 32, r = 24;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  // Rebuild / Initialize Three.js Scene
  const buildScene = useCallback(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear old objects
    while (scene.children.length > 0) {
      const obj = scene.children[0];
      scene.remove(obj);
    }

    nodeMeshesRef.current = [];
    nodeGlowsRef.current = [];
    edgeLinesRef.current = [];
    clusterHalosRef.current = [];
    labelSpritesRef.current = [];

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(200, 300, 200);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 1.0);
    dirLight2.position.set(-200, -200, -200);
    scene.add(dirLight2);

    // Subtle 3D Grid helper at y = -120
    const grid = new THREE.GridHelper(600, 30, 0x334155, 0x1e293b);
    grid.position.y = -120;
    scene.add(grid);

    const sphereGeom = new THREE.SphereGeometry(1, 24, 24);
    const glowGeom = new THREE.SphereGeometry(1.3, 16, 16);

    // 1. Build Nodes
    for (let i = 0; i < store.nodes.length; i++) {
      const node = store.nodes[i];
      const radius = calculateNodeRadius(node.inDegree, store.maxInDegree);
      const colorHex = getSectionColor(node.section);

      // Core sphere
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: 1.0,
      });

      const mesh = new THREE.Mesh(sphereGeom, mat);
      mesh.scale.set(radius, radius, radius);
      mesh.userData = { index: i, slug: node.slug, baseRadius: radius };
      scene.add(mesh);
      nodeMeshesRef.current.push(mesh);

      // Outer Fresnel Aura
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.2,
        wireframe: true,
      });
      const glowMesh = new THREE.Mesh(glowGeom, glowMat);
      glowMesh.scale.set(radius * 1.35, radius * 1.35, radius * 1.35);
      scene.add(glowMesh);
      nodeGlowsRef.current.push(glowMesh);

      // Label Sprite
      const texture = createLabelTexture(node.title, colorHex);
      if (texture) {
        const spriteMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0.9,
          depthTest: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(radius * 4.5, radius * 1.15, 1);
        sprite.visible = showLabels;
        scene.add(sprite);
        labelSpritesRef.current.push(sprite);
      }
    }

    // 2. Build 3D Quadratic Bézier Curved Edges
    const edgeSegments = Math.max(12, curveResolution);
    for (let i = 0; i < store.edges.length; i++) {
      const edge = store.edges[i];
      const sIdx = store.slugToIndex.get(edge.source);
      const tIdx = store.slugToIndex.get(edge.target);

      const positions = new Float32Array((edgeSegments + 1) * 3);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const srcColor = sIdx !== undefined ? getSectionColor(store.nodes[sIdx].section) : '#6366f1';
      const edgeMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(srcColor),
        transparent: true,
        opacity: 0.45,
        linewidth: 1,
      });

      const line = new THREE.Line(geom, edgeMat);
      line.userData = { edgeIndex: i, source: edge.source, target: edge.target };
      scene.add(line);
      edgeLinesRef.current.push(line);
    }

    // 3. Cluster Halos
    for (const section of store.sections) {
      const haloGeom = new THREE.SphereGeometry(section.radius || 50, 24, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(section.color),
        transparent: true,
        opacity: 0.05,
        wireframe: true,
      });
      const haloMesh = new THREE.Mesh(haloGeom, haloMat);
      haloMesh.position.set(section.centroid[0], section.centroid[1], section.centroid[2]);
      haloMesh.visible = showClusterHalos;
      scene.add(haloMesh);
      clusterHalosRef.current.push(haloMesh);
    }
  }, [store, getSectionColor, curveResolution, showClusterHalos, showLabels]);

  // Initial Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
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

  // Re-build scene when dataset changes
  useEffect(() => {
    buildScene();
  }, [store.nodes, store.edges, buildScene]);

  // Update visibility toggles for cluster halos and labels
  useEffect(() => {
    for (const halo of clusterHalosRef.current) {
      halo.visible = showClusterHalos;
    }
    for (const label of labelSpritesRef.current) {
      label.visible = showLabels;
    }
  }, [showClusterHalos, showLabels]);

  // Smooth fit camera to bounding radius
  useEffect(() => {
    if (store.fitRadius > 0 && cameraRef.current) {
      const radius = Math.max(store.fitRadius * 2.8, 120);
      targetCameraSphericalRef.current.radius = radius;
      targetCameraSphericalRef.current.target.set(0, 0, 0);
    }
  }, [store.fitRadius]);

  // Update Octree Wireframe Box Visualizer
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (octreeLinesRef.current) {
      scene.remove(octreeLinesRef.current);
      octreeLinesRef.current.geometry.dispose();
      (octreeLinesRef.current.material as THREE.Material).dispose();
      octreeLinesRef.current = null;
    }

    if (showOctreeBounds && store.nodes.length > 0) {
      // Build octree from current simulated nodes
      const simNodes = store.nodes.map((n, i) => ({
        index: i,
        mi: i,
        slug: n.slug,
        x: store.currentPositions[i * 3 + 0],
        y: store.currentPositions[i * 3 + 1],
        z: store.currentPositions[i * 3 + 2],
        vx: 0,
        vy: 0,
        vz: 0,
        r: calculateNodeRadius(n.inDegree, store.maxInDegree),
        inDegree: n.inDegree,
        section: n.section,
      }));

      const octree = new Octree3D(simNodes);
      const boxEdges: number[] = [];

      octree.visit((node: OctreeNode) => {
        const { x0, y0, z0, x1, y1, z1 } = node;
        // 12 edges of AABB
        // Bottom square
        boxEdges.push(x0, y0, z0, x1, y0, z0);
        boxEdges.push(x1, y0, z0, x1, y0, z1);
        boxEdges.push(x1, y0, z1, x0, y0, z1);
        boxEdges.push(x0, y0, z1, x0, y0, z0);
        // Top square
        boxEdges.push(x0, y1, z0, x1, y1, z0);
        boxEdges.push(x1, y1, z0, x1, y1, z1);
        boxEdges.push(x1, y1, z1, x0, y1, z1);
        boxEdges.push(x0, y1, z1, x0, y1, z0);
        // Vertical pillars
        boxEdges.push(x0, y0, z0, x0, y1, z0);
        boxEdges.push(x1, y0, z0, x1, y1, z0);
        boxEdges.push(x1, y0, z1, x1, y1, z1);
        boxEdges.push(x0, y0, z1, x0, y1, z1);
      });

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(boxEdges, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.25,
      });

      const octreeLineSegs = new THREE.LineSegments(geom, mat);
      scene.add(octreeLineSegs);
      octreeLinesRef.current = octreeLineSegs;
    }
  }, [showOctreeBounds, store, store.nodes]);

  // Main Render & Animation Loop
  useEffect(() => {
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Camera Orbit Interpolation
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

      // Adjacency highlights
      const activeSlug = hoveredSlug || selectedSlug;
      const neighborSlugs = activeSlug ? store.neighborsOf(activeSlug) : new Set<string>();

      // Update Node Positions & Visuals
      const n = store.nodes.length;
      for (let i = 0; i < n; i++) {
        const node = store.nodes[i];
        const mesh = nodeMeshesRef.current[i];
        const glow = nodeGlowsRef.current[i];
        const label = labelSpritesRef.current[i];

        if (!mesh) continue;

        // Target target world coordinates: restPositions[i] + repackOffset[i]
        const tx = store.restPositions[i * 3 + 0] + store.repackOffset[i * 3 + 0];
        const ty = store.restPositions[i * 3 + 1] + store.repackOffset[i * 3 + 1];
        const tz = store.restPositions[i * 3 + 2] + store.repackOffset[i * 3 + 2];

        // Smooth position lerp
        store.currentPositions[i * 3 + 0] += (tx - store.currentPositions[i * 3 + 0]) * 0.12;
        store.currentPositions[i * 3 + 1] += (ty - store.currentPositions[i * 3 + 1]) * 0.12;
        store.currentPositions[i * 3 + 2] += (tz - store.currentPositions[i * 3 + 2]) * 0.12;

        const cx = store.currentPositions[i * 3 + 0];
        const cy = store.currentPositions[i * 3 + 1];
        const cz = store.currentPositions[i * 3 + 2];

        mesh.position.set(cx, cy, cz);
        if (glow) {
          glow.position.set(cx, cy, cz);
          if (pulseAnimation) {
            const scaleFactor = 1 + Math.sin(elapsedTime * 3 + i) * 0.08;
            glow.scale.set(
              mesh.userData.baseRadius * 1.35 * scaleFactor,
              mesh.userData.baseRadius * 1.35 * scaleFactor,
              mesh.userData.baseRadius * 1.35 * scaleFactor
            );
          }
        }

        if (label) {
          label.position.set(cx, cy + mesh.userData.baseRadius + 5, cz);
        }

        // Opacity and selection highlight logic
        const matchVal = store.matchTarget[i];
        const isSelf = node.slug === activeSlug;
        const isNeighbor = neighborSlugs.has(node.slug);
        const isDimmed = activeSlug ? (!isSelf && !isNeighbor) : matchVal < 0.5;

        const mat = mesh.material as THREE.MeshStandardMaterial;
        const glowMat = glow?.material as THREE.MeshBasicMaterial;
        const labelMat = label?.material as THREE.SpriteMaterial;

        if (isSelf) {
          mat.opacity = 1.0;
          mat.emissiveIntensity = 0.9;
          mesh.scale.setScalar(mesh.userData.baseRadius * 1.25);
          if (glowMat) {
            glowMat.opacity = 0.7;
            glowMat.color.setHex(0xffffff);
          }
        } else if (isNeighbor) {
          mat.opacity = 0.95;
          mat.emissiveIntensity = 0.6;
          mesh.scale.setScalar(mesh.userData.baseRadius * 1.1);
          if (glowMat) glowMat.opacity = 0.4;
        } else if (isDimmed) {
          mat.opacity = 0.15;
          mat.emissiveIntensity = 0.05;
          mesh.scale.setScalar(mesh.userData.baseRadius * 0.85);
          if (glowMat) glowMat.opacity = 0.05;
          if (labelMat) labelMat.opacity = 0.1;
        } else {
          mat.opacity = 0.9;
          mat.emissiveIntensity = 0.35;
          mesh.scale.setScalar(mesh.userData.baseRadius);
          if (glowMat) glowMat.opacity = 0.2;
          if (labelMat) labelMat.opacity = 0.9;
        }
      }

      // Update 3D Quadratic Bézier Curved Edges
      const edgeSegments = Math.max(12, curveResolution);
      const edges = store.edges;

      for (let e = 0; e < edges.length; e++) {
        const line = edgeLinesRef.current[e];
        if (!line) continue;

        const edge = edges[e];
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

        // Quadratic Bézier control point: dynamic mid elevation
        const p1: [number, number, number] = [
          (p0[0] + p2[0]) * 0.5 + (edge.control ? edge.control[0] * 0.4 : 0),
          (p0[1] + p2[1]) * 0.5 + (edge.control ? edge.control[1] * 0.4 : 12),
          (p0[2] + p2[2]) * 0.5 + (edge.control ? edge.control[2] * 0.4 : 0),
        ];

        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;

        for (let seg = 0; seg <= edgeSegments; seg++) {
          const t = seg / edgeSegments;
          const [bx, by, bz] = evaluateBezier3D(p0, p1, p2, t);
          array[seg * 3 + 0] = bx;
          array[seg * 3 + 1] = by;
          array[seg * 3 + 2] = bz;
        }

        posAttr.needsUpdate = true;

        // Line highlight logic
        const lineMat = line.material as THREE.LineBasicMaterial;
        const isConnected =
          activeSlug &&
          ((edge.source === activeSlug && (neighborSlugs.has(edge.target) || edge.target === activeSlug)) ||
            (edge.target === activeSlug && (neighborSlugs.has(edge.source) || edge.source === activeSlug)));

        const isFiltered =
          store.matchTarget[sIdx] < 0.5 || store.matchTarget[tIdx] < 0.5;

        if (isConnected) {
          lineMat.opacity = 0.95;
          lineMat.color.setHex(0x38bdf8);
        } else if (activeSlug || isFiltered) {
          lineMat.opacity = 0.05;
        } else {
          lineMat.opacity = 0.35;
          lineMat.color.set(new THREE.Color(getSectionColor(store.nodes[sIdx].section)));
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
  }, [
    store,
    hoveredSlug,
    selectedSlug,
    curveResolution,
    pulseAnimation,
    getSectionColor,
  ]);

  // Raycasting for node hover / click / drag
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
    if (e.button === 0) {
      // Left click
      isDraggingRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      // Raycast to check if clicking a node
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

          // Align drag plane perpendicular to camera direction
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
      // Right click: Pan target
      isRightDraggingRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - mousePosRef.current.x;
    const dy = e.clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    // 1. Dragging Node in 3D
    if (draggedNodeIndexRef.current !== null && cameraRef.current) {
      const p = getPointerNormalized(e);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(p.x, p.y), cameraRef.current);
      const hitPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(dragPlaneRef.current, hitPoint)) {
        const idx = draggedNodeIndexRef.current;
        // Update repack offset directly
        store.repackOffset[idx * 3 + 0] = hitPoint.x - store.restPositions[idx * 3 + 0];
        store.repackOffset[idx * 3 + 1] = hitPoint.y - store.restPositions[idx * 3 + 1];
        store.repackOffset[idx * 3 + 2] = hitPoint.z - store.restPositions[idx * 3 + 2];
      }
      return;
    }

    // 2. Camera Orbit
    if (isDraggingRef.current) {
      const sph = targetCameraSphericalRef.current;
      sph.theta -= dx * 0.007;
      sph.phi = Math.max(0.05, Math.min(Math.PI - 0.05, sph.phi - dy * 0.007));
      return;
    }

    // 3. Camera Pan
    if (isRightDraggingRef.current && cameraRef.current) {
      const cam = cameraRef.current;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      const factor = targetCameraSphericalRef.current.radius * 0.0012;

      targetCameraSphericalRef.current.target.addScaledVector(right, -dx * factor);
      targetCameraSphericalRef.current.target.addScaledVector(up, dy * factor);
      return;
    }

    // 4. Hover detection when not dragging
    const p = getPointerNormalized(e);
    if (cameraRef.current && sceneRef.current) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(p.x, p.y), cameraRef.current);
      const intersects = raycaster.intersectObjects(nodeMeshesRef.current);

      if (intersects.length > 0) {
        const slug = intersects[0].object.userData.slug as string;
        onHoverNode(slug);
      } else {
        onHoverNode(null);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
    draggedNodeIndexRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
    const sph = targetCameraSphericalRef.current;
    sph.radius = Math.max(40, Math.min(1800, sph.radius * zoomFactor));
  };

  const resetCamera = () => {
    targetCameraSphericalRef.current = {
      radius: 380,
      theta: Math.PI / 4,
      phi: Math.PI / 3,
      target: new THREE.Vector3(0, 0, 0),
    };
  };

  return (
    <div
      ref={containerRef}
      id="3d-graph-viewport-container"
      className="relative w-full h-full select-none overflow-hidden bg-slate-950"
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        id="3d-knowledge-graph-canvas"
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating 3D Navigation Controls */}
      <div
        id="camera-quick-controls"
        className="absolute bottom-6 right-6 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl text-xs text-slate-300 z-10"
      >
        <button
          id="btn-camera-reset"
          onClick={resetCamera}
          className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition font-medium"
          title="Reset 3D Perspective"
        >
          Reset View
        </button>
        <div className="w-px h-4 bg-slate-800" />
        <button
          id="btn-camera-top"
          onClick={() => {
            targetCameraSphericalRef.current.phi = 0.05;
            targetCameraSphericalRef.current.theta = 0;
          }}
          className="px-2 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
          title="Top-Down Plan View"
        >
          Top
        </button>
        <button
          id="btn-camera-iso"
          onClick={() => {
            targetCameraSphericalRef.current.phi = Math.PI / 3;
            targetCameraSphericalRef.current.theta = Math.PI / 4;
          }}
          className="px-2 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
          title="Isometric View"
        >
          Iso
        </button>
        <div className="w-px h-4 bg-slate-800" />
        <button
          id="btn-camera-zoom-in"
          onClick={() => {
            targetCameraSphericalRef.current.radius = Math.max(
              40,
              targetCameraSphericalRef.current.radius * 0.8
            );
          }}
          className="px-2 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition font-bold"
          title="Zoom In"
        >
          +
        </button>
        <button
          id="btn-camera-zoom-out"
          onClick={() => {
            targetCameraSphericalRef.current.radius = Math.min(
              1800,
              targetCameraSphericalRef.current.radius * 1.25
            );
          }}
          className="px-2 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition font-bold"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Orbit / Pan legend overlay */}
      <div
        id="camera-hints"
        className="absolute bottom-6 left-6 text-[11px] text-slate-400 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800/80 pointer-events-none hidden sm:block"
      >
        <span className="text-slate-300 font-medium">Left Drag:</span> Orbit / Rotate &nbsp;|&nbsp;{' '}
        <span className="text-slate-300 font-medium">Right Drag:</span> Pan &nbsp;|&nbsp;{' '}
        <span className="text-slate-300 font-medium">Scroll:</span> Zoom &nbsp;|&nbsp;{' '}
        <span className="text-slate-300 font-medium">Click Node:</span> Inspect
      </div>
    </div>
  );
};
