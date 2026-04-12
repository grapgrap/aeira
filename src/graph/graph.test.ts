import { describe, expect, it } from "vitest";
import { buildNameIndex } from "./graph";

describe("buildNameIndex", () => {
  it("maps file stem to full path", () => {
    const index = buildNameIndex(["notes/hello.md", "docs/world.md"]);
    expect(index.get("hello")).toBe("notes/hello.md");
    expect(index.get("world")).toBe("docs/world.md");
  });

  it("keeps first path when multiple files share the same stem", () => {
    const index = buildNameIndex(["folder1/note.md", "folder2/note.md"]);
    expect(index.get("note")).toBe("folder1/note.md");
  });

  it("strips .md extension for stem", () => {
    const index = buildNameIndex(["a.md"]);
    expect(index.has("a")).toBe(true);
    expect(index.has("a.md")).toBe(false);
  });

  it("returns empty map for empty input", () => {
    expect(buildNameIndex([]).size).toBe(0);
  });

  it("handles nested paths", () => {
    const index = buildNameIndex(["deep/nested/path/file.md"]);
    expect(index.get("file")).toBe("deep/nested/path/file.md");
  });
});
