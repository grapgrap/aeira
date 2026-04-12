import { describe, expect, it } from "vitest";
import { buildGraph } from "./graph";
import type { ScannedDocument } from "../scanner";

describe("buildGraph", () => {
  it("creates nodes for all documents", () => {
    const docs: ScannedDocument[] = [
      { path: "a.md", content: "" },
      { path: "b.md", content: "" },
    ];
    expect(buildGraph(docs).nodes).toEqual(new Set(["a.md", "b.md"]));
  });

  it("creates directed edges from wikilinks", () => {
    const docs: ScannedDocument[] = [
      { path: "a.md", content: "links to [[b]]" },
      { path: "b.md", content: "" },
    ];
    const graph = buildGraph(docs);
    expect(graph.outgoing.get("a.md")).toEqual(new Set(["b.md"]));
    expect(graph.incoming.get("b.md")).toEqual(new Set(["a.md"]));
  });

  it("resolves targets to document paths via stem", () => {
    const docs: ScannedDocument[] = [
      { path: "a.md", content: "[[note]]" },
      { path: "sub/note.md", content: "" },
    ];
    expect(buildGraph(docs).outgoing.get("a.md")).toEqual(new Set(["sub/note.md"]));
  });

  it("resolves to first document when multiple files share the same stem", () => {
    const docs: ScannedDocument[] = [
      { path: "a.md", content: "[[note]]" },
      { path: "folder1/note.md", content: "" },
      { path: "folder2/note.md", content: "" },
    ];
    expect(buildGraph(docs).outgoing.get("a.md")).toEqual(new Set(["folder1/note.md"]));
  });

  it("adds dangling nodes for unresolved targets", () => {
    const docs: ScannedDocument[] = [{ path: "a.md", content: "[[nonexistent]]" }];
    const graph = buildGraph(docs);
    expect(graph.dangling.has("nonexistent")).toBe(true);
    expect(graph.outgoing.get("a.md")).toEqual(new Set(["nonexistent"]));
  });

  it("handles bidirectional links", () => {
    const docs: ScannedDocument[] = [
      { path: "a.md", content: "[[b]]" },
      { path: "b.md", content: "[[a]]" },
    ];
    const graph = buildGraph(docs);
    expect(graph.incoming.get("a.md")).toEqual(new Set(["b.md"]));
    expect(graph.incoming.get("b.md")).toEqual(new Set(["a.md"]));
  });

  it("creates no edges for documents with no links", () => {
    const graph = buildGraph([{ path: "a.md", content: "no links" }]);
    expect(graph.outgoing.size).toBe(0);
  });
});
