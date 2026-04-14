import { resolve } from "node:path";
import { defineCommand } from "citty";
import { initCollection } from "../ir";
import { addVault } from "../registry";

export const init = defineCommand({
  meta: { name: "init", description: "Initialize ir collection for source" },
  args: {
    source: {
      type: "positional",
      description: "source directory path",
      required: true,
    },
    name: {
      type: "positional",
      description: "vault name (used as ir collection name)",
      required: true,
    },
  },
  run({ args }) {
    const sourcePath = resolve(args.source);

    try {
      addVault(args.name, sourcePath);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        return;
      }
      throw error;
    }

    initCollection(args.name, sourcePath);
    console.log(`Initialized: ${args.name} (${sourcePath})`);
  },
});
