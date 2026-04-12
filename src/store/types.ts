import { z } from "zod/v4";

export const hashRow = z.object({ hash: z.string() });
export const edgeRow = z.object({ source_path: z.string(), target_path: z.string() });
export const documentContentRow = z.object({
  path: z.string(),
  content: z.string(),
  hash: z.string(),
});
export const pathRow = z.object({ path: z.string() });

export interface DocumentChanges {
  added: string[];
  changed: string[];
  removed: string[];
}

export interface DocumentContent {
  path: string;
  content: string;
  hash: string;
}

export interface SyncEntry {
  sourcePath: string;
  targetPaths: string[];
  hash: string;
}
