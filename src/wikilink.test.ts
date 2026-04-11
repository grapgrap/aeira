import { describe, expect, it } from "vitest";
import { parseWikiLinks } from "./wikilink";

describe("parseWikiLinks", () => {
  it("parses a basic wikilink", () => {
    expect(parseWikiLinks("[[target]]")).toEqual([{ target: "target" }]);
  });

  it("parses a wikilink with alias", () => {
    expect(parseWikiLinks("[[target|alias]]")).toEqual([{ target: "target", alias: "alias" }]);
  });

  it("returns multiple wikilinks in order of appearance", () => {
    expect(parseWikiLinks("[[a]] text [[b|c]] more [[d]]")).toEqual([
      { target: "a" },
      { target: "b", alias: "c" },
      { target: "d" },
    ]);
  });

  it("trims whitespace from target", () => {
    expect(parseWikiLinks("[[ target ]]")).toEqual([{ target: "target" }]);
  });

  it("trims whitespace from alias", () => {
    expect(parseWikiLinks("[[ target | alias ]]")).toEqual([{ target: "target", alias: "alias" }]);
  });

  it("ignores empty wikilinks", () => {
    expect(parseWikiLinks("[[]]")).toEqual([]);
  });

  it("ignores whitespace-only wikilinks", () => {
    expect(parseWikiLinks("[[ ]]")).toEqual([]);
  });

  describe("excluded patterns", () => {
    it("excludes embeds (![[...]])", () => {
      expect(parseWikiLinks("![[embed]]")).toEqual([]);
    });

    it("excludes section links ([[...#...]])", () => {
      expect(parseWikiLinks("[[target#heading]]")).toEqual([]);
    });

    it("excludes path links ([[.../...]])", () => {
      expect(parseWikiLinks("[[folder/note]]")).toEqual([]);
    });
  });

  describe("code region exclusion", () => {
    it("excludes wikilinks inside fenced code block (backtick)", () => {
      const text = "before\n```\n[[link]]\n```\nafter [[real]]";
      expect(parseWikiLinks(text)).toEqual([{ target: "real" }]);
    });

    it("excludes wikilinks inside fenced code block (tilde)", () => {
      const text = "before\n~~~\n[[link]]\n~~~\nafter [[real]]";
      expect(parseWikiLinks(text)).toEqual([{ target: "real" }]);
    });

    it("excludes wikilinks inside fenced code block with language", () => {
      const text = "```ts\n[[link]]\n```\n[[real]]";
      expect(parseWikiLinks(text)).toEqual([{ target: "real" }]);
    });

    it("excludes wikilinks inside inline code", () => {
      expect(parseWikiLinks("`[[link]]` and [[real]]")).toEqual([{ target: "real" }]);
    });

    it("excludes wikilinks inside double-backtick inline code", () => {
      expect(parseWikiLinks("``[[link]]`` and [[real]]")).toEqual([{ target: "real" }]);
    });

    it("excludes wikilinks inside indented code block", () => {
      const text = "text\n\n    [[link]]\n\n[[real]]";
      expect(parseWikiLinks(text)).toEqual([{ target: "real" }]);
    });
  });

  describe("other excluded regions", () => {
    it("excludes wikilinks inside HTML comments", () => {
      expect(parseWikiLinks("<!-- [[link]] --> [[real]]")).toEqual([{ target: "real" }]);
    });

    it("excludes wikilinks inside YAML frontmatter", () => {
      const text = "---\ntags: [[link]]\n---\n[[real]]";
      expect(parseWikiLinks(text)).toEqual([{ target: "real" }]);
    });
  });
});
