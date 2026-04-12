import { describe, expect, it } from "vitest";
import type { Graph } from "./graph";
import { findPaths, neighbors, snapshot } from "./query";

function makeGraph(options: {
  nodes?: string[];
  dangling?: string[];
  edges?: [string, string][];
}): Graph {
  const nodes = new Set(options.nodes ?? []);
  const dangling = new Set(options.dangling ?? []);
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();

  for (const [source, target] of options.edges ?? []) {
    nodes.add(source);
    nodes.add(target);
    if (!outgoing.has(source)) outgoing.set(source, new Set());
    outgoing.get(source)!.add(target);
    if (!incoming.has(target)) incoming.set(target, new Set());
    incoming.get(target)!.add(source);
  }

  return { nodes, dangling, outgoing, incoming };
}

describe("neighbors", () => {
  const graph = makeGraph({
    edges: [
      ["a.md", "b.md"],
      ["a.md", "c.md"],
      ["d.md", "a.md"],
    ],
  });

  it("returns outgoing neighbors sorted", () => {
    expect(neighbors(graph, "a.md", "outgoing")).toEqual(["b.md", "c.md"]);
  });

  it("returns incoming neighbors", () => {
    expect(neighbors(graph, "a.md", "incoming")).toEqual(["d.md"]);
  });

  it("returns both directions sorted by default", () => {
    expect(neighbors(graph, "a.md")).toEqual(["b.md", "c.md", "d.md"]);
  });

  it("returns empty array for unknown node", () => {
    expect(neighbors(graph, "unknown.md")).toEqual([]);
  });

  it("deduplicates nodes appearing in both directions", () => {
    const cyclic = makeGraph({
      edges: [
        ["a.md", "b.md"],
        ["b.md", "a.md"],
      ],
    });
    expect(neighbors(cyclic, "a.md", "both")).toEqual(["b.md"]);
  });
});

describe("findPaths", () => {
  it("finds a direct path", () => {
    const graph = makeGraph({ edges: [["a.md", "b.md"]] });
    expect(findPaths(graph, "a.md", "b.md")).toEqual([["a.md", "b.md"]]);
  });

  it("finds a multi-hop path", () => {
    const graph = makeGraph({
      edges: [
        ["a.md", "b.md"],
        ["b.md", "c.md"],
      ],
    });
    expect(findPaths(graph, "a.md", "c.md")).toEqual([["a.md", "b.md", "c.md"]]);
  });

  it("finds multiple paths", () => {
    const graph = makeGraph({
      edges: [
        ["a.md", "b.md"],
        ["a.md", "c.md"],
        ["b.md", "d.md"],
        ["c.md", "d.md"],
      ],
    });
    const result = findPaths(graph, "a.md", "d.md");
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        ["a.md", "b.md", "d.md"],
        ["a.md", "c.md", "d.md"],
      ]),
    );
  });

  it("returns empty when no path exists", () => {
    const graph = makeGraph({
      edges: [
        ["a.md", "b.md"],
        ["c.md", "d.md"],
      ],
    });
    expect(findPaths(graph, "a.md", "d.md")).toEqual([]);
  });

  it("handles cycles without infinite loop", () => {
    const graph = makeGraph({
      edges: [
        ["a.md", "b.md"],
        ["b.md", "c.md"],
        ["c.md", "a.md"],
        ["c.md", "d.md"],
      ],
    });
    expect(findPaths(graph, "a.md", "d.md")).toEqual([["a.md", "b.md", "c.md", "d.md"]]);
  });

  it("respects maxPaths limit", () => {
    const graph = makeGraph({
      edges: [
        ["a.md", "b.md"],
        ["a.md", "c.md"],
        ["a.md", "d.md"],
        ["b.md", "e.md"],
        ["c.md", "e.md"],
        ["d.md", "e.md"],
      ],
    });
    expect(findPaths(graph, "a.md", "e.md", 2)).toHaveLength(2);
  });

  it("returns single-element path when from equals to", () => {
    const graph = makeGraph({ nodes: ["a.md"] });
    expect(findPaths(graph, "a.md", "a.md")).toEqual([["a.md"]]);
  });
});

describe("snapshot", () => {
  it("returns sorted nodes and edges", () => {
    const graph = makeGraph({
      edges: [
        ["c.md", "a.md"],
        ["a.md", "b.md"],
      ],
    });
    const result = snapshot(graph);
    expect(result.nodes).toEqual(["a.md", "b.md", "c.md"]);
    expect(result.edges).toEqual([
      ["a.md", "b.md"],
      ["c.md", "a.md"],
    ]);
  });

  it("includes isolated nodes", () => {
    const graph = makeGraph({ nodes: ["a.md", "b.md"] });
    expect(snapshot(graph).nodes).toEqual(["a.md", "b.md"]);
    expect(snapshot(graph).edges).toEqual([]);
  });
});
