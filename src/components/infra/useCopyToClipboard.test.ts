import { afterEach, describe, expect, it, vi } from "vitest";
import { writeClipboardText } from "./useCopyToClipboard";

describe("writeClipboardText", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true only after the clipboard write resolves", async () => {
    let resolveWrite!: () => void;
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = writeClipboardText("example");
    let settled = false;
    void result.then(() => {
      settled = true;
    });

    expect(writeText).toHaveBeenCalledWith("example");
    expect(settled).toBe(false);
    resolveWrite();
    await expect(result).resolves.toBe(true);
  });

  it("returns false when the clipboard write is rejected", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(writeClipboardText("example")).resolves.toBe(false);
  });

  it("returns false when the Clipboard API is unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await expect(writeClipboardText("example")).resolves.toBe(false);
  });
});
