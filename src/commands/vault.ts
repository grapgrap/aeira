import { resolve } from "node:path";
import { defineCommand } from "citty";
import { initCollection, removeCollection, renameCollection } from "../ir";
import { addVault, loadVaults, removeVault, renameVault } from "../registry";

const addCommand = defineCommand({
  meta: { name: "add", description: "Register a new vault" },
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

const listCommand = defineCommand({
  meta: { name: "list", description: "List all registered vaults" },
  run() {
    const vaults = loadVaults();

    if (vaults.length === 0) {
      console.log("No vaults registered.");
      return;
    }

    for (const vault of vaults) {
      console.log(`${vault.name}\t${vault.path}`);
    }
  },
});

const removeCommand = defineCommand({
  meta: { name: "remove", description: "Remove a vault and its ir collection" },
  args: {
    name: {
      type: "positional",
      description: "vault name to remove",
      required: true,
    },
  },
  run({ args }) {
    try {
      removeVault(args.name);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        return;
      }
      throw error;
    }

    removeCollection(args.name);
    console.log(`Removed: ${args.name}`);
  },
});

const renameCommand = defineCommand({
  meta: { name: "rename", description: "Rename a vault" },
  args: {
    oldName: {
      type: "positional",
      description: "current vault name",
      required: true,
    },
    newName: {
      type: "positional",
      description: "new vault name",
      required: true,
    },
  },
  run({ args }) {
    try {
      renameVault(args.oldName, args.newName);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        return;
      }
      throw error;
    }

    renameCollection(args.oldName, args.newName);
    console.log(`Renamed: ${args.oldName} -> ${args.newName}`);
  },
});

export const vault = defineCommand({
  meta: { name: "vault", description: "Manage vaults" },
  subCommands: { add: addCommand, list: listCommand, remove: removeCommand, rename: renameCommand },
});
