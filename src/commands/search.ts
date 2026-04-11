import { defineCommand } from "citty";

export const search = defineCommand({
  meta: { name: "search", description: "Search documents via ir" },
  args: {
    query: {
      type: "positional",
      description: "search query",
      required: true,
    },
  },
  run({ args }) {
    console.log(`search: ${args.query}`);
  },
});
