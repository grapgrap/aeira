import { existsSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import { defineCommand } from "citty";
import { buildNameIndex } from "../graph";
import { initCollection, updateCollection } from "../ir";
import { resolveVault } from "../registry";
import { createStore, getCollectionDbPath } from "../store";
import { parseWikiLinks } from "../wikilink";

export const sync = defineCommand({
  meta: { name: "sync", description: "Sync wikilink graph from source" },
  args: {
    source: {
      type: "string",
      description: "source directory path",
      alias: "s",
      default: process.cwd(),
    },
  },
  run({ args }) {
    const sourcePath = resolve(args.source);
    const vault = resolveVault(sourcePath);
    const collection = vault.name;
    const dbPath = getCollectionDbPath(collection);
    if (!existsSync(dbPath)) {
      initCollection(collection, vault.path);
    } else {
      updateCollection(collection);
    }

    const db = new Database(dbPath);

    try {
      const store = createStore(db);
      const changes = store.getChangedDocuments();
      const total = changes.added.length + changes.changed.length + changes.removed.length;

      if (total === 0) {
        console.log("No changes detected.");
        return;
      }

      const allPaths = store.getActiveDocumentPaths();
      const nameIndex = buildNameIndex(allPaths);

      store.purgeDocuments([...changes.removed, ...changes.changed]);

      const affected = [...changes.changed, ...changes.added];
      const docs = store.readDocumentContents(affected);
      const entries = docs.map((doc) => {
        const links = parseWikiLinks(doc.content);
        const targetPaths = [
          ...new Set(links.map((link) => nameIndex.get(link.target) ?? link.target)),
        ];
        return { sourcePath: doc.path, targetPaths, hash: doc.hash };
      });
      store.syncDocuments(entries);

      console.log(
        `Synced: +${changes.added.length} ~${changes.changed.length} -${changes.removed.length}`,
      );
    } finally {
      db.close();
    }
  },
});
