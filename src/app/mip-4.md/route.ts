import { markdownRouteResponse } from "@/lib/mip-markdown";

export function GET(): Promise<Response> {
  return markdownRouteResponse("mip-4");
}
