export interface WikiLink {
  target: string;
  alias?: string;
}

export function parseWikiLinks(text: string): WikiLink[] {
  const cleaned = stripExcludedRegions(text);
  const pattern = /(?<!!)\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;
  const links: WikiLink[] = [];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(cleaned)) !== null) {
    const target = match[1].trim();
    const alias = match[2]?.trim();

    if (!target || target.includes("#") || target.includes("/")) continue;

    links.push(alias ? { target, alias } : { target });
  }

  return links;
}

function stripExcludedRegions(text: string): string {
  return (
    text
      // YAML frontmatter
      .replace(/^---\n[\s\S]*?\n---\n?/, "")
      // Fenced code blocks (backtick)
      .replace(/^(`{3,})[^\n]*\n[\s\S]*?\n\1\s*$/gm, "")
      // Fenced code blocks (tilde)
      .replace(/^(~{3,})[^\n]*\n[\s\S]*?\n\1\s*$/gm, "")
      // Indented code blocks (4 spaces or tab, preceded by blank line)
      .replace(/(\n\n)((?:(?:    |\t)[^\n]*(?:\n|$))+)/g, "$1")
      // HTML comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Inline code (double backtick first, then single)
      .replace(/``(.+?)``/g, "")
      .replace(/`([^`]+)`/g, "")
  );
}
