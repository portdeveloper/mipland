import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CONTENT_DIR = join(process.cwd(), "content", "mips");

describe("MIP knowledge sources", () => {
  it("gives every MIP a proposal status, a network status, a verified date and sources", async () => {
    const files = (await readdir(CONTENT_DIR)).filter((name) => /^mip-\d+\.md$/.test(name));
    expect(files.length).toBeGreaterThan(0);

    for (const name of files) {
      const body = await readFile(join(CONTENT_DIR, name), "utf8");
      expect(body, name).toMatch(/^\*\*Proposal status:\*\* (Draft|Review|Last Call|Final|Withdrawn)$/m);
      expect(body, name).toMatch(/^\*\*Network status:\*\* \S/m);
      expect(body, name).toMatch(/^\*\*Verified:\*\* [A-Z][a-z]+ \d{1,2}, \d{4}, against /m);
      expect(body, name).toMatch(/^## Sources$/m);
      // The canonical spec link is pinned to a commit, not a moving branch.
      expect(body, name).toMatch(/github\.com\/monad-crypto\/MIPs\/blob\/[0-9a-f]{40}\/MIPs\/MIP-\d+\.md/);
      expect(body, name).not.toContain("TODO(author)\n**Summary");
    }
  });
});
