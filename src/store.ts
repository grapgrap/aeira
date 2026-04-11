import { join } from "node:path";
import { homedir } from "node:os";
import type Database from "better-sqlite3";
import { z } from "zod/v4";
import type { Graph } from "./graph";

const hashRow = z.object({ hash: z.string() });
const edgeRow = z.object({ source_path: z.string(), target_path: z.string() });
const pathRow = z.object({ path: z.string() });

export interface DocumentChanges {
  added: string[];
  changed: string[];
  removed: string[];
}

const DEFAULT_IR_CONFIG_DIR = join(homedir(), ".config", "ir");

export function getCollectionDbPath(
  collectionName: string,
  irConfigDir = DEFAULT_IR_CONFIG_DIR,
): string {
  return join(irConfigDir, "collections", `${collectionName}.sqlite`);
}

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

function getStatements(database: Database.Database) {
  return {
    insertEdge: database.prepare(
      "INSERT INTO aeira_edges (source_path, target_path) VALUES (?, ?)",
    ),
    insertSyncState: database.prepare(
      "INSERT INTO aeira_sync_state (source_path, hash) VALUES (?, ?)",
    ),
    getDocumentHash: database.prepare("SELECT hash FROM documents WHERE path = ? AND active = 1"),
    selectAllEdges: database.prepare("SELECT source_path, target_path FROM aeira_edges"),
    selectActiveDocuments: database.prepare("SELECT path FROM documents WHERE active = 1"),
    selectAddedDocuments: database.prepare(`
      SELECT d.path FROM documents d
      LEFT JOIN aeira_sync_state s ON d.path = s.source_path
      WHERE d.active = 1 AND s.source_path IS NULL
    `),
    selectChangedDocuments: database.prepare(`
      SELECT d.path FROM documents d
      JOIN aeira_sync_state s ON d.path = s.source_path
      WHERE d.active = 1 AND d.hash != s.hash
    `),
    selectRemovedDocuments: database.prepare(`
      SELECT s.source_path as path FROM aeira_sync_state s
      LEFT JOIN documents d ON s.source_path = d.path AND d.active = 1
      WHERE d.id IS NULL
    `),
  };
}

function parsePaths(rows: unknown[]): string[] {
  return z
    .array(pathRow)
    .parse(rows)
    .map((row) => row.path);
}

export interface Store {
  saveEdges(graph: Graph): void;
  loadEdges(): Graph;
  getChangedDocuments(): DocumentChanges;
}

export function createStore(database: Database.Database): Store {
  ensureSchema(database);
  const statements = getStatements(database);

  return {
    saveEdges(graph: Graph): void {
      database.transaction(() => {
        database.exec("DELETE FROM aeira_edges");
        database.exec("DELETE FROM aeira_sync_state");

        for (const [sourcePath, targets] of graph.outgoing) {
          for (const targetPath of targets) {
            statements.insertEdge.run(sourcePath, targetPath);
          }
        }

        for (const nodePath of graph.nodes) {
          if (graph.dangling.has(nodePath)) continue;
          const raw = statements.getDocumentHash.get(nodePath);
          if (raw) {
            const row = hashRow.parse(raw);
            statements.insertSyncState.run(nodePath, row.hash);
          }
        }
      })();
    },

    loadEdges(): Graph {
      const rows = z.array(edgeRow).parse(statements.selectAllEdges.all());

      const activeDocumentPaths = new Set(
        z
          .array(pathRow)
          .parse(statements.selectActiveDocuments.all())
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
        added: parsePaths(statements.selectAddedDocuments.all()),
        changed: parsePaths(statements.selectChangedDocuments.all()),
        removed: parsePaths(statements.selectRemovedDocuments.all()),
      };
    },
  };
}
