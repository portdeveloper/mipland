// Route metadata shared by the middleware (Edge) and the Markdown route
// handlers (Node). No filesystem access here so it stays importable from the
// Edge runtime; the actual content lives in content/mips and is read in
// mip-markdown.ts.

// The MIP explainers that have a canonical Markdown source in content/mips and
// are therefore exposed as machine-readable routes. Single source of truth for
// the route mapping; keep it in sync with content/mips/mip-*.md.
export const MARKDOWN_MIP_SLUGS = [
  "mip-3",
  "mip-4",
  "mip-7",
  "mip-8",
  "mip-12",
] as const;

export type MipSlug = (typeof MARKDOWN_MIP_SLUGS)[number];

export const SITE_NAME = "MIP Land";
export const SITE_DESCRIPTION =
  "Interactive explainers for Monad Improvement Proposals";

export function isMipSlug(value: string): value is MipSlug {
  return (MARKDOWN_MIP_SLUGS as readonly string[]).includes(value);
}

/** Markdown route for a slug, e.g. "/mip-3.md". */
export function markdownRoute(slug: MipSlug): string {
  return `/${slug}.md`;
}

/** HTML explainer route for a slug, e.g. "/mip-3". */
export function explainerRoute(slug: MipSlug): string {
  return `/${slug}`;
}

// RFC 8288 links the negotiated HTML responses advertise.
export const LLMS_TXT_ROUTE = "/llms.txt";
export const HOME_MARKDOWN_ROUTE = "/index.md";

export function describedByLink(): string {
  return `<${LLMS_TXT_ROUTE}>; rel="describedby"`;
}

export function alternateMarkdownLink(slug: MipSlug): string {
  return `<${markdownRoute(slug)}>; rel="alternate"; type="text/markdown"`;
}

export interface NegotiatedRoute {
  /** Internal Markdown representation to rewrite to under Accept negotiation. */
  markdown: string;
  /** Link header advertised on the default HTML representation. */
  link: string;
}

// HTML routes that negotiate on Accept: the homepage plus the five explainers.
export const NEGOTIATED_ROUTES: Record<string, NegotiatedRoute> = {
  "/": { markdown: HOME_MARKDOWN_ROUTE, link: describedByLink() },
  ...Object.fromEntries(
    MARKDOWN_MIP_SLUGS.map((slug) => [
      explainerRoute(slug),
      { markdown: markdownRoute(slug), link: alternateMarkdownLink(slug) },
    ]),
  ),
};

/** True when the client explicitly lists text/markdown with a non-zero weight. */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  return accept.split(",").some((part) => {
    const tokens = part.trim().split(";");
    const type = tokens[0].trim().toLowerCase();
    if (type !== "text/markdown") return false;
    const q = tokens
      .slice(1)
      .map((t) => t.trim())
      .find((t) => t.startsWith("q="));
    return !q || Number.parseFloat(q.slice(2)) > 0;
  });
}
