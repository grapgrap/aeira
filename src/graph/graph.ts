import { basename } from "node:path";
import type { ScannedDocument } from "../scanner";
import { parseWikiLinks } from "../wikilink";

export interface Graph {
  nodes: Set<string>;
  dangling: Set<string>;
  outgoing: Map<string, Set<string>>;
  incoming: Map<string, Set<string>>;
}

export function buildGraph(documents: ScannedDocument[]): Graph {
  const nameIndex = buildNameIndex(documents.map((d) => d.path));

  const nodes = new Set<string>();
  const dangling = new Set<string>();
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();

  for (const doc of documents) {
    nodes.add(doc.path);
  }

  for (const doc of documents) {
    for (const link of parseWikiLinks(doc.content)) {
      const targetPath = nameIndex.get(link.target);
      const resolved = targetPath ?? link.target;

      if (!targetPath) {
        nodes.add(resolved);
        dangling.add(resolved);
      }

      addToSetMap(outgoing, doc.path, resolved);
      addToSetMap(incoming, resolved, doc.path);
    }
  }

  return { nodes, dangling, outgoing, incoming };
}

export function buildNameIndex(paths: string[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const path of paths) {
    const stem = basename(path, ".md");
    if (!index.has(stem)) {
      index.set(stem, path);
    }
  }
  return index;
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string): void {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  set.add(value);
}
