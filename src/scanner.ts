import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export interface ScannedDocument {
  path: string;
  content: string;
}

export async function scanDocuments(sourcePath: string): Promise<ScannedDocument[]> {
  const entries = await readdir(sourcePath, { recursive: true });
  const mdFiles = entries.filter((entry) => entry.endsWith(".md"));

  return Promise.all(
    mdFiles.map(async (relativePath) => {
      const content = await readFile(join(sourcePath, relativePath), "utf-8");
      return { path: relativePath, content };
    }),
  );
}
