import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
    CREATE TABLE content (
      hash TEXT PRIMARY KEY,
      doc TEXT NOT NULL
    );
  `);
  return database;
}

function addDocument(database: Database.Database, path: string, hash: string, content = ""): void {
  database
    .prepare("INSERT INTO documents (path, title, hash) VALUES (?, ?, ?)")
    .run(path, path, hash);
  database.prepare("INSERT OR IGNORE INTO content (hash, doc) VALUES (?, ?)").run(hash, content);
}

describe("store", () => {
  let database: Database.Database;

  beforeEach(() => {
    database = createTestDatabase();
  });

  afterEach(() => {
    database.close();
  });

  describe("syncDocuments / loadEdges", () => {
    it("round-trips edges through sync and load", () => {
      addDocument(database, "a.md", "hash-a");
      addDocument(database, "b.md", "hash-b");
      const store = createStore(database);
      store.syncDocuments([{ sourcePath: "a.md", targetPaths: ["b.md"], hash: "hash-a" }]);

      const loaded = store.loadEdges();
      expect(loaded.outgoing.get("a.md")).toEqual(new Set(["b.md"]));
      expect(loaded.incoming.get("b.md")).toEqual(new Set(["a.md"]));
    });

    it("marks non-document targets as dangling", () => {
      addDocument(database, "a.md", "hash-a");
      const store = createStore(database);
      store.syncDocuments([{ sourcePath: "a.md", targetPaths: ["x"], hash: "hash-a" }]);

      expect(store.loadEdges().dangling.has("x")).toBe(true);
    });

    it("includes nodes with no edges", () => {
      addDocument(database, "a.md", "hash-a");
      addDocument(database, "b.md", "hash-b");
      const store = createStore(database);

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
