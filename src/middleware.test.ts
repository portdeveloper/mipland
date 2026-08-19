import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, middleware } from "@/middleware";
import { NEGOTIATED_ROUTES, prefersMarkdown } from "@/lib/mip-routes";

const ORIGIN = "https://mipland.example";

function request(path: string, accept?: string): NextRequest {
  return new NextRequest(new URL(path, ORIGIN), {
    headers: accept ? { accept } : undefined,
  });
}

describe("matcher parity", () => {
  it("matches every negotiated route and the admin gate", () => {
    for (const route of Object.keys(NEGOTIATED_ROUTES)) {
      expect(config.matcher).toContain(route);
    }
    expect(config.matcher).toContain("/admin/:path*");
  });
});

describe("prefersMarkdown", () => {
  it("honors an explicit text/markdown", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/html, text/markdown;q=0.9")).toBe(true);
  });

  it("ignores html-only or wildcard-only accepts", () => {
    expect(prefersMarkdown("text/html")).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
    expect(prefersMarkdown(null)).toBe(false);
  });

  it("respects q=0", () => {
    expect(prefersMarkdown("text/markdown;q=0")).toBe(false);
  });
});

describe("explainer negotiation", () => {
  it("rewrites to the .md route when markdown is requested", () => {
    const res = middleware(request("/mip-3", "text/markdown"));
    expect(res.headers.get("x-middleware-rewrite")).toBe(`${ORIGIN}/mip-3.md`);
    expect(res.headers.get("vary")).toBe("Accept");
  });

  it("keeps HTML default and advertises the alternate link", () => {
    const res = middleware(request("/mip-3", "text/html"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("link")).toBe(
      '</mip-3.md>; rel="alternate"; type="text/markdown"',
    );
    expect(res.headers.get("vary")).toBe("Accept");
  });
});

describe("homepage negotiation", () => {
  it("rewrites to the homepage markdown when requested", () => {
    const res = middleware(request("/", "text/markdown"));
    expect(res.headers.get("x-middleware-rewrite")).toBe(`${ORIGIN}/index.md`);
  });

  it("advertises llms.txt as describedby on the HTML response", () => {
    const res = middleware(request("/", "text/html"));
    expect(res.headers.get("link")).toBe('</llms.txt>; rel="describedby"');
    expect(res.headers.get("vary")).toBe("Accept");
  });
});

describe("admin gate is unchanged", () => {
  it("still challenges unauthenticated admin requests in production", () => {
    const prev = process.env.NODE_ENV;
    // NODE_ENV is read-only in the types; assign through the record.
    (process.env as Record<string, string>).NODE_ENV = "production";
    try {
      const res = middleware(request("/admin/chat"));
      expect(res.status).toBe(401);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = prev ?? "test";
    }
  });
});
