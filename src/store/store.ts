import type Database from "better-sqlite3";
import { z } from "zod/v4";
import type { Graph } from "../graph/graph";
import {
  type DocumentChanges,
  type DocumentContent,
  type SyncEntry,
  documentContentRow,
  edgeRow,
  pathRow,
} from "./types";
import { parsePaths } from "./utils";

function ensureSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS aeira_edges (
      source_path TEXT NOT NULL,
      target_path TEXT NOT NULL,
      PRIMARY KEY (source_path, target_path)
    );
    CREATE TABLE IF NOT EXISTS aeira_sync_state (
      source_path TEXT PRIMARY KEY,
      hash TEXT NOT NULL
    );
  `);
}

export interface Store {
  loadEdges(): Graph;
  getChangedDocuments(): DocumentChanges;
  getActiveDocumentPaths(): string[];
  readDocumentContents(paths: string[]): DocumentContent[];
  purgeDocuments(sourcePaths: string[]): void;
  syncDocuments(entries: SyncEntry[]): void;
}

export function createStore(database: Database.Database): Store {
  ensureSchema(database);

  const insertEdge = database.prepare(
    "INSERT INTO aeira_edges (source_path, target_path) VALUES (?, ?)",
  );
  const insertSyncState = database.prepare(
    "INSERT INTO aeira_sync_state (source_path, hash) VALUES (?, ?)",
  );
  const selectAllEdges = database.prepare("SELECT source_path, target_path FROM aeira_edges");
  const selectActiveDocuments = database.prepare("SELECT path FROM documents WHERE active = 1");
  const selectAddedDocuments = database.prepare(`
    SELECT d.path FROM documents d
    LEFT JOIN aeira_sync_state s ON d.path = s.source_path
    WHERE d.active = 1 AND s.source_path IS NULL
  `);
  const selectChangedDocuments = database.prepare(`
    SELECT d.path FROM documents d
    JOIN aeira_sync_state s ON d.path = s.source_path
    WHERE d.active = 1 AND d.hash != s.hash
  `);
  const selectRemovedDocuments = database.prepare(`
    SELECT s.source_path as path FROM aeira_sync_state s
    LEFT JOIN documents d ON s.source_path = d.path AND d.active = 1
    WHERE d.id IS NULL
  `);
  const readDocumentContent = database.prepare(
    "SELECT d.path, c.doc as content, d.hash FROM documents d JOIN content c ON d.hash = c.hash WHERE d.active = 1 AND d.path = ?",
  );
  const deleteEdgesBySource = database.prepare("DELETE FROM aeira_edges WHERE source_path = ?");
  const deleteSyncStateBySource = database.prepare(
    "DELETE FROM aeira_sync_state WHERE source_path = ?",
  );

  return {
    loadEdges(): Graph {
      const rows = z.array(edgeRow).parse(selectAllEdges.all());

      const activeDocumentPaths = new Set(
        z
          .array(pathRow)
          .parse(selectActiveDocuments.all())
          .map((row) => row.path),
      );

      const nodes = new Set<string>(activeDocumentPaths);
      const dangling = new Set<string>();
      const outgoing = new Map<string, Set<string>>();
      const incoming = new Map<string, Set<string>>();

      for (const { source_path, target_path } of rows) {
        nodes.add(source_path);
        nodes.add(target_path);

        if (!activeDocumentPaths.has(target_path)) {
          dangling.add(target_path);
        }

        let targets = outgoing.get(source_path);
        if (!targets) {
          targets = new Set();
          outgoing.set(source_path, targets);
        }
        targets.add(target_path);

        let sources = incoming.get(target_path);
        if (!sources) {
          sources = new Set();
          incoming.set(target_path, sources);
        }
        sources.add(source_path);
      }

      return { nodes, dangling, outgoing, incoming };
    },

    getChangedDocuments(): DocumentChanges {
      return {
        added: parsePaths(selectAddedDocuments.all()),
        changed: parsePaths(selectChangedDocuments.all()),
        removed: parsePaths(selectRemovedDocuments.all()),
      };
    },

    getActiveDocumentPaths(): string[] {
      return parsePaths(selectActiveDocuments.all());
    },

    readDocumentContents(paths: string[]): DocumentContent[] {
      const results: DocumentContent[] = [];
      for (const path of paths) {
        const raw = readDocumentContent.get(path);
        if (raw) {
          results.push(documentContentRow.parse(raw));
        }
      }
      return results;
    },

    purgeDocuments(sourcePaths: string[]): void {
      database.transaction(() => {
        for (const path of sourcePaths) {
          deleteEdgesBySource.run(path);
          deleteSyncStateBySource.run(path);
        }
      })();
    },

    syncDocuments(entries: SyncEntry[]): void {
      database.transaction(() => {
        for (const entry of entries) {
          for (const targetPath of entry.targetPaths) {
            insertEdge.run(entry.sourcePath, targetPath);
          }
          insertSyncState.run(entry.sourcePath, entry.hash);
        }
      })();
    },
  };
}
