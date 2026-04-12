import { basename } from "node:path";

export interface Graph {
  nodes: Set<string>;
  dangling: Set<string>;
  outgoing: Map<string, Set<string>>;
  incoming: Map<string, Set<string>>;
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
