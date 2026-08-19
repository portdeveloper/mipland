import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  MARKDOWN_MIP_SLUGS,
  markdownRoute,
  SITE_DESCRIPTION,
  SITE_NAME,
  type MipSlug,
} from "@/lib/mip-routes";

const CONTENT_DIR = join(process.cwd(), "content", "mips");

/** Raw Markdown source for a slug, straight from content/mips. */
export async function readMipSource(slug: MipSlug): Promise<string> {
  return readFile(join(CONTENT_DIR, `${slug}.md`), "utf8");
}

/** First-level heading of a Markdown body, used as human-readable link text. */
export function titleOf(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1] : fallback;
}

interface IndexEntry {
  title: string;
  route: string;
}

async function indexEntries(): Promise<IndexEntry[]> {
  return Promise.all(
    MARKDOWN_MIP_SLUGS.map(async (slug) => {
      const source = await readMipSource(slug);
      return { title: titleOf(source, slug.toUpperCase()), route: markdownRoute(slug) };
    }),
  );
}

function renderLinks(entries: IndexEntry[], origin: string): string {
  return entries.map((e) => `- [${e.title}](${origin}${e.route})`).join("\n");
}

/**
 * llms.txt index. Served as text/plain but Markdown-formatted per the
 * llms.txt convention; links are canonical (absolute) URLs to the .md routes.
 */
export async function buildLlmsTxt(origin: string): Promise<string> {
  const entries = await indexEntries();
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## MIP explainers",
    "",
    renderLinks(entries, origin),
    "",
  ].join("\n");
}

/** Homepage Markdown representation served for `/` under Accept negotiation. */
export async function buildHomeMarkdown(origin: string): Promise<string> {
  const entries = await indexEntries();
  return [
    `# ${SITE_NAME}`,
    "",
    `${SITE_DESCRIPTION}.`,
    "",
    "## MIP explainers",
    "",
    renderLinks(entries, origin),
    "",
  ].join("\n");
}

/** Response for a slug's .md route: the raw source as text/markdown. */
export async function markdownRouteResponse(slug: MipSlug): Promise<Response> {
  const body = await readMipSource(slug);
  return new Response(body, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
