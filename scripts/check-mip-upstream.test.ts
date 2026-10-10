import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import manifest from "../content/mips/upstream-sources.json";
import { MARKDOWN_MIP_SLUGS } from "../src/lib/mip-routes";
import { checkUpstream, formatReport, validateManifest } from "./check-mip-upstream.mjs";

const HEAD = "0123456789abcdef0123456789abcdef01234567";
type Source = (typeof manifest.sources)[number];
const contents = (source: Source, sha = source.reviewedBlobSha) =>
  Response.json({ type: "file", path: source.path, sha });

function sourceFetch(
  respond: (source: Source, init?: RequestInit) => Response | Promise<Response> = (source) => contents(source),
) {
  return vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/commits/main")) return Response.json({ sha: HEAD });
    const source = manifest.sources.find((entry) => url.pathname.endsWith(`/contents/${entry.path}`));
    if (!source) throw new Error(`Unexpected fixture request: ${url.pathname}`);
    expect(url.searchParams.get("ref")).toBe(HEAD);
    return respond(source, init);
  });
}

const check = (fetchImpl: typeof fetch) =>
  checkUpstream(manifest, [...MARKDOWN_MIP_SLUGS], { fetchImpl });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("reviewed manifest", () => {
  it("covers the route list and actual Markdown files exactly once", () => {
    const files = readdirSync(new URL("../content/mips/", import.meta.url))
      .filter((name) => /^mip-\d+\.md$/.test(name)).map((name) => name.slice(0, -3));
    expect(files.sort()).toEqual([...MARKDOWN_MIP_SLUGS].sort());
    expect(validateManifest(manifest, [...MARKDOWN_MIP_SLUGS])).toEqual(manifest.sources);
  });

  it.each(["missing", "extra", "duplicate", "path", "commit", "blob", "version"])(
    "rejects a %s manifest defect before fetching", async (defect) => {
      const invalid = structuredClone(manifest);
      if (defect === "missing") invalid.sources.pop();
      if (defect === "extra") invalid.sources.push({ ...invalid.sources[0], slug: "mip-99", path: "MIPs/MIP-99.md" });
      if (defect === "duplicate") invalid.sources.push(invalid.sources[0]);
      if (defect === "path") invalid.sources[0].path = "MIPs/MIP-12.md";
      if (defect === "commit") invalid.sources[0].reviewedCommit = "short";
      if (defect === "blob") invalid.sources[0].reviewedBlobSha = "invalid";
      if (defect === "version") invalid.version = 2;
      const fetchImpl = sourceFetch();
      const report = await checkUpstream(invalid, [...MARKDOWN_MIP_SLUGS], { fetchImpl });
      expect(report.exitCode).toBe(2);
      expect(report.error).toBeTruthy();
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );
});

describe("upstream source changes", () => {
  it("accepts matching content even when the repository commit changes", async () => {
    const original = structuredClone(manifest);
    const fetchImpl = sourceFetch();
    const report = await check(fetchImpl);
    expect(report.exitCode).toBe(0);
    expect(report.currentCommit).toBe(HEAD);
    expect(report.results.map((result: { status: string }) => result.status)).toEqual(Array(manifest.sources.length).fill("unchanged"));
    expect(fetchImpl).toHaveBeenCalledTimes(manifest.sources.length + 1);
    expect(manifest).toEqual(original);
  });

  it("detects the real MIP-12 Draft-to-Final edit from offline content fixtures", async () => {
    // Exact CC0 sources: monad-crypto/MIPs/MIPs/MIP-12.md at d2fe40811999387de9ac371692198bb8f72c10fb
    // and 2a7e18894f1e55fb043080cb8cef15c7f5647768; only the status line changed.
    const draft = readFileSync(new URL("./fixtures/mip-12-draft.md", import.meta.url));
    const final = readFileSync(new URL("./fixtures/mip-12-final.md", import.meta.url));
    const blobSha = (body: Buffer) => createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex");
    expect(draft.toString().replace("status: Draft", "status: Final")).toBe(final.toString());
    const source = manifest.sources.find((entry) => entry.slug === "mip-12")!;
    expect(blobSha(draft)).toBe(source.reviewedBlobSha);
    expect(blobSha(final)).toBe("114c7e0a3c48b2e964a3d89e48e57bc9060127f8");
    const report = await check(sourceFetch((entry) => contents(entry, entry.slug === "mip-12" ? blobSha(final) : entry.reviewedBlobSha)));
    expect(report.exitCode).toBe(1);
    expect(report.results.find((entry: Source) => entry.slug === "mip-12")).toMatchObject({ status: "review", currentBlobSha: blobSha(final) });
    expect(formatReport(report)).toContain("MIP-12 | Review needed");
  });

  it("errors dominate drift while still reporting every checked file", async () => {
    const report = await check(sourceFetch((source) => {
      if (source.slug === "mip-3") return contents(source, "f".repeat(40));
      if (source.slug === "mip-4") return new Response(null, { status: 404 });
      return contents(source);
    }));
    expect(report.exitCode).toBe(2);
    expect(report.results.map((result: { status: string }) => result.status)).toEqual([
      "review",
      "error",
      ...Array(manifest.sources.length - 2).fill("unchanged"),
    ]);
    const summary = formatReport(report);
    expect(summary).toContain("MIP-3 | Review needed");
    expect(summary).toContain("MIP-4 | ERROR:");
  });

  it("uses immutable commit links for reviewed and current sources", async () => {
    const report = await check(sourceFetch((source) => contents(source, "f".repeat(40))));
    const summary = formatReport(report);
    for (const source of manifest.sources) {
      expect(summary).toContain(`/blob/${source.reviewedCommit}/${source.path}`);
      expect(summary).toContain(`/blob/${HEAD}/${source.path}`);
      expect(summary).not.toContain(`/blob/${source.reviewedBlobSha}/`);
    }
    expect(summary).not.toContain("/blob/main/");
    expect(summary).toContain("Matching specs do not establish network activation.");
  });
});

describe("upstream failures", () => {
  it.each([404, 403, 500])("reports HTTP %s as an error, including a removed file", async (status) => {
    const report = await check(sourceFetch((source) => source.slug === "mip-12" ? new Response(null, { status }) : contents(source)));
    expect(report.exitCode).toBe(2);
    expect(report.results.find((source: Source) => source.slug === "mip-12")).toMatchObject({ status: "error", error: `GitHub API returned HTTP ${status}.` });
  });

  it.each([new Error("network unavailable"), new Error(""), "network failure"])(
    "reports fetch rejection as ERROR, including empty and non-Error failures", async (failure) => {
      const report = await check(sourceFetch((source) => {
        if (source.slug === "mip-12") throw failure;
        return contents(source);
      }));
      expect(report.exitCode).toBe(2);
      expect(report.results.find((source: Source) => source.slug === "mip-12")).toMatchObject({ status: "error" });
      expect(formatReport(report)).toContain("MIP-12 | ERROR:");
    },
  );

  it.each([null, {}, { sha: "short" }, { sha: "G".repeat(40) }])("refuses malformed HEAD data %j", async (body) => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(body));
    const report = await check(fetchImpl);
    expect(report).toMatchObject({ exitCode: 2, results: [] });
    expect(report.error).toContain("upstream commit SHA");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    null, [], {},
    { type: "dir", path: "MIPs/MIP-12.md", sha: HEAD },
    { type: "file", path: "MIPs/MIP-3.md", sha: HEAD },
    { type: "file", path: "MIPs/MIP-12.md", sha: "short" },
  ])("refuses malformed Contents data %j", async (body) => {
    const report = await check(sourceFetch((source) => source.slug === "mip-12" ? Response.json(body) : contents(source)));
    expect(report.exitCode).toBe(2);
    expect(report.results.find((source: Source) => source.slug === "mip-12")).toMatchObject({ status: "error" });
  });

  it.each(["HEAD", "Contents"])("rejects malformed JSON from %s", async (stage) => {
    const broken = () => new Response("{invalid JSON", { headers: { "content-type": "application/json" } });
    const fetchImpl = stage === "HEAD" ? vi.fn<typeof fetch>(async () => broken()) : sourceFetch(() => broken());
    const report = await check(fetchImpl);
    expect(report.exitCode).toBe(2);
    if (stage === "HEAD") expect(report.error).toBeTruthy();
    else expect(report.results.every((result: { status: string }) => result.status === "error")).toBe(true);
  });

  it.each(["headers", "body"])("bounds the %s deadline and aborts the request", async (stage) => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const remember = (init?: RequestInit) => signals.push(init!.signal!);
    const fetchImpl = stage === "headers"
      ? vi.fn<typeof fetch>(async (_input, init) => { remember(init); return new Promise<Response>(() => {}); })
      : sourceFetch((_source, init) => {
        remember(init);
        const response = Response.json({});
        vi.spyOn(response, "json").mockImplementation(() => new Promise(() => {}));
        return response;
      });
    const pending = checkUpstream(manifest, [...MARKDOWN_MIP_SLUGS], { fetchImpl, timeoutMs: 20 });
    await vi.advanceTimersByTimeAsync(20);
    const report = await pending;
    expect(report.exitCode).toBe(2);
    expect(signals).toHaveLength(stage === "headers" ? 1 : manifest.sources.length);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(formatReport(report)).toContain("timed out after 20 ms");
  });
});
