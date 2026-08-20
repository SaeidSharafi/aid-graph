import MiniSearch from "minisearch";
import { nodes } from "../data/dictionary";

let miniSearchInstance: MiniSearch | null = null;

function sanitize(text: string | undefined): string {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

function getIndex(): MiniSearch {
  if (miniSearchInstance) return miniSearchInstance;

  const ms = new MiniSearch({
    idField: "slug",
    fields: ["title", "aliases", "description", "body", "usage", "avoid"],
    searchOptions: {
      boost: { title: 4, aliases: 2, description: 1.5 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: "OR",
    },
  });

  ms.addAll(
    nodes.map((n) => ({
      slug: n.slug,
      title: n.title,
      aliases: n.aliases.join(" "),
      description: sanitize(n.description),
      body: sanitize(n.body),
      usage: n.usage.map(sanitize).join(" "),
      avoid: sanitize(n.avoid),
    }))
  );

  miniSearchInstance = ms;
  return ms;
}

export function searchDictionary(query: string): { slugs: string[]; scores: Map<string, number> } {
  const q = query.trim();
  if (!q) return { slugs: [], scores: new Map() };

  const results = getIndex().search(q);
  if (results.length === 0) return { slugs: [], scores: new Map() };

  const topScore = results[0]?.score ?? 0;
  const threshold = topScore * 0.3;
  const matchedSlugs: string[] = [];
  const scoreMap = new Map<string, number>();

  for (const r of results) {
    if (r.score < threshold || matchedSlugs.length >= 15) break;
    matchedSlugs.push(r.id);
    scoreMap.set(r.id, r.score);
  }

  return { slugs: matchedSlugs, scores: scoreMap };
}