import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mip-index", () => ({
  getMipIndex: async () => ({
    source: "snapshot",
    entries: [
      { kind: "MIP", number: 9, title: "Active Set Increase", status: "Withdrawn", specUrl: "https://mips.monad.xyz/MIPs/MIP-9" },
      { kind: "MRC", number: 13, title: "Validator Metadata Registry", status: "Final", specUrl: "https://mips.monad.xyz/MRCs/MRC-13" },
    ],
  }),
}));

import { GET as indexMarkdownRoute } from "@/app/index.md/route";
import { GET as llmsTxtRoute } from "@/app/llms.txt/route";
import { GET as mip3MarkdownRoute } from "@/app/mip-3.md/route";
import { GET as mip4MarkdownRoute } from "@/app/mip-4.md/route";
import { GET as mip7MarkdownRoute } from "@/app/mip-7.md/route";
import { GET as mip10MarkdownRoute } from "@/app/mip-10.md/route";
import { GET as mip12MarkdownRoute } from "@/app/mip-12.md/route";
import { GET as mip11MarkdownRoute } from "@/app/mip-11.md/route";
import { GET as mip15MarkdownRoute } from "@/app/mip-15.md/route";
import { GET as mip16MarkdownRoute } from "@/app/mip-16.md/route";
import { GET as mip18MarkdownRoute } from "@/app/mip-18.md/route";
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
  it("mip-3.md serves the reviewed status, linear cost facts, and source links", async () => {
    const res = await mip3MarkdownRoute();
    const body = await res.text();

    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(body).toBe(await readMipSource("mip-3"));
    expect(body).toContain("**Proposal status:** Final");
    expect(body).toContain("8 MB per transaction, shared across call frames");
    expect(body).toContain("memory_cost = memory_size_words // 2");
    expect(body.replace(/\s+/g, " ")).toContain(
      "halts exceptionally and consumes all gas left in that call frame",
    );
    expect(body).toContain("282d18125d6590447d9229550887581385649e48");
    expect(body).not.toContain("TODO(author)");
  });

  it("mip-4.md serves the reviewed status, CALL-only precompile facts, and source links", async () => {
    const res = await mip4MarkdownRoute();
    const body = await res.text();

    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(body).toBe(await readMipSource("mip-4"));
    expect(body).toContain("**Proposal status:** Final");
    expect(body).toContain("`0x1001`");
    expect(body).toContain("It must be called with `CALL`");
    expect(body).toContain("0x3a61584e");
    expect(body).toContain("method not supported");
    expect(body).toContain("input is invalid");
    expect(body).toContain("value is nonzero");
    expect(body).toContain(
      "Every revert consumes all gas given to the call frame",
    );
    expect(body).toContain("282d18125d6590447d9229550887581385649e48");
    expect(body).not.toContain("TODO(author)");
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

  it("mip-11.md serves Draft status, the distribution account, and both minimums", async () => {
    const body = await (await mip11MarkdownRoute()).text();

    expect(body).toContain("**Proposal status:** Draft");
    expect(body).toContain("Not activated on any network");
    expect(body).toContain("0xfee5fee5fee5fee5fee5fee5fee5fee5fee5fee5");
    expect(body).toContain("1 gwei (1e9 wei)");
    expect(body).toContain("197 of 200 blocks had less than 1 MON");
    expect(body).toContain("282d18125d6590447d9229550887581385649e48");
  });

  it("mip-10.md serves status, rollout stage, and the assignment seed", async () => {
    const body = await (await mip10MarkdownRoute()).text();

    expect(body).toContain("**Proposal status:** Draft");
    expect(body).toContain("stage 3 of the spec's four-stage rollout");
    expect(body).toContain("LE64(floor(unix_ts_ms / 2048))");
    expect(body).toContain("5abe8ccd319828dfc999877f14af93012ee75f6f");
  });

  it("mip-16.md serves status, the pagination rule, and the pinned spec", async () => {
    const body = await (await mip16MarkdownRoute()).text();

    expect(body).toContain("**Proposal status:** Draft");
    expect(body).toContain("`cursorBlock + 1` in `asc`");
    expect(body).toContain("-32005");
    expect(body).toContain("5abe8ccd319828dfc999877f14af93012ee75f6f");
  });

  it("mip-18.md serves status, both selectors, and the authorization warning", async () => {
    const body = await (await mip18MarkdownRoute()).text();

    expect(body).toContain("**Proposal status:** Review");
    expect(body).toContain("Not activated on any network");
    expect(body).toContain("| `0xAE 0x00` | `CALLSTACKDEPTH` |");
    expect(body).toContain("| `0xAE 0x01` | `CALLERN` |");
    expect(body).toContain("SHOULD NOT use `CALLERN(n)` with `n > 0` for authorization");
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

  it("lists every upstream proposal with its status", async () => {
    const body = await buildHomeMarkdown(ORIGIN);
    expect(body).toContain("## All proposals");
    expect(body).toContain("- [MIP-9: Active Set Increase](https://mips.monad.xyz/MIPs/MIP-9) (Withdrawn)");
    expect(body).toContain("- [MRC-13: Validator Metadata Registry](https://mips.monad.xyz/MRCs/MRC-13) (Final)");
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
