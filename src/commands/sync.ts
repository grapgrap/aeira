import { defineCommand } from "citty";

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
    console.log(`sync: ${args.source}`);
  },
});
