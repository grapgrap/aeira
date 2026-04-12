import { join } from "node:path";
import { homedir } from "node:os";
import { z } from "zod/v4";
import { pathRow } from "./types";

const DEFAULT_IR_CONFIG_DIR = join(homedir(), ".config", "ir");

export function getCollectionDbPath(
  collectionName: string,
  irConfigDir = DEFAULT_IR_CONFIG_DIR,
): string {
  return join(irConfigDir, "collections", `${collectionName}.sqlite`);
}

export function parsePaths(rows: unknown[]): string[] {
  return z
    .array(pathRow)
    .parse(rows)
    .map((row) => row.path);
}
