import fs from "fs";

let markdown = "";
try {
  markdown = fs.readFileSync("./README.md", "utf-8");
} catch (e) {
  console.log("ℹ️ Note: ./README.md not found, using template.");
}

const SECTION_METADATA = [
  { index: 0, title: "The Model (مدل)", centroid: [98.83, 0.34, 3.36], radius: 166.74 },
  { index: 1, title: "Sessions, Context Windows & Turns (نشستها، پنجرههای بافت و نوبتها)", centroid: [29.76, 7.42, 59.83], radius: 109.74 },
  { index: 2, title: "Tools & Environment (ابزارها و محیط)", centroid: [-26.97, 20.84, 117.14], radius: 158.8 },
  { index: 3, title: "Failure Modes (حالتهای شکست)", centroid: [-132.16, -13.75, 55.28], radius: 159.0 },
  { index: 4, title: "Handoffs (تحویلها)", centroid: [-86.02, -17.65, -36.43], radius: 181.52 },
  { index: 5, title: "Memory and Steering (حافظه و هدایت)", centroid: [-49.93, -10.37, -119.57], radius: 106.85 },
  { index: 6, title: "Patterns of Work (الگوهای کار)", centroid: [64.85, 6.5, -105.11], radius: 180.51 }
];

export function normalizeSlug(raw) {
  if (!raw) return "";
  let slug = raw.toLowerCase().trim().replace(/^#/, "").replace(/\.md$/, "");
  if (slug === "agentsmd" || slug === "agents.md" || slug === "agents-md") return "agents";
  if (slug === "context-windows" || slug === "contextwindows") return "context-window";
  if (slug === "permissions-mode" || slug === "permissionsmode") return "permission-mode";
  return slug;
}

export function parsePersianMarkdown(markdownText) {
  const sections = [];
  const nodes = [];
  const nodeMap = new Map();

  const sectionBlocks = markdownText
    .split(/\n(?=##\s+Section\s+\d+)/g)
    .filter((b) => b.trim().startsWith("## Section"));

  sectionBlocks.forEach((secBlock, secIdx) => {
    const lines = secBlock.split("\n");
    const headerLine = lines[0];
    const secTitleMatch = headerLine.match(/##\s+Section\s+(\d+)\s+[—-]\s*(.+)/);
    const secNum = secTitleMatch ? parseInt(secTitleMatch[1], 10) - 1 : secIdx;
    const secMeta = SECTION_METADATA[secNum] || {
      index: secNum,
      title: secTitleMatch ? secTitleMatch[2].trim() : `Section ${secNum + 1}`,
      centroid: [0, 0, 0],
      radius: 150,
    };

    const termBlocks = secBlock.split(/\n(?=###\s+)/g).filter((b) => b.trim().startsWith("### "));
    const sectionSlugs = [];

    for (const termBlock of termBlocks) {
      const termLines = termBlock.trim().split("\n");
      const titleMatch = termLines[0].match(/###\s+(.+)/);
      if (!titleMatch) continue;

      const rawTitle = titleMatch[1].trim();
      const slug = normalizeSlug(rawTitle.replace(/\s+/g, "-"));
      sectionSlugs.push(slug);

      const fullBody = termLines.slice(1).join("\n").trim();

      // 1. Full First Paragraph as Description (NO slicing)
      const paragraphs = fullBody.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      const firstPara = paragraphs[0]
        ? paragraphs[0].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "")
        : "";
      const description = firstPara;

      // 2. Extract "Avoid" / "اجتناب"
      let avoid = "";
      const avoidMatch = fullBody.match(
        /_(?:اجتناب|Avoid):_\s*([^\n]+(?:\n(?!(?:_کاربرد:|_Usage:|###)).+)*)/
      );
      if (avoidMatch) {
        avoid = avoidMatch[1].replace(/^[«"]|[»"]$/g, "").trim();
      }

      // 3. Extract "Usage" / "کاربرد" by line to handle nested quotes correctly
      const usage = [];
      const usageMatch = fullBody.match(/_(?:کاربرد|Usage):_\s*([\s\S]*)$/);
      if (usageMatch) {
        const usageLines = usageMatch[1]
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("«") || l.startsWith('"') || l.startsWith("“"));

        usageLines.forEach((l) => {
          // Strip outermost quotes only
          const cleanQuote = l.replace(/^[«"“]\s*/, "").replace(/\s*[»"”]$/, "").trim();
          if (cleanQuote) usage.push(cleanQuote);
        });
      }

      // 4. Extract Links
      const links = [];
      const linkRegex = /\[([^\]]+)\]\((?:#([a-zA-Z0-9_-]+)|\.\/([^)]+)\.md)\)/g;
      let match;
      while ((match = linkRegex.exec(fullBody)) !== null) {
        const targetSlug = normalizeSlug(match[2] || match[3]);
        if (targetSlug && targetSlug !== slug && !links.includes(targetSlug)) {
          links.push(targetSlug);
        }
      }

      // 5. Clean Prose for Markdown Full Definition (keeping tables & text intact)
      const prose = fullBody
        .replace(/_(?:اجتناب|Avoid):_[\s\S]*?(?=_(?:کاربرد|Usage):_|$)/g, "")
        .replace(/_(?:کاربرد|Usage):_[\s\S]*$/g, "")
        .trim();

      const nodeObj = {
        slug,
        title: rawTitle,
        description,
        body: fullBody,
        prose,
        aliases: [],
        links,
        usage,
        avoid,
        section: secNum,
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

  // Calculate InDegrees & Edges
  const edges = [];
  for (const node of nodes) {
    for (const targetSlug of node.links) {
      const targetNode = nodeMap.get(targetSlug);
      if (targetNode) {
        targetNode.inDegree += 1;
        edges.push({
          source: node.slug,
          target: targetSlug,
          control: [0, 10, 0],
        });
      }
    }
  }

  return { sections, nodes, edges };
}

if (markdown.trim()) {
  const result = parsePersianMarkdown(markdown);
  fs.writeFileSync("./graph-data.json", JSON.stringify(result, null, 2), "utf-8");
  console.log(`✅ Generated clean graph data for ${result.nodes.length} nodes and ${result.edges.length} edges.`);
}
