import type Database from "better-sqlite3";
import { z } from "zod/v4";
import type { Graph } from "../graph/graph";
import { edgeRow, pathRow } from "./types";

export interface ReadonlyStore {
  loadEdges(): Graph;
}

export function createReadonlyStore(database: Database.Database): ReadonlyStore {
  const selectAllEdges = database.prepare("SELECT source_path, target_path FROM aeira_edges");
  const selectActiveDocuments = database.prepare("SELECT path FROM documents WHERE active = 1");

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
  };
}
