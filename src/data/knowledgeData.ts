/**
 * Knowledge Graph Sample Datasets & Presets
 */

import { GraphNode, GraphEdge, Section } from '../types/graph';

export interface DatasetPreset {
  id: string;
  name: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  sections: Section[];
}

export const KNOWLEDGE_SECTIONS: Section[] = [
  {
    index: 0,
    title: 'Neural Networks & Deep Learning',
    slugs: [],
    centroid: [-90, 40, -40],
    radius: 75,
    color: '#6366f1', // Indigo
  },
  {
    index: 1,
    title: 'Distributed Systems & Consensus',
    slugs: [],
    centroid: [100, 30, -50],
    radius: 75,
    color: '#06b6d4', // Cyan
  },
  {
    index: 2,
    title: 'Knowledge Representation & Graph RAG',
    slugs: [],
    centroid: [-60, -80, 50],
    radius: 80,
    color: '#10b981', // Emerald
  },
  {
    index: 3,
    title: 'High-Performance 3D Physics & Solvers',
    slugs: [],
    centroid: [80, -70, 60],
    radius: 75,
    color: '#f59e0b', // Amber
  },
  {
    index: 4,
    title: 'Quantum Information & Entropy',
    slugs: [],
    centroid: [0, 100, 70],
    radius: 70,
    color: '#ec4899', // Pink
  },
];

export const RAW_NODES: GraphNode[] = [
  // --- Section 0: Neural Networks & Deep Learning ---
  {
    slug: 'transformer-architecture',
    title: 'Transformer Architecture',
    description: 'Self-attention based neural network eliminating recurrence for sequence modeling.',
    body: `The Transformer architecture replaces recurrence and convolutions entirely with multi-head self-attention mechanisms.

### Core Equation
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

### Characteristics
- Parallelizable token processing across context windows.
- Constant $\\mathcal{O}(1)$ path length between any two token positions.
- Forms the foundational backbone of modern Large Language Models and Vision Transformers.`,
    inDegree: 14,
    section: 0,
    layout: [-100, 60, -30],
    links: ['self-attention', 'multi-head-attention', 'layer-norm', 'flash-attention', 'rope-embeddings', 'kv-cache'],
  },
  {
    slug: 'self-attention',
    title: 'Self-Attention Mechanism',
    description: 'Dynamic contextual weighting of tokens relative to all other tokens in a sequence.',
    body: `Calculates pairwise affinity matrices between query and key projections to compute weighted value sums. Enables arbitrary contextual routing across long horizons.`,
    inDegree: 12,
    section: 0,
    layout: [-120, 80, -10],
    links: ['multi-head-attention', 'vector-embeddings', 'flash-attention'],
  },
  {
    slug: 'multi-head-attention',
    title: 'Multi-Head Attention (MHA)',
    description: 'Parallel attention projections into multiple orthogonal representation subspaces.',
    body: `Splits the projection dimension into $h$ heads ($d_k = d_{model}/h$), allowing the model to attend to information from different representation subspaces jointly at different positions.`,
    inDegree: 9,
    section: 0,
    layout: [-80, 85, -50],
    links: ['mqa-gqa', 'kv-cache', 'feed-forward-network'],
  },
  {
    slug: 'mqa-gqa',
    title: 'Grouped-Query Attention (GQA)',
    description: 'Memory-efficient attention sharing key-value heads across multiple query heads.',
    body: `Interpolates between Multi-Head Attention and Multi-Query Attention to significantly reduce KV-cache memory bandwidth while retaining modeling expressivity.`,
    inDegree: 7,
    section: 0,
    layout: [-60, 50, -70],
    links: ['kv-cache', 'flash-attention'],
  },
  {
    slug: 'kv-cache',
    title: 'Key-Value Cache Optimization',
    description: 'Dynamic caching of computed key and value tensors during autoregressive token generation.',
    body: `Prevents redundant recomputation of past token projections during generation, shifting autoregressive decoding from compute-bound to memory-bandwidth bound.`,
    inDegree: 10,
    section: 0,
    layout: [-95, 30, -60],
    links: ['flash-attention', 'transformer-architecture'],
  },
  {
    slug: 'flash-attention',
    title: 'FlashAttention (IO-Aware Exact Attention)',
    description: 'Tiling algorithm fusing attention operations to minimize GPU SRAM to HBM roundtrips.',
    body: `Leverages online softmax normalization and GPU SRAM tiling to compute exact attention in sub-quadratic memory footprint without materializing the $N \\times N$ intermediate matrix.`,
    inDegree: 11,
    section: 0,
    layout: [-130, 40, -45],
    links: ['transformer-architecture', 'octree-partitioning'],
  },
  {
    slug: 'rope-embeddings',
    title: 'Rotary Position Embeddings (RoPE)',
    description: 'Relative position encoding via 2D rotation of query and key vector chunks.',
    body: `Encodes token distance directly into the inner product through complex number rotations, preserving relative positional invariance across context extensions.`,
    inDegree: 6,
    section: 0,
    layout: [-110, 15, -20],
    links: ['transformer-architecture', 'vector-embeddings'],
  },
  {
    slug: 'layer-norm',
    title: 'RMSNorm & Layer Normalization',
    description: 'Variance and mean stabilization layers maintaining numerical gradient stability.',
    body: `Normalizes activation distributions across hidden feature dimensions, preventing vanishing or exploding activations during deep backpropagation.`,
    inDegree: 5,
    section: 0,
    layout: [-70, 20, -35],
    links: ['transformer-architecture', 'feed-forward-network'],
  },
  {
    slug: 'feed-forward-network',
    title: 'SwiGLU Feed-Forward Networks',
    description: 'Non-linear position-wise token projection layers with gated activations.',
    body: `Comprises two linear projections with Swish/GELU gating that store associative knowledge representations and factual associations inside transformer layers.`,
    inDegree: 6,
    section: 0,
    layout: [-50, 70, -30],
    links: ['transformer-architecture', 'knowledge-graphs'],
  },
  {
    slug: 'diffusion-models',
    title: 'Denoising Diffusion Probabilistic Models',
    description: 'Generative modeling via iterative stochastic Langevin reverse diffusion steps.',
    body: `Learns to reverse a progressive Gaussian noise corruption process through learned score function estimates $\\nabla_x \\log p(x)$.`,
    inDegree: 8,
    section: 0,
    layout: [-140, 75, -70],
    links: ['transformer-architecture', 'runge-kutta-integrator'],
  },

  // --- Section 1: Distributed Systems & Consensus ---
  {
    slug: 'raft-consensus',
    title: 'Raft Consensus Protocol',
    description: 'Decomposed consensus algorithm structured around leader election and log replication.',
    body: `Raft achieves consensus by electing a distinguished leader, delegating all state machine commands through an append-only replicated log with randomized election timeouts.

### Core Invariants
- **Leader Append-Only**: A leader never overwrites its log.
- **Log Matching Property**: Matching index & term implies identical prefix.
- **State Machine Safety**: Committed log entries are executed deterministically.`,
    inDegree: 15,
    section: 1,
    layout: [90, 50, -40],
    links: ['paxos-algorithm', 'byzantine-fault-tolerance', 'vector-clocks', 'split-brain-prevention', 'gossip-protocol'],
  },
  {
    slug: 'paxos-algorithm',
    title: 'Paxos & Multi-Paxos',
    description: 'Foundational asynchronous consensus protocol handling crash-recovery failure models.',
    body: `Uses 2-phase Prepare/Promise and Accept/Accepted rounds to guarantee safety across unreliable network partitions with majority quorum intersections.`,
    inDegree: 13,
    section: 1,
    layout: [120, 60, -20],
    links: ['raft-consensus', 'byzantine-fault-tolerance', 'split-brain-prevention'],
  },
  {
    slug: 'byzantine-fault-tolerance',
    title: 'Byzantine Fault Tolerance (BFT)',
    description: 'Consensus mechanisms resilient against arbitrary, malicious, or colluding node failures.',
    body: `Requires $3f + 1$ total nodes to tolerate $f$ Byzantine actors, employing cryptographic threshold signatures and view-change validation trees.`,
    inDegree: 11,
    section: 1,
    layout: [110, 80, -60],
    links: ['paxos-algorithm', 'raft-consensus', 'gossip-protocol'],
  },
  {
    slug: 'vector-clocks',
    title: 'Vector Clocks & Causality',
    description: 'Partial ordering mechanism capturing causal relationships in asynchronous networks.',
    body: `Maintains a vector of logical timestamps per process to detect concurrent mutations and enforce happens-before invariants ($\\to$).`,
    inDegree: 9,
    section: 1,
    layout: [70, 30, -70],
    links: ['chandy-lamport-snapshots', 'raft-consensus', 'gossip-protocol'],
  },
  {
    slug: 'gossip-protocol',
    title: 'Gossip & Epidemic Dissemination',
    description: 'Decentralized peer-to-peer membership and state synchronization protocol.',
    body: `Randomized $\\mathcal{O}(\\log N)$ message passing with exponential convergence, robust against network partitioning and node churn.`,
    inDegree: 8,
    section: 1,
    layout: [80, 10, -30],
    links: ['vector-clocks', 'raft-consensus'],
  },
  {
    slug: 'chandy-lamport-snapshots',
    title: 'Chandy-Lamport Global Snapshots',
    description: 'Consistent distributed state recording without halting active computation.',
    body: `Propagates marker messages along FIFO channels to snapshot in-flight messages and local node states for deterministic checkpointing.`,
    inDegree: 6,
    section: 1,
    layout: [60, 45, -90],
    links: ['vector-clocks', 'raft-consensus'],
  },
  {
    slug: 'split-brain-prevention',
    title: 'Quorum Quenching & Split-Brain',
    description: 'Algorithmic fencing tokens and odd-quorum requirements preventing divergent state partitions.',
    body: `Ensures strict majority intersection $\\lfloor N/2 \\rfloor + 1$ so that partitioned network islands cannot independently commit contradictory transactions.`,
    inDegree: 7,
    section: 1,
    layout: [130, 25, -60],
    links: ['raft-consensus', 'paxos-algorithm'],
  },

  // --- Section 2: Knowledge Representation & Graph RAG ---
  {
    slug: 'graph-rag',
    title: 'Graph Retrieval-Augmented Generation (Graph RAG)',
    description: 'Structured graph traversal combined with neural dense retrieval for multi-hop synthesis.',
    body: `Enhances LLM context windows by extracting subgraphs, entity communities, and semantic paths rather than isolated raw text chunks.

### Workflow Pipeline
1. Entity & relationship extraction into a structured knowledge graph.
2. Hierarchical community summarization via Leiden clustering.
3. Multi-hop path retrieval and subgraph serialization into LLM prompt.`,
    inDegree: 16,
    section: 2,
    layout: [-70, -70, 40],
    links: ['vector-embeddings', 'knowledge-graphs', 'entity-linking', 'pagerank-centrality', 'transformer-architecture'],
  },
  {
    slug: 'knowledge-graphs',
    title: 'Knowledge Graphs & Triplestores',
    description: 'Directed labeled multigraphs storing semantic facts as (Subject, Predicate, Object) triples.',
    body: `Represents real-world entities and formal ontological relations, queryable via formal logic (SPARQL/Cypher) and graph neural networks.`,
    inDegree: 14,
    section: 2,
    layout: [-90, -90, 20],
    links: ['graph-rag', 'semantic-ontologies', 'entity-linking', 'vector-embeddings'],
  },
  {
    slug: 'vector-embeddings',
    title: 'Dense Vector Embeddings & HNSW',
    description: 'High-dimensional semantic manifold projections indexed via Hierarchical Navigable Small Worlds.',
    body: `Maps discrete symbols into continuous metric spaces where cosine similarity reflects semantic relatedness; indexed via multi-layer Voronoi graphs.`,
    inDegree: 18,
    section: 2,
    layout: [-40, -60, 60],
    links: ['graph-rag', 'self-attention', 'spatial-hashing', 'entity-linking'],
  },
  {
    slug: 'entity-linking',
    title: 'Entity Disambiguation & Resolution',
    description: 'Mapping surface text mentions to canonical knowledge base nodes under ambiguity.',
    body: `Combines contextual dense embeddings with graph topological neighbor priors to resolve polysemous entities accurately.`,
    inDegree: 8,
    section: 2,
    layout: [-85, -50, 70],
    links: ['knowledge-graphs', 'graph-rag', 'vector-embeddings'],
  },
  {
    slug: 'semantic-ontologies',
    title: 'Formal Ontologies & OWL / RDF',
    description: 'Description logic taxonomies defining axioms, transitivity, and inferential rules.',
    body: `Provides formal schema constraints that enable automated theorem provers and deductive table reasoning over graph datasets.`,
    inDegree: 6,
    section: 2,
    layout: [-110, -80, 50],
    links: ['knowledge-graphs', 'graph-rag'],
  },
  {
    slug: 'pagerank-centrality',
    title: 'PageRank & Graph Centrality Metrics',
    description: 'Stationary probability distribution of random walkers with teleportation probability.',
    body: `Computes node authority scores $PR(u) = \\frac{1-d}{N} + d \\sum_{v \\in In(u)} \\frac{PR(v)}{Out(v)}$ for subgraph prioritization.`,
    inDegree: 9,
    section: 2,
    layout: [-40, -100, 30],
    links: ['graph-rag', 'knowledge-graphs', 'octree-partitioning'],
  },

  // --- Section 3: High-Performance 3D Physics & Solvers ---
  {
    slug: 'barnes-hut-nbody',
    title: '3D Barnes-Hut N-Body Algorithm',
    description: 'Spatial tree decomposition reducing N-body force calculation from O(N^2) to O(N log N).',
    body: `Approximates distant clusters of particles as a single center of mass if the multipole ratio $\\frac{s}{d} < \\theta$.

### Multipole Condition
If $\\frac{\\text{length}^2}{\\text{dist}^2} < \\theta^2$, treat internal octree cell as point mass:
$$F = \\frac{G \\cdot M_{\\text{cell}}}{r^2}$$`,
    inDegree: 17,
    section: 3,
    layout: [70, -60, 50],
    links: ['octree-partitioning', 'spatial-hashing', 'quad-bezier-curves', 'verlet-integrator', 'graph-rag'],
  },
  {
    slug: 'octree-partitioning',
    title: '3D Octree Spatial Partitioning',
    description: 'Hierarchical 8-ary tree dividing 3D Euclidean space into recursively subdivided voxels.',
    body: `Enables rapid logarithmic frustum culling, collision detection, and fast approximate gravitational/electrostatic charge calculations.`,
    inDegree: 15,
    section: 3,
    layout: [90, -80, 30],
    links: ['barnes-hut-nbody', 'spatial-hashing', 'broad-phase-collision'],
  },
  {
    slug: 'quad-bezier-curves',
    title: '3D Quadratic Bézier Splines',
    description: 'Parametric polynomial curves interpolating between two endpoints via a 3D control guide.',
    body: `Defines smooth 3D graph edges with continuous curvature:
$$\\mathbf{B}(t) = (1 - t)^2 \\mathbf{P}_0 + 2(1 - t)t \\mathbf{P}_1 + t^2 \\mathbf{P}_2, \\quad t \\in [0, 1]$$`,
    inDegree: 11,
    section: 3,
    layout: [60, -90, 80],
    links: ['barnes-hut-nbody', 'graph-rag'],
  },
  {
    slug: 'spatial-hashing',
    title: 'Spatial Hashing & Grid Bins',
    description: 'O(1) constant-time neighbor query structure via hash projections of quantized coordinates.',
    body: `Discretizes continuous 3D domain into cell buckets $(i, j, k) = \\lfloor \\mathbf{x} / s \\rfloor$, resolving close-range interactions with minimal overhead.`,
    inDegree: 10,
    section: 3,
    layout: [110, -50, 70],
    links: ['octree-partitioning', 'broad-phase-collision', 'vector-embeddings'],
  },
  {
    slug: 'broad-phase-collision',
    title: 'Broad-Phase Sphere Relaxation',
    description: 'Iterative constraint resolution preventing geometric penetration between node radii.',
    body: `Computes sphere-sphere overlap impulses along contact normals over multiple relaxation sub-steps to ensure stable non-overlapping equilibrium.`,
    inDegree: 8,
    section: 3,
    layout: [95, -100, 60],
    links: ['octree-partitioning', 'barnes-hut-nbody', 'verlet-integrator'],
  },
  {
    slug: 'verlet-integrator',
    title: 'Verlet & Velocity-Verlet Integration',
    description: 'Symplectic time-stepping algorithm preserving phase-space energy conservation.',
    body: `Computes updated positions directly from acceleration without numerical damping artifacts:
$$\\mathbf{x}_{n+1} = 2\\mathbf{x}_n - \\mathbf{x}_{n-1} + \\mathbf{a}_n \\Delta t^2$$`,
    inDegree: 7,
    section: 3,
    layout: [50, -40, 70],
    links: ['barnes-hut-nbody', 'runge-kutta-integrator'],
  },
  {
    slug: 'runge-kutta-integrator',
    title: 'Runge-Kutta 4th Order (RK4)',
    description: 'High-precision numerical integration averaging four derivative slope evaluations.',
    body: `Evaluates derivative vector field at start, midpoint trial steps, and endpoint to minimize truncation error to $\\mathcal{O}(\\Delta t^4)$.`,
    inDegree: 5,
    section: 3,
    layout: [40, -70, 90],
    links: ['verlet-integrator', 'diffusion-models'],
  },

  // --- Section 4: Quantum Information & Entropy ---
  {
    slug: 'quantum-entanglement',
    title: 'Quantum Entanglement & Bell States',
    description: 'Non-separable multi-qubit states exhibiting non-local quantum correlation.',
    body: `Represented by states such as $|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$ which violate Bell inequalities and power quantum communication protocols.`,
    inDegree: 14,
    section: 4,
    layout: [0, 90, 60],
    links: ['density-matrix', 'shors-algorithm', 'bloch-sphere-geometry', 'stabilizer-codes'],
  },
  {
    slug: 'bloch-sphere-geometry',
    title: 'Bloch Sphere & SU(2) Rotations',
    description: 'Geometric 2-sphere representation of single pure and mixed qubit density operators.',
    body: `Parameterizes single qubit state $|\\psi\\rangle = \\cos(\\theta/2)|0\\rangle + e^{i\\phi}\\sin(\\theta/2)|1\\rangle$ on a unit 3D sphere.`,
    inDegree: 10,
    section: 4,
    layout: [-30, 110, 80],
    links: ['quantum-entanglement', 'density-matrix', 'quad-bezier-curves'],
  },
  {
    slug: 'density-matrix',
    title: 'Density Operator & Von Neumann Entropy',
    description: 'Statistical formulation of quantum states and quantum entanglement entropy.',
    body: `Measures statistical entanglement via $S(\\rho) = -\\text{Tr}(\\rho \\log_2 \\rho)$ for mixed quantum states.`,
    inDegree: 9,
    section: 4,
    layout: [30, 110, 80],
    links: ['quantum-entanglement', 'bloch-sphere-geometry'],
  },
  {
    slug: 'shors-algorithm',
    title: "Shor's Period-Finding Algorithm",
    description: 'Polynomial time quantum algorithm for integer factorization via Quantum Fourier Transform.',
    body: `Exploits modular exponentiation order finding on a quantum register with $\\mathcal{O}((\\log N)^3)$ gates, breaking RSA cryptography.`,
    inDegree: 8,
    section: 4,
    layout: [-20, 80, 40],
    links: ['quantum-entanglement', 'transformer-architecture'],
  },
  {
    slug: 'stabilizer-codes',
    title: 'Surface Codes & Fault-Tolerant Quantum Memory',
    description: 'Topological quantum error correction measuring commuting Pauli stabilizer checks.',
    body: `Arranges data and syndrome qubits on a 2D/3D lattice, correcting arbitrary bit-flip and phase-flip errors below threshold.`,
    inDegree: 7,
    section: 4,
    layout: [20, 80, 40],
    links: ['quantum-entanglement', 'byzantine-fault-tolerance'],
  },
];

/**
 * Builds the complete edges list from node outgoing links
 */
export function buildGraphEdges(nodes: GraphNode[]): GraphEdge[] {
  const nodeMap = new Map(nodes.map((n) => [n.slug, n]));
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const node of nodes) {
    for (const tgtSlug of node.links) {
      if (nodeMap.has(tgtSlug) && tgtSlug !== node.slug) {
        const key = `${node.slug}->${tgtSlug}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            source: node.slug,
            target: tgtSlug,
            control: [0, 0, 0], // will be generated dynamically
          });
        }
      }
    }
  }

  return edges;
}

/**
 * Synthesize a scaled graph with N nodes for stress testing
 */
export function generateSyntheticGraph(targetNodeCount = 100): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sections: Section[];
} {
  const baseNodes = [...RAW_NODES];
  const total = Math.max(targetNodeCount, baseNodes.length);
  const nodes: GraphNode[] = [...baseNodes];
  const sections = KNOWLEDGE_SECTIONS.map((s) => ({ ...s, slugs: [] as string[] }));

  const categories = [
    { section: 0, prefix: 'neural', name: 'Deep Learning & Attention' },
    { section: 1, prefix: 'dist', name: 'Distributed & Consensus' },
    { section: 2, prefix: 'kr', name: 'Knowledge Graph & Semantics' },
    { section: 3, prefix: 'phys', name: '3D Simulation & Geometry' },
    { section: 4, prefix: 'quant', name: 'Quantum Information' },
  ];

  for (let i = baseNodes.length; i < total; i++) {
    const catIdx = i % categories.length;
    const cat = categories[catIdx];
    const secCentroid = sections[catIdx].centroid;

    // Jitter around cluster centroid
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = (Math.random() - 0.5) * Math.PI;
    const dist = 25 + Math.random() * 50;

    const lx = secCentroid[0] + Math.cos(angle1) * Math.cos(angle2) * dist;
    const ly = secCentroid[1] + Math.sin(angle2) * dist;
    const lz = secCentroid[2] + Math.sin(angle1) * Math.cos(angle2) * dist;

    // Pick 2-4 target links within section or cross-cluster
    const links: string[] = [];
    const linkCount = 2 + Math.floor(Math.random() * 3);
    for (let l = 0; l < linkCount; l++) {
      const candidate = nodes[Math.floor(Math.random() * nodes.length)];
      if (candidate && candidate.slug && !links.includes(candidate.slug)) {
        links.push(candidate.slug);
      }
    }

    const slug = `${cat.prefix}-node-${i + 1}`;
    nodes.push({
      slug,
      title: `${cat.name} Concept #${i + 1}`,
      description: `Synthesized topological entity #${i + 1} connected within cluster ${cat.name}.`,
      body: `This synthetic node was generated to benchmark the 3D Barnes-Hut Octree solver and dynamic quadratic Bézier edge routing under dense scale.`,
      inDegree: 1,
      section: cat.section,
      layout: [lx, ly, lz],
      links,
    });
  }

  // Populate sections slugs
  for (const node of nodes) {
    const sec = sections[node.section % sections.length];
    sec.slugs.push(node.slug);
  }

  const edges = buildGraphEdges(nodes);

  return { nodes, edges, sections };
}

export function getDefaultDataset(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sections: Section[];
} {
  const nodes = [...RAW_NODES];
  const sections = KNOWLEDGE_SECTIONS.map((s) => ({ ...s, slugs: [] as string[] }));

  for (const node of nodes) {
    const sec = sections[node.section % sections.length];
    if (sec) sec.slugs.push(node.slug);
  }

  const edges = buildGraphEdges(nodes);
  return { nodes, edges, sections };
}
