import { defineCommand } from "citty";

export const graph = defineCommand({
  meta: { name: "graph", description: "Query wikilink graph" },
  args: {
    query: {
      type: "positional",
      description: "graph query",
      required: true,
    },
  },
  run({ args }) {
    console.log(`graph: ${args.query}`);
  },
});
