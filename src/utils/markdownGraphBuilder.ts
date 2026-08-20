/**
 * Markdown Hyperlink Graph Builder & Parser
 *
 * Implements the 5-step knowledge graph generation workflow:
 * 1. Markdown Source Ingestion (files, frontmatter, body, metadata)
 * 2. Link Extraction via Regex/AST: /\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g
 * 3. Sluggification & Normalization (Session.md -> session, Permission%20mode.md -> permission-mode)
 * 4. Building 3D Curved Bézier Edges with outward deflection control points
 * 5. Calculating Graph Metrics (inDegree, logarithmic node radius sizing, spherical layout)
 */

export interface ParsedMarkdownTerm {
  slug: string;
  title: string;
  persianTitle?: string;
  description: string;
  persianDescription?: string;
  body: string;
  persianBody?: string;
  prose?: string;
  persianProse?: string;
  aliases: string[];
  links: string[];
  usage: string[];
  avoid?: string;
  heardInTheWild?: {
    user: string;
    agent: string;
  };
  section: number;
  sectionTitle?: string;
  inDegree?: number;
  layout?: [number, number, number];
}

export interface GraphEdgeData {
  source: string;
  target: string;
  control?: [number, number, number];
}

export interface GraphSectionData {
  index: number;
  title: string;
  persianTitle?: string;
  slugs: string[];
  centroid: [number, number, number];
  radius: number;
  paperColor?: string;
}

export interface CompleteGraphData {
  nodes: ParsedMarkdownTerm[];
  edges: GraphEdgeData[];
  sections: GraphSectionData[];
  meta: {
    totalNodes: number;
    totalEdges: number;
    maxInDegree: number;
    generatedAt: string;
  };
}

/**
 * Step 3: Sluggification & Normalization
 * Converts "#agentsmd", "Session.md", "Permission%20mode.md", "AGENTS.md" to clean kebab slugs
 */
export function normalizeMarkdownSlug(linkUrl: string): string {
  if (!linkUrl) return '';
  let clean = decodeURIComponent(linkUrl.trim());
  // Remove anchor prefix #
  clean = clean.replace(/^#/, '');
  // Remove ./ or ../ prefixes
  clean = clean.replace(/^\.\.?\//, '');
  // Remove .md suffix
  clean = clean.replace(/\.md$/i, '');
  clean = clean.replace(/\.md\.md$/i, '');
  // Replace spaces and special characters with hyphens
  clean = clean
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();

  // Common aliases / normalization rules
  const aliasMap: Record<string, string> = {
    'agentsmd': 'agents',
    'agents-md': 'agents',
    'agents': 'agents',
    'agent-harness': 'harness',
    'context-windows': 'context-window',
    'contextwindows': 'context-window',
    'permissions-mode': 'permission-mode',
    'permissionsmode': 'permission-mode',
    'sandboxing': 'sandboxing',
  };

  return aliasMap[clean] || clean;
}

/**
 * Step 2: Link Extraction
 * Extracts all relative markdown links matching both [#slug] and [anchor](./filename.md)
 */
export function extractMarkdownHyperlinks(markdownContent: string): string[] {
  // Regex supporting both anchor links [title](#slug) and file links [title](./File.md)
  const linkRegex = /\[([^\]]+)\]\((?:#([a-zA-Z0-9_-]+)|(?:\.\/|\.\.\/)?([^)]+?)\.md)\)/gi;
  const links: string[] = [];
  const linkSet = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(markdownContent)) !== null) {
    const rawTarget = match[2] || match[3];
    const slug = normalizeMarkdownSlug(rawTarget);
    if (slug && !linkSet.has(slug)) {
      linkSet.add(slug);
      links.push(slug);
    }
  }

  return links;
}

/**
 * Parses a single Markdown file content (frontmatter or raw body)
 */
export function parseSingleMarkdownDoc(filename: string, content: string): ParsedMarkdownTerm {
  const baseSlug = normalizeMarkdownSlug(filename);

  // Extract title from first # Header or filename
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/i, '');

  // Extract Heard In The Wild dialogue if present
  let heardInTheWild: { user: string; agent: string } | undefined;
  const wildMatch = content.match(
    /###\s*(?:Heard in the wild|شنیده شده در عمل)[^]*?(?:\*\*User\*\*|\*\*کاربر\*\*):\s*["«]([^"»\n]+)["»][^]*?(?:\*\*Agent\*\*|\*\*دستیار\*\*):\s*["«]([^"»\n]+)["»]/i
  );
  if (wildMatch) {
    heardInTheWild = {
      user: wildMatch[1].trim(),
      agent: wildMatch[2].trim(),
    };
  }

  // Extract "Avoid" / "اجتناب"
  let avoid = '';
  const avoidMatch = content.match(
    /_(?:اجتناب|Avoid):_\s*([^\n]+(?:\n(?!(?:_کاربرد:|_Usage:|###)).+)*)/
  );
  if (avoidMatch) {
    avoid = avoidMatch[1].trim();
  }

  // Extract "Usage" / "کاربرد"
  const usage: string[] = [];
  const usageMatch = content.match(/_(?:کاربرد|Usage):_\s*([\s\S]*)$/);
  if (usageMatch) {
    const quotes = usageMatch[1].match(/«([^»]+)»|"(?:\\"|[^"])+"/g);
    if (quotes) {
      quotes.forEach((q) => usage.push(q.replace(/^[«"]|[»"]$/g, '').trim()));
    }
  }

  // Extract lead description / blockquote / first paragraph
  const quoteMatch = content.match(/^>\s*(.+)$/m);
  const descMatch = content.match(/(?:^|\n\n)([A-Z\u0600-\u06FF][^\n#]+)/);
  const description = quoteMatch ? quoteMatch[1].trim() : descMatch ? descMatch[1].trim() : title;

  // Extract Links
  const links = extractMarkdownHyperlinks(content);

  // Clean prose body without metadata blocks
  const prose = content
    .replace(/_(?:اجتناب|Avoid):_[\s\S]*?(?=_(?:کاربرد|Usage):_|$)/g, '')
    .replace(/_(?:کاربرد|Usage):_[\s\S]*$/g, '')
    .trim();

  // Section default heuristic
  let section = 0;
  if (/turn|session|token|cache|context|نشست|نوبت|توکن/i.test(content)) section = 1;
  else if (/tool|bash|lsp|diff|environment|sandbox|mcp|ابزار|محیط/i.test(content)) section = 2;
  else if (/eval|benchmark|test|rag|شکست|ارزیابی/i.test(content)) section = 3;
  else if (/handoff|تحویل/i.test(content)) section = 4;
  else if (/prompt|instruction|cot|reasoning|memory|steering|حافظه|هدایت/i.test(content)) section = 5;
  else if (/spec|architecture|design|doc|pattern|الگو/i.test(content)) section = 6;

  return {
    slug: baseSlug,
    title,
    description,
    body: content,
    prose,
    aliases: [title.toLowerCase()],
    links,
    usage,
    avoid,
    heardInTheWild,
    section,
  };
}

/**
 * Parses a complete multi-section Persian or English README.md
 */
export function parseMultiSectionMarkdownDoc(markdown: string): ParsedMarkdownTerm[] {
  const terms: ParsedMarkdownTerm[] = [];
  const sectionBlocks = markdown
    .split(/\n(?=##\s+Section\s+\d+)/g)
    .filter((b) => b.trim().startsWith('## Section'));

  if (sectionBlocks.length === 0) {
    // Fallback if no "## Section" headers: split by "### "
    const singleBlocks = markdown
      .split(/\n(?=###\s+)/g)
      .filter((b) => b.trim().startsWith('### '));
    for (const block of singleBlocks) {
      const titleMatch = block.match(/###\s+(.+)/);
      if (titleMatch) {
        terms.push(parseSingleMarkdownDoc(titleMatch[1].trim(), block));
      }
    }
    return terms;
  }

  sectionBlocks.forEach((secBlock, secIdx) => {
    const lines = secBlock.split('\n');
    const headerLine = lines[0];
    const secTitleMatch = headerLine.match(/##\s+Section\s+(\d+)\s+[—-]\s*(.+)/);
    const secNum = secTitleMatch ? parseInt(secTitleMatch[1], 10) - 1 : secIdx;

    const termBlocks = secBlock
      .split(/\n(?=###\s+)/g)
      .filter((b) => b.trim().startsWith('### '));

    for (const termBlock of termBlocks) {
      const termLines = termBlock.trim().split('\n');
      const titleMatch = termLines[0].match(/###\s+(.+)/);
      if (!titleMatch) continue;

      const rawTitle = titleMatch[1].trim();
      const slug = normalizeMarkdownSlug(rawTitle.replace(/\s+/g, '-'));
      const fullBody = termLines.slice(1).join('\n').trim();

      const paragraphs = fullBody
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      const description = paragraphs[0]
        ? paragraphs[0]
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_`]/g, '')
            .slice(0, 140)
        : '';

      let avoid = '';
      const avoidMatch = fullBody.match(
        /_(?:اجتناب|Avoid):_\s*([^\n]+(?:\n(?!(?:_کاربرد:|_Usage:|###)).+)*)/
      );
      if (avoidMatch) {
        avoid = avoidMatch[1].trim();
      }

      const usage: string[] = [];
      const usageMatch = fullBody.match(/_(?:کاربرد|Usage):_\s*([\s\S]*)$/);
      if (usageMatch) {
        const quotes = usageMatch[1].match(/«([^»]+)»|"(?:\\"|[^"])+"/g);
        if (quotes) {
          quotes.forEach((q) => usage.push(q.replace(/^[«"]|[»"]$/g, '').trim()));
        }
      }

      const links = extractMarkdownHyperlinks(fullBody);

      const prose = fullBody
        .replace(/_(?:اجتناب|Avoid):_[\s\S]*?(?=_(?:کاربرد|Usage):_|$)/g, '')
        .replace(/_(?:کاربرد|Usage):_[\s\S]*$/g, '')
        .trim();

      terms.push({
        slug,
        title: rawTitle,
        description,
        body: fullBody,
        prose,
        aliases: [],
        links,
        usage,
        avoid,
        section: Math.max(0, Math.min(6, secNum)),
      });
    }
  });

  return terms;
}

/**
 * Step 4 & 5: Compute Complete 3D Force Knowledge Graph from list of Markdown terms
 */
export function buildGraphFromMarkdownTerms(terms: ParsedMarkdownTerm[]): CompleteGraphData {
  const nodeMap = new Map<string, ParsedMarkdownTerm>();
  terms.forEach((t) => nodeMap.set(t.slug, t));

  // 1. Calculate inDegree: inDegree(Node) = count of incoming links
  const inDegreeMap = new Map<string, number>();
  terms.forEach((t) => inDegreeMap.set(t.slug, 0));

  for (const term of terms) {
    for (const targetSlug of term.links) {
      if (nodeMap.has(targetSlug)) {
        inDegreeMap.set(targetSlug, (inDegreeMap.get(targetSlug) || 0) + 1);
      }
    }
  }

  let maxInDegree = 1;
  terms.forEach((term) => {
    term.inDegree = inDegreeMap.get(term.slug) || 0;
    if (term.inDegree > maxInDegree) maxInDegree = term.inDegree;
  });

  // 2. Assign Spherical 3D Coordinates bounded inside R <= 135
  const SPHERE_RADIUS = 130;
  const N = terms.length;

  const sectionCentroids: [number, number, number][] = [
    [40, 20, -20],
    [0, 0, 0],
    [-75, -25, 35],
    [65, -55, 30],
    [-55, 65, -30],
    [80, 55, 35],
    [-35, -80, -35],
  ];

  terms.forEach((term, idx) => {
    // Spherical Fibonacci distribution perturbed by section centroid
    const phi = Math.acos(1 - (2 * (idx + 0.5)) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * idx;

    const r = SPHERE_RADIUS * (0.35 + 0.65 * Math.cbrt((idx + 0.5) / N));
    const sx = r * Math.sin(phi) * Math.cos(theta);
    const sy = r * Math.sin(phi) * Math.sin(theta);
    const sz = r * Math.cos(phi);

    const centroid = sectionCentroids[term.section % sectionCentroids.length] || [0, 0, 0];
    let px = sx * 0.7 + centroid[0] * 0.5;
    let py = sy * 0.7 + centroid[1] * 0.5;
    let pz = sz * 0.7 + centroid[2] * 0.5;

    // Hard spherical clamp
    const dist = Math.hypot(px, py, pz);
    if (dist > SPHERE_RADIUS) {
      const factor = SPHERE_RADIUS / dist;
      px *= factor;
      py *= factor;
      pz *= factor;
    }

    term.layout = [Math.round(px), Math.round(py), Math.round(pz)];
  });

  // 3. Step 4: Build Edges with 3D Quadratic Bézier control points
  const edges: GraphEdgeData[] = [];
  const edgeSet = new Set<string>();

  for (const term of terms) {
    for (const tgtSlug of term.links) {
      const tgtNode = nodeMap.get(tgtSlug);
      if (tgtNode && tgtSlug !== term.slug) {
        const key = `${term.slug}->${tgtSlug}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);

          const p0 = term.layout || [0, 0, 0];
          const p2 = tgtNode.layout || [0, 0, 0];

          // Compute midpoint
          const mx = (p0[0] + p2[0]) * 0.5;
          const my = (p0[1] + p2[1]) * 0.5;
          const mz = (p0[2] + p2[2]) * 0.5;

          // Outward radial curvature
          const mLen = Math.hypot(mx, my, mz) || 1;
          const curvatureOffset = 18;
          const cx = mx + (mx / mLen) * curvatureOffset;
          const cy = my + (my / mLen) * curvatureOffset + 6;
          const cz = mz + (mz / mLen) * curvatureOffset;

          edges.push({
            source: term.slug,
            target: tgtSlug,
            control: [
              Math.round(cx * 100) / 100,
              Math.round(cy * 100) / 100,
              Math.round(cz * 100) / 100,
            ],
          });
        }
      }
    }
  }

  // 4. Section grouping
  const SECTION_TITLES = [
    { title: 'THE MODEL & PARAMETERS', persianTitle: 'مدل و پارامترها', color: '#4500B3' },
    { title: 'SESSIONS, CONTEXT WINDOWS & TURNS', persianTitle: 'نشست‌ها، پنجره‌های زمینه و نوبت‌ها', color: '#EB4347' },
    { title: 'TOOLS, HARNESS & ENVIRONMENT', persianTitle: 'ابزارها، بستر اجرایی و محیط', color: '#0F7A6B' },
    { title: 'EVALS, BENCHMARKS & DRIFT', persianTitle: 'ارزیابی‌ها، معیارها و تغییر رفتار', color: '#D3C2FE' },
    { title: 'PROMPTING, REASONING & STEERING', persianTitle: 'پرامپت‌نویسی، استدلال و هدایت', color: '#FF8F3F' },
    { title: 'AGENTS, WORKFLOWS & COLLABORATION', persianTitle: 'عامل‌ها، گردش‌های کاری و همکاری', color: '#2D3DCF' },
    { title: 'SPEC, REPO MAPS & ARTIFACTS', persianTitle: 'مشخصات، نقشه مخزن و مستندات', color: '#9DD395' },
  ];

  const sections: GraphSectionData[] = SECTION_TITLES.map((sec, idx) => ({
    index: idx,
    title: sec.title,
    persianTitle: sec.persianTitle,
    slugs: terms.filter((t) => t.section === idx).map((t) => t.slug),
    centroid: sectionCentroids[idx] || [0, 0, 0],
    radius: 120,
    paperColor: sec.color,
  }));

  return {
    nodes: terms,
    edges,
    sections,
    meta: {
      totalNodes: terms.length,
      totalEdges: edges.length,
      maxInDegree,
      generatedAt: new Date().toISOString(),
    },
  };
}
