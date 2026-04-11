import { basename, resolve } from "node:path";
import Database from "better-sqlite3";
import { defineCommand } from "citty";
import { buildNameIndex } from "../graph";
import { createStore, getCollectionDbPath } from "../store";
import { parseWikiLinks } from "../wikilink";

export const sync = defineCommand({
  meta: { name: "sync", description: "Sync wikilink graph from source" },
  args: {
    source: {
      type: "positional",
      description: "source directory path",
      required: true,
    },
  },
  run({ args }) {
    const sourcePath = resolve(args.source);
    const collection = basename(sourcePath);
    const dbPath = getCollectionDbPath(collection);
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
