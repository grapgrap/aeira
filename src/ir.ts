import { execFileSync } from "node:child_process";
import { z } from "zod/v4";

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

const searchResultRow = z.object({
  path: z.string(),
  title: z.string(),
  score: z.number(),
  snippet: z.string().nullable().optional(),
});

export interface SearchResult {
  path: string;
  title: string;
  score: number;
  snippet?: string | null;
}

export function searchCollection(collection: string, query: string): SearchResult[] {
  try {
    const output = execFileSync("ir", ["search", query, "-c", collection, "--json"], {
      encoding: "utf-8",
    });
    return z.array(searchResultRow).parse(JSON.parse(output));
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error("ir이 설치되어 있지 않습니다. brew install vlwkaos/tap/ir로 설치하세요.", {
        cause: error,
      });
    }
    throw error;
  }
}

export function updateCollection(collection: string): void {
  try {
    execFileSync("ir", ["update", collection], { stdio: "inherit" });
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error("ir이 설치되어 있지 않습니다. brew install vlwkaos/tap/ir로 설치하세요.", {
        cause: error,
      });
    }
    throw error;
  }
}

export function initCollection(collection: string, sourcePath: string): void {
  try {
    execFileSync("ir", ["collection", "add", collection, sourcePath], { stdio: "inherit" });
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error("ir이 설치되어 있지 않습니다. brew install vlwkaos/tap/ir로 설치하세요.", {
        cause: error,
      });
    }
    throw error;
  }
  updateCollection(collection);
}
