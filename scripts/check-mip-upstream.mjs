import { appendFile, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const REPO = "monad-crypto/MIPs";
const WEB = `https://github.com/${REPO}`;
const CONTENT_DIR = new URL("../content/mips/", import.meta.url);
const isSha = (value) => typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
const errorMessage = (error) => error instanceof Error && error.message
  ? error.message : "GitHub API check failed.";

export function validateManifest(manifest, coveredSlugs) {
  if (manifest?.version !== 1 || !Array.isArray(manifest.sources)) {
    throw new Error("Invalid upstream manifest: expected version 1 and sources.");
  }
  const slugs = [];
  for (const source of manifest.sources) {
    if (
      !source || typeof source.slug !== "string" ||
      !/^mip-[1-9]\d*$/.test(source.slug) ||
      source.path !== `MIPs/${source.slug.toUpperCase()}.md` ||
      !isSha(source.reviewedCommit) || !isSha(source.reviewedBlobSha)
    ) {
      throw new Error("Invalid upstream manifest: canonical paths and full commit/blob hashes are required.");
    }
    slugs.push(source.slug);
  }
  if (
    !Array.isArray(coveredSlugs) || coveredSlugs.length === 0 ||
    new Set(slugs).size !== slugs.length ||
    [...slugs].sort().join(",") !== [...coveredSlugs].sort().join(",")
  ) {
    throw new Error("Upstream manifest must cover every MIP Markdown source exactly once.");
  }
  return manifest.sources;
}

async function githubJson(path, { fetchImpl, token, timeoutMs }) {
  const controller = new AbortController();
  let timer;
  // Keep the deadline active through body decoding, not just response headers.
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`GitHub API request timed out after ${timeoutMs} ms.`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(`https://api.github.com/repos/${REPO}/${path}`, {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "mipland-upstream-check",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`GitHub API returned HTTP ${response.status}.`);
        }
        return await response.json();
      })(),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function checkUpstream(
  manifest,
  coveredSlugs,
  { fetchImpl = fetch, token, timeoutMs = 10_000 } = {},
) {
  try {
    const sources = validateManifest(manifest, coveredSlugs);
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error("The GitHub API timeout must be a positive number.");
    }
    const options = { fetchImpl, token, timeoutMs };
    const head = await githubJson("commits/main", options);
    if (!isSha(head?.sha)) {
      throw new Error("Malformed GitHub response: no upstream commit SHA.");
    }
    const currentCommit = head.sha;
    const results = await Promise.all(sources.map(async (source) => {
      try {
        const file = await githubJson(`contents/${source.path}?ref=${currentCommit}`, options);
        if (file?.type !== "file" || file.path !== source.path || !isSha(file.sha)) {
          throw new Error("Malformed GitHub response: expected the requested file and its blob SHA.");
        }
        return {
          ...source,
          currentBlobSha: file.sha,
          status: file.sha === source.reviewedBlobSha ? "unchanged" : "review",
        };
      } catch (error) {
        return { ...source, status: "error", error: errorMessage(error) };
      }
    }));
    const exitCode = results.some((r) => r.status === "error") ? 2
      : results.some((r) => r.status === "review") ? 1 : 0;
    return { currentCommit, results, exitCode };
  } catch (error) {
    return { results: [], exitCode: 2, error: errorMessage(error) };
  }
}

export function formatReport(report) {
  const verdict = ["Unchanged", "Review needed", "ERROR: source check incomplete"][report.exitCode];
  const lines = [`# MIP upstream check — ${verdict}`, ""];
  if (report.error) lines.push(report.error, "");
  if (report.currentCommit) {
    lines.push(`Current specification revision: [${report.currentCommit}](${WEB}/commit/${report.currentCommit})`, "");
  }
  if (report.results.length) {
    lines.push("| MIP | Result | Reviewed source | Current source |", "| --- | --- | --- | --- |");
    for (const result of report.results) {
      const baseline = `[${result.reviewedBlobSha.slice(0, 7)}](${WEB}/blob/${result.reviewedCommit}/${result.path})`;
      const current = report.currentCommit
        ? `[${result.currentBlobSha?.slice(0, 7) ?? "unavailable"}](${WEB}/blob/${report.currentCommit}/${result.path})`
        : "unavailable";
      const status = result.status === "error" ? `ERROR: ${(result.error || "GitHub API check failed.").replace(/[|\r\n]/g, " ")}`
        : result.status === "review" ? "Review needed" : "Unchanged";
      lines.push(`| ${result.slug.toUpperCase()} | ${status} | ${baseline} | ${current} |`);
    }
  }
  lines.push("", "Specification changes require human review. Matching specs do not establish network activation.", "");
  return lines.join("\n");
}

async function main() {
  let report;
  try {
    const manifest = JSON.parse(await readFile(new URL("upstream-sources.json", CONTENT_DIR), "utf8"));
    const coveredSlugs = (await readdir(CONTENT_DIR))
      .filter((name) => /^mip-\d+\.md$/.test(name))
      .map((name) => name.slice(0, -3));
    report = await checkUpstream(manifest, coveredSlugs, { token: process.env.GITHUB_TOKEN });
  } catch {
    report = { results: [], exitCode: 2, error: "Cannot read the upstream manifest or MIP Markdown sources." };
  }
  const summary = formatReport(report);
  console.log(summary);
  process.exitCode = report.exitCode;
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
    } catch {
      console.error("Cannot write the GitHub Actions job summary.");
      process.exitCode = 2;
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
