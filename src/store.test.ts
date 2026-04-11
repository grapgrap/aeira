import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Graph } from "./graph";
import { createStore } from "./store";

function createTestDatabase(): Database.Database {
  const database = new Database(":memory:");
  database.exec(`
    CREATE TABLE documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
  `);
  return database;
}

function addDocument(database: Database.Database, path: string, hash: string): void {
  database
    .prepare("INSERT INTO documents (path, title, hash) VALUES (?, ?, ?)")
    .run(path, path, hash);
}

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

describe("store", () => {
  let database: Database.Database;

  beforeEach(() => {
    database = createTestDatabase();
  });

  afterEach(() => {
    database.close();
  });

  describe("saveEdges / loadEdges", () => {
    it("round-trips a graph with edges", () => {
      addDocument(database, "a.md", "hash-a");
      addDocument(database, "b.md", "hash-b");
      const store = createStore(database);
      store.saveEdges(makeGraph({ nodes: ["a.md", "b.md"], edges: [["a.md", "b.md"]] }));

      const loaded = store.loadEdges();
      expect(loaded.outgoing.get("a.md")).toEqual(new Set(["b.md"]));
      expect(loaded.incoming.get("b.md")).toEqual(new Set(["a.md"]));
    });

    it("preserves dangling nodes on load", () => {
      addDocument(database, "a.md", "hash-a");
      const store = createStore(database);
      store.saveEdges(makeGraph({ nodes: ["a.md", "x"], dangling: ["x"], edges: [["a.md", "x"]] }));

      expect(store.loadEdges().dangling.has("x")).toBe(true);
    });

    it("includes nodes with no edges", () => {
      addDocument(database, "a.md", "hash-a");
      addDocument(database, "b.md", "hash-b");
      const store = createStore(database);
      store.saveEdges(makeGraph({ nodes: ["a.md", "b.md"] }));

      expect(store.loadEdges().nodes).toEqual(new Set(["a.md", "b.md"]));
    });
  });

  describe("getChangedDocuments", () => {
    it("detects added documents", () => {
      addDocument(database, "a.md", "hash-a");
      const store = createStore(database);
      expect(store.getChangedDocuments().added).toEqual(["a.md"]);
    });

    it("detects changed documents", () => {
      addDocument(database, "a.md", "hash-new");
      const store = createStore(database);
      database
        .prepare("INSERT INTO aeira_sync_state (source_path, hash) VALUES (?, ?)")
        .run("a.md", "hash-old");
      expect(store.getChangedDocuments().changed).toEqual(["a.md"]);
    });

    it("detects removed documents", () => {
      const store = createStore(database);
      database
        .prepare("INSERT INTO aeira_sync_state (source_path, hash) VALUES (?, ?)")
        .run("gone.md", "hash");
      expect(store.getChangedDocuments().removed).toEqual(["gone.md"]);
    });

    it("returns empty when nothing changed", () => {
      addDocument(database, "a.md", "hash-a");
      const store = createStore(database);
      database
        .prepare("INSERT INTO aeira_sync_state (source_path, hash) VALUES (?, ?)")
        .run("a.md", "hash-a");

      const changes = store.getChangedDocuments();
      expect(changes.added).toEqual([]);
      expect(changes.changed).toEqual([]);
      expect(changes.removed).toEqual([]);
    });
  });
});
