import * as fs from 'fs';
import * as path from 'path';

const SECTION_METADATA = [
  { index: 0, title: 'The Model (مدل)', centroid: [98.83, 0.34, 3.36] as [number, number, number], radius: 166.74 },
  { index: 1, title: 'Sessions, Context Windows & Turns (نشست‌ها، پنجره‌های زمینه و نوبت‌ها)', centroid: [29.76, 7.42, 59.83] as [number, number, number], radius: 109.74 },
  { index: 2, title: 'Tools & Environment (ابزارها و محیط)', centroid: [-26.97, 20.84, 117.14] as [number, number, number], radius: 158.8 },
  { index: 3, title: 'Failure Modes (حالت‌های شکست)', centroid: [-132.16, -13.75, 55.28] as [number, number, number], radius: 159.0 },
  { index: 4, title: 'Handoffs (تحویل‌ها)', centroid: [-86.02, -17.65, -36.43] as [number, number, number], radius: 181.52 },
  { index: 5, title: 'Memory and Steering (حافظه و هدایت)', centroid: [-49.93, -10.37, -119.57] as [number, number, number], radius: 106.85 },
  { index: 6, title: 'Patterns of Work (الگوهای کار)', centroid: [64.85, 6.5, -105.11] as [number, number, number], radius: 180.51 },
];

/**
 * Normalizes slugs while fully supporting Unicode / Persian letters and URL decoding
 */
function normalizeSlug(raw: string): string {
  if (!raw) return '';
  let s = decodeURIComponent(raw).toLowerCase().trim();
  s = s.replace(/^#/, '').replace(/\.md$/i, '').replace(/^\.\//, '');
  // Support Latin, Persian/Arabic (\p{L}), Numbers (\p{N}), Hyphens
  s = s.replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  if (s === 'agents-md' || s === 'agentsmd') return 'agentsmd';
  return s;
}

interface ParsedNode {
  slug: string;
  title: string;
  aliases: string[];
  description: string;
  fullDefinition: string;
  avoid?: string;
  heardInTheWild?: {
    user: string;
    agent?: string;
    dialogue?: string[];
  };
  links: string[];
  section: number;
  inDegree: number;
  layout: [number, number, number];
}

const USAGE_HEADER = `(?:[_*]{1,2}(?:(?:نمونه[\\s\\u200c]+)?کاربرد(?:[\\s\\u200c]+در[\\s\\u200c]+مکالمه)?|Usage|Heard\\s+in\\s+the\\s+wild)[:\\s]*[_*]{0,2})`;
const AVOID_HEADER = `(?:[_*]{1,2}(?:نباید[\\u200c\\s]*ها|Avoid)[:\\s]*[_*]{0,2})`;

function parseDictionaryMarkdown(mdText: string) {
  const sections: any[] = [];
  const nodes: ParsedNode[] = [];
  const nodeMap = new Map<string, ParsedNode>();

  // Split sections by ## Section or ## بخش
  const sectionChunks = mdText
    .split(/\n(?=##\s+(?:Section|بخش)\s+\d+)/gi)
    .filter((chunk) => chunk.trim().match(/^##\s+(?:Section|بخش)\s+\d+/i));

  sectionChunks.forEach((secChunk, secIdx) => {
    const lines = secChunk.split('\n');
    const headerLine = lines[0];
    const matchSec = headerLine.match(/##\s+(?:Section|بخش)\s+(\d+)\s*[—:-]\s*(.+)/i);
    const secNum = matchSec ? parseInt(matchSec[1], 10) - 1 : secIdx;
    const safeSecNum = Math.max(0, Math.min(6, secNum));
    const secMeta = SECTION_METADATA[safeSecNum];

    const termChunks = secChunk
      .split(/\n(?=###\s+)/g)
      .filter((chunk) => chunk.trim().startsWith('### '));

    const sectionSlugs: string[] = [];

    for (const termChunk of termChunks) {
      const termLines = termChunk.trim().split('\n');
      const titleMatch = termLines[0].match(/###\s+(.+)/);
      if (!titleMatch) continue;

      const rawTitle = titleMatch[1].trim();
      const slug = normalizeSlug(rawTitle);
      sectionSlugs.push(slug);

      let fullContent = termLines.slice(1).join('\n').trim();

      // Handle YAML Frontmatter if embedded
      let frontmatterDesc = '';
      const fmMatch = fullContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
      if (fmMatch) {
        const fmBody = fmMatch[1];
        const descMatch = fmBody.match(/description:\s*["']?([^"'\n\r]+)["']?/i);
        if (descMatch) {
          frontmatterDesc = descMatch[1].trim();
        }
        fullContent = fullContent.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trim();
      }

      // 1. Extract Links: matches both [Text](#slug) and [Text](./File%20Name.md)
      const links: string[] = [];
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let lMatch: RegExpExecArray | null;
      while ((lMatch = linkRegex.exec(fullContent)) !== null) {
        const rawTarget = lMatch[2].trim();
        const targetSlug = normalizeSlug(rawTarget);
        if (targetSlug && targetSlug !== slug && !links.includes(targetSlug)) {
          links.push(targetSlug);
        }
      }

      // 2. Extract Avoid / نبایدها (Supports bold, italics, ZWNJ, and various colons)
      let avoid: string | undefined;
      const avoidRegex = new RegExp(`${AVOID_HEADER}\\s*([\\s\\S]*?)(?=(?:\\n\\s*${USAGE_HEADER})|$)`, 'i');
      const avoidMatch = fullContent.match(avoidRegex);
      if (avoidMatch) {
        avoid = avoidMatch[1].trim();
      }

      // 3. Extract Dialogue (Heard In The Wild / کاربرد)
      let heardInTheWild: { user: string; agent?: string; dialogue?: string[] } | undefined;
      const usageRegex = new RegExp(`${USAGE_HEADER}\\s*([\\s\\S]*)$`, 'i');
      const usageMatch = fullContent.match(usageRegex);
      if (usageMatch) {
        const cleanQuotes = usageMatch[1]
          .split(/\n+/)
          .map((s) =>
            s
              .trim()
              .replace(/^[-*•]\s*/, '')
              .replace(/^[«"“]\s*/, '')
              .replace(/\s*[»"”]$/, '')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // تبدیل لینک‌های مارک‌داون به متن ساده برای رفع باگ رنگ مشکی
              .trim()
          )
          .filter((s) => s.length > 1);

        if (cleanQuotes.length >= 2) {
          heardInTheWild = {
            user: cleanQuotes[0],
            agent: cleanQuotes[1],
            dialogue: cleanQuotes,
          };
        } else if (cleanQuotes.length === 1) {
          heardInTheWild = { user: cleanQuotes[0], dialogue: cleanQuotes };
        }
      }

      // 4. Extract Prose Body (Clean description and fullDefinition)
      const rawBody = fullContent
        .replace(new RegExp(`${AVOID_HEADER}[\\s\\S]*?(?=(?:\\n\\s*${USAGE_HEADER})|$)`, 'gi'), '')
        .replace(new RegExp(`${USAGE_HEADER}[\\s\\S]*$`, 'gi'), '')
        .trim();

      const paragraphs = rawBody.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

      // استخراج درست description و fullDefinition
      let description = '';
      let fullDefinition = '';

      if (paragraphs[0]?.startsWith('>')) {
        description = paragraphs[0].replace(/^>\s*/, '').trim();
        fullDefinition = paragraphs.slice(1).join('\n\n');
      } else {
        description = frontmatterDesc || paragraphs[0] || '';
        fullDefinition = frontmatterDesc ? paragraphs.join('\n\n') : paragraphs.slice(1).join('\n\n');
      }

      const nodeObj: ParsedNode = {
        slug,
        title: rawTitle,
        aliases: [rawTitle.toLowerCase(), slug],
        description,
        fullDefinition,
        avoid,
        heardInTheWild,
        links,
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

  return { sections, nodes, nodeMap };
}

async function main() {
  console.log('🚀 Parsing Markdown Dictionary...');
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
      if ((content.includes('## Section') || content.includes('## بخش')) && content.includes('### ')) {
        mdContent = content;
        foundPath = p;
        break;
      }
    }
  }

  if (!mdContent) {
    console.error('❌ Could not find a Markdown dictionary file.');
    process.exit(1);
  }

  console.log(`📖 Found: ${foundPath}`);
  const { sections, nodes, nodeMap } = parseDictionaryMarkdown(mdContent);

  for (const node of nodes) {
    for (const targetSlug of node.links) {
      const target = nodeMap.get(targetSlug);
      if (target) target.inDegree += 1;
    }
  }

  // 3D Layout Coordinates
  const SPHERE_LIMIT = 135;
  const nodesBySection: Record<number, ParsedNode[]> = {};
  nodes.forEach((n) => {
    if (!nodesBySection[n.section]) nodesBySection[n.section] = [];
    nodesBySection[n.section].push(n);
  });

  for (const secKey in nodesBySection) {
    const secNodes = nodesBySection[secKey];
    const secIndex = parseInt(secKey, 10);
    const meta = SECTION_METADATA[secIndex] || SECTION_METADATA[0];
    const [cx, cy, cz] = meta.centroid;

    secNodes.forEach((node, idx) => {
      const phi = Math.acos(1 - (2 * (idx + 0.5)) / secNodes.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
      const r = 24 + Math.min(60, (node.inDegree || 1) * 4.5 + (idx % 3) * 10);

      let x = cx + r * Math.sin(phi) * Math.cos(theta);
      let y = cy + r * Math.sin(phi) * Math.sin(theta);
      let z = cz + r * Math.cos(phi);

      const dist = Math.hypot(x, y, z);
      if (dist > SPHERE_LIMIT) {
        const scale = SPHERE_LIMIT / dist;
        x *= scale; y *= scale; z *= scale;
      }

      node.layout = [parseFloat(x.toFixed(2)), parseFloat(y.toFixed(2)), parseFloat(z.toFixed(2))];
    });
  }

  // Generate Edges
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
        const curveFactor = Math.min(20, len * 0.16);

        edges.push({
          source: node.slug,
          target: targetSlug,
          control: [
            parseFloat((mx + (Math.random() - 0.5) * curveFactor).toFixed(2)),
            parseFloat((my + 8 + Math.random() * curveFactor).toFixed(2)),
            parseFloat((mz + (Math.random() - 0.5) * curveFactor).toFixed(2)),
          ],
        });
      }
    }
  }

  const outDir = path.join(rootDir, 'src', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, 'dictionary.json');
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ generatedFrom: path.basename(foundPath), sections, nodes, edges }, null, 2),
    'utf8'
  );

  console.log(`✅ Compiled ${nodes.length} terms to: ${jsonPath}`);
}

main().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});