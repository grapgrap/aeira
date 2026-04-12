import { execFileSync } from "node:child_process";

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export function updateCollection(collection: string): void {
  try {
    execFileSync("ir", ["update", collection], { stdio: "inherit" });
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error("ir이 설치되어 있지 않습니다. brew install vlwkaos/tap/ir로 설치하세요.");
    }
    throw error;
  }
}

export function initCollection(collection: string, sourcePath: string): void {
  try {
    execFileSync("ir", ["collection", "add", collection, sourcePath], { stdio: "inherit" });
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error("ir이 설치되어 있지 않습니다. brew install vlwkaos/tap/ir로 설치하세요.");
    }
    throw error;
  }
  updateCollection(collection);
}
