import type { Graph } from "./graph";

export type Direction = "outgoing" | "incoming" | "both";

export function neighbors(graph: Graph, node: string, direction: Direction = "both"): string[] {
  const outgoing = direction !== "incoming" ? graph.outgoing.get(node) : undefined;
  const incoming = direction !== "outgoing" ? graph.incoming.get(node) : undefined;
  return [...new Set([...(outgoing ?? []), ...(incoming ?? [])])];
}

export function findPaths(graph: Graph, from: string, to: string, maxPaths = 20): string[][] {
  const results: string[][] = [];

  function traverse(current: string, path: string[], visited: Set<string>): void {
    if (results.length >= maxPaths) return;
    if (current === to) {
      results.push([...path]);
      return;
    }

    const targets = graph.outgoing.get(current);
    if (!targets) return;

    for (const next of targets) {
      if (visited.has(next)) continue;
      visited.add(next);
      path.push(next);
      traverse(next, path, visited);
      path.pop();
      visited.delete(next);
    }
  }

  traverse(from, [from], new Set([from]));
  return results;
}

export interface GraphSnapshot {
  nodes: string[];
  edges: [string, string][];
}

export function snapshot(graph: Graph): GraphSnapshot {
  const nodes = [...graph.nodes].sort();
  const edges: [string, string][] = [];
  for (const [source, targets] of graph.outgoing) {
    for (const target of targets) {
      edges.push([source, target]);
    }
  }
  edges.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  return { nodes, edges };
}
