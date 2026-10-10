import { describe, expect, it } from "vitest";

import { GET as indexMarkdownRoute } from "@/app/index.md/route";
import { GET as llmsTxtRoute } from "@/app/llms.txt/route";
import { GET as mip3MarkdownRoute } from "@/app/mip-3.md/route";
import { GET as mip7MarkdownRoute } from "@/app/mip-7.md/route";
import { GET as mip12MarkdownRoute } from "@/app/mip-12.md/route";
import { GET as mip15MarkdownRoute } from "@/app/mip-15.md/route";
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

  it("mip-12.md serves the corrected status, parameter facts, and source links", async () => {
    const res = await mip12MarkdownRoute();
    const body = await res.text();

    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(body).toContain("**Proposal status:** Final");
    expect(body).toContain("round 89,758,000");
    expect(body).toContain("5,000 | 3,750");
    expect(body).toContain("200,000,000 | 150,000,000");
    expect(body).toContain("2,000,000 bytes | 1,500,000 bytes");
    expect(body).toContain("25 MON | 18 MON | 28% lower");
    expect(body).toContain("62.5 to 60 MON per second");
    expect(body).toContain("2a7e18894f1e55fb043080cb8cef15c7f5647768");
    expect(body).toContain("releases#v0-15-1");
    expect(body).not.toContain("Draft (not live on mainnet)");
  });

  it("mip-7.md reports Review status and the trailing 0xAE rule", async () => {
    const body = await (await mip7MarkdownRoute()).text();

    expect(body).toContain("**Proposal status:** Review");
    expect(body).not.toContain("**Proposal status:** Draft");
    expect(body).toContain("at the very end of the code has no selector");
    expect(body).toContain("282d18125d6590447d9229550887581385649e48");
  });

  it("mip-15.md serves status, adopted EIPs, and the Monad access list rate", async () => {
    const body = await (await mip15MarkdownRoute()).text();

    expect(body).toContain("**Proposal status:** Review");
    expect(body).toContain("Not activated on any network");
    for (const eip of ["7708", "7843", "7981", "7997", "8024", "8246"]) {
      expect(body).toContain(`| EIP-${eip} |`);
    }
    expect(body).toContain("800 gas per address and 1,280 gas per storage key");
    expect(body).toContain("EIP-7928, Block-Level Access Lists");
    expect(body).toContain("282d18125d6590447d9229550887581385649e48");
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
