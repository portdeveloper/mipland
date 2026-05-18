import "server-only";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const CONTENT_DIR = join(process.cwd(), "content", "mips");

let cached: Promise<string> | null = null;

async function loadFromDisk(): Promise<string> {
  const entries = await readdir(CONTENT_DIR);
  const markdown = entries
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => {
      // _overview sorts first so the model sees framing before specifics.
      if (a.startsWith("_") && !b.startsWith("_")) return -1;
      if (b.startsWith("_") && !a.startsWith("_")) return 1;
      return a.localeCompare(b);
    });

  const sections = await Promise.all(
    markdown.map(async (name) => {
      const body = await readFile(join(CONTENT_DIR, name), "utf8");
      return `<!-- file: ${name} -->\n${body.trim()}`;
    }),
  );

  return sections.join("\n\n---\n\n");
}

export function getKnowledgeBundle(): Promise<string> {
  cached ??= loadFromDisk();
  return cached;
}
