import { buildLlmsTxt } from "@/lib/mip-markdown";

export async function GET(req: Request): Promise<Response> {
  const body = await buildLlmsTxt(new URL(req.url).origin);
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
