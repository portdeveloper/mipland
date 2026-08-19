import { describe, expect, it } from "vitest";

import { GET as indexMarkdownRoute } from "@/app/index.md/route";
import { GET as llmsTxtRoute } from "@/app/llms.txt/route";
import { GET as mip3MarkdownRoute } from "@/app/mip-3.md/route";
import {
  buildHomeMarkdown,
  buildLlmsTxt,
  markdownRouteResponse,
  readMipSource,
  titleOf,
} from "@/lib/mip-markdown";
import { isMipSlug, MARKDOWN_MIP_SLUGS } from "@/lib/mip-routes";

const ORIGIN = "https://mipland.example";

describe("route mapping", () => {
  it("every listed slug has a readable, non-empty source", async () => {
    for (const slug of MARKDOWN_MIP_SLUGS) {
      const source = await readMipSource(slug);
      expect(source.trim().length).toBeGreaterThan(0);
    }
  });

  it("serves each source as text/markdown unchanged", async () => {
    for (const slug of MARKDOWN_MIP_SLUGS) {
      const res = await markdownRouteResponse(slug);
      expect(res.headers.get("content-type")).toBe(
        "text/markdown; charset=utf-8",
      );
      expect(await res.text()).toBe(await readMipSource(slug));
    }
  });
});

describe(".md route handlers", () => {
  it("mip-3.md returns its source as text/markdown", async () => {
    const res = await mip3MarkdownRoute();
    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(await res.text()).toBe(await readMipSource("mip-3"));
  });
});

describe("llms.txt", () => {
  it("is served as text/plain", async () => {
    const res = await llmsTxtRoute(new Request(`${ORIGIN}/llms.txt`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
  });

  it("lists a canonical link for every markdown route and nothing bogus", async () => {
    const body = await buildLlmsTxt(ORIGIN);
    const links = [...body.matchAll(/\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
    expect(links).toHaveLength(MARKDOWN_MIP_SLUGS.length);

    for (const link of links) {
      const url = new URL(link);
      expect(url.origin).toBe(ORIGIN);
      expect(url.pathname.endsWith(".md")).toBe(true);
      const slug = url.pathname.slice(1, -".md".length);
      expect(isMipSlug(slug)).toBe(true);
    }
  });
});

describe("home markdown", () => {
  it("is served as text/markdown with Vary: Accept", async () => {
    const res = await indexMarkdownRoute(new Request(ORIGIN + "/"));
    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(res.headers.get("vary")).toBe("Accept");
  });

  it("links every explainer's markdown route", async () => {
    const body = await buildHomeMarkdown(ORIGIN);
    for (const slug of MARKDOWN_MIP_SLUGS) {
      expect(body).toContain(`${ORIGIN}/${slug}.md`);
    }
  });
});

describe("titleOf", () => {
  it("uses the first-level heading", () => {
    expect(titleOf("# MIP-3: Linear Memory\n\nbody", "x")).toBe(
      "MIP-3: Linear Memory",
    );
  });

  it("falls back when there is no heading", () => {
    expect(titleOf("no heading here", "MIP-3")).toBe("MIP-3");
  });
});
