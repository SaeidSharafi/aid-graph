/**
 * CLI Script: Build 3D Knowledge Graph from Markdown at codebase level
 *
 * Runs on:
 *   npm run build:graph
 *   (and automatically before `npm run build`)
 *
 * Supported inputs (in order of precedence):
 *   1. `./README.md`
 *   2. `./DICTIONARY.md`
 *   3. `./dictionary/*.md`
 *   4. `./src/data/README.md`
 *
 * Outputs:
 *   - `src/data/graph-data.json`
 *   - `src/data/generatedGraph.ts`
 */

import * as fs from 'fs';
import * as path from 'path';

const SECTION_METADATA = [
  { index: 0, title: 'The Model (مدل)', centroid: [98.83, 0.34, 3.36] as [number, number, number], radius: 166.74, paperColor: '#4500B3' },
  { index: 1, title: 'Sessions, Context Windows & Turns (نشست‌ها، پنجره‌های بافت و نوبت‌ها)', centroid: [29.76, 7.42, 59.83] as [number, number, number], radius: 109.74, paperColor: '#EB4347' },
  { index: 2, title: 'Tools & Environment (ابزارها و محیط)', centroid: [-26.97, 20.84, 117.14] as [number, number, number], radius: 158.8, paperColor: '#9DD395' },
  { index: 3, title: 'Failure Modes (حالت‌های شکست)', centroid: [-132.16, -13.75, 55.28] as [number, number, number], radius: 159.0, paperColor: '#D3C2FE' },
  { index: 4, title: 'Handoffs (تحویل‌ها)', centroid: [-86.02, -17.65, -36.43] as [number, number, number], radius: 181.52, paperColor: '#0F7A6B' },
  { index: 5, title: 'Memory and Steering (حافظه و هدایت)', centroid: [-49.93, -10.37, -119.57] as [number, number, number], radius: 106.85, paperColor: '#FFD23F' },
  { index: 6, title: 'Patterns of Work (الگوهای کار)', centroid: [64.85, 6.5, -105.11] as [number, number, number], radius: 180.51, paperColor: '#2D3DCF' },
];

function normalizeSlug(raw: string): string {
  if (!raw) return '';
  let slug = raw.toLowerCase().trim().replace(/^#/, '').replace(/\.md$/, '').replace(/\.md\.md$/, '');
  slug = slug.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-');
  if (slug === 'agentsmd' || slug === 'agents-md') return 'agents';
  if (slug === 'context-windows' || slug === 'contextwindows') return 'context-window';
  if (slug === 'permissions-mode' || slug === 'permissionsmode') return 'permission-mode';
  return slug;
}

interface ParsedNode {
  slug: string;
  title: string;
  description: string;
  body: string;
  prose: string;
  aliases: string[];
  links: string[];
  usage: string[];
  avoid: string;
  heardInTheWild?: {
    user: string;
    agent: string;
  };
  section: number;
  inDegree: number;
  layout: [number, number, number];
}

interface ParsedSection {
  index: number;
  title: string;
  centroid: [number, number, number];
  radius: number;
  paperColor?: string;
  slugs: string[];
}

function parseMarkdownFile(markdownText: string) {
  const sections: ParsedSection[] = [];
  const nodes: ParsedNode[] = [];
  const nodeMap = new Map<string, ParsedNode>();

  const sectionBlocks = markdownText
    .split(/\n(?=##\s+Section\s+\d+)/g)
    .filter((b) => b.trim().startsWith('## Section'));

  if (sectionBlocks.length > 0) {
    sectionBlocks.forEach((secBlock, secIdx) => {
      const lines = secBlock.split('\n');
      const headerLine = lines[0];
      const secTitleMatch = headerLine.match(/##\s+Section\s+(\d+)\s+[—-]\s*(.+)/);
      const secNum = secTitleMatch ? parseInt(secTitleMatch[1], 10) - 1 : secIdx;
      const safeSecNum = Math.max(0, Math.min(6, secNum));
      const secMeta = SECTION_METADATA[safeSecNum] || {
        index: safeSecNum,
        title: secTitleMatch ? secTitleMatch[2].trim() : `Section ${safeSecNum + 1}`,
        centroid: [0, 0, 0] as [number, number, number],
        radius: 150,
        paperColor: '#4500B3',
      };

      const termBlocks = secBlock
        .split(/\n(?=###\s+)/g)
        .filter((b) => b.trim().startsWith('### '));
      const sectionSlugs: string[] = [];

      for (const termBlock of termBlocks) {
        const termLines = termBlock.trim().split('\n');
        const titleMatch = termLines[0].match(/###\s+(.+)/);
        if (!titleMatch) continue;

        const rawTitle = titleMatch[1].trim();
        const slug = normalizeSlug(rawTitle.replace(/\s+/g, '-'));
        sectionSlugs.push(slug);

        const fullBody = termLines.slice(1).join('\n').trim();

        // 1. Full first paragraph as description
        const paragraphs = fullBody.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        const firstPara = paragraphs[0]
          ? paragraphs[0].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '')
          : '';
        const description = firstPara;

        // 2. Extract Avoid / اجتناب
        let avoid = '';
        const avoidMatch = fullBody.match(
          /_(?:اجتناب|Avoid):_\s*([^\n]+(?:\n(?!(?:_کاربرد:|_Usage:|###)).+)*)/
        );
        if (avoidMatch) {
          avoid = avoidMatch[1].replace(/^[«"]|[»"]$/g, '').trim();
        }

        // 3. Extract Usage / کاربرد
        const usage: string[] = [];
        const usageMatch = fullBody.match(/_(?:کاربرد|Usage):_\s*([\s\S]*)$/);
        if (usageMatch) {
          const usageLines = usageMatch[1]
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.startsWith('«') || l.startsWith('"') || l.startsWith('“'));

          usageLines.forEach((l) => {
            const cleanQuote = l.replace(/^[«"“]\s*/, '').replace(/\s*[»"”]$/, '').trim();
            if (cleanQuote) usage.push(cleanQuote);
          });
        }

        // 4. Extract Heard In The Wild dialogue
        let heardInTheWild: { user: string; agent: string } | undefined;
        const wildMatch = fullBody.match(
          /(?:###\s*)?(?:Heard in the wild|شنیده شده در عمل)[^]*?(?:\*\*User\*\*|\*\*کاربر\*\*):\s*["«]([^"»\n]+)["»][^]*?(?:\*\*Agent\*\*|\*\*دستیار\*\*):\s*["«]([^"»\n]+)["»]/i
        );
        if (wildMatch) {
          heardInTheWild = {
            user: wildMatch[1].trim(),
            agent: wildMatch[2].trim(),
          };
        }

        // 5. Extract Hyperlinks
        const links: string[] = [];
        const linkRegex = /\[([^\]]+)\]\((?:#([a-zA-Z0-9_-]+)|(?:\.\/|\.\.\/)?([^)]+?)\.md)\)/gi;
        let match: RegExpExecArray | null;
        while ((match = linkRegex.exec(fullBody)) !== null) {
          const targetSlug = normalizeSlug(match[2] || match[3]);
          if (targetSlug && targetSlug !== slug && !links.includes(targetSlug)) {
            links.push(targetSlug);
          }
        }

        // 6. Clean Prose
        const prose = fullBody
          .replace(/_(?:اجتناب|Avoid):_[\s\S]*?(?=_(?:کاربرد|Usage):_|$)/g, '')
          .replace(/_(?:کاربرد|Usage):_[\s\S]*$/g, '')
          .trim();

        const nodeObj: ParsedNode = {
          slug,
          title: rawTitle,
          description,
          body: fullBody,
          prose,
          aliases: [rawTitle.toLowerCase()],
          links,
          usage,
          avoid,
          heardInTheWild,
          section: safeSecNum,
          inDegree: 0,
          layout: [0, 0, 0],
        };

        nodes.push(nodeObj);
        nodeMap.set(slug, nodeObj);
      }

      sections.push({
        ...secMeta,
        slugs: sectionSlugs,
      });
    });
  }

  return { sections, nodes, nodeMap };
}

async function main() {
  console.log('🚀 Starting Codebase Markdown Knowledge Graph Builder...');

  const rootDir = process.cwd();
  const possiblePaths = [
    path.join(rootDir, 'README.md'),
    path.join(rootDir, 'DICTIONARY.md'),
    path.join(rootDir, 'dictionary.md'),
    path.join(rootDir, 'src', 'data', 'README.md'),
  ];

  let mdContent = '';
  let foundPath = '';

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('## Section') || content.includes('### ')) {
        mdContent = content;
        foundPath = p;
        break;
      }
    }
  }

  // Also check if dictionary directory with individual files exists
  const dictDir = path.join(rootDir, 'dictionary');
  if (!mdContent && fs.existsSync(dictDir)) {
    const files = fs.readdirSync(dictDir).filter((f) => f.endsWith('.md'));
    if (files.length > 0) {
      console.log(`📂 Found ${files.length} .md files in ${dictDir}`);
      mdContent = files
        .map((f) => fs.readFileSync(path.join(dictDir, f), 'utf8'))
        .join('\n\n');
      foundPath = dictDir;
    }
  }

  let nodes: ParsedNode[] = [];
  let sections: ParsedSection[] = [];
  let nodeMap = new Map<string, ParsedNode>();

  if (mdContent) {
    console.log(`📖 Parsing Markdown source from: ${foundPath}`);
    const result = parseMarkdownFile(mdContent);
    nodes = result.nodes;
    sections = result.sections;
    nodeMap = result.nodeMap;
  }

  // Fallback if no valid MD found: load existing dictionaryData
  if (nodes.length === 0) {
    console.log('ℹ️ No external Markdown file found. Bundling baseline dictionary dataset...');
    const { DICTIONARY_NODES, DICTIONARY_SECTIONS } = await import(
      '../src/data/dictionaryData'
    );
    nodes = DICTIONARY_NODES.map((n) => ({ ...n }));
    sections = DICTIONARY_SECTIONS.map((s) => ({ ...s }));
    nodes.forEach((n) => nodeMap.set(n.slug, n));
  }

  // Calculate InDegree
  for (const node of nodes) {
    for (const targetSlug of node.links) {
      const target = nodeMap.get(targetSlug);
      if (target) {
        target.inDegree += 1;
      }
    }
  }

  // Compute 3D Coordinates (Centroid clustering + inDegree radius distribution)
  const SPHERE_MAX_RADIUS = 135;
  const nodesPerSection: Record<number, ParsedNode[]> = {};
  for (const node of nodes) {
    const s = node.section % SECTION_METADATA.length;
    if (!nodesPerSection[s]) nodesPerSection[s] = [];
    nodesPerSection[s].push(node);
  }

  for (const secIndex in nodesPerSection) {
    const secNodes = nodesPerSection[secIndex];
    const sNum = parseInt(secIndex, 10);
    const meta = SECTION_METADATA[sNum] || SECTION_METADATA[0];
    const [cx, cy, cz] = meta.centroid;

    secNodes.forEach((node, idx) => {
      // Golden spiral distribution on sphere sector
      const phi = Math.acos(1 - (2 * (idx + 0.5)) / secNodes.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
      const r = 25 + Math.min(65, (node.inDegree || 1) * 6 + (idx % 3) * 12);

      let x = cx + r * Math.sin(phi) * Math.cos(theta);
      let y = cy + r * Math.sin(phi) * Math.sin(theta);
      let z = cz + r * Math.cos(phi);

      const dist = Math.hypot(x, y, z);
      if (dist > SPHERE_MAX_RADIUS) {
        const factor = SPHERE_MAX_RADIUS / dist;
        x *= factor;
        y *= factor;
        z *= factor;
      }

      node.layout = [parseFloat(x.toFixed(2)), parseFloat(y.toFixed(2)), parseFloat(z.toFixed(2))];
    });
  }

  // Generate Bézier edges
  const edges: { source: string; target: string; control: [number, number, number] }[] = [];
  for (const node of nodes) {
    for (const targetSlug of node.links) {
      const targetNode = nodeMap.get(targetSlug);
      if (targetNode) {
        const [x1, y1, z1] = node.layout;
        const [x2, y2, z2] = targetNode.layout;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const mz = (z1 + z2) / 2;
        const len = Math.hypot(x2 - x1, y2 - y1, z2 - z1);
        const perpFactor = Math.min(22, len * 0.18);
        const cx = mx + (Math.random() - 0.5) * perpFactor;
        const cy = my + 10 + Math.random() * perpFactor;
        const cz = mz + (Math.random() - 0.5) * perpFactor;

        edges.push({
          source: node.slug,
          target: targetSlug,
          control: [parseFloat(cx.toFixed(2)), parseFloat(cy.toFixed(2)), parseFloat(cz.toFixed(2))],
        });
      }
    }
  }

  // Write src/data/graph-data.json
  const dataDir = path.join(rootDir, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputJsonPath = path.join(dataDir, 'graph-data.json');
  fs.writeFileSync(
    outputJsonPath,
    JSON.stringify({ sections, nodes, edges }, null, 2),
    'utf8'
  );
  console.log(`✅ Saved ${nodes.length} nodes & ${edges.length} edges to: ${outputJsonPath}`);

  // Write src/data/generatedGraph.ts
  const outputTsPath = path.join(dataDir, 'generatedGraph.ts');
  const tsContent = `/**
 * AUTO-GENERATED FILE — Generated by scripts/buildGraphFromMarkdown.ts
 * Do not edit directly. Edit your markdown file (README.md) and run \`npm run build:graph\`.
 */

export const GENERATED_GRAPH = ${JSON.stringify({ sections, nodes, edges }, null, 2)} as const;

export default GENERATED_GRAPH;
`;
  fs.writeFileSync(outputTsPath, tsContent, 'utf8');
  console.log(`✅ Generated TypeScript graph module at: ${outputTsPath}`);
  console.log('🎉 Graph build completed successfully!');
}

main().catch((err) => {
  console.error('❌ Build graph failed:', err);
  process.exit(1);
});
