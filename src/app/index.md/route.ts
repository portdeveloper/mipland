import { buildHomeMarkdown } from "@/lib/mip-markdown";

// Markdown representation of the homepage. The middleware rewrites `/` here when
// a client sends Accept: text/markdown; browsers keep getting the HTML page.
export async function GET(req: Request): Promise<Response> {
  const body = await buildHomeMarkdown(new URL(req.url).origin);
  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
    },
  });
}
