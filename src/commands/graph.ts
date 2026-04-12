import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import Database from "better-sqlite3";
import { defineCommand } from "citty";
import { type Direction, type Graph, findPaths, neighbors, snapshot } from "../graph";
import { createReadonlyStore, getCollectionDbPath } from "../store";

function openGraph(source: string): { database: Database.Database; graph: Graph } {
  const sourcePath = resolve(source);
  const collection = basename(sourcePath);
  const dbPath = getCollectionDbPath(collection);

  if (!existsSync(dbPath)) {
    console.error(`Collection not found: ${collection}. Run 'aeira sync ${source}' first.`);
    process.exit(1);
  }

  const database = new Database(dbPath, { readonly: true });
  const store = createReadonlyStore(database);
  const graph = store.loadEdges();
  return { database, graph };
}

const validDirections = new Set<string>(["outgoing", "incoming", "both"]);

const neighborsCommand = defineCommand({
  meta: { name: "neighbors", description: "List 1-hop neighbors of a node" },
  args: {
    source: { type: "positional", description: "source directory path", required: true },
    node: { type: "positional", description: "target node", required: true },
    direction: { type: "string", description: "outgoing | incoming | both", default: "both" },
    json: { type: "boolean", description: "output as JSON", default: false },
  },
  run({ args }) {
    if (!validDirections.has(args.direction)) {
      console.error(`Invalid direction: ${args.direction}. Must be outgoing, incoming, or both.`);
      process.exit(1);
    }

    const { database, graph } = openGraph(args.source);
    try {
      const result = neighbors(graph, args.node, args.direction as Direction);
      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        for (const node of result) console.log(node);
      }
    } finally {
      database.close();
    }
  },
});

const pathCommand = defineCommand({
  meta: { name: "path", description: "Find all paths between two nodes" },
  args: {
    source: { type: "positional", description: "source directory path", required: true },
    from: { type: "positional", description: "start node", required: true },
    to: { type: "positional", description: "end node", required: true },
    "max-paths": { type: "string", description: "max number of paths", default: "20" },
    json: { type: "boolean", description: "output as JSON", default: false },
  },
  run({ args }) {
    const { database, graph } = openGraph(args.source);
    try {
      const maxPaths = Number.parseInt(args["max-paths"], 10);
      const result = findPaths(graph, args.from, args.to, maxPaths);
      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        for (const pathNodes of result) console.log(pathNodes.join(" → "));
      }
    } finally {
      database.close();
    }
  },
});

const allCommand = defineCommand({
  meta: { name: "all", description: "Show entire graph" },
  args: {
    source: { type: "positional", description: "source directory path", required: true },
    json: { type: "boolean", description: "output as JSON", default: false },
  },
  run({ args }) {
    const { database, graph } = openGraph(args.source);
    try {
      const result = snapshot(graph);
      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const nodesInEdges = new Set(result.edges.flatMap(([source, target]) => [source, target]));
        for (const [source, target] of result.edges) console.log(`${source} → ${target}`);
        for (const node of result.nodes) {
          if (!nodesInEdges.has(node)) console.log(node);
        }
      }
    } finally {
      database.close();
    }
  },
});

export const graph = defineCommand({
  meta: { name: "graph", description: "Query wikilink graph" },
  subCommands: { neighbors: neighborsCommand, path: pathCommand, all: allCommand },
});
