import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { defineCommand } from "citty";
import { initCollection } from "../ir";
import { getCollectionDbPath } from "../store";

export const init = defineCommand({
  meta: { name: "init", description: "Initialize ir collection for source" },
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

    if (existsSync(dbPath)) {
      console.log(`Already initialized: ${collection}`);
      return;
    }

    initCollection(collection, sourcePath);
    console.log(`Initialized: ${collection}`);
  },
});
