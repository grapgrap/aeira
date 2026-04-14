import { existsSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import { defineCommand } from "citty";
import { neighbors } from "../graph";
import { searchCollection } from "../ir";
import { resolveVault } from "../registry";
import { createReadonlyStore, getCollectionDbPath } from "../store";

export const search = defineCommand({
  meta: { name: "search", description: "Search documents via ir" },
  args: {
    query: { type: "positional", description: "search query", required: true },
    source: {
      type: "string",
      description: "source directory path",
      alias: "s",
      default: process.cwd(),
    },
    json: { type: "boolean", description: "output as JSON", default: false },
  },
  run({ args }) {
    const sourcePath = resolve(args.source);
    const vault = resolveVault(sourcePath);
    const collection = vault.name;
    const dbPath = getCollectionDbPath(collection);

    if (!existsSync(dbPath)) {
      console.error(`Collection not found: ${collection}. Run 'aeira sync' first.`);
      process.exit(1);
    }

    const results = searchCollection(collection, args.query);

    if (results.length === 0) {
      console.log("No results found.");
      return;
    }

    const database = new Database(dbPath, { readonly: true });

    try {
      const store = createReadonlyStore(database);
      const graph = store.loadEdges();

      if (args.json) {
        const output = results.map((result) => ({
          path: result.path,
          title: result.title,
          score: result.score,
          snippet: result.snippet ?? undefined,
          links: neighbors(graph, result.path, "outgoing"),
        }));
        console.log(JSON.stringify(output, null, 2));
      } else {
        for (let index = 0; index < results.length; index++) {
          const result = results[index];
          const links = neighbors(graph, result.path, "outgoing");
          console.log(`[${result.score.toFixed(2)}] ${result.path}`);
          for (const link of links) console.log(`  → ${link}`);
          if (index < results.length - 1) console.log();
        }
      }
    } finally {
      database.close();
    }
  },
});
